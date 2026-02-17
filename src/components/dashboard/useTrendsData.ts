import { useEffect, useState, useMemo } from 'react';
import { TRAINING_QUESTIONS } from '../../../constants';

type Row = any;

// Use the UPDATED Training Audit endpoint
const TRAINING_AUDIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwn4bXmjoXaTI7UMfDhzQwG6SZGZCq-qlVC_mQUnCZm0YiciqtaGgtdRJiq4oi505na3w/exec';

// Helper function to check if value is NA (Not Applicable)
function isNA(v: any): boolean {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (s === 'na' || s === 'n/a' || s === 'not applicable' || s === 'n.a.' || s === 'n a') return true;
  if (/^n\s*\/?\s*a$/.test(s)) return true;
  if (/not\s+applicab/.test(s)) return true;
  return false;
}

// Helper function to resolve submission value with fallbacks for TSA fields
function resolveSubmissionValue(submission: any, qId: string): any {
  if (!submission) return undefined;
  if (submission[qId] !== undefined) return submission[qId];

  // Handle TSA score legacy keys
  if (qId === 'TSA_Food_Score') return submission['TSA_Food_Score'] ?? submission['tsaFoodScore'] ?? submission['TSA_1'] ?? undefined;
  if (qId === 'TSA_Coffee_Score') return submission['TSA_Coffee_Score'] ?? submission['tsaCoffeeScore'] ?? submission['TSA_2'] ?? undefined;
  if (qId === 'TSA_CX_Score') return submission['TSA_CX_Score'] ?? submission['tsaCXScore'] ?? submission['TSA_3'] ?? undefined;

  return submission[qId];
}

// Recalculate scores from individual question responses
function recalculateTrainingScore(submission: any): { totalScore: number; maxScore: number; percentage: number } {
  let total = 0;
  let max = 0;

  for (const q of TRAINING_QUESTIONS) {
    const ans = resolveSubmissionValue(submission, q.id);
    
    // For TSA score fields, use the pre-calculated scores directly (0/5/10)
    if (q.id === 'TSA_Food_Score' || q.id === 'TSA_Coffee_Score' || q.id === 'TSA_CX_Score') {
      const tsaScore = parseFloat(String(ans || '0'));
      if (!isNaN(tsaScore) && tsaScore > 0) {
        total += tsaScore;
        max += 10; // Each TSA section has max of 10
      } else if (!isNA(ans)) {
        max += 10;
      }
      continue;
    }
    
    // Skip if marked as NA
    if (isNA(ans)) {
      continue;
    }

    // Calculate max score for this question
    let qMax = 0;
    if (q.choices && q.choices.length) {
      qMax = Math.max(...q.choices.map((c: any) => Number(c.score) || 0));
    } else if (q.type === 'input') {
      qMax = 10;
    } else {
      qMax = 1;
    }

    // Calculate actual score
    let numeric = 0;
    if (ans !== undefined && ans !== null && ans !== '') {
      if (q.choices && q.choices.length) {
        const found = q.choices.find((c: any) => String(c.label).toLowerCase() === String(ans).toLowerCase());
        if (found) numeric = Number(found.score) || 0;
      } else if (q.type === 'input') {
        const n = parseFloat(String(ans));
        numeric = isNaN(n) ? 0 : n;
      } else {
        const low = String(ans).toLowerCase();
        if (low === 'yes' || low === 'y' || low === 'true') numeric = 1;
        if (low === 'no' || low === 'n' || low === 'false') numeric = 0;
      }
    }

    total += numeric;
    max += qMax;
  }

  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  
  return {
    totalScore: total,
    maxScore: max,
    percentage: pct
  };
}

/**
 * Fetches raw training audit data from Google Sheets
 * Includes retry logic to handle Chrome QUIC protocol errors
 */
async function fetchGoogleSheets() {
  const url = TRAINING_AUDIT_ENDPOINT + '?action=getData';
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📡 [Trends] Attempt ${attempt}/${MAX_RETRIES} - fetching training data`);

      const r = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow',
      });

      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      }

      const j = await r.json();
      const rows = Array.isArray(j) ? j : (j.rows || []);
      console.log(`✅ [Trends] Got ${rows.length} rows on attempt ${attempt}`);
      return rows;
    } catch (e) {
      console.warn(`⚠️ [Trends] Attempt ${attempt}/${MAX_RETRIES} failed:`, e);
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  console.error('❌ [Trends] All retry attempts failed');
  return [];
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
    
    // CRITICAL FIX: Recalculate score from individual question responses
    // This fixes incorrect stored scores due to previous calculation bugs
    const recalculated = recalculateTrainingScore(row);
    const percentage = recalculated.percentage;
    const totalScore = recalculated.totalScore;
    
    // Log if there's a significant difference (for debugging)
    const storedPct = parseFloat(row['Percentage'] || row.percentage || row.percentageScore || row.percentage_score || '0');
    if (Math.abs(storedPct - percentage) > 5) {
      console.log(`📊 Trends recalculation for ${storeName} (${storeId}) in ${period}:`, {
        stored: `${storedPct}%`,
        recalculated: `${percentage}%`
      });
    }
    
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
