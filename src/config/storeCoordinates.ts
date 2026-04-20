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
  'S001': { lat: 12.934734, lng: 77.629572, name: 'Koramangala' },
  'S002': { lat: 12.9788, lng: 77.64528, name: 'CMH Indira Nagar' },
  'S003': { lat: 12.90996, lng: 77.637846, name: 'HSR-1' },
  'S004': { lat: 13.008266, lng: 77.57984, name: 'Sadashiv Nagar' },
  'S005': { lat: 12.989465, lng: 77.728713, name: 'Forum Shantiniketan Whitefield' },
  'S006': { lat: 13.167301, lng: 77.631606, name: 'New Airport Road' },
  'S007': { lat: 12.971612, lng: 77.595997, name: 'UB City' },
  'S008': { lat: 12.922306, lng: 77.669381, name: 'Bellandur' },
  'S009': { lat: 12.970225, lng: 77.638671, name: '12th Main Indira Nagar' },
  'S011': { lat: 12.987458, lng: 77.594787, name: 'Cunningham Road' },
  'S012': { lat: 13.00682, lng: 77.568983, name: 'Malleshwaram' },
  'S014': { lat: 12.974674, lng: 77.606751, name: 'Church Street' },
  'S015': { lat: 12.906154, lng: 77.58767, name: 'JP Nagar' },
  'S016': { lat: 12.921021, lng: 77.583572, name: 'Jaya Nagar' },
  'S017': { lat: 12.909493, lng: 77.687208, name: 'Sarjapur Road' },
  'S018': { lat: 12.911793, lng: 77.650215, name: 'HSR-2' },
  'S019': { lat: 12.998041, lng: 77.697321, name: 'PMC-Bangalore' },
  'S020': { lat: 13.027258, lng: 77.576516, name: 'New BEL Road' },
  'S021': { lat: 11.344696, lng: 76.801083, name: 'Bedford Coonoor' },
  'S022': { lat: 12.920553, lng: 77.684648, name: 'Eco World Bay' },
  'S023': { lat: 13.021674, lng: 77.640049, name: 'HRBR Layout' },
  'S030': { lat: 12.996098, lng: 77.613326, name: 'Frazer Town' },
  'S031': { lat: 12.971635, lng: 77.597882, name: 'Lavelle Road' },
  'S032': { lat: 12.963305, lng: 77.717028, name: 'BrookField' },
  'S033': { lat: 12.926796, lng: 77.561161, name: 'Banashankari' },
  'S034': { lat: 12.969397, lng: 77.700643, name: 'Karthik Nagar - Marathahalli' },
  'S050': { lat: 13.200024, lng: 77.708487, name: 'Bangalore Airport Outside' },
  'S051': { lat: 12.932079, lng: 77.68499, name: 'Sakra Hospital' },
  'S053': { lat: 12.95731, lng: 77.736773, name: 'Varthur' },
  'S063': { lat: 12.91371, lng: 77.605236, name: 'BTM Layout' },
  'S065': { lat: 12.95849, lng: 77.745324, name: 'Manipal Hospital' },
  'S067': { lat: 12.830704, lng: 77.513313, name: 'Kanakpura Road' },
  'S068': { lat: 12.939619, lng: 77.619446, name: 'Koramangala 8th Block' },
  'S069': { lat: 12.889383, lng: 77.610559, name: 'Vijaya Bank Layout' },
  'S070': { lat: 13.061104, lng: 77.587219, name: 'Sahakar Nagar' },
  'S082': { lat: 17.433349, lng: 78.382206, name: 'Salarpuria Sattva' },
  'S091': { lat: 12.959843, lng: 77.747427, name: 'Nexus Mall, Whitefield' },
  'S092': { lat: 13.041517, lng: 77.619525, name: 'Manyata Embassy NXT' },
  'S094': { lat: 12.888105, lng: 77.563196, name: 'Forum South Bangalore' },
  'S095': { lat: 12.891707, lng: 77.583905, name: 'JP Nagar 7th Phase' },
  'S114': { lat: 13.201075, lng: 77.712901, name: 'BIAL T1 Kiosk' },
  'S115': { lat: 12.98596, lng: 77.58756, name: 'Deloitte - Bangalore' },
  'S119': { lat: 12.309722, lng: 76.644583, name: 'Devaraj Urs Rd-Mysuru' },
  'S125': { lat: 12.960235, lng: 77.531224, name: 'Vijayanagar' },
  'S131': { lat: 12.93195, lng: 77.7457, name: 'Brigade Utopia' },
  'S133': { lat: 12.85759, lng: 74.838339, name: 'Fiza by Nexus Mall' },
  'S134': { lat: 18.560894, lng: 73.806912, name: 'Nexus Westend Mall' },
  'S139': { lat: 12.874632, lng: 74.854743, name: 'Balmatta' },
  'S140': { lat: 12.914826, lng: 77.666916, name: 'Harlur Road' },
  'S146': { lat: 12.986137, lng: 77.551066, name: 'Rajajinagar' },
  'S149': { lat: 12.909662, lng: 77.632766, name: 'HSR 5th Main' },
  'S152': { lat: 12.326, lng: 76.6139, name: 'Kalidasa Road Mysore' },
  'S156': { lat: 12.871104, lng: 77.616568, name: 'Akshay Nagar' },
  'S158': { lat: 12.942722, lng: 77.691745, name: 'Prestige Tech Park Electra' },
  'S159': { lat: 12.892, lng: 77.66694, name: 'The Sqaure - Raj Etternia Kudlu' },
  'S184': { lat: 12.97325, lng: 77.71073, name: 'Prestige TechnoStar' },
  'S185': { lat: 12.99483, lng: 77.53966, name: 'Basaveshwaranagar' },
  'S189': { lat: 12.978098, lng: 77.714025, name: 'NXT Whitefield' },
  'S190': { lat: 12.92419, lng: 77.68449, name: 'EcoWorld 4AB' },
  'S191': { lat: 12.926732, lng: 77.521328, name: 'Sparsh Hospital- RR Nagar' },
  'S193': { lat: 12.968617, lng: 77.600459, name: 'Indicube St Marks Road' },
  'S199': { lat: 0, lng: 0, name: 'Mettupalayam' },
  'S201': { lat: 13.04451, lng: 80.21748, name: 'Ashok Nagar' },
  'S206': { lat: 17.435306, lng: 78.385639, name: 'Capita land ITPH' },
  'S211': { lat: 17.43053, lng: 78.37885, name: 'Sattva Knowledge Park' },
  'S217': { lat: 12.987304, lng: 77.703972, name: 'Bagmane Capital Tech Park' },
  'S232': { lat: 13.011164, lng: 77.555061, name: 'Orion Mall' },
  'S233': { lat: 13.055249, lng: 77.763742, name: 'Uptown Orion Mall' },
  'S247': { lat: 12.893844, lng: 77.595836, name: 'Bannerghatta' },

  // ============ NORTH REGION ============
  'S024': { lat: 28.559328, lng: 77.195795, name: 'Deer Park' },
  'S025': { lat: 28.480533, lng: 77.092801, name: 'Platina Mall' },
  'S026': { lat: 28.533283, lng: 77.243643, name: 'GK2' },
  'S027': { lat: 28.5741, lng: 77.237699, name: 'Defence Colony' },
  'S028': { lat: 28.528297, lng: 77.22, name: 'Saket' },
  'S035': { lat: 28.549758, lng: 77.236434, name: 'GK1' },
  'S036': { lat: 28.666726, lng: 77.123122, name: 'Punjabhi Bagh' },
  'S037': { lat: 28.600777, lng: 77.227024, name: 'Khan Market' },
  'S038': { lat: 28.406186, lng: 77.044393, name: 'Vatika Business Park' },
  'S039': { lat: 30.734025, lng: 76.797174, name: 'Chandigarh Sec7' },
  'S040': { lat: 28.541257, lng: 77.155167, name: 'Ambience Mall' },
  'S041': { lat: 28.693187, lng: 77.151861, name: 'Pitampura' },
  'S042': { lat: 30.720751, lng: 76.758979, name: 'Chandigarh Sec35' },
  'S049': { lat: 28.632829, lng: 77.221537, name: 'Connaught Place E Block' },
  'S055': { lat: 28.542205, lng: 77.25376, name: 'Kalkaji' },
  'S056': { lat: 28.567693, lng: 77.321134, name: 'Mall of India' },
  'S062': { lat: 30.694371, lng: 76.850098, name: 'Panchkula' },
  'S072': { lat: 28.557396, lng: 77.240317, name: 'Kailash Colony' },
  'S073': { lat: 28.433696, lng: 77.105148, name: 'Golf Course Road' },
  'S099': { lat: 28.451233, lng: 77.081373, name: 'Sushant Lok' },
  'S100': { lat: 28.400912, lng: 77.085484, name: 'AIPL Business Club' },
  'S101': { lat: 28.628075, lng: 77.374931, name: 'Sector 63, Noida' },
  'S102': { lat: 28.457792, lng: 77.07383, name: 'Fortis Hospital - Gurugram' },
  'S112': { lat: 28.573942, lng: 77.378906, name: 'Noida Spectrum Mall' },
  'S113': { lat: 28.55203, lng: 77.207921, name: 'Hauz Khaz' },
  'S120': { lat: 28.620718, lng: 77.08025, name: 'Janakpuri C Block' },
  'S121': { lat: 28.527834, lng: 77.216941, name: 'DLF Avenue Mall - Saket' },
  'S122': { lat: 30.692295, lng: 76.713325, name: 'Jubilee Walk Mohali' },
  'S126': { lat: 28.64265, lng: 77.106681, name: 'Pacific Mall -Tagore Garden' },
  'S129': { lat: 28.55782, lng: 77.164451, name: 'Basant Lok' },
  'S141': { lat: 28.665255, lng: 77.092567, name: 'Paschim Vihar' },
  'S142': { lat: 28.556862, lng: 77.202499, name: 'Green Park' },
  'S148': { lat: 28.415304, lng: 77.07655, name: 'Vensej Mall' },
  'S150': { lat: 28.382934, lng: 77.05251, name: 'Airia Mall' },
  'S153': { lat: 28.567057, lng: 77.246567, name: 'Lajpat Nagar' },
  'S154': { lat: 27.793917, lng: 77.013139, name: 'DME 63 LHS' },
  'S155': { lat: 27.736225, lng: 76.983116, name: 'DME 69 RHS' },
  'S164': { lat: 28.413944, lng: 77.065907, name: 'Nirvana Courtyard' },
  'S166': { lat: 28.58629, lng: 77.39905, name: 'Central Market- Sector 120' },
  'S167': { lat: 28.50097, lng: 77.41001, name: 'Advant Noida' },
  'S171': { lat: 28.38712, lng: 77.35335, name: 'Omaxe World Street' },
  'S172': { lat: 28.39419, lng: 77.32825, name: 'Faridabad Sec 14' },
  'S173': { lat: 28.715782, lng: 77.132595, name: 'Rohini Sec 14' },
  'S174': { lat: 28.538301, lng: 77.142750, name: 'Vasant Kunj' },
  'S176': { lat: 28.401268, lng: 77.101513, name: 'Capital CyberScape' },
  'S182': { lat: 28.640295, lng: 77.120185, name: 'Rajouri Garden' },
  'S187': { lat: 28.663416, lng: 77.153519, name: 'DLF Midtown' },
  'S188': { lat: 28.701742, lng: 77.165695, name: 'Shalimar Bagh Metro' },
  'S192': { lat: 28.574429, lng: 77.354228, name: 'Bhutani City Centre Noida' },
  'S195': { lat: 28.641291, lng: 77.361786, name: 'Indirapuram' },
  'S197': { lat: 28.46652, lng: 77.09951, name: 'DLF Saltstayz' },
  'S198': { lat: 28.460819, lng: 77.051825, name: 'DLF Star Tower' },
  'S200': { lat: 28.5355, lng: 77.210639, name: 'Malviya Nagar' },
  'S202': { lat: 28.458556, lng: 77.499333, name: 'India Expo Plaza' },
  'S223': { lat: 28.634098, lng: 77.220108, name: 'Store S223' },
  'S229': { lat: 28.403961, lng: 76.947823, name: 'Store S229' },
  'S235': { lat: 28.509773, lng: 77.07148, name: 'Store S235' },
  'S236': { lat: 28.498665, lng: 77.403206, name: 'Store S236' },
  'S241': { lat: 28.467237, lng: 77.081672, name: 'Store S241' },
  'S242': { lat: 28.560591, lng: 77.356214, name: 'Store S242' },
  'S243': { lat: 28.504051, lng: 77.010770, name: 'Embassy India Bulls' },
  'S228': { lat: 28.592830, lng: 77.040851, name: 'Dwarka Sec 12' },

  // ============ WEST REGION ============
  'S043': { lat: 18.963486, lng: 72.807933, name: 'Kemps Corner' },
  'S044': { lat: 19.146622, lng: 72.828695, name: 'Lokhandwala' },
  'S045': { lat: 19.040988, lng: 72.845935, name: 'Mahim' },
  'S047': { lat: 19.099697, lng: 72.916668, name: 'R City' },
  'S048': { lat: 18.547144, lng: 73.900226, name: 'Kalyani Nagar - Pune' },
  'S057': { lat: 19.128936, lng: 72.817498, name: 'Versova' },
  'S058': { lat: 18.481372, lng: 73.903457, name: 'Wanowrie' },
  'S059': { lat: 18.545158, lng: 73.900664, name: 'Koregoan Park' },
  'S060': { lat: 18.502634, lng: 73.821628, name: 'Kothrud' },
  'S061': { lat: 19.105757, lng: 72.826001, name: 'Juhu' },
  'S074': { lat: 18.56125, lng: 73.916996, name: 'Phoenix Market City - Pune' },
  'S075': { lat: 19.160831, lng: 72.945388, name: 'Runwal Greens Mulund' },
  'S076': { lat: 19.232144, lng: 72.852688, name: 'Emerald Borivali' },
  'S077': { lat: 18.955419, lng: 72.813707, name: 'Sea Castle, Marine Lines' },
  'S078': { lat: 18.915008, lng: 72.823645, name: 'Star Mansion, Cuffe Parade' },
  'S080': { lat: 18.571374, lng: 73.774247, name: 'Balewadi Highstreet' },
  'S087': { lat: 19.071874, lng: 72.876559, name: 'Equinox, BKC' },
  'S088': { lat: 19.214412, lng: 72.871755, name: 'Viceroy Thakur Village' },
  'S089': { lat: 19.208715, lng: 72.97146, name: 'Viviana Mall' },
  'S090': { lat: 19.17402, lng: 72.861016, name: 'Oberoi Mall' },
  'S096': { lat: 19.213328, lng: 72.842256, name: 'Mahavir Nagar' },
  'S097': { lat: 19.056592, lng: 72.897813, name: 'Vasudev Bhavan - Chembur' },
  'S103': { lat: 19.255928, lng: 72.98369, name: 'Hiranandani Estate-The Walk' },
  'S104': { lat: 18.599562, lng: 73.756731, name: 'Phoenix Mall of the Millennium' },
  'S105': { lat: 19.06838, lng: 72.868303, name: 'Platina Mumbai' },
  'S106': { lat: 19.112847, lng: 72.865591, name: 'Bimco House-Andheri Kurla Road' },
  'S107': { lat: 19.108763, lng: 72.852058, name: 'Vilco Centre - Vile Parle' },
  'S109': { lat: 18.52284, lng: 73.841113, name: 'FC road' },
  'S110': { lat: 13.070536, lng: 77.590912, name: 'Phoenix Mall of Asia' },
  'S111': { lat: 19.011983, lng: 73.035755, name: 'CBD Belapur' },
  'S116': { lat: 0, lng: 0, name: 'Santacruz West' },
  'S117': { lat: 19.107863, lng: 72.882543, name: 'Marol Andheri East' },
  'S118': { lat: 19.064217, lng: 73.005138, name: 'Inorbit Mall-Vashi' },
  'S127': { lat: 19.010567, lng: 73.011978, name: 'Seawoods Navi Mumbai' },
  'S128': { lat: 18.484655, lng: 73.887181, name: 'Bibwewadi' },
  'S130': { lat: 18.596267, lng: 73.797365, name: 'Pimple Saudagar Hill Crest' },
  'S132': { lat: 19.154392, lng: 72.842878, name: 'Ekta Tripolis Goregoan' },
  'S135': { lat: 19.001759, lng: 72.81434, name: 'Worli Athithi' },
  'S136': { lat: 18.580491, lng: 73.781746, name: 'Pimple Nilakh Water Square' },
  'S137': { lat: 19.084712, lng: 73.00755, name: 'Palm Beach Vashi' },
  'S138': { lat: 19.07907, lng: 72.831136, name: 'Damodar Villa Santacruz' },
  'S147': { lat: 18.792, lng: 73.2949, name: 'Pune Mumbai Expressway' },
  'S161': { lat: 19.022158, lng: 73.01877, name: 'Nexus Seawoods Grand Central Mall' },
  'S162': { lat: 19.00787, lng: 72.83609, name: 'Deloitte - Mumbai' },
  'S163': { lat: 19.086159, lng: 72.888688, name: 'Phoenix Market City - Mumbai' },
  'S165': { lat: 19.223125, lng: 72.863937, name: 'Oberoi Sky City Mall' },
  'S168': { lat: 19.190613, lng: 72.966254, name: 'Panchpakhadi-Thane' },
  'S170': { lat: 19.219999, lng: 72.963712, name: 'Pokhran Road' },
  'S177': { lat: 18.928138, lng: 72.821899, name: 'Nariman point' },
  'S180': { lat: 0, lng: 0, name: 'Deloitte Thane' },
  'S186': { lat: 18.516612, lng: 73.781650, name: 'Bavdhan' },
  'S204': { lat: 19.194332, lng: 72.83415, name: 'Store S204' },
  'S205': { lat: 23.033104, lng: 72.557983, name: 'CG Road Navrangpura' },
  'S210': { lat: 23.008217, lng: 72.507023, name: 'Prahlad Nagar- AHM' },
  'S216': { lat: 19.135483, lng: 72.832993, name: 'Kotia Nirman- Andheri West' },
  'S219': { lat: 18.515943, lng: 73.879613, name: 'Pune Camp' },
  'S237': { lat: 19.111132, lng: 72.87464, name: 'Store S237' },
  'S240': { lat: 18.931487, lng: 72.827050, name: 'Churchgate' },

  // ============ EAST / HYDERABAD / CHENNAI ============
  'S066': { lat: 17.418249, lng: 78.36412, name: 'Sparsh Hospice - KHAJAGUDA' },
  'S081': { lat: 17.486796, lng: 78.544112, name: 'Sainikpuri' },
  'S083': { lat: 17.457524, lng: 78.37211, name: 'Kondapura Hitech City' },
  'S084': { lat: 17.410436, lng: 78.437346, name: 'Banjara Hills Road no.12' },
  'S085': { lat: 17.448893, lng: 78.363095, name: 'The Platina Gachibowli' },
  'S086': { lat: 17.434227, lng: 78.386593, name: 'Inorbit Mall-Hyderabad' },
  'S108': { lat: 17.230184, lng: 78.446482, name: 'Hyderabad Airport Inside' },
  'S123': { lat: 12.992624, lng: 80.217588, name: 'Phoenix Palladium Chennai' },
  'S143': { lat: 13.08261, lng: 80.244, name: 'Kilpauk' },
  'S144': { lat: 13.058784, lng: 80.263826, name: 'Express Avenue Mall' },
  'S145': { lat: 12.99881, lng: 80.25137, name: 'Adyar' },
  'S157': { lat: 13.007906, lng: 80.204072, name: 'Kathipara Urban Square' },
  'S201': { lat: 13.040724, lng: 80.215478, name: 'Ashok nagar' },
  'S160': { lat: 17.4775, lng: 78.424139, name: 'Store S160' },
  'S169': { lat: 17.40014, lng: 78.48694, name: 'Himayat Nagar' },
  'S175': { lat: 17.49483, lng: 78.33907, name: 'Madeenaguda' },
  'S178': { lat: 13.00093, lng: 80.26922, name: 'Besant Nagar' },
  'S194': { lat: 17.400472, lng: 78.36875, name: 'Manikonda' },
  'S215': { lat: 17.45827, lng: 78.4998, name: 'Store S215' },
  'S234': { lat: 17.429419, lng: 78.450035, name: 'Store S234' },
  'S239': { lat: 17.597736, lng: 78.1231, name: 'Store S239' },
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
 
