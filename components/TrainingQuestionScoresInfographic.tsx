import React, { useMemo } from 'react';
import { TrainingAuditSubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';
import { TRAINING_QUESTIONS } from '../constants';

interface TrainingQuestionScoresInfographicProps {
  submissions: TrainingAuditSubmission[];
}

const TrainingQuestionScoresInfographic: React.FC<TrainingQuestionScoresInfographicProps> = ({ submissions }) => {
  const questionScores = useMemo(() => {
    if (!submissions.length) return [];

    const scores = TRAINING_QUESTIONS.map(question => {
      const responses = submissions
        .map(s => s[question.id])
        .filter(response => response !== undefined && response !== null && response !== '');

      if (responses.length === 0) {
        return {
          id: question.id,
          title: question.title,
          averageScore: 0,
          maxScore: question.type === 'input' || question.type === 'textarea' ? 10 : Math.max(...(question.choices?.map(c => c.score) || [1]))
        };
      }

      let totalScore = 0;
      let maxPossibleScore = 0;

      responses.forEach(response => {
        if (question.type === 'radio' && question.choices) {
          const choice = question.choices.find(c => c.label === response);
          if (choice) {
            totalScore += choice.score;
            maxPossibleScore += Math.max(...question.choices.map(c => c.score));
          }
        } else if (question.type === 'input' || question.type === 'textarea') {
          // For input/textarea questions, assume scoring based on response quality
          // TSA questions might have numerical values
          if (question.id.startsWith('TSA_') && !isNaN(parseFloat(response))) {
            totalScore += Math.min(parseFloat(response), 10);
            maxPossibleScore += 10;
          } else {
            // For other text inputs, give full score if there's a response
            totalScore += response.trim() ? 10 : 0;
            maxPossibleScore += 10;
          }
        }
      });

      const averageScore = responses.length > 0 ? (totalScore / responses.length) : 0;
      const maxScore = maxPossibleScore > 0 ? (maxPossibleScore / responses.length) : 10;

      return {
        id: question.id,
        title: question.title,
        averageScore,
        maxScore
      };
    });

    // Sort by average score (lowest first to highlight areas needing attention)
    return scores.sort((a, b) => a.averageScore - b.averageScore);
  }, [submissions]);

  return (
    <InfographicCard title="Training Question Score Analysis">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {questionScores.map(item => {
          const percentage = item.maxScore > 0 ? (item.averageScore / item.maxScore) * 100 : 0;
          
          return (
            <div key={item.id}>
              <div className="grid grid-cols-[1fr_auto] items-start gap-x-2 mb-1.5">
                <p className="text-sm text-gray-700 dark:text-slate-300 truncate" title={item.title}>
                  {item.title}
                </p>
                <div className="flex flex-col items-end leading-tight">
                  <span className="font-semibold text-purple-600 dark:text-purple-300">
                    {item.averageScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-slate-400">
                    / {item.maxScore.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-300 dark:bg-slate-600 rounded-full h-2">
                <div 
                  className={`${
                    percentage < 50 ? 'bg-red-500' : 
                    percentage < 70 ? 'bg-amber-500' : 
                    'bg-green-500'
                  } h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </InfographicCard>
  );
};

export default TrainingQuestionScoresInfographic;