import React, { useState, useEffect } from 'react';
import { AREA_MANAGERS } from '../../constants';
import { hapticFeedback } from '../../utils/haptics';
import hrMappingData from '../../src/hr_mapping.json';

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
      {id: 'TM_1', q: 'FRM available at store?', w: 1},
      {id: 'TM_2', q: 'BRM available at store?', w: 1},
      {id: 'TM_3', q: 'One-pager – Hot/Cue Cards displayed?', w: 1},
      {id: 'TM_4', q: 'One-pager – Cold/Cue Cards displayed?', w: 1},
      {id: 'TM_5', q: 'Dial-in One-pager visible?', w: 2},
      {id: 'TM_6', q: 'New-launch learning material available?', w: 1},
      {id: 'TM_7', q: 'COFFEE & HD Playbook in store?', w: 1},
      {id: 'TM_8', q: 'MSDS, chemical chart and Shelf life chart available?', w: 1},
      {id: 'TM_9', q: 'Career Progression Chart & Reward Poster displayed?', w: 1}
    ]
  },
  { 
    id: 'LMS', 
    title: 'LMS Usage', 
    items: [
      {id: 'LMS_1', q: 'Orientation & Induction completed within 3 days of joining?', w: 4, wneg: -4},
      {id: 'LMS_2', q: 'All assessments & knowledge checks completed on LMS?', w: 4, wneg: -4},
      {id: 'LMS_3', q: 'Team uses LMS for new info & comms?', w: 2}
    ]
  },
  { 
    id: 'Buddy', 
    title: 'Buddy Trainer Availability & Capability', 
    items: [
      {id: 'Buddy_1', q: 'Does the café have at least 20% of the staff certified Buddy Trainers?', w: 2},
      {id: 'Buddy_2', q: 'Have Buddy Trainers completed their Skill Check?', w: 2},
      {id: 'Buddy_3', q: 'Are trainees rostered with Buddy Trainers and working in the same shift?', w: 1},
      {id: 'Buddy_4', q: 'Have Buddy Trainers attended the BT workshop?', w: 2},
      {id: 'Buddy_5', q: 'Can Buddy Trainers explain the 4-step training process effectively?', w: 2},
      {id: 'Buddy_6', q: 'Can Buddy Trainers navigate Zing LMS flawlessly?', w: 1}
    ]
  },
  { 
    id: 'NewJoiner', 
    title: 'New Joiner Training & Records', 
    items: [
      {id: 'NJ_1', q: 'Is the OJT book available for all partners?', w: 1},
      {id: 'NJ_2', q: 'Are trainees referring to the OJT book and completing their skill checks?', w: 1},
      {id: 'NJ_3', q: 'Is training progression aligned with the Training Calendar/Plan?', w: 1},
      {id: 'NJ_4', q: 'Are team members aware of post-barista training progressions?', w: 1},
      {id: 'NJ_5', q: 'Have managers completed SHLP training as per the calendar?', w: 2},
      {id: 'NJ_6', q: 'Are there at least 2 FOSTAC-certified managers in the store?', w: 2},
      {id: 'NJ_7', q: 'Is ASM/SM training completed as per the Training Calendar?', w: 2}
    ]
  },
  { 
    id: 'PartnerKnowledge', 
    title: 'Partner Knowledge', 
    items: [
      {id: 'PK_1', q: 'Are team members aware of current company communications?', w: 2},
      {id: 'PK_2', q: 'Ask a team member to conduct a Coffee Tasting & Sampling', w: 2},
      {id: 'PK_3', q: 'Is Sampling being conducted as per the set guidelines?', w: 2},
      {id: 'PK_4', q: 'Is Coffee Tasting engaging and effective?', w: 2},
      {id: 'PK_5', q: 'Are team members aware of manual brewing methods and standards?', w: 2},
      {id: 'PK_6', q: 'Are partners following grooming standards?', w: 2},
      {id: 'PK_7', q: 'Ask questions about key topics: COFFEE, LEAST, ROAST, Dial-in, Milk Steaming, LTO, Values(RESPECT), MSDS, Chemcial Dilution, Food Safety, and Security.', w: 3, wneg: -3}
    ]
  },
  { 
    id: 'TSA_Food', 
    title: 'TSA - Food Training Skill Assessment', 
    items: [
      {id: 'FOOD_EMP_NAME', q: 'EMP. name', w: 0, section: 'Employee Information', type: 'text'},
      {id: 'FOOD_EMP_ID', q: 'EMP. ID', w: 0, section: 'Employee Information', type: 'text'},
      // Personal Hygiene
      {id: 'PH_1', q: 'Well-groomed as per TWC standards (uniform, nails, hair)', w: 1, section: 'Personal Hygiene'},
      {id: 'PH_2', q: 'Washed and sanitized hands every 30 mins', w: 1, section: 'Personal Hygiene'},
      {id: 'PH_3', q: 'Wears gloves or avoids direct food contact', w: 1, section: 'Personal Hygiene'},
      
      // Station Readiness  
      {id: 'SR_1', q: 'All ingredients available for the day', w: 1, section: 'Station Readiness'},
      {id: 'SR_2', q: 'All smallware available & in correct use', w: 1, section: 'Station Readiness'},
      {id: 'SR_3', q: 'Station cleaned and sanitized', w: 1, section: 'Station Readiness'},
      {id: 'SR_4', q: 'Station and smallware organized and clean', w: 1, section: 'Station Readiness'},
      {id: 'SR_5', q: 'Clean dusters available at the station', w: 1, section: 'Station Readiness'},
      {id: 'SR_6', q: 'FDU AT LEAST 70% stocked, clean, follows planogram', w: 1, section: 'Station Readiness'},
      {id: 'SR_7', q: 'MRD stickers used correctly (FDU + Make Line)', w: 1, section: 'Station Readiness'},
      {id: 'SR_8', q: 'Products stored at correct temperature', w: 1, section: 'Station Readiness'},
      
      // Food Preparation & Handling
      {id: 'FP_1', q: 'Recipe followed per SOP (Food Item 1)', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_2', q: 'Build followed per SOP (Food Item 1)', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_3', q: 'Recipe followed per SOP (Food Item 2)', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_4', q: 'Build followed per SOP (Food Item 2)', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_5', q: 'Used correct tools for preparation', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_6', q: 'Used appropriate key to heat/warm food (Merry chef/Oven)', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_7', q: 'Gloves changed correctly (veg/non-veg switch or as per TWC guidelines)', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_8', q: 'Consistently follows Clean-As-You-Go', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_9', q: 'Correct duster used for station cleaning', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_10', q: 'Follows First-In-First-Out for food items', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_11', q: 'Products checked visually before serving', w: 1, section: 'Food Preparation & Handling'},
      {id: 'FP_12', q: 'Chips, condiments, cutlery, etc., provided per SOP', w: 1, section: 'Food Preparation & Handling'},
      
      // Standards Ownership
      {id: 'SO_1', q: 'Serves only food that meets TWC standards (fresh, safe, proper temp); knows what to do if not', w: 1, section: 'Standards Ownership'}
    ]
  },
  { 
    id: 'TSA_Coffee', 
    title: 'TSA - Coffee Training Skill Assessment', 
    items: [
      {id: 'COFFEE_EMP_NAME', q: 'EMP. name', w: 0, section: 'Employee Information', type: 'text'},
      {id: 'COFFEE_EMP_ID', q: 'EMP. ID', w: 0, section: 'Employee Information', type: 'text'},
      // Personal Hygiene
      {id: 'PH_1', q: 'Well-groomed as per TWC standards (uniform, nails, hair)', w: 1, section: 'Personal Hygiene'},
      {id: 'PH_2', q: 'Washed and sanitized hands', w: 1, section: 'Personal Hygiene'},
      {id: 'PH_3', q: 'Wears gloves at CBS', w: 1, section: 'Personal Hygiene'},
      
      // Station Readiness  
      {id: 'SR_1', q: 'Trainee Ensures that the station is well stocked with Milk, Warm cups, coffee beans, steaming jars, filter papers, stirrers, spoons, blenders and blending jars and scissors', w: 1, section: 'Station Readiness'},
      {id: 'SR_2', q: 'Trainee ensures all type of milk - Fresh, Skim milk, Oats milk and Almond milk are available', w: 1, section: 'Station Readiness'},
      {id: 'SR_3', q: 'Trainee Ensures that the leveller and temper is clean and set at the appropriate setting', w: 1, section: 'Station Readiness'},
      {id: 'SR_4', q: 'Trainee ensure all the smallwares- Stir spoon in clean water, Frothing pitchers, appropriate pumps in syrups are available at the stations', w: 1, section: 'Station Readiness'},
      {id: 'SR_5', q: 'Trainee ensured that the Espresso dial in is done', w: 1, section: 'Station Readiness'},
      {id: 'SR_6', q: 'Trainee extract the perfect espresso each time', w: 1, section: 'Station Readiness'},
      {id: 'SR_7', q: 'Trainee follows the Espresso extraction steps as defined', w: 1, section: 'Station Readiness'},
      {id: 'SR_8', q: 'Whipped cream is prepared as per standards', w: 1, section: 'Station Readiness'},
      {id: 'SR_9', q: 'Station and smallware organized and clean', w: 1, section: 'Station Readiness'},
      {id: 'SR_10', q: 'Clean dusters available at the station', w: 1, section: 'Station Readiness'},
      {id: 'SR_11', q: 'Station cleaned and sanitized', w: 1, section: 'Station Readiness'},
      {id: 'SR_12', q: 'MRD stickers used correctly', w: 1, section: 'Station Readiness'},
      {id: 'SR_13', q: 'Products stored at correct temperature', w: 1, section: 'Station Readiness'},
      
      // Coffee Preparation & Handling
      {id: 'CP_1', q: 'Recipe followed per SOP for Cappuccino', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_2', q: 'Build followed per SOP for Cappuccino', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_3', q: 'Recipe followed per SOP for Latte', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_4', q: 'Build followed per SOP for Latte', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_5', q: 'Recipe followed per SOP for bev 3', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_6', q: 'Build followed per SOP for bev 3', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_7', q: 'Recipe followed per SOP for bev 4', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_8', q: 'Build followed per SOP for bev 4', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_9', q: 'Cappuccino is served with 70:30 milk foam ratio', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_10', q: 'Latte is served with silky smooth foam (90:10 ratio)', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_11', q: 'Milk steaming standards are followed- Milk quantity taken, clean pitcher, and fresh cold milk', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_12', q: 'Latte art is as per described standards', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_13', q: 'Used correct tools for preparation', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_14', q: 'Blenders, Shakers and frothing jugs are washed and clean after every use', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_15', q: 'Appropriate button is used to blend the beverages', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_16', q: 'Toppings and Garnishes are used as per described standards', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_17', q: 'Special instructions are read and followed while preparing the beverage', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_18', q: 'Cold brew is available and brewed as per TWC standards', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_19', q: 'Trainee is aware about the Cold brew', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_20', q: 'Trainee brews the manual brews as per TWC standards', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_21', q: 'Gloves changed correctly (after garbage handling or as per Glove usage policy)', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_22', q: 'Consistently follows Clean-As-You-Go', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_23', q: 'Correct duster used for station cleaning', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_24', q: 'Follows First-In-First-Out for food items', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_25', q: 'Products checked visually before serving', w: 1, section: 'Coffee Preparation & Handling'},
      {id: 'CP_26', q: 'Condiments, cutlery, etc., provided per SOP', w: 1, section: 'Coffee Preparation & Handling'}
    ]
  },
  { 
    id: 'TSA_CX', 
    title: 'TSA: Customer Experience', 
    items: [
      {id: 'CX_EMP_NAME', q: 'EMP. name', w: 0, section: 'Employee Information', type: 'text'},
      {id: 'CX_EMP_ID', q: 'EMP. ID', w: 0, section: 'Employee Information', type: 'text'},
      
      // Section 1: Personal Hygiene (3 Points)
      {id: 'CX_PH_1', q: 'Grooming & Hygiene: Well-groomed as per TWC standards (uniform, nails, hair)', w: 1, section: 'Personal Hygiene'},
      {id: 'CX_PH_2', q: 'Hand Hygiene: Washed and sanitized hands', w: 1, section: 'Personal Hygiene'},
      {id: 'CX_PH_3', q: 'Food Handling: Wears gloves or avoids direct food contact', w: 1, section: 'Personal Hygiene'},
      
      // Section 2: Station Readiness (8 Points)
      {id: 'CX_SR_1', q: 'Washrooms clean and stocked', w: 1, section: 'Station Readiness'},
      {id: 'CX_SR_2', q: 'Service area clean (floor, chairs, tables)', w: 1, section: 'Station Readiness'},
      {id: 'CX_SR_3', q: 'Smallwares clean (salvers, plates, cutlery)', w: 1, section: 'Station Readiness'},
      {id: 'CX_SR_4', q: 'Furniture properly set', w: 1, section: 'Station Readiness'},
      {id: 'CX_SR_5', q: 'POS, Bars, merchandise, menus, etc. properly stocked', w: 1, section: 'Station Readiness'},
      {id: 'CX_SR_6', q: 'Float/change available for cash transactions', w: 1, section: 'Station Readiness'},
      {id: 'CX_SR_7', q: 'Checks communication for product availability', w: 1, section: 'Station Readiness'},
      {id: 'CX_SR_8', q: 'Verifies temperature, music, table cleanliness, service items, Wi-Fi, and delivery channels', w: 1, section: 'Station Readiness'},
      
      // Section 3: Customer Handling (12 Points)
      {id: 'CX_CH_1', q: 'Cheerful Greeting: Cheerfully welcomes customers, follows 2-meter rule', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_2', q: 'Builds rapport (eye contact, active listening, positive phrases)', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_3', q: 'Assists customers to find seating or offers help when needed', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_4', q: 'Order Taking Assistance: Upsells using customer interest and product knowledge', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_5', q: 'Accurately enters and verifies orders in POS', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_6', q: 'Applies applicable discounts correctly', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_7', q: 'Processes payments accurately and handles change', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_8', q: 'Closes transaction smoothly and provides table tag', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_9', q: 'Thanks customer, explains order delivery, listens to feedback', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_10', q: 'Friendly & Accurate service: Serves with attention to detail (salver balance, order name, cutlery, etc.)', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_11', q: 'Offers follow-up service and leaves customer satisfied', w: 1, section: 'Customer Handling'},
      {id: 'CX_CH_12', q: 'Clears table with courtesy, thanks guests on exit', w: 1, section: 'Customer Handling'},
      
      // Section 4: Handling Feedback & Complaints (6 Points)
      {id: 'CX_FC_1', q: 'What would you do if a customer leaves more than half of the product?', w: 1, section: 'Handling Feedback & Complaints'},
      {id: 'CX_FC_2', q: 'How do you handle a customer asking for extra protein in a salad?', w: 1, section: 'Handling Feedback & Complaints'},
      {id: 'CX_FC_3', q: 'What do you do if a customer is angry or irritated?', w: 1, section: 'Handling Feedback & Complaints'},
      {id: 'CX_FC_4', q: 'What would you do if a customer complains about cold food/coffee?', w: 1, section: 'Handling Feedback & Complaints'},
      {id: 'CX_FC_5', q: 'How do you manage service if the wrong item (veg/non-veg) is served?', w: 1, section: 'Handling Feedback & Complaints'},
      {id: 'CX_FC_6', q: 'What do you do if a customer sits for a long time post meal?', w: 1, section: 'Handling Feedback & Complaints'}
    ]
  },
  { 
    id: 'CustomerExperience', 
    title: 'Customer Experience', 
    items: [
      {id: 'CX_1', q: 'Is background music at appropriate volume?', w: 1},
      {id: 'CX_2', q: 'Is store temperature comfortable?', w: 1},
      {id: 'CX_3', q: 'Are washrooms clean and well-maintained?', w: 1},
      {id: 'CX_4', q: 'Is Wi-Fi available & functioning properly?', w: 1},
      {id: 'CX_5', q: 'Are marketing & Visual Merchandise displayes correct?', w: 2},
      {id: 'CX_6', q: 'Is store furniture clean & well-kept?', w: 1},
      {id: 'CX_7', q: 'What do you understand by MA, CPI, QA scores?', w: 1},
      {id: 'CX_8', q: 'What was the latest Mystery Audit score for the store?', w: 1},
      {id: 'CX_9', q: 'Top 2 CX opportunity areas last month?', w: 1}
    ]
  },
  { 
    id: 'ActionPlan', 
    title: 'Action Plan & Continuous Improvement', 
    items: [
      {id: 'AP_1', q: 'Concerns addressed within 48hrs?', w: 1, wneg: -1},
      {id: 'AP_2', q: 'Action points closed/work-in-progress?', w: 2},
      {id: 'AP_3', q: 'Managers aware of action plan?', w: 2}
    ]
  }
];

interface TrainingChecklistProps {
  userRole?: any;
  onStatsUpdate?: (stats: { completed: number; total: number; score: number }) => void;
}

const TrainingChecklist: React.FC<TrainingChecklistProps> = ({ onStatsUpdate }) => {
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
    } catch(e) {}
    
    const urlParams = new URLSearchParams(window.location.search);
    const trainerId = urlParams.get('trainerId') || urlParams.get('id') || urlParams.get('hrId') || (stored as any).trainerId || '';
    const trainerName = urlParams.get('trainerName') || urlParams.get('name') || urlParams.get('hrName') || (stored as any).trainerName || '';
    
    return {
      amName: (stored as any).amName || '',
      amId: (stored as any).amId || '',
      trainerName: trainerName,
      trainerId: trainerId,
      storeName: (stored as any).storeName || '',
      storeId: (stored as any).storeId || '',
      mod: (stored as any).mod || ''
    };
  });

  const [isTrainerIdFromURL, setIsTrainerIdFromURL] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return !!(urlParams.get('trainerId') || urlParams.get('id') || urlParams.get('hrId'));
  });

  // Add state for dropdown handling
  const [amSearchTerm, setAmSearchTerm] = useState('');
  
  // Calculate and update stats whenever responses change
  useEffect(() => {
    if (onStatsUpdate) {
      let completed = 0;
      let total = 0;
      let totalScore = 0;
      let maxScore = 0;

      SECTIONS.forEach(section => {
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
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedAmIndex, setSelectedAmIndex] = useState(-1);
  const [selectedTrainerIndex, setSelectedTrainerIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

  // Get unique AMs from constants (same as HR Checklist), Trainers and Stores from HR mapping
  const uniqueAMs = AREA_MANAGERS.map(am => ({
    name: am.name,
    id: am.id
  }));

  // Extract trainers from HR mapping data (now includes trainer info)
  const uniqueTrainers = Array.from(new Set(
    hrMappingData
      .filter((item: any) => item.trainer)
      .map((item: any) => item.trainer)
  ))
    .map(trainerName => {
      const trainerData = hrMappingData.find((item: any) => item.trainer === trainerName);
      return { 
        name: trainerName, 
        id: trainerData?.trainerId || '' 
      };
    })
    .filter(trainer => trainer.name) // Remove empty names
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

  // Extract stores from HR mapping data (same as HR Checklist)
  const uniqueStores = Array.from(new Set(
    hrMappingData.map((item: any) => item.locationName)
  ))
    .map(storeName => {
      const storeData = hrMappingData.find((item: any) => item.locationName === storeName);
      return { 
        name: storeName, 
        id: storeData?.storeId || '' 
      };
    })
    .filter(store => store.name) // Remove empty names
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

  // Cascading filter functions for dropdown searches
  
  // 1. Area Managers filtered by selected trainer (if any)
  const filteredAMs = uniqueAMs.filter(am => {
    // First apply search filter
    const matchesSearch = amSearchTerm === '' || 
      (am.name as string).toLowerCase().includes(amSearchTerm.toLowerCase()) ||
      (am.id as string).toLowerCase().includes(amSearchTerm.toLowerCase());
    
    // If no trainer is selected, show all AMs that match search
    if (!meta.trainerId || !meta.trainerName) {
      return matchesSearch;
    }
    
    // If trainer is selected, only show AMs that work with this trainer
    const trainerWorksWithAM = hrMappingData.some((item: any) => 
      item.trainer === meta.trainerName && 
      item.areaManagerId === am.id
    );
    
    return matchesSearch && trainerWorksWithAM;
  });

  // 2. Trainers - no cascading filter needed (they are the top level)
  const filteredTrainers = uniqueTrainers.filter(trainer => 
    trainerSearchTerm === '' || 
    (trainer.name as string).toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
    (trainer.id as string).toLowerCase().includes(trainerSearchTerm.toLowerCase())
  );

  // 3. Stores filtered by selected Area Manager (if any)
  const filteredStores = uniqueStores.filter(store => {
    // First apply search filter
    const matchesSearch = storeSearchTerm === '' || 
      (store.name as string).toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      (store.id as string).toLowerCase().includes(storeSearchTerm.toLowerCase());
    
    // If no AM is selected, show all stores that match search
    if (!meta.amId || !meta.amName) {
      return matchesSearch;
    }
    
    // If AM is selected, only show stores under this AM
    const storeUnderAM = hrMappingData.some((item: any) => 
      item.locationName === store.name && 
      item.areaManagerId === meta.amId
    );
    
    return matchesSearch && storeUnderAM;
  });

  // Auto-fill function with cascading filters (same as HR Checklist)
  const autoFillFields = (field: string, value: string) => {
    let mappingItem = null;
    
    switch (field) {
      case 'trainer':
        // Find trainer in hrMappingData (TOP LEVEL - clears AM and Store)
        mappingItem = hrMappingData.find((item: any) => 
          item.trainer === value || item.trainerId === value
        );
        if (mappingItem) {
          setMeta(prev => ({
            ...prev,
            trainerName: mappingItem.trainer || '',
            trainerId: mappingItem.trainerId || '',
            // Clear dependent fields when trainer changes
            amName: '',
            amId: '',
            storeName: '',
            storeId: ''
            // MOD remains as user input - not auto-populated
          }));
        }
        break;
        
      case 'am':
        // Find AM from constants (MIDDLE LEVEL - clears Store only)
        const amFromConstants = AREA_MANAGERS.find(am => am.name === value || am.id === value);
        if (amFromConstants) {
          // Find stores for this AM from hrMappingData
          mappingItem = hrMappingData.find((item: any) => item.areaManagerId === amFromConstants.id);
          if (mappingItem) {
            setMeta(prev => ({
              ...prev,
              amName: amFromConstants.name,
              amId: amFromConstants.id,
              // Clear dependent store when AM changes
              storeName: '',
              storeId: ''
              // MOD remains as user input - not auto-populated
            }));
          }
        }
        break;
        
      case 'store':
        // Find store in hrMappingData
        mappingItem = hrMappingData.find((item: any) => 
          item.locationName === value || item.storeId === value
        );
        if (mappingItem) {
          // Get the AM info for this store
          const amFromStoreMapping = AREA_MANAGERS.find(am => am.id === mappingItem.areaManagerId);
          setMeta(prev => ({
            ...prev,
            storeName: mappingItem.locationName || '',
            storeId: mappingItem.storeId || '',
            amName: amFromStoreMapping?.name || prev.amName,
            amId: amFromStoreMapping?.id || prev.amId,
            // Auto-populate trainer based on store selection
            trainerName: mappingItem.trainer || prev.trainerName,
            trainerId: mappingItem.trainerId || prev.trainerId
            // MOD remains as user input - not auto-populated
          }));
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

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tsaExpanded, setTsaExpanded] = useState(false);
  const [tsaCoffeeExpanded, setTsaCoffeeExpanded] = useState(false);
  const [tsaCXExpanded, setTsaCXExpanded] = useState(false);

  // Calculate TSA Food score and auto-assign points
  const calculateTSAFoodScore = () => {
    const tsaSection = SECTIONS.find(s => s.id === 'TSA_Food');
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
    const tsaSection = SECTIONS.find(s => s.id === 'TSA_Coffee');
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
    const tsaSection = SECTIONS.find(s => s.id === 'TSA_CX');
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

  const handleMetaChange = (field: keyof TrainingMeta, value: string) => {
    // Implement cascading clear logic
    if (field === 'trainerName' || field === 'trainerId') {
      // When trainer changes, clear AM and store
      setMeta(prev => ({
        ...prev,
        [field]: value,
        amName: '',
        amId: '',
        storeName: '',
        storeId: ''
      }));
    } else if (field === 'amName' || field === 'amId') {
      // When AM changes, clear store only
      setMeta(prev => ({
        ...prev,
        [field]: value,
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
    
    SECTIONS.forEach(section => {
      section.items.forEach(item => {
        const questionId = `${section.id}_${item.id}`;
        if (!responses[questionId]) {
          incompleteQuestions.push(`${section.title}: ${item.q}`);
        }
      });
    });

    if (incompleteQuestions.length > 0) {
      // Scroll to first unanswered question
      const firstIncompleteSection = SECTIONS.find(section => 
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
    if (!meta.trainerName || !meta.trainerId) missingFields.push('Trainer (Auditor)');
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

      SECTIONS.forEach(section => {
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

      // Submit to Google Sheets
      const formData = new URLSearchParams({
        timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }),
        trainerName: meta.trainerName,
        trainerId: meta.trainerId,
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
        tsaFoodScore: calculateTSAFoodScore().toString(),
        tsaCoffeeScore: calculateTSACoffeeScore().toString(),
        tsaCXScore: calculateTSACXScore().toString()
      });

      // Add individual responses
      SECTIONS.forEach(section => {
        section.items.forEach(item => {
          const questionId = `${section.id}_${item.id}`;
          // Send just the item.id (e.g., TM_1) to match Google Apps Script expectations
          formData.append(item.id, responses[questionId] || '');
        });
      });

      // Add remarks
      SECTIONS.forEach(section => {
        if (remarks[section.id]) {
          // Convert section names to abbreviations for remarks
          const sectionAbbr = section.id === 'TrainingMaterials' ? 'TM' :
                             section.id === 'LMS' ? 'LMS' :
                             section.id === 'Buddy' ? 'Buddy' :
                             section.id === 'NewJoiner' ? 'NJ' :
                             section.id === 'PartnerKnowledge' ? 'PK' :
                             section.id === 'TSA' ? 'TSA' :
                             section.id === 'CustomerExperience' ? 'CX' :
                             section.id === 'ActionPlan' ? 'AP' : section.id;
          formData.append(`${sectionAbbr}_remarks`, remarks[section.id]);
        }
      });

      const response = await fetch('https://script.google.com/macros/s/AKfycbwxIYMtuvIGGgAIhZr-ddaLJlEDbZ6glgeYFdESNO5nNAyZ3fWLBRb5fpcx_cYaQ1QkcQ/exec', {
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
    setResponses({});
    setRemarks({});
    setMeta({
      amName: '',
      amId: '',
      trainerName: '',
      trainerId: '',
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
    setMeta({
      amName: '',
      amId: '',
      trainerName: '',
      trainerId: '',
      storeName: '',
      storeId: '',
      mod: ''
    });
    localStorage.removeItem('training_resp');
    localStorage.removeItem('training_meta');
    localStorage.removeItem('training_remarks');
    hapticFeedback.tap();
  };

  // AUTO-FILL FUNCTION FOR TESTING (REMOVE LATER)
  const autoFillForTesting = () => {
    const testResponses: Record<string, string> = {};
    const testRemarks: Record<string, string> = {};
    
    // Sample test data
    const sampleNames = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Sarah Wilson', 'Mike Brown'];
    const sampleIds = ['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005'];
    const sampleRemarks = [
      'Excellent performance, all standards met',
      'Good understanding, minor improvements needed',
      'Requires additional training on specific areas',
      'Outstanding knowledge and execution',
      'Meets basic requirements, room for improvement'
    ];

    // Fill meta information
    setMeta({
      amName: 'Test AM',
      amId: 'AM123',
      trainerName: 'Test Trainer', 
      trainerId: 'TR456',
      storeName: 'Test Store',
      storeId: 'ST789',
      mod: 'Test MOD'
    });

    // Fill all sections
    SECTIONS.forEach(section => {
      section.items.forEach(item => {
        const questionId = `${section.id}_${item.id}`;
        
        if (item.type === 'text') {
          // Fill text fields with sample data
          if (item.q.includes('name')) {
            testResponses[questionId] = sampleNames[Math.floor(Math.random() * sampleNames.length)];
          } else if (item.q.includes('ID')) {
            testResponses[questionId] = sampleIds[Math.floor(Math.random() * sampleIds.length)];
          }
        } else {
          // Randomly assign yes/no/na with weighted probability
          const rand = Math.random();
          if (rand < 0.7) {
            testResponses[questionId] = 'yes'; // 70% yes
          } else if (rand < 0.9) {
            testResponses[questionId] = 'no';  // 20% no
          } else {
            testResponses[questionId] = 'na';  // 10% na
          }
        }
      });
      
      // Add sample remarks for each section
      testRemarks[section.id] = sampleRemarks[Math.floor(Math.random() * sampleRemarks.length)];
    });

    setResponses(testResponses);
    setRemarks(testRemarks);
    hapticFeedback.success();
  };

  return (
    <>
      {/* Show submission success screen */}
      {submitted ? (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center border border-green-200 dark:border-green-800">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">
              Training Checklist Submitted Successfully!
            </h2>
            <p className="text-green-600 dark:text-green-400 mb-6">
              Your checklist has been recorded and will be processed for dashboard insights.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={startNewChecklist}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Start New Checklist
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 p-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              📚 Training Audit Checklist
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              Comprehensive training assessment covering all aspects of staff development and knowledge retention. Weighted scoring: Various weights per question, N/A excluded from scoring.
            </p>
          </div>

      {/* Meta Information Form */}
      <div id="audit-information" className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Audit Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Area Manager
            </label>
            <input
              type="text"
              value={amSearchTerm || (meta.amId ? `${meta.amName} (${meta.amId})` : '')}
              onChange={(e) => {
                setAmSearchTerm(e.target.value);
                setShowAmDropdown(true);
                setSelectedAmIndex(-1);
              }}
              onFocus={() => setShowAmDropdown(true)}
              onBlur={() => setTimeout(() => setShowAmDropdown(false), 200)}
              placeholder="Search Area Manager..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
            
            {showAmDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredAMs.length > 0 ? (
                  filteredAMs.map((am, index) => (
                    <button
                      key={am.id}
                      onClick={() => {
                        handleMetaChange('amId', am.id as string);
                        handleMetaChange('amName', am.name as string);
                        autoFillFields('am', am.name as string);
                        setAmSearchTerm('');
                        setShowAmDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        index === selectedAmIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                      }`}
                    >
                      {am.name} ({am.id})
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-slate-400">No area managers found</div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Trainer (Auditor)
            </label>
            <input
              type="text"
              value={trainerSearchTerm || (meta.trainerId ? `${meta.trainerName} (${meta.trainerId})` : '')}
              onChange={(e) => {
                setTrainerSearchTerm(e.target.value);
                setShowTrainerDropdown(true);
                setSelectedTrainerIndex(-1);
              }}
              onFocus={() => setShowTrainerDropdown(true)}
              onBlur={() => setTimeout(() => setShowTrainerDropdown(false), 200)}
              placeholder="Search Trainer..."
              readOnly={isTrainerIdFromURL && meta.trainerId}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md ${
                isTrainerIdFromURL && meta.trainerId
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
                  <div className="px-3 py-2 text-gray-500 dark:text-slate-400">No trainers found</div>
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
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        index === selectedTrainerIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                      }`}
                    >
                      {trainer.name} ({trainer.id})
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-slate-400">No trainers found</div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
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
                          autoFillFields('store', store.name as string);
                          setStoreSearchTerm('');
                          setShowStoreDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                          index === selectedStoreIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                        }`}
                      >
                        {store.name} ({store.id})
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 dark:text-slate-400">No stores found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              MOD (Manager on Duty)
            </label>
            <input
              type="text"
              value={meta.mod}
              onChange={(e) => handleMetaChange('mod', e.target.value)}
              placeholder="Enter MOD name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Training Sections */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Training Assessment
        </h2>
        
        <div className="space-y-8">
          {SECTIONS.map((section, sectionIndex) => {
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
                  <div className="flex items-center justify-between mb-4">
                    <div>
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
                      className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors"
                    >
                      {tsaExpanded ? 'Collapse' : 'Expand'} Assessment
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
                    <div className="space-y-6 bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                      {Object.entries(groupedItems).map(([subsectionName, items]) => (
                        <div key={subsectionName} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-slate-100 mb-3 text-orange-700 dark:text-orange-300">
                            {subsectionName}
                          </h4>
                          <div className="space-y-3">
                            {items.map((item, itemIndex) => (
                              <div key={item.id} className="p-3 border border-gray-200 dark:border-slate-600 rounded-md">
                                <div className="mb-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium mr-2">
                                    {itemIndex + 1}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                    {item.q}
                                  </span>
                                </div>
                                
                                <div className="ml-8">
                                  {item.type === 'text' ? (
                                    <input
                                      type="text"
                                      value={responses[`${section.id}_${item.id}`] || ''}
                                      onChange={(e) => handleTextResponse(`${section.id}_${item.id}`, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder={`Enter ${item.q}`}
                                    />
                                  ) : (
                                    <div className="flex gap-2">
                                      {['yes', 'no', 'na'].map(option => (
                                        <label key={option} className="flex items-center space-x-1 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`${section.id}_${item.id}`}
                                            value={option}
                                            checked={responses[`${section.id}_${item.id}`] === option}
                                            onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                            className="w-3 h-3 text-orange-600 border-gray-300 dark:border-slate-600 focus:ring-orange-500"
                                          />
                                          <span className="text-xs text-gray-700 dark:text-slate-300 capitalize">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="flex items-center justify-between mb-4">
                    <div>
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
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
                    >
                      {tsaCoffeeExpanded ? 'Collapse' : 'Expand'} Assessment
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
                    <div className="space-y-6 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                      {Object.entries(groupedItems).map(([subsectionName, items]) => (
                        <div key={subsectionName} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-slate-100 mb-3 text-yellow-700 dark:text-yellow-300">
                            {subsectionName}
                          </h4>
                          <div className="space-y-3">
                            {items.map((item, itemIndex) => (
                              <div key={item.id} className="p-3 border border-gray-200 dark:border-slate-600 rounded-md">
                                <div className="mb-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium mr-2">
                                    {itemIndex + 1}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                    {item.q}
                                  </span>
                                </div>
                                
                                <div className="ml-8">
                                  {item.type === 'text' ? (
                                    <input
                                      type="text"
                                      value={responses[`${section.id}_${item.id}`] || ''}
                                      onChange={(e) => handleTextResponse(`${section.id}_${item.id}`, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                      placeholder={`Enter ${item.q}`}
                                    />
                                  ) : (
                                    <div className="flex gap-2">
                                      {['yes', 'no', 'na'].map(option => (
                                        <label key={option} className="flex items-center space-x-1 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`${section.id}_${item.id}`}
                                            value={option}
                                            checked={responses[`${section.id}_${item.id}`] === option}
                                            onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                            className="w-3 h-3 text-yellow-600 border-gray-300 dark:border-slate-600 focus:ring-yellow-500"
                                          />
                                          <span className="text-xs text-gray-700 dark:text-slate-300 capitalize">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="flex items-center justify-between mb-4">
                    <div>
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                    >
                      {tsaCXExpanded ? 'Collapse' : 'Expand'} Assessment
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
                    <div className="space-y-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      {Object.entries(groupedItems).map(([subsectionName, items]) => (
                        <div key={subsectionName} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-slate-100 mb-3 text-blue-700 dark:text-blue-300">
                            {subsectionName}
                          </h4>
                          <div className="space-y-3">
                            {items.map((item, itemIndex) => (
                              <div key={item.id} className="p-3 border border-gray-200 dark:border-slate-600 rounded-md">
                                <div className="mb-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium mr-2">
                                    {itemIndex + 1}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                    {item.q}
                                  </span>
                                </div>
                                
                                <div className="ml-8">
                                  {item.type === 'text' ? (
                                    <input
                                      type="text"
                                      value={responses[`${section.id}_${item.id}`] || ''}
                                      onChange={(e) => handleTextResponse(`${section.id}_${item.id}`, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={`Enter ${item.q}`}
                                    />
                                  ) : (
                                    <div className="flex gap-2">
                                      {['yes', 'no', 'na'].map(option => (
                                        <label key={option} className="flex items-center space-x-1 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`${section.id}_${item.id}`}
                                            value={option}
                                            checked={responses[`${section.id}_${item.id}`] === option}
                                            onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                            className="w-3 h-3 text-blue-600 border-gray-300 dark:border-slate-600 focus:ring-blue-500"
                                          />
                                          <span className="text-xs text-gray-700 dark:text-slate-300 capitalize">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Regular sections (non-TSA)
            return (
              <div key={section.id} className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  {section.title}
                </h3>
                
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div key={item.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                      <div className="mb-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium mr-3">
                          {itemIndex + 1}
                        </span>
                        <span className="text-lg font-medium text-gray-900 dark:text-slate-100">
                          {item.q}
                        </span>
                      </div>
                      
                      <div className="ml-11 space-y-3">
                        <div className="flex gap-2">
                          {['yes', 'no', 'na'].map(option => (
                            <label key={option} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`${section.id}_${item.id}`}
                                value={option}
                                checked={responses[`${section.id}_${item.id}`] === option}
                                onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                className="w-4 h-4 text-purple-600 border-gray-300 dark:border-slate-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-700 dark:text-slate-300 capitalize">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section Remarks */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Section Remarks
                  </label>
                  <textarea
                    value={remarks[section.id] || ''}
                    onChange={(e) => handleRemarks(section.id, e.target.value)}
                    placeholder={`Add remarks for ${section.title} section (optional)`}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={resetChecklist}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Reset Checklist
          </button>
          <button
            onClick={autoFillForTesting}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            Auto Fill (Test)
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Submitting...' : 'Submit Training Audit'}
        </button>
      </div>
        </div>
      )}
    </>
  );
};

export default TrainingChecklist;