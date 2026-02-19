import { Submission } from '../types';
import { QUESTIONS, AREA_MANAGERS, STORES, HR_PERSONNEL, TRAINING_QUESTIONS } from '../constants';
import { generateTrainingTestData } from '../utils/trainingTestData';
import { STATIC_TRAINING_DATA } from './staticTrainingData';
import { STATIC_AM_OPERATIONS_DATA } from './staticOperationsData';

// Google Apps Script endpoint for fetching data - UPDATED with DD/MM/YYYY date formatting
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz2pAj_RBIwRmJfel7GmElLigWw1MquRz0zLtsX6uR627LUCcR7lHz-IRXGzIhESYX4sg/exec';

// AM Operations endpoint - UPDATED URL (no CORS headers needed, must match OperationsChecklist submission endpoint)
const AM_OPS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyKzDHP-iEpJTacXk_lPl6eNCJXtg5imabCdzYPVIWrHPNMXRHUDNO9PeijCKKWalBm/exec';

// Training Audit endpoint - UPDATED URL
const TRAINING_AUDIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwn4bXmjoXaTI7UMfDhzQwG6SZGZCq-qlVC_mQUnCZm0YiciqtaGgtdRJiq4oi505na3w/exec';

// QA Assessment endpoint - UPDATED URL (Data fetched from Google Sheets)
const QA_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwGIDlsSGyRhR40G0zLmYpbs5C-ShrZffwnKcn3hikZPeDFtcWbeDzewT49yJQ_8YCUkA/exec';

// Finance Audit endpoint - UPDATED URL (Data fetched from Google Sheets)
const FINANCE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzfP0OjIe2-XQut_0DgOFpkAvqkMi0RU6U3HLtDGBpNXeVTnLjHUtzNhlZtonXhy1H0/exec';

// Finance Historic Data endpoint - NEW (Replace with your deployed Apps Script URL)
const FINANCE_HISTORIC_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzKy5OVsh6pjLqbHjLAcHu2FpDay3CaZFI2tjJiIus1XmgOjsvo2QQu86kDjfye9T74/exec';

// Campus Hiring endpoint - UPDATED URL
const CAMPUS_HIRING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxbPYyW_kPmdL5Fnq1AUyhgLyvYmInBj9EzQSrmdFdqO4FJe2O8_flX6rxNaZNaVhjs_Q/exec';

// Cache for store mapping data
let storeMappingCache: any[] | null = null;

/**
 * Shared fetch utility with retry logic for Google Apps Script endpoints.
 * Chrome uses HTTP/3 (QUIC) for Google domains, which can fail with
 * ERR_QUIC_PROTOCOL_ERROR on some networks. Retrying works because
 * Chrome falls back to HTTP/2 after a QUIC failure.
 */
const fetchWithRetry = async (
  url: string,
  label: string,
  options: { maxRetries?: number; timeoutMs?: number; cacheBust?: boolean } = {}
): Promise<any> => {
  const { maxRetries = 3, timeoutMs = 90000, cacheBust = false } = options;
  const fetchUrl = cacheBust ? `${url}&_t=${Date.now()}` : url;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`📡 [${label}] Attempt ${attempt}/${maxRetries}`);

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow',
        signal: controller.signal,
        ...(cacheBust ? { cache: 'no-cache' as RequestCache } : {}),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [${label}] Success on attempt ${attempt}`);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`⏱️ [${label}] Timed out after ${timeoutMs / 1000}s`);
        return null; // Caller handles null as timeout
      }

      console.warn(`⚠️ [${label}] Attempt ${attempt}/${maxRetries} failed:`, error instanceof Error ? error.message : error);

      if (attempt < maxRetries) {
        const delay = attempt * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`❌ [${label}] All ${maxRetries} attempts failed`);
  return null;
};

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

  // PERFORMANCE FIX: Load employee directory and store mapping ONCE before the loop
  // Previously these were awaited inside each loop iteration, causing massive delays
  let employeeDir: any = { byId: {}, nameById: {} };
  try {
    const { fetchEmployeeDirectory } = await import('./employeeDirectoryService');
    employeeDir = await fetchEmployeeDirectory();
  } catch (error) {
    console.warn('[HR Survey] Could not fetch employee directory:', error);
  }

  const mappingData = await loadStoreMapping();

  // Pre-compute max scores for questions with choices (avoid recalculating per row)
  const questionMaxScores = QUESTIONS.filter(q => q.choices).map(q => ({
    id: q.id,
    choices: q.choices!,
    maxScore: Math.max(...q.choices!.map(c => c.score))
  }));

  const results: Submission[] = sheetsData.map(row => {
    // Calculate score for this submission
    let totalScore = 0, maxScore = 0;

    questionMaxScores.forEach(q => {
      const response = row[q.id];
      if (response && response.trim() !== '') {
        const responseLower = response.toLowerCase().trim();
        const choiceByLabel = q.choices.find(c => c.label.toLowerCase() === responseLower);
        const choice = choiceByLabel || q.choices.find(c => c.score === Number(response));

        if (choice) {
          totalScore += choice.score;
        }
      }
      maxScore += q.maxScore;
    });

    const calculatedPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const finalTotalScore = row.totalScore && !isNaN(Number(row.totalScore)) ? Number(row.totalScore) : totalScore;
    const finalMaxScore = row.maxScore && !isNaN(Number(row.maxScore)) ? Number(row.maxScore) : maxScore;
    const finalPercent = calculatedPercent;

    // Get proper mappings for the store
    const originalAmId = row['AM ID'] || row.amId || '';
    const originalAmName = row['AM Name'] || row.amName || '';
    let amId = originalAmId;
    let amName = originalAmName;

    const originalHrId = row['HR ID'] || row.hrId || '';
    const originalHrName = row['HR Name'] || row.hrName || '';
    let hrId = originalHrId;
    let hrName = originalHrName;
    let region = row['Region'] || row.region || 'Unknown';

    // Step 1: Get the employee's store from Employee Master (using pre-loaded directory)
    const empId = row['Emp ID'] || row.empId || '';
    let actualStoreId = row['Store ID'] || row.storeID || row.storeId || '';
    
    if (empId) {
      const normalizedEmpId = empId.toString().trim().toUpperCase();
      const employee = employeeDir.byId[normalizedEmpId];
      
      if (employee && employee.store_code) {
        actualStoreId = employee.store_code;
      }
    }

    // Step 2: Look up Store Mapping using the employee's actual store (using pre-loaded mapping)
    if (actualStoreId) {
      try {
        const storeMapping = mappingData.find((mapping: any) =>
          mapping['Store ID'] === actualStoreId || mapping.storeId === actualStoreId
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

          // Get HRBP from Store Mapping - correct HRBP for the employee's store
          if (!originalHrId) {
            const mappedHrId = storeMapping.HRBP || storeMapping['HRBP ID'] || storeMapping.hrbpId || 
              storeMapping['Regional Training Manager'] || storeMapping['HR Head'] || 
              storeMapping.regionalHrId || storeMapping.hrHeadId;
            if (mappedHrId) {
              hrId = mappedHrId;
              const hrPerson = HR_PERSONNEL.find(hr => hr.id === hrId);
              hrName = hrPerson?.name || `HR ${hrId}`;
            }
          }

          // Get Region from mapping
          const mappedRegion = storeMapping.Region || storeMapping['Region'] || storeMapping.region;
          if (mappedRegion && !row['Region'] && !row.region) {
            region = mappedRegion;
          }
        }
      } catch (error) {
        // Mapping failed, use original values
      }
    }

    return {
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
    } as Submission;
  });

  return results;
};

export const fetchSubmissions = async (): Promise<Submission[]> => {
  try {
    const data = await fetchWithRetry(
      SHEETS_ENDPOINT + '?action=getData',
      'HR',
      { cacheBust: true }
    );

    if (data === null) {
      console.warn('⚠️ [HR] Fetch failed, using mock data');
      return await generateMockData(20);
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
  
  // PERFORMANCE: Build indexed lookup maps for O(1) store lookups
  const storeIdIndex = new Map<string, any>();
  const storeNameIndex = new Map<string, any>();
  mappingData.forEach(mapping => {
    const sid = mapping['Store ID'] || mapping.storeId;
    if (sid) storeIdIndex.set(sid.toString(), mapping);
    const sname = mapping['Store Name'] || mapping.storeName;
    if (sname) storeNameIndex.set(sname.toLowerCase(), mapping);
  });

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
        // Use indexed lookup instead of .find()
        let storeMapping = storeIdIndex.get(storeId.toString());

        // If not found and storeId is numeric, try with S prefix
        if (!storeMapping && !isNaN(storeId) && !storeId.toString().startsWith('S')) {
          const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
          storeMapping = storeIdIndex.get(sFormattedId);
        }

        // If still not found, try to match by store name
        if (!storeMapping && (row.storeName || row['Store Name'])) {
          const submissionStoreName = (row.storeName || row['Store Name']).toLowerCase();
          storeMapping = storeNameIndex.get(submissionStoreName);
        }

        if (storeMapping) {
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
    const data = await fetchWithRetry(
      AM_OPS_ENDPOINT + '?action=getData',
      'AM Ops'
    );

    if (data === null || !Array.isArray(data)) {
      console.warn('⚠️ [AM Ops] No valid data, returning empty');
      return [];
    }

    // Map Google Sheets column names to camelCase field names
    const mappedData = data.map((row: any) => {
      // Map percentageScore with multiple fallbacks
      let percentageScore = row['Percentage Score'] || row.percentageScore || row['Overall Score'] || '';
      
      // If percentageScore is empty or zero, try to calculate from totalScore and maxScore
      if (!percentageScore || percentageScore === '0' || percentageScore === 0) {
        const totalScore = parseFloat(row['Total Score'] || row.totalScore || '0');
        const maxScore = parseFloat(row['Max Score'] || row.maxScore || '63');
        if (totalScore > 0 && maxScore > 0) {
          percentageScore = Math.round((totalScore / maxScore) * 100).toString();
        }
      }
      
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
        percentageScore: percentageScore,
        // Copy all other fields (question responses, etc.)
        ...row
      };
    });

    // Normalize question keys: map offset IDs (OTA_101→OTA_1, FAS_201→FAS_1, etc.) and vice versa
    // so all downstream components (section scores, radar, RCA) can find data regardless of format
    const SECTION_OFFSETS: { [prefix: string]: number } = { OTA: 100, FAS: 200, FWS: 300, ENJ: 400, EX: 500 };
    const normalizedData = mappedData.map((entry: any) => {
      const normalized = { ...entry };
      Object.keys(entry).forEach(key => {
        const match = key.match(/^(CG|OTA|FAS|FWS|ENJ|EX)_(\d+)$/);
        if (!match) return;
        const [, prefix, numStr] = match;
        const num = parseInt(numStr, 10);
        const offset = SECTION_OFFSETS[prefix] || 0;

        if (offset > 0) {
          if (num > offset) {
            // e.g. OTA_101 → also set OTA_1
            const shortKey = `${prefix}_${num - offset}`;
            if (normalized[shortKey] === undefined || normalized[shortKey] === '') {
              normalized[shortKey] = entry[key];
            }
          } else {
            // e.g. OTA_1 → also set OTA_101
            const longKey = `${prefix}_${num + offset}`;
            if (normalized[longKey] === undefined || normalized[longKey] === '') {
              normalized[longKey] = entry[key];
            }
          }
        }
      });
      return normalized;
    });

    console.log('Mapped data sample:', normalizedData[0]);

    // Process data using the helper function to ensure proper region mapping
    const processedData = await applyRegionMapping(normalizedData);
    console.log('Processed data length:', processedData.length);
    console.log('Processed data sample:', processedData[0]);

    return processedData;

  } catch (error) {
    console.error('Error fetching AM Operations data:', error);
    return [];
  }
};

/**
 * Submit AM Operations Checklist data to Google Sheets
 */
export const submitAMOperationsChecklist = async (params: any): Promise<{ success: boolean; message: string }> => {
  try {
    // Convert to URL-encoded format
    const body = Object.keys(params).map(k =>
      encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
    ).join('&');

    const response = await fetch(AM_OPS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      mode: 'no-cors',
    });

    // In no-cors mode, we can't see the response, so we assume success if no error is thrown
    return { success: true, message: 'Checklist submitted successfully' };
  } catch (error) {
    console.error('Error submitting AM Operations checklist:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
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

// Helper function to check if value is NA (Not Applicable)
function isNA(v: any): boolean {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  if (s === 'na' || s === 'n/a' || s === 'not applicable' || s === 'n.a.' || s === 'n a') return true;
  if (/^n\s*\/?\s*a$/.test(s)) return true;
  if (/not\s+applicab/.test(s)) return true;
  return false;
}

// Helper function to resolve submission value with fallbacks for TSA fields
function resolveSubmissionValue(submission: any, qId: string): any {
  if (!submission) return undefined;
  if (submission[qId] !== undefined) return submission[qId];

  // Handle TSA score legacy keys
  if (qId === 'TSA_Food_Score') return submission['TSA_Food_Score'] ?? submission['tsaFoodScore'] ?? submission['TSA_1'] ?? undefined;
  if (qId === 'TSA_Coffee_Score') return submission['TSA_Coffee_Score'] ?? submission['tsaCoffeeScore'] ?? submission['TSA_2'] ?? undefined;
  if (qId === 'TSA_CX_Score') return submission['TSA_CX_Score'] ?? submission['tsaCXScore'] ?? submission['TSA_3'] ?? undefined;

  return submission[qId];
}

// Recalculate scores from individual question responses
// This fixes incorrect stored scores due to previous calculation bugs
function recalculateTrainingScore(submission: any): { totalScore: string; maxScore: string; percentageScore: string } {
  let total = 0;
  let max = 0;

  for (const q of TRAINING_QUESTIONS) {
    const ans = resolveSubmissionValue(submission, q.id);
    
    // For TSA score fields, use the pre-calculated scores directly (0/5/10)
    if (q.id === 'TSA_Food_Score' || q.id === 'TSA_Coffee_Score' || q.id === 'TSA_CX_Score') {
      const tsaScore = parseFloat(String(ans || '0'));
      if (!isNaN(tsaScore) && tsaScore > 0) {
        total += tsaScore;
        max += 10; // Each TSA section has max of 10
      } else if (!isNA(ans)) {
        max += 10;
      }
      continue;
    }
    
    // Skip if marked as NA
    if (isNA(ans)) {
      continue;
    }

    // Calculate max score for this question
    let qMax = 0;
    if (q.choices && q.choices.length) {
      qMax = Math.max(...q.choices.map((c: any) => Number(c.score) || 0));
    } else if (q.type === 'input') {
      qMax = 10;
    } else {
      qMax = 1;
    }

    // Calculate actual score
    let numeric = 0;
    if (ans !== undefined && ans !== null && ans !== '') {
      if (q.choices && q.choices.length) {
        const found = q.choices.find((c: any) => String(c.label).toLowerCase() === String(ans).toLowerCase());
        if (found) numeric = Number(found.score) || 0;
      } else if (q.type === 'input') {
        const n = parseFloat(String(ans));
        numeric = isNaN(n) ? 0 : n;
      } else {
        const low = String(ans).toLowerCase();
        if (low === 'yes' || low === 'y' || low === 'true') numeric = 1;
        if (low === 'no' || low === 'n' || low === 'false') numeric = 0;
      }
    }

    total += numeric;
    max += qMax;
  }

  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  
  return {
    totalScore: total.toString(),
    maxScore: max.toString(),
    percentageScore: pct.toString()
  };
}

// Fetch Training Audit data
export const fetchTrainingData = async (): Promise<TrainingAuditSubmission[]> => {
  try {
    const data = await fetchWithRetry(
      TRAINING_AUDIT_ENDPOINT + '?action=getData',
      'Training'
    );

    if (data === null) {
      console.warn('⚠️ [Training] Fetch failed, using static data');
      return STATIC_TRAINING_DATA as TrainingAuditSubmission[];
    }

    if (!Array.isArray(data)) {
      console.error('❌ [Training] Data is not an array! Type:', typeof data, 'Value:', JSON.stringify(data).substring(0, 200));
      return STATIC_TRAINING_DATA as TrainingAuditSubmission[];
    }

    console.log(`✅ [Training] Processing ${data.length} records...`);

    // Load store mapping ONCE before processing all records (PERFORMANCE FIX)
    const mappingData = await loadStoreMapping();
    
    // PERFORMANCE: Build a Map index for O(1) store lookups instead of O(n) .find() per row
    const storeIdIndex = new Map<string, any>();
    const storeNameIndex = new Map<string, any>();
    mappingData.forEach(mapping => {
      const sid = mapping["Store ID"] || mapping.storeId;
      if (sid) storeIdIndex.set(sid.toString(), mapping);
      const sname = mapping["Store Name"] || mapping.storeName;
      if (sname) storeNameIndex.set(sname.toLowerCase(), mapping);
    });

    // PERFORMANCE: Merge region mapping + score recalculation into a single pass
    const processedData = data.map((row: any) => {
      let region = row.region || 'Unknown';
      let storeId = row.storeId;
      const trainerId = (row.trainerId || '').toLowerCase().trim();

      // CRITICAL FIX: Kailash (H2595) should ALWAYS be North region, never West
      if (trainerId === 'h2595' && region === 'West') {
        region = 'North';
      }

      // If region is Unknown or empty, try to map from store ID using indexed lookups
      if (!region || region === 'Unknown') {
        if (storeId) {
          let storeMapping = storeIdIndex.get(storeId.toString());

          // If not found and storeId is numeric, try with S prefix
          if (!storeMapping && !isNaN(storeId) && !storeId.toString().startsWith('S')) {
            const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
            storeMapping = storeIdIndex.get(sFormattedId);
          }

          // If still not found, try to match by store name
          if (!storeMapping && row.storeName) {
            storeMapping = storeNameIndex.get(row.storeName.toLowerCase());
          }

          if (storeMapping && (storeMapping["Region"] || storeMapping.region)) {
            region = storeMapping["Region"] || storeMapping.region;
          }
        }
      }

      // Extract and map TSA scores
      const tsaFoodScore = row.tsaFoodScore || row['tsaFoodScore'] || row.TSA_Food_Score || row['TSA_Food_Score'] || row.TSA_TSA_2 || row['TSA_TSA_2'] || '';
      const tsaCoffeeScore = row.tsaCoffeeScore || row['tsaCoffeeScore'] || row.TSA_Coffee_Score || row['TSA_Coffee_Score'] || row.TSA_TSA_1 || row['TSA_TSA_1'] || '';
      const tsaCXScore = row.tsaCXScore || row['tsaCXScore'] || row.TSA_CX_Score || row['TSA_CX_Score'] || row.TSA_TSA_3 || row['TSA_TSA_3'] || '';

      // Inline score recalculation (previously was a second .map() pass)
      const rowWithTSA = { ...row, region, tsaCoffeeScore, tsaFoodScore, tsaCXScore };
      const recalculated = recalculateTrainingScore(rowWithTSA);

      return {
        ...rowWithTSA,
        totalScore: recalculated.totalScore,
        maxScore: recalculated.maxScore,
        percentageScore: recalculated.percentageScore
      };
    });

    console.log(`✅ [Training] Done! Returning ${processedData.length} processed records`);
    return processedData as TrainingAuditSubmission[];

  } catch (error) {
    console.error('❌ [Training] Outer catch - unexpected error:', error);
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
    const data = await fetchWithRetry(
      QA_ENDPOINT + '?action=getData',
      'QA'
    );

    if (!data || !Array.isArray(data)) {
      console.warn('⚠️ [QA] No valid data, returning empty');
      return [];
    }

    // Process data to ensure region mapping
    const mappingData = await loadStoreMapping();
    
    // PERFORMANCE: Build indexed lookup for O(1) store lookups
    const storeIdIndex = new Map<string, any>();
    mappingData.forEach(mapping => {
      const sid = mapping["Store ID"] || mapping.storeId;
      if (sid) storeIdIndex.set(sid.toString(), mapping);
    });

    const processedData = data.map((row: any) => {
      let region = row.region || 'Unknown';

      // Try to map region from store data if not already present
      if (region === 'Unknown' || !region) {
        const storeId = row.storeId || row.storeID;

        if (storeId) {
          let storeMapping = storeIdIndex.get(storeId.toString());

          // If not found with S prefix, try with S prefix
          if (!storeMapping && !storeId.toString().startsWith('S')) {
            const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
            storeMapping = storeIdIndex.get(sFormattedId);
          }

          if (storeMapping && (storeMapping["Region"] || storeMapping.region)) {
            region = storeMapping["Region"] || storeMapping.region;
          }
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
    let data = await fetchWithRetry(
      FINANCE_ENDPOINT + '?action=getData',
      'Finance'
    );

    if (data === null) {
      console.warn('⚠️ [Finance] Fetch failed, returning empty');
      return [];
    }

    // Extract data array from response object
    if (data && typeof data === 'object' && 'data' in data) {
      data = data.data;
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Transform headers from "Submission Time" format to camelCase
    const transformedData = data.map((row: any) => {
      const transformed: any = {};
      
      // Map common fields with spaces to camelCase
      transformed.submissionTime = row['Submission Time'] || row.submissionTime || '';
      transformed.financeName = row['Finance Auditor Name'] || row.financeName || '';
      transformed.financeId = row['Finance Auditor ID'] || row.financeId || '';
      transformed.amName = row['Area Manager Name'] || row.amName || '';
      transformed.amId = row['Area Manager ID'] || row.amId || '';
      transformed.storeName = row['Store Name'] || row.storeName || '';
      transformed.storeId = row['Store ID'] || row.storeId || '';
      transformed.region = row['Region'] || row.region || '';
      transformed.totalScore = row['Total Score'] || row.totalScore || '0';
      transformed.maxScore = row['Max Score'] || row.maxScore || '70';
      transformed.scorePercentage = row['Score Percentage'] || row.scorePercentage || '0';
      transformed.auditorSignature = row['Auditor Signature'] || row.auditorSignature || '';
      transformed.smSignature = row['SM Signature'] || row.smSignature || '';
      
      // Copy all other fields (questions, remarks, images)
      Object.keys(row).forEach(key => {
        if (!transformed[key]) {
          transformed[key] = row[key];
        }
      });
      
      return transformed;
    });

    // Process data to ensure region mapping AND complete AM/Store data from comprehensive mapping
    const mappingData = await loadStoreMapping();
    
    // PERFORMANCE: Build indexed lookup for O(1) store lookups
    const storeIdIndex = new Map<string, any>();
    mappingData.forEach(mapping => {
      const sid = mapping["Store ID"] || mapping.storeId;
      if (sid) storeIdIndex.set(sid.toString(), mapping);
    });

    const processedData = transformedData.map((row: any) => {
      let region = row.region || 'Unknown';
      let amName = row.amName || '';
      let amId = row.amId || '';
      let storeName = row.storeName || '';

      // Try to map complete store data from comprehensive mapping
      try {
        const storeId = row.storeId || row.storeID;

        if (storeId) {
          let storeMapping = storeIdIndex.get(storeId.toString());

          // If not found and store ID doesn't start with S, try with S prefix
          if (!storeMapping && !storeId.toString().startsWith('S')) {
            const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
            storeMapping = storeIdIndex.get(sFormattedId);
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
    const data = await fetchWithRetry(
      CAMPUS_HIRING_ENDPOINT + '?action=getData',
      'Campus Hiring'
    );

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

// Interface for Finance Historic Data
export interface FinanceHistoricData {
  storeId: string;
  auditDate: string;
  region: string;
  percentage: number;
}

// Fetch Finance Historic Data
export const fetchFinanceHistoricData = async (): Promise<FinanceHistoricData[]> => {
  try {
    // Return empty array if endpoint not configured
    if (!FINANCE_HISTORIC_ENDPOINT || FINANCE_HISTORIC_ENDPOINT === 'YOUR_HISTORIC_ENDPOINT_URL_HERE') {
      console.warn('Finance Historic endpoint not configured');
      return [];
    }

    const result = await fetchWithRetry(
      FINANCE_HISTORIC_ENDPOINT + '?action=getHistoricData',
      'Finance Historic'
    );

    const data = result?.data || [];
    if (!Array.isArray(data)) return [];
    return data;

  } catch (error) {
    console.error('Error fetching finance historic data:', error);
    return [];
  }
};

// Fetch Finance Historic Data for a specific store
export const fetchFinanceHistoricDataForStore = async (storeId: string): Promise<FinanceHistoricData[]> => {
  try {
    // Return empty array if endpoint not configured
    if (!FINANCE_HISTORIC_ENDPOINT || FINANCE_HISTORIC_ENDPOINT === 'YOUR_HISTORIC_ENDPOINT_URL_HERE') {
      console.warn('Finance Historic endpoint not configured');
      return [];
    }

    const result = await fetchWithRetry(
      `${FINANCE_HISTORIC_ENDPOINT}?action=getHistoricDataForStore&storeId=${encodeURIComponent(storeId)}`,
      `Finance Historic (${storeId})`
    );

    const data = result?.data || [];
    if (!Array.isArray(data)) return [];
    return data;

  } catch (error) {
    console.error('Error fetching finance historic data for store:', error);
    return [];
  }
};