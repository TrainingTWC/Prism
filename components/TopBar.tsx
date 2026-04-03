import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

interface SearchItem {
  id: string;
  label: string;
  section: 'dashboard' | 'checklists';
}

interface TopBarProps {
  searchItems?: SearchItem[];
  onSearchSelect?: (item: SearchItem) => void;
}

const TopBar: React.FC<TopBarProps> = ({ searchItems = [], onSearchSelect }) => {
  const { employeeData, userRole: authUserRole, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = searchQuery.trim()
    ? searchItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems;

  const handleSelect = (item: SearchItem) => {
    onSearchSelect?.(item);
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus modal input
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => modalInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        {/* Left spacer for mobile hamburger */}
        <div className="w-10 lg:hidden" />

        {/* Search bar trigger - desktop */}
        <div className="hidden sm:flex flex-1 justify-center max-w-xl mx-auto">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-3 pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-400 dark:text-slate-500 hover:border-sky-400 dark:hover:border-sky-500 transition-colors relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <span className="flex-1 text-left">Search dashboards & checklists...</span>
            <kbd className="px-1.5 py-0.5 text-xs font-mono text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Mobile search icon */}
        <button
          onClick={() => setSearchOpen(true)}
          className="sm:hidden p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme toggle — SVG pearl morph */}
          <ThemeToggle />

          {/* User profile */}
          {employeeData && (
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-slate-700">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                  {employeeData.code}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize leading-tight">
                  {authUserRole}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {getInitial(employeeData.name)}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} />
          <div className="relative w-[90vw] max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
              <input
                ref={modalInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dashboards & checklists..."
                className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 text-xs font-mono text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-slate-500">
                  {searchQuery ? 'No results found' : 'Type to search...'}
                </p>
              ) : (
                filteredItems.map(item => (
                  <button
                    key={`${item.section}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.section === 'dashboard' ? 'bg-sky-500' : 'bg-violet-500'
                    }`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 capitalize">{item.section}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
