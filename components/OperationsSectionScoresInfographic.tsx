import React, { useMemo } from 'react';
import { AMOperationsSubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface OperationsSectionScoresInfographicProps {
  submissions: AMOperationsSubmission[];
}

// Section mapping for AM Operations
const AM_OPERATIONS_SECTIONS = [
  { id: 'CG', name: 'Customer Greeting', questions: 13 },
  { id: 'OTA', name: 'Order Taking Assistance', questions: 11 },
  { id: 'FAS', name: 'Friendly & Accurate Service', questions: 13 },
  { id: 'FWS', name: 'Feedback with Solution', questions: 13 },
  { id: 'ENJ', name: 'Enjoyable Experience', questions: 7 },
  { id: 'EX', name: 'Enthusiastic Exit', questions: 6 }
];

const OperationsSectionScoresInfographic: React.FC<OperationsSectionScoresInfographicProps> = ({ submissions }) => {
    const sectionScores = useMemo(() => {
        if (submissions.length === 0) {
            return AM_OPERATIONS_SECTIONS.map(section => ({
                id: section.id,
                title: section.name,
                averageScore: 0,
            }));
        }

        const scores = AM_OPERATIONS_SECTIONS.map(section => {
            const sectionScores: number[] = [];
            
            submissions.forEach(submission => {
                let sectionScore = 0;
                let answeredQuestions = 0;
                
                // Count responses for each section based on question numbering
                for (let i = 1; i <= section.questions; i++) {
                    const questionKey = `${section.id}_${i}`;
                    const response = (submission as any)[questionKey];
                    
                    if (response !== undefined && response !== null && response !== '') {
                        answeredQuestions++;
                        // For Operations checklists, assume binary scoring (Yes=1, No=0)
                        if (response.toString().toLowerCase() === 'yes' || 
                            response.toString().toLowerCase() === 'compliant' ||
                            response === '1' || response === 1 || response === 'true') {
                            sectionScore++;
                        }
                    }
                }
                
                if (answeredQuestions > 0) {
                    const percentage = (sectionScore / section.questions) * 100;
                    sectionScores.push(percentage);
                }
            });
            
            const averageScore = sectionScores.length > 0 
                ? sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
                : 0;

            return {
                id: section.id,
                title: section.name,
                averageScore: averageScore,
            };
        });
        
        return scores;

    }, [submissions]);

    return (
        <InfographicCard title="Section Score Analysis (Operations)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {sectionScores.map(item => (
                    <div key={item.id}>
                        <div className="grid grid-cols-[1fr_auto] items-start gap-x-2 mb-1.5">
                            <p className="text-sm text-gray-700 dark:text-slate-300 truncate" title={item.title}>
                                {item.title}
                            </p>
                            <div className="flex flex-col items-end leading-tight">
                                <span className="font-semibold text-sky-600 dark:text-sky-300">{item.averageScore.toFixed(1)}%</span>
                                <span className="text-xs text-gray-600 dark:text-slate-400">/ 100%</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-300 dark:bg-slate-600 rounded-full h-2">
                            <div 
                                className={`${item.averageScore < 70.0 ? 'bg-amber-500' : 'bg-yellow-400'} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${Math.min(100, item.averageScore)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </InfographicCard>
    );
};

export default OperationsSectionScoresInfographic;