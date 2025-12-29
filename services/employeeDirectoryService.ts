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

    let query = supabase
      .from(table)
      .select('employee_Code, EmpName, Employee_Status, "Store Code"')
      .range(from, to);

    if (onlyExisting) {
      query = query.eq('Employee_Status', 'Existing');
    }

    const { data, error } = await query;
    
    if (error) {
      console.warn('[Supabase] fetchEmployeeDirectory failed:', error.message);
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
    onlyExisting 
  });

  const byId: Record<string, EmployeeRow> = {};
  const nameById: Record<string, string> = {};

  for (const row of allData) {
    if (!row?.employee_Code) continue;
    const key = normalizeId(row.employee_Code);
    byId[key] = {
      employee_code: row.employee_Code,
      empname: row.EmpName,
      employee_status: row.Employee_Status,
      store_code: row['Store Code']
    } as EmployeeRow;
    nameById[key] = row.EmpName || row.employee_Code;
  }

  return { byId, nameById };
}
