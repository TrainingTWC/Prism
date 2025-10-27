import React from 'react';

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Dramatic warning box */}
        <div className="bg-red-950/90 border-4 border-red-600 rounded-lg p-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          {/* Warning icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-xl opacity-50 animate-pulse"></div>
              <svg 
                className="w-24 h-24 text-red-500 relative z-10" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
          </div>

          {/* Main message */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-red-400 mb-4 tracking-wide">
              ACCESS DENIED
            </h1>
            
            <div className="bg-black/50 border border-red-700 rounded p-6 mb-6">
              <p className="text-xl md:text-2xl text-red-300 font-semibold leading-relaxed">
                The firewall just whispered your name to the admin.
              </p>
              <p className="text-2xl md:text-3xl text-red-200 font-bold mt-2">
                Good luck...
              </p>
            </div>

            <div className="text-red-400/80 text-sm space-y-2">
              <p>⚠️ Unauthorized access attempt detected</p>
              <p>🔒 This incident has been logged</p>
              <p className="text-xs text-red-500/60 mt-4">
                If you believe this is an error, contact your administrator
              </p>
            </div>
          </div>

          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-lg pointer-events-none">
            <div className="absolute inset-0 rounded-lg border-2 border-red-500/30 animate-pulse"></div>
          </div>
        </div>

        {/* Subtle glitch effect */}
        <style>{`
          @keyframes glitch {
            0%, 100% { transform: translate(0); }
            25% { transform: translate(-2px, 2px); }
            50% { transform: translate(2px, -2px); }
            75% { transform: translate(-2px, -2px); }
          }
          
          .bg-red-950\\/90:hover h1 {
            animation: glitch 0.3s infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
