import React, { useMemo } from 'react';
import { TrainingAuditSubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface TrainingAMPerformanceInfographicProps {
  submissions: TrainingAuditSubmission[];
  onTrainerClick?: (trainerId: string, trainerName: string) => void;
}

const TrainingAMPerformanceInfographic: React.FC<TrainingAMPerformanceInfographicProps> = ({ 
  submissions, 
  onTrainerClick 
}) => {
  const trainerPerformance = useMemo(() => {
    if (!submissions.length) return [];

    // Group submissions by trainer NAME (not ID) to avoid duplicates
    const trainerGroups: Record<string, { trainerId: string; trainerName: string; submissions: TrainingAuditSubmission[] }> = {};
    
    submissions.forEach(submission => {
      const trainerName = submission.trainerName;
      const trainerId = submission.trainerId;
      
      // Use trainer name as the key to group all submissions by the same person
      if (!trainerGroups[trainerName]) {
        trainerGroups[trainerName] = {
          trainerId,
          trainerName,
          submissions: []
        };
      }
      
      trainerGroups[trainerName].submissions.push(submission);
    });

    // Calculate performance metrics for each trainer
    const performance = Object.values(trainerGroups).map(group => {
      const groupSubmissions = group.submissions;
      
      const totalScore = groupSubmissions.reduce((sum, s) => {
        const score = parseFloat(s.totalScore || '0');
        return sum + (isNaN(score) ? 0 : score);
      }, 0);

      const totalPercentage = groupSubmissions.reduce((sum, s) => {
        const percentage = parseFloat(s.percentageScore || '0');
        return sum + (isNaN(percentage) ? 0 : percentage);
      }, 0);

      const averageScore = groupSubmissions.length > 0 ? totalScore / groupSubmissions.length : 0;
      const averagePercentage = groupSubmissions.length > 0 ? totalPercentage / groupSubmissions.length : 0;

      // Get unique stores audited
      const uniqueStores = [...new Set(groupSubmissions.map(s => s.storeId))];

      return {
        trainerId: group.trainerId,
        trainerName: group.trainerName,
        auditCount: groupSubmissions.length,
        storeCount: uniqueStores.length,
        averageScore,
        averagePercentage
      };
    });

    // Sort by average percentage (highest first)
    return performance.sort((a, b) => b.averagePercentage - a.averagePercentage);
  }, [submissions]);

  // Show all trainers instead of just top 5
  const allTrainers = trainerPerformance;
  const maxPercentage = allTrainers.length > 0 ? Math.max(...allTrainers.map(t => t.averagePercentage)) : 100;

  return (
    <InfographicCard title="Trainer Performance">
      <div className="space-y-4">
        {allTrainers.map((trainer, index) => (
          <div 
            key={trainer.trainerId} 
            className={`space-y-2 ${onTrainerClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors' : ''}`}
            onClick={() => onTrainerClick?.(trainer.trainerId, trainer.trainerName)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  index === 0 ? 'bg-purple-600' :
                  index === 1 ? 'bg-purple-500' :
                  index === 2 ? 'bg-purple-400' :
                  'bg-purple-300'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-slate-200">
                    {trainer.trainerName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    {trainer.auditCount} audits • {trainer.storeCount} stores
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-purple-600 dark:text-purple-300">
                  {trainer.averagePercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {trainer.averageScore.toFixed(1)} pts
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
              <div 
                className={`${
                  index === 0 ? 'bg-purple-600' :
                  index === 1 ? 'bg-purple-500' :
                  index === 2 ? 'bg-purple-400' :
                  'bg-purple-300'
                } h-3 rounded-full transition-all duration-500`}
                style={{ 
                  width: `${maxPercentage > 0 ? (trainer.averagePercentage / maxPercentage) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        ))}
        
        {allTrainers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-slate-500">
              No trainer data available
            </div>
          </div>
        )}
      </div>
    </InfographicCard>
  );
};

export default TrainingAMPerformanceInfographic;