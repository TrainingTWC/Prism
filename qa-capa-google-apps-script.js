/**
 * QA CAPA & AM Review - Google Apps Script
 * Handles both AM Review and QA CAPA checklist operations
 * 
 * Sheets:
 *   - "QA AM Review" — AM acknowledgement of QA non-compliance findings
 *   - "QA CAPA"      — Corrective & Preventive Action by SM/Shift Manager/ASM
 * 
 * Deploy as Web App → Execute as: Me, Access: Anyone
 * Set the deployed URL as VITE_QA_CAPA_SCRIPT_URL in .env
 */

function doPost(e) {
  try {
    var params = e.parameter;
    var action = params.action || '';
    
    Logger.log('QA CAPA doPost - Action: ' + action);
    
    switch (action) {
      case 'createAMReview':
        return createAMReview(params);
      case 'createCAPA':
        return createCAPA(params);
      case 'updateAMReview':
        return updateAMReview(params);
      case 'updateCAPA':
        return updateCAPA(params);
      default:
        return jsonResponse({ success: false, message: 'Unknown action: ' + action });
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.message);
    return jsonResponse({ success: false, error: error.message });
  }
}

function doGet(e) {
  try {
    var params = e.parameter;
    var action = params.action || '';
    
    Logger.log('QA CAPA doGet - Action: ' + action);
    
    switch (action) {
      case 'getAMReviews':
        return getAMReviews(params);
      case 'getCAPAs':
        return getCAPAs(params);
      default:
        return jsonResponse({ success: true, message: 'QA CAPA API is active.' });
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.message);
    return jsonResponse({ success: false, error: error.message });
  }
}

// ===========================
// CREATE OPERATIONS
// ===========================

function createAMReview(params) {
  var sheet = getOrCreateSheet('QA AM Review', [
    'Timestamp', 'QA Submission Time', 'QA Auditor Name', 'QA Auditor ID',
    'AM Name', 'AM ID', 'Store Name', 'Store ID', 'City', 'Region',
    'QA Score %', 'Total Findings', 'Status', 'Findings JSON'
  ]);
  
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  
  var row = [
    timestamp,
    params.qaSubmissionTime || '',
    params.qaAuditorName || '',
    params.qaAuditorId || '',
    params.amName || '',
    params.amId || '',
    params.storeName || '',
    params.storeId || '',
    params.city || '',
    params.region || '',
    params.qaScore || '',
    params.totalFindings || '0',
    'Open',
    params.findingsJSON || '[]'
  ];
  
  sheet.appendRow(row);
  Logger.log('Created AM Review for store: ' + params.storeName + ' (' + params.totalFindings + ' findings)');
  
  return jsonResponse({ success: true, message: 'AM Review created successfully' });
}

function createCAPA(params) {
  var sheet = getOrCreateSheet('QA CAPA', [
    'Timestamp', 'QA Submission Time', 'QA Auditor Name', 'QA Auditor ID',
    'Store Name', 'Store ID', 'City', 'Region',
    'AM Name', 'AM ID', 'Assigned To Names', 'Assigned To IDs',
    'QA Score %', 'Total Findings', 'Status',
    'CAPA Submitted By', 'CAPA Submitted By ID', 'CAPA Submission Time',
    'Findings JSON'
  ]);
  
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  
  // If assignee fields are empty, resolve from Employee Master
  var assignedToNames = params.assignedToNames || '';
  var assignedToIds = params.assignedToIds || '';
  if (!assignedToNames && params.storeId) {
    try {
      var empSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EMP. Master');
      if (empSheet) {
        var empData = empSheet.getDataRange().getValues();
        var empHeaders = empData[0];
        var storeCodeCol = findColByNames(empHeaders, ['store_id', 'store id', 'store_code', 'store code']);
        var desigCol = findColByNames(empHeaders, ['designation', 'desig']);
        var nameCol = findColByNames(empHeaders, ['empname', 'emp name', 'employee name', 'name']);
        var idCol = findColByNames(empHeaders, ['employee_code', 'emp code', 'employee code']);
        if (storeCodeCol >= 0 && desigCol >= 0) {
          var targetDesig = [
            'store manager', 'shift manager', 'assistant store manager',
            'sm', 'asm', 'shift mgr', 'store mgr', 'asst store manager',
            'shift incharge', 'shift in charge', 'senior shift', 'sstm',
            'café manager', 'cafe manager', 'outlet manager'
          ];
          var sid = (params.storeId || '').toUpperCase().trim();
          var names = [], ids = [];
          for (var i = 1; i < empData.length; i++) {
            var es = String(empData[i][storeCodeCol] || '').toUpperCase().trim();
            var ed = String(empData[i][desigCol] || '').toLowerCase().trim();
            if (es === sid) {
              var match = targetDesig.some(function(kw) { return ed === kw || ed.indexOf(kw) >= 0; });
              if (match) {
                if (nameCol >= 0) names.push(String(empData[i][nameCol] || ''));
                if (idCol >= 0) ids.push(String(empData[i][idCol] || ''));
              }
            }
          }
          assignedToNames = names.join(', ');
          assignedToIds = ids.join(', ');
          Logger.log('Resolved ' + names.length + ' managers for store ' + sid + ': ' + assignedToNames);
        }
      }
    } catch (empErr) {
      Logger.log('Could not resolve store managers: ' + empErr);
    }
  }
  
  var row = [
    timestamp,
    params.qaSubmissionTime || '',
    params.qaAuditorName || '',
    params.qaAuditorId || '',
    params.storeName || '',
    params.storeId || '',
    params.city || '',
    params.region || '',
    params.amName || '',
    params.amId || '',
    assignedToNames,
    assignedToIds,
    params.qaScore || '',
    params.totalFindings || '0',
    'Open',
    '', '', '',  // CAPA submitter fields — filled when CAPA is submitted
    params.findingsJSON || '[]'
  ];
  
  sheet.appendRow(row);
  Logger.log('Created QA CAPA for store: ' + params.storeName + ' assigned to: ' + assignedToNames);
  
  return jsonResponse({ success: true, message: 'QA CAPA created successfully' });
}

// Helper: find column index by trying multiple header names (case-insensitive)
function findColByNames(headers, possibleNames) {
  for (var n = 0; n < possibleNames.length; n++) {
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i]).toLowerCase().trim() === possibleNames[n]) return i;
    }
  }
  return -1;
}

// ===========================
// READ OPERATIONS
// ===========================

function getAMReviews(params) {
  var amId = (params.amId || '').toUpperCase().trim();
  var auditorId = (params.auditorId || '').toUpperCase().trim();
  var fetchAll = (params.all || '').toLowerCase() === 'true';
  
  if (!amId && !auditorId && !fetchAll) {
    return jsonResponse({ success: false, message: 'amId, auditorId, or all=true is required' });
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA AM Review');
  if (!sheet) {
    return jsonResponse({ success: true, records: [] });
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({ success: true, records: [] });
  }
  
  var headers = data[0];
  var records = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowAmId = String(row[5] || '').toUpperCase().trim();       // AM ID column F (index 5)
    var rowAuditorId = String(row[3] || '').toUpperCase().trim();  // QA Auditor ID column D (index 3)
    
    var match = fetchAll;
    if (amId && rowAmId === amId) match = true;
    if (auditorId && rowAuditorId === auditorId) match = true;
    
    if (match) {
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        var key = toCamelCase(headers[j]);
        record[key] = row[j] !== undefined ? String(row[j]) : '';
      }
      records.push(record);
    }
  }
  
  Logger.log('Found ' + records.length + ' AM Reviews');
  return jsonResponse({ success: true, records: records });
}

function getCAPAs(params) {
  var storeId = (params.storeId || '').toUpperCase().trim();
  var assigneeId = (params.assigneeId || '').toUpperCase().trim();
  var auditorId = (params.auditorId || '').toUpperCase().trim();
  var amId = (params.amId || '').toUpperCase().trim();
  var fetchAll = (params.all || '').toLowerCase() === 'true';
  
  if (!storeId && !assigneeId && !auditorId && !amId && !fetchAll) {
    return jsonResponse({ success: false, message: 'storeId, assigneeId, auditorId, amId, or all=true is required' });
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA CAPA');
  if (!sheet) {
    return jsonResponse({ success: true, records: [] });
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({ success: true, records: [] });
  }
  
  var headers = data[0];
  var records = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowStoreId = String(row[5] || '').toUpperCase().trim();      // Store ID column F (index 5)
    var rowAssigneeIds = String(row[11] || '').toUpperCase().trim(); // Assigned To IDs column L (index 11)
    var rowAuditorId = String(row[3] || '').toUpperCase().trim();    // QA Auditor ID column D (index 3)
    var rowAmId = String(row[9] || '').toUpperCase().trim();         // AM ID column J (index 9)
    
    var match = fetchAll;
    if (storeId && rowStoreId === storeId) match = true;
    if (assigneeId && rowAssigneeIds.indexOf(assigneeId) >= 0) match = true;
    if (auditorId && rowAuditorId === auditorId) match = true;
    if (amId && rowAmId === amId) match = true;
    
    if (match) {
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        var key = toCamelCase(headers[j]);
        record[key] = row[j] !== undefined ? String(row[j]) : '';
      }
      records.push(record);
    }
  }
  
  Logger.log('Found ' + records.length + ' CAPAs');
  return jsonResponse({ success: true, records: records });
}

// ===========================
// UPDATE OPERATIONS
// ===========================

function updateAMReview(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA AM Review');
  if (!sheet) {
    return jsonResponse({ success: false, message: 'QA AM Review sheet not found' });
  }
  
  var qaSubmissionTime = params.qaSubmissionTime || '';
  var storeId = (params.storeId || '').toUpperCase().trim();
  
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    var rowQATime = String(data[i][1] || '').trim();         // QA Submission Time (index 1)
    var rowStoreId = String(data[i][7] || '').toUpperCase().trim(); // Store ID (index 7)
    
    if (rowQATime === qaSubmissionTime && rowStoreId === storeId) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return jsonResponse({ success: false, message: 'AM Review record not found' });
  }
  
  // Update status (column M = 13) and findings JSON (column N = 14)
  if (params.status) sheet.getRange(rowIndex, 13).setValue(params.status);
  if (params.findingsJSON) sheet.getRange(rowIndex, 14).setValue(params.findingsJSON);
  
  Logger.log('Updated AM Review for store: ' + storeId + ' status: ' + params.status);
  return jsonResponse({ success: true, message: 'AM Review updated' });
}

function updateCAPA(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA CAPA');
  if (!sheet) {
    return jsonResponse({ success: false, message: 'QA CAPA sheet not found' });
  }
  
  var qaSubmissionTime = params.qaSubmissionTime || '';
  var storeId = (params.storeId || '').toUpperCase().trim();
  
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    var rowQATime = String(data[i][1] || '').trim();         // QA Submission Time (index 1)
    var rowStoreId = String(data[i][5] || '').toUpperCase().trim(); // Store ID (index 5)
    
    if (rowQATime === qaSubmissionTime && rowStoreId === storeId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return jsonResponse({ success: false, message: 'CAPA record not found' });
  }
  
  // Update status (column O = 15), CAPA submitter (P=16, Q=17, R=18), findings (S=19)
  if (params.status) sheet.getRange(rowIndex, 15).setValue(params.status);
  if (params.capaSubmittedBy) sheet.getRange(rowIndex, 16).setValue(params.capaSubmittedBy);
  if (params.capaSubmittedById) sheet.getRange(rowIndex, 17).setValue(params.capaSubmittedById);
  if (params.capaSubmissionTime) sheet.getRange(rowIndex, 18).setValue(params.capaSubmissionTime);
  if (params.findingsJSON) sheet.getRange(rowIndex, 19).setValue(params.findingsJSON);
  
  Logger.log('Updated CAPA for store: ' + storeId + ' status: ' + params.status);
  return jsonResponse({ success: true, message: 'CAPA updated' });
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    Logger.log('Created new sheet: ' + name);
  }
  
  return sheet;
}

function toCamelCase(header) {
  // Convert header like "QA Submission Time" → "qaSubmissionTime"
  return String(header || '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map(function(word, index) {
      word = word.toLowerCase();
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
