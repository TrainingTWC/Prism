import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserRole, canAccessStore, canAccessAM } from '../../roleMapping';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { QA_SECTIONS } from '../../config/qaQuestions';
import { useComprehensiveMapping, useAreaManagers, useStoreDetails } from '../../hooks/useComprehensiveMapping';

// Google Sheets endpoint for logging data - Updated to capture all 116 questions
const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbynHit5Eu2-5UOqtuScqVuxOA0QvAPpbwyZPPYsq4_v3MlskfNxoisJX2wW1MrC7HW23A/exec';

interface SurveyResponse {
  [key: string]: string;
}

interface SurveyMeta {
  qaName: string;
  qaId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
}

interface Store {
  name: string;
  id: string;
  region?: string;
}

interface DraftMetadata {
  id: string;
  timestamp: string;
  storeName: string;
  storeId: string;
  qaName: string;
  completionPercentage: number;
}

interface QAChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  editMode?: boolean;
  existingSubmission?: any;
}

const QAChecklist: React.FC<QAChecklistProps> = ({ userRole, onStatsUpdate, editMode = false, existingSubmission }) => {
  const { config, loading: configLoading } = useConfig();
  
  // Use comprehensive QA sections from qaQuestions.ts
  const sections = config?.CHECKLISTS?.QA || QA_SECTIONS;
  
  const [responses, setResponses] = useState<SurveyResponse>(() => {
    // If in edit mode, populate from existing submission
    if (editMode && existingSubmission) {
      return existingSubmission.responses || {};
    }
    try { 
      return JSON.parse(localStorage.getItem('qa_resp') || '{}'); 
    } catch (e) { 
      return {}; 
    }
  });

  const [questionImages, setQuestionImages] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('qa_images') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [questionRemarks, setQuestionRemarks] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('qa_remarks') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [signatures, setSignatures] = useState<{ auditor: string; sm: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem('qa_signatures') || '{"auditor":"","sm":""}');
    } catch (e) {
      return { auditor: '', sm: '' };
    }
  });

  const [meta, setMeta] = useState<SurveyMeta>(() => {
    // If in edit mode, populate from existing submission
    if (editMode && existingSubmission) {
      return {
        qaName: existingSubmission.qaName || '',
        qaId: existingSubmission.qaId || '',
        amName: existingSubmission.amName || '',
        amId: existingSubmission.amId || '',
        storeName: existingSubmission.storeName || '',
        storeId: existingSubmission.storeId || ''
      };
    }
    
    let stored = {};
    try { 
      stored = JSON.parse(localStorage.getItem('qa_meta') || '{}'); 
    } catch(e) {}
    
    const urlParams = new URLSearchParams(window.location.search);
    const qaId = urlParams.get('qaId') || urlParams.get('qa_id') || (stored as any).qaId || '';
    const qaName = urlParams.get('qaName') || urlParams.get('qa_name') || (stored as any).qaName || '';
    
    return {
      qaName: qaName,
      qaId: qaId,
      amName: (stored as any).amName || '',
      amId: (stored as any).amId || '',
      storeName: (stored as any).storeName || '',
      storeId: (stored as any).storeId || ''
    };
  });

  const { employeeData, userRole: authUserRole } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDraftList, setShowDraftList] = useState(false);
  const [drafts, setDrafts] = useState<DraftMetadata[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('qa_drafts') || '[]');
    } catch (e) {
      return [];
    }
  });
  
  // Load comprehensive mapping data
  const { mapping: comprehensiveMapping, loading: mappingLoading } = useComprehensiveMapping();
  const { areaManagers, loading: amLoading } = useAreaManagers();
  
  // Convert comprehensive mapping to store format
  const allStores = useMemo(() => {
    return comprehensiveMapping.map(store => ({
      name: store['Store Name'],
      id: store['Store ID'],
      region: store['Region'],
      amId: store['AM']
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [comprehensiveMapping]);
  
  const [amSearchTerm, setAmSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedAmIndex, setSelectedAmIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

  // Signature canvas refs
  const auditorCanvasRef = useRef<HTMLCanvasElement>(null);
  const smCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<{ auditor: boolean; sm: boolean }>({ auditor: false, sm: false });

  // Autofill QA fields when user role is qa
  useEffect(() => {
    if (authUserRole === 'qa' && employeeData && !meta.qaId) {
      setMeta(prev => ({
        ...prev,
        qaId: employeeData.code,
        qaName: employeeData.name
      }));
    }
  }, [authUserRole, employeeData]);

  // Auto-fill AM when store is selected from comprehensive mapping
  useEffect(() => {
    if (meta.storeId && comprehensiveMapping.length > 0) {
      const store = comprehensiveMapping.find(s => s['Store ID'] === meta.storeId);
      if (store && store.AM && !meta.amId) {
        const am = areaManagers.find(a => a.id === store.AM);
        if (am) {
          setMeta(prev => ({
            ...prev,
            amId: am.id,
            amName: am.name
          }));
          console.log(`✅ Auto-filled AM ${am.name} (${am.id}) for store ${store['Store Name']}`);
        }
      }
    }
  }, [meta.storeId, comprehensiveMapping, areaManagers]);

  // Save responses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('qa_resp', JSON.stringify(responses));
  }, [responses]);

  // Save meta to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('qa_meta', JSON.stringify(meta));
  }, [meta]);

  // Save images to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('qa_images', JSON.stringify(questionImages));
    } catch (e) {
      // Handle quota exceeded error
      if (e instanceof DOMException && (e.code === 22 || e.name === 'QuotaExceededError')) {
        console.error('LocalStorage quota exceeded. Too many images stored.');
        alert('Storage limit reached. Please remove some images before adding more.');
      } else {
        console.error('Failed to save images:', e);
      }
    }
  }, [questionImages]);

  // Save per-question remarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qa_remarks', JSON.stringify(questionRemarks));
    } catch (e) {
      console.error('Failed to save remarks:', e);
    }
  }, [questionRemarks]);

  // Save signatures to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('qa_signatures', JSON.stringify(signatures));
  }, [signatures]);

  // Update stats whenever responses change
  useEffect(() => {
    const totalQuestions = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key => 
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;
    
    // Calculate score properly (same logic as submission)
    let totalScore = 0;
    let maxScore = 0;
    
    sections.forEach(section => {
      section.items.forEach(item => {
        const response = responses[`${section.id}_${item.id}`];
        
        // Skip NA responses - don't add to max score
        if (response === 'na') {
          return;
        }
        
        // Add to max score (only if not NA)
        maxScore += item.w;
        
        // Calculate score based on response type
        if (section.id === 'ZeroTolerance') {
          // Zero Tolerance: compliant = full points, non-compliant = 0
          if (response === 'compliant') {
            totalScore += item.w;
          }
        } else {
          // Other sections: compliant = full, partially-compliant = half, not-compliant = 0
          if (response === 'compliant') {
            totalScore += item.w;
          } else if (response === 'partially-compliant') {
            totalScore += item.w / 2;
          }
        }
      });
    });
    
    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 100) / 100 : 0;
    
    onStatsUpdate({
      completed: answeredQuestions,
      total: totalQuestions,
      score: scorePercentage
    });
  }, [responses, onStatsUpdate, sections]);

  const filteredAreaManagers = useMemo(() => {
    if (!amSearchTerm) return areaManagers;
    return areaManagers.filter(am => 
      am.name.toLowerCase().includes(amSearchTerm.toLowerCase()) ||
      am.id.toLowerCase().includes(amSearchTerm.toLowerCase())
    );
  }, [amSearchTerm, areaManagers]);

  const filteredStores = useMemo(() => {
    if (!storeSearchTerm) return allStores;
    return allStores.filter(store => 
      store.name.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      store.id.toLowerCase().includes(storeSearchTerm.toLowerCase())
    );
  }, [storeSearchTerm, allStores]);

  const handleMetaChange = (field: keyof SurveyMeta, value: string) => {
    setMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleResponse = (questionId: string, answer: string) => {
    setResponses(prev => ({ ...prev, [questionId]: answer }));
    hapticFeedback.select();
  };

  const handleTextResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  // Draft management functions
  const saveDraft = () => {
    const draftId = currentDraftId || `draft_${Date.now()}`;
    const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
    
    // Calculate completion percentage
    const totalQuestions = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key => 
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;
    const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);
    
    // Save draft data
    const draftData = {
      responses,
      meta,
      questionImages,
      questionRemarks,
      signatures
    };
    localStorage.setItem(`qa_draft_${draftId}`, JSON.stringify(draftData));
    
    // Update or add draft metadata
    const existingDraftIndex = drafts.findIndex(d => d.id === draftId);
    const draftMetadata: DraftMetadata = {
      id: draftId,
      timestamp,
      storeName: meta.storeName || 'Unsaved',
      storeId: meta.storeId || '',
      qaName: meta.qaName || 'Unknown',
      completionPercentage
    };
    
    let updatedDrafts;
    if (existingDraftIndex >= 0) {
      updatedDrafts = [...drafts];
      updatedDrafts[existingDraftIndex] = draftMetadata;
    } else {
      updatedDrafts = [...drafts, draftMetadata];
    }
    
    setDrafts(updatedDrafts);
    localStorage.setItem('qa_drafts', JSON.stringify(updatedDrafts));
    setCurrentDraftId(draftId);
    
    hapticFeedback.success();
    alert('Draft saved successfully! You can resume it later.');
  };
  
  const loadDraft = (draftId: string) => {
    try {
      const draftData = JSON.parse(localStorage.getItem(`qa_draft_${draftId}`) || '{}');
      setResponses(draftData.responses || {});
      setMeta(draftData.meta || {});
      setQuestionImages(draftData.questionImages || {});
      setQuestionRemarks(draftData.questionRemarks || {});
      setSignatures(draftData.signatures || { auditor: '', sm: '' });
      setCurrentDraftId(draftId);
      setShowDraftList(false);
      hapticFeedback.success();
    } catch (e) {
      alert('Failed to load draft');
    }
  };
  
  const deleteDraft = (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    
    // Remove draft data
    localStorage.removeItem(`qa_draft_${draftId}`);
    
    // Remove from draft list
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem('qa_drafts', JSON.stringify(updatedDrafts));
    
    // If we're currently viewing this draft, clear it
    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
    }
    
    hapticFeedback.success();
  };
  
  const startNewChecklist = () => {
    if (!confirm('Start a new checklist? Current progress will be cleared unless you save it as a draft first.')) return;
    
    // Clear current checklist data from localStorage
    localStorage.removeItem('qa_resp');
    localStorage.removeItem('qa_meta');
    localStorage.removeItem('qa_images');
    localStorage.removeItem('qa_remarks');
    localStorage.removeItem('qa_signatures');
    
    // Reset all state
    setResponses({});
    setMeta({
      qaName: '',
      qaId: '',
      amName: '',
      amId: '',
      storeName: '',
      storeId: ''
    });
    setQuestionImages({});
    setQuestionRemarks({});
    setSignatures({ auditor: '', sm: '' });
    setCurrentDraftId(null);
    setSubmitted(false);
    
    hapticFeedback.success();
  };

  const handleSubmit = async () => {
    const totalQuestions = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key => 
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;
    
    if (answeredQuestions < totalQuestions) {
      alert(`Please answer all questions. You have answered ${answeredQuestions} out of ${totalQuestions} questions.`);
      return;
    }

    const requiredFields = ['qaName', 'qaId', 'amName', 'amId', 'storeName', 'storeId'];
    const missingFields = requiredFields.filter(field => !meta[field as keyof SurveyMeta]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      // Calculate scores properly based on response types
      // Zero Tolerance: compliant/non-compliant (binary scoring)
      // Other sections: compliant (full points), partially-compliant (half points), not-compliant (0), na (excluded)
      let totalScore = 0;
      let maxScore = 0;
      
      sections.forEach(section => {
        section.items.forEach(item => {
          const response = responses[`${section.id}_${item.id}`];
          
          // Skip NA responses - don't add to max score
          if (response === 'na') {
            return;
          }
          
          // Add to max score (only if not NA)
          maxScore += item.w;
          
          // Calculate score based on response type
          if (section.id === 'ZeroTolerance') {
            // Zero Tolerance: compliant = full points, non-compliant = 0
            if (response === 'compliant') {
              totalScore += item.w;
            }
          } else {
            // Other sections: compliant = full, partially-compliant = half, not-compliant = 0
            if (response === 'compliant') {
              totalScore += item.w;
            } else if (response === 'partially-compliant') {
              totalScore += item.w / 2;
            }
          }
        });
      });
      
      const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 100) / 100 : 0;
      
      console.log(`📊 Score Calculation: ${totalScore}/${maxScore} = ${scorePercentage}%`);

      // Detect region and correct store ID from comprehensive mapping
      let detectedRegion = '';
      let correctedStoreId = meta.storeId;
      try {
        if (meta.storeId && comprehensiveMapping.length > 0) {
          let storeMapping = comprehensiveMapping.find(item => item['Store ID'] === meta.storeId);
          
          // Try with S prefix if not found
          if (!storeMapping && !isNaN(Number(meta.storeId)) && !meta.storeId.startsWith('S')) {
            const sFormattedId = `S${meta.storeId.padStart(3, '0')}`;
            storeMapping = comprehensiveMapping.find(item => item['Store ID'] === sFormattedId);
          }
          
          // Try by store name if still not found
          if (!storeMapping && meta.storeName) {
            storeMapping = comprehensiveMapping.find(item => 
              item['Store Name'].toLowerCase().includes(meta.storeName.toLowerCase()) ||
              meta.storeName.toLowerCase().includes(item['Store Name'].toLowerCase())
            );
          }
          
          if (storeMapping) {
            detectedRegion = storeMapping.Region || '';
            correctedStoreId = storeMapping['Store ID'];
            console.log(`✅ Store ${meta.storeName} mapped to region: ${detectedRegion}`);
          }
        }
      } catch (error) {
        console.warn('Could not load mapping data for region detection:', error);
      }

      // Prepare data for Google Sheets
      const params: Record<string, string> = {
        submissionTime: editMode && existingSubmission?.submissionTime 
          ? existingSubmission.submissionTime 
          : new Date().toLocaleString('en-GB', {hour12: false}),
        qaName: meta.qaName || '',
        qaId: meta.qaId || '',
        amName: meta.amName || '',
        amId: meta.amId || '',
        storeName: meta.storeName || '',
        storeID: String(correctedStoreId || ''),
        region: String(detectedRegion || 'Unknown'),
        totalScore: String(totalScore),
        maxScore: String(maxScore),
        scorePercentage: String(scorePercentage),
        auditorSignature: signatures.auditor || '',
        smSignature: signatures.sm || '',
        // Add action parameter for update mode
        action: editMode ? 'update' : 'create',
        // Add row identifier for updates (using submissionTime as unique ID)
        rowId: editMode && existingSubmission?.submissionTime ? existingSubmission.submissionTime : '',
        // responses may contain non-string values; ensure we stringify them
        ...Object.fromEntries(Object.entries(responses).map(([k, v]) => [k, String(v)])),
        // Add question remarks with _remark suffix
        ...Object.fromEntries(Object.entries(questionRemarks).map(([k, v]) => [`${k}_remark`, String(v)])),
        // Add image counts with _imageCount suffix
        ...Object.fromEntries(Object.entries(questionImages).map(([k, v]) => [`${k}_imageCount`, String(v.length)])),
        // Add all images as JSON (for PDF generation from dashboard)
        questionImagesJSON: JSON.stringify(questionImages)
      };

      console.log('QA Survey data being sent:', params);

      const bodyString = new URLSearchParams(params).toString();
      const response = await fetch(LOG_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyString
      });

      console.log('QA Survey submitted successfully');
      
      // Delete draft if submission was successful
      if (currentDraftId) {
        localStorage.removeItem(`qa_draft_${currentDraftId}`);
        const updatedDrafts = drafts.filter(d => d.id !== currentDraftId);
        setDrafts(updatedDrafts);
        localStorage.setItem('qa_drafts', JSON.stringify(updatedDrafts));
        setCurrentDraftId(null);
      }
      
      // Clear current checklist data from localStorage
      localStorage.removeItem('qa_resp');
      localStorage.removeItem('qa_meta');
      localStorage.removeItem('qa_images');
      localStorage.removeItem('qa_remarks');
      localStorage.removeItem('qa_signatures');
      
      setSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting QA survey:', error);
      alert('Error submitting survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (questionId: string, files: FileList) => {
    // Process multiple files
    Array.from(files).forEach(file => {
      // Compress and resize image to reduce storage size
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Calculate new dimensions (max 1200px width/height)
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress image (0.7 quality for JPEG)
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

          // Update state with compressed image
          setQuestionImages(prev => {
            try {
              const newImages = {
                ...prev,
                [questionId]: [...(prev[questionId] || []), compressedBase64]
              };
              // Test if it fits in localStorage
              const testString = JSON.stringify(newImages);
              if (testString.length > 5000000) { // ~5MB limit
                alert('Storage limit reached. Please remove some images before adding more.');
                return prev;
              }
              return newImages;
            } catch (error) {
              alert('Failed to add image. Storage limit may be reached.');
              return prev;
            }
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (questionId: string, imageIndex: number) => {
    setQuestionImages(prev => {
      const updated = { ...prev };
      const images = updated[questionId] || [];
      updated[questionId] = images.filter((_, idx) => idx !== imageIndex);
      if (updated[questionId].length === 0) {
        delete updated[questionId];
      }
      return updated;
    });
  };

  // State to store last coordinates for smooth curve drawing
  const [lastPoint, setLastPoint] = useState<{ auditor: { x: number; y: number } | null; sm: { x: number; y: number } | null }>({
    auditor: null,
    sm: null
  });

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'auditor' | 'sm') => {
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(prev => ({ ...prev, [type]: true }));

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = ('touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left) * scaleX;
    const y = ('touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top) * scaleY;

    setLastPoint(prev => ({ ...prev, [type]: { x, y } }));
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'auditor' | 'sm') => {
    if (!isDrawing[type]) return;

    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const currentX = ('touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left) * scaleX;
    const currentY = ('touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top) * scaleY;

    const last = lastPoint[type];
    if (!last) {
      setLastPoint(prev => ({ ...prev, [type]: { x: currentX, y: currentY } }));
      return;
    }

    // Use quadratic curve for smoother drawing
    const midX = (last.x + currentX) / 2;
    const midY = (last.y + currentY) / 2;

    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(midX, midY);
    
    setLastPoint(prev => ({ ...prev, [type]: { x: currentX, y: currentY } }));
  };

  const stopDrawing = (type: 'auditor' | 'sm') => {
    setIsDrawing(prev => ({ ...prev, [type]: false }));
    setLastPoint(prev => ({ ...prev, [type]: null }));
    
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }

    // Save signature as base64
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setSignatures(prev => ({
      ...prev,
      [type]: dataUrl
    }));
  };

  const clearSignature = (type: 'auditor' | 'sm') => {
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setLastPoint(prev => ({ ...prev, [type]: null }));
    setSignatures(prev => ({
      ...prev,
      [type]: ''
    }));
  };

  // Initialize canvas when signatures are loaded from localStorage
  useEffect(() => {
    if (signatures.auditor && auditorCanvasRef.current) {
      const ctx = auditorCanvasRef.current.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = signatures.auditor;
      }
    }
    if (signatures.sm && smCanvasRef.current) {
      const ctx = smCanvasRef.current.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = signatures.sm;
      }
    }
  }, []);

  const resetSurvey = () => {
    if (confirm('Are you sure you want to reset the survey? All responses will be lost.')) {
      setResponses({});
      setMeta({
        qaName: '',
        qaId: '',
        amName: '',
        amId: '',
        storeName: '',
        storeId: ''
      });
      setQuestionImages({});
      setSignatures({ auditor: '', sm: '' });
      setSubmitted(false);
      localStorage.removeItem('qa_resp');
      localStorage.removeItem('qa_meta');
      localStorage.removeItem('qa_images');
      localStorage.removeItem('qa_signatures');
    }
  };

  const autofillForTesting = () => {
    if (confirm('This will fill the ENTIRE form with test data. Continue?')) {
      // Fill metadata
      setMeta({
        qaName: 'Test QA Auditor',
        qaId: 'QA001',
        amName: 'Rajesh Kumar',
        amId: 'AM005',
        storeName: 'Defence Colony',
        storeId: 'S027'
      });

      // Generate realistic test responses for ALL sections
      const testResponses: SurveyResponse = {};
      
      sections.forEach(section => {
        section.items.forEach((item, index) => {
          // Create realistic distribution based on section type
          const rand = Math.random();
          let answer;
          
          if (section.id === 'ZeroTolerance') {
            // Zero Tolerance: mostly compliant, occasionally non-compliant
            answer = rand < 0.90 ? 'compliant' : 'non-compliant';
          } else {
            // Other sections: compliant/partially-compliant/not-compliant/na
            if (rand < 0.70) answer = 'compliant';  // 70% compliant
            else if (rand < 0.85) answer = 'partially-compliant';  // 15% partially
            else if (rand < 0.95) answer = 'not-compliant';  // 10% not compliant
            else answer = 'na';  // 5% na
          }
          
          testResponses[`${section.id}_${item.id}`] = answer;
        });
        
        // Add comprehensive remarks for each section
        if (section.id === 'ZeroTolerance') {
          testResponses[`${section.id}_remarks`] = 'All critical food safety standards met. Date tags properly labeled. TDS within acceptable range. No pest activity observed.';
        } else if (section.id === 'Store') {
          testResponses[`${section.id}_remarks`] = 'Store operations running smoothly. Excellent cleanliness standards maintained. Equipment properly maintained. Minor improvements needed in food contact material storage.';
        } else if (section.id === 'Maintenance') {
          testResponses[`${section.id}_remarks`] = 'Equipment in good condition. Pest control devices checked and functioning properly. Fire safety equipment current and accessible.';
        } else if (section.id === 'A') {
          testResponses[`${section.id}_remarks`] = 'Product quality standards maintained. Minor adjustments needed in presentation consistency.';
        } else if (section.id === 'HR') {
          testResponses[`${section.id}_remarks`] = 'Staff hygiene protocols followed correctly. All medical records up to date. Grooming standards excellent.';
        }
      });

      setResponses(testResponses);
      
      // Show success message
      alert('Entire form autofilled with test data! All 116 questions completed. You can now review and submit.');
    }
  };

  if (submitted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
            <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
              QA Assessment Submitted Successfully!
            </h2>
            <p className="text-green-700 dark:text-green-400 mb-6">
              Thank you for completing the Quality Assurance assessment. Your responses have been recorded.
            </p>
            <button
              onClick={resetSurvey}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Take Another Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {isLoading && <LoadingOverlay />}
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 sm:p-6 border border-orange-200 dark:border-orange-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              🔍 Quality Assurance Assessment
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
              Comprehensive quality and safety assessment covering zero tolerance, maintenance, operations, and hygiene standards.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowDraftList(!showDraftList)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Drafts {drafts.length > 0 && `(${drafts.length})`}
            </button>
            
            <button
              onClick={saveDraft}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Draft
            </button>
            
            <button
              onClick={startNewChecklist}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          </div>
        </div>
        
        {/* Current Draft Indicator */}
        {currentDraftId && (
          <div className="mt-3 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md text-sm text-blue-800 dark:text-blue-200">
            📝 Currently editing draft from {drafts.find(d => d.id === currentDraftId)?.timestamp || 'Unknown'}
          </div>
        )}
      </div>

      {/* Draft List Modal */}
      {showDraftList && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100">
              📋 Saved Drafts
            </h2>
            <button
              onClick={() => setShowDraftList(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {drafts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-slate-400">No saved drafts</p>
              <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
                Click "Save Draft" to save your progress
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map(draft => (
                <div
                  key={draft.id}
                  className={`p-4 border rounded-lg ${
                    currentDraftId === draft.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                          {draft.storeName} {draft.storeId && `(${draft.storeId})`}
                        </h3>
                        {currentDraftId === draft.id && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        Auditor: {draft.qaName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                        {draft.timestamp}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${draft.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                          {draft.completionPercentage}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadDraft(draft.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Information */}
      <div id="audit-information" className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Assessment Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              QA Auditor Name
            </label>
            <input
              type="text"
              value={meta.qaName}
              onChange={(e) => handleMetaChange('qaName', e.target.value)}
              placeholder="Enter QA Auditor name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              QA Auditor ID
            </label>
            <input
              type="text"
              value={meta.qaId}
              onChange={(e) => handleMetaChange('qaId', e.target.value)}
              placeholder="Enter QA Auditor ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Area Manager
            </label>
            <input
              type="text"
              value={amSearchTerm || (meta.amId ? meta.amName.split(' ')[0] : '')}
              onChange={(e) => {
                setAmSearchTerm(e.target.value);
                setShowAmDropdown(true);
                setSelectedAmIndex(-1);
              }}
              onFocus={() => setShowAmDropdown(true)}
              onBlur={() => setTimeout(() => setShowAmDropdown(false), 200)}
              placeholder="Search Area Manager..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
            
            {showAmDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredAreaManagers.length > 0 ? (
                  filteredAreaManagers.map((am, index) => (
                    <button
                      key={am.id}
                      onClick={() => {
                        handleMetaChange('amId', am.id as string);
                        handleMetaChange('amName', am.name as string);
                        setAmSearchTerm('');
                        setShowAmDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        index === selectedAmIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                      }`}
                    >
                      {am.name.split(' ')[0]}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-slate-400">No area managers found</div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Store
            </label>
            <input
              type="text"
              value={storeSearchTerm || (meta.storeId ? `${meta.storeName} (${meta.storeId})` : '')}
              onChange={(e) => {
                setStoreSearchTerm(e.target.value);
                setShowStoreDropdown(true);
                setSelectedStoreIndex(-1);
              }}
              onFocus={() => setShowStoreDropdown(true)}
              onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
              placeholder="Search Store..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
            
            {showStoreDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredStores.length > 0 ? (
                  filteredStores.map((store, index) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        handleMetaChange('storeId', store.id);
                        handleMetaChange('storeName', store.name);
                        setStoreSearchTerm('');
                        setShowStoreDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        index === selectedStoreIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                      }`}
                    >
                      {store.name} ({store.id})
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-slate-400">No stores found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QA Sections */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">
          Quality Assessment
        </h2>
        
        <div className="space-y-6 sm:space-y-8">
          {sections.map((section, sectionIndex) => {
            // Generate section prefix for serial numbers (ZT, S, M, etc.)
            const sectionPrefix = section.id === 'ZeroTolerance' ? 'ZT' : 
                                 section.id === 'Store' ? 'S' : 
                                 section.id === 'Maintenance' ? 'M' : 
                                 section.id === 'A' ? 'A' : 
                                 section.id === 'HR' ? 'HR' : 
                                 section.id.substring(0, 2).toUpperCase();
            
            // Ensure options exist, fallback to default
            const sectionOptions = section.options || (section.id === 'ZeroTolerance' ? ['compliant', 'non-compliant'] : ['compliant', 'partially-compliant', 'not-compliant', 'na']);
            
            return (
            <div key={section.id} className="border-l-4 border-orange-500 pl-3 sm:pl-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 sm:mb-4 text-orange-700 dark:text-orange-300">
                {section.title}
              </h3>
              
              <div className="space-y-4">
                {section.items?.map((item, itemIndex) => {
                  const serialNumber = `${sectionPrefix}-${itemIndex + 1}`;
                  return (
                  <div key={item.id} className="p-3 sm:p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start gap-2 sm:gap-3 mb-3">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-md text-xs font-bold flex-shrink-0">
                        {serialNumber}
                      </span>
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-slate-100 leading-relaxed flex-1">
                        {item.q}
                      </p>
                    </div>
                    
                    {/* Response Options - Stacked on mobile, wrapped on desktop */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-3 pl-0 sm:pl-9">
                      {sectionOptions.map(option => (
                        <label key={option} className="flex items-center gap-2 sm:gap-2 cursor-pointer p-2 sm:p-0 rounded hover:bg-gray-100 dark:hover:bg-slate-700 sm:hover:bg-transparent transition-colors min-h-[44px] sm:min-h-0">
                          <input
                            type="radio"
                            name={`${section.id}_${item.id}`}
                            value={option}
                            checked={responses[`${section.id}_${item.id}`] === option}
                            onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                            className="w-5 h-5 sm:w-4 sm:h-4 text-orange-600 border-gray-300 dark:border-slate-600 focus:ring-orange-500 flex-shrink-0"
                          />
                          <span className="text-sm sm:text-sm text-gray-700 dark:text-slate-300 font-medium">
                            {option === 'compliant' ? 'Compliant' : 
                             option === 'partially-compliant' ? 'Partially Compliant' :
                             option === 'not-compliant' ? 'Not Compliant' :
                             option === 'non-compliant' ? 'Non-Compliant' :
                             'N/A'}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Image Upload Section - Multiple Images Support */}
                    <div className="pl-0 sm:pl-9">
                      <div className="space-y-3">
                        {/* Upload Buttons - Always Visible with MULTIPLE selection */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg cursor-pointer text-sm font-medium transition-colors min-h-[48px] sm:min-h-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            📷 Camera
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) handleImageUpload(`${section.id}_${item.id}`, files);
                                e.target.value = ''; // Reset input to allow same file again
                              }}
                              className="hidden"
                            />
                          </label>
                          
                          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg cursor-pointer text-sm font-medium transition-colors min-h-[48px] sm:min-h-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            🖼️ Gallery (Multiple)
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) handleImageUpload(`${section.id}_${item.id}`, files);
                                e.target.value = ''; // Reset input to allow same file again
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Display Uploaded Images */}
                        {questionImages[`${section.id}_${item.id}`] && questionImages[`${section.id}_${item.id}`].length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {questionImages[`${section.id}_${item.id}`].map((image, idx) => (
                              <div key={idx} className="relative">
                                <img 
                                  src={image} 
                                  alt={`Upload ${idx + 1}`} 
                                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-slate-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(`${section.id}_${item.id}`, idx)}
                                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full transition-colors shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                                  title="Remove image"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                                  {idx + 1} of {questionImages[`${section.id}_${item.id}`].length}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Per-Question Remarks - Inline after each point */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                          💬 Comments / NC Description for {serialNumber}
                        </label>
                        <textarea
                          value={questionRemarks[`${section.id}_${item.id}`] || ''}
                          onChange={(e) => setQuestionRemarks(prev => ({ ...prev, [`${section.id}_${item.id}`]: e.target.value }))}
                          placeholder="Add comments or describe non-compliance for this point..."
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Signatures Section - Mobile Optimized */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">
          Signatures
        </h2>
        
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
          {/* Auditor Signature */}
          <div className="space-y-3">
            <label className="block text-base sm:text-sm font-medium text-gray-700 dark:text-slate-300">
              Auditor Signature *
            </label>
            <div className="border-3 border-gray-400 dark:border-slate-500 rounded-xl bg-white p-1 shadow-inner">
              <canvas
                ref={auditorCanvasRef}
                width={800}
                height={300}
                onMouseDown={(e) => startDrawing(e, 'auditor')}
                onMouseMove={(e) => draw(e, 'auditor')}
                onMouseUp={() => stopDrawing('auditor')}
                onMouseLeave={() => stopDrawing('auditor')}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startDrawing(e, 'auditor');
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  draw(e, 'auditor');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing('auditor');
                }}
                className="w-full h-auto touch-none rounded-lg"
                style={{ 
                  touchAction: 'none',
                  cursor: 'crosshair',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => clearSignature('auditor')}
              className="w-full px-4 py-3 sm:py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Signature
            </button>
            <p className="text-sm text-gray-600 dark:text-slate-400 text-center font-medium">
              {typeof window !== 'undefined' && 'ontouchstart' in window 
                ? '✍️ Draw with your finger' 
                : '🖱️ Draw with your mouse'}
            </p>
          </div>

          {/* Store Manager Signature */}
          <div className="space-y-3">
            <label className="block text-base sm:text-sm font-medium text-gray-700 dark:text-slate-300">
              Store Manager (SM) Signature *
            </label>
            <div className="border-3 border-gray-400 dark:border-slate-500 rounded-xl bg-white p-1 shadow-inner">
              <canvas
                ref={smCanvasRef}
                width={800}
                height={300}
                onMouseDown={(e) => startDrawing(e, 'sm')}
                onMouseMove={(e) => draw(e, 'sm')}
                onMouseUp={() => stopDrawing('sm')}
                onMouseLeave={() => stopDrawing('sm')}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startDrawing(e, 'sm');
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  draw(e, 'sm');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing('sm');
                }}
                className="w-full h-auto touch-none rounded-lg"
                style={{ 
                  touchAction: 'none',
                  cursor: 'crosshair',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => clearSignature('sm')}
              className="w-full px-4 py-3 sm:py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Signature
            </button>
            <p className="text-sm text-gray-600 dark:text-slate-400 text-center font-medium">
              {typeof window !== 'undefined' && 'ontouchstart' in window 
                ? '✍️ Draw with your finger' 
                : '🖱️ Draw with your mouse'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row gap-3 order-2 sm:order-1">
          <button
            onClick={resetSurvey}
            className="px-4 sm:px-6 py-3 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white rounded-lg font-medium transition-colors min-h-[48px]"
          >
            Reset Assessment
          </button>
          <button
            onClick={autofillForTesting}
            className="px-4 sm:px-6 py-3 btn-primary-gradient text-white rounded-lg font-medium transition-transform duration-150 active:scale-95 min-h-[48px]"
          >
            🧪 Autofill Test Data
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-4 sm:px-6 py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-400 text-white rounded-lg font-medium transition-colors order-1 sm:order-2 min-h-[52px] text-base sm:text-base"
        >
          {isLoading ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? '� Update Assessment' : '�📤 Submit Assessment')}
        </button>
      </div>
    </div>
  );
};

export default QAChecklist;