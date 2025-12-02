import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, AlertCircle, Building2, User, Calendar, Brain, TrendingUp, ChevronRight, ChevronDown, Search, Clock, Video, VideoOff, Eye, EyeOff, Volume2, Wifi } from 'lucide-react';
import { UserRole } from '../../roleMapping';
import { useComprehensiveMapping } from '../../hooks/useComprehensiveMapping';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';

interface CampusHiringChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

interface QuestionData {
  id: string;
  text: string;
  category: string;
  image?: string; // Optional image URL for visual questions
  options: {
    A: { text: string; weight: number };
    B: { text: string; weight: number };
    C: { text: string; weight: number };
    D?: { text: string; weight: number };
  };
}

interface ProctoringViolation {
  type: 'tab-switch' | 'face-not-detected' | 'multiple-faces' | 'excessive-noise' | 'window-blur';
  timestamp: string;
  details: string;
}

const CampusHiringChecklist: React.FC<CampusHiringChecklistProps> = ({ userRole, onStatsUpdate, onBackToChecklists }) => {
  const { config } = useConfig();
  const { mapping: comprehensiveMapping, loading: mappingLoading } = useComprehensiveMapping();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'locked'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAutoSubmit, setIsAutoSubmit] = useState(false);
  const campusDropdownRef = useRef<HTMLDivElement>(null);
  
  // Assessment flow state
  const [showRules, setShowRules] = useState(true); // Show rules page first
  const [assessmentStarted, setAssessmentStarted] = useState(false); // Track if assessment has started
  
  // Timer state - 30 minutes in seconds
  const ASSESSMENT_DURATION = 30 * 60; // 30 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(ASSESSMENT_DURATION);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Proctoring state
  const [proctoringEnabled, setProctoringEnabled] = useState(false);
  const [streamReady, setStreamReady] = useState(false); // Track when stream is available
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [faceDetected, setFaceDetected] = useState(false);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(0);
  
  // Draft auto-save indicator
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  // Violation counts and warnings
  const [faceNotDetectedCount, setFaceNotDetectedCount] = useState(0);
  const [noiseWarnings, setNoiseWarnings] = useState<string[]>([]); // Array of warning messages to show
  const [isLocked, setIsLocked] = useState(false); // Whether user is locked out
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noiseDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noFaceDetectionCount = useRef<number>(0); // Track consecutive no-face detections
  const lastFaceDetectionTime = useRef<number>(Date.now()); // Track last time face was detected
  const noiseLevelHistory = useRef<number[]>([]); // Track noise levels over time
  const lastNoiseViolationTime = useRef<number>(0); // Prevent duplicate noise violations

  // Sync stream to display video when proctoring is enabled
  useEffect(() => {
    console.log('===== DISPLAY VIDEO SYNC EFFECT =====');
    console.log('proctoringEnabled:', proctoringEnabled);
    console.log('streamReady:', streamReady);
    console.log('displayVideoRef.current exists:', !!displayVideoRef.current);
    console.log('streamRef.current exists:', !!streamRef.current);
    
    if (displayVideoRef.current) {
      console.log('Display video element details:', {
        nodeName: displayVideoRef.current.nodeName,
        className: displayVideoRef.current.className,
        style: displayVideoRef.current.style.cssText,
        srcObject: displayVideoRef.current.srcObject,
        readyState: displayVideoRef.current.readyState
      });
    }
    
    if (proctoringEnabled && streamReady && displayVideoRef.current && streamRef.current) {
      console.log('🎬 All conditions met - syncing stream to display video');
      console.log('Stream details:', {
        id: streamRef.current.id,
        active: streamRef.current.active,
        videoTracks: streamRef.current.getVideoTracks().length,
        audioTracks: streamRef.current.getAudioTracks().length
      });
      
      try {
        displayVideoRef.current.srcObject = streamRef.current;
        console.log('✓ Stream assigned to display video');
        
        displayVideoRef.current.play()
          .then(() => {
            console.log('✓ Display video is now playing');
            setTimeout(() => {
              if (displayVideoRef.current) {
                console.log('Display video dimensions after play:', 
                  displayVideoRef.current.videoWidth, 'x', displayVideoRef.current.videoHeight);
              }
            }, 500);
          })
          .catch(err => {
            console.error('❌ Display video play error:', err);
          });
      } catch (error) {
        console.error('❌ Error setting stream:', error);
      }
    } else {
      console.log('❌ Conditions not met for sync');
    }
    console.log('===== END DISPLAY VIDEO SYNC =====');
  }, [proctoringEnabled, streamReady]);

  // Form state
  const [candidateName, setCandidateName] = useState('');
  const [candidatePhone,Phone] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [campusName, setCampusName] = useState('');
  const [campusSearchOpen, setCampusSearchOpen] = useState(false);
  const [campusSearchTerm, setCampusSearchTerm] = useState('');
  const [candidateDataLoaded, setCandidateDataLoaded] = useState(false);
  
  // Campus options
  const campusOptions = [
    'IHM Pusa',
    'IHM Mumbai',
    'IHM Bangalore',
    'IHM Chennai',
    'IHM Bhuwaneshwar',
    'IHM Jaipur',
    'ITM'
  ];
  
  // Load candidate data from URL on mount
  useEffect(() => {
    const loadCandidateFromURL = async () => {
      // Always clear previous data first
      setCandidateName('');
      setCandidatePhone('');
      setCandidateEmail('');
      setCampusName('');
      setCandidateDataLoaded(false);
      
      try {
        // Get email from URL parameter (EMPID)
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromURL = urlParams.get('EMPID');
        
        if (!emailFromURL) {
          console.log('No EMPID parameter found in URL - form cleared');
          return;
        }
        
        console.log('Looking up candidate with email:', emailFromURL);
        
        // Fetch the IHM_Mumbai.json file (try multiple possible paths)
        let response;
        let data;
        
        // Try different paths
        const paths = [
          '/IHM_Mumbai.json',
          '/Prism/IHM_Mumbai.json',
          './IHM_Mumbai.json',
          '../IHM_Mumbai.json'
        ];
        
        let loaded = false;
        for (const path of paths) {
          try {
            console.log('Trying to fetch from:', path);
            response = await fetch(path);
            if (response.ok) {
              data = await response.json();
              console.log('✓ Successfully loaded from:', path);
              loaded = true;
              break;
            }
          } catch (err) {
            console.log('Failed to load from:', path);
          }
        }
        
        if (!loaded) {
          console.error('Failed to load candidate data file from any path');
          // Still pre-fill email as fallback
          setCandidateEmail(emailFromURL);
          return;
        }
        
        // Find candidate by email (case-insensitive)
        const candidate = data.candidates.find(
          (c: any) => c.email.toLowerCase() === emailFromURL.toLowerCase()
        );
        
        if (candidate) {
          console.log('✓ Candidate found:', candidate.name);
          console.log('Candidate data:', candidate);
          
          // Auto-populate the form fields
          setCandidateName(candidate.name);
          setCandidatePhone(candidate.phone);
          setCandidateEmail(candidate.email);
          setCampusName(candidate.institution);
          setCandidateDataLoaded(true);
          
          console.log('✓ Candidate information auto-populated');
          console.log('Name:', candidate.name);
          console.log('Phone:', candidate.phone);
          console.log('Email:', candidate.email);
          console.log('Campus:', candidate.institution);
        } else {
          console.warn('⚠️ No candidate found with email:', emailFromURL);
          console.log('Available candidates:', data.candidates.length);
          
          // Still pre-fill the email if no match found
          setCandidateEmail(emailFromURL);
        }
      } catch (error) {
        console.error('Error loading candidate data:', error);
        // Pre-fill email as fallback
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromURL = urlParams.get('EMPID');
        if (emailFromURL) {
          setCandidateEmail(emailFromURL);
        }
      }
    };
    
    loadCandidateFromURL();
  }, [window.location.search]); // Re-run when URL changes
  
  // Filtered campus options based on search
  const filteredCampuses = campusOptions.filter(campus =>
    campus.toLowerCase().includes(campusSearchTerm.toLowerCase())
  );
  
  // Questions and answers
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Campus Hiring Assessment Questions - 6 Categories, 5 Questions Each
  const questions: QuestionData[] = [
    // ========== CATEGORY 1: PSYCHOMETRIC (5 questions) ==========
    {
      id: 'Q1',
      text: "Imagine you're explaining a new drink recipe to a teammate whose first language isn't English. You:",
      category: 'Psychometric',
      options: {
        A: { text: 'Repeat exactly what was told to you', weight: 1 },
        B: { text: 'Try to explain in simple words and gestures', weight: 2 },
        C: { text: "Ask them what part they didn't understand and explain accordingly", weight: 3 }
      }
    },
    {
      id: 'Q2',
      text: 'A drink consistently tastes off. You:',
      category: 'Psychometric',
      options: {
        A: { text: 'Remake it and hope it improves next time', weight: 1 },
        B: { text: 'Try adjusting the grind or recipe slightly', weight: 2 },
        C: { text: 'Document the issue and escalate it to the trainer', weight: 3 }
      }
    },
    {
      id: 'Q3',
      text: "Your team isn't following the cleaning checklist. You:",
      category: 'Psychometric',
      options: {
        A: { text: "Do it yourself without mentioning it", weight: 1 },
        B: { text: 'Remind them casually', weight: 2 },
        C: { text: 'Call a short huddle and reinforce expectations', weight: 3 }
      }
    },
    {
      id: 'Q4',
      text: 'A customer says their drink tastes "strange." You:',
      category: 'Psychometric',
      options: {
        A: { text: 'Say sorry and move on', weight: 1 },
        B: { text: 'Offer to remake it once', weight: 2 },
        C: { text: 'Ask specifics and tailor a solution', weight: 3 }
      }
    },
    {
      id: 'Q5',
      text: 'You find a wallet on the café floor. You:',
      category: 'Psychometric',
      options: {
        A: { text: 'Leave it at the counter', weight: 1 },
        B: { text: 'Keep it safe and note the time', weight: 2 },
        C: { text: 'Record it and report to shift lead', weight: 3 }
      }
    },

    // ========== CATEGORY 2: ENGLISH PROFICIENCY (5 questions) ==========
    {
      id: 'Q6',
      text: 'Which sentence is grammatically correct?',
      category: 'English Proficiency',
      options: {
        A: { text: 'The team are working hard.', weight: 1 },
        B: { text: 'The team is working hard.', weight: 3 },
        C: { text: 'The team were working hard.', weight: 2 }
      }
    },
    {
      id: 'Q7',
      text: 'Choose the correctly spelled word:',
      category: 'English Proficiency',
      options: {
        A: { text: 'Occured', weight: 1 },
        B: { text: 'Ocurred', weight: 1 },
        C: { text: 'Occurred', weight: 3 }
      }
    },
    {
      id: 'Q8',
      text: 'Select the sentence with proper punctuation:',
      category: 'English Proficiency',
      options: {
        A: { text: "Let's eat, Grandma!", weight: 3 },
        B: { text: "Lets eat Grandma!", weight: 1 },
        C: { text: "Let's eat Grandma!", weight: 1 }
      }
    },
    {
      id: 'Q9',
      text: 'What is the meaning of "proactive"?',
      category: 'English Proficiency',
      options: {
        A: { text: 'Reacting after something happens', weight: 1 },
        B: { text: 'Taking action in advance', weight: 3 },
        C: { text: 'Being professional', weight: 1 }
      }
    },
    {
      id: 'Q10',
      text: 'Complete the sentence: "Neither the manager ___ the team members were present."',
      category: 'English Proficiency',
      options: {
        A: { text: 'or', weight: 1 },
        B: { text: 'nor', weight: 3 },
        C: { text: 'and', weight: 1 }
      }
    },

    // ========== CATEGORY 3: NUMERICAL APTITUDE (5 questions) ==========
    {
      id: 'Q11',
      text: 'A cook uses a mixture where the ratio of flour to sugar is (x+2):(x–1). If the mixture weighs 21 kg and sugar is 6 kg, find x.',
      category: 'Numerical Aptitude',
      options: {
        A: { text: '1', weight: 1 },
        B: { text: '2', weight: 1 },
        C: { text: '3', weight: 1 },
        D: { text: '4', weight: 3 }
      }
    },
    {
      id: 'Q12',
      text: 'A hotel invests ₹20,000 at 10% compound interest, compounded annually for 3 years. Amount earned?',
      category: 'Numerical Aptitude',
      options: {
        A: { text: '₹24,200', weight: 1 },
        B: { text: '₹26,620', weight: 3 },
        C: { text: '₹26,000', weight: 1 },
        D: { text: '₹27,300', weight: 1 }
      }
    },
    {
      id: 'Q13',
      text: '40% of the guests ordered breakfast. If there were 300 guests, how many ordered breakfast?',
      category: 'Numerical Aptitude',
      options: {
        A: { text: '100', weight: 1 },
        B: { text: '120', weight: 3 },
        C: { text: '140', weight: 1 },
        D: { text: '160', weight: 1 }
      }
    },
    {
      id: 'Q14',
      text: 'A dish costs ₹250 to prepare and is sold at 20% profit. Selling price?',
      category: 'Numerical Aptitude',
      options: {
        A: { text: '₹270', weight: 1 },
        B: { text: '₹275', weight: 1 },
        C: { text: '₹300', weight: 3 },
        D: { text: '₹320', weight: 1 }
      }
    },
    {
      id: 'Q15',
      text: 'Two waiters can set 30 tables in 3 hours. How many tables can one waiter set in 2 hours? (They work at the same rate.)',
      category: 'Numerical Aptitude',
      options: {
        A: { text: '5', weight: 1 },
        B: { text: '10', weight: 3 },
        C: { text: '15', weight: 1 },
        D: { text: '20', weight: 1 }
      }
    },

    // ========== CATEGORY 4: LOGICAL REASONING (5 questions) ==========
    {
      id: 'Q16',
      text: 'Circular Seating Arrangement: Six guests A, B, C, D, E, F sit around a circular table facing the center. B sits second to the right of A. E is not adjacent to B. C sits opposite A. F is to the immediate left of C. Who sits to the immediate right of D?',
      category: 'Logical Reasoning',
      options: {
        A: { text: 'A', weight: 1 },
        B: { text: 'B', weight: 1 },
        C: { text: 'E', weight: 3 },
        D: { text: 'F', weight: 1 }
      }
    },
    {
      id: 'Q17',
      text: 'Puzzle (Hotel Room Allocation): Four guests (P, Q, R, S) booked four rooms (101, 102, 103, 104). Q does not stay in 101 or 102. R stays in an odd-numbered room. S stays immediately next to Q. P does not stay in 104. Where does R stay?',
      category: 'Logical Reasoning',
      options: {
        A: { text: '101', weight: 1 },
        B: { text: '103', weight: 3 },
        C: { text: '104', weight: 1 },
        D: { text: 'Cannot be determined', weight: 1 }
      }
    },
    {
      id: 'Q18',
      text: 'Logical Deduction (Syllogism): Statements: (1) All chefs are trained professionals. (2) Some trained professionals are management graduates. (3) No management graduate is untrained. Conclusions: I. Some chefs may be management graduates. II. No chef is untrained. Which follows?',
      category: 'Logical Reasoning',
      options: {
        A: { text: 'Only I follows', weight: 1 },
        B: { text: 'Only II follows', weight: 1 },
        C: { text: 'Both I and II follow', weight: 3 },
        D: { text: 'Neither follows', weight: 1 }
      }
    },
    {
      id: 'Q19',
      text: 'Coding–Decoding: In a certain code: SERVICE → TFWVJHK (Each letter is converted using different +/− positions). How is QUALITY coded if the pattern continues?',
      category: 'Logical Reasoning',
      options: {
        A: { text: 'RVCPNKZ', weight: 3 },
        B: { text: 'RVDQMJZ', weight: 1 },
        C: { text: 'RBENLJX', weight: 1 },
        D: { text: 'RVCOLKZ', weight: 1 }
      }
    },
    {
      id: 'Q20',
      text: 'Direction Sense: A steward walks 6 m north, 8 m east, 6 m south. How far is he from the starting point?',
      category: 'Logical Reasoning',
      options: {
        A: { text: '4 m', weight: 3 },
        B: { text: '6 m', weight: 1 },
        C: { text: '8 m', weight: 1 },
        D: { text: '10 m', weight: 1 }
      }
    },

    // ========== CATEGORY 5: ANALYTICAL APTITUDE (5 questions) ==========
    {
      id: 'Q21',
      text: 'Aditya walked 15 m towards south and took a right turn and walked 3 m, he took a right turn again and walked 15 m before stopping. Which direction did he face?',
      category: 'Analytical Aptitude',
      options: {
        A: { text: 'East', weight: 1 },
        B: { text: 'West', weight: 1 },
        C: { text: 'North', weight: 3 },
        D: { text: 'South', weight: 1 }
      }
    },
    {
      id: 'Q22',
      text: 'A bag contains Rs.30 which is in the form of 50 paisa, 1 ₹ and 2 ₹ coins. The ratio of their number is 4:2:1. How many 50 paisa coins are there?',
      category: 'Analytical Aptitude',
      options: {
        A: { text: '20', weight: 3 },
        B: { text: '10', weight: 1 },
        C: { text: '5', weight: 1 },
        D: { text: '15', weight: 1 }
      }
    },
    {
      id: 'Q23',
      text: 'A shopkeeper selling his goods at 7% loss. Had he sold it for Rs.800 more, then he would get 9% profit. Find the CP of that article.',
      category: 'Analytical Aptitude',
      options: {
        A: { text: '500', weight: 1 },
        B: { text: '4000', weight: 1 },
        C: { text: '6000', weight: 1 },
        D: { text: '5000', weight: 3 }
      }
    },
    {
      id: 'Q24',
      text: 'Find the number of triangles in the given figure.',
      category: 'Analytical Aptitude',
      image: '/Prism/assessment-images/q24-triangles.svg',
      options: {
        A: { text: '8', weight: 1 },
        B: { text: '10', weight: 1 },
        C: { text: '12', weight: 1 },
        D: { text: '14', weight: 3 }
      }
    },
    {
      id: 'Q25',
      text: 'Count the number of triangles and squares in the given figure.',
      category: 'Analytical Aptitude',
      image: '/Prism/assessment-images/q25-triangles-squares.svg',
      options: {
        A: { text: '36 triangles, 7 squares', weight: 1 },
        B: { text: '38 triangles, 9 squares', weight: 1 },
        C: { text: '40 triangles, 7 squares', weight: 3 },
        D: { text: '42 triangles, 9 squares', weight: 1 }
      }
    },

    // ========== CATEGORY 6: COURSE CURRICULUM (5 questions) ==========
    {
      id: 'Q26',
      text: 'What falls in the danger zone?',
      category: 'Course Curriculum',
      options: {
        A: { text: '1-5 degree Celsius', weight: 1 },
        B: { text: '22-58 degree Celsius', weight: 3 },
        C: { text: '65-80 degree Celsius', weight: 1 },
        D: { text: '2-4 degree Celsius', weight: 1 }
      }
    },
    {
      id: 'Q27',
      text: 'The two parts of HACCP include:',
      category: 'Course Curriculum',
      options: {
        A: { text: 'Hazard analysis and critical control points', weight: 3 },
        B: { text: 'Health analysis and critical control points', weight: 1 },
        C: { text: 'Hazard analysis and critical conformation production', weight: 1 },
        D: { text: 'Health analysis and critical conformation production', weight: 1 }
      }
    },
    {
      id: 'Q28',
      text: 'What is The Third Wave Movement of coffee about?',
      category: 'Course Curriculum',
      options: {
        A: { text: 'Bean to cup', weight: 3 },
        B: { text: 'Flavoured coffee', weight: 1 },
        C: { text: 'Farm to cup', weight: 1 },
        D: { text: 'Monetization of coffee', weight: 1 }
      }
    },
    {
      id: 'Q29',
      text: 'Which ISO standard is applicable for the QSR industry?',
      category: 'Course Curriculum',
      options: {
        A: { text: 'ISO 9001', weight: 3 },
        B: { text: 'ISO 22001', weight: 1 },
        C: { text: 'ISO 22000', weight: 1 },
        D: { text: 'ISO 27001', weight: 1 }
      }
    },
    {
      id: 'Q30',
      text: 'Which of these is not a type of contamination?',
      category: 'Course Curriculum',
      options: {
        A: { text: 'Biological contamination', weight: 1 },
        B: { text: 'Chemical contamination', weight: 1 },
        C: { text: 'Physical contamination', weight: 1 },
        D: { text: 'Social contamination', weight: 3 }
      }
    }
  ];

  // Get available stores based on user role
  const availableStores = React.useMemo(() => {
    if (!comprehensiveMapping || comprehensiveMapping.length === 0) {
      return [];
    }
    
    // Extract unique stores from mapping
    const storesMap = new Map();
    comprehensiveMapping.forEach((entry: any) => {
      const storeId = entry['Store ID'] || entry.storeId;
      const storeName = entry['Store Name'] || entry.storeName;
      const region = entry.Region || entry.region;
      
      if (storeId && storeName && !storesMap.has(storeId)) {
        storesMap.set(storeId, {
          id: storeId,
          name: storeName,
          region: region || 'Unknown'
        });
      }
    });
    
    return Array.from(storesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [comprehensiveMapping]);

  // Calculate completion stats
  useEffect(() => {
    const completed = Object.keys(answers).length;
    const total = questions.length;
    
    // Calculate score based on weighted answers
    let totalScore = 0;
    // Calculate max possible score dynamically based on each question's max weight
    let maxPossibleScore = 0;
    questions.forEach(q => {
      const maxWeight = Math.max(
        q.options.A.weight,
        q.options.B.weight,
        q.options.C.weight,
        q.options.D?.weight || 0
      );
      maxPossibleScore += maxWeight;
    });
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (question && answer) {
        const option = question.options[answer as 'A' | 'B' | 'C' | 'D'];
        if (option) {
          totalScore += option.weight;
        }
      }
    });
    
    const scorePercentage = total > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    onStatsUpdate({ completed, total, score: scorePercentage });
  }, [answers, onStatsUpdate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (campusDropdownRef.current && !campusDropdownRef.current.contains(event.target as Node)) {
        setCampusSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Timer logic - starts only when assessment begins (after proctoring enabled)
  useEffect(() => {
    if (timerStarted && submitStatus !== 'success') {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto-submit
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            handleAutoSubmit();
            return 0;
          }
          
          // Warning at 5 minutes (300 seconds)
          if (prev === 300) {
            alert('⏰ 5 minutes remaining! Please complete your assessment.');
          }
          
          // Warning at 1 minute (60 seconds)
          if (prev === 60) {
            alert('⚠️ Only 1 minute left! The assessment will auto-submit soon.');
          }
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerStarted, submitStatus]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining <= 300) return 'text-red-600 dark:text-red-400'; // Last 5 minutes
    if (timeRemaining <= 600) return 'text-orange-600 dark:text-orange-400'; // Last 10 minutes
    return 'text-cyan-600 dark:text-cyan-400';
  };

  // Auto-submit when timer runs out
  const handleAutoSubmit = async () => {
    console.log('Time expired - auto-submitting assessment');
    setIsAutoSubmit(true);
    await handleSubmit(true); // Pass flag to indicate auto-submit
  };

  // Proctoring Functions
  const logViolation = (type: ProctoringViolation['type'], details: string, overrideCount?: number) => {
    const violation: ProctoringViolation = {
      type,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      details
    };
    setViolations(prev => [...prev, violation]);
    console.warn('Proctoring Violation:', violation);

    // Handle different violation types - just show warnings, useEffect handles lockout
    if (type === 'excessive-noise') {
      // Show warning snackbar for noise
      const warningMsg = `⚠️ Warning: ${details}`;
      setNoiseWarnings(prev => [...prev, warningMsg]);
      
      // Auto-remove warning after 5 seconds
      setTimeout(() => {
        setNoiseWarnings(prev => prev.filter(msg => msg !== warningMsg));
      }, 5000);
    }
  };

  // Start the assessment (called after proctoring is enabled)
  const startAssessment = () => {
    setShowRules(false);
    setAssessmentStarted(true);
    setTimerStarted(true);
    console.log('✅ Assessment started - timer is now running');
  };

  // Start camera and microphone for proctoring
  const startProctoring = async () => {
    try {
      console.log('=== Starting Proctoring ===');
      
      console.log('Requesting camera and microphone permissions...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // Request camera permission with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }, 
        audio: true 
      });
      
      console.log('✓ Permissions granted');
      console.log('Stream active:', stream.active);
      console.log('Video tracks:', stream.getVideoTracks().length);
      console.log('Audio tracks:', stream.getAudioTracks().length);
      
      streamRef.current = stream;
      setCameraPermission('granted');
      setMicPermission('granted');
      
      // Setup video element
      if (!videoRef.current) {
        console.error('Video element ref is null!');
        throw new Error('Video element not found');
      }
      
      console.log('✓ Video element found');
      console.log('Setting video srcObject...');
      videoRef.current.srcObject = stream;
      
      // Force video to play
      console.log('Waiting for video to be ready...');
      try {
        await videoRef.current.play();
        console.log('✓ Video is playing');
      } catch (playError) {
        console.error('Error playing video:', playError);
        // Try again after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        await videoRef.current.play();
      }
      
      // Wait for video to have actual data
      await new Promise<void>((resolve) => {
        const checkVideo = () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            console.log('✓ Video ready. Dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            resolve();
          } else {
            console.log('Waiting for video data... ReadyState:', videoRef.current?.readyState);
            setTimeout(checkVideo, 100);
          }
        };
        checkVideo();
      });

      // Setup audio analysis for noise detection
      console.log('Setting up audio analysis...');
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      console.log('✓ Audio analysis ready');

      // Enable proctoring UI and trigger display video sync
      console.log('🎯 About to enable proctoring UI...');
      console.log('Current proctoringEnabled:', proctoringEnabled);
      console.log('Current streamReady:', streamReady);
      
      setProctoringEnabled(true);
      console.log('✓ setProctoringEnabled(true) called');
      
      setStreamReady(true);
      console.log('✓ setStreamReady(true) called');

      // Initialize face detection tracking
      lastFaceDetectionTime.current = Date.now();
      noFaceDetectionCount.current = 0;
      setFaceDetected(true); // Assume face is visible initially

      // Wait a bit before starting detection to ensure video is fully ready
      console.log('Starting detection intervals...');
      setTimeout(() => {
        // Start face detection
        faceDetectionIntervalRef.current = setInterval(() => {
          detectFace();
        }, 2000); // Check every 2 seconds

        // Start noise detection
        noiseDetectionIntervalRef.current = setInterval(() => {
          detectNoise();
        }, 1000); // Check every second
        
        console.log('✓ Face and noise detection started');
      }, 1500);

      console.log('=== Proctoring enabled successfully ===');
      
      // Automatically start the assessment after proctoring is enabled
      setTimeout(() => {
        startAssessment();
      }, 2000); // Small delay to ensure everything is ready
      
    } catch (error) {
      console.error('=== Error starting proctoring ===');
      console.error('Error details:', error);
      
      // Roll back proctoring state on error
      setProctoringEnabled(false);
      setCameraPermission('denied');
      setMicPermission('denied');
      
      let errorMessage = 'Camera and microphone access is required for this assessment.';
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera/microphone permission denied. Please allow access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application. Please close other apps and try again.';
        } else {
          errorMessage = `Failed to start proctoring: ${error.message}`;
        }
      }
      alert(errorMessage);
    }
  };

  // Stop proctoring and cleanup
  const stopProctoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }

    if (noiseDetectionIntervalRef.current) {
      clearInterval(noiseDetectionIntervalRef.current);
      noiseDetectionIntervalRef.current = null;
    }

    setProctoringEnabled(false);
    setStreamReady(false);
  };

  // Basic face detection using video analysis
  const detectFace = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('❌ Face detection skipped - video or canvas not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.log('❌ Face detection skipped - no canvas context');
      return;
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('❌ Face detection skipped - video not ready. ReadyState:', video.readyState);
      return;
    }

    // Ensure canvas has proper dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      console.log('📐 Canvas dimensions set to:', canvas.width, 'x', canvas.height);
    }
    
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Enhanced face detection - check for skin tones and face-like patterns
      let skinTonePixels = 0;
      let brightPixels = 0;
      let darkPixels = 0;
      const totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        
        // Count bright pixels (face-like)
        if (brightness > 80 && brightness < 220) {
          brightPixels++;
        }
        
        // Count very dark pixels (covered camera)
        if (brightness < 30) {
          darkPixels++;
        }
        
        // Detect skin tones (more reliable than just brightness)
        // Skin tone detection: R > 95, G > 40, B > 20, R > G, R > B, |R - G| > 15
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
          skinTonePixels++;
        }
      }

      const brightRatio = brightPixels / totalPixels;
      const darkRatio = darkPixels / totalPixels;
      const skinToneRatio = skinTonePixels / totalPixels;
      
      // Face is detected if we see enough skin tone pixels OR reasonable brightness
      // Face is NOT detected if screen is mostly dark (camera covered/turned away)
      const faceIsPresent = (skinToneRatio > 0.08 || brightRatio > 0.25) && darkRatio < 0.7;
      
      console.log('🔍 Face detection analysis:', {
        skinTone: skinToneRatio.toFixed(3),
        bright: brightRatio.toFixed(3),
        dark: darkRatio.toFixed(3),
        facePresent: faceIsPresent,
        currentlyDetected: faceDetected
      });
      
      if (!faceIsPresent) {
        // Face not detected
        if (faceDetected) {
          // Face just disappeared - this is a NEW violation instance
          console.log('⚠️ FACE LOST - Logging violation');
          setFaceDetected(false);
          
          // Use callback form to get the latest count and pass it to logViolation
          setFaceNotDetectedCount(prevCount => {
            const newCount = prevCount + 1;
            console.log(`🚨 VIOLATION: Face not detected (violation #${newCount})`);
            
            // Log violation with the new count passed as override
            logViolation('face-not-detected', `Face not visible (violation ${newCount})`, newCount);
            
            return newCount;
          });
          
          noFaceDetectionCount.current++;
        } else {
          console.log('⚠️ Face still not detected...');
        }
      } else {
        // Face detected
        if (!faceDetected) {
          console.log('✅ Face DETECTED again');
          setFaceDetected(true);
        }
        // Reset timer when face is detected (but keep violation count)
        lastFaceDetectionTime.current = Date.now();
      }
    } catch (error) {
      console.error('❌ Error in face detection:', error);
    }
  };

  // Detect excessive background noise (improved to distinguish sustained noise from brief spikes)
  const detectNoise = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average noise level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    setNoiseLevel(average);

    // Add to noise history (keep last 5 seconds at 1 check per second)
    noiseLevelHistory.current.push(average);
    if (noiseLevelHistory.current.length > 5) {
      noiseLevelHistory.current.shift();
    }

    // Only trigger violation if noise is sustained (not just a brief spike like cough/sneeze)
    if (noiseLevelHistory.current.length >= 3) { // Need at least 3 seconds of data
      const recentLevels = noiseLevelHistory.current.slice(-3); // Last 3 seconds
      const sustainedHighNoise = recentLevels.filter(level => level > 60).length >= 2; // 2 out of 3 seconds high
      
      // Prevent duplicate violations within 10 seconds
      const now = Date.now();
      const timeSinceLastViolation = now - lastNoiseViolationTime.current;
      
      if (sustainedHighNoise && timeSinceLastViolation > 10000) {
        const avgRecent = recentLevels.reduce((a, b) => a + b, 0) / recentLevels.length;
        logViolation('excessive-noise', `Sustained background noise detected - possible conversation or music (level: ${Math.round(avgRecent)})`);
        lastNoiseViolationTime.current = now;
      }
    }
  };

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && proctoringEnabled && submitStatus !== 'success' && !isLocked) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        logViolation('tab-switch', `Candidate switched tabs/windows (count: ${newCount})`);
      }
    };

    const handleBlur = () => {
      if (proctoringEnabled && submitStatus !== 'success' && !isLocked) {
        logViolation('window-blur', 'Window lost focus - candidate may have switched applications');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [proctoringEnabled, submitStatus, tabSwitchCount, isLocked]);

  // Cleanup proctoring on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, []);

  // Prevent browser back button and warn user during assessment
  useEffect(() => {
    if (assessmentStarted && submitStatus !== 'success' && submitStatus !== 'locked') {
      // Prevent back button navigation
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        const confirmLeave = window.confirm(
          '⚠️ WARNING: Going back will reset your assessment!\n\n' +
          'All your answers will be lost and you will need to start over.\n\n' +
          'Are you sure you want to leave?'
        );
        
        if (!confirmLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        } else {
          // User confirmed - allow navigation but clear saved data
          localStorage.removeItem('campusHiringDraft');
        }
      };

      // Auto-submit on page refresh or close
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        // If assessment is in progress, auto-submit it
        if (assessmentStarted && submitStatus === 'idle') {
          // Use sendBeacon for reliable submission during unload
          const formData = new FormData();
          
          // Add all form data
          formData.append('candidateName', candidateName);
          formData.append('candidatePhone', candidatePhone);
          formData.append('candidateEmail', candidateEmail);
          formData.append('campusName', campusName);
          formData.append('answers', JSON.stringify(answers));
          formData.append('autoSubmit', 'true');
          formData.append('reason', 'Page refresh/close during assessment');
          
          // Add results
          const results = calculateResults();
          formData.append('totalScore', results.totalScore.toString());
          formData.append('maxScore', results.maxPossibleScore.toString());
          formData.append('percentage', results.percentage.toString());
          formData.append('categoryScores', JSON.stringify(results.categoryScores));
          
          // Add violation data
          const violationCounts: Record<string, number> = {};
          violations.forEach(v => {
            violationCounts[v.type] = (violationCounts[v.type] || 0) + 1;
          });
          formData.append('violations', JSON.stringify(violations));
          formData.append('totalViolations', violations.length.toString());
          formData.append('tabSwitchViolations', (violationCounts['tab-switch'] || 0).toString());
          formData.append('faceNotDetectedViolations', (violationCounts['face-not-detected'] || 0).toString());
          formData.append('multipleFacesViolations', (violationCounts['multiple-faces'] || 0).toString());
          formData.append('noiseViolations', (violationCounts['excessive-noise'] || 0).toString());
          formData.append('windowBlurViolations', (violationCounts['window-blur'] || 0).toString());
          
          // Use sendBeacon for reliable submission
          const scriptUrl = config.googleAppsScriptUrl || '';
          if (scriptUrl) {
            navigator.sendBeacon(scriptUrl, formData);
            console.log('🚨 Assessment auto-submitted due to page refresh/close');
          }
          
          // Clear the draft
          localStorage.removeItem('campusHiringDraft');
        }
        
        // Show warning message
        e.preventDefault();
        const message = 'Your assessment will be auto-submitted if you leave this page.';
        e.returnValue = message;
        return message;
      };

      // Add initial history state to enable back button detection
      window.history.pushState(null, '', window.location.href);
      
      // Auto-submit handler for page unload (more reliable, especially on mobile)
      const handlePageHide = () => {
        if (assessmentStarted && submitStatus === 'idle') {
          // Use sendBeacon for reliable submission during unload
          const formData = new FormData();
          
          formData.append('candidateName', candidateName);
          formData.append('candidatePhone', candidatePhone);
          formData.append('candidateEmail', candidateEmail);
          formData.append('campusName', campusName);
          formData.append('answers', JSON.stringify(answers));
          formData.append('autoSubmit', 'true');
          formData.append('reason', 'Page unload/hidden during assessment');
          
          const results = calculateResults();
          formData.append('totalScore', results.totalScore.toString());
          formData.append('maxScore', results.maxPossibleScore.toString());
          formData.append('percentage', results.percentage.toString());
          formData.append('categoryScores', JSON.stringify(results.categoryScores));
          
          const violationCounts: Record<string, number> = {};
          violations.forEach(v => {
            violationCounts[v.type] = (violationCounts[v.type] || 0) + 1;
          });
          formData.append('violations', JSON.stringify(violations));
          formData.append('totalViolations', violations.length.toString());
          formData.append('tabSwitchViolations', (violationCounts['tab-switch'] || 0).toString());
          formData.append('faceNotDetectedViolations', (violationCounts['face-not-detected'] || 0).toString());
          formData.append('multipleFacesViolations', (violationCounts['multiple-faces'] || 0).toString());
          formData.append('noiseViolations', (violationCounts['excessive-noise'] || 0).toString());
          formData.append('windowBlurViolations', (violationCounts['window-blur'] || 0).toString());
          
          const scriptUrl = config.googleAppsScriptUrl || '';
          if (scriptUrl) {
            navigator.sendBeacon(scriptUrl, formData);
            console.log('🚨 Assessment auto-submitted via pagehide event');
          }
          
          localStorage.removeItem('campusHiringDraft');
        }
      };
      
      // Add event listeners
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handlePageHide); // More reliable on mobile

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handlePageHide);
      };
    }
  }, [assessmentStarted, submitStatus, answers, candidateName, candidatePhone, candidateEmail, campusName, violations, config.googleAppsScriptUrl]);

  // Auto-save answers to localStorage as backup
  useEffect(() => {
    if (assessmentStarted && Object.keys(answers).length > 0) {
      const draftData = {
        answers,
        candidateName,
        candidatePhone,
        candidateEmail,
        campusName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('campusHiringDraft', JSON.stringify(draftData));
      
      // Show save indicator
      setLastSaved(new Date());
      setShowSaveIndicator(true);
      
      // Hide indicator after 2 seconds
      const timer = setTimeout(() => {
        setShowSaveIndicator(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [answers, candidateName, candidatePhone, candidateEmail, campusName, assessmentStarted]);

  // Load draft on mount (if available and within 1 hour)
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draftStr = localStorage.getItem('campusHiringDraft');
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          const draftTime = new Date(draft.timestamp).getTime();
          const now = new Date().getTime();
          const oneHour = 60 * 60 * 1000;
          
          // Only load if draft is less than 1 hour old
          if (now - draftTime < oneHour) {
            const restoreDraft = window.confirm(
              '📝 Found an incomplete assessment from your previous session.\n\n' +
              'Would you like to restore your answers?'
            );
            
            if (restoreDraft) {
              setAnswers(draft.answers || {});
              if (!candidateDataLoaded) {
                setCandidateName(draft.candidateName || '');
                setCandidatePhone(draft.candidatePhone || '');
                setCandidateEmail(draft.candidateEmail || '');
                setCampusName(draft.campusName || '');
              }
              console.log('✓ Draft restored:', Object.keys(draft.answers).length, 'answers');
            } else {
              localStorage.removeItem('campusHiringDraft');
            }
          } else {
            // Draft too old, remove it
            localStorage.removeItem('campusHiringDraft');
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
        localStorage.removeItem('campusHiringDraft');
      }
    };

    // Only try to load draft if not auto-loaded from URL
    if (!candidateDataLoaded) {
      loadDraft();
    }
  }, []); // Run only once on mount

  // Clear draft on successful submission
  useEffect(() => {
    if (submitStatus === 'success' || submitStatus === 'locked') {
      localStorage.removeItem('campusHiringDraft');
    }
  }, [submitStatus]);

  // Monitor face detection count and trigger lockout
  useEffect(() => {
    if (faceNotDetectedCount >= 2 && !isLocked && proctoringEnabled) {
      console.log('🚨 LOCKING OUT - 2 face detection violations (useEffect)');
      setIsLocked(true);
      setSubmitStatus('locked');
      setIsAutoSubmit(true);
      setTimeout(() => {
        handleSubmit(true);
      }, 100);
    }
  }, [faceNotDetectedCount, isLocked, proctoringEnabled]);

  // Monitor tab switch count and trigger lockout
  useEffect(() => {
    if (tabSwitchCount >= 3 && !isLocked && proctoringEnabled) {
      console.log('🚨 LOCKING OUT - 3 tab switch violations (useEffect)');
      setIsLocked(true);
      setSubmitStatus('locked');
      setIsAutoSubmit(true);
      setTimeout(() => {
        handleSubmit(true);
      }, 100);
    }
  }, [tabSwitchCount, isLocked, proctoringEnabled]);

  // Terminate session when locked out
  useEffect(() => {
    if (submitStatus === 'locked') {
      // Logout after 3 seconds to show the thank you message
      setTimeout(() => {
        logout();
      }, 3000);
    }
  }, [submitStatus, logout]);

  // Prevent right-click and copy-paste during assessment
  useEffect(() => {
    if (proctoringEnabled) {
      const preventContextMenu = (e: MouseEvent) => e.preventDefault();
      const preventCopy = (e: ClipboardEvent) => e.preventDefault();

      document.addEventListener('contextmenu', preventContextMenu);
      document.addEventListener('copy', preventCopy);
      document.addEventListener('cut', preventCopy);

      return () => {
        document.removeEventListener('contextmenu', preventContextMenu);
        document.removeEventListener('copy', preventCopy);
        document.removeEventListener('cut', preventCopy);
      };
    }
  }, [proctoringEnabled]);

  // Prevent screenshots and screen recordings
  useEffect(() => {
    if (proctoringEnabled && assessmentStarted) {
      let blockingActive = true;
      
      // Comprehensive screenshot prevention
      const preventScreenshot = (e: KeyboardEvent) => {
        if (!blockingActive) return;
        
        const key = e.key?.toLowerCase();
        const code = e.code?.toLowerCase();
        
        // PrintScreen key (all variations)
        if (key === 'printscreen' || code === 'printscreen' || key === 'print' || code === 'print') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          logViolation('window-blur', 'Screenshot attempt detected (Print Screen)');
          alert('⚠️ Screenshots are not allowed during the assessment!');
          return false;
        }
        
        // Windows Snipping Tool (Win+Shift+S, Ctrl+Shift+S)
        if (e.shiftKey && (e.key === 'S' || e.key === 's') && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          logViolation('window-blur', 'Screenshot attempt detected (Snipping Tool)');
          alert('⚠️ Screenshots are not allowed during the assessment!');
          return false;
        }
        
        // Mac screenshots (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
        if (e.metaKey && e.shiftKey && (key === '3' || key === '4' || key === '5')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          logViolation('window-blur', 'Screenshot attempt detected (Mac Screenshot)');
          alert('⚠️ Screenshots are not allowed during the assessment!');
          return false;
        }
        
        // Alt+PrintScreen (Active window screenshot)
        if (e.altKey && (key === 'printscreen' || code === 'printscreen')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          logViolation('window-blur', 'Screenshot attempt detected (Alt+Print Screen)');
          alert('⚠️ Screenshots are not allowed during the assessment!');
          return false;
        }
      };

      // Apply aggressive CSS to make screenshots black/unusable
      const style = document.createElement('style');
      style.id = 'screenshot-protection';
      style.textContent = `
        /* Disable text selection */
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        /* Apply DRM-like protection - makes screenshots black */
        body {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
        }
        
        /* Use video overlay technique - content appears in video element which screenshots as black */
        #root {
          filter: contrast(1.1) !important;
          will-change: filter;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }
      `;
      document.head.appendChild(style);
      
      // Add a black canvas overlay that captures screenshot attempts
      const blackCanvas = document.createElement('canvas');
      blackCanvas.id = 'screenshot-blocker';
      blackCanvas.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 999999 !important;
        pointer-events: none !important;
        mix-blend-mode: color !important;
        opacity: 0.01 !important;
      `;
      blackCanvas.width = window.innerWidth;
      blackCanvas.height = window.innerHeight;
      const ctx = blackCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, blackCanvas.width, blackCanvas.height);
      }
      document.body.appendChild(blackCanvas);

      // Blur screen on window focus loss (indicates recording/screenshot tool usage)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          logViolation('window-blur', 'Window lost focus - possible screen capture');
        }
      };

      // Add listeners with capture phase to intercept before any other handlers
      document.addEventListener('keydown', preventScreenshot, true);
      document.addEventListener('keyup', preventScreenshot, true);
      document.addEventListener('keypress', preventScreenshot, true);
      window.addEventListener('keydown', preventScreenshot, true);
      window.addEventListener('keyup', preventScreenshot, true);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        blockingActive = false;
        document.removeEventListener('keydown', preventScreenshot, true);
        document.removeEventListener('keyup', preventScreenshot, true);
        document.removeEventListener('keypress', preventScreenshot, true);
        window.removeEventListener('keydown', preventScreenshot, true);
        window.removeEventListener('keyup', preventScreenshot, true);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        const styleEl = document.getElementById('screenshot-protection');
        if (styleEl) {
          styleEl.remove();
        }
        const canvasEl = document.getElementById('screenshot-blocker');
        if (canvasEl) {
          canvasEl.remove();
        }
      };
    }
  }, [proctoringEnabled, assessmentStarted]);

  const handleCampusSelect = (campus: string) => {
    setCampusName(campus);
    setCampusSearchTerm('');
    setCampusSearchOpen(false);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const calculateResults = () => {
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    const categoryScores: Record<string, { score: number; max: number }> = {};
    
    // Initialize all categories and calculate their max scores dynamically
    questions.forEach(question => {
      if (!categoryScores[question.category]) {
        categoryScores[question.category] = { score: 0, max: 0 };
      }
      // Calculate max weight for this question (handle optional D)
      const maxWeight = Math.max(
        question.options.A.weight,
        question.options.B.weight,
        question.options.C.weight,
        question.options.D?.weight || 0
      );
      categoryScores[question.category].max += maxWeight;
      maxPossibleScore += maxWeight;
    });
    
    // Then add the actual scores from answers (unanswered questions get 0)
    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options[answer as 'A' | 'B' | 'C' | 'D'];
        if (option) {
          totalScore += option.weight;
          categoryScores[question.category].score += option.weight;
        }
      }
      // If no answer, score remains 0 (already initialized)
    });
    
    return {
      totalScore,
      maxPossibleScore,
      percentage: (totalScore / maxPossibleScore) * 100,
      categoryScores
    };
  };

  const handleSubmit = async (autoSubmit: boolean = false) => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Validation (skip for auto-submit)
    if (!autoSubmit) {
      if (!candidateName.trim()) {
        setErrorMessage('Please enter candidate name');
        setSubmitStatus('error');
        return;
      }

      if (!candidatePhone.trim()) {
        setErrorMessage('Please enter phone number');
        setSubmitStatus('error');
        return;
      }

      if (!candidateEmail.trim()) {
        setErrorMessage('Please enter candidate email');
        setSubmitStatus('error');
        return;
      }

      if (!campusName.trim()) {
        setErrorMessage('Please enter campus name');
        setSubmitStatus('error');
        return;
      }

      const unansweredQuestions = questions.filter(q => !answers[q.id]);
      if (unansweredQuestions.length > 0) {
        setErrorMessage(`Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`);
        setSubmitStatus('error');
        return;
      }
    } else {
      // For auto-submit, check if basic info is filled
      if (!candidateName.trim() || !candidatePhone.trim() || !candidateEmail.trim() || !campusName.trim()) {
        setErrorMessage('Time expired! Please ensure all candidate information is filled.');
        setSubmitStatus('error');
        return;
      }
    }

    setLoading(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const results = calculateResults();
      const now = new Date();
      const timestamp = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      console.log('=== Campus Hiring Assessment Submission ===');
      console.log('Candidate:', candidateName);
      console.log('Total Score:', results.totalScore, '/', results.maxPossibleScore, '=', results.percentage.toFixed(2) + '%');
      console.log('Category Scores:');
      Object.entries(results.categoryScores).forEach(([category, scores]) => {
        const categoryPercentage = (scores.score / scores.max) * 100;
        console.log(`  ${category}: ${scores.score}/${scores.max} = ${categoryPercentage.toFixed(2)}%`);
      });

      // Prepare submission data
      const formData = new URLSearchParams();
      formData.append('submissionTime', timestamp);
      formData.append('candidateName', candidateName);
      formData.append('candidatePhone', candidatePhone);
      formData.append('candidateEmail', candidateEmail);
      formData.append('campusName', campusName);
      formData.append('totalScore', results.totalScore.toString());
      formData.append('maxScore', results.maxPossibleScore.toString());
      formData.append('scorePercentage', results.percentage.toFixed(2));

      // Add all answers
      questions.forEach(question => {
        const answer = answers[question.id];
        if (answer) {
          const option = question.options[answer as 'A' | 'B' | 'C'];
          formData.append(`${question.id}`, answer);
          
          // Normalize weights:
          // - Psychometric (Q1-Q5): Keep original weights (1, 2, 3)
          // - All other categories (Q6-Q30): Convert to 1 or 0
          //   Weight 3 = correct = 1 mark
          //   Weight 1 or 2 = incorrect = 0 marks
          const questionNum = parseInt(question.id.replace('Q', ''));
          let normalizedWeight = option.weight;
          
          if (questionNum > 5) { // Non-psychometric questions
            // If weight is 3, it's the correct answer = 1 mark
            // Otherwise it's incorrect = 0 marks
            normalizedWeight = option.weight === 3 ? 1 : 0;
          }
          
          formData.append(`${question.id}_weight`, normalizedWeight.toString());
          formData.append(`${question.id}_category`, question.category);
        }
      });

      // Add category scores
      Object.entries(results.categoryScores).forEach(([category, scores]) => {
        const categoryPercentage = (scores.score / scores.max) * 100;
        formData.append(`category_${category}`, categoryPercentage.toFixed(2));
      });

      // Add proctoring data
      formData.append('proctoringEnabled', proctoringEnabled.toString());
      formData.append('totalViolations', violations.length.toString());
      formData.append('tabSwitchCount', tabSwitchCount.toString());
      
      // Add violation details as JSON string
      if (violations.length > 0) {
        formData.append('violationDetails', JSON.stringify(violations));
        
        // Count violations by type
        const violationCounts = violations.reduce((acc, v) => {
          acc[v.type] = (acc[v.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        formData.append('tabSwitchViolations', (violationCounts['tab-switch'] || 0).toString());
        formData.append('faceNotDetectedViolations', (violationCounts['face-not-detected'] || 0).toString());
        formData.append('multipleFacesViolations', (violationCounts['multiple-faces'] || 0).toString());
        formData.append('excessiveNoiseViolations', (violationCounts['excessive-noise'] || 0).toString());
        formData.append('windowBlurViolations', (violationCounts['window-blur'] || 0).toString());
      }

      // Submit to Google Apps Script
      const scriptUrl = config.CAMPUS_HIRING_SCRIPT_URL || '';
      
      if (!scriptUrl) {
        throw new Error('Campus Hiring Script URL not configured. Please contact administrator.');
      }

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setSubmitStatus('success');
        // Stop proctoring on successful submission
        stopProctoring();
        
        // Terminate session after 2 seconds
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit assessment');
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const results = calculateResults();

  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, QuestionData[]>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Anti-screenshot watermark overlay */}
      {proctoringEnabled && assessmentStarted && (
        <div 
          className="fixed inset-0 pointer-events-none z-50 select-none"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 100px,
              rgba(99, 102, 241, 0.03) 100px,
              rgba(99, 102, 241, 0.03) 200px
            )`
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none rotate-[-30deg] text-6xl font-bold text-indigo-600 whitespace-nowrap">
            {candidateName || candidateEmail} • {new Date().toLocaleString()} • CONFIDENTIAL
          </div>
        </div>
      )}

      {/* Hidden video and canvas elements - always in DOM for ref access */}
      {/* Hidden video and canvas for face detection processing */}
      <div style={{ position: 'absolute', left: '-9999px', width: '640px', height: '480px', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '640px', height: '480px' }}
        />
        <canvas ref={canvasRef} width={640} height={480} />
      </div>

      {/* Show Rules Page First */}
      {showRules ? (
        <>
          {/* Rules Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <Brain className="w-12 h-12" />
              <div>
                <h2 className="text-3xl font-bold">Third Wave Coffee | Campus Drive</h2>
                <p className="text-cyan-100 mt-1">Psychometric Assessment - Instructions & Rules</p>
              </div>
            </div>
          </div>

          {/* Assessment Rules */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-cyan-500" />
                Assessment Rules & Guidelines
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                Please read the following rules carefully before starting the assessment. Failure to comply may result in disqualification.
              </p>
            </div>

            {/* Rules List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Time Limit: 30 Minutes</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    The timer starts as soon as you begin the assessment. The test will auto-submit when time expires. 
                    You'll receive warnings at 5 minutes and 1 minute remaining.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <Video className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Camera & Microphone Required</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    This assessment requires continuous proctoring. Your camera and microphone must remain on throughout. 
                    The video feed is processed locally and not recorded or stored.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Face Must Be Visible</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Your face must be clearly visible at all times. Looking away for more than 3 seconds will be logged as a violation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <Wifi className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">No Tab Switching</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Switching tabs, opening new windows, or leaving the assessment page will be tracked as violations. 
                    Stay on this page until submission.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Volume2 className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Minimal Background Noise</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Choose a quiet environment. Excessive background noise or conversations will be detected and logged.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
                <AlertCircle className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Assessment Structure</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    30 multiple-choice questions covering Communication, Problem Solving, Customer Service, Teamwork, and Adaptability. 
                    All questions must be answered before submission.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">⚠️ Do Not Press Back Button</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Using the browser back button or swiping back will trigger a warning as it may reset your progress. 
                    Your answers are auto-saved, but stay on this page to avoid disruption.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <EyeOff className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">🚫 Screenshots & Screen Recording Prohibited</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Screenshots, screen recordings, and screen sharing are strictly prohibited and will be detected. 
                    Any attempt will be logged as a violation and may result in disqualification.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="mt-8 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-600" />
                Privacy & Data Protection
              </h4>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Your privacy is our priority. The camera and microphone are used solely for proctoring purposes. 
                Video/audio feeds are analyzed in real-time within your browser and are NOT recorded, stored, or transmitted to any server. 
                Only violation counts and timestamps are saved with your assessment results.
              </p>
            </div>

            {/* Agreement Checkbox */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <p className="text-center text-gray-700 dark:text-slate-300 mb-6 font-medium">
                By clicking "Start Proctoring & Begin Assessment", you confirm that you have read and agree to follow all assessment rules and guidelines.
              </p>
            </div>
          </div>

          {/* Proctoring Panel */}
          {!proctoringEnabled ? (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg p-4 sm:p-8 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Video className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                  <h3 className="text-lg sm:text-2xl font-bold">Enable Proctoring to Start</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={startProctoring}
                    className="bg-white text-purple-600 px-4 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg text-base sm:text-lg w-full sm:w-auto"
                  >
                    <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                    Start Proctoring & Begin
                  </button>
                  
                  {/* Debug: Test camera directly */}
                  <button
                    onClick={async () => {
                      try {
                        const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                        console.log('Test stream obtained:', testStream);
                        console.log('Video tracks:', testStream.getVideoTracks());
                        console.log('Audio tracks:', testStream.getAudioTracks());
                        alert('Camera/Mic working! Tracks: ' + testStream.getTracks().length);
                        testStream.getTracks().forEach(track => track.stop());
                      } catch (err) {
                        console.error('Test failed:', err);
                        alert('Camera test failed: ' + (err as Error).message);
                      }
                    }}
                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded text-sm hover:bg-purple-200 transition-all duration-200 w-full sm:w-auto"
                  >
                    🔧 Test Camera
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <h3 className="font-bold">Proctoring Active</h3>
                  <p className="text-sm">Assessment will begin in a moment...</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Original Assessment UI - Only shown after proctoring is enabled */}
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Third Wave Coffee | Campus Drive</h2>
              </div>
              
              {/* Timer Display */}
              <div className={`flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg border-2 ${
                timeRemaining <= 300 ? 'border-red-400 animate-pulse' : 
                timeRemaining <= 600 ? 'border-orange-400' : 
                'border-white/30'
              }`}>
                <Clock className="w-6 h-6" />
                <div>
                  <div className="text-xs font-medium opacity-90">Time Remaining</div>
                  <div className={`text-2xl font-bold tracking-wider ${
                    timeRemaining <= 300 ? 'text-red-100' : 
                    timeRemaining <= 600 ? 'text-orange-100' : 
                    'text-white'
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
              
              {/* Auto-save Indicator */}
              {showSaveIndicator && assessmentStarted && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-400/30 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-green-200" />
                  <span className="text-xs text-green-100 font-medium">Auto-saved</span>
                </div>
              )}
            </div>
            
            {/* Timer warning message */}
            {timeRemaining <= 300 && timeRemaining > 0 && (
              <div className="mt-4 bg-red-500/20 border border-red-300/50 rounded px-4 py-2 text-sm">
                ⚠️ Less than 5 minutes remaining! The assessment will auto-submit when time expires.
              </div>
            )}
          </div>
        </>
      )}

      {/* Status Messages - Only show during assessment */}
      {!showRules && (
        <>
          {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="fixed inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center z-50">
          <div className="text-center text-white px-8 py-12 max-w-2xl">
            <CheckCircle className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-4">
              Thanks for taking the Assessment!
            </h1>
            <p className="text-2xl font-light mb-8">
              You can close this tab.
            </p>
          </div>
        </div>
      )}

      {submitStatus === 'error' && errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Submission Error</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Locked Out Screen */}
      {submitStatus === 'locked' && (
        <div className="fixed inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center z-50">
          <div className="text-center text-white px-8 py-12 max-w-2xl">
            <CheckCircle className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-4">
              Thanks for taking the Assessment!
            </h1>
            <p className="text-2xl font-light mb-8">
              You can close this tab.
            </p>
          </div>
        </div>
      )}

      {/* Noise Warning Snackbars */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {noiseWarnings.map((warning, index) => (
          <div
            key={index}
            className="animate-slide-in-right bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 max-w-md"
          >
            <Volume2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{warning}</span>
          </div>
        ))}
      </div>

      {/* Proctoring Panel */}
      {!proctoringEnabled ? (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg p-4 sm:p-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Video className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <h3 className="text-lg sm:text-xl font-bold">Enable Proctoring</h3>
              </div>
              <p className="text-sm text-purple-100 mb-4">
                This assessment requires proctoring to ensure integrity. We will monitor:
              </p>
              <ul className="text-sm space-y-2 text-purple-100">
                <li className="flex items-center gap-2">
                  <Eye className="w-4 h-4 flex-shrink-0" /> 
                  <span>Face detection - ensuring you're present and focused</span>
                </li>
                <li className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 flex-shrink-0" /> 
                  <span>Tab switching - preventing unauthorized browsing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 flex-shrink-0" /> 
                  <span>Background noise - detecting excessive disturbances</span>
                </li>
              </ul>
              <p className="text-xs text-purple-200 mt-4">
                Your privacy is important. Video feed is processed locally and not recorded or stored.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:gap-3 sm:ml-6 w-full sm:w-auto">
              <button
                onClick={startProctoring}
                className="bg-white text-purple-600 px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg text-base w-full sm:w-auto"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Proctoring
              </button>
              
              {/* Debug: Test camera directly */}
              <button
                onClick={async () => {
                  try {
                    const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    console.log('Test stream obtained:', testStream);
                    console.log('Video tracks:', testStream.getVideoTracks());
                    console.log('Audio tracks:', testStream.getAudioTracks());
                    alert('Camera/Mic working! Tracks: ' + testStream.getTracks().length);
                    testStream.getTracks().forEach(track => track.stop());
                  } catch (err) {
                    console.error('Test failed:', err);
                    alert('Camera test failed: ' + (err as Error).message);
                  }
                }}
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded text-sm hover:bg-purple-200 transition-all duration-200 w-full sm:w-auto"
              >
                🔧 Test Camera
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Proctoring Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Monitoring Status
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                <span className="text-sm text-gray-700 dark:text-slate-300">Face Detection</span>
                <span className={`font-bold flex items-center gap-1 ${faceDetected ? 'text-green-600' : 'text-red-600'}`}>
                  {faceDetected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {faceDetected ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                <span className="text-sm text-gray-700 dark:text-slate-300">Tab Switches</span>
                <span className={`font-bold ${tabSwitchCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {tabSwitchCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                <span className="text-sm text-gray-700 dark:text-slate-300">Total Violations</span>
                <span className={`font-bold ${violations.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {violations.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                <span className="text-sm text-gray-700 dark:text-slate-300">Noise Level</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        noiseLevel > 50 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (noiseLevel / 100) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(noiseLevel)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Violations */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center justify-between">
              <span>Violations Summary</span>
              <span className={`text-sm px-2 py-1 rounded ${violations.length > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                Total: {violations.length}
              </span>
            </h4>
            
            {/* Violation Type Breakdown */}
            {violations.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-slate-700 rounded space-y-2">
                {Object.entries(
                  violations.reduce((acc, v) => {
                    acc[v.type] = (acc[v.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-slate-300">
                      {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">{count}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Recent Violations List */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {violations.slice(-5).reverse().map((violation, index) => (
                <div key={index} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {violation.type.replace(/-/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-gray-600 dark:text-slate-400 mt-1">{violation.details}</div>
                  <div className="text-gray-500 dark:text-slate-500 text-xs mt-1">{violation.timestamp}</div>
                </div>
              ))}
              {violations.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
                  ✓ No violations detected
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Information */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Candidate Information
          {candidateDataLoaded && (
            <span className="ml-auto text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Auto-loaded
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Candidate Name *
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              disabled={isLocked || candidateDataLoaded}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter candidate name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={candidatePhone}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers, +, -, (, ), and spaces
                const sanitized = value.replace(/[^0-9+\-() ]/g, '');
                setCandidatePhone(sanitized);
              }}
              onKeyPress={(e) => {
                // Allow only numbers, +, -, (, ), space, and backspace
                const char = e.key;
                if (!/[0-9+\-() ]/.test(char) && char !== 'Backspace') {
                  e.preventDefault();
                }
              }}
              disabled={isLocked || candidateDataLoaded}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="+91 XXXXX XXXXX"
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              disabled={isLocked || candidateDataLoaded}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="candidate@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Campus Name *
            </label>
            <div className="relative" ref={campusDropdownRef}>
              <div
                className={`w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 flex items-center justify-between ${
                  isLocked || candidateDataLoaded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => !isLocked && !candidateDataLoaded && setCampusSearchOpen(!campusSearchOpen)}
              >
                <span className={campusName ? '' : 'text-gray-400 dark:text-slate-500'}>
                  {campusName || 'Select campus'}
                </span>
                {!candidateDataLoaded && (
                  <ChevronDown className={`w-4 h-4 transition-transform ${campusSearchOpen ? 'rotate-180' : ''}`} />
                )}
              </div>
              
              {campusSearchOpen && !candidateDataLoaded && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
                  {/* Search input */}
                  <div className="p-2 border-b border-gray-200 dark:border-slate-600">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={campusSearchTerm}
                        onChange={(e) => setCampusSearchTerm(e.target.value)}
                        placeholder="Search campus..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  {/* Options list */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCampuses.length > 0 ? (
                      filteredCampuses.map((campus) => (
                        <div
                          key={campus}
                          className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${
                            campusName === campus ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-slate-100'
                          }`}
                          onClick={() => handleCampusSelect(campus)}
                        >
                          {campus}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500 dark:text-slate-400 text-sm">
                        No campus found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {candidateDataLoaded && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Your information has been automatically loaded and cannot be modified. If this is incorrect, please contact the administrator.
            </p>
          </div>
        )}
      </div>

      {/* Progress Summary - Questions Only */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Assessment Progress
        </h3>
        <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
          <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
            {Object.keys(answers).length}/{questions.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Questions Completed</div>
        </div>
      </div>

      {/* Questions by Category */}
      {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => {
        // Calculate the starting index for this category
        const previousCategories = Object.keys(questionsByCategory).slice(0, Object.keys(questionsByCategory).indexOf(category));
        const startIndex = previousCategories.reduce((sum, cat) => sum + questionsByCategory[cat].length, 0);
        
        return (
          <div key={category} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="space-y-6">
              {categoryQuestions.map((question, index) => {
                const globalIndex = startIndex + index + 1; // +1 for 1-based indexing
                return (
                  <div key={question.id} className="border-b border-gray-200 dark:border-slate-700 last:border-0 pb-6 last:pb-0">
                    <p className="font-medium text-gray-900 dark:text-slate-100 mb-4">
                      {globalIndex}. {question.text}
                    </p>
                    
                    {/* Display image if present */}
                    {question.image && (
                      <div className="my-4 flex justify-center">
                        <img 
                          src={question.image} 
                          alt={`Question ${globalIndex} diagram`}
                          className="max-w-full h-auto border-2 border-gray-300 dark:border-slate-600 rounded-lg p-4 bg-white"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {Object.entries(question.options).map(([key, option]) => (
                        <label
                          key={key}
                          className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                            isLocked 
                              ? 'cursor-not-allowed opacity-50' 
                              : 'cursor-pointer'
                          } ${
                            answers[question.id] === key
                              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                              : 'border-gray-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={key}
                            checked={answers[question.id] === key}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            disabled={isLocked}
                            className="mt-1 text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <span className="text-gray-900 dark:text-slate-100">{key}. {option.text}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border-t-4 border-cyan-500">
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading || isLocked}
            className="btn-primary-gradient text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Submit Assessment
              </>
            )}
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default CampusHiringChecklist;
