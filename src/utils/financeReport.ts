import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

interface FinanceSubmission {
  [key: string]: any;
}

interface ReportOptions {
  title?: string;
  logoDataUrl?: string | null;
}

// Finance sections structure matching the frontend with actual questions
const FINANCE_SECTIONS = [
  { 
    id: 'CashManagement', 
    title: 'Section 1: Cash Handling & Settlement',
    prefix: 'CashManagement',
    questions: [
      { id: 'Q1', text: 'Were no discrepancies found during the cash drawer verification?', weight: 4 },
      { id: 'Q2', text: 'Were no discrepancies found during the petty cash verification?', weight: 3 },
      { id: 'Q3', text: 'Sale cash is not being used for petty cash or other purposes', weight: 2 },
      { id: 'Q4', text: 'Has banking of cash been done accurately for the last 3 days?', weight: 2 },
      { id: 'Q5', text: 'Was the previous day\'s batch correctly settled in the EDC machine?', weight: 2 },
      { id: 'Q6', text: 'Has the petty cash claim process been properly followed with supporting documents?', weight: 3 }
    ]
  },
  { 
    id: 'Section2', 
    title: 'Section 2: Billing & Transactions',
    prefix: 'Section2',
    questions: [
      { id: 'Q7', text: 'Is billing completed for all products served to customers?', weight: 4 },
      { id: 'Q8', text: 'Are there no open transactions pending in the POS system?', weight: 2 },
      { id: 'Q9', text: 'Are discount codes and vouchers applied correctly and as per policy?', weight: 2 },
      { id: 'Q10', text: 'Is the employee meal process followed as per policy?', weight: 2 },
      { id: 'Q11', text: 'Is there no price discrepancy between Menu, POS, Home Delivery (HD), and Pickup?', weight: 1 },
      { id: 'Q12', text: 'Is the customer refund process followed properly with approval and documentation?', weight: 1 }
    ]
  },
  { 
    id: 'Section3', 
    title: 'Section 3: Product & Inventory Compliance',
    prefix: 'Section3',
    questions: [
      { id: 'Q13', text: 'Were no expired items found during the audit?', weight: 4 },
      { id: 'Q14', text: 'Is FIFO / FEFO strictly followed for all food and beverage items?', weight: 3 },
      { id: 'Q15', text: 'Are all local purchase items correctly updated in the system?', weight: 2 },
      { id: 'Q16', text: 'Is the inventory posted in the system with complete and accurate details?', weight: 2 },
      { id: 'Q17', text: 'Is the MRD for all products properly updated?', weight: 2 },
      { id: 'Q18', text: 'Are all products available and actively used as per the menu?', weight: 2 },
      { id: 'Q19', text: 'Are products properly displayed or stored according to storage SOPs?', weight: 1 }
    ]
  },
  { 
    id: 'Section4', 
    title: 'Section 4: Documentation & Tracking',
    prefix: 'Section4',
    questions: [
      { id: 'Q20', text: 'Are all manual transactions properly approved and recorded?', weight: 2 },
      { id: 'Q21', text: 'Is the cash log book updated daily and verified by the store manager?', weight: 2 },
      { id: 'Q22', text: 'Are bank/cash deposit slips maintained and filed systematically?', weight: 2 },
      { id: 'Q23', text: 'Are stock delivery challans filed and updated properly?', weight: 2 }
    ]
  },
  { 
    id: 'Section5', 
    title: 'Section 5: POS System & SOP',
    prefix: 'Section5',
    questions: [
      { id: 'Q24', text: 'Is wastage correctly recorded and disposed as per SOP?', weight: 2 },
      { id: 'Q25', text: 'Are TI / TO / GRN entries done accurately and posted in the system?', weight: 2 },
      { id: 'Q26', text: 'Is the POS and store system used only for designated operational tasks?', weight: 2 },
      { id: 'Q27', text: 'Is the store team aware of SOPs and compliance requirements?', weight: 2 }
    ]
  },
  { 
    id: 'Section6', 
    title: 'Section 6: Licenses & Certificates',
    prefix: 'Section6',
    questions: [
      { id: 'Q28', text: 'Are trade licenses available and displayed with proper validity?', weight: 1 },
      { id: 'Q29', text: 'Are Shop & Establishment licenses available and displayed with proper validity?', weight: 1 },
      { id: 'Q30', text: 'Is the FSSAI license available and displayed with proper validity?', weight: 1 },
      { id: 'Q31', text: 'Music licenses available and displayed with proper validity?', weight: 1 },
      { id: 'Q32', text: 'Is the GST certificate available and displayed with proper validity?', weight: 1 }
    ]
  },
  { 
    id: 'Section7', 
    title: 'Section 7: CCTV Monitoring',
    prefix: 'Section7',
    questions: [
      { id: 'Q33', text: 'Is the CCTV system functioning properly?', weight: 2 },
      { id: 'Q34', text: 'Is there a backup of 30 / 60 days of footage with proper coverage of critical areas?', weight: 2 },
      { id: 'Q35', text: 'Are no SOP, compliance, or integrity violations observed in CCTV sample review?', weight: 3 }
    ]
  }
];

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

    const timeout = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

async function addCompanyLogo(doc: jsPDF): Promise<void> {
  const areaX = 162;
  const areaY = 8;
  const areaW = 28;
  const areaH = 28;
  const innerPadding = 4;

  try {
    if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = EMBEDDED_LOGO;
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
      doc.addImage(EMBEDDED_LOGO, 'PNG', drawX, drawY, drawW, drawH);
      return;
    }
  } catch (e) {
    console.warn('Could not load embedded logo');
  }

  // Fallback: Styled text logo
  doc.setFillColor(16, 185, 129); // Emerald color for finance
  doc.roundedRect(160, 8, 34, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('PRISM', 177, 22, { align: 'center' });
}

// Calculate scores from submission data - matching QA structure exactly
function computeOverall(sub: FinanceSubmission) {
  let total = 0;
  let max = 0;

  FINANCE_SECTIONS.forEach(section => {
    section.questions.forEach(q => {
      // Look for key with full question text (format: "Q1: Full question text?")
      const questionKeyFull = `${q.id}: ${q.text}`;
      const response = sub[questionKeyFull] || sub[`${section.prefix}_${q.id}`] || sub[q.id];
      const weight = q.weight;

      max += weight;

      if (!response) {
        // No response
      } else if (String(response).toLowerCase() === 'yes') {
        total += weight;
      } else if (isNA(response)) {
        // NA doesn't affect score
      }
    });
  });

  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return { total, max, pct };
}

// Build sections with question details - matching QA structure
function buildSections(sub: FinanceSubmission, questionImages: Record<string, string[]>) {
  const sections: Record<string, { 
    title: string;
    rows: any[]; 
    score: number; 
    maxScore: number; 
    remarks?: string 
  }> = {};

  FINANCE_SECTIONS.forEach((section) => {
    const sectionData = {
      title: section.title,
      score: 0,
      maxScore: 0,
      rows: [] as any[],
      remarks: undefined as string | undefined
    };

    section.questions.forEach((q, idx) => {
      // Look for key with full question text (format: "Q1: Full question text?") or alternate formats
      const questionKeyFull = `${q.id}: ${q.text}`;
      const prefixKey = `${section.prefix}_${q.id}`;
      const response = sub[questionKeyFull] || sub[prefixKey] || sub[q.id];
      
      const remarkKey = `${q.id} Remarks`;
      const prefixRemarkKey = `${prefixKey}_remark`;
      const remark = sub[remarkKey] || sub[prefixRemarkKey] || sub[`${q.id}_remark`] || '';
      
      const weight = q.weight;
      sectionData.maxScore += weight;

      let score = 0;
      const responseStr = response ? String(response).toLowerCase() : '';
      if (responseStr === 'yes') {
        score = weight;
        sectionData.score += weight;
      } else if (isNA(response)) {
        // NA doesn't affect score
      }

      sectionData.rows.push({
        id: q.id,
        questionId: q.id,
        question: q.text,
        answer: responseStr === 'yes' ? 'Yes' : responseStr === 'no' ? 'No' : isNA(response) ? 'N/A' : '',
        score: responseStr === 'yes' ? weight : (isNA(response) ? 'NA' : 0),
        maxScore: weight,
        remark: remark
      });
    });

    // Get section remarks (format: "Section 1 Remarks" or "prefix_remarks")
    const remarksKey = `${section.title.split(':')[0]} Remarks`;
    const prefixRemarksKey = `${section.prefix}_remarks`;
    if (sub[remarksKey] || sub[prefixRemarksKey]) {
      sectionData.remarks = sub[remarksKey] || sub[prefixRemarksKey];
    }

    sections[section.id] = sectionData;
  });

  return sections;
}

export const buildFinancePDF = async (
  submissions: FinanceSubmission[],
  metadata: any = {},
  options: ReportOptions = {},
  questionImages: Record<string, string[]> = {}
) => {
  console.log('🖼️ Building Finance PDF with images:', Object.keys(questionImages).length, 'image sets');
  console.log('📸 Image keys:', Object.keys(questionImages));
  if (Object.keys(questionImages).length > 0) {
    console.log('📷 Sample image key:', Object.keys(questionImages)[0], '- Images:', questionImages[Object.keys(questionImages)[0]]?.length || 0);
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;
  const sub = submissions[0] || {} as any;

  // Debug: Log the submission data to see what keys are available
  console.log('📊 Finance submission data keys:', Object.keys(sub));
  console.log('📊 Sample question keys:', Object.keys(sub).filter(k => k.includes('Q')).slice(0, 10));
  console.log('📊 Full submission data:', sub);

  const title = options.title || 'Finance Audit Report';

  // Header: Title, Store, Metadata and Logo on the right
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(title, 14, y);

  // Add logo to top-right
  try {
    const areaX = 162;
    const areaY = 8;
    const areaW = 28;
    const areaH = 28;
    const innerPadding = 4;
    
    if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = EMBEDDED_LOGO;
      });
      const naturalW = imgEl.naturalWidth || imgEl.width || areaW;
      const naturalH = imgEl.naturalHeight || imgEl.height || areaH;
      const usableW = Math.max(4, areaW - innerPadding * 2);
      const usableH = Math.max(4, areaH - innerPadding * 2);
      const ratioEmbedded = Math.min(1, usableW / naturalW, usableH / naturalH);
      const drawW = Math.round(naturalW * ratioEmbedded);
      const drawH = Math.round(naturalH * ratioEmbedded);
      const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2);
      const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2);
      doc.addImage(EMBEDDED_LOGO, 'PNG', drawX, drawY, drawW, drawH);
    } else {
      await addCompanyLogo(doc);
    }
  } catch (e) {
    // ignore
  }

  // Store subtitle below title
  y += 4;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  const storeName = metadata.storeName || sub.storeName || sub.store_name || sub.Store || '';
  if (storeName) {
    doc.text(storeName, 14, y + 2);
  }

  // Metadata row: Date | Auditor | Store ID | Region
  const metaY = y + 8;
  const dateStr = metadata.date || sub.submissionTime || sub.date || sub.Date || '';
  const auditor = metadata.auditorName || sub.financeName || sub.financeAuditorName || sub.auditor || sub.Auditor || '';
  const sid = metadata.storeId || sub.storeId || sub.store_id || sub.StoreID || '';
  const region = metadata.region || sub.region || sub.Region || '';
  
  const metaLine = [] as string[];
  if (dateStr) metaLine.push(`${dateStr}`);
  if (auditor) metaLine.push(`Auditor: ${auditor}`);
  if (sid) metaLine.push(`Store: ${sid}`);
  if (region) metaLine.push(`Region: ${region}`);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 130, 145);
  if (metaLine.length) doc.text(metaLine.join('   |   '), 14, metaY);
  y = metaY + 12;

  // Overall performance summary
  const computed = computeOverall(sub);
  const totalFromSheet = (sub.totalScore !== undefined && sub.maxScore !== undefined);
  let total = totalFromSheet ? Number(sub.totalScore) : computed.total;
  const max = totalFromSheet ? Number(sub.maxScore) : computed.max;
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;

  // Draw summary cards
  const cardHeight = 42;
  const leftX = 14;
  const rightX = 110;

  // Left card: Overall Score
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(leftX, y, 90, cardHeight, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Score', leftX + 8, y + 10);
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text(`${total} / ${max}`, leftX + 8, y + 30);

  // Right card: Percentage with progress bar
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(rightX, y, 84, cardHeight, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('Percentage', rightX + 8, y + 10);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const pctColor = pct >= 80 ? [16, 185, 129] : pct >= 60 ? [245, 158, 11] : [239, 68, 68];
  doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
  doc.text(`${pct}%`, rightX + 8, y + 30);
  
  // Draw progress bar
  const barX = rightX + 8;
  const barY = y + 34;
  const barWidth = 84 - 16;
  const barHeight = 4;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');
  doc.setFillColor(pctColor[0], pctColor[1], pctColor[2]);
  doc.roundedRect(barX, barY, Math.max(4, Math.min(barWidth, Math.round((pct / 100) * barWidth))), barHeight, 2, 2, 'F');

  y += cardHeight + 12;

  // Build sections with question details
  const sections = buildSections(sub, questionImages);

  // Section-wise Summary Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Section-wise Performance Summary', 14, y);
  y += 8;

  // Build summary table data with percentages for progress bars
  const summaryData = Object.keys(sections).map(secKey => {
    const sec = sections[secKey];
    const sectionPercentage = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    const questions = sec.rows.length;
    return {
      title: sec.title,
      questions: String(questions),
      score: `${sec.score}/${sec.maxScore}`,
      percentage: sectionPercentage,
      percentageText: `${sectionPercentage}%`
    };
  });

  const summaryRows = summaryData.map(d => [
    d.title,
    d.questions,
    d.score,
    d.percentageText,
    '' // Empty cell for progress bar
  ]);

  autoTable(doc as any, {
    startY: y,
    head: [['Section', 'Questions', 'Score', '%', 'Progress']],
    body: summaryRows,
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      halign: 'center'
    },
    headStyles: { 
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 55, halign: 'left' }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const pctText = String(data.cell.raw);
        const pctValue = parseInt(pctText);
        if (!isNaN(pctValue)) {
          if (pctValue >= 90) {
            data.cell.styles.textColor = [16, 185, 129]; // Green
          } else if (pctValue >= 80) {
            data.cell.styles.textColor = [59, 130, 246]; // Blue
          } else if (pctValue >= 70) {
            data.cell.styles.textColor = [245, 158, 11]; // Amber
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }
      }
    },
    didDrawCell: (data: any) => {
      // Draw progress bar in the last column (Progress)
      if (data.section === 'body' && data.column.index === 4) {
        const rowIndex = data.row.index;
        const pct = summaryData[rowIndex].percentage;
        
        const barX = data.cell.x + 2;
        const barY = data.cell.y + data.cell.height / 2 - 3;
        const barWidth = data.cell.width - 4;
        const barHeight = 6;
        
        // Background (gray)
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');
        
        // Progress fill with color based on percentage
        if (pct > 0) {
          const fillWidth = Math.max(2, (pct / 100) * barWidth);
          
          if (pct >= 90) {
            doc.setFillColor(16, 185, 129); // Green
          } else if (pct >= 80) {
            doc.setFillColor(59, 130, 246); // Blue
          } else if (pct >= 70) {
            doc.setFillColor(245, 158, 11); // Amber
          } else {
            doc.setFillColor(239, 68, 68); // Red
          }
          
          doc.roundedRect(barX, barY, fillWidth, barHeight, 1, 1, 'F');
        }
      }
    }
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Add a separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, y, 194, y);
  y += 12;

  // Detailed Section Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Detailed Assessment', 14, y);
  y += 10;

  // Render each section
  Object.keys(sections).forEach(secKey => {
    const sec = sections[secKey];
    if (y > 250) { doc.addPage(); y = 15; }

    // Section header with score
    const sectionPercentage = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;

    doc.setFillColor(16, 185, 129);
    doc.roundedRect(14, y, 180, 12, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(sec.title, 18, y + 8);

    // Right-align score
    const scoreLabel = `Score: ${sec.score}/${sec.maxScore} (${sectionPercentage}%)`;
    const scoreWidth = (doc as any).getTextWidth(scoreLabel) || scoreLabel.length * 3.5;
    const maxRight = 14 + 180 - 8;
    const scoreX = Math.min(maxRight - scoreWidth, 160);
    doc.text(scoreLabel, scoreX, y + 8);
    y += 18;

    // Render each question individually
    sec.rows.forEach((rowData, rowIndex) => {
      // Check if we need a new page before question
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Render single question table
      const tableRows = [[rowData.question, rowData.answer, String(rowData.score), String(rowData.maxScore)]];
      autoTable(doc as any, {
        startY: y,
        head: [['Question', 'Response', 'Score', 'Max']],
        body: tableRows,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 95 },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' }
        },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            if (data.column.index === 1) {
              const text = String(data.cell.raw).toLowerCase();
              if (text === 'yes') {
                data.cell.styles.textColor = [34, 197, 94];
                data.cell.styles.fillColor = [240, 253, 244];
                data.cell.styles.fontStyle = 'bold';
              } else if (text === 'no') {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fillColor = [254, 242, 242];
                data.cell.styles.fontStyle = 'bold';
              } else if (text === 'n/a') {
                data.cell.styles.textColor = [107, 114, 128];
                data.cell.styles.fillColor = [243, 244, 246];
                data.cell.styles.fontStyle = 'bold';
              }
            }
            if (data.column.index === 2) {
              const scoreNum = Number(data.cell.raw);
              if (!isNaN(scoreNum) && scoreNum > 0) {
                data.cell.styles.textColor = [34, 197, 94];
              }
            }
          }
        }
      });
      y = (doc as any).lastAutoTable.finalY + 2;

      // Render per-question remark immediately below question
      if (rowData.remark && rowData.remark.trim()) {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128);
        doc.text('💬 Comment:', 18, y + 4);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const remarkLines = doc.splitTextToSize(rowData.remark, 160);
        doc.text(remarkLines, 40, y + 4);

        y += (remarkLines.length * 4) + 3;
      }

      // Render images for this question
      if (rowData.questionId) {
        const images = questionImages[rowData.questionId];

        if (images && images.length > 0) {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }

          const imagesPerRow = 5;
          const imageWidth = 32;
          const imageHeight = 24;
          const spacing = 3;
          const startX = 14;

          images.forEach((base64Image, idx) => {
            try {
              const col = idx % imagesPerRow;
              const row = Math.floor(idx / imagesPerRow);

              if (row > 0 && col === 0 && y + imageHeight > 270) {
                doc.addPage();
                y = 20;
              }

              const x = startX + col * (imageWidth + spacing);
              const currentY = y + row * (imageHeight + spacing);

              doc.addImage(base64Image, 'JPEG', x, currentY, imageWidth, imageHeight);

              doc.setDrawColor(203, 213, 225);
              doc.setLineWidth(0.5);
              doc.rect(x, currentY, imageWidth, imageHeight);

            } catch (err) {
              console.warn('Could not add image to PDF:', err);
            }
          });

          const totalRows = Math.ceil(images.length / imagesPerRow);
          y += (imageHeight + spacing) * totalRows + 2;
        }
      }

      y += 4;
    });

    // Display section remarks if they exist
    const sectionRemarks = sub[`${secKey}_remarks`];
    if (sectionRemarks && sectionRemarks.trim()) {
      const remarksLines = doc.splitTextToSize(sectionRemarks, 170);
      const remarksHeight = Math.max(18, (remarksLines.length * 5) + 12);

      if (y + remarksHeight + 20 > 285) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(254, 249, 195);
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(14, y, 180, remarksHeight, 2, 2, 'FD');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text('Remarks:', 18, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(remarksLines, 18, y + 14, { maxWidth: 170 });
      y += remarksHeight + 8;
    }
  });

  // Add Signatures Section
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Signatures', 14, y);
  y += 10;

  const auditorSignature = sub.auditorSignature || sub.auditor_signature || sub['Auditor Signature'];
  const smSignature = sub.smSignature || sub.sm_signature || sub['SM Signature'];

  const signatureBoxWidth = 85;
  const signatureBoxHeight = 40;
  const leftBoxX = 14;
  const rightBoxX = 109;

  // Auditor Signature Box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(leftBoxX, y, signatureBoxWidth, signatureBoxHeight, 2, 2, 'S');

  if (auditorSignature && auditorSignature.startsWith('data:image')) {
    try {
      doc.addImage(auditorSignature, 'PNG', leftBoxX + 5, y + 5, signatureBoxWidth - 10, signatureBoxHeight - 15);
    } catch (err) {
      console.warn('Could not add auditor signature to PDF:', err);
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature not provided', leftBoxX + signatureBoxWidth / 2, y + signatureBoxHeight / 2, { align: 'center' });
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Finance Auditor Signature', leftBoxX, y + signatureBoxHeight + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  if (auditor) {
    doc.text(auditor, leftBoxX, y + signatureBoxHeight + 12);
  }

  // Store Manager Signature Box
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, y, signatureBoxWidth, signatureBoxHeight, 2, 2, 'S');

  if (smSignature && smSignature.startsWith('data:image')) {
    try {
      doc.addImage(smSignature, 'PNG', rightBoxX + 5, y + 5, signatureBoxWidth - 10, signatureBoxHeight - 15);
    } catch (err) {
      console.warn('Could not add SM signature to PDF:', err);
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature not provided', rightBoxX + signatureBoxWidth / 2, y + signatureBoxHeight / 2, { align: 'center' });
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Manager Signature', rightBoxX, y + signatureBoxHeight + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const smName = metadata.smName || sub.smName || '';
  if (smName) {
    doc.text(smName, rightBoxX, y + signatureBoxHeight + 12);
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  return doc;
};

export default buildFinancePDF;
