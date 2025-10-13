import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_CONFIG, RoleConfig } from '../config/auth';

export type UserRole = 'operations' | 'hr' | 'qa' | 'training' | 'finance' | 'admin';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  roleConfig: RoleConfig | null;
  login: (password: string) => { success: boolean; role?: UserRole };
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasDashboardAccess: (dashboard: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const authStatus = localStorage.getItem(AUTH_CONFIG.storageKeys.auth);
      const authTimestamp = localStorage.getItem(AUTH_CONFIG.storageKeys.timestamp);
      const storedRole = localStorage.getItem(AUTH_CONFIG.storageKeys.role) as UserRole;

      if (authStatus === 'true' && authTimestamp && storedRole) {
        const timestamp = parseInt(authTimestamp, 10);
        const now = Date.now();

        // Check if the session is still valid
        if (now - timestamp < AUTH_CONFIG.sessionDuration) {
          const config = AUTH_CONFIG.roles[storedRole];
          if (config) {
            setIsAuthenticated(true);
            setUserRole(storedRole);
            setRoleConfig(config);
          } else {
            logout();
          }
        } else {
          // Session expired, clear storage
          logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (password: string): { success: boolean; role?: UserRole } => {
    // Check password against all roles
    for (const [roleName, config] of Object.entries(AUTH_CONFIG.roles)) {
      if (password === config.password) {
        try {
          const role = roleName as UserRole;
          localStorage.setItem(AUTH_CONFIG.storageKeys.auth, 'true');
          localStorage.setItem(AUTH_CONFIG.storageKeys.timestamp, Date.now().toString());
          localStorage.setItem(AUTH_CONFIG.storageKeys.role, role);
          
          setIsAuthenticated(true);
          setUserRole(role);
          setRoleConfig(config);
          
          return { success: true, role };
        } catch (error) {
          console.error('Error saving auth status:', error);
          return { success: false };
        }
  const logout = () => {
    try {
      localStorage.removeItem(AUTH_CONFIG.storageKeys.auth);
      localStorage.removeItem(AUTH_CONFIG.storageKeys.timestamp);
      localStorage.removeItem(AUTH_CONFIG.storageKeys.role);
    } catch (error) {
      console.error('Error clearing auth status:', error);
    }
    setIsAuthenticated(false);
    setUserRole(null);
    setRoleConfig(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!roleConfig) return false;
    return roleConfig.permissions.includes(permission) || roleConfig.permissions.includes('admin');
  };

  const hasDashboardAccess = (dashboard: string): boolean => {
    if (!roleConfig) return false;
    return roleConfig.dashboardAccess.includes(dashboard) || 
           roleConfig.dashboardAccess.includes('all') ||
           roleConfig.permissions.includes('admin');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userRole, 
      roleConfig,
      login, 
      logout, 
      isLoading,
      hasPermission,
      hasDashboardAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};