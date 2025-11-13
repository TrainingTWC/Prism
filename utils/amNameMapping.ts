/**
 * Area Manager ID to Name Mapping
 * This mapping is used to convert AM IDs from comprehensive_store_mapping.json to readable names
 */

export const AM_ID_TO_NAME: Record<string, string> = {
  'H3386': 'Abhishek',
  'H546': 'Ajay H',
  'H1815': 'Ajay Omnath Tiwari',
  'H535': 'Amar',
  'H2262': 'Anil Rawat',
  'H3270': 'Umakanth',
  'H955': 'Himanshu',
  'H2155': 'Jagruti',
  'H3362': 'Karthick G',
  'H2601': 'Kiran',
  'H2908': 'Shailesh',
  'H1355': 'Suresh A',
  'H3184': 'Vishal Vishwanath Khatakalle',
  'H1766': 'Vishu',
  'H1575': 'Vruchika',
  'H833': 'Nandish M',
  'H2396': 'Atul',
  'H2273': 'Sanjay',
  'H2758': 'Rutuja'
};

/**
 * Get AM name from ID
 */
export const getAMName = (amId: string): string => {
  return AM_ID_TO_NAME[amId] || amId;
};

/**
 * Get AM ID from name (reverse lookup)
 */
export const getAMId = (amName: string): string | null => {
  const entry = Object.entries(AM_ID_TO_NAME).find(([_, name]) => 
    name.toLowerCase() === amName.toLowerCase()
  );
  return entry ? entry[0] : null;
};

/**
 * Check if AM ID exists in mapping
 */
export const isValidAMId = (amId: string): boolean => {
  return amId in AM_ID_TO_NAME;
};
