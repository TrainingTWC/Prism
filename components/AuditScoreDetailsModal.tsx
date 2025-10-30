import React, { useMemo } from 'react';
import { X } from 'lucide-react';

interface AuditScoreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trendsData: any[];
  filters?: {
    region?: string;
    store?: string;
    am?: string;
    trainer?: string;
    health?: string;
  };
  compStoreMapping?: any[];
}

const AuditScoreDetailsModal: React.FC<AuditScoreDetailsModalProps> = ({
  isOpen,
  onClose,
  trendsData,
  filters = {},
  compStoreMapping = [],
}) => {
  // Helper function to normalize IDs for comparison
  const normalizeId = (id: any) => {
    if (!id) return '';
    return String(id).toUpperCase().trim();
  };

  // Apply filters to trends data
  const filteredTrendsData = useMemo(() => {
    if (!trendsData || trendsData.length === 0) return [];

    // Build a fast lookup map from Store ID -> mapping entry using robust key fallbacks
    const mappingByStoreId = new Map<string, any>();
    try {
      for (const m of compStoreMapping) {
        const id = normalizeId(
          m["Store ID"] || m["StoreID"] || m["StoreId"] || m.store_id || m.storeId || m.Store || m.store
        );
        if (id) mappingByStoreId.set(id, m);
      }
    } catch {
      // no-op; safe guard if compStoreMapping isn't iterable
    }
    
    const filtered = trendsData.filter((row: any) => {
      // Only process percentage metrics
      if (row.metric_name !== 'percentage') return false;
      
      const rowStoreId = normalizeId(row.store_id);
      
      // Find store mapping using comprehensive store mapping
      const storeMapping = mappingByStoreId.get(rowStoreId);
      
      // Filter by region
      if (filters.region) {
        const rowRegion = normalizeId(storeMapping?.Region || storeMapping?.region || row.region);
        if (rowRegion !== normalizeId(filters.region)) return false;
      }
      
      // Filter by store
      if (filters.store && rowStoreId !== normalizeId(filters.store)) {
        return false;
      }
      
      // Filter by area manager
      if (filters.am) {
        const rowAM = normalizeId(storeMapping?.AM || storeMapping?.am || storeMapping?.areaManagerId || row.am_id);
        if (rowAM !== normalizeId(filters.am)) return false;
      }
      
      // Filter by trainer - use exact same logic as Dashboard
      if (filters.trainer) {
        // Prefer mapping, fallback to trends row auditor_id if mapping isn't available
        const rowTrainer = normalizeId(storeMapping?.Trainer || storeMapping?.trainer || row.auditor_id);
        if (!rowTrainer || rowTrainer !== normalizeId(filters.trainer)) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered;
  }, [trendsData, filters, compStoreMapping]);

  // Group trends data by store and get all scores
  const storeScores = useMemo(() => {
    const storeMap = new Map<string, {
      storeId: string;
      storeName: string;
      scores: { date: string; score: number; month: string }[];
    }>();

    // Use filtered trends data
    filteredTrendsData.forEach((row: any) => {
      const storeId = row.store_id || 'Unknown';
      const storeName = row.store_name || storeId;
      const score = parseFloat(row.metric_value || '0');
      const period = row.observed_period || 'Unknown';
      
      // Format month from YYYY-MM to "Month Year"
      const formatMonth = (period: string) => {
        try {
          const [year, month] = period.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch {
          return period;
        }
      };
      
      const month = formatMonth(period);

      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          storeId,
          storeName,
          scores: [],
        });
      }

      storeMap.get(storeId)?.scores.push({
        date: period,
        score,
        month,
      });
    });

    // Sort scores by date (newest first) for each store
    storeMap.forEach(store => {
      store.scores.sort((a, b) => {
        // Sort by observed_period (YYYY-MM format)
        return b.date.localeCompare(a.date);
      });
    });

    // Convert to array
    let storesArray = Array.from(storeMap.values());
    
    // Apply health filter based on latest score
    if (filters.health) {
      storesArray = storesArray.filter(store => {
        const latestScore = store.scores[0]?.score || 0;
        if (filters.health === 'Needs Attention' && latestScore >= 56) return false;
        if (filters.health === 'Brewing' && (latestScore < 56 || latestScore >= 81)) return false;
        if (filters.health === 'Perfect Shot' && latestScore < 81) return false;
        return true;
      });
    }
    
    // Sort by store name
    return storesArray.sort((a, b) => 
      a.storeName.localeCompare(b.storeName)
    );
  }, [filteredTrendsData, filters.health]);

  // Get health category based on score
  const getHealthCategory = (score: number) => {
    if (score < 56) return { label: 'Needs Attention', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' };
    if (score < 81) return { label: 'Brewing', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' };
    return { label: 'Perfect Shot', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
              Store Audit Score Details
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">
              Historical audit scores for all stores
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {storeScores.map(store => {
              const latestScore = store.scores[0]?.score || 0;
              const health = getHealthCategory(latestScore);
              const averageScore = store.scores.reduce((sum, s) => sum + s.score, 0) / store.scores.length;

              return (
                <div
                  key={store.storeId}
                  className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-slate-600"
                >
                  {/* Store Header */}
                  <div className="mb-4">
                    {/* Store Name and ID */}
                    <div className="mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100 break-words">
                        {store.storeName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                        Store ID: {store.storeId}
                      </p>
                    </div>
                    
                    {/* Score Stats - Responsive Layout */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Latest Score</p>
                        <p className={`text-xl sm:text-2xl font-bold ${health.color.split(' ')[0]}`}>
                          {latestScore.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Average</p>
                        <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100">
                          {averageScore.toFixed(1)}%
                        </p>
                      </div>
                      <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold ${health.color}`}>
                        {health.label}
                      </span>
                    </div>
                  </div>

                  {/* Scores Table */}
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-600">
                          <th className="text-left py-2 px-2 sm:px-3 text-gray-700 dark:text-slate-300 font-semibold">
                            Month
                          </th>
                          <th className="text-left py-2 px-2 sm:px-3 text-gray-700 dark:text-slate-300 font-semibold">
                            Score
                          </th>
                          <th className="text-left py-2 px-2 sm:px-3 text-gray-700 dark:text-slate-300 font-semibold">
                            Health
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {store.scores.map((scoreData, index) => {
                          const scoreHealth = getHealthCategory(scoreData.score);

                          return (
                            <tr
                              key={index}
                              className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600/30"
                            >
                              <td className="py-2 px-2 sm:px-3 text-gray-900 dark:text-slate-100">
                                {scoreData.month}
                              </td>
                              <td className="py-2 px-2 sm:px-3">
                                <span className={`font-bold ${scoreHealth.color.split(' ')[0]}`}>
                                  {scoreData.score.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-2 px-2 sm:px-3">
                                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${scoreHealth.color}`}>
                                  {scoreHealth.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Stats */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-gray-600 dark:text-slate-400">
                    <span className="whitespace-nowrap">Total Audits: <strong className="text-gray-900 dark:text-slate-100">{store.scores.length}</strong></span>
                    <span className="whitespace-nowrap">Highest: <strong className="text-emerald-600">{Math.max(...store.scores.map(s => s.score)).toFixed(1)}%</strong></span>
                    <span className="whitespace-nowrap">Lowest: <strong className="text-red-600">{Math.min(...store.scores.map(s => s.score)).toFixed(1)}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 text-center sm:text-left">
            Showing {storeScores.length} store{storeScores.length !== 1 ? 's' : ''} with {filteredTrendsData.length} total audit{filteredTrendsData.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-slate-100 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditScoreDetailsModal;
