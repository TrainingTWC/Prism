/**
 * Pre-Launch Audit Google Apps Script
 * Single endpoint for: Pre-Launch Audit submission, editing, drafts, data retrieval
 *
 * Sheets in this spreadsheet:
 *   - "Pre-Launch Audits"       — Submitted pre-launch audit data (metadata + 40 question responses + remarks + images)
 *   - "Pre-Launch Audit Drafts" — Draft management (save, load, delete)
 *
 * Deploy: Extensions > Apps Script > Deploy > Web App
 *   Execute as: Me | Access: Anyone
 *
 * Set the deployed URL as VITE_PRE_LAUNCH_AUDIT_SCRIPT_URL in .env
 *
 * 1 Section, 40 Questions:
 *   PreLaunchChecklist — PL_1..PL_40  (40 questions)
 */

// ===========================
// QUESTION ID DEFINITIONS
// ===========================

var QUESTION_IDS = [
  // Pre Launch Checklist (40)
  'PreLaunchChecklist_PL_1', 'PreLaunchChecklist_PL_2', 'PreLaunchChecklist_PL_3', 'PreLaunchChecklist_PL_4',
  'PreLaunchChecklist_PL_5', 'PreLaunchChecklist_PL_6', 'PreLaunchChecklist_PL_7', 'PreLaunchChecklist_PL_8',
  'PreLaunchChecklist_PL_9', 'PreLaunchChecklist_PL_10', 'PreLaunchChecklist_PL_11', 'PreLaunchChecklist_PL_12',
  'PreLaunchChecklist_PL_13', 'PreLaunchChecklist_PL_14', 'PreLaunchChecklist_PL_15', 'PreLaunchChecklist_PL_16',
  'PreLaunchChecklist_PL_17', 'PreLaunchChecklist_PL_18', 'PreLaunchChecklist_PL_19', 'PreLaunchChecklist_PL_20',
  'PreLaunchChecklist_PL_21', 'PreLaunchChecklist_PL_22', 'PreLaunchChecklist_PL_23', 'PreLaunchChecklist_PL_24',
  'PreLaunchChecklist_PL_25', 'PreLaunchChecklist_PL_26', 'PreLaunchChecklist_PL_27', 'PreLaunchChecklist_PL_28',
  'PreLaunchChecklist_PL_29', 'PreLaunchChecklist_PL_30', 'PreLaunchChecklist_PL_31', 'PreLaunchChecklist_PL_32',
  'PreLaunchChecklist_PL_33', 'PreLaunchChecklist_PL_34', 'PreLaunchChecklist_PL_35', 'PreLaunchChecklist_PL_36',
  'PreLaunchChecklist_PL_37', 'PreLaunchChecklist_PL_38', 'PreLaunchChecklist_PL_39', 'PreLaunchChecklist_PL_40'
];

// ===========================
// QUESTION TEXT MAP (for logging / dashboard)
// ===========================

var QUESTION_TEXT_MAP = {
  'PreLaunchChecklist_PL_1':  'Staff medicals to be completed before the launch for new joinees',
  'PreLaunchChecklist_PL_2':  'Golden rules (FSDB) displayed prominently in A3 size frame',
  'PreLaunchChecklist_PL_3':  'All FSA material (Shelf life chart, Dilution chart, checklist) available before launch',
  'PreLaunchChecklist_PL_4':  'At least one FoSTaC holder employee',
  'PreLaunchChecklist_PL_5':  'Flaking paint on walls and ceiling checked in production & customer area',
  'PreLaunchChecklist_PL_6':  'No dampness on inner walls',
  'PreLaunchChecklist_PL_7':  'Shatter-proof lighting at 540 lux in food prep area',
  'PreLaunchChecklist_PL_8':  'Electrical socket gaps covered; heavy-duty plugs installed properly',
  'PreLaunchChecklist_PL_9':  'Foot/elbow operated sink system for hand washing',
  'PreLaunchChecklist_PL_10': 'Fire extinguishers and fire blanket in processing area',
  'PreLaunchChecklist_PL_11': 'Fire alarm checked',
  'PreLaunchChecklist_PL_12': 'First-aid box available',
  'PreLaunchChecklist_PL_13': 'Hot water facility for washing utensils/equipment',
  'PreLaunchChecklist_PL_14': 'No condensation dripping in fridge/chiller/freezer',
  'PreLaunchChecklist_PL_15': 'Ice cube machine working condition',
  'PreLaunchChecklist_PL_16': 'Water flow rate and connections checked',
  'PreLaunchChecklist_PL_17': 'Screws/bolts checked—no rust/loose/fall risk',
  'PreLaunchChecklist_PL_18': 'All lights working properly',
  'PreLaunchChecklist_PL_19': 'Smallware items available for veg & non-veg',
  'PreLaunchChecklist_PL_20': 'Airtight containers for raw material storage',
  'PreLaunchChecklist_PL_21': 'Packaging & storage area with sufficient racks',
  'PreLaunchChecklist_PL_22': 'Thermometer and TDS meter available',
  'PreLaunchChecklist_PL_23': 'Measuring cylinders available',
  'PreLaunchChecklist_PL_24': 'Pedal-operated garbage bins (wet & dry)',
  'PreLaunchChecklist_PL_25': 'Store signages displayed',
  'PreLaunchChecklist_PL_26': 'No garbage/debris accumulation outside store',
  'PreLaunchChecklist_PL_27': 'Complete store deep cleaning & sanitation done',
  'PreLaunchChecklist_PL_28': 'First pest control fumigation completed',
  'PreLaunchChecklist_PL_29': 'Air curtain/strip curtains installed',
  'PreLaunchChecklist_PL_30': 'Drains properly covered',
  'PreLaunchChecklist_PL_31': 'Pest control devices installed (fly lights, rodent box etc.)',
  'PreLaunchChecklist_PL_32': 'Door fitted with proper closer',
  'PreLaunchChecklist_PL_33': 'Gaps between pipes, vents, walls sealed',
  'PreLaunchChecklist_PL_34': 'No external openings OR mesh installed',
  'PreLaunchChecklist_PL_35': 'Designated storage for chemicals & personal belongings',
  'PreLaunchChecklist_PL_36': 'Furniture in good condition',
  'PreLaunchChecklist_PL_37': 'Walls/graphics clean, no damage/stains',
  'PreLaunchChecklist_PL_38': 'Rubber mats provided',
  'PreLaunchChecklist_PL_39': 'All signages (handwash, push/pull etc.) in place',
  'PreLaunchChecklist_PL_40': 'Cleaning chemicals available & not expired'
};

// ===========================
// ENTRY POINTS
// ===========================

function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'createPreLaunchAudit';

    Logger.log('doPost action=' + action);

    switch (action) {
      case 'createPreLaunchAudit':
        return createPreLaunchAudit(params);
      case 'update':
        return updatePreLaunchAudit(params);
      case 'savePreLaunchAuditDraft':
        return savePreLaunchAuditDraft(params);
      case 'deletePreLaunchAuditDraft':
        return deletePreLaunchAuditDraft(params);
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
        return getPreLaunchAuditData(params);
      case 'getPreLaunchAuditDrafts':
        return getPreLaunchAuditDrafts(params);
      case 'loadPreLaunchAuditDraft':
        return loadPreLaunchAuditDraft(params);
      default:
        return jsonResponse({ success: true, message: 'Pre-Launch Audit API is active.' });
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
// HEADERS FOR PRE-LAUNCH AUDITS SHEET
// ===========================

function preLaunchAuditHeaders() {
  var headers = [
    'Timestamp',           // A
    'Submission Time',     // B
    'Auditor Name',        // C
    'Auditor ID',          // D
    'Store Name',          // E
    'Store ID',            // F
    'City',                // G
    'Region',              // H
    'Total Score',         // I
    'Max Score',           // J
    'Score %',             // K
    'Auditor Signature',   // L
    'SM Signature'         // M
  ];

  // Add all 40 question response columns
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    headers.push(QUESTION_IDS[i]);
  }

  // Add remark columns for each question
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    headers.push(QUESTION_IDS[i] + '_remark');
  }

  // Add image count columns for each question
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    headers.push(QUESTION_IDS[i] + '_imageCount');
  }

  // JSON blob columns
  headers.push('Remarks JSON');
  headers.push('Images JSON');

  return headers;
}

// ===========================
// CREATE PRE-LAUNCH AUDIT (NEW SUBMISSION)
// ===========================

function createPreLaunchAudit(params) {
  var headers = preLaunchAuditHeaders();
  var sheet = getOrCreateSheet('Pre-Launch Audits', headers);
  var ts = now();

  var row = buildAuditRow(params, ts);
  sheet.appendRow(row);

  // Log individual question results for analysis
  logQuestionResults(params, ts);

  Logger.log('Pre-launch audit saved for store: ' + (params.storeName || 'Unknown'));
  return jsonResponse({ success: true, message: 'Pre-launch audit submitted successfully', timestamp: ts });
}

// ===========================
// UPDATE PRE-LAUNCH AUDIT (EDIT SUBMITTED AUDIT)
// ===========================

function updatePreLaunchAudit(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pre-Launch Audits');
  if (!sheet) return jsonResponse({ success: false, message: 'Pre-Launch Audits sheet not found' });

  var rowId = (params.rowId || '').trim();
  if (!rowId) return jsonResponse({ success: false, message: 'rowId is required for update' });

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  // Find the row by matching Submission Time (column B)
  for (var i = 1; i < data.length; i++) {
    var cellVal = data[i][1];
    if (cellVal instanceof Date) {
      cellVal = Utilities.formatDate(cellVal, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    }
    if (String(cellVal || '').trim() === rowId) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) return jsonResponse({ success: false, message: 'Row not found for rowId: ' + rowId });

  // Rebuild the full row with updated data (preserve original timestamp)
  var updatedRow = buildAuditRow(params, String(data[rowIndex - 1][0]));
  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

  Logger.log('Updated pre-launch audit row ' + rowIndex + ' for store: ' + (params.storeName || 'Unknown'));
  return jsonResponse({ success: true, message: 'Pre-launch audit updated successfully' });
}

// ===========================
// BUILD AUDIT ROW
// ===========================

function buildAuditRow(params, timestamp) {
  var row = [
    timestamp,                              // Timestamp
    params.submissionTime || '',            // Submission Time
    params.auditorName || '',               // Auditor Name
    params.auditorId || '',                 // Auditor ID
    params.storeName || '',                 // Store Name
    params.storeId || '',                    // Store ID
    params.city || '',                      // City
    params.region || '',                    // Region
    params.totalScore || 0,                 // Total Score
    params.maxScore || 0,                   // Max Score
    params.scorePercentage || 0,            // Score %
    params.auditorSignature || '',          // Auditor Signature
    params.smSignature || ''                // SM Signature
  ];

  // Question responses (40 columns)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    row.push(params[QUESTION_IDS[i]] || '');
  }

  // Question remarks (40 columns)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    row.push(params[QUESTION_IDS[i] + '_remark'] || '');
  }

  // Question image counts (40 columns)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    row.push(params[QUESTION_IDS[i] + '_imageCount'] || '0');
  }

  // Remarks JSON and Images JSON blobs
  row.push(params.questionRemarksJSON || '{}');
  row.push(params.questionImagesJSON || '{}');

  return row;
}

// ===========================
// LOG QUESTION RESULTS (DETAILED LOGGING)
// ===========================

function logQuestionResults(params, timestamp) {
  var storeName = params.storeName || 'Unknown';
  var auditorName = params.auditorName || 'Unknown';
  var nonCompliant = [];
  var partiallyCompliant = [];
  var compliant = [];

  for (var i = 0; i < QUESTION_IDS.length; i++) {
    var qId = QUESTION_IDS[i];
    var answer = params[qId] || '';
    var questionText = QUESTION_TEXT_MAP[qId] || qId;

    if (answer === 'not-compliant') {
      nonCompliant.push(qId + ': ' + questionText);
    } else if (answer === 'partially-compliant') {
      partiallyCompliant.push(qId + ': ' + questionText);
    } else if (answer === 'compliant') {
      compliant.push(qId);
    }
  }

  Logger.log('=== Pre-Launch Audit Results ===');
  Logger.log('Store: ' + storeName + ' | Auditor: ' + auditorName + ' | Time: ' + timestamp);
  Logger.log('Score: ' + (params.totalScore || 0) + '/' + (params.maxScore || 0) + ' (' + (params.scorePercentage || 0) + '%)');
  Logger.log('Compliant: ' + compliant.length + ' | Partially: ' + partiallyCompliant.length + ' | Non-Compliant: ' + nonCompliant.length);

  if (nonCompliant.length > 0) {
    Logger.log('--- Non-Compliant Items ---');
    for (var j = 0; j < nonCompliant.length; j++) {
      Logger.log('  ✗ ' + nonCompliant[j]);
    }
  }

  if (partiallyCompliant.length > 0) {
    Logger.log('--- Partially Compliant Items ---');
    for (var j = 0; j < partiallyCompliant.length; j++) {
      Logger.log('  △ ' + partiallyCompliant[j]);
    }
  }

  Logger.log('=== End Pre-Launch Audit Results ===');
}

// ===========================
// GET PRE-LAUNCH AUDIT DATA (ALL SUBMISSIONS)
// ===========================

function getPreLaunchAuditData(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pre-Launch Audits');
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
      // Format Date objects to string for consistency
      if (val instanceof Date) {
        val = Utilities.formatDate(val, tz, 'dd/MM/yyyy HH:mm:ss');
      }
      submission[headers[col]] = val !== undefined ? val : '';
    }

    // Map to frontend expected keys
    submission.submissionTime = submission['Submission Time'] || '';
    submission.auditorName = submission['Auditor Name'] || '';
    submission.auditorId = submission['Auditor ID'] || '';
    submission.storeName = submission['Store Name'] || '';
    submission.storeId = submission['Store ID'] || '';
    submission.city = submission['City'] || '';
    submission.region = submission['Region'] || '';
    submission.totalScore = Number(submission['Total Score']) || 0;
    submission.maxScore = Number(submission['Max Score']) || 0;
    submission.scorePercentage = Number(submission['Score %']) || 0;

    // Parse responses from individual columns
    var responses = {};
    for (var q = 0; q < QUESTION_IDS.length; q++) {
      var qId = QUESTION_IDS[q];
      if (submission[qId]) {
        responses[qId] = String(submission[qId]);
      }
    }
    submission.responses = responses;

    // Parse remarks from JSON blob
    try {
      submission.questionRemarks = JSON.parse(submission['Remarks JSON'] || '{}');
    } catch (e) {
      submission.questionRemarks = {};
    }

    // Parse images from JSON blob
    try {
      submission.questionImages = JSON.parse(submission['Images JSON'] || '{}');
    } catch (e) {
      submission.questionImages = {};
    }

    // Section scores for dashboard
    submission.sectionScores = computeSectionScores(responses);

    submissions.push(submission);
  }

  // Optional: filter by auditorId
  var auditorId = (params.auditorId || '').trim();
  if (auditorId) {
    submissions = submissions.filter(function(s) {
      return String(s.auditorId || '').trim().toUpperCase() === auditorId.toUpperCase();
    });
  }

  Logger.log('Returning ' + submissions.length + ' pre-launch audit submissions');
  return jsonResponse(submissions);
}

// ===========================
// COMPUTE SECTION SCORES
// ===========================

function computeSectionScores(responses) {
  var result = {};

  // Pre Launch Checklist — PL_1..PL_40
  var plIds = [];
  for (var i = 1; i <= 40; i++) plIds.push('PL_' + i);

  var total = 0;
  var maxPossible = 0;
  var maxPerQ = 2;

  for (var j = 0; j < plIds.length; j++) {
    var key = 'PreLaunchChecklist_' + plIds[j];
    var answer = responses[key] || '';

    if (answer === 'na') continue;
    maxPossible += maxPerQ;

    if (answer === 'compliant') total += maxPerQ;
    else if (answer === 'partially-compliant') total += Math.floor(maxPerQ / 2);
  }

  result['PreLaunchChecklist'] = {
    score: total,
    maxScore: maxPossible,
    percentage: maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0
  };

  return result;
}

// ===========================
// DRAFT MANAGEMENT
// ===========================

function preLaunchAuditDraftHeaders() {
  return [
    'Draft ID',             // A
    'Auditor ID',           // B
    'Auditor Name',         // C
    'Store Name',           // D
    'Store ID',             // E
    'City',                 // F
    'Timestamp',            // G
    'Completion %',         // H
    'Responses JSON',       // I
    'Images JSON',          // J
    'Remarks JSON',         // K
    'Signatures JSON',      // L
    'Meta JSON'             // M
  ];
}

// --- Save Draft ---

function savePreLaunchAuditDraft(params) {
  var headers = preLaunchAuditDraftHeaders();
  var sheet = getOrCreateSheet('Pre-Launch Audit Drafts', headers);

  var draftId = params.draftId || Utilities.getUuid();
  var data = sheet.getDataRange().getValues();
  var existingRow = -1;

  // Check if draft already exists
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      existingRow = i + 1;
      break;
    }
  }

  var rowData = [
    draftId,                                // Draft ID
    params.auditorId || '',                 // Auditor ID
    params.auditorName || '',               // Auditor Name
    params.storeName || '',                 // Store Name
    params.storeId || '',                    // Store ID
    params.city || '',                      // City
    params.timestamp || now(),              // Timestamp
    params.completionPercentage || '0',     // Completion %
    params.responsesJSON || '{}',           // Responses JSON
    params.questionImagesJSON || '{}',      // Images JSON
    params.questionRemarksJSON || '{}',     // Remarks JSON
    params.signaturesJSON || '{}',          // Signatures JSON
    params.metaJSON || '{}'                 // Meta JSON
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  Logger.log('Pre-launch audit draft saved: ' + draftId);
  return jsonResponse({ success: true, draftId: draftId, message: 'Draft saved successfully' });
}

// --- Get Drafts List ---

function getPreLaunchAuditDrafts(params) {
  var auditorId = (params.auditorId || '').toUpperCase().trim();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pre-Launch Audit Drafts');
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

  Logger.log('Returning ' + drafts.length + ' pre-launch audit drafts');
  return jsonResponse({ success: true, drafts: drafts });
}

// --- Load Single Draft ---

function loadPreLaunchAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResponse({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pre-Launch Audit Drafts');
  if (!sheet) return jsonResponse({ success: false, message: 'No drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      // Parse all JSON fields for the frontend
      var responses = {};
      var questionImages = {};
      var questionRemarks = {};
      var signatures = { auditor: '', sm: '' };
      var meta = {};

      try { responses = JSON.parse(String(data[i][8] || '{}')); } catch (e) {}
      try { questionImages = JSON.parse(String(data[i][9] || '{}')); } catch (e) {}
      try { questionRemarks = JSON.parse(String(data[i][10] || '{}')); } catch (e) {}
      try { signatures = JSON.parse(String(data[i][11] || '{"auditor":"","sm":""}')); } catch (e) {}
      try { meta = JSON.parse(String(data[i][12] || '{}')); } catch (e) {}

      Logger.log('Pre-launch audit draft loaded: ' + draftId);
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
            questionImages: questionImages,
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

// --- Delete Draft ---

function deletePreLaunchAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResponse({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pre-Launch Audit Drafts');
  if (!sheet) return jsonResponse({ success: false, message: 'No drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      sheet.deleteRow(i + 1);
      Logger.log('Pre-launch audit draft deleted: ' + draftId);
      return jsonResponse({ success: true, message: 'Draft deleted successfully' });
    }
  }

  return jsonResponse({ success: false, message: 'Draft not found' });
}
