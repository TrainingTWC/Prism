import React from 'react';

interface LoadingOverlayProps {
  isVisible?: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible = true, 
  message = 'Submitting survey...' 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl max-w-sm w-full mx-4">
        <div className="text-center">
          {/* Animated spinner */}
          <div className="mb-4 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
          </div>
          
          {/* Loading message */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Please wait
          </h3>
          <p className="text-gray-600 dark:text-slate-400">
            {message}
          </p>
          
          {/* Animated dots */}
          <div className="flex justify-center mt-4 space-x-1">
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;