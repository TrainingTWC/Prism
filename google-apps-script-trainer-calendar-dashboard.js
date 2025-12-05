// Google Apps Script for Trainer Calendar Dashboard
// This script handles both POST (submit) and GET (fetch) requests

const SHEET_NAME = 'Trainer Calendar';

function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = JSON.parse(e.postData.contents);
    
    const timestamp = new Date().toISOString();
    const trainerId = data.trainerId;
    const trainerName = data.trainerName;
    const month = data.month;
    
    // Get store region mapping
    const storeRegions = getStoreRegions();
    
    // Process each event
    data.events.forEach(event => {
      const region = event.location && storeRegions[event.location] ? storeRegions[event.location] : '';
      const storeName = event.type === 'store' ? event.location : '';
      
      sheet.appendRow([
        timestamp,
        trainerId,
        trainerName,
        month,
        event.date,
        event.type,
        event.location,
        event.task || '',
        event.details || '',
        region,
        storeName
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Calendar submitted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'fetch') {
      const sheet = getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      
      // Skip header row
      const headers = data[0];
      const rows = data.slice(1);
      
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
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: entries
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
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

function getStoreRegions() {
  // This should match your comprehensive store mapping
  // For now, returning empty object - you can populate this from your store mapping sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const storeSheet = ss.getSheetByName('Store Mapping');
  
  if (!storeSheet) {
    return {};
  }
  
  const storeData = storeSheet.getDataRange().getValues();
  const regions = {};
  
  // Assuming first row is header
  // Store Name in column 2 (index 1), Region in column 3 (index 2)
  for (let i = 1; i < storeData.length; i++) {
    const storeName = storeData[i][1];
    const region = storeData[i][2];
    if (storeName && region) {
      regions[storeName] = region;
    }
  }
  
  return regions;
}
