// Brew League Regional Round - Google Apps Script Logger
// Deploy this script as a web app with "Anyone" access

function doPost(e) {
  try {
    // Get the active spreadsheet or create a new one
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get or create the "Brew League - Region Round" sheet
    var sheetName = "Brew League - Region Round";
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      
      // Set up headers
      var headers = [
        "Timestamp",
        "Participant Name",
        "Participant Emp ID",
        "Judge Name",
        "Judge ID",
        "Scoresheet Type",
        "Machine Type",
        "Store Name",
        "Store ID",
        "Region",
        "Total Score",
        "Max Score",
        "Percentage",
        "Grooming & Hygiene Score",
        "Espresso Dial-In Score",
        "Espresso Dial-In Shot 1 Score",
        "Espresso Dial-In Shot 2 Score",
        "Dial-In End Time Score",
        "Milk Based Beverages Score",
        "Milk Cup 1 Score",
        "Cup 1 Steaming Score",
        "Cup 1 Pouring Score",
        "Milk Cup 2 Score",
        "Cup 2 Steaming Score",
        "Cup 2 Pouring Score",
        "Milk Cup 3 Score",
        "Cup 3 Steaming Score",
        "Cup 3 Pouring Score",
        "End Time Score",
        "Dial-In Time Taken",
        "Milk Time Taken",
        "Submission Time",
        "All Responses (JSON)",
        "Section Remarks (JSON)",
        "Images (JSON)"
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#4285f4")
        .setFontColor("#ffffff");
      
      // Freeze header row
      sheet.setFrozenRows(1);
      
      // Auto-resize columns
      for (var i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }
    }
    
    // Parse the POST data
    var params = e.parameter;
    
    // Prepare row data
    var rowData = [
      new Date(), // Timestamp
      params.participantName || "",
      params.participantEmpID || "",
      params.judgeName || "",
      params.judgeId || "",
      params.scoresheetType || "",
      params.machineType || "",
      params.storeName || "",
      params.storeID || "",
      params.region || "",
      params.totalScore || 0,
      params.maxScore || 0,
      params.percent || 0,
      params.GroomingHygieneScore || 0,
      params.EspressoDialInScore || 0,
      params.EspressoDialInShot1Score || 0,
      params.EspressoDialInShot2Score || 0,
      params.DialInEndTimeScore || 0,
      params.MilkBasedBeveragesScore || 0,
      params.MilkCup1Score || 0,
      params.Cup1SteamingScore || 0,
      params.Cup1PouringScore || 0,
      params.MilkCup2Score || 0,
      params.Cup2SteamingScore || 0,
      params.Cup2PouringScore || 0,
      params.MilkCup3Score || 0,
      params.Cup3SteamingScore || 0,
      params.Cup3PouringScore || 0,
      params.EndTimeScore || 0,
      params.dialInTimeTaken || "",
      params.milkTimeTaken || "",
      params.submissionTime || "",
      params.allResponses || "{}",
      params.sectionRemarks || "{}",
      params.images || "{}"
    ];
    
    // Append the row
    sheet.appendRow(rowData);
    
    // Format the new row
    var lastRow = sheet.getLastRow();
    
    // Format percentage column (now column 13 instead of 12)
    if (params.percent) {
      sheet.getRange(lastRow, 13).setNumberFormat("0.00\"%\"");
    }
    
    // Format score columns (updated for new column positions)
    var scoreColumns = [11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
    scoreColumns.forEach(function(col) {
      sheet.getRange(lastRow, col).setNumberFormat("0");
    });
    
    // Format timestamp
    sheet.getRange(lastRow, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data logged successfully",
      row: lastRow
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handle GET requests (for testing)
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Brew League Regional Round Logger is active",
    timestamp: new Date()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test function to create sample data
function testCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Brew League - Region Round";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("Sheet does not exist. It will be created on first POST.");
  } else {
    Logger.log("Sheet already exists with " + sheet.getLastRow() + " rows.");
  }
}

// Function to add conditional formatting for scores
function addConditionalFormatting() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Brew League - Region Round");
  
  if (!sheet) {
    Logger.log("Sheet not found!");
    return;
  }
  
  var lastRow = sheet.getLastRow();
  
  // Apply conditional formatting to percentage column (M - now column 13)
  var percentRange = sheet.getRange(2, 13, lastRow - 1, 1);
  
  // Red for < 70%
  var redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(70)
    .setBackground("#f4cccc")
    .setRanges([percentRange])
    .build();
  
  // Yellow for 70-89%
  var yellowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(70, 89)
    .setBackground("#fff2cc")
    .setRanges([percentRange])
    .build();
  
  // Green for >= 90%
  var greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(90)
    .setBackground("#d9ead3")
    .setRanges([percentRange])
    .build();
  
  var rules = sheet.getConditionalFormatRules();
  rules.push(redRule);
  rules.push(yellowRule);
  rules.push(greenRule);
  sheet.setConditionalFormatRules(rules);
  
  Logger.log("Conditional formatting applied successfully!");
}
