import React, { useState, useEffect } from 'react';
import { UserRole } from '../../roleMapping';
import { Users, ClipboardCheck, Brain, MessageSquare, Save, CheckCircle, AlertCircle, ArrowLeft, Lock, Unlock, XCircle, LogOut, LayoutDashboard } from 'lucide-react';
import LoadingOverlay from '../LoadingOverlay';
import { hapticFeedback } from '../../utils/haptics';
import { BenchCandidate, ReadinessChecklistItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import BenchPlanningSMASMPanelistDashboard from './BenchPlanningSMASMPanelistDashboard';

interface BenchPlanningChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

type TabType = 'readiness' | 'assessment' | 'interview';

// Google Apps Script endpoint - UPDATE THIS with your deployed SM-ASM script URL
const BENCH_PLANNING_SM_ASM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyMynWOxjrwi4892AKUTVgFizmGzkn_CEKUPyv7PHpTAFmSNGbpx1kJMS8Y3wVNV-eJnA/exec';

// Readiness checklist items for SM to ASM level
const READINESS_ITEMS = [
  'Has successfully managed full shifts independently with consistent quality standards',
  'Demonstrates strong leadership in coaching and developing team members',
  'Shows consistent ability to handle peak hours and complex operational challenges',
  'Has completed all advanced training modules including P&L basics and inventory management',
  'Exhibits strong problem-solving skills and decision-making capabilities',
  'Maintains excellent communication with store team, AM, and support functions',
  'Shows initiative in driving store performance metrics (sales, quality, guest satisfaction)',
  'Has experience managing conflict resolution and challenging guest situations',
  'Demonstrates understanding of cost control, wastage management, and labour scheduling',
  'Can open and close the store independently following all protocols',
  'Shows commitment to TWC values and acts as a role model for the team'
];

// Interview sections - Core Competencies
const INTERVIEW_SECTIONS = [
  'Responsibility',
  'Empathy',
  'Service Excellence',
  'Performance with Purpose',
  'Ethics and Integrity',
  'Collaboration',
  'Trust'
];

// Assessment Questions for SM to ASM level (Shuffled)
const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: "Last month's total sales were ₹5,50,000. This month it dropped by 10%. What are this month's sales?",
    options: {
      A: "₹4,95,000",
      B: "₹4,85,000",
      C: "₹5,25,000",
      D: "₹5,00,000"
    },
    correctAnswer: "A"
  },
  {
    id: 2,
    question: "You have ₹1,20,000 as your monthly budget for inventory. You've already spent ₹86,000. How much balance remains?",
    options: {
      A: "₹36,000",
      B: "₹38,000",
      C: "₹34,000",
      D: "₹40,000"
    },
    correctAnswer: "C"
  },
  {
    id: 3,
    question: "The cost of making one beverage is ₹55, and it is sold at ₹130. What is the profit margin per drink?",
    options: {
      A: "₹65",
      B: "₹75",
      C: "₹85",
      D: "₹95"
    },
    correctAnswer: "B"
  },
  {
    id: 4,
    question: "Your store's target is ₹6,00,000. You've achieved ₹4,20,000 in 20 days. What's the required daily average for the remaining 10 days?",
    options: {
      A: "₹15,000",
      B: "₹18,000",
      C: "₹20,000",
      D: "₹22,000"
    },
    correctAnswer: "B"
  },
  {
    id: 5,
    question: "Your average daily sales are ₹18,000. Your gross margin is 60%. What is your approximate monthly gross profit (30 days)?",
    options: {
      A: "₹3,00,000",
      B: "₹3,60,000",
      C: "₹3,24,000",
      D: "₹4,20,000"
    },
    correctAnswer: "C"
  },
  {
    id: 6,
    question: "A beverage's ingredient cost is ₹35. If wastage is 8% and spoilage loss is 5%, what is the adjusted cost per beverage?",
    options: {
      A: "₹37.50",
      B: "₹38.85",
      C: "₹40.25",
      D: "₹41.20"
    },
    correctAnswer: "D"
  },
  {
    id: 7,
    question: "A barista makes an error in a drink three times in one shift. What's your first response?",
    options: {
      A: "Issue warning letter",
      B: "Ignore – busy shift",
      C: "Observe and retrain",
      D: "Replace them on shift"
    },
    correctAnswer: "C"
  },
  {
    id: 8,
    question: "If A is faster than B, B is faster than C, but C is most accurate, whom do you schedule during a high-accuracy order window?",
    options: {
      A: "A",
      B: "C",
      C: "B",
      D: "A and C"
    },
    correctAnswer: "B"
  },
  {
    id: 9,
    question: "You need 5 staff to manage the floor, but one has called in sick. What do you do first?",
    options: {
      A: "Call backup staff",
      B: "Reduce service area",
      C: "Skip Breaks",
      D: "Do nothing"
    },
    correctAnswer: "A"
  },
  {
    id: 10,
    question: "A customer orders 4 beverages, but the system only bills for 3. What do you do?",
    options: {
      A: "Let it go",
      B: "Inform customer and add item",
      C: "Adjust from another order",
      D: "Pay difference yourself"
    },
    correctAnswer: "B"
  },
  {
    id: 11,
    question: "You have to reduce 10 labor hours per week while maintaining service. Which solution is most efficient?",
    options: {
      A: "Reduce each staff's shift by 30 minutes",
      B: "Remove one low traffic shift/lean shift entirely",
      C: "Shorten peak hours",
      D: "Cut breaks"
    },
    correctAnswer: "B"
  },
  {
    id: 12,
    question: "A system generates the following pattern of sales increase: 5%, 10%, 15%, 20%… What would be the % increase in the 6th week?",
    options: {
      A: "30%",
      B: "35%",
      C: "40%",
      D: "25%"
    },
    correctAnswer: "D"
  },
  {
    id: 13,
    question: "During peak time, your POS system crashes. What's your action?",
    options: {
      A: "Stop service",
      B: "Use manual billing after informing the AM",
      C: "Wait for IT",
      D: "Inform customers and close the store"
    },
    correctAnswer: "B"
  },
  {
    id: 14,
    question: "You're promoted over a peer who expected the role. They're demotivated and disengaging. You:",
    options: {
      A: "Assign fewer responsibilities",
      B: "Address it 1:1, acknowledge the situation, and re-engage",
      C: "Let them cool off on their own",
      D: "Involve HR directly"
    },
    correctAnswer: "B"
  },
  {
    id: 15,
    question: "You are asked to lead two new stores temporarily, but your own store is under-staffed. What's your approach?",
    options: {
      A: "Delegate internally and develop one team member as acting lead",
      B: "Decline the opportunity",
      C: "Ask for external support",
      D: "Take it on and manage all yourself"
    },
    correctAnswer: "A"
  },
  {
    id: 16,
    question: "How often should you appreciate your team?",
    options: {
      A: "Only for major achievements",
      B: "Rarely",
      C: "Publicly and often for small wins",
      D: "Once a month"
    },
    correctAnswer: "C"
  },
  {
    id: 17,
    question: "Your team consistently meets targets, but morale is low. You:",
    options: {
      A: "Celebrate small wins",
      B: "Increase targets",
      C: "Let them continue",
      D: "Avoid change"
    },
    correctAnswer: "A"
  },
  {
    id: 18,
    question: "You've received a customer complaint on social media about rude service. What is your priority?",
    options: {
      A: "Delete the comment",
      B: "Apologize publicly and take it offline",
      C: "Privately message the customer",
      D: "Give discount on next visit"
    },
    correctAnswer: "B"
  },
  {
    id: 19,
    question: "A delivery vendor is late for the third time in a week, impacting morning prep. What's the ideal response?",
    options: {
      A: "Cancel the vendor immediately",
      B: "Apologize publicly and take it offline",
      C: "Raise an SLA concern and request urgent resolution",
      D: "Accept and move on"
    },
    correctAnswer: "C"
  },
  {
    id: 20,
    question: "You observe shortcuts being taken during cleaning. You:",
    options: {
      A: "Suspend team",
      B: "Inform area manager",
      C: "Coach the team",
      D: "Ignore — it's minor"
    },
    correctAnswer: "C"
  }
];

const BenchPlanningSMASMChecklist: React.FC<BenchPlanningChecklistProps> = ({ 
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
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  
  // Interview State
  const [interviewScores, setInterviewScores] = useState<{ [key: number]: number }>({});
  const [interviewRemarks, setInterviewRemarks] = useState('');
  const [interviewLocked, setInterviewLocked] = useState(true);
  
  // Determine user type (manager, candidate, or panelist)
  const [userType, setUserType] = useState<'manager' | 'candidate' | 'panelist' | 'admin'>('candidate');
  const [isPanelistConfirmed, setIsPanelistConfirmed] = useState(false);
  
  // Panelist view state - dashboard or interview form
  const [panelistView, setPanelistView] = useState<'dashboard' | 'interview'>('dashboard');
  
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
      const response = await fetch(`${BENCH_PLANNING_SM_ASM_ENDPOINT}?action=getManagerCandidates&managerId=${managerId}&_t=${new Date().getTime()}`);
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
  
  // Load panelist's assigned candidates
  const loadPanelistCandidates = async (panelistId: string): Promise<boolean> => {
    try {
      setLoadingCandidates(true);
      console.log('[SM-ASM BENCH] Checking if user is a panelist:', panelistId);
      const response = await fetch(
        `${BENCH_PLANNING_SM_ASM_ENDPOINT}?action=getPanelistCandidates&panelistId=${panelistId}&_t=${new Date().getTime()}`
      );
      const data = await response.json();
      
      if (data.success && data.candidates && data.candidates.length > 0) {
        console.log('[SM-ASM BENCH] User is a panelist with', data.candidates.length, 'candidates');
        setIsPanelistConfirmed(true);
        setUserType('panelist');
        return true;
      }
      return false;
    } catch (error) {
      console.log('Not a panelist:', error.message);
      return false;
    } finally {
      setLoadingCandidates(false);
    }
  };
  
  // Load candidate data from Google Sheets
  const loadCandidateData = async (employeeId: string) => {
    try {
      setLoading(true);
      setNotEligible(false);
      const response = await fetch(`${BENCH_PLANNING_SM_ASM_ENDPOINT}?action=getCandidateData&employeeId=${employeeId}&_t=${new Date().getTime()}`);
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
          console.log('[SM-ASM ASSESSMENT] Raw assessment data received:', {
            attempted: data.assessmentStatus.attempted,
            hasAnswers: !!data.assessmentStatus.answers,
            answersType: typeof data.assessmentStatus.answers,
            score: data.assessmentStatus.score,
            passed: data.assessmentStatus.passed,
            answers: data.assessmentStatus.answers
          });
          
          // If assessment was attempted and we have answers, recalculate score on frontend
          if (data.assessmentStatus.attempted && data.assessmentStatus.answers) {
            const answers = data.assessmentStatus.answers;
            let correctCount = 0;
            
            // Count correct answers using current frontend question definitions
            ASSESSMENT_QUESTIONS.forEach(question => {
              const userAnswer = answers[question.id];
              if (userAnswer === question.correctAnswer) {
                correctCount++;
              }
            });
            
            const totalQuestions = ASSESSMENT_QUESTIONS.length;
            const recalculatedScore = parseFloat(((correctCount / totalQuestions) * 100).toFixed(2));
            const recalculatedPassed = recalculatedScore >= 80;
            
            console.log('[SM-ASM ASSESSMENT] Recalculated score:', {
              correctCount,
              totalQuestions,
              score: recalculatedScore,
              passed: recalculatedPassed,
              originalScore: data.assessmentStatus.score,
              originalPassed: data.assessmentStatus.passed
            });
            
            // Use recalculated values
            setAssessmentStatus({
              ...data.assessmentStatus,
              score: recalculatedScore,
              passed: recalculatedPassed,
              totalScore: correctCount,
              maxScore: totalQuestions
            });
            setAssessmentPassed(recalculatedPassed);
          } else {
            console.log('[SM-ASM ASSESSMENT] Using original score (no answers available for recalculation)');
            setAssessmentStatus(data.assessmentStatus);
            setAssessmentPassed(data.assessmentStatus.passed);
          }
          
          setAssessmentLocked(!data.assessmentStatus.unlocked);
          setAssessmentAttempted(data.assessmentStatus.attempted);
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
  
  // Load data on component mount if user ID is available - SEQUENTIAL CHECKS
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!userId) {
        return;
      }
      
      console.log('[SM-ASM BENCH] Starting sequential check for user:', userId);
      setLoading(true);
      setNotEligible(false);
      
      // Step 1: Check if user is a panelist (highest priority)
      console.log('[SM-ASM BENCH] Step 1: Checking panelist role...');
      const isPanelist = await loadPanelistCandidates(userId);
      console.log('[SM-ASM BENCH] Panelist check result:', isPanelist);
      if (isPanelist) {
        setLoading(false);
        return; // Stop here, user is confirmed panelist
      }
      
      // Step 2: Check if user is a candidate
      console.log('[SM-ASM BENCH] Step 2: Checking candidate role...');
      await loadCandidateData(userId);
      
      // Step 3: Also check if user is a manager
      console.log('[SM-ASM BENCH] Step 3: Checking manager role...');
      await loadManagerCandidates(userId);
      
      setLoading(false);
    };
    
    checkUserAccess();
  }, [userId]);
  
  // After both data loads complete, determine eligibility
  useEffect(() => {
    // If user is confirmed as panelist, candidate, or manager - they are eligible
    if (isPanelistConfirmed || candidateData || managerCandidates.length > 0) {
      setNotEligible(false);
    } 
    // Only set notEligible if:
    // 1. User is not a panelist (not isPanelistConfirmed)
    // 2. User is not a candidate (no candidateData)
    // 3. User is not a manager (no managerCandidates)
    // 4. Loading is complete
    else if (!loading && !loadingCandidates && userId) {
      setNotEligible(true);
    }
  }, [loading, loadingCandidates, isPanelistConfirmed, candidateData, managerCandidates, userId]);
  
  // Set assessment questions from hardcoded data when assessment is unlocked
  useEffect(() => {
    if (!assessmentLocked && assessmentQuestions.length === 0) {
      setAssessmentQuestions(ASSESSMENT_QUESTIONS);
    }
  }, [assessmentLocked, assessmentQuestions.length]);
  
  // Set user type to manager/admin if manager candidates are loaded but user is not a candidate
  useEffect(() => {
    if (managerCandidates.length > 0 && !candidateData) {
      // If we have manager candidates but no candidate data, user is a manager or admin
      if (authRole === 'admin') {
        setUserType('admin');
      } else {
        setUserType('manager');
      }
      // Clear the not eligible flag since they're a valid manager
      setNotEligible(false);
    }
  }, [managerCandidates, candidateData, authRole]);
  
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
      
      const response = await fetch(BENCH_PLANNING_SM_ASM_ENDPOINT, {
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
    if (!candidateData || isSubmittingAssessment) return;
    
    // Validate all questions are answered
    const allAnswered = assessmentQuestions.every(q => assessmentAnswers[q.id]);
    if (!allAnswered) {
      setErrorMessage('Please answer all questions before submitting');
      return;
    }
    
    try {
      setIsSubmittingAssessment(true);
      setLoading(true);
      hapticFeedback.select();
      
      const params = {
        action: 'submitAssessment',
        employeeId: candidateData.employeeId,
        employeeName: candidateData.employeeName,
        answers: JSON.stringify(assessmentAnswers),
        submissionTime: new Date().toISOString()
      };
      
      console.log('Submitting SM-ASM assessment with params:', params);
      console.log('Answers object:', assessmentAnswers);
      console.log('Questions count:', assessmentQuestions.length);
      
      const response = await fetch(BENCH_PLANNING_SM_ASM_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString()
      });
      
      console.log('SM-ASM assessment submission sent successfully');
      
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
      setIsSubmittingAssessment(false);
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
      
      await fetch(BENCH_PLANNING_SM_ASM_ENDPOINT, {
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
          
          <div className="space-y-3 sm:space-y-4">
            {READINESS_ITEMS.map((item, index) => (
              <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base text-gray-900 dark:text-slate-100">{item}</p>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 justify-end">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        onClick={() => canEdit && setReadinessScores(prev => ({ ...prev, [index]: score }))}
                        disabled={!canEdit}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-medium text-sm sm:text-base transition-all shrink-0 ${
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
      const passed = assessmentStatus?.passed || assessmentPassed;
      const score = assessmentStatus?.score;
      
      return (
        <div className="flex flex-col items-center justify-center py-12">
          {passed ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                Assessment Passed! ✓
              </h3>
              <p className="text-gray-600 dark:text-slate-400 text-center max-w-md mb-4">
                Congratulations! You have successfully completed the assessment.
              </p>
              {score !== undefined && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                    Your Score: {score}%
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 text-red-500 mb-4" />
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                Assessment Not Passed
              </h3>
              <p className="text-gray-600 dark:text-slate-400 text-center max-w-md mb-4">
                Unfortunately, you did not meet the passing threshold of 80%.
              </p>
              {score !== undefined && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                    Your Score: {score}%
                  </p>
                </div>
              )}
            </>
          )}
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
                        } ${(!isCandidate || assessmentAttempted) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optionKey}
                          checked={assessmentAnswers[question.id] === optionKey}
                          onChange={(e) => isCandidate && !assessmentAttempted && setAssessmentAnswers(prev => ({
                            ...prev,
                            [question.id]: e.target.value
                          }))}
                          disabled={!isCandidate || assessmentAttempted}
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
            disabled={loading || !isCandidate || assessmentAttempted || isSubmittingAssessment || assessmentQuestions.length === 0 || Object.keys(assessmentAnswers).length < assessmentQuestions.length}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-5 h-5" />
            {assessmentAttempted ? 'Assessment Already Submitted' : 'Submit Assessment (One Attempt Only)'}
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
          
          <div className="space-y-3 sm:space-y-4">
            {INTERVIEW_SECTIONS.map((section, index) => (
              <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-slate-100">{section}</p>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 justify-end">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        onClick={() => isPanelist && setInterviewScores(prev => ({ ...prev, [index]: score }))}
                        disabled={!isPanelist}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-medium text-sm sm:text-base transition-all shrink-0 ${
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
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse p-4 md:p-6 transition-all duration-300 ease-in-out">
        {/* Full Page Skeleton Header */}
        <div className="bg-gray-100 dark:bg-slate-800/50 rounded-xl p-6 mb-8 border border-gray-200 dark:border-slate-700">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
               <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-64 md:w-96"></div>
             </div>
             <div className="w-32 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
           </div>
           <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full md:w-1/2"></div>
        </div>
        
        {/* Content Card Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Tabs Skeleton */}
            <div className="border-b border-gray-200 dark:border-slate-700 p-2 bg-gray-50 dark:bg-slate-800/50">
               <div className="flex gap-2 overflow-x-auto p-1">
                 <div className="h-10 w-32 bg-gray-200 dark:bg-slate-700 rounded-lg shrink-0"></div>
                 <div className="h-10 w-32 bg-gray-200 dark:bg-slate-700 rounded-lg shrink-0"></div>
                 <div className="h-10 w-32 bg-gray-200 dark:bg-slate-700 rounded-lg shrink-0"></div>
               </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-8">
                {/* Simulated Checklist Items */}
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 p-4 border border-gray-100 dark:border-slate-700/50 rounded-lg">
                       <div className="shrink-0 w-6 h-6 bg-gray-200 dark:bg-slate-700 rounded bg-opacity-50"></div>
                       <div className="flex-1 space-y-3">
                          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-11/12"></div>
                          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 opacity-70"></div>
                       </div>
                    </div>
                  ))}
                </div>
            </div>
        </div>
        
        {/* Loading Indicator Pill */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-lg border border-gray-200 dark:border-slate-700 flex items-center gap-3 z-50">
             <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
             <span className="font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">Loading candidate data...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 sm:p-6 mb-4 sm:mb-6 border border-purple-200 dark:border-purple-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400 shrink-0" />
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100 leading-tight">
              Bench Planning | SM to ASM
            </h1>
          </div>
          {/* Exit Button */}
          <button
            onClick={handleExit}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md shrink-0 self-start sm:self-auto"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            Exit
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
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
      
      {/* Panelist Dashboard View */}
      {!notEligible && isPanelistConfirmed && !candidateData && panelistView === 'dashboard' && (
        <BenchPlanningSMASMPanelistDashboard
          panelistId={userId}
          panelistName={userName || 'Panelist'}
          onTakeInterview={(candidate) => {
            setPanelistView('interview');
            setActiveTab('interview'); // Automatically show interview tab for panelists
            setCandidateSearchId(candidate.employeeId);
            loadCandidateData(candidate.employeeId);
          }}
        />
      )}
      
      {/* Back to Dashboard button for panelists */}
      {!notEligible && isPanelistConfirmed && candidateData && panelistView === 'interview' && (
        <div className="mb-6">
          <button
            onClick={() => {
              setPanelistView('dashboard');
              setCandidateData(null);
              setCandidateSearchId('');
              setActiveTab('readiness'); // Reset tab when returning to dashboard
            }}
            className="flex items-center gap-2 px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors font-medium"
          >
            <LayoutDashboard className="w-5 h-5" />
            Back to Candidate List
          </button>
        </div>
      )}
      
      {/* Candidate Selection (for managers/admins only - panelists use dashboard) */}
      {!candidateData && !notEligible && (userType === 'manager' || userType === 'admin') && (
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
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 dark:border-slate-700 overflow-x-auto scrollbar-hide -mx-2 sm:mx-0 px-2 sm:px-0">
          <button
            onClick={() => setActiveTab('readiness')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-xs sm:text-sm md:text-base ${
              activeTab === 'readiness'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Readiness</span>
            {readinessStatus === 'passed' && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
            {assessmentLocked && <Lock className="w-3 h-3 sm:w-4 sm:h-4" />}
          </button>
          
          {/* Only show Assessment and Interview tabs for candidates */}
          {userType === 'candidate' && (
            <>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-xs sm:text-sm md:text-base ${
                activeTab === 'assessment'
                  ? 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
                  : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Assessment</span>
              {assessmentLocked ? <Lock className="w-3 h-3 sm:w-4 sm:h-4" /> : <Unlock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
              {assessmentPassed && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
            </button>
            
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-xs sm:text-sm md:text-base ${
                activeTab === 'interview'
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
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
      {!notEligible && !(isPanelistConfirmed && panelistView === 'dashboard') && (
        <div className="mb-8">
          {activeTab === 'readiness' && renderReadinessTab()}
          {activeTab === 'assessment' && renderAssessmentTab()}
          {activeTab === 'interview' && renderInterviewTab()}
        </div>
      )}
    </div>
  );
};

export default BenchPlanningSMASMChecklist;
