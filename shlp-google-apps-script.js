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
        // Store Readiness (1-5)
        'SHLP_1', 'SHLP_2', 'SHLP_3', 'SHLP_4', 'SHLP_5',
        // Product Quality & Standards (6-10)
        'SHLP_6', 'SHLP_7', 'SHLP_8', 'SHLP_9', 'SHLP_10',
        // Cash & Administration (11-15)
        'SHLP_11', 'SHLP_12', 'SHLP_13', 'SHLP_14', 'SHLP_15',
        // Team Management (16-23)
        'SHLP_16', 'SHLP_17', 'SHLP_18', 'SHLP_19', 'SHLP_20', 'SHLP_21', 'SHLP_22', 'SHLP_23',
        // Operations & Availability (24-30)
        'SHLP_24', 'SHLP_25', 'SHLP_26', 'SHLP_27', 'SHLP_28', 'SHLP_29', 'SHLP_30',
        // Safety & Compliance (31-33)
        'SHLP_31', 'SHLP_32', 'SHLP_33',
        // Business Acumen (34-36)
        'SHLP_34', 'SHLP_35', 'SHLP_36',
        // Section Scores and Overall
        'Store_Readiness_Score', 'Product_Quality_Score', 'Cash_Admin_Score', 'Team_Management_Score', 
        'Operations_Score', 'Safety_Score', 'Business_Score', 'Overall_Score', 'Overall_Percentage'
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
      // Store Readiness (1-5)
      params.SHLP_1 || '', params.SHLP_2 || '', params.SHLP_3 || '', params.SHLP_4 || '', params.SHLP_5 || '',
      // Product Quality & Standards (6-10)
      params.SHLP_6 || '', params.SHLP_7 || '', params.SHLP_8 || '', params.SHLP_9 || '', params.SHLP_10 || '',
      // Cash & Administration (11-15)
      params.SHLP_11 || '', params.SHLP_12 || '', params.SHLP_13 || '', params.SHLP_14 || '', params.SHLP_15 || '',
      // Team Management (16-23)
      params.SHLP_16 || '', params.SHLP_17 || '', params.SHLP_18 || '', params.SHLP_19 || '', 
      params.SHLP_20 || '', params.SHLP_21 || '', params.SHLP_22 || '', params.SHLP_23 || '',
      // Operations & Availability (24-30)
      params.SHLP_24 || '', params.SHLP_25 || '', params.SHLP_26 || '', params.SHLP_27 || '', 
      params.SHLP_28 || '', params.SHLP_29 || '', params.SHLP_30 || '',
      // Safety & Compliance (31-33)
      params.SHLP_31 || '', params.SHLP_32 || '', params.SHLP_33 || '',
      // Business Acumen (34-36)
      params.SHLP_34 || '', params.SHLP_35 || '', params.SHLP_36 || '',
      // Section scores
      params.Store_Readiness_Score || '',
      params.Product_Quality_Score || '',
      params.Cash_Admin_Score || '',
      params.Team_Management_Score || '',
      params.Operations_Score || '',
      params.Safety_Score || '',
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
    'Store_Readiness': ['SHLP_1', 'SHLP_2', 'SHLP_3', 'SHLP_4', 'SHLP_5'],
    'Product_Quality': ['SHLP_6', 'SHLP_7', 'SHLP_8', 'SHLP_9', 'SHLP_10'],
    'Cash_Admin': ['SHLP_11', 'SHLP_12', 'SHLP_13', 'SHLP_14', 'SHLP_15'],
    'Team_Management': ['SHLP_16', 'SHLP_17', 'SHLP_18', 'SHLP_19', 'SHLP_20', 'SHLP_21', 'SHLP_22', 'SHLP_23'],
    'Operations': ['SHLP_24', 'SHLP_25', 'SHLP_26', 'SHLP_27', 'SHLP_28', 'SHLP_29', 'SHLP_30'],
    'Safety': ['SHLP_31', 'SHLP_32', 'SHLP_33'],
    'Business': ['SHLP_34', 'SHLP_35', 'SHLP_36']
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