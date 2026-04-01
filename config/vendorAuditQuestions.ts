/**
 * VENDOR AUDIT CHECKLIST QUESTIONS
 * Complete question set for Vendor / Food Establishment audits
 * 
 * Scoring Logic:
 * - Zero Tolerance: Compliant/Non-Compliant (if any Non-Compliant, entire audit = 0)
 * - Other Sections: Compliant (2), Partially Compliant (1), Not Compliant (0), NA (excluded from total)
 * 
 * Total Possible Score: 124 points (excluding Zero Tolerance)
 * - Zero Tolerance: 6 points (3 questions × 2 points, binary pass/fail)
 * - Design & Facilities: 32 points (16 questions × 2 points)
 * - Control of Operation: 44 points (22 questions × 2 points)
 * - Cleaning & Sanitation: 10 points (5 questions × 2 points)
 * - Pest Control: 4 points (2 questions × 2 points)
 * - Personal Hygiene: 8 points (4 questions × 2 points)
 * - Maintenance: 4 points (2 questions × 2 points)
 * - Documentation: 10 points (5 questions × 2 points)
 * - General Safety: 8 points (4 questions × 2 points)
 */

import { QAQuestion, QASection } from './qaQuestions';

export const VENDOR_AUDIT_SECTIONS: QASection[] = [
  {
    id: 'VA_ZeroTolerance',
    title: 'Zero Tolerance',
    maxScore: 6,
    options: ['compliant', 'non-compliant'],
    items: [
      { id: 'VZT_1', q: 'Food establishment has an updated FSSAI license and is displayed at a prominent location.', w: 2 },
      { id: 'VZT_2', q: 'No expired food products in the facility, and all food products are marked with clear date tags.', w: 2 },
      { id: 'VZT_3', q: 'No signs of pest activity or infestation in premises (eggs, larvae, faeces etc.).', w: 2 }
    ]
  },
  {
    id: 'VA_DesignFacilities',
    title: 'Design & Facilities',
    maxScore: 32,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VDF_1', q: 'The design of food premises provides adequate working space; permits maintenance & cleaning to prevent entry of dirt, dust & pests.', w: 2 },
      { id: 'VDF_2', q: 'Internal structure & fittings are made of non-toxic and impermeable material.', w: 2 },
      { id: 'VDF_3', q: 'Walls, ceilings & doors are free from flaking paint or plaster, condensation & shedding particles.', w: 2 },
      { id: 'VDF_4', q: 'Floors are non-absorbent, non-slippery & sloped appropriately.', w: 2 },
      { id: 'VDF_5', q: 'Windows are kept closed & fitted with insect proof screen when opening to external environment.', w: 2 },
      { id: 'VDF_6', q: 'Doors are smooth and non-absorbent; precautions taken to prevent entry of pests.', w: 2 },
      { id: 'VDF_7', q: 'Potable water (meeting IS:10500 standards & tested semi-annually) is used with records maintained.', w: 2 },
      { id: 'VDF_8', q: 'Equipment and containers are non-toxic, impervious, non-corrosive and easy to clean & disinfect.', w: 2 },
      { id: 'VDF_9', q: 'Adequate facilities for heating, cooling, refrigeration and freezing food & monitoring temperature.', w: 2 },
      { id: 'VDF_10', q: 'Premise has sufficient lighting; fixtures protected to prevent contamination on breakage.', w: 2 },
      { id: 'VDF_11', q: 'Adequate ventilation is provided within the premises.', w: 2 },
      { id: 'VDF_12', q: 'Adequate storage facility for food, packaging materials, chemicals, personnel items etc.', w: 2 },
      { id: 'VDF_13', q: 'Personnel hygiene facilities available (hand washing, toilets, change rooms).', w: 2 },
      { id: 'VDF_14', q: 'Food material is tested via internal or accredited lab; records available.', w: 2 },
      { id: 'VDF_15', q: 'Air curtains/strip curtains fixed wherever necessary.', w: 2 },
      { id: 'VDF_16', q: 'Drains are designed to meet expected flow loads.', w: 2 }
    ]
  },
  {
    id: 'VA_ControlOfOperation',
    title: 'Control of Operation',
    maxScore: 44,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VCO_1', q: 'Incoming material is procured as per specifications from approved vendors with records.', w: 2 },
      { id: 'VCO_2', q: 'Raw materials are inspected at the time of receiving for food safety hazards.', w: 2 },
      { id: 'VCO_3', q: 'Materials/products stored as per temperature requirements; FIFO & FEFO practiced.', w: 2 },
      { id: 'VCO_4', q: 'Raw materials are cleaned thoroughly before food preparation.', w: 2 },
      { id: 'VCO_5', q: 'Separate equipment and preparation areas used to avoid cross-contamination.', w: 2 },
      { id: 'VCO_6', q: 'Equipment is adequately sanitized before and after food preparation.', w: 2 },
      { id: 'VCO_7', q: 'Frozen food is thawed hygienically; no thawed food stored for later use.', w: 2 },
      { id: 'VCO_8', q: 'Cooking/baking/reheating processes recorded.', w: 2 },
      { id: 'VCO_9', q: 'Food portioning done in hygienic conditions.', w: 2 },
      { id: 'VCO_10', q: 'Hot food intended for consumption is held at 65°C; non-veg at 70°C.', w: 2 },
      { id: 'VCO_11', q: 'Reheating done properly (core temp reaches 75°C for at least 2 minutes).', w: 2 },
      { id: 'VCO_12', q: 'Oil used is suitable and periodically verified (colour, flavour, floated elements).', w: 2 },
      { id: 'VCO_13', q: 'Transport vehicles are clean, maintained and maintain required temperature.', w: 2 },
      { id: 'VCO_14', q: 'Food and non-food transported together are adequately separated.', w: 2 },
      { id: 'VCO_15', q: 'Packaging material is clean and food-grade.', w: 2 },
      { id: 'VCO_16', q: 'Food containers are properly covered to prevent contamination.', w: 2 },
      { id: 'VCO_17', q: 'Water storage tanks cleaned periodically; records maintained; potable pipes identifiable.', w: 2 },
      { id: 'VCO_18', q: 'Segregation for raw, processed, rejected, recalled or returned materials.', w: 2 },
      { id: 'VCO_19', q: 'Raw materials and food stored separately from packaging, stationery, hardware.', w: 2 },
      { id: 'VCO_20', q: 'Food stored on racks/pallets above floor and away from walls.', w: 2 },
      { id: 'VCO_21', q: 'Fruits & vegetables washed in potable water; ready-to-eat treated appropriately.', w: 2 },
      { id: 'VCO_22', q: 'Raw and processed meat separated from other foods.', w: 2 }
    ]
  },
  {
    id: 'VA_CleaningSanitation',
    title: 'Cleaning & Sanitation',
    maxScore: 10,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VCS_1', q: 'Cleaning of equipment and premises done as per schedule; no stagnation of water.', w: 2 },
      { id: 'VCS_2', q: 'Food waste and refuse removed periodically.', w: 2 },
      { id: 'VCS_3', q: 'Housekeeping materials stored properly; MSDS and dilution charts available.', w: 2 },
      { id: 'VCS_4', q: 'Delivery bags/packages clean and in good repair condition.', w: 2 },
      { id: 'VCS_5', q: 'Equipment placed away from walls to allow proper cleaning.', w: 2 }
    ]
  },
  {
    id: 'VA_PestControl',
    title: 'Pest Control',
    maxScore: 4,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VPC_1', q: 'Pest control program available and carried out by trained personnel; records available.', w: 2 },
      { id: 'VPC_2', q: 'Entry points (holes, drains etc.) sealed or protected to prevent pest access.', w: 2 }
    ]
  },
  {
    id: 'VA_PersonalHygiene',
    title: 'Personal Hygiene',
    maxScore: 8,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VPH_1', q: 'Annual medical examination & vaccination of food handlers conducted; records available.', w: 2 },
      { id: 'VPH_2', q: 'No person with illness, wounds or burns handles food.', w: 2 },
      { id: 'VPH_3', q: 'Food handlers maintain personal cleanliness and hygiene practices.', w: 2 },
      { id: 'VPH_4', q: 'Food handlers equipped with appropriate protective gear.', w: 2 }
    ]
  },
  {
    id: 'VA_Maintenance',
    title: 'Maintenance',
    maxScore: 4,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VM_1', q: 'Preventive maintenance of equipment and machinery carried out as per manufacturer instructions.', w: 2 },
      { id: 'VM_2', q: 'Measuring and monitoring devices calibrated periodically.', w: 2 }
    ]
  },
  {
    id: 'VA_Documentation',
    title: 'Documentation',
    maxScore: 10,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VD_1', q: 'Internal / external audits conducted periodically; records available.', w: 2 },
      { id: 'VD_2', q: 'Consumer complaints redressal mechanism exists.', w: 2 },
      { id: 'VD_3', q: 'Periodic assessment of training effectiveness and food safety awareness.', w: 2 },
      { id: 'VD_4', q: 'Documentation and records retained for required duration.', w: 2 },
      { id: 'VD_5', q: 'HACCP plan implemented and maintained.', w: 2 }
    ]
  },
  {
    id: 'VA_GeneralSafety',
    title: 'General Safety',
    maxScore: 8,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'VGS_1', q: 'First aid kit available with required medicines; no expired items.', w: 2 },
      { id: 'VGS_2', q: 'Emergency exit doors and corridors are clear.', w: 2 },
      { id: 'VGS_3', q: 'Sprinklers and smoke alarms are operational.', w: 2 },
      { id: 'VGS_4', q: 'Fire extinguishers are functional and within validity.', w: 2 }
    ]
  }
];

/**
 * Lookup map: questionId (e.g. "VA_ZeroTolerance_VZT_1") → full question text
 */
export const VENDOR_AUDIT_QUESTION_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const section of VENDOR_AUDIT_SECTIONS) {
    for (const item of section.items) {
      map[`${section.id}_${item.id}`] = item.q;
    }
  }
  return map;
})();

/**
 * Calculate vendor audit score from responses
 */
export function calculateVendorAuditScore(responses: Record<string, string>): {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  sectionScores: Record<string, { score: number; maxScore: number }>;
  zeroToleranceFailed: boolean;
} {
  let totalScore = 0;
  let maxScore = 0;
  let zeroToleranceFailed = false;
  const sectionScores: Record<string, { score: number; maxScore: number }> = {};

  VENDOR_AUDIT_SECTIONS.forEach(section => {
    let sectionScore = 0;
    let sectionMax = 0;

    section.items.forEach(item => {
      const responseKey = `${section.id}_${item.id}`;
      const response = responses[responseKey];

      if (section.id === 'VA_ZeroTolerance') {
        if (response === 'non-compliant') {
          zeroToleranceFailed = true;
        }
        if (response !== 'na' && response) {
          sectionMax += item.w;
          if (response === 'compliant') {
            sectionScore += item.w;
          }
        }
      } else {
        if (response !== 'na' && response) {
          sectionMax += item.w;
          if (response === 'compliant') {
            sectionScore += item.w;
          } else if (response === 'partially-compliant') {
            sectionScore += Math.floor(item.w / 2);
          }
        }
      }
    });

    sectionScores[section.id] = { score: sectionScore, maxScore: sectionMax };
    totalScore += sectionScore;
    maxScore += sectionMax;
  });

  if (zeroToleranceFailed) {
    totalScore = 0;
  }

  const percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    totalScore,
    maxScore,
    percentageScore,
    sectionScores,
    zeroToleranceFailed
  };
}
