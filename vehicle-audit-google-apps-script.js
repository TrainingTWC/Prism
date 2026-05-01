/**
 * Vehicle Audit Checklist — Google Apps Script
 *
 * Single endpoint for: Vehicle Audit submission, editing, drafts, data retrieval
 *
 * Sheets in this spreadsheet:
 *   - "Vehicle Audits"        — Submitted audit data
 *   - "Vehicle Audit Drafts"  — Draft management
 *
 * Deploy: Extensions > Apps Script > Deploy > Web App
 *   Execute as: Me | Access: Anyone
 *
 * Paste the deployed URL as VITE_VEHICLE_AUDIT_SCRIPT_URL in .env
 *
 * 25 questions: VA_1 … VA_25  (weight: 2 each, max score: 50)
 */

// ===========================
// QUESTION ID LIST
// ===========================

var VA_QUESTION_IDS = (function () {
  var ids = [];
  for (var i = 1; i <= 25; i++) ids.push('VA_' + i);
  return ids;
})();

// ===========================
// QUESTION TEXT MAP (for logging & analytics)
// ===========================

var VA_QUESTION_TEXT = {
  'VA_1':  'Vehicle has proper number plate displayed.',
  'VA_2':  'Driver name mentioned on the vehicle/trip sheet.',
  'VA_3':  'Driver holds a valid driving license.',
  'VA_4':  'Delivery assistant follows hygiene protocols.',
  'VA_5':  'No rough handling of crates during loading/unloading.',
  'VA_6':  'No crate damage observed during handling.',
  'VA_7':  'Safety seal intact on all consignments.',
  'VA_8':  'Digital temperature display available and functional.',
  'VA_9':  'Strip curtains clean and in good condition.',
  'VA_10': 'No odour detected inside vehicle.',
  'VA_11': 'Vehicle internal surfaces are clean.',
  'VA_12': 'No pest signs observed inside vehicle.',
  'VA_13': 'No openings that could expose food to contamination.',
  'VA_14': 'No rust or shredding inside the vehicle.',
  'VA_15': 'Refrigerated items maintained at ≤5°C.',
  'VA_16': 'Frozen items maintained at ≤ -18°C.',
  'VA_17': 'Food received in clean crates.',
  'VA_18': 'Veg and non-veg items properly segregated.',
  'VA_19': 'Food and non-food items separated.',
  'VA_20': 'No leakage or breakage of packages observed.',
  'VA_21': 'No hazardous items stored with food.',
  'VA_22': 'Trip sheet available and correctly filled.',
  'VA_23': 'Temperature logs available and up to date.',
  'VA_24': 'Vehicle cleaning records available.',
  'VA_25': 'Pest control records for vehicle available.'
};

// ===========================
// ENTRY POINTS
// ===========================

function doPost(e) {
  try {
    var params = parseParams(e);
    var action = params.action || 'createVehicleAudit';
    Logger.log('doPost action=' + action);

    switch (action) {
      case 'createVehicleAudit':
      case 'create':
        return createVehicleAudit(params);
      case 'update':
        return updateVehicleAudit(params);
      case 'saveVehicleAuditDraft':
      case 'saveDraft':
        return saveVehicleAuditDraft(params);
      case 'deleteVehicleAuditDraft':
      case 'deleteDraft':
        return deleteVehicleAuditDraft(params);
      default:
        return jsonResp({ success: false, message: 'Unknown POST action: ' + action });
    }
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResp({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'getData';
    Logger.log('doGet action=' + action);

    switch (action) {
      case 'getData':
        return getVehicleAuditData(params);
      case 'getVehicleAuditDrafts':
      case 'getDrafts':
        return getVehicleAuditDrafts(params);
      case 'loadVehicleAuditDraft':
      case 'loadDraft':
        return loadVehicleAuditDraft(params);
      default:
        return jsonResp({ success: true, message: 'Vehicle Audit API is active.' });
    }
  } catch (err) {
    Logger.log('doGet error: ' + err);
    return jsonResp({ success: false, error: err.toString() });
  }
}

// ===========================
// HELPERS
// ===========================

function parseParams(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  // Fall back to manual parse if e.parameter is empty (large payload)
  if (!params.action && !params.auditorName && !params.formType) {
    if (e && e.postData && e.postData.contents) {
      Logger.log('Fallback: parsing from postData.contents (length=' + e.postData.contents.length + ')');
      var pairs = e.postData.contents.split('&');
      params = {};
      for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split('=');
        if (kv.length >= 2) {
          params[decodeURIComponent(kv[0].replace(/\+/g, ' '))] =
            decodeURIComponent(kv.slice(1).join('=').replace(/\+/g, ' '));
        }
      }
    }
  }
  return params;
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
}

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// ===========================
// SHEET HEADERS
// ===========================

function vehicleAuditHeaders() {
  var h = [
    'Timestamp',         // A
    'Submission Time',   // B
    'Auditor Name',      // C
    'Auditor ID',        // D
    'Vehicle Number',    // E
    'Driver Name',       // F
    'City',              // G
    'Region',            // H
    'Total Score',       // I
    'Max Score',         // J
    'Score %',           // K
    'Auditor Signature', // L
    'Driver Signature'   // M
  ];
  // Response columns: VA_1 … VA_25
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) h.push(VA_QUESTION_IDS[i]);
  // Remark columns
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) h.push(VA_QUESTION_IDS[i] + '_remark');
  // Image count columns
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) h.push(VA_QUESTION_IDS[i] + '_imageCount');
  h.push('Remarks JSON');
  h.push('Images JSON');
  return h;
}

function vehicleAuditDraftHeaders() {
  return [
    'Draft ID',       // A
    'Auditor ID',     // B
    'Auditor Name',   // C
    'Subject Name',   // D  (Vehicle Number)
    'Subject ID',     // E  (Driver Name)
    'City',           // F
    'Timestamp',      // G
    'Completion %',   // H
    'Responses JSON', // I
    'Images JSON',    // J
    'Remarks JSON',   // K
    'Signatures JSON',// L
    'Meta JSON'       // M
  ];
}

// ===========================
// BUILD AUDIT ROW
// ===========================

function buildVehicleAuditRow(params, timestamp) {
  var row = [
    timestamp,
    params.submissionTime || '',
    params.auditorName    || '',
    params.auditorId      || '',
    params.subjectName    || '',  // Vehicle Number
    params.subjectId      || '',  // Driver Name
    params.city           || '',
    params.region         || '',
    Number(params.totalScore)      || 0,
    Number(params.maxScore)        || 0,
    Number(params.scorePercentage) || 0,
    params.auditorSignature || '',
    params.smSignature      || ''  // Driver/Auditee signature key from the form
  ];

  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    row.push(params[VA_QUESTION_IDS[i]] || '');
  }
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    row.push(params[VA_QUESTION_IDS[i] + '_remark'] || '');
  }
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    row.push(params[VA_QUESTION_IDS[i] + '_imageCount'] || '0');
  }
  row.push(params.questionRemarksJSON || '{}');
  row.push(params.questionImagesJSON  || '{}');
  return row;
}

// ===========================
// CREATE (NEW SUBMISSION)
// ===========================

function createVehicleAudit(params) {
  var sheet = getOrCreateSheet('Vehicle Audits', vehicleAuditHeaders());
  var ts    = nowStr();
  var row   = buildVehicleAuditRow(params, ts);
  sheet.appendRow(row);
  logResults(params, ts, 'Vehicle Audit', VA_QUESTION_IDS, VA_QUESTION_TEXT);
  Logger.log('Vehicle Audit saved: ' + (params.subjectName || 'Unknown'));
  return jsonResp({ success: true, status: 'success', message: 'Vehicle Audit submitted successfully', timestamp: ts });
}

// ===========================
// UPDATE (EDIT EXISTING)
// ===========================

function updateVehicleAudit(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vehicle Audits');
  if (!sheet) return jsonResp({ success: false, message: 'Vehicle Audits sheet not found' });

  var rowId = (params.rowId || '').trim();
  if (!rowId) return jsonResp({ success: false, message: 'rowId required for update' });

  var tz   = Session.getScriptTimeZone();
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    var cell = data[i][1]; // Column B: Submission Time
    if (cell instanceof Date) cell = Utilities.formatDate(cell, tz, 'dd/MM/yyyy HH:mm:ss');
    if (String(cell || '').trim() === rowId) { rowIndex = i + 1; break; }
  }
  if (rowIndex === -1) return jsonResp({ success: false, message: 'Row not found for rowId: ' + rowId });

  var originalTs = String(data[rowIndex - 1][0] || '');
  var row = buildVehicleAuditRow(params, originalTs + ' (Updated)');
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  Logger.log('Vehicle Audit updated at row ' + rowIndex);
  return jsonResp({ success: true, status: 'success', message: 'Vehicle Audit updated successfully' });
}

// ===========================
// GET ALL SUBMISSIONS
// ===========================

function getVehicleAuditData(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vehicle Audits');
  if (!sheet) return jsonResp([]);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonResp([]);

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var tz      = Session.getScriptTimeZone();
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rec = {};

    for (var col = 0; col < headers.length; col++) {
      var val = row[col];
      if (val instanceof Date) val = Utilities.formatDate(val, tz, 'dd/MM/yyyy HH:mm:ss');
      rec[headers[col]] = val !== undefined ? val : '';
    }

    // Normalise frontend keys
    rec.submissionTime  = rec['Submission Time']  || '';
    rec.auditorName     = rec['Auditor Name']     || '';
    rec.auditorId       = rec['Auditor ID']       || '';
    rec.subjectName     = rec['Vehicle Number']   || '';
    rec.subjectId       = rec['Driver Name']      || '';
    rec.city            = rec['City']             || '';
    rec.region          = rec['Region']           || '';
    rec.totalScore      = Number(rec['Total Score'])    || 0;
    rec.maxScore        = Number(rec['Max Score'])      || 0;
    rec.scorePercentage = Number(rec['Score %'])        || 0;

    var responses = {};
    for (var q = 0; q < VA_QUESTION_IDS.length; q++) {
      var qId = VA_QUESTION_IDS[q];
      if (rec[qId]) responses[qId] = String(rec[qId]);
    }
    rec.responses = responses;

    try { rec.questionRemarks = JSON.parse(rec['Remarks JSON'] || '{}'); } catch (e) { rec.questionRemarks = {}; }
    try { rec.questionImages  = JSON.parse(rec['Images JSON']  || '{}'); } catch (e) { rec.questionImages  = {}; }

    rec.sectionScores = computeVASectionScores(responses);
    records.push(rec);
  }

  var aid = (params.auditorId || '').trim().toUpperCase();
  if (aid) {
    records = records.filter(function (r) {
      return String(r.auditorId || '').trim().toUpperCase() === aid;
    });
  }

  Logger.log('Returning ' + records.length + ' Vehicle Audit records');
  return jsonResp(records);
}

// ===========================
// SECTION SCORES
// ===========================

function computeVASectionScores(responses) {
  var total = 0, maxPossible = 0;
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    var ans = responses[VA_QUESTION_IDS[i]] || '';
    if (ans === 'na') continue;
    maxPossible += 2;
    if (ans === 'compliant') total += 2;
    else if (ans === 'partially-compliant') total += 1;
  }
  return {
    'Vehicle Audit': {
      score: total,
      maxScore: maxPossible,
      percentage: maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0
    }
  };
}

// ===========================
// LOGGING HELPER
// ===========================

function logResults(params, ts, label, questionIds, textMap) {
  var nc = [], partial = [], ok = [];
  for (var i = 0; i < questionIds.length; i++) {
    var a = params[questionIds[i]] || '';
    if (a === 'not-compliant')            nc.push(questionIds[i] + ': ' + (textMap[questionIds[i]] || questionIds[i]));
    else if (a === 'partially-compliant') partial.push(questionIds[i] + ': ' + (textMap[questionIds[i]] || questionIds[i]));
    else if (a === 'compliant')           ok.push(questionIds[i]);
  }
  Logger.log('=== ' + label + ' Results ===');
  Logger.log('Subject: ' + (params.subjectName || 'N/A') + ' | Auditor: ' + (params.auditorName || 'N/A') + ' | ' + ts);
  Logger.log('Score: ' + (params.totalScore || 0) + '/' + (params.maxScore || 0) + ' (' + (params.scorePercentage || 0) + '%)');
  Logger.log('C=' + ok.length + '  P=' + partial.length + '  NC=' + nc.length);
  if (nc.length > 0) { Logger.log('-- Non-Compliant --'); for (var j = 0; j < nc.length; j++) Logger.log('  ✗ ' + nc[j]); }
  if (partial.length > 0) { Logger.log('-- Partial --'); for (var j = 0; j < partial.length; j++) Logger.log('  △ ' + partial[j]); }
  Logger.log('=== End ' + label + ' ===');
}

// ===========================
// DRAFT: SAVE
// ===========================

function saveVehicleAuditDraft(params) {
  var sheet   = getOrCreateSheet('Vehicle Audit Drafts', vehicleAuditDraftHeaders());
  var draftId = params.draftId || Utilities.getUuid();
  var data    = sheet.getDataRange().getValues();
  var existing = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) { existing = i + 1; break; }
  }

  var row = [
    draftId,
    params.auditorId   || '',
    params.auditorName || '',
    params.subjectName || '',  // Vehicle Number
    params.subjectId   || '',  // Driver Name
    params.city        || '',
    params.timestamp   || nowStr(),
    params.completionPercentage || '0',
    params.responsesJSON        || '{}',
    params.questionImagesJSON   || '{}',
    params.questionRemarksJSON  || '{}',
    params.signaturesJSON       || '{}',
    params.metaJSON             || '{}'
  ];

  if (existing > 0) {
    sheet.getRange(existing, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  Logger.log('Vehicle Audit draft saved: ' + draftId);
  return jsonResp({ success: true, draftId: draftId, message: 'Draft saved successfully' });
}

// ===========================
// DRAFT: LIST
// ===========================

function getVehicleAuditDrafts(params) {
  var auditorId = (params.auditorId || '').toUpperCase().trim();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vehicle Audit Drafts');
  if (!sheet) return jsonResp({ success: true, drafts: [] });

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return jsonResp({ success: true, drafts: [] });

  var drafts = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var rowAid = String(r[1] || '').toUpperCase().trim();
    if (!auditorId || rowAid === auditorId) {
      drafts.push({
        id: String(r[0] || ''),
        auditorId: String(r[1] || ''),
        auditorName: String(r[2] || ''),
        subjectName: String(r[3] || ''),  // Vehicle Number
        subjectId: String(r[4] || ''),    // Driver Name
        city: String(r[5] || ''),
        timestamp: String(r[6] || ''),
        completionPercentage: Number(r[7]) || 0
      });
    }
  }

  Logger.log('Returning ' + drafts.length + ' Vehicle Audit drafts for auditorId=' + auditorId);
  return jsonResp({ success: true, drafts: drafts });
}

// ===========================
// DRAFT: LOAD
// ===========================

function loadVehicleAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResp({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vehicle Audit Drafts');
  if (!sheet) return jsonResp({ success: false, message: 'No Vehicle Audit Drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') !== draftId) continue;

    var responses = {}, images = {}, remarks = {}, signatures = { auditor: '', sm: '' }, meta = {};
    try { responses  = JSON.parse(String(data[i][8]  || '{}')); } catch (e) {}
    try { images     = JSON.parse(String(data[i][9]  || '{}')); } catch (e) {}
    try { remarks    = JSON.parse(String(data[i][10] || '{}')); } catch (e) {}
    try { signatures = JSON.parse(String(data[i][11] || '{"auditor":"","sm":""}')); } catch (e) {}
    try { meta       = JSON.parse(String(data[i][12] || '{}')); } catch (e) {}

    Logger.log('Vehicle Audit draft loaded: ' + draftId);
    return jsonResp({
      success: true,
      data: {
        draft: {
          id: String(data[i][0] || ''),
          auditorId: String(data[i][1] || ''),
          auditorName: String(data[i][2] || ''),
          subjectName: String(data[i][3] || ''),  // Vehicle Number
          subjectId: String(data[i][4] || ''),    // Driver Name
          city: String(data[i][5] || ''),
          timestamp: String(data[i][6] || ''),
          completionPercentage: Number(data[i][7]) || 0,
          responses: responses,
          questionImages: images,
          questionRemarks: remarks,
          signatures: signatures,
          meta: meta
        }
      }
    });
  }

  return jsonResp({ success: false, message: 'Draft not found: ' + draftId });
}

// ===========================
// DRAFT: DELETE
// ===========================

function deleteVehicleAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResp({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vehicle Audit Drafts');
  if (!sheet) return jsonResp({ success: false, message: 'No Vehicle Audit Drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      sheet.deleteRow(i + 1);
      Logger.log('Vehicle Audit draft deleted: ' + draftId);
      return jsonResp({ success: true, message: 'Draft deleted successfully' });
    }
  }

  return jsonResp({ success: false, message: 'Draft not found: ' + draftId });
}
