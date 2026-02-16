
import React, { useState, useEffect } from 'react';
import { BarChart3, Brain, CheckSquare, HelpCircle, Users, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AIInsights from './components/AIInsights';
import ChecklistsAndSurveys from './components/ChecklistsAndSurveys';
import Header from './components/Header';
import Login from './components/Login';
import AccessDenied from './components/AccessDenied';
import { getUserRole, UserRole } from './roleMapping';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import AdminConfig from './components/AdminConfig';
import { startPreload } from './services/preloadService';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [empIdChecked, setEmpIdChecked] = useState<boolean>(false);
  const { 
    isAuthenticated, 
    userRole: authUserRole, 
    isLoading: authLoading, 
    loginWithEmpId, 
    isEmployeeValidated, 
    employeeData,
    hasPermission,
    hasDashboardAccess
  } = useAuth();

  // Start background preload on app mount (before authentication)
  useEffect(() => {
    console.log('🚀 [App] Starting background preload...');
    startPreload();
  }, []);

  // Sync userRole when user gets authenticated (after password login or campus auto-auth)
  useEffect(() => {
    if (isAuthenticated && (employeeData || userId) && !userRole) {
      const code = employeeData?.code || userId;
      if (!code) return;

      try {
        const role = getUserRole(code);
        
        // Map the authRole (from password) to a data filtering role if no specific mapping exists
        let mappedDataRole = 'admin'; // Fallback
        
        if (authUserRole === 'operations') mappedDataRole = 'area_manager';
        else if (authUserRole === 'hr') mappedDataRole = 'hrbp';
        else if (authUserRole === 'qa') mappedDataRole = 'admin';
        else if (authUserRole === 'training') mappedDataRole = 'trainer';
        else if (authUserRole === 'finance') mappedDataRole = 'admin';
        else if (authUserRole === 'store') mappedDataRole = 'store';
        else if (authUserRole === 'campus-hiring') mappedDataRole = 'campus-hiring';
        else if (authUserRole === 'admin' || authUserRole === 'editor') mappedDataRole = 'admin';

        setUserRole(role || { 
          userId: code, 
          name: employeeData?.name || code, 
          role: mappedDataRole as any, 
          allowedStores: [], // Empty means see all stores for that role type
          allowedAMs: [], 
          allowedHRs: [] 
        } as UserRole);
      } catch (error) {
        console.error('[App] Error getting user role:', error);
        setUserRole({ 
          userId: code, 
          name: employeeData?.name || code, 
          role: 'admin', 
          allowedStores: [], 
          allowedAMs: [], 
          allowedHRs: [] 
        } as UserRole);
      }
    }
  }, [isAuthenticated, employeeData, userId, userRole, authUserRole]);

  // Check URL for EMPID - ONCE on mount
  useEffect(() => {
    const checkUrlAuth = async () => {
      // Only check once
      if (empIdChecked) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const empId = urlParams.get('EMPID');
      
      if (empId) {
        // EMPID present - set user ID and validate identity
        setUserId(empId);
        setAccessDenied(false);
        
        // Ensure identity is validated even if not authenticated via password yet
        if (!isAuthenticated) {
          console.log(`[App] 🔍 Validating EMPID identity: ${empId}`);
          try {
            await loginWithEmpId(empId);
            // This populates employeeData but requires a password if not a special role
          } catch (error) {
            console.error('[App] Error during ID validation:', error);
          }
        } else {
          // If already authenticated, ensure userRole is synced
          try {
            const role = getUserRole(empId);
            setUserRole(role || { 
              userId: empId, 
              name: `User ${empId}`, 
              role: 'admin', 
              allowedStores: [], 
              allowedAMs: [], 
              allowedHRs: [] 
            } as UserRole);
          } catch (error) {
            setUserRole({ 
              userId: empId, 
              name: `User ${empId}`, 
              role: 'admin', 
              allowedStores: [], 
              allowedAMs: [], 
              allowedHRs: [] 
            } as UserRole);
          }
        }
      } else {
        // No EMPID in URL - show access denied
        setAccessDenied(true);
      }
      
      setEmpIdChecked(true);
      setLoading(false);
    };

    if (!authLoading && !empIdChecked) {
      checkUrlAuth();
    }
  }, [authLoading, empIdChecked, isAuthenticated]);

  // Get user ID from URL parameters - kept for backward compatibility
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId') || urlParams.get('id') || urlParams.get('user');
    const hrIdParam = urlParams.get('hrId') || urlParams.get('hr_id');
    
    // If HR ID is present, default to checklists tab
    if (hrIdParam) {
      setActiveTab('checklists');
    }
    
    if (userIdParam && !urlParams.get('EMPID')) {
      setUserId(userIdParam);
      const role = getUserRole(userIdParam);
      setUserRole(role);
      
      if (!role) {
        console.warn(`No role found for user ID: ${userIdParam}`);
      }
    }
  }, []);

  // Set default tab if current one is not allowed - MUST be before any conditional returns
  useEffect(() => {
    if (isAuthenticated && !hasPermission('dashboard') && activeTab === 'dashboard') {
      setActiveTab('checklists');
    }
  }, [isAuthenticated, activeTab, hasPermission]);

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }


  // Show ACCESS DENIED if EMPID not provided
  if (accessDenied) {
    return <AccessDenied />;
  }

  // Show login/password page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  if (!userRole) {
    // If we have an EMPID but mapping is still loading, show a loading state instead of Access Denied.
    if (userId) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-slate-400">Loading profile for {userId}...</p>
            <p className="text-gray-400 dark:text-slate-500 text-xs mt-2">Setting up permissions...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-500 dark:text-slate-400">User ID "{userId}" not found or not authorized.</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const isEditor = authUserRole === 'editor' || authUserRole === 'admin';
  
  const tabs = [];
  if (hasPermission('dashboard')) {
    tabs.push({ id: 'dashboard', label: 'Dashboard', icon: BarChart3 });
  }
  
  tabs.push({ id: 'checklists', label: 'Checklists & Surveys', icon: CheckSquare });
  
  if (isEditor) {
    tabs.push({ id: 'admin', label: 'Admin', icon: HelpCircle });
  }

  // For all other roles, show the normal interface
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
      <Header />
      
      {/* Tab Navigation */}
      <nav className="px-2 sm:px-4 lg:px-8 border-b border-gray-200 dark:border-slate-700">
        <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 outline-none ${
                  activeTab === tab.id
                    ? 'border-sky-400 text-sky-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-300'
                }`}
              >
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="p-2 sm:p-4 lg:p-8">
        {activeTab === 'dashboard' && hasPermission('dashboard') && <Dashboard userRole={userRole} />}
        {activeTab === 'ai-insights' && hasPermission('dashboard') && <AIInsights userRole={userRole} />}
        {activeTab === 'checklists' && <ChecklistsAndSurveys userRole={userRole} />}
        {activeTab === 'admin' && isEditor && <AdminConfig />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ConfigProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </ConfigProvider>
    </AuthProvider>
  );
};

export default App;
