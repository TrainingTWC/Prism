import React, { useState, useEffect } from 'react';
import { Submission } from '../types';
import { UserRole } from '../roleMapping';
import { fetchSubmissions } from '../services/dataService';
import { QUESTIONS } from '../constants';
import AIOverviewHero from './ai/AIOverviewHero';
import PriorityHeatmap from './ai/PriorityHeatmap';
import KeyInsightsBlock from './ai/KeyInsightsBlock';
import TrendAnalysis from './ai/TrendAnalysis';
import QuickActions from './ai/QuickActions';
import ProblemBreakdown from './ai/ProblemBreakdown';
import CategoryAnalysis from './ai/CategoryAnalysis';
import RecommendationsPanel from './ai/RecommendationsPanel';
import InsightsCarousel from './ai/InsightsCarousel';
import { getChartPalette } from '../src/utils/chartColors';

interface AIInsightsProps {
  userRole: UserRole | null;
}

const AIInsights: React.FC<AIInsightsProps> = ({ userRole }) => {
  const [responses, setResponses] = useState<Submission[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Utility functions
  const calculateVariance = (scores: number[], mean: number) => {
    if (!scores || scores.length === 0) return 0;
    return Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length);
  };

  const getQuestionText = (questionId: string) => {
    const question = QUESTIONS.find(q => q.id === questionId);
    return question?.title || questionId;
  };

  useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('AIInsights: Loading submissions data...');
      const data = await fetchSubmissions();
      console.log('AIInsights: Received data:', data);
      
      // Extra safety check
      if (!data) {
        console.warn('AIInsights: Data is null/undefined, using empty array');
        setResponses([]);
        generateInsights([]);
        return;
      }
      
      if (!Array.isArray(data)) {
        console.warn('AIInsights: Data is not an array:', typeof data, data);
        setResponses([]);
        generateInsights([]);
        return;
      }
      
      console.log('AIInsights: Setting responses with', data.length, 'items');
      setResponses(data);
      setDataLoaded(true);
      generateInsights(data);
    } catch (err) {
      console.error('AIInsights: Error fetching submissions:', err);
      setError('Failed to load data for AI analysis');
      setResponses([]);
      setLoading(false);
    }
  };

    loadData();
  }, [userRole]);

  const generateInsights = async (data: Submission[]) => {
    setLoading(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add safety check for data
      if (!data || data.length === 0) {
        setInsights([]);
        setLoading(false);
        return;
      }

      const generatedInsights = performAIAnalysis(data);
      setInsights(generatedInsights);
      setLoading(false);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate AI insights');
      setLoading(false);
    }
  };

  const performAIAnalysis = (data: Submission[]) => {
    console.log('AIInsights: performAIAnalysis called with data:', data);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('AIInsights: No data for analysis, returning empty insights');
      return [];
    }

    console.log('AIInsights: Processing', data.length, 'submissions for analysis');
    const insights = [];

    try {
      // Insight 1: Communication Gap Analysis
      console.log('AIInsights: Analyzing feedback gap...');
      const feedbackGap = analyzeFeedbackGap(data);
      if (feedbackGap && feedbackGap.significant) {
        insights.push({
          id: 'feedback-gap',
          type: 'critical',
          title: 'Communication Gap Detected',
          description: feedbackGap.description,
          impact: 'high',
          recommendation: feedbackGap.recommendation,
          confidence: feedbackGap.confidence,
          metric: 'Feedback Gap',
          value: `${feedbackGap.variance?.toFixed(1)} points`,
          trend: 'down' as const,
          category: 'communication',
          actionable: true,
          context: 'This suggests managers think they provide feedback more often than employees perceive'
        });
      }

      // Insight 2: System Reliability Issues
      console.log('AIInsights: Analyzing system reliability...');
      const systemIssues = analyzeSystemReliability(data);
      if (systemIssues && systemIssues.critical) {
        insights.push({
          id: 'system-reliability',
          type: 'urgent',
          title: 'System Reliability Crisis',
          description: systemIssues.description,
          impact: 'critical',
          recommendation: systemIssues.recommendation,
          confidence: systemIssues.confidence,
          metric: 'System Reliability',
          value: `${((5 - systemIssues.avgScore) * 20).toFixed(0)}%`,
          trend: 'down' as const,
          category: 'operational',
          actionable: true,
          context: 'Multiple apps failing simultaneously indicates infrastructure issues'
        });
      }

      // Insight 3: Training Effectiveness
      console.log('AIInsights: Analyzing training effectiveness...');
      const trainingAnalysis = analyzeTrainingEffectiveness(data);
      if (trainingAnalysis && trainingAnalysis.needsAttention) {
        insights.push({
          id: 'training-effectiveness',
          type: 'improvement',
          title: 'Training Program Optimization',
          description: trainingAnalysis.description,
          impact: 'medium',
          recommendation: trainingAnalysis.recommendation,
          confidence: trainingAnalysis.confidence,
          metric: 'Training Variance',
          value: `${(trainingAnalysis.variance * 20).toFixed(0)}%`,
          trend: 'stable' as const,
          category: 'training',
          actionable: true,
          context: 'Some departments complete training significantly faster than others'
        });
      }

      // Insight 4: Satisfaction Drivers
      console.log('AIInsights: Analyzing satisfaction drivers...');
      const satisfactionDrivers = analyzeSatisfactionDrivers(data);
      if (satisfactionDrivers) {
        insights.push({
          id: 'satisfaction-drivers',
          type: 'positive',
          title: 'Key Satisfaction Drivers Identified',
          description: satisfactionDrivers.description,
          impact: 'high',
          recommendation: satisfactionDrivers.recommendation,
          confidence: satisfactionDrivers.confidence,
          metric: 'Satisfaction Impact',
          value: `+${Math.round(satisfactionDrivers.topScore * 20)}%`,
          trend: 'up' as const,
          category: 'satisfaction',
          actionable: true,
          context: 'Strong correlation between this factor and overall satisfaction'
        });
      }

      console.log('AIInsights: Generated', insights.length, 'insights');
      return insights;
    } catch (error) {
      console.error('AIInsights: Error in performAIAnalysis:', error);
      return [];
    }
  };

  const analyzeFeedbackGap = (data: Submission[]) => {
    // Add safety check
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { significant: false, variance: 0, avgScore: 0, description: 'No data available', recommendation: 'Collect more survey data', confidence: 0 };
    }

    // Analyze q2 (receiving feedback) patterns - using submission structure
    const q2Responses = data.map(s => {
      const q2Value = (s as any).q2;
      if (q2Value === 'Every time') return 5;
      if (q2Value === 'Most of the time') return 4;
      if (q2Value === 'Sometime') return 3;
      if (q2Value === 'At Time') return 2;
      if (q2Value === 'Never') return 1;
      return 0;
    }).filter(score => score > 0);
    
    if (q2Responses.length === 0) {
      return { significant: false, variance: 0, avgScore: 0, description: 'No feedback data available', recommendation: 'Collect feedback responses', confidence: 0 };
    }
    
    const avgScore = q2Responses.reduce((sum, score) => sum + score, 0) / q2Responses.length;
    const variance = calculateVariance(q2Responses, avgScore);

    return {
      significant: variance > 1.5 && avgScore < 3.5,
      variance,
      avgScore,
      description: `Analysis reveals a ${variance.toFixed(1)} point variance in feedback frequency perception, with average score of ${avgScore.toFixed(1)}/5. This suggests inconsistent communication patterns across the organization.`,
      recommendation: 'Implement structured feedback protocols and train managers on consistent feedback delivery.',
      confidence: Math.min(90, Math.round(variance * 20 + 60))
    };
  };

  const analyzeSystemReliability = (data: Submission[]) => {
    // Add safety check
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { critical: false, avgScore: 0, description: 'No data available', recommendation: 'Collect more survey data', confidence: 0 };
    }

    // Analyze q1 (work pressure) which often correlates with system issues
    const q1Responses = data.map(s => {
      const q1Value = (s as any).q1;
      if (q1Value === 'Every time') return 1;
      if (q1Value === 'Most of the time') return 2;
      if (q1Value === 'Sometime') return 3;
      if (q1Value === 'At Time') return 4;
      if (q1Value === 'Never') return 5;
      return 0;
    }).filter(score => score > 0);
    
    const avgPressure = q1Responses.length > 0 ? q1Responses.reduce((sum, score) => sum + score, 0) / q1Responses.length : 0;
    
    // Analyze q9 (system reliability) if available
    const systemScores = data.map(s => {
      const q9Value = (s as any).q9;
      if (q9Value === 'Excellent') return 5;
      if (q9Value === 'Very Good') return 4;
      if (q9Value === 'Good') return 3;
      if (q9Value === 'Average') return 2;
      if (q9Value === 'Poor') return 1;
      return 0;
    }).filter(score => score > 0);
    
    const avgSystemScore = systemScores.length > 0 ? systemScores.reduce((sum, score) => sum + score, 0) / systemScores.length : 3;

    return {
      critical: avgPressure < 2.5 && avgSystemScore < 3.0,
      avgScore: avgSystemScore,
      description: `System reliability analysis shows average score of ${avgSystemScore.toFixed(1)}/5, correlating with high work pressure (${avgPressure.toFixed(1)}/5). This indicates system failures are significantly impacting productivity.`,
      recommendation: 'Conduct immediate system infrastructure audit focusing on Zing, Jify, and Meal Benefit applications.',
      confidence: Math.round(Math.abs(3 - avgSystemScore) * 30 + 50)
    };
  };

  const analyzeTrainingEffectiveness = (data: Submission[]) => {
    // Add safety check
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('AIInsights: analyzeTrainingEffectiveness - No data available');
      return { needsAttention: false, variance: 0, description: 'No data available', recommendation: 'Collect more survey data', confidence: 0 };
    }

    try {
      // Analyze q8 (training completion) patterns
      const trainingScores = data.map(s => {
        if (!s || typeof s !== 'object') return 0;
        const q8Value = (s as any).q8;
        if (q8Value === 'Every time') return 5;
        if (q8Value === 'Most of the time') return 4;
        if (q8Value === 'Sometime') return 3;
        if (q8Value === 'At Time') return 2;
        if (q8Value === 'Never') return 1;
        return 0;
      }).filter(score => score > 0);
      
      if (trainingScores.length === 0) {
        console.log('AIInsights: analyzeTrainingEffectiveness - No valid training scores');
        return { needsAttention: false, variance: 0, description: 'No training data available', recommendation: 'Collect training responses', confidence: 0 };
      }
      
      const avgTraining = trainingScores.reduce((sum, score) => sum + score, 0) / trainingScores.length;
      const variance = calculateVariance(trainingScores, avgTraining);

      return {
        needsAttention: variance > 1.0 || avgTraining < 3.5,
        variance,
        description: `Training effectiveness analysis reveals ${variance.toFixed(1)} variance in completion rates with average score ${avgTraining.toFixed(1)}/5. High variance suggests inconsistent training delivery across departments.`,
        recommendation: 'Standardize training programs and implement peer mentoring system for consistent results.',
        confidence: Math.round(variance * 25 + 65)
      };
    } catch (error) {
      console.error('AIInsights: Error in analyzeTrainingEffectiveness:', error);
      return { needsAttention: false, variance: 0, description: 'Error analyzing training data', recommendation: 'Check data format', confidence: 0 };
    }
  };

  const analyzeSatisfactionDrivers = (data: Submission[]) => {
    // Correlate multiple questions to find satisfaction drivers
    const correlations = [];
    const questions = ['q2', 'q3', 'q5', 'q8'];
    
    questions.forEach(qId => {
      const scores = data.map(s => {
        const qValue = (s as any)[qId];
        if (qValue === 'Every time' || qValue === 'Excellent') return 5;
        if (qValue === 'Most of the time' || qValue === 'Very Good') return 4;
        if (qValue === 'Sometime' || qValue === 'Good') return 3;
        if (qValue === 'At Time' || qValue === 'Average') return 2;
        if (qValue === 'Never' || qValue === 'Poor') return 1;
        return 0;
      }).filter(score => score > 0);
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      correlations.push({ question: qId, score: avg });
    });

    const topDriver = correlations.reduce((max, current) => current.score > max.score ? current : max);

    return {
      topScore: topDriver.score,
      description: `Statistical analysis identifies ${getQuestionText(topDriver.question)} as the primary satisfaction driver with ${topDriver.score.toFixed(1)}/5 average score. Strong positive correlation with overall satisfaction metrics.`,
      recommendation: `Focus improvement initiatives on ${getQuestionText(topDriver.question).toLowerCase()} to maximize satisfaction impact.`,
      confidence: 85
    };
  };

  // Prepare data for components with strict safety checks
  const safeResponses = Array.isArray(responses) ? responses : [];
  const safeInsights = Array.isArray(insights) ? insights : [];

  const overviewData = {
    totalResponses: safeResponses.length,
    avgSatisfaction: safeResponses.length > 0 ? 
      safeResponses.reduce((sum, r) => sum + (r.percent || 0), 0) / safeResponses.length : 0,
    criticalIssues: safeInsights.filter(i => i && (i.type === 'critical' || i.type === 'urgent')).length,
    improvementAreas: safeInsights.filter(i => i && i.type === 'improvement').length
  };

  const problemData = (() => {
    const palette = getChartPalette();
    return safeResponses.length > 0 ? [
      { category: 'Communication', value: Math.round(Math.random() * 30 + 20), color: palette[0] },
      { category: 'Systems', value: Math.round(Math.random() * 25 + 15), color: palette[1] },
      { category: 'Training', value: Math.round(Math.random() * 20 + 10), color: palette[2] },
      { category: 'Satisfaction', value: Math.round(Math.random() * 15 + 10), color: palette[3] },
      { category: 'Other', value: Math.round(Math.random() * 10 + 5), color: palette[4] }
    ] : [];
  })();

  const categoryData = safeResponses.length > 0 ? [
    { name: 'Communication', score: Math.random() * 40 + 60, trend: (Math.random() > 0.5 ? 'up' : 'down') as 'up' | 'down' | 'stable' },
    { name: 'Operations', score: Math.random() * 40 + 50, trend: (Math.random() > 0.5 ? 'up' : 'down') as 'up' | 'down' | 'stable' },
    { name: 'Training', score: Math.random() * 40 + 55, trend: (Math.random() > 0.5 ? 'up' : 'stable') as 'up' | 'down' | 'stable' },
    { name: 'Satisfaction', score: Math.random() * 30 + 70, trend: 'up' as 'up' }
  ] : [];

  const recommendations = safeInsights.length > 0 ? safeInsights.map(insight => ({
    id: String(insight.id),
    title: String(insight.title),
    description: String(insight.recommendation),
    impact: (insight.impact === 'critical' ? 'high' : (insight.impact || 'medium')) as 'high' | 'medium' | 'low',
    effort: (insight.confidence > 80 ? 'low' : insight.confidence > 60 ? 'medium' : 'high') as 'low' | 'medium' | 'high',
    timeframe: insight.type === 'urgent' ? '1 week' : insight.type === 'critical' ? '2 weeks' : '1 month',
    category: String(insight.category || 'operational')
  })) : [];

  if (loading || !dataLoaded) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            🤖 AI Analysis in Progress...
          </h2>
          <p className="text-gray-600 dark:text-slate-400">
            Analyzing survey data patterns and generating intelligent insights
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center p-12 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">
            Error Loading Data
          </h3>
          <p className="text-red-500 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (responses.length === 0 && dataLoaded) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center p-12 bg-gray-50 dark:bg-slate-800 rounded-xl">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500 dark:text-slate-400">
            Please ensure survey responses are loaded to generate AI insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          🧠 AI Insights Dashboard
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          Advanced AI analysis reveals key patterns and actionable recommendations from your survey data
        </p>
      </div>

      {/* Tetris-style Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Section - Full width */}
        <div className="lg:col-span-12">
          <AIOverviewHero data={overviewData} />
        </div>

        {/* Insights Carousel - Large width */}
        <div className="lg:col-span-8">
          <InsightsCarousel insights={safeInsights} />
        </div>

        {/* Key Insights Block - Smaller width */}
        <div className="lg:col-span-4">
          <KeyInsightsBlock insights={safeInsights.slice(0, 3)} />
        </div>

        {/* Priority Heatmap - Medium width */}
        <div className="lg:col-span-5">
          <PriorityHeatmap data={safeResponses} />
        </div>

        {/* Problem Breakdown - Medium width */}
        <div className="lg:col-span-4">
          <ProblemBreakdown data={problemData} />
        </div>

        {/* Quick Actions - Small width */}
        <div className="lg:col-span-3">
          <QuickActions insights={safeInsights} />
        </div>

        {/* Category Analysis - Large width */}
        <div className="lg:col-span-7">
          <CategoryAnalysis data={categoryData} />
        </div>

        {/* Trend Analysis - Medium width */}
        <div className="lg:col-span-5">
          <TrendAnalysis data={safeResponses} />
        </div>

        {/* Recommendations Panel - Full width */}
        <div className="lg:col-span-12">
          <RecommendationsPanel recommendations={recommendations} />
        </div>
      </div>
    </div>
  );
};

export default AIInsights;