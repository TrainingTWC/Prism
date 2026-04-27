/**
 * TAT Tracker data service — fetches vacancies from the Apps Script Web App.
 *
 * Backend: tat-tracker-google-apps-script.js (deploy as Web App).
 * Set the deployed URL in `TAT_TRACKER_ENDPOINT` below (or via env var).
 */

// REPLACE with the deployed Apps Script Web App URL after running `setupTATTracker()`.
export const TAT_TRACKER_ENDPOINT =
  (typeof process !== 'undefined' && (process as any).env?.VITE_TAT_TRACKER_ENDPOINT) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TAT_TRACKER_ENDPOINT) ||
  'https://script.google.com/macros/s/AKfycbwYcRDvRb9QqPtEJCkPRYOF_E2O6jfdKwQRNSU4clMpnc7TLz-yE3YzB2zJeC5I9UHllw/exec';

export type VacancyTATStatus = 'On-TAT' | 'Off-TAT' | '';
export type VacancyOpenStatus =
  | 'Open On-TAT' | 'Open Off-TAT' | 'Closed On-TAT' | 'Closed Off-TAT' | '';

export interface VacancyRecord {
  vacancyId: string;
  intimationDate: string;          // ISO
  region: string;
  brand: string;
  storeType: 'Existing' | 'NSO' | string;
  category: string;
  position: string;
  storeId: string;
  storeName: string;
  positionType: 'New' | 'Repl.' | string;
  dropOutType: string;
  dropOutSerialNo: number | string;
  replacementECode: string;
  holdTime: number | string;
  holdReason: string;
  offerLetterDate: string;
  doj: string;
  nsoOpeningDate: string;
  nsoOpenedWith100Manpower: string;
  sourceOfHiring: string;
  candidateName: string;
  candidateDesignation: string;
  referrerName: string;
  referrerEmpId: string;
  mmRmName: string;
  hrbpId: string;
  hrbpName: string;
  remarks: string;
  positionTime: number | string;
  tatStatus: VacancyTATStatus;
  vacancyStatus: VacancyOpenStatus;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

const RAW_TO_KEY: Record<string, keyof VacancyRecord> = {
  'Vacancy ID': 'vacancyId',
  'Intimation Date': 'intimationDate',
  'Region': 'region',
  'Brand': 'brand',
  'Store Type': 'storeType',
  'Category': 'category',
  'Position': 'position',
  'Store ID': 'storeId',
  'Store Name': 'storeName',
  'Position Type': 'positionType',
  'Drop-Out Type': 'dropOutType',
  'Drop-Out Sl. No': 'dropOutSerialNo',
  'Repl. E-Code': 'replacementECode',
  'Hold Time (Days)': 'holdTime',
  'Hold Reason': 'holdReason',
  'Offer Letter Date': 'offerLetterDate',
  'DOJ': 'doj',
  'NSO Opening Date': 'nsoOpeningDate',
  'NSO Opened with 100% Manpower': 'nsoOpenedWith100Manpower',
  'Source of Hiring': 'sourceOfHiring',
  'Candidate Name': 'candidateName',
  'Candidate Designation': 'candidateDesignation',
  'Referrer Name': 'referrerName',
  'Referrer E-Code': 'referrerEmpId',
  'MM/RM Name': 'mmRmName',
  'HRBP ID': 'hrbpId',
  'HRBP Name': 'hrbpName',
  'Remarks': 'remarks',
  'Position Time (Days)': 'positionTime',
  'TAT Status': 'tatStatus',
  'Vacancy Status': 'vacancyStatus',
  'Is Closed': 'isClosed',
  'Created At': 'createdAt',
  'Updated At': 'updatedAt',
};

function normalize(raw: any): VacancyRecord {
  const out = {} as VacancyRecord;
  for (const k in RAW_TO_KEY) {
    const dest = RAW_TO_KEY[k];
    (out as any)[dest] = raw[k] ?? '';
  }
  out.isClosed = raw['Is Closed'] === true || raw['Is Closed'] === 'TRUE' || raw['Is Closed'] === 'true';
  return out;
}

export async function fetchTATRecords(opts: { all?: boolean } = {}): Promise<VacancyRecord[]> {
  const url = TAT_TRACKER_ENDPOINT + '?action=' + (opts.all ? 'listAll' : 'list');
  const resp = await fetch(url, { method: 'GET' });
  const json = await resp.json();
  if (json.status !== 'OK') throw new Error(json.message || 'Failed to fetch TAT records');
  return (json.rows as any[]).map(normalize);
}

// ============================================================================
// HRBP scorecard aggregation (the headline view)
// ============================================================================
export interface HRBPScorecardRow {
  hrbpId: string;
  hrbpName: string;
  total: number;
  open: number;
  closed: number;
  onTATCount: number;        // closed + on-TAT
  offTATCount: number;       // closed + off-TAT
  onTATPct: number;          // 0..100, of *closed*
  avgTAT: number;            // avg positionTime over closed
  openOffTAT: number;        // currently breaching (most actionable)
  oldestOpenDays: number;
}

export function buildHRBPScorecard(rows: VacancyRecord[]): HRBPScorecardRow[] {
  const map = new Map<string, HRBPScorecardRow>();
  for (const r of rows) {
    const key = String(r.hrbpId || r.hrbpName || 'Unassigned').trim();
    if (!map.has(key)) {
      map.set(key, {
        hrbpId: r.hrbpId || key,
        hrbpName: r.hrbpName || key,
        total: 0, open: 0, closed: 0,
        onTATCount: 0, offTATCount: 0, onTATPct: 0, avgTAT: 0,
        openOffTAT: 0, oldestOpenDays: 0,
      });
    }
    const s = map.get(key)!;
    s.total++;
    const days = Number(r.positionTime) || 0;
    if (r.isClosed) {
      s.closed++;
      if (r.tatStatus === 'On-TAT') s.onTATCount++; else s.offTATCount++;
      s.avgTAT += days;
    } else {
      s.open++;
      if (r.tatStatus === 'Off-TAT') s.openOffTAT++;
      if (days > s.oldestOpenDays) s.oldestOpenDays = days;
    }
  }
  const out: HRBPScorecardRow[] = [];
  map.forEach(s => {
    s.avgTAT = s.closed > 0 ? Math.round((s.avgTAT / s.closed) * 10) / 10 : 0;
    s.onTATPct = s.closed > 0 ? Math.round((s.onTATCount / s.closed) * 1000) / 10 : 0;
    out.push(s);
  });
  return out.sort((a, b) => b.onTATPct - a.onTATPct || b.total - a.total);
}

// ============================================================================
// KPI summary
// ============================================================================
export interface TATKpis {
  total: number;
  open: number;
  closed: number;
  onTATPct: number;     // among closed
  avgTAT: number;       // among closed
  offTATOpen: number;   // currently breaching
  oldestOpen: number;
}

export function computeTATKpis(rows: VacancyRecord[]): TATKpis {
  let open = 0, closed = 0, onTAT = 0, offTATOpen = 0, sum = 0, oldest = 0;
  for (const r of rows) {
    const days = Number(r.positionTime) || 0;
    if (r.isClosed) {
      closed++;
      if (r.tatStatus === 'On-TAT') onTAT++;
      sum += days;
    } else {
      open++;
      if (r.tatStatus === 'Off-TAT') offTATOpen++;
      if (days > oldest) oldest = days;
    }
  }
  return {
    total: rows.length,
    open, closed,
    onTATPct: closed > 0 ? Math.round((onTAT / closed) * 1000) / 10 : 0,
    avgTAT: closed > 0 ? Math.round((sum / closed) * 10) / 10 : 0,
    offTATOpen,
    oldestOpen: oldest,
  };
}

// ============================================================================
// Aging buckets for OPEN vacancies
// ============================================================================
export interface AgingBucket { label: string; count: number; min: number; max: number; }

export function computeAgingBuckets(rows: VacancyRecord[]): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { label: '0–15 d',  min: 0,  max: 15, count: 0 },
    { label: '16–30 d', min: 16, max: 30, count: 0 },
    { label: '31–45 d', min: 31, max: 45, count: 0 },
    { label: '46–60 d', min: 46, max: 60, count: 0 },
    { label: '60+ d',   min: 61, max: 9999, count: 0 },
  ];
  for (const r of rows) {
    if (r.isClosed) continue;
    const d = Math.max(0, Number(r.positionTime) || 0);
    const b = buckets.find(b => d >= b.min && d <= b.max);
    if (b) b.count++;
  }
  return buckets;
}

// ============================================================================
// Status pie (Open/Closed × On-TAT/Off-TAT)
// ============================================================================
export function computeVacancyStatusBreakdown(rows: VacancyRecord[]) {
  const out = {
    'Open On-TAT': 0,
    'Open Off-TAT': 0,
    'Closed On-TAT': 0,
    'Closed Off-TAT': 0,
  };
  for (const r of rows) {
    const status = (r.isClosed ? 'Closed ' : 'Open ') + (r.tatStatus || 'Off-TAT');
    if (status in out) (out as any)[status]++;
  }
  return out;
}
