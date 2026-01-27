import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, canAccessStore, canAccessAM } from '../../roleMapping';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import { useComprehensiveMapping, useAreaManagers } from '../../hooks/useComprehensiveMapping';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';

// Google Sheets endpoint for Finance Audit (QA Pattern)
const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzh9_N3moOrM0MAzmY_rcujkncxLwXYNQMMTiRFIpVZEMRog6j2ioXobdrGItm9os7CLw/exec';

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
    title: 'Cash Management',
    items: [
      { id: 'CM_1', q: 'Daily cash reconciliation completed and documented with proper signatures', w: 3 },
      { id: 'CM_2', q: 'Cash drawer balancing performed at shift changes with variance reports', w: 3 },
      { id: 'CM_3', q: 'Petty cash properly managed with supporting receipts and authorization', w: 2 },
      { id: 'CM_4', q: 'Cash security measures in place and followed (locked till, limited access)', w: 3 },
      { id: 'CM_5', q: 'Daily cash deposit procedures followed and documented', w: 3 },
      { id: 'CM_6', q: 'Cash variances investigated and reported promptly to management', w: 2 },
      { id: 'CM_7', q: 'Adequate change fund maintained at all times for operations', w: 2 },
      { id: 'CM_8', q: 'Counterfeit currency detection procedures in place and staff trained', w: 2 }
    ]
  },
  {
    id: 'SalesRevenue',
    title: 'Sales & Revenue Tracking',
    items: [
      { id: 'SR_1', q: 'Daily sales reports generated and reviewed accurately by management', w: 3 },
      { id: 'SR_2', q: 'POS system data reconciled with physical cash and documented', w: 3 },
      { id: 'SR_3', q: 'Promotional discounts properly tracked and authorized with approvals', w: 2 },
      { id: 'SR_4', q: 'Refund and void transaction procedures followed with proper documentation', w: 3 },
      { id: 'SR_5', q: 'Revenue trend analysis conducted regularly and variances investigated', w: 2 },
      { id: 'SR_6', q: 'Sales tax calculations verified and properly recorded', w: 2 },
      { id: 'SR_7', q: 'Credit card settlement procedures followed and reconciled daily', w: 3 }
    ]
  },
  {
    id: 'InventoryFinance',
    title: 'Inventory & Financial Controls',
    items: [
      { id: 'IF_1', q: 'Inventory valuation methods consistently applied and documented', w: 3 },
      { id: 'IF_2', q: 'Physical inventory counts conducted regularly and variances investigated', w: 3 },
      { id: 'IF_3', q: 'Stock movement properly recorded and authorized', w: 2 },
      { id: 'IF_4', q: 'Vendor payment procedures followed with proper approvals', w: 3 },
      { id: 'IF_5', q: 'Purchase orders properly authorized and documented', w: 2 },
      { id: 'IF_6', q: 'Expense categorization accurate and consistent with guidelines', w: 2 },
      { id: 'IF_7', q: 'Cost of goods sold calculations verified and accurate', w: 3 },
      { id: 'IF_8', q: 'Wastage and shrinkage properly documented and investigated', w: 2 }
    ]
  },
  {
    id: 'ComplianceReporting',
    title: 'Compliance & Reporting',
    items: [
      { id: 'CR_1', q: 'Monthly financial statements prepared accurately and on time', w: 3 },
      { id: 'CR_2', q: 'Tax compliance requirements met and documented', w: 3 },
      { id: 'CR_3', q: 'Audit trail maintained for all financial transactions', w: 3 },
      { id: 'CR_4', q: 'Internal controls testing performed and documented', w: 2 },
      { id: 'CR_5', q: 'Regulatory reporting requirements met and filed on time', w: 3 },
      { id: 'CR_6', q: 'Documentation retention policies followed for financial records', w: 2 },
      { id: 'CR_7', q: 'Budget variance analysis performed and reviewed monthly', w: 2 }
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

      // Add all question responses
      sections.forEach(section => {
        console.log(`Processing section: ${section.id}`);
        section.items.forEach(item => {
          const questionKey = `${section.id}_${item.id}`;
          const responseValue = responses[questionKey];
          console.log(`  - Question ${questionKey}: ${responseValue}`);
          params[questionKey] = responseValue || '';
        });
        // Add section remarks
        const remarksKey = `${section.id}_remarks`;
        console.log(`  - Remarks ${remarksKey}: ${responses[remarksKey]}`);
        params[remarksKey] = responses[remarksKey] || '';
      });

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

      alert('Finance audit submitted successfully! Please check your Google Sheet to verify the data was recorded.');
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 text-emerald-700 dark:text-emerald-300">
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