/**
 * Vendor Audit Google Apps Script
 * Single endpoint for: Vendor Audit submission, editing, drafts, data retrieval
 *
 * Sheets in this spreadsheet:
 *   - "Vendor Audits"       — Submitted vendor audit data (metadata + 63 question responses + remarks + images)
 *   - "Vendor Audit Drafts"  — Draft management (save, load, delete)
 *
 * Deploy: Extensions > Apps Script > Deploy > Web App
 *   Execute as: Me | Access: Anyone
 *
 * Set the deployed URL as VITE_VENDOR_AUDIT_SCRIPT_URL in .env
 *
 * 9 Sections, 63 Questions:
 *   VA_ZeroTolerance     — VZT_1..VZT_3   (3 questions)
 *   VA_DesignFacilities   — VDF_1..VDF_16  (16 questions)
 *   VA_ControlOfOperation — VCO_1..VCO_22  (22 questions)
 *   VA_CleaningSanitation — VCS_1..VCS_5   (5 questions)
 *   VA_PestControl        — VPC_1..VPC_2   (2 questions)
 *   VA_PersonalHygiene    — VPH_1..VPH_4   (4 questions)
 *   VA_Maintenance        — VM_1..VM_2     (2 questions)
 *   VA_Documentation      — VD_1..VD_5     (5 questions)
 *   VA_GeneralSafety      — VGS_1..VGS_4   (4 questions)
 */

// ===========================
// QUESTION ID DEFINITIONS
// ===========================

var QUESTION_IDS = [
  // Zero Tolerance (3)
  'VA_ZeroTolerance_VZT_1', 'VA_ZeroTolerance_VZT_2', 'VA_ZeroTolerance_VZT_3',
  // Design & Facilities (16)
  'VA_DesignFacilities_VDF_1', 'VA_DesignFacilities_VDF_2', 'VA_DesignFacilities_VDF_3', 'VA_DesignFacilities_VDF_4',
  'VA_DesignFacilities_VDF_5', 'VA_DesignFacilities_VDF_6', 'VA_DesignFacilities_VDF_7', 'VA_DesignFacilities_VDF_8',
  'VA_DesignFacilities_VDF_9', 'VA_DesignFacilities_VDF_10', 'VA_DesignFacilities_VDF_11', 'VA_DesignFacilities_VDF_12',
  'VA_DesignFacilities_VDF_13', 'VA_DesignFacilities_VDF_14', 'VA_DesignFacilities_VDF_15', 'VA_DesignFacilities_VDF_16',
  // Control of Operation (22)
  'VA_ControlOfOperation_VCO_1', 'VA_ControlOfOperation_VCO_2', 'VA_ControlOfOperation_VCO_3', 'VA_ControlOfOperation_VCO_4',
  'VA_ControlOfOperation_VCO_5', 'VA_ControlOfOperation_VCO_6', 'VA_ControlOfOperation_VCO_7', 'VA_ControlOfOperation_VCO_8',
  'VA_ControlOfOperation_VCO_9', 'VA_ControlOfOperation_VCO_10', 'VA_ControlOfOperation_VCO_11', 'VA_ControlOfOperation_VCO_12',
  'VA_ControlOfOperation_VCO_13', 'VA_ControlOfOperation_VCO_14', 'VA_ControlOfOperation_VCO_15', 'VA_ControlOfOperation_VCO_16',
  'VA_ControlOfOperation_VCO_17', 'VA_ControlOfOperation_VCO_18', 'VA_ControlOfOperation_VCO_19', 'VA_ControlOfOperation_VCO_20',
  'VA_ControlOfOperation_VCO_21', 'VA_ControlOfOperation_VCO_22',
  // Cleaning & Sanitation (5)
  'VA_CleaningSanitation_VCS_1', 'VA_CleaningSanitation_VCS_2', 'VA_CleaningSanitation_VCS_3', 'VA_CleaningSanitation_VCS_4', 'VA_CleaningSanitation_VCS_5',
  // Pest Control (2)
  'VA_PestControl_VPC_1', 'VA_PestControl_VPC_2',
  // Personal Hygiene (4)
  'VA_PersonalHygiene_VPH_1', 'VA_PersonalHygiene_VPH_2', 'VA_PersonalHygiene_VPH_3', 'VA_PersonalHygiene_VPH_4',
  // Maintenance (2)
  'VA_Maintenance_VM_1', 'VA_Maintenance_VM_2',
  // Documentation (5)
  'VA_Documentation_VD_1', 'VA_Documentation_VD_2', 'VA_Documentation_VD_3', 'VA_Documentation_VD_4', 'VA_Documentation_VD_5',
  // General Safety (4)
  'VA_GeneralSafety_VGS_1', 'VA_GeneralSafety_VGS_2', 'VA_GeneralSafety_VGS_3', 'VA_GeneralSafety_VGS_4'
];

// ===========================
// ENTRY POINTS
// ===========================

function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'createVendorAudit';

    Logger.log('doPost action=' + action);

    switch (action) {
      case 'createVendorAudit':
        return createVendorAudit(params);
      case 'update':
        return updateVendorAudit(params);
      case 'saveVendorAuditDraft':
        return saveVendorAuditDraft(params);
      case 'deleteVendorAuditDraft':
        return deleteVendorAuditDraft(params);
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
        return getVendorAuditData(params);
      case 'getVendorAuditDrafts':
        return getVendorAuditDrafts(params);
      case 'loadVendorAuditDraft':
        return loadVendorAuditDraft(params);
      default:
        return jsonResponse({ success: true, message: 'Vendor Audit API is active.' });
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
  return new Date().toLocaleString('en-GB', { hour12: false });
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
// HEADERS FOR VENDOR AUDITS SHEET
// ===========================

function vendorAuditHeaders() {
  var headers = [
    'Timestamp',           // A
    'Submission Time',     // B
    'Auditor Name',        // C
    'Auditor ID',          // D
    'Vendor Name',         // E
    'Vendor Location',     // F
    'City',                // G
    'Region',              // H
    'Total Score',         // I
    'Max Score',           // J
    'Score %',             // K
    'Auditor Signature',   // L
    'Vendor Signature'     // M
  ];

  // Add all 63 question response columns
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
// CREATE VENDOR AUDIT (NEW SUBMISSION)
// ===========================

function createVendorAudit(params) {
  var headers = vendorAuditHeaders();
  var sheet = getOrCreateSheet('Vendor Audits', headers);
  var ts = now();

  var row = buildAuditRow(params, ts);
  sheet.appendRow(row);

  Logger.log('Vendor audit saved for vendor: ' + (params.vendorName || 'Unknown'));
  return jsonResponse({ success: true, message: 'Vendor audit submitted successfully', timestamp: ts });
}

// ===========================
// UPDATE VENDOR AUDIT (EDIT SUBMITTED AUDIT)
// ===========================

function updateVendorAudit(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audits');
  if (!sheet) return jsonResponse({ success: false, message: 'Vendor Audits sheet not found' });

  var rowId = (params.rowId || '').trim();
  if (!rowId) return jsonResponse({ success: false, message: 'rowId is required for update' });

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rowIndex = -1;

  // Find the row by matching Submission Time (column B)
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim() === rowId) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) return jsonResponse({ success: false, message: 'Row not found for rowId: ' + rowId });

  // Rebuild the full row with updated data (preserve original timestamp)
  var updatedRow = buildAuditRow(params, String(data[rowIndex - 1][0]));
  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

  Logger.log('Updated vendor audit row ' + rowIndex + ' for vendor: ' + (params.vendorName || 'Unknown'));
  return jsonResponse({ success: true, message: 'Vendor audit updated successfully' });
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
    params.vendorName || '',                // Vendor Name
    params.vendorLocation || '',            // Vendor Location
    params.city || '',                      // City
    params.region || '',                    // Region
    params.totalScore || 0,                 // Total Score
    params.maxScore || 0,                   // Max Score
    params.scorePercentage || 0,            // Score %
    params.auditorSignature || '',          // Auditor Signature
    params.vendorSignature || ''            // Vendor Signature
  ];

  // Question responses (63 columns)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    row.push(params[QUESTION_IDS[i]] || '');
  }

  // Question remarks (63 columns)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    row.push(params[QUESTION_IDS[i] + '_remark'] || '');
  }

  // Question image counts (63 columns)
  for (var i = 0; i < QUESTION_IDS.length; i++) {
    row.push(params[QUESTION_IDS[i] + '_imageCount'] || '0');
  }

  // Remarks JSON and Images JSON blobs
  row.push(params.questionRemarksJSON || '{}');
  row.push(params.questionImagesJSON || '{}');

  return row;
}

// ===========================
// GET VENDOR AUDIT DATA (ALL SUBMISSIONS)
// ===========================

function getVendorAuditData(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audits');
  if (!sheet) return jsonResponse([]);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonResponse([]);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var submissions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var submission = {};

    for (var col = 0; col < headers.length; col++) {
      submission[headers[col]] = row[col] !== undefined ? row[col] : '';
    }

    // Map to frontend expected keys
    submission.submissionTime = submission['Submission Time'] || '';
    submission.auditorName = submission['Auditor Name'] || '';
    submission.auditorId = submission['Auditor ID'] || '';
    submission.vendorName = submission['Vendor Name'] || '';
    submission.vendorLocation = submission['Vendor Location'] || '';
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

    // Parse remarks from JSON blob (more reliable than individual columns)
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

  return jsonResponse(submissions);
}

// ===========================
// COMPUTE SECTION SCORES
// ===========================

function computeSectionScores(responses) {
  var sections = {
    'VA_ZeroTolerance': { ids: ['VZT_1','VZT_2','VZT_3'], maxPerQ: 2, isZT: true },
    'VA_DesignFacilities': { ids: [], maxPerQ: 2, isZT: false },
    'VA_ControlOfOperation': { ids: [], maxPerQ: 2, isZT: false },
    'VA_CleaningSanitation': { ids: [], maxPerQ: 2, isZT: false },
    'VA_PestControl': { ids: [], maxPerQ: 2, isZT: false },
    'VA_PersonalHygiene': { ids: [], maxPerQ: 2, isZT: false },
    'VA_Maintenance': { ids: [], maxPerQ: 2, isZT: false },
    'VA_Documentation': { ids: [], maxPerQ: 2, isZT: false },
    'VA_GeneralSafety': { ids: [], maxPerQ: 2, isZT: false }
  };

  // Build ID lists
  for (var i = 1; i <= 16; i++) sections['VA_DesignFacilities'].ids.push('VDF_' + i);
  for (var i = 1; i <= 22; i++) sections['VA_ControlOfOperation'].ids.push('VCO_' + i);
  for (var i = 1; i <= 5; i++) sections['VA_CleaningSanitation'].ids.push('VCS_' + i);
  for (var i = 1; i <= 2; i++) sections['VA_PestControl'].ids.push('VPC_' + i);
  for (var i = 1; i <= 4; i++) sections['VA_PersonalHygiene'].ids.push('VPH_' + i);
  for (var i = 1; i <= 2; i++) sections['VA_Maintenance'].ids.push('VM_' + i);
  for (var i = 1; i <= 5; i++) sections['VA_Documentation'].ids.push('VD_' + i);
  for (var i = 1; i <= 4; i++) sections['VA_GeneralSafety'].ids.push('VGS_' + i);

  var result = {};

  for (var sectionId in sections) {
    var sec = sections[sectionId];
    var total = 0;
    var maxPossible = 0;

    for (var j = 0; j < sec.ids.length; j++) {
      var key = sectionId + '_' + sec.ids[j];
      var answer = responses[key] || '';

      if (answer === 'na') continue;
      maxPossible += sec.maxPerQ;

      if (sec.isZT) {
        if (answer === 'compliant') total += sec.maxPerQ;
      } else {
        if (answer === 'compliant') total += sec.maxPerQ;
        else if (answer === 'partially-compliant') total += Math.floor(sec.maxPerQ / 2);
      }
    }

    result[sectionId] = {
      score: total,
      maxScore: maxPossible,
      percentage: maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0
    };
  }

  return result;
}

// ===========================
// DRAFT MANAGEMENT
// ===========================

function vendorAuditDraftHeaders() {
  return [
    'Draft ID',             // A
    'Auditor ID',           // B
    'Auditor Name',         // C
    'Vendor Name',          // D
    'Vendor Location',      // E
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

function saveVendorAuditDraft(params) {
  var headers = vendorAuditDraftHeaders();
  var sheet = getOrCreateSheet('Vendor Audit Drafts', headers);

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
    params.vendorName || '',                // Vendor Name
    params.vendorLocation || '',            // Vendor Location
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

  Logger.log('Vendor audit draft saved: ' + draftId);
  return jsonResponse({ success: true, draftId: draftId, message: 'Draft saved successfully' });
}

// --- Get Drafts List ---

function getVendorAuditDrafts(params) {
  var auditorId = (params.auditorId || '').toUpperCase().trim();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audit Drafts');
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
        vendorName: String(row[3] || ''),
        vendorLocation: String(row[4] || ''),
        city: String(row[5] || ''),
        timestamp: String(row[6] || ''),
        completionPercentage: Number(row[7]) || 0
      });
    }
  }

  return jsonResponse({ success: true, drafts: drafts });
}

// --- Load Single Draft ---

function loadVendorAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResponse({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audit Drafts');
  if (!sheet) return jsonResponse({ success: false, message: 'No drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      // Parse all JSON fields for the frontend
      var responses = {};
      var questionImages = {};
      var questionRemarks = {};
      var signatures = { auditor: '', vendor: '' };
      var meta = {};

      try { responses = JSON.parse(String(data[i][8] || '{}')); } catch (e) {}
      try { questionImages = JSON.parse(String(data[i][9] || '{}')); } catch (e) {}
      try { questionRemarks = JSON.parse(String(data[i][10] || '{}')); } catch (e) {}
      try { signatures = JSON.parse(String(data[i][11] || '{"auditor":"","vendor":""}')); } catch (e) {}
      try { meta = JSON.parse(String(data[i][12] || '{}')); } catch (e) {}

      return jsonResponse({
        success: true,
        data: {
          draft: {
            id: String(data[i][0] || ''),
            auditorId: String(data[i][1] || ''),
            auditorName: String(data[i][2] || ''),
            vendorName: String(data[i][3] || ''),
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

function deleteVendorAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return jsonResponse({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audit Drafts');
  if (!sheet) return jsonResponse({ success: false, message: 'No drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      sheet.deleteRow(i + 1);
      Logger.log('Vendor audit draft deleted: ' + draftId);
      return jsonResponse({ success: true, message: 'Draft deleted successfully' });
    }
  }

  return jsonResponse({ success: false, message: 'Draft not found' });
}
