import React, { useState, useEffect } from 'react';
import { UserRole } from '../../roleMapping';
import { CheckCircle } from 'lucide-react';
import LoadingOverlay from '../LoadingOverlay';
import { useComprehensiveMapping } from '../../hooks/useComprehensiveMapping';

// Google Sheets endpoint for SHLP data logging
const SHLP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw0ndZitHKmrI3z3MFzCfFn90sl1ljDkBVZjdM6NjCDN1mteJM-r7uDy_U5EBKy_AMwPQ/exec';

interface SHLPChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

const SHLPChecklist: React.FC<SHLPChecklistProps> = ({ userRole, onStatsUpdate, onBackToChecklists }) => {
  const { mapping: comprehensiveMapping, loading: mappingLoading } = useComprehensiveMapping();
  
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState({
    empName: '',
    empId: '',
    store: '',
    am: '',
    trainer: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get available stores, AMs, and trainers from comprehensive mapping
  const availableStores = comprehensiveMapping || [];
  const availableAMs = [...new Set(availableStores.map(s => s['AM']).filter(Boolean))];
  const availableTrainers = [...new Set(availableStores.map(s => s['Trainer']).filter(Boolean))];

  // Auto-fill AM and Trainer when store is selected
  const handleStoreChange = (storeId: string) => {
    const selectedStore = availableStores.find(s => s['Store ID'] === storeId);
    if (selectedStore) {
      setMetadata(prev => ({
        ...prev,
        store: storeId,
        am: selectedStore['AM'] || '',
        trainer: selectedStore['Trainer'] || ''
      }));
    } else {
      setMetadata(prev => ({
        ...prev,
        store: storeId,
        am: '',
        trainer: ''
      }));
    }
  };

  // SHLP sections and questions (same as in OperationsChecklist constants.ts)
  const sections = [
    {
      id: 'SHLP_STORE_READINESS',
      title: 'Store Readiness',
      items: [
        { id: '1', q: 'Store opening checklist completion' },
        { id: '2', q: 'Equipment functionality verification' },
        { id: '3', q: 'Inventory stock levels adequacy' },
        { id: '4', q: 'Store cleanliness and presentation' },
        { id: '5', q: 'Safety protocols implementation' }
      ]
    },
    {
      id: 'SHLP_PRODUCT_QUALITY',
      title: 'Product Quality & Standards',
      items: [
        { id: '6', q: 'Product quality consistency' },
        { id: '7', q: 'Recipe adherence and standardization' },
        { id: '8', q: 'Temperature control maintenance' },
        { id: '9', q: 'Expiry date monitoring' },
        { id: '10', q: 'Presentation standards compliance' }
      ]
    },
    {
      id: 'SHLP_CASH_ADMIN',
      title: 'Cash & Administration',
      items: [
        { id: '11', q: 'Cash handling procedures' },
        { id: '12', q: 'Transaction accuracy' },
        { id: '13', q: 'Administrative documentation' },
        { id: '14', q: 'Reporting timeliness' },
        { id: '15', q: 'Compliance with financial protocols' }
      ]
    },
    {
      id: 'SHLP_TEAM_MGMT',
      title: 'Team Management',
      items: [
        { id: '16', q: 'Staff scheduling effectiveness' },
        { id: '17', q: 'Team communication quality' },
        { id: '18', q: 'Performance management' },
        { id: '19', q: 'Training and development' },
        { id: '20', q: 'Conflict resolution' },
        { id: '21', q: 'Leadership demonstration' },
        { id: '22', q: 'Motivation and engagement' },
        { id: '23', q: 'Delegation and supervision' }
      ]
    },
    {
      id: 'SHLP_OPERATIONS',
      title: 'Operations & Availability',
      items: [
        { id: '24', q: 'Operational efficiency' },
        { id: '25', q: 'Service speed and quality' },
        { id: '26', q: 'Customer satisfaction' },
        { id: '27', q: 'Resource utilization' },
        { id: '28', q: 'Process optimization' },
        { id: '29', q: 'Availability and accessibility' },
        { id: '30', q: 'System reliability' }
      ]
    },
    {
      id: 'SHLP_SAFETY',
      title: 'Safety & Compliance',
      items: [
        { id: '31', q: 'Safety protocol adherence' },
        { id: '32', q: 'Regulatory compliance' },
        { id: '33', q: 'Maintenance logging' }
      ]
    },
    {
      id: 'SHLP_BUSINESS',
      title: 'Business Acumen',
      items: [
        { id: '34', q: 'Sales analysis (WoW, MoM – ADS, ADT, FIPT, LTO)' },
        { id: '35', q: 'BSC understanding' },
        { id: '36', q: 'Controllables (EB units, COGS)' }
      ]
    }
  ];

  // Calculate stats
  useEffect(() => {
    let completed = 0;
    let total = 0;
    let score = 0;
    let maxScore = 0;

    sections.forEach(section => {
      section.items.forEach(item => {
        const questionKey = `SHLP_${item.id}`;
        const response = responses[questionKey];
        total++;
        
        if (response) {
          completed++;
          const points = parseInt(response);
          if (!isNaN(points)) {
            score += points;
            maxScore += 2; // Max 2 points per SHLP question
          }
        }
      });
    });

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    onStatsUpdate({ completed, total, score: percentage });
  }, [responses, onStatsUpdate]);

  const handleResponse = (questionKey: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const handleSubmit = async () => {
    if (!metadata.empName || !metadata.empId || !metadata.store || !metadata.am || !metadata.trainer) {
      alert('Please fill in all employee information fields before submitting.');
      return;
    }

    // Check if all questions are answered
    const totalQuestions = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).length;
    
    if (answeredQuestions < totalQuestions) {
      const unanswered = totalQuestions - answeredQuestions;
      if (!confirm(`You have ${unanswered} unanswered questions. Do you want to submit anyway?`)) {
        return;
      }
    }

    setIsLoading(true);

    try {
      // Calculate section scores
      const sectionScores = calculateSectionScores();
      
      // Prepare form data
      const params: Record<string, string> = {
        // Employee information
        empName: metadata.empName,
        empId: metadata.empId,
        store: metadata.store,
        am: metadata.am,
        trainer: metadata.trainer,
        submissionTime: new Date().toISOString(),
        
        // Individual question responses
        ...responses,
        
        // Section scores
        Store_Readiness_Score: sectionScores.Store_Readiness.toString(),
        Product_Quality_Score: sectionScores.Product_Quality.toString(),
        Cash_Admin_Score: sectionScores.Cash_Admin.toString(),
        Team_Management_Score: sectionScores.Team_Management.toString(),
        Operations_Score: sectionScores.Operations.toString(),
        Safety_Score: sectionScores.Safety.toString(),
        Business_Score: sectionScores.Business.toString(),
        Overall_Score: sectionScores.totalScore.toString(),
        Overall_Percentage: sectionScores.overallPercentage.toString()
      };

      // Convert to URL-encoded format
      const body = Object.keys(params).map(k => 
        encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
      ).join('&');

      const response = await fetch(SHLP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      });

      if (response.ok) {
        setShowSuccess(true);
        // Clear form after successful submission
        setResponses({});
        setMetadata({ empName: '', empId: '', store: '', am: '', trainer: '' });
        
        setTimeout(() => {
          setShowSuccess(false);
          if (onBackToChecklists) {
            onBackToChecklists();
          }
        }, 3000);
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit SHLP assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSectionScores = () => {
    const sectionDefinitions = {
      'Store_Readiness': ['SHLP_1', 'SHLP_2', 'SHLP_3', 'SHLP_4', 'SHLP_5'],
      'Product_Quality': ['SHLP_6', 'SHLP_7', 'SHLP_8', 'SHLP_9', 'SHLP_10'],
      'Cash_Admin': ['SHLP_11', 'SHLP_12', 'SHLP_13', 'SHLP_14', 'SHLP_15'],
      'Team_Management': ['SHLP_16', 'SHLP_17', 'SHLP_18', 'SHLP_19', 'SHLP_20', 'SHLP_21', 'SHLP_22', 'SHLP_23'],
      'Operations': ['SHLP_24', 'SHLP_25', 'SHLP_26', 'SHLP_27', 'SHLP_28', 'SHLP_29', 'SHLP_30'],
      'Safety': ['SHLP_31', 'SHLP_32', 'SHLP_33'],
      'Business': ['SHLP_34', 'SHLP_35', 'SHLP_36']
    };

    const sectionScores: Record<string, number> = {};
    let totalScore = 0;
    let totalMaxScore = 0;

    for (const [sectionName, questionIds] of Object.entries(sectionDefinitions)) {
      let sectionScore = 0;
      const sectionMaxScore = questionIds.length * 2; // Each question max 2 points

      for (const questionId of questionIds) {
        const response = responses[questionId];
        if (response && !isNaN(parseInt(response))) {
          sectionScore += parseInt(response);
        }
      }

      const sectionPercentage = sectionMaxScore > 0 ? Math.round((sectionScore / sectionMaxScore) * 100) : 0;
      sectionScores[sectionName] = sectionPercentage;

      totalScore += sectionScore;
      totalMaxScore += sectionMaxScore;
    }

    const overallPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

    return {
      ...sectionScores,
      totalScore,
      overallPercentage
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {isLoading && <LoadingOverlay />}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          <CheckCircle className="inline-block w-8 h-8 mr-2 text-emerald-600" />
          SHLP Certification Tool
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Comprehensive assessment tool for operational excellence certification using 0-2 scoring scale.
        </p>
      </div>

      {/* Employee Information Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Employee Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Employee Name *
            </label>
            <input
              type="text"
              value={metadata.empName}
              onChange={(e) => setMetadata(prev => ({ ...prev, empName: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Enter employee name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Employee ID *
            </label>
            <input
              type="text"
              value={metadata.empId}
              onChange={(e) => setMetadata(prev => ({ ...prev, empId: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Enter employee ID"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Store *
            </label>
            {mappingLoading ? (
              <div className="w-full p-3 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse">
                Loading stores...
              </div>
            ) : (
              <select
                value={metadata.store}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-slate-100"
                required
              >
                <option value="">Select Store</option>
                {availableStores.map((store) => (
                  <option key={store['Store ID']} value={store['Store ID']}>
                    {store['Store ID']} - {store['Store Name']}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Area Manager *
            </label>
            <input
              type="text"
              value={metadata.am}
              readOnly
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 dark:text-slate-100 cursor-not-allowed"
              placeholder="Select store first"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Trainer *
            </label>
            <input
              type="text"
              value={metadata.trainer}
              readOnly
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 dark:text-slate-100 cursor-not-allowed"
              placeholder="Select store first"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                {sectionIndex + 1}. {section.title}
              </h2>
              <div className="h-1 bg-emerald-200 dark:bg-emerald-800 rounded">
                <div 
                  className="h-1 bg-emerald-500 rounded transition-all duration-300"
                  style={{
                    width: `${(section.items.filter(item => responses[`SHLP_${item.id}`]).length / section.items.length) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="space-y-6">
              {section.items.map((item, itemIndex) => {
                const questionKey = `SHLP_${item.id}`;
                const questionNumber = sectionIndex === 0 ? itemIndex + 1 : 
                  sections.slice(0, sectionIndex).reduce((sum, s) => sum + s.items.length, 0) + itemIndex + 1;
                
                return (
                  <div key={item.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                    <div className="mb-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-medium mr-3">
                        {questionNumber}
                      </span>
                      <span className="text-lg font-medium text-gray-900 dark:text-slate-100">
                        {item.q}
                      </span>
                    </div>

                    <div className="ml-11 space-y-2">
                      {[
                        { value: '0', label: '0 - Not Done / Incorrect', color: 'text-red-600 dark:text-red-400' },
                        { value: '1', label: '1 - Partially Done / Needs Support', color: 'text-yellow-600 dark:text-yellow-400' },
                        { value: '2', label: '2 - Done Right / On Time / As Per SOP', color: 'text-green-600 dark:text-green-400' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={questionKey}
                            value={option.value}
                            checked={responses[questionKey] === option.value}
                            onChange={(e) => handleResponse(questionKey, e.target.value)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-slate-600 focus:ring-emerald-500"
                          />
                          <span className={`text-sm font-medium ${option.color}`}>
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setResponses({})}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Reset Assessment
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit SHLP Assessment'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                Assessment Submitted Successfully!
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Your SHLP certification assessment has been recorded.
              </p>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                Redirecting to checklists...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SHLPChecklist;