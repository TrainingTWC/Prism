/**
 * BUDDY TRAINER BENCH PLANNING GOOGLE APPS SCRIPT
 * 
 * This script manages four separate sheets for the Buddy Trainer Bench Planning module:
 * 1. BT_Candidates - Master list of candidates with reporting manager info
 * 2. BT_Readiness - Readiness assessments (23 items across 3 categories, scored 0-2)
 * 3. BT_Session - QR code attendance marking for BT sessions
 * 4. BT_Skill_Check - Trainer evaluation of training process (13 Yes/No questions)
 * 
 * Workflow:
 * - Reporting Manager completes readiness checklist (must score 45+/46 to pass)
 * - If passed, candidate attends BT Session and scans QR code
 * - Trainer completes Skill Check evaluation (Yes/No for each training step)
 */

// Sheet names
const SHEETS = {
  CANDIDATES: 'BT_Candidates',
  READINESS: 'BT_Readiness',
  SESSION: 'BT_Session',
  SESSION_ASSESSMENT: 'BT_Session_Assessment',
  SKILL_CHECK: 'BT_Skill_Check',
  STORE_MAPPING: 'Store_Mapping'
};

// Readiness categories and items (23 items total)
const READINESS_CATEGORIES = {
  'People Skills': [
    'Recognized as a peer leader by colleagues',
    'Respects and values all people equally',
    'Demonstrates friendliness and professionalism',
    'Communicates clearly and effectively',
    'Recognizes and appreciates the work of others',
    'Trains/Coaches fellow partners on correct procedures',
    'Shares knowledge and experience with new Partners',
    'Willing to answer queries without being asked',
    'Learns from mistakes and applies feedback'
  ],
  'Customer Service Skills': [
    'Delivers 100% customer-centric service (Follow C.O.F.F.E.E) with a "Can-Do Attitude"',
    'Maintains proper uniform and follows grooming standards',
    'Handles customer concerns using L.E.A.S.T.',
    'Confidently answers customer queries',
    'Ensures consistent product quality (Never serves a poor-quality product to customers)',
    'Understands and follows Customer Service & TWC processes',
    'Proactively resolves customer complaints',
    'Goes the extra mile to satisfy customers'
  ],
  'Work Ethic & Business Contribution': [
    'Displays a positive attitude at work',
    'Punctual and supports team when short-staffed',
    'Suggests improvements for store operations',
    'Shows interest in business results',
    'Follows the "Clean as You Go" principle',
    'Adheres to restaurant safety procedures'
  ]
};

// Skill check phases and questions (13 items total)
const SKILL_CHECK_PHASES = {
  'Prepare': [
    { step: 'Trainer is knowledgeable', standard: 'Trainer has in-depth knowledge of the task and procedures before training.' },
    { step: 'Trainer gathers the required tools & information', standard: 'Trainer prepares necessary materials and references before starting the session.' },
    { step: 'Trainer informs the Trainee what he/she is going to learn', standard: 'Clearly explains the objective of the training.' },
    { step: 'Puts Learner at ease', standard: 'Uses a friendly tone, smiles, and reassures that mistakes are part of learning.' },
    { step: 'Breaks the learning into smaller steps', standard: 'Training is structured into manageable, step-by-step instructions.' }
  ],
  'Present': [
    { step: 'Shows training tools to the trainee', standard: 'Introduces learning materials and tools to encourage self-learning.' },
    { step: 'Shows & tells the skill', standard: 'Demonstrates the skill while explaining each step clearly.' },
    { step: 'Explains why the skill is important', standard: 'Provides reasons behind each step, emphasizing its significance.' }
  ],
  'Practice': [
    { step: 'Asks the trainee to demonstrate the skill', standard: 'Trainee performs the skill under trainer\'s supervision.' },
    { step: 'Encourages trainee to perform confidently', standard: 'Provides encouragement to the trainee during practice.' },
    { step: 'Corrects any mistakes trainer makes', standard: 'Identifies errors and provides constructive feedback.' }
  ],
  'Follow-Up': [
    { step: 'Asks questions to ensure understanding', standard: 'Uses open-ended questions to check comprehension.' },
    { step: 'Repeats Present & Practice if required', standard: 'Re-demonstrates and allows additional practice if needed.' }
  ]
};

// Session Assessment Questions (15 MCQs)
const SESSION_ASSESSMENT_QUESTIONS = [
  {
    id: 'Q1',
    question: 'As a Buddy Trainer, your primary responsibility is to:',
    options: [
      'Complete tasks faster than the trainee',
      'Act as an extension of Field Trainers and support learning',
      'Ensure store targets are met',
      'Manage shifts'
    ],
    correctAnswer: 1 // Index: b) Act as an extension of Field Trainers and support learning
  },
  {
    id: 'Q2',
    question: 'What is the most important outcome of good buddy training?',
    options: [
      'Faster certification',
      'Reduced effort for the trainer',
      'Consistent Third Wave Coffee experience for customers',
      'Fewer questions from trainees'
    ],
    correctAnswer: 2 // c) Consistent Third Wave Coffee experience for customers
  },
  {
    id: 'Q3',
    question: 'Creating a good learning environment means:',
    options: [
      'Finishing training quickly',
      'Letting the trainee observe silently',
      'Making the trainee comfortable asking questions and making mistakes',
      'Training only during peak hours'
    ],
    correctAnswer: 2 // c) Making the trainee comfortable asking questions and making mistakes
  },
  {
    id: 'Q4',
    question: 'Why should a Buddy Trainer assess prior knowledge before teaching a skill?',
    options: [
      'To skip steps if possible',
      'To judge the trainee',
      'To adapt training based on the trainee\'s experience',
      'To reduce practice time'
    ],
    correctAnswer: 2 // c) To adapt training based on the trainee's experience
  },
  {
    id: 'Q5',
    question: 'If a trainee has NO experience with a skill, the Buddy Trainer should:',
    options: [
      'Demonstrate once and move on',
      'Let the trainee practice immediately',
      'Explain definitions, concepts, and demonstrate step by step',
      'Ask the trainee to observe another barista'
    ],
    correctAnswer: 2 // c) Explain definitions, concepts, and demonstrate step by step
  },
  {
    id: 'Q6',
    question: 'Which learning method helps trainees remember the most?',
    options: [
      'Reading',
      'Hearing',
      'Seeing',
      'Seeing, hearing, and doing'
    ],
    correctAnswer: 3 // d) Seeing, hearing, and doing
  },
  {
    id: 'Q7',
    question: 'Feedback should always be given with the intention to:',
    options: [
      'Correct mistakes immediately',
      'Show authority',
      'Help the trainee improve',
      'Finish training faster'
    ],
    correctAnswer: 2 // c) Help the trainee improve
  },
  {
    id: 'Q8',
    question: 'Treating feedback as a "gift" means the Buddy Trainer should:',
    options: [
      'Avoid difficult conversations',
      'Focus only on positives',
      'Help the trainee learn and grow from it',
      'Delay feedback'
    ],
    correctAnswer: 2 // c) Help the trainee learn and grow from it
  },
  {
    id: 'Q9',
    question: 'Reinforcing feedback is used when:',
    options: [
      'The trainee makes a mistake',
      'The trainee performs a task correctly',
      'The trainee resists feedback',
      'The trainee lacks confidence'
    ],
    correctAnswer: 1 // b) The trainee performs a task correctly
  },
  {
    id: 'Q10',
    question: 'Redirecting feedback should focus on:',
    options: [
      'The trainee\'s attitude',
      'What went wrong, what should be done, and why it matters',
      'The trainee\'s experience level',
      'Comparing the trainee to others'
    ],
    correctAnswer: 1 // b) What went wrong, what should be done, and why it matters
  },
  {
    id: 'Q11',
    question: 'Which approach is used for redirecting feedback?',
    options: [
      'Why–Why–What',
      'What–Why',
      'What–What–Why',
      'How–What–Why'
    ],
    correctAnswer: 2 // c) What–What–Why
  },
  {
    id: 'Q12',
    question: 'What is the correct sequence of the 4-Step Training Process?',
    options: [
      'Prepare → Practice → Present → Follow-up',
      'Present → Practice → Prepare → Follow-up',
      'Prepare → Present (Show & Tell) → Practice → Follow-up',
      'Practice → Prepare → Present → Follow-up'
    ],
    correctAnswer: 2 // c) Prepare → Present (Show & Tell) → Practice → Follow-up
  },
  {
    id: 'Q13',
    question: 'During which step does the Buddy Trainer reduce guidance gradually?',
    options: [
      'Prepare',
      'Present',
      'Practice',
      'Follow-up'
    ],
    correctAnswer: 2 // c) Practice
  },
  {
    id: 'Q14',
    question: 'A new barista must be certified within how many days?',
    options: [
      '7 days',
      '10 days',
      '15 days',
      '30 days'
    ],
    correctAnswer: 2 // c) 15 days
  },
  {
    id: 'Q15',
    question: 'In the first discussion with a new trainee, what should a Buddy Trainer do?',
    options: [
      'Ask about salary and past jobs',
      'Share the training plan, introduce the team, and put the trainee at ease',
      'Focus only on store rules',
      'Start skill training immediately'
    ],
    correctAnswer: 1 // b) Share the training plan, introduce the team, and put the trainee at ease
  }
];

const SESSION_ASSESSMENT_PASSING_SCORE = 12; // 80% of 15 questions

const PASSING_SCORE = 45;
const MAX_READINESS_SCORE = 46; // 23 items × 2 points max

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
    let trainer1 = '';
    let trainer1Name = '';
    let trainer2 = '';
    let trainer2Name = '';
    let trainer3 = '';
    let trainer3Name = '';
    
    if (mappingSheet) {
      const data = mappingSheet.getDataRange().getValues();
      
      // Store_Mapping columns: Store ID, Store Name, AM ID, AM Name, Region,
      //   HRBP 1 ID, HRBP 1 Name, HRBP 2 ID, HRBP 2 Name, HRBP 3 ID, HRBP 3 Name,
      //   Trainer 1 ID, Trainer 1 Name, Trainer 2 ID, Trainer 2 Name, Trainer 3 ID, Trainer 3 Name...
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[0].toString() === storeId) {
          storeName = row[1] || storeId;
          managerId = row[2] || reportingManagerId;
          managerName = row[3] || reportingManagerId;
          region = row[4] || 'Unknown';
          trainer1 = row[11] || ''; // Trainer 1 ID
          trainer1Name = row[12] || ''; // Trainer 1 Name
          trainer2 = row[13] || ''; // Trainer 2 ID
          trainer2Name = row[14] || ''; // Trainer 2 Name
          trainer3 = row[15] || ''; // Trainer 3 ID
          trainer3Name = row[16] || ''; // Trainer 3 Name
          break;
        }
      }
    }
    
    return { 
      storeName, 
      managerId, 
      managerName, 
      region,
      trainer1,
      trainer1Name,
      trainer2,
      trainer2Name,
      trainer3,
      trainer3Name
    };
  } catch (error) {
    console.error('Error looking up store/manager info:', error);
    return { 
      storeName: storeId, 
      managerId: reportingManagerId, 
      managerName: reportingManagerId, 
      region: 'Unknown',
      trainer1: '',
      trainer1Name: '',
      trainer2: '',
      trainer2Name: '',
      trainer3: '',
      trainer3Name: ''
    };
  }
}

/**
 * Create standardized JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
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
        // Special case: if managerId is 'ALL', return all candidates (for trainer role check)
        if (e.parameter.managerId === 'ALL') {
          return getAllCandidates();
        }
        return getManagerCandidates(e.parameter.managerId);
      
      case 'getTrainerCandidates':
        return getTrainerCandidates(e.parameter.trainerId);
      
      case 'getAreaManagerCandidates':
        return getAreaManagerCandidates(e.parameter.areaManagerId);
      
      case 'getDashboardData':
        return getDashboardData();
      
      case 'debugStoreMapping':
        return debugStoreMapping(e.parameter.trainerId);
      
      case 'getSessionAssessmentStatus':
        return getSessionAssessmentStatus(e.parameter.employeeId);
      
      case 'getSessionAssessmentQuestions':
        return getSessionAssessmentQuestions();
      
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
        data = JSON.parse(e.postData.contents);
      } catch {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }
    
    // Parse JSON strings in the data
    if (data.responses && typeof data.responses === 'string') {
      try {
        data.responses = JSON.parse(data.responses);
      } catch (e) {}
    }
    if (data.comments && typeof data.comments === 'string') {
      try {
        data.comments = JSON.parse(data.comments);
      } catch (e) {}
    }
    
    const action = data.action;

    if (!action) {
      return createResponse(false, 'No action specified');
    }

    switch (action) {
      case 'submitReadiness':
        return submitReadinessChecklist(data);
      
      case 'submitSession':
        return submitBTSession(data);
      
      case 'submitSkillCheck':
        return submitSkillCheck(data);
      
      case 'unlockSessionAssessment':
        return unlockSessionAssessment(data);
      
      case 'submitSessionAssessment':
        return submitSessionAssessment(data);
      
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Get candidate data with all statuses
 */
function getCandidateData(employeeId) {
  try {
    if (!employeeId) {
      return createResponse(false, 'Employee ID is required');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!candidatesSheet) {
      return createResponse(false, 'Candidates sheet not found');
    }

    // Find candidate
    const data = candidatesSheet.getDataRange().getValues();
    const candidateRow = data.slice(1).find(row => 
      row[0] && row[0].toString().toUpperCase() === employeeId.toUpperCase()
    );

    if (!candidateRow) {
      return createResponse(false, 'Candidate not found');
    }

    const candidate = {
      employeeId: candidateRow[0],
      employeeName: candidateRow[1],
      managerId: candidateRow[2],
      managerName: candidateRow[3],
      panelist: candidateRow[4] || '',
      storeId: candidateRow[5] || '',
      region: candidateRow[6] || ''
    };
    
    // Lookup Area Manager and Trainers from Store_Mapping if storeId exists
    let areaManagerId = '';
    let areaManagerName = '';
    let trainer1 = '';
    let trainer1Name = '';
    let trainer2 = '';
    let trainer2Name = '';
    let trainer3 = '';
    let trainer3Name = '';
    
    if (candidate.storeId) {
      const storeInfo = getStoreAndManagerInfo(candidate.storeId, '');
      areaManagerId = storeInfo.managerId;
      areaManagerName = storeInfo.managerName;
      trainer1 = storeInfo.trainer1;
      trainer1Name = storeInfo.trainer1Name;
      trainer2 = storeInfo.trainer2;
      trainer2Name = storeInfo.trainer2Name;
      trainer3 = storeInfo.trainer3;
      trainer3Name = storeInfo.trainer3Name;
    }
    
    candidate.areaManagerId = areaManagerId;
    candidate.areaManagerName = areaManagerName;
    candidate.trainer1 = trainer1;
    candidate.trainer1Name = trainer1Name;
    candidate.trainer2 = trainer2;
    candidate.trainer2Name = trainer2Name;
    candidate.trainer3 = trainer3;
    candidate.trainer3Name = trainer3Name;

    // Get readiness status
    const readinessSheet = ss.getSheetByName(SHEETS.READINESS);
    let readinessStatus = { 
      completed: false,
      passed: false,
      score: 0,
      maxScore: MAX_READINESS_SCORE
    };
    
    if (readinessSheet) {
      const readinessData = readinessSheet.getDataRange().getValues();
      const readinessRow = readinessData.slice(1).find(row => 
        row[1] && row[1].toString().toUpperCase() === employeeId.toUpperCase()
      );
      
      if (readinessRow) {
        readinessStatus = {
          completed: true,
          passed: readinessRow[8] || false,  // Passed column
          score: readinessRow[6] || 0,       // Total Score
          maxScore: readinessRow[7] || MAX_READINESS_SCORE,  // Max Score
          percentage: readinessRow[9] || 0   // Percentage
        };
      }
    }

    // Get session status
    const sessionSheet = ss.getSheetByName(SHEETS.SESSION);
    let sessionStatus = { 
      unlocked: readinessStatus.passed,
      attended: false
    };
    
    if (sessionSheet) {
      const sessionData = sessionSheet.getDataRange().getValues();
      const sessionRow = sessionData.slice(1).find(row => 
        row[1] && row[1].toString().toUpperCase() === employeeId.toUpperCase()
      );
      
      if (sessionRow) {
        sessionStatus.attended = true;
        sessionStatus.sessionDate = sessionRow[3];
        sessionStatus.trainerId = sessionRow[4];
        sessionStatus.trainerName = sessionRow[5];
      }
    }

    // Get session assessment status
    const sessionAssessmentSheet = ss.getSheetByName(SHEETS.SESSION_ASSESSMENT);
    let sessionAssessmentStatus = { 
      unlocked: false,
      completed: false,
      score: 0,
      totalQuestions: SESSION_ASSESSMENT_QUESTIONS.length,
      passed: false
    };
    
    if (sessionAssessmentSheet) {
      const sessionAssessmentData = sessionAssessmentSheet.getDataRange().getValues();
      const sessionAssessmentRow = sessionAssessmentData.slice(1).find(row => 
        row[1] && row[1].toString().toUpperCase() === employeeId.toUpperCase()
      );
      
      if (sessionAssessmentRow) {
        sessionAssessmentStatus = {
          unlocked: sessionAssessmentRow[6] || false,
          completed: sessionAssessmentRow[7] || false,
          score: sessionAssessmentRow[8] || 0,
          totalQuestions: SESSION_ASSESSMENT_QUESTIONS.length,
          passed: sessionAssessmentRow[9] || false
        };
      }
    }

    // Get skill check status
    const skillCheckSheet = ss.getSheetByName(SHEETS.SKILL_CHECK);
    let skillCheckStatus = { 
      unlocked: sessionStatus.attended && sessionAssessmentStatus.completed && sessionAssessmentStatus.passed,
      completed: false
    };
    
    if (skillCheckSheet) {
      const skillCheckData = skillCheckSheet.getDataRange().getValues();
      const skillCheckRow = skillCheckData.slice(1).find(row => 
        row[1] && row[1].toString().toUpperCase() === employeeId.toUpperCase()
      );
      
      if (skillCheckRow) {
        skillCheckStatus.completed = true;
        skillCheckStatus.yesCount = skillCheckRow[6];
        skillCheckStatus.totalQuestions = skillCheckRow[7];
      }
    }

    return createResponse(true, 'Data retrieved successfully', {
      candidate,
      readinessStatus,
      sessionStatus,
      sessionAssessmentStatus,
      skillCheckStatus
    });

  } catch (error) {
    return createResponse(false, 'Error retrieving candidate data: ' + error.toString());
  }
}

/**
 * Get all candidates
 */
function getAllCandidates() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!candidatesSheet) {
      return createResponse(false, 'Candidates sheet not found');
    }

    const data = candidatesSheet.getDataRange().getValues();
    const candidates = data.slice(1).map(row => ({
      employeeId: row[0],
      employeeName: row[1],
      managerId: row[2],
      managerName: row[3],
      panelist: row[4] || '',
      storeId: row[5] || '',
      region: row[6] || ''
    }));

    return createResponse(true, 'Candidates retrieved successfully', { candidates });

  } catch (error) {
    return createResponse(false, 'Error retrieving candidates: ' + error.toString());
  }
}

/**
 * Get candidates for a specific manager
 */
function getManagerCandidates(managerId) {
  try {
    if (!managerId) {
      return createResponse(false, 'Manager ID is required');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!candidatesSheet) {
      return createResponse(false, 'Candidates sheet not found');
    }

    const data = candidatesSheet.getDataRange().getValues();
    const candidates = data.slice(1)
      .filter(row => row[2] && row[2].toString().toUpperCase() === managerId.toUpperCase())
      .map(row => ({
        employeeId: row[0],
        employeeName: row[1],
        managerId: row[2],
        managerName: row[3],
        panelist: row[4] || '',
        storeId: row[5] || '',
        region: row[6] || ''
      }));

    return createResponse(true, 'Manager candidates retrieved successfully', { candidates });

  } catch (error) {
    return createResponse(false, 'Error retrieving manager candidates: ' + error.toString());
  }
}

/** * Get candidates for a specific Area Manager (from Store_Mapping lookup)
 */
function getAreaManagerCandidates(areaManagerId) {
  try {
    if (!areaManagerId) {
      return createResponse(false, 'Area Manager ID is required');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    const mappingSheet = ss.getSheetByName(SHEETS.STORE_MAPPING);
    
    if (!candidatesSheet || !mappingSheet) {
      return createResponse(false, 'Required sheets not found');
    }

    // Get all candidates
    const candidatesData = candidatesSheet.getDataRange().getValues();
    const mappingData = mappingSheet.getDataRange().getValues();
    
    // Build store ID to Area Manager mapping
    const storeToAM = {};
    for (let i = 1; i < mappingData.length; i++) {
      const storeId = mappingData[i][0];
      const amId = mappingData[i][2]; // Column C = Area Manager ID
      if (storeId && amId) {
        storeToAM[storeId.toString()] = amId.toString().toUpperCase();
      }
    }
    
    // Filter candidates whose store has this Area Manager
    const candidates = candidatesData.slice(1)
      .filter(row => {
        const candidateStoreId = row[5]?.toString();
        if (!candidateStoreId) return false;
        const storeAM = storeToAM[candidateStoreId];
        return storeAM && storeAM === areaManagerId.toUpperCase();
      })
      .map(row => ({
        employeeId: row[0],
        employeeName: row[1],
        managerId: row[2],
        managerName: row[3],
        panelist: row[4] || '',
        storeId: row[5] || '',
        region: row[6] || ''
      }));

    return createResponse(true, 'Area Manager candidates retrieved successfully', { candidates });

  } catch (error) {
    return createResponse(false, 'Error retrieving Area Manager candidates: ' + error.toString());
  }
}

/** * Get candidates assigned to a specific trainer (from Store_Mapping lookup)
 */
function getTrainerCandidates(trainerId) {
  try {
    if (!trainerId) {
      return createResponse(false, 'Trainer ID is required');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    const mappingSheet = ss.getSheetByName(SHEETS.STORE_MAPPING);
    
    if (!candidatesSheet || !mappingSheet) {
      return createResponse(false, 'Required sheets not found');
    }

    const candidatesData = candidatesSheet.getDataRange().getValues();
    const mappingData = mappingSheet.getDataRange().getValues();
    
    // Build store ID to trainer mapping
    const storeToTrainers = {};
    for (let i = 1; i < mappingData.length; i++) {
      const storeId = mappingData[i][0];
      const trainer1 = mappingData[i][11]; // Trainer 1 ID (Column L)
      const trainer2 = mappingData[i][13]; // Trainer 2 ID (Column N)
      const trainer3 = mappingData[i][15]; // Trainer 3 ID (Column P)
      
      if (storeId) {
        storeToTrainers[storeId.toString()] = {
          trainer1: trainer1 ? trainer1.toString().toUpperCase().trim() : '',
          trainer2: trainer2 ? trainer2.toString().toUpperCase().trim() : '',
          trainer3: trainer3 ? trainer3.toString().toUpperCase().trim() : ''
        };
      }
    }
    
    // Filter candidates whose store has this trainer assigned
    const trainerIdUpper = trainerId.toUpperCase().trim();
    const candidates = candidatesData.slice(1)
      .filter(row => {
        const candidateStoreId = row[5]?.toString();
        if (!candidateStoreId) return false;
        
        const trainers = storeToTrainers[candidateStoreId];
        if (!trainers) return false;
        
        return trainers.trainer1 === trainerIdUpper || 
               trainers.trainer2 === trainerIdUpper || 
               trainers.trainer3 === trainerIdUpper;
      })
      .map(row => ({
        employeeId: row[0],
        employeeName: row[1],
        managerId: row[2],
        managerName: row[3],
        panelist: row[4] || '',
        storeId: row[5] || '',
        region: row[6] || ''
      }));

    return createResponse(true, 'Trainer candidates retrieved successfully', { candidates });

  } catch (error) {
    return createResponse(false, 'Error retrieving trainer candidates: ' + error.toString());
  }
}

/**
 * DEBUG: Check Store_Mapping sheet for trainer assignments
 */
function debugStoreMapping(trainerId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mappingSheet = ss.getSheetByName(SHEETS.STORE_MAPPING);
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    
    if (!mappingSheet) {
      return createResponse(false, 'Store_Mapping sheet not found');
    }
    
    const mappingData = mappingSheet.getDataRange().getValues();
    const candidatesData = candidatesSheet ? candidatesSheet.getDataRange().getValues() : [];
    
    // Get header row
    const headers = mappingData[0];
    
    // Show first 3 data rows to inspect column values
    const sampleRows = [];
    for (let i = 1; i <= Math.min(3, mappingData.length - 1); i++) {
      const row = mappingData[i];
      sampleRows.push({
        rowIndex: i,
        storeId: row[0],
        storeName: row[1],
        col2: row[2],
        col3: row[3],
        col4: row[4],
        col5: row[5],
        col6: row[6],
        col7: row[7],
        col8: row[8],
        col9: row[9],
        col10: row[10],
        col11: row[11],
        col12: row[12],
        col13: row[13],
        col14: row[14],
        col15: row[15],
        col16: row[16],
        col17: row[17],
        col18: row[18],
        col19: row[19],
        col20: row[20],
        totalColumns: row.length
      });
    }
    
    // Find all rows with trainers
    const storesWithTrainers = [];
    const allTrainerIds = new Set();
    
    for (let i = 1; i < mappingData.length; i++) {
      const row = mappingData[i];
      const storeId = row[0];
      const storeName = row[1];
      const trainer1 = row[11];
      const trainer1Name = row[12];
      const trainer2 = row[13];
      const trainer2Name = row[14];
      const trainer3 = row[15];
      const trainer3Name = row[16];
      
      if (trainer1 || trainer2 || trainer3) {
        storesWithTrainers.push({
          storeId: storeId,
          storeName: storeName,
          trainer1: trainer1,
          trainer1Name: trainer1Name,
          trainer2: trainer2,
          trainer2Name: trainer2Name,
          trainer3: trainer3,
          trainer3Name: trainer3Name
        });
        
        if (trainer1) allTrainerIds.add(trainer1.toString().toUpperCase().trim());
        if (trainer2) allTrainerIds.add(trainer2.toString().toUpperCase().trim());
        if (trainer3) allTrainerIds.add(trainer3.toString().toUpperCase().trim());
      }
    }
    
    // Check if the provided trainerId exists
    let trainerExists = false;
    let trainerStores = [];
    if (trainerId) {
      const trainerIdUpper = trainerId.toUpperCase().trim();
      trainerExists = allTrainerIds.has(trainerIdUpper);
      
      trainerStores = storesWithTrainers.filter(store => 
        store.trainer1?.toString().toUpperCase().trim() === trainerIdUpper ||
        store.trainer2?.toString().toUpperCase().trim() === trainerIdUpper ||
        store.trainer3?.toString().toUpperCase().trim() === trainerIdUpper
      );
    }
    
    // Get candidates data
    const candidatesWithStores = [];
    const candidatesWithoutStores = [];
    
    for (let i = 1; i < candidatesData.length; i++) {
      const candidate = {
        employeeId: candidatesData[i][0],
        employeeName: candidatesData[i][1],
        storeId: candidatesData[i][5]
      };
      
      if (candidate.storeId) {
        candidatesWithStores.push(candidate);
      } else {
        candidatesWithoutStores.push(candidate);
      }
    }
    
    return createResponse(true, 'Debug information retrieved', {
      headers: headers,
      sampleDataRows: sampleRows,
      totalStoresInMapping: mappingData.length - 1,
      storesWithTrainers: storesWithTrainers.length,
      allUniqueTrainerIds: Array.from(allTrainerIds),
      searchedTrainerId: trainerId,
      trainerExists: trainerExists,
      trainerAssignedToStores: trainerStores,
      totalCandidates: candidatesData.length - 1,
      candidatesWithStores: candidatesWithStores.length,
      candidatesWithoutStores: candidatesWithoutStores.length,
      candidatesWithoutStoresList: candidatesWithoutStores,
      sampleStoresWithTrainers: storesWithTrainers.slice(0, 5),
      currentColumnIndices: {
        storeId: 0,
        storeName: 1,
        trainer1Id: 11,
        trainer1Name: 12,
        trainer2Id: 13,
        trainer2Name: 14,
        trainer3Id: 15,
        trainer3Name: 16
      }
    });
    
  } catch (error) {
    return createResponse(false, 'Error in debug: ' + error.toString());
  }
}

/**
 * Get session assessment status for a candidate
 */
function getSessionAssessmentStatus(employeeId) {
  try {
    if (!employeeId) {
      return createResponse(false, 'Employee ID is required');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.SESSION_ASSESSMENT);
    
    if (!sheet) {
      return createResponse(true, 'Assessment status retrieved', {
        unlocked: false,
        completed: false,
        score: 0,
        totalQuestions: SESSION_ASSESSMENT_QUESTIONS.length,
        passed: false
      });
    }

    const data = sheet.getDataRange().getValues();
    const row = data.slice(1).find(r => 
      r[1] && r[1].toString().toUpperCase() === employeeId.toUpperCase()
    );

    if (!row) {
      return createResponse(true, 'Assessment status retrieved', {
        unlocked: false,
        completed: false,
        score: 0,
        totalQuestions: SESSION_ASSESSMENT_QUESTIONS.length,
        passed: false
      });
    }

    return createResponse(true, 'Assessment status retrieved', {
      unlocked: row[6] || false, // Unlocked column
      completed: row[7] || false, // Completed column
      score: row[8] || 0, // Score
      totalQuestions: SESSION_ASSESSMENT_QUESTIONS.length,
      passed: row[9] || false, // Passed
      unlockedBy: row[10] || '',
      unlockedAt: row[11] || '',
      completedAt: row[12] || ''
    });

  } catch (error) {
    return createResponse(false, 'Error getting assessment status: ' + error.toString());
  }
}

/**
 * Get session assessment questions
 */
function getSessionAssessmentQuestions() {
  try {
    return createResponse(true, 'Questions retrieved successfully', {
      questions: SESSION_ASSESSMENT_QUESTIONS,
      totalQuestions: SESSION_ASSESSMENT_QUESTIONS.length,
      passingScore: SESSION_ASSESSMENT_PASSING_SCORE
    });
  } catch (error) {
    return createResponse(false, 'Error retrieving questions: ' + error.toString());
  }
}

/**
 * Unlock session assessment for a candidate (Trainer action)
 */
function unlockSessionAssessment(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.SESSION_ASSESSMENT);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.SESSION_ASSESSMENT);
      
      // Create headers
      const headers = [
        'Timestamp',
        'Employee ID',
        'Employee Name',
        'Manager ID',
        'Manager Name',
        'Store ID',
        'Unlocked',
        'Completed',
        'Score',
        'Passed',
        'Unlocked By (Trainer)',
        'Unlocked At',
        'Completed At',
        'Answers (JSON)'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#10B981');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if candidate already exists
    const existingData = sheet.getDataRange().getValues();
    const existingRowIndex = existingData.slice(1).findIndex(row => 
      row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase()
    );
    
    if (existingRowIndex !== -1) {
      // Update existing row - set unlocked to true
      const actualRowIndex = existingRowIndex + 2; // +1 for header, +1 for slice
      sheet.getRange(actualRowIndex, 7).setValue(true); // Unlocked
      sheet.getRange(actualRowIndex, 11).setValue(data.trainerId || ''); // Unlocked By
      sheet.getRange(actualRowIndex, 12).setValue(new Date().toISOString()); // Unlocked At
      
      return createResponse(true, 'Session assessment unlocked for candidate');
    } else {
      // Create new row
      const newRow = [
        new Date().toISOString(),
        data.employeeId,
        data.employeeName,
        data.managerId || '',
        data.managerName || '',
        data.storeId || '',
        true, // Unlocked
        false, // Completed
        0, // Score
        false, // Passed
        data.trainerId || '', // Unlocked By
        new Date().toISOString(), // Unlocked At
        '', // Completed At
        '' // Answers JSON
      ];
      
      sheet.appendRow(newRow);
      
      return createResponse(true, 'Session assessment unlocked for candidate');
    }

  } catch (error) {
    return createResponse(false, 'Error unlocking assessment: ' + error.toString());
  }
}

/**
 * Submit session assessment answers (Candidate action)
 */
function submitSessionAssessment(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.SESSION_ASSESSMENT);
    
    if (!sheet) {
      return createResponse(false, 'Assessment not initialized. Please contact your trainer.');
    }

    // Find candidate's row
    const existingData = sheet.getDataRange().getValues();
    const existingRowIndex = existingData.slice(1).findIndex(row => 
      row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase()
    );
    
    if (existingRowIndex === -1) {
      return createResponse(false, 'Assessment not unlocked. Please contact your trainer.');
    }

    const existingRow = existingData[existingRowIndex + 1];
    
    // Check if unlocked
    if (!existingRow[6]) {
      return createResponse(false, 'Assessment is not unlocked yet. Please wait for your trainer.');
    }
    
    // Check if already completed
    if (existingRow[7]) {
      return createResponse(false, 'Assessment already completed. Cannot resubmit.');
    }

    // Calculate score
    let score = 0;
    const answers = data.answers || {};
    
    SESSION_ASSESSMENT_QUESTIONS.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
        score++;
      }
    });
    
    const passed = score >= SESSION_ASSESSMENT_PASSING_SCORE;
    const percentage = ((score / SESSION_ASSESSMENT_QUESTIONS.length) * 100).toFixed(2);
    
    // Update row
    const actualRowIndex = existingRowIndex + 2; // +1 for header, +1 for slice
    sheet.getRange(actualRowIndex, 8).setValue(true); // Completed
    sheet.getRange(actualRowIndex, 9).setValue(score); // Score
    sheet.getRange(actualRowIndex, 10).setValue(passed); // Passed
    sheet.getRange(actualRowIndex, 13).setValue(new Date().toISOString()); // Completed At
    sheet.getRange(actualRowIndex, 14).setValue(JSON.stringify(answers)); // Answers JSON
    
    return createResponse(true, 'Assessment submitted successfully', {
      score: score,
      totalQuestions: SESSION_ASSESSMENT_QUESTIONS.length,
      percentage: percentage,
      passed: passed,
      passingScore: SESSION_ASSESSMENT_PASSING_SCORE
    });

  } catch (error) {
    return createResponse(false, 'Error submitting assessment: ' + error.toString());
  }
}

/**
 * Get dashboard statistics
 */
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get total candidates
    const candidatesSheet = ss.getSheetByName(SHEETS.CANDIDATES);
    const totalCandidates = candidatesSheet ? candidatesSheet.getDataRange().getValues().length - 1 : 0;

    // Get readiness completed
    const readinessSheet = ss.getSheetByName(SHEETS.READINESS);
    const readinessData = readinessSheet ? readinessSheet.getDataRange().getValues().slice(1) : [];
    const readinessCompleted = readinessData.length;
    const readinessPassed = readinessData.filter(row => row[8] === true || row[8] === 'TRUE').length;

    // Get sessions attended
    const sessionSheet = ss.getSheetByName(SHEETS.SESSION);
    const sessionsAttended = sessionSheet ? sessionSheet.getDataRange().getValues().length - 1 : 0;

    // Get skill checks completed
    const skillCheckSheet = ss.getSheetByName(SHEETS.SKILL_CHECK);
    const skillChecksCompleted = skillCheckSheet ? skillCheckSheet.getDataRange().getValues().length - 1 : 0;

    const stats = {
      totalCandidates,
      readinessCompleted,
      readinessPassed,
      sessionsAttended,
      skillChecksCompleted,
      readinessPassRate: readinessCompleted > 0 ? ((readinessPassed / readinessCompleted) * 100).toFixed(1) : 0
    };

    return createResponse(true, 'Dashboard data retrieved successfully', stats);

  } catch (error) {
    return createResponse(false, 'Error retrieving dashboard data: ' + error.toString());
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
    
    // Check if headers exist
    const firstRow = sheet.getRange(1, 1, 1, 50).getValues()[0];
    const hasHeaders = firstRow[0] && firstRow[0].toString().includes('Timestamp');
    
    if (!hasHeaders) {
      // Create headers
      const headers = [
        'Timestamp',
        'Employee ID',
        'Employee Name',
        'Manager ID',
        'Manager Name',
        'Responses (JSON)',
        'Total Score',
        'Max Score',
        'Passed',
        'Percentage'
      ];
      
      // Add individual question columns
      let questionNum = 1;
      for (const category in READINESS_CATEGORIES) {
        const items = READINESS_CATEGORIES[category];
        for (let i = 0; i < items.length; i++) {
          headers.push(`Q${questionNum}_Score`);
          headers.push(`Q${questionNum}_Comment`);
          questionNum++;
        }
      }
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#10B981');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if employee already has submission
    const existingData = sheet.getDataRange().getValues();
    const existingRow = existingData.slice(1).findIndex(row => 
      row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase()
    );
    
    if (existingRow !== -1) {
      return createResponse(false, 'Readiness checklist already submitted for this candidate. Cannot resubmit.');
    }
    
    // Calculate scores
    const totalScore = Object.values(data.responses || {}).reduce((sum, val) => sum + val, 0);
    const passed = totalScore >= PASSING_SCORE;
    const percentage = ((totalScore / MAX_READINESS_SCORE) * 100).toFixed(2);
    
    // Build new row
    const newRow = [
      data.submissionTime || new Date().toISOString(),
      data.employeeId,
      data.employeeName,
      data.managerId,
      data.managerName,
      JSON.stringify(data.responses),
      totalScore,
      MAX_READINESS_SCORE,
      passed,
      percentage
    ];
    
    // Add individual scores and comments
    let questionNum = 1;
    for (const category in READINESS_CATEGORIES) {
      const items = READINESS_CATEGORIES[category];
      for (let i = 0; i < items.length; i++) {
        const questionId = `PS_${i + 1}`;  // This would need proper ID mapping
        newRow.push(data.responses[questionId] || 0);
        newRow.push(data.comments ? data.comments[questionId] || '' : '');
        questionNum++;
      }
    }
    
    sheet.appendRow(newRow);
    
    return createResponse(true, 'Readiness checklist submitted successfully', {
      passed: passed,
      totalScore: totalScore,
      maxScore: MAX_READINESS_SCORE,
      percentage: percentage
    });

  } catch (error) {
    return createResponse(false, 'Error submitting readiness checklist: ' + error.toString());
  }
}

/**
 * Submit BT Session Attendance
 */
function submitBTSession(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.SESSION);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.SESSION);
    }
    
    // Check if headers exist
    const firstRow = sheet.getRange(1, 1, 1, 10).getValues()[0];
    const hasHeaders = firstRow[0] && firstRow[0].toString().includes('Timestamp');
    
    if (!hasHeaders) {
      const headers = [
        'Timestamp',
        'Employee ID',
        'Employee Name',
        'Session Date',
        'Trainer ID',
        'Trainer Name',
        'QR Code',
        'Location',
        'Notes'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#10B981');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if already attended
    const existingData = sheet.getDataRange().getValues();
    const existingRow = existingData.slice(1).findIndex(row => 
      row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase()
    );
    
    if (existingRow !== -1) {
      return createResponse(false, 'Session attendance already marked for this candidate.');
    }
    
    const newRow = [
      data.submissionTime || new Date().toISOString(),
      data.employeeId,
      data.employeeName,
      data.sessionDate || new Date().toISOString(),
      data.trainerId,
      data.trainerName,
      data.qrCode || '',
      data.location || '',
      data.notes || ''
    ];
    
    sheet.appendRow(newRow);
    
    return createResponse(true, 'BT Session attendance marked successfully');

  } catch (error) {
    return createResponse(false, 'Error submitting BT session: ' + error.toString());
  }
}

/**
 * Submit Skill Check Evaluation
 */
function submitSkillCheck(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.SKILL_CHECK);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.SKILL_CHECK);
    }
    
    // Check if headers exist
    const firstRow = sheet.getRange(1, 1, 1, 30).getValues()[0];
    const hasHeaders = firstRow[0] && firstRow[0].toString().includes('Timestamp');
    
    if (!hasHeaders) {
      const headers = [
        'Timestamp',
        'Employee ID',
        'Employee Name',
        'Trainer ID',
        'Trainer Name',
        'Responses (JSON)',
        'Yes Count',
        'Total Questions',
        'Percentage',
        'Overall Remarks'
      ];
      
      // Add individual question columns
      let questionNum = 1;
      for (const phase in SKILL_CHECK_PHASES) {
        const questions = SKILL_CHECK_PHASES[phase];
        for (let i = 0; i < questions.length; i++) {
          headers.push(`${phase}_Q${i + 1}`);
          questionNum++;
        }
      }
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#A855F7');
      headerRange.setFontColor('#FFFFFF');
    }

    // Check if already submitted
    const existingData = sheet.getDataRange().getValues();
    const existingRow = existingData.slice(1).findIndex(row => 
      row[1] && row[1].toString().toUpperCase() === data.employeeId.toString().toUpperCase()
    );
    
    if (existingRow !== -1) {
      return createResponse(false, 'Skill check already submitted for this candidate. Cannot resubmit.');
    }
    
    // Calculate statistics
    const totalQuestions = Object.keys(data.responses || {}).length;
    const yesCount = Object.values(data.responses || {}).filter(val => val === true || val === 'true').length;
    const percentage = totalQuestions > 0 ? ((yesCount / totalQuestions) * 100).toFixed(2) : 0;
    
    const newRow = [
      data.submissionTime || new Date().toISOString(),
      data.employeeId,
      data.employeeName,
      data.trainerId,
      data.trainerName,
      JSON.stringify(data.responses),
      yesCount,
      totalQuestions,
      percentage,
      data.remarks || ''
    ];
    
    // Add individual responses
    let questionNum = 1;
    for (const phase in SKILL_CHECK_PHASES) {
      const questions = SKILL_CHECK_PHASES[phase];
      for (let i = 0; i < questions.length; i++) {
        const questionId = `${phase.toUpperCase().replace(/[^A-Z]/g, '')}_${i + 1}`;
        const response = data.responses[questionId];
        newRow.push(response === true || response === 'true' ? 'Yes' : 'No');
        questionNum++;
      }
    }
    
    sheet.appendRow(newRow);
    
    return createResponse(true, 'Skill check submitted successfully', {
      yesCount: yesCount,
      totalQuestions: totalQuestions,
      percentage: percentage
    });

  } catch (error) {
    return createResponse(false, 'Error submitting skill check: ' + error.toString());
  }
}
