import React, { useState, useEffect } from 'react';
import { Users, Search, ArrowRight, Award, CheckCircle2, XCircle, Clock } from 'lucide-react';

// Interview sections matching the updated Google Apps Script
const INTERVIEW_SECTIONS = [
  'Responsibility',
  'Empathy',
  'Service Excellence',
  'Performance with Purpose',
  'Ethics and Integrity',
  'Collaboration',
  'Trust'
];

interface Candidate {
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  storeId: string;
  storeName?: string;
  region: string;
  readinessScore: number | null;
  assessmentScore: number | null;
  interviewStatus: 'Not Started' | 'Completed';
  interviewScore: number | null;
  readinessStatus: string;
  assessmentStatus: string;
}

interface BenchPlanningPanelistDashboardProps {
  panelistId: string;
  panelistName: string;
  onTakeInterview: (candidate: Candidate) => void;
}

const BenchPlanningPanelistDashboard: React.FC<BenchPlanningPanelistDashboardProps> = ({
  panelistId,
  panelistName,
  onTakeInterview
}) => {
  const BENCH_PLANNING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzG5BCTTDL3OWdKMGVqFvJ_jyfQBZDYJqZe2iwXBZJijmMEz4EVLdOdMgdZIgCagC6UgA/exec';

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Load panelist's assigned candidates with their progress
  useEffect(() => {
    loadPanelistCandidates();
  }, [panelistId]);

  const loadPanelistCandidates = async () => {
    try {
      setLoading(true);
      setError('');

      // Get panelist's assigned candidates with their scores
      const response = await fetch(
        `${BENCH_PLANNING_ENDPOINT}?action=getPanelistCandidates&panelistId=${panelistId}&_t=${new Date().getTime()}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load candidates');
      }
      
      if (!data.candidates || !Array.isArray(data.candidates)) {
        throw new Error('Invalid candidates data received');
      }

      // Map to our interface
      const mappedCandidates: Candidate[] = data.candidates.map((c: any) => ({
        employeeId: c.employeeId,
        employeeName: c.employeeName,
        managerId: c.managerId,
        managerName: c.managerName,
        storeId: c.storeId || 'N/A',
        storeName: c.storeName || c.storeId || 'N/A',
        region: c.region || 'Unknown',
        readinessScore: c.readinessScore,
        assessmentScore: c.assessmentScore,
        interviewStatus: c.interviewStatus,
        interviewScore: c.interviewScore,
        readinessStatus: c.readinessStatus,
        assessmentStatus: c.assessmentStatus
      }));

      setCandidates(mappedCandidates);
    } catch (err: any) {
      console.error('Error loading panelist candidates:', err);
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates based on search term
  const filteredCandidates = candidates.filter(candidate =>
    candidate.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge component
  const getStatusBadge = (status: string, score: number | null) => {
    if (status === 'Passed' || status === 'Completed') {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">{score !== null ? `${score.toFixed(1)}%` : 'Passed'}</span>
        </div>
      );
    } else if (status === 'Failed') {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <XCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{score !== null ? `${score.toFixed(1)}%` : 'Failed'}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Pending</span>
        </div>
      );
    }
  };

  // Check if candidate is ready for interview
  const isReadyForInterview = (candidate: Candidate) => {
    return candidate.assessmentStatus === 'Passed' || candidate.assessmentStatus === 'Completed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Loading assigned candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={loadPanelistCandidates}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Panelist Dashboard</h2>
        </div>
        <p className="text-purple-100">Welcome, {panelistName}</p>
        <p className="text-sm text-purple-200 mt-1">
          {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by candidate name or ID..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
            Found {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Candidates List */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            {searchTerm ? 'No candidates found' : 'No candidates assigned'}
          </h3>
          <p className="text-gray-600 dark:text-slate-400">
            {searchTerm
              ? 'Try a different search term'
              : 'You currently have no candidates assigned to you for interviews'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    AM / Trainer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Readiness
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Interview
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredCandidates.map((candidate) => {
                  const readyForInterview = isReadyForInterview(candidate);
                  return (
                    <tr
                      key={candidate.employeeId}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {candidate.employeeName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">
                            {candidate.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {candidate.managerName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {candidate.managerId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {candidate.storeName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {candidate.region}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(candidate.readinessStatus, candidate.readinessScore)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(candidate.assessmentStatus, candidate.assessmentScore)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {candidate.interviewStatus === 'Completed' ? (
                          <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {candidate.interviewScore !== null ? `${candidate.interviewScore.toFixed(1)}%` : 'Done'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => onTakeInterview(candidate)}
                          disabled={!readyForInterview}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            readyForInterview
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                          }`}
                          title={
                            readyForInterview
                              ? 'Take Interview'
                              : 'Candidate must pass assessment first'
                          }
                        >
                          {candidate.interviewStatus === 'Completed' ? 'Review' : 'Take Interview'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-slate-700">
            {filteredCandidates.map((candidate) => {
              const readyForInterview = isReadyForInterview(candidate);
              return (
                <div
                  key={candidate.employeeId}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Candidate Info */}
                    <div>
                      <div className="text-base font-medium text-gray-900 dark:text-white">
                        {candidate.employeeName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">
                        ID: {candidate.employeeId}
                      </div>
                    </div>

                    {/* Area Manager & Store */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-slate-400">Area Manager</div>
                        <div className="text-gray-900 dark:text-white font-medium">
                          {candidate.managerName}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-slate-400">Store</div>
                        <div className="text-gray-900 dark:text-white font-medium">
                          {candidate.storeName}
                        </div>
                      </div>
                    </div>

                    {/* Progress Status */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Readiness</div>
                        {getStatusBadge(candidate.readinessStatus, candidate.readinessScore)}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Assessment</div>
                        {getStatusBadge(candidate.assessmentStatus, candidate.assessmentScore)}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">Interview</div>
                        {candidate.interviewStatus === 'Completed' ? (
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {candidate.interviewScore !== null ? `${candidate.interviewScore.toFixed(1)}%` : 'Done'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onTakeInterview(candidate)}
                      disabled={!readyForInterview}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        readyForInterview
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {candidate.interviewStatus === 'Completed' ? 'Review Interview' : 'Take Interview'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {!readyForInterview && (
                      <p className="text-xs text-center text-gray-500 dark:text-slate-400">
                        Candidate must pass assessment first
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {candidates.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Total Assigned</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {candidates.filter(c => c.readinessStatus === 'Passed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Readiness Passed</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {candidates.filter(c => isReadyForInterview(c)).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Ready for Interview</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {candidates.filter(c => c.interviewStatus === 'Completed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Interviews Done</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchPlanningPanelistDashboard;
