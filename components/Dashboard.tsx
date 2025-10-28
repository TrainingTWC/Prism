import React, { useEffect, useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildTrainingPDF } from '../src/utils/trainingReport';
import { Users, Clipboard, GraduationCap, BarChart3 } from 'lucide-react';
import { Submission, Store } from '../types';
import { fetchSubmissions, fetchAMOperationsData, fetchTrainingData, fetchQAData, AMOperationsSubmission, TrainingAuditSubmission, QASubmission } from '../services/dataService';
import { hapticFeedback } from '../utils/haptics';
import StatCard from './StatCard';
import Loader from './Loader';
import SkeletonLoader from './SkeletonLoader';
import NotificationOverlay from './NotificationOverlay';
import ScoreDistributionChart from './ScoreDistributionChart';
import AverageScoreByManagerChart from './AverageScoreByManagerChart';
import { QUESTIONS, OPERATIONS_QUESTIONS, TRAINING_QUESTIONS, AREA_MANAGERS, HR_PERSONNEL, REGIONS, SENIOR_HR_ROLES } from '../constants';
import DashboardFilters from './DashboardFilters';
// import RCACapaAnalysis from './RCACapaAnalysis'; // Commented out - file not found
import RegionPerformanceInfographic from './RegionPerformanceInfographic';
import AMPerformanceInfographic from './AMPerformanceInfographic';
import HRPerformanceInfographic from './HRPerformanceInfographic';
import QuestionScoresInfographic from './QuestionScoresInfographic';
import AMRadarChart from './AMRadarChart';
// Operations Dashboard Components
import OperationsRegionPerformanceInfographic from './OperationsRegionPerformanceInfographic';
import OperationsAMPerformanceInfographic from './OperationsAMPerformanceInfographic';
import OperationsMetricsInfographic from './OperationsMetricsInfographic';
import OperationsHRPerformanceInfographic from './OperationsHRPerformanceInfographic';
import OperationsScoreDistributionChart from './OperationsScoreDistributionChart';
import OperationsAverageScoreChart from './OperationsAverageScoreChart';
import OperationsSectionScoresInfographic from './OperationsSectionScoresInfographic';
// Training Dashboard Components
import TrainingStorePerformanceChart from './TrainingStorePerformanceChart';
import TrainingRegionPerformanceInfographic from './TrainingRegionPerformanceInfographic';
import TrainingScoreDistributionChart from './TrainingScoreDistributionChart';
import TrainingAMPerformanceInfographic from './TrainingAMPerformanceInfographic';
import TrainingHRPerformanceInfographic from './TrainingHRPerformanceInfographic';
import TrainingAverageScoreChart from './TrainingAverageScoreChart';
import TrainingRadarChart from './TrainingRadarChart';
import TrainingHealthPieChart from './TrainingHealthPieChart';
import OperationsRadarChart from './OperationsRadarChart';
import TrainingDetailModal from './TrainingDetailModal';
import NowBarMobile from './NowBarMobile';
// Multi-Month Trends Components (Google Sheets Integration)
import HeaderSummary from '../src/components/dashboard/HeaderSummary';
import StoreTrends from '../src/components/dashboard/StoreTrends';
import { UniqueStoresPills } from '../src/components/dashboard/UniqueStoresPills';
import { HistoricTrendsSection } from '../src/components/dashboard/HistoricTrendsSection';
import { useTrendsData } from '../src/components/dashboard/useTrendsData';
// QA Dashboard Components
import QARegionPerformanceInfographic from './QARegionPerformanceInfographic';
import QAAuditorPerformanceInfographic from './QAAuditorPerformanceInfographic';
import QAScoreDistributionChart from './QAScoreDistributionChart';
import QASectionScoresInfographic from './QASectionScoresInfographic';
import QARadarChart from './QARadarChart';
import QAAMPerformanceInfographic from './QAAMPerformanceInfographic';
import QAAverageScoreChart from './QAAverageScoreChart';
import { UserRole, canAccessStore, canAccessAM, canAccessHR } from '../roleMapping';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole }) => {
  const { userRole: authUserRole, hasPermission, hasDashboardAccess } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [amOperationsData, setAMOperationsData] = useState<AMOperationsSubmission[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingAuditSubmission[]>([]);
  const [qaData, setQAData] = useState<QASubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [allAreaManagers, setAllAreaManagers] = useState<any[]>([]);
  const [allHRPersonnel, setAllHRPersonnel] = useState<any[]>([]);
  const [allTrainers, setAllTrainers] = useState<any[]>([]);
  const [hrMappingData, setHrMappingData] = useState<any[]>([]);
  const [compStoreMapping, setCompStoreMapping] = useState<any[] | null>(null);
  
  // Cache flags to track what data has been loaded
  const [dataLoadedFlags, setDataLoadedFlags] = useState({
    hr: false,
    operations: false,
    training: false,
    qa: false
  });
  
  const [filters, setFilters] = useState({
    region: '',
    store: '',
    am: '',
    trainer: '',
    health: ''
  });

  // Normalized trainer filter id for robust comparisons (handle h3595 vs H3595 etc.)
  const normalizeId = (v: any) => (v === undefined || v === null) ? '' : String(v).toUpperCase();
  const trainerFilterId = normalizeId(filters.trainer);

  // Monthly Trends data for Training Dashboard
  const { rows: trendsData, loading: trendsLoading } = useTrendsData();

  // Get available dashboard types based on user role
  const getAvailableDashboardTypes = () => {
    const allTypes = [
      { id: 'hr', label: 'HR Employee Surveys', access: 'hr-dashboard' },
      { id: 'operations', label: 'Operations Checklists', access: 'operations-dashboard' },
      { id: 'training', label: 'Training Audits', access: 'training-dashboard' },
      { id: 'qa', label: 'QA Assessments', access: 'qa-dashboard' },
      { id: 'finance', label: 'Finance Reports', access: 'finance-dashboard' },
      { id: 'consolidated', label: 'Consolidated View', access: 'all' }
    ];

    if (authUserRole === 'admin') {
      return allTypes; // Admin can see everything
    }

    return allTypes.filter(type => {
      if (type.id === 'consolidated') {
        // Show consolidated only if user has access to multiple dashboards
        return allTypes.filter(t => t.id !== 'consolidated' && hasDashboardAccess(t.access)).length > 1;
      }
      return hasDashboardAccess(type.access);
    });
  };

  const availableDashboardTypes = getAvailableDashboardTypes();

  // Dashboard type selection - default to first available type
  const [dashboardType, setDashboardType] = useState<string>(() => {
    const available = getAvailableDashboardTypes();
    return available.length > 0 ? available[0].id as any : 'consolidated';
  });

  // Notification overlay state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');

  // Training detail modal state
  const [showTrainingDetail, setShowTrainingDetail] = useState(false);
  const [trainingDetailFilter, setTrainingDetailFilter] = useState<{
    type: 'region' | 'am' | 'hr' | 'store' | 'section' | 'scoreRange';
    value: string;
    title: string;
  } | null>(null);

  // Training detail modal handlers
  const handleRegionClick = (region: string) => {
    console.log('handleRegionClick called with region:', region);
    console.log('filteredTrainingData:', filteredTrainingData?.length || 0);
    
    // Original modal functionality
    setTrainingDetailFilter({
      type: 'region',
      value: region,
      title: `${region} Region`
    });
    setShowTrainingDetail(true);
  };

  const handleTrainerClick = (trainerId: string, trainerName: string) => {
    // Original modal functionality
    setTrainingDetailFilter({
      type: 'am',
      value: trainerName,
      title: `Trainer: ${trainerName}`
    });
    setShowTrainingDetail(true);
  };

  const handleSectionClick = (sectionId: string, sectionTitle: string) => {
    // For section clicks, we'll show all data but highlight section performance
    setTrainingDetailFilter({
      type: 'section',
      value: sectionId,
      title: `Section: ${sectionTitle}`
    });
    setShowTrainingDetail(true);
  };

  const handleScoreRangeClick = (minScore: number, maxScore: number, label: string) => {
    console.log('Score range clicked:', label);
    setTrainingDetailFilter({
      type: 'scoreRange',
      value: `${minScore}-${maxScore}`,
      title: `Score Range: ${label}`
    });
    setShowTrainingDetail(true);
  };

  const handleStoreClick = (storeId: string, storeName: string) => {
    setTrainingDetailFilter({
      type: 'store',
      value: storeId,
      title: `Store: ${storeName}`
    });
    setShowTrainingDetail(true);
  };

  const closeTrainingDetail = () => {
    setShowTrainingDetail(false);
    setTrainingDetailFilter(null);
  };

  const handleTotalSubmissionsClick = async () => {
    // Ensure training data is loaded before showing the modal
    if (!trainingData || trainingData.length === 0) {
      console.log('Training data not loaded, fetching now...');
      try {
        const data = await fetchTrainingData();
        setTrainingData(data);
        console.log('✅ Loaded Training data for Total Submissions modal:', data.length);
      } catch (err) {
        console.error('❌ Failed to load Training data:', err);
        return; // Don't open modal if data loading fails
      }
    }
    
    setTrainingDetailFilter({
      type: 'region', // Use region type to show all data
      value: 'all',
      title: 'All Training Submissions'
    });
    setShowTrainingDetail(true);
  };

  const handleStoresCoveredClick = () => {
    setTrainingDetailFilter({
      type: 'region', // Use region type to show all data  
      value: 'all',
      title: 'All Stores Covered'
    });
    setShowTrainingDetail(true);
  };

  // Auto-populate filters from URL parameters - but only when explicitly intended for dashboard filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
  const trainerId = urlParams.get('hrId') || urlParams.get('hr_id');
  const trainerName = urlParams.get('hrName') || urlParams.get('hr_name');
    const storeId = urlParams.get('storeId') || urlParams.get('store_id');
    const amId = urlParams.get('amId') || urlParams.get('am_id');
    const region = urlParams.get('region');
    const dashboardFilter = urlParams.get('dashboardFilter'); // Only apply filters if this param exists
    
    // Only auto-populate filters if explicitly intended for dashboard (not when just passing HR for survey)
    if (dashboardFilter || storeId || amId || region) {
      setFilters(prev => ({
        ...prev,
        trainer: trainerId || prev.trainer,
        store: storeId || prev.store,
        am: amId || prev.am,
        region: region || prev.region
      }));
      console.log('Dashboard filters auto-populated from URL');
    } else {
      console.log('Skipping auto-filter population - no dashboardFilter param');
    }
  }, []);

  // Load stores, area managers, and HR personnel from hr_mapping.json
  useEffect(() => {
    const loadMappingData = async () => {
      try {
  const base = (import.meta as any).env?.BASE_URL || '/';
  const response = await fetch(`${base}hr_mapping.json`);
        const mappingData = await response.json();
        setHrMappingData(mappingData);
        
        // Extract unique stores
        const storeMap = new Map();
        const amMap = new Map();
        const hrMap = new Map();
        
        mappingData.forEach((item: any) => {
          // Stores
          if (!storeMap.has(item.storeId)) {
            storeMap.set(item.storeId, {
              name: item.locationName,
              id: item.storeId,
              region: item.region
            });
          }
          
          // Area Managers
          if (item.areaManagerId && !amMap.has(item.areaManagerId)) {
            // Find the AM name from constants or use ID
            const amFromConstants = AREA_MANAGERS.find(am => am.id === item.areaManagerId);
            amMap.set(item.areaManagerId, {
              name: amFromConstants?.name || `AM ${item.areaManagerId}`,
              id: item.areaManagerId
            });
          }
          
          // HR Personnel (HRBP, Regional HR, HR Head)
          [
            { id: item.hrbpId, type: 'HRBP' },
            { id: item.regionalHrId, type: 'Regional HR' },
            { id: item.hrHeadId, type: 'HR Head' },
            { id: item.lmsHeadId, type: 'LMS Head' }
          ].forEach(({ id, type }) => {
            if (id && !hrMap.has(id)) {
              const hrFromConstants = HR_PERSONNEL.find(hr => hr.id === id);
              hrMap.set(id, {
                name: hrFromConstants?.name || `${type} ${id}`,
                id: id
              });
            }
          });
        });
        
        const stores = Array.from(storeMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        const areaManagers = Array.from(amMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  const hrPersonnel = Array.from(hrMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setAllStores(stores);
        setAllAreaManagers(areaManagers);
        setAllHRPersonnel(hrPersonnel);

        // Also try to load comprehensive trainer mapping and prefer its trainer names
        try {
          const compResp = await fetch(`${base}comprehensive_store_mapping.json`);
          console.log('Dashboard - Fetching comprehensive mapping from:', `${base}comprehensive_store_mapping.json`);
          if (compResp.ok) {
            const comp = await compResp.json();
            setCompStoreMapping(comp);
            console.log('Dashboard - Comprehensive mapping loaded, entries:', comp.length);
            // Build a map of Trainer ID -> occurrences
            const trainerIds = new Set<string>();
            comp.forEach((row: any) => {
              if (row.Trainer) trainerIds.add(String(row.Trainer).toUpperCase());
            });
            console.log('Dashboard - Trainer IDs found:', Array.from(trainerIds));

            // User-provided mapping overrides (ID -> Name) - ACTUAL TRAINERS
            const provided: Record<string, string> = {
              'H1761': 'Mahadev',
              'H701': 'Mallika', 
              'H1697': 'Sheldon',
              'H1169': 'Hema',
              'H2595': 'Kailash',
              'H3595': 'Bhawna', 
              'H3252': 'Priyanka',
              'H1278': 'Viraj',
              'H3247': 'Sunil'
            };

            const trainersArr: any[] = [];
            trainerIds.forEach((tid) => {
              const nameFromProvided = provided[tid.toUpperCase()];
              // try to find in hrPersonnel as fallback
              const found = hrPersonnel.find((h: any) => String(h.id).toUpperCase() === tid);
              const name = nameFromProvided || found?.name || tid;
              trainersArr.push({ id: tid, name });
            });
            console.log('Dashboard - Built trainersArr:', trainersArr);

            // Sort by name
            trainersArr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
            console.log('Dashboard - Using custom trainer mapping:', trainersArr);
            setAllTrainers(trainersArr);
          } else {
            // Fallback: use HR personnel names where trainer ids appear
            console.log('Dashboard - Using fallback HR personnel for trainers');
            const fallbackTrainers = Array.from(new Set(Array.from(hrMap.values()).map((h:any)=>h.id))).map((id:any)=>({ id, name: (HR_PERSONNEL.find(x=>x.id===id)?.name || id) }));
            console.log('Dashboard - Fallback trainers:', fallbackTrainers);
            setAllTrainers(fallbackTrainers);
          }
        } catch (err) {
          // On any error, fallback to using HR personnel constants
          console.log('Dashboard - Error loading comprehensive mapping, using HR fallback:', err);
          const fallbackTrainers = Array.from(new Set(Array.from(hrMap.values()).map((h:any)=>h.id))).map((id:any)=>({ id, name: (HR_PERSONNEL.find(x=>x.id===id)?.name || id) }));
          console.log('Dashboard - Error fallback trainers:', fallbackTrainers);
          setAllTrainers(fallbackTrainers);
        }
        
        console.log(`Dashboard loaded ${stores.length} stores, ${areaManagers.length} AMs, ${hrPersonnel.length} HR personnel from mapping data`);
      } catch (error) {
        console.warn('Dashboard could not load mapping data:', error);
        // Fallback to constants
        setAllStores([
          { name: 'Defence Colony', id: 'S027' },
          { name: 'Khan Market', id: 'S037' },
          { name: 'UB City', id: 'S007' },
          { name: 'Koramangala 1', id: 'S001' }
        ]);
        setAllAreaManagers(AREA_MANAGERS);
        setAllHRPersonnel(HR_PERSONNEL);
      }
    };
    
    loadMappingData();
  }, []);

  const loadData = async (isRefresh = false, specificDashboard?: string) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Determine which data to load based on user role and current dashboard
      const targetDashboard = specificDashboard || dashboardType;
      const isAdmin = userRole.role === 'admin';
      
      // Smart loading: only load data relevant to current view
      // NO PRELOADING - load only what's needed for the current dashboard
      const loadPromises: Promise<any>[] = [];
      
      // Load HR survey data ONLY if currently viewing HR dashboard OR consolidated view
      if ((targetDashboard === 'hr' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.hr || isRefresh)) {
        loadPromises.push(
          fetchSubmissions().then(data => {
            console.log('✅ Loaded HR survey data:', data.length, 'submissions');
            setSubmissions(data);
            setDataLoadedFlags(prev => ({ ...prev, hr: true }));
          }).catch(err => {
            console.error('❌ Failed to load HR data:', err);
          })
        );
      } else if (targetDashboard === 'hr' && dataLoadedFlags.hr) {
        console.log('♻️ Using cached HR data');
      }
      
      // Load AM Operations data ONLY if currently viewing Operations dashboard OR consolidated view
      if ((targetDashboard === 'operations' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.operations || isRefresh)) {
        loadPromises.push(
          fetchAMOperationsData().then(data => {
            console.log('✅ Loaded AM Operations data:', data.length, 'submissions');
            setAMOperationsData(data);
            setDataLoadedFlags(prev => ({ ...prev, operations: true }));
          }).catch(err => {
            console.error('❌ Failed to load AM Operations data:', err);
          })
        );
      } else if (targetDashboard === 'operations' && dataLoadedFlags.operations) {
        console.log('♻️ Using cached Operations data');
      }
      
      // Load Training Audit data ONLY if currently viewing Training dashboard OR consolidated view
      if ((targetDashboard === 'training' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.training || isRefresh)) {
        loadPromises.push(
          fetchTrainingData().then(data => {
            console.log('✅ Loaded Training Audit data:', data.length, 'submissions');
            setTrainingData(data);
            setDataLoadedFlags(prev => ({ ...prev, training: true }));
          }).catch(err => {
            console.error('❌ Failed to load Training data:', err);
          })
        );
      } else if (targetDashboard === 'training' && dataLoadedFlags.training) {
        console.log('♻️ Using cached Training data');
      }
      
      // Load QA Assessment data ONLY if currently viewing QA dashboard OR consolidated view
      if ((targetDashboard === 'qa' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.qa || isRefresh)) {
        loadPromises.push(
          fetchQAData().then(data => {
            console.log('✅ Loaded QA Assessment data:', data.length, 'submissions');
            if (data.length > 0) {
              console.log('QA data sample:', data[0]);
            }
            setQAData(data);
            setDataLoadedFlags(prev => ({ ...prev, qa: true }));
          }).catch(err => {
            console.error('❌ Failed to load QA data:', err);
          })
        );
      } else if (targetDashboard === 'qa' && dataLoadedFlags.qa) {
        console.log('♻️ Using cached QA data');
      }
      
      // If no promises to load, we're using all cached data
      if (loadPromises.length === 0) {
        console.log('All data loaded from cache - no network requests needed!');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Load all promises in parallel for better performance
      await Promise.all(loadPromises);
      
      setError(null);
      setLastRefresh(new Date());
      
      if (isRefresh) {
        console.log('Data refreshed from Google Sheets');
      }
    } catch (err) {
      setError('Failed to load submission data.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Load data immediately for current dashboard
    loadData(false, dashboardType);
  }, []);

  // Load additional data when dashboard type changes
  useEffect(() => {
    loadData(false, dashboardType);
  }, [dashboardType]);

  const handleRefresh = () => {
    loadData(true);
  };

  // Listen for manual mobile refresh events dispatched from compact bar
  useEffect(() => {
    const onMobileRefresh = () => handleRefresh();
    window.addEventListener('prism-refresh', onMobileRefresh as any);
    return () => window.removeEventListener('prism-refresh', onMobileRefresh as any);
  }, [handleRefresh]);

  const availableStores = useMemo(() => {
  let stores = allStores;
    
    // Filter by region first
    if (filters.region) {
      stores = stores.filter(s => s.region === filters.region);
    }
    
    // Filter by user role permissions
    stores = stores.filter(store => canAccessStore(userRole, store.id));
    
  // If Area Manager is selected, filter stores based on AM mapping
    if (filters.am && hrMappingData.length > 0) {
      console.log('Filtering Stores for Area Manager:', filters.am);
      
      // Get stores that belong to this Area Manager
      const amStoreIds = hrMappingData
        .filter((mapping: any) => mapping.areaManagerId === filters.am)
        .map((mapping: any) => mapping.storeId);
      
      stores = stores.filter(store => amStoreIds.includes(store.id));
      console.log(`Found ${stores.length} stores for AM ${filters.am}:`, stores);
    }
    // If Trainer is selected but no AM, show stores under that Trainer using comprehensive mapping
    else if (trainerFilterId && compStoreMapping && compStoreMapping.length > 0) {
      console.log('Filtering Stores for Trainer via comprehensive mapping:', trainerFilterId);
      const trainerStoreIds = compStoreMapping
        .filter((m: any) => normalizeId(m.Trainer) === trainerFilterId)
        .map((m: any) => (m['Store ID'] || m.storeId || m.StoreID || m.store_id));
      const uniqueIds = new Set(trainerStoreIds.filter(Boolean));
      stores = stores.filter(store => uniqueIds.has(store.id));
      console.log(`Found ${stores.length} stores for Trainer ${trainerFilterId}:`, stores);
    }
    
    return stores;
  }, [filters.region, filters.am, filters.trainer, userRole, allStores, hrMappingData]);

  const availableAreaManagers = useMemo(() => {
    let areaManagers = allAreaManagers.filter(am => canAccessAM(userRole, am.id));
    
    // If HR is selected, filter AMs based on HR mapping
    if (trainerFilterId) {
      console.log('Filtering Area Managers for Trainer via comprehensive mapping:', trainerFilterId);
      // If comp mapping available, use it to find AM IDs
      if (compStoreMapping && compStoreMapping.length > 0) {
        const amIds = new Set<string>();
        compStoreMapping.forEach((m: any) => {
          if (normalizeId(m.Trainer) === trainerFilterId) {
            const am = m.AM || m.am || m.areaManager || m.AMId || m.amId;
            if (am) amIds.add(String(am));
          }
        });
        if (amIds.size > 0) {
          areaManagers = areaManagers.filter(am => amIds.has(am.id));
          console.log(`Found ${areaManagers.length} Area Managers for Trainer ${trainerFilterId}:`, areaManagers);
        }
      }
    }
    
    return areaManagers;
  }, [userRole, allAreaManagers, filters.trainer, hrMappingData, compStoreMapping]);

  const availableHRPersonnel = useMemo(() => {
    return allHRPersonnel.filter(hr => canAccessHR(userRole, hr.id));
  }, [userRole, allHRPersonnel]);

  // expose availableTrainers as same list for downstream components
  const availableTrainers = availableHRPersonnel;

  // Listen for manual mobile refresh events dispatched from compact bar
  useEffect(() => {
    const onMobileRefresh = () => handleRefresh();
    window.addEventListener('prism-refresh', onMobileRefresh as any);
    return () => window.removeEventListener('prism-refresh', onMobileRefresh as any);
  }, [handleRefresh]);

  const availableRegions = useMemo(() => {
    if (userRole.region) {
      return [userRole.region];
    }
    return REGIONS;
  }, [userRole]);

  const filteredData = useMemo(() => {
    if (!submissions) return null;

    console.log('Dashboard filtering - userRole:', userRole);
    console.log('Dashboard filtering - raw submissions:', submissions.length);

    let filtered = [...submissions];

    // Apply role-based filtering
    if (userRole) {
      const beforeRoleFilter = filtered.length;
      filtered = filtered.filter(submission => 
        canAccessStore(userRole, submission.storeID)
      );
      console.log(`Role filtering: ${beforeRoleFilter} -> ${filtered.length} submissions`);
    }

    // Filter by region
    if (filters.region) {
      const beforeRegionFilter = filtered.length;
      filtered = filtered.filter(submission => {
        const store = allStores.find(s => s.id === submission.storeID);
        return store && store.region === filters.region;
      });
      console.log(`Region filter (${filters.region}): ${beforeRegionFilter} -> ${filtered.length} submissions`);
    }

    // Filter by store
    if (filters.store) {
      const beforeStoreFilter = filtered.length;
      filtered = filtered.filter(submission => submission.storeID === filters.store);
      console.log(`Store filter (${filters.store}): ${beforeStoreFilter} -> ${filtered.length} submissions`);
    }

    // Filter by area manager
    if (filters.am) {
      const beforeAMFilter = filtered.length;
      filtered = filtered.filter(submission => submission.amId === filters.am);
      console.log(`AM filter (${filters.am}): ${beforeAMFilter} -> ${filtered.length} submissions`);
    }

    // Filter by HR personnel
    if (trainerFilterId) {
      const beforeTrainerFilter = filtered.length;
  filtered = filtered.filter(submission => normalizeId(submission.hrId) === trainerFilterId || normalizeId((submission as any).trainerId) === trainerFilterId || normalizeId((submission as any).trainer) === trainerFilterId);
      console.log(`Trainer filter (${filters.trainer} -> ${trainerFilterId}): ${beforeTrainerFilter} -> ${filtered.length} submissions`);
    }

    console.log('Final filtered submissions:', filtered.length);
    return filtered;
  }, [submissions, filters, userRole, allStores]);

  const filteredSubmissions = filteredData || [];

  // Filter AM Operations data
  const filteredAMOperations = useMemo(() => {
    if (!amOperationsData) return [];
    
    console.log('Dashboard filtering AM Operations - userRole:', userRole);
    console.log('Dashboard filtering AM Operations - raw data:', amOperationsData.length);
    
    let filtered = amOperationsData.filter((submission: AMOperationsSubmission) => {
      // Role-based access control
      if (userRole.role === 'store') {
        if (!canAccessStore(userRole, submission.storeId)) {
          return false;
        }
      } else if (userRole.role === 'area_manager') {
        if (!canAccessAM(userRole, submission.amId)) {
          return false;
        }
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        if (!canAccessHR(userRole, submission.hrId)) {
          return false;
        }
      }
      
      // Apply filters
      if (filters.region && submission.region !== filters.region) {
        return false;
      }
      
      if (filters.store && submission.storeId !== filters.store) {
        return false;
      }
      
      if (filters.am && submission.amId !== filters.am) {
        return false;
      }
      
      if (filters.trainer && submission.hrId !== filters.trainer) {
        return false;
      }
      
      return true;
    });
    
    console.log('Dashboard filtering AM Operations - filtered:', filtered.length);
    return filtered;
  }, [amOperationsData, filters, userRole]);

  // Filter Training Audit data
  const filteredTrainingData = useMemo(() => {
    if (!trainingData) return [];
    
    console.log('Dashboard filtering Training Audit - userRole:', userRole);
    console.log('Dashboard filtering Training Audit - raw data:', trainingData.length);
    
    let filtered = trainingData.filter((submission: TrainingAuditSubmission) => {
      // Role-based access control (same as AM Operations but with trainer focus)
      if (userRole.role === 'store') {
        if (!canAccessStore(userRole, submission.storeId)) {
          return false;
        }
      } else if (userRole.role === 'area_manager') {
        if (!canAccessAM(userRole, submission.amId)) {
          return false;
        }
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        // For training audit, trainers can also act as HR for access
        if (!canAccessHR(userRole, submission.amId)) { // Use amId as trainer check
          return false;
        }
      }
      
      // Apply filters
      if (filters.region && submission.region !== filters.region) {
        return false;
      }
      
      if (filters.store && submission.storeId !== filters.store) {
        return false;
      }
      
      if (filters.am && submission.amId !== filters.am) {
        return false;
      }
      
      // For training, trainer filter maps to trainer field
      if (trainerFilterId) {
        const sTrainer = normalizeId((submission as any).trainerId) || normalizeId((submission as any).trainer) || normalizeId(submission.hrId);
        if (!sTrainer || sTrainer !== trainerFilterId) return false;
      }

      // Apply store health semantic filter if provided
      if (filters.health) {
        const pct = parseFloat(submission.percentageScore || '0');
        if (filters.health === 'Needs Attention' && pct >= 56) return false;
        if (filters.health === 'Brewing' && (pct < 56 || pct >= 81)) return false;
        if (filters.health === 'Perfect Shot' && pct < 81) return false;
      }
      
      return true;
    });
    
    console.log('Dashboard filtering Training Audit - filtered:', filtered.length);

    // Deduplicate by storeId: keep only the latest submission per store
    const parseTime = (t: any) => {
      try {
        if (!t) return 0;
        if (t instanceof Date) return t.getTime();
        if (typeof t === 'number') return t;
        if (typeof t === 'string') {
          // Try ISO or common formats
          if (t.includes('T') || t.includes('-')) {
            const dt = new Date(t);
            return isNaN(dt.getTime()) ? 0 : dt.getTime();
          }
          // numeric string timestamp
          if (!isNaN(Number(t))) {
            return Number(t);
          }
          // fallback: Date parse
          const dt = new Date(t);
          return isNaN(dt.getTime()) ? 0 : dt.getTime();
        }
      } catch (err) {
        return 0;
      }
      return 0;
    };

    const latestByStore = new Map<string, any>();
    filtered.forEach((submission: any) => {
      const storeId = submission.storeId || submission.storeID || submission.store_id || '';
      if (!storeId) return; // skip entries without store id

      const existing = latestByStore.get(storeId);
      const existingTime = existing ? parseTime(existing.submissionTime) : 0;
      const thisTime = parseTime(submission.submissionTime);

      if (!existing || thisTime >= existingTime) {
        latestByStore.set(storeId, submission);
      }
    });

    const deduped = Array.from(latestByStore.values());
    console.log('Dashboard filtering Training Audit - deduped by store:', deduped.length);
    return deduped;
  }, [trainingData, filters, userRole]);

  // Filter QA Assessment data
  const filteredQAData = useMemo(() => {
    if (!qaData) {
      return [];
    }
    
    let filtered = qaData.filter((submission: QASubmission) => {
      // Role-based access control
      if (userRole.role === 'store') {
        if (!canAccessStore(userRole, submission.storeId)) {
          return false;
        }
      } else if (userRole.role === 'area_manager') {
        if (!canAccessAM(userRole, submission.amId)) {
          return false;
        }
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        if (!canAccessHR(userRole, submission.amId)) {
          return false;
        }
      }
      
      // Apply filters
      if (filters.region && submission.region !== filters.region) {
        return false;
      }
      
      if (filters.store && submission.storeId !== filters.store) {
        return false;
      }
      
      if (filters.am && submission.amId !== filters.am) {
        return false;
      }
      
      // For QA, hr filter can map to qaId
      if (filters.trainer && submission.qaId !== filters.trainer) {
        return false;
      }
      
      return true;
    });
    
    return filtered;
  }, [qaData, filters, userRole]);

  const stats = useMemo(() => {
    // For QA dashboard, use QA Assessment data
    if (dashboardType === 'qa') {
      if (!filteredQAData) return null;

      const totalSubmissions = filteredQAData.length;
      const avgScore = totalSubmissions > 0 
        ? filteredQAData.reduce((acc, s) => acc + parseFloat(s.scorePercentage || '0'), 0) / totalSubmissions 
        : 0;
      const uniqueAuditors = new Set(filteredQAData.map(s => s.qaId)).size;
      const uniqueStores = new Set(filteredQAData.map(s => s.storeId)).size;

      return {
        totalSubmissions,
        avgScore: Math.round(avgScore * 100) / 100,
        uniqueAuditors,
        uniqueStores
      };
    }
    
    // For Training dashboard, prefer filtered Training Audit records when any filter is applied
    if (dashboardType === 'training') {
      // If a filter is active, use the deduped, filtered training data so the header cards change
  const hasFilters = Boolean(filters.region || filters.store || filters.am || filters.trainer || filters.health);

      if (hasFilters) {
        // If a specific store filter is applied, we must count ALL submissions for that store
        // (not the deduped latest-per-store view). This ensures store-level totals reflect every
        // submission (percentage rows) recorded for that store.
        let rawFiltered: any[] = [];
        if (trainingData && trainingData.length > 0) {
          rawFiltered = trainingData.filter((submission: any) => {
            // Role-based access
            if (userRole.role === 'store' && !canAccessStore(userRole, submission.storeId)) return false;
            if (userRole.role === 'area_manager' && !canAccessAM(userRole, submission.amId)) return false;
            if ((userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') && !canAccessHR(userRole, submission.amId)) return false;

            // Apply filters (same semantics as filteredTrainingData but WITHOUT deduplication)
            if (filters.region && submission.region !== filters.region) return false;
            if (filters.store && (submission.storeId !== filters.store && submission.storeID !== filters.store && submission.store_id !== filters.store)) return false;
            if (filters.am && submission.amId !== filters.am) return false;
            if (trainerFilterId) {
              const sTrainer = normalizeId((submission as any).trainerId) || normalizeId((submission as any).trainer) || normalizeId(submission.hrId);
              if (!sTrainer || sTrainer !== trainerFilterId) return false;
            }

            if (filters.health) {
              const pct = parseFloat(submission.percentageScore || submission.percentage_score || '0');
              if (filters.health === 'Needs Attention' && pct >= 56) return false;
              if (filters.health === 'Brewing' && (pct < 56 || pct >= 81)) return false;
              if (filters.health === 'Perfect Shot' && pct < 81) return false;
            }

            return true;
          });
        }

        const totalSubmissions = rawFiltered.length;
        const uniqueStores = new Set(rawFiltered.map((r: any) => r.storeId || r.storeID || r.store_id)).size;
  const uniqueTrainers = new Set(rawFiltered.map((r: any) => normalizeId(r.trainerId) || normalizeId(r.trainer_id) || normalizeId(r.trainer) || normalizeId(r.hrId))).size;

        // Determine per-store latest and previous scores using cutoffs so each store contributes once
        const parseTime = (t: any) => {
          try {
            if (!t) return 0;
            if (t instanceof Date) return t.getTime();
            if (typeof t === 'number') return t;
            if (typeof t === 'string') {
              if (t.includes('T') || t.includes('-')) {
                const dt = new Date(t);
                return isNaN(dt.getTime()) ? 0 : dt.getTime();
              }
              if (!isNaN(Number(t))) return Number(t);
              const dt = new Date(t);
              return isNaN(dt.getTime()) ? 0 : dt.getTime();
            }
          } catch (err) {
            return 0;
          }
          return 0;
        };

        const cutoffNow = lastRefresh ? new Date(lastRefresh) : new Date();
        const cutoffPrev = new Date(cutoffNow.getFullYear(), cutoffNow.getMonth(), 0, 23, 59, 59, 999);

        const perStoreMap: Map<string, { time: number; score: number }[]> = new Map();
        rawFiltered.forEach((r: any) => {
          const sid = r.storeId || r.storeID || r.store_id || '';
          if (!sid) return;
          const time = parseTime(r.submissionTime || r.submission_time || r.submitted_at || '');
          const score = parseFloat(r.percentageScore || r.percentage_score || r.percentage || '0') || 0;
          if (!perStoreMap.has(sid)) perStoreMap.set(sid, []);
          perStoreMap.get(sid)!.push({ time, score });
        });

        const latestVals: number[] = [];
        const prevVals: number[] = [];

        perStoreMap.forEach(arr => {
          const upToNow = arr.filter(x => x.time <= cutoffNow.getTime()).sort((a, b) => a.time - b.time);
          if (upToNow.length > 0) latestVals.push(upToNow[upToNow.length - 1].score);

          const upToPrev = arr.filter(x => x.time <= cutoffPrev.getTime()).sort((a, b) => a.time - b.time);
          if (upToPrev.length > 0) prevVals.push(upToPrev[upToPrev.length - 1].score);
        });

  let headerLatestScore = latestVals.length > 0 ? Math.round(latestVals.reduce((s, x) => s + x, 0) / latestVals.length) : null;
  let headerPreviousScore = prevVals.length > 0 ? Math.round(prevVals.reduce((s, x) => s + x, 0) / prevVals.length) : null;

        // If we don't have a previous score from raw submissions and a single store is selected,
        // try to pick latest/previous from monthly trends (trendsData) which stores historical percentages per store.
  if ((headerPreviousScore === null || headerPreviousScore === undefined) && filters.store && trendsData && !trendsLoading) {
          try {
            const storePctRows = trendsData
              .filter((r: any) => (r.metric_name === 'percentage' || r.metric_name === 'Percentage') && (r.store_id === filters.store || r.store_id === (filters.store as any)))
              .map((r: any) => ({ period: r.observed_period, value: parseFloat(r.metric_value) || 0 }))
              .filter((r: any) => r.period)
              .sort((a: any, b: any) => (a.period > b.period ? 1 : a.period < b.period ? -1 : 0));

            if (storePctRows.length > 0) {
              const last = storePctRows[storePctRows.length - 1];
              const secondLast = storePctRows.length > 1 ? storePctRows[storePctRows.length - 2] : null;
              // If no raw latest exists, use trends latest as fallback
              if ((headerLatestScore === null || headerLatestScore === undefined) && last) {
                headerLatestScore = Math.round(last.value);
              }
              // If previous missing, try to get from trends (second last period)
              if ((headerPreviousScore === null || headerPreviousScore === undefined) && secondLast) {
                headerPreviousScore = Math.round(secondLast.value);
              }
            }
          } catch (e) {
            // ignore trends fallback errors
          }
        }

        return {
          totalSubmissions,
          // overall avg is mean of per-store latest values up to now
          avgScore: headerLatestScore,
          latestScore: headerLatestScore,
          previousScore: headerPreviousScore,
          uniqueEmployees: uniqueTrainers,
          uniqueStores: new Set(Array.from(perStoreMap.keys())).size
        };
      }

      // No filters: fall back to Monthly_Trends aggregated view (preserves historical monthly totals)
      if (!trendsData || trendsLoading) return null;

      // Filter to only percentage rows to avoid double counting
      // Each submission has 2 rows: one for 'score' and one for 'percentage'
      const percentageRows = trendsData.filter((r: any) => (r.metric_name || '').toLowerCase() === 'percentage');

      const totalSubmissions = percentageRows.length;

      // Calculate overall average score from all percentage rows
      const avgScore = totalSubmissions > 0
        ? percentageRows.reduce((acc: number, r: any) => acc + (parseFloat(r.metric_value) || 0), 0) / totalSubmissions
        : 0;

      // Get unique stores from the trends data
      const uniqueStores = new Set(percentageRows.map((r: any) => r.store_id)).size;

      // For unique employees/trainers, we need to use the actual training data
      // since Monthly_Trends doesn't have trainer information
      const uniqueTrainers = filteredTrainingData
        ? new Set(filteredTrainingData.map(s => s.trainerId)).size
        : 0;

      // Compute per-store latest values up to a cutoff (now) and up to previous month end.
      // We treat observed_period as a date (supports YYYY-MM-DD or YYYY-MM). For YYYY-MM we
      // consider the period to end on the last day of that month.
      const parsePeriodDate = (period: string) => {
        if (!period) return null as Date | null;
        // Try direct Date parsing first
        const d = new Date(period);
        if (!isNaN(d.getTime())) return d;
        // If period looks like YYYY-MM, set to last day of that month
        const m = /^\s*(\d{4})-(\d{2})\s*$/.exec(period);
        if (m) {
          const y = parseInt(m[1], 10);
          const mm = parseInt(m[2], 10);
          // month passed as 1-based; to get last day of month use new Date(y, mm, 0)
          return new Date(y, mm, 0);
        }
        return null;
      };

      const storeMap = new Map<string, { date: Date; value: number }[]>();
      percentageRows.forEach((r: any) => {
        const storeId = r.store_id || r.storeId || r.store || '';
        if (!storeId) return;
        const periodStr = r.observed_period || r.observed_period || r.period || '';
        const dt = parsePeriodDate(periodStr);
        if (!dt) return;
        const v = parseFloat(r.metric_value) || 0;
        if (!storeMap.has(storeId)) storeMap.set(storeId, []);
        storeMap.get(storeId)!.push({ date: dt, value: v });
      });

      const cutoffNow = lastRefresh ? new Date(lastRefresh) : new Date();
      // previous cutoff = end of previous month relative to cutoffNow
      const cutoffPrev = new Date(cutoffNow.getFullYear(), cutoffNow.getMonth(), 0, 23, 59, 59, 999);

      const latestValues: number[] = [];
      const prevValues: number[] = [];

      storeMap.forEach((arr) => {
        // find latest up to cutoffNow
        const upToNow = arr.filter(x => x.date.getTime() <= cutoffNow.getTime());
        if (upToNow.length > 0) {
          upToNow.sort((a, b) => a.date.getTime() - b.date.getTime());
          latestValues.push(upToNow[upToNow.length - 1].value);
        }

        // find latest up to cutoffPrev (end of previous month)
        const upToPrev = arr.filter(x => x.date.getTime() <= cutoffPrev.getTime());
        if (upToPrev.length > 0) {
          upToPrev.sort((a, b) => a.date.getTime() - b.date.getTime());
          prevValues.push(upToPrev[upToPrev.length - 1].value);
        }
      });

      const avgLatestPerStore = latestValues.length > 0 ? Math.round(latestValues.reduce((s, x) => s + x, 0) / latestValues.length) : null;
      const avgPrevPerStore = prevValues.length > 0 ? Math.round(prevValues.reduce((s, x) => s + x, 0) / prevValues.length) : null;

      return {
        totalSubmissions,
        // overall average: mean of each store's latest response up to now
        avgScore: avgLatestPerStore !== null ? avgLatestPerStore : Math.round(avgScore),
        // expose monthly latest/previous as requested (latest = all latest up to now; previous = all latest up to previous month end)
        latestScore: avgLatestPerStore,
        previousScore: avgPrevPerStore,
        uniqueEmployees: uniqueTrainers,
        uniqueStores
      };
    }
    
    // For Operations dashboard, use AM Operations data
    if (dashboardType === 'operations') {
      if (!filteredAMOperations) return null;

      const totalSubmissions = filteredAMOperations.length;
      const avgScore = totalSubmissions > 0 
        ? filteredAMOperations.reduce((acc, s) => acc + parseFloat(s.percentageScore || '0'), 0) / totalSubmissions 
        : 0;
  const uniqueTrainers = new Set(filteredAMOperations.map(s => normalizeId((s as any).trainerId) || normalizeId((s as any).trainer) || normalizeId((s as any).hrId))).size;
      const uniqueStores = new Set(filteredAMOperations.map(s => s.storeId)).size;

      return {
        totalSubmissions,
        avgScore: Math.round(avgScore),
        uniqueEmployees: uniqueTrainers, // Using trainers instead of employees for operations
        uniqueStores
      };
    }
    
    // For HR and Consolidated dashboards, use HR survey data
    if (!filteredSubmissions) return null;

    const totalSubmissions = filteredSubmissions.length;
    const avgScore = totalSubmissions > 0 ? filteredSubmissions.reduce((acc, s) => acc + s.percent, 0) / totalSubmissions : 0;
    const uniqueEmployees = new Set(filteredSubmissions.map(s => s.empId)).size;
    const uniqueStores = new Set(filteredSubmissions.map(s => s.storeID)).size;

    return {
      totalSubmissions,
      avgScore: Math.round(avgScore),
      uniqueEmployees,
      uniqueStores
    };
  }, [filteredSubmissions, filteredAMOperations, filteredTrainingData, filteredQAData, dashboardType, trendsData, trendsLoading, trainingData, filters]);

  // Helper to compute the Average Score display string robustly
  const getAverageScoreDisplay = () => {
    // Training dashboard special handling
    if (dashboardType === 'training') {
    const hasFilters = Boolean(filters.region || filters.store || filters.am || filters.trainer || filters.health);
      if (hasFilters) {
        if (!stats) return '—';
        const prevPart = stats.previousScore !== null && stats.previousScore !== undefined ? ` (Prev ${stats.previousScore}%)` : '';
        return `${stats.latestScore}%${prevPart}`;
      }

      // No filters: prefer trendsData aggregated average
      // Prefer monthly latest/previous values when available (computed in stats)
      if (stats && (stats.latestScore !== null && stats.latestScore !== undefined)) {
        const prevPart = stats.previousScore !== null && stats.previousScore !== undefined ? ` (Prev ${stats.previousScore}%)` : '';
        return `${stats.latestScore}%${prevPart}`;
      }

      // Fallback to aggregated average if monthly breakdown not present
      if (stats && stats.avgScore != null) return `${stats.avgScore}%`;
      if (!trendsLoading && trendsData) {
        const percentageRows = trendsData.filter((r: any) => (r.metric_name || '').toLowerCase() === 'percentage');
        if (percentageRows.length > 0) {
          const avg = percentageRows.reduce((acc: number, r: any) => acc + (parseFloat(r.metric_value) || 0), 0) / percentageRows.length;
          return `${Math.round(avg)}%`;
        }
      }
      return '—';
    }

    // Default: use stats.avgScore when available
    return `${stats?.avgScore ?? '—'}%`;
  };

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [filterName]: value };
    
    // Cascading reset logic for hierarchical filters
    if (filterName === 'region') {
      newFilters.store = ''; // Reset store when region changes
    } else if (filterName === 'trainer') {
      newFilters.am = '';    // Reset AM when HR changes
      newFilters.store = ''; // Reset store when HR changes
    } else if (filterName === 'am') {
      newFilters.store = ''; // Reset store when AM changes
    }
    
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({ region: '', store: '', am: '', trainer: '', health: '' });
  };

  const [isGenerating, setIsGenerating] = React.useState(false);

  // Function to show notifications
  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 2000) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    
    // Auto-hide notification after duration
    setTimeout(() => {
      setShowNotification(false);
    }, duration);
  };

  const generatePDFReport = async () => {
    setIsGenerating(true);
    try {
      console.log('Starting PDF generation...');
      // Strong haptic feedback when starting PDF generation
      hapticFeedback.confirm();
      
      // Check if we have data based on dashboard type
      let reportData = [];
      let dataType = 'HR Survey';
      
      if (dashboardType === 'hr') {
        if (!filteredSubmissions || filteredSubmissions.length === 0) {
          alert('No HR survey data available to generate report');
          hapticFeedback.error();
          return;
        }
        reportData = filteredSubmissions;
        dataType = 'HR Survey';
      } else if (dashboardType === 'operations') {
        if (!filteredAMOperations || filteredAMOperations.length === 0) {
          alert('No AM Operations data available to generate report');
          hapticFeedback.error();
          return;
        }
        reportData = filteredAMOperations;
        dataType = 'AM Operations Checklist';
      } else if (dashboardType === 'training') {
        if (!filteredTrainingData || filteredTrainingData.length === 0) {
          alert('No Training Audit data available to generate report');
          hapticFeedback.error();
          return;
        }
        // Ensure we only include training audit records and exclude HR/connect or other types
        reportData = (filteredTrainingData || []).filter((r: any) => {
          return r && (r.trainerName || r.trainer || r.tsaFoodScore !== undefined || r.section);
        });
        dataType = 'Training Audit Checklist';
      } else if (dashboardType === 'qa') {
        if (!filteredQAData || filteredQAData.length === 0) {
          alert('No QA Assessment data available to generate report');
          hapticFeedback.error();
          return;
        }
        reportData = filteredQAData;
        dataType = 'QA Assessment Checklist';
      } else { // consolidated
        if ((!filteredSubmissions || filteredSubmissions.length === 0) && 
            (!filteredAMOperations || filteredAMOperations.length === 0) && 
            (!filteredTrainingData || filteredTrainingData.length === 0) &&
            (!filteredQAData || filteredQAData.length === 0)) {
          alert('No data available to generate report');
          hapticFeedback.error();
          return;
        }
        
        // Priority order: HR > Training > QA > Operations
        if (filteredSubmissions.length > 0) {
          reportData = filteredSubmissions;
          dataType = 'HR Survey';
        } else if (filteredTrainingData.length > 0) {
          reportData = filteredTrainingData;
          dataType = 'Training Audit Checklist';
        } else if (filteredQAData.length > 0) {
          reportData = filteredQAData;
          dataType = 'QA Assessment Checklist';
        } else {
          reportData = filteredAMOperations;
          dataType = 'AM Operations Checklist';
        }
      }

      // If this is a training report, delegate to the training PDF builder for a richer layout
      if (dashboardType === 'training') {
        const meta: any = {};
        
        // Prioritize filters for metadata; fallback to first record only when no relevant filters are set
        // This ensures region/AM/trainer/store filters correctly label the report
        
        // Store filter
        if (filters.store) {
          const s = allStores.find(s => s.id === filters.store);
          meta.storeName = s?.name || filters.store;
          meta.storeId = filters.store;
        } else if (reportData.length > 0 && reportData.length === 1) {
          // Single submission with no store filter: use first record store
          const firstRecord = reportData[0] as any;
          meta.storeName = firstRecord.storeName || firstRecord.store_name || '';
          meta.storeId = firstRecord.storeId || firstRecord.storeID || '';
          // Capture MOD from single record if present
          if (firstRecord.mod) meta.mod = firstRecord.mod;
        } else if (filters.region) {
          // Region filter: show region as primary identifier
          meta.storeName = `${filters.region} Region`;
          meta.storeId = '';
        } else if (reportData.length > 0) {
          // Multiple records, no filter: use "All Stores" or aggregate
          meta.storeName = 'All Stores (Filtered)';
          meta.storeId = '';
        }
        
        // Trainer filter (HR field in training context)
        if (filters.trainer) {
          const t = HR_PERSONNEL.find(h => h.id === filters.trainer) || AREA_MANAGERS.find(a => a.id === filters.trainer);
          meta.trainerName = t?.name || filters.trainer;
          meta.trainerId = filters.trainer;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.trainerName = firstRecord.trainerName || firstRecord.trainer_name || '';
          meta.trainerId = firstRecord.trainerId || firstRecord.trainer_id || '';
          // Capture MOD from single record if present
          if (firstRecord.mod) meta.mod = firstRecord.mod;
        } else if (reportData.length > 0) {
          meta.trainerName = 'Multiple Trainers';
          meta.trainerId = '';
        }
        
        // AM filter
        if (filters.am) {
          const am = AREA_MANAGERS.find(a => a.id === filters.am);
          meta.amName = am?.name || filters.am;
          meta.auditorName = am?.name || filters.am;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.amName = firstRecord.amName || firstRecord.am_name || '';
          meta.auditorName = firstRecord.amName || firstRecord.am_name || 'N/A';
          if (firstRecord.mod) meta.mod = firstRecord.mod;
        }
        
        // Score aggregation: compute average if multiple submissions
        if (reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.totalScore = firstRecord.totalScore || 0;
          meta.maxScore = firstRecord.maxScore || 100;
          meta.percentage = Math.round(firstRecord.percentageScore || firstRecord.percentage_score || 0);
        } else if (reportData.length > 1) {
          // Compute average score across filtered submissions
          const totalPct = reportData.reduce((sum, r: any) => sum + parseFloat(r.percentageScore || r.percentage_score || 0), 0);
          meta.percentage = Math.round(totalPct / reportData.length);
          meta.totalScore = `Avg`;
          meta.maxScore = 100;
        }
        
        // Use component-level lastRefresh state for date
        if (lastRefresh) meta.date = lastRefresh.toLocaleString();

        const fileName = `TrainingAudit_${meta.storeName || meta.storeId || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
        const pdf = await buildTrainingPDF(reportData as any, meta, { title: 'Training Audit Report' });
        pdf.save(fileName);
        setIsGenerating(false);
        showNotificationMessage('Training PDF generated successfully!', 'success');
        return;
      }

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      let y = 15;

      // Header - matching hrconnect.html exactly
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(34, 107, 140); // Dark blue color
      doc.text('PRISM DASHBOARD', 14, y);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 12;

  // Determine report type and entity details based on current filters
      let reportTitle = `${dataType} Dashboard Report`;
      let entityDetails = {};

      if (dashboardType === 'training') {
        // Training-specific report header
        reportTitle = `Training Audit Report`;
        // If a store filter is applied, show store-level training report
        if (filters.store) {
          const storeInfo = allStores.find(s => s.id === filters.store);
          entityDetails = {
            'Store Name': storeInfo?.name || filters.store,
            'Store ID': filters.store,
            'Data Type': dataType,
            'Total Training Records': reportData.length
          };
        } else if (filters.trainer) {
          // Trainer filter used as trainer selection for training dashboard
          const trainerInfo = HR_PERSONNEL.find(hr => hr.id === filters.trainer) || AREA_MANAGERS.find(am => am.id === filters.trainer);
          entityDetails = {
            'Trainer Name': trainerInfo?.name || filters.trainer,
            'Trainer ID': filters.trainer,
            'Data Type': dataType,
            'Total Training Records': reportData.length
          };
        } else if (filters.am) {
          const amInfo = AREA_MANAGERS.find(am => am.id === filters.am);
          entityDetails = {
            'Area Manager': amInfo?.name || filters.am,
            'AM ID': filters.am,
            'Total Training Records': reportData.length,
            'Data Type': dataType
          };
        } else if (filters.region) {
          reportTitle = `${dataType} Region Report`;
          entityDetails = {
            'Region': filters.region,
            'Total Training Records': reportData.length,
            'Data Type': dataType
          };
        } else {
          entityDetails = {
            'Total Training Records': reportData.length,
            'Data Type': dataType
          };
        }
      } else if (filters.store) {
        const storeInfo = allStores.find(s => s.id === filters.store);
        reportTitle = `${dataType} Store Report`;
        entityDetails = {
          'Store Name': storeInfo?.name || filters.store,
          'Store ID': filters.store,
          'Total Submissions': reportData.length,
          'Data Type': dataType
        };
      } else if (filters.am) {
        const amInfo = AREA_MANAGERS.find(am => am.id === filters.am);
        reportTitle = `${dataType} Area Manager Report`;
        const storesFromData = reportData.reduce((acc, sub) => {
          const storeName = sub.storeName || sub.store_name || 'Unknown Store';
          if (!acc.includes(storeName)) {
            acc.push(storeName);
          }
          return acc;
        }, []);
        entityDetails = {
          'Area Manager': amInfo?.name || filters.am,
          'AM ID': filters.am,
          'Stores Managed': storesFromData.join(', ') || 'N/A',
          'Total Submissions': reportData.length,
          'Stores Covered': stats?.uniqueStores || 0,
          'Data Type': dataType
        };
      } else if (filters.trainer) {
        const hrInfo = HR_PERSONNEL.find(hr => hr.id === filters.trainer);
  // dashboardType may be a union; perform a runtime string check for 'training'
  const roleName = String(dashboardType) === 'training' ? 'Trainer' : 'HR Personnel';
        reportTitle = `${dataType} ${roleName} Report`;
        entityDetails = {
          [`${roleName} Name`]: hrInfo?.name || filters.trainer,
          [`${roleName} ID`]: filters.trainer,
          'Total Submissions': reportData.length,
          'Stores Covered': stats?.uniqueStores || 0,
          'Data Type': dataType
        };
      } else if (filters.region) {
        reportTitle = `${dataType} Region Report`;
        entityDetails = {
          'Region': filters.region,
          'Total Submissions': reportData.length,
          'Stores Covered': stats?.uniqueStores || 0,
          'Data Type': dataType
        };
      } else {
        // General dashboard report
        entityDetails = {
          'Generated by': userRole?.name || 'Unknown',
          'Role': userRole?.role?.replace('_', ' ').toUpperCase() || 'Unknown',
          'Region Access': userRole?.region || 'All Regions',
          'Total Submissions': reportData.length,
          'Stores Covered': stats?.uniqueStores || 0,
          'Data Type': dataType
        };
      }

      // Report Title Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text(reportTitle, 14, y);
      y += 10;

      // Entity Details - two columns like hrconnect.html with proper alignment
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const entityEntries = Object.entries(entityDetails);
      // Add a 'Filters Applied' entry so reports clearly show which filters were used
      const filtersApplied = [] as string[];
      if (filters.region) filtersApplied.push(`Region=${filters.region}`);
      if (filters.store) filtersApplied.push(`Store=${filters.store}`);
      if (filters.am) filtersApplied.push(`AM=${filters.am}`);
  if (filters.trainer) filtersApplied.push(`Trainer/HR=${filters.trainer}`);
      if (filters.health) filtersApplied.push(`StoreHealth=${filters.health}`);
      if (filtersApplied.length > 0) {
        entityEntries.push(['Filters Applied', filtersApplied.join(', ')]);
      }
      for (let i = 0; i < entityEntries.length; i += 2) {
        const [key1, value1] = entityEntries[i];
        const [key2, value2] = entityEntries[i + 1] || ['', ''];
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${key1}:`, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${value1}`, 55, y);  // Increased from 45 to 55 for better alignment
        
        if (key2) {
          doc.setFont('helvetica', 'bold');
          doc.text(`${key2}:`, 110, y);
          doc.setFont('helvetica', 'normal');
          doc.text(`${value2}`, 155, y);  // Increased from 140 to 155 for better alignment
        }
        y += 6;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('Generated:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleString(), 55, y);  // Aligned with other values
      y += 15;

      // Score and progress bar
      if (reportData.length !== 1) {
        // Multi-submission: show average percent and bar here with centered text
        const scoreToShow = stats?.avgScore || 0;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(51, 51, 51);
        doc.text(`Average Score: ${scoreToShow}%`, 14, y);
        y += 8;

        const barX = 14, barY = y, barW = 170, barH = 8;
        doc.setFillColor(235, 235, 235);
        doc.rect(barX, barY, barW, barH, 'F');
        function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
        function colorAt(t: number) {
          if (t <= 0.5) {
            const tt = t / 0.5;
            return [lerp(255, 255, tt), lerp(99, 204, tt), lerp(71, 0, tt)];
          } else {
            const tt = (t - 0.5) / 0.5;
            return [lerp(255, 34, tt), lerp(204, 177, tt), lerp(0, 76, tt)];
          }
        }
        const scorePercentage = scoreToShow;
        const fillW = Math.max(0, Math.min(barW, Math.round((scorePercentage / 100) * barW)));
        const sliceW = 1;
        for (let i = 0; i < fillW; i += sliceW) {
          const t = i / (barW - 1);
          const [r, g, b] = colorAt(t);
          doc.setFillColor(r, g, b);
          doc.rect(barX + i, barY, sliceW, barH, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const pctText = `${Math.round(scorePercentage)}%`;
        const pctWidth = doc.getTextWidth(pctText);
        // Center the percentage text in the middle of the bar
        doc.text(pctText, barX + (barW - pctWidth) / 2, barY + barH - 1);
        y += barH + 15;
      }

      // For individual submission reports (when filtered to specific store/employee)
      if (reportData.length === 1) {
        const submission = reportData[0];
        console.log('Single submission data:', submission);
        
        // Determine which question set to use based on dashboard type
        let questionsToUse = QUESTIONS; // Default to HR questions
        let maxScore = 50; // Default HR max score
        let detailsTitle = 'Survey Details';
        
        if (dashboardType === 'operations') {
          questionsToUse = OPERATIONS_QUESTIONS;
          maxScore = 53; // Operations has 53 questions, each worth 1 point
          detailsTitle = 'Operations Checklist Details';
        } else if (dashboardType === 'training') {
          questionsToUse = TRAINING_QUESTIONS;
          // Actual max score based on SECTIONS weights in TrainingChecklist.tsx:
          // TM: 10pts, LMS: 10pts, Buddy: 10pts, NJ: 10pts, PK: 15pts, TSA: 30pts, CX: 10pts, AP: 5pts
          maxScore = 100; // Total max score for training questions
          detailsTitle = 'Training Audit Details';
        }

        // Create mapping for training question weights (from SECTIONS in TrainingChecklist.tsx)
        const trainingWeights: Record<string, {w: number, wneg?: number}> = {
          'TM_1': {w: 1}, 'TM_2': {w: 1}, 'TM_3': {w: 1}, 'TM_4': {w: 1}, 'TM_5': {w: 2},
          'TM_6': {w: 1}, 'TM_7': {w: 1}, 'TM_8': {w: 1}, 'TM_9': {w: 1},
          'LMS_1': {w: 4, wneg: -4}, 'LMS_2': {w: 4, wneg: -4}, 'LMS_3': {w: 2},
          'Buddy_1': {w: 2}, 'Buddy_2': {w: 2}, 'Buddy_3': {w: 1}, 'Buddy_4': {w: 2}, 'Buddy_5': {w: 2}, 'Buddy_6': {w: 1},
          'NJ_1': {w: 1}, 'NJ_2': {w: 1}, 'NJ_3': {w: 1}, 'NJ_4': {w: 1}, 'NJ_5': {w: 2}, 'NJ_6': {w: 2}, 'NJ_7': {w: 2},
          'PK_1': {w: 2}, 'PK_2': {w: 2}, 'PK_3': {w: 2}, 'PK_4': {w: 2}, 'PK_5': {w: 2}, 'PK_6': {w: 2}, 'PK_7': {w: 3, wneg: -3},
          'TSA_1': {w: 10}, 'TSA_2': {w: 10}, 'TSA_3': {w: 10},
          'CX_1': {w: 1}, 'CX_2': {w: 1}, 'CX_3': {w: 1}, 'CX_4': {w: 1}, 'CX_5': {w: 2}, 'CX_6': {w: 1}, 'CX_7': {w: 1}, 'CX_8': {w: 1}, 'CX_9': {w: 1},
          'AP_1': {w: 1, wneg: -1}, 'AP_2': {w: 2}, 'AP_3': {w: 2}
        };
        
        // Survey/Checklist Details Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(detailsTitle, 14, y);
        y += 8;

        // Details in two columns (adapted for different data structures)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        if (dashboardType === 'hr') {
          // HR Survey specific fields
          // Left column
          doc.setFont('helvetica', 'bold');
          doc.text('HR Name:', 14, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).hrName || 'N/A', 55, y);
          
          // Right column
          doc.setFont('helvetica', 'bold');
          doc.text('HR ID:', 110, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).hrId || 'N/A', 130, y);
          y += 6;

          doc.setFont('helvetica', 'bold');
          doc.text('Area Manager:', 14, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).amName || 'N/A', 55, y);
          
          doc.setFont('helvetica', 'bold');
          doc.text('AM ID:', 110, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).amId || 'N/A', 130, y);
          y += 6;

          doc.setFont('helvetica', 'bold');
          doc.text('Emp Name:', 14, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).empName || 'N/A', 55, y);
          
          doc.setFont('helvetica', 'bold');
          doc.text('Emp ID:', 110, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).empId || 'N/A', 130, y);
          y += 6;
        } else if (dashboardType === 'operations' || dashboardType === 'training') {
          // Operations and Training specific fields
          doc.setFont('helvetica', 'bold');
          doc.text('Trainer Name:', 14, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).trainerName || (submission as any).trainer_name || 'N/A', 55, y);
          
          doc.setFont('helvetica', 'bold');
          doc.text('Trainer ID:', 110, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).trainerId || (submission as any).trainer_id || 'N/A', 130, y);
          y += 6;

          doc.setFont('helvetica', 'bold');
          doc.text('Area Manager:', 14, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).amName || (submission as any).am_name || 'N/A', 55, y);
          
          doc.setFont('helvetica', 'bold');
          doc.text('AM ID:', 110, y);
          doc.setFont('helvetica', 'normal');
          doc.text((submission as any).amId || (submission as any).am_id || 'N/A', 130, y);
          y += 6;

          if (dashboardType === 'training') {
            doc.setFont('helvetica', 'bold');
            doc.text('MOD:', 14, y);
            doc.setFont('helvetica', 'normal');
            doc.text((submission as any).mod || 'N/A', 55, y);
            y += 6;
          }
        }
        
        // Store details (common for all types)
        doc.setFont('helvetica', 'bold');
        doc.text('Store Name:', 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text((submission as any).storeName || (submission as any).store_name || 'N/A', 55, y);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Store ID:', 110, y);
        doc.setFont('helvetica', 'normal');
        doc.text((submission as any).storeId || (submission as any).storeID || (submission as any).store_id || 'N/A', 130, y);
        y += 15;

        // Score section with bar (after details)
        let calculatedScore = 0;
        let calculatedMaxScore = 0;
        
        if (dashboardType === 'training') {
          // Recalculate score using the same logic as TrainingChecklist.tsx
          questionsToUse.forEach((question) => {
            const weight = trainingWeights[question.id];
            if (weight) {
              const respKey = question.id;
              const raw = (submission as any)[respKey];
              
              // Only include in calculation if there's a response (exclude N/A)
              if (raw !== undefined && raw !== null && raw !== '' && raw !== 'N/A') {
                if (question.id.startsWith('TSA_')) {
                  const score = parseInt(raw) || 0;
                  calculatedScore += score;
                  calculatedMaxScore += weight.w;
                } else if (raw === 'yes' || raw === 'Yes') {
                  calculatedScore += weight.w;
                  calculatedMaxScore += weight.w;
                } else if (raw === 'no' || raw === 'No') {
                  calculatedScore += weight.wneg || 0;
                  calculatedMaxScore += weight.w;
                } else if (raw === 'Excellent') {
                  calculatedScore += 5;
                  calculatedMaxScore += weight.w;
                } else if (raw === 'Good') {
                  calculatedScore += 3;
                  calculatedMaxScore += weight.w;
                } else if (raw === 'Poor') {
                  calculatedScore += 1;
                  calculatedMaxScore += weight.w;
                } else if (String(raw).trim()) {
                  // For text responses, give full score if there's content
                  calculatedScore += weight.w;
                  calculatedMaxScore += weight.w;
                }
              }
            }
          });
        } else {
          // For non-training dashboards, use the stored score
          calculatedScore = (submission as any).totalScore || (submission as any).total_score || 0;
          calculatedMaxScore = maxScore;
        }
        
        const singlePct = calculatedMaxScore > 0 ? Math.round((calculatedScore / calculatedMaxScore) * 100) : 0;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Score: ${calculatedScore} / ${calculatedMaxScore}   (${singlePct}%)`, 14, y);
        y += 8;

        const barX = 14, barY = y, barW = 170, barH = 8;
        doc.setFillColor(235, 235, 235);
        doc.rect(barX, barY, barW, barH, 'F');
        function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
        function colorAt(t: number) {
          if (t <= 0.5) {
            const tt = t / 0.5;
            return [lerp(255, 255, tt), lerp(99, 204, tt), lerp(71, 0, tt)];
          } else {
            const tt = (t - 0.5) / 0.5;
            return [lerp(255, 34, tt), lerp(204, 177, tt), lerp(0, 76, tt)];
          }
        }
        const fillW = Math.max(0, Math.min(barW, Math.round((singlePct / 100) * barW)));
        const sliceW = 1;
        for (let i = 0; i < fillW; i += sliceW) {
          const t = i / (barW - 1);
          const [r, g, b] = colorAt(t);
          doc.setFillColor(r, g, b);
          doc.rect(barX + i, barY, sliceW, barH, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const pctText = `${singlePct}%`;
        const pctWidth = doc.getTextWidth(pctText);
        // Center the percentage text in the middle of the bar
        doc.text(pctText, barX + (barW - pctWidth) / 2, barY + barH - 1);
        y += barH + 12;

        // Individual Question Responses Table
        const questionResponses = questionsToUse.map((question) => {
          // Access submission fields directly based on question ID
          const respKey = question.id;
          const remarksKey = `${question.id}_remarks`;
          const raw = (submission as any)[respKey];
          const remarks = ((submission as any)[remarksKey] as string) || '';
          let answerText = 'No Response';
          let scoreText = '-';

          // Always display the raw value if it exists, regardless of whether it matches expected choices
          if (raw !== undefined && raw !== null && raw !== '' && raw !== 'N/A') {
            answerText = String(raw).trim();
            
            // Calculate individual question score for training questions
            if (dashboardType === 'training') {
              const weight = trainingWeights[question.id];
              if (weight) {
                if (question.id.startsWith('TSA_')) {
                  const score = parseInt(raw) || 0;
                  scoreText = `${score}/${weight.w}`;
                } else if (raw === 'Yes' || raw === 'yes') {
                  scoreText = `${weight.w}/${weight.w}`;
                } else if (raw === 'No' || raw === 'no') {
                  const actualScore = weight.wneg || 0;
                  scoreText = `${actualScore}/${weight.w}`;
                } else if (question.choices) {
                  // For choice-based questions, find the actual score
                  const choice = question.choices.find(c => c.label === String(raw));
                  if (choice) {
                    scoreText = `${choice.score}/${weight.w}`;
                  } else {
                    scoreText = `0/${weight.w}`;
                  }
                } else {
                  // Text responses get full score if answered
                  scoreText = answerText.trim() ? `${weight.w}/${weight.w}` : `0/${weight.w}`;
                }
              } else {
                scoreText = 'N/A';
              }
            } else if (dashboardType === 'operations') {
              // Operations questions are Yes/No with 1/0 scoring
              if (question.choices) {
                const choice = question.choices.find(c => c.label === String(raw));
                scoreText = choice ? `${choice.score}/1` : '0/1';
              }
            } else {
              // HR questions
              if (question.choices) {
                const choice = question.choices.find(c => c.label === String(raw));
                if (choice) {
                  const maxChoice = Math.max(...question.choices.map(c => c.score));
                  scoreText = `${choice.score}/${maxChoice}`;
                }
              }
            }
          }

          // For training, return 4 columns including individual score
          if (dashboardType === 'training') {
            return [
              question.title,
              answerText,
              scoreText,
              remarks || '-'
            ];
          } else {
            return [
              question.title,
              answerText,
              remarks || '-'
            ];
          }
        });

          // Configure table headers and columns based on dashboard type
          const tableHeaders = dashboardType === 'training' 
            ? [['Question', 'Answer', 'Score', 'Remarks']]
            : [['Question', 'Answer', 'Remarks']];
            
          const columnStyles = dashboardType === 'training'
            ? {
                0: { cellWidth: 75 },  // Question
                1: { cellWidth: 40 },  // Answer  
                2: { cellWidth: 25 },  // Score
                3: { cellWidth: 40 }   // Remarks
              }
            : {
                0: { cellWidth: 90 },  // Question
                1: { cellWidth: 55 },  // Answer
                2: { cellWidth: 45 }   // Remarks
              };

          autoTable(doc, {
            startY: y,
            head: tableHeaders,
            body: questionResponses,
            styles: { 
              fontSize: 9, 
              textColor: '#000000',
              cellPadding: 3,
              lineWidth: 0.3,
              lineColor: [0, 0, 0]
            },
            headStyles: { 
              fillColor: [255, 255, 255], 
              textColor: '#000000', 
              fontStyle: 'bold',
              lineWidth: 0.5,
              lineColor: [0, 0, 0]
            },
            bodyStyles: {
              lineWidth: 0.2,
              lineColor: [180, 180, 180]
            },
            columnStyles: columnStyles,
            margin: { left: 14, right: 14 }
          });

          y = doc.lastAutoTable ? (doc.lastAutoTable.finalY + 10) : (y + 10);
        

        // End of single-submission section (timestamp already printed above in entity details)

      } else {
        // Summary Statistics Table for multiple submissions
        const summaryData = [
          ['Total Responses', reportData.length.toString()],
          ['Average Score', `${stats?.avgScore || 0}%`],
          ['Unique Employees', (stats?.uniqueEmployees || 0).toString()],
          ['Stores Covered', (stats?.uniqueStores || 0).toString()],
          ['Response Rate', `${Math.round(((stats?.uniqueEmployees || 0) / Math.max(1, stats?.uniqueStores || 1)) * 100)}% avg per store`]
        ];

        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value']],
          body: summaryData,
          styles: { 
            fontSize: 10, 
            textColor: '#000000',
            cellPadding: 3
          },
          headStyles: { 
            fillColor: [245, 245, 245], 
            textColor: '#000000', 
            fontStyle: 'bold',
            lineWidth: 0.5,
            lineColor: [200, 200, 200]
          },
          bodyStyles: {
            lineWidth: 0.3,
            lineColor: [220, 220, 220]
          },
          columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 40 }
          },
          margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable ? (doc.lastAutoTable.finalY + 15) : (y + 15);
      }

      // Question Performance + Individual Submissions (only for multi-result reports)
      if (reportData.length !== 1) {
        // Determine which question set to use for multi-submission reports
        let questionsToUse = QUESTIONS; // Default to HR questions
        
        if (dashboardType === 'operations') {
          questionsToUse = OPERATIONS_QUESTIONS;
        } else if (dashboardType === 'training') {
          questionsToUse = TRAINING_QUESTIONS;
        }
        
        // Question Performance Table
        const questionPerformance = questionsToUse.map((question) => {
          const questionScores = reportData
            .map((s: any) => {
              const val = s[question.id];
              if (val == null || val === '') return null;
              if (question.type === 'radio' && question.choices) {
                const choice = question.choices.find(c => c.label === String(val));
                return choice ? choice.score : null;
              }
              // For non-scored questions, skip
              return null;
            })
            .filter((score): score is number => score !== null && !isNaN(score as any));

          const avgQuestionScore = questionScores.length > 0 
            ? (questionScores.reduce((a, b) => a + b, 0) / questionScores.length)
            : 0;

          const maxScore = (question.choices && question.choices.length)
            ? Math.max(...question.choices.map(c => c.score || 5))
            : 5;

          const responseCount = questionScores.length;
          const percentage = Math.round((avgQuestionScore / maxScore) * 100);

          return [
            question.title.length > 50 ? question.title.substring(0, 47) + '...' : question.title,
            responseCount.toString(),
            avgQuestionScore.toFixed(1),
            `${percentage}%`
          ];
        });

        // Check if we need a new page
        if (y > 200) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        doc.text('Question Performance Analysis', 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Question', 'Responses', 'Avg Score', 'Performance']],
          body: questionPerformance,
          styles: { 
            fontSize: 9, 
            textColor: '#000000',
            cellPadding: 2.5
          },
          headStyles: { 
            fillColor: [245, 245, 245], 
            textColor: '#000000', 
            fontStyle: 'bold',
            lineWidth: 0.5,
            lineColor: [200, 200, 200]
          },
          bodyStyles: {
            lineWidth: 0.3,
            lineColor: [220, 220, 220]
          },
          columnStyles: {
            0: { cellWidth: 110 },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' }
          },
          margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable ? (doc.lastAutoTable.finalY + 15) : (y + 15);

        // Individual Submissions Table (if manageable number)
        if (filteredSubmissions.length <= 20) {
          if (y > 220) {
            doc.addPage();
            y = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(51, 51, 51);
          doc.text('Individual Submissions', 14, y);
          y += 8;

          const submissionData = filteredSubmissions.map((submission, index) => {
            // Enhanced date formatting with multiple fallback strategies
            let formattedDate = 'N/A';
            if (submission.submissionTime) {
              try {
                // Try parsing the date - handle both ISO strings and other formats
                let date: Date;
                
                // If it's already a Date object-like, or a string
                if (submission.submissionTime && typeof submission.submissionTime === 'object' && (submission.submissionTime as any).getTime) {
                  date = submission.submissionTime as unknown as Date;
                } else if (typeof submission.submissionTime === 'string') {
                  // Handle ISO strings, timestamps, or other string formats
                  if (submission.submissionTime.includes('T') || submission.submissionTime.includes('-')) {
                    // ISO string format
                    date = new Date(submission.submissionTime);
                  } else if (!isNaN(Number(submission.submissionTime))) {
                    // Unix timestamp
                    date = new Date(Number(submission.submissionTime));
                  } else {
                    // Try general parsing
                    date = new Date(submission.submissionTime);
                  }
                } else if (typeof submission.submissionTime === 'number') {
                  // Unix timestamp
                  date = new Date(submission.submissionTime);
                } else {
                  throw new Error('Unsupported date format');
                }
                
                // Check if the parsed date is valid
                if (!isNaN(date.getTime()) && date.getTime() > 0) {
                  formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  });
                } else {
                  throw new Error('Invalid date');
                }
              } catch (error) {
                console.warn('Could not parse date:', submission.submissionTime, error);
                // Use current date as fallback for recent submissions
                formattedDate = new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
              }
            }
            
            return [
              (index + 1).toString(),
              submission.empName || 'N/A',
              submission.storeName || 'N/A',
              formattedDate,
              `${submission.percent || 0}%`
            ];
          });

          autoTable(doc, {
            startY: y,
            head: [['#', 'Employee', 'Store', 'Date', 'Score']],
            body: submissionData,
            styles: { 
              fontSize: 8, 
              textColor: '#000000',
              cellPadding: 2
            },
            headStyles: { 
              fillColor: [245, 245, 245], 
              textColor: '#000000', 
              fontStyle: 'bold',
              lineWidth: 0.5,
              lineColor: [200, 200, 200]
            },
            bodyStyles: {
              lineWidth: 0.3,
              lineColor: [220, 220, 220]
            },
            columnStyles: {
              0: { cellWidth: 15, halign: 'center' },
              1: { cellWidth: 50 },
              2: { cellWidth: 50 },
              3: { cellWidth: 35, halign: 'center' },
              4: { cellWidth: 25, halign: 'center' }
            },
            margin: { left: 14, right: 14 }
          });

          y = doc.lastAutoTable ? (doc.lastAutoTable.finalY + 15) : (y + 15);
        }
      }

      // Store Performance Section (for AM reports showing multiple stores)
      if (filters.am && stats?.uniqueStores && stats.uniqueStores > 1) {
        if (y > 220) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        doc.text('Store Performance Breakdown', 14, y);
        y += 8;

        const storePerformance: { [key: string]: Submission[] } = {};
        filteredSubmissions.forEach(sub => {
          if (!storePerformance[sub.storeName]) {
            storePerformance[sub.storeName] = [];
          }
          storePerformance[sub.storeName].push(sub);
        });

        const storeData = Object.entries(storePerformance).map(([storeName, storeSubmissions]) => {
          const storeScores = storeSubmissions.map(s => s.totalScore).filter(s => s !== undefined);
          const avgStoreScore = storeScores.length > 0 
            ? Math.round(storeScores.reduce((a, b) => a + b, 0) / storeScores.length)
            : 0;

          return [
            storeName,
            storeSubmissions.length.toString(),
            `${avgStoreScore}%`,
            storeSubmissions.map(s => s.empName).filter(Boolean).join(', ')
          ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Store Name', 'Submissions', 'Avg Score', 'Employees']],
            body: storeData,
            styles: { 
              fontSize: 9, 
              textColor: '#000000',
              cellPadding: 2.5
            },
            headStyles: { 
              fillColor: [245, 245, 245], 
              textColor: '#000000', 
              fontStyle: 'bold',
              lineWidth: 0.5,
              lineColor: [200, 200, 200]
            },
            bodyStyles: {
              lineWidth: 0.3,
              lineColor: [220, 220, 220]
            },
            columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 25, halign: 'center' },
              2: { cellWidth: 25, halign: 'center' },
              3: { cellWidth: 80 }
            },
            margin: { left: 14, right: 14 }
          });
        }

      // Generate filename based on entity type
      let filename = 'HRConnect_Report';
      if (filters.store) {
        const storeInfo = allStores.find(s => s.id === filters.store);
        filename = `HRConnect_Store_${(storeInfo?.name || filters.store).replace(/\s+/g, '_')}`;
      } else if (filters.am) {
        const amInfo = AREA_MANAGERS.find(am => am.id === filters.am);
        filename = `HRConnect_AM_${(amInfo?.name || filters.am).replace(/\s+/g, '_')}`;
      } else if (filters.trainer) {
        const hrInfo = HR_PERSONNEL.find(hr => hr.id === filters.trainer);
        filename = `HRConnect_HR_${(hrInfo?.name || filters.trainer).replace(/\s+/g, '_')}`;
      } else if (filters.region) {
        filename = `HRConnect_Region_${filters.region.replace(/\s+/g, '_')}`;
      }

      // Single-submission: use HRPulse_* naming like the sample
      if (filteredSubmissions.length === 1) {
        const s = filteredSubmissions[0];
        const emp = (s.empId || 'EMP').replace(/\s+/g, '_');
        const ts = new Date().toISOString().replace(/[:.]/g, '').replace('T','_').slice(0,15);
        doc.save(`HRPulse_${emp}_${ts}.pdf`);
      } else {
        doc.save(`${filename}_${Date.now()}.pdf`);
      }
      console.log('PDF generated successfully');
      // Ultra-strong success haptic for PDF completion (like premium apps)
      hapticFeedback.ultraStrong();
      // Show success notification overlay
      showNotificationMessage('Report Downloaded', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
      hapticFeedback.error();
      // Show error notification overlay
      showNotificationMessage('Error generating report', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Dashboard Type Selector Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 animate-pulse">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg flex-1"></div>
            ))}
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonLoader type="stat" count={4} />
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader type="chart" count={2} />
        </div>

        {/* Additional Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonLoader type="card" count={3} />
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-slate-400 mt-4">
          Loading {dashboardType === 'training' ? 'training' : dashboardType === 'operations' ? 'operations' : dashboardType === 'qa' ? 'QA' : dashboardType === 'hr' ? 'HR' : ''} dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-4">{error}</div>
        <button
          onClick={() => loadData(true)}
          className="px-6 py-2 btn-primary-gradient text-white rounded-lg transition-transform duration-150 transform hover:scale-105"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Indicator */}
      {refreshing && (
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
            <span className="text-sm">Refreshing data from Google Sheets...</span>
          </div>
        </div>
      )}

      {/* Desktop refresh/last-updated removed to simplify header. Mobile refresh remains in compact bar. */}

      {/* Dashboard Type Selector */}
      {availableDashboardTypes.length > 1 && (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 sm:mb-4">
            Available Dashboards ({authUserRole?.toUpperCase()} Access)
          </h3>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(availableDashboardTypes.length, 5)} gap-2 sm:gap-3`}>
            {availableDashboardTypes.map((type) => {
              const getIcon = () => {
                switch (type.id) {
                  case 'hr': return <Users className="w-4 h-4 sm:w-5 sm:h-5" />;
                  case 'operations': return <Clipboard className="w-4 h-4 sm:w-5 sm:h-5" />;
                  case 'training': return <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />;
                  case 'qa': return (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
                  case 'finance': return (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  );
                  default: return <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />;
                }
              };

              const getColorClass = () => {
                switch (type.id) {
                  case 'hr': return dashboardType === 'hr' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  case 'operations': return dashboardType === 'operations' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  case 'training': return dashboardType === 'training' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  case 'qa': return dashboardType === 'qa' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  case 'finance': return dashboardType === 'finance' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  case 'consolidated': return dashboardType === 'consolidated' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  default: return 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                }
              };

              return (
                <button
                  key={type.id}
                  onClick={() => setDashboardType(type.id as any)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${getColorClass()}`}
                >
                  {getIcon()}
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
            {dashboardType === 'hr' && 'View insights from HR Employee Satisfaction Surveys'}
            {dashboardType === 'operations' && 'View insights from AM Operations Checklists'}
            {dashboardType === 'training' && 'View insights from Training Audit Checklists'}
            {dashboardType === 'qa' && 'View insights from Quality Assurance Assessments'}
            {dashboardType === 'finance' && 'View insights from Finance Reports and Analytics'}
            {dashboardType === 'consolidated' && 'View combined insights from all authorized checklist types'}
          </p>
        </div>
      )}

      <div data-tour="filters">
        <DashboardFilters
          regions={availableRegions}
          stores={availableStores}
          areaManagers={availableAreaManagers}
          // Prefer comprehensive trainer mapping when available
          hrPersonnel={allTrainers && allTrainers.length > 0 ? allTrainers : availableHRPersonnel}
          trainers={allTrainers && allTrainers.length > 0 ? allTrainers : undefined}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          onDownload={generatePDFReport}
          isGenerating={isGenerating}
        />
      </div>

      {/* RCA & CAPA Analysis - Only for Operations Dashboard */}
      {/* Commented out - RCACapaAnalysis component not found
      {dashboardType === 'operations' && filteredAMOperations.length > 0 && (
        <RCACapaAnalysis 
          submissions={filteredAMOperations} 
          questions={OPERATIONS_QUESTIONS}
        />
      )}
      */}

      {/* Download Report Button */}
      {((dashboardType === 'hr' && filteredSubmissions.length > 0) || 
        (dashboardType === 'operations' && filteredAMOperations.length > 0) ||
        (dashboardType === 'training' && filteredTrainingData.length > 0) ||
        (dashboardType === 'qa' && filteredQAData.length > 0) ||
        (dashboardType === 'consolidated' && (filteredSubmissions.length > 0 || filteredAMOperations.length > 0 || filteredTrainingData.length > 0 || filteredQAData.length > 0))) && (
        <div className="hidden md:flex justify-end">
          <button
            onClick={generatePDFReport}
            data-tour="download-button"
            disabled={isGenerating}
            className={`btn-primary-gradient ${isGenerating ? 'opacity-70 pointer-events-none' : ''} px-6 py-2 rounded-xl font-medium transition-transform duration-150 transform hover:scale-105 flex items-center gap-2`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Report
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Check if we have data for the selected dashboard type */}
      {((dashboardType === 'hr' && filteredSubmissions.length > 0) || 
        (dashboardType === 'operations' && filteredAMOperations.length > 0) ||
        (dashboardType === 'training' && filteredTrainingData.length > 0) ||
        (dashboardType === 'qa' && filteredQAData.length > 0) ||
        (dashboardType === 'consolidated' && (filteredSubmissions.length > 0 || filteredAMOperations.length > 0 || filteredTrainingData.length > 0 || filteredQAData.length > 0))) ? (
        <>
          {/* Dashboard Type Specific Content - Removed Coming Soon sections */}
          
          {/* Stats Grid - Different layouts based on dashboard type */}
          {dashboardType === 'training' ? (
            <>
              {/* Training Stats - Desktop/Tablet layout - All pills in one horizontal line */}
              <div className="hidden md:block mb-8 px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  <StatCard title="Total Submissions" value={stats?.totalSubmissions} onClick={handleTotalSubmissionsClick} />
                  <StatCard title="Stores Covered" value={stats?.uniqueStores} onClick={handleStoresCoveredClick} />
                  {/* For training dashboard, provide structured avg data so StatCard can render trend */}
                  <StatCard title="Audit Percentage" value={{
                    latest: stats?.latestScore ?? (typeof stats?.avgScore === 'number' ? Math.round(stats.avgScore) : undefined),
                    previous: stats?.previousScore ?? null,
                    aggregate: (!stats?.latestScore && stats?.avgScore) ? Math.round(stats.avgScore) : undefined
                  }} />
                  <div className="flex items-center">
                    <TrainingHealthPieChart
                        submissions={filteredTrainingData}
                        onOpenDetails={(filterType, value, title) => {
                          // Open the training detail modal with a filter matching the clicked slice
                          if (title === 'Needs Attention') {
                            setTrainingDetailFilter({ type: 'scoreRange', value: '0-55', title: 'Needs Attention' });
                          } else if (title === 'Brewing') {
                            setTrainingDetailFilter({ type: 'scoreRange', value: '56-80', title: 'Brewing' });
                          } else if (title === 'Perfect Shot') {
                            setTrainingDetailFilter({ type: 'scoreRange', value: '81-100', title: 'Perfect Shot' });
                          }
                          setShowTrainingDetail(true);
                        }}
                      />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <StatCard title="Total Submissions" value={stats?.totalSubmissions} onClick={handleTotalSubmissionsClick} />
              <StatCard title="Average Score" value={String(getAverageScoreDisplay())} />
              <StatCard 
                title={dashboardType === 'operations' ? "Trainers Involved" : "Employees Surveyed"} 
                value={stats?.uniqueEmployees} 
              />
              <StatCard title="Stores Covered" value={stats?.uniqueStores} onClick={handleStoresCoveredClick} />
            </div>
          )}

          {/* Show HR Dashboard Content */}
          {(dashboardType === 'hr' || dashboardType === 'consolidated') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <RegionPerformanceInfographic submissions={filteredSubmissions} stores={allStores} />
                <AMPerformanceInfographic submissions={filteredSubmissions} />
                <HRPerformanceInfographic submissions={filteredSubmissions} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ScoreDistributionChart submissions={filteredSubmissions} />
                  <AverageScoreByManagerChart submissions={filteredSubmissions} />
              </div>
              
              <QuestionScoresInfographic submissions={filteredSubmissions} questions={QUESTIONS} />
              
              <div className="grid grid-cols-1 gap-6">
                <AMRadarChart submissions={filteredSubmissions} />
              </div>
            </>
          )}

          {/* Training Dashboard Content */}
          {dashboardType === 'training' && (
            <>
              {/* Mobile Now Bar - Samsung Galaxy style stacked pills */}
              {stats && (
                <NowBarMobile
                  pills={[
                    {
                      id: 'store-health',
                      label: 'Store Health',
                      value: (() => {
                        // Calculate health data inline
                        let needsAttention = 0;
                        let brewing = 0;
                        let perfectShot = 0;

                        filteredTrainingData.forEach(submission => {
                          const percentage = parseFloat(submission.percentageScore || '0');
                          if (percentage < 56) needsAttention++;
                          else if (percentage >= 56 && percentage < 81) brewing++;
                          else if (percentage >= 81) perfectShot++;
                        });

                        const total = needsAttention + brewing + perfectShot;
                        
                        const healthData = [
                          { name: 'Perfect Shot', value: perfectShot, color: '#10b981' },
                          { name: 'Brewing', value: brewing, color: '#f59e0b' },
                          { name: 'Needs Attention', value: needsAttention, color: '#ef4444' }
                        ];

                        return (
                          <div className="flex items-center justify-center gap-3 w-full ml-10" onClick={(e) => e.stopPropagation()}>
                            {/* Compact Pie Chart using SVG */}
                            <svg width="70" height="70" viewBox="0 0 70 70" className="flex-shrink-0">
                              {/* Background circle - adapts to dark mode */}
                              <circle cx="35" cy="35" r="35" className="fill-white dark:fill-gray-800" />
                              
                              {total > 0 && (() => {
                                let currentAngle = -90; // Start from top
                                
                                return healthData.map((segment, index) => {
                                  if (segment.value === 0) return null;
                                  
                                  const percentage = segment.value / total;
                                  const angle = percentage * 360;
                                  const endAngle = currentAngle + angle;
                                  
                                  const startRad = (currentAngle * Math.PI) / 180;
                                  const endRad = (endAngle * Math.PI) / 180;
                                  
                                  const x1 = 35 + 35 * Math.cos(startRad);
                                  const y1 = 35 + 35 * Math.sin(startRad);
                                  const x2 = 35 + 35 * Math.cos(endRad);
                                  const y2 = 35 + 35 * Math.sin(endRad);
                                  
                                  const largeArc = angle > 180 ? 1 : 0;
                                  
                                  const path = (
                                    <path
                                      key={index}
                                      d={`M 35 35 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                      fill={segment.color}
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => {
                                        if (segment.name === 'Needs Attention') {
                                          setTrainingDetailFilter({ type: 'scoreRange', value: '0-55', title: 'Needs Attention' });
                                        } else if (segment.name === 'Brewing') {
                                          setTrainingDetailFilter({ type: 'scoreRange', value: '56-80', title: 'Brewing' });
                                        } else if (segment.name === 'Perfect Shot') {
                                          setTrainingDetailFilter({ type: 'scoreRange', value: '81-100', title: 'Perfect Shot' });
                                        }
                                        setShowTrainingDetail(true);
                                      }}
                                    />
                                  );
                                  
                                  currentAngle = endAngle;
                                  return path;
                                });
                              })()}
                              
                              {/* Center circle for donut effect - adapts to dark mode */}
                              <circle cx="35" cy="35" r="18" className="fill-white dark:fill-gray-800" />
                            </svg>
                            
                            {/* Legend - Right side, smaller and thinner */}
                            <div className="flex flex-col gap-1.5">
                              {healthData.map((entry) => (
                                <div 
                                  key={entry.name}
                                  className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
                                  onClick={() => {
                                    if (entry.name === 'Needs Attention') {
                                      setTrainingDetailFilter({ type: 'scoreRange', value: '0-55', title: 'Needs Attention' });
                                    } else if (entry.name === 'Brewing') {
                                      setTrainingDetailFilter({ type: 'scoreRange', value: '56-80', title: 'Brewing' });
                                    } else if (entry.name === 'Perfect Shot') {
                                      setTrainingDetailFilter({ type: 'scoreRange', value: '81-100', title: 'Perfect Shot' });
                                    }
                                    setShowTrainingDetail(true);
                                  }}
                                >
                                  <div 
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    },
                    {
                      id: 'total-submissions',
                      label: 'Total Submissions',
                      value: stats.totalSubmissions ?? 0,
                      onClick: handleTotalSubmissionsClick
                    },
                    {
                      id: 'stores-covered',
                      label: 'Stores Covered',
                      value: stats.uniqueStores ?? 0,
                      onClick: handleStoresCoveredClick
                    },
                    {
                      id: 'audit-percentage',
                      label: 'Audit Percentage',
                      value: (
                        <div className="flex items-center gap-3">
                          <span className={`text-4xl font-black ${
                            (stats.latestScore ?? (typeof stats.avgScore === 'number' ? Math.round(stats.avgScore) : 0)) < 55 
                              ? 'text-red-600' 
                              : (stats.latestScore ?? (typeof stats.avgScore === 'number' ? Math.round(stats.avgScore) : 0)) >= 55 && (stats.latestScore ?? (typeof stats.avgScore === 'number' ? Math.round(stats.avgScore) : 0)) < 81
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}>
                            {stats.latestScore ?? (typeof stats.avgScore === 'number' ? Math.round(stats.avgScore) : 0)}%
                          </span>
                          {stats.previousScore !== null && stats.previousScore !== undefined && stats.latestScore !== null && stats.latestScore !== undefined && (
                            <div className="flex flex-col items-center gap-0.5">
                              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                                (stats.latestScore - stats.previousScore) >= 0
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                  : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                              }`}>
                                <span className="text-xs font-bold">
                                  {(stats.latestScore - stats.previousScore) >= 0 ? '↗' : '↘'}
                                </span>
                                <span className="text-xs font-bold">
                                  {Math.abs(Math.round(stats.latestScore - stats.previousScore))}%
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">vs prev</span>
                            </div>
                          )}
                        </div>
                      )
                    }
                  ]}
                />
              )}

              {/* Historic Trends Section - Collapsible */}
              <HistoricTrendsSection />

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-tour="region-chart">
                <TrainingRegionPerformanceInfographic 
                  submissions={filteredTrainingData} 
                  onRegionClick={handleRegionClick}
                />
                <TrainingAMPerformanceInfographic 
                  submissions={filteredTrainingData} 
                  onTrainerClick={handleTrainerClick}
                />
                <TrainingHRPerformanceInfographic 
                  submissions={filteredTrainingData}
                  onSectionClick={handleSectionClick}
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div data-tour="score-chart">
                  <TrainingScoreDistributionChart 
                    submissions={filteredTrainingData} 
                    onScoreRangeClick={handleScoreRangeClick}
                  />
                </div>
                <TrainingAverageScoreChart submissions={filteredTrainingData} />
              </div>
              
              <TrainingStorePerformanceChart 
                submissions={filteredTrainingData} 
                onStoreClick={handleStoreClick}
              />
              
              <div className="grid grid-cols-1 gap-6">
                <TrainingRadarChart submissions={filteredTrainingData} />
              </div>
            </>
          )}

          {/* Operations Dashboard Content */}
          {dashboardType === 'operations' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <OperationsRegionPerformanceInfographic submissions={filteredAMOperations} />
                <OperationsAMPerformanceInfographic submissions={filteredAMOperations} />
                <OperationsHRPerformanceInfographic submissions={filteredAMOperations} />
              </div>
              
              {/* Temporary Debug Information */}
              <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">🔍 Debug Info (AM Operations Data)</h3>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p><strong>Total AM Operations:</strong> {amOperationsData?.length || 0}</p>
                  <p><strong>Filtered Count:</strong> {filteredAMOperations?.length || 0}</p>
                  <p><strong>Sample BSC Values:</strong> {filteredAMOperations?.slice(0, 5).map(s => s.bscAchievement).join(', ') || 'None'}</p>
                  <p><strong>Sample Regions:</strong> {[...new Set(filteredAMOperations?.slice(0, 10).map(s => s.region))].join(', ') || 'None'}</p>
                  <p><strong>Sample Store IDs:</strong> {filteredAMOperations?.slice(0, 5).map(s => s.storeId).join(', ') || 'None'}</p>
                  <p><strong>Data Source Check:</strong> {amOperationsData?.length > 0 && amOperationsData[0].submissionTime?.includes('2024-10') ? 'Static Data' : 'Live Data'}</p>
                </div>
              </div>
              
              {/* New Operational Metrics Section with Error Boundary */}
              {(() => {
                try {
                  return <OperationsMetricsInfographic submissions={filteredAMOperations} />;
                } catch (error) {
                  console.error('Error rendering OperationsMetricsInfographic:', error);
                  return (
                    <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
                      <h3 className="font-bold text-red-800 dark:text-red-200">Component Error</h3>
                      <p className="text-red-700 dark:text-red-300">Unable to render operations metrics</p>
                    </div>
                  );
                }
              })()}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OperationsScoreDistributionChart submissions={filteredAMOperations} />
                <OperationsAverageScoreChart submissions={filteredAMOperations} />
              </div>
              
              <OperationsSectionScoresInfographic submissions={filteredAMOperations} />
              
              <div className="grid grid-cols-1 gap-6">
                <OperationsRadarChart submissions={filteredAMOperations} />
              </div>
            </>
          )}

          {/* QA Dashboard Content */}
          {dashboardType === 'qa' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <QARegionPerformanceInfographic submissions={filteredQAData || []} />
                <QAAMPerformanceInfographic submissions={filteredQAData || []} />
                <QAAuditorPerformanceInfographic submissions={filteredQAData || []} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QAScoreDistributionChart submissions={filteredQAData || []} />
                <QAAverageScoreChart submissions={filteredQAData || []} />
              </div>
              
              <QASectionScoresInfographic submissions={filteredQAData || []} />
              
              <div className="grid grid-cols-1 gap-6">
                <QARadarChart submissions={filteredQAData || []} />
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-10 bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">No Results Found</h3>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              {dashboardType === 'operations' 
                ? 'No AM Operations checklists found. Submit checklists through the Checklists & Surveys section to see data here.'
                : dashboardType === 'training'
                ? 'No Training Audit checklists found. Submit checklists through the Checklists & Surveys section to see data here.'
                : dashboardType === 'qa'
                ? 'No QA checklists found. Submit checklists through the Checklists & Surveys section to see data here.'
                : 'Try adjusting your filters to find data.'
              }
            </p>
        </div>
      )}

      {/* Notification Overlay */}
      <NotificationOverlay
        isVisible={showNotification}
        message={notificationMessage}
        type={notificationType}
      />

      {/* Training Detail Modal */}
      {trainingDetailFilter && (
        <TrainingDetailModal
          isOpen={showTrainingDetail}
          onClose={closeTrainingDetail}
          submissions={trainingDetailFilter.title === 'All Training Submissions' ? (trainingData || []) : (filteredTrainingData || [])}
          filterType={trainingDetailFilter.type}
          filterValue={trainingDetailFilter.value}
          title={trainingDetailFilter.title}
        />
      )}
    </div>
  );
};

export default Dashboard;