/**
 * React Hook for accessing comprehensive store mapping data
 */

import { useState, useEffect } from 'react';
import { 
  loadComprehensiveMapping, 
  getAreaManagersFromMapping,
  getStoresForAM,
  getAMForStore,
  getRegionForStore,
  type ComprehensiveMapping 
} from '../utils/mappingUtils';

interface AreaManager {
  id: string;
  name: string;
  storeCount?: number;
  regions?: string[];
}

interface Store {
  id: string;
  name: string;
  region: string;
  amId?: string;
}

/**
 * Hook to load comprehensive store mapping
 */
export const useComprehensiveMapping = () => {
  const [mapping, setMapping] = useState<ComprehensiveMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadComprehensiveMapping();
        setMapping(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mapping');
        console.error('Error loading comprehensive mapping:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { mapping, loading, error };
};

/**
 * Hook to get Area Managers from comprehensive mapping
 */
export const useAreaManagers = () => {
  const [areaManagers, setAreaManagers] = useState<AreaManager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAMs = async () => {
      try {
        setLoading(true);
        const ams = await getAreaManagersFromMapping();
        setAreaManagers(ams);
      } catch (err) {
        console.error('Error loading area managers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAMs();
  }, []);

  return { areaManagers, loading };
};

/**
 * Hook to get stores for a specific Area Manager
 */
export const useStoresForAM = (amId: string | null) => {
  const [stores, setStores] = useState<ComprehensiveMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!amId) {
      setStores([]);
      setLoading(false);
      return;
    }

    const loadStores = async () => {
      try {
        setLoading(true);
        const amStores = await getStoresForAM(amId);
        setStores(amStores);
      } catch (err) {
        console.error('Error loading stores for AM:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [amId]);

  return { stores, loading };
};

/**
 * Hook to get AM and region for a specific store
 */
export const useStoreDetails = (storeId: string | null) => {
  const [amId, setAmId] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setAmId(null);
      setRegion(null);
      setLoading(false);
      return;
    }

    const loadDetails = async () => {
      try {
        setLoading(true);
        const [am, reg] = await Promise.all([
          getAMForStore(storeId),
          getRegionForStore(storeId)
        ]);
        setAmId(am);
        setRegion(reg);
      } catch (err) {
        console.error('Error loading store details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [storeId]);

  return { amId, region, loading };
};

/**
 * Hook to validate store-AM relationship
 */
export const useValidateStoreAM = (storeId: string | null, amId: string | null) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId || !amId) {
      setIsValid(null);
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        setLoading(true);
        const { validateStoreAMMapping } = await import('../utils/mappingUtils');
        const valid = await validateStoreAMMapping(storeId, amId);
        setIsValid(valid);
      } catch (err) {
        console.error('Error validating store-AM mapping:', err);
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [storeId, amId]);

  return { isValid, loading };
};
