import React from 'react';
import { X, Edit2 } from 'lucide-react';
import PreLaunchAuditChecklist from './checklists/PreLaunchAuditChecklist';
import { UserRole } from '../roleMapping';

interface PreLaunchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  userRole: UserRole;
}

const PreLaunchEditModal: React.FC<PreLaunchEditModalProps> = ({ isOpen, onClose, submission, userRole }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Edit2 className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Pre-Launch Audit
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {submission.storeName} • {submission.submissionTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <PreLaunchAuditChecklist
            userRole={userRole}
            onStatsUpdate={() => {}}
            editMode={true}
            existingSubmission={{
              ...submission,
              // Pass all known field variants so the checklist hydration can
              // find whichever format is non-empty (older rows use raw sheet
              // column names; newer rows use camelCase).
              questionImagesJSON:
                submission.questionImagesJSON ||
                submission['Question Images JSON'] ||
                submission['Images JSON'] ||
                '',
              questionRemarksJSON:
                submission.questionRemarksJSON ||
                submission['Question Remarks JSON'] ||
                submission['Remarks JSON'] ||
                '',
              responses: extractPreLaunchResponses(submission)
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Extract question responses from a pre-launch submission row.
 * Handles both camelCase and raw sheet column name formats.
 */
function extractPreLaunchResponses(submission: any): Record<string, string> {
  const responses: Record<string, string> = {};

  // If the submission already has a parsed responses object, use it directly
  if (submission.responses && typeof submission.responses === 'object' &&
      Object.keys(submission.responses).length > 0) {
    return submission.responses;
  }

  // Fall back to extracting from flat columns (PreLaunchChecklist_PL_N pattern)
  Object.keys(submission).forEach(key => {
    if (key.startsWith('PreLaunchChecklist_PL_') && !key.endsWith('_remark') && !key.endsWith('_imageCount')) {
      const val = String(submission[key] || '').trim();
      if (val) responses[key] = val;
    }
  });

  return responses;
}

export default PreLaunchEditModal;
