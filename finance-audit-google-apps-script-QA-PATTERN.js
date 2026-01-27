/**
 * Finance Audit Google Apps Script - COMPLETE VERSION (Based on QA Script Pattern)
 * Handles form submissions and data retrieval for the Finance Assessment dashboard
 * Sheet name: Finance Audit
 * 
 * IMPORTANT: This script needs to be deployed as a web app with:
 * - Execute as: Me
 * - Who has access: Anyone
 * 
 * STRUCTURE: 30 Total Questions + Metadata + Signatures
 * - Cash Management: 8 questions (CM_1 to CM_8)
 * - Sales Revenue: 7 questions (SR_1 to SR_7)
 * - Inventory Finance: 8 questions (IF_1 to IF_8)
 * - Compliance Reporting: 7 questions (CR_1 to CR_7)
 * - Total Columns: 48 (12 metadata + 30 questions + 4 remarks + 2 signatures)
 * 
 * Functions:
 * 1. doPost() - Receives Finance audit submissions
 * 2. doGet() - Returns Finance data for the dashboard
 * 3. setupFinanceHeaders() - Sets up the spreadsheet headers
 * 4. testFinanceScript() - Test function for debugging
 */

/**
 * Handles GET requests to return Finance data for the dashboard
 */
function doGet(e) {
  try {
    Logger.log('=== Finance Data GET Request Started ===');
    Logger.log('Request timestamp: ' + new Date().toISOString());
    console.log('Finance Data request received');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Spreadsheet accessed: ' + ss.getName());
    let sheet = ss.getSheetByName('Finance Audit');
    
    // If no sheet exists or it's empty, return empty array
    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log('No Finance data found - sheet empty or does not exist');
      console.log('No Finance data found');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('Finance Audit sheet found with ' + sheet.getLastRow() + ' rows');
    
    // Get all data from the sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Remove header row
    const headers = values[0];
    const dataRows = values.slice(1);
    
    Logger.log('Headers found: ' + headers.length + ' columns');
    Logger.log('Data rows found: ' + dataRows.length + ' submissions');
    console.log(`Found ${dataRows.length} Finance submissions`);
    
    Logger.log('Starting data processing...');
    // Convert to JSON format expected by dashboard
    const financeSubmissions = dataRows.map((row, index) => {
      const submission = {};
      
      // Map each column to the corresponding field
      headers.forEach((header, index) => {
        const value = row[index];
        
        // Map headers to expected field names
        switch(header) {
          case 'Submission Time':
            submission.submissionTime = value || '';
            break;
          case 'Finance Auditor Name':
            submission.financeAuditorName = value || '';
            break;
          case 'Finance Auditor ID':
            submission.financeAuditorId = value || '';
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
            // For question headers, extract the question ID and add section prefix
            if (header.startsWith('CM_')) {
              const questionId = header.split(':')[0]; // Extract "CM_1" from "CM_1: Daily cash..."
              submission['CashManagement_' + questionId] = value !== undefined && value !== null ? value.toString() : '';
            } else if (header.startsWith('SR_')) {
              const questionId = header.split(':')[0];
              submission['SalesRevenue_' + questionId] = value !== undefined && value !== null ? value.toString() : '';
            } else if (header.startsWith('IF_')) {
              const questionId = header.split(':')[0];
              submission['InventoryFinance_' + questionId] = value !== undefined && value !== null ? value.toString() : '';
            } else if (header.startsWith('CR_')) {
              const questionId = header.split(':')[0];
              submission['ComplianceReporting_' + questionId] = value !== undefined && value !== null ? value.toString() : '';
            } else if (header === 'Cash Management Remarks') {
              submission['CashManagement_remarks'] = value !== undefined && value !== null ? value.toString() : '';
            } else if (header === 'Sales Revenue Remarks') {
              submission['SalesRevenue_remarks'] = value !== undefined && value !== null ? value.toString() : '';
            } else if (header === 'Inventory Finance Remarks') {
              submission['InventoryFinance_remarks'] = value !== undefined && value !== null ? value.toString() : '';
            } else if (header === 'Compliance Reporting Remarks') {
              submission['ComplianceReporting_remarks'] = value !== undefined && value !== null ? value.toString() : '';
            } else if (header === 'Auditor Signature') {
              submission.auditorSignature = value || '';
            } else if (header === 'SM Signature') {
              submission.smSignature = value || '';
            } else {
              // For any other fields, use the header as-is
              if (value !== undefined && value !== null) {
                submission[header] = value.toString();
              }
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
    
    Logger.log('Data processing complete - ' + financeSubmissions.length + ' submissions processed');
    Logger.log('Sample submission structure: ' + JSON.stringify(Object.keys(financeSubmissions[0] || {})));
    console.log('Finance data successfully processed for dashboard');
    
    Logger.log('=== Finance Data GET Request Completed Successfully ===');
    
    // Return the data as JSON
    return ContentService
      .createTextOutput(JSON.stringify(financeSubmissions))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('=== ERROR in Finance Data GET Request ===');
    Logger.log('Error type: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    console.error('Error retrieving Finance data:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Failed to retrieve Finance data', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests to receive Finance audit submissions
 */
function doPost(e) {
  try {
    Logger.log('=== Finance Audit POST Submission Started ===');
    Logger.log('Request timestamp: ' + new Date().toISOString());
    console.log('Finance Audit submission received');
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Spreadsheet accessed: ' + ss.getName());
    let sheet = ss.getSheetByName('Finance Audit');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Finance Audit');
      Logger.log('Created new Finance Audit sheet');
      console.log('Created new Finance Audit sheet');
    } else {
      Logger.log('Finance Audit sheet already exists with ' + sheet.getLastRow() + ' rows');
    }
    
    // Parse the form data
    const params = e.parameter;
    Logger.log('Received parameters count: ' + Object.keys(params).length);
    Logger.log('=== ALL RECEIVED PARAMETERS ===');
    for (let key in params) {
      Logger.log(key + ' = ' + params[key]);
    }
    Logger.log('=== END PARAMETERS ===');
    console.log('Received parameters:', JSON.stringify(params));
    
    // Get current timestamp
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    Logger.log('Generated timestamp: ' + timestamp);
    
    // Initialize headers if this is the first submission
    if (sheet.getLastRow() === 0) {
      Logger.log('First submission - setting up headers');
      setupFinanceHeaders(sheet);
    }
    
    Logger.log('Preparing row data with all 30 finance questions...');
    // Prepare the row data
    const rowData = [
      timestamp,                                    // A: Timestamp
      params.submissionTime || '',                  // B: Submission Time
      params.financeAuditorName || '',              // C: Finance Auditor Name
      params.financeAuditorId || '',                // D: Finance Auditor ID
      params.amName || '',                          // E: Area Manager Name
      params.amId || '',                            // F: Area Manager ID
      params.storeName || '',                       // G: Store Name
      params.storeId || params.storeID || '',       // H: Store ID
      params.region || '',                          // I: Region
      
      // Scoring Information
      parseFloat(params.totalScore) || 0,           // J: Total Score
      parseFloat(params.maxScore) || 0,             // K: Max Score
      parseFloat(params.scorePercentage) || 0,      // L: Score Percentage
      
      // Cash Management Section (8 questions: CM_1 to CM_8)
      params.CashManagement_CM_1 || '',             // M: CM_1
      params.CashManagement_CM_2 || '',             // N: CM_2
      params.CashManagement_CM_3 || '',             // O: CM_3
      params.CashManagement_CM_4 || '',             // P: CM_4
      params.CashManagement_CM_5 || '',             // Q: CM_5
      params.CashManagement_CM_6 || '',             // R: CM_6
      params.CashManagement_CM_7 || '',             // S: CM_7
      params.CashManagement_CM_8 || '',             // T: CM_8
      params.CashManagement_remarks || '',          // U: Cash Management Remarks
      
      // Sales & Revenue Tracking Section (7 questions: SR_1 to SR_7)
      params.SalesRevenue_SR_1 || '',               // V: SR_1
      params.SalesRevenue_SR_2 || '',               // W: SR_2
      params.SalesRevenue_SR_3 || '',               // X: SR_3
      params.SalesRevenue_SR_4 || '',               // Y: SR_4
      params.SalesRevenue_SR_5 || '',               // Z: SR_5
      params.SalesRevenue_SR_6 || '',               // AA: SR_6
      params.SalesRevenue_SR_7 || '',               // AB: SR_7
      params.SalesRevenue_remarks || '',            // AC: Sales Revenue Remarks
      
      // Inventory & Financial Controls Section (8 questions: IF_1 to IF_8)
      params.InventoryFinance_IF_1 || '',           // AD: IF_1
      params.InventoryFinance_IF_2 || '',           // AE: IF_2
      params.InventoryFinance_IF_3 || '',           // AF: IF_3
      params.InventoryFinance_IF_4 || '',           // AG: IF_4
      params.InventoryFinance_IF_5 || '',           // AH: IF_5
      params.InventoryFinance_IF_6 || '',           // AI: IF_6
      params.InventoryFinance_IF_7 || '',           // AJ: IF_7
      params.InventoryFinance_IF_8 || '',           // AK: IF_8
      params.InventoryFinance_remarks || '',        // AL: Inventory Finance Remarks
      
      // Compliance & Reporting Section (7 questions: CR_1 to CR_7)
      params.ComplianceReporting_CR_1 || '',        // AM: CR_1
      params.ComplianceReporting_CR_2 || '',        // AN: CR_2
      params.ComplianceReporting_CR_3 || '',        // AO: CR_3
      params.ComplianceReporting_CR_4 || '',        // AP: CR_4
      params.ComplianceReporting_CR_5 || '',        // AQ: CR_5
      params.ComplianceReporting_CR_6 || '',        // AR: CR_6
      params.ComplianceReporting_CR_7 || '',        // AS: CR_7
      params.ComplianceReporting_remarks || '',     // AT: Compliance Reporting Remarks
      
      // Signatures
      params.auditorSignature || '',                // AU: Auditor Signature
      params.smSignature || ''                      // AV: SM Signature
    ];
    
    Logger.log('Row data prepared with ' + rowData.length + ' fields');
    Logger.log('Store: ' + params.storeName + ' (' + (params.storeId || params.storeID) + ')');
    Logger.log('Region: ' + params.region);
    Logger.log('Finance Auditor: ' + params.financeAuditorName + ' (' + params.financeAuditorId + ')');
    Logger.log('Score: ' + params.totalScore + '/' + params.maxScore + ' (' + params.scorePercentage + '%)');
    
    // Add the data to the sheet
    sheet.appendRow(rowData);
    Logger.log('Data appended to row ' + sheet.getLastRow());
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    Logger.log('Columns auto-resized');
    
    Logger.log('=== Finance audit data successfully saved to sheet ===');
    console.log('Finance audit data successfully saved to sheet');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success', 
        message: 'Finance audit submitted successfully',
        timestamp: timestamp 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('=== ERROR in Finance Audit POST Submission ===');
    Logger.log('Error type: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    console.error('Error processing Finance audit submission:', error);
    
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
 * Sets up the header row for the Finance Audit sheet
 */
function setupFinanceHeaders(sheet) {
  Logger.log('Setting up Finance Audit sheet headers...');
  
  const headers = [
    // Basic Information
    'Timestamp',                                                         // A
    'Submission Time',                                                   // B
    'Finance Auditor Name',                                              // C
    'Finance Auditor ID',                                                // D
    'Area Manager Name',                                                 // E
    'Area Manager ID',                                                   // F
    'Store Name',                                                        // G
    'Store ID',                                                          // H
    'Region',                                                            // I
    
    // Scoring Information
    'Total Score',                                                       // J
    'Max Score',                                                         // K
    'Score Percentage',                                                  // L
    
    // Cash Management Section (8 questions)
    'CM_1: Daily cash reconciliation',                                   // M
    'CM_2: Cash drawer balancing',                                       // N
    'CM_3: Petty cash management',                                       // O
    'CM_4: Cash security measures',                                      // P
    'CM_5: Daily cash deposit',                                          // Q
    'CM_6: Cash variances investigation',                                // R
    'CM_7: Change fund maintenance',                                     // S
    'CM_8: Counterfeit detection',                                       // T
    'Cash Management Remarks',                                           // U
    
    // Sales & Revenue Tracking Section (7 questions)
    'SR_1: Daily sales reports',                                         // V
    'SR_2: POS data reconciliation',                                     // W
    'SR_3: Promotional discounts tracking',                              // X
    'SR_4: Refund/void procedures',                                      // Y
    'SR_5: Revenue trend analysis',                                      // Z
    'SR_6: Sales tax calculations',                                      // AA
    'SR_7: Credit card settlement',                                      // AB
    'Sales Revenue Remarks',                                             // AC
    
    // Inventory & Financial Controls Section (8 questions)
    'IF_1: Inventory valuation',                                         // AD
    'IF_2: Physical inventory counts',                                   // AE
    'IF_3: Stock movement recording',                                    // AF
    'IF_4: Vendor payment procedures',                                   // AG
    'IF_5: Purchase order authorization',                                // AH
    'IF_6: Expense categorization',                                      // AI
    'IF_7: COGS calculations',                                           // AJ
    'IF_8: Wastage/shrinkage documentation',                             // AK
    'Inventory Finance Remarks',                                         // AL
    
    // Compliance & Reporting Section (7 questions)
    'CR_1: Monthly financial statements',                                // AM
    'CR_2: Tax compliance',                                              // AN
    'CR_3: Audit trail maintenance',                                     // AO
    'CR_4: Internal controls testing',                                   // AP
    'CR_5: Regulatory reporting',                                        // AQ
    'CR_6: Documentation retention',                                     // AR
    'CR_7: Budget variance analysis',                                    // AS
    'Compliance Reporting Remarks',                                      // AT
    
    // Signatures
    'Auditor Signature',                                                 // AU
    'SM Signature'                                                       // AV
  ];
  
  Logger.log('Total headers: ' + headers.length);
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#0066CC'); // Blue background for Finance
  headerRange.setFontColor('white');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Set column widths for better readability
  sheet.setColumnWidth(1, 150);  // Timestamp
  sheet.setColumnWidth(2, 150);  // Submission Time
  sheet.setColumnWidth(3, 150);  // Finance Auditor Name
  sheet.setColumnWidth(4, 100);  // Finance Auditor ID
  sheet.setColumnWidth(5, 150);  // AM Name
  sheet.setColumnWidth(6, 100);  // AM ID
  sheet.setColumnWidth(7, 150);  // Store Name
  sheet.setColumnWidth(8, 100);  // Store ID
  sheet.setColumnWidth(9, 120);  // Region
  sheet.setColumnWidth(10, 100); // Total Score
  sheet.setColumnWidth(11, 100); // Max Score
  sheet.setColumnWidth(12, 120); // Score Percentage
  
  Logger.log('Finance Audit sheet headers set up successfully');
  console.log('Finance Audit sheet headers set up successfully');
}

/**
 * Test function to verify the script setup - creates sample data
 */
function testFinanceScript() {
  Logger.log('=== Testing Finance Script Setup ===');
  console.log('Testing Finance script setup...');
  
  // Test data for POST (submission)
  const testData = {
    parameter: {
      submissionTime: '26/11/2025 12:00:00',
      financeAuditorName: 'Test Finance Auditor',
      financeAuditorId: 'FIN001',
      amName: 'Test Area Manager',
      amId: 'AM001',
      storeName: 'Test Store',
      storeId: 'S001',
      region: 'Central',
      totalScore: 65,
      maxScore: 76,
      scorePercentage: 85.5,
      
      // Cash Management (8 questions)
      CashManagement_CM_1: 'yes',
      CashManagement_CM_2: 'yes',
      CashManagement_CM_3: 'yes',
      CashManagement_CM_4: 'no',
      CashManagement_CM_5: 'yes',
      CashManagement_CM_6: 'yes',
      CashManagement_CM_7: 'yes',
      CashManagement_CM_8: 'yes',
      CashManagement_remarks: 'Cash management is good overall',
      
      // Sales Revenue (7 questions)
      SalesRevenue_SR_1: 'yes',
      SalesRevenue_SR_2: 'yes',
      SalesRevenue_SR_3: 'yes',
      SalesRevenue_SR_4: 'yes',
      SalesRevenue_SR_5: 'na',
      SalesRevenue_SR_6: 'yes',
      SalesRevenue_SR_7: 'yes',
      SalesRevenue_remarks: 'Sales tracking is accurate',
      
      // Inventory Finance (8 questions)
      InventoryFinance_IF_1: 'yes',
      InventoryFinance_IF_2: 'yes',
      InventoryFinance_IF_3: 'yes',
      InventoryFinance_IF_4: 'yes',
      InventoryFinance_IF_5: 'yes',
      InventoryFinance_IF_6: 'yes',
      InventoryFinance_IF_7: 'yes',
      InventoryFinance_IF_8: 'no',
      InventoryFinance_remarks: 'Inventory controls need improvement',
      
      // Compliance Reporting (7 questions)
      ComplianceReporting_CR_1: 'yes',
      ComplianceReporting_CR_2: 'yes',
      ComplianceReporting_CR_3: 'yes',
      ComplianceReporting_CR_4: 'yes',
      ComplianceReporting_CR_5: 'yes',
      ComplianceReporting_CR_6: 'yes',
      ComplianceReporting_CR_7: 'yes',
      ComplianceReporting_remarks: 'Compliance is excellent',
      
      // Signatures
      auditorSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      smSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
  };
  
  Logger.log('Testing POST function with sample data...');
  // Test POST function
  const postResult = doPost(testData);
  Logger.log('POST Test result: ' + postResult.getContent());
  console.log('POST Test result:', postResult.getContent());
  
  Logger.log('Testing GET function to retrieve data...');
  // Test GET function
  const getResult = doGet({});
  Logger.log('GET Test result: ' + getResult.getContent());
  console.log('GET Test result:', getResult.getContent());
  
  Logger.log('=== Finance Script Test Complete ===');
}

/**
 * Function to get Finance submission statistics (for debugging)
 */
function getFinanceStats() {
  Logger.log('=== Retrieving Finance Statistics ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Finance Audit');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    Logger.log('No Finance submissions found');
    return { totalSubmissions: 0, avgScore: 0, regions: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const submissions = data.slice(1); // Remove header row
  
  const totalSubmissions = submissions.length;
  const scores = submissions.map(row => parseFloat(row[11]) || 0); // Score Percentage column
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / totalSubmissions;
  
  const regions = [...new Set(submissions.map(row => row[8]).filter(region => region))];
  
  const stats = {
    totalSubmissions,
    avgScore: Math.round(avgScore * 100) / 100,
    regions,
    lastSubmission: submissions[submissions.length - 1][0] // Latest timestamp
  };
  
  Logger.log('Total Submissions: ' + stats.totalSubmissions);
  Logger.log('Average Score: ' + stats.avgScore + '%');
  Logger.log('Regions: ' + stats.regions.join(', '));
  Logger.log('Last Submission: ' + stats.lastSubmission);
  Logger.log('=== Finance Statistics Retrieved ===');
  
  return stats;
}

/**
 * Function to clear all Finance data (for testing purposes)
 */
function clearFinanceData() {
  Logger.log('=== Clearing Finance Data ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Finance Audit');
  
  if (sheet) {
    const rowCount = sheet.getLastRow();
    sheet.clear();
    setupFinanceHeaders(sheet);
    Logger.log('Finance data cleared - ' + (rowCount - 1) + ' rows removed');
    Logger.log('Headers reset');
    console.log('Finance data cleared and headers reset');
  } else {
    Logger.log('No Finance Audit sheet found to clear');
  }
  
  Logger.log('=== Finance Data Clear Complete ===');
}
