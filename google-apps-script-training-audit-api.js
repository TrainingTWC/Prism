/**
 * TRAINING AUDIT API - Direct Read from Training Audit Sheet
 * This script reads directly from the Training Audit sheet to provide:
 * - All audit records with full details
 * - Summary metrics (total submissions, stores covered, store health, average score)
 * 
 * Usage: Deploy as web app, call via GET request
 */

const CONFIG = {
  AUDIT_SHEET_NAME: 'Training Audit',
  CHUNK_SIZE: 50,
  TIMEZONE: 'Asia/Kolkata'
};

/**
 * TRAINING CHECKLIST - GOOGLE APPS SCRIPT (UPDATED VERSION)
 * Updated with new training checklist fields as specified
 * URL: https://script.google.com/macros/s/AKfycby4mvh50i16eJKxzJ23u9FgOimnl-q_qZlcUUcFygn39S0t8pQAg1rii8vTzb5vhAGchg/exec
 */

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const auditSheet = ss.getSheetByName(CONFIG.AUDIT_SHEET_NAME);
    
    if (!auditSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: `Sheet "${CONFIG.AUDIT_SHEET_NAME}" not found`
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = readAuditData(auditSheet);
    const summary = calculateSummary(data.records);
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      summary: summary,
      records: data.records,
      metadata: {
        totalRows: data.totalRows,
        headerRow: data.headerRow,
        timestamp: new Date().toISOString()
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Read all audit data from Training Audit sheet
 */
function readAuditData(sheet) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return { records: [], totalRows: 0, headerRow: [] };
  }
  
  // Read header row
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  const headerRow = headerRange.getValues()[0];
  
  Logger.log('Reading Training Audit data...');
  Logger.log('Total rows (including header): ' + lastRow);
  Logger.log('Total columns: ' + headerRow.length);
  
  // Column positions (0-indexed in arrays, but 1-indexed in spreadsheet)
  const COLS = {
    SERVER_TIMESTAMP: 0,
    SUBMISSION_TIME: 1,
    TRAINER_NAME: 2,
    TRAINER_ID: 3,
    AM_NAME: 4,
    AM_ID: 5,
    STORE_NAME: 6,
    STORE_ID: 7,
    REGION: 8,
    MOD: 9,
    HRBP_ID: 10,
    REGIONAL_HR_ID: 11,
    HR_HEAD_ID: 12,
    LMS_HEAD_ID: 13,
    TOTAL_SCORE: 68,      // Column 69 in spreadsheet (BQ)
    PERCENTAGE: 70        // Column 71 in spreadsheet (BS)
  };
  
  const records = [];
  
  // Read data in chunks to handle large datasets
  for (let startRow = 2; startRow <= lastRow; startRow += CONFIG.CHUNK_SIZE) {
    const numRows = Math.min(CONFIG.CHUNK_SIZE, lastRow - startRow + 1);
    
    try {
      // Read essential columns only for performance
      const dataRange = sheet.getRange(startRow, 1, numRows, 71); // Read up to column 71 (BS)
      const rows = dataRange.getValues();
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip empty rows
        if (!row[COLS.STORE_ID] && !row[COLS.SUBMISSION_TIME]) {
          continue;
        }
        
        const submissionTime = row[COLS.SUBMISSION_TIME];
        let observedPeriod = '';
        
        // Extract month from submission time
        if (submissionTime) {
          const date = new Date(submissionTime);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            observedPeriod = `${year}-${month}`;
          }
        }
        
        const score = parseFloat(row[COLS.TOTAL_SCORE]) || 0;
        const percentage = parseFloat(row[COLS.PERCENTAGE]) || 0;
        
        records.push({
          server_timestamp: row[COLS.SERVER_TIMESTAMP],
          submission_time: submissionTime,
          observed_period: observedPeriod,
          trainer_name: row[COLS.TRAINER_NAME] || '',
          trainer_id: row[COLS.TRAINER_ID] || '',
          am_name: row[COLS.AM_NAME] || '',
          am_id: row[COLS.AM_ID] || '',
          store_name: row[COLS.STORE_NAME] || '',
          store_id: row[COLS.STORE_ID] || '',
          region: row[COLS.REGION] || '',
          mod: row[COLS.MOD] || '',
          hrbp_id: row[COLS.HRBP_ID] || '',
          regional_hr_id: row[COLS.REGIONAL_HR_ID] || '',
          hr_head_id: row[COLS.HR_HEAD_ID] || '',
          lms_head_id: row[COLS.LMS_HEAD_ID] || '',
          total_score: score,
          percentage: percentage
        });
      }
      
      Logger.log(`Processed rows ${startRow} to ${startRow + numRows - 1}`);
      
    } catch (chunkError) {
      Logger.log('Error reading chunk starting at row ' + startRow + ': ' + chunkError);
      // Continue with next chunk
    }
  }
  
  Logger.log('Total records extracted: ' + records.length);
  
  return {
    records: records,
    totalRows: lastRow - 1, // Exclude header
    headerRow: headerRow
  };
}

/**
 * Calculate summary metrics from audit records
 */
function calculateSummary(records) {
  if (records.length === 0) {
    return {
      total_submissions: 0,
      stores_covered: 0,
      average_score: 0,
      store_health: {
        healthy: 0,
        warning: 0,
        critical: 0
      }
    };
  }
  
  // Total submissions
  const totalSubmissions = records.length;
  
  // Unique stores
  const uniqueStores = new Set(records.map(r => r.store_id).filter(id => id));
  const storesCovered = uniqueStores.size;
  
  // Average score (percentage)
  const validPercentages = records.filter(r => r.percentage > 0).map(r => r.percentage);
  const averageScore = validPercentages.length > 0
    ? validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length
    : 0;
  
  // Store health calculation
  // Group by store and calculate average percentage for each store
  const storeAverages = new Map();
  
  for (const record of records) {
    if (!record.store_id || record.percentage === 0) continue;
    
    if (!storeAverages.has(record.store_id)) {
      storeAverages.set(record.store_id, { sum: 0, count: 0 });
    }
    
    const storeData = storeAverages.get(record.store_id);
    storeData.sum += record.percentage;
    storeData.count += 1;
  }
  
  let healthy = 0;
  let warning = 0;
  let critical = 0;
  
  for (const [storeId, data] of storeAverages.entries()) {
    const avgPercentage = data.sum / data.count;
    
    if (avgPercentage >= 80) {
      healthy++;
    } else if (avgPercentage >= 60) {
      warning++;
    } else {
      critical++;
    }
  }
  
  return {
    total_submissions: totalSubmissions,
    stores_covered: storesCovered,
    average_score: Math.round(averageScore * 10) / 10, // Round to 1 decimal
    store_health: {
      healthy: healthy,
      warning: warning,
      critical: critical
    }
  };
}
