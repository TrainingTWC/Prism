import React, { useState, useEffect, useMemo } from 'react';
import { Download, Sparkles, TrendingUp, TrendingDown, X, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseSubmissionDate, getMonthKey } from '../utils/dateParser';
import { getCachedAMInsights, generateMonthlyInsights } from '../services/aiInsightsService';
import { EMBEDDED_LOGO } from '../src/assets/embeddedLogo';
import { getHRBPForAM } from '../utils/mappingUtils';

interface AMScorecardProps {
  amId: string;
  amName: string;
  submissions: any[];
}

interface ModalData {
  title: string;
  items: Array<{ 
    label: string; 
    value: string; 
    details?: string; 
    positives?: string[] | Array<{ summary: string; explanation: string }>; 
    negatives?: string[] | Array<{ summary: string; explanation: string }>;
    monthInsights?: any;
  }>;
  color: string;
  showFeedback?: boolean;
  isMonthlyAnalysis?: boolean;
}

const AMScorecard: React.FC<AMScorecardProps> = ({ amId, amName, submissions }) => {
  const [aiInsights, setAiInsights] = useState<{ 
    positives: string[]; 
    negatives: string[]; 
    isAiGenerated: boolean;
    detailedInsights?: {
      positives: Array<{ summary: string; explanation: string }>;
      negatives: Array<{ summary: string; explanation: string }>;
    };
  } | null>(null);
  const [monthlyInsights, setMonthlyInsights] = useState<Map<string, any>>(new Map());
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [hrbpName, setHrbpName] = useState<string>('Loading...');
  
  // Filter submissions for this AM
  const amSubmissions = submissions.filter((sub: any) => sub.amId === amId);

  // Load HRBP name from comprehensive mapping
  useEffect(() => {
    const loadHRBP = async () => {
      try {
        // Prefer passing AM ID when available for exact lookup
        const hrbp = await getHRBPForAM(amId || amName);
        setHrbpName(hrbp || 'Not Assigned');
      } catch (error) {
        console.error('Error loading HRBP:', error);
        setHrbpName('Not Available');
      }
    };
    loadHRBP();
  }, [amId, amName]);

  // Load AI insights on component mount
  useEffect(() => {
    const loadInsights = async () => {
      if (amSubmissions.length === 0) {
        setLoadingInsights(false);
        return;
      }
      
      try {
        setLoadingInsights(true);
        const insights = await getCachedAMInsights(amId, amSubmissions);
        setAiInsights(insights);
      } catch (error) {
        console.error('Error loading AI insights:', error);
        setAiInsights({
          positives: [
            'Team shows consistent performance',
            'Positive employee engagement',
            'Good operational standards'
          ],
          negatives: [
            'Enhance training delivery',
            'Improve communication channels',
            'Better work-life balance needed'
          ],
          isAiGenerated: false
        });
      } finally {
        setLoadingInsights(false);
      }
    };
    
    loadInsights();
  }, [amId, amSubmissions.length]);

  // Group submissions by month and calculate average scores
  const monthlyScores = React.useMemo(() => {
    const scoresByMonth: { [key: string]: any[] } = {};
    
    amSubmissions.forEach((sub: any) => {
      const dateStr = sub.submissionTime || sub.submission_time || sub.submitted_at;
      const date = parseSubmissionDate(dateStr);
      
      if (!date) return;
      
      const monthKey = getMonthKey(date);
      const percentageScore = parseFloat(sub.percent || sub.percentageScore || sub.percentage_score || sub.percentage || '0');
      const scaledScore = ((percentageScore / 100) * 4) + 1;
      
      if (!scoresByMonth[monthKey]) {
        scoresByMonth[monthKey] = [];
      }
      scoresByMonth[monthKey].push({ ...sub, scaledScore });
    });

    const monthlyAverages = Object.entries(scoresByMonth)
      .map(([month, subs]) => {
        const scores = subs.map(s => s.scaledScore);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          month,
          score: avg.toFixed(2),
          count: subs.length,
          submissions: subs,
          date: new Date(month)
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ month, score, count, submissions }) => ({ month, score, count, submissions }));
    
    return monthlyAverages;
  }, [amSubmissions, amName]);

  // Get last 3 months data
  const last3Months = useMemo(() => {
    const now = new Date();
    const months = [];
    
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = getMonthKey(date);
      const monthData = monthlyScores.find(ms => ms.month === monthKey);
      
      months.push({
        month: monthKey,
        monthName: date.toLocaleString('en-US', { month: 'long' }),
        score: monthData?.score || null,
        count: monthData?.count || 0,
        submissions: monthData?.submissions || [],
        date
      });
    }
    
    return months;
  }, [monthlyScores]);

  // Get submissions from last 3 months for AI insights
  const last3MonthsSubmissions = useMemo(() => {
    const allSubs: any[] = [];
    last3Months.forEach(m => {
      if (m.submissions && m.submissions.length > 0) {
        allSubs.push(...m.submissions);
      }
    });
    return allSubs;
  }, [last3Months]);

  // Load AI insights based on last 3 months only
  useEffect(() => {
    const loadInsights = async () => {
      if (last3MonthsSubmissions.length === 0) {
        setLoadingInsights(false);
        return;
      }
      
      try {
        setLoadingInsights(true);
        const insights = await getCachedAMInsights(amId, last3MonthsSubmissions);
        setAiInsights(insights);
      } catch (error) {
        console.error('Error loading AI insights:', error);
        setAiInsights({
          positives: [
            'Team shows consistent performance',
            'Positive employee engagement',
            'Good operational standards'
          ],
          negatives: [
            'Enhance training delivery',
            'Improve communication channels',
            'Better work-life balance needed'
          ],
          isAiGenerated: false
        });
      } finally {
        setLoadingInsights(false);
      }
    };
    
    loadInsights();
  }, [amId, last3MonthsSubmissions.length]);

  // Latest score (most recent month with data)
  const latestScore = useMemo(() => {
    // Find the most recent month with a score, starting from the end
    for (let i = last3Months.length - 1; i >= 0; i--) {
      if (last3Months[i].score !== null) {
        return last3Months[i].score;
      }
    }
    return 'N/A';
  }, [last3Months]);

  // Feedback data from AI insights
  const feedbackData = React.useMemo(() => {
    if (aiInsights) {
      return {
        positives: aiInsights.positives,
        improvements: aiInsights.negatives,
        isAiGenerated: aiInsights.isAiGenerated
      };
    }
    
    return {
      positives: ['Analyzing...', 'Processing...', 'Generating...'],
      improvements: ['Analyzing...', 'Processing...', 'Generating...'],
      isAiGenerated: false
    };
  }, [aiInsights]);

  // Extract positives and negatives from submissions
  const getMonthFeedback = (subs: any[]) => {
    const positives: string[] = [];
    const negatives: string[] = [];
    
    subs.forEach(sub => {
      // Check all question remarks
      for (let i = 1; i <= 12; i++) {
        const remarkKey = `q${i}_remarks`;
        const remark = sub[remarkKey];
        
        if (remark && String(remark).trim().length > 5) {
          const remarkText = String(remark).trim();
          const remarkLower = remarkText.toLowerCase();
          
          // Categorize as positive or negative based on keywords
          const positiveKeywords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'best', 'love', 'amazing', 'fantastic', 'wonderful', 'appreciate', 'thank', 'helpful', 'support'];
          const negativeKeywords = ['bad', 'poor', 'issue', 'problem', 'concern', 'difficult', 'hard', 'need', 'should', 'improve', 'better', 'lack', 'not', 'no', 'never', 'delay', 'late', 'unfair'];
          
          const hasPositive = positiveKeywords.some(kw => remarkLower.includes(kw));
          const hasNegative = negativeKeywords.some(kw => remarkLower.includes(kw));
          
          if (hasPositive && !hasNegative) {
            positives.push(remarkText);
          } else if (hasNegative) {
            negatives.push(remarkText);
          }
        }
      }
      
      // Check q11 (suggestions)
      if (sub.q11 && String(sub.q11).trim().length > 5) {
        negatives.push(String(sub.q11).trim());
      }
    });
    
    return {
      positives: positives.length > 0 ? positives.slice(0, 5) : ['No specific positive feedback recorded'],
      negatives: negatives.length > 0 ? negatives.slice(0, 5) : ['No specific concerns recorded']
    };
  };

  // Function to get monthly insights with caching
  const getMonthlyAIInsights = async (monthName: string, submissions: any[]) => {
    // Check cache first
    if (monthlyInsights.has(monthName)) {
      return monthlyInsights.get(monthName);
    }
    
    // Generate new insights
    const insights = await generateMonthlyInsights(monthName, submissions);
    
    // Cache the results
    setMonthlyInsights(prev => {
      const newMap = new Map(prev);
      newMap.set(monthName, insights);
      return newMap;
    });
    
    return insights;
  };

  // Modal handlers
  const showScoresModal = async () => {
    setLoadingMonthly(true);
    
    try {
      // Generate AI insights for each month
      const monthsWithInsights = await Promise.all(
        monthlyScores.map(async (ms) => {
          const monthInsights = await getMonthlyAIInsights(ms.month, ms.submissions);
          
          return {
            label: ms.month,
            value: `${ms.score} / 5`,
            details: `${ms.count} submission${ms.count !== 1 ? 's' : ''} • ${monthInsights.isAiGenerated ? 'AI Analysis' : 'Basic Analysis'}`,
            positives: monthInsights.detailedInsights?.positives || [],
            negatives: monthInsights.detailedInsights?.negatives || [],
            monthInsights // Store full insights for detailed modal
          };
        })
      );
      
      setModalData({
        title: 'Monthly Performance Analysis',
        color: 'from-violet-500 to-purple-600',
        showFeedback: true,
        isMonthlyAnalysis: true, // Flag to indicate this uses AI analysis
        items: monthsWithInsights
      });
    } catch (error) {
      console.error('Error loading monthly insights:', error);
      
      // Fallback to simple feedback if AI analysis fails
      setModalData({
        title: 'Monthly Performance',
        color: 'from-violet-500 to-purple-600',
        showFeedback: true,
        items: monthlyScores.map(ms => {
          const feedback = getMonthFeedback(ms.submissions);
          return {
            label: ms.month,
            value: `${ms.score} / 5`,
            details: `${ms.count} submission${ms.count !== 1 ? 's' : ''}`,
            positives: feedback.positives.map(p => ({ summary: p, explanation: 'Basic keyword analysis' })),
            negatives: feedback.negatives.map(n => ({ summary: n, explanation: 'Basic keyword analysis' }))
          };
        })
      });
    } finally {
      setLoadingMonthly(false);
    }
  };

  const showPositivesModal = () => {
    const detailedPositives = aiInsights?.detailedInsights?.positives || [];
    
    setModalData({
      title: 'Root Cause Analysis - Positive Factors',
      color: 'from-emerald-500 to-teal-600',
      items: detailedPositives.length > 0 
        ? detailedPositives.map((p, i) => ({
            label: `Success Factor ${i + 1}`,
            value: p.summary,
            details: p.explanation
          }))
        : feedbackData.positives.map((p, i) => ({
            label: `Strength ${i + 1}`,
            value: p,
            details: 'Detailed analysis will be available once AI insights are processed.'
          }))
    });
  };

  const showNegativesModal = () => {
    const detailedNegatives = aiInsights?.detailedInsights?.negatives || [];
    
    setModalData({
      title: 'Root Cause Analysis - Areas for Improvement',
      color: 'from-amber-500 to-orange-600',
      items: detailedNegatives.length > 0 
        ? detailedNegatives.map((n, i) => ({
            label: `Improvement Area ${i + 1}`,
            value: n.summary,
            details: n.explanation
          }))
        : feedbackData.improvements.map((n, i) => ({
            label: `Area ${i + 1}`,
            value: n,
            details: 'Detailed analysis will be available once AI insights are processed.'
          }))
    });
  };

  const downloadScorecard = async () => {
    // Create A4 PDF (mm) and use tighter margins so content fits on one page
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const maxContentHeight = pageHeight - 28; // Leave space for footer
    
    // Helper function to check if we need a new page
    const checkPageBreak = (currentY: number, requiredSpace: number) => {
      if (currentY + requiredSpace > maxContentHeight) {
        doc.addPage();
        return 20; // Reset to top margin
      }
      return currentY;
    };
    
    // Compact header to save vertical space
    doc.setFillColor(248, 250, 252); // Light slate
    doc.rect(0, 0, pageWidth, 34, 'F');

    // Add small logo (keep aspect ratio to avoid distortion)
    if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
      try {
        const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = EMBEDDED_LOGO;
        });
        const logoHeight = 12;
        const aspectRatio = imgEl.width / imgEl.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(EMBEDDED_LOGO, 'PNG', margin, 6, logoWidth, logoHeight);
      } catch (err) {
        // ignore silently
      }
    }

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Area Manager Scorecard', pageWidth / 2, 14, { align: 'center' });

    // Subtitle smaller
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Performance & Feedback Analysis', pageWidth / 2, 18, { align: 'center' });

    // Generated date
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`${new Date().toLocaleDateString()}`, pageWidth - margin, 20, { align: 'right' });

    // thin separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, 22, pageWidth - margin, 22);

    let yPos = 26;
    
  // AM Header compact
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 18, 3, 3, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 18, 3, 3, 'S');

  // Avatar small
  doc.setFillColor(99, 102, 241);
  doc.circle(margin + 8, yPos + 9, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const initials = amName.split(' ').map(n => n[0]).join('').substring(0, 2);
  doc.text(initials, margin + 8, yPos + 10, { align: 'center' });

  // AM Name and metadata - align vertically centered in the card
  const cardHeight = 18;
  const centerY = yPos + cardHeight / 2;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  // place AM name slightly above center for visual balance
  doc.text(amName, margin + 18, centerY - 2);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const surveysCount = Math.max(0, Math.round(amSubmissions?.length || 0));
  const monthsCount = Math.max(0, Math.round(monthlyScores?.length || 0));
  // place metadata slightly below center
  doc.text(`${surveysCount} Surveys • ${monthsCount} Months`, margin + 18, centerY + 4);

  // Latest score on the right side of the name card - vertically centered
  const latestScoreRaw = monthlyScores && monthlyScores.length ? monthlyScores[monthlyScores.length - 1].score : null;
  if (latestScoreRaw != null && latestScoreRaw !== '') {
    const latestStr = typeof latestScoreRaw === 'number' ? latestScoreRaw.toFixed(2) : String(latestScoreRaw);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 58, 237);
    const latestX = pageWidth - margin - 8;
    const latestY = centerY + 1; // nudge slightly for optical centering
    doc.text(latestStr, latestX, latestY, { align: 'right' });
  }

  yPos += 24;

    // Monthly scores section
  if (monthlyScores.length > 0) {
      // Section header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Performance Scores', 15, yPos);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Monthly ratings on a 1-5 scale', 15, yPos + 6);
      
      yPos += 12;

      // Compact monthly scores - show month and score inline similar to dashboard
      const gap = 4;
      const boxWidth = (pageWidth - margin * 2 - gap * 2) / 3;
      const boxHeight = 18;
      let x = margin;

      monthlyScores.slice(-3).forEach((ms, idx) => {
        const scoreVal = ms.score ? parseFloat(ms.score).toFixed(2) : '-';
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(ms.month, x + 4, yPos + 6);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(124, 58, 237);
        doc.text(String(scoreVal), x + boxWidth - 8, yPos + 11, { align: 'right' });
        x += boxWidth + gap;
      });

      yPos += boxHeight + 10;

  // Reserve space for sections (we keep everything compact so it fits on one page)
  yPos = checkPageBreak(yPos, 60);
      
      // AI / Root Cause Insights section
      // Section header - show AI label only when AI-generated, otherwise a neutral title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const analysisTitle = feedbackData.isAiGenerated ? 'AI-Powered Root Cause Analysis' : 'Root Cause Analysis';
      doc.text(analysisTitle, 15, yPos);

      if (feedbackData.isAiGenerated) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const analysisSubtitle = 'Detailed analysis generated by artificial intelligence from employee feedback';
        doc.text(analysisSubtitle, 15, yPos + 6);
        yPos += 15;
      } else {
        // smaller gap when no AI subtitle is shown
        yPos += 10;
      }

      // Get detailed AI insights if available
      const detailedPositives = aiInsights?.detailedInsights?.positives || [];
      const detailedNegatives = aiInsights?.detailedInsights?.negatives || [];
      
  // Check if we need a new page for Success Factors section
  yPos = checkPageBreak(yPos, 40);
      
      // Success Factors Section - Dynamic height
      const successSectionStart = yPos;

      // Pre-calc content lines to compute height before drawing the background
      const contentStartY = yPos + 18;
      let estimatedY = contentStartY;
      const successContentBlocks: Array<{ type: 'summary' | 'explanation' | 'bullet'; lines: string[] }> = [];

      if (detailedPositives.length > 0) {
        detailedPositives.slice(0, 3).forEach((insight: any) => {
          const summaryLines = doc.splitTextToSize(`${insight.summary}`, pageWidth - 55);
          const explanationLines = doc.splitTextToSize(insight.explanation || '', pageWidth - 55);
          successContentBlocks.push({ type: 'summary', lines: summaryLines });
          successContentBlocks.push({ type: 'explanation', lines: explanationLines });
          estimatedY += (summaryLines.length + explanationLines.length) * 3 + 7;
        });
      } else {
        feedbackData.positives.slice(0, 3).forEach((pos: string) => {
          const lines = doc.splitTextToSize(`• ${pos}`, pageWidth - 55);
          successContentBlocks.push({ type: 'bullet', lines });
          estimatedY += lines.length * 3 + 2;
        });
      }

  const successSectionHeight = Math.max(36, estimatedY - successSectionStart + 3);

      // Draw background box first so text is visible on top
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.roundedRect(15, successSectionStart, pageWidth - 30, successSectionHeight, 3, 3, 'F');
      doc.setDrawColor(167, 243, 208); // emerald-200
      doc.setLineWidth(0.5);
      doc.roundedRect(15, successSectionStart, pageWidth - 30, successSectionHeight, 3, 3, 'S');

      // Positives header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('Success Factors - What is Working Well', 20, successSectionStart + 10);

      // Write content
      let currentY = contentStartY;
      successContentBlocks.forEach((block, idx) => {
        if (block.type === 'summary') {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(6, 78, 59); // emerald-900
          doc.text(`${Math.floor(idx / 2) + 1}. ${block.lines.join(' ')}`, 20, currentY);
          currentY += 4 + block.lines.length * 3 + 2;
        } else if (block.type === 'explanation') {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105); // slate-600
          doc.text(block.lines, 25, currentY + 0);
          currentY += block.lines.length * 3 + 3;
        } else {
          // bullet
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(6, 78, 59); // emerald-900
          doc.text(block.lines, 20, currentY);
          currentY += block.lines.length * 3 + 2;
        }
      });

  yPos = successSectionStart + successSectionHeight + 6;
      
  // Check if we need a new page for Improvements section
  yPos = checkPageBreak(yPos, 40);
      
      // Areas for Improvement Section - Dynamic height
      const improvementSectionStart = yPos;

      // Pre-calc content for improvements to compute height first
      const improvementContentStartY = yPos + 18;
      let impEstimatedY = improvementContentStartY;
      const improvementContentBlocks: Array<{ type: 'summary' | 'explanation' | 'bullet'; lines: string[] }> = [];

      if (detailedNegatives.length > 0) {
        detailedNegatives.slice(0, 3).forEach((insight: any) => {
          const summaryLines = doc.splitTextToSize(`${insight.summary}`, pageWidth - 55);
          const explanationLines = doc.splitTextToSize(insight.explanation || '', pageWidth - 55);
          improvementContentBlocks.push({ type: 'summary', lines: summaryLines });
          improvementContentBlocks.push({ type: 'explanation', lines: explanationLines });
          impEstimatedY += (summaryLines.length + explanationLines.length) * 3 + 7;
        });
      } else {
        feedbackData.improvements.slice(0, 3).forEach((imp: string) => {
          const lines = doc.splitTextToSize(`• ${imp}`, pageWidth - 55);
          improvementContentBlocks.push({ type: 'bullet', lines });
          impEstimatedY += lines.length * 3 + 2;
        });
      }

  const improvementSectionHeight = Math.max(36, impEstimatedY - improvementSectionStart + 3);

      // Draw background first
      doc.setFillColor(255, 251, 235); // amber-50
      doc.roundedRect(15, improvementSectionStart, pageWidth - 30, improvementSectionHeight, 3, 3, 'F');
      doc.setDrawColor(253, 230, 138); // amber-200
      doc.setLineWidth(0.5);
      doc.roundedRect(15, improvementSectionStart, pageWidth - 30, improvementSectionHeight, 3, 3, 'S');

      // Improvements header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text('Areas for Improvement - Root Cause Analysis', 20, improvementSectionStart + 10);

      // Write improvements content
      currentY = improvementContentStartY;
      improvementContentBlocks.forEach((block, idx) => {
        if (block.type === 'summary') {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(120, 53, 15); // amber-900
          doc.text(`${Math.floor(idx / 2) + 1}. ${block.lines.join(' ')}`, 20, currentY);
          currentY += 4 + block.lines.length * 3 + 2;
        } else if (block.type === 'explanation') {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105); // slate-600
          doc.text(block.lines, 25, currentY + 0);
          currentY += block.lines.length * 3 + 3;
        } else {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 53, 15); // amber-900
          doc.text(block.lines, 20, currentY);
          currentY += block.lines.length * 3 + 2;
        }
      });

  yPos = improvementSectionStart + improvementSectionHeight + 8;
      
      // Check if we need a new page for Attribution section
      // Only show the attribution box when AI-generated insights are present
      if (feedbackData.isAiGenerated) {
        yPos = checkPageBreak(yPos, 35);
        // AI Analysis Attribution Section
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.5);
        doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'S');

        // AI-generated content notice
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(147, 51, 234); // purple-600
        doc.text('AI-Generated Analysis', pageWidth / 2, yPos + 8, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105); // slate-600
        const aiNotice = 'This root cause analysis was generated using advanced artificial intelligence technology. The insights are based on employee feedback patterns, statistical analysis, and workplace best practices.';
        const aiNoticeLines = doc.splitTextToSize(aiNotice, pageWidth - 50);
        doc.text(aiNoticeLines, pageWidth / 2, yPos + 14, { align: 'center' });

        yPos += 30;
      }
    } else {
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text('No submissions found for this Area Manager', 15, yPos);
    }
    
    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerText = 'PRISM Dashboard • Confidential';
    doc.text(footerText, pageWidth / 2, pageHeight - 12, { align: 'center' });

    // Save PDF
    doc.save(`${amName.replace(/\s+/g, '_')}_Scorecard_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (amSubmissions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${modalData.color} p-6 flex items-center justify-between`}>
              <h3 className="text-2xl font-bold text-white">{modalData.title}</h3>
              <button
                onClick={() => setModalData(null)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {modalData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-600"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          {item.label}
                        </div>
                        <div className="text-base text-slate-900 dark:text-white font-medium">
                          {item.value}
                        </div>
                        {item.details && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {item.details}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show positives and negatives if available */}
                    {modalData.showFeedback && item.positives && item.negatives && (
                      <div className="grid grid-cols-1 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                        {/* Positives */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <h5 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase">What Went Well</h5>
                          </div>
                          <div className="space-y-3">
                            {item.positives.slice(0, 3).map((pos: any, i: number) => {
                              // Handle both string format and detailed object format
                              const summary = typeof pos === 'string' ? pos : pos.summary;
                              const explanation = typeof pos === 'string' ? null : pos.explanation;
                              
                              return (
                                <div key={i} className="bg-white dark:bg-emerald-900/10 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800">
                                  <div className="flex items-start gap-2">
                                    <span className="text-emerald-500 font-bold text-lg mt-0.5">{i + 1}.</span>
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                                        {summary}
                                      </div>
                                      {explanation && (
                                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {explanation}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Negatives */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <h5 className="text-sm font-bold text-amber-700 dark:text-amber-300 uppercase">Areas for Improvement</h5>
                          </div>
                          <div className="space-y-3">
                            {item.negatives.slice(0, 3).map((neg: any, i: number) => {
                              // Handle both string format and detailed object format
                              const summary = typeof neg === 'string' ? neg : neg.summary;
                              const explanation = typeof neg === 'string' ? null : neg.explanation;
                              
                              return (
                                <div key={i} className="bg-white dark:bg-amber-900/10 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
                                  <div className="flex items-start gap-2">
                                    <span className="text-amber-500 font-bold text-lg mt-0.5">{i + 1}.</span>
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                                        {summary}
                                      </div>
                                      {explanation && (
                                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {explanation}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scorecard Card - Glassmorphism Design */}
      <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50 hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.37)] hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02]" data-am-id={amId}>
        <div className="p-4 bg-gradient-to-br from-white/30 to-blue-50/30 dark:from-slate-800/30 dark:to-slate-900/30">
          {/* Header Section - Compact */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate drop-shadow-sm">{amName}</h3>
              <p className="text-slate-700 dark:text-slate-300 text-xs">
                <span className="font-medium">Surveys:</span> {last3MonthsSubmissions.length}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <div className="text-right">
                <p className="text-slate-600 dark:text-slate-400 text-[10px] font-medium mb-0.5">HRBP</p>
                <p className="text-slate-900 dark:text-white text-xs font-bold truncate max-w-[100px]">{hrbpName}</p>
              </div>
              <button
                onClick={downloadScorecard}
                data-download="true"
                className="p-1.5 hover:bg-blue-500/20 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-110 border border-blue-300/30"
                title="Download PDF"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>

          {/* Latest Score and Last 3 Months - Compact */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-slate-800 dark:text-slate-300 text-xs font-semibold">Latest Score</h4>
              <span className="text-blue-600 dark:text-blue-400 text-xl font-bold drop-shadow-md">{latestScore}</span>
              <span className="text-slate-600 dark:text-slate-400 text-xs">/ 5</span>
              {feedbackData.isAiGenerated && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-sm rounded-md shadow-lg ml-auto border border-white/30">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-[9px] font-bold text-white">AI</span>
                </div>
              )}
            </div>
            
            {/* Last 3 Months Cards - Glassmorphism */}
            <div className="grid grid-cols-3 gap-2">
              {last3Months.map((month, idx) => {
                const score = month.score ? parseFloat(month.score) : null;
                let bgColor = 'bg-slate-400/60 dark:bg-slate-600/60';
                let textColor = 'text-slate-800 dark:text-white';
                let borderColor = 'border-slate-400/40 dark:border-slate-500/40';
                let glowColor = 'shadow-slate-400/50';
                
                if (score !== null) {
                  if (score >= 4.5) {
                    bgColor = 'bg-emerald-400/70 dark:bg-emerald-500/70';
                    textColor = 'text-white';
                    borderColor = 'border-emerald-300/50';
                    glowColor = 'shadow-emerald-500/50';
                  } else if (score >= 3.5) {
                    bgColor = 'bg-amber-300/70 dark:bg-amber-400/70';
                    textColor = 'text-slate-900';
                    borderColor = 'border-amber-300/50';
                    glowColor = 'shadow-amber-400/50';
                  } else if (score >= 2.5) {
                    bgColor = 'bg-rose-400/70 dark:bg-rose-500/70';
                    textColor = 'text-white';
                    borderColor = 'border-rose-400/50';
                    glowColor = 'shadow-rose-500/50';
                  }
                }
                
                return (
                  <div
                    key={idx}
                    className={`${bgColor} backdrop-blur-md rounded-xl p-2 border ${borderColor} shadow-lg ${glowColor} ${
                      score !== null ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''
                    } transition-all duration-200`}
                    onClick={score !== null ? showScoresModal : undefined}
                  >
                    <div className={`text-[9px] font-bold ${textColor} opacity-90 uppercase tracking-wide mb-1 text-center drop-shadow-sm`}>
                      {month.monthName.slice(0, 3)}
                    </div>
                    <div className={`text-2xl font-bold ${textColor} leading-none text-center drop-shadow-md`}>
                      {score !== null ? score : '-'}
                    </div>
                    {score !== null && (
                      <div className={`text-[9px] font-medium ${textColor} opacity-75 text-center mt-0.5`}>
                        {month.count} {month.count !== 1 ? 'surveys' : 'survey'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Positives and Negatives Section - Glassmorphism */}
          <div className="bg-white/50 dark:bg-slate-700/30 backdrop-blur-lg rounded-xl p-3 border border-white/30 dark:border-slate-600/30 shadow-inner">
            <div className="grid grid-cols-2 gap-3">
              {/* Positives */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-emerald-300/30 dark:border-emerald-600/30">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 drop-shadow-md" />
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Positives</h5>
                </div>
                {loadingInsights ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-300/50 dark:bg-slate-600/50 backdrop-blur-sm animate-pulse"></div>
                        <div className="h-2 bg-slate-300/50 dark:bg-slate-600/50 backdrop-blur-sm rounded-full animate-pulse flex-1"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {feedbackData.positives.slice(0, 2).map((pos, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 group">
                        <div className="w-4 h-4 rounded-md bg-emerald-500/80 dark:bg-emerald-600/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md border border-white/20">
                          <span className="text-white text-[9px] font-bold drop-shadow-sm">{idx + 1}</span>
                        </div>
                        <p className="text-[10px] text-slate-800 dark:text-slate-200 leading-snug flex-1 line-clamp-2">
                          {pos}
                        </p>
                      </div>
                    ))}
                    <button
                      onClick={showPositivesModal}
                      className="mt-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline drop-shadow-sm"
                    >
                      View RCA →
                    </button>
                  </div>
                )}
              </div>

              {/* Negatives */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-amber-300/30 dark:border-amber-600/30">
                  <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400 drop-shadow-md" />
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Negatives</h5>
                </div>
                {loadingInsights ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-300/50 dark:bg-slate-600/50 backdrop-blur-sm animate-pulse"></div>
                        <div className="h-2 bg-slate-300/50 dark:bg-slate-600/50 backdrop-blur-sm rounded-full animate-pulse flex-1"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {feedbackData.improvements.slice(0, 2).map((neg, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 group">
                        <div className="w-4 h-4 rounded-md bg-amber-500/80 dark:bg-amber-600/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md border border-white/20">
                          <span className="text-white text-[9px] font-bold drop-shadow-sm">{idx + 1}</span>
                        </div>
                        <p className="text-[10px] text-slate-800 dark:text-slate-200 leading-snug flex-1 line-clamp-2">
                          {neg}
                        </p>
                      </div>
                    ))}
                    <button
                      onClick={showNegativesModal}
                      className="mt-1 text-[9px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline drop-shadow-sm"
                    >
                      View RCA →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AMScorecard;
