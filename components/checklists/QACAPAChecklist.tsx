import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../../roleMapping';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, Store, Calendar, RefreshCw, FileText, Sparkles, Camera, Upload, X, User } from 'lucide-react';
import LoadingOverlay from '../LoadingOverlay';
import { fetchCAPAs, updateCAPA, CAPARecord, QAFinding, generateAICAPA, generateBatchAICAPA, generateInstantCAPA, resolveStoreManagement } from '../../services/qaCapaService';
import { EmployeeRow } from '../../services/employeeDirectoryService';
import { QUESTION_MAP } from '../../config/qaQuestions';

interface QACAPAChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

/** Normalize legacy single-field findings to the new multi-action format */
function normalizeFindings(findings: QAFinding[]): QAFinding[] {
  return findings.map(f => ({
    ...f,
    question: f.question || QUESTION_MAP[f.questionId] || f.questionId,
    correctiveActions: f.correctiveActions?.length
      ? f.correctiveActions
      : f.correctiveAction ? [f.correctiveAction, '', ''] : ['', '', ''],
    preventiveActions: f.preventiveActions?.length
      ? f.preventiveActions
      : f.preventiveAction ? [f.preventiveAction, '', ''] : ['', '', ''],
    imageProofs: f.imageProofs || [],
    stakeholder: f.stakeholder || undefined,
  }));
}

/** Compress an image to max dimensions before converting to base64 */
function compressImage(file: File, maxDim = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const QACAPAChecklist: React.FC<QACAPAChecklistProps> = ({ userRole, onStatsUpdate }) => {
  const { employeeData, userRole: authRole } = useAuth();
  const [capas, setCAPAs] = useState<CAPARecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCAPA, setExpandedCAPA] = useState<number | null>(null);
  const [editingFindings, setEditingFindings] = useState<Record<number, QAFinding[]>>({});
  const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [storeManagers, setStoreManagers] = useState<Record<string, EmployeeRow[]>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadCAPAs = async () => {
    if (!employeeData?.code) return;
    setIsLoading(true);
    try {
      let params: { storeId?: string; assigneeId?: string; auditorId?: string; amId?: string; all?: boolean } = {};
      if (authRole === 'admin' || authRole === 'editor') {
        params = { all: true };
      } else if (authRole === 'qa') {
        params = { auditorId: employeeData.code };
      } else if (authRole === 'operations') {
        params = { amId: employeeData.code };
      } else {
        params = { assigneeId: employeeData.code };
      }
      const data = await fetchCAPAs(params);
      setCAPAs(data);
      const total = data.length;
      const completed = data.filter(r => r.status === 'Closed').length;
      onStatsUpdate({ completed, total, score: total > 0 ? Math.round((completed / total) * 100) : 0 });
    } catch (error) {
      console.error('Failed to load CAPAs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCAPAs(); }, [employeeData?.code]);

  const loadStoreManagers = async (storeId: string) => {
    if (storeManagers[storeId]) return;
    try {
      const managers = await resolveStoreManagement(storeId);
      setStoreManagers(prev => ({ ...prev, [storeId]: managers }));
    } catch (error) {
      console.error('Failed to load store managers:', error);
    }
  };

  const toggleExpand = (index: number) => {
    if (expandedCAPA === index) {
      setExpandedCAPA(null);
    } else {
      setExpandedCAPA(index);
      const capa = capas[index];
      loadStoreManagers(capa.storeId);
      if (!editingFindings[index]) {
        setEditingFindings(prev => ({
          ...prev,
          [index]: normalizeFindings([...capa.findings])
        }));
      }
    }
  };

  const updateFindingField = (capaIndex: number, findingIndex: number, field: string, value: any) => {
    setEditingFindings(prev => {
      const findings = [...(prev[capaIndex] || normalizeFindings(capas[capaIndex].findings))];
      findings[findingIndex] = { ...findings[findingIndex], [field]: value };
      return { ...prev, [capaIndex]: findings };
    });
  };

  const updateActionItem = (capaIndex: number, findingIndex: number, field: 'correctiveActions' | 'preventiveActions', actionIndex: number, value: string) => {
    setEditingFindings(prev => {
      const findings = [...(prev[capaIndex] || normalizeFindings(capas[capaIndex].findings))];
      const actions = [...(findings[findingIndex][field] || ['', '', ''])];
      actions[actionIndex] = value;
      findings[findingIndex] = { ...findings[findingIndex], [field]: actions };
      return { ...prev, [capaIndex]: findings };
    });
  };

  const handleGenerateInstant = (capaIndex: number, findingIndex: number) => {
    const capa = capas[capaIndex];
    const findings = editingFindings[capaIndex] || normalizeFindings(capa.findings);
    const finding = findings[findingIndex];
    const suggestion = generateInstantCAPA(finding);
    setEditingFindings(prev => {
      const f = [...(prev[capaIndex] || normalizeFindings(capa.findings))];
      f[findingIndex] = {
        ...f[findingIndex],
        rootCause: suggestion.rootCause,
        correctiveActions: [...suggestion.correctiveActions, '', '', ''].slice(0, 3),
        preventiveActions: [...suggestion.preventiveActions, '', '', ''].slice(0, 3),
        aiGenerated: false
      };
      return { ...prev, [capaIndex]: f };
    });
  };

  const handleGenerateAllInstant = (capaIndex: number) => {
    const capa = capas[capaIndex];
    const findings = editingFindings[capaIndex] || normalizeFindings(capa.findings);
    setEditingFindings(prev => {
      const f = [...(prev[capaIndex] || normalizeFindings(capa.findings))];
      findings.forEach((_: QAFinding, fIdx: number) => {
        const suggestion = generateInstantCAPA(f[fIdx]);
        f[fIdx] = {
          ...f[fIdx],
          rootCause: suggestion.rootCause,
          correctiveActions: [...suggestion.correctiveActions, '', '', ''].slice(0, 3),
          preventiveActions: [...suggestion.preventiveActions, '', '', ''].slice(0, 3),
          aiGenerated: false
        };
      });
      return { ...prev, [capaIndex]: f };
    });
  };

  const handleGenerateAI = async (capaIndex: number, findingIndex: number) => {
    const key = `${capaIndex}_${findingIndex}`;
    const capa = capas[capaIndex];
    const findings = editingFindings[capaIndex] || normalizeFindings(capa.findings);
    const finding = findings[findingIndex];

    setAiLoading(prev => ({ ...prev, [key]: true }));
    try {
      const suggestion = await generateAICAPA(finding, capa.storeName);
      setEditingFindings(prev => {
        const f = [...(prev[capaIndex] || normalizeFindings(capa.findings))];
        f[findingIndex] = {
          ...f[findingIndex],
          rootCause: suggestion.rootCause,
          correctiveActions: [...suggestion.correctiveActions, '', '', ''].slice(0, 3),
          preventiveActions: [...suggestion.preventiveActions, '', '', ''].slice(0, 3),
          aiGenerated: true
        };
        return { ...prev, [capaIndex]: f };
      });
    } catch (error) {
      console.error('AI generation failed:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert('AI CAPA generation failed:\n' + msg + '\n\nYou can fill in the fields manually.');
    } finally {
      setAiLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateAllAI = async (capaIndex: number) => {
    const capa = capas[capaIndex];
    const findings = editingFindings[capaIndex] || normalizeFindings(capa.findings);

    // Mark all findings as loading
    const loadingKeys: Record<string, boolean> = {};
    findings.forEach((_: QAFinding, i: number) => { loadingKeys[`${capaIndex}_${i}`] = true; });
    setAiLoading(prev => ({ ...prev, ...loadingKeys }));

    try {
      const suggestions = await generateBatchAICAPA(findings, capa.storeName);
      setEditingFindings(prev => {
        const f = [...(prev[capaIndex] || normalizeFindings(capa.findings))];
        suggestions.forEach((suggestion, fIdx) => {
          f[fIdx] = {
            ...f[fIdx],
            rootCause: suggestion.rootCause,
            correctiveActions: [...suggestion.correctiveActions, '', '', ''].slice(0, 3),
            preventiveActions: [...suggestion.preventiveActions, '', '', ''].slice(0, 3),
            aiGenerated: true
          };
        });
        return { ...prev, [capaIndex]: f };
      });
    } catch (error) {
      console.error('Batch AI generation failed:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert('AI CAPA generation failed:\n' + msg + '\n\nYou can fill in the fields manually.');
    } finally {
      const clearKeys: Record<string, boolean> = {};
      findings.forEach((_: QAFinding, i: number) => { clearKeys[`${capaIndex}_${i}`] = false; });
      setAiLoading(prev => ({ ...prev, ...clearKeys }));
    }
  };

  const handleImageUpload = async (capaIndex: number, findingIndex: number, file: File) => {
    const findings = editingFindings[capaIndex] || normalizeFindings(capas[capaIndex].findings);
    const currentImages = findings[findingIndex].imageProofs || [];
    if (currentImages.length >= 3) { alert('Maximum 3 images per finding.'); return; }
    try {
      const base64 = await compressImage(file);
      updateFindingField(capaIndex, findingIndex, 'imageProofs', [...currentImages, base64]);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to process image. Please try another.');
    }
  };

  const removeImage = (capaIndex: number, findingIndex: number, imageIndex: number) => {
    const findings = editingFindings[capaIndex] || normalizeFindings(capas[capaIndex].findings);
    const images = [...(findings[findingIndex].imageProofs || [])];
    images.splice(imageIndex, 1);
    updateFindingField(capaIndex, findingIndex, 'imageProofs', images);
  };

  const handleSubmitCAPA = async (index: number) => {
    const capa = capas[index];
    const findings = editingFindings[index] || normalizeFindings(capa.findings);

    const incomplete = findings.filter(f => {
      const hasRootCause = f.rootCause?.trim();
      const hasCorrective = (f.correctiveActions || []).some(a => a?.trim());
      const hasPreventive = (f.preventiveActions || []).some(a => a?.trim());
      return !hasRootCause || !hasCorrective || !hasPreventive || !f.targetDate;
    });
    if (incomplete.length > 0) {
      alert(`Please fill Root Cause, at least 1 Corrective Action, at least 1 Preventive Action, and Target Date for all ${incomplete.length} remaining findings.`);
      return;
    }

    // Populate legacy fields for backward compatibility
    const normalizedFindings = findings.map(f => ({
      ...f,
      correctiveAction: (f.correctiveActions || []).filter(a => a?.trim()).join('; '),
      preventiveAction: (f.preventiveActions || []).filter(a => a?.trim()).join('; ')
    }));

    setSubmittingIndex(index);
    try {
      await updateCAPA({
        qaSubmissionTime: capa.qaSubmissionTime,
        storeId: capa.storeId,
        status: 'In Progress',
        findingsJSON: JSON.stringify(normalizedFindings),
        capaSubmittedBy: employeeData?.name || '',
        capaSubmittedById: employeeData?.code || ''
      });

      setCAPAs(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'In Progress' as any,
          findings: normalizedFindings,
          capaSubmittedBy: employeeData?.name || '',
          capaSubmittedById: employeeData?.code || ''
        };
        return updated;
      });

      alert('CAPA submitted successfully! The AM / QA team will review and close.');
    } catch (error) {
      console.error('Failed to submit CAPA:', error);
      alert('Failed to submit CAPA. Please try again.');
    } finally {
      setSubmittingIndex(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle className="w-3 h-3" /> Open</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'Closed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3" /> Closed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">{status}</span>;
    }
  };

  if (isLoading) {
    return <LoadingOverlay message="Loading QA CAPAs..." />;
  }

  const managers = (storeId: string) => storeManagers[storeId] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">QA CAPA</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Corrective & Preventive Actions for QA audit findings
              </p>
            </div>
          </div>
          <button onClick={loadCAPAs} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Refresh">
            <RefreshCw className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{capas.filter(r => r.status === 'Open').length}</div>
            <div className="text-xs text-red-600 dark:text-red-400">Open</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{capas.filter(r => r.status === 'In Progress').length}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400">In Progress</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{capas.filter(r => r.status === 'Closed').length}</div>
            <div className="text-xs text-green-600 dark:text-green-400">Closed</div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {capas.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No Pending CAPAs</h3>
          <p className="text-gray-500 dark:text-slate-400">When QA audits find non-compliance at your store, CAPA items will appear here.</p>
        </div>
      )}

      {/* CAPA Cards */}
      {capas.map((capa, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          {/* Card Header */}
          <button onClick={() => toggleExpand(index)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <Store className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-slate-100">{capa.storeName}</div>
                <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{capa.storeId}</span>
                  <span>•</span>
                  <span>QA Score: {capa.qaScore}%</span>
                  <span>•</span>
                  <span>{capa.totalFindings} findings</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(capa.status)}
              <div className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {capa.qaSubmissionTime}
              </div>
              {expandedCAPA === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {/* Expanded Content */}
          {expandedCAPA === index && (
            <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4">
              {/* Audit Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-slate-400">QA Auditor:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-slate-100">{capa.qaAuditorName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">AM:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-slate-100">{capa.amName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Assigned To:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-slate-100">{capa.assignedToNames || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Audit Date:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-slate-100">{capa.qaSubmissionTime}</span>
                </div>
              </div>

              {/* Findings */}
              <div className="space-y-4">
                {/* Generate All CAPAs buttons */}
                {capa.status !== 'Closed' && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleGenerateAllInstant(index)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" /> Generate All CAPAs
                    </button>
                    <button
                      onClick={() => handleGenerateAllAI(index)}
                      disabled={Object.entries(aiLoading).some(([k, v]) => k.startsWith(`${index}_`) && v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {Object.entries(aiLoading).some(([k, v]) => k.startsWith(`${index}_`) && v)
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enhancing...</>
                        : <><Sparkles className="w-4 h-4" /> Enhance All with AI</>
                      }
                    </button>
                  </div>
                )}
                {(editingFindings[index] || normalizeFindings(capa.findings)).map((finding, fIndex) => {
                  const aiKey = `${index}_${fIndex}`;
                  const isAiLoading = aiLoading[aiKey];

                  return (
                    <div key={fIndex} className={`border rounded-lg overflow-hidden ${
                      finding.response === 'not-compliant'
                        ? 'border-red-200 dark:border-red-800'
                        : 'border-amber-200 dark:border-amber-800'
                    }`}>
                      {/* Finding Header — Full Question Text */}
                      <div className={`px-4 py-3 ${
                        finding.response === 'not-compliant'
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : 'bg-amber-50 dark:bg-amber-900/20'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            finding.response === 'not-compliant'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}>
                            {finding.response === 'not-compliant' ? '❌ Non-Compliance' : '⚠️ Partial Compliance'}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                            <span>{finding.section}</span>
                            <span>•</span>
                            <span>Weight: {finding.weight}</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mt-1">
                          {finding.question || QUESTION_MAP[finding.questionId] || finding.questionId}
                        </p>
                        {finding.remark && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">QA Remark: {finding.remark}</p>
                        )}
                      </div>

                      {/* CAPA Form — Editable when not Closed */}
                      {capa.status !== 'Closed' && (
                        <div className="p-4 space-y-4 bg-white dark:bg-slate-800">
                          {/* Header row with Generate and AI Enhance buttons */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">CAPA Details</span>
                              {finding.aiGenerated && (
                                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full">✨ AI Enhanced</span>
                              )}
                              {finding.rootCause && !finding.aiGenerated && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">Template</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleGenerateInstant(index, fIndex)}
                                className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> Generate CAPA
                              </button>
                              <button
                                onClick={() => handleGenerateAI(index, fIndex)}
                                disabled={isAiLoading}
                                className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all flex items-center gap-1"
                              >
                                {isAiLoading ? (
                                  <><RefreshCw className="w-3 h-3 animate-spin" /> Enhancing...</>
                                ) : (
                                  <><Sparkles className="w-3 h-3" /> Enhance with AI</>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Stakeholder dropdown */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              <User className="w-3 h-3 inline mr-1" />Stakeholder
                            </label>
                            <select
                              value={finding.stakeholder ? `${finding.stakeholder.id}|${finding.stakeholder.name}` : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  const [id, ...rest] = e.target.value.split('|');
                                  updateFindingField(index, fIndex, 'stakeholder', { id, name: rest.join('|') });
                                } else {
                                  updateFindingField(index, fIndex, 'stakeholder', undefined);
                                }
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">Select stakeholder...</option>
                              {managers(capa.storeId).map((m) => (
                                <option key={m.employee_code} value={`${m.employee_code}|${m.empname}`}>
                                  {m.empname} ({m.designation})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Root Cause */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Root Cause *</label>
                            <textarea
                              value={finding.rootCause || ''}
                              onChange={(e) => updateFindingField(index, fIndex, 'rootCause', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              rows={2}
                              placeholder="Why did this non-compliance occur?"
                            />
                          </div>

                          {/* Corrective Actions (3 fields) */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              Corrective Actions (Immediate Fix) *
                            </label>
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="flex items-start gap-2 mb-2">
                                <span className="text-xs text-gray-400 mt-2.5 w-4 shrink-0">{i + 1}.</span>
                                <textarea
                                  value={(finding.correctiveActions || [])[i] || ''}
                                  onChange={(e) => updateActionItem(index, fIndex, 'correctiveActions', i, e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  rows={1}
                                  placeholder={`Corrective action ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Preventive Actions (3 fields) */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              Preventive Actions (Long-term Fix) *
                            </label>
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="flex items-start gap-2 mb-2">
                                <span className="text-xs text-gray-400 mt-2.5 w-4 shrink-0">{i + 1}.</span>
                                <textarea
                                  value={(finding.preventiveActions || [])[i] || ''}
                                  onChange={(e) => updateActionItem(index, fIndex, 'preventiveActions', i, e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  rows={1}
                                  placeholder={`Preventive action ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Target Closure Date */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              Target Closure Date *
                            </label>
                            <input
                              type="date"
                              value={finding.targetDate || ''}
                              onChange={(e) => updateFindingField(index, fIndex, 'targetDate', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          {/* Image Proof upload */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              Image Proof (max 3)
                            </label>
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                ref={(el) => { fileInputRefs.current[aiKey] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(index, fIndex, file);
                                  e.target.value = '';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[aiKey]?.click()}
                                disabled={(finding.imageProofs || []).length >= 3}
                                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1 text-gray-700 dark:text-slate-300"
                              >
                                <Upload className="w-3 h-3" /> Upload
                              </button>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                id={`camera-${aiKey}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(index, fIndex, file);
                                  e.target.value = '';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById(`camera-${aiKey}`)?.click()}
                                disabled={(finding.imageProofs || []).length >= 3}
                                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1 text-gray-700 dark:text-slate-300"
                              >
                                <Camera className="w-3 h-3" /> Camera
                              </button>
                            </div>
                            {/* Thumbnails */}
                            {(finding.imageProofs || []).length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {(finding.imageProofs || []).map((img, imgIdx) => (
                                  <div key={imgIdx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                                    <img src={img} alt={`Proof ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index, fIndex, imgIdx)}
                                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Read-only view for Closed CAPAs */}
                      {capa.status === 'Closed' && finding.rootCause && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 space-y-2">
                          {finding.stakeholder && (
                            <div>
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Stakeholder:</span>
                              <p className="text-sm text-blue-800 dark:text-blue-300">{finding.stakeholder.name}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Root Cause:</span>
                            <p className="text-sm text-blue-800 dark:text-blue-300">{finding.rootCause}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Corrective Actions:</span>
                            {(finding.correctiveActions || [finding.correctiveAction]).filter(Boolean).map((a, i) => (
                              <p key={i} className="text-sm text-blue-800 dark:text-blue-300">{i + 1}. {a}</p>
                            ))}
                          </div>
                          <div>
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Preventive Actions:</span>
                            {(finding.preventiveActions || [finding.preventiveAction]).filter(Boolean).map((a, i) => (
                              <p key={i} className="text-sm text-blue-800 dark:text-blue-300">{i + 1}. {a}</p>
                            ))}
                          </div>
                          {finding.targetDate && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">Target: {finding.targetDate}</span>
                          )}
                          {(finding.imageProofs || []).length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Image Proof:</span>
                              <div className="flex gap-2 flex-wrap mt-1">
                                {finding.imageProofs!.map((img, imgIdx) => (
                                  <div key={imgIdx} className="w-20 h-20 rounded-lg overflow-hidden border border-blue-200 dark:border-blue-700">
                                    <img src={img} alt={`Proof ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              {capa.status !== 'Closed' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleSubmitCAPA(index)}
                    disabled={submittingIndex === index}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {submittingIndex === index ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Submit CAPA</>
                    )}
                  </button>
                </div>
              )}

              {/* CAPA Submitter Info */}
              {capa.capaSubmittedBy && (
                <div className="mt-3 text-xs text-gray-500 dark:text-slate-400 text-right">
                  CAPA submitted by {capa.capaSubmittedBy} on {capa.capaSubmissionTime}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QACAPAChecklist;
