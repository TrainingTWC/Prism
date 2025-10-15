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
import { Submission } from '../types';
import { QUESTIONS } from '../constants';
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

interface AMRadarChartProps {
  submissions: Submission[];
}

const AMRadarChart: React.FC<AMRadarChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  const chartData = useMemo(() => {
    console.log('Radar Chart - Processing submissions:', submissions.length);
    
    if (submissions.length === 0) {
      console.log('Radar Chart - No submissions available');
      return null;
    }

    // Get scored questions only (exclude q10 and q11 which are text inputs)
    const scoredQuestions = QUESTIONS.filter(q => q.choices);
    console.log('Radar Chart - Scored questions:', scoredQuestions.map(q => q.id));
    
    // Group submissions by AM
    const amGroups: { [key: string]: Submission[] } = {};
    submissions.forEach(submission => {
      if (submission.amName && submission.amId) {
        const amKey = `${submission.amName}`;
        if (!amGroups[amKey]) {
          amGroups[amKey] = [];
        }
        amGroups[amKey].push(submission);
      }
    });

    console.log('Radar Chart - AM Groups:', Object.keys(amGroups), 'Total groups:', Object.keys(amGroups).length);

    // If no AM groups found, create sample data for demo
    if (Object.keys(amGroups).length === 0) {
      console.log('Radar Chart - No AM data found, creating sample data');
      
      const sampleAMs = ['Abhishek Vilas Satardekar', 'Ajay Hatimuria', 'Amar Debnath'];
      const sampleData = sampleAMs.map(amName => ({
        amName,
        scores: scoredQuestions.map(() => Math.random() * 3 + 2), // Random scores between 2-5
        submissionCount: Math.floor(Math.random() * 10) + 3
      }));
      
      const labels = scoredQuestions.map(q => {
        const title = q.title;
        if (title.length > 30) {
          return title.substring(0, 27) + '...';
        }
        return title;
      });

      const colors = [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Amber
      ];

      const datasets = sampleData.map((am, index) => ({
        label: am.amName,
        data: am.scores,
        backgroundColor: colors[index % colors.length].replace('0.8', '0.2'),
        borderColor: colors[index % colors.length],
        borderWidth: 2,
        pointBackgroundColor: colors[index % colors.length],
        pointBorderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        pointHoverBackgroundColor: theme === 'dark' ? '#ffffff' : '#1e293b',
        pointHoverBorderColor: colors[index % colors.length],
      }));

      return {
        labels,
        datasets
      };
    }

    // Process real data
    const amData = Object.entries(amGroups).map(([amName, amSubmissions]) => {
      const questionScores = scoredQuestions.map(question => {
        const questionResponses = amSubmissions
          .map(submission => {
            const response = (submission as any)[question.id];
            if (!response || !question.choices) return 0;
            
            // Find the choice that matches the response
            const choice = question.choices.find(c => 
              c.label.toLowerCase() === response.toLowerCase().trim()
            );
            return choice ? choice.score : 0;
          })
          .filter(score => score > 0);
        
        // Calculate average score for this question
        const avgScore = questionResponses.length > 0 
          ? questionResponses.reduce((sum, score) => sum + score, 0) / questionResponses.length 
          : 3; // Default to 3 if no valid responses
        
        return avgScore;
      });

      return {
        amName,
        scores: questionScores,
        submissionCount: amSubmissions.length
      };
    });

    console.log('Radar Chart - AM Data:', amData);

    // Get all AMs with at least 1 submission
    const validAMs = amData
      .filter(am => am.submissionCount >= 1)
      .sort((a, b) => b.submissionCount - a.submissionCount)
      .slice(0, 5);

    console.log('Radar Chart - Valid AMs:', validAMs);

    if (validAMs.length === 0) return null;

    // Prepare chart data
    const labels = scoredQuestions.map(q => {
      // Shorten question titles for better display
      const title = q.title;
      if (title.length > 40) {
        return title.substring(0, 37) + '...';
      }
      return title;
    });

      const palette = getChartPaletteWithAlpha(0.8);
      const borderPalette = getChartPaletteWithAlpha(1);

      const datasets = validAMs.map((am, index) => ({
        label: am.amName,
        data: am.scores,
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
            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}/5`;
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
      <ChartContainer title="AM Performance Radar">
        <div className="flex items-center justify-center h-64 text-slate-400">
          <p>No data available for radar chart</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title="AM Performance Radar">
      <div className="h-96">
        <Radar data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
};

export default AMRadarChart;