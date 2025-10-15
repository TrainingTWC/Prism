import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, canAccessStore, canAccessAM } from '../../roleMapping';
import { AREA_MANAGERS } from '../../constants';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import hrMappingData from '../../src/hr_mapping.json';

// Minimal legacy types to satisfy TypeScript for the old checklist file
type ChecklistSection = any;
// Provide a minimal BaseChecklist placeholder so old JSX compiles (this file is legacy)
const BaseChecklist: React.FC<any> = (_props: any) => null;

// Google Sheets endpoint for logging data
const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxW541QsQc98NKMVh-lnNBnINskIqD10CnQHvGsW_R2SLASGSdBDN9lTGj1gznlNbHORQ/exec';

interface SurveyResponse {
  [key: string]: string;
}

interface SurveyMeta {
  qaName: string;
  qaId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
}

interface Store {
  name: string;
  id: string;
  region?: string;
}

interface QAChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
}

const QA_CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: 'zero_tolerance',
    category: 'Zero Tolerance',
    objective: 'Critical food safety and compliance requirements',
    maxScore: 24,
    items: [
      {
        id: 'no_expired_products',
        text: 'No expired food products in the café, and all food products are marked with clear date tags (MRD).',
        score: 4,
        answer: ''
      },
      {
        id: 'secondary_shelf_life',
        text: 'The product shall comply with the secondary shelf life for critical products like chicken, paneer, sauces, chilled, frozen, and composite products.',
        score: 4,
        answer: ''
      },
      {
        id: 'storage_conditions',
        text: 'All food products should be stored according to the appropriate storage conditions (Frozen, Chilled, and Ambient).',
        score: 4,
        answer: ''
      },
      {
        id: 'water_tds_compliance',
        text: 'RO/Mineral water TDS must be between 50 to 150 ± 10 ppm that is being used for processing inside the cafe.',
        score: 4,
        answer: ''
      },
      {
        id: 'temperature_sensitive_transfer',
        text: 'Temperature sensitive food items shall not be transferred to other store in uncontrolled medium',
        score: 4,
        answer: ''
      },
      {
        id: 'no_pest_activity',
        text: 'No live pest activity, including but not limited to rodents, rats, cockroaches, and spiders was seen inside the café.',
        score: 4,
        answer: ''
      }
    ]
  },
  {
    id: 'maintenance',
    category: 'Maintenance',
    objective: 'Ensure facility and equipment safety and functionality',
    maxScore: 22,
    items: [
      {
        id: 'window_protection',
        text: 'All windows opening to external environment fitted with insect-protective mesh.',
        score: 2,
        answer: ''
      },
      {
        id: 'structural_integrity',
        text: 'No wall damage, floor damage, door damage, and false ceiling damage.',
        score: 2,
        answer: ''
      },
      {
        id: 'electrical_safety',
        text: 'No unsecured wires from electrical lines or equipment.',
        score: 2,
        answer: ''
      },
      {
        id: 'lighting_protection',
        text: 'All lighting above food areas has shatterproof protective covers and is clean.',
        score: 2,
        answer: ''
      },
      {
        id: 'fire_extinguishers',
        text: 'Fire extinguishers are in working condition and not expired.',
        score: 2,
        answer: ''
      },
      {
        id: 'pest_entry_prevention',
        text: 'Absence of pest entry points - no damages in walls, tap holes, exhaust holes.',
        score: 2,
        answer: ''
      },
      {
        id: 'pest_control_devices',
        text: 'Pest control devices working and placed at max height of 6 feet away from food areas.',
        score: 2,
        answer: ''
      },
      {
        id: 'equipment_maintenance_records',
        text: 'Equipment maintenance file checked and service records available.',
        score: 2,
        answer: ''
      },
      {
        id: 'plumbing_fixtures',
        text: 'Plumbing and fixtures maintained in good repair.',
        score: 2,
        answer: ''
      },
      {
        id: 'refrigeration_equipment',
        text: 'Freezer, FDU and Chillers are in good working condition.',
        score: 2,
        answer: ''
      },
      {
        id: 'water_service_records',
        text: 'RO water service records available and up to date.',
        score: 2,
        answer: ''
      }
    ]
  },
  {
    id: 'hr_compliance',
    category: 'HR Compliance',
    objective: 'Ensure staff compliance and documentation',
    maxScore: 4,
    items: [
      {
        id: 'medical_records',
        text: 'Medical records for all staff including housekeeper available in store',
        score: 2,
        answer: ''
      },
      {
        id: 'annual_medical_examination',
        text: 'Annual medical examination & inoculation of food handlers completed with records',
        score: 2,
        answer: ''
      }
    ]
  },
  {
    id: 'quality_assurance',
    category: 'Quality Assurance',
    objective: 'Maintain quality standards and documentation',
    maxScore: 6,
    items: [
      {
        id: 'potable_water_testing',
        text: 'Potable water meets IS 10500 standards and tested semi-annually with records',
        score: 2,
        answer: ''
      },
      {
        id: 'food_material_testing',
        text: 'Food material tested through internal laboratory or accredited lab with records',
        score: 2,
        answer: ''
      },
      {
        id: 'induction_training',
        text: 'Induction training program and assessment for new employees completed',
        score: 2,
        answer: ''
      }
    ]
  },
  {
    id: 'store_operations',
    category: 'Store Operations',
    objective: 'Store operations and compliance standards',
    maxScore: 44,
    items: [
      {
        id: 'previous_audit_capa',
        text: 'Action plans for previous audit non-conformities shared and closed in CAPA format',
        score: 2,
        answer: ''
      },
      {
        id: 'no_junk_material',
        text: 'No junk material, wastage, unused items found in store surroundings',
        score: 2,
        answer: ''
      },
      {
        id: 'dishwasher_sink_cleanliness',
        text: 'Dishwasher and sink area checked for cleanliness, odor, covers, leakage',
        score: 2,
        answer: ''
      },
      {
        id: 'glass_doors_condition',
        text: 'Glass doors, cupboards, shelves clean and in good condition without damage',
        score: 2,
        answer: ''
      },
      {
        id: 'equipment_area_cleanliness',
        text: 'Area below shelves and machinery clean and free of food particles/dust',
        score: 2,
        answer: ''
      },
      {
        id: 'customer_furniture_condition',
        text: 'Tables and chairs for customers in good condition and free of dust/stains',
        score: 2,
        answer: ''
      },
      {
        id: 'floor_storage_prevention',
        text: 'Food & packaging material not stored on the floor',
        score: 2,
        answer: ''
      },
      {
        id: 'food_contact_materials',
        text: 'Food-contact materials and containers clean and made of non-toxic materials',
        score: 2,
        answer: ''
      },
      {
        id: 'colour_coded_segregation',
        text: 'Segregated materials (knives, cutting boards) colour coded as Veg/Non-veg',
        score: 2,
        answer: ''
      },
      {
        id: 'glasses_arrangement',
        text: 'Glasses clean and arranged upside down in clean rack',
        score: 1,
        answer: ''
      },
      {
        id: 'equipment_cleaning_sop',
        text: 'All equipment cleaned per SOP to prevent mould/fungi growth',
        score: 2,
        answer: ''
      },
      {
        id: 'temperature_maintenance',
        text: 'Chiller/Deep Freezer temperatures maintained as per standard',
        score: 2,
        answer: ''
      },
      {
        id: 'merry_chef_condition',
        text: 'Merry chef inner body checked for food particles/rust, filters clean',
        score: 2,
        answer: ''
      },
      {
        id: 'kitchen_equipment_operational',
        text: 'Microwaves, grillers, coffee makers, food warmers operational and clean',
        score: 2,
        answer: ''
      },
      {
        id: 'coffee_equipment_maintenance',
        text: 'Coffee machine and grinder operational, in good condition and clean',
        score: 2,
        answer: ''
      },
      {
        id: 'small_wares_condition',
        text: 'All small wares (scoops, knives, spatulas) in good condition and clean',
        score: 2,
        answer: ''
      },
      {
        id: 'utf_storage',
        text: 'UTF components stored off floor, no dust accumulation, proper rinsing',
        score: 2,
        answer: ''
      },
      {
        id: 'consumables_availability',
        text: 'Paper cups, straws, syrups, tissues, sauce bottles readily available',
        score: 1,
        answer: ''
      },
      {
        id: 'ice_cube_hygiene',
        text: 'Ice cube box/machine/scooper in clean condition with controlled transfer',
        score: 2,
        answer: ''
      },
      {
        id: 'mixer_blender_cleanliness',
        text: 'Mixer, blender, BPR and jars thoroughly cleaned and stored inverted',
        score: 2,
        answer: ''
      },
      {
        id: 'housekeeping_materials_storage',
        text: 'Housekeeping materials hung separately away from food preparation area',
        score: 1,
        answer: ''
      },
      {
        id: 'mat_cleanliness',
        text: 'Floor mat and bar mat cleaned adequately with no dirt accumulation',
        score: 1,
        answer: ''
      },
      {
        id: 'carry_bag_condition',
        text: 'Carry bag clean and in good shape with no traces of spillage',
        score: 1,
        answer: ''
      },
      {
        id: 'water_system_maintenance',
        text: 'RO machine, water storage tank, pipelines maintained clean and working',
        score: 2,
        answer: ''
      },
      {
        id: 'material_segregation',
        text: 'Foods & Non-food materials stored separately',
        score: 2,
        answer: ''
      },
      {
        id: 'fdu_temperature_verification',
        text: 'FDU temperature verified and within range of 0-5 degrees Celsius',
        score: 2,
        answer: ''
      },
      {
        id: 'in_process_food_labeling',
        text: 'In-process food items in containers have proper visible MRD tags',
        score: 2,
        answer: ''
      },
      {
        id: 'food_segregation_stages',
        text: 'Food product segregation between veg/non-veg & raw/cooked maintained',
        score: 2,
        answer: ''
      },
      {
        id: 'expired_product_separation',
        text: 'Expired/rejected items clearly labeled and kept separate',
        score: 2,
        answer: ''
      },
      {
        id: 'carton_box_policy',
        text: 'No carton boxes in production area except milk boxes',
        score: 1,
        answer: ''
      },
      {
        id: 'waste_removal',
        text: 'Food waste and other wastage removed daily from handling areas',
        score: 1,
        answer: ''
      },
      {
        id: 'partner_grooming',
        text: 'Partner well groomed (cap, t-shirt, apron, name badge, black trouser)',
        score: 2,
        answer: ''
      },
      {
        id: 'personal_hygiene',
        text: 'Personal hygiene maintained - haircut, nails, shave, no skin infections',
        score: 2,
        answer: ''
      },
      {
        id: 'hand_washing_procedures',
        text: 'Hand washing procedures followed, sanitizer usage checked',
        score: 2,
        answer: ''
      },
      {
        id: 'visitor_safety_measures',
        text: 'Visitors follow basic safety measures before entering processing area',
        score: 1,
        answer: ''
      },
      {
        id: 'personal_belongings_storage',
        text: 'Personal belongings well arranged away from food/packaging storage',
        score: 1,
        answer: ''
      },
      {
        id: 'glove_usage',
        text: 'Gloves used during food handling and changed after every use',
        score: 2,
        answer: ''
      },
      {
        id: 'first_aid_availability',
        text: 'First aid kit available with required medicines, no expired medicines',
        score: 1,
        answer: ''
      },
      {
        id: 'unauthorized_visitor_control',
        text: 'No unauthorized visitor (friend, relative, vendor) entry',
        score: 1,
        answer: ''
      },
      {
        id: 'recipe_shelf_life_availability',
        text: 'All new recipes and shelf-life charts easily available and followed',
        score: 1,
        answer: ''
      }
    ]
  }
];

const QAChecklist: React.FC<QAChecklistProps> = ({ userRole, onStatsUpdate }) => {
  return (
    <BaseChecklist
      userRole={userRole}
      checklistType="qa"
      title="Quality Assurance Checklist"
      sections={QA_CHECKLIST_SECTIONS}
      onStatsUpdate={onStatsUpdate}
    />
  );
};

export default QAChecklist;