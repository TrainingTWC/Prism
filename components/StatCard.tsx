
import React from 'react';

interface StatCardProps {
  title: string;
  value?: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm p-3 sm:p-5 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 hover:border-sky-500 transition-colors duration-300">
      <p className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-slate-400 truncate leading-tight">{title}</p>
      <p className="mt-1 text-xl sm:text-3xl font-semibold text-gray-900 dark:text-slate-100">{value ?? 'N/A'}</p>
    </div>
  );
};

export default StatCard;
