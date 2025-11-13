/**
 * AM OPERATIONS CHECKLIST - GOOGLE APPS SCRIPT (CLEAN VERSION)
 * Fixed: Removed duplicate variable declarations
 * Updated to follow the same structure as training audit checklist
 * with comprehensive store mapping and auto-population
 */

// Global cache variables - declared once at the top
var storeMappingCache = null;
var cacheExpiry = null;
var CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function doPost(e) {
  try {
    // Try multiple ways to get parameters
    var params = {};
    
    // Method 1: Standard parameter object (works for URL-encoded form data)
    if (e && e.parameter) {
      params = e.parameter;
      console.log('Using e.parameter');
    }
    
    // Method 2: Parse postData if parameter is empty (fallback)
    if (Object.keys(params).length === 0 && e && e.postData && e.postData.contents) {
      console.log('Parsing from e.postData.contents');
      var contents = e.postData.contents;
      var pairs = contents.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        if (pair.length === 2) {
          params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
      }
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Log all incoming parameters for debugging
    console.log('=== ALL INCOMING PARAMETERS ===');
    console.log('Total parameter keys: ' + Object.keys(params).length);
    for (var key in params) {
      console.log(key + ': ' + params[key]);
    }
    
    // Try to find existing AM Operations sheet or create new one
    var possibleSheetNames = ['AM Ops Checklist', 'AM Operations', 'AMOpsChecklist', 'AM_Operations'];
    var sheet = null;
    
    for (var i = 0; i < possibleSheetNames.length; i++) {
      sheet = ss.getSheetByName(possibleSheetNames[i]);
      if (sheet) {
        console.log('Using existing sheet: ' + possibleSheetNames[i]);
        break;
      }
    }
    
    if (!sheet) {
      sheet = ss.insertSheet('AM Ops Checklist');
      console.log('Created new sheet: AM Ops Checklist');
    }

    // Get store info from mapping
    var storeInfo = getStoreInfo(params.storeId || '');
    
    // Log all incoming parameters for debugging
    console.log('=== INCOMING PARAMETERS ===');
    console.log('Store ID: ' + (params.storeId || 'not provided'));
    console.log('Region from form: ' + (params.region || 'not provided'));
    console.log('HR Name from form: ' + (params.hrName || 'not provided'));
    console.log('HR ID from form: ' + (params.hrId || 'not provided'));
    console.log('AM Name from form: ' + (params.amName || 'not provided'));
    console.log('AM ID from form: ' + (params.amId || 'not provided'));
    console.log('Trainer Name from form: ' + (params.trainerName || 'not provided'));
    console.log('Trainer ID from form: ' + (params.trainerId || 'not provided'));
    
    // Log store mapping info
    console.log('=== STORE MAPPING INFO ===');
    console.log('Store Info Found: ' + JSON.stringify(storeInfo));
    
    // Auto-populate region from store mapping
    if (storeInfo.region) {
      params.region = storeInfo.region;
      console.log('Region set from store mapping: ' + params.region);
    } else {
      console.log('No region found in store mapping, keeping form value: ' + (params.region || 'empty'));
    }
    
    // Auto-populate other store-related fields from mapping
    params.storeName = storeInfo.storeName || params.storeName || '';
    params.amId = storeInfo.amId || params.amId || '';
    params.amName = storeInfo.amName || params.amName || '';
    params.hrbpId = storeInfo.hrbpId || params.hrbpId || '';
    params.regionalHrId = storeInfo.regionalHrId || params.regionalHrId || '';
    params.hrHeadId = storeInfo.hrHeadId || params.hrHeadId || '';
    params.lmsHeadId = storeInfo.lmsHeadId || params.lmsHeadId || '';
    params.regionalTrainingManager = storeInfo.regionalTrainingManager || params.regionalTrainingManager || '';
    
    // Auto-populate trainer info from mapping if not provided by form
    if (!params.trainerName && storeInfo.trainer) {
      params.trainerName = storeInfo.trainer;
      console.log('Trainer name set from store mapping: ' + params.trainerName);
    }
    if (!params.trainerId && storeInfo.trainerId) {
      params.trainerId = storeInfo.trainerId;
      console.log('Trainer ID set from store mapping: ' + params.trainerId);
    }
    
    // Final logging
    console.log('=== FINAL VALUES ===');
    console.log('Final Region: ' + (params.region || 'not set'));
    console.log('Final AM Name: ' + (params.amName || 'not set'));
    console.log('Final AM ID: ' + (params.amId || 'not set'));
    console.log('Final Trainer Name: ' + (params.trainerName || 'not set'));
    console.log('Final Trainer ID: ' + (params.trainerId || 'not set'));
    console.log('Final Regional Training Manager: ' + (params.regionalTrainingManager || 'not set'));

    var header = [
      'Server Timestamp', 'Submission Time', 
      'HR Name', 'HR ID',
      'AM Name', 'AM ID',
      'Trainer Name', 'Trainer ID',
      'Store Name', 'Store ID', 'Region',
      'BSC Achievement', 'No. of people on shift', 'Man power fulfilment', 'Café Type', 'Store Type', 'Concept',
      
      // Customer Greeting (CG) - Questions 1-13
      'CG_1', 'CG_2', 'CG_3', 'CG_4', 'CG_5', 'CG_6', 'CG_7', 'CG_8', 'CG_9', 'CG_10', 'CG_11', 'CG_12', 'CG_13',
      
      // On-Time Arrival (OTA) - Questions 101-111
      'OTA_101', 'OTA_102', 'OTA_103', 'OTA_104', 'OTA_105', 'OTA_106', 'OTA_107', 'OTA_108', 'OTA_109', 'OTA_110', 'OTA_111',
      
      // Food and Safety (FAS) - Questions 201-213
      'FAS_201', 'FAS_202', 'FAS_203', 'FAS_204', 'FAS_205', 'FAS_206', 'FAS_207', 'FAS_208', 'FAS_209', 'FAS_210', 'FAS_211', 'FAS_212', 'FAS_213',
      
      // Formal Work Standards (FWS) - Questions 301-313
      'FWS_301', 'FWS_302', 'FWS_303', 'FWS_304', 'FWS_305', 'FWS_306', 'FWS_307', 'FWS_308', 'FWS_309', 'FWS_310', 'FWS_311', 'FWS_312', 'FWS_313',
      
      // Engagement (ENJ) - Questions 401-407
      'ENJ_401', 'ENJ_402', 'ENJ_403', 'ENJ_404', 'ENJ_405', 'ENJ_406', 'ENJ_407',
      
      // Excellence (EX) - Questions 501-506
      'EX_501', 'EX_502', 'EX_503', 'EX_504', 'EX_505', 'EX_506',
      
      // Section Remarks
      'CG_remarks', 'OTA_remarks', 'FAS_remarks', 'FWS_remarks', 'ENJ_remarks', 'EX_remarks',
      
      // Additional Fields
      'Remarks',
      'Image Upload',
      
      // Scoring
      'Total Score', 'Max Score', 'Percentage',
      'CG_Score', 'OTA_Score', 'FAS_Score', 'FWS_Score', 'ENJ_Score', 'EX_Score'
    ];

    // Ensure header row exists
    var needHeader = false;
    if (sheet.getLastRow() === 0) {
      needHeader = true;
    } else {
      var firstRow = sheet.getRange(1, 1, 1, header.length).getValues()[0] || [];
      if (firstRow.length !== header.length) {
        needHeader = true;
      }
    }
    if (needHeader) {
      if (sheet.getLastRow() > 0) sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }

    var serverTimestamp = new Date();
    var submissionTime = params.submissionTime || serverTimestamp.toISOString();
    
    var row = [
      serverTimestamp, submissionTime,
      params.hrName || '', params.hrId || '',
      params.amName || '', params.amId || '',
      params.trainerName || '', params.trainerId || '',
      params.storeName || '', params.storeId || '',
      params.region || '',
      params.bscAchievement || '', params.peopleOnShift || '', 
      params.manpowerFulfilment || '', params.cafeType || '',
      params.storeType || '', params.concept || '',
      
      // Customer Greeting (CG) - Questions 1-13
      params.CG_1 || '', params.CG_2 || '', params.CG_3 || '',
      params.CG_4 || '', params.CG_5 || '', params.CG_6 || '',
      params.CG_7 || '', params.CG_8 || '', params.CG_9 || '',
      params.CG_10 || '', params.CG_11 || '', params.CG_12 || '', params.CG_13 || '',
      
      // On-Time Arrival (OTA) - Questions 101-111
      params.OTA_101 || '', params.OTA_102 || '', params.OTA_103 || '',
      params.OTA_104 || '', params.OTA_105 || '', params.OTA_106 || '',
      params.OTA_107 || '', params.OTA_108 || '', params.OTA_109 || '',
      params.OTA_110 || '', params.OTA_111 || '',
      
      // Food and Safety (FAS) - Questions 201-213
      params.FAS_201 || '', params.FAS_202 || '', params.FAS_203 || '',
      params.FAS_204 || '', params.FAS_205 || '', params.FAS_206 || '',
      params.FAS_207 || '', params.FAS_208 || '', params.FAS_209 || '',
      params.FAS_210 || '', params.FAS_211 || '', params.FAS_212 || '', params.FAS_213 || '',
      
      // Formal Work Standards (FWS) - Questions 301-313
      params.FWS_301 || '', params.FWS_302 || '', params.FWS_303 || '',
      params.FWS_304 || '', params.FWS_305 || '', params.FWS_306 || '',
      params.FWS_307 || '', params.FWS_308 || '', params.FWS_309 || '',
      params.FWS_310 || '', params.FWS_311 || '', params.FWS_312 || '', params.FWS_313 || '',
      
      // Engagement (ENJ) - Questions 401-407
      params.ENJ_401 || '', params.ENJ_402 || '', params.ENJ_403 || '',
      params.ENJ_404 || '', params.ENJ_405 || '', params.ENJ_406 || '', params.ENJ_407 || '',
      
      // Excellence (EX) - Questions 501-506
      params.EX_501 || '', params.EX_502 || '', params.EX_503 || '',
      params.EX_504 || '', params.EX_505 || '', params.EX_506 || '',
      
      // Section remarks
      params.CG_remarks || '', params.OTA_remarks || '',
      params.FAS_remarks || '', params.FWS_remarks || '',
      params.ENJ_remarks || '', params.EX_remarks || '',
      
      // Additional Fields
      params.remarks || '',
      params.imageUpload || '',
      
      // Scoring
      params.totalScore || '', params.maxScore || '', params.percentage || '',
      params.cgScore || '', params.otaScore || '', params.fasScore || '',
      params.fwsScore || '', params.enjScore || '', params.exScore || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'OK' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    if (params.action === 'getData') {
      return getAMOperationsData();
    } else if (params.action === 'getStoreInfo' && params.storeId) {
      // Provide store info to frontend for auto-population
      var storeInfo = getStoreInfo(params.storeId);
      console.log('Providing store info for ' + params.storeId + ': ' + JSON.stringify(storeInfo));
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

function getAMOperationsData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Try multiple possible sheet names
    var possibleSheetNames = ['AM Ops Checklist', 'AM Operations', 'AMOpsChecklist', 'AM_Operations'];
    var sheet = null;
    
    for (var i = 0; i < possibleSheetNames.length; i++) {
      sheet = ss.getSheetByName(possibleSheetNames[i]);
      if (sheet) {
        console.log('Found sheet: ' + possibleSheetNames[i]);
        break;
      }
    }
    
    if (!sheet) {
      console.log('No AM Operations sheet found. Available sheets: ' + ss.getSheets().map(function(s) { return s.getName(); }).join(', '));
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    console.log('Sheet found: ' + sheet.getName() + ', Rows: ' + data.length);
    
    if (data.length <= 1) {
      console.log('No data rows found (only header or empty sheet)');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var rows = data.slice(1);
    console.log('Processing ' + rows.length + ' data rows');
    console.log('Header row: ' + JSON.stringify(data[0]));
    if (rows.length > 0) {
      console.log('First data row: ' + JSON.stringify(rows[0]));
    }
    
    var jsonData = rows.map(function(row) {
      var obj = {};
      
      // Basic metadata
      obj.submissionTime = row[1] || '';
      obj.hrName = row[2] || '';
      obj.hrId = row[3] || '';
      obj.amName = row[4] || '';
      obj.amId = row[5] || '';
      obj.trainerName = row[6] || '';
      obj.trainerId = row[7] || '';
      obj.storeName = row[8] || '';
      obj.storeId = row[9] || '';
      obj.region = row[10] || '';
      obj.bscAchievement = row[11] || '';
      obj.peopleOnShift = row[12] || '';
      obj.manpowerFulfilment = row[13] || '';
      obj.cafeType = row[14] || '';
      obj.storeType = row[15] || '';
      obj.concept = row[16] || '';
      
      var colIndex = 17; // Starting after metadata columns
      
      // Customer Greeting (CG) - Questions 1-13
      for (var i = 1; i <= 13; i++) {
        obj['CG_' + i] = row[colIndex++] || '';
      }
      
      // On-Time Arrival (OTA) - Questions 101-111
      for (var i = 101; i <= 111; i++) {
        obj['OTA_' + i] = row[colIndex++] || '';
      }
      
      // Food and Safety (FAS) - Questions 201-213
      for (var i = 201; i <= 213; i++) {
        obj['FAS_' + i] = row[colIndex++] || '';
      }
      
      // Formal Work Standards (FWS) - Questions 301-313
      for (var i = 301; i <= 313; i++) {
        obj['FWS_' + i] = row[colIndex++] || '';
      }
      
      // Engagement (ENJ) - Questions 401-407
      for (var i = 401; i <= 407; i++) {
        obj['ENJ_' + i] = row[colIndex++] || '';
      }
      
      // Excellence (EX) - Questions 501-506
      for (var i = 501; i <= 506; i++) {
        obj['EX_' + i] = row[colIndex++] || '';
      }
      
      // Section remarks
      obj.CG_remarks = row[colIndex++] || '';
      obj.OTA_remarks = row[colIndex++] || '';
      obj.FAS_remarks = row[colIndex++] || '';
      obj.FWS_remarks = row[colIndex++] || '';
      obj.ENJ_remarks = row[colIndex++] || '';
      obj.EX_remarks = row[colIndex++] || '';
      
      // Additional Fields
      obj.remarks = row[colIndex++] || '';
      obj.imageUpload = row[colIndex++] || '';
      
      // Scoring
      obj.totalScore = row[colIndex++] || '';
      obj.maxScore = row[colIndex++] || '';
      obj.percentageScore = row[colIndex++] || '';
      obj.cgScore = row[colIndex++] || '';
      obj.otaScore = row[colIndex++] || '';
      obj.fasScore = row[colIndex++] || '';
      obj.fwsScore = row[colIndex++] || '';
      obj.enjScore = row[colIndex++] || '';
      obj.exScore = row[colIndex++] || '';
      
      return obj;
    });
    
    console.log('Returning ' + jsonData.length + ' processed records');
    console.log('Sample record: ' + JSON.stringify(jsonData[0] || {}));
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in getAMOperationsData: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getStoreMapping() {
  // Check if cache is valid (less than 30 minutes old)
  if (storeMappingCache && cacheExpiry && new Date().getTime() < cacheExpiry) {
    return storeMappingCache;
  }
  
  try {
    // Try multiple possible URLs for the store mapping
    var mappingUrls = [
      'https://raw.githubusercontent.com/TrainingTWC/Prism/main/public/comprehensive_store_mapping.json',
      'https://raw.githubusercontent.com/TrainingTWC/Prism/main/src/comprehensive_store_mapping.json',
      'https://raw.githubusercontent.com/TrainingTWC/hr-connect-dashboard/main/public/comprehensive_store_mapping.json',
      'https://raw.githubusercontent.com/TrainingTWC/hr-connect-dashboard/main/public/hr_mapping.json',
    ];
    
    var response = null;
    
    // Try each URL until one works
    for (var i = 0; i < mappingUrls.length; i++) {
      try {
        console.log('Trying to fetch store mapping from: ' + mappingUrls[i]);
        response = UrlFetchApp.fetch(mappingUrls[i], {
          method: 'GET',
          muteHttpExceptions: true
        });
        
        if (response.getResponseCode() === 200) {
          console.log('Successfully fetched from: ' + mappingUrls[i]);
          break;
        } else {
          console.log('Failed to fetch from ' + mappingUrls[i] + ': HTTP ' + response.getResponseCode());
        }
      } catch (e) {
        console.log('Exception fetching from URL ' + mappingUrls[i] + ': ' + e.toString());
        continue;
      }
    }
    
    if (!response || response.getResponseCode() !== 200) {
      console.log('All external mapping URLs failed, using fallback data');
      throw new Error('All mapping URLs failed - will use fallback');
    }
    
    var jsonData = JSON.parse(response.getContentText());
    console.log('Successfully parsed JSON data with ' + jsonData.length + ' records');
    
    // Transform the array format to object format for easy lookup
    var mappingObject = {};
    for (var j = 0; j < jsonData.length; j++) {
      var store = jsonData[j];
      // Handle both possible field name formats
      var storeId = store['Store ID'] || store['storeId'] || store['store_id'];
      if (storeId) {
        mappingObject[storeId] = {
          storeName: store['Store Name'] || store['locationName'] || store['store_name'] || '',
          amId: store['Area Manager ID'] || store['areaManagerId'] || store['area_manager_id'] || '',
          amName: store['Area Manager'] || store['areaManager'] || store['area_manager'] || '',
          hrbpId: store['HRBP ID'] || store['hrbpId'] || store['hrbp_id'] || '',
          regionalHrId: store['Regional HR ID'] || store['regionalHrId'] || store['regional_hr_id'] || '',
          region: store['Region'] || store['region'] || '',
          hrHeadId: store['HR Head ID'] || store['hrHeadId'] || store['hr_head_id'] || '',
          lmsHeadId: store['LMS Head ID'] || store['lmsHeadId'] || store['lms_head_id'] || '',
          trainer: store['Trainer'] || store['trainer'] || '',
          trainerId: store['Trainer ID'] || store['trainerId'] || store['trainer_id'] || '',
          regionalTrainingManager: store['Regional Training Manager'] || store['regionalTrainingManager'] || store['regional_training_manager'] || ''
        };
      }
    }
    
    // Update cache
    storeMappingCache = mappingObject;
    cacheExpiry = new Date().getTime() + CACHE_DURATION;
    
    console.log('Successfully loaded ' + Object.keys(mappingObject).length + ' store mappings from external source');
    return mappingObject;
    
  } catch (error) {
    console.log('Failed to fetch external store mapping, using fallback: ' + error.toString());
    
    // Fallback to minimal essential mappings for immediate functionality
    return getFallbackStoreMapping();
  }
}

// Fallback function for essential store mappings in case external API fails
function getFallbackStoreMapping() {
  console.log('Using fallback store mapping with essential store data');
  var fallbackMapping = {
    // North Region Stores - Essential mappings
    'S192': {storeName: 'Bhutani City Centre Noida', amId: 'H1766', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595', amName: 'Arvind Singh', regionalTrainingManager: 'Hema'},
    'S027': {storeName: 'Defence Colony', amId: 'H1766', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595', amName: 'Arvind Singh', regionalTrainingManager: 'Hema'},
    
    // South Region Stores
    'S053': {storeName: 'TWC-Varthur', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697', amName: 'Kishore Kumar', regionalTrainingManager: 'Mahadev'},
    'S032': {storeName: 'TWC-Brookfield', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697', amName: 'Kishore Kumar', regionalTrainingManager: 'Mahadev'},
    
    // West Region Stores  
    'S096': {storeName: 'Mahavir Nagar', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278', amName: 'Brijesh Kumar', regionalTrainingManager: 'Priyanka'},
    'S088': {storeName: 'Kandivali Thakur Village', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278', amName: 'Brijesh Kumar', regionalTrainingManager: 'Priyanka'},
  };
  
  console.log('Fallback mapping contains ' + Object.keys(fallbackMapping).length + ' stores');
  return fallbackMapping;
}

function detectRegionFromStoreId(storeId) {
  if (!storeId) return 'Unknown';
  var mapping = getStoreMapping();
  return mapping[storeId] ? mapping[storeId].region : 'Unknown';
}

function getStoreInfo(storeId) {
  console.log('=== getStoreInfo called ===');
  console.log('Store ID requested: ' + storeId);
  
  if (!storeId) {
    console.log('No storeId provided, returning empty object');
    return { 
      region: '', storeName: '', amId: '', amName: '', 
      hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', 
      trainer: '', trainerId: '', regionalTrainingManager: '' 
    };
  }
  
  try {
    var mapping = getStoreMapping();
    console.log('Available store IDs in mapping: ' + Object.keys(mapping).slice(0, 10).join(', ') + '...');
    
    var storeInfo = mapping[storeId];
    
    if (!storeInfo) {
      console.log('Store ID ' + storeId + ' not found in mapping');
      console.log('Checking for similar store IDs...');
      var similarStores = Object.keys(mapping).filter(function(id) {
        return id.indexOf(storeId) !== -1 || storeId.indexOf(id) !== -1;
      });
      if (similarStores.length > 0) {
        console.log('Similar store IDs found: ' + similarStores.join(', '));
      }
      return { 
        region: 'Unknown', storeName: '', amId: '', amName: '', 
        hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', 
        trainer: '', trainerId: '', regionalTrainingManager: '' 
      };
    }
    
    // Ensure we return a clean object with all expected fields
    var cleanStoreInfo = {
      region: storeInfo.region || 'Unknown',
      storeName: storeInfo.storeName || '',
      amId: storeInfo.amId || '',
      amName: storeInfo.amName || '',
      hrbpId: storeInfo.hrbpId || '',
      regionalHrId: storeInfo.regionalHrId || '',
      hrHeadId: storeInfo.hrHeadId || '',
      lmsHeadId: storeInfo.lmsHeadId || '',
      trainer: storeInfo.trainer || '',
      trainerId: storeInfo.trainerId || '',
      regionalTrainingManager: storeInfo.regionalTrainingManager || ''
    };
    
    console.log('Store info found for ' + storeId + ': ' + JSON.stringify(cleanStoreInfo));
    return cleanStoreInfo;
    
  } catch (error) {
    console.log('Error in getStoreInfo: ' + error.toString());
    return { 
      region: 'Error', storeName: '', amId: '', amName: '', 
      hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', 
      trainer: '', trainerId: '', regionalTrainingManager: '' 
    };
  }
}
