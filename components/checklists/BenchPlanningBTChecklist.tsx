import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, QrCode, ClipboardCheck, Users, AlertCircle, Award, Save, Brain } from 'lucide-react';
import { UserRole } from '../../roleMapping';

const BT_BENCH_PLANNING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwsKR3l5f8kYZIprU-k0F4pnWKCCLcwlfSJXdjLjxHWUAuW9XfZoODgbE_kqp6iYKEy0Q/exec';

interface BenchPlanningBTChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists: () => void;
  initialStep?: 'readiness' | 'bt-session' | 'skill-check';
}

type BTStep = 'readiness' | 'bt-session' | 'skill-check';

interface Metadata {
  employeeId: string;
  employeeName: string;
  storeId: string;
  storeName: string;
  managerId: string;
  managerName: string;
}

interface ReadinessQuestion {
  id: string;
  text: string;
}

interface ReadinessCategory {
  id: string;
  title: string;
  questions: ReadinessQuestion[];
}

const READINESS_CATEGORIES: ReadinessCategory[] = [
  {
    id: 'people-skills',
    title: 'People Skills',
    questions: [
      { id: 'PS_1', text: 'Recognized as a peer leader by colleagues' },
      { id: 'PS_2', text: 'Respects and values all people equally' },
      { id: 'PS_3', text: 'Demonstrates friendliness and professionalism' },
      { id: 'PS_4', text: 'Communicates clearly and effectively' },
      { id: 'PS_5', text: 'Recognizes and appreciates the work of others' },
      { id: 'PS_6', text: 'Trains/Coaches fellow partners on correct procedures' },
      { id: 'PS_7', text: 'Shares knowledge and experience with new Partners' },
      { id: 'PS_8', text: 'Willing to answer queries without being asked' },
      { id: 'PS_9', text: 'Learns from mistakes and applies feedback' }
    ]
  },
  {
    id: 'customer-service',
    title: 'Customer Service Skills',
    questions: [
      { id: 'CS_1', text: 'Delivers 100% customer-centric service (Follow C.O.F.F.E.E) with a "Can-Do Attitude"' },
      { id: 'CS_2', text: 'Maintains proper uniform and follows grooming standards' },
      { id: 'CS_3', text: 'Handles customer concerns using L.E.A.S.T.' },
      { id: 'CS_4', text: 'Confidently answers customer queries' },
      { id: 'CS_5', text: 'Ensures consistent product quality (Never serves a poor-quality product to customers)' },
      { id: 'CS_6', text: 'Understands and follows Customer Service & TWC processes' },
      { id: 'CS_7', text: 'Proactively resolves customer complaints' },
      { id: 'CS_8', text: 'Goes the extra mile to satisfy customers' }
    ]
  },
  {
    id: 'work-ethic',
    title: 'Work Ethic & Business Contribution',
    questions: [
      { id: 'WE_1', text: 'Displays a positive attitude at work' },
      { id: 'WE_2', text: 'Punctual and supports team when short-staffed' },
      { id: 'WE_3', text: 'Suggests improvements for store operations' },
      { id: 'WE_4', text: 'Shows interest in business results' },
      { id: 'WE_5', text: 'Follows the "Clean as You Go" principle' },
      { id: 'WE_6', text: 'Adheres to restaurant safety procedures' }
    ]
  }
];

const PASSING_SCORE = 45;
const MAX_SCORE = 46; // 23 questions × 2 points max

interface SkillCheckQuestion {
  id: string;
  step: string;
  standard: string;
}

interface SkillCheckPhase {
  id: string;
  title: string;
  questions: SkillCheckQuestion[];
}

const SKILL_CHECK_PHASES: SkillCheckPhase[] = [
  {
    id: 'prepare',
    title: 'Prepare',
    questions: [
      {
        id: 'PREP_1',
        step: 'Trainer is knowledgeable',
        standard: 'Trainer has in-depth knowledge of the task and procedures before training.'
      },
      {
        id: 'PREP_2',
        step: 'Trainer gathers the required tools & information',
        standard: 'Trainer prepares necessary materials and references before starting the session.'
      },
      {
        id: 'PREP_3',
        step: 'Trainer informs the Trainee what he/she is going to learn',
        standard: 'Clearly explains the objective of the training.'
      },
      {
        id: 'PREP_4',
        step: 'Puts Learner at ease',
        standard: 'Uses a friendly tone, smiles, and reassures that mistakes are part of learning.'
      },
      {
        id: 'PREP_5',
        step: 'Breaks the learning into smaller steps',
        standard: 'Training is structured into manageable, step-by-step instructions.'
      }
    ]
  },
  {
    id: 'present',
    title: 'Present',
    questions: [
      {
        id: 'PRES_1',
        step: 'Shows training tools to the trainee',
        standard: 'Introduces learning materials and tools to encourage self-learning.'
      },
      {
        id: 'PRES_2',
        step: 'Shows & tells the skill',
        standard: 'Demonstrates the skill while explaining each step clearly.'
      },
      {
        id: 'PRES_3',
        step: 'Explains why the skill is important',
        standard: 'Provides reasons behind each step, emphasizing its significance.'
      }
    ]
  },
  {
    id: 'practice',
    title: 'Practice',
    questions: [
      {
        id: 'PRAC_1',
        step: 'Asks the trainee to demonstrate the skill',
        standard: 'Trainee performs the skill under trainer\'s supervision.'
      },
      {
        id: 'PRAC_2',
        step: 'Encourages trainee to perform confidently',
        standard: 'Provides encouragement to the trainee during practice.'
      },
      {
        id: 'PRAC_3',
        step: 'Corrects any mistakes trainer makes',
        standard: 'Identifies errors and provides constructive feedback.'
      }
    ]
  },
  {
    id: 'follow-up',
    title: 'Follow-Up',
    questions: [
      {
        id: 'FU_1',
        step: 'Asks questions to ensure understanding',
        standard: 'Uses open-ended questions to check comprehension.'
      },
      {
        id: 'FU_2',
        step: 'Repeats Present & Practice if required',
        standard: 'Re-demonstrates and allows additional practice if needed.'
      }
    ]
  }
];

// Session Assessment Questions (15 MCQs)
const SESSION_ASSESSMENT_QUESTIONS = [
  {
    id: 'Q1',
    question: 'As a Buddy Trainer, your primary responsibility is to:',
    options: [
      'Complete tasks faster than the trainee',
      'Act as an extension of Field Trainers and support learning',
      'Ensure store targets are met',
      'Manage shifts'
    ],
    correctAnswer: 1
  },
  {
    id: 'Q2',
    question: 'What is the most important outcome of good buddy training?',
    options: [
      'Faster certification',
      'Reduced effort for the trainer',
      'Consistent Third Wave Coffee experience for customers',
      'Fewer questions from trainees'
    ],
    correctAnswer: 2
  },
  {
    id: 'Q3',
    question: 'Creating a good learning environment means:',
    options: [
      'Finishing training quickly',
      'Letting the trainee observe silently',
      'Making the trainee comfortable asking questions and making mistakes',
      'Training only during peak hours'
    ],
    correctAnswer: 2
  },
  {
    id: 'Q4',
    question: 'Why should a Buddy Trainer assess prior knowledge before teaching a skill?',
    options: [
      'To skip steps if possible',
      'To judge the trainee',
      'To adapt training based on the trainee\'s experience',
      'To reduce practice time'
    ],
    correctAnswer: 2
  },
  {
    id: 'Q5',
    question: 'If a trainee has NO experience with a skill, the Buddy Trainer should:',
    options: [
      'Demonstrate once and move on',
      'Let the trainee practice immediately',
      'Explain definitions, concepts, and demonstrate step by step',
      'Ask the trainee to observe another barista'
    ],
    correctAnswer: 2
  },
  {
    id: 'Q6',
    question: 'Which learning method helps trainees remember the most?',
    options: [
      'Reading',
      'Hearing',
      'Seeing',
      'Seeing, hearing, and doing'
    ],
    correctAnswer: 3
  },
  {
    id: 'Q7',
    question: 'Feedback should always be given with the intention to:',
    options: [
      'Correct mistakes immediately',
      'Show authority',
      'Help the trainee improve',
      'Finish training faster'
    ],
    correctAnswer: 2
  },
  {
    id: 'Q8',
    question: 'Treating feedback as a "gift" means the Buddy Trainer should:',
    options: [
      'Avoid difficult conversations',
      'Focus only on positives',
      'Help the trainee learn and grow from it',
      'Delay feedback'
    ],
    correctAnswer: 2
  },
  {
    id: 'Q9',
    question: 'Reinforcing feedback is used when:',
    options: [
      'The trainee makes a mistake',
      'The trainee performs a task correctly',
      'The trainee resists feedback',
      'The trainee lacks confidence'
    ],
    correctAnswer: 1
  },
  {
    id: 'Q10',
    question: 'Redirecting feedback should focus on:',
    options: [
      'The trainee\'s attitude',
      'What went wrong, what should be done, and why it matters',
      'The trainee\'s experience level',
      'Comparing the trainee to others'
    ],
    correctAnswer: 1
  },
  {
    id: 'Q11',
    question: 'Which approach is used for redirecting feedback?',
    options: [
      'Why–Why–What',
      'What–Why–How',
      'How–What–Why',
      'When–Where–How'
    ],
    correctAnswer: 1
  },
  {
    id: 'Q12',
    question: 'Trainees are more likely to remember if they:',
    options: [
      'Only observe the task',
      'Practice the task under supervision',
      'Read about it later',
      'Watch a video'
    ],
    correctAnswer: 1
  },
  {
    id: 'Q13',
    question: 'A trainee struggles to steam milk correctly. What should the Buddy Trainer do?',
    options: [
      'Do it for them',
      'Let them figure it out',
      'Demonstrate again, guide practice, and offer feedback',
      'Assign them to a different task'
    ],
    correctAnswer: 2
  },
  {
    id: 'Q14',
    question: 'The TWC Buddy Training philosophy is based on:',
    options: [
      'Speed and efficiency',
      'Practice, patience, and consistency',
      'Following instructions strictly',
      'Minimal supervision'
    ],
    correctAnswer: 1
  },
  {
    id: 'Q15',
    question: 'A Buddy Trainer should always:',
    options: [
      'Focus on what the trainee does wrong',
      'Praise publicly, redirect privately',
      'Train only during non-peak hours',
      'Avoid giving feedback'
    ],
    correctAnswer: 1
  }
];

const SESSION_ASSESSMENT_PASSING_SCORE = 12; // 80% of 15 questions

const BenchPlanningBTChecklist: React.FC<BenchPlanningBTChecklistProps> = ({
  userRole,
  onStatsUpdate,
  onBackToChecklists,
  initialStep = 'readiness'
}) => {
  console.log('🔵 [BT COMPONENT] BenchPlanningBTChecklist component is rendering!');
  
  const [currentStep, setCurrentStep] = useState<BTStep>(initialStep);
  const [readinessCompleted, setReadinessCompleted] = useState(false);
  const [btSessionCompleted, setBTSessionCompleted] = useState(false);
  const [sessionAssessmentCompleted, setSessionAssessmentCompleted] = useState(false);
  const [skillCheckCompleted, setSkillCheckCompleted] = useState(false);
  
  // Metadata
  const [metadata, setMetadata] = useState<Metadata>({
    employeeId: '',
    employeeName: '',
    storeId: '',
    storeName: '',
    managerId: '',
    managerName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Access control
  const [loading, setLoading] = useState(true);
  const [notEligible, setNotEligible] = useState(false);
  const [userType, setUserType] = useState<'manager' | 'candidate' | 'trainer' | 'area_manager'>('candidate');
  const [managerCandidates, setManagerCandidates] = useState<any[]>([]);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearchId, setCandidateSearchId] = useState('');
  
  // Readiness checklist responses (questionId -> score: 0, 1, or 2)
  const [readinessResponses, setReadinessResponses] = useState<Record<string, number>>({});
  const [readinessRemarks, setReadinessRemarks] = useState<string>('');
  
  // Session Assessment responses (questionId -> selected answer index)
  const [sessionAssessmentResponses, setSessionAssessmentResponses] = useState<Record<string, number>>({});
  
  // Skill check responses (questionId -> boolean: true=Yes, false=No)
  const [skillCheckResponses, setSkillCheckResponses] = useState<Record<string, boolean>>({});
  const [skillCheckRemarks, setSkillCheckRemarks] = useState<string>('');

  // Get user info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('EMPID') || urlParams.get('empId') || urlParams.get('id') || '';

  // Load manager's candidates from Google Sheets
  const loadManagerCandidates = async (managerId: string) => {
    try {
      const response = await fetch(`${BT_BENCH_PLANNING_ENDPOINT}?action=getManagerCandidates&managerId=${managerId}&_t=${new Date().getTime()}`);
      const data = await response.json();
      
      console.log('[BT BENCH] Manager candidates response:', data);
      const candidates = data.data?.candidates || data.candidates || [];
      
      if (data.success && candidates.length > 0) {
        setManagerCandidates(candidates);
        setUserType('manager');
        return true;
      }
      return false;
    } catch (error) {
      console.log('[BT BENCH] Not a manager:', error);
      return false;
    }
  };

  // Load Area Manager's candidates from Google Sheets (via store mapping)
  const loadAreaManagerCandidates = async (areaManagerId: string) => {
    try {
      const response = await fetch(`${BT_BENCH_PLANNING_ENDPOINT}?action=getAreaManagerCandidates&areaManagerId=${areaManagerId}&_t=${new Date().getTime()}`);
      const data = await response.json();
      
      console.log('[BT BENCH] Area Manager candidates response:', data);
      const candidates = data.data?.candidates || data.candidates || [];
      
      if (data.success && candidates.length > 0) {
        setManagerCandidates(candidates);
        setUserType('area_manager');
        return true;
      }
      return false;
    } catch (error) {
      console.log('[BT BENCH] Not an area manager:', error);
      return false;
    }
  };

  // Load candidate data from Google Sheets
  const loadCandidateData = async (employeeId: string) => {
    try {
      const response = await fetch(
        `${BT_BENCH_PLANNING_ENDPOINT}?action=getCandidateData&employeeId=${employeeId}&_t=${new Date().getTime()}`
      );
      const data = await response.json();
      
      console.log('[BT BENCH] Candidate data response:', data);
      
      if (data.success && data.data) {
        setCandidateData(data.data);
        
        // Set metadata for form submission
        setMetadata({
          employeeId: data.data.candidate.employeeId,
          employeeName: data.data.candidate.employeeName,
          storeId: data.data.candidate.storeId || '',
          storeName: data.data.candidate.storeName || '',
          managerId: data.data.candidate.managerId,
          managerName: data.data.candidate.managerName
        });
        
        // Set completion status
        if (data.data.readinessStatus?.completed) {
          setReadinessCompleted(true);
        }
        if (data.data.sessionStatus?.attended) {
          setBTSessionCompleted(true);
        }
        if (data.data.skillCheckStatus?.completed) {
          setSkillCheckCompleted(true);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.log('[BT BENCH] Not a candidate:', error);
      return false;
    }
  };

  // Load trainer's candidates from Google Sheets
  const loadTrainerCandidates = async (trainerId: string) => {
    try {
      // Use the dedicated endpoint that checks Store_Mapping for trainer assignments
      const response = await fetch(`${BT_BENCH_PLANNING_ENDPOINT}?action=getTrainerCandidates&trainerId=${trainerId}&_t=${new Date().getTime()}`);
      const data = await response.json();
      
      console.log('[BT BENCH] Trainer candidates response:', data);
      console.log('[BT BENCH] Response structure - data.data:', data.data);
      console.log('[BT BENCH] Response structure - data.candidates:', data.candidates);
      
      const candidates = data.data?.candidates || data.candidates || [];
      console.log('[BT BENCH] Parsed candidates array:', candidates);
      console.log('[BT BENCH] Candidates length:', candidates.length);
      
      if (data.success && candidates.length > 0) {
        console.log('[BT BENCH] ✅ TRAINER CONFIRMED - Setting manager candidates:', candidates);
        setManagerCandidates(candidates);
        setUserType('trainer');
        return true;
      }
      
      console.log('[BT BENCH] ❌ Not a trainer - either no success or empty candidates array');
      return false;
    } catch (error) {
      console.log('[BT BENCH] ❌ Not a trainer - error:', error);
      return false;
    }
  };
  
  // Load data on component mount if user ID is available - SEQUENTIAL CHECKS
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      console.log('[BT BENCH] Starting sequential check for user:', userId);
      setLoading(true);
      setNotEligible(false);
      
      // Step 1: Check if user is a trainer (highest priority)
      console.log('[BT BENCH] Step 1: Checking trainer role...');
      const isTrainer = await loadTrainerCandidates(userId);
      console.log('[BT BENCH] Trainer check result:', isTrainer);
      if (isTrainer) {
        // Trainers should start at BT Session step (Step 2)
        setCurrentStep('bt-session');
        setLoading(false);
        return; // Stop here, user is confirmed trainer
      }
      
      // Step 2: Check if user is a candidate
      console.log('[BT BENCH] Step 2: Checking candidate role...');
      await loadCandidateData(userId);
      
      // Step 3: Check if user is a manager
      console.log('[BT BENCH] Step 3: Checking manager role...');
      await loadManagerCandidates(userId);
      
      // Step 4: Check if user is an Area Manager
      console.log('[BT BENCH] Step 4: Checking area manager role...');
      await loadAreaManagerCandidates(userId);
      
      setLoading(false);
    };
    
    checkUserAccess();
  }, [userId]);
  
  // After data loads complete, determine eligibility
  useEffect(() => {
    // If user is trainer, candidate, or manager - they are eligible
    if (candidateData || managerCandidates.length > 0) {
      setNotEligible(false);
    } 
    // Only set notEligible if:
    // 1. User is not a candidate (no candidateData)
    // 2. User is not a manager (no managerCandidates)
    // 3. Loading is complete
    else if (!loading && userId) {
      setNotEligible(true);
    }
  }, [loading, candidateData, managerCandidates, userId]);

  // Load metadata from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('EMPID') || '';
    const empName = urlParams.get('name') || '';
    const storeId = urlParams.get('store_id') || '';
    const storeName = urlParams.get('store_name') || '';
    
    console.log('[BT BENCH] URL parameters:', { empId, empName, storeId, storeName });
    console.log('[BT BENCH] UserType:', userType);
    console.log('[BT BENCH] Manager candidates count:', managerCandidates.length);
    console.log('[BT BENCH] Logged-in user ID:', userRole.userId);
    
    // Only auto-populate metadata if:
    // 1. EMPID is in URL AND
    // 2. EMPID is different from logged-in user (not viewing own page) AND
    // 3. User is not a manager (managers should use dropdown)
    // This ensures managers see the dropdown to select their team members
    if (empId && empId.toUpperCase() !== userRole.userId?.toUpperCase() && userType !== 'manager') {
      setMetadata({
        employeeId: empId,
        employeeName: empName,
        storeId: storeId,
        storeName: storeName,
        managerId: userRole.userId || '',
        managerName: userRole.name || ''
      });
    }
  }, [userRole, userType, managerCandidates]);

  const steps = [
    {
      id: 'readiness' as BTStep,
      label: 'Readiness Checklist',
      icon: ClipboardCheck,
      description: 'Reporting Manager fills readiness assessment',
      color: 'bg-blue-500',
      completed: readinessCompleted
    },
    {
      id: 'bt-session' as BTStep,
      label: 'BT Session',
      icon: QrCode,
      description: 'Candidate scans QR code to mark attendance',
      color: 'bg-emerald-500',
      completed: btSessionCompleted
    },
    {
      id: 'skill-check' as BTStep,
      label: 'Skill Check',
      icon: CheckCircle,
      description: 'Trainer evaluates partner skills',
      color: 'bg-purple-500',
      completed: skillCheckCompleted
    }
  ];

  const calculateReadinessScore = () => {
    const totalAnswered = Object.keys(readinessResponses).length;
    const totalQuestions = READINESS_CATEGORIES.reduce((sum, cat) => sum + cat.questions.length, 0);
    const score = Object.values(readinessResponses).reduce((sum, val) => sum + val, 0);
    const isPassing = score >= PASSING_SCORE;
    
    return {
      score,
      totalAnswered,
      totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((score / MAX_SCORE) * 100) : 0,
      isPassing,
      isComplete: totalAnswered === totalQuestions
    };
  };

  const handleReadinessResponse = (questionId: string, value: number) => {
    setReadinessResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitReadiness = async () => {
    const { isComplete, isPassing, score } = calculateReadinessScore();
    
    if (!isComplete) {
      alert('Please answer all questions before proceeding.');
      return;
    }
    
    if (!isPassing) {
      alert(`Score is below passing marks. Minimum required: ${PASSING_SCORE}/${MAX_SCORE}`);
      return;
    }

    if (!metadata.employeeId || !metadata.employeeName) {
      alert('Employee information is missing. Please ensure EMPID and name are provided in the URL.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        action: 'submitReadiness',
        submissionTime: new Date().toISOString(),
        employeeId: metadata.employeeId,
        employeeName: metadata.employeeName,
        managerId: metadata.managerId,
        managerName: metadata.managerName,
        responses: readinessResponses,
        remarks: readinessRemarks
      };

      const response = await fetch(BT_BENCH_PLANNING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      setReadinessCompleted(true);
      alert(`✅ Readiness checklist submitted successfully!\n\nScore: ${score}/${MAX_SCORE}\nStatus: PASSED\n\nCandidate can now proceed to BT Session.`);
      
      // Update stats
      onStatsUpdate({
        completed: 1,
        total: 1,
        score: score
      });

    } catch (error) {
      console.error('Error submitting readiness checklist:', error);
      alert('Submission completed. If you don\'t see it in the sheet, please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSession = async () => {
    if (!metadata.employeeId || !metadata.employeeName) {
      alert('Employee information is missing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        action: 'submitSession',
        submissionTime: new Date().toISOString(),
        employeeId: metadata.employeeId,
        employeeName: metadata.employeeName,
        sessionDate: new Date().toISOString(),
        trainerId: userRole.userId || '',
        trainerName: userRole.name || '',
        qrCode: 'BT_SESSION_' + new Date().getTime(),
        location: metadata.storeName,
        notes: 'QR code scanned successfully'
      };

      const response = await fetch(BT_BENCH_PLANNING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      setBTSessionCompleted(true);
      alert('✅ BT Session attendance marked successfully!');

    } catch (error) {
      console.error('Error submitting BT session:', error);
      alert('Submission completed. If you don\'t see it in the sheet, please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSessionAssessment = async () => {
    const totalQuestions = SESSION_ASSESSMENT_QUESTIONS.length;
    const answeredQuestions = Object.keys(sessionAssessmentResponses).length;

    if (answeredQuestions < totalQuestions) {
      alert('Please answer all questions before submitting.');
      return;
    }

    if (!metadata.employeeId || !metadata.employeeName) {
      alert('Employee information is missing.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate score
      const correctAnswers = SESSION_ASSESSMENT_QUESTIONS.filter(q => 
        sessionAssessmentResponses[q.id] === q.correctAnswer
      ).length;
      const score = correctAnswers;
      const passed = correctAnswers >= SESSION_ASSESSMENT_PASSING_SCORE;

      const payload = {
        action: 'submitSessionAssessment',
        submissionTime: new Date().toISOString(),
        employeeId: metadata.employeeId,
        employeeName: metadata.employeeName,
        trainerId: userRole.userId || '',
        trainerName: userRole.name || '',
        responses: sessionAssessmentResponses,
        score: score,
        totalQuestions: totalQuestions,
        passed: passed
      };

      const response = await fetch(BT_BENCH_PLANNING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      setSessionAssessmentCompleted(true);
      alert(`✅ Session Assessment submitted successfully!\n\nScore: ${score}/${totalQuestions} (${Math.round(score/totalQuestions * 100)}%)\nStatus: ${passed ? 'PASSED' : 'NEEDS REVIEW'}`);

    } catch (error) {
      console.error('Error submitting session assessment:', error);
      alert('Submission completed. If you don\'t see it in the sheet, please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSkillCheck = async () => {
    const totalQuestions = SKILL_CHECK_PHASES.reduce((sum, phase) => sum + phase.questions.length, 0);
    const answeredQuestions = Object.keys(skillCheckResponses).length;

    if (answeredQuestions < totalQuestions) {
      alert('Please answer all questions before submitting.');
      return;
    }

    if (!metadata.employeeId || !metadata.employeeName) {
      alert('Employee information is missing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        action: 'submitSkillCheck',
        submissionTime: new Date().toISOString(),
        employeeId: metadata.employeeId,
        employeeName: metadata.employeeName,
        trainerId: userRole.userId || '',
        trainerName: userRole.name || '',
        responses: skillCheckResponses,
        remarks: skillCheckRemarks
      };

      const response = await fetch(BT_BENCH_PLANNING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      const yesCount = Object.values(skillCheckResponses).filter(val => val === true).length;
      
      setSkillCheckCompleted(true);
      alert(`✅ Skill Check evaluation submitted successfully!\n\nYes Responses: ${yesCount}/${totalQuestions}`);

    } catch (error) {
      console.error('Error submitting skill check:', error);
      alert('Submission completed. If you don\'t see it in the sheet, please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'readiness':
        // Only Manager and Area Manager can fill readiness (NOT trainers)
        const canFillReadiness = userType === 'manager' || userType === 'area_manager';
        const canEdit = canFillReadiness && !readinessCompleted;
        
        // Trainers should not see this step
        if (userType === 'trainer') {
          return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                  Trainers Access: Steps 2 & 3 Only
                </h3>
              </div>
              <p className="text-yellow-800 dark:text-yellow-200">
                As a trainer, you have access to:
              </p>
              <ul className="list-disc list-inside mt-2 text-yellow-700 dark:text-yellow-300">
                <li>Step 2: BT Session - Mark candidate attendance</li>
                <li>Step 3: Skill Check - Evaluate training process</li>
              </ul>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-3">
                Step 1 (Readiness Checklist) is completed by the Reporting Manager.
              </p>
            </div>
          );
        }
        
        // Flatten all questions from categories
        const allQuestions = READINESS_CATEGORIES.flatMap(category => 
          category.questions.map(q => ({ ...q, categoryTitle: category.title }))
        );
        
        return (
          <div className="space-y-6">
            {/* Status Banner */}
            {readinessCompleted && (
              <div className={`p-4 rounded-lg border ${
                readinessCompleted
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">
                    Readiness Assessment Completed
                  </span>
                </div>
              </div>
            )}

            {/* Candidate Info Card */}
            {metadata.employeeId && metadata.employeeName && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Candidate Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Employee Name</p>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{metadata.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Employee ID</p>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{metadata.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Manager</p>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{metadata.managerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Store</p>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{metadata.storeName || metadata.storeId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Readiness Checklist Items */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                Readiness Criteria (Score: 0=Rarely/No, 1=Sometimes, 2=Usually/Yes)
              </h3>

              {!canFillReadiness && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    ℹ️ This checklist can only be filled by the Reporting Manager or Area Manager.
                  </p>
                </div>
              )}

              {(userType === 'manager' || userType === 'area_manager') && readinessCompleted && (
                <div className="mb-4 space-y-3">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      ℹ️ Readiness checklist already submitted. You cannot modify it.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          Status: SUBMITTED ✓
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          Employee: {metadata.employeeName} ({metadata.employeeId})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                {allQuestions.map((question, index) => {
                  const currentValue = readinessResponses[question.id];
                  
                  return (
                    <div key={question.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                          <p className="text-sm sm:text-base text-gray-900 dark:text-slate-100">{question.text}</p>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 justify-end">
                          {[0, 1, 2].map(score => (
                            <button
                              key={score}
                              onClick={() => canEdit && handleReadinessResponse(question.id, score)}
                              disabled={!canEdit}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-medium text-sm sm:text-base transition-all shrink-0 ${
                                currentValue === score
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
                  );
                })}
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
                  disabled={loading || Object.keys(readinessResponses).length < allQuestions.length}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Submit Readiness Assessment
                </button>
              )}
            </div>
          </div>
        );

      case 'bt-session':
        const canMarkSession = userType === 'trainer' || userType === 'candidate';
        const canTakeAssessment = userType === 'trainer';
        const totalAssessmentQuestions = SESSION_ASSESSMENT_QUESTIONS.length;
        const answeredAssessmentQuestions = Object.keys(sessionAssessmentResponses).length;
        const correctAnswers = SESSION_ASSESSMENT_QUESTIONS.filter(q => 
          sessionAssessmentResponses[q.id] === q.correctAnswer
        ).length;
        
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Attendance Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
              {/* Info banner for trainers */}
              {userType === 'trainer' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Trainer:</strong> Mark attendance for candidates who attended your BT training session, then complete the assessment below.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
                  BT Session Attendance
                </h2>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mb-4 sm:mb-6">
                {userType === 'trainer'
                  ? 'Mark attendance for the candidate who attended your training session'
                  : 'Candidate will scan QR code provided by trainer to mark attendance for the BT session.'}
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 sm:p-6 md:p-8 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-slate-700 rounded-lg border-2 border-emerald-300 dark:border-emerald-600 mb-3 sm:mb-4">
                  <QrCode className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-500" />
                </div>
                <p className="text-emerald-800 dark:text-emerald-200 font-medium text-base sm:text-lg mb-2">
                  {btSessionCompleted ? '✓ Attendance Marked' : 'BT Session Attendance'}
                </p>
                <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mb-4 sm:mb-6">
                  {btSessionCompleted 
                    ? 'Session attendance has been recorded successfully'
                    : userType === 'trainer'
                    ? 'Mark attendance for the candidate who attended your training session'
                    : 'Scan the QR code from your trainer to mark attendance'
                  }
                </p>
                
                {!btSessionCompleted && canMarkSession && (
                  <button
                    onClick={handleSubmitSession}
                    disabled={isSubmitting || !readinessCompleted}
                    className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Marking Attendance...' : 'Mark Attendance'}
                  </button>
                )}
                
                {!canMarkSession && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-4">
                    Only trainers and candidates can mark session attendance
                  </p>
                )}
                
                {!readinessCompleted && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-4">
                    Complete Readiness Checklist first
                  </p>
                )}
              </div>
            </div>

            {/* Session Assessment - Show after attendance is marked */}
            {btSessionCompleted && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 shrink-0" />
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
                        BT Session Assessment
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                        Trainer Knowledge Check - 15 Multiple Choice Questions
                      </p>
                    </div>
                  </div>
                  
                  {answeredAssessmentQuestions > 0 && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {answeredAssessmentQuestions}/{totalAssessmentQuestions}
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-slate-400">
                        Questions Answered
                      </div>
                      {sessionAssessmentCompleted && (
                        <div className="text-sm text-gray-500 dark:text-slate-400">
                          Score: {correctAnswers}/{totalAssessmentQuestions} ({Math.round(correctAnswers/totalAssessmentQuestions * 100)}%)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!canTakeAssessment ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        Only trainers can complete the Session Assessment.
                      </p>
                    </div>
                  </div>
                ) : sessionAssessmentCompleted ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100 text-lg">
                          Assessment Completed! ✓
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Score: {correctAnswers}/{totalAssessmentQuestions} ({Math.round(correctAnswers/totalAssessmentQuestions * 100)}%)
                          {correctAnswers >= SESSION_ASSESSMENT_PASSING_SCORE ? ' - PASSED' : ' - NEEDS REVIEW'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Instructions:</strong> Answer all 15 multiple-choice questions about buddy training principles. Passing score: 12/15 (80%)
                      </p>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      {SESSION_ASSESSMENT_QUESTIONS.map((question, index) => (
                        <div key={question.id} className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6 last:border-0">
                          <div className="mb-3 sm:mb-4">
                            <span className="inline-block px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs sm:text-sm font-medium mb-2">
                              Question {index + 1}
                            </span>
                            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-slate-100">
                              {question.question}
                            </h3>
                          </div>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <label
                                key={optionIndex}
                                className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                  sessionAssessmentResponses[question.id] === optionIndex
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={optionIndex}
                                  checked={sessionAssessmentResponses[question.id] === optionIndex}
                                  onChange={() => {
                                    setSessionAssessmentResponses(prev => ({
                                      ...prev,
                                      [question.id]: optionIndex
                                    }));
                                  }}
                                  disabled={sessionAssessmentCompleted}
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 shrink-0"
                                />
                                <span className="text-sm sm:text-base text-gray-900 dark:text-slate-100">
                                  {String.fromCharCode(97 + optionIndex)}) {option}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleSubmitSessionAssessment}
                      disabled={isSubmitting || answeredAssessmentQuestions < totalAssessmentQuestions}
                      className="w-full mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>

                    {answeredAssessmentQuestions < totalAssessmentQuestions && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center mt-2">
                        Please answer all {totalAssessmentQuestions} questions before submitting
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );

      case 'skill-check':
        const totalSkillQuestions = SKILL_CHECK_PHASES.reduce((sum, phase) => sum + phase.questions.length, 0);
        const answeredSkillQuestions = Object.keys(skillCheckResponses).length;
        const yesCount = Object.values(skillCheckResponses).filter(val => val === true).length;
        const canFillSkillCheck = userType === 'trainer';
        
        return (
          <div className="space-y-6">
            {/* Info banner for trainers */}
            {userType === 'trainer' && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    <strong>Trainer:</strong> Evaluate how well the candidate demonstrated their training skills during the session.
                  </p>
                </div>
              </div>
            )}
            
            {!canFillSkillCheck && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    Only trainers can complete the Skill Check evaluation.
                  </p>
                </div>
              </div>
            )}
            
            {!canFillSkillCheck && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    Only trainers can complete the Skill Check evaluation.
                  </p>
                </div>
              </div>
            )}
            
            {/* Score Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      Skill Check Evaluation
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Trainer Assessment - Training Process Evaluation
                    </p>
                  </div>
                </div>
                
                {answeredSkillQuestions > 0 && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {yesCount}/{totalSkillQuestions}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-slate-400">
                      Yes Responses
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      {answeredSkillQuestions}/{totalSkillQuestions} answered
                    </div>
                  </div>
                )}
              </div>
              
              {/* Info Banner */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      Training Process Evaluation
                    </p>
                    <p className="text-purple-700 dark:text-purple-300">
                      Evaluate each step of the training process with Yes or No
                    </p>
                  </div>
                </div>
              </div>

              {/* Phases and Questions */}
              <div className="space-y-6">
                {SKILL_CHECK_PHASES.map((phase) => (
                  <div key={phase.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      {phase.title}
                    </h3>
                    
                    <div className="space-y-3">
                      {phase.questions.map((question) => {
                        const currentValue = skillCheckResponses[question.id];
                        
                        return (
                          <div key={question.id} className="bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-slate-700 overflow-hidden">
                            {/* Step */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                                {question.step}
                              </p>
                            </div>
                            
                            {/* Standard */}
                            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900/30 border-b border-gray-200 dark:border-slate-700">
                              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Standard:</p>
                              <p className="text-sm text-gray-700 dark:text-slate-300">
                                {question.standard}
                              </p>
                            </div>
                            
                            {/* Yes/No Options */}
                            <div className="px-4 py-3 bg-white dark:bg-slate-800">
                              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Response:</p>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setSkillCheckResponses(prev => ({ ...prev, [question.id]: true }))}
                                  className={`py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                                    currentValue === true
                                      ? 'bg-green-500 text-white ring-2 ring-green-600 shadow-md'
                                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="text-xl font-bold">{currentValue === true ? '✓' : 'Yes'}</div>
                                  </div>
                                </button>
                                
                                <button
                                  onClick={() => setSkillCheckResponses(prev => ({ ...prev, [question.id]: false }))}
                                  className={`py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                                    currentValue === false
                                      ? 'bg-red-500 text-white ring-2 ring-red-600 shadow-md'
                                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="text-xl font-bold">{currentValue === false ? '✗' : 'No'}</div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Remarks */}
              <div className="mt-6 bg-gray-50 dark:bg-slate-900/30 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Overall Remarks:
                </label>
                <textarea
                  value={skillCheckRemarks}
                  onChange={(e) => setSkillCheckRemarks(e.target.value)}
                  placeholder="Add overall feedback about the trainer's performance..."
                  className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitSkillCheck}
                disabled={!canFillSkillCheck || answeredSkillQuestions < totalSkillQuestions || isSubmitting || skillCheckCompleted || !btSessionCompleted}
                className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
              >
                {!canFillSkillCheck
                  ? 'Only Trainers Can Submit'
                  : isSubmitting
                  ? 'Submitting...'
                  : skillCheckCompleted
                  ? '✓ Submitted Successfully'
                  : !btSessionCompleted
                  ? 'Complete BT Session First'
                  : answeredSkillQuestions === totalSkillQuestions 
                  ? `Submit Skill Check (${yesCount}/${totalSkillQuestions} Yes)`
                  : `Complete All Questions (${answeredSkillQuestions}/${totalSkillQuestions})`
                }
              </button>
            </div>
          </div>
        );
    }
  };

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Checking access...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (notEligible) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
            Access Denied
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-6">
            You do not have permission to access this Buddy Trainer bench planning assessment.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mb-6">
            Only the following users can access this assessment:
          </p>
          <ul className="text-left inline-block text-sm text-red-700 dark:text-red-300 mb-6">
            <li className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" />
              The candidate (Employee)
            </li>
            <li className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" />
              The reporting manager
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Assigned trainer/panelist
            </li>
          </ul>
          <button
            onClick={onBackToChecklists}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go Back
          </button>
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
              Bench Planning | Barista to Buddy Trainer
            </h1>
          </div>
          {/* Exit Button */}
          <button
            onClick={onBackToChecklists}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md shrink-0 self-start sm:self-auto"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Exit
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
          3-Step Assessment Process: Readiness evaluation, training session attendance, and skill verification.
        </p>
      </div>

      {/* Candidate Selection (for managers, area managers, and trainers) */}
      {!candidateData && !notEligible && (userType === 'manager' || userType === 'area_manager' || userType === 'trainer') && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            {userType === 'manager' ? 'Select Your Team Member' : 
             userType === 'trainer' ? 'Select Candidate for Training Session' :
             'Select Candidate for Assessment'}
          </h3>
          
          {/* Dropdown for managers with their candidates */}
          {managerCandidates.length > 0 && (
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
          
          {managerCandidates.length === 0 && !loadingCandidates && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              No team members found in the BT Candidates list.
            </p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      {candidateData && (
        <>
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 dark:border-slate-700 overflow-x-auto scrollbar-hide -mx-2 sm:mx-0 px-2 sm:px-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.completed;

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-xs sm:text-sm md:text-base ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Step {index + 1}: {step.label}</span>
              {isCompleted && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="mb-6 sm:mb-8">
        {renderStepContent()}
      </div>
        </>
      )}
    </div>
  );
};

export default BenchPlanningBTChecklist;
