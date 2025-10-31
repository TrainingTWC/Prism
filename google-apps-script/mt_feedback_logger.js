/**
 * MANAGEMENT TRAINEE FEEDBACK FORM - GOOGLE APPS SCRIPT
 * Updated with CORS handling and new form structure
 */

// Add CORS handling for preflight requests
function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Origin",
    "Access-Control-Max-Age": "86400"
  };
  
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

function doPost(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  
  try {
    var params = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Try to find existing feedback sheet or create new one
    var sheetName = 'MT Feedback';
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      console.log('Created new sheet: ' + sheetName);
    }

    // Define header based on the form structure
    var header = [
      'Server Timestamp', 'Submission Time', 'Name', 'Store', 'AM', 'Trainer',
      'Form Title', 'Form Version',
      // Q1-Q11 (scored questions)
      'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11',
      // Q12-Q16 (text feedback)
      'Q12', 'Q13', 'Q14', 'Q15', 'Q16',
      // Scoring
      'Total Score', 'Max Score', 'Percent'
    ];

    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }

    var serverTimestamp = new Date();
    
    var row = [
      serverTimestamp,
      params.submit_ts || serverTimestamp.toISOString(),
      params.meta?.name || '',
      params.meta?.store || '',
      params.meta?.am || '',
      params.meta?.trainer || '',
      params.formTitle || '',
      params.formVersion || '',
      // Q1-Q11 (scored responses)
      params.responses?.Q1 || '',
      params.responses?.Q2 || '',
      params.responses?.Q3 || '',
      params.responses?.Q4 || '',
      params.responses?.Q5 || '',
      params.responses?.Q6 || '',
      params.responses?.Q7 || '',
      params.responses?.Q8 || '',
      params.responses?.Q9 || '',
      params.responses?.Q10 || '',
      params.responses?.Q11 || '',
      // Q12-Q16 (text feedback)
      params.responses?.Q12 || '',
      params.responses?.Q13 || '',
      params.responses?.Q14 || '',
      params.responses?.Q15 || '',
      params.responses?.Q16 || '',
      // Scoring
      params.totalScore || '',
      params.maxScore || '',
      params.percent || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        status: 200,
        message: 'Form submitted successfully' 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        status: 500,
        message: String(err) 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

function doGet(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('MT Feedback');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = data.slice(1);
    
    var jsonData = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) {
        obj[header] = row[i];
      });
      return obj;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}