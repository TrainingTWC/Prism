/**
 * Google Apps Script to log form submissions to a Google Sheet.
 *
 * Usage:
 * 1. Copy this file into a new Apps Script project bound to a Google Sheet, or in a standalone project.
 * 2. Set the constant SHEET_ID to the target spreadsheet ID, or leave empty to use the bound spreadsheet.
 * 3. (Optional but recommended) In the Apps Script editor: Project Settings -> Script Properties, set FORMS_LOGGER_API_KEY to a secret key.
 * 4. Deploy -> New deployment -> "Web app". Set "Who has access" to "Anyone" or "Anyone with link" depending on your needs.
 * 5. POST JSON payloads to the web app URL. Example payload shape below.
 *
 * Example request body (JSON):
 * {
 *   "apiKey":"my-secret-key",          // optional if you set script property
 *   "formTitle":"Management Trainee Feedback Form",
 *   "formVersion":"v1.0",
 *   "meta": { "name":"Alice", "store":"Café Central","am":"Ravi","trainer":"Priyanka" },
 *   "responses": { "Q1":"5","Q2":"4","Q12":"Great training!" },
 *   "score": 84.5,
 *   "submit_ts": "2025-10-31T12:34:56Z"   // optional; if missing the server timestamp will be used
 * }
 *
 * The script will create or extend a single sheet. Header columns include:
 * Timestamp, FormTitle, FormVersion, Name, Store, AM, Trainer, Score, Q1, Q2, ...
 */

// Set this to the destination spreadsheet ID (leave as empty string to use bound spreadsheet)
const SHEET_ID = '';
// Default sheet/tab name to use
const SHEET_NAME = 'ManagementTraineeResponses';

// Define weights for the Management Trainee Feedback Form (question -> weight_percent)
const QUESTION_WEIGHTS = {
  Q1: 15,
  Q2: 10,
  Q3: 10,
  Q4: 5,
  Q5: 10,
  Q6: 7,
  Q7: 8,
  Q8: 7,
  Q9: 8,
  Q10: 12,
  Q11: 8,
  // Q12..Q16 are open text (weight 0)
  Q12: 0,
  Q13: 0,
  Q14: 0,
  Q15: 0,
  Q16: 0
};

function _getSpreadsheet() {
  if (SHEET_ID && SHEET_ID.trim()) {
    return SpreadsheetApp.openById(SHEET_ID);
  }
  // fallback to bound spreadsheet
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || '';
    if (action === 'getResponses') {
      return getFormResponsesFromSheet();
    }
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Forms logger is running' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return _jsonResponse({ success: false, error: String(err) }, 500);
  }
}

function doPost(e) {
  try {
    // Basic security: check script property FORMS_LOGGER_API_KEY (if set)
    var expectedKey = PropertiesService.getScriptProperties().getProperty('FORMS_LOGGER_API_KEY');

    // Accept API key either in JSON body or query string parameter 'key'
    var payloadText = e.postData && e.postData.contents ? e.postData.contents : '';
    if (!payloadText) {
      return _jsonResponse({ success: false, error: 'Empty request body' }, 400);
    }

    var parsed = JSON.parse(payloadText);
    var providedKey = (parsed && parsed.apiKey) || (e.parameter && e.parameter.key) || '';

    if (expectedKey && expectedKey !== '' && providedKey !== expectedKey) {
      return _jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    var formTitle = parsed.formTitle || 'Management Trainee Feedback Form';
    var formVersion = parsed.formVersion || 'v1.0';
    var meta = parsed.meta || {};
    var responses = parsed.responses || {};
    var submitTs = parsed.submit_ts || new Date().toISOString();

    // Compute weighted score server-side if likert values provided
    var weightedSum = 0;
    var weightTotal = 0;
    Object.keys(QUESTION_WEIGHTS).forEach(function(qk) {
      var w = Number(QUESTION_WEIGHTS[qk]) || 0;
      if (w > 0) {
        var raw = responses[qk];
        var val = raw !== undefined && raw !== null && raw !== '' ? Number(responses[qk]) : NaN;
        if (!isNaN(val)) {
          weightedSum += val * w;
        }
        weightTotal += w;
      }
    });

    var totalScore = weightedSum; // sum(value * weight)
    var maxScore = 5 * weightTotal; // 5 is max per likert item
    // Match front-end convention: percent = weightedSum / 5 when weights sum to 100
    var percent = weightTotal > 0 ? Number((weightedSum / 5).toFixed(1)) : 0;

    var ss = _getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Build header: stable ordering including Q1..Q16
    var baseHeaders = ['Server Timestamp', 'Submission Time', 'Name', 'Store', 'AM', 'Trainer', 'FormTitle', 'FormVersion', 'TotalScore', 'MaxScore', 'Percent'];
    var questionCols = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16'];
    var header = baseHeaders.concat(questionCols);

    // Ensure header exists in sheet (first row)
    var firstRow = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    var needsHeaderWrite = false;
    if (!firstRow || firstRow.length === 0 || firstRow[0] === '' ) {
      needsHeaderWrite = true;
    } else {
      // If some of our header columns are missing or different length, rewrite header
      if (firstRow.length !== header.length) needsHeaderWrite = true;
      else {
        for (var i = 0; i < header.length; i++) {
          if (String((firstRow[i] || '')).trim() !== String(header[i]).trim()) { needsHeaderWrite = true; break; }
        }
      }
    }

    if (needsHeaderWrite) {
      if (sheet.getLastRow() > 0) sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }

    // Build row matching header
    var row = [];
    row.push(new Date().toISOString()); // Server Timestamp
    row.push(submitTs); // Submission Time
    row.push(meta.name || '');
    row.push(meta.store || '');
    row.push(meta.am || '');
    row.push(meta.trainer || '');
    row.push(formTitle);
    row.push(formVersion);
    row.push(totalScore);
    row.push(maxScore);
    row.push(percent);

    // Append question values in fixed Q1..Q16 order
    questionCols.forEach(function(qk) { row.push(responses[qk] || ''); });

    sheet.appendRow(row);

    return _jsonResponse({ success: true, message: 'Logged', appendedAt: new Date().toISOString(), totalScore: totalScore, maxScore: maxScore, percent: percent }, 200);

  } catch (err) {
    return _jsonResponse({ success: false, error: String(err) }, 500);
  }
}

function _jsonResponse(obj, status) {
  // Apps Script does not support setting HTTP status codes directly on ContentService responses for web apps
  // when deployed as 'Web app'. Many clients will still see the JSON body. We include a 'status' field for clarity.
  var out = ContentService.createTextOutput(JSON.stringify(Object.assign({ status: status || 200 }, obj)));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function getFormResponsesFromSheet() {
  try {
    var ss = _getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Sheet '" + SHEET_NAME + "' not found");

    var data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return _jsonResponse([], 200);
    }

    var headers = data[0];
    var rows = data.slice(1);

    var jsonData = rows.map(function(row) {
      var obj = {};
      // map headers to values
      headers.forEach(function(h, idx) {
        var key = String(h || '').trim();
        if (!key) return;
        obj[key] = row[idx] !== undefined && row[idx] !== null ? row[idx] : '';
      });
      return obj;
    });

    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return _jsonResponse({ success: false, error: String(err) }, 500);
  }
}
