import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Users, Settings, Package, MapPin, Loader, RefreshCw, Download } from 'lucide-react';
import { generate4PAnalysis, FourPAnalysis, get4PCacheKey, getCached4PAnalysis, cache4PAnalysis } from '../services/fourPAnalysisService';
import { UserRole } from '../roleMapping';

interface Consolidated4PDashboardProps {
  userRole: UserRole;
}

const Consolidated4PDashboard: React.FC<Consolidated4PDashboardProps> = ({ userRole }) => {
  const [analysis, setAnalysis] = useState<FourPAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedP, setSelectedP] = useState<'people' | 'process' | 'product' | 'place' | null>(null);
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedAM, setSelectedAM] = useState('');

  useEffect(() => {
    loadAnalysis();
  }, [dateRange, selectedRegion, selectedStore, selectedAM]);

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        region: selectedRegion || undefined,
        store: selectedStore || undefined,
        am: selectedAM || undefined
      };

      const cacheKey = get4PCacheKey(filters);
      
      // Check cache first
      const cached = await getCached4PAnalysis(cacheKey);
      if (cached) {
        setAnalysis(cached);
        setLoading(false);
        return;
      }

      // Fetch data from all checklists
      // TODO: Replace with actual API calls
      const data = await fetchAllChecklistData(filters);
      
      // Generate 4P analysis with AI
      const result = await generate4PAnalysis(data);
      
      // Cache the result
      cache4PAnalysis(cacheKey, result);
      
      setAnalysis(result);
    } catch (err) {
      console.error('Error loading 4P analysis:', err);
      setError('Failed to load analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllChecklistData = async (filters: any) => {
    // TODO: Implement actual data fetching from all checklists
    // This is a placeholder
    return {
      hr: [],
      operations: [],
      training: [],
      qa: [],
      finance: []
    };
  };

  const get4PIcon = (p: string) => {
    switch (p) {
      case 'people': return <Users className="w-6 h-6" />;
      case 'process': return <Settings className="w-6 h-6" />;
      case 'product': return <Package className="w-6 h-6" />;
      case 'place': return <MapPin className="w-6 h-6" />;
      default: return null;
    }
  };

  const get4PColor = (p: string) => {
    switch (p) {
      case 'people': return 'from-blue-500 to-indigo-500';
      case 'process': return 'from-green-500 to-emerald-500';
      case 'product': return 'from-orange-500 to-amber-500';
      case 'place': return 'from-purple-500 to-violet-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">Analyzing data across all checklists...</p>
          <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
            Processing HR, Operations, Training, QA, and Finance data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Error Loading Analysis</h3>
        </div>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={loadAnalysis}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center text-gray-600 dark:text-slate-400 py-12">
        No data available for analysis
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-8 h-8" />
              <h1 className="text-3xl font-bold">4P Framework Dashboard</h1>
            </div>
            <p className="text-blue-100">
              AI-Powered Analysis • People • Process • Product • Place
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{analysis.overallPercentage.toFixed(1)}%</div>
            <div className="text-sm text-blue-100">Overall Performance</div>
          </div>
        </div>
      </div>

      {/* AI Analysis Badge */}
      {analysis.people.aiGenerated && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI-Generated Insights</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Advanced analysis powered by GitHub Models API • Analyzing remarks from all checklists
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4P Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['people', 'process', 'product', 'place'] as const).map(p => {
          const data = analysis[p];
          return (
            <div
              key={p}
              onClick={() => setSelectedP(p)}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-lg shadow-lg overflow-hidden ${
                selectedP === p ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              <div className={`bg-gradient-to-br ${get4PColor(p)} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  {get4PIcon(p)}
                  <span className="text-3xl font-bold">{data.percentage.toFixed(1)}%</span>
                </div>
                <h3 className="text-xl font-semibold capitalize mb-1">{p}</h3>
                <p className="text-sm opacity-90">{data.score} / {data.maxScore} points</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4">
                <div className="flex items-center gap-2 text-sm">
                  {data.percentage >= 80 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-gray-700 dark:text-slate-300">
                    {data.insights.length} insights
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Insights for Selected P */}
      {selectedP && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {get4PIcon(selectedP)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 capitalize">
                  {selectedP} Insights
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {analysis[selectedP].aiGenerated ? 'AI-Powered Analysis' : 'Statistical Analysis'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedP(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {analysis[selectedP].insights.map((insight, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.score >= 4 ? 'bg-green-100 dark:bg-green-900/30' : 
                    insight.score >= 3 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
                    'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {insight.score >= 4 ? (
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                      {insight.summary}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                      {insight.explanation}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        📊 Source: {insight.source}
                      </span>
                      <span className="flex items-center gap-1">
                        ⭐ Score: {insight.score.toFixed(1)} / 5
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radar Chart Placeholder */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">4P Performance Radar</h3>
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
          <p className="text-gray-500 dark:text-slate-400">
            Radar chart visualization coming soon
          </p>
        </div>
      </div>

      {/* Export & Refresh Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={loadAnalysis}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Analysis
        </button>
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
    </div>
  );
};

export default Consolidated4PDashboard;
