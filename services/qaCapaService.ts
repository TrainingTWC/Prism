/**
 * QA CAPA Service
 * Extracts non-compliance/partial-compliance findings from QA checklist submissions
 * and creates AM Review + CAPA checklists automatically.
 */

import { QA_SECTIONS, QUESTION_MAP } from '../config/qaQuestions';
import { CAPA_MAP } from '../config/qaCapaMap';
import { fetchEmployeeDirectory, EmployeeRow } from './employeeDirectoryService';

// Unified QA endpoint for AM Review and CAPA read/update operations
const CAPA_ENDPOINT = import.meta.env.VITE_QA_SCRIPT_URL || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface QAFinding {
  questionId: string;
  section: string;
  question: string;
  response: 'not-compliant' | 'partially-compliant';
  weight: number;
  remark: string;
  // AM Review fields (filled later by AM)
  amAction?: string;
  amPriority?: string;
  amTargetDate?: string;
  // CAPA fields (filled later by SM/Shift/ASM)
  rootCause?: string;
  correctiveAction?: string;   // legacy single field
  preventiveAction?: string;   // legacy single field
  correctiveActions?: string[];
  preventiveActions?: string[];
  imageProofs?: string[];
  stakeholder?: { name: string; id: string };
  aiGenerated?: boolean;
  targetDate?: string;
  closedDate?: string;
  closedBy?: string;
}

export interface AICapaSuggestion {
  rootCause: string;
  correctiveActions: string[];
  preventiveActions: string[];
}

// ── AI CAPA quota optimization ──────────────────────────────────
// In-memory cache keyed by questionId+response+remark to avoid duplicate API calls
const aiCache = new Map<string, AICapaSuggestion>();

function cacheKey(finding: QAFinding): string {
  return `${finding.questionId}|${finding.response}|${(finding.remark || '').slice(0, 50)}`;
}

// ── Question-specific CAPA lookup ──────────────────────────────
// Uses the 116-entry CAPA_MAP for instant, intelligent, question-specific CAPA generation.
// Falls back to a generic template only if a questionId is somehow missing from the map.

function lookupCAPA(finding: QAFinding): AICapaSuggestion {
  // Try direct questionId match (e.g. "Store_S_40")
  const mapped = CAPA_MAP[finding.questionId];
  if (mapped) {
    return {
      rootCause: mapped.rootCause,
      correctiveActions: [...mapped.correctiveActions],
      preventiveActions: [...mapped.preventiveActions]
    };
  }

  // Fallback — shouldn't happen if CAPA_MAP covers all 116 questions
  console.warn('[CAPA] No map entry for', finding.questionId, '— using generic fallback');
  return {
    rootCause: `Non-conformity identified in ${finding.section} area — SOP not followed.`,
    correctiveActions: [
      'Address the non-conformity immediately and restore to standard',
      'Assign accountability to specific team member for the affected area',
      'SM/ASM to verify corrective action within 48 hours with photo evidence'
    ],
    preventiveActions: [
      'Add the specific area/item to the daily opening/closing checklist',
      'Conduct periodic review and training on SOP adherence',
      'Track and trend recurring findings to address systemic root causes'
    ]
  };
}

/**
 * Instant CAPA generation from the question-specific map.
 * No API call needed — returns immediately.
 */
export function generateInstantCAPA(finding: QAFinding): AICapaSuggestion {
  return lookupCAPA(finding);
}

/**
 * Call Gemini API (shared helper with retry-after support)
 */
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 1024
        }
      })
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    console.error('[AI CAPA] Gemini API error:', response.status, errBody);
    throw new Error(`Gemini API error ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const result = await response.json();
  console.log('[AI CAPA] Gemini response:', JSON.stringify(result).slice(0, 500));
  return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Generate AI CAPA for a single finding (uses cache, falls back to local templates)
 */
export async function generateAICAPA(finding: QAFinding, storeName: string): Promise<AICapaSuggestion> {
  const key = cacheKey(finding);
  if (aiCache.has(key)) {
    console.log('[AI CAPA] Cache hit for', finding.questionId);
    return aiCache.get(key)!;
  }

  // Try Gemini first, fall back to local templates
  try {
    const q = finding.question || QUESTION_MAP[finding.questionId] || finding.questionId;
    const status = finding.response === 'not-compliant' ? 'NC' : 'PC';

    const prompt = `Food safety CAPA for Indian café chain.
Finding: "${q}" | Status: ${status} | Remark: "${finding.remark || '-'}" | Store: "${storeName}"
Return JSON: {"rootCause":"<1 sentence>","correctiveActions":["<fix1>","<fix2>","<fix3>"],"preventiveActions":["<prevent1>","<prevent2>","<prevent3>"]}`;

    const text = await callGemini(prompt);
    const parsed = JSON.parse(text);
    const suggestion: AICapaSuggestion = {
      rootCause: parsed.rootCause || '',
      correctiveActions: (parsed.correctiveActions || []).slice(0, 3),
      preventiveActions: (parsed.preventiveActions || []).slice(0, 3)
    };

    aiCache.set(key, suggestion);
    return suggestion;
  } catch (err) {
    console.warn('[AI CAPA] Gemini unavailable, using question-specific map fallback:', err);
    const suggestion = lookupCAPA(finding);
    aiCache.set(key, suggestion);
    return suggestion;
  }
}

/**
 * Generate AI CAPAs for ALL findings in one API call (quota-efficient batch)
 * Falls back to local templates when Gemini quota is exceeded.
 */
export async function generateBatchAICAPA(
  findings: QAFinding[],
  storeName: string
): Promise<Map<number, AICapaSuggestion>> {
  const results = new Map<number, AICapaSuggestion>();
  const uncachedIndices: number[] = [];
  const uncachedFindings: { idx: number; q: string; status: string; remark: string }[] = [];

  // Check cache first
  for (let i = 0; i < findings.length; i++) {
    const key = cacheKey(findings[i]);
    if (aiCache.has(key)) {
      results.set(i, aiCache.get(key)!);
    } else {
      uncachedIndices.push(i);
      const f = findings[i];
      uncachedFindings.push({
        idx: i,
        q: f.question || QUESTION_MAP[f.questionId] || f.questionId,
        status: f.response === 'not-compliant' ? 'NC' : 'PC',
        remark: f.remark || '-'
      });
    }
  }

  if (uncachedFindings.length === 0) {
    console.log('[AI CAPA] All findings served from cache');
    return results;
  }

  // Try Gemini batch, fall back to local templates
  try {
    const findingsList = uncachedFindings
      .map((f, i) => `${i + 1}. "${f.q}" | ${f.status} | Remark: "${f.remark}"`)
      .join('\n');

    const prompt = `Food safety CAPA expert for Indian café chain. Store: "${storeName}".
Generate CAPA for each finding below. Keep responses concise.

${findingsList}

Return JSON array with one object per finding in order:
[{"rootCause":"<1 sentence>","correctiveActions":["<fix1>","<fix2>","<fix3>"],"preventiveActions":["<prevent1>","<prevent2>","<prevent3>"]}, ...]`;

    const text = await callGemini(prompt);
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : [parsed];

    for (let i = 0; i < uncachedFindings.length; i++) {
      const item = arr[i] || {};
      const suggestion: AICapaSuggestion = {
        rootCause: item.rootCause || '',
        correctiveActions: (item.correctiveActions || []).slice(0, 3),
        preventiveActions: (item.preventiveActions || []).slice(0, 3)
      };
      const fIdx = uncachedFindings[i].idx;
      results.set(fIdx, suggestion);
      aiCache.set(cacheKey(findings[fIdx]), suggestion);
    }

    console.log(`[AI CAPA] Batch: ${uncachedFindings.length} generated via Gemini. Total: 1 API call.`);
  } catch (err) {
    console.warn('[AI CAPA] Gemini unavailable, using question-specific map fallback for all findings:', err);
    for (const uf of uncachedFindings) {
      const fIdx = uf.idx;
      const suggestion = lookupCAPA(findings[fIdx]);
      results.set(fIdx, suggestion);
      aiCache.set(cacheKey(findings[fIdx]), suggestion);
    }
  }

  return results;
}

export interface CAPARecord {
  timestamp: string;
  qaSubmissionTime: string;
  qaAuditorName: string;
  qaAuditorId: string;
  storeName: string;
  storeId: string;
  city: string;
  region: string;
  amName: string;
  amId: string;
  qaScore: string;
  totalFindings: number;
  status: 'Open' | 'In Progress' | 'Closed';
  findings: QAFinding[];
  // CAPA-specific
  assignedToNames?: string;
  assignedToIds?: string;
  capaSubmittedBy?: string;
  capaSubmittedById?: string;
  capaSubmissionTime?: string;
}

/**
 * Extract all non-compliant and partially-compliant findings from QA responses
 */
export function extractFindings(
  responses: Record<string, string>,
  questionRemarks: Record<string, string>
): QAFinding[] {
  const findings: QAFinding[] = [];

  for (const section of QA_SECTIONS) {
    for (const item of section.items) {
      const key = `${section.id}_${item.id}`;
      const response = responses[key];

      if (response === 'not-compliant' || response === 'non-compliant' || response === 'partially-compliant') {
        findings.push({
          questionId: key,
          section: section.title,
          question: item.q,
          response: response === 'non-compliant' ? 'not-compliant' : response,
          weight: item.w,
          remark: questionRemarks[key] || ''
        });
      }
    }
  }

  return findings;
}

/**
 * Resolve Store Manager / Shift Manager / ASM for a given store from Employee Directory
 */
export async function resolveStoreManagement(storeId: string): Promise<EmployeeRow[]> {
  const directory = await fetchEmployeeDirectory();
  const normalizedStoreId = storeId.toUpperCase().trim();

  // Broad matching — designation keywords that indicate store management
  const designationKeywords = [
    'store manager', 'shift manager', 'assistant store manager',
    'sm', 'asm', 'shift mgr', 'store mgr', 'asst store manager',
    'shift incharge', 'shift in charge', 'senior shift', 'sstm',
    'café manager', 'cafe manager', 'outlet manager'
  ];

  const allEmployees = Object.values(directory.byId);
  console.log('[StoreManagers] Looking for storeId:', normalizedStoreId, 'across', allEmployees.length, 'employees');

  const managers = allEmployees.filter(emp => {
    const empStore = (emp.store_code || '').toUpperCase().trim();
    const designation = (emp.designation || '').toLowerCase().trim();
    if (empStore !== normalizedStoreId) return false;
    // Check if the designation matches any keyword (exact or partial)
    return designationKeywords.some(kw => designation === kw || designation.includes(kw));
  });

  console.log('[StoreManagers] Found', managers.length, 'managers for store', normalizedStoreId,
    managers.map(m => `${m.empname} (${m.designation})`));

  // If no managers found with keywords, log sample of employees at this store for debugging
  if (managers.length === 0) {
    const storeEmps = allEmployees.filter(e => (e.store_code || '').toUpperCase().trim() === normalizedStoreId);
    console.log('[StoreManagers] No managers matched. All employees at store:', normalizedStoreId,
      storeEmps.map(e => `${e.empname} — ${e.designation} — ${e.store_code}`));
  }

  return managers;
}

/**
 * Submit AM Review checklist to Google Sheets
 */
export async function submitAMReview(payload: {
  qaSubmissionTime: string;
  qaAuditorName: string;
  qaAuditorId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
  city: string;
  region: string;
  qaScore: string;
  findings: QAFinding[];
}): Promise<void> {
  if (!CAPA_ENDPOINT) {
    console.warn('⚠️ QA CAPA endpoint not configured. Set VITE_QA_CAPA_SCRIPT_URL in .env');
    return;
  }

  const params = new URLSearchParams({
    action: 'createAMReview',
    qaSubmissionTime: payload.qaSubmissionTime,
    qaAuditorName: payload.qaAuditorName,
    qaAuditorId: payload.qaAuditorId,
    amName: payload.amName,
    amId: payload.amId,
    storeName: payload.storeName,
    storeId: payload.storeId,
    city: payload.city,
    region: payload.region,
    qaScore: payload.qaScore,
    totalFindings: String(payload.findings.length),
    findingsJSON: JSON.stringify(payload.findings)
  });

  await fetch(CAPA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    mode: 'no-cors'
  });

  console.log(`✅ AM Review created: ${payload.findings.length} findings for ${payload.storeName}`);
}

/**
 * Submit CAPA checklist to Google Sheets
 */
export async function submitCAPA(payload: {
  qaSubmissionTime: string;
  qaAuditorName: string;
  qaAuditorId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
  city: string;
  region: string;
  qaScore: string;
  findings: QAFinding[];
  assignedToNames: string;
  assignedToIds: string;
}): Promise<void> {
  if (!CAPA_ENDPOINT) {
    console.warn('⚠️ QA CAPA endpoint not configured. Set VITE_QA_CAPA_SCRIPT_URL in .env');
    return;
  }

  const params = new URLSearchParams({
    action: 'createCAPA',
    qaSubmissionTime: payload.qaSubmissionTime,
    qaAuditorName: payload.qaAuditorName,
    qaAuditorId: payload.qaAuditorId,
    amName: payload.amName,
    amId: payload.amId,
    storeName: payload.storeName,
    storeId: payload.storeId,
    city: payload.city,
    region: payload.region,
    qaScore: payload.qaScore,
    totalFindings: String(payload.findings.length),
    assignedToNames: payload.assignedToNames,
    assignedToIds: payload.assignedToIds,
    findingsJSON: JSON.stringify(payload.findings)
  });

  await fetch(CAPA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    mode: 'no-cors'
  });

  console.log(`✅ QA CAPA created: ${payload.findings.length} findings assigned to ${payload.assignedToNames || 'N/A'}`);
}

/**
 * Fetch AM Review records with flexible filtering
 */
export async function fetchAMReviews(params: { amId?: string; auditorId?: string; all?: boolean }): Promise<CAPARecord[]> {
  if (!CAPA_ENDPOINT) return [];

  try {
    const urlParams = new URLSearchParams({ action: 'getAMReviews' });
    if (params.amId) urlParams.set('amId', params.amId);
    if (params.auditorId) urlParams.set('auditorId', params.auditorId);
    if (params.all) urlParams.set('all', 'true');

    const response = await fetch(`${CAPA_ENDPOINT}?${urlParams.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.success) return [];

    return (data.records || []).map((r: any) => ({
      ...r,
      findings: typeof r.findingsJson === 'string' ? JSON.parse(r.findingsJson) : (r.findings || []),
      totalFindings: Number(r.totalFindings) || 0
    }));
  } catch (error) {
    console.error('❌ Failed to fetch AM Reviews:', error);
    return [];
  }
}

/**
 * Fetch CAPA records with flexible filtering
 */
export async function fetchCAPAs(params: { storeId?: string; assigneeId?: string; auditorId?: string; amId?: string; all?: boolean }): Promise<CAPARecord[]> {
  if (!CAPA_ENDPOINT) return [];

  try {
    const urlParams = new URLSearchParams({ action: 'getCAPAs' });
    if (params.storeId) urlParams.set('storeId', params.storeId);
    if (params.assigneeId) urlParams.set('assigneeId', params.assigneeId);
    if (params.auditorId) urlParams.set('auditorId', params.auditorId);
    if (params.amId) urlParams.set('amId', params.amId);
    if (params.all) urlParams.set('all', 'true');

    const response = await fetch(`${CAPA_ENDPOINT}?${urlParams.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.success) return [];

    return (data.records || []).map((r: any) => ({
      ...r,
      findings: typeof r.findingsJson === 'string' ? JSON.parse(r.findingsJson) : (r.findings || []),
      totalFindings: Number(r.totalFindings) || 0
    }));
  } catch (error) {
    console.error('❌ Failed to fetch CAPAs:', error);
    return [];
  }
}

/**
 * Update AM Review (acknowledge findings, add observations)
 */
export async function updateAMReview(payload: {
  qaSubmissionTime: string;
  storeId: string;
  status: string;
  findingsJSON: string;
}): Promise<void> {
  if (!CAPA_ENDPOINT) return;

  const params = new URLSearchParams({
    action: 'updateAMReview',
    qaSubmissionTime: payload.qaSubmissionTime,
    storeId: payload.storeId,
    status: payload.status,
    findingsJSON: payload.findingsJSON
  });

  await fetch(CAPA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    mode: 'no-cors'
  });
}

/**
 * Update CAPA (fill root cause, corrective/preventive actions)
 */
export async function updateCAPA(payload: {
  qaSubmissionTime: string;
  storeId: string;
  status: string;
  findingsJSON: string;
  capaSubmittedBy: string;
  capaSubmittedById: string;
}): Promise<void> {
  if (!CAPA_ENDPOINT) return;

  const params = new URLSearchParams({
    action: 'updateCAPA',
    qaSubmissionTime: payload.qaSubmissionTime,
    storeId: payload.storeId,
    status: payload.status,
    findingsJSON: payload.findingsJSON,
    capaSubmittedBy: payload.capaSubmittedBy,
    capaSubmittedById: payload.capaSubmittedById,
    capaSubmissionTime: new Date().toLocaleString('en-GB', { hour12: false })
  });

  await fetch(CAPA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    mode: 'no-cors'
  });
}
