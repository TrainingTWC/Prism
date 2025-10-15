import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Submission = any;

export async function buildTrainingPDFHtml(submissions: Submission[], metadata: any = {}, options: { fileName?: string } = {}) {
  // Create container element
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1024px';
  container.style.padding = '24px';
  container.style.background = '#ffffff';
  container.style.color = '#111827';
  container.style.boxSizing = 'border-box';
  container.id = 'training-pdf-container';

  // Get base URL for assets
  const base = (import.meta as any).env?.BASE_URL || '/';
  const logoPath = `${base}assets/logo.png`.replace(/\/+/g, '/');

  // Basic styles to mimic screenshot layout
  container.innerHTML = `
    <div id="pdf-root" style="font-family: Arial, Helvetica, sans-serif; color:#111827;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${logoPath}" alt="logo" style="width:84px;height:84px;object-fit:contain;background:#fff;padding:8px;border-radius:8px;" crossorigin="anonymous"/>
          <div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">Training Audit Report</div>
            <div style="font-size:12px;color:#6b7280;">${metadata.storeName || ''} ${metadata.storeId ? ' - ' + metadata.storeId : ''}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:#6b7280;">Generated:</div>
          <div style="font-size:14px;font-weight:600;">${new Date().toLocaleString()}</div>
        </div>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:20px;">
        <div style="flex:1;border:2px solid #3b82f6;padding:16px;border-radius:10px;background:linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);text-align:center;">
          <div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Overall Score</div>
          <div style="font-size:32px;font-weight:800;color:#1e40af;margin:8px 0;">${metadata.percentage ?? ''}%</div>
          <div style="font-size:13px;color:#6b7280;font-weight:600;">${metadata.totalScore ?? ''} / ${metadata.maxScore ?? ''}</div>
        </div>
        <div style="flex:2;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:8px;">
          <div>
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Trainer</div>
            <div style="font-size:14px;font-weight:600;color:#0f172a;">${metadata.trainerName || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Trainer ID</div>
            <div style="font-size:14px;font-weight:600;color:#0f172a;">${metadata.trainerId || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Auditor</div>
            <div style="font-size:14px;font-weight:600;color:#0f172a;">${metadata.auditorName || metadata.amName || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Date</div>
            <div style="font-size:14px;font-weight:600;color:#0f172a;">${metadata.date || new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div id="sections">
      </div>

      <div style="margin-top:20px;padding-top:16px;border-top:2px solid #e5e7eb;">
        <div style="font-size:13px;color:#374151;font-weight:700;margin-bottom:8px;">Remarks & Observations</div>
        <div style="min-height:60px;border:1px solid #d1d5db;padding:14px;border-radius:8px;background:#f9fafb;font-size:12px;color:#1f2937;line-height:1.6;">${metadata.remarks || 'No remarks provided.'}</div>
      </div>
    </div>
  `.trim();

  document.body.appendChild(container);

  // Group questions by prefix heuristics
  const sections: { title: string; rows: any[] }[] = [];

  if (submissions && submissions.length) {
    // Use the first submission as source of questions
    const sample = submissions[0];
    const excludeKeys = ['submissionTime','trainerName','trainerId','amName','amId','storeName','storeId','region','totalScore','maxScore','percentageScore','percentage','tsaFoodScore','tsaCoffeeScore','tsaCXScore','mod'];
    const questionKeys = Object.keys(sample).filter(k => !excludeKeys.includes(k) && !k.endsWith('_remarks') && !k.endsWith('_score'));

    // Group by prefix before underscore
    const groups: Record<string, string[]> = {};
    questionKeys.forEach(k => {
      const prefix = k.includes('_') ? k.split('_')[0] : 'Other';
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(k);
    });

    // Section title mapping
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
      const rows: any[] = [];
      groups[prefix].forEach(qk => {
        const answer = sample[qk];
        // Only include questions that have answers
        if (answer !== undefined && answer !== null && answer !== '' && answer !== 'N/A') {
          rows.push({ question: qk, answer: answer, score: sample[qk + '_score'] ?? '' });
        }
      });
      if (rows.length > 0) {
        sections.push({ title, rows });
      }
    }
  }

  const sectionsRoot = container.querySelector('#sections') as HTMLElement;
  sections.forEach(sec => {
    const secEl = document.createElement('div');
    secEl.style.marginBottom = '16px';
    secEl.innerHTML = `
      <div style="font-size:15px;font-weight:700;margin-bottom:10px;color:#0f172a;padding:8px 0;border-bottom:2px solid #e5e7eb">${sec.title}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${sec.rows.map(r => {
          const answer = String(r.answer).toLowerCase();
          const isYes = answer === 'yes';
          const isNo = answer === 'no';
          const badgeColor = isYes ? '#059669' : isNo ? '#ef4444' : '#6b7280';
          const badgeBg = isYes ? '#d1fae5' : isNo ? '#fee2e2' : '#f3f4f6';
          
          return `
          <div style="border:1px solid #e5e7eb;padding:10px;border-radius:6px;display:flex;align-items:center;justify-content:space-between;background:#fafafa;">
            <div style="font-size:11px;color:#374151;line-height:1.4;flex:1;padding-right:8px;">${escapeHtml(String(r.question).replace(/_/g, ' '))}</div>
            <div style="font-size:11px;font-weight:700;color:${badgeColor};background:${badgeBg};padding:4px 10px;border-radius:12px;white-space:nowrap;">${escapeHtml(String(r.answer))}</div>
          </div>
        `}).join('')}
      </div>
    `.trim();
    sectionsRoot.appendChild(secEl);
  });

  // Render with html2canvas and build PDF
  await new Promise<void>(resolve => setTimeout(resolve, 50));

  const root = container.querySelector('#pdf-root') as HTMLElement;
  const canvas = await html2canvas(root, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fit canvas to page width
  const imgProps = { width: canvas.width, height: canvas.height };
  const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
  const imgWidth = imgProps.width * ratio;
  const imgHeight = imgProps.height * ratio;
  pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight);

  // cleanup
  document.body.removeChild(container);

  const fileName = options.fileName || `TrainingReport-${metadata.storeName || 'store'}.pdf`;
  pdf.save(fileName);
  return pdf;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
