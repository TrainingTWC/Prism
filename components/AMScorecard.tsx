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
        // Transform any AI detailedInsight summaries to use product-specific terms
        if (insights?.detailedInsights) {
          try {
            insights.detailedInsights.positives = (insights.detailedInsights.positives || []).map((p: any) => {
              if (typeof p === 'string') return transformSummary(p);
              return { ...p, summary: transformSummary(p.summary || '') };
            });
            insights.detailedInsights.negatives = (insights.detailedInsights.negatives || []).map((n: any) => {
              if (typeof n === 'string') return transformSummary(n);
              return { ...n, summary: transformSummary(n.summary || '') };
            });
          } catch (err) {
            // non-fatal
          }
        }
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

  // Feedback data from AI insights with contradiction removal
  const feedbackData = React.useMemo(() => {
    try {
      if (aiInsights) {
        // Get ALL text from all sources (positives, negatives, AND detailed insights)
        const allPositiveTexts: string[] = [...(aiInsights.positives || [])];
        const allNegativeTexts: string[] = [...(aiInsights.negatives || [])];
        
        // Also include detailed insights summaries
        if (aiInsights.detailedInsights) {
          const detailedPos = (aiInsights.detailedInsights.positives || []).map((p: any) => 
            typeof p === 'string' ? p : p.summary
          );
          const detailedNeg = (aiInsights.detailedInsights.negatives || []).map((n: any) => 
            typeof n === 'string' ? n : n.summary
          );
          allPositiveTexts.push(...detailedPos);
          allNegativeTexts.push(...detailedNeg);
        }
        
        // COMPREHENSIVE topic extraction - check for ALL keywords in a single item
        const extractAllTopics = (text: string): string[] => {
          if (!text || typeof text !== 'string') return ['general'];
          const lower = text.toLowerCase();
          const topics: string[] = [];
          
          // Check for ALL possible topic keywords
          if (lower.includes('zing')) {
            if (lower.includes('learn') || lower.includes('lms')) topics.push('zinglearn');
            if (lower.includes('hr')) topics.push('zinghr');
            // If mentions "zing" but not specific subsystem, tag as generic zing
            if (topics.length === 0) topics.push('zing');
          }
          if (lower.includes('schedule') || lower.includes('roster')) topics.push('scheduling');
          if (lower.includes('training')) topics.push('training');
          if (lower.includes('manager') || lower.includes('leadership')) topics.push('management');
          if (lower.includes('team')) topics.push('teamwork');
          if (lower.includes('communication')) topics.push('communication');
          
          return topics.length > 0 ? topics : ['general'];
        };
      
        // Find ALL topics mentioned across ALL sources
        const allPosTopics = new Set<string>();
        const allNegTopics = new Set<string>();
        
        allPositiveTexts.forEach(text => {
          extractAllTopics(text).forEach(t => allPosTopics.add(t));
        });
        
        allNegativeTexts.forEach(text => {
          extractAllTopics(text).forEach(t => allNegTopics.add(t));
        });
        
        // Find conflicts - topics that appear in BOTH lists (ANYWHERE)
        const conflictingTopics = new Set(
          [...allPosTopics].filter(topic => topic !== 'general' && allNegTopics.has(topic))
        );
        
        console.log('🔍 COMPREHENSIVE Conflict Analysis:', {
          allPosTopics: [...allPosTopics],
          allNegTopics: [...allNegTopics],
          conflicts: [...conflictingTopics],
          positiveTexts: allPositiveTexts,
          negativeTexts: allNegativeTexts
        });
        
        // Helper to check if text mentions any conflicting topic
        const mentionsConflict = (text: string): boolean => {
          const topics = extractAllTopics(text);
          return topics.some(topic => conflictingTopics.has(topic));
        };
        
        // FILTER EVERYTHING - both simple arrays and detailed insights
        const cleanedPositives = (aiInsights.positives || []).filter(text => !mentionsConflict(text));
        const cleanedNegatives = (aiInsights.negatives || []).filter(text => !mentionsConflict(text));
        
        // Also filter detailed insights
        let cleanedDetailedPos = [];
        let cleanedDetailedNeg = [];
        
        if (aiInsights.detailedInsights) {
          cleanedDetailedPos = (aiInsights.detailedInsights.positives || []).filter((p: any) => {
            const text = typeof p === 'string' ? p : p.summary;
            return !mentionsConflict(text);
          });
          
          cleanedDetailedNeg = (aiInsights.detailedInsights.negatives || []).filter((n: any) => {
            const text = typeof n === 'string' ? n : n.summary;
            return !mentionsConflict(text);
          });
        }
        
        // Deduplication within each list
        const deduplicateList = (items: string[]) => {
          const result: string[] = [];
          for (const item of items) {
            if (!item) continue;
            const itemLower = item.toLowerCase().trim();
            const isDuplicate = result.some(existing => {
              const existingLower = existing.toLowerCase().trim();
              return itemLower === existingLower || 
                     (itemLower.length > 30 && (itemLower.includes(existingLower) || existingLower.includes(itemLower)));
            });
            if (!isDuplicate) {
              result.push(item);
            }
          }
          return result;
        };
        
        const finalPositives = deduplicateList(cleanedPositives);
        const finalNegatives = deduplicateList(cleanedNegatives);
        
        // Return filtered data INCLUDING filtered detailed insights
        const filteredAiInsights = {
          ...aiInsights,
          positives: finalPositives,
          negatives: finalNegatives,
          detailedInsights: aiInsights.detailedInsights ? {
            positives: cleanedDetailedPos,
            negatives: cleanedDetailedNeg
          } : undefined
        };
        
        // Update the parent aiInsights state with filtered version
        if (conflictingTopics.size > 0) {
          console.warn('⚠️ REMOVED conflicting topics:', [...conflictingTopics]);
          setAiInsights(filteredAiInsights);
        }        
        return {
          positives: finalPositives.length > 0 ? finalPositives : ['No specific positive feedback recorded'],
          negatives: finalNegatives.length > 0 ? finalNegatives : ['No specific concerns recorded'],
          improvements: finalNegatives.length > 0 ? finalNegatives : ['No specific concerns recorded'],
          isAiGenerated: aiInsights.isAiGenerated
        };
      }
      
      return {
        positives: ['Analyzing...', 'Processing...', 'Generating...'],
        negatives: ['Analyzing...', 'Processing...', 'Generating...'],
        improvements: ['Analyzing...', 'Processing...', 'Generating...'],
        isAiGenerated: false
      };
    } catch (error) {
      console.error('Error processing feedback data:', error);
      return {
        positives: ['Error loading feedback'],
        negatives: ['Error loading feedback'],
        improvements: ['Error loading feedback'],
        isAiGenerated: false
      };
    }
  }, [aiInsights]);

  // Extract positives and negatives from submissions
  // Helper used to normalize strings for deduplication across insights
  const normalizeForDedupe = (s: string) => {
    if (!s) return '';
    let t = String(s).replace(/[\u2018\u2019\u201C\u201D]/g, "'");
    t = t.replace(/\s+/g, ' ').trim();
    t = t.replace(/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi, '');
    t = t.replace(/\b\d{4}\b/g, '');
    t = t.replace(/["\,\.;:\!\?\-\(\)\[\]\/]/g, '');
    t = t.replace(/\s+/g, ' ').trim().toLowerCase();
    return t;
  };

  // Transform specific phrases to more relevant terminology for this product
  const transformSummary = (s: string) => {
    if (!s) return s;
    // Replace mentions of generic computer systems with product-specific names
    return s.replace(/computer systems/ig, 'Zing Learning & Zing HR systems')
            .replace(/computer system/ig, 'Zing Learning & Zing HR systems');
  };

  const getMonthFeedback = (subs: any[]) => {
    try {
      // Question mapping with topics and sentiment direction
      const questionMap: Record<number, { 
        topic: string; 
        title: string; 
        positiveDirection: boolean; // true if high score = positive
      }> = {
        1: { topic: 'work-pressure', title: 'Work pressure in café', positiveDirection: true }, // high score = no pressure (positive)
        2: { topic: 'empowerment', title: 'Decision-making empowerment', positiveDirection: true },
        3: { topic: 'feedback', title: 'Regular performance reviews', positiveDirection: true },
        4: { topic: 'fairness', title: 'Fair treatment within team', positiveDirection: true }, // high score = no partiality (positive)
        5: { topic: 'training', title: 'Training as per Wings program', positiveDirection: true },
        6: { topic: 'apps-systems', title: 'Operational apps & HR systems', positiveDirection: true }, // high score = no issues (positive)
        7: { topic: 'policies', title: 'HR Handbook familiarity', positiveDirection: true },
        8: { topic: 'scheduling', title: 'Work schedule satisfaction', positiveDirection: true },
        9: { topic: 'teamwork', title: 'Team collaboration', positiveDirection: true },
        12: { topic: 'overall-experience', title: 'Overall TWC experience', positiveDirection: true }
      };
      
      // Step 1: Collect all feedback based on question responses (scores)
      interface FeedbackItem {
        text: string;
        topic: string;
        sentiment: 'positive' | 'negative' | 'mixed';
        strength: number; // 1-5
        questionContext: string;
        score: number;
      }
      
      const feedbackItems: FeedbackItem[] = [];
    
    subs.forEach(sub => {
      // Process scored questions (q1-q9, q12)
      Object.entries(questionMap).forEach(([qNum, qInfo]) => {
        const questionKey = `q${qNum}`;
        const response = sub[questionKey];
        
        if (response) {
          // Extract score from the response (could be number or label with score)
          let score = 0;
          if (typeof response === 'number') {
            score = response;
          } else if (typeof response === 'object' && response.score) {
            score = response.score;
          } else if (typeof response === 'string') {
            // Try to extract score from string label
            const scoreMatch = response.match(/score[:\s]*(\d)/i);
            if (scoreMatch) {
              score = parseInt(scoreMatch[1]);
            }
          }
          
          if (score >= 1 && score <= 5) {
            // Determine sentiment based on score and direction
            let sentiment: 'positive' | 'negative' | 'mixed';
            let strength = 0;
            
            if (qInfo.positiveDirection) {
              // High score = positive
              if (score === 5) {
                sentiment = 'positive';
                strength = 5;
              } else if (score === 4) {
                sentiment = 'positive';
                strength = 4;
              } else if (score === 3) {
                sentiment = 'mixed';
                strength = 0; // Skip neutral
              } else if (score === 2) {
                sentiment = 'negative';
                strength = 4;
              } else { // score === 1
                sentiment = 'negative';
                strength = 5;
              }
            }
            
            if (strength > 0) {
              // Create meaningful text from question + response
              const responseLabel = typeof response === 'string' ? response : 
                                  typeof response === 'object' && response.label ? response.label :
                                  `Score: ${score}/5`;
              
              feedbackItems.push({
                text: `${qInfo.title}: ${responseLabel}`,
                topic: qInfo.topic,
                sentiment,
                strength,
                questionContext: questionKey,
                score
              });
            }
          }
        }
      });
      
      // q11 suggestions/improvements (always negative feedback)
      if (sub.q11 && String(sub.q11).trim().length > 10) {
        feedbackItems.push({
          text: String(sub.q11).trim(),
          topic: 'suggestions',
          sentiment: 'negative',
          strength: 3,
          questionContext: 'q11',
          score: 0
        });
      }
    });
    
    // Step 2: Group by topic and calculate statistics
    const topicAnalysis: Record<string, {
      positive: { items: FeedbackItem[], totalStrength: number, avgScore: number },
      negative: { items: FeedbackItem[], totalStrength: number, avgScore: number },
      count: number
    }> = {};
    
    feedbackItems.forEach(item => {
      if (!topicAnalysis[item.topic]) {
        topicAnalysis[item.topic] = {
          positive: { items: [], totalStrength: 0, avgScore: 0 },
          negative: { items: [], totalStrength: 0, avgScore: 0 },
          count: 0
        };
      }
      
      topicAnalysis[item.topic].count++;
      
      if (item.sentiment === 'positive') {
        topicAnalysis[item.topic].positive.items.push(item);
        topicAnalysis[item.topic].positive.totalStrength += item.strength;
      } else if (item.sentiment === 'negative') {
        topicAnalysis[item.topic].negative.items.push(item);
        topicAnalysis[item.topic].negative.totalStrength += item.strength;
      }
    });
    
    // Calculate average scores per topic
    Object.values(topicAnalysis).forEach(analysis => {
      if (analysis.positive.items.length > 0) {
        const avgScore = analysis.positive.items.reduce((sum, item) => sum + item.score, 0) / analysis.positive.items.length;
        analysis.positive.avgScore = avgScore;
      }
      if (analysis.negative.items.length > 0) {
        const avgScore = analysis.negative.items.reduce((sum, item) => sum + item.score, 0) / analysis.negative.items.length;
        analysis.negative.avgScore = avgScore;
      }
    });
    
    // Step 3: Create meaningful summaries for each topic
    const positives: string[] = [];
    const negatives: string[] = [];
    
    Object.entries(topicAnalysis).forEach(([topic, analysis]) => {
      const posCount = analysis.positive.items.length;
      const negCount = analysis.negative.items.length;
      const posStrength = analysis.positive.totalStrength;
      const negStrength = analysis.negative.totalStrength;
      const total = posCount + negCount;
      
      if (total === 0) return;
      
      // Calculate sentiment ratio (need 70% dominance to avoid contradictions)
      const posRatio = posCount / total;
      const negRatio = negCount / total;
      const strengthRatio = posStrength / (posStrength + negStrength || 1);
      
      // Only add if CLEARLY dominant (70%+ by count OR 75%+ by strength)
      if ((posRatio >= 0.7 || strengthRatio >= 0.75) && posCount > 0) {
        // Create aggregated summary for positive feedback
        const avgScore = analysis.positive.avgScore;
        const topicLabel = topic.replace(/-/g, ' ');
        const summary = `${topicLabel.charAt(0).toUpperCase() + topicLabel.slice(1)}: Strong performance (avg ${avgScore.toFixed(1)}/5 from ${posCount} response${posCount > 1 ? 's' : ''})`;
        positives.push(summary);
      } else if ((negRatio >= 0.7 || strengthRatio <= 0.25) && negCount > 0) {
        // Create aggregated summary for negative feedback
        if (topic === 'suggestions') {
          // For suggestions, include the actual text instead of aggregated summary
          analysis.negative.items
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 2) // Max 2 suggestions
            .forEach(item => negatives.push(`Suggestion: ${item.text}`));
        } else {
          const avgScore = analysis.negative.avgScore;
          const topicLabel = topic.replace(/-/g, ' ');
          const summary = `${topicLabel.charAt(0).toUpperCase() + topicLabel.slice(1)}: Needs improvement (avg ${avgScore.toFixed(1)}/5 from ${negCount} response${negCount > 1 ? 's' : ''})`;
          negatives.push(summary);
        }
      }
      // If sentiment is mixed (between 30-70%), skip entirely to avoid contradictions
    });
    
    // Helper to normalize text: collapse whitespace, normalize quotes, remove month names and years
    const normalize = (s: string) => {
      if (!s) return '';
      let t = s.replace(/[\u2018\u2019\u201C\u201D]/g, "'");
      t = t.replace(/\s+/g, ' ').trim();
      // remove month names (case-insensitive) and standalone 4-digit years to avoid duplicate differences
      t = t.replace(/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi, '');
      t = t.replace(/\b\d{4}\b/g, '');
      // remove punctuation except apostrophes
      t = t.replace(/["\,\.;:\!\?\-\(\)\[\]\/]/g, '');
      t = t.replace(/\s+/g, ' ').trim();
      return t;
    };

    // Levenshtein distance for fuzzy similarity
    const levenshtein = (a: string, b: string) => {
      const aLen = a.length;
      const bLen = b.length;
      if (aLen === 0) return bLen;
      if (bLen === 0) return aLen;
      const v0 = new Array(bLen + 1).fill(0);
      const v1 = new Array(bLen + 1).fill(0);
      for (let j = 0; j <= bLen; j++) v0[j] = j;
      for (let i = 0; i < aLen; i++) {
        v1[0] = i + 1;
        for (let j = 0; j < bLen; j++) {
          const cost = a[i] === b[j] ? 0 : 1;
          v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
        }
        for (let j = 0; j <= bLen; j++) v0[j] = v1[j];
      }
      return v1[bLen];
    };

    const similarity = (s1: string, s2: string) => {
      if (!s1 || !s2) return 0;
      const a = s1.toLowerCase();
      const b = s2.toLowerCase();
      const dist = levenshtein(a, b);
      const maxLen = Math.max(a.length, b.length);
      if (maxLen === 0) return 1;
      return 1 - dist / maxLen;
    };

    // Fuzzy dedupe preserving order: skip items that are very similar to an earlier kept item
    const fuzzyDedupe = (arr: string[], threshold = 0.75) => {
      if (!arr || arr.length === 0) return [];
      const out: string[] = [];
      const normalized: string[] = [];
      
      for (const v of arr) {
        if (!v || typeof v !== 'string') continue;
        const n = normalize(v);
        if (!n) continue;
        
        let isDup = false;
        for (let i = 0; i < normalized.length; i++) {
          if (similarity(n, normalized[i]) >= threshold) {
            isDup = true;
            break;
          }
        }
        if (!isDup) {
          out.push(v); // Keep original text, not normalized
          normalized.push(n); // Store normalized for comparison
        }
      }
      return out;
    };

    const uniquePositives = fuzzyDedupe(positives, 0.75).map(transformSummary);
    const uniqueNegatives = fuzzyDedupe(negatives, 0.75).map(transformSummary);

    return {
      positives: uniquePositives.length > 0 ? uniquePositives.slice(0, 5) : ['No specific positive feedback recorded'],
      negatives: uniqueNegatives.length > 0 ? uniqueNegatives.slice(0, 5) : ['No specific concerns recorded']
    };
    } catch (error) {
      console.error('Error in getMonthFeedback:', error);
      return {
        positives: ['Error analyzing feedback'],
        negatives: ['Error analyzing feedback']
      };
    }
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
    // Open modal immediately with loading placeholders, then fetch insights per-month
    setLoadingMonthly(true);

    // Prepare initial items (placeholders) so modal appears instantly
    const initialItems = monthlyScores.map((ms) => ({
      label: ms.month,
      value: `${ms.score} / 5`,
      details: `${ms.count} submission${ms.count !== 1 ? 's' : ''} • Loading...`,
      positives: [{ summary: 'Loading...', explanation: '' }],
      negatives: [{ summary: 'Loading...', explanation: '' }],
      monthInsights: null
    }));

    setModalData({
      title: 'Monthly Performance Analysis',
      color: 'from-violet-500 to-purple-600',
      showFeedback: true,
      isMonthlyAnalysis: true,
      items: initialItems
    });

    try {
      // Fetch insights for each month independently and update modal as results arrive
      const updates = monthlyScores.map(async (ms, idx) => {
        try {
          const monthInsights = await getMonthlyAIInsights(ms.month, ms.submissions);

          // Dedupe and transform detailed insights if present
          let dedupedPos: any[] = monthInsights.detailedInsights?.positives || [];
          let dedupedNeg: any[] = monthInsights.detailedInsights?.negatives || [];

          if (monthInsights.detailedInsights) {
            const posSeen = new Set<string>();
            const newPos: any[] = [];
            (monthInsights.detailedInsights.positives || []).forEach((p: any) => {
              const summary = typeof p === 'string' ? p : p.summary || '';
              const transformed = transformSummary(summary);
              const key = normalizeForDedupe(transformed);
              if (key && !posSeen.has(key)) {
                posSeen.add(key);
                if (typeof p === 'string') newPos.push(transformed);
                else newPos.push({ ...p, summary: transformed });
              }
            });
            dedupedPos = newPos;

            const negSeen = new Set<string>();
            const newNeg: any[] = [];
            (monthInsights.detailedInsights.negatives || []).forEach((n: any) => {
              const summary = typeof n === 'string' ? n : n.summary || '';
              const transformed = transformSummary(summary);
              const key = normalizeForDedupe(transformed);
              if (key && !negSeen.has(key)) {
                negSeen.add(key);
                if (typeof n === 'string') newNeg.push(transformed);
                else newNeg.push({ ...n, summary: transformed });
              }
            });
            dedupedNeg = newNeg;
          }

          // Update modalData incrementally
          setModalData(prev => {
            if (!prev) return prev;
            const newItems = prev.items.map((it) =>
              it.label === ms.month
                ? {
                    label: ms.month,
                    value: `${ms.score} / 5`,
                    details: `${ms.count} submission${ms.count !== 1 ? 's' : ''} • ${monthInsights.isAiGenerated ? 'AI Analysis' : 'Basic Analysis'}`,
                    positives: dedupedPos,
                    negatives: dedupedNeg,
                    monthInsights
                  }
                : it
            );
            return { ...prev, items: newItems };
          });
        } catch (err) {
          console.error('Error loading monthly insights for', ms.month, err);
          // On error, populate with fallback basic feedback
          const feedback = getMonthFeedback(ms.submissions);
          setModalData(prev => {
            if (!prev) return prev;
            const newItems = prev.items.map((it) =>
              it.label === ms.month
                ? {
                    label: ms.month,
                    value: `${ms.score} / 5`,
                    details: `${ms.count} submission${ms.count !== 1 ? 's' : ''} • Basic Analysis`,
                    positives: feedback.positives.map(p => ({ summary: p, explanation: 'Basic keyword analysis' })),
                    negatives: feedback.negatives.map(n => ({ summary: n, explanation: 'Basic keyword analysis' })),
                    monthInsights: null
                  }
                : it
            );
            return { ...prev, items: newItems };
          });
        }
      });

      // Wait for all background updates to complete, then turn off loading indicator
      await Promise.allSettled(updates);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const showPositivesModal = () => {
    const detailedPositives = aiInsights?.detailedInsights?.positives || [];

    const items = (detailedPositives.length > 0
      ? detailedPositives.map((p: any, i: number) => {
          const summary = typeof p === 'string' ? p : p.summary || '';
          const explanation = typeof p === 'string' ? undefined : p.explanation;
          return {
            label: `Success Factor ${i + 1}`,
            value: transformSummary(summary),
            details: explanation
          };
        })
      : feedbackData.positives.map((p: string, i: number) => ({
          label: `Strength ${i + 1}`,
          value: transformSummary(p),
          details: 'Detailed analysis will be available once AI insights are processed.'
        })));

    setModalData({
      title: 'Root Cause Analysis - Positive Factors',
      color: 'from-emerald-500 to-teal-600',
      items
    });
  };

  const showNegativesModal = () => {
    const detailedNegatives = aiInsights?.detailedInsights?.negatives || [];

    const items = (detailedNegatives.length > 0
      ? detailedNegatives.map((n: any, i: number) => {
          const summary = typeof n === 'string' ? n : n.summary || '';
          const explanation = typeof n === 'string' ? undefined : n.explanation;
          return {
            label: `Improvement Area ${i + 1}`,
            value: transformSummary(summary),
            details: explanation
          };
        })
      : feedbackData.improvements.map((n: string, i: number) => ({
          label: `Area ${i + 1}`,
          value: transformSummary(n),
          details: 'Detailed analysis will be available once AI insights are processed.'
        })));

    setModalData({
      title: 'Root Cause Analysis - Areas for Improvement',
      color: 'from-amber-500 to-orange-600',
      items
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
    // monthlyScores store scores as strings (e.g. "4.28"); format numerics to 2 decimals
    const numeric = Number(latestScoreRaw as any);
    const latestStr = Number.isFinite(numeric) ? numeric.toFixed(2) : String(latestScoreRaw);
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
          // Full title - no truncation, just first sentence
          let title = insight.summary;
          if (title.includes('.')) title = title.split('.')[0];
          const summaryLines = doc.splitTextToSize(title, pageWidth - 55);
          // Full explanation - wrap to multiple lines if needed
          const explanation = insight.explanation || '';
          const explanationLines = doc.splitTextToSize(explanation, pageWidth - 55);
          successContentBlocks.push({ type: 'summary', lines: summaryLines });
          successContentBlocks.push({ type: 'explanation', lines: explanationLines });
          estimatedY += (summaryLines.length + explanationLines.length) * 3 + 7;
        });
      } else {
        feedbackData.positives.slice(0, 3).forEach((pos: string) => {
          // Full text - no truncation
          const lines = doc.splitTextToSize(pos, pageWidth - 55);
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
          // Full title - no truncation, just first sentence
          let title = insight.summary;
          if (title.includes('.')) title = title.split('.')[0];
          const summaryLines = doc.splitTextToSize(title, pageWidth - 55);
          // Full explanation - wrap to multiple lines if needed
          const explanation = insight.explanation || '';
          const explanationLines = doc.splitTextToSize(explanation, pageWidth - 55);
          improvementContentBlocks.push({ type: 'summary', lines: summaryLines });
          improvementContentBlocks.push({ type: 'explanation', lines: explanationLines });
          impEstimatedY += (summaryLines.length + explanationLines.length) * 3 + 7;
        });
      } else {
        feedbackData.negatives.slice(0, 3).forEach((neg: string) => {
          // Full text - no truncation
          const lines = doc.splitTextToSize(neg, pageWidth - 55);
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
