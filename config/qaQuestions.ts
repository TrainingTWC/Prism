/**
 * QA CHECKLIST QUESTIONS
 * Complete question set for Quality Assurance audits
 * 
 * Scoring Logic:
 * - Zero Tolerance: Compliant/Non-Compliant (if any Non-Compliant, entire audit = 0)
 * - Other Sections: Compliant (2), Partially Compliant (1), Not Compliant (0), NA (excluded from total)
 * 
 * Total Possible Score: 206 points
 * - Zero Tolerance: 24 points (6 questions × 4 points, but binary pass/fail)
 * - Store: 155 points (94 questions, mostly 2 points each, some 1 point)
 * - Maintenance: 17 points (11 questions, mostly 2 points, some different weights)
 * - A: 6 points (3 questions × 2 points)
 * - HR: 4 points (2 questions × 2 points)
 */

export interface QAQuestion {
  id: string;
  q: string;  // Question text
  w: number;  // Weight/points
}

export interface QASection {
  id: string;
  title: string;
  maxScore: number;  // Maximum possible score for this section
  items: QAQuestion[];
  options: string[];  // Valid response options for this section
}

export const QA_SECTIONS: QASection[] = [
  {
    id: 'ZeroTolerance',
    title: 'Zero Tolerance',
    maxScore: 24,
    options: ['compliant', 'non-compliant'],
    items: [
      { id: 'ZT_1', q: 'No expired food products in the café, and all food products are marked with clear date tags (MRD).', w: 4 },
      { id: 'ZT_2', q: 'The product shall comply with the secondary shelf life for critical products like chicken, paneer, sauces, chilled, frozen, and composite products.', w: 4 },
      { id: 'ZT_3', q: 'All food products should be stored according to the appropriate storage conditions (Frozen, Chilled, and Ambient).', w: 4 },
      { id: 'ZT_4', q: 'RO/Mineral water TDS must be between 50 to 150 ±10 ppm that is being used for processing inside the café. If the TDS is not within the acceptable range, the water must not be used for processing.', w: 4 },
      { id: 'ZT_5', q: 'Temperature sensitive food items shall not be transferred to the other store in the uncontrolled medium.', w: 4 },
      { id: 'ZT_6', q: 'No live pest activity, including but not limited to rodents, rats, cockroaches, and spiders, was seen inside the café.', w: 4 }
    ]
  },
  {
    id: 'Store',
    title: 'Store',
    maxScore: 188,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'S_1', q: 'No junk material, wastage, unused & dump materials found in or around the store.', w: 2 },
      { id: 'S_2', q: 'The action plans for previous audit non-conformities (NCs) were shared on time in approved CAPA format, and all audit gaps have been closed.', w: 2 },
      { id: 'S_3', q: 'Dishwasher and sink area checked for cleanliness, odor, leakage, etc.', w: 2 },
      { id: 'S_4', q: 'Glass doors, cupboards, shelves and area behind equipment are clean and undamaged.', w: 2 },
      { id: 'S_5', q: 'Area below shelves and machinery is clean and free of dust or waste.', w: 2 },
      { id: 'S_6', q: 'Customer tables and chairs are in good condition and free of stains or damage.', w: 2 },
      { id: 'S_7', q: 'Customer area organized and clean without dust/stains.', w: 2 },
      { id: 'S_8', q: 'Food & packaging material not stored on the floor.', w: 2 },
      { id: 'S_9', q: 'Food-contact materials and containers are clean, non-toxic, and corrosion-free.', w: 2 },
      { id: 'S_10', q: 'Segregated materials (knives, cutting boards) are color-coded as veg/non-veg and clean.', w: 2 },
      { id: 'S_11', q: 'Glasses clean and arranged upside down in clean racks.', w: 2 },
      { id: 'S_12', q: 'Equipment cleaned per SOP at close of business.', w: 2 },
      { id: 'S_13', q: 'Chiller/freezer temperatures maintained as per standards (Chiller 1–5°C, Freezer –18°C).', w: 2 },
      { id: 'S_14', q: 'Merrychef inner body checked for food particles, rust, and filter cleanliness.', w: 2 },
      { id: 'S_15', q: 'Microwaves, grillers, coffee makers, and food warmers are operational and clean.', w: 2 },
      { id: 'S_16', q: 'Coffee machine and grinder are operational, clean, and in good condition.', w: 2 },
      { id: 'S_17', q: 'Shakers and funnels are clean and without food accumulation.', w: 2 },
      { id: 'S_18', q: 'Portafilter is clean and in good condition.', w: 2 },
      { id: 'S_19', q: 'Small wares (scoops, knives, spatulas, tongs) are clean and undamaged.', w: 2 },
      { id: 'S_20', q: 'UTF Holder, jackets, pouches & filling nozzle stored off the floor, no dust accumulation.', w: 2 },
      { id: 'S_21', q: 'Paper cups, straws, syrups, tissues, and sauces neatly placed and available.', w: 2 },
      { id: 'S_22', q: 'Freezer, FDU, and chillers are clean.', w: 2 },
      { id: 'S_23', q: 'Ice cube box/machine/scooper are clean and dry; transfer in/out done in controlled condition.', w: 2 },
      { id: 'S_24', q: 'Mixer, blender, BPR, and jars cleaned, washed, and stored inverted.', w: 2 },
      { id: 'S_25', q: 'Housekeeping materials hung separately away from food prep area.', w: 2 },
      { id: 'S_26', q: 'Floor mat cleaned adequately.', w: 2 },
      { id: 'S_27', q: 'Bar mat cleaned adequately.', w: 2 },
      { id: 'S_28', q: 'Carry bag clean and in good condition.', w: 2 },
      { id: 'S_29', q: 'RO machine, tank, and pipelines are clean and in working order.', w: 2 },
      { id: 'S_30', q: 'Food and non-food materials stored separately.', w: 2 },
      { id: 'S_31', q: 'FDU temperature verified and within 0–5°C.', w: 2 },
      { id: 'S_32', q: 'In-process food items held in clean containers with visible MRD tags per SOP.', w: 2 },
      { id: 'S_33', q: 'Veg/non-veg & raw/cooked product segregation maintained during storage and handling.', w: 2 },
      { id: 'S_34', q: 'Expired/rejected/dumped items labeled "Do Not Use" or "Expired" and kept separate.', w: 2 },
      { id: 'S_35', q: 'No carton boxes in production area except milk boxes.', w: 2 },
      { id: 'S_36', q: 'No objectionable items in store (broken tools, unused equipment, etc.).', w: 2 },
      { id: 'S_37', q: 'Food waste and other waste removed daily to avoid accumulation.', w: 2 },
      { id: 'S_38', q: 'Partner well-groomed (cap, T-shirt, apron, badge, trousers).', w: 2 },
      { id: 'S_39', q: 'Personal hygiene of staff maintained (hair, nails, shaving, no infections/jewelry).', w: 2 },
      { id: 'S_40', q: 'Handwashing procedures followed, sanitizer used.', w: 2 },
      { id: 'S_41', q: 'Visitors follow basic safety measures before entering food area.', w: 2 },
      { id: 'S_42', q: 'Personal belongings arranged separately from food/packaging.', w: 2 },
      { id: 'S_43', q: 'Gloves used during food handling and changed after every use.', w: 2 },
      { id: 'S_44', q: 'First aid kit available with non-expired medicines.', w: 2 },
      { id: 'S_45', q: 'No unauthorized visitors.', w: 2 },
      { id: 'S_46', q: 'New recipes and shelf-life charts available and followed.', w: 2 },
      { id: 'S_47', q: 'FMCG/Impulse range clean, FSSAI-compliant, FEFO maintained.', w: 2 },
      { id: 'S_48', q: 'Proper segregation of raw/cooked, veg/non-veg food.', w: 2 },
      { id: 'S_49', q: 'All ingredients/products received from approved vendors.', w: 2 },
      { id: 'S_50', q: 'Two beverages cross-verified with BRM.', w: 2 },
      { id: 'S_51', q: 'Weight, appearance, and filling of two products verified with FRM/food tag.', w: 2 },
      { id: 'S_52', q: 'No products repackaged or sealed with insulation tapes, rubber bands, or staples.', w: 2 },
      { id: 'S_53', q: 'Measuring tools available, clean, and used for food prep/filling.', w: 2 },
      { id: 'S_54', q: 'Packaging/wrapping material in contact with food is clean and food-grade.', w: 2 },
      { id: 'S_55', q: 'Espresso sensory aspects (taste, crema, texture, temperature) evaluated.', w: 2 },
      { id: 'S_56', q: 'No pest infestation observed; evidence of effective pest control available.', w: 2 },
      { id: 'S_57', q: 'MSDS available for all pest control chemicals.', w: 2 },
      { id: 'S_58', q: 'Pest control layout available and traps/fly catchers placed as per layout.', w: 2 },
      { id: 'S_59', q: 'Approved chemicals labeled and stored away from food area.', w: 2 },
      { id: 'S_60', q: 'Dilution charts readily available.', w: 2 },
      { id: 'S_61', q: 'MSDS reports for all cleaning chemicals available.', w: 2 },
      { id: 'S_62', q: 'Spray guns labeled and available.', w: 2 },
      { id: 'S_63', q: 'Dustbins kept closed, clean, and segregated (wet, dry, surgical).', w: 2 },
      { id: 'S_64', q: 'Waste not kept in BOH; disposed hygienically.', w: 2 },
      { id: 'S_65', q: 'Washroom clean and checklist maintained.', w: 2 },
      { id: 'S_66', q: 'Magic box inside BOH clean and in good condition.', w: 2 },
      { id: 'S_67', q: 'Cleaning of utensils and equipment done per schedule.', w: 2 },
      { id: 'S_68', q: 'No water stagnation in food zones.', w: 2 },
      { id: 'S_69', q: 'Staff aware of fire extinguisher usage.', w: 2 },
      { id: 'S_70', q: 'Team adheres to SOPs, recipes, hygiene, grooming, pest control, etc.', w: 2 },
      { id: 'S_71', q: 'Receiving temperatures noted using probe and recorded in app.', w: 2 },
      { id: 'S_72', q: 'Food transport vehicles clean, maintained, and temperature-checked.', w: 2 },
      { id: 'S_73', q: 'Temperature monitoring records updated in Terotam app.', w: 2 },
      { id: 'S_74', q: 'Measuring/monitoring devices calibrated periodically.', w: 2 },
      { id: 'S_75', q: 'Food handlers trained to handle food safely; training records available.', w: 2 },
      { id: 'S_76', q: 'Personal hygiene verification record updated.', w: 2 },
      { id: 'S_77', q: 'Documentation and records available and retained for at least one year.', w: 2 },
      { id: 'S_78', q: 'Pest control job card/record updated.', w: 2 },
      { id: 'S_79', q: 'Raw materials used on FIFO and FEFO basis.', w: 2 },
      { id: 'S_80', q: 'Color-coded microfiber cloths used as per area.', w: 2 },
      { id: 'S_81', q: 'Frozen products thawed per SOP.', w: 2 },
      { id: 'S_82', q: 'Glue pads and rodent boxes inspected and replaced as needed.', w: 2 },
      { id: 'S_83', q: 'Smallware cleaned every 3 hours.', w: 2 },
      { id: 'S_84', q: 'Food dial-in checklist updated.', w: 2 },
      { id: 'S_85', q: 'FSSAI & FSDB displayed visibly and valid.', w: 2 },
      { id: 'S_86', q: 'Person in charge holds valid FOSTAC certification.', w: 2 },
      { id: 'S_87', q: 'Drainages cleaned per SOP and properly covered.', w: 2 },
      { id: 'S_88', q: 'Veg/non-veg segregation and cleanliness of moulds maintained.', w: 2 },
      { id: 'S_89', q: 'Wet floor signs used as needed.', w: 2 },
      { id: 'S_90', q: 'Step stools/ladders used safely and maintained.', w: 2 },
      { id: 'S_91', q: 'Food Display Unit arranged neatly with tags, allergens, calorie info, and logos.', w: 2 },
      { id: 'S_92', q: 'Reusable condiments stored properly in clean containers.', w: 2 },
      { id: 'S_93', q: 'All signages (handwash, push/pull, etc.) in place.', w: 2 },
      { id: 'S_94', q: 'Digital/static menu boards functional and updated.', w: 2 }
    ]
  },
  {
    id: 'A',
    title: 'QA',
    maxScore: 6,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'A_1', q: 'Potable water used in food meets IS 10500 standards; records maintained.', w: 2 },
      { id: 'A_2', q: 'Food material tested internally or via accredited lab.', w: 2 },
      { id: 'A_3', q: 'Induction training program and assessment for new employees completed.', w: 2 }
    ]
  },
  {
    id: 'Maintenance',
    title: 'Maintenance',
    maxScore: 22,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'M_1', q: 'Windows opening to external environment kept closed and fitted with insect mesh.', w: 2 },
      { id: 'M_2', q: 'No wall, floor, door, or ceiling damage.', w: 2 },
      { id: 'M_3', q: 'No unsecured electrical wires.', w: 2 },
      { id: 'M_4', q: 'Lighting above food/packaging areas covered and clean.', w: 2 },
      { id: 'M_5', q: 'Fire extinguishers in working condition and not expired.', w: 2 },
      { id: 'M_6', q: 'No pest entry points (wall holes, drains, ceiling gaps, etc.).', w: 2 },
      { id: 'M_7', q: 'Pest-o-flash placed properly (max height 6 ft, away from food areas).', w: 2 },
      { id: 'M_8', q: 'Equipment (RO, Coffee Machine, Freezer etc.) Maintenance file checked.', w: 2 },
      { id: 'M_9', q: 'RO water service records available.', w: 2 },
      { id: 'M_10', q: 'Plumbing and fixtures maintained.', w: 2 },
      { id: 'M_11', q: 'Freezer, FDU, and chillers in good working condition.', w: 2 }
    ]
  },
  {
    id: 'HR',
    title: 'HR',
    maxScore: 4,
    options: ['compliant', 'partially-compliant', 'not-compliant', 'na'],
    items: [
      { id: 'HR_1', q: 'Medical records for all staff including housekeeping available.', w: 2 },
      { id: 'HR_2', q: 'Annual medical exams and vaccinations done as per schedule.', w: 2 }
    ]
  }
];

// Helper function to calculate score
export function calculateQAScore(responses: Record<string, string>): {
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

  QA_SECTIONS.forEach(section => {
    let sectionScore = 0;
    let sectionMax = 0;

    section.items.forEach(item => {
      const responseKey = `${section.id}_${item.id}`;
      const response = responses[responseKey];

      // Handle Zero Tolerance separately
      if (section.id === 'ZeroTolerance') {
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
        // For other sections: compliant=2, partially-compliant=1, not-compliant=0, na=excluded
        if (response !== 'na' && response) {
          sectionMax += item.w;
          if (response === 'compliant') {
            sectionScore += item.w;
          } else if (response === 'partially-compliant') {
            sectionScore += Math.floor(item.w / 2); // Half points for partially compliant
          }
          // not-compliant = 0 points
        }
      }
    });

    sectionScores[section.id] = { score: sectionScore, maxScore: sectionMax };
    totalScore += sectionScore;
    maxScore += sectionMax;
  });

  // If Zero Tolerance failed, entire audit is 0
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
