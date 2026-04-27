/**
 * TAT TRACKER - GOOGLE APPS SCRIPT
 *
 * Tracks HRBP-wise hiring TAT (Turn-Around-Time) for store vacancies.
 * Mirrors the Excel "TAT Tracker - TWC.xlsx" but with:
 *   - Position-based SLA fix (Excel formula was broken — referenced wrong column)
 *   - Time-based "On-TAT" / "Off-TAT" status, recomputed daily for open rows
 *   - Vacancy ID idempotency for safe re-submits / edits
 *   - Auto-fill of Region / Store Name / AM / MM from Store_Mapping sheet
 *
 * TWO-SHEET ARCHITECTURE:
 *   - "TAT Tracker"               — full historical archive
 *   - "TAT Tracker - Last 90 Days" — auto-pruned working sheet for fast dashboard reads
 *   - "NSO Readiness"             — separate manpower-readiness sheet (Phase 3)
 *
 * Setup: Run setupTATTracker() once from the Apps Script editor.
 * Then deploy as Web App ("Anyone with link", execute as "Me").
 */

var TAT_SHEET_ALL = 'TAT Tracker';
var TAT_SHEET_90  = 'TAT Tracker - Last 90 Days';
var TAT_LOCK_TIMEOUT_MS = 25000;
var TAT_TARGET_DAYS = 30; // SLA — same as Excel "Offer TAT is 30"

var TAT_HEADERS = [
  'Server Timestamp', 'Created At', 'Updated At', 'Vacancy ID',
  'Intimation Date', 'Region', 'Brand', 'Store Type', 'Category',
  'Position', 'Store ID', 'Store Name',
  'Position Type', 'Drop-Out Type', 'Drop-Out Sl. No', 'Repl. E-Code',
  'Hold Time (Days)', 'Hold Reason',
  'Offer Letter Date', 'DOJ',
  'NSO Opening Date', 'NSO Opened with 100% Manpower',
  'Source of Hiring', 'Candidate Name', 'Candidate Designation',
  'Referrer Name', 'Referrer E-Code',
  'MM/RM Name', 'HRBP ID', 'HRBP Name',
  'Remarks',
  // Computed
  'Position Time (Days)', 'TAT Status', 'Vacancy Status', 'Is Closed'
];

// =============================================================================
// SETUP
// =============================================================================
function setupTATTracker() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [TAT_SHEET_ALL, TAT_SHEET_90].forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, TAT_HEADERS.length).setValues([TAT_HEADERS]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, TAT_HEADERS.length)
        .setFontWeight('bold')
        .setBackground('#1f2937')
        .setFontColor('#ffffff');
    }
  });

  // Daily trigger: re-evaluate ageing for all open rows
  var triggers = ScriptApp.getProjectTriggers();
  var hasDaily = triggers.some(function (t) {
    return t.getHandlerFunction() === 'recomputeOpenVacancies';
  });
  if (!hasDaily) {
    ScriptApp.newTrigger('recomputeOpenVacancies')
      .timeBased().everyDays(1).atHour(2).create();
  }

  Logger.log('TAT Tracker setup complete.');
}

// =============================================================================
// doPost — UPSERT vacancy by Vacancy ID
// =============================================================================
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(TAT_LOCK_TIMEOUT_MS)) {
      return _json({ status: 'ERROR', code: 'LOCK_TIMEOUT', message: 'Server busy, please retry' });
    }

    var params = _readParams(e);

    // action=delete — soft delete (mark closed=DELETED). We just remove from sheets.
    if (params.action === 'delete' && params.vacancyId) {
      _deleteRow(params.vacancyId);
      return _json({ status: 'OK', deleted: true, vacancyId: params.vacancyId });
    }

    // action=bulkImport — paste the Excel rows in JSON
    if (params.action === 'bulkImport' && params.rows) {
      var imported = _bulkImport(JSON.parse(params.rows));
      return _json({ status: 'OK', imported: imported });
    }

    // Default: upsert
    var vacancyId = (params.vacancyId || '').toString().trim() || _uuid();
    params.vacancyId = vacancyId;

    // Auto-fill from Store_Mapping
    if (params.storeId) {
      var info = _getStoreInfo(params.storeId);
      if (info) {
        params.region    = info.region    || params.region    || '';
        params.storeName = info.storeName || params.storeName || '';
        params.mmRmName  = params.mmRmName || info.mmName || info.amName || '';
        if (!params.hrbpId)   params.hrbpId   = info.hrbpId || '';
        if (!params.hrbpName) params.hrbpName = info.hrbpName || '';
      }
    }

    var row = _buildRow(params);

    var ssAll = _findRow(TAT_SHEET_ALL, vacancyId);
    var ss90  = _findRow(TAT_SHEET_90,  vacancyId);

    if (ssAll.row > 0) {
      _writeRow(TAT_SHEET_ALL, ssAll.row, row);
    } else {
      _appendRow(TAT_SHEET_ALL, row);
    }
    if (ss90.row > 0) {
      _writeRow(TAT_SHEET_90, ss90.row, row);
    } else {
      _appendRow(TAT_SHEET_90, row);
    }

    return _json({
      status: 'OK',
      vacancyId: vacancyId,
      duplicate: ssAll.row > 0,
      computed: {
        positionTime: row[TAT_HEADERS.indexOf('Position Time (Days)')],
        tatStatus:    row[TAT_HEADERS.indexOf('TAT Status')],
        vacancyStatus:row[TAT_HEADERS.indexOf('Vacancy Status')]
      }
    });
  } catch (err) {
    Logger.log('doPost ERROR: ' + err);
    return _json({ status: 'ERROR', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// =============================================================================
// doGet — return JSON for the dashboard
// =============================================================================
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'list';

    if (action === 'list') {
      return _json({ status: 'OK', rows: _readSheet(TAT_SHEET_90) });
    }
    if (action === 'listAll') {
      return _json({ status: 'OK', rows: _readSheet(TAT_SHEET_ALL) });
    }
    if (action === 'get' && params.vacancyId) {
      var found = _findRow(TAT_SHEET_ALL, params.vacancyId);
      if (found.row === 0) return _json({ status: 'NOT_FOUND' });
      var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAT_SHEET_ALL);
      var values = sh.getRange(found.row, 1, 1, TAT_HEADERS.length).getValues()[0];
      return _json({ status: 'OK', row: _rowToObject(values) });
    }
    return _json({ status: 'ERROR', message: 'Unknown action: ' + action });
  } catch (err) {
    return _json({ status: 'ERROR', message: String(err) });
  }
}

// =============================================================================
// Recompute open-vacancy ageing (daily trigger)
// =============================================================================
function recomputeOpenVacancies() {
  [TAT_SHEET_ALL, TAT_SHEET_90].forEach(function (name) {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, TAT_HEADERS.length).getValues();
    var headerIdx = _headerIndex();
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      if (r[headerIdx['Is Closed']] === true || r[headerIdx['Is Closed']] === 'TRUE') continue;
      var obj = _rowToObject(r);
      var rebuilt = _buildRow(obj);
      sh.getRange(i + 2, 1, 1, TAT_HEADERS.length).setValues([rebuilt]);
    }
  });
  // Prune the 90-day sheet
  _prune90DaySheet();
}

// =============================================================================
// REPAIR — one-shot: recompute every row + back-fill HRBP Name from Store_Mapping
// Run from Apps Script editor when dashboard shows zeros / numeric HRBP IDs.
// =============================================================================
function repairTATData() {
  var stats = { rowsTouched: 0, hrbpNameFilled: 0, storeNameFilled: 0, regionFilled: 0,
                hadIntimation: 0, hadOffer: 0, isClosedAfter: 0, headersUpgraded: 0 };
  [TAT_SHEET_ALL, TAT_SHEET_90].forEach(function (name) {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;

    // 1) Read using whatever headers the sheet currently has (tolerates older layouts)
    var headers = _sheetHeaders(sh);
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();

    // 2) Upgrade the header row to the current TAT_HEADERS layout if it differs
    if (headers.join('|') !== TAT_HEADERS.join('|')) {
      // Make sure the sheet has at least TAT_HEADERS.length columns
      if (sh.getMaxColumns() < TAT_HEADERS.length) {
        sh.insertColumnsAfter(sh.getMaxColumns(), TAT_HEADERS.length - sh.getMaxColumns());
      }
      sh.getRange(1, 1, 1, TAT_HEADERS.length).setValues([TAT_HEADERS]);
      sh.getRange(1, 1, 1, TAT_HEADERS.length)
        .setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
      stats.headersUpgraded++;
    }

    // 3) Rebuild every row using the original (old-layout) values keyed by header name
    var out = [];
    for (var i = 0; i < data.length; i++) {
      var rawByHeader = _rowAsObjByHeader(headers, data[i]);
      var obj = _rowToObjectFromMap(rawByHeader);

      // Back-fill HRBP Name / Region / Store Name from Store_Mapping by Store ID
      if (obj.storeId) {
        var info = _getStoreInfo(obj.storeId);
        if (info) {
          if (!obj.hrbpName && info.hrbpName) { obj.hrbpName = info.hrbpName; stats.hrbpNameFilled++; }
          if (!obj.hrbpId   && info.hrbpId)   { obj.hrbpId   = info.hrbpId; }
          if (!obj.region   && info.region)   { obj.region   = info.region;   stats.regionFilled++; }
          if (!obj.storeName && info.storeName) { obj.storeName = info.storeName; stats.storeNameFilled++; }
          if (!obj.mmRmName && (info.mmName || info.amName)) obj.mmRmName = info.mmName || info.amName;
        }
      }

      if (obj.intimationDate) stats.hadIntimation++;
      if (obj.offerLetterDate) stats.hadOffer++;

      var rebuilt = _buildRow(obj);
      if (rebuilt[_headerIndex()['Is Closed']]) stats.isClosedAfter++;
      out.push(rebuilt);
      stats.rowsTouched++;
    }
    sh.getRange(2, 1, out.length, TAT_HEADERS.length).setValues(out);
  });
  Logger.log('repairTATData stats: ' + JSON.stringify(stats));
  return stats;
}

function _prune90DaySheet() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAT_SHEET_90);
  if (!sh || sh.getLastRow() < 2) return;
  var headerIdx = _headerIndex();
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, TAT_HEADERS.length).getValues();
  var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
  for (var i = data.length - 1; i >= 0; i--) {
    var intDate = data[i][headerIdx['Intimation Date']];
    var isClosed = data[i][headerIdx['Is Closed']] === true || data[i][headerIdx['Is Closed']] === 'TRUE';
    var d = intDate instanceof Date ? intDate : new Date(intDate);
    if (isClosed && d < cutoff) sh.deleteRow(i + 2);
  }
}

// =============================================================================
// Helpers — row building / scoring
// =============================================================================
function _buildRow(p) {
  var now = new Date();
  var intimationDate = _parseDate(p.intimationDate);
  var offerDate      = _parseDate(p.offerLetterDate);
  var doj            = _parseDate(p.doj);
  var nsoDate        = _parseDate(p.nsoOpeningDate);
  var holdDays       = Number(p.holdTime) || 0;

  // Position Time (days)
  var positionTime = '';
  if (intimationDate) {
    var endDate = offerDate || now;
    var ms = endDate.getTime() - intimationDate.getTime();
    positionTime = Math.round(ms / 86400000) - holdDays;
  }

  var isClosed = !!offerDate;
  var tatStatus = '';
  if (positionTime !== '' && positionTime <= TAT_TARGET_DAYS) tatStatus = 'On-TAT';
  else if (positionTime !== '') tatStatus = 'Off-TAT';
  var vacancyStatus = (isClosed ? 'Closed ' : 'Open ') + (tatStatus || '');

  var createdAt = p.createdAt ? _parseDate(p.createdAt) || now : now;

  var map = {
    'Server Timestamp': now,
    'Created At': createdAt,
    'Updated At': now,
    'Vacancy ID': p.vacancyId || '',
    'Intimation Date': intimationDate || '',
    'Region': p.region || '',
    'Brand': p.brand || 'TWC',
    'Store Type': p.storeType || 'Existing',
    'Category': p.category || 'Store',
    'Position': p.position || '',
    'Store ID': p.storeId || '',
    'Store Name': p.storeName || '',
    'Position Type': p.positionType || '',
    'Drop-Out Type': p.dropOutType || '',
    'Drop-Out Sl. No': p.dropOutSerialNo || '',
    'Repl. E-Code': p.replacementECode || '',
    'Hold Time (Days)': holdDays || '',
    'Hold Reason': p.holdReason || '',
    'Offer Letter Date': offerDate || '',
    'DOJ': doj || '',
    'NSO Opening Date': nsoDate || '',
    'NSO Opened with 100% Manpower': p.nsoOpenedWith100Manpower || '',
    'Source of Hiring': p.sourceOfHiring || '',
    'Candidate Name': p.candidateName || '',
    'Candidate Designation': p.candidateDesignation || '',
    'Referrer Name': p.referrerName || '',
    'Referrer E-Code': p.referrerEmpId || '',
    'MM/RM Name': p.mmRmName || '',
    'HRBP ID': p.hrbpId || '',
    'HRBP Name': p.hrbpName || '',
    'Remarks': p.remarks || '',
    'Position Time (Days)': positionTime,
    'TAT Status': tatStatus,
    'Vacancy Status': vacancyStatus.trim(),
    'Is Closed': isClosed
  };
  return TAT_HEADERS.map(function (h) { return map[h] === undefined ? '' : map[h]; });
}

function _rowToObject(row) {
  return _rowToObjectFromMap(_rowAsObjByHeader(TAT_HEADERS, row));
}

// Builds the camelCase param object from a header-name keyed map (works even
// if the source row had a different / older column layout).
function _rowToObjectFromMap(o) {
  return {
    vacancyId: o['Vacancy ID'],
    intimationDate: o['Intimation Date'],
    region: o['Region'], brand: o['Brand'], storeType: o['Store Type'], category: o['Category'],
    position: o['Position'], storeId: o['Store ID'], storeName: o['Store Name'],
    positionType: o['Position Type'], dropOutType: o['Drop-Out Type'],
    dropOutSerialNo: o['Drop-Out Sl. No'], replacementECode: o['Repl. E-Code'],
    holdTime: o['Hold Time (Days)'], holdReason: o['Hold Reason'],
    offerLetterDate: o['Offer Letter Date'], doj: o['DOJ'],
    nsoOpeningDate: o['NSO Opening Date'],
    nsoOpenedWith100Manpower: o['NSO Opened with 100% Manpower'],
    sourceOfHiring: o['Source of Hiring'],
    candidateName: o['Candidate Name'], candidateDesignation: o['Candidate Designation'],
    referrerName: o['Referrer Name'], referrerEmpId: o['Referrer E-Code'],
    mmRmName: o['MM/RM Name'], hrbpId: o['HRBP ID'], hrbpName: o['HRBP Name'],
    remarks: o['Remarks'],
    createdAt: o['Created At']
  };
}

// Reads the sheet's actual header row -> array of header names
function _sheetHeaders(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h || '').trim(); });
}

// Convert a sheet row (in the sheet's current column order) into a flat object keyed by header name
function _rowAsObjByHeader(headers, row) {
  var o = {};
  for (var i = 0; i < headers.length; i++) o[headers[i]] = row[i];
  return o;
}

function _readSheet(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var headers = _sheetHeaders(sh);
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var rec = {};
    for (var j = 0; j < headers.length; j++) {
      var v = values[i][j];
      if (v instanceof Date) v = v.toISOString();
      rec[headers[j]] = v;
    }
    out.push(rec);
  }
  return out;
}

function _findRow(sheetName, vacancyId) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return { row: 0, sheet: sh };
  var idCol = TAT_HEADERS.indexOf('Vacancy ID') + 1;
  var values = sh.getRange(2, idCol, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(vacancyId).trim()) {
      return { row: i + 2, sheet: sh };
    }
  }
  return { row: 0, sheet: sh };
}

function _writeRow(sheetName, rowNum, rowValues) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sh.getRange(rowNum, 1, 1, TAT_HEADERS.length).setValues([rowValues]);
}

function _appendRow(sheetName, rowValues) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sh.appendRow(rowValues);
}

function _deleteRow(vacancyId) {
  [TAT_SHEET_ALL, TAT_SHEET_90].forEach(function (name) {
    var f = _findRow(name, vacancyId);
    if (f.row > 0) f.sheet.deleteRow(f.row);
  });
}

function _bulkImport(rows) {
  var n = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r.vacancyId) r.vacancyId = _uuid();
    var built = _buildRow(r);
    var f = _findRow(TAT_SHEET_ALL, r.vacancyId);
    if (f.row > 0) _writeRow(TAT_SHEET_ALL, f.row, built);
    else _appendRow(TAT_SHEET_ALL, built);
    var f2 = _findRow(TAT_SHEET_90, r.vacancyId);
    if (f2.row > 0) _writeRow(TAT_SHEET_90, f2.row, built);
    else _appendRow(TAT_SHEET_90, built);
    n++;
  }
  return n;
}

// =============================================================================
// Store_Mapping integration (matches training-audit script convention)
// =============================================================================
function _getStoreInfo(storeId) {
  if (!storeId) return null;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Store_Mapping')
        || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Store_mapping');
  if (!sh || sh.getLastRow() < 2) return null;
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var key = String(storeId).trim().toLowerCase();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === key) {
      var r = data[i];
      // Same column order as the training-audit script's Store_Mapping
      return {
        storeId:   r[0] ? String(r[0]).trim() : '',
        storeName: r[1] ? String(r[1]).trim() : '',
        region:    r[2] ? String(r[2]).trim() : '',
        amId:      r[3] ? String(r[3]).trim() : '',
        amName:    r[4] ? String(r[4]).trim() : '',
        hrbpId:    r[5] ? String(r[5]).trim() : '',
        hrbpName:  r[6] ? String(r[6]).trim() : '',
        mmName:    r[7] ? String(r[7]).trim() : ''
      };
    }
  }
  return null;
}

// =============================================================================
// Utilities
// =============================================================================
function _readParams(e) {
  var p = {};
  if (e && e.parameter) p = e.parameter;
  if (Object.keys(p).length === 0 && e && e.postData && e.postData.contents) {
    var pairs = e.postData.contents.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var kv = pairs[i].split('=');
      if (kv.length === 2) p[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1].replace(/\+/g, ' '));
    }
  }
  return p;
}

function _parseDate(v) {
  if (!v && v !== 0) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  var s = String(v).trim();
  if (!s) return null;
  var d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // dd/mm/yyyy
  var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    var y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(y, Number(m[2]) - 1, Number(m[1]));
  }
  return null;
}

function _headerIndex() {
  var idx = {};
  for (var i = 0; i < TAT_HEADERS.length; i++) idx[TAT_HEADERS[i]] = i;
  return idx;
}

function _uuid() {
  return Utilities.getUuid();
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
