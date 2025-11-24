
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Submission } from '../types';
import ChartContainer from './ChartContainer';
import { useTheme } from '../contexts/ThemeContext';
import { getChartPaletteWithAlpha } from '../src/utils/chartColors';

interface AverageScoreByManagerChartProps {
  submissions: Submission[];
}

const AverageScoreByManagerChart: React.FC<AverageScoreByManagerChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    const scoresByManager: { [key: string]: { totalPercent: number, count: number } } = {};

    submissions.forEach(s => {
      if (!scoresByManager[s.amName]) {
        scoresByManager[s.amName] = { totalPercent: 0, count: 0 };
      }
      scoresByManager[s.amName].totalPercent += s.percent;
      scoresByManager[s.amName].count++;
    });

    return Object.entries(scoresByManager)
      .map(([name, { totalPercent, count }]) => ({
        name: name, // Use full name for better visibility
        averageScore: parseFloat(((totalPercent / count / 100) * 5).toFixed(1)), // Convert to 1-5 scale
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
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
    <ChartContainer title="Average Score by Area Manager">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
          <XAxis type="number" domain={[0, 5]} tick={{ fill: chartStyles.tickFill }} />
          <YAxis dataKey="name" type="category" width={100} tick={{ fill: chartStyles.tickFill, fontSize: 12 }} />
          <Tooltip 
            cursor={{fill: chartStyles.cursorFill}}
            contentStyle={{ 
              backgroundColor: chartStyles.tooltipBg, 
              border: `1px solid ${chartStyles.tooltipBorder}`, 
              color: chartStyles.tooltipColor,
              borderRadius: '8px'
            }}
            formatter={(value) => `${value}/5`}
          />
          <Bar dataKey="averageScore" fill={getChartPaletteWithAlpha(1)[3]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default AverageScoreByManagerChart;
