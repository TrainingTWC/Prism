/**
 * HR Audit (Store HR Health) Google Apps Script
 * Single endpoint for: HR Audit submission, editing, drafts, data retrieval
 *
 * Sheets in this spreadsheet:
 *   - "HR Audits"       — Submitted HR audit data (metadata + 28 question responses + scores + predictions)
 *   - "HR Audit Drafts" — Draft management (save, load, delete)
 *
 * Deploy: Extensions > Apps Script > Deploy > Web App
 *   Execute as: Me | Access: Anyone
 *
 * Set the deployed URL as VITE_HR_AUDIT_SCRIPT_URL in .env
 *
 * 5 Sections, 28 Questions:
 *   AttritionRisk — AR_1..AR_6  (6 questions)
 *   Capability    — CA_1..CA_5  (5 questions)
 *   Culture       — CU_1..CU_7  (7 questions)
 *   Engagement    — EN_1..EN_5  (5 questions)
 *   Pressure      — PR_1..PR_5  (5 questions)
 */

// ===========================
// QUESTION ID DEFINITIONS
// ===========================

var QUESTION_IDS = [
  // Attrition Risk (6)
  'AttritionRisk_AR_1', 'AttritionRisk_AR_2', 'AttritionRisk_AR_3',
  'AttritionRisk_AR_4', 'AttritionRisk_AR_5', 'AttritionRisk_AR_6',
  // Capability (5)
  'Capability_CA_1', 'Capability_CA_2', 'Capability_CA_3',
  'Capability_CA_4', 'Capability_CA_5',
  // Culture (7)
  'Culture_CU_1', 'Culture_CU_2', 'Culture_CU_3', 'Culture_CU_4',
  'Culture_CU_5', 'Culture_CU_6', 'Culture_CU_7',
  // Engagement (5)
  'Engagement_EN_1', 'Engagement_EN_2', 'Engagement_EN_3',
  'Engagement_EN_4', 'Engagement_EN_5',
  // Pressure (5)
  'Pressure_PR_1', 'Pressure_PR_2', 'Pressure_PR_3',
  'Pressure_PR_4', 'Pressure_PR_5'
];

// ===========================
// ENTRY POINTS
// ===========================

function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'createHRAudit';

    Logger.log('doPost action=' + action);

    switch (action) {
      case 'createHRAudit':
        return createHRAudit(params);
      case 'update':
        return updateHRAudit(params);
      case 'saveHRAuditDraft':
        return saveHRAuditDraft(params);
      case 'deleteHRAuditDraft':
        return deleteHRAuditDraft(params);
      default:
        return jsonResponse({ success: false, message: 'Unknown POST action: ' + action });
    }
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'getData';

    Logger.log('doGet action=' + action);

    switch (action) {
      case 'getData':
        return getHRAuditData(params);
      case 'getHRAuditDrafts':
        return getHRAuditDrafts(params);
      case 'loadHRAuditDraft':
        return loadHRAuditDraft(params);
      default:
        return jsonResponse({ success: true, message: 'HR Audit API is active.' });
    }
  } catch (err) {
    Logger.log('doGet error: ' + err);
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ===========================
// HELPERS
// ===========================

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function now() {
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
// SCORING ENGINE (mirrors hrAuditQuestions.ts)
// ===========================

function clamp(v) { return Math.max(0, Math.min(100, v)); }
function yn(v) { return (String(v || '').toLowerCase() === 'yes') ? 1 : 0; }
function num(v) { var n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; }

function computeScores(params) {
  var teamSize = Math.max(1, num(params['AttritionRisk_AR_6']));

  // Attrition Risk (higher = worse)
  var resignation = yn(params['AttritionRisk_AR_1']);
  var notice = yn(params['AttritionRisk_AR_2']);
  var absentRatio = num(params['AttritionRisk_AR_3']) / teamSize;
  var lowTenureRatio = num(params['AttritionRisk_AR_4']) / teamSize;
  var highPerfRisk = yn(params['AttritionRisk_AR_5']);
  var attrition = clamp(resignation*25 + notice*20 + Math.min(absentRatio,1)*15 + Math.min(lowTenureRatio,1)*15 + highPerfRisk*25);

  // Capability (higher = better)
  var certPct = (num(params['Capability_CA_1']) / teamSize) * 100;
  var supportPct = (num(params['Capability_CA_2']) / teamSize) * 100;
  var failPct = (num(params['Capability_CA_3']) / teamSize) * 100;
  var serviceErr = yn(params['Capability_CA_4']);
  var newJoinOk = yn(params['Capability_CA_5']);
  var capability = clamp(Math.min(certPct,100)*0.50 - Math.min(supportPct,100)*0.25 - Math.min(failPct,100)*0.25 - serviceErr*10 + newJoinOk*10);

  // Culture (higher = better)
  var teamRating = Math.min(5, num(params['Culture_CU_6']));
  var mgrRating = Math.min(5, num(params['Culture_CU_7']));
  var conflict = yn(params['Culture_CU_1']);
  var violation = yn(params['Culture_CU_2']);
  var favoritism = yn(params['Culture_CU_3']);
  var speakUp = yn(params['Culture_CU_4']);
  var teamSupport = yn(params['Culture_CU_5']);
  var culture = clamp(teamRating*10 + mgrRating*10 + speakUp*10 + teamSupport*10 - conflict*20 - violation*20 - favoritism*20);

  // Engagement (higher = better)
  var interaction = yn(params['Engagement_EN_1']);
  var partPct = Math.min(100, num(params['Engagement_EN_2']));
  var disengaged = yn(params['Engagement_EN_3']);
  var ownership = yn(params['Engagement_EN_4']);
  var energy = Math.min(5, num(params['Engagement_EN_5']));
  var engagement = clamp((energy/5)*20 + ownership*20 + interaction*20 + partPct*0.40 - disengaged*30);

  // Pressure (higher = worse)
  var peak = yn(params['Pressure_PR_1']);
  var mgrStress = yn(params['Pressure_PR_2']);
  var breakSkip = yn(params['Pressure_PR_3']);
  var sopShort = yn(params['Pressure_PR_4']);
  var frustration = yn(params['Pressure_PR_5']);
  var pressure = clamp(peak*20 + mgrStress*15 + breakSkip*25 + sopShort*20 + frustration*20);

  // Master Store Health
  var storeHealth = Math.round(
    capability*0.25 + culture*0.20 + engagement*0.20 + (100-pressure)*0.20 + (100-attrition)*0.15
  );

  // Risk alerts
  var alerts = [];
  if (attrition > 60 && engagement < 50 && pressure > 50) alerts.push('High Attrition Risk');
  if (culture < 50 && mgrRating < 3 && (conflict === 1 || favoritism === 1)) alerts.push('Manager Risk');
  if (capability < 60 && pressure > 50) alerts.push('Performance Drop Risk');
  if (breakSkip === 1 && energy < 3 && disengaged === 1) alerts.push('Burnout Risk');

  return {
    attrition: Math.round(attrition),
    capability: Math.round(capability),
    culture: Math.round(culture),
    engagement: Math.round(engagement),
    pressure: Math.round(pressure),
    storeHealth: storeHealth,
    riskAlerts: alerts.join(', ')
  };
}

// ===========================
// HEADERS FOR HR AUDITS SHEET
// ===========================

function hrAuditHeaders() {
  var headers = [
    'Timestamp',           // A
    'Submission Time',     // B
    'Auditor Name',        // C
    'Auditor ID',          // D
    'Store Name',          // E
    'Store ID',            // F
    'City',                // G
    'Region',              // H
    'Attrition Score',     // I
    'Capability Score',    // J
    'Culture Score',       // K
    'Engagement Score',    // L
    'Pressure Score',      // M
    'Store Health',        // N
    'Risk Alerts',         // O
    'Auditor Signature',   // P
    'SM Signature'         // Q
  ];

  // Question response columns (28)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    headers.push(QUESTION_IDS[i]);
  }

  // Remark columns
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    headers.push(QUESTION_IDS[i] + '_remark');
  }

  // JSON blobs
  headers.push('Remarks JSON');
  headers.push('Responses JSON');

  return headers;
}

// ===========================
// CREATE HR AUDIT
// ===========================

function createHRAudit(params) {
  var headers = hrAuditHeaders();
  var sheet = getOrCreateSheet('HR Audits', headers);
  var ts = now();

  var row = buildHRAuditRow(params, ts);
  sheet.appendRow(row);

  Logger.log('HR Audit saved for store: ' + (params.storeName || 'Unknown'));
  return jsonResponse({ success: true, message: 'HR Audit submitted successfully', timestamp: ts });
}

// ===========================
// UPDATE HR AUDIT
// ===========================

function updateHRAudit(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HR Audits');
  if (!sheet) return jsonResponse({ success: false, message: 'HR Audits sheet not found' });

  var rowId = (params.rowId || '').trim();
  if (!rowId) return jsonResponse({ success: false, message: 'rowId is required for update' });

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    var cellVal = data[i][1];
    if (cellVal instanceof Date) {
      cellVal = Utilities.formatDate(cellVal, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    }
    if (String(cellVal || '').trim() === rowId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return jsonResponse({ success: false, message: 'Row not found for rowId: ' + rowId });

  var updatedRow = buildHRAuditRow(params, String(data[rowIndex - 1][0]));
  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

  Logger.log('Updated HR Audit row ' + rowIndex + ' for store: ' + (params.storeName || 'Unknown'));
  return jsonResponse({ success: true, message: 'HR Audit updated successfully' });
}

// ===========================
// BUILD HR AUDIT ROW
// ===========================

function buildHRAuditRow(params, timestamp) {
  var scores = computeScores(params);

  var row = [
    timestamp,
    params.submissionTime || '',
    params.auditorName || '',
    params.auditorId || '',
    params.storeName || '',
    params.storeID || '',
    params.city || '',
    params.region || '',
    scores.attrition,
    scores.capability,
    scores.culture,
    scores.engagement,
    scores.pressure,
    scores.storeHealth,
    scores.riskAlerts,
    params.auditorSignature || '',
    params.smSignature || ''
  ];

  // Question responses (28)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    row.push(params[QUESTION_IDS[i]] || '');
  }

  // Question remarks (28)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    row.push(params[QUESTION_IDS[i] + '_remark'] || '');
  }

  // JSON blobs
  row.push(params.questionRemarksJSON || '{}');
  row.push(params.responsesJSON || '{}');

  return row;
}

// ===========================
// GET HR AUDIT DATA
// ===========================

function getHRAuditData(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HR Audits');
  if (!sheet) return jsonResponse([]);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonResponse([]);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var tz = Session.getScriptTimeZone();
  var submissions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var submission = {};

    for (var col = 0; col < headers.length; col++) {
      var val = row[col];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, tz, 'dd/MM/yyyy HH:mm:ss');
      }
      submission[headers[col]] = val !== undefined ? val : '';
    }

    submission.submissionTime = submission['Submission Time'] || '';
    submission.auditorName = submission['Auditor Name'] || '';
    submission.auditorId = submission['Auditor ID'] || '';
    submission.storeName = submission['Store Name'] || '';
    submission.storeId = submission['Store ID'] || '';
    submission.city = submission['City'] || '';
    submission.region = submission['Region'] || '';
    submission.attritionScore = Number(submission['Attrition Score']) || 0;
    submission.capabilityScore = Number(submission['Capability Score']) || 0;
    submission.cultureScore = Number(submission['Culture Score']) || 0;
    submission.engagementScore = Number(submission['Engagement Score']) || 0;
    submission.pressureScore = Number(submission['Pressure Score']) || 0;
    submission.storeHealth = Number(submission['Store Health']) || 0;
    submission.riskAlerts = submission['Risk Alerts'] || '';

    // Parse individual responses
    var responses = {};
    for (var q = 0; q < QUESTION_IDS.length; q++) {
      var qId = QUESTION_IDS[q];
      if (submission[qId] !== undefined && submission[qId] !== '') {
        responses[qId] = String(submission[qId]);
      }
    }
    submission.responses = responses;

    // Parse remarks JSON
    try {
      submission.questionRemarks = JSON.parse(submission['Remarks JSON'] || '{}');
    } catch (e) {
      submission.questionRemarks = {};
    }

    submissions.push(submission);
  }

  // Optional: filter by auditorId
  var auditorId = (params.auditorId || '').trim();
  if (auditorId) {
    submissions = submissions.filter(function(s) {
      return String(s.auditorId || '').trim().toUpperCase() === auditorId.toUpperCase();
    });
  }

  Logger.log('Returning ' + submissions.length + ' HR Audit submissions');
  return jsonResponse(submissions);
}

// ===========================
// DRAFT MANAGEMENT
// ===========================

function hrAuditDraftHeaders() {
  return [
    'Draft ID',
    'Auditor ID',
    'Auditor Name',
    'Store Name',
    'Store ID',
    'City',
    'Timestamp',
    'Completion %',
    'Responses JSON',
    'Remarks JSON',
    'Signatures JSON',
    'Meta JSON'
  ];
}

function saveHRAuditDraft(params) {
  var headers = hrAuditDraftHeaders();
  var sheet = getOrCreateSheet('HR Audit Drafts', headers);

  var draftId = params.draftId || Utilities.getUuid();
  var data = sheet.getDataRange().getValues();
  var existingRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      existingRow = i + 1;
      break;
    }
  }

  var rowData = [
    draftId,
    params.auditorId || '',
    params.auditorName || '',
    params.storeName || '',
    params.storeID || '',
    params.city || '',
    params.timestamp || now(),
    params.completionPercentage || '0',
    params.responsesJSON || '{}',
    params.questionRemarksJSON || '{}',
    params.signaturesJSON || '{}',
    params.metaJSON || '{}'
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  Logger.log('HR Audit draft saved: ' + draftId);
  return jsonResponse({ success: true, draftId: draftId, message: 'Draft saved successfully' });
}

function getHRAuditDrafts(params) {
  var auditorId = (params.auditorId || '').toUpperCase().trim();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HR Audit Drafts');
  if (!sheet) return jsonResponse({ success: true, drafts: [] });

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return jsonResponse({ success: true, drafts: [] });

  var drafts = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowAuditorId = String(row[1] || '').toUpperCase().trim();

    if (!auditorId || rowAuditorId === auditorId) {
      drafts.push({
        id: String(row[0] || ''),
        auditorId: String(row[1] || ''),
        auditorName: String(row[2] || ''),
        storeName: String(row[3] || ''),
        storeID: String(row[4] || ''),
        city: String(row[5] || ''),
        timestamp: String(row[6] || ''),
        completionPercentage: Number(row[7]) || 0
      });
    }
  }

  Logger.log('Returning ' + drafts.length + ' HR Audit drafts');
  return jsonResponse({ success: true, drafts: drafts });
}

function loadHRAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResponse({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HR Audit Drafts');
  if (!sheet) return jsonResponse({ success: false, message: 'No drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      var responses = {};
      var questionRemarks = {};
      var signatures = { auditor: '', sm: '' };
      var meta = {};

      try { responses = JSON.parse(String(data[i][8] || '{}')); } catch (e) {}
      try { questionRemarks = JSON.parse(String(data[i][9] || '{}')); } catch (e) {}
      try { signatures = JSON.parse(String(data[i][10] || '{"auditor":"","sm":""}')); } catch (e) {}
      try { meta = JSON.parse(String(data[i][11] || '{}')); } catch (e) {}

      Logger.log('HR Audit draft loaded: ' + draftId);
      return jsonResponse({
        success: true,
        data: {
          draft: {
            id: String(data[i][0] || ''),
            auditorId: String(data[i][1] || ''),
            auditorName: String(data[i][2] || ''),
            storeName: String(data[i][3] || ''),
            storeID: String(data[i][4] || ''),
            timestamp: String(data[i][6] || ''),
            completionPercentage: Number(data[i][7]) || 0,
            responses: responses,
            questionRemarks: questionRemarks,
            signatures: signatures,
            meta: meta
          }
        }
      });
    }
  }

  return jsonResponse({ success: false, message: 'Draft not found' });
}

function deleteHRAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResponse({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HR Audit Drafts');
  if (!sheet) return jsonResponse({ success: false, message: 'No drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      sheet.deleteRow(i + 1);
      Logger.log('HR Audit draft deleted: ' + draftId);
      return jsonResponse({ success: true, message: 'Draft deleted successfully' });
    }
  }

  return jsonResponse({ success: false, message: 'Draft not found' });
}
