import React, { useMemo } from 'react';
import { Submission, Store } from '../types';
import InfographicCard from './InfographicCard';

interface RegionPerformanceProps {
  submissions: Submission[];
  stores: Store[];
  onRegionClick?: (region: string, label: string) => void;
}

const PerformanceStat: React.FC<{
    label: string;
    value: string;
    score: string;
    icon: React.ReactNode;
    colorClass: string;
}> = ({ label, value, score, icon, colorClass }) => (
    <div className="flex items-center space-x-4">
        <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${colorClass} bg-opacity-20`}>
            <div className={`${colorClass}`}>{icon}</div>
        </div>
        <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
            <p className={`text-lg font-semibold ${colorClass}`}>{score}</p>
        </div>
    </div>
);


const RegionPerformanceInfographic: React.FC<RegionPerformanceProps> = ({ submissions, stores, onRegionClick }) => {
    const performanceData = useMemo(() => {
        if (submissions.length === 0) return { top: null, bottom: null };

        const scoresByRegion: { [key: string]: { totalPercent: number, count: number } } = {};

        submissions.forEach(s => {
            // Use region directly from submission data (already validated by Google Apps Script)
            const region = s.region || 'Unknown';
            if (region && region !== 'Unknown') {
                if (!scoresByRegion[region]) {
                    scoresByRegion[region] = { totalPercent: 0, count: 0 };
                }
                scoresByRegion[region].totalPercent += s.percent;
                scoresByRegion[region].count++;
            }
        });

        const aggregated = Object.entries(scoresByRegion).map(([name, { totalPercent, count }]) => ({
            name,
            averageScore: Math.round(totalPercent / count),
        }));

        if (aggregated.length === 0) return { top: null, bottom: null };
        
        aggregated.sort((a, b) => b.averageScore - a.averageScore);
        
        const top = aggregated[0];
        const bottom = aggregated.length > 1 ? aggregated[aggregated.length - 1] : top;

        return { top, bottom };

    }, [submissions, stores]);

    return (
        <InfographicCard 
            title="Regional Satisfaction" 
            clickable={!!onRegionClick}
            onClick={() => onRegionClick && performanceData.top && onRegionClick(performanceData.top.name, 'Top Region')}
        >
            <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center">
                    <PerformanceStat
                        label="Most Satisfied Region"
                        value={performanceData.top?.name || 'N/A'}
                        score={performanceData.top ? `${performanceData.top.averageScore}%` : ''}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" /></svg>}
                        colorClass="text-green-500"
                    />
                </div>
                 <div className="border-t border-gray-300 dark:border-slate-700"></div>
                <div className="flex-1 flex items-center">
                    <PerformanceStat
                        label="Least Satisfied Region"
                        value={performanceData.bottom?.name || 'N/A'}
                        score={performanceData.bottom ? `${performanceData.bottom.averageScore}%` : ''}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 6.464a1 1 0 011.415 0 3 3 0 004.242 0 1 1 0 011.415-1.414 5 5 0 01-7.072 0 1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                        colorClass="text-yellow-500"
                    />
                </div>
            </div>
        </InfographicCard>
    );
};

export default RegionPerformanceInfographic;