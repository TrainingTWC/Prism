import { Submission } from '../types';
import { QUESTIONS, AREA_MANAGERS, STORES, HR_PERSONNEL } from '../constants';
import { generateTrainingTestData } from '../utils/trainingTestData';
import { STATIC_TRAINING_DATA } from './staticTrainingData';
import { STATIC_AM_OPERATIONS_DATA } from './staticOperationsData';

// Google Apps Script endpoint for fetching data
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxW541QsQc98NKMVh-lnNBnINskIqD10CnQHvGsW_R2SLASGSdBDN9lTGj1gznlNbHORQ/exec';

// AM Operations endpoint - UPDATED URL
const AM_OPS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw_Q9JD-4ys1qElIM4-DYFwwOUzVmPs-LYsYmP9lWqsp3ExJr5tnt-RYEJxYTi5SEjJ6w/exec';

// Training Audit endpoint - UPDATED URL
const TRAINING_AUDIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzSibBicC4B5_naPxgrbNP4xSK49de2R02rI9wnAKG3QOJvuwYrUOYLiBg_9XNqAhS5ig/exec';

// QA Assessment endpoint
const QA_ENDPOINT = 'https://script.google.com/macros/s/AKfycbytHCowSWXzHY-Ej7NdkCnaObAFpTiSeT2cV1_63_yUUeHJTwMW9-ta_70XcLu--wUxog/exec';

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
        console.log('✅ Comprehensive store mapping loaded successfully:', storeMappingCache.length, 'entries');
        
        // Log region distribution from the mapping file
        const regionCount = storeMappingCache.reduce((acc: any, store: any) => {
          const region = store.Region || store.region || 'Unknown';
          acc[region] = (acc[region] || 0) + 1;
          return acc;
        }, {});
        console.log('Store mapping region distribution:', regionCount);
        
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
          console.log('⚠️ Fallback to latest store mapping loaded:', storeMappingCache.length, 'entries');
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
            console.log('⚠️ Final fallback TWC store mapping loaded:', storeMappingCache.length, 'entries');
            return storeMappingCache;
          } else {
            throw new Error('TWC mapping not found');
          }
        } catch {
          // Last resort: hr_mapping.json
          response = await fetch(`${base}hr_mapping.json`);
          storeMappingCache = await response.json();
          console.log('⚠️ Last resort HR mapping loaded:', storeMappingCache.length, 'entries');
          return storeMappingCache;
        }
      }
    }
  } catch (error) {
    console.warn('Could not load store mapping:', error);
    return [];
  }
};

// Get Area Manager data for HR based on mapping
const getAMForHR = async (hrId: string): Promise<{amId: string, amName: string} | null> => {
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
const getStoresForAM = async (amId: string): Promise<{storeId: string, storeName: string, region: string}[]> => {
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
    console.warn('Could not load hr_mapping.json for mock data, using fallback');
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
         (submission as any)[q.id] = `Colleague ${i+1}`;
      } else {
         (submission as any)[q.id] = `Suggestion or comment number ${i+1}. Lorem ipsum dolor sit amet.`;
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
    console.log('No data from Google Sheets to convert');
    return [];
  }

  console.log('Converting sheets data:', sheetsData);
  console.log('Sample row structure:', sheetsData[0]);

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
            console.log(`Question ${q.id}: "${response}" -> ${choice.score} points`);
          } else {
            console.log(`Question ${q.id}: No matching choice found for "${response}"`);
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

    console.log(`Final scores - Total: ${finalTotalScore}, Max: ${finalMaxScore}, Percent: ${finalPercent}%`);

    // Get proper mappings for the store
    let amId = row.amId || '';
    let amName = row.amName || '';
    let hrId = row.hrId || '';
    let hrName = row.hrName || '';
    let region = row.region || 'Unknown';
    
    if (row.storeID || row.storeId) {
      const storeId = row.storeID || row.storeId;
      try {
        const mappingData = await loadStoreMapping();
        const storeMapping = mappingData.find((mapping: any) => 
          mapping['Store ID'] === storeId || mapping.storeId === storeId
        );
        
        if (storeMapping) {
          // Get Area Manager
          amId = storeMapping['Area Manager ID'] || storeMapping.areaManagerId;
          const amPerson = AREA_MANAGERS.find(am => am.id === amId);
          amName = amPerson?.name || `AM ${amId}`;
          
          // Get HR (Priority: HRBP > Regional HR > HR Head)
          hrId = storeMapping['HRBP ID'] || storeMapping['Regional HR ID'] || storeMapping['HR Head ID'] || 
                 storeMapping.hrbpId || storeMapping.regionalHrId || storeMapping.hrHeadId;
          const hrPerson = HR_PERSONNEL.find(hr => hr.id === hrId);
          hrName = hrPerson?.name || `HR ${hrId}`;
          
          // Get Region from mapping
          region = storeMapping['Region'] || storeMapping.region || 'Unknown';
          
          console.log(`Successfully mapped store ${storeId}:`, {
            amId, amName, hrId, hrName, region,
            rawMapping: {
              amId: storeMapping['Area Manager ID'] || storeMapping.areaManagerId,
              region: storeMapping['Region'] || storeMapping.region
            }
          });
        } else {
          console.warn(`No mapping found for store ${storeId} in ${mappingData.length} mapping entries`);
        }
      } catch (error) {
        console.warn(`Could not map store ${storeId}:`, error);
      }
    }

    const submission: Submission = {
      submissionTime: row.submissionTime || new Date().toISOString(),
      hrName: hrName,
      hrId: hrId,
      amName: amName,
      amId: amId,
      empName: row.empName || '',
      empId: row.empId || '',
      storeName: row.storeName || '',
      storeID: row.storeID || row.storeId || '',
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
    console.log('Fetching data from Google Sheets...');
    
    // Try direct request first (works if CORS is properly configured)
    let response;
    let data;
    
    try {
      console.log('Trying direct request to Google Apps Script...');
      const directUrl = SHEETS_ENDPOINT + '?action=getData';
      
      response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });
      
      if (response.ok) {
        data = await response.json();
        console.log('Direct request successful, data received:', data);
      } else {
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      console.log('Direct request failed, trying CORS proxy...', directError);
      
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
        console.error('CORS proxy response was not OK:', response.status, response.statusText, errorText);
        console.log('No real data available, generating mock data for demo...');
        return await generateMockData(20);
      }

      data = await response.json();
      console.log('CORS proxy request successful, data received:', data);
    }
    
    // Check if the received data is an array, as expected
    if (!Array.isArray(data)) {
        console.error('Data from Google Sheets is not an array:', data);
        console.log('Invalid data format, generating mock data...');
        return await generateMockData(20);
    }
    
    const submissions = await convertSheetsDataToSubmissions(data);
    
    console.log('Converted submissions:', submissions);
    
    // If no real data available, generate mock data for demo purposes
    if (submissions.length === 0) {
      console.log('No real submissions found, generating mock data...');
      return await generateMockData(20);
    }
    
    return submissions;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    console.log('Failed to fetch data, generating mock data...');
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
  console.log('🗺️  Applying comprehensive store mapping to dataset...');
  const mappingData = await loadStoreMapping();
  console.log(`Loaded ${mappingData.length} store mapping entries for comprehensive mapping`);
  
  // Log first few mapping entries for debugging
  console.log('📋 Sample mapping entries:', mappingData.slice(0, 3).map(m => ({ 
    id: m['Store ID'], 
    name: m['Store Name'], 
    region: m['Region'],
    menu: m['Menu'],
    storeType: m['Store Type'],
    concept: m['Concept'],
    hrbp: m['HRBP'],
    trainer: m['Trainer'],
    am: m['AM']
  })));
  
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
    
    console.log(`📍 MAPPING STORE: ${storeId} (${row.storeName || row['Store Name'] || 'No name'}) - Original region: ${row.region || 'None'}`);
    
    // ALWAYS map ALL fields from the comprehensive mapping file based on Store ID
    if (storeId) {
      try {
        // Log what we're searching for
        console.log(`🔍 Searching for Store ID: "${storeId}" (type: ${typeof storeId})`);
        
        // Try to find by exact store ID match first
        let storeMapping = mappingData.find(mapping => {
          const mappingStoreId = mapping['Store ID'] || mapping.storeId;
          const match = mappingStoreId === storeId.toString();
          if (mappingStoreId === storeId.toString()) {
            console.log(`✅ EXACT MATCH FOUND: "${mappingStoreId}" === "${storeId}"`);
          }
          return match;
        });
        
        // If not found and storeId is numeric, try with S prefix
        if (!storeMapping && !isNaN(storeId) && !storeId.toString().startsWith('S')) {
          const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
          console.log(`🔍 Trying S-formatted ID: ${sFormattedId}`);
          storeMapping = mappingData.find(mapping => {
            const mappingStoreId = mapping['Store ID'] || mapping.storeId;
            return mappingStoreId === sFormattedId;
          });
        }
        
        // If still not found, try to match by store name if available
        if (!storeMapping && (row.storeName || row['Store Name'])) {
          const submissionStoreName = row.storeName || row['Store Name'];
          console.log(`🔍 Trying store name match for: "${submissionStoreName}"`);
          storeMapping = mappingData.find(mapping => {
            const mappingStoreName = mapping['Store Name'] || mapping.storeName || '';
            const nameMatch = mappingStoreName.toLowerCase().includes(submissionStoreName.toLowerCase()) ||
                   submissionStoreName.toLowerCase().includes(mappingStoreName.toLowerCase()) ||
                   mappingStoreName.toLowerCase() === submissionStoreName.toLowerCase();
            if (nameMatch) {
              console.log(`✅ NAME MATCH FOUND: "${mappingStoreName}" matches "${submissionStoreName}"`);
            }
            return nameMatch;
          });
        }
        
        if (storeMapping) {
          // Map all fields from comprehensive mapping
          region = storeMapping['Region'] || storeMapping.region || 'Unknown';
          menu = storeMapping['Menu'] || storeMapping.menu || '';
          storeType = storeMapping['Store Type'] || storeMapping.storeType || '';
          concept = storeMapping['Concept'] || storeMapping.concept || '';
          hrbp = storeMapping['HRBP'] || storeMapping.hrbp || '';
          trainer = storeMapping['Trainer'] || storeMapping.trainer || '';
          am = storeMapping['AM'] || storeMapping.am || '';
          regionalTrainingManager = storeMapping['Regional Training Manager'] || storeMapping.regionalTrainingManager || '';
          
          console.log(`✅ COMPREHENSIVE MAPPING: Store ${storeId}:`);
          console.log(`   Region: ${region}`);
          console.log(`   Menu: ${menu}`);
          console.log(`   Store Type: ${storeType}`);
          console.log(`   Concept: ${concept}`);
          console.log(`   HRBP: ${hrbp}`);
          console.log(`   Trainer: ${trainer}`);
          console.log(`   AM: ${am}`);
          console.log(`   Regional Training Manager: ${regionalTrainingManager}`);
        } else {
          console.warn(`❌ Could not find comprehensive mapping for store ${storeId}`);
          console.log(`   Available store IDs (first 10):`, mappingData.slice(0, 10).map(m => m['Store ID']));
        }
      } catch (error) {
        console.warn(`❌ Error mapping store details for ${storeId}:`, error);
      }
    } else {
      console.warn(`❌ No storeId found for submission. Row keys:`, Object.keys(row));
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
  
  // Debug: Log region distribution
  const regionCount = processedData.reduce((acc: any, item: any) => {
    acc[item.region] = (acc[item.region] || 0) + 1;
    return acc;
  }, {});
  console.log('📊 FINAL REGION DISTRIBUTION:', regionCount);
  
  // Debug: Log menu distribution
  const menuCount = processedData.reduce((acc: any, item: any) => {
    const menu = item.menu || 'Not Mapped';
    acc[menu] = (acc[menu] || 0) + 1;
    return acc;
  }, {});
  console.log('🍽️ MENU TYPE DISTRIBUTION:', menuCount);
  
  return processedData as AMOperationsSubmission[];
};

export const fetchAMOperationsData = async (): Promise<AMOperationsSubmission[]> => {
  try {
    console.log('=== STARTING AM OPERATIONS DATA FETCH ===');
    console.log('Fetching AM Operations data from Google Sheets...');
    
    let response;
    let data;
    
    try {
      console.log('Trying direct request to AM Operations Google Apps Script...');
      const directUrl = AM_OPS_ENDPOINT + '?action=getData';
      console.log('Direct URL:', directUrl);
      
      response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });
      
      console.log('Direct response status:', response.status, response.statusText);
      
      if (response.ok) {
        data = await response.json();
        console.log('✅ Direct request successful, AM Operations raw data received:');
        console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
        console.log('Data length:', data?.length);
        console.log('First 2 items:', data?.slice(0, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Direct request failed:', response.status, errorText);
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      console.log('❌ Direct request failed for AM Operations, trying CORS proxy...', directError);
      
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = AM_OPS_ENDPOINT + '?action=getData';

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
        console.error('❌ CORS proxy response was not OK for AM Operations:', response.status, response.statusText, errorText);
        console.log('🔄 Falling back to static AM Operations test data...');
        console.log('Static data sample:', STATIC_AM_OPERATIONS_DATA.slice(0, 2));
        
        // Apply region mapping to static data as well
        return await applyRegionMapping(STATIC_AM_OPERATIONS_DATA);
      }

      data = await response.json();
      console.log('✅ CORS proxy request successful for AM Operations, data received:', data);
    }
    
    if (!Array.isArray(data)) {
      console.error('❌ AM Operations data from Google Sheets is not an array:', data);
      console.log('🔄 Using static AM Operations test data as fallback...');
      console.log('Static data sample:', STATIC_AM_OPERATIONS_DATA.slice(0, 2));
      return await applyRegionMapping(STATIC_AM_OPERATIONS_DATA);
    }
    
    // Process data using the helper function to ensure proper region mapping
    const processedData = await applyRegionMapping(data);
    
    return processedData;
    
  } catch (error) {
    console.error('Error fetching AM Operations data from Google Sheets:', error);
    console.log('🔄 Using static AM Operations test data as fallback...');
    return await applyRegionMapping(STATIC_AM_OPERATIONS_DATA);
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
    console.log('Fetching Training Audit data from Google Sheets...');
    
    let response;
    let data;
    
    try {
      console.log('Trying direct request to Training Audit Google Apps Script...');
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
        console.log('Direct request successful, Training Audit data received:', data);
      } else {
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      console.log('Direct request failed for Training Audit, trying CORS proxy...', directError);
      
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
        console.error('CORS proxy response was not OK for Training Audit:', response.status, response.statusText, errorText);
        console.log('Using static training test data as fallback...');
        return STATIC_TRAINING_DATA as TrainingAuditSubmission[];
      }

      data = await response.json();
      console.log('CORS proxy request successful for Training Audit, data received:', data);
    }
    
    if (!Array.isArray(data)) {
      console.error('Training Audit data from Google Sheets is not an array:', data);
      console.log('Using static training test data as fallback...');
      return STATIC_TRAINING_DATA as TrainingAuditSubmission[];
    }
    
    // Process data to ensure proper region mapping and TSA score extraction
    const processedData = await Promise.all(data.map(async (row: any) => {
      let region = row.region || 'Unknown';
      let storeId = row.storeId;
      
      console.log(`Processing training store: ${storeId} (${row.storeName}) - Original region: ${region}`);
      
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
              console.log(`Trying S-formatted ID: ${sFormattedId}`);
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
              console.log(`Trying store name match for: ${row.storeName}`);
            }
            
            if (storeMapping && (storeMapping["Region"] || storeMapping.region)) {
              region = storeMapping["Region"] || storeMapping.region;
              console.log(`✅ Mapped training store ${storeId} (${row.storeName}) to region: ${region}`);
            } else {
              console.warn(`❌ Could not find region mapping for store ${storeId} (${row.storeName})`);
            }
          }
        } catch (error) {
          console.warn(`Could not map region for store ${row.storeId}:`, error);
        }
      }
      
      // Extract and map TSA scores - check multiple possible field names
      // The Google Apps Script returns: tsaFoodScore, tsaCoffeeScore, tsaCXScore (camelCase)
      // Also check legacy field names: TSA_TSA_1, TSA_TSA_2, TSA_TSA_3
      const tsaFoodScore = row.tsaFoodScore || row['tsaFoodScore'] || row.TSA_Food_Score || row['TSA_Food_Score'] || row.TSA_TSA_2 || row['TSA_TSA_2'] || '';
      const tsaCoffeeScore = row.tsaCoffeeScore || row['tsaCoffeeScore'] || row.TSA_Coffee_Score || row['TSA_Coffee_Score'] || row.TSA_TSA_1 || row['TSA_TSA_1'] || '';
      const tsaCXScore = row.tsaCXScore || row['tsaCXScore'] || row.TSA_CX_Score || row['TSA_CX_Score'] || row.TSA_TSA_3 || row['TSA_TSA_3'] || '';
      
      console.log(`TSA Scores for ${storeId}: Food=${tsaFoodScore}, Coffee=${tsaCoffeeScore}, CX=${tsaCXScore}`);
      
      return {
        ...row,
        region: region,
        tsaCoffeeScore: tsaCoffeeScore,
        tsaFoodScore: tsaFoodScore,
        tsaCXScore: tsaCXScore
      };
    }));
    
    console.log('Training Audit submissions processed with regions:', processedData);
    return processedData as TrainingAuditSubmission[];
    
  } catch (error) {
    console.error('Error fetching Training Audit data from Google Sheets:', error);
    console.log('Using static training test data as fallback...');
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
    console.log('Fetching QA Assessment data from Google Sheets...');
    
    let response;
    let data;
    
    try {
      console.log('Trying direct request to QA Google Apps Script...');
      const directUrl = QA_ENDPOINT + '?action=getData';
      
      response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });
      
      if (response.ok) {
        data = await response.json();
        console.log('Direct request successful, QA data received:', data.length, 'submissions');
        console.log('Sample QA submission from Google Sheets:', data[0]);
        if (data[0]) {
          console.log('Google Sheets QA field names:', Object.keys(data[0]));
        }
      } else {
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      console.log('Direct request failed for QA, trying CORS proxy...', directError);
      
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
        console.log('CORS proxy request successful, QA data received:', data.length, 'submissions');
        console.log('Sample QA submission from Google Sheets (via proxy):', data[0]);
        if (data[0]) {
          console.log('Google Sheets QA field names (via proxy):', Object.keys(data[0]));
        }
      } else {
        throw new Error(`CORS proxy request failed: ${response.status}`);
      }
    }
    
    if (!data || !Array.isArray(data)) {
      console.warn('QA data is not in expected format:', data);
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
              console.log(`✅ Mapped QA store ${storeId} (${row.storeName}) to region: ${region}`);
            } else {
              console.warn(`❌ Could not find region mapping for QA store ${storeId} (${row.storeName})`);
            }
          }
        } catch (error) {
          console.warn(`Could not map region for QA store ${row.storeId}:`, error);
        }
      }
      
      return {
        ...row,
        region: region
      };
    });
    
    console.log('QA submissions processed with regions:', processedData.length);
    return processedData as QASubmission[];
    
  } catch (error) {
    console.error('Error fetching QA data from Google Sheets:', error);
    console.log('Returning static QA test data as fallback...');
    
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
