import React, { useMemo } from 'react';
import { useTrendsData } from './useTrendsData';

type Row = any;

function computeSummary(rows: Row[]) {
  // Each submission has 2 rows (score + percentage), so actual submissions = rows / 2
  const scoreRows = rows.filter((r) => r.metric_name === 'score');
  const percentageRows = rows.filter((r) => r.metric_name === 'percentage');
  // Total submissions = count of score rows (or percentage rows - should be same)
  const totalSubmissions = scoreRows.length;
  
  const avgScore = scoreRows.length ? +(scoreRows.reduce((s, r) => s + (r.metric_value || 0), 0) / scoreRows.length).toFixed(1) : null;
  const stores = new Map();
  for (const r of rows) {
    stores.set(r.store_id, r.store_name || r.store_id);
  }
  const storesCovered = stores.size;
  // store health: simple bucket avg score per store
  const storeScores = new Map();
  for (const r of scoreRows) {
    const s = storeScores.get(r.store_id) ?? { sum: 0, count: 0 };
    s.sum += r.metric_value; s.count += 1; storeScores.set(r.store_id, s);
  }
  let healthy = 0, warning = 0, critical = 0;
  for (const [sid, v] of storeScores.entries()) {
    const avg = v.sum / v.count;
    if (avg >= 80) healthy++; else if (avg >= 60) warning++; else critical++;
  }

  // compute top movers by month-over-month using simple heuristic on score
  // group by store+period
  const byStore = new Map();
  for (const r of scoreRows) {
    const arr = byStore.get(r.store_id) ?? [];
    arr.push(r);
    byStore.set(r.store_id, arr);
  }
  const movers: { store_id: string; store_name: string; mom?: number; current?: number; prev?: number }[] = [];
  for (const [sid, arr] of byStore.entries()) {
    const byPeriod = new Map();
    arr.forEach((x) => byPeriod.set(x.observed_period, x.metric_value));
    const periods = Array.from(byPeriod.keys()).sort();
    if (periods.length < 2) {
      // Only one period - show current value with no MoM
      const current = byPeriod.get(periods[0]);
      movers.push({ store_id: sid, store_name: arr[0].store_name, current, mom: undefined });
      continue;
    }
    const last = byPeriod.get(periods[periods.length - 1]);
    const prev = byPeriod.get(periods[periods.length - 2]);
    if (prev === 0) {
      movers.push({ store_id: sid, store_name: arr[0].store_name, current: last, prev, mom: undefined });
      continue;
    }
    const mom = ((last - prev) / prev) * 100;
    movers.push({ store_id: sid, store_name: arr[0].store_name, current: last, prev, mom });
  }
  const gainers = movers.filter(m => m.mom !== undefined).sort((a,b) => (b.mom ?? 0) - (a.mom ?? 0)).slice(0,3);
  const losers = movers.filter(m => m.mom !== undefined).sort((a,b) => (a.mom ?? 0) - (b.mom ?? 0)).slice(0,3);

  return { totalSubmissions, avgScore, storesCovered, storeHealth: { healthy, warning, critical }, gainers, losers };
}

export default function HeaderSummary() {
  const { rows: combined, loading, sheetRowsCount, totalRowsCount } = useTrendsData();

  const summary = useMemo(() => computeSummary(combined || []), [combined]);

  if (loading) {
    return <div className="header-summary">Loading summary...</div>;
  }

  // Get the date range from the data for the subtitle
  const periods = Array.from(new Set(combined.map((r: any) => r.observed_period))).sort();
  const dateRange = periods.length > 0 ? `${periods[0]} to ${periods[periods.length - 1]}` : 'All Time';

  const pillStyleBase: React.CSSProperties = {
    background: '#0f1724',
    borderRadius: 9999,
    // slightly thicker for better proportions
    padding: '8px 14px',
    color: '#e6eef8',
    boxShadow: '0 6px 20px rgba(2,6,23,0.25)',
    border: '1px solid rgba(255,255,255,0.03)',
    flex: 1
  };

  const smallLabel: React.CSSProperties = { fontSize: 12, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#cbd5e1' };
  const bigNumber: React.CSSProperties = { fontSize: 18, fontWeight: 800, marginTop: 0, color: '#ffffff' };

  return (
    <div className="header-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 8, alignItems: 'center' }}>
      <div style={{ ...pillStyleBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={smallLabel}>Historic Audits</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{dateRange}</div>
        </div>
        <div style={bigNumber}>{summary.totalSubmissions}</div>
      </div>

      <div style={{ ...pillStyleBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={smallLabel}>Average Score</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{dateRange}</div>
        </div>
        <div style={bigNumber}>{summary.avgScore ?? '—'}%</div>
      </div>

      <div style={{ ...pillStyleBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 18 }}>
        <div>
          <div style={smallLabel}>Store Health</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>(Overall Average)</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981', display: 'inline-block' }} />
            <span style={{ fontWeight: 800, fontSize: 18 }}>{summary.storeHealth.healthy}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ fontWeight: 800, fontSize: 18 }}>{summary.storeHealth.warning}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontWeight: 800, fontSize: 18 }}>{summary.storeHealth.critical}</span>
          </div>
        </div>
      </div>

      <div style={{ ...pillStyleBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={smallLabel}>Stores Covered</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>(Total Unique)</div>
        </div>
        <div style={bigNumber}>{summary.storesCovered}</div>
      </div>
    </div>
  );
}
