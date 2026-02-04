/**
 * Utility functions for loading and processing store mapping data.
 *
 * Store→AM mapping source of truth (for now): comprehensive_store_mapping.json
 */

export interface ComprehensiveMapping {
  'Store ID': string;
  'Store Name': string;
  'Region'?: string;
  'Menu'?: string;
  'Store Type'?: string;
  'Concept'?: string;
  'HRBP'?: string;
  'Trainer'?: string;
  'Trainer ID'?: string;
  'Trainer Name'?: string;
  'AM'?: string;
  'AM Name'?: string;
  'E-Learning Specialist'?: string;
  'Training Head'?: string;
  'HR Head'?: string;
  // Normalized properties added during load
  id?: string;
  name?: string;
  amId?: string;
  amName?: string;
  hrbpId?: string;
  region?: string;
}

import { HR_PERSONNEL } from '../constants';

let comprehensiveMappingCache: ComprehensiveMapping[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

const normalizeId = (value: any) => String(value || '').trim().toUpperCase();

/**
 * Load comprehensive store mapping - the ultimate source of truth
 * Now fetches from Google Apps Script endpoint for real-time data
 * Cache expires after 2 minutes to ensure new stores appear promptly
 */
export const loadComprehensiveMapping = async (): Promise<ComprehensiveMapping[]> => {
  // Check if cache is valid (exists and not expired)
  const now = Date.now();
  const cacheIsValid = comprehensiveMappingCache && (now - cacheTimestamp) < CACHE_DURATION;
  
  if (cacheIsValid) {
    console.log('✅ Using cached store mapping (expires in', Math.round((CACHE_DURATION - (now - cacheTimestamp)) / 1000), 'seconds)');
    return comprehensiveMappingCache!;
  }

  try {
    // First, try to load from Google Apps Script endpoint (single source of truth)
    const storeMappingUrl = import.meta.env.VITE_STORE_MAPPING_SCRIPT_URL;
    
    if (storeMappingUrl) {
      try {
        console.log('📡 Fetching fresh store mapping from Google Sheets endpoint...');
        const response = await fetch(`${storeMappingUrl}?action=getStoreMapping`);
        if (response.ok) {
          const result = await response.json();
          console.log('📦 Google Sheets API Response:', result);
          
          // Check if the API call was successful
          if (result.success === false) {
            console.error('❌ Google Sheets API error:', result.message);
            throw new Error(result.message);
          }
          
          // Handle the response format from Google Apps Script
          // The script returns { success: true, message: "...", data: [...] }
          const rows = result.data || result;
          const arr = Array.isArray(rows) ? rows : [];
          
          console.log('📊 Store data array length:', arr.length);
          if (arr.length > 0) {
            console.log('📝 Sample store data (RAW from Google Sheets):', arr[0]);
            console.log('📝 HRBP fields in raw data:', {
              'HRBP 1': arr[0]['HRBP 1'],
              'HRBP 2': arr[0]['HRBP 2'],
              'HRBP 3': arr[0]['HRBP 3'],
              'HRBP 1 ID': arr[0]['HRBP 1 ID'],
              'Regional HR': arr[0]['Regional HR'],
              'HR Head': arr[0]['HR Head']
            });
            comprehensiveMappingCache = arr.map((row: any) => {
              const storeId = normalizeId(row['Store ID'] || row.storeId || row.StoreID || row.store_id);
              const storeName = row['Store Name'] || row.storeName || row.locationName || row.name || '';
              const amId = normalizeId(row.AM || row['AM'] || row['AM ID'] || row['Area Manager ID'] || row.amId || row.areaManagerId);
              const amName = row['AM Name'] || row.amName || row.areaManagerName || '';
              const region = row['Region'] || row.region || '';

              // Normalize HRBP columns (Google Sheets returns 'HRBP 1', 'HRBP 2', 'HRBP 3')
              const hrbp1Id = normalizeId(row['HRBP 1 ID'] || row['HRBP 1'] || row.HRBP || '');
              const hrbp1Name = row['HRBP 1 Name'] || '';
              const hrbp2Id = normalizeId(row['HRBP 2 ID'] || row['HRBP 2'] || '');
              const hrbp2Name = row['HRBP 2 Name'] || '';
              const hrbp3Id = normalizeId(row['HRBP 3 ID'] || row['HRBP 3'] || '');
              const hrbp3Name = row['HRBP 3 Name'] || '';
              
              // Normalize Regional HR and HR Head
              const regionalHrId = normalizeId(row['Regional HR ID'] || row['Regional HR'] || '');
              const regionalHrName = row['Regional HR Name'] || '';
              const hrHeadId = normalizeId(row['HR Head ID'] || row['HR Head'] || '');
              const hrHeadName = row['HR Head Name'] || '';

              // Preserve all trainer columns (using exact Google Sheet column names: "Trainer 1 ID", etc.)
              const trainer1Id = normalizeId(row['Trainer 1 ID'] || row['Trainer 1'] || row.Trainer || row['Trainer ID'] || row.trainerId || '');
              const trainer1Name = row['Trainer 1 Name'] || row['Trainer Name'] || row.trainerName || '';
              const trainer2Id = normalizeId(row['Trainer 2 ID'] || row['Trainer 2'] || '');
              const trainer2Name = row['Trainer 2 Name'] || '';
              const trainer3Id = normalizeId(row['Trainer 3 ID'] || row['Trainer 3'] || '');
              const trainer3Name = row['Trainer 3 Name'] || '';

              return {
                ...row,
                // Normalized properties
                'Store ID': storeId,
                'Store Name': storeName,
                'Region': region,
                'AM': amId || row.AM || row['AM'],
                'AM Name': amName,
                // Also set camelCase versions for easier access
                id: storeId,
                name: storeName,
                region: region,
                amId: amId,
                amName: amName,
                // HRBP columns with both naming conventions
                'HRBP 1 ID': hrbp1Id,
                'HRBP 1 Name': hrbp1Name,
                'HRBP 2 ID': hrbp2Id,
                'HRBP 2 Name': hrbp2Name,
                'HRBP 3 ID': hrbp3Id,
                'HRBP 3 Name': hrbp3Name,
                'HRBP 1': hrbp1Id, // Also keep without "ID" suffix
                'HRBP 2': hrbp2Id,
                'HRBP 3': hrbp3Id,
                'HRBP': hrbp1Id, // Legacy compatibility
                hrbpId: hrbp1Id, // camelCase
                // Regional HR
                'Regional HR ID': regionalHrId,
                'Regional HR Name': regionalHrName,
                'Regional HR': regionalHrId,
                'HR Head ID': hrHeadId,
                'HR Head Name': hrHeadName,
                'HR Head': hrHeadId,
                // Preserve all trainer columns from Google Sheets (using exact column names)
                'Trainer 1 ID': trainer1Id || row['Trainer 1 ID'] || row['Trainer 1'],
                'Trainer 1 Name': trainer1Name,
                'Trainer 2 ID': trainer2Id || row['Trainer 2 ID'] || row['Trainer 2'],
                'Trainer 2 Name': trainer2Name,
                'Trainer 3 ID': trainer3Id || row['Trainer 3 ID'] || row['Trainer 3'],
                'Trainer 3 Name': trainer3Name,
                // Also preserve without "ID" suffix for backwards compatibility
                'Trainer 1': trainer1Id,
                'Trainer 2': trainer2Id,
                'Trainer 3': trainer3Id,
                // Legacy compatibility
                'Trainer': trainer1Id || row.Trainer,
                'Trainer ID': trainer1Id,
                'Trainer Name': trainer1Name,
              } as ComprehensiveMapping;
            });
            
            cacheTimestamp = Date.now(); // Update cache timestamp
            console.log('✅ Store mapping loaded from Google Sheets:', comprehensiveMappingCache!.length, 'stores');
            console.log('📋 Sample normalized store:', comprehensiveMappingCache![0]);
            return comprehensiveMappingCache!;
          } else {
            console.warn('⚠️ Google Sheets returned empty array');
          }
        }
      } catch (endpointError) {
        console.warn('⚠️ Could not load from Google Sheets endpoint, falling back to static file:', endpointError);
      }
    }

    // Fallback to static JSON files
    const base = (import.meta as any).env?.BASE_URL || '/';

    let response: Response;
    try {
      response = await fetch(`${base}comprehensive_store_mapping.json`);
      if (!response.ok) throw new Error('Comprehensive mapping not found');
    } catch {
      // Preserve historical fallbacks used elsewhere in the app
      try {
        response = await fetch(`${base}latest_store_mapping.json`);
        if (!response.ok) throw new Error('Latest mapping not found');
      } catch {
        try {
          response = await fetch(`${base}twc_store_mapping.json`);
          if (!response.ok) throw new Error('TWC mapping not found');
        } catch {
          response = await fetch(`${base}hr_mapping.json`);
        }
      }
    }

    const rows = await response.json();
    const arr = Array.isArray(rows) ? rows : [];

    // Normalize key fields used across the app.
    comprehensiveMappingCache = arr.map((row: any) => {
      const storeId = normalizeId(row['Store ID'] || row.storeId || row.StoreID || row.store_id);
      const storeName = row['Store Name'] || row.storeName || row.locationName || row.name || '';
      const amId = normalizeId(row.AM || row['AM'] || row['AM ID'] || row['Area Manager ID'] || row.amId || row.areaManagerId);
      const amName = row['AM Name'] || row.amName || row.areaManagerName;

      const trainerId = normalizeId(row['Trainer ID'] || row.trainerId || row.trainer_id || row.Trainer);
      const trainerName = row['Trainer Name'] || row.trainerName || row.trainer;

      return {
        ...row,
        'Store ID': storeId,
        'Store Name': storeName,
        'AM': amId || row.AM || row['AM'],
        'AM Name': amName,
        'Trainer': trainerId || row.Trainer || row['Trainer'],
        'Trainer ID': trainerId,
        'Trainer Name': trainerName,
      } as ComprehensiveMapping;
    });

    cacheTimestamp = Date.now(); // Update cache timestamp
    console.log('✅ Store mapping loaded from static mapping:', comprehensiveMappingCache!.length, 'stores');
    return comprehensiveMappingCache!;
  } catch (error) {
    console.error('❌ Failed to load store mapping:', error);
    return [];
  }
};

/**
 * Extract unique Area Managers from comprehensive mapping
 */
export const getAreaManagersFromMapping = async () => {
  const mapping = await loadComprehensiveMapping();
  
  // Import AM name mapping
  const { getAMName } = await import('./amNameMapping');
  
  // Create a map to track unique AMs with their store count
  const amMap = new Map<string, { id: string; name: string; storeCount: number; regions: Set<string> }>();
  
  mapping.forEach(store => {
    const amId = normalizeId((store as any).AM);
    if (amId && amId !== 'N/A') {
      if (!amMap.has(amId)) {
        const preferredName = (store as any)['AM Name'];
        amMap.set(amId, {
          id: amId,
          name: preferredName || getAMName(amId),
          storeCount: 0,
          regions: new Set()
        });
      }
      const am = amMap.get(amId)!;
      am.storeCount++;
      am.regions.add((store as any).Region || (store as any).region || 'Unknown');
    }
  });

  console.log(`👔 Found ${amMap.size} unique Area Managers in comprehensive mapping`);
  
  // Return array of AM objects sorted by store count
  return Array.from(amMap.entries())
    .sort((a, b) => b[1].storeCount - a[1].storeCount)
    .map(([id, data]) => ({
      id: data.id,
      name: data.name,
      storeCount: data.storeCount,
      regions: Array.from(data.regions)
    }));
};

/**
 * Get stores for a specific Area Manager
 */
export const getStoresForAM = async (amId: string) => {
  const mapping = await loadComprehensiveMapping();
  return mapping.filter(store => store.AM === amId);
};

/**
 * Get Area Manager for a specific store
 */
export const getAMForStore = async (storeId: string) => {
  const mapping = await loadComprehensiveMapping();
  const store = mapping.find(s => s['Store ID'] === storeId);
  return store ? store.AM : null;
};

/**
 * Get region for a specific store
 */
export const getRegionForStore = async (storeId: string) => {
  const mapping = await loadComprehensiveMapping();
  const store = mapping.find(s => s['Store ID'] === storeId);
  return store ? store.Region : null;
};

/**
 * Get all stores grouped by region
 */
export const getStoresByRegion = async () => {
  const mapping = await loadComprehensiveMapping();
  const byRegion: Record<string, ComprehensiveMapping[]> = {};
  
  mapping.forEach(store => {
    const region = store.Region || 'Unknown';
    if (!byRegion[region]) {
      byRegion[region] = [];
    }
    byRegion[region].push(store);
  });
  
  return byRegion;
};

/**
 * Validate store-AM relationship
 */
export const validateStoreAMMapping = async (storeId: string, amId: string): Promise<boolean> => {
  const mapping = await loadComprehensiveMapping();
  const store = mapping.find(s => s['Store ID'] === storeId);
  
  if (!store) {
    console.warn(`⚠️ Store ${storeId} not found in comprehensive mapping`);
    return false;
  }
  
  if (store.AM !== amId) {
    console.warn(`⚠️ Store ${storeId} is mapped to AM ${store.AM}, not ${amId}`);
    return false;
  }
  
  return true;
};

/**
 * Get HRBP for a specific Area Manager
 */
export const getHRBPForAM = async (amName: string): Promise<string | null> => {
  const mapping = await loadComprehensiveMapping();
  
  // Import AM name mapping to get AM ID from name
  const { getAMId } = await import('./amNameMapping');

  // Resolve AM ID from provided name (amName may be either an ID or a display name)
  const resolvedAMId = getAMId(amName) || amName;

  // Normalize
  const amIdToFind = String(resolvedAMId).trim();

  // Find stores for this AM by exact AM ID match
  const amStores = mapping.filter(store => store.AM && String(store.AM).trim() === amIdToFind);
  
  // If no exact match found, try a case-insensitive name match as a fallback
  if (amStores.length === 0) {
    const fallback = mapping.filter(store => {
      try {
        return store.AM && store.AM.toLowerCase().includes(String(amName || '').toLowerCase());
      } catch (e) {
        return false;
      }
    });
    if (fallback.length > 0) {
      amStores.push(...fallback);
    }
  }
  
  if (amStores.length === 0) {
    return null;
  }
  
  // Get the HRBP ID from the first store (they should all have the same HRBP for an AM)
  const hrbpId = amStores[0]?.HRBP;
  
  // Count unique HRBPs to check consistency
  const uniqueHRBPs = new Set(amStores.map(s => s.HRBP));
  if (uniqueHRBPs.size > 1) {
    console.warn(`⚠️ Multiple HRBPs found for AM ${amName}:`, Array.from(uniqueHRBPs));
  }

  // If no hrbpId found, return null
  if (!hrbpId || hrbpId === 'N/A' || hrbpId === '') return null;

  // Map HRBP ID to a human-readable name using HR_PERSONNEL
  // Case-insensitive comparison
  const hrPerson = HR_PERSONNEL.find(h => h.id.toLowerCase() === String(hrbpId).trim().toLowerCase());
  const hrbpName = hrPerson ? hrPerson.name : String(hrbpId);

  return hrbpName;
};

