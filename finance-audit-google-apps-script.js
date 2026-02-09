/**
 * FINANCE AUDIT CHECKLIST - GOOGLE APPS SCRIPT
 * Updated to match frontend structure (7 sections, 35 questions)
 * 
 * Features:
 * - Records all 35 finance questions (7 sections)
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
    } else {
      // Check if headers exist (first row should have data)
      const firstRow = sheet.getRange(1, 1, 1, 1).getValue();
      if (!firstRow || firstRow === '') {
        setupHeaders(sheet);
        Logger.log('✅ Added headers to existing Finance Audit sheet');
      }
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
    
    // Build row data with all questions, remarks, and image URLs matching FRONTEND structure
    const rowData = [
      formattedTimestamp,                                // A: Timestamp
      params.submissionTime || '',                       // B: Submission Time
      params.financeAuditorName || '',                   // C: Finance Auditor Name
      params.financeAuditorId || '',                     // D: Finance Auditor ID
      params.amName || '',                               // E: Area Manager Name
      params.amId || '',                                 // F: Area Manager ID
      params.storeName || '',                            // G: Store Name
      params.storeId || '',                              // H: Store ID
      params.region || '',                               // I: Region
      
      // Section 1: Cash Handling & Settlement (6 questions: Q1 to Q6)
      params.CashManagement_Q1 || '',                    // J: Q1
      params['CashManagement_Q1_remark'] || '',          // K: Q1 Remark
      imageUrls['CashManagement_Q1'] || '',              // L: Q1 Image
      
      params.CashManagement_Q2 || '',                    // M: Q2
      params['CashManagement_Q2_remark'] || '',          // N: Q2 Remark
      imageUrls['CashManagement_Q2'] || '',              // O: Q2 Image
      
      params.CashManagement_Q3 || '',                    // P: Q3
      params['CashManagement_Q3_remark'] || '',          // Q: Q3 Remark
      imageUrls['CashManagement_Q3'] || '',              // R: Q3 Image
      
      params.CashManagement_Q4 || '',                    // S: Q4
      params['CashManagement_Q4_remark'] || '',          // T: Q4 Remark
      imageUrls['CashManagement_Q4'] || '',              // U: Q4 Image
      
      params.CashManagement_Q5 || '',                    // V: Q5
      params['CashManagement_Q5_remark'] || '',          // W: Q5 Remark
      imageUrls['CashManagement_Q5'] || '',              // X: Q5 Image
      
      params.CashManagement_Q6 || '',                    // Y: Q6
      params['CashManagement_Q6_remark'] || '',          // Z: Q6 Remark
      imageUrls['CashManagement_Q6'] || '',              // AA: Q6 Image
      
      params.CashManagement_remarks || '',               // AB: Section Remarks
      
      // Section 2: Billing & Transactions (6 questions: Q7 to Q12)
      params.Section2_Q7 || '',                          // AC: Q7
      params['Section2_Q7_remark'] || '',                // AD: Q7 Remark
      imageUrls['Section2_Q7'] || '',                    // AE: Q7 Image
      
      params.Section2_Q8 || '',                          // AF: Q8
      params['Section2_Q8_remark'] || '',                // AG: Q8 Remark
      imageUrls['Section2_Q8'] || '',                    // AH: Q8 Image
      
      params.Section2_Q9 || '',                          // AI: Q9
      params['Section2_Q9_remark'] || '',                // AJ: Q9 Remark
      imageUrls['Section2_Q9'] || '',                    // AK: Q9 Image
      
      params.Section2_Q10 || '',                         // AL: Q10
      params['Section2_Q10_remark'] || '',               // AM: Q10 Remark
      imageUrls['Section2_Q10'] || '',                   // AN: Q10 Image
      
      params.Section2_Q11 || '',                         // AO: Q11
      params['Section2_Q11_remark'] || '',               // AP: Q11 Remark
      imageUrls['Section2_Q11'] || '',                   // AQ: Q11 Image
      
      params.Section2_Q12 || '',                         // AR: Q12
      params['Section2_Q12_remark'] || '',               // AS: Q12 Remark
      imageUrls['Section2_Q12'] || '',                   // AT: Q12 Image
      
      params.Section2_remarks || '',                     // AU: Section Remarks
      
      // Section 3: Product & Inventory Compliance (7 questions: Q13 to Q19)
      params.Section3_Q13 || '',                         // AV: Q13
      params['Section3_Q13_remark'] || '',               // AW: Q13 Remark
      imageUrls['Section3_Q13'] || '',                   // AX: Q13 Image
      
      params.Section3_Q14 || '',                         // AY: Q14
      params['Section3_Q14_remark'] || '',               // AZ: Q14 Remark
      imageUrls['Section3_Q14'] || '',                   // BA: Q14 Image
      
      params.Section3_Q15 || '',                         // BB: Q15
      params['Section3_Q15_remark'] || '',               // BC: Q15 Remark
      imageUrls['Section3_Q15'] || '',                   // BD: Q15 Image
      
      params.Section3_Q16 || '',                         // BE: Q16
      params['Section3_Q16_remark'] || '',               // BF: Q16 Remark
      imageUrls['Section3_Q16'] || '',                   // BG: Q16 Image
      
      params.Section3_Q17 || '',                         // BH: Q17
      params['Section3_Q17_remark'] || '',               // BI: Q17 Remark
      imageUrls['Section3_Q17'] || '',                   // BJ: Q17 Image
      
      params.Section3_Q18 || '',                         // BK: Q18
      params['Section3_Q18_remark'] || '',               // BL: Q18 Remark
      imageUrls['Section3_Q18'] || '',                   // BM: Q18 Image
      
      params.Section3_Q19 || '',                         // BN: Q19
      params['Section3_Q19_remark'] || '',               // BO: Q19 Remark
      imageUrls['Section3_Q19'] || '',                   // BP: Q19 Image
      
      params.Section3_remarks || '',                     // BQ: Section Remarks
      
      // Section 4: Documentation & Tracking (4 questions: Q20 to Q23)
      params.Section4_Q20 || '',                         // BR: Q20
      params['Section4_Q20_remark'] || '',               // BS: Q20 Remark
      imageUrls['Section4_Q20'] || '',                   // BT: Q20 Image
      
      params.Section4_Q21 || '',                         // BU: Q21
      params['Section4_Q21_remark'] || '',               // BV: Q21 Remark
      imageUrls['Section4_Q21'] || '',                   // BW: Q21 Image
      
      params.Section4_Q22 || '',                         // BX: Q22
      params['Section4_Q22_remark'] || '',               // BY: Q22 Remark
      imageUrls['Section4_Q22'] || '',                   // BZ: Q22 Image
      
      params.Section4_Q23 || '',                         // CA: Q23
      params['Section4_Q23_remark'] || '',               // CB: Q23 Remark
      imageUrls['Section4_Q23'] || '',                   // CC: Q23 Image
      
      params.Section4_remarks || '',                     // CD: Section Remarks
      
      // Section 5: POS System & SOP (4 questions: Q24 to Q27)
      params.Section5_Q24 || '',                         // CE: Q24
      params['Section5_Q24_remark'] || '',               // CF: Q24 Remark
      imageUrls['Section5_Q24'] || '',                   // CG: Q24 Image
      
      params.Section5_Q25 || '',                         // CH: Q25
      params['Section5_Q25_remark'] || '',               // CI: Q25 Remark
      imageUrls['Section5_Q25'] || '',                   // CJ: Q25 Image
      
      params.Section5_Q26 || '',                         // CK: Q26
      params['Section5_Q26_remark'] || '',               // CL: Q26 Remark
      imageUrls['Section5_Q26'] || '',                   // CM: Q26 Image
      
      params.Section5_Q27 || '',                         // CN: Q27
      params['Section5_Q27_remark'] || '',               // CO: Q27 Remark
      imageUrls['Section5_Q27'] || '',                   // CP: Q27 Image
      
      params.Section5_remarks || '',                     // CQ: Section Remarks
      
      // Section 6: Licenses & Certificates (5 questions: Q28 to Q32)
      params.Section6_Q28 || '',                         // CR: Q28
      params['Section6_Q28_remark'] || '',               // CS: Q28 Remark
      imageUrls['Section6_Q28'] || '',                   // CT: Q28 Image
      
      params.Section6_Q29 || '',                         // CU: Q29
      params['Section6_Q29_remark'] || '',               // CV: Q29 Remark
      imageUrls['Section6_Q29'] || '',                   // CW: Q29 Image
      
      params.Section6_Q30 || '',                         // CX: Q30
      params['Section6_Q30_remark'] || '',               // CY: Q30 Remark
      imageUrls['Section6_Q30'] || '',                   // CZ: Q30 Image
      
      params.Section6_Q31 || '',                         // DA: Q31
      params['Section6_Q31_remark'] || '',               // DB: Q31 Remark
      imageUrls['Section6_Q31'] || '',                   // DC: Q31 Image
      
      params.Section6_Q32 || '',                         // DD: Q32
      params['Section6_Q32_remark'] || '',               // DE: Q32 Remark
      imageUrls['Section6_Q32'] || '',                   // DF: Q32 Image
      
      params.Section6_remarks || '',                     // DG: Section Remarks
      
      // Section 7: CCTV Monitoring (3 questions: Q33 to Q35)
      params.Section7_Q33 || '',                         // DH: Q33
      params['Section7_Q33_remark'] || '',               // DI: Q33 Remark
      imageUrls['Section7_Q33'] || '',                   // DJ: Q33 Image
      
      params.Section7_Q34 || '',                         // DK: Q34
      params['Section7_Q34_remark'] || '',               // DL: Q34 Remark
      imageUrls['Section7_Q34'] || '',                   // DM: Q34 Image
      
      params.Section7_Q35 || '',                         // DN: Q35
      params['Section7_Q35_remark'] || '',               // DO: Q35 Remark
      imageUrls['Section7_Q35'] || '',                   // DP: Q35 Image
      
      params.Section7_remarks || '',                     // DQ: Section Remarks
      
      // Signatures and Scoring
      params.auditorSignature || '',                     // DR: Auditor Signature
      params.smSignature || '',                          // DS: SM Signature
      params.totalScore || '0',                          // DT: Total Score
      params.maxScore || '70',                           // DU: Max Score
      params.scorePercentage || '0'                      // DV: Score Percentage
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
    // Basic Information (9 columns)
    'Timestamp',
    'Submission Time',
    'Finance Auditor Name',
    'Finance Auditor ID',
    'Area Manager Name',
    'Area Manager ID',
    'Store Name',
    'Store ID',
    'Region',
    
    // Section 1: Cash Handling & Settlement (6 questions × 3 columns + 1 = 19 columns)
    'Q1: Were no discrepancies found during the cash drawer verification?',
    'Q1 Remarks',
    'Q1 Image URL',
    'Q2: Were no discrepancies found during the petty cash verification?',
    'Q2 Remarks',
    'Q2 Image URL',
    'Q3: Sale cash is not being used for petty cash or other purposes',
    'Q3 Remarks',
    'Q3 Image URL',
    'Q4: Has banking of cash been done accurately for the last 3 days?',
    'Q4 Remarks',
    'Q4 Image URL',
    'Q5: Was the previous day\'s batch correctly settled in the EDC machine?',
    'Q5 Remarks',
    'Q5 Image URL',
    'Q6: Has the petty cash claim process been properly followed with supporting documents?',
    'Q6 Remarks',
    'Q6 Image URL',
    'Section 1 Remarks',
    
    // Section 2: Billing & Transactions (6 questions × 3 columns + 1 = 19 columns)
    'Q7: Is billing completed for all products served to customers?',
    'Q7 Remarks',
    'Q7 Image URL',
    'Q8: Are there no open transactions pending in the POS system?',
    'Q8 Remarks',
    'Q8 Image URL',
    'Q9: Are discount codes and vouchers applied correctly and as per policy?',
    'Q9 Remarks',
    'Q9 Image URL',
    'Q10: Is the employee meal process followed as per policy?',
    'Q10 Remarks',
    'Q10 Image URL',
    'Q11: Is there no price discrepancy between Menu, POS, Home Delivery (HD), and Pickup?',
    'Q11 Remarks',
    'Q11 Image URL',
    'Q12: Is the customer refund process followed properly with approval and documentation?',
    'Q12 Remarks',
    'Q12 Image URL',
    'Section 2 Remarks',
    
    // Section 3: Product & Inventory Compliance (7 questions × 3 columns + 1 = 22 columns)
    'Q13: Were no expired items found during the audit?',
    'Q13 Remarks',
    'Q13 Image URL',
    'Q14: Is FIFO / FEFO strictly followed for all food and beverage items?',
    'Q14 Remarks',
    'Q14 Image URL',
    'Q15: Are all local purchase items correctly updated in the system?',
    'Q15 Remarks',
    'Q15 Image URL',
    'Q16: Is the inventory posted in the system with complete and accurate details?',
    'Q16 Remarks',
    'Q16 Image URL',
    'Q17: Is the MRD for all products properly updated?',
    'Q17 Remarks',
    'Q17 Image URL',
    'Q18: Are all products available and actively used as per the menu?',
    'Q18 Remarks',
    'Q18 Image URL',
    'Q19: Are products properly displayed or stored according to storage SOPs?',
    'Q19 Remarks',
    'Q19 Image URL',
    'Section 3 Remarks',
    
    // Section 4: Documentation & Tracking (4 questions × 3 columns + 1 = 13 columns)
    'Q20: Are all manual transactions properly approved and recorded?',
    'Q20 Remarks',
    'Q20 Image URL',
    'Q21: Is the cash log book updated daily and verified by the store manager?',
    'Q21 Remarks',
    'Q21 Image URL',
    'Q22: Are bank/cash deposit slips maintained and filed systematically?',
    'Q22 Remarks',
    'Q22 Image URL',
    'Q23: Are stock delivery challans filed and updated properly?',
    'Q23 Remarks',
    'Q23 Image URL',
    'Section 4 Remarks',
    
    // Section 5: POS System & SOP (4 questions × 3 columns + 1 = 13 columns)
    'Q24: Is wastage correctly recorded and disposed as per SOP?',
    'Q24 Remarks',
    'Q24 Image URL',
    'Q25: Are TI / TO / GRN entries done accurately and posted in the system?',
    'Q25 Remarks',
    'Q25 Image URL',
    'Q26: Is the POS and store system used only for designated operational tasks?',
    'Q26 Remarks',
    'Q26 Image URL',
    'Q27: Is the store team aware of SOPs and compliance requirements?',
    'Q27 Remarks',
    'Q27 Image URL',
    'Section 5 Remarks',
    
    // Section 6: Licenses & Certificates (5 questions × 3 columns + 1 = 16 columns)
    'Q28: Are trade licenses available and displayed with proper validity?',
    'Q28 Remarks',
    'Q28 Image URL',
    'Q29: Are Shop & Establishment licenses available and displayed with proper validity?',
    'Q29 Remarks',
    'Q29 Image URL',
    'Q30: Is the FSSAI license available and displayed with proper validity?',
    'Q30 Remarks',
    'Q30 Image URL',
    'Q31: Music licenses available and displayed with proper validity?',
    'Q31 Remarks',
    'Q31 Image URL',
    'Q32: Is the GST certificate available and displayed with proper validity?',
    'Q32 Remarks',
    'Q32 Image URL',
    'Section 6 Remarks',
    
    // Section 7: CCTV Monitoring (3 questions × 3 columns + 1 = 10 columns)
    'Q33: Is the CCTV system functioning properly?',
    'Q33 Remarks',
    'Q33 Image URL',
    'Q34: Is there a backup of 30 / 60 days of footage with proper coverage of critical areas?',
    'Q34 Remarks',
    'Q34 Image URL',
    'Q35: Are no SOP, compliance, or integrity violations observed in CCTV sample review?',
    'Q35 Remarks',
    'Q35 Image URL',
    'Section 7 Remarks',
    
    // Signatures and Scoring (5 columns)
    'Auditor Signature',
    'SM Signature',
    'Total Score',
    'Max Score',
    'Score Percentage'
  ];
  // Total columns: 9 + 19 + 19 + 22 + 13 + 13 + 16 + 10 + 5 = 126 columns
  
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
 * GET handler - Returns sheet data or statistics
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
          data: [],
          totalSubmissions: 0,
          lastUpdated: null
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    
    // Check if action parameter is getData to return full data
    const action = e.parameter.action;
    
    if (action === 'getData') {
      // Return all data rows
      if (lastRow <= 1) {
        // No data, only headers or empty sheet
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'success',
            data: [],
            totalSubmissions: 0
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Get all data including headers
      const dataRange = sheet.getRange(1, 1, lastRow, 126); // 126 columns total
      const values = dataRange.getValues();
      const headers = values[0];
      const dataRows = values.slice(1);
      
      // Convert to array of objects
      const data = dataRows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          data: data,
          totalSubmissions: dataRows.length
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Default: return statistics only
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
