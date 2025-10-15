import React, { useState } from 'react';

interface RCACapaAnalysisProps {
  submissions: any[];
  questions: any[];
}

interface AnalysisResult {
  problems: string[];
  rootCauseAnalysis: {
    problem: string;
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    why5: string;
    rootCause: string;
  }[];
  correctiveActions: string[];
  preventiveActions: string[];
}

// Simple SVG icons
const ChevronDownIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClipboardDocumentListIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const RCACapaAnalysis: React.FC<RCACapaAnalysisProps> = ({ submissions, questions }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // AI-style analysis functions (similar to AIInsights.tsx approach)
  const performOperationalAnalysis = (data: any[], questions: any[]) => {
    console.log('RCA AI: Performing operational analysis on', data.length, 'submissions');
    console.log('RCA AI: Sample submission data:', data[0]); // Log first submission to see data structure
    console.log('RCA AI: Questions count:', questions.length);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('RCA AI: No data for analysis, returning empty results');
      return { problems: [], rootCauseAnalysis: [], correctiveActions: [], preventiveActions: [] };
    }

    try {
      // Problem Detection with AI-style categorization
      const problemAreas = detectOperationalProblems(data, questions);
      console.log('RCA AI: Detected problem areas:', problemAreas);
      
      const criticalProblems = problemAreas.slice(0, 3); // Top 3 critical issues

      return {
        problems: problemAreas,
        rootCauseAnalysis: criticalProblems.map(problem => performRootCauseAnalysis(problem)),
        correctiveActions: generateCorrectiveActions(problemAreas),
        preventiveActions: generatePreventiveActions(problemAreas)
      };
    } catch (error) {
      console.error('RCA AI Analysis Error:', error);
      return { problems: [], rootCauseAnalysis: [], correctiveActions: [], preventiveActions: [] };
    }
  };

  const detectOperationalProblems = (data: any[], questions: any[]) => {
    console.log('RCA AI: Detecting problems from', data.length, 'submissions and', questions.length, 'questions');
    console.log('RCA AI: Sample submission keys:', data[0] ? Object.keys(data[0]) : 'No data');
    console.log('RCA AI: Sample question IDs:', questions.slice(0, 5).map(q => q.id));
    
    const problems: any[] = [];
    
    // Look for "No" responses in each submission
    questions.forEach((question, questionIndex) => {
      const questionId = question.id; // e.g., 'CG_1', 'OTA_1', etc.
      const questionTitle = question.title;
      
      // Get all responses for this question across all submissions
      const allResponses = data.filter(submission => {
        const response = submission[questionId];
        return response && response !== '' && response !== 'N/A';
      });
      
      // Get specifically "No" responses (case insensitive)
      const noResponses = data.filter(submission => {
        const response = submission[questionId];
        return response && typeof response === 'string' && response.toLowerCase().trim() === 'no';
      });
      
      console.log(`RCA AI: Question ${questionId} ("${questionTitle}"): ${allResponses.length} total responses, ${noResponses.length} "No" responses`);
      
      // If there are any "No" responses, it's a compliance issue
      if (noResponses.length > 0) {
        const storesWithIssues = noResponses.map(submission => 
          submission.storeId || submission.store_id || submission.storeName || submission.store || 'Unknown Store'
        ).filter((store, index, arr) => arr.indexOf(store) === index); // Remove duplicates
        
        const nonComplianceRate = allResponses.length > 0 ? (noResponses.length / allResponses.length) * 100 : 0;
        
        console.log(`RCA AI: Adding problem for "${questionTitle}": ${nonComplianceRate.toFixed(1)}% non-compliance, ${storesWithIssues.length} stores affected`);
        
        problems.push({
          area: questionTitle,
          description: `Non-compliance detected: ${questionTitle} - ${noResponses.length} "No" response(s)`,
          severity: noResponses.length > 1 ? 'High' : 'Medium',
          stores: storesWithIssues,
          question: question,
          questionId: questionId,
          category: question.category || 'Operational',
          impact: `${noResponses.length} store(s) reported "No" for: ${questionTitle}`,
          frequency: noResponses.length,
          nonComplianceRate: Math.round(nonComplianceRate),
          totalResponses: allResponses.length
        });
      }
    });

    console.log('RCA AI: Total problems detected before sorting:', problems.length);
    
    // Sort by frequency (highest first) and then by non-compliance rate
    const sortedProblems = problems
      .sort((a, b) => {
        if (b.frequency !== a.frequency) {
          return b.frequency - a.frequency;
        }
        return b.nonComplianceRate - a.nonComplianceRate;
      })
      .slice(0, 10); // Show up to 10 issues

    console.log('RCA AI: Final sorted problems:', sortedProblems.length);
    console.log('RCA AI: Problem details:', sortedProblems.map(p => `${p.area}: ${p.frequency} issues`));
    
    return sortedProblems;
  };

  const performRootCauseAnalysis = (problem: any) => {
    const problemArea = problem.area || problem;
    return {
      problem: typeof problem === 'string' ? problem : problem.description,
      why1: generateContextualWhy(problemArea, 1),
      why2: generateContextualWhy(problemArea, 2),
      why3: generateContextualWhy(problemArea, 3),
      why4: generateContextualWhy(problemArea, 4),
      why5: generateContextualWhy(problemArea, 5),
      rootCause: generateContextualRootCause(problemArea)
    };
  };

  const generateContextualWhy = (problem: string, level: number) => {
    const category = categorizeQuestion(problem);
    
    const whyResponses: { [key: string]: { [key: number]: string } } = {
      'cleanliness': {
        1: 'Daily cleaning checklists are not being completed or verified by shift supervisors',
        2: 'Partners are unclear about specific cleaning standards for washrooms, counters, and equipment',
        3: 'Store managers are not conducting hourly cleaning spot-checks during peak hours',
        4: 'Cleaning supplies may be inadequate or partners are skipping steps to save time during rushes',
        5: 'Store leadership has not made cleanliness a non-negotiable priority with clear consequences for non-compliance'
      },
      'staff-standards': {
        1: 'Partners are not following TWC grooming guidelines for uniforms, hair, and jewelry',
        2: 'New partners may not have received proper orientation on appearance standards during onboarding',
        3: 'Shift supervisors are not providing immediate feedback when standards are not met',
        4: 'There may be no clear accountability system for maintaining professional appearance throughout shifts',
        5: 'Store culture has not established peer accountability where partners remind each other about standards'
      },
      'visual-standards': {
        1: 'Daily visual merchandising checks are not being performed or tent cards/signage are outdated',
        2: 'Partners responsible for visual setup lack training on current promotional materials and planograms',
        3: 'Store managers are not reviewing promotional displays and menu boards during daily walk-throughs',
        4: 'Communication about new promotions or visual changes is not reaching store level effectively',
        5: 'Visual standards are not treated as equally important as operational tasks in daily priorities'
      },
      'temperature-equipment': {
        1: 'Temperature checks with Therma Pen are not being done hourly or logs are not properly maintained',
        2: 'Partners need refresher training on proper temperature monitoring procedures and equipment usage',
        3: 'Shift supervisors are not verifying that temperature logs are accurate and up-to-date',
        4: 'Equipment may need calibration or partners are rushing through temperature checks during busy periods',
        5: 'Food safety culture has not been established as the highest priority in daily operations'
      },
      'financial-operations': {
        1: 'POS procedures, cash handling, or banking processes are not being followed consistently',
        2: 'Partners need additional training on cash management, audit procedures, or POS operations',
        3: 'Store managers are not conducting daily cash audits or verifying banking reconciliation',
        4: 'Partners may be taking shortcuts during busy periods affecting financial accuracy',
        5: 'Financial accountability and accuracy has not been established as a core operational standard'
      },
      'training-development': {
        1: 'Training schedules, coaching sessions, or development activities are not happening as planned',
        2: 'Partners responsible for training others need additional coaching skills or resources',
        3: 'Store managers are not monitoring training progress or providing ongoing development support',
        4: 'Training time is being sacrificed for operational tasks during busy periods',
        5: 'Continuous learning and development culture has not been prioritized in daily operations'
      },
      'operational': {
        1: 'Standard operating procedures for the specific task are not being followed during busy periods',
        2: 'Partners need refresher training on this specific operational requirement',
        3: 'Shift supervisors are not monitoring and coaching this particular standard consistently',
        4: 'The importance of this operational standard has not been clearly communicated to the team',
        5: 'Store leadership has not established this as a fundamental non-negotiable operational requirement'
      }
    };
    
    return whyResponses[category]?.[level] || whyResponses['operational'][level];
  };

  const categorizeQuestion = (problem: string) => {
    const lowerProblem = problem.toLowerCase();
    if (lowerProblem.includes('clean') || lowerProblem.includes('washroom') || lowerProblem.includes('washrooms') || lowerProblem.includes('engine area') || lowerProblem.includes('equipment cleaned')) return 'cleanliness';
    if (lowerProblem.includes('staff') || lowerProblem.includes('grooming') || lowerProblem.includes('uniform') || lowerProblem.includes('jewellery') || lowerProblem.includes('hair') || lowerProblem.includes('makeup')) return 'staff-standards';
    if (lowerProblem.includes('signage') || lowerProblem.includes('display') || lowerProblem.includes('tent cards') || lowerProblem.includes('menu boards') || lowerProblem.includes('dmb') || lowerProblem.includes('promotional') || lowerProblem.includes('planogram') || lowerProblem.includes('merch rack') || lowerProblem.includes('fdu counter')) return 'visual-standards';
    if (lowerProblem.includes('temperature') || lowerProblem.includes('equipment') || lowerProblem.includes('therma pen') || lowerProblem.includes('thawing')) return 'temperature-equipment';
    if (lowerProblem.includes('pos') || lowerProblem.includes('cash') || lowerProblem.includes('banking') || lowerProblem.includes('audit')) return 'financial-operations';
    if (lowerProblem.includes('training') || lowerProblem.includes('deployment') || lowerProblem.includes('coaching')) return 'training-development';
    return 'operational';
  };

  const generateContextualRootCause = (problem: string) => {
    const category = categorizeQuestion(problem);
    const rootCauses: { [key: string]: string } = {
      'cleanliness': 'Absence of consistent daily cleaning accountability and verification by store management team',
      'staff-standards': 'Lack of continuous coaching and peer accountability for professional appearance standards',
      'visual-standards': 'Missing daily visual verification routine as part of standard opening/closing procedures',
      'temperature-equipment': 'Insufficient hourly monitoring and logging procedures for food safety equipment standards',
      'financial-operations': 'Lack of daily financial verification and accountability procedures by store management',
      'training-development': 'Missing structured ongoing training and development accountability in daily operations',
      'operational': 'Insufficient daily monitoring and coaching of this specific operational standard by leadership'
    };
    
    return rootCauses[category] || rootCauses['operational'];
  };

  const generateCorrectiveActions = (problems: any[]) => {
    const baseActions = [
      'Area Manager to conduct immediate store visits within 48 hours to verify compliance and provide on-spot coaching',
      'Store Manager to retrain all partners on identified non-compliance areas with demonstration and practice sessions',
      'Implement daily manager checklist verification with photo documentation sent to Area Manager for 2 weeks'
    ];
    
    const specificActions: string[] = [];
    
    // Check problem areas from objects
    const problemAreas = problems.map(p => (typeof p === 'string' ? p : p.area || p.description || '').toLowerCase());
    
    if (problemAreas.some(area => area.includes('clean'))) {
      specificActions.push('Conduct immediate deep clean of all affected areas and reset cleaning supply inventory with proper storage');
    }
    if (problemAreas.some(area => area.includes('staff') || area.includes('grooming'))) {
      specificActions.push('Review grooming standards with each partner individually and provide uniform/grooming supplies if needed');
    }
    if (problemAreas.some(area => area.includes('signage') || area.includes('display') || area.includes('tent'))) {
      specificActions.push('Replace all outdated promotional materials immediately and verify current planogram setup');
    }
    if (problemAreas.some(area => area.includes('temperature') || area.includes('equipment') || area.includes('therma'))) {
      specificActions.push('Check and calibrate equipment immediately, document readings, and establish hourly monitoring routine');
    }
    if (problemAreas.some(area => area.includes('washroom'))) {
      specificActions.push('Increase washroom cleaning frequency to every 2 hours with mandatory checklist completion and verification');
    }
    if (problemAreas.some(area => area.includes('pos') || area.includes('cash') || area.includes('banking'))) {
      specificActions.push('Conduct immediate cash audit, verify banking procedures, and retrain all POS operators');
    }
    if (problemAreas.some(area => area.includes('training') || area.includes('coaching') || area.includes('deployment'))) {
      specificActions.push('Immediately schedule training sessions for identified gaps and document completion with assessments');
    }
    
    return [...baseActions, ...specificActions].slice(0, 4);
  };

  const generatePreventiveActions = (problems: any[]) => {
    const baseActions = [
      'Establish weekly Area Manager store visits with standardized checklist review and partner coaching sessions',
      'Create daily opening/closing verification routine where Store Manager signs off on all compliance items',
      'Implement peer buddy system where experienced partners mentor new team members on standards'
    ];
    
    const specificActions: string[] = [];
    
    // Check problem areas from objects
    const problemAreas = problems.map(p => (typeof p === 'string' ? p : p.area || p.description || '').toLowerCase());
    
    if (problemAreas.some(area => area.includes('clean'))) {
      specificActions.push('Set hourly cleaning reminders and designate a \"Cleanliness Champion\" for each shift to do quick checks');
    }
    if (problemAreas.some(area => area.includes('staff') || area.includes('grooming'))) {
      specificActions.push('Include grooming check as part of shift handover routine and recognize \"Best Groomed Partner\" weekly');
    }
    if (problemAreas.some(area => area.includes('signage') || area.includes('display'))) {
      specificActions.push('Assign one partner per shift to be responsible for promotional display checks and updates');
    }
    if (problemAreas.some(area => area.includes('temperature') || area.includes('equipment') || area.includes('therma'))) {
      specificActions.push('Create hourly equipment check routine with temperature log maintenance by designated partners');
    }
    if (problemAreas.some(area => area.includes('washroom'))) {
      specificActions.push('Rotate washroom cleaning responsibility among all partners with mandatory 2-hour check intervals');
    }
    if (problemAreas.some(area => area.includes('pos') || area.includes('cash') || area.includes('banking'))) {
      specificActions.push('Implement daily cash handling verification with dual sign-off and weekly POS skills assessment');
    }
    if (problemAreas.some(area => area.includes('training') || area.includes('coaching') || area.includes('deployment'))) {
      specificActions.push('Create weekly training calendar with mandatory skills assessments and progress tracking');
    }
    
    return [...baseActions, ...specificActions].slice(0, 4);
  };

  const generateRCAAndCAPA = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI processing time (like in AIInsights.tsx)
      setTimeout(() => {
        const analysisResults = performOperationalAnalysis(submissions, questions);
        
        if (analysisResults.problems.length === 0) {
          setAnalysis({
            problems: [],
            rootCauseAnalysis: [],
            correctiveActions: ['No significant issues identified. Continue monitoring current practices with regular audits.'],
            preventiveActions: ['Maintain regular audit schedules and staff training to prevent future issues.']
          });
        } else {
          setAnalysis(analysisResults);
        }
        
        setIsAnalyzing(false);
      }, 2500); // Realistic AI processing time
    } catch (error) {
      console.error('Error generating analysis:', error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ClipboardDocumentListIcon className="w-6 h-6 text-blue-400" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-slate-100">RCA & CAPA Analysis</h3>
            <p className="text-sm text-slate-400">AI-Powered Root Cause Analysis & Corrective/Preventive Actions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExpanded) setIsExpanded(true);
                generateRCAAndCAPA();
              }}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
            </button>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          {!analysis && !isAnalyzing && (
            <div className="text-center py-8">
              <button
                onClick={generateRCAAndCAPA}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Generate AI Analysis
              </button>
              <p className="text-slate-400 text-sm mt-2">AI will analyze operations data and provide actionable insights</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-300 mt-4 font-medium">AI Analysis in Progress...</p>
              <p className="text-slate-400 text-sm mt-1">Identifying problems, conducting root cause analysis, and generating action plans</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Analysis Summary */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <h4 className="font-semibold text-slate-100 mb-3">AI Analysis Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{analysis.problems.length}</div>
                    <div className="text-xs text-slate-400">Issues Identified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{analysis.rootCauseAnalysis.length}</div>
                    <div className="text-xs text-slate-400">Root Cause Analyses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{analysis.correctiveActions.length}</div>
                    <div className="text-xs text-slate-400">Corrective Actions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{analysis.preventiveActions.length}</div>
                    <div className="text-xs text-slate-400">Preventive Actions</div>
                  </div>
                </div>
              </div>

              {/* Identified Problems */}
              {analysis.problems.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                    <h4 className="font-semibold text-slate-100">Critical Issues Identified</h4>
                  </div>
                  <div className="space-y-3">
                    {analysis.problems.map((problem, index) => (
                      <div key={index} className="bg-slate-800/50 rounded p-3 border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-slate-200">{typeof problem === 'string' ? problem : (problem && (problem as any).area) || String(problem)}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            (problem && (problem as any).severity) === 'High' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {(problem && (problem as any).severity) || 'Medium'}
                          </span>
                        </div>
                        {typeof problem === 'object' && (
                          <>
                            <p className="text-slate-300 text-sm mb-2">{(problem && (problem as any).description) || ''}</p>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                              <span>🔢 {(problem && (problem as any).frequency) || 0} instances</span>
                              <span>📊 {(problem && (problem as any).nonComplianceRate) || 0}% non-compliance</span>
                              <span>🏪 {(problem && (problem as any).stores ? (problem as any).stores.length : 0)} stores affected</span>
                            </div>
                            {problem && (problem as any).stores && (problem as any).stores.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-slate-500">Affected stores: </span>
                                <span className="text-xs text-slate-400">{(problem as any).stores.slice(0, 3).join(', ')}{(problem as any).stores.length > 3 ? ` +${(problem as any).stores.length - 3} more` : ''}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Root Cause Analysis */}
              {analysis.rootCauseAnalysis.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                  <h4 className="font-semibold text-slate-100 mb-3">5 Why Root Cause Analysis</h4>
                  <div className="space-y-4">
                    {analysis.rootCauseAnalysis.map((rca, index) => (
                      <div key={index} className="border-l-2 border-blue-500 pl-4">
                        <h5 className="font-medium text-slate-200 mb-2">{rca.problem}</h5>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300"><span className="font-medium text-slate-200">Why 1:</span> {rca.why1}</p>
                          <p className="text-slate-300"><span className="font-medium text-slate-200">Why 2:</span> {rca.why2}</p>
                          <p className="text-slate-300"><span className="font-medium text-slate-200">Why 3:</span> {rca.why3}</p>
                          <p className="text-slate-300"><span className="font-medium text-slate-200">Why 4:</span> {rca.why4}</p>
                          <p className="text-slate-300"><span className="font-medium text-slate-200">Why 5:</span> {rca.why5}</p>
                          <p className="text-green-400 font-medium mt-2"><span className="text-slate-200">Root Cause:</span> {rca.rootCause}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Corrective Actions */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-slate-100">Corrective Actions (Immediate)</h4>
                </div>
                <ul className="space-y-2">
                  {analysis.correctiveActions.map((action, index) => (
                    <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preventive Actions */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-slate-100">Preventive Actions (Long-term)</h4>
                </div>
                <ul className="space-y-2">
                  {analysis.preventiveActions.map((action, index) => (
                    <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Regenerate Button */}
              <div className="text-center pt-2">
                <button
                  onClick={generateRCAAndCAPA}
                  disabled={isAnalyzing}
                  className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Regenerate Analysis'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RCACapaAnalysis;