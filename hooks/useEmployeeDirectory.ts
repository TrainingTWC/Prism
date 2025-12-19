import { useEffect, useMemo, useState } from 'react';
import { fetchEmployeeDirectory, type EmployeeDirectory } from '../services/employeeDirectoryService';
import { isSupabaseConfigured } from '../services/supabaseClient';

export function useEmployeeDirectory() {
  const [directory, setDirectory] = useState<EmployeeDirectory>({ byId: {}, nameById: {} });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isSupabaseConfigured()) return;
      setLoading(true);
      try {
        const table = (import.meta.env.VITE_SUPABASE_EMPLOYEE_TABLE as string | undefined) || undefined;
        const data = await fetchEmployeeDirectory({ table, onlyExisting: true });
        if (!cancelled) setDirectory(data);
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
