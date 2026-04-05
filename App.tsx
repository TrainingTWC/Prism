
import React, { useState, useEffect, Suspense, lazy } from 'react';
const Dashboard = lazy(() => import('./components/Dashboard'));
const ChecklistsAndSurveys = lazy(() => import('./components/ChecklistsAndSurveys'));
import TopBar from './components/TopBar';
import Sidebar, { SidebarSection } from './components/Sidebar';
import Login from './components/Login';
import AccessDenied from './components/AccessDenied';
import { getUserRole, UserRole } from './roleMapping';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
const HomePage = lazy(() => import('./components/HomePage'));
import { startPreload } from './services/preloadService';

const AppContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SidebarSection>('home');
  const [dashboardType, setDashboardType] = useState<string>('');
  const [activeChecklist, setActiveChecklist] = useState<string>('');
  const [qaSubTab, setQaSubTab] = useState<'stores' | 'vendors'>('stores');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
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
      setActiveSection('checklists');
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

  // Set default section if current one is not allowed
  useEffect(() => {
    if (isAuthenticated && !hasPermission('dashboard') && activeSection === 'dashboard') {
      setActiveSection('checklists');
    }
  }, [isAuthenticated, activeSection, hasPermission]);

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

  // Build available dashboards list (same logic as Dashboard component)
  const getAvailableDashboardTypes = () => {
    const allTypes = [
      { id: 'map-view', label: 'Map View' },
      { id: 'hr', label: 'HR' },
      { id: 'operations', label: 'Operations' },
      { id: 'training', label: 'Training' },
      { id: 'qa', label: 'QA' },
      { id: 'finance', label: 'Finance' },
      { id: 'shlp', label: 'SHLP' },
      { id: 'campus-hiring', label: 'Campus Hiring' },
      { id: 'trainer-calendar', label: 'Trainer Calendar' },
      { id: 'bench-planning', label: 'Bench Planning' },
      { id: 'bench-planning-sm-asm', label: 'Bench Planning (SM-ASM)' },
      { id: 'consolidated', label: 'Consolidated' },
    ];
    if (authUserRole === 'editor') return allTypes;
    return allTypes.filter(type => {
      if (type.id === 'consolidated') return false;
      if (type.id === 'map-view') return false;
      return hasDashboardAccess(type.id + '-dashboard');
    });
  };

  // Build available checklists list
  const getAvailableChecklists = () => {
    const allChecklists = [
      { id: 'hr', label: 'HR' },
      { id: 'operations', label: 'Operations' },
      { id: 'training', label: 'Training' },
      { id: 'qa', label: 'QA' },
      { id: 'finance', label: 'Finance' },
      { id: 'shlp', label: 'SHLP' },
      { id: 'campus-hiring', label: 'Campus Hiring' },
      { id: 'forms', label: 'Forms & Surveys' },
      { id: 'trainer-calendar', label: 'Trainer Calendar' },
      { id: 'bench-planning', label: 'Bench Planning' },
      { id: 'brew-league', label: 'Brew League' },
      { id: 'qa-am-review', label: 'QA AM Review' },
      { id: 'qa-capa', label: 'QA CAPA' },
      { id: 'qa-capa-dashboard', label: 'CAPA Dashboard' },
    ];
    if (isEditor || hasPermission('Full Access') || hasPermission('All Dashboards')) return allChecklists;
    return allChecklists.filter(c => hasPermission(c.id));
  };

  const availableDashboardTypes = getAvailableDashboardTypes();
  const availableChecklists = getAvailableChecklists();

  const handleNavigate = (section: SidebarSection, dType?: string, qaTab?: 'stores' | 'vendors', checklist?: string) => {
    setActiveSection(section);
    if (section === 'dashboard' && dType) {
      setDashboardType(dType);
    } else if (section === 'dashboard' && !dType && !dashboardType && availableDashboardTypes.length > 0) {
      setDashboardType(availableDashboardTypes[0].id);
    }
    if (qaTab) setQaSubTab(qaTab);
    if (section === 'checklists' && checklist) {
      setActiveChecklist(checklist);
    }
  };

  // Build search items for TopBar
  const searchItems = [
    ...availableDashboardTypes.map(d => ({ id: d.id, label: d.label, section: 'dashboard' as const })),
    ...availableChecklists.map(c => ({ id: c.id, label: c.label, section: 'checklists' as const })),
  ];

  const handleSearchSelect = (item: { id: string; label: string; section: 'dashboard' | 'checklists' }) => {
    if (item.section === 'dashboard') {
      handleNavigate('dashboard', item.id);
    } else {
      handleNavigate('checklists', undefined, undefined, item.id);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        dashboardType={dashboardType}
        activeChecklist={activeChecklist}
        qaSubTab={qaSubTab}
        onNavigate={handleNavigate}
        availableDashboardTypes={availableDashboardTypes}
        availableChecklists={availableChecklists}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
        onMobileExpand={() => setSidebarMobileOpen(true)}
      />

      {/* Main content area — left padding for sidebar icon strip */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 pl-14 lg:pl-[4.25rem]">
        {/* Top Bar */}
        <div className="sticky top-0 z-20">
          <TopBar searchItems={searchItems} onSearchSelect={handleSearchSelect} />
        </div>

        {/* Page content */}
        <main className="flex-1 p-2 sm:p-4 lg:p-6">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
          {activeSection === 'home' && (
            <HomePage onNavigate={(section) => handleNavigate(section as SidebarSection, section === 'dashboard' ? availableDashboardTypes[0]?.id : undefined)} />
          )}
          {activeSection === 'dashboard' && hasPermission('dashboard') && (
            <Dashboard userRole={userRole!} initialDashboardType={dashboardType} />
          )}
          {activeSection === 'checklists' && (
            <ChecklistsAndSurveys userRole={userRole!} preSelectedChecklist={activeChecklist} />
          )}
          </Suspense>
        </main>
      </div>
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
