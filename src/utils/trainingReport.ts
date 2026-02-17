import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrainingAuditSubmission } from '../../services/dataService';
import { TRAINING_QUESTIONS } from '../../constants';
import { EMBEDDED_LOGO } from '../assets/embeddedLogo';

interface ReportOptions {
  title?: string;
  logoDataUrl?: string | null;
}

const mm = (val: number) => val; // placeholder for conversions if needed

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

// treat common NA-like values as Not Applicable
function isNA(v: any) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (s === 'na' || s === 'n/a' || s === 'not applicable' || s === 'n.a.' || s === 'n a') return true;
  // allow patterns like 'n a' or variations with punctuation
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
  // draw fallback logo into the same reserved area we use in the header
  const areaX = 162;
  const areaY = 8;
  const areaW = 28;
  const areaH = 28;
    const innerPadding = 4; // mm padding inside the reserved box (increased to avoid clipping)

  for (const logoPath of logoPaths) {
    try {
      const logoData = await loadImage(logoPath);
      // create an image element to get natural dimensions
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

// Compute overall total and max from submission using TRAINING_QUESTIONS
function computeOverall(submission: any): { total: number; max: number; pct: number } {
  let total = 0;
  let max = 0;
  for (const q of TRAINING_QUESTIONS) {
    // Resolve possible sheet key variations for TSA fields
    const ans = resolveSubmissionValue(submission, q.id);
    
    // For TSA score fields, use the pre-calculated scores directly (0/5/10)
    // These are calculated automatically based on individual TSA questions
    if (q.id === 'TSA_Food_Score' || q.id === 'TSA_Coffee_Score' || q.id === 'TSA_CX_Score') {
      const tsaScore = parseFloat(String(ans || '0'));
      if (!isNaN(tsaScore) && tsaScore > 0) {
        total += tsaScore;
        max += 10; // Each TSA section has max of 10
      } else if (!isNA(ans)) {
        // Only add to max if not marked as NA
        max += 10;
      }
      continue;
    }
    
    if (isNA(ans)) {
      // Not applicable - skip adding this question to the denominator
      continue;
    }
    let qMax = 0;
    if (q.choices && q.choices.length) qMax = Math.max(...q.choices.map((c: any) => Number(c.score) || 0));
    else if (q.type === 'input') qMax = 10;
    else qMax = 1;

    let numeric = 0;
    if (ans !== undefined && ans !== null && ans !== '') {
      if (q.choices && q.choices.length) {
        const found = q.choices.find((c: any) => String(c.label).toLowerCase() === String(ans).toLowerCase());
        if (found) numeric = Number(found.score) || 0;
      } else if (q.type === 'input') {
        const n = parseFloat(String(ans));
        numeric = isNaN(n) ? 0 : n;
      } else {
        const low = String(ans).toLowerCase();
        if (low === 'yes' || low === 'y' || low === 'true') numeric = 1;
        if (low === 'no' || low === 'n' || low === 'false') numeric = 0;
      }
    }

    total += numeric;
    max += qMax;
  }
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return { total, max, pct };
}

// Resolve submission value with fallbacks for known legacy keys (TSA_* variations)
function resolveSubmissionValue(submission: any, qId: string) {
  if (!submission) return undefined;
  // direct match first
  if (submission[qId] !== undefined) return submission[qId];

  // Handle TSA score legacy keys: sheet may store TSA_1/TSA_2/TSA_3 or prefixed TSA_TSA_1
  // Also check for camelCase variants sent from the frontend (tsaFoodScore, tsaCoffeeScore, tsaCXScore)
  if (qId === 'TSA_Food_Score') return submission['TSA_Food_Score'] ?? submission['tsaFoodScore'] ?? submission['TSA_TSA_1'] ?? submission['TSA_1'] ?? submission['TSA_1_score'] ?? submission['TSA_1 - Partner 1'] ?? submission['TSA_1 - Partner 1 – Hot & Cold stations work?'] ?? undefined;
  if (qId === 'TSA_Coffee_Score') return submission['TSA_Coffee_Score'] ?? submission['tsaCoffeeScore'] ?? submission['TSA_TSA_2'] ?? submission['TSA_2'] ?? submission['TSA_2_score'] ?? undefined;
  if (qId === 'TSA_CX_Score') return submission['TSA_CX_Score'] ?? submission['tsaCXScore'] ?? submission['TSA_TSA_3'] ?? submission['TSA_3'] ?? submission['TSA_3_score'] ?? undefined;

  // Generic TSA_* fallback: try stripped variants
  if (qId.startsWith('TSA_')) {
    const simple = qId.replace(/TSA_|_Score/g, '');
    const alt = `TSA_${simple}`;
    if (submission[alt] !== undefined) return submission[alt];
  }

  return submission[qId];
}

export const buildTrainingPDF = async (submissions: TrainingAuditSubmission[], metadata: any = {}, options: ReportOptions = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;
  const first = submissions[0] || {} as any;
  
  // Debug logging
  console.log('🎯 PDF Generation - First submission data:', first);
  console.log('🎯 PDF Generation - Submission keys:', Object.keys(first));
  console.log('🎯 PDF Generation - totalScore:', first.totalScore);
  console.log('🎯 PDF Generation - maxScore:', first.maxScore);
  console.log('🎯 PDF Generation - percentageScore:', first.percentageScore);
  console.log('🎯 PDF Generation - TSA scores:', {
    food: first.TSA_Food_Score || first.tsaFoodScore,
    coffee: first.TSA_Coffee_Score || first.tsaCoffeeScore,
    cx: first.TSA_CX_Score || first.tsaCXScore
  });

  const title = options.title || 'Training Audit';
  // Header: Title, Store, Metadata and Logo on the right
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(title, 14, y);

  // Add logo to top-right (prefer repo public path first)
  try {
    // Try to load the project's public assets/logo.png first
    // If we have an embedded logo, use it directly (guaranteed in PDF)
  // reserved area for logo (reduced size and with inner padding to avoid visual crowding)
  const areaX = 162;
  const areaY = 8;
  const areaW = 28; // reduced from 34 to 28 mm
  const areaH = 28; // reduced from 34 to 28 mm
    const innerPadding = 4; // mm padding inside the reserved box (increased to avoid clipping)
    if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
      // load embedded image to get natural dimensions
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = EMBEDDED_LOGO;
      });
      const naturalW = imgEl.naturalWidth || imgEl.width || areaW;
      const naturalH = imgEl.naturalHeight || imgEl.height || areaH;
      const ratio = Math.min(1, areaW / naturalW, areaH / naturalH);
  // apply inner padding so the image doesn't touch the header edges
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

  // Store subtitle below title (make bigger and bolder) — tighten gap
  y += 4;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  const storeName = metadata.storeName || first.storeName || first.store_name || '';
  if (storeName) {
    doc.text(storeName, 14, y + 2);
  }

  // Metadata row: Date/Time | Auditor | Store ID & MOD (use metadata fallback to submission)
  // Simplified metadata row (compact single-line)
  const metaY = y + 8;
  const dateStr = formatDate(metadata.date || first.submissionTime || first.date || '');
  const trainer = metadata.trainerName || first.trainerName || '';
  const auditor = metadata.auditorName || first.auditorName || '';
  const sid = metadata.storeId || first.storeId || '';
  const mod = (metadata.mod || first.mod || first.MOD) || '';
  const metaLine = [] as string[];
  if (dateStr) metaLine.push(`${dateStr}`);
  if (trainer) metaLine.push(`Trainer: ${trainer}`);
  if (auditor) metaLine.push(`Auditor: ${auditor}`);
  if (sid) metaLine.push(`Store: ${sid}`);
  if (mod) metaLine.push(`MOD: ${mod}`);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 130, 145);
  if (metaLine.length) doc.text(metaLine.join('   |   '), 14, metaY);
  y = metaY + 12;

  // Overall performance summary (calculated from TRAINING_QUESTIONS & first submission)
  // Overall performance summary - ALWAYS compute from questions to ensure accuracy
  // The stored totalScore/maxScore might be incorrect due to previous calculation bugs
  const computed = computeOverall(first);
  const total = computed.total;
  const max = computed.max;
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;

  console.log('📊 Score calculation:', {
    computed,
    storedTotal: first.totalScore,
    storedMax: first.maxScore,
    storedPct: first.percentageScore,
    usingComputed: true
  });

  // Draw summary cards with larger layout
  const cardHeight = 42;
  const leftX = 14;
  const rightX = 110;

  // Left card: Overall Score (use sheet values when available)
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
  // Draw progress bar below the percentage
  const barX = rightX + 8;
  const barY = y + 34;
  const barWidth = 84 - 16;
  const barHeight = 4;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');
  doc.setFillColor(pctColor[0], pctColor[1], pctColor[2]);
  doc.roundedRect(barX, barY, Math.max(4, Math.min(barWidth, Math.round((pct / 100) * barWidth))), barHeight, 2, 2, 'F');

  y += cardHeight + 12;

  // Build sections from TRAINING_QUESTIONS to preserve order, titles and weightage
  const sections: Record<string, { rows: any[]; score: number; maxScore: number; remarks?: string; images?: string[] }> = {};

  // Map short section keys to readable titles
  const SECTION_TITLES: Record<string, string> = {
    TM: 'Training Materials',
    LMS: 'LMS Completion',
    Buddy: 'Buddy Training',
    NJ: 'New Joiner Process',
    PK: 'Partner Knowledge',
    CX: 'Customer Experience',
    AP: 'Action Plan',
    'TSA_Food_Score': 'TSA - Food Assessment',
    'TSA_Coffee_Score': 'TSA - Coffee Assessment',
    'TSA_CX_Score': 'TSA - Customer Experience'
  };

  // Initialize sections from TRAINING_QUESTIONS
  for (const q of TRAINING_QUESTIONS) {
    // section key is prefix before first underscore, or full id for TSA entries
    let sectionKey = q.id;
    if (q.id.startsWith('TSA_')) {
      // TSA entries are standalone sections
      sectionKey = q.id; // e.g. TSA_Food_Score
    } else if (q.id.includes('_')) {
      sectionKey = q.id.split('_')[0];
    } else {
      sectionKey = 'Misc';
    }
    if (!sections[sectionKey]) sections[sectionKey] = { rows: [], score: 0, maxScore: 0 };
  }

  // Fill rows using submissions (take first submission as source of answers)
  const sub = submissions[0] || {} as any;

  for (const q of TRAINING_QUESTIONS) {
    const ans = resolveSubmissionValue(sub, q.id);
    
    // For TSA score fields, these are pre-calculated (0/5/10) based on individual assessments
    // Display them as a single row showing the calculated score
    if (q.id === 'TSA_Food_Score' || q.id === 'TSA_Coffee_Score' || q.id === 'TSA_CX_Score') {
      let sectionKey = q.id;
      const questionTitle = q.title || q.id;
      const tsaScore = parseFloat(String(ans || '0'));
      const validScore = !isNaN(tsaScore) ? tsaScore : 0;
      const maxForTSA = 10;
      
      const rowAnswer = isNA(ans) ? 'NA' : String(validScore);
      sections[sectionKey].rows.push({ 
        id: q.id, 
        question: questionTitle, 
        answer: rowAnswer, 
        score: validScore, 
        maxScore: maxForTSA 
      });
      sections[sectionKey].score += validScore;
      if (!isNA(ans)) {
        sections[sectionKey].maxScore += maxForTSA;
      }
      continue;
    }
    
    // compute max score from choices or input/default
    let maxForQuestion = 0;
    if (q.choices && q.choices.length) {
      maxForQuestion = Math.max(...q.choices.map((c: any) => (typeof c.score === 'number' ? c.score : 0)));
    } else if (q.type === 'input') {
      maxForQuestion = 10; // assume out of 10
    } else {
      maxForQuestion = 1;
    }

    // compute numeric score
    let numeric = 0;
    let display = '';
    if (ans === undefined || ans === null || ans === '') {
      display = '';
      numeric = 0;
    } else {
      display = String(ans);
      if (q.choices && q.choices.length) {
        const choice = q.choices.find((c: any) => String(c.label).toLowerCase() === display.toLowerCase());
        if (choice) numeric = Number(choice.score) || 0;
      } else if (q.type === 'input') {
        const n = parseFloat(display);
        numeric = isNaN(n) ? 0 : n;
      } else {
        // fallback for yes/no
        const low = display.toLowerCase();
        if (low === 'yes' || low === 'y' || low === 'true') numeric = 1;
        if (low === 'no' || low === 'n' || low === 'false') numeric = 0;
      }
    }

    // Determine section key and title
    let sectionKey = q.id.startsWith('TSA_') ? q.id : (q.id.includes('_') ? q.id.split('_')[0] : 'Misc');
    const questionTitle = q.title || q.id;

    // If answer is NA, show as 'NA' but do NOT include its weight in the section max
    const rowAnswer = isNA(ans) ? 'NA' : (display || '');
    sections[sectionKey].rows.push({ id: q.id, question: questionTitle, answer: rowAnswer, score: numeric, maxScore: maxForQuestion });
    // Add score always (numeric will be 0 for NA) but only add max if not NA
    sections[sectionKey].score += numeric;
    if (!isNA(ans)) {
      sections[sectionKey].maxScore += maxForQuestion;
    }
  }

  // Also gather remarks fields from submission (they may be named like PK_remarks or TSA_Food_Score_remarks)
  Object.keys(sub).forEach(k => {
    if (k.endsWith('_remarks') || k.endsWith('Remarks')) {
      const key = k.replace('_remarks', '').replace('Remarks', '');
      // try direct match first
      if (sections[key]) sections[key].remarks = sub[k];
      else if (sections[key.replace(' ', '_')]) sections[key.replace(' ', '_')].remarks = sub[k];
      else if (sections[key.replace('_Score', '')]) sections[key.replace('_Score', '')].remarks = sub[k];
      // For TSA sections, also check with _Score suffix (e.g., TSA_Food_Score from tsaFoodScoreRemarks)
      else if (sections[key + '_Score']) sections[key + '_Score'].remarks = sub[k];
    }
  });
  
  // Also check for camelCase TSA remarks fields: tsaFoodScoreRemarks, tsaCoffeeScoreRemarks, tsaCXScoreRemarks
  if (sub.tsaFoodScoreRemarks || sub.tsaFoodRemarks) sections['TSA_Food_Score'].remarks = sub.tsaFoodScoreRemarks || sub.tsaFoodRemarks;
  if (sub.tsaCoffeeScoreRemarks || sub.tsaCoffeeRemarks) sections['TSA_Coffee_Score'].remarks = sub.tsaCoffeeScoreRemarks || sub.tsaCoffeeRemarks;
  if (sub.tsaCXScoreRemarks || sub.tsaCXRemarks) sections['TSA_CX_Score'].remarks = sub.tsaCXScoreRemarks || sub.tsaCXRemarks;

  // Parse section images from the submission
  if (sub.sectionImages) {
    try {
      const parsedImages = typeof sub.sectionImages === 'string' 
        ? JSON.parse(sub.sectionImages) 
        : sub.sectionImages;
      
      // Add images to corresponding sections
      Object.keys(parsedImages).forEach(sectionId => {
        if (sections[sectionId] && parsedImages[sectionId] && Array.isArray(parsedImages[sectionId])) {
          sections[sectionId].images = parsedImages[sectionId];
        }
      });
    } catch (error) {
      console.error('Error parsing section images:', error);
    }
  }

  // Render each section
  Object.keys(sections).forEach(secKey => {
    const sec = sections[secKey];
    if (y > 250) { doc.addPage(); y = 15; }
    
    // Section header with score
  const sectionTitle = SECTION_TITLES[secKey] || secKey.replace('_',' ');
    const sectionPercentage = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0;
    
  doc.setFillColor(59, 130, 246); // Blue background
  doc.roundedRect(14, y, 180, 12, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text
  doc.text(sectionTitle, 18, y + 8);
  // Right-align score text and make sure it doesn't overflow the header
  const scoreLabel = `Score: ${sec.score}/${sec.maxScore} (${sectionPercentage}%)`;
  const scoreWidth = (doc as any).getTextWidth(scoreLabel) || scoreLabel.length * 3.5;
  const maxRight = 14 + 180 - 8; // right padding inside header
  const scoreX = Math.min(maxRight - scoreWidth, 160);
  doc.text(scoreLabel, scoreX, y + 8);
    y += 18;

    // Table of questions (include weightage/max column)
    const tableRows = sec.rows.map(r => [r.question, r.answer || '-', String(r.score), String(r.maxScore)]);
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
            }
          }
          if (data.column.index === 2) {
            // color score positive/zero
            const scoreNum = Number(data.cell.raw);
            if (!isNaN(scoreNum) && scoreNum > 0) data.cell.styles.textColor = [34, 197, 94];
          }
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Display section remarks if they exist  
    if (sec.remarks && sec.remarks.trim()) {
      const remarksLines = doc.splitTextToSize(sec.remarks, 160);
      const remarksHeight = Math.max(18, (remarksLines.length * 4) + 12);
      // If remarks won't fit on current page, add a new page
      const pageBottomLimit = 285; // leave margin for footer
      if (y + remarksHeight + 20 > pageBottomLimit) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(254, 249, 195); // Light yellow background
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(14, y, 180, remarksHeight, 2, 2, 'FD');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14); // Dark orange text
      doc.text('Remarks:', 18, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(remarksLines, 18, y + 14);
      y += remarksHeight + 8;
    }

    // Display section images if they exist
    if (sec.images && sec.images.length > 0) {
      const pageBottomLimit = 285;
      const imageWidth = 50; // mm
      const imageHeight = 50; // mm
      const imagesPerRow = 3;
      const imageSpacing = 8; // mm between images
      
      for (let i = 0; i < sec.images.length; i++) {
        const col = i % imagesPerRow;
        const row = Math.floor(i / imagesPerRow);
        
        // Check if we need a new page
        const neededHeight = imageHeight + 10;
        if (y + neededHeight > pageBottomLimit) {
          doc.addPage();
          y = 20;
        }
        
        // Calculate position (start new row after every 3 images)
        if (col === 0 && row > 0) {
          y += imageHeight + imageSpacing;
        }
        
        const xPos = 14 + (col * (imageWidth + imageSpacing));
        
        try {
          // Add image to PDF
          doc.addImage(sec.images[i], 'JPEG', xPos, y, imageWidth, imageHeight);
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }
      
      // Move y position down after last row of images
      const totalRows = Math.ceil(sec.images.length / imagesPerRow);
      y += imageHeight + imageSpacing;
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
