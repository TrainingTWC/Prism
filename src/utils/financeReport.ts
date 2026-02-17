import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

interface FinanceSubmission {
  [key: string]: any;
}

interface FinanceHistoricData {
  storeId: string;
  auditDate: string;
  region: string;
  percentage: number;
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
  questionImages: Record<string, string[]> = {},
  historicData: FinanceHistoricData[] = []
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
  const dateStr = formatDate(metadata.date || sub.submissionTime || sub.date || sub.Date || '');
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

  // Count passed items (Yes answers)
  let passedItems = 0;
  let totalItems = 0;
  FINANCE_SECTIONS.forEach(section => {
    section.questions.forEach(q => {
      const questionKey = Object.keys(sub).find(k => k.startsWith(`${q.id}:`));
      if (questionKey) {
        totalItems++;
        const answer = sub[questionKey];
        if (answer && String(answer).toLowerCase() === 'yes') {
          passedItems++;
        }
      }
    });
  });

  // Classification grade based on percentage
  let classificationGrade = 'Non-Compliance';
  let gradeColor: [number, number, number] = [239, 68, 68]; // Red
  if (pct >= 80) {
    classificationGrade = 'Satisfactory Compliance';
    gradeColor = [16, 185, 129]; // Green
  } else if (pct >= 60) {
    classificationGrade = 'Partial Compliance';
    gradeColor = [245, 158, 11]; // Amber
  }

  // Draw three summary cards in a row
  const cardHeight = 32;
  const cardWidth = 59;
  const cardSpacing = 4;
  const card1X = 14;
  const card2X = card1X + cardWidth + cardSpacing;
  const card3X = card2X + cardWidth + cardSpacing;

  // Card 1: Passed Items
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(card1X, y, cardWidth, cardHeight, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'normal');
  doc.text('Passed items:', card1X + cardWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`${passedItems} out of a total ${totalItems}`, card1X + cardWidth / 2, y + 22, { align: 'center' });

  // Card 2: Weighted Percentage Score
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(card2X, y, cardWidth, cardHeight, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'normal');
  doc.text('Weighted Percentage Score:', card2X + cardWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const pctColor = pct >= 80 ? [16, 185, 129] : pct >= 60 ? [245, 158, 11] : [239, 68, 68];
  doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
  doc.text(`${pct}% (${total}/${max})`, card2X + cardWidth / 2, y + 22, { align: 'center' });

  // Card 3: Result Classification Grade
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(card3X, y, cardWidth, cardHeight, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'normal');
  doc.text('Result classification grade:', card3X + cardWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.text(classificationGrade, card3X + cardWidth / 2, y + 22, { align: 'center' });

  y += cardHeight + 12;

  // Build sections with question details (needed for section scores)
  const sections = buildSections(sub, questionImages);

  // Build summary table data with percentages
  const summaryData = Object.keys(sections).map(secKey => {
    const sec = sections[secKey];
    const sectionPercentage = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    const questions = sec.rows.length;
    return {
      title: sec.title.replace(/Section \d+: /, ''), // Remove "Section X: " prefix
      questions: String(questions),
      score: `${sec.score}/${sec.maxScore}`,
      percentage: sectionPercentage,
      percentageText: `${sectionPercentage}%`
    };
  });

  // Side-by-side: Historic Scores (left) and Section Score (right)
  if (y > 180) {
    doc.addPage();
    y = 20;
  }

  const leftBoxX = 14;
  const rightBoxX = 109;
  const boxWidth = 85;
  const boxHeight = 110;
  const boxY = y;

  // LEFT BOX: Historical Scores (Bar Chart)
  if (historicData && historicData.length > 0) {
    // Draw box border and background
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(leftBoxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');

    // Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Historical Scores', leftBoxX + boxWidth / 2, boxY + 8, { align: 'center' });

    // Prepare data (limit to last 6 audits for clarity)
    const maxBars = 6;
    const dataPoints = historicData.slice(-maxBars);

    if (dataPoints.length > 0) {
      const chartAreaX = leftBoxX + 5;
      const chartAreaY = boxY + 18;
      const chartWidth = boxWidth - 10;
      const chartHeight = boxHeight - 35;
      const barSpacing = 2;
      const barWidth = (chartWidth - (dataPoints.length - 1) * barSpacing) / dataPoints.length;

      // Draw bars
      dataPoints.forEach((dataPoint, idx) => {
        const pctValue = Math.min(100, Math.max(0, dataPoint.percentage));
        const barHeight = (pctValue / 100) * chartHeight;
        const barX = chartAreaX + idx * (barWidth + barSpacing);
        const barY = chartAreaY + chartHeight - barHeight;

        // Bar color - orange/amber like reference
        doc.setFillColor(251, 191, 36); // Amber-400
        doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');

        // Score label on top of bar
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(String(Math.round(pctValue)), barX + barWidth / 2, barY - 2, { align: 'center' });

        // Date label below bar (smaller, not rotated)
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        const dateLabel = dataPoint.auditDate;
        const labelX = barX + barWidth / 2;
        const labelY = chartAreaY + chartHeight + 4;
        
        doc.text(dateLabel, labelX, labelY, { align: 'center' });
      });

      // Add "Date of Audit" label at bottom
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(75, 85, 99);
      doc.text('Date of Audit', leftBoxX + boxWidth / 2, boxY + boxHeight - 2, { align: 'center' });
    }
  }

  // RIGHT BOX: Section Score (Horizontal Bar Chart)
  // Draw box border and background
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightBoxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');

  // Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Section Score', rightBoxX + boxWidth / 2, boxY + 8, { align: 'center' });

  // Draw horizontal bars for sections
  const sectionChartX = rightBoxX + 4;
  const sectionChartY = boxY + 15;
  const sectionChartWidth = boxWidth - 8;
  const sectionChartHeight = boxHeight - 20;
  const rowHeight = Math.min(13, (sectionChartHeight) / summaryData.length);
  const barHeight = 6;
  const labelWidth = 40;

  summaryData.forEach((section, idx) => {
    const rowY = sectionChartY + idx * rowHeight;
    
    // Section label (left side, remove "Section X: " prefix for full title)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    const labelText = section.title.replace(/^Section \d+:\s*/, '');
    doc.text(labelText, sectionChartX, rowY + 4);

    // Bar area
    const barStartX = sectionChartX + labelWidth;
    const maxBarWidth = sectionChartWidth - labelWidth - 10; // Leave space for label and percentage
    const filledBarWidth = (section.percentage / 100) * maxBarWidth;
    const barY = rowY;

    // Bar background (light gray)
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(barStartX, barY, maxBarWidth, barHeight, 1, 1, 'F');

    // Bar fill (blue)
    if (filledBarWidth > 0) {
      doc.setFillColor(96, 165, 250); // Blue-400
      doc.roundedRect(barStartX, barY, Math.max(2, filledBarWidth), barHeight, 1, 1, 'F');
    }

    // Percentage value (right side)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(String(section.percentage), barStartX + maxBarWidth + 3, barY + 5);
  });

  // Add "Score" label at bottom right
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(75, 85, 99);
  doc.text('Score', rightBoxX + boxWidth / 2, boxY + boxHeight - 2, { align: 'center' });

  y = boxY + boxHeight + 12;

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

    // Section header with score - minimal style
    const sectionPercentage = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, y, 194, y);
    y += 2;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(sec.title, 14, y + 4);

    // Right-align score
    doc.setFontSize(10);
    const scoreLabel = `${sec.score}/${sec.maxScore} (${sectionPercentage}%)`;
    const scoreWidth = (doc as any).getTextWidth(scoreLabel) || scoreLabel.length * 3.5;
    doc.setTextColor(107, 114, 128);
    doc.text(scoreLabel, 194 - scoreWidth, y + 4);
    y += 10;

    // Render each question in minimal format
    sec.rows.forEach((rowData, rowIndex) => {
      // Check if we need a new page before question
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      // Question number and text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`Q${rowIndex + 1}.`, 18, y + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const questionLines = doc.splitTextToSize(rowData.question, 135);
      doc.text(questionLines, 26, y + 3);

      // Answer and score on the same line
      const answerText = String(rowData.answer).toUpperCase();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      // Color code answer
      if (answerText === 'YES') {
        doc.setTextColor(34, 197, 94);
      } else if (answerText === 'NO') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(107, 114, 128);
      }
      doc.text(answerText, 165, y + 3);

      // Score
      doc.setTextColor(71, 85, 105);
      doc.text(`${rowData.score}/${rowData.maxScore}`, 182, y + 3);

      const questionHeight = questionLines.length * 4;
      y += Math.max(5, questionHeight);

      // Render per-question remark if exists
      if (rowData.remark && rowData.remark.trim()) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128);
        const remarkLines = doc.splitTextToSize(rowData.remark, 165);
        doc.text(remarkLines, 26, y + 2);

        y += (remarkLines.length * 3) + 3;
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

  // Add Custom Fields Section
  // Define standard fields to exclude from custom fields display
  const standardFields = [
    'timestamp', 'date', 'storeId', 'storeName', 'region', 'auditor', 'sm',
    'auditorSignature', 'auditor_signature', 'Auditor Signature',
    'smSignature', 'sm_signature', 'SM Signature',
    'totalScore', 'weightedPercentage', 'classification', 'overallRemarks',
    'overall_remarks', 'Overall Remarks'
  ];

  // Add all section-related fields to exclude
  FINANCE_SECTIONS.forEach(sec => {
    const secKey = sec.prefix;
    standardFields.push(
      `${secKey}_score`,
      `${secKey}_percentage`,
      `${secKey}_remarks`
    );
    sec.questions.forEach(q => {
      standardFields.push(`${secKey}_${q.id}`);
    });
  });

  // Filter custom fields
  const customFields: { [key: string]: any } = {};
  Object.keys(sub).forEach(key => {
    if (!standardFields.includes(key) && sub[key] !== null && sub[key] !== undefined && sub[key] !== '') {
      customFields[key] = sub[key];
    }
  });

  // Display custom fields if any exist
  const customFieldKeys = Object.keys(customFields);
  if (customFieldKeys.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Additional Information', 14, y);
    y += 10;

    // Render each custom field
    customFieldKeys.forEach(key => {
      const value = customFields[key];
      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Convert value to string
      let displayValue = '';
      if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      } else {
        displayValue = String(value);
      }

      const valueLines = doc.splitTextToSize(displayValue, 150);
      const fieldHeight = (valueLines.length * 5) + 8;

      if (y + fieldHeight + 10 > 285) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`${displayKey}:`, 18, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(valueLines, 18, y + 6);
      
      y += fieldHeight + 2;
    });

    y += 8;
  }

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
