/**
 * CF AUDIT CHECKLIST QUESTIONS
 * Complete question set for Central Kitchen / Fulfilment Centre (CF) food safety audits
 *
 * Scoring Logic:
 * - All questions: Compliant (2), Partially Compliant (1), Not Compliant (0), NA (excluded from total)
 *
 * Total Possible Score: 96 points (48 questions × 2 points each)
 * IDs match the GAS script: CF_1 … CF_48
 */

import { QAQuestion, QASection } from './qaQuestions';

export const CF_AUDIT_SECTIONS: QASection[] = [
  {
    id: 'CF_Licensing',
    title: 'Licensing & Compliance',
    maxScore: 4,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'CF_1', q: 'Food establishment has valid FSSAI license displayed.', w: 2 },
      { id: 'CF_2', q: 'No expired food products; proper date tagging in place.', w: 2 },
    ],
  },
  {
    id: 'CF_Premises',
    title: 'Premises & Infrastructure',
    maxScore: 24,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'CF_3',  q: 'No pest activity observed on premises.', w: 2 },
      { id: 'CF_4',  q: 'Premises design allows cleaning and prevents contamination.', w: 2 },
      { id: 'CF_5',  q: 'Internal structure made of non-toxic material.', w: 2 },
      { id: 'CF_6',  q: 'Walls and ceilings free from damage and peeling.', w: 2 },
      { id: 'CF_7',  q: 'Floors are non-absorbent and non-slippery.', w: 2 },
      { id: 'CF_8',  q: 'Windows are insect-proofed.', w: 2 },
      { id: 'CF_9',  q: 'Doors prevent pest entry.', w: 2 },
      { id: 'CF_10', q: 'Potable water used (IS 10500 standards).', w: 2 },
      { id: 'CF_11', q: 'Equipment is food-grade and cleanable.', w: 2 },
      { id: 'CF_12', q: 'Adequate refrigeration facilities available.', w: 2 },
      { id: 'CF_13', q: 'Proper lighting with protection in food areas.', w: 2 },
      { id: 'CF_14', q: 'Adequate ventilation maintained.', w: 2 },
    ],
  },
  {
    id: 'CF_Storage',
    title: 'Storage & Procurement',
    maxScore: 8,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'CF_15', q: 'Storage facility available and organised.', w: 2 },
      { id: 'CF_16', q: 'Hygiene facilities available for staff.', w: 2 },
      { id: 'CF_17', q: 'Food testing records available and up to date.', w: 2 },
      { id: 'CF_18', q: 'Approved vendors and procurement records maintained.', w: 2 },
    ],
  },
  {
    id: 'CF_Operations',
    title: 'Food Handling & Operations',
    maxScore: 26,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'CF_19', q: 'Raw material inspection conducted at receiving.', w: 2 },
      { id: 'CF_20', q: 'Proper storage practices followed (FIFO/FEFO, temperature control).', w: 2 },
      { id: 'CF_21', q: 'Raw materials cleaned before preparation.', w: 2 },
      { id: 'CF_22', q: 'Segregation of veg/non-veg and raw/cooked maintained.', w: 2 },
      { id: 'CF_23', q: 'Equipment sanitized before and after use.', w: 2 },
      { id: 'CF_24', q: 'Proper thawing practices followed.', w: 2 },
      { id: 'CF_25', q: 'Cooking and reheating records maintained.', w: 2 },
      { id: 'CF_26', q: 'Hygienic portioning practices in place.', w: 2 },
      { id: 'CF_27', q: 'Hot holding temperature maintained (≥63°C).', w: 2 },
      { id: 'CF_28', q: 'Proper reheating practices followed.', w: 2 },
      { id: 'CF_29', q: 'Oil quality monitored and recorded.', w: 2 },
      { id: 'CF_30', q: 'Packaging material is food-grade.', w: 2 },
      { id: 'CF_31', q: 'Cleaning schedule followed and records maintained.', w: 2 },
    ],
  },
  {
    id: 'CF_Maintenance',
    title: 'Maintenance & Pest Control',
    maxScore: 10,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'CF_32', q: 'Preventive maintenance carried out as scheduled.', w: 2 },
      { id: 'CF_33', q: 'Equipment calibration done and records available.', w: 2 },
      { id: 'CF_34', q: 'Pest control program available and implemented.', w: 2 },
      { id: 'CF_35', q: 'No signs of pest infestation found.', w: 2 },
      { id: 'CF_36', q: 'Drain systems functional and free from blockage.', w: 2 },
    ],
  },
  {
    id: 'CF_WasteHygiene',
    title: 'Waste & Chemical Management',
    maxScore: 6,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'CF_37', q: 'Waste removed regularly and disposed of properly.', w: 2 },
      { id: 'CF_38', q: 'Housekeeping chemicals stored properly and away from food.', w: 2 },
      { id: 'CF_39', q: 'Medical records of all food-handling staff maintained.', w: 2 },
    ],
  },
  {
    id: 'CF_Personnel',
    title: 'Personnel Hygiene',
    maxScore: 8,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'CF_40', q: 'No sick staff handling food.', w: 2 },
      { id: 'CF_41', q: 'Personal hygiene standards maintained by staff.', w: 2 },
      { id: 'CF_42', q: 'Proper protective gear used by staff.', w: 2 },
      { id: 'CF_43', q: 'Internal audits conducted as per schedule.', w: 2 },
    ],
  },
  {
    id: 'CF_Documentation',
    title: 'Documentation & Training',
    maxScore: 10,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'CF_44', q: 'Complaint redressal system exists and is functional.', w: 2 },
      { id: 'CF_45', q: 'Staff trained in food safety practices.', w: 2 },
      { id: 'CF_46', q: 'Documentation maintained and available for review.', w: 2 },
      { id: 'CF_47', q: 'First aid kit available and stocked.', w: 2 },
      { id: 'CF_48', q: 'Fire safety equipment available and not expired.', w: 2 },
    ],
  },
];

/**
 * Lookup map: questionId (e.g. "CF_Premises_CF_3") → full question text
 */
export const CF_AUDIT_QUESTION_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const section of CF_AUDIT_SECTIONS) {
    for (const item of section.items) {
      map[item.id] = item.q;
    }
  }
  return map;
})();

export const CF_AUDIT_ALL_IDS: string[] = CF_AUDIT_SECTIONS.flatMap(s => s.items.map(i => i.id));
