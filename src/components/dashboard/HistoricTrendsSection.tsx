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

  return (
    <div className="mb-6">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all duration-200"
        style={{ border: '1px solid #e5e7eb' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900">Historic Trends & Analysis</h3>
            <p className="text-xs text-gray-500 mt-0.5">Multi-month performance insights from Google Sheets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <span className="text-xs text-gray-500 mr-2">Click to expand</span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
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
      `}</style>
    </div>
  );
}
