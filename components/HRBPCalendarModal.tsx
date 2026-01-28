import React, { useMemo, useState } from 'react';
import { Submission } from '../types';

interface HRBPCalendarModalProps {
  hrbp: { id: string; name: string };
  submissions: Submission[];
  onClose: () => void;
}

interface DayData {
  date: Date;
  count: number;
  submissions: Submission[];
  avgScore: number;
}

const HRBPCalendarModal: React.FC<HRBPCalendarModalProps> = ({ hrbp, submissions, onClose }) => {
  // Initialize selectedMonth to the most recent month with submissions
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Find all submissions for this HRBP
    const hrbpSubs = submissions.filter(sub => sub.hrId === hrbp.id);
    
    if (hrbpSubs.length === 0) {
      return new Date(); // Default to current month if no submissions
    }
    
    // Parse dates and find the most recent one
    let mostRecentDate = null;
    hrbpSubs.forEach(sub => {
      try {
        let date = null;
        if (sub.submissionTime.includes('T') && sub.submissionTime.match(/^\d{4}-\d{2}-\d{2}T/)) {
          const [datePart] = sub.submissionTime.split('T');
          const [year, month, day] = datePart.split('-');
          date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        } else if (sub.submissionTime.includes('/')) {
          const parts = sub.submissionTime.split(',')[0].trim().split(' ')[0].split('/');
          if (parts.length === 3) {
            // M/D/YYYY format (American format)
            const month = parseInt(parts[0], 10) - 1;
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            date = new Date(year, month, day);
          }
        }
        
        if (date && !isNaN(date.getTime())) {
          if (!mostRecentDate || date > mostRecentDate) {
            mostRecentDate = date;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    // Return the first day of the most recent month with data
    if (mostRecentDate) {
      return new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1);
    }
    
    return new Date(); // Fallback to current month
  });
  
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Parse submission date from string format (DD/MM/YYYY, HH:MM:SS or DD-MM-YYYY ISO-like)
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    try {
      // Handle ISO format YYYY-MM-DD (standard format)
      if (dateStr.includes('T') && dateStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const [datePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-');
        
        // ISO format is YYYY-MM-DD
        const actualYear = parseInt(year, 10);
        const actualMonth = parseInt(month, 10) - 1; // JS months are 0-based
        const actualDay = parseInt(day, 10);
        
        return new Date(actualYear, actualMonth, actualDay);
      }
      
      // Regular ISO format (if it follows standard YYYY-MM-DD)
      if (dateStr.includes('T') && dateStr.match(/^\d{4}-\d{2}-\d{2}T/) && false) { // Disabled for now
        return new Date(dateStr);
      }
      
      // DD/MM/YYYY format
      const parts = dateStr.split(',')[0].trim().split(' ')[0].split('/');
      if (parts.length === 3) {
        // Google Sheets uses M/D/YYYY format (American format)
        // So 9/25/2025 means September 25, 2025
        const month = parseInt(parts[0], 10) - 1; // First part is month (0-based for JS)
        const day = parseInt(parts[1], 10);         // Second part is day
        const year = parseInt(parts[2], 10);        // Third part is year
        
        return new Date(year, month, day);
      }
      
      return new Date(dateStr);
    } catch (error) {
      return null;
    }
  };

  // Filter submissions for this HRBP
  const hrbpSubmissions = useMemo(() => {
    return submissions.filter(sub => sub.hrId === hrbp.id);
  }, [submissions, hrbp.id]);

  // Group submissions by date
  const submissionsByDate = useMemo(() => {
    const grouped = new Map<string, DayData>();
    
    hrbpSubmissions.forEach(sub => {
      const date = parseDate(sub.submissionTime);
      if (!date) return;
      
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: date,
          count: 0,
          submissions: [],
          avgScore: 0
        });
      }
      
      const dayData = grouped.get(dateKey)!;
      dayData.count++;
      dayData.submissions.push(sub);
    });
    
    // Calculate average scores
    grouped.forEach(dayData => {
      const totalScore = dayData.submissions.reduce((sum, sub) => sum + (sub.percent || 0), 0);
      dayData.avgScore = dayData.count > 0 ? Math.round(totalScore / dayData.count) : 0;
    });
    

    
    return grouped;
  }, [hrbpSubmissions, hrbp.name]);

  // Generate calendar days for the selected month
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (DayData | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${year}-${month}-${day}`;
      const dayData = submissionsByDate.get(dateKey);
      
      if (dayData) {
        days.push(dayData);
      } else {
        days.push({
          date: date,
          count: 0,
          submissions: [],
          avgScore: 0
        });
      }
    }
    
    return days;
  }, [selectedMonth, submissionsByDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    
    // Prevent navigating to future months
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // If trying to navigate to a future month, don't allow it
    if (newDate > currentMonthStart) {
      return;
    }
    
    setSelectedMonth(newDate);
    setSelectedDay(null);
  };

  const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Check if we're at the current month (to disable "next month" button)
  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return selectedMonth.getFullYear() === today.getFullYear() && 
           selectedMonth.getMonth() === today.getMonth();
  }, [selectedMonth]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {hrbp.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                Day-wise Survey Activity
              </p>
              {/* Quick navigation to current month */}
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
                className="text-xs mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                Go to Current Month
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {monthName}
            </h3>
            
            <button
              onClick={() => changeMonth(1)}
              disabled={isCurrentMonth}
              className={`p-2 rounded-lg transition-colors ${
                isCurrentMonth 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mb-4 sm:mb-6">
            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-slate-400 py-1 sm:py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((dayData, index) => {
                if (!dayData) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const isToday = dayData.date.toDateString() === new Date().toDateString();
                const hasData = dayData.count > 0;
                const isSelected = selectedDay?.date.toDateString() === dayData.date.toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => hasData ? setSelectedDay(dayData) : null}
                    className={`aspect-square rounded-lg p-1 sm:p-2 text-sm transition-all relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 dark:ring-indigo-700'
                        : hasData
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer'
                        : 'bg-gray-50 dark:bg-slate-700/30 text-gray-400 dark:text-slate-500'
                    } ${isToday && !isSelected ? 'ring-2 ring-indigo-400 dark:ring-indigo-600' : ''}`}
                    disabled={!hasData}
                  >
                    {/* Date in top-right corner */}
                    <div className="absolute top-0.5 right-1 sm:top-1 sm:right-2 text-xs sm:text-base font-semibold">
                      {dayData.date.getDate()}
                    </div>
                    
                    {/* Centered submission count and label */}
                    {hasData && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-xl sm:text-3xl font-bold leading-none">
                          {dayData.count}
                        </div>
                        <div className="text-[8px] sm:text-[10px] font-medium mt-0.5 sm:mt-1 opacity-75">
                          surveys
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Details */}
          {selectedDay && selectedDay.count > 0 && (
            <div className="bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {selectedDay.date.toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">Surveys</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {selectedDay.count}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">Avg Score</div>
                  <div className={`text-xl sm:text-2xl font-bold mt-1 ${
                    selectedDay.avgScore >= 80 ? 'text-green-600 dark:text-green-400' :
                    selectedDay.avgScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedDay.avgScore}%
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">Stores</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {new Set(selectedDay.submissions.map(s => s.storeID)).size}
                  </div>
                </div>
              </div>

              {/* Submission List */}
              <div className="space-y-2">
                <h5 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 sm:mb-3">
                  Survey Details
                </h5>
                <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2">
                  {selectedDay.submissions.map((sub, idx) => {
                    // Parse and format the date/time
                    let formattedDateTime = 'Date N/A';
                    try {
                      const parsedDate = parseDate(sub.submissionTime);
                      if (parsedDate && !isNaN(parsedDate.getTime())) {
                        formattedDateTime = parsedDate.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        });
                        
                        // Try to extract time if available in original string
                        if (sub.submissionTime.includes(',')) {
                          const timePart = sub.submissionTime.split(',')[1]?.trim();
                          if (timePart) {
                            formattedDateTime += ` • ${timePart}`;
                          }
                        } else if (sub.submissionTime.includes('T')) {
                          // ISO format with time
                          const timeMatch = sub.submissionTime.match(/T(\d{2}):(\d{2})/);
                          if (timeMatch) {
                            formattedDateTime += ` • ${timeMatch[1]}:${timeMatch[2]}`;
                          }
                        }
                      }
                    } catch (e) {
                      formattedDateTime = sub.submissionTime || 'Date N/A';
                    }
                    
                    return (
                      <div 
                        key={idx}
                        className="bg-white dark:bg-slate-800 rounded-lg p-2 sm:p-3 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                            {sub.storeName || 'Unknown Store'}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">
                            {formattedDateTime}
                          </div>
                        </div>
                        <div className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full flex-shrink-0 ml-2 ${
                          (sub.percent || 0) >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          (sub.percent || 0) >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {sub.percent || 0}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {hrbpSubmissions.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Total Surveys
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                  {submissionsByDate.size}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Active Days
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRBPCalendarModal;
