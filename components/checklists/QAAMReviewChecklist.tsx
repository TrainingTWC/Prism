import React, { useState, useEffect } from 'react';
import { UserRole } from '../../roleMapping';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardCheck, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, Store, Calendar, RefreshCw } from 'lucide-react';
import LoadingOverlay from '../LoadingOverlay';
import { fetchAMReviews, updateAMReview, CAPARecord, QAFinding } from '../../services/qaCapaService';

interface QAAMReviewChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
  onBackToChecklists?: () => void;
}

const QAAMReviewChecklist: React.FC<QAAMReviewChecklistProps> = ({ userRole, onStatsUpdate }) => {
  const { employeeData, userRole: authRole } = useAuth();
  const [reviews, setReviews] = useState<CAPARecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [editingFindings, setEditingFindings] = useState<Record<number, QAFinding[]>>({});
  const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);

  const loadReviews = async () => {
    console.log('[QAAMReview] loadReviews called, empCode:', employeeData?.code, 'authRole:', authRole);
    if (!authRole) { console.log('[QAAMReview] Skipping - missing authRole'); return; }
    const needsEmpCode = authRole !== 'admin' && authRole !== 'editor' && authRole !== 'qa';
    if (needsEmpCode && !employeeData?.code) { console.log('[QAAMReview] Skipping - non-admin role missing empCode'); return; }
    setIsLoading(true);
    try {
      // Fetch based on role: QA/Admin/Editor sees all, Operations (AM) sees their reviews
      let params: { amId?: string; auditorId?: string; all?: boolean } = {};
      if (authRole === 'admin' || authRole === 'editor' || authRole === 'qa') {
        params = { all: true };
      } else {
        // operations / default — AM sees reviews assigned to them
        params = { amId: employeeData!.code };
      }
      const data = await fetchAMReviews(params);
      setReviews(data);
      // Update stats
      const total = data.length;
      const completed = data.filter(r => r.status === 'Closed').length;
      onStatsUpdate({ completed, total, score: total > 0 ? Math.round((completed / total) * 100) : 0 });
    } catch (error) {
      console.error('Failed to load AM Reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [employeeData?.code, authRole]);

  const toggleExpand = (index: number) => {
    if (expandedReview === index) {
      setExpandedReview(null);
    } else {
      setExpandedReview(index);
      // Initialize editing findings if not already
      if (!editingFindings[index]) {
        setEditingFindings(prev => ({
          ...prev,
          [index]: [...reviews[index].findings]
        }));
      }
    }
  };

  const updateFindingField = (reviewIndex: number, findingIndex: number, field: string, value: string) => {
    setEditingFindings(prev => {
      const findings = [...(prev[reviewIndex] || reviews[reviewIndex].findings)];
      findings[findingIndex] = { ...findings[findingIndex], [field]: value };
      return { ...prev, [reviewIndex]: findings };
    });
  };

  const handleSubmitReview = async (index: number) => {
    const review = reviews[index];
    const findings = editingFindings[index] || review.findings;

    // Check all items have been acknowledged (amAction filled)
    const allAcknowledged = findings.every(f => f.amAction && f.amAction.trim() !== '');
    const newStatus = allAcknowledged ? 'Closed' : 'In Progress';

    setSubmittingIndex(index);
    try {
      await updateAMReview({
        qaSubmissionTime: review.qaSubmissionTime,
        storeId: review.storeId,
        status: newStatus,
        findingsJSON: JSON.stringify(findings)
      });

      // Update local state
      setReviews(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: newStatus as any, findings };
        return updated;
      });

      alert(allAcknowledged ? 'Review completed and closed!' : 'Review saved as In Progress.');
    } catch (error) {
      console.error('Failed to submit AM Review:', error);
      alert('Failed to save review. Please try again.');
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
    return <LoadingOverlay message="Loading AM Reviews..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">QA AM Review</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Review and acknowledge QA audit findings for your stores
              </p>
            </div>
          </div>
          <button
            onClick={loadReviews}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{reviews.filter(r => r.status === 'Open').length}</div>
            <div className="text-xs text-red-600 dark:text-red-400">Open</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{reviews.filter(r => r.status === 'In Progress').length}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400">In Progress</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{reviews.filter(r => r.status === 'Closed').length}</div>
            <div className="text-xs text-green-600 dark:text-green-400">Closed</div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {reviews.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No Pending Reviews</h3>
          <p className="text-gray-500 dark:text-slate-400">
            When QA audits find non-compliance at your stores, review items will appear here.
          </p>
        </div>
      )}

      {/* Review Cards */}
      {reviews.map((review, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          {/* Card Header */}
          <button
            onClick={() => toggleExpand(index)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <Store className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-slate-100">{review.storeName}</div>
                <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{review.storeId}</span>
                  <span>•</span>
                  <span>QA Score: {review.qaScore}%</span>
                  <span>•</span>
                  <span>{review.totalFindings} findings</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(review.status)}
              <div className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {review.qaSubmissionTime}
              </div>
              {expandedReview === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {/* Expanded Content */}
          {expandedReview === index && (
            <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4">
              {/* Audit Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-slate-400">QA Auditor:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-slate-100">{review.qaAuditorName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">City:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-slate-100">{review.city}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Region:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-slate-100">{review.region}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Audit Date:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-slate-100">{review.qaSubmissionTime}</span>
                </div>
              </div>

              {/* Findings Table */}
              <div className="space-y-4">
                {(editingFindings[index] || review.findings).map((finding, fIndex) => (
                  <div key={fIndex} className={`border rounded-lg p-4 ${
                    finding.response === 'not-compliant'
                      ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                      : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-gray-700 dark:text-slate-300">
                            {finding.questionId}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">{finding.section}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            finding.response === 'not-compliant'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {finding.response === 'not-compliant' ? 'Non-Compliance' : 'Partial Compliance'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-slate-100">{finding.question}</p>
                        {finding.remark && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">QA Remark: {finding.remark}</p>
                        )}
                      </div>
                    </div>

                    {/* AM Action Fields */}
                    {review.status !== 'Closed' && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                            AM Observation / Action Plan *
                          </label>
                          <textarea
                            value={finding.amAction || ''}
                            onChange={(e) => updateFindingField(index, fIndex, 'amAction', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            rows={2}
                            placeholder="Enter your observation and action plan..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Priority</label>
                            <select
                              value={finding.amPriority || ''}
                              onChange={(e) => updateFindingField(index, fIndex, 'amPriority', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                            >
                              <option value="">Select Priority</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Target Date</label>
                            <input
                              type="date"
                              value={finding.amTargetDate || ''}
                              onChange={(e) => updateFindingField(index, fIndex, 'amTargetDate', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show AM action if review is closed */}
                    {review.status === 'Closed' && finding.amAction && (
                      <div className="mt-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">AM Action:</div>
                        <p className="text-sm text-green-800 dark:text-green-300">{finding.amAction}</p>
                        {finding.amPriority && <span className="text-xs text-green-600 dark:text-green-400">Priority: {finding.amPriority}</span>}
                        {finding.amTargetDate && <span className="text-xs text-green-600 dark:text-green-400 ml-3">Target: {finding.amTargetDate}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              {review.status !== 'Closed' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleSubmitReview(index)}
                    disabled={submittingIndex === index}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {submittingIndex === index ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QAAMReviewChecklist;
