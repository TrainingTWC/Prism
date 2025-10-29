/**
 * TRAINING CHECKLIST - GOOGLE APPS SCRIPT (UPDATED VERSION)
 * Updated with new training checklist fields as specified
 */

function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
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
    
    // Log store mapping info
    console.log('=== STORE MAPPING INFO ===');
    console.log('Store Info Found: ' + JSON.stringify(storeInfo));
    
    // Auto-populate ONLY region from store mapping - MOD must remain user input
    if (storeInfo.region) {
      params.region = storeInfo.region;
      console.log('Region set from store mapping: ' + params.region);
    } else {
      console.log('No region found in store mapping, keeping form value: ' + (params.region || 'empty'));
    }
    
    // Auto-populate other store-related fields from mapping
    params.storeName = storeInfo.storeName || params.storeName || '';
    params.amId = storeInfo.amId || params.amId || '';
    params.hrbpId = storeInfo.hrbpId || params.hrbpId || '';
    params.regionalHrId = storeInfo.regionalHrId || params.regionalHrId || '';
    params.hrHeadId = storeInfo.hrHeadId || params.hrHeadId || '';
    params.lmsHeadId = storeInfo.lmsHeadId || params.lmsHeadId || '';
    
    // Auto-populate trainer info from mapping if not provided by form
    if (!params.trainerName && storeInfo.trainer) {
      params.trainerName = storeInfo.trainer;
      console.log('Trainer name set from store mapping: ' + params.trainerName);
    }
    if (!params.trainerId && storeInfo.trainerId) {
      params.trainerId = storeInfo.trainerId;
      console.log('Trainer ID set from store mapping: ' + params.trainerId);
    }
    
    // MOD field MUST ONLY come from form input - never from store mapping
    // Keep original MOD value from form, do not override
    console.log('MOD field preserved from form input: ' + (params.mod || 'empty'));
    
    // Final logging
    console.log('=== FINAL VALUES ===');
    console.log('Final Region: ' + (params.region || 'not set'));
    console.log('Final MOD: ' + (params.mod || 'not set'));
    console.log('Final Trainer Name: ' + (params.trainerName || 'not set'));
    console.log('Final Trainer ID: ' + (params.trainerId || 'not set'));

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
      
      // Training Store Audit Scores (TSA Food, Coffee, CX)
      'TSA_Food_Score', 'TSA_Coffee_Score', 'TSA_CX_Score',
      
      // Customer Experience (CX_1 to CX_9)
      'CX_1', 'CX_2', 'CX_3', 'CX_4', 'CX_5', 'CX_6', 'CX_7', 'CX_8', 'CX_9',
      
      // Action Plan (AP_1 to AP_3)
      'AP_1', 'AP_2', 'AP_3',
      
      // Non-TSA Section Remarks
      'TM_remarks', 'LMS_remarks', 'Buddy_remarks', 'NJ_remarks', 
      'PK_remarks', 'CX_remarks', 'AP_remarks',
      
      // Scoring
      'Total Score', 'Max Score', 'Percentage',
      
      // TSA Remarks (moved to end as last 3 columns)
      'TSA_Food_remarks', 'TSA_Coffee_remarks', 'TSA_CX_remarks'
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
      
      // Training Store Audit Scores (TSA Food, Coffee, CX)
      params.tsaFoodScore || params.TSA_Food_Score || '', 
      params.tsaCoffeeScore || params.TSA_Coffee_Score || '', 
      params.tsaCXScore || params.TSA_CX_Score || '',
      
      // Customer Experience (CX_1 to CX_9)
      params.CX_1 || '', params.CX_2 || '', params.CX_3 || '',
      params.CX_4 || '', params.CX_5 || '', params.CX_6 || '',
      params.CX_7 || '', params.CX_8 || '', params.CX_9 || '',
      
      // Action Plan (AP_1 to AP_3)
      params.AP_1 || '', params.AP_2 || '', params.AP_3 || '',
      
      // Non-TSA Section remarks
      params.TM_remarks || '', params.LMS_remarks || '',
      params.Buddy_remarks || '', params.NJ_remarks || '',
      params.PK_remarks || '', params.CX_remarks || '', params.AP_remarks || '',
      
      // Scoring
      params.totalScore || '', params.maxScore || '', params.percentage || '',
      
      // TSA Remarks (last 3 columns)
      params.TSA_Food_remarks || '', 
      params.TSA_Coffee_remarks || '', 
      params.TSA_CX_remarks || ''
    ];

    sheet.appendRow(row);
    
    // Log TSA responses to separate sheet
    logTSAResponses(params, serverTimestamp, submissionTime);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'OK' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Log TSA (Training Skill Assessment) responses to a separate sheet
 */
function logTSAResponses(params, serverTimestamp, submissionTime) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tsaSheet = ss.getSheetByName('TSA Responses');
    
    if (!tsaSheet) {
      tsaSheet = ss.insertSheet('TSA Responses');
      console.log('Created new sheet: TSA Responses');
    }
    
    // Define headers for TSA Responses sheet
    var tsaHeader = [
      'Server Timestamp', 'Submission Time', 'Trainer Name', 'Trainer ID',
      'Store Name', 'Store ID', 'Region', 'MOD',
      'TSA Section', 'Employee Name', 'Employee ID', 'Question ID', 'Question', 'Response'
    ];
    
    // Ensure header row exists
    if (tsaSheet.getLastRow() === 0) {
      tsaSheet.getRange(1, 1, 1, tsaHeader.length).setValues([tsaHeader]);
      tsaSheet.getRange(1, 1, 1, tsaHeader.length).setFontWeight('bold');
      tsaSheet.setFrozenRows(1);
    }
    
    // TSA Food responses
    var tsaFoodQuestions = [
      {id: 'FOOD_EMP_NAME', q: 'EMP. name'},
      {id: 'FOOD_EMP_ID', q: 'EMP. ID'},
      // Personal Hygiene
      {id: 'PH_1', q: 'Well-groomed as per TWC standards (uniform, nails, hair)'},
      {id: 'PH_2', q: 'Washed and sanitized hands every 30 mins'},
      {id: 'PH_3', q: 'Wears gloves or avoids direct food contact'},
      // Station Readiness
      {id: 'SR_1', q: 'All ingredients available for the day'},
      {id: 'SR_2', q: 'All smallware available & in correct use'},
      {id: 'SR_3', q: 'Station cleaned and sanitized'},
      {id: 'SR_4', q: 'Station and smallware organized and clean'},
      {id: 'SR_5', q: 'Clean dusters available at the station'},
      {id: 'SR_6', q: 'FDU AT LEAST 70% stocked, clean, follows planogram'},
      {id: 'SR_7', q: 'MRD stickers used correctly (FDU + Make Line)'},
      {id: 'SR_8', q: 'Products stored at correct temperature'},
      // Food Preparation & Handling
      {id: 'FP_1', q: 'Recipe followed per SOP (Food Item 1)'},
      {id: 'FP_2', q: 'Build followed per SOP (Food Item 1)'},
      {id: 'FP_3', q: 'Recipe followed per SOP (Food Item 2)'},
      {id: 'FP_4', q: 'Build followed per SOP (Food Item 2)'},
      {id: 'FP_5', q: 'Used correct tools for preparation'},
      {id: 'FP_6', q: 'Used appropriate key to heat/warm food (Merry chef/Oven)'},
      {id: 'FP_7', q: 'Gloves changed correctly (veg/non-veg switch or as per TWC guidelines)'},
      {id: 'FP_8', q: 'Consistently follows Clean-As-You-Go'},
      {id: 'FP_9', q: 'Correct duster used for station cleaning'},
      {id: 'FP_10', q: 'Follows First-In-First-Out for food items'},
      {id: 'FP_11', q: 'Products checked visually before serving'},
      {id: 'FP_12', q: 'Chips, condiments, cutlery, etc., provided per SOP'},
      // Standards Ownership
      {id: 'SO_1', q: 'Serves only food that meets TWC standards (fresh, safe, proper temp); knows what to do if not'}
    ];
    
    var foodEmpName = params.TSA_Food_FOOD_EMP_NAME || params.FOOD_EMP_NAME || '';
    var foodEmpId = params.TSA_Food_FOOD_EMP_ID || params.FOOD_EMP_ID || '';
    
    tsaFoodQuestions.forEach(function(item) {
      var paramKey = 'TSA_Food_' + item.id;
      var response = params[paramKey] || '';
      if (response) {  // Only log if there's a response
        tsaSheet.appendRow([
          serverTimestamp, submissionTime,
          params.trainerName || '', params.trainerId || '',
          params.storeName || '', params.storeId || '',
          params.region || '', params.mod || '',
          'TSA Food', foodEmpName, foodEmpId,
          item.id, item.q, response
        ]);
      }
    });
    
    // TSA Coffee responses
    var tsaCoffeeQuestions = [
      {id: 'COFFEE_EMP_NAME', q: 'EMP. name'},
      {id: 'COFFEE_EMP_ID', q: 'EMP. ID'},
      // Personal Hygiene
      {id: 'PH_1', q: 'Well-groomed as per TWC standards (uniform, nails, hair)'},
      {id: 'PH_2', q: 'Washed and sanitized hands'},
      {id: 'PH_3', q: 'Wears gloves at CBS'},
      // Station Readiness
      {id: 'SR_1', q: 'Trainee Ensures that the station is well stocked'},
      {id: 'SR_2', q: 'Trainee ensures all type of milk available'},
      {id: 'SR_3', q: 'Trainee Ensures that the leveller and temper is clean and set'},
      {id: 'SR_4', q: 'Trainee ensure all smallwares available at the stations'},
      {id: 'SR_5', q: 'Trainee ensured that the Espresso dial in is done'},
      {id: 'SR_6', q: 'Trainee extract the perfect espresso each time'},
      {id: 'SR_7', q: 'Trainee follows the Espresso extraction steps as defined'},
      {id: 'SR_8', q: 'Whipped cream is prepared as per standards'},
      {id: 'SR_9', q: 'Station and smallware organized and clean'},
      {id: 'SR_10', q: 'Clean dusters available at the station'},
      {id: 'SR_11', q: 'Station cleaned and sanitized'},
      {id: 'SR_12', q: 'MRD stickers used correctly'},
      {id: 'SR_13', q: 'Products stored at correct temperature'},
      // Coffee Preparation
      {id: 'CP_1', q: 'Recipe followed per SOP for Cappuccino'},
      {id: 'CP_2', q: 'Build followed per SOP for Cappuccino'},
      {id: 'CP_3', q: 'Recipe followed per SOP for Latte'},
      {id: 'CP_4', q: 'Build followed per SOP for Latte'},
      {id: 'CP_5', q: 'Recipe followed per SOP for bev 3'},
      {id: 'CP_6', q: 'Build followed per SOP for bev 3'},
      {id: 'CP_7', q: 'Recipe followed per SOP for bev 4'},
      {id: 'CP_8', q: 'Build followed per SOP for bev 4'},
      {id: 'CP_9', q: 'Cappuccino is served with 70:30 milk foam ratio'},
      {id: 'CP_10', q: 'Latte is served with silky smooth foam (90:10 ratio)'},
      {id: 'CP_11', q: 'Milk steaming standards are followed'},
      {id: 'CP_12', q: 'Latte art is as per described standards'},
      {id: 'CP_13', q: 'Used correct tools for preparation'},
      {id: 'CP_14', q: 'Blenders, Shakers and frothing jugs are washed and clean after every use'},
      {id: 'CP_15', q: 'Appropriate button is used to blend the beverages'},
      {id: 'CP_16', q: 'Toppings and Garnishes are used as per described standards'},
      {id: 'CP_17', q: 'Special instructions are read and followed'},
      {id: 'CP_18', q: 'Cold brew is available and brewed as per TWC standards'},
      {id: 'CP_19', q: 'Trainee is aware about the Cold brew'},
      {id: 'CP_20', q: 'Trainee brews the manual brews as per TWC standards'},
      {id: 'CP_21', q: 'Gloves changed correctly'},
      {id: 'CP_22', q: 'Consistently follows Clean-As-You-Go'},
      {id: 'CP_23', q: 'Correct duster used for station cleaning'},
      {id: 'CP_24', q: 'Follows First-In-First-Out for food items'},
      {id: 'CP_25', q: 'Products checked visually before serving'},
      {id: 'CP_26', q: 'Condiments, cutlery, etc., provided per SOP'}
    ];
    
    var coffeeEmpName = params.TSA_Coffee_COFFEE_EMP_NAME || params.COFFEE_EMP_NAME || '';
    var coffeeEmpId = params.TSA_Coffee_COFFEE_EMP_ID || params.COFFEE_EMP_ID || '';
    
    tsaCoffeeQuestions.forEach(function(item) {
      var paramKey = 'TSA_Coffee_' + item.id;
      var response = params[paramKey] || '';
      if (response) {  // Only log if there's a response
        tsaSheet.appendRow([
          serverTimestamp, submissionTime,
          params.trainerName || '', params.trainerId || '',
          params.storeName || '', params.storeId || '',
          params.region || '', params.mod || '',
          'TSA Coffee', coffeeEmpName, coffeeEmpId,
          item.id, item.q, response
        ]);
      }
    });
    
    // TSA CX responses
    var tsaCXQuestions = [
      {id: 'CX_EMP_NAME', q: 'EMP. name'},
      {id: 'CX_EMP_ID', q: 'EMP. ID'},
      // Personal Hygiene
      {id: 'CX_PH_1', q: 'Grooming & Hygiene: Well-groomed as per TWC standards'},
      {id: 'CX_PH_2', q: 'Hand Hygiene: Washed and sanitized hands'},
      {id: 'CX_PH_3', q: 'Food Handling: Wears gloves or avoids direct food contact'},
      // Station Readiness
      {id: 'CX_SR_1', q: 'Washrooms clean and stocked'},
      {id: 'CX_SR_2', q: 'Service area clean (floor, chairs, tables)'},
      {id: 'CX_SR_3', q: 'Smallwares clean (salvers, plates, cutlery)'},
      {id: 'CX_SR_4', q: 'Furniture properly set'},
      {id: 'CX_SR_5', q: 'POS, Bars, merchandise, menus, etc. properly stocked'},
      {id: 'CX_SR_6', q: 'Float/change available for cash transactions'},
      {id: 'CX_SR_7', q: 'Checks communication for product availability'},
      {id: 'CX_SR_8', q: 'Verifies temperature, music, table cleanliness, service items'},
      // Customer Handling
      {id: 'CX_CH_1', q: 'Cheerful Greeting: Cheerfully welcomes customers'},
      {id: 'CX_CH_2', q: 'Builds rapport (eye contact, active listening)'},
      {id: 'CX_CH_3', q: 'Assists customers to find seating'},
      {id: 'CX_CH_4', q: 'Order Taking Assistance: Upsells using product knowledge'},
      {id: 'CX_CH_5', q: 'Accurately enters and verifies orders in POS'},
      {id: 'CX_CH_6', q: 'Applies applicable discounts correctly'},
      {id: 'CX_CH_7', q: 'Processes payments accurately and handles change'},
      {id: 'CX_CH_8', q: 'Closes transaction smoothly and provides table tag'},
      {id: 'CX_CH_9', q: 'Thanks customer, explains order delivery'},
      {id: 'CX_CH_10', q: 'Friendly & Accurate service: Serves with attention to detail'},
      {id: 'CX_CH_11', q: 'Offers follow-up service and leaves customer satisfied'},
      {id: 'CX_CH_12', q: 'Clears table with courtesy, thanks guests on exit'},
      // Handling Feedback
      {id: 'CX_FC_1', q: 'What would you do if a customer leaves more than half'},
      {id: 'CX_FC_2', q: 'How do you handle a customer asking for extra protein'},
      {id: 'CX_FC_3', q: 'What do you do if a customer is angry or irritated'},
      {id: 'CX_FC_4', q: 'What would you do if a customer complains about cold food/coffee'},
      {id: 'CX_FC_5', q: 'How do you manage service if the wrong item is served'},
      {id: 'CX_FC_6', q: 'What do you do if a customer sits for a long time post meal'}
    ];
    
    var cxEmpName = params.TSA_CX_CX_EMP_NAME || params.CX_EMP_NAME || '';
    var cxEmpId = params.TSA_CX_CX_EMP_ID || params.CX_EMP_ID || '';
    
    tsaCXQuestions.forEach(function(item) {
      var paramKey = 'TSA_CX_' + item.id;
      var response = params[paramKey] || '';
      if (response) {  // Only log if there's a response
        tsaSheet.appendRow([
          serverTimestamp, submissionTime,
          params.trainerName || '', params.trainerId || '',
          params.storeName || '', params.storeId || '',
          params.region || '', params.mod || '',
          'TSA CX', cxEmpName, cxEmpId,
          item.id, item.q, response
        ]);
      }
    });
    
    console.log('TSA responses logged successfully');
  } catch (error) {
    console.error('Error logging TSA responses: ' + error.toString());
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    if (params.action === 'getData') {
      return getTrainingChecklistData();
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

function getTrainingChecklistData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Try multiple possible sheet names
    var possibleSheetNames = ['Training Audit', 'Training Checklist', 'TrainingAudit', 'Training'];
    var sheet = null;
    
    for (var i = 0; i < possibleSheetNames.length; i++) {
      sheet = ss.getSheetByName(possibleSheetNames[i]);
      if (sheet) {
        console.log('Found sheet: ' + possibleSheetNames[i]);
        break;
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
      
      // Training Store Audit Scores (TSA Food, Coffee, CX)
      obj['TSA_Food_Score'] = row[colIndex++] || '';
      obj['TSA_Coffee_Score'] = row[colIndex++] || '';
      obj['TSA_CX_Score'] = row[colIndex++] || '';
      
      // Customer Experience (CX_1 to CX_9)
      for (var i = 1; i <= 9; i++) {
        obj['CX_' + i] = row[colIndex++] || '';
      }
      
      // Action Plan (AP_1 to AP_3)
      for (var i = 1; i <= 3; i++) {
        obj['AP_' + i] = row[colIndex++] || '';
      }
      
      // Section remarks (reordered - non-TSA first)
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
      
      // TSA remarks (last 3 columns)
      obj.TSA_Food_remarks = row[colIndex++] || '';
      obj.TSA_Coffee_remarks = row[colIndex++] || '';
      obj.TSA_CX_remarks = row[colIndex++] || '';
      
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

// Cache for store mapping data to avoid repeated API calls
var storeMappingCache = null;
var cacheExpiry = null;
var CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getStoreMapping() {
  // Check if cache is valid (less than 30 minutes old)
  if (storeMappingCache && cacheExpiry && new Date().getTime() < cacheExpiry) {
    return storeMappingCache;
  }
  
  try {
    // Try multiple possible URLs for the store mapping
    // Since GitHub raw URLs might have issues, we'll rely more on the fallback
    var mappingUrls = [
      // Try GitHub URLs (might be 404)
      'https://raw.githubusercontent.com/TrainingTWC/hr-connect-dashboard/main/public/hr_mapping.json',
      'https://raw.githubusercontent.com/TrainingTWC/hr-connect-dashboard/main/hr_mapping.json',
      'https://raw.githubusercontent.com/TrainingTWC/hr-connect-dashboard/main/public/twc_store_mapping.json',
      // Add more working URLs here if available
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
          hrbpId: store['HRBP ID'] || store['hrbpId'] || store['hrbp_id'] || '',
          regionalHrId: store['Regional HR ID'] || store['regionalHrId'] || store['regional_hr_id'] || '',
          region: store['Region'] || store['region'] || '',
          hrHeadId: store['HR Head ID'] || store['hrHeadId'] || store['hr_head_id'] || '',
          lmsHeadId: store['LMS Head ID'] || store['lmsHeadId'] || store['lms_head_id'] || '',
          trainer: store['Trainer'] || store['trainer'] || '',
          trainerId: store['Trainer ID'] || store['trainerId'] || store['trainer_id'] || ''
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
    'S192': {storeName: 'Bhutani City Centre Noida', amId: 'H1766', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S027': {storeName: 'Defence Colony', amId: 'H1766', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S037': {storeName: 'Khan Market', amId: 'H1766', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S049': {storeName: 'Connaught Place', amId: 'H1766', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S055': {storeName: 'Kalkaji', amId: 'H1766', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S039': {storeName: 'Sector 07', amId: 'H2396', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S042': {storeName: 'Sector 35', amId: 'H2396', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S062': {storeName: 'Panchkula', amId: 'H2396', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S122': {storeName: 'Jubilee Walk Mohali', amId: 'H2396', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S024': {storeName: 'Deer Park', amId: 'H535', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S035': {storeName: 'GK 1', amId: 'H535', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S072': {storeName: 'Kailash Colony', amId: 'H535', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S142': {storeName: 'Green Park', amId: 'H535', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S171': {storeName: 'Omaxe World Street', amId: 'H535', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S172': {storeName: 'Faridabad Sec 14', amId: 'H535', hrbpId: 'H3578', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S197': {storeName: 'DLF Saltstayz', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S198': {storeName: 'DLF Star Tower', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S105': {storeName: 'Platina', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S029': {storeName: '32 Mile Stone', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S038': {storeName: 'Vatika Business Park', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S073': {storeName: 'Golf Course', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S099': {storeName: 'Sushant Lok', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S100': {storeName: 'AIPL Business Club', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S102': {storeName: 'Fortis', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S148': {storeName: 'Vensej Mall', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S150': {storeName: 'Airia Mall', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S154': {storeName: 'DME 63 LHS', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S155': {storeName: 'DME 69 RHS', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S164': {storeName: 'Nirvana Courtyard', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S176': {storeName: 'Capital Cyberscape', amId: 'H2396', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S026': {storeName: 'GK 2', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S028': {storeName: 'Saket', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S036': {storeName: 'Punjabi Bagh', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S040': {storeName: 'Ambience Mall, Vasant Kunj', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S041': {storeName: 'Netaji Subhash Place', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S113': {storeName: 'Hauz Khas', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S120': {storeName: 'Janakpuri', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S129': {storeName: 'Basant Lok', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S121': {storeName: 'DLF Avenue Mall - Saket', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S126': {storeName: 'Pacific Mall - Tagore Garden', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S141': {storeName: 'Paschim Vihar', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Hema', trainerId: 'h1169'},
    'S173': {storeName: 'Rohini Sec 14', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S174': {storeName: 'Vasant Kunj', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S182': {storeName: 'Rajouri Garden', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S188': {storeName: 'Shalimar Bagh Metro', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S200': {storeName: 'Malviya Nagar', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    'S187': {storeName: 'DLF Midtown', amId: 'H955', hrbpId: 'H2165', regionalHrId: 'H2165', region: 'North', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Kailash', trainerId: 'h2595'},
    
    // South Region Stores
    'S053': {storeName: 'TWC-Varthur', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S032': {storeName: 'TWC-Brookfield', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S005': {storeName: 'TWC-Forum Shantiniketan Whitefield', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S091': {storeName: 'TWC-Nexus Mall, Whitefield', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S019': {storeName: 'TWC-PMC-Bangalore', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S065': {storeName: 'TWC-Manipal Hospital', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S189': {storeName: 'Brookfield - Nxt Whitefield', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S034': {storeName: 'TWC-Karthik Nagar - Marathahalli', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S184': {storeName: 'Prestige Techno star', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S143': {storeName: 'TWC-Kilpauk', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S144': {storeName: 'TWC-Express Avenue Mall', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S145': {storeName: 'TWC-Adyar', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S157': {storeName: 'TWC-Kathipara Urban Square', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S123': {storeName: 'TWC-Phoenix Palladium Chennai', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S021': {storeName: 'TWC-Bedford Coonoor', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S178': {storeName: 'TWC-Besant Nagar', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S199': {storeName: 'Mettupalayam', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S201': {storeName: 'Ashoka Nagar', amId: 'H3362', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S063': {storeName: 'TWC-BTM Layout', amId: 'H1355', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    
    // Additional South Region Stores (commonly used)
    'S001': {storeName: 'TWC-Koramangala', amId: 'H1355', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S002': {storeName: 'TWC-CMH Indira Nagar', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S003': {storeName: 'TWC-Banashankari', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S004': {storeName: 'TWC-Sadashiv Nagar', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S006': {storeName: 'TWC-Jayanagar', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S007': {storeName: 'TWC-Malleshwaram 18th Cross', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S008': {storeName: 'TWC-JP Nagar', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S009': {storeName: 'TWC-12th Main Indira Nagar', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S011': {storeName: 'TWC-Cunningham Road', amId: 'H2155', hrbpId: 'H1972', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S012': {storeName: 'TWC-Malleshwaram', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S014': {storeName: 'TWC-Vasant Nagar', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S015': {storeName: 'TWC-Banaswadi', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S016': {storeName: 'TWC-RT Nagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S017': {storeName: 'TWC-Yelahanka', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S018': {storeName: 'TWC-Hebbal', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S020': {storeName: 'TWC-New Bel Road', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S022': {storeName: 'TWC-HSR Layout', amId: 'H1355', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S023': {storeName: 'TWC-HRBR Layout', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S030': {storeName: 'TWC-Frazer town', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S031': {storeName: 'TWC-Lavelle Road', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S033': {storeName: 'TWC-UB City', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S050': {storeName: 'TWC-Richmond Road', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S051': {storeName: 'TWC-Indiranagar', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S067': {storeName: 'TWC-Electronic City', amId: 'H1355', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S068': {storeName: 'TWC-Koramangala 8th Block', amId: 'H1355', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S069': {storeName: 'TWC-Vijaya Bank Layout', amId: 'H1355', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S070': {storeName: 'TWC-Sahakar Nagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S092': {storeName: 'TWC-Manyata Embassy NXT', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S094': {storeName: 'TWC-Prestige Ozone', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S095': {storeName: 'TWC-Sahakara Nagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S110': {storeName: 'TWC-Phoenix Mall of Asia', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S114': {storeName: 'TWC-Yelahanka New Town', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S115': {storeName: 'TWC-Whitefield Main Road', amId: 'H546', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S119': {storeName: 'TWC-Ramamurthy Nagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S125': {storeName: 'TWC-Vijayanagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S131': {storeName: 'TWC-Brigade Utopia', amId: 'H1355', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S133': {storeName: 'TWC-Residency Road', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S139': {storeName: 'TWC-Church Street', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S140': {storeName: 'TWC-Harlur Road', amId: 'H2601', hrbpId: 'H1972', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S146': {storeName: 'TWC-Rajajinagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S149': {storeName: 'TWC-Nagavara', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sheldon', trainerId: 'h1697'},
    'S152': {storeName: 'TWC-Commercial Street', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mahadev', trainerId: 'h1761'},
    'S156': {storeName: 'TWC-Akshay Nagar', amId: 'H1355', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S158': {storeName: 'TWC-Rajarajeshwari Nagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S159': {storeName: 'TWC-Yeshwanthpur', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S185': {storeName: 'Basaveshwar Nagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S190': {storeName: 'Mathikere', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S191': {storeName: 'Sparsh Hospital 2 Raj Rajeshwari Nagar', amId: 'H833', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    'S193': {storeName: 'Lal Bagh Road', amId: 'H2155', hrbpId: 'H2761', regionalHrId: 'H3551', region: 'South', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Mallika', trainerId: 'h701'},
    
    // West Region Stores  
    'S096': {storeName: 'Mahavir Nagar', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S088': {storeName: 'Kandivali Thakur Village', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S076': {storeName: 'Emerald Borivali', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S090': {storeName: 'Oberoi Mall', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S061': {storeName: 'Juhu', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S138': {storeName: 'Damodar Santacruz', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S116': {storeName: 'Crossword, Santacruz', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S132': {storeName: 'Ekta Tripolis Goregoan', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S165': {storeName: 'Sky City', amId: 'H1575', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S078': {storeName: 'Cuff Parade, Star Mansion', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S086': {storeName: 'Inorbit Mall', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S066': {storeName: 'Khajaguda', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S081': {storeName: 'Sainikpuri', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S082': {storeName: 'Salarpuria Sattva', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S083': {storeName: 'Kondapur', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S085': {storeName: 'Platina', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S084': {storeName: 'Banjara Hills', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S108': {storeName: 'Hyderabad Airport Inside', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S169': {storeName: 'Himayat Nagar', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S175': {storeName: 'Madeenaguda', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S206': {storeName: 'Capital Land ITPH', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S194': {storeName: 'Manikonda', amId: 'H2262', hrbpId: 'H3247', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    
    // Additional West Region Stores (commonly used)
    'S043': {storeName: 'Kemps Corner', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S044': {storeName: 'Lokhandwala', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S045': {storeName: 'Mahim', amId: 'H2908', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S047': {storeName: 'R City', amId: 'H2908', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S048': {storeName: 'Kalyani Nagar - Pune', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S057': {storeName: 'Versova', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S058': {storeName: 'Wanowrie', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S059': {storeName: 'Koregoan Park', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S060': {storeName: 'Kothrud', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S074': {storeName: 'Phoenix Market City - Pune', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S075': {storeName: 'Runwal Greens Mulund', amId: 'H2908', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S077': {storeName: 'Sea Castle, Marine Lines', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S080': {storeName: 'Balewadi Highstreet', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S087': {storeName: 'Equinox, BKC', amId: 'H2908', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S089': {storeName: 'Viviana Mall', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S097': {storeName: 'Chembur', amId: 'H2908', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S103': {storeName: 'The Walk', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S104': {storeName: 'MOM, Wakad', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S106': {storeName: 'Andheri, Chakala', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S107': {storeName: 'Vile Parle', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S109': {storeName: 'FC Road', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S111': {storeName: 'CBD Belapur', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S117': {storeName: 'Andheri, Marol', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S118': {storeName: 'Inorbit Vashi', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S127': {storeName: 'Seawoods Highstreet', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S128': {storeName: 'Bibewadi', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S130': {storeName: 'Pimple Saudagar', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S134': {storeName: 'Westend Aundh', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S135': {storeName: 'Worli', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S136': {storeName: 'Pimple Nilakh', amId: 'H2758', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S137': {storeName: 'Vashi Palm Beach', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S147': {storeName: 'Pune Mumbai Expressway', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S161': {storeName: 'Seawoods Nexus', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S162': {storeName: 'Delloitte, Mumbai', amId: 'H2908', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S163': {storeName: 'Phoenix Market City- Mumbai', amId: 'H2908', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S168': {storeName: 'Panchpakhadi', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'},
    'S170': {storeName: 'Pokhran Road', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Priyanka', trainerId: 'h3252'},
    'S177': {storeName: 'Nariman Point', amId: 'H3386', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Sunil', trainerId: 'h3247'},
    'S180': {storeName: 'Dellloitte Thane', amId: 'H2273', hrbpId: 'H3603', regionalHrId: 'HC002', region: 'West', hrHeadId: 'H2081', lmsHeadId: 'H541', trainer: 'Viraj', trainerId: 'h1278'}
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
    return { region: '', storeName: '', amId: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '' };
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
      return { region: 'Unknown', storeName: '', amId: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '' };
    }
    
    // Ensure we return a clean object with all expected fields
    var cleanStoreInfo = {
      region: storeInfo.region || 'Unknown',
      storeName: storeInfo.storeName || '',
      amId: storeInfo.amId || '',
      hrbpId: storeInfo.hrbpId || '',
      regionalHrId: storeInfo.regionalHrId || '',
      hrHeadId: storeInfo.hrHeadId || '',
      lmsHeadId: storeInfo.lmsHeadId || '',
      trainer: storeInfo.trainer || '',
      trainerId: storeInfo.trainerId || ''
      // Notably NO 'mod' field - MOD must be user input only
    };
    
    console.log('Store info found for ' + storeId + ': ' + JSON.stringify(cleanStoreInfo));
    return cleanStoreInfo;
    
  } catch (error) {
    console.log('Error in getStoreInfo: ' + error.toString());
    return { region: 'Error', storeName: '', amId: '', hrbpId: '', regionalHrId: '', hrHeadId: '', lmsHeadId: '', trainer: '', trainerId: '' };
  }
}