/**
 * Utility functions for loading and processing comprehensive store mapping data
 * This ensures all components use the comprehensive_store_mapping.json as the source of truth
 */

export interface ComprehensiveMapping {
  'Store ID': string;
  'Store Name': string;
  'Region': string;
  'Menu': string;
  'Store Type': string;
  'Concept': string;
  'HRBP': string;
  'Trainer': string;
  'AM': string;
  'E-Learning Specialist': string;
  'Training Head': string;
  'HR Head': string;
}

let comprehensiveMappingCache: ComprehensiveMapping[] | null = null;

/**
 * Load comprehensive store mapping - the ultimate source of truth
 */
export const loadComprehensiveMapping = async (): Promise<ComprehensiveMapping[]> => {
  if (comprehensiveMappingCache) {
    return comprehensiveMappingCache;
  }

  try {
    const base = (import.meta as any).env?.BASE_URL || '/';
    console.log('🔍 Loading comprehensive_store_mapping.json...');
    
    const response = await fetch(`${base}comprehensive_store_mapping.json`);
    if (!response.ok) {
      throw new Error(`Failed to load: ${response.status}`);
    }

    comprehensiveMappingCache = await response.json();
    console.log('✅ Comprehensive mapping loaded:', comprehensiveMappingCache!.length, 'stores');
    
    return comprehensiveMappingCache!;
  } catch (error) {
    console.error('❌ Failed to load comprehensive mapping:', error);
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
    const amId = store.AM;
    if (amId && amId !== 'N/A' && amId !== '') {
      if (!amMap.has(amId)) {
        amMap.set(amId, {
          id: amId,
          name: getAMName(amId),
          storeCount: 0,
          regions: new Set()
        });
      }
      const am = amMap.get(amId)!;
      am.storeCount++;
      am.regions.add(store.Region);
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
