/**
 * Google Apps Script to automatically sync training audit data to Monthly_Trends sheet
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this entire script to your Google Apps Script editor
 * 2. Update the CONFIG section below with your sheet names and column mappings
 * 3. Run 'syncMonthlyTrends()' manually first to test
 * 4. Set up a trigger: Edit > Current project's triggers > Add Trigger
 *    - Function: syncMonthlyTrends
 *    - Event source: Time-driven
 *    - Type: Hour timer / Every hour (or your preference)
 * 
 * WHAT IT DOES:
 * - Reads all training audit submissions from your live sheet
 * - Groups audits by store_id + month
 * - For multiple audits in same month: takes the LATEST one (by submission date)
 * - Writes/updates the Monthly_Trends sheet with latest data
 */

// ============================================================================
// CONFIGURATION - UPDATE THESE TO MATCH YOUR SHEETS
// ============================================================================

const CONFIG = {
  // YOUR SPREADSHEET ID - Get this from your sheet's URL
  // URL format: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
  // IMPORTANT: Replace 'YOUR_SPREADSHEET_ID_HERE' with your actual spreadsheet ID
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  
  // Name of your live training audit sheet (where form submissions go)
  AUDIT_SHEET_NAME: 'Training Audit',
  
  // Name of your monthly trends sheet (where aggregated data goes)
  TRENDS_SHEET_NAME: 'Monthly_Trends',
  
  // Column mappings for AUDIT sheet (1-based index)
  // Based on your actual column headers:
  AUDIT_COLUMNS: {
    STORE_ID: 8,        // Column H - Store ID
    STORE_NAME: 7,      // Column G - Store Name
    SCORE: 70,          // Column BR - Total Score
    PERCENTAGE: 72,     // Column BT - Percentage
    SUBMISSION_DATE: 2, // Column B - Submission Time
  },
  
  // Timezone for date calculations
  TIMEZONE: 'Asia/Kolkata',
  
  // Starting month for audits (to exclude earlier data)
  START_MONTH: '2025-07', // July 2025
};

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

/**
 * Main function to sync training audits to monthly trends
 * Run this manually first, then set up as a time-based trigger
 */
function syncMonthlyTrends() {
  try {
    Logger.log('Starting monthly trends sync...');
    
    // Try to get spreadsheet - either active (if container-bound) or by ID (if standalone)
    let ss;
    
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      // Not container-bound, try using SPREADSHEET_ID
      if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
        Logger.log('Using SPREADSHEET_ID from CONFIG...');
        ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      }
    }
    
    // Check if we have a valid spreadsheet reference
    if (!ss) {
      throw new Error('No spreadsheet found. Either:\n1. Open this script from Extensions > Apps Script in your Google Sheet, OR\n2. Set CONFIG.SPREADSHEET_ID to your sheet\'s ID from the URL');
    }
    
    Logger.log('Spreadsheet found: ' + ss.getName());
    
    const auditSheet = ss.getSheetByName(CONFIG.AUDIT_SHEET_NAME);
    const trendsSheet = ss.getSheetByName(CONFIG.TRENDS_SHEET_NAME);
    
    if (!auditSheet) {
      throw new Error(`Audit sheet "${CONFIG.AUDIT_SHEET_NAME}" not found. Please update CONFIG.AUDIT_SHEET_NAME`);
    }
    
    if (!trendsSheet) {
      throw new Error(`Trends sheet "${CONFIG.TRENDS_SHEET_NAME}" not found.`);
    }
    
    // Step 1: Read all audit data
    const auditData = readAuditData(auditSheet);
    Logger.log(`Read ${auditData.length} audit records`);
    
    // Step 2: Aggregate by store + month
    const monthlyAggregates = aggregateByMonth(auditData);
    Logger.log(`Aggregated into ${Object.keys(monthlyAggregates).length} store-month combinations`);
    
    // Step 3: Write to Monthly_Trends sheet
    writeMonthlyTrends(trendsSheet, monthlyAggregates);
    
    Logger.log('✅ Monthly trends sync completed successfully!');
    
    // Optional: Show completion message (only works when run manually)
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast('Monthly trends updated successfully!', 'Sync Complete', 3);
    } catch (e) {
      // Toast doesn't work in triggers, ignore
    }
    
  } catch (error) {
    Logger.log('❌ Error syncing monthly trends: ' + error.toString());
    Logger.log(error.stack);
    
    // Optional: Send email notification on error
    // MailApp.sendEmail('your-email@example.com', 'Monthly Trends Sync Error', error.toString());
    
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Read all audit data from the audit sheet
 */
function readAuditData(sheet) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return []; // Empty sheet (header only)
  }
  
  const data = [];
  
  // Read data row by row (starting from row 2, skipping header)
  for (let i = 2; i <= lastRow; i++) {
    try {
      const storeId = sheet.getRange(i, CONFIG.AUDIT_COLUMNS.STORE_ID).getValue();
      
      // Skip empty rows
      if (!storeId) continue;
      
      const storeName = sheet.getRange(i, CONFIG.AUDIT_COLUMNS.STORE_NAME).getValue();
      const score = sheet.getRange(i, CONFIG.AUDIT_COLUMNS.SCORE).getValue();
      const percentage = sheet.getRange(i, CONFIG.AUDIT_COLUMNS.PERCENTAGE).getValue();
      const submissionDate = sheet.getRange(i, CONFIG.AUDIT_COLUMNS.SUBMISSION_DATE).getValue();
      
      // Convert submission date to YYYY-MM format
      let observedPeriod = '';
      if (submissionDate instanceof Date) {
        const year = submissionDate.getFullYear();
        const month = String(submissionDate.getMonth() + 1).padStart(2, '0');
        observedPeriod = `${year}-${month}`;
      } else {
        // Try to parse string date
        const dateObj = new Date(submissionDate);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          observedPeriod = `${year}-${month}`;
        }
      }
      
      // Skip if we couldn't determine the period or if it's before START_MONTH
      if (!observedPeriod || observedPeriod < CONFIG.START_MONTH) {
        continue;
      }
      
      data.push({
        storeId: String(storeId).trim(),
        storeName: String(storeName).trim(),
        score: parseFloat(score) || 0,
        percentage: parseFloat(percentage) || 0,
        observedPeriod: observedPeriod,
        submissionDate: submissionDate
      });
      
    } catch (rowError) {
      Logger.log(`Error reading row ${i}: ${rowError.toString()}`);
    }
  }
  
  return data;
}

/**
 * Aggregate audit data by store + month
 * Takes the LATEST audit for each store-month combination (not average)
 * Returns object: { "S001|2025-07": { storeId, storeName, observedPeriod, score, percentage, submissionDate, count }, ... }
 */
function aggregateByMonth(auditData) {
  const aggregates = {};
  
  auditData.forEach(audit => {
    const key = `${audit.storeId}|${audit.observedPeriod}`;
    
    if (!aggregates[key]) {
      // First audit for this store-month
      aggregates[key] = {
        storeId: audit.storeId,
        storeName: audit.storeName,
        observedPeriod: audit.observedPeriod,
        score: audit.score,
        percentage: audit.percentage,
        submissionDate: audit.submissionDate,
        count: 1
      };
    } else {
      // Multiple audits for same store-month - keep the latest one
      aggregates[key].count += 1;
      
      // Compare submission dates - keep the latest
      if (audit.submissionDate > aggregates[key].submissionDate) {
        aggregates[key].score = audit.score;
        aggregates[key].percentage = audit.percentage;
        aggregates[key].storeName = audit.storeName;
        aggregates[key].submissionDate = audit.submissionDate;
      }
    }
  });
  
  return aggregates;
}

/**
 * Write aggregated data to Monthly_Trends sheet
 * Format matches your existing structure:
 * store_id | store_name | metric_name | metric_value | period_type | observed_period | ... | notes
 * 
 * UPDATED: Now preserves existing data and only updates/adds new rows
 */
function writeMonthlyTrends(sheet, aggregates) {
  // Read existing data from Monthly_Trends (skip header row)
  const existingData = [];
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    const existingRange = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    existingRange.forEach(row => {
      // Only keep rows NOT from auto_sync (preserve manual entries)
      if (row[9] !== 'auto_sync') {
        existingData.push(row);
      }
    });
  }
  
  // Prepare new rows from sync
  const syncRows = [];
  const timestamp = new Date();
  
  Object.keys(aggregates).sort().forEach(key => {
    const agg = aggregates[key];
    
    // Row for score metric
    syncRows.push([
      agg.storeId,                    // store_id
      agg.storeName,                  // store_name
      'score',                        // metric_name
      agg.score,                      // metric_value (latest audit)
      'monthly',                      // period_type
      agg.observedPeriod,            // observed_period (as text: "2025-07")
      '',                            // observed_local_time (optional)
      CONFIG.TIMEZONE,               // store_timezone
      timestamp,                     // submission_time_utc
      'auto_sync',                   // source
      agg.count > 1 
        ? `Latest of ${agg.count} audits from ${CONFIG.AUDIT_SHEET_NAME}`
        : `Auto-synced from ${CONFIG.AUDIT_SHEET_NAME}` // notes
    ]);
    
    // Row for percentage metric
    syncRows.push([
      agg.storeId,
      agg.storeName,
      'percentage',
      agg.percentage,                 // metric_value (latest audit)
      'monthly',
      agg.observedPeriod,
      '',
      CONFIG.TIMEZONE,
      timestamp,
      'auto_sync',
      agg.count > 1 
        ? `Latest of ${agg.count} audits from ${CONFIG.AUDIT_SHEET_NAME}`
        : `Auto-synced from ${CONFIG.AUDIT_SHEET_NAME}`
    ]);
  });
  
  // Combine: existing manual data + new sync data
  const allRows = [...existingData, ...syncRows];
  
  // Clear sheet and write all data
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  if (allRows.length > 0) {
    sheet.getRange(2, 1, allRows.length, allRows[0].length).setValues(allRows);
    
    // Format the observed_period column as text to prevent date conversion
    const periodColumn = 6; // Column F
    sheet.getRange(2, periodColumn, allRows.length, 1).setNumberFormat('@'); // @ = text format
    
    Logger.log(`✅ Wrote ${allRows.length} total rows (${existingData.length} manual + ${syncRows.length} synced) to ${CONFIG.TRENDS_SHEET_NAME}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS FOR MANUAL TESTING
// ============================================================================

/**
 * Test function - reads and logs audit data
 */
function testReadAuditData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.AUDIT_SHEET_NAME);
  const data = readAuditData(sheet);
  
  Logger.log('Sample audit records:');
  data.slice(0, 5).forEach(record => {
    Logger.log(JSON.stringify(record, null, 2));
  });
  
  Logger.log(`Total records: ${data.length}`);
}

/**
 * Test function - shows aggregated data
 */
function testAggregation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.AUDIT_SHEET_NAME);
  const data = readAuditData(sheet);
  const aggregates = aggregateByMonth(data);
  
  Logger.log('Sample aggregates:');
  Object.keys(aggregates).slice(0, 5).forEach(key => {
    Logger.log(JSON.stringify(aggregates[key], null, 2));
  });
}

/**
 * Menu function - adds custom menu to Google Sheets
 * Run this once to add a menu item for easy manual syncing
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Training Data')
    .addItem('🔄 Sync Monthly Trends', 'syncMonthlyTrends')
    .addSeparator()
    .addItem('🧪 Test Read Audits', 'testReadAuditData')
    .addItem('🧪 Test Aggregation', 'testAggregation')
    .addToUi();
}
