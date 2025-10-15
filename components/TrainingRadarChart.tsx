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
import { TrainingAuditSubmission } from '../services/dataService';
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

interface TrainingRadarChartProps {
  submissions: TrainingAuditSubmission[];
}

// Section mapping for Training Audit (matching the sections from TrainingChecklist.tsx)
const TRAINING_SECTIONS = [
  { id: 'TM', name: 'Training Materials', maxScore: 9 },
  { id: 'LMS', name: 'LMS Usage', maxScore: 10 },
  { id: 'Buddy', name: 'Buddy Trainer', maxScore: 10 },
  { id: 'NJ', name: 'New Joiner Training', maxScore: 10 },
  { id: 'PK', name: 'Partner Knowledge', maxScore: 15 },
  { id: 'TSA', name: 'TSA Assessment', maxScore: 30 },
  { id: 'CX', name: 'Customer Experience', maxScore: 9 },
  { id: 'AP', name: 'Action Plan', maxScore: 5 }
];

const TrainingRadarChart: React.FC<TrainingRadarChartProps> = ({ submissions }) => {
  const { theme } = useTheme();
  
  const chartData = useMemo(() => {
    console.log('Training Radar Chart - Processing submissions:', submissions.length);
    
    if (submissions.length === 0) {
      console.log('Training Radar Chart - No submissions available');
      return null;
    }

    // Group submissions by Trainer
    const groupedByTrainer: { [trainerId: string]: TrainingAuditSubmission[] } = {};
    
    submissions.forEach(submission => {
      const trainerId = submission.trainerId || submission.trainerName || 'Unknown';
      if (!groupedByTrainer[trainerId]) {
        groupedByTrainer[trainerId] = [];
      }
      groupedByTrainer[trainerId].push(submission);
    });

    // Calculate section averages for each trainer
    const trainerData = Object.entries(groupedByTrainer).map(([trainerId, trainerSubmissions]) => {
      const sectionAverages = TRAINING_SECTIONS.map(section => {
        const sectionScores: number[] = [];
        
        trainerSubmissions.forEach(submission => {
          let sectionScore = 0;
          let maxSectionScore = 0;
          
          // Calculate scores based on section questions
          if (section.id === 'TM') {
            // Training Materials questions: TM_1 to TM_9
            for (let i = 1; i <= 9; i++) {
              const response = submission[`TM_${i}`];
              if (response === 'yes') sectionScore += 1;
              if (response !== 'na') maxSectionScore += 1;
            }
          } else if (section.id === 'LMS') {
            // LMS questions: LMS_1 to LMS_3
            const responses = [
              { key: 'LMS_1', weight: 4, negWeight: -4 },
              { key: 'LMS_2', weight: 4, negWeight: -4 },
              { key: 'LMS_3', weight: 2 }
            ];
            responses.forEach(q => {
              const response = submission[q.key];
              if (response === 'yes') sectionScore += q.weight;
              else if (response === 'no' && q.negWeight) sectionScore += q.negWeight;
              if (response !== 'na') maxSectionScore += Math.abs(q.weight);
            });
          } else if (section.id === 'Buddy') {
            // Buddy questions: Buddy_1 to Buddy_6
            const weights = [2, 2, 1, 2, 2, 1];
            weights.forEach((weight, i) => {
              const response = submission[`Buddy_${i + 1}`];
              if (response === 'yes') sectionScore += weight;
              if (response !== 'na') maxSectionScore += weight;
            });
          } else if (section.id === 'NJ') {
            // New Joiner questions: NJ_1 to NJ_7
            const weights = [1, 1, 1, 1, 2, 2, 2];
            weights.forEach((weight, i) => {
              const response = submission[`NJ_${i + 1}`];
              if (response === 'yes') sectionScore += weight;
              if (response !== 'na') maxSectionScore += weight;
            });
          } else if (section.id === 'PK') {
            // Partner Knowledge questions: PK_1 to PK_7
            const weights = [2, 2, 2, 2, 2, 2, 3];
            const negWeights = [0, 0, 0, 0, 0, 0, -3];
            weights.forEach((weight, i) => {
              const response = submission[`PK_${i + 1}`];
              if (response === 'yes') sectionScore += weight;
              else if (response === 'no' && negWeights[i]) sectionScore += negWeights[i];
              if (response !== 'na') maxSectionScore += Math.abs(weight);
            });
          } else if (section.id === 'TSA') {
            // TSA questions: TSA_1 to TSA_3 (numeric 0-10 scores)
            for (let i = 1; i <= 3; i++) {
              const response = submission[`TSA_${i}`];
              const score = parseInt(response) || 0;
              sectionScore += score;
              maxSectionScore += 10;
            }
          } else if (section.id === 'CX') {
            // Customer Experience questions: CX_1 to CX_9
            const weights = [1, 1, 1, 1, 2, 1, 1, 1, 1];
            weights.forEach((weight, i) => {
              const response = submission[`CX_${i + 1}`];
              if (response === 'yes') sectionScore += weight;
              if (response !== 'na') maxSectionScore += weight;
            });
          } else if (section.id === 'AP') {
            // Action Plan questions: AP_1 to AP_3
            const responses = [
              { key: 'AP_1', weight: 1, negWeight: -1 },
              { key: 'AP_2', weight: 2 },
              { key: 'AP_3', weight: 2 }
            ];
            responses.forEach(q => {
              const response = submission[q.key];
              if (response === 'yes') sectionScore += q.weight;
              else if (response === 'no' && q.negWeight) sectionScore += q.negWeight;
              if (response !== 'na') maxSectionScore += Math.abs(q.weight);
            });
          }
          
          // Convert to percentage
          const percentage = maxSectionScore > 0 ? (sectionScore / maxSectionScore) * 100 : 0;
          sectionScores.push(Math.max(0, percentage)); // Ensure non-negative
        });
        
        return sectionScores.length > 0 ? sectionScores.reduce((a, b) => a + b) / sectionScores.length : 0;
      });
      
      const trainerName = trainerSubmissions[0]?.trainerName || `Trainer ${trainerId}`;
      return {
        trainerId,
        trainerName: trainerName.split(' ')[0], // Use first name for brevity
        data: sectionAverages
      };
    });

    // Get all trainers sorted by average score
    const allTrainers = trainerData
      .map(trainer => ({
        ...trainer,
        averageScore: trainer.data.reduce((a, b) => a + b) / trainer.data.length
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    console.log('Training Radar Chart - All trainers:', allTrainers.length);

    const labels = TRAINING_SECTIONS.map(section => section.name);
    
    const palette = getChartPaletteWithAlpha(0.6);
    const solidPalette = getChartPaletteWithAlpha(1);

    const datasets = allTrainers.map((trainer, index) => ({
      label: trainer.trainerName,
      data: trainer.data,
      backgroundColor: palette[index % palette.length],
      borderColor: solidPalette[index % solidPalette.length],
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: solidPalette[index % solidPalette.length],
    }));

    return {
      labels,
      datasets
    };
  }, [submissions]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        titleColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
        bodyColor: theme === 'dark' ? '#cbd5e1' : '#475569',
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${Math.round(context.parsed.r)}%`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          font: {
            size: 10
          },
          stepSize: 20
        },
        grid: {
          color: theme === 'dark' ? '#334155' : '#e2e8f0',
        },
        pointLabels: {
          color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
          font: {
            size: 11
          }
        }
      }
    }
  }), [theme]);

  if (!chartData) {
    return (
      <ChartContainer title="Training Performance Radar (All Trainers)">
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-500">No training data available</p>
        </div>
    </ChartContainer>
  );
};

  return (
    <ChartContainer title="Training Performance Radar (All Trainers)">
      <div style={{ height: '400px' }}>
        <Radar data={chartData} options={options} />
      </div>
    </ChartContainer>
  );
};

export default TrainingRadarChart;