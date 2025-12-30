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

// Create stores array from the static comprehensive mapping files.
const createStoresFromMapping = async () => {
  try {
    const base = (import.meta as any).env?.BASE_URL || '/';
    let response: Response;
    try {
      response = await fetch(`${base}comprehensive_store_mapping.json`);
      if (!response.ok) throw new Error('Comprehensive mapping not found');
    } catch {
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

    const mappingData = await response.json();
    if (!Array.isArray(mappingData)) {
      throw new Error('Static mapping response is not an array');
    }
    console.log('✅ Loaded store mapping from static JSON:', mappingData.length, 'stores');
    
    const normalizeId = (value: any) => String(value || '').trim().toUpperCase();
    const storeMap = new Map<string, any>();
    const amMap = new Map<string, any>(); // Track unique Area Managers
    
    mappingData.forEach((item: any) => {
      const storeIdRaw = item['Store ID'] || item.storeId || item.StoreID || item.store_id;
      const storeId = normalizeId(storeIdRaw);
      const storeName = item['Store Name'] || item.storeName || item.locationName || item.name;
      const region = item['Region'] || item.Region || item.region;
      const amId = normalizeId(item['AM'] || item.AM || item['AM ID'] || item['Area Manager ID'] || item.amId || item.areaManagerId);
      
      if (!storeId) return;
      if (!storeMap.has(storeId)) {
        // determine hrbpId from the mapping; override for North region to Siddhant (H3728)
        let derivedHrbp = item['HRBP'] || item['HRBP ID'] || item.hrbpId || item.HRBP || null;
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
          trainer: item['Trainer Name'] || item['Trainer'] || item.trainerName || item.trainer,
          trainerId: normalizeId(item['Trainer ID'] || item.trainerId || item.trainer_id || item.Trainer),
          trainingHead: item['Training Head'] || item.trainingHead
        });
        
        // Track Area Manager for this store
        if (amId) {
          const prev = amMap.get(amId);
          amMap.set(amId, {
            id: amId,
            stores: [...(prev?.stores || []), storeId]
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