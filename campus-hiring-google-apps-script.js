/**
 * Campus Hiring - Psychometric Assessment Google Apps Script
 * Handles form submissions and data retrieval for the psychometric assessment
 * Sheet name: Campus_Hiring
 * 
 * IMPORTANT: This script needs to be deployed as a web app with:
 * - Execute as: Me
 * - Who has access: Anyone
 * 
 * STRUCTURE: 30 Questions + Metadata + Category Scores
 * - 30 Assessment Questions (Q1 to Q30)
 * - Each question has 3 options (A, B, C) with weights (1, 2, 3)
 * - Categories: Communication, Problem Solving, Leadership, Attention to Detail, 
 *   Customer Service, Integrity, Teamwork, Time Management, Planning, Adaptability,
 *   Analysis, Growth Mindset
 * 
 * Functions:
 * 1. doPost() - Receives assessment submissions
 * 2. doGet() - Returns assessment data for the dashboard
 * 3. setupCampusHiringHeaders() - Sets up the spreadsheet headers
 * 4. testCampusHiringScript() - Test function for debugging
 */

/**
 * Handles GET requests to return Campus Hiring assessment data
 */
function doGet(e) {
  try {
    Logger.log('=== Campus Hiring Assessment GET Request Started ===');
    Logger.log('Request timestamp: ' + new Date().toISOString());
    console.log('Campus Hiring data request received');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Spreadsheet accessed: ' + ss.getName());
    let sheet = ss.getSheetByName('Campus_Hiring');
    
    // If no sheet exists or it's empty, return empty array
    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log('No Campus Hiring data found - sheet empty or does not exist');
      console.log('No Campus Hiring data found');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('Campus_Hiring sheet found with ' + sheet.getLastRow() + ' rows');
    
    // Get all data from the sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Remove header row
    const headers = values[0];
    const dataRows = values.slice(1);
    
    Logger.log('Headers found: ' + headers.length + ' columns');
    Logger.log('Data rows found: ' + dataRows.length + ' assessments');
    console.log(`Found ${dataRows.length} Campus Hiring assessments`);
    
    Logger.log('Starting data processing...');
    // Convert to JSON format expected by dashboard
    const assessments = dataRows.map((row, index) => {
      const assessment = {};
      
      // Map each column to the corresponding field
      headers.forEach((header, index) => {
        const value = row[index];
        
        // Map headers to expected field names
        if (value !== undefined && value !== null) {
          assessment[header] = value.toString();
        }
      });
      
      // Ensure numeric fields are properly formatted
      if (assessment['Score Percentage']) {
        assessment['Score Percentage'] = parseFloat(assessment['Score Percentage']) || 0;
      }
      if (assessment['Total Score']) {
        assessment['Total Score'] = parseFloat(assessment['Total Score']) || 0;
      }
      if (assessment['Max Score']) {
        assessment['Max Score'] = parseFloat(assessment['Max Score']) || 0;
      }
      
      return assessment;
    });
    
    Logger.log('Data processing complete - ' + assessments.length + ' assessments processed');
    Logger.log('Sample assessment structure: ' + JSON.stringify(Object.keys(assessments[0] || {})));
    console.log('Campus Hiring data successfully processed');
    
    Logger.log('=== Campus Hiring Assessment GET Request Completed Successfully ===');
    
    // Return the data as JSON
    return ContentService
      .createTextOutput(JSON.stringify(assessments))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('=== ERROR in Campus Hiring Assessment GET Request ===');
    Logger.log('Error type: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    console.error('Error retrieving Campus Hiring data:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Failed to retrieve Campus Hiring data', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests to receive assessment submissions
 */
function doPost(e) {
  try {
    Logger.log('=== Campus Hiring Assessment POST Submission Started ===');
    Logger.log('Request timestamp: ' + new Date().toISOString());
    console.log('Campus Hiring assessment submission received');
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Spreadsheet accessed: ' + ss.getName());
    let sheet = ss.getSheetByName('Campus_Hiring');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Campus_Hiring');
      Logger.log('Created new Campus_Hiring sheet');
      console.log('Created new Campus_Hiring sheet');
    } else {
      Logger.log('Campus_Hiring sheet already exists with ' + sheet.getLastRow() + ' rows');
    }
    
    // Parse the form data
    const params = e.parameter;
    Logger.log('Received parameters count: ' + Object.keys(params).length);
    console.log('Received parameters:', JSON.stringify(params));
    
    // Get current timestamp
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    Logger.log('Generated timestamp: ' + timestamp);
    
    // Initialize headers if this is the first submission
    if (sheet.getLastRow() === 0) {
      Logger.log('First submission - setting up headers');
      setupCampusHiringHeaders(sheet);
    }
    
    Logger.log('Preparing row data for Campus Hiring assessment...');
    // Prepare the row data
    const rowData = [
      timestamp,                                    // A: Timestamp
      params.submissionTime || '',                  // B: Submission Time
      params.candidateName || '',                   // C: Candidate Name
      params.candidatePhone || '',                  // D: Candidate Phone
      params.candidateEmail || '',                  // E: Candidate Email
      params.campusName || '',                      // F: Campus Name
      
      // Scoring Information
      parseFloat(params.totalScore) || 0,           // G: Total Score
      parseFloat(params.maxScore) || 0,             // H: Max Score
      parseFloat(params.scorePercentage) || 0,      // I: Score Percentage
      
      // All 30 Questions (Q1 to Q30) - Answer + Weight
      params.Q1 || '',                              // J: Q1 Answer
      params.Q1_weight || '',                       // K: Q1 Weight
      params.Q2 || '',                              // L: Q2 Answer
      params.Q2_weight || '',                       // M: Q2 Weight
      params.Q3 || '',                              // N: Q3 Answer
      params.Q3_weight || '',                       // O: Q3 Weight
      params.Q4 || '',                              // P: Q4 Answer
      params.Q4_weight || '',                       // Q: Q4 Weight
      params.Q5 || '',                              // R: Q5 Answer
      params.Q5_weight || '',                       // S: Q5 Weight
      params.Q6 || '',                              // T: Q6 Answer
      params.Q6_weight || '',                       // U: Q6 Weight
      params.Q7 || '',                              // V: Q7 Answer
      params.Q7_weight || '',                       // W: Q7 Weight
      params.Q8 || '',                              // X: Q8 Answer
      params.Q8_weight || '',                       // Y: Q8 Weight
      params.Q9 || '',                              // Z: Q9 Answer
      params.Q9_weight || '',                       // AA: Q9 Weight
      params.Q10 || '',                             // AB: Q10 Answer
      params.Q10_weight || '',                      // AC: Q10 Weight
      params.Q11 || '',                             // AD: Q11 Answer
      params.Q11_weight || '',                      // AE: Q11 Weight
      params.Q12 || '',                             // AF: Q12 Answer
      params.Q12_weight || '',                      // AG: Q12 Weight
      params.Q13 || '',                             // AH: Q13 Answer
      params.Q13_weight || '',                      // AI: Q13 Weight
      params.Q14 || '',                             // AJ: Q14 Answer
      params.Q14_weight || '',                      // AK: Q14 Weight
      params.Q15 || '',                             // AL: Q15 Answer
      params.Q15_weight || '',                      // AM: Q15 Weight
      params.Q16 || '',                             // AN: Q16 Answer
      params.Q16_weight || '',                      // AO: Q16 Weight
      params.Q17 || '',                             // AP: Q17 Answer
      params.Q17_weight || '',                      // AQ: Q17 Weight
      params.Q18 || '',                             // AR: Q18 Answer
      params.Q18_weight || '',                      // AS: Q18 Weight
      params.Q19 || '',                             // AT: Q19 Answer
      params.Q19_weight || '',                      // AU: Q19 Weight
      params.Q20 || '',                             // AV: Q20 Answer
      params.Q20_weight || '',                      // AW: Q20 Weight
      params.Q21 || '',                             // AX: Q21 Answer
      params.Q21_weight || '',                      // AY: Q21 Weight
      params.Q22 || '',                             // AZ: Q22 Answer
      params.Q22_weight || '',                      // BA: Q22 Weight
      params.Q23 || '',                             // BB: Q23 Answer
      params.Q23_weight || '',                      // BC: Q23 Weight
      params.Q24 || '',                             // BD: Q24 Answer
      params.Q24_weight || '',                      // BE: Q24 Weight
      params.Q25 || '',                             // BF: Q25 Answer
      params.Q25_weight || '',                      // BG: Q25 Weight
      params.Q26 || '',                             // BH: Q26 Answer
      params.Q26_weight || '',                      // BI: Q26 Weight
      params.Q27 || '',                             // BJ: Q27 Answer
      params.Q27_weight || '',                      // BK: Q27 Weight
      params.Q28 || '',                             // BL: Q28 Answer
      params.Q28_weight || '',                      // BM: Q28 Weight
      params.Q29 || '',                             // BN: Q29 Answer
      params.Q29_weight || '',                      // BO: Q29 Weight
      params.Q30 || '',                             // BP: Q30 Answer
      params.Q30_weight || '',                      // BQ: Q30 Weight
      
      // Category Scores (12 categories)
      params.category_Communication || '',                 // BR: Communication Score
      params['category_Problem Solving'] || '',            // BS: Problem Solving Score
      params.category_Leadership || '',                    // BT: Leadership Score
      params['category_Attention to Detail'] || '',        // BU: Attention to Detail Score
      params['category_Customer Service'] || '',           // BV: Customer Service Score
      params.category_Integrity || '',                     // BW: Integrity Score
      params.category_Teamwork || '',                      // BX: Teamwork Score
      params['category_Time Management'] || '',            // BY: Time Management Score
      params.category_Planning || '',                      // BZ: Planning Score
      params.category_Adaptability || '',                  // CA: Adaptability Score
      params.category_Analysis || '',                      // CB: Analysis Score
      params['category_Growth Mindset'] || '',             // CC: Growth Mindset Score
      
      // Proctoring Data
      params.proctoringEnabled || 'false',                 // CD: Proctoring Enabled
      params.totalViolations || '0',                       // CE: Total Violations
      params.tabSwitchCount || '0',                        // CF: Tab Switch Count
      params.tabSwitchViolations || '0',                   // CG: Tab Switch Violations
      params.faceNotDetectedViolations || '0',             // CH: Face Not Detected Violations
      params.multipleFacesViolations || '0',               // CI: Multiple Faces Violations
      params.excessiveNoiseViolations || '0',              // CJ: Excessive Noise Violations
      params.windowBlurViolations || '0',                  // CK: Window Blur Violations
      params.violationDetails || ''                        // CL: Violation Details (JSON)
    ];
    
    Logger.log('Row data prepared with ' + rowData.length + ' fields');
    Logger.log('Candidate: ' + params.candidateName);
    Logger.log('Campus: ' + params.campusName);
    Logger.log('Score: ' + params.totalScore + '/' + params.maxScore + ' (' + params.scorePercentage + '%)');
    
    // Log category scores for verification
    Logger.log('Category scores being saved:');
    Logger.log('  BR (Communication): ' + (params.category_Communication || ''));
    Logger.log('  BS (Problem Solving): ' + (params['category_Problem Solving'] || ''));
    Logger.log('  BT (Leadership): ' + (params.category_Leadership || ''));
    Logger.log('  BU (Attention to Detail): ' + (params['category_Attention to Detail'] || ''));
    Logger.log('  BV (Customer Service): ' + (params['category_Customer Service'] || ''));
    Logger.log('  BW (Integrity): ' + (params.category_Integrity || ''));
    Logger.log('  BX (Teamwork): ' + (params.category_Teamwork || ''));
    Logger.log('  BY (Time Management): ' + (params['category_Time Management'] || ''));
    Logger.log('  BZ (Planning): ' + (params.category_Planning || ''));
    Logger.log('  CA (Adaptability): ' + (params.category_Adaptability || ''));
    Logger.log('  CB (Analysis): ' + (params.category_Analysis || ''));
    Logger.log('  CC (Growth Mindset): ' + (params['category_Growth Mindset'] || ''));
    
    // Log proctoring data
    Logger.log('Proctoring data:');
    Logger.log('  CD (Proctoring Enabled): ' + (params.proctoringEnabled || 'false'));
    Logger.log('  CE (Total Violations): ' + (params.totalViolations || '0'));
    Logger.log('  CF (Tab Switch Count): ' + (params.tabSwitchCount || '0'));
    
    // Add the data to the sheet
    sheet.appendRow(rowData);
    Logger.log('Data appended to row ' + sheet.getLastRow());
    Logger.log('Sheet now has ' + sheet.getLastColumn() + ' columns');
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, Math.min(sheet.getLastColumn(), 26)); // Only resize first 26 columns
    Logger.log('Columns auto-resized');
    
    Logger.log('=== Campus Hiring assessment data successfully saved to sheet ===');
    console.log('Campus Hiring assessment data successfully saved to sheet');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'success', 
        message: 'Campus Hiring assessment submitted successfully',
        timestamp: timestamp 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('=== ERROR in Campus Hiring Assessment POST Submission ===');
    Logger.log('Error type: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    console.error('Error processing Campus Hiring assessment submission:', error);
    
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
 * Sets up the header row for the Campus_Hiring sheet
 */
function setupCampusHiringHeaders(sheet) {
  Logger.log('Setting up Campus_Hiring sheet headers...');
  
  const headers = [
    // Basic Information
    'Timestamp',                                 // A
    'Submission Time',                           // B
    'Candidate Name',                            // C
    'Candidate Phone',                           // D
    'Candidate Email',                           // E
    'Campus Name',                               // F
    
    // Scoring Information (Confidential)
    'Total Score',                               // G
    'Max Score',                                 // H
    'Score Percentage',                          // I
    
    // Questions 1-30 (Answer + Weight for each)
    'Q1: Recipe explanation to non-English teammate',        // J
    'Q1 Weight',                                             // K
    'Q2: Customer-facing message',                           // L
    'Q2 Weight',                                             // M
    'Q3: Drink tastes off',                                  // N
    'Q3 Weight',                                             // O
    'Q4: Customers arguing over table',                      // P
    'Q4 Weight',                                             // Q
    'Q5: Team not following cleaning checklist',            // R
    'Q5 Weight',                                             // S
    'Q6: Loose screw on grinder',                           // T
    'Q6 Weight',                                             // U
    'Q7: Team member constantly late',                       // V
    'Q7 Weight',                                             // W
    'Q8: Shift reports missing details',                     // X
    'Q8 Weight',                                             // Y
    'Q9: Customer says drink tastes strange',                // Z
    'Q9 Weight',                                             // AA
    'Q10: Supplier cash under table offer',                  // AB
    'Q10 Weight',                                            // AC
    'Q11: AC not working, cafe full',                        // AD
    'Q11 Weight',                                            // AE
    'Q12: Guest wants complex drink',                        // AF
    'Q12 Weight',                                            // AG
    'Q13: Long day, another team asks help',                 // AH
    'Q13 Weight',                                            // AI
    'Q14: 10 tasks, limited time',                           // AJ
    'Q14 Weight',                                            // AK
    'Q15: Event scheduled tomorrow',                         // AL
    'Q15 Weight',                                            // AM
    'Q16: New menu changes weekly',                          // AN
    'Q16 Weight',                                            // AO
    'Q17: Brief team from different city',                   // AP
    'Q17 Weight',                                            // AQ
    'Q18: POS not responding',                               // AR
    'Q18 Weight',                                            // AS
    'Q19: Three small hygiene errors',                       // AT
    'Q19 Weight',                                            // AU
    'Q20: Why cold brews not selling',                       // AV
    'Q20 Weight',                                            // AW
    'Q21: Handheld ordering device new features',            // AX
    'Q21 Weight',                                            // AY
    'Q22: Team member demotivated',                          // AZ
    'Q22 Weight',                                            // BA
    'Q23: Wallet on cafe floor',                             // BB
    'Q23 Weight',                                            // BC
    'Q24: Guest insists different order',                    // BD
    'Q24 Weight',                                            // BE
    'Q25: Customer points out expired stock',                // BF
    'Q25 Weight',                                            // BG
    'Q26: Rush hour, delivery sheet missing',                // BH
    'Q26 Weight',                                            // BI
    'Q27: LMS assignment due today',                         // BJ
    'Q27 Weight',                                            // BK
    'Q28: Critical feedback received',                       // BL
    'Q28 Weight',                                            // BM
    'Q29: Under pressure, team is new',                      // BN
    'Q29 Weight',                                            // BO
    'Q30: Customer speaks regional language',                // BP
    'Q30 Weight',                                            // BQ
    
    // Category Scores
    'Communication Score %',                     // BR
    'Problem Solving Score %',                   // BS
    'Leadership Score %',                        // BT
    'Attention to Detail Score %',               // BU
    'Customer Service Score %',                  // BV
    'Integrity Score %',                         // BW
    'Teamwork Score %',                          // BX
    'Time Management Score %',                   // BY
    'Planning Score %',                          // BZ
    'Adaptability Score %',                      // CA
    'Analysis Score %',                          // CB
    'Growth Mindset Score %',                    // CC
    
    // Proctoring Data
    'Proctoring Enabled',                        // CD
    'Total Violations',                          // CE
    'Tab Switch Count',                          // CF
    'Tab Switch Violations',                     // CG
    'Face Not Detected Violations',              // CH
    'Multiple Faces Violations',                 // CI
    'Excessive Noise Violations',                // CJ
    'Window Blur Violations',                    // CK
    'Violation Details'                          // CL (JSON string)
  ];
  
  Logger.log('Total headers: ' + headers.length);
  Logger.log('Last header (should be Growth Mindset Score %): ' + headers[headers.length - 1]);
  Logger.log('Expected to span columns A to CC (79 columns)');
  
  // Clear the sheet first to avoid old data interfering
  sheet.clear();
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#6366f1'); // Indigo background for Campus Hiring
  headerRange.setFontColor('white');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('Campus_Hiring sheet headers set up successfully');
  Logger.log('Sheet now has ' + sheet.getLastColumn() + ' columns');
  console.log('Campus_Hiring sheet headers set up successfully');
}

/**
 * Test function to verify the script setup - creates sample data
 */
function testCampusHiringScript() {
  Logger.log('=== Testing Campus Hiring Script Setup ===');
  console.log('Testing Campus Hiring script setup...');
  
  // Test data for POST (submission)
  const testData = {
    parameter: {
      submissionTime: '13/11/2025 14:30:00',
      candidateName: 'John Candidate',
      candidatePhone: '+91 98765 43210',
      candidateEmail: 'john.candidate@example.com',
      campusName: 'IIT Delhi',
      totalScore: 75,
      maxScore: 90,
      scorePercentage: 83.33,
      
      // Sample answers for all 30 questions
      Q1: 'C', Q1_weight: '3', Q1_category: 'Communication',
      Q2: 'C', Q2_weight: '3', Q2_category: 'Communication',
      Q3: 'C', Q3_weight: '3', Q3_category: 'Problem Solving',
      Q4: 'C', Q4_weight: '3', Q4_category: 'Problem Solving',
      Q5: 'B', Q5_weight: '2', Q5_category: 'Leadership',
      Q6: 'C', Q6_weight: '3', Q6_category: 'Attention to Detail',
      Q7: 'C', Q7_weight: '3', Q7_category: 'Leadership',
      Q8: 'C', Q8_weight: '3', Q8_category: 'Attention to Detail',
      Q9: 'C', Q9_weight: '3', Q9_category: 'Customer Service',
      Q10: 'C', Q10_weight: '3', Q10_category: 'Integrity',
      Q11: 'C', Q11_weight: '3', Q11_category: 'Problem Solving',
      Q12: 'B', Q12_weight: '2', Q12_category: 'Customer Service',
      Q13: 'C', Q13_weight: '3', Q13_category: 'Teamwork',
      Q14: 'C', Q14_weight: '3', Q14_category: 'Time Management',
      Q15: 'C', Q15_weight: '3', Q15_category: 'Planning',
      Q16: 'B', Q16_weight: '2', Q16_category: 'Adaptability',
      Q17: 'C', Q17_weight: '3', Q17_category: 'Communication',
      Q18: 'C', Q18_weight: '3', Q18_category: 'Problem Solving',
      Q19: 'C', Q19_weight: '3', Q19_category: 'Attention to Detail',
      Q20: 'C', Q20_weight: '3', Q20_category: 'Analysis',
      Q21: 'C', Q21_weight: '3', Q21_category: 'Adaptability',
      Q22: 'C', Q22_weight: '3', Q22_category: 'Leadership',
      Q23: 'C', Q23_weight: '3', Q23_category: 'Integrity',
      Q24: 'B', Q24_weight: '2', Q24_category: 'Customer Service',
      Q25: 'C', Q25_weight: '3', Q25_category: 'Integrity',
      Q26: 'C', Q26_weight: '3', Q26_category: 'Problem Solving',
      Q27: 'C', Q27_weight: '3', Q27_category: 'Time Management',
      Q28: 'C', Q28_weight: '3', Q28_category: 'Growth Mindset',
      Q29: 'B', Q29_weight: '2', Q29_category: 'Teamwork',
      Q30: 'C', Q30_weight: '3', Q30_category: 'Adaptability',
      
      // Category scores
      category_Communication: '90.0',
      'category_Problem Solving': '90.0',
      category_Leadership: '83.33',
      'category_Attention to Detail': '100.0',
      'category_Customer Service': '88.89',
      category_Integrity: '100.0',
      category_Teamwork: '83.33',
      'category_Time Management': '100.0',
      category_Planning: '100.0',
      category_Adaptability: '88.89',
      category_Analysis: '100.0',
      'category_Growth Mindset': '100.0'
    }
  };
  
  Logger.log('Testing POST function with sample data...');
  // Test POST function
  const postResult = doPost(testData);
  Logger.log('POST Test result: ' + postResult.getContent());
  console.log('POST Test result:', postResult.getContent());
  
  Logger.log('Testing GET function to retrieve data...');
  // Test GET function
  const getResult = doGet({});
  Logger.log('GET Test result: ' + getResult.getContent());
  console.log('GET Test result:', getResult.getContent());
  
  Logger.log('=== Campus Hiring Script Test Complete ===');
}

/**
 * Function to get Campus Hiring assessment statistics (for debugging)
 */
function getCampusHiringStats() {
  Logger.log('=== Retrieving Campus Hiring Statistics ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Campus_Hiring');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    Logger.log('No Campus Hiring assessments found');
    return { totalAssessments: 0, avgScore: 0, regions: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const assessments = data.slice(1); // Remove header row
  
  const totalAssessments = assessments.length;
  const scores = assessments.map(row => parseFloat(row[14]) || 0); // Score Percentage column (O)
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / totalAssessments;
  
  const regions = [...new Set(assessments.map(row => row[9]).filter(region => region))];
  
  const stats = {
    totalAssessments,
    avgScore: Math.round(avgScore * 100) / 100,
    regions,
    lastAssessment: assessments[assessments.length - 1][0] // Latest timestamp
  };
  
  Logger.log('Total Assessments: ' + stats.totalAssessments);
  Logger.log('Average Score: ' + stats.avgScore + '%');
  Logger.log('Regions: ' + stats.regions.join(', '));
  Logger.log('Last Assessment: ' + stats.lastAssessment);
  Logger.log('=== Campus Hiring Statistics Retrieved ===');
  
  return stats;
}

/**
 * Function to clear all Campus Hiring data (for testing purposes)
 */
function clearCampusHiringData() {
  Logger.log('=== Clearing Campus Hiring Data ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Campus_Hiring');
  
  if (sheet) {
    const rowCount = sheet.getLastRow();
    sheet.clear();
    setupCampusHiringHeaders(sheet);
    Logger.log('Campus Hiring data cleared - ' + (rowCount - 1) + ' rows removed');
    Logger.log('Headers reset with ' + sheet.getLastColumn() + ' columns');
    console.log('Campus Hiring data cleared and headers reset');
  } else {
    Logger.log('No Campus_Hiring sheet found to clear');
  }
  
  Logger.log('=== Campus Hiring Data Clear Complete ===');
}

/**
 * Function to verify header and data alignment
 */
function verifyCampusHiringAlignment() {
  Logger.log('=== Verifying Campus Hiring Sheet Alignment ===');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Campus_Hiring');
  
  if (!sheet) {
    Logger.log('No Campus_Hiring sheet found');
    return;
  }
  
  // Check headers
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log('Total header columns: ' + headerRow.length);
  Logger.log('First 10 headers: ' + headerRow.slice(0, 10).join(', '));
  Logger.log('Last 12 headers (should be category scores): ' + headerRow.slice(-12).join(', '));
  
  // Check column positions
  const expectedCategoryHeaders = [
    'Communication Score %',         // BR (column 70)
    'Problem Solving Score %',       // BS (column 71)
    'Leadership Score %',            // BT (column 72)
    'Attention to Detail Score %',   // BU (column 73)
    'Customer Service Score %',      // BV (column 74)
    'Integrity Score %',             // BW (column 75)
    'Teamwork Score %',              // BX (column 76)
    'Time Management Score %',       // BY (column 77)
    'Planning Score %',              // BZ (column 78)
    'Adaptability Score %',          // CA (column 79)
    'Analysis Score %',              // CB (column 80)
    'Growth Mindset Score %'         // CC (column 81)
  ];
  
  Logger.log('Verifying category header positions:');
  for (let i = 0; i < expectedCategoryHeaders.length; i++) {
    const col = 70 + i; // BR starts at column 70
    const actualHeader = sheet.getRange(1, col).getValue();
    const expectedHeader = expectedCategoryHeaders[i];
    const match = actualHeader === expectedHeader ? '✓' : '✗';
    Logger.log(`  Column ${col} (${getColumnLetter(col)}): Expected "${expectedHeader}", Got "${actualHeader}" ${match}`);
  }
  
  // Check data rows if they exist
  if (sheet.getLastRow() > 1) {
    Logger.log('\nChecking first data row:');
    const dataRow = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Total data columns: ' + dataRow.length);
    Logger.log('Candidate Name (C): ' + dataRow[2]);
    Logger.log('Campus Name (F): ' + dataRow[5]);
    Logger.log('Total Score (G): ' + dataRow[6]);
    Logger.log('Last 12 values (category scores): ' + dataRow.slice(-12).join(', '));
  }
  
  Logger.log('=== Alignment Verification Complete ===');
}

/**
 * Helper function to convert column number to letter
 */
function getColumnLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}
