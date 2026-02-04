// Google Sheets-based employee directory service
// Replaces Supabase with Google Apps Script endpoint

export type EmployeeRow = {
  employee_code: string;
  empname: string;
  date_of_joining?: string | null;
  designation?: string | null;
  location?: string | null;
  category?: string | null;
  store_code?: string | null;
};

export type EmployeeDirectory = {
  byId: Record<string, EmployeeRow>;
  nameById: Record<string, string>;
};

// Google Apps Script endpoint URL
const EMPLOYEE_API_URL = import.meta.env.VITE_EMPLOYEE_DIRECTORY_URL || '';

// Cache for employee directory data
let employeeDirectoryCache: EmployeeDirectory | null = null;

function normalizeId(id: string): string {
  return (id || '').toString().trim().toUpperCase();
}

export async function fetchEmployeeDirectory(): Promise<EmployeeDirectory> {
  // Return cached data if available
  if (employeeDirectoryCache) {
    console.log('[Employee Directory] Using cached data');
    return employeeDirectoryCache;
  }

  if (!EMPLOYEE_API_URL) {
    console.warn('[Employee Directory] No API URL configured. Set VITE_EMPLOYEE_DIRECTORY_URL in .env');
    return { byId: {}, nameById: {} };
  }

  try {
    console.log('[Employee Directory] Fetching from Google Sheets:', EMPLOYEE_API_URL);

    const response = await fetch(EMPLOYEE_API_URL);

    if (!response.ok) {
      console.error('[Employee Directory] HTTP error:', response.status, response.statusText);
      return { byId: {}, nameById: {} };
    }

    const data = await response.json();

    if (data.error) {
      console.error('[Employee Directory] API error:', data.error);
      return { byId: {}, nameById: {} };
    }

    const employees = data.employees || [];
    console.log('[Employee Directory] Received', employees.length, 'employees');

    const byId: Record<string, EmployeeRow> = {};
    const nameById: Record<string, string> = {};

    for (const emp of employees) {
      if (!emp.employee_code) continue;

      const key = normalizeId(emp.employee_code);
      byId[key] = {
        employee_code: emp.employee_code,
        empname: emp.empname || '',
        date_of_joining: emp.date_of_joining,
        designation: emp.designation,
        location: emp.location,
        category: emp.category,
        store_code: emp.store_code
      };
      nameById[key] = emp.empname || emp.employee_code;
    }

    console.log('[Employee Directory] Processed', Object.keys(byId).length, 'unique employees');
    
    // Cache the results
    employeeDirectoryCache = { byId, nameById };
    return employeeDirectoryCache;

  } catch (error) {
    console.error('[Employee Directory] Fetch failed:', error);
    return { byId: {}, nameById: {} };
  }
}
