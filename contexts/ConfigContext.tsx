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
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data && data.ok && data.config) {
        setConfig({ ...Defaults, ...data.config });
      } else if (data && data.config) {
        setConfig({ ...Defaults, ...data.config });
      } else {
        setConfig({ ...Defaults });
      }
    } catch (e) {
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
