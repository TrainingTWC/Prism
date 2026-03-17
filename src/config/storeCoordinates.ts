/**
 * Store GPS Coordinates for Geofencing
 * 
 * Each store needs lat/lng coordinates to enable location-based access control.
 * Stores with lat: 0, lng: 0 are PLACEHOLDERS — geofencing is SKIPPED for them
 * until real coordinates are added.
 * 
 * HOW TO UPDATE:
 * 1. Get the store's Google Maps coordinates (right-click → "What's here?" or search bar)
 * 2. Replace lat: 0 and lng: 0 with the actual values
 * 3. Example: 'S001': { lat: 12.9352, lng: 77.6245, name: 'Koramangala' }
 * 
 * GEOFENCE_RADIUS_METERS controls how close the auditor must be to the store.
 */

export const GEOFENCE_RADIUS_METERS = 100; // 100 meters

export interface StoreCoordinate {
  lat: number;
  lng: number;
  name: string;
}

export const STORE_COORDINATES: Record<string, StoreCoordinate> = {
  // ============ SOUTH REGION ============
  'S001': { lat: 12.973541, lng: 77.652580, name: 'Koramangala' },
  'S002': { lat: 12.975873, lng: 77.655593, name: 'CMH Indira Nagar' },
  'S003': { lat: 0, lng: 0, name: 'HSR-1' },
  'S004': { lat: 0, lng: 0, name: 'Sadashiv Nagar' },
  'S005': { lat: 0, lng: 0, name: 'Forum Shantiniketan Whitefield' },
  'S006': { lat: 0, lng: 0, name: 'New Airport Road' },
  'S007': { lat: 0, lng: 0, name: 'UB City' },
  'S008': { lat: 0, lng: 0, name: 'Bellandur' },
  'S009': { lat: 0, lng: 0, name: '12th Main Indira Nagar' },
  'S011': { lat: 0, lng: 0, name: 'Cunningham Road' },
  'S012': { lat: 0, lng: 0, name: 'Malleshwaram' },
  'S014': { lat: 0, lng: 0, name: 'Church Street' },
  'S015': { lat: 0, lng: 0, name: 'JP Nagar' },
  'S016': { lat: 0, lng: 0, name: 'Jaya Nagar' },
  'S017': { lat: 0, lng: 0, name: 'Sarjapur Road' },
  'S018': { lat: 0, lng: 0, name: 'HSR-2' },
  'S019': { lat: 0, lng: 0, name: 'PMC-Bangalore' },
  'S020': { lat: 0, lng: 0, name: 'New BEL Road' },
  'S021': { lat: 0, lng: 0, name: 'Bedford Coonoor' },
  'S022': { lat: 0, lng: 0, name: 'Eco World Bay' },
  'S023': { lat: 0, lng: 0, name: 'HRBR Layout' },
  'S030': { lat: 0, lng: 0, name: 'Frazer Town' },
  'S031': { lat: 0, lng: 0, name: 'Lavelle Road' },
  'S032': { lat: 0, lng: 0, name: 'BrookField' },
  'S033': { lat: 0, lng: 0, name: 'Banashankari' },
  'S034': { lat: 0, lng: 0, name: 'Karthik Nagar - Marathahalli' },
  'S050': { lat: 0, lng: 0, name: 'Bangalore Airport Outside' },
  'S051': { lat: 0, lng: 0, name: 'Sakra Hospital' },
  'S053': { lat: 0, lng: 0, name: 'Varthur' },
  'S063': { lat: 0, lng: 0, name: 'BTM Layout' },
  'S065': { lat: 0, lng: 0, name: 'Manipal Hospital' },
  'S067': { lat: 0, lng: 0, name: 'Kanakpura Road' },
  'S068': { lat: 0, lng: 0, name: 'Koramangala 8th Block' },
  'S069': { lat: 0, lng: 0, name: 'Vijaya Bank Layout' },
  'S070': { lat: 0, lng: 0, name: 'Sahakar Nagar' },
  'S082': { lat: 0, lng: 0, name: 'Salarpuria Sattva' },
  'S091': { lat: 0, lng: 0, name: 'Nexus Mall, Whitefield' },
  'S092': { lat: 0, lng: 0, name: 'Manyata Embassy NXT' },
  'S094': { lat: 0, lng: 0, name: 'Forum South Bangalore' },
  'S095': { lat: 0, lng: 0, name: 'JP Nagar 7th Phase' },
  'S114': { lat: 0, lng: 0, name: 'BIAL T1 Kiosk' },
  'S115': { lat: 0, lng: 0, name: 'Deloitte - Bangalore' },
  'S119': { lat: 0, lng: 0, name: 'Devaraj Urs Rd-Mysuru' },
  'S125': { lat: 0, lng: 0, name: 'Vijayanagar' },
  'S131': { lat: 0, lng: 0, name: 'Brigade Utopia' },
  'S133': { lat: 0, lng: 0, name: 'Fiza by Nexus Mall' },
  'S134': { lat: 0, lng: 0, name: 'Nexus Westend Mall' },
  'S139': { lat: 0, lng: 0, name: 'Balmatta' },
  'S140': { lat: 0, lng: 0, name: 'Harlur Road' },
  'S146': { lat: 0, lng: 0, name: 'Rajajinagar' },
  'S149': { lat: 0, lng: 0, name: 'HSR 5th Main' },
  'S152': { lat: 0, lng: 0, name: 'Kalidasa Road Mysore' },
  'S156': { lat: 0, lng: 0, name: 'Akshay Nagar' },
  'S158': { lat: 0, lng: 0, name: 'Prestige Tech Park Electra' },
  'S159': { lat: 0, lng: 0, name: 'The Sqaure - Raj Etternia Kudlu' },
  'S184': { lat: 0, lng: 0, name: 'Prestige TechnoStar' },
  'S185': { lat: 0, lng: 0, name: 'Basaveshwaranagar' },
  'S189': { lat: 0, lng: 0, name: 'NXT Whitefield' },
  'S190': { lat: 0, lng: 0, name: 'EcoWorld 4AB' },
  'S191': { lat: 0, lng: 0, name: 'Sparsh Hospital- RR Nagar' },
  'S193': { lat: 0, lng: 0, name: 'Indicube St Marks Road' },
  'S199': { lat: 0, lng: 0, name: 'Mettupalayam' },
  'S201': { lat: 0, lng: 0, name: 'Ashok Nagar' },
  'S206': { lat: 0, lng: 0, name: 'Capita land ITPH' },
  'S211': { lat: 0, lng: 0, name: 'Sattva Knowledge Park' },

  // ============ NORTH REGION ============
  'S024': { lat: 0, lng: 0, name: 'Deer Park' },
  'S025': { lat: 0, lng: 0, name: 'Platina Mall' },
  'S026': { lat: 0, lng: 0, name: 'GK2' },
  'S027': { lat: 0, lng: 0, name: 'Defence Colony' },
  'S028': { lat: 0, lng: 0, name: 'Saket' },
  'S035': { lat: 0, lng: 0, name: 'GK1' },
  'S036': { lat: 0, lng: 0, name: 'Punjabhi Bagh' },
  'S037': { lat: 0, lng: 0, name: 'Khan Market' },
  'S038': { lat: 0, lng: 0, name: 'Vatika Business Park' },
  'S039': { lat: 0, lng: 0, name: 'Chandigarh Sec7' },
  'S040': { lat: 0, lng: 0, name: 'Ambience Mall' },
  'S041': { lat: 0, lng: 0, name: 'Pitampura' },
  'S042': { lat: 0, lng: 0, name: 'Chandigarh Sec35' },
  'S049': { lat: 0, lng: 0, name: 'Connaught Place E Block' },
  'S055': { lat: 0, lng: 0, name: 'Kalkaji' },
  'S056': { lat: 0, lng: 0, name: 'Mall of India' },
  'S062': { lat: 0, lng: 0, name: 'Panchkula' },
  'S072': { lat: 0, lng: 0, name: 'Kailash Colony' },
  'S073': { lat: 0, lng: 0, name: 'Golf Course Road' },
  'S099': { lat: 0, lng: 0, name: 'Sushant Lok' },
  'S100': { lat: 0, lng: 0, name: 'AIPL Business Club' },
  'S101': { lat: 0, lng: 0, name: 'Sector 63, Noida' },
  'S102': { lat: 0, lng: 0, name: 'Fortis Hospital - Gurugram' },
  'S112': { lat: 0, lng: 0, name: 'Noida Spectrum Mall' },
  'S113': { lat: 0, lng: 0, name: 'Hauz Khaz' },
  'S120': { lat: 0, lng: 0, name: 'Janakpuri C Block' },
  'S121': { lat: 0, lng: 0, name: 'DLF Avenue Mall - Saket' },
  'S122': { lat: 0, lng: 0, name: 'Jubilee Walk Mohali' },
  'S126': { lat: 0, lng: 0, name: 'Pacific Mall -Tagore Garden' },
  'S129': { lat: 0, lng: 0, name: 'Basant Lok' },
  'S141': { lat: 0, lng: 0, name: 'Paschim Vihar' },
  'S142': { lat: 0, lng: 0, name: 'Green Park' },
  'S150': { lat: 0, lng: 0, name: 'Airia Mall' },
  'S153': { lat: 0, lng: 0, name: 'Lajpat Nagar' },
  'S154': { lat: 0, lng: 0, name: 'DME 63 LHS' },
  'S155': { lat: 0, lng: 0, name: 'DME 69 RHS' },
  'S164': { lat: 0, lng: 0, name: 'Nirvana Courtyard' },
  'S166': { lat: 0, lng: 0, name: 'Central Market- Sector 120' },
  'S167': { lat: 0, lng: 0, name: 'Advant Noida' },
  'S171': { lat: 0, lng: 0, name: 'Omaxe World Street' },
  'S172': { lat: 0, lng: 0, name: 'Faridabad Sec 14' },
  'S173': { lat: 0, lng: 0, name: 'Rohini Sec 14' },
  'S174': { lat: 0, lng: 0, name: 'Vasant Kunj' },
  'S176': { lat: 0, lng: 0, name: 'Capital CyberScape' },
  'S182': { lat: 0, lng: 0, name: 'Rajouri Garden' },
  'S187': { lat: 0, lng: 0, name: 'DLF Midtown' },
  'S188': { lat: 0, lng: 0, name: 'Shalimar Bagh Metro' },
  'S192': { lat: 0, lng: 0, name: 'Bhutani City Centre Noida' },
  'S195': { lat: 0, lng: 0, name: 'Indirapuram' },
  'S197': { lat: 0, lng: 0, name: 'DLF Saltstayz' },
  'S198': { lat: 0, lng: 0, name: 'DLF Star Tower' },
  'S200': { lat: 0, lng: 0, name: 'Malviya Nagar' },
  'S202': { lat: 0, lng: 0, name: 'India Expo Plaza' },

  // ============ WEST REGION ============
  'S043': { lat: 0, lng: 0, name: 'Kemps Corner' },
  'S044': { lat: 0, lng: 0, name: 'Lokhandwala' },
  'S045': { lat: 0, lng: 0, name: 'Mahim' },
  'S047': { lat: 0, lng: 0, name: 'R City' },
  'S048': { lat: 0, lng: 0, name: 'Kalyani Nagar - Pune' },
  'S057': { lat: 0, lng: 0, name: 'Versova' },
  'S058': { lat: 0, lng: 0, name: 'Wanowrie' },
  'S059': { lat: 0, lng: 0, name: 'Koregoan Park' },
  'S060': { lat: 0, lng: 0, name: 'Kothrud' },
  'S061': { lat: 0, lng: 0, name: 'Juhu' },
  'S074': { lat: 0, lng: 0, name: 'Phoenix Market City - Pune' },
  'S075': { lat: 0, lng: 0, name: 'Runwal Greens Mulund' },
  'S076': { lat: 0, lng: 0, name: 'Emerald Borivali' },
  'S077': { lat: 0, lng: 0, name: 'Sea Castle, Marine Lines' },
  'S078': { lat: 0, lng: 0, name: 'Star Mansion, Cuffe Parade' },
  'S080': { lat: 0, lng: 0, name: 'Balewadi Highstreet' },
  'S087': { lat: 0, lng: 0, name: 'Equinox, BKC' },
  'S088': { lat: 0, lng: 0, name: 'Viceroy Thakur Village' },
  'S089': { lat: 0, lng: 0, name: 'Viviana Mall' },
  'S090': { lat: 0, lng: 0, name: 'Oberoi Mall' },
  'S096': { lat: 0, lng: 0, name: 'Mahavir Nagar' },
  'S097': { lat: 0, lng: 0, name: 'Vasudev Bhavan - Chembur' },
  'S103': { lat: 0, lng: 0, name: 'Hiranandani Estate-The Walk' },
  'S104': { lat: 0, lng: 0, name: 'Phoenix Mall of the Millennium' },
  'S105': { lat: 0, lng: 0, name: 'Platina Mumbai' },
  'S106': { lat: 0, lng: 0, name: 'Bimco House-Andheri Kurla Road' },
  'S107': { lat: 0, lng: 0, name: 'Vilco Centre - Vile Parle' },
  'S109': { lat: 0, lng: 0, name: 'FC road' },
  'S110': { lat: 0, lng: 0, name: 'Phoenix Mall of Asia' },
  'S111': { lat: 0, lng: 0, name: 'CBD Belapur' },
  'S116': { lat: 0, lng: 0, name: 'Santacruz West' },
  'S117': { lat: 0, lng: 0, name: 'Marol Andheri East' },
  'S118': { lat: 0, lng: 0, name: 'Inorbit Mall-Vashi' },
  'S127': { lat: 0, lng: 0, name: 'Seawoods Navi Mumbai' },
  'S128': { lat: 0, lng: 0, name: 'Bibwewadi' },
  'S130': { lat: 0, lng: 0, name: 'Pimple Saudagar Hill Crest' },
  'S132': { lat: 0, lng: 0, name: 'Ekta Tripolis Goregoan' },
  'S135': { lat: 0, lng: 0, name: 'Worli Athithi' },
  'S136': { lat: 0, lng: 0, name: 'Pimple Nilakh Water Square' },
  'S137': { lat: 0, lng: 0, name: 'Palm Beach Vashi' },
  'S138': { lat: 0, lng: 0, name: 'Damodar Villa Santacruz' },
  'S147': { lat: 0, lng: 0, name: 'Pune Mumbai Expressway' },
  'S148': { lat: 0, lng: 0, name: 'Vensej Mall' },
  'S161': { lat: 0, lng: 0, name: 'Nexus Seawoods Grand Central Mall' },
  'S162': { lat: 0, lng: 0, name: 'Deloitte - Mumbai' },
  'S163': { lat: 0, lng: 0, name: 'Phoenix Market City - Mumbai' },
  'S165': { lat: 0, lng: 0, name: 'Oberoi Sky City Mall' },
  'S168': { lat: 0, lng: 0, name: 'Panchpakhadi-Thane' },
  'S170': { lat: 0, lng: 0, name: 'Pokhran Road' },
  'S177': { lat: 0, lng: 0, name: 'Nariman point' },
  'S180': { lat: 0, lng: 0, name: 'Deloitte Thane' },
  'S186': { lat: 0, lng: 0, name: 'Bavdhan' },
  'S205': { lat: 0, lng: 0, name: 'CG Road Navrangpura' },
  'S210': { lat: 0, lng: 0, name: 'Prahlad Nagar- AHM' },
  'S216': { lat: 0, lng: 0, name: 'Kotia Nirman- Andheri West' },
  'S219': { lat: 0, lng: 0, name: 'Pune Camp' },

  // ============ EAST / HYDERABAD / CHENNAI ============
  'S066': { lat: 0, lng: 0, name: 'Sparsh Hospice - KHAJAGUDA' },
  'S081': { lat: 0, lng: 0, name: 'Sainikpuri' },
  'S083': { lat: 0, lng: 0, name: 'Kondapura Hitech City' },
  'S084': { lat: 0, lng: 0, name: 'Banjara Hills Road no.12' },
  'S085': { lat: 0, lng: 0, name: 'The Platina Gachibowli' },
  'S086': { lat: 0, lng: 0, name: 'Inorbit Mall-Hyderabad' },
  'S108': { lat: 0, lng: 0, name: 'Hyderabad Airport Inside' },
  'S123': { lat: 0, lng: 0, name: 'Phoenix Palladium Chennai' },
  'S143': { lat: 0, lng: 0, name: 'Kilpauk' },
  'S144': { lat: 0, lng: 0, name: 'Express Avenue Mall' },
  'S145': { lat: 0, lng: 0, name: 'Adyar' },
  'S157': { lat: 0, lng: 0, name: 'Kathipara Urban Square' },
  'S169': { lat: 0, lng: 0, name: 'Himayat Nagar' },
  'S175': { lat: 0, lng: 0, name: 'Madeenaguda' },
  'S178': { lat: 0, lng: 0, name: 'Besant Nagar' },
  'S194': { lat: 0, lng: 0, name: 'Manikonda' },
};

/**
 * Calculate distance between two GPS points using the Haversine formula.
 * Returns distance in meters.
 */
export function getDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a user's GPS position is within the geofence of a store.
 * Returns { allowed, distance, storeCoord } or null if store has no coordinates set.
 */
export function checkGeofence(
  storeId: string,
  userLat: number,
  userLng: number,
  radiusMeters: number = GEOFENCE_RADIUS_METERS
): { allowed: boolean; distance: number; storeName: string } | null {
  const storeCoord = STORE_COORDINATES[storeId];
  if (!storeCoord) return null; // Store not in the coordinates list
  if (storeCoord.lat === 0 && storeCoord.lng === 0) return null; // Placeholder — skip geofencing

  const distance = getDistanceMeters(userLat, userLng, storeCoord.lat, storeCoord.lng);
  return {
    allowed: distance <= radiusMeters,
    distance: Math.round(distance),
    storeName: storeCoord.name
  };
}
