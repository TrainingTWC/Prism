import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, canAccessStore, canAccessAM } from '../../roleMapping';
import { AREA_MANAGERS } from '../../constants';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import hrMappingData from '../../src/hr_mapping.json';
import { useAuth } from '../../contexts/AuthContext';

// Google Sheets endpoint for logging data
const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxW541QsQc98NKMVh-lnNBnINskIqD10CnQHvGsW_R2SLASGSdBDN9lTGj1gznlNbHORQ/exec';

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
      {id: 'CM_1', q: 'Daily cash reconciliation completed and documented with proper signatures', w: 3},
      {id: 'CM_2', q: 'Cash drawer balancing performed at shift changes with variance reports', w: 3},
      {id: 'CM_3', q: 'Petty cash properly managed with supporting receipts and authorization', w: 2},
      {id: 'CM_4', q: 'Cash security measures in place and followed (locked till, limited access)', w: 3},
      {id: 'CM_5', q: 'Daily cash deposit procedures followed and documented', w: 3},
      {id: 'CM_6', q: 'Cash variances investigated and reported promptly to management', w: 2},
      {id: 'CM_7', q: 'Adequate change fund maintained at all times for operations', w: 2},
      {id: 'CM_8', q: 'Counterfeit currency detection procedures in place and staff trained', w: 2}
    ]
  },
  { 
    id: 'SalesRevenue', 
    title: 'Sales & Revenue Tracking', 
    items: [
      {id: 'SR_1', q: 'Daily sales reports generated and reviewed accurately by management', w: 3},
      {id: 'SR_2', q: 'POS system data reconciled with physical cash and documented', w: 3},
      {id: 'SR_3', q: 'Promotional discounts properly tracked and authorized with approvals', w: 2},
      {id: 'SR_4', q: 'Refund and void transaction procedures followed with proper documentation', w: 3},
      {id: 'SR_5', q: 'Revenue trend analysis conducted regularly and variances investigated', w: 2},
      {id: 'SR_6', q: 'Sales tax calculations verified and properly recorded', w: 2},
      {id: 'SR_7', q: 'Credit card settlement procedures followed and reconciled daily', w: 3}
    ]
  },
  { 
    id: 'InventoryFinance', 
    title: 'Inventory & Financial Controls', 
    items: [
      {id: 'IF_1', q: 'Inventory valuation methods consistently applied and documented', w: 3},
      {id: 'IF_2', q: 'Physical inventory counts conducted regularly and variances investigated', w: 3},
      {id: 'IF_3', q: 'Stock movement properly recorded and authorized', w: 2},
      {id: 'IF_4', q: 'Vendor payment procedures followed with proper approvals', w: 3},
      {id: 'IF_5', q: 'Purchase orders properly authorized and documented', w: 2},
      {id: 'IF_6', q: 'Expense categorization accurate and consistent with guidelines', w: 2},
      {id: 'IF_7', q: 'Cost of goods sold calculations verified and accurate', w: 3},
      {id: 'IF_8', q: 'Wastage and shrinkage properly documented and investigated', w: 2}
    ]
  },
  { 
    id: 'ComplianceReporting', 
    title: 'Compliance & Reporting', 
    items: [
      {id: 'CR_1', q: 'Monthly financial statements prepared accurately and on time', w: 3},
      {id: 'CR_2', q: 'Tax compliance requirements met and documented', w: 3},
      {id: 'CR_3', q: 'Audit trail maintained for all financial transactions', w: 3},
      {id: 'CR_4', q: 'Internal controls testing performed and documented', w: 2},
      {id: 'CR_5', q: 'Regulatory reporting requirements met and filed on time', w: 3},
      {id: 'CR_6', q: 'Documentation retention policies followed for financial records', w: 2},
      {id: 'CR_7', q: 'Budget variance analysis performed and reviewed monthly', w: 2}
    ]
  }
];

const FinanceChecklist: React.FC<FinanceChecklistProps> = ({ userRole, onStatsUpdate }) => {
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
    } catch(e) {}
    
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

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allStores, setAllStores] = useState<Store[]>([]);
  
  const [amSearchTerm, setAmSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedAmIndex, setSelectedAmIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

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

  // Load stores from hr_mapping.json
  useEffect(() => {
    const loadStores = () => {
      try {
        const storeMap = new Map();
        
        hrMappingData.forEach((item: any) => {
          if (!storeMap.has(item.storeId)) {
            storeMap.set(item.storeId, {
              name: item.locationName,
              id: item.storeId,
              region: item.region
            });
          }
        });
        
        const stores = Array.from(storeMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAllStores(stores);
      } catch (error) {
        console.warn('Could not load stores from mapping data:', error);
        setAllStores([
          { name: 'Defence Colony', id: 'S027' },
          { name: 'Khan Market', id: 'S037' },
          { name: 'UB City', id: 'S007' },
          { name: 'Koramangala 1', id: 'S001' }
        ]);
      }
    };
    
    loadStores();
  }, []);

  // Save responses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('finance_resp', JSON.stringify(responses));
  }, [responses]);

  // Save meta to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('finance_meta', JSON.stringify(meta));
  }, [meta]);

  // Update stats whenever responses change
  useEffect(() => {
    const totalQuestions = FINANCE_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key => 
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;
    
    // Calculate score
    let totalScore = 0;
    let maxScore = 0;
    
    FINANCE_SECTIONS.forEach(section => {
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
    if (!amSearchTerm) return AREA_MANAGERS;
    return AREA_MANAGERS.filter(am => 
      am.name.toLowerCase().includes(amSearchTerm.toLowerCase()) ||
      am.id.toLowerCase().includes(amSearchTerm.toLowerCase())
    );
  }, [amSearchTerm]);

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

  const handleSubmit = async () => {
    const totalQuestions = FINANCE_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
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

    setIsLoading(true);

    try {
      // Calculate scores
      let totalScore = 0;
      let maxScore = 0;
      
      FINANCE_SECTIONS.forEach(section => {
        section.items.forEach(item => {
          maxScore += item.w;
          const response = responses[`${section.id}_${item.id}`];
          if (response === 'yes') {
            totalScore += item.w;
          }
        });
      });
      
      const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      // Detect region and correct store ID
      let detectedRegion = '';
      let correctedStoreId = meta.storeId;
      try {
        if (meta.storeId) {
          let storeMapping = hrMappingData.find((item: any) => item.storeId === meta.storeId);
          
          const storeIdNum = Number(meta.storeId);
          if (!storeMapping && !Number.isNaN(storeIdNum) && typeof meta.storeId === 'string' && !meta.storeId.startsWith('S')) {
            const sFormattedId = `S${meta.storeId.padStart(3, '0')}`;
            storeMapping = hrMappingData.find((item: any) => item.storeId === sFormattedId);
          }
          
          if (!storeMapping && meta.storeName) {
            storeMapping = hrMappingData.find((item: any) => 
              item.locationName.toLowerCase().includes(meta.storeName.toLowerCase()) ||
              meta.storeName.toLowerCase().includes(item.locationName.toLowerCase())
            );
          }
          
          if (storeMapping) {
            detectedRegion = storeMapping.region || '';
            correctedStoreId = storeMapping.storeId;
          }
        }
      } catch (error) {
        console.warn('Could not load mapping data for region detection:', error);
      }

      // Prepare data for Google Sheets
      const params = {
        submissionTime: new Date().toLocaleString('en-GB', {hour12: false}),
        financeAuditorName: meta.financeAuditorName || '',
        financeAuditorId: meta.financeAuditorId || '',
        amName: meta.amName || '',
        amId: meta.amId || '',
        storeName: meta.storeName || '',
        storeID: correctedStoreId,
        region: detectedRegion || 'Unknown',
        totalScore: totalScore,
        maxScore: maxScore,
        scorePercentage: scorePercentage,
        ...responses
      };

      console.log('Finance Survey data being sent:', params);

      // Ensure all values are strings for URLSearchParams
      const stringParams: Record<string, string> = Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      );

      const response = await fetch(LOG_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(stringParams).toString()
      });

      console.log('Finance Survey submitted successfully');
      setSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting Finance survey:', error);
      alert('Error submitting survey. Please try again.');
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
      setSubmitted(false);
      localStorage.removeItem('finance_resp');
      localStorage.removeItem('finance_meta');
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
              value={amSearchTerm || (meta.amId ? `${meta.amName} (${meta.amId})` : '')}
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
                      {am.name} ({am.id})
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

      {/* Finance Sections */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Financial Controls Assessment
        </h2>
        
        <div className="space-y-8">
          {FINANCE_SECTIONS.map((section, sectionIndex) => (
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