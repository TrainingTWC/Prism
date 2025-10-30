import React, { useMemo } from 'react';
import { TrainingAuditSubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';
import { useConfig } from '../contexts/ConfigContext';

interface TrainingHRPerformanceInfographicProps {
  submissions: TrainingAuditSubmission[];
  onSectionClick?: (sectionId: string, sectionTitle: string) => void;
}

const TrainingHRPerformanceInfographic: React.FC<TrainingHRPerformanceInfographicProps> = ({ 
  submissions,
  onSectionClick 
}) => {
  const { get } = useConfig();
  const runtimeSections = get('TRAINING_SECTIONS');

  const sectionPerformance = useMemo(() => {
    if (!submissions.length) return [];
    // Define training sections with their question IDs and weights
    const defaultSections = [
      {
        id: 'TrainingMaterials',
        title: 'Training Materials',
        questions: ['TM_1', 'TM_2', 'TM_3', 'TM_4', 'TM_5', 'TM_6', 'TM_7', 'TM_8', 'TM_9'],
        color: 'bg-purple-600'
      },
      {
        id: 'LMS',
        title: 'LMS Usage',
        questions: ['LMS_1', 'LMS_2', 'LMS_3'],
        color: 'bg-indigo-600'
      },
      {
        id: 'Buddy',
        title: 'Buddy Training',
        questions: ['Buddy_1', 'Buddy_2', 'Buddy_3', 'Buddy_4', 'Buddy_5', 'Buddy_6'],
        color: 'bg-violet-600'
      },
      {
        id: 'NewJoiner',
        title: 'New Joiner Training',
        questions: ['NJ_1', 'NJ_2', 'NJ_3', 'NJ_4', 'NJ_5', 'NJ_6', 'NJ_7'],
        color: 'bg-fuchsia-600'
      },
      {
        id: 'PartnerKnowledge',
        title: 'Partner Knowledge',
        questions: ['PK_1', 'PK_2', 'PK_3', 'PK_4', 'PK_5', 'PK_6'],
        color: 'bg-pink-600'
      },
      {
        id: 'TSA',
        title: 'Training Skill Assessment',
        questions: ['TSA_Food', 'TSA_Coffee', 'TSA_CX'], // 3 TSA types (field variants checked in code)
        color: 'bg-rose-600'
      },
      {
        id: 'CustomerExperience',
        title: 'Customer Experience',
        questions: ['CX_1', 'CX_2', 'CX_3', 'CX_4', 'CX_5', 'CX_6', 'CX_7', 'CX_8', 'CX_9'],
        color: 'bg-orange-600'
      },
      {
        id: 'ActionPlan',
        title: 'Action Plan',
        questions: ['AP_1', 'AP_2', 'AP_3'],
        color: 'bg-amber-600'
      }
    ];

  const sections = runtimeSections && runtimeSections.length ? runtimeSections : defaultSections;

  // Calculate performance for each section
  const performance = (sections as any).map((section: any) => {
      let totalScore = 0;
      let maxPossibleScore = 0;
      let responseCount = 0;

      submissions.forEach(submission => {
        // For TSA section, handle specially - only count each TSA type once per submission
        if (section.id === 'TSA') {
          // Count Food score (check all variants but only count once)
          const foodScore = submission.tsaFoodScore || submission.TSA_Food_Score || submission.TSA_1;
          if (foodScore !== undefined && foodScore !== null && foodScore !== '' && foodScore !== 'na') {
            const score = parseFloat(foodScore) || 0;
            totalScore += score;
            maxPossibleScore += 10;
            responseCount++;
          }
          
          // Count Coffee score (check all variants but only count once)
          const coffeeScore = submission.tsaCoffeeScore || submission.TSA_Coffee_Score || submission.TSA_2;
          if (coffeeScore !== undefined && coffeeScore !== null && coffeeScore !== '' && coffeeScore !== 'na') {
            const score = parseFloat(coffeeScore) || 0;
            totalScore += score;
            maxPossibleScore += 10;
            responseCount++;
          }
          
          // Count CX score (check all variants but only count once)
          const cxScore = submission.tsaCXScore || submission.TSA_CX_Score || submission.TSA_3;
          if (cxScore !== undefined && cxScore !== null && cxScore !== '' && cxScore !== 'na') {
            const score = parseFloat(cxScore) || 0;
            totalScore += score;
            maxPossibleScore += 10;
            responseCount++;
          }
          
          return; // Skip the normal loop for TSA section
        }
        
        // For all other sections, process each question normally
        section.questions.forEach(questionId => {
          
          // For non-TSA sections, use normal logic
          const response = submission[questionId];
          // Count responses: include 0 as valid, but exclude undefined, null, empty string, and 'na'/'NA'
          if (response !== undefined && response !== null && response !== '' && response !== 'na' && response !== 'NA') {
            responseCount++;
            
            // For binary yes/no questions
            if (response === 'yes' || response === 'Yes') {
              totalScore += 1;
              maxPossibleScore += 1;
            } else if (response === 'no' || response === 'No') {
              totalScore += 0;
              maxPossibleScore += 1;
            } else if (response === 'Excellent') {
              totalScore += 5;
              maxPossibleScore += 5;
            } else if (response === 'Good') {
              totalScore += 3;
              maxPossibleScore += 5;
            } else if (response === 'Poor') {
              totalScore += 1;
              maxPossibleScore += 5;
            } else if (!isNaN(parseFloat(response))) {
              // For numeric responses (TSA questions) - includes 0
              totalScore += Math.min(parseFloat(response), 10);
              maxPossibleScore += 10;
            } else if (response.trim && response.trim()) {
              // For text responses, give full score if there's content
              totalScore += 1;
              maxPossibleScore += 1;
            }
          }
        });
      });

      const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      
      return {
        ...section,
        score: totalScore,
        maxScore: maxPossibleScore,
        percentage,
        responseCount
      };
    });

    // Sort by percentage (lowest first to highlight areas needing attention)
    return performance.sort((a, b) => a.percentage - b.percentage);
  }, [submissions]);

  const maxPercentage = sectionPerformance.length > 0 ? Math.max(...sectionPerformance.map(s => s.percentage)) : 100;

  return (
    <InfographicCard title="Performance by Training Section">
      <div className="space-y-4">
        {sectionPerformance.map((section, index) => (
          <div 
            key={section.id} 
            className={`space-y-2 ${onSectionClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors' : ''}`}
            onClick={() => onSectionClick?.(section.id, section.title)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${section.color}`}></div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-slate-200">
                    {section.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    {section.questions.length} questions • {section.responseCount} responses
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-purple-600 dark:text-purple-300">
                  {section.percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {section.score.toFixed(1)} / {section.maxScore.toFixed(1)}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  section.percentage < 50 ? 'bg-red-500' :
                  section.percentage < 70 ? 'bg-amber-500' :
                  'bg-green-500'
                }`}
                style={{ 
                  width: `${maxPercentage > 0 ? (section.percentage / maxPercentage) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        ))}
        
        {sectionPerformance.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-slate-500">
              No section performance data available
            </div>
          </div>
        )}
      </div>
    </InfographicCard>
  );
};

export default TrainingHRPerformanceInfographic;