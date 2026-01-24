// Handle preflight OPTIONS requests
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('HR Connect');
    if (!sheet) throw new Error("Sheet 'HR Connect' not found");

    // Validate/detect region based on store ID only
    var validatedRegion = detectRegionFromStoreId(params.storeID || params.storeId || '');
    
    // Override the region parameter with the validated one
    params.region = validatedRegion;

    // Header must match the row order below
    var header = [
      'Server Timestamp',
      'Submission Time',
      'HR Name',
      'HR ID',
      'AM Name',
      'AM ID',
      'Emp Name',
      'Emp ID',
      'Store Name',
      'Store ID',
      'Region',
      'Q1 - Work Pressure in Café',
      'Q1 Remarks',
      'Q2 - Decision Making & Customer Problem Solving',
      'Q2 Remarks',
      'Q3 - Performance Reviews & SM/AM Feedback',
      'Q3 Remarks',
      'Q4 - Team Treatment & Partiality',
      'Q4 Remarks',
      'Q5 - Wings Program Training',
      'Q5 Remarks',
      'Q6 - Operational Apps & Benefits Issues',
      'Q6 Remarks',
      'Q7 - HR Handbook & Policies',
      'Q7 Remarks',
      'Q8 - Work Schedule Satisfaction',
      'Q8 Remarks',
      'Q9 - Team Collaboration',
      'Q9 Remarks',
      'Q10 - Helpful Colleague',
      'Q10 Remarks',
      'Q11 - Suggestions for Organization',
      'Q11 Remarks',
      'Q12 - TWC Experience Rating',
      'Q12 Remarks',
      'Total Score',
      'Max Score',
      'Percent'
    ];

    // Ensure header row exists and matches expected header
    var needHeader = false;
    if (sheet.getLastRow() === 0) {
      needHeader = true;
    } else {
      var firstRow = sheet.getRange(1, 1, 1, header.length).getValues()[0] || [];
      if (firstRow.length !== header.length) {
        needHeader = true;
      } else {
        for (var i = 0; i < header.length; i++) {
          if (String((firstRow[i] || '')).trim() !== String(header[i]).trim()) {
            needHeader = true;
            break;
          }
        }
      }
    }
    if (needHeader) {
      // If sheet already has data, insert a new top row for header
      if (sheet.getLastRow() > 0) sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }

    // Build row in the same order as header
    var row = [
      new Date(), // Server Timestamp
      params.submissionTime || '',
      params.hrName || params.HRName || '',
      params.hrId || params.HRId || '',
      params.amName || params.amName || '',
      params.amId || params.amId || '',
      params.empName || params.EmpName || '',
      params.empId || params.EmpID || '',
      params.storeName || params.StoreName || '',
      params.storeID || params.storeId || '',
      params.region || '',
      params.q1 || '',
      params.q1_remarks || '',
      params.q2 || '',
      params.q2_remarks || '',
      params.q3 || '',
      params.q3_remarks || '',
      params.q4 || '',
      params.q4_remarks || '',
      params.q5 || '',
      params.q5_remarks || '',
      params.q6 || '',
      params.q6_remarks || '',
      params.q7 || '',
      params.q7_remarks || '',
      params.q8 || '',
      params.q8_remarks || '',
      params.q9 || '',
      params.q9_remarks || '',
      params.q10 || '',
      params.q10_remarks || '',
      params.q11 || '',
      params.q11_remarks || '',
      params.q12 || '',
      params.q12_remarks || '',
      params.totalScore || params.total || '',
      params.maxScore || params.max || '',
      params.percent || ''
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
      return getDataFromSheet();
    }
    
    // Return empty response for other GET requests
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getDataFromSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('HR Connect');
    
    if (!sheet) {
      throw new Error("Sheet 'HR Connect' not found");
    }
    
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      // No data or only headers
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0];
    var rows = data.slice(1);
    
    // Convert to format expected by React app
    var jsonData = rows.map(function(row) {
      var obj = {};
      
      // Basic info from columns A-J (as seen in the screenshot)
      // Use Server Timestamp (Column A) instead of Submission Time (Column B) for accurate date
      var submissionTimeValue = row[0];  // Column A - Server Timestamp
      if (submissionTimeValue instanceof Date) {
        // If it's a Date object, format it as DD/MM/YYYY, HH:MM:SS
        var day = Utilities.formatDate(submissionTimeValue, Session.getScriptTimeZone(), 'dd');
        var month = Utilities.formatDate(submissionTimeValue, Session.getScriptTimeZone(), 'MM');
        var year = Utilities.formatDate(submissionTimeValue, Session.getScriptTimeZone(), 'yyyy');
        var time = Utilities.formatDate(submissionTimeValue, Session.getScriptTimeZone(), 'HH:mm:ss');
        obj.submissionTime = day + '/' + month + '/' + year + ', ' + time;
      } else {
        // If it's already a string, use it as-is
        obj.submissionTime = submissionTimeValue || '';
      }
      obj.hrName = row[2] || '';            // Column C - HR Name
      obj.hrId = row[3] || '';              // Column D - HR ID
      obj.amName = row[4] || '';            // Column E - AM Name
      obj.amId = row[5] || '';              // Column F - AM ID
      obj.empName = row[6] || '';           // Column G - Emp Name
      obj.empId = row[7] || '';             // Column H - Emp ID
      obj.storeName = row[8] || '';         // Column I - Store Name
      obj.storeID = row[9] || '';           // Column J - Store ID
      obj.region = row[10] || '';           // Column K - Region
      
      // Survey responses from columns K onwards (based on screenshot structure)
      // From your screenshot: K="Q1 - Work Pressure...", L="Q2 - Decision...", etc.
      obj.q1 = row[11] || '';               // Column L - Q1 Response (Work Pressure)
      obj.q1_remarks = row[12] || '';       // Column M - Q1 Remarks
      obj.q2 = row[13] || '';               // Column N - Q2 Response (Decision Making)
      obj.q2_remarks = row[14] || '';       // Column O - Q2 Remarks
      obj.q3 = row[15] || '';               // Column P - Q3 Response (Performance Reviews)
      obj.q3_remarks = row[16] || '';       // Column Q - Q3 Remarks
      obj.q4 = row[17] || '';               // Column R - Q4 Response (Team Treatment)
      obj.q4_remarks = row[18] || '';       // Column S - Q4 Remarks
      obj.q5 = row[19] || '';               // Q5 Response (Wings Training)
      obj.q5_remarks = row[20] || '';       // Q5 Remarks
      obj.q6 = row[21] || '';               // Q6 Response (Operational Apps)
      obj.q6_remarks = row[22] || '';       // Q6 Remarks
      obj.q7 = row[23] || '';               // Q7 Response (HR Handbook)
      obj.q7_remarks = row[24] || '';       // Q7 Remarks
      obj.q8 = row[25] || '';               // Q8 Response (Work Schedule)
      obj.q8_remarks = row[26] || '';       // Q8 Remarks
      obj.q9 = row[27] || '';               // Q9 Response (Team Collaboration)
      obj.q9_remarks = row[28] || '';       // Q9 Remarks
      obj.q10 = row[29] || '';              // Q10 Response (Helpful Colleague)
      obj.q10_remarks = row[30] || '';      // Q10 Remarks
      obj.q11 = row[31] || '';              // Q11 Response (Suggestions)
      obj.q11_remarks = row[32] || '';      // Q11 Remarks
      obj.q12 = row[33] || '';              // Q12 Response (TWC Experience)
      obj.q12_remarks = row[34] || '';      // Q12 Remarks
      
      // Scoring information
      obj.totalScore = row[35] || '';       // Total Score
      obj.maxScore = row[36] || '';         // Max Score
      obj.percent = row[37] || '';          // Percent
      
      return obj;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to detect region based on store ID only
function detectRegionFromStoreId(storeId) {
  if (!storeId) {
    return 'Unknown';
  }
  
  // Store ID to Region mapping (source: store_mapping_corrected.tsv)
  var storeRegionMapping = {
    'S001': 'South',
    'S002': 'South',
    'S003': 'South',
    'S004': 'South',
    'S005': 'South',
    'S006': 'South',
    'S007': 'South',
    'S008': 'South',
    'S009': 'South',
    'S011': 'South',
    'S012': 'South',
    'S014': 'South',
    'S015': 'South',
    'S016': 'South',
    'S017': 'South',
    'S018': 'South',
    'S019': 'South',
    'S020': 'South',
    'S021': 'South',
    'S022': 'South',
    'S023': 'South',
    'S024': 'North',
    'S026': 'North',
    'S027': 'North',
    'S028': 'North',
    'S030': 'South',
    'S031': 'South',
    'S032': 'South',
    'S033': 'South',
    'S034': 'South',
    'S035': 'North',
    'S036': 'North',
    'S037': 'North',
    'S038': 'North',
    'S039': 'North',
    'S040': 'North',
    'S041': 'North',
    'S042': 'North',
    'S043': 'West',
    'S044': 'West',
    'S045': 'West',
    'S047': 'West',
    'S048': 'West',
    'S049': 'North',
    'S050': 'South',
    'S051': 'South',
    'S053': 'South',
    'S055': 'North',
    'S056': 'North',
    'S057': 'West',
    'S058': 'West',
    'S059': 'West',
    'S060': 'West',
    'S061': 'West',
    'S062': 'North',
    'S063': 'South',
    'S065': 'South',
    'S066': 'West',
    'S067': 'South',
    'S068': 'South',
    'S069': 'South',
    'S070': 'South',
    'S072': 'North',
    'S073': 'North',
    'S074': 'West',
    'S075': 'West',
    'S076': 'West',
    'S077': 'West',
    'S078': 'West',
    'S080': 'West',
    'S081': 'West',
    'S082': 'West',
    'S083': 'West',
    'S084': 'West',
    'S085': 'West',
    'S086': 'West',
    'S087': 'West',
    'S088': 'West',
    'S089': 'West',
    'S090': 'West',
    'S091': 'South',
    'S092': 'South',
    'S094': 'South',
    'S095': 'South',
    'S096': 'West',
    'S097': 'West',
    'S099': 'North',
    'S100': 'North',
    'S101': 'North',
    'S102': 'North',
    'S103': 'West',
    'S104': 'West',
    'S105': 'North',
    'S106': 'West',
    'S107': 'West',
    'S108': 'West',
    'S109': 'West',
    'S110': 'South',
    'S111': 'West',
    'S112': 'North',
    'S113': 'North',
    'S114': 'South',
    'S115': 'South',
    'S116': 'West',
    'S117': 'West',
    'S118': 'West',
    'S119': 'South',
    'S120': 'North',
    'S121': 'North',
    'S122': 'North',
    'S123': 'South',
    'S125': 'South',
    'S126': 'North',
    'S127': 'West',
    'S128': 'West',
    'S129': 'North',
    'S130': 'West',
    'S131': 'South',
    'S132': 'West',
    'S133': 'South',
    'S134': 'West',
    'S135': 'West',
    'S136': 'West',
    'S137': 'West',
    'S138': 'West',
    'S139': 'South',
    'S140': 'South',
    'S141': 'North',
    'S142': 'North',
    'S143': 'South',
    'S144': 'South',
    'S145': 'South',
    'S146': 'South',
    'S147': 'West',
    'S148': 'North',
    'S149': 'South',
    'S150': 'North',
    'S152': 'South',
    'S153': 'North',
    'S154': 'North',
    'S155': 'North',
    'S156': 'South',
    'S157': 'South',
    'S158': 'South',
    'S159': 'South',
    'S161': 'West',
    'S162': 'West',
    'S163': 'West',
    'S164': 'North',
    'S165': 'West',
    'S166': 'North',
    'S167': 'North',
    'S168': 'West',
    'S169': 'West',
    'S170': 'West',
    'S171': 'North',
    'S172': 'North',
    'S173': 'North',
    'S174': 'North',
    'S175': 'West',
    'S176': 'North',
    'S177': 'West',
    'S178': 'South',
    'S180': 'West',
    'S182': 'North',
    'S184': 'South',
    'S185': 'South',
    'S187': 'North',
    'S188': 'North',
    'S189': 'South',
    'S190': 'South',
    'S191': 'South',
    'S192': 'North',
    'S193': 'South',
    'S194': 'West',
    'S195': 'North',
    'S197': 'North',
    'S198': 'North',
    'S199': 'South',
    'S200': 'North',
    'S201': 'South',
    'S202': 'North',
    'S206': 'West',
    'S186': 'West'
  };
  
  // Return the region for the store ID, or 'Unknown' if not found
  return storeRegionMapping[storeId] || 'Unknown';
}