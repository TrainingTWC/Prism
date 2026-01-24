import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GraduationCap, Calendar as CalendarIcon, ClipboardCheck, Home } from 'lucide-react';
import { AREA_MANAGERS as DEFAULT_AREA_MANAGERS } from '../../constants';
import { hapticFeedback } from '../../utils/haptics';
import { useConfig } from '../../contexts/ConfigContext';
import { useComprehensiveMapping } from '../../hooks/useComprehensiveMapping';
import { useEmployeeDirectory } from '../../hooks/useEmployeeDirectory';
import TrainingCalendar from './TrainingCalendar';
import ImageEditor from '../ImageEditor';

interface Store {
  name: string;
  storeId: string;
  region: string;
}

interface TrainerMapping {
  am: string;
  amId: string;
  storeName: string;
  storeId: string;
  trainer: string;
  trainerId: string;
}

interface TrainingMeta {
  amName: string;
  amId: string;
  trainerName: string;
  trainerId: string;
  auditorName: string;
  auditorId: string;
  // Trainer mapped to the selected store (designated trainer). Used for dashboards/autofill.
  mappedTrainerName: string;
  mappedTrainerId: string;
  storeName: string;
  storeId: string;
  mod: string;
}

interface SectionItem {
  id: string;
  q: string;
  w: number;
  wneg?: number;
  section?: string; // For TSA subsections
  type?: 'text'; // For text input fields
}

const SECTIONS = [
  {
    id: 'TrainingMaterials',
    title: 'Training Materials',
    items: [
      { id: 'TM_1', q: 'FRM available at store?', w: 1 },
      { id: 'TM_2', q: 'BRM available at store?', w: 1 },
      { id: 'TM_3', q: 'One-pager – Hot/Cue Cards displayed?', w: 1 },
      { id: 'TM_4', q: 'One-pager – Cold/Cue Cards displayed?', w: 1 },
      { id: 'TM_5', q: 'Dial-in One-pager visible?', w: 2 },
      { id: 'TM_6', q: 'New-launch learning material available?', w: 1 },
      { id: 'TM_7', q: 'COFFEE & HD Playbook in store?', w: 1 },
      { id: 'TM_8', q: 'MSDS, chemical chart and Shelf life chart available?', w: 1 },
      { id: 'TM_9', q: 'Career Progression Chart & Reward Poster displayed?', w: 1 }
    ]
  },
  {
    id: 'LMS',
    title: 'LMS Usage',
    items: [
      { id: 'LMS_1', q: 'Orientation & Induction completed within 3 days of joining?', w: 4, wneg: -4 },
      { id: 'LMS_2', q: 'All assessments & knowledge checks completed on LMS?', w: 4, wneg: -4 },
      { id: 'LMS_3', q: 'Team uses LMS for new info & comms?', w: 2 }
    ]
  },
  {
    id: 'Buddy',
    title: 'Buddy Trainer Availability & Capability',
    items: [
      { id: 'Buddy_1', q: 'Does the café have at least 20% of the staff certified Buddy Trainers?', w: 2 },
      { id: 'Buddy_2', q: 'Have Buddy Trainers completed their Skill Check?', w: 2 },
      { id: 'Buddy_3', q: 'Are trainees rostered with Buddy Trainers and working in the same shift?', w: 1 },
      { id: 'Buddy_4', q: 'Have Buddy Trainers attended the BT workshop?', w: 2 },
      { id: 'Buddy_5', q: 'Can Buddy Trainers explain the 4-step training process effectively?', w: 2 },
      { id: 'Buddy_6', q: 'Can Buddy Trainers navigate Zing LMS flawlessly?', w: 1 }
    ]
  },
  {
    id: 'NewJoiner',
    title: 'New Joiner Training & Records',
    items: [
      { id: 'NJ_1', q: 'Is the OJT book available for all partners?', w: 1 },
      { id: 'NJ_2', q: 'Are trainees referring to the OJT book and completing their skill checks?', w: 1 },
      { id: 'NJ_3', q: 'Is training progression aligned with the Training Calendar/Plan?', w: 1 },
      { id: 'NJ_4', q: 'Are team members aware of post-barista training progressions?', w: 1 },
      { id: 'NJ_5', q: 'Have managers completed SHLP training as per the calendar?', w: 2 },
      { id: 'NJ_6', q: 'Are there at least 2 FOSTAC-certified managers in the store?', w: 2 },
      { id: 'NJ_7', q: 'Is ASM/SM training completed as per the Training Calendar?', w: 2 }
    ]
  },
  {
    id: 'PartnerKnowledge',
    title: 'Partner Knowledge',
    items: [
      { id: 'PK_1', q: 'Are team members aware of current company communications?', w: 2 },
      { id: 'PK_2', q: 'Ask a team member to conduct a Coffee Tasting & Sampling', w: 2 },
      { id: 'PK_3', q: 'Is Sampling being conducted as per the set guidelines?', w: 2 },
      { id: 'PK_4', q: 'Is Coffee Tasting engaging and effective?', w: 2 },
      { id: 'PK_5', q: 'Are team members aware of manual brewing methods and standards?', w: 2 },
      { id: 'PK_6', q: 'Are partners following grooming standards?', w: 2 },
      { id: 'PK_7', q: 'Ask questions about key topics: COFFEE, LEAST, ROAST, Dial-in, Milk Steaming, LTO, Values(RESPECT), MSDS, Chemcial Dilution, Food Safety, and Security.', w: 3, wneg: -3 }
    ]
  },
  {
    id: 'TSA_Food',
    title: 'TSA - Food Training Skill Assessment',
    items: [
      { id: 'FOOD_EMPLOYEE', q: 'Employee Name and ID', w: 0, section: 'Employee Information', type: 'employee' },
      // Personal Hygiene
      { id: 'PH_1', q: 'Well-groomed as per TWC standards (uniform, nails, hair)', w: 1, section: 'Personal Hygiene' },
      { id: 'PH_2', q: 'Washed and sanitized hands every 30 mins', w: 1, section: 'Personal Hygiene' },
      { id: 'PH_3', q: 'Wears gloves or avoids direct food contact', w: 1, section: 'Personal Hygiene' },

      // Station Readiness  
      { id: 'SR_1', q: 'All ingredients available for the day', w: 1, section: 'Station Readiness' },
      { id: 'SR_2', q: 'All smallware available & in correct use', w: 1, section: 'Station Readiness' },
      { id: 'SR_3', q: 'Station cleaned and sanitized', w: 1, section: 'Station Readiness' },
      { id: 'SR_4', q: 'Station and smallware organized and clean', w: 1, section: 'Station Readiness' },
      { id: 'SR_5', q: 'Clean dusters available at the station', w: 1, section: 'Station Readiness' },
      { id: 'SR_6', q: 'FDU AT LEAST 70% stocked, clean, follows planogram', w: 1, section: 'Station Readiness' },
      { id: 'SR_7', q: 'MRD stickers used correctly (FDU + Make Line)', w: 1, section: 'Station Readiness' },
      { id: 'SR_8', q: 'Products stored at correct temperature', w: 1, section: 'Station Readiness' },

      // Food Preparation & Handling
      { id: 'FP_1', q: 'Recipe followed per SOP (Food Item 1)', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_2', q: 'Build followed per SOP (Food Item 1)', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_3', q: 'Recipe followed per SOP (Food Item 2)', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_4', q: 'Build followed per SOP (Food Item 2)', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_5', q: 'Used correct tools for preparation', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_6', q: 'Used appropriate key to heat/warm food (Merry chef/Oven)', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_7', q: 'Gloves changed correctly (veg/non-veg switch or as per TWC guidelines)', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_8', q: 'Consistently follows Clean-As-You-Go', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_9', q: 'Correct duster used for station cleaning', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_10', q: 'Follows First-In-First-Out for food items', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_11', q: 'Products checked visually before serving', w: 1, section: 'Food Preparation & Handling' },
      { id: 'FP_12', q: 'Chips, condiments, cutlery, etc., provided per SOP', w: 1, section: 'Food Preparation & Handling' },

      // Standards Ownership
      { id: 'SO_1', q: 'Serves only food that meets TWC standards (fresh, safe, proper temp); knows what to do if not', w: 1, section: 'Standards Ownership' }
    ]
  },
  {
    id: 'TSA_Coffee',
    title: 'TSA - Coffee Training Skill Assessment',
    items: [
      { id: 'COFFEE_EMPLOYEE', q: 'Employee Name and ID', w: 0, section: 'Employee Information', type: 'employee' },
      // Personal Hygiene
      { id: 'PH_1', q: 'Well-groomed as per TWC standards (uniform, nails, hair)', w: 1, section: 'Personal Hygiene' },
      { id: 'PH_2', q: 'Washed and sanitized hands', w: 1, section: 'Personal Hygiene' },
      { id: 'PH_3', q: 'Wears gloves at CBS', w: 1, section: 'Personal Hygiene' },

      // Station Readiness  
      { id: 'SR_1', q: 'Trainee Ensures that the station is well stocked with Milk, Warm cups, coffee beans, steaming jars, filter papers, stirrers, spoons, blenders and blending jars and scissors', w: 1, section: 'Station Readiness' },
      { id: 'SR_2', q: 'Trainee ensures all type of milk - Fresh, Skim milk, Oats milk and Almond milk are available', w: 1, section: 'Station Readiness' },
      { id: 'SR_3', q: 'Trainee Ensures that the leveller and temper is clean and set at the appropriate setting', w: 1, section: 'Station Readiness' },
      { id: 'SR_4', q: 'Trainee ensure all the smallwares- Stir spoon in clean water, Frothing pitchers, appropriate pumps in syrups are available at the stations', w: 1, section: 'Station Readiness' },
      { id: 'SR_5', q: 'Trainee ensured that the Espresso dial in is done', w: 1, section: 'Station Readiness' },
      { id: 'SR_6', q: 'Trainee extract the perfect espresso each time', w: 1, section: 'Station Readiness' },
      { id: 'SR_7', q: 'Trainee follows the Espresso extraction steps as defined', w: 1, section: 'Station Readiness' },
      { id: 'SR_8', q: 'Whipped cream is prepared as per standards', w: 1, section: 'Station Readiness' },
      { id: 'SR_9', q: 'Station and smallware organized and clean', w: 1, section: 'Station Readiness' },
      { id: 'SR_10', q: 'Clean dusters available at the station', w: 1, section: 'Station Readiness' },
      { id: 'SR_11', q: 'Station cleaned and sanitized', w: 1, section: 'Station Readiness' },
      { id: 'SR_12', q: 'MRD stickers used correctly', w: 1, section: 'Station Readiness' },
      { id: 'SR_13', q: 'Products stored at correct temperature', w: 1, section: 'Station Readiness' },

      // Coffee Preparation & Handling
      { id: 'CP_1', q: 'Recipe followed per SOP for Cappuccino', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_2', q: 'Build followed per SOP for Cappuccino', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_3', q: 'Recipe followed per SOP for Latte', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_4', q: 'Build followed per SOP for Latte', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_5', q: 'Recipe followed per SOP for bev 3', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_6', q: 'Build followed per SOP for bev 3', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_7', q: 'Recipe followed per SOP for bev 4', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_8', q: 'Build followed per SOP for bev 4', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_9', q: 'Cappuccino is served with 70:30 milk foam ratio', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_10', q: 'Latte is served with silky smooth foam (90:10 ratio)', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_11', q: 'Milk steaming standards are followed- Milk quantity taken, clean pitcher, and fresh cold milk', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_12', q: 'Latte art is as per described standards', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_13', q: 'Used correct tools for preparation', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_14', q: 'Blenders, Shakers and frothing jugs are washed and clean after every use', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_15', q: 'Appropriate button is used to blend the beverages', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_16', q: 'Toppings and Garnishes are used as per described standards', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_17', q: 'Special instructions are read and followed while preparing the beverage', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_18', q: 'Cold brew is available and brewed as per TWC standards', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_19', q: 'Trainee is aware about the Cold brew', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_20', q: 'Trainee brews the manual brews as per TWC standards', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_21', q: 'Gloves changed correctly (after garbage handling or as per Glove usage policy)', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_22', q: 'Consistently follows Clean-As-You-Go', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_23', q: 'Correct duster used for station cleaning', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_24', q: 'Follows First-In-First-Out for food items', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_25', q: 'Products checked visually before serving', w: 1, section: 'Coffee Preparation & Handling' },
      { id: 'CP_26', q: 'Condiments, cutlery, etc., provided per SOP', w: 1, section: 'Coffee Preparation & Handling' }
    ]
  },
  {
    id: 'TSA_CX',
    title: 'TSA: Customer Experience',
    items: [
      { id: 'CX_EMPLOYEE', q: 'Employee Name and ID', w: 0, section: 'Employee Information', type: 'employee' },

      // Section 1: Personal Hygiene (3 Points)
      { id: 'CX_PH_1', q: 'Grooming & Hygiene: Well-groomed as per TWC standards (uniform, nails, hair)', w: 1, section: 'Personal Hygiene' },
      { id: 'CX_PH_2', q: 'Hand Hygiene: Washed and sanitized hands', w: 1, section: 'Personal Hygiene' },
      { id: 'CX_PH_3', q: 'Food Handling: Wears gloves or avoids direct food contact', w: 1, section: 'Personal Hygiene' },

      // Section 2: Station Readiness (8 Points)
      { id: 'CX_SR_1', q: 'Washrooms clean and stocked', w: 1, section: 'Station Readiness' },
      { id: 'CX_SR_2', q: 'Service area clean (floor, chairs, tables)', w: 1, section: 'Station Readiness' },
      { id: 'CX_SR_3', q: 'Smallwares clean (salvers, plates, cutlery)', w: 1, section: 'Station Readiness' },
      { id: 'CX_SR_4', q: 'Furniture properly set', w: 1, section: 'Station Readiness' },
      { id: 'CX_SR_5', q: 'POS, Bars, merchandise, menus, etc. properly stocked', w: 1, section: 'Station Readiness' },
      { id: 'CX_SR_6', q: 'Float/change available for cash transactions', w: 1, section: 'Station Readiness' },
      { id: 'CX_SR_7', q: 'Checks communication for product availability', w: 1, section: 'Station Readiness' },
      { id: 'CX_SR_8', q: 'Verifies temperature, music, table cleanliness, service items, Wi-Fi, and delivery channels', w: 1, section: 'Station Readiness' },

      // Section 3: Customer Handling (12 Points)
      { id: 'CX_CH_1', q: 'Cheerful Greeting: Cheerfully welcomes customers, follows 2-meter rule', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_2', q: 'Builds rapport (eye contact, active listening, positive phrases)', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_3', q: 'Assists customers to find seating or offers help when needed', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_4', q: 'Order Taking Assistance: Upsells using customer interest and product knowledge', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_5', q: 'Accurately enters and verifies orders in POS', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_6', q: 'Applies applicable discounts correctly', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_7', q: 'Processes payments accurately and handles change', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_8', q: 'Closes transaction smoothly and provides table tag', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_9', q: 'Thanks customer, explains order delivery, listens to feedback', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_10', q: 'Friendly & Accurate service: Serves with attention to detail (salver balance, order name, cutlery, etc.)', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_11', q: 'Offers follow-up service and leaves customer satisfied', w: 1, section: 'Customer Handling' },
      { id: 'CX_CH_12', q: 'Clears table with courtesy, thanks guests on exit', w: 1, section: 'Customer Handling' },

      // Section 4: Handling Feedback & Complaints (6 Points)
      { id: 'CX_FC_1', q: 'What would you do if a customer leaves more than half of the product?', w: 1, section: 'Handling Feedback & Complaints' },
      { id: 'CX_FC_2', q: 'How do you handle a customer asking for extra protein in a salad?', w: 1, section: 'Handling Feedback & Complaints' },
      { id: 'CX_FC_3', q: 'What do you do if a customer is angry or irritated?', w: 1, section: 'Handling Feedback & Complaints' },
      { id: 'CX_FC_4', q: 'What would you do if a customer complains about cold food/coffee?', w: 1, section: 'Handling Feedback & Complaints' },
      { id: 'CX_FC_5', q: 'How do you manage service if the wrong item (veg/non-veg) is served?', w: 1, section: 'Handling Feedback & Complaints' },
      { id: 'CX_FC_6', q: 'What do you do if a customer sits for a long time post meal?', w: 1, section: 'Handling Feedback & Complaints' }
    ]
  },
  {
    id: 'CustomerExperience',
    title: 'Customer Experience',
    items: [
      { id: 'CX_1', q: 'Is background music at appropriate volume?', w: 1 },
      { id: 'CX_2', q: 'Is store temperature comfortable?', w: 1 },
      { id: 'CX_3', q: 'Are washrooms clean and well-maintained?', w: 1 },
      { id: 'CX_4', q: 'Is Wi-Fi available & functioning properly?', w: 1 },
      { id: 'CX_5', q: 'Are marketing & Visual Merchandise displayes correct?', w: 2 },
      { id: 'CX_6', q: 'Is store furniture clean & well-kept?', w: 1 },
      { id: 'CX_7', q: 'What do you understand by MA, CPI, QA scores?', w: 1 },
      { id: 'CX_8', q: 'What was the latest Mystery Audit score for the store?', w: 1 },
      { id: 'CX_9', q: 'Top 2 CX opportunity areas last month?', w: 1 }
    ]
  },
  {
    id: 'ActionPlan',
    title: 'Action Plan & Continuous Improvement',
    items: [
      { id: 'AP_1', q: 'Concerns addressed within 48hrs?', w: 1, wneg: -1 },
      { id: 'AP_2', q: 'Action points closed/work-in-progress?', w: 2 },
      { id: 'AP_3', q: 'Managers aware of action plan?', w: 2 }
    ]
  }
];

interface TrainingChecklistProps {
  userRole?: any;
  onStatsUpdate?: (stats: { completed: number; total: number; score: number }) => void;
}

const TrainingChecklist: React.FC<TrainingChecklistProps> = ({ onStatsUpdate }) => {
  const { config, loading: configLoading } = useConfig();
  const { mapping: comprehensiveMapping, loading: mappingLoading } = useComprehensiveMapping();
  const { directory: employeeDirectory, loading: employeeLoading } = useEmployeeDirectory();
  const AREA_MANAGERS = config?.AREA_MANAGERS || DEFAULT_AREA_MANAGERS;

  // Use comprehensive mapping as data source (Google Sheets)
  const allStores = comprehensiveMapping || [];

  // Use config data if available, otherwise fall back to hardcoded SECTIONS
  const sections = config?.CHECKLISTS?.TRAINING || SECTIONS;

  const [responses, setResponses] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('training_resp') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [meta, setMeta] = useState<TrainingMeta>(() => {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem('training_meta') || '{}');
    } catch (e) { }

    const urlParams = new URLSearchParams(window.location.search);
    // Support multiple URL parameter names for trainer ID
    const trainerIdFromURL = urlParams.get('trainerId') || urlParams.get('trainer_id') || urlParams.get('id') || urlParams.get('hrId') || urlParams.get('EMPID') || '';
    const trainerNameFromURL = urlParams.get('trainerName') || urlParams.get('trainer_name') || urlParams.get('name') || urlParams.get('hrName') || '';

    // If trainer is in URL, use it; otherwise use stored value
    const finalTrainerId = trainerIdFromURL || (stored as any).trainerId || '';

    // IMPORTANT: If trainer ID from URL is different from stored, clear the stored name
    // This ensures we look up the correct name from Google Sheets for the new trainer
    let finalTrainerName = '';
    if (trainerIdFromURL) {
      // URL has trainer ID - only use URL name if provided, otherwise leave empty for lookup
      finalTrainerName = trainerNameFromURL || '';
    } else {
      // No URL trainer - use stored values
      finalTrainerName = (stored as any).trainerName || '';
    }
    // Note: Trainer name will be looked up from Google Sheets in useEffect if empty

    return {
      amName: (stored as any).amName || '',
      amId: (stored as any).amId || '',
      trainerName: finalTrainerName,
      trainerId: finalTrainerId,
      auditorName: (stored as any).auditorName || '',
      auditorId: (stored as any).auditorId || '',
      mappedTrainerName: (stored as any).mappedTrainerName || '',
      mappedTrainerId: (stored as any).mappedTrainerId || '',
      storeName: (stored as any).storeName || '',
      storeId: (stored as any).storeId || '',
      mod: (stored as any).mod || ''
    };
  });

  const [isTrainerIdFromURL, setIsTrainerIdFromURL] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return !!(urlParams.get('trainerId') || urlParams.get('trainer_id') || urlParams.get('id') || urlParams.get('hrId') || urlParams.get('EMPID'));
  });

  // Auto-lookup trainer name from Google Sheets when mapping loads
  useEffect(() => {
    // Only lookup if we have trainer ID and either no name, name equals ID, or name is "#N/A" (needs lookup)
    if (meta.trainerId && allStores.length > 0 && (!meta.trainerName || meta.trainerName === meta.trainerId || meta.trainerName === '#N/A' || meta.trainerName.startsWith('#N/A'))) {
      const normalizedTrainerId = normalizeId(meta.trainerId);

      // Look for trainer name in the store mapping (using exact Google Sheet column names)
      const storeWithTrainer = allStores.find((store: any) => {
        const trainer1Id = normalizeId(store['Trainer 1 ID'] || store['Trainer 1'] || store.Trainer || '');
        const trainer2Id = normalizeId(store['Trainer 2 ID'] || store['Trainer 2'] || '');
        const trainer3Id = normalizeId(store['Trainer 3 ID'] || store['Trainer 3'] || '');
        return trainer1Id === normalizedTrainerId || trainer2Id === normalizedTrainerId || trainer3Id === normalizedTrainerId;
      });

      if (storeWithTrainer) {
        const trainer1Id = normalizeId(storeWithTrainer['Trainer 1 ID'] || storeWithTrainer['Trainer 1'] || storeWithTrainer.Trainer || '');
        const trainer2Id = normalizeId(storeWithTrainer['Trainer 2 ID'] || storeWithTrainer['Trainer 2'] || '');
        const trainer3Id = normalizeId(storeWithTrainer['Trainer 3 ID'] || storeWithTrainer['Trainer 3'] || '');

        let trainerName = '';
        if (trainer1Id === normalizedTrainerId) {
          trainerName = storeWithTrainer['Trainer 1 Name'] || '';
        } else if (trainer2Id === normalizedTrainerId) {
          trainerName = storeWithTrainer['Trainer 2 Name'] || '';
        } else if (trainer3Id === normalizedTrainerId) {
          trainerName = storeWithTrainer['Trainer 3 Name'] || '';
        }

        if (trainerName) {
          setMeta(prev => ({
            ...prev,
            trainerName
          }));
        }
      }
    }
  }, [meta.trainerId, meta.trainerName, allStores]);

  // Add state for dropdown handling
  const [amSearchTerm, setAmSearchTerm] = useState('');
  const [modSearchTerm, setModSearchTerm] = useState('');
  const [showModDropdown, setShowModDropdown] = useState(false);
  const [selectedModIndex, setSelectedModIndex] = useState(-1);

  // State for employee dropdowns in TSA sections
  const [employeeSearchTerms, setEmployeeSearchTerms] = useState<Record<string, string>>({});
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState<Record<string, boolean>>({});
  const [selectedEmployeeIndex, setSelectedEmployeeIndex] = useState<Record<string, number>>({});

  // Calculate and update stats whenever responses change
  useEffect(() => {
    if (onStatsUpdate) {
      let completed = 0;
      let total = 0;
      let totalScore = 0;
      let maxScore = 0;

      sections.forEach(section => {
        if (section.id === 'TSA_Food') {
          // Count TSA Food as one item, use automatic scoring
          total++;
          // Check if any response exists for this section
          const hasResponse = section.items.some(item =>
            responses[`${section.id}_${item.id}`] && responses[`${section.id}_${item.id}`].trim()
          );
          if (hasResponse) {
            completed++;
            totalScore += calculateTSAFoodScore();
          }
          maxScore += 10; // TSA sections have max score of 10
        } else if (section.id === 'TSA_Coffee') {
          // Count TSA Coffee as one item, use automatic scoring
          total++;
          const hasResponse = section.items.some(item =>
            responses[`${section.id}_${item.id}`] && responses[`${section.id}_${item.id}`].trim()
          );
          if (hasResponse) {
            completed++;
            totalScore += calculateTSACoffeeScore();
          }
          maxScore += 10; // TSA sections have max score of 10
        } else if (section.id === 'TSA_CX') {
          // Count TSA CX as one item, use automatic scoring
          total++;
          const hasResponse = section.items.some(item =>
            responses[`${section.id}_${item.id}`] && responses[`${section.id}_${item.id}`].trim()
          );
          if (hasResponse) {
            completed++;
            totalScore += calculateTSACXScore();
          }
          maxScore += 10; // TSA sections have max score of 10
        } else {
          // Regular sections
          section.items.forEach(item => {
            // Skip text fields (EMP name/ID) in stats calculation
            if (item.type === 'text') return;

            total++;
            const response = responses[`${section.id}_${item.id}`];
            if (response && response.trim()) {
              completed++;

              // Calculate score based on response type
              if (response === 'yes' || response === 'Yes') {
                totalScore += item.w || 1;
                maxScore += item.w || 1;
              } else if (response === 'no' || response === 'No') {
                totalScore += item.wneg || 0;
                maxScore += item.w || 1;
              } else if (response === 'Excellent') {
                totalScore += 5;
                maxScore += 5;
              } else if (response === 'Good') {
                totalScore += 3;
                maxScore += 5;
              } else if (response === 'Poor') {
                totalScore += 1;
                maxScore += 5;
              } else if (response.trim()) {
                // For text responses, give full score if there's content
                totalScore += item.w || 1;
                maxScore += item.w || 1;
              }
            } else {
              maxScore += item.w || 1;
            }
          });
        }
      });

      const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      onStatsUpdate({ completed, total, score: scorePercentage });
    }
  }, [responses, onStatsUpdate]);
  const [trainerSearchTerm, setTrainerSearchTerm] = useState('');
  const [auditorSearchTerm, setAuditorSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const [showAuditorDropdown, setShowAuditorDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedAmIndex, setSelectedAmIndex] = useState(-1);
  const [selectedTrainerIndex, setSelectedTrainerIndex] = useState(-1);
  const [selectedAuditorIndex, setSelectedAuditorIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

  const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();

  // Get unique AMs (dedupe by normalized ID)
  const uniqueAMs = (() => {
    const byId = new Map<string, { name: string; id: string }>();
    AREA_MANAGERS.forEach((am: any) => {
      const id = normalizeId(am.id);
      if (!id) return;
      if (!byId.has(id)) byId.set(id, { name: am.name, id });
    });
    return Array.from(byId.values());
  })();

  // Build trainers list from comprehensive store mapping - Google Sheets only
  const uniqueTrainers = (() => {
    const trainerMap = new Map<string, string>();

    // Collect all trainers with their names from the store mapping (using exact Google Sheet column names)
    allStores.forEach((store: any) => {
      // Trainer 1
      const trainer1Id = normalizeId(store['Trainer 1 ID'] || store['Trainer 1'] || store.Trainer || '');
      const trainer1Name = store['Trainer 1 Name'] || '';
      if (trainer1Id && !trainerMap.has(trainer1Id)) {
        trainerMap.set(trainer1Id, trainer1Name || trainer1Id);
      }

      // Trainer 2
      const trainer2Id = normalizeId(store['Trainer 2 ID'] || store['Trainer 2'] || '');
      const trainer2Name = store['Trainer 2 Name'] || '';
      if (trainer2Id && !trainerMap.has(trainer2Id)) {
        trainerMap.set(trainer2Id, trainer2Name || trainer2Id);
      }

      // Trainer 3
      const trainer3Id = normalizeId(store['Trainer 3 ID'] || store['Trainer 3'] || '');
      const trainer3Name = store['Trainer 3 Name'] || '';
      if (trainer3Id && !trainerMap.has(trainer3Id)) {
        trainerMap.set(trainer3Id, trainer3Name || trainer3Id);
      }
    });

    const trainers = Array.from(trainerMap.entries()).map(([id, name]) => ({
      id,
      name
    }));

    return trainers.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  })();

  // Filter MOD list - only Store Manager, Assistant Store Manager, Shift Supervisor
  // Also filter by region if a store is selected
  const modEmployees = (() => {
    const allowedDesignations = [
      'store manager',
      'assistant store manager',
      'shift supervisor',
      'shift manager',
      'store head',
      'assistant manager'
    ];

    // Get the region from the selected store
    let selectedStoreRegion = '';
    if (meta.storeId) {
      const selectedStore = allStores.find((store: any) => {
        const storeId = normalizeId(store['Store ID'] || store.storeId || store.StoreID || store.store_id);
        return storeId === normalizeId(meta.storeId);
      });
      if (selectedStore) {
        selectedStoreRegion = selectedStore['Region'] || selectedStore.region || '';
      }
    }

    // Build a set of store IDs in the same region
    const storeIdsInRegion = new Set<string>();
    if (selectedStoreRegion) {
      allStores.forEach((store: any) => {
        const storeRegion = (store['Region'] || store.region || '').toLowerCase().trim();
        if (storeRegion === selectedStoreRegion.toLowerCase().trim()) {
          const storeCode = normalizeId(store['Store ID'] || store.storeId || store.StoreID || store.store_id);
          storeIdsInRegion.add(storeCode);
        }
      });
    }

    const employees = Object.values(employeeDirectory.byId)
      .filter((emp: any) => {
        const designation = (emp.designation || '').toLowerCase().trim();
        const hasAllowedDesignation = allowedDesignations.some(allowed => designation.includes(allowed));

        // If no store selected yet, show all managers
        if (!selectedStoreRegion) {
          return hasAllowedDesignation;
        }

        // Filter by region - check if employee's store_code is in the same region
        const empStoreCode = normalizeId(emp.store_code || emp.location || '');
        const isInSameRegion = storeIdsInRegion.has(empStoreCode);

        return hasAllowedDesignation && isInSameRegion;
      })
      .map((emp: any) => ({
        id: emp.employee_code,
        name: emp.empname,
        designation: emp.designation,
        location: emp.location
      }));

    return employees.sort((a: any, b: any) => a.name.localeCompare(b.name));
  })();

  // All employees for TSA sections - filtered by region if store selected
  const allEmployeesForTSA = (() => {
    // Debug: Log employee directory status
    console.log('TSA Employee Directory Status:', {
      loading: employeeLoading,
      totalEmployees: Object.keys(employeeDirectory.byId).length,
      storeSelected: !!meta.storeId
    });

    // Get all employees first
    const allEmployees = Object.values(employeeDirectory.byId)
      .map((emp: any) => ({
        id: emp.employee_code,
        name: emp.empname,
        designation: emp.designation,
        location: emp.location,
        store_code: emp.store_code
      }));

    // If no employees at all, return empty
    if (allEmployees.length === 0) {
      console.log('TSA: No employees in directory');
      return [];
    }

    // Get the region from the selected store
    let selectedStoreRegion = '';
    if (meta.storeId) {
      const selectedStore = allStores.find((store: any) => {
        const storeId = normalizeId(store['Store ID'] || store.storeId || store.StoreID || store.store_id);
        return storeId === normalizeId(meta.storeId);
      });
      if (selectedStore) {
        selectedStoreRegion = selectedStore['Region'] || selectedStore.region || '';
      }
    }

    // If no store selected, return all employees
    if (!selectedStoreRegion) {
      console.log('TSA: No store selected, showing all employees:', allEmployees.length);
      return allEmployees.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    // Build a set of store IDs in the same region
    const storeIdsInRegion = new Set<string>();
    allStores.forEach((store: any) => {
      const storeRegion = (store['Region'] || store.region || '').toLowerCase().trim();
      if (storeRegion === selectedStoreRegion.toLowerCase().trim()) {
        const storeCode = normalizeId(store['Store ID'] || store.storeId || store.StoreID || store.store_id);
        storeIdsInRegion.add(storeCode);
      }
    });
    console.log('TSA Region Filter:', { region: selectedStoreRegion, storesInRegion: storeIdsInRegion.size });

    const filteredEmployees = allEmployees.filter((emp: any) => {
      const empStoreCode = normalizeId(emp.store_code || emp.location || '');
      return storeIdsInRegion.has(empStoreCode);
    });

    // If filtering resulted in no employees, return all employees as fallback
    if (filteredEmployees.length === 0) {
      console.log('TSA: Region filtering returned 0 employees, falling back to all employees');
      return allEmployees.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    console.log('TSA Filtered Employees:', filteredEmployees.length);
    return filteredEmployees.sort((a: any, b: any) => a.name.localeCompare(b.name));
  })();

  const uniqueStores = (() => {
    const stores = allStores.map((row: any) => ({
      name: row['Store Name'] || row.storeName || row.name,
      id: normalizeId(row['Store ID'] || row.storeId || row.StoreID || row.store_id)
    }));
    return stores
      .filter((store: any) => store.name && store.id)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  })();

  // Cascading filter functions for dropdown searches
  // 1. Area Managers filtered by selected trainer (if any)

  const filteredAMs = uniqueAMs.filter(am => {
    // Audits can be done by anybody, so AM list should not be restricted by auditor.
    return amSearchTerm === '' ||
      (am.name as string).toLowerCase().includes(amSearchTerm.toLowerCase()) ||
      (am.id as string).toLowerCase().includes(amSearchTerm.toLowerCase());
  });

  // 2. Trainers - no cascading filter needed (they are the top level)
  const filteredTrainers = uniqueTrainers.filter(trainer =>
    trainerSearchTerm === '' ||
    (trainer.name as string).toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
    (trainer.id as string).toLowerCase().includes(trainerSearchTerm.toLowerCase())
  );

  // 2a. Auditors - same list as trainers but separate filter
  const filteredAuditors = uniqueTrainers.filter(auditor =>
    auditorSearchTerm === '' ||
    (auditor.name as string).toLowerCase().includes(auditorSearchTerm.toLowerCase()) ||
    (auditor.id as string).toLowerCase().includes(auditorSearchTerm.toLowerCase())
  );

  // 2b. MOD employees filtered by search term
  const filteredModEmployees = modEmployees.filter(mod =>
    modSearchTerm === '' ||
    (mod.name as string).toLowerCase().includes(modSearchTerm.toLowerCase()) ||
    (mod.id as string).toLowerCase().includes(modSearchTerm.toLowerCase()) ||
    (mod.designation as string).toLowerCase().includes(modSearchTerm.toLowerCase())
  );

  // 3. Stores filtered by selected Trainer (primary filter) or Area Manager
  const filteredStores = uniqueStores.filter(store => {
    // First apply search filter
    const matchesSearch = storeSearchTerm === '' ||
      (store.name as string).toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      (store.id as string).toLowerCase().includes(storeSearchTerm.toLowerCase());

    // If trainer is selected, filter stores by trainer (primary filter)
    if (meta.trainerId) {
      try {
        const trainerIdNorm = normalizeId(meta.trainerId);
        const storesForTrainer = Array.from(
          new Set(
            allStores
              .filter((r: any) => {
                // Check Trainer 1 (primary), Trainer 2, Trainer 3 using exact Google Sheet column names
                const trainer1 = normalizeId(r['Trainer 1 ID'] || r['Trainer 1'] || r.Trainer || r['Trainer'] || r['Trainer ID'] || r.trainerId || r.trainer_id);
                const trainer2 = normalizeId(r['Trainer 2 ID'] || r['Trainer 2'] || '');
                const trainer3 = normalizeId(r['Trainer 3 ID'] || r['Trainer 3'] || '');
                return trainer1 === trainerIdNorm || trainer2 === trainerIdNorm || trainer3 === trainerIdNorm;
              })
              .map((r: any) => ({
                name: r['Store Name'] || r.storeName || r.name,
                id: normalizeId(r['Store ID'] || r.storeId || r.StoreID || r.store_id)
              }))
              .filter((s: any) => s.name && s.id)
              .map((s: any) => `${s.id}::${s.name}`)
          )
        ).map((key: string) => {
          const [id, name] = key.split('::');
          return { id, name };
        });

        const storeUnderTrainer = storesForTrainer.some((s: any) => normalizeId(s.id) === normalizeId(store.id));
        return matchesSearch && storeUnderTrainer;
      } catch (e) {
        return matchesSearch;
      }
    }

    // If no trainer but AM is selected, filter by AM
    if (meta.amId) {
      try {
        const amIdNorm = normalizeId(meta.amId);
        const storesForAM = Array.from(
          new Set(
            allStores
              .filter((r: any) => normalizeId(r.AM || r['AM'] || r['AM ID'] || r['Area Manager ID'] || r.amId || r.areaManagerId) === amIdNorm)
              .map((r: any) => ({
                name: r['Store Name'] || r.storeName || r.name,
                id: normalizeId(r['Store ID'] || r.storeId || r.StoreID || r.store_id)
              }))
              .filter((s: any) => s.name && s.id)
              .map((s: any) => `${s.id}::${s.name}`)
          )
        ).map((key: string) => {
          const [id, name] = key.split('::');
          return { id, name };
        });

        const storeUnderAM = storesForAM.some((s: any) => normalizeId(s.id) === normalizeId(store.id));
        return matchesSearch && storeUnderAM;
      } catch (e) {
        return matchesSearch;
      }
    }

    // If neither trainer nor AM is selected, show all stores that match search
    return matchesSearch;
  });

  // Auto-fill function with cascading filters (same as HR Checklist)
  const autoFillFields = (field: string, value: string) => {
    let mappingItem: any = null;

    switch (field) {
      case 'trainer':
        // Top-level selection: set trainer and clear dependent fields.
        {
          const trainerId = normalizeId(value);
          setMeta(prev => ({
            ...prev,
            trainerName: value,
            trainerId,
            mappedTrainerName: '',
            mappedTrainerId: '',
            amName: '',
            amId: '',
            storeName: '',
            storeId: ''
          }));
        }
        break;

      case 'am':
        // Find AM from constants (MIDDLE LEVEL - clears Store only)
        {
          const am = uniqueAMs.find((a: any) => a.name === value || normalizeId(a.id) === normalizeId(value));
          if (am) {
            setMeta(prev => ({
              ...prev,
              amName: am.name,
              amId: am.id,
              mappedTrainerName: '',
              mappedTrainerId: '',
              storeName: '',
              storeId: ''
            }));
          }
        }
        break;

      case 'store':
        // Find store in comprehensive store mapping from Google Sheets
        {
          const valueNorm = normalizeId(value);
          mappingItem = allStores.find((item: any) => {
            const sid = normalizeId(item['Store ID'] || item.storeId || item.StoreID || item.store_id);
            const sname = String(item['Store Name'] || item.storeName || item.name || '').trim();
            return sid === valueNorm || sname === value;
          });

          if (mappingItem) {
            const storeId = normalizeId(mappingItem['Store ID'] || mappingItem.storeId || mappingItem.StoreID || mappingItem.store_id);
            const storeName = mappingItem['Store Name'] || mappingItem.storeName || mappingItem.name || '';

            // Auto-fill AM from store mapping
            const storeAmId = normalizeId(mappingItem.AM || mappingItem['AM'] || mappingItem['AM ID'] || mappingItem['Area Manager ID'] || mappingItem.amId || mappingItem.areaManagerId);
            const storeAmName = mappingItem['AM Name'] || '';
            const amFromStoreMapping = uniqueAMs.find((am: any) => normalizeId(am.id) === storeAmId);

            // Use Trainer 1 from new 23-column structure (primary trainer)
            const trainerId = normalizeId(mappingItem['Trainer 1'] || mappingItem.Trainer || mappingItem['Trainer'] || mappingItem['Trainer ID'] || mappingItem.trainerId || mappingItem.trainer_id);
            const trainerName = mappingItem['Trainer 1 Name'] || trainerId;

            setMeta(prev => ({
              ...prev,
              storeName,
              storeId,
              // Auto-fill AM from store mapping
              amName: storeAmName || amFromStoreMapping?.name || '',
              amId: storeAmId || amFromStoreMapping?.id || '',
              mappedTrainerName: trainerName,
              mappedTrainerId: trainerId || ''
            }));
          }
        }
        break;
    }
  };

  const [remarks, setRemarks] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('training_remarks') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [sectionImages, setSectionImages] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('training_section_images') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tsaExpanded, setTsaExpanded] = useState(false);
  const [tsaCoffeeExpanded, setTsaCoffeeExpanded] = useState(false);
  const [tsaCXExpanded, setTsaCXExpanded] = useState(false);

  // Image editing state
  const [editingImage, setEditingImage] = useState<{ sectionId: string; imageIndex: number; imageData: string } | null>(null);

  // --- Speech recognition state ---
  const [isSpeechSupported] = useState<boolean>(() => !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  // If true, after a single wake word the app remains in command mode and will treat subsequent speech as commands
  const [commandMode, setCommandMode] = useState(false);
  const commandTimerRef = useRef<number | null>(null);
  const [commandCountdown, setCommandCountdown] = useState<number>(0);
  const COMMAND_MODE_SECONDS = 20; // keep listening for commands for 20s after wake word
  const [proposedUpdates, setProposedUpdates] = useState<{
    questionId: string;
    value: string;
    confidence?: number;
    reason?: string;
    suggestedBy?: string;
  }[] | null>(null);

  // Lock body scroll when proposed updates modal is open
  useEffect(() => {
    if (proposedUpdates) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    return;
  }, [proposedUpdates]);
  // Push-to-talk state (walkie-talkie style)
  const [pushToTalkActive, setPushToTalkActive] = useState(false);
  const pushTranscriptRef = useRef('');
  // Preview/toast for captured voice before auto-applying
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewTranscript, setPreviewTranscript] = useState('');
  const [previewUpdates, setPreviewUpdates] = useState<Array<{ questionId: string; value: string; confidence?: number; reason?: string; suggestedBy?: string }> | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  // Initialize SpeechRecognition (if supported)
  useEffect(() => {
    if (!isSpeechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      const rec = new SpeechRecognition();
      rec.lang = (navigator.language || 'en-IN');
      rec.continuous = true;
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        try {
          const text = Array.from(event.results).map((r: any) => r[0].transcript).join(' ').trim();
          setTranscript(text);
          if (pushToTalkActive) {
            // accumulate into push transcript buffer
            pushTranscriptRef.current = (pushTranscriptRef.current ? pushTranscriptRef.current + ' ' : '') + text;
          } else {
            handleSpeechText(text);
          }
        } catch (e) {
          console.error('Error parsing speech result', e);
        }
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error', err);
        setVoiceStatus('Error: ' + (err?.error || 'unknown'));
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } catch (e) {
      console.warn('SpeechRecognition init failed', e);
      recognitionRef.current = null;
    }

    return () => {
      try {
        recognitionRef.current && recognitionRef.current.stop();
      } catch (e) { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeechSupported]);

  // Auto-start recognition when possible (no buttons). Keep running continuously.
  useEffect(() => {
    // Do NOT auto-start recognition. Use push-to-talk button to start/stop.
    if (!recognitionRef.current) return;
    setIsListening(false);
    setVoiceStatus('Idle — press and hold the mic to speak');

    // Ensure we mark stopped if recognition ends; do NOT auto-restart here to avoid restart loops.
    recognitionRef.current.onend = () => {
      setIsListening(false);
      // do not auto-start here; push-to-talk will start recognition when needed
    };

    const handleVisibility = () => {
      // Do not auto-start recognition on visibility changes. Push-to-talk must be used.
      // Keep this hook to possibly adjust UI in the future.
      if (document.visibilityState === 'visible') {
        // no-op for now
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Ensure command timer is cleaned up if component unmounts
  useEffect(() => {
    return () => {
      if (commandTimerRef.current) {
        window.clearInterval(commandTimerRef.current as any);
        commandTimerRef.current = null;
      }
    };
  }, []);

  const handleSpeechText = (text: string) => {
    const lower = text.toLowerCase();
    // If we're already in command mode, or if this was triggered by push-to-talk,
    // treat the transcript as a direct command and interpret immediately.
    const cmd = lower.trim();
    if (!cmd) return;
    // If commandMode is active, extend timer and treat as command
    if (commandMode) {
      setLastCommand(cmd);
      setVoiceStatus('Processing command...');
      startOrResetCommandTimer();
      interpretAndApply(cmd, text);
      return;
    }

    // For non-commandMode captures (ambient listens), do nothing by default.
    // Push-to-talk will capture and call interpret directly on release. This
    // removes the requirement to say a wake word when using the mic button.
    return;
  };

  const interpretAndApply = (cmd: string, rawText: string) => {
    callInterpretAPI(rawText).then(result => {
      if (result && result.updates) {
        // apply updates immediately without requiring manual confirmation
        setResponses(prev => {
          const next = { ...prev };
          result.updates.forEach((u: any) => { if (u.questionId && u.value) next[u.questionId] = u.value; });
          return next;
        });
        setVoiceStatus('Applied changes from voice command');
      } else {
        // fallback to local parse (applies automatically)
        const updates = processVoiceCommandAuto(cmd);
        if (updates) {
          setResponses(prev => ({ ...prev, ...updates }));
          setVoiceStatus('Applied fallback parsed changes');
        } else {
          setVoiceStatus('Could not parse command');
        }
      }
    }).catch(err => {
      console.error('Interpret API failed', err);
      const updates = processVoiceCommandAuto(cmd);
      if (updates) {
        setResponses(prev => ({ ...prev, ...updates }));
        setVoiceStatus('Applied fallback parsed changes');
      } else {
        setVoiceStatus('Could not parse command');
      }
    });
  };

  const startOrResetCommandTimer = () => {
    // clear previous timers
    if (commandTimerRef.current) {
      window.clearInterval(commandTimerRef.current as any);
      commandTimerRef.current = null;
    }
    setCommandCountdown(COMMAND_MODE_SECONDS);
    // decrement countdown every second
    const id = window.setInterval(() => {
      setCommandCountdown(c => {
        if (c <= 1) {
          // stop
          stopCommandMode();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    commandTimerRef.current = id as any;
  };

  const stopCommandMode = () => {
    if (commandTimerRef.current) { window.clearInterval(commandTimerRef.current as any); commandTimerRef.current = null; }
    setCommandMode(false);
    setCommandCountdown(0);
    setVoiceStatus('Listening (automatic)');
  };

  // Floating voice blob visibility state derived from isListening/voiceStatus
  const [showVoiceBlob, setShowVoiceBlob] = useState(false);

  // Vibrate and show floating blob when wake word/listening is active
  useEffect(() => {
    const active = commandMode || (!!isListening && /listening/i.test(voiceStatus));
    setShowVoiceBlob(active);
    // Do NOT auto-start recognition when entering commandMode. Use push-to-talk instead.
    if (active && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate?.([30, 40, 30]); } catch { }
    }
  }, [isListening, voiceStatus, commandMode]);

  const startPushToTalk = () => {
    if (!recognitionRef.current) return;
    try {
      pushTranscriptRef.current = '';
      setPushToTalkActive(true);
      recognitionRef.current.start();
      setIsListening(true);
      setVoiceStatus('Push-to-talk: recording...');
    } catch (e) {
      console.warn('Failed to start push-to-talk', e);
    }
  };

  const stopPushToTalk = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) { }
    setPushToTalkActive(false);
    setIsListening(false);
    setVoiceStatus('Processing push-to-talk...');
    const captured = pushTranscriptRef.current.trim();
    pushTranscriptRef.current = '';
    if (!captured) {
      setVoiceStatus('No speech captured');
      return;
    }

    // Show preview: first try server interpretation, then fallback to local parser
    setPreviewTranscript(captured);
    setPreviewVisible(true);
    setPreviewUpdates(null);
    setVoiceStatus('Interpreting voice command...');
    // Clear any previous preview timer
    if (previewTimerRef.current) { window.clearTimeout(previewTimerRef.current as any); previewTimerRef.current = null; }

    callInterpretAPI(captured).then((result) => {
      if (result && result.updates && result.updates.length > 0) {
        const staged = result.updates.map((u: any) => ({ questionId: u.questionId, value: u.value, confidence: u.confidence || 0.9, reason: u.reason || 'LLM' }));
        setPreviewUpdates(staged);
        setVoiceStatus('Suggested changes ready');
        // schedule auto-apply in 6s
        previewTimerRef.current = window.setTimeout(() => applyPreview(), 6000) as any;
      } else {
        // fallback local parse
        const local = processVoiceCommandAuto(captured);
        if (local && Object.keys(local).length > 0) {
          const staged = Object.keys(local).map(k => ({ questionId: k, value: local[k], confidence: 0.8, reason: 'local' }));
          setPreviewUpdates(staged);
          setVoiceStatus('Suggested changes ready (fallback)');
          previewTimerRef.current = window.setTimeout(() => applyPreview(), 6000) as any;
        } else {
          setPreviewUpdates(null);
          setVoiceStatus('No suggested changes');
          // hide preview after short delay
          previewTimerRef.current = window.setTimeout(() => { setPreviewVisible(false); setPreviewTranscript(''); }, 2000) as any;
        }
      }
    }).catch(err => {
      console.error('Interpret API failed', err);
      const local = processVoiceCommandAuto(captured);
      if (local && Object.keys(local).length > 0) {
        const staged = Object.keys(local).map(k => ({ questionId: k, value: local[k], confidence: 0.8, reason: 'local' }));
        setPreviewUpdates(staged);
        setVoiceStatus('Suggested changes ready (fallback)');
        previewTimerRef.current = window.setTimeout(() => applyPreview(), 6000) as any;
      } else {
        setPreviewUpdates(null);
        setVoiceStatus('No suggested changes');
        previewTimerRef.current = window.setTimeout(() => { setPreviewVisible(false); setPreviewTranscript(''); }, 2000) as any;
      }
    });
  };

  const applyUpdates = (updates: Array<{ questionId: string; value: string }>) => {
    setResponses(prev => {
      const next = { ...prev };
      updates.forEach(u => { if (u.questionId && u.value) next[u.questionId] = u.value; });
      return next;
    });
    hapticFeedback.tap();
  };

  const applyPreview = () => {
    if (!previewUpdates || previewUpdates.length === 0) {
      setPreviewVisible(false);
      setPreviewTranscript('');
      return;
    }
    applyUpdates(previewUpdates.map(p => ({ questionId: p.questionId, value: p.value })));
    setPreviewVisible(false);
    setPreviewTranscript('');
    setPreviewUpdates(null);
    setVoiceStatus('Applied suggested changes');
    if (previewTimerRef.current) { window.clearTimeout(previewTimerRef.current as any); previewTimerRef.current = null; }
  };

  const cancelPreview = () => {
    setPreviewVisible(false);
    setPreviewTranscript('');
    setPreviewUpdates(null);
    setVoiceStatus('Voice changes cancelled');
    if (previewTimerRef.current) { window.clearTimeout(previewTimerRef.current as any); previewTimerRef.current = null; }
  };

  const callInterpretAPI = async (transcript: string) => {
    try {
      const r = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      if (!r.ok) throw new Error('bad response');
      return await r.json();
    } catch (e) {
      throw e;
    }
  };

  // Map TM keywords to ids
  const TM_KEYWORDS: { id: string; keywords: string[] }[] = [
    { id: 'TM_1', keywords: ['frm', 'f r m'] },
    { id: 'TM_2', keywords: ['brm', 'b r m'] },
    { id: 'TM_3', keywords: ['one-pager hot', 'hot cue', 'hot cue cards', 'one pager hot'] },
    { id: 'TM_4', keywords: ['one-pager cold', 'cold cue', 'cold cue cards', 'one pager cold'] },
    { id: 'TM_5', keywords: ['dial-in', 'dial in', 'dialin'] },
    { id: 'TM_6', keywords: ['new-launch', 'new launch', 'new-launch learning', 'new launch learning'] },
    { id: 'TM_7', keywords: ['coffee & hd', 'coffee and hd', 'playbook', 'hd playbook'] },
    { id: 'TM_8', keywords: ['msds', 'chemical chart', 'shelf life chart'] },
    { id: 'TM_9', keywords: ['career progression', 'reward poster', 'career progression chart'] }
  ];

  // Auto-apply fallback parser: scan all sections and return map of questionId -> value
  const processVoiceCommandAuto = (rawCmd: string) => {
    const cmd = rawCmd.toLowerCase();

    // global intents
    if (/\b(all|everything) (is )?(available|present)\b/.test(cmd) || /all training materials/.test(cmd)) {
      const updates: Record<string, string> = {};
      sections.forEach(section => {
        section.items.forEach(item => {
          if (item.type === 'text') return;
          updates[`${section.id}_${item.id}`] = 'yes';
        });
      });
      return updates;
    }

    if (/\b(all|everything) (is )?(not available|unavailable|missing|none)\b/.test(cmd) || /none of the (training )?materials/.test(cmd)) {
      const updates: Record<string, string> = {};
      sections.forEach(section => {
        section.items.forEach(item => {
          if (item.type === 'text') return;
          updates[`${section.id}_${item.id}`] = 'no';
        });
      });
      return updates;
    }

    // Build a list of searchable keyword phrases from all items
    type ItemKeyword = { sectionId: string; itemId: string; phrase: string };
    const keywords: ItemKeyword[] = [];
    sections.forEach(section => {
      section.items.forEach(item => {
        const base = (item.q || '').toLowerCase();
        if (!base) return;
        // split on punctuation and small words to create key phrases
        const tokens = base.split(/[,\/\-()]+/).map(s => s.trim()).filter(Boolean);
        // also include individual significant words
        const words = base.split(/\s+/).filter(w => w.length > 2);
        const phrases = Array.from(new Set([...tokens, ...words]));
        phrases.forEach(p => {
          keywords.push({ sectionId: section.id, itemId: item.id, phrase: p });
        });
      });
    });

    // Now attempt to match phrases in the command
    const matches: { sectionId: string; itemId: string; index: number }[] = [];
    for (const k of keywords) {
      try {
        const re = new RegExp('\\b' + k.phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
        const m = re.exec(cmd);
        if (m && typeof m.index === 'number') matches.push({ sectionId: k.sectionId, itemId: k.itemId, index: m.index });
      } catch (e) { }
    }

    // Use simple heuristics around matches to determine yes/no/na
    const negativeWords = ['cant', "can't", 'cannot', 'not', 'no', 'missing', 'none', 'dont', "don't", 'without'];
    const naPatterns = [/not applicable/, /n a\b/, /\bna\b/];
    const positiveWords = ['available', 'present', 'yes', 'have', 'found', 'ok', 'okay'];

    const updates: Record<string, string> = {};
    // Sort matches by index to handle phrases in order
    matches.sort((a, b) => a.index - b.index);
    matches.forEach(m => {
      const key = `${m.sectionId}_${m.itemId}`;
      // examine a small window around the match
      const start = Math.max(0, m.index - 40);
      const end = Math.min(cmd.length, m.index + 80);
      const window = cmd.slice(start, end);
      if (naPatterns.some(p => p.test(window))) { updates[key] = 'na'; return; }
      if (negativeWords.some(n => window.includes(n))) { updates[key] = 'no'; return; }
      if (positiveWords.some(n => window.includes(n))) { updates[key] = 'yes'; return; }
      updates[key] = 'yes';
    });

    // If user said 'no other' and mentioned some items, mark rest as no
    if (Object.keys(updates).length > 0 && /\b(no other|none of the other|no other training)\b/.test(cmd)) {
      const mentioned = new Set(Object.keys(updates).map(k => k.split('_')[1]));
      sections.forEach(section => {
        section.items.forEach(item => {
          const key = `${section.id}_${item.id}`;
          if (item.type === 'text') return;
          if (!updates[key]) {
            updates[key] = 'no';
          }
        });
      });
    }

    return Object.keys(updates).length > 0 ? updates : null;
  };

  // Keep original processVoiceCommand for compatibility (no-op wrapper)
  const processVoiceCommand = (rawCmd: string) => {
    const res = processVoiceCommandAuto(rawCmd);
    if (res) {
      // For backwards compatibility: stage these if needed
      const staged = Object.keys(res).map(k => ({ questionId: k, value: res[k], confidence: 0.9, reason: 'voice parse', suggestedBy: 'local' }));
      setProposedUpdates(staged);
      setVoiceStatus('Proposed changes ready for review');
    }
  };

  // Calculate TSA Food score and auto-assign points
  const calculateTSAFoodScore = () => {
    const tsaSection = sections.find(s => s.id === 'TSA_Food');
    if (!tsaSection) return 0;

    let correct = 0;
    let total = 0;

    tsaSection.items.forEach(item => {
      // Skip text fields (EMP name/ID) from scoring
      if (item.type === 'text') return;

      const response = responses[`${tsaSection.id}_${item.id}`];
      if (response && response !== 'na') {
        total++;
        if (response === 'yes') {
          correct++;
        }
      }
    });

    if (total === 0) return 0;

    const percentage = (correct / total) * 100;

    // Auto-assign points based on percentage
    if (percentage >= 85) return 10;
    if (percentage >= 75) return 5;
    return 0;
  };

  // Calculate TSA Coffee score and auto-assign points
  const calculateTSACoffeeScore = () => {
    const tsaSection = sections.find(s => s.id === 'TSA_Coffee');
    if (!tsaSection) return 0;

    let correct = 0;
    let total = 0;

    tsaSection.items.forEach(item => {
      // Skip text fields (EMP name/ID) from scoring
      if (item.type === 'text') return;

      const response = responses[`${tsaSection.id}_${item.id}`];
      if (response && response !== 'na') {
        total++;
        if (response === 'yes') {
          correct++;
        }
      }
    });

    if (total === 0) return 0;

    const percentage = (correct / total) * 100;

    // Auto-assign points based on percentage
    if (percentage >= 85) return 10;
    if (percentage >= 75) return 5;
    return 0;
  };

  // Calculate TSA CX score and auto-assign points
  const calculateTSACXScore = () => {
    const tsaSection = sections.find(s => s.id === 'TSA_CX');
    if (!tsaSection) return 0;

    let correct = 0;
    let total = 0;

    tsaSection.items.forEach(item => {
      // Skip text fields (EMP name/ID) from scoring
      if (item.type === 'text') return;

      const response = responses[`${tsaSection.id}_${item.id}`];
      if (response && response !== 'na') {
        total++;
        if (response === 'yes') {
          correct++;
        }
      }
    });

    if (total === 0) return 0;

    const percentage = (correct / total) * 100;

    // Auto-assign points based on percentage
    if (percentage >= 85) return 10;
    if (percentage >= 75) return 5;
    return 0;
  };

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('training_resp', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem('training_meta', JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    localStorage.setItem('training_remarks', JSON.stringify(remarks));
  }, [remarks]);

  useEffect(() => {
    try {
      localStorage.setItem('training_section_images', JSON.stringify(sectionImages));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded for images. Images will be kept in memory only.');
        // Images will still be in state and will be submitted, just not persisted to localStorage
      }
    }
  }, [sectionImages]);

  const handleResponse = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    hapticFeedback.tap();
  };

  const handleTextResponse = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleRemarks = (sectionId: string, value: string) => {
    setRemarks(prev => ({
      ...prev,
      [sectionId]: value
    }));
  };

  const handleImageUpload = (sectionId: string, file: File) => {
    console.log('[ImageUpload] Starting upload for section:', sectionId, 'File:', file.name, 'Size:', file.size, 'Type:', file.type);

    const reader = new FileReader();
    reader.onerror = (error) => {
      console.error('[ImageUpload] FileReader error:', error);
      alert('Failed to read image file. Please try again.');
    };
    reader.onload = (e) => {
      console.log('[ImageUpload] FileReader loaded successfully');
      const result = e.target?.result as string;
      if (!result) {
        console.error('[ImageUpload] No result from FileReader');
        alert('Failed to load image. Please try again.');
        return;
      }

      console.log('[ImageUpload] Result length:', result.length);

      // Compress image before storing
      const img = new Image();
      img.onerror = (error) => {
        console.error('[ImageUpload] Image load error:', error);
        alert('Failed to load image. Please try a different image.');
      };
      img.onload = () => {
        console.log('[ImageUpload] Image loaded:', img.width, 'x', img.height);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('[ImageUpload] Canvas context not available');
            alert('Canvas not supported on this device');
            return;
          }

          // Limit max dimensions to reduce size
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          console.log('[ImageUpload] Resizing to:', width, 'x', height);
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          console.log('[ImageUpload] Compressed size:', compressedDataUrl.length);

          setSectionImages(prev => ({
            ...prev,
            [sectionId]: [...(prev[sectionId] || []), compressedDataUrl]
          }));
          console.log('[ImageUpload] Image added to section:', sectionId);
          hapticFeedback.select();
        } catch (error) {
          console.error('[ImageUpload] Error compressing image:', error);
          alert('Failed to process image. Please try a smaller image.');
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (sectionId: string, imageIndex: number) => {
    setSectionImages(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter((_, index) => index !== imageIndex)
    }));
    hapticFeedback.select();
  };

  const handleEditImage = (sectionId: string, imageIndex: number) => {
    const imageData = sectionImages[sectionId]?.[imageIndex];
    if (imageData) {
      setEditingImage({ sectionId, imageIndex, imageData });
    }
  };

  const handleSaveEditedImage = (editedImageData: string) => {
    if (editingImage) {
      console.log('[EditImage] Saving edited image for section:', editingImage.sectionId, 'Index:', editingImage.imageIndex);
      // Compress the edited image before saving
      const img = new Image();
      img.onerror = (error) => {
        console.error('[EditImage] Error loading edited image:', error);
        alert('Failed to save edited image. Please try again.');
        setEditingImage(null);
      };
      img.onload = () => {
        console.log('[EditImage] Edited image loaded:', img.width, 'x', img.height);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('[EditImage] Canvas context not available');
            alert('Canvas not supported on this device');
            setEditingImage(null);
            return;
          }

          // Limit max dimensions to reduce size
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          console.log('[EditImage] Compressed data URL length:', compressedDataUrl.length);

          setSectionImages(prev => {
            const updatedImages = [...(prev[editingImage.sectionId] || [])];
            console.log('[EditImage] Updating image at index:', editingImage.imageIndex, 'in section:', editingImage.sectionId);
            console.log('[EditImage] Previous images in section:', updatedImages.length);
            updatedImages[editingImage.imageIndex] = compressedDataUrl;
            const newState = {
              ...prev,
              [editingImage.sectionId]: updatedImages
            };
            console.log('[EditImage] New section images state:', Object.keys(newState).map(key => `${key}: ${newState[key].length} images`));
            return newState;
          });
          console.log('[EditImage] Closing editor');
          setEditingImage(null);
          hapticFeedback.success();
        } catch (error) {
          console.error('Error processing edited image:', error);
          alert('Failed to save edited image. Please try again.');
          setEditingImage(null);
        }
      };
      img.src = editedImageData;
    }
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
  };

  const handleMetaChange = (field: keyof TrainingMeta, value: string) => {
    // Implement cascading clear logic
    if (field === 'trainerName' || field === 'trainerId') {
      // When trainer changes, clear AM and store
      setMeta(prev => ({
        ...prev,
        [field]: value,
        amName: '',
        amId: '',
        mappedTrainerName: '',
        mappedTrainerId: '',
        storeName: '',
        storeId: ''
      }));
    } else if (field === 'amName' || field === 'amId') {
      // When AM changes, clear store only
      setMeta(prev => ({
        ...prev,
        [field]: value,
        mappedTrainerName: '',
        mappedTrainerId: '',
        storeName: '',
        storeId: ''
      }));
    } else {
      // For other fields (store, mod), no cascading clear needed
      setMeta(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    // Check if all required fields are filled
    const incompleteQuestions: string[] = [];

    sections.forEach(section => {
      section.items.forEach(item => {
        const questionId = `${section.id}_${item.id}`;
        if (!responses[questionId]) {
          incompleteQuestions.push(`${section.title}: ${item.q}`);
        }
      });
    });

    if (incompleteQuestions.length > 0) {
      // Scroll to first unanswered question
      const firstIncompleteSection = sections.find(section =>
        section.items.some(item => {
          const questionId = `${section.id}_${item.id}`;
          return !responses[questionId];
        })
      );

      if (firstIncompleteSection) {
        const sectionElement = document.getElementById(`section-${firstIncompleteSection.id}`);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      alert(`Please answer all questions. Missing:\n${incompleteQuestions.slice(0, 3).join('\n')}${incompleteQuestions.length > 3 ? `\n... and ${incompleteQuestions.length - 3} more` : ''}`);
      return;
    }

    // Check if all required meta fields are filled
    const missingFields: string[] = [];
    if (!meta.storeName || !meta.storeId) missingFields.push('Store Location');
    if (!meta.trainerName || !meta.trainerId) missingFields.push('Trainer');
    if (!meta.auditorName || !meta.auditorId) missingFields.push('Auditor');
    if (!meta.amName || !meta.amId) missingFields.push('Area Manager');
    if (!meta.mod) missingFields.push('MOD (Manager on Duty)');

    if (missingFields.length > 0) {
      // Scroll to audit information section
      const auditInfoElement = document.getElementById('audit-information');
      if (auditInfoElement) {
        auditInfoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      alert(`Please fill in all required audit information fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      // Calculate scores
      let totalScore = 0;
      let maxScore = 0;
      const sectionScores: Record<string, number> = {};

      sections.forEach(section => {
        let sectionScore = 0;
        let sectionMax = 0;

        if (section.id === 'TSA_Food') {
          // Use the automatic TSA Food scoring (0/5/10 based on percentage)
          sectionScore = calculateTSAFoodScore();
          sectionMax = 10; // TSA sections have max score of 10
        } else if (section.id === 'TSA_Coffee') {
          // Use the automatic TSA Coffee scoring (0/5/10 based on percentage)
          sectionScore = calculateTSACoffeeScore();
          sectionMax = 10; // TSA sections have max score of 10
        } else if (section.id === 'TSA_CX') {
          // Use the automatic TSA CX scoring (0/5/10 based on percentage)
          sectionScore = calculateTSACXScore();
          sectionMax = 10; // TSA sections have max score of 10
        } else {
          // Regular sections - calculate based on responses
          section.items.forEach(item => {
            const questionId = `${section.id}_${item.id}`;
            const response = responses[questionId];

            // Skip text fields (EMP name/ID) in scoring
            if (item.type === 'text') return;

            if (response === 'yes') {
              sectionScore += item.w;
            } else if (response === 'no' && item.wneg) {
              sectionScore += item.wneg; // Add negative score
            }

            if (response !== 'na') {
              sectionMax += Math.abs(item.w);
            }
          });
        }

        sectionScores[section.id] = sectionScore;
        totalScore += sectionScore;
        maxScore += sectionMax;
      });

      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      // For dashboards, we want the designated (store-mapped) trainer, not the auditor.
      const dashboardTrainerName = meta.mappedTrainerName || meta.trainerName;
      const dashboardTrainerId = meta.mappedTrainerId || meta.trainerId;

      // Submit to Google Sheets
      const formData = new URLSearchParams({
        timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }),
        trainerName: dashboardTrainerName,
        trainerId: dashboardTrainerId,
        auditorName: meta.auditorName,
        auditorId: meta.auditorId,
        amName: meta.amName,
        amId: meta.amId,
        storeName: meta.storeName,
        storeId: meta.storeId,
        mod: meta.mod,
        totalScore: totalScore.toString(),
        maxScore: maxScore.toString(),
        percentage: percentage.toString(),
        type: 'Training',
        // TSA individual scores (0/5/10 based on percentage)
        TSA_Food_Score: calculateTSAFoodScore().toString(),
        TSA_Coffee_Score: calculateTSACoffeeScore().toString(),
        TSA_CX_Score: calculateTSACXScore().toString()
      });

      // Add individual responses
      sections.forEach(section => {
        section.items.forEach(item => {
          const questionId = `${section.id}_${item.id}`;
          // Send just the item.id (e.g., TM_1) to match Google Apps Script expectations
          formData.append(item.id, responses[questionId] || '');
        });
      });

      // Add remarks
      sections.forEach(section => {
        if (remarks[section.id]) {
          // Convert section names to abbreviations for remarks
          const sectionAbbr = section.id === 'TrainingMaterials' ? 'TM' :
            section.id === 'LMS' ? 'LMS' :
              section.id === 'Buddy' ? 'Buddy' :
                section.id === 'NewJoiner' ? 'NJ' :
                  section.id === 'PartnerKnowledge' ? 'PK' :
                    section.id === 'TSA_Food' ? 'TSA_Food' :
                      section.id === 'TSA_Coffee' ? 'TSA_Coffee' :
                        section.id === 'TSA_CX' ? 'TSA_CX' :
                          section.id === 'CustomerExperience' ? 'CX' :
                            section.id === 'ActionPlan' ? 'AP' : section.id;
          formData.append(`${sectionAbbr}_remarks`, remarks[section.id]);
        }
      });

      // Add section images as JSON
      formData.append('sectionImages', JSON.stringify(sectionImages));

      const response = await fetch('https://script.google.com/macros/s/AKfycbzEyJQiAhl3pS90uvkf-3e1mIbq8WNs7-xMtuBwD6eOy85Kkx6EKpzUsHW-oxp6NAoqjQ/exec', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setSubmitted(true);
        hapticFeedback.success();

        // Clear the form
        localStorage.removeItem('training_resp');
        localStorage.removeItem('training_meta');
        localStorage.removeItem('training_remarks');
        localStorage.removeItem('training_section_images');
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting training audit:', error);
      alert('Failed to submit training audit. Please try again.');
      hapticFeedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  const resetChecklist = () => {
    localStorage.removeItem('training_resp');
    localStorage.removeItem('training_meta');
    localStorage.removeItem('training_remarks');
    localStorage.removeItem('training_section_images');
    setResponses({});
    setRemarks({});
    setSectionImages({});
    setMeta({
      amName: '',
      amId: '',
      trainerName: '',
      trainerId: '',
      auditorName: '',
      auditorId: '',
      mappedTrainerName: '',
      mappedTrainerId: '',
      storeName: '',
      storeId: '',
      mod: ''
    });
    hapticFeedback.tap();
  };

  const startNewChecklist = () => {
    setSubmitted(false);
    setResponses({});
    setRemarks({});
    setSectionImages({});
    setMeta({
      amName: '',
      amId: '',
      trainerName: '',
      trainerId: '',
      auditorName: '',
      auditorId: '',
      mappedTrainerName: '',
      mappedTrainerId: '',
      storeName: '',
      storeId: '',
      mod: ''
    });
    localStorage.removeItem('training_resp');
    localStorage.removeItem('training_meta');
    localStorage.removeItem('training_remarks');
    localStorage.removeItem('training_section_images');
    hapticFeedback.tap();
  };

  return (
    <>
      {/* Proposed updates modal */}
      {proposedUpdates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(2,6,23,0.78)', backdropFilter: 'blur(20px) saturate(120%)' }}>
          {/* backdrop click handled by parent div */}
          <div className="relative w-11/12 max-w-2xl rounded shadow-lg p-4" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Proposed voice changes</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Review suggested answers and apply when ready.</p>
            <div className="max-h-64 overflow-auto mb-3">
              {proposedUpdates.map((u, i) => (
                <div key={u.questionId} className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-slate-700">
                  <div>
                    <div className="text-sm text-gray-900 dark:text-slate-100 font-medium">{u.questionId}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{u.reason || ''} — confidence {(u.confidence || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-slate-300">{u.value.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setProposedUpdates(null)} className="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded">Reject</button>
              <button onClick={() => {
                // Apply all proposed updates
                setResponses(prev => {
                  const next = { ...prev };
                  proposedUpdates.forEach(u => { next[u.questionId] = u.value; });
                  return next;
                });
                setProposedUpdates(null);
                setVoiceStatus('Applied proposed updates');
              }} className="px-3 py-1 bg-green-600 text-white rounded">Apply All</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating voice blob (appears when listening/wake word detected) */}
      {showVoiceBlob && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: 20,
            bottom: 24,
            zIndex: 60,
            width: 160,
            maxWidth: '30vw',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            borderRadius: 28,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <div style={{
            width: 14,
            height: 14,
            borderRadius: 14,
            background: '#ef4444',
            boxShadow: '0 0 12px rgba(239,68,68,0.9)',
            animation: 'prism-voice-pulse 1200ms infinite'
          }} aria-hidden="true" />
          <div style={{ fontSize: 12, color: '#0f172a' }}>
            <div style={{ fontWeight: 600 }}>Listening</div>
            <div style={{ fontSize: 11, color: '#475569', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastCommand || voiceStatus}</div>
          </div>
          <style>{`@keyframes prism-voice-pulse { 0% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.35); opacity: 0.6 } 100% { transform: scale(1); opacity: 1 } }`}</style>
        </div>
      )}
      {/* Push-to-talk microphone button (hold to talk) - HIDDEN */}
      {false && (
        <div style={{ position: 'fixed', right: 22, bottom: 96, zIndex: 80, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
          <button
            title="Hold to talk"
            onMouseDown={(e) => { e.preventDefault(); startPushToTalk(); }}
            onMouseUp={(e) => { e.preventDefault(); stopPushToTalk(); }}
            onMouseLeave={(e) => { if (pushToTalkActive) stopPushToTalk(); }}
            onTouchStart={(e) => { e.preventDefault(); startPushToTalk(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopPushToTalk(); }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background: pushToTalkActive ? 'linear-gradient(135deg,#ef4444,#f97316)' : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
              boxShadow: '0 6px 18px rgba(15,23,42,0.16)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 11v1a7 7 0 0 1-14 0v-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontSize: 11, marginTop: 4 }}>{pushToTalkActive ? 'Release' : 'Hold'}</div>
            </div>
          </button>
        </div>
      )}
      {/* Preview toast for captured voice */}
      {previewVisible && (
        <div style={{ position: 'fixed', right: 22 + 80, bottom: 110, zIndex: 100, width: 320, maxWidth: '40vw' }}>
          <div style={{ background: 'linear-gradient(180deg,#fff,#f8fafc)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 12, padding: 12, boxShadow: '0 8px 30px rgba(2,6,23,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Voice preview</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{previewUpdates ? `${previewUpdates.length} changes` : 'No changes'}</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#0f172a', maxHeight: 72, overflow: 'auto' }}>{previewTranscript}</div>
            {previewUpdates && previewUpdates.length > 0 && (
              <div style={{ marginTop: 8, borderTop: '1px dashed rgba(15,23,42,0.06)', paddingTop: 8 }}>
                <div style={{ fontSize: 12, color: '#334155', marginBottom: 6 }}>Suggested updates:</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxHeight: 120, overflow: 'auto' }}>
                  {previewUpdates.slice(0, 6).map((p, idx) => (
                    <li key={idx} style={{ fontSize: 13, color: '#0f172a', padding: '4px 0' }}>{p.questionId.replace('TrainingMaterials_', '')}: <strong>{p.value}</strong></li>
                  ))}
                  {previewUpdates.length > 6 && <li style={{ fontSize: 12, color: '#64748b', paddingTop: 6 }}>and {previewUpdates.length - 6} more...</li>}
                </ul>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button onClick={cancelPreview} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.06)', background: '#fff' }}>Cancel</button>
              <button onClick={applyPreview} style={{ padding: '6px 10px', borderRadius: 8, background: 'linear-gradient(90deg,#10b981,#06b6d4)', color: '#fff', border: 'none' }}>Apply now</button>
            </div>
          </div>
        </div>
      )}
      {/* Show submission success screen */}
      {submitted ? (
        <div className="w-full">
          {/* Header Banner - Full Width */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-3 sm:p-4 border-b border-purple-200 dark:border-purple-800">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span className="break-words">Training Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              Comprehensive training assessment for trainers.
            </p>
          </div>

          {/* Success Message */}
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center border border-green-200 dark:border-green-800">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">
                Training Checklist Submitted Successfully!
              </h2>
              <p className="text-green-600 dark:text-green-400 mb-6">
                Your checklist has been recorded and will be processed for dashboard insights.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={startNewChecklist}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start New Checklist
                </button>
                <button
                  onClick={() => window.location.href = '/Prism/?tab=dashboard'}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full min-h-screen">
          {/* Header Banner - Full Width */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-3 sm:p-4 border-b border-purple-200 dark:border-purple-800">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span className="break-words">Training Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              Comprehensive training assessment for trainers.
            </p>
          </div>

          {/* Meta Information Form - Full Width */}
          <div id="audit-information" className="bg-gray-50 dark:bg-slate-900 p-3 sm:p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
              Audit Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Area Manager
                </label>
                <input
                  type="text"
                  value={meta.amId ? `${meta.amName} (${meta.amId})` : ''}
                  readOnly
                  placeholder="Will auto-fill when store is selected..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 cursor-not-allowed"
                />
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Auto-filled from store mapping
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Trainer (Auditor)
                </label>
                <input
                  type="text"
                  value={trainerSearchTerm || (meta.trainerId ? `${meta.trainerName || 'Loading...'} (${meta.trainerId})` : '')}
                  onChange={(e) => {
                    setTrainerSearchTerm(e.target.value);
                    setShowTrainerDropdown(true);
                    setSelectedTrainerIndex(-1);
                  }}
                  onFocus={() => setShowTrainerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTrainerDropdown(false), 200)}
                  placeholder="Search Trainer..."
                  readOnly={isTrainerIdFromURL && !!meta.trainerId}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md ${isTrainerIdFromURL && meta.trainerId
                      ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100'
                    }`}
                />

                {isTrainerIdFromURL && meta.trainerId && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Trainer ID picked from URL parameters
                  </p>
                )}

                {showTrainerDropdown && !isTrainerIdFromURL && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {uniqueTrainers.length === 0 ? (
                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">No trainers found</div>
                    ) : filteredTrainers.length > 0 ? (
                      filteredTrainers.map((trainer, index) => (
                        <button
                          key={trainer.id}
                          onClick={() => {
                            handleMetaChange('trainerId', trainer.id as string);
                            handleMetaChange('trainerName', trainer.name as string);
                            autoFillFields('trainer', trainer.name as string);
                            setTrainerSearchTerm('');
                            setShowTrainerDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm break-words ${index === selectedTrainerIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                            }`}
                        >
                          <div className="truncate">{trainer.name} ({trainer.id})</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">No trainers found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Auditor
                </label>
                <input
                  type="text"
                  value={auditorSearchTerm || (meta.auditorId ? `${meta.auditorName || 'Loading...'} (${meta.auditorId})` : '')}
                  onChange={(e) => {
                    setAuditorSearchTerm(e.target.value);
                    setShowAuditorDropdown(true);
                    setSelectedAuditorIndex(-1);
                  }}
                  onFocus={() => setShowAuditorDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAuditorDropdown(false), 200)}
                  placeholder="Search Auditor (can be same as Trainer)..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                />

                {showAuditorDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {uniqueTrainers.length === 0 ? (
                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">No auditors found</div>
                    ) : filteredAuditors.length > 0 ? (
                      filteredAuditors.map((auditor, index) => (
                        <button
                          key={auditor.id}
                          onClick={() => {
                            handleMetaChange('auditorId', auditor.id as string);
                            handleMetaChange('auditorName', auditor.name as string);
                            setAuditorSearchTerm('');
                            setShowAuditorDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm break-words ${index === selectedAuditorIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                            }`}
                        >
                          <div className="truncate">{auditor.name} ({auditor.id})</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">No auditors found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2" data-tour="store-select">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Store Location
                  </label>
                  <input
                    type="text"
                    value={storeSearchTerm || (meta.storeId ? `${meta.storeName} (${meta.storeId})` : '')}
                    onChange={(e) => {
                      setStoreSearchTerm(e.target.value);
                      setShowStoreDropdown(true);
                      setSelectedStoreIndex(-1);
                    }}
                    onFocus={() => setShowStoreDropdown(true)}
                    onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
                    placeholder="Search Store..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  />

                  {showStoreDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredStores.length > 0 ? (
                        filteredStores.map((store, index) => (
                          <button
                            key={store.id}
                            onClick={() => {
                              handleMetaChange('storeId', store.id as string);
                              handleMetaChange('storeName', store.name as string);
                              autoFillFields('store', store.id as string);
                              setStoreSearchTerm('');
                              setShowStoreDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm break-words ${index === selectedStoreIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                              }`}
                          >
                            <div className="truncate">{store.name} ({store.id})</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">No stores found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  MOD (Manager on Duty)
                </label>
                <input
                  type="text"
                  value={modSearchTerm || meta.mod}
                  onChange={(e) => {
                    setModSearchTerm(e.target.value);
                    setShowModDropdown(true);
                    setSelectedModIndex(-1);
                  }}
                  onFocus={() => setShowModDropdown(true)}
                  onBlur={() => setTimeout(() => setShowModDropdown(false), 200)}
                  placeholder="Search for Store Manager, ASM, or Shift Supervisor..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                />

                {showModDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {employeeLoading ? (
                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">Loading employees...</div>
                    ) : filteredModEmployees.length > 0 ? (
                      filteredModEmployees.map((mod, index) => (
                        <button
                          key={mod.id}
                          onClick={() => {
                            handleMetaChange('mod', mod.name);
                            setModSearchTerm('');
                            setShowModDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm ${index === selectedModIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                            }`}
                        >
                          <div className="font-medium">{mod.name}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{mod.designation} • {mod.location || mod.id}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">
                        {modSearchTerm ? 'No matching managers found' : 'Start typing to search...'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Training sections - Full Width */}
          <div className="bg-white dark:bg-slate-800 p-3 sm:p-4" data-tour="checklist-form">
            {/* Voice controls for quick filling - HIDDEN */}
            {false && (
              <div className="mb-4 p-3 border border-dashed rounded bg-gray-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">Voice Commands</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Push-to-talk: press and hold the mic, speak, then release to apply</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSpeechSupported && (
                      <div className="text-xs text-red-500">Speech not supported in this browser</div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-700 dark:text-slate-300 mb-1">Status: <span className="font-medium">{voiceStatus || (isSpeechSupported ? 'Idle' : 'Unavailable')}</span>{commandMode ? <span className="ml-2 text-xs text-green-600"> • Command mode ({commandCountdown}s)</span> : null}</div>
              </div>
            )}

            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
              Training Assessment
            </h2>

            <div className="space-y-4">
              {sections.map((section, sectionIndex) => {
                // Special handling for TSA Food section
                if (section.id === 'TSA_Food') {
                  // Group items by subsection for TSA Food
                  const groupedItems = section.items.reduce((groups, item) => {
                    const typedItem = item as SectionItem;
                    const subsection = typedItem.section || 'Other';
                    if (!groups[subsection]) groups[subsection] = [];
                    groups[subsection].push(typedItem);
                    return groups;
                  }, {} as Record<string, SectionItem[]>);

                  const tsaScore = calculateTSAFoodScore();
                  const tsaPercentage = () => {
                    let correct = 0, total = 0;
                    section.items.forEach(item => {
                      const response = responses[`${section.id}_${item.id}`];
                      if (response && response !== 'na' && item.type !== 'text') {
                        total++;
                        if (response === 'yes') correct++;
                      }
                    });
                    return total > 0 ? ((correct / total) * 100).toFixed(1) : '0';
                  };

                  return (
                    <div key={section.id} className="border-l-4 border-orange-500 pl-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                            {section.title}
                          </h3>
                          <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                            Score: {tsaPercentage()}% = {tsaScore} points
                            <span className="ml-2 text-xs">
                              (≥85% = 10pts, 75-84% = 5pts, &lt;75% = 0pts)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTsaExpanded(!tsaExpanded)}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors shrink-0 w-full sm:w-auto"
                        >
                          <span className="text-sm sm:text-base">{tsaExpanded ? 'Collapse' : 'Expand'}</span>
                          <span className="hidden sm:inline">Assessment</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${tsaExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {tsaExpanded && (
                        <div className="space-y-4 bg-orange-50 dark:bg-orange-900/10 p-3 border-l-4 border-orange-400 dark:border-orange-500">
                          {Object.entries(groupedItems).map(([subsectionName, items]) => (
                            <div key={subsectionName} className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-600">
                              <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
                                {subsectionName}
                              </h4>
                              <div className="space-y-2">
                                {(items as SectionItem[]).map((item, itemIndex) => (
                                  <div key={item.id} className="p-2 sm:p-3 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors rounded">
                                    <div className="flex items-start gap-2">
                                      <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium flex-shrink-0 mt-0.5">
                                        {itemIndex + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 leading-tight mb-2">
                                          {item.q}
                                          {/* Debug: show item type */}
                                          <span className="ml-2 text-xs text-gray-400">({item.type || 'undefined'})</span>
                                        </p>
                                        <div className="">
                                          {item.type === 'employee' ? (
                                            <div className="relative">
                                              <input
                                                type="text"
                                                value={employeeSearchTerms[`${section.id}_${item.id}`] || responses[`${section.id}_${item.id}`] || ''}
                                                onChange={(e) => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setEmployeeSearchTerms(prev => ({ ...prev, [fieldKey]: e.target.value }));
                                                  setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: true }));
                                                  setSelectedEmployeeIndex(prev => ({ ...prev, [fieldKey]: -1 }));
                                                }}
                                                onFocus={() => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: true }));
                                                }}
                                                onBlur={() => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setTimeout(() => setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: false })), 200);
                                                }}
                                                className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-slate-600 rounded text-xs sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                                placeholder="Search employee..."
                                              />

                                              {showEmployeeDropdown[`${section.id}_${item.id}`] && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                                  {employeeLoading ? (
                                                    <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">Loading employees...</div>
                                                  ) : (() => {
                                                    const searchTerm = employeeSearchTerms[`${section.id}_${item.id}`] || '';
                                                    const filtered = allEmployeesForTSA.filter(emp =>
                                                      searchTerm === '' ||
                                                      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                      emp.id.toLowerCase().includes(searchTerm.toLowerCase())
                                                    );

                                                    return filtered.length > 0 ? (
                                                      filtered.map((emp, index) => (
                                                        <button
                                                          key={emp.id}
                                                          onClick={() => {
                                                            const fieldKey = `${section.id}_${item.id}`;
                                                            const value = `${emp.name} (${emp.id})`;
                                                            handleTextResponse(fieldKey, value);
                                                            setEmployeeSearchTerms(prev => ({ ...prev, [fieldKey]: '' }));
                                                            setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: false }));
                                                          }}
                                                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm ${index === selectedEmployeeIndex[`${section.id}_${item.id}`] ? 'bg-gray-100 dark:bg-slate-700' : ''
                                                            }`}
                                                        >
                                                          <div className="font-medium">{emp.name}</div>
                                                          <div className="text-xs text-gray-500 dark:text-slate-400">{emp.id} • {emp.designation}</div>
                                                        </button>
                                                      ))
                                                    ) : (
                                                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">
                                                        {searchTerm ? 'No matching employees found' : 'Start typing to search...'}
                                                      </div>
                                                    );
                                                  })()}
                                                </div>
                                              )}
                                            </div>
                                          ) : item.type === 'text' ? (
                                            <input
                                              type="text"
                                              value={responses[`${section.id}_${item.id}`] || ''}
                                              onChange={(e) => handleTextResponse(`${section.id}_${item.id}`, e.target.value)}
                                              className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-slate-600 rounded text-xs sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                              placeholder="Enter value"
                                            />
                                          ) : (
                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                              {['yes', 'no', 'na'].map(option => (
                                                <label key={option} className="flex items-center space-x-1 cursor-pointer min-w-0 shrink-0">
                                                  <input
                                                    type="radio"
                                                    name={`${section.id}_${item.id}`}
                                                    value={option}
                                                    checked={responses[`${section.id}_${item.id}`] === option}
                                                    onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                                    className="w-4 h-4 text-orange-600 border-gray-300 dark:border-slate-600 focus:ring-orange-500 shrink-0"
                                                  />
                                                  <span className="text-sm text-gray-700 dark:text-slate-300 capitalize">{option}</span>
                                                </label>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section Remarks for TSA Food */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Section Remarks
                        </label>
                        <textarea
                          value={remarks[section.id] || ''}
                          onChange={(e) => handleRemarks(section.id, e.target.value)}
                          placeholder={`Add remarks for ${section.title} section (optional)`}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                        />
                      </div>

                      {/* Image Upload Section */}
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">
                          Upload Images
                        </h3>

                        <div className="mb-4 flex flex-col sm:flex-row gap-3">
                          <input
                            id={`camera-${section.id}`}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(section.id, file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`camera-${section.id}`}
                            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Take Photo
                          </label>
                          <input
                            id={`upload-${section.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(section.id, file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`upload-${section.id}`}
                            className="flex-1 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 rounded-md font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upload Image
                          </label>
                        </div>

                        {/* Display uploaded images */}
                        {sectionImages[section.id] && sectionImages[section.id].length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {sectionImages[section.id].map((image, index) => (
                              <div key={index} className="relative rounded-lg overflow-hidden shadow-sm">
                                <img
                                  src={image}
                                  alt={`${section.title} - Image ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <button
                                    onClick={() => handleEditImage(section.id, index)}
                                    className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-colors"
                                    aria-label="Edit image"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => removeImage(section.id, index)}
                                    className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-colors"
                                    aria-label="Delete image"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Special handling for TSA Coffee section
                if (section.id === 'TSA_Coffee') {
                  // Group items by subsection for TSA Coffee
                  const groupedItems = section.items.reduce((groups, item) => {
                    const typedItem = item as SectionItem;
                    const subsection = typedItem.section || 'Other';
                    if (!groups[subsection]) groups[subsection] = [];
                    groups[subsection].push(typedItem);
                    return groups;
                  }, {} as Record<string, SectionItem[]>);

                  const tsaScore = calculateTSACoffeeScore();
                  const tsaPercentage = () => {
                    let correct = 0, total = 0;
                    section.items.forEach(item => {
                      const response = responses[`${section.id}_${item.id}`];
                      if (response && response !== 'na' && item.type !== 'text') {
                        total++;
                        if (response === 'yes') correct++;
                      }
                    });
                    return total > 0 ? ((correct / total) * 100).toFixed(1) : '0';
                  };

                  return (
                    <div key={section.id} className="border-l-4 border-yellow-500 pl-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                            {section.title}
                          </h3>
                          <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                            Score: {tsaPercentage()}% = {tsaScore} points
                            <span className="ml-2 text-xs">
                              (≥85% = 10pts, 75-84% = 5pts, &lt;75% = 0pts)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTsaCoffeeExpanded(!tsaCoffeeExpanded)}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors shrink-0 w-full sm:w-auto"
                        >
                          <span className="text-sm sm:text-base">{tsaCoffeeExpanded ? 'Collapse' : 'Expand'}</span>
                          <span className="hidden sm:inline">Assessment</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${tsaCoffeeExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {tsaCoffeeExpanded && (
                        <div className="space-y-4 bg-yellow-50 dark:bg-yellow-900/10 p-3 border-l-4 border-yellow-400 dark:border-yellow-500">
                          {Object.entries(groupedItems).map(([subsectionName, items]) => (
                            <div key={subsectionName} className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-600">
                              <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
                                {subsectionName}
                              </h4>
                              <div className="space-y-2 sm:space-y-3">
                                {(items as SectionItem[]).map((item, itemIndex) => (
                                  <div key={item.id} className="p-2 sm:p-3 border border-gray-200 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-start gap-2 sm:gap-3">
                                      <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium flex-shrink-0 mt-0.5">
                                        {itemIndex + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 leading-relaxed mb-2 sm:mb-3">
                                          {item.q}
                                        </p>
                                        <div className="">
                                          {item.type === 'employee' ? (
                                            <div className="relative">
                                              <input
                                                type="text"
                                                value={employeeSearchTerms[`${section.id}_${item.id}`] || responses[`${section.id}_${item.id}`] || ''}
                                                onChange={(e) => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setEmployeeSearchTerms(prev => ({ ...prev, [fieldKey]: e.target.value }));
                                                  setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: true }));
                                                  setSelectedEmployeeIndex(prev => ({ ...prev, [fieldKey]: -1 }));
                                                }}
                                                onFocus={() => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: true }));
                                                }}
                                                onBlur={() => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setTimeout(() => setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: false })), 200);
                                                }}
                                                className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-slate-600 rounded text-xs sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                                placeholder="Search employee..."
                                              />

                                              {showEmployeeDropdown[`${section.id}_${item.id}`] && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                                  {employeeLoading ? (
                                                    <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">Loading employees...</div>
                                                  ) : (() => {
                                                    const searchTerm = employeeSearchTerms[`${section.id}_${item.id}`] || '';
                                                    const filtered = allEmployeesForTSA.filter(emp =>
                                                      searchTerm === '' ||
                                                      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                      emp.id.toLowerCase().includes(searchTerm.toLowerCase())
                                                    );

                                                    return filtered.length > 0 ? (
                                                      filtered.map((emp, index) => (
                                                        <button
                                                          key={emp.id}
                                                          onClick={() => {
                                                            const fieldKey = `${section.id}_${item.id}`;
                                                            const value = `${emp.name} (${emp.id})`;
                                                            handleTextResponse(fieldKey, value);
                                                            setEmployeeSearchTerms(prev => ({ ...prev, [fieldKey]: '' }));
                                                            setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: false }));
                                                          }}
                                                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm ${index === selectedEmployeeIndex[`${section.id}_${item.id}`] ? 'bg-gray-100 dark:bg-slate-700' : ''
                                                            }`}
                                                        >
                                                          <div className="font-medium">{emp.name}</div>
                                                          <div className="text-xs text-gray-500 dark:text-slate-400">{emp.id} • {emp.designation}</div>
                                                        </button>
                                                      ))
                                                    ) : (
                                                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">
                                                        {searchTerm ? 'No matching employees found' : 'Start typing to search...'}
                                                      </div>
                                                    );
                                                  })()}
                                                </div>
                                              )}
                                            </div>
                                          ) : item.type === 'text' ? (
                                            <input
                                              type="text"
                                              value={responses[`${section.id}_${item.id}`] || ''}
                                              onChange={(e) => handleTextResponse(`${section.id}_${item.id}`, e.target.value)}
                                              className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-slate-600 rounded text-xs sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                              placeholder="Enter value"
                                            />
                                          ) : (
                                            <div className="flex flex-wrap gap-2 sm:gap-4">
                                              {['yes', 'no', 'na'].map(option => (
                                                <label key={option} className="flex items-center space-x-1 sm:space-x-2 cursor-pointer min-w-0 shrink-0">
                                                  <input
                                                    type="radio"
                                                    name={`${section.id}_${item.id}`}
                                                    value={option}
                                                    checked={responses[`${section.id}_${item.id}`] === option}
                                                    onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                                    className="w-4 h-4 text-yellow-600 border-gray-300 dark:border-slate-600 focus:ring-yellow-500 shrink-0"
                                                  />
                                                  <span className="text-sm text-gray-700 dark:text-slate-300 capitalize font-medium">{option}</span>
                                                </label>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section Remarks for TSA Coffee */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Section Remarks
                        </label>
                        <textarea
                          value={remarks[section.id] || ''}
                          onChange={(e) => handleRemarks(section.id, e.target.value)}
                          placeholder={`Add remarks for ${section.title} section (optional)`}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-yellow-500 dark:focus:border-yellow-400 focus:outline-none"
                        />
                      </div>

                      {/* Image Upload Section */}
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">
                          Upload Images
                        </h3>

                        <div className="mb-4 flex flex-col sm:flex-row gap-3">
                          <input
                            id={`camera-${section.id}`}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(section.id, file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`camera-${section.id}`}
                            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Take Photo
                          </label>
                          <input
                            id={`upload-${section.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(section.id, file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`upload-${section.id}`}
                            className="flex-1 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 rounded-md font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upload Image
                          </label>
                        </div>

                        {/* Display uploaded images */}
                        {sectionImages[section.id] && sectionImages[section.id].length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {sectionImages[section.id].map((image, index) => (
                              <div key={index} className="relative rounded-lg overflow-hidden shadow-sm">
                                <img
                                  src={image}
                                  alt={`${section.title} - Image ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <button
                                    onClick={() => handleEditImage(section.id, index)}
                                    className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-colors"
                                    aria-label="Edit image"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => removeImage(section.id, index)}
                                    className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-colors"
                                    aria-label="Delete image"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Special handling for TSA CX section
                if (section.id === 'TSA_CX') {
                  // Group items by subsection for TSA CX
                  const groupedItems = section.items.reduce((groups, item) => {
                    const typedItem = item as SectionItem;
                    const subsection = typedItem.section || 'Other';
                    if (!groups[subsection]) groups[subsection] = [];
                    groups[subsection].push(typedItem);
                    return groups;
                  }, {} as Record<string, SectionItem[]>);

                  const tsaScore = calculateTSACXScore();
                  const tsaPercentage = () => {
                    let correct = 0, total = 0;
                    section.items.forEach(item => {
                      const response = responses[`${section.id}_${item.id}`];
                      if (response && response !== 'na' && item.type !== 'text') {
                        total++;
                        if (response === 'yes') correct++;
                      }
                    });
                    return total > 0 ? ((correct / total) * 100).toFixed(1) : '0';
                  };

                  return (
                    <div key={section.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                            {section.title}
                          </h3>
                          <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                            Score: {tsaPercentage()}% = {tsaScore} points
                            <span className="ml-2 text-xs">
                              (≥85% = 10pts, 75-84% = 5pts, &lt;75% = 0pts)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTsaCXExpanded(!tsaCXExpanded)}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors shrink-0 w-full sm:w-auto"
                        >
                          <span className="text-sm sm:text-base">{tsaCXExpanded ? 'Collapse' : 'Expand'}</span>
                          <span className="hidden sm:inline">Assessment</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${tsaCXExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {tsaCXExpanded && (
                        <div className="space-y-4 bg-blue-50 dark:bg-blue-900/10 p-3 border-l-4 border-blue-400 dark:border-blue-500">
                          {Object.entries(groupedItems).map(([subsectionName, items]) => (
                            <div key={subsectionName} className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-600">
                              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                {subsectionName}
                              </h4>
                              <div className="space-y-2 sm:space-y-3">
                                {(items as SectionItem[]).map((item, itemIndex) => (
                                  <div key={item.id} className="p-2 sm:p-3 border border-gray-200 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-start gap-2 sm:gap-3">
                                      <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium flex-shrink-0 mt-0.5">
                                        {itemIndex + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 leading-relaxed mb-2 sm:mb-3">
                                          {item.q}
                                        </p>
                                        <div className="">
                                          {item.type === 'employee' ? (
                                            <div className="relative">
                                              <input
                                                type="text"
                                                value={employeeSearchTerms[`${section.id}_${item.id}`] || responses[`${section.id}_${item.id}`] || ''}
                                                onChange={(e) => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setEmployeeSearchTerms(prev => ({ ...prev, [fieldKey]: e.target.value }));
                                                  setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: true }));
                                                  setSelectedEmployeeIndex(prev => ({ ...prev, [fieldKey]: -1 }));
                                                }}
                                                onFocus={() => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: true }));
                                                }}
                                                onBlur={() => {
                                                  const fieldKey = `${section.id}_${item.id}`;
                                                  setTimeout(() => setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: false })), 200);
                                                }}
                                                className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-slate-600 rounded text-xs sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                                placeholder="Search employee..."
                                              />

                                              {showEmployeeDropdown[`${section.id}_${item.id}`] && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                                  {employeeLoading ? (
                                                    <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">Loading employees...</div>
                                                  ) : (() => {
                                                    const searchTerm = employeeSearchTerms[`${section.id}_${item.id}`] || '';
                                                    const filtered = allEmployeesForTSA.filter(emp =>
                                                      searchTerm === '' ||
                                                      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                      emp.id.toLowerCase().includes(searchTerm.toLowerCase())
                                                    );

                                                    return filtered.length > 0 ? (
                                                      filtered.map((emp, index) => (
                                                        <button
                                                          key={emp.id}
                                                          onClick={() => {
                                                            const fieldKey = `${section.id}_${item.id}`;
                                                            const value = `${emp.name} (${emp.id})`;
                                                            handleTextResponse(fieldKey, value);
                                                            setEmployeeSearchTerms(prev => ({ ...prev, [fieldKey]: '' }));
                                                            setShowEmployeeDropdown(prev => ({ ...prev, [fieldKey]: false }));
                                                          }}
                                                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm ${index === selectedEmployeeIndex[`${section.id}_${item.id}`] ? 'bg-gray-100 dark:bg-slate-700' : ''
                                                            }`}
                                                        >
                                                          <div className="font-medium">{emp.name}</div>
                                                          <div className="text-xs text-gray-500 dark:text-slate-400">{emp.id} • {emp.designation}</div>
                                                        </button>
                                                      ))
                                                    ) : (
                                                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">
                                                        {searchTerm ? 'No matching employees found' : 'Start typing to search...'}
                                                      </div>
                                                    );
                                                  })()}
                                                </div>
                                              )}
                                            </div>
                                          ) : item.type === 'text' ? (
                                            <input
                                              type="text"
                                              value={responses[`${section.id}_${item.id}`] || ''}
                                              onChange={(e) => handleTextResponse(`${section.id}_${item.id}`, e.target.value)}
                                              className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-slate-600 rounded text-xs sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                              placeholder="Enter value"
                                            />
                                          ) : (
                                            <div className="flex flex-wrap gap-2 sm:gap-4">
                                              {['yes', 'no', 'na'].map(option => (
                                                <label key={option} className="flex items-center space-x-1 sm:space-x-2 cursor-pointer min-w-0 shrink-0">
                                                  <input
                                                    type="radio"
                                                    name={`${section.id}_${item.id}`}
                                                    value={option}
                                                    checked={responses[`${section.id}_${item.id}`] === option}
                                                    onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 focus:ring-blue-500 shrink-0"
                                                  />
                                                  <span className="text-sm text-gray-700 dark:text-slate-300 capitalize font-medium">{option}</span>
                                                </label>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section Remarks for TSA CX */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Section Remarks
                        </label>
                        <textarea
                          value={remarks[section.id] || ''}
                          onChange={(e) => handleRemarks(section.id, e.target.value)}
                          placeholder={`Add remarks for ${section.title} section (optional)`}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                        />
                      </div>

                      {/* Image Upload Section */}
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">
                          Upload Images
                        </h3>

                        <div className="mb-4 flex flex-col sm:flex-row gap-3">
                          <input
                            id={`camera-${section.id}`}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(section.id, file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`camera-${section.id}`}
                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Take Photo
                          </label>
                          <input
                            id={`upload-${section.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(section.id, file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`upload-${section.id}`}
                            className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-md font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upload Image
                          </label>
                        </div>

                        {/* Display uploaded images */}
                        {sectionImages[section.id] && sectionImages[section.id].length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {sectionImages[section.id].map((image, index) => (
                              <div key={index} className="relative rounded-lg overflow-hidden shadow-sm">
                                <img
                                  src={image}
                                  alt={`${section.title} - Image ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <button
                                    onClick={() => handleEditImage(section.id, index)}
                                    className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-colors"
                                    aria-label="Edit image"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => removeImage(section.id, index)}
                                    className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-colors"
                                    aria-label="Delete image"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Regular sections (non-TSA)
                return (
                  <div key={section.id} className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                      {section.title}
                    </h3>

                    <div className="space-y-2 sm:space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <div key={item.id} className="p-3 sm:p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium flex-shrink-0 mt-0.5">
                              {itemIndex + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 leading-relaxed mb-2 sm:mb-3">
                                {item.q}
                              </p>
                              <div className="flex flex-wrap gap-2 sm:gap-4">
                                {['yes', 'no', 'na'].map(option => (
                                  <label key={option} className="flex items-center space-x-1 sm:space-x-2 cursor-pointer min-w-0 shrink-0">
                                    <input
                                      type="radio"
                                      name={`${section.id}_${item.id}`}
                                      value={option}
                                      checked={responses[`${section.id}_${item.id}`] === option}
                                      onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                      className="w-4 h-4 text-purple-600 border-gray-300 dark:border-slate-600 focus:ring-purple-500 shrink-0"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-slate-300 capitalize font-medium">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Section Remarks */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Section Remarks
                      </label>
                      <textarea
                        value={remarks[section.id] || ''}
                        onChange={(e) => handleRemarks(section.id, e.target.value)}
                        placeholder={`Add remarks for ${section.title} section (optional)`}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-3">
                        Upload Images
                      </h3>

                      <div className="mb-4 flex flex-col sm:flex-row gap-3">
                        <input
                          id={`camera-${section.id}`}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(section.id, file);
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`camera-${section.id}`}
                          className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Take Photo
                        </label>
                        <input
                          id={`upload-${section.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(section.id, file);
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`upload-${section.id}`}
                          className="flex-1 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-md font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upload Image
                        </label>
                      </div>

                      {/* Display uploaded images */}
                      {sectionImages[section.id] && sectionImages[section.id].length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {sectionImages[section.id].map((image, index) => (
                            <div key={index} className="relative rounded-lg overflow-hidden shadow-sm">
                              <img
                                src={image}
                                alt={`${section.title} - Image ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                  onClick={() => handleEditImage(section.id, index)}
                                  className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-colors"
                                  aria-label="Edit image"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => removeImage(section.id, index)}
                                  className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg transition-colors"
                                  aria-label="Delete image"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="w-full px-3 sm:px-4 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={resetChecklist}
                className="w-full sm:w-auto px-4 sm:px-5 py-3 bg-transparent border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-100 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-sm sm:text-base"
              >
                Reset Checklist
              </button>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                data-tour="submit-button"
                className="w-full sm:w-auto px-4 sm:px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-60 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 text-sm sm:text-base"
              >
                {isLoading ? 'Submitting...' : 'Submit Training Audit'}
              </button>
            </div>
          </div>

          {/* Image Editor Modal */}
          {editingImage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <ImageEditor
                  imageBase64={editingImage.imageData}
                  onSave={handleSaveEditedImage}
                  onCancel={handleCancelEdit}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TrainingChecklist;