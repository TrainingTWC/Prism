/**
 * Quality Assurance (QA) Checklist Google Apps Script - UPDATED WITH EDIT SUPPORT
 * Handles form submissions, updates, AND data retrieval for the QA Assessment dashboard
 * Sheet name: QA
 * 
 * IMPORTANT: This script needs to be deployed as a web app with:
 * - Execute as: Me
 * - Who has access: Anyone
 * 
 * STRUCTURE: 116 Total Questions + Metadata
 * - Zero Tolerance: 6 questions (ZT_1 to ZT_6)
 * - Store: 94 questions (S_1 to S_94)
 * - A Section: 3 questions (A_1 to A_3)
 * - Maintenance: 11 questions (M_1 to M_11)
 * - HR: 2 questions (HR_1 to HR_2)
 */

/**
 * Handles GET requests to return QA data for the dashboard
 */
function doGet(e) {
  try {
    Logger.log('=== QA Data GET Request Started ===');
    Logger.log('Request timestamp: ' + new Date().toISOString());
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('QA');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log('No QA data found - sheet empty or does not exist');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('QA sheet found with ' + sheet.getLastRow() + ' rows');
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0];
    const dataRows = values.slice(1);
    
    Logger.log('Headers found: ' + headers.length + ' columns');
    Logger.log('Data rows found: ' + dataRows.length + ' submissions');
    
    const qaSubmissions = dataRows.map((row, index) => {
      const submission = {};
      
      headers.forEach((header, index) => {
        const value = row[index];
        
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
          case 'City':
            submission.city = value || '';
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
            // Store all other fields (questions, remarks, etc.)
            submission[header] = value || '';
        }
      });
      
      return submission;
    });
    
    Logger.log('✅ Successfully processed ' + qaSubmissions.length + ' submissions');
    
    return ContentService
      .createTextOutput(JSON.stringify(qaSubmissions))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('ERROR in doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests for create and update operations
 */
function doPost(e) {
  try {
    Logger.log('=== QA Survey POST Submission Started ===');
    Logger.log('Request timestamp: ' + new Date().toISOString());
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('QA');
    
    if (!sheet) {
      sheet = ss.insertSheet('QA');
      Logger.log('Created new QA sheet');
    }
    
    const params = e.parameter;
    Logger.log('Received parameters count: ' + Object.keys(params).length);
    Logger.log('Action: ' + params.action);
    Logger.log('Row ID: ' + params.rowId);
    
    // Check if this is an update request
    if (params.action === 'update' && params.rowId) {
      Logger.log('🔄 UPDATE REQUEST detected');
      return updateSubmission(sheet, params);
    }
    
    // CREATE NEW SUBMISSION
    Logger.log('➕ CREATE NEW SUBMISSION');
    
    if (sheet.getLastRow() === 0) {
      Logger.log('First submission - setting up headers');
      setupQAHeaders(sheet);
    }
    
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    const rowData = buildRowData(params, timestamp);
    
    sheet.appendRow(rowData);
    const lastRow = sheet.getLastRow();
    
    Logger.log('✅ New submission added at row: ' + lastRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'QA submission created successfully',
        rowNumber: lastRow,
        timestamp: timestamp
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ ERROR in doPost: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Updates an existing submission
 */
function updateSubmission(sheet, params) {
  try {
    Logger.log('=== UPDATE SUBMISSION Function Started ===');
    Logger.log('Looking for submission with rowId: "' + params.rowId + '"');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column B (Submission Time) - index 1
    let targetRowIndex = -1;
    
    // Convert rowId to comparable format
    let searchDate;
    try {
      searchDate = new Date(params.rowId);
      Logger.log('Parsed search date: ' + searchDate.toISOString());
    } catch (e) {
      Logger.log('Could not parse rowId as date: ' + e.toString());
    }
    
    for (let i = 1; i < data.length; i++) {
      const submissionTime = data[i][1]; // Column B
      
      // Try exact string match first
      if (String(submissionTime) === String(params.rowId)) {
        targetRowIndex = i + 1; // Sheet rows are 1-indexed
        Logger.log('✅ Found EXACT match at row: ' + targetRowIndex);
        break;
      }
      
      // Try date comparison
      if (searchDate) {
        try {
          const sheetDate = new Date(submissionTime);
          const timeDiff = Math.abs(sheetDate.getTime() - searchDate.getTime());
          
          if (timeDiff < 2000) { // Within 2 seconds
            targetRowIndex = i + 1;
            Logger.log('✅ Found DATE match at row: ' + targetRowIndex + ' (diff: ' + timeDiff + 'ms)');
            break;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
      
      // Try formatted comparison (handle DD/MM/YYYY vs MM/DD/YYYY)
      const submissionStr = String(submissionTime).trim();
      const rowIdStr = String(params.rowId).trim();
      
      if (submissionStr.includes(rowIdStr.substring(0, 10)) || rowIdStr.includes(submissionStr.substring(0, 10))) {
        targetRowIndex = i + 1;
        Logger.log('✅ Found PARTIAL match at row: ' + targetRowIndex);
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      Logger.log('❌ ERROR: Submission not found');
      Logger.log('Searched ' + (data.length - 1) + ' rows');
      Logger.log('Sample of first submission time: "' + data[1][1] + '"');
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Submission not found. rowId: "' + params.rowId + '"',
          searchedRows: data.length - 1
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Build updated row data
    const now = new Date();
    const updateTimestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    Logger.log('Building updated row data...');
    const rowData = buildRowData(params, params.submissionTime || params.rowId, updateTimestamp);
    
    // Update the entire row
    const range = sheet.getRange(targetRowIndex, 1, 1, rowData.length);
    range.setValues([rowData]);
    
    Logger.log('✅ Row ' + targetRowIndex + ' UPDATED successfully');
    Logger.log('=== UPDATE SUBMISSION Completed ===');
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'QA submission updated successfully',
        rowNumber: targetRowIndex,
        updateTime: updateTimestamp
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ ERROR in updateSubmission: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Builds row data array for both create and update operations
 */
function buildRowData(params, submissionTime, updateTimestamp) {
  const timestamp = updateTimestamp ? updateTimestamp + ' (Updated)' : submissionTime;
  
  return [
    timestamp,                                    // A: Timestamp
    submissionTime,                               // B: Submission Time (preserved for matching)
    params.qaName || '',                          // C: QA Auditor Name
    params.qaId || '',                            // D: QA Auditor ID
    params.amName || '',                          // E: Area Manager Name
    params.amId || '',                            // F: Area Manager ID
    params.storeName || '',                       // G: Store Name
    params.storeID || '',                         // H: Store ID
    params.city || '',                            // I: City
    params.region || '',                          // J: Region
    
    // Scoring Information
    parseFloat(params.totalScore) || 0,           // K: Total Score
    parseFloat(params.maxScore) || 0,             // L: Max Score
    parseFloat(params.scorePercentage) || 0,      // M: Score Percentage
    
    // Zero Tolerance Section (6 questions)
    params.ZeroTolerance_ZT_1 || '',
    params.ZeroTolerance_ZT_2 || '',
    params.ZeroTolerance_ZT_3 || '',
    params.ZeroTolerance_ZT_4 || '',
    params.ZeroTolerance_ZT_5 || '',
    params.ZeroTolerance_ZT_6 || '',
    params.ZeroTolerance_remarks || '',
    
    // Store Section (94 questions)
    params.Store_S_1 || '',    params.Store_S_2 || '',    params.Store_S_3 || '',    params.Store_S_4 || '',
    params.Store_S_5 || '',    params.Store_S_6 || '',    params.Store_S_7 || '',    params.Store_S_8 || '',
    params.Store_S_9 || '',    params.Store_S_10 || '',   params.Store_S_11 || '',   params.Store_S_12 || '',
    params.Store_S_13 || '',   params.Store_S_14 || '',   params.Store_S_15 || '',   params.Store_S_16 || '',
    params.Store_S_17 || '',   params.Store_S_18 || '',   params.Store_S_19 || '',   params.Store_S_20 || '',
    params.Store_S_21 || '',   params.Store_S_22 || '',   params.Store_S_23 || '',   params.Store_S_24 || '',
    params.Store_S_25 || '',   params.Store_S_26 || '',   params.Store_S_27 || '',   params.Store_S_28 || '',
    params.Store_S_29 || '',   params.Store_S_30 || '',   params.Store_S_31 || '',   params.Store_S_32 || '',
    params.Store_S_33 || '',   params.Store_S_34 || '',   params.Store_S_35 || '',   params.Store_S_36 || '',
    params.Store_S_37 || '',   params.Store_S_38 || '',   params.Store_S_39 || '',   params.Store_S_40 || '',
    params.Store_S_41 || '',   params.Store_S_42 || '',   params.Store_S_43 || '',   params.Store_S_44 || '',
    params.Store_S_45 || '',   params.Store_S_46 || '',   params.Store_S_47 || '',   params.Store_S_48 || '',
    params.Store_S_49 || '',   params.Store_S_50 || '',   params.Store_S_51 || '',   params.Store_S_52 || '',
    params.Store_S_53 || '',   params.Store_S_54 || '',   params.Store_S_55 || '',   params.Store_S_56 || '',
    params.Store_S_57 || '',   params.Store_S_58 || '',   params.Store_S_59 || '',   params.Store_S_60 || '',
    params.Store_S_61 || '',   params.Store_S_62 || '',   params.Store_S_63 || '',   params.Store_S_64 || '',
    params.Store_S_65 || '',   params.Store_S_66 || '',   params.Store_S_67 || '',   params.Store_S_68 || '',
    params.Store_S_69 || '',   params.Store_S_70 || '',   params.Store_S_71 || '',   params.Store_S_72 || '',
    params.Store_S_73 || '',   params.Store_S_74 || '',   params.Store_S_75 || '',   params.Store_S_76 || '',
    params.Store_S_77 || '',   params.Store_S_78 || '',   params.Store_S_79 || '',   params.Store_S_80 || '',
    params.Store_S_81 || '',   params.Store_S_82 || '',   params.Store_S_83 || '',   params.Store_S_84 || '',
    params.Store_S_85 || '',   params.Store_S_86 || '',   params.Store_S_87 || '',   params.Store_S_88 || '',
    params.Store_S_89 || '',   params.Store_S_90 || '',   params.Store_S_91 || '',   params.Store_S_92 || '',
    params.Store_S_93 || '',   params.Store_S_94 || '',
    params.Store_remarks || '',
    
    // A Section (3 questions)
    params.A_A_1 || '',
    params.A_A_2 || '',
    params.A_A_3 || '',
    params.A_remarks || '',
    
    // Maintenance Section (11 questions)
    params.Maintenance_M_1 || '',
    params.Maintenance_M_2 || '',
    params.Maintenance_M_3 || '',
    params.Maintenance_M_4 || '',
    params.Maintenance_M_5 || '',
    params.Maintenance_M_6 || '',
    params.Maintenance_M_7 || '',
    params.Maintenance_M_8 || '',
    params.Maintenance_M_9 || '',
    params.Maintenance_M_10 || '',
    params.Maintenance_M_11 || '',
    params.Maintenance_remarks || '',
    
    // HR Section (2 questions)
    params.HR_HR_1 || '',
    params.HR_HR_2 || '',
    params.HR_remarks || '',
    
    // Signatures
    params.auditorSignature || '',
    params.smSignature || '',
    
    // Images JSON
    params.questionImagesJSON || ''
  ];
}

/**
 * Sets up headers for the QA sheet
 */
function setupQAHeaders(sheet) {
  const headers = [
    'Timestamp',
    'Submission Time',
    'QA Auditor Name',
    'QA Auditor ID',
    'Area Manager Name',
    'Area Manager ID',
    'Store Name',
    'Store ID',
    'City',
    'Region',
    'Total Score',
    'Max Score',
    'Score Percentage',
    
    // Zero Tolerance
    'ZT_1', 'ZT_2', 'ZT_3', 'ZT_4', 'ZT_5', 'ZT_6',
    'Zero Tolerance Remarks',
    
    // Store (94 questions)
    'S_1', 'S_2', 'S_3', 'S_4', 'S_5', 'S_6', 'S_7', 'S_8', 'S_9', 'S_10',
    'S_11', 'S_12', 'S_13', 'S_14', 'S_15', 'S_16', 'S_17', 'S_18', 'S_19', 'S_20',
    'S_21', 'S_22', 'S_23', 'S_24', 'S_25', 'S_26', 'S_27', 'S_28', 'S_29', 'S_30',
    'S_31', 'S_32', 'S_33', 'S_34', 'S_35', 'S_36', 'S_37', 'S_38', 'S_39', 'S_40',
    'S_41', 'S_42', 'S_43', 'S_44', 'S_45', 'S_46', 'S_47', 'S_48', 'S_49', 'S_50',
    'S_51', 'S_52', 'S_53', 'S_54', 'S_55', 'S_56', 'S_57', 'S_58', 'S_59', 'S_60',
    'S_61', 'S_62', 'S_63', 'S_64', 'S_65', 'S_66', 'S_67', 'S_68', 'S_69', 'S_70',
    'S_71', 'S_72', 'S_73', 'S_74', 'S_75', 'S_76', 'S_77', 'S_78', 'S_79', 'S_80',
    'S_81', 'S_82', 'S_83', 'S_84', 'S_85', 'S_86', 'S_87', 'S_88', 'S_89', 'S_90',
    'S_91', 'S_92', 'S_93', 'S_94',
    'Store Remarks',
    
    // A Section
    'A_1', 'A_2', 'A_3',
    'A Remarks',
    
    // Maintenance
    'M_1', 'M_2', 'M_3', 'M_4', 'M_5', 'M_6', 'M_7', 'M_8', 'M_9', 'M_10', 'M_11',
    'Maintenance Remarks',
    
    // HR
    'HR_1', 'HR_2',
    'HR Remarks',
    
    // Signatures
    'Auditor Signature',
    'SM Signature',
    
    // Images
    'Question Images JSON'
  ];
  
  sheet.appendRow(headers);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4A5568');
  headerRange.setFontColor('#FFFFFF');
  
  Logger.log('Headers set up: ' + headers.length + ' columns');
}

/**
 * Test function
 */
function testQAScript() {
  Logger.log('=== Test QA Script ===');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QA');
  Logger.log('Sheet found: ' + (sheet !== null));
  Logger.log('Last row: ' + (sheet ? sheet.getLastRow() : 'N/A'));
}
