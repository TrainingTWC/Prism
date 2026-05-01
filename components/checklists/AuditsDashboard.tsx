import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Filter, ClipboardCheck } from 'lucide-react';
import LoadingOverlay from '../LoadingOverlay';
import {
  VendorAuditSubmission,
  VehicleAuditSubmission,
  CFAuditSubmission,
  PreLaunchSubmission,
} from '../../services/dataService';

// ── Types ────────────────────────────────────────────────────────

export type AuditTab = 'vendor' | 'pre-launch' | 'vehicle' | 'cf';

export interface AuditFilters {
  dateFrom: string;
  dateTo: string;
  region: string;
  location: string;   // store name (pre-launch) / vendor location (vendor) / city (vehicle, cf)
  auditor: string;
  scoreMin: string;
  scoreMax: string;
}

export interface AuditsDashboardProps {
  onBack?: () => void;
  // Data props — empty arrays for Phase 2 shell, wired in Phases 3–6
  vendorData?: VendorAuditSubmission[];
  preLaunchData?: PreLaunchSubmission[];
  vehicleData?: VehicleAuditSubmission[];
  cfData?: CFAuditSubmission[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

// ── Constants ────────────────────────────────────────────────────

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

const DEFAULT_FILTERS: AuditFilters = {
  dateFrom: '',
  dateTo: '',
  region: '',
  location: '',
  auditor: '',
  scoreMin: '',
  scoreMax: '',
};

const TAB_CONFIG: { id: AuditTab; label: string }[] = [
  { id: 'vendor', label: 'Vendor' },
  { id: 'pre-launch', label: 'Pre-Launch' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'cf', label: 'CF' },
];

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[parseInt(m, 10) - 1] ?? m} ${y}`;
  }
  return dateStr;
}

function ScoreBadge({ pct }: { pct: number }): React.ReactElement {
  if (pct >= 80) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
        Pass {pct}%
      </span>
    );
  }
  if (pct >= 60) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        Partial {pct}%
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
      Fail {pct}%
    </span>
  );
}

const TABLE_HEADER_CLASS =
  'text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider';
const TABLE_ROW_CLASS =
  'hover:bg-gray-50 dark:hover:bg-slate-700/50';
const TABLE_CELL_CLASS = 'py-3 px-4 text-gray-700 dark:text-slate-300';
const TABLE_CELL_PRIMARY_CLASS = 'py-3 px-4 text-gray-900 dark:text-slate-100 font-medium';

// ── Component ────────────────────────────────────────────────────

const AuditsDashboard: React.FC<AuditsDashboardProps> = ({
  onBack,
  vendorData = [],
  preLaunchData = [],
  vehicleData = [],
  cfData = [],
  isLoading = false,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<AuditTab>('vendor');
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);

  const tabCount: Record<AuditTab, number> = {
    vendor: vendorData.length,
    'pre-launch': preLaunchData.length,
    vehicle: vehicleData.length,
    cf: cfData.length,
  };

  function handleFilterChange(key: keyof AuditFilters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  // ── Empty state ────────────────────────────────────────────────

  function renderEmpty(label: string): React.ReactElement {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500">
        <Filter className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">No {label} audit records found.</p>
      </div>
    );
  }

  // ── Table renderers ────────────────────────────────────────────

  function renderVendorTable(): React.ReactElement {
    if (vendorData.length === 0) return renderEmpty('Vendor');
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-700">
            {['Date', 'Vendor Name', 'Location', 'Auditor', 'Score', 'Status'].map(h => (
              <th key={h} className={TABLE_HEADER_CLASS}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
          {vendorData.map((row, i) => (
            <tr key={`${row.submissionTime}-${row.auditorId}-${i}`} className={TABLE_ROW_CLASS}>
              <td className={TABLE_CELL_CLASS}>{formatDate(row.submissionTime)}</td>
              <td className={TABLE_CELL_PRIMARY_CLASS}>{row.vendorName || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.vendorLocation || row.city || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.auditorName || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.totalScore}/{row.maxScore}</td>
              <td className="py-3 px-4"><ScoreBadge pct={Math.round(row.scorePercentage)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderPreLaunchTable(): React.ReactElement {
    if (preLaunchData.length === 0) return renderEmpty('Pre-Launch');
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-700">
            {['Date', 'Store Name', 'Store ID', 'Auditor', 'Score', 'Status'].map(h => (
              <th key={h} className={TABLE_HEADER_CLASS}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
          {preLaunchData.map((row, i) => {
            const pct = Math.round(parseFloat(row.scorePercentage) || 0);
            return (
              <tr key={`${row.submissionTime}-${row.auditorId}-${i}`} className={TABLE_ROW_CLASS}>
                <td className={TABLE_CELL_CLASS}>{formatDate(row.submissionTime)}</td>
                <td className={TABLE_CELL_PRIMARY_CLASS}>{row.storeName || '—'}</td>
                <td className={TABLE_CELL_CLASS}>{row.storeId || '—'}</td>
                <td className={TABLE_CELL_CLASS}>{row.auditorName || '—'}</td>
                <td className={TABLE_CELL_CLASS}>{row.totalScore}/{row.maxScore}</td>
                <td className="py-3 px-4"><ScoreBadge pct={pct} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  function renderVehicleTable(): React.ReactElement {
    if (vehicleData.length === 0) return renderEmpty('Vehicle');
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-700">
            {['Date', 'Vehicle #', 'City', 'Auditor', 'Score', 'Status'].map(h => (
              <th key={h} className={TABLE_HEADER_CLASS}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
          {vehicleData.map((row, i) => (
            <tr key={`${row.submissionTime}-${row.auditorId}-${i}`} className={TABLE_ROW_CLASS}>
              <td className={TABLE_CELL_CLASS}>{formatDate(row.submissionTime)}</td>
              <td className={TABLE_CELL_PRIMARY_CLASS}>{row.subjectName || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.city || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.auditorName || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.totalScore}/{row.maxScore}</td>
              <td className="py-3 px-4"><ScoreBadge pct={Math.round(row.scorePercentage)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderCFTable(): React.ReactElement {
    if (cfData.length === 0) return renderEmpty('CF');
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-700">
            {['Date', 'Outlet/CF Name', 'City', 'Auditor', 'Score', 'Status'].map(h => (
              <th key={h} className={TABLE_HEADER_CLASS}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
          {cfData.map((row, i) => (
            <tr key={`${row.submissionTime}-${row.auditorId}-${i}`} className={TABLE_ROW_CLASS}>
              <td className={TABLE_CELL_CLASS}>{formatDate(row.submissionTime)}</td>
              <td className={TABLE_CELL_PRIMARY_CLASS}>{row.subjectName || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.city || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.auditorName || '—'}</td>
              <td className={TABLE_CELL_CLASS}>{row.totalScore}/{row.maxScore}</td>
              <td className="py-3 px-4"><ScoreBadge pct={Math.round(row.scorePercentage)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderContent(): React.ReactElement | null {
    if (isLoading) return <LoadingOverlay message="Loading audit data..." />;
    switch (activeTab) {
      case 'vendor':      return renderVendorTable();
      case 'pre-launch':  return renderPreLaunchTable();
      case 'vehicle':     return renderVehicleTable();
      case 'cf':          return renderCFTable();
      default:            return null;
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            )}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100">Audit Reports</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">View all audit submissions</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-75">({tabCount[tab.id]})</span>
          </button>
        ))}
      </div>

      {/* Filter card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => handleFilterChange('dateFrom', e.target.value)}
            aria-label="Filter: date from"
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => handleFilterChange('dateTo', e.target.value)}
            aria-label="Filter: date to"
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          />
          <select
            value={filters.region}
            onChange={e => handleFilterChange('region', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          >
            <option value="">All Regions</option>
            {REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <input
            type="text"
            value={filters.location}
            onChange={e => handleFilterChange('location', e.target.value)}
            placeholder="Store / Location"
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          />
          <input
            type="text"
            value={filters.auditor}
            onChange={e => handleFilterChange('auditor', e.target.value)}
            placeholder="Auditor name"
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          />
          <input
            type="number"
            value={filters.scoreMin}
            onChange={e => handleFilterChange('scoreMin', e.target.value)}
            placeholder="Score min %"
            min={0}
            max={100}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          />
          <input
            type="number"
            value={filters.scoreMax}
            onChange={e => handleFilterChange('scoreMax', e.target.value)}
            placeholder="Score max %"
            min={0}
            max={100}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          />
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Content card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {renderContent()}
        </div>
      </div>

    </div>
  );
};

export default AuditsDashboard;
