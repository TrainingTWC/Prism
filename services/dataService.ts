import { Submission } from '../types';
import { QUESTIONS, AREA_MANAGERS, STORES, HR_PERSONNEL } from '../constants';
import { generateTrainingTestData } from '../utils/trainingTestData';
import { STATIC_TRAINING_DATA } from './staticTrainingData';

// Google Apps Script endpoint for fetching data
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxW541QsQc98NKMVh-lnNBnINskIqD10CnQHvGsW_R2SLASGSdBDN9lTGj1gznlNbHORQ/exec';

// AM Operations endpoint
const AM_OPS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzvAf3C-ChJTiIR0HKXhacf3rj3kO-6MshlRGkr-tm4AiLp7nAUkDVb2qVOqnPayDlsFA/exec';

// Training Audit endpoint
const TRAINING_AUDIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxmF8RE5ySmSEvFpv_vJnYC2mWvBE-EkhsVRjg6TI3wENv3_JexJff4LcGwrlT0UPfWVw/exec';

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
    
    // Try comprehensive mapping first
    try {
      response = await fetch(`${base}twc_store_mapping.json`);
      if (response.ok) {
        storeMappingCache = await response.json();
        console.log('Comprehensive TWC store mapping loaded successfully:', storeMappingCache.length, 'entries');
        return storeMappingCache;
      } else {
        throw new Error('Comprehensive mapping not found');
      }
    } catch {
      // Fallback to hr_mapping.json
      response = await fetch(`${base}hr_mapping.json`);
      storeMappingCache = await response.json();
      console.log('Fallback HR mapping loaded successfully:', storeMappingCache.length, 'entries');
      return storeMappingCache;
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
          amId = storeMapping.areaManagerId;
          const amPerson = AREA_MANAGERS.find(am => am.id === amId);
          amName = amPerson?.name || `AM ${amId}`;
          
          // Get HR (Priority: HRBP > Regional HR > HR Head)
          hrId = storeMapping.hrbpId || storeMapping.regionalHrId || storeMapping.hrHeadId;
          const hrPerson = HR_PERSONNEL.find(hr => hr.id === hrId);
          hrName = hrPerson?.name || `HR ${hrId}`;
          
          // Get Region from mapping
          region = storeMapping['Region'] || storeMapping.region || 'Unknown';
          
          console.log(`Mapped store ${storeId} to AM: ${amName} (${amId}), HR: ${hrName} (${hrId}), Region: ${region}`);
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
        console.log('No real data available, returning empty array');
        return [];
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
  totalScore: string;
  maxScore: string;
  percentageScore: string;
  // All section responses
  [key: string]: string; // For dynamic question keys like CG_1, OTA_1, etc.
}

// Fetch AM Operations data
export const fetchAMOperationsData = async (): Promise<AMOperationsSubmission[]> => {
  try {
    console.log('Fetching AM Operations data from Google Sheets...');
    
    let response;
    let data;
    
    try {
      console.log('Trying direct request to AM Operations Google Apps Script...');
      const directUrl = AM_OPS_ENDPOINT + '?action=getData';
      
      response = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });
      
      if (response.ok) {
        data = await response.json();
        console.log('Direct request successful, AM Operations data received:', data);
      } else {
        throw new Error(`Direct request failed: ${response.status}`);
      }
    } catch (directError) {
      console.log('Direct request failed for AM Operations, trying CORS proxy...', directError);
      
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
        console.error('CORS proxy response was not OK for AM Operations:', response.status, response.statusText, errorText);
        console.log('No AM Operations data available, returning empty array');
        return [];
      }

      data = await response.json();
      console.log('CORS proxy request successful for AM Operations, data received:', data);
    }
    
    if (!Array.isArray(data)) {
      console.error('AM Operations data from Google Sheets is not an array:', data);
      return [];
    }
    
    // Process data to ensure proper region mapping
    const processedData = await Promise.all(data.map(async (row: any) => {
      let region = row.region || 'Unknown';
      let storeId = row.storeId;
      
      // If region is Unknown or empty, try to map from store ID
      if (!region || region === 'Unknown') {
        try {
          if (storeId) {
            const mappingData = await loadStoreMapping();
            
            // Try to find by exact store ID match first
            let storeMapping = mappingData.find(mapping => mapping['Store ID'] === storeId.toString() || mapping.storeId === storeId.toString());
            
            // If not found and storeId is numeric, try to find by store name or alternate mapping
            if (!storeMapping && !isNaN(storeId)) {
              // For numeric store IDs, try to match by store name if available
              if (row.storeName) {
                storeMapping = mappingData.find(mapping => 
                  (mapping['Store Name'] && mapping['Store Name'].toLowerCase().includes(row.storeName.toLowerCase())) ||
                  (mapping.locationName && mapping.locationName.toLowerCase().includes(row.storeName.toLowerCase())) ||
                  (mapping['Store Name'] && row.storeName.toLowerCase().includes(mapping['Store Name'].toLowerCase())) ||
                  (mapping.locationName && row.storeName.toLowerCase().includes(mapping.locationName.toLowerCase()))
                );
              }
            // If still not found with S prefix, try with S prefix
            if (!storeMapping && !storeId.toString().startsWith('S')) {
              const sFormattedId = `S${storeId.toString().padStart(3, '0')}`;
              storeMapping = mappingData.find(mapping => mapping['Store ID'] === sFormattedId || mapping.storeId === sFormattedId);
            }
            if (storeMapping && (storeMapping['Region'] || storeMapping.region)) {
              region = storeMapping['Region'] || storeMapping.region;
              console.log(`✅ Mapped store ${storeId} (${row.storeName}) to region: ${region}`);
            } else {
              console.warn(`❌ Could not find region mapping for store ${storeId} (${row.storeName})`);
            }
              console.warn(`❌ Could not find region mapping for store ${storeId} (${row.storeName})`);
            }
          }
        } catch (error) {
          console.warn(`Could not map region for store ${row.storeId}:`, error);
        }
      }
      
      return {
        ...row,
        region: region
      };
    }));
    
    console.log('AM Operations submissions processed with regions:', processedData);
    return processedData as AMOperationsSubmission[];
    
  } catch (error) {
    console.error('Error fetching AM Operations data from Google Sheets:', error);
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
      
      // If region is Unknown or empty, try to map from store ID
      if (!region || region === 'Unknown') {
        try {
          if (storeId) {
            const mappingData = await loadStoreMapping();
            
            // Try to find by exact store ID match first
            let storeMapping = mappingData.find(mapping => mapping["Store ID"] || mapping.storeId === storeId.toString());
            
            // If not found and storeId is numeric, try to find by store name or alternate mapping
            if (!storeMapping && !isNaN(storeId)) {
              // For numeric store IDs, try to match by store name if available
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
              console.log(`✅ Mapped store ${storeId} (${row.storeName}) to region: ${region}`);
            } else {
              console.warn(`❌ Could not find region mapping for store ${storeId} (${row.storeName})`);
            }
          }
        } catch (error) {
          console.warn(`Could not map region for store ${row.storeId}:`, error);
        }
      }
      
      // Extract and map TSA scores from TSA_TSA_1, TSA_TSA_2, TSA_TSA_3
      // Based on the training audit questions:
      // TSA_TSA_1: Hot & Cold stations work (coffee-related)
      // TSA_TSA_2: Food station cleanliness (food-related)  
      // TSA_TSA_3: Customer Service quality (CX-related)
      const tsaCoffeeScore = row['TSA_TSA_1'] || row.TSA_TSA_1 || '';
      const tsaFoodScore = row['TSA_TSA_2'] || row.TSA_TSA_2 || '';
      const tsaCXScore = row['TSA_TSA_3'] || row.TSA_TSA_3 || '';
      
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
