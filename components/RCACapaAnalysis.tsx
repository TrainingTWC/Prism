import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface RCACapaAnalysisProps {
  submissions: any[];
  questions: any[];
}

interface RCAIssue {
  questionId: string;
  questionTitle: string;
  section: string;
  sectionCode: string;
  storesAffected: string[];
  nonComplianceRate: number;
  totalResponses: number;
  noCount: number;
}

interface FiveWhyRCA {
  issue: string;
  section: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCause: string;
  correctiveActions: { action: string; timeline: string }[];
  preventiveActions: { action: string; timeline: string }[];
}

interface AnalysisResult {
  issues: RCAIssue[];
  rcaAnalyses: FiveWhyRCA[];
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

const ClockIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SECTION_MAP: { [key: string]: string } = {
  'CG': 'Cheerful Greeting (Store Appearance & Ambience)',
  'OTA': 'Order Taking Assistance (POS & Sales)',
  'FAS': 'Friendly & Accurate Service (Food Safety & Kitchen)',
  'FWS': 'Feedback with Solution (Financial & People Mgmt)',
  'ENJ': 'Enjoyable Experience (Customer Engagement)',
  'EX': 'Excellence (Exit & Closure)'
};

const RCACapaAnalysis: React.FC<RCACapaAnalysisProps> = ({ submissions, questions }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [expandedRCA, setExpandedRCA] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'rcas' | 'actions' | null>(null);
  const [expandedOpportunity, setExpandedOpportunity] = useState<Set<number>>(new Set());
  const [expandedCorrective, setExpandedCorrective] = useState(true);
  const [expandedPreventive, setExpandedPreventive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const prevSubmissionsRef = useRef<any[]>(submissions);

  // Reset analysis when filters change (submissions array changes)
  useEffect(() => {
    if (prevSubmissionsRef.current !== submissions) {
      prevSubmissionsRef.current = submissions;
      if (analysis) {
        setAnalysis(null);
        setError(null);
        setExpandedRCA(null);
        setExpandedOpportunity(new Set());
        setActiveTab(null);
      }
    }
  }, [submissions]);

  const toggleOpportunity = (idx: number) => {
    setExpandedOpportunity(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  // Detect all "No" responses — these are the areas of opportunity
  const detectIssues = (): RCAIssue[] => {
    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) return [];

    const issues: RCAIssue[] = [];

    questions.forEach((question: any) => {
      const questionId = question.id;
      const questionTitle = question.title;
      const sectionCode = questionId.split('_')[0]; // CG, OTA, FAS, etc.
      const section = SECTION_MAP[sectionCode] || sectionCode;

      const allResponses = submissions.filter((sub: any) => {
        const r = sub[questionId];
        return r && r !== '' && r !== 'N/A';
      });

      const noResponses = submissions.filter((sub: any) => {
        const r = sub[questionId];
        return r && typeof r === 'string' && r.toLowerCase().trim() === 'no';
      });

      if (noResponses.length > 0) {
        const stores = noResponses
          .map((sub: any) => sub.storeName || sub.store_id || sub.storeId || sub.store || 'Unknown')
          .filter((s: string, i: number, arr: string[]) => arr.indexOf(s) === i);

        issues.push({
          questionId,
          questionTitle,
          section,
          sectionCode,
          storesAffected: stores,
          nonComplianceRate: allResponses.length > 0 ? Math.round((noResponses.length / allResponses.length) * 100) : 0,
          totalResponses: allResponses.length,
          noCount: noResponses.length
        });
      }
    });

    return issues.sort((a, b) => b.noCount - a.noCount || b.nonComplianceRate - a.nonComplianceRate);
  };

  // Call Gemini AI for proper 5-Why RCA
  const callGeminiForRCA = async (issues: RCAIssue[]): Promise<FiveWhyRCA[]> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('No Gemini API key — using structured fallback');
      return generateFallbackRCA(issues);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const issueList = issues.map((issue, i) =>
        `${i + 1}. [${issue.sectionCode}] "${issue.questionTitle}" — ${issue.noCount} store(s) marked No (${issue.nonComplianceRate}% non-compliance). Stores: ${issue.storesAffected.join(', ')}`
      ).join('\n');

      const prompt = `You are an expert café operations auditor for a café chain (TWC - The Waffle Company). Below are audit findings where stores were marked "No" (non-compliant).

AUDIT FINDINGS (Areas of Opportunity):
${issueList}

For EACH issue above, provide a 5-Why Root Cause Analysis with corrective and preventive actions. Be highly specific to the exact issue. No generic fluff.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code blocks, just raw JSON):
[
  {
    "issue": "exact question text",
    "section": "section name",
    "why1": "first why — what is the immediate observable problem",
    "why2": "second why — why did that happen",
    "why3": "third why — dig deeper into process/people",
    "why4": "fourth why — systemic or training gap",
    "why5": "fifth why — root organizational/cultural cause",
    "rootCause": "one-line root cause statement",
    "correctiveActions": [
      {"action": "specific immediate fix action", "timeline": "e.g. Within 24 hours"},
      {"action": "second corrective action", "timeline": "e.g. Within 1 week"}
    ],
    "preventiveActions": [
      {"action": "specific long-term prevention", "timeline": "e.g. Ongoing weekly"},
      {"action": "second preventive action", "timeline": "e.g. Within 2 weeks, then monthly"}
    ]
  }
]

RULES:
- Each "why" must logically flow from the previous one, drilling deeper into the specific issue
- Corrective actions = immediate fixes to resolve the current non-compliance
- Preventive actions = systemic changes to prevent recurrence
- Timelines must be realistic: immediate (24-48 hrs), short-term (1-2 weeks), ongoing
- Be specific to café operations — mention roles (Store Manager, Shift Supervisor, MOD, AM, Partners)
- Keep each response concise — max 1-2 sentences per field
- Cover ALL ${issues.length} issues in your response`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text()?.trim() || '';

      // Parse JSON — handle potential markdown wrapping
      let jsonText = responseText;
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText) as FiveWhyRCA[];
      return parsed;
    } catch (err) {
      console.error('Gemini RCA call failed:', err);
      return generateFallbackRCA(issues);
    }
  };

  // Structured fallback when no API key or API fails
  const generateFallbackRCA = (issues: RCAIssue[]): FiveWhyRCA[] => {
    return issues.map(issue => {
      const q = issue.questionTitle.toLowerCase();
      let context = 'operational standard';
      if (q.includes('clean') || q.includes('washroom') || q.includes('engine area')) context = 'cleanliness & hygiene';
      else if (q.includes('temperature') || q.includes('therma') || q.includes('thawing')) context = 'food safety protocol';
      else if (q.includes('grooming') || q.includes('uniform') || q.includes('staff')) context = 'staff presentation';
      else if (q.includes('signage') || q.includes('display') || q.includes('tent card') || q.includes('menu board') || q.includes('planogram')) context = 'visual merchandising';
      else if (q.includes('cash') || q.includes('banking') || q.includes('pos') || q.includes('audit')) context = 'financial operations';
      else if (q.includes('training') || q.includes('coaching') || q.includes('deployment')) context = 'training & development';
      else if (q.includes('cctv') || q.includes('pest') || q.includes('maintenance')) context = 'safety & maintenance';

      return {
        issue: issue.questionTitle,
        section: issue.section,
        why1: `"${issue.questionTitle}" was marked No at ${issue.noCount} store(s) — the ${context} requirement was not met during the audit`,
        why2: `Partners/MOD did not execute the ${context} checklist or skipped this step during the shift`,
        why3: `Shift Supervisor did not verify completion or provide real-time coaching on ${context}`,
        why4: `No structured daily accountability system in place for ${context} compliance tracking`,
        why5: `Store leadership has not embedded ${context} as a non-negotiable daily priority with clear ownership`,
        rootCause: `Lack of daily ownership, verification, and accountability for ${context} at store level`,
        correctiveActions: [
          { action: `AM to conduct immediate store visit and verify ${context} compliance on-ground`, timeline: 'Within 48 hours' },
          { action: `Store Manager to retrain affected partners on "${issue.questionTitle}" with hands-on demonstration`, timeline: 'Within 1 week' },
          { action: `Implement daily photo/checklist verification for this item sent to AM group`, timeline: 'Within 1 week' }
        ],
        preventiveActions: [
          { action: `Add "${issue.questionTitle}" to daily opening/closing manager sign-off checklist`, timeline: 'Within 1 week, then ongoing' },
          { action: `Weekly AM spot-check of ${context} with documented feedback to Store Manager`, timeline: 'Ongoing weekly' },
          { action: `Include ${context} compliance in monthly store performance review`, timeline: 'Starting next review cycle' }
        ]
      };
    });
  };

  const generateRCAAndCAPA = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const issues = detectIssues();

      if (issues.length === 0) {
        setAnalysis({
          issues: [],
          rcaAnalyses: []
        });
        setIsAnalyzing(false);
        return;
      }

      const rcaAnalyses = await callGeminiForRCA(issues);

      setAnalysis({
        issues,
        rcaAnalyses
      });
    } catch (err) {
      console.error('RCA Analysis error:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ClipboardDocumentListIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">RCA & CAPA Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">AI-Powered Root Cause Analysis & Corrective/Preventive Actions</p>
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
              className="btn-primary-gradient disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-transform duration-150 transform hover:scale-105 flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
            </button>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          {!analysis && !isAnalyzing && !error && (
            <div className="text-center py-8">
              <button
                onClick={generateRCAAndCAPA}
                className="btn-primary-gradient text-white px-6 py-3 rounded-lg font-medium transition-transform duration-150 transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Generate AI Analysis
              </button>
              <p className="text-gray-600 dark:text-slate-400 text-sm mt-2">AI will analyze all non-compliant items and generate 5-Why RCA with action plans</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-900 dark:text-slate-300 mt-4 font-medium">AI Analysis in Progress...</p>
              <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">Analyzing non-compliant items, building 5-Why RCA, generating action plans with timelines</p>
            </div>
          )}

          {error && (
            <div className="text-center py-6">
              <ExclamationTriangleIcon className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              <button onClick={generateRCAAndCAPA} className="mt-3 text-blue-600 dark:text-blue-400 text-sm underline">Try Again</button>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Clickable Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => analysis.issues.length > 0 && setActiveTab(activeTab === 'opportunities' ? null : 'opportunities')}
                  className={`bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-lg p-4 text-center transition-all cursor-pointer ${
                    activeTab === 'opportunities'
                      ? 'border-2 border-yellow-500 dark:border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-700 shadow-md scale-[1.02]'
                      : 'border border-yellow-300 dark:border-yellow-700/50 hover:border-yellow-400 dark:hover:border-yellow-600 hover:shadow-sm'
                  }`}
                >
                  <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{analysis.issues.length}</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-200/80 mt-1">Areas of Opportunity</div>
                </button>
                <button
                  onClick={() => analysis.issues.length > 0 && setActiveTab(activeTab === 'rcas' ? null : 'rcas')}
                  className={`bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg p-4 text-center transition-all cursor-pointer ${
                    activeTab === 'rcas'
                      ? 'border-2 border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-700 shadow-md scale-[1.02]'
                      : 'border border-blue-300 dark:border-blue-700/50 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm'
                  }`}
                >
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{analysis.rcaAnalyses.length}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-200/80 mt-1">5-Why RCAs</div>
                </button>
                <button
                  onClick={() => analysis.issues.length > 0 && setActiveTab(activeTab === 'actions' ? null : 'actions')}
                  className={`bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 rounded-lg p-4 text-center transition-all cursor-pointer ${
                    activeTab === 'actions'
                      ? 'border-2 border-green-500 dark:border-green-400 ring-2 ring-green-200 dark:ring-green-700 shadow-md scale-[1.02]'
                      : 'border border-green-300 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-600 hover:shadow-sm'
                  }`}
                >
                  <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {analysis.rcaAnalyses.reduce((sum, r) => sum + (r.correctiveActions?.length || 0) + (r.preventiveActions?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-200/80 mt-1">Action Items</div>
                </button>
              </div>

              {analysis.issues.length === 0 ? (
                <div className="text-center py-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700/50">
                  <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 dark:text-green-300 font-medium">All Clear! No non-compliant items found.</p>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">All checklist items are marked compliant. Keep up the great work!</p>
                </div>
              ) : activeTab ? (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 overflow-hidden">
                  {/* Tab Header */}
                  <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${
                    activeTab === 'opportunities' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50' :
                    activeTab === 'rcas' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50' :
                    'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700/50'
                  }`}>
                    {activeTab === 'opportunities' && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                    {activeTab === 'rcas' && <MagnifyingGlassIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    {activeTab === 'actions' && <ClipboardDocumentListIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">
                      {activeTab === 'opportunities' ? `Areas of Opportunity (${analysis.issues.length})` :
                       activeTab === 'rcas' ? `5-Why Root Cause Analyses (${analysis.rcaAnalyses.length})` :
                       'CAPA \u2014 Corrective & Preventive Actions'}
                    </span>
                  </div>

                  {/* Scrollable Content */}
                  <div className="max-h-[420px] overflow-y-auto p-3 space-y-2">
                    {/* === Opportunities Tab === */}
                    {activeTab === 'opportunities' && analysis.issues.map((issue, idx) => {
                      const matchingRCA = analysis.rcaAnalyses.find(r => r.issue === issue.questionTitle);
                      const isOpen = expandedOpportunity.has(idx);
                      return (
                        <div key={idx} className={`bg-white dark:bg-slate-800/70 rounded-lg overflow-hidden border-l-4 ${issue.noCount > 1 ? 'border-red-500' : 'border-yellow-500'}`}>
                          <button
                            onClick={() => toggleOpportunity(idx)}
                            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-gray-800 dark:text-slate-200 text-sm leading-tight">{issue.questionTitle}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                                  issue.noCount > 1
                                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                                }`}>
                                  {issue.noCount > 1 ? 'High' : 'Medium'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                <span className="font-medium text-gray-600 dark:text-slate-300">{issue.sectionCode}</span> &middot; {issue.storesAffected.length} store(s) &middot; {issue.nonComplianceRate}% non-compliance
                              </div>
                            </div>
                            {isOpen ? (
                              <ChevronUpIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 flex-shrink-0 ml-2" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 flex-shrink-0 ml-2" />
                            )}
                          </button>

                          {isOpen && matchingRCA && (
                            <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/30 px-4 py-3">
                              <div className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-2">5-Why Root Cause Analysis</div>
                              <div className="space-y-1.5">
                                {[
                                  { label: 'Why 1', value: matchingRCA.why1 },
                                  { label: 'Why 2', value: matchingRCA.why2 },
                                  { label: 'Why 3', value: matchingRCA.why3 },
                                  { label: 'Why 4', value: matchingRCA.why4 },
                                  { label: 'Why 5', value: matchingRCA.why5 }
                                ].map((w, i) => (
                                  <div key={i} className="flex gap-2 text-xs">
                                    <span className="text-gray-500 dark:text-slate-500 font-semibold w-14 flex-shrink-0">{w.label}:</span>
                                    <span className="text-gray-700 dark:text-slate-300">{w.value}</span>
                                  </div>
                                ))}
                                <div className="flex gap-2 text-xs mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold w-14 flex-shrink-0">Root:</span>
                                  <span className="text-blue-700 dark:text-blue-300 font-semibold">{matchingRCA.rootCause}</span>
                                </div>
                              </div>
                              {issue.storesAffected.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                  <span className="text-xs text-gray-500 dark:text-slate-400">Stores: </span>
                                  <span className="text-xs text-gray-700 dark:text-slate-300 font-medium">{issue.storesAffected.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* === 5-Why RCAs Tab === */}
                    {activeTab === 'rcas' && analysis.rcaAnalyses.map((rca, rIdx) => (
                      <div key={rIdx} className="bg-white dark:bg-slate-800/70 rounded-lg border border-blue-200 dark:border-blue-700/40 overflow-hidden">
                        <button
                          onClick={() => setExpandedRCA(expandedRCA === rIdx ? null : rIdx)}
                          className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 dark:text-slate-200 text-sm leading-tight">{rca.issue}</span>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{rca.section}</div>
                          </div>
                          {expandedRCA === rIdx ? (
                            <ChevronUpIcon className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 text-blue-400 dark:text-blue-500 flex-shrink-0 ml-2" />
                          )}
                        </button>
                        {expandedRCA === rIdx && (
                          <div className="border-t border-blue-200 dark:border-blue-700/40 bg-blue-50/30 dark:bg-blue-900/10 px-4 py-3 space-y-1.5">
                            {[
                              { label: 'Why 1', value: rca.why1 },
                              { label: 'Why 2', value: rca.why2 },
                              { label: 'Why 3', value: rca.why3 },
                              { label: 'Why 4', value: rca.why4 },
                              { label: 'Why 5', value: rca.why5 }
                            ].map((w, i) => (
                              <div key={i} className="flex gap-2 text-xs">
                                <span className="text-blue-500 dark:text-blue-400 font-semibold w-14 flex-shrink-0">{w.label}:</span>
                                <span className="text-gray-700 dark:text-slate-300">{w.value}</span>
                              </div>
                            ))}
                            <div className="flex gap-2 text-xs mt-2 pt-2 border-t border-blue-200 dark:border-blue-700/40">
                              <span className="text-blue-600 dark:text-blue-300 font-bold w-14 flex-shrink-0">Root:</span>
                              <span className="text-blue-700 dark:text-blue-200 font-semibold">{rca.rootCause}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* === Actions (CAPA) Tab === */}
                    {activeTab === 'actions' && (
                      <div className="space-y-3">
                        {/* Corrective Actions */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/15 dark:to-red-800/10 rounded-lg border border-red-200 dark:border-red-700/40 overflow-hidden">
                          <button
                            onClick={() => setExpandedCorrective(!expandedCorrective)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-100/50 dark:hover:bg-red-900/10 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="font-semibold text-red-800 dark:text-red-200 text-sm">Corrective Actions \u2014 Fix Now</span>
                              <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                                {analysis.rcaAnalyses.reduce((sum, r) => sum + (r.correctiveActions?.length || 0), 0)}
                              </span>
                            </div>
                            {expandedCorrective ? (
                              <ChevronUpIcon className="w-4 h-4 text-red-400 dark:text-red-500" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 text-red-400 dark:text-red-500" />
                            )}
                          </button>
                          {expandedCorrective && (
                            <div className="px-4 pb-4 space-y-3">
                              {analysis.rcaAnalyses.map((rca, rIdx) => (
                                (rca.correctiveActions && rca.correctiveActions.length > 0) && (
                                  <div key={rIdx}>
                                    <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 truncate" title={rca.issue}>
                                      {rca.issue}
                                    </div>
                                    <div className="space-y-1.5 ml-2">
                                      {rca.correctiveActions.map((ca, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs">
                                          <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">&bull;</span>
                                          <div className="flex-1">
                                            <span className="text-gray-700 dark:text-slate-300">{typeof ca === 'string' ? ca : ca.action}</span>
                                            {typeof ca !== 'string' && ca.timeline && (
                                              <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-[10px] font-medium">
                                                <ClockIcon className="w-3 h-3" />
                                                {ca.timeline}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Preventive Actions */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/15 dark:to-green-800/10 rounded-lg border border-green-200 dark:border-green-700/40 overflow-hidden">
                          <button
                            onClick={() => setExpandedPreventive(!expandedPreventive)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-100/50 dark:hover:bg-green-900/10 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="font-semibold text-green-800 dark:text-green-200 text-sm">Preventive Actions \u2014 Long-term</span>
                              <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                                {analysis.rcaAnalyses.reduce((sum, r) => sum + (r.preventiveActions?.length || 0), 0)}
                              </span>
                            </div>
                            {expandedPreventive ? (
                              <ChevronUpIcon className="w-4 h-4 text-green-400 dark:text-green-500" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 text-green-400 dark:text-green-500" />
                            )}
                          </button>
                          {expandedPreventive && (
                            <div className="px-4 pb-4 space-y-3">
                              {analysis.rcaAnalyses.map((rca, rIdx) => (
                                (rca.preventiveActions && rca.preventiveActions.length > 0) && (
                                  <div key={rIdx}>
                                    <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 truncate" title={rca.issue}>
                                      {rca.issue}
                                    </div>
                                    <div className="space-y-1.5 ml-2">
                                      {rca.preventiveActions.map((pa, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs">
                                          <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0">&bull;</span>
                                          <div className="flex-1">
                                            <span className="text-gray-700 dark:text-slate-300">{typeof pa === 'string' ? pa : pa.action}</span>
                                            {typeof pa !== 'string' && pa.timeline && (
                                              <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-[10px] font-medium">
                                                <ClockIcon className="w-3 h-3" />
                                                {pa.timeline}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Regenerate */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={generateRCAAndCAPA}
                  disabled={isAnalyzing}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:bg-gray-100 dark:disabled:bg-slate-700/50 text-gray-800 dark:text-slate-200 px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
                >
                  <MagnifyingGlassIcon className="w-3.5 h-3.5" />
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