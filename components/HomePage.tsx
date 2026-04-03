import React from 'react';
import { BarChart3, ClipboardCheck } from 'lucide-react';

interface HomePageProps {
  onNavigate: (section: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-8">
      {/* PRISM branding */}
      <div className="text-center mb-16">
        <img
          src={`${(import.meta as any).env?.BASE_URL || '/'}prism-logo-kittl.svg`}
          alt="Prism Logo"
          className="w-16 h-16 mx-auto mb-6 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <h1 className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
          PRISM
        </h1>
        <p className="text-sm tracking-[0.25em] text-gray-400 dark:text-slate-500 uppercase">
          Performance, Reviews, Insights, Standards & Metrics
        </p>
      </div>

      {/* Two navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
        <button
          onClick={() => onNavigate('dashboard')}
          className="group flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-sky-50 dark:bg-sky-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Dashboards</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
            View performance analytics, health scores & operational data
          </p>
        </button>

        <button
          onClick={() => onNavigate('checklists')}
          className="group flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <ClipboardCheck className="w-8 h-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Checklists & Surveys</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
            Submit audits, run checklists & manage field operations
          </p>
        </button>
      </div>
    </div>
  );
};

export default HomePage;
