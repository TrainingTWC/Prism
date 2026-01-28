import React, { useEffect, useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { buildTrainingPDF } from '../src/utils/trainingReport';
import { buildOperationsPDF } from '../src/utils/operationsReport';
import { buildQAPDF } from '../src/utils/qaReport';
import { buildHRPDF } from '../src/utils/hrReport';
import { buildSHLPPDF } from '../src/utils/shlpReport';
import { Users, Clipboard, GraduationCap, BarChart3, Brain, Calendar, CheckCircle, TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Submission, Store } from '../types';
import { fetchSubmissions, fetchAMOperationsData, fetchTrainingData, fetchQAData, fetchFinanceData, fetchCampusHiringData, AMOperationsSubmission, TrainingAuditSubmission, QASubmission, FinanceSubmission, CampusHiringSubmission } from '../services/dataService';
import { fetchSHLPData, SHLPSubmission } from '../services/shlpDataService';
import { hapticFeedback } from '../utils/haptics';
import { loadComprehensiveMapping } from '../utils/mappingUtils';
import StatCard from './StatCard';
import Loader from './Loader';
import SkeletonLoader from './SkeletonLoader';
import NotificationOverlay from './NotificationOverlay';
import ScoreDistributionChart from './ScoreDistributionChart';
import AverageScoreByManagerChart from './AverageScoreByManagerChart';
import { QUESTIONS as DEFAULT_QUESTIONS, OPERATIONS_QUESTIONS as DEFAULT_OPERATIONS_QUESTIONS, TRAINING_QUESTIONS as DEFAULT_TRAINING_QUESTIONS, AREA_MANAGERS as DEFAULT_AREA_MANAGERS, HR_PERSONNEL as DEFAULT_HR_PERSONNEL, TRAINER_PERSONNEL, REGIONS, SENIOR_HR_ROLES } from '../constants';
import DashboardFilters from './DashboardFilters';
import { useConfig } from '../contexts/ConfigContext';
import RCACapaAnalysis from './RCACapaAnalysis';
import RegionPerformanceInfographic from './RegionPerformanceInfographic';
import AMPerformanceInfographic from './AMPerformanceInfographic';
import HRPerformanceInfographic from './HRPerformanceInfographic';
import QuestionScoresInfographic from './QuestionScoresInfographic';
import AMRadarChart from './AMRadarChart';
import AMScorecardSection from './AMScorecardSection';
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
import TrainingHealthBreakdownModal from './TrainingHealthBreakdownModal';
import AuditScoreDetailsModal from './AuditScoreDetailsModal';
import HRDetailModal from './HRDetailModal';
import HRBPCalendarModal from './HRBPCalendarModal';
import NowBarMobile from './NowBarMobile';
// Consolidated Dashboard
import ConsolidatedDashboard from './ConsolidatedDashboard';
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
import QAAMPerformanceInfographic from './QAAMPerformanceInfographic';
import QAAverageScoreChart from './QAAverageScoreChart';
import QAEditModal from './QAEditModal';
import CampusHiringStats from './CampusHiringStats';
import TrainerCalendarDashboard from './TrainerCalendarDashboard';
import { UserRole, canAccessStore, canAccessAM, canAccessHR } from '../roleMapping';
import { useAuth } from '../contexts/AuthContext';
import { useEmployeeDirectory } from '../hooks/useEmployeeDirectory';

interface DashboardProps {
  userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole }) => {
  const { userRole: authUserRole, hasPermission, hasDashboardAccess } = useAuth();
  const { config, loading: configLoading } = useConfig();
  const { directory: employeeDirectory, loading: employeeLoading } = useEmployeeDirectory();

  // Use config data if available, otherwise fall back to hardcoded constants
  const QUESTIONS = config?.QUESTIONS || DEFAULT_QUESTIONS;
  const OPERATIONS_QUESTIONS = (config?.OPERATIONS_QUESTIONS && config.OPERATIONS_QUESTIONS.length > 0)
    ? config.OPERATIONS_QUESTIONS
    : DEFAULT_OPERATIONS_QUESTIONS;
  const TRAINING_QUESTIONS = config?.TRAINING_QUESTIONS || DEFAULT_TRAINING_QUESTIONS;
  const AREA_MANAGERS = config?.AREA_MANAGERS || DEFAULT_AREA_MANAGERS;
  const HR_PERSONNEL = config?.HR_PERSONNEL || DEFAULT_HR_PERSONNEL;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [amOperationsData, setAMOperationsData] = useState<AMOperationsSubmission[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingAuditSubmission[]>([]);
  const [qaData, setQAData] = useState<QASubmission[]>([]);
  const [financeData, setFinanceData] = useState<FinanceSubmission[]>([]);
  const [campusHiringData, setCampusHiringData] = useState<CampusHiringSubmission[]>([]);
  const [shlpData, setSHLPData] = useState<SHLPSubmission[]>([]);
  const [expandedFinanceRow, setExpandedFinanceRow] = useState<number | null>(null);
  const [auditCoverageFilters, setAuditCoverageFilters] = useState({
    status: 'all', // all, overdue, due-soon, on-track
    health: 'all', // all, needs-attention, brewing, perfect-shot
    region: 'all',
    am: 'all',
    trainer: 'all'
  });
  const [auditCoverageView, setAuditCoverageView] = useState<'current' | 'history'>('current');
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
    qa: false,
    finance: false,
    campusHiring: false,
    shlp: false
  });

  const [filters, setFilters] = useState({
    region: '',
    store: '',
    am: '',
    trainer: '',
    hrPerson: '', // Separate filter for HR personnel
    health: '',
    month: '', // Month filter for HR dashboard (YYYY-MM format)
    employee: '' // Employee filter for SHLP dashboard
  });

  // Leaderboard view toggle state
  const [leaderboardView, setLeaderboardView] = useState<'count' | 'score'>('count');

  // HRBP Calendar Modal state
  const [selectedHRBP, setSelectedHRBP] = useState<{ id: string; name: string } | null>(null);
  const [showHRBPCalendar, setShowHRBPCalendar] = useState(false);

  // Connect Targets Modal state
  const [showConnectTargetsModal, setShowConnectTargetsModal] = useState(false);

  // Helper to parse DD/MM/YYYY date format from Google Sheets
  const parseSheetDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
      // Handle ISO format (2026-06-01T10:12:31.000Z)
      // Note: ISO dates from Google Sheets with DD/MM/YYYY have month/day swapped
      if (dateStr.includes('T') || dateStr.includes('Z')) {
        const isoDate = new Date(dateStr);
        // Swap month and day since source was DD/MM/YYYY but ISO treats it as YYYY-MM-DD
        const day = isoDate.getMonth() + 1; // What ISO thought was month is actually day
        const month = isoDate.getDate() - 1; // What ISO thought was day is actually month (0-indexed)
        const year = isoDate.getFullYear();
        return new Date(year, month, day);
      }

      // Handle DD/MM/YYYY HH:mm:ss format
      const parts = dateStr.trim().split(' ');
      const dateParts = parts[0].split('/');

      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed
        const year = parseInt(dateParts[2], 10);

        const date = new Date(year, month, day);

        // Add time if available
        if (parts.length > 1) {
          const timeParts = parts[1].split(':');
          if (timeParts.length >= 2) {
            date.setHours(parseInt(timeParts[0], 10));
            date.setMinutes(parseInt(timeParts[1], 10));
            if (timeParts.length > 2) {
              date.setSeconds(parseInt(timeParts[2], 10));
            }
          }
        }

        return date;
      }
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
    }
    return null;
  };
  const [connectTargetsModalType, setConnectTargetsModalType] = useState<'week' | 'month' | 'region' | 'store' | 'am' | 'daily'>('week');

  // Normalized trainer filter id for robust comparisons (handle h3595 vs H3595 etc.)
  const normalizeId = (v: any) => (v === undefined || v === null) ? '' : String(v).toUpperCase();
  const trainerFilterId = normalizeId(filters.trainer);
  const hrPersonFilterId = normalizeId(filters.hrPerson);

  // Helper function to get employee name from ID
  const getEmployeeName = (employeeId: string): string => {
    if (!employeeId) return '';
    const key = normalizeId(employeeId);
    return employeeDirectory.nameById[key] || employeeId;
  };

  // Helper function to convert trainer IDs to names
  const getTrainerNames = (trainerIds: string): string => {
    if (!trainerIds) return '';
    const ids = trainerIds.split(',').map(id => id.trim()).filter(Boolean);
    const names = ids.map(id => getEmployeeName(id) || id);
    return names.join(', ');
  };

  // Helper function to get AM name
  const getAMName = (amId: string): string => {
    if (!amId) return '';
    const amFromConfig = AREA_MANAGERS.find(am => am.id === amId);
    return amFromConfig?.name || getEmployeeName(amId) || amId;
  };

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
      { id: 'shlp', label: 'SHLP Certification', access: 'shlp-dashboard' },
      { id: 'campus-hiring', label: 'Campus Hiring', access: 'campus-hiring-dashboard' },
      { id: 'trainer-calendar', label: 'Trainer Calendar', access: 'trainer-calendar-dashboard' },
      { id: 'bench-planning', label: 'Bench Planning (Barista to SM)', access: 'bench-planning-dashboard' },
      { id: 'bench-planning-sm-asm', label: 'Bench Planning (SM to ASM)', access: 'bench-planning-sm-asm-dashboard' },
      { id: 'consolidated', label: 'Consolidated View', access: 'all' }
    ];

    if (authUserRole === 'editor') {
      return allTypes; // Editor can see everything including consolidated
    }

    // For all other roles (including admin), exclude consolidated dashboard
    return allTypes.filter(type => {
      if (type.id === 'consolidated') {
        return false; // Consolidated is ONLY for editor
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

  // Training health breakdown modal state
  const [showHealthBreakdown, setShowHealthBreakdown] = useState(false);

  // Audit score details modal state
  const [showAuditScoreDetails, setShowAuditScoreDetails] = useState(false);

  // QA Edit modal state
  const [showQAEdit, setShowQAEdit] = useState(false);
  const [qaEditSubmission, setQAEditSubmission] = useState<QASubmission | null>(null);

  // HR detail modal state
  const [showHRDetail, setShowHRDetail] = useState(false);
  const [hrDetailFilter, setHRDetailFilter] = useState<{
    type: 'region' | 'am' | 'hr' | 'store';
    value: string;
    title: string;
  } | null>(null);

  // Training detail modal handlers
  const handleRegionClick = (region: string) => {
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
      try {
        const data = await fetchTrainingData();
        setTrainingData(data);
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

  // HR detail modal handlers
  const handleHRRegionClick = (region: string, label: string) => {
    setHRDetailFilter({
      type: 'region',
      value: 'all',
      title: 'All Regions - HR Employee Surveys'
    });
    setShowHRDetail(true);
  };

  const handleHRAMClick = (amName: string, amId: string) => {
    setHRDetailFilter({
      type: 'region',
      value: 'all',
      title: 'All Area Managers - HR Employee Surveys'
    });
    setShowHRDetail(true);
  };

  const handleHRPersonClick = (hrName: string, hrId: string) => {
    setHRDetailFilter({
      type: 'region',
      value: 'all',
      title: 'All HRBPs - HR Employee Surveys'
    });
    setShowHRDetail(true);
  };

  const closeHRDetail = () => {
    setShowHRDetail(false);
    setHRDetailFilter(null);
  };

  // HR stat card click handlers
  const handleHRTotalSubmissionsClick = () => {
    setHRDetailFilter({
      type: 'region',
      value: 'all',
      title: 'All HR Employee Surveys'
    });
    setShowHRDetail(true);
  };

  const handleHRStoresCoveredClick = () => {
    setHRDetailFilter({
      type: 'region',
      value: 'all',
      title: 'All Stores - HR Surveys'
    });
    setShowHRDetail(true);
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
    }
  }, []);

  // Load stores, area managers, and HR personnel from Google Sheets store mapping
  useEffect(() => {
    const loadMappingData = async () => {
      try {
        // Load from Google Sheets API via mappingUtils
        const mappingData = await loadComprehensiveMapping();

        setHrMappingData(mappingData);
        setCompStoreMapping(mappingData);

        // Extract unique stores
        const storeMap = new Map();
        const amMap = new Map();
        const hrMap = new Map();

        mappingData.forEach((item: any) => {
          const storeId = item['Store ID'] || item.storeId;
          const storeName = item['Store Name'] || item.locationName;
          const region = item.Region || item.region;
          const amId = item['AM'] || item.amId;
          const amName = item['AM Name'] || item.amName;
          const hrbpId = item['HRBP'] || item.hrbpId;
          const regionalHrId = item['Regional HR'] || item.regionalHrId;
          const hrHeadId = item['HR Head'] || item.hrHeadId;
          const lmsHeadId = item['E-Learning Specialist'] || item.lmsHeadId;

          if (storeId && !storeMap.has(storeId)) {
            storeMap.set(storeId, { name: storeName, id: storeId, region });
          }

          if (amId) {
            // Normalize AM ID to uppercase to avoid duplicates (H2396 vs h2396)
            const normalizedAmId = String(amId).toUpperCase();
            if (!amMap.has(normalizedAmId)) {
              // Use AM Name from Google Sheets if available, otherwise try constants
              const finalAmName = amName || AREA_MANAGERS.find(am => String(am.id).toLowerCase() === String(amId).toLowerCase())?.name || `AM ${amId}`;
              amMap.set(normalizedAmId, { name: finalAmName, id: normalizedAmId });
            }
          }

          [
            { id: hrbpId, type: 'HRBP' },
            { id: regionalHrId, type: 'Regional HR' },
            { id: hrHeadId, type: 'HR Head' },
            { id: lmsHeadId, type: 'LMS Head' }
          ].forEach(({ id, type }) => {
            if (id && !hrMap.has(id)) {
              const hrFromConstants = HR_PERSONNEL.find(hr => String(hr.id).toLowerCase() === String(id).toLowerCase());
              hrMap.set(id, { name: hrFromConstants?.name || `${type} ${id}`, id });
            }
          });
        });

        const stores = Array.from(storeMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        const areaManagers = Array.from(amMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        const hrPersonnel = Array.from(hrMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));

        setAllStores(stores);
        setAllAreaManagers(areaManagers);
        setAllHRPersonnel(hrPersonnel);

        // Build Trainer list from Google Sheets store mapping
        const trainerMap = new Map<string, string>();
        mappingData.forEach((row: any) => {
          // Get Trainer 1, 2, 3 from Google Sheets
          const trainer1Id = row['Trainer 1'] || row['Trainer 1 ID'];
          const trainer1Name = row['Trainer 1 Name'];
          const trainer2Id = row['Trainer 2'] || row['Trainer 2 ID'];
          const trainer2Name = row['Trainer 2 Name'];
          const trainer3Id = row['Trainer 3'] || row['Trainer 3 ID'];
          const trainer3Name = row['Trainer 3 Name'];

          if (trainer1Id && trainer1Name) trainerMap.set(String(trainer1Id).trim().toUpperCase(), trainer1Name);
          if (trainer2Id && trainer2Name) trainerMap.set(String(trainer2Id).trim().toUpperCase(), trainer2Name);
          if (trainer3Id && trainer3Name) trainerMap.set(String(trainer3Id).trim().toUpperCase(), trainer3Name);
        });

        const trainersArr: any[] = [];
        trainerMap.forEach((name, id) => {
          trainersArr.push({ id, name });
        });
        trainersArr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        setAllTrainers(trainersArr.length ? trainersArr : TRAINER_PERSONNEL);
      } catch (error) {
        console.error('❌ Dashboard could not load mapping data from Google Sheets:', error);

        // Fallback to local JSON
        try {
          const base = (import.meta as any).env?.BASE_URL || '/';
          const response = await fetch(`${base}comprehensive_store_mapping.json`);
          const mappingData = await response.json();
          setHrMappingData(mappingData);
          setCompStoreMapping(Array.isArray(mappingData) ? mappingData : []);
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          setAllStores([
            { name: 'Defence Colony', id: 'S027' },
            { name: 'Khan Market', id: 'S037' },
            { name: 'UB City', id: 'S007' },
            { name: 'Koramangala 1', id: 'S001' }
          ]);
          setAllAreaManagers(AREA_MANAGERS);
          setAllHRPersonnel(HR_PERSONNEL);
          setAllTrainers(TRAINER_PERSONNEL);
          setHrMappingData([]);
          setCompStoreMapping([]);
        }
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
            setSubmissions(data);
            setDataLoadedFlags(prev => ({ ...prev, hr: true }));

            // Extract unique Area Managers from HR submissions
            // This ensures new AMs who have conducted HR surveys appear in the dropdown
            const existingAmIds = new Set(allAreaManagers.map(am => String(am.id).toUpperCase()));
            const newAMs: any[] = [];

            data.forEach((submission: any) => {
              const amId = submission.amId;
              const amName = submission.amName;

              if (amId && amName) {
                const normalizedAmId = String(amId).toUpperCase();
                if (!existingAmIds.has(normalizedAmId)) {
                  newAMs.push({ id: normalizedAmId, name: amName });
                  existingAmIds.add(normalizedAmId);
                }
              }
            });

            if (newAMs.length > 0) {
              console.log(`✅ Found ${newAMs.length} new Area Managers from HR submissions:`, newAMs);
              setAllAreaManagers(prev => {
                // Deduplicate by ID (case-insensitive) before combining
                const amMap = new Map();
                [...prev, ...newAMs].forEach(am => {
                  const normalizedId = String(am.id).toUpperCase();
                  if (!amMap.has(normalizedId)) {
                    amMap.set(normalizedId, { ...am, id: normalizedId });
                  }
                });
                return Array.from(amMap.values()).sort((a, b) => a.name.localeCompare(b.name));
              });
            }
          }).catch(err => {
            console.error('❌ Failed to load HR data:', err);
          })
        );
      }

      // Load AM Operations data ONLY if currently viewing Operations dashboard OR consolidated view
      if ((targetDashboard === 'operations' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.operations || isRefresh)) {
        loadPromises.push(
          fetchAMOperationsData().then(data => {
            setAMOperationsData(data);
            setDataLoadedFlags(prev => ({ ...prev, operations: true }));
          }).catch(err => {
            console.error('❌ Failed to load AM Operations data:', err);
          })
        );
      }

      // Load Training Audit data ONLY if currently viewing Training dashboard OR consolidated view
      if ((targetDashboard === 'training' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.training || isRefresh)) {
        loadPromises.push(
          fetchTrainingData().then(data => {
            setTrainingData(data);
            setDataLoadedFlags(prev => ({ ...prev, training: true }));
          }).catch(err => {
            console.error('❌ Dashboard: Failed to load Training data:', err);
          })
        );
      }

      // Load QA Assessment data ONLY if currently viewing QA dashboard OR consolidated view
      if ((targetDashboard === 'qa' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.qa || isRefresh)) {
        loadPromises.push(
          fetchQAData().then(data => {
            setQAData(data);
            setDataLoadedFlags(prev => ({ ...prev, qa: true }));
          }).catch(err => {
            console.error('❌ Failed to load QA data:', err);
          })
        );
      }

      // Load Finance Audit data ONLY if currently viewing Finance dashboard OR consolidated view
      if ((targetDashboard === 'finance' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.finance || isRefresh)) {
        loadPromises.push(
          fetchFinanceData().then(data => {
            setFinanceData(data);
            setDataLoadedFlags(prev => ({ ...prev, finance: true }));
          }).catch(err => {
            console.error('❌ Failed to load Finance data:', err);
          })
        );
      }

      // Load Campus Hiring data if viewing campus hiring dashboard or admin consolidated view
      if ((targetDashboard === 'campus-hiring' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.campusHiring || isRefresh)) {
        loadPromises.push(
          fetchCampusHiringData().then(data => {
            setCampusHiringData(data);
            setDataLoadedFlags(prev => ({ ...prev, campusHiring: true }));
          }).catch(err => {
            console.error('❌ Failed to load Campus Hiring data:', err);
          })
        );
      }

      // Load SHLP data ONLY if currently viewing SHLP dashboard OR consolidated view
      if ((targetDashboard === 'shlp' || (targetDashboard === 'consolidated' && isAdmin)) && (!dataLoadedFlags.shlp || isRefresh)) {
        loadPromises.push(
          fetchSHLPData().then(data => {
            setSHLPData(data);
            setDataLoadedFlags(prev => ({ ...prev, shlp: true }));
          }).catch(err => {
            console.error('❌ Failed to load SHLP data:', err);
          })
        );
      }

      // If no promises to load, we're using all cached data
      if (loadPromises.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Load all promises in parallel for better performance
      await Promise.all(loadPromises);

      setError(null);
      setLastRefresh(new Date());
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
    if (filters.am) {
      console.log('Filtering Stores for Area Manager:', filters.am);

      // For Training dashboard, use comprehensive mapping; for others, use HR mapping
      if (compStoreMapping && compStoreMapping.length > 0) {
        const amStoreIds = compStoreMapping
          .filter((mapping: any) => mapping.AM === filters.am || mapping.am === filters.am)
          .map((mapping: any) => mapping['Store ID'] || mapping.storeId || mapping.StoreID || mapping.store_id);

        stores = stores.filter(store => amStoreIds.includes(store.id));
      } else if (hrMappingData.length > 0) {
        // Get stores that belong to this Area Manager from HR mapping
        const amStoreIds = hrMappingData
          .filter((mapping: any) => mapping.areaManagerId === filters.am)
          .map((mapping: any) => mapping.storeId);

        stores = stores.filter(store => amStoreIds.includes(store.id));
      }
    }
    // If Trainer is selected but no AM, show stores under that Trainer using comprehensive mapping
    else if (trainerFilterId && compStoreMapping && compStoreMapping.length > 0) {
      const trainerStoreIds = compStoreMapping
        .filter((m: any) => {
          // Handle comma-separated trainer IDs
          const trainers = (m.Trainer || '').split(',').map((id: string) => normalizeId(id.trim()));
          return trainers.includes(trainerFilterId);
        })
        .map((m: any) => (m['Store ID'] || m.storeId || m.StoreID || m.store_id));
      const uniqueIds = new Set(trainerStoreIds.filter(Boolean));
      stores = stores.filter(store => uniqueIds.has(store.id));
    }

    return stores;
  }, [filters.region, filters.am, filters.trainer, userRole, allStores, hrMappingData, compStoreMapping, dashboardType]);

  const availableAreaManagers = useMemo(() => {
    let areaManagers = allAreaManagers.filter(am => canAccessAM(userRole, am.id));

    // Filter out test AM IDs
    areaManagers = areaManagers.filter(am =>
      am.id !== 'H9001' && am.id !== 'H9002'
    );

    // If HR is selected, filter AMs based on HR mapping
    if (trainerFilterId) {
      // If comp mapping available, use it to find AM IDs
      if (compStoreMapping && compStoreMapping.length > 0) {
        const amIds = new Set<string>();
        compStoreMapping.forEach((m: any) => {
          // Handle comma-separated trainer IDs
          const trainers = (m.Trainer || '').split(',').map((id: string) => normalizeId(id.trim()));
          if (trainers.includes(trainerFilterId)) {
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

    let filtered = [...submissions];

    // Apply role-based filtering
    if (userRole) {
      filtered = filtered.filter(submission =>
        canAccessStore(userRole, submission.storeID)
      );
    }

    // Filter by region
    if (filters.region) {
      filtered = filtered.filter(submission => {
        const store = allStores.find(s => s.id === submission.storeID);
        return store && store.region === filters.region;
      });
    }

    // Filter by store
    if (filters.store) {
      filtered = filtered.filter(submission => submission.storeID === filters.store);
    }

    // Filter by area manager
    if (filters.am) {
      filtered = filtered.filter(submission => submission.amId === filters.am);
    }

    // Filter by trainer (for Training/Operations/QA dashboards)
    if (trainerFilterId) {
      filtered = filtered.filter(submission => normalizeId(submission.hrId) === trainerFilterId || normalizeId((submission as any).trainerId) === trainerFilterId || normalizeId((submission as any).trainer) === trainerFilterId);
    }

    // Filter by HR person (for HR dashboard)
    if (hrPersonFilterId) {
      filtered = filtered.filter(submission => normalizeId(submission.hrId) === hrPersonFilterId);
    }

    // Filter by month (for all dashboards)
    if (filters.month) {
      filtered = filtered.filter(submission => {
        const submissionDate = submission.submissionTime || submission.timestamp || (submission as any).submittedAt;
        if (!submissionDate) return false;

        // Parse date using same logic as HRBPCalendarModal
        let date: Date | null = null;
        const dateStr = String(submissionDate).trim();

        try {
          // Handle ISO-like format that's actually DD-MM-YYYY (e.g., 2025-12-11T... should be 12th November 2025)
          if (dateStr.includes('T') && dateStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
            const [datePart] = dateStr.split('T');
            const [year, dayMonth, day] = datePart.split('-');

            // The format is actually YYYY-DD-MM, not YYYY-MM-DD
            // So 2025-12-11 means 2025, day=12, month=11 (November)
            const actualYear = parseInt(year, 10);
            const actualDay = parseInt(dayMonth, 10);
            const actualMonth = parseInt(day, 10) - 1; // JS months are 0-based (0=Jan, 10=Nov)

            date = new Date(actualYear, actualMonth, actualDay);
          } else if (dateStr.includes('/')) {
            // DD/MM/YYYY format
            const parts = dateStr.split(',')[0].trim().split(' ')[0].split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // JS months are 0-based (0=Jan, 11=Dec)
              const year = parseInt(parts[2], 10);

              date = new Date(year, month, day);

              // Validation - ensure the parsed date makes sense
              if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
                return false;
              }
            }
          }

          if (!date || isNaN(date.getTime())) return false;

          const submissionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return submissionMonth === filters.month;
        } catch (error) {
          return false;
        }
      });
    }

    return filtered;
  }, [submissions, filters, userRole, allStores, trainerFilterId, hrPersonFilterId, dashboardType]);

  const filteredSubmissions = filteredData || [];

  // For consolidated dashboard: create role-restricted but NOT filter-restricted data
  const consolidatedHRData = useMemo(() => {
    if (dashboardType !== 'consolidated' || !submissions) return [];

    return submissions.filter((submission: Submission) => {
      // Only apply role-based access, no other filters
      if (userRole.role === 'store') {
        return canAccessStore(userRole, submission.storeID);
      } else if (userRole.role === 'area_manager') {
        return canAccessAM(userRole, submission.amId);
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        return canAccessHR(userRole, submission.hrId);
      }
      return true; // Admin sees all
    });
  }, [dashboardType, submissions, userRole]);

  const consolidatedOperationsData = useMemo(() => {
    if (dashboardType !== 'consolidated' || !amOperationsData) return [];

    return amOperationsData.filter((submission: AMOperationsSubmission) => {
      // Only apply role-based access, no other filters
      if (userRole.role === 'store') {
        return canAccessStore(userRole, submission.storeId);
      } else if (userRole.role === 'area_manager') {
        return canAccessAM(userRole, submission.amId);
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        return canAccessHR(userRole, submission.hrId);
      }
      return true; // Admin sees all
    });
  }, [dashboardType, amOperationsData, userRole]);

  const consolidatedTrainingData = useMemo(() => {
    if (dashboardType !== 'consolidated' || !trainingData) return [];

    return trainingData.filter((submission: TrainingAuditSubmission) => {
      // Only apply role-based access, no other filters
      if (userRole.role === 'store') {
        return canAccessStore(userRole, submission.storeId);
      } else if (userRole.role === 'area_manager') {
        return canAccessAM(userRole, submission.amId);
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        return canAccessHR(userRole, submission.amId);
      }
      return true; // Admin sees all
    });
  }, [dashboardType, trainingData, userRole]);

  const consolidatedQAData = useMemo(() => {
    if (dashboardType !== 'consolidated' || !qaData) return [];

    return qaData.filter((submission: QASubmission) => {
      // Only apply role-based access, no other filters
      if (userRole.role === 'store') {
        return canAccessStore(userRole, submission.storeId);
      } else if (userRole.role === 'area_manager') {
        return canAccessAM(userRole, submission.amId);
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        return canAccessHR(userRole, submission.amId);
      }
      return true; // Admin sees all
    });
  }, [dashboardType, qaData, userRole]);

  const consolidatedFinanceData = useMemo(() => {
    if (dashboardType !== 'consolidated' || !financeData) return [];

    return financeData.filter((submission: FinanceSubmission) => {
      // Only apply role-based access, no other filters
      if (userRole.role === 'store') {
        return canAccessStore(userRole, submission.storeId);
      } else if (userRole.role === 'area_manager') {
        return canAccessAM(userRole, submission.amId);
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        return canAccessHR(userRole, submission.amId);
      }
      return true; // Admin sees all
    });
  }, [dashboardType, financeData, userRole]);

  const consolidatedSHLPData = useMemo(() => {
    if (dashboardType !== 'consolidated' || !shlpData) return [];

    return shlpData.filter((submission: SHLPSubmission) => {
      // Only apply role-based access, no other filters
      if (userRole.role === 'store') {
        return canAccessStore(userRole, submission.Store);
      } else if (userRole.role === 'area_manager') {
        return canAccessAM(userRole, submission['Area Manager']);
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        return canAccessHR(userRole, submission.Trainer);
      }
      return true; // Admin sees all
    });
  }, [dashboardType, shlpData, userRole]);

  // Filter SHLP data
  const filteredSHLPData = useMemo(() => {
    if (!shlpData) return [];

    let filtered = shlpData.filter((submission: SHLPSubmission) => {
      // Role-based access control
      if (userRole.role === 'store') {
        if (!canAccessStore(userRole, submission.Store)) {
          return false;
        }
      } else if (userRole.role === 'area_manager') {
        if (!canAccessAM(userRole, submission['Area Manager'])) {
          return false;
        }
      } else if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
        if (!canAccessHR(userRole, submission.Trainer)) {
          return false;
        }
      }

      // Apply filters
      if (filters.employee && submission['Employee ID'] !== filters.employee) {
        return false;
      }

      if (filters.region) {
        // Filter by region based on store mapping
        const storeData = compStoreMapping?.find((s: any) => s['Store ID'] === submission.Store);
        if (storeData && storeData.region !== filters.region) {
          return false;
        }
      }

      if (filters.store && submission.Store !== filters.store) {
        return false;
      }

      if (filters.am && submission['Area Manager'] !== filters.am) {
        return false;
      }

      if (filters.trainer && submission.Trainer !== filters.trainer) {
        return false;
      }

      return true;
    });

    return filtered;
  }, [shlpData, filters, userRole]);

  // Filter AM Operations data
  const filteredAMOperations = useMemo(() => {
    if (!amOperationsData) return [];

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

      // Apply month filter
      if (filters.month) {
        const submissionDate = submission.submissionTime || (submission as any).timestamp || (submission as any).submittedAt;
        if (!submissionDate) return false;

        let date: Date;
        const dateStr = String(submissionDate).trim();
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else if (dateStr.includes('/')) {
          const datePart = dateStr.split(',')[0].trim().split(' ')[0];
          const parts = datePart.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            date = new Date(year, month, day);
          } else {
            return false;
          }
        } else {
          date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return false;

        const submissionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (submissionMonth !== filters.month) return false;
      }

      return true;
    });

    return filtered;
  }, [amOperationsData, filters, userRole]);

  // Filter Training Audit data
  const filteredTrainingData = useMemo(() => {
    if (!trainingData) return [];

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

      // Apply month filter
      if (filters.month) {
        const submissionDate = submission.submissionTime || (submission as any).timestamp || (submission as any).submittedAt;
        if (!submissionDate) return false;

        let date: Date;
        const dateStr = String(submissionDate).trim();
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else if (dateStr.includes('/')) {
          const datePart = dateStr.split(',')[0].trim().split(' ')[0];
          const parts = datePart.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            date = new Date(year, month, day);
          } else {
            return false;
          }
        } else {
          date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return false;

        const submissionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (submissionMonth !== filters.month) return false;
      }

      return true;
    });

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
    return deduped;
  }, [trainingData, filters, userRole]);

  // Raw filtered training data (NOT deduplicated) - for audit score details modal
  const rawFilteredTrainingData = useMemo(() => {
    if (!trainingData) return [];

    let filtered = trainingData.filter((submission: TrainingAuditSubmission) => {
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

      if (trainerFilterId) {
        const sTrainer = normalizeId((submission as any).trainerId) || normalizeId((submission as any).trainer) || normalizeId(submission.hrId);
        if (!sTrainer || sTrainer !== trainerFilterId) return false;
      }

      if (filters.health) {
        const pct = parseFloat(submission.percentageScore || '0');
        if (filters.health === 'Needs Attention' && pct >= 56) return false;
        if (filters.health === 'Brewing' && (pct < 56 || pct >= 81)) return false;
        if (filters.health === 'Perfect Shot' && pct < 81) return false;
      }

      // Apply month filter
      if (filters.month) {
        const submissionDate = submission.submissionTime || (submission as any).timestamp || (submission as any).submittedAt;
        if (!submissionDate) return false;

        let date: Date;
        const dateStr = String(submissionDate).trim();
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else if (dateStr.includes('/')) {
          const datePart = dateStr.split(',')[0].trim().split(' ')[0];
          const parts = datePart.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            date = new Date(year, month, day);
          } else {
            return false;
          }
        } else {
          date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return false;

        const submissionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (submissionMonth !== filters.month) return false;
      }

      return true;
    });

    return filtered;
  }, [trainingData, filters, userRole, trainerFilterId]);

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

      // Apply month filter
      if (filters.month) {
        const submissionDate = submission.submissionTime || (submission as any).timestamp || (submission as any).submittedAt;
        if (!submissionDate) return false;

        let date: Date;
        const dateStr = String(submissionDate).trim();
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else if (dateStr.includes('/')) {
          const datePart = dateStr.split(',')[0].trim().split(' ')[0];
          const parts = datePart.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            date = new Date(year, month, day);
          } else {
            return false;
          }
        } else {
          date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return false;

        const submissionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (submissionMonth !== filters.month) return false;
      }

      return true;
    });

    return filtered;
  }, [qaData, filters, userRole]);

  const filteredFinanceData = useMemo(() => {
    if (!financeData) {
      return [];
    }

    let filtered = financeData.filter((submission: FinanceSubmission) => {
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

      // For Finance, hr filter can map to financeId
      if (filters.trainer && submission.financeId !== filters.trainer) {
        return false;
      }

      // Apply month filter
      if (filters.month) {
        const submissionDate = submission.submissionTime || (submission as any).timestamp || (submission as any).submittedAt;
        if (!submissionDate) return false;

        let date: Date;
        const dateStr = String(submissionDate).trim();
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else if (dateStr.includes('/')) {
          const datePart = dateStr.split(',')[0].trim().split(' ')[0];
          const parts = datePart.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            date = new Date(year, month, day);
          } else {
            return false;
          }
        } else {
          date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return false;

        const submissionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (submissionMonth !== filters.month) return false;
      }

      return true;
    });

    return filtered;
  }, [financeData, filters, userRole]);

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

    // For Finance dashboard, use Finance Audit data
    if (dashboardType === 'finance') {
      if (!filteredFinanceData) return null;

      const totalSubmissions = filteredFinanceData.length;
      const avgScore = totalSubmissions > 0
        ? filteredFinanceData.reduce((acc, s) => acc + parseFloat(s.scorePercentage || '0'), 0) / totalSubmissions
        : 0;
      const uniqueAuditors = new Set(filteredFinanceData.map(s => s.financeId)).size;
      const uniqueStores = new Set(filteredFinanceData.map(s => s.storeId)).size;

      return {
        totalSubmissions,
        avgScore: Math.round(avgScore * 100) / 100,
        uniqueAuditors,
        uniqueStores
      };
    }

    // For SHLP dashboard, use SHLP Certification data
    if (dashboardType === 'shlp') {
      if (!filteredSHLPData) return null;

      const totalSubmissions = filteredSHLPData.length;
      const avgScore = totalSubmissions > 0
        ? filteredSHLPData.reduce((acc, s) => acc + parseFloat(s.Overall_Percentage || '0'), 0) / totalSubmissions
        : 0;
      const uniqueTrainers = new Set(filteredSHLPData.map(s => s.Trainer)).size;
      const uniqueStores = new Set(filteredSHLPData.map(s => s.Store)).size;

      return {
        totalSubmissions,
        avgScore: Math.round(avgScore * 100) / 100,
        uniqueTrainers,
        uniqueStores
      };
    }

    // For Training dashboard, prefer filtered Training Audit records when any filter is applied
    if (dashboardType === 'training') {
      // If a filter is active, use the deduped, filtered training data so the header cards change
      const hasFilters = Boolean(filters.region || filters.store || filters.am || filters.trainer || filters.health || filters.month);

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
      if (!trendsData || trendsLoading) {
        return null;
      }

      // Filter to only percentage rows to avoid double counting
      // Each submission has 2 rows: one for 'score' and one for 'percentage'
      let percentageRows = trendsData.filter((r: any) => (r.metric_name || '').toLowerCase() === 'percentage');

      // Apply role-based filtering to trendsData (only for restricted roles)
      const hasRestrictedRole = ['store', 'area_manager', 'hrbp', 'regional_hr', 'hr_head'].includes(userRole.role);
      
      if (hasRestrictedRole) {
        percentageRows = percentageRows.filter((r: any) => {
          const storeId = r.store_id || r.storeId || '';
          if (!storeId) return false;

          // Find store details to get AM and region for role-based checks
          const storeDetails = allStores.find(s => s.id === storeId);
          
          // Role-based access control
          if (userRole.role === 'store') {
            if (!canAccessStore(userRole, storeId)) return false;
          }
          
          if (userRole.role === 'area_manager') {
            const amId = storeDetails?.areaManager || '';
            if (!canAccessAM(userRole, amId)) return false;
          }
          
          if (userRole.role === 'hrbp' || userRole.role === 'regional_hr' || userRole.role === 'hr_head') {
            const amId = storeDetails?.areaManager || '';
            if (!canAccessHR(userRole, amId)) return false;
          }

          return true;
        });
      }

      const totalSubmissions = percentageRows.length;

      // IMPORTANT: Calculate average from LATEST month per store, not all historical months
      // Group by store_id and get the latest period for each store
      const latestPerStore = new Map<string, { period: string; value: number }>();

      percentageRows.forEach((r: any) => {
        const storeId = r.store_id || r.storeId || '';
        const period = r.observed_period || '';
        const value = parseFloat(r.metric_value) || 0;

        if (!storeId || !period) return;

        const existing = latestPerStore.get(storeId);
        if (!existing || period > existing.period) {
          latestPerStore.set(storeId, { period, value });
        }
      });

      // Calculate average from latest values only
      const latestScores = Array.from(latestPerStore.values());
      const avgScore = latestScores.length > 0
        ? latestScores.reduce((acc, item) => acc + item.value, 0) / latestScores.length
        : 0;

      // Get unique stores from the trends data
      const uniqueStores = latestPerStore.size;

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

      const statsResult = {
        totalSubmissions,
        // overall average: mean of each store's latest response up to now
        avgScore: avgLatestPerStore !== null ? avgLatestPerStore : Math.round(avgScore),
        // expose monthly latest/previous as requested (latest = all latest up to now; previous = all latest up to previous month end)
        latestScore: avgLatestPerStore,
        previousScore: avgPrevPerStore,
        uniqueEmployees: uniqueTrainers,
        uniqueStores
      };

      return statsResult;
    }

    // For Operations dashboard, use AM Operations data
    if (dashboardType === 'operations') {
      if (!filteredAMOperations) return null;

      const totalSubmissions = filteredAMOperations.length;

      // Debug each score calculation
      console.log('🔍 Operations Dashboard Stats - Debugging scores:');
      const scores = filteredAMOperations.map((s, idx) => {
        const rawScore = s.percentageScore || '0';
        const parsed = parseFloat(rawScore);
        console.log(`Submission ${idx + 1}:`, {
          percentageScore: s.percentageScore,
          rawScore,
          parsed,
          storeId: s.storeId,
          submissionTime: s.submissionTime
        });
        return parsed;
      });

      const avgScore = totalSubmissions > 0
        ? scores.reduce((acc, s) => acc + s, 0) / totalSubmissions
        : 0;
      
      console.log('📊 Final Operations Stats:', {
        totalSubmissions,
        scores,
        avgScore,
        roundedAvgScore: Math.round(avgScore)
      });

      const uniqueTrainers = new Set(filteredAMOperations.map(s => normalizeId((s as any).trainerId) || normalizeId((s as any).trainer) || normalizeId((s as any).hrId))).size;
      const uniqueStores = new Set(filteredAMOperations.map(s => s.storeId)).size;

      const result = {
        totalSubmissions,
        avgScore: Math.round(avgScore),
        uniqueEmployees: uniqueTrainers, // Using trainers instead of employees for operations
        uniqueStores
      };

      return result;
    }

    // For HR and Consolidated dashboards, use HR survey data
    if (!filteredSubmissions) return null;

    const totalSubmissions = filteredSubmissions.length;
    const avgScore = totalSubmissions > 0 ? filteredSubmissions.reduce((acc, s) => acc + s.percent, 0) / totalSubmissions : 0;
    const uniqueEmployees = new Set(filteredSubmissions.map(s => s.empId)).size;
    const uniqueStores = new Set(filteredSubmissions.map(s => s.storeID)).size;

    // Calculate total employees from Supabase directory - only if fully loaded
    const totalEmployees = (!employeeLoading && employeeDirectory?.byId) ? Object.keys(employeeDirectory.byId).length : 0;

    const idealConnects = totalEmployees * 12; // 12 connects per employee per year
    // Actual connects = unique employees who have submitted (not total submissions)
    const actualConnects = uniqueEmployees;

    // Build store-to-region and store-to-AM maps from comprehensive mapping
    const storeToRegionMap = new Map<string, string>();
    const storeToAMMap = new Map<string, string>();

    if (compStoreMapping && Array.isArray(compStoreMapping)) {
      compStoreMapping.forEach((row: any) => {
        const storeId = String(row['Store ID'] || row.storeId || row.StoreID || row.store_id || '').trim();
        const region = row.Region || row.region;
        const amId = row.AM || row.areaManagerId;

        if (storeId) {
          if (region) storeToRegionMap.set(storeId, region);
          if (amId) storeToAMMap.set(storeId, String(amId).toUpperCase());
        }
      });
    }

    // Count employees per Region, Store, and AM from employee directory
    const employeesPerRegion: { [key: string]: number } = {};
    const employeesPerStore: { [key: string]: number } = {};
    const employeesPerAM: { [key: string]: number } = {};

    if (employeeDirectory?.byId) {
      Object.values(employeeDirectory.byId).forEach((emp: any) => {
        const storeCode = String(emp.store_code || '').trim();

        // Derive region from employee data or store mapping
        let region = emp.region || (storeCode ? storeToRegionMap.get(storeCode) : null) || 'Unknown';
        employeesPerRegion[region] = (employeesPerRegion[region] || 0) + 1;

        // Count by store
        if (storeCode) {
          employeesPerStore[storeCode] = (employeesPerStore[storeCode] || 0) + 1;
        }

        // Derive AM from store mapping (employees don't have AM_Code directly)
        let amCode = storeCode ? storeToAMMap.get(storeCode) : null;
        if (amCode) {
          amCode = String(amCode).toUpperCase();
          employeesPerAM[amCode] = (employeesPerAM[amCode] || 0) + 1;
        }
      });
    }

    // Regional breakdown - initialize with all regions from employee directory
    const byRegion: { [key: string]: { connects: number; employees: Set<string>; submissions: number; totalEmployees: number } } = {};

    // First, initialize all regions with their employee counts
    Object.keys(employeesPerRegion).forEach(region => {
      byRegion[region] = {
        connects: 0,
        employees: new Set(),
        submissions: 0,
        totalEmployees: employeesPerRegion[region] || 0
      };
    });

    // Then add submission data
    filteredSubmissions.forEach(s => {
      const storeId = String(s.storeID || '').trim();
      const region = s.region || (storeId ? storeToRegionMap.get(storeId) : null) || 'Unknown';

      // Ensure region exists in byRegion
      if (!byRegion[region]) {
        byRegion[region] = {
          connects: 0,
          employees: new Set(),
          submissions: 0,
          totalEmployees: employeesPerRegion[region] || 0
        };
      }

      byRegion[region].employees.add(s.empId);
      byRegion[region].submissions++;
    });

    Object.keys(byRegion).forEach(region => {
      byRegion[region].connects = byRegion[region].employees.size;
    });

    // Store breakdown - initialize with all stores from employee directory
    const byStore: { [key: string]: { storeName: string; connects: number; employees: Set<string>; submissions: number; region?: string; totalEmployees: number } } = {};

    // First, initialize all stores with their employee counts
    Object.keys(employeesPerStore).forEach(storeId => {
      const storeName = allStores.find(s => s.id === storeId)?.name || storeId;
      const region = storeToRegionMap.get(storeId);
      byStore[storeId] = {
        storeName,
        connects: 0,
        employees: new Set(),
        submissions: 0,
        region,
        totalEmployees: employeesPerStore[storeId] || 0
      };
    });

    // Then add submission data
    filteredSubmissions.forEach(s => {
      const storeId = String(s.storeID || '').trim();
      if (!storeId) return; // Skip if no store ID

      const region = s.region || (storeId ? storeToRegionMap.get(storeId) : null);

      // Ensure store exists in byStore
      if (!byStore[storeId]) {
        byStore[storeId] = {
          storeName: s.storeName || storeId,
          connects: 0,
          employees: new Set(),
          submissions: 0,
          region: region,
          totalEmployees: employeesPerStore[storeId] || 0
        };
      }

      byStore[storeId].employees.add(s.empId);
      byStore[storeId].submissions++;
    });

    Object.keys(byStore).forEach(storeId => {
      byStore[storeId].connects = byStore[storeId].employees.size;
    });

    // AM breakdown - initialize with all AMs from employee directory
    const byAM: { [key: string]: { amName: string; connects: number; employees: Set<string>; submissions: number; totalEmployees: number } } = {};

    // First, initialize all AMs with their employee counts
    Object.keys(employeesPerAM).forEach(amId => {
      const amName = AREA_MANAGERS.find(am => am.id.toUpperCase() === amId)?.name || amId;
      byAM[amId] = {
        amName,
        connects: 0,
        employees: new Set(),
        submissions: 0,
        totalEmployees: employeesPerAM[amId] || 0
      };
    });

    // Then add submission data
    filteredSubmissions.forEach(s => {
      const storeId = String(s.storeID || '').trim();
      let amId = s.amId || (storeId ? storeToAMMap.get(storeId) : null);

      if (amId) {
        amId = String(amId).toUpperCase();

        // Ensure AM exists in byAM
        if (!byAM[amId]) {
          byAM[amId] = {
            amName: s.amName || AREA_MANAGERS.find(am => am.id.toUpperCase() === amId)?.name || amId,
            connects: 0,
            employees: new Set(),
            submissions: 0,
            totalEmployees: employeesPerAM[amId] || 0
          };
        }

        byAM[amId].employees.add(s.empId);
        byAM[amId].submissions++;
      }
    });

    Object.keys(byAM).forEach(amId => {
      byAM[amId].connects = byAM[amId].employees.size;
    });

    // Time-based tracking (3 connects per day per HRBP)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    // Week-wise: Get current week (Mon-Sun)
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Calculate days back to Monday
    const weekStart = new Date(now);
    weekStart.setDate(currentDate + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Month-wise: Current month start to now
    const monthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    const daysInMonth = monthEnd.getDate();
    const daysElapsedInMonth = currentDate; // Days from 1st to today

    // Count unique HRBPs in filtered data
    const activeHRBPs = new Set(filteredSubmissions.map(s => s.hrId)).size;
    const numHRBPs = activeHRBPs > 0 ? activeHRBPs : 1; // At least 1 to avoid division by zero

    // Calculate actual connects in current week and month
    let weekConnects = 0;
    let monthConnects = 0;
    const weekEmployees = new Set<string>();
    const monthEmployees = new Set<string>();

    filteredSubmissions.forEach(s => {
      try {
        const submissionDate = new Date(s.submissionTime);
        if (!isNaN(submissionDate.getTime())) {
          // Week check
          if (submissionDate >= weekStart && submissionDate <= weekEnd) {
            weekEmployees.add(s.empId);
          }
          // Month check
          if (submissionDate >= monthStart && submissionDate <= now) {
            monthEmployees.add(s.empId);
          }
        }
      } catch (error) {
        // Skip invalid dates
      }
    });

    weekConnects = weekEmployees.size;
    monthConnects = monthEmployees.size;

    // Calculate targets based on 3 connects per day per HRBP
    // Week: assuming 5-6 working days (using 6 to include Saturday)
    const workingDaysInWeek = 6; // Mon-Sat
    const weekTarget = numHRBPs * 3 * workingDaysInWeek; // HRBPs × 3 employees/day × 6 working days

    // Month: 24 working days as per standard
    const workingDaysInMonth = 24;
    const workingDaysElapsedInMonth = Math.min(daysElapsedInMonth, workingDaysInMonth);
    const monthTarget = numHRBPs * 3 * workingDaysElapsedInMonth; // HRBPs × 3 employees/day × working days elapsed

    return {
      totalSubmissions,
      avgScore: Math.round(avgScore),
      uniqueEmployees,
      uniqueStores,
      totalEmployees,
      idealConnects,
      actualConnects,
      // Dimensional breakdowns
      byRegion,
      byStore,
      byAM,
      // Time-based tracking
      weekConnects,
      weekTarget,
      weekProgress: weekTarget > 0 ? Math.round((weekConnects / weekTarget) * 100) : 0,
      monthConnects,
      monthTarget,
      monthProgress: monthTarget > 0 ? Math.round((monthConnects / monthTarget) * 100) : 0,
      workingDaysInWeek,
      workingDaysElapsedInMonth,
      workingDaysInMonth,
      numHRBPs
    };
  }, [filteredSubmissions, filteredAMOperations, filteredTrainingData, filteredQAData, filteredFinanceData, filteredSHLPData, dashboardType, trendsData, trendsLoading, trainingData, filters, employeeDirectory, employeeLoading]);

  // Helper to compute the Average Score display string robustly
  const getAverageScoreDisplay = () => {
    // Operations dashboard - show as percentage
    if (dashboardType === 'operations') {
      return stats?.avgScore != null ? `${stats.avgScore}%` : '—';
    }

    // QA dashboard - show as percentage
    if (dashboardType === 'qa') {
      return stats?.avgScore != null ? `${stats.avgScore}%` : '—';
    }

    // HR dashboard - show as 1-5 scale
    if (dashboardType === 'hr') {
      if (stats?.avgScore != null) {
        const score = ((stats.avgScore / 100) * 4 + 1).toFixed(1); // Convert percentage to 1-5 scale
        return `${score}/5`;
      }
      return '—';
    }

    // Training dashboard special handling - show as 1-5 scale
    if (dashboardType === 'training') {
      const hasFilters = Boolean(filters.region || filters.store || filters.am || filters.trainer || filters.health || filters.month);
      if (hasFilters) {
        if (!stats) return '—';
        const latestScore = (((stats as any).latestScore / 100) * 5).toFixed(1);
        const prevScore = (stats as any).previousScore !== null && (stats as any).previousScore !== undefined
          ? (((stats as any).previousScore / 100) * 5).toFixed(1)
          : null;
        const prevPart = prevScore !== null ? ` (Prev ${prevScore}/5)` : '';
        return `${latestScore}/5${prevPart}`;
      }

      // No filters: prefer trendsData aggregated average
      // Prefer monthly latest/previous values when available (computed in stats)
      if (stats && ((stats as any).latestScore !== null && (stats as any).latestScore !== undefined)) {
        const latestScore = (((stats as any).latestScore / 100) * 5).toFixed(1);
        const prevScore = (stats as any).previousScore !== null && (stats as any).previousScore !== undefined
          ? (((stats as any).previousScore / 100) * 5).toFixed(1)
          : null;
        const prevPart = prevScore !== null ? ` (Prev ${prevScore}/5)` : '';
        return `${latestScore}/5${prevPart}`;
      }

      // Fallback to aggregated average if monthly breakdown not present
      if (stats && stats.avgScore != null) return `${((stats.avgScore / 100) * 5).toFixed(1)}/5`;
      if (!trendsLoading && trendsData) {
        const percentageRows = trendsData.filter((r: any) => (r.metric_name || '').toLowerCase() === 'percentage');
        if (percentageRows.length > 0) {
          const avg = percentageRows.reduce((acc: number, r: any) => acc + (parseFloat(r.metric_value) || 0), 0) / percentageRows.length;
          return `${((avg / 100) * 5).toFixed(1)}/5`;
        }
      }
      return '—';
    }

    // Default fallback
    return stats?.avgScore != null ? `${stats.avgScore}%` : '—';
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
    setFilters({ region: '', store: '', am: '', trainer: '', hrPerson: '', health: '', month: '', employee: '' });
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
      } else if (dashboardType === 'shlp') {
        if (!filteredSHLPData || filteredSHLPData.length === 0) {
          alert('No SHLP Certification data available to generate report');
          hapticFeedback.error();
          return;
        }
        reportData = filteredSHLPData;
        dataType = 'SHLP Certification Assessment';
      } else { // consolidated
        if ((!filteredSubmissions || filteredSubmissions.length === 0) &&
          (!filteredAMOperations || filteredAMOperations.length === 0) &&
          (!filteredTrainingData || filteredTrainingData.length === 0) &&
          (!filteredQAData || filteredQAData.length === 0) &&
          (!filteredSHLPData || filteredSHLPData.length === 0)) {
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
          meta.auditorName = firstRecord.auditorName || firstRecord.auditor_name || '';
          meta.auditorId = firstRecord.auditorId || firstRecord.auditor_id || '';
          // Capture MOD from single record if present
          if (firstRecord.mod) meta.mod = firstRecord.mod;
        } else if (reportData.length > 0) {
          meta.trainerName = 'Multiple Trainers';
          meta.trainerId = '';
          meta.auditorName = 'Multiple Auditors';
          meta.auditorId = '';
        }

        // AM filter
        if (filters.am) {
          const am = AREA_MANAGERS.find(a => a.id === filters.am);
          meta.amName = am?.name || filters.am;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.amName = firstRecord.amName || firstRecord.am_name || '';
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

      // AM Operations dashboard: use the operations-specific PDF builder (same look & feel as training)
      if (dashboardType === 'operations') {
        const meta: any = {};
        if (filters.store) {
          const s = allStores.find(s => s.id === filters.store);
          meta.storeName = s?.name || filters.store;
          meta.storeId = filters.store;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.storeName = firstRecord.storeName || firstRecord.store_name || '';
          meta.storeId = firstRecord.storeId || firstRecord.storeID || '';
          if (firstRecord.mod) meta.mod = firstRecord.mod;
        } else if (filters.region) {
          meta.storeName = `${filters.region} Region`;
          meta.storeId = '';
        } else if (reportData.length > 0) {
          meta.storeName = 'All Stores (Filtered)';
          meta.storeId = '';
        }

        if (filters.trainer) {
          const t = HR_PERSONNEL.find(h => h.id === filters.trainer) || AREA_MANAGERS.find(a => a.id === filters.trainer);
          meta.trainerName = t?.name || filters.trainer;
          meta.trainerId = filters.trainer;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.trainerName = firstRecord.trainerName || firstRecord.trainer_name || '';
          meta.trainerId = firstRecord.trainerId || firstRecord.trainer_id || '';
          if (firstRecord.mod) meta.mod = firstRecord.mod;
        } else if (reportData.length > 0) {
          meta.trainerName = 'Multiple Trainers';
          meta.trainerId = '';
        }

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

        if (reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.totalScore = firstRecord.totalScore || 0;
          meta.maxScore = firstRecord.maxScore || 100;
          meta.percentage = Math.round(firstRecord.percentageScore || firstRecord.percentage_score || 0);
        } else if (reportData.length > 1) {
          const totalPct = reportData.reduce((sum, r: any) => sum + parseFloat(r.percentageScore || r.percentage_score || 0), 0);
          meta.percentage = Math.round(totalPct / reportData.length);
          meta.totalScore = `Avg`;
          meta.maxScore = 100;
        }

        if (lastRefresh) meta.date = lastRefresh.toLocaleString();

        const fileName = `AMOperations_${meta.storeName || meta.storeId || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
        const pdf = await buildOperationsPDF(reportData as any, meta, { title: 'AM Operations Report' });
        pdf.save(fileName);
        setIsGenerating(false);
        showNotificationMessage('AM Operations PDF generated successfully!', 'success');
        return;
      }

      // QA Assessment dashboard: use the QA-specific PDF builder (same look & feel as training)
      if (dashboardType === 'qa') {
        const meta: any = {};

        // Store filter
        if (filters.store) {
          const s = allStores.find(s => s.id === filters.store);
          meta.storeName = s?.name || filters.store;
          meta.storeId = filters.store;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.storeName = firstRecord.storeName || firstRecord.store_name || firstRecord.Store || '';
          meta.storeId = firstRecord.storeId || firstRecord.store_id || firstRecord.StoreID || '';
        }

        // Region filter
        if (filters.region) {
          meta.region = filters.region;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.region = firstRecord.region || firstRecord.Region || '';
        }

        // Auditor filter
        if (filters.am) {
          const amInfo = AREA_MANAGERS.find(am => am.id === filters.am);
          meta.auditorName = amInfo?.name || filters.am;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.auditorName = firstRecord.auditorName || firstRecord.auditor || firstRecord.Auditor || '';
        }

        // Date metadata
        if (lastRefresh) meta.date = lastRefresh.toLocaleString();

        const fileName = `QA_Assessment_${meta.storeName || meta.storeId || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;

        // Retrieve question images from the submission data (if available) or localStorage
        let questionImages: Record<string, string[]> = {};
        try {
          // First, try to get images from the submission data (for downloaded reports)
          if (reportData.length > 0) {
            const firstRecord = reportData[0] as any;

            if (firstRecord.questionImagesJSON || firstRecord['Question Images JSON']) {
              const imagesJSON = firstRecord.questionImagesJSON || firstRecord['Question Images JSON'];
              questionImages = JSON.parse(imagesJSON);
              console.log('📸 Loaded images from submission:', Object.keys(questionImages).length, 'image sets');
            }
          }

          // Fallback to localStorage if no images in submission (for current session)
          if (Object.keys(questionImages).length === 0) {
            const storedImages = localStorage.getItem('qa_images');
            if (storedImages) {
              questionImages = JSON.parse(storedImages);
              console.log('📸 Loaded images from localStorage:', Object.keys(questionImages).length, 'image sets');
            }
          }
        } catch (error) {
          console.error('❌ Could not load question images:', error);
        }

        console.log('📝 Building QA PDF with submission data:', reportData[0]);
        console.log('📝 Question Remarks JSON field:', reportData[0]?.['Question Remarks JSON'] || reportData[0]?.questionRemarksJSON);

        const pdf = await buildQAPDF(reportData as any, meta, { title: 'QA Assessment Report' }, questionImages);
        pdf.save(fileName);
        setIsGenerating(false);
        showNotificationMessage('QA Assessment PDF generated successfully!', 'success');
        return;
      }

      // HR dashboard: use the HR-specific PDF builder (similar to training)
      if (dashboardType === 'hr') {
        const meta: any = {};

        // Store filter
        if (filters.store) {
          const s = allStores.find(s => s.id === filters.store);
          meta.storeName = s?.name || filters.store;
          meta.storeId = filters.store;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.storeName = firstRecord.storeName || firstRecord.store_name || '';
          meta.storeId = firstRecord.storeId || firstRecord.storeID || '';
        } else if (filters.region) {
          meta.storeName = `${filters.region} Region`;
          meta.storeId = '';
        } else if (reportData.length > 0) {
          meta.storeName = 'All Stores (Filtered)';
          meta.storeId = '';
        }

        // HR Person filter
        if (filters.hrPerson) {
          const hr = HR_PERSONNEL.find(h => h.id === filters.hrPerson);
          meta.hrPersonName = hr?.name || filters.hrPerson;
          meta.hrPersonId = filters.hrPerson;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.hrPersonName = firstRecord.hrPersonName || firstRecord.hr_person || '';
          meta.hrPersonId = firstRecord.hrPersonId || firstRecord.hr_person_id || '';
        } else if (reportData.length > 0) {
          meta.hrPersonName = 'Multiple HR Personnel';
          meta.hrPersonId = '';
        }

        // AM filter
        if (filters.am) {
          const am = AREA_MANAGERS.find(a => a.id === filters.am);
          meta.amName = am?.name || filters.am;
        } else if (reportData.length > 0 && reportData.length === 1) {
          const firstRecord = reportData[0] as any;
          meta.amName = firstRecord.amName || firstRecord.am_name || '';
        }

        // Date metadata
        if (lastRefresh) meta.date = lastRefresh.toLocaleString();

        const fileName = `HR_Survey_${meta.storeName || meta.storeId || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
        const pdf = await buildHRPDF(reportData as any, meta, { title: 'HR Employee Survey' });
        pdf.save(fileName);
        setIsGenerating(false);
        showNotificationMessage('HR Survey PDF generated successfully!', 'success');
        return;
      }

      // SHLP dashboard: use the SHLP-specific PDF builder
      if (dashboardType === 'shlp') {
        const meta: any = {};
        const firstRecord = reportData.length > 0 ? reportData[0] as any : null;

        // Store filter - prioritize store name from mapping
        if (filters.store) {
          const s = allStores.find(s => s.id === filters.store);
          meta.storeName = s?.name || filters.store;
          meta.storeId = filters.store;
        } else if (firstRecord) {
          // Get store ID and look up name from mapping
          const storeId = firstRecord['Store'] || firstRecord.storeId || '';
          const storeInfo = allStores.find(s => s.id === storeId);
          meta.storeName = storeInfo?.name || storeId;
          meta.storeId = storeId;
        } else if (filters.region) {
          meta.storeName = `${filters.region} Region`;
          meta.storeId = '';
        } else if (reportData.length > 0) {
          meta.storeName = 'All Stores (Filtered)';
          meta.storeId = '';
        }

        // Employee filter
        if (filters.employee) {
          const emp = employeeDirectory.find(e => e.employee_id === filters.employee);
          meta.employeeName = emp?.name || filters.employee;
          meta.employeeId = filters.employee;
        } else if (firstRecord) {
          meta.employeeName = firstRecord['Employee Name'] || '';
          meta.employeeId = firstRecord['Employee ID'] || '';
        }

        // Trainer filter - get name from personnel list
        if (filters.trainer) {
          const t = HR_PERSONNEL.find(h => h.id === filters.trainer) || AREA_MANAGERS.find(a => a.id === filters.trainer);
          meta.trainerName = t?.name || filters.trainer;
        } else if (firstRecord) {
          const trainerId = firstRecord['Trainer'] || '';
          const trainerInfo = HR_PERSONNEL.find(h => h.id === trainerId) || AREA_MANAGERS.find(a => a.id === trainerId);
          meta.trainerName = trainerInfo?.name || trainerId;
        }

        // AM filter - get name from area managers list
        if (filters.am) {
          const am = AREA_MANAGERS.find(a => a.id === filters.am);
          meta.amName = am?.name || filters.am;
          meta.auditorName = am?.name || filters.am;
        } else if (firstRecord) {
          const amId = firstRecord['Area Manager'] || '';
          const amInfo = AREA_MANAGERS.find(a => a.id === amId);
          meta.amName = amInfo?.name || amId;

          const auditorName = firstRecord['Auditor Name'] || '';
          meta.auditorName = auditorName;
        }

        // Date metadata - use submission time from the record
        if (firstRecord && firstRecord['Submission Time']) {
          meta.date = firstRecord['Submission Time'];
        } else if (lastRefresh) {
          meta.date = lastRefresh.toLocaleString();
        }

        const fileName = `SHLP_Certification_${meta.employeeName?.replace(/\s+/g, '_') || meta.storeName?.replace(/\s+/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;

        const pdf = await buildSHLPPDF(reportData as any, meta, { title: 'SHLP Certification Assessment' });
        pdf.save(fileName);
        setIsGenerating(false);
        showNotificationMessage('SHLP Certification PDF generated successfully!', 'success');
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
        const trainingWeights: Record<string, { w: number, wneg?: number }> = {
          'TM_1': { w: 1 }, 'TM_2': { w: 1 }, 'TM_3': { w: 1 }, 'TM_4': { w: 1 }, 'TM_5': { w: 2 },
          'TM_6': { w: 1 }, 'TM_7': { w: 1 }, 'TM_8': { w: 1 }, 'TM_9': { w: 1 },
          'LMS_1': { w: 4, wneg: -4 }, 'LMS_2': { w: 4, wneg: -4 }, 'LMS_3': { w: 2 },
          'Buddy_1': { w: 2 }, 'Buddy_2': { w: 2 }, 'Buddy_3': { w: 1 }, 'Buddy_4': { w: 2 }, 'Buddy_5': { w: 2 }, 'Buddy_6': { w: 1 },
          'NJ_1': { w: 1 }, 'NJ_2': { w: 1 }, 'NJ_3': { w: 1 }, 'NJ_4': { w: 1 }, 'NJ_5': { w: 2 }, 'NJ_6': { w: 2 }, 'NJ_7': { w: 2 },
          'PK_1': { w: 2 }, 'PK_2': { w: 2 }, 'PK_3': { w: 2 }, 'PK_4': { w: 2 }, 'PK_5': { w: 2 }, 'PK_6': { w: 2 }, 'PK_7': { w: 3, wneg: -3 },
          'TSA_1': { w: 10 }, 'TSA_2': { w: 10 }, 'TSA_3': { w: 10 },
          'CX_1': { w: 1 }, 'CX_2': { w: 1 }, 'CX_3': { w: 1 }, 'CX_4': { w: 1 }, 'CX_5': { w: 2 }, 'CX_6': { w: 1 }, 'CX_7': { w: 1 }, 'CX_8': { w: 1 }, 'CX_9': { w: 1 },
          'AP_1': { w: 1, wneg: -1 }, 'AP_2': { w: 2 }, 'AP_3': { w: 2 }
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
        const ts = new Date().toISOString().replace(/[:.]/g, '').replace('T', '_').slice(0, 15);
        doc.save(`HRPulse_${emp}_${ts}.pdf`);
      } else {
        doc.save(`${filename}_${Date.now()}.pdf`);
      }
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

  const generateExcelReport = () => {
    try {
      hapticFeedback.confirm();

      // Only support Excel export for HR dashboard
      if (dashboardType !== 'hr') {
        alert('Excel export is only available for HR Connect dashboard');
        hapticFeedback.error();
        return;
      }

      if (!filteredSubmissions || filteredSubmissions.length === 0) {
        alert('No HR survey data available to export');
        hapticFeedback.error();
        return;
      }

      // Prepare data in Google Sheet format
      const excelData = filteredSubmissions.map(submission => {
        // Parse submission time - handle both ISO and DD/MM/YYYY formats
        let submissionDate = '';
        if (submission.submissionTime) {
          try {
            const date = new Date(submission.submissionTime);
            if (!isNaN(date.getTime())) {
              submissionDate = submission.submissionTime;
            }
          } catch (e) {
            submissionDate = submission.submissionTime;
          }
        }

        return {
          'Server Timestamp': new Date().toISOString(),
          'Submission Time': submissionDate,
          'HR Name': submission.hrName || '',
          'HR ID': submission.hrId || '',
          'AM Name': submission.amName || '',
          'AM ID': submission.amId || '',
          'Emp Name': submission.empName || '',
          'Emp ID': submission.empId || '',
          'Store Name': submission.storeName || '',
          'Store ID': submission.storeID || '',
          'Region': submission.region || '',
          'Q1 - Work Pressure in Café': submission.q1 || '',
          'Q1 Remarks': submission.q1_remarks || '',
          'Q2 - Decision Making & Customer Problem Solving': submission.q2 || '',
          'Q2 Remarks': submission.q2_remarks || '',
          'Q3 - Performance Reviews & SM/AM Feedback': submission.q3 || '',
          'Q3 Remarks': submission.q3_remarks || '',
          'Q4 - Team Treatment & Partiality': submission.q4 || '',
          'Q4 Remarks': submission.q4_remarks || '',
          'Q5 - Wings Program Training': submission.q5 || '',
          'Q5 Remarks': submission.q5_remarks || '',
          'Q6 - Operational Apps & Benefits Issues': submission.q6 || '',
          'Q6 Remarks': submission.q6_remarks || '',
          'Q7 - HR Handbook & Policies': submission.q7 || '',
          'Q7 Remarks': submission.q7_remarks || '',
          'Q8 - Work Schedule Satisfaction': submission.q8 || '',
          'Q8 Remarks': submission.q8_remarks || '',
          'Q9 - Team Collaboration': submission.q9 || '',
          'Q9 Remarks': submission.q9_remarks || '',
          'Q10 - Helpful Colleague': submission.q10 || '',
          'Q10 Remarks': submission.q10_remarks || '',
          'Q11 - Suggestions for Organization': submission.q11 || '',
          'Q11 Remarks': submission.q11_remarks || '',
          'Q12 - TWC Experience Rating': submission.q12 || '',
          'Q12 Remarks': submission.q12_remarks || '',
          'Total Score': submission.totalScore || 0,
          'Max Score': submission.maxScore || 0,
          'Score (1-5)': ((submission.percent || 0) / 100 * 5).toFixed(1)
        };
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'HR Connect');

      // Auto-size columns
      const maxWidths: { [key: number]: number } = {};
      const headers = Object.keys(excelData[0] || {});

      headers.forEach((header, colIndex) => {
        maxWidths[colIndex] = header.length;
      });

      excelData.forEach(row => {
        headers.forEach((header, colIndex) => {
          const cellValue = String(row[header as keyof typeof row] || '');
          maxWidths[colIndex] = Math.max(maxWidths[colIndex] || 0, cellValue.length);
        });
      });

      worksheet['!cols'] = headers.map((_, i) => ({
        wch: Math.min(maxWidths[i] + 2, 50) // Max width of 50 characters
      }));

      // Generate filename with date and filter info
      let filenamePart = 'All';
      if (filters.region) filenamePart = filters.region;
      else if (filters.store) {
        const store = allStores.find(s => s.id === filters.store);
        filenamePart = store?.name || filters.store;
      } else if (filters.am) {
        const am = AREA_MANAGERS.find(a => a.id === filters.am);
        filenamePart = am?.name || filters.am;
      } else if (filters.hrPerson) {
        const hr = HR_PERSONNEL.find(h => h.id === filters.hrPerson);
        filenamePart = hr?.name || filters.hrPerson;
      }

      const fileName = `HR_Connect_${filenamePart}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);

      hapticFeedback.ultraStrong();
      showNotificationMessage('Excel Downloaded', 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel report. Please try again.');
      hapticFeedback.error();
      showNotificationMessage('Error generating Excel', 'error');
    }
  };

  // Generate Excel report for SHLP Dashboard
  const generateSHLPExcelReport = () => {
    try {
      hapticFeedback.confirm();

      if (!filteredSHLPData || filteredSHLPData.length === 0) {
        alert('No SHLP certification data available to export');
        hapticFeedback.error();
        return;
      }

      // Prepare data in Google Sheet format
      const excelData = filteredSHLPData.map(submission => {
        const excelRow: any = {
          'Submission Time': submission['Submission Time'] || '',
          'Employee Name': submission['Employee Name'] || '',
          'Employee ID': submission['Employee ID'] || '',
          'Store': submission.Store || '',
          'Auditor Name': submission['Auditor Name'] || '',
          'Area Manager': submission['Area Manager'] || '',
          'Trainer': submission.Trainer || '',
        };

        // Add all question scores (SHLP_1 to SHLP_35)
        for (let i = 1; i <= 35; i++) {
          const questionKey = `SHLP_${i}`;
          excelRow[`Question ${i}`] = (submission as any)[questionKey] || '';
          excelRow[`Question ${i} Remarks`] = (submission as any)[`${questionKey}_remarks`] || '';
        }

        // Add section scores
        excelRow['Store Readiness Score'] = (submission as any).Store_Readiness_Score || '';
        excelRow['Product Quality Score'] = (submission as any).Product_Quality_Score || '';
        excelRow['Cash & Admin Score'] = (submission as any).Cash_Admin_Score || '';
        excelRow['Team Management Score'] = (submission as any).Team_Management_Score || '';
        excelRow['Operations Score'] = (submission as any).Operations_Score || '';
        excelRow['Safety Score'] = (submission as any).Safety_Score || '';
        excelRow['Shift Closing Score'] = (submission as any).Shift_Closing_Score || '';
        excelRow['Business Acumen Score'] = (submission as any).Business_Score || '';
        excelRow['Overall Score'] = (submission as any).Overall_Score || '';
        excelRow['Overall Percentage'] = submission.Overall_Percentage || '';

        return excelRow;
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'SHLP Certifications');

      // Auto-size columns
      const maxWidths: { [key: number]: number } = {};
      const headers = Object.keys(excelData[0] || {});

      headers.forEach((header, colIndex) => {
        maxWidths[colIndex] = header.length;
      });

      excelData.forEach(row => {
        headers.forEach((header, colIndex) => {
          const cellValue = String(row[header as keyof typeof row] || '');
          maxWidths[colIndex] = Math.max(maxWidths[colIndex] || 0, cellValue.length);
        });
      });

      worksheet['!cols'] = headers.map((_, i) => ({
        wch: Math.min(maxWidths[i] + 2, 50) // Max width of 50 characters
      }));

      // Generate filename with date and filter info
      let filenamePart = 'All';
      if (filters.employee && employeeDirectory?.byId) {
        const emp = employeeDirectory.byId[filters.employee];
        filenamePart = emp?.empname || filters.employee;
      } else if (filters.region) {
        filenamePart = filters.region;
      } else if (filters.store) {
        filenamePart = filters.store;
      } else if (filters.am) {
        filenamePart = filters.am;
      } else if (filters.trainer) {
        filenamePart = filters.trainer;
      }

      const fileName = `SHLP_Certifications_${filenamePart}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);

      hapticFeedback.ultraStrong();
      showNotificationMessage('Excel Downloaded', 'success');
    } catch (error) {
      console.error('Error generating SHLP Excel:', error);
      alert('Error generating Excel report. Please try again.');
      hapticFeedback.error();
      showNotificationMessage('Error generating Excel', 'error');
    }
  };

  // Generate Store Health Card Excel for Training Dashboard
  const generateStoreHealthCardExcel = () => {
    try {
      hapticFeedback.confirm();

      if (dashboardType !== 'training') {
        alert('Store Health Card is only available for Training Dashboard');
        hapticFeedback.error();
        return;
      }

      // Get the list of stores to include based on filters
      let storesToInclude = availableStores;

      // Apply filter logic to determine which stores to show
      if (filters.region) {
        storesToInclude = allStores.filter(s => s.region === filters.region);
      } else if (filters.store) {
        storesToInclude = allStores.filter(s => s.id === filters.store);
      } else if (filters.am) {
        storesToInclude = allStores.filter(s => s.amId === filters.am);
      }

      if (storesToInclude.length === 0) {
        alert('No stores available to export');
        hapticFeedback.error();
        return;
      }

      // Group audit data by store to get the latest audit per store
      const storeHealthMap = new Map<string, {
        storeName: string;
        storeId: string;
        amName: string;
        trainerName: string;
        lastAuditDate: Date;
        lastAuditMonth: string;
        auditPercentage: number;
        healthStatus: string;
      }>();

      // Process training audit data
      if (filteredTrainingData && filteredTrainingData.length > 0) {
        filteredTrainingData.forEach(submission => {
          const storeId = submission.storeId;
          const submissionDate = new Date(submission.submissionTime);
          const percentage = parseFloat(submission.percentageScore || '0');

          // Determine health status based on percentage
          let healthStatus = '';
          if (percentage < 56) {
            healthStatus = 'Needs Attention';
          } else if (percentage >= 56 && percentage < 81) {
            healthStatus = 'Brewing';
          } else {
            healthStatus = 'Perfect Shot';
          }

          // Get the month/year of the audit
          const auditMonth = submissionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

          // Check if this is the latest audit for this store
          const existing = storeHealthMap.get(storeId);
          if (!existing || submissionDate > existing.lastAuditDate) {
            storeHealthMap.set(storeId, {
              storeName: submission.storeName || '',
              storeId: storeId || '',
              amName: submission.amName || '',
              trainerName: submission.trainerName || '',
              lastAuditDate: submissionDate,
              lastAuditMonth: auditMonth,
              auditPercentage: percentage,
              healthStatus: healthStatus
            });
          }
        });
      }

      // Create Excel data including ALL stores
      const excelData = storesToInclude.map(store => {
        const auditData = storeHealthMap.get(store.id);

        if (auditData) {
          // Store has audit data
          return {
            'Store Name': auditData.storeName,
            'Store ID': auditData.storeId,
            'Area Manager': auditData.amName,
            'Trainer Name': auditData.trainerName,
            'Health Status': auditData.healthStatus,
            'Last Audit Month': auditData.lastAuditMonth,
            'Audit Percentage': `${auditData.auditPercentage.toFixed(1)}%`
          };
        } else {
          // Store has no audit data
          return {
            'Store Name': store.name,
            'Store ID': store.id,
            'Area Manager': store.amName || 'N/A',
            'Trainer Name': 'N/A',
            'Health Status': 'Not Audited',
            'Last Audit Month': 'N/A',
            'Audit Percentage': 'N/A'
          };
        }
      })
        .sort((a, b) => {
          // Sort by health status priority, then by store name
          const statusOrder = { 'Needs Attention': 0, 'Brewing': 1, 'Perfect Shot': 2, 'Not Audited': 3 };
          const statusDiff = statusOrder[a['Health Status'] as keyof typeof statusOrder] - statusOrder[b['Health Status'] as keyof typeof statusOrder];
          if (statusDiff !== 0) return statusDiff;
          return a['Store Name'].localeCompare(b['Store Name']);
        });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Store Health Card');

      // Style the worksheet - add conditional formatting colors
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const healthCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })]; // Column E (Health Status)
        if (healthCell && healthCell.v) {
          // Add cell styling based on health status
          if (!healthCell.s) healthCell.s = {};
          if (healthCell.v === 'Perfect Shot') {
            healthCell.s.fill = { fgColor: { rgb: 'C6EFCE' } }; // Light green
            healthCell.s.font = { color: { rgb: '006100' } };
          } else if (healthCell.v === 'Brewing') {
            healthCell.s.fill = { fgColor: { rgb: 'FFEB9C' } }; // Light yellow
            healthCell.s.font = { color: { rgb: '9C5700' } };
          } else if (healthCell.v === 'Needs Attention') {
            healthCell.s.fill = { fgColor: { rgb: 'FFC7CE' } }; // Light red
            healthCell.s.font = { color: { rgb: '9C0006' } };
          } else if (healthCell.v === 'Not Audited') {
            healthCell.s.fill = { fgColor: { rgb: 'D9D9D9' } }; // Light gray
            healthCell.s.font = { color: { rgb: '333333' } };
          }
        }
      }

      // Auto-size columns
      const headers = ['Store Name', 'Store ID', 'Area Manager', 'Trainer Name', 'Health Status', 'Last Audit Month', 'Audit Percentage'];
      worksheet['!cols'] = headers.map((header, i) => {
        let maxWidth = header.length;
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: i })];
          if (cell && cell.v) {
            const cellLength = String(cell.v).length;
            maxWidth = Math.max(maxWidth, cellLength);
          }
        }
        return { wch: Math.min(maxWidth + 2, 50) };
      });

      // Generate filename with date and filter info
      let filenamePart = 'All_Stores';
      if (filters.region) {
        filenamePart = filters.region;
      } else if (filters.store) {
        const store = allStores.find(s => s.id === filters.store);
        filenamePart = store?.name || filters.store;
      } else if (filters.am) {
        filenamePart = filters.am;
      } else if (filters.trainer) {
        filenamePart = filters.trainer;
      }

      const fileName = `Store_Health_Card_${filenamePart}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);

      hapticFeedback.ultraStrong();
      showNotificationMessage('Store Health Card Downloaded', 'success');
    } catch (error) {
      console.error('Error generating Store Health Card Excel:', error);
      alert('Error generating Store Health Card. Please try again.');
      hapticFeedback.error();
      showNotificationMessage('Error generating Excel', 'error');
    }
  };

  // For training dashboard, also wait for trendsData to load (needed for stats calculation)
  const isTrainingLoading = dashboardType === 'training' && !Boolean(filters.region || filters.store || filters.am || filters.trainer || filters.health) && trendsLoading;

  if (loading || isTrainingLoading) {
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
          Loading {dashboardType === 'training' ? 'training' : dashboardType === 'operations' ? 'operations' : dashboardType === 'qa' ? 'QA' : dashboardType === 'hr' ? 'HR' : dashboardType === 'shlp' ? 'SHLP' : dashboardType === 'campus-hiring' ? 'Campus Hiring' : ''} dashboard data...
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
      {/* Connect Targets Detail Modal */}
      {showConnectTargetsModal && stats && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowConnectTargetsModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {connectTargetsModalType === 'week' && 'Week Performance Details'}
                    {connectTargetsModalType === 'month' && 'Month Performance Details'}
                    {connectTargetsModalType === 'region' && 'Regional Performance'}
                    {connectTargetsModalType === 'store' && 'Store Performance'}
                    {connectTargetsModalType === 'am' && 'Area Manager Performance'}
                    {connectTargetsModalType === 'daily' && 'Daily Average Details'}
                  </h2>
                  <p className="text-blue-100 mt-1">Breakdown by HR, Region, AM, and Store</p>
                </div>
                <button
                  onClick={() => setShowConnectTargetsModal(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* By HRBP */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  By HRBP
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const byHR: { [key: string]: { name: string; connects: number; submissions: number; employees: Set<string> } } = {};
                    filteredSubmissions.forEach(s => {
                      if (!byHR[s.hrId]) {
                        byHR[s.hrId] = { name: s.hrName, connects: 0, submissions: 0, employees: new Set() };
                      }
                      byHR[s.hrId].employees.add(s.empId);
                      byHR[s.hrId].submissions++;
                    });
                    Object.keys(byHR).forEach(hrId => {
                      byHR[hrId].connects = byHR[hrId].employees.size;
                    });

                    return Object.entries(byHR)
                      .sort(([, a], [, b]) => b.connects - a.connects)
                      .map(([hrId, data]) => (
                        <div key={hrId} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">ID: {hrId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{data.connects}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{data.submissions} total connects</p>
                          </div>
                        </div>
                      ));
                  })()}
                </div>
              </div>

              {/* By Region */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  By Region
                </h3>
                <div className="space-y-2">
                  {stats && (stats as any).byRegion && Object.entries((stats as any).byRegion)
                    .sort(([, a]: any, [, b]: any) => b.connects - a.connects)
                    .map(([region, data]: [string, any]) => {
                      // Percentage = (Surveyed Employees / Total Employees in Region) * 100
                      const completion = data.totalEmployees > 0 ? Math.round((data.connects / data.totalEmployees) * 100) : 0;
                      return (
                        <div key={region} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900 dark:text-white">{region}</p>
                            <div className="text-right">
                              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{data.connects} / {data.totalEmployees}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{completion}% surveyed • {data.submissions} total connects</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* By Area Manager */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-600" />
                  By Area Manager
                </h3>
                <div className="space-y-2">
                  {stats && (stats as any).byAM && Object.entries((stats as any).byAM)
                    .sort(([, a]: any, [, b]: any) => b.connects - a.connects)
                    .map(([amId, data]: [string, any]) => {
                      // Percentage = (Surveyed Employees / Total Employees in AM Patch) * 100
                      const completion = data.totalEmployees > 0 ? Math.round((data.connects / data.totalEmployees) * 100) : 0;
                      return (
                        <div key={amId} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{data.amName}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">ID: {amId}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{data.connects} / {data.totalEmployees}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{completion}% surveyed • {data.submissions} total connects</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div
                              className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* By Store */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  By Store
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stats && (stats as any).byStore && Object.entries((stats as any).byStore)
                    .sort(([, a]: any, [, b]: any) => b.connects - a.connects)
                    .map(([storeId, data]: [string, any]) => {
                      // Percentage = (Surveyed Employees / Total Employees in Store) * 100
                      const completion = data.totalEmployees > 0 ? Math.round((data.connects / data.totalEmployees) * 100) : 0;
                      return (
                        <div key={storeId} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">{data.storeName}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{data.region}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{data.connects}/{data.totalEmployees}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{completion}% surveyed</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  case 'shlp': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
                  case 'campus-hiring': return <Brain className="w-4 h-4 sm:w-5 sm:h-5" />;
                  case 'trainer-calendar': return <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />;
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
                  case 'shlp': return dashboardType === 'shlp' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  case 'campus-hiring': return dashboardType === 'campus-hiring' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  case 'trainer-calendar': return dashboardType === 'trainer-calendar' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
                  case 'consolidated': return dashboardType === 'consolidated' ? 'bg-slate-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600';
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
            {dashboardType === 'shlp' && 'View Store-level Hourly Leadership Performance Certification Results'}
            {dashboardType === 'campus-hiring' && 'View Campus Hiring Psychometric Assessment Results'}
            {dashboardType === 'trainer-calendar' && 'View and manage trainer schedules and calendar events'}
            {dashboardType === 'consolidated' && 'View combined insights from all authorized checklist types'}
          </p>
        </div>
      )}

      {dashboardType !== 'campus-hiring' && dashboardType !== 'trainer-calendar' && (() => {
        return (
          <div>
            <DashboardFilters
              regions={availableRegions}
              stores={availableStores}
              areaManagers={availableAreaManagers}
              // Pass HR personnel for HR filter
              hrPersonnel={allHRPersonnel && allHRPersonnel.length > 0 ? allHRPersonnel : availableHRPersonnel}
              // Pass trainers for Trainer filter
              trainers={allTrainers && allTrainers.length > 0 ? allTrainers : undefined}
              // Pass employee directory for SHLP employee filter
              employeeDirectory={employeeDirectory}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              onDownload={generatePDFReport}
              onDownloadExcel={generateExcelReport}
              onDownloadSHLPExcel={generateSHLPExcelReport}
              onDownloadStoreHealthCard={generateStoreHealthCardExcel}
              isGenerating={isGenerating}
              dashboardType={dashboardType}
            />
          </div>
        );
      })()}

      {/* RCA & CAPA Analysis - Only for Operations Dashboard */}
      {dashboardType === 'operations' && (
        <RCACapaAnalysis
          submissions={filteredAMOperations}
          questions={OPERATIONS_QUESTIONS}
        />
      )}

      {/* Check if we have data for the selected dashboard type */}
      {dashboardType === 'trainer-calendar' ? (
        // Trainer Calendar Dashboard
        <TrainerCalendarDashboard />
      ) : dashboardType === 'campus-hiring' ? (
        // Campus Hiring Dashboard
        campusHiringData.length > 0 ? (
          <CampusHiringStats submissions={campusHiringData} />
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg text-center">
            <Brain className="w-16 h-16 mx-auto text-indigo-600 dark:text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">No Campus Hiring Data</h3>
            <p className="text-gray-600 dark:text-slate-400">No psychometric assessment submissions found. Candidates can submit assessments through the Campus Hiring form.</p>
          </div>
        )
      ) : (
        (dashboardType === 'hr' && filteredSubmissions.length > 0) ||
        (dashboardType === 'operations' && filteredAMOperations.length > 0) ||
        (dashboardType === 'training' && filteredTrainingData.length > 0) ||
        (dashboardType === 'qa' && filteredQAData.length > 0) ||
        (dashboardType === 'finance' && filteredFinanceData.length > 0) ||
        (dashboardType === 'shlp' && filteredSHLPData.length > 0) ||
        (dashboardType === 'consolidated' && (
          consolidatedHRData.length > 0 ||
          consolidatedOperationsData.length > 0 ||
          consolidatedTrainingData.length > 0 ||
          consolidatedQAData.length > 0 ||
          consolidatedFinanceData.length > 0 ||
          consolidatedSHLPData.length > 0
        ))
      ) ? (
        <>
          {/* Consolidated Dashboard - New 4Ps Framework */}
          {dashboardType === 'consolidated' ? (
            <ConsolidatedDashboard
              hrData={consolidatedHRData}
              operationsData={consolidatedOperationsData}
              trainingData={consolidatedTrainingData}
              qaData={consolidatedQAData}
              financeData={consolidatedFinanceData}
              shlpData={consolidatedSHLPData}
            />
          ) : (
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
                        latest: (stats as any)?.latestScore ?? (typeof stats?.avgScore === 'number' ? Math.round(stats.avgScore) : undefined),
                        previous: (stats as any)?.previousScore ?? null,
                        aggregate: (!(stats as any)?.latestScore && stats?.avgScore) ? Math.round(stats.avgScore) : undefined
                      }} onClick={() => setShowAuditScoreDetails(true)} />
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
                          onOpenHealthBreakdown={() => setShowHealthBreakdown(true)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`grid grid-cols-1 gap-5 ${dashboardType === 'qa' ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                  <StatCard
                    title="Total Submissions"
                    value={stats?.totalSubmissions}
                    onClick={dashboardType === 'hr' ? handleHRTotalSubmissionsClick : handleTotalSubmissionsClick}
                  />
                  <StatCard title="Average Score" value={String(getAverageScoreDisplay())} />
                  {dashboardType !== 'qa' && dashboardType !== 'finance' && (
                    <StatCard
                      title={
                        dashboardType === 'operations' ? "Trainers Involved" :
                          dashboardType === 'shlp' ? "Trainers Involved" :
                            "Employees Surveyed"
                      }
                      value={dashboardType === 'shlp' ? (stats as any)?.uniqueTrainers : (stats as any)?.uniqueEmployees}
                    />
                  )}
                  <StatCard
                    title="Stores Covered"
                    value={stats?.uniqueStores}
                    onClick={dashboardType === 'hr' ? handleHRStoresCoveredClick : handleStoresCoveredClick}
                  />
                </div>
              )}

              {/* Show HR Dashboard Content */}
              {dashboardType === 'hr' && (
                <>
                  {/* HR Connects Progress Card */}
                  {stats?.totalEmployees > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-lg p-6 border border-blue-200 dark:border-slate-600">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">HR Connects Progress</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">Target: 12 connects per employee annually</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
                          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Total Employees</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees.toLocaleString()}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
                          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Actual Connects</p>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.actualConnects.toLocaleString()}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
                          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Target Connects</p>
                          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.idealConnects.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Progress</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {Math.round((stats.actualConnects / stats.idealConnects) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (stats.actualConnects / stats.idealConnects) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connect Targets Section */}
                  {stats && (stats as any).weekTarget > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Connect Targets</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                              3 connects per HRBP per day • {(stats as any).numHRBPs} active HRBP{(stats as any).numHRBPs !== 1 ? 's' : ''}
                              {filters.month && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                                  {(() => {
                                    const [year, month] = filters.month.split('-');
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                                  })()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={filters.region}
                            onChange={(e) => handleFilterChange('region', e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Regions</option>
                            {REGIONS.map(region => (
                              <option key={region} value={region}>{region}</option>
                            ))}
                          </select>

                          <select
                            value={filters.am}
                            onChange={(e) => handleFilterChange('am', e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All AMs</option>
                            {AREA_MANAGERS.map(am => (
                              <option key={am.id} value={am.id}>{am.name}</option>
                            ))}
                          </select>

                          <select
                            value={filters.store}
                            onChange={(e) => handleFilterChange('store', e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Stores</option>
                            {allStores.map(store => (
                              <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                          </select>

                          <select
                            value={filters.month}
                            onChange={(e) => handleFilterChange('month', e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Time</option>
                            <option value="2024-12">Dec 2024</option>
                            <option value="2025-01">Jan 2025</option>
                            <option value="2025-02">Feb 2025</option>
                            <option value="2025-03">Mar 2025</option>
                            <option value="2025-04">Apr 2025</option>
                            <option value="2025-05">May 2025</option>
                            <option value="2025-06">Jun 2025</option>
                            <option value="2025-07">Jul 2025</option>
                            <option value="2025-08">Aug 2025</option>
                            <option value="2025-09">Sep 2025</option>
                            <option value="2025-10">Oct 2025</option>
                            <option value="2025-11">Nov 2025</option>
                            <option value="2025-12">Dec 2025</option>
                          </select>
                        </div>
                      </div>

                      {/* Stat Cards Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Week Progress */}
                        <div
                          onClick={() => { setConnectTargetsModalType('week'); setShowConnectTargetsModal(true); }}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-green-200 dark:border-slate-500 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">This Week</p>
                          </div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {(stats as any).weekConnects}
                            </p>
                            <span className="text-sm text-gray-500 dark:text-slate-400">/</span>
                            <p className="text-xl font-bold text-gray-600 dark:text-slate-400">
                              {(stats as any).weekTarget}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-slate-400">6 working days</span>
                            <span className={`font-bold ${(stats as any).weekProgress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {(stats as any).weekProgress}%
                            </span>
                          </div>
                        </div>

                        {/* Month Progress */}
                        <div
                          onClick={() => { setConnectTargetsModalType('month'); setShowConnectTargetsModal(true); }}
                          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-purple-200 dark:border-slate-500 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">This Month</p>
                          </div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {(stats as any).monthConnects}
                            </p>
                            <span className="text-sm text-gray-500 dark:text-slate-400">/</span>
                            <p className="text-xl font-bold text-gray-600 dark:text-slate-400">
                              {(stats as any).monthTarget}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-slate-400">{(stats as any).workingDaysElapsedInMonth} days elapsed</span>
                            <span className={`font-bold ${(stats as any).monthProgress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {(stats as any).monthProgress}%
                            </span>
                          </div>
                        </div>

                        {/* Regional Stats */}
                        <div
                          onClick={() => { setConnectTargetsModalType('region'); setShowConnectTargetsModal(true); }}
                          className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-orange-200 dark:border-slate-500 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">By Region</p>
                          </div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {(stats as any).byRegion ? Object.values((stats as any).byRegion).reduce((sum: number, r: any) => sum + r.connects, 0) : 0}
                            </p>
                            <span className="text-sm text-gray-500 dark:text-slate-400">/</span>
                            <p className="text-xl font-bold text-gray-600 dark:text-slate-400">
                              {(stats as any).byRegion ? Object.values((stats as any).byRegion).reduce((sum: number, r: any) => sum + r.totalEmployees, 0) : 0}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {(stats as any).byRegion ? Object.keys((stats as any).byRegion).length : 0} regions • {(stats as any).byRegion ? Math.round((Object.values((stats as any).byRegion).reduce((sum: number, r: any) => sum + r.connects, 0) / Math.max(1, Object.values((stats as any).byRegion).reduce((sum: number, r: any) => sum + r.totalEmployees, 0))) * 100) : 0}%
                          </p>
                        </div>

                        {/* Store Stats */}
                        <div
                          onClick={() => { setConnectTargetsModalType('store'); setShowConnectTargetsModal(true); }}
                          className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-cyan-200 dark:border-slate-500 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">By Store</p>
                          </div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {(stats as any).byStore ? Object.values((stats as any).byStore).reduce((sum: number, s: any) => sum + s.connects, 0) : 0}
                            </p>
                            <span className="text-sm text-gray-500 dark:text-slate-400">/</span>
                            <p className="text-xl font-bold text-gray-600 dark:text-slate-400">
                              {(stats as any).byStore ? Object.values((stats as any).byStore).reduce((sum: number, s: any) => sum + s.totalEmployees, 0) : 0}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {(stats as any).byStore ? Object.keys((stats as any).byStore).length : 0} stores • {(stats as any).byStore ? Math.round((Object.values((stats as any).byStore).reduce((sum: number, s: any) => sum + s.connects, 0) / Math.max(1, Object.values((stats as any).byStore).reduce((sum: number, s: any) => sum + s.totalEmployees, 0))) * 100) : 0}%
                          </p>
                        </div>

                        {/* AM Stats */}
                        <div
                          onClick={() => { setConnectTargetsModalType('am'); setShowConnectTargetsModal(true); }}
                          className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-pink-200 dark:border-slate-500 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">By AM</p>
                          </div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {(stats as any).byAM ? Object.values((stats as any).byAM).reduce((sum: number, a: any) => sum + a.connects, 0) : 0}
                            </p>
                            <span className="text-sm text-gray-500 dark:text-slate-400">/</span>
                            <p className="text-xl font-bold text-gray-600 dark:text-slate-400">
                              {(stats as any).byAM ? Object.values((stats as any).byAM).reduce((sum: number, a: any) => sum + a.totalEmployees, 0) : 0}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {(stats as any).byAM ? Object.keys((stats as any).byAM).length : 0} AMs • {(stats as any).byAM ? Math.round((Object.values((stats as any).byAM).reduce((sum: number, a: any) => sum + a.connects, 0) / Math.max(1, Object.values((stats as any).byAM).reduce((sum: number, a: any) => sum + a.totalEmployees, 0))) * 100) : 0}%
                          </p>
                        </div>

                        {/* Daily Average */}
                        <div
                          onClick={() => { setConnectTargetsModalType('daily'); setShowConnectTargetsModal(true); }}
                          className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-indigo-200 dark:border-slate-500 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">Daily Avg</p>
                          </div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {(stats as any).workingDaysElapsedInMonth > 0 ? Math.round((stats as any).monthConnects / (stats as any).workingDaysElapsedInMonth) : 0}
                            </p>
                            <span className="text-sm text-gray-500 dark:text-slate-400">/</span>
                            <p className="text-xl font-bold text-gray-600 dark:text-slate-400">
                              {(stats as any).numHRBPs * 3}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            per working day
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HRBP Leaderboard - Combined with toggle */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">HRBP Leaderboard</h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            9 HRBPs
                            {filters.month && (
                              <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-medium">
                                {(() => {
                                  const [year, month] = filters.month.split('-');
                                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  return `${monthNames[parseInt(month) - 1]} ${year}`;
                                })()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Buttons */}
                      <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                        <button
                          onClick={() => setLeaderboardView('count')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${leaderboardView === 'count'
                              ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                              : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="hidden sm:inline">Employees</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setLeaderboardView('score')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${leaderboardView === 'score'
                              ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                              : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">Avg Score</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Leaderboard Content */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(() => {
                        if (leaderboardView === 'count') {
                          // By Employees Surveyed
                          // Initialize with all HRBPs from HR_PERSONNEL (excluding leadership)
                          const hrStats: { [key: string]: { name: string; count: number } } = {};

                          // Filter out leadership roles (LMS Head, Training Head, Sarit)
                          const excludedIds = ['H541', 'H3237', 'H2081']; // LMS Head, Training Head, Sarit
                          const activeHRBPs = HR_PERSONNEL.filter(hr => !excludedIds.includes(hr.id));

                          // First, add all active HRBPs with 0 count
                          activeHRBPs.forEach(hr => {
                            hrStats[hr.id] = { name: hr.name, count: 0 };
                          });

                          // Then update counts from actual submissions
                          filteredSubmissions.forEach(sub => {
                            const hrId = sub.hrId || 'Unknown';
                            const hrName = sub.hrName || 'Unknown';
                            if (hrStats[hrId]) {
                              hrStats[hrId].count++;
                            } else if (!excludedIds.includes(hrId)) {
                              // Handle cases where HR is in submissions but not in HR_PERSONNEL (and not excluded)
                              hrStats[hrId] = { name: hrName, count: 1 };
                            }
                          });

                          const sortedHRs = Object.entries(hrStats)
                            .sort(([, a], [, b]) => b.count - a.count);

                          const maxCount = sortedHRs[0]?.[1].count || 1;

                          return sortedHRs.map(([hrId, data], index) => (
                            <div
                              key={hrId}
                              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
                              onClick={() => {
                                setSelectedHRBP({ id: hrId, name: data.name });
                                setShowHRBPCalendar(true);
                              }}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                  index === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                                    index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                      'bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400'
                                }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{data.name}</span>
                                  <span className="text-sm font-bold text-gray-900 dark:text-white ml-2">{data.count} employees</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                            'bg-gradient-to-r from-indigo-400 to-purple-500'
                                      }`}
                                    style={{ width: `${(data.count / maxCount) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ));
                        } else {
                          // By Average Score
                          // Initialize with all HRBPs from HR_PERSONNEL (excluding leadership)
                          const hrStats: { [key: string]: { name: string; total: number; count: number } } = {};

                          // Filter out leadership roles (LMS Head, Training Head, Sarit)
                          const excludedIds = ['H541', 'H3237', 'H2081']; // LMS Head, Training Head, Sarit
                          const activeHRBPs = HR_PERSONNEL.filter(hr => !excludedIds.includes(hr.id));

                          // First, add all active HRBPs with 0 count
                          activeHRBPs.forEach(hr => {
                            hrStats[hr.id] = { name: hr.name, total: 0, count: 0 };
                          });

                          // Then update counts and totals from actual submissions
                          filteredSubmissions.forEach(sub => {
                            const hrId = sub.hrId || 'Unknown';
                            const hrName = sub.hrName || 'Unknown';
                            if (hrStats[hrId]) {
                              hrStats[hrId].total += sub.percent || 0;
                              hrStats[hrId].count++;
                            } else if (!excludedIds.includes(hrId)) {
                              // Handle cases where HR is in submissions but not in HR_PERSONNEL (and not excluded)
                              hrStats[hrId] = { name: hrName, total: sub.percent || 0, count: 1 };
                            }
                          });

                          const sortedHRs = Object.entries(hrStats)
                            .map(([hrId, data]) => ({
                              hrId,
                              name: data.name,
                              avgScore: data.count > 0 ? Math.round(data.total / data.count) : 0,
                              count: data.count
                            }))
                            .sort((a, b) => {
                              // Sort by avgScore descending, but put 0% (no submissions) at the end
                              if (a.avgScore === 0 && b.avgScore === 0) return 0;
                              if (a.avgScore === 0) return 1;
                              if (b.avgScore === 0) return -1;
                              return b.avgScore - a.avgScore;
                            });

                          return sortedHRs.map((hr, index) => (
                            <div
                              key={hr.hrId}
                              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
                              onClick={() => {
                                setSelectedHRBP({ id: hr.hrId, name: hr.name });
                                setShowHRBPCalendar(true);
                              }}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                  index === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                                    index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                      'bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400'
                                }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{hr.name}</span>
                                  <span className={`text-sm font-bold ml-2 ${hr.avgScore >= 80 ? 'text-green-600 dark:text-green-400' :
                                      hr.avgScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                        'text-red-600 dark:text-red-400'
                                    }`}>
                                    {hr.avgScore}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${hr.avgScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                        hr.avgScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                          'bg-gradient-to-r from-red-400 to-red-500'
                                      }`}
                                    style={{ width: `${hr.avgScore}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ));
                        }
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <RegionPerformanceInfographic
                      submissions={filteredSubmissions}
                      stores={allStores}
                      onRegionClick={handleHRRegionClick}
                    />
                    <AMPerformanceInfographic
                      submissions={filteredSubmissions}
                      onAMClick={handleHRAMClick}
                    />
                    <HRPerformanceInfographic
                      submissions={filteredSubmissions}
                      onHRClick={handleHRPersonClick}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ScoreDistributionChart submissions={filteredSubmissions} />
                    <AverageScoreByManagerChart submissions={filteredSubmissions} />
                  </div>

                  <QuestionScoresInfographic submissions={filteredSubmissions} questions={QUESTIONS} />

                  <div className="grid grid-cols-1 gap-6">
                    <AMRadarChart submissions={filteredSubmissions} />
                  </div>

                  {/* Area Manager Scorecards Section with Filters */}
                  <AMScorecardSection
                    areaManagers={availableAreaManagers}
                    submissions={filteredSubmissions}
                  />
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
                          onClick: undefined, // Remove card-level click to avoid conflicts with pie chart
                          onLabelClick: () => setShowHealthBreakdown(true), // Label click opens health breakdown
                          value: (() => {
                            // ============================================================
                            // CLICKABLE AREAS STRUCTURE:
                            // ============================================================
                            // LEFT SIDE (Label):    "STORE HEALTH" text → Opens Health Breakdown Modal
                            // RIGHT SIDE (Content): Pie chart + numbers → Filter by category (Needs Attention/Brewing/Perfect Shot)
                            //
                            // Event propagation is stopped on the right side container to prevent
                            // pie chart clicks from triggering the card tap handler
                            // ============================================================

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
                              <div
                                className="flex items-center justify-center gap-3 w-full ml-10"
                                onClick={(e) => {
                                  // Prevent pie chart area clicks from bubbling up to card tap
                                  e.stopPropagation();
                                }}
                                onPointerDown={(e) => {
                                  // Also stop pointer events to prevent drag/tap detection
                                  e.stopPropagation();
                                }}
                              >
                                {/* Compact Pie Chart using SVG */}
                                <svg
                                  width="70"
                                  height="70"
                                  viewBox="0 0 70 70"
                                  className="flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                >
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (segment.name === 'Needs Attention') {
                                              setTrainingDetailFilter({ type: 'scoreRange', value: '0-55', title: 'Needs Attention' });
                                            } else if (segment.name === 'Brewing') {
                                              setTrainingDetailFilter({ type: 'scoreRange', value: '56-80', title: 'Brewing' });
                                            } else if (segment.name === 'Perfect Shot') {
                                              setTrainingDetailFilter({ type: 'scoreRange', value: '81-100', title: 'Perfect Shot' });
                                            }
                                            setShowTrainingDetail(true);
                                          }}
                                          onPointerDown={(e) => e.stopPropagation()}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (entry.name === 'Needs Attention') {
                                          setTrainingDetailFilter({ type: 'scoreRange', value: '0-55', title: 'Needs Attention' });
                                        } else if (entry.name === 'Brewing') {
                                          setTrainingDetailFilter({ type: 'scoreRange', value: '56-80', title: 'Brewing' });
                                        } else if (entry.name === 'Perfect Shot') {
                                          setTrainingDetailFilter({ type: 'scoreRange', value: '81-100', title: 'Perfect Shot' });
                                        }
                                        setShowTrainingDetail(true);
                                      }}
                                      onPointerDown={(e) => e.stopPropagation()}
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
                          onClick: () => setShowAuditScoreDetails(true),
                          value: (
                            <div className="flex items-center gap-3">
                              <span className={`text-4xl font-black ${((stats as any).latestScore ?? (typeof stats.avgScore === 'number' ? Math.round(stats.avgScore) : 0)) < 55
                                  ? 'text-red-600'
                                  : ((stats as any).latestScore ?? (typeof stats.avgScore === 'number' ? Math.round(stats.avgScore) : 0)) >= 55 && ((stats as any).latestScore ?? (typeof stats.avgScore === 'number' ? Math.round(stats.avgScore) : 0)) < 81
                                    ? 'text-amber-500'
                                    : 'text-emerald-500'
                                }`}>
                                {(stats as any).latestScore ?? (typeof stats.avgScore === 'number' ? Math.round(stats.avgScore) : 0)}%
                              </span>
                              {(stats as any).previousScore !== null && (stats as any).previousScore !== undefined && (stats as any).latestScore !== null && (stats as any).latestScore !== undefined && (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${((stats as any).latestScore - (stats as any).previousScore) >= 0
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                      : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                                    }`}>
                                    <span className="text-xs font-bold">
                                      {((stats as any).latestScore - (stats as any).previousScore) >= 0 ? '↗' : '↘'}
                                    </span>
                                    <span className="text-xs font-bold">
                                      {Math.abs(Math.round((stats as any).latestScore - (stats as any).previousScore))}%
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
                    <div>
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

                  {/* Audit Coverage & History Section */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audit Coverage & Compliance</h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400">Track audit schedules, compliance, and monthly history</p>
                        </div>
                      </div>

                      {/* View Toggle */}
                      <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                        <button
                          onClick={() => setAuditCoverageView('current')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${auditCoverageView === 'current'
                              ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                              : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Current Status</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setAuditCoverageView('history')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${auditCoverageView === 'history'
                              ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                              : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Monthly History</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Current Status View */}
                    {auditCoverageView === 'current' && (
                      <>
                        {/* Filters */}
                        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {/* Status Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Status
                            </label>
                            <select
                              value={auditCoverageFilters.status}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, status: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All Status</option>
                              <option value="never-audited">No audit done</option>
                              <option value="overdue">Overdue</option>
                              <option value="due-soon">Due Soon</option>
                              <option value="on-track">On Track</option>
                            </select>
                          </div>

                          {/* Health Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Health
                            </label>
                            <select
                              value={auditCoverageFilters.health}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, health: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All Health</option>
                              <option value="never-audited">No audit done</option>
                              <option value="needs-attention">Needs Attention</option>
                              <option value="brewing">Brewing</option>
                              <option value="perfect-shot">Perfect Shot</option>
                            </select>
                          </div>

                          {/* Region Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Region
                            </label>
                            <select
                              value={auditCoverageFilters.region}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, region: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All Regions</option>
                              {Array.from(new Set(compStoreMapping.map((s: any) => s['Region'] || s.region).filter(Boolean))).sort().map(region => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </select>
                          </div>

                          {/* AM Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Area Manager
                            </label>
                            <select
                              value={auditCoverageFilters.am}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, am: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All AMs</option>
                              {Array.from(new Set(compStoreMapping.map((s: any) => s['AM Name']).filter(Boolean))).sort().map(am => (
                                <option key={am} value={am}>{am}</option>
                              ))}
                            </select>
                          </div>

                          {/* Trainer Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Trainer
                            </label>
                            <select
                              value={auditCoverageFilters.trainer}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, trainer: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All Trainers</option>
                              {allTrainers.map(trainer => (
                                <option key={trainer.id} value={trainer.name}>{trainer.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-slate-700/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Store
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Region
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Area Manager
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Trainer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Health Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Last Audit
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Next Due
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Days Remaining
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                              {(() => {
                                // Calculate audit coverage for ALL stores from comprehensive store mapping
                                const storeAudits = new Map();
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                // First, initialize ALL stores from comprehensive mapping (whether audited or not)
                                compStoreMapping.forEach((storeData: any) => {
                                  const storeId = storeData['Store ID'];
                                  if (!storeId) return;

                                  // Use AM Name and Trainer 1 Name directly from Google Sheets store mapping
                                  const amName = storeData['AM Name'] || storeData.amName || 'Unknown';
                                  const trainerName = storeData['Trainer 1 Name'] || storeData['Trainer Name'] || storeData.trainerName || 'Unknown';

                                  storeAudits.set(storeId, {
                                    storeId,
                                    storeName: storeData['Store Name'] || storeId,
                                    region: storeData['Region'] || 'Unknown',
                                    amName: amName,
                                    trainerName: trainerName,
                                    lastAuditDate: null,
                                    healthStatus: 'No audit done',
                                    auditInterval: 30, // Default interval
                                    percentage: 0,
                                    hasAudit: false
                                  });
                                });

                                // Now, update stores that have actual audit data (ONLY update audit fields, keep mapping data)
                                filteredTrainingData.forEach(submission => {
                                  const storeId = submission.storeId;
                                  if (!storeId) return;

                                  // Parse submission date using proper date parsing
                                  let submissionDate: Date;
                                  const submissionDateStr = submission.submissionTime || submission.timestamp;

                                  if (!submissionDateStr) {
                                    // No date provided - skip this submission for audit coverage
                                    return;
                                  }

                                  // Try to parse the date - handle both ISO format and DD/MM/YYYY format
                                  if (submissionDateStr.includes('T')) {
                                    // ISO format
                                    submissionDate = new Date(submissionDateStr);
                                  } else {
                                    // Google Sheets format: DD/MM/YYYY HH:MM:SS or DD/MM/YYYY
                                    const dateStr = String(submissionDateStr).trim().replace(',', '');
                                    const parts = dateStr.split(' ');

                                    if (parts.length > 0 && parts[0].includes('/')) {
                                      const dateParts = parts[0].split('/');
                                      if (dateParts.length === 3) {
                                        const day = parseInt(dateParts[0], 10);
                                        const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed
                                        const year = parseInt(dateParts[2], 10);

                                        // Parse time if available
                                        let hour = 0, minute = 0, second = 0;
                                        if (parts.length > 1 && parts[1]) {
                                          const timeParts = parts[1].split(':');
                                          hour = parseInt(timeParts[0] || '0', 10);
                                          minute = parseInt(timeParts[1] || '0', 10);
                                          second = parseInt(timeParts[2] || '0', 10);
                                        }

                                        submissionDate = new Date(year, month, day, hour, minute, second);
                                      } else {
                                        // Invalid date format - skip
                                        return;
                                      }
                                    } else {
                                      // Try standard Date parsing as fallback
                                      submissionDate = new Date(submissionDateStr);
                                    }
                                  }

                                  // Validate the parsed date
                                  if (isNaN(submissionDate.getTime())) {
                                    // Invalid date - skip this submission
                                    return;
                                  }

                                  const percentage = parseFloat(submission.percentageScore || '0');

                                  // Determine health status
                                  let healthStatus = 'Needs Attention';
                                  let auditInterval = 30; // days
                                  if (percentage >= 81) {
                                    healthStatus = 'Perfect Shot';
                                    auditInterval = 60;
                                  } else if (percentage >= 56) {
                                    healthStatus = 'Brewing';
                                    auditInterval = 45;
                                  }

                                  const existingStore = storeAudits.get(storeId);

                                  // If store doesn't exist in mapping, look it up and create entry
                                  if (!existingStore) {
                                    const mappingStore = compStoreMapping.find((s: any) => s['Store ID'] === storeId);
                                    if (mappingStore) {
                                      const amName = mappingStore['AM Name'] || 'Unknown';
                                      const trainerName = mappingStore['Trainer 1 Name'] || 'Unknown';

                                      storeAudits.set(storeId, {
                                        storeId,
                                        storeName: mappingStore['Store Name'] || storeId,
                                        region: mappingStore['Region'] || 'Unknown',
                                        amName: amName,
                                        trainerName: trainerName,
                                        lastAuditDate: submissionDate,
                                        healthStatus,
                                        auditInterval,
                                        percentage,
                                        hasAudit: true
                                      });
                                    } else {
                                      // Store not in mapping - create with unknown values
                                      storeAudits.set(storeId, {
                                        storeId,
                                        storeName: storeId,
                                        region: 'Unknown',
                                        amName: 'Unknown',
                                        trainerName: 'Unknown',
                                        lastAuditDate: submissionDate,
                                        healthStatus,
                                        auditInterval,
                                        percentage,
                                        hasAudit: true
                                      });
                                    }
                                  }
                                  // Update if this is the first audit OR if this submission is newer
                                  // IMPORTANT: Keep store name, region, AM, trainer from mapping (existingStore)
                                  else if (!existingStore.lastAuditDate || submissionDate > existingStore.lastAuditDate) {
                                    storeAudits.set(storeId, {
                                      ...existingStore, // Keep all mapping data (store name, region, AM, trainer)
                                      // Only update audit-related fields
                                      lastAuditDate: submissionDate,
                                      healthStatus,
                                      auditInterval,
                                      percentage,
                                      hasAudit: true
                                    });
                                  }
                                });

                                console.log('  - Stores with audits:', storeAudits.size);

                                // Calculate due dates and status for ALL stores
                                let auditCoverage = Array.from(storeAudits.values()).map(store => {
                                  let nextDue: Date | null = null;
                                  let daysRemaining: number = 0;
                                  let status: string;
                                  let statusColor: string;

                                  // Check if store has audit data
                                  if (!store.hasAudit || !store.lastAuditDate) {
                                    // Store has no audit done
                                    status = 'No audit done';
                                    statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
                                    daysRemaining = -999; // Large negative number for sorting
                                  } else {
                                    // Store has audit data - calculate next due date
                                    const lastAudit = store.lastAuditDate;
                                    nextDue = new Date(lastAudit);
                                    nextDue.setDate(nextDue.getDate() + store.auditInterval);

                                    const diffTime = nextDue.getTime() - today.getTime();
                                    daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                                    status = 'On Track';
                                    statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';

                                    if (daysRemaining < 0) {
                                      status = 'Overdue';
                                      statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                                    } else if (daysRemaining <= 7) {
                                      status = 'Due Soon';
                                      statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                                    }
                                  }

                                  return {
                                    ...store,
                                    nextDue,
                                    daysRemaining,
                                    status,
                                    statusColor
                                  };
                                });

                                // Apply filters
                                if (auditCoverageFilters.status !== 'all') {
                                  auditCoverage = auditCoverage.filter(audit => {
                                    if (auditCoverageFilters.status === 'never-audited') return audit.status === 'No audit done';
                                    if (auditCoverageFilters.status === 'overdue') return audit.status === 'Overdue';
                                    if (auditCoverageFilters.status === 'due-soon') return audit.status === 'Due Soon';
                                    if (auditCoverageFilters.status === 'on-track') return audit.status === 'On Track';
                                    return true;
                                  });
                                }

                                if (auditCoverageFilters.health !== 'all') {
                                  auditCoverage = auditCoverage.filter(audit => {
                                    if (auditCoverageFilters.health === 'never-audited') return audit.healthStatus === 'No audit done';
                                    if (auditCoverageFilters.health === 'needs-attention') return audit.healthStatus === 'Needs Attention';
                                    if (auditCoverageFilters.health === 'brewing') return audit.healthStatus === 'Brewing';
                                    if (auditCoverageFilters.health === 'perfect-shot') return audit.healthStatus === 'Perfect Shot';
                                    return true;
                                  });
                                }

                                if (auditCoverageFilters.region !== 'all') {
                                  auditCoverage = auditCoverage.filter(audit => audit.region === auditCoverageFilters.region);
                                }

                                if (auditCoverageFilters.am !== 'all') {
                                  auditCoverage = auditCoverage.filter(audit => audit.amName === auditCoverageFilters.am);
                                }

                                if (auditCoverageFilters.trainer !== 'all') {
                                  auditCoverage = auditCoverage.filter(audit => audit.trainerName === auditCoverageFilters.trainer);
                                }

                                // Sort by last audit date (latest first, then no audits at the end)
                                auditCoverage.sort((a, b) => {
                                  // No audit done always goes to the end
                                  if (a.status === 'No audit done' && b.status !== 'No audit done') return 1;
                                  if (a.status !== 'No audit done' && b.status === 'No audit done') return -1;

                                  // Both have audits - sort by most recent first
                                  if (a.lastAuditDate && b.lastAuditDate) {
                                    return b.lastAuditDate.getTime() - a.lastAuditDate.getTime();
                                  }

                                  return 0;
                                });

                                if (auditCoverage.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                                        No audit data available for selected filters
                                      </td>
                                    </tr>
                                  );
                                }

                                return auditCoverage.map((audit, index) => (
                                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-3 text-sm">
                                      <div className="font-medium text-gray-900 dark:text-white">{audit.storeName}</div>
                                      <div className="text-xs text-gray-500 dark:text-slate-400">{audit.storeId}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                      {audit.region}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                      {audit.amName}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                      {audit.trainerName}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${audit.healthStatus === 'Perfect Shot'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                          : audit.healthStatus === 'Brewing'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                            : audit.healthStatus === 'No audit done'
                                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {audit.healthStatus === 'No audit done' ? 'No audit done' : `${audit.healthStatus} (${audit.percentage}%)`}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                      {audit.lastAuditDate ? audit.lastAuditDate.toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      }) : (
                                        <span className="text-gray-400 dark:text-slate-500 italic">Never</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                      {audit.status === 'No audit done' ? (
                                        <span className="text-red-600 dark:text-red-400 font-semibold">Immediate</span>
                                      ) : (
                                        audit.nextDue.toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${audit.statusColor}`}>
                                        {audit.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`font-semibold ${audit.status === 'No audit done' || audit.daysRemaining < 0
                                          ? 'text-red-600 dark:text-red-400'
                                          : audit.daysRemaining <= 7
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-green-600 dark:text-green-400'
                                        }`}>
                                        {audit.status === 'No audit done'
                                          ? 'Not Started'
                                          : audit.daysRemaining < 0
                                            ? `${Math.abs(audit.daysRemaining)} days overdue`
                                            : `${audit.daysRemaining} days`
                                        }
                                      </span>
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* Monthly History View */}
                    {auditCoverageView === 'history' && (
                      <>
                        {/* Filters for Monthly History */}
                        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {/* Health Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Health Status
                            </label>
                            <select
                              value={auditCoverageFilters.health}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, health: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All Health</option>
                              <option value="Perfect Shot">Perfect Shot</option>
                              <option value="Brewing">Brewing</option>
                              <option value="Needs Attention">Needs Attention</option>
                            </select>
                          </div>

                          {/* Region Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Region
                            </label>
                            <select
                              value={auditCoverageFilters.region}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, region: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All Regions</option>
                              {Array.from(new Set(filteredTrainingData.map(s => s.region).filter(Boolean))).sort().map(region => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </select>
                          </div>

                          {/* Area Manager Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Area Manager
                            </label>
                            <select
                              value={auditCoverageFilters.am}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, am: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All Area Managers</option>
                              {Array.from(new Set(filteredTrainingData.map(s => s.areaManager).filter(Boolean))).sort().map(am => (
                                <option key={am} value={am}>{am}</option>
                              ))}
                            </select>
                          </div>

                          {/* Trainer Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                              Trainer
                            </label>
                            <select
                              value={auditCoverageFilters.trainer}
                              onChange={(e) => setAuditCoverageFilters({ ...auditCoverageFilters, trainer: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="all">All Trainers</option>
                              {Array.from(new Set(filteredTrainingData.map(s => s.trainerName).filter(Boolean))).sort().map(trainer => (
                                <option key={trainer} value={trainer}>{trainer}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-slate-700/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-slate-700/50">
                                  Store
                                </th>
                                {(() => {
                                  // Generate months from July 2025 to current month
                                  const months: Date[] = [];
                                  const today = new Date();
                                  const startDate = new Date(2025, 6, 1); // July 2025 (month is 0-indexed)

                                  const current = new Date(startDate);
                                  const end = new Date(today.getFullYear(), today.getMonth(), 1);

                                  while (current <= end) {
                                    months.push(new Date(current));
                                    current.setMonth(current.getMonth() + 1);
                                  }

                                  return months.map(month => (
                                    <th key={month.toISOString()} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                      {month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                    </th>
                                  ));
                                })()}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                              {(() => {
                                // Combine data from trendsData (monthly trends sheet) and current training data
                                const storeMonthlyAudits = new Map();
                                const storeMetadata = new Map(); // Store AM, Trainer info per store
                                const today = new Date();

                                // First pass: Initialize ALL stores from hrMappingData (comprehensive mapping)
                                if (hrMappingData && hrMappingData.length > 0) {
                                  hrMappingData.forEach((item: any) => {
                                    const storeId = item['Store ID'] || item.storeId;
                                    const storeName = item['Store Name'] || item.locationName;
                                    const region = item.Region || item.region;
                                    const amId = item.AM || item.areaManagerId;
                                    const amName = allAreaManagers?.find(am => am.code === amId)?.name || amId || 'Unknown';
                                    const trainerId = item['Trainer ID'] || item.trainerId;
                                    const trainerName = item.Trainer || item.trainer || trainerId || 'Unknown';

                                    if (storeId) {
                                      storeMetadata.set(storeId, {
                                        storeName: storeName || storeId,
                                        region: region || 'Unknown',
                                        areaManager: amName,
                                        trainer: trainerName
                                      });

                                      // Initialize store in monthly audits map
                                      if (!storeMonthlyAudits.has(storeId)) {
                                        storeMonthlyAudits.set(storeId, {
                                          storeId,
                                          storeName: storeName || storeId,
                                          region: region || 'Unknown',
                                          areaManager: amName,
                                          trainer: trainerName,
                                          monthlyData: new Map()
                                        });
                                      }
                                    }
                                  });
                                }

                                // Second pass: Collect store metadata from current training data (update if needed)
                                filteredTrainingData.forEach(submission => {
                                  const storeId = submission.storeId;
                                  if (!storeId) return;

                                  if (!storeMetadata.has(storeId)) {
                                    storeMetadata.set(storeId, {
                                      storeName: submission.storeName || storeId,
                                      region: submission.region || 'Unknown',
                                      areaManager: submission.areaManager || 'Unknown',
                                      trainer: submission.trainerName || 'Unknown'
                                    });
                                  }
                                });

                                // Process trendsData (historical monthly trends from Google Sheets)
                                if (trendsData && trendsData.length > 0) {
                                  trendsData.forEach((row: any) => {
                                    const storeId = row.store_id;
                                    const storeName = row.store_name;
                                    const periodStr = row.observed_period; // Format: "2024-07", "2024-08", etc.
                                    const percentage = parseFloat(row.training_score || row.percentage_score || '0');

                                    if (!storeId || !periodStr) return;

                                    // Parse period to get month/year
                                    let monthKey = '';
                                    if (periodStr.includes('-')) {
                                      const parts = periodStr.split('-');
                                      if (parts.length >= 2) {
                                        monthKey = `${parts[0]}-${parts[1].padStart(2, '0')}`;
                                      }
                                    }

                                    if (!monthKey) return;

                                    // Determine health status and interval
                                    let healthStatus = 'Needs Attention';
                                    let auditInterval = 30;
                                    if (percentage >= 81) {
                                      healthStatus = 'Perfect Shot';
                                      auditInterval = 60;
                                    } else if (percentage >= 56) {
                                      healthStatus = 'Brewing';
                                      auditInterval = 45;
                                    }

                                    if (!storeMonthlyAudits.has(storeId)) {
                                      const metadata = storeMetadata.get(storeId) || {
                                        storeName: storeName || storeId,
                                        region: row.region || 'Unknown',
                                        areaManager: 'Unknown',
                                        trainer: 'Unknown'
                                      };

                                      storeMonthlyAudits.set(storeId, {
                                        storeId,
                                        storeName: metadata.storeName,
                                        region: metadata.region,
                                        areaManager: metadata.areaManager,
                                        trainer: metadata.trainer,
                                        monthlyData: new Map()
                                      });
                                    }

                                    const store = storeMonthlyAudits.get(storeId);

                                    // Create a synthetic date for the month (use last day of month)
                                    const [year, month] = monthKey.split('-');
                                    const date = new Date(parseInt(year), parseInt(month), 0); // Last day of month

                                    // Store audit data for this month
                                    store.monthlyData.set(monthKey, {
                                      date,
                                      percentage,
                                      healthStatus,
                                      auditInterval,
                                      source: 'trends'
                                    });
                                  });
                                }

                                // Process current training data (filteredTrainingData)
                                filteredTrainingData.forEach(submission => {
                                  const storeId = submission.storeId;
                                  if (!storeId) return;

                                  const dateStr = submission.submissionTime || submission.timestamp;
                                  if (!dateStr) return;

                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime())) return;

                                  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                  const percentage = parseFloat(submission.percentageScore || '0');

                                  // Determine health status and interval
                                  let healthStatus = 'Needs Attention';
                                  let auditInterval = 30;
                                  if (percentage >= 81) {
                                    healthStatus = 'Perfect Shot';
                                    auditInterval = 60;
                                  } else if (percentage >= 56) {
                                    healthStatus = 'Brewing';
                                    auditInterval = 45;
                                  }

                                  if (!storeMonthlyAudits.has(storeId)) {
                                    const metadata = storeMetadata.get(storeId) || {
                                      storeName: submission.storeName || storeId,
                                      region: submission.region || 'Unknown',
                                      areaManager: submission.areaManager || 'Unknown',
                                      trainer: submission.trainerName || 'Unknown'
                                    };

                                    storeMonthlyAudits.set(storeId, {
                                      storeId,
                                      storeName: metadata.storeName,
                                      region: metadata.region,
                                      areaManager: metadata.areaManager,
                                      trainer: metadata.trainer,
                                      monthlyData: new Map()
                                    });
                                  }

                                  const store = storeMonthlyAudits.get(storeId);

                                  // Keep only the latest audit for each month (prefer current data over trends data)
                                  const existing = store.monthlyData.get(monthKey);
                                  if (!existing || existing.source === 'trends' || date > existing.date) {
                                    store.monthlyData.set(monthKey, {
                                      date,
                                      percentage,
                                      healthStatus,
                                      auditInterval,
                                      source: 'current'
                                    });
                                  }
                                });

                                // Generate months from July 2025 to current
                                const months: Date[] = [];
                                const startDate = new Date(2025, 6, 1); // July 2025
                                const current = new Date(startDate);
                                const end = new Date(today.getFullYear(), today.getMonth(), 1);

                                while (current <= end) {
                                  months.push(new Date(current));
                                  current.setMonth(current.getMonth() + 1);
                                }

                                // Calculate compliance for each store/month
                                const storeRows = Array.from(storeMonthlyAudits.values()).map(store => {
                                  const monthlyStatus = new Map();
                                  let previousAudit: any = null;
                                  let latestHealthStatus = 'No audit done';
                                  let hasAnyAudit = false;

                                  months.forEach((month, monthIndex) => {
                                    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
                                    const audit = store.monthlyData.get(monthKey);
                                    const isCurrentMonth = monthIndex === months.length - 1;

                                    if (audit) {
                                      // Update latest health status
                                      latestHealthStatus = audit.healthStatus || 'Unknown';
                                      hasAnyAudit = true;

                                      // Audit exists for this month
                                      if (previousAudit) {
                                        // Check if this audit was done within the required interval from previous
                                        const daysSincePrevious = Math.floor((audit.date.getTime() - previousAudit.date.getTime()) / (1000 * 60 * 60 * 24));

                                        if (daysSincePrevious <= previousAudit.auditInterval) {
                                          monthlyStatus.set(monthKey, { status: 'on-time', audit, daysSincePrevious });
                                        } else {
                                          monthlyStatus.set(monthKey, { status: 'late', audit, daysSincePrevious });
                                        }
                                      } else {
                                        // First audit
                                        monthlyStatus.set(monthKey, { status: 'first-audit', audit });
                                      }
                                      previousAudit = audit;
                                    } else {
                                      // No audit this month
                                      if (previousAudit) {
                                        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0); // Last day of month
                                        const daysSincePrevious = Math.floor((monthEnd.getTime() - previousAudit.date.getTime()) / (1000 * 60 * 60 * 24));

                                        // Mark as missed if interval exceeded AND month has passed (or is current month)
                                        if (daysSincePrevious > previousAudit.auditInterval) {
                                          if (isCurrentMonth) {
                                            // Current month - check if overdue based on today
                                            const daysFromPreviousToToday = Math.floor((today.getTime() - previousAudit.date.getTime()) / (1000 * 60 * 60 * 24));
                                            if (daysFromPreviousToToday > previousAudit.auditInterval) {
                                              monthlyStatus.set(monthKey, { status: 'overdue-now', daysSincePrevious: daysFromPreviousToToday });
                                            }
                                          } else {
                                            // Past month - was missed
                                            monthlyStatus.set(monthKey, { status: 'missed', daysSincePrevious });
                                          }
                                        }
                                        // If within schedule, don't add any status (will show as no data)
                                      } else {
                                        // No previous audit at all
                                        if (isCurrentMonth) {
                                          // Current month and never audited - show as overdue
                                          monthlyStatus.set(monthKey, { status: 'never-audited' });
                                        }
                                      }
                                    }
                                  });

                                  // If no audits at all, set health status
                                  if (!hasAnyAudit) {
                                    latestHealthStatus = 'No audit done';
                                  }

                                  return { ...store, monthlyStatus, latestHealthStatus };
                                });

                                // Apply filters
                                let filteredRows = storeRows;

                                if (auditCoverageFilters.health !== 'all') {
                                  filteredRows = filteredRows.filter(row => row.latestHealthStatus === auditCoverageFilters.health);
                                }

                                if (auditCoverageFilters.region !== 'all') {
                                  filteredRows = filteredRows.filter(row => row.region === auditCoverageFilters.region);
                                }

                                if (auditCoverageFilters.am !== 'all') {
                                  filteredRows = filteredRows.filter(row => row.areaManager === auditCoverageFilters.am);
                                }

                                if (auditCoverageFilters.trainer !== 'all') {
                                  filteredRows = filteredRows.filter(row => row.trainer === auditCoverageFilters.trainer);
                                }

                                // Sort by store name
                                filteredRows.sort((a, b) => a.storeName.localeCompare(b.storeName));

                                if (filteredRows.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={months.length + 1} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                                        No audit data available
                                      </td>
                                    </tr>
                                  );
                                }

                                return filteredRows.map((store, rowIndex) => (
                                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-3 text-sm sticky left-0 bg-white dark:bg-slate-800">
                                      <div className="font-medium text-gray-900 dark:text-white">{store.storeName}</div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 dark:text-slate-400">{store.storeId}</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${store.latestHealthStatus === 'Perfect Shot'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : store.latestHealthStatus === 'Brewing'
                                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                              : store.latestHealthStatus === 'Needs Attention'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                          }`}>
                                          {store.latestHealthStatus}
                                        </span>
                                      </div>
                                    </td>
                                    {months.map(month => {
                                      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
                                      const status = store.monthlyStatus.get(monthKey);

                                      if (!status) {
                                        return (
                                          <td key={monthKey} className="px-3 py-3">
                                            <div className="flex items-center justify-center">
                                              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                                                <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-400 dark:text-slate-500" />
                                              </svg>
                                            </div>
                                          </td>
                                        );
                                      }

                                      let iconElement;
                                      let tooltip = '';

                                      if (status.status === 'on-time' || status.status === 'first-audit') {
                                        iconElement = (
                                          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 dark:text-emerald-400" />
                                          </svg>
                                        );
                                        tooltip = status.status === 'first-audit'
                                          ? `First audit: ${status.audit.percentage}%`
                                          : `On time (${status.daysSincePrevious}d): ${status.audit.percentage}%`;
                                      } else if (status.status === 'late') {
                                        iconElement = (
                                          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" className="fill-orange-500 dark:fill-orange-400" />
                                            <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                          </svg>
                                        );
                                        tooltip = `Late (${status.daysSincePrevious}d): ${status.audit.percentage}%`;
                                      } else if (status.status === 'missed') {
                                        iconElement = (
                                          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                                            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-red-600 dark:text-red-500" />
                                          </svg>
                                        );
                                        tooltip = `Missed (${status.daysSincePrevious}d overdue)`;
                                      } else if (status.status === 'overdue-now') {
                                        iconElement = (
                                          <div className="relative">
                                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                                              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-red-600 dark:text-red-500" />
                                            </svg>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                                          </div>
                                        );
                                        tooltip = `OVERDUE NOW (${status.daysSincePrevious}d)`;
                                      } else if (status.status === 'never-audited') {
                                        iconElement = (
                                          <div className="relative">
                                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="text-red-600 dark:text-red-500" />
                                              <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-red-600 dark:text-red-500" />
                                            </svg>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                                          </div>
                                        );
                                        tooltip = 'NO AUDIT DONE - Immediate action required';
                                      } else {
                                        iconElement = (
                                          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-400 dark:text-slate-500" />
                                          </svg>
                                        );
                                        tooltip = 'No coverage';
                                      }

                                      return (
                                        <td key={monthKey} className="px-3 py-3" title={tooltip}>
                                          <div className="flex items-center justify-center">
                                            {iconElement}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 dark:text-emerald-400" />
                            </svg>
                            <span className="text-gray-700 dark:text-slate-300">On Time</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" className="fill-orange-500 dark:fill-orange-400" />
                              <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="text-gray-700 dark:text-slate-300">Late (After Due)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-red-600 dark:text-red-500" />
                            </svg>
                            <span className="text-gray-700 dark:text-slate-300">Missed (Past Month)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-red-600 dark:text-red-500" />
                              </svg>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"></div>
                            </div>
                            <span className="text-gray-700 dark:text-slate-300">Overdue Now</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-400 dark:text-slate-500" />
                            </svg>
                            <span className="text-gray-700 dark:text-slate-300">No Coverage</span>
                          </div>
                        </div>
                      </>
                    )}
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

                  {/* QA Submissions List with Edit */}
                  {filteredQAData && filteredQAData.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Submissions ({filteredQAData.length > 50 ? 'Showing 50 of ' + filteredQAData.length : filteredQAData.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Store
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Auditor
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Score
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredQAData.slice(0, 50).map((submission, index) => (
                              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {submission.submissionTime ? (() => {
                                    const date = parseSheetDate(submission.submissionTime);
                                    if (date) {
                                      const day = date.getDate();
                                      const month = date.toLocaleDateString('en-US', { month: 'short' });
                                      const year = date.getFullYear();
                                      const suffix = day === 1 || day === 21 || day === 31 ? 'st'
                                        : day === 2 || day === 22 ? 'nd'
                                          : day === 3 || day === 23 ? 'rd'
                                            : 'th';
                                      return `${month} ${day}${suffix} ${year}`;
                                    }
                                    return submission.submissionTime;
                                  })() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  <div>{submission.storeName || 'N/A'}</div>
                                  <div className="text-xs text-gray-500 dark:text-slate-400">{submission.storeId}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  <div>{submission.qaName || 'N/A'}</div>
                                  <div className="text-xs text-gray-500 dark:text-slate-400">{submission.qaId}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${parseFloat(submission.scorePercentage || '0') >= 80
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                      : parseFloat(submission.scorePercentage || '0') >= 60
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {submission.scorePercentage || '0'}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <button
                                    onClick={() => {
                                      setQAEditSubmission(submission);
                                      setShowQAEdit(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    ✏️ Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Finance Dashboard Content */}
              {dashboardType === 'finance' && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Finance Submissions List */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Finance Audits ({filteredFinanceData.length})
                      </h3>
                      {filteredFinanceData && filteredFinanceData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead>
                              <tr>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider w-8">

                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Store
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Auditor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Score
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                              {filteredFinanceData.slice(0, 10).map((submission, index) => (
                                <React.Fragment key={index}>
                                  <tr
                                    className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                                    onClick={() => setExpandedFinanceRow(expandedFinanceRow === index ? null : index)}
                                  >
                                    <td className="px-2 py-3 text-sm text-gray-900 dark:text-slate-100">
                                      {expandedFinanceRow === index ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100 whitespace-nowrap">
                                      {submission.submissionTime}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                      {submission.storeName} ({submission.storeId})
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                      {submission.financeName}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${parseFloat(submission.scorePercentage) >= 80
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                          : parseFloat(submission.scorePercentage) >= 60
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {submission.scorePercentage}%
                                      </span>
                                    </td>
                                  </tr>
                                  {/* Expanded Row with Question Details */}
                                  {expandedFinanceRow === index && (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-4 bg-gray-50 dark:bg-slate-700/50">
                                        <div className="space-y-4">
                                          {/* Cash Management Section */}
                                          {Object.keys(submission).filter(key => key.startsWith('CashManagement_')).length > 0 && (
                                            <div>
                                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Cash Management</h4>
                                              <div className="grid grid-cols-1 gap-2">
                                                {Object.keys(submission)
                                                  .filter(key => key.startsWith('CashManagement_CM_'))
                                                  .sort((a, b) => {
                                                    const numA = parseInt(a.split('_').pop() || '0');
                                                    const numB = parseInt(b.split('_').pop() || '0');
                                                    return numA - numB;
                                                  })
                                                  .map((key) => {
                                                    const value = submission[key];
                                                    if (!value || value === 'undefined') return null;
                                                    const questionNum = key.split('_').pop();
                                                    return (
                                                      <div key={key} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded">
                                                        <span className="text-gray-700 dark:text-slate-300">Question {questionNum}</span>
                                                        <span className={`px-2 py-1 rounded-full font-medium ${value === 'yes' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            value === 'no' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                          }`}>
                                                          {value === 'yes' ? '✓ Yes' : value === 'no' ? '✗ No' : 'N/A'}
                                                        </span>
                                                      </div>
                                                    );
                                                  })}
                                              </div>
                                            </div>
                                          )}

                                          {/* Sales & Revenue Section */}
                                          {Object.keys(submission).filter(key => key.startsWith('SalesRevenue_')).length > 0 && (
                                            <div>
                                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Sales & Revenue Tracking</h4>
                                              <div className="grid grid-cols-1 gap-2">
                                                {Object.keys(submission)
                                                  .filter(key => key.startsWith('SalesRevenue_SR_'))
                                                  .sort((a, b) => {
                                                    const numA = parseInt(a.split('_').pop() || '0');
                                                    const numB = parseInt(b.split('_').pop() || '0');
                                                    return numA - numB;
                                                  })
                                                  .map((key) => {
                                                    const value = submission[key];
                                                    if (!value || value === 'undefined') return null;
                                                    const questionNum = key.split('_').pop();
                                                    return (
                                                      <div key={key} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded">
                                                        <span className="text-gray-700 dark:text-slate-300">Question {questionNum}</span>
                                                        <span className={`px-2 py-1 rounded-full font-medium ${value === 'yes' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            value === 'no' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                          }`}>
                                                          {value === 'yes' ? '✓ Yes' : value === 'no' ? '✗ No' : 'N/A'}
                                                        </span>
                                                      </div>
                                                    );
                                                  })}
                                              </div>
                                            </div>
                                          )}

                                          {/* Inventory & Financial Controls Section */}
                                          {Object.keys(submission).filter(key => key.startsWith('InventoryFinance_')).length > 0 && (
                                            <div>
                                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Inventory & Financial Controls</h4>
                                              <div className="grid grid-cols-1 gap-2">
                                                {Object.keys(submission)
                                                  .filter(key => key.startsWith('InventoryFinance_IF_'))
                                                  .sort((a, b) => {
                                                    const numA = parseInt(a.split('_').pop() || '0');
                                                    const numB = parseInt(b.split('_').pop() || '0');
                                                    return numA - numB;
                                                  })
                                                  .map((key) => {
                                                    const value = submission[key];
                                                    if (!value || value === 'undefined') return null;
                                                    const questionNum = key.split('_').pop();
                                                    return (
                                                      <div key={key} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded">
                                                        <span className="text-gray-700 dark:text-slate-300">Question {questionNum}</span>
                                                        <span className={`px-2 py-1 rounded-full font-medium ${value === 'yes' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            value === 'no' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                          }`}>
                                                          {value === 'yes' ? '✓ Yes' : value === 'no' ? '✗ No' : 'N/A'}
                                                        </span>
                                                      </div>
                                                    );
                                                  })}
                                              </div>
                                            </div>
                                          )}

                                          {/* Compliance & Reporting Section */}
                                          {Object.keys(submission).filter(key => key.startsWith('ComplianceReporting_')).length > 0 && (
                                            <div>
                                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Compliance & Reporting</h4>
                                              <div className="grid grid-cols-1 gap-2">
                                                {Object.keys(submission)
                                                  .filter(key => key.startsWith('ComplianceReporting_CR_'))
                                                  .sort((a, b) => {
                                                    const numA = parseInt(a.split('_').pop() || '0');
                                                    const numB = parseInt(b.split('_').pop() || '0');
                                                    return numA - numB;
                                                  })
                                                  .map((key) => {
                                                    const value = submission[key];
                                                    if (!value || value === 'undefined') return null;
                                                    const questionNum = key.split('_').pop();
                                                    return (
                                                      <div key={key} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded">
                                                        <span className="text-gray-700 dark:text-slate-300">Question {questionNum}</span>
                                                        <span className={`px-2 py-1 rounded-full font-medium ${value === 'yes' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            value === 'no' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                          }`}>
                                                          {value === 'yes' ? '✓ Yes' : value === 'no' ? '✗ No' : 'N/A'}
                                                        </span>
                                                      </div>
                                                    );
                                                  })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                          No Finance audit submissions found.
                        </p>
                      )}
                    </div>

                    {/* Finance Score Distribution */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Score Distribution
                      </h3>
                      {filteredFinanceData && filteredFinanceData.length > 0 ? (
                        <div className="space-y-4">
                          {(() => {
                            const excellent = filteredFinanceData.filter(s => parseFloat(s.scorePercentage) >= 80).length;
                            const good = filteredFinanceData.filter(s => parseFloat(s.scorePercentage) >= 60 && parseFloat(s.scorePercentage) < 80).length;
                            const needsImprovement = filteredFinanceData.filter(s => parseFloat(s.scorePercentage) < 60).length;
                            const total = filteredFinanceData.length;

                            return (
                              <>
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Excellent (80%+)</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{excellent} ({Math.round(excellent / total * 100)}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${excellent / total * 100}%` }}></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Good (60-79%)</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{good} ({Math.round(good / total * 100)}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${good / total * 100}%` }}></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Needs Improvement (&lt;60%)</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{needsImprovement} ({Math.round(needsImprovement / total * 100)}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${needsImprovement / total * 100}%` }}></div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                          No score data available.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* SHLP Dashboard Content */}
              {dashboardType === 'shlp' && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SHLP Submissions List */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent SHLP Certifications ({filteredSHLPData.length})
                      </h3>
                      {filteredSHLPData && filteredSHLPData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead>
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Employee
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Store
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  AM
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Trainer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                  Overall Score
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                              {filteredSHLPData.slice(0, 10).map((submission, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100 whitespace-nowrap">
                                    {new Date(submission['Submission Time']).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                    <div>
                                      <div className="font-medium">{submission['Employee Name']}</div>
                                      <div className="text-gray-500 dark:text-slate-400 text-xs">{submission['Employee ID']}</div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                    {submission.Store}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                    {getAMName(submission['Area Manager'])}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                    {getTrainerNames(submission.Trainer)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${parseFloat(submission.Overall_Percentage) >= 80
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : parseFloat(submission.Overall_Percentage) >= 60
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                      }`}>
                                      {submission.Overall_Percentage}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                          No SHLP certification submissions found.
                        </p>
                      )}
                    </div>

                    {/* SHLP Section Scores */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Section Performance
                      </h3>
                      {filteredSHLPData && filteredSHLPData.length > 0 ? (
                        <div className="space-y-4">
                          {(() => {
                            const sections = [
                              { key: 'Store_Readiness_Score', label: 'Store Readiness' },
                              { key: 'Product_Quality_Score', label: 'Product Quality' },
                              { key: 'Cash_Admin_Score', label: 'Cash & Administration' },
                              { key: 'Team_Management_Score', label: 'Team Management' },
                              { key: 'Operations_Score', label: 'Operations' },
                              { key: 'Safety_Score', label: 'Safety & Compliance' },
                              { key: 'Business_Score', label: 'Business Acumen' }
                            ];

                            return sections.map(section => {
                              const scores = filteredSHLPData.map(s => parseFloat(s[section.key] || '0')).filter(s => s > 0);
                              const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

                              return (
                                <div key={section.key}>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{section.label}</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{Math.round(avgScore)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${avgScore >= 80 ? 'bg-green-600' :
                                          avgScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                        }`}
                                      style={{ width: `${avgScore}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-slate-400 text-center py-8">
                          No section data available.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Detailed Question Analysis */}
                  {filteredSHLPData && filteredSHLPData.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Question-wise Performance Analysis
                      </h3>
                      {(() => {
                        const questionDetails = [
                          // Store Readiness (Q1-Q5)
                          { id: 1, section: 'Store Readiness', question: 'Store opening checklist completion' },
                          { id: 2, section: 'Store Readiness', question: 'Equipment functionality verification' },
                          { id: 3, section: 'Store Readiness', question: 'Inventory stock levels adequacy' },
                          { id: 4, section: 'Store Readiness', question: 'Store cleanliness and presentation' },
                          { id: 5, section: 'Store Readiness', question: 'Safety protocols implementation' },
                          // Product Quality (Q6-Q10)
                          { id: 6, section: 'Product Quality', question: 'Product quality consistency' },
                          { id: 7, section: 'Product Quality', question: 'Recipe adherence and standardization' },
                          { id: 8, section: 'Product Quality', question: 'Temperature control maintenance' },
                          { id: 9, section: 'Product Quality', question: 'Expiry date monitoring' },
                          { id: 10, section: 'Product Quality', question: 'Presentation standards compliance' },
                          // Cash & Administration (Q11-Q15)
                          { id: 11, section: 'Cash & Administration', question: 'Cash handling procedures' },
                          { id: 12, section: 'Cash & Administration', question: 'Transaction accuracy' },
                          { id: 13, section: 'Cash & Administration', question: 'Administrative documentation' },
                          { id: 14, section: 'Cash & Administration', question: 'Reporting timeliness' },
                          { id: 15, section: 'Cash & Administration', question: 'Compliance with financial protocols' },
                          // Team Management (Q16-Q23)
                          { id: 16, section: 'Team Management', question: 'Staff scheduling effectiveness' },
                          { id: 17, section: 'Team Management', question: 'Team communication quality' },
                          { id: 18, section: 'Team Management', question: 'Performance management' },
                          { id: 19, section: 'Team Management', question: 'Training and development' },
                          { id: 20, section: 'Team Management', question: 'Conflict resolution' },
                          { id: 21, section: 'Team Management', question: 'Leadership demonstration' },
                          { id: 22, section: 'Team Management', question: 'Motivation and engagement' },
                          { id: 23, section: 'Team Management', question: 'Delegation and supervision' },
                          // Operations (Q24-Q30)
                          { id: 24, section: 'Operations', question: 'Operational efficiency' },
                          { id: 25, section: 'Operations', question: 'Service speed and quality' },
                          { id: 26, section: 'Operations', question: 'Customer satisfaction' },
                          { id: 27, section: 'Operations', question: 'Resource utilization' },
                          { id: 28, section: 'Operations', question: 'Process optimization' },
                          { id: 29, section: 'Operations', question: 'Availability and accessibility' },
                          { id: 30, section: 'Operations', question: 'System reliability' },
                          // Safety & Compliance (Q31-Q33)
                          { id: 31, section: 'Safety & Compliance', question: 'Safety protocol adherence' },
                          { id: 32, section: 'Safety & Compliance', question: 'Regulatory compliance' },
                          { id: 33, section: 'Safety & Compliance', question: 'Maintenance logging' },
                          // Business Acumen (Q34-Q36)
                          { id: 34, section: 'Business Acumen', question: 'Sales analysis (WoW, MoM – ADS, ADT, FIPT, LTO)' },
                          { id: 35, section: 'Business Acumen', question: 'BSC understanding' },
                          { id: 36, section: 'Business Acumen', question: 'Controllables (EB units, COGS)' }
                        ];

                        // Group questions by section
                        const sectionGroups = questionDetails.reduce((acc, q) => {
                          if (!acc[q.section]) acc[q.section] = [];
                          acc[q.section].push(q);
                          return acc;
                        }, {} as Record<string, typeof questionDetails>);

                        return (
                          <div className="space-y-6">
                            {Object.entries(sectionGroups).map(([sectionName, questions]) => (
                              <div key={sectionName} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{sectionName}</h4>
                                <div className="space-y-3">
                                  {questions.map(q => {
                                    // Calculate average score for this question
                                    const scores = filteredSHLPData.map(s => parseInt(s[`SHLP_${q.id}`] || '0')).filter(s => s >= 0);
                                    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                                    const percentage = (avgScore / 2) * 100; // Convert 0-2 scale to percentage

                                    // Count score distribution
                                    const scoreCounts = { 0: 0, 1: 0, 2: 0 };
                                    scores.forEach(score => {
                                      if (score >= 0 && score <= 2) scoreCounts[score as keyof typeof scoreCounts]++;
                                    });

                                    return (
                                      <div key={q.id} className="bg-gray-50 dark:bg-slate-700 p-3 rounded">
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">Q{q.id}: {q.question}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Based on {scores.length} submissions</div>
                                          </div>
                                          <div className="text-right ml-4">
                                            <div className={`text-sm font-bold ${percentage >= 80 ? 'text-green-600' :
                                                percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                              }`}>
                                              {Math.round(percentage)}% ({avgScore.toFixed(1)}/2.0)
                                            </div>
                                          </div>
                                        </div>

                                        {/* Score Distribution */}
                                        <div className="flex items-center space-x-4 text-xs">
                                          <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="text-gray-600 dark:text-slate-400">Not Done: {scoreCounts[0]}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span className="text-gray-600 dark:text-slate-400">Partial: {scoreCounts[1]}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-gray-600 dark:text-slate-400">Complete: {scoreCounts[2]}</span>
                                          </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                                          <div
                                            className={`h-2 rounded-full ${percentage >= 80 ? 'bg-green-600' :
                                                percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                              }`}
                                            style={{ width: `${percentage}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

            </>
          )}

          {/* Campus Hiring Stats - Only show in consolidated view for admins */}
          {dashboardType === 'consolidated' && campusHiringData.length > 0 && (
            <>
              {/* Separator */}
              <div className="border-t-4 border-indigo-500 my-8"></div>

              <CampusHiringStats submissions={campusHiringData} />
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
                  : dashboardType === 'finance'
                    ? 'No Finance Audit checklists found. Submit checklists through the Checklists & Surveys section to see data here.'
                    : 'Try adjusting your filters to find data.'
            }
          </p>
        </div>
      )}
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

      {/* Training Health Breakdown Modal */}
      <TrainingHealthBreakdownModal
        isOpen={showHealthBreakdown}
        onClose={() => setShowHealthBreakdown(false)}
        submissions={filteredTrainingData}
        trendsData={trendsData}
      />

      {/* Audit Score Details Modal */}
      <AuditScoreDetailsModal
        isOpen={showAuditScoreDetails}
        onClose={() => setShowAuditScoreDetails(false)}
        trendsData={trendsData || []}
        filters={filters}
        compStoreMapping={compStoreMapping || []}
      />

      {/* HR Detail Modal */}
      {hrDetailFilter && (
        <HRDetailModal
          isOpen={showHRDetail}
          onClose={closeHRDetail}
          submissions={filteredSubmissions}
          filterType={hrDetailFilter.type}
          filterValue={hrDetailFilter.value}
          title={hrDetailFilter.title}
        />
      )}

      {/* QA Edit Modal */}
      {qaEditSubmission && (
        <QAEditModal
          isOpen={showQAEdit}
          onClose={() => {
            setShowQAEdit(false);
            setQAEditSubmission(null);
            // Refresh QA data after edit
            loadData();
          }}
          submission={qaEditSubmission}
          userRole={userRole}
        />
      )}

      {/* HRBP Calendar Modal */}
      {showHRBPCalendar && selectedHRBP && (
        <HRBPCalendarModal
          hrbp={selectedHRBP}
          submissions={filteredSubmissions}
          onClose={() => {
            setShowHRBPCalendar(false);
            setSelectedHRBP(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;