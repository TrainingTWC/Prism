function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // Wait up to 30 seconds for other processes to finish
  
  try {
    Logger.log('=== SHLP Checklist Submission Started ===');
    
    // Get parameters
    var params = (e && e.parameter) ? e.parameter : {};
    Logger.log('Total parameters received: ' + Object.keys(params).length);
    
    // Get spreadsheet and sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('SHLP Checklist');
    
    if (!sheet) {
      Logger.log('ERROR: Sheet "SHLP Checklist" not found. Creating it...');
      sheet = ss.insertSheet('SHLP Checklist');
    }
    
    Logger.log('Sheet found/created. Current rows: ' + sheet.getLastRow());
    
    // Create header if sheet is empty
    if (sheet.getLastRow() === 0) {
      Logger.log('Creating header row');
      var header = [
        'Server Timestamp', 'Submission Time', 'Employee Name', 'Employee ID', 'Store', 'Area Manager', 'Trainer',
        // Store Readiness (1-4)
        'SHLP_1', 'SHLP_2', 'SHLP_3', 'SHLP_4',
        // Product Quality & Standards (5-9)
        'SHLP_5', 'SHLP_6', 'SHLP_7', 'SHLP_8', 'SHLP_9',
        // Cash & Administration (10-14)
        'SHLP_10', 'SHLP_11', 'SHLP_12', 'SHLP_13', 'SHLP_14',
        // Team Management (15-22)
        'SHLP_15', 'SHLP_16', 'SHLP_17', 'SHLP_18', 'SHLP_19', 'SHLP_20', 'SHLP_21', 'SHLP_22',
        // Operations & Availability (23-29)
        'SHLP_23', 'SHLP_24', 'SHLP_25', 'SHLP_26', 'SHLP_27', 'SHLP_28', 'SHLP_29',
        // Safety & Compliance (30-32)
        'SHLP_30', 'SHLP_31', 'SHLP_32',
        // Shift Closing (33)
        'SHLP_33',
        // Business Acumen (34-35)
        'SHLP_34', 'SHLP_35',
        // Remarks columns for each question
        'SHLP_1_remarks', 'SHLP_2_remarks', 'SHLP_3_remarks', 'SHLP_4_remarks',
        'SHLP_5_remarks', 'SHLP_6_remarks', 'SHLP_7_remarks', 'SHLP_8_remarks', 'SHLP_9_remarks',
        'SHLP_10_remarks', 'SHLP_11_remarks', 'SHLP_12_remarks', 'SHLP_13_remarks', 'SHLP_14_remarks',
        'SHLP_15_remarks', 'SHLP_16_remarks', 'SHLP_17_remarks', 'SHLP_18_remarks', 'SHLP_19_remarks',
        'SHLP_20_remarks', 'SHLP_21_remarks', 'SHLP_22_remarks',
        'SHLP_23_remarks', 'SHLP_24_remarks', 'SHLP_25_remarks', 'SHLP_26_remarks', 'SHLP_27_remarks',
        'SHLP_28_remarks', 'SHLP_29_remarks',
        'SHLP_30_remarks', 'SHLP_31_remarks', 'SHLP_32_remarks',
        'SHLP_33_remarks',
        'SHLP_34_remarks', 'SHLP_35_remarks',
        // Section Scores and Overall
        'Store_Readiness_Score', 'Product_Quality_Score', 'Cash_Admin_Score', 'Team_Management_Score', 
        'Operations_Score', 'Safety_Score', 'Shift_Closing_Score', 'Business_Score', 'Overall_Score', 'Overall_Percentage'
      ];
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
      sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
      Logger.log('Header created with ' + header.length + ' columns');
    }
    
    // Build row data
    var rowData = [
      new Date(), // Server timestamp
      params.submissionTime || new Date().toISOString(),
      params.empName || '',
      params.empId || '',
      params.store || '',
      params.am || '',
      params.trainer || '',
      // Store Readiness (1-4)
      params.SHLP_1 || '', params.SHLP_2 || '', params.SHLP_3 || '', params.SHLP_4 || '',
      // Product Quality & Standards (5-9)
      params.SHLP_5 || '', params.SHLP_6 || '', params.SHLP_7 || '', params.SHLP_8 || '', params.SHLP_9 || '',
      // Cash & Administration (10-14)
      params.SHLP_10 || '', params.SHLP_11 || '', params.SHLP_12 || '', params.SHLP_13 || '', params.SHLP_14 || '',
      // Team Management (15-22)
      params.SHLP_15 || '', params.SHLP_16 || '', params.SHLP_17 || '', params.SHLP_18 || '', 
      params.SHLP_19 || '', params.SHLP_20 || '', params.SHLP_21 || '', params.SHLP_22 || '',
      // Operations & Availability (23-29)
      params.SHLP_23 || '', params.SHLP_24 || '', params.SHLP_25 || '', params.SHLP_26 || '', 
      params.SHLP_27 || '', params.SHLP_28 || '', params.SHLP_29 || '',
      // Safety & Compliance (30-32)
      params.SHLP_30 || '', params.SHLP_31 || '', params.SHLP_32 || '',
      // Shift Closing (33)
      params.SHLP_33 || '',
      // Business Acumen (34-35)
      params.SHLP_34 || '', params.SHLP_35 || '',
      // Remarks for each question
      params.SHLP_1_remarks || '', params.SHLP_2_remarks || '', params.SHLP_3_remarks || '', params.SHLP_4_remarks || '',
      params.SHLP_5_remarks || '', params.SHLP_6_remarks || '', params.SHLP_7_remarks || '', params.SHLP_8_remarks || '', params.SHLP_9_remarks || '',
      params.SHLP_10_remarks || '', params.SHLP_11_remarks || '', params.SHLP_12_remarks || '', params.SHLP_13_remarks || '', params.SHLP_14_remarks || '',
      params.SHLP_15_remarks || '', params.SHLP_16_remarks || '', params.SHLP_17_remarks || '', params.SHLP_18_remarks || '', params.SHLP_19_remarks || '',
      params.SHLP_20_remarks || '', params.SHLP_21_remarks || '', params.SHLP_22_remarks || '',
      params.SHLP_23_remarks || '', params.SHLP_24_remarks || '', params.SHLP_25_remarks || '', params.SHLP_26_remarks || '', params.SHLP_27_remarks || '',
      params.SHLP_28_remarks || '', params.SHLP_29_remarks || '',
      params.SHLP_30_remarks || '', params.SHLP_31_remarks || '', params.SHLP_32_remarks || '',
      params.SHLP_33_remarks || '',
      params.SHLP_34_remarks || '', params.SHLP_35_remarks || '',
      // Section scores
      params.Store_Readiness_Score || '',
      params.Product_Quality_Score || '',
      params.Cash_Admin_Score || '',
      params.Team_Management_Score || '',
      params.Operations_Score || '',
      params.Safety_Score || '',
      params.Shift_Closing_Score || '',
      params.Business_Score || '',
      params.Overall_Score || '',
      params.Overall_Percentage || ''
    ];
    
    Logger.log('Row data prepared: ' + rowData.length + ' columns');
    Logger.log('Sample data - Employee: ' + params.empName + ', Store: ' + params.store + ', Overall Score: ' + params.Overall_Percentage);
    Logger.log('Sample questions - SHLP_1: ' + params.SHLP_1 + ', SHLP_10: ' + params.SHLP_10 + ', SHLP_20: ' + params.SHLP_20);
    
    // Append the row
    sheet.appendRow(rowData);
    Logger.log('Row successfully added to sheet');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'success',
        message: 'SHLP Assessment submitted successfully',
        timestamp: new Date(),
        rowCount: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('ERROR in doPost: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'error',
        message: error.toString(),
        timestamp: new Date()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Test function to verify the script works
function testSHLPSubmission() {
  Logger.log('=== Testing SHLP Submission ===');
  
  var testParams = {
    parameter: {
      empName: 'Test Employee',
      empId: 'EMP001',
      store: 'Test Store',
      am: 'Test AM',
      trainer: 'Test Trainer',
      SHLP_1: '2',
      SHLP_2: '1',
      SHLP_3: '2',
      SHLP_4: '0',
      SHLP_5: '1',
      Store_Readiness_Score: '60',
      Overall_Score: '45',
      Overall_Percentage: '62.5',
      submissionTime: new Date().toISOString()
    }
  };
  
  var result = doPost(testParams);
  Logger.log('Test result: ' + result.getContent());
}

// Function to get SHLP data (similar to AM Operations)
function getSHLPData() {
  try {
    Logger.log('=== Getting SHLP Data ===');
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('SHLP Checklist');
    
    if (!sheet) {
      Logger.log('SHLP Checklist sheet not found');
      return [];
    }
    
    var data = sheet.getDataRange().getValues();
    Logger.log('Retrieved ' + data.length + ' rows from SHLP sheet');
    
    if (data.length <= 1) {
      Logger.log('No data rows found (only header or empty sheet)');
      return [];
    }
    
    var headers = data[0];
    var result = [];
    
    // Process each row (skip header)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var record = {};
      
      // Map each column to its header
      for (var j = 0; j < headers.length && j < row.length; j++) {
        record[headers[j]] = row[j];
      }
      
      result.push(record);
    }
    
    Logger.log('Processed ' + result.length + ' SHLP records');
    return result;
    
  } catch (error) {
    Logger.log('ERROR in getSHLPData: ' + error.toString());
    return [];
  }
}

// API endpoint handler
function doGet(e) {
  var action = e.parameter.action;
  
  switch (action) {
    case 'getSHLPData':
      var data = getSHLPData();
      return ContentService
        .createTextOutput(JSON.stringify({
          result: 'success',
          data: data,
          timestamp: new Date()
        }))
        .setMimeType(ContentService.MimeType.JSON);
        
    case 'test':
      return ContentService
        .createTextOutput(JSON.stringify({
          result: 'success',
          message: 'SHLP Google Apps Script is working',
          timestamp: new Date()
        }))
        .setMimeType(ContentService.MimeType.JSON);
        
    default:
      return ContentService
        .createTextOutput(JSON.stringify({
          result: 'error',
          message: 'Invalid action parameter. Use: getSHLPData or test',
          timestamp: new Date()
        }))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function to calculate section scores (if needed for server-side validation)
function calculateSectionScores(responses) {
  var sections = {
    'Store_Readiness': ['SHLP_1', 'SHLP_2', 'SHLP_3', 'SHLP_4'],
    'Product_Quality': ['SHLP_5', 'SHLP_6', 'SHLP_7', 'SHLP_8', 'SHLP_9'],
    'Cash_Admin': ['SHLP_10', 'SHLP_11', 'SHLP_12', 'SHLP_13', 'SHLP_14'],
    'Team_Management': ['SHLP_15', 'SHLP_16', 'SHLP_17', 'SHLP_18', 'SHLP_19', 'SHLP_20', 'SHLP_21', 'SHLP_22'],
    'Operations': ['SHLP_23', 'SHLP_24', 'SHLP_25', 'SHLP_26', 'SHLP_27', 'SHLP_28', 'SHLP_29'],
    'Safety': ['SHLP_30', 'SHLP_31', 'SHLP_32'],
    'Shift_Closing': ['SHLP_33'],
    'Business': ['SHLP_34', 'SHLP_35']
  };
  
  var sectionScores = {};
  var totalScore = 0;
  var totalMaxScore = 0;
  
  for (var sectionName in sections) {
    var questions = sections[sectionName];
    var sectionScore = 0;
    var sectionMaxScore = questions.length * 2; // Each question max 2 points
    
    for (var i = 0; i < questions.length; i++) {
      var questionId = questions[i];
      var response = responses[questionId];
      if (response && !isNaN(parseInt(response))) {
        sectionScore += parseInt(response);
      }
    }
    
    var sectionPercentage = sectionMaxScore > 0 ? Math.round((sectionScore / sectionMaxScore) * 100) : 0;
    sectionScores[sectionName] = sectionPercentage;
    
    totalScore += sectionScore;
    totalMaxScore += sectionMaxScore;
  }
  
  var overallPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  sectionScores.Overall = overallPercentage;
  
  return sectionScores;
}