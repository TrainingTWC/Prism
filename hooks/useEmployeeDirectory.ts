import { useEffect, useMemo, useState } from 'react';
import { fetchEmployeeDirectory, type EmployeeDirectory } from '../services/employeeDirectoryService';

// Cache for employee directory (shared across all hook instances)
let cachedDirectory: EmployeeDirectory | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export function useEmployeeDirectory() {
  const [directory, setDirectory] = useState<EmployeeDirectory>({ byId: {}, nameById: {} });
  const [loading, setLoading] = useState<boolean>(false); // Start false to not block UI

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Check if cache is still valid
      const now = Date.now();
      if (cachedDirectory && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('[useEmployeeDirectory] Using cached data');
        setDirectory(cachedDirectory);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('[useEmployeeDirectory] Fetching fresh data from Google Sheets');
        const data = await fetchEmployeeDirectory();
        
        if (!cancelled) {
          // Update cache
          cachedDirectory = data;
          cacheTimestamp = Date.now();
          
          setDirectory(data);
          console.log('[useEmployeeDirectory] Loaded employees:', Object.keys(data.byId).length);
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
