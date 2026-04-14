/**
 * PRE-LAUNCH AUDIT CHECKLIST QUESTIONS
 * Complete question set for Pre-Launch store audits
 * 
 * Scoring Logic:
 * - All questions: Compliant (2), Partially Compliant (1), Not Compliant (0), NA (excluded from total)
 * 
 * Total Possible Score: 80 points (40 questions × 2 points each)
 * - Pre Launch Checklist: 80 points (40 questions × 2 points)
 */

import { QAQuestion, QASection } from './qaQuestions';

export const PRE_LAUNCH_SECTIONS: QASection[] = [
  {
    id: 'PreLaunchChecklist',
    title: 'Pre Launch Checklist',
    maxScore: 80,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'PL_1', q: 'Staff medicals to be completed before the launch for new joinees', w: 2 },
      { id: 'PL_2', q: 'Golden rules (FSDB) displayed prominently in A3 size frame', w: 2 },
      { id: 'PL_3', q: 'All FSA material (Shelf life chart, Dilution chart, checklist) available before launch', w: 2 },
      { id: 'PL_4', q: 'At least one FoSTaC holder employee', w: 2 },
      { id: 'PL_5', q: 'Flaking paint on walls and ceiling checked in production & customer area', w: 2 },
      { id: 'PL_6', q: 'No dampness on inner walls', w: 2 },
      { id: 'PL_7', q: 'Shatter-proof lighting at 540 lux in food prep area', w: 2 },
      { id: 'PL_8', q: 'Electrical socket gaps covered; heavy-duty plugs installed properly', w: 2 },
      { id: 'PL_9', q: 'Foot/elbow operated sink system for hand washing', w: 2 },
      { id: 'PL_10', q: 'Fire extinguishers and fire blanket in processing area', w: 2 },
      { id: 'PL_11', q: 'Fire alarm checked', w: 2 },
      { id: 'PL_12', q: 'First-aid box available', w: 2 },
      { id: 'PL_13', q: 'Hot water facility for washing utensils/equipment', w: 2 },
      { id: 'PL_14', q: 'No condensation dripping in fridge/chiller/freezer', w: 2 },
      { id: 'PL_15', q: 'Ice cube machine working condition', w: 2 },
      { id: 'PL_16', q: 'Water flow rate and connections checked', w: 2 },
      { id: 'PL_17', q: 'Screws/bolts checked—no rust/loose/fall risk', w: 2 },
      { id: 'PL_18', q: 'All lights working properly', w: 2 },
      { id: 'PL_19', q: 'Smallware items available for veg & non-veg', w: 2 },
      { id: 'PL_20', q: 'Airtight containers for raw material storage', w: 2 },
      { id: 'PL_21', q: 'Packaging & storage area with sufficient racks', w: 2 },
      { id: 'PL_22', q: 'Thermometer and TDS meter available', w: 2 },
      { id: 'PL_23', q: 'Measuring cylinders available', w: 2 },
      { id: 'PL_24', q: 'Pedal-operated garbage bins (wet & dry)', w: 2 },
      { id: 'PL_25', q: 'Store signages displayed', w: 2 },
      { id: 'PL_26', q: 'No garbage/debris accumulation outside store', w: 2 },
      { id: 'PL_27', q: 'Complete store deep cleaning & sanitation done', w: 2 },
      { id: 'PL_28', q: 'First pest control fumigation completed', w: 2 },
      { id: 'PL_29', q: 'Air curtain/strip curtains installed', w: 2 },
      { id: 'PL_30', q: 'Drains properly covered', w: 2 },
      { id: 'PL_31', q: 'Pest control devices installed (fly lights, rodent box etc.)', w: 2 },
      { id: 'PL_32', q: 'Door fitted with proper closer', w: 2 },
      { id: 'PL_33', q: 'Gaps between pipes, vents, walls sealed', w: 2 },
      { id: 'PL_34', q: 'No external openings OR mesh installed', w: 2 },
      { id: 'PL_35', q: 'Designated storage for chemicals & personal belongings', w: 2 },
      { id: 'PL_36', q: 'Furniture in good condition', w: 2 },
      { id: 'PL_37', q: 'Walls/graphics clean, no damage/stains', w: 2 },
      { id: 'PL_38', q: 'Rubber mats provided', w: 2 },
      { id: 'PL_39', q: 'All signages (handwash, push/pull etc.) in place', w: 2 },
      { id: 'PL_40', q: 'Cleaning chemicals available & not expired', w: 2 }
    ]
  }
];

/**
 * Lookup map: questionId (e.g. "PreLaunchChecklist_PL_1") → full question text
 */
export const PRE_LAUNCH_QUESTION_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const section of PRE_LAUNCH_SECTIONS) {
    for (const item of section.items) {
      map[`${section.id}_${item.id}`] = item.q;
    }
  }
  return map;
})();

/**
 * Calculate pre-launch audit score from responses
 */
export function calculatePreLaunchScore(responses: Record<string, string>): {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  sectionScores: Record<string, { score: number; maxScore: number }>;
} {
  let totalScore = 0;
  let maxScore = 0;
  const sectionScores: Record<string, { score: number; maxScore: number }> = {};

  PRE_LAUNCH_SECTIONS.forEach(section => {
    let sectionScore = 0;
    let sectionMax = 0;

    section.items.forEach(item => {
      const responseKey = `${section.id}_${item.id}`;
      const response = responses[responseKey];

      if (response !== 'na' && response) {
        sectionMax += item.w;
        if (response === 'compliant') {
          sectionScore += item.w;
        } else if (response === 'partially-compliant') {
          sectionScore += Math.floor(item.w / 2);
        }
      }
    });

    sectionScores[section.id] = { score: sectionScore, maxScore: sectionMax };
    totalScore += sectionScore;
    maxScore += sectionMax;
  });

  const percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    totalScore,
    maxScore,
    percentageScore,
    sectionScores
  };
}
