import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrainingAuditSubmission } from '../../services/dataService';

interface ReportOptions {
  title?: string;
  logoDataUrl?: string | null;
}

const mm = (val: number) => val; // placeholder for conversions if needed

export const buildTrainingPDF = (submissions: TrainingAuditSubmission[], metadata: any = {}, options: ReportOptions = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;

  const title = options.title || 'Training Audit';

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);

  if (options.logoDataUrl) {
    try { doc.addImage(options.logoDataUrl, 'PNG', 160, 8, 34, 24); } catch (e) { /* ignore */ }
  }

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Metadata row
  const leftMeta = [] as string[];
  if (metadata.storeName) leftMeta.push(`Store: ${metadata.storeName}`);
  if (metadata.storeId) leftMeta.push(`Store ID: ${metadata.storeId}`);
  if (metadata.trainerName) leftMeta.push(`Trainer: ${metadata.trainerName}`);
  if (metadata.auditor) leftMeta.push(`Auditor: ${metadata.auditor}`);
  if (metadata.date) leftMeta.push(`Date/Time: ${metadata.date}`);

  doc.text(leftMeta.join('   |   '), 14, y + 6);
  y += 12;

  // Overall performance summary (take first submission as representative if multiple)
  const first = submissions[0] || null;
  if (first) {
    const overallScore = `${first.totalScore || ''} / ${first.maxScore || ''}`;
    const pct = first.percentageScore || '';

    // Draw two boxes side-by-side
    doc.setDrawColor(220);
    doc.roundedRect(14, y, 90, 22, 2, 2);
    doc.roundedRect(110, y, 80, 22, 2, 2);
    doc.setFontSize(9);
    doc.text('Overall Score', 18, y + 8);
    doc.setFontSize(16);
    doc.text(overallScore, 18, y + 18);

    doc.setFontSize(9);
    doc.text('Percentage', 114, y + 8);
    doc.setFontSize(16);
    doc.text(String(pct) + '%', 114, y + 18);

    y += 28;
  }

  // Group questions by section (heuristic: keys with prefixes like TM_, LMS_, BTA_, etc.)
  const sections: Record<string, {rows: any[], score: number, maxScore: number, remarks?: string}> = {};

  submissions.forEach(sub => {
    Object.keys(sub).forEach(k => {
      if (['submissionTime','trainerName','trainerId','amName','amId','storeName','storeId','region','mod','totalScore','maxScore','percentageScore','tsaFoodScore','tsaCoffeeScore','tsaCXScore'].includes(k)) return;
      const match = k.match(/^([A-Z]{2,})_(.*)/);
      const val = (sub as any)[k];
      if (match) {
        const sec = match[1];
        const qid = match[2];
        if (!sections[sec]) sections[sec] = { rows: [], score: 0, maxScore: 0 };
        // Determine display answer and numeric score if possible
        let display = String(val || '');
        let numeric = 0;
        if (display === 'yes' || display === 'Yes' || display === 'Y') numeric = 1;
        if (display === 'no' || display === 'No' || display === 'N') numeric = 0;
        sections[sec].rows.push({ question: qid, answer: display, score: numeric, raw: val });
      }
    });
  });

  // Render each section
  Object.keys(sections).forEach(secKey => {
    const sec = sections[secKey];
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(secKey.replace('_',' '), 14, y);
    y += 6;

    // Table of questions
    const tableRows = sec.rows.map(r => [r.question, r.answer, String(r.score)]);
    autoTable(doc as any, {
      startY: y,
      head: [['Question', 'Answer', 'Score']],
      body: tableRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245,245,250], textColor: [34,34,80], halign: 'left' }
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // If any remarks fields exist for this section, print them
    const remarks = sec.rows.map(r => r.raw).filter((v: any) => typeof v === 'string' && v.toLowerCase().includes('remark'));
    if (remarks.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Remarks: ' + remarks.join(' | '), 14, y);
      y += 8;
    }
  });

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  return doc;
}

export default buildTrainingPDF;
