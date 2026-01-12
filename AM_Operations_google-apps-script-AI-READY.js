function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AM Ops Checklist');
    if (!sheet) throw new Error("Sheet 'AM Ops Checklist' not found");

    // Create header if sheet is empty
    if (sheet.getLastRow() === 0) {
      var header = [
        'Server Timestamp',
        'Submission Time', 
        'HR Name',
        'HR ID',
        'AM Name',
        'AM ID',
        'Trainer Name',
        'Trainer ID',
        'Store Name',
        'Store ID',
        'Region',
        'BSC Achievement',
        'People On Shift',
        'Manpower Fulfilment',
        'Store Format',
        'Menu Type',
        'Price Group',
        // Cheerful Greeting (CG) - Questions 1-13
        'CG_1', 'CG_2', 'CG_3', 'CG_4', 'CG_5', 'CG_6', 'CG_7', 'CG_8', 'CG_9', 'CG_10', 'CG_11', 'CG_12', 'CG_13',
        // Order Taking Assistance (OTA) - Questions 1-11
        'OTA_1', 'OTA_2', 'OTA_3', 'OTA_4', 'OTA_5', 'OTA_6', 'OTA_7', 'OTA_8', 'OTA_9', 'OTA_10', 'OTA_11',
        // Friendly & Accurate Service (FAS) - Questions 1-13
        'FAS_1', 'FAS_2', 'FAS_3', 'FAS_4', 'FAS_5', 'FAS_6', 'FAS_7', 'FAS_8', 'FAS_9', 'FAS_10', 'FAS_11', 'FAS_12', 'FAS_13',
        // Feedback with Solution (FWS) - Questions 1-13
        'FWS_1', 'FWS_2', 'FWS_3', 'FWS_4', 'FWS_5', 'FWS_6', 'FWS_7', 'FWS_8', 'FWS_9', 'FWS_10', 'FWS_11', 'FWS_12', 'FWS_13',
        // Engagement (ENJ) - Questions 1-7
        'ENJ_1', 'ENJ_2', 'ENJ_3', 'ENJ_4', 'ENJ_5', 'ENJ_6', 'ENJ_7',
        // Excellence (EX) - Questions 1-6
        'EX_1', 'EX_2', 'EX_3', 'EX_4', 'EX_5', 'EX_6',
        // Section Remarks
        'CG_Remarks', 'OTA_Remarks', 'FAS_Remarks', 'FWS_Remarks', 'ENJ_Remarks', 'EX_Remarks',
        // Scores
        'Total Score',
        'Max Score',
        'Percentage Score',
        'CG_Score', 'OTA_Score', 'FAS_Score', 'FWS_Score', 'ENJ_Score', 'EX_Score'
      ];
      sheet.appendRow(header);
    }

    // Prepare row data matching header order
    var rowData = [
      new Date(), // Server Timestamp
      params.submissionTime || new Date().toISOString(),
      params.hrName || '',
      params.hrId || '',
      params.amName || '',
      params.amId || '',
      params.trainerName || '',
      params.trainerId || '',
      params.storeName || '',
      params.storeId || '',
      params.region || '',
      params.bscAchievement || '',
      params.peopleOnShift || '',
      params.manpowerFulfilment || '',
      params.storeFormat || '',
      params.menuType || '',
      params.priceGroup || '',
      
      // Cheerful Greeting (CG) - Questions 1-13
      params['CG_1'] || '', params['CG_2'] || '', params['CG_3'] || '', params['CG_4'] || '', 
      params['CG_5'] || '', params['CG_6'] || '', params['CG_7'] || '', params['CG_8'] || '', 
      params['CG_9'] || '', params['CG_10'] || '', params['CG_11'] || '', params['CG_12'] || '', params['CG_13'] || '',
      
      // Order Taking Assistance (OTA) - Questions 1-11
      params['OTA_1'] || '', params['OTA_2'] || '', params['OTA_3'] || '', params['OTA_4'] || '', 
      params['OTA_5'] || '', params['OTA_6'] || '', params['OTA_7'] || '', params['OTA_8'] || '', 
      params['OTA_9'] || '', params['OTA_10'] || '', params['OTA_11'] || '',
      
      // Friendly & Accurate Service (FAS) - Questions 1-13
      params['FAS_1'] || '', params['FAS_2'] || '', params['FAS_3'] || '', params['FAS_4'] || '', 
      params['FAS_5'] || '', params['FAS_6'] || '', params['FAS_7'] || '', params['FAS_8'] || '', 
      params['FAS_9'] || '', params['FAS_10'] || '', params['FAS_11'] || '', params['FAS_12'] || '', params['FAS_13'] || '',
      
      // Feedback with Solution (FWS) - Questions 1-13
      params['FWS_1'] || '', params['FWS_2'] || '', params['FWS_3'] || '', params['FWS_4'] || '', 
      params['FWS_5'] || '', params['FWS_6'] || '', params['FWS_7'] || '', params['FWS_8'] || '', 
      params['FWS_9'] || '', params['FWS_10'] || '', params['FWS_11'] || '', params['FWS_12'] || '', params['FWS_13'] || '',
      
      // Engagement (ENJ) - Questions 1-7
      params['ENJ_1'] || '', params['ENJ_2'] || '', params['ENJ_3'] || '', params['ENJ_4'] || '', 
      params['ENJ_5'] || '', params['ENJ_6'] || '', params['ENJ_7'] || '',
      
      // Excellence (EX) - Questions 1-6
      params['EX_1'] || '', params['EX_2'] || '', params['EX_3'] || '', params['EX_4'] || '', 
      params['EX_5'] || '', params['EX_6'] || '',
      
      // Section Remarks
      params['CG_remarks'] || params['cgRemarks'] || '',
      params['OTA_remarks'] || params['otaRemarks'] || '',
      params['FAS_remarks'] || params['fasRemarks'] || '',
      params['FWS_remarks'] || params['fwsRemarks'] || '',
      params['ENJ_remarks'] || params['enjRemarks'] || '',
      params['EX_remarks'] || params['exRemarks'] || '',
      
      // Scores
      params.totalScore || params.score || '',
      params.maxScore || '',
      params.percentageScore || params.percentage || '',
      params.cgScore || '',
      params.otaScore || '',
      params.fasScore || '',
      params.fwsScore || '',
      params.enjScore || '',
      params.exScore || ''
    ];

    // Append the row
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', row: sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AM Ops Checklist');
    if (!sheet) throw new Error("Sheet 'AM Ops Checklist' not found");

    var data = sheet.getDataRange().getValues();
    if (data.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];
    var rows = data.slice(1);
    
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
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
