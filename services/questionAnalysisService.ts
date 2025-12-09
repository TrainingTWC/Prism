/**
 * Question Analysis Service
 * Analyzes individual question responses to identify best/worst performing questions
 * Based on response distribution (1-5 scale) for each question
 */

import { Submission } from '../types';
import { QUESTIONS } from '../constants';

export interface ResponseDistribution {
  questionId: string;
  questionTitle: string;
  count1: number; // Bad
  count2: number; // Bad
  count3: number; // Neutral
  count4: number; // Good
  count5: number; // Good
  totalResponses: number;
  badCount: number; // 1s + 2s
  goodCount: number; // 4s + 5s
  neutralCount: number; // 3s
  badPercentage: number;
  goodPercentage: number;
  remarks: string[]; // All remarks for this question
  isReverseScored: boolean; // Q1, Q4, Q6 are reverse scored
}

export interface QuestionPerformance {
  best: ResponseDistribution[];
  worst: ResponseDistribution[];
}

// Questions that are reverse-scored (high score means problem exists)
const REVERSE_SCORED_QUESTIONS = ['q1', 'q4', 'q6'];

/**
 * Extract score from response (can be string label or number)
 */
const extractScore = (response: any): number | null => {
  if (!response) return null;
  
  // Direct number
  if (typeof response === 'number' && response >= 1 && response <= 5) {
    return response;
  }
  
  // Object with score
  if (typeof response === 'object' && response.score) {
    return response.score;
  }
  
  // String - map common labels to scores
  if (typeof response === 'string') {
    const lowerResponse = response.toLowerCase().trim();
    
    // Map standard labels
    const labelMap: Record<string, number> = {
      'never': 5,
      'at time': 4,
      'sometime': 3,
      'most of the time': 2,
      'every time': 1,
      'excellent': 5,
      'very good': 4,
      'good': 3,
      'average': 2,
      'poor': 1
    };
    
    if (labelMap[lowerResponse]) {
      return labelMap[lowerResponse];
    }
    
    // Try to extract number from string
    const match = lowerResponse.match(/(\d)/);
    if (match) {
      const score = parseInt(match[1]);
      if (score >= 1 && score <= 5) return score;
    }
  }
  
  return null;
};

/**
 * Analyze response distributions for all questions in a set of submissions
 */
export const analyzeQuestionDistributions = (
  submissions: Submission[]
): Map<string, ResponseDistribution> => {
  
  const distributions = new Map<string, ResponseDistribution>();
  
  // Initialize distributions for Q1-Q9 and Q12 (skip Q10, Q11 - text only)
  const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q12'];
  
  questionIds.forEach(qId => {
    const question = QUESTIONS.find(q => q.id === qId);
    if (!question) return;
    
    distributions.set(qId, {
      questionId: qId,
      questionTitle: question.title,
      count1: 0,
      count2: 0,
      count3: 0,
      count4: 0,
      count5: 0,
      totalResponses: 0,
      badCount: 0,
      goodCount: 0,
      neutralCount: 0,
      badPercentage: 0,
      goodPercentage: 0,
      remarks: [],
      isReverseScored: REVERSE_SCORED_QUESTIONS.includes(qId)
    });
  });
  
  // Process each submission
  submissions.forEach(sub => {
    questionIds.forEach(qId => {
      const dist = distributions.get(qId)!;
      const response = (sub as any)[qId];
      const remarksKey = `${qId}_remarks`;
      const remarks = (sub as any)[remarksKey];
      
      // Extract score
      const score = extractScore(response);
      
      if (score !== null) {
        dist.totalResponses++;
        
        // Count by score
        switch(score) {
          case 1: dist.count1++; break;
          case 2: dist.count2++; break;
          case 3: dist.count3++; break;
          case 4: dist.count4++; break;
          case 5: dist.count5++; break;
        }
      }
      
      // Collect remarks if present
      if (remarks && typeof remarks === 'string' && remarks.trim() !== '') {
        dist.remarks.push(remarks.trim());
      }
    });
  });
  
  // Calculate percentages
  distributions.forEach(dist => {
    if (dist.totalResponses > 0) {
      dist.badCount = dist.count1 + dist.count2;
      dist.neutralCount = dist.count3;
      dist.goodCount = dist.count4 + dist.count5;
      
      dist.badPercentage = (dist.badCount / dist.totalResponses) * 100;
      dist.goodPercentage = (dist.goodCount / dist.totalResponses) * 100;
    }
  });
  
  return distributions;
};

/**
 * Identify top 3 best and worst questions based on response distributions
 * For reverse-scored questions (Q1, Q4, Q6): high scores = bad, low scores = good
 * For normal questions: high scores = good, low scores = bad
 */
export const identifyBestWorstQuestions = (
  distributions: Map<string, ResponseDistribution>
): QuestionPerformance => {
  
  const allDists = Array.from(distributions.values())
    .filter(d => d.totalResponses > 0); // Only questions with responses
  
  // Calculate "performance score" for each question
  // Higher performance score = better
  const scored = allDists.map(dist => {
    let performanceScore = 0;
    
    if (dist.isReverseScored) {
      // For reverse scored: low scores (1,2) are GOOD, high scores (4,5) are BAD
      performanceScore = dist.badPercentage - dist.goodPercentage;
      // Flip so higher is better
      performanceScore = -performanceScore;
    } else {
      // For normal: high scores (4,5) are GOOD, low scores (1,2) are BAD
      performanceScore = dist.goodPercentage - dist.badPercentage;
    }
    
    return {
      distribution: dist,
      performanceScore
    };
  });
  
  // Sort by performance (best to worst)
  scored.sort((a, b) => b.performanceScore - a.performanceScore);
  
  // Top 3 best (highest performance)
  const best = scored.slice(0, 3).map(s => s.distribution);
  
  // Top 3 worst (lowest performance)
  const worst = scored.slice(-3).reverse().map(s => s.distribution);
  
  return { best, worst };
};

/**
 * Analyze questions per Area Manager per month
 */
export const analyzeQuestionsByAMAndMonth = (
  amId: string,
  submissions: Submission[]
): Map<string, QuestionPerformance> => {
  
  // Filter submissions for this AM
  const amSubs = submissions.filter(s => s.amId === amId);
  
  // Group by month
  const byMonth = new Map<string, Submission[]>();
  
  amSubs.forEach(sub => {
    const date = new Date(sub.submissionTime);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!byMonth.has(monthKey)) {
      byMonth.set(monthKey, []);
    }
    byMonth.get(monthKey)!.push(sub);
  });
  
  // Analyze each month
  const monthlyPerformance = new Map<string, QuestionPerformance>();
  
  byMonth.forEach((subs, monthKey) => {
    const distributions = analyzeQuestionDistributions(subs);
    const performance = identifyBestWorstQuestions(distributions);
    monthlyPerformance.set(monthKey, performance);
  });
  
  return monthlyPerformance;
};

/**
 * Get the latest month's analysis
 */
export const getLatestMonthAnalysis = (
  monthlyPerformance: Map<string, QuestionPerformance>
): { monthKey: string; performance: QuestionPerformance } | null => {
  
  if (monthlyPerformance.size === 0) return null;
  
  // Get most recent month
  const months = Array.from(monthlyPerformance.keys()).sort();
  const latestMonth = months[months.length - 1];
  
  return {
    monthKey: latestMonth,
    performance: monthlyPerformance.get(latestMonth)!
  };
};
