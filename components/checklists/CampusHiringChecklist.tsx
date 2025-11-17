import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, AlertCircle, Building2, User, Calendar, Brain, TrendingUp, ChevronRight, ChevronDown, Search, Clock, Video, VideoOff, Eye, EyeOff, Volume2, Wifi } from 'lucide-react';
import { UserRole } from '../../roleMapping';
import { useComprehensiveMapping } from '../../hooks/useComprehensiveMapping';
import { useConfig } from '../../contexts/ConfigContext';

interface CampusHiringChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

interface QuestionData {
  id: string;
  text: string;
  category: string;
  options: {
    A: { text: string; weight: number };
    B: { text: string; weight: number };
    C: { text: string; weight: number };
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
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [campusName, setCampusName] = useState('');
  const [campusSearchOpen, setCampusSearchOpen] = useState(false);
  const [campusSearchTerm, setCampusSearchTerm] = useState('');
  
  // Campus options
  const campusOptions = [
    'IHM Pusa',
    'IHM Mumbai',
    'IHM Bangalore',
    'IHM Chennai',
    'IHM Bhuwaneshwar',
    'IHM Jaipur'
  ];
  
  // Filtered campus options based on search
  const filteredCampuses = campusOptions.filter(campus =>
    campus.toLowerCase().includes(campusSearchTerm.toLowerCase())
  );
  
  // Questions and answers
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Psychometric Assessment Questions with weightage
  const questions: QuestionData[] = [
    {
      id: 'Q1',
      text: "Imagine you're explaining a new drink recipe to a teammate whose first language isn't English. You:",
      category: 'Communication',
      options: {
        A: { text: 'Repeat exactly what was told to you', weight: 1 },
        B: { text: 'Try to explain in simple words and gestures', weight: 2 },
        C: { text: "Ask them what part they didn't understand and explain accordingly", weight: 3 }
      }
    },
    {
      id: 'Q2',
      text: "You're drafting a customer-facing message. You:",
      category: 'Communication',
      options: {
        A: { text: 'Write it quickly and send', weight: 1 },
        B: { text: 'Double-check grammar and spelling', weight: 2 },
        C: { text: 'Read it out loud to see how it sounds and adjust tone', weight: 3 }
      }
    },
    {
      id: 'Q3',
      text: 'A drink consistently tastes off. You:',
      category: 'Problem Solving',
      options: {
        A: { text: 'Remake it and hope it improves next time', weight: 1 },
        B: { text: 'Try adjusting the grind or recipe slightly', weight: 2 },
        C: { text: 'Document the issue and escalate it to the trainer', weight: 3 }
      }
    },
    {
      id: 'Q4',
      text: 'You see two regular customers arguing over table space. You:',
      category: 'Problem Solving',
      options: {
        A: { text: 'Avoid getting involved', weight: 1 },
        B: { text: 'Politely ask them to lower their voices', weight: 2 },
        C: { text: 'Listen first, then find a quick win-win solution', weight: 3 }
      }
    },
    {
      id: 'Q5',
      text: "Your team isn't following the cleaning checklist. You:",
      category: 'Leadership',
      options: {
        A: { text: "Do it yourself without mentioning it", weight: 1 },
        B: { text: 'Remind them casually', weight: 2 },
        C: { text: 'Call a short huddle and reinforce expectations', weight: 3 }
      }
    },
    {
      id: 'Q6',
      text: 'You spot a loose screw on a grinder. You:',
      category: 'Attention to Detail',
      options: {
        A: { text: "Ignore it for now; it's still working", weight: 1 },
        B: { text: 'Mention it in the WhatsApp group', weight: 2 },
        C: { text: 'Tag it and report it via maintenance SOP', weight: 3 }
      }
    },
    {
      id: 'Q7',
      text: 'A team member is constantly late. You:',
      category: 'Leadership',
      options: {
        A: { text: 'Cover their shift and stay silent', weight: 1 },
        B: { text: "Ask them what's happening", weight: 2 },
        C: { text: 'Discuss it constructively in your 1-on-1', weight: 3 }
      }
    },
    {
      id: 'Q8',
      text: 'Your shift reports are often missing small details. You:',
      category: 'Attention to Detail',
      options: {
        A: { text: 'Focus on just submitting them on time', weight: 1 },
        B: { text: 'Start using a checklist to double-check', weight: 2 },
        C: { text: 'Ask peers for feedback and improve accuracy', weight: 3 }
      }
    },
    {
      id: 'Q9',
      text: 'A customer says their drink tastes "strange." You:',
      category: 'Customer Service',
      options: {
        A: { text: 'Say sorry and move on', weight: 1 },
        B: { text: 'Offer to remake it once', weight: 2 },
        C: { text: 'Ask specifics and tailor a solution', weight: 3 }
      }
    },
    {
      id: 'Q10',
      text: 'Your supplier offers to deliver faster if you pay in cash under the table. You:',
      category: 'Integrity',
      options: {
        A: { text: "Accept since it's quicker", weight: 1 },
        B: { text: 'Delay and think about it', weight: 2 },
        C: { text: 'Decline and report to Ops', weight: 3 }
      }
    },
    {
      id: 'Q11',
      text: "The AC isn't working, and the café is full. You:",
      category: 'Problem Solving',
      options: {
        A: { text: 'Do nothing and wait', weight: 1 },
        B: { text: 'Apologize to customers', weight: 2 },
        C: { text: 'Offer ice water, open windows, call maintenance', weight: 3 }
      }
    },
    {
      id: 'Q12',
      text: 'A guest wants a very complex drink. You:',
      category: 'Customer Service',
      options: {
        A: { text: "Say it can't be made", weight: 1 },
        B: { text: 'Try your best to match it', weight: 2 },
        C: { text: 'Make it personal and engaging', weight: 3 }
      }
    },
    {
      id: 'Q13',
      text: "You've had a long day and another team asks for help. You:",
      category: 'Teamwork',
      options: {
        A: { text: 'Say no immediately', weight: 1 },
        B: { text: "Ask if it's urgent", weight: 2 },
        C: { text: 'Pitch in briefly, then recharge', weight: 3 }
      }
    },
    {
      id: 'Q14',
      text: 'You have 10 tasks and limited time. You:',
      category: 'Time Management',
      options: {
        A: { text: 'Do the easiest things first', weight: 1 },
        B: { text: 'Estimate time and divide work', weight: 2 },
        C: { text: 'Prioritize based on customer impact', weight: 3 }
      }
    },
    {
      id: 'Q15',
      text: 'An event is scheduled tomorrow. You:',
      category: 'Planning',
      options: {
        A: { text: 'Plan on the fly', weight: 1 },
        B: { text: "Check last year's notes", weight: 2 },
        C: { text: 'Create a checklist and prep ahead', weight: 3 }
      }
    },
    {
      id: 'Q16',
      text: 'The new menu changes every week. You:',
      category: 'Adaptability',
      options: {
        A: { text: 'Complain to others', weight: 1 },
        B: { text: 'Try learning it when needed', weight: 2 },
        C: { text: 'Block time to master it and quiz others', weight: 3 }
      }
    },
    {
      id: 'Q17',
      text: 'You need to brief a team from a different city. You:',
      category: 'Communication',
      options: {
        A: { text: 'Use complex English as in HQ docs', weight: 1 },
        B: { text: 'Simplify your language', weight: 2 },
        C: { text: 'Use visuals, voice notes, and examples', weight: 3 }
      }
    },
    {
      id: 'Q18',
      text: "The POS isn't responding. You:",
      category: 'Problem Solving',
      options: {
        A: { text: 'Wait for someone else to fix it', weight: 1 },
        B: { text: 'Restart and try again', weight: 2 },
        C: { text: 'Switch to manual billing and log issue', weight: 3 }
      }
    },
    {
      id: 'Q19',
      text: 'You spot three small hygiene errors. You:',
      category: 'Attention to Detail',
      options: {
        A: { text: 'Fix one and move on', weight: 1 },
        B: { text: "Fix all but don't mention them", weight: 2 },
        C: { text: 'Correct, record, and coach others', weight: 3 }
      }
    },
    {
      id: 'Q20',
      text: "You're asked why cold brews aren't selling. You:",
      category: 'Analysis',
      options: {
        A: { text: "Say customers don't want it", weight: 1 },
        B: { text: 'Blame the weather', weight: 2 },
        C: { text: 'Check recipe, pitch quality, offer sampling', weight: 3 }
      }
    },
    {
      id: 'Q21',
      text: 'Your handheld ordering device has new features. You:',
      category: 'Adaptability',
      options: {
        A: { text: 'Avoid using it', weight: 1 },
        B: { text: 'Ask others how to use it', weight: 2 },
        C: { text: 'Explore it and teach teammates', weight: 3 }
      }
    },
    {
      id: 'Q22',
      text: 'A team member is demotivated. You:',
      category: 'Leadership',
      options: {
        A: { text: 'Hope they come around', weight: 1 },
        B: { text: 'Say something encouraging', weight: 2 },
        C: { text: 'Sit down and explore the root cause', weight: 3 }
      }
    },
    {
      id: 'Q23',
      text: 'You find a wallet on the café floor. You:',
      category: 'Integrity',
      options: {
        A: { text: 'Leave it at the counter', weight: 1 },
        B: { text: 'Keep it safe and note the time', weight: 2 },
        C: { text: 'Record it and report to shift lead', weight: 3 }
      }
    },
    {
      id: 'Q24',
      text: 'A guest insists they ordered something different. You:',
      category: 'Customer Service',
      options: {
        A: { text: 'Tell them the bill is final', weight: 1 },
        B: { text: 'Check with the barista', weight: 2 },
        C: { text: 'Apologize and offer to remake it', weight: 3 }
      }
    },
    {
      id: 'Q25',
      text: 'A customer points out expired stock on display. You:',
      category: 'Integrity',
      options: {
        A: { text: 'Remove it silently', weight: 1 },
        B: { text: 'Apologize and inform staff', weight: 2 },
        C: { text: 'Apologize, remove it, and update inventory', weight: 3 }
      }
    },
    {
      id: 'Q26',
      text: "It's rush hour and your delivery order sheet is missing. You:",
      category: 'Problem Solving',
      options: {
        A: { text: 'Panic and improvise', weight: 1 },
        B: { text: 'Take a photo of the kitchen docket', weight: 2 },
        C: { text: 'Reconfirm verbally and redo the order sheet', weight: 3 }
      }
    },
    {
      id: 'Q27',
      text: 'Your LMS assignment is due today. You:',
      category: 'Time Management',
      options: {
        A: { text: 'Skip it for now', weight: 1 },
        B: { text: 'Skim through and submit', weight: 2 },
        C: { text: 'Do it with full attention before closing', weight: 3 }
      }
    },
    {
      id: 'Q28',
      text: "You've received critical feedback. You:",
      category: 'Growth Mindset',
      options: {
        A: { text: 'Defend yourself', weight: 1 },
        B: { text: 'Think about it later', weight: 2 },
        C: { text: 'Reflect, ask questions, and improve', weight: 3 }
      }
    },
    {
      id: 'Q29',
      text: "You're under pressure but your team is new. You:",
      category: 'Teamwork',
      options: {
        A: { text: 'Focus only on your work', weight: 1 },
        B: { text: 'Guide quickly when needed', weight: 2 },
        C: { text: "Support them patiently even if it's slower", weight: 3 }
      }
    },
    {
      id: 'Q30',
      text: "A customer speaks a regional language you don't know. You:",
      category: 'Adaptability',
      options: {
        A: { text: 'Smile and ignore the details', weight: 1 },
        B: { text: 'Ask someone else to talk', weight: 2 },
        C: { text: 'Use gestures, translator, or images', weight: 3 }
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
    let maxPossibleScore = questions.length * 3; // Max weight is 3 per question
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (question && answer) {
        const option = question.options[answer as 'A' | 'B' | 'C'];
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
      console.log('Face detection skipped - video or canvas not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.log('Face detection skipped - no canvas context');
      return;
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('Face detection skipped - video not ready. ReadyState:', video.readyState);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple brightness-based detection (face detection proxy)
      let brightPixels = 0;
      const totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 80 && brightness < 220) {
          brightPixels++;
        }
      }

      const facePresenceRatio = brightPixels / totalPixels;
      console.log('🔍 Face detection - Presence ratio:', facePresenceRatio.toFixed(3), 'Currently detected:', faceDetected);
      
      // If less than 20% of pixels match face-like brightness, consider face not detected
      if (facePresenceRatio < 0.2) {
        // Face not detected
        if (faceDetected) {
          // Face just disappeared - this is a NEW violation instance
          console.log('⚠️ Face not detected - logging violation. Ratio:', facePresenceRatio);
          setFaceDetected(false);
          
          // Use callback form to get the latest count and pass it to logViolation
          setFaceNotDetectedCount(prevCount => {
            const newCount = prevCount + 1;
            console.log(`🚨 VIOLATION: Face not detected (violation #${newCount})`);
            
            // Log violation with the new count passed as override
            logViolation('face-not-detected', `Face not visible (violation ${newCount}/2)`, newCount);
            
            return newCount;
          });
          
          noFaceDetectionCount.current++;
        }
      } else {
        // Face detected
        if (!faceDetected) {
          console.log('✓ Face detected again - ratio:', facePresenceRatio);
          setFaceDetected(true);
        }
        // Reset timer when face is detected (but keep violation count)
        lastFaceDetectionTime.current = Date.now();
      }
    } catch (error) {
      console.error('Error in face detection:', error);
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
    let maxPossibleScore = questions.length * 3;
    
    const categoryScores: Record<string, { score: number; max: number }> = {};
    
    // First, initialize all categories with their max scores
    questions.forEach(question => {
      if (!categoryScores[question.category]) {
        categoryScores[question.category] = { score: 0, max: 0 };
      }
      categoryScores[question.category].max += 3; // Each question has max weight of 3
    });
    
    // Then add the actual scores from answers (unanswered questions get 0)
    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options[answer as 'A' | 'B' | 'C'];
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
          formData.append(`${question.id}_weight`, option.weight.toString());
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
        // Clear form after successful submission
        setTimeout(() => {
          setCandidateName('');
          setCandidatePhone('');
          setCandidateEmail('');
          setCampusName('');
          setAnswers({});
          setSubmitStatus('idle');
          setViolations([]);
          setTabSwitchCount(0);
        }, 3000);
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
      {/* Hidden video and canvas elements - always in DOM for ref access */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} />
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
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Video className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Enable Proctoring to Start</h3>
                  </div>
                  <p className="text-sm text-purple-100 mb-4">
                    Click the button to enable your camera and microphone. The assessment will begin automatically once proctoring is active.
                  </p>
                  <ul className="text-sm space-y-2 text-purple-100">
                    <li className="flex items-center gap-2">
                      <Eye className="w-4 h-4" /> 
                      <span>Face detection - ensuring you're present and focused</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Wifi className="w-4 h-4" /> 
                      <span>Tab switching - preventing unauthorized browsing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" /> 
                      <span>Background noise - detecting excessive disturbances</span>
                    </li>
                  </ul>
                  <p className="text-xs text-purple-200 mt-4">
                    Video feed is processed locally and not recorded or stored.
                  </p>
                </div>
                <div className="ml-6 flex flex-col gap-3">
                  <button
                    onClick={startProctoring}
                    className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center gap-2 shadow-lg"
                  >
                    <Video className="w-5 h-5" />
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
                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded text-sm hover:bg-purple-200 transition-all duration-200"
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
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              {isAutoSubmit ? 'Time Expired - Assessment Auto-Submitted!' : 'Assessment Submitted Successfully!'}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              {isAutoSubmit 
                ? 'Your assessment has been automatically submitted as the time limit was reached. Unanswered questions have been scored as 0.'
                : 'The psychometric assessment has been recorded.'
              }
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
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-600 rounded-lg p-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
              Assessment Locked - Violation Detected
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {faceNotDetectedCount >= 2 
                ? 'Your assessment has been automatically submitted due to multiple instances of face not being detected. This is a violation of assessment integrity rules.'
                : 'Your assessment has been automatically submitted due to multiple tab switches. This is a violation of assessment integrity rules.'
              }
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Violation Summary:</h4>
              <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
                <li>• Face not detected violations: {faceNotDetectedCount}</li>
                <li>• Tab switch violations: {tabSwitchCount}</li>
                <li>• Assessment status: Auto-submitted</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-4">
              Please contact the administrator if you believe this is an error.
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
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Video className="w-6 h-6" />
                <h3 className="text-xl font-bold">Enable Proctoring</h3>
              </div>
              <p className="text-sm text-purple-100 mb-4">
                This assessment requires proctoring to ensure integrity. We will monitor:
              </p>
              <ul className="text-sm space-y-2 text-purple-100">
                <li className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> 
                  <span>Face detection - ensuring you're present and focused</span>
                </li>
                <li className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> 
                  <span>Tab switching - preventing unauthorized browsing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> 
                  <span>Background noise - detecting excessive disturbances</span>
                </li>
              </ul>
              <p className="text-xs text-purple-200 mt-4">
                Your privacy is important. Video feed is processed locally and not recorded or stored.
              </p>
            </div>
            <div className="ml-6 flex flex-col gap-3">
              <button
                onClick={startProctoring}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <Video className="w-5 h-5" />
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
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded text-sm hover:bg-purple-200 transition-all duration-200"
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
              disabled={isLocked}
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
              disabled={isLocked}
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
              disabled={isLocked}
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
                  isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => !isLocked && setCampusSearchOpen(!campusSearchOpen)}
              >
                <span className={campusName ? '' : 'text-gray-400 dark:text-slate-500'}>
                  {campusName || 'Select campus'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${campusSearchOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {campusSearchOpen && (
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {questions.length - Object.keys(answers).length === 0
                ? 'All questions answered! Ready to submit.'
                : `${questions.length - Object.keys(answers).length} question(s) remaining (unanswered = 0 points)`}
            </p>
            {timeRemaining > 0 && (
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                Time remaining: {formatTime(timeRemaining)}
              </p>
            )}
          </div>
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
