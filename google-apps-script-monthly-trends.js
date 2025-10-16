/**
 * Google Apps Script for Monthly Trends Dashboard
 * 
 * This script exposes your "Monthly_Trends" sheet data as a JSON endpoint
 * that your dashboard can fetch from automatically.
 * 
 * Setup Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire script
 * 5. Click "Deploy" → "New deployment"
 * 6. Choose "Web app"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone" (or "Anyone with the link")
 * 9. Click "Deploy"
 * 10. Copy the web app URL
 * 11. Update your dashboard to fetch from this URL
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Name of the sheet tab containing monthly trends data
const SHEET_NAME = 'Monthly_Trends';

// Optional: Enable caching to improve performance (cache for 5 minutes)
const CACHE_DURATION = 300; // seconds

// ============================================================================
// MAIN ENDPOINT HANDLER
// ============================================================================

/**
 * Main function that handles GET requests to the web app
 * 
 * URL format: https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
 * 
 * Query parameters:
 * - store_id: Filter by specific store (optional)
 * - period: Filter by specific period like "2025-07" (optional)
 * - metric: Filter by "score" or "percentage" (optional)
 * - nocache: Set to "1" to bypass cache
 * 
 * Example: ?store_id=S001&period=2025-07
 */
function doGet(e) {
  try {
    // Get query parameters
    const params = e.parameter || {};
    const noCache = params.nocache === '1';
    
    // Try to get from cache first (unless nocache is requested)
    if (!noCache) {
      const cache = CacheService.getScriptCache();
      const cacheKey = 'monthly_trends_' + JSON.stringify(params);
      const cached = cache.get(cacheKey);
      
      if (cached) {
        Logger.log('Returning cached data');
        return createJsonResponse(JSON.parse(cached));
      }
    }
    
    // Fetch data from sheet
    const data = getMonthlyTrendsData(params);
    
    // Cache the result
    if (!noCache && data.rows.length > 0) {
      const cache = CacheService.getScriptCache();
      const cacheKey = 'monthly_trends_' + JSON.stringify(params);
      cache.put(cacheKey, JSON.stringify(data), CACHE_DURATION);
    }
    
    return createJsonResponse(data);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createJsonResponse({
      ok: false,
      error: error.toString(),
      message: 'Failed to fetch monthly trends data'
    });
  }
}

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

/**
 * Reads data from the Monthly_Trends sheet and returns as JSON
 * 
 * @param {Object} filters - Optional filters (store_id, period, metric)
 * @return {Object} - JSON object with rows array
 */
function getMonthlyTrendsData(filters = {}) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return {
      ok: false,
      error: `Sheet "${SHEET_NAME}" not found`,
      message: `Please create a sheet tab named "${SHEET_NAME}" in your Google Sheet`,
      rows: [],
      metadata: {
        sheet_name: SHEET_NAME,
        last_updated: new Date().toISOString(),
        total_rows: 0
      }
    };
  }
  
  // Get the last row with data to avoid processing empty cells
  const lastRow = sheet.getLastRow();
  
  // If sheet is empty or only has headers
  if (lastRow <= 1) {
    return {
      ok: true,
      rows: [],
      metadata: {
        sheet_name: SHEET_NAME,
        last_updated: new Date().toISOString(),
        total_rows: 0,
        message: 'Sheet is empty or only contains headers. Please add data rows.'
      }
    };
  }
  
  // Read data in smaller chunks to avoid "argument too large" error
  const CHUNK_SIZE = 100;
  const headers = sheet.getRange(1, 1, 1, 15).getValues()[0]; // Only read first 15 columns
  const rows = [];
  
  // Process data in chunks
  for (let startRow = 2; startRow <= lastRow; startRow += CHUNK_SIZE) {
    const numRows = Math.min(CHUNK_SIZE, lastRow - startRow + 1);
    const chunkValues = sheet.getRange(startRow, 1, numRows, 15).getValues();
    
    for (let i = 0; i < chunkValues.length; i++) {
      const row = chunkValues[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      const rowObj = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = row[j];
        
        // Convert numeric strings to numbers for metric_value
        if (header === 'metric_value' && typeof value === 'string') {
          rowObj[header] = parseFloat(value) || value;
        } else {
          rowObj[header] = value;
        }
      }
      
      // Apply filters if specified
      if (filters.store_id && rowObj.store_id !== filters.store_id) continue;
      if (filters.period && rowObj.observed_period !== filters.period) continue;
      if (filters.metric && rowObj.metric_name !== filters.metric) continue;
      
      rows.push(rowObj);
    }
  }
  
  return {
    ok: true,
    rows: rows,
    metadata: {
      sheet_name: SHEET_NAME,
      last_updated: new Date().toISOString(),
      total_rows: rows.length,
      filters_applied: Object.keys(filters).length > 0 ? filters : null
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a JSON response with proper CORS headers
 * 
 * @param {Object} data - Data to return as JSON
 * @return {ContentService.TextOutput} - Formatted JSON response
 */
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data, null, 2));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers to allow dashboard to fetch
  // Note: Apps Script web apps handle CORS automatically in most cases
  
  return output;
}

// ============================================================================
// UTILITY FUNCTIONS (FOR TESTING)
// ============================================================================

/**
 * Test function to verify the script works
 * Run this from the Apps Script editor to test
 */
function testGetData() {
  const result = getMonthlyTrendsData({});
  Logger.log('Total rows: ' + result.rows.length);
  
  if (result.rows.length > 0) {
    Logger.log('Sample row: ' + JSON.stringify(result.rows[0], null, 2));
  }
  
  return result;
}

/**
 * Test function with filters
 */
function testGetDataWithFilters() {
  const result = getMonthlyTrendsData({
    store_id: 'S001',
    metric: 'score'
  });
  
  Logger.log('Filtered rows: ' + result.rows.length);
  Logger.log('First 3 rows: ' + JSON.stringify(result.rows.slice(0, 3), null, 2));
  
  return result;
}

/**
 * Helper function to manually clear cache
 * Run this if you want to force fresh data
 */
function clearCache() {
  const cache = CacheService.getScriptCache();
  cache.removeAll(['monthly_trends_{}']);
  Logger.log('Cache cleared');
}

/**
 * Get unique values for a column (useful for debugging)
 */
function getUniqueValues(columnName) {
  const data = getMonthlyTrendsData({});
  const values = new Set();
  
  data.rows.forEach(row => {
    if (row[columnName]) {
      values.add(row[columnName]);
    }
  });
  
  const sorted = Array.from(values).sort();
  Logger.log(`Unique ${columnName}: ${sorted.join(', ')}`);
  return sorted;
}

/**
 * Get summary statistics
 */
function getSummaryStats() {
  const data = getMonthlyTrendsData({});
  
  const stores = new Set();
  const periods = new Set();
  const scoreRows = [];
  const percentageRows = [];
  
  data.rows.forEach(row => {
    stores.add(row.store_id);
    periods.add(row.observed_period);
    
    if (row.metric_name === 'score') {
      scoreRows.push(row.metric_value);
    } else if (row.metric_name === 'percentage') {
      percentageRows.push(row.metric_value);
    }
  });
  
  const avgScore = scoreRows.length > 0 
    ? scoreRows.reduce((a, b) => a + b, 0) / scoreRows.length 
    : 0;
  
  const avgPercentage = percentageRows.length > 0 
    ? percentageRows.reduce((a, b) => a + b, 0) / percentageRows.length 
    : 0;
  
  const summary = {
    total_rows: data.rows.length,
    unique_stores: stores.size,
    unique_periods: Array.from(periods).sort(),
    average_score: avgScore.toFixed(2),
    average_percentage: avgPercentage.toFixed(2),
    score_count: scoreRows.length,
    percentage_count: percentageRows.length
  };
  
  Logger.log('Summary Stats:');
  Logger.log(JSON.stringify(summary, null, 2));
  
  return summary;
}

// ============================================================================
// ADVANCED: WEBHOOK/TRIGGER FUNCTIONS (OPTIONAL)
// ============================================================================

/**
 * Optional: Automatically clear cache when sheet is edited
 * 
 * To enable:
 * 1. Go to "Triggers" (clock icon in Apps Script editor)
 * 2. Add trigger: onSheetEdit → From spreadsheet → On edit
 */
function onSheetEdit(e) {
  // Clear cache when the Monthly_Trends sheet is edited
  if (e.source.getActiveSheet().getName() === SHEET_NAME) {
    Logger.log('Monthly_Trends sheet edited, clearing cache...');
    clearCache();
  }
}

/**
 * Optional: Send data to your backend server when sheet is updated
 * 
 * Uncomment and configure if you want to push data to your server
 * instead of pulling from Apps Script
 */
/*
function sendDataToBackend() {
  const data = getMonthlyTrendsData({});
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      rows: data.rows,
      options: {
        force: true,
        source: 'google_sheets_auto_sync'
      }
    })
  };
  
  // Replace with your actual backend URL
  const backendUrl = 'http://localhost:4001/api/import-metrics';
  
  try {
    const response = UrlFetchApp.fetch(backendUrl, options);
    Logger.log('Data sent to backend: ' + response.getContentText());
  } catch (error) {
    Logger.log('Error sending to backend: ' + error.toString());
  }
}
*/
