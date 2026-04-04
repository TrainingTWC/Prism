/**
 * TRAINING CHECKLIST - GOOGLE APPS SCRIPT (UPDATED VERSION)
 * Updated with new training checklist fields as specified
 * 
 * TWO-SHEET ARCHITECTURE:
 * - "Training Audit" (All Data) — full historical archive, never pruned
 * - "Training Audit - Last 90 Days" — auto-pruned working sheet for fast dashboard reads
 * 
 * Setup: Run setupTrainingAudit() once from Apps Script editor to initialize.
 */

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
    
    // Try to find existing training sheet or create new one
    var possibleSheetNames = ['Training Audit', 'Training Checklist', 'TrainingAudit', 'Training'];
    var sheet = null;
    
    for (var i = 0; i < possibleSheetNames.length; i++) {
      sheet = ss.getSheetByName(possibleSheetNames[i]);
      if (sheet) {
        console.log('Using existing sheet: ' + possibleSheetNames[i]);
        break;
      }
    }
    
    if (!sheet) {
      sheet = ss.insertSheet('Training Audit');
      console.log('Created new sheet: Training Audit');
    }

    // Get store info from mapping
    var storeInfo = getStoreInfo(params.storeId || '');
    
    // Log all incoming parameters for debugging
    console.log('=== INCOMING PARAMETERS ===');
    console.log('Store ID: ' + (params.storeId || 'not provided'));
    console.log('Region from form: ' + (params.region || 'not provided'));
    console.log('MOD from form: ' + (params.mod || 'not provided'));
    console.log('Trainer Name from form: ' + (params.trainerName || 'not provided'));
    console.log('Trainer ID from form: ' + (params.trainerId || 'not provided'));
    console.log('AM Name from form: ' + (params.amName || 'not provided'));
    console.log('AM ID from form: ' + (params.amId || 'not provided'));
    
    // Log store mapping info
    console.log('=== STORE MAPPING INFO ===');
    console.log('Store Info Found: ' + JSON.stringify(storeInfo));
    
    // Log TSA scores received
    console.log('=== TSA SCORES RECEIVED ===');
    console.log('TSA_Food_Score: ' + (params.TSA_Food_Score || 'not provided'));
    console.log('TSA_Coffee_Score: ' + (params.TSA_Coffee_Score || 'not provided'));
    console.log('TSA_CX_Score: ' + (params.TSA_CX_Score || 'not provided'));
    console.log('TSA_Food_Score_remarks: ' + (params.TSA_Food_Score_remarks || 'not provided'));
    console.log('TSA_Coffee_Score_remarks: ' + (params.TSA_Coffee_Score_remarks || 'not provided'));
    console.log('TSA_CX_Score_remarks: ' + (params.TSA_CX_Score_remarks || 'not provided'));
    
    // IMPORTANT: Always use Store_mapping sheet as the ONLY source of truth for:
    // - Region
    // - Trainer Name and ID
    // - AM Name and ID
    
    // Auto-populate from store mapping - these override form values
    params.region = storeInfo.region || params.region || '';
    params.storeName = storeInfo.storeName || params.storeName || '';
    params.trainerName = storeInfo.trainerName || storeInfo.trainer || params.trainerName || '';
    params.trainerId = storeInfo.trainerId || params.trainerId || '';
    params.amName = storeInfo.amName || params.amName || '';
    params.amId = storeInfo.amId || params.amId || '';
    params.hrbpId = storeInfo.hrbpId || params.hrbpId || '';
    params.regionalHrId = storeInfo.regionalHrId || params.regionalHrId || '';
    params.hrHeadId = storeInfo.hrHeadId || params.hrHeadId || '';
    params.lmsHeadId = storeInfo.lmsHeadId || params.lmsHeadId || '';
    
    console.log('Region set from store mapping: ' + params.region);
    console.log('Trainer name set from store mapping: ' + params.trainerName);
    console.log('Trainer ID set from store mapping: ' + params.trainerId);
    console.log('AM name set from store mapping: ' + params.amName);
    console.log('AM ID set from store mapping: ' + params.amId);
    
    // MOD field MUST ONLY come from form input - never from store mapping
    // Keep original MOD value from form, do not override
    console.log('MOD field preserved from form input: ' + (params.mod || 'empty'));
    
    // Final logging
    console.log('=== FINAL VALUES ===');
    console.log('Final Region: ' + (params.region || 'not set'));
    console.log('Final MOD: ' + (params.mod || 'not set'));
    console.log('Final Trainer Name: ' + (params.trainerName || 'not set'));
    console.log('Final Trainer ID: ' + (params.trainerId || 'not set'));
    console.log('Final AM Name: ' + (params.amName || 'not set'));
    console.log('Final AM ID: ' + (params.amId || 'not set'));

    var header = [
      'Server Timestamp', 'Submission Time', 'Trainer Name', 'Trainer ID',
      'AM Name', 'AM ID', 'Store Name', 'Store ID', 'Region', 'MOD',
      'HRBP ID', 'Regional HR ID', 'HR Head ID', 'LMS Head ID',
      
      // Training Materials (TM_1 to TM_9)
      'TM_1', 'TM_2', 'TM_3', 'TM_4', 'TM_5', 'TM_6', 'TM_7', 'TM_8', 'TM_9',
      
      // LMS (LMS_1 to LMS_3)
      'LMS_1', 'LMS_2', 'LMS_3',
      
      // Buddy (Buddy_1 to Buddy_6)
      'Buddy_1', 'Buddy_2', 'Buddy_3', 'Buddy_4', 'Buddy_5', 'Buddy_6',
      
      // New Joiner (NJ_1 to NJ_7)
      'NJ_1', 'NJ_2', 'NJ_3', 'NJ_4', 'NJ_5', 'NJ_6', 'NJ_7',
      
      // Partner Knowledge (PK_1 to PK_7)
      'PK_1', 'PK_2', 'PK_3', 'PK_4', 'PK_5', 'PK_6', 'PK_7',
      
      // TSA Scores (TSA_1=Food, TSA_2=Coffee, TSA_3=CX) - captures 0/5/10
      'TSA_1', 'TSA_2', 'TSA_3',
      
      // Customer Experience (CX_1 to CX_9)
      'CX_1', 'CX_2', 'CX_3', 'CX_4', 'CX_5', 'CX_6', 'CX_7', 'CX_8', 'CX_9',
      
      // Action Plan (AP_1 to AP_3)
      'AP_1', 'AP_2', 'AP_3',
      
      // Section Remarks
      'TM_remarks', 'LMS_remarks', 'Buddy_remarks', 'NJ_remarks', 
      'PK_remarks', 'CX_remarks', 'AP_remarks',
      
      // Scoring
      'Total Score', 'Max Score', 'Percentage',
      
      // TSA Remarks (after percentage score)
      'TSA_Food_remarks', 'TSA_Coffee_remarks', 'TSA_CX_remarks',
      
      // NEW COLUMNS ADDED AFTER EXISTING DATA
      'Auditor Name', 'Auditor ID', 'Section Images'
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
      params.trainerName || '', params.trainerId || '',
      params.amName || '', params.amId || '',
      params.storeName || '', params.storeId || '',
      params.region || '', params.mod || '',
      params.hrbpId || '', params.regionalHrId || '', 
      params.hrHeadId || '', params.lmsHeadId || '',
      
      // Training Materials (TM_1 to TM_9)
      params.TM_1 || '', params.TM_2 || '', params.TM_3 || '',
      params.TM_4 || '', params.TM_5 || '', params.TM_6 || '',
      params.TM_7 || '', params.TM_8 || '', params.TM_9 || '',
      
      // LMS (LMS_1 to LMS_3)
      params.LMS_1 || '', params.LMS_2 || '', params.LMS_3 || '',
      
      // Buddy (Buddy_1 to Buddy_6)
      params.Buddy_1 || '', params.Buddy_2 || '', params.Buddy_3 || '',
      params.Buddy_4 || '', params.Buddy_5 || '', params.Buddy_6 || '',
      
      // New Joiner (NJ_1 to NJ_7)
      params.NJ_1 || '', params.NJ_2 || '', params.NJ_3 || '',
      params.NJ_4 || '', params.NJ_5 || '', params.NJ_6 || '', params.NJ_7 || '',
      
      // Partner Knowledge (PK_1 to PK_7)
      params.PK_1 || '', params.PK_2 || '', params.PK_3 || '',
      params.PK_4 || '', params.PK_5 || '', params.PK_6 || '', params.PK_7 || '',
      
      // TSA Scores (TSA_1=Food, TSA_2=Coffee, TSA_3=CX) - captures 0/5/10
      params.TSA_Food_Score || '', params.TSA_Coffee_Score || '', params.TSA_CX_Score || '',
      
      // Customer Experience (CX_1 to CX_9)
      params.CX_1 || '', params.CX_2 || '', params.CX_3 || '',
      params.CX_4 || '', params.CX_5 || '', params.CX_6 || '',
      params.CX_7 || '', params.CX_8 || '', params.CX_9 || '',
      
      // Action Plan (AP_1 to AP_3)
      params.AP_1 || '', params.AP_2 || '', params.AP_3 || '',
      
      // Section remarks
      params.TM_remarks || '', params.LMS_remarks || '',
      params.Buddy_remarks || '', params.NJ_remarks || '',
      params.PK_remarks || '', params.CX_remarks || '', params.AP_remarks || '',
      
      // Scoring
      params.totalScore || '', params.maxScore || '', params.percentage || '',
      
      // TSA Remarks (after percentage score)
      params.TSA_Food_remarks || '', params.TSA_Coffee_remarks || '', params.TSA_CX_remarks || '',
      
      // NEW COLUMNS ADDED AFTER EXISTING DATA
      params.auditorName || '', params.auditorId || '',
      
      // Section Images (stored as JSON string, truncated to stay within Sheets 50k char cell limit)
      (params.sectionImages || '').length > 49999 
        ? (params.sectionImages || '').substring(0, 49999) 
        : (params.sectionImages || '')
    ];

    sheet.appendRow(row);
    console.log('Row appended to main sheet successfully');
    // "Last 90 Days" sheet is formula-driven (FILTER) — no dual-write needed

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
      var source = params.source || 'recent'; // 'recent' = Last 90 Days, 'all' = full archive
      return getTrainingChecklistData(source);
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

function getTrainingChecklistData(source) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = null;
    
    // Default to "Last 90 Days" sheet for fast reads; fall back to full archive
    if (source === 'all') {
      // Explicitly requested full archive
      var possibleSheetNames = ['Training Audit', 'Training Checklist', 'TrainingAudit', 'Training'];
      for (var i = 0; i < possibleSheetNames.length; i++) {
        sheet = ss.getSheetByName(possibleSheetNames[i]);
        if (sheet) {
          console.log('Using full archive sheet: ' + possibleSheetNames[i]);
          break;
        }
      }
    } else {
      // Default: use Last 90 Days sheet for performance
      sheet = ss.getSheetByName('Training Audit - Last 90 Days');
      if (sheet) {
        console.log('Using Last 90 Days sheet for fast read');
      } else {
        // Fallback to main sheet if Last 90 Days doesn't exist yet
        console.log('Last 90 Days sheet not found, falling back to main sheet');
        var possibleSheetNames = ['Training Audit', 'Training Checklist', 'TrainingAudit', 'Training'];
        for (var i = 0; i < possibleSheetNames.length; i++) {
          sheet = ss.getSheetByName(possibleSheetNames[i]);
          if (sheet) {
            console.log('Fallback to sheet: ' + possibleSheetNames[i]);
            break;
          }
        }
      }
    }
    
    if (!sheet) {
      console.log('No training sheet found. Available sheets: ' + ss.getSheets().map(function(s) { return s.getName(); }).join(', '));
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
    
    // When source is 'recent', filter to last 90 days from today
    // This guarantees correctness even if cleanup hasn't run or we fell back to the main sheet
    if (source !== 'all') {
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      rows = rows.filter(function(row) {
        var ts = row[0]; // Server Timestamp (column 0)
        var rowDate = (ts instanceof Date) ? ts : new Date(ts);
        return !isNaN(rowDate.getTime()) && rowDate >= cutoff;
      });
      console.log('After 90-day filter: ' + rows.length + ' rows (cutoff: ' + cutoff.toISOString() + ')');
    }
    
    console.log('Processing ' + rows.length + ' data rows');
    console.log('Header row: ' + JSON.stringify(data[0]));
    if (rows.length > 0) {
      console.log('First data row: ' + JSON.stringify(rows[0]));
    }
    
    var jsonData = rows.map(function(row) {
      var obj = {};
      
      // Basic metadata
      obj.submissionTime = row[1] || '';
      obj.trainerName = row[2] || '';
      obj.trainerId = row[3] || '';
      obj.amName = row[4] || '';
      obj.amId = row[5] || '';
      obj.storeName = row[6] || '';
      obj.storeId = row[7] || '';
      obj.region = row[8] || '';
      obj.mod = row[9] || '';
      obj.hrbpId = row[10] || '';
      obj.regionalHrId = row[11] || '';
      obj.hrHeadId = row[12] || '';
      obj.lmsHeadId = row[13] || '';
      
      var colIndex = 14; // Starting after metadata columns
      
      // Training Materials (TM_1 to TM_9)
      for (var i = 1; i <= 9; i++) {
        obj['TM_' + i] = row[colIndex++] || '';
      }
      
      // LMS (LMS_1 to LMS_3)
      for (var i = 1; i <= 3; i++) {
        obj['LMS_' + i] = row[colIndex++] || '';
      }
      
      // Buddy (Buddy_1 to Buddy_6)
      for (var i = 1; i <= 6; i++) {
        obj['Buddy_' + i] = row[colIndex++] || '';
      }
      
      // New Joiner (NJ_1 to NJ_7)
      for (var i = 1; i <= 7; i++) {
        obj['NJ_' + i] = row[colIndex++] || '';
      }
      
      // Partner Knowledge (PK_1 to PK_7)
      for (var i = 1; i <= 7; i++) {
        obj['PK_' + i] = row[colIndex++] || '';
      }
      
      // TSA Scores (TSA_1=Food, TSA_2=Coffee, TSA_3=CX)
      obj.tsaFoodScore = row[colIndex++] || '';
      obj.tsaCoffeeScore = row[colIndex++] || '';
      obj.tsaCXScore = row[colIndex++] || '';
      
      // Customer Experience (CX_1 to CX_9)
      for (var i = 1; i <= 9; i++) {
        obj['CX_' + i] = row[colIndex++] || '';
      }
      
      // Action Plan (AP_1 to AP_3)
      for (var i = 1; i <= 3; i++) {
        obj['AP_' + i] = row[colIndex++] || '';
      }
      
      // Section remarks
      obj.TM_remarks = row[colIndex++] || '';
      obj.LMS_remarks = row[colIndex++] || '';
      obj.Buddy_remarks = row[colIndex++] || '';
      obj.NJ_remarks = row[colIndex++] || '';
      obj.PK_remarks = row[colIndex++] || '';
      obj.CX_remarks = row[colIndex++] || '';
      obj.AP_remarks = row[colIndex++] || '';
      
      // Scoring
      obj.totalScore = row[colIndex++] || '';
      obj.maxScore = row[colIndex++] || '';
      obj.percentageScore = row[colIndex++] || '';
      
      // TSA Remarks (after percentage score)
      obj.TSA_Food_remarks = row[colIndex++] || '';
      obj.TSA_Coffee_remarks = row[colIndex++] || '';
      obj.TSA_CX_remarks = row[colIndex++] || '';
      
      // NEW COLUMNS ADDED AFTER EXISTING DATA
      obj.auditorName = row[colIndex++] || '';
      obj.auditorId = row[colIndex++] || '';
      
      // Section Images (JSON string)
      obj.sectionImages = row[colIndex++] || '';
      
      return obj;
    });
    
    console.log('Returning ' + jsonData.length + ' processed records');
    console.log('Sample record: ' + JSON.stringify(jsonData[0] || {}));
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in getTrainingChecklistData: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Cache for store mapping data to avoid repeated sheet reads within the same execution
var storeMappingCache = null;

/**
 * Reads store mapping directly from the "Store_Mapping" sheet in the same spreadsheet.
 * This is the ONLY source of truth — no hardcoded data, no external URLs.
 *
 * Store_Mapping columns (26+):
 *  0: Store ID, 1: Store Name, 2: AM ID, 3: AM Name, 4: Region,
 *  5: HRBP 1 ID, 6: HRBP 1 Name, 7: HRBP 2 ID, 8: HRBP 2 Name, 9: HRBP 3 ID, 10: HRBP 3 Name,
 *  11: Trainer 1 ID, 12: Trainer 1 Name, 13: Trainer 2 ID, 14: Trainer 2 Name, 15: Trainer 3 ID, 16: Trainer 3 Name,
 *  17: Regional Trainer ID, 18: Regional Trainer Name,
 *  19: Regional HR ID, 20: Regional HR Name, 21: HR Head ID, 22: HR Head Name,
 *  23: Store Format, 24: Menu Type, 25: Price Group, 26: City
 */
function getStoreMapping() {
  // Return cached version if available (within same script execution)
  if (storeMappingCache) {
    return storeMappingCache;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Store_Mapping');

  if (!sheet) {
    console.log('ERROR: Store_Mapping sheet not found in this spreadsheet.');
    return {};
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    console.log('Store_Mapping sheet has no data rows.');
    return {};
  }

  var mappingObject = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var storeId = row[0] ? row[0].toString().trim() : '';
    if (!storeId) continue;

    mappingObject[storeId] = {
      storeName:      row[1]  ? row[1].toString().trim()  : '',
      amId:           row[2]  ? row[2].toString().trim()  : '',
      amName:         row[3]  ? row[3].toString().trim()  : '',
      region:         row[4]  ? row[4].toString().trim()  : '',
      hrbpId:         row[5]  ? row[5].toString().trim()  : '',
      hrbpName:       row[6]  ? row[6].toString().trim()  : '',
      trainerId:      row[11] ? row[11].toString().trim() : '',
      trainerName:    row[12] ? row[12].toString().trim() : '',
      trainer:        row[12] ? row[12].toString().trim() : '',
      regionalHrId:   row[19] ? row[19].toString().trim() : '',
      regionalHrName: row[20] ? row[20].toString().trim() : '',
      hrHeadId:       row[21] ? row[21].toString().trim() : '',
      hrHeadName:     row[22] ? row[22].toString().trim() : '',
      lmsHeadId:      ''  // Add to Store_Mapping sheet if needed
    };
  }

  storeMappingCache = mappingObject;
  console.log('Store mapping loaded from Store_Mapping sheet: ' + Object.keys(mappingObject).length + ' stores');
  return mappingObject;
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
    return { region: '', storeName: '', amId: '', amName: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '', trainerName: '' };
  }
  
  try {
    var mapping = getStoreMapping();
    var storeInfo = mapping[storeId];
    
    if (!storeInfo) {
      console.log('Store ID ' + storeId + ' not found in Store_Mapping sheet');
      return { region: 'Unknown', storeName: '', amId: '', amName: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '', trainerName: '' };
    }
    
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
      trainerName: storeInfo.trainerName || storeInfo.trainer || ''
    };
    
    console.log('Store info found for ' + storeId + ': ' + JSON.stringify(cleanStoreInfo));
    return cleanStoreInfo;
    
  } catch (error) {
    console.log('Error in getStoreInfo: ' + error.toString());
    return { region: 'Error', storeName: '', amId: '', amName: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '', trainerName: '' };
  }
}

// ============================================================
// TWO-SHEET ARCHITECTURE: Formula-Driven Last 90 Days
// ============================================================

/**
 * ONE-TIME SETUP: Run this from the Apps Script editor.
 * Creates (or resets) the "Training Audit - Last 90 Days" sheet with a single
 * FILTER formula that auto-pulls rows from the main sheet where the timestamp
 * is within the last 90 days.
 *
 * Benefits over the old Apps Script sync approach:
 *  - Instant / real-time — no triggers, no daily rebuild
 *  - Always in sync — every new row in the main sheet appears automatically
 *  - Zero maintenance — no dual-write, no cleanup jobs
 */
function setupTrainingAudit() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find the main sheet
  var possibleNames = ['Training Audit', 'Training Checklist', 'TrainingAudit', 'Training'];
  var mainSheet = null;
  for (var i = 0; i < possibleNames.length; i++) {
    mainSheet = ss.getSheetByName(possibleNames[i]);
    if (mainSheet) break;
  }
  if (!mainSheet) {
    console.log('ERROR: No main Training Audit sheet found. Nothing to set up.');
    return;
  }
  var mainName = mainSheet.getName();
  console.log('Main sheet found: ' + mainName);

  // Determine column range (e.g. A:BY for 77 columns)
  var lastCol = mainSheet.getLastColumn();
  var lastColLetter = columnToLetter(lastCol);
  console.log('Main sheet has ' + lastCol + ' columns (A-' + lastColLetter + ')');

  // Create or reset the Last 90 Days sheet
  var recentSheet = ss.getSheetByName('Training Audit - Last 90 Days');
  if (!recentSheet) {
    recentSheet = ss.insertSheet('Training Audit - Last 90 Days');
    console.log('Created new sheet: Training Audit - Last 90 Days');
  } else {
    recentSheet.clearContents();
    console.log('Cleared existing "Training Audit - Last 90 Days" sheet');
  }

  // Row 1: Copy the header from the main sheet
  var headerValues = mainSheet.getRange(1, 1, 1, lastCol).getValues();
  recentSheet.getRange(1, 1, 1, lastCol).setValues(headerValues);

  // Row 2, Cell A2: FILTER formula that auto-pulls last 90 days
  // References the main sheet dynamically — always up to date
  var formula = '=IFERROR(FILTER(\'' + mainName + '\'!A2:' + lastColLetter
    + ', \'' + mainName + '\'!A2:A >= TODAY()-90), "")';
  recentSheet.getRange(2, 1).setFormula(formula);

  // Remove any old cleanupOldData triggers (no longer needed)
  var triggers = ScriptApp.getProjectTriggers();
  for (var t = 0; t < triggers.length; t++) {
    if (triggers[t].getHandlerFunction() === 'cleanupOldData') {
      ScriptApp.deleteTrigger(triggers[t]);
      console.log('Removed old cleanupOldData trigger (no longer needed)');
    }
  }

  console.log('=== SETUP COMPLETE ===');
  console.log('• "Training Audit - Last 90 Days" is now formula-driven (FILTER)');
  console.log('• No triggers needed — data updates in real-time');
  console.log('• doPost writes to main sheet only; Last 90 Days auto-syncs');
  console.log('• Formula: ' + formula);
}

/**
 * Helper: convert a 1-based column number to a letter (1=A, 26=Z, 27=AA, etc.)
 */
function columnToLetter(col) {
  var letter = '';
  while (col > 0) {
    var mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - mod - 1) / 26);
  }
  return letter;
}
