/**
 * Quality Assurance (QA) Checklist Google Apps Script
 * Handles form submissions from the QA Assessment dashboard with ALL 116 questions
 * Sheet name: QA
 * 
 * Sections:
 * - Zero Tolerance (6 questions): ZT_1 to ZT_6
 * - Store (94 questions): S_1 to S_94
 * - A/QA (3 questions): A_1 to A_3
 * - Maintenance (11 questions): M_1 to M_11
 * - HR (2 questions): HR_1 to HR_2
 * 
 * Total: 116 questions + metadata + signatures + images
 */

function doPost(e) {
  try {
    console.log('QA Survey submission received');
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('QA');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('QA');
      console.log('Created new QA sheet');
    }
    
    // Parse the form data
    const params = e.parameter;
    console.log('Received parameters:', JSON.stringify(Object.keys(params)));
    
    // Get current timestamp
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    // Initialize headers if this is the first submission
    if (sheet.getLastRow() === 0) {
      setupQAHeaders(sheet);
    }
    
    // Prepare the row data - ALL 116 questions mapped correctly
    const rowData = [
      // Metadata (Columns A-M)
      timestamp,                                    // A: Timestamp
      params.submissionTime || '',                  // B: Submission Time
      params.qaName || '',                          // C: QA Auditor Name
      params.qaId || '',                           // D: QA Auditor ID
      params.amName || '',                         // E: Area Manager Name
      params.amId || '',                           // F: Area Manager ID
      params.storeName || '',                      // G: Store Name
      params.storeID || '',                        // H: Store ID
      params.region || '',                         // I: Region
      params.totalScore || 0,                      // J: Total Score
      params.maxScore || 0,                        // K: Max Score
      params.scorePercentage || 0,                 // L: Score Percentage
      
      // Signatures (Columns M-N)
      params.auditorSignature || '',               // M: Auditor Signature
      params.smSignature || '',                    // N: SM Signature
      
      // === ZERO TOLERANCE SECTION (6 questions) === Columns O-U
      params.ZeroTolerance_ZT_1 || '',            // O: ZT_1
      params.ZeroTolerance_ZT_2 || '',            // P: ZT_2
      params.ZeroTolerance_ZT_3 || '',            // Q: ZT_3
      params.ZeroTolerance_ZT_4 || '',            // R: ZT_4
      params.ZeroTolerance_ZT_5 || '',            // S: ZT_5
      params.ZeroTolerance_ZT_6 || '',            // T: ZT_6
      params.ZeroTolerance_remarks || '',         // U: Zero Tolerance Remarks
      
      // === STORE SECTION (94 questions) === Columns V-GS
      params.Store_S_1 || '',                     // V: S_1
      params.Store_S_2 || '',                     // W: S_2
      params.Store_S_3 || '',                     // X: S_3
      params.Store_S_4 || '',                     // Y: S_4
      params.Store_S_5 || '',                     // Z: S_5
      params.Store_S_6 || '',                     // AA: S_6
      params.Store_S_7 || '',                     // AB: S_7
      params.Store_S_8 || '',                     // AC: S_8
      params.Store_S_9 || '',                     // AD: S_9
      params.Store_S_10 || '',                    // AE: S_10
      params.Store_S_11 || '',                    // AF: S_11
      params.Store_S_12 || '',                    // AG: S_12
      params.Store_S_13 || '',                    // AH: S_13
      params.Store_S_14 || '',                    // AI: S_14
      params.Store_S_15 || '',                    // AJ: S_15
      params.Store_S_16 || '',                    // AK: S_16
      params.Store_S_17 || '',                    // AL: S_17
      params.Store_S_18 || '',                    // AM: S_18
      params.Store_S_19 || '',                    // AN: S_19
      params.Store_S_20 || '',                    // AO: S_20
      params.Store_S_21 || '',                    // AP: S_21
      params.Store_S_22 || '',                    // AQ: S_22
      params.Store_S_23 || '',                    // AR: S_23
      params.Store_S_24 || '',                    // AS: S_24
      params.Store_S_25 || '',                    // AT: S_25
      params.Store_S_26 || '',                    // AU: S_26
      params.Store_S_27 || '',                    // AV: S_27
      params.Store_S_28 || '',                    // AW: S_28
      params.Store_S_29 || '',                    // AX: S_29
      params.Store_S_30 || '',                    // AY: S_30
      params.Store_S_31 || '',                    // AZ: S_31
      params.Store_S_32 || '',                    // BA: S_32
      params.Store_S_33 || '',                    // BB: S_33
      params.Store_S_34 || '',                    // BC: S_34
      params.Store_S_35 || '',                    // BD: S_35
      params.Store_S_36 || '',                    // BE: S_36
      params.Store_S_37 || '',                    // BF: S_37
      params.Store_S_38 || '',                    // BG: S_38
      params.Store_S_39 || '',                    // BH: S_39
      params.Store_S_40 || '',                    // BI: S_40
      params.Store_S_41 || '',                    // BJ: S_41
      params.Store_S_42 || '',                    // BK: S_42
      params.Store_S_43 || '',                    // BL: S_43
      params.Store_S_44 || '',                    // BM: S_44
      params.Store_S_45 || '',                    // BN: S_45
      params.Store_S_46 || '',                    // BO: S_46
      params.Store_S_47 || '',                    // BP: S_47
      params.Store_S_48 || '',                    // BQ: S_48
      params.Store_S_49 || '',                    // BR: S_49
      params.Store_S_50 || '',                    // BS: S_50
      params.Store_S_51 || '',                    // BT: S_51
      params.Store_S_52 || '',                    // BU: S_52
      params.Store_S_53 || '',                    // BV: S_53
      params.Store_S_54 || '',                    // BW: S_54
      params.Store_S_55 || '',                    // BX: S_55
      params.Store_S_56 || '',                    // BY: S_56
      params.Store_S_57 || '',                    // BZ: S_57
      params.Store_S_58 || '',                    // CA: S_58
      params.Store_S_59 || '',                    // CB: S_59
      params.Store_S_60 || '',                    // CC: S_60
      params.Store_S_61 || '',                    // CD: S_61
      params.Store_S_62 || '',                    // CE: S_62
      params.Store_S_63 || '',                    // CF: S_63
      params.Store_S_64 || '',                    // CG: S_64
      params.Store_S_65 || '',                    // CH: S_65
      params.Store_S_66 || '',                    // CI: S_66
      params.Store_S_67 || '',                    // CJ: S_67
      params.Store_S_68 || '',                    // CK: S_68
      params.Store_S_69 || '',                    // CL: S_69
      params.Store_S_70 || '',                    // CM: S_70
      params.Store_S_71 || '',                    // CN: S_71
      params.Store_S_72 || '',                    // CO: S_72
      params.Store_S_73 || '',                    // CP: S_73
      params.Store_S_74 || '',                    // CQ: S_74
      params.Store_S_75 || '',                    // CR: S_75
      params.Store_S_76 || '',                    // CS: S_76
      params.Store_S_77 || '',                    // CT: S_77
      params.Store_S_78 || '',                    // CU: S_78
      params.Store_S_79 || '',                    // CV: S_79
      params.Store_S_80 || '',                    // CW: S_80
      params.Store_S_81 || '',                    // CX: S_81
      params.Store_S_82 || '',                    // CY: S_82
      params.Store_S_83 || '',                    // CZ: S_83
      params.Store_S_84 || '',                    // DA: S_84
      params.Store_S_85 || '',                    // DB: S_85
      params.Store_S_86 || '',                    // DC: S_86
      params.Store_S_87 || '',                    // DD: S_87
      params.Store_S_88 || '',                    // DE: S_88
      params.Store_S_89 || '',                    // DF: S_89
      params.Store_S_90 || '',                    // DG: S_90
      params.Store_S_91 || '',                    // DH: S_91
      params.Store_S_92 || '',                    // DI: S_92
      params.Store_S_93 || '',                    // DJ: S_93
      params.Store_S_94 || '',                    // DK: S_94
      params.Store_remarks || '',                 // DL: Store Remarks
      
      // === A/QA SECTION (3 questions) === Columns DM-DP
      params.A_A_1 || '',                         // DM: A_1
      params.A_A_2 || '',                         // DN: A_2
      params.A_A_3 || '',                         // DO: A_3
      params.A_remarks || '',                     // DP: A/QA Remarks
      
      // === MAINTENANCE SECTION (11 questions) === Columns DQ-EB
      params.Maintenance_M_1 || '',               // DQ: M_1
      params.Maintenance_M_2 || '',               // DR: M_2
      params.Maintenance_M_3 || '',               // DS: M_3
      params.Maintenance_M_4 || '',               // DT: M_4
      params.Maintenance_M_5 || '',               // DU: M_5
      params.Maintenance_M_6 || '',               // DV: M_6
      params.Maintenance_M_7 || '',               // DW: M_7
      params.Maintenance_M_8 || '',               // DX: M_8
      params.Maintenance_M_9 || '',               // DY: M_9
      params.Maintenance_M_10 || '',              // DZ: M_10
      params.Maintenance_M_11 || '',              // EA: M_11
      params.Maintenance_remarks || '',           // EB: Maintenance Remarks
      
      // === HR SECTION (2 questions) === Columns EC-EE
      params.HR_HR_1 || '',                       // EC: HR_1
      params.HR_HR_2 || '',                       // ED: HR_2
      params.HR_remarks || '',                    // EE: HR Remarks
      
      // === IMAGE DATA === Column EF
      params.questionImagesJSON || ''             // EF: All images as JSON
    ];
    
    // Add the data to the sheet
    sheet.appendRow(rowData);
    
    console.log('QA survey data successfully saved to sheet with all 116 questions');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success', 
        message: 'QA survey submitted successfully',
        timestamp: timestamp 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing QA survey submission:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sets up the header row for the QA sheet with ALL 116 questions
 */
function setupQAHeaders(sheet) {
  const headers = [
    // Metadata
    'Timestamp',                                 // A
    'Submission Time',                           // B
    'QA Auditor Name',                          // C
    'QA Auditor ID',                           // D
    'Area Manager Name',                        // E
    'Area Manager ID',                          // F
    'Store Name',                               // G
    'Store ID',                                // H
    'Region',                                  // I
    'Total Score',                             // J
    'Max Score',                               // K
    'Score Percentage',                        // L
    'Auditor Signature',                       // M
    'SM Signature',                            // N
    
    // Zero Tolerance Section (6 questions)
    'ZT_1',                                    // O
    'ZT_2',                                    // P
    'ZT_3',                                    // Q
    'ZT_4',                                    // R
    'ZT_5',                                    // S
    'ZT_6',                                    // T
    'Zero Tolerance Remarks',                   // U
    
    // Store Section (94 questions)
    'S_1', 'S_2', 'S_3', 'S_4', 'S_5', 'S_6', 'S_7', 'S_8', 'S_9', 'S_10',     // V-AE
    'S_11', 'S_12', 'S_13', 'S_14', 'S_15', 'S_16', 'S_17', 'S_18', 'S_19', 'S_20',  // AF-AO
    'S_21', 'S_22', 'S_23', 'S_24', 'S_25', 'S_26', 'S_27', 'S_28', 'S_29', 'S_30',  // AP-AY
    'S_31', 'S_32', 'S_33', 'S_34', 'S_35', 'S_36', 'S_37', 'S_38', 'S_39', 'S_40',  // AZ-BI
    'S_41', 'S_42', 'S_43', 'S_44', 'S_45', 'S_46', 'S_47', 'S_48', 'S_49', 'S_50',  // BJ-BS
    'S_51', 'S_52', 'S_53', 'S_54', 'S_55', 'S_56', 'S_57', 'S_58', 'S_59', 'S_60',  // BT-CC
    'S_61', 'S_62', 'S_63', 'S_64', 'S_65', 'S_66', 'S_67', 'S_68', 'S_69', 'S_70',  // CD-CM
    'S_71', 'S_72', 'S_73', 'S_74', 'S_75', 'S_76', 'S_77', 'S_78', 'S_79', 'S_80',  // CN-CW
    'S_81', 'S_82', 'S_83', 'S_84', 'S_85', 'S_86', 'S_87', 'S_88', 'S_89', 'S_90',  // CX-DG
    'S_91', 'S_92', 'S_93', 'S_94',                                                   // DH-DK
    'Store Remarks',                                                                  // DL
    
    // A/QA Section (3 questions)
    'A_1', 'A_2', 'A_3',                                                             // DM-DO
    'QA Remarks',                                                                     // DP
    
    // Maintenance Section (11 questions)
    'M_1', 'M_2', 'M_3', 'M_4', 'M_5', 'M_6', 'M_7', 'M_8', 'M_9', 'M_10', 'M_11',  // DQ-EA
    'Maintenance Remarks',                                                            // EB
    
    // HR Section (2 questions)
    'HR_1', 'HR_2',                                                                   // EC-ED
    'HR Remarks',                                                                     // EE
    
    // Image Data
    'Images (JSON)'                                                                   // EF
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  console.log('QA sheet headers created with all 116 questions');
}
