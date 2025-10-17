
import React from 'react';

type AverageValue = {
  latest?: number | null;
  previous?: number | null;
  aggregate?: number | null; // used when there is no latest/previous
};

interface StatCardProps {
  title: string;
  value?: string | number | AverageValue;
}

const TrendArrow: React.FC<{ latest: number; previous?: number | null }> = ({ latest, previous }) => {
  if (previous === null || previous === undefined) return <span className="text-gray-500">{latest}%</span>;
  const delta = latest - previous;
  const up = delta >= 0;
  const color = up ? 'text-green-600' : 'text-red-600';
  const arrow = up ? '▲' : '▼';
  return (
    <span className={`font-semibold ${color}`}>
      {latest}% <span className="text-sm text-gray-500">({arrow} {Math.abs(delta)}%)</span>
    </span>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  // If value is structured AverageValue, render compact trend view
  const isAvgObject = typeof value === 'object' && value !== null && ('latest' in (value as any) || 'aggregate' in (value as any));

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm p-3 sm:p-5 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 hover:border-sky-500 transition-colors duration-300">
      <p className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-slate-400 truncate leading-tight">{title}</p>
      {isAvgObject ? (
        (() => {
          const avg = value as AverageValue;
          if (avg.latest !== undefined && avg.latest !== null) {
            // show latest with arrow/delta compared to previous
            return (
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-slate-100">
                  <TrendArrow latest={avg.latest as number} previous={avg.previous ?? null} />
                </div>
                <div className="text-xs text-gray-500">{avg.previous !== null && avg.previous !== undefined ? 'Prev' : ''}</div>
              </div>
            );
          }
          // fallback: show aggregate percentage
          return <p className="mt-1 text-xl sm:text-3xl font-semibold text-gray-900 dark:text-slate-100">{avg.aggregate ?? '—'}%</p>;
        })()
      ) : (
        <p className="mt-1 text-xl sm:text-3xl font-semibold text-gray-900 dark:text-slate-100">{String(value ?? 'N/A')}</p>
      )}
    </div>
  );
};

export default StatCard;
