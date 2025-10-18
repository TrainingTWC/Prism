
import React from 'react';

type AverageValue = {
  latest?: number | null;
  previous?: number | null;
  aggregate?: number | null; // used when there is no latest/previous
};

interface StatCardProps {
  title: string;
  value?: string | number | AverageValue;
  onClick?: () => void;
}

const TrendArrow: React.FC<{ latest: number; previous?: number | null }> = ({ latest, previous }) => {
  if (previous === null || previous === undefined) return <span className="text-slate-900 dark:text-slate-100 font-black text-2xl sm:text-3xl">{latest}%</span>;
  const delta = latest - previous;
  const up = delta >= 0;
  const color = up ? 'text-emerald-600' : 'text-rose-600';
  const bgColor = up ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' : 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
  const arrow = up ? '↗' : '↘';
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-slate-900 dark:text-slate-100 font-black text-2xl sm:text-3xl">{latest}%</span>
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${bgColor} ${color} shadow-sm`}>
        <span className="text-sm font-bold">{arrow}</span>
        <span className="text-sm font-bold">{Math.abs(Math.round(delta))}%</span>
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, onClick }) => {
  // If value is structured AverageValue, render compact trend view
  const isAvgObject = typeof value === 'object' && value !== null && ('latest' in (value as any) || 'aggregate' in (value as any));
  
  // Check if this is the Audit Percentage card
  const isAuditPercentage = title === 'Audit Percentage';
  
  // Check if this card should be clickable
  const isClickable = onClick && (title === 'Total Submissions' || title === 'Stores Covered');
  
  // Get the percentage value for color coding
  const getPercentageValue = () => {
    if (isAvgObject) {
      const avg = value as AverageValue;
      return avg.latest ?? avg.aggregate ?? 0;
    }
    return 0;
  };
  
  // Get color based on percentage
  const getPercentageColor = (percentage: number) => {
    if (percentage < 55) return 'text-red-600'; // Needs Attention
    if (percentage >= 55 && percentage < 81) return 'text-amber-600'; // Brewing
    return 'text-emerald-600'; // Perfect Shot
  };

  if (isAuditPercentage) {
    const percentageValue = getPercentageValue();
    const colorClass = getPercentageColor(percentageValue);
    
    return (
      <div className="group relative p-1 sm:p-2">
        {/* Premium gradient background with glass effect */}
        <div className="absolute inset-1 sm:inset-2 bg-gradient-to-br from-white/95 via-white/85 to-white/75 dark:from-slate-800/95 dark:via-slate-800/85 dark:to-slate-800/75 backdrop-blur-md rounded-full"></div>
        {/* Enhanced shadow layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/40 dark:from-slate-700/40 dark:via-transparent dark:to-slate-800/60 rounded-full shadow-2xl" 
             style={{ 
               boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)' 
             }}></div>
        
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-2 sm:py-3 rounded-full border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] group-hover:border-slate-300/80 dark:group-hover:border-slate-600/80 bg-white/50 dark:bg-slate-800/50" 
             style={{ 
               minHeight: '50px',
               backdropFilter: 'blur(20px) saturate(180%)'
             }}>
          
          {/* Title on the left - 2 lines */}
          <div className="flex flex-col items-start text-left flex-shrink-0">
            <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-wider">Audit</span>
            <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-wider">Percentage</span>
          </div>
          
          {/* Percentage in the center-right */}
          <div className="flex items-center justify-center flex-1 ml-4">
            <span className={`text-2xl sm:text-4xl font-black ${colorClass}`}>
              {percentageValue}%
            </span>
          </div>
          
          {/* Trend indicator on the right */}
          <div className="flex flex-col items-end text-right flex-shrink-0 ml-4">
            {isAvgObject && (() => {
              const avg = value as AverageValue;
              if (avg.previous !== null && avg.previous !== undefined && avg.latest !== null && avg.latest !== undefined) {
                const delta = avg.latest - avg.previous;
                const up = delta >= 0;
                const trendColor = up ? 'text-emerald-600' : 'text-rose-600';
                const bgColor = up ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' : 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
                const arrow = up ? '↗' : '↘';
                return (
                  <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${bgColor} ${trendColor} shadow-sm`}>
                      <span className="text-xs font-bold">{arrow}</span>
                      <span className="text-xs font-bold">{Math.abs(Math.round(delta))}%</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">vs prev</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative p-1 sm:p-2 ${isClickable ? 'cursor-pointer' : ''}`} onClick={isClickable ? onClick : undefined}>
      {/* Premium gradient background with glass effect */}
      <div className="absolute inset-1 sm:inset-2 bg-gradient-to-br from-white/95 via-white/85 to-white/75 dark:from-slate-800/95 dark:via-slate-800/85 dark:to-slate-800/75 backdrop-blur-md rounded-full"></div>
      {/* Enhanced shadow layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/40 dark:from-slate-700/40 dark:via-transparent dark:to-slate-800/60 rounded-full shadow-2xl" 
           style={{ 
             boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)' 
           }}></div>
      
      <div className={`relative flex items-center justify-center gap-3 px-6 sm:px-8 rounded-full border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] group-hover:border-slate-300/80 dark:group-hover:border-slate-600/80 bg-white/50 dark:bg-slate-800/50 ${
        title === 'Total Submissions' || title === 'Stores Covered' 
          ? 'py-3 sm:py-4' 
          : 'py-4 sm:py-6'
      } ${isClickable ? 'hover:bg-white/70 dark:hover:bg-slate-800/70' : ''}`} 
           style={{ 
             minHeight: title === 'Total Submissions' || title === 'Stores Covered' ? '65px' : '80px',
             backdropFilter: 'blur(20px) saturate(180%)'
           }}>
        <div className="flex flex-col items-center text-center min-w-0 space-y-2">
          <span className={`leading-tight uppercase tracking-wider ${
            title === 'Total Submissions' || title === 'Stores Covered' 
              ? 'text-sm sm:text-base font-black text-slate-700 dark:text-slate-300' 
              : 'text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400'
          }`}>{title}</span>
          {isAvgObject ? (
            (() => {
              const avg = value as AverageValue;
              if (avg.latest !== undefined && avg.latest !== null) {
                return (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                      <TrendArrow latest={avg.latest as number} previous={avg.previous ?? null} />
                    </div>
                    {avg.previous !== null && avg.previous !== undefined && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">vs prev</div>
                    )}
                  </div>
                );
              }
              return <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{avg.aggregate ?? '—'}%</div>;
            })()
          ) : (
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{String(value ?? 'N/A')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
