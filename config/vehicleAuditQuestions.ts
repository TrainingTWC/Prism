/**
 * VEHICLE AUDIT CHECKLIST QUESTIONS
 * Complete question set for cold-chain & hygiene compliance audits on delivery vehicles
 *
 * Scoring Logic:
 * - All questions: Compliant (2), Partially Compliant (1), Not Compliant (0), NA (excluded from total)
 *
 * Total Possible Score: 50 points (25 questions × 2 points each)
 * IDs match the GAS script: VA_1 … VA_25
 */

import { QAQuestion, QASection } from './qaQuestions';

export const VEHICLE_AUDIT_SECTIONS: QASection[] = [
  {
    id: 'VA_Vehicle',
    title: 'Vehicle & Driver',
    maxScore: 12,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VA_1', q: 'Vehicle has proper number plate displayed.', w: 2 },
      { id: 'VA_2', q: 'Driver name mentioned on the vehicle/trip sheet.', w: 2 },
      { id: 'VA_3', q: 'Driver holds a valid driving license.', w: 2 },
      { id: 'VA_4', q: 'Delivery assistant follows hygiene protocols.', w: 2 },
      { id: 'VA_5', q: 'No rough handling of crates during loading/unloading.', w: 2 },
      { id: 'VA_6', q: 'No crate damage observed during handling.', w: 2 },
    ],
  },
  {
    id: 'VA_Hygiene',
    title: 'Vehicle Hygiene & Condition',
    maxScore: 18,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VA_7',  q: 'Safety seal intact on all consignments.', w: 2 },
      { id: 'VA_8',  q: 'Digital temperature display available and functional.', w: 2 },
      { id: 'VA_9',  q: 'Strip curtains clean and in good condition.', w: 2 },
      { id: 'VA_10', q: 'No odour detected inside vehicle.', w: 2 },
      { id: 'VA_11', q: 'Vehicle internal surfaces are clean.', w: 2 },
      { id: 'VA_12', q: 'No pest signs observed inside vehicle.', w: 2 },
      { id: 'VA_13', q: 'No openings that could expose food to contamination.', w: 2 },
      { id: 'VA_14', q: 'No rust or shredding inside the vehicle.', w: 2 },
      { id: 'VA_15', q: 'Refrigerated items maintained at ≤5°C.', w: 2 },
    ],
  },
  {
    id: 'VA_FoodSafety',
    title: 'Food Safety & Segregation',
    maxScore: 14,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VA_16', q: 'Frozen items maintained at ≤ −18°C.', w: 2 },
      { id: 'VA_17', q: 'Food received in clean crates.', w: 2 },
      { id: 'VA_18', q: 'Veg and non-veg items properly segregated.', w: 2 },
      { id: 'VA_19', q: 'Food and non-food items separated.', w: 2 },
      { id: 'VA_20', q: 'No leakage or breakage of packages observed.', w: 2 },
      { id: 'VA_21', q: 'No hazardous items stored with food.', w: 2 },
      { id: 'VA_22', q: 'Trip sheet available and correctly filled.', w: 2 },
    ],
  },
  {
    id: 'VA_Records',
    title: 'Records & Documentation',
    maxScore: 6,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VA_23', q: 'Temperature logs available and up to date.', w: 2 },
      { id: 'VA_24', q: 'Vehicle cleaning records available.', w: 2 },
      { id: 'VA_25', q: 'Pest control records for vehicle available.', w: 2 },
    ],
  },
];

/**
 * Lookup map: questionId → full question text
 */
export const VEHICLE_AUDIT_QUESTION_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const section of VEHICLE_AUDIT_SECTIONS) {
    for (const item of section.items) {
      map[item.id] = item.q;
    }
  }
  return map;
})();

export const VEHICLE_AUDIT_ALL_IDS: string[] = VEHICLE_AUDIT_SECTIONS.flatMap(s => s.items.map(i => i.id));
