
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Submission } from '../types';
import ChartContainer from './ChartContainer';
import { useTheme } from '../contexts/ThemeContext';
import { getChartPalette } from '../src/utils/chartColors';

interface ScoreDistributionChartProps {
  submissions: Submission[];
}

// const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    const distribution = [
      { name: '0-1', count: 0 },
      { name: '1-2', count: 0 },
      { name: '2-3', count: 0 },
      { name: '3-4', count: 0 },
      { name: '4-5', count: 0 },
    ];

    submissions.forEach(s => {
      // Convert percentage to 1-5 scale
      const score = (s.percent / 100) * 5;
      if (score <= 1) distribution[0].count++;
      else if (score <= 2) distribution[1].count++;
      else if (score <= 3) distribution[2].count++;
      else if (score <= 4) distribution[3].count++;
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
    <ChartContainer title="Score Distribution">
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

export default ScoreDistributionChart;
