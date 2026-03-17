// =========================================================================
// BREW LEAGUE REGION ROUND - COMPLETE GOOGLE APPS SCRIPT
// Handles both submissions (POST) and data fetching (GET)
// Deploy as Web App with "Anyone" access
// =========================================================================

// =========================================================================
// CONFIGURATION
// =========================================================================
var CONFIG = {
  SHEET_NAME: "Brew League - Region Round",
  HEADERS: [
    "Timestamp",                     // 1
    "Participant Name",              // 2
    "Participant Emp ID",            // 3
    "Judge Name",                    // 4
    "Judge ID",                      // 5
    "Scoresheet Type",               // 6
    "Machine Type",                  // 7
    "Store Name",                    // 8
    "Store ID",                      // 9
    "Region",                        // 10
    "Beverage Name",                 // 11
    "Total Score",                   // 12
    "Max Score",                     // 13
    "Percentage",                    // 14
    // Technical section scores + max
    "Grooming & Hygiene Score",      // 15
    "Grooming & Hygiene Max",        // 16
    "Espresso Dial-In Score",        // 17
    "Espresso Dial-In Max",          // 18
    "Espresso Shot 1 Score",         // 19
    "Espresso Shot 1 Max",           // 20
    "Espresso Shot 2 Score",         // 21
    "Espresso Shot 2 Max",           // 22
    "Dial-In End Time Score",        // 23
    "Milk Beverages Score",          // 24
    "Cup 1 Score",                   // 25
    "Cup 1 Max",                     // 26
    "Cup 1 Steaming Score",          // 27
    "Cup 1 Steaming Max",            // 28
    "Cup 1 Pouring Score",           // 29
    "Cup 1 Pouring Max",             // 30
    "Cup 2 Score",                   // 31
    "Cup 2 Max",                     // 32
    "Cup 2 Steaming Score",          // 33
    "Cup 2 Steaming Max",            // 34
    "Cup 2 Pouring Score",           // 35
    "Cup 2 Pouring Max",             // 36
    "Cup 3 Score",                   // 37
    "Cup 3 Max",                     // 38
    "Cup 3 Steaming Score",          // 39
    "Cup 3 Steaming Max",            // 40
    "Cup 3 Pouring Score",           // 41
    "Cup 3 Pouring Max",             // 42
    "End Time Score",                // 43
    "End Time Max",                  // 44
    // Sensory scores
    "Sensory Score",                 // 45
    "Sensory Score Max",             // 46
    // Time fields
    "Dial-In Start Time",            // 47
    "Dial-In End Time",              // 48
    "Milk Start Time",               // 49
    "Milk End Time",                 // 50
    "Dial-In Time Taken",            // 51
    "Milk Time Taken",               // 52
    // Metadata
    "Submission Time",               // 53
    "All Responses (JSON)",          // 54
    "Section Remarks (JSON)",        // 55
    "Images (JSON)"                  // 56
  ]
};

// =========================================================================
// POST REQUEST HANDLER - Log Brew League Region Round Submission
// =========================================================================
function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = createRegionRoundSheet(ss);
    }

    // Parse POST parameters
    var params = e.parameter;

    // Prepare row data matching CONFIG.HEADERS order
    var rowData = [
      new Date(),                                          // Timestamp
      params.participantName || "",                        // Participant Name
      params.participantEmpID || "",                       // Participant Emp ID
      params.judgeName || "",                               // Judge Name
      params.judgeId || "",                                 // Judge ID
      params.scoresheetType || "",                          // Scoresheet Type
      params.machineType || "",                             // Machine Type
      params.storeName || "",                               // Store Name
      params.storeID || "",                                 // Store ID
      params.region || "",                                  // Region
      params.beverageName || "",                            // Beverage Name
      parseFloat(params.totalScore) || 0,                   // Total Score
      parseFloat(params.maxScore) || 0,                     // Max Score
      parseFloat(params.percent) || 0,                      // Percentage
      // Technical section scores + max
      parseFloat(params.GroomingHygieneScore) || 0,         // 15
      parseFloat(params.GroomingHygieneMax) || 0,           // 16
      parseFloat(params.EspressoDialInScore) || 0,          // 17
      parseFloat(params.EspressoDialInMax) || 0,            // 18
      parseFloat(params.EspressoDialInShot1Score) || 0,     // 19
      parseFloat(params.EspressoDialInShot1Max) || 0,       // 20
      parseFloat(params.EspressoDialInShot2Score) || 0,     // 21
      parseFloat(params.EspressoDialInShot2Max) || 0,       // 22
      parseFloat(params.DialInEndTimeScore) || 0,           // 23
      parseFloat(params.MilkBasedBeveragesScore) || 0,      // 24
      parseFloat(params.MilkCup1Score) || 0,                // 25
      parseFloat(params.MilkCup1Max) || 0,                  // 26
      parseFloat(params.Cup1SteamingScore) || 0,            // 27
      parseFloat(params.Cup1SteamingMax) || 0,              // 28
      parseFloat(params.Cup1PouringScore) || 0,             // 29
      parseFloat(params.Cup1PouringMax) || 0,               // 30
      parseFloat(params.MilkCup2Score) || 0,                // 31
      parseFloat(params.MilkCup2Max) || 0,                  // 32
      parseFloat(params.Cup2SteamingScore) || 0,            // 33
      parseFloat(params.Cup2SteamingMax) || 0,              // 34
      parseFloat(params.Cup2PouringScore) || 0,             // 35
      parseFloat(params.Cup2PouringMax) || 0,               // 36
      parseFloat(params.MilkCup3Score) || 0,                // 37
      parseFloat(params.MilkCup3Max) || 0,                  // 38
      parseFloat(params.Cup3SteamingScore) || 0,            // 39
      parseFloat(params.Cup3SteamingMax) || 0,              // 40
      parseFloat(params.Cup3PouringScore) || 0,             // 41
      parseFloat(params.Cup3PouringMax) || 0,               // 42
      parseFloat(params.EndTimeScore) || 0,                 // 43
      parseFloat(params.EndTimeMax) || 0,                   // 44
      // Sensory
      parseFloat(params.SensoryScoreTotal) || 0,            // 45
      parseFloat(params.SensoryScoreMax) || 0,              // 46
      // Time fields
      params.dialInStartTime || "",                         // 47
      params.dialInEndTime || "",                           // 48
      params.milkStartTime || "",                           // 49
      params.milkEndTime || "",                             // 50
      params.dialInTimeTaken || "",                          // 51
      params.milkTimeTaken || "",                            // 52
      // Metadata
      params.submissionTime || new Date().toISOString(),     // 53
      params.allResponses || "{}",                          // 54
      params.sectionRemarks || "{}",                        // 55
      params.images || "{}"                                 // 56
    ];

    // Append the row
    sheet.appendRow(rowData);
    var lastRow = sheet.getLastRow();

    // Format the new row
    formatRegionRoundRow(sheet, lastRow);

    // Log success
    Logger.log("Region Round submission: Participant=" + params.participantName + ", Judge=" + params.judgeName + ", Score=" + params.percent + "%");

    lock.releaseLock();

    return createJsonResponse({
      status: "success",
      message: "Brew League Region Round data logged successfully",
      row: lastRow,
      timestamp: new Date().toISOString(),
      participantName: params.participantName,
      scorePercentage: params.percent
    });

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return createJsonResponse({
      status: "error",
      message: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

// =========================================================================
// GET REQUEST HANDLER - Fetch Brew League Region Round Data
// =========================================================================
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      return createJsonResponse({
        error: "Sheet not found",
        sheetName: CONFIG.SHEET_NAME
      });
    }

    // Get query parameters
    var params = e.parameter || {};
    var filterRegion = params.region;
    var filterParticipant = params.participant;
    var filterJudge = params.judge;
    var filterStore = params.store;
    var filterType = params.scoresheetType || params.type;
    var limit = parseInt(params.limit) || null;

    // Get all data
    var data = sheet.getDataRange().getValues();

    if (data.length === 0) {
      return createJsonResponse({ data: [], count: 0 });
    }

    // Determine headers vs data rows
    var headers;
    var rows;

    if (data.length >= 1) {
      headers = data[0];
      rows = data.slice(1);

      // If first row looks like data (starts with date), use CONFIG.HEADERS
      var firstCell = data[0][0];
      if (firstCell instanceof Date ||
          (typeof firstCell === 'string' && firstCell.match(/^\d{4}-\d{2}-\d{2}/)) ||
          (typeof firstCell === 'number' && firstCell > 40000)) {
        headers = CONFIG.HEADERS;
        rows = data;
      }
    } else {
      headers = CONFIG.HEADERS;
      rows = [];
    }

    // Convert rows to JSON objects
    var jsonData = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(header, index) {
        if (header && index < row.length) {
          obj[header] = row[index];
        }
      });
      return obj;
    });

    // Apply filters
    if (filterRegion) {
      jsonData = jsonData.filter(function(row) {
        return row.Region && row.Region.toString().toLowerCase() === filterRegion.toLowerCase();
      });
    }

    if (filterParticipant) {
      jsonData = jsonData.filter(function(row) {
        return row["Participant Name"] &&
          row["Participant Name"].toString().toLowerCase().includes(filterParticipant.toLowerCase());
      });
    }

    if (filterJudge) {
      jsonData = jsonData.filter(function(row) {
        return row["Judge Name"] &&
          row["Judge Name"].toString().toLowerCase().includes(filterJudge.toLowerCase());
      });
    }

    if (filterStore) {
      jsonData = jsonData.filter(function(row) {
        return (row["Store Name"] && row["Store Name"].toString().toLowerCase().includes(filterStore.toLowerCase())) ||
               (row["Store ID"] && row["Store ID"].toString().toLowerCase() === filterStore.toLowerCase());
      });
    }

    if (filterType) {
      jsonData = jsonData.filter(function(row) {
        return row["Scoresheet Type"] && row["Scoresheet Type"].toString().toLowerCase() === filterType.toLowerCase();
      });
    }

    // Sort by timestamp (newest first)
    jsonData.sort(function(a, b) {
      return new Date(b.Timestamp) - new Date(a.Timestamp);
    });

    // Apply limit
    if (limit && limit > 0) {
      jsonData = jsonData.slice(0, limit);
    }

    // Build response
    var response = {
      data: jsonData,
      count: jsonData.length,
      totalRecords: rows.length,
      lastUpdated: new Date().toISOString(),
      filters: {
        region: filterRegion || null,
        participant: filterParticipant || null,
        judge: filterJudge || null,
        store: filterStore || null,
        scoresheetType: filterType || null,
        limit: limit
      }
    };

    return createJsonResponse(response);

  } catch (error) {
    Logger.log("Error in doGet: " + error.toString());
    return createJsonResponse({
      error: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Creates the Region Round sheet with proper formatting
 */
function createRegionRoundSheet(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  // Set headers
  sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);

  // Format header row
  sheet.getRange(1, 1, 1, CONFIG.HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#4285f4")  // Blue for Region Round
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set column widths for key columns
  sheet.setColumnWidth(1, 160);   // Timestamp
  sheet.setColumnWidth(2, 160);   // Participant Name
  sheet.setColumnWidth(4, 150);   // Judge Name
  sheet.setColumnWidth(8, 150);   // Store Name
  sheet.setColumnWidth(10, 120);  // Region
  sheet.setColumnWidth(11, 140);  // Beverage Name
  sheet.setColumnWidth(14, 100);  // Percentage

  // Auto-resize remaining columns
  for (var i = 1; i <= CONFIG.HEADERS.length; i++) {
    if ([1, 2, 4, 8, 10, 11, 14].indexOf(i) === -1) {
      sheet.autoResizeColumn(i);
    }
  }

  Logger.log("Created new sheet: " + CONFIG.SHEET_NAME);
  return sheet;
}

/**
 * Formats a Region Round data row
 */
function formatRegionRoundRow(sheet, rowNumber) {
  // Format percentage column (column 14)
  sheet.getRange(rowNumber, 14)
    .setNumberFormat("0.00\"%\"")
    .setHorizontalAlignment("center");

  // Format score columns (12-46 are numeric)
  for (var col = 12; col <= 46; col++) {
    if (col !== 14) { // Skip percentage (already formatted)
      sheet.getRange(rowNumber, col)
        .setNumberFormat("0")
        .setHorizontalAlignment("center");
    }
  }

  // Format timestamp (column 1)
  sheet.getRange(rowNumber, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");

  // Apply color to percentage cell
  var percentValue = sheet.getRange(rowNumber, 14).getValue();
  var bgColor = "#ffffff";

  if (percentValue < 70) {
    bgColor = "#f4cccc"; // Light red
  } else if (percentValue >= 70 && percentValue < 90) {
    bgColor = "#fff2cc"; // Light yellow
  } else if (percentValue >= 90) {
    bgColor = "#d9ead3"; // Light green
  }

  sheet.getRange(rowNumber, 14).setBackground(bgColor);
}

/**
 * Creates a JSON response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// ADMIN & UTILITY FUNCTIONS
// =========================================================================

/**
 * Test function to verify sheet setup
 */
function testSheetSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    Logger.log("Sheet does not exist. It will be created on first POST.");
  } else {
    Logger.log("Sheet exists with " + sheet.getLastRow() + " rows (including header).");
    Logger.log("Total Region Round submissions: " + (sheet.getLastRow() - 1));
  }
}

/**
 * Apply conditional formatting rules to the percentage column
 */
function addConditionalFormatting() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    Logger.log("Sheet not found!");
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log("No data rows to format.");
    return;
  }

  var percentRange = sheet.getRange(2, 14, lastRow - 1, 1);

  // Clear existing rules
  sheet.clearConditionalFormatRules();

  var redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(70)
    .setBackground("#f4cccc")
    .setFontColor("#990000")
    .setRanges([percentRange])
    .build();

  var yellowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(70, 89)
    .setBackground("#fff2cc")
    .setFontColor("#7f6000")
    .setRanges([percentRange])
    .build();

  var greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(90)
    .setBackground("#d9ead3")
    .setFontColor("#274e13")
    .setRanges([percentRange])
    .build();

  sheet.setConditionalFormatRules([redRule, yellowRule, greenRule]);

  Logger.log("Conditional formatting applied successfully!");
}

/**
 * Get statistics about Region Round submissions
 */
function getRegionRoundStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    Logger.log("Sheet not found!");
    return;
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);

  if (rows.length === 0) {
    Logger.log("No data found.");
    return;
  }

  var percentCol = headers.indexOf("Percentage");
  var regionCol = headers.indexOf("Region");
  var participantCol = headers.indexOf("Participant Name");
  var typeCol = headers.indexOf("Scoresheet Type");

  var totalSubmissions = rows.length;
  var avgPercentage = rows.reduce(function(sum, row) { return sum + (row[percentCol] || 0); }, 0) / totalSubmissions;

  var regions = [];
  var participants = [];
  var types = { technical: 0, sensory: 0 };

  rows.forEach(function(row) {
    var r = row[regionCol];
    if (r && regions.indexOf(r) === -1) regions.push(r);

    var p = row[participantCol];
    if (p && participants.indexOf(p) === -1) participants.push(p);

    var t = (row[typeCol] || "").toString().toLowerCase();
    if (t === "technical") types.technical++;
    else if (t === "sensory") types.sensory++;
  });

  var topPerformers = rows
    .slice()
    .sort(function(a, b) { return (b[percentCol] || 0) - (a[percentCol] || 0); })
    .slice(0, 5)
    .map(function(row) { return row[participantCol] + " (" + row[regionCol] + "): " + row[percentCol] + "%"; });

  Logger.log("BREW LEAGUE REGION ROUND STATISTICS");
  Logger.log("====================================");
  Logger.log("Total Submissions: " + totalSubmissions);
  Logger.log("Average Score: " + avgPercentage.toFixed(2) + "%");
  Logger.log("Regions: " + regions.length + " (" + regions.join(", ") + ")");
  Logger.log("Unique Participants: " + participants.length);
  Logger.log("Technical Scoresheets: " + types.technical);
  Logger.log("Sensory Scoresheets: " + types.sensory);
  Logger.log("\nTop 5 Performers:");
  topPerformers.forEach(function(p, i) { Logger.log("  " + (i + 1) + ". " + p); });
}

// =========================================================================
// DEPLOYMENT INSTRUCTIONS
// =========================================================================
/*

DEPLOYMENT STEPS:

1. Open your Google Sheet (the one with Brew League data)
2. Go to Extensions > Apps Script
3. Delete any existing code and paste this entire script
4. Save the project (Ctrl+S)
5. Click "Deploy" > "New deployment"
6. Settings:
   - Type: Web app
   - Description: "Brew League Region Round API"
   - Execute as: Me
   - Who has access: Anyone
7. Click "Deploy"
8. Copy the Web App URL
9. Update the LOG_ENDPOINTS in BrewLeagueRegionRound.tsx with the new URL

IMPORTANT: If you already have a deployment, go to
"Deploy" > "Manage deployments" > Edit > New Version > Deploy
to update without changing the URL.

API USAGE:

POST (Submit Region Round Data):
  URL: [Your Web App URL]
  Method: POST
  Content-Type: application/x-www-form-urlencoded

  All parameters sent by the BrewLeagueRegionRound component:
    participantName, participantEmpID, judgeName, judgeId,
    scoresheetType, machineType, storeName, storeID, region,
    beverageName, totalScore, maxScore, percent,
    GroomingHygieneScore/Max, EspressoDialInScore/Max,
    EspressoDialInShot1Score/Max, EspressoDialInShot2Score/Max,
    DialInEndTimeScore, MilkBasedBeveragesScore,
    MilkCup1Score/Max, Cup1SteamingScore/Max, Cup1PouringScore/Max,
    MilkCup2Score/Max, Cup2SteamingScore/Max, Cup2PouringScore/Max,
    MilkCup3Score/Max, Cup3SteamingScore/Max, Cup3PouringScore/Max,
    EndTimeScore/Max, SensoryScoreTotal/Max,
    dialInStartTime, dialInEndTime, milkStartTime, milkEndTime,
    dialInTimeTaken, milkTimeTaken, submissionTime,
    allResponses (JSON), sectionRemarks (JSON), images (JSON)

GET (Fetch Region Round Data for Dashboard):
  URL: [Your Web App URL]
  Method: GET

  Query Parameters (all optional):
    - region:         Filter by region (exact match)
    - participant:    Filter by participant name (partial match)
    - judge:          Filter by judge name (partial match)
    - store:          Filter by store name or ID (partial match)
    - scoresheetType: Filter by "technical" or "sensory"
    - limit:          Max number of results

  Examples:
    Get all data:          [URL]
    Filter by region:      [URL]?region=North
    Filter by participant: [URL]?participant=Amit
    Filter by type:        [URL]?type=sensory
    Combined:              [URL]?region=South&type=technical&limit=20

  Response format:
  {
    "data": [ { ...row objects with header keys... } ],
    "count": 10,
    "totalRecords": 50,
    "lastUpdated": "2026-02-23T...",
    "filters": { "region": "North", ... }
  }

TESTING:

1. Run testSheetSetup() to verify the sheet exists
2. Run addConditionalFormatting() to apply color coding
3. Run getRegionRoundStats() to view submission statistics

SHEET COLOR CODING:
  - Header: Blue (#4285f4) - Region Round
  - Scores:
    Red:    < 70%
    Yellow: 70-89%
    Green:  >= 90%

*/
