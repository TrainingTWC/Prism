/**
 * Finance Historic Data Management - Google Apps Script
 * 
 * This script manages historic finance audit data:
 * 1. Fetches historic data from "Historic Data" sheet
 * 2. Appends new audit submissions to the historic data sheet
 * 3. Provides API endpoints for frontend integration
 * 
 * Sheet Format: Store ID | Audit date | Region | Percentage
 */

// Configuration
const FINANCE_SHEET_NAME = 'Finance Audits'; // Main audit sheet
const HISTORIC_SHEET_NAME = 'Historic Data'; // Historic data sheet
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your actual spreadsheet ID

/**
 * Main entry point - handles GET and POST requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getHistoricData') {
      return getHistoricData();
    } else if (action === 'getHistoricDataForStore') {
      const storeId = e.parameter.storeId;
      return getHistoricDataForStore(storeId);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Invalid action' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Internal server error', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests (for appending new audit data to historic sheet)
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'appendHistoric') {
      const postData = JSON.parse(e.postData.contents);
      return appendHistoricData(postData);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Invalid action' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Internal server error', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all historic data from the Historic Data sheet
 */
function getHistoricData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(HISTORIC_SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          error: 'Historic Data sheet not found',
          data: [] 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // First row is headers: Store ID | Audit date | Region | Percentage
    const headers = values[0];
    const data = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[0]) continue; // Skip empty rows
      
      data.push({
        storeId: String(row[0]).trim(),
        auditDate: formatDate(row[1]),
        region: String(row[2]).trim(),
        percentage: parseFloat(row[3]) || 0
      });
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ data: data }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in getHistoricData: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Failed to fetch historic data', 
        message: error.toString(),
        data: [] 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get historic data for a specific store
 */
function getHistoricDataForStore(storeId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(HISTORIC_SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          error: 'Historic Data sheet not found',
          data: [] 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = [];
    
    // Normalize store ID for comparison
    const normalizedStoreId = String(storeId).trim().toUpperCase();
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowStoreId = String(row[0]).trim().toUpperCase();
      
      if (rowStoreId === normalizedStoreId) {
        data.push({
          storeId: String(row[0]).trim(),
          auditDate: formatDate(row[1]),
          region: String(row[2]).trim(),
          percentage: parseFloat(row[3]) || 0
        });
      }
    }
    
    // Sort by date (most recent first)
    data.sort((a, b) => {
      const dateA = parseDate(a.auditDate);
      const dateB = parseDate(b.auditDate);
      return dateB - dateA;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ data: data }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in getHistoricDataForStore: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Failed to fetch store historic data', 
        message: error.toString(),
        data: [] 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Append new audit data to historic sheet
 * Called automatically when a new audit is submitted
 */
function appendHistoricData(auditData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(HISTORIC_SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(HISTORIC_SHEET_NAME);
      // Add headers
      sheet.appendRow(['Store ID', 'Audit date', 'Region', 'Percentage']);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 4);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4a5568');
      headerRange.setFontColor('#ffffff');
    }
    
    // Validate required fields
    if (!auditData.storeId || !auditData.auditDate || !auditData.region || auditData.percentage === undefined) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false,
          error: 'Missing required fields: storeId, auditDate, region, percentage' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Append new row
    sheet.appendRow([
      auditData.storeId,
      auditData.auditDate,
      auditData.region,
      auditData.percentage
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true,
        message: 'Historic data appended successfully' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in appendHistoricData: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false,
        error: 'Failed to append historic data', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Trigger function: Called when a new audit is submitted to the main Finance sheet
 * This automatically appends the audit to historic data
 */
function onFinanceAuditSubmit(e) {
  try {
    const row = e.range.getRow();
    const sheet = e.range.getSheet();
    
    // Only process if this is the Finance Audits sheet
    if (sheet.getName() !== FINANCE_SHEET_NAME) {
      return;
    }
    
    // Get the data from the submitted row
    const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Find column indices (adjust based on your sheet structure)
    // Assuming: Store ID is in column index, Region is in region index, etc.
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const storeIdIdx = findColumnIndex(headers, ['Store ID', 'StoreID', 'store_id']);
    const dateIdx = findColumnIndex(headers, ['Submission Time', 'Date', 'Audit Date']);
    const regionIdx = findColumnIndex(headers, ['Region']);
    const percentageIdx = findColumnIndex(headers, ['Score Percentage', 'Percentage', 'scorePercentage']);
    
    if (storeIdIdx === -1 || dateIdx === -1 || regionIdx === -1 || percentageIdx === -1) {
      Logger.log('Could not find required columns');
      return;
    }
    
    const auditData = {
      storeId: values[storeIdIdx],
      auditDate: formatDate(values[dateIdx]),
      region: values[regionIdx],
      percentage: parseFloat(values[percentageIdx]) || 0
    };
    
    appendHistoricData(auditData);
    
  } catch (error) {
    Logger.log('Error in onFinanceAuditSubmit trigger: ' + error.toString());
  }
}

/**
 * Helper function to find column index by multiple possible names
 */
function findColumnIndex(headers, possibleNames) {
  for (let name of possibleNames) {
    const idx = headers.findIndex(h => String(h).trim().toLowerCase() === name.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Helper function to format date to M/D/YYYY format
 */
function formatDate(dateValue) {
  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      // Try to parse string date
      date = new Date(dateValue);
    } else {
      date = new Date(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      return dateValue; // Return original if parsing fails
    }
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    return dateValue;
  }
}

/**
 * Helper function to parse date string to Date object
 */
function parseDate(dateStr) {
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parts[2], parts[0] - 1, parts[1]);
    }
    return new Date(dateStr);
  } catch (error) {
    return new Date();
  }
}

/**
 * Setup function: Creates the Historic Data sheet if it doesn't exist
 * and sets up the trigger for automatic appends
 */
function setupHistoricDataSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(HISTORIC_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(HISTORIC_SHEET_NAME);
    sheet.appendRow(['Store ID', 'Audit date', 'Region', 'Percentage']);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, 4);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4a5568');
    headerRange.setFontColor('#ffffff');
    
    Logger.log('Historic Data sheet created successfully');
  } else {
    Logger.log('Historic Data sheet already exists');
  }
  
  // Create trigger for automatic appends (uncomment if needed)
  // ScriptApp.newTrigger('onFinanceAuditSubmit')
  //   .forSpreadsheet(ss)
  //   .onFormSubmit()
  //   .create();
}

/**
 * Migration function: Import existing data to Historic Data sheet
 * Run this once to populate historic data from your existing records
 */
function migrateExistingDataToHistoric() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const financeSheet = ss.getSheetByName(FINANCE_SHEET_NAME);
  
  if (!financeSheet) {
    Logger.log('Finance Audits sheet not found');
    return;
  }
  
  const dataRange = financeSheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];
  
  // Find column indices
  const storeIdIdx = findColumnIndex(headers, ['Store ID', 'StoreID', 'store_id']);
  const dateIdx = findColumnIndex(headers, ['Submission Time', 'Date', 'Audit Date']);
  const regionIdx = findColumnIndex(headers, ['Region']);
  const percentageIdx = findColumnIndex(headers, ['Score Percentage', 'Percentage', 'scorePercentage']);
  
  if (storeIdIdx === -1 || dateIdx === -1 || regionIdx === -1 || percentageIdx === -1) {
    Logger.log('Could not find required columns in Finance sheet');
    Logger.log('Headers: ' + headers.join(', '));
    return;
  }
  
  let successCount = 0;
  
  // Process each row (skip header)
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    
    if (!row[storeIdIdx]) continue; // Skip empty rows
    
    const auditData = {
      storeId: String(row[storeIdIdx]).trim(),
      auditDate: formatDate(row[dateIdx]),
      region: String(row[regionIdx]).trim(),
      percentage: parseFloat(row[percentageIdx]) || 0
    };
    
    try {
      appendHistoricData(auditData);
      successCount++;
    } catch (error) {
      Logger.log('Failed to migrate row ' + i + ': ' + error.toString());
    }
  }
  
  Logger.log('Migration complete. Migrated ' + successCount + ' records.');
}

/**
 * Test function to verify the script works
 */
function testHistoricData() {
  Logger.log('Testing historic data functions...');
  
  // Test 1: Get all historic data
  const allData = getHistoricData();
  Logger.log('All historic data: ' + allData.getContent());
  
  // Test 2: Get data for a specific store (replace with actual store ID)
  const storeData = getHistoricDataForStore('S049');
  Logger.log('Store S049 data: ' + storeData.getContent());
  
  Logger.log('Test complete!');
}
