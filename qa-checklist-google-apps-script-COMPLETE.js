/**
 * Quality Assurance (QA) Checklist Google Apps Script - COMPLETE VERSION
 * Handles form submissions AND data retrieval for the QA Assessment dashboard
 * Sheet name: QA
 * 
 * IMPORTANT: This script needs to be deployed as a web app with:
 * - Execute as: Me
 * - Who has access: Anyone
 * 
 * Functions:
 * 1. doPost() - Receives QA checklist submissions from the form
 * 2. doGet() - Returns QA data for the dashboard
 * 3. setupQAHeaders() - Sets up the spreadsheet headers
 * 4. testQAScript() - Test function for debugging
 */

/**
 * Handles GET requests to return QA data for the dashboard
 */
function doGet(e) {
  try {
    console.log('QA Data request received');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('QA');
    
    // If no sheet exists or it's empty, return empty array
    if (!sheet || sheet.getLastRow() <= 1) {
      console.log('No QA data found');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data from the sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Remove header row
    const headers = values[0];
    const dataRows = values.slice(1);
    
    console.log(`Found ${dataRows.length} QA submissions`);
    
    // Convert to JSON format expected by dashboard
    const qaSubmissions = dataRows.map(row => {
      const submission = {};
      
      // Map each column to the corresponding field
      headers.forEach((header, index) => {
        const value = row[index];
        
        // Map headers to expected field names
        switch(header) {
          case 'Submission Time':
            submission.submissionTime = value || '';
            break;
          case 'QA Auditor Name':
            submission.qaName = value || '';
            break;
          case 'QA Auditor ID':
            submission.qaId = value || '';
            break;
          case 'Area Manager Name':
            submission.amName = value || '';
            break;
          case 'Area Manager ID':
            submission.amId = value || '';
            break;
          case 'Store Name':
            submission.storeName = value || '';
            break;
          case 'Store ID':
            submission.storeId = value || '';
            break;
          case 'Region':
            submission.region = value || '';
            break;
          case 'Total Score':
            submission.totalScore = value ? value.toString() : '0';
            break;
          case 'Max Score':
            submission.maxScore = value ? value.toString() : '0';
            break;
          case 'Score Percentage':
            submission.scorePercentage = value ? value.toString() : '0';
            break;
          default:
            // For all other fields (questions, remarks), use the header as key
            if (value !== undefined && value !== null) {
              submission[header] = value.toString();
            }
            break;
        }
      });
      
      // Ensure numeric fields are properly formatted
      submission.scorePercentage = parseFloat(submission.scorePercentage) || 0;
      submission.totalScore = parseFloat(submission.totalScore) || 0;
      submission.maxScore = parseFloat(submission.maxScore) || 0;
      
      return submission;
    });
    
    console.log('QA data successfully processed for dashboard');
    
    // Return the data as JSON
    return ContentService
      .createTextOutput(JSON.stringify(qaSubmissions))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error retrieving QA data:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Failed to retrieve QA data', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests to receive QA checklist submissions
 */
function doPost(e) {
  try {
    console.log('QA Survey submission received');
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('QA');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('QA');
      console.log('Created new QA sheet');
    }
    
    // Parse the form data
    const params = e.parameter;
    console.log('Received parameters:', JSON.stringify(params));
    
    // Get current timestamp
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    // Initialize headers if this is the first submission
    if (sheet.getLastRow() === 0) {
      setupQAHeaders(sheet);
    }
    
    // Prepare the row data
    const rowData = [
      timestamp,                                    // A: Timestamp
      params.submissionTime || '',                  // B: Submission Time
      params.qaName || '',                          // C: QA Auditor Name
      params.qaId || '',                           // D: QA Auditor ID
      params.amName || '',                         // E: Area Manager Name
      params.amId || '',                           // F: Area Manager ID
      params.storeName || '',                      // G: Store Name
      params.storeID || '',                        // H: Store ID
      params.region || '',                         // I: Region
      
      // Scoring Information
      parseFloat(params.totalScore) || 0,          // J: Total Score
      parseFloat(params.maxScore) || 0,            // K: Max Score
      parseFloat(params.scorePercentage) || 0,     // L: Score Percentage
      
      // Zero Tolerance Section (6 questions)
      params.ZeroTolerance_ZT_1 || '',            // M: ZT_1 - No expired food products
      params.ZeroTolerance_ZT_2 || '',            // N: ZT_2 - Secondary shelf life compliance
      params.ZeroTolerance_ZT_3 || '',            // O: ZT_3 - Storage conditions
      params.ZeroTolerance_ZT_4 || '',            // P: ZT_4 - Water TDS compliance
      params.ZeroTolerance_ZT_5 || '',            // Q: ZT_5 - Temperature sensitive transfer
      params.ZeroTolerance_ZT_6 || '',            // R: ZT_6 - No pest activity
      params.ZeroTolerance_remarks || '',         // S: Zero Tolerance Remarks
      
      // Maintenance Section (11 questions)
      params.Maintenance_M_1 || '',               // T: M_1 - Window protection
      params.Maintenance_M_2 || '',               // U: M_2 - Structural integrity
      params.Maintenance_M_3 || '',               // V: M_3 - Electrical safety
      params.Maintenance_M_4 || '',               // W: M_4 - Lighting protection
      params.Maintenance_M_5 || '',               // X: M_5 - Fire extinguishers
      params.Maintenance_M_6 || '',               // Y: M_6 - Pest entry prevention
      params.Maintenance_M_7 || '',               // Z: M_7 - Pest control devices
      params.Maintenance_M_8 || '',               // AA: M_8 - Equipment maintenance records
      params.Maintenance_M_9 || '',               // AB: M_9 - Plumbing fixtures
      params.Maintenance_M_10 || '',              // AC: M_10 - Refrigeration equipment
      params.Maintenance_M_11 || '',              // AD: M_11 - Water service records
      params.Maintenance_remarks || '',           // AE: Maintenance Remarks
      
      // Store Operations Section (16 questions)
      params.StoreOperations_SO_1 || '',          // AF: SO_1 - Previous audit CAPA
      params.StoreOperations_SO_2 || '',          // AG: SO_2 - No junk material
      params.StoreOperations_SO_3 || '',          // AH: SO_3 - Dishwasher/sink cleanliness
      params.StoreOperations_SO_4 || '',          // AI: SO_4 - Glass doors condition
      params.StoreOperations_SO_5 || '',          // AJ: SO_5 - Equipment area cleanliness
      params.StoreOperations_SO_6 || '',          // AK: SO_6 - Customer furniture condition
      params.StoreOperations_SO_7 || '',          // AL: SO_7 - Floor storage prevention
      params.StoreOperations_SO_8 || '',          // AM: SO_8 - Food contact materials
      params.StoreOperations_SO_9 || '',          // AN: SO_9 - Color coded segregation
      params.StoreOperations_SO_10 || '',         // AO: SO_10 - Glasses arrangement
      params.StoreOperations_SO_11 || '',         // AP: SO_11 - Equipment cleaning SOP
      params.StoreOperations_SO_12 || '',         // AQ: SO_12 - Temperature maintenance
      params.StoreOperations_SO_13 || '',         // AR: SO_13 - Merry chef condition
      params.StoreOperations_SO_14 || '',         // AS: SO_14 - Kitchen equipment operational
      params.StoreOperations_SO_15 || '',         // AT: SO_15 - Coffee equipment maintenance
      params.StoreOperations_SO_16 || '',         // AU: SO_16 - Small wares condition
      params.StoreOperations_remarks || '',       // AV: Store Operations Remarks
      
      // Hygiene & Compliance Section (6 questions)
      params.HygieneCompliance_HC_1 || '',        // AW: HC_1 - Medical records
      params.HygieneCompliance_HC_2 || '',        // AX: HC_2 - Annual medical examination
      params.HygieneCompliance_HC_3 || '',        // AY: HC_3 - Partner grooming
      params.HygieneCompliance_HC_4 || '',        // AZ: HC_4 - Personal hygiene
      params.HygieneCompliance_HC_5 || '',        // BA: HC_5 - Hand washing procedures
      params.HygieneCompliance_HC_6 || '',        // BB: HC_6 - Glove usage
      params.HygieneCompliance_remarks || ''      // BC: Hygiene & Compliance Remarks
    ];
    
    // Add the data to the sheet
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    
    console.log('QA survey data successfully saved to sheet');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success', 
        message: 'QA survey submitted successfully',
        timestamp: timestamp 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing QA survey submission:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sets up the header row for the QA sheet
 */
function setupQAHeaders(sheet) {
  const headers = [
    // Basic Information
    'Timestamp',                                 // A
    'Submission Time',                           // B
    'QA Auditor Name',                          // C
    'QA Auditor ID',                           // D
    'Area Manager Name',                        // E
    'Area Manager ID',                          // F
    'Store Name',                               // G
    'Store ID',                                // H
    'Region',                                  // I
    
    // Scoring Information
    'Total Score',                             // J
    'Max Score',                               // K
    'Score Percentage',                        // L
    
    // Zero Tolerance Section
    'ZT_1: No expired food products',          // M
    'ZT_2: Secondary shelf life compliance',   // N
    'ZT_3: Storage conditions',                // O
    'ZT_4: Water TDS compliance',              // P
    'ZT_5: Temperature sensitive transfer',    // Q
    'ZT_6: No pest activity',                  // R
    'Zero Tolerance Remarks',                  // S
    
    // Maintenance Section
    'M_1: Window protection',                  // T
    'M_2: Structural integrity',               // U
    'M_3: Electrical safety',                  // V
    'M_4: Lighting protection',                // W
    'M_5: Fire extinguishers',                 // X
    'M_6: Pest entry prevention',              // Y
    'M_7: Pest control devices',               // Z
    'M_8: Equipment maintenance records',      // AA
    'M_9: Plumbing fixtures',                  // AB
    'M_10: Refrigeration equipment',           // AC
    'M_11: Water service records',             // AD
    'Maintenance Remarks',                     // AE
    
    // Store Operations Section
    'SO_1: Previous audit CAPA',               // AF
    'SO_2: No junk material',                  // AG
    'SO_3: Dishwasher/sink cleanliness',       // AH
    'SO_4: Glass doors condition',             // AI
    'SO_5: Equipment area cleanliness',        // AJ
    'SO_6: Customer furniture condition',      // AK
    'SO_7: Floor storage prevention',          // AL
    'SO_8: Food contact materials',            // AM
    'SO_9: Color coded segregation',           // AN
    'SO_10: Glasses arrangement',              // AO
    'SO_11: Equipment cleaning SOP',           // AP
    'SO_12: Temperature maintenance',          // AQ
    'SO_13: Merry chef condition',             // AR
    'SO_14: Kitchen equipment operational',    // AS
    'SO_15: Coffee equipment maintenance',     // AT
    'SO_16: Small wares condition',            // AU
    'Store Operations Remarks',                // AV
    
    // Hygiene & Compliance Section
    'HC_1: Medical records',                   // AW
    'HC_2: Annual medical examination',        // AX
    'HC_3: Partner grooming',                  // AY
    'HC_4: Personal hygiene',                  // AZ
    'HC_5: Hand washing procedures',           // BA
    'HC_6: Glove usage',                       // BB
    'Hygiene & Compliance Remarks'            // BC
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#dc2626'); // Red background for QA
  headerRange.setFontColor('white');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  console.log('QA sheet headers set up successfully');
}

/**
 * Test function to verify the script setup - creates sample data
 */
function testQAScript() {
  console.log('Testing QA script setup...');
  
  // Test data for POST (submission)
  const testData = {
    parameter: {
      submissionTime: '05/10/2025 14:30:00',
      qaName: 'Sarah QA Inspector',
      qaId: 'QA002',
      amName: 'John Area Manager',
      amId: 'AM015',
      storeName: 'Starbucks - Mall Plaza',
      storeID: 'SB-MP-001',
      region: 'Central Region',
      totalScore: 85,
      maxScore: 100,
      scorePercentage: 85,
      ZeroTolerance_ZT_1: 'yes',
      ZeroTolerance_ZT_2: 'yes',
      ZeroTolerance_ZT_3: 'no',
      ZeroTolerance_ZT_4: 'yes',
      ZeroTolerance_ZT_5: 'yes',
      ZeroTolerance_ZT_6: 'yes',
      ZeroTolerance_remarks: 'Storage conditions need improvement',
      Maintenance_M_1: 'yes',
      Maintenance_M_2: 'yes',
      Maintenance_M_3: 'yes',
      Maintenance_M_4: 'no',
      Maintenance_M_5: 'yes',
      Maintenance_M_6: 'yes',
      Maintenance_M_7: 'yes',
      Maintenance_M_8: 'yes',
      Maintenance_M_9: 'yes',
      Maintenance_M_10: 'yes',
      Maintenance_M_11: 'yes',
      Maintenance_remarks: 'Lighting needs attention',
      StoreOperations_SO_1: 'yes',
      StoreOperations_SO_2: 'yes',
      StoreOperations_SO_3: 'yes',
      StoreOperations_SO_4: 'yes',
      StoreOperations_SO_5: 'yes',
      StoreOperations_SO_6: 'yes',
      StoreOperations_SO_7: 'yes',
      StoreOperations_SO_8: 'yes',
      StoreOperations_SO_9: 'yes',
      StoreOperations_SO_10: 'yes',
      StoreOperations_SO_11: 'yes',
      StoreOperations_SO_12: 'yes',
      StoreOperations_SO_13: 'yes',
      StoreOperations_SO_14: 'yes',
      StoreOperations_SO_15: 'yes',
      StoreOperations_SO_16: 'yes',
      StoreOperations_remarks: 'All operations running smoothly',
      HygieneCompliance_HC_1: 'yes',
      HygieneCompliance_HC_2: 'yes',
      HygieneCompliance_HC_3: 'yes',
      HygieneCompliance_HC_4: 'yes',
      HygieneCompliance_HC_5: 'yes',
      HygieneCompliance_HC_6: 'yes',
      HygieneCompliance_remarks: 'Excellent hygiene standards maintained'
    }
  };
  
  // Test POST function
  const postResult = doPost(testData);
  console.log('POST Test result:', postResult.getContent());
  
  // Test GET function
  const getResult = doGet({});
  console.log('GET Test result:', getResult.getContent());
}

/**
 * Function to get QA submission statistics (for debugging)
 */
function getQAStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QA');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return { totalSubmissions: 0, avgScore: 0, regions: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const submissions = data.slice(1); // Remove header row
  
  const totalSubmissions = submissions.length;
  const scores = submissions.map(row => parseFloat(row[11]) || 0); // Score Percentage column
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / totalSubmissions;
  
  const regions = [...new Set(submissions.map(row => row[8]).filter(region => region))];
  
  return {
    totalSubmissions,
    avgScore: Math.round(avgScore * 100) / 100,
    regions,
    lastSubmission: submissions[submissions.length - 1][0] // Latest timestamp
  };
}

/**
 * Function to clear all QA data (for testing purposes)
 */
function clearQAData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QA');
  
  if (sheet) {
    sheet.clear();
    setupQAHeaders(sheet);
    console.log('QA data cleared and headers reset');
  }
}