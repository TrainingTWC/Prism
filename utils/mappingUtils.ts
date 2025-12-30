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
}

import { HR_PERSONNEL } from '../constants';

let comprehensiveMappingCache: ComprehensiveMapping[] | null = null;

const normalizeId = (value: any) => String(value || '').trim().toUpperCase();

/**
 * Load comprehensive store mapping - the ultimate source of truth
 */
export const loadComprehensiveMapping = async (): Promise<ComprehensiveMapping[]> => {
  if (comprehensiveMappingCache) {
    return comprehensiveMappingCache;
  }

  try {
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
  const hrPerson = HR_PERSONNEL.find(h => h.id === String(hrbpId).trim());
  const hrbpName = hrPerson ? `${hrPerson.name} (${hrbpId})` : String(hrbpId);

  return hrbpName;
};

