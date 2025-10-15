// Role-based access mapping for HR Connect Dashboard
import { HR_PERSONNEL } from './constants';

export interface UserRole {
  userId: string;
  name: string;
  role: 'admin' | 'area_manager' | 'hrbp' | 'regional_hr' | 'hr_head' | 'lms_head' | 'trainer';
  allowedStores: string[]; // Store IDs they can access
  allowedAMs: string[]; // Area Manager IDs they can see
  allowedHRs: string[]; // HR Personnel IDs they can see
  region?: string; // If restricted to specific region
}

// Load mapping data dynamically
const loadMappingData = async (): Promise<any[]> => {
  try {
    const base = (import.meta as any).env?.BASE_URL || '/';
    let response;
    let mappingData;

    // Try comprehensive TWC mapping first
    try {
      response = await fetch(`${base}twc_store_mapping.json`);
      if (response.ok) {
        mappingData = await response.json();
        console.log('Loaded comprehensive TWC store mapping for role access');
        return mappingData;
      } else {
        throw new Error('Comprehensive mapping not found');
      }
    } catch {
      // Fallback to hr_mapping.json
      response = await fetch(`${base}hr_mapping.json`);
      mappingData = await response.json();
      console.log('Loaded fallback HR mapping for role access');
      return mappingData;
    }
  } catch (error) {
    console.warn('Could not load mapping data for roles, using fallback');
    return [];
  }
};

// Create role mappings from the JSON data
const createRoleMappings = (hrMappingData: any[]): UserRole[] => {
  const mappings: UserRole[] = [];
  
  // Admin user - can see everything
  mappings.push({
    userId: 'admin001',
    name: 'System Admin',
    role: 'admin',
    allowedStores: [],
    allowedAMs: [],
    allowedHRs: []
  });

  if (!hrMappingData || hrMappingData.length === 0) {
    // Fallback roles for testing
    mappings.push({
      userId: 'H1766',
      name: 'Vishu Kumar',
      role: 'area_manager',
      allowedStores: ['S027', 'S037', 'S049', 'S055'],
      allowedAMs: ['H1766'],
      allowedHRs: ['H3578'],
      region: 'North'
    });
    
    mappings.push({
      userId: 'H3578',
      name: 'HRBP H3578',
      role: 'hrbp',
      allowedStores: ['S027', 'S037', 'S049', 'S055', 'S039', 'S042'],
      allowedAMs: ['H1766', 'H2396'],
      allowedHRs: ['H3578'],
      region: 'North'
    });
    
    return mappings;
  }

  // Create sets to avoid duplicates
  const areaManagers = new Set<string>();
  const hrbps = new Set<string>();
  const regionalHrs = new Set<string>();
  const hrHeads = new Set<string>();
  const lmsHeads = new Set<string>();
  const trainers = new Set<string>();

  // Group data by roles
  const amStores: { [key: string]: string[] } = {};
  const amRegions: { [key: string]: string } = {};
  const hrbpStores: { [key: string]: string[] } = {};
  const hrbpAMs: { [key: string]: string[] } = {};
  const hrbpRegions: { [key: string]: string } = {};
  const regionalHrStores: { [key: string]: string[] } = {};
  const regionalHrAMs: { [key: string]: string[] } = {};
  const regionalHrHRBPs: { [key: string]: string[] } = {};
  const regionalHrRegions: { [key: string]: string } = {};

  hrMappingData.forEach((item: any) => {
    // Handle both old and new field formats
    const storeId = item['Store ID'] || item.storeId;
    const areaManagerId = item['Area Manager ID'] || item.areaManagerId || item['AM'];
    const hrbpId = item['HRBP ID'] || item.hrbpId || item['HRBP'];
    const regionalHrId = item['Regional HR ID'] || item.regionalHrId;
    const hrHeadId = item['HR Head ID'] || item.hrHeadId;
    const lmsHeadId = item['LMS Head ID'] || item.lmsHeadId;
    const trainerId = item['Trainer ID'] || item.trainerId || item['Trainer'];
    const region = item['Region'] || item.region;

    // Collect unique IDs
    if (areaManagerId) areaManagers.add(areaManagerId);
    if (hrbpId) hrbps.add(hrbpId);
    if (regionalHrId) regionalHrs.add(regionalHrId);
    if (hrHeadId) hrHeads.add(hrHeadId);
    if (lmsHeadId) lmsHeads.add(lmsHeadId);
    if (trainerId) trainers.add(trainerId);

    // Area Manager mappings
    if (areaManagerId) {
      if (!amStores[areaManagerId]) amStores[areaManagerId] = [];
      amStores[areaManagerId].push(storeId);
      amRegions[areaManagerId] = region;
    }

    // HRBP mappings
    if (hrbpId) {
      if (!hrbpStores[hrbpId]) hrbpStores[hrbpId] = [];
      if (!hrbpAMs[hrbpId]) hrbpAMs[hrbpId] = [];
      hrbpStores[hrbpId].push(storeId);
      if (areaManagerId && !hrbpAMs[hrbpId].includes(areaManagerId)) {
        hrbpAMs[hrbpId].push(areaManagerId);
      }
      hrbpRegions[hrbpId] = region;
    }

    // Regional HR mappings
    if (regionalHrId) {
      if (!regionalHrStores[regionalHrId]) regionalHrStores[regionalHrId] = [];
      if (!regionalHrAMs[regionalHrId]) regionalHrAMs[regionalHrId] = [];
      if (!regionalHrHRBPs[regionalHrId]) regionalHrHRBPs[regionalHrId] = [];
      
      regionalHrStores[regionalHrId].push(storeId);
      if (areaManagerId && !regionalHrAMs[regionalHrId].includes(areaManagerId)) {
        regionalHrAMs[regionalHrId].push(areaManagerId);
      }
      if (hrbpId && !regionalHrHRBPs[regionalHrId].includes(hrbpId)) {
        regionalHrHRBPs[regionalHrId].push(hrbpId);
      }
      regionalHrRegions[regionalHrId] = region;
    }
  });

  // Create Area Manager roles
  areaManagers.forEach(amId => {
    mappings.push({
      userId: amId,
      name: `Area Manager ${amId}`,
      role: 'area_manager',
      allowedStores: amStores[amId] || [],
      allowedAMs: [amId], // Can only see themselves
      allowedHRs: [], // Will be filled based on HRBP relationships
      region: amRegions[amId]
    });
  });

  // Create HRBP roles
  hrbps.forEach(hrbpId => {
    const hrPerson = HR_PERSONNEL.find(hr => hr.id === hrbpId);
    const hrName = hrPerson ? hrPerson.name : `HRBP ${hrbpId}`;
    
    mappings.push({
      userId: hrbpId,
      name: hrName,
      role: 'hrbp',
      allowedStores: hrbpStores[hrbpId] || [],
      allowedAMs: hrbpAMs[hrbpId] || [],
      allowedHRs: [hrbpId],
      region: hrbpRegions[hrbpId]
    });
  });

  // Create Regional HR roles
  regionalHrs.forEach(regionalHrId => {
    const hrPerson = HR_PERSONNEL.find(hr => hr.id === regionalHrId);
    const hrName = hrPerson ? hrPerson.name : `Regional HR ${regionalHrId}`;
    
    const allHRs = [regionalHrId, ...(regionalHrHRBPs[regionalHrId] || [])];
    mappings.push({
      userId: regionalHrId,
      name: hrName,
      role: 'regional_hr',
      allowedStores: regionalHrStores[regionalHrId] || [],
      allowedAMs: regionalHrAMs[regionalHrId] || [],
      allowedHRs: allHRs,
      region: regionalHrRegions[regionalHrId]
    });
  });

  // Create HR Head roles
  hrHeads.forEach(hrHeadId => {
    const hrPerson = HR_PERSONNEL.find(hr => hr.id === hrHeadId);
    const hrName = hrPerson ? hrPerson.name : `HR Head ${hrHeadId}`;
    
    mappings.push({
      userId: hrHeadId,
      name: hrName,
      role: 'hr_head',
      allowedStores: [], // Can see all stores
      allowedAMs: [], // Can see all AMs
      allowedHRs: [] // Can see all HR personnel
    });
  });

  // Create LMS Head roles
  lmsHeads.forEach(lmsHeadId => {
    const hrPerson = HR_PERSONNEL.find(hr => hr.id === lmsHeadId);
    const hrName = hrPerson ? hrPerson.name : `LMS Head ${lmsHeadId}`;
    
    mappings.push({
      userId: lmsHeadId,
      name: hrName,
      role: 'lms_head',
      allowedStores: [], // Can see all stores
      allowedAMs: [], // Can see all AMs
      allowedHRs: [] // Can see all HR personnel
    });
  });

  // Create Trainer roles
  trainers.forEach(trainerId => {
    const hrPerson = HR_PERSONNEL.find(hr => hr.id === trainerId);
    const trainerName = hrPerson ? hrPerson.name : `Trainer ${trainerId}`;
    
    mappings.push({
      userId: trainerId,
      name: trainerName,
      role: 'trainer',
      allowedStores: [], // Can see all stores (trainers need access to all)
      allowedAMs: [], // Can see all AMs
      allowedHRs: [] // Can see all HR personnel
    });
  });

  return mappings;
};

// Initialize with empty array, will be populated when mapping data loads
let ROLE_MAPPINGS: UserRole[] = createRoleMappings([]);

// Load mapping data and update roles
loadMappingData().then(data => {
  ROLE_MAPPINGS = createRoleMappings(data);
  console.log(`Loaded ${ROLE_MAPPINGS.length} role mappings`);
}).catch(error => {
  console.warn('Using fallback role mappings');
});

export const getUserRole = (userId: string): UserRole | null => {
  // Make the lookup case-insensitive to handle both h541 and H541
  return ROLE_MAPPINGS.find(role => role.userId.toLowerCase() === userId.toLowerCase()) || null;
};

export const canAccessStore = (userRole: UserRole, storeId: string): boolean => {
  // If allowedStores is empty, user can access all stores (admin, hr_head, lms_head, trainer)
  if (userRole.allowedStores.length === 0) return true;
  return userRole.allowedStores.includes(storeId);
};

export const canAccessAM = (userRole: UserRole, amId: string): boolean => {
  // If allowedAMs is empty, user can access all AMs (admin, hr_head, lms_head, trainer)
  if (userRole.allowedAMs.length === 0) return true;
  return userRole.allowedAMs.includes(amId);
};

export const canAccessHR = (userRole: UserRole, hrId: string): boolean => {
  // If allowedHRs is empty, user can access all HR personnel (admin, hr_head, lms_head, trainer)
  if (userRole.allowedHRs.length === 0) return true;
  return userRole.allowedHRs.includes(hrId);
};