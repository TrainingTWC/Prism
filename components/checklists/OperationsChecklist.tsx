import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, canAccessStore, canAccessAM, canAccessHR } from '../../roleMapping';
import { AREA_MANAGERS as DEFAULT_AREA_MANAGERS, HR_PERSONNEL as DEFAULT_HR_PERSONNEL, SENIOR_HR_ROLES, TRAINER_PERSONNEL } from '../../constants';
import { Store } from '../../types';
import { hapticFeedback } from '../../utils/haptics';
import { useComprehensiveMapping } from '../../hooks/useComprehensiveMapping';
import buildOperationsPDF from '@/src/utils/operationsReport';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';

// Google Sheets endpoint for logging AM Operations data - UPDATED URL (no CORS headers needed)
const AM_OPS_LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyKzDHP-iEpJTacXk_lPl6eNCJXtg5imabCdzYPVIWrHPNMXRHUDNO9PeijCKKWalBm/exec';

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
  storeFormat: string;
  menuType: string;
  priceGroup: string;
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
      { id: 'CG_1', q: 'Is the store front area clean and maintained?' },
      { id: 'CG_2', q: 'Is the signage clean and are all lights functioning?' },
      { id: 'CG_3', q: 'Are the glass and doors smudge-free?' },
      { id: 'CG_4', q: 'Do promotional displays reflect current offers?' },
      { id: 'CG_5', q: 'Are POS tent cards as per the latest communication?' },
      { id: 'CG_6', q: 'Are menu boards/DMB as per the latest communication?' },
      { id: 'CG_7', q: 'Does the café have a welcoming environment (music, lighting, AC, aroma)?' },
      { id: 'CG_8', q: 'Are washrooms cleaned and the checklist updated?' },
      { id: 'CG_9', q: 'Is the FDU counter neat, fully stocked, and set as per the planogram?' },
      { id: 'CG_10', q: 'Does the merch rack follow VM guidelines and attract attention?' },
      { id: 'CG_11', q: 'Is staff grooming (uniform, jewellery, hair and makeup) as per standards?' },
      { id: 'CG_12', q: 'Are all seating, furniture, and stations tidy and organized?' },
      { id: 'CG_13', q: 'Is the engine area clean and ready for operations?' }
    ]
  },
  {
    id: 'OTA',
    title: 'Order Taking Assistance',
    items: [
      { id: 'OTA_101', q: 'Is suggestive selling happening at the POS?' },
      { id: 'OTA_102', q: 'Is the POS partner updated on the latest promos and item availability?' },
      { id: 'OTA_103', q: 'Has order-taking time been recorded for 5 customers?' },
      { id: 'OTA_104', q: 'Is there sufficient cash and change at the POS?' },
      { id: 'OTA_105', q: 'Are valid licenses displayed and expiries checked (medical reports)?' },
      { id: 'OTA_106', q: 'Are cash audits completed and verified with the logbook?' },
      { id: 'OTA_107', q: 'Are daily banking reports tallied?' },
      { id: 'OTA_108', q: 'Has CPI been reviewed through the FAME pilot?' },
      { id: 'OTA_109', q: 'Are Swiggy/Zomato metrics (RDC, MFR, visibility) reviewed, and are Food Lock on LS and stock control on UrbanPiper managed per stock availability/opening inventory?' },
      { id: 'OTA_110', q: 'Are all food and drinks served as per SOP?' },
      { id: 'OTA_111', q: 'Are food orders placed based on the 4-week sales trend?' }
    ]
  },
  {
    id: 'FAS',
    title: 'Friendly & Accurate Service',
    items: [
      { id: 'FAS_201', q: 'Is equipment cleaned and maintained?' },
      { id: 'FAS_202', q: 'Are temperature checks done with the Therma Pen and logs updated?' },
      { id: 'FAS_203', q: 'Is documentation (GRN, RSTN, STN & TO) completed?' },
      { id: 'FAS_204', q: 'Is fast-moving SKU availability checked and validated with LS?' },
      { id: 'FAS_205', q: 'Is the thawing chart validated against actual thawing?' },
      { id: 'FAS_206', q: 'Are deployment roles clear, with coaching and appreciation done by the MOD?' },
      { id: 'FAS_207', q: 'Are there no broken/unused tools stored in the store?' },
      { id: 'FAS_208', q: 'Is garbage segregated properly (wet/dry)?' },
      { id: 'FAS_209', q: 'Are LTO products served as per standards?' },
      { id: 'FAS_210', q: 'Is the coffee and food dial-in process followed?' },
      { id: 'FAS_211', q: 'Are R.O.A.S.T. and app orders executed accurately?' },
      { id: 'FAS_212', q: 'Have 5 order service times been validated?' },
      { id: 'FAS_213', q: 'Have open maintenance-related points been reviewed?' }
    ]
  },
  {
    id: 'FWS',
    title: 'Feedback with Solution',
    items: [
      { id: 'FWS_301', q: 'Has COGS been reviewed, with actions in place per last month P&L feedback?' },
      { id: 'FWS_302', q: 'Have BSC targets vs achievements been reviewed?' },
      { id: 'FWS_303', q: 'Has people budget vs actuals (labour cost/bench planning) been reviewed?' },
      { id: 'FWS_304', q: 'Has variance in stock (physical vs system) been verified?' },
      { id: 'FWS_305', q: 'Have the top 10 wastage items been reviewed?' },
      { id: 'FWS_306', q: 'Have store utilities (units, chemical use) been reviewed?' },
      { id: 'FWS_307', q: 'Have shift targets, briefings, and goal tracking been conducted?' },
      { id: 'FWS_308', q: 'Have new staff training and bench plans been reviewed?' },
      { id: 'FWS_309', q: 'Have Training and QA audits been reviewed?' },
      { id: 'FWS_310', q: 'Has the duty roster (off/coff, ELCL, tenure) been checked and attendance ensured as per ZingHR?' },
      { id: 'FWS_311', q: 'Have temperature and thawing logs been validated?' },
      { id: 'FWS_312', q: 'Have audit and data findings been cross-checked with store observations?' },
      { id: 'FWS_313', q: 'Is the pest control layout updated?' }
    ]
  },
  {
    id: 'ENJ',
    title: 'Enjoyable Experience',
    items: [
      { id: 'ENJ_401', q: 'Have 2 new and 2 repeat customers been engaged, with feedback documented?' },
      { id: 'ENJ_402', q: 'Are seating and stations adjusted as per customer requirements?' },
      { id: 'ENJ_403', q: 'Is the team proactively assisting customers?' },
      { id: 'ENJ_404', q: 'Is CCTV checked to monitor customer service during peak hours?' },
      { id: 'ENJ_405', q: 'Is CCTV backup (minimum 60 days) in place and are black spots checked?' },
      { id: 'ENJ_406', q: 'Is opening/closing footage reviewed for correct practices?' },
      { id: 'ENJ_407', q: 'Are there no personal items/clutter in guest areas, with belongings kept in lockers/designated places?' }
    ]
  },
  {
    id: 'EX',
    title: 'Enthusiastic Exit',
    items: [
      { id: 'EX_501', q: 'Are there no unresolved issues at exits?' },
      { id: 'EX_502', q: 'Is the final interaction cheerful and courteous?' },
      { id: 'EX_503', q: 'Has a consolidated action plan been created with the Store Manager?' },
      { id: 'EX_504', q: 'Have top performers been recognized?' },
      { id: 'EX_505', q: 'Have wins been celebrated and improvement areas communicated?' },
      { id: 'EX_506', q: 'Has the team been motivated for ongoing improvement?' }
    ]
  }
];

const OperationsChecklist: React.FC<OperationsChecklistProps> = ({ userRole, onStatsUpdate }) => {
  const { config, loading: configLoading } = useConfig();
  const AREA_MANAGERS = config?.AREA_MANAGERS || DEFAULT_AREA_MANAGERS;
  const HR_PERSONNEL = config?.HR_PERSONNEL || DEFAULT_HR_PERSONNEL;

  // Use config data if available, otherwise fall back to hardcoded SECTIONS
  const sections = config?.CHECKLISTS?.OPERATIONS || SECTIONS;

  // Load comprehensive mapping from Google Sheets
  const { mapping: compStoreMapping, loading: mappingLoading } = useComprehensiveMapping();

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
    } catch (e) { }

    const urlParams = new URLSearchParams(window.location.search);
    // Look for EMPID in URL first, then fall back to other params
    const empId = urlParams.get('EMPID') || urlParams.get('empid') || urlParams.get('amId') || urlParams.get('am_id') || urlParams.get('r') || (stored as any).amId || '';
    const amName = urlParams.get('amName') || urlParams.get('am_name') || (stored as any).amName || '';

    const findAMById = (id: string) => {
      if (!id) return null;
      return AREA_MANAGERS.find(am => am.id === id || am.id.toLowerCase() === id.toLowerCase());
    };

    let finalAmName = amName;
    let finalAmId = empId;

    if (empId) {
      const amPerson = findAMById(empId);
      if (amPerson) {
        finalAmName = amPerson.name;
        finalAmId = amPerson.id;
        console.log('🔍 EMPID detected from URL:', empId, '→ AM:', amPerson.name);
      }
    } else if (amName && !empId) {
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
      storeFormat: (stored as any).storeFormat || '',
      menuType: (stored as any).menuType || '',
      priceGroup: (stored as any).priceGroup || ''
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

  // Monitor URL for EMPID changes and update AM field automatically
  useEffect(() => {
    const checkUrlForEmpId = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const empIdFromUrl = urlParams.get('EMPID') || urlParams.get('empid');

      if (empIdFromUrl) {
        const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();
        const empIdNorm = normalizeId(empIdFromUrl);
        const currentAmNorm = normalizeId(metadata.amId);

        // Only update if EMPID has changed
        if (empIdNorm !== currentAmNorm) {
          const amPerson = AREA_MANAGERS.find(am => normalizeId(am.id) === empIdNorm);

          if (amPerson) {
            console.log('🔄 EMPID changed in URL:', empIdFromUrl, '→ Updating AM to:', amPerson.name);

            // Clear localStorage to prevent stale data
            localStorage.removeItem('operations_checklist_metadata');

            // Reset all dependent fields and update AM
            setMetadata(prev => ({
              ...prev,
              amId: amPerson.id,
              amName: amPerson.name,
              // Clear all dependent fields
              hrId: '',
              hrName: '',
              trainerId: '',
              trainerName: '',
              storeName: '',
              storeId: '',
              storeFormat: '',
              menuType: '',
              priceGroup: ''
            }));

            // Reset all search terms to clear UI
            setAmSearchTerm(amPerson.name);
            setHrSearchTerm('');
            setTrainerSearchTerm('');
            setStoreSearchTerm('');

            console.log('✅ Reset HR, Trainer, and Store fields due to EMPID change');
          }
        }
      }
    };

    // Check on mount and when component updates
    checkUrlForEmpId();

    // Listen for URL changes (browser back/forward, pushState, replaceState)
    const handlePopState = () => checkUrlForEmpId();
    window.addEventListener('popstate', handlePopState);

    // Also check periodically in case URL changes without popstate event
    const intervalId = setInterval(checkUrlForEmpId, 1000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(intervalId);
    };
  }, [AREA_MANAGERS, metadata.amId]); // Re-run when AM changes or AREA_MANAGERS updates

  // Auto-fill HR and Trainer when AM is identified (from URL EMPID)
  useEffect(() => {
    if (metadata.amId && compStoreMapping.length > 0 && !metadata.hrId && !metadata.trainerId) {
      const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();
      const amIdNorm = normalizeId(metadata.amId);

      // Find first store for this AM to get HR and Trainer
      const amStore = compStoreMapping.find((row: any) => normalizeId(row['AM']) === amIdNorm);

      if (amStore) {
        console.log('🔍 Store data for AM:', amStore);
        console.log('🔍 All keys in amStore:', Object.keys(amStore));

        // Get HR details
        const hrbpId = amStore['HRBP'] || amStore['HRBP 1 ID'] || '';
        const hrDetails = HR_PERSONNEL.find(hr => normalizeId(hr.id) === normalizeId(hrbpId));

        // Get Trainer details - check multiple possible column names
        const trainerIdFromSheet = amStore['Trainer'] || amStore['Trainer 1'] || amStore['Trainer1'] || '';
        const trainerNameFromSheet = amStore['Trainer 1 Name'] || amStore['Trainer1Name'] || amStore['Trainer Name'] || amStore['TrainerName'] || '';

        console.log('🔍 Trainer ID from sheet:', trainerIdFromSheet);
        console.log('🔍 Trainer name from sheet:', trainerNameFromSheet);
        console.log('🔍 Available trainer columns:', {
          'Trainer': amStore['Trainer'],
          'Trainer 1': amStore['Trainer 1'],
          'Trainer 1 Name': amStore['Trainer 1 Name'],
          'Trainer1Name': amStore['Trainer1Name'],
          'Trainer Name': amStore['Trainer Name'],
          'TrainerName': amStore['TrainerName']
        });

        // Trainer name overrides mapping
        const trainerNameOverrides: Record<string, string> = {
          H1278: 'Viraj Vijay Mahamunkar',
          H1697: 'Sheldon Antonio Xavier DSouza',
          H1761: 'Mahadev Nayak',
          H2155: 'Jagruti Narendra Bhanushali',
          H2595: 'Kailash Singh',
          H3247: 'Thatikonda Sunil Kumar',
          H3252: 'Priyanka Pankajkumar Gupta',
          H3595: 'Bhawna',
          H3603: 'Manasi',
          H3728: 'Siddhant',
          H3786: 'Oviya',
          H701: 'Mallika M'
        };

        // Determine trainer details - prefer name from sheet, fallback to ID with override
        let trainerDetails = null;
        if (trainerNameFromSheet) {
          trainerDetails = { id: trainerIdFromSheet || trainerNameFromSheet, name: trainerNameFromSheet };
        } else if (trainerIdFromSheet) {
          const resolvedName = trainerNameOverrides[trainerIdFromSheet] || trainerIdFromSheet;
          trainerDetails = { id: trainerIdFromSheet, name: resolvedName };
        }

        if (hrDetails || trainerDetails) {
          setMetadata(prev => ({
            ...prev,
            hrId: hrDetails?.id || hrbpId,
            hrName: hrDetails?.name || hrbpId,
            trainerId: trainerDetails?.id || '',
            trainerName: trainerDetails?.name || ''
          }));

          if (hrDetails) setHrSearchTerm(hrDetails.name);
          if (trainerDetails) setTrainerSearchTerm(trainerDetails.name);

          console.log('✅ Auto-filled from EMPID → HR:', hrDetails?.name, '| Trainer:', trainerDetails?.name, '(ID:', trainerDetails?.id, ')');
        }
      }
    }
  }, [metadata.amId, compStoreMapping, HR_PERSONNEL, metadata.hrId, metadata.trainerId]);

  // Resolve AM ID to name if name is missing or is the ID itself - USE STORE MAPPING AS SOURCE OF TRUTH
  useEffect(() => {
    if (metadata.amId && (!metadata.amName || metadata.amName === metadata.amId) && compStoreMapping.length > 0) {
      const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();
      const amIdNorm = normalizeId(metadata.amId);
      
      // First try to get AM name from comprehensive store mapping (source of truth)
      const amStore = compStoreMapping.find((row: any) => normalizeId(row['AM']) === amIdNorm);
      
      if (amStore) {
        const amNameFromSheet = amStore['AM Name'] || amStore['Area Manager Name'] || '';
        if (amNameFromSheet && amNameFromSheet !== metadata.amName) {
          console.log('🔄 Resolving AM ID from Store Mapping:', metadata.amId, '→', amNameFromSheet);
          setMetadata(prev => ({ ...prev, amName: amNameFromSheet }));
          setAmSearchTerm(amNameFromSheet);
          return;
        }
      }
      
      // Fallback to AREA_MANAGERS constant if not found in mapping
      const amPerson = AREA_MANAGERS.find(am => normalizeId(am.id) === amIdNorm);
      if (amPerson && amPerson.name !== metadata.amName) {
        console.log('🔄 Resolving AM ID from constants (fallback):', metadata.amId, '→', amPerson.name);
        setMetadata(prev => ({ ...prev, amName: amPerson.name }));
        setAmSearchTerm(amPerson.name);
      }
    }
  }, [metadata.amId, metadata.amName, compStoreMapping, AREA_MANAGERS]);

  // Resolve Trainer ID to name if name is missing or is the ID itself
  useEffect(() => {
    if (metadata.trainerId && (!metadata.trainerName || metadata.trainerName === metadata.trainerId)) {
      // Use the trainer overrides map
      const trainerNameOverrides: Record<string, string> = {
        H1278: 'Viraj Vijay Mahamunkar',
        H1697: 'Sheldon Antonio Xavier DSouza',
        H1761: 'Mahadev Nayak',
        H2155: 'Jagruti Narendra Bhanushali',
        H2595: 'Kailash Singh',
        H3247: 'Thatikonda Sunil Kumar',
        H3252: 'Priyanka Pankajkumar Gupta',
        H3595: 'Bhawna',
        H3603: 'Manasi',
        H3728: 'Siddhant',
        H3786: 'Oviya',
        H701: 'Mallika M'
      };

      const resolvedName = trainerNameOverrides[metadata.trainerId];
      if (resolvedName && resolvedName !== metadata.trainerName) {
        console.log('🔄 Resolving Trainer ID to name:', metadata.trainerId, '→', resolvedName);
        setMetadata(prev => ({ ...prev, trainerName: resolvedName }));
        setTrainerSearchTerm(resolvedName);
      }
    }
  }, [metadata.trainerId, metadata.trainerName]);

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

  // Search state for dropdowns - initialize with metadata values
  const [hrSearchTerm, setHrSearchTerm] = useState(metadata.hrName || '');
  const [amSearchTerm, setAmSearchTerm] = useState(metadata.amName || '');
  const [trainerSearchTerm, setTrainerSearchTerm] = useState(metadata.trainerName || '');
  const [storeSearchTerm, setStoreSearchTerm] = useState(metadata.storeName || '');
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
    } catch (e) { }

    const { score, maxScore, percentage } = calculateScore();
    const totalQuestions = sections.reduce((acc, section) => acc + section.items.length, 0);
    const completedQuestions = Object.keys(responses).filter(key => responses[key] && responses[key] !== '').length;

    onStatsUpdate({
      completed: completedQuestions,
      total: totalQuestions,
      score: percentage
    });
  }, [responses, onStatsUpdate]);

  // Sync search terms with metadata whenever it changes
  useEffect(() => {
    setHrSearchTerm(metadata.hrName || '');
    setAmSearchTerm(metadata.amName || '');
    setTrainerSearchTerm(metadata.trainerName || '');
    setStoreSearchTerm(metadata.storeName || '');
  }, [metadata.hrName, metadata.amName, metadata.trainerName, metadata.storeName]);

  // Trainer name overrides from comprehensive mapping
  const trainerNameOverrides: Record<string, string> = {
    H1278: 'Viraj Vijay Mahamunkar',
    H1697: 'Sheldon Antonio Xavier DSouza',
    H1761: 'Mahadev Nayak',
    H2155: 'Jagruti Narendra Bhanushali',
    H2595: 'Kailash Singh',
    H3247: 'Thatikonda Sunil Kumar',
    H3252: 'Priyanka Pankajkumar Gupta',
    H3595: 'Bhawna',
    H3603: 'Manasi',
    H3728: 'Siddhant',
    H3786: 'Oviya',
    H701: 'Mallika M'
  };

  // Build unique trainers list from comprehensive store mapping - ULTIMATE SOURCE OF TRUTH
  const uniqueTrainers = useMemo(() => {
    if (compStoreMapping.length === 0) return [];
    const allIds = compStoreMapping
      .map((r: any) => r.Trainer)
      .filter(Boolean)
      .flatMap((trainer: string) => trainer.split(',').map(id => id.trim())); // Split comma-separated IDs
    const ids = Array.from(new Set(allIds));
    const trainers = ids.map((id: string) => ({
      id,
      name: trainerNameOverrides[id] || id
    }));
    return trainers.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }, [compStoreMapping]);

  // Extract stores from comprehensive store mapping - filtered by AM's region
  const uniqueStores = useMemo(() => {
    if (compStoreMapping.length === 0) return [];

    // Get AM's region if AM is selected
    let amRegion = '';
    if (metadata.amId) {
      const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();
      const amIdNorm = normalizeId(metadata.amId);
      const amStore = compStoreMapping.find((row: any) => normalizeId(row['AM']) === amIdNorm);
      if (amStore) {
        amRegion = amStore['Region'] || '';
        console.log('📍 AM Region detected:', amRegion);
      }
    }

    const stores = compStoreMapping
      .filter((row: any) => {
        // If AM is identified, filter stores by AM's region
        if (amRegion) {
          return (row['Region'] || '').toLowerCase() === amRegion.toLowerCase();
        }
        return true; // Show all stores if no AM selected
      })
      .map((row: any) => ({
        name: row['Store Name'],
        id: row['Store ID'],
        menu: row['Menu'],
        storeType: row['Store Type'],
        concept: row['Concept']
      }));
    return stores
      .filter(store => store.name && store.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [compStoreMapping, metadata.amId]);

  // Auto-populate ALL fields when store is selected from Store_mapping
  useEffect(() => {
    if (metadata.storeId && compStoreMapping.length > 0) {
      const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();
      const storeIdNorm = normalizeId(metadata.storeId);

      // Find store in comprehensive mapping
      const storeData = compStoreMapping.find((row: any) =>
        normalizeId(row['Store ID']) === storeIdNorm
      );

      if (storeData) {
        console.log('🏪 Auto-filling from Store_mapping:', storeData);

        // Get AM details
        const amId = storeData['AM'] || storeData['Area Manager ID'] || '';
        const amDetails = AREA_MANAGERS.find(am => normalizeId(am.id) === normalizeId(amId));

        // Get Trainer details - handle comma-separated IDs (take first one)
        const trainerIds = (storeData['Trainer'] || '').split(',').map((id: string) => id.trim()).filter(Boolean);
        const trainerId = trainerIds[0] || '';
        const trainerDetails = trainerId ? (TRAINER_PERSONNEL.find(t => normalizeId(t.id) === normalizeId(trainerId)) || { id: trainerId, name: trainerId }) : null;

        // Get HR details
        const hrbpId = storeData['HRBP'] || storeData['HRBP 1 ID'] || '';
        const hrDetails = HR_PERSONNEL.find(hr => normalizeId(hr.id) === normalizeId(hrbpId));

        // Auto-fill ALL fields
        setMetadata(prev => ({
          ...prev,
          // Store fields
          storeName: storeData['Store Name'] || prev.storeName,
          menuType: storeData['Menu'] || prev.menuType,
          storeFormat: storeData['Store Type'] || prev.storeFormat,
          priceGroup: storeData['Concept'] || prev.priceGroup,
          // AM fields
          amId: amDetails?.id || amId,
          amName: amDetails?.name || amId,
          // Trainer fields
          trainerId: trainerDetails?.id || trainerId,
          trainerName: trainerDetails?.name || trainerId,
          // HR fields
          hrId: hrDetails?.id || hrbpId,
          hrName: hrDetails?.name || hrbpId
        }));

        // Update search terms
        if (amDetails) setAmSearchTerm(amDetails.name);
        if (trainerDetails) setTrainerSearchTerm(trainerDetails.name);
        if (hrDetails) setHrSearchTerm(hrDetails.name);

        console.log('✅ Auto-filled: AM:', amDetails?.name, '| Trainer:', trainerDetails?.name, '| HR:', hrDetails?.name);
      }
    }
  }, [metadata.storeId, compStoreMapping, AREA_MANAGERS, HR_PERSONNEL]);

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
      const amsForTrainer = Array.from(new Set(compStoreMapping
        .filter((r: any) => {
          // Handle comma-separated trainer IDs
          const trainers = (r.Trainer || '').split(',').map((id: string) => normalizeId(id.trim()));
          return trainers.includes(trainerIdNorm);
        })
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
        const trainersForAM = Array.from(new Set(compStoreMapping
          .filter((r: any) => normalizeId(r.AM) === amIdNorm)
          .flatMap((r: any) => (r.Trainer || '').split(',').map((id: string) => normalizeId(id.trim())))
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
        const storesForAM = Array.from(new Set(compStoreMapping
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
      const hrbpsForAM = Array.from(new Set(compStoreMapping
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
    } catch (e) { }
  }, [metadata]);

  useEffect(() => {
    try {
      localStorage.setItem('operations_section_remarks', JSON.stringify(sectionRemarks));
    } catch (e) { }
  }, [sectionRemarks]);

  useEffect(() => {
    try {
      localStorage.setItem('operations_section_images', JSON.stringify(sectionImages));
    } catch (e) { }
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
      // Find first unanswered question and scroll to it
      let firstUnansweredId: string | null = null;
      
      for (const section of sections) {
        for (const item of section.items) {
          const questionKey = item.id;
          if (!responses[questionKey] || responses[questionKey] === '') {
            firstUnansweredId = questionKey;
            break;
          }
        }
        if (firstUnansweredId) break;
      }

      // Scroll to first unanswered question
      if (firstUnansweredId) {
        const element = document.getElementById(firstUnansweredId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a brief highlight effect
          element.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50');
          }, 2000);
        }
      }

      hapticFeedback.error();
      // Delay alert to let scroll complete
      setTimeout(() => {
        alert(`Please answer all questions. You have answered ${answeredQuestions} out of ${totalQuestions} questions.`);
      }, 300);
      return;
    }

    // Validate required metadata fields
    const requiredFields = ['hrName', 'hrId', 'amName', 'amId', 'trainerName', 'storeName', 'storeId', 'bscAchievement', 'peopleOnShift', 'manpowerFulfilment', 'storeFormat', 'menuType', 'priceGroup'];
    const missingFields = requiredFields.filter(field => !metadata[field as keyof ChecklistMeta] || metadata[field as keyof ChecklistMeta].trim() === '');

    if (missingFields.length > 0) {
      // Scroll to top where metadata is
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Highlight the metadata section
      const metadataSection = document.querySelector('.bg-white.dark\\:bg-slate-800.rounded-lg.shadow-lg');
      if (metadataSection) {
        metadataSection.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50');
        setTimeout(() => {
          metadataSection.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50');
        }, 2000);
      }
      
      hapticFeedback.error();
      // Delay alert to let scroll complete
      setTimeout(() => {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }, 300);
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
          const storeMapping = compStoreMapping.find((row: any) =>
            normalizeId(row['Store ID']) === storeIdNorm
          );

          if (storeMapping) {
            detectedRegion = storeMapping['Region'] || '';
          } else {
            console.warn(`❌ No mapping found in Store_mapping for store ${metadata.storeId} (${metadata.storeName})`);
          }
        } else {
          console.warn(`❌ No store ID provided for region detection`);
        }
      } catch (error) {
        console.warn('Could not load comprehensive store mapping for region detection:', error);
      }

      // Map all parameters correctly
      const params: any = {
        // Basic Metadata
        submissionTime: new Date().toISOString(),
        hrName: metadata.hrName || '',
        hrId: metadata.hrId || '',
        amName: metadata.amName || '',
        amId: metadata.amId || '',
        trainerName: metadata.trainerName || '',
        trainerId: metadata.trainerId || metadata.trainerName || '',
        storeName: metadata.storeName || '',
        storeId: metadata.storeId || '',
        region: detectedRegion || 'Unknown',
        
        // Extended Metadata (BSC and Store Details)
        bscAchievement: metadata.bscAchievement || '',
        peopleOnShift: metadata.peopleOnShift || '',
        manpowerFulfilment: metadata.manpowerFulfilment || '',
        storeFormat: metadata.storeFormat || '',
        menuType: metadata.menuType || '',
        priceGroup: metadata.priceGroup || '',
        
        // Scoring (Multiple formats to match all script versions)
        totalScore: score.toString(),
        maxScore: maxScore.toString(),
        percentageScore: percentage.toString(),
        overallScore: percentage.toString(), // For compatibility with older scripts
        percentage: percentage.toString(),    // For extra safety
        
        // Remarks
        remarks: Object.values(sectionRemarks).filter(r => r).join(' | '),
        imageUpload: ''
      };

      // Add all question responses with multiple formats to ensure logging success
      sections.forEach((section) => {
        section.items.forEach((item) => {
          const value = responses[item.id] || '';
          params[item.id] = value;
          
          // Also handle the mapping from OTA_101 style to OTA_1 style if needed
          const shortId = item.id.replace(/_(\d)0(\d)$/, '_$2').replace(/_(\d)(\d)(\d)$/, '_$2$3');
          if (shortId !== item.id) {
            params[shortId] = value;
          }
        });

        // Add section remarks and scores
        const sectionScore = getSectionScore(section);
        const sectionPercentage = sectionScore.maxScore > 0
          ? Math.round((sectionScore.score / sectionScore.maxScore) * 100).toString()
          : "0";

        // Add section scores in multiple formats
        const sectionId = section.id.toUpperCase();
        params[`${section.id.toLowerCase()}_remarks`] = sectionRemarks[section.id] || '';
        params[`${section.id}_remarks`] = sectionRemarks[section.id] || '';
        
        // Multi-format section scores to ensure log success
        const scoreStr = sectionPercentage.toString();
        params[`${sectionId}_Score`] = scoreStr;
        params[`${section.id}_Score`] = scoreStr;
        params[`${section.id.toLowerCase()}Score`] = scoreStr;
        params[`${sectionId}Score`] = scoreStr;
      });

      // Convert to URL-encoded format - CRITICAL: Use plain application/x-www-form-urlencoded
      const body = Object.keys(params).map(k =>
        encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
      ).join('&');

      console.log('📤 Submitting AM Operations Checklist...');
      console.log('📤 Endpoint:', AM_OPS_LOG_ENDPOINT);
      console.log('📤 Data size:', body.length, 'bytes');

      try {
        const response = await fetch(AM_OPS_LOG_ENDPOINT, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded' 
          },
          body,
          mode: 'no-cors'
        });

        console.log('✅ Submission request sent successfully');
        setSubmitted(true);
        localStorage.removeItem('operations_checklist_responses');
        localStorage.removeItem('operations_checklist_metadata');
        localStorage.removeItem('operations_section_remarks');
        localStorage.removeItem('operations_section_images');
        hapticFeedback.success();
      } catch (fetchError) {
        console.error('❌ Network error during submission:', fetchError);
        alert('Could not reach the logging server. Please check your internet connection.');
      }
    } catch (error) {
      console.error('❌ Error submitting AM Operations Checklist:', error);
      alert('Failed to submit checklist. Please try again. Check console for details.');
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

  const generatePDF = async () => {
    const { score, maxScore, percentage } = calculateScore();
    
    // Prepare submission data for builder
    const submissionData = {
      ...responses,
      submissionTime: new Date().toLocaleString(),
      ...metadata,
      totalScore: score.toString(),
      maxScore: maxScore.toString(),
      percentageScore: percentage.toString(),
    };

    // Add section remarks
    Object.keys(sectionRemarks).forEach(key => {
      submissionData[`${key.toLowerCase()}_remarks`] = sectionRemarks[key];
    });

    // Detect region
    let region = 'Unknown';
    try {
      if (metadata.storeId) {
        const sid = metadata.storeId.toString().trim().toUpperCase();
        const mapping = compStoreMapping.find((m: any) => 
          (m['Store ID'] || '').toString().trim().toUpperCase() === sid
        );
        if (mapping) region = mapping.Region || 'Unknown';
      }
    } catch (e) {}

    const pdfMetadata = {
      ...metadata,
      date: new Date().toLocaleString(),
      region
    };

    const doc = await buildOperationsPDF(
      [submissionData],
      pdfMetadata,
      { title: 'AM Operations Audit Report' },
      sectionImages
    );

    doc.save(`operations_audit_${metadata.storeName}_${Date.now()}.pdf`);
  };

  const calculateScore = () => {
    let score = 0;
    let maxScore = 0;

    sections.forEach(section => {
      section.items.forEach(item => {
        const questionKey = item.id;
        const response = responses[questionKey];

        // Regular questions use yes/no/na scoring
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
      const questionKey = item.id;
      const response = responses[questionKey];

      // Regular questions use yes/no/na scoring
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
        storeFormat: '',
        menuType: '',
        priceGroup: ''
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
      storeFormat: '',
      menuType: '',
      priceGroup: ''
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
              onClick={generatePDF}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
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
    <div className="px-4 py-6 md:p-6 space-y-6 max-w-6xl mx-auto mb-20">
      {/* Submitting Banner */}
      {isLoading && (
        <div className="fixed inset-x-0 top-0 z-[9999] bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 shadow-2xl border-b-4 border-orange-600">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
            <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
            <span className="text-lg font-bold tracking-wide">Submitting...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 md:p-6 border border-orange-200 dark:border-orange-800">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          🍽️ AM Operations Checklist
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-slate-400">
          Flat scoring: Yes=1, No=0. N/A is excluded.
        </p>
      </div>

      {/* Metadata */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Audit Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
          {/* HR Field - Disabled when auto-filled from EMPID */}
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
                placeholder="Auto-filled from EMPID"
                disabled={!!metadata.hrId}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 pr-8 disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHrDropdown(!showHrDropdown);
                }}
                disabled={!!metadata.hrId}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▼
              </button>
              {showHrDropdown && !metadata.hrId && (
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

          {/* Area Manager Field - Disabled when from URL EMPID */}
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
                placeholder="Select or type area manager name"
                disabled={!!metadata.amId && new URLSearchParams(window.location.search).has('EMPID')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 pr-8 disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAmDropdown(!showAmDropdown);
                }}
                disabled={!!metadata.amId && new URLSearchParams(window.location.search).has('EMPID')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▼
              </button>
              {showAmDropdown && !(!!metadata.amId && new URLSearchParams(window.location.search).has('EMPID')) && (
                <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredAM.length > 0 ? (
                    filteredAM.map((am) => (
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
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 dark:text-slate-400 text-sm">
                      No Area Managers found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Trainer Field - Disabled when auto-filled from EMPID */}
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
                placeholder="Auto-filled from EMPID"
                disabled={!!metadata.trainerId}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 pr-8 disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTrainerDropdown(!showTrainerDropdown);
                }}
                disabled={!!metadata.trainerId}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▼
              </button>
              {showTrainerDropdown && !metadata.trainerId && (
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
                        // Find the full store data from compStoreMapping
                        const storeData = compStoreMapping.find((s: any) =>
                          s['Store Name'] === store.name || s['Store ID'] === store.id
                        );

                        console.log('🏪 Selected store:', store.name);
                        console.log('🔍 Store data from mapping:', storeData);
                        console.log('📋 Store Format:', storeData?.['Store Format']);
                        console.log('📋 Menu Type:', storeData?.['Menu Type']);
                        console.log('📋 Price Group:', storeData?.['Price Group']);

                        // Auto-populate all fields from Store_mapping sheet
                        setMetadata(prev => ({
                          ...prev,
                          storeName: store.name,
                          storeId: store.id,
                          storeFormat: storeData?.['Store Format'] || '',
                          menuType: storeData?.['Menu Type'] || '',
                          priceGroup: storeData?.['Price Group'] || ''
                        }));
                        setStoreSearchTerm(store.name);
                        // Keep dropdown open after selection
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

          {/* Store Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store Format:</label>
            <input
              type="text"
              value={metadata.storeFormat}
              disabled
              placeholder="Auto-filled from store selection"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 cursor-not-allowed"
            />
          </div>

          {/* Menu Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Menu Type:</label>
            <input
              type="text"
              value={metadata.menuType}
              disabled
              placeholder="Auto-filled from store selection"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 cursor-not-allowed"
            />
          </div>

          {/* Price Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Price Group:</label>
            <input
              type="text"
              value={metadata.priceGroup}
              disabled
              placeholder="Auto-filled from store selection"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* sections */}
      {sections.map((section) => {
        const sectionScore = getSectionScore(section);
        return (
          <div key={section.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-slate-100 uppercase tracking-tight">
                {section.title}
              </h2>
              <div className="text-xs md:text-sm font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-3 py-1 rounded-full">
                Score: {sectionScore.score} / {sectionScore.maxScore}
              </div>
            </div>

            <div className="space-y-4">
              {section.items.map((item, index) => {
                const questionKey = item.id;
                return (
                  <div 
                    key={item.id} 
                    id={questionKey}
                    className="p-3 md:p-4 border border-gray-200 dark:border-slate-600 rounded-xl hover:border-orange-300 transition-colors"
                  >
                    <div className="flex items-start mb-3">
                      <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full text-xs font-bold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-sm md:text-base text-gray-900 dark:text-slate-100 font-medium leading-snug">
                        {item.q}
                      </span>
                    </div>

                    <div className="sm:ml-10">
                      {/* Regular questions use yes/no/na system */}
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        {['yes', 'no', 'na'].map((option) => (
                          <label key={option} className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start space-x-2 cursor-pointer p-3 sm:p-0 bg-gray-50 dark:bg-slate-700/50 sm:bg-transparent rounded-lg border sm:border-0 border-gray-100 dark:border-slate-600">
                            <input
                              type="radio"
                              name={questionKey}
                              value={option}
                              checked={responses[questionKey] === option}
                              onChange={(e) => handleResponse(questionKey, e.target.value)}
                              className="w-5 h-5 text-orange-600 border-gray-300 dark:border-slate-600 focus:ring-orange-500"
                            />
                            <span className={`text-sm font-bold ${option === 'na' ? 'text-gray-500 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'
                              }`}>
                              {option.toUpperCase()}
                            </span>
                          </label>
                        ))}
                      </div>
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

      {/* Actions / Sticky Footer */}
      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-6xl mx-auto flex flex-row justify-between items-center gap-4">
          <button
            onClick={resetChecklist}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Reset Checklist"
          >
            <span className="text-2xl">🔄</span>
          </button>
          
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[10px] md:text-sm font-bold text-gray-500 mb-1">
              CURRENT SCORE: {score}/{maxScore} ({Math.round(percentage)}%)
            </div>
            <div className="w-full max-w-[200px] h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (Object.keys(responses).length / (sections.reduce((a, s) => a + s.items.length, 0))) * 100)}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 md:py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl font-bold text-sm md:text-base shadow-lg shadow-orange-200 dark:shadow-none transition-all active:scale-95"
          >
            {isLoading ? '...' : 'SUBMIT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationsChecklist;