function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AM Ops Checklist');
    
    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('AM Ops Checklist');
    }

    // Validate/detect region based on store ID
    var validatedRegion = detectRegionFromStoreId(params.storeId || '');
    params.region = validatedRegion;

    // Complete header for AM Operations Checklist (63 questions + metadata + section remarks)
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
      
      // Section 1: Cheerful Greeting (CG_1 to CG_13) - 13 questions
      'CG_1 - Store front area clean and maintained',
      'CG_2 - Signage clean and lights functioning',
      'CG_3 - Glass and doors smudge-free',
      'CG_4 - Promotional displays reflect current offers',
      'CG_5 - POS tent cards per latest communication',
      'CG_6 - Menu boards/DMB per latest communication',
      'CG_7 - Welcoming environment (music, lighting, AC, aroma)',
      'CG_8 - Washrooms cleaned and checklist updated',
      'CG_9 - FDU counter neat, fully stocked, per planogram',
      'CG_10 - Merch rack follows VM guidelines',
      'CG_11 - Staff grooming per standards',
      'CG_12 - Seating, furniture, and stations tidy',
      'CG_13 - Engine area clean and ready',
      
      // Section 2: Order Taking Assistance (OTA_1 to OTA_11) - 11 questions  
      'OTA_1 - Suggestive selling at POS',
      'OTA_2 - POS partner updated on promos and availability',
      'OTA_3 - Order-taking time recorded for 5 customers',
      'OTA_4 - Sufficient cash and change at POS',
      'OTA_5 - Valid licenses displayed and expiries checked',
      'OTA_6 - Cash audits completed and verified',
      'OTA_7 - Daily banking reports tallied',
      'OTA_8 - CPI reviewed through FAME pilot',
      'OTA_9 - Swiggy/Zomato metrics reviewed and managed',
      'OTA_10 - Food and drinks served per SOP',
      'OTA_11 - Food orders based on 4-week sales trend',
      
      // Section 3: Friendly & Accurate Service (FAS_1 to FAS_13) - 13 questions
      'FAS_1 - Equipment cleaned and maintained',
      'FAS_2 - Temperature checks done with Therma Pen',
      'FAS_3 - Documentation (GRN, RSTN, STN & TO) completed',
      'FAS_4 - Fast-moving SKU availability checked',
      'FAS_5 - Thawing chart validated against actual thawing',
      'FAS_6 - Deployment roles clear with coaching',
      'FAS_7 - No broken/unused tools stored',
      'FAS_8 - Garbage segregated properly (wet/dry)',
      'FAS_9 - LTO products served per standards',
      'FAS_10 - Coffee and food dial-in process followed',
      'FAS_11 - R.O.A.S.T. and app orders executed accurately',
      'FAS_12 - 5 order service times validated',
      'FAS_13 - Open maintenance points reviewed',
      
      // Section 4: Feedback with Solution (FWS_1 to FWS_13) - 13 questions
      'FWS_1 - COGS reviewed with actions per P&L feedback',
      'FWS_2 - BSC targets vs achievements reviewed',
      'FWS_3 - People budget vs actuals reviewed',
      'FWS_4 - Stock variance (physical vs system) verified',
      'FWS_5 - Top 10 wastage items reviewed',
      'FWS_6 - Store utilities (units, chemical use) reviewed',
      'FWS_7 - Shift targets, briefings, goal tracking conducted',
      'FWS_8 - New staff training and bench plans reviewed',
      'FWS_9 - Training and QA audits reviewed',
      'FWS_10 - Duty roster checked and attendance ensured',
      'FWS_11 - Temperature and thawing logs validated',
      'FWS_12 - Audit and data findings cross-checked',
      'FWS_13 - Pest control layout updated',
      
      // Section 5: Enjoyable Experience (ENJ_1 to ENJ_7) - 7 questions
      'ENJ_1 - New and repeat customers engaged with feedback',
      'ENJ_2 - Seating adjusted per customer requirements',
      'ENJ_3 - Team proactively assisting customers',
      'ENJ_4 - CCTV checked for customer service monitoring',
      'ENJ_5 - CCTV backup (60 days) in place',
      'ENJ_6 - Opening/closing footage reviewed',
      'ENJ_7 - No personal items in guest areas',
      
      // Section 6: Enthusiastic Exit (EX_1 to EX_6) - 6 questions
      'EX_1 - No unresolved issues at exits',
      'EX_2 - Final interaction cheerful and courteous',
      'EX_3 - Consolidated action plan created with SM',
      'EX_4 - Top performers recognized',
      'EX_5 - Wins celebrated and improvement areas communicated',
      'EX_6 - Team motivated for ongoing improvement',
      
      // Section Remarks
      'Section CG Remarks',
      'Section OTA Remarks', 
      'Section FAS Remarks',
      'Section FWS Remarks',
      'Section ENJ Remarks',
      'Section EX Remarks',
      
      // Scoring
      'Total Score',
      'Max Score',
      'Percentage Score'
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

    // Build row data in same order as header
    var row = [
      new Date(), // Server Timestamp
      params.submissionTime || '',
      params.hrName || '',
      params.hrId || '',
      params.amName || '',
      params.amId || '',
      params.trainerName || '',
      params.trainerId || '',
      params.storeName || '',
      params.storeId || '',
      params.region || '',
      
      // Section 1: Cheerful Greeting responses (CG_1 to CG_13)
      params.q1 || '', params.q2 || '', params.q3 || '', params.q4 || '', params.q5 || '',
      params.q6 || '', params.q7 || '', params.q8 || '', params.q9 || '', params.q10 || '',
      params.q11 || '', params.q12 || '', params.q13 || '',
      
      // Section 2: Order Taking Assistance responses (OTA_1 to OTA_11)  
      params.q101 || '', params.q102 || '', params.q103 || '', params.q104 || '', params.q105 || '',
      params.q106 || '', params.q107 || '', params.q108 || '', params.q109 || '', params.q110 || '',
      params.q111 || '',
      
      // Section 3: Friendly & Accurate Service responses (FAS_1 to FAS_13)
      params.q201 || '', params.q202 || '', params.q203 || '', params.q204 || '', params.q205 || '',
      params.q206 || '', params.q207 || '', params.q208 || '', params.q209 || '', params.q210 || '',
      params.q211 || '', params.q212 || '', params.q213 || '',
      
      // Section 4: Feedback with Solution responses (FWS_1 to FWS_13)
      params.q301 || '', params.q302 || '', params.q303 || '', params.q304 || '', params.q305 || '',
      params.q306 || '', params.q307 || '', params.q308 || '', params.q309 || '', params.q310 || '',
      params.q311 || '', params.q312 || '', params.q313 || '',
      
      // Section 5: Enjoyable Experience responses (ENJ_1 to ENJ_7)
      params.q401 || '', params.q402 || '', params.q403 || '', params.q404 || '', params.q405 || '',
      params.q406 || '', params.q407 || '',
      
      // Section 6: Enthusiastic Exit responses (EX_1 to EX_6)
      params.q501 || '', params.q502 || '', params.q503 || '', params.q504 || '', params.q505 || '',
      params.q506 || '',
      
      // Section Remarks
      params.section_CG_remarks || '',
      params.section_OTA_remarks || '',
      params.section_FAS_remarks || '',
      params.section_FWS_remarks || '', 
      params.section_ENJ_remarks || '',
      params.section_EX_remarks || '',
      
      // Scoring
      params.totalScore || '',
      params.maxScore || '',
      params.percentageScore || ''
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
    var action = params.action;
    
    if (action === 'getData') {
      return getAMOperationsData();
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
    // FIXED: Changed from 'AM Operations' to 'AM Ops Checklist' to match your actual sheet name
    var sheet = ss.getSheetByName('AM Ops Checklist');
    
    if (!sheet) {
      console.log("Sheet 'AM Ops Checklist' not found");
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log("No data found in AM Ops Checklist sheet");
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data including headers
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = data.slice(1);
    
    console.log("Found " + rows.length + " AM Operations submissions");
    
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
      
      // All 63 question responses (CG: 1-13, OTA: 101-111, FAS: 201-213, FWS: 301-313, ENJ: 401-407, EX: 501-506)
      var colIndex = 11; // Starting after metadata columns
      
      // Cheerful Greeting (13 questions)
      for (var i = 1; i <= 13; i++) {
        obj['CG_' + i] = row[colIndex++] || '';
      }
      
      // Order Taking Assistance (11 questions)
      for (var i = 1; i <= 11; i++) {
        obj['OTA_' + i] = row[colIndex++] || '';
      }
      
      // Friendly & Accurate Service (13 questions)
      for (var i = 1; i <= 13; i++) {
        obj['FAS_' + i] = row[colIndex++] || '';
      }
      
      // Feedback with Solution (13 questions)
      for (var i = 1; i <= 13; i++) {
        obj['FWS_' + i] = row[colIndex++] || '';
      }
      
      // Enjoyable Experience (7 questions)
      for (var i = 1; i <= 7; i++) {
        obj['ENJ_' + i] = row[colIndex++] || '';
      }
      
      // Enthusiastic Exit (6 questions)
      for (var i = 1; i <= 6; i++) {
        obj['EX_' + i] = row[colIndex++] || '';
      }
      
      // Section remarks
      obj.section_CG_remarks = row[colIndex++] || '';
      obj.section_OTA_remarks = row[colIndex++] || '';
      obj.section_FAS_remarks = row[colIndex++] || '';
      obj.section_FWS_remarks = row[colIndex++] || '';
      obj.section_ENJ_remarks = row[colIndex++] || '';
      obj.section_EX_remarks = row[colIndex++] || '';
      
      // Scoring
      obj.totalScore = row[colIndex++] || '';
      obj.maxScore = row[colIndex++] || '';
      obj.percentageScore = row[colIndex++] || '';
      
      // Format submission time for display
      if (obj.submissionTime) {
        try {
          var date = new Date(obj.submissionTime);
          obj.formattedTime = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch (e) {
          obj.formattedTime = obj.submissionTime;
        }
      }
      
      // Ensure percentage score is numeric for dashboard
      if (obj.percentageScore) {
        var numericScore = parseFloat(obj.percentageScore.toString().replace('%', ''));
        if (!isNaN(numericScore)) {
          obj.percentageScore = numericScore;
        }
      }
      
      return obj;
    });
    
    console.log("Returning " + jsonData.length + " processed AM Operations submissions");
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in getAMOperationsData:', error);
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Same region detection function as HR survey
function detectRegionFromStoreId(storeId) {
  if (!storeId) {
    return 'Unknown';
  }
  
  var storeRegionMapping = {
    'S153': 'North', 'S195': 'North', 'S202': 'North', 'S056': 'North', 'S101': 'North',
    'S112': 'North', 'S166': 'North', 'S167': 'North', 'S192': 'North', 'S027': 'North',
    'S037': 'North', 'S049': 'North', 'S055': 'North', 'S039': 'North', 'S042': 'North',
    'S062': 'North', 'S122': 'North', 'S024': 'North', 'S035': 'North', 'S072': 'North',
    'S142': 'North', 'S171': 'North', 'S172': 'North', 'S197': 'North', 'S198': 'North',
    'S029': 'North', 'S038': 'North', 'S073': 'North', 'S099': 'North', 'S100': 'North',
    'S102': 'North', 'S148': 'North', 'S150': 'North', 'S154': 'North', 'S155': 'North',
    'S164': 'North', 'S176': 'North', 'S026': 'North', 'S028': 'North', 'S036': 'North',
    'S040': 'North', 'S041': 'North', 'S113': 'North', 'S120': 'North', 'S129': 'North',
    'S121': 'North', 'S126': 'North', 'S141': 'North', 'S173': 'North', 'S174': 'North',
    'S182': 'North', 'S188': 'North', 'S200': 'North', 'S187': 'North',
    'S053': 'South', 'S032': 'South', 'S005': 'South', 'S091': 'South', 'S019': 'South',
    'S065': 'South', 'S189': 'South', 'S034': 'South', 'S184': 'South', 'S143': 'South',
    'S144': 'South', 'S145': 'South', 'S157': 'South', 'S123': 'South', 'S021': 'South',
    'S178': 'South', 'S199': 'South', 'S201': 'South', 'S023': 'South', 'S092': 'South',
    'S070': 'South', 'S020': 'South', 'S125': 'South', 'S146': 'South', 'S191': 'South',
    'S110': 'South', 'S185': 'South', 'S131': 'South', 'S068': 'South', 'S156': 'South',
    'S001': 'South', 'S069': 'South', 'S063': 'South', 'S002': 'South', 'S009': 'South',
    'S012': 'South', 'S004': 'South', 'S030': 'South', 'S031': 'South', 'S011': 'South',
    'S115': 'South', 'S014': 'South', 'S007': 'South', 'S193': 'South', 'S008': 'South',
    'S158': 'South', 'S067': 'South', 'S033': 'South', 'S094': 'South', 'S016': 'South',
    'S051': 'South', 'S159': 'South', 'S140': 'South', 'S119': 'South', 'S152': 'South',
    'S017': 'South', 'S139': 'South', 'S133': 'South', 'S149': 'South', 'S018': 'South',
    'S006': 'South', 'S003': 'South', 'S022': 'South', 'S015': 'South', 'S095': 'South',
    'S114': 'South', 'S050': 'South', 'S190': 'South', 'S901': 'South', 'S902': 'South',
    'S105': 'West', 'S096': 'West', 'S088': 'West', 'S076': 'West', 'S090': 'West',
    'S061': 'West', 'S138': 'West', 'S116': 'West', 'S132': 'West', 'S165': 'West',
    'S045': 'West', 'S087': 'West', 'S075': 'West', 'S047': 'West', 'S097': 'West',
    'S162': 'West', 'S163': 'West', 'S111': 'West', 'S103': 'West', 'S089': 'West',
    'S137': 'West', 'S147': 'West', 'S118': 'West', 'S127': 'West', 'S180': 'West',
    'S161': 'West', 'S168': 'West', 'S170': 'West', 'S077': 'West', 'S057': 'West',
    'S107': 'West', 'S106': 'West', 'S043': 'West', 'S078': 'West', 'S044': 'West',
    'S117': 'West', 'S135': 'West', 'S177': 'West', 'S080': 'West', 'S104': 'West',
    'S074': 'West', 'S059': 'West', 'S060': 'West', 'S048': 'West', 'S058': 'West',
    'S109': 'West', 'S134': 'West', 'S130': 'West', 'S136': 'West', 'S128': 'West',
    'S086': 'West', 'S066': 'West', 'S081': 'West', 'S082': 'West', 'S083': 'West',
    'S085': 'West', 'S084': 'West', 'S108': 'West', 'S169': 'West', 'S175': 'West',
    'S206': 'West', 'S194': 'West'
  };
  
  return storeRegionMapping[storeId] || 'Unknown';
}