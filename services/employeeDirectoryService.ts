import { supabase } from './supabaseClient';

export type EmployeeRow = {
  employee_code: string;
  empname: string;
  employee_status?: string | null;
  region?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  official_email?: string | null;
  store_code?: string | null;
  designation?: string | null;
  tenure?: string | null;
  join_date?: string | null;
};

export type EmployeeDirectory = {
  byId: Record<string, EmployeeRow>;
  nameById: Record<string, string>;
};

const DEFAULT_TABLE = 'employee_master';

function normalizeId(id: string): string {
  return (id || '').toString().trim().toUpperCase();
}

export async function fetchEmployeeDirectory(options?: {
  table?: string;
  onlyExisting?: boolean;
}): Promise<EmployeeDirectory> {
  if (!supabase) {
    return { byId: {}, nameById: {} };
  }

  const table = options?.table || (import.meta.env.VITE_SUPABASE_EMPLOYEE_TABLE as string | undefined) || DEFAULT_TABLE;
  const onlyExisting = options?.onlyExisting ?? true;

  // Fetch all records using pagination (Supabase has 1000 row default limit)
  const allData: any[] = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Try to fetch all columns first, then filter what we need
    // This handles different column name cases in the table
    let query = supabase
      .from(table)
      .select('*')
      .range(from, to);

    if (onlyExisting) {
      // Try both variations of the Employee_Status column
      query = query.or('Employee_Status.eq.Existing,employee_status.eq.Existing');
    }

    const { data, error } = await query;
    
    if (error) {
      console.warn('[Supabase] fetchEmployeeDirectory failed:', error.message);
      console.warn('[Supabase] Error details:', error);
      break;
    }

    if (data && data.length > 0) {
      allData.push(...data);
      hasMore = data.length === pageSize; // Continue if we got a full page
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log('[Supabase] fetchEmployeeDirectory:', { 
    rowsReturned: allData.length, 
    pages: page,
    table,
    onlyExisting,
    firstRow: allData[0] // Log first row to see column structure
  });

  const byId: Record<string, EmployeeRow> = {};
  const nameById: Record<string, string> = {};

  for (const row of allData) {
    // Handle different possible column name variations
    const employeeCode = row?.employee_Code || row?.employee_code || row?.Employee_Code || row?.['Employee Code'];
    const empName = row?.EmpName || row?.empname || row?.Empname || row?.['Employee Name'];
    const employeeStatus = row?.Employee_Status || row?.employee_status || row?.['Employee Status'];
    const storeCode = row?.['Store Code'] || row?.store_code || row?.Store_Code;
    
    if (!employeeCode) continue;
    
    const key = normalizeId(employeeCode);
    byId[key] = {
      employee_code: employeeCode,
      empname: empName,
      employee_status: employeeStatus,
      store_code: storeCode
    } as EmployeeRow;
    nameById[key] = empName || employeeCode;
  }

  return { byId, nameById };
}
