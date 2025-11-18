import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, canAccessStore, canAccessAM, canAccessHR } from '../../roleMapping';
import { QUESTIONS, AREA_MANAGERS, HR_PERSONNEL, SENIOR_HR_ROLES } from '../../constants';
import { Question, Choice, Store } from '../../types';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import compStoreMapping from '../../src/comprehensive_store_mapping.json';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';

// Google Sheets endpoint for logging data
const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxW541QsQc98NKMVh-lnNBnINskIqD10CnQHvGsW_R2SLASGSdBDN9lTGj1gznlNbHORQ/exec';

interface SurveyResponse {
  [key: string]: string;
}

interface SurveyMeta {
  hrName: string;
  hrId: string;
  amName: string;
  amId: string;
  empName: string;
  empId: string;
  storeName: string;
  storeId: string;
}

interface HRChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
}

const HRChecklist: React.FC<HRChecklistProps> = ({ userRole, onStatsUpdate }) => {
  const [responses, setResponses] = useState<SurveyResponse>(() => {
    try { 
      return JSON.parse(localStorage.getItem('hr_resp') || '{}'); 
    } catch (e) { 
      return {}; 
    }
  });

  const [meta, setMeta] = useState<SurveyMeta>(() => {
    let stored = {};
    try { 
      stored = JSON.parse(localStorage.getItem('hr_meta') || '{}'); 
    } catch(e) {}
    
    const urlParams = new URLSearchParams(window.location.search);
    const hrId = urlParams.get('hrId') || urlParams.get('hr_id') || (stored as any).hrId || '';
    const hrName = urlParams.get('hrName') || urlParams.get('hr_name') || (stored as any).hrName || '';
    
    const findHRById = (id: string) => {
      if (!id) return null;
      return HR_PERSONNEL.find(hr => hr.id === id || hr.id.toLowerCase() === id.toLowerCase());
    };
    
    let finalHrName = hrName;
    let finalHrId = hrId;
    
    if (hrId) {
      const hrPerson = findHRById(hrId);
      if (hrPerson) {
        finalHrName = hrPerson.name;
        finalHrId = hrPerson.id;
      }
    } else if (hrName && !hrId) {
      const hrPerson = HR_PERSONNEL.find(hr => hr.name === hrName);
      if (hrPerson) {
        finalHrId = hrPerson.id;
      }
    }
    
    return {
      hrName: finalHrName,
      hrId: finalHrId,
      amName: (stored as any).amName || '',
      amId: (stored as any).amId || '',
      empName: (stored as any).empName || '',
      empId: (stored as any).empId || '',
      storeName: (stored as any).storeName || '',
      storeId: (stored as any).storeId || ''
    };
  });

  const { employeeData, userRole: authUserRole } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [filteredStoresByHR, setFilteredStoresByHR] = useState<Store[]>([]);
  
  const [amSearchTerm, setAmSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedAmIndex, setSelectedAmIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

  // Autofill HR fields when user role is hr
  useEffect(() => {
    if (authUserRole === 'hr' && employeeData && !meta.hrId) {
      setMeta(prev => ({
        ...prev,
        hrId: employeeData.code,
        hrName: employeeData.name
      }));
    }
  }, [authUserRole, employeeData]);

  // Load stores from comprehensive_store_mapping.json
  useEffect(() => {
    const loadStores = () => {
      try {
        const storeMap = new Map();
        
        compStoreMapping.forEach((item: any) => {
          const storeId = item['Store ID'];
          const storeName = item['Store Name'];
          const region = item.Region;
          
          if (!storeMap.has(storeId)) {
            storeMap.set(storeId, {
              name: storeName,
              id: storeId,
              region: region
            });
          }
        });
        
        const stores = Array.from(storeMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAllStores(stores);
      } catch (error) {
        console.warn('Could not load stores from mapping data:', error);
        setAllStores([
          { name: 'Defence Colony', id: 'S027', region: 'Unknown' },
          { name: 'Khan Market', id: 'S037', region: 'Unknown' },
          { name: 'UB City', id: 'S007', region: 'Unknown' },
          { name: 'Koramangala 1', id: 'S001', region: 'Unknown' }
        ]);
      }
    };
    
    loadStores();
  }, []);

  // Filter stores by HR
  useEffect(() => {
    const filterStoresByHR = () => {
      if (!meta.hrId || allStores.length === 0) {
        setFilteredStoresByHR([]);
        return;
      }

      try {
        const hrStoreIds = compStoreMapping
          .filter((mapping: any) => 
            mapping.HRBP === meta.hrId || 
            mapping['Regional Training Manager'] === meta.hrId || 
            mapping['HR Head'] === meta.hrId
          )
          .map((mapping: any) => mapping['Store ID']);
        
        const hrStores = allStores.filter(store => hrStoreIds.includes(store.id));
        setFilteredStoresByHR(hrStores);
        
        if (hrStores.length > 0 && !meta.amId) {
          const firstStoreMapping = compStoreMapping.find((mapping: any) => 
            mapping['Store ID'] === hrStores[0].id
          );
          
          if (firstStoreMapping) {
            const amId = firstStoreMapping.AM;
            const amPerson = AREA_MANAGERS.find(am => am.id.toLowerCase() === amId.toLowerCase());
            
            if (amPerson) {
              setMeta(prev => ({
                ...prev,
                amId: amPerson.id,
                amName: amPerson.name
              }));
            }
          }
        }
      } catch (error) {
        console.warn('Could not filter stores by HR:', error);
        setFilteredStoresByHR([]);
      }
    };

    filterStoresByHR();
  }, [meta.hrId, allStores]);

  const availableAreaManagers = useMemo(() => {
    // If no HR is selected, show all accessible AMs
    if (!meta.hrId) {
      return AREA_MANAGERS.filter(am => canAccessAM(userRole, am.id));
    }
    
    // If HR is a senior role, show all accessible AMs
    if (SENIOR_HR_ROLES.includes(meta.hrId)) {
      const allAccessibleAMs = AREA_MANAGERS.filter(am => canAccessAM(userRole, am.id));
      return allAccessibleAMs;
    }
    
    // Filter AMs based on selected HR
    const hrAreaManagerIds = new Set<string>();
    
    compStoreMapping.forEach((mapping: any) => {
      // Check if this store is managed by the selected HR
      if (mapping.HRBP === meta.hrId || 
          mapping['Regional Training Manager'] === meta.hrId || 
          mapping['HR Head'] === meta.hrId) {
        if (mapping.AM) {
          // Add AM in all case variations
          hrAreaManagerIds.add(mapping.AM);
          hrAreaManagerIds.add(mapping.AM.toUpperCase());
          hrAreaManagerIds.add(mapping.AM.toLowerCase());
        }
      }
    });
    
    // Filter AREA_MANAGERS to only those managed by this HR
    const filteredAMs = AREA_MANAGERS.filter(am => 
      hrAreaManagerIds.has(am.id) || 
      hrAreaManagerIds.has(am.id.toUpperCase()) || 
      hrAreaManagerIds.has(am.id.toLowerCase())
    );
    
    console.log(`[HR Checklist] Filtered AMs for HR ${meta.hrId}:`, filteredAMs.length, 'AMs');
    return filteredAMs;
  }, [userRole, meta.hrId]);

  const availableStores = useMemo(() => {
    // If AM is selected, filter stores by AM
    if (meta.amId) {
      const amStoreIds = compStoreMapping
        .filter((mapping: any) => {
          const am = mapping.AM;
          return am && (
            am === meta.amId || 
            am.toUpperCase() === meta.amId.toUpperCase()
          );
        })
        .map((mapping: any) => mapping['Store ID']);
      
      const filteredStores = allStores.filter(store => amStoreIds.includes(store.id));
      console.log(`[HR Checklist] Filtered stores for AM ${meta.amId}:`, filteredStores.length, 'stores');
      return filteredStores;
    }
    
    // If only HR is selected (no AM), show all stores under that HR
    if (meta.hrId) {
      console.log(`[HR Checklist] Showing HR stores (no AM selected):`, filteredStoresByHR.length, 'stores');
      return filteredStoresByHR;
    }
    
    // No filters - show role-based stores
    const roleBasedStores = allStores.filter(store => canAccessStore(userRole, store.id));
    console.log(`[HR Checklist] Showing role-based stores:`, roleBasedStores.length, 'stores');
    return roleBasedStores;
  }, [userRole, allStores, filteredStoresByHR, meta.hrId, meta.amId]);

  const availableHRPersonnel = useMemo(() => {
    return HR_PERSONNEL.filter(hr => canAccessHR(userRole, hr.id));
  }, [userRole]);

  const filteredAreaManagers = useMemo(() => {
    if (!amSearchTerm) return availableAreaManagers;
    return availableAreaManagers.filter(am => 
      am.name.toLowerCase().includes(amSearchTerm.toLowerCase()) ||
      am.id.toLowerCase().includes(amSearchTerm.toLowerCase())
    );
  }, [availableAreaManagers, amSearchTerm]);

  const filteredStores = useMemo(() => {
    if (!storeSearchTerm) return availableStores;
    return availableStores.filter(store => 
      store.name.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      store.id.toLowerCase().includes(storeSearchTerm.toLowerCase())
    );
  }, [availableStores, storeSearchTerm]);

  // Save responses to localStorage and update stats
  useEffect(() => {
    try { 
      localStorage.setItem('hr_resp', JSON.stringify(responses)); 
    } catch(e) {}
    
    const totalQuestions = QUESTIONS.length;
    // Only count the main questions, not the remarks fields
    const completedQuestions = QUESTIONS.filter(q => responses[q.id] && responses[q.id].trim() !== '').length;
    
    const radioQuestions = QUESTIONS.filter(q => q.type === 'radio');
    let totalPossibleScore = 0;
    let actualScore = 0;
    
    radioQuestions.forEach(q => {
      if (q.choices) {
        const maxScore = Math.max(...q.choices.map(c => c.score || 0));
        totalPossibleScore += maxScore;
        
        if (responses[q.id]) {
          const selectedChoice = q.choices.find(c => c.label === responses[q.id]);
          if (selectedChoice) {
            actualScore += selectedChoice.score || 0;
          }
        }
      }
    });
    
    const scorePercentage = totalPossibleScore > 0 ? (actualScore / totalPossibleScore) * 100 : 0;
    
    onStatsUpdate({
      completed: completedQuestions,
      total: totalQuestions,
      score: scorePercentage
    });
  }, [responses, onStatsUpdate]);

  useEffect(() => {
    try { 
      localStorage.setItem('hr_meta', JSON.stringify(meta)); 
    } catch(e) {}
  }, [meta]);

  const handleMetaChange = (key: keyof SurveyMeta, value: string) => {
    setMeta(prev => {
      const next = { ...prev, [key]: value };
      
      // Clear dependent fields when parent field changes
      if (key === 'hrId') {
        // When HR changes, clear AM and Store
        next.amId = '';
        next.amName = '';
        next.storeId = '';
        next.storeName = '';
        console.log('[HR Checklist] HR changed, cleared AM and Store');
      } else if (key === 'amId') {
        // When AM changes, clear Store
        next.storeId = '';
        next.storeName = '';
        console.log('[HR Checklist] AM changed, cleared Store');
      } else if (key === 'storeId' && value) {
        // Auto-fill store name when store is selected
        const storeMapping = compStoreMapping.find((mapping: any) => mapping['Store ID'] === value);
        
        if (storeMapping) {
          next.storeName = storeMapping['Store Name'];
        }
      }
      
      return next;
    });
  };

  const handleResponse = (questionId: string, answer: string) => {
    setResponses(prev => ({ ...prev, [questionId]: answer }));
    hapticFeedback.select();
  };

  const handleSubmit = async () => {
    const totalAnswered = Object.keys(responses).length;
    const totalQuestions = QUESTIONS.length;
    
    if (totalAnswered < totalQuestions) {
      alert(`Please answer all questions. You have answered ${totalAnswered} out of ${totalQuestions} questions.`);
      return;
    }

    const requiredFields = ['hrName', 'hrId', 'amName', 'amId', 'empName', 'empId', 'storeName', 'storeId'];
    const missingFields = requiredFields.filter(field => !meta[field as keyof SurveyMeta]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      // Calculate scores
      const radioQuestions = QUESTIONS.filter(q => q.type === 'radio');
      let totalPossibleScore = 0;
      let actualScore = 0;
      
      radioQuestions.forEach(q => {
        if (q.choices) {
          const maxScore = Math.max(...q.choices.map(c => c.score || 0));
          totalPossibleScore += maxScore;
          
          if (responses[q.id]) {
            const selectedChoice = q.choices.find(c => c.label === responses[q.id]);
            if (selectedChoice) {
              actualScore += selectedChoice.score || 0;
            }
          }
        }
      });
      
      const scorePercentage = totalPossibleScore > 0 ? Math.round((actualScore / totalPossibleScore) * 100) : 0;

      // Detect region and correct store ID based on store ID  
      let detectedRegion = '';
      let correctedStoreId = meta.storeId; // Default to original
      try {
        if (meta.storeId) {
          // Try to find by exact store ID match first
          let storeMapping = compStoreMapping.find((item: any) => item['Store ID'] === meta.storeId);
          
          // If not found and storeId is numeric, try with S prefix
          if (!storeMapping && !isNaN(Number(meta.storeId)) && !meta.storeId.startsWith('S')) {
            const sFormattedId = `S${meta.storeId.padStart(3, '0')}`;
            storeMapping = compStoreMapping.find((item: any) => item['Store ID'] === sFormattedId);
          }
          
          // If still not found, try to match by store name
          if (!storeMapping && meta.storeName) {
            storeMapping = compStoreMapping.find((item: any) => 
              item['Store Name'].toLowerCase().includes(meta.storeName.toLowerCase()) ||
              meta.storeName.toLowerCase().includes(item['Store Name'].toLowerCase())
            );
          }
          
          if (storeMapping) {
            detectedRegion = storeMapping.Region || '';
            correctedStoreId = storeMapping['Store ID']; // Use the correct S-prefixed store ID
            console.log(`✅ HR Survey - Store mapped: ${meta.storeId} (${meta.storeName}) → ${correctedStoreId} → Region: ${detectedRegion}`);
          } else {
            console.warn(`❌ HR Survey - No mapping found for store ${meta.storeId} (${meta.storeName})`);
          }
        }
      } catch (error) {
        console.warn('Could not load comprehensive store mapping for region detection:', error);
      }

      // Prepare data in the expected Google Sheets format
      const params = {
        submissionTime: new Date().toLocaleString('en-GB', {hour12: false}),
        hrName: meta.hrName || '',
        hrId: meta.hrId || '',
        amName: meta.amName || '',
        amId: meta.amId || '',
        empName: meta.empName || '',
        empId: meta.empId || '',
        storeName: meta.storeName || '',
        storeID: correctedStoreId, // Use the corrected S-prefixed store ID
        region: detectedRegion || 'Unknown',
        q1: responses['q1'] || '',
        q1_remarks: responses['q1_remarks'] || '',
        q2: responses['q2'] || '',
        q2_remarks: responses['q2_remarks'] || '',
        q3: responses['q3'] || '',
        q3_remarks: responses['q3_remarks'] || '',
        q4: responses['q4'] || '',
        q4_remarks: responses['q4_remarks'] || '',
        q5: responses['q5'] || '',
        q5_remarks: responses['q5_remarks'] || '',
        q6: responses['q6'] || '',
        q6_remarks: responses['q6_remarks'] || '',
        q7: responses['q7'] || '',
        q7_remarks: responses['q7_remarks'] || '',
        q8: responses['q8'] || '',
        q8_remarks: responses['q8_remarks'] || '',
        q9: responses['q9'] || '',
        q9_remarks: responses['q9_remarks'] || '',
        q10: responses['q10'] || '',
        q10_remarks: responses['q10_remarks'] || '',
        q11: responses['q11'] || '',
        q11_remarks: responses['q11_remarks'] || '',
        q12: responses['q12'] || '',
        q12_remarks: responses['q12_remarks'] || '',
        totalScore: actualScore.toString(),
        maxScore: totalPossibleScore.toString(),
        percent: scorePercentage.toString()
      };

      const body = Object.keys(params).map(k => 
        encodeURIComponent(k) + '=' + encodeURIComponent((params as any)[k])
      ).join('&');

      console.log('Submitting to Google Sheets with data:', params);

      const response = await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body
      });

      if (response.ok) {
        setSubmitted(true);
        localStorage.removeItem('hr_resp');
        localStorage.removeItem('hr_meta');
        hapticFeedback.success();
      } else {
        throw new Error('Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Failed to submit survey. Please try again.');
      hapticFeedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  const resetSurvey = () => {
    if (confirm('Are you sure you want to reset the survey? All responses will be lost.')) {
      // Preserve HR name and ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const hrId = urlParams.get('hrId') || urlParams.get('hr_id') || '';
      const hrName = urlParams.get('hrName') || urlParams.get('hr_name') || '';
      
      const findHRById = (id: string) => {
        if (!id) return null;
        return HR_PERSONNEL.find(hr => hr.id === id || hr.id.toLowerCase() === id.toLowerCase());
      };
      
      let finalHrName = hrName;
      let finalHrId = hrId;
      
      if (hrId) {
        const hrPerson = findHRById(hrId);
        if (hrPerson) {
          finalHrName = hrPerson.name;
          finalHrId = hrPerson.id;
        }
      } else if (hrName && !hrId) {
        const hrPerson = HR_PERSONNEL.find(hr => hr.name === hrName);
        if (hrPerson) {
          finalHrId = hrPerson.id;
        }
      }
      
      setResponses({});
      setMeta({
        hrName: finalHrName,
        hrId: finalHrId,
        amName: '',
        amId: '',
        empName: '',
        empId: '',
        storeName: '',
        storeId: ''
      });
      setSubmitted(false);
      localStorage.removeItem('hr_resp');
      localStorage.removeItem('hr_meta');
    }
  };

  if (submitted) {
    return (
      <div className="p-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-6">
          <button
            onClick={() => window.history.back()}
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            ← Back to Checklists
          </button>
        </nav>

        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
            <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
              Survey Submitted Successfully!
            </h2>
            <p className="text-green-700 dark:text-green-400 mb-6">
              Thank you for completing the HR Employee Satisfaction Survey. Your responses have been recorded.
            </p>
            <button
              onClick={resetSurvey}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Take Another Survey
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {isLoading && <LoadingOverlay />}
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
        <button
          onClick={() => window.history.back()}
          className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          ← Back to Checklists
        </button>
      </nav>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          👥 HR Employee Satisfaction Survey
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Help us understand your experience and improve our workplace culture. All responses are confidential.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Survey Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              HR Name *
            </label>
            <select
              value={meta.hrId}
              onChange={(e) => {
                const selectedHR = availableHRPersonnel.find(hr => hr.id === e.target.value);
                handleMetaChange('hrId', e.target.value);
                handleMetaChange('hrName', selectedHR ? selectedHR.name : '');
              }}
              disabled={(() => {
                const urlParams = new URLSearchParams(window.location.search);
                return !!(urlParams.get('hrId') || urlParams.get('hr_id') || urlParams.get('hrName') || urlParams.get('hr_name'));
              })()}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Select HR Person</option>
              {availableHRPersonnel.map(hr => (
                <option key={hr.id} value={hr.id}>
                  {hr.name} ({hr.id})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Area Manager *
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
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
            
            {showAmDropdown && filteredAreaManagers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredAreaManagers.map((am, index) => (
                  <button
                    key={am.id}
                    onClick={() => {
                      handleMetaChange('amId', am.id);
                      handleMetaChange('amName', am.name);
                      // Reset store selection when AM changes
                      handleMetaChange('storeId', '');
                      handleMetaChange('storeName', '');
                      setAmSearchTerm('');
                      setShowAmDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                      index === selectedAmIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                    }`}
                  >
                    {am.name} ({am.id})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Employee Name *
            </label>
            <input
              type="text"
              value={meta.empName}
              onChange={(e) => handleMetaChange('empName', e.target.value)}
              placeholder="Enter employee name"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Employee ID *
            </label>
            <input
              type="text"
              value={meta.empId}
              onChange={(e) => handleMetaChange('empId', e.target.value)}
              placeholder="Enter employee ID"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          <div className="md:col-span-2">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Store Location *
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
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
              
              {showStoreDropdown && filteredStores.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredStores.map((store, index) => (
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6">
          Survey Questions
        </h2>
        
        <div className="space-y-6">
          {QUESTIONS.map((question, index) => (
            <div key={question.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
              <div className="mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <span className="text-lg font-medium text-gray-900 dark:text-slate-100">
                  {question.title}
                </span>
              </div>
              
              {question.type === 'radio' && question.choices && (
                <div className="ml-11 space-y-4">
                  <div className="space-y-2">
                    {question.choices.map((choice) => (
                      <label key={choice.label} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value={choice.label}
                          checked={responses[question.id] === choice.label}
                          onChange={(e) => handleResponse(question.id, e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-slate-300">{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <textarea
                      value={responses[`${question.id}_remarks`] || ''}
                      onChange={(e) => handleResponse(`${question.id}_remarks`, e.target.value)}
                      placeholder="Add remarks for this question (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              )}
              
              {question.type === 'input' && (
                <div className="ml-11 space-y-4">
                  <input
                    type="text"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    placeholder="Enter your answer..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  />
                  <div>
                    <textarea
                      value={responses[`${question.id}_remarks`] || ''}
                      onChange={(e) => handleResponse(`${question.id}_remarks`, e.target.value)}
                      placeholder="Add remarks for this question (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              )}
              
              {question.type === 'textarea' && (
                <div className="ml-11">
                  <textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    placeholder="Enter your suggestions..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={resetSurvey}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Reset Survey
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-3 btn-primary-gradient disabled:opacity-60 text-white rounded-lg font-medium transition-transform duration-150 transform hover:scale-105"
        >
          {isLoading ? 'Submitting...' : 'Submit Survey'}
        </button>
      </div>
    </div>
  );
};

export default HRChecklist;