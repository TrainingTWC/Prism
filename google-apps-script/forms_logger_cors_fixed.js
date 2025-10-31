// Set this to the destination spreadsheet ID (leave as empty string to use bound spreadsheet)
const SHEET_ID = '';
// Default sheet/tab name to use
const SHEET_NAME = 'ManagementTraineeResponses';

// Updated CORS settings to match existing deployment
function doOptions(e) {
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

// Weights for MT Feedback Form (matches front-end)
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
  Q12: 0, Q13: 0, Q14: 0, Q15: 0, Q16: 0  // Text responses
};

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Max-Age', '86400');
  response.setHeader('Access-Control-Allow-Credentials', 'false');
  return response;
}

function doGet(e) {
  var response = ContentService.createTextOutput();
  response = setCorsHeaders(response);

  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || '';
    
    if (action === 'getResponses') {
      return getFormResponsesFromSheet();
    }
    
    return response
      .setContent(JSON.stringify({ 
        success: true, 
        message: 'Management Trainee Forms logger is running',
        version: '1.1'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return response
      .setContent(JSON.stringify({ 
        success: false, 
        error: String(err),
        status: 500 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var response = ContentService.createTextOutput();
  response = setCorsHeaders(response);

  try {
    // Get POST data
    var payloadText = e.postData && e.postData.contents ? e.postData.contents : '';
    if (!payloadText) {
      return response
        .setContent(JSON.stringify({ 
          success: false, 
          error: 'Empty request body',
          status: 400 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var parsed = JSON.parse(payloadText);
    
    // Basic validation
    if (!parsed.responses || !parsed.meta) {
      return response
        .setContent(JSON.stringify({ 
          success: false, 
          error: 'Invalid payload structure',
          status: 400 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var formTitle = parsed.formTitle || 'Management Trainee Feedback Form';
    var formVersion = parsed.formVersion || 'v1.0';
    var meta = parsed.meta || {};
    var responses = parsed.responses || {};
    var submitTs = parsed.submit_ts || new Date().toISOString();

    // Compute weighted score server-side
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
    var percent = weightTotal > 0 ? Number((weightedSum / 5).toFixed(1)) : 0;

    // Get active sheet or named sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (SHEET_ID && SHEET_ID.trim()) {
      ss = SpreadsheetApp.openById(SHEET_ID);
    }
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Build header with stable ordering
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
    var questionCols = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10',
                       'Q11','Q12','Q13','Q14','Q15','Q16'];
    var header = baseHeaders.concat(questionCols);

    // Ensure header exists
    var firstRow = sheet.getLastColumn() > 0 ? 
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
      
    if (!firstRow || firstRow.length === 0 || firstRow[0] === '' ||
        firstRow.length !== header.length || 
        firstRow.some(function(h, i) { 
          return String((h||'')).trim() !== String(header[i]).trim(); 
        })) {
      if (sheet.getLastRow() > 0) sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }

    // Build and append row
    var row = [
      new Date().toISOString(),
      submitTs,
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

    questionCols.forEach(function(qk) { 
      row.push(responses[qk] || ''); 
    });

    sheet.appendRow(row);

    return response
      .setContent(JSON.stringify({ 
        success: true, 
        message: 'Form response logged successfully', 
        appendedAt: new Date().toISOString(), 
        totalScore: totalScore, 
        maxScore: maxScore, 
        percent: percent,
        status: 200
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return response
      .setContent(JSON.stringify({ 
        success: false, 
        error: String(err),
        status: 500 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getFormResponsesFromSheet() {
  var response = ContentService.createTextOutput();
  response = setCorsHeaders(response);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (SHEET_ID && SHEET_ID.trim()) {
      ss = SpreadsheetApp.openById(SHEET_ID);
    }
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return response
        .setContent(JSON.stringify({ 
          success: false, 
          error: "Sheet '" + SHEET_NAME + "' not found",
          status: 404 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return response
        .setContent(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];
    var rows = data.slice(1);
    var jsonData = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(h, idx) {
        var key = String(h || '').trim();
        if (!key) return;
        obj[key] = row[idx] !== undefined && row[idx] !== null ? row[idx] : '';
      });
      return obj;
    });

    return response
      .setContent(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return response
      .setContent(JSON.stringify({ 
        success: false, 
        error: String(err),
        status: 500 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}