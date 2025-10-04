// Updated stores from comprehensive TWC mapping data

// Fallback stores for when mapping data is not available
const FALLBACK_STORES = [
  { name: 'Defence Colony', id: 'S027', region: 'North' },
  { name: 'Khan Market', id: 'S037', region: 'North' },
  { name: 'Connaught Place', id: 'S049', region: 'North' },
  { name: 'Kalkaji', id: 'S055', region: 'North' },
  { name: 'TWC-Koramangala', id: 'S001', region: 'South' },
  { name: 'TWC-CMH Indira Nagar', id: 'S002', region: 'South' },
  { name: 'Mahavir Nagar', id: 'S096', region: 'West' },
  { name: 'Emerald Borivali', id: 'S076', region: 'West' }
];

// Create stores array from the comprehensive TWC mapping data
const createStoresFromMapping = async () => {
  try {
    // Try to load from the comprehensive mapping file first
    const base = (import.meta as any).env?.BASE_URL || '/';
    let response;
    let mappingData;

    try {
      response = await fetch(`${base}twc_store_mapping.json`);
      if (response.ok) {
        mappingData = await response.json();
        console.log('Loaded comprehensive TWC store mapping');
      } else {
        throw new Error('Comprehensive mapping not found');
      }
    } catch {
      // Fallback to hr_mapping.json
      response = await fetch(`${base}hr_mapping.json`);
      mappingData = await response.json();
      console.log('Loaded fallback HR mapping');
    }
    
    const storeMap = new Map();
    
    mappingData.forEach((item: any) => {
      const storeId = item['Store ID'] || item.storeId;
      const storeName = item['Store Name'] || item.locationName;
      const region = item['Region'] || item.region;
      
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          name: storeName,
          id: storeId,
          region: region,
          amId: item['Area Manager ID'] || item.amId,
          hrbpId: item['HRBP ID'] || item.hrbpId,
          regionalHrId: item['Regional HR ID'] || item.regionalHrId,
          hrHeadId: item['HR Head ID'] || item.hrHeadId,
          lmsHeadId: item['LMS Head ID'] || item.lmsHeadId,
          trainer: item['Trainer'] || item.trainer,
          trainerId: item['Trainer ID'] || item.trainerId
        });
      }
    });
    
    return Array.from(storeMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('Could not load mapping data, using fallback stores:', error);
    return FALLBACK_STORES;
  }
};

// Initialize with fallback stores
let MAPPED_STORES = FALLBACK_STORES;

// Load mapping data and update stores
createStoresFromMapping().then(stores => {
  MAPPED_STORES = stores;
  console.log(`Loaded ${stores.length} stores from mapping data`);
}).catch(() => {
  console.warn('Using fallback stores');
});

export { MAPPED_STORES };