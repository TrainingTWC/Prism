// Set this to the destination spreadsheet ID (leave as empty string to use bound spreadsheet)
const SHEET_ID = '';
// Default sheet/tab name to use
const SHEET_NAME = 'ManagementTraineeResponses';

// Whitelist of allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://192.168.120.219:3001',
  'http://192.168.120.219:3002'
];

// Define weights for MT Feedback Form (matches front-end)
const QUESTION_WEIGHTS = {
  Q1: 15,  // Overall Experience
  Q2: 10,  // Training Content
  Q3: 10,  // LMS Modules
  Q4: 5,   // Training Structure
  Q5: 10,  // Trainer Support
  Q6: 7,   // Store Manager
  Q7: 8,   // Area Manager Support
  Q8: 7,   // Workplace Culture
  Q9: 8,   // TWC Culture Understanding
  Q10: 12, // Buddy Trainer Confidence
  Q11: 8,  // Learning Application
  // Q12..Q16 are open text (weight 0)
  Q12: 0,
  Q13: 0,
  Q14: 0,
  Q15: 0,
  Q16: 0
};

function handleCORS(e) {
  const origin = e.parameter.origin || (e.headers && e.headers['Origin']);
  
  // Always allow if no origin (like direct script access) or origin is in whitelist
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);
  
  if (!isAllowed) {
    return {
      shouldHandle: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    };
  }
  
  return {
    shouldHandle: true,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Credentials': 'false'
    }
  };
}

function doGet(e) {
  try {
    const cors = handleCORS(e);
    if (!cors.shouldHandle) {
      return _jsonResponse({ success: false, error: 'Origin not allowed' }, 403, cors.headers);
    }

    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || '';
    
    if (action === 'getResponses') {
      return getFormResponsesFromSheet();
    }
    
    // Default response - service is running
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Management Trainee Forms logger is running',
        version: '1.0'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return _jsonResponse({ success: false, error: String(err) }, 500);
  }
}

function doPost(e) {
  try {
    const cors = handleCORS(e);
    if (!cors.shouldHandle) {
      return _jsonResponse({ success: false, error: 'Origin not allowed' }, 403, cors.headers);
    }

    // Get POST data
    var payloadText = e.postData && e.postData.contents ? e.postData.contents : '';
    if (!payloadText) {
      return _jsonResponse({ success: false, error: 'Empty request body' }, 400, cors.headers);
    }

    var parsed = JSON.parse(payloadText);
    
    // Basic validation
    if (!parsed.responses || !parsed.meta) {
      return _jsonResponse({ success: false, error: 'Invalid payload structure' }, 400, cors.headers);
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

    // Get active sheet or named sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (SHEET_ID && SHEET_ID.trim()) {
      ss = SpreadsheetApp.openById(SHEET_ID);
    }
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Build header: stable ordering including Q1..Q16
    var baseHeaders = [
      'Server Timestamp', 
      'Submission Time', 
      'Name', 
      'Store', 
      'AM', 
      'Trainer', 
      'FormTitle', 
      'FormVersion', 
      'TotalScore', 
      'MaxScore', 
      'Percent'
    ];
    var questionCols = [
      'Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10',
      'Q11','Q12','Q13','Q14','Q15','Q16'
    ];
    var header = baseHeaders.concat(questionCols);

    // Ensure header exists in sheet (first row)
    var firstRow = sheet.getLastColumn() > 0 ? 
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    var needsHeaderWrite = false;
    
    if (!firstRow || firstRow.length === 0 || firstRow[0] === '' ) {
      needsHeaderWrite = true;
    } else {
      // If some of our header columns are missing or different length, rewrite header
      if (firstRow.length !== header.length) needsHeaderWrite = true;
      else {
        for (var i = 0; i < header.length; i++) {
          if (String((firstRow[i] || '')).trim() !== String(header[i]).trim()) { 
            needsHeaderWrite = true; 
            break; 
          }
        }
      }
    }

    if (needsHeaderWrite) {
      if (sheet.getLastRow() > 0) sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }

    // Build row matching header
    var row = [
      new Date().toISOString(), // Server Timestamp
      submitTs,                 // Submission Time
      meta.name || '',
      meta.store || '',
      meta.am || '',
      meta.trainer || '',
      formTitle,
      formVersion,
      totalScore,
      maxScore,
      percent
    ];

    // Append question values in fixed Q1..Q16 order
    questionCols.forEach(function(qk) { 
      row.push(responses[qk] || ''); 
    });

    // Append the row
    sheet.appendRow(row);

    return _jsonResponse({ 
      success: true, 
      message: 'Form response logged successfully', 
      appendedAt: new Date().toISOString(), 
      totalScore: totalScore, 
      maxScore: maxScore, 
      percent: percent 
    }, 200, cors.headers);

  } catch (err) {
    return _jsonResponse({ 
      success: false, 
      error: String(err) 
    }, 500, cors.headers);
  }
}

function _jsonResponse(obj, status, headers) {
  var out = ContentService.createTextOutput(
    JSON.stringify(Object.assign({ status: status || 200 }, obj))
  );
  out.setMimeType(ContentService.MimeType.JSON);
  if (headers) {
    Object.keys(headers).forEach(function(h) { 
      out.setHeader(h, headers[h]); 
    });
  }
  return out;
}

function getFormResponsesFromSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (SHEET_ID && SHEET_ID.trim()) {
      ss = SpreadsheetApp.openById(SHEET_ID);
    }
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return _jsonResponse({ 
        success: false, 
        error: "Sheet '" + SHEET_NAME + "' not found" 
      }, 404);
    }

    var data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return _jsonResponse([], 200);
    }

    var headers = data[0];
    var rows = data.slice(1);

    var jsonData = rows.map(function(row) {
      var obj = {};
      // Map headers to values
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