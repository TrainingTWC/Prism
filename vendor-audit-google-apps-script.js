/**
 * QA Unified + Vendor Audit Google Apps Script
 * Single endpoint for: QA Audit submission, AM Follow-Up, CAPA, Drafts, Vendor Audit
 *
 * Sheets in this spreadsheet:
 *   - "QA"                  — QA audit submissions (all 116 question responses)
 *   - "QA AM Review"        — AM follow-up for non-compliant findings
 *   - "QA CAPA"             — Corrective & Preventive Action for store managers
 *   - "QA Drafts"           — Draft management
 *   - "Vendor Audits"       — Vendor audit submissions (63 question responses + remarks + images)
 *   - "Vendor Audit Drafts" — Vendor audit draft management
 *
 * Deploy: Extensions > Apps Script > Deploy > Web App
 *   Execute as: Me | Access: Anyone
 *
 * Set the deployed URL as VITE_VENDOR_AUDIT_SCRIPT_URL in .env
 */

// ===========================
// VENDOR AUDIT QUESTION ID DEFINITIONS
// ===========================

var VA_QUESTION_IDS = [
  // Zero Tolerance (3)
  'VA_ZeroTolerance_VZT_1', 'VA_ZeroTolerance_VZT_2', 'VA_ZeroTolerance_VZT_3',
  // Design & Facilities (16)
  'VA_DesignFacilities_VDF_1', 'VA_DesignFacilities_VDF_2', 'VA_DesignFacilities_VDF_3', 'VA_DesignFacilities_VDF_4',
  'VA_DesignFacilities_VDF_5', 'VA_DesignFacilities_VDF_6', 'VA_DesignFacilities_VDF_7', 'VA_DesignFacilities_VDF_8',
  'VA_DesignFacilities_VDF_9', 'VA_DesignFacilities_VDF_10', 'VA_DesignFacilities_VDF_11', 'VA_DesignFacilities_VDF_12',
  'VA_DesignFacilities_VDF_13', 'VA_DesignFacilities_VDF_14', 'VA_DesignFacilities_VDF_15', 'VA_DesignFacilities_VDF_16',
  // Control of Operation (22)
  'VA_ControlOfOperation_VCO_1', 'VA_ControlOfOperation_VCO_2', 'VA_ControlOfOperation_VCO_3', 'VA_ControlOfOperation_VCO_4',
  'VA_ControlOfOperation_VCO_5', 'VA_ControlOfOperation_VCO_6', 'VA_ControlOfOperation_VCO_7', 'VA_ControlOfOperation_VCO_8',
  'VA_ControlOfOperation_VCO_9', 'VA_ControlOfOperation_VCO_10', 'VA_ControlOfOperation_VCO_11', 'VA_ControlOfOperation_VCO_12',
  'VA_ControlOfOperation_VCO_13', 'VA_ControlOfOperation_VCO_14', 'VA_ControlOfOperation_VCO_15', 'VA_ControlOfOperation_VCO_16',
  'VA_ControlOfOperation_VCO_17', 'VA_ControlOfOperation_VCO_18', 'VA_ControlOfOperation_VCO_19', 'VA_ControlOfOperation_VCO_20',
  'VA_ControlOfOperation_VCO_21', 'VA_ControlOfOperation_VCO_22',
  // Cleaning & Sanitation (5)
  'VA_CleaningSanitation_VCS_1', 'VA_CleaningSanitation_VCS_2', 'VA_CleaningSanitation_VCS_3', 'VA_CleaningSanitation_VCS_4', 'VA_CleaningSanitation_VCS_5',
  // Pest Control (2)
  'VA_PestControl_VPC_1', 'VA_PestControl_VPC_2',
  // Personal Hygiene (4)
  'VA_PersonalHygiene_VPH_1', 'VA_PersonalHygiene_VPH_2', 'VA_PersonalHygiene_VPH_3', 'VA_PersonalHygiene_VPH_4',
  // Maintenance (2)
  'VA_Maintenance_VM_1', 'VA_Maintenance_VM_2',
  // Documentation (5)
  'VA_Documentation_VD_1', 'VA_Documentation_VD_2', 'VA_Documentation_VD_3', 'VA_Documentation_VD_4', 'VA_Documentation_VD_5',
  // General Safety (4)
  'VA_GeneralSafety_VGS_1', 'VA_GeneralSafety_VGS_2', 'VA_GeneralSafety_VGS_3', 'VA_GeneralSafety_VGS_4'
];

// ===========================
// ROBUST PARAMETER PARSING
// ===========================

/**
 * Parse POST parameters robustly.
 * e.parameter can fail/be empty when the URL-encoded body exceeds ~50KB
 * (common with signatures + many questions + remarks + images).
 * Falls back to manually parsing e.postData.contents.
 */
function parsePostParams(e) {
  var params = (e && e.parameter) ? e.parameter : {};

  // Check if e.parameter is empty/missing critical keys — fall back to postData
  if (!params.action && !params.auditorName && !params.vendorName && !params.qaName && !params.storeName) {
    if (e && e.postData && e.postData.contents) {
      Logger.log('e.parameter empty — parsing from e.postData.contents (length=' + e.postData.contents.length + ')');
      var pairs = e.postData.contents.split('&');
      params = {};
      for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split('=');
        if (kv.length >= 2) {
          var key = decodeURIComponent(kv[0].replace(/\+/g, ' '));
          var val = decodeURIComponent(kv.slice(1).join('=').replace(/\+/g, ' '));
          params[key] = val;
        }
      }
    }
  }

  return params;
}

// ===========================
// ENTRY POINTS
// ===========================

function doPost(e) {
  try {
    var params = parsePostParams(e);
    var action = params.action || 'create';

    Logger.log('doPost action=' + action);

    switch (action) {
      // --- QA Actions ---
      case 'create':
        return submitQAAudit(params);
      case 'update':
        return updateQAAudit(params);
      case 'saveDraft':
        return saveDraft(params);
      case 'deleteDraft':
        return deleteDraft(params);
      case 'createAMReview':
        return createAMReviewStandalone(params);
      case 'createCAPA':
        return createCAPAStandalone(params);
      case 'updateAMReview':
        return updateAMReview(params);
      case 'updateCAPA':
        return updateCAPA(params);
      // --- Vendor Audit Actions ---
      case 'createVendorAudit':
        return createVendorAudit(params);
      case 'updateVendorAudit':
        return updateVendorAudit(params);
      case 'saveVendorAuditDraft':
        return saveVendorAuditDraft(params);
      case 'deleteVendorAuditDraft':
        return deleteVendorAuditDraft(params);
      default:
        return json({ success: false, message: 'Unknown POST action: ' + action });
    }
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return json({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || '';

    Logger.log('doGet action=' + action);

    switch (action) {
      // --- QA Actions ---
      case 'getData':
        return getQAData(params);
      case 'getAMReviews':
        return getAMReviews(params);
      case 'getCAPAs':
        return getCAPAs(params);
      case 'getDrafts':
        return getDrafts(params);
      case 'loadDraft':
        return loadDraft(params);
      // --- Vendor Audit Actions ---
      case 'getVendorAuditData':
        return getVendorAuditData(params);
      case 'getVendorAuditDrafts':
        return getVendorAuditDrafts(params);
      case 'loadVendorAuditDraft':
        return loadVendorAuditDraft(params);
      default:
        return json({ success: true, message: 'QA Unified + Vendor Audit API is active.' });
    }
  } catch (err) {
    Logger.log('doGet error: ' + err);
    return json({ success: false, error: err.toString() });
  }
}

// ===========================================================================
// QA AUDIT SUBMISSION
// ===========================================================================

function submitQAAudit(params) {
  var sheet = getOrCreateSheet('QA', qaHeaders());
  var ts = now();

  // Build the main QA row
  var row = [
    ts,                                       // A: Timestamp
    params.submissionTime || '',              // B: Submission Time
    params.qaName || '',                      // C: QA Auditor Name
    params.qaId || '',                        // D: QA Auditor ID
    params.amName || '',                      // E: AM Name
    params.amId || '',                        // F: AM ID
    params.storeName || '',                   // G: Store Name
    params.storeID || '',                     // H: Store ID
    params.city || '',                        // I: City
    params.region || '',                      // J: Region
    params.totalScore || 0,                   // K: Total Score
    params.maxScore || 0,                     // L: Max Score
    params.scorePercentage || 0,              // M: Score %
    params.auditorSignature || '',            // N: Auditor Signature
    params.smSignature || ''                  // O: SM Signature
  ];

  // QA Sections — all question responses by section_questionId key
  // ZeroTolerance: ZT_1..ZT_6
  var ztIds = ['ZT_1','ZT_2','ZT_3','ZT_4','ZT_5','ZT_6'];
  for (var i = 0; i < ztIds.length; i++) {
    row.push(params['ZeroTolerance_' + ztIds[i]] || '');
  }

  // Store: S_1..S_94
  for (var i = 1; i <= 94; i++) {
    row.push(params['Store_S_' + i] || '');
  }

  // QA (A section): A_1..A_3
  for (var i = 1; i <= 3; i++) {
    row.push(params['A_A_' + i] || '');
  }

  // Maintenance: M_1..M_11
  for (var i = 1; i <= 11; i++) {
    row.push(params['Maintenance_M_' + i] || '');
  }

  // HR: HR_1..HR_2
  for (var i = 1; i <= 2; i++) {
    row.push(params['HR_HR_' + i] || '');
  }

  // Remarks JSON + Images JSON
  row.push(params.questionRemarksJSON || '{}');
  row.push(params.questionImagesJSON || '{}');

  sheet.appendRow(row);
  Logger.log('QA audit saved for ' + params.storeName);

  // --- Auto-create AM Follow-Up + CAPA from non-compliant findings ---
  try {
    autoCreateFollowUps(params, ts);
  } catch (err) {
    Logger.log('Follow-up creation error (audit was saved): ' + err);
  }

  return json({ success: true, message: 'QA audit submitted', timestamp: ts });
}

function updateQAAudit(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA');
  if (!sheet) return json({ success: false, message: 'QA sheet not found' });

  var rowId = (params.rowId || '').trim();
  if (!rowId) return json({ success: false, message: 'rowId required for update' });

  var tz = Session.getScriptTimeZone();
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    var cellVal = data[i][1]; // Column B = Submission Time
    if (cellVal instanceof Date) {
      cellVal = Utilities.formatDate(cellVal, tz, 'dd/MM/yyyy HH:mm:ss');
    }
    if (String(cellVal || '').trim() === rowId) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex === -1) return json({ success: false, message: 'Row not found for rowId: ' + rowId });

  var ts = now() + ' (Updated)';
  var row = [
    ts,
    params.submissionTime || rowId,
    params.qaName || '',
    params.qaId || '',
    params.amName || '',
    params.amId || '',
    params.storeName || '',
    params.storeID || '',
    params.city || '',
    params.region || '',
    params.totalScore || 0,
    params.maxScore || 0,
    params.scorePercentage || 0,
    params.auditorSignature || '',
    params.smSignature || ''
  ];

  var ztIds = ['ZT_1','ZT_2','ZT_3','ZT_4','ZT_5','ZT_6'];
  for (var q = 0; q < ztIds.length; q++) {
    row.push(params['ZeroTolerance_' + ztIds[q]] || '');
  }
  for (var q = 1; q <= 94; q++) {
    row.push(params['Store_S_' + q] || '');
  }
  for (var q = 1; q <= 3; q++) {
    row.push(params['A_A_' + q] || '');
  }
  for (var q = 1; q <= 11; q++) {
    row.push(params['Maintenance_M_' + q] || '');
  }
  for (var q = 1; q <= 2; q++) {
    row.push(params['HR_HR_' + q] || '');
  }
  row.push(params.questionRemarksJSON || '{}');
  row.push(params.questionImagesJSON || '{}');

  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  Logger.log('Updated QA audit row ' + rowIndex);
  return json({ success: true, message: 'QA audit updated' });
}

// ===========================
// AUTO-CREATE AM FOLLOW-UP + CAPA
// ===========================

function autoCreateFollowUps(params, qaTimestamp) {
  var questionMap = {
    'ZeroTolerance_ZT_1': 'No expired food products in the café, and all food products are marked with clear date tags (MRD).',
    'ZeroTolerance_ZT_2': 'The product shall comply with the secondary shelf life for critical products like chicken, paneer, sauces, chilled, frozen, and composite products.',
    'ZeroTolerance_ZT_3': 'All food products should be stored according to the appropriate storage conditions (Frozen, Chilled, and Ambient).',
    'ZeroTolerance_ZT_4': 'RO/Mineral water TDS must be between 50 to 150 ±10 ppm that is being used for processing inside the café.',
    'ZeroTolerance_ZT_5': 'Temperature sensitive food items shall not be transferred to the other store in the uncontrolled medium.',
    'ZeroTolerance_ZT_6': 'No live pest activity, including but not limited to rodents, rats, cockroaches, and spiders, was seen inside the café.',
    'Store_S_1': 'No junk material, wastage, unused & dump materials found in or around the store.',
    'Store_S_2': 'The action plans for previous audit non-conformities (NCs) were shared on time in approved CAPA format, and all audit gaps have been closed.',
    'Store_S_3': 'Dishwasher and sink area checked for cleanliness, odor, leakage, etc.',
    'Store_S_4': 'Glass doors, cupboards, shelves and area behind equipment are clean and undamaged.',
    'Store_S_5': 'Area below shelves and machinery is clean and free of dust or waste.',
    'Store_S_6': 'Customer tables and chairs are in good condition and free of stains or damage.',
    'Store_S_7': 'Customer area organized and clean without dust/stains.',
    'Store_S_8': 'Food & packaging material not stored on the floor.',
    'Store_S_9': 'Food-contact materials and containers are clean, non-toxic, and corrosion-free.',
    'Store_S_10': 'Segregated materials (knives, cutting boards) are color-coded as veg/non-veg and clean.',
    'Store_S_11': 'Glasses clean and arranged upside down in clean racks.',
    'Store_S_12': 'Equipment cleaned per SOP at close of business.',
    'Store_S_13': 'Chiller/freezer temperatures maintained as per standards (Chiller 1–5°C, Freezer –18°C).',
    'Store_S_14': 'Merrychef inner body checked for food particles, rust, and filter cleanliness.',
    'Store_S_15': 'Microwaves, grillers, coffee makers, and food warmers are operational and clean.',
    'Store_S_16': 'Coffee machine and grinder are operational, clean, and in good condition.',
    'Store_S_17': 'Shakers and funnels are clean and without food accumulation.',
    'Store_S_18': 'Portafilter is clean and in good condition.',
    'Store_S_19': 'Small wares (scoops, knives, spatulas, tongs) are clean and undamaged.',
    'Store_S_20': 'UTF Holder, jackets, pouches & filling nozzle stored off the floor, no dust accumulation.',
    'Store_S_21': 'Paper cups, straws, syrups, tissues, and sauces neatly placed and available.',
    'Store_S_22': 'Freezer, FDU, and chillers are clean.',
    'Store_S_23': 'Ice cube box/machine/scooper are clean and dry; transfer in/out done in controlled condition.',
    'Store_S_24': 'Mixer, blender, BPR, and jars cleaned, washed, and stored inverted.',
    'Store_S_25': 'Housekeeping materials hung separately away from food prep area.',
    'Store_S_26': 'Floor mat cleaned adequately.',
    'Store_S_27': 'Bar mat cleaned adequately.',
    'Store_S_28': 'Carry bag clean and in good condition.',
    'Store_S_29': 'RO machine, tank, and pipelines are clean and in working order.',
    'Store_S_30': 'Food and non-food materials stored separately.',
    'Store_S_31': 'FDU temperature verified and within 0–5°C.',
    'Store_S_32': 'In-process food items held in clean containers with visible MRD tags per SOP.',
    'Store_S_33': 'Veg/non-veg & raw/cooked product segregation maintained during storage and handling.',
    'Store_S_34': 'Expired/rejected/dumped items labeled "Do Not Use" or "Expired" and kept separate.',
    'Store_S_35': 'No carton boxes in production area except milk boxes.',
    'Store_S_36': 'No objectionable items in store (broken tools, unused equipment, etc.).',
    'Store_S_37': 'Food waste and other waste removed daily to avoid accumulation.',
    'Store_S_38': 'Partner well-groomed (cap, T-shirt, apron, badge, trousers).',
    'Store_S_39': 'Personal hygiene of staff maintained (hair, nails, shaving, no infections/jewelry).',
    'Store_S_40': 'Handwashing procedures followed, sanitizer used.',
    'Store_S_41': 'Visitors follow basic safety measures before entering food area.',
    'Store_S_42': 'Personal belongings arranged separately from food/packaging.',
    'Store_S_43': 'Gloves used during food handling and changed after every use.',
    'Store_S_44': 'First aid kit available with non-expired medicines.',
    'Store_S_45': 'No unauthorized visitors.',
    'Store_S_46': 'New recipes and shelf-life charts available and followed.',
    'Store_S_47': 'FMCG/Impulse range clean, FSSAI-compliant, FEFO maintained.',
    'Store_S_48': 'Proper segregation of raw/cooked, veg/non-veg food.',
    'Store_S_49': 'All ingredients/products received from approved vendors.',
    'Store_S_50': 'Two beverages cross-verified with BRM.',
    'Store_S_51': 'Weight, appearance, and filling of two products verified with FRM/food tag.',
    'Store_S_52': 'No products repackaged or sealed with insulation tapes, rubber bands, or staples.',
    'Store_S_53': 'Measuring tools available, clean, and used for food prep/filling.',
    'Store_S_54': 'Packaging/wrapping material in contact with food is clean and food-grade.',
    'Store_S_55': 'Espresso sensory aspects (taste, crema, texture, temperature) evaluated.',
    'Store_S_56': 'No pest infestation observed; evidence of effective pest control available.',
    'Store_S_57': 'MSDS available for all pest control chemicals.',
    'Store_S_58': 'Pest control layout available and traps/fly catchers placed as per layout.',
    'Store_S_59': 'Approved chemicals labeled and stored away from food area.',
    'Store_S_60': 'Dilution charts readily available.',
    'Store_S_61': 'MSDS reports for all cleaning chemicals available.',
    'Store_S_62': 'Spray guns labeled and available.',
    'Store_S_63': 'Dustbins kept closed, clean, and segregated (wet, dry, surgical).',
    'Store_S_64': 'Waste not kept in BOH; disposed hygienically.',
    'Store_S_65': 'Washroom clean and checklist maintained.',
    'Store_S_66': 'Magic box inside BOH clean and in good condition.',
    'Store_S_67': 'Cleaning of utensils and equipment done per schedule.',
    'Store_S_68': 'No water stagnation in food zones.',
    'Store_S_69': 'Staff aware of fire extinguisher usage.',
    'Store_S_70': 'Team adheres to SOPs, recipes, hygiene, grooming, pest control, etc.',
    'Store_S_71': 'Receiving temperatures noted using probe and recorded in app.',
    'Store_S_72': 'Food transport vehicles clean, maintained, and temperature-checked.',
    'Store_S_73': 'Temperature monitoring records updated in Terotam app.',
    'Store_S_74': 'Measuring/monitoring devices calibrated periodically.',
    'Store_S_75': 'Food handlers trained to handle food safely; training records available.',
    'Store_S_76': 'Personal hygiene verification record updated.',
    'Store_S_77': 'Documentation and records available and retained for at least one year.',
    'Store_S_78': 'Pest control job card/record updated.',
    'Store_S_79': 'Raw materials used on FIFO and FEFO basis.',
    'Store_S_80': 'Color-coded microfiber cloths used as per area.',
    'Store_S_81': 'Frozen products thawed per SOP.',
    'Store_S_82': 'Glue pads and rodent boxes inspected and replaced as needed.',
    'Store_S_83': 'Smallware cleaned every 3 hours.',
    'Store_S_84': 'Food dial-in checklist updated.',
    'Store_S_85': 'FSSAI & FSDB displayed visibly and valid.',
    'Store_S_86': 'Person in charge holds valid FOSTAC certification.',
    'Store_S_87': 'Drainages cleaned per SOP and properly covered.',
    'Store_S_88': 'Veg/non-veg segregation and cleanliness of moulds maintained.',
    'Store_S_89': 'Wet floor signs used as needed.',
    'Store_S_90': 'Step stools/ladders used safely and maintained.',
    'Store_S_91': 'Food Display Unit arranged neatly with tags, allergens, calorie info, and logos.',
    'Store_S_92': 'Reusable condiments stored properly in clean containers.',
    'Store_S_93': 'All signages (handwash, push/pull, etc.) in place.',
    'Store_S_94': 'Digital/static menu boards functional and updated.',
    'A_A_1': 'Potable water used in food meets IS 10500 standards; records maintained.',
    'A_A_2': 'Food material tested internally or via accredited lab.',
    'A_A_3': 'Induction training program and assessment for new employees completed.',
    'Maintenance_M_1': 'Windows opening to external environment kept closed and fitted with insect mesh.',
    'Maintenance_M_2': 'No wall, floor, door, or ceiling damage.',
    'Maintenance_M_3': 'No unsecured electrical wires.',
    'Maintenance_M_4': 'Lighting above food/packaging areas covered and clean.',
    'Maintenance_M_5': 'Fire extinguishers in working condition and not expired.',
    'Maintenance_M_6': 'No pest entry points (wall holes, drains, ceiling gaps, etc.).',
    'Maintenance_M_7': 'Pest-o-flash placed properly (max height 6 ft, away from food areas).',
    'Maintenance_M_8': 'Equipment (RO, Coffee Machine, Freezer etc.) Maintenance file checked.',
    'Maintenance_M_9': 'RO water service records available.',
    'Maintenance_M_10': 'Plumbing and fixtures maintained.',
    'Maintenance_M_11': 'Freezer, FDU, and chillers in good working condition.',
    'HR_HR_1': 'Medical records for all staff including housekeeping available.',
    'HR_HR_2': 'Annual medical exams and vaccinations done as per schedule.'
  };

  var findings = [];
  var sections = [
    { prefix: 'ZeroTolerance_ZT_', count: 6, title: 'Zero Tolerance' },
    { prefix: 'Store_S_', count: 94, title: 'Store' },
    { prefix: 'A_A_', count: 3, title: 'QA' },
    { prefix: 'Maintenance_M_', count: 11, title: 'Maintenance' },
    { prefix: 'HR_HR_', count: 2, title: 'HR' }
  ];

  var remarksObj = {};
  try { remarksObj = JSON.parse(params.questionRemarksJSON || '{}'); } catch(e) {}

  for (var s = 0; s < sections.length; s++) {
    var sec = sections[s];
    for (var q = 1; q <= sec.count; q++) {
      var key = sec.prefix + q;
      var val = (params[key] || '').toLowerCase();
      if (val === 'not-compliant' || val === 'non-compliant' || val === 'partially-compliant') {
        findings.push({
          questionId: key,
          section: sec.title,
          question: questionMap[key] || key,
          response: val === 'non-compliant' ? 'not-compliant' : val,
          remark: remarksObj[key] || ''
        });
      }
    }
  }

  Logger.log('Found ' + findings.length + ' non-compliant/partial findings');
  if (findings.length === 0) return;

  var findingsJSON = JSON.stringify(findings);
  var submissionTime = params.submissionTime || qaTimestamp;

  // --- Create AM Follow-Up ---
  var amSheet = getOrCreateSheet('QA AM Review', [
    'Timestamp', 'QA Submission Time', 'QA Auditor Name', 'QA Auditor ID',
    'AM Name', 'AM ID', 'Store Name', 'Store ID', 'City', 'Region',
    'QA Score %', 'Total Findings', 'Status', 'Findings JSON'
  ]);

  amSheet.appendRow([
    qaTimestamp,
    submissionTime,
    params.qaName || '',
    params.qaId || '',
    params.amName || '',
    params.amId || '',
    params.storeName || '',
    params.storeID || '',
    params.city || '',
    params.region || '',
    params.scorePercentage || '',
    findings.length,
    'Open',
    findingsJSON
  ]);
  Logger.log('AM Follow-Up created (' + findings.length + ' findings)');

  // --- Create CAPA ---
  var capaSheet = getOrCreateSheet('QA CAPA', [
    'Timestamp', 'QA Submission Time', 'QA Auditor Name', 'QA Auditor ID',
    'Store Name', 'Store ID', 'City', 'Region',
    'AM Name', 'AM ID', 'Assigned To Names', 'Assigned To IDs',
    'QA Score %', 'Total Findings', 'Status',
    'CAPA Submitted By', 'CAPA Submitted By ID', 'CAPA Submission Time',
    'Findings JSON'
  ]);

  var mgr = resolveStoreManagers(params.storeID || '');
  var assignedNames = mgr.names;
  var assignedIds = mgr.ids;

  capaSheet.appendRow([
    qaTimestamp,
    submissionTime,
    params.qaName || '',
    params.qaId || '',
    params.storeName || '',
    params.storeID || '',
    params.city || '',
    params.region || '',
    params.amName || '',
    params.amId || '',
    assignedNames,
    assignedIds,
    params.scorePercentage || '',
    findings.length,
    'Open',
    '', '', '',
    findingsJSON
  ]);
  Logger.log('CAPA created (' + findings.length + ' findings, assigned to: ' + assignedNames + ')');
}

// ===========================
// STANDALONE CREATE (called by frontend via action=createCAPA / action=createAMReview)
// ===========================

function createAMReviewStandalone(params) {
  var sheet = getOrCreateSheet('QA AM Review', [
    'Timestamp', 'QA Submission Time', 'QA Auditor Name', 'QA Auditor ID',
    'AM Name', 'AM ID', 'Store Name', 'Store ID', 'City', 'Region',
    'QA Score %', 'Total Findings', 'Status', 'Findings JSON'
  ]);
  var ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  sheet.appendRow([
    ts, params.qaSubmissionTime || '', params.qaAuditorName || '', params.qaAuditorId || '',
    params.amName || '', params.amId || '', params.storeName || '', params.storeId || '',
    params.city || '', params.region || '', params.qaScore || '', params.totalFindings || '0',
    'Open', params.findingsJSON || '[]'
  ]);
  Logger.log('AM Review created for store: ' + params.storeName);
  return json({ success: true, message: 'AM Review created successfully' });
}

function createCAPAStandalone(params) {
  var sheet = getOrCreateSheet('QA CAPA', [
    'Timestamp', 'QA Submission Time', 'QA Auditor Name', 'QA Auditor ID',
    'Store Name', 'Store ID', 'City', 'Region',
    'AM Name', 'AM ID', 'Assigned To Names', 'Assigned To IDs',
    'QA Score %', 'Total Findings', 'Status',
    'CAPA Submitted By', 'CAPA Submitted By ID', 'CAPA Submission Time',
    'Findings JSON'
  ]);
  var ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  var assignedToNames = params.assignedToNames || '';
  var assignedToIds = params.assignedToIds || '';
  if (!assignedToNames && params.storeId) {
    var mgr = resolveStoreManagers(params.storeId);
    assignedToNames = mgr.names;
    assignedToIds = mgr.ids;
  }
  sheet.appendRow([
    ts, params.qaSubmissionTime || '', params.qaAuditorName || '', params.qaAuditorId || '',
    params.storeName || '', params.storeId || '', params.city || '', params.region || '',
    params.amName || '', params.amId || '', assignedToNames, assignedToIds,
    params.qaScore || '', params.totalFindings || '0', 'Open',
    '', '', '', params.findingsJSON || '[]'
  ]);
  Logger.log('CAPA created for store: ' + params.storeName + ' assigned to: ' + assignedToNames);
  return json({ success: true, message: 'QA CAPA created successfully' });
}

// ===========================
// STORE MANAGER RESOLUTION
// ===========================

function resolveStoreManagers(storeIdParam) {
  var result = { names: '', ids: '' };
  try {
    var empSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EMP. Master');
    if (!empSheet) { Logger.log('EMP. Master sheet not found'); return result; }
    var empData = empSheet.getDataRange().getValues();
    var empHeaders = empData[0];
    var storeCodeCol = findCol(empHeaders, ['store_id', 'store id', 'store_code', 'store code', 'storecode', 'storeid']);
    var desigCol = findCol(empHeaders, ['designation', 'desig', 'position', 'role', 'title']);
    var nameCol = findCol(empHeaders, ['empname', 'emp name', 'employee name', 'name', 'employee_name']);
    var idCol = findCol(empHeaders, ['employee_code', 'emp code', 'employee code', 'empcode', 'emp_code', 'emp id', 'empid']);
    if (storeCodeCol < 0 || desigCol < 0) return result;
    var targetDesig = [
      'store manager', 'shift manager', 'assistant store manager',
      'sm', 'asm', 'shift mgr', 'store mgr', 'asst store manager',
      'shift incharge', 'shift in charge', 'senior shift', 'sstm',
      'café manager', 'cafe manager', 'outlet manager'
    ];
    var sid = (storeIdParam || '').toUpperCase().trim();
    var names = [], ids = [];
    for (var i = 1; i < empData.length; i++) {
      var empStore = String(empData[i][storeCodeCol] || '').toUpperCase().trim();
      var empDesig = String(empData[i][desigCol] || '').toLowerCase().trim();
      if (empStore === sid) {
        var match = targetDesig.some(function(kw) { return empDesig === kw || empDesig.indexOf(kw) >= 0; });
        if (match) {
          if (nameCol >= 0) names.push(String(empData[i][nameCol] || ''));
          if (idCol >= 0) ids.push(String(empData[i][idCol] || ''));
        }
      }
    }
    result.names = names.join(', ');
    result.ids = ids.join(', ');
    Logger.log('Resolved ' + names.length + ' managers for store ' + sid + ': ' + result.names);
  } catch (err) {
    Logger.log('Could not resolve store managers: ' + err);
  }
  return result;
}

// ===========================================================================
// QA READ OPERATIONS
// ===========================================================================

function getQAData(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA');
  if (!sheet) return json([]);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return json([]);

  var headers = data[0];
  var records = [];

  var fieldMap = {
    'Timestamp': 'timestamp',
    'Submission Time': 'submissionTime',
    'QA Auditor Name': 'qaName',
    'QA Auditor ID': 'qaId',
    'AM Name': 'amName',
    'AM ID': 'amId',
    'Store Name': 'storeName',
    'Store ID': 'storeId',
    'City': 'city',
    'Region': 'region',
    'Total Score': 'totalScore',
    'Max Score': 'maxScore',
    'Score %': 'scorePercentage',
    'Auditor Signature': 'auditorSignature',
    'SM Signature': 'smSignature',
    'Remarks JSON': 'questionRemarksJSON',
    'Images JSON': 'questionImagesJSON'
  };

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rec = {};

    for (var j = 0; j < headers.length; j++) {
      var key = fieldMap[headers[j]] || toCamelCase(headers[j]);
      var val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
      }
      rec[key] = val !== undefined && val !== null ? String(val) : '';
    }

    var colIdx = 15;
    for (var q = 1; q <= 6; q++) {
      if (colIdx < headers.length) {
        rec['ZeroTolerance_ZT_' + q] = row[colIdx] !== undefined ? String(row[colIdx]) : '';
        colIdx++;
      }
    }
    for (var q = 1; q <= 94; q++) {
      if (colIdx < headers.length) {
        rec['Store_S_' + q] = row[colIdx] !== undefined ? String(row[colIdx]) : '';
        colIdx++;
      }
    }
    for (var q = 1; q <= 3; q++) {
      if (colIdx < headers.length) {
        rec['A_A_' + q] = row[colIdx] !== undefined ? String(row[colIdx]) : '';
        colIdx++;
      }
    }
    for (var q = 1; q <= 11; q++) {
      if (colIdx < headers.length) {
        rec['Maintenance_M_' + q] = row[colIdx] !== undefined ? String(row[colIdx]) : '';
        colIdx++;
      }
    }
    for (var q = 1; q <= 2; q++) {
      if (colIdx < headers.length) {
        rec['HR_HR_' + q] = row[colIdx] !== undefined ? String(row[colIdx]) : '';
        colIdx++;
      }
    }

    records.push(rec);
  }

  Logger.log('getQAData returning ' + records.length + ' records');
  return json(records);
}

function getAMReviews(params) {
  var amId = upper(params.amId);
  var auditorId = upper(params.auditorId);
  var fetchAll = (params.all || '').toLowerCase() === 'true';

  if (!amId && !auditorId && !fetchAll) {
    return json({ success: false, message: 'amId, auditorId, or all=true required' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA AM Review');
  if (!sheet) return json({ success: true, records: [] });

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return json({ success: true, records: [] });

  var headers = data[0];
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowAmId = upper(row[5]);
    var rowAuditorId = upper(row[3]);

    var match = fetchAll;
    if (amId && rowAmId === amId) match = true;
    if (auditorId && rowAuditorId === auditorId) match = true;

    if (match) {
      var rec = {};
      for (var j = 0; j < headers.length; j++) {
        rec[toCamelCase(headers[j])] = row[j] !== undefined ? String(row[j]) : '';
      }
      records.push(rec);
    }
  }

  return json({ success: true, records: records });
}

function getCAPAs(params) {
  var storeId = upper(params.storeId);
  var assigneeId = upper(params.assigneeId);
  var auditorId = upper(params.auditorId);
  var amId = upper(params.amId);
  var fetchAll = (params.all || '').toLowerCase() === 'true';

  if (!storeId && !assigneeId && !auditorId && !amId && !fetchAll) {
    return json({ success: false, message: 'storeId, assigneeId, auditorId, amId, or all=true required' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA CAPA');
  if (!sheet) return json({ success: true, records: [] });

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return json({ success: true, records: [] });

  var headers = data[0];
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowStoreId = upper(row[5]);
    var rowAssigneeIds = upper(row[11]);
    var rowAuditorId = upper(row[3]);
    var rowAmId = upper(row[9]);

    var match = fetchAll;
    if (storeId && rowStoreId === storeId) match = true;
    if (assigneeId && rowAssigneeIds.indexOf(assigneeId) >= 0) match = true;
    if (auditorId && rowAuditorId === auditorId) match = true;
    if (amId && rowAmId === amId) match = true;

    if (match) {
      var rec = {};
      for (var j = 0; j < headers.length; j++) {
        rec[toCamelCase(headers[j])] = row[j] !== undefined ? String(row[j]) : '';
      }
      records.push(rec);
    }
  }

  return json({ success: true, records: records });
}

// ===========================================================================
// QA UPDATE OPERATIONS
// ===========================================================================

function updateAMReview(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA AM Review');
  if (!sheet) return json({ success: false, message: 'QA AM Review sheet not found' });

  var qaSubmissionTime = params.qaSubmissionTime || '';
  var storeId = upper(params.storeId);

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim() === qaSubmissionTime && upper(data[i][7]) === storeId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return json({ success: false, message: 'AM Review not found' });

  if (params.status) sheet.getRange(rowIndex, 13).setValue(params.status);
  if (params.findingsJSON) sheet.getRange(rowIndex, 14).setValue(params.findingsJSON);

  return json({ success: true, message: 'AM Review updated' });
}

function updateCAPA(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA CAPA');
  if (!sheet) return json({ success: false, message: 'QA CAPA sheet not found' });

  var qaSubmissionTime = params.qaSubmissionTime || '';
  var storeId = upper(params.storeId);

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim() === qaSubmissionTime && upper(data[i][5]) === storeId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return json({ success: false, message: 'CAPA not found' });

  if (params.status) sheet.getRange(rowIndex, 15).setValue(params.status);
  if (params.capaSubmittedBy) sheet.getRange(rowIndex, 16).setValue(params.capaSubmittedBy);
  if (params.capaSubmittedById) sheet.getRange(rowIndex, 17).setValue(params.capaSubmittedById);
  if (params.capaSubmissionTime) sheet.getRange(rowIndex, 18).setValue(params.capaSubmissionTime);
  if (params.findingsJSON) sheet.getRange(rowIndex, 19).setValue(params.findingsJSON);

  return json({ success: true, message: 'CAPA updated' });
}

// ===========================================================================
// QA DRAFT MANAGEMENT
// ===========================================================================

function saveDraft(params) {
  var sheet = getOrCreateSheet('QA Drafts', [
    'Draft ID', 'QA ID', 'QA Name', 'Store ID', 'Store Name',
    'Timestamp', 'Completion %', 'Responses JSON',
    'Images JSON', 'Remarks JSON', 'Signatures JSON', 'Meta JSON'
  ]);

  var draftId = params.draftId || Utilities.getUuid();
  var data = sheet.getDataRange().getValues();
  var existingRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      existingRow = i + 1;
      break;
    }
  }

  var rowData = [
    draftId,
    params.qaId || '',
    params.qaName || '',
    params.storeId || '',
    params.storeName || '',
    params.timestamp || now(),
    params.completionPercentage || '0',
    params.responsesJSON || '{}',
    params.questionImagesJSON || '{}',
    params.questionRemarksJSON || '{}',
    params.signaturesJSON || '{}',
    params.metaJSON || '{}'
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return json({ success: true, draftId: draftId });
}

function getDrafts(params) {
  var qaId = (params.qaId || '').toUpperCase().trim();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA Drafts');
  if (!sheet) return json({ success: true, drafts: [] });

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return json({ success: true, drafts: [] });

  var drafts = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowQaId = String(row[1] || '').toUpperCase().trim();
    if (!qaId || rowQaId === qaId) {
      drafts.push({
        id: String(row[0] || ''),
        qaId: String(row[1] || ''),
        qaName: String(row[2] || ''),
        storeId: String(row[3] || ''),
        storeName: String(row[4] || ''),
        timestamp: String(row[5] || ''),
        completionPercentage: Number(row[6]) || 0
      });
    }
  }

  return json({ success: true, drafts: drafts });
}

function loadDraft(params) {
  var draftId = params.draftId || '';
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA Drafts');
  if (!sheet) return json({ success: false, message: 'No drafts sheet' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      return json({
        success: true,
        draft: {
          id: String(data[i][0] || ''),
          qaId: String(data[i][1] || ''),
          qaName: String(data[i][2] || ''),
          storeId: String(data[i][3] || ''),
          storeName: String(data[i][4] || ''),
          timestamp: String(data[i][5] || ''),
          completionPercentage: Number(data[i][6]) || 0,
          responsesJSON: String(data[i][7] || '{}'),
          questionImagesJSON: String(data[i][8] || '{}'),
          questionRemarksJSON: String(data[i][9] || '{}'),
          signaturesJSON: String(data[i][10] || '{}'),
          metaJSON: String(data[i][11] || '{}')
        }
      });
    }
  }

  return json({ success: false, message: 'Draft not found' });
}

function deleteDraft(params) {
  var draftId = params.draftId || '';
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QA Drafts');
  if (!sheet) return json({ success: true });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return json({ success: true });
}

// ===========================================================================
// ===========================================================================
// VENDOR AUDIT FUNCTIONS
// ===========================================================================
// ===========================================================================

// ===========================
// VENDOR AUDIT HEADERS
// ===========================

function vendorAuditHeaders() {
  var headers = [
    'Timestamp',
    'Submission Time',
    'Auditor Name',
    'Auditor ID',
    'Vendor Name',
    'Vendor Location',
    'City',
    'Region',
    'Total Score',
    'Max Score',
    'Score %',
    'Auditor Signature',
    'Vendor Signature'
  ];

  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    headers.push(VA_QUESTION_IDS[i]);
  }
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    headers.push(VA_QUESTION_IDS[i] + '_remark');
  }
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    headers.push(VA_QUESTION_IDS[i] + '_imageCount');
  }
  headers.push('Remarks JSON');
  headers.push('Images JSON');

  return headers;
}

// ===========================
// CREATE VENDOR AUDIT
// ===========================

function createVendorAudit(params) {
  var headers = vendorAuditHeaders();
  var sheet = getOrCreateSheet('Vendor Audits', headers);
  var ts = now();

  var row = buildVendorAuditRow(params, ts);
  sheet.appendRow(row);

  Logger.log('Vendor audit saved for vendor: ' + (params.vendorName || 'Unknown'));
  return json({ success: true, message: 'Vendor audit submitted successfully', timestamp: ts });
}

// ===========================
// UPDATE VENDOR AUDIT
// ===========================

function updateVendorAudit(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audits');
  if (!sheet) return json({ success: false, message: 'Vendor Audits sheet not found' });

  var rowId = (params.rowId || '').trim();
  if (!rowId) return json({ success: false, message: 'rowId is required for update' });

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim() === rowId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return json({ success: false, message: 'Row not found for rowId: ' + rowId });

  var updatedRow = buildVendorAuditRow(params, String(data[rowIndex - 1][0]));
  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

  Logger.log('Updated vendor audit row ' + rowIndex + ' for vendor: ' + (params.vendorName || 'Unknown'));
  return json({ success: true, message: 'Vendor audit updated successfully' });
}

// ===========================
// BUILD VENDOR AUDIT ROW
// ===========================

function buildVendorAuditRow(params, timestamp) {
  var row = [
    timestamp,
    params.submissionTime || '',
    params.auditorName || '',
    params.auditorId || '',
    params.vendorName || '',
    params.vendorLocation || '',
    params.city || '',
    params.region || '',
    params.totalScore || 0,
    params.maxScore || 0,
    params.scorePercentage || 0,
    params.auditorSignature || '',
    params.vendorSignature || ''
  ];

  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    row.push(params[VA_QUESTION_IDS[i]] || '');
  }
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    row.push(params[VA_QUESTION_IDS[i] + '_remark'] || '');
  }
  for (var i = 0; i < VA_QUESTION_IDS.length; i++) {
    row.push(params[VA_QUESTION_IDS[i] + '_imageCount'] || '0');
  }
  row.push(params.questionRemarksJSON || '{}');
  row.push(params.questionImagesJSON || '{}');

  return row;
}

// ===========================
// GET VENDOR AUDIT DATA
// ===========================

function getVendorAuditData(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audits');
  if (!sheet) return json([]);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return json([]);

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var submissions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var submission = {};

    for (var col = 0; col < headers.length; col++) {
      submission[headers[col]] = row[col] !== undefined ? row[col] : '';
    }

    submission.submissionTime = submission['Submission Time'] || '';
    submission.auditorName = submission['Auditor Name'] || '';
    submission.auditorId = submission['Auditor ID'] || '';
    submission.vendorName = submission['Vendor Name'] || '';
    submission.vendorLocation = submission['Vendor Location'] || '';
    submission.city = submission['City'] || '';
    submission.region = submission['Region'] || '';
    submission.totalScore = Number(submission['Total Score']) || 0;
    submission.maxScore = Number(submission['Max Score']) || 0;
    submission.scorePercentage = Number(submission['Score %']) || 0;

    var responses = {};
    for (var q = 0; q < VA_QUESTION_IDS.length; q++) {
      var qId = VA_QUESTION_IDS[q];
      if (submission[qId]) {
        responses[qId] = String(submission[qId]);
      }
    }
    submission.responses = responses;

    try {
      submission.questionRemarks = JSON.parse(submission['Remarks JSON'] || '{}');
    } catch (e) {
      submission.questionRemarks = {};
    }

    try {
      submission.questionImages = JSON.parse(submission['Images JSON'] || '{}');
    } catch (e) {
      submission.questionImages = {};
    }

    submission.sectionScores = computeVendorAuditSectionScores(responses);
    submissions.push(submission);
  }

  var auditorId = (params.auditorId || '').trim();
  if (auditorId) {
    submissions = submissions.filter(function(s) {
      return String(s.auditorId || '').trim().toUpperCase() === auditorId.toUpperCase();
    });
  }

  return json(submissions);
}

// ===========================
// COMPUTE VENDOR AUDIT SECTION SCORES
// ===========================

function computeVendorAuditSectionScores(responses) {
  var sections = {
    'VA_ZeroTolerance': { ids: ['VZT_1','VZT_2','VZT_3'], maxPerQ: 2, isZT: true },
    'VA_DesignFacilities': { ids: [], maxPerQ: 2, isZT: false },
    'VA_ControlOfOperation': { ids: [], maxPerQ: 2, isZT: false },
    'VA_CleaningSanitation': { ids: [], maxPerQ: 2, isZT: false },
    'VA_PestControl': { ids: [], maxPerQ: 2, isZT: false },
    'VA_PersonalHygiene': { ids: [], maxPerQ: 2, isZT: false },
    'VA_Maintenance': { ids: [], maxPerQ: 2, isZT: false },
    'VA_Documentation': { ids: [], maxPerQ: 2, isZT: false },
    'VA_GeneralSafety': { ids: [], maxPerQ: 2, isZT: false }
  };

  for (var i = 1; i <= 16; i++) sections['VA_DesignFacilities'].ids.push('VDF_' + i);
  for (var i = 1; i <= 22; i++) sections['VA_ControlOfOperation'].ids.push('VCO_' + i);
  for (var i = 1; i <= 5; i++) sections['VA_CleaningSanitation'].ids.push('VCS_' + i);
  for (var i = 1; i <= 2; i++) sections['VA_PestControl'].ids.push('VPC_' + i);
  for (var i = 1; i <= 4; i++) sections['VA_PersonalHygiene'].ids.push('VPH_' + i);
  for (var i = 1; i <= 2; i++) sections['VA_Maintenance'].ids.push('VM_' + i);
  for (var i = 1; i <= 5; i++) sections['VA_Documentation'].ids.push('VD_' + i);
  for (var i = 1; i <= 4; i++) sections['VA_GeneralSafety'].ids.push('VGS_' + i);

  var result = {};

  for (var sectionId in sections) {
    var sec = sections[sectionId];
    var total = 0;
    var maxPossible = 0;

    for (var j = 0; j < sec.ids.length; j++) {
      var key = sectionId + '_' + sec.ids[j];
      var answer = responses[key] || '';

      if (answer === 'na') continue;
      maxPossible += sec.maxPerQ;

      if (sec.isZT) {
        if (answer === 'compliant') total += sec.maxPerQ;
      } else {
        if (answer === 'compliant') total += sec.maxPerQ;
        else if (answer === 'partially-compliant') total += Math.floor(sec.maxPerQ / 2);
      }
    }

    result[sectionId] = {
      score: total,
      maxScore: maxPossible,
      percentage: maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0
    };
  }

  return result;
}

// ===========================
// VENDOR AUDIT DRAFT MANAGEMENT
// ===========================

function vendorAuditDraftHeaders() {
  return [
    'Draft ID',
    'Auditor ID',
    'Auditor Name',
    'Vendor Name',
    'Vendor Location',
    'City',
    'Timestamp',
    'Completion %',
    'Responses JSON',
    'Images JSON',
    'Remarks JSON',
    'Signatures JSON',
    'Meta JSON'
  ];
}

function saveVendorAuditDraft(params) {
  var headers = vendorAuditDraftHeaders();
  var sheet = getOrCreateSheet('Vendor Audit Drafts', headers);

  var draftId = params.draftId || Utilities.getUuid();
  var data = sheet.getDataRange().getValues();
  var existingRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      existingRow = i + 1;
      break;
    }
  }

  var rowData = [
    draftId,
    params.auditorId || '',
    params.auditorName || '',
    params.vendorName || '',
    params.vendorLocation || '',
    params.city || '',
    params.timestamp || now(),
    params.completionPercentage || '0',
    params.responsesJSON || '{}',
    params.questionImagesJSON || '{}',
    params.questionRemarksJSON || '{}',
    params.signaturesJSON || '{}',
    params.metaJSON || '{}'
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  Logger.log('Vendor audit draft saved: ' + draftId);
  return json({ success: true, draftId: draftId, message: 'Draft saved successfully' });
}

function getVendorAuditDrafts(params) {
  var auditorId = (params.auditorId || '').toUpperCase().trim();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audit Drafts');
  if (!sheet) return json({ success: true, drafts: [] });

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return json({ success: true, drafts: [] });

  var drafts = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowAuditorId = String(row[1] || '').toUpperCase().trim();

    if (!auditorId || rowAuditorId === auditorId) {
      drafts.push({
        id: String(row[0] || ''),
        auditorId: String(row[1] || ''),
        auditorName: String(row[2] || ''),
        vendorName: String(row[3] || ''),
        vendorLocation: String(row[4] || ''),
        city: String(row[5] || ''),
        timestamp: String(row[6] || ''),
        completionPercentage: Number(row[7]) || 0
      });
    }
  }

  return json({ success: true, drafts: drafts });
}

function loadVendorAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return json({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audit Drafts');
  if (!sheet) return json({ success: false, message: 'No drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      var responses = {};
      var questionImages = {};
      var questionRemarks = {};
      var signatures = { auditor: '', vendor: '' };
      var meta = {};

      try { responses = JSON.parse(String(data[i][8] || '{}')); } catch (e) {}
      try { questionImages = JSON.parse(String(data[i][9] || '{}')); } catch (e) {}
      try { questionRemarks = JSON.parse(String(data[i][10] || '{}')); } catch (e) {}
      try { signatures = JSON.parse(String(data[i][11] || '{"auditor":"","vendor":""}')); } catch (e) {}
      try { meta = JSON.parse(String(data[i][12] || '{}')); } catch (e) {}

      return json({
        success: true,
        data: {
          draft: {
            id: String(data[i][0] || ''),
            auditorId: String(data[i][1] || ''),
            auditorName: String(data[i][2] || ''),
            vendorName: String(data[i][3] || ''),
            timestamp: String(data[i][6] || ''),
            completionPercentage: Number(data[i][7]) || 0,
            responses: responses,
            questionImages: questionImages,
            questionRemarks: questionRemarks,
            signatures: signatures,
            meta: meta
          }
        }
      });
    }
  }

  return json({ success: false, message: 'Draft not found' });
}

function deleteVendorAuditDraft(params) {
  var draftId = (params.draftId || '').trim();
  if (!draftId) return json({ success: false, message: 'draftId is required' });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor Audit Drafts');
  if (!sheet) return json({ success: false, message: 'No drafts sheet found' });

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === draftId) {
      sheet.deleteRow(i + 1);
      Logger.log('Vendor audit draft deleted: ' + draftId);
      return json({ success: true, message: 'Draft deleted successfully' });
    }
  }

  return json({ success: false, message: 'Draft not found' });
}

// ===========================================================================
// SHARED UTILITY FUNCTIONS
// ===========================================================================

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    Logger.log('Created sheet: ' + name);
  }

  return sheet;
}

function qaHeaders() {
  return [
    'Timestamp', 'Submission Time', 'QA Auditor Name', 'QA Auditor ID',
    'AM Name', 'AM ID', 'Store Name', 'Store ID', 'City', 'Region',
    'Total Score', 'Max Score', 'Score %', 'Auditor Signature', 'SM Signature',
    'ZT_1', 'ZT_2', 'ZT_3', 'ZT_4', 'ZT_5', 'ZT_6',
    'S_1','S_2','S_3','S_4','S_5','S_6','S_7','S_8','S_9','S_10',
    'S_11','S_12','S_13','S_14','S_15','S_16','S_17','S_18','S_19','S_20',
    'S_21','S_22','S_23','S_24','S_25','S_26','S_27','S_28','S_29','S_30',
    'S_31','S_32','S_33','S_34','S_35','S_36','S_37','S_38','S_39','S_40',
    'S_41','S_42','S_43','S_44','S_45','S_46','S_47','S_48','S_49','S_50',
    'S_51','S_52','S_53','S_54','S_55','S_56','S_57','S_58','S_59','S_60',
    'S_61','S_62','S_63','S_64','S_65','S_66','S_67','S_68','S_69','S_70',
    'S_71','S_72','S_73','S_74','S_75','S_76','S_77','S_78','S_79','S_80',
    'S_81','S_82','S_83','S_84','S_85','S_86','S_87','S_88','S_89','S_90',
    'S_91','S_92','S_93','S_94',
    'A_1', 'A_2', 'A_3',
    'M_1','M_2','M_3','M_4','M_5','M_6','M_7','M_8','M_9','M_10','M_11',
    'HR_1', 'HR_2',
    'Remarks JSON', 'Images JSON'
  ];
}

function indexOf(arr, val) {
  val = String(val).toLowerCase();
  for (var i = 0; i < arr.length; i++) {
    if (String(arr[i]).toLowerCase() === val) return i;
  }
  return -1;
}

function findCol(headers, possibleNames) {
  for (var n = 0; n < possibleNames.length; n++) {
    var idx = indexOf(headers, possibleNames[n]);
    if (idx >= 0) return idx;
  }
  return -1;
}

function toCamelCase(header) {
  return String(header || '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map(function(word, index) {
      word = word.toLowerCase();
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

function upper(val) {
  return String(val || '').toUpperCase().trim();
}

function now() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
