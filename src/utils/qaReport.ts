import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QASubmission } from '../../services/dataService';
import { QA_SECTIONS } from '../../config/qaQuestions';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

interface ReportOptions {
  title?: string;
  logoDataUrl?: string | null;
}

// Treat common NA-like values as Not Applicable
function isNA(v: any) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (s === 'na' || s === 'n/a' || s === 'not applicable' || s === 'n.a.' || s === 'n a') return true;
  if (/^n\s*\/?\s*a$/.test(s)) return true;
  if (/not\s+applicab/.test(s)) return true;
  return false;
}

async function addCompanyLogo(doc: jsPDF): Promise<void> {
  // Try common asset locations and extensions for the project logo
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
  const areaX = 162;
  const areaY = 8;
  const areaW = 28;
  const areaH = 28;
  const innerPadding = 4;

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

// Resolve submission value - handle both direct field names and colon-separated headers
function resolveSubmissionValue(submission: any, fieldPrefix: string, questionId: string) {
  if (!submission) return undefined;
  
  // Map field prefixes to section names
  const prefixToSection: Record<string, string> = {
    'ZT': 'ZeroTolerance',
    'S': 'Store',
    'A': 'A',
    'M': 'Maintenance',
    'HR': 'HR'
  };
  
  // Try direct match first (e.g., "S_1")
  const directKey = `${fieldPrefix}_${questionId}`;
  if (submission[directKey] !== undefined) return submission[directKey];
  
  // Try with section prefix (e.g., "Store_S_1")
  const sectionName = prefixToSection[fieldPrefix];
  if (sectionName) {
    const sectionKey = `${sectionName}_${fieldPrefix}_${questionId}`;
    if (submission[sectionKey] !== undefined) return submission[sectionKey];
  }
  
  // Try with colon format from Google Sheets (e.g., "S_1: Description")
  const colonKeys = Object.keys(submission).filter(k => k.startsWith(`${directKey}:`));
  if (colonKeys.length > 0) return submission[colonKeys[0]];
  
  return undefined;
}

// Compute overall score from submission
function computeOverall(submission: any): { total: number; max: number; pct: number; zeroToleranceFailed: boolean } {
  let total = 0;
  let max = 0;
  let zeroToleranceFailed = false;

  QA_SECTIONS.forEach(section => {
    section.items.forEach(item => {
      const ans = resolveSubmissionValue(submission, section.id === 'ZeroTolerance' ? 'ZT' : 
                                         section.id === 'Store' ? 'S' :
                                         section.id === 'Maintenance' ? 'M' :
                                         section.id === 'A' ? 'A' : 'HR', 
                                         item.id.split('_')[1]);
      
      // Skip NA responses
      if (isNA(ans)) {
        return;
      }

      const response = String(ans || '').toLowerCase().trim();

      // Handle Zero Tolerance
      if (section.id === 'ZeroTolerance') {
        if (response === 'non-compliant') {
          zeroToleranceFailed = true;
        }
        if (response) {
          max += item.w;
          if (response === 'compliant') {
            total += item.w;
          }
        }
      } else {
        // Other sections: compliant=full points, partially-compliant=half, not-compliant=0
        if (response) {
          max += item.w;
          if (response === 'compliant') {
            total += item.w;
          } else if (response === 'partially-compliant' || response === 'partially compliant') {
            total += Math.floor(item.w / 2);
          }
        }
      }
    });
  });

  // If Zero Tolerance failed, entire audit is 0
  if (zeroToleranceFailed) {
    total = 0;
  }

  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return { total, max, pct, zeroToleranceFailed };
}

export const buildQAPDF = async (
  submissions: QASubmission[], 
  metadata: any = {}, 
  options: ReportOptions = {}, 
  questionImages: Record<string, string[]> = {}
) => {
  console.log('🖼️ Building QA PDF with images:', Object.keys(questionImages).length, 'image sets');
  console.log('📸 Image keys:', Object.keys(questionImages));
  if (Object.keys(questionImages).length > 0) {
    console.log('📷 Sample image key:', Object.keys(questionImages)[0], '- Images:', questionImages[Object.keys(questionImages)[0]]?.length || 0);
  }
  
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;
  const first = submissions[0] || {} as any;

  const title = options.title || 'QA Audit Report';
  
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
      const base = (window as any).location?.origin || '';
      const preferred = `${base}/assets/logo.png`;
      try {
        const imgData = await loadImage(preferred);
        const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = imgData;
        });
        const naturalW = imgEl.naturalWidth || imgEl.width || areaW;
        const naturalH = imgEl.naturalHeight || imgEl.height || areaH;
        const usableW = Math.max(4, areaW - innerPadding * 2);
        const usableH = Math.max(4, areaH - innerPadding * 2);
        const ratioLoaded = Math.min(1, usableW / naturalW, usableH / naturalH);
        const drawW = Math.round(naturalW * ratioLoaded);
        const drawH = Math.round(naturalH * ratioLoaded);
        const drawX = areaX + innerPadding + Math.round((usableW - drawW) / 2);
        const drawY = areaY + innerPadding + Math.round((usableH - drawH) / 2);
        doc.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH);
      } catch (err) {
        await addCompanyLogo(doc);
      }
    }
  } catch (e) {
    // ignore
  }

  // Store subtitle below title
  y += 4;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  const storeName = metadata.storeName || first.storeName || first.store_name || first.Store || '';
  if (storeName) {
    doc.text(storeName, 14, y + 2);
  }

  // Metadata row: Date | Auditor | Store ID | Region
  const metaY = y + 8;
  const dateStr = metadata.date || first.submissionTime || first.date || first.Date || '';
  const auditor = metadata.auditorName || first.auditorName || first.auditor || first.Auditor || '';
  const sid = metadata.storeId || first.storeId || first.store_id || first.StoreID || '';
  const region = metadata.region || first.region || first.Region || '';
  
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
  const computed = computeOverall(first);
  const totalFromSheet = (first.totalScore !== undefined && first.maxScore !== undefined);
  let total = totalFromSheet ? Number(first.totalScore) : computed.total;
  const max = totalFromSheet ? Number(first.maxScore) : computed.max;
  const zeroToleranceFailed = computed.zeroToleranceFailed;
  
  // If Zero Tolerance failed, total score must be 0
  if (zeroToleranceFailed) {
    total = 0;
  }
  
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;

  // Draw summary cards
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
  doc.text(`${total} / ${max}`, leftX + 8, y + 30);

  // Right card: Percentage with progress bar
  doc.setFillColor(247, 249, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, 84, cardHeight, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
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

  // Zero Tolerance Warning (if failed)
  if (zeroToleranceFailed) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(14, y, 180, 16, 4, 4, 'FD');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('! ZERO TOLERANCE VIOLATION - Audit Failed', 18, y + 10);
    y += 22;
  }

  // Build sections
  const sections: Record<string, { 
    title: string;
    rows: any[]; 
    score: number; 
    maxScore: number; 
    remarks?: string 
  }> = {};

  // Map section IDs to prefixes for field lookup
  const SECTION_PREFIXES: Record<string, string> = {
    'ZeroTolerance': 'ZT',
    'Store': 'S',
    'A': 'A',
    'Maintenance': 'M',
    'HR': 'HR'
  };

  // Initialize sections
  QA_SECTIONS.forEach(section => {
    sections[section.id] = {
      title: section.title,
      rows: [],
      score: 0,
      maxScore: 0
    };
  });

  // Fill rows from submission
  const sub = submissions[0] || {} as any;

  // Parse questionRemarksJSON if it exists and merge into sub
  if (sub.questionRemarksJSON || sub['Question Remarks JSON']) {
    try {
      const remarksJSON = sub.questionRemarksJSON || sub['Question Remarks JSON'];
      const parsedRemarks = JSON.parse(remarksJSON);
      console.log('📝 Parsed questionRemarksJSON:', parsedRemarks);
      console.log('📝 Total remarks found:', Object.keys(parsedRemarks).length);
      
      // Add each remark as a field with _remark suffix
      Object.entries(parsedRemarks).forEach(([key, value]) => {
        sub[`${key}_remark`] = value;
      });
    } catch (e) {
      console.warn('Failed to parse questionRemarksJSON:', e);
    }
  }

  QA_SECTIONS.forEach(section => {
    const prefix = SECTION_PREFIXES[section.id];
    
    section.items.forEach(item => {
      const questionId = item.id.split('_')[1];
      const ans = resolveSubmissionValue(sub, prefix, questionId);
      const response = String(ans || '').toLowerCase().trim();
      
      // Calculate score
      let numeric = 0;
      let display = response || '-';
      
      if (!isNA(ans) && response) {
        sections[section.id].maxScore += item.w;
        
        if (section.id === 'ZeroTolerance') {
          if (response === 'compliant') {
            numeric = item.w;
            display = 'Compliant';
          } else if (response === 'non-compliant') {
            numeric = 0;
            display = 'Non-Compliant';
          }
        } else {
          if (response === 'compliant') {
            numeric = item.w;
            display = 'Compliant';
          } else if (response === 'partially-compliant' || response === 'partially compliant') {
            numeric = Math.floor(item.w / 2);
            display = 'Partially Compliant';
          } else if (response === 'not-compliant' || response === 'not compliant') {
            numeric = 0;
            display = 'Not Compliant';
          }
        }
        // Always add to section score - sections show actual performance
        sections[section.id].score += numeric;
      } else if (isNA(ans)) {
        display = 'NA';
      }

      // Get per-question remark
      const questionRemarkKey = `${section.id}_${questionId}_remark`;
      const altRemarkKey = `${prefix}_${questionId}_remark`;
      let questionRemark = '';
      
      if (sub[questionRemarkKey]) {
        questionRemark = String(sub[questionRemarkKey]).trim();
      } else if (sub[altRemarkKey]) {
        questionRemark = String(sub[altRemarkKey]).trim();
      }

      sections[section.id].rows.push({
        id: item.id,
        questionId: `${section.id}_${questionId}`, // Add full question ID for image lookup
        question: item.q,
        answer: display,
        score: numeric,
        maxScore: item.w,
        remark: questionRemark // Add per-question remark
      });
    });

    // Check for remarks field - try multiple formats
    const remarksKey = `${section.id}_remarks`;
    const altRemarksKey = `${section.title.replace(/\s+/g, '')} Remarks`;
    const simpleRemarksKey = `${prefix}_remarks`;
    
    if (sub[remarksKey]) {
      sections[section.id].remarks = sub[remarksKey];
    } else if (sub[altRemarksKey]) {
      sections[section.id].remarks = sub[altRemarksKey];
    } else if (sub[simpleRemarksKey]) {
      sections[section.id].remarks = sub[simpleRemarksKey];
    }
  });

  // Section-wise Summary Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Section-wise Performance Summary', 14, y);
  y += 8;

  // Build summary table data with percentages for progress bars
  const summaryData = Object.keys(sections).map(secKey => {
    const sec = sections[secKey];
    // Show actual section scores - only overall is affected by ZT failure
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
      fillColor: [59, 130, 246],
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
            data.cell.styles.textColor = [34, 197, 94]; // Green
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
            doc.setFillColor(34, 197, 94); // Green
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
    
    doc.setFillColor(59, 130, 246);
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

    // Render each question individually with its images
    sec.rows.forEach((rowData, rowIndex) => {
      // Check if we need a new page before question
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Render single question table
      const tableRows = [[`Q${rowIndex + 1}. ${rowData.question}`, rowData.answer, String(rowData.score), String(rowData.maxScore)]];
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
              if (text === 'compliant') {
                data.cell.styles.textColor = [34, 197, 94];
                data.cell.styles.fillColor = [240, 253, 244];
                data.cell.styles.fontStyle = 'bold';
              } else if (text === 'non-compliant' || text === 'not compliant') {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fillColor = [254, 242, 242];
                data.cell.styles.fontStyle = 'bold';
              } else if (text === 'partially compliant') {
                data.cell.styles.textColor = [245, 158, 11];
                data.cell.styles.fillColor = [254, 252, 232];
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
        // Check if we need a new page for remark
        if (y > 265) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text('💬 Comment:', 18, y + 4);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81); // gray-700
        const remarkLines = doc.splitTextToSize(rowData.remark, 160);
        doc.text(remarkLines, 40, y + 4);
        
        y += (remarkLines.length * 4) + 3;
      }

      // Render images for this question immediately below it
      if (rowData.questionId) {
        // Try multiple image key formats
        const imageKey = rowData.questionId;
        let images = questionImages[imageKey];
        
        if (!images || images.length === 0) {
          const altKey = imageKey.replace(/_([A-Z]+)_/, '_$1');
          images = questionImages[altKey];
        }
        
        if (!images || images.length === 0) {
          const parts = rowData.id.split('_');
          if (parts.length >= 2) {
            const sectionImageKey = `${sec.title.replace(/\s+/g, '')}_${rowData.id}`;
            images = questionImages[sectionImageKey];
          }
        }
        
        if (images && images.length > 0) {
          // Check if we need a new page for images
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          
          // Smaller, more compact image layout
          const imagesPerRow = 5;
          const imageWidth = 32;
          const imageHeight = 24;
          const spacing = 3;
          const startX = 14;
          
          images.forEach((base64Image, idx) => {
            try {
              const col = idx % imagesPerRow;
              const row = Math.floor(idx / imagesPerRow);
              
              // Check if we need a new page for this row
              if (row > 0 && col === 0 && y + imageHeight > 270) {
                doc.addPage();
                y = 20;
              }
              
              const x = startX + col * (imageWidth + spacing);
              const currentY = y + row * (imageHeight + spacing);
              
              // Add image
              doc.addImage(base64Image, 'JPEG', x, currentY, imageWidth, imageHeight);
              
              // Draw border
              doc.setDrawColor(203, 213, 225);
              doc.setLineWidth(0.5);
              doc.rect(x, currentY, imageWidth, imageHeight);
              
            } catch (err) {
              console.warn('Could not add image to PDF:', err);
            }
          });
          
          // Update y position
          const totalRows = Math.ceil(images.length / imagesPerRow);
          y += (imageHeight + spacing) * totalRows + 2;
        }
      }

      // Add small spacing between questions
      y += 4;
    });

    // Display section remarks if they exist
    if (sec.remarks && sec.remarks.trim()) {
      const remarksLines = doc.splitTextToSize(sec.remarks, 170);
      const remarksHeight = Math.max(18, (remarksLines.length * 5) + 12);
      const pageBottomLimit = 285;
      
      if (y + remarksHeight + 20 > pageBottomLimit) {
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
  // Check if we need a new page for signatures
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // Signatures section header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Signatures', 14, y);
  y += 10;

  // Check for signature data in submission
  const auditorSignature = sub.auditorSignature || sub.auditor_signature || sub['Auditor Signature'];
  const smSignature = sub.smSignature || sub.sm_signature || sub['SM Signature'] || sub['Store Manager Signature'];

  // Draw signature boxes
  const signatureBoxWidth = 85;
  const signatureBoxHeight = 40;
  const leftBoxX = 14;
  const rightBoxX = 109;

  // Auditor Signature Box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(leftBoxX, y, signatureBoxWidth, signatureBoxHeight, 2, 2, 'S');
  
  // Add auditor signature if available
  if (auditorSignature && auditorSignature.startsWith('data:image')) {
    try {
      doc.addImage(auditorSignature, 'PNG', leftBoxX + 5, y + 5, signatureBoxWidth - 10, signatureBoxHeight - 15);
    } catch (err) {
      console.warn('Could not add auditor signature to PDF:', err);
    }
  } else {
    // Placeholder text if no signature
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature not provided', leftBoxX + signatureBoxWidth / 2, y + signatureBoxHeight / 2, { align: 'center' });
  }
  
  // Label below auditor signature
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Auditor Signature', leftBoxX, y + signatureBoxHeight + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const auditorName = metadata.auditorName || sub.auditorName || sub.qaName || '';
  if (auditorName) {
    doc.text(auditorName, leftBoxX, y + signatureBoxHeight + 12);
  }

  // Store Manager Signature Box
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, y, signatureBoxWidth, signatureBoxHeight, 2, 2, 'S');
  
  // Add SM signature if available
  if (smSignature && smSignature.startsWith('data:image')) {
    try {
      doc.addImage(smSignature, 'PNG', rightBoxX + 5, y + 5, signatureBoxWidth - 10, signatureBoxHeight - 15);
    } catch (err) {
      console.warn('Could not add SM signature to PDF:', err);
    }
  } else {
    // Placeholder text if no signature
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature not provided', rightBoxX + signatureBoxWidth / 2, y + signatureBoxHeight / 2, { align: 'center' });
  }
  
  // Label below SM signature
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Store Manager Signature', rightBoxX, y + signatureBoxHeight + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const smName = metadata.smName || sub.smName || '';
  if (smName) {
    doc.text(smName, rightBoxX, y + signatureBoxHeight + 12);
  }

  y += signatureBoxHeight + 20;

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

export default buildQAPDF;
