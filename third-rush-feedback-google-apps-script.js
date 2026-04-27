/**
 * THIRD RUSH FEEDBACK - GOOGLE APPS SCRIPT
 *
 * Backend for the "Third Rush Feedback" forms inside Forms & Surveys.
 * Three sub-forms, three sheets, one Web App.
 *
 *   - "Third Rush - Full Audit"     (10-question structured audit)
 *   - "Third Rush - Miscellaneous"  (free-form observations / quick notes)
 *   - "Third Rush - Store Team"     (in-store team self-feedback)
 *
 * Setup:
 *   1) Open / create a Google Sheet for Third Rush.
 *   2) Apps Script (Extensions > Apps Script), paste this file.
 *   3) Run setupThirdRush() once.
 *   4) Deploy > New deployment > Web app:
 *        Execute as: Me
 *        Who has access: Anyone with the link
 *      Copy the /exec URL and put it in services/thirdRushFeedbackData.ts.
 */

var TR_LOCK_TIMEOUT_MS = 25000;

var TR_SHEET_FULL  = 'Third Rush - Full Audit';
var TR_SHEET_MISC  = 'Third Rush - Miscellaneous';
var TR_SHEET_STAFF = 'Third Rush - Store Team';

var TR_HEADERS_FULL = [
  'Server Timestamp', 'Submission ID', 'Auditor EMPID',
  'Store ID', 'Store Name', 'Auditor Name',
  'All Equipment Functional',          // Q3 Yes/No
  'POS Billing Smooth',                // Q4 Yes/No
  'Avg Order Time',                    // Q5
  'Workflow Efficiency',               // Q6
  'Staff Urgency',                     // Q7
  'Coffee Quality',                    // Q8
  'Biggest Bottleneck',                // Q9
  'Overall Readiness',                 // Q10
  'Readiness Score'                    // computed 0-100
];

var TR_HEADERS_MISC = [
  'Server Timestamp', 'Submission ID', 'Auditor EMPID',
  'Store ID', 'Store Name', 'Auditor Name',
  'Category',                          // e.g. Service / Hygiene / Equipment / Other
  'Observation', 'Action Suggested', 'Severity'
];

var TR_HEADERS_STAFF = [
  'Server Timestamp', 'Submission ID', 'Auditor EMPID',
  'Store ID', 'Store Name', 'Submitted By', 'Role',
  'Team Morale', 'Was Staffing Adequate', 'Biggest Challenge',
  'What Went Well', 'Suggestions'
];

// =============================================================================
// SETUP
// =============================================================================
function setupThirdRush() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [
    [TR_SHEET_FULL,  TR_HEADERS_FULL],
    [TR_SHEET_MISC,  TR_HEADERS_MISC],
    [TR_SHEET_STAFF, TR_HEADERS_STAFF]
  ].forEach(function (pair) {
    var name = pair[0], headers = pair[1];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
    }
  });
  Logger.log('Third Rush setup complete.');
}

// =============================================================================
// doPost — append a row, idempotent by Submission ID
// =============================================================================
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(TR_LOCK_TIMEOUT_MS)) {
      return _trJson({ status: 'ERROR', code: 'LOCK_TIMEOUT' });
    }
    var p = _trReadParams(e);
    var form = (p.form || '').toString();
    var submissionId = (p.submissionId || '').toString().trim() || Utilities.getUuid();

    if (form === 'full')  return _trUpsert(TR_SHEET_FULL,  TR_HEADERS_FULL,  _trBuildFull(p, submissionId), submissionId);
    if (form === 'misc')  return _trUpsert(TR_SHEET_MISC,  TR_HEADERS_MISC,  _trBuildMisc(p, submissionId), submissionId);
    if (form === 'staff') return _trUpsert(TR_SHEET_STAFF, TR_HEADERS_STAFF, _trBuildStaff(p, submissionId), submissionId);

    return _trJson({ status: 'ERROR', message: 'Unknown form: ' + form });
  } catch (err) {
    Logger.log('Third Rush doPost ERROR: ' + err);
    return _trJson({ status: 'ERROR', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// =============================================================================
// doGet — list rows for the dashboard
// =============================================================================
function doGet(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var action = p.action || 'all';

    if (action === 'all') {
      return _trJson({
        status: 'OK',
        full:  _trReadSheet(TR_SHEET_FULL),
        misc:  _trReadSheet(TR_SHEET_MISC),
        staff: _trReadSheet(TR_SHEET_STAFF)
      });
    }
    if (action === 'list') {
      var which = p.form === 'misc'  ? TR_SHEET_MISC
               : p.form === 'staff' ? TR_SHEET_STAFF
               : TR_SHEET_FULL;
      return _trJson({ status: 'OK', rows: _trReadSheet(which) });
    }
    return _trJson({ status: 'ERROR', message: 'Unknown action: ' + action });
  } catch (err) {
    return _trJson({ status: 'ERROR', message: String(err) });
  }
}

// =============================================================================
// Builders
// =============================================================================
function _trBuildFull(p, submissionId) {
  var now = new Date();
  var score = _trReadinessScore(p);
  var map = {
    'Server Timestamp': now,
    'Submission ID': submissionId,
    'Auditor EMPID': p.auditorEmpId || '',
    'Store ID': p.storeId || '',
    'Store Name': p.storeName || '',
    'Auditor Name': p.auditorName || '',
    'All Equipment Functional': p.equipmentFunctional || '',
    'POS Billing Smooth': p.posBillingSmooth || '',
    'Avg Order Time': p.avgOrderTime || '',
    'Workflow Efficiency': p.workflowEfficiency || '',
    'Staff Urgency': p.staffUrgency || '',
    'Coffee Quality': p.coffeeQuality || '',
    'Biggest Bottleneck': p.biggestBottleneck || '',
    'Overall Readiness': p.overallReadiness || '',
    'Readiness Score': score
  };
  return TR_HEADERS_FULL.map(function (h) { return map[h] === undefined ? '' : map[h]; });
}

function _trBuildMisc(p, submissionId) {
  var map = {
    'Server Timestamp': new Date(),
    'Submission ID': submissionId,
    'Auditor EMPID': p.auditorEmpId || '',
    'Store ID': p.storeId || '',
    'Store Name': p.storeName || '',
    'Auditor Name': p.auditorName || '',
    'Category': p.category || '',
    'Observation': p.observation || '',
    'Action Suggested': p.actionSuggested || '',
    'Severity': p.severity || ''
  };
  return TR_HEADERS_MISC.map(function (h) { return map[h] === undefined ? '' : map[h]; });
}

function _trBuildStaff(p, submissionId) {
  var map = {
    'Server Timestamp': new Date(),
    'Submission ID': submissionId,
    'Auditor EMPID': p.auditorEmpId || '',
    'Store ID': p.storeId || '',
    'Store Name': p.storeName || '',
    'Submitted By': p.submittedBy || '',
    'Role': p.submitterRole || '',
    'Team Morale': p.teamMorale || '',
    'Was Staffing Adequate': p.staffingAdequate || '',
    'Biggest Challenge': p.biggestChallenge || '',
    'What Went Well': p.whatWentWell || '',
    'Suggestions': p.suggestions || ''
  };
  return TR_HEADERS_STAFF.map(function (h) { return map[h] === undefined ? '' : map[h]; });
}

// 0-100 score from the qualitative answers (best→worst weighted equally)
function _trReadinessScore(p) {
  var s = 0, n = 0;

  function yn(v) { if (!v) return null; return /^y/i.test(String(v)) ? 100 : 0; }
  function tier3(v, best, mid) {
    if (!v) return null;
    var t = String(v).toLowerCase();
    if (t === best.toLowerCase()) return 100;
    if (t === mid.toLowerCase())  return 50;
    return 0;
  }
  function speed(v) {
    if (!v) return null;
    var t = String(v).toLowerCase();
    if (t.indexOf('under 3') >= 0) return 100;
    if (t.indexOf('3') === 0 || t.indexOf('3–5') >= 0 || t.indexOf('3-5') >= 0) return 75;
    if (t.indexOf('5') === 0 || t.indexOf('5–8') >= 0 || t.indexOf('5-8') >= 0) return 40;
    return 0;
  }

  [
    yn(p.equipmentFunctional),
    yn(p.posBillingSmooth),
    speed(p.avgOrderTime),
    tier3(p.workflowEfficiency, 'Smooth', 'Minor delays'),
    tier3(p.staffUrgency, 'High', 'Inconsistent'),
    tier3(p.coffeeQuality, 'On point', 'Slight deviation')
  ].forEach(function (v) { if (v !== null) { s += v; n++; } });

  return n > 0 ? Math.round(s / n) : '';
}

// =============================================================================
// Read / upsert helpers
// =============================================================================
function _trUpsert(sheetName, headers, row, submissionId) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) return _trJson({ status: 'ERROR', message: 'Sheet missing: ' + sheetName });
  // Idempotency by submission id
  if (sh.getLastRow() >= 2) {
    var idCol = headers.indexOf('Submission ID') + 1;
    var ids = sh.getRange(2, idCol, sh.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === submissionId) {
        sh.getRange(i + 2, 1, 1, headers.length).setValues([row]);
        return _trJson({ status: 'OK', submissionId: submissionId, duplicate: true });
      }
    }
  }
  sh.appendRow(row);
  return _trJson({ status: 'OK', submissionId: submissionId, duplicate: false });
}

function _trReadSheet(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h || '').trim(); });
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var rec = {};
    for (var j = 0; j < headers.length; j++) {
      var v = values[i][j];
      if (v instanceof Date) v = v.toISOString();
      rec[headers[j]] = v;
    }
    out.push(rec);
  }
  return out;
}

// =============================================================================
// Utilities
// =============================================================================
function _trReadParams(e) {
  var p = {};
  if (e && e.parameter) p = e.parameter;
  if (e && e.postData && e.postData.contents) {
    try {
      // Most common: JSON body
      var body = JSON.parse(e.postData.contents);
      Object.keys(body).forEach(function (k) { p[k] = body[k]; });
      return p;
    } catch (_) {
      // Fall back to URL-encoded
      var pairs = e.postData.contents.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split('=');
        if (kv.length === 2) p[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1].replace(/\+/g, ' '));
      }
    }
  }
  return p;
}

function _trJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
