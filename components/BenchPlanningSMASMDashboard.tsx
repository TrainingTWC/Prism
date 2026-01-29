/* Bench Planning Dashboard - Updated */
import React, { useState, useEffect } from 'react';
import { UserRole } from '../roleMapping';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  MapPin,
  FileCheck,
  Brain,
  MessageSquare,
  Search,
  Filter,
  Download
} from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';
import * as XLSX from 'xlsx';

interface BenchPlanningDashboardProps {
  userRole: UserRole;
}

interface DashboardSummary {
  totalCandidates: number;
  readiness: {
    passed: number;
    failed: number;
    notStarted: number;
  };
  assessment: {
    completed: number;
    notStarted: number;
  };
  interview: {
    completed: number;
    notStarted: number;
  };
}

interface RegionStats {
  region: string;
  totalCandidates: number;
  readinessPassed: number;
  readinessFailed: number;
  readinessNotStarted: number;
  assessmentCompleted: number;
  assessmentNotStarted: number;
  interviewCompleted: number;
  interviewNotStarted: number;
}

interface CandidateDetail {
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  storeId: string;
  storeName: string;
  region: string;
  readinessStatus: string;
  readinessScore: number | null;
  assessmentStatus: string;
  assessmentScore: number | null;
  interviewStatus: string;
  interviewScore: number | null;
}

interface StoreWiseData {
  storeId: string;
  storeName: string;
  region: string;
  candidates: CandidateDetail[];
  totalCandidates: number;
  readinessPassed: number;
  assessmentCompleted: number;
  interviewCompleted: number;
}

interface AMWiseData {
  managerId: string;
  managerName: string;
  region: string;
  candidates: CandidateDetail[];
  totalCandidates: number;
  readinessPassed: number;
  assessmentCompleted: number;
  interviewCompleted: number;
}

const BENCH_PLANNING_SM_ASM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyMynWOxjrwi4892AKUTVgFizmGzkn_CEKUPyv7PHpTAFmSNGbpx1kJMS8Y3wVNV-eJnA/exec';

const BenchPlanningSMASMDashboard: React.FC<BenchPlanningDashboardProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [regionBreakdown, setRegionBreakdown] = useState<RegionStats[]>([]);
  const [storeWiseData, setStoreWiseData] = useState<StoreWiseData[]>([]);
  const [amWiseData, setAMWiseData] = useState<AMWiseData[]>([]);
  const [detailedCandidates, setDetailedCandidates] = useState<CandidateDetail[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeView, setActiveView] = useState<'summary' | 'region' | 'store' | 'am'>('summary');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(true); // Open by default

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${BENCH_PLANNING_SM_ASM_ENDPOINT}?action=getDashboardData`);
      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
        setRegionBreakdown(data.regionBreakdown || []);
        setStoreWiseData(data.storeWiseData || []);
        setAMWiseData(data.amWiseData || []);
        setDetailedCandidates(data.detailedCandidates || []);
      } else {
        setErrorMessage(data.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setErrorMessage('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter and search logic
  const getFilteredCandidates = () => {
    return detailedCandidates.filter(candidate => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        candidate.employeeName.toLowerCase().includes(searchLower) ||
        candidate.employeeId.toLowerCase().includes(searchLower) ||
        candidate.managerName.toLowerCase().includes(searchLower) ||
        candidate.storeName.toLowerCase().includes(searchLower) ||
        candidate.storeId.toLowerCase().includes(searchLower);
      
      // Region filter
      const matchesRegion = filterRegion === 'all' || candidate.region === filterRegion;
      
      // Status filter
const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'passed' && candidate.readinessStatus === 'Passed') ||
        (filterStatus === 'failed' && candidate.readinessStatus === 'Failed') ||
        (filterStatus === 'pending' && candidate.readinessStatus === 'Not Started');
      
      return matchesSearch && matchesRegion && matchesStatus;
    });
  };
  
  // Get unique regions for filter dropdown
  const getUniqueRegions = () => {
    const regions = new Set(detailedCandidates.map(c => c.region));
    return Array.from(regions).sort();
  };
  
  // Excel download function
  const downloadExcel = () => {
    const filteredData = getFilteredCandidates();
    
    // Prepare data for Excel
    const excelData = filteredData.map(candidate => ({
      'Employee ID': candidate.employeeId,
      'Employee Name': candidate.employeeName,
      'Store ID': candidate.storeId,
      'Store Name': candidate.storeName,
      'Area Manager ID': candidate.managerId,
      'Area Manager Name': candidate.managerName,
      'Region': candidate.region,
      'Readiness Status': candidate.readinessStatus,
      'Readiness Score': candidate.readinessScore || 'N/A',
      'Assessment Status': candidate.assessmentStatus,
      'Assessment Score': candidate.assessmentScore || 'N/A',
      'Interview Status': candidate.interviewStatus,
      'Interview Score': candidate.interviewScore || 'N/A'
    }));
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // Employee ID
      { wch: 25 }, // Employee Name
      { wch: 12 }, // Store ID
      { wch: 30 }, // Store Name
      { wch: 15 }, // AM ID
      { wch: 25 }, // AM Name
      { wch: 15 }, // Region
      { wch: 18 }, // Readiness Status
      { wch: 15 }, // Readiness Score
      { wch: 18 }, // Assessment Status
      { wch: 15 }, // Assessment Score
      { wch: 18 }, // Interview Status
      { wch: 15 }  // Interview Score
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Bench Planning Data');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Bench_Planning_SM_ASM_Dashboard_${timestamp}.xlsx`;
    
    // Download
    XLSX.writeFile(wb, filename);
  };

  const getStatusColor = (status: 'passed' | 'failed' | 'pending') => {
    switch (status) {
      case 'passed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Passed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">✓ Passed</span>;
      case 'Failed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">✗ Failed</span>;
      case 'Completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">✓ Done</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400">⏳ Pending</span>;
    }
  };

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: number;
    total?: number;
    color: string;
    subtitle?: string;
  }> = ({ icon, title, value, total, color, subtitle }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        {total !== undefined && (
          <>
            <span className="text-gray-400 dark:text-slate-500">/</span>
            <p className="text-xl font-medium text-gray-500 dark:text-slate-400">{total}</p>
          </>
        )}
      </div>
      {total !== undefined && total > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${color.replace('bg-', 'bg-').replace('/20', '')}`}
              style={{ width: `${(value / total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {((value / total) * 100).toFixed(1)}% complete
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="mb-6 space-y-4 animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
          </div>
        </div>

        {/* View Tabs Skeleton */}
        <div className="mb-6 flex gap-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
          ))}
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700/50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      {/* Header with Search and Download */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bench Planning | Shift Manager to Assistant Store Manager
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              Track readiness, assessments, and interview progress for bench candidates
            </p>
          </div>
          
          {/* Download Button */}
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md"
          >
            <Download className="w-5 h-5" />
            Download Excel
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, employee ID, manager, or store..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
              {(filterRegion !== 'all' || filterStatus !== 'all') && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {(filterRegion !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
          
          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Region
                </label>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Regions</option>
                  {getUniqueRegions().map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Readiness Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              {/* Clear Filters */}
              {(filterRegion !== 'all' || filterStatus !== 'all' || searchTerm !== '') && (
                <div className="md:col-span-2">
                  <button
                    onClick={() => {
                      setFilterRegion('all');
                      setFilterStatus('all');
                      setSearchTerm('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Results Count - Always show */}
          <div className="mt-4 text-sm font-medium text-gray-700 dark:text-slate-300">
            Showing <span className="text-blue-600 dark:text-blue-400 font-bold">{getFilteredCandidates().length}</span> of <span className="font-bold">{detailedCandidates.length}</span> candidates
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-900 dark:text-red-100">{errorMessage}</p>
        </div>
      )}

      {summary && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Users className="w-6 h-6" />}
              title="Total Candidates"
              value={summary.totalCandidates}
              color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              icon={<FileCheck className="w-6 h-6" />}
              title="Readiness Passed"
              value={summary.readiness.passed}
              total={summary.totalCandidates}
              color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              subtitle={`${summary.readiness.failed} failed, ${summary.readiness.notStarted} pending`}
            />
            <StatCard
              icon={<Brain className="w-6 h-6" />}
              title="Assessment Complete"
              value={summary.assessment.completed}
              total={summary.readiness.passed}
              color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              subtitle={`Out of ${summary.readiness.passed} eligible`}
            />
            <StatCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Interview Complete"
              value={summary.interview.completed}
              total={summary.assessment.completed}
              color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
              subtitle={`Out of ${summary.assessment.completed} eligible`}
            />
          </div>

          {/* Readiness Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Readiness Passed</h3>
              </div>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {summary.readiness.passed}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {summary.totalCandidates > 0 
                  ? ((summary.readiness.passed / summary.totalCandidates) * 100).toFixed(1) 
                  : 0}% of total candidates
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Readiness Failed</h3>
              </div>
              <p className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                {summary.readiness.failed}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Scored below 80% threshold
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Readiness Pending</h3>
              </div>
              <p className="text-4xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                {summary.readiness.notStarted}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Awaiting manager assessment
              </p>
            </div>
          </div>

          {/* View Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-slate-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveView('summary')}
                  className={`${
                    activeView === 'summary'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Summary View
                </button>
                <button
                  onClick={() => setActiveView('region')}
                  className={`${
                    activeView === 'region'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Region-wise
                </button>
                <button
                  onClick={() => setActiveView('store')}
                  className={`${
                    activeView === 'store'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Store-wise
                </button>
                <button
                  onClick={() => setActiveView('am')}
                  className={`${
                    activeView === 'am'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  AM-wise
                </button>
              </nav>
            </div>
          </div>

          {/* Region-wise Breakdown */}
          {activeView === 'region' && regionBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
              <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Region-wise Breakdown
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Candidates
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Readiness
                        <div className="text-xs font-normal normal-case mt-1">
                          <span className="text-green-600">✓</span> / <span className="text-red-600">✗</span> / <span className="text-gray-500">⏳</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Assessment
                        <div className="text-xs font-normal normal-case mt-1">
                          <span className="text-green-600">✓</span> / <span className="text-gray-500">⏳</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Interview
                        <div className="text-xs font-normal normal-case mt-1">
                          <span className="text-green-600">✓</span> / <span className="text-gray-500">⏳</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {regionBreakdown
                      .sort((a, b) => b.totalCandidates - a.totalCandidates)
                      .map((region, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {region.region}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {region.totalCandidates}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2 text-sm">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                ✓ {region.readinessPassed}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                ✗ {region.readinessFailed}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400">
                                ⏳ {region.readinessNotStarted}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2 text-sm">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">
                                ✓ {region.assessmentCompleted}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400">
                                ⏳ {region.assessmentNotStarted}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2 text-sm">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                                ✓ {region.interviewCompleted}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400">
                                ⏳ {region.interviewNotStarted}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Store-wise View */}
          {activeView === 'store' && storeWiseData.length > 0 && (
            <div className="space-y-6">
              {storeWiseData
                .filter(store => {
                  // Apply filters
                  const matchesRegion = filterRegion === 'all' || store.region === filterRegion;
                  const matchesSearch = !searchTerm || 
                    store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    store.storeId.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  // Filter candidates within store
                  const filteredCandidates = store.candidates.filter(c => {
                    const matchesStatus = 
                      filterStatus === 'all' ||
                      (filterStatus === 'passed' && c.readinessStatus === 'Passed') ||
                      (filterStatus === 'failed' && c.readinessStatus === 'Failed') ||
                      (filterStatus === 'pending' && c.readinessStatus === 'Not Started');
                    return matchesStatus;
                  });
                  
                  return matchesRegion && matchesSearch && filteredCandidates.length > 0;
                })
                .sort((a, b) => b.totalCandidates - a.totalCandidates)
                .map((store, index) => {
                  // Get filtered candidates for this store
                  const filteredStoreCandidates = store.candidates.filter(c => {
                    const matchesStatus = 
                      filterStatus === 'all' ||
                      (filterStatus === 'passed' && c.readinessStatus === 'Passed') ||
                      (filterStatus === 'failed' && c.readinessStatus === 'Failed') ||
                      (filterStatus === 'pending' && c.readinessStatus === 'Not Started');
                    return matchesStatus;
                  });
                  
                  return (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {store.storeName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            Store ID: {store.storeId} • Region: {store.region} • {store.totalCandidates} Candidates
                          </p>
                        </div>
                        <div className="flex gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{store.readinessPassed}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Readiness</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{store.assessmentCompleted}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Assessment</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{store.interviewCompleted}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Interview</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Employee ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Employee Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Manager
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Readiness
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Assessment
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Interview
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                          {filteredStoreCandidates.map((candidate, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {candidate.employeeId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {candidate.employeeName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                                <div>{candidate.managerName}</div>
                                <div className="text-xs text-gray-500">{candidate.managerId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {getStatusBadge(candidate.readinessStatus)}
                                  {candidate.readinessScore !== null && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                      {candidate.readinessScore.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {getStatusBadge(candidate.assessmentStatus)}
                                  {candidate.assessmentScore !== null && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                      {candidate.assessmentScore.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {getStatusBadge(candidate.interviewStatus)}
                                  {candidate.interviewScore !== null && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                      {candidate.interviewScore.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )
                })}
            </div>
          )}

          {/* AM-wise View */}
          {activeView === 'am' && amWiseData.length > 0 && (
            <div className="space-y-6">
              {amWiseData
                .filter(am => {
                  // Apply filters
                  const matchesRegion = filterRegion === 'all' || am.region === filterRegion;
                  const matchesSearch = !searchTerm || 
                    am.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    am.managerId.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  // Filter candidates within AM
                  const filteredCandidates = am.candidates.filter(c => {
                    const matchesStatus = 
                      filterStatus === 'all' ||
                      (filterStatus === 'passed' && c.readinessStatus === 'Passed') ||
                      (filterStatus === 'failed' && c.readinessStatus === 'Failed') ||
                      (filterStatus === 'pending' && c.readinessStatus === 'Not Started');
                    return matchesStatus;
                  });
                  
                  return matchesRegion && matchesSearch && filteredCandidates.length > 0;
                })
                .sort((a, b) => b.totalCandidates - a.totalCandidates)
                .map((am, index) => {
                  // Get filtered candidates for this AM
                  const filteredAMCandidates = am.candidates.filter(c => {
                    const matchesStatus = 
                      filterStatus === 'all' ||
                      (filterStatus === 'passed' && c.readinessStatus === 'Passed') ||
                      (filterStatus === 'failed' && c.readinessStatus === 'Failed') ||
                      (filterStatus === 'pending' && c.readinessStatus === 'Not Started');
                    return matchesStatus;
                  });
                  
                  return (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {am.managerName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            Manager ID: {am.managerId} • Region: {am.region} • {am.totalCandidates} Candidates
                          </p>
                        </div>
                        <div className="flex gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{am.readinessPassed}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Readiness</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{am.assessmentCompleted}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Assessment</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{am.interviewCompleted}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Interview</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Employee ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Employee Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Store ID
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Readiness
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Assessment
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                              Interview
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                          {filteredAMCandidates.map((candidate, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {candidate.employeeId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {candidate.employeeName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                                {candidate.storeId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {getStatusBadge(candidate.readinessStatus)}
                                  {candidate.readinessScore !== null && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                      {candidate.readinessScore.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {getStatusBadge(candidate.assessmentStatus)}
                                  {candidate.assessmentScore !== null && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                      {candidate.assessmentScore.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {getStatusBadge(candidate.interviewStatus)}
                                  {candidate.interviewScore !== null && (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                      {candidate.interviewScore.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BenchPlanningSMASMDashboard;
