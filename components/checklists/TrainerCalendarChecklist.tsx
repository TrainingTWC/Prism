import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import TrainingCalendar from './TrainingCalendar';

interface TrainerCalendarChecklistProps {
  userRole?: any;
  onStatsUpdate?: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

const TrainerCalendarChecklist: React.FC<TrainerCalendarChecklistProps> = ({ onBackToChecklists }) => {
  // Get trainer info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const trainerId = urlParams.get('trainerId') || urlParams.get('id') || urlParams.get('hrId') || '';
  const trainerName = urlParams.get('trainerName') || urlParams.get('name') || urlParams.get('hrName') || 'Trainer';

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 sm:p-6 border-b border-purple-400">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
            <span className="break-words">Trainer Calendar</span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
          Plan and manage monthly training schedules and activities.
        </p>
      </div>

      {/* Calendar Content */}
      <div className="p-4 h-[calc(100vh-200px)] overflow-auto">
        <TrainingCalendar 
          trainerId={trainerId} 
          trainerName={trainerName} 
        />
      </div>
    </>
  );
};

export default TrainerCalendarChecklist;
