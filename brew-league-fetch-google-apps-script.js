// Brew League Data Fetch - Google Apps Script
// Deploy this as a web app with "Anyone" access to fetch brew league data

// Configuration
var CONFIG = {
  SHEET_NAME: 'Brew League - Region Round',
  HEADERS: [
    "Timestamp",
    "Participant Name",
    "Participant Emp ID",
    "Judge Name",
    "Judge ID",
    "Scoresheet Type",
    "Machine Type",
    "Store Name",
    "Store ID",
    "Region",
    "Total Score",
    "Max Score",
    "Percentage"
  ]
};

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check if first row contains headers or data
    // If first row starts with a date/timestamp, assume no headers
    var firstCell = data[0][0];
    var headers;
    var rows;
    
    // Check if first cell is a date or looks like a timestamp
    var hasHeaders = !(firstCell instanceof Date || 
                      (typeof firstCell === 'string' && firstCell.match(/^\d{4}-\d{2}-\d{2}/)) ||
                      (typeof firstCell === 'number' && firstCell > 40000)); // Excel date serial
    
    if (hasHeaders) {
      // Sheet has headers in first row
      headers = data[0];
      rows = data.slice(1);
    } else {
      // Sheet has no headers, use CONFIG.HEADERS
      headers = CONFIG.HEADERS;
      rows = data;
    }
    
    var jsonData = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
