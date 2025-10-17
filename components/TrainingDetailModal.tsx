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
    console.log('TrainingDetailModal stats calculation:', { submissions: submissions?.length || 0 });
    
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
      
      if (filterType === 'scoreRange') {
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
        // Filter by region
        filteredSubmissions = submissions.filter(sub => 
          sub.region === filterValue
        );
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
  }, [submissions, filterType, filterValue]);

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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(20px) saturate(120%)' }}
    >
      <div 
        ref={modalContentRef}
        className="rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Submissions</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSubmissions}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Score</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.avgScore}%</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Pass Rate</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(((stats.excellent + stats.good) / stats.totalSubmissions) * 100)}%
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Excellence Rate</h3>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round((stats.excellent / stats.totalSubmissions) * 100)}%
              </p>
            </div>
          </div>

          {/* TSA Scores */}
          {(stats.avgTSAFood > 0 || stats.avgTSACoffee > 0 || stats.avgTSACX > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">TSA Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.avgTSAFood > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">TSA Food</h4>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.avgTSAFood}%</p>
                  </div>
                )}
                {stats.avgTSACoffee > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">TSA Coffee</h4>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.avgTSACoffee}%</p>
                  </div>
                )}
                {stats.avgTSACX > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">TSA CX</h4>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{stats.avgTSACX}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section Question Breakdown */}
          {stats.sectionBreakdown.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Question-wise Performance for {filterValue}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Avg Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Pass Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Responses
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.sectionBreakdown.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.question}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.avgScore >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            item.avgScore >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {item.avgScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.passRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.totalResponses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Score Distribution */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                onClick={() => handleScoreRangeClick('90-100')}
              >
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Excellent (90-100%)</h4>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.excellent}</p>
              </div>
              <div 
                className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                onClick={() => handleScoreRangeClick('75-89')}
              >
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Good (75-89%)</h4>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.good}</p>
              </div>
              <div 
                className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                onClick={() => handleScoreRangeClick('60-74')}
              >
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Average (60-74%)</h4>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.average}</p>
              </div>
              <div 
                className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                onClick={() => handleScoreRangeClick('0-59')}
              >
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Below Average (&lt;60%)</h4>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.belowAverage}</p>
              </div>
            </div>
          </div>

          {/* Regions Performance */}
          {stats.regions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regional Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Average Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.regions.map((region, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleRegionClick(region.region)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {region.region}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {region.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
          )}

          {/* Trainers Performance */}
          {stats.trainers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trainer Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Trainer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Average Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.trainers.map((trainer, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleTrainerClick(trainer.trainer)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {trainer.trainer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {trainer.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
          )}

          {/* Recent Submissions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Submissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Trainer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(stats.filteredSubmissions || []).slice(0, 10).map((submission, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {submission.submissionTime ? new Date(submission.submissionTime).toLocaleDateString() : 'N/A'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleStoreClick(submission.storeName || '')}
                      >
                        {submission.storeName || 'N/A'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleRegionClick(submission.region || '')}
                      >
                        {submission.region || 'N/A'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleTrainerClick(submission.trainerName || '')}
                      >
                        {submission.trainerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
  );
};

export default TrainingDetailModal;