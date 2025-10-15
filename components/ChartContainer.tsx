
import React from 'react';

interface ChartContainerProps {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 min-h-[400px]">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">{title}</h3>
      <div className="h-96 w-full">
         {children}
      </div>
    </div>
  );
};

export default ChartContainer;
