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

  // NOTE: column names here assume you created a table/view with snake_case columns.
  // If your columns differ, update this select list to match.
  let query = supabase
    .from(table)
    .select('employee_code, empname, employee_status, region, location, city, state, official_email, store_code');

  if (onlyExisting) {
    query = query.eq('employee_status', 'Existing');
  }

  const { data, error } = await query;
  if (error) {
    console.warn('[Supabase] fetchEmployeeDirectory failed:', error.message);
    return { byId: {}, nameById: {} };
  }

  const byId: Record<string, EmployeeRow> = {};
  const nameById: Record<string, string> = {};

  for (const row of (data || []) as EmployeeRow[]) {
    if (!row?.employee_code) continue;
    const id = normalizeId(row.employee_code);
    byId[id] = row;
    if (row.empname) nameById[id] = row.empname;
  }

  return { byId, nameById };
}
