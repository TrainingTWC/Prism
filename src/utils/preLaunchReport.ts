import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PRE_LAUNCH_SECTIONS } from '../../config/preLaunchQuestions';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return dateStr;
  try {
    // Handle dd/MM/yyyy HH:mm:ss format from Google Sheets
    const parts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (parts) {
      const [, d, m, y, H, M] = parts;
      const date = new Date(`${y}-${m}-${d}T${H}:${M}:00`);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
      }
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    }
  } catch { /* fall through */ }
  return dateStr;
}

function isNA(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'na' || s === 'n/a' || s === 'not applicable' || /^n\s*\/?\s*a$/.test(s);
}

async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png')); }
        else reject(new Error('no ctx'));
      } catch (err) { reject(err); }
    };
    img.onerror = () => { clearTimeout(timeout); reject(new Error(`failed: ${url}`)); };
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    img.src = fullUrl;
  });
}

async function addLogo(doc: jsPDF) {
  const areaX = 162, areaY = 8, areaW = 28, areaH = 28, pad = 4;
  const usableW = areaW - pad * 2, usableH = areaH - pad * 2;

  const tryEmbed = async (src: string) => {
    const imgEl = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
    });
    const nW = imgEl.naturalWidth || areaW, nH = imgEl.naturalHeight || areaH;
    const ratio = Math.min(1, usableW / nW, usableH / nH);
    const dW = Math.round(nW * ratio), dH = Math.round(nH * ratio);
    const dX = areaX + pad + Math.round((usableW - dW) / 2);
    const dY = areaY + pad + Math.round((usableH - dH) / 2);
    doc.addImage(src, 'PNG', dX, dY, dW, dH);
  };

  try {
    if (EMBEDDED_LOGO?.startsWith('data:image')) { await tryEmbed(EMBEDDED_LOGO); return; }
    const imgData = await loadImage(`${(window as any).location?.origin || ''}/assets/logo.png`);
    await tryEmbed(imgData);
  } catch {
    // Text fallback
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(160, 8, 34, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PRISM', 177, 22, { align: 'center' });
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface PreLaunchReportOptions {
  title?: string;
}

export const buildPreLaunchPDF = async (
  submission: any,
  options: PreLaunchReportOptions = {},
  questionImages: Record<string, string[]> = {}
): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;

  // ------------------------------------------------------------------
  // Header
  // ------------------------------------------------------------------
  const title = options.title || 'Pre-Launch Audit Report';
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(title, 14, y);

  try { await addLogo(doc); } catch { /* ignore */ }

  y += 4;
  if (submission.storeName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(submission.storeName, 14, y + 2);
  }

  const metaParts: string[] = [];
  const dateStr = formatDate(submission.submissionTime || submission['Submission Time'] || '');
  if (dateStr) metaParts.push(dateStr);
  const auditor = submission.auditorName || submission['Auditor Name'] || '';
  if (auditor) metaParts.push(`Auditor: ${auditor}`);
  const sid = submission.storeId || submission['Store ID'] || '';
  if (sid) metaParts.push(`Store ID: ${sid}`);
  const region = submission.region || submission['Region'] || '';
  if (region) metaParts.push(`Region: ${region}`);
  const city = submission.city || submission['City'] || '';
  if (city) metaParts.push(`City: ${city}`);

  const metaY = y + 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 130, 145);
  if (metaParts.length) doc.text(metaParts.join('   |   '), 14, metaY);
  y = metaY + 12;

  // ------------------------------------------------------------------
  // Score summary cards
  // ------------------------------------------------------------------
  const totalScore = Number(submission.totalScore ?? submission['Total Score'] ?? 0);
  const maxScore = Number(submission.maxScore ?? submission['Max Score'] ?? 80);
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const pctColor: [number, number, number] = pct >= 80 ? [16, 185, 129] : pct >= 60 ? [245, 158, 11] : [239, 68, 68];

  const cardH = 42;
  // Left card — raw score
  doc.setFillColor(247, 249, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 90, cardH, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Overall Score', 22, y + 10);
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.text(`${totalScore} / ${maxScore}`, 22, y + 30);

  // Right card — percentage + bar
  doc.setFillColor(247, 249, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, y, 84, cardH, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Percentage', 118, y + 10);
  doc.setFontSize(22);
  doc.setTextColor(...pctColor);
  doc.text(`${pct}%`, 118, y + 30);
  const barX = 118, barY = y + 34, barW = 68, barH2 = 4;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(barX, barY, barW, barH2, 2, 2, 'F');
  if (pct > 0) {
    doc.setFillColor(...pctColor);
    doc.roundedRect(barX, barY, Math.max(2, (pct / 100) * barW), barH2, 2, 2, 'F');
  }

  y += cardH + 12;

  // ------------------------------------------------------------------
  // Merge remarks from JSON blob into flat keys
  // ------------------------------------------------------------------
  const sub = { ...submission };
  const remarksBlob = sub.questionRemarksJSON || sub.questionRemarks || sub['Remarks JSON'] || sub['Question Remarks JSON'];
  if (remarksBlob) {
    try {
      const parsed = typeof remarksBlob === 'string' ? JSON.parse(remarksBlob) : remarksBlob;
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([k, v]) => { sub[`${k}_remark`] = v; });
      }
    } catch { /* ignore */ }
  }

  const responses = sub.responses && typeof sub.responses === 'object' ? sub.responses : {};

  // ------------------------------------------------------------------
  // Build section data
  // ------------------------------------------------------------------
  type SectionData = {
    title: string;
    score: number;
    maxScore: number;
    rows: { id: string; fullId: string; question: string; answer: string; score: number; max: number; remark: string }[];
  };

  const sectionDataMap: Record<string, SectionData> = {};
  PRE_LAUNCH_SECTIONS.forEach(sec => {
    let secScore = 0;
    let secMax = 0;
    const rows: SectionData['rows'] = [];

    sec.items.forEach(item => {
      // Full question key e.g. PreLaunchChecklist_PL_1
      const fullKey = `${sec.id}_${item.id}`;
      // Try responses object first, then flat submission key
      const rawAns = responses[fullKey] ?? sub[fullKey] ?? '';
      const ans = String(rawAns).trim().toLowerCase();

      let display = ans || '-';
      let scoreVal = 0;

      if (!isNA(ans) && ans) {
        secMax += item.w;
        if (ans === 'compliant') { scoreVal = item.w; display = 'Compliance'; }
        else if (ans === 'partially-compliant') { scoreVal = Math.floor(item.w / 2); display = 'Partial Compliance'; }
        else if (ans === 'not-compliant') { scoreVal = 0; display = 'Non-Compliance'; }
        secScore += scoreVal;
      } else if (isNA(ans)) {
        display = 'NA';
      }

      // Remark lookup — try multiple key formats
      const remark =
        String(sub[`${fullKey}_remark`] || sub[`${sec.id}_${item.id}_remark`] || sub[`${item.id}_remark`] || '').trim();

      rows.push({ id: item.id, fullId: fullKey, question: item.q, answer: display, score: scoreVal, max: item.w, remark });
    });

    sectionDataMap[sec.id] = { title: sec.title, score: secScore, maxScore: secMax, rows };
  });

  // ------------------------------------------------------------------
  // Section summary table
  // ------------------------------------------------------------------
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Section-wise Performance Summary', 14, y);
  y += 8;

  const summaryData = PRE_LAUNCH_SECTIONS.map(sec => {
    const d = sectionDataMap[sec.id];
    const pctSec = d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0;
    return { title: d.title, questions: String(d.rows.length), score: `${d.score}/${d.maxScore}`, pct: pctSec, pctText: `${pctSec}%` };
  });

  autoTable(doc as any, {
    startY: y,
    head: [['Section', 'Questions', 'Score', '%', 'Progress']],
    body: summaryData.map(d => [d.title, d.questions, d.score, d.pctText, '']),
    styles: { fontSize: 10, cellPadding: 4, halign: 'center' },
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 45, halign: 'left' }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const v = parseInt(String(data.cell.raw));
        if (!isNaN(v)) {
          data.cell.styles.textColor = v >= 80 ? [34, 197, 94] : v >= 60 ? [245, 158, 11] : [239, 68, 68];
        }
      }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 4) {
        const p = summaryData[data.row.index].pct;
        const bX = data.cell.x + 2, bY = data.cell.y + data.cell.height / 2 - 3;
        const bW = data.cell.width - 4, bH = 6;
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(bX, bY, bW, bH, 1, 1, 'F');
        if (p > 0) {
          const fill = Math.max(2, (p / 100) * bW);
          const col: [number, number, number] = p >= 80 ? [34, 197, 94] : p >= 60 ? [245, 158, 11] : [239, 68, 68];
          doc.setFillColor(...col);
          doc.roundedRect(bX, bY, fill, bH, 1, 1, 'F');
        }
      }
    }
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, y, 194, y);
  y += 12;

  // ------------------------------------------------------------------
  // Detailed section breakdown
  // ------------------------------------------------------------------
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Detailed Assessment', 14, y);
  y += 10;

  PRE_LAUNCH_SECTIONS.forEach(sec => {
    const sd = sectionDataMap[sec.id];
    if (y > 250) { doc.addPage(); y = 15; }

    // Section header bar
    const secPct = sd.maxScore > 0 ? Math.round((sd.score / sd.maxScore) * 100) : 0;
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(14, y, 180, 12, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(sd.title, 18, y + 8);
    const scoreLabel = `Score: ${sd.score}/${sd.maxScore} (${secPct}%)`;
    const scoreWidth = (doc as any).getTextWidth(scoreLabel) || scoreLabel.length * 3.5;
    doc.text(scoreLabel, Math.min(186 - scoreWidth, 160), y + 8);
    y += 18;

    sd.rows.forEach((row, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }

      autoTable(doc as any, {
        startY: y,
        head: [['Question', 'Response', 'Score', 'Max']],
        body: [[`Q${idx + 1}. ${row.question}`, row.answer, String(row.score), String(row.max)]],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' }
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 1) {
            const t = String(data.cell.raw).toLowerCase();
            if (t === 'compliance') {
              data.cell.styles.textColor = [34, 197, 94];
              data.cell.styles.fillColor = [240, 253, 244];
              data.cell.styles.fontStyle = 'bold';
            } else if (t === 'non-compliance') {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fillColor = [254, 242, 242];
              data.cell.styles.fontStyle = 'bold';
            } else if (t === 'partial compliance') {
              data.cell.styles.textColor = [245, 158, 11];
              data.cell.styles.fillColor = [254, 252, 232];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          if (data.section === 'body' && data.column.index === 2) {
            if (Number(data.cell.raw) > 0) data.cell.styles.textColor = [34, 197, 94];
          }
        }
      });
      y = (doc as any).lastAutoTable.finalY + 2;

      // Per-question remark
      if (row.remark) {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128);
        doc.text('💬 Comment:', 18, y + 4);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const lines = doc.splitTextToSize(row.remark, 155);
        doc.text(lines, 22, y + 2);
        y += (lines.length * 4.5) + 3;
      }

      // Images for this question
      const images = questionImages[row.fullId];
      if (images && images.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        const imgsPerRow = 5, imgW = 32, imgH = 24, gap = 3, startX = 14;
        images.forEach((b64, iIdx) => {
          try {
            const col = iIdx % imgsPerRow, rowNum = Math.floor(iIdx / imgsPerRow);
            if (rowNum > 0 && col === 0 && y + imgH > 270) { doc.addPage(); y = 20; }
            const x = startX + col * (imgW + gap);
            const cy = y + rowNum * (imgH + gap);
            doc.addImage(b64, 'JPEG', x, cy, imgW, imgH);
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.5);
            doc.rect(x, cy, imgW, imgH);
          } catch { /* skip bad image */ }
        });
        const totalImgRows = Math.ceil(images.length / imgsPerRow);
        y += (imgH + gap) * totalImgRows + 2;
      }

      y += 4;
    });
  });

  // ------------------------------------------------------------------
  // Signatures
  // ------------------------------------------------------------------
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Signatures', 14, y);
  y += 10;

  const auditorSig = sub.auditorSignature || sub['Auditor Signature'] || '';
  const smSig = sub.smSignature || sub['SM Signature'] || '';
  const boxW = 85, boxH = 40;

  // Auditor box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, boxW, boxH, 2, 2, 'S');
  if (auditorSig?.startsWith('data:image')) {
    try { doc.addImage(auditorSig, 'PNG', 19, y + 5, boxW - 10, boxH - 15); } catch { /* ignore */ }
  } else {
    doc.setFontSize(9); doc.setTextColor(156, 163, 175); doc.setFont('helvetica', 'italic');
    doc.text('Signature not provided', 14 + boxW / 2, y + boxH / 2, { align: 'center' });
  }
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(51, 65, 85);
  doc.text('Auditor Signature', 14, y + boxH + 6);
  if (auditor) { doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128); doc.text(auditor, 14, y + boxH + 12); }

  // SM box
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(109, y, boxW, boxH, 2, 2, 'S');
  if (smSig?.startsWith('data:image')) {
    try { doc.addImage(smSig, 'PNG', 114, y + 5, boxW - 10, boxH - 15); } catch { /* ignore */ }
  } else {
    doc.setFontSize(9); doc.setTextColor(156, 163, 175); doc.setFont('helvetica', 'italic');
    doc.text('Signature not provided', 109 + boxW / 2, y + boxH / 2, { align: 'center' });
  }
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(51, 65, 85);
  doc.text('Store Manager Signature', 109, y + boxH + 6);

  y += boxH + 20;

  // ------------------------------------------------------------------
  // Footer page numbers
  // ------------------------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text(`Page ${p} of ${pages}`, 105, 290, { align: 'center' });
  }

  return doc;
};

export default buildPreLaunchPDF;
