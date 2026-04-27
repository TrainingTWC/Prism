/**
 * Third Rush Dashboard
 * Aggregates data from all three Third Rush sub-forms.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, ClipboardList, Sparkles, Users2, AlertTriangle, CheckCircle2,
  TrendingUp, Coffee, Store as StoreIcon
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  fetchThirdRushAll, FullAuditRow, MiscRow, StaffRow
} from '../../services/thirdRushFeedbackData';

interface Props { userRole?: any; }

const COLORS = ['#0891b2', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 ${className}`}>
    {children}
  </div>
);

const StatCard: React.FC<{
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 font-semibold">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl ${color} text-white flex items-center justify-center`}>{icon}</div>
    </div>
  </Card>
);

const ThirdRushDashboard: React.FC<Props> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState<FullAuditRow[]>([]);
  const [misc, setMisc] = useState<MiscRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [tab, setTab] = useState<'full' | 'misc' | 'staff'>('full');

  const load = async () => {
    setLoading(true); setError(null);
    const res = await fetchThirdRushAll();
    if (res.status === 'OK') {
      setFull(res.full || []); setMisc(res.misc || []); setStaff(res.staff || []);
    } else {
      setError(res.message || 'Failed to load data');
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = full.length;
    const scores = full.map(r => Number(r['Readiness Score'])).filter(n => !isNaN(n));
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const ready = full.filter(r => r['Overall Readiness'] === 'Ready').length;
    const notReady = full.filter(r => r['Overall Readiness'] === 'Not Ready').length;
    return { total, avg, ready, notReady };
  }, [full]);

  const trend = useMemo(() => {
    const map = new Map<string, { date: string; count: number; sum: number }>();
    full.forEach(r => {
      const ts = String(r['Server Timestamp'] || '');
      const date = ts.slice(0, 10);
      if (!date) return;
      const cur = map.get(date) || { date, count: 0, sum: 0 };
      cur.count += 1;
      const s = Number(r['Readiness Score']); if (!isNaN(s)) cur.sum += s;
      map.set(date, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ date: d.date, audits: d.count, avgScore: d.count ? Math.round(d.sum / d.count) : 0 }));
  }, [full]);

  const byStore = useMemo(() => {
    const map = new Map<string, { store: string; count: number; sum: number }>();
    full.forEach(r => {
      const store = String(r['Store Name'] || r['Store ID'] || 'Unknown');
      const cur = map.get(store) || { store, count: 0, sum: 0 };
      cur.count += 1;
      const s = Number(r['Readiness Score']); if (!isNaN(s)) cur.sum += s;
      map.set(store, cur);
    });
    return Array.from(map.values())
      .map(d => ({ store: d.store, audits: d.count, avgScore: d.count ? Math.round(d.sum / d.count) : 0 }))
      .sort((a, b) => b.audits - a.audits)
      .slice(0, 12);
  }, [full]);

  const readinessMix = useMemo(() => {
    const counts: Record<string, number> = {};
    full.forEach(r => {
      const k = String(r['Overall Readiness'] || 'Unknown');
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [full]);

  const severityMix = useMemo(() => {
    const counts: Record<string, number> = {};
    misc.forEach(r => {
      const k = String(r['Severity'] || 'Unknown');
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [misc]);

  return (
    <div className="space-y-5">
      <Card className="!p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Third Rush Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Live aggregate of Full Audit, Miscellaneous &amp; Store Team feedback.</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </Card>

      {error && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">Couldn't load Third Rush data</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">{error}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                Deploy <code>third-rush-feedback-google-apps-script.js</code> as a Web App and update the URL in
                <code className="ml-1">services/thirdRushFeedbackData.ts</code>.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="Full Audits"      value={stats.total}   icon={<ClipboardList className="w-5 h-5" />} color="bg-cyan-600" />
        <StatCard label="Avg Readiness"    value={`${stats.avg}/100`} icon={<TrendingUp className="w-5 h-5" />} color="bg-emerald-600" />
        <StatCard label="Ready Stores"     value={stats.ready}   icon={<CheckCircle2 className="w-5 h-5" />} color="bg-teal-600" />
        <StatCard label="Not Ready"        value={stats.notReady} icon={<AlertTriangle className="w-5 h-5" />} color="bg-red-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Audits Over Time</h3>
          {trend.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="audits"   stroke="#0891b2" strokeWidth={2} />
                <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Readiness Mix</h3>
          {readinessMix.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={readinessMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                  {readinessMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Top Stores by Audit Volume</h3>
        {byStore.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byStore}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="store" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="audits"   fill="#0891b2" />
              <Bar dataKey="avgScore" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {[
            { id: 'full' as const,  label: `Full Audits (${full.length})`,    icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'misc' as const,  label: `Miscellaneous (${misc.length})`,  icon: <Sparkles className="w-4 h-4" /> },
            { id: 'staff' as const, label: `Store Team (${staff.length})`,    icon: <Users2 className="w-4 h-4" /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${
                tab === t.id
                  ? 'text-cyan-700 dark:text-cyan-300 border-b-2 border-cyan-600 bg-cyan-50/50 dark:bg-cyan-900/10'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {tab === 'full' && (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300">
                <tr>
                  <Th>Date</Th><Th>Store</Th><Th>Auditor</Th><Th>Speed</Th><Th>Workflow</Th>
                  <Th>Coffee</Th><Th>Verdict</Th><Th>Score</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {full.length === 0 ? <Empty cols={8} /> : full.slice().reverse().map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <Td>{String(r['Server Timestamp'] || '').slice(0, 10)}</Td>
                    <Td>{r['Store Name'] || r['Store ID']}</Td>
                    <Td>{r['Auditor Name']}</Td>
                    <Td>{r['Avg Order Time']}</Td>
                    <Td>{r['Workflow Efficiency']}</Td>
                    <Td>{r['Coffee Quality']}</Td>
                    <Td><Verdict v={String(r['Overall Readiness'])} /></Td>
                    <Td><strong>{r['Readiness Score']}</strong></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'misc' && (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300">
                <tr>
                  <Th>Date</Th><Th>Store</Th><Th>Auditor</Th><Th>Category</Th>
                  <Th>Observation</Th><Th>Severity</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {misc.length === 0 ? <Empty cols={6} /> : misc.slice().reverse().map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <Td>{String(r['Server Timestamp'] || '').slice(0, 10)}</Td>
                    <Td>{r['Store Name'] || r['Store ID']}</Td>
                    <Td>{r['Auditor Name']}</Td>
                    <Td>{r['Category']}</Td>
                    <Td className="max-w-md truncate">{r['Observation']}</Td>
                    <Td>{r['Severity']}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'staff' && (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300">
                <tr>
                  <Th>Date</Th><Th>Store</Th><Th>Submitted By</Th><Th>Role</Th>
                  <Th>Morale</Th><Th>Staffing OK</Th><Th>Challenge</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {staff.length === 0 ? <Empty cols={7} /> : staff.slice().reverse().map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <Td>{String(r['Server Timestamp'] || '').slice(0, 10)}</Td>
                    <Td>{r['Store Name'] || r['Store ID']}</Td>
                    <Td>{r['Submitted By']}</Td>
                    <Td>{r['Role']}</Td>
                    <Td>{r['Team Morale']}</Td>
                    <Td>{r['Was Staffing Adequate']}</Td>
                    <Td className="max-w-md truncate">{r['Biggest Challenge']}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {misc.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <StoreIcon className="w-4 h-4" /> Miscellaneous Severity Mix
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityMix} dataKey="value" nameKey="name" outerRadius={80} label>
                {severityMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{children}</th>
);
const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-4 py-2.5 text-gray-800 dark:text-slate-200 ${className}`}>{children}</td>
);
const Empty: React.FC<{ cols: number }> = ({ cols }) => (
  <tr><td colSpan={cols} className="px-4 py-10 text-center text-gray-400 dark:text-slate-500">No submissions yet.</td></tr>
);
const Verdict: React.FC<{ v: string }> = ({ v }) => {
  const cls = v === 'Ready' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    : v === 'Not Ready' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{v || '—'}</span>;
};

export default ThirdRushDashboard;
