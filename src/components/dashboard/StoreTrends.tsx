import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filters } from '../../audit-dashboard/state';
import { applyFilters, aggregatePeriodAverages, computeStoreSeries, computeMoM, computePerStoreLatestAverages, computePerPeriodLatestAverages } from './trendsUtils';
import { useTrendsData } from './useTrendsData';

type Row = any;

type SeriesPoint = { period: string; value: number };

function Sparkline({ series }: { series: SeriesPoint[] }) {
  if (!series || series.length === 0) return <span className="spark empty">—</span>;
  const values = series.map((s) => s.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = max === min ? 50 : 100 - ((v - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg className="spark" viewBox="0 0 100 100" preserveAspectRatio="none" width={80} height={24}>
      <polyline fill="none" stroke="#3b82f6" strokeWidth={2} points={points} />
    </svg>
  );
}

export default function StoreTrends({
  metric = 'score',
  top = 20,
  filters,
  rows: propRows,
  loading: propLoading,
}: {
  metric?: string;
  top?: number;
  filters?: Filters;
  rows?: any[];
  loading?: boolean;
}) {
  // ✅ Accept rows and loading as props if provided, otherwise fetch internally
  // This allows parent to pass pre-fetched data to avoid re-fetching
  const { rows: fetchedRows, loading: fetchedLoading } = useTrendsData();
  const rows = propRows !== undefined ? propRows : fetchedRows;
  const loading = propLoading !== undefined ? propLoading : fetchedLoading;
  
  const filteredRows = useMemo(() => {
    const filtered = applyFilters(rows, filters);
    return filtered;
  }, [rows, filters]);

  const scoreTrend = useMemo(() => {
    const trend = aggregatePeriodAverages(filteredRows, 'score');
    return trend;
  }, [filteredRows]);
  // Use per-period averages computed from per-store latest-up-to-period-end values
  const pctTrend = useMemo(() => {
    const trend = computePerPeriodLatestAverages(filteredRows, 'percentage');
    return trend;
  }, [filteredRows]);

  // Compute per-store latest averages up to now and up to previous month end
  const perStoreAvgs = useMemo(() => computePerStoreLatestAverages(filteredRows, {}), [filteredRows]);

  // Helper function to convert YYYY-MM to month name
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Calculate store categories per period (Needs Attention, Brewing, Perfect Shot)
  // This is CUMULATIVE - each month includes data from all previous months
  const categoryBreakdown = useMemo(() => {
    const breakdown = new Map<string, { needsAttention: number; brewing: number; perfectShot: number }>();
    
    // Group all stores by period first
    const storesByPeriod = new Map<string, Map<string, number>>();
    filteredRows.forEach((r) => {
      if (r.metric_name === 'percentage') {
        const period = r.observed_period;
        if (!storesByPeriod.has(period)) {
          storesByPeriod.set(period, new Map());
        }
        storesByPeriod.get(period)!.set(r.store_id, r.metric_value);
      }
    });
    
    // Sort periods and calculate cumulative categories
    const sortedPeriods = Array.from(storesByPeriod.keys()).sort();
    const cumulativeStores = new Map<string, number>(); // store_id -> latest percentage
    
    sortedPeriods.forEach((period) => {
      // Add/update stores from this period
      const periodStores = storesByPeriod.get(period)!;
      periodStores.forEach((percentage, storeId) => {
        cumulativeStores.set(storeId, percentage);
      });
      
      // Calculate categories based on cumulative stores
      const categories = { needsAttention: 0, brewing: 0, perfectShot: 0 };
      cumulativeStores.forEach((percentage) => {
        if (percentage < 55) {
          categories.needsAttention++;
        } else if (percentage >= 55 && percentage <= 80) {
          categories.brewing++;
        } else {
          categories.perfectShot++;
        }
      });
      
      breakdown.set(period, categories);
    });
    
    return breakdown;
  }, [filteredRows]);

  // Build a combined dataset for chart: list of { period, percentage, categories }
  const combined = useMemo(() => {
    const periods = Array.from(new Set([...scoreTrend.map((s) => s.period), ...pctTrend.map((p) => p.period)])).sort();
    // Create array and remove any duplicate formatted periods
    const dataPoints = periods.map((p) => {
      const categories = categoryBreakdown.get(p) || { needsAttention: 0, brewing: 0, perfectShot: 0 };
      return {
        period: formatPeriod(p),
        percentage: pctTrend.find((s) => s.period === p)?.avg ?? null,
        needsAttention: categories.needsAttention,
        brewing: categories.brewing,
        perfectShot: categories.perfectShot,
        originalPeriod: p, // Keep for debugging
      };
    });
    // Deduplicate by formatted period, keeping first occurrence
    const seen = new Set<string>();
    const deduped = dataPoints.filter((item) => {
      if (seen.has(item.period)) return false;
      seen.add(item.period);
      return true;
    });
    return deduped;
  }, [scoreTrend, pctTrend, categoryBreakdown]);

  const storesScore = useMemo(() => computeStoreSeries(filteredRows, 'score'), [filteredRows]);
  const storesPct = useMemo(() => computeStoreSeries(filteredRows, 'percentage'), [filteredRows]);

  const withMoMScore = useMemo(() => storesPct.map((s) => {
    const mom = computeMoM(s.series);
    const oldValue = s.series.length >= 2 ? s.series[s.series.length - 2].value : null;
    const newValue = s.series.length >= 1 ? s.series[s.series.length - 1].value : null;
    return { ...s, mom, oldValue, newValue };
  }), [storesPct]);
  const gainers = useMemo(() => withMoMScore.filter((s) => s.mom != null).sort((a, b) => (b.mom ?? 0) - (a.mom ?? 0)).slice(0, top), [withMoMScore, top]);
  const losers = useMemo(() => withMoMScore.filter((s) => s.mom != null).sort((a, b) => (a.mom ?? 0) - (b.mom ?? 0)).slice(0, top), [withMoMScore, top]);

  if (loading) {
    return (
      <div className="store-trends card">
        <h3>Store trends ({metric})</h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          Loading data from Google Sheets...
        </div>
      </div>
    );
  }

  return (
    <div className="store-trends card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">Monthly Performance Trend</h3>
        <div className="text-sm text-gray-600 dark:text-slate-300">
          <span className="font-semibold mr-2">Current avg:</span>
          <span className="mr-4">{perStoreAvgs.avgLatest !== null ? `${perStoreAvgs.avgLatest}%` : '—'}</span>
          <span className="font-semibold mr-2">Last month:</span>
          <span>{perStoreAvgs.avgPrev !== null ? `${perStoreAvgs.avgPrev}%` : '—'}</span>
        </div>
      </div>

      {/* Mobile-Friendly Layout: Stack on mobile, side-by-side on desktop */}
      <div className="trends-grid">
        {/* Chart Section */}
        <div className="chart-section">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={combined} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="period" style={{ fontSize: 11 }} stroke="currentColor" className="text-gray-600 dark:text-slate-400" />
              <YAxis style={{ fontSize: 11 }} domain={[0, 100]} stroke="currentColor" className="text-gray-600 dark:text-slate-400" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '6px' }}
                content={({ active, payload, label }: any) => {
                  if (!active || !payload || payload.length === 0) return null;
                  // Show only the numeric value (rounded to 2 decimals)
                  const val = payload[0].value;
                  const formatted = val === null || val === undefined ? '—' : (Math.round(val * 100) / 100).toFixed(2) + '%';
                  return (
                    <div style={{ padding: 8, background: 'var(--tooltip-bg)', borderRadius: 6, border: '1px solid var(--tooltip-border)', color: 'inherit' }}>
                      <div style={{ fontSize: 12 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{formatted}</div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Percentage" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Movers Section */}
        <div className="top-movers-grid">
          {/* Top Improvers */}
          <div className="mover-card improvers">
            <div className="mover-header">↗ Top 5 Improvers</div>
            {gainers.slice(0, 5).length === 0 && <div className="no-data">No data</div>}
            {gainers.slice(0, 5).map((g, idx) => (
              <div key={g.store_id} className="mover-item">
                <div className="mover-main">
                  <div className="mover-name">{idx + 1}. {g.store_name}</div>
                  <div className="mover-change positive">+{g.mom?.toFixed(1)}%</div>
                </div>
                <div className="mover-details">
                  {g.oldValue?.toFixed(1)}% → {g.newValue?.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          {/* Top Decliners */}
          <div className="mover-card decliners">
            <div className="mover-header">↘ Top 5 Decliners</div>
            {losers.slice(0, 5).length === 0 && <div className="no-data">No data</div>}
            {losers.slice(0, 5).map((g, idx) => (
              <div key={g.store_id} className="mover-item">
                <div className="mover-main">
                  <div className="mover-name">{idx + 1}. {g.store_name}</div>
                  <div className="mover-change negative">{g.mom?.toFixed(1)}%</div>
                </div>
                <div className="mover-details">
                  {g.oldValue?.toFixed(1)}% → {g.newValue?.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        :root {
          --tooltip-bg: #fff;
          --tooltip-border: #e5e7eb;
        }
        
        .dark {
          --tooltip-bg: #1e293b;
          --tooltip-border: #475569;
        }
        
        .store-trends { padding: 12px; }
        .card { 
          background: #fff; 
          padding: 8px; 
          border-radius: 6px;
        }
        
        .dark .card {
          background: #1e293b;
        }
        
        /* Mobile-friendly grid layout */
        .trends-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        @media (min-width: 768px) {
          .trends-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
        
        .chart-section {
          width: 100%;
          min-height: 220px;
        }
        
        .top-movers-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        @media (min-width: 640px) {
          .top-movers-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        .mover-card {
          padding: 12px;
          border-radius: 6px;
          height: fit-content;
        }
        
        .mover-card.improvers {
          background: #f9fafb;
        }
        
        .dark .mover-card.improvers {
          background: #16a34a1a;
        }
        
        .mover-card.decliners {
          background: #fef2f2;
        }
        
        .dark .mover-card.decliners {
          background: #dc26261a;
        }
        
        .mover-header {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .mover-card.improvers .mover-header {
          color: #16a34a;
        }
        
        .dark .mover-card.improvers .mover-header {
          color: #4ade80;
        }
        
        .mover-card.decliners .mover-header {
          color: #dc2626;
        }
        
        .dark .mover-card.decliners .mover-header {
          color: #f87171;
        }
        
        .no-data {
          font-size: 12px;
          color: #6b7280;
        }
        
        .dark .no-data {
          color: #94a3b8;
        }
        
        .mover-item {
          padding: 6px 0;
        }
        
        .mover-card.improvers .mover-item {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .dark .mover-card.improvers .mover-item {
          border-bottom: 1px solid #16a34a33;
        }
        
        .mover-card.decliners .mover-item {
          border-bottom: 1px solid #fecaca;
        }
        
        .dark .mover-card.decliners .mover-item {
          border-bottom: 1px solid #dc262633;
        }
        
        .mover-item:last-child {
          border-bottom: none;
        }
        
        .mover-main {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        .mover-name {
          color: #374151;
          font-size: 12px;
          font-weight: 600;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .dark .mover-name {
          color: #e2e8f0;
        }
        
        .mover-change {
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
        }
        
        .mover-change.positive {
          color: #16a34a;
        }
        
        .dark .mover-change.positive {
          color: #4ade80;
        }
        
        .mover-change.negative {
          color: #dc2626;
        }
        
        .dark .mover-change.negative {
          color: #f87171;
        }
        
        .mover-details {
          font-size: 11px;
          color: #6b7280;
        }
        
        .dark .mover-details {
          color: #94a3b8;
        }
        
        /* Mobile optimization */
        @media (max-width: 640px) {
          .mover-name {
            font-size: 11px;
          }
          
          .mover-change {
            font-size: 12px;
          }
          
          .mover-details {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
