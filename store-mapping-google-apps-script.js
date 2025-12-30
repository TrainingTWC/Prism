/**
 * STORE MAPPING GOOGLE APPS SCRIPT
 * 
 * This script serves store mapping data from Google Sheets to the Prism Dashboard.
 * It provides Area Manager assignments, store details, HR assignments, and regional info.
 * 
 * Sheet Structure:
 * Columns: Store ID | Store Name | AM ID | AM Name | Region | HRBP ID | HRBP Name | Regional HR ID | Regional HR Name | HR Head ID | HR Head Name
 * 
 * Setup:
 * 1. Create a Google Sheet with a tab named "Store_Mapping"
 * 2. Add the columns above as headers in row 1
 * 3. Fill in your store data
 * 4. Deploy this script as a Web App
 * 5. Set VITE_STORE_MAPPING_SCRIPT_URL in your .env file
 */

const SHEET_NAME = 'Store_Mapping';

/**
 * Handle GET requests - Retrieve store mapping data
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getStoreMapping';
    
    switch (action) {
      case 'getStoreMapping':
        return getStoreMapping();
      
      case 'getStoreById':
        return getStoreById(e.parameter.storeId);
      
      case 'getStoresByAM':
        return getStoresByAM(e.parameter.amId);
      
      case 'getStoresByRegion':
        return getStoresByRegion(e.parameter.region);
      
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Get all store mapping data
 */
function getStoreMapping() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createResponse(false, 'Store_Mapping sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return createResponse(true, 'No store data found', []);
    }
    
    // Headers: Store ID, Store Name, AM ID, AM Name, Region, HRBP ID, HRBP Name, Regional HR ID, Regional HR Name, HR Head ID, HR Head Name
    const stores = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      const store = {
        'Store ID': row[0] ? row[0].toString().trim() : '',
        'Store Name': row[1] ? row[1].toString().trim() : '',
        'AM': row[2] ? row[2].toString().trim() : '',
        'AM Name': row[3] ? row[3].toString().trim() : '',
        'Region': row[4] ? row[4].toString().trim() : '',
        'HRBP': row[5] ? row[5].toString().trim() : '',
        'HRBP Name': row[6] ? row[6].toString().trim() : '',
        'Regional HR': row[7] ? row[7].toString().trim() : '',
        'Regional HR Name': row[8] ? row[8].toString().trim() : '',
        'HR Head': row[9] ? row[9].toString().trim() : '',
        'HR Head Name': row[10] ? row[10].toString().trim() : ''
      };
      
      stores.push(store);
    }
    
    return createResponse(true, `Found ${stores.length} stores`, stores);
  } catch (error) {
    return createResponse(false, 'Error fetching store mapping: ' + error.toString());
  }
}

/**
 * Get a specific store by ID
 */
function getStoreById(storeId) {
  try {
    if (!storeId) {
      return createResponse(false, 'Store ID is required');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createResponse(false, 'Store_Mapping sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[0].toString().trim() === storeId.trim()) {
        const store = {
          'Store ID': row[0] ? row[0].toString().trim() : '',
          'Store Name': row[1] ? row[1].toString().trim() : '',
          'AM': row[2] ? row[2].toString().trim() : '',
          'AM Name': row[3] ? row[3].toString().trim() : '',
          'Region': row[4] ? row[4].toString().trim() : '',
          'HRBP': row[5] ? row[5].toString().trim() : '',
          'HRBP Name': row[6] ? row[6].toString().trim() : '',
          'Regional HR': row[7] ? row[7].toString().trim() : '',
          'Regional HR Name': row[8] ? row[8].toString().trim() : '',
          'HR Head': row[9] ? row[9].toString().trim() : '',
          'HR Head Name': row[10] ? row[10].toString().trim() : ''
        };
        return createResponse(true, 'Store found', store);
      }
    }
    
    return createResponse(false, 'Store not found: ' + storeId);
  } catch (error) {
    return createResponse(false, 'Error fetching store: ' + error.toString());
  }
}

/**
 * Get all stores for a specific Area Manager
 */
function getStoresByAM(amId) {
  try {
    if (!amId) {
      return createResponse(false, 'AM ID is required');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createResponse(false, 'Store_Mapping sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const stores = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] && row[2].toString().trim() === amId.trim()) {
        const store = {
          'Store ID': row[0] ? row[0].toString().trim() : '',
          'Store Name': row[1] ? row[1].toString().trim() : '',
          'AM': row[2] ? row[2].toString().trim() : '',
          'AM Name': row[3] ? row[3].toString().trim() : '',
          'Region': row[4] ? row[4].toString().trim() : '',
          'HRBP': row[5] ? row[5].toString().trim() : '',
          'HRBP Name': row[6] ? row[6].toString().trim() : '',
          'Regional HR': row[7] ? row[7].toString().trim() : '',
          'Regional HR Name': row[8] ? row[8].toString().trim() : '',
          'HR Head': row[9] ? row[9].toString().trim() : '',
          'HR Head Name': row[10] ? row[10].toString().trim() : ''
        };
        stores.push(store);
      }
    }
    
    return createResponse(true, `Found ${stores.length} stores for AM ${amId}`, stores);
  } catch (error) {
    return createResponse(false, 'Error fetching stores by AM: ' + error.toString());
  }
}

/**
 * Get all stores in a specific region
 */
function getStoresByRegion(region) {
  try {
    if (!region) {
      return createResponse(false, 'Region is required');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createResponse(false, 'Store_Mapping sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const stores = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[4] && row[4].toString().trim().toLowerCase() === region.trim().toLowerCase()) {
        const store = {
          'Store ID': row[0] ? row[0].toString().trim() : '',
          'Store Name': row[1] ? row[1].toString().trim() : '',
          'AM': row[2] ? row[2].toString().trim() : '',
          'AM Name': row[3] ? row[3].toString().trim() : '',
          'Region': row[4] ? row[4].toString().trim() : '',
          'HRBP': row[5] ? row[5].toString().trim() : '',
          'HRBP Name': row[6] ? row[6].toString().trim() : '',
          'Regional HR': row[7] ? row[7].toString().trim() : '',
          'Regional HR Name': row[8] ? row[8].toString().trim() : '',
          'HR Head': row[9] ? row[9].toString().trim() : '',
          'HR Head Name': row[10] ? row[10].toString().trim() : ''
        };
        stores.push(store);
      }
    }
    
    return createResponse(true, `Found ${stores.length} stores in ${region}`, stores);
  } catch (error) {
    return createResponse(false, 'Error fetching stores by region: ' + error.toString());
  }
}

/**
 * Create a JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
