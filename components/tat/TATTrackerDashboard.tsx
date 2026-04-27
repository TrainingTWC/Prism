import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell as PieCell, Legend
} from 'recharts';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, TrendingUp, Award, Loader2, X, Download } from 'lucide-react';
import {
  fetchTATRecords, VacancyRecord,
  buildHRBPScorecard, computeTATKpis, computeAgingBuckets, computeVacancyStatusBreakdown
} from '../../services/tatTrackerData';

interface TATTrackerDashboardProps {
  userRole?: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Closed On-TAT': '#16a34a',
  'Closed Off-TAT': '#f59e0b',
  'Open On-TAT': '#3b82f6',
  'Open Off-TAT': '#ef4444',
};

interface DrillDown {
  title: string;
  subtitle?: string;
  records: VacancyRecord[];
}

const TATTrackerDashboard: React.FC<TATTrackerDashboardProps> = () => {
  const [rows, setRows]       = useState<VacancyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [hrbpFilter, setHrbpFilter]     = useState<string>('all');
  const [drill, setDrill]               = useState<DrillDown | null>(null);
  const [selected, setSelected]         = useState<VacancyRecord | null>(null);

  const refresh = async () => {
    setLoading(true); setError(null);
    try { setRows(await fetchTATRecords()); }
    catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const regions = useMemo(() => Array.from(new Set(rows.map(r => r.region).filter(Boolean))).sort(), [rows]);
  const hrbps   = useMemo(() => Array.from(new Set(rows.map(r => r.hrbpName).filter(Boolean))).sort(), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (regionFilter !== 'all' && r.region !== regionFilter) return false;
    if (hrbpFilter   !== 'all' && r.hrbpName !== hrbpFilter) return false;
    return true;
  }), [rows, regionFilter, hrbpFilter]);

  const kpis      = useMemo(() => computeTATKpis(filtered), [filtered]);
  const scorecard = useMemo(() => buildHRBPScorecard(filtered), [filtered]);
  const aging     = useMemo(() => computeAgingBuckets(filtered), [filtered]);
  const status    = useMemo(() => computeVacancyStatusBreakdown(filtered), [filtered]);

  const statusPie = useMemo(() =>
    Object.entries(status).map(([name, value]) => ({ name, value })).filter(d => d.value > 0),
    [status]
  );

  const positionTypeBreakdown = useMemo(() => {
    const acc: Record<string, { total: number; open: number; closed: number; offTAT: number }> = {};
    filtered.forEach(r => {
      const key = (r.positionType || 'Unspecified').toString().trim() || 'Unspecified';
      if (!acc[key]) acc[key] = { total: 0, open: 0, closed: 0, offTAT: 0 };
      acc[key].total++;
      if (r.isClosed) acc[key].closed++; else acc[key].open++;
      if (r.tatStatus === 'Off-TAT') acc[key].offTAT++;
    });
    return Object.entries(acc).map(([name, v]) => ({ name, ...v }));
  }, [filtered]);

  const openDrill = (title: string, predicate: (r: VacancyRecord) => boolean, subtitle?: string) => {
    setDrill({ title, subtitle, records: filtered.filter(predicate) });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading TAT Tracker…</div>;
  }
  if (error) {
    return (
      <div className="p-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
        {error}. Set <code>TAT_TRACKER_ENDPOINT</code> in <code>services/tatTrackerData.ts</code> to your deployed Apps Script URL.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter & refresh */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">TAT Tracker</h2>
        <div className="flex flex-wrap gap-2">
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm">
            <option value="all">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={hrbpFilter} onChange={e => setHrbpFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm">
            <option value="all">All HRBPs</option>
            {hrbps.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button onClick={refresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI strip — clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Kpi icon={<TrendingUp className="w-5 h-5" />} label="Total Vacancies" value={kpis.total} color="bg-slate-600"
          onClick={() => openDrill('All Vacancies', () => true)} />
        <Kpi icon={<Clock className="w-5 h-5" />}      label="Open"            value={kpis.open}  color="bg-blue-500"
          onClick={() => openDrill('Open Vacancies', r => !r.isClosed)} />
        <Kpi icon={<CheckCircle className="w-5 h-5" />}label="Closed"          value={kpis.closed} color="bg-green-500"
          onClick={() => openDrill('Closed Vacancies', r => !!r.isClosed)} />
        <Kpi icon={<Award className="w-5 h-5" />}      label="On-TAT %"        value={`${kpis.onTATPct}%`} color="bg-emerald-500" sub="of closed"
          onClick={() => openDrill('Closed On-TAT', r => !!r.isClosed && r.tatStatus === 'On-TAT')} />
        <Kpi icon={<TrendingUp className="w-5 h-5" />} label="Avg TAT (days)"  value={kpis.avgTAT} color="bg-indigo-500"
          onClick={() => openDrill('Closed — Avg TAT view', r => !!r.isClosed)} />
        <Kpi icon={<AlertTriangle className="w-5 h-5" />} label="Open Off-TAT" value={kpis.offTATOpen} color="bg-red-500" sub={`oldest ${kpis.oldestOpen}d`}
          onClick={() => openDrill('Open & Off-TAT', r => !r.isClosed && r.tatStatus === 'Off-TAT')} />
      </div>

      {/* HRBP Scorecard — clickable rows + cells */}
      <Card title="HRBP Scorecard — On-TAT Closure %  (click a row or number)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-200">
              <tr>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">HRBP</th>
                {['Total', 'Open', 'Closed', 'On-TAT', 'Off-TAT'].map(h =>
                  <th key={h} className="text-center px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                )}
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">On-TAT %</th>
                <th className="text-center px-3 py-2 font-medium whitespace-nowrap">Avg TAT</th>
                <th className="text-center px-3 py-2 font-medium whitespace-nowrap">Open Off-TAT</th>
                <th className="text-center px-3 py-2 font-medium whitespace-nowrap">Oldest Open</th>
              </tr>
            </thead>
            <tbody>
              {scorecard.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">No data.</td></tr>
              )}
              {scorecard.map(s => {
                const byHRBP = (extra?: (r: VacancyRecord) => boolean) =>
                  (r: VacancyRecord) => r.hrbpName === s.hrbpName && (!extra || extra(r));
                const stop = (e: React.MouseEvent) => e.stopPropagation();
                return (
                  <tr key={s.hrbpId} className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => openDrill(`HRBP: ${s.hrbpName}`, byHRBP(), `${s.total} vacancies`)}>
                    <td className="px-3 py-2 font-medium whitespace-nowrap text-blue-600 dark:text-blue-400">{s.hrbpName}</td>
                    <NumCell value={s.total} onClick={e => { stop(e); openDrill(`${s.hrbpName} — Total`, byHRBP()); }} />
                    <NumCell value={s.open}  onClick={e => { stop(e); openDrill(`${s.hrbpName} — Open`, byHRBP(r => !r.isClosed)); }} />
                    <NumCell value={s.closed} onClick={e => { stop(e); openDrill(`${s.hrbpName} — Closed`, byHRBP(r => !!r.isClosed)); }} />
                    <NumCell value={s.onTATCount} className="text-green-600"
                          onClick={e => { stop(e); openDrill(`${s.hrbpName} — On-TAT`, byHRBP(r => r.tatStatus === 'On-TAT')); }} />
                    <NumCell value={s.offTATCount} className="text-amber-600"
                          onClick={e => { stop(e); openDrill(`${s.hrbpName} — Off-TAT`, byHRBP(r => r.tatStatus === 'Off-TAT')); }} />
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden min-w-[80px]">
                          <div className={`h-full ${pctColor(s.onTATPct)}`} style={{ width: `${Math.min(100, s.onTATPct)}%` }} />
                        </div>
                        <span className="tabular-nums font-semibold w-12 text-right">{s.onTATPct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">{s.avgTAT}d</td>
                    <NumCell value={s.openOffTAT} className={s.openOffTAT > 0 ? 'text-red-600 font-semibold' : ''}
                          onClick={e => { stop(e); openDrill(`${s.hrbpName} — Open Off-TAT`, byHRBP(r => !r.isClosed && r.tatStatus === 'Off-TAT')); }} />
                    <td className="px-3 py-2 text-center tabular-nums">{s.oldestOpenDays}d</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Position Type breakdown — clickable */}
      {positionTypeBreakdown.length > 0 && (
        <Card title="Position Type Breakdown — New vs Replacement (click any number)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-200">
                <tr>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Position Type</th>
                  {['Total', 'Open', 'Closed', 'Off-TAT'].map(h =>
                    <th key={h} className="text-center px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {positionTypeBreakdown.map(p => {
                  const byPT = (extra?: (r: VacancyRecord) => boolean) =>
                    (r: VacancyRecord) => {
                      const t = (r.positionType || 'Unspecified').toString().trim() || 'Unspecified';
                      return t === p.name && (!extra || extra(r));
                    };
                  return (
                    <tr key={p.name} className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => openDrill(`Position Type: ${p.name}`, byPT())}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.name === 'New' ? 'bg-blue-100 text-blue-700' : p.name === 'Repl.' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.name}
                        </span>
                      </td>
                      <NumCell value={p.total} onClick={e => { e.stopPropagation(); openDrill(`${p.name} — Total`, byPT()); }} />
                      <NumCell value={p.open}  onClick={e => { e.stopPropagation(); openDrill(`${p.name} — Open`, byPT(r => !r.isClosed)); }} />
                      <NumCell value={p.closed} onClick={e => { e.stopPropagation(); openDrill(`${p.name} — Closed`, byPT(r => !!r.isClosed)); }} />
                      <NumCell value={p.offTAT} className={p.offTAT > 0 ? 'text-red-600 font-semibold' : ''}
                            onClick={e => { e.stopPropagation(); openDrill(`${p.name} — Off-TAT`, byPT(r => r.tatStatus === 'Off-TAT')); }} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status pie — slices clickable */}
        <Card title="Vacancy Status Breakdown (click a slice)">
          {statusPie.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={100} label
                  onClick={(d: any) => {
                    const name = d?.name as string;
                    openDrill(`Status: ${name}`, r => {
                      const closed = r.isClosed ? 'Closed' : 'Open';
                      return `${closed} ${r.tatStatus}`.trim() === name;
                    });
                  }}
                  style={{ cursor: 'pointer' }}>
                  {statusPie.map(d => <PieCell key={d.name} fill={STATUS_COLORS[d.name] || '#999'} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Aging chart — bars clickable */}
        <Card title="Open Vacancy Aging (click a bar)">
          {aging.every(b => b.count === 0) ? <Empty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aging}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" style={{ cursor: 'pointer' }}
                  onClick={(d: any) => {
                    const min = d?.min ?? 0; const max = d?.max ?? 9999;
                    openDrill(`Open vacancies aged ${d?.label}`,
                      r => !r.isClosed && Number(r.positionTime) >= min && Number(r.positionTime) <= max);
                  }}>
                  {aging.map((b, i) => <PieCell key={i} fill={b.min >= 31 ? '#ef4444' : b.min >= 16 ? '#f59e0b' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Off-TAT open vacancies — rows clickable to show full record */}
      <Card title="Open Off-TAT Vacancies (Action Needed) — click a row for full details">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-200">
              <tr>
                {['HRBP', 'Region', 'Store', 'Position'].map(h =>
                  <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">{h}</th>)}
                <th className="text-center px-3 py-2 font-medium whitespace-nowrap">Days Open</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Intimation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.filter(r => !r.isClosed && r.tatStatus === 'Off-TAT')
                .sort((a, b) => Number(b.positionTime) - Number(a.positionTime))
                .slice(0, 50)
                .map(r => (
                <tr key={r.vacancyId}
                    className="border-t border-gray-100 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    onClick={() => setSelected(r)}>
                  <td className="px-3 py-2 font-medium">{r.hrbpName || '—'}</td>
                  <td className="px-3 py-2">{r.region}</td>
                  <td className="px-3 py-2"><span className="font-medium">{r.storeId}</span> <span className="text-xs text-gray-500">{r.storeName}</span></td>
                  <td className="px-3 py-2">{r.position}</td>
                  <td className="px-3 py-2 text-center tabular-nums text-red-600 font-semibold">{r.positionTime}d</td>
                  <td className="px-3 py-2">{r.intimationDate ? new Date(r.intimationDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {filtered.filter(r => !r.isClosed && r.tatStatus === 'Off-TAT').length === 0 && (
                <tr><td colSpan={6} className="text-center py-6 text-green-600">No Off-TAT open vacancies — well done!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Drill-down list modal */}
      {drill && (
        <DrillModal
          title={drill.title}
          subtitle={drill.subtitle}
          records={drill.records}
          onClose={() => setDrill(null)}
          onPick={r => { setSelected(r); setDrill(null); }}
        />
      )}

      {/* Single record full-detail modal */}
      {selected && <RecordModal record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

// =============================================================================
// Drill-down list modal — sortable table + CSV export
// =============================================================================
const DrillModal: React.FC<{
  title: string;
  subtitle?: string;
  records: VacancyRecord[];
  onClose: () => void;
  onPick: (r: VacancyRecord) => void;
}> = ({ title, subtitle, records, onClose, onPick }) => {
  const [sortBy, setSortBy] = useState<keyof VacancyRecord>('positionTime');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const arr = [...records];
    arr.sort((a, b) => {
      const av = a[sortBy] as any, bv = b[sortBy] as any;
      const an = Number(av), bn = Number(bv);
      if (!isNaN(an) && !isNaN(bn) && av !== '' && bv !== '') return sortDir === 'asc' ? an - bn : bn - an;
      return sortDir === 'asc'
        ? String(av || '').localeCompare(String(bv || ''))
        : String(bv || '').localeCompare(String(av || ''));
    });
    return arr;
  }, [records, sortBy, sortDir]);

  const exportCSV = () => {
    const cols: (keyof VacancyRecord)[] = [
      'vacancyId', 'intimationDate', 'region', 'storeId', 'storeName', 'position',
      'positionType', 'hrbpName', 'mmRmName', 'candidateName',
      'offerLetterDate', 'doj', 'positionTime', 'tatStatus', 'vacancyStatus', 'remarks'
    ];
    const head = cols.join(',');
    const body = sorted.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([head + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title.replace(/[^\w]+/g, '_')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (k: keyof VacancyRecord) => {
    if (sortBy === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(k); setSortDir('desc'); }
  };

  const cols: [keyof VacancyRecord, string][] = [
    ['hrbpName','HRBP'], ['region','Region'], ['storeId','Store'],
    ['position','Position'], ['positionType','Type'], ['intimationDate','Intimation'],
    ['offerLetterDate','Offer Date'], ['positionTime','Days'],
    ['tatStatus','TAT'], ['vacancyStatus','Status']
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
           onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {sorted.length} record{sorted.length === 1 ? '' : 's'}{subtitle ? ` · ${subtitle}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} disabled={sorted.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
              <X className="w-4 h-4 text-gray-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1">
          {sorted.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No records.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                <tr>
                  {cols.map(([k, label]) => (
                    <th key={k} className="text-left px-3 py-2 font-medium whitespace-nowrap cursor-pointer hover:text-blue-600"
                        onClick={() => toggleSort(k)}>
                      {label}{sortBy === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.vacancyId}
                      className="border-t border-gray-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => onPick(r)}>
                    <td className="px-3 py-2 font-medium">{r.hrbpName || '—'}</td>
                    <td className="px-3 py-2">{r.region}</td>
                    <td className="px-3 py-2"><span className="font-medium">{r.storeId}</span> <span className="text-xs text-gray-500">{r.storeName}</span></td>
                    <td className="px-3 py-2">{r.position}</td>
                    <td className="px-3 py-2">
                      {r.positionType ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.positionType === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.positionType}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.intimationDate ? new Date(r.intimationDate).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.offerLetterDate ? new Date(r.offerLetterDate).toLocaleDateString() : '—'}</td>
                    <td className={`px-3 py-2 text-center tabular-nums font-semibold ${Number(r.positionTime) > 30 ? 'text-red-600' : 'text-gray-700 dark:text-slate-200'}`}>{r.positionTime}d</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.tatStatus === 'On-TAT' ? 'bg-green-100 text-green-700' : r.tatStatus === 'Off-TAT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {r.tatStatus || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.vacancyStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Single-record full-detail modal
// =============================================================================
const RecordModal: React.FC<{ record: VacancyRecord; onClose: () => void }> = ({ record, onClose }) => {
  const fmt = (v: any) => {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v); if (!isNaN(d.getTime())) return d.toLocaleDateString();
    }
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  };
  const fields: [string, any][] = [
    ['Vacancy ID', record.vacancyId],
    ['Intimation Date', record.intimationDate],
    ['Region', record.region],
    ['Brand', record.brand],
    ['Store Type', record.storeType],
    ['Category', record.category],
    ['Position', record.position],
    ['Position Type', record.positionType],
    ['Store ID', record.storeId],
    ['Store Name', record.storeName],
    ['Drop-Out Type', record.dropOutType],
    ['Drop-Out Sl. No', record.dropOutSerialNo],
    ['Replacement E-Code', record.replacementECode],
    ['Hold Time (Days)', record.holdTime],
    ['Hold Reason', record.holdReason],
    ['Offer Letter Date', record.offerLetterDate],
    ['DOJ', record.doj],
    ['NSO Opening Date', record.nsoOpeningDate],
    ['NSO 100% Manpower', record.nsoOpenedWith100Manpower],
    ['Source of Hiring', record.sourceOfHiring],
    ['Candidate Name', record.candidateName],
    ['Candidate Designation', record.candidateDesignation],
    ['Referrer Name', record.referrerName],
    ['Referrer Emp ID', record.referrerEmpId],
    ['MM/RM Name', record.mmRmName],
    ['HRBP ID', record.hrbpId],
    ['HRBP Name', record.hrbpName],
    ['Position Time (Days)', record.positionTime],
    ['TAT Status', record.tatStatus],
    ['Vacancy Status', record.vacancyStatus],
    ['Is Closed', record.isClosed],
  ];
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
           onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
          <div>
            <h3 className="text-lg font-bold">{record.position || 'Vacancy'} — {record.storeName || record.storeId || '—'}</h3>
            <p className="text-xs opacity-90">{record.hrbpName || 'No HRBP'} · {record.region}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex flex-wrap gap-2 items-center">
          <Badge label={record.tatStatus || 'Pending'}
                 color={record.tatStatus === 'On-TAT' ? 'green' : record.tatStatus === 'Off-TAT' ? 'red' : 'gray'} />
          <Badge label={record.isClosed ? 'Closed' : 'Open'} color={record.isClosed ? 'green' : 'blue'} />
          <Badge label={`${record.positionTime || 0} days`} color={Number(record.positionTime) > 30 ? 'red' : 'gray'} />
          {record.remarks && <span className="text-xs text-gray-500 dark:text-slate-400 italic ml-2">📝 {record.remarks}</span>}
        </div>
        <div className="overflow-auto flex-1 p-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {fields.map(([k, v]) => (
              <div key={k} className="border-b border-gray-100 dark:border-slate-700 pb-2">
                <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-slate-400">{k}</dt>
                <dd className="text-gray-900 dark:text-white font-medium break-words">{fmt(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Sub-components
// =============================================================================
const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string; onClick?: () => void }> =
  ({ icon, label, value, color, sub, onClick }) => (
  <button type="button" onClick={onClick}
    className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700 text-left hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        {sub && <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{sub}</div>}
      </div>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${color}`}>{icon}</div>
    </div>
  </button>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
    {children}
  </div>
);

const Empty: React.FC = () => (
  <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">No data</div>
);

const NumCell: React.FC<{ value: number | string; className?: string; onClick?: (e: React.MouseEvent) => void }> =
  ({ value, className, onClick }) => (
  <td className={`px-3 py-2 text-center tabular-nums ${onClick ? 'cursor-pointer hover:underline' : ''} ${className || ''}`}
      onClick={onClick}>{value}</td>
);

const Badge: React.FC<{ label: string; color: 'green' | 'red' | 'blue' | 'gray' }> = ({ label, color }) => {
  const map = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    red:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    blue:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    gray:  'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>{label}</span>;
};

function pctColor(p: number): string {
  if (p >= 80) return 'bg-green-500';
  if (p >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default TATTrackerDashboard;
