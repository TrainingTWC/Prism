import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AMOperationsSubmission } from '../services/dataService';
import ChartContainer from './ChartContainer';
import { useTheme } from '../contexts/ThemeContext';
import { getChartPalette } from '../src/utils/chartColors';

interface OperationsScoreDistributionChartProps {
  submissions: AMOperationsSubmission[];
}

// const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const OperationsScoreDistributionChart: React.FC<OperationsScoreDistributionChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    const distribution = [
      { name: '0-20%', count: 0 },
      { name: '21-40%', count: 0 },
      { name: '41-60%', count: 0 },
      { name: '61-80%', count: 0 },
      { name: '81-100%', count: 0 },
    ];

    submissions.forEach(submission => {
      const score = parseFloat(submission.percentageScore || '0');
      if (score <= 20) distribution[0].count++;
      else if (score <= 40) distribution[1].count++;
      else if (score <= 60) distribution[2].count++;
      else if (score <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  }, [submissions]);

  // Theme-aware styling
  const chartStyles = {
    gridStroke: theme === 'dark' ? '#334155' : '#e2e8f0',
    tickFill: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#334155' : '#e2e8f0',
    tooltipColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    cursorFill: theme === 'dark' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(59, 130, 246, 0.1)'
  };

  return (
    <ChartContainer title="Operations Score Distribution">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
          <XAxis dataKey="name" tick={{ fill: chartStyles.tickFill }} />
          <YAxis tick={{ fill: chartStyles.tickFill }} />
          <Tooltip 
            cursor={{fill: chartStyles.cursorFill}}
            contentStyle={{ 
              backgroundColor: chartStyles.tooltipBg, 
              border: `1px solid ${chartStyles.tooltipBorder}`, 
              color: chartStyles.tooltipColor,
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="count" name="Submissions">
            {(() => {
              const palette = getChartPalette();
              return data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
              ));
            })()}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default OperationsScoreDistributionChart;