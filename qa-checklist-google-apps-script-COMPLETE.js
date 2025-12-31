/**
 * Quality Assurance (QA) Checklist Google Apps Script - COMPLETE VERSION
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
 * 
 * Functions:
 * 1. doPost() - Receives QA checklist submissions (create/update)
 * 2. doGet() - Returns QA data for the dashboard
 * 3. setupQAHeaders() - Sets up the spreadsheet headers
 * 4. testQAScript() - Test function for debugging
 * 5. updateSubmission() - Updates existing submission by timestamp
 */

/**
 * Handles GET requests to return QA data for the dashboard
 */
function doGet(e) {
  try {
    Logger.log('=== QA Data GET Request Started ===');
    Logger.log('Request timestamp: ' + new Date().toISOString());
    console.log('QA Data request received');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Spreadsheet accessed: ' + ss.getName());
    let sheet = ss.getSheetByName('QA');
    
    // If no sheet exists or it's empty, return empty array
    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log('No QA data found - sheet empty or does not exist');
      console.log('No QA data found');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('QA sheet found with ' + sheet.getLastRow() + ' rows');
    
    // Get all data from the sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Remove header row
    const headers = values[0];
    const dataRows = values.slice(1);
    
    Logger.log('Headers found: ' + headers.length + ' columns');
    Logger.log('Data rows found: ' + dataRows.length + ' submissions');
    console.log(`Found ${dataRows.length} QA submissions`);
    
    Logger.log('Starting data processing...');
    // Convert to JSON format expected by dashboard
    const qaSubmissions = dataRows.map((row, index) => {
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
    
    Logger.log('Data processing complete - ' + qaSubmissions.length + ' submissions processed');
    Logger.log('Sample submission structure: ' + JSON.stringify(Object.keys(qaSubmissions[0] || {})));
    console.log('QA data successfully processed for dashboard');
    
    Logger.log('=== QA Data GET Request Completed Successfully ===');
    
    // Return the data as JSON
    return ContentService
      .createTextOutput(JSON.stringify(qaSubmissions))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('=== ERROR in QA Data GET Request ===');
    Logger.log('Error type: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
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
    Logger.log('=== QA Survey POST Submission Started ===');
    Logger.log('Request timestamp: ' + new Date().toISOString());
    console.log('QA Survey submission received');
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Spreadsheet accessed: ' + ss.getName());
    let sheet = ss.getSheetByName('QA');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('QA');
      Logger.log('Created new QA sheet');
      console.log('Created new QA sheet');
    } else {
      Logger.log('QA sheet already exists with ' + sheet.getLastRow() + ' rows');
    }
    
    // Parse the form data
    const params = e.parameter;
    Logger.log('Received parameters count: ' + Object.keys(params).length);
    console.log('Received parameters:', JSON.stringify(params));
    
    // Check if this is an update request
    const isUpdate = params.action === 'update' && params.rowId;
    
    if (isUpdate) {
      Logger.log('UPDATE REQUEST detected for rowId: ' + params.rowId);
      return updateSubmission(sheet, params);
    }
    
    // Get current timestamp
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    Logger.log('Generated timestamp: ' + timestamp);
    
    // Initialize headers if this is the first submission
    if (sheet.getLastRow() === 0) {
      Logger.log('First submission - setting up headers');
      setupQAHeaders(sheet);
    }
    
    Logger.log('Preparing row data with all 116 checklist items...');
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
      params.city || '',                           // I: City
      params.region || '',                         // J: Region
      
      // Scoring Information
      parseFloat(params.totalScore) || 0,          // K: Total Score
      parseFloat(params.maxScore) || 0,            // L: Max Score
      parseFloat(params.scorePercentage) || 0,     // M: Score Percentage
      
      // Zero Tolerance Section (6 questions)
      params.ZeroTolerance_ZT_1 || '',            // M: ZT_1
      params.ZeroTolerance_ZT_2 || '',            // N: ZT_2
      params.ZeroTolerance_ZT_3 || '',            // O: ZT_3
      params.ZeroTolerance_ZT_4 || '',            // P: ZT_4
      params.ZeroTolerance_ZT_5 || '',            // Q: ZT_5
      params.ZeroTolerance_ZT_6 || '',            // R: ZT_6
      params.ZeroTolerance_remarks || '',         // S: Zero Tolerance Remarks
      
      // Store Section (94 questions - S_1 to S_94)
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
      params.Store_remarks || '',                 // Store Remarks
      
      // A Section (3 questions - A_1 to A_3)
      params.A_A_1 || '',                         // A_1
      params.A_A_2 || '',                         // A_2
      params.A_A_3 || '',                         // A_3
      params.A_remarks || '',                     // A Remarks
      
      // Maintenance Section (11 questions - M_1 to M_11)
      params.Maintenance_M_1 || '',               // M_1
      params.Maintenance_M_2 || '',               // M_2
      params.Maintenance_M_3 || '',               // M_3
      params.Maintenance_M_4 || '',               // M_4
      params.Maintenance_M_5 || '',               // M_5
      params.Maintenance_M_6 || '',               // M_6
      params.Maintenance_M_7 || '',               // M_7
      params.Maintenance_M_8 || '',               // M_8
      params.Maintenance_M_9 || '',               // M_9
      params.Maintenance_M_10 || '',              // M_10
      params.Maintenance_M_11 || '',              // M_11
      params.Maintenance_remarks || '',           // Maintenance Remarks
      
      // HR Section (2 questions - HR_1 to HR_2)
      params.HR_HR_1 || '',                       // HR_1
      params.HR_HR_2 || '',                       // HR_2
      params.HR_remarks || '',                    // HR Remarks
      
      // Signatures
      params.auditorSignature || '',              // Auditor Signature (Base64)
      params.smSignature || '',                   // Store Manager Signature (Base64)
      
      // Question Images JSON
      params.questionImagesJSON || ''             // Store all images as JSON for PDF generation
    ];
    
    Logger.log('Row data prepared with ' + rowData.length + ' fields');
    Logger.log('Store: ' + params.storeName + ' (' + params.storeID + ')');
    Logger.log('Region: ' + params.region);
    Logger.log('QA Auditor: ' + params.qaName + ' (' + params.qaId + ')');
    Logger.log('Score: ' + params.totalScore + '/' + params.maxScore + ' (' + params.scorePercentage + '%)');
    
    // Add the data to the sheet
    sheet.appendRow(rowData);
    Logger.log('Data appended to row ' + sheet.getLastRow());
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    Logger.log('Columns auto-resized');
    
    Logger.log('=== QA survey data successfully saved to sheet ===');
    console.log('QA survey data successfully saved to sheet');
    
    Logger.log('=== QA survey data successfully saved to sheet ===');
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
    Logger.log('=== ERROR in QA Survey POST Submission ===');
    Logger.log('Error type: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
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
  Logger.log('Setting up QA sheet headers...');
  
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
    'City',                                    // I
    'Region',                                  // J
    
    // Scoring Information
    'Total Score',                             // K
    'Max Score',                               // L
    'Score Percentage',                        // M
    
    // Zero Tolerance Section (6 questions)
    'ZT_1: No expired food products',          // M
    'ZT_2: Secondary shelf life compliance',   // N
    'ZT_3: Storage conditions',                // O
    'ZT_4: Water TDS compliance',              // P
    'ZT_5: Temperature sensitive transfer',    // Q
    'ZT_6: No pest activity',                  // R
    'Zero Tolerance Remarks',                  // S
    
    // Store Section (94 questions)
    'S_1: No junk material',
    'S_2: Previous audit CAPA',
    'S_3: Dishwasher/sink cleanliness',
    'S_4: Glass doors condition',
    'S_5: Area below equipment clean',
    'S_6: Customer furniture condition',
    'S_7: Customer area organized',
    'S_8: Food not on floor',
    'S_9: Food-contact materials clean',
    'S_10: Color-coded segregation',
    'S_11: Glasses clean and arranged',
    'S_12: Equipment cleaned per SOP',
    'S_13: Chiller/freezer temperatures',
    'S_14: Merrychef condition',
    'S_15: Kitchen equipment operational',
    'S_16: Coffee machine operational',
    'S_17: Shakers/funnels clean',
    'S_18: Portafilter clean',
    'S_19: Small wares clean',
    'S_20: UTF Holder stored properly',
    'S_21: Paper cups/supplies available',
    'S_22: Freezer/FDU/chillers clean',
    'S_23: Ice cube box clean',
    'S_24: Mixer/blender clean',
    'S_25: Housekeeping materials separated',
    'S_26: Floor mat cleaned',
    'S_27: Bar mat cleaned',
    'S_28: Carry bag clean',
    'S_29: RO machine clean',
    'S_30: Food/non-food separated',
    'S_31: FDU temperature verified',
    'S_32: In-process food properly tagged',
    'S_33: Veg/non-veg segregation',
    'S_34: Expired items labeled',
    'S_35: No carton boxes in production',
    'S_36: No objectionable items',
    'S_37: Waste removed daily',
    'S_38: Partner well-groomed',
    'S_39: Personal hygiene maintained',
    'S_40: Handwashing procedures',
    'S_41: Visitors follow safety measures',
    'S_42: Personal belongings arranged',
    'S_43: Gloves used properly',
    'S_44: First aid kit available',
    'S_45: No unauthorized visitors',
    'S_46: Recipe charts available',
    'S_47: FMCG range compliant',
    'S_48: Raw/cooked segregation',
    'S_49: Approved vendors',
    'S_50: Beverages verified with BRM',
    'S_51: Product weight/appearance verified',
    'S_52: No improper repackaging',
    'S_53: Measuring tools available',
    'S_54: Food-grade packaging',
    'S_55: Espresso sensory evaluation',
    'S_56: No pest infestation',
    'S_57: MSDS available for pest control',
    'S_58: Pest control layout available',
    'S_59: Chemicals stored properly',
    'S_60: Dilution charts available',
    'S_61: MSDS for cleaning chemicals',
    'S_62: Spray guns labeled',
    'S_63: Dustbins closed/clean',
    'S_64: Waste not in BOH',
    'S_65: Washroom clean',
    'S_66: Magic box clean',
    'S_67: Cleaning per schedule',
    'S_68: No water stagnation',
    'S_69: Fire extinguisher awareness',
    'S_70: Team adheres to SOPs',
    'S_71: Receiving temperatures recorded',
    'S_72: Transport vehicles clean',
    'S_73: Temperature monitoring updated',
    'S_74: Devices calibrated',
    'S_75: Food handlers trained',
    'S_76: Hygiene verification updated',
    'S_77: Documentation retained',
    'S_78: Pest control records',
    'S_79: FIFO/FEFO followed',
    'S_80: Color-coded cloths',
    'S_81: Thawing per SOP',
    'S_82: Glue pads inspected',
    'S_83: Smallware cleaned',
    'S_84: Food dial-in checklist',
    'S_85: FSSAI displayed',
    'S_86: FOSTAC certification',
    'S_87: Drainages cleaned',
    'S_88: Moulds segregated/clean',
    'S_89: Wet floor signs',
    'S_90: Step stools maintained',
    'S_91: FDU arranged properly',
    'S_92: Reusable condiments stored',
    'S_93: All signages in place',
    'S_94: Menu boards functional',
    'Store Remarks',
    
    // A Section (3 questions)
    'A_1: Potable water meets standards',
    'A_2: Food material tested',
    'A_3: Induction training completed',
    'A Remarks',
    
    // Maintenance Section (11 questions)
    'M_1: Windows with insect mesh',
    'M_2: No structural damage',
    'M_3: No unsecured wires',
    'M_4: Lighting covered',
    'M_5: Fire extinguishers working',
    'M_6: No pest entry points',
    'M_7: Pest-o-flash placed properly',
    'M_8: Equipment maintenance file',
    'M_9: RO service records',
    'M_10: Plumbing maintained',
    'M_11: Refrigeration working',
    'Maintenance Remarks',
    
    // HR Section (2 questions)
    'HR_1: Medical records available',
    'HR_2: Annual medical exams',
    'HR Remarks',
    
    // Signatures
    'Auditor Signature',
    'Store Manager Signature',
    
    // Question Images
    'Question Images JSON'
  ];
  
  Logger.log('Total headers: ' + headers.length);
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#dc2626'); // Red background for QA
  headerRange.setFontColor('white');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('QA sheet headers set up successfully');
  console.log('QA sheet headers set up successfully');
}

/**
 * Test function to verify the script setup - creates sample data
 */
function testQAScript() {
  Logger.log('=== Testing QA Script Setup ===');
  console.log('Testing QA script setup...');
  
  // Test data for POST (submission) - Updated to match new structure
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
      totalScore: 185,
      maxScore: 206,
      scorePercentage: 89.8,
      
      // Zero Tolerance (6 questions)
      ZeroTolerance_ZT_1: 'compliant',
      ZeroTolerance_ZT_2: 'compliant',
      ZeroTolerance_ZT_3: 'compliant',
      ZeroTolerance_ZT_4: 'compliant',
      ZeroTolerance_ZT_5: 'compliant',
      ZeroTolerance_ZT_6: 'compliant',
      ZeroTolerance_remarks: 'All critical food safety standards met.',
      
      // Store Section (94 questions - sample a few)
      Store_S_1: 'compliant',
      Store_S_2: 'compliant',
      Store_S_3: 'partially-compliant',
      Store_S_4: 'compliant',
      Store_S_5: 'compliant',
      Store_S_10: 'compliant',
      Store_S_20: 'compliant',
      Store_S_30: 'partially-compliant',
      Store_S_40: 'compliant',
      Store_S_50: 'compliant',
      Store_S_60: 'compliant',
      Store_S_70: 'compliant',
      Store_S_80: 'compliant',
      Store_S_90: 'compliant',
      Store_S_94: 'compliant',
      Store_remarks: 'Store operations running smoothly with minor improvements needed.',
      
      // A Section (3 questions)
      A_A_1: 'compliant',
      A_A_2: 'compliant',
      A_A_3: 'partially-compliant',
      A_remarks: 'Training records maintained properly.',
      
      // Maintenance (11 questions)
      Maintenance_M_1: 'compliant',
      Maintenance_M_2: 'compliant',
      Maintenance_M_3: 'compliant',
      Maintenance_M_4: 'partially-compliant',
      Maintenance_M_5: 'compliant',
      Maintenance_M_6: 'compliant',
      Maintenance_M_7: 'compliant',
      Maintenance_M_8: 'compliant',
      Maintenance_M_9: 'compliant',
      Maintenance_M_10: 'compliant',
      Maintenance_M_11: 'compliant',
      Maintenance_remarks: 'Equipment in good condition.',
      
      // HR Section (2 questions)
      HR_HR_1: 'compliant',
      HR_HR_2: 'compliant',
      HR_remarks: 'All medical records up to date.'
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
  
  Logger.log('=== QA Script Test Complete ===');
}

/**
 * Function to get QA submission statistics (for debugging)
 */
function getQAStats() {
  Logger.log('=== Retrieving QA Statistics ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QA');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    Logger.log('No QA submissions found');
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
  Logger.log('=== QA Statistics Retrieved ===');
  
  return stats;
}

/**
 * Function to clear all QA data (for testing purposes)
 */
function clearQAData() {
  Logger.log('=== Clearing QA Data ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QA');
  
  if (sheet) {
    const rowCount = sheet.getLastRow();
    sheet.clear();
    setupQAHeaders(sheet);
    Logger.log('QA data cleared - ' + (rowCount - 1) + ' rows removed');
    Logger.log('Headers reset');
  } else {
    Logger.log('No QA sheet found');
  }
  
  Logger.log('=== QA Data Cleared ===');
}

/**
 * Update existing QA submission
 * Finds the row by matching submission time and updates all fields
 */
function updateSubmission(sheet, params) {
  try {
    Logger.log('=== UPDATE SUBMISSION Started ===');
    Logger.log('Looking for submission with timestamp: ' + params.rowId);
    
    // Get all data from sheet
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find the row with matching submission time (column B - index 1)
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const submissionTime = data[i][1]; // Column B - Submission Time
      if (submissionTime === params.rowId) {
        targetRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        Logger.log('Found matching submission at row: ' + targetRowIndex);
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      Logger.log('ERROR: Could not find submission with timestamp: ' + params.rowId);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Submission not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get current timestamp for update
    const now = new Date();
    const updateTimestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    Logger.log('Preparing updated row data...');
    // Prepare the updated row data (same structure as create)
    const rowData = [
      updateTimestamp + ' (Updated)',              // A: Timestamp - mark as updated
      params.submissionTime || params.rowId,       // B: Original Submission Time (preserve for ID)
      params.qaName || '',                         // C: QA Auditor Name
      params.qaId || '',                           // D: QA Auditor ID
      params.amName || '',                         // E: Area Manager Name
      params.amId || '',                           // F: Area Manager ID
      params.storeName || '',                      // G: Store Name
      params.storeID || '',                        // H: Store ID
      params.city || '',                           // I: City
      params.region || '',                         // J: Region
      
      // Scoring Information
      parseFloat(params.totalScore) || 0,          // K: Total Score
      parseFloat(params.maxScore) || 0,            // L: Max Score
      parseFloat(params.scorePercentage) || 0,     // M: Score Percentage
      
      // Zero Tolerance Section (6 questions)
      params.ZeroTolerance_ZT_1 || '',            // M: ZT_1
      params.ZeroTolerance_ZT_2 || '',            // N: ZT_2
      params.ZeroTolerance_ZT_3 || '',            // O: ZT_3
      params.ZeroTolerance_ZT_4 || '',            // P: ZT_4
      params.ZeroTolerance_ZT_5 || '',            // Q: ZT_5
      params.ZeroTolerance_ZT_6 || '',            // R: ZT_6
      params.ZeroTolerance_remarks || '',         // S: Zero Tolerance Remarks
      
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
      params.Store_remarks || '',                 // Store Remarks
      
      // A Section (3 questions)
      params.A_A_1 || '',                         // A_1
      params.A_A_2 || '',                         // A_2
      params.A_A_3 || '',                         // A_3
      params.A_remarks || '',                     // A Remarks
      
      // Maintenance Section (11 questions)
      params.Maintenance_M_1 || '',               // M_1
      params.Maintenance_M_2 || '',               // M_2
      params.Maintenance_M_3 || '',               // M_3
      params.Maintenance_M_4 || '',               // M_4
      params.Maintenance_M_5 || '',               // M_5
      params.Maintenance_M_6 || '',               // M_6
      params.Maintenance_M_7 || '',               // M_7
      params.Maintenance_M_8 || '',               // M_8
      params.Maintenance_M_9 || '',               // M_9
      params.Maintenance_M_10 || '',              // M_10
      params.Maintenance_M_11 || '',              // M_11
      params.Maintenance_remarks || '',           // Maintenance Remarks
      
      // HR Section (2 questions)
      params.HR_HR_1 || '',                       // HR_1
      params.HR_HR_2 || '',                       // HR_2
      params.HR_remarks || '',                    // HR Remarks
      
      // Signatures (preserve from update or add new)
      params.auditorSignature || '',              // Auditor Signature (Base64)
      params.smSignature || '',                   // Store Manager Signature (Base64)
      
      // Question Images JSON
      params.questionImagesJSON || ''             // Store all images as JSON for PDF generation
    ];
    
    Logger.log('Row data prepared with ' + rowData.length + ' fields');
    
    // Update the row
    const range = sheet.getRange(targetRowIndex, 1, 1, rowData.length);
    range.setValues([rowData]);
    
    Logger.log('✅ Row ' + targetRowIndex + ' updated successfully');
    Logger.log('=== UPDATE SUBMISSION Completed ===');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'QA submission updated successfully',
      rowNumber: targetRowIndex
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('ERROR updating submission: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Function to clear all QA data (for testing purposes)
 */
function clearQAData() {
  Logger.log('=== Clearing QA Data ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('QA');
  
  if (sheet) {
    const rowCount = sheet.getLastRow();
    sheet.clear();
    setupQAHeaders(sheet);
    Logger.log('QA data cleared - ' + (rowCount - 1) + ' rows removed');
    Logger.log('Headers reset');
    console.log('QA data cleared and headers reset');
  } else {
    Logger.log('No QA sheet found to clear');
  }
  
  Logger.log('=== QA Data Clear Complete ===');
}