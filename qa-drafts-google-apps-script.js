/**
 * QA CHECKLIST DRAFTS - GOOGLE APPS SCRIPT
 * 
 * This script manages QA checklist drafts in Google Sheets
 * 
 * Sheet Structure:
 * Column A: Draft ID (unique identifier)
 * Column B: QA Auditor ID
 * Column C: QA Auditor Name
 * Column D: Store ID
 * Column E: Store Name
 * Column F: Area Manager ID
 * Column G: Area Manager Name
 * Column H: Timestamp (last saved)
 * Column I: Completion Percentage
 * Column J: Responses (JSON)
 * Column K: Question Images (JSON)
 * Column L: Question Remarks (JSON)
 * Column M: Signatures (JSON)
 * Column N: Meta Data (JSON)
 */

// Configuration - UPDATE THESE
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Get from Sheet URL
const DRAFT_SHEET_NAME = 'QA_Drafts';

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getDrafts':
        return getDrafts(e.parameter.qaId);
      case 'loadDraft':
        return loadDraft(e.parameter.draftId);
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function doPost(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'saveDraft':
        return saveDraft(e.parameter);
      case 'deleteDraft':
        return deleteDraft(e.parameter.draftId);
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * Get all drafts for a specific QA auditor
 */
function getDrafts(qaId) {
  if (!qaId) {
    return createResponse(false, 'QA ID is required');
  }
  
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  const drafts = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === qaId) { // Match QA Auditor ID (Column B)
      drafts.push({
        id: row[0],
        qaId: row[1],
        qaName: row[2],
        storeId: row[3],
        storeName: row[4],
        amId: row[5],
        amName: row[6],
        timestamp: row[7],
        completionPercentage: row[8]
      });
    }
  }
  
  return createResponse(true, 'Drafts retrieved successfully', { drafts });
}

/**
 * Load full draft data
 */
function loadDraft(draftId) {
  if (!draftId) {
    return createResponse(false, 'Draft ID is required');
  }
  
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  // Find draft by ID
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === draftId) {
      const draftData = {
        id: row[0],
        qaId: row[1],
        qaName: row[2],
        storeId: row[3],
        storeName: row[4],
        amId: row[5],
        amName: row[6],
        timestamp: row[7],
        completionPercentage: row[8],
        responses: JSON.parse(row[9] || '{}'),
        questionImages: JSON.parse(row[10] || '{}'),
        questionRemarks: JSON.parse(row[11] || '{}'),
        signatures: JSON.parse(row[12] || '{"auditor":"","sm":""}'),
        meta: JSON.parse(row[13] || '{}')
      };
      
      return createResponse(true, 'Draft loaded successfully', { draft: draftData });
    }
  }
  
  return createResponse(false, 'Draft not found');
}

/**
 * Save or update a draft
 */
function saveDraft(params) {
  // Validate required fields
  if (!params.draftId || !params.qaId) {
    return createResponse(false, 'Draft ID and QA ID are required');
  }
  
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  // Parse JSON data
  const responses = params.responses || '{}';
  const questionImages = params.questionImages || '{}';
  const questionRemarks = params.questionRemarks || '{}';
  const signatures = params.signatures || '{"auditor":"","sm":""}';
  const meta = params.meta || '{}';
  
  // Create row data
  const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
  const rowData = [
    params.draftId,          // A: Draft ID
    params.qaId || '',       // B: QA Auditor ID
    params.qaName || '',     // C: QA Auditor Name
    params.storeId || '',    // D: Store ID
    params.storeName || '',  // E: Store Name
    params.amId || '',       // F: Area Manager ID
    params.amName || '',     // G: Area Manager Name
    timestamp,               // H: Timestamp
    params.completionPercentage || 0,  // I: Completion %
    responses,               // J: Responses JSON
    questionImages,          // K: Question Images JSON
    questionRemarks,         // L: Question Remarks JSON
    signatures,              // M: Signatures JSON
    meta                     // N: Meta Data JSON
  ];
  
  // Check if draft exists
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.draftId) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex > 0) {
    // Update existing draft
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Add new draft
    sheet.appendRow(rowData);
  }
  
  return createResponse(true, 'Draft saved successfully', { 
    draftId: params.draftId,
    timestamp: timestamp
  });
}

/**
 * Delete a draft
 */
function deleteDraft(draftId) {
  if (!draftId) {
    return createResponse(false, 'Draft ID is required');
  }
  
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  // Find and delete draft
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === draftId) {
      sheet.deleteRow(i + 1); // Sheet rows are 1-indexed
      return createResponse(true, 'Draft deleted successfully');
    }
  }
  
  return createResponse(false, 'Draft not found');
}

/**
 * Get or create the drafts sheet
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(DRAFT_SHEET_NAME);
  
  if (!sheet) {
    // Create new sheet with headers
    sheet = ss.insertSheet(DRAFT_SHEET_NAME);
    const headers = [
      'Draft ID',
      'QA Auditor ID',
      'QA Auditor Name',
      'Store ID',
      'Store Name',
      'Area Manager ID',
      'Area Manager Name',
      'Timestamp',
      'Completion %',
      'Responses (JSON)',
      'Question Images (JSON)',
      'Question Remarks (JSON)',
      'Signatures (JSON)',
      'Meta Data (JSON)'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    
    // Set column widths
    sheet.setColumnWidth(1, 150);  // Draft ID
    sheet.setColumnWidth(2, 120);  // QA ID
    sheet.setColumnWidth(3, 150);  // QA Name
    sheet.setColumnWidth(4, 100);  // Store ID
    sheet.setColumnWidth(5, 180);  // Store Name
    sheet.setColumnWidth(6, 120);  // AM ID
    sheet.setColumnWidth(7, 150);  // AM Name
    sheet.setColumnWidth(8, 150);  // Timestamp
    sheet.setColumnWidth(9, 100);  // Completion %
    sheet.setColumnWidth(10, 300); // Responses
    sheet.setColumnWidth(11, 300); // Images
    sheet.setColumnWidth(12, 300); // Remarks
    sheet.setColumnWidth(13, 200); // Signatures
    sheet.setColumnWidth(14, 200); // Meta
  }
  
  return sheet;
}

/**
 * Create JSON response
 */
function createResponse(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - Run this once to create the sheet
 */
function testSetup() {
  const sheet = getOrCreateSheet();
  Logger.log('Sheet created/verified: ' + sheet.getName());
  Logger.log('Sheet has ' + sheet.getLastRow() + ' rows');
}

/**
 * Clean up old drafts (optional - can be run manually or on a trigger)
 * Deletes drafts older than 30 days
 */
function cleanupOldDrafts() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let deletedCount = 0;
  
  // Go backwards to avoid index issues when deleting
  for (let i = data.length - 1; i > 0; i--) {
    const timestamp = new Date(data[i][7]); // Column H: Timestamp
    if (timestamp < thirtyDaysAgo) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  
  Logger.log('Deleted ' + deletedCount + ' old drafts');
  return deletedCount;
}
