# AM Operations Checklist - Comprehensive Store Mapping Integration

## Problem
The AM Operations checklist was using the old `hr_mapping.json` file for populating dropdowns and auto-filling fields, while the Training Audit checklist was correctly using `comprehensive_store_mapping.json`. This caused:

1. **Wrong Region Mapping** - Incorrect regions being assigned to stores
2. **Wrong Trainer Mapping** - Trainers not matching the stores
3. **Wrong AM Mapping** - Area Managers not correctly associated with stores
4. **Manual Field Entry** - Café Type (Menu), Store Type, and Concept had to be manually selected instead of auto-populating

## Solution
Updated `components/checklists/OperationsChecklist.tsx` to use `comprehensive_store_mapping.json` as the **ULTIMATE SOURCE OF TRUTH**, exactly like TrainingChecklist.tsx does.

## Changes Made

### 1. Import Change
```typescript
// OLD
import hrMappingData from '../../src/hr_mapping.json';

// NEW  
import compStoreMapping from '../../src/comprehensive_store_mapping.json';
```

### 2. Added Trainer Name Overrides
```typescript
const trainerNameOverrides: Record<string, string> = {
  H1761: 'Mahadev',
  H701: 'Mallika',
  H1697: 'Sheldon',
  H2595: 'Kailash',
  H3595: 'Bhawna',
  H3252: 'Priyanka',
  H1278: 'Viraj',
  H3247: 'Sunil'
};
```

### 3. Built Unique Lists from Comprehensive Mapping

**Trainers:**
```typescript
const uniqueTrainers = useMemo(() => {
  const ids = Array.from(new Set((compStoreMapping as any[]).map((r: any) => r.Trainer).filter(Boolean)));
  const trainers = ids.map((id: string) => ({
    id,
    name: trainerNameOverrides[id] || id
  }));
  return trainers.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
}, []);
```

**Stores:**
```typescript
const uniqueStores = useMemo(() => {
  const stores = (compStoreMapping as any[]).map((row: any) => ({
    name: row['Store Name'],
    id: row['Store ID'],
    menu: row['Menu'],           // Café Type
    storeType: row['Store Type'], // Store Type
    concept: row['Concept']       // Concept
  }));
  return stores
    .filter(store => store.name && store.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}, []);
```

### 4. Auto-populate Café Type, Store Type, and Concept

Added useEffect to auto-fill when store is selected:
```typescript
useEffect(() => {
  if (metadata.storeId) {
    const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();
    const storeIdNorm = normalizeId(metadata.storeId);
    
    const storeData = (compStoreMapping as any[]).find((row: any) => 
      normalizeId(row['Store ID']) === storeIdNorm
    );
    
    if (storeData) {
      setMetadata(prev => ({
        ...prev,
        cafeType: storeData['Menu'] || prev.cafeType,
        storeType: storeData['Store Type'] || prev.storeType,
        concept: storeData['Concept'] || prev.concept
      }));
    }
  }
}, [metadata.storeId]);
```

### 5. Updated All Filtering Functions

**Area Managers (filtered by Trainer):**
```typescript
const filteredAM = AREA_MANAGERS.filter(am => {
  const matchesSearch = amSearchTerm === '' || 
    (am.name as string).toLowerCase().includes(amSearchTerm.toLowerCase());

  if (!metadata.trainerId) return matchesSearch;

  const trainerIdNorm = normalizeId(metadata.trainerId);
  const amsForTrainer = Array.from(new Set((compStoreMapping as any[])
    .filter((r: any) => normalizeId(r.Trainer) === trainerIdNorm)
    .map((r: any) => normalizeId(r.AM))
    .filter(Boolean)));
  return matchesSearch && amsForTrainer.includes(normalizeId(am.id));
});
```

**Trainers (all from comprehensive mapping):**
```typescript
const filteredTrainers = () => {
  return uniqueTrainers.filter(trainer => 
    trainerSearchTerm === '' || 
    (trainer.name as string).toLowerCase().includes(trainerSearchTerm.toLowerCase())
  );
};
```

**Stores (filtered by AM):**
```typescript
const getStoresForAM = () => {
  return uniqueStores.filter(store => {
    const matchesSearch = storeSearchTerm === '' || 
      (store.name as string).toLowerCase().includes(storeSearchTerm.toLowerCase());

    if (!metadata.amId) return matchesSearch;

    const amIdNorm = normalizeId(metadata.amId);
    const storesForAM = Array.from(new Set((compStoreMapping as any[])
      .filter((r: any) => normalizeId(r.AM) === amIdNorm)
      .map((r: any) => normalizeId(r['Store ID']))
      .filter(Boolean)));
    return matchesSearch && storesForAM.includes(normalizeId(store.id));
  });
};
```

**HR Personnel (filtered by AM):**
```typescript
const filteredHR = HR_PERSONNEL.filter(hr => {
  const matchesSearch = hr.name.toLowerCase().includes(hrSearchTerm.toLowerCase());
  
  if (!metadata.amId) return matchesSearch;
  
  const amIdNorm = normalizeId(metadata.amId);
  const hrbpsForAM = Array.from(new Set((compStoreMapping as any[])
    .filter((r: any) => normalizeId(r.AM) === amIdNorm)
    .map((r: any) => normalizeId(r.HRBP))
    .filter(Boolean)));
  return matchesSearch && hrbpsForAM.includes(normalizeId(hr.id));
});
```

### 6. Updated Store Selection Handler

Now auto-populates Café Type, Store Type, and Concept on store selection:
```typescript
onClick={() => {
  setMetadata(prev => ({ 
    ...prev, 
    storeName: store.name, 
    storeId: store.id,
    cafeType: store.menu || prev.cafeType,           // Auto-fill from comprehensive mapping
    storeType: store.storeType || prev.storeType,    // Auto-fill from comprehensive mapping
    concept: store.concept || prev.concept            // Auto-fill from comprehensive mapping
  }));
  setStoreSearchTerm(store.name);
  setShowStoreDropdown(false);
}}
```

### 7. Updated Region Detection in Submit Function

Changed from hr_mapping.json to comprehensive_store_mapping.json:
```typescript
// Detect region from comprehensive store mapping - ULTIMATE SOURCE OF TRUTH
let detectedRegion = '';
try {
  if (metadata.storeId) {
    const storeIdNorm = normalizeId(metadata.storeId);
    
    const storeMapping = (compStoreMapping as any[]).find((row: any) => 
      normalizeId(row['Store ID']) === storeIdNorm
    );
    
    if (storeMapping) {
      detectedRegion = storeMapping['Region'] || '';
      console.log(`✅ Store mapped from comprehensive_store_mapping.json: ${metadata.storeId} (${metadata.storeName}) → Region: ${detectedRegion}`);
    }
  }
} catch (error) {
  console.warn('Could not load comprehensive store mapping for region detection:', error);
}
```

## Updated Google Apps Script

Created `AM_Operations_google-apps-script-UPDATED.js` with:
- Store mapping auto-population from comprehensive_store_mapping.json
- 30-minute caching
- Fallback to minimal store data if GitHub URLs fail
- Auto-population of:
  - Region
  - AM Name & ID
  - Trainer Name & ID
  - HRBP ID, Regional HR ID, HR Head ID, LMS Head ID
  - Regional Training Manager
- Support for `?action=getStoreInfo&storeId=S001` endpoint

## Updated Endpoint URL

Updated in `services/dataService.ts`:
```typescript
const AM_OPS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxM2vdeIN26pcOl09xf-0CtKVHA5H2uqBgYEiJsFY0SDnYsPJDoqTHMw1XXx8pbKK4iEw/exec';
```

## Result

Now the AM Operations checklist:
✅ Uses **comprehensive_store_mapping.json** as the ULTIMATE source of truth
✅ Auto-populates **Café Type (Menu)** from Store ID
✅ Auto-populates **Store Type** from Store ID  
✅ Auto-populates **Concept** from Store ID
✅ Correctly maps **Regions** from comprehensive mapping
✅ Correctly maps **Trainers** from comprehensive mapping
✅ Correctly maps **Area Managers** from comprehensive mapping
✅ Matches the behavior of **Training Audit Checklist** exactly

## Files Modified

1. `components/checklists/OperationsChecklist.tsx` - Complete rewrite of filtering and auto-population logic
2. `services/dataService.ts` - Updated AM_OPS_ENDPOINT URL
3. `AM_Operations_google-apps-script-UPDATED.js` - New Google Apps Script with comprehensive mapping support

## Testing

To verify the fix works:
1. Open AM Operations Checklist
2. Select a Trainer - should filter AMs correctly
3. Select an AM - should filter Stores and HR correctly
4. Select a Store - should auto-populate:
   - Café Type (Menu)
   - Store Type
   - Concept
   - Region (on submission)
5. Submit - should log correct region from comprehensive_store_mapping.json

All dropdown filters now cascade correctly:
**Trainer → AM → Stores**

All auto-population now uses **comprehensive_store_mapping.json** as the single source of truth! 🎯
