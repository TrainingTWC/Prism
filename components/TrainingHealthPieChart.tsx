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
    <div className="group p-1 sm:p-2 w-full h-full">
      {/* Pill container - left label, centered pie, right legend */}
      <div
        className="relative flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 shadow-lg transition-all duration-200 hover:shadow-2xl h-full"
        style={{ backdropFilter: 'blur(14px) saturate(160%)', minHeight: 60 }}
      >
        {/* Left: Label */}
        <div className="flex-shrink-0 w-20 sm:w-24 text-left">
          <div className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight">Store</div>
          <div className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight">Health</div>
        </div>

        {/* Center: Pie chart (flexible) */}
        <div className="flex-1 flex items-center justify-center">
          {totalSubmissions > 0 ? (
            <div className="w-12 h-12 sm:w-14 sm:h-14">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={10}
                    outerRadius={24}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={1}
                        style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}
                        onClick={() => propsOnOpen('scoreRange', '', entry.name)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">N/A</div>
          )}
        </div>

        {/* Right: Legend - order fixed to green, yellow, red to match design */}
        <div className="flex-shrink-0 w-24 sm:w-28 flex flex-col items-start gap-1">
          {[
            // Perfect Shot (green), Brewing (yellow), Needs Attention (red)
            healthData.find(h => h.name === 'Perfect Shot'),
            healthData.find(h => h.name === 'Brewing'),
            healthData.find(h => h.name === 'Needs Attention')
          ].map((entry) => (
            entry && (
              <button
                key={entry.name}
                onClick={() => propsOnOpen('scoreRange', '', entry.name)}
                className="flex items-center gap-2 text-left transition-transform duration-150 hover:scale-105 p-0.5 rounded-md"
                title={entry.name}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">{entry.value}</span>
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingHealthPieChart;