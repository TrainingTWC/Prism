/**
 * Forms & Surveys landing — chooser between Management Trainee Feedback
 * (existing FormsChecklist) and Third Rush Feedback (new sub-section).
 */
import React, { useState } from 'react';
import { ClipboardList, Coffee, ArrowRight } from 'lucide-react';
import FormsChecklist from './FormsChecklist';
import ThirdRushFeedback from './thirdRush/ThirdRushFeedback';

type SubSection = 'mt' | 'third-rush' | null;

interface FormsAndSurveysLandingProps {
  userRole?: any;
  onStatsUpdate?: (stats: { completed: number; total: number; score: number }) => void;
}

const FormsAndSurveysLanding: React.FC<FormsAndSurveysLandingProps> = ({ userRole, onStatsUpdate }) => {
  const [section, setSection] = useState<SubSection>(null);

  if (section === 'mt') {
    return (
      <div className="space-y-3">
        <button onClick={() => setSection(null)}
          className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
          ← Back to Forms & Surveys
        </button>
        <FormsChecklist userRole={userRole} onStatsUpdate={onStatsUpdate} />
      </div>
    );
  }

  if (section === 'third-rush') {
    return (
      <div className="space-y-3">
        <button onClick={() => setSection(null)}
          className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
          ← Back to Forms & Surveys
        </button>
        <ThirdRushFeedback userRole={userRole} onStatsUpdate={onStatsUpdate} />
      </div>
    );
  }

  const tiles = [
    {
      id: 'mt' as const,
      title: 'Management Trainee Feedback',
      desc: 'Formal weighted feedback across the MT learning journey.',
      icon: <ClipboardList className="w-6 h-6" />,
      color: 'from-teal-500 to-emerald-600'
    },
    {
      id: 'third-rush' as const,
      title: 'Third Rush Feedback',
      desc: 'Full audit, miscellaneous notes, or store team self-feedback.',
      icon: <Coffee className="w-6 h-6" />,
      color: 'from-cyan-500 to-sky-600'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Forms &amp; Surveys</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Pick a feedback form. New: <strong>Third Rush Feedback</strong> for in-rush audits.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {tiles.map(t => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className="text-left bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 shadow-sm hover:shadow-md transition-all p-5 group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-3`}>
              {t.icon}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{t.title}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t.desc}</p>
            <div className="mt-3 flex items-center gap-1 text-cyan-600 dark:text-cyan-400 text-sm font-medium">
              Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FormsAndSurveysLanding;
