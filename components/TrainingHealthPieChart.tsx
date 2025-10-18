import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrainingAuditSubmission } from '../services/dataService';

interface TrainingHealthPieChartProps {
  submissions: TrainingAuditSubmission[];
  onOpenDetails?: (filterType: 'region' | 'am' | 'trainer' | 'store' | 'hr' | 'scoreRange', value: string, title: string) => void;
}

const TrainingHealthPieChart: React.FC<TrainingHealthPieChartProps> = ({ submissions, onOpenDetails }) => {

  const propsOnOpen = (filterType: 'region' | 'am' | 'trainer' | 'store' | 'hr' | 'scoreRange', value: string, title: string) => {
    if (typeof onOpenDetails === 'function') onOpenDetails(filterType, value, title);
  };

  const healthData = useMemo(() => {
    if (!submissions.length) {
      return [
        { name: 'Needs Attention', value: 0, color: '#ef4444' },
        { name: 'Brewing', value: 0, color: '#f59e0b' },
        { name: 'Perfect Shot', value: 0, color: '#10b981' }
      ];
    }

    let needsAttention = 0;
    let brewing = 0;
    let perfectShot = 0;

    submissions.forEach(submission => {
      const percentage = parseFloat(submission.percentageScore || '0');
      
      if (percentage < 56) {
        needsAttention++;
      } else if (percentage >= 56 && percentage < 81) {
        brewing++;
      } else if (percentage >= 81 && percentage <= 100) {
        perfectShot++;
      }
    });

    // Use bright semantic red/yellow/green for store health (clickable)
    return [
      { name: 'Needs Attention', value: needsAttention, color: '#ef4444' }, // bright red
      { name: 'Brewing', value: brewing, color: '#f59e0b' }, // bright yellow/orange
      { name: 'Perfect Shot', value: perfectShot, color: '#10b981' } // bright green
    ];
  }, [submissions]);

  const totalSubmissions = healthData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="group relative p-1 sm:p-2 w-full">
      {/* Premium gradient background with glass effect */}
      <div className="absolute inset-1 sm:inset-2 bg-gradient-to-br from-white/95 via-white/85 to-white/75 dark:from-slate-800/95 dark:via-slate-800/85 dark:to-slate-800/75 backdrop-blur-md rounded-full"></div>
      {/* Enhanced shadow layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/40 dark:from-slate-700/40 dark:via-transparent dark:to-slate-800/60 rounded-full shadow-2xl" 
           style={{ 
             boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)' 
           }}></div>
      
      <div className="relative flex items-center justify-center gap-4 sm:gap-6 px-6 sm:px-8 py-4 sm:py-6 rounded-full border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] group-hover:border-slate-300/80 dark:group-hover:border-slate-600/80 bg-white/50 dark:bg-slate-800/50" 
           style={{ 
             minHeight: '80px',
             backdropFilter: 'blur(20px) saturate(180%)'
           }}>
        
        <div className="flex flex-col items-start text-left absolute left-6 sm:left-8">
          <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-wider">Store</span>
          <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-wider">Health</span>
        </div>
        
        {totalSubmissions > 0 ? (
          <>
            <div className="flex items-center justify-center flex-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%"
                      cy="50%"
                      innerRadius={14}
                      outerRadius={36}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {healthData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="white"
                          strokeWidth={1}
                          style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} 
                          onClick={() => propsOnOpen('scoreRange', '', entry.name)} 
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Legend with color keys and numbers - Vertical Layout */}
            <div className="flex flex-col items-start gap-1 sm:gap-1.5 absolute right-6 sm:right-8">
              {healthData.map((entry, index) => (
                <div 
                  key={entry.name}
                  className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-200 p-1 rounded-md hover:bg-slate-100/50 dark:hover:bg-slate-700/30"
                  onClick={() => propsOnOpen('scoreRange', '', entry.name)}
                  title={entry.name}
                >
                  <div 
                    className="w-3 h-3 rounded-full shadow-md border border-white/50 flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 min-w-0">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100">N/A</div>
        )}
      </div>
    </div>
  );
};

export default TrainingHealthPieChart;