/**
 * BENCH PLANNING GOOGLE APPS SCRIPT
 * 
 * This script manages three separate sheets for the Bench Planning module:
 * 1. Bench_Candidates - Master list of candidates with manager and panelist info
 * 2. Readiness_Checklists - Manager assessments (11 items, scored 1-5)
 * 3. Self_Assessments - Candidate self-assessments (one attempt only)
 * 4. Interviews - Panelist evaluations (8 sections, scored 1-5)
 * 
 * Workflow:
 * - Manager completes readiness checklist
 * - If passed (80%+) and scheduled time reached, candidate unlocks self-assessment
 * - If passed assessment (80%+), panelist unlocks interview
 */

// Sheet names
const SHEETS = {
  CANDIDATES: 'Bench_Candidates',
  READINESS: 'Readiness_Checklists',
  ASSESSMENT: 'Self_Assessments',
  INTERVIEW: 'Interviews',
  STORE_MAPPING: 'Store_Mapping'  // New sheet for store/AM lookup
};

// Readiness checklist items (11 items)
const READINESS_ITEMS = [
  'Has completed all product and process knowledge modules on LMS',
  'Demonstrates strong understanding of SOPs and stays updated with any changes',
  'Has completed Food Safety module and consistently applies standards',
  'Maintains punctuality and regular attendance',
  'Consistently maintains high personal grooming and hygiene standards',
  'Proactively leads pre-shift huddles and supports in store training',
  'Takes initiative to support store operations beyond assigned tasks',
  'Shows positive influence and motivates team members during service',
  'Has experience in coaching or mentoring new team members',
  'Can independently manage short shifts with minimal supervision',
  'Handles guest concerns or complaints calmly and confidently'
];

// Interview sections (8 sections)
const INTERVIEW_SECTIONS = [
  'Product & Process Knowledge',
  'Food Safety Understanding',
  'Leadership & Initiative',
  'Guest Service Excellence',
  'Communication Skills',
  'Problem Solving',
  'Team Management',
  'Adaptability'
];

// Self Assessment MCQ Questions (15 questions)
const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: "A café uses 7 L of milk per day. If a 12% increase in customers is expected next week, how much milk should be ordered for a 7-day week?",
    options: {
      A: "55L",
      B: "54.9L",
      C: "56L",
      D: "57.5L"
    },
    correctAnswer: "B"
  },
  {
    id: 2,
    question: "Total sales: ₹9,200. Cash counted: ₹9,000. What is the discrepancy and possible reason?",
    options: {
      A: "₹200 short; unbilled order or theft",
      B: "₹200 short; wrong discount applied",
      C: "₹200 excess; card payment logged as cash",
      D: "₹150 short; incorrect product pricing"
    },
    correctAnswer: "A"
  },
  {
    id: 3,
    question: "If 3% of the monthly coffee stock is wasted and the stock is worth ₹18,000, calculate the wastage cost.",
    options: {
      A: "₹450",
      B: "₹600",
      C: "₹540",
      D: "₹720"
    },
    correctAnswer: "C"
  },
  {
    id: 4,
    question: "The café sold 200 cups of coffee. Each cup costs ₹140, with a 25% profit margin. What was the profit?",
    options: {
      A: "₹7,000",
      B: "₹6,800",
      C: "₹6,500",
      D: "₹7,200"
    },
    correctAnswer: "A"
  },
  {
    id: 5,
    question: "With 5 team members and 3 peak hours, how would you deploy resources to avoid bottlenecks?",
    options: {
      A: "All 5 to one peak hour",
      B: "2 to first, 2 to second, 1 to third peak",
      C: "2 in first peak, 1 each in remaining two",
      D: "Use only 1 per peak hour"
    },
    correctAnswer: "B"
  },
  {
    id: 6,
    question: "A (POS), B (Espresso), C (Cold bar/clean-downs). Rush in 15 mins. Who takes a break now?",
    options: {
      A: "A",
      B: "B",
      C: "C",
      D: "None of the above"
    },
    correctAnswer: "C"
  },
  {
    id: 7,
    question: "Find the next number in the series: 7, 14, 28, 56, ___",
    options: {
      A: "70",
      B: "84",
      C: "98",
      D: "112"
    },
    correctAnswer: "D"
  },
  {
    id: 8,
    question: "Customer waiting, order delayed, team busy. What should be your first response?",
    options: {
      A: "\"Please wait; we're busy.\"",
      B: "\"It'll be out soon.\"",
      C: "\"I'm sorry... let me check the status.\"",
      D: "\"Someone else handle this.\""
    },
    correctAnswer: "C"
  },
  {
    id: 9,
    question: "A guest says their Americano tastes too bitter. What's the best course of action?",
    options: {
      A: "Say it's standard",
      B: "Offer refund immediately",
      C: "Apologize, remake, and check dial-in",
      D: "Blame grinder settings"
    },
    correctAnswer: "C"
  },
  {
    id: 10,
    question: "Oat milk stocks are low and may not last till the next delivery. What do you do?",
    options: {
      A: "Hope it lasts",
      B: "Use less milk to stretch stock",
      C: "Inform manager, 86/limit SKU, suggest alternatives",
      D: "Mix with dairy"
    },
    correctAnswer: "C"
  },
  {
    id: 11,
    question: "Team member X at POS for 4 hours without a break, and café is busy. Best action?",
    options: {
      A: "\"Hold till rush ends.\"",
      B: "Arrange cover, give X a break, then rotate.",
      C: "Tell X to slip out when they can",
      D: "\"That's rush life\""
    },
    correctAnswer: "B"
  },
  {
    id: 12,
    question: "You spot a team member skipping an SOP step. How do you address it?",
    options: {
      A: "Call out loudly in front of guests",
      B: "Ignore it this time",
      C: "File written warning",
      D: "Give 1:1 feedback and demonstrate"
    },
    correctAnswer: "D"
  },
  {
    id: 13,
    question: "What's the right priority order during operations?",
    options: {
      A: "Cost → Team → Customer",
      B: "Team → Cost → Customer",
      C: "Customer → Team → Cost",
      D: "Customer → Cost → Team"
    },
    correctAnswer: "C"
  },
  {
    id: 14,
    question: "A long pickup queue is forming; service is slowing. Most effective move?",
    options: {
      A: "Add floater to pickup/expedite",
      B: "Wait for queue to shrink",
      C: "Ask guests to be patient",
      D: "Stop dine-in orders"
    },
    correctAnswer: "A"
  },
  {
    id: 15,
    question: "Which statement reflects true leadership in a café?",
    options: {
      A: "\"I take the toughest tasks.\"",
      B: "\"I stick to my scope.\"",
      C: "\"I support the team, step in, and debrief.\"",
      D: "\"I handle escalations only.\""
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
        // Parse JSON strings in the data
        if (data.scores) data.scores = JSON.parse(data.scores);
        if (data.answers) data.answers = JSON.parse(data.answers);
      }
    } else {
      data = e.parameter;
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
        assessmentStatus = {
          unlocked: true,
          attempted: true,
          passed: assessmentRow[4] || false, // Assuming 'passed' is in column 5
          score: assessmentRow[5] || 0
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
      
      sheet.appendRow(headers);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4A5568');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if employee already has ANY submission (don't allow resubmission)
    const existingData = sheet.getDataRange().getValues();
    const existingRow = existingData.slice(1).findIndex(row => 
      row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase()
    );
    
    if (existingRow !== -1) {
      // Submission already exists - don't allow resubmission
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
      
      sheet.appendRow(headers);
      
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

    // Calculate score by comparing answers with correct answers
    let correctCount = 0;
    const answers = JSON.parse(data.answers || '{}');
    
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
    const passed = percentage >= 80; // 80% passing threshold

    const newRow = [
      data.submissionTime || new Date().toISOString(),
      data.employeeId,
      data.employeeName,
      JSON.stringify(answers),
      passed,
      totalScore,
      maxScore,
      percentage,
      1 // First attempt
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
      
      sheet.appendRow(headers);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4A5568');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if interview already exists for this employee
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
      // Update existing interview
      const rowIndex = existingRow + 2;
      sheet.getRange(rowIndex, 1, 1, baseRow.length).setValues([baseRow]);
      
      return createResponse(true, 'Interview updated successfully', {
        totalScore: data.totalScore,
        maxScore: data.maxScore
      });
    } else {
      // New interview
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
 * Get all candidates (for admin dashboard if needed)
 */
function getAllCandidates() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!sheet) {
      return createResponse(false, 'Candidates sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const candidates = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // If employee ID exists
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

    // Filter candidates by manager ID (column index 2)
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
 * Get assessment questions for candidates
 */
function getAssessmentQuestions() {
  try {
    // Return assessment questions without correct answers for security
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
    
    // Get all candidates with their region directly from Bench_Candidates sheet
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!candidatesSheet) {
      return createResponse(false, 'Candidates sheet not found');
    }
    
    const candidatesData = candidatesSheet.getDataRange().getValues();
    const totalCandidates = candidatesData.length - 1; // Exclude header
    
    // Get readiness checklist submissions
    const readinessSheet = ss.getSheetByName(SHEETS.READINESS);
    const readinessData = readinessSheet ? readinessSheet.getDataRange().getValues().slice(1) : [];
    
    // Get self assessment submissions
    const assessmentSheet = ss.getSheetByName(SHEETS.ASSESSMENT);
    const assessmentData = assessmentSheet ? assessmentSheet.getDataRange().getValues().slice(1) : [];
    
    // Get interview submissions
    const interviewSheet = ss.getSheetByName(SHEETS.INTERVIEW);
    const interviewData = interviewSheet ? interviewSheet.getDataRange().getValues().slice(1) : [];
    
    // Count statuses
    let readinessPassed = 0;
    let readinessFailed = 0;
    let readinessNotStarted = totalCandidates;
    
    let assessmentCompleted = 0;
    let assessmentNotStarted = totalCandidates;
    
    let interviewCompleted = 0;
    let interviewNotStarted = totalCandidates;
    
    // Region-wise breakdown
    const regionStats = new Map();
    
    // Store-wise and AM-wise details
    const storeWiseData = new Map();
    const amWiseData = new Map();
    const detailedCandidates = [];
    
    // Process candidates with region from sheet (column 7)
    for (let i = 1; i < candidatesData.length; i++) {
      const row = candidatesData[i];
      const employeeId = row[0];
      const employeeName = row[1];
      const reportingManagerId = row[2];
      const storeId = row[6] || 'Unknown';
      let region = row[7] || 'Unknown'; // Region is in column 8 (index 7)
      
      // Lookup store name and Area Manager info from mapping (prioritizes AM over reporting manager)
      const lookupInfo = getStoreAndManagerInfo(storeId, reportingManagerId);
      const storeName = lookupInfo.storeName;
      const managerId = lookupInfo.managerId;     // Use Area Manager ID from Store_Mapping
      const managerName = lookupInfo.managerName; // Use Area Manager Name from Store_Mapping
      if (region === 'Unknown' || !region) {
        region = lookupInfo.region;
      }
      
      // Check readiness status
      const readinessRow = readinessData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
      let readinessStatus = 'Not Started';
      let readinessScore = null;
      if (readinessRow) {
        const passed = readinessRow[8];
        readinessScore = readinessRow[7];
        readinessStatus = passed ? 'Passed' : 'Failed';
      }
      
      // Check assessment status
      const assessmentRow = assessmentData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
      let assessmentStatus = 'Not Started';
      let assessmentScore = null;
      if (assessmentRow) {
        assessmentScore = assessmentRow[4];
        const passed = assessmentRow[5];
        assessmentStatus = passed ? 'Passed' : 'Completed';
      }
      
      // Check interview status
      const interviewRow = interviewData.find(r => r[1] && r[1].toString().toUpperCase() === employeeId.toString().toUpperCase());
      let interviewStatus = 'Not Started';
      let interviewScore = null;
      if (interviewRow) {
        interviewScore = interviewRow[4];
        interviewStatus = 'Completed';
      }
      
      // Create detailed candidate object
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
      
      // Store-wise grouping
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
      
      // AM-wise grouping
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
      
      // Initialize region stats
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
      
      // Update region stats
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
 * Create JSON response (CORS handled by deployment settings)
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
  
  // Create Candidates sheet if it doesn't exist
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
    
    // Add sample data from the provided image
    const sampleData = [
      ['H3282', 'Madan V', 'H546', 'Ajay Hathmuria', 'H2155', 'Jagruti', '', '', ''],
      ['H3235', 'Ravitheja M', 'H1355', 'Suresh A', 'H2155', 'Jagruti', '', '', ''],
      ['H626', 'Naveen Kumar C', 'H546', 'Ajay Hathmuria', 'H2155', 'Jagruti', '', '', ''],
      ['H751', 'Lavanya B', 'H3270', 'Gorijala Umakanth', 'H2155', 'Jagruti', '', '', ''],
      ['H3335', 'Manikanta', 'H3735', 'Sanika Sandeep Jagtap', 'H2155', 'Jagruti', '', '', ''],
      ['H2797', 'Kareti Hemanad', 'H2312', 'Manish B', 'H2155', 'Jagruti', '', '', ''],
      ['H3381', 'Sri Venkatesh L', 'H3362', 'Karthick G', 'H2155', 'Jagruti', '', '', ''],
      ['H1437', 'Sonu Bahadur R', 'H833', 'Nandish M', 'H2155', 'Jagruti', '', '', ''],
      ['H2109', 'Beldari Syed Pee', 'H833', 'Nandish M', 'H2155', 'Jagruti', '', '', '']
    ];
    
    sampleData.forEach(row => candidateSheet.appendRow(row));
    
    // Format header
    const headerRange = candidateSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4A5568');
    headerRange.setFontColor('#FFFFFF');
    
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      candidateSheet.autoResizeColumn(i);
    }
  }
  
  Logger.log('Sheets initialized successfully!');
}
