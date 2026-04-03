import React, { useState, useRef, useCallback } from 'react';
import {
  BarChart3, ChevronDown, ChevronRight, ChevronLeft,
  ClipboardCheck, X, LogOut, Home
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export type SidebarSection = 'home' | 'dashboard' | 'checklists';

export interface SidebarProps {
  activeSection: SidebarSection;
  dashboardType: string;
  activeChecklist: string;
  qaSubTab: 'stores' | 'vendors';
  onNavigate: (section: SidebarSection, dashboardType?: string, qaSubTab?: 'stores' | 'vendors', checklist?: string) => void;
  availableDashboardTypes: { id: string; label: string }[];
  availableChecklists: { id: string; label: string }[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onMobileExpand?: () => void;
}

interface DashboardItem {
  id: string;
  label: string;
  color: string;
  children?: { id: string; label: string; color: string }[];
}

const DASHBOARD_COLORS: Record<string, string> = {
  'map-view': 'bg-cyan-500',
  'hr': 'bg-blue-500',
  'operations': 'bg-green-500',
  'training': 'bg-purple-500',
  'qa': 'bg-red-500',
  'finance': 'bg-emerald-500',
  'shlp': 'bg-teal-500',
  'campus-hiring': 'bg-indigo-500',
  'trainer-calendar': 'bg-violet-500',
  'bench-planning': 'bg-orange-500',
  'bench-planning-sm-asm': 'bg-amber-500',
  'consolidated': 'bg-slate-500',
};

const CHECKLIST_COLORS: Record<string, string> = {
  'hr': 'bg-blue-500',
  'operations': 'bg-green-500',
  'training': 'bg-purple-500',
  'qa': 'bg-orange-500',
  'finance': 'bg-red-500',
  'shlp': 'bg-emerald-500',
  'campus-hiring': 'bg-indigo-500',
  'forms': 'bg-teal-500',
  'trainer-calendar': 'bg-violet-500',
  'bench-planning': 'bg-sky-500',
  'brew-league': 'bg-amber-500',
  'qa-am-review': 'bg-rose-500',
  'qa-capa': 'bg-amber-600',
  'qa-capa-dashboard': 'bg-amber-700',
};

/* ── Glass style tokens ── */
const GLASS_BG = 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl backdrop-saturate-150';
const GLASS_BORDER = 'border-white/30 dark:border-slate-600/40';
const GLASS_MOBILE_BG = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl backdrop-saturate-150';

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  dashboardType,
  activeChecklist,
  qaSubTab,
  onNavigate,
  availableDashboardTypes,
  availableChecklists,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  onMobileExpand,
}) => {
  const { logout, employeeData, userRole: authUserRole } = useAuth();
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  const [checklistsExpanded, setChecklistsExpanded] = useState(activeSection === 'checklists');
  const [qaExpanded, setQAExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setHovered(false), 300);
  }, []);

  const isExpanded = !collapsed || hovered;

  const handleDashboardItemClick = (typeId: string) => {
    if (typeId === 'qa') {
      setQAExpanded(!qaExpanded);
      onNavigate('dashboard', 'qa', qaSubTab);
    } else {
      onNavigate('dashboard', typeId);
    }
    if (window.innerWidth < 1024) onMobileClose();
  };

  const handleQASubClick = (sub: 'stores' | 'vendors') => {
    onNavigate('dashboard', 'qa', sub);
    if (window.innerWidth < 1024) onMobileClose();
  };

  const handleChecklistItemClick = (checklistId: string) => {
    onNavigate('checklists', undefined, undefined, checklistId);
    if (window.innerWidth < 1024) onMobileClose();
  };

  const handleSectionClick = (section: SidebarSection) => {
    onNavigate(section);
    if (window.innerWidth < 1024) onMobileClose();
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  const dashboardItems: DashboardItem[] = availableDashboardTypes.map(type => {
    if (type.id === 'qa') {
      return {
        id: 'qa', label: 'QA', color: DASHBOARD_COLORS['qa'] || 'bg-gray-500',
        children: [
          { id: 'qa-stores', label: 'QA Stores', color: 'bg-red-400' },
          { id: 'qa-vendors', label: 'QA Vendors', color: 'bg-teal-400' },
        ],
      };
    }
    return { id: type.id, label: type.label, color: DASHBOARD_COLORS[type.id] || 'bg-gray-500' };
  });

  /* ── Fixed icon-slot width — matches collapsed sidebar so icons never shift ── */
  const SLOT = 'w-[4.25rem] flex-shrink-0 flex items-center justify-center';

  /* ── Label helper — fades text in/out smoothly, NO margin (slot handles spacing) ── */
  const labelCls = `whitespace-nowrap transition-[opacity,max-width] duration-[350ms] ease-[cubic-bezier(.25,.1,.25,1)] overflow-hidden ${
    isExpanded ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'
  }`;

  /* ───────────────────────── UNIFIED SIDEBAR CONTENT (single tree, no swap) ───────────────────────── */
  const unifiedContent = (
    <div className="flex flex-col h-full">
      {/* ── Header / Logo ── */}
      <div className={`flex items-center h-14 border-b ${GLASS_BORDER}`}>
        <div className={SLOT}>
          <img
            src={`${(import.meta as any).env?.BASE_URL || '/'}prism-logo-kittl.svg`}
            alt="Prism Logo"
            className="w-8 h-8 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <span className={labelCls} style={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '0.05em' }}>PRISM</span>
      </div>

      {/* ── User info ── */}
      {employeeData && (
        <div className={`flex items-center border-b ${GLASS_BORDER} py-3`}>
          <div className={SLOT}>
            <div className="w-8 h-8 rounded-full bg-sky-500/20 dark:bg-sky-400/15 flex items-center justify-center">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">{employeeData.code.slice(0, 2)}</span>
            </div>
          </div>
          <div className={`${labelCls} flex flex-col`}>
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 tracking-wide">{employeeData.code}</span>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 capitalize">{authUserRole}</span>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-2">
        {/* HOME */}
        <button
          onClick={() => handleSectionClick('home')}
          className={`w-full flex items-center py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${
            activeSection === 'home'
              ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'
          }`}
          title="Home"
        >
          <div className={SLOT}><Home className="w-5 h-5" /></div>
          <span className={labelCls}>HOME</span>
        </button>

        {/* DASHBOARD */}
        <div>
          <button
            onClick={() => {
              if (isExpanded) {
                setDashboardExpanded(!dashboardExpanded);
              } else {
                onNavigate('dashboard', availableDashboardTypes[0]?.id);
              }
            }}
            className={`w-full flex items-center py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${
              activeSection === 'dashboard'
                ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'
            }`}
            title="Dashboards"
          >
            <div className={SLOT}><BarChart3 className="w-5 h-5" /></div>
            <span className={labelCls}>DASHBOARD</span>
            <span className={`ml-auto pr-3 transition-[opacity] duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              {dashboardExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          </button>

          {/* Dashboard sub-items — only visible when expanded */}
          <div className={`overflow-hidden transition-all duration-[350ms] ease-[cubic-bezier(.25,.1,.25,1)] ${
            isExpanded && dashboardExpanded ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0'
          }`}>
            <div className="ml-[4.25rem] mr-2 space-y-0.5">
              {dashboardItems.map(item => (
                <div key={item.id}>
                  <button
                    onClick={() => handleDashboardItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                      activeSection === 'dashboard' && dashboardType === item.id
                        ? 'text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-white/10'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200 ${
                      activeSection === 'dashboard' && dashboardType === item.id ? item.color : 'bg-gray-300 dark:bg-slate-600'
                    }`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.children && (
                      activeSection === 'dashboard' && dashboardType === item.id && qaExpanded
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : item.children && <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {item.children && activeSection === 'dashboard' && dashboardType === 'qa' && qaExpanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleQASubClick(child.id === 'qa-stores' ? 'stores' : 'vendors')}
                          className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors duration-150 ${
                            qaSubTab === (child.id === 'qa-stores' ? 'stores' : 'vendors')
                              ? 'text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-white/10'
                              : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 hover:bg-white/30 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            qaSubTab === (child.id === 'qa-stores' ? 'stores' : 'vendors') ? child.color : 'bg-gray-300 dark:bg-slate-600'
                          }`} />
                          <span>{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHECKLISTS & SURVEYS */}
        <div>
          <button
            onClick={() => {
              if (isExpanded) {
                setChecklistsExpanded(!checklistsExpanded);
              } else {
                handleSectionClick('checklists');
              }
            }}
            className={`w-full flex items-center py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${
              activeSection === 'checklists'
                ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'
            }`}
            title="Checklists & Surveys"
          >
            <div className={SLOT}><ClipboardCheck className="w-5 h-5" /></div>
            <span className={labelCls}>CHECKLISTS & SURVEYS</span>
            <span className={`ml-auto pr-3 transition-[opacity] duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              {checklistsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          </button>

          <div className={`overflow-hidden transition-all duration-[350ms] ease-[cubic-bezier(.25,.1,.25,1)] ${
            isExpanded && checklistsExpanded ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0'
          }`}>
            <div className="ml-[4.25rem] mr-2 space-y-0.5">
              {availableChecklists.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleChecklistItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                    activeSection === 'checklists' && activeChecklist === item.id
                      ? 'text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-white/10'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-white/30 dark:hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200 ${
                    activeSection === 'checklists' && activeChecklist === item.id
                      ? (CHECKLIST_COLORS[item.id] || 'bg-gray-500') : 'bg-gray-300 dark:bg-slate-600'
                  }`} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Bottom ── */}
      <div className={`border-t ${GLASS_BORDER} py-2 space-y-0.5`}>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center py-2.5 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 transition-colors duration-200"
          title={collapsed ? 'Pin open' : 'Collapse'}
        >
          <div className={SLOT}>
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed && !hovered ? 'rotate-180' : ''}`} />
          </div>
          <span className={labelCls}>{collapsed ? 'PIN OPEN' : 'COLLAPSE'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center py-2.5 rounded-xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 transition-colors duration-200"
          title="Sign Out"
        >
          <div className={SLOT}><LogOut className="w-4 h-4" /></div>
          <span className={labelCls}>Sign Out</span>
        </button>
      </div>
    </div>
  );

  /* ── Mobile expanded sidebar content (always full-width, no collapse logic) ── */
  const mobileSidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-3 px-5 py-5 border-b ${GLASS_BORDER}`}>
        <img
          src={`${(import.meta as any).env?.BASE_URL || '/'}prism-logo-kittl.svg`}
          alt="Prism Logo"
          className="w-8 h-8 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">PRISM</span>
        <button onClick={onMobileClose} className="ml-auto p-1 rounded-md text-gray-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      {employeeData && (
        <div className={`px-5 py-3 border-b ${GLASS_BORDER}`}>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{employeeData.code}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{authUserRole}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <button onClick={() => handleSectionClick('home')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeSection === 'home' ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'
          }`}>
          <Home className="w-5 h-5" /><span>HOME</span>
        </button>

        <div>
          <button onClick={() => setDashboardExpanded(!dashboardExpanded)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeSection === 'dashboard' ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'
            }`}>
            <BarChart3 className="w-5 h-5" /><span className="flex-1 text-left">DASHBOARD</span>
            {dashboardExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {dashboardExpanded && (
            <div className="ml-4 mt-1 space-y-0.5">
              {dashboardItems.map(item => (
                <div key={item.id}>
                  <button onClick={() => handleDashboardItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === 'dashboard' && dashboardType === item.id
                        ? 'text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-white/10' : 'text-gray-500 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-white/5'
                    }`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeSection === 'dashboard' && dashboardType === item.id ? item.color : 'bg-gray-300 dark:bg-slate-600'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.children && (activeSection === 'dashboard' && dashboardType === item.id && qaExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
                  </button>
                  {item.children && activeSection === 'dashboard' && dashboardType === 'qa' && qaExpanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5">
                      {item.children.map(child => (
                        <button key={child.id} onClick={() => handleQASubClick(child.id === 'qa-stores' ? 'stores' : 'vendors')}
                          className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            qaSubTab === (child.id === 'qa-stores' ? 'stores' : 'vendors') ? 'text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-white/10' : 'text-gray-400 dark:text-slate-500 hover:bg-white/30 dark:hover:bg-white/5'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${qaSubTab === (child.id === 'qa-stores' ? 'stores' : 'vendors') ? child.color : 'bg-gray-300 dark:bg-slate-600'}`} />
                          <span>{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button onClick={() => setChecklistsExpanded(!checklistsExpanded)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeSection === 'checklists' ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'
            }`}>
            <ClipboardCheck className="w-5 h-5" /><span className="flex-1 text-left">CHECKLISTS & SURVEYS</span>
            {checklistsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {checklistsExpanded && (
            <div className="ml-4 mt-1 space-y-0.5">
              {availableChecklists.map(item => (
                <button key={item.id} onClick={() => handleChecklistItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === 'checklists' && activeChecklist === item.id
                      ? 'text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-white/10' : 'text-gray-500 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-white/5'
                  }`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeSection === 'checklists' && activeChecklist === item.id ? (CHECKLIST_COLORS[item.id] || 'bg-gray-500') : 'bg-gray-300 dark:bg-slate-600'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className={`border-t ${GLASS_BORDER} px-3 py-3`}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 transition-colors">
          <LogOut className="w-4 h-4" /><span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop — fixed overlay, CSS-only width transition, glassmorphism ── */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ willChange: 'width' }}
        className={`hidden lg:flex flex-col ${GLASS_BG} border-r ${GLASS_BORDER} h-screen fixed top-0 left-0 z-30 overflow-hidden
          transition-[width] duration-[400ms] ease-[cubic-bezier(.25,.1,.25,1)] ${
          isExpanded ? 'w-64 shadow-2xl' : 'w-[4.25rem]'
        }`}
      >
        {unifiedContent}
      </aside>

      {/* ── Mobile icon strip — glassmorphism ── */}
      <aside className={`lg:hidden fixed left-0 top-0 bottom-0 w-14 ${GLASS_MOBILE_BG} border-r ${GLASS_BORDER} z-40 flex flex-col items-center py-3`}>
        <div className="mb-3 pb-2 border-b border-white/20 dark:border-slate-600/30 w-full flex justify-center">
          <img
            src={`${(import.meta as any).env?.BASE_URL || '/'}prism-logo-kittl.svg`}
            alt="Prism"
            className="w-7 h-7 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <nav className="flex-1 flex flex-col items-center space-y-1 overflow-y-auto">
          <button onClick={() => { onNavigate('home'); onMobileClose(); }}
            className={`p-2.5 rounded-xl transition-colors ${activeSection === 'home' ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 active:bg-white/40 dark:active:bg-white/10'}`}
            aria-label="Home"><Home className="w-5 h-5" /></button>
          <button onClick={() => onMobileExpand?.()}
            className={`p-2.5 rounded-xl transition-colors ${activeSection === 'dashboard' ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 active:bg-white/40 dark:active:bg-white/10'}`}
            aria-label="Dashboards"><BarChart3 className="w-5 h-5" /></button>
          <button onClick={() => onMobileExpand?.()}
            className={`p-2.5 rounded-xl transition-colors ${activeSection === 'checklists' ? 'bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 active:bg-white/40 dark:active:bg-white/10'}`}
            aria-label="Checklists"><ClipboardCheck className="w-5 h-5" /></button>
        </nav>

        <div className="pt-2 border-t border-white/20 dark:border-slate-600/30 w-full flex flex-col items-center space-y-1">
          <button onClick={handleLogout}
            className="p-2.5 rounded-xl text-red-500 dark:text-red-400 active:bg-red-50/60 dark:active:bg-red-900/20 transition-colors"
            aria-label="Sign Out"><LogOut className="w-4 h-4" /></button>
        </div>
      </aside>

      {/* ── Mobile expanded overlay — glass slide-in ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
            onClick={onMobileClose}
          />
          <aside
            className={`absolute left-0 top-0 bottom-0 w-72 ${GLASS_MOBILE_BG} border-r ${GLASS_BORDER} shadow-2xl`}
            style={{ animation: 'sidebar-slide-in 350ms cubic-bezier(.25,.1,.25,1) both' }}
          >
            {mobileSidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
