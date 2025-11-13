import React from 'react';
import { QASubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface QAAverageScoreChartProps {
  submissions: QASubmission[];
}

const QAAverageScoreChart: React.FC<QAAverageScoreChartProps> = ({ submissions }) => {
  if (submissions.length === 0) {
    return (
      <InfographicCard title="Average QA Score by Area Manager">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-center">No QA data available for manager comparison</p>
        </div>
      </InfographicCard>
    );
  }

  // Group submissions by Area Manager
  const amData = submissions.reduce((acc, submission) => {
    const amName = submission.amName || 'Unknown AM';
    const score = parseFloat(submission.scorePercentage) || 0;
    
    if (!acc[amName]) {
      acc[amName] = {
        name: amName,
        scores: [],
        totalScore: 0,
        count: 0
      };
    }
    
    acc[amName].scores.push(score);
    acc[amName].totalScore += score;
    acc[amName].count += 1;
    
    return acc;
  }, {} as Record<string, { name: string; scores: number[]; totalScore: number; count: number }>);

  // Calculate average scores for each AM
  const amScores = Object.values(amData).map((am: any) => ({
    name: am.name,
    averageScore: am.totalScore / am.count,
    submissionCount: am.count
  })).sort((a, b) => b.averageScore - a.averageScore);

  // Find the maximum score for bar width calculation
  const maxScore = Math.max(...amScores.map(am => am.averageScore), 1);

  return (
    <InfographicCard title="Average QA Score by Area Manager">
      <div className="space-y-4">
        {amScores.map((am, index) => (
          <div key={am.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {am.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  ({am.submissionCount} audit{am.submissionCount !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {am.averageScore.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  am.averageScore >= 80 ? 'bg-green-500' :
                  am.averageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ 
                  width: `${maxScore > 0 ? (am.averageScore / maxScore) * 100 : 0}%`,
                  minWidth: am.averageScore > 0 ? '4px' : '0px'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Based on {submissions.length} QA audit{submissions.length !== 1 ? 's' : ''} across {amScores.length} Area Manager{amScores.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </InfographicCard>
  );
};

export default QAAverageScoreChart;