
import { Question, Store, AreaManager, HRPerson } from './types';
import { MAPPED_STORES } from './mappedStores';

export const QUESTIONS: Question[] = [
    { id: 'q1', title: 'Is there any work pressure in the café?', type: 'radio', choices: [
      {label: 'Every time', score: 1}, {label: 'Most of the time', score:2}, {label: 'Sometime', score:3}, {label: 'At Time', score:4}, {label: 'Never', score:5}
    ]},
    { id: 'q2', title: 'Are you empowered to make decisions on the spot to help customers and immediately solve their problems/complaints?', type: 'radio', choices: [
      {label: 'Every time', score:5}, {label: 'Most of the time', score:4}, {label: 'Sometime', score:3}, {label: 'At Time', score:2}, {label: 'Never', score:1}
    ]},
    { id: 'q3', title: 'Do you receive regular performance reviews and constructive feedback from your SM / AM ?', type: 'radio', choices: [
      {label: 'Every time', score:5}, {label: 'Most of the time', score:4}, {label: 'Sometime', score:3}, {label: 'At Time', score:2}, {label: 'Never', score:1}
    ]},
    { id: 'q4', title: 'Do you think there is any partiality or unfair treatment within team ?', type: 'radio', choices: [
      {label: 'Every time', score:1}, {label: 'Most of the time', score:2}, {label: 'Sometime', score:3}, {label: 'At Time', score:4}, {label: 'Never', score:5}
    ]},
    { id: 'q5', title: 'Are you getting the training as per Wings program? What was the last training you got and when ?', type: 'radio', choices: [
      {label: 'Every time', score:5}, {label: 'Most of the time', score:4}, {label: 'Sometime', score:3}, {label: 'At Time', score:2}, {label: 'Never', score:1}
    ]},
    { id: 'q6', title: 'Are you facing any issues with operational Apps ( Zing, Meal benefit, Jify ) or any issues with PF, ESI, Reimbursements,Insurance & Payslips', type: 'radio', choices: [
      {label: 'Every time', score:1}, {label: 'Most of the time', score:2}, {label: 'Sometime', score:3}, {label: 'At Time', score:4}, {label: 'Never', score:5}
    ]},
    { id: 'q7', title: 'Have you gone through the HR Handbook on Zing / Accepted all the policies?', type: 'radio', choices: [
      {label: 'Excellent', score:5}, {label: 'Very Good', score:4}, {label: 'Good', score:3}, {label: 'Average', score:2}, {label: 'Poor', score:1}
    ]},
    { id: 'q8', title: 'Are you satisfied with your current work schedule - Working Hours, Breaks, Timings, Weekly Offs & Comp Offs ?', type: 'radio', choices: [
      {label: 'Every time', score:5}, {label: 'Most of the time', score:4}, {label: 'Sometime', score:3}, {label: 'At Time', score:2}, {label: 'Never', score:1}
    ]},
    { id: 'q9', title: 'How effectively does the team collaborate, and what factors contribute to that?', type: 'radio', choices: [
      {label: 'Excellent', score:5}, {label: 'Very Good', score:4}, {label: 'Good', score:3}, {label: 'Average', score:2}, {label: 'Poor', score:1}
    ]},
    { id: 'q10', title: 'Name one of your colleague who is very helpful on the floor', type: 'input' },
    { id: 'q11', title: 'Any suggestions or support required from the organization ?', type: 'textarea' },
    { id: 'q12', title: 'On a scale of 1 to 5 how do you rate your experience with TWC & why ?', type: 'radio', choices: [
      {label: 'Excellent', score:5}, {label: 'Very Good', score:4}, {label: 'Good', score:3}, {label: 'Average', score:2}, {label: 'Poor', score:1}
    ]}
];

export const AREA_MANAGERS: AreaManager[] = [
      { name: 'Abhishek', id: 'H3386' },
      { name: 'Ajay  H', id: 'H546' },
      { name: 'Ajay Omnath Tiwari', id: 'H1815' },
      { name: 'Amar', id: 'H535' },
      { name: 'Anil  Rawat', id: 'H2262' },
      { name: 'Atul', id: 'H2396' },
      { name: 'Bhawna', id: 'H3595' },
      { name: 'Himanshu', id: 'H955' },
      { name: 'Jagruti', id: 'H2155' },
      { name: 'Karthick  G', id: 'H3362' },
      { name: 'Kiran', id: 'H2601' },
      { name: 'Nandish  M', id: 'H833' },
      { name: 'Rutuja', id: 'H2758' },
      { name: 'Sanjay', id: 'H2273' },
      { name: 'Shailesh', id: 'H2908' },
      { name: 'Suresh  A', id: 'H1355' },
      { name: 'Umakanth', id: 'H3270' },
      { name: 'Vishal Vishwanath Khatakalle', id: 'H3184' },
      { name: 'Vishu', id: 'H1766' },
      { name: 'Vruchika', id: 'H1575' }
];

export const REGIONS = ['North', 'South', 'West'];

// Use the mapped stores from the HR mapping data
export const STORES: Store[] = MAPPED_STORES;

export const HR_PERSONNEL: HRPerson[] = [
    { name: 'Abhishek', id: 'H3578' },
    { name: 'Monica', id: 'H2165' },
    { name: 'Subin', id: 'H2761' },
    { name: 'Swati', id: 'H1972' },
    { name: 'Manasi', id: 'H3603' },
    { name: 'Sunil', id: 'H3247' },
    { name: 'Sarit', id: 'H2081' },
    { name: 'Pooja', id: 'HC002' },
    { name: 'Rohit Paul', id: 'H3551' },
    { name: 'Training Head', id: 'H3237' },
    { name: 'LMS Head', id: 'H541' }
];

// Senior HR roles that should have access to all Area Managers
export const SENIOR_HR_ROLES = ['H2081', 'H3237', 'H541']; // Sarit, Training Head, LMS Head

// AM Operations Questions - 53 questions across 6 sections (COFFEE framework)
export const OPERATIONS_QUESTIONS: Question[] = [
  // Section 1: Cheerful Greeting (CG_1 to CG_13)
  { id: 'CG_1', title: 'Is the store front area clean and maintained?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_2', title: 'Is the signage clean and are all lights functioning?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_3', title: 'Are the glass and doors smudge-free?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_4', title: 'Do promotional displays reflect current offers?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_5', title: 'Are POS tent cards as per the latest communication?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_6', title: 'Are menu boards/DMB as per the latest communication?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_7', title: 'Does the café have a welcoming environment (music, lighting, AC, aroma)?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_8', title: 'Are washrooms cleaned and the checklist updated?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_9', title: 'Is the FDU counter neat, fully stocked, and set as per the planogram?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_10', title: 'Does the merch rack follow VM guidelines and attract attention?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_11', title: 'Is staff grooming (uniform, jewellery, hair and makeup) as per standards?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_12', title: 'Are all seating, furniture, and stations tidy and organized?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CG_13', title: 'Is the engine area clean and ready for operations?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},

  // Section 2: Order Taking Assistance (OTA_1 to OTA_11)
  { id: 'OTA_1', title: 'Is suggestive selling happening at the POS?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_2', title: 'Is the POS partner updated on the latest promos and item availability?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_3', title: 'Has order-taking time been recorded for 5 customers?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_4', title: 'Is there sufficient cash and change at the POS?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_5', title: 'Are valid licenses displayed and expiries checked (medical reports)?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_6', title: 'Are cash audits completed and verified with the logbook?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_7', title: 'Are daily banking reports tallied?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_8', title: 'Has CPI been reviewed through the FAME pilot?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_9', title: 'Are Swiggy/Zomato metrics (RDC, MFR, visibility) reviewed, and are Food Lock on LS and stock control on UrbanPiper managed per stock availability/opening inventory?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_10', title: 'Are all food and drinks served as per SOP?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'OTA_11', title: 'Are food orders placed based on the 4-week sales trend?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},

  // Section 3: Friendly & Accurate Service (FAS_1 to FAS_13)  
  { id: 'FAS_1', title: 'Is equipment cleaned and maintained?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_2', title: 'Are temperature checks done with the Therma Pen and logs updated?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_3', title: 'Is documentation (GRN, RSTN, STN & TO) completed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_4', title: 'Is fast-moving SKU availability checked and validated with LS?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_5', title: 'Is the thawing chart validated against actual thawing?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_6', title: 'Are deployment roles clear, with coaching and appreciation done by the MOD?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_7', title: 'Are there no broken/unused tools stored in the store?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_8', title: 'Is garbage segregated properly (wet/dry)?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_9', title: 'Are LTO products served as per standards?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_10', title: 'Is the coffee and food dial-in process followed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_11', title: 'Are R.O.A.S.T. and app orders executed accurately?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_12', title: 'Have 5 order service times been validated?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FAS_13', title: 'Have open maintenance-related points been reviewed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},

  // Section 4: Feedback with Solution (FWS_1 to FWS_13)
  { id: 'FWS_1', title: 'Has COGS been reviewed, with actions in place per last month P&L feedback?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_2', title: 'Have BSC targets vs achievements been reviewed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_3', title: 'Has people budget vs actuals (labour cost/bench planning) been reviewed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_4', title: 'Has variance in stock (physical vs system) been verified?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_5', title: 'Have the top 10 wastage items been reviewed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_6', title: 'Have store utilities (units, chemical use) been reviewed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_7', title: 'Have shift targets, briefings, and goal tracking been conducted?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_8', title: 'Have new staff training and bench plans been reviewed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_9', title: 'Have Training and QA audits been reviewed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_10', title: 'Has the duty roster (off/coff, ELCL, tenure) been checked and attendance ensured as per ZingHR?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_11', title: 'Have temperature and thawing logs been validated?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_12', title: 'Have audit and data findings been cross-checked with store observations?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'FWS_13', title: 'Is the pest control layout updated?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},

  // Section 5: Enjoyable Experience (ENJ_1 to ENJ_7)
  { id: 'ENJ_1', title: 'Have 2 new and 2 repeat customers been engaged, with feedback documented?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'ENJ_2', title: 'Are seating and stations adjusted as per customer requirements?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'ENJ_3', title: 'Is the team proactively assisting customers?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'ENJ_4', title: 'Is CCTV checked to monitor customer service during peak hours?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'ENJ_5', title: 'Is CCTV backup (minimum 60 days) in place and are black spots checked?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'ENJ_6', title: 'Is opening/closing footage reviewed for correct practices?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'ENJ_7', title: 'Are there no personal items/clutter in guest areas, with belongings kept in lockers/designated places?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},

  // Section 6: Enthusiastic Exit (EX_1 to EX_6)
  { id: 'EX_1', title: 'Are there no unresolved issues at exits?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'EX_2', title: 'Is the final interaction cheerful and courteous?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'EX_3', title: 'Has a consolidated action plan been created with the Store Manager?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'EX_4', title: 'Have top performers been recognized?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'EX_5', title: 'Have wins been celebrated and improvement areas communicated?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'EX_6', title: 'Has the team been motivated for ongoing improvement?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]}
];

// Training Audit Questions - 47 questions across 8 sections
export const TRAINING_QUESTIONS: Question[] = [
  // Section 1: Training Materials (TM_1 to TM_9)
  { id: 'TM_1', title: 'FRM available at store?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'TM_2', title: 'BRM available at store?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'TM_3', title: 'One-pager – Hot/Cue Cards displayed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'TM_4', title: 'One-pager – Cold/Cue Cards displayed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'TM_5', title: 'Dial-in One-pager visible?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'TM_6', title: 'New-launch learning material available?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'TM_7', title: 'COFFEE & HD Playbook in store?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'TM_8', title: 'MSDS, chemical chart and Shelf life chart available?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'TM_9', title: 'Career Progression Chart & Reward Poster displayed?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},

  // Section 2: LMS Usage (LMS_1 to LMS_3)
  { id: 'LMS_1', title: 'Orientation & Induction completed within 3 days of joining?', type: 'radio', choices: [
    {label: 'Yes', score: 4}, {label: 'No', score: -4}
  ]},
  { id: 'LMS_2', title: 'All assessments & knowledge checks completed on LMS?', type: 'radio', choices: [
    {label: 'Yes', score: 4}, {label: 'No', score: -4}
  ]},
  { id: 'LMS_3', title: 'Team uses LMS for new info & comms?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},

  // Section 3: Buddy Trainer (Buddy_1 to Buddy_6)
  { id: 'Buddy_1', title: 'Does the café have at least 2 certified Buddy Trainers?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'Buddy_2', title: 'Have Buddy Trainers completed their Skill Check?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'Buddy_3', title: 'Are trainees rostered with Buddy Trainers and working in the same shift?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'Buddy_4', title: 'Have Buddy Trainers attended the BT workshop?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'Buddy_5', title: 'Can Buddy Trainers explain the 4-step training process effectively?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'Buddy_6', title: 'Can Buddy Trainers navigate Zing LMS flawlessly?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},

  // Section 4: New Joiner Training (NJ_1 to NJ_7)
  { id: 'NJ_1', title: 'Is the OJT book available for all partners?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'NJ_2', title: 'Are trainees referring to the OJT book and completing their skill checks?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'NJ_3', title: 'Is training progression aligned with the Training Calendar/Plan?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'NJ_4', title: 'Are team members aware of post-barista training progressions?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'NJ_5', title: 'Have managers completed SHLP training as per the calendar?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'NJ_6', title: 'Are there at least 2 FOSTAC-certified managers in the store?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'NJ_7', title: 'Is ASM/SM training completed as per the Training Calendar?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},

  // Section 5: Partner Knowledge (PK_1 to PK_7)
  { id: 'PK_1', title: 'Are team members aware of current company communication?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'PK_2', title: 'Ask a team member to conduct a Coffee Tasting & a Sampling', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'PK_3', title: 'Is Sampling being conducted as per the set guidelines?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'PK_4', title: 'Is Coffee Tasting engaging and effective?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'PK_5', title: 'Are team members aware of manual brewing methods and standards?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'PK_6', title: 'Are partners following grooming standards?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'PK_7', title: 'Ask questions about key topics: COFFEE, LEAST, ROAST, Dial-in, Milk Steaming, LTO, Values(RESPECT), MSDS, Chemical Dilution, Food Safety, and Security.', type: 'radio', choices: [
    {label: 'Yes', score: 3}, {label: 'No', score: -3}
  ]},

  // Section 6: TSA Food - Training Skill Assessment Food (TSA_Food_Score)
  { id: 'TSA_Food_Score', title: 'TSA Food Score (out of 10)', type: 'input' },

  // Section 7: TSA Coffee - Training Skill Assessment Coffee (TSA_Coffee_Score)
  { id: 'TSA_Coffee_Score', title: 'TSA Coffee Score (out of 10)', type: 'input' },

  // Section 8: TSA CX - Training Skill Assessment Customer Experience (TSA_CX_Score)
  { id: 'TSA_CX_Score', title: 'TSA CX Score (out of 10)', type: 'input' },

  // Section 9: Customer Experience (CX_1 to CX_9)
  { id: 'CX_1', title: 'Is appropriate background music playing at the appropriate volume?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CX_2', title: 'Is the store temperature comfortable?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CX_3', title: 'Are the washrooms clean and well-maintained?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CX_4', title: 'Is WiFi available and functioning properly?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CX_5', title: 'Are marketing elements and displays (Merchandise rack and FDU) displayed appropriately as per VM guide?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'CX_6', title: 'Is the store furniture clean and well-kept?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CX_7', title: 'Ask - What do you understand by MA, CPI, Google, HD, QA, and App Feedback Scores?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CX_8', title: 'Ask - What was the latest Mystery Audit score for the store?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},
  { id: 'CX_9', title: 'Ask - What were the top two opportunity areas in Customer Experience (last month)? (1 Mark - No partial marks)', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: 0}
  ]},

  // Section 10: Action Plan (AP_1 to AP_3)
  { id: 'AP_1', title: 'SMART action plan - Is the action plan Specific, Measurable, Achievable, Relevant, and Time-bound?', type: 'radio', choices: [
    {label: 'Yes', score: 1}, {label: 'No', score: -1}
  ]},
  { id: 'AP_2', title: 'Has the action plan been discussed with the trainee and agreed upon?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]},
  { id: 'AP_3', title: 'Are follow-up dates scheduled to review progress on the action plan?', type: 'radio', choices: [
    {label: 'Yes', score: 2}, {label: 'No', score: 0}
  ]}
];
