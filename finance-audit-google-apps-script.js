/**
 * FINANCE AUDIT CHECKLIST - GOOGLE APPS SCRIPT
 * Complete with Image Uploads and Remarks for Each Question
 * 
 * Features:
 * - Records all 30 finance questions (4 sections)
 * - Supports image upload for each question
 * - Supports remarks/comments for each question
 * - Stores images in Google Drive folder
 * - Calculates total score and percentage
 * - Tracks submission metadata
 */

// Configuration
const SHEET_NAME = 'Finance Audit';
const DRIVE_FOLDER_NAME = 'Finance Audit Images';

// Get or create the Google Drive folder for storing images
function getOrCreateImageFolder() {
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(DRIVE_FOLDER_NAME);
  }
}

// Main POST handler for form submissions
function doPost(e) {
  try {
    Logger.log('📊 Finance Audit submission received');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      setupHeaders(sheet);
      Logger.log('✅ Created new Finance Audit sheet with headers');
    }
    
    // Parse the incoming JSON data
    let postData = {};
    try {
      postData = JSON.parse(e.postData.contents);
      Logger.log('📥 Received JSON data with keys: ' + Object.keys(postData).length);
    } catch (parseError) {
      Logger.log('⚠️ JSON parse error: ' + parseError.toString());
      postData = e.parameter || {};
    }
    
    const params = postData;
    
    // Get current timestamp
    const timestamp = new Date();
    const formattedTimestamp = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    // Process images if any
    const imageFolder = getOrCreateImageFolder();
    const imageUrls = {};
    
    // Check for base64 images in postData
    if (params.images) {
      Logger.log('🖼️ Processing ' + Object.keys(params.images).length + ' images');
      
      for (const questionId in params.images) {
        try {
          const imageData = params.images[questionId];
          
          if (imageData && imageData.startsWith('data:image')) {
            // Extract base64 data
            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.split(',')[0].split(':')[1].split(';')[0];
            const extension = mimeType.split('/')[1];
            
            // Create blob from base64
            const blob = Utilities.newBlob(
              Utilities.base64Decode(base64Data),
              mimeType,
              questionId + '_' + timestamp.getTime() + '.' + extension
            );
            
            // Save to Drive
            const file = imageFolder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            
            // Store the URL
            imageUrls[questionId] = file.getUrl();
            Logger.log('✅ Saved image for ' + questionId);
          }
        } catch (imgError) {
          Logger.log('⚠️ Error processing image for ' + questionId + ': ' + imgError.toString());
        }
      }
    }
    
    // Build row data with all questions, remarks, and image URLs
    const rowData = [
      formattedTimestamp,                                // A: Timestamp
      params.submissionTime || '',                       // B: Submission Time
      params.financeAuditorName || '',                   // C: Finance Auditor Name
      params.financeAuditorId || '',                     // D: Finance Auditor ID
      params.amName || '',                               // E: Area Manager Name
      params.amId || '',                                 // F: Area Manager ID
      params.storeName || '',                            // G: Store Name
      params.storeId || '',                              // H: Store ID
      
      // Cash Management Section (8 questions)
      params.CashManagement_CM_1 || '',                  // I: CM_1
      params.CashManagement_CM_1_remarks || '',          // J: CM_1 Remarks
      imageUrls['CashManagement_CM_1'] || '',            // K: CM_1 Image
      
      params.CashManagement_CM_2 || '',                  // L: CM_2
      params.CashManagement_CM_2_remarks || '',          // M: CM_2 Remarks
      imageUrls['CashManagement_CM_2'] || '',            // N: CM_2 Image
      
      params.CashManagement_CM_3 || '',                  // O: CM_3
      params.CashManagement_CM_3_remarks || '',          // P: CM_3 Remarks
      imageUrls['CashManagement_CM_3'] || '',            // Q: CM_3 Image
      
      params.CashManagement_CM_4 || '',                  // R: CM_4
      params.CashManagement_CM_4_remarks || '',          // S: CM_4 Remarks
      imageUrls['CashManagement_CM_4'] || '',            // T: CM_4 Image
      
      params.CashManagement_CM_5 || '',                  // U: CM_5
      params.CashManagement_CM_5_remarks || '',          // V: CM_5 Remarks
      imageUrls['CashManagement_CM_5'] || '',            // W: CM_5 Image
      
      params.CashManagement_CM_6 || '',                  // X: CM_6
      params.CashManagement_CM_6_remarks || '',          // Y: CM_6 Remarks
      imageUrls['CashManagement_CM_6'] || '',            // Z: CM_6 Image
      
      params.CashManagement_CM_7 || '',                  // AA: CM_7
      params.CashManagement_CM_7_remarks || '',          // AB: CM_7 Remarks
      imageUrls['CashManagement_CM_7'] || '',            // AC: CM_7 Image
      
      params.CashManagement_CM_8 || '',                  // AD: CM_8
      params.CashManagement_CM_8_remarks || '',          // AE: CM_8 Remarks
      imageUrls['CashManagement_CM_8'] || '',            // AF: CM_8 Image
      
      // Sales & Revenue Tracking Section (7 questions)
      params.SalesRevenue_SR_1 || '',                    // AG: SR_1
      params.SalesRevenue_SR_1_remarks || '',            // AH: SR_1 Remarks
      imageUrls['SalesRevenue_SR_1'] || '',              // AI: SR_1 Image
      
      params.SalesRevenue_SR_2 || '',                    // AJ: SR_2
      params.SalesRevenue_SR_2_remarks || '',            // AK: SR_2 Remarks
      imageUrls['SalesRevenue_SR_2'] || '',              // AL: SR_2 Image
      
      params.SalesRevenue_SR_3 || '',                    // AM: SR_3
      params.SalesRevenue_SR_3_remarks || '',            // AN: SR_3 Remarks
      imageUrls['SalesRevenue_SR_3'] || '',              // AO: SR_3 Image
      
      params.SalesRevenue_SR_4 || '',                    // AP: SR_4
      params.SalesRevenue_SR_4_remarks || '',            // AQ: SR_4 Remarks
      imageUrls['SalesRevenue_SR_4'] || '',              // AR: SR_4 Image
      
      params.SalesRevenue_SR_5 || '',                    // AS: SR_5
      params.SalesRevenue_SR_5_remarks || '',            // AT: SR_5 Remarks
      imageUrls['SalesRevenue_SR_5'] || '',              // AU: SR_5 Image
      
      params.SalesRevenue_SR_6 || '',                    // AV: SR_6
      params.SalesRevenue_SR_6_remarks || '',            // AW: SR_6 Remarks
      imageUrls['SalesRevenue_SR_6'] || '',              // AX: SR_6 Image
      
      params.SalesRevenue_SR_7 || '',                    // AY: SR_7
      params.SalesRevenue_SR_7_remarks || '',            // AZ: SR_7 Remarks
      imageUrls['SalesRevenue_SR_7'] || '',              // BA: SR_7 Image
      
      // Inventory & Financial Controls Section (8 questions)
      params.InventoryFinance_IF_1 || '',                // BB: IF_1
      params.InventoryFinance_IF_1_remarks || '',        // BC: IF_1 Remarks
      imageUrls['InventoryFinance_IF_1'] || '',          // BD: IF_1 Image
      
      params.InventoryFinance_IF_2 || '',                // BE: IF_2
      params.InventoryFinance_IF_2_remarks || '',        // BF: IF_2 Remarks
      imageUrls['InventoryFinance_IF_2'] || '',          // BG: IF_2 Image
      
      params.InventoryFinance_IF_3 || '',                // BH: IF_3
      params.InventoryFinance_IF_3_remarks || '',        // BI: IF_3 Remarks
      imageUrls['InventoryFinance_IF_3'] || '',          // BJ: IF_3 Image
      
      params.InventoryFinance_IF_4 || '',                // BK: IF_4
      params.InventoryFinance_IF_4_remarks || '',        // BL: IF_4 Remarks
      imageUrls['InventoryFinance_IF_4'] || '',          // BM: IF_4 Image
      
      params.InventoryFinance_IF_5 || '',                // BN: IF_5
      params.InventoryFinance_IF_5_remarks || '',        // BO: IF_5 Remarks
      imageUrls['InventoryFinance_IF_5'] || '',          // BP: IF_5 Image
      
      params.InventoryFinance_IF_6 || '',                // BQ: IF_6
      params.InventoryFinance_IF_6_remarks || '',        // BR: IF_6 Remarks
      imageUrls['InventoryFinance_IF_6'] || '',          // BS: IF_6 Image
      
      params.InventoryFinance_IF_7 || '',                // BT: IF_7
      params.InventoryFinance_IF_7_remarks || '',        // BU: IF_7 Remarks
      imageUrls['InventoryFinance_IF_7'] || '',          // BV: IF_7 Image
      
      params.InventoryFinance_IF_8 || '',                // BW: IF_8
      params.InventoryFinance_IF_8_remarks || '',        // BX: IF_8 Remarks
      imageUrls['InventoryFinance_IF_8'] || '',          // BY: IF_8 Image
      
      // Compliance & Reporting Section (7 questions)
      params.ComplianceReporting_CR_1 || '',             // BZ: CR_1
      params.ComplianceReporting_CR_1_remarks || '',     // CA: CR_1 Remarks
      imageUrls['ComplianceReporting_CR_1'] || '',       // CB: CR_1 Image
      
      params.ComplianceReporting_CR_2 || '',             // CC: CR_2
      params.ComplianceReporting_CR_2_remarks || '',     // CD: CR_2 Remarks
      imageUrls['ComplianceReporting_CR_2'] || '',       // CE: CR_2 Image
      
      params.ComplianceReporting_CR_3 || '',             // CF: CR_3
      params.ComplianceReporting_CR_3_remarks || '',     // CG: CR_3 Remarks
      imageUrls['ComplianceReporting_CR_3'] || '',       // CH: CR_3 Image
      
      params.ComplianceReporting_CR_4 || '',             // CI: CR_4
      params.ComplianceReporting_CR_4_remarks || '',     // CJ: CR_4 Remarks
      imageUrls['ComplianceReporting_CR_4'] || '',       // CK: CR_4 Image
      
      params.ComplianceReporting_CR_5 || '',             // CL: CR_5
      params.ComplianceReporting_CR_5_remarks || '',     // CM: CR_5 Remarks
      imageUrls['ComplianceReporting_CR_5'] || '',       // CN: CR_5 Image
      
      params.ComplianceReporting_CR_6 || '',             // CO: CR_6
      params.ComplianceReporting_CR_6_remarks || '',     // CP: CR_6 Remarks
      imageUrls['ComplianceReporting_CR_6'] || '',       // CQ: CR_6 Image
      
      params.ComplianceReporting_CR_7 || '',             // CR: CR_7
      params.ComplianceReporting_CR_7_remarks || '',     // CS: CR_7 Remarks
      imageUrls['ComplianceReporting_CR_7'] || '',       // CT: CR_7 Image
      
      // Scoring
      params.totalScore || '0',                          // CU: Total Score
      params.maxScore || '74',                           // CV: Max Score (8*3+7*3+8*3+7*3 = 20+18+20+18 = 76, adjusted)
      params.scorePercentage || '0'                      // CW: Score Percentage
    ];
    
    // Append the data to the sheet
    sheet.appendRow(rowData);
    
    Logger.log('✅ Finance audit data successfully saved to sheet');
    Logger.log('📊 Total Score: ' + params.totalScore + '/' + params.maxScore + ' (' + params.scorePercentage + '%)');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Finance audit submitted successfully',
        timestamp: formattedTimestamp,
        imagesUploaded: Object.keys(imageUrls).length
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('❌ Error processing Finance audit submission: ' + error.toString());
    
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
function setupHeaders(sheet) {
  const headers = [
    // Basic Information
    'Timestamp',                                         // A
    'Submission Time',                                   // B
    'Finance Auditor Name',                              // C
    'Finance Auditor ID',                                // D
    'Area Manager Name',                                 // E
    'Area Manager ID',                                   // F
    'Store Name',                                        // G
    'Store ID',                                          // H
    
    // Cash Management Section (8 questions × 3 columns = 24 columns)
    'CM_1: Daily cash reconciliation',                   // I
    'CM_1 Remarks',                                      // J
    'CM_1 Image URL',                                    // K
    
    'CM_2: Cash drawer balancing',                       // L
    'CM_2 Remarks',                                      // M
    'CM_2 Image URL',                                    // N
    
    'CM_3: Petty cash management',                       // O
    'CM_3 Remarks',                                      // P
    'CM_3 Image URL',                                    // Q
    
    'CM_4: Cash security measures',                      // R
    'CM_4 Remarks',                                      // S
    'CM_4 Image URL',                                    // T
    
    'CM_5: Daily cash deposit',                          // U
    'CM_5 Remarks',                                      // V
    'CM_5 Image URL',                                    // W
    
    'CM_6: Cash variances investigation',                // X
    'CM_6 Remarks',                                      // Y
    'CM_6 Image URL',                                    // Z
    
    'CM_7: Change fund maintenance',                     // AA
    'CM_7 Remarks',                                      // AB
    'CM_7 Image URL',                                    // AC
    
    'CM_8: Counterfeit detection',                       // AD
    'CM_8 Remarks',                                      // AE
    'CM_8 Image URL',                                    // AF
    
    // Sales & Revenue Tracking Section (7 questions × 3 columns = 21 columns)
    'SR_1: Daily sales reports',                         // AG
    'SR_1 Remarks',                                      // AH
    'SR_1 Image URL',                                    // AI
    
    'SR_2: POS data reconciliation',                     // AJ
    'SR_2 Remarks',                                      // AK
    'SR_2 Image URL',                                    // AL
    
    'SR_3: Promotional discounts tracking',              // AM
    'SR_3 Remarks',                                      // AN
    'SR_3 Image URL',                                    // AO
    
    'SR_4: Refund/void procedures',                      // AP
    'SR_4 Remarks',                                      // AQ
    'SR_4 Image URL',                                    // AR
    
    'SR_5: Revenue trend analysis',                      // AS
    'SR_5 Remarks',                                      // AT
    'SR_5 Image URL',                                    // AU
    
    'SR_6: Sales tax calculations',                      // AV
    'SR_6 Remarks',                                      // AW
    'SR_6 Image URL',                                    // AX
    
    'SR_7: Credit card settlement',                      // AY
    'SR_7 Remarks',                                      // AZ
    'SR_7 Image URL',                                    // BA
    
    // Inventory & Financial Controls Section (8 questions × 3 columns = 24 columns)
    'IF_1: Inventory valuation',                         // BB
    'IF_1 Remarks',                                      // BC
    'IF_1 Image URL',                                    // BD
    
    'IF_2: Physical inventory counts',                   // BE
    'IF_2 Remarks',                                      // BF
    'IF_2 Image URL',                                    // BG
    
    'IF_3: Stock movement recording',                    // BH
    'IF_3 Remarks',                                      // BI
    'IF_3 Image URL',                                    // BJ
    
    'IF_4: Vendor payment procedures',                   // BK
    'IF_4 Remarks',                                      // BL
    'IF_4 Image URL',                                    // BM
    
    'IF_5: Purchase order authorization',                // BN
    'IF_5 Remarks',                                      // BO
    'IF_5 Image URL',                                    // BP
    
    'IF_6: Expense categorization',                      // BQ
    'IF_6 Remarks',                                      // BR
    'IF_6 Image URL',                                    // BS
    
    'IF_7: COGS calculations',                           // BT
    'IF_7 Remarks',                                      // BU
    'IF_7 Image URL',                                    // BV
    
    'IF_8: Wastage/shrinkage documentation',             // BW
    'IF_8 Remarks',                                      // BX
    'IF_8 Image URL',                                    // BY
    
    // Compliance & Reporting Section (7 questions × 3 columns = 21 columns)
    'CR_1: Monthly financial statements',                // BZ
    'CR_1 Remarks',                                      // CA
    'CR_1 Image URL',                                    // CB
    
    'CR_2: Tax compliance',                              // CC
    'CR_2 Remarks',                                      // CD
    'CR_2 Image URL',                                    // CE
    
    'CR_3: Audit trail maintenance',                     // CF
    'CR_3 Remarks',                                      // CG
    'CR_3 Image URL',                                    // CH
    
    'CR_4: Internal controls testing',                   // CI
    'CR_4 Remarks',                                      // CJ
    'CR_4 Image URL',                                    // CK
    
    'CR_5: Regulatory reporting',                        // CL
    'CR_5 Remarks',                                      // CM
    'CR_5 Image URL',                                    // CN
    
    'CR_6: Documentation retention',                     // CO
    'CR_6 Remarks',                                      // CP
    'CR_6 Image URL',                                    // CQ
    
    'CR_7: Budget variance analysis',                    // CR
    'CR_7 Remarks',                                      // CS
    'CR_7 Image URL',                                    // CT
    
    // Scoring
    'Total Score',                                       // CU
    'Max Score',                                         // CV
    'Score Percentage'                                   // CW
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#0066CC');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 150);  // Timestamp
  sheet.setColumnWidth(2, 150);  // Submission Time
  sheet.setColumnWidth(3, 150);  // Finance Auditor Name
  sheet.setColumnWidth(4, 100);  // Finance Auditor ID
  sheet.setColumnWidth(5, 150);  // AM Name
  sheet.setColumnWidth(6, 100);  // AM ID
  sheet.setColumnWidth(7, 150);  // Store Name
  sheet.setColumnWidth(8, 100);  // Store ID
  
  // Set default width for question/remarks/image columns
  for (let i = 9; i <= headers.length; i++) {
    if (headers[i-1].includes('Remarks')) {
      sheet.setColumnWidth(i, 250);  // Wider for remarks
    } else if (headers[i-1].includes('Image URL')) {
      sheet.setColumnWidth(i, 200);  // Medium for image URLs
    } else if (headers[i-1].includes(':')) {
      sheet.setColumnWidth(i, 80);   // Narrower for Yes/No/NA
    } else {
      sheet.setColumnWidth(i, 120);  // Default
    }
  }
  
  Logger.log('✅ Headers set up successfully for Finance Audit sheet');
}

/**
 * GET handler - Returns sheet info and statistics
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Finance Audit API Active',
          totalSubmissions: 0,
          lastUpdated: null
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    const totalSubmissions = lastRow > 1 ? lastRow - 1 : 0;
    
    let lastUpdated = null;
    if (lastRow > 1) {
      lastUpdated = sheet.getRange(lastRow, 1).getValue();
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Finance Audit API Active',
        totalSubmissions: totalSubmissions,
        lastUpdated: lastUpdated,
        imageFolderUrl: getOrCreateImageFolder().getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function to create sample data
 */
function testSetupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  sheet = ss.insertSheet(SHEET_NAME);
  setupHeaders(sheet);
  
  Logger.log('✅ Test sheet created successfully');
}
