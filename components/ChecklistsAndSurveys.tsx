import React, { useState, useEffect } from 'react';
import { Users, Settings, GraduationCap, CheckCircle, DollarSign, ArrowLeft, Home } from 'lucide-react';
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
  const [activeChecklist, setActiveChecklist] = useState<ChecklistType | null>(null);
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
    { id: 'hr' as ChecklistType, label: 'HR', icon: Users, color: 'bg-blue-500' },
    { id: 'operations' as ChecklistType, label: 'Operations', icon: Settings, color: 'bg-green-500' },
    { id: 'training' as ChecklistType, label: 'Training', icon: GraduationCap, color: 'bg-purple-500' },
    { id: 'qa' as ChecklistType, label: 'QA', icon: CheckCircle, color: 'bg-orange-500' },
    { id: 'finance' as ChecklistType, label: 'Finance', icon: DollarSign, color: 'bg-red-500' }
  ];

  const updateChecklistStats = (type: ChecklistType, stats: { completed: number; total: number; score: number }) => {
    setChecklistStats(prev => ({
      ...prev,
      [type]: stats
    }));
  };

  const getChecklistLabel = (type: ChecklistType) => {
    const checklist = checklists.find(c => c.id === type);
    return checklist?.label || '';
  };

  const handleBackToOverview = () => {
    setActiveChecklist(null);
  };

  const renderActiveChecklist = () => {
    if (!activeChecklist) return null;

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
    <>
      {/* Fullscreen Checklist View */}
      {activeChecklist && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Header with Breadcrumb */}
          <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToOverview}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Back to checklists overview"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </button>
                
                <nav className="flex items-center space-x-2 text-sm">
                  <button
                    onClick={handleBackToOverview}
                    className="flex items-center space-x-1 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Checklists</span>
                  </button>
                  <span className="text-gray-400 dark:text-slate-500">/</span>
                  <span className="text-gray-900 dark:text-slate-100 font-medium">
                    {getChecklistLabel(activeChecklist)}
                  </span>
                </nav>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-slate-400">
                {checklistStats[activeChecklist].completed}/{checklistStats[activeChecklist].total} completed
              </div>
            </div>
          </div>

          {/* Checklist Content */}
          <div className="h-full overflow-y-auto pb-20">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
              {renderActiveChecklist()}
            </div>
          </div>
        </div>
      )}

      {/* Checklists Overview */}
      {!activeChecklist && (
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

          {/* Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {checklists.map(checklist => {
              const stats = checklistStats[checklist.id];
              const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
              const IconComponent = checklist.icon;
              
              return (
                <button
                  key={checklist.id}
                  onClick={() => setActiveChecklist(checklist.id)}
                  className="group p-6 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-400 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 text-left"
                >
                  <div className="flex flex-col h-full">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${checklist.color} text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                      {checklist.label}
                    </h3>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-slate-400">Progress</span>
                        <span className={`font-medium ${getCompletionColor(stats.completed, stats.total)}`}>
                          {stats.completed}/{stats.total}
                        </span>
                      </div>
                      
                      {stats.total > 0 && (
                        <>
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                completionPercentage < 50 ? 'bg-red-500' :
                                completionPercentage < 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-slate-400">Score</span>
                            <span className={`font-medium ${getScoreColor(stats.score)}`}>
                              {stats.score.toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                      <span className="text-sm text-sky-600 dark:text-sky-400 font-medium group-hover:text-sky-700 dark:group-hover:text-sky-300">
                        Open Checklist →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default ChecklistsAndSurveys;