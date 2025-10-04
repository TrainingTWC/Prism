import React, { useMemo } from 'react';
import { TrainingAuditSubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface TrainingRegionPerformanceInfographicProps {
  submissions: TrainingAuditSubmission[];
  onRegionClick?: (region: string) => void;
}

const TrainingRegionPerformanceInfographic: React.FC<TrainingRegionPerformanceInfographicProps> = ({ 
  submissions, 
  onRegionClick 
}) => {
  const regionPerformance = useMemo(() => {
    if (!submissions.length) return [];

    const regions = ['North', 'South', 'West'];
    
    return regions.map(region => {
      const regionSubmissions = submissions.filter(s => s.region === region);
      
      if (regionSubmissions.length === 0) {
        return {
          region,
          count: 0,
          averageScore: 0,
          averagePercentage: 0
        };
      }

      const totalScore = regionSubmissions.reduce((sum, s) => {
        const score = parseFloat(s.totalScore || '0');
        return sum + (isNaN(score) ? 0 : score);
      }, 0);

      const totalPercentage = regionSubmissions.reduce((sum, s) => {
        const percentage = parseFloat(s.percentageScore || '0');
        return sum + (isNaN(percentage) ? 0 : percentage);
      }, 0);

      return {
        region,
        count: regionSubmissions.length,
        averageScore: regionSubmissions.length > 0 ? totalScore / regionSubmissions.length : 0,
        averagePercentage: regionSubmissions.length > 0 ? totalPercentage / regionSubmissions.length : 0
      };
    }).filter(r => r.count > 0);
  }, [submissions]);

  return (
    <InfographicCard title="Training Performance by Region">
      <div className="space-y-6">
        {regionPerformance.map((region, index) => (
          <div 
            key={region.region} 
            className={`space-y-2 ${onRegionClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors' : ''}`}
            onClick={() => onRegionClick?.(region.region)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-purple-500' : 
                  index === 1 ? 'bg-indigo-500' : 
                  'bg-violet-500'
                }`}></div>
                <span className="font-medium text-gray-700 dark:text-slate-300">
                  {region.region}
                </span>
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  ({region.count} audits)
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-purple-600 dark:text-purple-300">
                  {region.averagePercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {region.averageScore.toFixed(1)} pts
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-300 dark:bg-slate-600 rounded-full h-3">
              <div 
                className={`${
                  index === 0 ? 'bg-purple-500' : 
                  index === 1 ? 'bg-indigo-500' : 
                  'bg-violet-500'
                } h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(region.averagePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
        
        {regionPerformance.length === 0 && (
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

export default TrainingRegionPerformanceInfographic;