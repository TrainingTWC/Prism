import React, { useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { QASubmission } from '../services/dataService';
import ChartContainer from './ChartContainer';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface QARadarChartProps {
  submissions: QASubmission[];
}

const QA_SECTIONS = [
  { id: 'ZT', name: 'Zero Tolerance', questions: 6, prefix: 'ZeroTolerance_ZT' },
  { id: 'M', name: 'Maintenance', questions: 11, prefix: 'Maintenance_M' },
  { id: 'SO', name: 'Store Operations', questions: 16, prefix: 'StoreOperations_SO' },
  { id: 'HC', name: 'Hygiene & Compliance', questions: 6, prefix: 'HygieneCompliance_HC' }
];

const QARadarChart: React.FC<QARadarChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  if (submissions.length === 0) {
    return (
      <ChartContainer title="QA Performance by Area Manager">
        <div className="flex items-center justify-center h-64 text-slate-400">
          <p>No data available for radar chart</p>
        </div>
      </ChartContainer>
    );
  }

  // Simple section-based data for now
  const sectionScores = QA_SECTIONS.map(section => {
    const sectionScores: number[] = [];
    
    submissions.forEach(submission => {
      for (let i = 1; i <= section.questions; i++) {
        const questionKey = `${section.prefix}_${i}`;
        const value = submission[questionKey];
        if (value !== undefined && value !== null && value !== '') {
          sectionScores.push(Number(value));
        }
      }
    });

    return sectionScores.length > 0 
      ? (sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length) * 100
      : 75;
  });

  const data = {
    labels: QA_SECTIONS.map(section => section.name),
    datasets: [
      {
        label: 'QA Performance',
        data: sectionScores,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        pointHoverBackgroundColor: theme === 'dark' ? '#ffffff' : '#1e293b',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#e2e8f0' : '#334155',
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        titleColor: theme === 'dark' ? '#e2e8f0' : '#334155',
        bodyColor: theme === 'dark' ? '#e2e8f0' : '#334155',
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: theme === 'dark' ? '#64748b' : '#64748b',
          callback: function(value: any) {
            return value + '%';
          }
        },
        grid: {
          color: theme === 'dark' ? '#334155' : '#e2e8f0',
        },
        angleLines: {
          color: theme === 'dark' ? '#334155' : '#e2e8f0',
        },
        pointLabels: {
          color: theme === 'dark' ? '#cbd5e1' : '#475569',
        }
      }
    }
  };

  return (
    <ChartContainer title="QA Performance by Section">
      <div className="h-96">
        <Radar data={data} options={options} />
      </div>
    </ChartContainer>
  );
};

export default QARadarChart;
