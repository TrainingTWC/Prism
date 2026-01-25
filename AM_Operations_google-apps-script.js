function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AM Ops Checklist');
    if (!sheet) throw new Error("Sheet 'AM Ops Checklist' not found");

    // Create header if sheet is empty
    if (sheet.getLastRow() === 0) {
      var header = [
        'Server Timestamp',
        'Submission Time', 
        'HR Name',
        'HR ID',
        'AM Name',
        'AM ID',
        'Trainer Name',
        'Trainer ID',
        'Store Name',
        'Store ID',
        'Region',
        // Customer Greeting (CG) - Questions 1-13
        'CG_1', 'CG_2', 'CG_3', 'CG_4', 'CG_5', 'CG_6', 'CG_7', 'CG_8', 'CG_9', 'CG_10', 'CG_11', 'CG_12', 'CG_13',
        // On-Time Arrival (OTA) - Questions 101-111
        'OTA_101', 'OTA_102', 'OTA_103', 'OTA_104', 'OTA_105', 'OTA_106', 'OTA_107', 'OTA_108', 'OTA_109', 'OTA_110', 'OTA_111',
        // Food and Safety (FAS) - Questions 201-213
        'FAS_201', 'FAS_202', 'FAS_203', 'FAS_204', 'FAS_205', 'FAS_206', 'FAS_207', 'FAS_208', 'FAS_209', 'FAS_210', 'FAS_211', 'FAS_212', 'FAS_213',
        // Formal Work Standards (FWS) - Questions 301-313
        'FWS_301', 'FWS_302', 'FWS_303', 'FWS_304', 'FWS_305', 'FWS_306', 'FWS_307', 'FWS_308', 'FWS_309', 'FWS_310', 'FWS_311', 'FWS_312', 'FWS_313',
        // Engagement (ENJ) - Questions 401-407
        'ENJ_401', 'ENJ_402', 'ENJ_403', 'ENJ_404', 'ENJ_405', 'ENJ_406', 'ENJ_407',
        // Excellence (EX) - Questions 501-506
        'EX_501', 'EX_502', 'EX_503', 'EX_504', 'EX_505', 'EX_506',
        // Additional Fields
        'Remarks',
        'Image Upload',
        'Overall Score',
        'CG_Score', 'OTA_Score', 'FAS_Score', 'FWS_Score', 'ENJ_Score', 'EX_Score'
      ];
      sheet.appendRow(header);
    }

    // Prepare row data matching header order
    var rowData = [
      new Date(), // Server Timestamp
      params.submissionTime || new Date().toISOString(),
      params.hrName || '',
      params.hrId || '',
      params.amName || '',
      params.amId || '',
      params.trainerName || '',
      params.trainerId || '',
      params.storeName || '',
      params.storeId || '',
      params.region || '',
      
      // Customer Greeting (CG) - Questions 1-13
      params['CG_1'] || '', params['CG_2'] || '', params['CG_3'] || '', params['CG_4'] || '', 
      params['CG_5'] || '', params['CG_6'] || '', params['CG_7'] || '', params['CG_8'] || '', 
      params['CG_9'] || '', params['CG_10'] || '', params['CG_11'] || '', params['CG_12'] || '', params['CG_13'] || '',
      
      // On-Time Arrival (OTA) - Questions 101-111
      params['OTA_101'] || '', params['OTA_102'] || '', params['OTA_103'] || '', params['OTA_104'] || '', 
      params['OTA_105'] || '', params['OTA_106'] || '', params['OTA_107'] || '', params['OTA_108'] || '', 
      params['OTA_109'] || '', params['OTA_110'] || '', params['OTA_111'] || '',
      
      // Food and Safety (FAS) - Questions 201-213
      params['FAS_201'] || '', params['FAS_202'] || '', params['FAS_203'] || '', params['FAS_204'] || '', 
      params['FAS_205'] || '', params['FAS_206'] || '', params['FAS_207'] || '', params['FAS_208'] || '', 
      params['FAS_209'] || '', params['FAS_210'] || '', params['FAS_211'] || '', params['FAS_212'] || '', params['FAS_213'] || '',
      
      // Formal Work Standards (FWS) - Questions 301-313
      params['FWS_301'] || '', params['FWS_302'] || '', params['FWS_303'] || '', params['FWS_304'] || '', 
      params['FWS_305'] || '', params['FWS_306'] || '', params['FWS_307'] || '', params['FWS_308'] || '', 
      params['FWS_309'] || '', params['FWS_310'] || '', params['FWS_311'] || '', params['FWS_312'] || '', params['FWS_313'] || '',
      
      // Engagement (ENJ) - Questions 401-407
      params['ENJ_401'] || '', params['ENJ_402'] || '', params['ENJ_403'] || '', params['ENJ_404'] || '', 
      params['ENJ_405'] || '', params['ENJ_406'] || '', params['ENJ_407'] || '',
      
      // Excellence (EX) - Questions 501-506
      params['EX_501'] || '', params['EX_502'] || '', params['EX_503'] || '', params['EX_504'] || '', 
      params['EX_505'] || '', params['EX_506'] || '',
      
      // Additional Fields
      params.remarks || '',
      params.imageUpload || '',
      params.overallScore || '',
      params.cgScore || '',
      params.otaScore || '',
      params.fasScore || '',
      params.fwsScore || '',
      params.enjScore || '',
      params.exScore || ''
    ];

    // Append the row
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'AM Operations checklist submitted successfully',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        error: 'Failed to submit AM Operations checklist: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'getData';
    
    if (action === 'getData') {
      return getData();
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({error: 'Unknown action'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({error: 'Server error: ' + error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AM Ops Checklist');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data including headers
    var range = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
    var values = range.getValues();
    var headers = values[0];
    var dataRows = values.slice(1);
    
    // Convert to objects with proper structure
    var submissions = dataRows.map(function(row) {
      var submission = {};
      
      // Map basic fields
      headers.forEach(function(header, index) {
        submission[header] = row[index] || '';
      });
      
      // Use the existing Percentage Score column from the sheet (already calculated correctly)
      if (submission['Percentage Score']) {
        var percentStr = String(submission['Percentage Score']).replace('%', '').trim();
        submission.percentageScore = Math.round(parseFloat(percentStr) || 0);
      } else {
        // Fallback: calculate from Overall Score if Percentage Score column doesn't exist
        var overallScore = parseFloat(submission['Overall Score'] || '0');
        var maxPossibleScore = 63;
        submission.percentageScore = Math.round((overallScore / maxPossibleScore) * 100);
      }
      
      // Format submission time
      if (submission['Submission Time']) {
        try {
          var date = new Date(submission['Submission Time']);
          submission.formattedTime = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch (e) {
          submission.formattedTime = submission['Submission Time'];
        }
      }
      
      return submission;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(submissions))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({error: 'Failed to fetch data: ' + error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify the setup
function testSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('AM Ops Checklist');
  
  if (!sheet) {
    sheet = ss.insertSheet('AM Ops Checklist');
  }
  
  return "Setup complete";
}