import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCAPAs, CAPARecord, QAFinding } from '../../services/qaCapaService';
import {
  ShieldAlert, RefreshCw, ChevronDown, ChevronUp, Filter, Clock,
  AlertTriangle, CheckCircle2, Store, Calendar, TrendingUp, BarChart3,
  ArrowLeft, Search, X
} from 'lucide-react';
import LoadingOverlay from '../LoadingOverlay';

interface QACAPADashboardProps {
  onBack?: () => void;
}

/** Calculate progress for a CAPA record */
function getProgress(capa: CAPARecord): { filled: number; total: number; percent: number } {
  const total = capa.findings.length;
  if (total === 0) return { filled: 0, total: 0, percent: 0 };
  const filled = capa.findings.filter(f => {
    const hasRoot = !!f.rootCause?.trim();
    const hasCorrective = (f.correctiveActions || []).some(a => a?.trim()) || !!f.correctiveAction?.trim();
    const hasPreventive = (f.preventiveActions || []).some(a => a?.trim()) || !!f.preventiveAction?.trim();
    return hasRoot && hasCorrective && hasPreventive;
  }).length;
  return { filled, total, percent: Math.round((filled / total) * 100) };
}

/** Get the earliest target date across all findings */
function getTargetDate(findings: QAFinding[]): string | null {
  const dates = findings
    .map(f => f.targetDate)
    .filter((d): d is string => !!d && d.trim() !== '');
  if (dates.length === 0) return null;
  return dates.sort()[0]; // earliest
}

/** Get the latest target date across all findings */
function getLatestTargetDate(findings: QAFinding[]): string | null {
  const dates = findings
    .map(f => f.targetDate)
    .filter((d): d is string => !!d && d.trim() !== '');
  if (dates.length === 0) return null;
  return dates.sort().reverse()[0]; // latest
}

/** Calculate days remaining or overdue */
function getDaysStatus(targetDate: string | null): { days: number; overdue: boolean; label: string } | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { days: Math.abs(days), overdue: true, label: `${Math.abs(days)}d overdue` };
  if (days === 0) return { days: 0, overdue: false, label: 'Due today' };
  return { days, overdue: false, label: `${days}d remaining` };
}

/** Format date for display */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const QACAPADashboard: React.FC<QACAPADashboardProps> = ({ onBack }) => {
  const { employeeData, userRole: authRole } = useAuth();
  const [capas, setCAPAs] = useState<CAPARecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'storeName' | 'qaScore' | 'status' | 'auditDate' | 'targetDate' | 'progress'>('auditDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadCAPAs = async () => {
    console.log('[QACAPADashboard] loadCAPAs called, empCode:', employeeData?.code, 'authRole:', authRole);
    if (!authRole) { console.log('[QACAPADashboard] Skipping - missing authRole'); return; }
    // For roles that need employee code, check it's available
    const needsEmpCode = authRole !== 'admin' && authRole !== 'editor' && authRole !== 'qa';
    if (needsEmpCode && !employeeData?.code) { console.log('[QACAPADashboard] Skipping - non-admin role missing empCode'); return; }
    setIsLoading(true);
    try {
      let params: { storeId?: string; assigneeId?: string; auditorId?: string; amId?: string; all?: boolean } = {};
      // Role-based data access
      if (authRole === 'admin' || authRole === 'editor' || authRole === 'qa') {
        params = { all: true };
      } else if (authRole === 'operations') {
        params = { amId: employeeData.code };
      } else if (authRole === 'store') {
        // Look up user's store_code from employee directory
        try {
          const { fetchEmployeeDirectory } = await import('../../services/employeeDirectoryService');
          const dir = await fetchEmployeeDirectory();
          const emp = dir.byId[employeeData.code.toUpperCase()];
          if (emp?.store_code) {
            params = { storeId: emp.store_code };
          } else {
            params = { assigneeId: employeeData.code };
          }
        } catch {
          params = { assigneeId: employeeData.code };
        }
      } else {
        // Store-level: SM, ASM, Shift Manager, Barista
        params = { assigneeId: employeeData.code };
      }
      const data = await fetchCAPAs(params);
      setCAPAs(data);
    } catch (error) {
      console.error('Failed to load CAPAs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCAPAs(); }, [employeeData?.code, authRole]);
  // Also load when role is set but no employeeData (password-only login for admin/editor/qa)
  useEffect(() => {
    if (authRole && (authRole === 'admin' || authRole === 'editor' || authRole === 'qa') && capas.length === 0 && !isLoading) {
      loadCAPAs();
    }
  }, [authRole]);

  // Derived data
  const regions = useMemo(() => {
    const r = new Set(capas.map(c => c.region).filter(Boolean));
    return Array.from(r).sort();
  }, [capas]);

  const filteredCAPAs = useMemo(() => {
    let result = [...capas];

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (regionFilter !== 'all') {
      result = result.filter(c => c.region === regionFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.storeName.toLowerCase().includes(term) ||
        c.storeId.toLowerCase().includes(term) ||
        c.amName.toLowerCase().includes(term) ||
        c.qaAuditorName.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'storeName': cmp = a.storeName.localeCompare(b.storeName); break;
        case 'qaScore': cmp = parseFloat(a.qaScore || '0') - parseFloat(b.qaScore || '0'); break;
        case 'status': {
          const order: Record<string, number> = { 'Open': 0, 'In Progress': 1, 'Closed': 2 };
          cmp = (order[a.status] ?? 3) - (order[b.status] ?? 3);
          break;
        }
        case 'auditDate': cmp = new Date(a.qaSubmissionTime || 0).getTime() - new Date(b.qaSubmissionTime || 0).getTime(); break;
        case 'targetDate': {
          const ta = getTargetDate(a.findings);
          const tb = getTargetDate(b.findings);
          cmp = (ta ? new Date(ta).getTime() : Infinity) - (tb ? new Date(tb).getTime() : Infinity);
          break;
        }
        case 'progress': cmp = getProgress(a).percent - getProgress(b).percent; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [capas, statusFilter, regionFilter, searchTerm, sortField, sortDir]);

  // Summary stats
  const stats = useMemo(() => {
    const open = capas.filter(c => c.status === 'Open').length;
    const inProgress = capas.filter(c => c.status === 'In Progress').length;
    const closed = capas.filter(c => c.status === 'Closed').length;
    const overdue = capas.filter(c => {
      if (c.status === 'Closed') return false;
      const td = getLatestTargetDate(c.findings);
      const ds = getDaysStatus(td);
      return ds?.overdue ?? false;
    }).length;
    const avgScore = capas.length > 0
      ? (capas.reduce((sum, c) => sum + parseFloat(c.qaScore || '0'), 0) / capas.length).toFixed(1)
      : '0';
    return { open, inProgress, closed, overdue, avgScore, total: capas.length };
  }, [capas]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (isLoading) return <LoadingOverlay message="Loading CAPA Dashboard..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            )}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100">CAPA Dashboard</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                Track QA audit CAPAs — timelines, progress & status
              </p>
            </div>
          </div>
          <button onClick={loadCAPAs} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title="Refresh">
            <RefreshCw className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <SummaryCard label="Total" value={stats.total} color="sky" icon={<ShieldAlert className="w-4 h-4" />} />
          <SummaryCard label="Open" value={stats.open} color="red" icon={<AlertTriangle className="w-4 h-4" />} />
          <SummaryCard label="In Progress" value={stats.inProgress} color="amber" icon={<Clock className="w-4 h-4" />} />
          <SummaryCard label="Closed" value={stats.closed} color="green" icon={<CheckCircle2 className="w-4 h-4" />} />
          <SummaryCard label="Overdue" value={stats.overdue} color="rose" icon={<AlertTriangle className="w-4 h-4" />} />
          <SummaryCard label="Avg Score" value={`${stats.avgScore}%`} color="indigo" icon={<TrendingUp className="w-4 h-4" />} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search store, AM, auditor..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
          {/* Region Filter */}
          {regions.length > 1 && (
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="all">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
          Showing {filteredCAPAs.length} of {capas.length} CAPAs
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-slate-300 cursor-pointer select-none" onClick={() => handleSort('storeName')}>
                  <span className="inline-flex items-center gap-1">Store <SortIcon field="storeName" /></span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-slate-300 cursor-pointer select-none" onClick={() => handleSort('qaScore')}>
                  <span className="inline-flex items-center gap-1">Score <SortIcon field="qaScore" /></span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-slate-300 cursor-pointer select-none" onClick={() => handleSort('status')}>
                  <span className="inline-flex items-center gap-1">Status <SortIcon field="status" /></span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-slate-300 cursor-pointer select-none" onClick={() => handleSort('progress')}>
                  <span className="inline-flex items-center gap-1">Progress <SortIcon field="progress" /></span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-slate-300 cursor-pointer select-none" onClick={() => handleSort('auditDate')}>
                  <span className="inline-flex items-center gap-1">Audit Date <SortIcon field="auditDate" /></span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-slate-300 cursor-pointer select-none" onClick={() => handleSort('targetDate')}>
                  <span className="inline-flex items-center gap-1">Target Date <SortIcon field="targetDate" /></span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-slate-300">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredCAPAs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No CAPAs found
                  </td>
                </tr>
              ) : (
                filteredCAPAs.map((capa, idx) => {
                  const progress = getProgress(capa);
                  const targetDate = getLatestTargetDate(capa.findings);
                  const daysStatus = capa.status !== 'Closed' ? getDaysStatus(targetDate) : null;
                  const isExpanded = expandedRow === idx;

                  return (
                    <React.Fragment key={`${capa.storeId}-${capa.qaSubmissionTime}-${idx}`}>
                      <tr
                        className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-750 ${isExpanded ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      >
                        {/* Store */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-slate-100">{capa.storeName}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{capa.storeId} &middot; {capa.region}</div>
                          <div className="text-xs text-gray-400 dark:text-slate-500">AM: {capa.amName}</div>
                        </td>
                        {/* Score */}
                        <td className="px-4 py-3 text-center">
                          <ScoreBadge score={capa.qaScore} />
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={capa.status} />
                        </td>
                        {/* Progress */}
                        <td className="px-4 py-3">
                          <ProgressBar filled={progress.filled} total={progress.total} percent={progress.percent} />
                        </td>
                        {/* Audit Date */}
                        <td className="px-4 py-3 text-center text-xs text-gray-600 dark:text-slate-300">
                          {formatDate(capa.qaSubmissionTime)}
                        </td>
                        {/* Target Date */}
                        <td className="px-4 py-3 text-center text-xs text-gray-600 dark:text-slate-300">
                          {formatDate(targetDate)}
                        </td>
                        {/* Timeline */}
                        <td className="px-4 py-3 text-center">
                          {capa.status === 'Closed' ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Completed</span>
                          ) : daysStatus ? (
                            <span className={`text-xs font-medium ${daysStatus.overdue ? 'text-red-600 dark:text-red-400' : daysStatus.days <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-slate-300'}`}>
                              {daysStatus.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-slate-500">No target</span>
                          )}
                        </td>
                      </tr>
                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-gray-50 dark:bg-slate-700/30">
                            <ExpandedDetail capa={capa} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredCAPAs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
            <p className="text-gray-400 dark:text-slate-500">No CAPAs found</p>
          </div>
        ) : (
          filteredCAPAs.map((capa, idx) => {
            const progress = getProgress(capa);
            const targetDate = getLatestTargetDate(capa.findings);
            const daysStatus = capa.status !== 'Closed' ? getDaysStatus(targetDate) : null;
            const isExpanded = expandedRow === idx;

            return (
              <div key={`m-${capa.storeId}-${capa.qaSubmissionTime}-${idx}`} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => setExpandedRow(isExpanded ? null : idx)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-slate-100 text-sm">{capa.storeName}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{capa.storeId} &middot; {capa.region} &middot; AM: {capa.amName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={capa.qaScore} />
                      <StatusBadge status={capa.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <ProgressBar filled={progress.filled} total={progress.total} percent={progress.percent} />
                    <div className="ml-3 text-right shrink-0">
                      {capa.status === 'Closed' ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Completed</span>
                      ) : daysStatus ? (
                        <span className={`text-xs font-medium ${daysStatus.overdue ? 'text-red-600 dark:text-red-400' : daysStatus.days <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-slate-300'}`}>
                          {daysStatus.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No target</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                    <span>Audit: {formatDate(capa.qaSubmissionTime)}</span>
                    {targetDate && <span>Target: {formatDate(targetDate)}</span>}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
                    <ExpandedDetail capa={capa} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function SummaryCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  };
  return (
    <div className={`rounded-lg p-3 text-center ${colorMap[color] || colorMap.sky}`}>
      <div className="flex items-center justify-center gap-1 mb-1 opacity-70">{icon}</div>
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
      <div className="text-[10px] sm:text-xs font-medium">{label}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: string }) {
  const num = parseFloat(score || '0');
  const color = num >= 85 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    : num >= 70 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${color}`}>
      {num.toFixed(1)}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Open':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="w-2.5 h-2.5" /> Open</span>;
    case 'In Progress':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-2.5 h-2.5" /> In Progress</span>;
    case 'Closed':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-2.5 h-2.5" /> Closed</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">{status}</span>;
  }
}

function ProgressBar({ filled, total, percent }: { filled: number; total: number; percent: number }) {
  const barColor = percent === 100 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-gray-600 dark:text-slate-300 font-medium whitespace-nowrap">
        {filled}/{total}
      </span>
    </div>
  );
}

function ExpandedDetail({ capa }: { capa: CAPARecord }) {
  return (
    <div className="space-y-3">
      {/* Audit Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-gray-400 dark:text-slate-500">QA Auditor</div>
          <div className="text-gray-800 dark:text-slate-200 font-medium">{capa.qaAuditorName}</div>
        </div>
        <div>
          <div className="text-gray-400 dark:text-slate-500">Area Manager</div>
          <div className="text-gray-800 dark:text-slate-200 font-medium">{capa.amName} ({capa.amId})</div>
        </div>
        <div>
          <div className="text-gray-400 dark:text-slate-500">CAPA Submitted By</div>
          <div className="text-gray-800 dark:text-slate-200 font-medium">{capa.capaSubmittedBy || '—'}</div>
        </div>
        <div>
          <div className="text-gray-400 dark:text-slate-500">CAPA Submission</div>
          <div className="text-gray-800 dark:text-slate-200 font-medium">{formatDate(capa.capaSubmissionTime)}</div>
        </div>
      </div>

      {/* Findings */}
      <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
        Findings ({capa.findings.length})
      </div>
      <div className="space-y-2">
        {capa.findings.map((f, i) => {
          const hasCapa = !!f.rootCause?.trim();
          const targetDs = f.targetDate && capa.status !== 'Closed' ? getDaysStatus(f.targetDate) : null;
          return (
            <div key={i} className={`border rounded-lg p-3 text-xs ${hasCapa ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-slate-200">{f.question}</div>
                  <div className="text-gray-500 dark:text-slate-400 mt-0.5">{f.section} &middot; {f.response}</div>
                  {f.remark && <div className="text-gray-500 dark:text-slate-400 italic mt-0.5">Remark: {f.remark}</div>}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {hasCapa ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  {f.targetDate && (
                    <span className={`text-[10px] ${targetDs?.overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {formatDate(f.targetDate)}
                      {targetDs && ` (${targetDs.label})`}
                    </span>
                  )}
                </div>
              </div>
              {hasCapa && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600 space-y-1">
                  <div><span className="font-medium text-gray-600 dark:text-slate-400">Root Cause:</span> {f.rootCause}</div>
                  {(f.correctiveActions || []).filter(a => a?.trim()).length > 0 && (
                    <div><span className="font-medium text-gray-600 dark:text-slate-400">Corrective:</span> {(f.correctiveActions || []).filter(a => a?.trim()).join('; ')}</div>
                  )}
                  {(f.preventiveActions || []).filter(a => a?.trim()).length > 0 && (
                    <div><span className="font-medium text-gray-600 dark:text-slate-400">Preventive:</span> {(f.preventiveActions || []).filter(a => a?.trim()).join('; ')}</div>
                  )}
                  {f.stakeholder && (
                    <div><span className="font-medium text-gray-600 dark:text-slate-400">Stakeholder:</span> {f.stakeholder.name} ({f.stakeholder.id})</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QACAPADashboard;
