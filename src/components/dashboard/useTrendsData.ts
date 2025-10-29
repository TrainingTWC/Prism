import { useEffect, useState, useMemo } from 'react';

type Row = any;

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbytDw7gOZXNJdJ-oS_G347Xj9NiUxBRmPfmwRZgQ3SbKqZ2OQ2D0j5nNm91vxMOrlwRQg/exec';

async function fetchGoogleSheets() {
  try {
    console.log('📡 Fetching Monthly_Trends from Google Sheets...', GOOGLE_SHEETS_URL);
    const r = await fetch(GOOGLE_SHEETS_URL);
    console.log('📡 Response status:', r.status, r.statusText);
    const j = await r.json();
    console.log('📡 JSON response received:', { hasRows: !!j.rows, rowCount: (j.rows || []).length, responseKeys: Object.keys(j) });
    const rows = j.rows || [];
    
    console.log('📡 Raw rows from Google Sheets:', rows.length);
    
    // Filter out June 2025 data and normalize observed_period format
    const processed = rows
      .map((row: any) => {
        let period = row.observed_period;
        const original = period;
        
        // Convert date strings to YYYY-MM format
        if (typeof period === 'string' && period.includes('/')) {
          // Parse dates like "6/30/2025 6:30:00 PM" or "6/30/2025"
          const match = period.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            const month = match[1].padStart(2, '0');
            const year = match[3];
            period = `${year}-${month}`;
          }
        }
        
        return { ...row, observed_period: period, _original_period: original };
      })
      .filter((row: any) => {
        // Exclude June 2025 data (2025-06)
        const dateStr = row.observed_period || '';
        const originalStr = row._original_period || '';
        
        // Check for June 2025 in various formats
        const isJune2025 = 
          dateStr === '2025-06' || 
          dateStr.startsWith('2025-06-') || // Matches "2025-06-30T18:30:00.000Z"
          originalStr.startsWith('2025-06-') ||
          (typeof dateStr === 'string' && dateStr.includes('6/') && dateStr.includes('2025'));
        
        if (isJune2025) {
          console.log('Filtering out June 2025 data:', row.store_id, originalStr);
        }
        
        return !isJune2025;
      });
    
    console.log('📡 Filtered rows (after removing June):', processed.length);
    console.log('📡 Sample periods:', processed.slice(0, 5).map(r => r.observed_period));
    
    return processed;
  } catch (e) {
    console.error('❌ Failed to fetch from Google Sheets:', e);
    return [];
  }
}

/**
 * Hook to fetch data ONLY from Google Sheets
 * Returns data and loading state
 */
export function useTrendsData() {
  const [sheetRows, setSheetRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useTrendsData: Starting data fetch...');
    fetchGoogleSheets()
      .then((rows) => {
        console.log('✅ useTrendsData: Fetched', rows.length, 'rows');
        setSheetRows(rows);
        setError(null);
      })
      .catch((e) => {
        console.error('❌ useTrendsData: Error fetching Google Sheets:', e);
        setError(e.message);
        setSheetRows([]);
      })
      .finally(() => {
        console.log('✅ useTrendsData: Fetch complete, loading = false');
        setLoading(false);
      });
  }, []);

  // ONLY use Google Sheets data - no local fallback
  const combinedRows = useMemo(() => {
    console.log('📊 useTrendsData: Returning', sheetRows.length, 'rows to dashboard');
    return sheetRows;
  }, [sheetRows]);

  return {
    rows: combinedRows,
    loading,
    error,
    sheetRowsCount: sheetRows.length,
    totalRowsCount: combinedRows.length,
  };
}
