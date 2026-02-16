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
    scoreKey: 'Store_Readiness_Score',
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
    scoreKey: 'Product_Quality_Score',
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
    scoreKey: 'Cash_Admin_Score',
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
    scoreKey: 'Team_Management_Score',
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
    scoreKey: 'Operations_Score',
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
    scoreKey: 'Safety_Score',
    items: [
      { id: 'SHLP_30', q: 'Follow key handling process and proactively hands over in case going on leave or weekly off' },
      { id: 'SHLP_31', q: 'Follow Lost & Found SOP' },
      { id: 'SHLP_32', q: 'Log maintenance issues' }
    ]
  },
  {
    id: 'SHLP_SHIFT_CLOSING',
    title: 'Shift Closing',
    scoreKey: '',
    items: [
      { id: 'SHLP_33', q: 'Complete all closing tasks thoroughly', hasNA: true }
    ]
  },
  {
    id: 'SHLP_BUSINESS',
    title: 'Business Acumen',
    scoreKey: 'Business_Score',
    items: [
      { id: 'SHLP_34', q: 'is able to do Shift Performance analysis (PSA) like LTO,LA, IPS, ADS, AOV drivers, CPI, MA,QA Etc. & has BSC understanding', positiveScore: true },
      { id: 'SHLP_35', q: 'check and keep the record of EB Units as per their shift' }
    ]
  }
];

// Helper to add embedded logo
async function addLogo(doc: jsPDF): Promise<void> {
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
      const ratio = Math.min(1, usableW / naturalW, usableH / naturalH);
      const drawW = Math.round(naturalW * ratio);
      const drawH = Math.round(naturalH * ratio);
      const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2);
      const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2);
      doc.addImage(EMBEDDED_LOGO, 'PNG', drawX, drawY, drawW, drawH);
    } else {
      await addCompanyLogo(doc);
    }
  } catch (e) {
    // Logo loading failed, continue without logo
  }
}

// Process a single submission into section scores
function processSubmission(sub: any) {
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
  }

  const sections: Record<string, SectionData> = {};

  SHLP_SECTIONS.forEach(sec => {
    sections[sec.id] = {
      title: sec.title,
      rows: [],
      score: 0,
      maxScore: 0
    };
  });

  SHLP_SECTIONS.forEach(section => {
    section.items.forEach(item => {
      const response = (sub as any)[item.id] || '';
      const remarksKey = `${item.id}_remarks`;
      const remarks = (sub as any)[remarksKey] || '';

      let score = 0;
      let maxForQuestion = 0;
      let displayAnswer = '';

      if (response === 'NA' || response === 'N/A') {
        displayAnswer = 'NA';
      } else if ((item as any).negativeScore) {
        maxForQuestion = 2;
        if (response === 'Yes') { score = 2; displayAnswer = 'Yes'; }
        else if (response === 'No') { score = -2; displayAnswer = 'No'; }
        else { displayAnswer = String(response); }
      } else if ((item as any).positiveScore) {
        maxForQuestion = 2;
        if (response === '+2') { score = 4; displayAnswer = '+2 (Exceptional)'; }
        else {
          const points = parseInt(response);
          if (!isNaN(points)) { score = points; displayAnswer = String(points); }
          else { displayAnswer = String(response); }
        }
      } else {
        maxForQuestion = 2;
        const points = parseInt(response);
        if (!isNaN(points)) { score = points; displayAnswer = String(points); }
        else { displayAnswer = String(response); }
      }

      sections[section.id].rows.push({
        id: item.id,
        question: item.q,
        answer: displayAnswer,
        score,
        maxScore: maxForQuestion,
        remarks
      });

      sections[section.id].score += score;
      if (response !== 'NA' && response !== 'N/A') {
        sections[section.id].maxScore += maxForQuestion;
      }
    });
  });

  let totalScore = 0;
  let maxScore = 0;
  Object.values(sections).forEach(sec => {
    totalScore += sec.score;
    maxScore += sec.maxScore;
  });
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return { sections, totalScore, maxScore, pct };
}

// Format date string
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateStr;
  }
}

// Resolve store name from mapping
function resolveStoreName(storeId: string, storeMapping?: any[]): string {
  if (!storeMapping || !storeId) return storeId;
  const store = storeMapping.find((s: any) => s.id === storeId);
  return store?.name || storeId;
}

// Resolve AM name from list 
function resolveAMName(amId: string, amList?: any[]): string {
  if (!amList || !amId) return amId;
  const am = amList.find((a: any) => a.id === amId);
  return am?.name || amId;
}

// Resolve employee name from directory
function resolveEmployeeName(empId: string, empDir?: Record<string, any>): string {
  if (!empDir || !empId) return empId;
  const key = empId.toString().trim().toUpperCase();
  return empDir[key]?.empname || empId;
}

// ==================== INDIVIDUAL REPORT (single submission) ====================
async function buildIndividualReport(
  doc: jsPDF,
  submission: SHLPSubmission,
  metadata: any,
  _options: ReportOptions = {}
): Promise<number> {
  let y = 18;
  const first = submission;

  const title = _options.title || 'SHLP Certification Assessment';
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(title, 14, y);

  await addLogo(doc);

  y += 4;
  const dateStr = metadata.date || first['Submission Time'] || '';
  const formattedDate = formatDate(dateStr);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 130, 145);
  if (formattedDate) doc.text(formattedDate, 14, y + 2);
  y += 10;

  const { sections, totalScore, maxScore, pct } = processSubmission(first);

  // Employee Information Section
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
  
  const empName = metadata.employeeName || first['Employee Name'] || '';
  const empId = metadata.employeeId || first['Employee ID'] || '';
  doc.setFont('helvetica', 'bold');
  doc.text('Employee:', 18, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${empName}${empId ? ` (${empId})` : ''}`, 45, y + 15);
  
  const storeDisplayName = metadata.storeName || resolveStoreName(first['Store'], metadata.storeMapping) || first['Store'] || '';
  doc.setFont('helvetica', 'bold');
  doc.text('Store:', 18, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(storeDisplayName, 45, y + 22);
  
  const amName = metadata.amName || resolveAMName(first['Area Manager'], metadata.amList) || '';
  const trainerName = metadata.trainerName || first['Trainer'] || '';
  doc.setFont('helvetica', 'bold');
  doc.text('Area Manager:', 18, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(amName, 45, y + 29);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Trainer:', 110, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(trainerName, 130, y + 29);
  
  const auditor = metadata.auditorName || first['Auditor Name'] || '';
  doc.setFont('helvetica', 'bold');
  doc.text('Auditor:', 18, y + 36);
  doc.setFont('helvetica', 'normal');
  doc.text(auditor, 45, y + 36);

  y += 46;

  // Score cards
  const cardHeight = 42;
  const leftX = 14;
  const rightX = 110;

  doc.setFillColor(247, 249, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftX, y, 90, cardHeight, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Score', leftX + 8, y + 10);
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  doc.text(`${totalScore} / ${maxScore}`, leftX + 8, y + 30);

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

  // Render sections
  let questionSerialNo = 1;
  Object.keys(sections).forEach(secKey => {
    const sec = sections[secKey];
    if (y > 250) { doc.addPage(); y = 15; }

    const sectionPercent = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(14, y, 182, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${sec.title} — ${sec.score}/${sec.maxScore} (${sectionPercent}%)`, 18, y + 7);
    y += 14;

    const tableRows = sec.rows.map(row => [
      String(questionSerialNo++),
      row.question,
      row.answer || '-',
      `${row.score}/${row.maxScore}`,
      row.remarks || '-'
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Question', 'Response', 'Score', 'Remarks']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [226, 232, 240], textColor: [51, 65, 85], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [71, 85, 105] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 62 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 57 }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => { y = data.cursor?.y || y; }
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  });

  // Overall remarks
  if ((first as any).overallRemarks || (first as any).overall_remarks) {
    if (y > 260) { doc.addPage(); y = 15; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Overall Remarks:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const remarks = (first as any).overallRemarks || (first as any).overall_remarks || '';
    const lines = doc.splitTextToSize(remarks, 182);
    doc.text(lines, 14, y);
  }

  return y;
}

// ==================== CONSOLIDATED REPORT (Multiple submissions) ====================
async function buildConsolidatedReport(
  doc: jsPDF,
  submissions: SHLPSubmission[],
  metadata: any,
  _options: ReportOptions = {}
): Promise<number> {
  let y = 18;

  // Determine subtitle based on mode
  const mode = metadata.reportMode || 'consolidated';
  let subtitle = '';
  if (mode === 'region') {
    subtitle = `Region: ${metadata.regionName || 'All'}`;
  } else if (mode === 'store') {
    subtitle = `Store: ${metadata.storeName || metadata.storeId || 'All'}`;
  } else if (mode === 'am') {
    subtitle = `Area Manager: ${metadata.amName || 'All'}`;
  } else if (mode === 'trainer') {
    subtitle = `Trainer: ${metadata.trainerName || 'All'}`;
  } else if (mode === 'employee') {
    subtitle = `Employee: ${metadata.employeeName || 'All'}`;
  } else {
    subtitle = 'All Submissions — Consolidated View';
  }

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('SHLP Certification Report', 14, y);

  await addLogo(doc);

  y += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(99, 102, 241);
  doc.text(subtitle, 14, y);

  y += 4;
  doc.setFontSize(9);
  doc.setTextColor(120, 130, 145);
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Total Assessments: ${submissions.length}`, 14, y);
  y += 10;

  // Summary Cards
  const avgPct = submissions.length > 0
    ? Math.round(submissions.reduce((acc, s) => acc + parseFloat(s.Overall_Percentage || '0'), 0) / submissions.length)
    : 0;
  const uniqueEmployees = new Set(submissions.map(s => s['Employee ID'])).size;
  const uniqueStores = new Set(submissions.map(s => s.Store)).size;

  const cardW = 42;
  const cardH = 30;
  const cardGap = 4;
  const cards = [
    { label: 'Assessments', value: String(submissions.length), color: [99, 102, 241] },
    { label: 'Avg Score', value: `${avgPct}%`, color: avgPct >= 80 ? [34, 197, 94] : avgPct >= 60 ? [251, 191, 36] : [239, 68, 68] },
    { label: 'Employees', value: String(uniqueEmployees), color: [59, 130, 246] },
    { label: 'Stores', value: String(uniqueStores), color: [168, 85, 247] }
  ];

  cards.forEach((card, idx) => {
    const cx = 14 + idx * (cardW + cardGap);
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardW, cardH, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.label, cx + cardW / 2, y + 8, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(card.value, cx + cardW / 2, y + 22, { align: 'center' });
  });

  y += cardH + 10;

  // Section Performance (average across all submissions)
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Section Performance Overview', 14, y);
  y += 8;

  const sectionScores = SHLP_SECTIONS.filter(s => s.scoreKey).map(section => {
    const scores = submissions
      .map(s => parseFloat((s as any)[section.scoreKey] || '0'))
      .filter(s => !isNaN(s));
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { title: section.title, avg };
  });

  // Horizontal bar chart for sections
  sectionScores.forEach((section) => {
    if (y > 270) { doc.addPage(); y = 20; }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(section.title, 14, y + 4);

    const barStartX = 68;
    const maxBarW = 110;
    const barH = 5;
    const filledW = (section.avg / 100) * maxBarW;

    doc.setFillColor(229, 231, 235);
    doc.roundedRect(barStartX, y, maxBarW, barH, 1, 1, 'F');

    const barColor = section.avg >= 80 ? [34, 197, 94] : section.avg >= 60 ? [251, 191, 36] : [239, 68, 68];
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    if (filledW > 0) doc.roundedRect(barStartX, y, Math.max(2, filledW), barH, 1, 1, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${section.avg}%`, barStartX + maxBarW + 3, y + 4);

    y += 10;
  });

  y += 5;

  // Trainer-wise Summary Table
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Trainer-wise Summary', 14, y);
  y += 6;

  // Group by trainer
  const trainerGroups: Record<string, typeof submissions> = {};
  submissions.forEach(s => {
    const tKey = s.Trainer || 'Unknown';
    if (!trainerGroups[tKey]) trainerGroups[tKey] = [];
    trainerGroups[tKey].push(s);
  });

  const trainerRows = Object.entries(trainerGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tId, subs]) => {
      const tName = resolveEmployeeName(tId, metadata.employeeDirectoryById) || tId;
      const avgPct = Math.round(subs.reduce((a, s) => a + parseFloat(s.Overall_Percentage || '0'), 0) / subs.length);
      const storeSet = new Set(subs.map(s => s.Store));
      const storeNames = Array.from(storeSet).map(sid => resolveStoreName(sid, metadata.storeMapping)).join(', ');
      const empCount = new Set(subs.map(s => s['Employee ID'])).size;
      const dates = subs.map(s => new Date(s['Submission Time']).getTime()).filter(d => !isNaN(d));
      const minD = dates.length > 0 ? new Date(Math.min(...dates)).toLocaleDateString() : '-';
      const maxD = dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString() : '-';
      const dateRange = minD === maxD ? minD : `${minD} – ${maxD}`;
      return [tName, String(subs.length), `${avgPct}%`, String(empCount), storeNames, dateRange];
    });

  autoTable(doc, {
    startY: y,
    head: [['Trainer', 'Assessments', 'Avg Score', 'Employees', 'Stores', 'Date Range']],
    body: trainerRows,
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 55 },
      5: { cellWidth: 35 }
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = parseFloat(String(data.cell.raw).replace('%', ''));
        if (!isNaN(val)) {
          if (val >= 80) data.cell.styles.textColor = [34, 197, 94];
          else if (val >= 60) data.cell.styles.textColor = [251, 191, 36];
          else data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Individual Assessments Table
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Individual Assessments', 14, y);
  y += 6;

  const tableRows = submissions.map(s => {
    const empName = resolveEmployeeName(s['Employee ID'], metadata.employeeDirectoryById) || s['Employee Name'] || s['Employee ID'];
    const storeName = resolveStoreName(s.Store, metadata.storeMapping);
    const trainerName = resolveEmployeeName(s.Trainer, metadata.employeeDirectoryById) || s.Trainer || '';
    const dateFormatted = formatDate(s['Submission Time']);
    const overallPct = s.Overall_Percentage || '0';
    return [dateFormatted, empName, storeName, trainerName, `${overallPct}%`];
  });

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Employee', 'Store', 'Trainer', 'Score']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 42 },
      2: { cellWidth: 38 },
      3: { cellWidth: 35 },
      4: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = parseFloat(String(data.cell.raw).replace('%', ''));
        if (!isNaN(val)) {
          if (val >= 80) data.cell.styles.textColor = [34, 197, 94];
          else if (val >= 60) data.cell.styles.textColor = [251, 191, 36];
          else data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // If filtered to a small set (≤5), show detailed breakdown of each
  if (submissions.length <= 5) {
    submissions.forEach((sub, subIdx) => {
      doc.addPage();
      y = 18;

      const empName = resolveEmployeeName(sub['Employee ID'], metadata.employeeDirectoryById) || sub['Employee Name'] || '';
      const dateFormatted = formatDate(sub['Submission Time']);
      const storeName = resolveStoreName(sub.Store, metadata.storeMapping);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(`Assessment ${subIdx + 1}: ${empName}`, 14, y);
      y += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 130, 145);
      doc.text(`${dateFormatted} | Store: ${storeName} | Score: ${sub.Overall_Percentage || 0}%`, 14, y);
      y += 10;

      const { sections } = processSubmission(sub);

      let qNo = 1;
      Object.keys(sections).forEach(secKey => {
        const sec = sections[secKey];
        if (y > 250) { doc.addPage(); y = 15; }

        const sectionPct = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;

        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(14, y, 194, y);
        y += 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(sec.title, 14, y + 4);

        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        const sl = `${sec.score}/${sec.maxScore} (${sectionPct}%)`;
        doc.text(sl, 194 - ((doc as any).getTextWidth(sl) || sl.length * 3), y + 4);
        y += 10;

        sec.rows.forEach((row) => {
          if (y > 265) { doc.addPage(); y = 20; }

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          doc.text(`${qNo}.`, 18, y + 3);
          qNo++;

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          const qLines = doc.splitTextToSize(row.question, 130);
          doc.text(qLines, 26, y + 3);

          const ans = String(row.answer).toUpperCase();
          doc.setFont('helvetica', 'bold');
          if (ans === 'YES' || ans === '2') doc.setTextColor(34, 197, 94);
          else if (ans === 'NO' || ans === '-2') doc.setTextColor(239, 68, 68);
          else doc.setTextColor(107, 114, 128);
          doc.text(row.answer, 160, y + 3);

          doc.setTextColor(71, 85, 105);
          doc.text(`${row.score}/${row.maxScore}`, 180, y + 3);

          y += Math.max(5, qLines.length * 4);

          if (row.remarks && row.remarks.trim()) {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(107, 114, 128);
            const rLines = doc.splitTextToSize(row.remarks, 165);
            doc.text(rLines, 26, y + 2);
            y += (rLines.length * 3) + 3;
          }
        });

        y += 4;
      });
    });
  }

  return y;
}

// ==================== MAIN EXPORT ====================
export async function buildSHLPPDF(
  submissions: SHLPSubmission[],
  metadata: any,
  options: ReportOptions = {}
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  if (!submissions || submissions.length === 0) {
    doc.text('No SHLP data available', 14, 20);
    return doc;
  }

  const mode = metadata.reportMode || 'employee';

  // Single submission with employee filter → individual detailed report
  if (mode === 'employee' && submissions.length === 1) {
    await buildIndividualReport(doc, submissions[0], metadata, options);
  } else {
    // All other cases → consolidated report with summary + individual details if ≤5
    await buildConsolidatedReport(doc, submissions, metadata, options);
  }

  return doc;
}
