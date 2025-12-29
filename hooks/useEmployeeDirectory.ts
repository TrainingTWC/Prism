import { useEffect, useMemo, useState } from 'react';
import { fetchEmployeeDirectory, type EmployeeDirectory } from '../services/employeeDirectoryService';
import { isSupabaseConfigured } from '../services/supabaseClient';

export function useEmployeeDirectory() {
  const [directory, setDirectory] = useState<EmployeeDirectory>({ byId: {}, nameById: {} });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        if (!isSupabaseConfigured()) {
          console.warn('[useEmployeeDirectory] Supabase not configured');
          return;
        }
        
        const table = (import.meta.env.VITE_SUPABASE_EMPLOYEE_TABLE as string | undefined) || undefined;
        // Fetch ALL employees, not just 'Existing' status
        const data = await fetchEmployeeDirectory({ table, onlyExisting: false });
        
        if (!cancelled) {
          setDirectory(data);
          console.log('[useEmployeeDirectory] Loaded employees from Supabase:', Object.keys(data.byId).length);
        }
      } catch (error) {
        console.error('[useEmployeeDirectory] Error loading employees:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const getName = useMemo(() => {
    return (employeeId: string): string => {
      const key = (employeeId || '').toString().trim().toUpperCase();
      return directory.nameById[key] || employeeId;
    };
  }, [directory.nameById]);

  return { directory, loading, getName };
}
