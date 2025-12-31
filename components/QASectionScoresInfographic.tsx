import React, { useMemo } from 'react';
import { QASubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface QASectionScoresInfographicProps {
  submissions: QASubmission[];
}

// Section mapping for QA - Updated to match new 116-question structure
const QA_SECTIONS = [
  { id: 'ZeroTolerance', name: 'Zero Tolerance', questions: 6, prefix: 'ZT_' },
  { id: 'Store', name: 'Store Operations', questions: 94, prefix: 'S_' },
  { id: 'A', name: 'QA', questions: 3, prefix: 'A_' },
  { id: 'Maintenance', name: 'Maintenance', questions: 11, prefix: 'M_' },
  { id: 'HR', name: 'HR', questions: 2, prefix: 'HR_' }
];

const QASectionScoresInfographic: React.FC<QASectionScoresInfographicProps> = ({ submissions }) => {
    console.log('✅ QASectionScoresInfographic - Processing', submissions.length, 'submissions');
    
    // Debug: Show what Store Operations and other fields actually exist
    if (submissions.length > 0) {
        const allKeys = Object.keys(submissions[0]);
        console.log('🔍 TOTAL FIELDS COUNT:', allKeys.length);
        console.log('🔍 ALL FIELD NAMES:', allKeys);
        console.log('🔍 Fields starting with SO_:', allKeys.filter(k => k.startsWith('SO_')));
        console.log('🔍 Fields starting with HC_:', allKeys.filter(k => k.startsWith('HC_')));
        console.log('🔍 Fields starting with M_:', allKeys.filter(k => k.startsWith('M_')));
        console.log('🔍 Fields starting with ZT_:', allKeys.filter(k => k.startsWith('ZT_')));
        console.log('🔍 All fields containing "Store":', allKeys.filter(k => k.toLowerCase().includes('store')));
        console.log('🔍 All fields containing "Operation":', allKeys.filter(k => k.toLowerCase().includes('operation')));
        console.log('🔍 All fields containing "Hygiene":', allKeys.filter(k => k.toLowerCase().includes('hygiene')));
        console.log('🔍 All fields containing "Maintenance":', allKeys.filter(k => k.toLowerCase().includes('maintenance')));
    }
    
    const sectionScores = useMemo(() => {
        const scores = QA_SECTIONS.map(section => {
            console.log(`Processing section: ${section.name} (${section.prefix})`);
            const sectionScores: number[] = [];
            
            submissions.forEach((submission, submissionIndex) => {
                let sectionScore = 0;
                let maxPossibleScore = 0;
                let answeredQuestions = 0;
                
                // Get all keys from submission
                const allKeys = Object.keys(submission);
                
                // Find all fields for this section
                let sectionFields = allKeys.filter(k => {
                    // Match format like "ZT_1: description" or "S_1: description"
                    return k.startsWith(section.prefix) && k.includes(':') && !k.toLowerCase().includes('remark');
                }).sort(); // Sort to maintain order
                
                if (submissionIndex === 0) {
                    console.log(`  Found ${sectionFields.length} fields for ${section.name}:`, sectionFields.slice(0, 5));
                }
                
                // Process each field
                sectionFields.forEach((field, idx) => {
                    const response = (submission as any)[field];
                    
                    if (response && response !== '' && response !== 'undefined') {
                        answeredQuestions++;
                        const responseStr = response.toString().toLowerCase().trim();
                        
                        // Skip 'na' responses - don't count them
                        if (responseStr === 'na' || responseStr === 'n/a') {
                            return;
                        }
                        
                        // Add to max score
                        maxPossibleScore++;
                        
                        // Zero Tolerance: compliant = 1, non-compliant = 0
                        if (section.id === 'ZeroTolerance') {
                            if (responseStr === 'compliant') {
                                sectionScore++;
                            }
                        } else {
                            // Other sections: compliant = 1, partially-compliant = 0.5, not-compliant = 0
                            if (responseStr === 'compliant') {
                                sectionScore++;
                            } else if (responseStr === 'partially-compliant' || responseStr.includes('partial')) {
                                sectionScore += 0.5;
                            }
                        }
                    }
                });
                
                if (maxPossibleScore > 0) {
                    const percentage = (sectionScore / maxPossibleScore) * 100;
                    sectionScores.push(percentage);
                    if (submissionIndex === 0) {
                        console.log(`  Submission ${submissionIndex}: ${sectionScore}/${maxPossibleScore} = ${percentage.toFixed(1)}%`);
                    }
                }
            });
            
            const averageScore = sectionScores.length > 0 
                ? sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
                : 0;

            console.log(`Section ${section.name} final average: ${averageScore.toFixed(1)}% (from ${sectionScores.length} submissions)`);

            return {
                id: section.id,
                title: section.name,
                averageScore: averageScore,
            };
        });
        
        console.log('Final section scores:', scores);
        return scores;

    }, [submissions]);

    return (
        <InfographicCard title="Section Score Analysis (QA)">
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
                                className={`${
                                    item.averageScore >= 80 ? 'bg-green-500' :
                                    item.averageScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                } h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${Math.min(100, item.averageScore)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </InfographicCard>
    );
};

export default QASectionScoresInfographic;