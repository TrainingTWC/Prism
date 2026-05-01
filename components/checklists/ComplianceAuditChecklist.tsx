import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../../roleMapping';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { QA_SECTIONS } from '../../config/qaQuestions';
import ImageEditor from '../ImageEditor';
import { compressImage, imageMapByteSize } from '../../utils/imageCompression';

export type ComplianceAuditType = 'cf-audit' | 'vehicle-audit';

const CF_AUDIT_ENDPOINT     = import.meta.env.VITE_CF_AUDIT_SCRIPT_URL     || '';
const VEHICLE_AUDIT_ENDPOINT = import.meta.env.VITE_VEHICLE_AUDIT_SCRIPT_URL || '';

function parseBlobField<T extends object>(...candidates: unknown[]): T {
  for (const v of candidates) {
    if (v == null || v === '') continue;
    if (typeof v === 'object') return v as T;
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        if (parsed && typeof parsed === 'object') return parsed as T;
      } catch { /* try next */ }
    }
  }
  return {} as T;
}

const AUDIT_CONFIG = {
  'cf-audit': {
    title: 'CF Audit Checklist (Food Safety)',
    emoji: '🍽️',
    color: 'green',
    lsPrefix: 'cf_audit',
    sectionId: 'CF',
    subsection: 'CF Audit Checklist (Food Safety)',
    formType: 'cf-audit',
    metaLabel: 'Outlet / CF Name',
    locationLabel: 'CF Location / Address',
  },
  'vehicle-audit': {
    title: 'Vehicle Audit Checklist',
    emoji: '🚚',
    color: 'blue',
    lsPrefix: 'vehicle_audit',
    sectionId: 'VA',
    subsection: 'Vehicle Audit Checklist',
    formType: 'vehicle-audit',
    metaLabel: 'Vehicle Number',
    locationLabel: 'Driver Name',
  },
} as const;

interface SurveyResponse {
  [key: string]: string;
}

interface Meta {
  auditorName: string;
  auditorId: string;
  subjectName: string;   // outlet name or vehicle number
  subjectId: string;     // store ID or driver name
  city: string;
  region: string;
}

export interface ComplianceAuditChecklistProps {
  auditType: ComplianceAuditType;
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  editMode?: boolean;
  existingSubmission?: any;
}

const ComplianceAuditChecklist: React.FC<ComplianceAuditChecklistProps> = ({
  auditType,
  userRole,
  onStatsUpdate,
  editMode = false,
  existingSubmission,
}) => {
  const cfg = AUDIT_CONFIG[auditType];
  const { user } = useAuth();
  const { config } = useConfig();

  // Pull questions that belong to this audit type from the QA_SECTIONS 'A' section
  const qaSection = QA_SECTIONS.find(s => s.id === 'A')!;
  const items = qaSection.items.filter((i: any) => i.subsection === cfg.subsection);
  const options = ['compliant', 'partially-compliant', 'not-compliant', 'na'];

  // ── State ────────────────────────────────────────────────────────────────
  const [responses, setResponses] = useState<SurveyResponse>(() => {
    if (editMode && existingSubmission) return existingSubmission.responses || {};
    try { return JSON.parse(localStorage.getItem(`${cfg.lsPrefix}_resp`) || '{}'); } catch { return {}; }
  });

  const [questionImages, setQuestionImages] = useState<Record<string, string[]>>(() => {
    if (editMode && existingSubmission) {
      const fromBlob = parseBlobField<Record<string, string[]>>(existingSubmission.questionImagesJSON);
      if (Object.keys(fromBlob).length > 0) return fromBlob;
    }
    try { return JSON.parse(localStorage.getItem(`${cfg.lsPrefix}_images`) || '{}'); } catch { return {}; }
  });

  const [questionRemarks, setQuestionRemarks] = useState<Record<string, string>>(() => {
    if (editMode && existingSubmission) {
      return parseBlobField<Record<string, string>>(existingSubmission.questionRemarksJSON);
    }
    try { return JSON.parse(localStorage.getItem(`${cfg.lsPrefix}_remarks`) || '{}'); } catch { return {}; }
  });

  const [meta, setMeta] = useState<Meta>(() => {
    if (editMode && existingSubmission) {
      return {
        auditorName: existingSubmission.auditorName || '',
        auditorId: existingSubmission.auditorId || '',
        subjectName: existingSubmission.subjectName || '',
        subjectId: existingSubmission.subjectId || '',
        city: existingSubmission.city || '',
        region: existingSubmission.region || '',
      };
    }
    try {
      const stored = JSON.parse(localStorage.getItem(`${cfg.lsPrefix}_meta`) || '{}');
      return {
        auditorName: stored.auditorName || user?.name || '',
        auditorId: stored.auditorId || user?.empId || '',
        subjectName: stored.subjectName || '',
        subjectId: stored.subjectId || '',
        city: stored.city || '',
        region: stored.region || '',
      };
    } catch {
      return { auditorName: user?.name || '', auditorId: user?.empId || '', subjectName: '', subjectId: '', city: '', region: '' };
    }
  });

  const [signatures, setSignatures] = useState<{ auditor: string; sm: string }>({ auditor: '', sm: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [highlightedQuestion, setHighlightedQuestion] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<{ questionId: string; imageIndex: number; imageData: string } | null>(null);

  const auditorCanvasRef = useRef<HTMLCanvasElement>(null);
  const smCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<{ active: boolean; lastX: number; lastY: number; target: 'auditor' | 'sm' | null }>({ active: false, lastX: 0, lastY: 0, target: null });

  // ── Persist to localStorage ───────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(`${cfg.lsPrefix}_resp`, JSON.stringify(responses)); } catch { /* ignore */ }
  }, [responses, cfg.lsPrefix]);

  useEffect(() => {
    try { localStorage.setItem(`${cfg.lsPrefix}_images`, JSON.stringify(questionImages)); } catch { /* ignore */ }
  }, [questionImages, cfg.lsPrefix]);

  useEffect(() => {
    try { localStorage.setItem(`${cfg.lsPrefix}_meta`, JSON.stringify(meta)); } catch { /* ignore */ }
  }, [meta, cfg.lsPrefix]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const answered = items.filter(item => {
      return responses[item.id] && responses[item.id] !== '';
    }).length;
    let score = 0;
    items.forEach(item => {
      const resp = responses[item.id];
      if (!resp || resp === 'na') return;
      if (resp === 'compliant') score += item.w;
      else if (resp === 'partially-compliant') score += Math.floor(item.w / 2);
    });
    onStatsUpdate({ completed: answered, total: items.length, score });
  }, [responses, items, onStatsUpdate]);

  // ── Drawing ───────────────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent, target: 'auditor' | 'sm') => {
    const canvas = target === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    drawingRef.current = { active: true, lastX: pos.x, lastY: pos.y, target };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent, target: 'auditor' | 'sm') => {
    if (!drawingRef.current.active || drawingRef.current.target !== target) return;
    const canvas = target === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(drawingRef.current.lastX, drawingRef.current.lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    drawingRef.current.lastX = pos.x;
    drawingRef.current.lastY = pos.y;
  };

  const stopDrawing = (target: 'auditor' | 'sm') => {
    if (drawingRef.current.target !== target) return;
    drawingRef.current.active = false;
    const canvas = target === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (canvas) setSignatures(prev => ({ ...prev, [target]: canvas.toDataURL() }));
  };

  const clearSignature = (target: 'auditor' | 'sm') => {
    const canvas = target === 'auditor' ? auditorCanvasRef.current : smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
    setSignatures(prev => ({ ...prev, [target]: '' }));
  };

  // ── Image handling ────────────────────────────────────────────────────────
  const handleImageUpload = async (questionId: string, files: FileList) => {
    const compressed: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try { compressed.push(await compressImage(files[i])); } catch { /* skip */ }
    }
    setQuestionImages(prev => ({ ...prev, [questionId]: [...(prev[questionId] || []), ...compressed] }));
  };

  const removeImage = (questionId: string, idx: number) => {
    setQuestionImages(prev => {
      const updated = [...(prev[questionId] || [])];
      updated.splice(idx, 1);
      return { ...prev, [questionId]: updated };
    });
  };

  // ── Response handler ──────────────────────────────────────────────────────
  const handleResponse = (key: string, value: string) => {
    setResponses(prev => ({ ...prev, [key]: value }));
    hapticFeedback.select();
    if (highlightedQuestion === key) setHighlightedQuestion(null);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!meta.auditorName.trim()) { alert('Please enter Auditor Name.'); return false; }
    if (!meta.subjectName.trim()) { alert(`Please enter ${cfg.metaLabel}.`); return false; }

    const unanswered = items.filter(item => {
      return !responses[item.id] || responses[item.id] === '';
    });
    if (unanswered.length > 0) {
      const firstKey = unanswered[0].id;
      setHighlightedQuestion(firstKey);
      const el = document.getElementById(`q_${firstKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return false;
    }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    if (!confirm(`Submit this ${cfg.title}? This cannot be undone.`)) return;

    setIsLoading(true);
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const submissionTime = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      let totalScore = 0, maxScore = 0;
      items.forEach(item => {
        const resp = responses[item.id];
        if (!resp || resp === 'na') return;
        maxScore += item.w;
        if (resp === 'compliant') totalScore += item.w;
        else if (resp === 'partially-compliant') totalScore += Math.floor(item.w / 2);
      });
      const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      const params: Record<string, string> = {
        formType: cfg.formType,
        submissionTime,
        auditorName: meta.auditorName,
        auditorId: meta.auditorId,
        subjectName: meta.subjectName,
        subjectId: meta.subjectId,
        city: meta.city,
        region: meta.region,
        totalScore: String(totalScore),
        maxScore: String(maxScore),
        scorePercentage: String(scorePercentage),
        auditorSignature: signatures.auditor || '',
        smSignature: signatures.sm || '',
        action: editMode ? 'update' : 'create',
        rowId: editMode && existingSubmission?.submissionTime ? String(existingSubmission.submissionTime) : '',
        ...Object.fromEntries(Object.entries(responses).map(([k, v]) => [k, String(v)])),
        ...Object.fromEntries(Object.entries(questionRemarks).map(([k, v]) => [`${k}_remark`, String(v)])),
        ...Object.fromEntries(Object.entries(questionImages).map(([k, v]) => [`${k}_imageCount`, String(v.length)])),
        questionRemarksJSON: JSON.stringify(questionRemarks),
      };

      const imagesJSON = JSON.stringify(questionImages);
      if (imagesJSON.length < 500000) {
        params.questionImagesJSON = imagesJSON;
      }

      const endpoint = cfg.formType === 'cf-audit' ? CF_AUDIT_ENDPOINT : VEHICLE_AUDIT_ENDPOINT;
      if (!endpoint) {
        alert('Submission endpoint not configured. Please contact your administrator.');
        return;
      }

      const bodyString = new URLSearchParams(params).toString();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyString,
      });

      const result = await response.json();
      if (result.status === 'success' || result.success) {
        // Clear localStorage
        localStorage.removeItem(`${cfg.lsPrefix}_resp`);
        localStorage.removeItem(`${cfg.lsPrefix}_images`);
        localStorage.removeItem(`${cfg.lsPrefix}_remarks`);
        localStorage.removeItem(`${cfg.lsPrefix}_meta`);
        setSubmitted(true);
      } else {
        alert('Submission failed: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const colorMap = {
    green: { border: 'border-green-200 dark:border-green-800', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-300', badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', radio: 'text-green-600' },
    blue: { border: 'border-blue-200 dark:border-blue-800', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-300', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', radio: 'text-blue-600' },
  };
  const c = colorMap[cfg.color];

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className={`${c.bg} border ${c.border} rounded-lg p-8`}>
            <div className={`${c.text} text-6xl mb-4`}>✅</div>
            <h2 className={`text-2xl font-bold ${c.text} mb-2`}>{cfg.title} Submitted!</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Your audit has been recorded successfully.</p>
            <button
              onClick={() => {
                setSubmitted(false);
                setResponses({});
                setQuestionImages({});
                setQuestionRemarks({});
                setMeta({ auditorName: user?.name || '', auditorId: user?.empId || '', subjectName: '', subjectId: '', city: '', region: '' });
                clearSignature('auditor');
                clearSignature('sm');
              }}
              className={`px-6 py-3 rounded-lg font-medium text-white ${cfg.color === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
            >
              Start Another Audit
            </button>
          </div>
        </div>
      </div>
    );
  }

    const answered = items.filter(item => {
      return responses[item.id] && responses[item.id] !== '';
    }).length;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {isLoading && <LoadingOverlay />}

      {/* ImageEditor modal */}
      {editingImage && (
        <ImageEditor
          imageData={editingImage.imageData}
          onSave={(editedData) => {
            setQuestionImages(prev => {
              const updated = [...(prev[editingImage.questionId] || [])];
              updated[editingImage.imageIndex] = editedData;
              return { ...prev, [editingImage.questionId]: updated };
            });
            setEditingImage(null);
          }}
          onClose={() => setEditingImage(null)}
        />
      )}

      {/* Header */}
      <div className={`${c.bg} rounded-lg p-4 sm:p-6 border ${c.border}`}>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">
          {cfg.emoji} {cfg.title}
        </h1>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Compliance audit — {items.length} questions &middot; Max {items.reduce((s, i) => s + i.w, 0)} pts
        </p>
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${answered === items.length ? 'bg-green-500' : answered > 0 ? (cfg.color === 'green' ? 'bg-green-400' : 'bg-blue-400') : 'bg-gray-300'}`}
              style={{ width: `${items.length > 0 ? Math.round((answered / items.length) * 100) : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{answered}/{items.length} answered</p>
        </div>
      </div>

      {/* Meta fields */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Audit Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Auditor Name *</label>
            <input type="text" value={meta.auditorName} onChange={e => setMeta(p => ({ ...p, auditorName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Auditor ID</label>
            <input type="text" value={meta.auditorId} onChange={e => setMeta(p => ({ ...p, auditorId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{cfg.metaLabel} *</label>
            <input type="text" value={meta.subjectName} onChange={e => setMeta(p => ({ ...p, subjectName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{cfg.locationLabel}</label>
            <input type="text" value={meta.subjectId} onChange={e => setMeta(p => ({ ...p, subjectId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">City</label>
            <input type="text" value={meta.city} onChange={e => setMeta(p => ({ ...p, city: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Region</label>
            <input type="text" value={meta.region} onChange={e => setMeta(p => ({ ...p, region: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Checklist Questions
          <span className={`ml-3 text-xs font-medium px-3 py-1 ${c.badge} rounded-full`}>
            {answered}/{items.length} answered
          </span>
        </h2>
        <div className="space-y-4">
          {items.map((item, idx) => {
            const qKey = item.id;
            const isHighlighted = highlightedQuestion === qKey;
            const serial = `${cfg.sectionId}-${idx + 1}`;
            return (
              <div
                key={item.id}
                id={`q_${qKey}`}
                className={`p-3 sm:p-4 border rounded-lg transition-all duration-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                  isHighlighted ? 'border-red-500 ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3 mb-3">
                  <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 ${c.badge} rounded-md text-xs font-bold flex-shrink-0`}>
                    {serial}
                  </span>
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-slate-100 leading-relaxed flex-1">
                    {item.q}
                  </p>
                </div>

                {/* Response options */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-3 pl-0 sm:pl-14">
                  {options.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer p-2 sm:p-0 rounded hover:bg-gray-100 dark:hover:bg-slate-700 sm:hover:bg-transparent transition-colors min-h-[44px] sm:min-h-0">
                      <input
                        type="radio"
                        name={qKey}
                        value={opt}
                        checked={responses[qKey] === opt}
                        onChange={() => handleResponse(qKey, opt)}
                        className={`w-5 h-5 sm:w-4 sm:h-4 ${c.radio} border-gray-300 focus:ring-2 flex-shrink-0`}
                      />
                      <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                        {opt === 'compliant' ? 'Compliance' :
                          opt === 'partially-compliant' ? 'Partial Compliance' :
                            opt === 'not-compliant' ? 'Non-Compliance' : 'N/A'}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Image upload */}
                <div className="pl-0 sm:pl-14 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg cursor-pointer text-sm font-medium transition-colors min-h-[48px] sm:min-h-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      📷 Camera
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => { if (e.target.files?.length) handleImageUpload(qKey, e.target.files); e.target.value = ''; }} />
                    </label>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg cursor-pointer text-sm font-medium transition-colors min-h-[48px] sm:min-h-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      🖼️ Gallery
                      <input type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { if (e.target.files?.length) handleImageUpload(qKey, e.target.files); e.target.value = ''; }} />
                    </label>
                  </div>

                  {questionImages[qKey]?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {questionImages[qKey].map((img, imgIdx) => (
                        <div key={imgIdx} className="relative">
                          <img src={img} alt={`Upload ${imgIdx + 1}`} className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-slate-600" />
                          <button type="button" onClick={() => setEditingImage({ questionId: qKey, imageIndex: imgIdx, imageData: img })}
                            className="absolute top-2 left-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button type="button" onClick={() => removeImage(qKey, imgIdx)}
                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                            {imgIdx + 1} of {questionImages[qKey].length}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                      💬 Comments / NC Description for {serial}
                    </label>
                    <textarea
                      value={questionRemarks[qKey] || ''}
                      onChange={e => setQuestionRemarks(prev => ({ ...prev, [qKey]: e.target.value }))}
                      placeholder="Add comments or describe non-compliance..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signatures */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Signatures</h2>
        <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          {(['auditor', 'sm'] as const).map(target => (
            <div key={target} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                {target === 'auditor' ? 'Auditor Signature *' : 'Auditee Signature'}
              </label>
              <div className="border-2 border-gray-400 dark:border-slate-500 rounded-xl bg-white p-1 shadow-inner">
                <canvas
                  ref={target === 'auditor' ? auditorCanvasRef : smCanvasRef}
                  width={800} height={200}
                  onMouseDown={e => startDrawing(e, target)}
                  onMouseMove={e => draw(e, target)}
                  onMouseUp={() => stopDrawing(target)}
                  onMouseLeave={() => stopDrawing(target)}
                  onTouchStart={e => { e.preventDefault(); startDrawing(e, target); }}
                  onTouchMove={e => { e.preventDefault(); draw(e, target); }}
                  onTouchEnd={e => { e.preventDefault(); stopDrawing(target); }}
                  className="w-full h-auto touch-none rounded-lg"
                  style={{ touchAction: 'none', cursor: 'crosshair', WebkitUserSelect: 'none', userSelect: 'none' }}
                />
              </div>
              <button type="button" onClick={() => clearSignature(target)}
                className="w-full px-4 py-3 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {answered === items.length
                ? '✅ All questions answered — ready to submit!'
                : `⚠️ ${items.length - answered} question(s) remaining`}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || answered < items.length}
          className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all ${
            answered === items.length
              ? cfg.color === 'green'
                ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Submitting…' : `Submit ${cfg.title}`}
        </button>
      </div>
    </div>
  );
};

export default ComplianceAuditChecklist;
