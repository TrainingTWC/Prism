/**
 * HR AUDIT (STORE HR HEALTH) QUESTIONS
 * Observation-based predictive health system for stores
 *
 * 5 Sections:
 *  - Attrition Risk (6 inputs)
 *  - Capability (5 inputs)
 *  - Culture (7 inputs)
 *  - Engagement (5 inputs)
 *  - Pressure (5 inputs)
 *
 * Input Types:
 *  - yes_no   → Yes / No toggle
 *  - number   → Numeric count
 *  - rating   → 1–5 scale
 *  - percent  → 0–100 percentage
 *
 * Scoring:
 *  Each section produces a 0–100 score via weighted formula.
 *  Master Store Health = weighted composite of all five.
 */

// ── Types ────────────────────────────────────────────────────────────
export type HRInputType = 'yes_no' | 'number' | 'rating' | 'percent';

export interface HRQuestion {
  id: string;
  q: string;
  type: HRInputType;
  /** Hint shown below the input */
  hint?: string;
}

export interface HRSection {
  id: string;
  title: string;
  color: string;          // Tailwind accent (e.g. 'orange', 'blue')
  emoji: string;
  items: HRQuestion[];
}

// ── Section Definitions ──────────────────────────────────────────────

export const HR_AUDIT_SECTIONS: HRSection[] = [
  {
    id: 'AttritionRisk',
    title: 'Attrition Risk',
    color: 'orange',
    emoji: '🟠',
    items: [
      { id: 'AR_1', q: 'Any resignation in the store?', type: 'yes_no' },
      { id: 'AR_2', q: 'Any employee currently on notice period?', type: 'yes_no' },
      { id: 'AR_3', q: 'Number of unplanned absences in last 30 days', type: 'number', hint: 'Total absenteeism count across all employees' },
      { id: 'AR_4', q: 'Number of employees with tenure less than 3 months', type: 'number' },
      { id: 'AR_5', q: 'Is a high performer at risk of leaving?', type: 'yes_no' },
      { id: 'AR_6', q: 'Total team size at the store', type: 'number', hint: 'Used to normalize ratios' },
    ],
  },
  {
    id: 'Capability',
    title: 'Capability',
    color: 'blue',
    emoji: '🔵',
    items: [
      { id: 'CA_1', q: 'Number of certified / trained employees', type: 'number' },
      { id: 'CA_2', q: 'Number of employees needing additional support', type: 'number' },
      { id: 'CA_3', q: 'Number of employees who failed recent assessments', type: 'number' },
      { id: 'CA_4', q: 'Are there recurring service errors at this store?', type: 'yes_no' },
      { id: 'CA_5', q: 'Are new joiners able to work independently?', type: 'yes_no' },
    ],
  },
  {
    id: 'Culture',
    title: 'Culture',
    color: 'green',
    emoji: '🟢',
    items: [
      { id: 'CU_1', q: 'Is there any active conflict between team members?', type: 'yes_no' },
      { id: 'CU_2', q: 'Any policy violation reported?', type: 'yes_no' },
      { id: 'CU_3', q: 'Is there any perceived favoritism?', type: 'yes_no' },
      { id: 'CU_4', q: 'Do employees feel free to speak up?', type: 'yes_no' },
      { id: 'CU_5', q: 'Is there visible team support / collaboration?', type: 'yes_no' },
      { id: 'CU_6', q: 'Overall team morale rating', type: 'rating', hint: '1 = Very Low … 5 = Excellent' },
      { id: 'CU_7', q: 'Store Manager effectiveness rating', type: 'rating', hint: '1 = Poor … 5 = Outstanding' },
    ],
  },
  {
    id: 'Engagement',
    title: 'Engagement',
    color: 'yellow',
    emoji: '🟡',
    items: [
      { id: 'EN_1', q: 'Are employees actively engaging with customers?', type: 'yes_no' },
      { id: 'EN_2', q: 'Participation in recent initiatives / activities (%)', type: 'percent', hint: '0–100%' },
      { id: 'EN_3', q: 'Is any employee visibly disengaged?', type: 'yes_no' },
      { id: 'EN_4', q: 'Do employees take ownership of tasks?', type: 'yes_no' },
      { id: 'EN_5', q: 'Overall energy level of the store', type: 'rating', hint: '1 = Very Low … 5 = High Energy' },
    ],
  },
  {
    id: 'Pressure',
    title: 'Pressure',
    color: 'red',
    emoji: '🔴',
    items: [
      { id: 'PR_1', q: 'Does the store struggle during peak hours?', type: 'yes_no' },
      { id: 'PR_2', q: 'Is the store manager visibly stressed?', type: 'yes_no' },
      { id: 'PR_3', q: 'Are team members skipping breaks?', type: 'yes_no' },
      { id: 'PR_4', q: 'Are SOP shortcuts being taken?', type: 'yes_no' },
      { id: 'PR_5', q: 'Is frustration visibly evident among staff?', type: 'yes_no' },
    ],
  },
];

// Total inputs count
export const HR_AUDIT_TOTAL_INPUTS = HR_AUDIT_SECTIONS.reduce((s, sec) => s + sec.items.length, 0); // 28

// ── Flat question map (sectionId_questionId → question text) ─────────
export const HR_AUDIT_QUESTION_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const sec of HR_AUDIT_SECTIONS) {
    for (const item of sec.items) {
      m[`${sec.id}_${item.id}`] = item.q;
    }
  }
  return m;
})();

// ── Scoring Engine ───────────────────────────────────────────────────

/** Helper: parse a yes/no response to 1 (yes) or 0 (no) */
const yn = (v: string | undefined): number => (v?.toLowerCase() === 'yes' ? 1 : 0);

/** Helper: clamp a value between 0 and 100 */
const clamp = (v: number): number => Math.max(0, Math.min(100, v));

/** Helper: parse float, default to 0 */
const num = (v: string | undefined): number => {
  const n = parseFloat(v || '0');
  return isNaN(n) ? 0 : n;
};

export interface HRSectionScore {
  score: number;       // 0–100
  label: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface HRAuditScores {
  attritionRisk: HRSectionScore;
  capability: HRSectionScore;
  culture: HRSectionScore;
  engagement: HRSectionScore;
  pressure: HRSectionScore;
  storeHealth: number; // 0–100 composite
  riskAlerts: string[];
}

function riskLevel(score: number, inverse = false): 'low' | 'medium' | 'high' | 'critical' {
  const effective = inverse ? 100 - score : score;
  if (effective >= 80) return 'low';
  if (effective >= 60) return 'medium';
  if (effective >= 40) return 'high';
  return 'critical';
}

/**
 * Calculate all HR Audit scores from raw responses.
 * Responses keyed as "SectionId_QuestionId" → string value.
 */
export function calculateHRAuditScores(responses: Record<string, string>): HRAuditScores {
  const r = (key: string) => responses[key];

  // ── Team size (used for ratio normalization) ──
  const teamSize = Math.max(1, num(r('AttritionRisk_AR_6'))); // avoid /0

  // ── 1. Attrition Risk Score (higher = worse) ──
  const resignation = yn(r('AttritionRisk_AR_1'));
  const notice = yn(r('AttritionRisk_AR_2'));
  const absenteeismRatio = num(r('AttritionRisk_AR_3')) / teamSize;
  const lowTenureRatio = num(r('AttritionRisk_AR_4')) / teamSize;
  const highPerformerRisk = yn(r('AttritionRisk_AR_5'));

  const attritionRaw = clamp(
    resignation * 25 +
    notice * 20 +
    Math.min(absenteeismRatio, 1) * 15 +
    Math.min(lowTenureRatio, 1) * 15 +
    highPerformerRisk * 25
  );

  // ── 2. Capability Score (higher = better) ──
  const certifiedPct = (num(r('Capability_CA_1')) / teamSize) * 100;
  const supportPct = (num(r('Capability_CA_2')) / teamSize) * 100;
  const failurePct = (num(r('Capability_CA_3')) / teamSize) * 100;
  const serviceErrors = yn(r('Capability_CA_4'));     // yes = bad
  const newJoinersOk = yn(r('Capability_CA_5'));      // yes = good

  const capabilityRaw = clamp(
    Math.min(certifiedPct, 100) * 0.50 -
    Math.min(supportPct, 100) * 0.25 -
    Math.min(failurePct, 100) * 0.25 -
    serviceErrors * 10 +
    newJoinersOk * 10
  );

  // ── 3. Culture Score (higher = better) ──
  const teamRating = Math.min(5, num(r('Culture_CU_6')));
  const managerRating = Math.min(5, num(r('Culture_CU_7')));
  const conflict = yn(r('Culture_CU_1'));
  const policyViolation = yn(r('Culture_CU_2'));
  const favoritism = yn(r('Culture_CU_3'));
  const speakFreely = yn(r('Culture_CU_4'));
  const teamSupport = yn(r('Culture_CU_5'));

  const cultureRaw = clamp(
    (teamRating * 10) +
    (managerRating * 10) +
    (speakFreely * 10) +
    (teamSupport * 10) -
    (conflict * 20) -
    (policyViolation * 20) -
    (favoritism * 20)
  );

  // ── 4. Engagement Score (higher = better) ──
  const interaction = yn(r('Engagement_EN_1'));
  const participationPct = Math.min(100, num(r('Engagement_EN_2')));
  const disengaged = yn(r('Engagement_EN_3'));
  const ownership = yn(r('Engagement_EN_4'));
  const energy = Math.min(5, num(r('Engagement_EN_5')));

  const engagementRaw = clamp(
    (energy / 5) * 20 +
    ownership * 20 +
    interaction * 20 +
    participationPct * 0.40 -
    disengaged * 30
  );

  // ── 5. Pressure Index (higher = worse) ──
  const peak = yn(r('Pressure_PR_1'));
  const managerStress = yn(r('Pressure_PR_2'));
  const breakSkipped = yn(r('Pressure_PR_3'));
  const sopShortcuts = yn(r('Pressure_PR_4'));
  const frustration = yn(r('Pressure_PR_5'));

  const pressureRaw = clamp(
    peak * 20 +
    managerStress * 15 +
    breakSkipped * 25 +
    sopShortcuts * 20 +
    frustration * 20
  );

  // ── Master Store Health ──
  const storeHealth = Math.round(
    capabilityRaw * 0.25 +
    cultureRaw * 0.20 +
    engagementRaw * 0.20 +
    (100 - pressureRaw) * 0.20 +
    (100 - attritionRaw) * 0.15
  );

  // ── Risk Alerts (Prediction Engine) ──
  const riskAlerts: string[] = [];

  if (attritionRaw > 60 && engagementRaw < 50 && pressureRaw > 50) {
    riskAlerts.push('🚨 High Attrition Risk — attrition, engagement & pressure all flagged');
  }
  if (cultureRaw < 50 && managerRating < 3 && (conflict === 1 || favoritism === 1)) {
    riskAlerts.push('⚠️ Manager Risk — poor culture, low manager rating, conflict/favoritism');
  }
  if (capabilityRaw < 60 && pressureRaw > 50) {
    riskAlerts.push('📉 Performance Drop Risk — low capability under high pressure');
  }
  if (breakSkipped === 1 && energy < 3 && disengaged === 1) {
    riskAlerts.push('🔥 Burnout Risk — breaks skipped, low energy, disengagement');
  }

  return {
    attritionRisk: { score: Math.round(attritionRaw), label: 'Attrition Risk', riskLevel: riskLevel(attritionRaw, true) },
    capability:    { score: Math.round(capabilityRaw), label: 'Capability', riskLevel: riskLevel(capabilityRaw) },
    culture:       { score: Math.round(cultureRaw), label: 'Culture', riskLevel: riskLevel(cultureRaw) },
    engagement:    { score: Math.round(engagementRaw), label: 'Engagement', riskLevel: riskLevel(engagementRaw) },
    pressure:      { score: Math.round(pressureRaw), label: 'Pressure', riskLevel: riskLevel(pressureRaw, true) },
    storeHealth,
    riskAlerts,
  };
}
