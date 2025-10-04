import React, { useMemo } from 'react';
import { TrainingAuditSubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface TrainingScoreDistributionChartProps {
  submissions: TrainingAuditSubmission[];
  onScoreRangeClick?: (minScore: number, maxScore: number, label: string) => void;
}

const TrainingScoreDistributionChart: React.FC<TrainingScoreDistributionChartProps> = ({ 
  submissions, 
  onScoreRangeClick 
}) => {
  const scoreDistribution = useMemo(() => {
    if (!submissions.length) return [];

    // Define percentage ranges
    const ranges = [
      { label: '90-100%', min: 90, max: 100, color: 'bg-green-500' },
      { label: '80-89%', min: 80, max: 89, color: 'bg-lime-500' },
      { label: '70-79%', min: 70, max: 79, color: 'bg-yellow-500' },
      { label: '60-69%', min: 60, max: 69, color: 'bg-orange-500' },
      { label: 'Below 60%', min: 0, max: 59, color: 'bg-red-500' }
    ];

    const distribution = ranges.map(range => {
      const count = submissions.filter(s => {
        const percentage = parseFloat(s.percentageScore || '0');
        return !isNaN(percentage) && percentage >= range.min && percentage <= range.max;
      }).length;

      const percentage = submissions.length > 0 ? (count / submissions.length) * 100 : 0;

      return {
        ...range,
        count,
        percentage
      };
    });

    const maxCount = Math.max(...distribution.map(d => d.count));

    return distribution.map(d => ({
      ...d,
      relativeHeight: maxCount > 0 ? (d.count / maxCount) * 100 : 0
    }));
  }, [submissions]);

  const totalSubmissions = submissions.length;
  const averageScore = useMemo(() => {
    if (!submissions.length) return 0;
    const total = submissions.reduce((sum, s) => {
      const percentage = parseFloat(s.percentageScore || '0');
      return sum + (isNaN(percentage) ? 0 : percentage);
    }, 0);
    return total / submissions.length;
  }, [submissions]);

  return (
    <InfographicCard title="Training Score Distribution">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-slate-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
              {totalSubmissions}
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              Total Audits
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
              {averageScore.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              Average Score
            </div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="space-y-4">
          {scoreDistribution.map((item, index) => (
            <div 
              key={index} 
              className={`space-y-2 ${onScoreRangeClick && item.count > 0 ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors' : ''}`}
              onClick={() => item.count > 0 && onScoreRangeClick?.(item.min, item.max, item.label)}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {item.label}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-slate-400">
                    {item.count} audits
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-300 font-semibold">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                  {onScoreRangeClick && item.count > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Click to view →
                    </span>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-4">
                <div 
                  className={`${item.color} h-4 rounded-full transition-all duration-500 relative`}
                  style={{ width: `${item.relativeHeight}%` }}
                >
                  {item.count > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {item.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalSubmissions === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-slate-500">
              No training audit data available
            </div>
          </div>
        )}
      </div>
    </InfographicCard>
  );
};

export default TrainingScoreDistributionChart;