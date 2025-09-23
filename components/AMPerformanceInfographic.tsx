import React, { useMemo } from 'react';
import { Submission } from '../types';
import InfographicCard from './InfographicCard';
import { useTheme } from '../contexts/ThemeContext';

interface AMPerformanceProps {
  submissions: Submission[];
}

const PerformanceStat: React.FC<{
    label: string;
    value: string;
    score: string;
    icon: React.ReactNode;
    colorClass: string;
    theme: 'light' | 'dark';
}> = ({ label, value, score, icon, colorClass, theme }) => (
    <div className="flex items-center space-x-4">
        <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${colorClass} bg-opacity-20`}>
            <div className={`${colorClass}`}>{icon}</div>
        </div>
        <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>{label}</p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{value}</p>
            <p className={`text-lg font-semibold ${colorClass}`}>{score}</p>
        </div>
    </div>
);

const AMPerformanceInfographic: React.FC<AMPerformanceProps> = ({ submissions }) => {
    const { theme } = useTheme();
    
    const performanceData = useMemo(() => {
        if (submissions.length === 0) return { top: null, bottom: null };
        
        const scoresByManager: { [key: string]: { name: string, totalPercent: number, count: number } } = {};

        submissions.forEach(s => {
            if (!scoresByManager[s.amId]) {
                scoresByManager[s.amId] = { name: s.amName, totalPercent: 0, count: 0 };
            }
            scoresByManager[s.amId].totalPercent += s.percent;
            scoresByManager[s.amId].count++;
        });

        const aggregated = Object.values(scoresByManager).map(({ name, totalPercent, count }) => ({
            name,
            averageScore: Math.round(totalPercent / count),
        }));
        
        if (aggregated.length === 0) return { top: null, bottom: null };

        aggregated.sort((a, b) => b.averageScore - a.averageScore);

        const top = aggregated[0];
        const bottom = aggregated.length > 1 ? aggregated[aggregated.length - 1] : top;

        return { top, bottom };

    }, [submissions]);

    return (
        <InfographicCard title="Team Satisfaction by AM">
            <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center">
                    <PerformanceStat
                        label="Most Satisfied Team (AM)"
                        value={performanceData.top?.name.split(' ')[0] || 'N/A'}
                        score={performanceData.top ? `${performanceData.top.averageScore}%` : ''}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" /></svg>}
                        colorClass="text-emerald-400"
                        theme={theme}
                    />
                </div>
                <div className={`border-t ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}></div>
                <div className="flex-1 flex items-center">
                    <PerformanceStat
                        label="Least Satisfied Team (AM)"
                        value={performanceData.bottom?.name.split(' ')[0] || 'N/A'}
                        score={performanceData.bottom ? `${performanceData.bottom.averageScore}%` : ''}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 6.464a1 1 0 011.415 0 3 3 0 004.242 0 1 1 0 011.415-1.414 5 5 0 01-7.072 0 1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                        colorClass="text-red-400"
                        theme={theme}
                    />
                </div>
            </div>
        </InfographicCard>
    );
};

export default AMPerformanceInfographic;