function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // Wait up to 30 seconds for other processes to finish
  
  try {
    Logger.log('=== AM Operations Checklist Submission Started ===');
    
    // Get parameters
    var params = (e && e.parameter) ? e.parameter : {};
    Logger.log('Total parameters received: ' + Object.keys(params).length);
    
    // Get spreadsheet and sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AM Ops Checklist');
    
    if (!sheet) {
      Logger.log('ERROR: Sheet "AM Ops Checklist" not found. Creating it...');
      sheet = ss.insertSheet('AM Ops Checklist');
    }
    
    Logger.log('Sheet found/created. Current rows: ' + sheet.getLastRow());
    
    // Create header if sheet is empty
    if (sheet.getLastRow() === 0) {
      Logger.log('Creating header row');
      var header = [
        'Server Timestamp', 'Submission Time', 'HR Name', 'HR ID', 'AM Name', 'AM ID', 
        'Trainer Name', 'Trainer ID', 'Store Name', 'Store ID', 'Region',
        // CG Questions (1-13)
        'CG_1', 'CG_2', 'CG_3', 'CG_4', 'CG_5', 'CG_6', 'CG_7', 'CG_8', 'CG_9', 'CG_10', 'CG_11', 'CG_12', 'CG_13',
        // OTA Questions (101-111)
        'OTA_101', 'OTA_102', 'OTA_103', 'OTA_104', 'OTA_105', 'OTA_106', 'OTA_107', 'OTA_108', 'OTA_109', 'OTA_110', 'OTA_111',
        // FAS Questions (201-213)
        'FAS_201', 'FAS_202', 'FAS_203', 'FAS_204', 'FAS_205', 'FAS_206', 'FAS_207', 'FAS_208', 'FAS_209', 'FAS_210', 'FAS_211', 'FAS_212', 'FAS_213',
        // FWS Questions (301-313)
        'FWS_301', 'FWS_302', 'FWS_303', 'FWS_304', 'FWS_305', 'FWS_306', 'FWS_307', 'FWS_308', 'FWS_309', 'FWS_310', 'FWS_311', 'FWS_312', 'FWS_313',
        // ENJ Questions (401-407)
        'ENJ_401', 'ENJ_402', 'ENJ_403', 'ENJ_404', 'ENJ_405', 'ENJ_406', 'ENJ_407',
        // EX Questions (501-506)
        'EX_501', 'EX_502', 'EX_503', 'EX_504', 'EX_505', 'EX_506',
        // SHLP Questions (1-36)
        'SHLP_1', 'SHLP_2', 'SHLP_3', 'SHLP_4', 'SHLP_5', 'SHLP_6', 'SHLP_7', 'SHLP_8', 'SHLP_9', 'SHLP_10',
        'SHLP_11', 'SHLP_12', 'SHLP_13', 'SHLP_14', 'SHLP_15', 'SHLP_16', 'SHLP_17', 'SHLP_18', 'SHLP_19', 'SHLP_20',
        'SHLP_21', 'SHLP_22', 'SHLP_23', 'SHLP_24', 'SHLP_25', 'SHLP_26', 'SHLP_27', 'SHLP_28', 'SHLP_29', 'SHLP_30',
        'SHLP_31', 'SHLP_32', 'SHLP_33', 'SHLP_34', 'SHLP_35', 'SHLP_36',
        // Additional fields
        'Remarks', 'Image Upload', 'Overall Score', 'CG_Score', 'OTA_Score', 'FAS_Score', 'FWS_Score', 'ENJ_Score', 'EX_Score', 'SHLP_Score'
      ];
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
      sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
      Logger.log('Header created with ' + header.length + ' columns');
    }
    
    // Build row data
    var rowData = [
      new Date(),
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
      // CG Questions
      params.CG_1 || '', params.CG_2 || '', params.CG_3 || '', params.CG_4 || '', params.CG_5 || '', params.CG_6 || '', 
      params.CG_7 || '', params.CG_8 || '', params.CG_9 || '', params.CG_10 || '', params.CG_11 || '', params.CG_12 || '', params.CG_13 || '',
      // OTA Questions
      params.OTA_101 || '', params.OTA_102 || '', params.OTA_103 || '', params.OTA_104 || '', params.OTA_105 || '', 
      params.OTA_106 || '', params.OTA_107 || '', params.OTA_108 || '', params.OTA_109 || '', params.OTA_110 || '', params.OTA_111 || '',
      // FAS Questions
      params.FAS_201 || '', params.FAS_202 || '', params.FAS_203 || '', params.FAS_204 || '', params.FAS_205 || '', params.FAS_206 || '',
      params.FAS_207 || '', params.FAS_208 || '', params.FAS_209 || '', params.FAS_210 || '', params.FAS_211 || '', params.FAS_212 || '', params.FAS_213 || '',
      // FWS Questions
      params.FWS_301 || '', params.FWS_302 || '', params.FWS_303 || '', params.FWS_304 || '', params.FWS_305 || '', params.FWS_306 || '',
      params.FWS_307 || '', params.FWS_308 || '', params.FWS_309 || '', params.FWS_310 || '', params.FWS_311 || '', params.FWS_312 || '', params.FWS_313 || '',
      // ENJ Questions
      params.ENJ_401 || '', params.ENJ_402 || '', params.ENJ_403 || '', params.ENJ_404 || '', params.ENJ_405 || '', params.ENJ_406 || '', params.ENJ_407 || '',
      // EX Questions
      params.EX_501 || '', params.EX_502 || '', params.EX_503 || '', params.EX_504 || '', params.EX_505 || '', params.EX_506 || '',
      // SHLP Questions
      params.SHLP_1 || '', params.SHLP_2 || '', params.SHLP_3 || '', params.SHLP_4 || '', params.SHLP_5 || '', params.SHLP_6 || '', params.SHLP_7 || '', params.SHLP_8 || '', params.SHLP_9 || '', params.SHLP_10 || '',
      params.SHLP_11 || '', params.SHLP_12 || '', params.SHLP_13 || '', params.SHLP_14 || '', params.SHLP_15 || '', params.SHLP_16 || '', params.SHLP_17 || '', params.SHLP_18 || '', params.SHLP_19 || '', params.SHLP_20 || '',
      params.SHLP_21 || '', params.SHLP_22 || '', params.SHLP_23 || '', params.SHLP_24 || '', params.SHLP_25 || '', params.SHLP_26 || '', params.SHLP_27 || '', params.SHLP_28 || '', params.SHLP_29 || '', params.SHLP_30 || '',
      params.SHLP_31 || '', params.SHLP_32 || '', params.SHLP_33 || '', params.SHLP_34 || '', params.SHLP_35 || '', params.SHLP_36 || '',
      // Additional fields
      params.remarks || '',
      params.imageUpload || '',
      params.overallScore || '',
      params.CG_Score || params.cgScore || '',
      params.OTA_Score || params.otaScore || '',
      params.FAS_Score || params.fasScore || '',
      params.FWS_Score || params.fwsScore || '',
      params.ENJ_Score || params.enjScore || '',
      params.EX_Score || params.exScore || '',
      params.SHLP_Score || params.shlpScore || ''
    ];
    
    Logger.log('Row data prepared: ' + rowData.length + ' columns');
    Logger.log('Sample data - Store: ' + params.storeName + ', Score: ' + params.overallScore);
    Logger.log('Sample questions - CG_1: ' + params.CG_1 + ', OTA_101: ' + params.OTA_101 + ', FAS_201: ' + params.FAS_201);
    
    // Append the row
    sheet.appendRow(rowData);
    
    var newRowCount = sheet.getLastRow();
    Logger.log('SUCCESS! Row appended. Total rows now: ' + newRowCount);
    
    lock.releaseLock();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'OK',
      success: true,
      message: 'Submitted successfully',
      timestamp: new Date().toISOString(),
      totalRows: newRowCount
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    
    lock.releaseLock();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      success: false,
      error: error.toString(),
      message: 'Submission failed: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    if (params.action === 'getData') {
      return getAMOperationsData();
    } else if (params.action === 'getStoreInfo' && params.storeId) {
      // Provide store info to frontend for auto-population
      var storeInfo = getStoreInfo(params.storeId);
      Logger.log('Providing store info for ' + params.storeId + ': ' + JSON.stringify(storeInfo));
      return ContentService
        .createTextOutput(JSON.stringify(storeInfo))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('ERROR in doGet: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAMOperationsData() {
  try {
    Logger.log('=== Getting AM Operations Data ===');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Try multiple possible sheet names
    var possibleSheetNames = ['AM Ops Checklist', 'AM Operations', 'AMOpsChecklist', 'AM_Operations'];
    var sheet = null;
    
    for (var i = 0; i < possibleSheetNames.length; i++) {
      sheet = ss.getSheetByName(possibleSheetNames[i]);
      if (sheet) {
        Logger.log('Found sheet: ' + possibleSheetNames[i]);
        break;
      }
    }
    
    if (!sheet) {
      Logger.log('No AM Operations sheet found. Available sheets: ' + ss.getSheets().map(function(s) { return s.getName(); }).join(', '));
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    Logger.log('Sheet found: ' + sheet.getName() + ', Total rows: ' + data.length);
    
    if (data.length <= 1) {
      Logger.log('No data rows found (only header or empty sheet)');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0];
    var rows = data.slice(1);
    Logger.log('Processing ' + rows.length + ' data rows');
    Logger.log('Header row: ' + JSON.stringify(headers));
    if (rows.length > 0) {
      Logger.log('First data row sample: ' + JSON.stringify(rows[0].slice(0, 15)));
    }
    
    var jsonData = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index] || '';
      });
      
      // Use the overall score as percentage (it's already calculated as percentage in frontend)
      var overallScore = parseFloat(obj['Overall Score'] || '0');
      // The overall score is already a percentage, so use it directly
      obj.percentageScore = Math.round(overallScore);
      
      // Format submission time
      if (obj['Submission Time']) {
        try {
          var date = new Date(obj['Submission Time']);
          obj.formattedTime = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch (e) {
          obj.formattedTime = obj['Submission Time'];
        }
      }
      
      return obj;
    });
    
    Logger.log('Returning ' + jsonData.length + ' processed records');
    Logger.log('Sample record: ' + JSON.stringify(jsonData[0] || {}));
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('ERROR in getAMOperationsData: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getStoreInfo(storeId) {
  // Return basic store info (this can be enhanced with actual store mapping if needed)
  return {
    storeName: storeId ? 'Store ' + storeId : '',
    region: 'Unknown'
  };
}
