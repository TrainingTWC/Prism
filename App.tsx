
import React, { useState, useEffect } from 'react';
import { BarChart3, Brain, CheckSquare, HelpCircle } from 'lucide-react';
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

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai-insights' | 'checklists' | 'admin'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [empIdChecked, setEmpIdChecked] = useState<boolean>(false);
  const { isAuthenticated, isLoading: authLoading, loginWithEmpId, isEmployeeValidated } = useAuth();

  // Check URL for EMPID and validate against employee_data.json - ONCE on mount
  useEffect(() => {
    const checkUrlAuth = async () => {
      // Only check once
      if (empIdChecked) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const empId = urlParams.get('EMPID');
      
      console.log('[App] Checking URL auth (once), EMPID:', empId, 'isAuthenticated:', isAuthenticated);
      
      if (empId) {
        // If already authenticated with valid session, don't re-check employee
        if (isAuthenticated && isEmployeeValidated) {
          console.log('[App] Already authenticated with valid session, skipping employee check');
          setUserId(empId);
          try {
            const role = getUserRole(empId);
            setUserRole(role || { role: 'admin' } as any);
          } catch (error) {
            setUserRole({ role: 'admin' } as any);
          }
          setAccessDenied(false);
        } else {
          // Try to authenticate with EMPID
          const success = await loginWithEmpId(empId);
          
          console.log('[App] Login result:', success);
          
          if (!success) {
            // Employee ID not found - show access denied
            setAccessDenied(true);
          } else {
            // Valid employee - set user data
            setUserId(empId);
            try {
              const role = getUserRole(empId);
              setUserRole(role || { role: 'admin' } as any);
            } catch (error) {
              console.error('[App] Error getting user role:', error);
              // Set a default admin role if role mapping fails
              setUserRole({ role: 'admin' } as any);
            }
            setAccessDenied(false);
          }
        }
      } else {
        // No EMPID in URL - check if already authenticated
        console.log('[App] No EMPID in URL, isAuthenticated:', isAuthenticated);
        if (!isAuthenticated && !isEmployeeValidated) {
          setAccessDenied(true);
        }
      }
      
      setEmpIdChecked(true);
      setLoading(false);
    };

    if (!authLoading && !empIdChecked) {
      checkUrlAuth();
    }
  }, [authLoading, empIdChecked]);

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

  // Show loading while checking authentication
  if (authLoading || loading) {
    console.log('[App] Showing loading, authLoading:', authLoading, 'loading:', loading);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show ACCESS DENIED if EMPID not found or not provided
  if (accessDenied) {
    console.log('[App] Showing ACCESS DENIED');
    return <AccessDenied />;
  }

  // Show login if employee validated but not authenticated with password
  if (isEmployeeValidated && !isAuthenticated) {
    console.log('[App] Employee validated, showing Login. Employee:', isEmployeeValidated, 'Auth:', isAuthenticated);
    return <Login />;
  }

  // Show login if not authenticated (fallback for old flow)
  if (!isAuthenticated) {
    console.log('[App] Not authenticated, showing Login (fallback)');
    return <Login />;
  }

  console.log('[App] Rendering main app, authenticated:', isAuthenticated);

  if (!userRole) {
    console.log('[App] No userRole, showing access denied');
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

  console.log('[App] Full state - isAuth:', isAuthenticated, 'isEmpValidated:', isEmployeeValidated, 'userRole:', userRole);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    // { id: 'ai-insights', label: 'AI Insights', icon: Brain }, // Hidden per user request
    { id: 'checklists', label: 'Checklists & Surveys', icon: CheckSquare }
  ];

  // Get auth role once
  const { userRole: authUserRole } = useAuth();
  const isEditor = authUserRole === 'editor';
  
  if (isEditor) {
    tabs.push({ id: 'admin', label: 'Admin', icon: HelpCircle });
  }

  // If user has forms role, only show the forms section
  if (authUserRole === 'forms') {
    const formsRole = {
      userId: 'forms',
      name: 'Forms Access',
      role: 'forms' as const,
      allowedStores: [],
      allowedAMs: [],
      allowedHRs: []
    };
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
        <Header />
        <main className="p-2 sm:p-4 lg:p-8">
          <ChecklistsAndSurveys userRole={formsRole} />
        </main>
      </div>
    );
  }

  // If user has campus-hiring role, only show the campus hiring checklist
  if (authUserRole === 'campus-hiring') {
    const campusHiringRole = {
      userId: 'campus-hiring',
      name: 'Campus Hiring Access',
      role: 'campus-hiring' as const,
      allowedStores: [],
      allowedAMs: [],
      allowedHRs: []
    };
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
        <Header />
        <main className="p-2 sm:p-4 lg:p-8">
          <ChecklistsAndSurveys userRole={campusHiringRole} />
        </main>
      </div>
    );
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
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'ai-insights' | 'checklists')}
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
        {activeTab === 'dashboard' && <Dashboard userRole={userRole} />}
        {activeTab === 'ai-insights' && <AIInsights userRole={userRole} />}
        {activeTab === 'checklists' && <ChecklistsAndSurveys userRole={userRole} />}
        {activeTab === 'admin' && <AdminConfig />}
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
