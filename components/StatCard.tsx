
import React from 'react';

type AverageValue = {
  latest?: number | null;
  previous?: number | null;
  aggregate?: number | null;
};

interface StatCardProps {
  title: string;
  value?: string | number | AverageValue;
  onClick?: () => void;
  loading?: boolean;
}

/* ── Shared card shell ── */
const CARD =
  'rounded-2xl border border-white/40 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]';

/* ── Small delta badge ── */
const DeltaBadge: React.FC<{ delta: number }> = ({ delta }) => {
  const up = delta >= 0;
  const color = up ? 'text-emerald-600' : 'text-rose-600';
  const bg = up
    ? 'bg-emerald-50 dark:bg-emerald-900/25 border-emerald-200/60 dark:border-emerald-700/40'
    : 'bg-rose-50 dark:bg-rose-900/25 border-rose-200/60 dark:border-rose-700/40';
  const arrow = up ? '↗' : '↘';
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[11px] font-semibold border ${bg} ${color}`}>
      {arrow} {Math.abs(Math.round(delta))}%
    </span>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, onClick, loading = false }) => {
  const isAvgObject =
    typeof value === 'object' &&
    value !== null &&
    ('latest' in (value as any) || 'aggregate' in (value as any));

  const isAuditPercentage = title === 'Audit Percentage';
  const isClickable =
    onClick && (title === 'Total Submissions' || title === 'Stores Covered' || title === 'Audit Percentage');

  /* ── Loading skeleton (shared) ── */
  if (loading) {
    return (
      <div className={`${CARD} flex items-center gap-4 px-5 py-4 ${isClickable ? 'cursor-pointer' : ''}`}>
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-6 w-14 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    );
  }

  /* ── Audit Percentage card ── */
  if (isAuditPercentage) {
    const avg = isAvgObject ? (value as AverageValue) : null;
    const pct = avg ? (avg.latest ?? avg.aggregate ?? 0) : 0;
    const colorClass =
      pct < 71 ? 'text-red-500' : pct < 86 ? 'text-amber-500' : 'text-emerald-500';

    const delta =
      avg && avg.previous != null && avg.latest != null
        ? avg.latest - avg.previous
        : null;

    return (
      <div
        className={`${CARD} flex items-center justify-between px-5 py-4 ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={isClickable ? onClick : undefined}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-extrabold ${colorClass}`}>{pct}%</span>
          {delta !== null && <DeltaBadge delta={delta} />}
        </div>
      </div>
    );
  }

  /* ── Generic stat card ── */
  const renderValue = () => {
    if (isAvgObject) {
      const avg = value as AverageValue;
      const latest = avg.latest;
      const previous = avg.previous;

      if (latest != null) {
        const delta = previous != null ? latest - previous : null;
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {latest}%
            </span>
            {delta !== null && <DeltaBadge delta={delta} />}
          </div>
        );
      }
      return (
        <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          {avg.aggregate ?? '—'}%
        </span>
      );
    }
    return (
      <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
        {String(value ?? 'N/A')}
      </span>
    );
  };

  return (
    <div
      className={`${CARD} flex items-center justify-between px-5 py-4 ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={isClickable ? onClick : undefined}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </span>
      {renderValue()}
    </div>
  );
};

export default StatCard;
