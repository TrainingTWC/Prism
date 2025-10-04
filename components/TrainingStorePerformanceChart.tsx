import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrainingAuditSubmission } from '../services/dataService';
import ChartContainer from './ChartContainer';
import { useTheme } from '../contexts/ThemeContext';

interface TrainingStorePerformanceChartProps {
  submissions: TrainingAuditSubmission[];
  onStoreClick?: (storeId: string, storeName: string) => void;
}

const TrainingStorePerformanceChart: React.FC<TrainingStorePerformanceChartProps> = ({ 
  submissions, 
  onStoreClick 
}) => {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    const storeScores: { [key: string]: { totalScore: number, maxScore: number, count: number, storeName: string, region: string } } = {};

    submissions.forEach(submission => {
      const storeId = submission.storeId || 'Unknown';
      const storeName = submission.storeName || `Store ${storeId}`;
      const region = submission.region || 'Unknown';
      
      if (!storeScores[storeId]) {
        storeScores[storeId] = { 
          totalScore: 0, 
          maxScore: 0, 
          count: 0, 
          storeName: storeName,
          region: region
        };
      }
      
      const totalScore = parseFloat(submission.totalScore || '0');
      const maxScore = parseFloat(submission.maxScore || '0');
      
      if (!isNaN(totalScore) && !isNaN(maxScore)) {
        storeScores[storeId].totalScore += totalScore;
        storeScores[storeId].maxScore += maxScore;
        storeScores[storeId].count++;
      }
    });

    const storeData = Object.entries(storeScores)
      .map(([storeId, data]) => {
        const averagePercentage = data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0;
        const averageScore = data.count > 0 ? Math.round(data.totalScore / data.count) : 0;
        const averageMaxScore = data.count > 0 ? Math.round(data.maxScore / data.count) : 0;
        
        return {
          storeId,
          storeName: data.storeName,
          region: data.region,
          averageScore,
          averageMaxScore,
          averagePercentage,
          auditCount: data.count
        };
      })
      .filter(store => store.auditCount > 0)
      .sort((a, b) => b.averagePercentage - a.averagePercentage)
      .slice(0, 15); // Show top 15 performing stores

    return storeData;
  }, [submissions]);

  // Theme-aware styling
  const chartStyles = {
    gridStroke: theme === 'dark' ? '#334155' : '#e2e8f0',
    tickFill: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#334155' : '#e2e8f0',
    tooltipColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    cursorFill: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)'
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="p-3 rounded-lg border shadow-lg"
          style={{
            backgroundColor: chartStyles.tooltipBg,
            borderColor: chartStyles.tooltipBorder,
            color: chartStyles.tooltipColor
          }}
        >
          <p className="font-semibold">{data.storeName}</p>
          <p className="text-sm opacity-75">{data.region} • Store ID: {data.storeId}</p>
          <p className="text-sm">
            <span className="font-medium">Training Score: {data.averagePercentage}%</span>
          </p>
          <p className="text-sm">
            <span className="opacity-75">Average: {data.averageScore}/{data.averageMaxScore}</span>
          </p>
          <p className="text-sm">
            <span className="opacity-75">Audits Conducted: {data.auditCount}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer title="Training Store Performance (Top 15)" loading={false}>
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Stores ranked by average training audit score percentage
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
          <XAxis 
            dataKey="storeName"
            tick={{ fill: chartStyles.tickFill, fontSize: 10 }}
            axisLine={{ stroke: chartStyles.gridStroke }}
            tickLine={{ stroke: chartStyles.gridStroke }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fill: chartStyles.tickFill, fontSize: 12 }}
            axisLine={{ stroke: chartStyles.gridStroke }}
            tickLine={{ stroke: chartStyles.gridStroke }}
            label={{ 
              value: 'Training Score %', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: chartStyles.tickFill }
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: chartStyles.cursorFill }} />
          <Bar 
            dataKey="averagePercentage" 
            fill="#8b5cf6" 
            radius={[4, 4, 0, 0]}
            name="Training Score %"
            onClick={(data) => {
              if (onStoreClick && data) {
                onStoreClick(data.storeId, data.storeName);
              }
            }}
            style={{ cursor: onStoreClick ? 'pointer' : 'default' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default TrainingStorePerformanceChart;