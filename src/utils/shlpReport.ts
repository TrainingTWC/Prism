import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SHLPSubmission } from '../../services/shlpDataService';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

interface ReportOptions {
  title?: string;
  logoDataUrl?: string | null;
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
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load image: ${url}`));
    };

    const fullUrl = url.startsWith('http') ? url :
      `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    img.src = fullUrl;
  });
}

async function addCompanyLogo(doc: jsPDF): Promise<void> {
  const areaX = 162;
  const areaY = 8;
  const areaW = 28;
  const areaH = 28;
  const innerPadding = 4;

  const logoPaths = [
    '/assets/logo.png',
    '/assets/logo.svg',
    '/assets/logo.webp',
    `${window.location.origin}/assets/logo.png`,
    `${window.location.origin}/assets/logo.svg`,
    `${window.location.origin}/assets/logo.webp`,
    `${window.location.origin}/prism-logo.png`,
    '/prism-logo.png',
    './prism-logo.png'
  ];

  let logoLoaded = false;

  for (const logoPath of logoPaths) {
    try {
      const logoData = await loadImage(logoPath);
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const naturalW = img.naturalWidth || img.width || areaW;
            const naturalH = img.naturalHeight || img.height || areaH;
            const usableW = Math.max(4, areaW - innerPadding * 2);
            const usableH = Math.max(4, areaH - innerPadding * 2);
            const ratio = Math.min(1, usableW / naturalW, usableH / naturalH);
            const drawW = Math.round(naturalW * ratio);
            const drawH = Math.round(naturalH * ratio);
            const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2);
            const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2);
            doc.addImage(logoData, 'PNG', drawX, drawY, drawW, drawH);
            logoLoaded = true;
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error('failed to load fallback image'));
        img.src = logoData;
      });
      if (logoLoaded) break;
    } catch (err) {
      console.warn(`Could not load logo from: ${logoPath}`);
    }
  }
  
  if (!logoLoaded) {
    // Fallback: Styled text logo
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(160, 8, 34, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PRISM', 177, 22, { align: 'center' });
  }
}

// Define SHLP sections and questions
const SHLP_SECTIONS = [
  {
    id: 'SHLP_STORE_READINESS',
    title: 'Store Readiness',
    items: [
      { id: 'SHLP_1', q: 'Complete Opening, Mid, and Closing checklists', negativeScore: true },
      { id: 'SHLP_2', q: 'Ensure store readiness before opening', negativeScore: true },
      { id: 'SHLP_3', q: 'Check VM of food case & merchandise wall (stocked and fixed)', negativeScore: true },
      { id: 'SHLP_4', q: 'Ensure marketing & promotional collaterals are correctly displayed' }
    ]
  },
  {
    id: 'SHLP_PRODUCT_QUALITY',
    title: 'Product Quality & Standards',
    items: [
      { id: 'SHLP_5', q: 'Conduct dial-in checks for coffee & food', negativeScore: true },
      { id: 'SHLP_6', q: 'Do not allow sub-standard products to be served' },
      { id: 'SHLP_7', q: 'Ensure recipes, SOPs, and standards are followed' },
      { id: 'SHLP_8', q: 'Understand impact on COGS, wastage & variances' },
      { id: 'SHLP_9', q: 'Ensure sampling activation & coffee tasting' }
    ]
  },
  {
    id: 'SHLP_CASH_ADMIN',
    title: 'Cash & Administration',
    items: [
      { id: 'SHLP_10', q: 'Check petty cash, float & safe amount' },
      { id: 'SHLP_11', q: 'Fill cash log book for handover', negativeScore: true },
      { id: 'SHLP_12', q: 'Arrange float/change for POS' },
      { id: 'SHLP_13', q: 'Complete GRN & petty cash entries', negativeScore: true },
      { id: 'SHLP_14', q: 'Follow ordering flow/schedule' }
    ]
  },
  {
    id: 'SHLP_TEAM_MGMT',
    title: 'Team Management',
    items: [
      { id: 'SHLP_15', q: 'Conduct team briefing (updates, promotions, grooming)', negativeScore: true },
      { id: 'SHLP_16', q: 'Communicate shift goals & targets' },
      { id: 'SHLP_17', q: 'Motivate team to follow TWC standards' },
      { id: 'SHLP_18', q: 'Plan team breaks effectively' },
      { id: 'SHLP_19', q: 'Identify bottlenecks & support team- (C.O.F.F.E.E, LEAST, R.O.A.S.T and clearing station blockages or hurdles)' },
      { id: 'SHLP_20', q: 'Recognize top performers', positiveScore: true },
      { id: 'SHLP_21', q: 'Provide task-specific feedback to partners' },
      { id: 'SHLP_22', q: 'Share performance inputs with Store Manager' }
    ]
  },
  {
    id: 'SHLP_OPERATIONS',
    title: 'Operations & Availability',
    items: [
      { id: 'SHLP_23', q: 'Monitor product availability & update team', negativeScore: true },
      { id: 'SHLP_24', q: 'Utilize lean periods for training & coaching' },
      { id: 'SHLP_25', q: 'Utilize peak periods for customer experience & business' },
      { id: 'SHLP_26', q: 'Adjust deployment based on shift need' },
      { id: 'SHLP_27', q: 'Adjust shift priorities as required' },
      { id: 'SHLP_28', q: 'Follow receiving, storing & thawing guidelines', positiveScore: true },
      { id: 'SHLP_29', q: 'Remove thawing products as per schedule' }
    ]
  },
  {
    id: 'SHLP_SAFETY',
    title: 'Safety & Compliance',
    items: [
      { id: 'SHLP_30', q: 'Follow key handling process and proactively hands over in case going on leave or weekly off' },
      { id: 'SHLP_31', q: 'Follow Lost & Found SOP' },
      { id: 'SHLP_32', q: 'Log maintenance issues' }
    ]
  },
  {
    id: 'SHLP_SHIFT_CLOSING',
    title: 'Shift Closing',
    items: [
      { id: 'SHLP_33', q: 'Complete all closing tasks thoroughly', hasNA: true }
    ]
  },
  {
    id: 'SHLP_BUSINESS',
    title: 'Business Acumen',
    items: [
      { id: 'SHLP_34', q: 'is able to do Shift Performance analysis (PSA) like LTO,LA, IPS, ADS, AOV drivers, CPI, MA,QA Etc. & has BSC understanding', positiveScore: true },
      { id: 'SHLP_35', q: 'check and keep the record of EB Units as per their shift' }
    ]
  }
];

export async function buildSHLPPDF(
  submissions: SHLPSubmission[],
  metadata: any,
  options: ReportOptions = {}
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 18;

  if (!submissions || submissions.length === 0) {
    doc.text('No SHLP data available', 14, 20);
    return doc;
  }

  const first = submissions[0];

  // Header title
  const title = options.title || 'SHLP Certification Assessment';
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
    // Logo loading failed, continue without logo
  }

  // Metadata row: Date/Time only (formatted)
  y += 4;
  const dateStr = metadata.date || first['Submission Time'] || '';
  const auditor = metadata.auditorName || first['Auditor Name'] || '';
  let formattedDate = '';
  
  if (dateStr) {
    try {
      // Parse the date and format it as "DD/MM/YYYY, HH:MM AM/PM"
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      formattedDate = `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      formattedDate = dateStr;
    }
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 130, 145);
  if (formattedDate) doc.text(formattedDate, 14, y + 2);
  y += 10;

  // Process questions first to calculate actual scores
  interface SectionData {
    title: string;
    rows: Array<{
      id: string;
      question: string;
      answer: string;
      score: number;
      maxScore: number;
      remarks?: string;
    }>;
    score: number;
    maxScore: number;
    remarks?: string;
  }

  const sections: Record<string, SectionData> = {};
  
  // Initialize sections
  SHLP_SECTIONS.forEach(sec => {
    sections[sec.id] = {
      title: sec.title,
      rows: [],
      score: 0,
      maxScore: 0
    };
  });

  // Fill rows from submission
  SHLP_SECTIONS.forEach(section => {
    section.items.forEach(item => {
      const questionKey = item.id;
      const response = (first as any)[questionKey] || '';
      const remarksKey = `${questionKey}_remarks`;
      const remarks = (first as any)[remarksKey] || '';

      let score = 0;
      let maxForQuestion = 0;
      let displayAnswer = '';

      // Handle N/A responses
      if (response === 'NA' || response === 'N/A') {
        displayAnswer = 'NA';
        // Don't add to score or maxScore
      } else if (item.negativeScore) {
        // Negative scoring: Yes = +2, No = -2
        maxForQuestion = 2;
        if (response === 'Yes') {
          score = 2;
          displayAnswer = 'Yes';
        } else if (response === 'No') {
          score = -2;
          displayAnswer = 'No';
        } else {
          displayAnswer = String(response);
        }
      } else if (item.positiveScore) {
        // Positive scoring: 0,1,2,+2 (where +2 is grace marks - max is 2 but score can be 4)
        maxForQuestion = 2;
        if (response === '+2') {
          score = 4;  // 4 out of 2 (exceeds 100% - grace marks)
          displayAnswer = '+2 (Exceptional)';
        } else {
          const points = parseInt(response);
          if (!isNaN(points)) {
            score = points;
            displayAnswer = String(points);
          } else {
            displayAnswer = String(response);
          }
        }
      } else {
        // Default scoring: 0,1,2
        maxForQuestion = 2;
        const points = parseInt(response);
        if (!isNaN(points)) {
          score = points;
          displayAnswer = String(points);
        } else {
          displayAnswer = String(response);
        }
      }

      sections[section.id].rows.push({
        id: questionKey,
        question: item.q,
        answer: displayAnswer,
        score: score,
        maxScore: maxForQuestion,
        remarks: remarks
      });

      sections[section.id].score += score;
      if (response !== 'NA' && response !== 'N/A') {
        sections[section.id].maxScore += maxForQuestion;
      }
    });
  });

  // Calculate total score from all sections
  let totalScore = 0;
  let maxScore = 0;
  Object.values(sections).forEach(sec => {
    totalScore += sec.score;
    maxScore += sec.maxScore;
  });
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Employee Information Section (before score cards)
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 38, 4, 4, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Employee Information', 18, y + 7);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  // Row 1: Employee Name and ID
  const empName = metadata.employeeName || first['Employee Name'] || '';
  const empId = metadata.employeeId || first['Employee ID'] || '';
  doc.setFont('helvetica', 'bold');
  doc.text('Employee:', 18, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${empName}${empId ? ` (${empId})` : ''}`, 45, y + 15);
  
  // Row 2: Store (show name, not ID)
  const storeDisplayName = metadata.storeName || first['Store'] || '';
  doc.setFont('helvetica', 'bold');
  doc.text('Store:', 18, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(storeDisplayName, 45, y + 22);
  
  // Row 3: Area Manager and Trainer (side by side) - show names, not IDs
  const amName = metadata.amName || '';
  const trainerName = metadata.trainerName || '';
  doc.setFont('helvetica', 'bold');
  doc.text('Area Manager:', 18, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(amName, 45, y + 29);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Trainer:', 110, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(trainerName, 130, y + 29);
  
  // Row 4: Auditor
  doc.setFont('helvetica', 'bold');
  doc.text('Auditor:', 18, y + 36);
  doc.setFont('helvetica', 'normal');
  doc.text(auditor, 45, y + 36);

  y += 46;

  // Draw summary cards (after employee info)
  const cardHeight = 42;
  const leftX = 14;
  const rightX = 110;

  // Left card: Overall Score
  doc.setFillColor(247, 249, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftX, y, 90, cardHeight, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Score', leftX + 8, y + 10);
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalScore} / ${maxScore}`, leftX + 8, y + 30);

  // Right card: Percentage with progress bar
  doc.setFillColor(247, 249, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, 84, cardHeight, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance', rightX + 8, y + 10);
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  doc.text(`${pct}%`, rightX + 8, y + 24);

  // Progress bar
  const barY = y + 30;
  const barW = 68;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightX + 8, barY, barW, 6, 3, 3, 'FD');
  if (pct > 0) {
    const fillW = (barW * pct) / 100;
    const color = pct >= 80 ? [34, 197, 94] : pct >= 60 ? [251, 191, 36] : [239, 68, 68];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(rightX + 8, barY, fillW, 6, 3, 3, 'F');
  }

  y += cardHeight + 10;

  // Render each section
  let questionSerialNo = 1;
  Object.keys(sections).forEach(secKey => {
    const sec = sections[secKey];
    if (y > 250) { doc.addPage(); y = 15; }

    // Section header
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(14, y, 182, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const sectionPercent = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    doc.text(`${sec.title} — ${sec.score}/${sec.maxScore} (${sectionPercent}%)`, 18, y + 7);
    y += 14;

    // Section table with serial numbers
    const tableRows = sec.rows.map(row => {
      const rowData = [
        String(questionSerialNo++), // Serial number
        row.question,
        row.answer || '-', // Show dash if empty
        `${row.score}/${row.maxScore}`,
        row.remarks || '-' // Show dash if empty
      ];
      return rowData;
    });

    autoTable(doc, {
      startY: y,
      head: [['#', 'Question', 'Response', 'Score', 'Remarks']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [226, 232, 240],
        textColor: [51, 65, 85],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [71, 85, 105]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, // Serial number column
        1: { cellWidth: 62 }, // Question column
        2: { cellWidth: 25, halign: 'center' }, // Response column
        3: { cellWidth: 20, halign: 'center' }, // Score column
        4: { cellWidth: 57 } // Remarks column
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        y = data.cursor?.y || y;
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // Section remarks if available
    if (sec.remarks) {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`Section Remarks: ${sec.remarks}`, 14, y);
      y += 8;
    }
  });

  // Overall remarks if available
  if (first.overallRemarks || first.overall_remarks) {
    if (y > 260) { doc.addPage(); y = 15; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Overall Remarks:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const remarks = first.overallRemarks || first.overall_remarks || '';
    const lines = doc.splitTextToSize(remarks, 182);
    doc.text(lines, 14, y);
  }

  return doc;
}
