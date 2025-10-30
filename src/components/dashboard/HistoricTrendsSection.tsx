import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import StoreTrends from './StoreTrends';
import { UniqueStoresPills } from './UniqueStoresPills';
import { useTrendsData } from './useTrendsData';

interface HistoricTrendsSectionProps {
  filters?: any;
}

export function HistoricTrendsSection({ filters }: HistoricTrendsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // ✅ ALWAYS fetch trends data (not conditionally based on expand state)
  // This starts loading immediately when component mounts (on login)
  // Data is cached and reused when collapsing/expanding
  const { rows, loading, error } = useTrendsData();
  
  console.log('🎯 HistoricTrendsSection - rows from useTrendsData:', rows?.length || 0, 'isExpanded:', isExpanded);

  // Log when passing data to children (only when expanded)
  if (isExpanded) {
    console.log('🎯 HistoricTrendsSection - Passing to StoreTrends:', { rowsLength: rows?.length || 0, loading });
  }

  return (
    <div className="mb-6">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-full overflow-hidden rounded-lg shadow-lg p-4 flex items-center justify-between hover:shadow-xl transition-all duration-200 animate-gradient-wave"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-white">Historic Trends & Analysis</h3>
            <p className="text-xs text-white/90 mt-0.5">Multi-month performance insights from Google Sheets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <span className="text-xs text-white/90 mr-2">Click to expand</span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fadeIn">
          {/* Unique Stores Pills */}
          <UniqueStoresPills filters={filters} rows={rows} loading={loading} />
          
          {/* Monthly Performance Trend with Top Movers */}
          <StoreTrends filters={filters} rows={rows} loading={loading} />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes gradientWave {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient-wave {
          background: linear-gradient(
            90deg,
            rgba(79, 70, 229, 0.8) 0%,
            rgba(147, 51, 234, 0.8) 25%,
            rgba(168, 85, 247, 0.8) 35%,
            rgba(139, 92, 246, 0.8) 50%,
            rgba(6, 182, 212, 0.8) 75%,
            rgba(79, 70, 229, 0.8) 100%
          );
          background-size: 200% 100%;
          animation: gradientWave 6s ease infinite;
        }
        
        .dark .animate-gradient-wave {
          background: linear-gradient(
            90deg,
            rgba(67, 56, 202, 0.8) 0%,
            rgba(126, 34, 206, 0.8) 25%,
            rgba(147, 51, 234, 0.8) 35%,
            rgba(124, 58, 237, 0.8) 50%,
            rgba(8, 145, 178, 0.8) 75%,
            rgba(67, 56, 202, 0.8) 100%
          );
          background-size: 200% 100%;
          animation: gradientWave 6s ease infinite;
        }
      `}</style>
    </div>
  );
}
