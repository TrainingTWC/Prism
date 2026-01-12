/**
 * STORE MAPPING GOOGLE APPS SCRIPT
 * 
 * This script serves store mapping data from Google Sheets to the Prism Dashboard.
 * It provides Area Manager assignments, store details, HR assignments, trainer assignments, and regional info.
 * 
 * Sheet Structure (Extended - 26 columns):
 * Columns: Store ID | Store Name | AM ID | AM Name | Region | 
 *          HRBP 1 ID | HRBP 1 Name | HRBP 2 ID | HRBP 2 Name | HRBP 3 ID | HRBP 3 Name |
 *          Trainer 1 ID | Trainer 1 Name | Trainer 2 ID | Trainer 2 Name | Trainer 3 ID | Trainer 3 Name |
 *          Regional Trainer ID | Regional Trainer name |
 *          Regional HR ID | Regional HR Name | HR Head ID | HR Head Name |
 *          Store Format | Menu Type | Price Group
 * 
 * Setup:
 * 1. Create a Google Sheet with a tab named "Store_Mapping"
 * 2. Add the columns above as headers in row 1
 * 3. Fill in your store data (HRBP 2, HRBP 3, Trainer 2, Trainer 3 can be empty if not applicable)
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
    
    // Headers: Store ID, Store Name, AM ID, AM Name, Region, 
    //          HRBP 1 ID, HRBP 1 Name, HRBP 2 ID, HRBP 2 Name, HRBP 3 ID, HRBP 3 Name,
    //          Trainer 1 ID, Trainer 1 Name, Trainer 2 ID, Trainer 2 Name, Trainer 3 ID, Trainer 3 Name,
    //          Regional Trainer ID, Regional Trainer name,
    //          Regional HR ID, Regional HR Name, HR Head ID, HR Head Name,
    //          Store Format, Menu Type, Price Group
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
        
        // Multiple HRBPs (up to 3)
        'HRBP 1': row[5] ? row[5].toString().trim() : '',
        'HRBP 1 Name': row[6] ? row[6].toString().trim() : '',
        'HRBP 2': row[7] ? row[7].toString().trim() : '',
        'HRBP 2 Name': row[8] ? row[8].toString().trim() : '',
        'HRBP 3': row[9] ? row[9].toString().trim() : '',
        'HRBP 3 Name': row[10] ? row[10].toString().trim() : '',
        
        // Multiple Trainers (up to 3)
        'Trainer 1': row[11] ? row[11].toString().trim() : '',
        'Trainer 1 Name': row[12] ? row[12].toString().trim() : '',
        'Trainer 2': row[13] ? row[13].toString().trim() : '',
        'Trainer 2 Name': row[14] ? row[14].toString().trim() : '',
        'Trainer 3': row[15] ? row[15].toString().trim() : '',
        'Trainer 3 Name': row[16] ? row[16].toString().trim() : '',
        
        // Regional Trainer
        'Regional Trainer': row[17] ? row[17].toString().trim() : '',
        'Regional Trainer Name': row[18] ? row[18].toString().trim() : '',
        
        // Regional HR and HR Head
        'Regional HR': row[19] ? row[19].toString().trim() : '',
        'Regional HR Name': row[20] ? row[20].toString().trim() : '',
        'HR Head': row[21] ? row[21].toString().trim() : '',
        'HR Head Name': row[22] ? row[22].toString().trim() : '',
        
        // Store Classification Fields (NEW)
        'Store Format': row[23] ? row[23].toString().trim() : '',
        'Menu Type': row[24] ? row[24].toString().trim() : '',
        'Price Group': row[25] ? row[25].toString().trim() : '',
        
        // Legacy field for backward compatibility (uses HRBP 1)
        'HRBP': row[5] ? row[5].toString().trim() : '',
        'HRBP Name': row[6] ? row[6].toString().trim() : ''
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
          
          // Multiple HRBPs
          'HRBP 1': row[5] ? row[5].toString().trim() : '',
          'HRBP 1 Name': row[6] ? row[6].toString().trim() : '',
          'HRBP 2': row[7] ? row[7].toString().trim() : '',
          'HRBP 2 Name': row[8] ? row[8].toString().trim() : '',
          'HRBP 3': row[9] ? row[9].toString().trim() : '',
          'HRBP 3 Name': row[10] ? row[10].toString().trim() : '',
          
          // Multiple Trainers
          'Trainer 1': row[11] ? row[11].toString().trim() : '',
          'Trainer 1 Name': row[12] ? row[12].toString().trim() : '',
          'Trainer 2': row[13] ? row[13].toString().trim() : '',
          'Trainer 2 Name': row[14] ? row[14].toString().trim() : '',
          'Trainer 3': row[15] ? row[15].toString().trim() : '',
          'Trainer 3 Name': row[16] ? row[16].toString().trim() : '',
          
          // Regional Trainer
          'Regional Trainer': row[17] ? row[17].toString().trim() : '',
          'Regional Trainer Name': row[18] ? row[18].toString().trim() : '',
          
          // Regional HR and HR Head
          'Regional HR': row[19] ? row[19].toString().trim() : '',
          'Regional HR Name': row[20] ? row[20].toString().trim() : '',
          'HR Head': row[21] ? row[21].toString().trim() : '',
          'HR Head Name': row[22] ? row[22].toString().trim() : '',
          
          // Store Classification Fields
          'Store Format': row[23] ? row[23].toString().trim() : '',
          'Menu Type': row[24] ? row[24].toString().trim() : '',
          'Price Group': row[25] ? row[25].toString().trim() : '',
          
          // Legacy fields
          'HRBP': row[5] ? row[5].toString().trim() : '',
          'HRBP Name': row[6] ? row[6].toString().trim() : ''
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
          
          // Multiple HRBPs
          'HRBP 1': row[5] ? row[5].toString().trim() : '',
          'HRBP 1 Name': row[6] ? row[6].toString().trim() : '',
          'HRBP 2': row[7] ? row[7].toString().trim() : '',
          'HRBP 2 Name': row[8] ? row[8].toString().trim() : '',
          'HRBP 3': row[9] ? row[9].toString().trim() : '',
          'HRBP 3 Name': row[10] ? row[10].toString().trim() : '',
          
          // Multiple Trainers
          'Trainer 1': row[11] ? row[11].toString().trim() : '',
          'Trainer 1 Name': row[12] ? row[12].toString().trim() : '',
          'Trainer 2': row[13] ? row[13].toString().trim() : '',
          'Trainer 2 Name': row[14] ? row[14].toString().trim() : '',
          'Trainer 3': row[15] ? row[15].toString().trim() : '',
          'Trainer 3 Name': row[16] ? row[16].toString().trim() : '',
          
          // Regional Trainer
          'Regional Trainer': row[17] ? row[17].toString().trim() : '',
          'Regional Trainer Name': row[18] ? row[18].toString().trim() : '',
          
          // Regional HR and HR Head
          'Regional HR': row[19] ? row[19].toString().trim() : '',
          'Regional HR Name': row[20] ? row[20].toString().trim() : '',
          'HR Head': row[21] ? row[21].toString().trim() : '',
          'HR Head Name': row[22] ? row[22].toString().trim() : '',
          
          // Store Classification Fields
          'Store Format': row[23] ? row[23].toString().trim() : '',
          'Menu Type': row[24] ? row[24].toString().trim() : '',
          'Price Group': row[25] ? row[25].toString().trim() : '',
          
          // Legacy fields
          'HRBP': row[5] ? row[5].toString().trim() : '',
          'HRBP Name': row[6] ? row[6].toString().trim() : ''
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
          
          // Multiple HRBPs
          'HRBP 1': row[5] ? row[5].toString().trim() : '',
          'HRBP 1 Name': row[6] ? row[6].toString().trim() : '',
          'HRBP 2': row[7] ? row[7].toString().trim() : '',
          'HRBP 2 Name': row[8] ? row[8].toString().trim() : '',
          'HRBP 3': row[9] ? row[9].toString().trim() : '',
          'HRBP 3 Name': row[10] ? row[10].toString().trim() : '',
          
          // Multiple Trainers
          'Trainer 1': row[11] ? row[11].toString().trim() : '',
          'Trainer 1 Name': row[12] ? row[12].toString().trim() : '',
          'Trainer 2': row[13] ? row[13].toString().trim() : '',
          'Trainer 2 Name': row[14] ? row[14].toString().trim() : '',
          'Trainer 3': row[15] ? row[15].toString().trim() : '',
          'Trainer 3 Name': row[16] ? row[16].toString().trim() : '',
          
          // Regional Trainer
          'Regional Trainer': row[17] ? row[17].toString().trim() : '',
          'Regional Trainer Name': row[18] ? row[18].toString().trim() : '',
          
          // Regional HR and HR Head
          'Regional HR': row[19] ? row[19].toString().trim() : '',
          'Regional HR Name': row[20] ? row[20].toString().trim() : '',
          'HR Head': row[21] ? row[21].toString().trim() : '',
          'HR Head Name': row[22] ? row[22].toString().trim() : '',
          
          // Store Classification Fields
          'Store Format': row[23] ? row[23].toString().trim() : '',
          'Menu Type': row[24] ? row[24].toString().trim() : '',
          'Price Group': row[25] ? row[25].toString().trim() : '',
          
          // Legacy fields
          'HRBP': row[5] ? row[5].toString().trim() : '',
          'HRBP Name': row[6] ? row[6].toString().trim() : ''
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
