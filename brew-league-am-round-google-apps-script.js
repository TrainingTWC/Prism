// =========================================================================
// BREW LEAGUE AM ROUND - COMPLETE GOOGLE APPS SCRIPT
// Handles both submissions (POST) and data fetching (GET)
// Deploy as Web App with "Anyone" access
// =========================================================================

// =========================================================================
// CONFIGURATION
// =========================================================================
const CONFIG = {
  SHEET_NAME: "Brew League - AM Round",
  HEADERS: [
    "Timestamp",
    "Participant Name",
    "Participant Emp ID",
    "Judge Name",
    "Judge ID",
    "Scoresheet Type",
    "Machine Type",
    "Store Name",
    "Store ID",
    "Area Manager",
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
    "End Time Score",
    "Dial-In Time Taken",
    "Milk Time Taken",
    "Submission Time",
    "All Responses (JSON)",
    "Section Remarks (JSON)",
    "Images (JSON)"
  ]
};

// =========================================================================
// POST REQUEST HANDLER - Submit Brew League AM Round Data
// =========================================================================
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = createBrewLeagueAMSheet(ss);
    }
    
    // Parse POST parameters
    const params = e.parameter;
    
    // Prepare row data
    const rowData = [
      new Date(), // Timestamp
      params.participantName || "",
      params.participantEmpID || "",
      params.judgeName || "",
      params.judgeId || "",
      params.scoresheetType || "",
      params.machineType || "",
      params.storeName || "",
      params.storeID || "",
      params.areaManager || "",
      params.region || "",
      parseFloat(params.totalScore) || 0,
      parseFloat(params.maxScore) || 0,
      parseFloat(params.percent) || 0,
      parseFloat(params.GroomingHygieneScore) || 0,
      parseFloat(params.EspressoDialInScore) || 0,
      parseFloat(params.EspressoDialInShot1Score) || 0,
      parseFloat(params.EspressoDialInShot2Score) || 0,
      parseFloat(params.DialInEndTimeScore) || 0,
      parseFloat(params.MilkBasedBeveragesScore) || 0,
      parseFloat(params.MilkCup1Score) || 0,
      parseFloat(params.Cup1SteamingScore) || 0,
      parseFloat(params.Cup1PouringScore) || 0,
      parseFloat(params.MilkCup2Score) || 0,
      parseFloat(params.Cup2SteamingScore) || 0,
      parseFloat(params.Cup2PouringScore) || 0,
      parseFloat(params.EndTimeScore) || 0,
      params.dialInTimeTaken || "",
      params.milkTimeTaken || "",
      params.submissionTime || new Date().toISOString(),
      params.allResponses || "{}",
      params.sectionRemarks || "{}",
      params.images || "{}"
    ];
    
    // Append the row
    sheet.appendRow(rowData);
    const lastRow = sheet.getLastRow();
    
    // Format the new row
    formatBrewLeagueAMRow(sheet, lastRow);
    
    // Log success
    Logger.log(`Brew League AM Round submission: Participant=${params.participantName}, Judge=${params.judgeName}, AM=${params.areaManager}, Score=${params.percent}%`);
    
    return createJsonResponse({
      status: "success",
      message: "Brew League AM Round data logged successfully",
      row: lastRow,
      timestamp: new Date().toISOString(),
      participantName: params.participantName,
      areaManager: params.areaManager,
      scorePercentage: params.percent
    });
    
  } catch (error) {
    Logger.log(`Error in doPost: ${error.toString()}`);
    return createJsonResponse({
      status: "error",
      message: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

// =========================================================================
// GET REQUEST HANDLER - Fetch Brew League AM Round Data
// =========================================================================
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return createJsonResponse({ 
        error: "Sheet not found",
        sheetName: CONFIG.SHEET_NAME 
      });
    }
    
    // Get query parameters
    const params = e.parameter || {};
    const filterRegion = params.region;
    const filterAM = params.areaManager || params.am;
    const filterParticipant = params.participant;
    const filterJudge = params.judge;
    const limit = parseInt(params.limit) || null;
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return createJsonResponse([]);
    }
    
    // Check if first row contains headers or data
    // If first row starts with a date/timestamp, assume no headers
    const firstCell = data[0][0];
    let headers;
    let rows;
    
    // Check if first cell is a date or looks like a timestamp
    const hasHeaders = !(firstCell instanceof Date || 
                        (typeof firstCell === 'string' && firstCell.match(/^\d{4}-\d{2}-\d{2}/)) ||
                        (typeof firstCell === 'number' && firstCell > 40000)); // Excel date serial
    
    if (hasHeaders) {
      // Sheet has headers in first row
      headers = data[0];
      rows = data.slice(1);
    } else {
      // Sheet has no headers, use CONFIG.HEADERS
      headers = CONFIG.HEADERS;
      rows = data;
    }
    
    // Convert to JSON objects
    let jsonData = rows.map(function(row) {
      const obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    });
    
    // Apply filters if provided
    if (filterRegion) {
      jsonData = jsonData.filter(row => 
        row.Region && row.Region.toString().toLowerCase() === filterRegion.toLowerCase()
      );
    }
    
    if (filterAM) {
      jsonData = jsonData.filter(row => 
        row["Area Manager"] && 
        row["Area Manager"].toString().toLowerCase().includes(filterAM.toLowerCase())
      );
    }
    
    if (filterParticipant) {
      jsonData = jsonData.filter(row => 
        row["Participant Name"] && 
        row["Participant Name"].toString().toLowerCase().includes(filterParticipant.toLowerCase())
      );
    }
    
    if (filterJudge) {
      jsonData = jsonData.filter(row => 
        row["Judge Name"] && 
        row["Judge Name"].toString().toLowerCase().includes(filterJudge.toLowerCase())
      );
    }
    
    // Sort by timestamp (newest first)
    jsonData.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
    
    // Apply limit if specified
    if (limit && limit > 0) {
      jsonData = jsonData.slice(0, limit);
    }
    
    // Add metadata
    const response = {
      data: jsonData,
      count: jsonData.length,
      totalRecords: rows.length,
      lastUpdated: new Date().toISOString(),
      filters: {
        region: filterRegion || null,
        areaManager: filterAM || null,
        participant: filterParticipant || null,
        judge: filterJudge || null,
        limit: limit
      }
    };
    
    return createJsonResponse(response);
    
  } catch (error) {
    Logger.log(`Error in doGet: ${error.toString()}`);
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
 * Creates the Brew League AM Round sheet with proper formatting
 */
function createBrewLeagueAMSheet(ss) {
  const sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  
  // Set headers
  sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
  
  // Format header row
  sheet.getRange(1, 1, 1, CONFIG.HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#e67e22") // Orange for AM Round
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Auto-resize columns
  for (let i = 1; i <= CONFIG.HEADERS.length; i++) {
    sheet.autoResizeColumn(i);
  }
  
  // Set column widths for specific columns
  sheet.setColumnWidth(1, 150);  // Timestamp
  sheet.setColumnWidth(2, 150);  // Participant Name
  sheet.setColumnWidth(4, 150);  // Judge Name
  sheet.setColumnWidth(8, 150);  // Store Name
  sheet.setColumnWidth(10, 150); // Area Manager
  sheet.setColumnWidth(11, 120); // Region
  sheet.setColumnWidth(14, 100); // Percentage
  
  Logger.log(`Created new sheet: ${CONFIG.SHEET_NAME}`);
  
  return sheet;
}

/**
 * Formats a Brew League AM Round data row
 */
function formatBrewLeagueAMRow(sheet, rowNumber) {
  // Format percentage column (column 14)
  sheet.getRange(rowNumber, 14).setNumberFormat("0.00\"%\"");
  
  // Format score columns (12, 13, 15-30)
  const scoreColumns = [12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  scoreColumns.forEach(function(col) {
    sheet.getRange(rowNumber, col)
      .setNumberFormat("0")
      .setHorizontalAlignment("center");
  });
  
  // Format timestamp (column 1)
  sheet.getRange(rowNumber, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
  
  // Apply conditional formatting based on percentage
  const percentValue = sheet.getRange(rowNumber, 14).getValue();
  let bgColor = "#ffffff"; // Default white
  
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    Logger.log("❌ Sheet does not exist. It will be created on first POST.");
  } else {
    Logger.log(`✅ Sheet exists with ${sheet.getLastRow()} rows (including header).`);
    Logger.log(`📊 Total AM Round submissions: ${sheet.getLastRow() - 1}`);
  }
}

/**
 * Add conditional formatting rules to the entire sheet
 */
function addConditionalFormatting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    Logger.log("❌ Sheet not found!");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log("⚠️ No data rows to format.");
    return;
  }
  
  // Percentage column (column 14)
  const percentRange = sheet.getRange(2, 14, lastRow - 1, 1);
  
  // Clear existing rules
  sheet.clearConditionalFormatRules();
  
  // Red for < 70%
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(70)
    .setBackground("#f4cccc")
    .setFontColor("#990000")
    .setRanges([percentRange])
    .build();
  
  // Yellow for 70-89%
  const yellowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(70, 89)
    .setBackground("#fff2cc")
    .setFontColor("#7f6000")
    .setRanges([percentRange])
    .build();
  
  // Green for >= 90%
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(90)
    .setBackground("#d9ead3")
    .setFontColor("#274e13")
    .setRanges([percentRange])
    .build();
  
  sheet.setConditionalFormatRules([redRule, yellowRule, greenRule]);
  
  Logger.log("✅ Conditional formatting applied successfully!");
}

/**
 * Generate sample test data for development
 */
function generateSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    sheet = createBrewLeagueAMSheet(ss);
  }
  
  const sampleData = [
    ["Amit Kumar", "EMP001", "Rajesh Sharma", "J001", "Manual", "La Marzocco", "Store 123", "S123", "AM Rohit", "North", 87, 100, 87],
    ["Priya Singh", "EMP002", "Meera Patel", "J002", "Manual", "Victoria Arduino", "Store 456", "S456", "AM Priya", "South", 94, 100, 94],
    ["Rahul Verma", "EMP003", "Rajesh Sharma", "J001", "Manual", "La Marzocco", "Store 789", "S789", "AM Suresh", "East", 72, 100, 72],
    ["Sneha Reddy", "EMP004", "Meera Patel", "J002", "Manual", "Nuova Simonelli", "Store 321", "S321", "AM Kavita", "West", 81, 100, 81],
    ["Vikram Joshi", "EMP005", "Rajesh Sharma", "J001", "Automatic", "La Marzocco", "Store 654", "S654", "AM Rohit", "North", 96, 100, 96]
  ];
  
  sampleData.forEach(data => {
    const rowData = [
      new Date(),
      ...data,
      10, 40, 20, 20, 10, 30, 10, 5, 5, 10, 5, 5, 10, 5, 5, 10,
      "2:30", "5:45", new Date().toISOString(), "{}", "{}", "{}"
    ];
    
    sheet.appendRow(rowData);
    formatBrewLeagueAMRow(sheet, sheet.getLastRow());
  });
  
  Logger.log(`✅ Generated ${sampleData.length} sample AM Round records`);
}

/**
 * Get statistics about Brew League AM Round submissions
 */
function getBrewLeagueAMStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    Logger.log("❌ Sheet not found!");
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  if (rows.length === 0) {
    Logger.log("⚠️ No data found");
    return;
  }
  
  // Find column indices
  const percentCol = headers.indexOf("Percentage");
  const regionCol = headers.indexOf("Region");
  const amCol = headers.indexOf("Area Manager");
  const participantCol = headers.indexOf("Participant Name");
  
  // Calculate statistics
  const totalSubmissions = rows.length;
  const avgPercentage = rows.reduce((sum, row) => sum + (row[percentCol] || 0), 0) / totalSubmissions;
  
  const regions = [...new Set(rows.map(row => row[regionCol]))].filter(Boolean);
  const areaManagers = [...new Set(rows.map(row => row[amCol]))].filter(Boolean);
  const participants = [...new Set(rows.map(row => row[participantCol]))].filter(Boolean);
  
  const topPerformers = rows
    .sort((a, b) => (b[percentCol] || 0) - (a[percentCol] || 0))
    .slice(0, 5)
    .map(row => `${row[participantCol]} (${row[amCol]}): ${row[percentCol]}%`);
  
  const amPerformance = {};
  rows.forEach(row => {
    const am = row[amCol];
    if (am) {
      if (!amPerformance[am]) {
        amPerformance[am] = { count: 0, total: 0 };
      }
      amPerformance[am].count++;
      amPerformance[am].total += (row[percentCol] || 0);
    }
  });
  
  const amStats = Object.entries(amPerformance)
    .map(([am, stats]) => ({
      am,
      avg: (stats.total / stats.count).toFixed(2),
      count: stats.count
    }))
    .sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));
  
  Logger.log("📊 BREW LEAGUE AM ROUND STATISTICS");
  Logger.log("==================================");
  Logger.log(`Total Submissions: ${totalSubmissions}`);
  Logger.log(`Average Score: ${avgPercentage.toFixed(2)}%`);
  Logger.log(`Regions Covered: ${regions.length} (${regions.join(", ")})`);
  Logger.log(`Area Managers Involved: ${areaManagers.length}`);
  Logger.log(`Unique Participants: ${participants.length}`);
  Logger.log("\n🏆 Top 5 Performers:");
  topPerformers.forEach((p, i) => Logger.log(`  ${i + 1}. ${p}`));
  Logger.log("\n📈 Area Manager Performance:");
  amStats.forEach(stat => Logger.log(`  ${stat.am}: ${stat.avg}% avg (${stat.count} submissions)`));
}

/**
 * Export data to CSV format (for backup/analysis)
 */
function exportToCSV() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    Logger.log("❌ Sheet not found!");
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const csv = data.map(row => row.map(cell => {
    // Escape quotes and wrap in quotes if contains comma
    if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }).join(',')).join('\n');
  
  Logger.log("📄 CSV Export Generated:");
  Logger.log(`Records: ${data.length - 1}`);
  Logger.log(`Size: ${csv.length} characters`);
  Logger.log("\nFirst 500 characters:");
  Logger.log(csv.substring(0, 500));
  
  return csv;
}

// =========================================================================
// DEPLOYMENT INSTRUCTIONS
// =========================================================================
/*

📋 DEPLOYMENT STEPS:

1. Open Google Sheets and create/open your spreadsheet
2. Go to Extensions > Apps Script
3. Delete any existing code and paste this entire script
4. Save the project (Ctrl+S or Cmd+S)
5. Click "Deploy" > "New deployment"
6. Settings:
   - Type: Web app
   - Description: "Brew League AM Round API"
   - Execute as: Me
   - Who has access: Anyone
7. Click "Deploy"
8. Copy the Web App URL

🔗 API ENDPOINTS:

POST (Submit AM Round Data):
  URL: [Your Web App URL]
  Method: POST
  Content-Type: application/x-www-form-urlencoded
  
  Parameters:
    - participantName
    - participantEmpID
    - judgeName
    - judgeId
    - scoresheetType
    - machineType
    - storeName
    - storeID
    - areaManager (NEW - specific to AM Round)
    - region
    - totalScore
    - maxScore
    - percent
    - [all score fields...]

GET (Fetch AM Round Data):
  URL: [Your Web App URL]
  Method: GET
  
  Query Parameters (optional):
    - region: Filter by region (e.g., ?region=North)
    - areaManager or am: Filter by area manager name
    - participant: Filter by participant name (partial match)
    - judge: Filter by judge name (partial match)
    - limit: Limit number of results (e.g., ?limit=50)
  
  Examples:
    - Get all: ?
    - Get North region: ?region=North
    - Get AM's participants: ?am=Rohit
    - Get last 10: ?limit=10
    - Combined: ?region=South&am=Priya&limit=20

📝 TESTING:

1. Run testSheetSetup() to verify setup
2. Run generateSampleData() to create test records
3. Run getBrewLeagueAMStats() to view statistics
4. Run addConditionalFormatting() to apply color coding
5. Run exportToCSV() to generate backup

🎨 SHEET COLOR CODING:
- Header: Orange (#e67e22) to distinguish from Regional Round
- Scores: 
  - 🔴 Red: < 70%
  - 🟡 Yellow: 70-89%
  - 🟢 Green: ≥ 90%

*/
