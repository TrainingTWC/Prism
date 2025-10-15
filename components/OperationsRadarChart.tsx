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
import { AMOperationsSubmission } from '../services/dataService';
import ChartContainer from './ChartContainer';
import { useTheme } from '../contexts/ThemeContext';
import { getChartPaletteWithAlpha } from '../src/utils/chartColors';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface OperationsRadarChartProps {
  submissions: AMOperationsSubmission[];
}

// Section mapping for AM Operations
const AM_OPERATIONS_SECTIONS = [
  { id: 'CG', name: 'Customer Greeting', questions: 13 },
  { id: 'OTA', name: 'Order Taking Assistance', questions: 11 },
  { id: 'FAS', name: 'Friendly & Accurate Service', questions: 13 },
  { id: 'FWS', name: 'Feedback with Solution', questions: 13 },
  { id: 'ENJ', name: 'Enjoyable Experience', questions: 7 },
  { id: 'EX', name: 'Enthusiastic Exit', questions: 6 }
];

const OperationsRadarChart: React.FC<OperationsRadarChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  const chartData = useMemo(() => {
    console.log('Operations Radar Chart - Processing submissions:', submissions.length);
    
    if (submissions.length === 0) {
      console.log('Operations Radar Chart - No submissions available');
      return null;
    }

    // Group submissions by AM
    const amGroups: { [key: string]: AMOperationsSubmission[] } = {};
    submissions.forEach(submission => {
      const amId = submission.amId || 'Unknown';
      const amName = submission.amName || `AM ${amId}`;
      const amKey = `${amName}`;
      
      if (!amGroups[amKey]) {
        amGroups[amKey] = [];
      }
      amGroups[amKey].push(submission);
    });

    console.log('Operations Radar Chart - AM Groups:', Object.keys(amGroups), 'Total groups:', Object.keys(amGroups).length);

    // Process real data
    const amData = Object.entries(amGroups).map(([amName, amSubmissions]) => {
      const sectionScores = AM_OPERATIONS_SECTIONS.map(section => {
        const scores: number[] = [];
        
        amSubmissions.forEach(submission => {
          let sectionScore = 0;
          let answeredQuestions = 0;
          
          // Calculate section score based on responses
          for (let i = 1; i <= section.questions; i++) {
            const questionKey = `${section.id}_${i}`;
            const response = (submission as any)[questionKey];
            
            if (response !== undefined && response !== null && response !== '') {
              answeredQuestions++;
              // Binary scoring for operations (Yes=1, No=0)
              if (response.toString().toLowerCase() === 'yes' || 
                  response.toString().toLowerCase() === 'compliant' ||
                  response === '1' || response === 1 || response === 'true') {
                sectionScore++;
              }
            }
          }
          
          if (answeredQuestions > 0) {
            // Convert to scale of 0-5 (5 being 100%)
            const percentage = (sectionScore / section.questions) * 100;
            const scaledScore = (percentage / 100) * 5;
            scores.push(scaledScore);
          }
        });
        
        // Calculate average score for this section
        const avgScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
          : 2.5; // Default to middle if no valid responses
        
        return avgScore;
      });

      return {
        amName,
        scores: sectionScores,
        submissionCount: amSubmissions.length
      };
    });

    console.log('Operations Radar Chart - AM Data:', amData);

    // Get all AMs with at least 1 submission
    const validAMs = amData
      .filter(am => am.submissionCount >= 1)
      .sort((a, b) => b.submissionCount - a.submissionCount)
      .slice(0, 5);

    console.log('Operations Radar Chart - Valid AMs:', validAMs);

    if (validAMs.length === 0) return null;

    // Prepare chart data
    const labels = AM_OPERATIONS_SECTIONS.map(section => section.name);

    const palette = getChartPaletteWithAlpha(0.8);
    const borderPalette = getChartPaletteWithAlpha(1);

    const datasets = validAMs.map((am, index) => ({
      label: am.amName,
      data: am.scores,
      // Use semi-transparent background for fill and solid border for lines/points
      backgroundColor: (palette[index % palette.length] || 'rgba(59,130,246,0.8)').replace(/rgba\((\d+, \d+, \d+),\s*0?\.8\)/, 'rgba($1, 0.2)'),
      borderColor: borderPalette[index % borderPalette.length] || 'rgba(59,130,246,1)',
      borderWidth: 2,
      pointBackgroundColor: borderPalette[index % borderPalette.length] || 'rgba(59,130,246,1)',
      pointBorderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      pointHoverBackgroundColor: theme === 'dark' ? '#ffffff' : '#1e293b',
      pointHoverBorderColor: borderPalette[index % borderPalette.length] || 'rgba(59,130,246,1)',
    }));

    return {
      labels,
      datasets
    };
  }, [submissions, theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#e2e8f0' : '#334155',
          font: {
            size: 12
          }
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
            const percentage = (context.parsed.r / 5) * 100;
            return `${context.dataset.label}: ${percentage.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          color: theme === 'dark' ? '#64748b' : '#64748b',
          font: {
            size: 10
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
          font: {
            size: 11
          }
        }
      }
    }
  };

  if (!chartData) {
    return (
      <ChartContainer title="Operations Performance Radar (AM)">
        <div className="flex items-center justify-center h-64 text-slate-400">
          <p>No data available for radar chart</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title="Operations Performance Radar (AM)">
      <div className="h-96">
        <Radar data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
};

export default OperationsRadarChart;