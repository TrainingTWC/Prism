/**
 * Third Rush Feedback data service.
 * Backend: third-rush-feedback-google-apps-script.js
 * Set the deployed Web App URL in THIRD_RUSH_ENDPOINT below or via VITE_THIRD_RUSH_ENDPOINT.
 */

export const THIRD_RUSH_ENDPOINT =
  (typeof process !== 'undefined' && (process as any).env?.VITE_THIRD_RUSH_ENDPOINT) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_THIRD_RUSH_ENDPOINT) ||
  // TODO: replace after deploying third-rush-feedback-google-apps-script.js
  'https://script.google.com/macros/s/REPLACE_WITH_THIRD_RUSH_DEPLOYMENT_URL/exec';

export type ThirdRushFormKind = 'full' | 'misc' | 'staff';

export interface FullAuditRow {
  'Server Timestamp': string;
  'Submission ID': string;
  'Auditor EMPID': string;
  'Store ID': string;
  'Store Name': string;
  'Auditor Name': string;
  'All Equipment Functional': string;
  'POS Billing Smooth': string;
  'Avg Order Time': string;
  'Workflow Efficiency': string;
  'Staff Urgency': string;
  'Coffee Quality': string;
  'Biggest Bottleneck': string;
  'Overall Readiness': string;
  'Readiness Score': number | string;
}

export interface MiscRow {
  'Server Timestamp': string;
  'Submission ID': string;
  'Auditor EMPID': string;
  'Store ID': string;
  'Store Name': string;
  'Auditor Name': string;
  'Category': string;
  'Observation': string;
  'Action Suggested': string;
  'Severity': string;
}

export interface StaffRow {
  'Server Timestamp': string;
  'Submission ID': string;
  'Auditor EMPID': string;
  'Store ID': string;
  'Store Name': string;
  'Submitted By': string;
  'Role': string;
  'Team Morale': string;
  'Was Staffing Adequate': string;
  'Biggest Challenge': string;
  'What Went Well': string;
  'Suggestions': string;
}

export interface ThirdRushAllResponse {
  status: 'OK' | 'ERROR';
  full?: FullAuditRow[];
  misc?: MiscRow[];
  staff?: StaffRow[];
  message?: string;
}

export async function submitThirdRush(
  form: ThirdRushFormKind,
  payload: Record<string, any>
): Promise<{ ok: boolean; submissionId?: string }> {
  const submissionId = payload.submissionId || cryptoRandom();
  try {
    await fetch(THIRD_RUSH_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, submissionId, ...payload }),
    });
    return { ok: true, submissionId };
  } catch (e) {
    console.error('Third Rush submit failed', e);
    return { ok: false, submissionId };
  }
}

export async function fetchThirdRushAll(): Promise<ThirdRushAllResponse> {
  try {
    const res = await fetch(`${THIRD_RUSH_ENDPOINT}?action=all&t=${Date.now()}`);
    if (!res.ok) return { status: 'ERROR', message: `HTTP ${res.status}` };
    return (await res.json()) as ThirdRushAllResponse;
  } catch (e) {
    return { status: 'ERROR', message: String(e) };
  }
}

function cryptoRandom() {
  // Lightweight UUID-ish; collisions are unimportant since the backend
  // also generates one when missing.
  const a = (Date.now() + Math.random()).toString(36);
  const b = Math.random().toString(36).slice(2, 10);
  return `tr_${a}_${b}`;
}
