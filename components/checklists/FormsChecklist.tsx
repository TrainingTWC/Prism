import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { AREA_MANAGERS } from '../../constants';
import compStoreMapping from '../../src/comprehensive_store_mapping.json';

interface Question {
  id: string;
  text: string;
  type: 'likert' | 'text';
  weight_percent: number;
}

interface Section {
  id: string;
  title: string;
  weight_percent: number;
  questions: Question[];
}

interface FormDefinition {
  title: string;
  version: string;
  description?: string;
  sections: Section[];
  validation?: {
    required_questions?: string[];
  };
}

interface FormsChecklistProps {
  userRole?: any;
  onStatsUpdate?: (stats: { completed: number; total: number; score: number }) => void;
}

// Management Trainee Feedback Form (from user-provided JSON)
const FORM: FormDefinition = {
  title: 'Management Trainee Feedback Form',
  version: 'v1.0',
  description: 'Formal MT feedback with weighted scoring across key learning and workplace dimensions.',
  sections: [
    {
      id: 'overall_experience',
      title: 'Overall Experience',
      weight_percent: 15,
      questions: [
        { id: 'Q1', text: 'Rate your overall learning experience during the Management Trainee (MT) journey.', type: 'likert', weight_percent: 15 }
      ]
    },
    {
      id: 'training_effectiveness',
      title: 'Training Effectiveness',
      weight_percent: 25,
      questions: [
        { id: 'Q2', text: 'The training content and delivery (classroom and on-ground) effectively built my understanding of café operations.', type: 'likert', weight_percent: 10 },
        { id: 'Q3', text: 'The LMS modules were easy to access, engaging, and supported my overall learning.', type: 'likert', weight_percent: 10 },
        { id: 'Q4', text: 'The training structure provided adequate practice time and opportunities to reflect on learning.', type: 'likert', weight_percent: 5 }
      ]
    },
    {
      id: 'trainer_support',
      title: 'Trainer & On-Ground Support',
      weight_percent: 25,
      questions: [
        { id: 'Q5', text: 'My trainer provided clear guidance, timely feedback, and consistent support throughout my training.', type: 'likert', weight_percent: 10 },
        { id: 'Q6', text: 'My Store Manager ensured structured learning opportunities and clarity of expectations.', type: 'likert', weight_percent: 7 },
        { id: 'Q7', text: 'My Area Manager was approachable and provided adequate guidance during my training journey.', type: 'likert', weight_percent: 8 }
      ]
    },
    {
      id: 'culture_environment',
      title: 'Workplace Culture & Environment',
      weight_percent: 15,
      questions: [
        { id: 'Q8', text: 'I felt respected, included, and supported in the workplace during my training.', type: 'likert', weight_percent: 7 },
        { id: 'Q9', text: "I understand Third Wave Coffee’s culture, values, and vision, and I feel motivated to build a long-term career here.", type: 'likert', weight_percent: 8 }
      ]
    },
    {
      id: 'application_readiness',
      title: 'Application & Readiness',
      weight_percent: 20,
      questions: [
        { id: 'Q10', text: 'I feel confident applying what I learned during the Buddy Trainer course in my café.', type: 'likert', weight_percent: 12 },
        { id: 'Q11', text: 'I have had sufficient opportunities to apply my learning in real café situations.', type: 'likert', weight_percent: 8 }
      ]
    },
    {
      id: 'open_feedback',
      title: 'Open Feedback',
      weight_percent: 0,
      questions: [
        { id: 'Q12', text: 'What suggestions would you like to share to improve the Management Trainee training experience?', type: 'text', weight_percent: 0 },
        { id: 'Q13', text: 'How can your manager or team better support you in applying this training?', type: 'text', weight_percent: 0 },
        { id: 'Q14', text: 'Were there any topics you wish had been covered in greater depth?', type: 'text', weight_percent: 0 },
        { id: 'Q15', text: 'What aspects of the training could be improved?', type: 'text', weight_percent: 0 },
        { id: 'Q16', text: 'Did the training and experience meet your expectations throughout your journey as a Barista and Buddy Trainer? Please explain.', type: 'text', weight_percent: 0 }
      ]
    }
  ],
  validation: {
    required_questions: ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11']
  }
};

const STORAGE_KEY = `forms_mt_feedback_${FORM.version}_resp`;

const FormsChecklist: React.FC<FormsChecklistProps> = ({ onStatsUpdate }) => {
  const [responses, setResponses] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute stats and score whenever responses change
  useEffect(() => {
    if (!onStatsUpdate) return;

  // All questions are mandatory (likert + text)
  const allQuestions = FORM.sections.flatMap(s => s.questions.map(q => q.id));
  const total = allQuestions.length;
  let completed = 0;
  allQuestions.forEach(id => { if (responses[id] && responses[id].toString().trim()) completed++; });

    // Score calculation: sum(score * weight_percent) / 5 -> normalized 0-100 (per spec)
    let weightedSum = 0;
    let weightTotal = 0;
    FORM.sections.forEach(section => {
      section.questions.forEach(q => {
        if (q.type === 'likert') {
          const val = parseInt(responses[q.id] || '0', 10);
          weightedSum += (isNaN(val) ? 0 : val) * q.weight_percent;
          weightTotal += q.weight_percent;
        }
      });
    });

    const scorePercent = weightTotal > 0 ? (weightedSum / 5) : 0; // since max per question is 5, dividing by 5 gives 0..100 when weights sum to 100

    onStatsUpdate({ completed, total, score: Number(scorePercent.toFixed(1)) });
  }, [responses, onStatsUpdate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  }, [responses]);

  const handleLikert = (qid: string, value: number) => {
    // Add haptic feedback on selection
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50); // Short vibration for feedback
    }
    setResponses(prev => ({ ...prev, [qid]: String(value) }));
  };

  const handleText = (qid: string, value: string) => {
    setResponses(prev => ({ ...prev, [qid]: value }));
  };

  const validateAndSubmit = async () => {
    // All questions mandatory
    const allQuestions = FORM.sections.flatMap(s => s.questions.map(q => q.id));
    const missing = allQuestions.filter(id => !responses[id] || String(responses[id]).trim() === '');
    if (missing.length > 0) {
      alert('Please answer all questions before submitting. Missing: ' + missing.join(', '));
      return;
    }
    
    setIsSubmitting(true);

    // Compute weighted score client-side to include in payload
    let weightedSum = 0;
    let weightTotal = 0;
    FORM.sections.forEach(section => {
      section.questions.forEach(q => {
        if (q.type === 'likert') {
          const val = parseInt(responses[q.id] || '0', 10);
          if (!isNaN(val)) {
            // Convert 1-5 scale to percentage (1=20%, 2=40%, 3=60%, 4=80%, 5=100%)
            const scorePercent = (val / 5) * 100;
            weightedSum += scorePercent * (q.weight_percent / 100);
          }
          weightTotal += q.weight_percent;
        }
      });
    });
    // Final score is already a percentage (0-100)
    const percent = weightTotal > 0 ? Number(weightedSum.toFixed(1)) : 0;
    const totalScore = Math.round(weightedSum);
    const maxScore = 100; // Always out of 100

    // Build payload for Apps Script
    const payload = {
      formTitle: FORM.title,
      formVersion: FORM.version,
      meta,
      responses,
      totalScore,
      maxScore,
      percent,
      submit_ts: new Date().toISOString()
    };

    // Attempt to POST to provided Apps Script URL so the row appears in the sheet before we confirm to the user.
    // Updated with latest Apps Script deployment URL for MT Feedback Form
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz__a_oU00GWQ1RhxzmwtRDKd5ysJJLmUyGyQYEIEGMHMbIQ07s4VpMLFSjgIgQXKwEaQ/exec';

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // Change to no-cors to handle Google Apps Script restrictions
        cache: 'no-cache',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      // With no-cors mode, we won't get a proper response back
      // But if the request completes without error, we consider it successful
      localStorage.setItem(`${STORAGE_KEY}_submitted`, new Date().toISOString());
      setSubmitted(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
      setIsSubmitting(false);
      return;
    } catch (err) {
      console.error('Submit failed:', err);
      let errorMessage = 'Network error while submitting';
      if (err instanceof Error) {
        if (err.message === 'CORS preflight failed') {
          errorMessage = 'The form service is not available. Please try again later.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      // fallback: save locally
      localStorage.setItem(`${STORAGE_KEY}_submitted`, new Date().toISOString());
      setSubmitted(true);
      setIsSubmitting(false);
      alert(`${errorMessage} — saved locally.`);
      return;
    }
  };

  // Helper to compute per-section score (0-100)
  const sectionScore = (section: Section) => {
    let sWeighted = 0;
    let sWeight = 0;
    section.questions.forEach(q => {
      if (q.type === 'likert') {
        const v = parseInt(responses[q.id] || '0', 10);
        if (!isNaN(v)) {
          // Convert 1-5 scale to percentage (1=20%, 2=40%, 3=60%, 4=80%, 5=100%)
          const scorePercent = (v / 5) * 100;
          sWeighted += scorePercent * (q.weight_percent / 100);
          sWeight += q.weight_percent;
        }
      }
    });
    return sWeight > 0 ? Number(sWeighted.toFixed(1)) : 0;
  };

  // Simple audit meta like TrainingChecklist (but lighter)

  interface Meta {
    name: string;
    store: string;
    am: string;
    trainer: string;
  }

  const [meta, setMeta] = useState<Meta>(() => {
    try { 
      const stored = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_meta`) || '{}');
      // If URL param 'nm' present, prefer it for name
      const urlParams = new URLSearchParams(window.location.search);
      const nm = urlParams.get('nm');
      if (nm && (!stored || !stored.name)) {
        stored.name = nm;
      }
      return stored;
    } catch (e) { return { name: '', store: '', am: '', trainer: '' }; }
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify(meta));
  }, [meta]);

  // Always pick name from URL param 'nm' when present (override stored)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const nm = urlParams.get('nm');
      if (nm) setMeta(prev => ({ ...prev, name: nm }));
    } catch (e) {}
  }, []);

  // Store dropdown state and search
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

  const normalizeId = (v: any) => (v || '').toString().trim().toUpperCase();

  const trainerNameOverrides: Record<string, string> = {
    H1761: 'Mahadev',
    H701: 'Mallika',
    H1697: 'Sheldon',
    H2595: 'Kailash',
    H3595: 'Bhawna',
    H3252: 'Priyanka',
    H1278: 'Viraj',
    H3247: 'Sunil'
  };

  const uniqueStores = (() => {
    try {
      const stores = (compStoreMapping as any[]).map((row: any) => ({ name: row['Store Name'], id: row['Store ID'], am: row['AM'], trainer: row['Trainer'] }));
      return stores
        .filter((s: any) => s.name && s.id)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
    } catch (e) {
      return [];
    }
  })();

  const filteredStores = uniqueStores.filter(store => {
    const term = storeSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (store.name || '').toLowerCase().includes(term) || (store.id || '').toLowerCase().includes(term);
  });

  const autoFillFields = (field: string, value: string) => {
    if (field === 'store') {
      const mappingItem = (compStoreMapping as any[]).find((item: any) => item['Store Name'] === value || item['Store ID'] === value);
      if (mappingItem) {
        const amFromStore = AREA_MANAGERS.find(am => am.id === mappingItem.AM);
        const trainerName = trainerNameOverrides[mappingItem.Trainer] || mappingItem.Trainer || '';
        setMeta(prev => ({
          ...prev,
          store: mappingItem['Store Name'] || value,
          am: amFromStore?.name || '',
          trainer: trainerName
        }));
      } else {
        setMeta(prev => ({ ...prev, store: value }));
      }
    }
  };

  const handleMetaChange = (field: keyof Meta, value: string) => {
    setMeta(prev => ({ ...prev, [field]: value }));
  };

  // Render
  if (submitted) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center border border-green-200 dark:border-green-800">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">{FORM.title} Submitted!</h2>
          <p className="text-green-600 dark:text-green-400 mb-6">Responses saved locally. Extend submission to an API or Google Sheets when ready.</p>
            <div className="flex justify-center gap-4">
            <button onClick={() => { setSubmitted(false); setResponses({}); setMeta({ name: '', store: '', am: '', trainer: '' }); localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(`${STORAGE_KEY}_meta`); }} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg">Start New</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl text-center">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-slate-100">Submitting form...</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-900/20 p-3 sm:p-4 border-b border-cyan-200 dark:border-cyan-800">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="break-words">{FORM.title}</span>
        </h1>
      </div>

      {/* Meta / Form details */}
      <div id="audit-information" className="bg-gray-50 dark:bg-slate-900 p-3 sm:p-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Form details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label>
            <input type="text" value={meta.name} onChange={(e)=>handleMetaChange('name', e.target.value)} placeholder="Your name" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store</label>
            <input
              type="text"
              value={storeSearchTerm || meta.store}
              onChange={(e)=>{ setStoreSearchTerm(e.target.value); setShowStoreDropdown(true); setSelectedStoreIndex(-1); }}
              onFocus={()=>setShowStoreDropdown(true)}
              onBlur={()=>setTimeout(()=>setShowStoreDropdown(false), 200)}
              placeholder="Search Store..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />

            {showStoreDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredStores.length > 0 ? (
                  filteredStores.map((store: any, index: number) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        autoFillFields('store', store.name);
                        setStoreSearchTerm('');
                        setShowStoreDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm break-words ${index===selectedStoreIndex? 'bg-gray-100 dark:bg-slate-700':''}`}
                    >
                      <div className="truncate">{store.name} ({store.id})</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">No stores found</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">AM</label>
            <input type="text" value={meta.am} onChange={(e)=>handleMetaChange('am', e.target.value)} placeholder="Area Manager name" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Trainer</label>
            <input type="text" value={meta.trainer} onChange={(e)=>handleMetaChange('trainer', e.target.value)} placeholder="Trainer name" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>
        </div>
      </div>

      {/* Form Sections */}
      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4" data-tour="checklist-form">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Assessment Form</h2>

        <div className="space-y-4">
          {FORM.sections.map((section) => (
            <div key={section.id} className="border-l-4 border-cyan-400 pl-4 bg-white dark:bg-slate-800 p-3 rounded">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{section.title}</h3>
                </div>

              <div className="space-y-3">
                {section.questions.map((q, idx) => (
                  <div key={q.id} className="p-2 sm:p-3 border border-gray-200 dark:border-slate-600 rounded">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium shrink-0 mt-1">{idx+1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">{q.text}</p>
                        {q.type === 'likert' ? (
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={responses[q.id] || '3'}
                              onChange={(e) => handleLikert(q.id, parseInt(e.target.value))}
                              className="w-full accent-cyan-600"
                            />
                            <div className="flex justify-between px-1 text-sm text-gray-600 dark:text-slate-400">
                              <span>1</span>
                              <span>2</span>
                              <span>3</span>
                              <span>4</span>
                              <span>5</span>
                            </div>
                            <div className="text-center text-sm font-medium text-cyan-600 dark:text-cyan-400">
                              Selected: {responses[q.id] || '3'}
                            </div>
                          </div>
                        ) : (
                          <textarea rows={3} value={responses[q.id]||''} onChange={(e)=>handleText(q.id, e.target.value)} className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700 text-sm" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center gap-3">
            <button onClick={validateAndSubmit} className="px-4 py-2 bg-cyan-600 text-white rounded">Submit Form</button>
            {submitted && <div className="text-sm text-green-600">Submitted ✓</div>}
          </div>
        </div>
      </div>
    </>
  );
};

export default FormsChecklist;
