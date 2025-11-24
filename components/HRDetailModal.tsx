import React, { useMemo, useState } from 'react';
import { Submission } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface HRDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: Submission[];
  filterType: 'region' | 'am' | 'hr' | 'store';
  filterValue: string;
  title: string;
}

const HRDetailModal: React.FC<HRDetailModalProps> = ({
  isOpen,
  onClose,
  submissions,
  filterType,
  filterValue,
  title,
}) => {
  const { theme } = useTheme();
  const [sortField, setSortField] = useState<'date' | 'score' | 'store'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'north' | 'west' | 'south'>('north');

  // Filter submissions based on the filter type and value
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // If value is 'all', return all submissions
    if (filterValue === 'all') {
      return submissions;
    }

    switch (filterType) {
      case 'region':
        filtered = submissions.filter(s => s.region === filterValue);
        break;
      case 'am':
        filtered = submissions.filter(s => s.amName === filterValue || s.amId === filterValue);
        break;
      case 'hr':
        filtered = submissions.filter(s => s.hrName === filterValue || s.hrId === filterValue);
        break;
      case 'store':
        filtered = submissions.filter(s => s.storeID === filterValue);
        break;
    }

    return filtered;
  }, [submissions, filterType, filterValue]);

  // Group data by regions for tab counts
  const regionCounts = useMemo(() => {
    const byRegion: { [key: string]: number } = {};

    filteredSubmissions.forEach(submission => {
      const region = submission.region || 'Unknown';
      byRegion[region] = (byRegion[region] || 0) + 1;
    });

    return byRegion;
  }, [filteredSubmissions]);

  // Get display data based on active tab
  const displaySubmissions = useMemo(() => {
    // Filter by the selected region
    if (activeTab === 'north') return filteredSubmissions.filter(s => s.region === 'North');
    if (activeTab === 'west') return filteredSubmissions.filter(s => s.region === 'West');
    if (activeTab === 'south') return filteredSubmissions.filter(s => s.region === 'South');
    
    return filteredSubmissions;
  }, [activeTab, filteredSubmissions]);

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    const sorted = [...displaySubmissions];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(b.submissionTime).getTime() - new Date(a.submissionTime).getTime();
          break;
        case 'score':
          // Compare using the raw percent value (will be converted to /5 for display)
          comparison = b.percent - a.percent;
          break;
        case 'store':
          comparison = a.storeName.localeCompare(b.storeName);
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return sorted;
  }, [displaySubmissions, sortField, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredSubmissions.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        total: 0,
        employeeCount: 0,
      };
    }

    // Convert percentage to 1-5 scale (percent / 100 * 5)
    const scores = filteredSubmissions.map(s => (s.percent / 100) * 5);
    const total = filteredSubmissions.length;
    const average = scores.reduce((sum, score) => sum + score, 0) / total;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    
    // Count unique employees surveyed
    const employeeCount = new Set(filteredSubmissions.map(s => s.empId)).size;

    return {
      average: average.toFixed(1),
      highest: highest.toFixed(1),
      lowest: lowest.toFixed(1),
      total,
      employeeCount,
    };
  }, [filteredSubmissions]);

  const handleSort = (field: 'date' | 'score' | 'store') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Helper function to render a submission row
  const renderSubmissionRow = (submission: Submission, key: string | number) => {
    // Parse date safely - handle DD/MM/YYYY, HH:MM:SS format from Google Sheets
    let submissionDate: Date | null = null;
    
    if (submission.submissionTime) {
      // Try parsing ISO format first
      submissionDate = new Date(submission.submissionTime);
      
      // If invalid, try parsing DD/MM/YYYY format
      if (isNaN(submissionDate.getTime())) {
        // Format: "25/09/2025, 17:15:11" or "25/09/2025 17:15:11"
        const dateStr = submission.submissionTime.replace(',', '').trim();
        const parts = dateStr.split(' ');
        if (parts.length >= 1) {
          const dateParts = parts[0].split('/');
          if (dateParts.length === 3) {
            // DD/MM/YYYY -> convert to YYYY-MM-DD
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];
            const time = parts[1] || '00:00:00';
            const isoString = `${year}-${month}-${day}T${time}`;
            submissionDate = new Date(isoString);
          }
        }
      }
    }
    
    const isValidDate = submissionDate && !isNaN(submissionDate.getTime());
    
    return (
      <tr
        key={key}
        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <td className="px-4 py-3 text-sm">
          {isValidDate ? submissionDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }) : 'N/A'}
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="font-medium truncate">{submission.storeName || 'N/A'}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
            {submission.storeID || 'N/A'}
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="font-medium truncate">{submission.empName || 'N/A'}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
            {submission.empId || 'N/A'}
          </div>
        </td>
        <td className="px-4 py-3 text-sm">{submission.region || 'N/A'}</td>
        <td className="px-4 py-3 text-sm">
          <div className="font-medium truncate">{submission.amName || 'Not Assigned'}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
            {submission.amId || '-'}
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="font-medium truncate">{submission.hrName || 'Not Assigned'}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
            {submission.hrId || '-'}
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              submission.percent >= 80
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : submission.percent >= 60
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {((submission.percent / 100) * 5).toFixed(1)}/5
          </span>
        </td>
      </tr>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl ${
          theme === 'dark' ? 'bg-slate-800/95 backdrop-blur-xl text-slate-100' : 'bg-white/95 backdrop-blur-xl text-gray-900'
        } border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold truncate">{title}</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1 hidden sm:block">
              HR Employee Satisfaction Survey Results
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Statistics Summary */}
        <div className={`grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 p-3 sm:p-6 ${
          theme === 'dark' ? 'bg-slate-900/50 backdrop-blur-sm' : 'bg-gray-50/80 backdrop-blur-sm'
        } border-b border-gray-200 dark:border-slate-700`}>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Surveys</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Employees</p>
            <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.employeeCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Avg</p>
            <p className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.average}/5</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Highest</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.highest}/5</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Lowest</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lowest}/5</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-200 dark:border-slate-700 ${
          theme === 'dark' ? 'bg-slate-900/30' : 'bg-gray-50/50'
        } overflow-x-auto`}>
          <button
            onClick={() => setActiveTab('north')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'north'
                ? 'bg-blue-600 text-white shadow-md'
                : theme === 'dark'
                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            North ({regionCounts['North'] || 0})
          </button>
          <button
            onClick={() => setActiveTab('west')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'west'
                ? 'bg-blue-600 text-white shadow-md'
                : theme === 'dark'
                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            West ({regionCounts['West'] || 0})
          </button>
          <button
            onClick={() => setActiveTab('south')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'south'
                ? 'bg-blue-600 text-white shadow-md'
                : theme === 'dark'
                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            South ({regionCounts['South'] || 0})
          </button>
        </div>

        {/* Submissions Table */}
        <div className="flex flex-col h-[calc(95vh-280px)] sm:h-[calc(90vh-340px)]">
          {sortedSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 dark:text-slate-400">No survey submissions found</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto px-2 sm:px-6">
              {/* Mobile: Card View */}
              <div className="block sm:hidden space-y-3 py-3">
                {sortedSubmissions.map((submission, index) => {
                  const submissionDate = new Date(submission.submissionTime);
                  const isValidDate = submissionDate && !isNaN(submissionDate.getTime());
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-slate-700/50 border-slate-600' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{submission.storeName || 'N/A'}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{submission.storeID || 'N/A'}</div>
                        </div>
                        <span
                          className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            submission.percent >= 80
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : submission.percent >= 60
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {((submission.percent / 100) * 5).toFixed(1)}/5
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 dark:text-slate-400">Employee:</span>
                          <span className="font-medium">{submission.empName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 dark:text-slate-400">Date:</span>
                          <span>{isValidDate ? submissionDate.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 dark:text-slate-400">HR:</span>
                          <span className="truncate">{submission.hrName || 'Not Assigned'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Table View */}
              <table className="w-full table-fixed hidden sm:table">
                <colgroup>
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead className={`sticky top-0 z-20 ${
                  theme === 'dark' ? 'bg-slate-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'
                } border-b border-gray-200 dark:border-slate-700 shadow-sm`}>
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
                      onClick={() => handleSort('date')}
                    >
                      Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
                      onClick={() => handleSort('store')}
                    >
                      Store {sortField === 'store' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Area Manager
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      HRBP
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
                      onClick={() => handleSort('score')}
                    >
                      Score {sortField === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {sortedSubmissions.map((submission, index) => {
                    return renderSubmissionRow(submission, index);
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
            {sortedSubmissions.length} survey{sortedSubmissions.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRDetailModal;
