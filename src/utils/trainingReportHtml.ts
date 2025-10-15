import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Submission = any;

export async function buildTrainingPDFHtml(submissions: Submission[], metadata: any = {}, options: { fileName?: string } = {}) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let yPos = 15;
  
  // Get base URL for logo
  const base = (import.meta as any).env?.BASE_URL || '/';
  const logoPath = `${base}assets/logo.png`.replace(/\/+/g, '/');

  // Try to load and add logo
  try {
    const logoImg = await loadImage(logoPath);
    pdf.addImage(logoImg, 'PNG', 160, 10, 40, 20);
  } catch (err) {
    console.warn('Could not load logo:', err);
  }

  // === HEADER ===
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text('Training Audit Report', 15, yPos);
  yPos += 8;
  
  pdf.setFontSize(16);
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.text(metadata.storeName || 'Store Name', 15, yPos);
  yPos += 12;

  // Metadata row
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139); // slate-500
  
  const metaY = yPos;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date/Time:', 15, metaY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(metadata.date || new Date().toLocaleString(), 35, metaY);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Auditor:', 85, metaY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${metadata.auditorName || 'N/A'} (${metadata.amId || 'N/A'})`, 102, metaY);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Store:', 150, metaY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(metadata.storeId || 'N/A', 163, metaY);
  
  yPos += 8;
  
  // Border line
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.5);
  pdf.line(15, yPos, 195, yPos);
  yPos += 8;

  // === OVERALL PERFORMANCE ===
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Overall Performance', 15, yPos);
  yPos += 8;

  // Score cards using rectangles
  // Card 1: Overall Score
  pdf.setFillColor(224, 242, 254); // blue-100
  pdf.setDrawColor(147, 197, 253); // blue-300
  pdf.roundedRect(15, yPos, 85, 30, 2, 2, 'FD');
  
  pdf.setFontSize(10);
  pdf.setTextColor(79, 70, 229); // indigo-600
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overall Score', 57.5, yPos + 8, { align: 'center' });
  
  pdf.setFontSize(20);
  pdf.text(`${metadata.totalScore || 0} / ${metadata.maxScore || 100}`, 57.5, yPos + 20, { align: 'center' });
  
  // Card 2: Percentage
  const percentage = metadata.percentage || 0;
  const percentColor = percentage >= 80 ? [16, 185, 129] : percentage >= 60 ? [245, 158, 11] : [239, 68, 68];
  
  pdf.setFillColor(209, 250, 229); // green-100
  pdf.setDrawColor(167, 243, 208); // green-200
  pdf.roundedRect(110, yPos, 85, 30, 2, 2, 'FD');
  
  pdf.setFontSize(10);
  pdf.setTextColor(13, 148, 136); // teal-600
  pdf.text('Percentage', 152.5, yPos + 8, { align: 'center' });
  
  pdf.setFontSize(20);
  pdf.setTextColor(percentColor[0], percentColor[1], percentColor[2]);
  pdf.text(`${percentage}%`, 152.5, yPos + 20, { align: 'center' });
  
  // Progress bar
  pdf.setFillColor(229, 231, 235); // gray-200
  pdf.rect(110, yPos + 25, 85, 3, 'F');
  
  const progressWidth = (percentage / 100) * 85;
  pdf.setFillColor(percentColor[0], percentColor[1], percentColor[2]);
  pdf.rect(110, yPos + 25, progressWidth, 3, 'F');
  
  yPos += 38;

  // === SECTIONS ===
  if (submissions && submissions.length > 0) {
    const sample = submissions[0];
    const excludeKeys = ['submissionTime','trainerName','trainerId','amName','amId','storeName','storeId','region','totalScore','maxScore','percentageScore','percentage','tsaFoodScore','tsaCoffeeScore','tsaCXScore','mod'];
    const questionKeys = Object.keys(sample).filter(k => !excludeKeys.includes(k) && !k.endsWith('_remarks') && !k.endsWith('_score'));

    // Group by prefix
    const groups: Record<string, string[]> = {};
    questionKeys.forEach(k => {
      const prefix = k.includes('_') ? k.split('_')[0] : 'Other';
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(k);
    });

    const sectionTitles: Record<string, string> = {
      'TM': 'Training Material',
      'LMS': 'LMS Completion',
      'Buddy': 'Buddy Training',
      'NJ': 'New Joiner Process',
      'PK': 'Product Knowledge',
      'TSA': 'TSA (Technical Skills Assessment)',
      'CX': 'Customer Experience',
      'AP': 'Appearance & Presentation'
    };

    for (const prefix of Object.keys(groups).sort()) {
      const title = sectionTitles[prefix] || prefix;
      const questions: any[] = [];
      let sectionScore = 0;
      let sectionMax = 0;

      groups[prefix].forEach(qk => {
        const answer = sample[qk];
        if (answer !== undefined && answer !== null && answer !== '' && answer !== 'N/A') {
          const score = parseFloat(sample[qk + '_score']) || 0;
          const remarks = sample[qk + '_remarks'] || '';
          questions.push({ 
            text: formatQuestionText(qk), 
            answer: String(answer), 
            score: score,
            remarks: remarks
          });
          sectionScore += score;
          // Estimate max - this would need to come from metadata ideally
          sectionMax += (score > 0 ? score : 1);
        }
      });

      if (questions.length === 0) continue;

      // Check if we need a new page
      if (yPos > 240) {
        pdf.addPage();
        yPos = 15;
      }

      // Section header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${title} (Score: ${sectionScore} / ${sectionMax})`, 15, yPos);
      yPos += 7;

      // Questions table
      const tableData = questions.map(q => {
        const answerLower = q.answer.toLowerCase();
        const isYes = answerLower === 'yes';
        const isNo = answerLower === 'no';
        const statusIcon = isYes ? '✓' : isNo ? '✗' : '-';
        
        return [
          q.text,
          `${statusIcon} ${q.answer}`,
          String(q.score)
        ];
      });

      autoTable(pdf, {
        startY: yPos,
        head: [['Question', 'Response', 'Score']],
        body: tableData,
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [241, 245, 249], // slate-100
          textColor: [51, 65, 85], // slate-700
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 60, halign: 'center' },
          2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const text = String(data.cell.raw);
            if (text.includes('✓')) {
              data.cell.styles.textColor = [16, 185, 129]; // green-500
              data.cell.styles.fillColor = [220, 252, 231]; // green-100
            } else if (text.includes('✗')) {
              data.cell.styles.textColor = [239, 68, 68]; // red-500
              data.cell.styles.fillColor = [254, 226, 226]; // red-100
            }
          }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 5;

      // Remarks if any
      const remarksText = questions.map(q => q.remarks).filter(r => r).join('; ');
      if (remarksText) {
        if (yPos > 260) {
          pdf.addPage();
          yPos = 15;
        }
        
        pdf.setFillColor(249, 250, 251); // gray-50
        pdf.setDrawColor(209, 213, 219); // gray-300
        pdf.roundedRect(15, yPos, 180, 20, 2, 2, 'FD');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        pdf.text('Remarks:', 17, yPos + 5);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        const lines = pdf.splitTextToSize(remarksText, 175);
        pdf.text(lines, 17, yPos + 10);
        
        yPos += 25;
      }
    }
  }

  // === FOOTER ===
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175); // gray-400
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Report generated via Prism Training Audit System. Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  const fileName = options.fileName || `TrainingReport-${metadata.storeName || 'store'}.pdf`;
  pdf.save(fileName);
  return pdf;
}

function formatQuestionText(key: string): string {
  // Convert question keys like "TM_1" to readable text
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
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
    };
    img.onerror = reject;
    img.src = url;
  });
}
