// =========================================================================
// NATIONAL FINALS - TECHNICAL / SENSORY SHEET - GOOGLE APPS SCRIPT
// Semi Automatic Scoresheet (supports both Technical & Sensory)
// Deploy as Web App with "Anyone" access
// =========================================================================

// =========================================================================
// CONFIGURATION
// =========================================================================
var CONFIG = {
  SHEET_NAME: "National Finals",
  HEADERS: [
    "Timestamp",                     // 1
    "Participant Name",              // 2
    "Participant Emp ID",            // 3
    "Judge Name",                    // 4
    "Judge ID",                      // 5
    "Store Name",                    // 6
    "Store ID",                      // 7
    "Region",                        // 8
    "Scoresheet Type",               // 9
    "Total Score",                   // 10
    "Max Score",                     // 11
    "Percentage",                    // 12
    // Time fields
    "Start Time",                    // 13
    "End Time",                      // 14
    "Time Taken",                    // 15
    // Metadata
    "Submission Time",               // 16
    "Section Scores (JSON)",         // 17
    "Section Max (JSON)",            // 18
    "All Responses (JSON)",          // 19
    "Section Remarks (JSON)",        // 20
    "Comments (JSON)",               // 21
    "Images (JSON)"                  // 22
  ]
};

// =========================================================================
// POST REQUEST HANDLER - Log National Finals Sensory Submission
// =========================================================================
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var params = e.parameter;

    var row = [
      new Date().toISOString(),                          // Timestamp
      params.participantName || "",                      // Participant Name
      params.participantEmpID || "",                     // Participant Emp ID
      params.judgeName || "",                             // Judge Name
      params.judgeId || "",                               // Judge ID
      params.storeName || "",                             // Store Name
      params.storeID || "",                               // Store ID
      params.region || "",                                // Region
      params.scoresheetType || "sensory",                // Scoresheet Type
      Number(params.totalScore) || 0,                    // Total Score
      Number(params.maxScore) || 0,                      // Max Score
      Number(params.percent) || 0,                       // Percentage
      // Time fields
      params.startTime || "",                             // Start Time
      params.endTime || "",                               // End Time
      params.timeTaken || "",                             // Time Taken
      // Metadata
      params.submissionTime || "",                        // Submission Time
      params.sectionScores || "{}",                      // Section Scores (JSON)
      params.sectionMax || "{}",                         // Section Max (JSON)
      params.allResponses || "{}",                       // All Responses (JSON)
      params.sectionRemarks || "{}",                     // Section Remarks (JSON)
      params.comments || "{}",                           // Comments (JSON)
      params.images || "{}"                              // Images (JSON)
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "National Finals data logged successfully" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// GET REQUEST HANDLER - Fetch National Finals Sensory Data
// =========================================================================
function doGet(e) {
  try {
    var action = (e.parameter.action || "fetch").toLowerCase();

    if (action === "fetch") {
      return fetchSubmissions();
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Unknown action: " + action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// FETCH ALL SUBMISSIONS
// =========================================================================
function fetchSubmissions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0];
  var submissions = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    submissions.push(row);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success", data: submissions }))
    .setMimeType(ContentService.MimeType.JSON);
}
