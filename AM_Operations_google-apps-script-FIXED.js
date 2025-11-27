/**
 * AM OPERATIONS CHECKLIST - GOOGLE APPS SCRIPT (COMPLETE FIXED VERSION)
 * Fixed: Dynamic column reading based on actual header names
 * Includes both doPost (for submissions) and doGet (for data retrieval)
 */

// Global cache variables
var storeMappingCache = null;
var cacheExpiry = null;
var CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    if (params.action === 'getData') {
      return getAMOperationsData();
    }
    return ContentService.createTextOutput('AM Operations API Ready');
  } catch (error) {
    console.error('Error in doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAMOperationsData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var possibleSheetNames = ['AM Ops Checklist', 'AM Operations', 'AMOpsChecklist', 'AM_Operations'];
    var sheet = null;
    
    for (var i = 0; i < possibleSheetNames.length; i++) {
      sheet = ss.getSheetByName(possibleSheetNames[i]);
      if (sheet) {
        console.log('Using sheet: ' + possibleSheetNames[i]);
        break;
      }
    }
    
    if (!sheet || sheet.getLastRow() < 2) {
      console.log('No data found in AM Operations sheet');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data including headers
    var range = sheet.getDataRange();
    var values = range.getValues();
    var headers = values[0]; // First row is headers
    var dataRows = values.slice(1); // Rest are data rows
    
    console.log('📊 Total rows: ' + values.length);
    console.log('📊 Headers count: ' + headers.length);
    console.log('📊 First 20 headers: ' + headers.slice(0, 20).join(', '));
    
    // Find column indices for key fields - Build a map
    var columnMap = {};
    for (var i = 0; i < headers.length; i++) {
      var header = String(headers[i]).trim();
      if (header) {
        columnMap[header] = i;
      }
    }
    
    console.log('📊 Looking for Percentage Score column...');
    console.log('📊 Available score-related columns: ' + Object.keys(columnMap).filter(function(h) { 
      return h.toLowerCase().indexOf('score') >= 0 || h.toLowerCase().indexOf('percent') >= 0; 
    }).join(', '));
    
    // Convert to JSON objects
    var jsonData = dataRows.map(function(row, rowIndex) {
      // Skip completely empty rows
      var hasData = false;
      for (var i = 0; i < Math.min(10, row.length); i++) {
        if (row[i]) {
          hasData = true;
          break;
        }
      }
      if (!hasData) return null;
      
      var obj = {};
      
      // Map each field dynamically
      obj.submissionTime = row[columnMap['Submission Time'] || columnMap['submissionTime']] || '';
      obj.hrName = row[columnMap['HR Name'] || columnMap['hrName']] || '';
      obj.hrId = row[columnMap['HR ID'] || columnMap['hrId']] || '';
      obj.amName = row[columnMap['AM Name'] || columnMap['amName']] || '';
      obj.amId = row[columnMap['AM ID'] || columnMap['amId']] || '';
      obj.trainerName = row[columnMap['Trainer Name'] || columnMap['trainerName']] || '';
      obj.trainerId = row[columnMap['Trainer ID'] || columnMap['trainerId']] || '';
      obj.storeName = row[columnMap['Store Name'] || columnMap['storeName']] || '';
      obj.storeId = row[columnMap['Store ID'] || columnMap['storeId']] || '';
      obj.region = row[columnMap['Region'] || columnMap['region']] || '';
      
      // Store mapping fields
      obj.menu = row[columnMap['Menu'] || columnMap['menu']] || '';
      obj.storeType = row[columnMap['Store Type'] || columnMap['storeType'] || columnMap['Café Type'] || columnMap['cafeType']] || '';
      obj.concept = row[columnMap['Concept'] || columnMap['concept']] || '';
      
      // BSC fields
      obj.bscAchievement = row[columnMap['BSC Achievement'] || columnMap['bscAchievement']] || '';
      obj.peopleOnShift = row[columnMap['People On Shift'] || columnMap['peopleOnShift'] || columnMap['No. of people on shift']] || '';
      obj.manpowerFulfilment = row[columnMap['Manpower Fulfilment'] || columnMap['manpowerFulfilment'] || columnMap['Man power fulfilment']] || '';
      
      // Scoring fields - Try all variations
      obj.totalScore = row[columnMap['Total Score'] || columnMap['totalScore']] || '';
      obj.maxScore = row[columnMap['Max Score'] || columnMap['maxScore']] || '';
      
      // CRITICAL: Try all possible column name variations for percentage
      var percentageValue = row[columnMap['Percentage Score']] || 
                           row[columnMap['Percentage']] || 
                           row[columnMap['percentage_score']] || 
                           row[columnMap['percentageScore']] ||
                           row[columnMap['Percentage Sco']] || // Truncated version
                           '';
      
      obj.percentageScore = String(percentageValue).trim();
      
      // Section scores
      obj.cgScore = row[columnMap['CG_Score'] || columnMap['CG Score']] || '';
      obj.otaScore = row[columnMap['OTA_Score'] || columnMap['OTA Score']] || '';
      obj.fasScore = row[columnMap['FAS_Score'] || columnMap['FAS Score']] || '';
      obj.fwsScore = row[columnMap['FWS_Score'] || columnMap['FWS Score']] || '';
      obj.enjScore = row[columnMap['ENJ_Score'] || columnMap['ENJ Score']] || '';
      obj.exScore = row[columnMap['EX_Score'] || columnMap['EX Score']] || '';
      
      // Additional fields
      obj.remarks = row[columnMap['Remarks'] || columnMap['remarks']] || '';
      obj.imageUpload = row[columnMap['Image Upload'] || columnMap['imageUpload']] || '';
      
      // Add all question responses dynamically
      for (var header in columnMap) {
        if (header.match(/^(CG|OTA|FAS|FWS|ENJ|EX)_\d+$/)) {
          obj[header] = row[columnMap[header]] || '';
        }
      }
      
      // Debug log for first row only
      if (rowIndex === 0) {
        console.log('📊 Sample row data:');
        console.log('  totalScore: ' + obj.totalScore);
        console.log('  maxScore: ' + obj.maxScore);
        console.log('  percentageScore: ' + obj.percentageScore);
        console.log('  storeId: ' + obj.storeId);
        console.log('  region: ' + obj.region);
      }
      
      return obj;
    }).filter(function(obj) { return obj !== null; });
    
    console.log('✅ Returning ' + jsonData.length + ' processed records');
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ Error in getAMOperationsData: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
