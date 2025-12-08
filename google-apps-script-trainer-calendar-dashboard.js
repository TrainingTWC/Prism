// Google Apps Script for Trainer Calendar
// Unified script that handles both:
// 1. POST requests - Submit calendar entries from Training Calendar form
// 2. GET requests - Fetch calendar data for Trainer Calendar Dashboard

const SHEET_NAME = 'Trainer Calendar';

function doPost(e) {
  try {
    // Log the incoming request for debugging
    Logger.log('=== NEW POST REQUEST ===');
    Logger.log('Request received at: ' + new Date().toISOString());
    
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('ERROR: No post data received');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'No data received in POST request'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('Raw post data: ' + e.postData.contents);
    
    const sheet = getOrCreateSheet();
    const data = JSON.parse(e.postData.contents);
    
    Logger.log('Parsed data - Trainer ID: ' + data.trainerId);
    Logger.log('Parsed data - Trainer Name: ' + data.trainerName);
    Logger.log('Parsed data - Month: ' + data.month);
    Logger.log('Parsed data - Events count: ' + (data.events ? data.events.length : 0));
    
    const timestamp = new Date().toISOString();
    const trainerId = data.trainerId || '';
    const trainerName = data.trainerName || '';
    const month = data.month || '';
    
    if (!data.events || data.events.length === 0) {
      Logger.log('ERROR: No events in payload');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'No events provided'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get store region and name mapping from comprehensive_store_mapping
    const storeMapping = getStoreMapping();
    Logger.log('Store mapping loaded: ' + Object.keys(storeMapping).length + ' stores');
    
    let processedCount = 0;
    
    // Process each event
    data.events.forEach((event, index) => {
      Logger.log('Processing event ' + (index + 1) + ': ' + event.type + ' at ' + event.location);
      
      // Use trainer name from the event if available, otherwise fall back to payload trainer name
      const eventTrainerName = event.trainerName || trainerName;
      Logger.log('  Trainer name for this event: ' + eventTrainerName);
      
      // Use month from the event if available, otherwise fall back to payload month
      const eventMonth = event.month || month;
      Logger.log('  Month for this event: ' + eventMonth);
      
      let region = '';
      let storeName = '';
      
      // For store events, get region and store name from mapping
      if (event.type === 'store' && event.location) {
        const storeInfo = storeMapping[event.location];
        if (storeInfo) {
          region = storeInfo.region || '';
          storeName = storeInfo.storeName || event.location;
          Logger.log('  Store found in mapping - Region: ' + region + ', Name: ' + storeName);
        } else {
          storeName = event.location;
          Logger.log('  Store not in mapping, using location as name: ' + storeName);
        }
      }
      
      sheet.appendRow([
        timestamp,
        trainerId,
        eventTrainerName,
        eventMonth, // Use the event-specific month
        event.date,
        event.type,
        event.location || '',
        event.task || '',
        event.details || '',
        region,
        storeName
      ]);
      
      processedCount++;
    });
    
    Logger.log('SUCCESS: Processed ' + processedCount + ' events');
    Logger.log('Sheet now has ' + sheet.getLastRow() + ' rows (including header)');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Calendar submitted successfully',
      entriesAdded: processedCount
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('ERROR in doPost: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    Logger.log('=== NEW GET REQUEST ===');
    Logger.log('Request received at: ' + new Date().toISOString());
    
    const action = e.parameter.action;
    Logger.log('Action parameter: ' + action);
    
    if (action === 'fetch') {
      const sheet = getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      Logger.log('Sheet has ' + data.length + ' rows (including header)');
      
      // Skip header row
      const headers = data[0];
      const rows = data.slice(1);
      
      Logger.log('Returning ' + rows.length + ' data rows');
      
      // Convert to array of objects
      const entries = rows.map(row => {
        return {
          timestamp: row[0],
          trainerId: row[1],
          trainerName: row[2],
          month: row[3],
          date: row[4],
          eventType: row[5],
          location: row[6],
          task: row[7],
          details: row[8],
          region: row[9] || '',
          storeName: row[10] || ''
        };
      });
      
      Logger.log('SUCCESS: Returning ' + entries.length + ' entries');
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: entries,
        count: entries.length
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('ERROR: Invalid or missing action parameter');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid action. Use ?action=fetch to retrieve data'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('ERROR in doGet: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.appendRow([
      'Timestamp',
      'Trainer ID',
      'Trainer Name',
      'Month',
      'Date',
      'Event Type',
      'Location',
      'Task',
      'Details',
      'Region',
      'Store Name'
    ]);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, 11);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
  }
  
  return sheet;
}

function getStoreMapping() {
  // Try to find store mapping from a separate sheet or use stored properties
  // This function should match your comprehensive_store_mapping.json structure
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Option 1: Try to get from "Store Mapping" sheet
  const storeMappingSheet = ss.getSheetByName('Store Mapping');
  
  if (storeMappingSheet) {
    const data = storeMappingSheet.getDataRange().getValues();
    const mapping = {};
    
    // Assuming format: Store ID | Store Name | Region | ...
    // Adjust column indices based on your sheet structure
    for (let i = 1; i < data.length; i++) {
      const storeId = data[i][0]?.toString().trim();
      const storeName = data[i][1]?.toString().trim();
      const region = data[i][2]?.toString().trim();
      
      if (storeId) {
        mapping[storeId] = {
          storeName: storeName || storeId,
          region: region || ''
        };
      }
    }
    
    return mapping;
  }
  
  // Option 2: Return empty mapping if sheet doesn't exist
  // The script will still work, just without region data
  Logger.log('Store Mapping sheet not found. Calendar will be stored without region data.');
  return {};
}

// Legacy function name for backward compatibility
function getStoreRegions() {
  const mapping = getStoreMapping();
  const regions = {};
  
  for (let storeId in mapping) {
    if (mapping[storeId].storeName) {
      regions[mapping[storeId].storeName] = mapping[storeId].region;
    }
  }
  
  return regions;
}
