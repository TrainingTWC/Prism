/**
 * FINANCE AUDIT - SIMPLIFIED DEBUGGING VERSION
 * Use this to test if the script receives data correctly
 */

// Configuration
const SHEET_NAME = 'Finance Audit';

// Main POST handler
function doPost(e) {
  try {
    // Log everything we receive
    Logger.log('=== INCOMING REQUEST ===');
    Logger.log('e.postData exists: ' + (e.postData ? 'YES' : 'NO'));
    Logger.log('e.parameter exists: ' + (e.parameter ? 'YES' : 'NO'));
    
    if (e.postData) {
      Logger.log('Content Type: ' + e.postData.type);
      Logger.log('Content Length: ' + e.postData.length);
      Logger.log('Raw contents (first 500 chars): ' + e.postData.contents.substring(0, 500));
    }
    
    // Parse JSON
    let data = {};
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
        Logger.log('✅ Successfully parsed JSON');
        Logger.log('Keys in data: ' + Object.keys(data).join(', '));
        Logger.log('financeAuditorName: ' + data.financeAuditorName);
        Logger.log('storeName: ' + data.storeName);
        Logger.log('Has images: ' + (data.images ? 'YES (' + Object.keys(data.images).length + ')' : 'NO'));
      } else {
        Logger.log('⚠️ No postData.contents found');
        data = e.parameter || {};
      }
    } catch (parseError) {
      Logger.log('❌ JSON Parse Error: ' + parseError.toString());
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'error',
          message: 'JSON parse failed: ' + parseError.toString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log('Creating new sheet: ' + SHEET_NAME);
      sheet = ss.insertSheet(SHEET_NAME);
      
      // Simple headers for testing
      const headers = [
        'Timestamp',
        'Submission Time',
        'Finance Auditor Name',
        'Finance Auditor ID',
        'AM Name',
        'AM ID',
        'Store Name',
        'Store ID',
        'Total Score',
        'Max Score',
        'Score %',
        'Sample Question 1',
        'Sample Question 1 Remarks',
        'Image Count'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Create a simple test row
    const timestamp = new Date();
    const formattedTimestamp = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    // Find first question response
    let firstQuestion = '';
    let firstRemarks = '';
    for (const key in data) {
      if (key.includes('_') && !key.includes('remarks') && !key.includes('images')) {
        firstQuestion = data[key];
        firstRemarks = data[key + '_remarks'] || '';
        break;
      }
    }
    
    const imageCount = data.images ? Object.keys(data.images).length : 0;
    
    const rowData = [
      formattedTimestamp,
      data.submissionTime || '',
      data.financeAuditorName || '',
      data.financeAuditorId || '',
      data.amName || '',
      data.amId || '',
      data.storeName || '',
      data.storeId || '',
      data.totalScore || '0',
      data.maxScore || '0',
      data.scorePercentage || '0',
      firstQuestion,
      firstRemarks,
      imageCount.toString()
    ];
    
    Logger.log('Writing row with ' + rowData.length + ' columns');
    sheet.appendRow(rowData);
    Logger.log('✅ Row written successfully');
    
    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Data logged successfully',
        timestamp: formattedTimestamp,
        rowsWritten: 1,
        imagesReceived: imageCount
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('❌ FATAL ERROR: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET handler for testing
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Finance Audit API is ACTIVE',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Manual test function
function testScript() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        submissionTime: '25/11/2025 14:30:00',
        financeAuditorName: 'Test Auditor',
        financeAuditorId: 'TEST001',
        amName: 'Test AM',
        amId: 'AM001',
        storeName: 'Test Store',
        storeId: 'S001',
        totalScore: 50,
        maxScore: 76,
        scorePercentage: 66,
        CashManagement_CM_1: 'yes',
        CashManagement_CM_1_remarks: 'Test remark',
        images: {}
      }),
      type: 'application/json',
      length: 200
    }
  };
  
  const result = doPost(testData);
  Logger.log('Test result: ' + result.getContent());
}
