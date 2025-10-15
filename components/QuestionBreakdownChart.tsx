
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, PieLabelRenderProps } from 'recharts';
import { Submission, Question } from '../types';
import ChartContainer from './ChartContainer';
import { useTheme } from '../contexts/ThemeContext';

interface QuestionBreakdownChartProps {
  submissions: Submission[];
  question: Question;
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444'];

const QuestionBreakdownChart: React.FC<QuestionBreakdownChartProps> = ({ submissions, question }) => {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    if (!question.choices) return [];
    
    const answerCounts: { [key: string]: number } = {};
    question.choices.forEach(c => answerCounts[c.label] = 0);

    submissions.forEach(s => {
      const answer = (s as any)[question.id];
      if (answerCounts[answer] !== undefined) {
        answerCounts[answer]++;
      }
    });

    return Object.entries(answerCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => {
        const orderA = question.choices?.find(c => c.label === a.name)?.score ?? 0;
        const orderB = question.choices?.find(c => c.label === b.name)?.score ?? 0;
        return orderB - orderA;
      });

  }, [submissions, question]);
  
  // Theme-aware styling
  const chartStyles = {
    tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#334155' : '#e2e8f0',
    tooltipColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    legendColor: theme === 'dark' ? '#94a3b8' : '#64748b',
    labelFill: theme === 'dark' ? 'white' : '#1e293b'
  };
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props as any;
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill={chartStyles.labelFill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-semibold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
  };

  if (!question.choices) return null;

  return (
    <ChartContainer title={`Breakdown: "${question.title}"`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: chartStyles.tooltipBg, 
              border: `1px solid ${chartStyles.tooltipBorder}`, 
              color: chartStyles.tooltipColor,
              borderRadius: '8px'
            }}
          />
          <Legend iconType="circle" wrapperStyle={{color: chartStyles.legendColor}}/>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={'80%'}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default QuestionBreakdownChart;
