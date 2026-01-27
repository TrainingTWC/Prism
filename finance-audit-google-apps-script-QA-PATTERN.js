/**
 * Finance Audit Google Apps Script - COMPLETE VERSION (Based on QA Script Pattern)
 * Handles form submissions and data retrieval for the Finance Assessment dashboard
 * Sheet name: Finance Audit
 * 
 * IMPORTANT: This script needs to be deployed as a web app with:
 * - Execute as: Me
 * - Who has access: Anyone
 * 
 * STRUCTURE: 32 Total Questions + Per-Question Remarks + Images + Metadata + Signatures
 * - Section 1: Cash Handling & Settlement (6 questions: Q1-Q6)
 * - Section 2: Billing & Transactions (4 questions: Q7-Q10)
 * - Section 3: Product & Inventory Compliance (7 questions: Q11-Q17)
 * - Section 4: Documentation & Tracking (4 questions: Q18-Q21)
 * - Section 5: POS System & SOP (4 questions: Q22-Q25)
 * - Section 6: Licenses & Certificates (4 questions: Q26-Q29)
 * - Section 7: CCTV Monitoring (3 questions: Q30-Q32)
 * - Total Columns: 116 (12 metadata + 32 questions*3 [answer+remark+imageCount] + 7 section remarks + 2 signatures + 2 JSON fields)
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
    
    Logger.log('Preparing row data with all 32 finance questions...');
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
      
      // Section 1: Cash Handling & Settlement (6 questions: Q1-Q6)
      params.Section1_Q1 || '',                     // M: Q1
      params.Section1_Q1_remark || '',              // N: Q1 Remark
      params.Section1_Q1_imageCount || 0,           // O: Q1 Image Count
      params.Section1_Q2 || '',                     // P: Q2
      params.Section1_Q2_remark || '',              // Q: Q2 Remark
      params.Section1_Q2_imageCount || 0,           // R: Q2 Image Count
      params.Section1_Q3 || '',                     // S: Q3
      params.Section1_Q3_remark || '',              // T: Q3 Remark
      params.Section1_Q3_imageCount || 0,           // U: Q3 Image Count
      params.Section1_Q4 || '',                     // V: Q4
      params.Section1_Q4_remark || '',              // W: Q4 Remark
      params.Section1_Q4_imageCount || 0,           // X: Q4 Image Count
      params.Section1_Q5 || '',                     // Y: Q5
      params.Section1_Q5_remark || '',              // Z: Q5 Remark
      params.Section1_Q5_imageCount || 0,           // AA: Q5 Image Count
      params.Section1_Q6 || '',                     // AB: Q6
      params.Section1_Q6_remark || '',              // AC: Q6 Remark
      params.Section1_Q6_imageCount || 0,           // AD: Q6 Image Count
      params.Section1_remarks || '',                // AE: Section 1 Remarks
      
      // Section 2: Billing & Transactions (4 questions: Q7-Q10)
      params.Section2_Q7 || '',                     // AF: Q7
      params.Section2_Q7_remark || '',              // AG: Q7 Remark
      params.Section2_Q7_imageCount || 0,           // AH: Q7 Image Count
      params.Section2_Q8 || '',                     // AI: Q8
      params.Section2_Q8_remark || '',              // AJ: Q8 Remark
      params.Section2_Q8_imageCount || 0,           // AK: Q8 Image Count
      params.Section2_Q9 || '',                     // AL: Q9
      params.Section2_Q9_remark || '',              // AM: Q9 Remark
      params.Section2_Q9_imageCount || 0,           // AN: Q9 Image Count
      params.Section2_Q10 || '',                    // AO: Q10
      params.Section2_Q10_remark || '',             // AP: Q10 Remark
      params.Section2_Q10_imageCount || 0,          // AQ: Q10 Image Count
      params.Section2_remarks || '',                // AR: Section 2 Remarks
      
      // Section 3: Product & Inventory Compliance (7 questions: Q11-Q17)
      params.Section3_Q11 || '',                    // AS: Q11
      params.Section3_Q11_remark || '',             // AT: Q11 Remark
      params.Section3_Q11_imageCount || 0,          // AU: Q11 Image Count
      params.Section3_Q12 || '',                    // AV: Q12
      params.Section3_Q12_remark || '',             // AW: Q12 Remark
      params.Section3_Q12_imageCount || 0,          // AX: Q12 Image Count
      params.Section3_Q13 || '',                    // AY: Q13
      params.Section3_Q13_remark || '',             // AZ: Q13 Remark
      params.Section3_Q13_imageCount || 0,          // BA: Q13 Image Count
      params.Section3_Q14 || '',                    // BB: Q14
      params.Section3_Q14_remark || '',             // BC: Q14 Remark
      params.Section3_Q14_imageCount || 0,          // BD: Q14 Image Count
      params.Section3_Q15 || '',                    // BE: Q15
      params.Section3_Q15_remark || '',             // BF: Q15 Remark
      params.Section3_Q15_imageCount || 0,          // BG: Q15 Image Count
      params.Section3_Q16 || '',                    // BH: Q16
      params.Section3_Q16_remark || '',             // BI: Q16 Remark
      params.Section3_Q16_imageCount || 0,          // BJ: Q16 Image Count
      params.Section3_Q17 || '',                    // BK: Q17
      params.Section3_Q17_remark || '',             // BL: Q17 Remark
      params.Section3_Q17_imageCount || 0,          // BM: Q17 Image Count
      params.Section3_remarks || '',                // BN: Section 3 Remarks
      
      // Section 4: Documentation & Tracking (4 questions: Q18-Q21)
      params.Section4_Q18 || '',                    // BO: Q18
      params.Section4_Q18_remark || '',             // BP: Q18 Remark
      params.Section4_Q18_imageCount || 0,          // BQ: Q18 Image Count
      params.Section4_Q19 || '',                    // BR: Q19
      params.Section4_Q19_remark || '',             // BS: Q19 Remark
      params.Section4_Q19_imageCount || 0,          // BT: Q19 Image Count
      params.Section4_Q20 || '',                    // BU: Q20
      params.Section4_Q20_remark || '',             // BV: Q20 Remark
      params.Section4_Q20_imageCount || 0,          // BW: Q20 Image Count
      params.Section4_Q21 || '',                    // BX: Q21
      params.Section4_Q21_remark || '',             // BY: Q21 Remark
      params.Section4_Q21_imageCount || 0,          // BZ: Q21 Image Count
      params.Section4_remarks || '',                // CA: Section 4 Remarks
      
      // Section 5: POS System & SOP (4 questions: Q22-Q25)
      params.Section5_Q22 || '',                    // CB: Q22
      params.Section5_Q22_remark || '',             // CC: Q22 Remark
      params.Section5_Q22_imageCount || 0,          // CD: Q22 Image Count
      params.Section5_Q23 || '',                    // CE: Q23
      params.Section5_Q23_remark || '',             // CF: Q23 Remark
      params.Section5_Q23_imageCount || 0,          // CG: Q23 Image Count
      params.Section5_Q24 || '',                    // CH: Q24
      params.Section5_Q24_remark || '',             // CI: Q24 Remark
      params.Section5_Q24_imageCount || 0,          // CJ: Q24 Image Count
      params.Section5_Q25 || '',                    // CK: Q25
      params.Section5_Q25_remark || '',             // CL: Q25 Remark
      params.Section5_Q25_imageCount || 0,          // CM: Q25 Image Count
      params.Section5_remarks || '',                // CN: Section 5 Remarks
      
      // Section 6: Licenses & Certificates (4 questions: Q26-Q29)
      params.Section6_Q26 || '',                    // CO: Q26
      params.Section6_Q26_remark || '',             // CP: Q26 Remark
      params.Section6_Q26_imageCount || 0,          // CQ: Q26 Image Count
      params.Section6_Q27 || '',                    // CR: Q27
      params.Section6_Q27_remark || '',             // CS: Q27 Remark
      params.Section6_Q27_imageCount || 0,          // CT: Q27 Image Count
      params.Section6_Q28 || '',                    // CU: Q28
      params.Section6_Q28_remark || '',             // CV: Q28 Remark
      params.Section6_Q28_imageCount || 0,          // CW: Q28 Image Count
      params.Section6_Q29 || '',                    // CX: Q29
      params.Section6_Q29_remark || '',             // CY: Q29 Remark
      params.Section6_Q29_imageCount || 0,          // CZ: Q29 Image Count
      params.Section6_remarks || '',                // DA: Section 6 Remarks
      
      // Section 7: CCTV Monitoring (3 questions: Q30-Q32)
      params.Section7_Q30 || '',                    // DB: Q30
      params.Section7_Q30_remark || '',             // DC: Q30 Remark
      params.Section7_Q30_imageCount || 0,          // DD: Q30 Image Count
      params.Section7_Q31 || '',                    // DE: Q31
      params.Section7_Q31_remark || '',             // DF: Q31 Remark
      params.Section7_Q31_imageCount || 0,          // DG: Q31 Image Count
      params.Section7_Q32 || '',                    // DH: Q32
      params.Section7_Q32_remark || '',             // DI: Q32 Remark
      params.Section7_Q32_imageCount || 0,          // DJ: Q32 Image Count
      params.Section7_remarks || '',                // DK: Section 7 Remarks
      
      // Signatures
      params.auditorSignature || '',                // DL: Auditor Signature
      params.smSignature || '',                     // DM: SM Signature
      
      // JSON Data for Images and Per-Question Remarks
      params.questionImagesJSON || '{}',            // DN: Question Images JSON
      params.questionRemarksJSON || '{}'            // DO: Question Remarks JSON
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
    
    // Section 1: Cash Handling & Settlement (6 questions)
    'Q1: Cash drawer verification',                                      // M
    'Q1 Remark',                                                         // N
    'Q1 Image Count',                                                    // O
    'Q2: Petty cash verification',                                       // P
    'Q2 Remark',                                                         // Q
    'Q2 Image Count',                                                    // R
    'Q3: Sale cash not used for petty cash',                             // S
    'Q3 Remark',                                                         // T
    'Q3 Image Count',                                                    // U
    'Q4: Banking accuracy (last 3 days)',                                // V
    'Q4 Remark',                                                         // W
    'Q4 Image Count',                                                    // X
    'Q5: Previous day batch settled in EDC',                             // Y
    'Q5 Remark',                                                         // Z
    'Q5 Image Count',                                                    // AA
    'Q6: Petty cash claim process',                                      // AB
    'Q6 Remark',                                                         // AC
    'Q6 Image Count',                                                    // AD
    'Section 1 Remarks',                                                 // AE
    
    // Section 2: Billing & Transactions (4 questions)
    'Q7: Billing completed for all products',                            // AF
    'Q7 Remark',                                                         // AG
    'Q7 Image Count',                                                    // AH
    'Q8: No open transactions in POS',                                   // AI
    'Q8 Remark',                                                         // AJ
    'Q8 Image Count',                                                    // AK
    'Q9: Discount codes applied correctly',                              // AL
    'Q9 Remark',                                                         // AM
    'Q9 Image Count',                                                    // AN
    'Q10: Employee meal process followed',                               // AO
    'Q10 Remark',                                                        // AP
    'Q10 Image Count',                                                   // AQ
    'Section 2 Remarks',                                                 // AR
    
    // Section 3: Product & Inventory Compliance (7 questions)
    'Q11: No expired items found',                                       // AS
    'Q11 Remark',                                                        // AT
    'Q11 Image Count',                                                   // AU
    'Q12: FIFO/FEFO strictly followed',                                  // AV
    'Q12 Remark',                                                        // AW
    'Q12 Image Count',                                                   // AX
    'Q13: Local purchase items updated',                                 // AY
    'Q13 Remark',                                                        // AZ
    'Q13 Image Count',                                                   // BA
    'Q14: Inventory posted with complete details',                       // BB
    'Q14 Remark',                                                        // BC
    'Q14 Image Count',                                                   // BD
    'Q15: MRD for all products updated',                                 // BE
    'Q15 Remark',                                                        // BF
    'Q15 Image Count',                                                   // BG
    'Q16: All products available as per menu',                           // BH
    'Q16 Remark',                                                        // BI
    'Q16 Image Count',                                                   // BJ
    'Q17: Products displayed/stored per SOP',                            // BK
    'Q17 Remark',                                                        // BL
    'Q17 Image Count',                                                   // BM
    'Section 3 Remarks',                                                 // BN
    
    // Section 4: Documentation & Tracking (4 questions)
    'Q18: Manual transactions approved',                                 // BO
    'Q18 Remark',                                                        // BP
    'Q18 Image Count',                                                   // BQ
    'Q19: Cash log book updated daily',                                  // BR
    'Q19 Remark',                                                        // BS
    'Q19 Image Count',                                                   // BT
    'Q20: Bank/cash deposit slips filed',                                // BU
    'Q20 Remark',                                                        // BV
    'Q20 Image Count',                                                   // BW
    'Q21: Stock delivery challans filed',                                // BX
    'Q21 Remark',                                                        // BY
    'Q21 Image Count',                                                   // BZ
    'Section 4 Remarks',                                                 // CA
    
    // Section 5: POS System & SOP (4 questions)
    'Q22: Wastage recorded per SOP',                                     // CB
    'Q22 Remark',                                                        // CC
    'Q22 Image Count',                                                   // CD
    'Q23: TI/TO/GRN entries accurate',                                   // CE
    'Q23 Remark',                                                        // CF
    'Q23 Image Count',                                                   // CG
    'Q24: POS used for designated tasks only',                           // CH
    'Q24 Remark',                                                        // CI
    'Q24 Image Count',                                                   // CJ
    'Q25: Team aware of SOPs',                                           // CK
    'Q25 Remark',                                                        // CL
    'Q25 Image Count',                                                   // CM
    'Section 5 Remarks',                                                 // CN
    
    // Section 6: Licenses & Certificates (4 questions)
    'Q26: Trade licenses available',                                     // CO
    'Q26 Remark',                                                        // CP
    'Q26 Image Count',                                                   // CQ
    'Q27: Shop & Establishment licenses',                                // CR
    'Q27 Remark',                                                        // CS
    'Q27 Image Count',                                                   // CT
    'Q28: FSSAI license available',                                      // CU
    'Q28 Remark',                                                        // CV
    'Q28 Image Count',                                                   // CW
    'Q29: GST certificate available',                                    // CX
    'Q29 Remark',                                                        // CY
    'Q29 Image Count',                                                   // CZ
    'Section 6 Remarks',                                                 // DA
    
    // Section 7: CCTV Monitoring (3 questions)
    'Q30: CCTV system functioning',                                      // DB
    'Q30 Remark',                                                        // DC
    'Q30 Image Count',                                                   // DD
    'Q31: CCTV backup 30/60 days',                                       // DE
    'Q31 Remark',                                                        // DF
    'Q31 Image Count',                                                   // DG
    'Q32: No SOP violations in CCTV review',                             // DH
    'Q32 Remark',                                                        // DI
    'Q32 Image Count',                                                   // DJ
    'Section 7 Remarks',                                                 // DK
    
    // Signatures
    'Auditor Signature',                                                 // DL
    'SM Signature',                                                      // DM
    
    // JSON Data
    'Question Images JSON',                                              // DN
    'Question Remarks JSON'                                              // DO
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
