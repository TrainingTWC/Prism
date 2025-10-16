import React, { useMemo } from 'react';
import { Filters } from '../../audit-dashboard/state';
import { applyFilters, aggregatePeriodAverages } from './trendsUtils';
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
      <div style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: 12 }}>
        Loading store data...
      </div>
    );
  }

  if (combined.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 12,
        fontSize: 14,
        fontWeight: 600,
        color: '#374151'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h7v7H3z"/>
          <path d="M14 3h7v7h-7z"/>
          <path d="M14 14h7v7h-7z"/>
          <path d="M3 14h7v7H3z"/>
        </svg>
        Unique Stores per Month
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {combined.map((item, idx) => {
          const prevCount = idx > 0 ? combined[idx - 1].storeCount : null;
          const change = prevCount !== null ? item.storeCount - prevCount : null;
          return (
            <div key={item.period} className="card" style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px', 
              background: '#fff',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
              borderRadius: 20,
              transition: 'all 0.2s',
              minWidth: 'fit-content'
            }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.period}</div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: 4 
              }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>{item.storeCount}</span>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>stores</span>
              </div>
              {change !== null && (
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '3px 8px',
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 600,
                  background: change > 0 ? '#dcfce7' : change < 0 ? '#fee2e2' : '#f3f4f6',
                  color: change > 0 ? '#16a34a' : change < 0 ? '#dc2626' : '#6b7280',
                  whiteSpace: 'nowrap'
                }}>
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
