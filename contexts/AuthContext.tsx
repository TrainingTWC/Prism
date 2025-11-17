import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_CONFIG, RoleConfig } from '../config/auth';

export type UserRole = 'operations' | 'hr' | 'qa' | 'training' | 'finance' | 'forms' | 'campus-hiring' | 'admin' | 'editor';

interface Employee {
  code: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  roleConfig: RoleConfig | null;
  employeeData: Employee | null;
  isEmployeeValidated: boolean;
  login: (password: string) => { success: boolean; role?: UserRole };
  loginWithEmpId: (empId: string) => Promise<boolean>;
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
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [isEmployeeValidated, setIsEmployeeValidated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_CONFIG.storageKeys.auth);
      localStorage.removeItem(AUTH_CONFIG.storageKeys.timestamp);
      localStorage.removeItem(AUTH_CONFIG.storageKeys.role);
      localStorage.removeItem('auth_employee');
      localStorage.removeItem('employee_validated');
    } catch (error) {
      console.error('Error clearing auth status:', error);
    }
    setIsAuthenticated(false);
    setUserRole(null);
    setRoleConfig(null);
    setEmployeeData(null);
    setIsEmployeeValidated(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const authStatus = localStorage.getItem(AUTH_CONFIG.storageKeys.auth);
      const authTimestamp = localStorage.getItem(AUTH_CONFIG.storageKeys.timestamp);
      const storedRole = localStorage.getItem(AUTH_CONFIG.storageKeys.role) as UserRole;
      const storedEmployee = localStorage.getItem('auth_employee');
      const employeeValidated = localStorage.getItem('employee_validated');

      // Check employee validation status
      if (employeeValidated === 'true' && storedEmployee) {
        try {
          setEmployeeData(JSON.parse(storedEmployee));
          setIsEmployeeValidated(true);
        } catch (e) {
          console.error('Error parsing stored employee:', e);
        }
      }

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

  const loginWithEmpId = async (empId: string): Promise<boolean> => {
    try {
      console.log('[Auth] Attempting login with EMPID:', empId);
      
      // Clear any existing password-based authentication
      // because EMPID login requires fresh password entry
      localStorage.removeItem(AUTH_CONFIG.storageKeys.auth);
      localStorage.removeItem(AUTH_CONFIG.storageKeys.timestamp);
      localStorage.removeItem(AUTH_CONFIG.storageKeys.role);
      setIsAuthenticated(false);
      setUserRole(null);
      setRoleConfig(null);
      
      // UNIVERSAL ACCESS: Accept ANY employee ID without validation
      // This allows all employee IDs (including i192 and any format) to access the system
      console.log('[Auth] ✅ Universal access enabled - accepting all employee IDs');
      
      const employeeInfo: Employee = {
        code: empId,
        name: `Employee ${empId}` // Generic name if not found in database
      };
      
      // Optionally try to fetch real employee data for display purposes
      try {
        const response = await fetch('/Prism/employee_data.json');
        const employees: Employee[] = await response.json();
        console.log('[Auth] Loaded', employees.length, 'employees from database');
        
        // Case-insensitive search for employee
        const foundEmployee = employees.find(
          emp => emp.code.toLowerCase() === empId.toLowerCase()
        );

        if (foundEmployee) {
          console.log('[Auth] ✅ Found employee in database:', foundEmployee);
          employeeInfo.code = foundEmployee.code;
          employeeInfo.name = foundEmployee.name;
        } else {
          console.log('[Auth] ℹ️ Employee not in database, using generic info');
        }
      } catch (error) {
        console.log('[Auth] ℹ️ Could not load employee database, using generic info');
      }
      
      // Store employee data in localStorage (persists across browser sessions)
      setEmployeeData(employeeInfo);
      setIsEmployeeValidated(true);
      localStorage.setItem('auth_employee', JSON.stringify(employeeInfo));
      localStorage.setItem('employee_validated', 'true');
      
      console.log('[Auth] Employee validated with ID:', employeeInfo.code);
      return true;
    } catch (error) {
      console.error('[Auth] Error during login:', error);
      // Even on error, allow access (universal access mode)
      const fallbackEmployee: Employee = {
        code: empId,
        name: `Employee ${empId}`
      };
      setEmployeeData(fallbackEmployee);
      setIsEmployeeValidated(true);
      localStorage.setItem('auth_employee', JSON.stringify(fallbackEmployee));
      localStorage.setItem('employee_validated', 'true');
      return true;
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
      }
    }
    return { success: false };
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
      employeeData,
      isEmployeeValidated,
      login, 
      loginWithEmpId,
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