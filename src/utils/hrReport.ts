import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Submission } from '../../types';
import { QUESTIONS } from '../../constants';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

interface ReportOptions {
  title?: string;
  logoDataUrl?: string | null;
}

// Format date from ISO string to DD/MM/YYYY
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return dateStr;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Invalid date, return as is
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    
    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateStr; // If parsing fails, return original
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

async function addCompanyLogo(doc: jsPDF): Promise<void> {
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

// Compute overall score from submission
function computeOverall(submission: any): { total: number; max: number; pct: number } {
  let total = 0;
  let max = 0;
  
  for (const q of QUESTIONS) {
    const ans = submission[q.id];
    
    // Skip if no answer
    if (ans === undefined || ans === null || ans === '') continue;
    
    let qMax = 0;
    if (q.choices && q.choices.length) {
      qMax = Math.max(...q.choices.map((c: any) => Number(c.score) || 0));
    } else if (q.type === 'input' || q.type === 'textarea') {
      // Text inputs don't have scores
      continue;
    } else {
      qMax = 1;
    }

    let numeric = 0;
    if (q.choices && q.choices.length) {
      const found = q.choices.find((c: any) => 
        String(c.label).toLowerCase() === String(ans).toLowerCase()
      );
      if (found) numeric = Number(found.score) || 0;
    } else if (q.type === 'radio') {
      const low = String(ans).toLowerCase();
      if (low === 'yes' || low === 'y' || low === 'true') numeric = 1;
      if (low === 'no' || low === 'n' || low === 'false') numeric = 0;
    }

    total += numeric;
    max += qMax;
  }
  
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return { total, max, pct };
}

export const buildHRPDF = async (
  submissions: Submission[], 
  metadata: any = {}, 
  options: ReportOptions = {}
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;
  const first = submissions[0] || {} as any;

  const title = options.title || 'HR Employee Survey';
  
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
  const storeName = metadata.storeName || first.storeName || first.store_name || '';
  if (storeName) {
    doc.text(storeName, 14, y + 2);
  }

  // Metadata row: Date/Time | HR Person | Store ID
  const metaY = y + 8;
  const hrPerson = metadata.hrPersonName || first.hrName || '';
  const sid = metadata.storeId || first.storeID || '';
  const metaLine = [] as string[];

  // Prefer date range filter over individual submission date
  if (metadata.dateFrom || metadata.dateTo) {
    if (metadata.dateFrom && metadata.dateTo) {
      metaLine.push(`Date Range: ${metadata.dateFrom} – ${metadata.dateTo}`);
    } else if (metadata.dateFrom) {
      metaLine.push(`From: ${metadata.dateFrom}`);
    } else {
      metaLine.push(`Until: ${metadata.dateTo}`);
    }
  } else {
    const dateStr = formatDate(metadata.date || first.submissionTime || first.date || '');
    if (dateStr) metaLine.push(`${dateStr}`);
  }

  if (hrPerson) metaLine.push(`HR: ${hrPerson}`);
  if (sid) metaLine.push(`Store: ${sid}`);
  const recordCount = submissions.length;
  if (recordCount > 1) metaLine.push(`${recordCount} records`);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  if (metaLine.length > 0) {
    doc.text(metaLine.join('  |  '), 14, metaY);
  }

  y = metaY + 10;

  // Separator line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 8;

  // Score Summary
  if (submissions.length === 1) {
    const overall = computeOverall(first);
    const score = (overall.total / overall.max * 5).toFixed(1); // Convert to 1-5 scale
    const pct = overall.pct; // Keep percentage for bar fill calculation
    
    // Score bar
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Overall Satisfaction Score', 14, y);
    
    y += 8;
    const barX = 14;
    const barY = y;
    const barW = 120;
    const barH = 8;
    
    // Background bar
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');
    
    // Filled portion (still based on percentage for visual consistency)
    const fillW = (pct / 100) * barW;
    let fillColor = [239, 68, 68]; // red
    if (pct >= 80) fillColor = [34, 197, 94]; // green
    else if (pct >= 60) fillColor = [251, 191, 36]; // yellow
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.roundedRect(barX, barY, fillW, barH, 2, 2, 'F');
    
    // Score text (show as X/5)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${score}/5`, barX + barW + 5, barY + 6);
    
    y += 12;
  } else {
    // Multiple submissions - show comprehensive summaries
    const totalPct = submissions.reduce((sum, sub) => {
      const overall = computeOverall(sub);
      return sum + overall.pct;
    }, 0);
    const avgPct = Math.round(totalPct / submissions.length);
    const avgScore = ((avgPct / 100) * 5).toFixed(1); // Convert to 1-5 scale
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`Overall Summary (${submissions.length} surveys)`, 14, y);
    
    y += 8;
    const barX = 14;
    const barY = y;
    const barW = 120;
    const barH = 8;
    
    // Background bar
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');
    
    // Filled portion (still based on percentage for visual consistency)
    const fillW = (avgPct / 100) * barW;
    let fillColor = [239, 68, 68]; // red
    if (avgPct >= 80) fillColor = [34, 197, 94]; // green
    else if (avgPct >= 60) fillColor = [251, 191, 36]; // yellow
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.roundedRect(barX, barY, fillW, barH, 2, 2, 'F');
    
    // Score text (show as X/5)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`Average: ${avgScore}/5`, barX + barW + 5, barY + 6);
    
    y += 15;

    // Section-wise Score Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Question-wise Average Scores', 14, y);
    y += 6;

    // Calculate average score per question overall and per region
    const questionScores: { 
      [key: string]: { 
        total: number; 
        count: number; 
        title: string;
        regions: {
          North: { total: number; count: number };
          South: { total: number; count: number };
          West: { total: number; count: number };
        }
      } 
    } = {};
    
    QUESTIONS.forEach(q => {
      questionScores[q.id] = { 
        total: 0, 
        count: 0, 
        title: q.title,
        regions: {
          North: { total: 0, count: 0 },
          South: { total: 0, count: 0 },
          West: { total: 0, count: 0 }
        }
      };
    });

    submissions.forEach(sub => {
      const region = sub.region || 'Unknown';
      
      QUESTIONS.forEach(q => {
        const ans = (sub as any)[q.id];
        if (ans === undefined || ans === null || ans === '') return;
        if (q.type === 'input' || q.type === 'textarea') return; // Skip text inputs

        let numeric = 0;
        let qMax = 0;
        
        if (q.choices && q.choices.length) {
          qMax = Math.max(...q.choices.map((c: any) => Number(c.score) || 0));
          const found = q.choices.find((c: any) => 
            String(c.label).toLowerCase() === String(ans).toLowerCase()
          );
          if (found) numeric = Number(found.score) || 0;
        } else if (q.type === 'radio') {
          qMax = 1;
          const low = String(ans).toLowerCase();
          if (low === 'yes' || low === 'y' || low === 'true') numeric = 1;
        }

        if (qMax > 0) {
          const pct = (numeric / qMax) * 100;
          questionScores[q.id].total += pct;
          questionScores[q.id].count++;
          
          // Add to region-specific totals
          if (region === 'North' || region === 'South' || region === 'West') {
            questionScores[q.id].regions[region as 'North' | 'South' | 'West'].total += pct;
            questionScores[q.id].regions[region as 'North' | 'South' | 'West'].count++;
          }
        }
      });
    });

    const questionTableData: any[] = [];
    Object.entries(questionScores).forEach(([qId, data]) => {
      if (data.count > 0) {
        // Calculate overall average
        const avgPct = Math.round(data.total / data.count);
        const totalScore = ((avgPct / 100) * 5).toFixed(1);
        
        // Calculate region averages
        const northScore = data.regions.North.count > 0 
          ? ((Math.round(data.regions.North.total / data.regions.North.count) / 100) * 5).toFixed(1)
          : '-';
        const southScore = data.regions.South.count > 0 
          ? ((Math.round(data.regions.South.total / data.regions.South.count) / 100) * 5).toFixed(1)
          : '-';
        const westScore = data.regions.West.count > 0 
          ? ((Math.round(data.regions.West.total / data.regions.West.count) / 100) * 5).toFixed(1)
          : '-';
        
        questionTableData.push([
          data.title.substring(0, 60) + (data.title.length > 60 ? '...' : ''),
          northScore === '-' ? '-' : `${northScore}/5`,
          southScore === '-' ? '-' : `${southScore}/5`,
          westScore === '-' ? '-' : `${westScore}/5`,
          `${totalScore}/5`
        ]);
      }
    });

    if (questionTableData.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Question', 'North', 'South', 'West', 'Total']],
        body: questionTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55]
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 23, halign: 'center' },
          2: { cellWidth: 23, halign: 'center' },
          3: { cellWidth: 23, halign: 'center' },
          4: { cellWidth: 23, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // HR-wise Summary
    if (y > 240) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('HR Personnel-wise Summary', 14, y);
    y += 6;

    const hrSummary: { [key: string]: { name: string; total: number; count: number } } = {};
    submissions.forEach(sub => {
      const hrId = sub.hrId || 'Unknown';
      const hrName = sub.hrName || hrId;
      
      if (!hrSummary[hrId]) {
        hrSummary[hrId] = { name: hrName, total: 0, count: 0 };
      }
      
      const overall = computeOverall(sub);
      hrSummary[hrId].total += overall.pct;
      hrSummary[hrId].count++;
    });

    const hrTableData: any[] = [];
    Object.entries(hrSummary).forEach(([hrId, data]) => {
      const avgPct = Math.round(data.total / data.count);
      const score = ((avgPct / 100) * 5).toFixed(1); // Convert to 1-5 scale
      hrTableData.push([
        data.name,
        data.count,
        `${score}/5`
      ]);
    });

    if (hrTableData.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['HR Personnel', 'Surveys', 'Avg Score']],
        body: hrTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55]
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 42, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // AM-wise Summary
    if (y > 240) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Area Manager-wise Summary', 14, y);
    y += 6;

    const amSummary: { [key: string]: { name: string; total: number; count: number } } = {};
    submissions.forEach(sub => {
      const amId = sub.amId || 'Unknown';
      const amName = sub.amName || amId;
      
      if (!amSummary[amId]) {
        amSummary[amId] = { name: amName, total: 0, count: 0 };
      }
      
      const overall = computeOverall(sub);
      amSummary[amId].total += overall.pct;
      amSummary[amId].count++;
    });

    const amTableData: any[] = [];
    Object.entries(amSummary).forEach(([amId, data]) => {
      const avgPct = Math.round(data.total / data.count);
      const avgScore = ((avgPct / 100) * 5).toFixed(1); // Convert to 1-5 scale
      amTableData.push([
        data.name,
        data.count,
        `${avgScore}/5`
      ]);
    });

    if (amTableData.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Area Manager', 'Surveys', 'Avg Score']],
        body: amTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55]
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 42, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Region-wise Summary
    if (y > 240) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Region-wise Summary', 14, y);
    y += 6;

    const regionSummary: { [key: string]: { total: number; count: number } } = {};
    submissions.forEach(sub => {
      const region = sub.region || 'Unknown';
      
      if (!regionSummary[region]) {
        regionSummary[region] = { total: 0, count: 0 };
      }
      
      const overall = computeOverall(sub);
      regionSummary[region].total += overall.pct;
      regionSummary[region].count++;
    });

    const regionTableData: any[] = [];
    Object.entries(regionSummary).forEach(([region, data]) => {
      const avgPct = Math.round(data.total / data.count);
      const avgScore = ((avgPct / 100) * 5).toFixed(1); // Convert to 1-5 scale
      regionTableData.push([
        region,
        data.count,
        `${avgScore}/5`
      ]);
    });

    if (regionTableData.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Region', 'Surveys', 'Avg Score']],
        body: regionTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55]
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 42, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Individual Submissions Table
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Individual Submissions', 14, y);
  y += 6;

  const submissionRows = submissions.map((sub, idx) => {
    // Format date
    let dateLabel = '';
    const rawDate = (sub as any).submissionTime || (sub as any).date || '';
    if (rawDate) {
      try {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          const dd = String(parsed.getDate()).padStart(2, '0');
          const mm = String(parsed.getMonth() + 1).padStart(2, '0');
          const yyyy = parsed.getFullYear();
          dateLabel = `${dd}/${mm}/${yyyy}`;
        } else {
          // Handle DD/MM/YYYY format
          const parts = String(rawDate).trim().split(' ')[0].split('/');
          if (parts.length === 3) dateLabel = `${parts[0]}/${parts[1]}/${parts[2]}`;
          else dateLabel = String(rawDate).substring(0, 10);
        }
      } catch {
        dateLabel = String(rawDate).substring(0, 10);
      }
    }

    const overall = computeOverall(sub);
    const score = overall.max > 0 ? ((overall.total / overall.max) * 5).toFixed(1) : '0.0';

    return [
      (idx + 1).toString(),
      (sub as any).empName || (sub as any).employeeName || '-',
      (sub as any).storeName || (sub as any).store_name || '-',
      (sub as any).hrName || '-',
      dateLabel || '-',
      `${score}/5`
    ];
  });

  if (submissionRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Employee', 'Store', 'HR', 'Date', 'Score']],
      body: submissionRows,
      theme: 'striped',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [31, 41, 55]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 28, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Detailed Per-Submission Responses ────────────────────────────────────
  doc.addPage();
  y = 15;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Detailed Submission Responses', 14, y);
  y += 8;

  // Helper: format a raw date string to DD/MM/YYYY
  function fmtDate(raw: string): string {
    if (!raw) return '-';
    try {
      // ISO or standard parseable
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
      // DD/MM/YYYY already
      const parts = raw.trim().split(' ')[0].split('/');
      if (parts.length === 3) return `${parts[0]}/${parts[1]}/${parts[2]}`;
    } catch { /* fall through */ }
    return raw.substring(0, 10);
  }

  submissions.forEach((sub, idx) => {
    // Submission header card
    const empName  = (sub as any).empName  || (sub as any).employeeName || 'Unknown Employee';
    const storeName = (sub as any).storeName || '-';
    const hrName   = (sub as any).hrName   || '-';
    const amName   = (sub as any).amName   || '-';
    const region   = (sub as any).region   || '-';
    const dateStr  = fmtDate((sub as any).submissionTime || (sub as any).date || '');
    const overall  = computeOverall(sub);
    const score    = overall.max > 0 ? ((overall.total / overall.max) * 5).toFixed(1) : '0.0';
    const pct      = overall.pct;

    // Page break before each submission (after the first)
    if (idx > 0 || y > 200) {
      doc.addPage();
      y = 15;
    }

    // Coloured header band
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(14, y, 182, 10, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`#${idx + 1}  ${empName}`, 18, y + 7);
    doc.text(`${score}/5`, 182, y + 7, { align: 'right' });
    y += 13;

    // Sub-header info line
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    const infoLine = [
      `Store: ${storeName}`,
      `HR: ${hrName}`,
      `AM: ${amName}`,
      `Region: ${region}`,
      `Date: ${dateStr}`
    ].join('   |   ');
    doc.text(infoLine, 14, y);
    y += 5;

    // Thin score bar
    const barW = 182;
    const barH = 4;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(14, y, barW, barH, 1, 1, 'F');
    const fillW = Math.max(0, Math.round((pct / 100) * barW));
    let fc = pct >= 80 ? [34, 197, 94] : pct >= 60 ? [251, 191, 36] : [239, 68, 68];
    doc.setFillColor(fc[0], fc[1], fc[2]);
    if (fillW > 0) doc.roundedRect(14, y, fillW, barH, 1, 1, 'F');
    y += 8;

    // Question / Answer table
    const qRows: any[] = [];
    QUESTIONS.forEach(q => {
      const ans = (sub as any)[q.id];
      if (ans === undefined || ans === null || ans === '') return;
      const remarks = (sub as any)[`${q.id}_remarks`] || '';

      // Score for this question
      let scoreText = '-';
      if (q.choices && q.choices.length) {
        const found = q.choices.find((c: any) => String(c.label).toLowerCase() === String(ans).toLowerCase());
        if (found) {
          const maxC = Math.max(...q.choices.map((c: any) => Number(c.score) || 0));
          scoreText = `${found.score}/${maxC}`;
        }
      } else if (q.type === 'radio') {
        const low = String(ans).toLowerCase();
        scoreText = (low === 'yes' || low === 'y' || low === 'true') ? '1/1' : '0/1';
      }

      qRows.push([
        q.title,
        String(ans),
        scoreText,
        remarks || '-'
      ]);
    });

    if (qRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Question', 'Answer', 'Score', 'Remarks']],
        body: qRows,
        theme: 'grid',
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: [17, 24, 39],
          fontStyle: 'bold',
          fontSize: 8,
          lineColor: [209, 213, 219],
          lineWidth: 0.3
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55],
          lineColor: [229, 231, 235],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 85 },
          1: { cellWidth: 42 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 37 }
        },
        margin: { left: 14, right: 14 }
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  });

  // Add page numbers to all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
};
