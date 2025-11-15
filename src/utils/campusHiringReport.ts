import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CampusHiringSubmission } from '../../services/dataService';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

interface ReportOptions {
  title?: string;
  logoDataUrl?: string | null;
}

const CATEGORIES = [
  { key: 'Communication Score %', name: 'Communication' },
  { key: 'Problem Solving Score %', name: 'Problem Solving' },
  { key: 'Leadership Score %', name: 'Leadership' },
  { key: 'Attention to Detail Score %', name: 'Attention to Detail' },
  { key: 'Customer Service Score %', name: 'Customer Service' },
  { key: 'Integrity Score %', name: 'Integrity' },
  { key: 'Teamwork Score %', name: 'Teamwork' },
  { key: 'Time Management Score %', name: 'Time Management' },
  { key: 'Planning Score %', name: 'Planning' },
  { key: 'Adaptability Score %', name: 'Adaptability' },
  { key: 'Analysis Score %', name: 'Analysis' },
  { key: 'Growth Mindset Score %', name: 'Growth Mindset' }
];

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

  // First try embedded logo if available
  if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
    try {
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
      logoLoaded = true;
    } catch (e) {
      console.warn('Could not load embedded logo');
    }
  }

  // Try external logo paths if embedded didn't work
  if (!logoLoaded) {
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

export const buildCampusHiringPDF = async (submission: CampusHiringSubmission): Promise<jsPDF> => {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 15;

    const title = 'Campus Hiring Assessment Report';
    
    // Header: Title and Logo on the right (matching QA style)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(title, 14, y);

    // Add logo to top-right
    try {
      await addCompanyLogo(doc);
    } catch (e) {
      // ignore
    }

    // Candidate Name subtitle below title
    y += 4;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    const candidateName = submission['Candidate Name'] || '';
    if (candidateName) {
      doc.text(candidateName, 14, y + 2);
    }

    // Metadata row: Date | Campus | Email | Phone
    const metaY = y + 8;
    const dateStr = submission['Timestamp'] || submission['Submission Time'] || '';
    const campus = submission['Campus Name'] || '';
    const email = submission['Email'] || '';
    const phone = submission['Phone Number'] || '';
    
    const metaLine = [] as string[];
    if (dateStr) metaLine.push(`${dateStr}`);
    if (campus) metaLine.push(`Campus: ${campus}`);
    if (email) metaLine.push(`Email: ${email}`);
    if (phone) metaLine.push(`Phone: ${phone}`);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 130, 145);
    if (metaLine.length) doc.text(metaLine.join('   |   '), 14, metaY);
    y = metaY + 12;

    // Overall performance summary
    const overallScore = parseFloat(submission['Score Percentage'] || '0');
    
    // Calculate total possible score (assuming 30 questions × 3 points each = 90)
    const maxScore = 90;
    const actualScore = Math.round((overallScore / 100) * maxScore);

    // Draw summary cards (matching QA style)
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
    doc.text(`${actualScore} / ${maxScore}`, leftX + 8, y + 30);

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
    const pctColor = overallScore >= 80 ? [16, 185, 129] : overallScore >= 60 ? [245, 158, 11] : [239, 68, 68];
    doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
    doc.text(`${overallScore.toFixed(1)}%`, rightX + 8, y + 30);
    
    // Draw progress bar
    const barX = rightX + 8;
    const barY = y + 34;
    const barWidth = 84 - 16;
    const barHeight = 4;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');
    doc.setFillColor(pctColor[0], pctColor[1], pctColor[2]);
    doc.roundedRect(barX, barY, Math.max(4, Math.min(barWidth, Math.round((overallScore / 100) * barWidth))), barHeight, 2, 2, 'F');

    y += cardHeight + 12;

    // Category-wise Performance Summary Table (matching QA section-wise summary)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Category-wise Performance Summary', 14, y);
    y += 8;

    // Build summary table data with percentages for progress bars
    const summaryData = CATEGORIES.map(category => {
      const score = parseFloat(submission[category.key] || '0');
      return {
        title: category.name,
        percentageText: `${score.toFixed(1)}%`,
        percentage: score
      };
    });

    const summaryRows = summaryData.map(d => [
      d.title,
      d.percentageText,
      '' // Empty cell for progress bar
    ]);

    autoTable(doc as any, {
      startY: y,
      head: [['Category', 'Score', 'Progress']],
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
        0: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 70, halign: 'left' }
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 1) {
          const pctText = String(data.cell.raw);
          const pctValue = parseFloat(pctText);
          if (!isNaN(pctValue)) {
            if (pctValue >= 90) {
              data.cell.styles.textColor = [34, 197, 94]; // Green
            } else if (pctValue >= 70) {
              data.cell.styles.textColor = [245, 158, 11]; // Orange
            } else {
              data.cell.styles.textColor = [239, 68, 68]; // Red
            }
          }
        }
      },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 2) {
          const rowIndex = data.row.index;
          const pct = summaryData[rowIndex].percentage;
          
          const cellX = data.cell.x + 2;
          const cellY = data.cell.y + data.cell.height / 2 - 2;
          const cellWidth = data.cell.width - 4;
          const cellHeight = 4;
          
          // Background bar
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 2, 2, 'F');
          
          // Filled bar with color based on percentage
          const fillWidth = Math.max(2, Math.min(cellWidth, Math.round((pct / 100) * cellWidth)));
          const fillColor = pct >= 90 ? [34, 197, 94] : pct >= 70 ? [245, 158, 11] : [239, 68, 68];
          doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
          doc.roundedRect(cellX, cellY, fillWidth, cellHeight, 2, 2, 'F');
        }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // Performance Insights (matching QA style)
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Performance Insights', 14, y);
    y += 10;

    // Find top 3 and bottom 3 categories
    const sortedCategories = CATEGORIES.map(category => ({
      name: category.name,
      score: parseFloat(submission[category.key] || '0')
    })).sort((a, b) => b.score - a.score);

    const topThree = sortedCategories.slice(0, 3);
    const bottomThree = sortedCategories.slice(-3).reverse();

    // Top Strengths Card
    doc.setFillColor(240, 253, 244); // Light green background
    doc.setDrawColor(187, 247, 208); // Green border
    doc.roundedRect(14, y, 182, 40, 4, 4, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // Green text
    doc.text('✓ Top Strengths', 18, y + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(21, 128, 61); // Darker green
    let strengthY = y + 16;
    topThree.forEach((cat, index) => {
      doc.text(`${index + 1}. ${cat.name}: ${cat.score.toFixed(1)}%`, 20, strengthY);
      strengthY += 6;
    });

    y += 48;

    // Development Areas Card
    doc.setFillColor(254, 243, 199); // Light orange background
    doc.setDrawColor(253, 224, 71); // Orange border
    doc.roundedRect(14, y, 182, 40, 4, 4, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6); // Orange text
    doc.text('⚠ Development Areas', 18, y + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 83, 9); // Darker orange
    let devY = y + 16;
    bottomThree.forEach((cat, index) => {
      doc.text(`${index + 1}. ${cat.name}: ${cat.score.toFixed(1)}%`, 20, devY);
      devY += 6;
    });

    // Footer (matching QA style)
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 145);
      doc.text(`Page ${i} of ${pageCount}`, 105, 280, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('This report is confidential and intended for internal use only.', 105, 285, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString()} | Prism Campus Hiring System`, 105, 290, { align: 'center' });
    }
    
    return doc;
  } catch (error) {
    console.error('Error generating Campus Hiring PDF:', error);
    throw new Error(`Failed to generate Campus Hiring PDF: ${(error as Error).message}`);
  }
};

export default buildCampusHiringPDF;
