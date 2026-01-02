import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../../roleMapping';
import { CheckCircle } from 'lucide-react';
import LoadingOverlay from '../LoadingOverlay';
import { useComprehensiveMapping } from '../../hooks/useComprehensiveMapping';
import { AREA_MANAGERS as DEFAULT_AREA_MANAGERS } from '../../constants';
import { useConfig } from '../../contexts/ConfigContext';
import { getTrainerName } from '../../utils/trainerMapping';
import { useEmployeeDirectory } from '../../hooks/useEmployeeDirectory';

// Google Sheets endpoint for SHLP data logging (updated with AM Name and Trainer Names columns)
const SHLP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzmfn6LXRXqidjqYdUjYHIkDOzXf2pJ9N-Pm1lGJqn1bddyob_wLKjdncuWjnKZKtuanA/exec';

interface SHLPChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

const SHLPChecklist: React.FC<SHLPChecklistProps> = ({ userRole, onStatsUpdate, onBackToChecklists }) => {
  const { mapping: comprehensiveMapping, loading: mappingLoading } = useComprehensiveMapping();
  const { config } = useConfig();
  const AREA_MANAGERS = config?.AREA_MANAGERS || DEFAULT_AREA_MANAGERS;
  const { directory: employeeDirectory, loading: employeeLoading, getName: getEmployeeName } = useEmployeeDirectory();
  
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [questionRemarks, setQuestionRemarks] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState({
    empName: '',
    empId: '',
    store: '',
    auditorName: '',
    // Keep IDs for submission/dashboard joins
    amId: '',
    trainerIds: '',
    // Human-friendly display values
    amName: '',
    trainerNames: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Employee search state
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  type SectionScores = {
    Store_Readiness: number;
    Product_Quality: number;
    Cash_Admin: number;
    Team_Management: number;
    Operations: number;
    Safety: number;
    Shift_Closing: number;
    Business: number;
    totalScore: number;
    overallPercentage: number;
  };

  // Get available stores, AMs, and trainers from comprehensive mapping
  const availableStores = comprehensiveMapping || [];
  const availableAMs = [...new Set(availableStores.map(s => s['AM']).filter(Boolean))];
  const availableTrainers = [...new Set(availableStores
    .map(s => s['Trainer'])
    .filter(Boolean)
    .flatMap((trainer: string) => trainer.split(',').map(id => id.trim())))]; // Handle comma-separated trainer IDs

  // Auto-fill AM and Trainer when store is selected
  const handleStoreChange = (storeId: string) => {
    const normalize = (v: any) => (v ?? '').toString().trim();
    const selectedStore = availableStores.find(s => normalize(s['Store ID']) === normalize(storeId));
    if (selectedStore) {
      // Get AM Name directly from store mapping (column 3 - AM Name)
      const amId = (selectedStore['AM'] || '').toString().trim();
      const amName = (selectedStore['AM Name'] || '').toString().trim() || 
                     (AREA_MANAGERS.find(am => am.id === amId)?.name) || 
                     getEmployeeName(amId) || 
                     amId; // Fallback to ID only if name absolutely not found

      // Get Trainer 1 ID and Name directly from store mapping (new 23-column structure)
      const trainer1Id = (selectedStore['Trainer 1'] || '').toString().trim();
      const trainer1Name = (selectedStore['Trainer 1 Name'] || '').toString().trim() || 
                          getEmployeeName(trainer1Id) || 
                          getTrainerName(trainer1Id) || 
                          trainer1Id; // Fallback to ID if name not found

      setMetadata(prev => ({
        ...prev,
        store: storeId,
        amId,
        amName,
        trainerIds: trainer1Id, // Use Trainer 1
        trainerNames: trainer1Name // Display Trainer 1 name
      }));
    } else {
      setMetadata(prev => ({
        ...prev,
        store: storeId,
        amId: '',
        amName: '',
        trainerIds: '',
        trainerNames: ''
      }));
    }
  };

  // Auto-fill Store, AM, and Trainer when employee is selected
  const handleEmployeeSelect = (emp: any) => {
    setMetadata(prev => ({
      ...prev,
      empId: emp.employee_code,
      empName: emp.empname
    }));
    setEmployeeSearchTerm('');
    setEmployeeSearchOpen(false);

    // If employee has store_code, auto-fill store and related fields
    if (emp.store_code) {
      const storeId = emp.store_code.toString().trim();
      handleStoreChange(storeId);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setEmployeeSearchOpen(false);
      }
    };

    if (employeeSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [employeeSearchOpen]);

  // SHLP sections and questions
  const sections = [
    {
      id: 'SHLP_STORE_READINESS',
      title: 'Store Readiness',
      items: [
        { id: '1', q: 'Complete Opening, Mid, and Closing checklists' },
        { id: '2', q: 'Ensure store readiness before opening' },
        { id: '3', q: 'Check VM of food case & merchandise wall (stocked and fixed)' },
        { id: '4', q: 'Ensure marketing & promotional collaterals are correctly displayed' }
      ]
    },
    {
      id: 'SHLP_PRODUCT_QUALITY',
      title: 'Product Quality & Standards',
      items: [
        { id: '5', q: 'Conduct dial-in checks for coffee & food' },
        { id: '6', q: 'Do not allow sub-standard products to be served' },
        { id: '7', q: 'Ensure recipes, SOPs, and standards are followed' },
        { id: '8', q: 'Understand impact on COGS, wastage & variances' },
        { id: '9', q: 'Ensure sampling activation & coffee tasting' }
      ]
    },
    {
      id: 'SHLP_CASH_ADMIN',
      title: 'Cash & Administration',
      items: [
        { id: '10', q: 'Check petty cash, float & safe amount' },
        { id: '11', q: 'Fill cash log book for handover' },
        { id: '12', q: 'Arrange float/change for POS' },
        { id: '13', q: 'Complete GRN & petty cash entries' },
        { id: '14', q: 'Follow ordering flow/schedule' }
      ]
    },
    {
      id: 'SHLP_TEAM_MGMT',
      title: 'Team Management',
      items: [
        { id: '15', q: 'Conduct team briefing (updates, promotions, grooming)' },
        { id: '16', q: 'Communicate shift goals & targets' },
        { id: '17', q: 'Motivate team to follow TWC standards' },
        { id: '18', q: 'Plan team breaks effectively' },
        { id: '19', q: 'Identify bottlenecks & support team- (C.O.F.F.E.E, LEAST, R.O.A.S.T and clearing station blockages or hurdles)' },
        { id: '20', q: 'Recognize top performers' },
        { id: '21', q: 'Provide task-specific feedback to partners' },
        { id: '22', q: 'Share performance inputs with Store Manager' }
      ]
    },
    {
      id: 'SHLP_OPERATIONS',
      title: 'Operations & Availability',
      items: [
        { id: '23', q: 'Monitor product availability & update team' },
        { id: '24', q: 'Utilize lean periods for training & coaching' },
        { id: '25', q: 'Utilize peak periods for customer experience & business' },
        { id: '26', q: 'Adjust deployment based on shift need' },
        { id: '27', q: 'Adjust shift priorities as required' },
        { id: '28', q: 'Follow receiving, storing & thawing guidelines' },
        { id: '29', q: 'Remove thawing products as per schedule' }
      ]
    },
    {
      id: 'SHLP_SAFETY',
      title: 'Safety & Compliance',
      items: [
        { id: '30', q: 'Follow key handling process and proactively hands over in case going on leave or weekly off' },
        { id: '31', q: 'Follow Lost & Found SOP' },
        { id: '32', q: 'Log maintenance issues' }
      ]
    },
    {
      id: 'SHLP_SHIFT_CLOSING',
      title: 'Shift Closing',
      items: [
        { id: '33', q: 'Complete all closing tasks thoroughly' }
      ]
    },
    {
      id: 'SHLP_BUSINESS',
      title: 'Business Acumen',
      items: [
        { id: '34', q: 'is able to do Shift Performance analysis (PSA) like LTO,LA, IPS, ADS, AOV drivers, CPI, MA,QA Etc. Has BSC understanding' },
        { id: '35', q: 'check and keep the record of EB Units as per their shift' }
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

  const handleRemark = (questionKey: string, value: string) => {
    setQuestionRemarks(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const handleSubmit = async () => {
    if (!metadata.empName || !metadata.empId || !metadata.store || !metadata.amId || !metadata.trainerIds || !metadata.auditorName) {
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
        auditorName: metadata.auditorName,
        // Keep existing keys as IDs (dashboards/mapping)
        am: metadata.amId,
        trainer: metadata.trainerIds,
        // Add human-friendly columns (safe additive)
        amName: metadata.amName,
        trainerNames: metadata.trainerNames,
        submissionTime: new Date().toISOString(),
        
        // Individual question responses
        ...responses,

        // Per-question remarks (safe additive fields)
        ...Object.fromEntries(
          Object.entries(questionRemarks).map(([k, v]) => [`${k}_remarks`, v || ''])
        ),
        
        // Section scores
        Store_Readiness_Score: sectionScores.Store_Readiness.toString(),
        Product_Quality_Score: sectionScores.Product_Quality.toString(),
        Cash_Admin_Score: sectionScores.Cash_Admin.toString(),
        Team_Management_Score: sectionScores.Team_Management.toString(),
        Operations_Score: sectionScores.Operations.toString(),
        Safety_Score: sectionScores.Safety.toString(),
        Shift_Closing_Score: sectionScores.Shift_Closing.toString(),
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
        setQuestionRemarks({});
        setMetadata({ empName: '', empId: '', store: '', amId: '', trainerIds: '', amName: '', trainerNames: '' });
        
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

  const calculateSectionScores = (): SectionScores => {
    const sectionDefinitions = {
      'Store_Readiness': ['SHLP_1', 'SHLP_2', 'SHLP_3', 'SHLP_4'],
      'Product_Quality': ['SHLP_5', 'SHLP_6', 'SHLP_7', 'SHLP_8', 'SHLP_9'],
      'Cash_Admin': ['SHLP_10', 'SHLP_11', 'SHLP_12', 'SHLP_13', 'SHLP_14'],
      'Team_Management': ['SHLP_15', 'SHLP_16', 'SHLP_17', 'SHLP_18', 'SHLP_19', 'SHLP_20', 'SHLP_21', 'SHLP_22'],
      'Operations': ['SHLP_23', 'SHLP_24', 'SHLP_25', 'SHLP_26', 'SHLP_27', 'SHLP_28', 'SHLP_29'],
      'Safety': ['SHLP_30', 'SHLP_31', 'SHLP_32'],
      'Shift_Closing': ['SHLP_33'],
      'Business': ['SHLP_34', 'SHLP_35']
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
      ...(sectionScores as any),
      totalScore,
      overallPercentage
    } as SectionScores;
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
          <div className="space-y-2 relative" ref={employeeDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Employee (Search by Name or ID) *
            </label>
            <input
              type="text"
              value={employeeSearchTerm || (metadata.empId ? `${metadata.empId} - ${metadata.empName}` : '')}
              onChange={(e) => {
                setEmployeeSearchTerm(e.target.value);
                setEmployeeSearchOpen(true);
              }}
              onFocus={() => setEmployeeSearchOpen(true)}
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Search employee..."
              required
            />
            
            {/* Employee Dropdown */}
            {employeeSearchOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {employeeLoading ? (
                  <div className="p-4 text-sm text-gray-500">Loading employees...</div>
                ) : Object.keys(employeeDirectory.byId).length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No employees found</div>
                ) : (
                  Object.values(employeeDirectory.byId)
                    .filter(emp => {
                      const searchLower = employeeSearchTerm.toLowerCase();
                      return (
                        emp.empname.toLowerCase().includes(searchLower) ||
                        emp.employee_code.toLowerCase().includes(searchLower) ||
                        (emp.designation && emp.designation.toLowerCase().includes(searchLower)) ||
                        (emp.store_code && emp.store_code.toLowerCase().includes(searchLower))
                      );
                    })
                    .slice(0, 50)
                    .map(emp => (
                      <button
                        key={emp.employee_code}
                        type="button"
                        className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700 last:border-0"
                        onClick={() => handleEmployeeSelect(emp)}
                      >
                        <div className="font-medium text-gray-900 dark:text-slate-100">
                          {emp.empname}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">
                          ID: {emp.employee_code}
                          {emp.designation && ` • ${emp.designation}`}
                          {emp.store_code && ` • Store: ${emp.store_code}`}
                        </div>
                      </button>
                    ))
                )}
                <button
                  type="button"
                  className="w-full p-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 border-t"
                  onClick={() => setEmployeeSearchOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
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
              value={metadata.amName || ''}
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
              value={metadata.trainerNames || ''}
              readOnly
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 dark:text-slate-100 cursor-not-allowed"
              placeholder="Select store first"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Auditor Name *
            </label>
            <input
              type="text"
              value={metadata.auditorName}
              onChange={(e) => setMetadata(prev => ({ ...prev, auditorName: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Enter auditor name"
              required
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

                    <div className="ml-11 space-y-3">
                      <div className="flex flex-row flex-wrap gap-3">
                        {[
                          { value: '0', label: '0', color: 'text-red-600 dark:text-red-400' },
                          { value: '1', label: '1', color: 'text-yellow-600 dark:text-yellow-400' },
                          { value: '2', label: '2', color: 'text-green-600 dark:text-green-400' }
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

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                          Remarks (optional)
                        </label>
                        <textarea
                          value={questionRemarks[questionKey] || ''}
                          onChange={(e) => handleRemark(questionKey, e.target.value)}
                          rows={2}
                          className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-slate-100"
                          placeholder="Add remarks for this question..."
                        />
                      </div>
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
            onClick={() => {
              setResponses({});
              setQuestionRemarks({});
            }}
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