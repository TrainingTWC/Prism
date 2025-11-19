import React, { useState, useEffect } from 'react';
import { Download, Sparkles, TrendingUp, TrendingDown, X, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseSubmissionDate, getMonthKey } from '../utils/dateParser';
import { getCachedAMInsights, generateMonthlyInsights } from '../services/aiInsightsService';
import { EMBEDDED_LOGO } from '../src/assets/embeddedLogo';

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
  
  // Filter submissions for this AM
  const amSubmissions = submissions.filter((sub: any) => sub.amId === amId);

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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Modern One UI Header with Logo
    // Soft gradient header background
    doc.setFillColor(248, 250, 252); // Light slate
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Add PRISM logo
    if (EMBEDDED_LOGO && EMBEDDED_LOGO.startsWith('data:image')) {
      try {
        const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = EMBEDDED_LOGO;
        });
        
        const aspectRatio = imgEl.width / imgEl.height;
        const logoHeight = 15;
        const logoWidth = logoHeight * aspectRatio;
        
        doc.addImage(EMBEDDED_LOGO, 'PNG', 15, 8, logoWidth, logoHeight);
      } catch (err) {
        console.error('Failed to load logo:', err);
      }
    }
    
    // Title with modern typography
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Area Manager Scorecard', pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Performance & Feedback Analysis', pageWidth / 2, 28, { align: 'center' });
    
    // Generated date in corner
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth - 15, 40, { align: 'right' });
    
    // Thin separator line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(15, 45, pageWidth - 15, 45);
    
    let yPos = 55;
    
    // AM Name Card - One UI Style
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'FD');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'S');
    
    // Avatar circle
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.circle(25, yPos + 12.5, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const initials = amName.split(' ').map(n => n[0]).join('').substring(0, 2);
    doc.text(initials, 25, yPos + 15, { align: 'center' });
    
    // AM Name
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(amName, 38, yPos + 12);
    
    // Metadata badges
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${amSubmissions.length} Surveys  •  ${monthlyScores.length} Months`, 38, yPos + 20);
    
    yPos += 35;

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

      const scoreTableData = monthlyScores.map(ms => [ms.month, ms.score]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Month', 'Score']],
        body: scoreTableData,
        theme: 'plain',
        headStyles: {
          fillColor: [245, 247, 250], // slate-50
          textColor: [71, 85, 105], // slate-600
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 10,
          cellPadding: 8
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          halign: 'left',
          fontSize: 10,
          cellPadding: 8
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { 
            cellWidth: 100,
            fontStyle: 'normal'
          },
          1: { 
            cellWidth: 60,
            fontStyle: 'bold',
            textColor: [124, 58, 237], // violet-600
            halign: 'center'
          }
        },
        margin: { left: 15, right: 15 },
        didDrawCell: (data: any) => {
          // Add subtle borders
          if (data.section === 'body') {
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.1);
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // AI Insights section with detailed analysis
      // Section header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('AI-Powered Root Cause Analysis', 15, yPos);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const analysisSubtitle = feedbackData.isAiGenerated 
        ? 'Detailed analysis generated by artificial intelligence from employee feedback'
        : 'Basic analysis from employee responses (AI analysis unavailable)';
      doc.text(analysisSubtitle, 15, yPos + 6);
      
      yPos += 15;

      // Get detailed AI insights if available
      const detailedPositives = aiInsights?.detailedInsights?.positives || [];
      const detailedNegatives = aiInsights?.detailedInsights?.negatives || [];
      
      // Success Factors Section
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'F');
      doc.setDrawColor(167, 243, 208); // emerald-200
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'S');
      
      // Positives header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('Success Factors - What is Working Well', 20, yPos + 10);
      
      let currentY = yPos + 18;
      
      if (detailedPositives.length > 0) {
        // Use detailed AI insights
        detailedPositives.slice(0, 3).forEach((insight: any, idx: number) => {
          // Title
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(6, 78, 59); // emerald-900
          doc.text(`${idx + 1}. ${insight.summary}`, 20, currentY);
          
          // Explanation
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105); // slate-600
          const explanationLines = doc.splitTextToSize(insight.explanation, pageWidth - 55);
          doc.text(explanationLines, 25, currentY + 4);
          
          currentY += 4 + (explanationLines.length * 3) + 3;
        });
      } else {
        // Fallback to basic insights
        feedbackData.positives.slice(0, 3).forEach((pos: string, idx: number) => {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(6, 78, 59); // emerald-900
          const lines = doc.splitTextToSize(`• ${pos}`, pageWidth - 55);
          doc.text(lines, 20, currentY);
          currentY += lines.length * 3 + 2;
        });
      }
      
      yPos = Math.max(yPos + 45, currentY) + 10;
      
      // Areas for Improvement Section
      doc.setFillColor(255, 251, 235); // amber-50
      doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'F');
      doc.setDrawColor(253, 230, 138); // amber-200
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'S');
      
      // Improvements header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text('Areas for Improvement - Root Cause Analysis', 20, yPos + 10);
      
      currentY = yPos + 18;
      
      if (detailedNegatives.length > 0) {
        // Use detailed AI insights
        detailedNegatives.slice(0, 3).forEach((insight: any, idx: number) => {
          // Title
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(120, 53, 15); // amber-900
          doc.text(`${idx + 1}. ${insight.summary}`, 20, currentY);
          
          // Explanation
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105); // slate-600
          const explanationLines = doc.splitTextToSize(insight.explanation, pageWidth - 55);
          doc.text(explanationLines, 25, currentY + 4);
          
          currentY += 4 + (explanationLines.length * 3) + 3;
        });
      } else {
        // Fallback to basic insights
        feedbackData.improvements.slice(0, 3).forEach((imp: string, idx: number) => {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 53, 15); // amber-900
          const lines = doc.splitTextToSize(`• ${imp}`, pageWidth - 55);
          doc.text(lines, 20, currentY);
          currentY += lines.length * 3 + 2;
        });
      }
      
      yPos = Math.max(yPos + 45, currentY) + 15;
      
      // AI Analysis Attribution Section
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'S');
      
      if (feedbackData.isAiGenerated) {
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
      } else {
        // Basic analysis notice
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text('Basic Statistical Analysis', pageWidth / 2, yPos + 8, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105); // slate-600
        const basicNotice = 'This analysis is based on keyword detection and statistical patterns. For detailed AI-powered insights, ensure the GitHub API token is configured in the system.';
        const basicNoticeLines = doc.splitTextToSize(basicNotice, pageWidth - 50);
        doc.text(basicNoticeLines, pageWidth / 2, yPos + 14, { align: 'center' });
      }
      
      yPos += 30;
    } else {
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text('No submissions found for this Area Manager', 15, yPos);
    }
    
    // Footer with AI attribution
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerText = feedbackData.isAiGenerated 
      ? 'PRISM Dashboard • Confidential • AI-Enhanced Analytics'
      : 'PRISM Dashboard • Confidential • Basic Analytics';
    doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Additional footer line for AI
    if (feedbackData.isAiGenerated) {
      doc.setFontSize(6);
      doc.setTextColor(147, 51, 234); // purple-600
      doc.text('Insights generated using GPT-4.1-mini via GitHub Models', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

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

      {/* Scorecard - Clean & Separated Design */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 mb-8" data-am-id={amId}>
        {/* Header - Simple with strong border */}
        <div className="bg-white dark:bg-slate-800 p-6 border-b-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100 dark:ring-blue-900">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{amName}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-lg">
                    {amSubmissions.length} survey{amSubmissions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold rounded-lg">
                    {monthlyScores.length} month{monthlyScores.length !== 1 ? 's' : ''}
                  </span>
                  {/* AI Indicator */}
                  {feedbackData.isAiGenerated && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-bold text-white">AI Powered</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={downloadScorecard}
              data-download="true"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3.5 rounded-2xl transition-all duration-200 hover:scale-105 font-bold shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>        <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
          {/* Performance Scores - Clickable Card */}
          {monthlyScores.length > 0 && (
            <div 
              onClick={loadingMonthly ? undefined : showScoresModal}
              className={`mb-6 bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-300 dark:border-slate-600 transition-all duration-200 ${
                loadingMonthly 
                  ? 'cursor-wait opacity-70' 
                  : 'cursor-pointer hover:shadow-xl hover:scale-[1.01] hover:border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Performance Score</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {loadingMonthly ? 'Generating AI analysis...' : 'Click for detailed AI analysis'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-violet-600 dark:text-violet-400">
                    {(monthlyScores.reduce((sum, ms) => sum + parseFloat(ms.score), 0) / monthlyScores.length).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Average</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {monthlyScores.slice(0, 6).map((ms, idx) => (
                  <div key={idx} className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 border border-slate-300 dark:border-slate-600">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                      {ms.month.split(' ')[0].slice(0, 3)}
                    </div>
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {ms.score}
                    </div>
                  </div>
                ))}
              </div>
              {monthlyScores.length > 6 && (
                <div className="text-center mt-3 text-sm text-violet-600 dark:text-violet-400 font-medium">
                  +{monthlyScores.length - 6} more months
                </div>
              )}
            </div>
          )}

          {/* Feedback Cards - Clean Design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Positives - Clickable */}
            <div 
              onClick={showPositivesModal}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-[1.01] hover:border-emerald-500"
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Positives</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Tap to view details</p>
                  </div>
                </div>
                
                {loadingInsights ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse flex-1"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {feedbackData.positives.slice(0, 3).map((feedback, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></div>
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {feedback}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Negatives - Clickable */}
            <div 
              onClick={showNegativesModal}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-[1.01] hover:border-amber-500"
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Improvements</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Tap to view details</p>
                  </div>
                </div>
                
                {loadingInsights ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse flex-1"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {feedbackData.improvements.slice(0, 3).map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {improvement}
                        </span>
                      </li>
                    ))}
                  </ul>
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
