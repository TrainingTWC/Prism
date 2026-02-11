/**
 * AM OPERATIONS CHECKLIST - GOOGLE APPS SCRIPT (FINAL ROBUST VERSION)
 * 
 * Instructions:
 * 1. Open the Google Sheet where you want to log data.
 * 2. Go to Extensions -> Apps Script.
 * 3. Replace all code in the script editor with this code.
 * 4. Click 'Save'.
 * 5. Click 'Deploy' -> 'New Deployment'.
 * 6. Select Type: 'Web App'.
 * 7. Description: 'AM Ops Final Logging'.
 * 8. Execute as: 'Me'.
 * 9. Who has access: 'Anyone'.
 * 10. Click 'Deploy' and copy the 'Web App URL'.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // Wait up to 30 seconds
  
  try {
    Logger.log('=== AM Operations Checklist Submission Started ===');
    
    // Get parameters
    var params = (e && e.parameter) ? e.parameter : {};
    
    // Get spreadsheet and sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = 'AM Ops Checklist';
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log('Creating new sheet: ' + sheetName);
      sheet = ss.insertSheet(sheetName);
    }
    
    // Define headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      var header = [
        'Server Timestamp', 'Submission Time', 'HR Name', 'HR ID', 'AM Name', 'AM ID', 
        'Trainer Name', 'Trainer ID', 'Store Name', 'Store ID', 'Region',
        'BSC Achievement', 'People On Shift', 'Manpower Fulfilment', 'Store Format', 'Menu Type', 'Price Group',
        // CG (1-13)
        'CG_1', 'CG_2', 'CG_3', 'CG_4', 'CG_5', 'CG_6', 'CG_7', 'CG_8', 'CG_9', 'CG_10', 'CG_11', 'CG_12', 'CG_13',
        // OTA (101-111)
        'OTA_101', 'OTA_102', 'OTA_103', 'OTA_104', 'OTA_105', 'OTA_106', 'OTA_107', 'OTA_108', 'OTA_109', 'OTA_110', 'OTA_111',
        // FAS (201-213)
        'FAS_201', 'FAS_202', 'FAS_203', 'FAS_204', 'FAS_205', 'FAS_206', 'FAS_207', 'FAS_208', 'FAS_209', 'FAS_210', 'FAS_211', 'FAS_212', 'FAS_213',
        // FWS (301-313)
        'FWS_301', 'FWS_302', 'FWS_303', 'FWS_304', 'FWS_305', 'FWS_306', 'FWS_307', 'FWS_308', 'FWS_309', 'FWS_310', 'FWS_311', 'FWS_312', 'FWS_313',
        // ENJ (401-407)
        'ENJ_401', 'ENJ_402', 'ENJ_403', 'ENJ_404', 'ENJ_405', 'ENJ_406', 'ENJ_407',
        // EX (501-506)
        'EX_501', 'EX_502', 'EX_503', 'EX_504', 'EX_505', 'EX_506',
        // Remarks and Scores
        'Total Score', 'Max Score', 'Percentage Score', 'Overall Score', 'Remarks', 
        'CG_Score', 'OTA_Score', 'FAS_Score', 'FWS_Score', 'ENJ_Score', 'EX_Score'
      ];
      sheet.appendRow(header);
    }
    
    // Build row data mapping
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
      params.bscAchievement || '',
      params.peopleOnShift || '',
      params.manpowerFulfilment || '',
      params.storeFormat || '',
      params.menuType || '',
      params.priceGroup || '',
      
      // CG (1-13)
      params.CG_1 || '', params.CG_2 || '', params.CG_3 || '', params.CG_4 || '', params.CG_5 || '', params.CG_6 || '', 
      params.CG_7 || '', params.CG_8 || '', params.CG_9 || '', params.CG_10 || '', params.CG_11 || '', params.CG_12 || '', params.CG_13 || '',
      
      // OTA (101-111) - Compatibility with both 101 and 1 style
      params.OTA_101 || params.OTA_1 || '', params.OTA_102 || params.OTA_2 || '', params.OTA_103 || params.OTA_3 || '', 
      params.OTA_104 || params.OTA_4 || '', params.OTA_105 || params.OTA_5 || '', params.OTA_106 || params.OTA_6 || '', 
      params.OTA_107 || params.OTA_7 || '', params.OTA_108 || params.OTA_8 || '', params.OTA_109 || params.OTA_9 || '', 
      params.OTA_110 || params.OTA_10 || '', params.OTA_111 || params.OTA_11 || '',
      
      // FAS (201-213)
      params.FAS_201 || params.FAS_1 || '', params.FAS_202 || params.FAS_2 || '', params.FAS_203 || params.FAS_3 || '', 
      params.FAS_204 || params.FAS_4 || '', params.FAS_205 || params.FAS_5 || '', params.FAS_206 || params.FAS_6 || '', 
      params.FAS_207 || params.FAS_7 || '', params.FAS_208 || params.FAS_8 || '', params.FAS_209 || params.FAS_9 || '', 
      params.FAS_210 || params.FAS_10 || '', params.FAS_211 || params.FAS_11 || '', params.FAS_212 || params.FAS_12 || '', params.FAS_213 || params.FAS_13 || '',
      
      // FWS (301-313)
      params.FWS_301 || params.FWS_1 || '', params.FWS_302 || params.FWS_2 || '', params.FWS_303 || params.FWS_3 || '', 
      params.FWS_304 || params.FWS_4 || '', params.FWS_305 || params.FWS_5 || '', params.FWS_306 || params.FWS_6 || '', 
      params.FWS_307 || params.FWS_7 || '', params.FWS_308 || params.FWS_8 || '', params.FWS_309 || params.FWS_9 || '', 
      params.FWS_310 || params.FWS_10 || '', params.FWS_311 || params.FWS_11 || '', params.FWS_312 || params.FWS_12 || '', params.FWS_313 || params.FWS_13 || '',
      
      // ENJ (401-407)
      params.ENJ_401 || params.ENJ_1 || '', params.ENJ_402 || params.ENJ_2 || '', params.ENJ_403 || params.ENJ_3 || '', 
      params.ENJ_404 || params.ENJ_4 || '', params.ENJ_405 || params.ENJ_5 || '', params.ENJ_406 || params.ENJ_6 || '', params.ENJ_407 || params.ENJ_7 || '',
      
      // EX (501-506)
      params.EX_501 || params.EX_1 || '', params.EX_502 || params.EX_2 || '', params.EX_503 || params.EX_3 || '', 
      params.EX_504 || params.EX_4 || '', params.EX_505 || params.EX_5 || '', params.EX_506 || params.EX_6 || '',
      
      // Final Fields
      params.totalScore || '0',
      params.maxScore || '0',
      params.percentageScore || params.percentage || '0',
      params.overallScore || params.percentageScore || '0',
      params.remarks || '',
      params.CG_Score || params.cgScore || params.CGScore || '0',
      params.OTA_Score || params.otaScore || params.OTAScore || '0',
      params.FAS_Score || params.fasScore || params.FASScore || '0',
      params.FWS_Score || params.fwsScore || params.FWSScore || '0',
      params.ENJ_Score || params.enjScore || params.ENJScore || '0',
      params.EX_Score || params.exScore || params.EXScore || '0'
    ];
    
    sheet.appendRow(rowData);
    lock.releaseLock();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'OK', 
      success: true, 
      message: 'Logged successfully',
      row: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR', 
      success: false, 
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  if (params.action === 'getData') {
    return getAMOperationsData();
  }
  return ContentService.createTextOutput('AM Operations Checklist API is active. Total records: ' + (SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AM Ops Checklist')?.getLastRow() - 1 || 0));
}

function getAMOperationsData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AM Ops Checklist');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    var headers = data[0];
    var jsonData = data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(header, idx) {
        obj[header] = row[idx];
      });
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify(jsonData)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
}
