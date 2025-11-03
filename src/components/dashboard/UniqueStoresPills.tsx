import React, { useMemo } from 'react';
import { Filters } from '../../audit-dashboard/state';
import { applyFilters, aggregatePeriodAverages, computePerStoreLatestAverages } from './trendsUtils';
import { useTrendsData } from './useTrendsData';

interface UniqueStoresPillsProps {
  filters?: Filters;
  rows?: any[];
  loading?: boolean;
}

export function UniqueStoresPills({ filters, rows: propRows, loading: propLoading }: UniqueStoresPillsProps) {
  // ✅ Accept rows and loading as props if provided, otherwise fetch internally
  // This allows parent to pass pre-fetched data to avoid re-fetching
  const { rows: fetchedRows, loading: fetchedLoading } = useTrendsData();
  const rows = propRows !== undefined ? propRows : fetchedRows;
  const loading = propLoading !== undefined ? propLoading : fetchedLoading;
  
  const filteredRows = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  // Helper function to convert YYYY-MM to month name
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Calculate unique stores per period
  const storesPerPeriod = useMemo(() => {
    const periodStores = new Map<string, Set<string>>();
    filteredRows.forEach((r) => {
      if (r.metric_name === 'percentage') { // Only count once per store
        if (!periodStores.has(r.observed_period)) {
          periodStores.set(r.observed_period, new Set());
        }
        periodStores.get(r.observed_period)!.add(r.store_id);
      }
    });
    return periodStores;
  }, [filteredRows]);

  const pctTrend = useMemo(() => aggregatePeriodAverages(filteredRows, 'percentage'), [filteredRows]);

  const perStoreAvgs = useMemo(() => computePerStoreLatestAverages(filteredRows, {}), [filteredRows]);

  // Build combined dataset with store counts
  const combined = useMemo(() => {
    const periods = Array.from(storesPerPeriod.keys()).sort();
    const dataPoints = periods.map((p) => ({
      period: formatPeriod(p),
      storeCount: storesPerPeriod.get(p)?.size ?? 0,
      originalPeriod: p,
    }));
    // Deduplicate by formatted period, keeping first occurrence
    const seen = new Set<string>();
    return dataPoints.filter((item) => {
      if (seen.has(item.period)) return false;
      seen.add(item.period);
      return true;
    });
  }, [storesPerPeriod]);

  if (loading) {
    return (
      <div className="p-3 text-center text-gray-500 dark:text-slate-400 text-xs">
        Loading store data...
      </div>
    );
  }

  if (combined.length === 0) {
    return null;
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-slate-200">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h7v7H3z"/>
          <path d="M14 3h7v7h-7z"/>
          <path d="M14 14h7v7h-7z"/>
          <path d="M3 14h7v7H3z"/>
        </svg>
        Unique Stores per Month
      </div>
      <div className="flex gap-3 flex-wrap">
        {combined.map((item, idx) => {
          const prevCount = idx > 0 ? combined[idx - 1].storeCount : null;
          const change = prevCount !== null ? item.storeCount - prevCount : null;
          return (
            <div key={item.period} className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 shadow-sm rounded-full transition-all min-w-fit border border-gray-100 dark:border-slate-700">
              <div className="text-xs text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">{item.period}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-700 dark:text-slate-100">{item.storeCount}</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500">stores</span>
              </div>
              {change !== null && (
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-semibold whitespace-nowrap ${
                  change > 0 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : change < 0 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                }`}>
                  {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {change > 0 ? '+' : ''}{change}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
