import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Users, Settings, GraduationCap, CheckCircle, DollarSign, ArrowLeft, Home, Brain, FileText, Calendar, Trophy, Coffee, BarChart3, Briefcase, LogOut } from 'lucide-react';
import { UserRole } from '../roleMapping';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
const HRChecklist = lazy(() => import('./checklists/HRChecklist'));
const OperationsChecklist = lazy(() => import('./checklists/OperationsChecklist'));
const TrainingChecklist = lazy(() => import('./checklists/TrainingChecklist'));
const QAChecklist = lazy(() => import('./checklists/QAChecklist'));
const FinanceChecklist = lazy(() => import('./checklists/FinanceChecklist'));
const CampusHiringChecklist = lazy(() => import('./checklists/CampusHiringChecklist'));
const FormsChecklist = lazy(() => import('./checklists/FormsChecklist'));
const TrainerCalendarChecklist = lazy(() => import('./checklists/TrainerCalendarChecklist'));
const SHLPChecklist = lazy(() => import('./checklists/SHLPChecklist'));
const BenchPlanningChecklist = lazy(() => import('./checklists/BenchPlanningChecklist'));
const BenchPlanningSMASMChecklist = lazy(() => import('./checklists/BenchPlanningSMASMChecklist'));
const BenchPlanningBTChecklist = lazy(() => import('./checklists/BenchPlanningBTChecklist'));
const BrewLeagueRegionRound = lazy(() => import('./checklists/BrewLeagueRegionRound'));
const BrewLeagueAMRound = lazy(() => import('./checklists/BrewLeagueAMRound'));
const BrewLeagueDashboard = lazy(() => import('./checklists/BrewLeagueDashboard'));
const BrewLeagueNationalFinals = lazy(() => import('./checklists/BrewLeagueNationalFinals'));
const QAAMReviewChecklist = lazy(() => import('./checklists/QAAMReviewChecklist'));
const QACAPAChecklist = lazy(() => import('./checklists/QACAPAChecklist'));
const QACAPADashboard = lazy(() => import('./checklists/QACAPADashboard'));
const VendorAuditChecklist = lazy(() => import('./checklists/VendorAuditChecklist'));
const PreLaunchAuditChecklist = lazy(() => import('./checklists/PreLaunchAuditChecklist'));
const HRAuditChecklist = lazy(() => import('./checklists/HRAuditChecklist'));
import { ClipboardCheck, ShieldAlert, Factory, Rocket, HeartPulse } from 'lucide-react';

interface ChecklistsAndSurveysProps {
  userRole: UserRole;
  preSelectedChecklist?: string;
}

type ChecklistType = 'hr' | 'operations' | 'training' | 'qa' | 'finance' | 'shlp' | 'campus-hiring' | 'forms' | 'trainer-calendar' | 'bench-planning' | 'brew-league' | 'qa-am-review' | 'qa-capa' | 'qa-capa-dashboard';
type BrewLeagueSubType = 'store' | 'am' | 'region' | 'national-finals' | 'dashboard';
type BenchPlanningSubType = 'barista-sm' | 'sm-asm' | 'barista-bt';
type QASubType = 'store-qa' | 'vendor-audit' | 'pre-launch-audit';
type HRSubType = 'hr-connect' | 'hr-audit';
type BTSessionStep = 'readiness' | 'bt-session' | 'skill-check';

const ChecklistsAndSurveys: React.FC<ChecklistsAndSurveysProps> = ({ userRole, preSelectedChecklist }) => {
  const { userRole: authUserRole, hasPermission, logout } = useAuth();
  const [activeChecklist, setActiveChecklist] = useState<ChecklistType | null>(
    (preSelectedChecklist as ChecklistType) || null
  );
  const [brewLeagueSubSection, setBrewLeagueSubSection] = useState<BrewLeagueSubType | null>(null);
  const [benchPlanningSubSection, setBenchPlanningSubSection] = useState<BenchPlanningSubType | null>(null);
  const [qaSubSection, setQASubSection] = useState<QASubType | null>(null);
  const [hrSubSection, setHRSubSection] = useState<HRSubType | null>(null);
  const [btSessionStep, setBTSessionStep] = useState<BTSessionStep>('readiness');
  const [checklistStats, setChecklistStats] = useState({
    hr: { completed: 0, total: 0, score: 0 },
    operations: { completed: 0, total: 0, score: 0 },
    training: { completed: 0, total: 0, score: 0 },
    qa: { completed: 0, total: 0, score: 0 },
    finance: { completed: 0, total: 0, score: 0 },
    shlp: { completed: 0, total: 0, score: 0 },
    'campus-hiring': { completed: 0, total: 0, score: 0 },
    forms: { completed: 0, total: 0, score: 0 },
    'trainer-calendar': { completed: 0, total: 0, score: 0 },
    'bench-planning': { completed: 0, total: 0, score: 0 },
    'bench-planning-sm-asm': { completed: 0, total: 0, score: 0 },
    'brew-league': { completed: 0, total: 0, score: 0 },
    'qa-am-review': { completed: 0, total: 0, score: 0 },
    'qa-capa': { completed: 0, total: 0, score: 0 },
    'qa-capa-dashboard': { completed: 0, total: 0, score: 0 }
  });

  // Get auditor info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const auditorName = urlParams.get('auditorName') || urlParams.get('name') || urlParams.get('hrName') || 'Unknown Auditor';
  const auditorId = urlParams.get('auditorId') || urlParams.get('id') || urlParams.get('hrId') || 'unknown';

  // Sync with sidebar-driven checklist selection
  useEffect(() => {
    if (preSelectedChecklist) {
      setActiveChecklist(preSelectedChecklist as ChecklistType);
    }
  }, [preSelectedChecklist]);

  // Filter checklists based on user permissions
  const getAvailableChecklists = () => {
    const allChecklists = [
      { id: 'hr' as ChecklistType, label: 'HR', icon: Users, color: 'bg-blue-500' },
      { id: 'operations' as ChecklistType, label: 'Operations', icon: Settings, color: 'bg-green-500' },
      { id: 'training' as ChecklistType, label: 'Training', icon: GraduationCap, color: 'bg-purple-500' },
      { id: 'qa' as ChecklistType, label: 'QA', icon: CheckCircle, color: 'bg-orange-500' },
      { id: 'finance' as ChecklistType, label: 'Finance', icon: DollarSign, color: 'bg-red-500' },
      { id: 'shlp' as ChecklistType, label: 'SHLP', icon: CheckCircle, color: 'bg-emerald-500' },
      { id: 'campus-hiring' as ChecklistType, label: 'Campus Hiring', icon: Brain, color: 'bg-indigo-500' },
      { id: 'forms' as ChecklistType, label: 'Forms & Surveys', icon: FileText, color: 'bg-teal-500' },
      { id: 'trainer-calendar' as ChecklistType, label: 'Trainer Calendar', icon: Calendar, color: 'bg-purple-600' },
      { id: 'bench-planning' as ChecklistType, label: 'Bench Planning', icon: Briefcase, color: 'bg-sky-600' },
      { id: 'brew-league' as ChecklistType, label: 'Brew League', icon: Trophy, color: 'bg-amber-600' },
      { id: 'qa-am-review' as ChecklistType, label: 'QA AM Review', icon: ClipboardCheck, color: 'bg-rose-500' },
      { id: 'qa-capa' as ChecklistType, label: 'QA CAPA', icon: ShieldAlert, color: 'bg-amber-500' },
      { id: 'qa-capa-dashboard' as ChecklistType, label: 'CAPA Dashboard', icon: BarChart3, color: 'bg-amber-600' }
    ];

    // For admin or editor role with Full Access, show all checklists
    if (authUserRole === 'admin' || authUserRole === 'editor' || hasPermission('Full Access') || hasPermission('All Dashboards')) {
      return allChecklists;
    }

    // For other roles, show only the ones they have permission for
    return allChecklists.filter(checklist => {
      return hasPermission(checklist.id);
    });
  };

  const availableChecklists = getAvailableChecklists();

  const checklists = [
    { id: 'hr' as ChecklistType, label: 'HR', icon: Users, color: 'bg-blue-500' },
    { id: 'operations' as ChecklistType, label: 'Operations', icon: Settings, color: 'bg-green-500' },
    { id: 'training' as ChecklistType, label: 'Training', icon: GraduationCap, color: 'bg-purple-500' },
    { id: 'qa' as ChecklistType, label: 'QA', icon: CheckCircle, color: 'bg-orange-500' },
    { id: 'finance' as ChecklistType, label: 'Finance', icon: DollarSign, color: 'bg-red-500' },
    { id: 'shlp' as ChecklistType, label: 'SHLP', icon: CheckCircle, color: 'bg-emerald-500' },
    { id: 'campus-hiring' as ChecklistType, label: 'Campus Hiring', icon: Brain, color: 'bg-indigo-500' },
    { id: 'forms' as ChecklistType, label: 'Forms & Surveys', icon: FileText, color: 'bg-teal-500' },
    { id: 'trainer-calendar' as ChecklistType, label: 'Trainer Calendar', icon: Calendar, color: 'bg-purple-600' },
    { id: 'bench-planning' as ChecklistType, label: 'Bench Planning', icon: Briefcase, color: 'bg-sky-600' },
    { id: 'brew-league' as ChecklistType, label: 'Brew League', icon: Trophy, color: 'bg-amber-600' },
    { id: 'qa-am-review' as ChecklistType, label: 'QA AM Review', icon: ClipboardCheck, color: 'bg-rose-500' },
    { id: 'qa-capa' as ChecklistType, label: 'QA CAPA', icon: ShieldAlert, color: 'bg-amber-500' },
    { id: 'qa-capa-dashboard' as ChecklistType, label: 'CAPA Dashboard', icon: BarChart3, color: 'bg-amber-600' }
  ];

  const updateChecklistStats = (type: ChecklistType, stats: { completed: number; total: number; score: number }) => {
    setChecklistStats(prev => ({
      ...prev,
      [type]: stats
    }));
  };

  const getChecklistLabel = (type: ChecklistType) => {
    const checklist = checklists.find(c => c.id === type);
    return checklist?.label || '';
  };

  const handleBackToOverview = () => {
    setActiveChecklist(null);
    setBrewLeagueSubSection(null);
    setBenchPlanningSubSection(null);
    setQASubSection(null);
    setHRSubSection(null);
    setBTSessionStep('readiness');
  };

  const handleBackToBrewLeague = () => {
    setBrewLeagueSubSection(null);
  };

  const handleBackToBenchPlanning = () => {
    setBenchPlanningSubSection(null);
    setBTSessionStep('readiness');
  };

  const handleBackToQA = () => {
    setQASubSection(null);
  };

  const handleBackToHR = () => {
    setHRSubSection(null);
  };

  const renderActiveChecklist = () => {
    if (!activeChecklist) return null;

    // Handle Brew League subsections
    if (activeChecklist === 'brew-league' && !brewLeagueSubSection) {
      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-600" />
              Brew League
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Select the competition round to begin evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setBrewLeagueSubSection('am')}
              className="group p-6 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-400 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-amber-600 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  AM Round
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Area Manager level competition scoresheet
                </p>
                <span className="mt-4 text-sm text-amber-600 dark:text-amber-400 font-medium group-hover:text-amber-700 dark:group-hover:text-amber-300">
                  Open →
                </span>
              </div>
            </button>

            <button
              onClick={() => setBrewLeagueSubSection('region')}
              className="group p-6 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-400 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-amber-700 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Region Round
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Regional competition scoresheet
                </p>
                <span className="mt-4 text-sm text-amber-600 dark:text-amber-400 font-medium group-hover:text-amber-700 dark:group-hover:text-amber-300">
                  Open →
                </span>
              </div>
            </button>

            <button
              onClick={() => setBrewLeagueSubSection('national-finals')}
              className="group p-6 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-yellow-400 dark:hover:border-yellow-400 bg-white dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Coffee className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  National Finals
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  National Finals sensory scoresheet
                </p>
                <span className="mt-4 text-sm text-amber-600 dark:text-amber-400 font-medium group-hover:text-amber-700 dark:group-hover:text-amber-300">
                  Open →
                </span>
              </div>
            </button>
          </div>

          {/* Dashboard Button */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg p-6">
            <button
              onClick={() => setBrewLeagueSubSection('dashboard')}
              className="w-full group flex items-center justify-between p-6 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border-2 border-white/30 hover:border-white/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white mb-1">View Dashboard</h3>
                  <p className="text-amber-100 text-sm">Performance analytics and leaderboards</p>
                </div>
              </div>
              <div className="text-white text-2xl group-hover:translate-x-2 transition-transform duration-200">
                →
              </div>
            </button>
          </div>
        </div>
      );
    }

    // Handle Bench Planning subsections
    if (activeChecklist === 'bench-planning' && !benchPlanningSubSection) {
      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-sky-600" />
              Bench Planning
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Select the promotion pathway to begin assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => {
                setBenchPlanningSubSection('barista-bt');
                setBTSessionStep('readiness');
              }}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-400 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-emerald-500 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Barista to Buddy Trainer
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  3-step process: Readiness, BT Session & Skill Check
                </p>
                <span className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  Open →
                </span>
              </div>
            </button>

            <button
              onClick={() => setBenchPlanningSubSection('barista-sm')}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-400 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-sky-500 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Coffee className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Barista to Shift Manager
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  Assessment and readiness checklist for Shift Manager promotion
                </p>
                <span className="mt-2 text-sm text-sky-600 dark:text-sky-400 font-medium group-hover:text-sky-700 dark:group-hover:text-sky-300">
                  Open →
                </span>
              </div>
            </button>

            <button
              onClick={() => setBenchPlanningSubSection('sm-asm')}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-400 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-purple-500 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Shift Manager to Assistant Store Manager
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  Assessment and readiness checklist for ASM promotion
                </p>
                <span className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  Open →
                </span>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // Define common props for checklists
    const commonProps = {
      userRole,
      onStatsUpdate: (stats: { completed: number; total: number; score: number }) => 
        updateChecklistStats(activeChecklist, stats),
      onBackToChecklists: () => setActiveChecklist(null)
    };

    // Render Brew League subsection
    if (activeChecklist === 'brew-league' && brewLeagueSubSection) {
      if (brewLeagueSubSection === 'dashboard') {
        return <BrewLeagueDashboard />;
      }
      if (brewLeagueSubSection === 'region') {
        return <BrewLeagueRegionRound />;
      }
      if (brewLeagueSubSection === 'national-finals') {
        return <BrewLeagueNationalFinals />;
      }
      if (brewLeagueSubSection === 'am') {
        return <BrewLeagueAMRound />;
      }
      // Placeholder for Store Round
      return (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Store Round
          </h3>
          <p className="text-gray-600 dark:text-slate-400">
            Coming soon! This scoresheet will be available shortly.
          </p>
        </div>
      );
    }

    // Render Bench Planning subsection
    if (activeChecklist === 'bench-planning' && benchPlanningSubSection) {
      if (benchPlanningSubSection === 'barista-sm') {
        return <BenchPlanningChecklist {...commonProps} />;
      }
      if (benchPlanningSubSection === 'sm-asm') {
        return <BenchPlanningSMASMChecklist {...commonProps} />;
      }
      if (benchPlanningSubSection === 'barista-bt') {
        return <BenchPlanningBTChecklist {...commonProps} initialStep={btSessionStep} />;
      }
    }

    // Handle QA subsections
    if (activeChecklist === 'qa' && !qaSubSection) {
      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-orange-500" />
              Quality Assurance
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Select the type of QA audit to begin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setQASubSection('store-qa')}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-400 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-orange-500 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Store QA
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  Quality assurance audit for store operations, hygiene, and compliance
                </p>
                <span className="mt-2 text-sm text-orange-600 dark:text-orange-400 font-medium group-hover:text-orange-700 dark:group-hover:text-orange-300">
                  Open →
                </span>
              </div>
            </button>

            <button
              onClick={() => setQASubSection('vendor-audit')}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-400 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-teal-600 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Factory className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Vendor Audit
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  FSSAI-aligned food safety and quality audit for vendor establishments
                </p>
                <span className="mt-2 text-sm text-teal-600 dark:text-teal-400 font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                  Open →
                </span>
              </div>
            </button>

            <button
              onClick={() => setQASubSection('pre-launch-audit')}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-indigo-600 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Rocket className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Pre-Launch Audit
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  Pre-launch readiness audit for new store openings covering safety & compliance
                </p>
                <span className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  Open →
                </span>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // Render QA subsection
    if (activeChecklist === 'qa' && qaSubSection) {
      if (qaSubSection === 'store-qa') {
        return <QAChecklist {...commonProps} />;
      }
      if (qaSubSection === 'vendor-audit') {
        return <VendorAuditChecklist {...commonProps} />;
      }
      if (qaSubSection === 'pre-launch-audit') {
        return <PreLaunchAuditChecklist {...commonProps} />;
      }
    }

    // Handle HR subsections
    if (activeChecklist === 'hr' && !hrSubSection) {
      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-500" />
              HR
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Select the HR tool to begin.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setHRSubSection('hr-connect')}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-blue-500 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">HR Connect</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">Standard HR checklist for store compliance and people practices</p>
                <span className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">Open →</span>
              </div>
            </button>
            <button
              onClick={() => setHRSubSection('hr-audit')}
              className="group p-8 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-400 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-cyan-600 text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <HeartPulse className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">HR Audit</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">Predictive Store HR Health assessment — 5 dimensions, 28 observations</p>
                <span className="mt-2 text-sm text-cyan-600 dark:text-cyan-400 font-medium group-hover:text-cyan-700 dark:group-hover:text-cyan-300">Open →</span>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // Render HR subsection
    if (activeChecklist === 'hr' && hrSubSection) {
      if (hrSubSection === 'hr-connect') {
        return <HRChecklist {...commonProps} />;
      }
      if (hrSubSection === 'hr-audit') {
        return <HRAuditChecklist {...commonProps} />;
      }
    }

    switch (activeChecklist) {
      case 'hr':
        return <HRChecklist {...commonProps} />;
      case 'operations':
        return <OperationsChecklist {...commonProps} />;
      case 'training':
        return <TrainingChecklist {...commonProps} />;
      case 'finance':
        return <FinanceChecklist {...commonProps} />;
      case 'shlp':
        return <SHLPChecklist {...commonProps} />;
      case 'campus-hiring':
        return <CampusHiringChecklist {...commonProps} />;
      case 'forms':
        return <FormsChecklist {...commonProps} />;
      case 'trainer-calendar':
        return <TrainerCalendarChecklist {...commonProps} />;
      case 'qa-am-review':
        return <QAAMReviewChecklist {...commonProps} />;
      case 'qa-capa':
        return <QACAPAChecklist {...commonProps} />;
      case 'qa-capa-dashboard':
        return <QACAPADashboard onBack={() => setActiveChecklist(null)} />;
      default:
        return <HRChecklist {...commonProps} />;
    }
  };

  const getCompletionColor = (completed: number, total: number) => {
    if (total === 0) return 'text-gray-400';
    const percentage = (completed / total) * 100;
    if (percentage < 50) return 'text-red-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getScoreColor = (score: number) => {
    if (score < 70) return 'text-red-500';
    if (score < 90) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <>
      {/* Fullscreen Checklist View */}
      {activeChecklist && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Header with Breadcrumb */}
          <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Back Button */}
                <button
                  onClick={hrSubSection ? handleBackToHR : qaSubSection ? handleBackToQA : benchPlanningSubSection ? handleBackToBenchPlanning : brewLeagueSubSection ? handleBackToBrewLeague : handleBackToOverview}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label={hrSubSection ? "Back to HR" : qaSubSection ? "Back to QA" : benchPlanningSubSection ? "Back to Bench Planning" : brewLeagueSubSection ? "Back to Brew League" : "Back to checklists overview"}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </button>
                
                <nav className="flex items-center space-x-2 text-sm">
                  {/* Breadcrumb */}
                  <button
                    onClick={handleBackToOverview}
                    className="flex items-center space-x-1 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Checklists</span>
                  </button>
                  <span className="text-gray-400 dark:text-slate-500">/</span>
                  {brewLeagueSubSection && (
                    <>
                      <button
                        onClick={handleBackToBrewLeague}
                        className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                      >
                        {getChecklistLabel(activeChecklist)}
                      </button>
                      <span className="text-gray-400 dark:text-slate-500">/</span>
                    </>
                  )}
                  {benchPlanningSubSection && (
                    <>
                      <button
                        onClick={handleBackToBenchPlanning}
                        className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                      >
                        {getChecklistLabel(activeChecklist)}
                      </button>
                      <span className="text-gray-400 dark:text-slate-500">/</span>
                    </>
                  )}
                  {hrSubSection && (
                    <>
                      <button
                        onClick={handleBackToHR}
                        className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                      >
                        {getChecklistLabel(activeChecklist)}
                      </button>
                      <span className="text-gray-400 dark:text-slate-500">/</span>
                    </>
                  )}
                  {qaSubSection && (
                    <>
                      <button
                        onClick={handleBackToQA}
                        className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                      >
                        {getChecklistLabel(activeChecklist)}
                      </button>
                      <span className="text-gray-400 dark:text-slate-500">/</span>
                    </>
                  )}
                  <span className="text-gray-900 dark:text-slate-100 font-medium">
                    {hrSubSection
                      ? hrSubSection === 'hr-connect' ? 'HR Connect' : 'HR Audit'
                      : qaSubSection
                      ? qaSubSection === 'store-qa' ? 'Store QA'
                        : qaSubSection === 'vendor-audit' ? 'Vendor Audit'
                        : 'Pre-Launch Audit'
                      : benchPlanningSubSection
                      ? benchPlanningSubSection === 'barista-bt' ? 'Buddy Trainer'
                        : benchPlanningSubSection === 'barista-sm' ? 'Shift Manager'
                        : 'ASM'
                      : brewLeagueSubSection 
                        ? brewLeagueSubSection === 'store' ? 'Store Round' 
                          : brewLeagueSubSection === 'am' ? 'AM Round'
                          : brewLeagueSubSection === 'national-finals' ? 'National Finals'
                          : 'Region Round'
                        : getChecklistLabel(activeChecklist)
                    }
                  </span>
                </nav>
              </div>
              
              {/* Right side: Stats + Theme Toggle + Logout */}
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {checklistStats[activeChecklist]?.completed || 0}/{checklistStats[activeChecklist]?.total || 0} completed
                </div>
                <ThemeToggle />
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to sign out?')) {
                      logout();
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Checklist Content */}
          <div className="h-full overflow-y-auto pb-20">
            <div className="w-full p-4 sm:p-6">
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
              {renderActiveChecklist()}
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Checklists Overview */}
      {!activeChecklist && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              Checklists & Surveys
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              Complete departmental checklists and track compliance scores across all areas.
            </p>
          </div>

          {/* Checklist Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${availableChecklists.length > 3 ? 'xl:grid-cols-5' : availableChecklists.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-4`}>
            {availableChecklists.map(checklist => {
              const stats = checklistStats[checklist.id] || { completed: 0, total: 0, score: 0 };
              const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
              const IconComponent = checklist.icon;
              
              return (
                <button
                  key={checklist.id}
                  onClick={() => setActiveChecklist(checklist.id)}
                  className="group p-6 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-400 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 text-left"
                >
                  <div className="flex flex-col h-full">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${checklist.color} text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                      {checklist.label}
                    </h3>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-slate-400">Progress</span>
                        <span className={`font-medium ${getCompletionColor(stats.completed, stats.total)}`}>
                          {stats.completed}/{stats.total}
                        </span>
                      </div>
                      
                      {stats.total > 0 && (
                        <>
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                completionPercentage < 50 ? 'bg-red-500' :
                                completionPercentage < 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-slate-400">Score</span>
                            <span className={`font-medium ${getScoreColor(stats.score)}`}>
                              {Math.round(stats.score)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                      <span className="text-sm text-sky-600 dark:text-sky-400 font-medium group-hover:text-sky-700 dark:group-hover:text-sky-300">
                        {checklist.id === 'trainer-calendar' ? 'Open →' : 'Open Checklist →'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default ChecklistsAndSurveys;