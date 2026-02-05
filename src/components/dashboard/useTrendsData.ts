import { useEffect, useState, useMemo } from 'react';

type Row = any;

// Use the UPDATED Training Audit endpoint
const TRAINING_AUDIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwn4bXmjoXaTI7UMfDhzQwG6SZGZCq-qlVC_mQUnCZm0YiciqtaGgtdRJiq4oi505na3w/exec';

/**
 * Fetches raw training audit data from Google Sheets
 */
async function fetchGoogleSheets() {
  try {
    const url = TRAINING_AUDIT_ENDPOINT + '?action=getData';
    
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      redirect: 'follow',
    });
    
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`);
    }
    
    const j = await r.json();
    
    // Handle both array format (direct) and object format with rows property
    const rows = Array.isArray(j) ? j : (j.rows || []);
    
    return rows;
  } catch (e) {
    console.error('Failed to fetch training audit data:', e);
    return [];
  }
}

/**
 * Aggregates raw training audit data into monthly trends
 * Returns data in the same format as the old Monthly_Trends sheet
 */
function aggregateMonthlyTrends(auditRows: any[]): any[] {
  const aggregates: Record<string, {
    store_id: string;
    store_name: string;
    observed_period: string;
    percentages: number[];
    scores: number[];
    count: number;
  }> = {};
  
  auditRows.forEach((row) => {
    // Parse timestamp
    const timestamp = row['Timestamp'] || row.timestamp || row.submissionTime || row.submission_time || row.submitted_at;
    if (!timestamp) return;
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;
    
    // Get store info - try multiple field name variations
    const storeId = String(row['Store ID'] || row.storeId || row.storeID || row.store_id || '').trim();
    const storeName = String(row['Store Name'] || row.storeName || row.store_name || '').trim();
    
    if (!storeId) return;
    
    // Get score data - try multiple field name variations
    const percentage = parseFloat(row['Percentage'] || row.percentage || row.percentageScore || row.percentage_score || '0') || 0;
    const totalScore = parseFloat(row['Total Score'] || row.totalScore || row.total_score || row.score || '0') || 0;
    
    // Create unique key
    const key = `${storeId}_${period}`;
    
    if (!aggregates[key]) {
      aggregates[key] = {
        store_id: storeId,
        store_name: storeName,
        observed_period: period,
        percentages: [],
        scores: [],
        count: 0
      };
    }
    
    aggregates[key].percentages.push(percentage);
    aggregates[key].scores.push(totalScore);
    aggregates[key].count++;
  });
  
  // Convert to rows format (2 rows per store-month: score and percentage)
  const rows: any[] = [];
  
  Object.values(aggregates).forEach((agg) => {
    // Calculate averages
    const avgPercentage = agg.percentages.reduce((a, b) => a + b, 0) / agg.count;
    const avgScore = agg.scores.reduce((a, b) => a + b, 0) / agg.count;
    
    // Filter out June 2025 data
    const isJune2025 = agg.observed_period === '2025-06';
    if (isJune2025) return;
    
    // Add percentage row
    rows.push({
      store_id: agg.store_id,
      store_name: agg.store_name,
      observed_period: agg.observed_period,
      metric_name: 'percentage',
      metric_value: Math.round(avgPercentage * 100) / 100,
      audit_count: agg.count
    });
    
    // Add score row
    rows.push({
      store_id: agg.store_id,
      store_name: agg.store_name,
      observed_period: agg.observed_period,
      metric_name: 'score',
      metric_value: Math.round(avgScore * 100) / 100,
      audit_count: agg.count
    });
  });
  
  // Sort by period (newest first) then by store_id
  rows.sort((a, b) => {
    if (a.observed_period !== b.observed_period) {
      return b.observed_period.localeCompare(a.observed_period);
    }
    return a.store_id.localeCompare(b.store_id);
  });
  
  return rows;
}

/**
 * Hook to fetch training audit data and calculate monthly trends
 * Returns aggregated data in the same format as the old Monthly_Trends sheet
 */
export function useTrendsData() {
  const [auditRows, setAuditRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoogleSheets()
      .then((rows) => {
        setAuditRows(rows);
        setError(null);
      })
      .catch((e) => {
        console.error('Error fetching training audit data:', e);
        setError(e.message);
        setAuditRows([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Calculate monthly trends from raw audit data
  const trendRows = useMemo(() => {
    if (auditRows.length === 0) return [];
    return aggregateMonthlyTrends(auditRows);
  }, [auditRows]);

  return {
    rows: trendRows,
    loading,
    error,
    sheetRowsCount: auditRows.length,
    totalRowsCount: trendRows.length,
  };
}
