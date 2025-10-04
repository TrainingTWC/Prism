/**
 * TRAINING AUDIT CHECKLIST - GOOGLE APPS SCRIPT
 * Dedicated script for Training Audit data only
 * URL: https://script.google.com/macros/s/AKfycby1Jv7rjhQMaF619V9DtDTHKH0eBF2QW-jS77bCIx51u5o9nGXNDmTLhVJ13iUGcYV-iw/exec
 */

// Configuration
const TRAINING_SHEET_NAME = 'Training Audit';

function doPost(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Training Audit');
    
    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Training Audit');
    }

    // Validate/detect region based on store ID
    var validatedRegion = detectRegionFromStoreId(params.storeId || '');
    params.region = validatedRegion;

    // Complete header for Training Audit (47 questions + metadata + section remarks)
    var header = [
      'Server Timestamp',
      'Submission Time', 
      'Trainer Name',
      'Trainer ID',
      'AM Name',
      'AM ID',
      'Store Name',
      'Store ID',
      'Region',
      'MOD',
      
      // Section 1: Training Materials (TM_1 to TM_9) - 9 questions
      'TM_1 - FRM available at store?',
      'TM_2 - BRM available at store?',
      'TM_3 - One-pager – Hot/Cue Cards displayed?',
      'TM_4 - One-pager – Cold/Cue Cards displayed?',
      'TM_5 - Dial-in One-pager visible?',
      'TM_6 - New-launch learning material available?',
      'TM_7 - COFFEE & HD Playbook in store?',
      'TM_8 - MSDS, chemical chart and Shelf life chart available?',
      'TM_9 - Career Progression Chart & Reward Poster displayed?',
      
      // Section 2: LMS Usage (LMS_1 to LMS_3) - 3 questions  
      'LMS_1 - Orientation & Induction completed within 3 days of joining?',
      'LMS_2 - All assessments & knowledge checks completed on LMS?',
      'LMS_3 - Team uses LMS for new info & comms?',
      
      // Section 3: Buddy Trainer Availability & Capability (Buddy_1 to Buddy_6) - 6 questions
      'Buddy_1 - Does the café have at least 20% of the staff certified Buddy Trainers?',
      'Buddy_2 - Have Buddy Trainers completed their Skill Check?',
      'Buddy_3 - Are trainees rostered with Buddy Trainers and working in the same shift?',
      'Buddy_4 - Have Buddy Trainers attended the BT workshop?',
      'Buddy_5 - Can Buddy Trainers explain the 4-step training process effectively?',
      'Buddy_6 - Can Buddy Trainers navigate Zing LMS flawlessly?',
      
      // Section 4: New Joiner Training & Records (NJ_1 to NJ_7) - 7 questions
      'NJ_1 - Is the OJT book available for all partners?',
      'NJ_2 - Are trainees referring to the OJT book and completing their skill checks?',
      'NJ_3 - Is training progression aligned with the Training Calendar/Plan?',
      'NJ_4 - Are team members aware of post-barista training progressions?',
      'NJ_5 - Have managers completed SHLP training as per the calendar?',
      'NJ_6 - Are there at least 2 FOSTAC-certified managers in the store?',
      'NJ_7 - Is ASM/SM training completed as per the Training Calendar?',
      
      // Section 5: Partner Knowledge (PK_1 to PK_7) - 7 questions
      'PK_1 - Are team members aware of current company communications?',
      'PK_2 - Ask a team member to conduct a Coffee Tasting & Sampling',
      'PK_3 - Is Sampling being conducted as per the set guidelines?',
      'PK_4 - Is Coffee Tasting engaging and effective?',
      'PK_5 - Are team members aware of manual brewing methods and standards?',
      'PK_6 - Are partners following grooming standards?',
      'PK_7 - Ask questions about key topics: COFFEE, LEAST, ROAST, Dial-in, Milk Steaming, LTO, Values(RESPECT), MSDS, Chemical Dilution, Food Safety, and Security.',
      
      // Section 6: TSA - Training Skill Assessment (TSA_1 to TSA_3) - 3 questions
      'TSA_1 - Partner 1 – Hot & Cold stations work?',
      'TSA_2 - Partner 2 – Food station cleanliness?',
      'TSA_3 - Partner 3 – Customer Service quality?',
      
      // Section 7: Customer Experience (CX_1 to CX_9) - 9 questions
      'CX_1 - Is background music at appropriate volume?',
      'CX_2 - Is store temperature comfortable?',
      'CX_3 - Are washrooms clean and well-maintained?',
      'CX_4 - Is Wi-Fi available & functioning properly?',
      'CX_5 - Are marketing & Visual Merchandise displays correct?',
      'CX_6 - Is store furniture clean & well-kept?',
      'CX_7 - What do you understand by MA, CPI, QA scores?',
      'CX_8 - What was the latest Mystery Audit score for the store?',
      'CX_9 - Top 2 CX opportunity areas last month?',
      
      // Section 8: Action Plan & Continuous Improvement (AP_1 to AP_3) - 3 questions
      'AP_1 - Concerns addressed within 48hrs?',
      'AP_2 - Action points closed/work-in-progress?',
      'AP_3 - Managers aware of action plan?',
      
      // Section Remarks
      'Section TrainingMaterials Remarks',
      'Section LMS Remarks', 
      'Section Buddy Remarks',
      'Section NewJoiner Remarks',
      'Section PartnerKnowledge Remarks',
      'Section TSA Remarks',
      'Section CustomerExperience Remarks',
      'Section ActionPlan Remarks',
      
      // Scoring
      'Total Score',
      'Max Score',
      'Percentage Score'
    ];

    // Ensure header row exists
    var needHeader = false;
    if (sheet.getLastRow() === 0) {
      needHeader = true;
    } else {
      var firstRow = sheet.getRange(1, 1, 1, header.length).getValues()[0] || [];
      if (firstRow.length !== header.length) {
        needHeader = true;
      }
    }
    if (needHeader) {
      if (sheet.getLastRow() > 0) sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }

    // Build row data in same order as header
    var row = [
      new Date(), // Server Timestamp
      params.timestamp || '',
      params.trainerName || '',
      params.trainerId || '',
      params.amName || '',
      params.amId || '',
      params.storeName || '',
      params.storeId || '',
      params.region || '',
      params.mod || '',
      
      // Section 1: Training Materials responses (TrainingMaterials_TM_1 to TrainingMaterials_TM_9)
      params.TrainingMaterials_TM_1 || '', params.TrainingMaterials_TM_2 || '', params.TrainingMaterials_TM_3 || '', 
      params.TrainingMaterials_TM_4 || '', params.TrainingMaterials_TM_5 || '', params.TrainingMaterials_TM_6 || '', 
      params.TrainingMaterials_TM_7 || '', params.TrainingMaterials_TM_8 || '', params.TrainingMaterials_TM_9 || '',
      
      // Section 2: LMS Usage responses (LMS_LMS_1 to LMS_LMS_3)  
      params.LMS_LMS_1 || '', params.LMS_LMS_2 || '', params.LMS_LMS_3 || '',
      
      // Section 3: Buddy Trainer responses (Buddy_Buddy_1 to Buddy_Buddy_6)
      params.Buddy_Buddy_1 || '', params.Buddy_Buddy_2 || '', params.Buddy_Buddy_3 || '', 
      params.Buddy_Buddy_4 || '', params.Buddy_Buddy_5 || '', params.Buddy_Buddy_6 || '',
      
      // Section 4: New Joiner Training responses (NewJoiner_NJ_1 to NewJoiner_NJ_7)
      params.NewJoiner_NJ_1 || '', params.NewJoiner_NJ_2 || '', params.NewJoiner_NJ_3 || '', 
      params.NewJoiner_NJ_4 || '', params.NewJoiner_NJ_5 || '', params.NewJoiner_NJ_6 || '', 
      params.NewJoiner_NJ_7 || '',
      
      // Section 5: Partner Knowledge responses (PartnerKnowledge_PK_1 to PartnerKnowledge_PK_7)
      params.PartnerKnowledge_PK_1 || '', params.PartnerKnowledge_PK_2 || '', params.PartnerKnowledge_PK_3 || '', 
      params.PartnerKnowledge_PK_4 || '', params.PartnerKnowledge_PK_5 || '', params.PartnerKnowledge_PK_6 || '', 
      params.PartnerKnowledge_PK_7 || '',
      
      // Section 6: TSA responses (TSA_TSA_1 to TSA_TSA_3)
      params.TSA_TSA_1 || '', params.TSA_TSA_2 || '', params.TSA_TSA_3 || '',
      
      // Section 7: Customer Experience responses (CustomerExperience_CX_1 to CustomerExperience_CX_9)
      params.CustomerExperience_CX_1 || '', params.CustomerExperience_CX_2 || '', params.CustomerExperience_CX_3 || '', 
      params.CustomerExperience_CX_4 || '', params.CustomerExperience_CX_5 || '', params.CustomerExperience_CX_6 || '', 
      params.CustomerExperience_CX_7 || '', params.CustomerExperience_CX_8 || '', params.CustomerExperience_CX_9 || '',
      
      // Section 8: Action Plan responses (ActionPlan_AP_1 to ActionPlan_AP_3)
      params.ActionPlan_AP_1 || '', params.ActionPlan_AP_2 || '', params.ActionPlan_AP_3 || '',
      
      // Section Remarks
      params.TrainingMaterials_remarks || '',
      params.LMS_remarks || '',
      params.Buddy_remarks || '',
      params.NewJoiner_remarks || '', 
      params.PartnerKnowledge_remarks || '',
      params.TSA_remarks || '',
      params.CustomerExperience_remarks || '',
      params.ActionPlan_remarks || '',
      
      // Scoring
      params.totalScore || '',
      params.maxScore || '',
      params.percentage || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'OK' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action;
    
    if (action === 'getData') {
      return getTrainingAuditData();
    }
    
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ERROR', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getTrainingAuditData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Training Audit');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0];
    var rows = data.slice(1);
    
    var jsonData = rows.map(function(row) {
      var obj = {};
      
      // Basic metadata
      obj.submissionTime = row[1] || '';
      obj.trainerName = row[2] || '';
      obj.trainerId = row[3] || '';
      obj.amName = row[4] || '';
      obj.amId = row[5] || '';
      obj.storeName = row[6] || '';
      obj.storeId = row[7] || '';
      obj.region = row[8] || '';
      obj.mod = row[9] || '';
      
      // All 47 question responses starting from column 10 - using simplified names
      var colIndex = 10; // Starting after metadata columns
      
      // Training Materials (9 questions) - map to TM_1, TM_2, etc.
      for (var i = 1; i <= 9; i++) {
        obj['TM_' + i] = row[colIndex++] || '';
      }
      
      // LMS Usage (3 questions) - map to LMS_1, LMS_2, etc.
      for (var i = 1; i <= 3; i++) {
        obj['LMS_' + i] = row[colIndex++] || '';
      }
      
      // Buddy Trainer (6 questions) - map to Buddy_1, Buddy_2, etc.
      for (var i = 1; i <= 6; i++) {
        obj['Buddy_' + i] = row[colIndex++] || '';
      }
      
      // New Joiner Training (7 questions) - map to NJ_1, NJ_2, etc.
      for (var i = 1; i <= 7; i++) {
        obj['NJ_' + i] = row[colIndex++] || '';
      }
      
      // Partner Knowledge (7 questions) - map to PK_1, PK_2, etc.
      for (var i = 1; i <= 7; i++) {
        obj['PK_' + i] = row[colIndex++] || '';
      }
      
      // TSA (3 questions) - map to TSA_1, TSA_2, etc.
      for (var i = 1; i <= 3; i++) {
        obj['TSA_' + i] = row[colIndex++] || '';
      }
      
      // Customer Experience (9 questions) - map to CX_1, CX_2, etc.
      for (var i = 1; i <= 9; i++) {
        obj['CX_' + i] = row[colIndex++] || '';
      }
      
      // Action Plan (3 questions) - map to AP_1, AP_2, etc.
      for (var i = 1; i <= 3; i++) {
        obj['AP_' + i] = row[colIndex++] || '';
      }
      
      // Section remarks
      obj.TrainingMaterials_remarks = row[colIndex++] || '';
      obj.LMS_remarks = row[colIndex++] || '';
      obj.Buddy_remarks = row[colIndex++] || '';
      obj.NewJoiner_remarks = row[colIndex++] || '';
      obj.PartnerKnowledge_remarks = row[colIndex++] || '';
      obj.TSA_remarks = row[colIndex++] || '';
      obj.CustomerExperience_remarks = row[colIndex++] || '';
      obj.ActionPlan_remarks = row[colIndex++] || '';
      
      // Scoring
      obj.totalScore = row[colIndex++] || '';
      obj.maxScore = row[colIndex++] || '';
      obj.percentageScore = row[colIndex++] || '';
      
      return obj;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Same region detection function as HR survey
function detectRegionFromStoreId(storeId) {
  if (!storeId) {
    return 'Unknown';
  }
  
  var storeRegionMapping = {
    'S153': 'North', 'S195': 'North', 'S202': 'North', 'S056': 'North', 'S101': 'North',
    'S112': 'North', 'S166': 'North', 'S167': 'North', 'S192': 'North', 'S027': 'North',
    'S037': 'North', 'S049': 'North', 'S055': 'North', 'S039': 'North', 'S042': 'North',
    'S062': 'North', 'S122': 'North', 'S024': 'North', 'S035': 'North', 'S072': 'North',
    'S142': 'North', 'S171': 'North', 'S172': 'North', 'S197': 'North', 'S198': 'North',
    'S029': 'North', 'S038': 'North', 'S073': 'North', 'S099': 'North', 'S100': 'North',
    'S102': 'North', 'S148': 'North', 'S150': 'North', 'S154': 'North', 'S155': 'North',
    'S164': 'North', 'S176': 'North', 'S026': 'North', 'S028': 'North', 'S036': 'North',
    'S040': 'North', 'S041': 'North', 'S113': 'North', 'S120': 'North', 'S129': 'North',
    'S121': 'North', 'S126': 'North', 'S141': 'North', 'S173': 'North', 'S174': 'North',
    'S182': 'North', 'S188': 'North', 'S200': 'North', 'S187': 'North',
    'S053': 'South', 'S032': 'South', 'S005': 'South', 'S091': 'South', 'S019': 'South',
    'S065': 'South', 'S189': 'South', 'S034': 'South', 'S184': 'South', 'S143': 'South',
    'S144': 'South', 'S145': 'South', 'S157': 'South', 'S123': 'South', 'S021': 'South',
    'S178': 'South', 'S199': 'South', 'S201': 'South', 'S023': 'South', 'S092': 'South',
    'S070': 'South', 'S020': 'South', 'S125': 'South', 'S146': 'South', 'S191': 'South',
    'S110': 'South', 'S185': 'South', 'S131': 'South', 'S068': 'South', 'S156': 'South',
    'S001': 'South', 'S069': 'South', 'S063': 'South', 'S002': 'South', 'S009': 'South',
    'S012': 'South', 'S004': 'South', 'S030': 'South', 'S031': 'South', 'S011': 'South',
    'S115': 'South', 'S014': 'South', 'S007': 'South', 'S193': 'South', 'S008': 'South',
    'S158': 'South', 'S067': 'South', 'S033': 'South', 'S094': 'South', 'S016': 'South',
    'S051': 'South', 'S159': 'South', 'S140': 'South', 'S119': 'South', 'S152': 'South',
    'S017': 'South', 'S139': 'South', 'S133': 'South', 'S149': 'South', 'S018': 'South',
    'S006': 'South', 'S003': 'South', 'S022': 'South', 'S015': 'South', 'S095': 'South',
    'S114': 'South', 'S050': 'South', 'S190': 'South', 'S901': 'South', 'S902': 'South',
    'S105': 'West', 'S096': 'West', 'S088': 'West', 'S076': 'West', 'S090': 'West',
    'S061': 'West', 'S138': 'West', 'S116': 'West', 'S132': 'West', 'S165': 'West',
    'S045': 'West', 'S087': 'West', 'S075': 'West', 'S047': 'West', 'S097': 'West',
    'S162': 'West', 'S163': 'West', 'S111': 'West', 'S103': 'West', 'S089': 'West',
    'S137': 'West', 'S147': 'West', 'S118': 'West', 'S127': 'West', 'S180': 'West',
    'S161': 'West', 'S168': 'West', 'S170': 'West', 'S077': 'West', 'S057': 'West',
    'S107': 'West', 'S106': 'West', 'S043': 'West', 'S078': 'West', 'S044': 'West',
    'S117': 'West', 'S135': 'West', 'S177': 'West', 'S080': 'West', 'S104': 'West',
    'S074': 'West', 'S059': 'West', 'S060': 'West', 'S048': 'West', 'S058': 'West',
    'S109': 'West', 'S134': 'West', 'S130': 'West', 'S136': 'West', 'S128': 'West',
    'S086': 'West', 'S066': 'West', 'S081': 'West', 'S082': 'West', 'S083': 'West',
    'S085': 'West', 'S084': 'West', 'S108': 'West', 'S169': 'West', 'S175': 'West',
    'S206': 'West', 'S194': 'West'
  };
  
  return storeRegionMapping[storeId] || 'Unknown';
}

// Utility function to test the script
function testTrainingAuditScript() {
  console.log('Testing Training Audit Google Apps Script...');
  
  // Test data structure (form data format)
  const testData = {
    type: 'Training',
    trainerName: 'John Trainer',
    trainerId: 'T001',
    amName: 'Area Manager 1',
    amId: 'AM001',
    storeName: 'Store ABC',
    storeId: 'S001',
    mod: 'Manager on Duty',
    totalScore: '85',
    maxScore: '100',
    percentage: '85',
    'TrainingMaterials_TM_1': 'yes',
    'TrainingMaterials_TM_2': 'no',
    'TrainingMaterials_TM_3': 'yes',
    'LMS_LMS_1': 'yes',
    'TSA_TSA_1': '8',
    'TrainingMaterials_remarks': 'Some issues with training materials',
    'LMS_remarks': 'Good LMS usage overall'
  };
  
  try {
    // Simulate POST request
    const postResult = doPost({
      parameter: testData
    });
    
    console.log('POST test result:', postResult.getContent());
    
    // Simulate GET request
    const getResult = doGet({
      parameter: {
        action: 'getData'
      }
    });
    
    console.log('GET test result:', getResult.getContent());
    
    console.log('Training Audit script test completed successfully!');
    
  } catch (error) {
    console.error('Training Audit script test failed:', error);
  }
}