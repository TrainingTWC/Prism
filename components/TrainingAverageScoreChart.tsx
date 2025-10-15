import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrainingAuditSubmission } from '../services/dataService';
import ChartContainer from './ChartContainer';
import { useTheme } from '../contexts/ThemeContext';
import { getChartPaletteWithAlpha } from '../src/utils/chartColors';

interface TrainingAverageScoreChartProps {
  submissions: TrainingAuditSubmission[];
}

const TrainingAverageScoreChart: React.FC<TrainingAverageScoreChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    const scoresByTrainer: { [key: string]: { totalPercent: number, count: number } } = {};

    submissions.forEach(submission => {
      const trainerId = submission.trainerId || 'Unknown';
      const trainerName = submission.trainerName || `Trainer ${trainerId}`;
      
      if (!scoresByTrainer[trainerName]) {
        scoresByTrainer[trainerName] = { totalPercent: 0, count: 0 };
      }
      
      const score = parseFloat(submission.percentageScore || '0');
      if (!isNaN(score)) {
        scoresByTrainer[trainerName].totalPercent += score;
        scoresByTrainer[trainerName].count++;
      }
    });

    return Object.entries(scoresByTrainer)
      .map(([name, { totalPercent, count }]) => ({
        name: name.split(' ')[0], // Use first name for brevity
        averageScore: count > 0 ? Math.round(totalPercent / count) : 0,
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
    <ChartContainer title="Average Score by Trainer" loading={false}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: chartStyles.tickFill, fontSize: 12 }}
            axisLine={{ stroke: chartStyles.gridStroke }}
            tickLine={{ stroke: chartStyles.gridStroke }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fill: chartStyles.tickFill, fontSize: 12 }}
            axisLine={{ stroke: chartStyles.gridStroke }}
            tickLine={{ stroke: chartStyles.gridStroke }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: chartStyles.tooltipBg,
              border: `1px solid ${chartStyles.tooltipBorder}`,
              borderRadius: '8px',
              color: chartStyles.tooltipColor
            }}
            cursor={{ fill: chartStyles.cursorFill }}
            formatter={(value: number) => [`${value}%`, 'Average Score']}
          />
          <Bar dataKey="averageScore" fill={getChartPaletteWithAlpha(1)[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default TrainingAverageScoreChart;