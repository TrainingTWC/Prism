/**
 * BENCH PLANNING GOOGLE APPS SCRIPT - SHIFT MANAGER TO ASSISTANT STORE MANAGER
 * 
 * This script manages three separate sheets for the SM to ASM Bench Planning module:
 * 1. SM_ASM_Candidates - Master list of candidates with manager and panelist info
 * 2. SM_ASM_Readiness - Manager assessments (17 items, scored 1-5)
 * 3. SM_ASM_Assessments - Candidate self-assessments (one attempt only)
 * 4. SM_ASM_Interviews - Panelist evaluations (8 sections, scored 1-5)
 * 
 * Workflow:
 * - Manager completes readiness checklist
 * - If passed (80%+) and scheduled time reached, candidate unlocks self-assessment
 * - If passed assessment (80%+), panelist unlocks interview
 */

// Sheet names
const SHEETS = {
  CANDIDATES: 'SM_ASM_Candidates',
  READINESS: 'SM_ASM_Readiness',
  ASSESSMENT: 'SM_ASM_Assessments',
  INTERVIEW: 'SM_ASM_Interviews',
  STORE_MAPPING: 'Store_Mapping'  // Shared store/AM lookup sheet
};

// Readiness checklist items (17 items) - SM to ASM criteria
const READINESS_ITEMS = [
  'Demonstrates clear understanding of P&L, cost control, and store-level KPIs.',
  'Prioritizes tasks effectively to balance customer experience, operations, and team well-being.',
  'Ensures full compliance with SOPs, safety protocols, food safety, and statutory regulations.',
  'Continuously identifies operational bottlenecks and initiates sustainable solutions.',
  'Provides regular coaching and feedback to team members for performance and growth.',
  'Recognizes and nurtures talent; supports internal promotions and succession planning.',
  'Maintains discipline and professionalism across the team, addressing issues promptly and fairly.',
  'Drives team motivation and morale during high-pressure periods or challenging days.',
  'Sets the standard for guest engagement and leads by example in service excellence.',
  'Handles escalated customer issues with calm, confidence, and effective resolution.',
  'Builds a loyal customer base through consistent service, community engagement, and feedback handling.',
  'Owns store performance and consistently works toward achieving business targets.',
  'Takes accountability for store readiness, cleanliness, and team presentation at all times.',
  'Maintains confidentiality and demonstrates integrity in handling team, cash, and store matters.',
  'Represents the brand positively in all forums and communications.',
  'Actively seeks feedback and development opportunities to grow as a leader.',
  'Completes all advanced training modules (e.g., leadership, financial acumen, compliance).'
];

// Interview sections (8 sections)
const INTERVIEW_SECTIONS = [
  'Operational Excellence & Process Management',
  'Team Leadership & People Development',
  'Guest Experience & Service Excellence',
  'Business Acumen & Cost Management',
  'Problem Solving & Decision Making',
  'Communication & Stakeholder Management',
  'Adaptability & Change Management',
  'Strategic Thinking & Initiative'
];

// Self Assessment MCQ Questions (20 questions)
const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: "Last month's total sales were ₹5,50,000. This month it dropped by 10%. What are this month's sales?",
    options: {
      A: "₹4,95,000",
      B: "₹4,85,000",
      C: "₹5,25,000",
      D: "₹5,00,000"
    },
    correctAnswer: "A"
  },
  {
    id: 2,
    question: "You have ₹1,20,000 as your monthly budget for inventory. You've already spent ₹86,000. How much balance remains?",
    options: {
      A: "₹36,000",
      B: "₹38,000",
      C: "₹34,000",
      D: "₹40,000"
    },
    correctAnswer: "C"
  },
  {
    id: 3,
    question: "The cost of making one beverage is ₹55, and it is sold at ₹130. What is the profit margin per drink?",
    options: {
      A: "₹65",
      B: "₹75",
      C: "₹85",
      D: "₹95"
    },
    correctAnswer: "B"
  },
  {
    id: 4,
    question: "Your store's target is ₹6,00,000. You've achieved ₹4,20,000 in 20 days. What's the required daily average for the remaining 10 days?",
    options: {
      A: "₹15,000",
      B: "₹18,000",
      C: "₹20,000",
      D: "₹22,000"
    },
    correctAnswer: "B"
  },
  {
    id: 5,
    question: "Your average daily sales are ₹18,000. Your gross margin is 60%. What is your approximate monthly gross profit (30 days)?",
    options: {
      A: "₹3,00,000",
      B: "₹3,60,000",
      C: "₹3,24,000",
      D: "₹4,20,000"
    },
    correctAnswer: "C"
  },
  {
    id: 6,
    question: "A beverage's ingredient cost is ₹35. If wastage is 8% and spoilage loss is 5%, what is the adjusted cost per beverage?",
    options: {
      A: "₹37.50",
      B: "₹38.85",
      C: "₹40.25",
      D: "₹41.20"
    },
    correctAnswer: "D"
  },
  {
    id: 7,
    question: "A barista makes an error in a drink three times in one shift. What's your first response?",
    options: {
      A: "Issue warning letter",
      B: "Ignore – busy shift",
      C: "Observe and retrain",
      D: "Replace them on shift"
    },
    correctAnswer: "C"
  },
  {
    id: 8,
    question: "If A is faster than B, B is faster than C, but C is most accurate, whom do you schedule during a high-accuracy order window?",
    options: {
      A: "A",
      B: "C",
      C: "B",
      D: "A and C"
    },
    correctAnswer: "B"
  },
  {
    id: 9,
    question: "You need 5 staff to manage the floor, but one has called in sick. What do you do first?",
    options: {
      A: "Call backup staff",
      B: "Reduce service area",
      C: "Skip Breaks",
      D: "Do nothing"
    },
    correctAnswer: "A"
  },
  {
    id: 10,
    question: "A customer orders 4 beverages, but the system only bills for 3. What do you do?",
    options: {
      A: "Let it go",
      B: "Inform customer and add item",
      C: "Adjust from another order",
      D: "Pay difference yourself"
    },
    correctAnswer: "B"
  },
  {
    id: 11,
    question: "You have to reduce 10 labor hours per week while maintaining service. Which solution is most efficient?",
    options: {
      A: "Reduce each staff's shift by 30 minutes",
      B: "Remove one low traffic shift/lean shift entirely",
      C: "Shorten peak hours",
      D: "Cut breaks"
    },
    correctAnswer: "B"
  },
  {
    id: 12,
    question: "A system generates the following pattern of sales increase: 5%, 10%, 15%, 20%… What would be the % increase in the 6th week?",
    options: {
      A: "30%",
      B: "35%",
      C: "40%",
      D: "25%"
    },
    correctAnswer: "D"
  },
  {
    id: 13,
    question: "During peak time, your POS system crashes. What's your action?",
    options: {
      A: "Stop service",
      B: "Use manual billing after informing the AM",
      C: "Wait for IT",
      D: "Inform customers and close the store"
    },
    correctAnswer: "B"
  },
  {
    id: 14,
    question: "You're promoted over a peer who expected the role. They're demotivated and disengaging. You:",
    options: {
      A: "Assign fewer responsibilities",
      B: "Address it 1:1, acknowledge the situation, and re-engage",
      C: "Let them cool off on their own",
      D: "Involve HR directly"
    },
    correctAnswer: "B"
  },
  {
    id: 15,
    question: "You are asked to lead two new stores temporarily, but your own store is under-staffed. What's your approach?",
    options: {
      A: "Delegate internally and develop one team member as acting lead",
      B: "Decline the opportunity",
      C: "Ask for external support",
      D: "Take it on and manage all yourself"
    },
    correctAnswer: "A"
  },
  {
    id: 16,
    question: "How often should you appreciate your team?",
    options: {
      A: "Only for major achievements",
      B: "Rarely",
      C: "Publicly and often for small wins",
      D: "Once a month"
    },
    correctAnswer: "C"
  },
  {
    id: 17,
    question: "Your team consistently meets targets, but morale is low. You:",
    options: {
      A: "Celebrate small wins",
      B: "Increase targets",
      C: "Let them continue",
      D: "Avoid change"
    },
    correctAnswer: "A"
  },
  {
    id: 18,
    question: "You've received a customer complaint on social media about rude service. What is your priority?",
    options: {
      A: "Delete the comment",
      B: "Apologize publicly and take it offline",
      C: "Privately message the customer",
      D: "Give discount on next visit"
    },
    correctAnswer: "B"
  },
  {
    id: 19,
    question: "A delivery vendor is late for the third time in a week, impacting morning prep. What's the ideal response?",
    options: {
      A: "Cancel the vendor immediately",
      B: "Apologize publicly and take it offline",
      C: "Raise an SLA concern and request urgent resolution",
      D: "Accept and move on"
    },
    correctAnswer: "C"
  },
  {
    id: 20,
    question: "You observe shortcuts being taken during cleaning. You:",
    options: {
      A: "Suspend team",
      B: "Inform area manager",
      C: "Coach the team",
      D: "Ignore — it's minor"
    },
    correctAnswer: "C"
  }
];

/**
 * Helper function to lookup store and manager information
 */
function getStoreAndManagerInfo(storeId, reportingManagerId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mappingSheet = ss.getSheetByName(SHEETS.STORE_MAPPING);
    
    let storeName = storeId;
    let managerId = reportingManagerId;
    let managerName = reportingManagerId;
    let region = 'Unknown';
    
    if (mappingSheet) {
      const data = mappingSheet.getDataRange().getValues();
      
      // Find store info and Area Manager info (columns: Store ID, Store Name, AM ID, AM Name, Region)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[0].toString() === storeId) {
          storeName = row[1] || storeId;
          managerId = row[2] || reportingManagerId;  // Use AM ID from mapping
          managerName = row[3] || reportingManagerId; // Use AM Name from mapping
          region = row[4] || 'Unknown';
          break;
        }
      }
    }
    
    return { storeName, managerId, managerName, region };
  } catch (error) {
    console.error('Error looking up store/manager info:', error);
    return { storeName: storeId, managerId: reportingManagerId, managerName: reportingManagerId, region: 'Unknown' };
  }
}

/**
 * Handle GET requests - Retrieve data
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const employeeId = e.parameter.employeeId;

    if (!action) {
      return createResponse(false, 'No action specified');
    }

    switch (action) {
      case 'getCandidateData':
        return getCandidateData(employeeId);
      
      case 'getAllCandidates':
        return getAllCandidates();
      
      case 'getManagerCandidates':
        return getManagerCandidates(e.parameter.managerId);
      
      case 'getPanelistCandidates':
        return getPanelistCandidates(e.parameter.panelistId);
      
      case 'getDashboardData':
        return getDashboardData();
      
      case 'getAssessmentQuestions':
        return getAssessmentQuestions();
      
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Handle POST requests - Submit data
 */
function doPost(e) {
  try {
    // Handle both JSON and URL-encoded form data
    let data;
    if (e.postData && e.postData.contents) {
      try {
        // Try parsing as JSON first
        data = JSON.parse(e.postData.contents);
      } catch {
        // If not JSON, it's URL-encoded form data
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }
    
    // Parse JSON strings in the data (for URL-encoded submissions)
    if (data.scores && typeof data.scores === 'string') {
      try {
        data.scores = JSON.parse(data.scores);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    if (data.answers && typeof data.answers === 'string') {
      try {
        data.answers = JSON.parse(data.answers);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    
    const action = data.action;

    if (!action) {
      return createResponse(false, 'No action specified');
    }

    switch (action) {
      case 'submitReadiness':
        return submitReadinessChecklist(data);
      
      case 'submitAssessment':
        return submitSelfAssessment(data);
      
      case 'submitInterview':
        return submitInterview(data);
      
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Get candidate data and their progress status
 */
function getCandidateData(employeeId) {
  try {
    if (!employeeId) {
      return createResponse(false, 'Employee ID required');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get candidate info from master sheet
    const candidateSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    if (!candidateSheet) {
      return createResponse(false, 'Candidates sheet not found');
    }

    const candidateData = candidateSheet.getDataRange().getValues();
    const candidateRow = candidateData.find(row => row[0] && row[0].toString().toUpperCase() === employeeId.toUpperCase());
    
    if (!candidateRow) {
      return createResponse(false, 'Candidate not found');
    }

    const candidate = {
      employeeId: candidateRow[0],
      employeeName: candidateRow[1],
      managerId: candidateRow[2],
      managerName: candidateRow[3],
      panelistId: candidateRow[4],
      panelistName: candidateRow[5],
      storeId: candidateRow[6] || '',
      region: candidateRow[7] || 'Unknown',
      assessmentUnlockDateTime: candidateRow[8] || ''
    };

    // Get readiness status
    const readinessSheet = ss.getSheetByName(SHEETS.READINESS);
    let readinessStatus = { status: 'not_started', passed: false };
    
    if (readinessSheet) {
      const readinessData = readinessSheet.getDataRange().getValues();
      const readinessRow = readinessData.slice(1).find(row => row[1] && row[1].toString().toUpperCase() === employeeId.toUpperCase());
      
      if (readinessRow) {
        const totalScore = readinessRow[6];
        const maxScore = readinessRow[7];
        const passed = readinessRow[8];
        const scoresJSON = readinessRow[5];
        
        // Parse the scores from JSON
        let scores = {};
        try {
          scores = JSON.parse(scoresJSON);
        } catch (e) {
          scores = {};
        }
        
        readinessStatus = {
          status: passed ? 'passed' : 'failed',
          passed: passed,
          totalScore: totalScore,
          maxScore: maxScore,
          percentage: (totalScore / maxScore * 100).toFixed(2),
          scores: scores
        };
      }
    }

    // Get assessment status
    const assessmentSheet = ss.getSheetByName(SHEETS.ASSESSMENT);
    
    // Check if assessment unlock time has arrived
    const currentTime = new Date();
    let assessmentUnlockTime = null;
    let timeUnlocked = true; // Default to true if no time is set
    
    if (candidateRow[8]) {
      try {
        assessmentUnlockTime = new Date(candidateRow[8]);
        timeUnlocked = currentTime >= assessmentUnlockTime;
      } catch (e) {
        // If date parsing fails, allow access
        timeUnlocked = true;
      }
    }
    
    let assessmentStatus = { 
      unlocked: readinessStatus.passed && timeUnlocked,
      timeUnlocked: timeUnlocked,
      assessmentUnlockDateTime: assessmentUnlockTime ? assessmentUnlockTime.toISOString() : null,
      attempted: false, 
      passed: false 
    };
    
    if (assessmentSheet) {
      const assessmentData = assessmentSheet.getDataRange().getValues();
      const assessmentRow = assessmentData.slice(1).find(row => row[1] && row[1].toString().toUpperCase() === employeeId.toUpperCase());
      
      if (assessmentRow) {
        // Parse answers JSON
        let answersJSON = null;
        try {
          answersJSON = assessmentRow[3] ? JSON.parse(assessmentRow[3]) : null;
        } catch (e) {
          answersJSON = null;
        }
        
        assessmentStatus = {
          unlocked: true,
          attempted: true,
          passed: assessmentRow[4] || false,
          score: assessmentRow[7] || 0,  // Column 7 is Percentage
          totalScore: assessmentRow[5] || 0,
          maxScore: assessmentRow[6] || 0,
          answers: answersJSON  // Include raw answers for frontend recalculation
        };
      }
    }

    // Get interview status
    const interviewSheet = ss.getSheetByName(SHEETS.INTERVIEW);
    let interviewStatus = { 
      unlocked: assessmentStatus.passed,
      completed: false
    };
    
    if (interviewSheet) {
      const interviewData = interviewSheet.getDataRange().getValues();
      const interviewRow = interviewData.slice(1).find(row => row[1] && row[1].toString().toUpperCase() === employeeId.toUpperCase());
      
      if (interviewRow) {
        interviewStatus.completed = true;
        interviewStatus.totalScore = interviewRow[6];
      }
    }

    return createResponse(true, 'Data retrieved successfully', {
      candidate,
      readinessStatus,
      assessmentStatus,
      interviewStatus
    });

  } catch (error) {
    return createResponse(false, 'Error retrieving candidate data: ' + error.toString());
  }
}

/**
 * Submit Readiness Checklist
 */
function submitReadinessChecklist(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.READINESS);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.READINESS);
    }
    
    // Check if headers exist (check if first row is empty or doesn't have expected headers)
    const firstRow = sheet.getRange(1, 1, 1, 20).getValues()[0];
    const hasHeaders = firstRow[0] && firstRow[0].toString().includes('Timestamp');
    
    if (!hasHeaders) {
      // Create headers
      const headers = [
        'Timestamp',
        'Employee ID',
        'Employee Name',
        'Manager ID',
        'Manager Name',
        'Scores (JSON)',
        'Total Score',
        'Max Score',
        'Passed',
        'Percentage',
        'Remarks'
      ];
      
      // Add individual score columns for each item
      for (let i = 0; i < READINESS_ITEMS.length; i++) {
        headers.push(`Item ${i + 1} Score`);
      }
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4A5568');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if employee already has ANY submission
    const existingData = sheet.getDataRange().getValues();
    const existingRow = existingData.slice(1).findIndex(row => 
      row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase()
    );
    
    if (existingRow !== -1) {
      return createResponse(false, 'Readiness checklist already submitted for this candidate. Cannot resubmit.');
    }
    
    // New submission
    const newRow = [
      data.submissionTime || new Date().toISOString(),
      data.employeeId,
      data.employeeName,
      data.managerId,
      data.managerName,
      JSON.stringify(data.scores),
      data.totalScore,
      data.maxScore,
      data.passed,
      (data.totalScore / data.maxScore * 100).toFixed(2),
      data.remarks || ''
    ];
    
    // Add individual scores
    for (let i = 0; i < READINESS_ITEMS.length; i++) {
      newRow.push(data.scores[i] || 0);
    }
    
    sheet.appendRow(newRow);
    
    return createResponse(true, 'Readiness checklist submitted successfully', {
      passed: data.passed,
      totalScore: data.totalScore,
      maxScore: data.maxScore
    });

  } catch (error) {
    return createResponse(false, 'Error submitting readiness checklist: ' + error.toString());
  }
}

/**
 * Submit Self Assessment
 */
function submitSelfAssessment(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.ASSESSMENT);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.ASSESSMENT);
    }
    
    // Check if headers exist
    const firstRow = sheet.getRange(1, 1, 1, 20).getValues()[0];
    const hasHeaders = firstRow[0] && firstRow[0].toString().includes('Timestamp');
    
    if (!hasHeaders) {
      const headers = [
        'Timestamp',
        'Employee ID',
        'Employee Name',
        'Answers (JSON)',
        'Passed',
        'Total Score',
        'Max Score',
        'Percentage',
        'Attempt Number'
      ];
      
      // Add individual answer columns
      for (let i = 0; i < ASSESSMENT_QUESTIONS.length; i++) {
        headers.push(`Q${i + 1} Answer`);
        headers.push(`Q${i + 1} Correct`);
      }
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4A5568');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if employee has already attempted
    const existingData = sheet.getDataRange().getValues();
    const existingAttempt = existingData.slice(1).find(row => row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase());
    
    if (existingAttempt) {
      return createResponse(false, 'Assessment already attempted. Only one attempt is allowed.');
    }

    // Calculate score
    let correctCount = 0;
    const answers = typeof data.answers === 'string' ? JSON.parse(data.answers) : (data.answers || {});
    
    for (let i = 0; i < ASSESSMENT_QUESTIONS.length; i++) {
      const questionId = ASSESSMENT_QUESTIONS[i].id;
      const userAnswer = answers[questionId];
      const correctAnswer = ASSESSMENT_QUESTIONS[i].correctAnswer;
      
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    }
    
    const totalScore = correctCount;
    const maxScore = ASSESSMENT_QUESTIONS.length;
    const percentage = (totalScore / maxScore * 100).toFixed(2);
    const passed = percentage >= 80;

    const newRow = [
      data.submissionTime || new Date().toISOString(),
      data.employeeId,
      data.employeeName,
      JSON.stringify(answers),
      passed,
      totalScore,
      maxScore,
      percentage,
      1
    ];
    
    // Add individual answers and correctness
    for (let i = 0; i < ASSESSMENT_QUESTIONS.length; i++) {
      const questionId = ASSESSMENT_QUESTIONS[i].id;
      const userAnswer = answers[questionId] || 'Not Answered';
      const correctAnswer = ASSESSMENT_QUESTIONS[i].correctAnswer;
      const isCorrect = userAnswer === correctAnswer;
      
      newRow.push(userAnswer);
      newRow.push(isCorrect);
    }
    
    sheet.appendRow(newRow);
    
    return createResponse(true, 'Assessment submitted successfully', {
      passed: passed,
      totalScore: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      correctCount: correctCount
    });

  } catch (error) {
    return createResponse(false, 'Error submitting assessment: ' + error.toString());
  }
}

/**
 * Submit Interview
 */
function submitInterview(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.INTERVIEW);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.INTERVIEW);
    }
    
    // Check if headers exist
    const firstRow = sheet.getRange(1, 1, 1, 20).getValues()[0];
    const hasHeaders = firstRow[0] && firstRow[0].toString().includes('Timestamp');
    
    if (!hasHeaders) {
      const headers = [
        'Timestamp',
        'Employee ID',
        'Employee Name',
        'Panelist ID',
        'Panelist Name',
        'Scores (JSON)',
        'Total Score',
        'Max Score',
        'Percentage',
        'Remarks'
      ];
      
      // Add individual score columns for each section
      for (let i = 0; i < INTERVIEW_SECTIONS.length; i++) {
        headers.push(`${INTERVIEW_SECTIONS[i]} Score`);
      }
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4A5568');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if interview already exists
    const existingData = sheet.getDataRange().getValues();
    const existingRow = existingData.slice(1).findIndex(row => row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase());
    
    const baseRow = [
      data.submissionTime || new Date().toISOString(),
      data.employeeId,
      data.employeeName,
      data.panelistId,
      data.panelistName,
      JSON.stringify(data.scores),
      data.totalScore,
      data.maxScore,
      (data.totalScore / data.maxScore * 100).toFixed(2),
      data.remarks || ''
    ];
    
    // Add individual scores
    for (let i = 0; i < INTERVIEW_SECTIONS.length; i++) {
      baseRow.push(data.scores[i] || 0);
    }
    
    if (existingRow !== -1) {
      const rowIndex = existingRow + 2;
      sheet.getRange(rowIndex, 1, 1, baseRow.length).setValues([baseRow]);
      
      return createResponse(true, 'Interview updated successfully', {
        totalScore: data.totalScore,
        maxScore: data.maxScore
      });
    } else {
      sheet.appendRow(baseRow);
      
      return createResponse(true, 'Interview submitted successfully', {
        totalScore: data.totalScore,
        maxScore: data.maxScore
      });
    }

  } catch (error) {
    return createResponse(false, 'Error submitting interview: ' + error.toString());
  }
}

/**
 * Get all candidates
 */
function getAllCandidates() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!sheet) {
      return createResponse(false, 'Candidates sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    const candidates = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        candidates.push({
          employeeId: row[0],
          employeeName: row[1],
          managerId: row[2],
          managerName: row[3],
          panelistId: row[4],
          panelistName: row[5],
          storeId: row[6] || '',
          region: row[7] || 'Unknown',
          assessmentUnlockDateTime: row[8] || ''
        });
      }
    }

    return createResponse(true, 'Candidates retrieved successfully', { candidates });

  } catch (error) {
    return createResponse(false, 'Error retrieving candidates: ' + error.toString());
  }
}

/**
 * Get candidates reporting to a specific manager
 */
function getManagerCandidates(managerId) {
  try {
    if (!managerId) {
      return createResponse(false, 'Manager ID is required');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!sheet) {
      return createResponse(false, 'Candidates sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    const candidates = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[2] && row[2].toString().toUpperCase() === managerId.toUpperCase()) {
        candidates.push({
          employeeId: row[0],
          employeeName: row[1],
          managerId: row[2],
          managerName: row[3],
          panelistId: row[4],
          panelistName: row[5],
          storeId: row[6] || '',
          region: row[7] || 'Unknown',
          assessmentUnlockDateTime: row[8] || ''
        });
      }
    }

    return createResponse(true, 'Manager candidates retrieved successfully', { candidates });

  } catch (error) {
    return createResponse(false, 'Error retrieving manager candidates: ' + error.toString());
  }
}

/**
 * Get panelist's assigned candidates with their progress
 */
function getPanelistCandidates(panelistId) {
  try {
    if (!panelistId) {
      return createResponse(false, 'Panelist ID is required');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!candidatesSheet) {
      return createResponse(false, 'Candidates sheet not found');
    }

    const candidatesData = candidatesSheet.getDataRange().getValues();
    
    // Get progress data from other sheets
    const readinessSheet = ss.getSheetByName(SHEETS.READINESS);
    const readinessData = readinessSheet ? readinessSheet.getDataRange().getValues().slice(1) : [];
    
    const assessmentSheet = ss.getSheetByName(SHEETS.ASSESSMENT);
    const assessmentData = assessmentSheet ? assessmentSheet.getDataRange().getValues().slice(1) : [];
    
    const interviewSheet = ss.getSheetByName(SHEETS.INTERVIEW);
    const interviewData = interviewSheet ? interviewSheet.getDataRange().getValues().slice(1) : [];
    
    const candidates = [];

    // Filter candidates by panelist ID (column index 4) and add their scores
    for (let i = 1; i < candidatesData.length; i++) {
      const row = candidatesData[i];
      if (row[0] && row[4] && row[4].toString().toUpperCase() === panelistId.toUpperCase()) {
        const employeeId = row[0];
        const storeId = row[6] || 'Unknown';
        const reportingManagerId = row[2];
        
        // Lookup store and manager info
        const lookupInfo = getStoreAndManagerInfo(storeId, reportingManagerId);
        let region = row[7] || 'Unknown';
        if (region === 'Unknown' || !region) {
          region = lookupInfo.region;
        }
        
        // Get readiness score
        const readinessRow = readinessData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
        let readinessStatus = 'Not Started';
        let readinessScore = null;
        if (readinessRow) {
          const totalScore = readinessRow[6];
          const maxScore = readinessRow[7];
          const passed = readinessRow[8];
          readinessScore = parseFloat(((totalScore / maxScore) * 100).toFixed(2));
          readinessStatus = passed ? 'Passed' : 'Failed';
        }
        
        // Get assessment score
        const assessmentRow = assessmentData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
        let assessmentStatus = 'Not Started';
        let assessmentScore = null;
        if (assessmentRow) {
          assessmentScore = parseFloat(assessmentRow[7]); // Percentage column
          const passed = assessmentRow[4];
          assessmentStatus = passed ? 'Passed' : 'Completed';
        }
        
        // Get interview status
        const interviewRow = interviewData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
        let interviewStatus = 'Not Started';
        let interviewScore = null;
        if (interviewRow) {
          const totalScore = interviewRow[6];
          const maxScore = interviewRow[7];
          interviewScore = parseFloat(((totalScore / maxScore) * 100).toFixed(2));
          interviewStatus = 'Completed';
        }
        
        candidates.push({
          employeeId: row[0],
          employeeName: row[1],
          managerId: lookupInfo.managerId,
          managerName: lookupInfo.managerName,
          panelistId: row[4],
          panelistName: row[5],
          storeId: storeId,
          storeName: lookupInfo.storeName,
          region: region,
          assessmentUnlockDateTime: row[8] || '',
          readinessStatus: readinessStatus,
          readinessScore: readinessScore,
          assessmentStatus: assessmentStatus,
          assessmentScore: assessmentScore,
          interviewStatus: interviewStatus,
          interviewScore: interviewScore
        });
      }
    }

    return createResponse(true, 'Panelist candidates retrieved successfully', { candidates });

  } catch (error) {
    return createResponse(false, 'Error retrieving panelist candidates: ' + error.toString());
  }
}

/**
 * Get assessment questions
 */
function getAssessmentQuestions() {
  try {
    const questions = ASSESSMENT_QUESTIONS.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));
    
    return createResponse(true, 'Assessment questions retrieved successfully', { 
      questions: questions,
      totalQuestions: questions.length,
      passingPercentage: 80
    });
    
  } catch (error) {
    return createResponse(false, 'Error retrieving assessment questions: ' + error.toString());
  }
}

/**
 * Get comprehensive dashboard data
 */
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!candidatesSheet) {
      return createResponse(false, 'Candidates sheet not found');
    }
    
    const candidatesData = candidatesSheet.getDataRange().getValues();
    const totalCandidates = candidatesData.length - 1;
    
    const readinessSheet = ss.getSheetByName(SHEETS.READINESS);
    const readinessData = readinessSheet ? readinessSheet.getDataRange().getValues().slice(1) : [];
    
    const assessmentSheet = ss.getSheetByName(SHEETS.ASSESSMENT);
    const assessmentData = assessmentSheet ? assessmentSheet.getDataRange().getValues().slice(1) : [];
    
    const interviewSheet = ss.getSheetByName(SHEETS.INTERVIEW);
    const interviewData = interviewSheet ? interviewSheet.getDataRange().getValues().slice(1) : [];
    
    let readinessPassed = 0;
    let readinessFailed = 0;
    let readinessNotStarted = totalCandidates;
    
    let assessmentCompleted = 0;
    let assessmentNotStarted = totalCandidates;
    
    let interviewCompleted = 0;
    let interviewNotStarted = totalCandidates;
    
    const regionStats = new Map();
    const storeWiseData = new Map();
    const amWiseData = new Map();
    const detailedCandidates = [];
    
    for (let i = 1; i < candidatesData.length; i++) {
      const row = candidatesData[i];
      const employeeId = row[0];
      const employeeName = row[1];
      const reportingManagerId = row[2];
      const storeId = row[6] || 'Unknown';
      let region = row[7] || 'Unknown';
      
      const lookupInfo = getStoreAndManagerInfo(storeId, reportingManagerId);
      const storeName = lookupInfo.storeName;
      const managerId = lookupInfo.managerId;
      const managerName = lookupInfo.managerName;
      if (region === 'Unknown' || !region) {
        region = lookupInfo.region;
      }
      
      const readinessRow = readinessData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
      let readinessStatus = 'Not Started';
      let readinessScore = null;
      if (readinessRow) {
        const totalScore = readinessRow[6]; // Column 6 is Total Score
        const maxScore = readinessRow[7]; // Column 7 is Max Score
        const passed = readinessRow[8]; // Column 8 is Passed boolean
        readinessScore = parseFloat(((totalScore / maxScore) * 100).toFixed(2));
        readinessStatus = passed ? 'Passed' : 'Failed';
      }
      
      const assessmentRow = assessmentData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
      let assessmentStatus = 'Not Started';
      let assessmentScore = null;
      if (assessmentRow) {
        assessmentScore = parseFloat(assessmentRow[7]); // Column 7 is Percentage
        const passed = assessmentRow[4]; // Column 4 is Passed boolean
        assessmentStatus = passed ? 'Passed' : 'Completed';
      }
      
      const interviewRow = interviewData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
      let interviewStatus = 'Not Started';
      let interviewScore = null;
      if (interviewRow) {
        const totalScore = interviewRow[6]; // Column 6 is Total Score
        const maxScore = interviewRow[7]; // Column 7 is Max Score
        interviewScore = parseFloat(((totalScore / maxScore) * 100).toFixed(2));
        interviewStatus = 'Completed';
      }
      
      const candidateDetail = {
        employeeId,
        employeeName,
        managerId,
        managerName,
        storeId,
        storeName,
        region,
        readinessStatus,
        readinessScore,
        assessmentStatus,
        assessmentScore,
        interviewStatus,
        interviewScore
      };
      
      detailedCandidates.push(candidateDetail);
      
      if (!storeWiseData.has(storeId)) {
        storeWiseData.set(storeId, {
          storeId,
          storeName,
          region,
          candidates: [],
          totalCandidates: 0,
          readinessPassed: 0,
          assessmentCompleted: 0,
          interviewCompleted: 0
        });
      }
      const storeData = storeWiseData.get(storeId);
      storeData.candidates.push(candidateDetail);
      storeData.totalCandidates++;
      if (readinessStatus === 'Passed') storeData.readinessPassed++;
      if (assessmentStatus === 'Passed' || assessmentStatus === 'Completed') storeData.assessmentCompleted++;
      if (interviewStatus === 'Completed') storeData.interviewCompleted++;
      
      if (!amWiseData.has(managerId)) {
        amWiseData.set(managerId, {
          managerId,
          managerName,
          region,
          candidates: [],
          totalCandidates: 0,
          readinessPassed: 0,
          assessmentCompleted: 0,
          interviewCompleted: 0
        });
      }
      const amData = amWiseData.get(managerId);
      amData.candidates.push(candidateDetail);
      amData.totalCandidates++;
      if (readinessStatus === 'Passed') amData.readinessPassed++;
      if (assessmentStatus === 'Passed' || assessmentStatus === 'Completed') amData.assessmentCompleted++;
      if (interviewStatus === 'Completed') amData.interviewCompleted++;
      
      if (!regionStats.has(region)) {
        regionStats.set(region, {
          region: region,
          totalCandidates: 0,
          readinessPassed: 0,
          readinessFailed: 0,
          readinessNotStarted: 0,
          assessmentCompleted: 0,
          assessmentNotStarted: 0,
          interviewCompleted: 0,
          interviewNotStarted: 0
        });
      }
      
      const stats = regionStats.get(region);
      stats.totalCandidates++;
      
      if (readinessRow) {
        const passed = readinessRow[8];
        if (passed) {
          readinessPassed++;
          stats.readinessPassed++;
        } else {
          readinessFailed++;
          stats.readinessFailed++;
        }
        readinessNotStarted--;
        stats.readinessNotStarted = stats.totalCandidates - stats.readinessPassed - stats.readinessFailed;
      } else {
        stats.readinessNotStarted++;
      }
      
      if (assessmentRow) {
        assessmentCompleted++;
        assessmentNotStarted--;
        stats.assessmentCompleted++;
      }
      stats.assessmentNotStarted = stats.totalCandidates - stats.assessmentCompleted;
      
      if (interviewRow) {
        interviewCompleted++;
        interviewNotStarted--;
        stats.interviewCompleted++;
      }
      stats.interviewNotStarted = stats.totalCandidates - stats.interviewCompleted;
    }
    
    return createResponse(true, 'Dashboard data retrieved successfully', {
      summary: {
        totalCandidates: totalCandidates,
        readiness: {
          passed: readinessPassed,
          failed: readinessFailed,
          notStarted: readinessNotStarted
        },
        assessment: {
          completed: assessmentCompleted,
          notStarted: assessmentNotStarted
        },
        interview: {
          completed: interviewCompleted,
          notStarted: interviewNotStarted
        }
      },
      regionBreakdown: Array.from(regionStats.values()),
      storeWiseData: Array.from(storeWiseData.values()),
      amWiseData: Array.from(amWiseData.values()),
      detailedCandidates: detailedCandidates
    });
    
  } catch (error) {
    return createResponse(false, 'Error retrieving dashboard data: ' + error.toString());
  }
}

/**
 * Create JSON response
 */
function createResponse(success, message, data) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };

  if (data) {
    Object.assign(response, data);
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Initialize sheets with sample data (run once)
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let candidateSheet = ss.getSheetByName(SHEETS.CANDIDATES);
  if (!candidateSheet) {
    candidateSheet = ss.insertSheet(SHEETS.CANDIDATES);
    
    const headers = [
      'Employee ID',
      'Employee Name',
      'Manager ID',
      'Manager Name',
      'Panelist ID',
      'Panelist Name',
      'Store ID',
      'Region',
      'Assessment Unlock Date/Time'
    ];
    
    candidateSheet.appendRow(headers);
    
    // Add sample data
    const sampleData = [
      ['H1001', 'Rahul SM', 'H301', 'Regional Manager A', 'H201', 'Senior Panel A', 'S101', 'North', ''],
      ['H1002', 'Priya SM', 'H302', 'Regional Manager B', 'H201', 'Senior Panel A', 'S102', 'South', ''],
      ['H1003', 'Amit SM', 'H301', 'Regional Manager A', 'H202', 'Senior Panel B', 'S103', 'East', '']
    ];
    
    sampleData.forEach(row => candidateSheet.appendRow(row));
    
    const headerRange = candidateSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4A5568');
    headerRange.setFontColor('#FFFFFF');
    
    for (let i = 1; i <= headers.length; i++) {
      candidateSheet.autoResizeColumn(i);
    }
  }
  
  Logger.log('SM to ASM Sheets initialized successfully!');
}
