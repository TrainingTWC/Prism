/**
 * QA CHECKLIST - FINAL GOOGLE APPS SCRIPT
 * Quality Assurance Assessment with ALL 116 Questions
 * 
 * Sections:
 * - Zero Tolerance: 6 questions (24 max points)
 * - Store: 94 questions (155 max points)  
 * - A: 3 questions (6 max points)
 * - Maintenance: 11 questions (17 max points)
 * - HR: 2 questions (4 max points)
 * Total: 116 questions, 206 max points
 * 
 * NO SIGNATURES OR IMAGES STORED (as requested)
 */

const SHEET_NAME = 'QA Checklist';

function doPost(e) {
  try {
    Logger.log('QA Checklist submission received');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      setupHeaders(sheet);
    }
    
    const params = e.parameter;
    const timestamp = new Date();
    
    const rowData = [
      Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'),
      params.qaName || '', params.qaId || '', params.amName || '', params.amId || '',
      params.storeName || '', params.storeId || '',
      
      // Zero Tolerance (6)
      params.ZT_ZT_1 || '', params.ZT_ZT_2 || '', params.ZT_ZT_3 || '', 
      params.ZT_ZT_4 || '', params.ZT_ZT_5 || '', params.ZT_ZT_6 || '', params.ZT_remarks || '',
      
      // Store (94)
      params.S_S_1 || '', params.S_S_2 || '', params.S_S_3 || '', params.S_S_4 || '', params.S_S_5 || '',
      params.S_S_6 || '', params.S_S_7 || '', params.S_S_8 || '', params.S_S_9 || '', params.S_S_10 || '',
      params.S_S_11 || '', params.S_S_12 || '', params.S_S_13 || '', params.S_S_14 || '', params.S_S_15 || '',
      params.S_S_16 || '', params.S_S_17 || '', params.S_S_18 || '', params.S_S_19 || '', params.S_S_20 || '',
      params.S_S_21 || '', params.S_S_22 || '', params.S_S_23 || '', params.S_S_24 || '', params.S_S_25 || '',
      params.S_S_26 || '', params.S_S_27 || '', params.S_S_28 || '', params.S_S_29 || '', params.S_S_30 || '',
      params.S_S_31 || '', params.S_S_32 || '', params.S_S_33 || '', params.S_S_34 || '', params.S_S_35 || '',
      params.S_S_36 || '', params.S_S_37 || '', params.S_S_38 || '', params.S_S_39 || '', params.S_S_40 || '',
      params.S_S_41 || '', params.S_S_42 || '', params.S_S_43 || '', params.S_S_44 || '', params.S_S_45 || '',
      params.S_S_46 || '', params.S_S_47 || '', params.S_S_48 || '', params.S_S_49 || '', params.S_S_50 || '',
      params.S_S_51 || '', params.S_S_52 || '', params.S_S_53 || '', params.S_S_54 || '', params.S_S_55 || '',
      params.S_S_56 || '', params.S_S_57 || '', params.S_S_58 || '', params.S_S_59 || '', params.S_S_60 || '',
      params.S_S_61 || '', params.S_S_62 || '', params.S_S_63 || '', params.S_S_64 || '', params.S_S_65 || '',
      params.S_S_66 || '', params.S_S_67 || '', params.S_S_68 || '', params.S_S_69 || '', params.S_S_70 || '',
      params.S_S_71 || '', params.S_S_72 || '', params.S_S_73 || '', params.S_S_74 || '', params.S_S_75 || '',
      params.S_S_76 || '', params.S_S_77 || '', params.S_S_78 || '', params.S_S_79 || '', params.S_S_80 || '',
      params.S_S_81 || '', params.S_S_82 || '', params.S_S_83 || '', params.S_S_84 || '', params.S_S_85 || '',
      params.S_S_86 || '', params.S_S_87 || '', params.S_S_88 || '', params.S_S_89 || '', params.S_S_90 || '',
      params.S_S_91 || '', params.S_S_92 || '', params.S_S_93 || '', params.S_S_94 || '', params.S_remarks || '',
      
      // A Section (3)
      params.A_A_1 || '', params.A_A_2 || '', params.A_A_3 || '', params.A_remarks || '',
      
      // Maintenance (11)
      params.M_M_1 || '', params.M_M_2 || '', params.M_M_3 || '', params.M_M_4 || '', params.M_M_5 || '',
      params.M_M_6 || '', params.M_M_7 || '', params.M_M_8 || '', params.M_M_9 || '', params.M_M_10 || '',
      params.M_M_11 || '', params.M_remarks || '',
      
      // HR (2)
      params.HR_HR_1 || '', params.HR_HR_2 || '', params.HR_remarks || '',
      
      // Scores
      params.totalScore || '0', params.maxScore || '206', params.scorePercentage || '0'
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'QA checklist submitted successfully',
      timestamp: timestamp.toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupHeaders(sheet) {
  const headers = [
    'Timestamp', 'QA Name', 'QA ID', 'AM Name', 'AM ID', 'Store Name', 'Store ID',
    
    // Zero Tolerance (6 + remarks)
    'ZT_1: No expired food', 'ZT_2: Shelf life compliance', 'ZT_3: Storage conditions',
    'ZT_4: Water TDS', 'ZT_5: Temp transfer', 'ZT_6: No pests', 'ZT Remarks',
    
    // Store (94 + remarks)
    'S_1: Café clean', 'S_2: No leakage', 'S_3: Walls clean', 'S_4: Ceiling clean', 'S_5: Doors/windows clean',
    'S_6: Equipment clean', 'S_7: Counters clean', 'S_8: Sinks clean', 'S_9: Bins proper', 'S_10: Washroom clean',
    'S_11: Staff area clean', 'S_12: Outdoor clean', 'S_13: Tables/chairs clean', 'S_14: Menu boards', 'S_15: Signage',
    'S_16: Floor clean', 'S_17: No floor storage', 'S_18: Proper labeling', 'S_19: FIFO followed', 'S_20: Temp logs',
    'S_21: Cleaning schedules', 'S_22: Hand wash signs', 'S_23: Emergency exits', 'S_24: First aid kit', 'S_25: MSDS sheets',
    'S_26: Pest reports', 'S_27: Maintenance logs', 'S_28: Supplier docs', 'S_29: Training records', 'S_30: Action plans',
    'S_31: Product specs', 'S_32: Recipe cards', 'S_33: Portion tools', 'S_34: Thermometers', 'S_35: Scales',
    'S_36: Timer', 'S_37: Probe thermometer', 'S_38: pH meter', 'S_39: Refrigeration clean', 'S_40: Freezer clean',
    'S_41: Hot holding', 'S_42: Cold holding', 'S_43: Cooking equipment', 'S_44: Coffee machine', 'S_45: Grinder',
    'S_46: Ice machine', 'S_47: Water dispenser', 'S_48: Dishwasher', 'S_49: 3-compartment sink', 'S_50: Sanitizer',
    'S_51: Test strips', 'S_52: Dish racks', 'S_53: Utensils stored', 'S_54: Boards color-coded', 'S_55: Knives',
    'S_56: Small wares', 'S_57: Pots/pans', 'S_58: Serving utensils', 'S_59: Glassware', 'S_60: Plates/bowls',
    'S_61: Cups inverted', 'S_62: Trays', 'S_63: Food containers', 'S_64: Ingredient bins', 'S_65: Storage shelves',
    'S_66: Dry storage', 'S_67: Chemical storage', 'S_68: Packaging stored', 'S_69: No damaged packaging', 'S_70: Raw/cooked separated',
    'S_71: Allergen info', 'S_72: Allergen prevention', 'S_73: Dietary labels', 'S_74: Food samples', 'S_75: Display protected',
    'S_76: Sneeze guards', 'S_77: Self-service monitored', 'S_78: Condiments', 'S_79: Ice bins', 'S_80: Beverage station',
    'S_81: Napkins/straws', 'S_82: Lids/cups', 'S_83: Takeaway packaging', 'S_84: Delivery bags', 'S_85: POS area',
    'S_86: Cash handling', 'S_87: Feedback system', 'S_88: Complaint log', 'S_89: Sales records', 'S_90: Inventory',
    'S_91: Waste log', 'S_92: Energy monitoring', 'S_93: Water monitoring', 'S_94: Sustainability', 'Store Remarks',
    
    // A Section (3 + remarks)
    'A_1: Requirements met', 'A_2: Documentation complete', 'A_3: Compliance verified', 'A Remarks',
    
    // Maintenance (11 + remarks)
    'M_1: Window mesh', 'M_2: No damage', 'M_3: No wires', 'M_4: Lighting', 'M_5: Fire extinguishers',
    'M_6: Pest entry', 'M_7: Pest control', 'M_8: Maintenance records', 'M_9: Plumbing', 'M_10: Freezer/Chillers',
    'M_11: RO water', 'Maintenance Remarks',
    
    // HR (2 + remarks)
    'HR_1: Medical records', 'HR_2: Annual medical', 'HR Remarks',
    
    // Scores
    'Total Score', 'Max Score', 'Score %'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FF6B35').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'QA Checklist API Active',
    questions: 116,
    sections: { ZT: 6, Store: 94, A: 3, Maintenance: 11, HR: 2 }
  })).setMimeType(ContentService.MimeType.JSON);
}
