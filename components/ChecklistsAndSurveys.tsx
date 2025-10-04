import React, { useState, useEffect } from 'react';
import { UserRole } from '../roleMapping';
import HRChecklist from './checklists/HRChecklist';
import OperationsChecklist from './checklists/OperationsChecklist';
import TrainingChecklist from './checklists/TrainingChecklist';
import QAChecklist from './checklists/QAChecklist';
import FinanceChecklist from './checklists/FinanceChecklist';

interface ChecklistsAndSurveysProps {
  userRole: UserRole;
}

type ChecklistType = 'hr' | 'operations' | 'training' | 'qa' | 'finance';

const ChecklistsAndSurveys: React.FC<ChecklistsAndSurveysProps> = ({ userRole }) => {
  const [activeChecklist, setActiveChecklist] = useState<ChecklistType>('hr');
  const [checklistStats, setChecklistStats] = useState({
    hr: { completed: 0, total: 0, score: 0 },
    operations: { completed: 0, total: 0, score: 0 },
    training: { completed: 0, total: 0, score: 0 },
    qa: { completed: 0, total: 0, score: 0 },
    finance: { completed: 0, total: 0, score: 0 }
  });

  // Get auditor info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const auditorName = urlParams.get('auditorName') || urlParams.get('name') || urlParams.get('hrName') || 'Unknown Auditor';
  const auditorId = urlParams.get('auditorId') || urlParams.get('id') || urlParams.get('hrId') || 'unknown';

  const checklists = [
    { id: 'hr' as ChecklistType, label: 'HR', icon: '👥', color: 'bg-blue-500' },
    { id: 'operations' as ChecklistType, label: 'Operations', icon: '⚙️', color: 'bg-green-500' },
    { id: 'training' as ChecklistType, label: 'Training', icon: '📚', color: 'bg-purple-500' },
    { id: 'qa' as ChecklistType, label: 'QA', icon: '✅', color: 'bg-orange-500' },
    { id: 'finance' as ChecklistType, label: 'Finance', icon: '💰', color: 'bg-red-500' }
  ];

  const updateChecklistStats = (type: ChecklistType, stats: { completed: number; total: number; score: number }) => {
    setChecklistStats(prev => ({
      ...prev,
      [type]: stats
    }));
  };

  const renderActiveChecklist = () => {
    const commonProps = {
      userRole,
      onStatsUpdate: (stats: { completed: number; total: number; score: number }) => 
        updateChecklistStats(activeChecklist, stats)
    };

    switch (activeChecklist) {
      case 'hr':
        return <HRChecklist {...commonProps} />;
      case 'operations':
        return <OperationsChecklist {...commonProps} />;
      case 'training':
        return <TrainingChecklist {...commonProps} />;
      case 'qa':
        return <QAChecklist {...commonProps} />;
      case 'finance':
        return <FinanceChecklist {...commonProps} />;
      default:
        return <HRChecklist {...commonProps} />;
    }
  };

  const getCompletionColor = (completed: number, total: number) => {
    if (total === 0) return 'text-gray-400';
    const percentage = (completed / total) * 100;
    if (percentage < 50) return 'text-red-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getScoreColor = (score: number) => {
    if (score < 70) return 'text-red-500';
    if (score < 90) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          Checklists & Surveys
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Complete departmental checklists and track compliance scores across all areas.
        </p>
      </div>

      {/* Checklist Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {checklists.map(checklist => {
            const stats = checklistStats[checklist.id];
            const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
            
            return (
              <button
                key={checklist.id}
                onClick={() => setActiveChecklist(checklist.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  activeChecklist === checklist.id
                    ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${checklist.color} text-white text-xl mb-3`}>
                    {checklist.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    {checklist.label}
                  </h3>
                  <div className="text-xs space-y-1">
                    <div className={`${getCompletionColor(stats.completed, stats.total)}`}>
                      {stats.completed}/{stats.total} items
                    </div>
                    {stats.total > 0 && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              completionPercentage < 50 ? 'bg-red-500' :
                              completionPercentage < 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className={`${getScoreColor(stats.score)}`}>
                          Score: {stats.score.toFixed(1)}%
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Checklist */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        {renderActiveChecklist()}
      </div>
    </div>
  );
};

export default ChecklistsAndSurveys;