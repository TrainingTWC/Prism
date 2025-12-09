/**
 * Comment Analysis Service
 * Uses AI to analyze employee comments/remarks for specific questions
 * STRICT RULE: Only analyze what's in the actual text - no inference about coffee quality, equipment, etc.
 */

import { ResponseDistribution } from './questionAnalysisService';

/**
 * Analyze comments for a specific question using AI
 * Returns concise summary of what employees actually wrote
 */
export const analyzeQuestionComments = async (
  distribution: ResponseDistribution
): Promise<string> => {
  
  // If no remarks, return simple summary based on scores
  if (distribution.remarks.length === 0) {
    return generateScoreOnlySummary(distribution);
  }
  
  // Use AI to analyze the actual remarks
  return await generateAICommentAnalysis(distribution);
};

/**
 * Generate summary when there are no text comments
 * Just report the score distribution
 */
const generateScoreOnlySummary = (distribution: ResponseDistribution): string => {
  const { questionTitle, goodCount, badCount, totalResponses, isReverseScored } = distribution;
  
  const goodPercent = Math.round((goodCount / totalResponses) * 100);
  const badPercent = Math.round((badCount / totalResponses) * 100);
  
  if (isReverseScored) {
    // For reverse scored: low scores are good
    if (badPercent > 60) {
      return `${badPercent}% of employees rated this positively (indicating minimal issues)`;
    } else if (goodPercent > 60) {
      return `${goodPercent}% of employees indicated frequent challenges in this area`;
    } else {
      return `Mixed responses - ${badPercent}% positive, ${goodPercent}% indicating challenges`;
    }
  } else {
    // Normal scoring: high scores are good
    if (goodPercent > 60) {
      return `${goodPercent}% of employees rated this positively`;
    } else if (badPercent > 60) {
      return `${badPercent}% of employees indicated concerns in this area`;
    } else {
      return `Mixed responses - ${goodPercent}% positive, ${badPercent}% concerns`;
    }
  }
};

/**
 * Use GitHub Models API to analyze employee comments
 * CRITICAL: Only report what's actually in the text
 */
const generateAICommentAnalysis = async (
  distribution: ResponseDistribution
): Promise<string> => {
  
  const { questionTitle, remarks, goodCount, badCount, totalResponses, isReverseScored } = distribution;
  
  // Prepare context
  const goodPercent = Math.round((goodCount / totalResponses) * 100);
  const badPercent = Math.round((badCount / totalResponses) * 100);
  
  const systemPrompt = `You are analyzing employee feedback for a specific HR survey question.

CRITICAL RULES:
1. ONLY report what's EXPLICITLY written in the employee remarks
2. DO NOT infer coffee quality, equipment issues, or operational problems unless employees specifically mentioned them
3. DO NOT mention "coffee", "espresso machines", "grinders", "beverages" unless employees wrote about them
4. Focus on the actual survey question topic
5. Be concise - 1-2 sentences maximum
6. Use employee's own words and topics

If employees didn't mention something, don't invent it.`;

  const userPrompt = `Question: "${questionTitle}"
${isReverseScored ? '(Note: This question is reverse-scored - low ratings mean positive, high ratings mean negative)' : ''}

Score Distribution: ${goodPercent}% positive, ${badPercent}% negative

Employee Remarks (${remarks.length} comments):
${remarks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Provide a 1-2 sentence summary of what employees ACTUALLY wrote about this question. Only mention topics that employees specifically discussed.`;

  try {
    const endpoint = 'https://models.inference.ai.azure.com/chat/completions';
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    
    if (!token) {
      console.warn('No GitHub token available for AI analysis');
      return generateScoreOnlySummary(distribution);
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });
    
    if (!response.ok) {
      console.error('AI API error:', response.status);
      return generateScoreOnlySummary(distribution);
    }
    
    const data = await response.json();
    const aiSummary = data.choices[0]?.message?.content?.trim();
    
    if (aiSummary) {
      return aiSummary;
    } else {
      return generateScoreOnlySummary(distribution);
    }
    
  } catch (error) {
    console.error('Error calling AI API:', error);
    return generateScoreOnlySummary(distribution);
  }
};

/**
 * Batch analyze multiple questions
 */
export const analyzeMultipleQuestions = async (
  distributions: ResponseDistribution[]
): Promise<Map<string, string>> => {
  
  const analyses = new Map<string, string>();
  
  // Analyze each question
  for (const dist of distributions) {
    const analysis = await analyzeQuestionComments(dist);
    analyses.set(dist.questionId, analysis);
  }
  
  return analyses;
};
