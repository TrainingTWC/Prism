/**
 * MINIMAL Google Apps Script - Ultra-safe version
 * This version uses the absolute minimum API calls to avoid errors
 */

const SHEET_NAME = 'Monthly_Trends';

function doGet(e) {
  try {
    const data = getMonthlyTrendsDataMinimal();
    const output = ContentService.createTextOutput(JSON.stringify(data, null, 2));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    const errorResponse = {
      ok: false,
      error: error.toString(),
      message: 'Error: ' + error.message,
      stack: error.stack
    };
    const output = ContentService.createTextOutput(JSON.stringify(errorResponse, null, 2));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

function getMonthlyTrendsDataMinimal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return {
      ok: false,
      error: `Sheet "${SHEET_NAME}" not found`,
      rows: []
    };
  }
  
  // Get ONLY the essential columns by column letter
  // A=store_id, B=store_name, C=metric_name, D=metric_value, F=observed_period
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return {
      ok: true,
      rows: [],
      message: 'Sheet is empty'
    };
  }
  
  const rows = [];
  
  // Read one row at a time to avoid memory issues
  for (let i = 2; i <= lastRow; i++) {
    try {
      const storeId = sheet.getRange(i, 1).getValue();
      
      // Skip empty rows
      if (!storeId) continue;
      
      const storeName = sheet.getRange(i, 2).getValue();
      const metricName = sheet.getRange(i, 3).getValue();
      const metricValue = sheet.getRange(i, 4).getValue();
      const observedPeriodRaw = sheet.getRange(i, 6).getValue();
      
      // Format observed_period as YYYY-MM
      let observedPeriod = observedPeriodRaw;
      if (observedPeriodRaw instanceof Date) {
        const year = observedPeriodRaw.getFullYear();
        const month = String(observedPeriodRaw.getMonth() + 1).padStart(2, '0');
        observedPeriod = `${year}-${month}`;
        
        // Skip June 2025 data - audits started from July 2025
        if (observedPeriod === '2025-06') {
          continue;
        }
      } else if (typeof observedPeriodRaw === 'string') {
        // If already a string, keep as is
        observedPeriod = observedPeriodRaw;
        
        // Also skip if string contains June 2025
        if (observedPeriod.includes('2025-06') || 
            (observedPeriod.includes('6/') && observedPeriod.includes('2025'))) {
          continue;
        }
      }
      
      rows.push({
        store_id: storeId,
        store_name: storeName,
        metric_name: metricName,
        metric_value: typeof metricValue === 'number' ? metricValue : parseFloat(metricValue) || 0,
        observed_period: observedPeriod
      });
      
    } catch (rowError) {
      // Skip problematic rows
      Logger.log('Error reading row ' + i + ': ' + rowError.toString());
    }
  }
  
  return {
    ok: true,
    rows: rows,
    metadata: {
      total_rows: rows.length,
      last_updated: new Date().toISOString()
    }
  };
}

// Test function
function testMinimal() {
  const result = getMonthlyTrendsDataMinimal();
  Logger.log('Rows: ' + result.rows.length);
  if (result.rows.length > 0) {
    Logger.log('First row: ' + JSON.stringify(result.rows[0]));
  }
  return result;
}
