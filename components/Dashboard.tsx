import React, { useEffect, useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Submission, Store } from '../types';
import { fetchSubmissions, fetchAMOperationsData, fetchTrainingData, AMOperationsSubmission, TrainingAuditSubmission } from '../services/dataService';
import { hapticFeedback } from '../utils/haptics';
import StatCard from './StatCard';
import Loader from './Loader';
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
import { UserRole, canAccessStore, canAccessAM, canAccessHR } from '../roleMapping';
// Import audit dashboard navigation
import { navigationActions, useCurrentView, useBreadcrumbs } from '../src/audit-dashboard/state';

interface DashboardProps {
  userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole }) => {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [amOperationsData, setAMOperationsData] = useState<AMOperationsSubmission[] | null>(null);
  const [trainingData, setTrainingData] = useState<TrainingAuditSubmission[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [allAreaManagers, setAllAreaManagers] = useState<any[]>([]);
  const [allHRPersonnel, setAllHRPersonnel] = useState<any[]>([]);
  const [hrMappingData, setHrMappingData] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    region: '',
    store: '',
    am: '',
    hr: '',
  });

  // Dashboard type selection
  const [dashboardType, setDashboardType] = useState<'hr' | 'operations' | 'training' | 'consolidated'>('consolidated');

  // Notification overlay state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');

  // Training detail modal state
  const [showTrainingDetail, setShowTrainingDetail] = useState(false);
  const [trainingDetailFilter, setTrainingDetailFilter] = useState<{
    type: 'region' | 'am' | 'hr' | 'store' | 'section';
    value: string;
    title: string;
  } | null>(null);

  // Audit dashboard navigation state
  const currentAuditView = useCurrentView();
  const auditBreadcrumbs = useBreadcrumbs();

  // Training detail modal handlers with audit dashboard navigation
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
    
    // Add audit dashboard navigation
    navigationActions.handleRegionPerfClick(region);
  };

  const handleTrainerClick = (trainerId: string, trainerName: string) => {
    // Original modal functionality
    setTrainingDetailFilter({
      type: 'am',
      value: trainerName,
      title: `Trainer: ${trainerName}`
    });
    setShowTrainingDetail(true);
    
    // Add audit dashboard navigation
    navigationActions.handleTopTrainerClick(trainerId, trainerName);
  };

  const handleSectionClick = (sectionId: string, sectionTitle: string) => {
    // For section clicks, we'll show all data but highlight section performance
    setTrainingDetailFilter({
      type: 'section',
      value: sectionId,
      title: `Section: ${sectionTitle}`
    });
    setShowTrainingDetail(true);
    
    // Add audit dashboard navigation
    navigationActions.handleSectionPerfClick(sectionId);
  };

  const handleScoreRangeClick = (minScore: number, maxScore: number, label: string) => {
    // Add audit dashboard navigation for score distribution
    navigationActions.handleScoreDistribClick(`${minScore}-${maxScore}`);
  };

  const handleStoreClick = (storeId: string, storeName: string) => {
    // Add audit dashboard navigation for store details
    setTrainingDetailFilter({
      type: 'store',
      value: storeId,
      title: `Store: ${storeName}`
    });
    setShowTrainingDetail(true);
    
    // Add audit dashboard navigation
    navigationActions.handleRegionStoreClick(storeId, storeName);
  };

  const closeTrainingDetail = () => {
    setShowTrainingDetail(false);
    setTrainingDetailFilter(null);
  };

  // Auto-populate filters from URL parameters - but only when explicitly intended for dashboard filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hrId = urlParams.get('hrId') || urlParams.get('hr_id');
    const hrName = urlParams.get('hrName') || urlParams.get('hr_name');
    const storeId = urlParams.get('storeId') || urlParams.get('store_id');
    const amId = urlParams.get('amId') || urlParams.get('am_id');
    const region = urlParams.get('region');
    const dashboardFilter = urlParams.get('dashboardFilter'); // Only apply filters if this param exists
    
    // Only auto-populate filters if explicitly intended for dashboard (not when just passing HR for survey)
    if (dashboardFilter || storeId || amId || region) {
      setFilters(prev => ({
        ...prev,
        hr: hrId || prev.hr,
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

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Load HR survey data
      const data = await fetchSubmissions();
      console.log('Dashboard loaded HR survey data:', data.length, 'submissions');
      setSubmissions(data);
      
      // Load AM Operations data
      const amOpsData = await fetchAMOperationsData();
      console.log('Dashboard loaded AM Operations data:', amOpsData.length, 'submissions');
      setAMOperationsData(amOpsData);
      
      // Load Training Audit data
      const trainingAuditData = await fetchTrainingData();
      console.log('Dashboard loaded Training Audit data:', trainingAuditData.length, 'submissions');
      setTrainingData(trainingAuditData);
      
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
    // Load data immediately
    loadData(false);
  }, []);

  const handleRefresh = () => {
    loadData(true);
  };

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
    // If HR is selected but no AM, show stores under that HR
    else if (filters.hr && hrMappingData.length > 0) {
      console.log('Filtering Stores for HR:', filters.hr);
      
      // Get stores where this HR is responsible (HRBP > Regional HR > HR Head priority)
      const hrStoreIds = hrMappingData
        .filter((mapping: any) => 
          mapping.hrbpId === filters.hr || 
          mapping.regionalHrId === filters.hr || 
          mapping.hrHeadId === filters.hr
        )
        .map((mapping: any) => mapping.storeId);
      
      stores = stores.filter(store => hrStoreIds.includes(store.id));
      console.log(`Found ${stores.length} stores for HR ${filters.hr}:`, stores);
    }
    
    return stores;
  }, [filters.region, filters.am, filters.hr, userRole, allStores, hrMappingData]);

  const availableAreaManagers = useMemo(() => {
    let areaManagers = allAreaManagers.filter(am => canAccessAM(userRole, am.id));
    
    // If HR is selected, filter AMs based on HR mapping
    if (filters.hr && hrMappingData.length > 0) {
      console.log('Filtering Area Managers for HR:', filters.hr);
      
      // Check if this is a senior HR role that should have access to all AMs
      if (SENIOR_HR_ROLES.includes(filters.hr)) {
        console.log(`HR ${filters.hr} is a senior role with access to all Area Managers (${areaManagers.length} AMs)`);
        return areaManagers; // Return all accessible AMs without filtering
      }
      
      // Get unique Area Manager IDs that work under this HR
      const hrAreaManagerIds = new Set<string>();
      
      hrMappingData.forEach((mapping: any) => {
        if (mapping.hrbpId === filters.hr || 
            mapping.regionalHrId === filters.hr || 
            mapping.hrHeadId === filters.hr) {
          hrAreaManagerIds.add(mapping.areaManagerId);
        }
      });
      
      areaManagers = areaManagers.filter(am => hrAreaManagerIds.has(am.id));
      console.log(`Found ${areaManagers.length} Area Managers for HR ${filters.hr}:`, areaManagers);
    }
    
    return areaManagers;
  }, [userRole, allAreaManagers, filters.hr, hrMappingData]);

  const availableHRPersonnel = useMemo(() => {
    return allHRPersonnel.filter(hr => canAccessHR(userRole, hr.id));
  }, [userRole, allHRPersonnel]);

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
    if (filters.hr) {
      const beforeHRFilter = filtered.length;
      filtered = filtered.filter(submission => submission.hrId === filters.hr);
      console.log(`HR filter (${filters.hr}): ${beforeHRFilter} -> ${filtered.length} submissions`);
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
      if (userRole.type === 'store') {
        if (!canAccessStore(userRole, submission.storeId)) {
          return false;
        }
      } else if (userRole.type === 'am') {
        if (!canAccessAM(userRole, submission.amId)) {
          return false;
        }
      } else if (userRole.type === 'hr') {
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
      
      if (filters.hr && submission.hrId !== filters.hr) {
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
      if (userRole.type === 'store') {
        if (!canAccessStore(userRole, submission.storeId)) {
          return false;
        }
      } else if (userRole.type === 'am') {
        if (!canAccessAM(userRole, submission.amId)) {
          return false;
        }
      } else if (userRole.type === 'hr') {
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
      if (filters.hr && submission.trainerId !== filters.hr) {
        return false;
      }
      
      return true;
    });
    
    console.log('Dashboard filtering Training Audit - filtered:', filtered.length);
    return filtered;
  }, [trainingData, filters, userRole]);

  const stats = useMemo(() => {
    // For Training dashboard, use Training Audit data
    if (dashboardType === 'training') {
      if (!filteredTrainingData) return null;

      const totalSubmissions = filteredTrainingData.length;
      const avgScore = totalSubmissions > 0 
        ? filteredTrainingData.reduce((acc, s) => acc + parseFloat(s.percentageScore || '0'), 0) / totalSubmissions 
        : 0;
      const uniqueTrainers = new Set(filteredTrainingData.map(s => s.trainerId)).size;
      const uniqueStores = new Set(filteredTrainingData.map(s => s.storeId)).size;

      return {
        totalSubmissions,
        avgScore: Math.round(avgScore),
        uniqueEmployees: uniqueTrainers, // Using trainers for training dashboard
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
      const uniqueTrainers = new Set(filteredAMOperations.map(s => s.trainerId)).size;
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
  }, [filteredSubmissions, filteredAMOperations, filteredTrainingData, dashboardType]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [filterName]: value };
    
    // Cascading reset logic for hierarchical filters
    if (filterName === 'region') {
      newFilters.store = ''; // Reset store when region changes
    } else if (filterName === 'hr') {
      newFilters.am = '';    // Reset AM when HR changes
      newFilters.store = ''; // Reset store when HR changes
    } else if (filterName === 'am') {
      newFilters.store = ''; // Reset store when AM changes
    }
    
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({ region: '', store: '', am: '', hr: '' });
  };

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

  const generatePDFReport = () => {
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
        reportData = filteredTrainingData;
        dataType = 'Training Audit Checklist';
      } else { // consolidated
        if ((!filteredSubmissions || filteredSubmissions.length === 0) && (!filteredAMOperations || filteredAMOperations.length === 0)) {
          alert('No data available to generate report');
          hapticFeedback.error();
          return;
        }
        reportData = filteredSubmissions.length > 0 ? filteredSubmissions : filteredAMOperations;
        dataType = filteredSubmissions.length > 0 ? 'HR Survey' : 'AM Operations Checklist';
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

      if (filters.store) {
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
      } else if (filters.hr) {
        const hrInfo = HR_PERSONNEL.find(hr => hr.id === filters.hr);
        const roleName = dashboardType === 'training' ? 'Trainer' : 'HR Personnel';
        reportTitle = `${dataType} ${roleName} Report`;
        entityDetails = {
          [`${roleName} Name`]: hrInfo?.name || filters.hr,
          [`${roleName} ID`]: filters.hr,
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
                
                // If it's already a Date object
                if (submission.submissionTime instanceof Date) {
                  date = submission.submissionTime;
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
      } else if (filters.hr) {
        const hrInfo = HR_PERSONNEL.find(hr => hr.id === filters.hr);
        filename = `HRConnect_HR_${(hrInfo?.name || filters.hr).replace(/\s+/g, '_')}`;
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
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="text-center text-red-600 dark:text-red-400">{error}</div>;
  }
  
  if (!submissions) {
    return <div className="text-center text-gray-500 dark:text-slate-400">No submission data available.</div>
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

      {/* Last Updated Indicator */}
      {!loading && submissions && (
        <div className="flex justify-end items-center gap-4">
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 2l4 4-4 4"/>
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 019-9h9"/>
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 22l-4-4 4-4"/>
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9H3"/>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}

      {/* Dashboard Type Selector */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Dashboard Type</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setDashboardType('hr')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dashboardType === 'hr'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            HR Survey Dashboard
          </button>
          <button
            onClick={() => setDashboardType('operations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dashboardType === 'operations'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            Operations Checklist Dashboard
          </button>
          <button
            onClick={() => setDashboardType('training')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dashboardType === 'training'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            Training Audit Dashboard
          </button>
          <button
            onClick={() => setDashboardType('consolidated')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dashboardType === 'consolidated'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            Consolidated Dashboard
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
          {dashboardType === 'hr' && 'View insights from HR Employee Satisfaction Surveys'}
          {dashboardType === 'operations' && 'View insights from AM Operations Checklists'}
          {dashboardType === 'training' && 'View insights from Training Audit Checklists'}
          {dashboardType === 'consolidated' && 'View combined insights from all checklist types'}
        </p>
      </div>

      {/* Audit Navigation Breadcrumbs - Only show for training dashboard when navigating */}
      {dashboardType === 'training' && auditBreadcrumbs.length > 1 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-blue-600 dark:text-blue-400 font-medium">Audit Navigation:</span>
            {auditBreadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`${index === auditBreadcrumbs.length - 1 ? 'text-blue-800 dark:text-blue-200 font-semibold' : 'text-blue-600 dark:text-blue-300'}`}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
            <button
              onClick={() => navigationActions.handleRegionFilterClick('')}
              className="ml-4 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
            >
              Reset Navigation
            </button>
          </div>
        </div>
      )}

      <DashboardFilters
        regions={availableRegions}
        stores={availableStores}
        areaManagers={availableAreaManagers}
        hrPersonnel={availableHRPersonnel}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />

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
        (dashboardType === 'consolidated' && (filteredSubmissions.length > 0 || filteredAMOperations.length > 0))) && (
        <div className="flex justify-end">
          <button
            onClick={generatePDFReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Report
          </button>
        </div>
      )}
      
      {/* Check if we have data for the selected dashboard type */}
      {((dashboardType === 'hr' && filteredSubmissions.length > 0) || 
        (dashboardType === 'operations' && filteredAMOperations.length > 0) ||
        (dashboardType === 'training' && filteredTrainingData.length > 0) ||
        (dashboardType === 'consolidated' && (filteredSubmissions.length > 0 || filteredAMOperations.length > 0))) ? (
        <>
          {/* Dashboard Type Specific Content - Removed Coming Soon sections */}
          
          {/* Stats Grid - Different layouts based on dashboard type */}
          {dashboardType === 'training' ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Submissions" value={stats?.totalSubmissions} />
              <StatCard title="Average Score" value={`${stats?.avgScore}%`} />
              <div className="sm:col-span-1 lg:col-span-1">
                <TrainingHealthPieChart submissions={filteredTrainingData} />
              </div>
              <StatCard title="Stores Covered" value={stats?.uniqueStores} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Submissions" value={stats?.totalSubmissions} />
              <StatCard title="Average Score" value={`${stats?.avgScore}%`} />
              <StatCard 
                title={dashboardType === 'operations' ? "Trainers Involved" : "Employees Surveyed"} 
                value={stats?.uniqueEmployees} 
              />
              <StatCard title="Stores Covered" value={stats?.uniqueStores} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <TrainingScoreDistributionChart 
                  submissions={filteredTrainingData} 
                  onScoreRangeClick={handleScoreRangeClick}
                />
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
        </>
      ) : (
        <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100">No Results Found</h3>
            <p className="text-slate-400 mt-1">
              {dashboardType === 'operations' 
                ? 'No AM Operations checklists found. Submit checklists through the Checklists & Surveys section to see data here.'
                : dashboardType === 'training'
                ? 'No Training Audit checklists found. Submit checklists through the Checklists & Surveys section to see data here.'
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
          submissions={filteredTrainingData || []}
          filterType={trainingDetailFilter.type}
          filterValue={trainingDetailFilter.value}
          title={trainingDetailFilter.title}
        />
      )}
    </div>
  );
};

export default Dashboard;