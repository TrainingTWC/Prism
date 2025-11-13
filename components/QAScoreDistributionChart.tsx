import React from 'react';
import { QASubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface QAScoreDistributionChartProps {
  submissions: QASubmission[];
}

const QAScoreDistributionChart: React.FC<QAScoreDistributionChartProps> = ({ submissions }) => {
  // Define score ranges - Red, Yellow, Green scheme
  const scoreRanges = [
    { range: '80-100%', min: 80, max: 100, color: 'bg-green-500', label: 'Good' },
    { range: '60-79%', min: 60, max: 79, color: 'bg-yellow-500', label: 'Satisfactory' },
    { range: 'Below 60%', min: 0, max: 59, color: 'bg-red-500', label: 'Needs Improvement' }
  ];

  // Calculate distribution
  const distribution = scoreRanges.map(range => {
    const count = submissions.filter(submission => {
      const score = parseFloat(submission.scorePercentage) || 0;
      return score >= range.min && score <= range.max;
    }).length;
    
    const percentage = submissions.length > 0 ? (count / submissions.length) * 100 : 0;
    
    return {
      ...range,
      count,
      percentage: Math.round(percentage * 10) / 10
    };
  });

  const maxCount = Math.max(...distribution.map(d => d.count));
  const totalSubmissions = submissions.length;

  // Calculate key metrics
  const avgScore = submissions.length > 0 
    ? Math.round(submissions.reduce((sum, s) => sum + (parseFloat(s.scorePercentage) || 0), 0) / submissions.length)
    : 0;

  const goodCount = distribution[0].count; // 80-100%
  const needsImprovementCount = distribution[2].count; // Below 60%

  if (submissions.length === 0) {
    return (
      <InfographicCard title="QA Score Distribution">
        <div className="flex items-center justify-center mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <p className="text-gray-600 dark:text-slate-400 text-center py-8">No QA data available for distribution analysis</p>
      </InfographicCard>
    );
  }

  return (
    <InfographicCard title="QA Score Distribution">

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{avgScore}%</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Average Score</div>
        </div>
        <div className="text-center p-3 bg-green-500/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{goodCount}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Good (80%+)</div>
        </div>
        <div className="text-center p-3 bg-red-500/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{needsImprovementCount}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">Needs Attention (&lt;60%)</div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300">Score Range Distribution</h4>
        {distribution.map((item, index) => (
          <div key={item.range} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-200">{item.range}</span>
                  <span className="text-xs text-gray-600 dark:text-slate-400 ml-2">({item.label})</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-slate-200">{item.count}</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">{item.percentage}%</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out ${item.color}`}
                style={{ 
                  width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
                  minWidth: item.count > 0 ? '4px' : '0px'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribution Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700/20 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-slate-400">Total Audits:</span>
            <span className="text-gray-900 dark:text-slate-200 ml-2 font-medium">{totalSubmissions}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-slate-400">Passing Rate (≥60%):</span>
            <span className="text-gray-900 dark:text-slate-200 ml-2 font-medium">
              {Math.round(((totalSubmissions - needsImprovementCount) / totalSubmissions) * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-slate-400">Good Performance (≥80%):</span>
            <span className="text-gray-900 dark:text-slate-200 ml-2 font-medium">
              {Math.round((goodCount / totalSubmissions) * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-slate-400">Standard Deviation:</span>
            <span className="text-gray-900 dark:text-slate-200 ml-2 font-medium">
              {submissions.length > 1 ? Math.round(
                Math.sqrt(
                  submissions.reduce((sum, s) => {
                    const score = parseFloat(s.scorePercentage) || 0;
                    return sum + Math.pow(score - avgScore, 2);
                  }, 0) / (submissions.length - 1)
                ) * 10
              ) / 10 : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {goodCount / totalSubmissions >= 0.5 && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <svg className="w-4 h-4 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-green-600 dark:text-green-300">High Performance</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300">
              Over 50% of audits achieve good rating (80%+)
            </p>
          </div>
        )}
        
        {needsImprovementCount / totalSubmissions >= 0.3 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-xs font-medium text-red-600 dark:text-red-300">Attention Required</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300">
              {Math.round((needsImprovementCount / totalSubmissions) * 100)}% of audits need improvement
            </p>
          </div>
        )}
      </div>
    </InfographicCard>
  );
};

export default QAScoreDistributionChart;