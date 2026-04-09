import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface TrainingAuditSubmission {
  submissionTime: string;
  trainerName: string;
  trainerId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
  region: string;
  mod: string;
  totalScore: string;
  maxScore: string;
  percentageScore: string;
  [key: string]: string;
}

// Zero tolerance items grouped by category
const ZT_DIALIN_IDS = ['TM_5', 'TM_10'];
const ZT_NEW_JOINER_IDS = ['NJ_1', 'NJ_2', 'NJ_3', 'NJ_5', 'NJ_6', 'NJ_7'];

const ZT_LABELS: Record<string, string> = {
  TM_5: 'Dial-in one pager available',
  TM_10: 'Dial-in done',
  NJ_1: 'OJT book available for all partners',
  NJ_2: 'Trainees completing skill checks',
  NJ_3: 'Training progression aligned with plan',
  NJ_5: 'SHLP training completed',
  NJ_6: 'FOSTAC-certified managers (≥2)',
  NJ_7: 'ASM/SM training completed',
};

interface ZTStoreRecord {
  storeName: string;
  storeId: string;
  region: string;
  amName: string;
  trainerName: string;
  lastAuditDate: string;
  auditPercentage: number;
  actualPercentage: number; // Score if ZT items were treated as normal (not 0% override)
  failedCategory: 'Dial-in' | 'New Joiner' | 'Both';
  failedItems: { id: string; label: string; category: string }[];
}

interface Props {
  submissions: TrainingAuditSubmission[];
}

const TrainingZeroToleranceSection: React.FC<Props> = ({ submissions }) => {
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Dial-in' | 'New Joiner' | 'Both'>('all');
  const [questionFilter, setQuestionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'store' | 'percentage'>('date');

  const ztStores = useMemo(() => {
    // Check ALL submissions for ZT failures (not just latest per store)
    // Detect ZT failure by BOTH the flag AND by checking individual ZT items directly
    const results: ZTStoreRecord[] = [];

    submissions.forEach(sub => {
      // Determine which specific items failed by checking individual responses
      const failedItems: { id: string; label: string; category: string }[] = [];

      ZT_DIALIN_IDS.forEach(id => {
        const val = String(sub[id] || '').toLowerCase().trim();
        if (val === 'no' || val === 'n' || val === 'false') {
          failedItems.push({ id, label: ZT_LABELS[id], category: 'Dial-in' });
        }
      });

      ZT_NEW_JOINER_IDS.forEach(id => {
        const val = String(sub[id] || '').toLowerCase().trim();
        if (val === 'no' || val === 'n' || val === 'false') {
          failedItems.push({ id, label: ZT_LABELS[id], category: 'New Joiner' });
        }
      });

      // Also check the explicit flag
      const ztFlagSet = String(sub.zeroToleranceFailed || '').toLowerCase() === 'yes';

      // If no specific items failed AND the flag isn't set, try parsing from failedItems string
      if (failedItems.length === 0 && ztFlagSet && sub.zeroToleranceFailedItems) {
        const items = sub.zeroToleranceFailedItems.split(';').map(s => s.trim()).filter(Boolean);
        items.forEach(item => {
          const isDialIn = item.toLowerCase().includes('dial-in') || item.toLowerCase().includes('dial in');
          failedItems.push({
            id: 'unknown',
            label: item,
            category: isDialIn ? 'Dial-in' : 'New Joiner',
          });
        });
      }

      // Skip this submission if no ZT failures detected at all
      if (failedItems.length === 0 && !ztFlagSet) return;

      const hasDialIn = failedItems.some(f => f.category === 'Dial-in');
      const hasNewJoiner = failedItems.some(f => f.category === 'New Joiner');
      const failedCategory: 'Dial-in' | 'New Joiner' | 'Both' =
        hasDialIn && hasNewJoiner ? 'Both' : hasDialIn ? 'Dial-in' : 'New Joiner';

      // Compute actual percentage treating ZT items normally (totalScore/maxScore)
      const totalScore = parseFloat(sub.totalScore || '0');
      const maxScore = parseFloat(sub.maxScore || '0');
      const actualPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      results.push({
        storeName: sub.storeName || sub.storeId,
        storeId: sub.storeId,
        region: sub.region || 'Unknown',
        amName: sub.amName || 'Unknown',
        trainerName: sub.trainerName || 'Unknown',
        lastAuditDate: sub.submissionTime || '',
        auditPercentage: parseFloat(sub.percentageScore || '0'),
        actualPercentage,
        failedCategory,
        failedItems,
      });
    });

    // Sort by date (latest first) by default
    results.sort((a, b) => {
      const da = parseDate(a.lastAuditDate);
      const db = parseDate(b.lastAuditDate);
      return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });

    return results;
  }, [submissions]);

  // Apply filters and search
  const filteredStores = useMemo(() => {
    let result = ztStores;

    if (categoryFilter !== 'all') {
      result = result.filter(s =>
        categoryFilter === 'Both' ? s.failedCategory === 'Both' : s.failedCategory === categoryFilter || s.failedCategory === 'Both'
      );
    }

    // Sub-question filter
    if (questionFilter !== 'all') {
      result = result.filter(s =>
        s.failedItems.some(item => item.id === questionFilter)
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.storeName.toLowerCase().includes(term) ||
        s.storeId.toLowerCase().includes(term) ||
        s.amName.toLowerCase().includes(term) ||
        s.trainerName.toLowerCase().includes(term) ||
        s.region.toLowerCase().includes(term)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'date') {
        const da = parseDate(a.lastAuditDate);
        const db = parseDate(b.lastAuditDate);
        return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
      }
      if (sortBy === 'store') return a.storeName.localeCompare(b.storeName);
      if (sortBy === 'percentage') return a.auditPercentage - b.auditPercentage;
      return 0;
    });

    return result;
  }, [ztStores, categoryFilter, questionFilter, searchTerm, sortBy]);

  // Stats — derived from filtered results so cards update with filters
  const uniqueStoreCount = new Set(filteredStores.map(s => s.storeId || s.storeName)).size;
  const dialInCount = filteredStores.filter(s => s.failedCategory === 'Dial-in' || s.failedCategory === 'Both').length;
  const newJoinerCount = filteredStores.filter(s => s.failedCategory === 'New Joiner' || s.failedCategory === 'Both').length;

  if (ztStores.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg mt-6 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Zero Tolerance
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {ztStores.length} ZT failure{ztStores.length !== 1 ? 's' : ''} across {new Set(ztStores.map(s => s.storeId || s.storeName)).size} store{new Set(ztStores.map(s => s.storeId || s.storeName)).size !== 1 ? 's' : ''} (last 90 days)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Summary pills */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
              ☕ Dial-in: {dialInCount}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              👤 New Joiner: {newJoinerCount}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-red-600 dark:text-red-400">{filteredStores.length}</div>
              <div className="text-xs text-red-700 dark:text-red-300 font-medium">Audits with ZT Fails</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{uniqueStoreCount}</div>
              <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">Stores Affected</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{dialInCount}</div>
              <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">☕ Dial-in Fails</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{newJoinerCount}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">👤 New Joiner Fails</div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {filteredStores.filter(s => s.failedCategory === 'Both').length}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">☕+👤 Both Failed</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Search */}
            <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search store, AM, trainer, region..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            {/* Category filter */}
            <div className="w-[calc(50%-6px)] sm:w-auto">
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value as any); setQuestionFilter('all'); }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">Category: All</option>
                <option value="Dial-in">Category: ☕ Dial-in</option>
                <option value="New Joiner">Category: 👤 New Joiner</option>
                <option value="Both">Category: Both Failed</option>
              </select>
            </div>
            {/* Failed ZT question filter */}
            <div className="w-[calc(50%-6px)] sm:w-auto sm:max-w-[280px]">
              <select
                value={questionFilter}
                onChange={e => setQuestionFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">ZT Point: All</option>
                <optgroup label="☕ Dial-in">
                  {ZT_DIALIN_IDS.map(id => (
                    <option key={id} value={id}>{ZT_LABELS[id]}</option>
                  ))}
                </optgroup>
                <optgroup label="👤 New Joiner Training">
                  {ZT_NEW_JOINER_IDS.map(id => (
                    <option key={id} value={id}>{ZT_LABELS[id]}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            {/* Sort */}
            <div className="w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="date">Sort: Latest First</option>
                <option value="store">Sort: Store Name</option>
                <option value="percentage">Sort: Lowest Score</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Region</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">AM</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Trainer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">ZT Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Failed Points</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Last Audit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Audit %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actual Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                      No zero tolerance failures found for selected filters
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((store, idx) => (
                    <tr key={`${store.storeId}-${idx}`} className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{store.storeName}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{store.storeId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{store.region}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{store.amName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{store.trainerName}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          store.failedCategory === 'Both'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : store.failedCategory === 'Dial-in'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {store.failedCategory === 'Both' ? '☕👤 Both' : store.failedCategory === 'Dial-in' ? '☕ Dial-in' : '👤 New Joiner'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-0.5">
                          {store.failedItems.map((item, i) => (
                            <span key={i} className="text-xs text-red-600 dark:text-red-400">
                              • {item.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {formatDate(store.lastAuditDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          0%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                          store.actualPercentage >= 86
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : store.actualPercentage >= 71
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {store.actualPercentage}%
                        </span>
                        <span className="block text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">without ZT</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredStores.length > 0 && (
            <div className="mt-3 text-xs text-gray-500 dark:text-slate-400 text-right">
              Showing {filteredStores.length} of {ztStores.length} ZT audits ({uniqueStoreCount} unique stores)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper: parse date from various formats
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // ISO format
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY HH:MM:SS
  const cleaned = String(dateStr).trim().replace(',', '');
  const parts = cleaned.split(' ');
  if (parts.length > 0 && parts[0].includes('/')) {
    const dp = parts[0].split('/');
    if (dp.length === 3) {
      const day = parseInt(dp[0], 10);
      const month = parseInt(dp[1], 10) - 1;
      const year = parseInt(dp[2], 10);
      let h = 0, m = 0, s = 0;
      if (parts.length > 1 && parts[1]) {
        const tp = parts[1].split(':');
        h = parseInt(tp[0] || '0', 10);
        m = parseInt(tp[1] || '0', 10);
        s = parseInt(tp[2] || '0', 10);
      }
      const d = new Date(year, month, day, h, m, s);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// Helper: format date for display
function formatDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default TrainingZeroToleranceSection;
