import React, { useMemo, useEffect, useRef, useState } from 'react';
import { TrainingAuditSubmission } from '../services/dataService';
import { useAuditNavigation } from '../contexts/auditNavigationStore';

interface TrainingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: TrainingAuditSubmission[];
  title: string;
  filterType?: 'region' | 'trainer' | 'section' | 'scoreRange' | 'store' | 'am' | 'hr';
  filterValue?: string | number;
}

// Define section question mappings for detailed analysis
const sectionQuestionMappings: Record<string, string[]> = {
  'Section 1': ['Q1: Greeting', 'Q2: Acknowledgment', 'Q3: Product Knowledge'],
  'Section 2': ['Q4: Service Quality', 'Q5: Problem Resolution', 'Q6: Follow-up'],
  'Section 3': ['Q7: Closing', 'Q8: Thank You', 'Q9: Additional Assistance'],
  'Section 4': ['Q10: Store Cleanliness', 'Q11: Product Display', 'Q12: Safety Protocols'],
  'Section 5': ['Q13: Team Coordination', 'Q14: Communication', 'Q15: Efficiency'],
  'TSA Food': ['Food Quality', 'Food Presentation', 'Food Safety'],
  'TSA Coffee': ['Coffee Quality', 'Coffee Temperature', 'Coffee Service'],
  'TSA CX': ['Customer Experience', 'Wait Time', 'Overall Satisfaction']
};

const TrainingDetailModal: React.FC<TrainingDetailModalProps> = ({
  isOpen,
  onClose,
  submissions,
  title,
  filterType,
  filterValue,
}) => {
  console.log('TrainingDetailModal props:', { isOpen, submissions: submissions?.length, title, filterType, filterValue });
  
  const { 
    selectedSection, 
    setSelectedRegion, 
    setSelectedTrainer, 
    setSelectedSection, 
    setSelectedScoreRange, 
    setSelectedStore 
  } = useAuditNavigation();

  // Touch and gesture handling for mobile
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = 'auto';
    }

    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle browser back button on mobile - disabled for now to prevent conflicts
  // Can be re-enabled if needed with more sophisticated state management
  /*
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      onClose();
    };

    window.history.pushState({ modalOpen: true }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
  */

  // Handle swipe down gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd < -150) {
      // Swipe down by more than 150px closes the modal
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previousOverflow; };
    }
    return;
  }, [isOpen]);

  const stats = useMemo(() => {
    console.log('TrainingDetailModal stats calculation:', { 
      submissions: submissions?.length || 0,
      title 
    });
    
    if (!submissions || submissions.length === 0) {
      return {
        totalSubmissions: 0,
        avgScore: 0,
        avgPercentage: 0,
        avgTSAFood: 0,
        avgTSACoffee: 0,
        avgTSACX: 0,
        excellent: 0,
        good: 0,
        average: 0,
        belowAverage: 0,
        regions: [],
        trainers: [],
        sectionBreakdown: [],
        questionBreakdown: [],
        filteredSubmissions: [] // Add filtered submissions to return value
      };
    }

    // Filter submissions based on filterType
    let filteredSubmissions = submissions;
    
    if (filterType && filterValue) {
      console.log('Filtering by:', { filterType, filterValue, totalSubmissions: submissions.length });
      
      // Special case: for "All Training Submissions", don't filter - show all data
      if (title === 'All Training Submissions' && filterValue === 'all') {
        console.log('Showing all training submissions without filtering');
        filteredSubmissions = submissions;
      } else if (filterType === 'scoreRange') {
        // Parse score range like "90-100" or "60-69"
        const rangeStr = filterValue.toString();
        const [minStr, maxStr] = rangeStr.split('-');
        const minScore = parseFloat(minStr);
        const maxScore = parseFloat(maxStr);
        
        filteredSubmissions = submissions.filter(sub => {
          const score = parseFloat(sub.percentageScore || '0');
          return score >= minScore && score <= maxScore;
        });
      } else if (filterType === 'region') {
        // Filter by region (only if not 'all')
        if (filterValue !== 'all') {
          filteredSubmissions = submissions.filter(sub => 
            sub.region === filterValue
          );
        }
      } else if (filterType === 'am' || filterType === 'trainer' || filterType === 'hr') {
        // Filter by trainer name
        filteredSubmissions = submissions.filter(sub => 
          sub.trainerName === filterValue
        );
      } else if (filterType === 'store') {
        // Filter by store ID
        filteredSubmissions = submissions.filter(sub => 
          (sub.storeId || sub.storeID) === filterValue
        );
      }
      // Note: 'section' filterType doesn't need filtering here as it's used for 
      // displaying section-specific question breakdown
      
      console.log('Filtered submissions:', filteredSubmissions.length);
    }

    const totalSubmissions = filteredSubmissions.length;
    
    if (totalSubmissions === 0) {
      return {
        totalSubmissions: 0,
        avgScore: 0,
        avgPercentage: 0,
        avgTSAFood: 0,
        avgTSACoffee: 0,
        avgTSACX: 0,
        excellent: 0,
        good: 0,
        average: 0,
        belowAverage: 0,
        regions: [],
        trainers: [],
        sectionBreakdown: [],
        questionBreakdown: [],
        filteredSubmissions: [] // Add filtered submissions to return value
      };
    }
    const totalScore = filteredSubmissions.reduce((sum, sub) => sum + parseFloat(sub.percentageScore || '0'), 0);
    const avgScore = totalScore / totalSubmissions;
    const avgPercentage = avgScore; // Already a percentage

    // Calculate TSA averages as percentages
  const tsaFoodScores = filteredSubmissions.map(sub => (Number(sub.tsaFoodScore) || 0) * 10).filter(score => score > 0);
  const tsaCoffeeScores = filteredSubmissions.map(sub => (Number(sub.tsaCoffeeScore) || 0) * 10).filter(score => score > 0);
  const tsaCXScores = filteredSubmissions.map(sub => (Number(sub.tsaCXScore) || 0) * 10).filter(score => score > 0);

    const avgTSAFood = tsaFoodScores.length > 0 ? tsaFoodScores.reduce((sum, score) => sum + score, 0) / tsaFoodScores.length : 0;
    const avgTSACoffee = tsaCoffeeScores.length > 0 ? tsaCoffeeScores.reduce((sum, score) => sum + score, 0) / tsaCoffeeScores.length : 0;
    const avgTSACX = tsaCXScores.length > 0 ? tsaCXScores.reduce((sum, score) => sum + score, 0) / tsaCXScores.length : 0;

    // Score distribution
    const excellent = filteredSubmissions.filter(sub => parseFloat(sub.percentageScore || '0') >= 90).length;
    const good = filteredSubmissions.filter(sub => parseFloat(sub.percentageScore || '0') >= 75 && parseFloat(sub.percentageScore || '0') < 90).length;
    const average = filteredSubmissions.filter(sub => parseFloat(sub.percentageScore || '0') >= 60 && parseFloat(sub.percentageScore || '0') < 75).length;
    const belowAverage = filteredSubmissions.filter(sub => parseFloat(sub.percentageScore || '0') < 60).length;

    // Region breakdown
    const regionMap = new Map<string, { count: number; totalScore: number }>();
    filteredSubmissions.forEach(sub => {
      if (sub.region) {
        const existing = regionMap.get(sub.region) || { count: 0, totalScore: 0 };
        regionMap.set(sub.region, {
          count: existing.count + 1,
          totalScore: existing.totalScore + parseFloat(sub.percentageScore || '0')
        });
      }
    });

    const regions = Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      count: data.count,
      avgScore: Math.round((data.totalScore / data.count) * 10) / 10
    }));

    // Trainer breakdown
    const trainerMap = new Map<string, { count: number; totalScore: number }>();
    filteredSubmissions.forEach(sub => {
      if (sub.trainerName) {
        const existing = trainerMap.get(sub.trainerName) || { count: 0, totalScore: 0 };
        trainerMap.set(sub.trainerName, {
          count: existing.count + 1,
          totalScore: existing.totalScore + parseFloat(sub.percentageScore || '0')
        });
      }
    });

    const trainers = Array.from(trainerMap.entries()).map(([trainerName, data]) => ({
      trainer: trainerName,
      count: data.count,
      avgScore: Math.round((data.totalScore / data.count) * 10) / 10
    }));

    // Section breakdown - analyzing individual sections
    const sectionBreakdown = [];
    if (filterType === 'section' && filterValue) {
      const sectionName = filterValue as string;
      const questions = sectionQuestionMappings[sectionName] || [];
      
      questions.forEach((question, index) => {
        // Simulate question scores based on overall section performance
        const questionScores = filteredSubmissions.map(sub => {
          const baseScore = parseFloat(sub.percentageScore || '0');
          // Add some variance to simulate individual question performance
          const variance = (Math.random() - 0.5) * 20;
          return Math.max(0, Math.min(100, baseScore + variance));
        });
        
        const avgQuestionScore = questionScores.reduce((sum, score) => sum + score, 0) / questionScores.length;
        const passRate = questionScores.filter(score => score >= 75).length / questionScores.length * 100;
        
        sectionBreakdown.push({
          question,
          avgScore: Math.round(avgQuestionScore * 10) / 10,
          passRate: Math.round(passRate * 10) / 10,
          totalResponses: questionScores.length
        });
      });
    }

    return {
      totalSubmissions,
      avgScore: Math.round(avgScore * 10) / 10,
      avgPercentage: Math.round(avgPercentage * 10) / 10,
      avgTSAFood: Math.round(avgTSAFood * 10) / 10,
      avgTSACoffee: Math.round(avgTSACoffee * 10) / 10,
      avgTSACX: Math.round(avgTSACX * 10) / 10,
      excellent,
      good,
      average,
      belowAverage,
      regions: regions.sort((a, b) => b.avgScore - a.avgScore),
      trainers: trainers.sort((a, b) => b.avgScore - a.avgScore),
      sectionBreakdown,
      questionBreakdown: [],
      filteredSubmissions // Add filtered submissions to return value
    };
  }, [submissions, filterType, filterValue, title]);

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    onClose();
  };

  const handleTrainerClick = (trainer: string) => {
    setSelectedTrainer(trainer);
    onClose();
  };

  const handleSectionClick = (section: string) => {
    setSelectedSection(section);
    onClose();
  };

  const handleScoreRangeClick = (range: string) => {
    setSelectedScoreRange(range);
    onClose();
  };

  const handleStoreClick = (store: string) => {
    setSelectedStore(store);
    onClose();
  };

  if (!isOpen) return null;

  // Early return if no submissions data to prevent errors
  if (!submissions || submissions.length === 0) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
        style={{ background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(18px) saturate(120%)' }}
      >
        <div className="rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400">
            No data available for the selected filter.
          </div>
        </div>
      </div>
    );
  }



  return (
    <div 
      className="modal-overlay fixed inset-0 flex items-center justify-center z-[9999]"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        background: 'rgba(0,0,0,0.2)', 
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
    >
      <div 
        ref={modalContentRef}
        className="rounded-lg shadow-xl max-w-7xl w-[95vw] mx-4 max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: 'rgba(255,255,255,0.1)', 
          border: '1px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(0, 0, 0, 0.35)'
        }}
      >
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Show custom content for Total Submissions */}
          {title === 'All Training Submissions' ? (
            <div className="space-y-8">
              {/* Latest Submission */}
              <div className="bg-white/3 border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Latest Submission</h3>
                {stats.filteredSubmissions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      // Sort by submission time - try multiple possible field names and log the data
                      console.log('Sample submission data for debugging:', stats.filteredSubmissions.slice(0, 3).map(sub => ({
                        store: sub.storeName || sub.storeId,
                        allTimeFields: Object.keys(sub).filter(key => 
                          key.toLowerCase().includes('time') || 
                          key.toLowerCase().includes('date') || 
                          key.toLowerCase().includes('timestamp')
                        ),
                        submissionTime: sub.submissionTime,
                        submissionDate: sub.submissionDate,
                        timestamp: sub.timestamp
                      })));
                      
                      const latest = stats.filteredSubmissions.sort((a, b) => {
                        // Try different possible date field names
                        const timeA = a.submissionTime || a.submissionDate || a.timestamp || a.Timestamp || a['Submission Time'] || '';
                        const timeB = b.submissionTime || b.submissionDate || b.timestamp || b.Timestamp || b['Submission Time'] || '';
                        
                        const dateA = new Date(timeA).getTime();
                        const dateB = new Date(timeB).getTime();
                        
                        // If both dates are invalid, maintain original order
                        if (isNaN(dateA) && isNaN(dateB)) return 0;
                        // If one date is invalid, put the valid one first
                        if (isNaN(dateA)) return 1;
                        if (isNaN(dateB)) return -1;
                        
                        return dateB - dateA; // Most recent first
                      })[0];
                      
                      console.log('Latest submission selected:', {
                        store: latest.storeName || latest.storeId,
                        time: latest.submissionTime || latest.submissionDate || latest.timestamp || latest.Timestamp || latest['Submission Time'],
                        trainer: latest.trainerName,
                        allTimeFields: Object.keys(latest).filter(key => 
                          key.toLowerCase().includes('time') || 
                          key.toLowerCase().includes('date') || 
                          key.toLowerCase().includes('timestamp')
                        )
                      });
                      
                      const submissionTimeField = latest.submissionTime || latest.submissionDate || latest.timestamp || latest.Timestamp || latest['Submission Time'] || '';
                      
                      return (
                        <>
                          <div className="text-center">
                            <p className="text-sm text-white">Date</p>
                            <p className="text-lg font-bold text-white">
                              {submissionTimeField ? new Date(submissionTimeField).toLocaleDateString() : 'Invalid Date'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-white">Store</p>
                            <p className="text-lg font-bold text-white">
                              {latest.locationName || latest.storeName || latest.storeId || latest.storeID || 'N/A'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-white">Trainer</p>
                            <p className="text-lg font-bold text-white">
                              {latest.trainerName || 'N/A'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-white">Score</p>
                            <p className="text-lg font-bold text-white">
                              {latest.percentageScore || '0'}%
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No submissions available</p>
                )}
              </div>

              {/* Stores with Highest to Lowest Submissions */}
              <div className="bg-white/3 border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Stores by Submission Count</h3>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <div>
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Store</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Submissions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Avg Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Latest</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                      {(() => {
                        const storeStats = stats.filteredSubmissions.reduce((acc, sub) => {
                          const storeKey = sub.storeName || sub.storeId || 'Unknown';
                          if (!acc[storeKey]) {
                            acc[storeKey] = {
                              count: 0,
                              totalScore: 0,
                              latest: null as string | null
                            };
                          }
                          acc[storeKey].count++;
                          acc[storeKey].totalScore += parseFloat(sub.percentageScore || '0');
                          const subTime = sub.submissionTime || sub.submissionDate || sub.timestamp || '';
                          const subDate = new Date(subTime);
                          if (!acc[storeKey].latest || subDate > new Date(acc[storeKey].latest)) {
                            acc[storeKey].latest = subTime;
                          }
                          return acc;
                        }, {} as Record<string, { count: number; totalScore: number; latest: string | null }>);

                        return Object.entries(storeStats)
                          .sort(([,a], [,b]) => b.count - a.count)
                          .slice(0, 10)
                          .map(([store, data]) => (
                            <tr key={store} className="hover:bg-white/5">
                              <td className="px-4 py-3 text-sm font-medium text-white">{store}</td>
                              <td className="px-4 py-3 text-sm text-white">{data.count}</td>
                              <td className="px-4 py-3 text-sm text-white">
                                {Math.round(data.totalScore / data.count)}%
                              </td>
                              <td className="px-4 py-3 text-sm text-white">
                                {data.latest ? new Date(data.latest).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

              {/* Months with Highest Submissions */}
              <div className="bg-white/3 border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Monthly Submission Trends</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(() => {
                    const monthStats = stats.filteredSubmissions.reduce((acc, sub) => {
                      const date = new Date(sub.submissionTime || sub.submissionDate || sub.timestamp || '');
                      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                      
                      if (!acc[monthKey]) {
                        acc[monthKey] = { name: monthName, count: 0 };
                      }
                      acc[monthKey].count++;
                      return acc;
                    }, {} as Record<string, { name: string; count: number }>);

                    return Object.entries(monthStats)
                      .sort(([,a], [,b]) => b.count - a.count)
                      .slice(0, 8)
                      .map(([key, data]) => (
                        <div key={key} className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{data.name}</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.count}</p>
                        </div>
                      ));
                  })()}
                </div>
              </div>

              {/* Trainer-wise Submissions */}
              <div className="bg-white/3 border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Trainer-wise Submissions</h3>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <div>
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Trainer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Submissions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Avg Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Best Score</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Latest</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                      {(() => {
                        const trainerStats = stats.filteredSubmissions.reduce((acc, sub) => {
                          const trainer = sub.trainerName || 'Unknown';
                          if (!acc[trainer]) {
                            acc[trainer] = {
                              count: 0,
                              totalScore: 0,
                              bestScore: 0,
                              latest: null as string | null
                            };
                          }
                          acc[trainer].count++;
                          const score = parseFloat(sub.percentageScore || '0');
                          acc[trainer].totalScore += score;
                          acc[trainer].bestScore = Math.max(acc[trainer].bestScore, score);
                          const subTime = sub.submissionTime || sub.submissionDate || sub.timestamp || '';
                          const subDate = new Date(subTime);
                          if (!acc[trainer].latest || subDate > new Date(acc[trainer].latest)) {
                            acc[trainer].latest = subTime;
                          }
                          return acc;
                        }, {} as Record<string, { count: number; totalScore: number; bestScore: number; latest: string | null }>);

                        return Object.entries(trainerStats)
                          .sort(([,a], [,b]) => b.count - a.count)
                          .map(([trainer, data]) => (
                            <tr key={trainer} className="hover:bg-white/5">
                              <td className="px-4 py-3 text-sm font-medium text-white">{trainer}</td>
                              <td className="px-4 py-3 text-sm text-white">{data.count}</td>
                              <td className="px-4 py-3 text-sm text-white">
                                {Math.round(data.totalScore / data.count)}%
                              </td>
                              <td className="px-4 py-3 text-sm text-white">
                                {Math.round(data.bestScore)}%
                              </td>
                              <td className="px-4 py-3 text-sm text-white">
                                {data.latest ? new Date(data.latest).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Default overview stats for other modal types
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-white">Total Submissions</h3>
                <p className="text-2xl font-bold text-blue-400">{stats.totalSubmissions}</p>
              </div>
              <div className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-white">Average Score</h3>
                <p className="text-2xl font-bold text-green-400">{stats.avgScore}%</p>
              </div>
              <div className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-white">Pass Rate</h3>
                <p className="text-2xl font-bold text-purple-400">
                  {Math.round(((stats.excellent + stats.good) / stats.totalSubmissions) * 100)}%
                </p>
              </div>
              <div className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-white">Excellence Rate</h3>
                <p className="text-2xl font-bold text-orange-400">
                  {Math.round((stats.excellent / stats.totalSubmissions) * 100)}%
                </p>
              </div>
            </div>
          )}

          {/* TSA Scores */}
          {(stats.avgTSAFood > 0 || stats.avgTSACoffee > 0 || stats.avgTSACX > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">TSA Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.avgTSAFood > 0 && (
                  <div className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-white">TSA Food</h4>
                    <p className="text-xl font-bold text-red-400">{stats.avgTSAFood}%</p>
                  </div>
                )}
                {stats.avgTSACoffee > 0 && (
                  <div className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-white">TSA Coffee</h4>
                    <p className="text-xl font-bold text-amber-400">{stats.avgTSACoffee}%</p>
                  </div>
                )}
                {stats.avgTSACX > 0 && (
                  <div className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-white">TSA CX</h4>
                    <p className="text-xl font-bold text-indigo-400">{stats.avgTSACX}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Store Performance for Selected Section */}
          {filterType === 'section' && filterValue && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Store Performance - {title}
              </h3>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <div>
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Store
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Section Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {stats.filteredSubmissions.map((submission, index) => {
                      // Calculate section-specific score based on section ID
                      let sectionScore = 0;
                      let maxScore = 0;
                      let percentage = 0;
                      
                      // Define section question mappings
                      const sectionMappings: Record<string, { questions: string[], maxPerQuestion: number }> = {
                        'TSA': { 
                          questions: ['tsaFoodScore', 'tsaCoffeeScore', 'tsaCXScore'], 
                          maxPerQuestion: 10 
                        },
                        'TrainingMaterials': { 
                          questions: ['TM_1', 'TM_2', 'TM_3', 'TM_4', 'TM_5', 'TM_6', 'TM_7', 'TM_8', 'TM_9'], 
                          maxPerQuestion: 1 
                        },
                        'LMS': { 
                          questions: ['LMS_1', 'LMS_2', 'LMS_3'], 
                          maxPerQuestion: 1 
                        },
                        'Buddy': { 
                          questions: ['Buddy_1', 'Buddy_2', 'Buddy_3', 'Buddy_4', 'Buddy_5', 'Buddy_6'], 
                          maxPerQuestion: 1 
                        },
                        'NewJoiner': { 
                          questions: ['NJ_1', 'NJ_2', 'NJ_3', 'NJ_4', 'NJ_5', 'NJ_6', 'NJ_7'], 
                          maxPerQuestion: 1 
                        },
                        'PartnerKnowledge': { 
                          questions: ['PK_1', 'PK_2', 'PK_3', 'PK_4', 'PK_5', 'PK_6'], 
                          maxPerQuestion: 1 
                        },
                        'CustomerExperience': { 
                          questions: ['CX_1', 'CX_2', 'CX_3', 'CX_4', 'CX_5', 'CX_6', 'CX_7', 'CX_8', 'CX_9'], 
                          maxPerQuestion: 1 
                        },
                        'ActionPlan': { 
                          questions: ['AP_1', 'AP_2', 'AP_3'], 
                          maxPerQuestion: 1 
                        }
                      };
                      
                      const mapping = sectionMappings[filterValue as string];
                      
                      if (mapping) {
                        mapping.questions.forEach(qId => {
                          let response;
                          
                          // Special handling for TSA fields
                          if (qId === 'tsaFoodScore') {
                            response = submission.tsaFoodScore || submission.TSA_Food_Score || submission.TSA_1;
                          } else if (qId === 'tsaCoffeeScore') {
                            response = submission.tsaCoffeeScore || submission.TSA_Coffee_Score || submission.TSA_2;
                          } else if (qId === 'tsaCXScore') {
                            response = submission.tsaCXScore || submission.TSA_CX_Score || submission.TSA_3;
                          } else {
                            response = submission[qId];
                          }
                          
                          if (response !== undefined && response !== null && response !== '' && response !== 'na') {
                            if (response === 'yes' || response === 'Yes') {
                              sectionScore += 1;
                              maxScore += mapping.maxPerQuestion;
                            } else if (response === 'no' || response === 'No') {
                              sectionScore += 0;
                              maxScore += mapping.maxPerQuestion;
                            } else if (!isNaN(parseFloat(response))) {
                              sectionScore += Math.min(parseFloat(response), mapping.maxPerQuestion);
                              maxScore += mapping.maxPerQuestion;
                            }
                          }
                        });
                        
                        percentage = maxScore > 0 ? (sectionScore / maxScore) * 100 : 0;
                      }
                      
                      // Determine color based on score
                      let scoreColor = '';
                      let percentageColor = '';
                      
                      if (maxScore === 0) {
                        // Grey for no data (0.0/0.0)
                        scoreColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
                        percentageColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
                      } else if (sectionScore === 0) {
                        // Red for zero scores (0/3, 0/2, 0/1)
                        scoreColor = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
                        percentageColor = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
                      } else if (sectionScore === maxScore) {
                        // Green for perfect score (3/3, 2/2, 1/1, etc.)
                        scoreColor = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
                        percentageColor = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
                      } else {
                        // Amber for partial scores (1/3, 2/3, 1/2, etc.)
                        scoreColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
                        percentageColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
                      }
                      
                      return (
                        <tr key={index} className="hover:bg-white/5">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {submission.storeName || submission.storeId || 'Unknown Store'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${scoreColor}`}>
                              {sectionScore.toFixed(1)} / {maxScore.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${percentageColor}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* Section Question Breakdown - REMOVED */}
          {false && stats.sectionBreakdown.length > 0 && filterType === 'section' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Question-wise Performance for {filterValue}
              </h3>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <div>
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Question
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Avg Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Pass Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Responses
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {stats.sectionBreakdown.map((item, index) => (
                      <tr key={index} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {item.question}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.avgScore >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            item.avgScore >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {item.avgScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {item.passRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {item.totalResponses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* Score Distribution */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleScoreRangeClick('90-100')}
              >
                <h4 className="text-sm font-medium text-white">Excellent (90-100%)</h4>
                <p className="text-xl font-bold text-green-400">{stats.excellent}</p>
              </div>
              <div 
                className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleScoreRangeClick('75-89')}
              >
                <h4 className="text-sm font-medium text-white">Good (75-89%)</h4>
                <p className="text-xl font-bold text-blue-400">{stats.good}</p>
              </div>
              <div 
                className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleScoreRangeClick('60-74')}
              >
                <h4 className="text-sm font-medium text-white">Average (60-74%)</h4>
                <p className="text-xl font-bold text-yellow-400">{stats.average}</p>
              </div>
              <div 
                className="bg-white/3 backdrop-blur-sm border border-white/20 p-4 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleScoreRangeClick('0-59')}
              >
                <h4 className="text-sm font-medium text-white">Below Average (&lt;60%)</h4>
                <p className="text-xl font-bold text-red-400">{stats.belowAverage}</p>
              </div>
            </div>
          </div>

          {/* Regions Performance */}
          {stats.regions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Regional Performance</h3>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <div>
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Region
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Submissions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Avg Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {stats.regions.map((region, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-white/5 cursor-pointer"
                        onClick={() => handleRegionClick(region.region)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {region.region}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {region.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            region.avgScore >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            region.avgScore >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {region.avgScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* Trainers Performance */}
          {stats.trainers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Trainer Performance</h3>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <div>
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Trainer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Submissions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Avg Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {stats.trainers.map((trainer, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-white/5 cursor-pointer"
                        onClick={() => handleTrainerClick(trainer.trainer)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {trainer.trainer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {trainer.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            trainer.avgScore >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            trainer.avgScore >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {trainer.avgScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Recent Submissions</h3>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <div>
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        DATE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        STORE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Trainer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                  {(stats.filteredSubmissions || []).slice(0, 10).map((submission, index) => (
                    <tr key={index} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {submission.submissionTime ? new Date(submission.submissionTime).toLocaleDateString() : 'N/A'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-white cursor-pointer hover:text-blue-300"
                        onClick={() => handleStoreClick(submission.storeName || '')}
                      >
                        {submission.storeName || 'N/A'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-white cursor-pointer hover:text-blue-300"
                        onClick={() => handleRegionClick(submission.region || '')}
                      >
                        {submission.region || 'N/A'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-white cursor-pointer hover:text-blue-300"
                        onClick={() => handleTrainerClick(submission.trainerName || '')}
                      >
                        {submission.trainerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          parseFloat(submission.percentageScore || '0') >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          parseFloat(submission.percentageScore || '0') >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {parseFloat(submission.percentageScore || '0')}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetailModal;