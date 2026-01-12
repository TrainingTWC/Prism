import React, { useMemo } from 'react';
import { AMOperationsSubmission } from '../services/dataService';
import InfographicCard from './InfographicCard';

interface OperationsMetricsInfographicProps {
  submissions: AMOperationsSubmission[];
  currentStoreFormat?: string;
  currentMenuType?: string;
  currentPriceGroup?: string;
}

const MetricStat: React.FC<{
    label: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
}> = ({ label, value, icon, colorClass }) => (
    <div className="flex items-center space-x-3">
        <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg ${colorClass} bg-opacity-20`}>
            <div className={`${colorClass}`}>{icon}</div>
        </div>
        <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{value}</p>
        </div>
    </div>
);

const OperationsMetricsInfographic: React.FC<OperationsMetricsInfographicProps> = ({ 
  submissions, 
  currentStoreFormat, 
  currentMenuType, 
  currentPriceGroup 
}) => {
  const metrics = useMemo(() => {
    console.log('=== OPERATIONS METRICS CALCULATION ===');
    console.log('OperationsMetricsInfographic - Processing submissions:', submissions?.length || 0);
    console.log('Sample submissions for debugging:', submissions?.slice(0, 3));
    
    if (!submissions || submissions.length === 0) {
      console.log('❌ No submissions available for metrics calculation');
      return {
        avgBSC: 'N/A',
        avgPeople: 'N/A',
        topStoreFormat: currentStoreFormat || 'Select Cafe',
        topMenuType: currentMenuType || 'Select Cafe',
        topPriceGroup: currentPriceGroup || 'Select Cafe',
        manpowerDistribution: { Low: 0, Med: 0, High: 0 }
      };
    }

    try {
      // Calculate average BSC achievement with error handling
      console.log('📊 Starting BSC calculation...');
      const bscSubmissions = submissions.filter(s => s.bscAchievement && s.bscAchievement !== '');
      console.log('BSC submissions found:', bscSubmissions.length, 'out of', submissions.length);
      console.log('BSC values:', bscSubmissions.map(s => s.bscAchievement));
      
      const bscValues = bscSubmissions
        .map(s => {
          try {
            const bscValue = s.bscAchievement || '0';
            // Handle both string and number values
            const stringValue = typeof bscValue === 'string' ? bscValue : String(bscValue);
            const parsed = parseFloat(stringValue.replace('%', ''));
            console.log(`BSC parsing: "${bscValue}" -> "${stringValue}" -> ${parsed}`);
            return parsed;
          } catch (error) {
            console.warn('Error parsing BSC achievement:', s.bscAchievement, error);
            return 0;
          }
        })
        .filter(val => !isNaN(val) && val >= 0);
      
      console.log('Parsed BSC values:', bscValues);
      
      const avgBSC = bscValues.length > 0 
        ? `${Math.round(bscValues.reduce((a, b) => a + b, 0) / bscValues.length)}%`
        : 'N/A';
      
      console.log('✅ Final average BSC:', avgBSC);

      // Calculate average people on shift with error handling
      const peopleValues = submissions
        .filter(s => s.peopleOnShift && s.peopleOnShift !== '')
        .map(s => {
          try {
            const peopleValue = s.peopleOnShift || '0';
            return parseInt(typeof peopleValue === 'string' ? peopleValue : String(peopleValue));
          } catch (error) {
            console.warn('Error parsing people on shift:', s.peopleOnShift, error);
            return 0;
          }
        })
        .filter(val => !isNaN(val) && val >= 0);
      
      const avgPeople = peopleValues.length > 0 
        ? Math.round(peopleValues.reduce((a, b) => a + b, 0) / peopleValues.length).toString()
        : 'N/A';

      // Use current store details if provided, otherwise show placeholder
      const displayStoreFormat = currentStoreFormat || 'Select Cafe';
      const displayMenuType = currentMenuType || 'Select Cafe';
      const displayPriceGroup = currentPriceGroup || 'Select Cafe';

      // Manpower fulfilment distribution
      const manpowerDistribution = submissions.reduce((acc: any, s) => {
        if (s.manpowerFulfilment && s.manpowerFulfilment !== '') {
          acc[s.manpowerFulfilment] = (acc[s.manpowerFulfilment] || 0) + 1;
        }
        return acc;
      }, { Low: 0, Med: 0, High: 0 });

      console.log('Calculated metrics:', { avgBSC, avgPeople, displayStoreFormat, displayMenuType, displayPriceGroup, manpowerDistribution });

      return {
        avgBSC,
        avgPeople,
        topStoreFormat: displayStoreFormat,
        topMenuType: displayMenuType,
        topPriceGroup: displayPriceGroup,
        manpowerDistribution
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        avgBSC: 'Error',
        avgPeople: 'Error',
        topStoreFormat: 'Select Cafe',
        topMenuType: 'Select Cafe',
        topPriceGroup: 'Select Cafe',
        manpowerDistribution: { Low: 0, Med: 0, High: 0 }
      };
    }
  }, [submissions]);

  return (
    <InfographicCard title="Operations Metrics Overview">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricStat
            label="Average BSC Achievement"
            value={metrics.avgBSC}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            colorClass="text-blue-500"
          />
          
          <MetricStat
            label="Average Staff on Shift"
            value={metrics.avgPeople}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            colorClass="text-green-500"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-slate-400">Store Format</p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">{metrics.topStoreFormat}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-slate-400">Menu Type</p>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{metrics.topMenuType}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-slate-400">Price Group</p>
              <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">{metrics.topPriceGroup}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Manpower Fulfilment Distribution</p>
          <div className="flex space-x-4 text-sm">
            <div className="text-center">
              <span className="block text-lg font-bold text-red-500">{metrics.manpowerDistribution.Low}</span>
              <span className="text-gray-600 dark:text-slate-400">Low</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold text-yellow-500">{metrics.manpowerDistribution.Med}</span>
              <span className="text-gray-600 dark:text-slate-400">Med</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold text-green-500">{metrics.manpowerDistribution.High}</span>
              <span className="text-gray-600 dark:text-slate-400">High</span>
            </div>
          </div>
        </div>
      </div>
    </InfographicCard>
  );
};

export default OperationsMetricsInfographic;