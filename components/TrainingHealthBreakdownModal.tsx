import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { TrainingAuditSubmission } from '../services/dataService';
import comprehensiveStoreMapping from '../public/comprehensive_store_mapping.json';
import trainerMapping from '../trainerMapping.json';
import { AREA_MANAGERS } from '../constants';

interface TrainingHealthBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: TrainingAuditSubmission[];
  trendsData?: any[]; // Historical data from Monthly_Trends sheet
}

// Create lookup maps
const storeMapping = new Map(comprehensiveStoreMapping.map(store => [store['Store ID'], store]));
const trainerNameMapping = new Map(trainerMapping.map(t => [t['Trainer ID']?.toLowerCase(), t.Trainer]));
const amNameMapping = new Map(AREA_MANAGERS.map(am => [am.id, am.name]));

// Add additional trainer mappings not in trainerMapping.json
trainerNameMapping.set('h3595', 'Bhawna');

function getStoreDetails(storeId: string) {
  const store = storeMapping.get(storeId);
  if (!store) {
    console.log('⚠️ Store not found in mapping:', storeId);
  }
  
  const amId = store?.AM || 'Unknown';
  const trainerId = store?.Trainer || 'Unknown';
  
  return {
    region: store?.Region || 'Unknown',
    areaManager: amNameMapping.get(amId) || amId,
    trainer: trainerNameMapping.get(trainerId.toLowerCase()) || trainerId
  };
}

interface MonthHealthStats {
  month: string;
  needsAttention: number;
  brewing: number;
  perfectShot: number;
  total: number;
}

interface CategoryStats {
  [key: string]: MonthHealthStats[];
}

const TrainingHealthBreakdownModal: React.FC<TrainingHealthBreakdownModalProps> = ({ isOpen, onClose, submissions, trendsData = [] }) => {
  const [activeTab, setActiveTab] = useState<'overall' | 'region' | 'am' | 'trainer'>('overall');

  // Helper function to categorize store by score
  const categorizeHealth = (percentage: number): 'needsAttention' | 'brewing' | 'perfectShot' => {
    if (percentage < 56) return 'needsAttention';
    if (percentage < 81) return 'brewing';
    return 'perfectShot';
  };

  // Process both submissions (current) and trendsData (historical) by month
  const monthlyData = useMemo(() => {
    const overall: CategoryStats = { overall: [] };
    const byRegion: CategoryStats = {};
    const byAM: CategoryStats = {};
    const byTrainer: CategoryStats = {};

    // Collect ALL data points with store_id for deduplication
    const allDataPoints: Array<{
      storeId: string;
      percentage: number;
      region: string;
      areaManager: string;
      trainer: string;
      month: string;
      sortDate: Date;
    }> = [];
    
    // Process current submissions (Training Audit data)
    submissions.forEach(sub => {
      const date = new Date(sub.timestamp);
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const storeId = sub.storeId || sub.store || 'unknown';
      const storeDetails = getStoreDetails(storeId);
      
      allDataPoints.push({
        storeId,
        percentage: parseFloat(sub.percentageScore || '0'),
        region: storeDetails.region,
        areaManager: storeDetails.areaManager,
        trainer: storeDetails.trainer,
        month: monthLabel,
        sortDate: date
      });
    });

    // Process historical trendsData (Monthly_Trends sheet)
    trendsData.forEach(row => {
      // Only process percentage metric
      if ((row.metric_name || '').toLowerCase() !== 'percentage') return;
      
      const percentage = parseFloat(row.metric_value || '0');
      const storeId = row.store_id || 'unknown';
      const storeDetails = getStoreDetails(storeId);
      
      // Parse observed_period (YYYY-MM format)
      const period = row.observed_period;
      let monthLabel = period;
      let sortDate: Date | null = null;
      
      // Convert YYYY-MM to "Mon YYYY" format
      if (period && /^\d{4}-\d{2}$/.test(period)) {
        const [year, month] = period.split('-');
        sortDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        monthLabel = sortDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }
      
      if (!monthLabel || !sortDate) return;
      
      allDataPoints.push({
        storeId,
        percentage,
        region: storeDetails.region,
        areaManager: storeDetails.areaManager,
        trainer: storeDetails.trainer,
        month: monthLabel,
        sortDate
      });
    });

    // Sort all data points by date
    allDataPoints.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    // Get unique months in chronological order
    const uniqueMonths = Array.from(new Set(allDataPoints.map(d => d.month)));
    const sortedMonths = uniqueMonths.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    // Filter out "Invalid Date" rows
    const validMonths = sortedMonths.filter(m => m !== 'Invalid Date');
    
    if (validMonths.length === 0) {
      return { overall, byRegion, byAM, byTrainer };
    }
    
    // OVERALL TAB: Month-by-month cumulative breakdown
    validMonths.forEach(currentMonth => {
      const currentDate = new Date(currentMonth);
      
      // Get cumulative data up to this month
      const cumulativeData = allDataPoints.filter(d => d.sortDate <= currentDate);
      
      // Track latest value per unique store
      const latestByStore = new Map<string, typeof allDataPoints[0]>();
      cumulativeData.forEach(data => {
        const existing = latestByStore.get(data.storeId);
        if (!existing || data.sortDate > existing.sortDate) {
          latestByStore.set(data.storeId, data);
        }
      });
      
      const uniqueStoreData = Array.from(latestByStore.values());
      
      // Overall stats for this month
      const overallStats: MonthHealthStats = {
        month: currentMonth,
        needsAttention: 0,
        brewing: 0,
        perfectShot: 0,
        total: uniqueStoreData.length
      };

      uniqueStoreData.forEach(data => {
        const category = categorizeHealth(data.percentage);
        overallStats[category]++;
      });

      overall.overall.push(overallStats);
    });
    
    // BY REGION/AM/TRAINER: Single row showing cumulative up to latest month
    const latestMonth = validMonths[validMonths.length - 1];
    const latestDate = new Date(latestMonth);
    
    // Get cumulative data up to the latest month
    const cumulativeData = allDataPoints.filter(d => d.sortDate <= latestDate);
    
    // Track latest value per unique store
    const latestByStore = new Map<string, typeof allDataPoints[0]>();
    cumulativeData.forEach(data => {
      const existing = latestByStore.get(data.storeId);
      if (!existing || data.sortDate > existing.sortDate) {
        latestByStore.set(data.storeId, data);
      }
    });
    
    const uniqueStoreData = Array.from(latestByStore.values());
    
    uniqueStoreData.forEach(data => {
      const category = categorizeHealth(data.percentage);
      
      // By Region
      const region = data.region;
      if (!byRegion[region]) {
        byRegion[region] = [];
      }
      let regionMonth = byRegion[region].find(m => m.month === latestMonth);
      if (!regionMonth) {
        regionMonth = { month: latestMonth, needsAttention: 0, brewing: 0, perfectShot: 0, total: 0 };
        byRegion[region].push(regionMonth);
      }
      regionMonth[category]++;
      regionMonth.total++;
      
      // By AM
      const am = data.areaManager;
      if (!byAM[am]) {
        byAM[am] = [];
      }
      let amMonth = byAM[am].find(m => m.month === latestMonth);
      if (!amMonth) {
        amMonth = { month: latestMonth, needsAttention: 0, brewing: 0, perfectShot: 0, total: 0 };
        byAM[am].push(amMonth);
      }
      amMonth[category]++;
      amMonth.total++;
      
      // By Trainer
      const trainer = data.trainer;
      if (!byTrainer[trainer]) {
        byTrainer[trainer] = [];
      }
      let trainerMonth = byTrainer[trainer].find(m => m.month === latestMonth);
      if (!trainerMonth) {
        trainerMonth = { month: latestMonth, needsAttention: 0, brewing: 0, perfectShot: 0, total: 0 };
        byTrainer[trainer].push(trainerMonth);
      }
      trainerMonth[category]++;
      trainerMonth.total++;
    });

    return { overall, byRegion, byAM, byTrainer };
  }, [submissions, trendsData]);

  if (!isOpen) return null;

  const renderTable = (data: CategoryStats) => {
    const categories = Object.keys(data).sort();
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activeTab === 'overall' ? 'Month' : activeTab === 'region' ? 'Region' : activeTab === 'am' ? 'Area Manager' : 'Trainer'}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">Needs Attention</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Brewing</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">Perfect Shot</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {categories.map(category => 
              data[category].map((monthStats, idx) => (
                <tr key={`${category}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {activeTab === 'overall' ? monthStats.month : category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {monthStats.needsAttention}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      {monthStats.brewing}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {monthStats.perfectShot}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-slate-900 dark:text-slate-100">
                    {monthStats.total}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'overall':
        return monthlyData.overall;
      case 'region':
        return monthlyData.byRegion;
      case 'am':
        return monthlyData.byAM;
      case 'trainer':
        return monthlyData.byTrainer;
      default:
        return monthlyData.overall;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Store Health Breakdown (Month by Month)
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-6">
          {(['overall', 'region', 'am', 'trainer'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'overall' ? 'Overall' : tab === 'region' ? 'By Region' : tab === 'am' ? 'By AM' : 'By Trainer'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderTable(getCurrentData())}
        </div>
      </div>
    </div>
  );
};

export default TrainingHealthBreakdownModal;
