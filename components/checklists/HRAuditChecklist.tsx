import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../../roleMapping';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { HR_AUDIT_SECTIONS, HRSection, HRQuestion, calculateHRAuditScores } from '../../config/hrAuditQuestions';
import ImageEditor from '../ImageEditor';

const HR_AUDIT_ENDPOINT = import.meta.env.VITE_HR_AUDIT_SCRIPT_URL || '';

interface SurveyResponse {
  [key: string]: string;
}

interface SurveyMeta {
  auditorName: string;
  auditorId: string;
  storeName: string;
  storeId: string;
  city: string;
  region: string;
}

interface DraftMetadata {
  id: string;
  timestamp: string;
  storeName: string;
  auditorName: string;
  completionPercentage: number;
}

interface HRAuditChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  editMode?: boolean;
  existingSubmission?: any;
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  medium: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
  high: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
  critical: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
};

const SECTION_EMOJIS: Record<string, string> = {
  AttritionRisk: '🟠',
  Capability: '🔵',
  Culture: '🟢',
  Engagement: '🟡',
  Pressure: '🔴',
};

const HRAuditChecklist: React.FC<HRAuditChecklistProps> = ({ userRole, onStatsUpdate, editMode = false, existingSubmission }) => {
  const { config, loading: configLoading } = useConfig();
  const sections = HR_AUDIT_SECTIONS;

  const [responses, setResponses] = useState<SurveyResponse>(() => {
    if (editMode && existingSubmission) return existingSubmission.responses || {};
    try { return JSON.parse(localStorage.getItem('hr_audit_resp') || '{}'); } catch { return {}; }
  });

  const [questionRemarks, setQuestionRemarks] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('hr_audit_remarks') || '{}'); } catch { return {}; }
  });

  const [signatures, setSignatures] = useState<{ auditor: string; sm: string }>(() => {
    try { return JSON.parse(localStorage.getItem('hr_audit_signatures') || '{"auditor":"","sm":""}'); } catch { return { auditor: '', sm: '' }; }
  });

  const [meta, setMeta] = useState<SurveyMeta>(() => {
    if (editMode && existingSubmission) {
      return {
        auditorName: existingSubmission.auditorName || '',
        auditorId: existingSubmission.auditorId || '',
        storeName: existingSubmission.storeName || '',
        storeId: existingSubmission.storeId || '',
        city: existingSubmission.city || '',
        region: existingSubmission.region || '',
      };
    }
    let stored: any = {};
    try { stored = JSON.parse(localStorage.getItem('hr_audit_meta') || '{}'); } catch {}
    const urlParams = new URLSearchParams(window.location.search);
    return {
      auditorName: urlParams.get('name') || urlParams.get('auditorName') || stored.auditorName || '',
      auditorId: urlParams.get('EMPID') || urlParams.get('auditorId') || stored.auditorId || '',
      storeName: stored.storeName || '',
      storeId: stored.storeId || '',
      city: stored.city || '',
      region: stored.region || '',
    };
  });

  const { employeeData, userRole: authUserRole } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDraftList, setShowDraftList] = useState(false);
  const [drafts, setDrafts] = useState<DraftMetadata[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [highlightedQuestion, setHighlightedQuestion] = useState<string | null>(null);

  const auditorCanvasRef = useRef<HTMLCanvasElement>(null);
  const smCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<{ auditor: boolean; sm: boolean }>({ auditor: false, sm: false });
  const [lastPoint, setLastPoint] = useState<{ auditor: { x: number; y: number } | null; sm: { x: number; y: number } | null }>({ auditor: null, sm: null });

  // Autofill auditor fields
  useEffect(() => {
    if ((authUserRole === 'hr' || authUserRole === 'admin') && employeeData && !meta.auditorId) {
      setMeta(prev => ({ ...prev, auditorId: employeeData.code, auditorName: employeeData.name }));
    }
  }, [authUserRole, employeeData]);

  // Navigation protection
  useEffect(() => {
    const hasProgress = Object.keys(responses).length > 0;
    if (!hasProgress || submitted) return;
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      if (window.confirm('You have unsaved progress. Are you sure you want to leave?')) {
        window.history.back();
      }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { window.removeEventListener('popstate', handlePopState); window.removeEventListener('beforeunload', handleBeforeUnload); };
  }, [Object.keys(responses).length > 0, submitted]);

  // Load drafts
  const loadDraftsFromSheet = async () => {
    if (!HR_AUDIT_ENDPOINT || !meta.auditorId) return;
    setDraftsLoading(true);
    try {
      const url = `${HR_AUDIT_ENDPOINT}?action=getHRAuditDrafts&auditorId=${encodeURIComponent(meta.auditorId)}`;
      const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setDrafts(data.success && data.drafts ? data.drafts : []);
    } catch { setDrafts([]); }
    finally { setDraftsLoading(false); }
  };

  useEffect(() => { loadDraftsFromSheet(); }, [meta.auditorId]);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('hr_audit_resp', JSON.stringify(responses)); }, [responses]);
  useEffect(() => { localStorage.setItem('hr_audit_meta', JSON.stringify(meta)); }, [meta]);
  useEffect(() => { try { localStorage.setItem('hr_audit_remarks', JSON.stringify(questionRemarks)); } catch {} }, [questionRemarks]);
  useEffect(() => { localStorage.setItem('hr_audit_signatures', JSON.stringify(signatures)); }, [signatures]);

  // Compute live scores and update stats
  const scores = calculateHRAuditScores(responses);

  useEffect(() => {
    const totalQuestions = sections.reduce((s, sec) => s + sec.items.length, 0);
    const answered = Object.keys(responses).filter(k => responses[k] !== '').length;
    onStatsUpdate({ completed: answered, total: totalQuestions, score: scores.storeHealth });
  }, [responses, onStatsUpdate]);

  // ── Helpers ─────────────────────────────────────────────────────
  const handleMetaChange = (field: keyof SurveyMeta, value: string) => setMeta(prev => ({ ...prev, [field]: value }));

  const handleResponse = (key: string, value: string) => {
    setResponses(prev => ({ ...prev, [key]: value }));
    hapticFeedback.select();
  };

  // ── Draft management ─────────────────────────────────────────────
  const saveDraft = async () => {
    if (!HR_AUDIT_ENDPOINT) { alert('Endpoint not configured.'); return; }
    if (!meta.auditorId || !meta.auditorName) { alert('Fill in auditor details first.'); return; }
    const draftId = currentDraftId || `hra_draft_${Date.now()}`;
    const totalQ = sections.reduce((s, sec) => s + sec.items.length, 0);
    const answeredQ = Object.keys(responses).filter(k => responses[k] !== '').length;
    const completionPercentage = Math.round((answeredQ / totalQ) * 100);
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'saveHRAuditDraft', draftId,
        auditorId: meta.auditorId, auditorName: meta.auditorName,
        storeName: meta.storeName, storeId: meta.storeId, city: meta.city,
        timestamp: new Date().toLocaleString('en-GB', { hour12: false }),
        completionPercentage: completionPercentage.toString(),
        responsesJSON: JSON.stringify(responses),
        questionRemarksJSON: JSON.stringify(questionRemarks),
        signaturesJSON: JSON.stringify(signatures),
        metaJSON: JSON.stringify(meta),
      });
      const res = await fetch(HR_AUDIT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString(), redirect: 'follow' });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed');
      const dm: DraftMetadata = { id: draftId, timestamp: new Date().toLocaleString('en-GB', { hour12: false }), storeName: meta.storeName || 'Unsaved', auditorName: meta.auditorName, completionPercentage };
      setDrafts(prev => { const idx = prev.findIndex(d => d.id === draftId); if (idx >= 0) { const u = [...prev]; u[idx] = dm; return u; } return [...prev, dm]; });
      setCurrentDraftId(draftId);
      hapticFeedback.success();
      alert('Draft saved!');
    } catch { alert('Failed to save draft.'); }
    finally { setIsLoading(false); }
  };

  const loadDraft = async (draftId: string) => {
    if (!HR_AUDIT_ENDPOINT) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${HR_AUDIT_ENDPOINT}?action=loadHRAuditDraft&draftId=${encodeURIComponent(draftId)}`);
      const data = await res.json();
      if (data.success && data.data?.draft) {
        const d = data.data.draft;
        setResponses(d.responses || {}); setMeta(d.meta || {}); setQuestionRemarks(d.questionRemarks || {});
        setSignatures(d.signatures || { auditor: '', sm: '' }); setCurrentDraftId(draftId); setShowDraftList(false);
        hapticFeedback.success();
      } else alert('Failed to load draft.');
    } catch { alert('Network error loading draft.'); }
    finally { setIsLoading(false); }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Delete this draft?')) return;
    if (!HR_AUDIT_ENDPOINT) return;
    setIsLoading(true);
    try {
      await fetch(HR_AUDIT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ action: 'deleteHRAuditDraft', draftId }).toString(), redirect: 'follow' });
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      if (currentDraftId === draftId) setCurrentDraftId(null);
      hapticFeedback.success();
    } catch { alert('Failed to delete draft.'); }
    finally { setIsLoading(false); }
  };

  const startNewChecklist = () => {
    if (!confirm('Start fresh? Current progress will be lost unless saved as draft.')) return;
    ['hr_audit_resp', 'hr_audit_meta', 'hr_audit_remarks', 'hr_audit_signatures'].forEach(k => localStorage.removeItem(k));
    setResponses({}); setMeta({ auditorName: '', auditorId: '', storeName: '', storeId: '', city: '', region: '' });
    setQuestionRemarks({}); setSignatures({ auditor: '', sm: '' }); setCurrentDraftId(null); setSubmitted(false);
    hapticFeedback.success();
  };

  const autofillForTesting = () => {
    if (!confirm('Fill the entire HR Audit form with test data?')) return;
    setMeta({ auditorName: 'Test HR Auditor', auditorId: 'HR001', storeName: 'Test Store - HSR Layout', storeId: 'STR042', city: 'Bangalore', region: 'South' });
    const testR: SurveyResponse = {};
    sections.forEach(sec => {
      sec.items.forEach(item => {
        const key = `${sec.id}_${item.id}`;
        if (item.type === 'yes_no') testR[key] = Math.random() < 0.5 ? 'Yes' : 'No';
        else if (item.type === 'number') testR[key] = String(Math.floor(Math.random() * 10));
        else if (item.type === 'rating') testR[key] = String(Math.floor(Math.random() * 5) + 1);
        else if (item.type === 'percent') testR[key] = String(Math.floor(Math.random() * 101));
      });
    });
    setResponses(testR);
    alert('HR Audit form autofilled with test data!');
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const required: (keyof SurveyMeta)[] = ['auditorName', 'auditorId', 'storeName'];
    const missing = required.filter(f => !meta[f]);
    if (missing.length) { alert(`Please fill: ${missing.join(', ')}`); return; }

    const totalQ = sections.reduce((s, sec) => s + sec.items.length, 0);
    const answeredQ = Object.keys(responses).filter(k => responses[k] !== '').length;
    if (answeredQ < totalQ) {
      // Find first unanswered
      for (const sec of sections) {
        for (const item of sec.items) {
          const key = `${sec.id}_${item.id}`;
          if (!responses[key] || responses[key] === '') {
            setActiveSection(sec.id);
            requestAnimationFrame(() => setTimeout(() => {
              const el = document.getElementById(`q_${key}`);
              if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHighlightedQuestion(key); setTimeout(() => setHighlightedQuestion(null), 3000); }
            }, 100));
            alert(`Please answer all questions. ${answeredQ}/${totalQ} completed.`);
            return;
          }
        }
      }
    }

    setIsLoading(true);
    try {
      const submitParams: Record<string, string> = {
        submissionTime: editMode && existingSubmission?.submissionTime ? existingSubmission.submissionTime : new Date().toLocaleString('en-GB', { hour12: false }),
        auditorName: meta.auditorName, auditorId: meta.auditorId,
        storeName: meta.storeName, storeID: meta.storeId, city: meta.city, region: meta.region,
        auditorSignature: signatures.auditor, smSignature: signatures.sm,
        action: editMode ? 'update' : 'createHRAudit',
        rowId: editMode && existingSubmission?.submissionTime ? String(existingSubmission.submissionTime) : '',
        ...responses,
        ...Object.fromEntries(Object.entries(questionRemarks).map(([k, v]) => [`${k}_remark`, String(v)])),
        questionRemarksJSON: JSON.stringify(questionRemarks),
        responsesJSON: JSON.stringify(responses),
      };

      const bodyString = new URLSearchParams(submitParams).toString();
      const TIMEOUT = 90000;
      const MAX_RETRIES = 2;
      let retries = 0;
      let didSubmit = false;

      while (!didSubmit && retries <= MAX_RETRIES) {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), TIMEOUT);
        try {
          const res = await fetch(HR_AUDIT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: bodyString, redirect: 'follow', signal: controller.signal });
          clearTimeout(tid);
          const result = await res.json();
          if (result.success || result.status === 'success') { didSubmit = true; } else { retries++; }
        } catch (err: any) {
          clearTimeout(tid);
          if (err.name === 'AbortError') { didSubmit = true; } else { retries++; if (retries <= MAX_RETRIES) await new Promise(r => setTimeout(r, retries * 3000)); }
        }
      }

      if (!didSubmit) { alert('Failed to submit. Check your connection.'); setIsLoading(false); return; }

      if (currentDraftId) { setDrafts(prev => prev.filter(d => d.id !== currentDraftId)); setCurrentDraftId(null); }
      ['hr_audit_resp', 'hr_audit_meta', 'hr_audit_remarks', 'hr_audit_signatures'].forEach(k => localStorage.removeItem(k));
      setSubmitted(true);
      if (editMode) { alert('HR Audit updated!'); setTimeout(() => window.location.reload(), 500); }
    } catch { alert('Error submitting. Try again.'); }
    finally { setIsLoading(false); }
  };

  // ── Signature drawing ────────────────────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'auditor' | 'sm') => {
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(prev => ({ ...prev, [type]: true }));
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    const x = ('touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left) * scaleX;
    const y = ('touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top) * scaleY;
    setLastPoint(prev => ({ ...prev, [type]: { x, y } }));
    ctx.beginPath(); ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'auditor' | 'sm') => {
    if (!isDrawing[type]) return;
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    const cx = ('touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left) * scaleX;
    const cy = ('touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top) * scaleY;
    const last = lastPoint[type];
    if (!last) { setLastPoint(prev => ({ ...prev, [type]: { x: cx, y: cy } })); return; }
    const mx = (last.x + cx) / 2; const my = (last.y + cy) / 2;
    ctx.quadraticCurveTo(last.x, last.y, mx, my);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx, my);
    setLastPoint(prev => ({ ...prev, [type]: { x: cx, y: cy } }));
  };

  const stopDrawing = (type: 'auditor' | 'sm') => {
    setIsDrawing(prev => ({ ...prev, [type]: false }));
    setLastPoint(prev => ({ ...prev, [type]: null }));
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (ctx) ctx.closePath();
    setSignatures(prev => ({ ...prev, [type]: canvas.toDataURL('image/png', 1.0) }));
  };

  const clearSignature = (type: 'auditor' | 'sm') => {
    const canvas = type === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setLastPoint(prev => ({ ...prev, [type]: null }));
    setSignatures(prev => ({ ...prev, [type]: '' }));
  };

  useEffect(() => {
    const loadSig = (sig: string, ref: React.RefObject<HTMLCanvasElement | null>) => {
      if (sig && ref.current) {
        const ctx = ref.current.getContext('2d');
        if (ctx) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = sig; }
      }
    };
    loadSig(signatures.auditor, auditorCanvasRef);
    loadSig(signatures.sm, smCanvasRef);
  }, []);

  const resetSurvey = () => {
    if (!confirm('Reset the HR Audit? All responses will be lost.')) return;
    ['hr_audit_resp', 'hr_audit_meta', 'hr_audit_remarks', 'hr_audit_signatures'].forEach(k => localStorage.removeItem(k));
    setResponses({}); setMeta({ auditorName: '', auditorId: '', storeName: '', storeId: '', city: '', region: '' });
    setQuestionRemarks({}); setSignatures({ auditor: '', sm: '' }); setSubmitted(false);
  };

  // ── Question input renderer ──────────────────────────────────────
  const renderInput = (section: HRSection, item: HRQuestion) => {
    const key = `${section.id}_${item.id}`;
    const value = responses[key] || '';

    switch (item.type) {
      case 'yes_no':
        return (
          <div className="flex gap-3">
            {['Yes', 'No'].map(opt => (
              <button key={opt} onClick={() => handleResponse(key, opt)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                  value === opt
                    ? opt === 'Yes' ? 'bg-green-600 text-white shadow-md' : 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}>
                {opt === 'Yes' ? '✅' : '❌'} {opt}
              </button>
            ))}
          </div>
        );

      case 'number':
        return (
          <div className="flex items-center gap-3">
            <button onClick={() => { const n = Math.max(0, parseInt(value || '0') - 1); handleResponse(key, String(n)); }}
              className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center">
              −
            </button>
            <input type="number" min="0" value={value} onChange={e => handleResponse(key, e.target.value)}
              className="w-24 h-10 text-center text-lg font-semibold border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => { const n = parseInt(value || '0') + 1; handleResponse(key, String(n)); }}
              className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center">
              +
            </button>
          </div>
        );

      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => handleResponse(key, String(n))}
                className={`w-12 h-12 rounded-xl text-lg font-bold transition-all ${
                  parseInt(value) === n
                    ? n <= 2 ? 'bg-red-500 text-white shadow-md scale-110' : n === 3 ? 'bg-yellow-500 text-white shadow-md scale-110' : 'bg-green-500 text-white shadow-md scale-110'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}>
                {n}
              </button>
            ))}
            {value && <span className="ml-2 text-sm text-gray-500 dark:text-slate-400 self-center">
              {parseInt(value) <= 2 ? 'Low' : parseInt(value) === 3 ? 'Average' : parseInt(value) === 4 ? 'Good' : 'Excellent'}
            </span>}
          </div>
        );

      case 'percent':
        return (
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="100" value={value || '0'} onChange={e => handleResponse(key, e.target.value)}
              className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <input type="number" min="0" max="100" value={value || '0'} onChange={e => handleResponse(key, e.target.value)}
              className="w-20 h-10 text-center font-semibold border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
            <span className="text-sm text-gray-500 dark:text-slate-400">%</span>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Submitted state ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">HR Audit Submitted!</h2>
            <p className="text-green-700 dark:text-green-400 mb-4">Store Health Score: <span className="font-bold text-3xl">{scores.storeHealth}</span>/100</p>
            {scores.riskAlerts.length > 0 && (
              <div className="mt-4 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Risk Alerts</h3>
                {scores.riskAlerts.map((a, i) => <p key={i} className="text-sm text-red-700 dark:text-red-400">{a}</p>)}
              </div>
            )}
            <button onClick={resetSurvey} className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
              Take Another Audit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {isLoading && <LoadingOverlay />}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">🏥 Store HR Health Audit</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
              Predictive HR health assessment — 5 dimensions, 28 observation points. Scores computed in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => { setShowDraftList(!showDraftList); if (!showDraftList) loadDraftsFromSheet(); }} disabled={draftsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium whitespace-nowrap">
              📋 {draftsLoading ? 'Loading...' : `Drafts ${drafts.length > 0 ? `(${drafts.length})` : ''}`}
            </button>
            <button onClick={saveDraft} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium whitespace-nowrap">💾 Save Draft</button>
            <button onClick={startNewChecklist} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium whitespace-nowrap">➕ New</button>
          </div>
        </div>
        {currentDraftId && (
          <div className="mt-3 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md text-sm text-blue-800 dark:text-blue-200">
            📝 Currently editing draft from {drafts.find(d => d.id === currentDraftId)?.timestamp || 'Unknown'}
          </div>
        )}
      </div>

      {/* Live Score Banner */}
      {Object.keys(responses).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Live Scores</h3>
            <div className={`text-2xl font-bold ${scores.storeHealth >= 80 ? 'text-green-600' : scores.storeHealth >= 60 ? 'text-yellow-600' : scores.storeHealth >= 40 ? 'text-orange-600' : 'text-red-600'}`}>
              Store Health: {scores.storeHealth}/100
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[scores.attritionRisk, scores.capability, scores.culture, scores.engagement, scores.pressure].map(s => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                <div className="text-xs text-gray-500 dark:text-slate-400">{s.label}</div>
                <div className={`text-lg font-bold ${RISK_COLORS[s.riskLevel].split(' ').find(c => c.startsWith('text-'))}`}>{s.score}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[s.riskLevel]}`}>{s.riskLevel}</span>
              </div>
            ))}
          </div>
          {scores.riskAlerts.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {scores.riskAlerts.map((a, i) => <p key={i} className="text-sm text-red-700 dark:text-red-400">{a}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Draft List */}
      {showDraftList && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">📋 Saved Drafts</h2>
            <button onClick={() => setShowDraftList(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">✕</button>
          </div>
          {draftsLoading ? (
            <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : drafts.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-slate-400">No saved drafts</p>
          ) : (
            <div className="space-y-3">
              {drafts.map(draft => (
                <div key={draft.id} className={`p-4 border rounded-lg ${currentDraftId === draft.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-slate-600'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100">{draft.storeName}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Auditor: {draft.auditorName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{draft.timestamp}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${draft.completionPercentage}%` }} />
                        </div>
                        <span className="text-xs font-medium">{draft.completionPercentage}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadDraft(draft.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">Load</button>
                      <button onClick={() => deleteDraft(draft.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Information */}
      <div id="hr-audit-information" className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Audit Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Auditor Name *', field: 'auditorName' as keyof SurveyMeta, placeholder: 'Enter auditor name' },
            { label: 'Auditor ID *', field: 'auditorId' as keyof SurveyMeta, placeholder: 'Enter auditor ID' },
            { label: 'Store Name *', field: 'storeName' as keyof SurveyMeta, placeholder: 'Enter store name' },
            { label: 'Store ID', field: 'storeId' as keyof SurveyMeta, placeholder: 'Enter store ID' },
            { label: 'Region', field: 'region' as keyof SurveyMeta, placeholder: 'Enter region' },
            { label: 'City', field: 'city' as keyof SurveyMeta, placeholder: 'Enter city' },
          ].map(f => (
            <div key={f.field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{f.label}</label>
              <input type="text" value={meta[f.field]} onChange={e => handleMetaChange(f.field, e.target.value)} placeholder={f.placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
            </div>
          ))}
        </div>
      </div>

      {/* HR Audit Sections */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">HR Health Assessment</h2>

        {activeSection === null ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">Select a dimension to begin the assessment.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map(section => {
                const answered = section.items.filter(item => {
                  const k = `${section.id}_${item.id}`;
                  return responses[k] && responses[k] !== '';
                }).length;
                const total = section.items.length;
                const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
                const isComplete = answered === total;
                const sectionScore = scores[
                  section.id === 'AttritionRisk' ? 'attritionRisk' : section.id === 'Capability' ? 'capability' : section.id === 'Culture' ? 'culture' : section.id === 'Engagement' ? 'engagement' : 'pressure'
                ] as { score: number; riskLevel: string };

                return (
                  <button key={section.id} onClick={() => { setActiveSection(section.id); hapticFeedback.select(); }}
                    className={`text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                      isComplete ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : answered > 0 ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
                    }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{SECTION_EMOJIS[section.id] || section.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm sm:text-base">{section.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{total} questions</p>
                      </div>
                      {isComplete && <span className="text-lg">✅</span>}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mb-2">
                      <div className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : answered > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-slate-400">{answered}/{total} ({pct}%)</span>
                      {answered > 0 && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_COLORS[sectionScore.riskLevel]}`}>Score: {sectionScore.score}</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Overall progress */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Overall Progress</span>
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  {Object.keys(responses).filter(k => responses[k] !== '').length} / {sections.reduce((s, sec) => s + sec.items.length, 0)} questions
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.round((Object.keys(responses).filter(k => responses[k] !== '').length / Math.max(1, sections.reduce((s, sec) => s + sec.items.length, 0))) * 100)}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Section nav */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-slate-600">
              <button onClick={() => { setActiveSection(null); hapticFeedback.select(); }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                ← All Dimensions
              </button>
              <div className="flex gap-2">
                {(() => {
                  const idx = sections.findIndex(s => s.id === activeSection);
                  return (
                    <>
                      <button disabled={idx <= 0} onClick={() => { if (idx > 0) { setActiveSection(sections[idx - 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40">← Prev</button>
                      <button disabled={idx >= sections.length - 1} onClick={() => { if (idx < sections.length - 1) { setActiveSection(sections[idx + 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40">Next →</button>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Questions */}
            {sections.filter(s => s.id === activeSection).map(section => {
              const answered = section.items.filter(item => responses[`${section.id}_${item.id}`] && responses[`${section.id}_${item.id}`] !== '').length;
              return (
                <div key={section.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {SECTION_EMOJIS[section.id]} {section.title}
                    </h3>
                    <span className="text-xs font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {answered}/{section.items.length} answered
                    </span>
                  </div>

                  <div className="space-y-4">
                    {section.items.map((item, idx) => {
                      const key = `${section.id}_${item.id}`;
                      const isHighlighted = highlightedQuestion === key;
                      const serial = `${section.id.charAt(0)}${section.id.charAt(section.id.length > 8 ? section.id.indexOf('R') + 1 : 1) || ''}-${idx + 1}`;

                      return (
                        <div key={item.id} id={`q_${key}`}
                          className={`p-3 sm:p-4 border rounded-lg transition-all ${isHighlighted ? 'border-red-500 ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                          <div className="flex items-start gap-2 sm:gap-3 mb-3">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-slate-100 leading-relaxed">{item.q}</p>
                              {item.hint && <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 italic">{item.hint}</p>}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              item.type === 'yes_no' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                              : item.type === 'number' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : item.type === 'rating' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                            }`}>
                              {item.type === 'yes_no' ? 'Yes/No' : item.type === 'number' ? 'Count' : item.type === 'rating' ? 'Rating 1-5' : '0-100%'}
                            </span>
                          </div>

                          <div className="pl-0 sm:pl-10 mb-3">
                            {renderInput(section, item)}
                          </div>

                          {/* Remarks */}
                          <div className="pl-0 sm:pl-10">
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">💬 Comments</label>
                            <textarea value={questionRemarks[key] || ''} onChange={e => setQuestionRemarks(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder="Add observations or notes..." rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Section footer */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-600">
                    <button onClick={() => { setActiveSection(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600">
                      ← Back to Dimensions
                    </button>
                    {(() => {
                      const idx = sections.findIndex(s => s.id === activeSection);
                      if (idx < sections.length - 1) {
                        return (
                          <button onClick={() => { setActiveSection(sections[idx + 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                            Next: {sections[idx + 1].title} →
                          </button>
                        );
                      }
                      return <span className="text-sm text-green-600 dark:text-green-400 font-medium">✅ Last dimension</span>;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">Signatures</h2>
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
          {(['auditor', 'sm'] as const).map(type => (
            <div key={type} className="space-y-3">
              <label className="block text-base sm:text-sm font-medium text-gray-700 dark:text-slate-300">
                {type === 'auditor' ? 'Auditor Signature *' : 'Store Manager Signature *'}
              </label>
              <div className="border-3 border-gray-400 dark:border-slate-500 rounded-xl bg-white p-1 shadow-inner">
                <canvas ref={type === 'auditor' ? auditorCanvasRef : smCanvasRef} width={800} height={300}
                  onMouseDown={e => startDrawing(e, type)} onMouseMove={e => draw(e, type)} onMouseUp={() => stopDrawing(type)} onMouseLeave={() => stopDrawing(type)}
                  onTouchStart={e => { e.preventDefault(); startDrawing(e, type); }} onTouchMove={e => { e.preventDefault(); draw(e, type); }} onTouchEnd={e => { e.preventDefault(); stopDrawing(type); }}
                  className="w-full h-auto touch-none rounded-lg" style={{ touchAction: 'none', cursor: 'crosshair' }} />
              </div>
              <button onClick={() => clearSignature(type)}
                className="w-full px-4 py-3 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0">
                🗑️ Clear Signature
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row gap-3 order-2 sm:order-1">
          <button onClick={resetSurvey} className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium min-h-[48px]">Reset</button>
          <button onClick={autofillForTesting} className="px-6 py-3 btn-primary-gradient text-white rounded-lg font-medium min-h-[48px]">🧪 Autofill Test Data</button>
        </div>
        <button onClick={handleSubmit} disabled={isLoading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium order-1 sm:order-2 min-h-[52px] text-base">
          {isLoading ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? '🔄 Update Audit' : '📤 Submit HR Audit')}
        </button>
      </div>
    </div>
  );
};

export default HRAuditChecklist;
