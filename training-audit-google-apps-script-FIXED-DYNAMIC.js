/**
 * TRAINING AUDIT CHECKLIST - GOOGLE APPS SCRIPT (FIXED WITH DYNAMIC COLUMN READING)
 * Fixed: Dynamic column reading based on actual header names instead of hardcoded indices
 */

// Global cache variables
var storeMappingCache = null;
var cacheExpiry = null;
var CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    if (params.action === 'getData') {
      return getTrainingChecklistData();
    } else if (params.action === 'getStoreInfo' && params.storeId) {
      var storeInfo = getStoreInfo(params.storeId);
      return ContentService
        .createTextOutput(JSON.stringify(storeInfo))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getTrainingChecklistData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var possibleSheetNames = ['Training Audit', 'Training Checklist', 'TrainingAudit', 'Training'];
    var sheet = null;
    
    for (var i = 0; i < possibleSheetNames.length; i++) {
      sheet = ss.getSheetByName(possibleSheetNames[i]);
      if (sheet) {
        console.log('📚 Using sheet: ' + possibleSheetNames[i]);
        break;
      }
    }
    
    if (!sheet || sheet.getLastRow() < 2) {
      console.log('No training data found');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data including headers
    var range = sheet.getDataRange();
    var values = range.getValues();
    var headers = values[0];
    var dataRows = values.slice(1);
    
    console.log('📚 Total rows: ' + values.length);
    console.log('📚 Headers count: ' + headers.length);
    console.log('📚 First 30 headers: ' + headers.slice(0, 30).join(', '));
    
    // Build column map
    var columnMap = {};
    for (var i = 0; i < headers.length; i++) {
      var header = String(headers[i]).trim();
      if (header) {
        columnMap[header] = i;
      }
    }
    
    console.log('📚 Question columns found: ' + Object.keys(columnMap).filter(function(h) {
      return h.match(/^(TM|LMS|Buddy|NJ|PK|TSA)_/);
    }).length);
    
    // Convert to JSON
    var jsonData = dataRows.map(function(row, rowIndex) {
      // Skip empty rows
      var hasData = false;
      for (var i = 0; i < Math.min(10, row.length); i++) {
        if (row[i]) {
          hasData = true;
          break;
        }
      }
      if (!hasData) return null;
      
      var obj = {};
      
      // Basic metadata fields
      obj.submissionTime = row[columnMap['Submission Time'] || columnMap['submissionTime']] || '';
      obj.trainerName = row[columnMap['Trainer Name'] || columnMap['trainerName']] || '';
      obj.trainerId = row[columnMap['Trainer ID'] || columnMap['trainerId']] || '';
      obj.amName = row[columnMap['AM Name'] || columnMap['amName']] || '';
      obj.amId = row[columnMap['AM ID'] || columnMap['amId']] || '';
      obj.storeName = row[columnMap['Store Name'] || columnMap['storeName']] || '';
      obj.storeId = row[columnMap['Store ID'] || columnMap['storeId']] || '';
      obj.region = row[columnMap['Region'] || columnMap['region']] || '';
      obj.mod = row[columnMap['MOD'] || columnMap['mod']] || '';
      obj.hrbpId = row[columnMap['HRBP ID'] || columnMap['hrbpId']] || '';
      obj.regionalHrId = row[columnMap['Regional HR ID'] || columnMap['regionalHrId']] || '';
      obj.hrHeadId = row[columnMap['HR Head ID'] || columnMap['hrHeadId']] || '';
      obj.lmsHeadId = row[columnMap['LMS Head ID'] || columnMap['lmsHeadId']] || '';
      
      // Scoring fields
      obj.totalScore = row[columnMap['Total Score'] || columnMap['totalScore']] || '';
      obj.maxScore = row[columnMap['Max Score'] || columnMap['maxScore']] || '';
      obj.percentageScore = row[columnMap['Percentage Score'] || columnMap['Percentage'] || columnMap['percentageScore']] || '';
      
      // TSA Scores
      obj.tsaFoodScore = row[columnMap['TSA Food Score'] || columnMap['TSA_Food_Score'] || columnMap['tsaFoodScore']] || '';
      obj.tsaCoffeeScore = row[columnMap['TSA Coffee Score'] || columnMap['TSA_Coffee_Score'] || columnMap['tsaCoffeeScore']] || '';
      obj.tsaCXScore = row[columnMap['TSA CX Score'] || columnMap['TSA_CX_Score'] || columnMap['tsaCXScore']] || '';
      
      // Add ALL question responses dynamically based on column headers
      for (var header in columnMap) {
        // Match question patterns: TM_1, LMS_1, Buddy_1, NJ_1, PK_1, TSA_1, etc.
        if (header.match(/^(TM|LMS|Buddy|NJ|PK|TSA|CX|AP)_\d+$/)) {
          obj[header] = row[columnMap[header]] || '';
        }
        // Also capture section remarks
        if (header.match(/_(remarks|Remarks)$/)) {
          obj[header] = row[columnMap[header]] || '';
        }
      }
      
      // Debug log for first row
      if (rowIndex === 0) {
        console.log('📚 Sample row data:');
        console.log('  storeId: ' + obj.storeId);
        console.log('  totalScore: ' + obj.totalScore);
        console.log('  maxScore: ' + obj.maxScore);
        console.log('  percentageScore: ' + obj.percentageScore);
        console.log('  Question fields: ' + Object.keys(obj).filter(function(k) {
          return k.match(/^(TM|LMS|Buddy|NJ|PK|TSA)_\d+$/);
        }).length);
      }
      
      return obj;
    }).filter(function(obj) { return obj !== null; });
    
    console.log('✅ Returning ' + jsonData.length + ' training records');
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ Error in getTrainingChecklistData: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper functions for store mapping (abbreviated - include full versions from your existing script)
function getStoreInfo(storeId) {
  if (!storeId) {
    return { region: '', storeName: '', amId: '', amName: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '' };
  }
  
  try {
    var mapping = getStoreMapping();
    var storeInfo = mapping[storeId];
    
    if (!storeInfo) {
      return { region: 'Unknown', storeName: '', amId: '', amName: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '' };
    }
    
    return {
      region: storeInfo.region || 'Unknown',
      storeName: storeInfo.storeName || '',
      amId: storeInfo.amId || '',
      amName: storeInfo.amName || '',
      hrbpId: storeInfo.hrbpId || '',
      regionalHrId: storeInfo.regionalHrId || '',
      hrHeadId: storeInfo.hrHeadId || '',
      lmsHeadId: storeInfo.lmsHeadId || '',
      trainer: storeInfo.trainer || '',
      trainerId: storeInfo.trainerId || ''
    };
  } catch (error) {
    return { region: 'Error', storeName: '', amId: '', amName: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '' };
  }
}

function getStoreMapping() {
  if (storeMappingCache && cacheExpiry && new Date().getTime() < cacheExpiry) {
    return storeMappingCache;
  }
  
  try {
    var mappingUrls = [
      'https://raw.githubusercontent.com/TrainingTWC/Prism/main/public/comprehensive_store_mapping.json',
      'https://raw.githubusercontent.com/TrainingTWC/Prism/main/src/comprehensive_store_mapping.json'
    ];
    
    for (var i = 0; i < mappingUrls.length; i++) {
      try {
        var response = UrlFetchApp.fetch(mappingUrls[i], { method: 'GET', muteHttpExceptions: true });
        if (response.getResponseCode() === 200) {
          var jsonData = JSON.parse(response.getContentText());
          var mappingObject = {};
          
          for (var j = 0; j < jsonData.length; j++) {
            var store = jsonData[j];
            var storeId = store['Store ID'] || store['storeId'];
            if (storeId) {
              mappingObject[storeId] = {
                storeName: store['Store Name'] || store['storeName'] || '',
                amId: store['Area Manager ID'] || store['amId'] || '',
                amName: store['Area Manager'] || store['amName'] || '',
                hrbpId: store['HRBP ID'] || store['hrbpId'] || '',
                regionalHrId: store['Regional HR ID'] || store['regionalHrId'] || '',
                region: store['Region'] || store['region'] || '',
                hrHeadId: store['HR Head ID'] || store['hrHeadId'] || '',
                lmsHeadId: store['LMS Head ID'] || store['lmsHeadId'] || '',
                trainer: store['Trainer'] || store['trainer'] || '',
                trainerId: store['Trainer ID'] || store['trainerId'] || ''
              };
            }
          }
          
          storeMappingCache = mappingObject;
          cacheExpiry = new Date().getTime() + CACHE_DURATION;
          return mappingObject;
        }
      } catch (e) {
        continue;
      }
    }
    
    return {};
  } catch (error) {
    return {};
  }
}
