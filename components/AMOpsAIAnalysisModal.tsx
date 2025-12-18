import React, { useState, useMemo } from 'react';
import { X, Target, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Store, Users, MapPin } from 'lucide-react';

interface FiveWhyAnalysis {
  question: string;
  section: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCause: string;
  correctiveActions: string[];
  preventiveActions: string[];
}

interface AMOpsAIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: any[];
  allAnalyses: FiveWhyAnalysis[];
}

type TabType = 'am' | 'region' | 'store' | 'issue';

const AMOpsAIAnalysisModal: React.FC<AMOpsAIAnalysisModalProps> = ({ isOpen, onClose, submissions, allAnalyses }) => {
  const [activeTab, setActiveTab] = useState<TabType>('am');
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const sectionNames: { [key: string]: string } = {
    'CG': 'Cheerful Greeting',
    'OTA': 'Order Taking Assistance',
    'FAS': 'Friendly & Accurate Service',
    'FWS': 'Feedback with Solution',
    'ENJ': 'Engagement',
    'EX': 'Excellence'
  };

  // Aggregate all corrective and preventive actions
  const aggregatedActions = useMemo(() => {
    const correctiveMap = new Map<string, number>();
    const preventiveMap = new Map<string, number>();
    
    allAnalyses.forEach(analysis => {
      analysis.correctiveActions.forEach(action => {
        correctiveMap.set(action, (correctiveMap.get(action) || 0) + 1);
      });
      analysis.preventiveActions.forEach(action => {
        preventiveMap.set(action, (preventiveMap.get(action) || 0) + 1);
      });
    });
    
    const topCorrective = Array.from(correctiveMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([action]) => action);
      
    const topPreventive = Array.from(preventiveMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([action]) => action);
    
    return { topCorrective, topPreventive };
  }, [allAnalyses]);

  // Group analyses by AM
  const analysesByAM = useMemo(() => {
    const amMap = new Map<string, { amName: string; analyses: FiveWhyAnalysis[]; storeCount: number }>();
    
    // Create a map of submission to its AM
    const submissionAMMap = new Map<number, string>();
    submissions.forEach((sub, idx) => {
      // Check all possible field name variations
      const amName = sub.amName || sub.am || sub['AM Name'] || sub.am_name || sub['Area Manager'] || '';
      if (amName) {
        submissionAMMap.set(idx, amName);
      }
    });
    
    // Group analyses - each analysis corresponds to a submission index
    allAnalyses.forEach((analysis, idx) => {
      const amName = submissionAMMap.get(idx);
      if (!amName) return; // Skip if no AM name found
      
      if (!amMap.has(amName)) {
        amMap.set(amName, { amName, analyses: [], storeCount: 0 });
      }
      
      amMap.get(amName)!.analyses.push(analysis);
    });
    
    // Calculate unique store counts
    amMap.forEach((value, key) => {
      const amStores = new Set(
        submissions
          .map((s, idx) => (submissionAMMap.get(idx) === key ? (s.storeName || s['Store Name']) : null))
          .filter(Boolean)
      );
      value.storeCount = amStores.size;
    });
    
    return Array.from(amMap.values()).sort((a, b) => b.analyses.length - a.analyses.length);
  }, [allAnalyses, submissions]);

  // Group analyses by Region
  const analysesByRegion = useMemo(() => {
    const regionMap = new Map<string, { region: string; analyses: FiveWhyAnalysis[]; storeCount: number }>();
    
    // Create a map of submission to its Region
    const submissionRegionMap = new Map<number, string>();
    submissions.forEach((sub, idx) => {
      const region = sub.region || sub['Region'] || sub.region_name || '';
      if (region) {
        submissionRegionMap.set(idx, region);
      }
    });
    
    // Group analyses
    allAnalyses.forEach((analysis, idx) => {
      const region = submissionRegionMap.get(idx);
      if (!region) return; // Skip if no region found
      
      if (!regionMap.has(region)) {
        regionMap.set(region, { region, analyses: [], storeCount: 0 });
      }
      
      regionMap.get(region)!.analyses.push(analysis);
    });
    
    // Calculate unique store counts
    regionMap.forEach((value, key) => {
      const regionStores = new Set(
        submissions
          .map((s, idx) => (submissionRegionMap.get(idx) === key ? (s.storeName || s['Store Name']) : null))
          .filter(Boolean)
      );
      value.storeCount = regionStores.size;
    });
    
    return Array.from(regionMap.values()).sort((a, b) => b.analyses.length - a.analyses.length);
  }, [allAnalyses, submissions]);

  // Group analyses by Store
  const analysesByStore = useMemo(() => {
    const storeMap = new Map<string, { storeName: string; analyses: FiveWhyAnalysis[] }>();
    
    // Create a map of submission to its Store
    const submissionStoreMap = new Map<number, string>();
    submissions.forEach((sub, idx) => {
      const storeName = sub.storeName || sub['Store Name'] || sub.store_name || sub.Store || '';
      if (storeName) {
        submissionStoreMap.set(idx, storeName);
      }
    });
    
    // Group analyses
    allAnalyses.forEach((analysis, idx) => {
      const storeName = submissionStoreMap.get(idx);
      if (!storeName) return; // Skip if no store name found
      
      if (!storeMap.has(storeName)) {
        storeMap.set(storeName, { storeName, analyses: [] });
      }
      
      storeMap.get(storeName)!.analyses.push(analysis);
    });
    
    return Array.from(storeMap.values()).sort((a, b) => b.analyses.length - a.analyses.length);
  }, [allAnalyses, submissions]);

  // Group analyses by Issue/Section
  const analysesByIssue = useMemo(() => {
    const issueMap = new Map<string, FiveWhyAnalysis[]>();
    
    allAnalyses.forEach(analysis => {
      const sectionName = sectionNames[analysis.section] || analysis.section;
      
      if (!issueMap.has(sectionName)) {
        issueMap.set(sectionName, []);
      }
      
      issueMap.get(sectionName)!.push(analysis);
    });
    
    return Array.from(issueMap.entries())
      .map(([section, analyses]) => ({ section, analyses }))
      .sort((a, b) => b.analyses.length - a.analyses.length);
  }, [allAnalyses, sectionNames]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AM Operations AI Analysis</h2>
              <p className="text-purple-100 text-sm">5-Why Root Cause Analysis with CAPA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <div className="flex gap-1 px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('am')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'am'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              👥 By AM ({analysesByAM.length})
            </button>
            <button
              onClick={() => setActiveTab('region')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'region'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              🗺️ By Region ({analysesByRegion.length})
            </button>
            <button
              onClick={() => setActiveTab('store')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'store'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              🏪 By Store ({analysesByStore.length})
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'issue'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              ⚠️ By Issue Type ({analysesByIssue.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* By AM Tab */}
          {activeTab === 'am' && (
            <div className="space-y-4">
              {analysesByAM.map((amGroup) => (
                <div key={amGroup.amName} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === amGroup.amName ? null : amGroup.amName)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      <div className="text-left">
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white">{amGroup.amName}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                          {amGroup.analyses.length} issues found across {amGroup.storeCount} stores
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-base font-extrabold">
                        {amGroup.analyses.length} issues
                      </span>
                      {expandedGroup === amGroup.amName ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {expandedGroup === amGroup.amName && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                      <div className="space-y-4">
                        {amGroup.analyses.map((analysis, idx) => (
                          <AnalysisCard key={idx} analysis={analysis} sectionNames={sectionNames} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* By Region Tab */}
          {activeTab === 'region' && (
            <div className="space-y-4">
              {analysesByRegion.map((regionGroup) => (
                <div key={regionGroup.region} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === regionGroup.region ? null : regionGroup.region)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <div className="text-left">
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white">{regionGroup.region}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                          {regionGroup.analyses.length} issues across {regionGroup.storeCount} stores
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-base font-extrabold">
                        {regionGroup.analyses.length} issues
                      </span>
                      {expandedGroup === regionGroup.region ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {expandedGroup === regionGroup.region && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                      <div className="space-y-4">
                        {regionGroup.analyses.map((analysis, idx) => (
                          <AnalysisCard key={idx} analysis={analysis} sectionNames={sectionNames} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* By Store Tab */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              {analysesByStore.map((storeGroup) => (
                <div key={storeGroup.storeName} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === storeGroup.storeName ? null : storeGroup.storeName)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Store className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div className="text-left">
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white">{storeGroup.storeName}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                          {storeGroup.analyses.length} issues identified
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-base font-extrabold">
                        {storeGroup.analyses.length} issues
                      </span>
                      {expandedGroup === storeGroup.storeName ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {expandedGroup === storeGroup.storeName && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                      <div className="space-y-4">
                        {storeGroup.analyses.map((analysis, idx) => (
                          <AnalysisCard key={idx} analysis={analysis} sectionNames={sectionNames} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* By Issue Type Tab */}
          {activeTab === 'issue' && (
            <div className="space-y-4">
              {analysesByIssue.map((issueGroup) => (
                <div key={issueGroup.section} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === issueGroup.section ? null : issueGroup.section)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      <div className="text-left">
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white">{issueGroup.section}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                          {issueGroup.analyses.length} issues in this category
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-base font-extrabold">
                        {issueGroup.analyses.length} issues
                      </span>
                      {expandedGroup === issueGroup.section ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {expandedGroup === issueGroup.section && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                      <div className="space-y-4">
                        {issueGroup.analyses.map((analysis, idx) => (
                          <AnalysisCard key={idx} analysis={analysis} sectionNames={sectionNames} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Analysis Card Component
const AnalysisCard: React.FC<{ analysis: FiveWhyAnalysis; sectionNames: { [key: string]: string } }> = ({ analysis, sectionNames }) => {
  const [expanded, setExpanded] = useState(false);
  const [fiveWhyExpanded, setFiveWhyExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400 mt-1" />
          <div className="text-left">
            <p className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">⚠️ AREA OF OPPORTUNITY</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">{analysis.question}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-sm font-medium">
                {sectionNames[analysis.section] || analysis.section}
              </span>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 font-medium">
              Root Cause: {analysis.rootCause}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
      </button>
      
      {expanded && (
        <div className="p-4 border-t border-purple-200 dark:border-purple-700 space-y-4">
          {/* 5-Why Analysis - Collapsible */}
          <div className="border border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setFiveWhyExpanded(!fiveWhyExpanded)}
              className="w-full p-3 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <h5 className="font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <span>🔍</span> 5-Why Analysis
              </h5>
              {fiveWhyExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {fiveWhyExpanded && (
              <div className="p-3 border-t border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10">
                <div className="space-y-2 ml-6 text-sm">
                  <div><span className="font-semibold text-purple-600 dark:text-purple-400">Why 1:</span> <span className="text-gray-700 dark:text-slate-300">{analysis.why1}</span></div>
                  <div><span className="font-semibold text-purple-600 dark:text-purple-400">Why 2:</span> <span className="text-gray-700 dark:text-slate-300">{analysis.why2}</span></div>
                  <div><span className="font-semibold text-purple-600 dark:text-purple-400">Why 3:</span> <span className="text-gray-700 dark:text-slate-300">{analysis.why3}</span></div>
                  <div><span className="font-semibold text-purple-600 dark:text-purple-400">Why 4:</span> <span className="text-gray-700 dark:text-slate-300">{analysis.why4}</span></div>
                  <div><span className="font-semibold text-purple-600 dark:text-purple-400">Why 5:</span> <span className="text-gray-700 dark:text-slate-300">{analysis.why5}</span></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Corrective Actions */}
          <div>
            <h5 className="font-bold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <span>🔧</span> Corrective Actions
            </h5>
            <ul className="space-y-1 ml-6 text-sm">
              {analysis.correctiveActions.map((action, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <span className="text-gray-700 dark:text-slate-300">{action}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Preventive Actions */}
          <div>
            <h5 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <span>🛡️</span> Preventive Actions
            </h5>
            <ul className="space-y-1 ml-6 text-sm">
              {analysis.preventiveActions.map((action, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <span className="text-gray-700 dark:text-slate-300">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AMOpsAIAnalysisModal;
