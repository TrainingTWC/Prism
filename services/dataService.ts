import { Submission } from '../types';
import { QUESTIONS, AREA_MANAGERS, STORES, HR_PERSONNEL } from '../constants';
import { generateTrainingTestData } from '../utils/trainingTestData';
import { STATIC_TRAINING_DATA } from './staticTrainingData';
import { STATIC_AM_OPERATIONS_DATA } from './staticOperationsData';

// Google Apps Script endpoint for fetching data - UPDATED with DD/MM/YYYY date formatting
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxGp9HAph2daannyuSsO5CFcIwtJaAH-WtMPyBZ1x9g6NwWcPuNhrJWKiSJeiZW44j91g/exec';

// AM Operations endpoint - UPDATED URL (no CORS headers needed, must match OperationsChecklist submission endpoint)
const AM_OPS_ENDPOINT = 'https://script.google.com/macros/s/AKfycby7R8JLMuleKjqzjVOK7fkhMmX7nCT0A-IJ8vK2TiC428hpAeKO-0axtaUfJI6k4WlUcQ/exec';

// Training Audit endpoint - UPDATED URL
const TRAINING_AUDIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzEyJQiAhl3pS90uvkf-3e1mIbq8WNs7-xMtuBwD6eOy85Kkx6EKpzUsHW-oxp6NAoqjQ/exec';

// QA Assessment endpoint - UPDATED URL (Data fetched from Google Sheets)
const QA_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwGIDlsSGyRhR40G0zLmYpbs5C-ShrZffwnKcn3hikZPeDFtcWbeDzewT49yJQ_8YCUkA/exec';

// Finance Audit endpoint - UPDATED URL (Data fetched from Google Sheets)
const FINANCE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx1WaaEoUTttanmWGS8me3HZNhuqaxVHoPdWN3AdI0i4bLQmHFRztj133Vh8SaoVb2iwg/exec';

// Campus Hiring endpoint - UPDATED URL
const CAMPUS_HIRING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyalNdIb_BrBEGmMXfysS9Qp88SGMg5BXg7m9X41walQ2nhYZDgUy6vCTOCB4whsoJNrA/exec';

// Cache for store mapping data
let storeMappingCache: any[] | null = null;

// Load comprehensive store mapping data
const loadStoreMapping = async (): Promise<any[]> => {
  if (storeMappingCache) {
    return storeMappingCache;
  }

  try {
    const base = (import.meta as any).env?.BASE_URL || '/';
    let response;

    // Try the comprehensive mapping first
    try {
      response = await fetch(`${base}comprehensive_store_mapping.json`);
      if (response.ok) {
        storeMappingCache = await response.json();
        return storeMappingCache;
      } else {
        throw new Error('Comprehensive mapping not found');
      }
    } catch {
      // Try latest mapping as fallback
      try {
        response = await fetch(`${base}latest_store_mapping.json`);
        if (response.ok) {
          storeMappingCache = await response.json();
          return storeMappingCache;
        } else {
          throw new Error('Latest mapping not found');
        }
      } catch {
        // Try twc mapping as final fallback
        try {
          response = await fetch(`${base}twc_store_mapping.json`);
          if (response.ok) {
            storeMappingCache = await response.json();
            return storeMappingCache;
          } else {
            throw new Error('TWC mapping not found');
          }
        } catch {
          // Last resort: hr_mapping.json
          response = await fetch(`${base}hr_mapping.json`);
          storeMappingCache = await response.json();
          return storeMappingCache;
        }
      }
    }
  } catch (error) {
    return [];
  }
};

// Get Area Manager data for HR based on mapping
const getAMForHR = async (hrId: string): Promise<{ amId: string, amName: string } | null> => {
  const mappingData = await loadStoreMapping();

  // Find stores where this HR is responsible (HRBP > Regional HR > HR Head priority)
  const hrStores = mappingData.filter((mapping: any) =>
    mapping['HRBP ID'] === hrId ||
    mapping['Regional HR ID'] === hrId ||
    mapping['HR Head ID'] === hrId ||
    mapping.hrbpId === hrId ||
    mapping.regionalHrId === hrId ||
    mapping.hrHeadId === hrId
  );

  if (hrStores.length > 0) {
    // Get the Area Manager from the first store (they should all have the same AM)
    const amId = hrStores[0]['Area Manager ID'] || hrStores[0].areaManagerId;
    const amPerson = AREA_MANAGERS.find(am => am.id === amId);

    return {
      amId: amId,
      amName: amPerson?.name || `AM ${amId}`
    };
  }

  return null;
};

// Get stores for an Area Manager
const getStoresForAM = async (amId: string): Promise<{ storeId: string, storeName: string, region: string }[]> => {
  const mappingData = await loadStoreMapping();

  return mappingData
    .filter((mapping: any) =>
      mapping['Area Manager ID'] === amId || mapping.areaManagerId === amId
    )
    .map((mapping: any) => ({
      storeId: mapping['Store ID'] || mapping['storeId'],
      storeName: mapping['Store Name'] || mapping['locationName'],
      region: mapping['Region'] || mapping['region']
    }));
};

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Utility function to deduplicate submissions
// Keeps only the latest submission for each employee per day
const deduplicateSubmissions = (submissions: Submission[]): Submission[] => {
  // Group submissions by employee (empName + empId) and date
  const submissionMap = new Map<string, Submission>();

  submissions.forEach(submission => {
    const empKey = `${submission.empName}_${submission.empId}`.toLowerCase();

    // Extract date from submission time (ignore time component)
    const submissionDate = parseSubmissionDate(submission.submissionTime);
    if (!submissionDate) {
      return;
    }

    const dateKey = `${submissionDate.getFullYear()}-${submissionDate.getMonth()}-${submissionDate.getDate()}`;
    const uniqueKey = `${empKey}_${dateKey}`;

    // Check if we already have a submission for this employee on this date
    const existing = submissionMap.get(uniqueKey);

    if (!existing) {
      // First submission for this employee on this date
      submissionMap.set(uniqueKey, submission);
    } else {
      // Compare timestamps to keep the latest one
      const existingDate = parseSubmissionDate(existing.submissionTime);

      if (existingDate && submissionDate > existingDate) {
        // Current submission is newer, replace the existing one
        submissionMap.set(uniqueKey, submission);
      }
    }
  });

  const deduplicated = Array.from(submissionMap.values());
  return deduplicated;
};

// Helper function to parse submission date/time string
const parseSubmissionDate = (submissionTime: string): Date | null => {
  if (!submissionTime) return null;

  try {
    // Handle ISO format (from mock data)
    if (submissionTime.includes('T')) {
      return new Date(submissionTime);
    }

    // Parse DD/MM/YYYY, HH:MM:SS format (from Google Sheets)
    const dateStr = submissionTime.trim().replace(',', '');
    const parts = dateStr.split(' ');

    if (parts.length < 1) return null;

    // Parse date part (DD/MM/YYYY)
    const dateParts = parts[0].split('/');
    if (dateParts.length !== 3) return null;

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed
    const year = parseInt(dateParts[2], 10);

    // Parse time part if available (HH:MM:SS)
    let hour = 0, minute = 0, second = 0;
    if (parts.length > 1 && parts[1]) {
      const timeParts = parts[1].split(':');
      hour = parseInt(timeParts[0] || '0', 10);
      minute = parseInt(timeParts[1] || '0', 10);
      second = parseInt(timeParts[2] || '0', 10);
    }

    return new Date(year, month, day, hour, minute, second);
  } catch (err) {
    return null;
  }
};

const generateMockData = async (count: number): Promise<Submission[]> => {
  const data: Submission[] = [];
  const scoredQuestions = QUESTIONS.filter(q => q.choices);
  const maxScore = scoredQuestions.reduce((sum, q) => sum + Math.max(...(q.choices?.map(c => c.score) || [0])), 0);

  // Load hr_mapping.json to generate realistic data
  let hrMappingData: any[] = [];
  try {
    const base = (import.meta as any).env?.BASE_URL || '/';
    const response = await fetch(`${base}hr_mapping.json`);
    hrMappingData = await response.json();
  } catch (error) {
    // Use fallback
  }

  for (let i = 0; i < count; i++) {
    // Use real mapping data if available, otherwise fallback to constants
    let hr, am, store, storeRegion;

    if (hrMappingData.length > 0) {
      const randomMapping = getRandomItem(hrMappingData);

      // Get Area Manager from mapping
      am = AREA_MANAGERS.find(a => a.id === randomMapping.areaManagerId) ||
        { name: `AM ${randomMapping.areaManagerId}`, id: randomMapping.areaManagerId };

      // Determine which HR ID to use based on priority: HRBP > Regional HR > HR Head
      let hrId = randomMapping.hrbpId || randomMapping.regionalHrId || randomMapping.hrHeadId;

      // Find HR names from constants or use IDs
      hr = HR_PERSONNEL.find(h => h.id === hrId) ||
        { name: `HR ${hrId}`, id: hrId };

      store = { name: randomMapping['Store Name'] || randomMapping.locationName, id: randomMapping['Store ID'] || randomMapping.storeId };
      storeRegion = randomMapping.region;
    } else {
      // Fallback to constants
      hr = getRandomItem(HR_PERSONNEL);
      am = getRandomItem(AREA_MANAGERS);
      store = getRandomItem(STORES);
      storeRegion = getRandomItem(['North', 'South', 'West']);
    }

    let totalScore = 0;
    const submission: Partial<Submission> = {};

    QUESTIONS.forEach(q => {
      if (q.choices) {
        const choice = getRandomItem(q.choices);
        (submission as any)[q.id] = choice.label;
        totalScore += choice.score;
      } else if (q.id === 'q10') {
        (submission as any)[q.id] = `Colleague ${i + 1}`;
      } else {
        (submission as any)[q.id] = `Suggestion or comment number ${i + 1}. Lorem ipsum dolor sit amet.`;
      }
    });

    const submissionDate = new Date();
    submissionDate.setDate(submissionDate.getDate() - Math.floor(Math.random() * 365));

    data.push({
      ...submission,
      submissionTime: submissionDate.toISOString(),
      hrName: hr.name,
      hrId: hr.id,
      amName: am.name,
      amId: am.id,
      empName: `Employee ${i + 1}`,
      empId: `E${1000 + i}`,
      storeName: store.name,
      storeID: store.id,
      region: storeRegion,
      totalScore,
      maxScore,
      percent: Math.round((totalScore / maxScore) * 100),
    } as Submission);
  }
  return data;
};

// Convert Google Sheets data to Submission format
const convertSheetsDataToSubmissions = async (sheetsData: any[]): Promise<Submission[]> => {
  if (!sheetsData || sheetsData.length === 0) {
    return [];
  }

  const results: Submission[] = [];

  for (const row of sheetsData) {
    // Calculate score for this submission
    let totalScore = 0, maxScore = 0;

    QUESTIONS.forEach(q => {
      if (q.choices) {
        const response = row[q.id];
        if (response && response.trim() !== '') {
          // Try to find the choice by label first, then by score
          const choiceByLabel = q.choices.find(c => c.label.toLowerCase() === response.toLowerCase().trim());
          const choiceByScore = q.choices.find(c => c.score === Number(response));
          const choice = choiceByLabel || choiceByScore;

          if (choice) {
            totalScore += choice.score;
          }
        }
        maxScore += Math.max(...q.choices.map(c => c.score));
      }
    });

    const calculatedPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Always use recalculated scores since we updated the scoring system
    // Use calculated scores if the ones from sheets are empty/invalid, otherwise use recalculated
    const finalTotalScore = row.totalScore && !isNaN(Number(row.totalScore)) ? Number(row.totalScore) : totalScore;
    const finalMaxScore = row.maxScore && !isNaN(Number(row.maxScore)) ? Number(row.maxScore) : maxScore;
    // Always use the recalculated percentage to ensure correct scoring after the update
    const finalPercent = calculatedPercent;

    // Get proper mappings for the store
    // Try both formats: with spaces (from Google Sheets) and without (from local data)
    // IMPORTANT: Preserve AM and HR data from Google Sheets as primary source
    const originalAmId = row['AM ID'] || row.amId || '';
    const originalAmName = row['AM Name'] || row.amName || '';
    let amId = originalAmId;
    let amName = originalAmName;

    // IMPORTANT: Keep the original HR data from Google Sheets (who actually did the survey)
    // Don't overwrite with store mapping HRBP
    const originalHrId = row['HR ID'] || row.hrId || '';
    const originalHrName = row['HR Name'] || row.hrName || '';
    let hrId = originalHrId;
    let hrName = originalHrName;
    let region = row['Region'] || row.region || 'Unknown';

    // Look up from comprehensive store mapping ONLY if AM/HR data is missing from Google Sheets
    if (row['Store ID'] || row.storeID || row.storeId) {
      const storeId = row['Store ID'] || row.storeID || row.storeId;
      try {
        const mappingData = await loadStoreMapping();
        const storeMapping = mappingData.find((mapping: any) =>
          mapping['Store ID'] === storeId || mapping.storeId === storeId
        );

        if (storeMapping) {
          // Get Area Manager - ONLY if not provided in Google Sheets
          if (!originalAmId || !originalAmName) {
            const mappedAmId = storeMapping.AM || storeMapping['Area Manager ID'] || storeMapping.areaManagerId;
            if (mappedAmId) {
              amId = mappedAmId;
              const amPerson = AREA_MANAGERS.find(am => am.id === amId);
              amName = amPerson?.name || `AM ${amId}`;
            }
          }

          // Only use store mapping HRBP if Google Sheets didn't provide HR data
          if (!originalHrId) {
            const mappedHrId = storeMapping.HRBP || storeMapping['Regional Training Manager'] ||
              storeMapping['HR Head'] || storeMapping.hrbpId ||
              storeMapping.regionalHrId || storeMapping.hrHeadId;
            if (mappedHrId) {
              hrId = mappedHrId;
              const hrPerson = HR_PERSONNEL.find(hr => hr.id === hrId);
              hrName = hrPerson?.name || `HR ${hrId}`;
            }
          }

          // Get Region from mapping only if not in Google Sheets
          const mappedRegion = storeMapping.Region || storeMapping['Region'] || storeMapping.region;
          if (mappedRegion && !row['Region'] && !row.region) {
            region = mappedRegion;
          }
        }
      } catch (error) {
        // Mapping failed, use original values
      }
    }

    const submission: Submission = {
      submissionTime: row['Server Timestamp'] || row['Submission Time'] || row.submissionTime || new Date().toISOString(),
      hrName: hrName,
      hrId: hrId,
      amName: amName,
      amId: amId,
      empName: row['Emp Name'] || row.empName || '',
      empId: row['Emp ID'] || row.empId || '',
      storeName: row['Store Name'] || row.storeName || '',
      storeID: row['Store ID'] || row.storeID || row.storeId || '',
      region: region,
      q1: row.q1 || '',
      q1_remarks: row.q1_remarks || '',
      q2: row.q2 || '',
      q2_remarks: row.q2_remarks || '',
      q3: row.q3 || '',
      q3_remarks: row.q3_remarks || '',
      q4: row.q4 || '',
      q4_remarks: row.q4_remarks || '',
      q5: row.q5 || '',
      q5_remarks: row.q5_remarks || '',
      q6: row.q6 || '',
      q6_remarks: row.q6_remarks || '',
      q7: row.q7 || '',
      q7_remarks: row.q7_remarks || '',
      q8: row.q8 || '',
      q8_remarks: row.q8_remarks || '',
      q9: row.q9 || '',
      q9_remarks: row.q9_remarks || '',
      q10: row.q10 || '',
      q10_remarks: row.q10_remarks || '',
      q11: row.q11 || '',
      q11_remarks: row.q11_remarks || '',
      q12: row.q12 || '',
      q12_remarks: row.q12_remarks || '',
      totalScore: finalTotalScore,
      maxScore: finalMaxScore,
      percent: finalPercent,
    };

    results.push(submission);
  }

  return results;
};

export const fetchSubmissions = async (): Promise<Submission[]> => {
  try {
    // Try direct request first (works if CORS is properly configured)
    let response;
    let data;

    try {
      // Add cache-busting parameter to force fresh data
      const cacheBuster = `&_t=${Date.now()}`;
      const directUrl = SHEETS_ENDPOINT + '?action=getData' + cacheBuster;

      response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache', // Disable browser caching
        redirect: 'follow',
      });

      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      // Fallback to CORS proxy
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = SHEETS_ENDPOINT + '?action=getData';

      response = await fetch(proxyUrl + targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        const errorText = await response.text();
        return await generateMockData(20);
      }

      data = await response.json();
    }

    // Handle both direct array format and object with rows property
    let rowsData: any[];
    if (Array.isArray(data)) {
      rowsData = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.rows)) {
      rowsData = data.rows;
    } else {
      return await generateMockData(20);
    }

    const submissions = await convertSheetsDataToSubmissions(rowsData);

    // If no real data available, generate mock data for demo purposes
    if (submissions.length === 0) {
      return await generateMockData(20);
    }

    // Deduplicate submissions - keep only the latest submission per employee per day
    const deduplicatedSubmissions = deduplicateSubmissions(submissions);

    return deduplicatedSubmissions;
  } catch (error) {
    // Return mock data instead of empty array for demo purposes
    return await generateMockData(20);
  }
};

// Interface for AM Operations submission
export interface AMOperationsSubmission {
  submissionTime: string;
  hrName: string;
  hrId: string;
  amName: string;
  amId: string;
  trainerName: string;
  trainerId: string;
  storeName: string;
  storeId: string;
  region: string;
  bscAchievement?: string;
  peopleOnShift?: string;
  manpowerFulfilment?: string;
  // Comprehensive store mapping fields
  menu?: string;
  storeType?: string;
  concept?: string;
  hrbp?: string;
  trainer?: string;
  am?: string;
  // Legacy fields (keeping for backward compatibility)
  cafeType?: string;
  totalScore: string;
  maxScore: string;
  percentageScore: string;
  // All section responses
  [key: string]: string; // For dynamic question keys like CG_1, OTA_1, etc.
}

// Fetch AM Operations data
// Helper function to apply region mapping to any dataset
const applyRegionMapping = async (dataArray: any[]): Promise<AMOperationsSubmission[]> => {
  const mappingData = await loadStoreMapping();

  const processedData = dataArray.map((row: any) => {
    let region = 'Unknown';
    let menu = '';
    let storeType = '';
    let concept = '';
    let hrbp = '';
    let trainer = '';
    let am = '';
    let regionalTrainingManager = '';

    let storeId = row.storeId || row.storeID || row['Store ID'];

    // ALWAYS map ALL fields from the comprehensive mapping file based on Store ID
    if (storeId) {
      try {
        // Try to find by exact store ID match first
        let storeMapping = mappingData.find(mapping => {
          const mappingStoreId = mapping['Store ID'] || mapping.storeId;
          const match = mappingStoreId === storeId.toString();
          return match;
        });

        // If not found and storeId is numeric, try with S prefix
        if (!storeMapping && !isNaN(storeId) && !storeId.toString().startsWith('S')) {
          const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
          storeMapping = mappingData.find(mapping => {
            const mappingStoreId = mapping['Store ID'] || mapping.storeId;
            return mappingStoreId === sFormattedId;
          });
        }

        // If still not found, try to match by store name if available
        if (!storeMapping && (row.storeName || row['Store Name'])) {
          const submissionStoreName = row.storeName || row['Store Name'];
          storeMapping = mappingData.find(mapping => {
            const mappingStoreName = mapping['Store Name'] || mapping.storeName || '';
            const nameMatch = mappingStoreName.toLowerCase().includes(submissionStoreName.toLowerCase()) ||
              submissionStoreName.toLowerCase().includes(mappingStoreName.toLowerCase()) ||
              mappingStoreName.toLowerCase() === submissionStoreName.toLowerCase();
            return nameMatch;
          });
        }

        if (storeMapping) {
          // Map all fields from comprehensive mapping - THIS OVERRIDES GOOGLE SHEET DATA
          const originalRegion = row.region;
          const originalStoreName = row.storeName || row['Store Name'];
          const mappedStoreName = storeMapping['Store Name'] || storeMapping.storeName;

          region = storeMapping['Region'] || storeMapping.region || 'Unknown';
          menu = storeMapping['Menu'] || storeMapping.menu || '';
          storeType = storeMapping['Store Type'] || storeMapping.storeType || '';
          concept = storeMapping['Concept'] || storeMapping.concept || '';
          hrbp = storeMapping['HRBP'] || storeMapping.hrbp || '';
          trainer = storeMapping['Trainer'] || storeMapping.trainer || '';
          am = storeMapping['AM'] || storeMapping.am || '';
          regionalTrainingManager = storeMapping['Regional Training Manager'] || storeMapping.regionalTrainingManager || '';

        }
      } catch (error) {
        // Mapping failed, use original values
      }
    }

    return {
      ...row,
      region: region,
      storeId: storeId,
      menu: menu,
      storeType: storeType,
      concept: concept,
      hrbp: hrbp,
      trainer: trainer,
      am: am,
      regionalTrainingManager: regionalTrainingManager
    };
  });

  return processedData as AMOperationsSubmission[];
};

export const fetchAMOperationsData = async (): Promise<AMOperationsSubmission[]> => {
  try {
    const directUrl = AM_OPS_ENDPOINT + '?action=getData';
    console.log('Fetching AM Operations data from:', directUrl);

    const response = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      redirect: 'follow',
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch AM Operations data:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('Received data:', data);
    console.log('Data is array?', Array.isArray(data));
    console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');

    if (!Array.isArray(data)) {
      console.error('Invalid data format received from AM Operations endpoint:', typeof data);
      return [];
    }

    // Map Google Sheets column names to camelCase field names
    const mappedData = data.map((row: any) => {
      return {
        submissionTime: row['Submission Time'] || row.submissionTime || '',
        hrName: row['HR Name'] || row.hrName || '',
        hrId: row['HR ID'] || row.hrId || '',
        amName: row['AM Name'] || row.amName || '',
        amId: row['AM ID'] || row.amId || '',
        trainerName: row['Trainer Name'] || row.trainerName || '',
        trainerId: row['Trainer ID'] || row.trainerId || '',
        storeName: row['Store Name'] || row.storeName || '',
        storeId: row['Store ID'] || row.storeId || '',
        region: row['Region'] || row.region || '',
        bscAchievement: row['BSC Achievement'] || row.bscAchievement || '',
        peopleOnShift: row['People On Shift'] || row.peopleOnShift || '',
        manpowerFulfilment: row['Manpower Fulfilment'] || row.manpowerFulfilment || '',
        totalScore: row['Total Score'] || row.totalScore || '',
        maxScore: row['Max Score'] || row.maxScore || '',
        percentageScore: row['Percentage Score'] || row.percentageScore || '',
        // Copy all other fields (question responses, etc.)
        ...row
      };
    });

    console.log('Mapped data sample:', mappedData[0]);

    // Process data using the helper function to ensure proper region mapping
    const processedData = await applyRegionMapping(mappedData);
    console.log('Processed data length:', processedData.length);
    console.log('Processed data sample:', processedData[0]);

    return processedData;

  } catch (error) {
    console.error('Error fetching AM Operations data:', error);
    return [];
  }
};

// Interface for Training Audit submission
export interface TrainingAuditSubmission {
  submissionTime: string;
  trainerName: string;
  trainerId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
  region: string;
  mod: string;
  totalScore: string;
  maxScore: string;
  percentageScore: string;
  // TSA Scores (derived from TSA_TSA_1, TSA_TSA_2, TSA_TSA_3)
  tsaFoodScore?: string;
  tsaCoffeeScore?: string;
  tsaCXScore?: string;
  // All section responses
  [key: string]: string; // For dynamic question keys like TM_1, LMS_1, etc.
}

// Fetch Training Audit data
export const fetchTrainingData = async (): Promise<TrainingAuditSubmission[]> => {
  try {
    let response;
    let data;

    try {
      const directUrl = TRAINING_AUDIT_ENDPOINT + '?action=getData';

      response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = TRAINING_AUDIT_ENDPOINT + '?action=getData';

      response = await fetch(proxyUrl + targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        const errorText = await response.text();
        return STATIC_TRAINING_DATA as TrainingAuditSubmission[];
      }

      data = await response.json();
    }

    if (!Array.isArray(data)) {
      return STATIC_TRAINING_DATA as TrainingAuditSubmission[];
    }

    // Process data to ensure proper region mapping and TSA score extraction
    const processedData = await Promise.all(data.map(async (row: any) => {
      let region = row.region || 'Unknown';
      let storeId = row.storeId;
      const trainerId = (row.trainerId || '').toLowerCase().trim();

      // CRITICAL FIX: Kailash (H2595) should ALWAYS be North region, never West
      if (trainerId === 'h2595' && region === 'West') {
        region = 'North';
      }

      // If region is Unknown or empty, try to map from store ID
      if (!region || region === 'Unknown') {
        try {
          if (storeId) {
            const mappingData = await loadStoreMapping();

            // Try to find by exact store ID match first
            let storeMapping = mappingData.find(mapping =>
              mapping["Store ID"] === storeId.toString() ||
              mapping.storeId === storeId.toString()
            );

            // If not found and storeId is numeric, try with S prefix
            if (!storeMapping && !isNaN(storeId) && !storeId.toString().startsWith('S')) {
              const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
              storeMapping = mappingData.find(mapping =>
                mapping["Store ID"] === sFormattedId ||
                mapping.storeId === sFormattedId
              );
            }

            // If still not found, try to match by store name if available
            if (!storeMapping && row.storeName) {
              storeMapping = mappingData.find(mapping => {
                const mappingStoreName = mapping["Store Name"] || mapping.storeName || '';
                const submissionStoreName = row.storeName;

                return mappingStoreName.toLowerCase().includes(submissionStoreName.toLowerCase()) ||
                  submissionStoreName.toLowerCase().includes(mappingStoreName.toLowerCase()) ||
                  mappingStoreName.toLowerCase() === submissionStoreName.toLowerCase();
              });
            }

            if (storeMapping && (storeMapping["Region"] || storeMapping.region)) {
              region = storeMapping["Region"] || storeMapping.region;
            }
          }
        } catch (error) {
          // Mapping failed, use original values
        }
      }

      // Extract and map TSA scores - check multiple possible field names
      // The Google Apps Script returns: tsaFoodScore, tsaCoffeeScore, tsaCXScore (camelCase)
      // Also check legacy field names: TSA_TSA_1, TSA_TSA_2, TSA_TSA_3
      const tsaFoodScore = row.tsaFoodScore || row['tsaFoodScore'] || row.TSA_Food_Score || row['TSA_Food_Score'] || row.TSA_TSA_2 || row['TSA_TSA_2'] || '';
      const tsaCoffeeScore = row.tsaCoffeeScore || row['tsaCoffeeScore'] || row.TSA_Coffee_Score || row['TSA_Coffee_Score'] || row.TSA_TSA_1 || row['TSA_TSA_1'] || '';
      const tsaCXScore = row.tsaCXScore || row['tsaCXScore'] || row.TSA_CX_Score || row['TSA_CX_Score'] || row.TSA_TSA_3 || row['TSA_TSA_3'] || '';

      return {
        ...row,
        region: region,
        tsaCoffeeScore: tsaCoffeeScore,
        tsaFoodScore: tsaFoodScore,
        tsaCXScore: tsaCXScore
      };
    }));

    return processedData as TrainingAuditSubmission[];

  } catch (error) {
    return STATIC_TRAINING_DATA as TrainingAuditSubmission[];
  }
};

// Interface for QA Assessment submission
export interface QASubmission {
  submissionTime: string;
  qaName: string;
  qaId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
  region: string;
  totalScore: string;
  maxScore: string;
  scorePercentage: string;
  // All section responses
  [key: string]: string; // For dynamic question keys like ZeroTolerance_ZT_1, Maintenance_M_1, etc.
}

// Fetch QA Assessment data
export const fetchQAData = async (): Promise<QASubmission[]> => {
  try {
    let response;
    let data;

    try {
      const directUrl = QA_ENDPOINT + '?action=getData';

      // Create an AbortController with 30 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        response = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          redirect: 'follow',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`Direct request failed: ${response.status}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw fetchError;
      }
    } catch (directError) {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = QA_ENDPOINT + '?action=getData';

      response = await fetch(proxyUrl + targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`CORS proxy request failed: ${response.status}`);
      }
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Process data to ensure region mapping
    const mappingData = await loadStoreMapping();

    const processedData = data.map((row: any) => {
      let region = row.region || 'Unknown';

      // Try to map region from store data if not already present
      if (region === 'Unknown' || !region) {
        try {
          let storeMapping = null;
          const storeId = row.storeId || row.storeID;

          if (storeId) {
            // Try exact match first
            storeMapping = mappingData.find(mapping =>
              mapping["Store ID"] === storeId || mapping.storeId === storeId
            );

            // If not found and it's a number, try finding with store name
            if (!storeMapping) {
              if (row.storeName) {
                storeMapping = mappingData.find(mapping =>
                  mapping["Store Name"] || mapping.locationName.toLowerCase().includes(row.storeName.toLowerCase()) ||
                  row.storeName.toLowerCase().includes(mapping["Store Name"] || mapping.locationName.toLowerCase())
                );
              }
            }

            // If still not found with S prefix, try with S prefix
            if (!storeMapping && !storeId.toString().startsWith('S')) {
              const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
              storeMapping = mappingData.find(mapping => mapping["Store ID"] || mapping.storeId === sFormattedId);
            }

            if (storeMapping && storeMapping["Region"] || storeMapping.region) {
              region = storeMapping["Region"] || storeMapping.region;
            }
          }
        } catch (error) {
          // Mapping failed, use original values
        }
      }

      return {
        ...row,
        region: region
      };
    });

    return processedData as QASubmission[];

  } catch (error) {
    // Static test data for QA dashboard development (fallback)
    const STATIC_QA_DATA: QASubmission[] = [
      {
        submissionTime: '2024-01-15 10:30:00',
        qaName: 'John Smith',
        qaId: 'QA001',
        amName: 'Atul',
        amId: 'AM001',
        storeName: 'West Store 1',
        storeId: 'S001',
        region: 'West',
        totalScore: '85',
        maxScore: '100',
        scorePercentage: '85',
        // Zero Tolerance questions (6 questions)
        'ZeroTolerance_ZT_1': 'yes',
        'ZeroTolerance_ZT_2': 'yes',
        'ZeroTolerance_ZT_3': 'no',
        'ZeroTolerance_ZT_4': 'yes',
        'ZeroTolerance_ZT_5': 'yes',
        'ZeroTolerance_ZT_6': 'yes',
        // Maintenance questions (11 questions)
        'Maintenance_M_1': 'yes',
        'Maintenance_M_2': 'yes',
        'Maintenance_M_3': 'yes',
        'Maintenance_M_4': 'no',
        'Maintenance_M_5': 'yes',
        'Maintenance_M_6': 'yes',
        'Maintenance_M_7': 'yes',
        'Maintenance_M_8': 'yes',
        'Maintenance_M_9': 'no',
        'Maintenance_M_10': 'yes',
        'Maintenance_M_11': 'yes',
        // Store Operations questions (16 questions)
        'StoreOperations_SO_1': 'yes',
        'StoreOperations_SO_2': 'yes',
        'StoreOperations_SO_3': 'yes',
        'StoreOperations_SO_4': 'yes',
        'StoreOperations_SO_5': 'no',
        'StoreOperations_SO_6': 'yes',
        'StoreOperations_SO_7': 'yes',
        'StoreOperations_SO_8': 'yes',
        'StoreOperations_SO_9': 'yes',
        'StoreOperations_SO_10': 'yes',
        'StoreOperations_SO_11': 'no',
        'StoreOperations_SO_12': 'yes',
        'StoreOperations_SO_13': 'yes',
        'StoreOperations_SO_14': 'yes',
        'StoreOperations_SO_15': 'yes',
        'StoreOperations_SO_16': 'yes',
        // Hygiene & Compliance questions (6 questions)
        'HygieneCompliance_HC_1': 'yes',
        'HygieneCompliance_HC_2': 'yes',
        'HygieneCompliance_HC_3': 'yes',
        'HygieneCompliance_HC_4': 'no',
        'HygieneCompliance_HC_5': 'yes',
        'HygieneCompliance_HC_6': 'yes'
      },
      {
        submissionTime: '2024-01-16 14:20:00',
        qaName: 'Jane Doe',
        qaId: 'QA002',
        amName: 'Ajay',
        amId: 'AM002',
        storeName: 'North Store 1',
        storeId: 'S002',
        region: 'North',
        totalScore: '75',
        maxScore: '100',
        scorePercentage: '75',
        // Zero Tolerance questions
        'ZeroTolerance_ZT_1': 'yes',
        'ZeroTolerance_ZT_2': 'no',
        'ZeroTolerance_ZT_3': 'no',
        'ZeroTolerance_ZT_4': 'yes',
        'ZeroTolerance_ZT_5': 'yes',
        'ZeroTolerance_ZT_6': 'yes',
        // Maintenance questions
        'Maintenance_M_1': 'yes',
        'Maintenance_M_2': 'no',
        'Maintenance_M_3': 'yes',
        'Maintenance_M_4': 'no',
        'Maintenance_M_5': 'yes',
        'Maintenance_M_6': 'no',
        'Maintenance_M_7': 'yes',
        'Maintenance_M_8': 'yes',
        'Maintenance_M_9': 'no',
        'Maintenance_M_10': 'yes',
        'Maintenance_M_11': 'yes',
        // Store Operations questions
        'StoreOperations_SO_1': 'yes',
        'StoreOperations_SO_2': 'yes',
        'StoreOperations_SO_3': 'no',
        'StoreOperations_SO_4': 'yes',
        'StoreOperations_SO_5': 'no',
        'StoreOperations_SO_6': 'yes',
        'StoreOperations_SO_7': 'no',
        'StoreOperations_SO_8': 'yes',
        'StoreOperations_SO_9': 'yes',
        'StoreOperations_SO_10': 'no',
        'StoreOperations_SO_11': 'no',
        'StoreOperations_SO_12': 'yes',
        'StoreOperations_SO_13': 'yes',
        'StoreOperations_SO_14': 'no',
        'StoreOperations_SO_15': 'yes',
        'StoreOperations_SO_16': 'yes',
        // Hygiene & Compliance questions
        'HygieneCompliance_HC_1': 'yes',
        'HygieneCompliance_HC_2': 'no',
        'HygieneCompliance_HC_3': 'yes',
        'HygieneCompliance_HC_4': 'no',
        'HygieneCompliance_HC_5': 'yes',
        'HygieneCompliance_HC_6': 'yes'
      },
      {
        submissionTime: '2024-01-17 09:15:00',
        qaName: 'Mike Johnson',
        qaId: 'QA003',
        amName: 'Abhishek',
        amId: 'AM003',
        storeName: 'East Store 1',
        storeId: 'S003',
        region: 'East',
        totalScore: '92',
        maxScore: '100',
        scorePercentage: '92',
        // Zero Tolerance questions
        'ZeroTolerance_ZT_1': 'yes',
        'ZeroTolerance_ZT_2': 'yes',
        'ZeroTolerance_ZT_3': 'yes',
        'ZeroTolerance_ZT_4': 'yes',
        'ZeroTolerance_ZT_5': 'yes',
        'ZeroTolerance_ZT_6': 'yes',
        // Maintenance questions
        'Maintenance_M_1': 'yes',
        'Maintenance_M_2': 'yes',
        'Maintenance_M_3': 'yes',
        'Maintenance_M_4': 'yes',
        'Maintenance_M_5': 'yes',
        'Maintenance_M_6': 'yes',
        'Maintenance_M_7': 'yes',
        'Maintenance_M_8': 'yes',
        'Maintenance_M_9': 'yes',
        'Maintenance_M_10': 'no',
        'Maintenance_M_11': 'yes',
        // Store Operations questions
        'StoreOperations_SO_1': 'yes',
        'StoreOperations_SO_2': 'yes',
        'StoreOperations_SO_3': 'yes',
        'StoreOperations_SO_4': 'yes',
        'StoreOperations_SO_5': 'yes',
        'StoreOperations_SO_6': 'yes',
        'StoreOperations_SO_7': 'yes',
        'StoreOperations_SO_8': 'yes',
        'StoreOperations_SO_9': 'yes',
        'StoreOperations_SO_10': 'yes',
        'StoreOperations_SO_11': 'yes',
        'StoreOperations_SO_12': 'yes',
        'StoreOperations_SO_13': 'yes',
        'StoreOperations_SO_14': 'yes',
        'StoreOperations_SO_15': 'no',
        'StoreOperations_SO_16': 'yes',
        // Hygiene & Compliance questions
        'HygieneCompliance_HC_1': 'yes',
        'HygieneCompliance_HC_2': 'yes',
        'HygieneCompliance_HC_3': 'yes',
        'HygieneCompliance_HC_4': 'yes',
        'HygieneCompliance_HC_5': 'yes',
        'HygieneCompliance_HC_6': 'no'
      }
    ];

    return STATIC_QA_DATA;
  }
};

// Interface for Finance Audit submission
export interface FinanceSubmission {
  submissionTime: string;
  financeName: string;
  financeId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
  region: string;
  totalScore: string;
  maxScore: string;
  scorePercentage: string;
  // Section remarks
  generalCashManagementRemarks?: string;
  inventoryAuditRemarks?: string;
  complianceDocumentationRemarks?: string;
  reportingSystemsRemarks?: string;
  // All section responses - dynamic question keys like GeneralCashManagement_GCM_1, etc.
  [key: string]: string | undefined;
}

// Fetch Finance Audit data
export const fetchFinanceData = async (): Promise<FinanceSubmission[]> => {
  try {
    let response;
    let data;

    try {
      const directUrl = FINANCE_ENDPOINT + '?action=getData';

      response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = FINANCE_ENDPOINT + '?action=getData';

      response = await fetch(proxyUrl + targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`CORS proxy request failed: ${response.status}`);
      }
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Process data to ensure region mapping AND complete AM/Store data from comprehensive mapping
    const mappingData = await loadStoreMapping();

    const processedData = data.map((row: any) => {
      let region = row.region || 'Unknown';
      let amName = row.amName || '';
      let amId = row.amId || '';
      let storeName = row.storeName || '';

      // Try to map complete store data from comprehensive mapping
      try {
        let storeMapping = null;
        const storeId = row.storeId || row.storeID;

        if (storeId) {
          // Try exact match first
          storeMapping = mappingData.find(mapping =>
            mapping["Store ID"] === storeId || mapping.storeId === storeId
          );

          // If not found and store ID doesn't start with S, try with S prefix
          if (!storeMapping && !storeId.toString().startsWith('S')) {
            const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
            storeMapping = mappingData.find(mapping =>
              mapping["Store ID"] === sFormattedId || mapping.storeId === sFormattedId
            );
          }

          // If not found, try finding with store name
          if (!storeMapping && row.storeName) {
            storeMapping = mappingData.find(mapping =>
              (mapping["Store Name"] || mapping.locationName)?.toLowerCase() === row.storeName.toLowerCase() ||
              (mapping["Store Name"] || mapping.locationName)?.toLowerCase().includes(row.storeName.toLowerCase()) ||
              row.storeName.toLowerCase().includes((mapping["Store Name"] || mapping.locationName)?.toLowerCase() || '')
            );
          }

          if (storeMapping) {
            // Map Region
            if (storeMapping.Region || storeMapping.region) {
              region = storeMapping.Region || storeMapping.region;
            }

            // Map Area Manager data
            if (storeMapping.AM || storeMapping.am) {
              amId = storeMapping.AM || storeMapping.am;
              // Try to get AM name from the mapping or keep existing
              if (!amName || amName === 'Unknown') {
                // You can optionally fetch AM name from a separate lookup if needed
                amName = row.amName || amId; // Fallback to ID if name not available
              }
            }

            // Map Store Name if not present
            if (!storeName && (storeMapping["Store Name"] || storeMapping.locationName)) {
              storeName = storeMapping["Store Name"] || storeMapping.locationName;
            }
          }
        }
      } catch (err) {
        // Mapping failed, use original values
      }

      return {
        ...row,
        region: region,
        amName: amName,
        amId: amId,
        storeName: storeName
      };
    });

    return processedData as FinanceSubmission[];

  } catch (error) {
    return [];
  }
};

// Interface for Campus Hiring submission
export interface CampusHiringSubmission {
  'Timestamp': string;
  'Submission Time': string;
  'Candidate Name': string;
  'Candidate Phone': string;
  'Candidate Email': string;
  'Campus Name': string;
  'Total Score': string;
  'Max Score': string;
  'Score Percentage': string;
  // Category scores (matching Google Sheets columns)
  'Psychometric Score %': string;
  'English Proficiency Score %': string;
  'Numerical Aptitude Score %': string;
  'Logical Reasoning Score %': string;
  'Analytical Aptitude Score %': string;
  'Course Curriculum Score %': string;
  // All question responses
  [key: string]: string; // For dynamic question keys like Q1, Q1_weight, Q2, etc.
}

// Fetch Campus Hiring data
export const fetchCampusHiringData = async (): Promise<CampusHiringSubmission[]> => {
  try {
    let response;
    let data;

    try {
      const directUrl = CAMPUS_HIRING_ENDPOINT + '?action=getData';

      response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = CAMPUS_HIRING_ENDPOINT + '?action=getData';

      response = await fetch(proxyUrl + targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`CORS proxy request failed: ${response.status}`);
      }
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Process and return the data
    const processedData = data.map((row: any) => {
      // Normalize field names in case they come in different formats
      return {
        'Timestamp': row['Timestamp'] || row.timestamp || '',
        'Submission Time': row['Submission Time'] || row.submissionTime || '',
        'Candidate Name': row['Candidate Name'] || row.candidateName || '',
        'Candidate Phone': row['Candidate Phone'] || row.candidatePhone || '',
        'Candidate Email': row['Candidate Email'] || row.candidateEmail || '',
        'Campus Name': row['Campus Name'] || row.campusName || '',
        'Total Score': row['Total Score'] || row.totalScore || '0',
        'Max Score': row['Max Score'] || row.maxScore || '90',
        'Score Percentage': row['Score Percentage'] || row.scorePercentage || '0',
        'Communication Score %': row['Communication Score %'] || row['category_Communication'] || '0',
        'Problem Solving Score %': row['Problem Solving Score %'] || row['category_Problem Solving'] || '0',
        'Leadership Score %': row['Leadership Score %'] || row['category_Leadership'] || '0',
        'Attention to Detail Score %': row['Attention to Detail Score %'] || row['category_Attention to Detail'] || '0',
        'Customer Service Score %': row['Customer Service Score %'] || row['category_Customer Service'] || '0',
        'Integrity Score %': row['Integrity Score %'] || row['category_Integrity'] || '0',
        'Teamwork Score %': row['Teamwork Score %'] || row['category_Teamwork'] || '0',
        'Time Management Score %': row['Time Management Score %'] || row['category_Time Management'] || '0',
        'Planning Score %': row['Planning Score %'] || row['category_Planning'] || '0',
        'Adaptability Score %': row['Adaptability Score %'] || row['category_Adaptability'] || '0',
        'Analysis Score %': row['Analysis Score %'] || row['category_Analysis'] || '0',
        'Growth Mindset Score %': row['Growth Mindset Score %'] || row['category_Growth Mindset'] || '0',
        ...row // Include all other fields (questions, weights, etc.)
      };
    });

    return processedData;

  } catch (error) {
    return [];
  }
};