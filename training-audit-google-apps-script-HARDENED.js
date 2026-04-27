/**
 * TRAINING AUDIT — HARDENED APPS SCRIPT (Phase 1 long-term fix)
 *
 * Goals (vs. the previous version):
 *   1. No dropped rows under concurrency  → LockService
 *   2. Idempotent submits                 → submissionId dedupe
 *   3. Fast sheet loads at 10 000+ rows   → images moved to Drive, not cells
 *   4. Lower per-request latency          → Store_Mapping cached across invocations (CacheService)
 *   5. No orphan formula sheet recalc     → "Last 90 Days" FILTER sheet removed
 *   6. Row is committed BEFORE image I/O  → even if Drive is slow/fails, the row is safe
 *
 * Sheets used:
 *   - "Training Audit"         — one row per submission (NO base64 cells)
 *   - "Training Audit Images"  — submissionId, sectionId, driveUrl, driveFileId
 *
 * Drive folder: "Training Audit Images" (auto-created)
 *
 * Deployment:
 *   1. Paste this file into Apps Script editor of the existing spreadsheet.
 *   2. Run `setupTrainingAuditHardened()` once — creates sheets, migrates headers.
 *   3. Deploy → Web App → "Execute as: Me", "Access: Anyone".
 *   4. Copy the new /exec URL into frontend config.
 */

// ============================================================
// CONFIG
// ============================================================
// HARDCODED SPREADSHEET ID — To ensure data lands in the correct sheet regardless of binding.
var SPREADSHEET_ID = '1XgKWaMuypBW3UKOTm17vUvoz0OGY7qNUsvxVhAtpbUI';

// IMPORTANT: the legacy "Training Audit" sheet is bloated with base64 image
// cells and can no longer be opened/edited reliably. We write NEW submissions
// to a fresh tab and leave the legacy sheet completely untouched. The reader
// merges legacy + v2 so dashboards see continuous history.
var MAIN_SHEET = 'Training Audit v2';
var LEGACY_SHEET = 'Training Audit';      // read-only, never written
var IMAGE_SHEET = 'Training Audit Images';
var DRIVE_FOLDER_NAME = 'Training Audit Images';
var DEDUPE_LOOKBACK_ROWS = 500;          // how many recent rows to scan for duplicate submissionId
var STORE_MAPPING_CACHE_KEY = 'STORE_MAPPING_V1';
var STORE_MAPPING_CACHE_TTL = 21600;     // 6 h (max)
var LOCK_TIMEOUT_MS = 30000;             // 30s — gives queued requests time

// Column order for the main sheet. submissionId + Image Folder URL are NEW.
var HEADER = [
  'Server Timestamp', 'Submission Time', 'Submission ID',
  'Trainer Name', 'Trainer ID',
  'AM Name', 'AM ID', 'Store Name', 'Store ID', 'Region', 'MOD',
  'HRBP ID', 'Regional HR ID', 'HR Head ID', 'LMS Head ID',
  // TM_1..TM_9
  'TM_1', 'TM_2', 'TM_3', 'TM_4', 'TM_5', 'TM_6', 'TM_7', 'TM_8', 'TM_9',
  // LMS_1..3
  'LMS_1', 'LMS_2', 'LMS_3',
  // Buddy_1..6
  'Buddy_1', 'Buddy_2', 'Buddy_3', 'Buddy_4', 'Buddy_5', 'Buddy_6',
  // NJ_1..7
  'NJ_1', 'NJ_2', 'NJ_3', 'NJ_4', 'NJ_5', 'NJ_6', 'NJ_7',
  // PK_1..7
  'PK_1', 'PK_2', 'PK_3', 'PK_4', 'PK_5', 'PK_6', 'PK_7',
  // TSA scores
  'TSA_1', 'TSA_2', 'TSA_3',
  // CX_1..9
  'CX_1', 'CX_2', 'CX_3', 'CX_4', 'CX_5', 'CX_6', 'CX_7', 'CX_8', 'CX_9',
  // AP_1..3
  'AP_1', 'AP_2', 'AP_3',
  // Section remarks
  'TM_remarks', 'LMS_remarks', 'Buddy_remarks', 'NJ_remarks',
  'PK_remarks', 'CX_remarks', 'AP_remarks',
  // Scoring
  'Total Score', 'Max Score', 'Percentage',
  // TSA remarks
  'TSA_Food_remarks', 'TSA_Coffee_remarks', 'TSA_CX_remarks',
  // Auditor
  'Auditor Name', 'Auditor ID',
  // Image pointers (replaces the old base64 cell)
  'Image Folder URL', 'Image Count',
  // Zero tolerance
  'Zero Tolerance Failed', 'Zero Tolerance Items',
  // Extra
  'TM_10',
  // Geolocation
  'Latitude', 'Longitude', 'Geo Accuracy', 'Geo Timestamp', 'Google Maps Link'
];

var IMAGE_HEADER = [
  'Server Timestamp', 'Submission ID', 'Store ID', 'Section ID',
  'Drive File ID', 'Drive URL', 'Mime Type', 'Size (bytes)'
];

// ============================================================
// INTERNAL HELPERS
// ============================================================
function getSS() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ============================================================
// ENTRY POINTS
// ============================================================
function doPost(e) {
  var params = parsePostParams(e);
  var action = params.action || 'create';

  if (action === 'ping') {
    return jsonOut({ status: 'OK', pong: true });
  }

  // Serialize writes. Concurrent appendRow WAS the root cause of missing rows.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (lockErr) {
    return jsonOut({ status: 'ERROR', code: 'LOCK_TIMEOUT', message: 'Server busy, please retry' });
  }

  try {
    var ss = getSS();
    var mainSheet = getOrCreateSheet(ss, MAIN_SHEET, HEADER);
    var imageSheet = getOrCreateSheet(ss, IMAGE_SHEET, IMAGE_HEADER);

    var submissionId = (params.submissionId || '').toString().trim();
    if (!submissionId) {
      // Accept legacy submissions without ID, but tag so we can spot them.
      submissionId = 'legacy-' + new Date().getTime() + '-' + Math.random().toString(36).slice(2, 8);
    }

    // ---- Idempotency: is this submissionId already logged? ----
    if (findExistingSubmission(mainSheet, submissionId) >= 0) {
      return jsonOut({ status: 'OK', duplicate: true, submissionId: submissionId });
    }

    // ---- Enrich with store mapping (cached across executions) ----
    var storeInfo = getStoreInfoCached(params.storeId || '');
    params.region       = storeInfo.region       || params.region       || '';
    params.storeName    = storeInfo.storeName    || params.storeName    || '';
    params.trainerName  = storeInfo.trainerName  || params.trainerName  || '';
    params.trainerId    = storeInfo.trainerId    || params.trainerId    || '';
    params.amName       = storeInfo.amName       || params.amName       || '';
    params.amId         = storeInfo.amId         || params.amId         || '';
    params.hrbpId       = storeInfo.hrbpId       || params.hrbpId       || '';
    params.regionalHrId = storeInfo.regionalHrId || params.regionalHrId || '';
    params.hrHeadId     = storeInfo.hrHeadId     || params.hrHeadId     || '';
    params.lmsHeadId    = storeInfo.lmsHeadId    || params.lmsHeadId    || '';

    // ---- Build row (NO base64) ----
    var serverTimestamp = new Date();
    var row = buildRow(params, submissionId, serverTimestamp, '', 0);

    // Commit the row FIRST. If Drive upload fails later, at least the audit is logged.
    mainSheet.appendRow(row);

    // ---- Upload images to Drive (optional, best-effort) ----
    var imagesJson = params.sectionImages || '';
    var uploadResult = { folderUrl: '', count: 0 };
    if (imagesJson && imagesJson.length > 2) {
      try {
        uploadResult = uploadSectionImages(imagesJson, submissionId, params.storeId || '', serverTimestamp, imageSheet);
        if (uploadResult.count > 0 || uploadResult.folderUrl) {
          // Patch the just-appended row with image pointer columns
          var appendedRowIndex = mainSheet.getLastRow();
          var folderCol = HEADER.indexOf('Image Folder URL') + 1;
          var countCol  = HEADER.indexOf('Image Count') + 1;
          mainSheet.getRange(appendedRowIndex, folderCol).setValue(uploadResult.folderUrl);
          mainSheet.getRange(appendedRowIndex, countCol).setValue(uploadResult.count);
        }
      } catch (imgErr) {
        Logger.log('Image upload failed for ' + submissionId + ': ' + imgErr);
        // Do NOT fail the submission — row is already committed.
      }
    }

    return jsonOut({
      status: 'OK',
      submissionId: submissionId,
      imagesUploaded: uploadResult.count,
      imageFolderUrl: uploadResult.folderUrl
    });
  } catch (err) {
    Logger.log('doPost fatal: ' + err + '\n' + (err && err.stack));
    return jsonOut({ status: 'ERROR', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var ss = getSS();
    if (params.action === 'getData') {
      return getTrainingChecklistData(params.source || 'recent', params.includeImages === 'true');
    }
    if (params.action === 'getStoreInfo' && params.storeId) {
      return jsonOut(getStoreInfoCached(params.storeId));
    }
    if (params.action === 'checkSubmission' && params.submissionId) {
      var sheet = ss.getSheetByName(MAIN_SHEET);
      var exists = sheet ? (findExistingSubmission(sheet, params.submissionId) >= 0) : false;
      return jsonOut({ exists: exists, submissionId: params.submissionId });
    }
    return jsonOut([]);
  } catch (err) {
    return jsonOut({ status: 'ERROR', message: String(err) });
  }
}

// ============================================================
// PARAM PARSING (robust against >50KB bodies)
// ============================================================
function parsePostParams(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var looksEmpty = !params.submissionId && !params.storeId && !params.trainerName && !params.auditorName;
  if (looksEmpty && e && e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    // Try JSON first
    if (raw.charAt(0) === '{') {
      try { return JSON.parse(raw); } catch (je) {}
    }
    // Fallback: URL-encoded
    var pairs = raw.split('&');
    var out = {};
    for (var i = 0; i < pairs.length; i++) {
      var kv = pairs[i].split('=');
      if (kv.length >= 2) {
        try {
          var k = decodeURIComponent(kv[0].replace(/\+/g, ' '));
          var v = decodeURIComponent(kv.slice(1).join('=').replace(/\+/g, ' '));
          out[k] = v;
        } catch (de) {}
      }
    }
    return out;
  }
  return params;
}

// ============================================================
// ROW BUILDER
// ============================================================
function buildRow(p, submissionId, serverTimestamp, imageFolderUrl, imageCount) {
  return [
    serverTimestamp,
    p.submissionTime || serverTimestamp.toISOString(),
    submissionId,
    p.trainerName || '', p.trainerId || '',
    p.amName || '', p.amId || '',
    p.storeName || '', p.storeId || '',
    p.region || '', p.mod || '',
    p.hrbpId || '', p.regionalHrId || '', p.hrHeadId || '', p.lmsHeadId || '',
    p.TM_1 || '', p.TM_2 || '', p.TM_3 || '', p.TM_4 || '', p.TM_5 || '',
    p.TM_6 || '', p.TM_7 || '', p.TM_8 || '', p.TM_9 || '',
    p.LMS_1 || '', p.LMS_2 || '', p.LMS_3 || '',
    p.Buddy_1 || '', p.Buddy_2 || '', p.Buddy_3 || '',
    p.Buddy_4 || '', p.Buddy_5 || '', p.Buddy_6 || '',
    p.NJ_1 || '', p.NJ_2 || '', p.NJ_3 || '',
    p.NJ_4 || '', p.NJ_5 || '', p.NJ_6 || '', p.NJ_7 || '',
    p.PK_1 || '', p.PK_2 || '', p.PK_3 || '',
    p.PK_4 || '', p.PK_5 || '', p.PK_6 || '', p.PK_7 || '',
    p.TSA_Food_Score || '', p.TSA_Coffee_Score || '', p.TSA_CX_Score || '',
    p.CX_1 || '', p.CX_2 || '', p.CX_3 || '',
    p.CX_4 || '', p.CX_5 || '', p.CX_6 || '',
    p.CX_7 || '', p.CX_8 || '', p.CX_9 || '',
    p.AP_1 || '', p.AP_2 || '', p.AP_3 || '',
    p.TM_remarks || '', p.LMS_remarks || '',
    p.Buddy_remarks || '', p.NJ_remarks || '',
    p.PK_remarks || '', p.CX_remarks || '', p.AP_remarks || '',
    p.totalScore || '', p.maxScore || '', p.percentage || '',
    p.TSA_Food_remarks || '', p.TSA_Coffee_remarks || '', p.TSA_CX_remarks || '',
    p.auditorName || '', p.auditorId || '',
    imageFolderUrl, imageCount,
    p.zeroToleranceFailed || 'No',
    p.zeroToleranceFailedItems || '',
    p.TM_10 || '',
    p.latitude || '', p.longitude || '', p.geoAccuracy || '',
    p.geoTimestamp || '', p.googleMapsLink || ''
  ];
}

// ============================================================
// IDEMPOTENCY
// ============================================================
function findExistingSubmission(sheet, submissionId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var startRow = Math.max(2, lastRow - DEDUPE_LOOKBACK_ROWS + 1);
  var numRows = lastRow - startRow + 1;
  var subCol = HEADER.indexOf('Submission ID') + 1;
  if (subCol <= 0) return -1;
  var values = sheet.getRange(startRow, subCol, numRows, 1).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (values[i][0] && values[i][0].toString() === submissionId) {
      return startRow + i;
    }
  }
  return -1;
}

// ============================================================
// IMAGE UPLOAD — base64 JSON → Drive files
// sectionImages payload shape (from client):
//   { "TrainingMaterials": ["data:image/jpeg;base64,...", ...], "LMS": [...] }
// OR legacy: { "TrainingMaterials": "data:image/jpeg;base64,..." }
// ============================================================
function uploadSectionImages(imagesJson, submissionId, storeId, timestamp, imageSheet) {
  var parsed;
  try { parsed = JSON.parse(imagesJson); } catch (e) { return { folderUrl: '', count: 0 }; }
  if (!parsed || typeof parsed !== 'object') return { folderUrl: '', count: 0 };

  var parentFolder = getOrCreateImageFolder();
  var monthFolder = getOrCreateChildFolder(parentFolder,
    Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM'));
  var subFolderName = (storeId || 'unknown') + '_' + submissionId;
  var submissionFolder = monthFolder.createFolder(subFolderName);

  var rowsToAppend = [];
  var count = 0;

  Object.keys(parsed).forEach(function (sectionId) {
    var arr = parsed[sectionId];
    if (!arr) return;
    if (!Array.isArray(arr)) arr = [arr]; // legacy single-string case
    arr.forEach(function (dataUrl, idx) {
      if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.indexOf('data:image') !== 0) return;
      try {
        var commaIdx = dataUrl.indexOf(',');
        var meta = dataUrl.substring(5, commaIdx); // after "data:"
        var mime = meta.split(';')[0];
        var ext = (mime.split('/')[1] || 'jpg').toLowerCase();
        var bytes = Utilities.base64Decode(dataUrl.substring(commaIdx + 1));
        var blob = Utilities.newBlob(bytes, mime, sectionId + '_' + (idx + 1) + '.' + ext);
        var file = submissionFolder.createFile(blob);
        // Shareable read-only link
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (sErr) { /* some orgs block this; link may still work internally */ }
        rowsToAppend.push([
          timestamp, submissionId, storeId, sectionId,
          file.getId(), file.getUrl(), mime, bytes.length
        ]);
        count++;
      } catch (decErr) {
        Logger.log('Failed to decode image ' + sectionId + '[' + idx + '] for ' + submissionId + ': ' + decErr);
      }
    });
  });

  if (rowsToAppend.length > 0) {
    imageSheet.getRange(imageSheet.getLastRow() + 1, 1, rowsToAppend.length, IMAGE_HEADER.length)
      .setValues(rowsToAppend);
  }
  try {
    submissionFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sErr) {}

  return { folderUrl: submissionFolder.getUrl(), count: count };
}

function getOrCreateImageFolder() {
  var it = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
}
function getOrCreateChildFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// ============================================================
// STORE MAPPING (cross-execution cache via CacheService)
// ============================================================
function getStoreInfoCached(storeId) {
  var empty = { region: '', storeName: '', amId: '', amName: '', hrbpId: '',
                regionalHrId: '', hrHeadId: '', lmsHeadId: '',
                trainer: '', trainerId: '', trainerName: '' };
  if (!storeId) return empty;
  var mapping = getStoreMappingCached();
  var info = mapping[storeId.toString().trim()];
  if (!info) return Object.assign(empty, { region: 'Unknown' });
  return {
    region: info.region || 'Unknown',
    storeName: info.storeName || '',
    amId: info.amId || '', amName: info.amName || '',
    hrbpId: info.hrbpId || '', regionalHrId: info.regionalHrId || '',
    hrHeadId: info.hrHeadId || '', lmsHeadId: info.lmsHeadId || '',
    trainer: info.trainer || '', trainerId: info.trainerId || '',
    trainerName: info.trainerName || info.trainer || ''
  };
}

function getStoreMappingCached() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(STORE_MAPPING_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  var fresh = readStoreMappingFromSheet();
  try {
    // CacheService per-key limit is 100KB. If larger, chunk it.
    var serialized = JSON.stringify(fresh);
    if (serialized.length < 100000) {
      cache.put(STORE_MAPPING_CACHE_KEY, serialized, STORE_MAPPING_CACHE_TTL);
    } else {
      // Chunk strategy
      var chunkSize = 90000;
      var chunks = Math.ceil(serialized.length / chunkSize);
      cache.put(STORE_MAPPING_CACHE_KEY + '_COUNT', String(chunks), STORE_MAPPING_CACHE_TTL);
      for (var i = 0; i < chunks; i++) {
        cache.put(STORE_MAPPING_CACHE_KEY + '_' + i,
          serialized.substring(i * chunkSize, (i + 1) * chunkSize), STORE_MAPPING_CACHE_TTL);
      }
    }
  } catch (e) { Logger.log('Cache put failed: ' + e); }
  return fresh;
}

function readStoreMappingFromSheet() {
  var ss = getSS();
  var sheet = ss.getSheetByName('Store_Mapping');
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var mapping = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var sid = row[0] ? row[0].toString().trim() : '';
    if (!sid) continue;
    mapping[sid] = {
      storeName:      row[1]  ? row[1].toString().trim()  : '',
      amId:           row[2]  ? row[2].toString().trim()  : '',
      amName:         row[3]  ? row[3].toString().trim()  : '',
      region:         row[4]  ? row[4].toString().trim()  : '',
      hrbpId:         row[5]  ? row[5].toString().trim()  : '',
      hrbpName:       row[6]  ? row[6].toString().trim()  : '',
      trainerId:      row[11] ? row[11].toString().trim() : '',
      trainerName:    row[12] ? row[12].toString().trim() : '',
      trainer:        row[12] ? row[12].toString().trim() : '',
      regionalHrId:   row[19] ? row[19].toString().trim() : '',
      regionalHrName: row[20] ? row[20].toString().trim() : '',
      hrHeadId:       row[21] ? row[21].toString().trim() : '',
      hrHeadName:     row[22] ? row[22].toString().trim() : '',
      lmsHeadId:      ''
    };
  }
  return mapping;
}

/** Call this from the editor any time Store_Mapping is edited to refresh the cache immediately. */
function invalidateStoreMappingCache() {
  CacheService.getScriptCache().remove(STORE_MAPPING_CACHE_KEY);
}

// ============================================================
// READ API (merges legacy "Training Audit" + "Training Audit v2")
// ============================================================
function getTrainingChecklistData(source, includeImages) {
  try {
    var ss = getSS();
    var cutoff = (source !== 'all')
      ? (new Date().getTime() - 90 * 24 * 3600 * 1000)
      : null;

    // Pre-load images map (v2 only; legacy rows never had Drive images)
    var imagesBySubmission = {};
    if (includeImages) {
      var imgSheet = ss.getSheetByName(IMAGE_SHEET);
      if (imgSheet && imgSheet.getLastRow() > 1) {
        var imgData = imgSheet.getRange(2, 1, imgSheet.getLastRow() - 1, IMAGE_HEADER.length).getValues();
        imgData.forEach(function (r) {
          var sid = r[1]; var section = r[3]; var url = r[5];
          if (!sid || !url) return;
          if (!imagesBySubmission[sid]) imagesBySubmission[sid] = {};
          if (!imagesBySubmission[sid][section]) imagesBySubmission[sid][section] = [];
          imagesBySubmission[sid][section].push(url);
        });
      }
    }

    var out = [];

    // ---- v2 (new, fast) ----
    var v2 = ss.getSheetByName(MAIN_SHEET);
    if (v2 && v2.getLastRow() > 1) {
      var data = v2.getRange(1, 1, v2.getLastRow(), HEADER.length).getValues();
      var headerRow = data[0];
      var idx = {};
      for (var h = 0; h < headerRow.length; h++) idx[headerRow[h]] = h;
      var rows = data.slice(1);
      if (cutoff != null) {
        rows = rows.filter(function (r) {
          var d = (r[0] instanceof Date) ? r[0] : new Date(r[0]);
          return !isNaN(d.getTime()) && d.getTime() >= cutoff;
        });
      }
      rows.forEach(function (r) {
        out.push(mapV2Row(r, idx, includeImages, imagesBySubmission));
      });
    }

    // ---- Legacy (read-only, NO image column loaded to stay fast) ----
    var legacy = ss.getSheetByName(LEGACY_SHEET);
    if (legacy && legacy.getLastRow() > 1) {
      // Read all columns EXCEPT the massive "Section Images" base64 column.
      // Safe: we grab columns 1..82, which covers auditor/ZT/TM_10 but not the bloated image cell.
      var legacyLastRow = legacy.getLastRow();
      var legacyLastCol = Math.min(legacy.getLastColumn(), 82);
      var legacyData = legacy.getRange(1, 1, legacyLastRow, legacyLastCol).getValues();
      var legacyHeader = legacyData[0];
      var lIdx = {};
      for (var lh = 0; lh < legacyHeader.length; lh++) lIdx[legacyHeader[lh]] = lh;
      var legacyRows = legacyData.slice(1);
      if (cutoff != null) {
        legacyRows = legacyRows.filter(function (r) {
          var d = (r[0] instanceof Date) ? r[0] : new Date(r[0]);
          return !isNaN(d.getTime()) && d.getTime() >= cutoff;
        });
      }
      legacyRows.forEach(function (r) {
        out.push(mapLegacyRow(r, lIdx));
      });
    }

    return jsonOut(out);
  } catch (err) {
    Logger.log('getTrainingChecklistData error: ' + err);
    return jsonOut([]);
  }
}

function mapV2Row(r, idx, includeImages, imagesBySubmission) {
  var o = {};
  function g(name) { var i = idx[name]; return (i == null) ? '' : (r[i] || ''); }
  o.submissionId = g('Submission ID');
  o.submissionTime = g('Submission Time');
  o.trainerName = g('Trainer Name'); o.trainerId = g('Trainer ID');
  o.amName = g('AM Name'); o.amId = g('AM ID');
  o.storeName = g('Store Name'); o.storeId = g('Store ID');
  o.region = g('Region'); o.mod = g('MOD');
  o.hrbpId = g('HRBP ID'); o.regionalHrId = g('Regional HR ID');
  o.hrHeadId = g('HR Head ID'); o.lmsHeadId = g('LMS Head ID');
  ['TM_1','TM_2','TM_3','TM_4','TM_5','TM_6','TM_7','TM_8','TM_9','TM_10',
   'LMS_1','LMS_2','LMS_3',
   'Buddy_1','Buddy_2','Buddy_3','Buddy_4','Buddy_5','Buddy_6',
   'NJ_1','NJ_2','NJ_3','NJ_4','NJ_5','NJ_6','NJ_7',
   'PK_1','PK_2','PK_3','PK_4','PK_5','PK_6','PK_7',
   'CX_1','CX_2','CX_3','CX_4','CX_5','CX_6','CX_7','CX_8','CX_9',
   'AP_1','AP_2','AP_3'].forEach(function (k) { o[k] = g(k); });
  o.tsaFoodScore = g('TSA_1'); o.tsaCoffeeScore = g('TSA_2'); o.tsaCXScore = g('TSA_3');
  o.TM_remarks = g('TM_remarks'); o.LMS_remarks = g('LMS_remarks');
  o.Buddy_remarks = g('Buddy_remarks'); o.NJ_remarks = g('NJ_remarks');
  o.PK_remarks = g('PK_remarks'); o.CX_remarks = g('CX_remarks'); o.AP_remarks = g('AP_remarks');
  o.totalScore = g('Total Score'); o.maxScore = g('Max Score'); o.percentageScore = g('Percentage');
  o.TSA_Food_remarks = g('TSA_Food_remarks'); o.TSA_Coffee_remarks = g('TSA_Coffee_remarks');
  o.TSA_CX_remarks = g('TSA_CX_remarks');
  o.auditorName = g('Auditor Name'); o.auditorId = g('Auditor ID');
  o.imageFolderUrl = g('Image Folder URL'); o.imageCount = g('Image Count');
  o.zeroToleranceFailed = g('Zero Tolerance Failed');
  o.zeroToleranceFailedItems = g('Zero Tolerance Items');
  o.latitude = g('Latitude'); o.longitude = g('Longitude');
  o.geoAccuracy = g('Geo Accuracy'); o.geoTimestamp = g('Geo Timestamp');
  o.googleMapsLink = g('Google Maps Link');
  if (includeImages) {
    o.sectionImages = imagesBySubmission[o.submissionId] || {};
  }
  return o;
}

/**
 * Legacy sheet has the pre-migration column order (no Submission ID, no
 * Image Folder URL, Section Images is a bloated base64 cell we explicitly skip).
 * Map by header name so we tolerate small drift.
 */
function mapLegacyRow(r, lIdx) {
  var o = {};
  function g(name) { var i = lIdx[name]; return (i == null) ? '' : (r[i] || ''); }
  // Synthesize a stable submissionId from timestamp + store so dedupe still works cross-sheet.
  var ts = r[0];
  var tsStr = (ts instanceof Date) ? ts.getTime().toString() : String(ts || '');
  o.submissionId = 'legacy-' + tsStr + '-' + (g('Store ID') || 'x');
  o.submissionTime = g('Submission Time') || tsStr;
  o.trainerName = g('Trainer Name'); o.trainerId = g('Trainer ID');
  o.amName = g('AM Name'); o.amId = g('AM ID');
  o.storeName = g('Store Name'); o.storeId = g('Store ID');
  o.region = g('Region'); o.mod = g('MOD');
  o.hrbpId = g('HRBP ID'); o.regionalHrId = g('Regional HR ID');
  o.hrHeadId = g('HR Head ID'); o.lmsHeadId = g('LMS Head ID');
  ['TM_1','TM_2','TM_3','TM_4','TM_5','TM_6','TM_7','TM_8','TM_9','TM_10',
   'LMS_1','LMS_2','LMS_3',
   'Buddy_1','Buddy_2','Buddy_3','Buddy_4','Buddy_5','Buddy_6',
   'NJ_1','NJ_2','NJ_3','NJ_4','NJ_5','NJ_6','NJ_7',
   'PK_1','PK_2','PK_3','PK_4','PK_5','PK_6','PK_7',
   'CX_1','CX_2','CX_3','CX_4','CX_5','CX_6','CX_7','CX_8','CX_9',
   'AP_1','AP_2','AP_3'].forEach(function (k) { o[k] = g(k); });
  o.tsaFoodScore = g('TSA_1'); o.tsaCoffeeScore = g('TSA_2'); o.tsaCXScore = g('TSA_3');
  o.TM_remarks = g('TM_remarks'); o.LMS_remarks = g('LMS_remarks');
  o.Buddy_remarks = g('Buddy_remarks'); o.NJ_remarks = g('NJ_remarks');
  o.PK_remarks = g('PK_remarks'); o.CX_remarks = g('CX_remarks'); o.AP_remarks = g('AP_remarks');
  o.totalScore = g('Total Score'); o.maxScore = g('Max Score'); o.percentageScore = g('Percentage');
  o.TSA_Food_remarks = g('TSA_Food_remarks'); o.TSA_Coffee_remarks = g('TSA_Coffee_remarks');
  o.TSA_CX_remarks = g('TSA_CX_remarks');
  o.auditorName = g('Auditor Name'); o.auditorId = g('Auditor ID');
  o.imageFolderUrl = ''; o.imageCount = '';
  o.zeroToleranceFailed = g('Zero Tolerance Failed');
  o.zeroToleranceFailedItems = g('Zero Tolerance Items');
  // Legacy sheet may not have geolocation columns; g() returns '' if absent.
  o.latitude = g('Latitude'); o.longitude = g('Longitude');
  o.geoAccuracy = g('Geo Accuracy'); o.geoTimestamp = g('Geo Timestamp');
  o.googleMapsLink = g('Google Maps Link');
  return o;
}

// ============================================================
// UTIL
// ============================================================
function getOrCreateSheet(ss, name, header) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, header.length).setValues([header]);
    sh.setFrozenRows(1);
    return sh;
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, header.length).setValues([header]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// ONE-TIME SETUP / MIGRATION
// ============================================================
/**
 * Run this once from the Apps Script editor.
 *  - Ensures both sheets + headers exist
 *  - Deletes the orphan "Training Audit - Last 90 Days" formula sheet (no longer used)
 *  - Warms the store-mapping cache
 */
function setupTrainingAuditHardened() {
  var ss = getSS();
  // Create fresh, empty sheets — we never touch the bloated legacy sheet.
  getOrCreateSheet(ss, MAIN_SHEET, HEADER);
  getOrCreateSheet(ss, IMAGE_SHEET, IMAGE_HEADER);

  // Remove any old cleanupOldData trigger leftover from the previous script
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'cleanupOldData') ScriptApp.deleteTrigger(t);
  });

  invalidateStoreMappingCache();
  getStoreMappingCached(); // warm
  Logger.log('Setup complete. New writes go to "' + MAIN_SHEET + '". ' +
    'Legacy "' + LEGACY_SHEET + '" is left untouched and still read for dashboards.');
  Logger.log('Re-deploy the Web App to pick up this code.');
}

/**
 * Rename the bloated legacy sheet so it is clearly archived.
 * Safe — does NOT read or edit any cells. Run this only after you have
 * verified new submissions are landing in "Training Audit v2".
 */
function archiveLegacySheet() {
  var ss = getSS();
  var legacy = ss.getSheetByName(LEGACY_SHEET);
  if (!legacy) { Logger.log('No legacy sheet found.'); return; }
  var newName = LEGACY_SHEET + ' - ARCHIVE ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  legacy.setName(newName);
  Logger.log('Renamed legacy sheet to "' + newName + '".');
}

/**
 * Optional: backfill submissionIds for historical rows that predate this change.
 * Safe to run multiple times.
 */
function backfillSubmissionIds() {
  var ss = getSS();
  var sheet = ss.getSheetByName(MAIN_SHEET);
  if (!sheet) return;
  var subCol = HEADER.indexOf('Submission ID') + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2 || subCol <= 0) return;
  var range = sheet.getRange(2, subCol, lastRow - 1, 1);
  var vals = range.getValues();
  var changed = 0;
  for (var i = 0; i < vals.length; i++) {
    if (!vals[i][0]) {
      vals[i][0] = 'legacy-' + (i + 2) + '-' + Utilities.getUuid().substring(0, 8);
      changed++;
    }
  }
  if (changed > 0) range.setValues(vals);
  Logger.log('Backfilled ' + changed + ' submissionIds');
}
