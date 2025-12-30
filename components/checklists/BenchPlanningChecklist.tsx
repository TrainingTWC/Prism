import React, { useState, useEffect } from 'react';
import { UserRole } from '../../roleMapping';
import { Users, ClipboardCheck, Brain, MessageSquare, Save, CheckCircle, AlertCircle, ArrowLeft, Lock, Unlock, XCircle, LogOut } from 'lucide-react';
import LoadingOverlay from '../LoadingOverlay';
import { hapticFeedback } from '../../utils/haptics';
import { BenchCandidate, ReadinessChecklistItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface BenchPlanningChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

type TabType = 'readiness' | 'assessment' | 'interview';

// Google Apps Script endpoint - UPDATE THIS with your deployed script URL
const BENCH_PLANNING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwK1N2T8mp2_NqDKfm6hwNcK79CvVgrLeZmp76RR4CjsbpLS9H5VlKPlZUY0H2d_2Q61w/exec';

// Readiness checklist items from the image
const READINESS_ITEMS = [
  'Has completed all product and process knowledge modules on LMS.',
  'Demonstrates strong understanding of SOPs and stays updated with any changes in process or communication.',
  'Has completed the Food Safety module in LMS and consistently applies standards, correcting others when needed.',
  'Maintains punctuality and regular attendance.',
  'Consistently maintains high personal grooming and hygiene standards, setting an example for others.',
  'Proactively leads pre-shift huddles and supports in store training (e.g., during LTO rollouts, communication etc).',
  'Takes initiative to support store operations beyond assigned tasks.',
  'Shows positive influence and motivates team members during service.',
  'Has experience in coaching or mentoring new team members.',
  'Can independently manage short shifts with minimal supervision.',
  'Handles guest concerns or complaints calmly and confidently.'
];

// Interview sections from the image
const INTERVIEW_SECTIONS = [
  'Product & Process Knowledge',
  'Food Safety Understanding',
  'Leadership & Initiative',
  'Guest Service Excellence',
  'Communication Skills',
  'Problem Solving',
  'Team Management',
  'Adaptability'
];

const BenchPlanningChecklist: React.FC<BenchPlanningChecklistProps> = ({ 
  userRole, 
  onStatsUpdate, 
  onBackToChecklists 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('readiness');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Get user info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('EMPID') || urlParams.get('empId') || urlParams.get('id') || '';
  const userName = urlParams.get('empName') || urlParams.get('name') || '';
  
  // State for candidate data
  const [candidateData, setCandidateData] = useState<BenchCandidate | null>(null);
  const [candidateSearchId, setCandidateSearchId] = useState('');
  const [managerCandidates, setManagerCandidates] = useState<BenchCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [notEligible, setNotEligible] = useState(false);
  
  // Readiness Checklist State
  const [readinessScores, setReadinessScores] = useState<{ [key: number]: number }>({});
  const [readinessRemarks, setReadinessRemarks] = useState('');
  const [readinessStatus, setReadinessStatus] = useState<'not_started' | 'pending' | 'passed' | 'failed'>('not_started');
  
  // Assessment State (will be populated with questions later)
  const [assessmentAnswers, setAssessmentAnswers] = useState<{ [key: string]: string }>({});
  const [assessmentLocked, setAssessmentLocked] = useState(true);
  const [assessmentAttempted, setAssessmentAttempted] = useState(false);
  const [assessmentPassed, setAssessmentPassed] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState<any[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<any>(null);
  
  // Interview State
  const [interviewScores, setInterviewScores] = useState<{ [key: number]: number }>({});
  const [interviewRemarks, setInterviewRemarks] = useState('');
  const [interviewLocked, setInterviewLocked] = useState(true);
  
  // Determine user type (manager, candidate, or panelist)
  const [userType, setUserType] = useState<'manager' | 'candidate' | 'panelist' | 'admin'>('candidate');
  
  // Get auth context for logout
  const { logout, userRole: authRole } = useAuth();
  
  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      logout();
      window.location.href = '/Prism/';
    }
  };
  
  // Load manager's candidates from Google Sheets
  const loadManagerCandidates = async (managerId: string) => {
    try {
      setLoadingCandidates(true);
      const response = await fetch(`${BENCH_PLANNING_ENDPOINT}?action=getManagerCandidates&managerId=${managerId}`);
      const data = await response.json();
      
      if (data.success && data.candidates) {
        setManagerCandidates(data.candidates);
      } else {
        console.error('Failed to load manager candidates:', data.message);
      }
    } catch (error) {
      console.error('Error loading manager candidates:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };
  
  // Load candidate data from Google Sheets
  const loadCandidateData = async (employeeId: string) => {
    try {
      setLoading(true);
      setNotEligible(false);
      const response = await fetch(`${BENCH_PLANNING_ENDPOINT}?action=getCandidateData&employeeId=${employeeId}`);
      const data = await response.json();
      
      if (data.success && data.candidate) {
        setCandidateData(data.candidate);
        setNotEligible(false);
        
        // Load statuses
        if (data.readinessStatus) {
          setReadinessStatus(data.readinessStatus.status);
          if (data.readinessStatus.scores) {
            setReadinessScores(data.readinessStatus.scores);
          }
        }
        
        if (data.assessmentStatus) {
          setAssessmentStatus(data.assessmentStatus);
          setAssessmentLocked(!data.assessmentStatus.unlocked);
          setAssessmentAttempted(data.assessmentStatus.attempted);
          setAssessmentPassed(data.assessmentStatus.passed);
        }
        
        if (data.interviewStatus) {
          setInterviewLocked(!data.interviewStatus.unlocked);
        }
        
        // Determine user type (case-insensitive comparison)
        const userIdUpper = userId.toUpperCase();
        const managerIdUpper = data.candidate.managerId?.toUpperCase() || '';
        const panelistIdUpper = data.candidate.panelistId?.toUpperCase() || '';
        const employeeIdUpper = data.candidate.employeeId?.toUpperCase() || '';
        
        if (managerIdUpper === userIdUpper) {
          setUserType('manager');
        } else if (panelistIdUpper === userIdUpper) {
          setUserType('panelist');
        } else if (employeeIdUpper === userIdUpper) {
          setUserType('candidate');
        }
      } else {
        // Candidate not found in the list
        setCandidateData(null);
        // Don't set notEligible immediately - wait to see if they have manager candidates
        // setNotEligible(true);
      }
    } catch (error) {
      console.error('Error loading candidate data:', error);
      setErrorMessage('Failed to load candidate data');
    } finally {
      setLoading(false);
    }
  };
  
  // Load data on component mount if user ID is available
  useEffect(() => {
    if (userId) {
      // Try to load as candidate first
      loadCandidateData(userId);
      // Also try to load as manager to get their candidates
      loadManagerCandidates(userId);
    }
  }, [userId]);
  
  // After both data loads complete, determine eligibility
  useEffect(() => {
    // Only set notEligible if:
    // 1. User is not a candidate (no candidateData)
    // 2. User is not a manager (no managerCandidates)
    // 3. Loading is complete
    if (!loading && !loadingCandidates && !candidateData && managerCandidates.length === 0 && userId) {
      setNotEligible(true);
    }
  }, [loading, loadingCandidates, candidateData, managerCandidates, userId]);
  
  // Fetch assessment questions when assessment is unlocked
  useEffect(() => {
    const fetchAssessmentQuestions = async () => {
      try {
        const response = await fetch(`${BENCH_PLANNING_ENDPOINT}?action=getAssessmentQuestions`);
        const data = await response.json();
        
        if (data.success && data.questions) {
          setAssessmentQuestions(data.questions);
        }
      } catch (error) {
        console.error('Error fetching assessment questions:', error);
      }
    };
    
    if (!assessmentLocked && assessmentQuestions.length === 0) {
      fetchAssessmentQuestions();
    }
  }, [assessmentLocked]);
  
  // Set user type to manager/admin if manager candidates are loaded but user is not a candidate
  useEffect(() => {
    if (managerCandidates.length > 0 && !candidateData) {
      // If we have manager candidates but no candidate data, user is a manager or admin
      if (userRole === 'admin') {
        setUserType('admin');
      } else {
        setUserType('manager');
      }
      // Clear the not eligible flag since they're a valid manager
      setNotEligible(false);
    }
  }, [managerCandidates, candidateData, userRole]);
  
  // Submit Readiness Checklist
  const handleSubmitReadiness = async () => {
    if (!candidateData) {
      setErrorMessage('Please load candidate data first');
      return;
    }
    
    // Validate all items are scored
    const allScored = READINESS_ITEMS.every((_, index) => readinessScores[index] >= 1 && readinessScores[index] <= 5);
    if (!allScored) {
      setErrorMessage('Please score all items (1-5)');
      return;
    }
    
    try {
      setLoading(true);
      hapticFeedback.select();
      
      const totalScore = Object.values(readinessScores).reduce((sum, score) => sum + score, 0);
      const maxScore = READINESS_ITEMS.length * 5;
      const percentage = (totalScore / maxScore) * 100;
      const passed = percentage >= 80; // 80% passing threshold
      
      const params = {
        action: 'submitReadiness',
        employeeId: candidateData.employeeId,
        employeeName: candidateData.employeeName,
        managerId: candidateData.managerId,
        managerName: candidateData.managerName,
        scores: JSON.stringify(readinessScores),
        remarks: readinessRemarks,
        totalScore: String(totalScore),
        maxScore: String(maxScore),
        passed: String(passed),
        submissionTime: new Date().toISOString()
      };
      
      const response = await fetch(BENCH_PLANNING_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString()
      });
      
      // With no-cors, we can't read the response, so assume success
      setSubmitStatus('success');
      setReadinessStatus(passed ? 'passed' : 'failed');
      hapticFeedback.success();
      
      // Refresh data to update assessment lock status
      setTimeout(async () => {
        await loadCandidateData(candidateData.employeeId);
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error submitting readiness checklist:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit. Please try again.');
      hapticFeedback.error();
    } finally {
      setLoading(false);
    }
  };
  
  // Submit Assessment (placeholder - will be updated when questions are provided)
  const handleSubmitAssessment = async () => {
    if (!candidateData) return;
    
    // Validate all questions are answered
    const allAnswered = assessmentQuestions.every(q => assessmentAnswers[q.id]);
    if (!allAnswered) {
      setErrorMessage('Please answer all questions before submitting');
      return;
    }
    
    try {
      setLoading(true);
      hapticFeedback.select();
      
      const params = {
        action: 'submitAssessment',
        employeeId: candidateData.employeeId,
        employeeName: candidateData.employeeName,
        answers: JSON.stringify(assessmentAnswers),
        submissionTime: new Date().toISOString()
      };
      
      const response = await fetch(BENCH_PLANNING_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString()
      });
      
      // With no-cors, we can't read the response, so assume success
      setSubmitStatus('success');
      setAssessmentAttempted(true);
      hapticFeedback.success();
      
      // Refresh data to get actual results
      setTimeout(async () => {
        await loadCandidateData(candidateData.employeeId);
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit. Please try again.');
      hapticFeedback.error();
    } finally {
      setLoading(false);
    }
  };
  
  // Submit Interview
  const handleSubmitInterview = async () => {
    if (!candidateData) return;
    
    // Validate all sections are scored
    const allScored = INTERVIEW_SECTIONS.every((_, index) => interviewScores[index] >= 1 && interviewScores[index] <= 5);
    if (!allScored) {
      setErrorMessage('Please score all sections (1-5)');
      return;
    }
    
    try {
      setLoading(true);
      hapticFeedback.select();
      
      const totalScore = Object.values(interviewScores).reduce((sum, score) => sum + score, 0);
      const maxScore = INTERVIEW_SECTIONS.length * 5;
      
      const params = {
        action: 'submitInterview',
        employeeId: candidateData.employeeId,
        employeeName: candidateData.employeeName,
        panelistId: candidateData.panelistId,
        panelistName: candidateData.panelistName,
        scores: JSON.stringify(interviewScores),
        remarks: interviewRemarks,
        totalScore: String(totalScore),
        maxScore: String(maxScore),
        submissionTime: new Date().toISOString()
      };
      
      await fetch(BENCH_PLANNING_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString()
      });
      
      setSubmitStatus('success');
      hapticFeedback.success();
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error submitting interview:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit. Please try again.');
      hapticFeedback.error();
    } finally {
      setLoading(false);
    }
  };
  
  // Render Readiness Checklist Tab
  const renderReadinessTab = () => {
    const isManager = userType === 'manager' || userType === 'admin';
    const canEdit = isManager && readinessStatus === 'not_started';
    
    return (
      <div className="space-y-6">
        {/* Status Banner */}
        {readinessStatus !== 'not_started' && (
          <div className={`p-4 rounded-lg border ${
            readinessStatus === 'passed' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : readinessStatus === 'failed'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              {readinessStatus === 'passed' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">
                    Readiness Assessment Passed - Self Assessment Unlocked
                  </span>
                </>
              ) : readinessStatus === 'failed' ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-900 dark:text-red-100">
                    Readiness Assessment Not Passed - Needs Improvement
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">
                    Readiness Assessment Pending
                  </span>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Info Card */}
        {candidateData && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Candidate Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Employee Name</p>
                <p className="font-medium text-gray-900 dark:text-slate-100">{candidateData.employeeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Employee ID</p>
                <p className="font-medium text-gray-900 dark:text-slate-100">{candidateData.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Manager</p>
                <p className="font-medium text-gray-900 dark:text-slate-100">{candidateData.managerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Panelist</p>
                <p className="font-medium text-gray-900 dark:text-slate-100">{candidateData.panelistName}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Readiness Checklist Items */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Readiness Criteria (Score each item 1-5)
          </h3>
          
          {!isManager && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ℹ️ This checklist is filled by your reporting manager only.
              </p>
            </div>
          )}
          
          {isManager && readinessStatus !== 'not_started' && (
            <div className="mb-4 space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  ℹ️ Readiness checklist already submitted. You cannot modify it.
                </p>
              </div>
              {candidateData && (
                <div className={`p-4 rounded-lg border ${
                  readinessStatus === 'passed'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {readinessStatus === 'passed' ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        readinessStatus === 'passed'
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        Status: {readinessStatus === 'passed' ? 'PASSED ✓' : 'NOT PASSED ✗'}
                      </p>
                      <p className={`text-sm ${
                        readinessStatus === 'passed'
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        Employee: {candidateData.employeeName} ({candidateData.employeeId})
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            {READINESS_ITEMS.map((item, index) => (
              <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-slate-100">{item}</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        onClick={() => canEdit && setReadinessScores(prev => ({ ...prev, [index]: score }))}
                        disabled={!canEdit}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          readinessScores[index] === score
                            ? 'bg-blue-600 text-white shadow-lg scale-110'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Remarks */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={readinessRemarks}
              onChange={(e) => canEdit && setReadinessRemarks(e.target.value)}
              disabled={!canEdit}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 disabled:opacity-50"
              placeholder="Add any additional comments..."
            />
          </div>
          
          {/* Submit Button */}
          {canEdit && (
            <button
              onClick={handleSubmitReadiness}
              disabled={loading || Object.keys(readinessScores).length < READINESS_ITEMS.length}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              Submit Readiness Assessment
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Render Assessment Tab
  const renderAssessmentTab = () => {
    const isCandidate = userType === 'candidate';
    
    if (assessmentLocked) {
      // Determine the actual reason for lock
      let lockMessage = '';
      let hasTimeRestriction = false;
      
      // Check if readiness has been passed
      const readinessPassed = readinessStatus === 'passed';
      
      // Check if time restriction exists and hasn't been reached
      const timeNotReached = assessmentStatus?.assessmentUnlockDateTime && !assessmentStatus?.timeUnlocked;
      
      if (!readinessPassed) {
        // Readiness is the blocker
        if (readinessStatus === 'failed') {
          lockMessage = isCandidate
            ? 'You did not pass the Readiness Checklist (80% required). The assessment cannot be unlocked.'
            : 'The candidate did not pass the Readiness Checklist (80% required).';
        } else {
          lockMessage = isCandidate
            ? 'Your manager needs to complete the Readiness Checklist and you must pass (80% or above) before you can access the self-assessment.'
            : 'This assessment will be unlocked once the readiness checklist is completed and passed (80% or above).';
        }
      } else if (timeNotReached) {
        // Time restriction is the blocker
        hasTimeRestriction = true;
        const unlockDate = new Date(assessmentStatus.assessmentUnlockDateTime);
        const formattedDate = unlockDate.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata'
        });
        lockMessage = isCandidate
          ? `You have passed the Readiness Checklist. The assessment will be available on ${formattedDate}.`
          : `Assessment will unlock on ${formattedDate}.`;
      } else {
        // Fallback message
        lockMessage = isCandidate
          ? 'Your manager needs to complete the Readiness Checklist and you must pass (80% or above) before you can access the self-assessment.'
          : 'This assessment will be unlocked once the readiness checklist is completed and passed (80% or above).';
      }
      
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Lock className="w-16 h-16 text-gray-400 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Assessment Locked
          </h3>
          <p className="text-gray-600 dark:text-slate-400 text-center max-w-md">
            {lockMessage}
          </p>
          {hasTimeRestriction && (
            <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
              ⏰ Time-restricted access enabled
            </p>
          )}
        </div>
      );
    }
    
    if (assessmentAttempted && !isCandidate) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className={`p-4 rounded-full mb-4 ${
            assessmentPassed 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            {assessmentPassed ? (
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Assessment {assessmentPassed ? 'Passed' : 'Not Passed'}
          </h3>
          <p className="text-gray-600 dark:text-slate-400">
            The candidate has completed their self-assessment.
          </p>
        </div>
      );
    }
    
    if (assessmentAttempted && isCandidate) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Assessment Already Attempted
          </h3>
          <p className="text-gray-600 dark:text-slate-400 text-center max-w-md">
            You have already completed this assessment. Only one attempt is allowed.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            ⚠️ Important: You have only ONE attempt for this assessment. Make sure you're ready before starting.
          </p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Self Assessment
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
            {assessmentQuestions.length > 0 
              ? `Answer all ${assessmentQuestions.length} questions. Passing threshold: 80% (${Math.ceil(assessmentQuestions.length * 0.8)} correct answers required)`
              : 'Loading assessment questions...'
            }
          </p>
          
          {assessmentQuestions.length > 0 ? (
            <div className="space-y-6">
              {assessmentQuestions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-5">
                  <div className="flex gap-3 mb-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <p className="flex-1 font-medium text-gray-900 dark:text-slate-100 leading-relaxed">
                      {question.question}
                    </p>
                  </div>
                  
                  <div className="ml-11 space-y-2">
                    {Object.entries(question.options).map(([optionKey, optionValue]) => (
                      <label 
                        key={optionKey}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          assessmentAnswers[question.id] === optionKey
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                        } ${!isCandidate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optionKey}
                          checked={assessmentAnswers[question.id] === optionKey}
                          onChange={(e) => isCandidate && setAssessmentAnswers(prev => ({
                            ...prev,
                            [question.id]: e.target.value
                          }))}
                          disabled={!isCandidate}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="flex-1 text-sm text-gray-700 dark:text-slate-300">
                          <span className="font-semibold">{optionKey}.</span> {optionValue as string}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              Loading questions...
            </div>
          )}
          
          <button
            onClick={handleSubmitAssessment}
            disabled={loading || !isCandidate || assessmentQuestions.length === 0 || Object.keys(assessmentAnswers).length < assessmentQuestions.length}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-5 h-5" />
            Submit Assessment (One Attempt Only)
          </button>
        </div>
      </div>
    );
  };
  
  // Render Interview Tab
  const renderInterviewTab = () => {
    const isPanelist = userType === 'panelist' || userType === 'admin';
    
    if (interviewLocked) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Lock className="w-16 h-16 text-gray-400 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Interview Locked
          </h3>
          <p className="text-gray-600 dark:text-slate-400 text-center max-w-md">
            The interview will be unlocked once the candidate passes the self-assessment.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Info */}
        {candidateData && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Interview Evaluation</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Candidate</p>
                <p className="font-medium text-gray-900 dark:text-slate-100">{candidateData.employeeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Panelist</p>
                <p className="font-medium text-gray-900 dark:text-slate-100">{candidateData.panelistName}</p>
              </div>
            </div>
          </div>
        )}
        
        {!isPanelist && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              ℹ️ This interview evaluation is filled by the designated panelist only.
            </p>
          </div>
        )}
        
        {/* Interview Sections */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Evaluation Criteria (Score each section 1-5)
          </h3>
          
          <div className="space-y-4">
            {INTERVIEW_SECTIONS.map((section, index) => (
              <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-slate-100">{section}</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        onClick={() => isPanelist && setInterviewScores(prev => ({ ...prev, [index]: score }))}
                        disabled={!isPanelist}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          interviewScores[index] === score
                            ? 'bg-purple-600 text-white shadow-lg scale-110'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        } ${!isPanelist ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Remarks */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Overall Comments
            </label>
            <textarea
              value={interviewRemarks}
              onChange={(e) => isPanelist && setInterviewRemarks(e.target.value)}
              disabled={!isPanelist}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 disabled:opacity-50"
              placeholder="Add your overall evaluation comments..."
            />
          </div>
          
          {/* Submit Button */}
          {isPanelist && (
            <button
              onClick={handleSubmitInterview}
              disabled={loading || Object.keys(interviewScores).length < INTERVIEW_SECTIONS.length}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              Submit Interview Evaluation
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="animate-pulse space-y-6">
              {/* Header Skeleton */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
              
              {/* Tabs Skeleton */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 pb-2">
                <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
              </div>
              
              {/* Content Skeleton */}
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
              </div>
              
              {/* Button Skeleton */}
              <div className="flex gap-4">
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Loading candidate data...</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Bench Planning | Barista to Shift Manager
            </h1>
          </div>
          {/* Exit Button */}
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md"
          >
            <LogOut className="w-4 h-4" />
            Exit
          </button>
        </div>
        <p className="text-gray-600 dark:text-slate-400">
          Comprehensive readiness assessment, self-evaluation, and interview process for bench candidates.
        </p>
      </div>
      
      {/* Not Eligible Message */}
      {notEligible && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-8 border-2 border-yellow-400 dark:border-yellow-600 mb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                Access Restricted
              </h2>
              <p className="text-gray-700 dark:text-slate-300 text-lg mb-2">
                This module is only available for shortlisted bench planning candidates.
              </p>
              <p className="text-gray-600 dark:text-slate-400">
                If you believe this is an error, please contact your manager or HR.
              </p>
            </div>
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md mt-4"
            >
              <LogOut className="w-4 h-4" />
              Return to Login
            </button>
          </div>
        </div>
      )}
      
      {/* Candidate Selection (for managers/panelists/admins) */}
      {!candidateData && !notEligible && (userType === 'manager' || userType === 'panelist' || userType === 'admin') && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            {userType === 'manager' ? 'Select Your Team Member' : 'Load Candidate Data'}
          </h3>
          
          {/* Dropdown for managers with their candidates */}
          {userType === 'manager' && managerCandidates.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Select Candidate
                </label>
                <select
                  value={candidateSearchId}
                  onChange={(e) => {
                    setCandidateSearchId(e.target.value);
                    if (e.target.value) {
                      loadCandidateData(e.target.value);
                    }
                  }}
                  disabled={loadingCandidates || loading}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">-- Select a team member --</option>
                  {managerCandidates.map((candidate) => (
                    <option key={candidate.employeeId} value={candidate.employeeId}>
                      {candidate.employeeName} ({candidate.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              
              {loadingCandidates && (
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Loading your team members...
                </p>
              )}
            </div>
          )}
          
          {/* Fallback search for panelists/admins or if no candidates found */}
          {(userType !== 'manager' || managerCandidates.length === 0) && (
            <div className="space-y-4">
              {userType === 'manager' && !loadingCandidates && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                  No team members found. You can search manually:
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={candidateSearchId}
                  onChange={(e) => setCandidateSearchId(e.target.value)}
                  placeholder="Enter Employee ID..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
                <button
                  onClick={() => loadCandidateData(candidateSearchId)}
                  disabled={!candidateSearchId || loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  Load
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Tab Navigation */}
      {!notEligible && candidateData && (
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('readiness')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'readiness'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span>Readiness Checklist</span>
            {readinessStatus === 'passed' && <CheckCircle className="w-4 h-4 text-green-600" />}
            {assessmentLocked && <Lock className="w-4 h-4" />}
          </button>
          
          {/* Only show Assessment and Interview tabs for candidates */}
          {userType === 'candidate' && (
            <>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'assessment'
                  ? 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
                  : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span>Self Assessment</span>
              {assessmentLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-green-600" />}
              {assessmentPassed && <CheckCircle className="w-4 h-4 text-green-600" />}
            </button>
            
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'interview'
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Interview</span>
              {interviewLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-green-600" />}
            </button>
          </>
        )}
        </div>
      )}
      
      {/* Status Messages */}
      {!notEligible && submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-900 dark:text-green-100">Submitted successfully!</span>
        </div>
      )}
      
      {!notEligible && submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-900 dark:text-red-100">{errorMessage || 'Submission failed'}</span>
        </div>
      )}
      
      {/* Tab Content */}
      {!notEligible && (
        <div className="mb-8">
          {activeTab === 'readiness' && renderReadinessTab()}
          {activeTab === 'assessment' && renderAssessmentTab()}
          {activeTab === 'interview' && renderInterviewTab()}
        </div>
      )}
    </div>
  );
};

export default BenchPlanningChecklist;
