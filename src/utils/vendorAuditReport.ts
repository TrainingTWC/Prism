import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VENDOR_AUDIT_SECTIONS } from '../../config/vendorAuditQuestions';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return dateStr;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  } catch { return dateStr; }
}

function isNA(v: any) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (s === 'na' || s === 'n/a' || s === 'not applicable' || s === 'n.a.' || s === 'n a') return true;
  if (/^n\s*\/?\s*a$/.test(s)) return true;
  if (/not\s+applicab/.test(s)) return true;
  return false;
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
        } else {
          reject(new Error('Could not get canvas context'));
        }
      } catch (err) { reject(err); }
    };
    img.onerror = () => { clearTimeout(timeout); reject(new Error(`Failed to load image: ${url}`)); };
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    img.src = fullUrl;
  });
}

async function addCompanyLogo(doc: jsPDF): Promise<void> {
  const logoPaths = ['/assets/logo.png', '/assets/logo.svg', '/assets/logo.webp', `${window.location.origin}/assets/logo.png`];
  const areaX = 162, areaY = 8, areaW = 28, areaH = 28, innerPadding = 4;

  for (const logoPath of logoPaths) {
    try {
      const logoData = await loadImage(logoPath);
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i); i.onerror = () => reject(); i.src = logoData;
      });
      const usableW = Math.max(4, areaW - innerPadding * 2);
      const usableH = Math.max(4, areaH - innerPadding * 2);
      const ratio = Math.min(1, usableW / (imgEl.naturalWidth || areaW), usableH / (imgEl.naturalHeight || areaH));
      const drawW = Math.round((imgEl.naturalWidth || areaW) * ratio);
      const drawH = Math.round((imgEl.naturalHeight || areaH) * ratio);
      const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2);
      const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2);
      doc.addImage(logoData, 'PNG', drawX, drawY, drawW, drawH);
      return;
    } catch { /* try next */ }
  }
  // Fallback text logo
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(160, 8, 34, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(255, 255, 255);
  doc.text('PRISM', 177, 22, { align: 'center' });
}

// Map section IDs to short prefixes for field lookup
const SECTION_PREFIXES: Record<string, string> = {
  'VA_ZeroTolerance': 'VZT',
  'VA_DesignFacilities': 'VDF',
  'VA_ControlOfOperation': 'VCO',
  'VA_CleaningSanitation': 'VCS',
  'VA_PestControl': 'VPC',
  'VA_PersonalHygiene': 'VPH',
  'VA_Maintenance': 'VM',
  'VA_Documentation': 'VD',
  'VA_GeneralSafety': 'VGS'
};

function resolveSubmissionValue(submission: any, sectionId: string, questionId: string) {
  if (!submission) return undefined;
  const directKey = `${sectionId}_${questionId}`;
  if (submission[directKey] !== undefined) return submission[directKey];
  const prefix = SECTION_PREFIXES[sectionId];
  if (prefix) {
    const prefixKey = `${prefix}_${questionId}`;
    if (submission[prefixKey] !== undefined) return submission[prefixKey];
  }
  const colonKeys = Object.keys(submission).filter(k => k.startsWith(`${directKey}:`));
  if (colonKeys.length > 0) return submission[colonKeys[0]];
  const lowerKey = directKey.toLowerCase();
  const fuzzyMatch = Object.keys(submission).find(k => k.toLowerCase() === lowerKey || k.toLowerCase().startsWith(lowerKey + ':'));
  if (fuzzyMatch) return submission[fuzzyMatch];
  return undefined;
}

function computeOverall(submission: any): { total: number; max: number; pct: number; zeroToleranceFailed: boolean } {
  let total = 0, max = 0, zeroToleranceFailed = false;
  VENDOR_AUDIT_SECTIONS.forEach(section => {
    section.items.forEach(item => {
      const qId = item.id.split('_').slice(1).join('_');
      const ans = resolveSubmissionValue(submission, section.id, qId);
      if (isNA(ans)) return;
      const response = String(ans || '').toLowerCase().trim();
      if (section.id === 'VA_ZeroTolerance') {
        if (response === 'non-compliant') zeroToleranceFailed = true;
        if (response) { max += item.w; if (response === 'compliant') total += item.w; }
      } else {
        if (response) {
          max += item.w;
          if (response === 'compliant') total += item.w;
          else if (response === 'partially-compliant' || response === 'partially compliant') total += Math.floor(item.w / 2);
        }
      }
    });
  });
  if (zeroToleranceFailed) total = 0;
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return { total, max, pct, zeroToleranceFailed };
}

export const buildVendorAuditPDF = async (
  submissions: any[],
  metadata: any = {},
  options: { title?: string } = {},
  questionImages: Record<string, string[]> = {}
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;
  const first = submissions[0] || {} as any;
  const title = options.title || 'Vendor Audit Report';

  // Header
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
  doc.text(title, 14, y);

  // Logo
  try {
    const areaX = 162, areaY = 8, areaW = 28, areaH = 28, innerPadding = 4;
    if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = EMBEDDED_LOGO;
      });
      const usableW = Math.max(4, areaW - innerPadding * 2);
      const usableH = Math.max(4, areaH - innerPadding * 2);
      const ratio = Math.min(1, usableW / (imgEl.naturalWidth || areaW), usableH / (imgEl.naturalHeight || areaH));
      const drawW = Math.round((imgEl.naturalWidth || areaW) * ratio);
      const drawH = Math.round((imgEl.naturalHeight || areaH) * ratio);
      doc.addImage(EMBEDDED_LOGO, 'PNG',
        areaX + innerPadding + Math.round((usableW - drawW) / 2),
        areaY + innerPadding + Math.round((usableH - drawH) / 2), drawW, drawH);
    } else {
      await addCompanyLogo(doc);
    }
  } catch { /* ignore */ }

  // Vendor subtitle
  y += 4;
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 41, 55);
  const vendorName = metadata.vendorName || first.vendorName || '';
  if (vendorName) doc.text(vendorName, 14, y + 2);

  // Metadata row
  const metaY = y + 8;
  const dateStr = formatDate(metadata.date || first.submissionTime || first.date || '');
  const auditor = metadata.auditorName || first.auditorName || '';
  const region = metadata.region || first.region || '';
  const city = metadata.city || first.city || '';
  const metaLine: string[] = [];
  if (dateStr) metaLine.push(dateStr);
  if (auditor) metaLine.push(`Auditor: ${auditor}`);
  if (region) metaLine.push(`Region: ${region}`);
  if (city) metaLine.push(`City: ${city}`);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 130, 145);
  if (metaLine.length) doc.text(metaLine.join('   |   '), 14, metaY);
  y = metaY + 12;

  // Overall score
  const computed = computeOverall(first);
  const totalFromSheet = first.totalScore !== undefined && first.maxScore !== undefined;
  let total = totalFromSheet ? Number(first.totalScore) : computed.total;
  const max = totalFromSheet ? Number(first.maxScore) : computed.max;
  const zeroToleranceFailed = computed.zeroToleranceFailed;
  if (zeroToleranceFailed) total = 0;
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;

  // Score cards
  const cardHeight = 42;
  doc.setFillColor(240, 253, 250); doc.setDrawColor(204, 251, 241);
  doc.roundedRect(14, y, 90, cardHeight, 6, 6, 'FD');
  doc.setFontSize(10); doc.setTextColor(13, 148, 136); doc.setFont('helvetica', 'bold');
  doc.text('Overall Score', 22, y + 10);
  doc.setFontSize(20); doc.setTextColor(17, 24, 39);
  doc.text(`${total} / ${max}`, 22, y + 30);

  doc.setFillColor(240, 253, 250); doc.setDrawColor(204, 251, 241);
  doc.roundedRect(110, y, 84, cardHeight, 6, 6, 'FD');
  doc.setFontSize(10); doc.setTextColor(13, 148, 136); doc.setFont('helvetica', 'bold');
  doc.text('Percentage', 118, y + 10);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  const pctColor = pct >= 80 ? [16, 185, 129] : pct >= 60 ? [245, 158, 11] : [239, 68, 68];
  doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
  doc.text(`${pct}%`, 118, y + 30);
  // Progress bar
  const barX = 118, barY2 = y + 34, barWidth = 68, barHeight = 4;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(barX, barY2, barWidth, barHeight, 2, 2, 'F');
  doc.setFillColor(pctColor[0], pctColor[1], pctColor[2]);
  doc.roundedRect(barX, barY2, Math.max(4, Math.min(barWidth, Math.round((pct / 100) * barWidth))), barHeight, 2, 2, 'F');
  y += cardHeight + 12;

  // Zero Tolerance Warning
  if (zeroToleranceFailed) {
    doc.setFillColor(254, 242, 242); doc.setDrawColor(239, 68, 68);
    doc.roundedRect(14, y, 180, 16, 4, 4, 'FD');
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(185, 28, 28);
    doc.text('! ZERO TOLERANCE VIOLATION - Audit Failed', 18, y + 10);
    y += 22;
  }

  // Build sections data
  const sections: Record<string, { title: string; rows: any[]; score: number; maxScore: number; remarks?: string }> = {};
  VENDOR_AUDIT_SECTIONS.forEach(section => {
    sections[section.id] = { title: section.title, rows: [], score: 0, maxScore: 0 };
  });

  const sub = submissions[0] || {} as any;

  // Parse remarks JSON if present
  if (sub.questionRemarksJSON || sub['Question Remarks JSON']) {
    try {
      const parsed = JSON.parse(sub.questionRemarksJSON || sub['Question Remarks JSON']);
      Object.entries(parsed).forEach(([key, value]) => { sub[`${key}_remark`] = value; });
    } catch { /* ignore */ }
  }

  VENDOR_AUDIT_SECTIONS.forEach(section => {
    section.items.forEach(item => {
      const qId = item.id.split('_').slice(1).join('_');
      const ans = resolveSubmissionValue(sub, section.id, qId);
      const response = String(ans || '').toLowerCase().trim();
      let numeric = 0, display = response || '-';

      if (!isNA(ans) && response) {
        sections[section.id].maxScore += item.w;
        if (section.id === 'VA_ZeroTolerance') {
          if (response === 'compliant') { numeric = item.w; display = 'Compliance'; }
          else if (response === 'non-compliant') { numeric = 0; display = 'Non-Compliance'; }
        } else {
          if (response === 'compliant') { numeric = item.w; display = 'Compliance'; }
          else if (response === 'partially-compliant' || response === 'partially compliant') { numeric = Math.floor(item.w / 2); display = 'Partial Compliance'; }
          else if (response === 'not-compliant' || response === 'not compliant') { numeric = 0; display = 'Non-Compliance'; }
        }
        sections[section.id].score += numeric;
      } else if (isNA(ans)) {
        display = 'NA';
      }

      const remarkKey = `${section.id}_${qId}_remark`;
      const altRemarkKey = `${SECTION_PREFIXES[section.id]}_${qId}_remark`;
      let questionRemark = '';
      if (sub[remarkKey]) questionRemark = String(sub[remarkKey]).trim();
      else if (sub[altRemarkKey]) questionRemark = String(sub[altRemarkKey]).trim();

      sections[section.id].rows.push({
        id: item.id, questionId: `${section.id}_${qId}`, question: item.q,
        answer: display, score: numeric, maxScore: item.w, remark: questionRemark
      });
    });
  });

  // Section-wise Summary Table
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
  doc.text('Section-wise Performance Summary', 14, y);
  y += 8;

  const summaryData = Object.keys(sections).map(secKey => {
    const sec = sections[secKey];
    const sectionPct = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    return { title: sec.title, questions: String(sec.rows.length), score: `${sec.score}/${sec.maxScore}`, percentage: sectionPct, percentageText: `${sectionPct}%` };
  });

  autoTable(doc as any, {
    startY: y,
    head: [['Section', 'Questions', 'Score', '%', 'Progress']],
    body: summaryData.map(d => [d.title, d.questions, d.score, d.percentageText, '']),
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 55, halign: 'left' }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const pctValue = parseInt(String(data.cell.raw));
        if (!isNaN(pctValue)) {
          if (pctValue >= 90) data.cell.styles.textColor = [34, 197, 94];
          else if (pctValue >= 80) data.cell.styles.textColor = [13, 148, 136];
          else if (pctValue >= 70) data.cell.styles.textColor = [245, 158, 11];
          else data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 4) {
        const rowIdx = data.row.index;
        const p = summaryData[rowIdx].percentage;
        const bx = data.cell.x + 2, by = data.cell.y + data.cell.height / 2 - 3;
        const bw = data.cell.width - 4, bh = 6;
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(bx, by, bw, bh, 1, 1, 'F');
        if (p > 0) {
          const fw = Math.max(2, (p / 100) * bw);
          if (p >= 90) doc.setFillColor(34, 197, 94);
          else if (p >= 80) doc.setFillColor(13, 148, 136);
          else if (p >= 70) doc.setFillColor(245, 158, 11);
          else doc.setFillColor(239, 68, 68);
          doc.roundedRect(bx, by, fw, bh, 1, 1, 'F');
        }
      }
    }
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Separator
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5); doc.line(14, y, 194, y); y += 12;

  // Detailed Assessment
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
  doc.text('Detailed Assessment', 14, y); y += 10;

  Object.keys(sections).forEach(secKey => {
    const sec = sections[secKey];
    if (y > 250) { doc.addPage(); y = 15; }

    const sectionPct = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    doc.setFillColor(13, 148, 136);
    doc.roundedRect(14, y, 180, 12, 2, 2, 'F');
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text(sec.title, 18, y + 8);
    const scoreLabel = `Score: ${sec.score}/${sec.maxScore} (${sectionPct}%)`;
    const scoreWidth = (doc as any).getTextWidth(scoreLabel) || scoreLabel.length * 3.5;
    doc.text(scoreLabel, Math.min(14 + 180 - 8 - scoreWidth, 160), y + 8);
    y += 18;

    sec.rows.forEach((rowData, rowIndex) => {
      if (y > 250) { doc.addPage(); y = 20; }

      autoTable(doc as any, {
        startY: y,
        head: [['Question', 'Response', 'Score', 'Max']],
        body: [[`Q${rowIndex + 1}. ${rowData.question}`, rowData.answer, String(rowData.score), String(rowData.maxScore)]],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 95 }, 1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' }
        },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            if (data.column.index === 1) {
              const text = String(data.cell.raw).toLowerCase();
              if (text === 'compliance') { data.cell.styles.textColor = [34, 197, 94]; data.cell.styles.fillColor = [240, 253, 244]; data.cell.styles.fontStyle = 'bold'; }
              else if (text === 'non-compliance') { data.cell.styles.textColor = [239, 68, 68]; data.cell.styles.fillColor = [254, 242, 242]; data.cell.styles.fontStyle = 'bold'; }
              else if (text === 'partial compliance') { data.cell.styles.textColor = [245, 158, 11]; data.cell.styles.fillColor = [254, 252, 232]; data.cell.styles.fontStyle = 'bold'; }
            }
            if (data.column.index === 2) {
              const scoreNum = Number(data.cell.raw);
              if (!isNaN(scoreNum) && scoreNum > 0) data.cell.styles.textColor = [34, 197, 94];
            }
          }
        }
      });
      y = (doc as any).lastAutoTable.finalY + 2;

      // Per-question remark
      if (rowData.remark && rowData.remark.trim()) {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(107, 114, 128);
        doc.text('💬 Comment:', 18, y + 4);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81);
        const remarkLines = doc.splitTextToSize(rowData.remark, 160);
        doc.text(remarkLines, 40, y + 4);
        y += (remarkLines.length * 4) + 3;
      }

      // Images for this question
      if (rowData.questionId) {
        let images = questionImages[rowData.questionId];
        if (!images || images.length === 0) {
          const altKey = rowData.questionId.replace(/_([A-Z]+)_/, '_$1');
          images = questionImages[altKey];
        }
        if (images && images.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          const imagesPerRow = 5, imageWidth = 32, imageHeight = 24, spacing = 3;
          images.forEach((base64Image, idx) => {
            try {
              const col = idx % imagesPerRow;
              const row = Math.floor(idx / imagesPerRow);
              if (row > 0 && col === 0 && y + imageHeight > 270) { doc.addPage(); y = 20; }
              const x = 14 + col * (imageWidth + spacing);
              const currentY = y + row * (imageHeight + spacing);
              doc.addImage(base64Image, 'JPEG', x, currentY, imageWidth, imageHeight);
              doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.5);
              doc.rect(x, currentY, imageWidth, imageHeight);
            } catch (err) { console.warn('Could not add image to PDF:', err); }
          });
          const totalRows = Math.ceil(images.length / imagesPerRow);
          y += (imageHeight + spacing) * totalRows + 2;
        }
      }
      y += 4;
    });
  });

  // Signatures
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
  doc.text('Signatures', 14, y); y += 10;

  const auditorSignature = sub.auditorSignature || sub.auditor_signature || sub['Auditor Signature'];
  const vendorSignature = sub.vendorSignature || sub.vendor_signature || sub['Vendor Signature'] || sub['Vendor Representative Signature'];

  const signBoxW = 85, signBoxH = 40;

  // Auditor Signature Box
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5);
  doc.roundedRect(14, y, signBoxW, signBoxH, 2, 2, 'S');
  if (auditorSignature && auditorSignature.startsWith('data:image')) {
    try { doc.addImage(auditorSignature, 'PNG', 19, y + 5, signBoxW - 10, signBoxH - 15); } catch { /* ignore */ }
  } else {
    doc.setFontSize(9); doc.setTextColor(156, 163, 175); doc.setFont('helvetica', 'italic');
    doc.text('Signature not provided', 14 + signBoxW / 2, y + signBoxH / 2, { align: 'center' });
  }
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(75, 85, 99);
  doc.text('Auditor Signature', 14 + signBoxW / 2, y + signBoxH + 5, { align: 'center' });

  // Vendor Representative Signature Box
  doc.roundedRect(109, y, signBoxW, signBoxH, 2, 2, 'S');
  if (vendorSignature && vendorSignature.startsWith('data:image')) {
    try { doc.addImage(vendorSignature, 'PNG', 114, y + 5, signBoxW - 10, signBoxH - 15); } catch { /* ignore */ }
  } else {
    doc.setFontSize(9); doc.setTextColor(156, 163, 175); doc.setFont('helvetica', 'italic');
    doc.text('Signature not provided', 109 + signBoxW / 2, y + signBoxH / 2, { align: 'center' });
  }
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(75, 85, 99);
  doc.text('Vendor Representative Signature', 109 + signBoxW / 2, y + signBoxH + 5, { align: 'center' });

  y += signBoxH + 15;

  // Footer
  doc.setFontSize(8); doc.setTextColor(156, 163, 175); doc.setFont('helvetica', 'italic');
  doc.text(`Generated on ${new Date().toLocaleString('en-GB', { hour12: true })} via Prism`, 14, 285);

  return doc;
};
