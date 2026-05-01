/**
 * CF Audit Checklist (Food Safety) — Google Apps Script
 *
 * Single endpoint for: CF Audit submission, editing, drafts, data retrieval
 *
 * Sheets in this spreadsheet:
 *   - "CF Audits"        — Submitted audit data
 *   - "CF Audit Drafts"  — Draft management
 *
 * Deploy: Extensions > Apps Script > Deploy > Web App
 *   Execute as: Me | Access: Anyone
 *
 * Paste the deployed URL as VITE_CF_AUDIT_SCRIPT_URL in .env
 *
 * 48 questions: CF_1 … CF_48  (weight: 2 each, max score: 96)
 */

// ===========================
// QUESTION ID LIST
// ===========================

var CF_QUESTION_IDS = (function () {
  var ids = [];
  for (var i = 1; i <= 48; i++) ids.push('CF_' + i);
  return ids;
})();

// ===========================
// QUESTION TEXT MAP (for logging & analytics)
// ===========================

var CF_QUESTION_TEXT = {
  'CF_1':  'Food establishment has valid FSSAI license displayed.',
  'CF_2':  'No expired food products; proper date tagging in place.',
  'CF_3':  'No pest activity observed on premises.',
  'CF_4':  'Premises design allows cleaning and prevents contamination.',
  'CF_5':  'Internal structure made of non-toxic material.',
  'CF_6':  'Walls and ceilings free from damage and peeling.',
  'CF_7':  'Floors are non-absorbent and non-slippery.',
  'CF_8':  'Windows are insect-proofed.',
  'CF_9':  'Doors prevent pest entry.',
  'CF_10': 'Potable water used (IS 10500 standards).',
  'CF_11': 'Equipment is food-grade and cleanable.',
  'CF_12': 'Adequate refrigeration facilities available.',
  'CF_13': 'Proper lighting with protection in food areas.',
  'CF_14': 'Adequate ventilation maintained.',
  'CF_15': 'Storage facility available and organised.',
  'CF_16': 'Hygiene facilities available for staff.',
  'CF_17': 'Food testing records available and up to date.',
  'CF_18': 'Approved vendors and procurement records maintained.',
  'CF_19': 'Raw material inspection conducted at receiving.',
  'CF_20': 'Proper storage practices followed (FIFO/FEFO, temperature control).',
  'CF_21': 'Raw materials cleaned before preparation.',
  'CF_22': 'Segregation of veg/non-veg and raw/cooked maintained.',
  'CF_23': 'Equipment sanitized before and after use.',
  'CF_24': 'Proper thawing practices followed.',
  'CF_25': 'Cooking and reheating records maintained.',
  'CF_26': 'Hygienic portioning practices in place.',
  'CF_27': 'Hot holding temperature maintained (≥63°C).',
  'CF_28': 'Proper reheating practices followed.',
  'CF_29': 'Oil quality monitored and recorded.',
  'CF_30': 'Packaging material is food-grade.',
  'CF_31': 'Cleaning schedule followed and records maintained.',
  'CF_32': 'Preventive maintenance carried out as scheduled.',
  'CF_33': 'Equipment calibration done and records available.',
  'CF_34': 'Pest control program available and implemented.',
  'CF_35': 'No signs of pest infestation found.',
  'CF_36': 'Drain systems functional and free from blockage.',
  'CF_37': 'Waste removed regularly and disposed of properly.',
  'CF_38': 'Housekeeping chemicals stored properly and away from food.',
  'CF_39': 'Medical records of all food-handling staff maintained.',
  'CF_40': 'No sick staff handling food.',
  'CF_41': 'Personal hygiene standards maintained by staff.',
  'CF_42': 'Proper protective gear used by staff.',
  'CF_43': 'Internal audits conducted as per schedule.',
  'CF_44': 'Complaint redressal system exists and is functional.',
  'CF_45': 'Staff trained in food safety practices.',
  'CF_46': 'Documentation maintained and available for review.',
  'CF_47': 'First aid kit available and stocked.',
  'CF_48': 'Fire safety equipment available and not expired.'
};

// ===========================
// ENTRY POINTS
// ===========================

function doPost(e) {
  try {
    var params = parseParams(e);
    var action = params.action || 'createCFAudit';
    Logger.log('doPost action=' + action);

    switch (action) {
      case 'createCFAudit':
      case 'create':
        return createCFAudit(params);
      case 'update':
        return updateCFAudit(params);
      case 'saveCFAuditDraft':
      case 'saveDraft':
        return saveCFAuditDraft(params);
      case 'deleteCFAuditDraft':
      case 'deleteDraft':
        return deleteCFAuditDraft(params);
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
        return getCFAuditData(params);
      case 'getCFAuditDrafts':
      case 'getDrafts':
        return getCFAuditDrafts(params);
      case 'loadCFAuditDraft':
      case 'loadDraft':
        return loadCFAuditDraft(params);
      default:
        return jsonResp({ success: true, message: 'CF Audit API is active.' });
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

function cfAuditHeaders() {
  var h = [
    'Timestamp',          // A
    'Submission Time',    // B
    'Auditor Name',       // C
    'Auditor ID',         // D
    'Outlet / CF Name',   // E
    'CF Location',        // F
    'City',               // G
    'Region',             // H
    'Total Score',        // I
    'Max Score',          // J
    'Score %',            // K
    'Auditor Signature',  // L
    'Auditee Signature'   // M
  ];
  // Response columns: CF_1 … CF_48
  for (var i = 0; i < CF_QUESTION_IDS.length; i++) h.push(CF_QUESTION_IDS[i]);
  // Remark columns
  for (var i = 0; i < CF_QUESTION_IDS.length; i++) h.push(CF_QUESTION_IDS[i] + '_remark');
  // Image count columns
  for (var i = 0; i < CF_QUESTION_IDS.length; i++) h.push(CF_QUESTION_IDS[i] + '_imageCount');
  h.push('Remarks JSON');
  h.push('Images JSON');
  return h;
}

function cfAuditDraftHeaders() {
  return [
    'Draft ID',       // A
    'Auditor ID',     // B
    'Auditor Name',   // C
    'Subject Name',   // D  (Outlet / CF Name)
    'Subject ID',     // E  (CF Location)
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

function buildCFAuditRow(params, timestamp) {
  var row = [
    timestamp,
    params.submissionTime || '',
    params.auditorName   || '',
    params.auditorId     || '',
    params.subjectName   || '',   // Outlet / CF Name
    params.subjectId     || '',   // CF Location / Address
    params.city          || '',
    params.region        || '',
    Number(params.totalScore)       || 0,
    Number(params.maxScore)         || 0,
    Number(params.scorePercentage)  || 0,
    params.auditorSignature || '',
    params.smSignature      || ''   // Auditee signature key used by the form
  ];

  for (var i = 0; i < CF_QUESTION_IDS.length; i++) {
    row.push(params[CF_QUESTION_IDS[i]] || '');
  }
  for (var i = 0; i < CF_QUESTION_IDS.length; i++) {
    row.push(params[CF_QUESTION_IDS[i] + '_remark'] || '');
  }
  for (var i = 0; i < CF_QUESTION_IDS.length; i++) {
    row.push(params[CF_QUESTION_IDS[i] + '_imageCount'] || '0');
  }
  row.push(params.questionRemarksJSON || '{}');
  row.push(params.questionImagesJSON  || '{}');
  return row;
}

// ===========================
// CREATE (NEW SUBMISSION)
// ===========================

function createCFAudit(params) {
  var sheet = getOrCreateSheet('CF Audits', cfAuditHeaders());
  var ts = nowStr();
  var row = buildCFAuditRow(params, ts);
  sheet.appendRow(row);
  logResults(params, ts, 'CF Audit', CF_QUESTION_IDS, CF_QUESTION_TEXT);
  Logger.log('CF Audit saved: ' + (params.subjectName || 'Unknown'));
  return jsonResp({ success: true, status: 'success', message: 'CF Audit submitted successfully', timestamp: ts });
}

// ===========================
// UPDATE (EDIT EXISTING)
// ===========================

function updateCFAudit(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CF Audits');
  if (!sheet) return jsonResp({ success: false, message: 'CF Audits sheet not found' });

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

  // Preserve original server timestamp; mark as updated
  var originalTs = String(data[rowIndex - 1][0] || '');
  var row = buildCFAuditRow(params, originalTs + ' (Updated)');
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  Logger.log('CF Audit updated at row ' + rowIndex);
  return jsonResp({ success: true, status: 'success', message: 'CF Audit updated successfully' });
}

// ===========================
// GET ALL SUBMISSIONS
// ===========================

function getCFAuditData(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CF Audits');
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
    rec.submissionTime    = rec['Submission Time']   || '';
    rec.auditorName       = rec['Auditor Name']      || '';
    rec.auditorId         = rec['Auditor ID']        || '';
    rec.subjectName       = rec['Outlet / CF Name']  || '';
    rec.subjectId         = rec['CF Location']       || '';
    rec.city              = rec['City']              || '';
    rec.region            = rec['Region']            || '';
    rec.totalScore        = Number(rec['Total Score'])    || 0;
    rec.maxScore          = Number(rec['Max Score'])      || 0;
    rec.scorePercentage   = Number(rec['Score %'])        || 0;

    // Individual question responses
    var responses = {};
    for (var q = 0; q < CF_QUESTION_IDS.length; q++) {
      var qId = CF_QUESTION_IDS[q];
      if (rec[qId]) responses[qId] = String(rec[qId]);
    }
    rec.responses = responses;

    // JSON blobs
    try { rec.questionRemarks = JSON.parse(rec['Remarks JSON'] || '{}'); } catch (e) { rec.questionRemarks = {}; }
    try { rec.questionImages  = JSON.parse(rec['Images JSON']  || '{}'); } catch (e) { rec.questionImages  = {}; }

    rec.sectionScores = computeCFSectionScores(responses);
    records.push(rec);
  }

  // Optional filter by auditorId
  var aid = (params.auditorId || '').trim().toUpperCase();
  if (aid) {
    records = records.filter(function (r) {
      return String(r.auditorId || '').trim().toUpperCase() === aid;
    });
  }

  Logger.log('Returning ' + records.length + ' CF Audit records');
  return jsonResp(records);
}

// ===========================
// SECTION SCORES
// ===========================

function computeCFSectionScores(responses) {
  var total = 0, maxPossible = 0;
  for (var i = 0; i < CF_QUESTION_IDS.length; i++) {
    var ans = responses[CF_QUESTION_IDS[i]] || '';
    if (ans === 'na') continue;
    maxPossible += 2;
    if (ans === 'compliant') total += 2;
    else if (ans === 'partially-compliant') total += 1;
  }
  return {
    'CF Audit': {
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
    if (a === 'not-compliant')        nc.push(questionIds[i] + ': ' + (textMap[questionIds[i]] || questionIds[i]));
    else if (a === 'partially-compliant') partial.push(questionIds[i] + ': ' + (textMap[questionIds[i]] || questionIds[i]));
    else if (a === 'compliant')       ok.push(questionIds[i]);
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

function saveCFAuditDraft(params) {
  var sheet   = getOrCreateSheet('CF Audit Drafts', cfAuditDraftHeaders());
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
    params.subjectName || '',  // Outlet / CF Name
    params.subjectId   || '',  // CF Location
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

  Logger.log('CF Audit draft saved: ' + draftId);
  return jsonResp({ success: true, draftId: draftId, message: 'Draft saved successfully' });
}

// ===========================
// DRAFT: LIST
// ===========================

function getCFAuditDrafts(params) {
  var auditorId = (params.auditorId || '').toUpperCase().trim();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CF Audit Drafts');
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
        subjectName: String(r[3] || ''),
        subjectId: String(r[4] || ''),
        city: String(r[5] || ''),
        timestamp: String(r[6] || ''),
        completionPercentage: Number(r[7]) || 0
      });
    }
  }

  Logger.log('Returning ' + drafts.length + ' CF Audit drafts for auditorId=' + auditorId);
  return jsonResp({ success: true, drafts: drafts });
}

// ===========================
// DRAFT: LOAD
// ===========================

function loadCFAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResp({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CF Audit Drafts');
  if (!sheet) return jsonResp({ success: false, message: 'No CF Audit Drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') !== draftId) continue;

    var responses = {}, images = {}, remarks = {}, signatures = { auditor: '', sm: '' }, meta = {};
    try { responses  = JSON.parse(String(data[i][8]  || '{}')); } catch (e) {}
    try { images     = JSON.parse(String(data[i][9]  || '{}')); } catch (e) {}
    try { remarks    = JSON.parse(String(data[i][10] || '{}')); } catch (e) {}
    try { signatures = JSON.parse(String(data[i][11] || '{"auditor":"","sm":""}')); } catch (e) {}
    try { meta       = JSON.parse(String(data[i][12] || '{}')); } catch (e) {}

    Logger.log('CF Audit draft loaded: ' + draftId);
    return jsonResp({
      success: true,
      data: {
        draft: {
          id: String(data[i][0] || ''),
          auditorId: String(data[i][1] || ''),
          auditorName: String(data[i][2] || ''),
          subjectName: String(data[i][3] || ''),
          subjectId: String(data[i][4] || ''),
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

function deleteCFAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResp({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CF Audit Drafts');
  if (!sheet) return jsonResp({ success: false, message: 'No CF Audit Drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      sheet.deleteRow(i + 1);
      Logger.log('CF Audit draft deleted: ' + draftId);
      return jsonResp({ success: true, message: 'Draft deleted successfully' });
    }
  }

  return jsonResp({ success: false, message: 'Draft not found: ' + draftId });
}
