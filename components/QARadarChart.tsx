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
  { id: 'ZeroTolerance', name: 'Zero Tolerance', questions: 6, prefix: 'ZT' },
  { id: 'Store', name: 'Store', questions: 94, prefix: 'S' },
  { id: 'A', name: 'QA', questions: 3, prefix: 'A' },
  { id: 'Maintenance', name: 'Maintenance', questions: 11, prefix: 'M' },
  { id: 'HR', name: 'HR', questions: 2, prefix: 'HR' }
];

const QARadarChart: React.FC<QARadarChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  if (submissions.length === 0) {
    return (
      <ChartContainer title="QA Performance by Area Manager">
        <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
          <p>No data available for radar chart</p>
        </div>
      </ChartContainer>
    );
  }

  // Calculate section scores based on actual response data
  const sectionScores = QA_SECTIONS.map(section => {
    console.log(`\n=== Processing Radar Chart: ${section.name} ===`);
    
    // Find all fields that match this section prefix
    const sectionFields = submissions.length > 0 
      ? Object.keys(submissions[0]).filter(key => {
          // Match format like "S_1: Description" or "ZT_1: Description"
          const match = key.match(new RegExp(`^${section.prefix}_(\\d+):`));
          if (match) {
            console.log(`  ✓ Matched field: ${key}`);
            return true;
          }
          return false;
        })
      : [];
    
    console.log(`  Total fields for ${section.name}: ${sectionFields.length}`);
    
    let totalScore = 0;
    let maxScore = 0;
    
    submissions.forEach((submission, idx) => {
      console.log(`  Submission ${idx + 1}:`);
      
      sectionFields.forEach(field => {
        const value = submission[field];
        const response = typeof value === 'string' ? value.toLowerCase().trim() : '';
        
        console.log(`    ${field}: ${response}`);
        
        if (response !== 'na' && response !== '') {
          maxScore += 1;
          
          if (response === 'compliant') {
            totalScore += 1;
          } else if (response === 'partially-compliant') {
            totalScore += 0.5;
          }
          // not-compliant contributes 0
        }
      });
    });
    
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    console.log(`  ${section.name} Final: ${totalScore}/${maxScore} = ${percentage.toFixed(1)}%`);
    
    return percentage;
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
