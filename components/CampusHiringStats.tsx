import React, { useState, useMemo } from 'react';
import { Brain, Users, TrendingUp, Award, Filter, X, Download, FileText } from 'lucide-react';
import { CampusHiringSubmission } from '../services/dataService';
import { buildCampusHiringPDF } from '../src/utils/campusHiringReport';

interface CampusHiringStatsProps {
  submissions: CampusHiringSubmission[];
}

const CampusHiringStats: React.FC<CampusHiringStatsProps> = ({ submissions }) => {
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [selectedCampus, setSelectedCampus] = useState<string>('');

  if (submissions.length === 0) {
    return null;
  }

  // Get unique campuses
  const campuses = useMemo(() => {
    const uniqueCampuses = Array.from(new Set(submissions.map(s => s['Campus Name'])))
      .filter(campus => campus && campus.trim() !== '')
      .sort();
    return uniqueCampuses;
  }, [submissions]);

  // Filter submissions based on score range and campus
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const score = parseFloat(s['Score Percentage'] || '0');
      const matchesScore = score >= scoreRange[0] && score <= scoreRange[1];
      const matchesCampus = !selectedCampus || s['Campus Name'] === selectedCampus;
      return matchesScore && matchesCampus;
    });
  }, [submissions, scoreRange, selectedCampus]);

  // Calculate statistics from filtered data
  const totalCandidates = filteredSubmissions.length;
  const uniqueCampuses = new Set(filteredSubmissions.map(s => s['Campus Name'])).size;
  
  const avgOverallScore = filteredSubmissions.length > 0 
    ? filteredSubmissions.reduce((sum, s) => sum + parseFloat(s['Score Percentage'] || '0'), 0) / totalCandidates
    : 0;
  
  // Calculate average category scores
  const categories = [
    'Communication Score %',
    'Problem Solving Score %',
    'Leadership Score %',
    'Attention to Detail Score %',
    'Customer Service Score %',
    'Integrity Score %',
    'Teamwork Score %',
    'Time Management Score %',
    'Planning Score %',
    'Adaptability Score %',
    'Analysis Score %',
    'Growth Mindset Score %'
  ];

  const categoryAverages = categories.map(category => {
    const avg = filteredSubmissions.length > 0
      ? filteredSubmissions.reduce((sum, s) => sum + parseFloat(s[category] || '0'), 0) / totalCandidates
      : 0;
    return {
      name: category.replace(' Score %', ''),
      score: avg
    };
  }).sort((a, b) => b.score - a.score);

  const topStrengths = categoryAverages.slice(0, 3);
  const developmentAreas = categoryAverages.slice(-3).reverse();

  // Get all candidates sorted by score (not limited to top 5)
  const allCandidates = filteredSubmissions
    .map(s => ({
      name: s['Candidate Name'],
      campus: s['Campus Name'],
      phone: s['Phone Number'],
      email: s['Email'],
      score: parseFloat(s['Score Percentage'] || '0'),
      submission: s
    }))
    .sort((a, b) => b.score - a.score);

  // Top candidate for overview card
  const topCandidate = allCandidates[0];

  // Handle slider change
  const handleSliderChange = (index: number, value: number) => {
    const newRange: [number, number] = [...scoreRange];
    newRange[index] = value;
    
    // Ensure min doesn't exceed max and vice versa
    if (index === 0 && value > scoreRange[1]) {
      newRange[1] = value;
    } else if (index === 1 && value < scoreRange[0]) {
      newRange[0] = value;
    }
    
    setScoreRange(newRange);
  };

  // Reset filters
  const resetFilters = () => {
    setScoreRange([0, 100]);
    setSelectedCampus('');
  };

  // Download Excel function
  const downloadExcel = () => {
    // Create CSV content (Excel can open CSV files)
    const headers = [
      'Candidate Name',
      'Phone Number',
      'Email',
      'Campus Name',
      'Overall Score %',
      'Communication %',
      'Problem Solving %',
      'Leadership %',
      'Attention to Detail %',
      'Customer Service %',
      'Integrity %',
      'Teamwork %',
      'Time Management %',
      'Planning %',
      'Adaptability %',
      'Analysis %',
      'Growth Mindset %',
      'Submission Date'
    ];

    const csvRows = [headers.join(',')];

    filteredSubmissions.forEach(submission => {
      const row = [
        `"${submission['Candidate Name'] || ''}"`,
        `"${submission['Phone Number'] || ''}"`,
        `"${submission['Email'] || ''}"`,
        `"${submission['Campus Name'] || ''}"`,
        submission['Score Percentage'] || '0',
        submission['Communication Score %'] || '0',
        submission['Problem Solving Score %'] || '0',
        submission['Leadership Score %'] || '0',
        submission['Attention to Detail Score %'] || '0',
        submission['Customer Service Score %'] || '0',
        submission['Integrity Score %'] || '0',
        submission['Teamwork Score %'] || '0',
        submission['Time Management Score %'] || '0',
        submission['Planning Score %'] || '0',
        submission['Adaptability Score %'] || '0',
        submission['Analysis Score %'] || '0',
        submission['Growth Mindset Score %'] || '0',
        `"${submission['Timestamp'] || submission['Submission Time'] || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Campus_Hiring_Report_${dateStr}${selectedCampus ? `_${selectedCampus.replace(/\s+/g, '_')}` : ''}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate detailed PDF report for individual candidate
  const generateCandidatePDF = async (candidate: typeof allCandidates[0]) => {
    console.log('Generating PDF for:', candidate.name);
    console.log('Submission data:', candidate.submission);
    
    try {
      console.log('Calling buildCampusHiringPDF...');
      const doc = await buildCampusHiringPDF(candidate.submission);
      console.log('PDF doc generated successfully');
      
      const fileName = `Campus_Hiring_${candidate.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('Saving PDF as:', fileName);
      
      doc.save(fileName);
      console.log('PDF saved successfully');
    } catch (error) {
      console.error('Detailed error generating PDF:', error);
      console.error('Error stack:', (error as Error).stack);
      alert(`Failed to generate PDF report. Error: ${(error as Error).message}`);
    }
  };

  const hasActiveFilters = scoreRange[0] !== 0 || scoreRange[1] !== 100 || selectedCampus !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Campus Hiring Analytics</h2>
            </div>
            <p className="text-indigo-50">
              Psychometric Assessment Insights - {submissions.length} Total Candidate{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Download Button */}
          <button
            onClick={downloadExcel}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors shadow-lg"
            title="Download filtered data as Excel"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Download Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            {hasActiveFilters && (
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                {filteredSubmissions.length} of {submissions.length} candidates
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Range Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Score Range: {scoreRange[0]}% - {scoreRange[1]}%
            </label>
            <div className="space-y-4">
              {/* Min Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 dark:text-slate-400">Minimum Score</span>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{scoreRange[0]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={scoreRange[0]}
                  onChange={(e) => handleSliderChange(0, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${scoreRange[0]}%, #e5e7eb ${scoreRange[0]}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Max Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 dark:text-slate-400">Maximum Score</span>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{scoreRange[1]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={scoreRange[1]}
                  onChange={(e) => handleSliderChange(1, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  style={{
                    background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${scoreRange[1]}%, #6366f1 ${scoreRange[1]}%, #6366f1 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campus Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Filter by Campus
            </label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Campuses ({campuses.length})</option>
              {campuses.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>

            {/* Quick Score Filters */}
            <div className="mt-4">
              <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">Quick Filters:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setScoreRange([0, 50])}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    scoreRange[0] === 0 && scoreRange[1] === 50
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Below Average (0-50%)
                </button>
                <button
                  onClick={() => setScoreRange([50, 75])}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    scoreRange[0] === 50 && scoreRange[1] === 75
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-2 border-yellow-500'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Average (50-75%)
                </button>
                <button
                  onClick={() => setScoreRange([75, 90])}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    scoreRange[0] === 75 && scoreRange[1] === 90
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Above Average (75-90%)
                </button>
                <button
                  onClick={() => setScoreRange([90, 100])}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    scoreRange[0] === 90 && scoreRange[1] === 100
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-2 border-indigo-500'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Excellent (90-100%)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              Showing <span className="font-bold">{totalCandidates}</span> of <span className="font-bold">{submissions.length}</span> candidates
              {selectedCampus && <> from <span className="font-bold">{selectedCampus}</span></>}
              {' '}with scores between <span className="font-bold">{scoreRange[0]}%</span> and <span className="font-bold">{scoreRange[1]}%</span>
            </p>
          </div>
        )}
      </div>

      {/* Show message if no results */}
      {totalCandidates === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 text-center">
          <Filter className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">No Candidates Found</h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            No candidates match the selected filters. Try adjusting the score range or campus filter.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Total Candidates</h3>
          </div>
          <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{totalCandidates}</p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
            From {uniqueCampuses} campus{uniqueCampuses !== 1 ? 'es' : ''}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Average Score</h3>
          </div>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {avgOverallScore.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
            Out of 100%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Top Performer</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {topCandidate?.name || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
            {topCandidate?.score.toFixed(1)}% - {topCandidate?.campus}
          </p>
        </div>
      </div>

      {/* Category Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Top Strengths
          </h3>
          <div className="space-y-3">
            {topStrengths.map((category, index) => (
              <div key={category.name} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{category.name}</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{category.score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Development Areas */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Development Areas
          </h3>
          <div className="space-y-3">
            {developmentAreas.map((category, index) => (
              <div key={category.name} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{category.name}</span>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{category.score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Candidates Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          All Candidates ({allCandidates.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Candidate Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Campus</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Score</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Report</th>
              </tr>
            </thead>
            <tbody>
              {allCandidates.map((candidate, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-slate-100 font-medium">{candidate.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-slate-400">{candidate.campus}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                      {candidate.score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => generateCandidatePDF(candidate)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                      title={`Download detailed report for ${candidate.name}`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default CampusHiringStats;
