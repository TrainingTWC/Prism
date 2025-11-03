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

// Compute overall for operations using OPERATIONS_QUESTIONS
function computeOverall(submission: any): { total: number; max: number; pct: number } {
  let total = 0; let max = 0;
  for (const q of OPERATIONS_QUESTIONS) {
    const ans = submission[q.id];
    if (isNA(ans)) continue;
    const qMax = q.choices && q.choices.length ? Math.max(...q.choices.map((c:any)=>Number(c.score)||0)) : 1;
    let numeric = 0;
    if (ans !== undefined && ans !== null && ans !== '') {
      const low = String(ans).toLowerCase();
      if (low === 'yes' || low === 'y' || low === 'true') numeric = 1;
      if (q.choices && q.choices.length) {
        const found = q.choices.find((c:any)=>String(c.label).toLowerCase()===low);
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
  const title = options.title || 'AM Operations Checklist';

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(title, 14, y);

  try {
    const areaX = 162, areaY = 8, areaW = 28, areaH = 28, innerPadding = 4;
    if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => { const i=new Image(); i.onload=()=>resolve(i); i.onerror=reject; i.src=EMBEDDED_LOGO; });
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
      try { const img = await loadImage(`${window.location.origin}/assets/logo.png`); const el = await new Promise<HTMLImageElement>((res, rej)=>{const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=img;}); const naturalW = el.naturalWidth||el.width||areaW; const naturalH = el.naturalHeight||el.height||areaH; const usableW = Math.max(4, areaW - innerPadding * 2); const usableH = Math.max(4, areaH - innerPadding * 2); const ratio = Math.min(1, usableW / naturalW, usableH / naturalH); const drawW = Math.round(naturalW * ratio); const drawH = Math.round(naturalH * ratio); const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2); const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2); doc.addImage(img, 'PNG', drawX, drawY, drawW, drawH);} catch(e){ await addCompanyLogo(doc);}    
  } catch (e) {}

  y += 4;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31,41,55);
  const storeName = metadata.storeName || first.storeName || first.store_name || '';
  if (storeName) doc.text(storeName, 14, y + 2);

  const metaY = y + 8;
  const dateStr = metadata.date || first.submissionTime || first.date || '';
  const auditor = metadata.trainerName || first.trainerName || first.auditor || '';
  const sid = metadata.storeId || first.storeId || '';
  const mod = (metadata.mod || first.mod || first.MOD) || '';
  const metaLine = [] as string[];
  if (dateStr) metaLine.push(`${dateStr}`);
  if (auditor) metaLine.push(`Auditor: ${auditor}`);
  if (sid) metaLine.push(`Store: ${sid}`);
  if (mod) metaLine.push(`MOD: ${mod}`);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120,130,145);
  if (metaLine.length) doc.text(metaLine.join('   |   '), 14, metaY);
  y = metaY + 12;

  const computed = computeOverall(first);
  const total = computed.total; const max = computed.max; const pct = computed.pct;

  const cardHeight = 42; const leftX = 14; const rightX = 110;
  doc.setFillColor(247,249,255); doc.setDrawColor(226,232,240); doc.roundedRect(leftX, y, 90, cardHeight, 6, 6, 'FD'); doc.setFontSize(10); doc.setTextColor(99,102,241); doc.setFont('helvetica','bold'); doc.text('Overall Score', leftX + 8, y + 10); doc.setFontSize(20); doc.setTextColor(17,24,39); doc.setFont('helvetica','bold'); doc.text(`${total} / ${max}`, leftX + 8, y + 30);
  doc.setFillColor(247,249,255); doc.setDrawColor(226,232,240); doc.roundedRect(rightX, y, 84, cardHeight, 6, 6, 'FD'); doc.setFontSize(10); doc.setTextColor(99,102,241); doc.setFont('helvetica','bold'); doc.text('Percentage', rightX + 8, y + 10); doc.setFontSize(20); doc.setFont('helvetica','bold'); const pctColor = pct >= 80 ? [16,185,129] : pct >= 60 ? [245,158,11] : [239,68,68]; doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]); doc.text(`${pct}%`, rightX + 8, y + 30); const barX = rightX + 8; const barY = y + 34; const barWidth = 84 - 16; const barHeight = 4; doc.setFillColor(226,232,240); doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F'); doc.setFillColor(pctColor[0], pctColor[1], pctColor[2]); doc.roundedRect(barX, barY, Math.max(4, Math.min(barWidth, Math.round((pct / 100) * barWidth))), barHeight, 2, 2, 'F');
  y += cardHeight + 12;

  // Sections from OPERATIONS_QUESTIONS: group by prefix before underscore
  const sections: Record<string, { rows: any[]; score: number; maxScore: number; remarks?: string }> = {};
  for (const q of OPERATIONS_QUESTIONS) {
    const key = q.id.includes('_') ? q.id.split('_')[0] : 'Misc';
    if (!sections[key]) sections[key] = { rows: [], score: 0, maxScore: 0 };
  }

  const sub = first as any;
  for (const q of OPERATIONS_QUESTIONS) {
    const ans = sub[q.id];
    const qMax = q.choices && q.choices.length ? Math.max(...q.choices.map((c:any)=>Number(c.score)||0)) : 1;
    let numeric = 0;
    if (ans !== undefined && ans !== null && ans !== '' && !isNA(ans)) {
      const low = String(ans).toLowerCase();
      if (low === 'yes' || low === 'y' || low === 'true') numeric = 1;
      if (q.choices && q.choices.length) {
        const found = q.choices.find((c:any)=>String(c.label).toLowerCase()===low);
        if (found) numeric = Number(found.score) || numeric;
      }
    }
    const secKey = q.id.includes('_') ? q.id.split('_')[0] : 'Misc';
    sections[secKey].rows.push({ id: q.id, question: q.title || q.id, answer: isNA(ans) ? 'NA' : (ans || ''), score: numeric, maxScore: qMax });
    sections[secKey].score += numeric;
    if (!isNA(ans)) sections[secKey].maxScore += qMax;
  }

  Object.keys(sections).forEach(secKey => {
    const sec = sections[secKey];
    if (y > 250) { doc.addPage(); y = 15; }
    const sectionTitle = secKey.replace('_',' ');
    const sectionPercentage = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    doc.setFillColor(59,130,246); doc.roundedRect(14, y, 180, 12, 2, 2, 'F'); doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255); doc.text(sectionTitle, 18, y + 8);
    const scoreLabel = `Score: ${sec.score}/${sec.maxScore} (${sectionPercentage}%)`;
    const scoreWidth = (doc as any).getTextWidth(scoreLabel) || scoreLabel.length * 3.5; const maxRight = 14 + 180 - 8; const scoreX = Math.min(maxRight - scoreWidth, 160);
    doc.text(scoreLabel, scoreX, y + 8);
    y += 18;
    const tableRows = sec.rows.map((r:any) => [r.question, r.answer || '-', String(r.score), String(r.maxScore)]);
    autoTable(doc as any, { startY: y, head: [['Question','Response','Score','Max']], body: tableRows, styles:{fontSize:9,cellPadding:3}, headStyles:{fillColor:[248,250,252],textColor:[51,65,85],fontStyle:'bold'}, columnStyles:{0:{cellWidth:95},1:{cellWidth:40,halign:'center'},2:{cellWidth:20,halign:'center'},3:{cellWidth:20,halign:'center'}} });
    y = (doc as any).lastAutoTable.finalY + 6;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i=1;i<=pageCount;i++){ doc.setPage(i); doc.setFontSize(8); doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' }); }
  return doc;
}

export default buildOperationsPDF;
