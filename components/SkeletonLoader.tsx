import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'chart' | 'table' | 'stat' | 'list';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'stat':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          </div>
        );

      case 'chart':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="flex items-end space-x-2 h-48">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-t"
                    style={{ height: `${Math.random() * 60 + 40}%` }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-8"></div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'card':
      default:
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/6"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
      ))}
    </>
  );
};

export default SkeletonLoader;
