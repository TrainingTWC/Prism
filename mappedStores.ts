// Updated stores from comprehensive TWC mapping data

// Fallback stores for when mapping data is not available
// Apply North → H3728 override to fallback as well
const FALLBACK_STORES = [
  { name: 'Defence Colony', id: 'S027', region: 'North', hrbpId: 'H3728', amId: 'H1766' },
  { name: 'Khan Market', id: 'S037', region: 'North', hrbpId: 'H3728', amId: 'H1766' },
  { name: 'Connaught Place', id: 'S049', region: 'North', hrbpId: 'H3728', amId: 'H1766' },
  { name: 'Kalkaji', id: 'S055', region: 'North', hrbpId: 'H3728', amId: 'H1766' },
  { name: 'TWC-Koramangala', id: 'S001', region: 'South', hrbpId: 'H2761', amId: 'H1355' },
  { name: 'TWC-CMH Indira Nagar', id: 'S002', region: 'South', hrbpId: 'H1972', amId: 'H546' },
  { name: 'Mahavir Nagar', id: 'S096', region: 'West', hrbpId: 'H3603', amId: 'H1575' },
  { name: 'Emerald Borivali', id: 'S076', region: 'West', hrbpId: 'H3603', amId: 'H1575' }
];

// Create stores array from the comprehensive TWC mapping data
const createStoresFromMapping = async () => {
  try {
    // Use comprehensive_store_mapping.json as the ULTIMATE source of truth
    const base = (import.meta as any).env?.BASE_URL || '/';
    let response;
    let mappingData;

    try {
      console.log('🔍 Loading comprehensive_store_mapping.json as source of truth...');
      response = await fetch(`${base}comprehensive_store_mapping.json`);
      if (response.ok) {
        mappingData = await response.json();
        console.log('✅ Loaded comprehensive store mapping:', mappingData.length, 'entries');
      } else {
        throw new Error('Comprehensive mapping not found');
      }
    } catch (error1) {
      console.log('⚠️ comprehensive_store_mapping.json not found, trying fallback...');
      // Fallback to twc_store_mapping.json
      try {
        response = await fetch(`${base}twc_store_mapping.json`);
        if (response.ok) {
          mappingData = await response.json();
          console.log('✅ Loaded TWC store mapping (fallback)');
        } else {
          throw new Error('TWC mapping not found');
        }
      } catch (error2) {
        // Final fallback to hr_mapping.json
        console.log('⚠️ TWC mapping not found, using hr_mapping.json...');
        response = await fetch(`${base}hr_mapping.json`);
        mappingData = await response.json();
        console.log('✅ Loaded HR mapping (final fallback)');
      }
    }
    
    const storeMap = new Map();
    const amMap = new Map(); // Track unique Area Managers
    
    mappingData.forEach((item: any) => {
      const storeId = item['Store ID'] || item.storeId;
      const storeName = item['Store Name'] || item.locationName;
      const region = item['Region'] || item.region;
      const amId = item['AM'] || item['Area Manager ID'] || item.amId;
      
      if (!storeMap.has(storeId)) {
        // determine hrbpId from the mapping; override for North region to Siddhant (H3728)
        let derivedHrbp = item['HRBP'] || item['HRBP ID'] || item.hrbpId || null;
        try {
          // normalize region string and if North, give full North region to H3728 as requested
          if (typeof region === 'string' && region.trim().toLowerCase() === 'north') {
            derivedHrbp = 'H3728';
          }
        } catch (e) {
          // ignore and fall back to whatever derivedHrbp was
        }

        storeMap.set(storeId, {
          name: storeName,
          id: storeId,
          region: region,
          amId: amId,
          hrbpId: derivedHrbp,
          regionalHrId: item['Regional HR ID'] || item.regionalHrId,
          hrHeadId: item['HR Head'] || item['HR Head ID'] || item.hrHeadId,
          lmsHeadId: item['E-Learning Specialist'] || item['LMS Head ID'] || item.lmsHeadId,
          trainer: item['Trainer'] || item.trainer,
          trainerId: item['Trainer ID'] || item.trainerId,
          trainingHead: item['Training Head'] || item.trainingHead
        });
        
        // Track Area Manager for this store
        if (amId) {
          amMap.set(amId, {
            id: amId,
            stores: [...(amMap.get(amId)?.stores || []), storeId]
          });
        }
      }
    });
    
    console.log(`📊 Processed ${storeMap.size} stores from comprehensive mapping`);
    console.log(`👔 Found ${amMap.size} unique Area Managers`);
    
    return Array.from(storeMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('❌ Could not load mapping data, using fallback stores:', error);
    return FALLBACK_STORES;
  }
};

// Initialize with fallback stores
let MAPPED_STORES = FALLBACK_STORES;

// Load mapping data and update stores
// Create a promise that resolves when mapping data is loaded. Export it so
// consumers (like Survey) can wait for the normalized mapping which includes
// the runtime override (North -> H3728).
export const STORES_PROMISE = createStoresFromMapping()
  .then(stores => {
    MAPPED_STORES = stores;
    console.log(`Loaded ${stores.length} stores from mapping data`);
    return stores;
  })
  .catch((err) => {
    console.warn('Using fallback stores', err);
    MAPPED_STORES = FALLBACK_STORES;
    return FALLBACK_STORES;
  });

export { MAPPED_STORES };