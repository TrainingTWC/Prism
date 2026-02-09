import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, canAccessStore, canAccessAM } from '../../roleMapping';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import { useComprehensiveMapping, useAreaManagers } from '../../hooks/useComprehensiveMapping';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Google Sheets endpoint for Finance Audit (QA Pattern)
const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzfP0OjIe2-XQut_0DgOFpkAvqkMi0RU6U3HLtDGBpNXeVTnLjHUtzNhlZtonXhy1H0/exec';

interface SurveyResponse {
  [key: string]: string;
}
interface SurveyMeta {
  financeAuditorName: string;
  financeAuditorId: string;
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

interface FinanceChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
}

const FINANCE_SECTIONS = [
  {
    id: 'CashManagement',
    title: 'Section 1: Cash Handling & Settlement',
    items: [
      { id: 'Q1', q: 'Were no discrepancies found during the cash drawer verification?', w: 4 },
      { id: 'Q2', q: 'Were no discrepancies found during the petty cash verification?', w: 3 },
      { id: 'Q3', q: 'Sale cash is not being used for petty cash or other purposes', w: 2 },
      { id: 'Q4', q: 'Has banking of cash been done accurately for the last 3 days?', w: 2 },
      { id: 'Q5', q: 'Was the previous day’s batch correctly settled in the EDC machine?', w: 2 },
      { id: 'Q6', q: 'Has the petty cash claim process been properly followed with supporting documents?', w: 3 }
    ]
  },
  {
    id: 'Section2',
    title: 'Section 2: Billing & Transactions',
    items: [
      { id: 'Q7', q: 'Is billing completed for all products served to customers?', w: 4 },
      { id: 'Q8', q: 'Are there no open transactions pending in the POS system?', w: 2 },
      { id: 'Q9', q: 'Are discount codes and vouchers applied correctly and as per policy?', w: 2 },
      { id: 'Q10', q: 'Is the employee meal process followed as per policy?', w: 2 },
      { id: 'Q11', q: 'Is there no price discrepancy between Menu, POS, Home Delivery (HD), and Pickup?', w: 1 },
      { id: 'Q12', q: 'Is the customer refund process followed properly with approval and documentation?', w: 1 }
    ]
  },
  {
    id: 'Section3',
    title: 'Section 3: Product & Inventory Compliance',
    items: [
      { id: 'Q13', q: 'Were no expired items found during the audit?', w: 4 },
      { id: 'Q14', q: 'Is FIFO / FEFO strictly followed for all food and beverage items?', w: 3 },
      { id: 'Q15', q: 'Are all local purchase items correctly updated in the system?', w: 2 },
      { id: 'Q16', q: 'Is the inventory posted in the system with complete and accurate details?', w: 2 },
      { id: 'Q17', q: 'Is the MRD for all products properly updated?', w: 2 },
      { id: 'Q18', q: 'Are all products available and actively used as per the menu?', w: 2 },
      { id: 'Q19', q: 'Are products properly displayed or stored according to storage SOPs?', w: 1 }
    ]
  },
  {
    id: 'Section4',
    title: 'Section 4: Documentation & Tracking',
    items: [
      { id: 'Q20', q: 'Are all manual transactions properly approved and recorded?', w: 2 },
      { id: 'Q21', q: 'Is the cash log book updated daily and verified by the store manager?', w: 2 },
      { id: 'Q22', q: 'Are bank/cash deposit slips maintained and filed systematically?', w: 2 },
      { id: 'Q23', q: 'Are stock delivery challans filed and updated properly?', w: 2 }
    ]
  },
  {
    id: 'Section5',
    title: 'Section 5: POS System & SOP',
    items: [
      { id: 'Q24', q: 'Is wastage correctly recorded and disposed as per SOP?', w: 2 },
      { id: 'Q25', q: 'Are TI / TO / GRN entries done accurately and posted in the system?', w: 2 },
      { id: 'Q26', q: 'Is the POS and store system used only for designated operational tasks?', w: 2 },
      { id: 'Q27', q: 'Is the store team aware of SOPs and compliance requirements?', w: 2 }
    ]
  },
  {
    id: 'Section6',
    title: 'Section 6: Licenses & Certificates',
    items: [
      { id: 'Q28', q: 'Are trade licenses available and displayed with proper validity?', w: 1 },
      { id: 'Q29', q: 'Are Shop & Establishment licenses available and displayed with proper validity?', w: 1 },
      { id: 'Q30', q: 'Is the FSSAI license available and displayed with proper validity?', w: 1 },
      { id: 'Q31', q: 'Music licenses available and displayed with proper validity?', w: 1 },
      { id: 'Q32', q: 'Is the GST certificate available and displayed with proper validity?', w: 1 }
    ]
  },
  {
    id: 'Section7',
    title: 'Section 7: CCTV Monitoring',
    items: [
      { id: 'Q33', q: 'Is the CCTV system functioning properly?', w: 2 },
      { id: 'Q34', q: 'Is there a backup of 30 / 60 days of footage with proper coverage of critical areas?', w: 2 },
      { id: 'Q35', q: 'Are no SOP, compliance, or integrity violations observed in CCTV sample review?', w: 3 }
    ]
  }
];

const FinanceChecklist: React.FC<FinanceChecklistProps> = ({ userRole, onStatsUpdate }) => {
  const { config, loading: configLoading } = useConfig();

  // IMPORTANT: Use hardcoded FINANCE_SECTIONS to ensure correct question IDs
  // DO NOT use config as it has different ID format (FIN_CM_1 vs CM_1)
  const sections = FINANCE_SECTIONS;

  const [responses, setResponses] = useState<SurveyResponse>(() => {
    try {
      return JSON.parse(localStorage.getItem('finance_resp') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [questionImages, setQuestionImages] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('finance_images') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [questionRemarks, setQuestionRemarks] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('finance_remarks') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [meta, setMeta] = useState<SurveyMeta>(() => {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem('finance_meta') || '{}');
    } catch (e) { }

    const urlParams = new URLSearchParams(window.location.search);
    const financeAuditorId = urlParams.get('financeAuditorId') || urlParams.get('finance_auditor_id') || (stored as any).financeAuditorId || '';
    const financeAuditorName = urlParams.get('financeAuditorName') || urlParams.get('finance_auditor_name') || (stored as any).financeAuditorName || '';

    return {
      financeAuditorName: financeAuditorName,
      financeAuditorId: financeAuditorId,
      amName: (stored as any).amName || '',
      amId: (stored as any).amId || '',
      storeName: (stored as any).storeName || '',
      storeId: (stored as any).storeId || ''
    };
  });

  const { employeeData, userRole: authUserRole } = useAuth();

  // Load comprehensive mapping data
  const { mapping: comprehensiveMapping, loading: mappingLoading } = useComprehensiveMapping();
  const areaManagers = useAreaManagers();

  // Convert comprehensive mapping to store format
  const allStores = useMemo(() => {
    return comprehensiveMapping.map(store => ({
      name: store['Store Name'],
      id: store['Store ID'],
      region: store['Region'],
      amId: store['AM']
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [comprehensiveMapping]);

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [amSearchTerm, setAmSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedAmIndex, setSelectedAmIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

  // Signature state
  const [signatures, setSignatures] = useState<{ auditor: string; sm: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem('finance_signatures') || '{"auditor":"","sm":""}');
    } catch (e) {
      return { auditor: '', sm: '' };
    }
  });

  // Signature canvas refs
  const auditorCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const smCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState({ auditor: false, sm: false });

  // Autofill Finance fields when user role is finance
  useEffect(() => {
    if (authUserRole === 'finance' && employeeData && !meta.financeAuditorId) {
      setMeta(prev => ({
        ...prev,
        financeAuditorId: employeeData.code,
        financeAuditorName: employeeData.name
      }));
    }
  }, [authUserRole, employeeData]);

  // Auto-fill AM when store is selected from comprehensive mapping
  useEffect(() => {
    if (meta.storeId && comprehensiveMapping.length > 0) {
      const store = comprehensiveMapping.find(s => s['Store ID'] === meta.storeId);

      if (store && store.AM) {
        const am = areaManagers.areaManagers.find(am => am.id === store.AM);

        if (am && (!meta.amId || meta.amId !== am.id)) {
          setMeta(prev => ({
            ...prev,
            amId: am.id,
            amName: am.name
          }));

        } else if (!am) {
          console.warn('❌ AM not found in areaManagers list for ID:', store.AM);
        }
      } else {
        console.warn('❌ Store not found in comprehensive mapping or has no AM:', meta.storeId);
      }
    }
  }, [meta.storeId, comprehensiveMapping, areaManagers, meta.amId]);

  // Save responses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('finance_resp', JSON.stringify(responses));
  }, [responses]);

  // Save questionImages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('finance_images', JSON.stringify(questionImages));
  }, [questionImages]);

  // Save questionRemarks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('finance_remarks', JSON.stringify(questionRemarks));
  }, [questionRemarks]);

  // Save meta to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('finance_meta', JSON.stringify(meta));
  }, [meta]);

  // Save signatures to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('finance_signatures', JSON.stringify(signatures));
  }, [signatures]);

  // Initialize canvas when signatures are loaded from localStorage
  useEffect(() => {
    if (signatures.auditor && auditorCanvasRef.current) {
      const canvas = auditorCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = signatures.auditor;
      }
    }
    if (signatures.sm && smCanvasRef.current) {
      const canvas = smCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = signatures.sm;
      }
    }
  }, [signatures.auditor, signatures.sm]);

  // Update stats whenever responses change
  useEffect(() => {
    const totalQuestions = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key =>
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;

    sections.forEach(section => {
      section.items.forEach(item => {
        maxScore += item.w;
        const response = responses[`${section.id}_${item.id}`];
        if (response === 'yes') {
          totalScore += item.w;
        }
      });
    });

    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    onStatsUpdate({
      completed: answeredQuestions,
      total: totalQuestions,
      score: scorePercentage
    });
  }, [responses, onStatsUpdate]);

  const filteredAreaManagers = useMemo(() => {
    if (!amSearchTerm) return areaManagers.areaManagers;
    return areaManagers.areaManagers.filter(am =>
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

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'auditor' | 'sm') => {
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Enable smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    setIsDrawing(prev => ({ ...prev, [type]: true }));

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'auditor' | 'sm') => {
    if (!isDrawing[type]) return;

    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Enable smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (type: 'auditor' | 'sm') => {
    setIsDrawing(prev => ({ ...prev, [type]: false }));

    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;

    // Save signature as base64
    const signatureData = canvas.toDataURL('image/png');
    setSignatures(prev => ({
      ...prev,
      [type]: signatureData
    }));
  };

  const clearSignature = (type: 'auditor' | 'sm') => {
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatures(prev => ({
      ...prev,
      [type]: ''
    }));
  };

  const handleResponse = (questionId: string, answer: string) => {
    setResponses(prev => ({ ...prev, [questionId]: answer }));
    hapticFeedback.select();
  };

  const handleTextResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
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

          // Calculate new dimensions (max 800px width/height for faster processing)
          const maxDimension = 800;
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

          // Draw and compress image (0.6 quality for smaller size and faster upload)
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

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

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    sections.forEach(section => {
      section.items.forEach(item => {
        maxScore += item.w;
        const response = responses[`${section.id}_${item.id}`];
        if (response === 'yes') {
          totalScore += item.w;
        }
      });
    });

    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    return { totalScore, maxScore, scorePercentage };
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

    const requiredFields = ['financeAuditorName', 'financeAuditorId', 'amName', 'amId', 'storeName', 'storeId'];
    const missingFields = requiredFields.filter(field => !meta[field as keyof SurveyMeta]);

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate signatures
    if (!signatures.auditor || !signatures.sm) {
      alert('Please provide both Auditor and Store Manager signatures before submitting.');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate scores
      let totalScore = 0;
      let maxScore = 0;

      console.log('=== SCORE CALCULATION DEBUG ===');
      console.log('Number of sections:', sections.length);
      
      sections.forEach((section, sIdx) => {
        console.log(`Section ${sIdx}: ${section.id}, items: ${section.items ? section.items.length : 'NO ITEMS!'}`);
        section.items.forEach((item, iIdx) => {
          maxScore += item.w;
          const response = responses[`${section.id}_${item.id}`];
          console.log(`  Item ${iIdx}: ${item.id}, weight: ${item.w}, response: ${response}`);
          if (response === 'yes') {
            totalScore += item.w;
          }
        });
      });

      console.log(`Total Score: ${totalScore}, Max Score: ${maxScore}`);
      console.log('=== END SCORE CALCULATION ===');

      const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      // Detect region and correct store ID from comprehensive mapping
      let detectedRegion = '';
      let correctedStoreId = meta.storeId;
      try {
        if (meta.storeId && comprehensiveMapping.length > 0) {
          let storeMapping = comprehensiveMapping.find(item => item['Store ID'] === meta.storeId);

          // If not found and store ID doesn't start with S, try with S prefix
          if (!storeMapping && !meta.storeId.startsWith('S')) {
            const sFormattedId = `S${meta.storeId.padStart(3, '0')}`;
            storeMapping = comprehensiveMapping.find(item => item['Store ID'] === sFormattedId);
          }

          // If still not found, try matching by store name
          if (!storeMapping && meta.storeName) {
            storeMapping = comprehensiveMapping.find(item =>
              item['Store Name'].toLowerCase().includes(meta.storeName.toLowerCase()) ||
              meta.storeName.toLowerCase().includes(item['Store Name'].toLowerCase())
            );
          }

          if (storeMapping) {
            detectedRegion = storeMapping.Region || '';
            correctedStoreId = storeMapping['Store ID'];
          }
        }
      } catch (error) {
        console.warn('Could not load comprehensive mapping data for region detection:', error);
      }

      // Prepare data for Google Sheets (URL-encoded like QA checklist)
      const params: Record<string, string> = {
        submissionTime: new Date().toLocaleString('en-GB', { hour12: false }),
        financeAuditorName: meta.financeAuditorName || '',
        financeAuditorId: meta.financeAuditorId || '',
        amName: meta.amName || '',
        amId: meta.amId || '',
        storeName: meta.storeName || '',
        storeId: correctedStoreId,
        region: detectedRegion || 'Unknown',
        totalScore: totalScore.toString(),
        maxScore: maxScore.toString(),
        scorePercentage: scorePercentage.toString(),
        auditorSignature: signatures.auditor || '',
        smSignature: signatures.sm || ''
      };

      // Debug: Log responses object
      console.log('=== FINANCE AUDIT DEBUG ===');
      console.log('Total responses object:', responses);
      console.log('Responses keys:', Object.keys(responses));
      console.log('Sections being used:', sections);
      console.log('Question Images:', questionImages);
      console.log('Question Remarks:', questionRemarks);

      // Add all question responses
      sections.forEach(section => {
        console.log(`Processing section: ${section.id}`);
        section.items.forEach(item => {
          const questionKey = `${section.id}_${item.id}`;
          const responseValue = responses[questionKey];
          console.log(`  - Question ${questionKey}: ${responseValue}`);
          params[questionKey] = responseValue || '';
          
          // Add per-question remarks with _remark suffix
          const remarkValue = questionRemarks[questionKey] || '';
          params[`${questionKey}_remark`] = remarkValue;
          
          // Add image count with _imageCount suffix
          const imageCount = questionImages[questionKey]?.length || 0;
          params[`${questionKey}_imageCount`] = String(imageCount);
        });
        // Add section remarks
        const remarksKey = `${section.id}_remarks`;
        console.log(`  - Remarks ${remarksKey}: ${responses[remarksKey]}`);
        params[remarksKey] = responses[remarksKey] || '';
      });

      // Add all images as JSON (for storage and future use)
      params.questionImagesJSON = JSON.stringify(questionImages);
      
      // Add all question remarks as JSON (for proper storage)
      params.questionRemarksJSON = JSON.stringify(questionRemarks);

      // Debug: Log final params
      console.log('Final params being sent:', params);
      console.log('Params keys:', Object.keys(params));
      console.log('=== END DEBUG ===');

      // Send as URL-encoded form data (like QA checklist)
      const response = await fetch(LOG_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString()
      });

      // Generate PDF after successful submission
      generatePDF();
      
      setSubmitted(true);

    } catch (error) {
      console.error('Error submitting Finance survey:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);

      // Show detailed error to user
      alert(`Error submitting survey: ${error.message}\n\nCheck browser console (F12) for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSurvey = () => {
    if (confirm('Are you sure you want to reset the survey? All responses will be lost.')) {
      setResponses({});
      setQuestionImages({});
      setQuestionRemarks({});
      setMeta({
        financeAuditorName: '',
        financeAuditorId: '',
        amName: '',
        amId: '',
        storeName: '',
        storeId: ''
      });
      setSignatures({ auditor: '', sm: '' });
      setSubmitted(false);
      localStorage.removeItem('finance_resp');
      localStorage.removeItem('finance_images');
      localStorage.removeItem('finance_remarks');
      localStorage.removeItem('finance_meta');
      localStorage.removeItem('finance_signatures');

      // Clear canvases
      if (auditorCanvasRef.current) {
        const ctx = auditorCanvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, auditorCanvasRef.current.width, auditorCanvasRef.current.height);
      }
      if (smCanvasRef.current) {
        const ctx = smCanvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, smCanvasRef.current.width, smCanvasRef.current.height);
      }
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
    const { totalScore, maxScore, scorePercentage } = calculateScore();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Controls Assessment', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let y = 25;
    doc.text(`Store: ${meta.storeName} (${meta.storeId})`, 10, y);
    y += 6;
    doc.text(`Finance Auditor: ${meta.financeAuditorName} (${meta.financeAuditorId})`, 10, y);
    y += 6;
    doc.text(`Area Manager: ${meta.amName} (${meta.amId})`, 10, y);
    y += 6;
    
    // Region detection (same logic as submit)
    const correctedStoreId = meta.storeId.replace(/['"]/g, '');
    const storeData = comprehensiveMapping?.find((s: any) => 
      s.id === correctedStoreId || s.storeId === correctedStoreId || s['Store ID'] === correctedStoreId
    );
    const detectedRegion = storeData?.region || storeData?.Region || 'Unknown';
    doc.text(`Region: ${detectedRegion}`, 10, y);
    y += 6;
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, y);
    y += 10;
    
    // Score Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Score: ${totalScore} / ${maxScore} (${scorePercentage}%)`, 105, y, { align: 'center' });
    y += 10;
    
    // Sections
    sections.forEach((section, sectionIndex) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${section.title}`, 10, y);
      y += 5;
      
      // Table for section questions
      const tableRows = section.items.map((item, itemIndex) => {
        const questionKey = `${section.id}_${item.id}`;
        const response = responses[questionKey] || '';
        const responseText = response === 'yes' ? 'Yes' : response === 'no' ? 'No' : response === 'na' ? 'NA' : '';
        const remark = questionRemarks[questionKey] || '';
        const score = response === 'yes' ? item.w : response === 'na' ? 'NA' : 0;
        const scoreDisplay = response === 'na' ? `NA/${item.w}` : `${score}/${item.w}`;
        
        return [
          `Q${itemIndex + 1}`,
          item.q,
          responseText,
          scoreDisplay,
          remark || '-'
        ];
      });
      
      autoTable(doc, {
        startY: y,
        head: [['#', 'Question', 'Response', 'Score', 'Remarks']],
        body: tableRows,
        margin: { left: 10, right: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 62 }
        },
        theme: 'grid'
      });
      
      y = (doc as any).lastAutoTable.finalY + 6;
      
      // Section remarks
      const sectionRemarks = responses[`${section.id}_remarks`];
      if (sectionRemarks && sectionRemarks.trim()) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(`Section Remarks: ${sectionRemarks}`, 10, y, { maxWidth: 190 });
        y += 8;
      }
    });
    
    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    doc.save(`finance_audit_${meta.storeName}_${Date.now()}.pdf`);
  };

  if (submitted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
            <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
              Finance Assessment Submitted Successfully!
            </h2>
            <p className="text-green-700 dark:text-green-400 mb-6">
              Thank you for completing the Financial Controls assessment. Your responses have been recorded.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={generatePDF}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button
                onClick={resetSurvey}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Take Another Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {isLoading && <LoadingOverlay isVisible={true} />}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          💰 Financial Controls Assessment
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Comprehensive financial audit covering cash management, revenue tracking, inventory controls, and compliance reporting.
        </p>
      </div>

      {/* Audit Information */}
      <div id="audit-information" className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Assessment Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Finance Auditor Name
            </label>
            <input
              type="text"
              value={meta.financeAuditorName}
              onChange={(e) => handleMetaChange('financeAuditorName', e.target.value)}
              placeholder="Enter Finance Auditor name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Finance Auditor ID
            </label>
            <input
              type="text"
              value={meta.financeAuditorId}
              onChange={(e) => handleMetaChange('financeAuditorId', e.target.value)}
              placeholder="Enter Finance Auditor ID"
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
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${index === selectedAmIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
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
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${index === selectedStoreIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
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

      {/* Finance Sections */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Financial Controls Assessment
        </h2>

        <div className="space-y-8">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="border-l-4 border-emerald-500 pl-4">
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 mb-4">
                {section.title}
              </h3>

              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div key={item.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-medium flex-shrink-0 mt-0.5">
                        {itemIndex + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 leading-relaxed mb-3">
                          {item.q}
                        </p>

                        {/* Response Options */}
                        <div className="flex gap-4">
                          {['yes', 'no', 'na'].map(option => (
                            <label key={option} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`${section.id}_${item.id}`}
                                value={option}
                                checked={responses[`${section.id}_${item.id}`] === option}
                                onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-slate-600 focus:ring-emerald-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-slate-300 capitalize font-medium">{option}</span>
                            </label>
                          ))}
                        </div>

                        {/* Image Upload Section - Multiple Images Support */}
                        <div className="mt-3">
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
                                    {/* Delete Button */}
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
                                    {/* Image Counter */}
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                                      {idx + 1} of {questionImages[`${section.id}_${item.id}`].length}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Per-Question Remarks */}
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              💬 Comments / Remarks for Question {itemIndex + 1}
                            </label>
                            <textarea
                              value={questionRemarks[`${section.id}_${item.id}`] || ''}
                              onChange={(e) => setQuestionRemarks(prev => ({ ...prev, [`${section.id}_${item.id}`]: e.target.value }))}
                              placeholder="Add comments or remarks for this question..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section Remarks */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Section Remarks
                </label>
                <textarea
                  value={responses[`${section.id}_remarks`] || ''}
                  onChange={(e) => handleTextResponse(`${section.id}_remarks`, e.target.value)}
                  placeholder="Add any remarks for this section (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
                />
              </div>
            </div>
          ))}
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
              Finance Auditor Signature *
            </label>
            <div className="border-3 border-gray-400 dark:border-slate-500 rounded-xl bg-white p-1 shadow-inner">
              <canvas
                ref={auditorCanvasRef}
                width={1600}
                height={600}
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
                  userSelect: 'none',
                  imageRendering: 'crisp-edges'
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
                width={1600}
                height={600}
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
                  userSelect: 'none',
                  imageRendering: 'crisp-edges'
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

      <div className="flex justify-between items-center">
        <button
          onClick={resetSurvey}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Reset Assessment
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

export default FinanceChecklist;
