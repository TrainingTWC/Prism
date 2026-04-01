import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserRole } from '../../roleMapping';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { VENDOR_AUDIT_SECTIONS } from '../../config/vendorAuditQuestions';
import ImageEditor from '../ImageEditor';

const VENDOR_AUDIT_ENDPOINT = import.meta.env.VITE_VENDOR_AUDIT_SCRIPT_URL || import.meta.env.VITE_QA_SCRIPT_URL || '';

interface SurveyResponse {
  [key: string]: string;
}

interface SurveyMeta {
  auditorName: string;
  auditorId: string;
  vendorName: string;
  vendorLocation: string;
  city: string;
  region: string;
}

interface DraftMetadata {
  id: string;
  timestamp: string;
  vendorName: string;
  auditorName: string;
  completionPercentage: number;
}

interface VendorAuditChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  editMode?: boolean;
  existingSubmission?: any;
}

const VendorAuditChecklist: React.FC<VendorAuditChecklistProps> = ({ userRole, onStatsUpdate, editMode = false, existingSubmission }) => {
  const { config, loading: configLoading } = useConfig();
  const sections = VENDOR_AUDIT_SECTIONS;

  const [responses, setResponses] = useState<SurveyResponse>(() => {
    if (editMode && existingSubmission) {
      return existingSubmission.responses || {};
    }
    try {
      return JSON.parse(localStorage.getItem('vendor_audit_resp') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [questionImages, setQuestionImages] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('vendor_audit_images') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [questionRemarks, setQuestionRemarks] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('vendor_audit_remarks') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [signatures, setSignatures] = useState<{ auditor: string; vendor: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem('vendor_audit_signatures') || '{"auditor":"","vendor":""}');
    } catch (e) {
      return { auditor: '', vendor: '' };
    }
  });

  const [meta, setMeta] = useState<SurveyMeta>(() => {
    if (editMode && existingSubmission) {
      return {
        auditorName: existingSubmission.auditorName || '',
        auditorId: existingSubmission.auditorId || '',
        vendorName: existingSubmission.vendorName || '',
        vendorLocation: existingSubmission.vendorLocation || '',
        city: existingSubmission.city || '',
        region: existingSubmission.region || ''
      };
    }

    let stored: any = {};
    try {
      stored = JSON.parse(localStorage.getItem('vendor_audit_meta') || '{}');
    } catch (e) { }

    const urlParams = new URLSearchParams(window.location.search);
    const auditorId = urlParams.get('EMPID') || urlParams.get('auditorId') || stored.auditorId || '';
    const auditorName = urlParams.get('name') || urlParams.get('auditorName') || stored.auditorName || '';

    return {
      auditorName,
      auditorId,
      vendorName: stored.vendorName || '',
      vendorLocation: stored.vendorLocation || '',
      city: stored.city || '',
      region: stored.region || ''
    };
  });

  const { employeeData, userRole: authUserRole } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDraftList, setShowDraftList] = useState(false);
  const [drafts, setDrafts] = useState<DraftMetadata[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);

  const [editingImage, setEditingImage] = useState<{ questionId: string; imageIndex: number; imageData: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [highlightedQuestion, setHighlightedQuestion] = useState<string | null>(null);



  // Signature canvas refs
  const auditorCanvasRef = useRef<HTMLCanvasElement>(null);
  const vendorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<{ auditor: boolean; vendor: boolean }>({ auditor: false, vendor: false });

  // Autofill auditor fields when user role is qa
  useEffect(() => {
    if ((authUserRole === 'qa' || authUserRole === 'admin') && employeeData && !meta.auditorId) {
      setMeta(prev => ({
        ...prev,
        auditorId: employeeData.code,
        auditorName: employeeData.name
      }));
    }
  }, [authUserRole, employeeData]);

  // Back button / navigation protection
  useEffect(() => {
    const hasProgress = Object.keys(responses).length > 0;
    if (!hasProgress || submitted) return;

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
      const leave = window.confirm('You have unsaved progress. Are you sure you want to leave? Your responses will be lost.');
      if (leave) {
        window.removeEventListener('popstate', handlePopState);
        window.history.back();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [Object.keys(responses).length > 0, submitted]);

  // Load drafts from Google Sheets
  const loadDraftsFromSheet = async () => {
    if (!VENDOR_AUDIT_ENDPOINT || !meta.auditorId) return;

    setDraftsLoading(true);
    try {
      const url = `${VENDOR_AUDIT_ENDPOINT}?action=getVendorAuditDrafts&auditorId=${encodeURIComponent(meta.auditorId)}`;
      const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success && data.drafts) {
        setDrafts(data.drafts);
      } else {
        setDrafts([]);
      }
    } catch (error) {
      console.error('Could not load vendor audit drafts:', error);
      setDrafts([]);
    } finally {
      setDraftsLoading(false);
    }
  };

  useEffect(() => {
    loadDraftsFromSheet();
  }, [meta.auditorId]);

  // Save to localStorage
  useEffect(() => { localStorage.setItem('vendor_audit_resp', JSON.stringify(responses)); }, [responses]);
  useEffect(() => { localStorage.setItem('vendor_audit_meta', JSON.stringify(meta)); }, [meta]);
  useEffect(() => {
    try {
      localStorage.setItem('vendor_audit_images', JSON.stringify(questionImages));
    } catch (e) {
      if (e instanceof DOMException && (e.code === 22 || e.name === 'QuotaExceededError')) {
        alert('Storage limit reached. Please remove some images before adding more.');
      }
    }
  }, [questionImages]);
  useEffect(() => {
    try { localStorage.setItem('vendor_audit_remarks', JSON.stringify(questionRemarks)); } catch (e) { }
  }, [questionRemarks]);
  useEffect(() => { localStorage.setItem('vendor_audit_signatures', JSON.stringify(signatures)); }, [signatures]);

  // Update stats
  useEffect(() => {
    const totalQuestions = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key =>
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;

    let totalScore = 0;
    let maxScore = 0;

    sections.forEach(section => {
      section.items.forEach(item => {
        const response = responses[`${section.id}_${item.id}`];
        if (response === 'na') return;
        maxScore += item.w;

        if (section.id === 'VA_ZeroTolerance') {
          if (response === 'compliant') totalScore += item.w;
        } else {
          if (response === 'compliant') totalScore += item.w;
          else if (response === 'partially-compliant') totalScore += Math.floor(item.w / 2);
        }
      });
    });

    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 100) / 100 : 0;
    onStatsUpdate({ completed: answeredQuestions, total: totalQuestions, score: scorePercentage });
  }, [responses, onStatsUpdate, sections]);

  const handleMetaChange = (field: keyof SurveyMeta, value: string) => {
    setMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleResponse = (questionId: string, answer: string) => {
    setResponses(prev => ({ ...prev, [questionId]: answer }));
    hapticFeedback.select();
  };

  // Draft management
  const saveDraft = async () => {
    if (!VENDOR_AUDIT_ENDPOINT) { alert('Endpoint not configured.'); return; }
    if (!meta.auditorId || !meta.auditorName) { alert('Please fill in auditor details before saving draft.'); return; }

    const draftId = currentDraftId || `va_draft_${Date.now()}`;
    const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
    const totalQuestions = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key => responses[key] && responses[key] !== '' && !key.includes('_remarks')).length;
    const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'saveVendorAuditDraft',
        auditType: 'vendor-audit',
        draftId,
        auditorId: meta.auditorId || '',
        auditorName: meta.auditorName || '',
        vendorName: meta.vendorName || '',
        vendorLocation: meta.vendorLocation || '',
        city: meta.city || '',
        timestamp,
        completionPercentage: completionPercentage.toString(),
        responsesJSON: JSON.stringify(responses),
        questionImagesJSON: JSON.stringify(questionImages),
        questionRemarksJSON: JSON.stringify(questionRemarks),
        signaturesJSON: JSON.stringify(signatures),
        metaJSON: JSON.stringify(meta)
      });

      await fetch(VENDOR_AUDIT_ENDPOINT, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const draftMetadata: DraftMetadata = {
        id: draftId, timestamp,
        vendorName: meta.vendorName || 'Unsaved',
        auditorName: meta.auditorName || 'Unknown',
        completionPercentage
      };

      const existingDraftIndex = drafts.findIndex(d => d.id === draftId);
      let updatedDrafts;
      if (existingDraftIndex >= 0) {
        updatedDrafts = [...drafts];
        updatedDrafts[existingDraftIndex] = draftMetadata;
      } else {
        updatedDrafts = [...drafts, draftMetadata];
      }
      setDrafts(updatedDrafts);
      setCurrentDraftId(draftId);
      hapticFeedback.success();
      alert('Draft saved successfully!');
    } catch (error) {
      alert('Failed to save draft. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDraft = async (draftId: string) => {
    if (!VENDOR_AUDIT_ENDPOINT) { alert('Endpoint not configured.'); return; }
    setIsLoading(true);
    try {
      const response = await fetch(`${VENDOR_AUDIT_ENDPOINT}?action=loadVendorAuditDraft&draftId=${encodeURIComponent(draftId)}`);
      const data = await response.json();
      if (data.success && data.data?.draft) {
        const draft = data.data.draft;
        setResponses(draft.responses || {});
        setMeta(draft.meta || {});
        setQuestionImages(draft.questionImages || {});
        setQuestionRemarks(draft.questionRemarks || {});
        setSignatures(draft.signatures || { auditor: '', vendor: '' });
        setCurrentDraftId(draftId);
        setShowDraftList(false);
        hapticFeedback.success();
      } else {
        alert('Failed to load draft: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to load draft. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    if (!VENDOR_AUDIT_ENDPOINT) { alert('Endpoint not configured.'); return; }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ action: 'deleteVendorAuditDraft', draftId });
      await fetch(VENDOR_AUDIT_ENDPOINT, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      setDrafts(updatedDrafts);
      if (currentDraftId === draftId) setCurrentDraftId(null);
      hapticFeedback.success();
      alert('Draft deleted successfully.');
    } catch (error) {
      alert('Failed to delete draft.');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChecklist = () => {
    if (!confirm('Start a new audit? Current progress will be cleared unless you save it as a draft first.')) return;
    localStorage.removeItem('vendor_audit_resp');
    localStorage.removeItem('vendor_audit_meta');
    localStorage.removeItem('vendor_audit_images');
    localStorage.removeItem('vendor_audit_remarks');
    localStorage.removeItem('vendor_audit_signatures');

    setResponses({});
    setMeta({ auditorName: '', auditorId: '', vendorName: '', vendorLocation: '', city: '', region: '' });
    setQuestionImages({});
    setQuestionRemarks({});
    setSignatures({ auditor: '', vendor: '' });
    setCurrentDraftId(null);
    setSubmitted(false);
    hapticFeedback.success();
  };

  const autofillForTesting = () => {
    if (confirm('This will fill the ENTIRE vendor audit form with test data. Continue?')) {
      setMeta({
        auditorName: 'Test Auditor',
        auditorId: 'AUD001',
        vendorName: 'Test Vendor Pvt Ltd',
        vendorLocation: 'Industrial Area Phase 2',
        city: 'Mumbai',
        region: 'West'
      });

      const testResponses: SurveyResponse = {};
      sections.forEach(section => {
        section.items.forEach(item => {
          const rand = Math.random();
          let answer: string;
          if (section.id === 'VA_ZeroTolerance') {
            answer = rand < 0.90 ? 'compliant' : 'non-compliant';
          } else {
            if (rand < 0.70) answer = 'compliant';
            else if (rand < 0.85) answer = 'partially-compliant';
            else if (rand < 0.95) answer = 'not-compliant';
            else answer = 'na';
          }
          testResponses[`${section.id}_${item.id}`] = answer;
        });
      });

      setResponses(testResponses);
      alert('Vendor audit form autofilled with test data! All 63 questions completed. You can now review and submit.');
    }
  };

  const handleSubmit = async () => {
    const requiredFields: (keyof SurveyMeta)[] = ['auditorName', 'auditorId', 'vendorName'];
    const missingFields = requiredFields.filter(field => !meta[field]);

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      const infoSection = document.getElementById('vendor-audit-information');
      if (infoSection) {
        infoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        infoSection.classList.add('ring-2', 'ring-red-500');
        setTimeout(() => infoSection.classList.remove('ring-2', 'ring-red-500'), 3000);
      }
      return;
    }

    const totalQuestions = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key =>
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;

    if (answeredQuestions < totalQuestions) {
      let firstMissedId: string | null = null;
      let firstMissedSection: string | null = null;
      for (const section of sections) {
        for (const item of section.items) {
          const key = `${section.id}_${item.id}`;
          if (!responses[key] || responses[key] === '') {
            firstMissedId = key;
            firstMissedSection = section.id;
            break;
          }
        }
        if (firstMissedId) break;
      }

      if (firstMissedSection) setActiveSection(firstMissedSection);

      requestAnimationFrame(() => {
        setTimeout(() => {
          if (firstMissedId) {
            const el = document.getElementById(`q_${firstMissedId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setHighlightedQuestion(firstMissedId);
              setTimeout(() => setHighlightedQuestion(null), 3000);
            }
          }
        }, 100);
      });

      alert(`Please answer all questions. You have answered ${answeredQuestions} out of ${totalQuestions} questions.`);
      return;
    }

    setIsLoading(true);

    try {
      let totalScore = 0;
      let maxScore = 0;

      sections.forEach(section => {
        section.items.forEach(item => {
          const response = responses[`${section.id}_${item.id}`];
          if (response === 'na') return;
          maxScore += item.w;
          if (section.id === 'VA_ZeroTolerance') {
            if (response === 'compliant') totalScore += item.w;
          } else {
            if (response === 'compliant') totalScore += item.w;
            else if (response === 'partially-compliant') totalScore += Math.floor(item.w / 2);
          }
        });
      });

      const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 100) / 100 : 0;

      const params: Record<string, string> = {
        submissionTime: editMode && existingSubmission?.submissionTime
          ? existingSubmission.submissionTime
          : new Date().toLocaleString('en-GB', { hour12: false }),
        auditType: 'vendor-audit',
        auditorName: meta.auditorName || '',
        auditorId: meta.auditorId || '',
        vendorName: meta.vendorName || '',
        vendorLocation: meta.vendorLocation || '',
        city: meta.city || '',
        region: meta.region || '',
        totalScore: String(totalScore),
        maxScore: String(maxScore),
        scorePercentage: String(scorePercentage),
        auditorSignature: signatures.auditor || '',
        vendorSignature: signatures.vendor || '',
        action: editMode ? 'update' : 'createVendorAudit',
        rowId: editMode && existingSubmission?.submissionTime ? String(existingSubmission.submissionTime) : '',
        ...Object.fromEntries(Object.entries(responses).map(([k, v]) => [k, String(v)])),
        ...Object.fromEntries(Object.entries(questionRemarks).map(([k, v]) => [`${k}_remark`, String(v)])),
        ...Object.fromEntries(Object.entries(questionImages).map(([k, v]) => [`${k}_imageCount`, String(v.length)])),
        questionRemarksJSON: JSON.stringify(questionRemarks)
      };

      const imagesJSON = JSON.stringify(questionImages);
      if (imagesJSON.length < 500000) {
        params.questionImagesJSON = imagesJSON;
      } else {
        params.questionImagesJSON = JSON.stringify({});
      }

      const bodyString = new URLSearchParams(params).toString();

      const SUBMIT_TIMEOUT = 90000;
      const MAX_NETWORK_RETRIES = 2;
      let networkRetryCount = 0;
      let didSubmit = false;

      while (!didSubmit) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT);

          await fetch(VENDOR_AUDIT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: bodyString,
            mode: 'no-cors',
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          didSubmit = true;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            didSubmit = true;
          } else {
            networkRetryCount++;
            if (networkRetryCount <= MAX_NETWORK_RETRIES) {
              const delayMs = networkRetryCount * 3000;
              await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
              alert('Failed to submit. Please check your internet connection and try again.');
              throw new Error('Submission failed after network retries: ' + err.message);
            }
          }
        }
      }

      if (currentDraftId) {
        const updatedDrafts = drafts.filter(d => d.id !== currentDraftId);
        setDrafts(updatedDrafts);
        setCurrentDraftId(null);
      }

      localStorage.removeItem('vendor_audit_resp');
      localStorage.removeItem('vendor_audit_meta');
      localStorage.removeItem('vendor_audit_images');
      localStorage.removeItem('vendor_audit_remarks');
      localStorage.removeItem('vendor_audit_signatures');

      setSubmitted(true);

      if (editMode) {
        alert(editMode ? 'Vendor Audit updated successfully!' : 'Vendor Audit submitted successfully!');
        setTimeout(() => { window.location.reload(); }, 500);
      }
    } catch (error) {
      console.error('Error submitting vendor audit:', error);
      alert('Error submitting audit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Image handling
  const handleImageUpload = (questionId: string, files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const maxDimension = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

          setQuestionImages(prev => {
            try {
              const newImages = { ...prev, [questionId]: [...(prev[questionId] || []), compressedBase64] };
              if (JSON.stringify(newImages).length > 5000000) {
                alert('Storage limit reached. Please remove some images before adding more.');
                return prev;
              }
              return newImages;
            } catch { return prev; }
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (questionId: string, imageIndex: number) => {
    setQuestionImages(prev => {
      const updated = { ...prev };
      const images = updated[questionId] || [];
      updated[questionId] = images.filter((_, idx) => idx !== imageIndex);
      if (updated[questionId].length === 0) delete updated[questionId];
      return updated;
    });
  };

  const handleSaveEditedImage = (editedImageData: string) => {
    if (!editingImage) return;
    setQuestionImages(prev => {
      const updated = { ...prev };
      const images = [...(updated[editingImage.questionId] || [])];
      images[editingImage.imageIndex] = editedImageData;
      updated[editingImage.questionId] = images;
      return updated;
    });
    setEditingImage(null);
  };

  // Signature drawing
  const [lastPoint, setLastPoint] = useState<{ auditor: { x: number; y: number } | null; vendor: { x: number; y: number } | null }>({
    auditor: null, vendor: null
  });

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'auditor' | 'vendor') => {
    const canvas = type === 'auditor' ? auditorCanvasRef.current : vendorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(prev => ({ ...prev, [type]: true }));
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ('touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left) * scaleX;
    const y = ('touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top) * scaleY;
    setLastPoint(prev => ({ ...prev, [type]: { x, y } }));
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'auditor' | 'vendor') => {
    if (!isDrawing[type]) return;
    const canvas = type === 'auditor' ? auditorCanvasRef.current : vendorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = ('touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left) * scaleX;
    const currentY = ('touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top) * scaleY;
    const last = lastPoint[type];
    if (!last) { setLastPoint(prev => ({ ...prev, [type]: { x: currentX, y: currentY } })); return; }

    const midX = (last.x + currentX) / 2;
    const midY = (last.y + currentY) / 2;
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    setLastPoint(prev => ({ ...prev, [type]: { x: currentX, y: currentY } }));
  };

  const stopDrawing = (type: 'auditor' | 'vendor') => {
    setIsDrawing(prev => ({ ...prev, [type]: false }));
    setLastPoint(prev => ({ ...prev, [type]: null }));
    const canvas = type === 'auditor' ? auditorCanvasRef.current : vendorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setSignatures(prev => ({ ...prev, [type]: dataUrl }));
  };

  const clearSignature = (type: 'auditor' | 'vendor') => {
    const canvas = type === 'auditor' ? auditorCanvasRef.current : vendorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setLastPoint(prev => ({ ...prev, [type]: null }));
    setSignatures(prev => ({ ...prev, [type]: '' }));
  };

  // Initialize canvas when signatures are loaded from localStorage
  useEffect(() => {
    if (signatures.auditor && auditorCanvasRef.current) {
      const ctx = auditorCanvasRef.current.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); };
        img.src = signatures.auditor;
      }
    }
    if (signatures.vendor && vendorCanvasRef.current) {
      const ctx = vendorCanvasRef.current.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); };
        img.src = signatures.vendor;
      }
    }
  }, []);

  const resetSurvey = () => {
    if (confirm('Are you sure you want to reset the audit? All responses will be lost.')) {
      setResponses({});
      setMeta({ auditorName: '', auditorId: '', vendorName: '', vendorLocation: '', city: '', region: '' });
      setQuestionImages({});
      setQuestionRemarks({});
      setSignatures({ auditor: '', vendor: '' });
      setSubmitted(false);
      localStorage.removeItem('vendor_audit_resp');
      localStorage.removeItem('vendor_audit_meta');
      localStorage.removeItem('vendor_audit_images');
      localStorage.removeItem('vendor_audit_remarks');
      localStorage.removeItem('vendor_audit_signatures');
    }
  };

  // Section icon mapping
  const getSectionIcon = (sectionId: string): string => {
    const iconMap: Record<string, string> = {
      'VA_ZeroTolerance': '🚨',
      'VA_DesignFacilities': '🏗️',
      'VA_ControlOfOperation': '⚙️',
      'VA_CleaningSanitation': '🧼',
      'VA_PestControl': '🐀',
      'VA_PersonalHygiene': '🧑‍🍳',
      'VA_Maintenance': '🔧',
      'VA_Documentation': '📂',
      'VA_GeneralSafety': '🚨'
    };
    return iconMap[sectionId] || '📋';
  };

  // Section prefix for serial numbers
  const getSectionPrefix = (sectionId: string): string => {
    const prefixMap: Record<string, string> = {
      'VA_ZeroTolerance': 'ZT',
      'VA_DesignFacilities': 'DF',
      'VA_ControlOfOperation': 'CO',
      'VA_CleaningSanitation': 'CS',
      'VA_PestControl': 'PC',
      'VA_PersonalHygiene': 'PH',
      'VA_Maintenance': 'MT',
      'VA_Documentation': 'DC',
      'VA_GeneralSafety': 'GS'
    };
    return prefixMap[sectionId] || sectionId.substring(0, 2).toUpperCase();
  };

  if (submitted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
            <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
              Vendor Audit Submitted Successfully!
            </h2>
            <p className="text-green-700 dark:text-green-400 mb-6">
              Thank you for completing the Vendor Audit. Your responses have been recorded.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetSurvey}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Take Another Audit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {isLoading && <LoadingOverlay />}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg p-4 sm:p-6 border border-teal-200 dark:border-teal-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              🏭 Vendor Audit Assessment
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
              Comprehensive food safety and quality audit for vendor establishments covering FSSAI compliance, operations, hygiene, and safety standards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => { setShowDraftList(!showDraftList); if (!showDraftList) loadDraftsFromSheet(); }}
              disabled={draftsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {draftsLoading ? 'Loading...' : `Drafts ${drafts.length > 0 ? `(${drafts.length})` : ''}`}
            </button>

            <button
              onClick={saveDraft}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Draft
            </button>

            <button
              onClick={startNewChecklist}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          </div>
        </div>

        {currentDraftId && (
          <div className="mt-3 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md text-sm text-blue-800 dark:text-blue-200">
            📝 Currently editing draft from {drafts.find(d => d.id === currentDraftId)?.timestamp || 'Unknown'}
          </div>
        )}
      </div>

      {/* Draft List */}
      {showDraftList && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100">📋 Saved Drafts</h2>
              <button onClick={loadDraftsFromSheet} disabled={draftsLoading} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50" title="Refresh drafts">
                <svg className={`w-4 h-4 ${draftsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <button onClick={() => setShowDraftList(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {draftsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 dark:text-slate-400 mt-2">Loading drafts...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-slate-400">No saved drafts</p>
              <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">Click "Save Draft" to save your progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map(draft => (
                <div key={draft.id} className={`p-4 border rounded-lg ${currentDraftId === draft.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'} transition-colors`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                          {draft.vendorName}
                        </h3>
                        {currentDraftId === draft.id && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Auditor: {draft.auditorName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{draft.timestamp}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${draft.completionPercentage}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{draft.completionPercentage}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadDraft(draft.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">Load</button>
                      <button onClick={() => deleteDraft(draft.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Information */}
      <div id="vendor-audit-information" className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Audit Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Auditor Name *</label>
            <input type="text" value={meta.auditorName} onChange={(e) => handleMetaChange('auditorName', e.target.value)} placeholder="Enter auditor name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Auditor ID *</label>
            <input type="text" value={meta.auditorId} onChange={(e) => handleMetaChange('auditorId', e.target.value)} placeholder="Enter auditor ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Vendor / Establishment Name *</label>
            <input type="text" value={meta.vendorName} onChange={(e) => handleMetaChange('vendorName', e.target.value)} placeholder="Enter vendor name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Vendor Location</label>
            <input type="text" value={meta.vendorLocation} onChange={(e) => handleMetaChange('vendorLocation', e.target.value)} placeholder="Enter vendor location/address"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Region</label>
            <input type="text" value={meta.region || ''} onChange={(e) => handleMetaChange('region', e.target.value)} placeholder="Enter region"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">City</label>
            <input type="text" value={meta.city || ''} onChange={(e) => handleMetaChange('city', e.target.value)} placeholder="Enter city"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
          </div>
        </div>
      </div>

      {/* Vendor Audit Sections - Category-wise View */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">
          Vendor Audit Assessment
        </h2>

        {activeSection === null ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              Select a category to begin the audit. Complete all categories to submit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((section) => {
                const answered = section.items.filter(item => {
                  const key = `${section.id}_${item.id}`;
                  return responses[key] && responses[key] !== '';
                }).length;
                const total = section.items.length;
                const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
                const isComplete = answered === total;

                let sectionScore = 0;
                let sectionMax = 0;
                section.items.forEach(item => {
                  const resp = responses[`${section.id}_${item.id}`];
                  if (resp === 'na' || !resp) return;
                  sectionMax += item.w;
                  if (section.id === 'VA_ZeroTolerance') {
                    if (resp === 'compliant') sectionScore += item.w;
                  } else {
                    if (resp === 'compliant') sectionScore += item.w;
                    else if (resp === 'partially-compliant') sectionScore += Math.floor(item.w / 2);
                  }
                });
                const scorePct = sectionMax > 0 ? Math.round((sectionScore / sectionMax) * 100) : 0;

                return (
                  <button
                    key={section.id}
                    onClick={() => { setActiveSection(section.id); hapticFeedback.select(); }}
                    className={`text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                      isComplete
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                        : answered > 0
                          ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/10'
                          : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getSectionIcon(section.id)}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm sm:text-base">{section.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{total} questions &middot; Max {section.maxScore} pts</p>
                      </div>
                      {isComplete && <span className="text-green-600 dark:text-green-400 text-lg">✅</span>}
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mb-2">
                      <div className={`h-2 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : answered > 0 ? 'bg-teal-500' : 'bg-gray-300 dark:bg-slate-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-slate-400">{answered}/{total} answered ({pct}%)</span>
                      {answered > 0 && (
                        <span className={`text-xs font-bold ${scorePct >= 80 ? 'text-green-600' : scorePct >= 60 ? 'text-teal-600' : 'text-red-600'}`}>Score: {scorePct}%</span>
                      )}
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
                  {Object.keys(responses).filter(k => responses[k] && responses[k] !== '' && !k.includes('_remarks')).length} / {sections.reduce((sum, s) => sum + s.items.length, 0)} questions
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                <div className="bg-teal-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((Object.keys(responses).filter(k => responses[k] && responses[k] !== '' && !k.includes('_remarks')).length / Math.max(1, sections.reduce((sum, s) => sum + s.items.length, 0))) * 100)}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Section Navigation Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-slate-600">
              <button onClick={() => { setActiveSection(null); hapticFeedback.select(); }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All Categories
              </button>
              <div className="flex gap-2">
                {(() => {
                  const currentIdx = sections.findIndex(s => s.id === activeSection);
                  return (
                    <>
                      <button disabled={currentIdx <= 0} onClick={() => { if (currentIdx > 0) { setActiveSection(sections[currentIdx - 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); hapticFeedback.select(); } }}
                        className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        ← Prev
                      </button>
                      <button disabled={currentIdx >= sections.length - 1} onClick={() => { if (currentIdx < sections.length - 1) { setActiveSection(sections[currentIdx + 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); hapticFeedback.select(); } }}
                        className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        Next →
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Render active section questions */}
            {sections.filter(s => s.id === activeSection).map((section) => {
              const sectionPrefix = getSectionPrefix(section.id);
              const sectionOptions = section.options || (section.id === 'VA_ZeroTolerance' ? ['compliant', 'non-compliant'] : ['compliant', 'partially-compliant', 'not-compliant', 'na']);
              const answered = section.items.filter(item => { const key = `${section.id}_${item.id}`; return responses[key] && responses[key] !== ''; }).length;

              return (
                <div key={section.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-teal-700 dark:text-teal-300">{section.title}</h3>
                    <span className="text-xs font-medium px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">{answered}/{section.items.length} answered</span>
                  </div>

                  <div className="space-y-4">
                    {section.items?.map((item, itemIndex) => {
                      const serialNumber = `${sectionPrefix}-${itemIndex + 1}`;
                      const questionKey = `${section.id}_${item.id}`;
                      const isHighlighted = highlightedQuestion === questionKey;
                      return (
                        <div key={item.id} id={`q_${questionKey}`}
                          className={`p-3 sm:p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-300 ${isHighlighted ? 'border-red-500 ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-slate-600'}`}>
                          <div className="flex items-start gap-2 sm:gap-3 mb-3">
                            <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-md text-xs font-bold flex-shrink-0">{serialNumber}</span>
                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-slate-100 leading-relaxed flex-1">{item.q}</p>
                          </div>

                          {/* Response Options */}
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-3 pl-0 sm:pl-9">
                            {sectionOptions.map(option => (
                              <label key={option} className="flex items-center gap-2 sm:gap-2 cursor-pointer p-2 sm:p-0 rounded hover:bg-gray-100 dark:hover:bg-slate-700 sm:hover:bg-transparent transition-colors min-h-[44px] sm:min-h-0">
                                <input type="radio" name={`${section.id}_${item.id}`} value={option}
                                  checked={responses[`${section.id}_${item.id}`] === option}
                                  onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                  className="w-5 h-5 sm:w-4 sm:h-4 text-teal-600 border-gray-300 dark:border-slate-600 focus:ring-teal-500 flex-shrink-0" />
                                <span className="text-sm sm:text-sm text-gray-700 dark:text-slate-300 font-medium">
                                  {option === 'compliant' ? 'Compliance' : option === 'partially-compliant' ? 'Partial Compliance' : option === 'not-compliant' ? 'Non-Compliance' : option === 'non-compliant' ? 'Non-Compliance' : 'N/A'}
                                </span>
                              </label>
                            ))}
                          </div>

                          {/* Image Upload */}
                          <div className="pl-0 sm:pl-9">
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg cursor-pointer text-sm font-medium transition-colors min-h-[48px] sm:min-h-0">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  📷 Camera
                                  <input type="file" accept="image/*" capture="environment" onChange={(e) => { const files = e.target.files; if (files && files.length > 0) handleImageUpload(`${section.id}_${item.id}`, files); e.target.value = ''; }} className="hidden" />
                                </label>
                                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg cursor-pointer text-sm font-medium transition-colors min-h-[48px] sm:min-h-0">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  🖼️ Gallery (Multiple)
                                  <input type="file" accept="image/*" multiple onChange={(e) => { const files = e.target.files; if (files && files.length > 0) handleImageUpload(`${section.id}_${item.id}`, files); e.target.value = ''; }} className="hidden" />
                                </label>
                              </div>

                              {/* Display Uploaded Images */}
                              {questionImages[`${section.id}_${item.id}`] && questionImages[`${section.id}_${item.id}`].length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {questionImages[`${section.id}_${item.id}`].map((image, idx) => (
                                    <div key={idx} className="relative">
                                      <img src={image} alt={`Upload ${idx + 1}`} className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-slate-600" />
                                      <button type="button" onClick={() => setEditingImage({ questionId: `${section.id}_${item.id}`, imageIndex: idx, imageData: image })}
                                        className="absolute top-2 left-2 p-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full transition-colors shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="Edit image">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      </button>
                                      <button type="button" onClick={() => removeImage(`${section.id}_${item.id}`, idx)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full transition-colors shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="Remove image">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">{idx + 1} of {questionImages[`${section.id}_${item.id}`].length}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Per-Question Remarks */}
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">💬 Comments / NC Description for {serialNumber}</label>
                              <textarea value={questionRemarks[`${section.id}_${item.id}`] || ''}
                                onChange={(e) => setQuestionRemarks(prev => ({ ...prev, [`${section.id}_${item.id}`]: e.target.value }))}
                                placeholder="Add comments or describe non-compliance for this point..." rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Section footer with navigation */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-600">
                    <button onClick={() => { setActiveSection(null); window.scrollTo({ top: 0, behavior: 'smooth' }); hapticFeedback.select(); }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                      ← Back to Categories
                    </button>
                    {(() => {
                      const currentIdx = sections.findIndex(s => s.id === activeSection);
                      if (currentIdx < sections.length - 1) {
                        return (
                          <button onClick={() => { setActiveSection(sections[currentIdx + 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); hapticFeedback.select(); }}
                            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
                            Next: {sections[currentIdx + 1].title} →
                          </button>
                        );
                      }
                      return <span className="text-sm text-green-600 dark:text-green-400 font-medium">✅ Last category</span>;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signatures Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">Signatures</h2>

        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
          {/* Auditor Signature */}
          <div className="space-y-3">
            <label className="block text-base sm:text-sm font-medium text-gray-700 dark:text-slate-300">Auditor Signature *</label>
            <div className="border-3 border-gray-400 dark:border-slate-500 rounded-xl bg-white p-1 shadow-inner">
              <canvas ref={auditorCanvasRef} width={800} height={300}
                onMouseDown={(e) => startDrawing(e, 'auditor')} onMouseMove={(e) => draw(e, 'auditor')} onMouseUp={() => stopDrawing('auditor')} onMouseLeave={() => stopDrawing('auditor')}
                onTouchStart={(e) => { e.preventDefault(); startDrawing(e, 'auditor'); }} onTouchMove={(e) => { e.preventDefault(); draw(e, 'auditor'); }} onTouchEnd={(e) => { e.preventDefault(); stopDrawing('auditor'); }}
                className="w-full h-auto touch-none rounded-lg" style={{ touchAction: 'none', cursor: 'crosshair', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} />
            </div>
            <button type="button" onClick={() => clearSignature('auditor')}
              className="w-full px-4 py-3 sm:py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear Signature
            </button>
            <p className="text-sm text-gray-600 dark:text-slate-400 text-center font-medium">
              {typeof window !== 'undefined' && 'ontouchstart' in window ? '✍️ Draw with your finger' : '🖱️ Draw with your mouse'}
            </p>
          </div>

          {/* Vendor Representative Signature */}
          <div className="space-y-3">
            <label className="block text-base sm:text-sm font-medium text-gray-700 dark:text-slate-300">Vendor Representative Signature *</label>
            <div className="border-3 border-gray-400 dark:border-slate-500 rounded-xl bg-white p-1 shadow-inner">
              <canvas ref={vendorCanvasRef} width={800} height={300}
                onMouseDown={(e) => startDrawing(e, 'vendor')} onMouseMove={(e) => draw(e, 'vendor')} onMouseUp={() => stopDrawing('vendor')} onMouseLeave={() => stopDrawing('vendor')}
                onTouchStart={(e) => { e.preventDefault(); startDrawing(e, 'vendor'); }} onTouchMove={(e) => { e.preventDefault(); draw(e, 'vendor'); }} onTouchEnd={(e) => { e.preventDefault(); stopDrawing('vendor'); }}
                className="w-full h-auto touch-none rounded-lg" style={{ touchAction: 'none', cursor: 'crosshair', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} />
            </div>
            <button type="button" onClick={() => clearSignature('vendor')}
              className="w-full px-4 py-3 sm:py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear Signature
            </button>
            <p className="text-sm text-gray-600 dark:text-slate-400 text-center font-medium">
              {typeof window !== 'undefined' && 'ontouchstart' in window ? '✍️ Draw with your finger' : '🖱️ Draw with your mouse'}
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row gap-3 order-2 sm:order-1">
          <button onClick={resetSurvey}
            className="px-4 sm:px-6 py-3 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white rounded-lg font-medium transition-colors min-h-[48px]">
            Reset Audit
          </button>
          <button onClick={autofillForTesting}
            className="px-4 sm:px-6 py-3 btn-primary-gradient text-white rounded-lg font-medium transition-transform duration-150 active:scale-95 min-h-[48px]">
            🧪 Autofill Test Data
          </button>
        </div>
        <button onClick={handleSubmit} disabled={isLoading}
          className="px-4 sm:px-6 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-400 text-white rounded-lg font-medium transition-colors order-1 sm:order-2 min-h-[52px] text-base sm:text-base">
          {isLoading ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? '🔄 Update Audit' : '📤 Submit Vendor Audit')}
        </button>
      </div>

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor imageBase64={editingImage.imageData} onSave={handleSaveEditedImage} onCancel={() => setEditingImage(null)} />
      )}
    </div>
  );
};

export default VendorAuditChecklist;
