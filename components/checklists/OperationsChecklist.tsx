import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, canAccessStore, canAccessAM, canAccessHR } from '../../roleMapping';
import { AREA_MANAGERS as DEFAULT_AREA_MANAGERS, HR_PERSONNEL as DEFAULT_HR_PERSONNEL, SENIOR_HR_ROLES } from '../../constants';
import { Store } from '../../types';
import { hapticFeedback } from '../../utils/haptics';
import compStoreMapping from '../../src/comprehensive_store_mapping.json';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';

// Google Sheets endpoint for logging AM Operations data - UPDATED URL
const AM_OPS_LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw_Q9JD-4ys1qElIM4-DYFwwOUzVmPs-LYsYmP9lWqsp3ExJr5tnt-RYEJxYTi5SEjJ6w/exec';

interface ChecklistMeta {
  hrName: string;
  hrId: string;
  amName: string;
  amId: string;
  trainerName: string;
  trainerId: string;
  storeName: string;
  storeId: string;
  bscAchievement: string;
  peopleOnShift: string;
  manpowerFulfilment: string;
  cafeType: string;
  storeType: string;
  concept: string;
}

interface OperationsChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
}

interface ChecklistItem {
  id: string;
  q: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

const SECTIONS: ChecklistSection[] = [
  { 
    id: 'CG', 
    title: 'Cheerful Greeting', 
    items: [
      {id:'CG_1', q:'Is the store front area clean and maintained?'},
      {id:'CG_2', q:'Is the signage clean and are all lights functioning?'},
      {id:'CG_3', q:'Are the glass and doors smudge-free?'},
      {id:'CG_4', q:'Do promotional displays reflect current offers?'},
      {id:'CG_5', q:'Are POS tent cards as per the latest communication?'},
      {id:'CG_6', q:'Are menu boards/DMB as per the latest communication?'},
      {id:'CG_7', q:'Does the café have a welcoming environment (music, lighting, AC, aroma)?'},
      {id:'CG_8', q:'Are washrooms cleaned and the checklist updated?'},
      {id:'CG_9', q:'Is the FDU counter neat, fully stocked, and set as per the planogram?'},
      {id:'CG_10', q:'Does the merch rack follow VM guidelines and attract attention?'},
      {id:'CG_11', q:'Is staff grooming (uniform, jewellery, hair and makeup) as per standards?'},
      {id:'CG_12', q:'Are all seating, furniture, and stations tidy and organized?'},
      {id:'CG_13', q:'Is the engine area clean and ready for operations?'}
    ]
  },
  { 
    id: 'OTA', 
    title: 'Order Taking Assistance', 
    items: [
      {id:'OTA_1', q:'Is suggestive selling happening at the POS?'},
      {id:'OTA_2', q:'Is the POS partner updated on the latest promos and item availability?'},
      {id:'OTA_3', q:'Has order-taking time been recorded for 5 customers?'},
      {id:'OTA_4', q:'Is there sufficient cash and change at the POS?'},
      {id:'OTA_5', q:'Are valid licenses displayed and expiries checked (medical reports)?'},
      {id:'OTA_6', q:'Are cash audits completed and verified with the logbook?'},
      {id:'OTA_7', q:'Are daily banking reports tallied?'},
      {id:'OTA_8', q:'Has CPI been reviewed through the FAME pilot?'},
      {id:'OTA_9', q:'Are Swiggy/Zomato metrics (RDC, MFR, visibility) reviewed, and are Food Lock on LS and stock control on UrbanPiper managed per stock availability/opening inventory?'},
      {id:'OTA_10', q:'Are all food and drinks served as per SOP?'},
      {id:'OTA_11', q:'Are food orders placed based on the 4-week sales trend?'}
    ]
  },
  { 
    id: 'FAS', 
    title: 'Friendly & Accurate Service', 
    items: [
      {id:'FAS_1', q:'Is equipment cleaned and maintained?'},
      {id:'FAS_2', q:'Are temperature checks done with the Therma Pen and logs updated?'},
      {id:'FAS_3', q:'Is documentation (GRN, RSTN, STN & TO) completed?'},
      {id:'FAS_4', q:'Is fast-moving SKU availability checked and validated with LS?'},
      {id:'FAS_5', q:'Is the thawing chart validated against actual thawing?'},
      {id:'FAS_6', q:'Are deployment roles clear, with coaching and appreciation done by the MOD?'},
      {id:'FAS_7', q:'Are there no broken/unused tools stored in the store?'},
      {id:'FAS_8', q:'Is garbage segregated properly (wet/dry)?'},
      {id:'FAS_9', q:'Are LTO products served as per standards?'},
      {id:'FAS_10', q:'Is the coffee and food dial-in process followed?'},
      {id:'FAS_11', q:'Are R.O.A.S.T. and app orders executed accurately?'},
      {id:'FAS_12', q:'Have 5 order service times been validated?'},
      {id:'FAS_13', q:'Have open maintenance-related points been reviewed?'}
    ]
  },
  { 
    id: 'FWS', 
    title: 'Feedback with Solution', 
    items: [
      {id:'FWS_1', q:'Has COGS been reviewed, with actions in place per last month P&L feedback?'},
      {id:'FWS_2', q:'Have BSC targets vs achievements been reviewed?'},
      {id:'FWS_3', q:'Has people budget vs actuals (labour cost/bench planning) been reviewed?'},
      {id:'FWS_4', q:'Has variance in stock (physical vs system) been verified?'},
      {id:'FWS_5', q:'Have the top 10 wastage items been reviewed?'},
      {id:'FWS_6', q:'Have store utilities (units, chemical use) been reviewed?'},
      {id:'FWS_7', q:'Have shift targets, briefings, and goal tracking been conducted?'},
      {id:'FWS_8', q:'Have new staff training and bench plans been reviewed?'},
      {id:'FWS_9', q:'Have Training and QA audits been reviewed?'},
      {id:'FWS_10', q:'Has the duty roster (off/coff, ELCL, tenure) been checked and attendance ensured as per ZingHR?'},
      {id:'FWS_11', q:'Have temperature and thawing logs been validated?'},
      {id:'FWS_12', q:'Have audit and data findings been cross-checked with store observations?'},
      {id:'FWS_13', q:'Is the pest control layout updated?'}
    ]
  },
  { 
    id: 'ENJ', 
    title: 'Enjoyable Experience', 
    items: [
      {id:'ENJ_1', q:'Have 2 new and 2 repeat customers been engaged, with feedback documented?'},
      {id:'ENJ_2', q:'Are seating and stations adjusted as per customer requirements?'},
      {id:'ENJ_3', q:'Is the team proactively assisting customers?'},
      {id:'ENJ_4', q:'Is CCTV checked to monitor customer service during peak hours?'},
      {id:'ENJ_5', q:'Is CCTV backup (minimum 60 days) in place and are black spots checked?'},
      {id:'ENJ_6', q:'Is opening/closing footage reviewed for correct practices?'},
      {id:'ENJ_7', q:'Are there no personal items/clutter in guest areas, with belongings kept in lockers/designated places?'}
    ]
  },
  { 
    id: 'EX', 
    title: 'Enthusiastic Exit', 
    items: [
      {id:'EX_1', q:'Are there no unresolved issues at exits?'},
      {id:'EX_2', q:'Is the final interaction cheerful and courteous?'},
      {id:'EX_3', q:'Has a consolidated action plan been created with the Store Manager?'},
      {id:'EX_4', q:'Have top performers been recognized?'},
      {id:'EX_5', q:'Have wins been celebrated and improvement areas communicated?'},
      {id:'EX_6', q:'Has the team been motivated for ongoing improvement?'}
    ]
  }
];

const OperationsChecklist: React.FC<OperationsChecklistProps> = ({ userRole, onStatsUpdate }) => {
  const { config, loading: configLoading } = useConfig();
  const AREA_MANAGERS = config?.AREA_MANAGERS || DEFAULT_AREA_MANAGERS;
  const HR_PERSONNEL = config?.HR_PERSONNEL || DEFAULT_HR_PERSONNEL;
  
  // Use config data if available, otherwise fall back to hardcoded SECTIONS
  const sections = config?.CHECKLISTS?.OPERATIONS || SECTIONS;
  
  const [responses, setResponses] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('operations_checklist_responses') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [metadata, setMetadata] = useState<ChecklistMeta>(() => {
    let stored = {};
    try { 
      stored = JSON.parse(localStorage.getItem('operations_checklist_metadata') || '{}'); 
    } catch(e) {}
    
    const urlParams = new URLSearchParams(window.location.search);
    const amId = urlParams.get('amId') || urlParams.get('am_id') || urlParams.get('r') || (stored as any).amId || '';
    const amName = urlParams.get('amName') || urlParams.get('am_name') || (stored as any).amName || '';
    
    const findAMById = (id: string) => {
      if (!id) return null;
      return AREA_MANAGERS.find(am => am.id === id || am.id.toLowerCase() === id.toLowerCase());
    };
    
    let finalAmName = amName;
    let finalAmId = amId;
    
    if (amId) {
      const amPerson = findAMById(amId);
      if (amPerson) {
        finalAmName = amPerson.name;
        finalAmId = amPerson.id;
      }
    } else if (amName && !amId) {
      const amPerson = AREA_MANAGERS.find(am => am.name === amName);
      if (amPerson) {
        finalAmId = amPerson.id;
      }
    }
    
    return {
      hrName: (stored as any).hrName || '',
      hrId: (stored as any).hrId || '',
      amName: finalAmName,
      amId: finalAmId,
      trainerName: (stored as any).trainerName || '',
      trainerId: (stored as any).trainerId || '',
      storeName: (stored as any).storeName || '',
      storeId: (stored as any).storeId || '',
      bscAchievement: (stored as any).bscAchievement || '',
      peopleOnShift: (stored as any).peopleOnShift || '',
      manpowerFulfilment: (stored as any).manpowerFulfilment || '',
      cafeType: (stored as any).cafeType || '',
      storeType: (stored as any).storeType || '',
      concept: (stored as any).concept || ''
    };
  });

  const { employeeData, userRole: authUserRole } = useAuth();

  const [sectionRemarks, setSectionRemarks] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('operations_section_remarks') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [sectionImages, setSectionImages] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('operations_section_images') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Autofill AM fields when user role is operations
  useEffect(() => {
    if (authUserRole === 'operations' && employeeData && !metadata.amId) {
      setMetadata(prev => ({
        ...prev,
        amId: employeeData.code,
        amName: employeeData.name
      }));
    }
  }, [authUserRole, employeeData]);

  // Search state for dropdowns
  const [hrSearchTerm, setHrSearchTerm] = useState('');
  const [amSearchTerm, setAmSearchTerm] = useState('');
  const [trainerSearchTerm, setTrainerSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showHrDropdown, setShowHrDropdown] = useState(false);
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  
  // Submission state
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Save responses to localStorage and update stats
  useEffect(() => {
    try {
      localStorage.setItem('operations_checklist_responses', JSON.stringify(responses));
    } catch (e) {}

    const { score, maxScore, percentage } = calculateScore();
    const totalQuestions = sections.reduce((acc, section) => acc + section.items.length, 0);
    const completedQuestions = Object.keys(responses).filter(key => responses[key] && responses[key] !== '').length;

    onStatsUpdate({
      completed: completedQuestions,
      total: totalQuestions,
      score: percentage
    });
  }, [responses, onStatsUpdate]);

  // Initialize search terms from metadata
  useEffect(() => {
    setHrSearchTerm(metadata.hrName);
    setAmSearchTerm(metadata.amName);
    setTrainerSearchTerm(metadata.trainerName);
    setStoreSearchTerm(metadata.storeName);
  }, []);

  // Trainer name overrides from comprehensive mapping
  const trainerNameOverrides: Record<string, string> = {
    H1761: 'Mahadev',
    H701: 'Mallika',
    H1697: 'Sheldon',
    H2595: 'Kailash',
    H3595: 'Bhawna',
    H3252: 'Priyanka',
    H1278: 'Viraj',
    H3247: 'Sunil'
  };

  // Build unique trainers list from comprehensive store mapping - ULTIMATE SOURCE OF TRUTH
  const uniqueTrainers = useMemo(() => {
    const ids = Array.from(new Set((compStoreMapping as any[]).map((r: any) => r.Trainer).filter(Boolean)));
    const trainers = ids.map((id: string) => ({
      id,
      name: trainerNameOverrides[id] || id
    }));
    return trainers.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }, []);

  // Extract stores from comprehensive store mapping as ULTIMATE SOURCE OF TRUTH
  const uniqueStores = useMemo(() => {
    const stores = (compStoreMapping as any[]).map((row: any) => ({
      name: row['Store Name'],
      id: row['Store ID'],
      menu: row['Menu'],
      storeType: row['Store Type'],
      concept: row['Concept']
    }));
    return stores
      .filter(store => store.name && store.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Auto-populate fields when store is selected
  useEffect(() => {
    if (metadata.storeId) {
      const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();
      const storeIdNorm = normalizeId(metadata.storeId);
      
      // Find store in comprehensive mapping
      const storeData = (compStoreMapping as any[]).find((row: any) => 
        normalizeId(row['Store ID']) === storeIdNorm
      );
      
      if (storeData) {
        // Auto-populate cafeType (Menu), storeType, and concept
        setMetadata(prev => ({
          ...prev,
          cafeType: storeData['Menu'] || prev.cafeType,
          storeType: storeData['Store Type'] || prev.storeType,
          concept: storeData['Concept'] || prev.concept
        }));
      }
    }
  }, [metadata.storeId]);

  // Normalize ID helper
  const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();

  // Filtering functions using comprehensive store mapping as ULTIMATE SOURCE OF TRUTH
  
  // 1. Area Managers filtered by selected trainer (if any)
  const filteredAM = AREA_MANAGERS.filter(am => {
    // First apply search filter
    const matchesSearch = amSearchTerm === '' || 
      (am.name as string).toLowerCase().includes(amSearchTerm.toLowerCase()) ||
      (am.id as string).toLowerCase().includes(amSearchTerm.toLowerCase());

    // If no trainer is selected, show all AMs that match search
    if (!metadata.trainerId) return matchesSearch;

    // If trainer is selected, use comprehensive mapping to find AMs for that trainer
    try {
      const trainerIdNorm = normalizeId(metadata.trainerId);
      const amsForTrainer = Array.from(new Set((compStoreMapping as any[])
        .filter((r: any) => normalizeId(r.Trainer) === trainerIdNorm)
        .map((r: any) => normalizeId(r.AM))
        .filter(Boolean)));
      return matchesSearch && amsForTrainer.includes(normalizeId(am.id));
    } catch (e) {
      // If error, only show AMs that match search
      return matchesSearch;
    }
  });

  // 2. Trainers - filtered by selected AM (if any)
  const filteredTrainers = () => {
    return uniqueTrainers.filter(trainer => {
      // First apply search filter
      const matchesSearch = trainerSearchTerm === '' || 
        (trainer.name as string).toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
        (trainer.id as string).toLowerCase().includes(trainerSearchTerm.toLowerCase());

      // If no AM is selected, show all trainers that match search
      if (!metadata.amId) return matchesSearch;

      // If AM is selected, use comprehensive mapping to find trainers for that AM
      try {
        const amIdNorm = normalizeId(metadata.amId);
        const trainersForAM = Array.from(new Set((compStoreMapping as any[])
          .filter((r: any) => normalizeId(r.AM) === amIdNorm)
          .map((r: any) => normalizeId(r.Trainer))
          .filter(Boolean)));
        return matchesSearch && trainersForAM.includes(normalizeId(trainer.id));
      } catch (e) {
        // If error, show all trainers that match search
        return matchesSearch;
      }
    });
  };

  // 3. Stores filtered by selected Area Manager (if any)
  const getStoresForAM = () => {
    return uniqueStores.filter(store => {
      // First apply search filter
      const matchesSearch = storeSearchTerm === '' || 
        (store.name as string).toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
        (store.id as string).toLowerCase().includes(storeSearchTerm.toLowerCase());

      // If no AM is selected, show all stores that match search
      if (!metadata.amId) return matchesSearch;

      // If AM is selected, use comprehensive mapping to find stores for that AM
      try {
        const amIdNorm = normalizeId(metadata.amId);
        const storesForAM = Array.from(new Set((compStoreMapping as any[])
          .filter((r: any) => normalizeId(r.AM) === amIdNorm)
          .map((r: any) => normalizeId(r['Store ID']))
          .filter(Boolean)));
        return matchesSearch && storesForAM.includes(normalizeId(store.id));
      } catch (e) {
        // If error, show all stores that match search
        return matchesSearch;
      }
    });
  };

  // 4. HR filtered by selected AM (if any)
  const filteredHR = HR_PERSONNEL.filter(hr => {
    const matchesSearch = hr.name.toLowerCase().includes(hrSearchTerm.toLowerCase());
    
    // If no AM is selected, show all HR
    if (!metadata.amId) return matchesSearch;
    
    // Filter HR based on selected AM using comprehensive mapping
    try {
      const amIdNorm = normalizeId(metadata.amId);
      const hrbpsForAM = Array.from(new Set((compStoreMapping as any[])
        .filter((r: any) => normalizeId(r.AM) === amIdNorm)
        .map((r: any) => normalizeId(r.HRBP))
        .filter(Boolean)));
      return matchesSearch && hrbpsForAM.includes(normalizeId(hr.id));
    } catch (e) {
      // If error, show all HR that match search
      return matchesSearch;
    }
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowHrDropdown(false);
      setShowAmDropdown(false);
      setShowTrainerDropdown(false);
      setShowStoreDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('operations_checklist_metadata', JSON.stringify(metadata));
    } catch (e) {}
  }, [metadata]);

  useEffect(() => {
    try {
      localStorage.setItem('operations_section_remarks', JSON.stringify(sectionRemarks));
    } catch (e) {}
  }, [sectionRemarks]);

  useEffect(() => {
    try {
      localStorage.setItem('operations_section_images', JSON.stringify(sectionImages));
    } catch (e) {}
  }, [sectionImages]);

  const handleResponse = (questionKey: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionKey]: value }));
    hapticFeedback.select();
  };

  const handleSectionRemarks = (sectionId: string, value: string) => {
    setSectionRemarks(prev => ({ ...prev, [sectionId]: value }));
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    const totalQuestions = sections.reduce((acc, section) => acc + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key => responses[key] && responses[key] !== '').length;
    
    if (answeredQuestions < totalQuestions) {
      alert(`Please answer all questions. You have answered ${answeredQuestions} out of ${totalQuestions} questions.`);
      return;
    }

    // Validate required metadata fields
    const requiredFields = ['hrName', 'hrId', 'amName', 'amId', 'trainerName', 'storeName', 'storeId', 'bscAchievement', 'peopleOnShift', 'manpowerFulfilment', 'cafeType', 'storeType', 'concept'];
    const missingFields = requiredFields.filter(field => !metadata[field as keyof ChecklistMeta] || metadata[field as keyof ChecklistMeta].trim() === '');
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      // Calculate scores
      const { score, maxScore, percentage } = calculateScore();
      
      // Detect region from comprehensive store mapping - ULTIMATE SOURCE OF TRUTH
      let detectedRegion = '';
      try {
        if (metadata.storeId) {
          const storeIdNorm = normalizeId(metadata.storeId);
          
          // Find in comprehensive mapping
          const storeMapping = (compStoreMapping as any[]).find((row: any) => 
            normalizeId(row['Store ID']) === storeIdNorm
          );
          
          if (storeMapping) {
            detectedRegion = storeMapping['Region'] || '';
            console.log(`✅ Store mapped from comprehensive_store_mapping.json: ${metadata.storeId} (${metadata.storeName}) → Region: ${detectedRegion}`);
          } else {
            console.warn(`❌ No mapping found in comprehensive_store_mapping.json for store ${metadata.storeId} (${metadata.storeName})`);
          }
        } else {
          console.warn(`❌ No store ID provided for region detection`);
        }
      } catch (error) {
        console.warn('Could not load comprehensive store mapping for region detection:', error);
      }

      // Prepare data for Google Sheets
      const params: any = {
        submissionTime: new Date().toLocaleString('en-GB', {hour12: false}),
        hrName: metadata.hrName,
        hrId: metadata.hrId,
        amName: metadata.amName,
        amId: metadata.amId,
        trainerName: metadata.trainerName,
        trainerId: metadata.trainerId || metadata.trainerName,
        storeName: metadata.storeName,
        storeId: metadata.storeId,
        region: detectedRegion || 'Unknown',
        bscAchievement: metadata.bscAchievement,
        peopleOnShift: metadata.peopleOnShift,
        manpowerFulfilment: metadata.manpowerFulfilment,
        cafeType: metadata.cafeType,
        storeType: metadata.storeType,
        concept: metadata.concept,
        totalScore: score.toString(),
        maxScore: maxScore.toString(),
        percentageScore: percentage.toString()
      };

      // Add all question responses with section prefixes
      let questionCounter = 1;
      sections.forEach((section, sectionIndex) => {
        section.items.forEach((item, itemIndex) => {
          const questionKey = `${section.id}_${item.id}`;
          let paramKey = '';
          
          // Map sections to proper question numbers for Google Sheets
          if (section.id === 'CG') {
            paramKey = `q${questionCounter}`;
          } else if (section.id === 'OTA') {
            paramKey = `q${100 + (itemIndex + 1)}`;
          } else if (section.id === 'FAS') {
            paramKey = `q${200 + (itemIndex + 1)}`;
          } else if (section.id === 'FWS') {
            paramKey = `q${300 + (itemIndex + 1)}`;
          } else if (section.id === 'ENJ') {
            paramKey = `q${400 + (itemIndex + 1)}`;
          } else if (section.id === 'EX') {
            paramKey = `q${500 + (itemIndex + 1)}`;
          }
          
          params[paramKey] = responses[questionKey] || '';
          
          if (section.id === 'CG') {
            questionCounter++;
          }
        });
        
        // Add section remarks
        params[`section_${section.id}_remarks`] = sectionRemarks[section.id] || '';
      });

      // Convert to URL-encoded format
      const body = Object.keys(params).map(k => 
        encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
      ).join('&');

      console.log('Submitting AM Operations Checklist to Google Sheets with data:', params);

      const response = await fetch(AM_OPS_LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body
      });

      if (response.ok) {
        setSubmitted(true);
        localStorage.removeItem('operations_checklist_responses');
        localStorage.removeItem('operations_checklist_metadata');
        localStorage.removeItem('operations_section_remarks');
        localStorage.removeItem('operations_section_images');
        hapticFeedback.success();
      } else {
        throw new Error('Failed to submit AM Operations Checklist');
      }
    } catch (error) {
      console.error('Error submitting AM Operations Checklist:', error);
      alert('Failed to submit checklist. Please try again.');
      hapticFeedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (sectionId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSectionImages(prev => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), result]
      }));
      hapticFeedback.select();
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (sectionId: string, imageIndex: number) => {
    setSectionImages(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter((_, index) => index !== imageIndex)
    }));
    hapticFeedback.select();
  };

  const calculateScore = () => {
    let score = 0;
    let maxScore = 0;

    sections.forEach(section => {
      section.items.forEach(item => {
        const questionKey = `${section.id}_${item.id}`;
        const response = responses[questionKey];
        
        if (response === 'yes') {
          score += 1;
          maxScore += 1;
        } else if (response === 'no') {
          maxScore += 1; // Count towards max but don't add to score
        }
        // N/A responses are excluded from both score and maxScore
      });
    });

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    return { score, maxScore, percentage };
  };

  const getSectionScore = (section: ChecklistSection) => {
    let score = 0;
    let maxScore = 0;

    section.items.forEach(item => {
      const questionKey = `${section.id}_${item.id}`;
      const response = responses[questionKey];
      
      if (response === 'yes') {
        score += 1;
        maxScore += 1;
      } else if (response === 'no') {
        maxScore += 1;
      }
      // N/A responses are excluded
    });

    return { score, maxScore };
  };

  const resetChecklist = () => {
    if (confirm('Are you sure you want to reset all responses? This action cannot be undone.')) {
      setResponses({});
      setMetadata({
        hrName: '',
        hrId: '',
        amName: '',
        amId: '',
        trainerName: '',
        trainerId: '',
        storeName: '',
        storeId: '',
        bscAchievement: '',
        peopleOnShift: '',
        manpowerFulfilment: '',
        cafeType: '',
        storeType: '',
        concept: ''
      });
      setSectionRemarks({});
      setSectionImages({});
      setHrSearchTerm('');
      setAmSearchTerm('');
      setStoreSearchTerm('');
      setSubmitted(false);
      localStorage.removeItem('operations_checklist_responses');
      localStorage.removeItem('operations_checklist_metadata');
      localStorage.removeItem('operations_section_remarks');
      localStorage.removeItem('operations_section_images');
      hapticFeedback.success();
    }
  };

  const startNewChecklist = () => {
    setSubmitted(false);
    setResponses({});
    setMetadata({
      hrName: '',
      hrId: '',
      amName: '',
      amId: '',
      trainerName: '',
      trainerId: '',
      storeName: '',
      storeId: '',
      bscAchievement: '',
      peopleOnShift: '',
      manpowerFulfilment: '',
      cafeType: '',
      storeType: '',
      concept: ''
    });
    setSectionRemarks({});
    setSectionImages({});
    setHrSearchTerm('');
    setAmSearchTerm('');
    setStoreSearchTerm('');
  };

  const { score, maxScore, percentage } = calculateScore();

  // Show submission success screen
  if (submitted) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center border border-green-200 dark:border-green-800">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">
            AM Operations Checklist Submitted Successfully!
          </h2>
          <p className="text-green-600 dark:text-green-400 mb-6">
            Your checklist has been recorded and will be processed for dashboard insights.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={startNewChecklist}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Start New Checklist
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          🍽️ AM Operations Checklist
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Comprehensive operational checklist based on AM Ops standards. Flat scoring: Yes = 1, No = 0, N/A excluded from scoring.
        </p>
      </div>

      {/* Metadata */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Audit Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* HR Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">HR Name:</label>
            <div className="relative">
              <input
                type="text"
                value={hrSearchTerm}
                onChange={(e) => {
                  setHrSearchTerm(e.target.value);
                  setShowHrDropdown(true);
                }}
                onFocus={() => setShowHrDropdown(true)}
                placeholder="Select or type HR name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 pr-8"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHrDropdown(!showHrDropdown);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ▼
              </button>
              {showHrDropdown && (
                <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredHR.length > 0 ? (
                    filteredHR.map((hr) => (
                      <div
                        key={hr.id}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer dark:text-slate-100"
                        onClick={() => {
                          setMetadata(prev => ({ ...prev, hrName: hr.name, hrId: hr.id }));
                          setHrSearchTerm(hr.name);
                          setShowHrDropdown(false);
                        }}
                      >
                        {hr.name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 dark:text-slate-400 text-sm">
                      {metadata.amId ? 'No HR found for selected AM' : 'Please select an Area Manager first'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Area Manager Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Area Manager:</label>
            <div className="relative">
              <input
                type="text"
                value={amSearchTerm}
                onChange={(e) => {
                  setAmSearchTerm(e.target.value);
                  setShowAmDropdown(true);
                }}
                onFocus={() => setShowAmDropdown(true)}
                placeholder="Select or type Area Manager name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 pr-8"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAmDropdown(!showAmDropdown);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ▼
              </button>
              {showAmDropdown && (
                <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredAM.map((am) => (
                    <div
                      key={am.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer dark:text-slate-100"
                      onClick={() => {
                        setMetadata(prev => ({ ...prev, amName: am.name, amId: am.id }));
                        setAmSearchTerm(am.name);
                        setShowAmDropdown(false);
                      }}
                    >
                      {am.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trainer Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Trainer Name:</label>
            <div className="relative">
              <input
                type="text"
                value={trainerSearchTerm}
                onChange={(e) => {
                  setTrainerSearchTerm(e.target.value);
                  setShowTrainerDropdown(true);
                }}
                onFocus={() => setShowTrainerDropdown(true)}
                placeholder="Select or type trainer name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 pr-8"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTrainerDropdown(!showTrainerDropdown);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ▼
              </button>
              {showTrainerDropdown && (
                <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredTrainers().length > 0 ? (
                    filteredTrainers().map((trainer) => (
                      <div
                        key={trainer.id}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer dark:text-slate-100"
                        onClick={() => {
                          setMetadata(prev => ({ ...prev, trainerName: trainer.name, trainerId: trainer.id }));
                          setTrainerSearchTerm(trainer.name);
                          setShowTrainerDropdown(false);
                        }}
                      >
                        {trainer.name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 dark:text-slate-400 text-sm">
                      {metadata.amId ? 'No trainers found for selected AM' : 'Please select an Area Manager first'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Store Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store:</label>
            <div className="relative">
              <input
                type="text"
                value={storeSearchTerm}
                onChange={(e) => {
                  setStoreSearchTerm(e.target.value);
                  setShowStoreDropdown(true);
                }}
                onFocus={() => setShowStoreDropdown(true)}
                placeholder="Select or type store name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 pr-8"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStoreDropdown(!showStoreDropdown);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ▼
              </button>
              {showStoreDropdown && (
                <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {getStoresForAM().map((store) => (
                    <div
                      key={store.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer dark:text-slate-100"
                      onClick={() => {
                        // Auto-populate all fields from comprehensive mapping
                        setMetadata(prev => ({ 
                          ...prev, 
                          storeName: store.name, 
                          storeId: store.id,
                          cafeType: store.menu || prev.cafeType,
                          storeType: store.storeType || prev.storeType,
                          concept: store.concept || prev.concept
                        }));
                        setStoreSearchTerm(store.name);
                        setShowStoreDropdown(false);
                      }}
                    >
                      {store.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Operations Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
          {/* BSC Achievement % */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">BSC Achievement %:</label>
            <input
              type="text"
              value={metadata.bscAchievement}
              onChange={(e) => setMetadata(prev => ({ ...prev, bscAchievement: e.target.value }))}
              placeholder="Enter BSC Achievement %"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          {/* No. of people on shift */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">No. of people on shift:</label>
            <input
              type="number"
              value={metadata.peopleOnShift}
              onChange={(e) => setMetadata(prev => ({ ...prev, peopleOnShift: e.target.value }))}
              placeholder="Enter number of people"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          {/* Man power fulfilment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Man power fulfilment:</label>
            <select
              value={metadata.manpowerFulfilment}
              onChange={(e) => setMetadata(prev => ({ ...prev, manpowerFulfilment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="">Select fulfilment level</option>
              <option value="Low">Low</option>
              <option value="Med">Med</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Café Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Café Type:</label>
            <select
              value={metadata.cafeType}
              onChange={(e) => setMetadata(prev => ({ ...prev, cafeType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="">Select café type</option>
              <option value="REGULAR+">REGULAR+</option>
              <option value="REGULAR">REGULAR</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="PREMIUM+">PREMIUM+</option>
              <option value="AIRPORT-CA">AIRPORT-CA</option>
              <option value="TIER-2">TIER-2</option>
              <option value="KIOSK-LITE">KIOSK-LITE</option>
              <option value="No HD">No HD</option>
              <option value="KIOSK-PRO">KIOSK-PRO</option>
            </select>
          </div>

          {/* Store Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store Type:</label>
            <select
              value={metadata.storeType}
              onChange={(e) => setMetadata(prev => ({ ...prev, storeType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="">Select store type</option>
              <option value="Corporate">Corporate</option>
              <option value="Highstreet">Highstreet</option>
              <option value="Shop in Shop">Shop in Shop</option>
              <option value="Mall">Mall</option>
              <option value="Hospital">Hospital</option>
              <option value="Airport">Airport</option>
              <option value="Highway">Highway</option>
            </select>
          </div>

          {/* Concept */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Concept:</label>
            <select
              value={metadata.concept}
              onChange={(e) => setMetadata(prev => ({ ...prev, concept: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="">Select concept</option>
              <option value="Experience">Experience</option>
              <option value="Premium">Premium</option>
              <option value="Shop In Shop">Shop In Shop</option>
              <option value="Kiosk">Kiosk</option>
              <option value="ZIP">ZIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* sections */}
      {sections.map((section) => {
        const sectionScore = getSectionScore(section);
        return (
          <div key={section.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                {section.title}
              </h2>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Section score: {sectionScore.score} / {sectionScore.maxScore}
              </div>
            </div>
            
            <div className="space-y-4">
              {section.items.map((item, index) => {
                const questionKey = `${section.id}_${item.id}`;
                return (
                  <div key={item.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                    <div className="mb-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 dark:text-slate-100 font-medium">
                        {item.q}
                      </span>
                    </div>
                    
                    <div className="ml-11 flex gap-4">
                      {['yes', 'no', 'na'].map((option) => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={questionKey}
                            value={option}
                            checked={responses[questionKey] === option}
                            onChange={(e) => handleResponse(questionKey, e.target.value)}
                            className="w-4 h-4 text-orange-600 border-gray-300 dark:border-slate-600 focus:ring-orange-500"
                          />
                          <span className={`text-sm font-medium ${
                            option === 'na' ? 'text-gray-500 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'
                          }`}>
                            {option.toUpperCase()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Section Remarks */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">
                Section Remarks
              </h3>
              <textarea
                value={sectionRemarks[section.id] || ''}
                onChange={(e) => handleSectionRemarks(section.id, e.target.value)}
                placeholder={`Add remarks for ${section.title} section...`}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
              />
            </div>

            {/* Image Upload Section */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">
                Upload Images
              </h3>
              
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(section.id, file);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>

              {/* Display uploaded images */}
              {sectionImages[section.id] && sectionImages[section.id].length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sectionImages[section.id].map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`${section.title} - Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm"
                      />
                      <button
                        onClick={() => removeImage(section.id, index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={resetChecklist}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Reset Checklist
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Score: {score}/{maxScore} ({percentage}%)
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationsChecklist;