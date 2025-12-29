import React, { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState<{ role: UserRole; permissions: string[] } | null>(null);
  const { login, employeeData, isEmployeeValidated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(false);
    setLoginSuccess(null);

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = login(password);
    
    if (!result.success) {
      setShowError(true);
      setPassword('');
    } else if (result.role) {
      // Show success message briefly before redirecting
      const roleConfig: Record<string, { permissions: string[] }> = {
        operations: { permissions: ['Operations Dashboard', 'Store Analytics', 'Performance Reports'] },
        hr: { permissions: ['HR Dashboard', 'Employee Data', 'Training Audit', 'HR Analytics', 'Campus Hiring', 'Bench Planning'] },
        qa: { permissions: ['QA Dashboard', 'Quality Reports', 'Audit Checklists'] },
        training: { permissions: ['Training Dashboard', 'Learning Analytics', 'Training Reports', 'Training Audit', 'Bench Planning'] },
        finance: { permissions: ['Finance Dashboard', 'Financial Analytics', 'Budget Reports'] },
        forms: { permissions: ['Forms & Surveys'] },
        'campus-hiring': { permissions: ['Campus Hiring Checklist', 'Candidate Management'] },
        'bench-planning': { permissions: ['Bench Planning Checklist', 'Readiness Assessment', 'Candidate Interviews'] },
        admin: { permissions: ['All Dashboards', 'All Reports', 'View All Data', 'Campus Hiring', 'Bench Planning'] },
        editor: { permissions: ['Full Access', 'All Dashboards', 'All Reports', 'System Administration', 'Configuration'] }
      };
      
      setLoginSuccess({
        role: result.role,
        permissions: roleConfig[result.role]?.permissions || ['Access Granted']
      });
      
      // Auto-redirect after showing success
      setTimeout(() => {
        // The auth context will handle the redirect
      }, 2000);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8 mt-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src={`${(import.meta as any).env?.BASE_URL || '/'}prism-logo-kittl.svg`}
              alt="Prism Dashboard Logo"
              className="w-24 h-24 object-contain drop-shadow-lg"
              onError={(e) => {
                // Fallback to inline SVG if logo file is not found
                const fallbackSVG = document.createElement('div');
                fallbackSVG.className = 'w-24 h-24 flex items-center justify-center';
                fallbackSVG.innerHTML = `
                  <svg width="96" height="96" viewBox="0 0 200 200" class="drop-shadow-lg">
                    <defs>
                      <linearGradient id="tGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#E91E63"/>
                        <stop offset="100%" style="stop-color:#9C27B0"/>
                      </linearGradient>
                      <linearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#FF6B35"/>
                        <stop offset="100%" style="stop-color:#F7931E"/>
                      </linearGradient>
                      <linearGradient id="bGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#1E88E5"/>
                        <stop offset="100%" style="stop-color:#00ACC1"/>
                      </linearGradient>
                      <linearGradient id="lGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#673AB7"/>
                        <stop offset="100%" style="stop-color:#512DA8"/>
                      </linearGradient>
                    </defs>
                    <g transform="translate(100,100) scale(0.8)">
                      <path d="M 0,-90 L 70,-10 L 0,20 L -35,-35 Z" fill="url(#tGrad)" />
                      <path d="M 70,-10 L 90,80 L 0,20 Z" fill="url(#rGrad)" />
                      <path d="M 90,80 L -50,90 L 0,20 Z" fill="url(#bGrad)" />
                      <path d="M -50,90 L -35,-35 L 0,20 Z" fill="url(#lGrad)" />
                      <path d="M 0,-90 L 0,20" stroke="white" stroke-width="2" opacity="0.8" />
                      <path d="M 70,-10 L 0,20" stroke="white" stroke-width="2" opacity="0.8" />
                      <path d="M 90,80 L 0,20" stroke="white" stroke-width="2" opacity="0.8" />
                      <path d="M -50,90 L 0,20" stroke="white" stroke-width="2" opacity="0.8" />
                    </g>
                  </svg>
                `;
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  parent.replaceChild(fallbackSVG, e.target as HTMLElement);
                }
              }}
            />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wide text-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent dark:from-purple-400 dark:via-blue-300 dark:to-cyan-300 mb-3">
            Prism
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-500 mb-6">
            Powered by Third Wave Coffee
          </p>
          
          {/* Employee Welcome Message */}
          {isEmployeeValidated && employeeData && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800 dark:text-green-300">
                ✓ Employee verified
              </p>
              <p className="text-base font-semibold text-green-900 dark:text-green-200">
                Welcome, {employeeData.name}!
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                ID: {employeeData.code}
              </p>
            </div>
          )}
          <p className="text-gray-600 dark:text-slate-400">
            Please enter your password to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:border-sky-400 dark:focus:border-sky-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 outline-none"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {showError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
                  <span className="text-red-700 dark:text-red-400 text-sm font-medium">
                    Incorrect password. Please try again.
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full btn-primary-gradient disabled:opacity-60 text-white py-3 px-4 rounded-lg font-medium transition-transform duration-150 transform hover:scale-105 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="bg-[color:var(--color-primary)/0.06] dark:bg-slate-700 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-[var(--color-primary)] mr-2 mt-0.5">ℹ️</span>
                <div className="text-sm text-[var(--color-primary)] dark:text-[var(--color-secondary)]">
                  <p className="font-medium mb-1">Secure Access</p>
                  <p>Your login session will remain active for 24 hours on this device.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Having trouble accessing the dashboard?
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Contact your administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;