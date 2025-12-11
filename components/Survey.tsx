import React, { useState, useEffect, useMemo } from 'react';
import { QUESTIONS as DEFAULT_QUESTIONS, AREA_MANAGERS as DEFAULT_AREA_MANAGERS, HR_PERSONNEL as DEFAULT_HR_PERSONNEL, SENIOR_HR_ROLES, NORTH_REGION_HRBPS, NORTH_REGION_AMS } from '../constants';
import { Question, Choice, Store } from '../types';
import { UserRole, canAccessStore, canAccessAM, canAccessHR } from '../roleMapping';
import { hapticFeedback } from '../utils/haptics';
import LoadingOverlay from './LoadingOverlay';
import { STORES_PROMISE, MAPPED_STORES } from '../mappedStores';
import { useConfig } from '../contexts/ConfigContext';

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

interface SurveyProps {
  userRole: UserRole;
}

const Survey: React.FC<SurveyProps> = ({ userRole }) => {
  const { config, loading: configLoading } = useConfig();
  
  // Use config data if available, otherwise fall back to hardcoded constants
  const QUESTIONS = config?.QUESTIONS || DEFAULT_QUESTIONS;
  const AREA_MANAGERS = config?.AREA_MANAGERS || DEFAULT_AREA_MANAGERS;
  const HR_PERSONNEL = config?.HR_PERSONNEL || DEFAULT_HR_PERSONNEL;
  console.log('Survey component mounted with userRole:', userRole);
  console.log('HR_PERSONNEL imported:', HR_PERSONNEL);
  console.log('HR_PERSONNEL length:', HR_PERSONNEL.length);
  
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
    
    // Get HR info from URL parameters (only HR fills survey)
    const urlParams = new URLSearchParams(window.location.search);
    const hrId = urlParams.get('hrId') || urlParams.get('hr_id') || (stored as any).hrId || '';
    const hrName = urlParams.get('hrName') || urlParams.get('hr_name') || (stored as any).hrName || '';
    
    console.log('🚀 Initial HR lookup - ID:', hrId, 'Name:', hrName);
    console.log('📋 HR_PERSONNEL array:', HR_PERSONNEL);
    
    // Function to find HR by ID
    const findHRById = (id: string) => {
      if (!id) return null;
      return HR_PERSONNEL.find(hr => hr.id === id || hr.id.toLowerCase() === id.toLowerCase());
    };
    
    // Determine final HR name and ID
    let finalHrName = hrName;
    let finalHrId = hrId;
    
    // If we have an HR ID, always try to get the name from it
    if (hrId) {
      const hrPerson = findHRById(hrId);
      if (hrPerson) {
        finalHrName = hrPerson.name;
        finalHrId = hrPerson.id; // Use the exact ID format from constants
        console.log('✅ Found HR person by ID:', hrPerson);
      } else {
        console.warn('❌ No HR person found for ID:', hrId);
        console.log('🔍 Available HR IDs:', HR_PERSONNEL.map(hr => hr.id));
      }
    }
    // If we have a name but no ID, try to find the ID
    else if (hrName && !hrId) {
      const hrPerson = HR_PERSONNEL.find(hr => hr.name === hrName);
      if (hrPerson) {
        finalHrId = hrPerson.id;
        console.log('✅ Found HR ID by name:', hrPerson);
      }
    }
    
    const result = {
      hrName: finalHrName,
      hrId: finalHrId,
      amName: (stored as any).amName || '', // AM will be auto-filled from HR mapping
      amId: (stored as any).amId || '',     // AM will be auto-filled from HR mapping
      empName: (stored as any).empName || '',
      empId: (stored as any).empId || '',
      storeName: (stored as any).storeName || '',
      storeId: (stored as any).storeId || ''
    };
    
    console.log('🎯 Initial meta state:', result);
    return result;
  });

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [filteredStoresByHR, setFilteredStoresByHR] = useState<Store[]>([]);
  
  // Search states for dropdowns
  const [amSearchTerm, setAmSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedAmIndex, setSelectedAmIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

  // Auto-fetch HR info from URL on component mount and save to localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hrId = urlParams.get('hrId') || urlParams.get('hr_id');
    const hrName = urlParams.get('hrName') || urlParams.get('hr_name');
    const clearCache = urlParams.get('clear');
    
    // Clear localStorage if requested
    if (clearCache) {
      try {
        localStorage.removeItem('hr_meta');
        localStorage.removeItem('hr_resp');
        console.log('Cleared localStorage cache');
      } catch(e) {}
    }
    
    if (hrId || hrName) {
      setMeta(prev => {
        // Function to find HR by ID
        const findHRById = (id: string) => {
          if (!id) return null;
          return HR_PERSONNEL.find(hr => hr.id === id || hr.id.toLowerCase() === id.toLowerCase());
        };
        
        let finalHrName = hrName || '';
        let finalHrId = hrId || prev.hrId;
        
        // If we have an HR ID, always try to get the name from it
        if (finalHrId) {
          console.log('🔍 Looking up HR name for ID:', finalHrId);
          const hrPerson = findHRById(finalHrId);
          
          if (hrPerson) {
            console.log('✅ Found HR person:', hrPerson);
            finalHrName = hrPerson.name;
            finalHrId = hrPerson.id; // Use the exact ID format from constants
          } else {
            console.warn('❌ No HR person found for ID:', finalHrId);
            console.log('🔍 Available HR IDs:', HR_PERSONNEL.map(hr => hr.id));
          }
        }
        // If we have a name but no ID, try to find the ID
        else if (finalHrName && !finalHrId) {
          const hrPerson = HR_PERSONNEL.find(hr => hr.name === finalHrName);
          if (hrPerson) {
            finalHrId = hrPerson.id;
            console.log('✅ Found HR ID by name:', hrPerson);
          }
        }
        
        const newMeta = {
          ...prev,
          hrName: finalHrName,
          hrId: finalHrId,
          // Reset other fields when HR changes
          amName: finalHrId !== prev.hrId ? '' : prev.amName,
          amId: finalHrId !== prev.hrId ? '' : prev.amId,
          empName: prev.empName,
          empId: prev.empId,
          storeName: finalHrId !== prev.hrId ? '' : prev.storeName,
          storeId: finalHrId !== prev.hrId ? '' : prev.storeId
        };
        
        console.log('Updated HR meta:', newMeta);
        
        // Save to localStorage
        try { 
          localStorage.setItem('hr_meta', JSON.stringify(newMeta)); 
        } catch(e) {}
        
        return newMeta;
      });
    }
  }, []);

  // Load normalized stores from mappedStores (this includes runtime overrides)
  useEffect(() => {
    console.log('Loading stores from mappedStores/STORES_PROMISE...');
    STORES_PROMISE.then((stores: any[]) => {
      try {
        // mappedStores provides normalized entries with id, name, region, amId, hrbpId, etc.
        setAllStores(stores.map(s => ({ id: s.id, name: s.name, region: s.region, amId: s.amId, hrbpId: s.hrbpId, regionalHrId: s.regionalHrId, hrHeadId: s.hrHeadId })));
        console.log(`Loaded ${stores.length} stores from mapping (mappedStores)`);
      } catch (e) {
        console.warn('Error processing mapped stores:', e);
        setAllStores([]);
      }
    }).catch(err => {
      console.warn('Could not load mapped stores:', err);
      setAllStores([]);
    });
  }, []);

  // Filter stores by HR (HR → AM → Stores flow)
  useEffect(() => {
    const filterStoresByHR = () => {
      if (!meta.hrId || allStores.length === 0) {
        setFilteredStoresByHR([]);
        return;
      }

      try {
        console.log('Filtering stores for HR:', meta.hrId);
        console.log('Total allStores available:', allStores.length);

        // Find stores where this HR is responsible (HRBP > Regional HR > HR Head priority)
        // Case-insensitive comparison for HR IDs
        const normalizedHrId = meta.hrId.toUpperCase();
        const hrStoreIds = allStores
          .filter((s: any) => {
            const match = (s.hrbpId && s.hrbpId.toUpperCase() === normalizedHrId) || 
                         (s.regionalHrId && s.regionalHrId.toUpperCase() === normalizedHrId) || 
                         (s.hrHeadId && s.hrHeadId.toUpperCase() === normalizedHrId);
            if (match) {
              console.log('Store matched for HR:', s.id, s.name);
            }
            return match;
          })
          .map((s: any) => s.id);

        console.log('Found store IDs for HR:', hrStoreIds);

        const hrStores = allStores.filter(store => hrStoreIds.includes(store.id));
        setFilteredStoresByHR(hrStores);

        console.log('Filtered stores:', hrStores);

        // Auto-fill Area Manager based on HR
        if (hrStores.length > 0 && !meta.amId) {
          const firstStore = allStores.find((s: any) => s.id === hrStores[0].id);
          if (firstStore) {
            const amId = firstStore.amId;
            const amPerson = AREA_MANAGERS.find(am => am.id.toUpperCase() === amId?.toUpperCase());
            if (amPerson) {
              setMeta(prev => ({
                ...prev,
                amId: amPerson.id,
                amName: amPerson.name
              }));
            }
          }
        }

        console.log(`Filtered ${hrStores.length} stores for HR ${meta.hrId}`);
      } catch (error) {
        console.warn('Could not filter stores by HR:', error);
        setFilteredStoresByHR([]);
      }
    };

    filterStoresByHR();
  }, [meta.hrId, allStores]);

  // Cascading filtering: HR ID → Area Managers → Stores
  const availableAreaManagers = useMemo(() => {
    console.log('🔍 availableAreaManagers recalculating. meta.hrId:', meta.hrId, 'allStores.length:', allStores.length, 'MAPPED_STORES.length:', MAPPED_STORES.length);
    
    // No HR selected: return all AMs that the user role can access
    if (!meta.hrId) return AREA_MANAGERS.filter(am => canAccessAM(userRole, am.id));

    console.log('Filtering Area Managers for HR:', meta.hrId);

    // Senior HR roles see all AMs
    if (SENIOR_HR_ROLES.includes(meta.hrId)) {
      const allAccessibleAMs = AREA_MANAGERS.filter(am => canAccessAM(userRole, am.id));
      console.log(`HR ${meta.hrId} is a senior role with access to all Area Managers (${allAccessibleAMs.length} AMs)`);
      return allAccessibleAMs;
    }

    // SPECIAL CASE: North Region HRBPs - all North HRBPs should see ALL North AMs
    // This ensures full regional visibility for the North team
    if (NORTH_REGION_HRBPS.includes(meta.hrId)) {
      const northAMs = AREA_MANAGERS.filter(am => NORTH_REGION_AMS.includes(am.id));
      console.log(`HR ${meta.hrId} is a North HRBP with access to all ${northAMs.length} North Area Managers:`, northAMs);
      return northAMs;
    }

    // NEW: Use AM_HR_MAPPING from config if available
    if (config?.AM_HR_MAPPING) {
      console.log('📍 Using AM_HR_MAPPING from config for HR:', meta.hrId);
      console.log('📍 AM_HR_MAPPING:', config.AM_HR_MAPPING);
      const amsForThisHr: typeof AREA_MANAGERS = [];
      Object.entries(config.AM_HR_MAPPING).forEach(([amId, hrMapping]: [string, any]) => {
        // Check if this AM is mapped to the selected HR (as hrbp, hr2, or hr3)
        if (hrMapping.hrbp === meta.hrId || hrMapping.hr2 === meta.hrId || hrMapping.hr3 === meta.hrId) {
          const amPerson = AREA_MANAGERS.find(am => am.id === amId);
          console.log(`📍 Checking AM ${amId}:`, amPerson ? `Found - ${amPerson.name}` : 'Not found in AREA_MANAGERS');
          if (amPerson) {
            amsForThisHr.push(amPerson);
          }
        }
      });
      
      if (amsForThisHr.length > 0) {
        console.log(`Found ${amsForThisHr.length} AMs for HR ${meta.hrId} from AM_HR_MAPPING:`, amsForThisHr);
        return amsForThisHr;
      } else {
        console.log(`⚠️ No AMs found in AM_HR_MAPPING for HR ${meta.hrId}`);
      }
    } else {
      console.log('⚠️ config.AM_HR_MAPPING not available yet');
    }

    // Derive AM IDs from normalized mapping (allStores). Use `allStores` when
    // available; fall back to the immediate `MAPPED_STORES` export so the UI can
    // populate AMs even before async mapping loading completes.
    const hrAreaManagerIds = new Set<string>();
    const sourceStores = (allStores && allStores.length > 0) ? allStores : MAPPED_STORES || [];
    sourceStores.forEach((s: any) => {
      if (s.hrbpId === meta.hrId || s.regionalHrId === meta.hrId || s.hrHeadId === meta.hrId) {
        if (s.amId) hrAreaManagerIds.add(s.amId);
      }
    });

  // First, pick matching AM objects from AREA_MANAGERS (do not gate by current
  // user's access when HR is explicitly selected via meta.hrId — HR should be
  // able to see AMs for their region regardless of the viewer's role).
  const presentAMs = AREA_MANAGERS.filter(am => hrAreaManagerIds.has(am.id));

  // If mapping references AM IDs that are not present in `AREA_MANAGERS`, create
  // lightweight placeholders so the dropdown isn't empty. Use the ID as the
  // display name as a fallback.
  const missingIds = Array.from(hrAreaManagerIds).filter(id => !AREA_MANAGERS.some(am => am.id === id));
  const missingAMs = missingIds.map(id => ({ id, name: id } as any));

  const result = [...presentAMs, ...missingAMs];
  console.log(`Found ${result.length} Area Managers for HR ${meta.hrId}:`, result);
  console.log('Derived AM IDs from mapping for this HR:', Array.from(hrAreaManagerIds));
  console.log('Source stores used:', sourceStores.length, 'stores');
  if (missingIds && missingIds.length > 0) console.log('AM IDs referenced in mapping but missing from AREA_MANAGERS:', missingIds);
  return result;
  }, [userRole, meta.hrId, allStores, MAPPED_STORES, config, AREA_MANAGERS]);

  const availableStores = useMemo(() => {
    console.log('🏪 availableStores recalculating...');
    console.log('  meta.amId:', meta.amId);
    console.log('  meta.hrId:', meta.hrId);
    console.log('  allStores.length:', allStores.length);
    console.log('  filteredStoresByHR.length:', filteredStoresByHR.length);
    
    if (!meta.amId) {
      // No AM selected, show stores based on HR if available
      if (meta.hrId) {
        console.log(`✅ Returning ${filteredStoresByHR.length} stores filtered by HR ${meta.hrId}`);
        return filteredStoresByHR;
      }
      // Otherwise use role-based filtering for other user types
      const roleBasedStores = allStores.filter(store => canAccessStore(userRole, store.id));
      console.log(`✅ Role-based filtering: ${roleBasedStores.length} stores available`);
      return roleBasedStores;
    }
    
    console.log('🔍 Filtering Stores for Area Manager:', meta.amId);
    
    // Get stores that belong to this Area Manager using normalized mapping
    // Case-insensitive comparison for AM IDs
    const normalizedAmId = meta.amId.toUpperCase();
    const matchingStores = allStores.filter((s: any) => {
      const storeAmId = s.amId?.toUpperCase();
      const matches = storeAmId === normalizedAmId;
      if (matches) {
        console.log('  ✓ Store matched:', s.id, s.name, 'amId:', s.amId);
      }
      return matches;
    });
    
    console.log(`✅ Found ${matchingStores.length} stores for AM ${meta.amId}`);
    
    return matchingStores;
  }, [userRole, allStores, filteredStoresByHR, meta.hrId, meta.amId]);

  const availableHRPersonnel = useMemo(() => {
    return HR_PERSONNEL.filter(hr => canAccessHR(userRole, hr.id));
  }, [userRole]);

  // Filtered search results
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

  const handleMetaChange = (key: keyof SurveyMeta, value: string) => {
    setMeta(prev => {
      const next = { ...prev, [key]: value };
      
      // Auto-fill region when store is selected using normalized mapping
      if (key === 'storeId' && value) {
        try {
          const store = allStores.find(s => s.id === value);
          if (store) {
            setMeta(current => ({
              ...current,
              storeName: store.name
            }));
          }
        } catch (error) {
          console.warn('Could not auto-fill store name from mapping:', error);
        }
      }
      
      try { 
        localStorage.setItem('hr_meta', JSON.stringify(next)); 
      } catch(e) {}
      return next;
    });
  };

  const handleChange = (id: string, value: string) => {
    // Trigger strong haptic feedback for survey responses (like ChatGPT app)
    hapticFeedback.select();
    
    setResponses(prev => {
      const next = {...prev, [id]: value};
      try { 
        localStorage.setItem('hr_resp', JSON.stringify(next)); 
      } catch(e) {}
      return next;
    });
  };

  useEffect(() => {
    try { 
      localStorage.setItem('hr_resp', JSON.stringify(responses)); 
    } catch(e) {}
  }, [responses]);

  useEffect(() => {
    try { 
      localStorage.setItem('hr_meta', JSON.stringify(meta)); 
    } catch(e) {}
  }, [meta]);

  // Auto-fill Area Manager when store is selected
  useEffect(() => {
    if (meta.storeId && allStores.length > 0) {
      const selectedStore = allStores.find((s: any) => s.id === meta.storeId);
      if (selectedStore && selectedStore.amId) {
        const amPerson = AREA_MANAGERS.find(am => am.id.toUpperCase() === selectedStore.amId.toUpperCase());
        if (amPerson && amPerson.id !== meta.amId) {
          console.log('Auto-filling AM from store:', amPerson.name, amPerson.id);
          setMeta(prev => ({
            ...prev,
            amId: amPerson.id,
            amName: amPerson.name
          }));
        }
      }
    }
  }, [meta.storeId, allStores, AREA_MANAGERS]);

  // Auto-fill HR when Area Manager is selected (using AM_HR_MAPPING from config)
  useEffect(() => {
    if (meta.amId && config?.AM_HR_MAPPING && !meta.hrId) {
      const hrMapping = config.AM_HR_MAPPING[meta.amId];
      if (hrMapping && hrMapping.hrbp) {
        const hrPerson = HR_PERSONNEL.find(hr => hr.id === hrMapping.hrbp);
        if (hrPerson) {
          console.log('Auto-filling HR from AM mapping:', hrPerson.name, hrPerson.id);
          setMeta(prev => ({
            ...prev,
            hrId: hrPerson.id,
            hrName: hrPerson.name
          }));
        }
      }
    }
  }, [meta.amId, config?.AM_HR_MAPPING, HR_PERSONNEL]);

  const validate = () => {
    for(const q of QUESTIONS){
      if((q.type === 'radio' || q.type === 'scale') && (responses[q.id] == null || responses[q.id] === '')) {
        return {ok: false, missing: q.id};
      }
    }
    return {ok: true};
  };

  const computeScore = () => {
    let total = 0, max = 0;
    for(const q of QUESTIONS){
      if(q.choices){
        const choice = q.choices.find(c => c.label === responses[q.id]);
        if(choice){
          total += choice.score;
          max += Math.max(...q.choices.map(c => c.score));
        }
      }
    }
    return { total, max, percent: max ? Math.round((total/max)*100) : 0 };
  };

  const handleReset = () => {
    localStorage.removeItem('hr_resp');
    // Preserve HR name and ID when resetting the form
    const newMeta = {
      hrName: meta.hrName, // Keep existing HR name
      hrId: meta.hrId,     // Keep existing HR ID
      amName: '', amId: '', empName: '', empId: '', storeName: '', storeId: ''
    };
    try { 
      localStorage.setItem('hr_meta', JSON.stringify(newMeta)); 
    } catch(e) {}
    setResponses({});
    setMeta(newMeta);
    setSubmitted(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if(!validation.ok){
      const el = document.querySelector(`[name="${validation.missing}"]`);
      if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
      alert('Please answer all required questions.');
      hapticFeedback.error();
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Log data to Google Sheets
      await logDataToGoogleSheets();
      
      alert('Survey submitted successfully!');
      hapticFeedback.ultraStrong(); // Ultra-strong success feedback
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting survey. Please try again.');
      hapticFeedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  const logDataToGoogleSheets = async () => {
    const score = computeScore();
    
    // Detect region based on the selected store ID only from hr_mapping.json
    let detectedRegion = '';
    try {
      // Only try to find region by store ID using normalized mapping
      if (meta.storeId) {
        const storeMapping = allStores.find((s: any) => s.id === meta.storeId);
        if (storeMapping) {
          detectedRegion = storeMapping.region || '';
        }
      }
      
    } catch (error) {
      console.warn('Could not load HR mapping data for region detection:', error);
    }
    
    const params = {
      submissionTime: new Date().toLocaleString('en-GB', {hour12: false}),
      hrName: meta.hrName || '',
      hrId: meta.hrId || '',
      amName: meta.amName || '',
      amId: meta.amId || '',
      empName: meta.empName || '',
      empId: meta.empId || '',
      storeName: meta.storeName || '',
      storeID: meta.storeId || '',
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
      totalScore: score.total || '',
      maxScore: score.max || '',
      percent: score.percent || ''
    };

    const body = Object.keys(params).map(k => 
      encodeURIComponent(k) + '=' + encodeURIComponent((params as any)[k])
    ).join('&');

    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body
      });
      console.log('Data successfully logged to Google Sheets');
    } catch (error) {
      console.error('Error logging data to Google Sheets:', error);
    }
  };

  const score = computeScore();

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Survey Details Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <div className="font-bold text-gray-900 dark:text-slate-100 mb-4 text-lg">Survey Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-700 dark:text-slate-300">
                HR Name 
                {meta.hrName && <span className="text-green-600 dark:text-green-400 text-xs">(Auto-filled from URL)</span>}
              </span>
              {meta.hrName ? (
                <input 
                  className="p-3 border border-gray-300 dark:border-slate-600 rounded bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-slate-200" 
                  value={meta.hrName} 
                  readOnly 
                  title="Auto-filled from URL parameters"
                />
              ) : (
                <select
                  className="p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  value={meta.hrName || ''}
                  onChange={e => {
                    const selected = availableHRPersonnel.find(hr => hr.name === e.target.value);
                    // Reset AM and Store when HR changes
                    setMeta(prev => ({
                      ...prev,
                      hrName: selected ? selected.name : '',
                      hrId: selected ? selected.id : '',
                      amName: '', // Reset AM when HR changes
                      amId: '',   // Reset AM ID when HR changes
                      storeName: '', // Reset store when HR changes
                      storeId: ''    // Reset store ID when HR changes
                    }));
                  }}
                >
                  <option value="">Select HR Personnel</option>
                  {availableHRPersonnel.map(hr => (
                    <option key={hr.id} value={hr.name}>{hr.name}</option>
                  ))}
                </select>
              )}
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-700 dark:text-slate-300">
                HR ID
                {meta.hrId && <span className="text-green-600 dark:text-green-400 text-xs">(Auto-filled)</span>}
              </span>
              <input 
                className="p-3 border border-gray-300 dark:border-slate-600 rounded bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-slate-200" 
                value={meta.hrId || ''} 
                readOnly 
                title={meta.hrId ? "Auto-filled from URL parameters or HR selection" : "Will be filled when HR is selected"}
              />
            </label>
            <label className="flex flex-col text-sm relative">
              <span className="mb-1 text-gray-700 dark:text-slate-300">
                Area Manager Name
                {!meta.hrId && <span className="text-amber-600 dark:text-amber-400 text-xs"> (Select HR first)</span>}
                {meta.hrId && availableAreaManagers.length === 0 && <span className="text-red-600 dark:text-red-400 text-xs"> (No AMs available for this HR)</span>}
              </span>
              <div className="relative">
                <input
                  className={`pl-3 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-slate-100 w-full focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none ${
                    !meta.hrId || availableAreaManagers.length === 0 
                      ? 'bg-gray-100 dark:bg-slate-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-700'
                  }`}
                  value={showAmDropdown ? amSearchTerm : (meta.amName || '')}
                  disabled={!meta.hrId || availableAreaManagers.length === 0}
                  placeholder={!meta.hrId ? 'Select HR first' : 'Search Area Manager...'}
                  onFocus={() => {
                    if (meta.hrId && availableAreaManagers.length > 0) {
                      setShowAmDropdown(true);
                      setAmSearchTerm(meta.amName || '');
                      setSelectedAmIndex(-1);
                    }
                  }}
                  onChange={e => {
                    setAmSearchTerm(e.target.value);
                    setShowAmDropdown(true);
                  }}
                  onKeyDown={e => {
                    if (!showAmDropdown) return;
                    
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedAmIndex(prev => 
                        prev < filteredAreaManagers.length - 1 ? prev + 1 : 0
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedAmIndex(prev => 
                        prev > 0 ? prev - 1 : filteredAreaManagers.length - 1
                      );
                    } else if (e.key === 'Enter' && selectedAmIndex >= 0) {
                      e.preventDefault();
                      const selected = filteredAreaManagers[selectedAmIndex];
                      setMeta(prev => ({
                        ...prev,
                        amName: selected.name,
                        amId: selected.id,
                        storeName: '',
                        storeId: ''
                      }));
                      setAmSearchTerm('');
                      setShowAmDropdown(false);
                      setSelectedAmIndex(-1);
                    } else if (e.key === 'Escape') {
                      setShowAmDropdown(false);
                      setSelectedAmIndex(-1);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding dropdown to allow selection
                    setTimeout(() => {
                      setShowAmDropdown(false);
                      setSelectedAmIndex(-1);
                    }, 200);
                  }}
                />
                {meta.amName && !showAmDropdown && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setMeta(prev => ({
                        ...prev,
                        amName: '',
                        amId: '',
                        storeName: '',
                        storeId: ''
                      }));
                    }}
                  >
                    ✕
                  </button>
                )}
                {showAmDropdown && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                )}
                {showAmDropdown && meta.hrId && availableAreaManagers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredAreaManagers.length === 0 ? (
                      <div className="p-3 text-gray-500 dark:text-slate-400">No matching Area Managers found</div>
                    ) : (
                      filteredAreaManagers.map((am, index) => (
                        <div
                          key={am.id}
                          className={`p-3 cursor-pointer border-b border-gray-100 dark:border-slate-600 last:border-b-0 ${
                            index === selectedAmIndex 
                              ? 'bg-sky-100 dark:bg-sky-900' 
                              : 'hover:bg-gray-100 dark:hover:bg-slate-600'
                          }`}
                          onMouseDown={() => {
                            // Reset store selection when AM changes
                            setMeta(prev => ({
                              ...prev,
                              amName: am.name,
                              amId: am.id,
                              storeName: '', // Reset store when AM changes
                              storeId: ''    // Reset store ID when AM changes
                            }));
                            setAmSearchTerm('');
                            setShowAmDropdown(false);
                            setSelectedAmIndex(-1);
                          }}
                          onMouseEnter={() => setSelectedAmIndex(index)}
                        >
                          <div className="font-medium text-gray-900 dark:text-slate-100">{am.name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{am.id}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-700 dark:text-slate-300">Area Manager ID</span>
              <input 
                className="p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200" 
                value={meta.amId || ''} 
                readOnly 
              />
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-700 dark:text-slate-300">Employee Name</span>
              <input 
                className="p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none" 
                value={meta.empName} 
                onChange={e => handleMetaChange('empName', e.target.value)} 
              />
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-700 dark:text-slate-300">Employee ID</span>
              <input 
                className="p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none" 
                value={meta.empId} 
                onChange={e => handleMetaChange('empId', e.target.value)} 
              />
            </label>
            <label className="flex flex-col text-sm relative">
              <span className="mb-1 text-gray-700 dark:text-slate-300">
                Store Name
                {!meta.amId && meta.hrId && <span className="text-amber-600 dark:text-amber-400 text-xs"> (Select Area Manager first)</span>}
                {!meta.hrId && <span className="text-amber-600 dark:text-amber-400 text-xs"> (Select HR first)</span>}
                {meta.amId && availableStores.length === 0 && <span className="text-red-600 dark:text-red-400 text-xs"> (No stores available for this AM - HR: {meta.hrId}, AM: {meta.amId}, Total: {allStores.length})</span>}
                {meta.amId && availableStores.length > 0 && <span className="text-green-600 dark:text-green-400 text-xs"> ({availableStores.length} stores available)</span>}
              </span>
              <div className="relative">
                <input
                  className={`pl-3 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-slate-100 w-full focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none ${
                    availableStores.length === 0 
                      ? 'bg-gray-100 dark:bg-slate-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-700'
                  }`}
                  value={showStoreDropdown ? storeSearchTerm : (meta.storeName || '')}
                  disabled={availableStores.length === 0}
                  placeholder={!meta.hrId ? 'Select HR first' : !meta.amId ? 'Select Area Manager first' : 'Search Store...'}
                  onFocus={() => {
                    if (availableStores.length > 0) {
                      setShowStoreDropdown(true);
                      setStoreSearchTerm(meta.storeName || '');
                      setSelectedStoreIndex(-1);
                    }
                  }}
                  onChange={e => {
                    setStoreSearchTerm(e.target.value);
                    setShowStoreDropdown(true);
                  }}
                  onKeyDown={e => {
                    if (!showStoreDropdown) return;
                    
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedStoreIndex(prev => 
                        prev < filteredStores.length - 1 ? prev + 1 : 0
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedStoreIndex(prev => 
                        prev > 0 ? prev - 1 : filteredStores.length - 1
                      );
                    } else if (e.key === 'Enter' && selectedStoreIndex >= 0) {
                      e.preventDefault();
                      const selected = filteredStores[selectedStoreIndex];
                      handleMetaChange('storeName', selected.name);
                      handleMetaChange('storeId', selected.id);
                      setStoreSearchTerm('');
                      setShowStoreDropdown(false);
                      setSelectedStoreIndex(-1);
                    } else if (e.key === 'Escape') {
                      setShowStoreDropdown(false);
                      setSelectedStoreIndex(-1);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding dropdown to allow selection
                    setTimeout(() => {
                      setShowStoreDropdown(false);
                      setSelectedStoreIndex(-1);
                    }, 200);
                  }}
                />
                {meta.storeName && !showStoreDropdown && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setMeta(prev => ({
                        ...prev,
                        storeName: '',
                        storeId: ''
                      }));
                    }}
                  >
                    ✕
                  </button>
                )}
                {showStoreDropdown && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                )}
                {showStoreDropdown && availableStores.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredStores.length === 0 ? (
                      <div className="p-3 text-gray-500 dark:text-slate-400">No matching stores found</div>
                    ) : (
                      filteredStores.map((store, index) => (
                        <div
                          key={store.id}
                          className={`p-3 cursor-pointer border-b border-gray-100 dark:border-slate-600 last:border-b-0 ${
                            index === selectedStoreIndex 
                              ? 'bg-sky-100 dark:bg-sky-900' 
                              : 'hover:bg-gray-100 dark:hover:bg-slate-600'
                          }`}
                          onMouseDown={() => {
                            handleMetaChange('storeName', store.name);
                            handleMetaChange('storeId', store.id);
                            setStoreSearchTerm('');
                            setShowStoreDropdown(false);
                            setSelectedStoreIndex(-1);
                          }}
                          onMouseEnter={() => setSelectedStoreIndex(index)}
                        >
                          <div className="font-medium text-gray-900 dark:text-slate-100">{store.name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{store.id}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </label>
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-gray-700 dark:text-slate-300">Store ID</span>
              <input 
                className="p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200" 
                value={meta.storeId} 
                readOnly 
              />
            </label>
          </div>
        </div>

        {/* Questions */}
        {QUESTIONS.map(q => (
          <div key={q.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="font-bold text-gray-900 dark:text-slate-100 mb-4">{q.title}</div>
            
            {q.type === 'radio' && (
              <>
                <div className="flex flex-col gap-3">
                  {q.choices?.map((c: Choice, idx: number) => (
                    <label key={idx} className="inline-flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={q.id}
                        value={c.label}
                        checked={responses[q.id] === c.label}
                        onChange={e => handleChange(q.id, e.target.value)}
                        className="w-4 h-4 text-sky-500 dark:text-sky-400 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-sky-500 dark:focus:ring-sky-400"
                      />
                      <span className="text-gray-900 dark:text-slate-200">{c.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
                    placeholder="Add remarks for this question (optional)"
                    rows={2}
                    value={responses[q.id + '_remarks'] || ''}
                    onChange={e => handleChange(q.id + '_remarks', e.target.value)}
                  />
                </div>
              </>
            )}
            
            {q.type === 'scale' && (
              <>
                <div className="flex gap-6">
                  {q.choices?.map((c: Choice, idx: number) => (
                    <label key={idx} className="flex flex-col items-center cursor-pointer">
                      <input
                        type="radio"
                        name={q.id}
                        value={c.label}
                        checked={responses[q.id] === c.label}
                        onChange={e => handleChange(q.id, e.target.value)}
                        className="w-4 h-4 text-sky-500 dark:text-sky-400 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-sky-500 dark:focus:ring-sky-400 mb-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-slate-300">{c.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
                    placeholder="Add remarks for this question (optional)"
                    rows={2}
                    value={responses[q.id + '_remarks'] || ''}
                    onChange={e => handleChange(q.id + '_remarks', e.target.value)}
                  />
                </div>
              </>
            )}
            
            {q.type === 'input' && (
              <>
                <input
                  className="w-full mt-2 p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
                  type="text"
                  value={responses[q.id] || ''}
                  onChange={e => handleChange(q.id, e.target.value)}
                />
                <div className="mt-4">
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
                    placeholder="Add remarks for this question (optional)"
                    rows={2}
                    value={responses[q.id + '_remarks'] || ''}
                    onChange={e => handleChange(q.id + '_remarks', e.target.value)}
                  />
                </div>
              </>
            )}
            
            {q.type === 'textarea' && (
              <textarea
                className="w-full mt-2 p-3 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none"
                rows={4}
                value={responses[q.id] || ''}
                onChange={e => handleChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        {/* Submit Section */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            All radio/scale questions are required.
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
              onClick={handleReset}
              title="Clear all form data and responses"
            >
              Reset Form
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors duration-200"
            >
              Submit
            </button>
          </div>
        </div>
      </form>

      {/* Submission Summary */}
      {submitted && (
        <div className="mt-6 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 text-xl mb-4">Submission Summary</h2>
          
          {/* Score Bar */}
          <div className="mb-6">
            <div className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">
              Score: {score.total} / {score.max} ({score.percent}%)
            </div>
            <div className="relative w-full h-6 bg-gray-200 dark:bg-slate-700 rounded">
              <div 
                className="absolute left-0 top-0 h-full rounded transition-all duration-300"
                style={{
                  width: `${score.percent}%`,
                  background: score.percent <= 50 
                    ? `linear-gradient(90deg, #ef4444 0%, #eab308 100%)`
                    : `linear-gradient(90deg, #eab308 0%, #22c55e 100%)`
                }}
              ></div>
              <div className="absolute right-2 top-0 h-full flex items-center">
                <span className="text-sm font-bold text-white dark:text-slate-100">{score.percent}%</span>
              </div>
            </div>
          </div>

          {/* Answers Summary */}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-3">Answers</h3>
            <ul className="list-disc ml-5 space-y-2">
              {QUESTIONS.map(q => (
                <li key={q.id} className="text-gray-700 dark:text-slate-300">
                  <strong className="text-gray-900 dark:text-slate-200">{q.title}</strong>: {responses[q.id] || '-'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} message="Submitting survey..." />
    </div>
  );
};

export default Survey;
