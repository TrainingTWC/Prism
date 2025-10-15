import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrainingAuditSubmission } from '../services/dataService';
import { useTheme } from '../contexts/ThemeContext';
import { getChartPalette } from '../src/utils/chartColors';

interface TrainingHealthPieChartProps {
  submissions: TrainingAuditSubmission[];
}

const TrainingHealthPieChart: React.FC<TrainingHealthPieChartProps> = ({ submissions }) => {
  const { theme } = useTheme();

  const healthData = useMemo(() => {
    if (!submissions.length) {
      const palette = getChartPalette();
      return [
        { name: 'Needs Attention', value: 0, color: palette[0] || '#ef4444' },
        { name: 'Brewing', value: 0, color: palette[1] || '#f59e0b' },
        { name: 'Perfect Shot', value: 0, color: palette[2] || '#10b981' }
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

    // Use pastel red/yellow/green for clear semantics on the store health pie
    return [
      { name: 'Needs Attention', value: needsAttention, color: '#FCA5A5' }, // pastel red
      { name: 'Brewing', value: brewing, color: '#FDE68A' }, // pastel yellow
      { name: 'Perfect Shot', value: perfectShot, color: '#86EFAC' } // pastel green
    ];
  }, [submissions]);

  const totalSubmissions = healthData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalSubmissions > 0 ? ((data.value / totalSubmissions) * 100).toFixed(1) : '0';
      return (
        <div 
          className="p-2 rounded-lg border shadow-lg text-xs"
          style={{
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
          }}
        >
          <p className="font-semibold">{data.name}</p>
          <p>{data.value} audits ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 h-32">
      <div className="flex items-center h-full">
        {/* Left side - Title */}
        <div className="flex-shrink-0 w-20">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-tight">
            STORE<br />HEALTH
          </h3>
        </div>
        
        {totalSubmissions > 0 ? (
          <>
            {/* Pie Chart - positioned more to the left */}
            <div className="flex-shrink-0 w-16 h-16 ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={28}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend - with more spacing */}
            <div className="flex-1 flex flex-col justify-center gap-1 ml-6 min-w-0">
              {healthData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-xs text-gray-700 dark:text-slate-300 truncate">
                    {entry.name}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-slate-100 ml-auto">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">No data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingHealthPieChart;