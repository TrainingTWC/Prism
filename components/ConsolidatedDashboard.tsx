import React, { useMemo, useState, useEffect } from 'react';
import { Users, TrendingUp, Package, MapPin, Brain, Award, AlertCircle, Target, CheckCircle, XCircle, X, Sparkles, RefreshCw } from 'lucide-react';
import { Submission } from '../types';
import { AMOperationsSubmission, TrainingAuditSubmission, QASubmission } from '../services/dataService';
import { generate4PAnalysis, FourPAnalysis } from '../services/fourPAnalysisService';

interface ConsolidatedDashboardProps {
  hrData: Submission[];
  operationsData: AMOperationsSubmission[];
  trainingData: TrainingAuditSubmission[];
  qaData: QASubmission[];
  financeData?: any[]; // Add finance data type when available
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  type: 'hr' | 'operations' | 'training' | 'qa' | 'region';
}

const ConsolidatedDashboard: React.FC<ConsolidatedDashboardProps> = ({
  hrData,
  operationsData,
  trainingData,
  qaData,
  financeData = []
}) => {
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'hr' | 'operations' | 'training' | 'qa' | 'region'>('hr');

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<FourPAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedPCategory, setSelectedPCategory] = useState<'people' | 'process' | 'product' | 'place' | null>(null);

  // Handler to open modal with specific data
  const openDetailModal = (title: string, data: any[], type: 'hr' | 'operations' | 'training' | 'qa' | 'region') => {
    setModalTitle(title);
    setModalData(data);
    setModalType(type);
    setModalOpen(true);
  };

  // Load AI Analysis
  useEffect(() => {
    const loadAIAnalysis = async () => {
      if (hrData.length === 0 && operationsData.length === 0 && trainingData.length === 0 && qaData.length === 0) {
        return; // No data to analyze
      }

      setAiLoading(true);
      setAiError(null);

      try {
        const analysis = await generate4PAnalysis({
          hr: hrData,
          operations: operationsData,
          training: trainingData,
          qa: qaData,
          finance: financeData
        });
        setAiAnalysis(analysis);
      } catch (error) {
        console.error('Failed to generate 4P AI analysis:', error);
        setAiError('Failed to load AI insights. Using cached data if available.');
      } finally {
        setAiLoading(false);
      }
    };

    loadAIAnalysis();
  }, [hrData, operationsData, trainingData, qaData, financeData]);

  // Refresh AI Analysis
  const refreshAIAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      // Clear cache and regenerate
      const cacheKey = `4p_analysis_${Date.now()}`;
      const analysis = await generate4PAnalysis({
        hr: hrData,
        operations: operationsData,
        training: trainingData,
        qa: qaData,
        finance: financeData
      });
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Failed to refresh 4P AI analysis:', error);
      setAiError('Failed to refresh AI insights.');
    } finally {
      setAiLoading(false);
    }
  };
  
  // Calculate 4Ps metrics
  const fourPsMetrics = useMemo(() => {
    // PEOPLE - HR Survey + Training Data
    const peopleScore = {
      hrSatisfaction: hrData.length > 0 ? Math.round(hrData.reduce((sum, s) => sum + s.percent, 0) / hrData.length) : 0,
      totalEmployeesSurveyed: hrData.length,
      trainingCompliance: trainingData.length > 0 ? 
        Math.round((trainingData.filter(t => parseFloat(t.percentageScore || '0') >= 80).length / trainingData.length) * 100) : 0,
      trainingAudits: trainingData.length,
      avgTrainingScore: trainingData.length > 0 ? 
        Math.round(trainingData.reduce((sum, t) => sum + parseFloat(t.percentageScore || '0'), 0) / trainingData.length) : 0
    };

    // PROCESS - Operations + QA Data
    const processScore = {
      operationsCompliance: operationsData.length > 0 ? 
        Math.round(operationsData.reduce((sum, o) => sum + parseFloat(o.percentageScore || '0'), 0) / operationsData.length) : 0,
      operationsChecks: operationsData.length,
      qaCompliance: qaData.length > 0 ? 
        Math.round(qaData.reduce((sum, q) => sum + parseFloat(q.scorePercentage || '0'), 0) / qaData.length) : 0,
      qaAudits: qaData.length,
      criticalNonCompliance: qaData.filter(q => parseFloat(q.scorePercentage || '0') < 60).length
    };

    // PRODUCT - Quality from QA + Training
    const productScore = {
      overallQuality: qaData.length > 0 ? 
        Math.round(qaData.reduce((sum, q) => sum + parseFloat(q.scorePercentage || '0'), 0) / qaData.length) : 0,
      productTraining: trainingData.length > 0 ? 
        Math.round(trainingData.reduce((sum, t) => sum + parseFloat(t.percentageScore || '0'), 0) / trainingData.length) : 0,
      qualityIssues: qaData.filter(q => parseFloat(q.scorePercentage || '0') < 70).length,
      excellentScores: qaData.filter(q => parseFloat(q.scorePercentage || '0') >= 90).length
    };

    // PLACE - Regional Performance across all data
    const placeScore = {
      storesAudited: new Set([
        ...hrData.map(h => h.storeID),
        ...operationsData.map(o => o.storeId),
        ...trainingData.map(t => t.storeId),
        ...qaData.map(q => q.storeId)
      ]).size,
      regionsActive: new Set([
        ...hrData.map(h => h.region).filter(Boolean),
        ...operationsData.map(o => o.region).filter(Boolean),
        ...trainingData.map(t => t.region).filter(Boolean),
        ...qaData.map(q => q.region).filter(Boolean)
      ]).size,
      avgLocationScore: 0 // Calculate weighted average across all
    };

    // Calculate weighted location score
    const allScores = [
      ...hrData.map(h => h.percent),
      ...operationsData.map(o => parseFloat(o.percentageScore || '0')),
      ...trainingData.map(t => parseFloat(t.percentageScore || '0')),
      ...qaData.map(q => parseFloat(q.scorePercentage || '0'))
    ];
    placeScore.avgLocationScore = allScores.length > 0 ? 
      Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length) : 0;

    return { peopleScore, processScore, productScore, placeScore };
  }, [hrData, operationsData, trainingData, qaData]);

  // Regional breakdown
  const regionalBreakdown = useMemo(() => {
    const regions = new Map<string, {
      region: string;
      hrScore: number;
      hrCount: number;
      opsScore: number;
      opsCount: number;
      trainingScore: number;
      trainingCount: number;
      qaScore: number;
      qaCount: number;
    }>();

    // Initialize regions
    const allRegions = new Set([
      ...hrData.map(h => h.region).filter(Boolean),
      ...operationsData.map(o => o.region).filter(Boolean),
      ...trainingData.map(t => t.region).filter(Boolean),
      ...qaData.map(q => q.region).filter(Boolean)
    ]);

    allRegions.forEach(region => {
      regions.set(region as string, {
        region: region as string,
        hrScore: 0,
        hrCount: 0,
        opsScore: 0,
        opsCount: 0,
        trainingScore: 0,
        trainingCount: 0,
        qaScore: 0,
        qaCount: 0
      });
    });

    // Aggregate data by region
    hrData.forEach(h => {
      if (h.region) {
        const r = regions.get(h.region);
        if (r) {
          r.hrScore += h.percent;
          r.hrCount++;
        }
      }
    });

    operationsData.forEach(o => {
      if (o.region) {
        const r = regions.get(o.region);
        if (r) {
          r.opsScore += parseFloat(o.percentageScore || '0');
          r.opsCount++;
        }
      }
    });

    trainingData.forEach(t => {
      if (t.region) {
        const r = regions.get(t.region);
        if (r) {
          r.trainingScore += parseFloat(t.percentageScore || '0');
          r.trainingCount++;
        }
      }
    });

    qaData.forEach(q => {
      if (q.region) {
        const r = regions.get(q.region);
        if (r) {
          r.qaScore += parseFloat(q.scorePercentage || '0');
          r.qaCount++;
        }
      }
    });

    // Calculate averages
    const regionStats = Array.from(regions.values()).map(r => ({
      region: r.region,
      hrAvg: r.hrCount > 0 ? Math.round(r.hrScore / r.hrCount) : 0,
      opsAvg: r.opsCount > 0 ? Math.round(r.opsScore / r.opsCount) : 0,
      trainingAvg: r.trainingCount > 0 ? Math.round(r.trainingScore / r.trainingCount) : 0,
      qaAvg: r.qaCount > 0 ? Math.round(r.qaScore / r.qaCount) : 0,
      overallAvg: 0,
      dataPoints: r.hrCount + r.opsCount + r.trainingCount + r.qaCount
    }));

    // Calculate overall average
    regionStats.forEach(r => {
      const scores = [r.hrAvg, r.opsAvg, r.trainingAvg, r.qaAvg].filter(s => s > 0);
      r.overallAvg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    });

    return regionStats.sort((a, b) => b.overallAvg - a.overallAvg);
  }, [hrData, operationsData, trainingData, qaData]);

  // Top performers and areas of concern
  const insights = useMemo(() => {
    const topPerformers: string[] = [];
    const concerns: string[] = [];

    // Check People metrics
    if (fourPsMetrics.peopleScore.hrSatisfaction >= 80 && fourPsMetrics.peopleScore.trainingCompliance >= 80) {
      topPerformers.push('People: High employee satisfaction and training compliance');
    } else if (fourPsMetrics.peopleScore.hrSatisfaction < 60 || fourPsMetrics.peopleScore.trainingCompliance < 60) {
      concerns.push('People: Employee satisfaction or training compliance needs attention');
    }

    // Check Process metrics
    if (fourPsMetrics.processScore.operationsCompliance >= 80 && fourPsMetrics.processScore.qaCompliance >= 80) {
      topPerformers.push('Process: Operations and QA compliance are excellent');
    } else if (fourPsMetrics.processScore.criticalNonCompliance > 5) {
      concerns.push(`Process: ${fourPsMetrics.processScore.criticalNonCompliance} critical non-compliance issues detected`);
    }

    // Check Product metrics
    if (fourPsMetrics.productScore.overallQuality >= 85) {
      topPerformers.push('Product: Outstanding quality scores across audits');
    } else if (fourPsMetrics.productScore.qualityIssues > 10) {
      concerns.push(`Product: ${fourPsMetrics.productScore.qualityIssues} stores with quality concerns`);
    }

    // Check Place metrics
    const bestRegion = regionalBreakdown[0];
    const worstRegion = regionalBreakdown[regionalBreakdown.length - 1];
    
    if (bestRegion && bestRegion.overallAvg >= 85) {
      topPerformers.push(`Place: ${bestRegion.region} region performing excellently (${bestRegion.overallAvg}%)`);
    }
    
    if (worstRegion && worstRegion.overallAvg < 65) {
      concerns.push(`Place: ${worstRegion.region} region needs improvement (${worstRegion.overallAvg}%)`);
    }

    return { topPerformers, concerns };
  }, [fourPsMetrics, regionalBreakdown]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="w-7 h-7" />
          <h2 className="text-xl font-bold">Consolidated Business Intelligence</h2>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-indigo-200">Total Records</div>
            <div className="text-2xl font-bold">
              {hrData.length + operationsData.length + trainingData.length + qaData.length}
            </div>
          </div>
          <div>
            <div className="text-indigo-200">Stores</div>
            <div className="text-2xl font-bold">{fourPsMetrics.placeScore.storesAudited}</div>
          </div>
          <div>
            <div className="text-indigo-200">Regions</div>
            <div className="text-2xl font-bold">{fourPsMetrics.placeScore.regionsActive}</div>
          </div>
          <div>
            <div className="text-indigo-200">Avg Score</div>
            <div className="text-2xl font-bold">{fourPsMetrics.placeScore.avgLocationScore}%</div>
          </div>
        </div>
      </div>

      {/* 4Ps Cards - Minimal & Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* PEOPLE */}
        <button
          onClick={() => openDetailModal('People Metrics', hrData, 'hr')}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 text-left hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">PEOPLE</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600 dark:text-slate-400">HR Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(fourPsMetrics.peopleScore.hrSatisfaction)}`}>
                {fourPsMetrics.peopleScore.hrSatisfaction}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-500">
              <span>Training</span>
              <span className={getScoreColor(fourPsMetrics.peopleScore.avgTrainingScore)}>
                {fourPsMetrics.peopleScore.avgTrainingScore}%
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-500">
              {fourPsMetrics.peopleScore.totalEmployeesSurveyed} employees • {fourPsMetrics.peopleScore.trainingAudits} audits
            </div>
          </div>
        </button>

        {/* PROCESS */}
        <button
          onClick={() => openDetailModal('Process Metrics', operationsData, 'operations')}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 text-left hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">PROCESS</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600 dark:text-slate-400">Ops Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(fourPsMetrics.processScore.operationsCompliance)}`}>
                {fourPsMetrics.processScore.operationsCompliance}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-500">
              <span>QA Compliance</span>
              <span className={getScoreColor(fourPsMetrics.processScore.qaCompliance)}>
                {fourPsMetrics.processScore.qaCompliance}%
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-500">
              {fourPsMetrics.processScore.criticalNonCompliance} critical issues
            </div>
          </div>
        </button>

        {/* PRODUCT */}
        <button
          onClick={() => openDetailModal('Product Quality', qaData, 'qa')}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 text-left hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">PRODUCT</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600 dark:text-slate-400">Quality</span>
              <span className={`text-2xl font-bold ${getScoreColor(fourPsMetrics.productScore.overallQuality)}`}>
                {fourPsMetrics.productScore.overallQuality}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600 dark:text-green-400">✓ {fourPsMetrics.productScore.excellentScores}</span>
              <span className="text-red-600 dark:text-red-400">⚠ {fourPsMetrics.productScore.qualityIssues}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-500">
              {qaData.length} assessments
            </div>
          </div>
        </button>

        {/* PLACE */}
        <button
          onClick={() => {
            const regionData = regionalBreakdown.map(r => ({
              region: r.region,
              overallScore: r.overallAvg,
              dataPoints: r.dataPoints,
              details: { hr: r.hrAvg, ops: r.opsAvg, training: r.trainingAvg, qa: r.qaAvg }
            }));
            openDetailModal('Regional Performance', regionData, 'region');
          }}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 text-left hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">PLACE</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600 dark:text-slate-400">Location</span>
              <span className={`text-2xl font-bold ${getScoreColor(fourPsMetrics.placeScore.avgLocationScore)}`}>
                {fourPsMetrics.placeScore.avgLocationScore}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-500">
              <span>{fourPsMetrics.placeScore.storesAudited} stores</span>
              <span>{fourPsMetrics.placeScore.regionsActive} regions</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-500">
              Click for regional breakdown
            </div>
          </div>
        </button>
      </div>

      {/* AI-Powered 4P Insights Section */}
      {aiAnalysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI-Powered 4P Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Insights generated from all checklist submissions
                </p>
              </div>
            </div>
            <button
              onClick={refreshAIAnalysis}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-lg border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>

          {/* Overall Score */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-slate-400">Overall 4P Score</span>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${
                  aiAnalysis.overallPercentage >= 80 ? 'text-green-600' :
                  aiAnalysis.overallPercentage >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {aiAnalysis.overallPercentage}%
                </span>
                <span className="text-sm text-gray-500">Weighted Average</span>
              </div>
            </div>
          </div>

          {/* 4P Category Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {['people', 'process', 'product', 'place'].map((category) => {
              const cat = category as 'people' | 'process' | 'product' | 'place';
              const categoryData = aiAnalysis[cat];
              const isSelected = selectedPCategory === cat;
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedPCategory(isSelected ? null : cat)}
                  className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 shadow-md scale-105'
                      : 'bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="text-sm text-gray-600 dark:text-slate-400 uppercase">{category}</div>
                  <div className={`text-2xl font-bold ${
                    categoryData.percentage >= 80 ? 'text-green-600' :
                    categoryData.percentage >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {categoryData.percentage}%
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Category Details */}
          {selectedPCategory && aiAnalysis[selectedPCategory] && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 pb-3">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {selectedPCategory} Analysis
                </h4>
                <button
                  onClick={() => setSelectedPCategory(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {aiAnalysis[selectedPCategory].insights.map((insight, idx) => (
                <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {insight.summary}
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                    {insight.explanation}
                  </p>
                  {insight.source && (
                    <span className="text-xs text-gray-500 dark:text-slate-500">
                      Source: {insight.source}
                    </span>
                  )}
                </div>
              ))}

              {aiAnalysis[selectedPCategory].insights.length === 0 && (
                <p className="text-gray-500 dark:text-slate-400 text-center py-4">
                  No specific insights available for this category yet.
                </p>
              )}
            </div>
          )}

          {/* Quick Summary when no category selected */}
          {!selectedPCategory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Top Insights
                </h4>
                <div className="space-y-2">
                  {['people', 'process', 'product', 'place'].map((cat) => {
                    const category = cat as 'people' | 'process' | 'product' | 'place';
                    const topInsight = aiAnalysis[category].insights[0];
                    return topInsight ? (
                      <div key={cat} className="text-sm">
                        <span className="font-medium capitalize text-gray-900 dark:text-white">{cat}:</span>
                        <span className="text-gray-700 dark:text-slate-300 ml-2">
                          {topInsight.summary}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Areas to Focus
                </h4>
                <div className="space-y-2">
                  {['people', 'process', 'product', 'place']
                    .map((cat) => ({
                      category: cat,
                      score: aiAnalysis[cat as 'people' | 'process' | 'product' | 'place'].percentage
                    }))
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item.category} className="text-sm flex items-center justify-between">
                        <span className="capitalize font-medium text-gray-900 dark:text-white">
                          {item.category}
                        </span>
                        <span className={`font-bold ${
                          item.score >= 80 ? 'text-green-600' :
                          item.score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {item.score}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {aiError && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{aiError}</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State for AI */}
      {aiLoading && !aiAnalysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Generating AI Insights...</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">Analyzing remarks from all checklists</p>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/50 dark:bg-slate-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Quick Insights - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Top Performers</h3>
          </div>
          {insights.topPerformers.length > 0 ? (
            <div className="space-y-2">
              {insights.topPerformers.slice(0, 2).map((insight, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-sm">No standout performers yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Focus Areas</h3>
          </div>
          {insights.concerns.length > 0 ? (
            <div className="space-y-2">
              {insights.concerns.slice(0, 2).map((concern, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p>{concern}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-sm">No critical concerns</p>
          )}
        </div>
      </div>

      {/* Regional Table - Compact */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Regional Overview</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-slate-300">Region</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-slate-300">HR</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-slate-300">Ops</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-slate-300">Training</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-slate-300">QA</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-slate-300">Overall</th>
              </tr>
            </thead>
            <tbody>
              {regionalBreakdown.map((region, index) => (
                <tr 
                  key={region.region}
                  onClick={() => {
                    const regionData = [{
                      region: region.region,
                      overallScore: region.overallAvg,
                      dataPoints: region.dataPoints,
                      details: { hr: region.hrAvg, ops: region.opsAvg, training: region.trainingAvg, qa: region.qaAvg }
                    }];
                    openDetailModal(`${region.region} Region Details`, regionData, 'region');
                  }}
                  className={`border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer ${
                    index === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                    {index === 0 && <Award className="w-3 h-3 text-green-600 dark:text-green-400 inline mr-1" />}
                    {region.region}
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className={region.hrAvg === 0 ? 'text-gray-400' : getScoreColor(region.hrAvg)}>
                      {region.hrAvg > 0 ? `${region.hrAvg}%` : '-'}
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className={region.opsAvg === 0 ? 'text-gray-400' : getScoreColor(region.opsAvg)}>
                      {region.opsAvg > 0 ? `${region.opsAvg}%` : '-'}
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className={region.trainingAvg === 0 ? 'text-gray-400' : getScoreColor(region.trainingAvg)}>
                      {region.trainingAvg > 0 ? `${region.trainingAvg}%` : '-'}
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className={region.qaAvg === 0 ? 'text-gray-400' : getScoreColor(region.qaAvg)}>
                      {region.qaAvg > 0 ? `${region.qaAvg}%` : '-'}
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                      region.overallAvg >= 80 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : region.overallAvg >= 60
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {region.overallAvg}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {regionalBreakdown.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-slate-400 text-sm">
            No regional data available yet
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        data={modalData}
        type={modalType}
      />
    </div>
  );
};

// Detail Modal Component
const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, data, type }) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {type === 'hr' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Showing {data.length} HR survey submissions
              </div>
              {data.slice(0, 50).map((item: Submission, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Employee</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.empName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Store</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.storeName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">HRBP</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.hrName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Score</div>
                      <div className={`font-bold ${getScoreColor(item.percent)}`}>{item.percent}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'operations' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Showing {data.length} operations checklists
              </div>
              {data.slice(0, 50).map((item: AMOperationsSubmission, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Store</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.storeName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">AM</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.amName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Trainer</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.trainerName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Score</div>
                      <div className={`font-bold ${getScoreColor(parseFloat(item.percentageScore || '0'))}`}>
                        {item.percentageScore}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'training' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Showing {data.length} training audits
              </div>
              {data.slice(0, 50).map((item: TrainingAuditSubmission, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Store</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.storeName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Trainer</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.trainerName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Region</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.region}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Score</div>
                      <div className={`font-bold ${getScoreColor(parseFloat(item.percentageScore || '0'))}`}>
                        {item.percentageScore}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'qa' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Showing {data.length} QA assessments
              </div>
              {data.slice(0, 50).map((item: QASubmission, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Store</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.storeName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Auditor</div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.qaName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Date</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.submissionTime ? new Date(item.submissionTime).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Score</div>
                      <div className={`font-bold ${getScoreColor(parseFloat(item.scorePercentage || '0'))}`}>
                        {item.scorePercentage}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'region' && (
            <div className="space-y-4">
              {data.map((item: any, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{item.region}</h4>
                    <span className={`text-2xl font-bold ${getScoreColor(item.overallScore)}`}>
                      {item.overallScore}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">HR</div>
                      <div className={`font-bold ${item.details.hr === 0 ? 'text-gray-400' : getScoreColor(item.details.hr)}`}>
                        {item.details.hr > 0 ? `${item.details.hr}%` : 'No data'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Operations</div>
                      <div className={`font-bold ${item.details.ops === 0 ? 'text-gray-400' : getScoreColor(item.details.ops)}`}>
                        {item.details.ops > 0 ? `${item.details.ops}%` : 'No data'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">Training</div>
                      <div className={`font-bold ${item.details.training === 0 ? 'text-gray-400' : getScoreColor(item.details.training)}`}>
                        {item.details.training > 0 ? `${item.details.training}%` : 'No data'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-slate-400">QA</div>
                      <div className={`font-bold ${item.details.qa === 0 ? 'text-gray-400' : getScoreColor(item.details.qa)}`}>
                        {item.details.qa > 0 ? `${item.details.qa}%` : 'No data'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-slate-500">
                    {item.dataPoints} total data points
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedDashboard;
