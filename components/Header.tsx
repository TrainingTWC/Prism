
import React from 'react';
import { LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <header className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center flex-wrap flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-3">
            <img 
              src={`${(import.meta as any).env?.BASE_URL || '/'}prism-logo-kittl.svg`}
              alt="Prism Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback to inline SVG if logo file is not found
                const fallbackSVG = document.createElement('div');
                fallbackSVG.className = 'w-8 h-8 flex items-center justify-center';
                fallbackSVG.innerHTML = `
                  <svg width="32" height="32" viewBox="0 0 200 200">
                    <defs>
                      <linearGradient id="tGradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#E91E63"/>
                        <stop offset="100%" style="stop-color:#9C27B0"/>
                      </linearGradient>
                      <linearGradient id="rGradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#FF6B35"/>
                        <stop offset="100%" style="stop-color:#F7931E"/>
                      </linearGradient>
                      <linearGradient id="bGradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#1E88E5"/>
                        <stop offset="100%" style="stop-color:#00ACC1"/>
                      </linearGradient>
                      <linearGradient id="lGradHeader" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#673AB7"/>
                        <stop offset="100%" style="stop-color:#512DA8"/>
                      </linearGradient>
                    </defs>
                    <g transform="translate(100,100) scale(0.6)">
                      <path d="M 0,-90 L 70,-10 L 0,20 L -35,-35 Z" fill="url(#tGradHeader)" />
                      <path d="M 70,-10 L 90,80 L 0,20 Z" fill="url(#rGradHeader)" />
                      <path d="M 90,80 L -50,90 L 0,20 Z" fill="url(#bGradHeader)" />
                      <path d="M -50,90 L -35,-35 L 0,20 Z" fill="url(#lGradHeader)" />
                      <path d="M 0,-90 L 0,20" stroke="white" stroke-width="1.5" opacity="0.8" />
                      <path d="M 70,-10 L 0,20" stroke="white" stroke-width="1.5" opacity="0.8" />
                      <path d="M 90,80 L 0,20" stroke="white" stroke-width="1.5" opacity="0.8" />
                      <path d="M -50,90 L 0,20" stroke="white" stroke-width="1.5" opacity="0.8" />
                    </g>
                  </svg>
                `;
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  parent.replaceChild(fallbackSVG, e.target as HTMLElement);
                }
              }}
            />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wide text-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent dark:from-purple-400 dark:via-blue-300 dark:to-cyan-300">
              Prism
            </h1>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
      <p className="mt-1 text-gray-500 dark:text-slate-400 text-sm">Employee data, insights, and task management.</p>
    </header>
  );
};

export default Header;
