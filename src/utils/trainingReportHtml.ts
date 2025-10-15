import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TRAINING_QUESTIONS } from '../../constants';

type Submission = any;

export async function buildTrainingPDFHtml(submissions: Submission[], metadata: any = {}, options: { fileName?: string } = {}) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let yPos = 15;
  
  // Get base URL for logo - use prism-logo.png
  const base = (import.meta as any).env?.BASE_URL || '/';
  const logoPath = `${base}prism-logo.png`.replace(/\/+/g, '/');

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

    // Define sections with their questions in exact order from TRAINING_QUESTIONS
    const sections = [
      { 
        id: 'TM', 
        title: 'Training Material', 
        questions: TRAINING_QUESTIONS.filter(q => q.id.startsWith('TM_'))
      },
      { 
        id: 'LMS', 
        title: 'LMS Completion', 
        questions: TRAINING_QUESTIONS.filter(q => q.id.startsWith('LMS_'))
      },
      { 
        id: 'Buddy', 
        title: 'Buddy Training', 
        questions: TRAINING_QUESTIONS.filter(q => q.id.startsWith('Buddy_'))
      },
      { 
        id: 'NJ', 
        title: 'New Joiner Process', 
        questions: TRAINING_QUESTIONS.filter(q => q.id.startsWith('NJ_'))
      },
      { 
        id: 'PK', 
        title: 'Partner Knowledge', 
        questions: TRAINING_QUESTIONS.filter(q => q.id.startsWith('PK_'))
      },
      { 
        id: 'TSA', 
        title: 'TSA (Technical Skills Assessment)', 
        questions: TRAINING_QUESTIONS.filter(q => q.id.startsWith('TSA_'))
      },
      { 
        id: 'CX', 
        title: 'Customer Experience', 
        questions: TRAINING_QUESTIONS.filter(q => q.id.startsWith('CX_'))
      },
      { 
        id: 'AP', 
        title: 'Action Plan', 
        questions: TRAINING_QUESTIONS.filter(q => q.id.startsWith('AP_'))
      }
    ];

    for (const section of sections) {
      const questionData: any[] = [];
      let sectionScore = 0;
      let sectionMax = 0;

      // Process each question in the section
      for (const question of section.questions) {
        const answer = sample[question.id];
        
        // Skip if no answer
        if (answer === undefined || answer === null || answer === '' || answer === 'N/A') {
          continue;
        }

        // Calculate score based on question type
        let score = 0;
        let maxScore = 0;
        
        if (question.choices) {
          // Radio button question - find the choice and get its score
          const selectedChoice = question.choices.find(c => c.label === answer);
          if (selectedChoice) {
            score = selectedChoice.score;
          }
          // Max score is the highest choice score
          maxScore = Math.max(...question.choices.map(c => c.score));
        } else if (question.type === 'input') {
          // Input questions (TSA) - score is numeric input
          score = parseFloat(answer) || 0;
          maxScore = 10; // TSA questions are out of 10
        } else {
          // Textarea questions - no scoring
          score = 0;
          maxScore = 0;
        }

        const remarks = sample[question.id + '_remarks'] || '';
        
        questionData.push({
          text: question.title, // Use the actual question title from constants
          answer: String(answer),
          score: score,
          maxScore: maxScore,
          remarks: remarks
        });

        sectionScore += score;
        sectionMax += maxScore;
      }

      if (questionData.length === 0) continue;

      // Check if we need a new page
      if (yPos > 240) {
        pdf.addPage();
        yPos = 15;
      }

      // Section header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${section.title} (Score: ${sectionScore} / ${sectionMax})`, 15, yPos);
      yPos += 7;

      // Questions table
      const tableData = questionData.map(q => {
        const answerLower = q.answer.toLowerCase();
        const isYes = answerLower === 'yes';
        const isNo = answerLower === 'no';
        
        // For display: show actual answer, not icon
        let displayAnswer = q.answer;
        
        // Add indicator if yes/no
        if (isYes) {
          displayAnswer = `✓ ${q.answer}`;
        } else if (isNo) {
          displayAnswer = `✗ ${q.answer}`;
        }
        
        return [
          q.text,
          displayAnswer,
          q.maxScore > 0 ? `${q.score}/${q.maxScore}` : '-'
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
          1: { cellWidth: 60, halign: 'left' },
          2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const text = String(data.cell.raw);
            if (text.includes('✓') || text.toLowerCase().includes('yes')) {
              data.cell.styles.textColor = [16, 185, 129]; // green-500
              data.cell.styles.fillColor = [220, 252, 231]; // green-100
            } else if (text.includes('✗') || text.toLowerCase().includes('no')) {
              data.cell.styles.textColor = [239, 68, 68]; // red-500
              data.cell.styles.fillColor = [254, 226, 226]; // red-100
            }
          }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 5;

      // Remarks if any
      const remarksText = questionData.map(q => q.remarks).filter(r => r).join('; ');
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
