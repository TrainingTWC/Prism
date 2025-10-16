
import React, { useState, useEffect } from 'react';
import { BarChart3, Brain, CheckSquare, HelpCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AIInsights from './components/AIInsights';
import ChecklistsAndSurveys from './components/ChecklistsAndSurveys';
import Header from './components/Header';
import Login from './components/Login';
import TourGuide from './components/TourGuide';
import { getUserRole, UserRole } from './roleMapping';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TourProvider, useTour } from './contexts/TourContext';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai-insights' | 'checklists'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isTourActive, startTour, completeTour, skipTour, shouldShowTour } = useTour();

  // Get user ID from URL parameters - must be before any conditional returns
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId') || urlParams.get('id') || urlParams.get('user');
    const hrIdParam = urlParams.get('hrId') || urlParams.get('hr_id');
    
    // If HR ID is present, default to checklists tab
    if (hrIdParam) {
      setActiveTab('checklists');
    }
    
    if (userIdParam) {
      setUserId(userIdParam);
      const role = getUserRole(userIdParam);
      setUserRole(role);
      
      if (!role) {
        console.warn(`No role found for user ID: ${userIdParam}`);
        // You might want to redirect to an error page or show a message
      }
    } else {
      console.warn('No user ID found in URL parameters');
      // For development, you can set a default admin user
      setUserId('admin001');
      setUserRole(getUserRole('admin001'));
    }
    
    setLoading(false);
  }, []);

  // Auto-start tour after login if user hasn't seen it
  useEffect(() => {
    if (isAuthenticated && shouldShowTour && !isTourActive) {
      // Small delay to let the UI render
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, shouldShowTour, isTourActive, startTour]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-slate-400">Loading user permissions...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    // { id: 'ai-insights', label: 'AI Insights', icon: Brain }, // Hidden per user request
    { id: 'checklists', label: 'Checklists & Surveys', icon: CheckSquare }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
      <Header />
      
      {/* Tour Guide */}
      <TourGuide
        isActive={isTourActive}
        onComplete={completeTour}
        onSkip={skipTour}
      />

      {/* Help Button - Floating - HIDDEN */}
      {false && (
        <button
          onClick={startTour}
          className="fixed bottom-6 right-6 z-[9999] btn-primary-gradient text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-transform duration-150 flex items-center gap-2"
          title="Take a tour"
          aria-label="Start guided tour"
        >
          <HelpCircle className="w-6 h-6" />
          <span className="hidden sm:inline font-medium">Need Help?</span>
        </button>
      )}
      
      {/* Tab Navigation */}
      <nav className="px-2 sm:px-4 lg:px-8 border-b border-gray-200 dark:border-slate-700" data-tour="tabs">
        <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'ai-insights' | 'checklists')}
                data-tour={tab.id === 'checklists' ? 'checklist-tab' : tab.id === 'dashboard' ? 'dashboard-tab' : ''}
                className={`flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
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
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TourProvider>
          <AppContent />
        </TourProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
