/**
 * DIAGNOSTIC SCRIPT - Use this to see your actual column structure
 * Deploy this temporarily to see what columns your sheet actually has
 */

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    if (params.action === 'getData') {
      return getDiagnosticData();
    }
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Use ?action=getData' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getDiagnosticData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Try multiple possible sheet names
    var possibleSheetNames = ['AM Ops Checklist', 'AM Operations', 'AMOpsChecklist', 'AM_Operations'];
    var sheet = null;
    
    for (var i = 0; i < possibleSheetNames.length; i++) {
      sheet = ss.getSheetByName(possibleSheetNames[i]);
      if (sheet) {
        break;
      }
    }
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          error: 'No sheet found',
          availableSheets: ss.getSheets().map(function(s) { return s.getName(); })
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          error: 'No data rows',
          headers: data[0]
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Return diagnostic info
    var diagnostic = {
      sheetName: sheet.getName(),
      totalRows: data.length,
      totalColumns: data[0].length,
      headers: data[0],
      firstDataRow: data[1],
      columnMapping: {}
    };
    
    // Create a mapping of column index to header name and first value
    for (var col = 0; col < data[0].length; col++) {
      diagnostic.columnMapping['Column_' + col + '_(' + String.fromCharCode(65 + col) + ')'] = {
        header: data[0][col],
        firstValue: data[1][col]
      };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(diagnostic, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'ERROR', 
        message: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
