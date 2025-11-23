/**
 * 4P Framework AI Analysis Service
 * Analyzes all checklist data (HR, Training, Operations, QA, Finance) 
 * and maps to People, Process, Product, Place framework with AI-powered insights
 */

import { aiRequestQueue } from './requestQueue';
import { OPERATIONS_QUESTIONS } from '../constants';

interface FourPInsight {
  summary: string;
  explanation: string;
  source: string; // Which checklist(s) this came from
  score: number; // 0-5 score
}

export interface FourPAnalysis {
  people: {
    score: number;
    maxScore: number;
    percentage: number;
    insights: FourPInsight[];
    aiGenerated: boolean;
  };
  process: {
    score: number;
    maxScore: number;
    percentage: number;
    insights: FourPInsight[];
    aiGenerated: boolean;
  };
  product: {
    score: number;
    maxScore: number;
    percentage: number;
    insights: FourPInsight[];
    aiGenerated: boolean;
  };
  place: {
    score: number;
    maxScore: number;
    percentage: number;
    insights: FourPInsight[];
    aiGenerated: boolean;
  };
  overallScore: number;
  overallPercentage: number;
  dataTimestamp: string;
}

interface ChecklistData {
  hr: any[];
  operations: any[];
  training: any[];
  qa: any[];
  finance: any[];
}

// Question mapping to 4Ps based on our planning document
const QUESTION_TO_4P: Record<string, string> = {
  // HR Questions (q1-q12) -> People
  'q1': 'people', 'q2': 'people', 'q3': 'people', 'q4': 'people',
  'q5': 'people', 'q6': 'people', 'q7': 'people', 'q8': 'people',
  'q9': 'people', 'q10': 'people', 'q11': 'people', 'q12': 'people',
  
  // Operations - Cheerful Greeting (CG) -> Place
  'CG_1': 'place', 'CG_2': 'place', 'CG_3': 'place', 'CG_4': 'place',
  'CG_5': 'place', 'CG_6': 'place', 'CG_7': 'place', 'CG_8': 'place',
  'CG_9': 'product', 'CG_10': 'product', 'CG_11': 'people', 'CG_12': 'place', 'CG_13': 'place',
  
  // Operations - Order Taking Assistance (OTA) -> Process
  'OTA_1': 'process', 'OTA_2': 'people', 'OTA_3': 'process', 'OTA_4': 'process',
  'OTA_5': 'process', 'OTA_6': 'process', 'OTA_7': 'process', 'OTA_8': 'process',
  'OTA_9': 'process', 'OTA_10': 'product', 'OTA_11': 'process',
  
  // Operations - Friendly & Accurate Service (FAS) -> Mixed
  'FAS_1': 'product', 'FAS_2': 'product', 'FAS_3': 'process', 'FAS_4': 'process',
  'FAS_5': 'process', 'FAS_6': 'people', 'FAS_7': 'people', 'FAS_8': 'people',
  'FAS_9': 'place', 'FAS_10': 'place', 'FAS_11': 'people', 'FAS_12': 'process', 'FAS_13': 'process',
  
  // Operations - Food & Service Excellence (FE) -> Mixed
  'FE_1': 'place', 'FE_2': 'process', 'FE_3': 'process', 'FE_4': 'product',
  'FE_5': 'product', 'FE_6': 'product', 'FE_7': 'product', 'FE_8': 'people',
  'FE_9': 'people', 'FE_10': 'process',
  
  // Operations - Efficiency (E) -> Mixed
  'E_1': 'process', 'E_2': 'process', 'E_3': 'process', 'E_4': 'process',
  'E_5': 'people', 'E_6': 'people', 'E_7': 'place'
};

/**
 * Main function to generate 4P analysis from all checklist data
 */
export async function generate4PAnalysis(data: ChecklistData): Promise<FourPAnalysis> {
  console.log('🎯 Starting 4P Framework Analysis...');
  console.log('📊 Data received:', {
    hr: data.hr?.length || 0,
    operations: data.operations?.length || 0,
    training: data.training?.length || 0,
    qa: data.qa?.length || 0,
    finance: data.finance?.length || 0
  });

  // Calculate scores for each P
  const peopleData = calculate4PScore(data, 'people');
  const processData = calculate4PScore(data, 'process');
  const productData = calculate4PScore(data, 'product');
  const placeData = calculate4PScore(data, 'place');

  // Collect all remarks for AI analysis
  const allRemarks = collectAllRemarks(data);
  
  // Try AI analysis
  let aiInsights: any = null;
  try {
    if (allRemarks.length > 0) {
      console.log(`🤖 Analyzing ${allRemarks.length} remarks with AI...`);
      aiInsights = await analyzeRemarksWithAI(allRemarks, data);
    }
  } catch (error) {
    console.warn('⚠️ AI analysis failed, using fallback insights:', error);
  }

  // Calculate weighted overall score (People 30%, Process 25%, Product 25%, Place 20%)
  const overallScore = 
    (peopleData.percentage * 0.30) +
    (processData.percentage * 0.25) +
    (productData.percentage * 0.25) +
    (placeData.percentage * 0.20);

  return {
    people: {
      ...peopleData,
      insights: aiInsights?.people || peopleData.insights,
      aiGenerated: aiInsights?.aiGenerated || false
    },
    process: {
      ...processData,
      insights: aiInsights?.process || processData.insights,
      aiGenerated: aiInsights?.aiGenerated || false
    },
    product: {
      ...productData,
      insights: aiInsights?.product || productData.insights,
      aiGenerated: aiInsights?.aiGenerated || false
    },
    place: {
      ...placeData,
      insights: aiInsights?.place || placeData.insights,
      aiGenerated: aiInsights?.aiGenerated || false
    },
    overallScore,
    overallPercentage: overallScore,
    dataTimestamp: new Date().toISOString()
  };
}

/**
 * Calculate score for one of the 4Ps
 */
function calculate4PScore(data: ChecklistData, category: 'people' | 'process' | 'product' | 'place') {
  let totalScore = 0;
  let maxPossibleScore = 0;
  const categoryRemarks: string[] = [];

  // Process HR data (all HR questions map to People)
  if (category === 'people' && data.hr) {
    data.hr.forEach((submission: any) => {
      for (let i = 1; i <= 12; i++) {
        const questionId = `q${i}`;
        const answer = submission[questionId];
        const remarksKey = `${questionId}_remarks`;
        const remark = submission[remarksKey];
        
        if (answer) {
          const score = parseInt(answer) || 0;
          totalScore += score;
          maxPossibleScore += 5;
        }
        
        if (remark && String(remark).trim().length > 5) {
          categoryRemarks.push(String(remark).trim());
        }
      }
    });
  }

  // Process Operations data
  if (data.operations) {
    data.operations.forEach((submission: any) => {
      Object.keys(QUESTION_TO_4P).forEach(questionId => {
        if (QUESTION_TO_4P[questionId] === category) {
          const answer = submission[questionId];
          const remarksKey = `${questionId}_remarks`;
          const remark = submission[remarksKey];
          
          if (answer) {
            // Operations questions are Yes(1)/No(0)
            const score = answer === 'Yes' ? 1 : 0;
            totalScore += score;
            maxPossibleScore += 1;
          }
          
          if (remark && String(remark).trim().length > 5) {
            categoryRemarks.push(String(remark).trim());
          }
        }
      });
    });
  }

  // Process Training, QA, Finance data (add similar logic for their question structures)
  // TODO: Map training/QA/finance questions to categories

  const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  // Generate fallback insights if no AI
  const fallbackInsights: FourPInsight[] = generateFallbackInsights(category, percentage, categoryRemarks);

  return {
    score: totalScore,
    maxScore: maxPossibleScore,
    percentage: Math.round(percentage * 10) / 10,
    insights: fallbackInsights
  };
}

/**
 * Collect all remarks from all checklists
 */
function collectAllRemarks(data: ChecklistData): Array<{text: string, source: string, category: string}> {
  const remarks: Array<{text: string, source: string, category: string}> = [];

  // HR remarks
  if (data.hr) {
    data.hr.forEach((sub: any) => {
      for (let i = 1; i <= 12; i++) {
        const key = `q${i}_remarks`;
        const remark = sub[key];
        if (remark && String(remark).trim().length > 5) {
          remarks.push({
            text: String(remark).trim(),
            source: 'HR Survey',
            category: 'people'
          });
        }
      }
      // Q11 is suggestions textarea
      if (sub.q11 && String(sub.q11).trim().length > 5) {
        remarks.push({
          text: String(sub.q11).trim(),
          source: 'HR Survey',
          category: 'people'
        });
      }
    });
  }

  // Operations remarks
  if (data.operations) {
    data.operations.forEach((sub: any) => {
      Object.keys(QUESTION_TO_4P).forEach(questionId => {
        const key = `${questionId}_remarks`;
        const remark = sub[key];
        if (remark && String(remark).trim().length > 5) {
          remarks.push({
            text: String(remark).trim(),
            source: 'Operations Audit',
            category: QUESTION_TO_4P[questionId]
          });
        }
      });
    });
  }

  // Training, QA, Finance remarks
  // TODO: Add when their schemas are mapped

  console.log(`📝 Collected ${remarks.length} total remarks across all checklists`);
  return remarks;
}

/**
 * Analyze remarks with AI using GitHub Models API
 */
async function analyzeRemarksWithAI(remarks: Array<{text: string, source: string, category: string}>, data: ChecklistData): Promise<any> {
  console.log('🤖 Queueing AI analysis for 4P framework...');
  
  return await aiRequestQueue.add(async () => {
    // Group remarks by category
    const remarksByCategory = {
      people: remarks.filter(r => r.category === 'people').map(r => r.text),
      process: remarks.filter(r => r.category === 'process').map(r => r.text),
      product: remarks.filter(r => r.category === 'product').map(r => r.text),
      place: remarks.filter(r => r.category === 'place').map(r => r.text)
    };

    const prompt = `You are analyzing employee feedback and operational audit data for a coffee chain across the 4P framework: People, Process, Product, and Place.

**Data Summary:**
- HR Surveys: ${data.hr?.length || 0} submissions
- Operations Audits: ${data.operations?.length || 0} submissions
- Training Records: ${data.training?.length || 0} records
- QA Audits: ${data.qa?.length || 0} audits
- Finance Data: ${data.finance?.length || 0} records

**Remarks by Category:**

**PEOPLE (Employee Experience, Team, Culture):**
${remarksByCategory.people.slice(0, 30).join('\n- ')}

**PROCESS (Operations, Workflows, Efficiency):**
${remarksByCategory.process.slice(0, 30).join('\n- ')}

**PRODUCT (Coffee Quality, Food, Menu):**
${remarksByCategory.product.slice(0, 30).join('\n- ')}

**PLACE (Store Condition, Ambiance, Facilities):**
${remarksByCategory.place.slice(0, 30).join('\n- ')}

Analyze these remarks and provide:
1. Top 3-5 insights (positive trends) for each P
2. Top 3-5 concerns (issues to address) for each P

Format your response as JSON:
{
  "people": [
    {"summary": "Brief insight title", "explanation": "Detailed explanation", "score": 1-5},
    ...
  ],
  "process": [...],
  "product": [...],
  "place": [...]
}`;

    try {
      const response = await fetch('http://localhost:3003/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert business analyst specializing in restaurant operations and employee experience. Provide concise, actionable insights in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`AI API returned ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in AI response');
      }

      // Parse JSON from AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from AI response');
      }

      const aiInsights = JSON.parse(jsonMatch[0]);
      console.log('✅ AI analysis complete for 4P framework');

      return {
        ...aiInsights,
        aiGenerated: true
      };
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      throw error;
    }
  });
}

/**
 * Generate fallback insights when AI is not available
 */
function generateFallbackInsights(category: string, percentage: number, remarks: string[]): FourPInsight[] {
  const insights: FourPInsight[] = [];

  const remarkCount = remarks.length;
  const scoreLevel = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : percentage >= 40 ? 'fair' : 'needs attention';

  switch (category) {
    case 'people':
      insights.push({
        summary: `Employee experience score: ${percentage.toFixed(1)}% (${scoreLevel})`,
        explanation: `Based on ${remarkCount} feedback items from HR surveys and team assessments.`,
        source: 'HR Survey',
        score: percentage / 20 // Convert to 0-5
      });
      break;
    case 'process':
      insights.push({
        summary: `Operational efficiency: ${percentage.toFixed(1)}% (${scoreLevel})`,
        explanation: `Process compliance and workflow efficiency measured across ${remarkCount} audit points.`,
        source: 'Operations Audit',
        score: percentage / 20
      });
      break;
    case 'product':
      insights.push({
        summary: `Product quality: ${percentage.toFixed(1)}% (${scoreLevel})`,
        explanation: `Coffee and food quality scores from ${remarkCount} quality checks and audits.`,
        source: 'QA Audit',
        score: percentage / 20
      });
      break;
    case 'place':
      insights.push({
        summary: `Store condition: ${percentage.toFixed(1)}% (${scoreLevel})`,
        explanation: `Cleanliness, ambiance, and facility maintenance across ${remarkCount} inspection points.`,
        source: 'Operations Audit',
        score: percentage / 20
      });
      break;
  }

  return insights;
}

/**
 * Cache key for 4P analysis
 */
export function get4PCacheKey(filters: {
  dateRange?: { start: string; end: string };
  region?: string;
  store?: string;
  am?: string;
}): string {
  return `4p_analysis_${JSON.stringify(filters)}`;
}

/**
 * Get cached 4P analysis
 */
export async function getCached4PAnalysis(cacheKey: string): Promise<FourPAnalysis | null> {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      // Cache valid for 1 hour
      if (Date.now() - new Date(data.dataTimestamp).getTime() < 3600000) {
        console.log('✅ Using cached 4P analysis');
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading 4P cache:', error);
  }
  return null;
}

/**
 * Save 4P analysis to cache
 */
export function cache4PAnalysis(cacheKey: string, analysis: FourPAnalysis): void {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(analysis));
    console.log('💾 4P analysis cached');
  } catch (error) {
    console.error('Error caching 4P analysis:', error);
  }
}
