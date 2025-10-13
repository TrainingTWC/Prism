import React, { useMemo } from 'react';
import { QASubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface QASectionScoresInfographicProps {
  submissions: QASubmission[];
}

// Section mapping for QA
const QA_SECTIONS = [
  { id: 'ZT', name: 'Zero Tolerance', questions: 6, prefix: 'ZeroTolerance_ZT' },
  { id: 'M', name: 'Maintenance', questions: 11, prefix: 'Maintenance_M' },
  { id: 'SO', name: 'Store Operations', questions: 16, prefix: 'StoreOperations_SO' },
  { id: 'HC', name: 'Hygiene & Compliance', questions: 6, prefix: 'HygieneCompliance_HC' }
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
                let answeredQuestions = 0;
                
                // Count responses for each section based on the actual field names from Google Sheets
                // Google Sheets uses descriptive field names, not simple codes
                for (let i = 1; i <= section.questions; i++) {
                    let response = null;
                    let questionKey = '';
                    
                    // Get all keys that match the section pattern
                    const allKeys = Object.keys(submission);
                    let sectionFields = [];
                    
                    if (section.id === 'ZT') {
                        sectionFields = allKeys.filter(k => k.startsWith('ZT_'));
                    } else if (section.id === 'M') {
                        sectionFields = allKeys.filter(k => k.startsWith('M_'));
                    } else if (section.id === 'SO') {
                        sectionFields = allKeys.filter(k => k.startsWith('SO_'));
                    } else if (section.id === 'HC') {
                        sectionFields = allKeys.filter(k => k.startsWith('HC_'));
                    }
                    
                    // Get the field for this question number (i-1 because arrays are 0-indexed)
                    if (sectionFields.length >= i) {
                        questionKey = sectionFields[i-1];
                        response = (submission as any)[questionKey];
                    }
                    
                    if (submissionIndex === 0) {
                        console.log(`  Question ${i}: key="${questionKey}" value="${response}"`);
                    }
                    
                    if (response !== undefined && response !== null && response !== '') {
                        answeredQuestions++;
                        // For QA checklists, be more flexible with scoring
                        const responseStr = response.toString().toLowerCase().trim();
                        if (responseStr === 'yes' || 
                            responseStr === 'compliant' ||
                            responseStr === 'passed' ||
                            responseStr === 'pass' ||
                            responseStr === 'good' ||
                            responseStr === 'satisfactory' ||
                            responseStr === '1' || 
                            responseStr === 'true') {
                            sectionScore++;
                        }
                    }
                }
                
                if (answeredQuestions > 0) {
                    const percentage = (sectionScore / section.questions) * 100;
                    sectionScores.push(percentage);
                    if (submissionIndex === 0) {
                        console.log(`  Submission ${submissionIndex}: ${sectionScore}/${section.questions} = ${percentage}%`);
                    }
                }
            });
            
            const averageScore = sectionScores.length > 0 
                ? sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
                : 0;

            console.log(`Section ${section.name} final average: ${averageScore}% (from ${sectionScores.length} submissions)`);

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
                                    item.averageScore >= 90 ? 'bg-emerald-500' :
                                    item.averageScore >= 80 ? 'bg-blue-500' :
                                    item.averageScore >= 70 ? 'bg-yellow-500' :
                                    item.averageScore >= 60 ? 'bg-orange-500' : 'bg-red-500'
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