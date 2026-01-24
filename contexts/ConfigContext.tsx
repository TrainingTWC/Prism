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
      let res = await fetch('/api/config');

      // If API fails (like on GitHub Pages), try loading static config.json
      if (!res.ok) {
        console.log('[ConfigContext] API failed, trying static config.json...');
        res = await fetch('/config.json');
      }

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
      } else if (data && !data.config) {
        // Static config.json has data directly, not wrapped in { ok, config }
        const merged = { ...Defaults, ...data };
        console.log('[ConfigContext] Merged config from static file:', merged);
        setConfig(merged);
      } else {
        console.warn('[ConfigContext] No config data, using defaults only');
        setConfig({ ...Defaults });
      }
    } catch (e) {
      console.error('[ConfigContext] Error fetching config:', e);
      // Try to load static config.json as last resort
      try {
        console.log('[ConfigContext] Trying static config.json as fallback...');
        const res = await fetch('/config.json');
        const data = await res.json();
        const merged = { ...Defaults, ...data };
        console.log('[ConfigContext] Loaded from static config.json:', merged);
        setConfig(merged);
      } catch (fallbackError) {
        console.error('[ConfigContext] Fallback also failed, using defaults:', fallbackError);
        setConfig({ ...Defaults });
      }
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
