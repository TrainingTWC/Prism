import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Defaults from '../constants';

type ConfigShape = any;

interface ConfigContextValue {
  config: ConfigShape;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (newConfig: ConfigShape) => Promise<boolean>;
  get: (key: string) => any;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfigShape>({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      console.log('[ConfigContext] Fetching config from /api/config...');
      const res = await fetch('/api/config');
      const data = await res.json();
      console.log('[ConfigContext] API Response:', data);
      console.log('[ConfigContext] data.config.CHECKLISTS:', data?.config?.CHECKLISTS);
      console.log('[ConfigContext] Defaults:', Defaults);
      
      if (data && data.ok && data.config) {
        const merged = { ...Defaults, ...data.config };
        console.log('[ConfigContext] Merged config:', merged);
        console.log('[ConfigContext] Merged CHECKLISTS:', merged.CHECKLISTS);
        setConfig(merged);
      } else if (data && data.config) {
        const merged = { ...Defaults, ...data.config };
        console.log('[ConfigContext] Merged config (no ok flag):', merged);
        setConfig(merged);
      } else {
        console.warn('[ConfigContext] No config data, using defaults only');
        setConfig({ ...Defaults });
      }
    } catch (e) {
      console.error('[ConfigContext] Error fetching config:', e);
      setConfig({ ...Defaults });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const refresh = async () => { await fetchConfig(); };

  const save = async (newConfig: ConfigShape) => {
    try {
      const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newConfig) });
      const data = await res.json();
      if (data && data.ok) {
        setConfig({ ...Defaults, ...newConfig });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const get = (key: string) => {
    if (!config) return undefined;
    return (config as any)[key] ?? (Defaults as any)[key];
  };

  return (
    <ConfigContext.Provider value={{ config, loading, refresh, save, get }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};

export default ConfigContext;
