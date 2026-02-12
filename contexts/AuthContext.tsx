import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_CONFIG, RoleConfig } from '../config/auth';

export type UserRole = 'operations' | 'hr' | 'qa' | 'training' | 'finance' | 'forms' | 'campus-hiring' | 'bench-planning' | 'admin' | 'editor';

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

  // Helper function to check if email is in campus hiring candidate list
  const checkCampusHiringCandidate = async (email: string): Promise<boolean> => {
    try {

      // Try multiple paths for the JSON file
      const paths = [
        '/IHM_Mumbai.json',
        '/Prism/IHM_Mumbai.json',
        './IHM_Mumbai.json',
        '../IHM_Mumbai.json'
      ];

      for (const path of paths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const data = await response.json();

            // Check if email exists in candidates list (case-insensitive)
            const candidate = data.candidates?.find(
              (c: any) => c.email.toLowerCase() === email.toLowerCase()
            );

            if (candidate) {
              return true;
            }

            return false;
          }
        } catch (err) {
          // Continue to next path
        }
      }

      return false;
    } catch (error) {
      console.error('[Auth] Error checking campus hiring candidate:', error);
      return false;
    }
  };

  // Helper function to check if employee ID exists in bench planning Google Sheet
  const checkBenchPlanningEmployee = async (empId: string): Promise<boolean> => {
    try {

      // TODO: Update this URL with your deployed Google Apps Script URL
      const BENCH_PLANNING_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

      // Skip if endpoint not configured
      if (BENCH_PLANNING_ENDPOINT === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        return false;
      }

      const response = await fetch(`${BENCH_PLANNING_ENDPOINT}?action=getCandidateData&employeeId=${empId}`);
      const data = await response.json();

      if (data.success && data.candidate) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Auth] Error checking bench planning employee:', error);
      return false;
    }
  };

  const loginWithEmpId = async (empId: string): Promise<boolean> => {
    try {

      // First, check if this is a bench planning employee
      const isBenchPlanningEmployee = await checkBenchPlanningEmployee(empId);

      if (isBenchPlanningEmployee) {

        // Auto-authenticate as bench-planning role without password
        const benchRole: UserRole = 'bench-planning';
        const config = AUTH_CONFIG.roles[benchRole];

        if (config) {
          localStorage.setItem(AUTH_CONFIG.storageKeys.auth, 'true');
          localStorage.setItem(AUTH_CONFIG.storageKeys.timestamp, Date.now().toString());
          localStorage.setItem(AUTH_CONFIG.storageKeys.role, benchRole);

          setIsAuthenticated(true);
          setUserRole(benchRole);
          setRoleConfig(config);

          const employeeInfo: Employee = {
            code: empId,
            name: `Bench Planning: ${empId}`
          };

          setEmployeeData(employeeInfo);
          setIsEmployeeValidated(true);
          localStorage.setItem('auth_employee', JSON.stringify(employeeInfo));
          localStorage.setItem('employee_validated', 'true');

          return true;
        }
      }

      // Then check if this is a campus hiring candidate (email format check)
      const isCampusCandidate = await checkCampusHiringCandidate(empId);

      if (isCampusCandidate) {

        // Auto-authenticate as campus-hiring role without password
        const campusRole: UserRole = 'campus-hiring';
        const config = AUTH_CONFIG.roles[campusRole];

        if (config) {
          localStorage.setItem(AUTH_CONFIG.storageKeys.auth, 'true');
          localStorage.setItem(AUTH_CONFIG.storageKeys.timestamp, Date.now().toString());
          localStorage.setItem(AUTH_CONFIG.storageKeys.role, campusRole);

          setIsAuthenticated(true);
          setUserRole(campusRole);
          setRoleConfig(config);

          const employeeInfo: Employee = {
            code: empId,
            name: `Campus Candidate: ${empId}`
          };

          setEmployeeData(employeeInfo);
          setIsEmployeeValidated(true);
          localStorage.setItem('auth_employee', JSON.stringify(employeeInfo));
          localStorage.setItem('employee_validated', 'true');

          return true;
        }
      }

      // CRITICAL: Clear authentication FIRST before any state updates
      // This must happen synchronously to prevent race conditions
      try {
        localStorage.removeItem(AUTH_CONFIG.storageKeys.auth);
        localStorage.removeItem(AUTH_CONFIG.storageKeys.timestamp);
        localStorage.removeItem(AUTH_CONFIG.storageKeys.role);
      } catch (e) {
        console.error('[Auth] Error clearing localStorage:', e);
      }

      // UNIVERSAL ACCESS: Accept ANY employee ID without validation
      // This allows all employee IDs (including i192 and any format) to access the system
      
      // Auto-authenticate as admin role for everyone else if no password is required
      const defaultRole: UserRole = 'admin';
      const config = AUTH_CONFIG.roles[defaultRole];

      if (config) {
        localStorage.setItem(AUTH_CONFIG.storageKeys.auth, 'true');
        localStorage.setItem(AUTH_CONFIG.storageKeys.timestamp, Date.now().toString());
        localStorage.setItem(AUTH_CONFIG.storageKeys.role, defaultRole);

        setIsAuthenticated(true);
        setUserRole(defaultRole);
        setRoleConfig(config);
      }

      const employeeInfo: Employee = {
        code: empId,
        name: `Employee ${empId}` // Generic name if not found in database
      };

      // Try to fetch real employee data from Supabase
      try {
        const { fetchEmployeeDirectory } = await import('../services/employeeDirectoryService');
        const { isSupabaseConfigured } = await import('../services/supabaseClient');

        if (isSupabaseConfigured()) {
          const data = await fetchEmployeeDirectory({ onlyExisting: false });

          // Case-insensitive search for employee
          const normalizedEmpId = empId.trim().toUpperCase();
          const foundEmployee = data.byId[normalizedEmpId];

          if (foundEmployee) {
            employeeInfo.code = foundEmployee.employee_code;
            employeeInfo.name = foundEmployee.empname;
          } else {
            console.log('[Auth] ℹ️ Employee not in Supabase, using generic info');
          }
        } else {
          console.log('[Auth] ℹ️ Supabase not configured, checking JSON fallback');

          // Fallback to JSON file if Supabase not configured
          const response = await fetch('/Prism/employee_data.json');
          const employees: Employee[] = await response.json();
          console.log('[Auth] Loaded', employees.length, 'employees from JSON');

          const foundEmployee = employees.find(
            emp => emp.code.toLowerCase() === empId.toLowerCase()
          );

          if (foundEmployee) {
            console.log('[Auth] ✅ Found employee in JSON:', foundEmployee);
            employeeInfo.code = foundEmployee.code;
            employeeInfo.name = foundEmployee.name;
          } else {
            console.log('[Auth] ℹ️ Employee not in JSON, using generic info');
          }
        }
      } catch (error) {
        console.log('[Auth] ℹ️ Could not load employee database, using generic info:', error);
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