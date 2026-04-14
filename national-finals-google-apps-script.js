// =========================================================================
// NATIONAL FINALS - SENSORY SHEET - GOOGLE APPS SCRIPT
// Semi Automatic Sensory Scoresheet
// Deploy as Web App with "Anyone" access
// =========================================================================

// =========================================================================
// CONFIGURATION
// =========================================================================
var CONFIG = {
  SHEET_NAME: "National Finals - Sensory",
  HEADERS: [
    "Timestamp",                     // 1
    "Participant Name",              // 2
    "Participant Emp ID",            // 3
    "Judge Name",                    // 4
    "Judge ID",                      // 5
    "Store Name",                    // 6
    "Store ID",                      // 7
    "Region",                        // 8
    "Total Score",                   // 9
    "Max Score",                     // 10
    "Percentage",                    // 11
    // Section scores
    "Barista Introduction Score",    // 12
    "Barista Introduction Max",      // 13
    "Espresso Score",                // 14
    "Espresso Max",                  // 15
    "Milk Based Score",              // 16
    "Milk Based Max",                // 17
    "Signature Score",               // 18
    "Signature Max",                 // 19
    "Overall Score",                 // 20
    "Overall Max",                   // 21
    // Time fields
    "Start Time",                    // 22
    "End Time",                      // 23
    "Time Taken",                    // 24
    // Metadata
    "Submission Time",               // 25
    "All Responses (JSON)",          // 26
    "Section Remarks (JSON)",        // 27
    "Comments (JSON)",               // 28
    "Images (JSON)"                  // 29
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
      Number(params.totalScore) || 0,                    // Total Score
      Number(params.maxScore) || 0,                      // Max Score
      Number(params.percent) || 0,                       // Percentage
      // Section scores
      Number(params.BaristaIntroductionScore) || 0,      // Barista Introduction Score
      Number(params.BaristaIntroductionMax) || 0,        // Barista Introduction Max
      Number(params.EspressoScore) || 0,                 // Espresso Score
      Number(params.EspressoMax) || 0,                   // Espresso Max
      Number(params.MilkBasedScore) || 0,                // Milk Based Score
      Number(params.MilkBasedMax) || 0,                  // Milk Based Max
      Number(params.SignatureScore) || 0,                 // Signature Score
      Number(params.SignatureMax) || 0,                   // Signature Max
      Number(params.OverallScore) || 0,                  // Overall Score
      Number(params.OverallMax) || 0,                    // Overall Max
      // Time fields
      params.startTime || "",                             // Start Time
      params.endTime || "",                               // End Time
      params.timeTaken || "",                             // Time Taken
      // Metadata
      params.submissionTime || "",                        // Submission Time
      params.allResponses || "{}",                       // All Responses (JSON)
      params.sectionRemarks || "{}",                     // Section Remarks (JSON)
      params.comments || "{}",                           // Comments (JSON)
      params.images || "{}"                              // Images (JSON)
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "National Finals sensory data logged successfully" }))
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
