import React from 'react';
import { useTrendsData } from './useTrendsData';

export default function HeaderSummary() {
  const { rows: records, summary, loading } = useTrendsData();

  // Use API summary for the 4 key metrics
  const apiSummary = summary || {
    total_submissions: 0,
    stores_covered: 0,
    average_score: 0,
    store_health: { healthy: 0, warning: 0, critical: 0 }
  };

  if (loading) {
    return <div className="header-summary">Loading summary...</div>;
  }

  // Get the date range from the records for display
  const periods = Array.from(new Set(records.map((r: any) => r.observed_period))).sort();
  const dateRange = periods.length > 0 ? `${periods[0]} to ${periods[periods.length - 1]}` : 'All Time';

  const pillStyleBase: React.CSSProperties = {
    background: '#0f1724',
    borderRadius: 9999,
    padding: '8px 14px',
    color: '#e6eef8',
    boxShadow: '0 6px 20px rgba(2,6,23,0.25)',
    border: '1px solid rgba(255,255,255,0.03)',
    flex: 1
  };

  const smallLabel: React.CSSProperties = { 
    fontSize: 12, 
    opacity: 0.9, 
    fontWeight: 700, 
    textTransform: 'uppercase', 
    letterSpacing: '0.04em', 
    color: '#cbd5e1' 
  };
  
  const bigNumber: React.CSSProperties = { 
    fontSize: 18, 
    fontWeight: 800, 
    marginTop: 0, 
    color: '#ffffff' 
  };

  return (
    <div className="header-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 8, alignItems: 'center' }}>
      <div style={{ ...pillStyleBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={smallLabel}>Total Submissions</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{dateRange}</div>
        </div>
        <div style={bigNumber}>{apiSummary.total_submissions}</div>
      </div>

      <div style={{ ...pillStyleBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={smallLabel}>Average Score</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{dateRange}</div>
        </div>
        <div style={bigNumber}>{apiSummary.average_score}%</div>
      </div>

      <div style={{ ...pillStyleBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 18 }}>
        <div>
          <div style={smallLabel}>Store Health</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>(Overall Average)</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981', display: 'inline-block' }} />
            <span style={{ fontWeight: 800, fontSize: 18 }}>{apiSummary.store_health.healthy}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ fontWeight: 800, fontSize: 18 }}>{apiSummary.store_health.warning}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontWeight: 800, fontSize: 18 }}>{apiSummary.store_health.critical}</span>
          </div>
        </div>
      </div>

      <div style={{ ...pillStyleBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={smallLabel}>Stores Covered</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>(Total Unique)</div>
        </div>
        <div style={bigNumber}>{apiSummary.stores_covered}</div>
      </div>
    </div>
  );
}
