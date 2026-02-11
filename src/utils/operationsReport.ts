import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AMOperationsSubmission } from '../../services/dataService';
import { OPERATIONS_QUESTIONS } from '../../constants';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

interface ReportOptions {
  title?: string;
  logoDataUrl?: string | null;
}

// Minimal NA check reused from trainingReport
function isNA(v: any) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  return s === 'na' || s === 'n/a' || s === 'not applicable' || /^n\s*\/?\s*a$/.test(s);
}

async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else reject(new Error('Could not get canvas context'));
      } catch (err) { reject(err); }
    };
    img.onerror = () => { clearTimeout(timeout); reject(new Error(`Failed to load image: ${url}`)); };
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    img.src = fullUrl;
  });
}

async function addCompanyLogo(doc: jsPDF): Promise<void> {
  // smaller fallback logo area
  const areaX = 162, areaY = 8, areaW = 28, areaH = 28, innerPadding = 4;
  const logoPaths = [`/assets/logo.png`, `/assets/logo.svg`, `${window.location.origin}/assets/logo.png`, '/prism-logo.png'];
  for (const p of logoPaths) {
    try {
      const data = await loadImage(p);
      const imgEl = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = data;
      });
      const naturalW = imgEl.naturalWidth || imgEl.width || areaW;
      const naturalH = imgEl.naturalHeight || imgEl.height || areaH;
      const usableW = Math.max(4, areaW - innerPadding * 2);
      const usableH = Math.max(4, areaH - innerPadding * 2);
      const ratio = Math.min(1, usableW / naturalW, usableH / naturalH);
      const drawW = Math.round(naturalW * ratio);
      const drawH = Math.round(naturalH * ratio);
      const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2);
      const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2);
      doc.addImage(data, 'PNG', drawX, drawY, drawW, drawH);
      return;
    } catch (e) {
      // try next
    }
  }
  // text fallback
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(160, 8, 34, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('PRISM', 177, 22, { align: 'center' });
}

const SECTION_TITLES: Record<string, string> = {
  'CG': 'Section 1: Cheerful Greeting',
  'OTA': 'Section 2: Order Taking Assistance',
  'FAS': 'Section 3: Friendly & Accurate Service',
  'FWS': 'Section 4: Feedback with Solution',
  'ENJ': 'Section 5: Enjoyable Experience',
  'EX': 'Section 6: Enthusiastic Exit'
};

// Compute overall for operations using OPERATIONS_QUESTIONS
function computeOverall(submission: any): { total: number; max: number; pct: number } {
  // Try to use pre-calculated scores first
  if (submission.totalScore !== undefined && submission.maxScore !== undefined && submission.totalScore !== 'Avg') {
    const t = Number(submission.totalScore) || 0;
    const m = Number(submission.maxScore) || 0;
    
    // Extract numeric part of percentage if it's a string like "36.5%"
    let rawPct = submission.percentageScore || submission.percentage || '0';
    if (typeof rawPct === 'string') rawPct = rawPct.replace('%', '');
    const p = Math.round(Number(rawPct)) || (m > 0 ? Math.round((t / m) * 100) : 0);
    
    return { total: t, max: m, pct: p };
  }

  let total = 0; let max = 0;
  for (const q of OPERATIONS_QUESTIONS) {
    // Check both ID formats: "OTA_1" AND "OTA_101"
    const prefix = q.id.split('_')[0];
    const num = q.id.split('_')[1];
    const offset = { 'CG': 0, 'OTA': 100, 'FAS': 200, 'FWS': 300, 'ENJ': 400, 'EX': 500 }[prefix] || 0;
    const mappedId = num ? `${prefix}_${parseInt(num) + offset}` : q.id;
    
    const ans = submission[q.id] || submission[mappedId] || submission[q.id.replace('_', '')] || '';
    
    if (isNA(ans)) continue;
    const qMax = (q.choices && q.choices.length) ? Math.max(...q.choices.map((c: any) => Number(c.score) || 0)) : 1;
    let numeric = 0;
    if (ans !== undefined && ans !== null && ans !== '') {
      const low = String(ans).toLowerCase();
      if (low === 'yes' || low === 'y' || low === 'true' || low === '1') numeric = 1;
      else if (low === 'no' || low === 'n' || low === 'false' || low === '0') numeric = 0;
      
      if (q.choices && q.choices.length) {
        const found = q.choices.find((c: any) => String(c.label).toLowerCase() === low);
        if (found) numeric = Number(found.score) || numeric;
      }
    }
    total += numeric; max += qMax;
  }
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return { total, max, pct };
}

export const buildOperationsPDF = async (submissions: AMOperationsSubmission[], metadata: any = {}, options: ReportOptions = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;
  const first = submissions[0] || {} as any;
  const title = options.title || 'AM Operations Checklist Report';

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(title, 14, y);

  try {
    const areaX = 162, areaY = 8, areaW = 28, areaH = 28, innerPadding = 4;
    if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = EMBEDDED_LOGO; });
      const naturalW = imgEl.naturalWidth || imgEl.width || areaW;
      const naturalH = imgEl.naturalHeight || imgEl.height || areaH;
      const usableW = Math.max(4, areaW - innerPadding * 2);
      const usableH = Math.max(4, areaH - innerPadding * 2);
      const ratio = Math.min(1, usableW / naturalW, usableH / naturalH);
      const drawW = Math.round(naturalW * ratio);
      const drawH = Math.round(naturalH * ratio);
      const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2);
      const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2);
      doc.addImage(EMBEDDED_LOGO, 'PNG', drawX, drawY, drawW, drawH);
    } else {
      try {
        const img = await loadImage(`/assets/logo.png`);
        const el = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = img; });
        const naturalW = el.naturalWidth || el.width || areaW;
        const naturalH = el.naturalHeight || el.height || areaH;
        const usableW = Math.max(4, areaW - innerPadding * 2);
        const usableH = Math.max(4, areaH - innerPadding * 2);
        const ratio = Math.min(1, usableW / naturalW, usableH / naturalH);
        const drawW = Math.round(naturalW * ratio);
        const drawH = Math.round(naturalH * ratio);
        const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2);
        const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2);
        doc.addImage(img, 'PNG', drawX, drawY, drawW, drawH);
      } catch (e) {
        // Fallback: ignore logo if it fails to load
      }
    }
  } catch (e) {
    // Ignore logo errors
  }

  y += 4;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  const storeName = metadata.storeName || first.storeName || first.store_name || first.Store || '';
  if (storeName) doc.text(storeName, 14, y + 2);

  const metaY = y + 8;
  const dateStr = metadata.date || first.submissionTime || first.date || first.Date || '';
  const auditor = metadata.auditorName || first.trainerName || first.auditor || first.Auditor || '';
  const sid = metadata.storeId || first.storeId || first.store_id || first.StoreID || '';
  const metaLine = [] as string[];
  if (dateStr) metaLine.push(`${dateStr}`);
  if (auditor) metaLine.push(`Auditor: ${auditor}`);
  if (sid) metaLine.push(`Store ID: ${sid}`);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 130, 145);
  if (metaLine.length) doc.text(metaLine.join('   |   '), 14, metaY);
  y = metaY + 12;

  const computed = computeOverall(first);
  const total = computed.total; const max = computed.max; const pct = computed.pct;

  const cardHeight = 42; const leftX = 14; const rightX = 110;
  doc.setFillColor(243, 244, 246); doc.setDrawColor(209, 213, 219); doc.roundedRect(leftX, y, 90, cardHeight, 4, 4, 'FD'); doc.setFontSize(10); doc.setTextColor(75, 85, 99); doc.setFont('helvetica', 'bold'); doc.text('Overall Score', leftX + 8, y + 10); doc.setFontSize(22); doc.setTextColor(17, 24, 39); doc.setFont('helvetica', 'bold'); doc.text(`${total} / ${max}`, leftX + 8, y + 28);
  
  doc.setFillColor(243, 244, 246); doc.setDrawColor(209, 213, 219); doc.roundedRect(rightX, y, 84, cardHeight, 4, 4, 'FD'); doc.setFontSize(10); doc.setTextColor(75, 85, 99); doc.setFont('helvetica', 'bold'); doc.text('Percentage', rightX + 8, y + 10); doc.setFontSize(22); doc.setFont('helvetica', 'bold'); const pctColor = pct >= 80 ? [16, 185, 129] : pct >= 60 ? [245, 158, 11] : [239, 68, 68]; doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]); doc.text(`${pct}%`, rightX + 8, y + 28); const barX = rightX + 8; const barY = y + 34; const barWidth = 84 - 16; const barHeight = 4; doc.setFillColor(229, 231, 235); doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F'); doc.setFillColor(pctColor[0], pctColor[1], pctColor[2]); doc.roundedRect(barX, barY, Math.max(4, Math.min(barWidth, Math.round((pct / 100) * barWidth))), barHeight, 2, 2, 'F');
  y += cardHeight + 15;

  // Sections from OPERATIONS_QUESTIONS: group by prefix before underscore
  const sections: Record<string, { title: string; rows: any[]; score: number; maxScore: number; remarks?: string }> = {};
  
  // Initialize sections in fixed order
  ['CG', 'OTA', 'FAS', 'FWS', 'ENJ', 'EX'].forEach(key => {
    sections[key] = { title: SECTION_TITLES[key] || key, rows: [], score: 0, maxScore: 0 };
  });

  const sub = first as any;
  for (const q of OPERATIONS_QUESTIONS) {
    const prefix = q.id.split('_')[0];
    const num = q.id.split('_')[1];
    const offset = { 'CG': 0, 'OTA': 100, 'FAS': 200, 'FWS': 300, 'ENJ': 400, 'EX': 500 }[prefix] || 0;
    const mappedId = num ? `${prefix}_${parseInt(num) + offset}` : q.id;
    
    const ans = sub[q.id] || sub[mappedId] || sub[q.id.replace('_', '')];
    const qMax = q.choices && q.choices.length ? Math.max(...q.choices.map((c: any) => Number(c.score) || 0)) : 1;
    let numeric = 0;
    if (ans !== undefined && ans !== null && ans !== '' && !isNA(ans)) {
      const low = String(ans).toLowerCase();
      if (low === 'yes' || low === 'y' || low === 'true' || low === '1') numeric = 1;
      else if (low === 'no' || low === 'n' || low === 'false' || low === '0') numeric = 0;
      
      if (q.choices && q.choices.length) {
        const found = q.choices.find((c: any) => String(c.label).toLowerCase() === low);
        if (found) numeric = Number(found.score) || numeric;
      }
    }
    const secKey = q.id.includes('_') ? q.id.split('_')[0] : 'Misc';
    if (!sections[secKey]) sections[secKey] = { title: secKey, rows: [], score: 0, maxScore: 0 };
    
    sections[secKey].rows.push({ 
      id: q.id, 
      question: q.title || q.id, 
      answer: isNA(ans) ? 'NA' : (ans || '-'), 
      score: numeric, 
      maxScore: qMax 
    });
    
    if (!isNA(ans)) {
      sections[secKey].score += numeric;
      sections[secKey].maxScore += qMax;
    }
  }

  // Add Section-wise Performance Summary table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Section-wise Performance Summary', 14, y);
  y += 8;

  const summaryRows = Object.keys(sections)
    .filter(key => sections[key].rows.length > 0)
    .map(key => {
      const sec = sections[key];
      const sectionPercentage = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
      return [sec.title, String(sec.rows.length), `${sec.score} / ${sec.maxScore}`, `${sectionPercentage}%`];
    });

  autoTable(doc as any, {
    startY: y,
    head: [['Section Name', 'Questions', 'Score', 'Percentage']],
    body: summaryRows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    columnStyles: {
      3: { cellWidth: 35, halign: 'left' }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = parseInt(data.cell.text[0]) || 0;
        const color = val >= 80 ? [16, 185, 129] : val >= 60 ? [245, 158, 11] : [239, 68, 68];
        const barWidth = 15;
        const barHeight = 3;
        const x = data.cell.x + 15; // Offset from text
        const yPos = data.cell.y + (data.cell.height / 2) - 1.5;
        
        // Background bar
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(x, yPos, barWidth, barHeight, 1, 1, 'F');
        // Colored progress bar
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(x, yPos, Math.max(0.5, (val / 100) * barWidth), barHeight, 1, 1, 'F');
      }
    }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Individual Responses Detail
  Object.keys(sections).filter(key => sections[key].rows.length > 0).forEach(secKey => {
    const sec = sections[secKey];
    if (y > 230) { doc.addPage(); y = 15; }
    
    const sectionPercentage = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    
    doc.setFillColor(59, 130, 246); 
    doc.roundedRect(14, y, 182, 12, 2, 2, 'F'); 
    doc.setFontSize(12); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(255, 255, 255); 
    doc.text(sec.title, 18, y + 8);
    
    const scoreLabel = `Score: ${sec.score}/${sec.maxScore} (${sectionPercentage}%)`;
    doc.text(scoreLabel, 190, y + 8, { align: 'right' });
    y += 18;
    
    const tableRows = sec.rows.map((r: any) => [r.question, String(r.answer).toUpperCase(), String(r.score)]);
    autoTable(doc as any, { 
      startY: y, 
      head: [['Question Detail', 'Response', 'Points']], 
      body: tableRows, 
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' }, 
      headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', lineWidth: 0.1 }, 
      columnStyles: { 0: { cellWidth: 125 }, 1: { cellWidth: 35, halign: 'center' }, 2: { cellWidth: 22, halign: 'center' } },
      margin: { left: 14, right: 14 }
    });
    y = (doc as any).lastAutoTable.finalY + 8;
    
    // Check for section remarks
    const remarksKey = `${secKey.toLowerCase()}_remarks`;
    const remarks = sub[remarksKey] || sub[`${secKey}_remarks`];
    if (remarks) {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Section Remarks:', 14, y);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      const splitRemarks = doc.splitTextToSize(remarks, 170);
      doc.text(splitRemarks, 14, y + 5);
      y += (splitRemarks.length * 5) + 10;
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i=1;i<=pageCount;i++){ doc.setPage(i); doc.setFontSize(8); doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' }); }
  return doc;
}

export default buildOperationsPDF;
