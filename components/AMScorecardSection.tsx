import React, { useState, useMemo } from 'react';
import AMScorecard from './AMScorecard';
import { AreaManager } from '../types';
import { Download } from 'lucide-react';

interface AMScorecardSectionProps {
  areaManagers: AreaManager[];
  submissions: any[];
}

const AMScorecardSection: React.FC<AMScorecardSectionProps> = ({ areaManagers, submissions }) => {
  const [selectedAM, setSelectedAM] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Filter AMs that have submissions
  const amsWithSubmissions = useMemo(() => {
    return areaManagers.filter(am => 
      submissions.some(sub => sub.amId === am.id)
    );
  }, [areaManagers, submissions]);

  // Apply search filter
  const filteredAMs = useMemo(() => {
    let filtered = amsWithSubmissions;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(am => 
        am.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        am.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply specific AM filter
    if (selectedAM) {
      filtered = filtered.filter(am => am.id === selectedAM);
    }

    return filtered;
  }, [amsWithSubmissions, searchTerm, selectedAM]);

  const handleReset = () => {
    setSelectedAM('');
    setSearchTerm('');
  };

  const handleDownloadAll = () => {
    setIsDownloadingAll(true);
    // Trigger download for each AM
    filteredAMs.forEach((am, index) => {
      setTimeout(() => {
        // Find the scorecard component and trigger its download
        const downloadButton = document.querySelector(`[data-am-id="${am.id}"] button[data-download]`) as HTMLButtonElement;
        if (downloadButton) {
          downloadButton.click();
        }
        
        // Reset loading state after last download
        if (index === filteredAMs.length - 1) {
          setTimeout(() => setIsDownloadingAll(false), 500);
        }
      }, index * 500); // Stagger downloads by 500ms to avoid browser blocking
    });
  };

  return (
    <div className="mt-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Area Manager Scorecards</h2>
              <p className="text-blue-100 mt-1">Individual performance reports with downloadable PDFs</p>
            </div>
          </div>
          
          {/* Download All Button */}
          {filteredAMs.length > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 backdrop-blur-sm text-white px-5 py-3 rounded-xl transition-all duration-200 hover:scale-105 font-semibold shadow-lg disabled:cursor-not-allowed disabled:scale-100"
            >
              {isDownloadingAll ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Download All ({filteredAMs.length})</span>
                  <span className="sm:hidden">All ({filteredAMs.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border-x border-gray-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Filter */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Search Area Manager
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <svg 
                className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-slate-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Specific AM Filter */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Select Specific AM
            </label>
            <select
              value={selectedAM}
              onChange={(e) => setSelectedAM(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">All Area Managers ({amsWithSubmissions.length})</option>
              {amsWithSubmissions.map(am => (
                <option key={am.id} value={am.id}>
                  {am.name} ({am.id})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="md:col-span-1 flex items-end">
            <button
              onClick={handleReset}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Showing <span className="font-semibold text-gray-900 dark:text-slate-200">{filteredAMs.length}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-slate-200">{amsWithSubmissions.length}</span> Area Managers
          </p>
          {(searchTerm || selectedAM) && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
              Filtered
            </span>
          )}
        </div>
      </div>

      {/* Scorecards */}
      <div className="bg-gray-50 dark:bg-slate-900 rounded-b-xl p-6 space-y-6">
        {filteredAMs.length > 0 ? (
          filteredAMs.map(am => (
            <AMScorecard
              key={am.id}
              amId={am.id}
              amName={am.name}
              submissions={submissions}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-slate-400 text-lg font-medium mb-2">
              {searchTerm || selectedAM ? 'No matching Area Managers found' : 'No Area Manager data available'}
            </p>
            <p className="text-gray-400 dark:text-slate-500 text-sm">
              {searchTerm || selectedAM ? 'Try adjusting your filters' : 'Area Managers with submissions will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AMScorecardSection;
