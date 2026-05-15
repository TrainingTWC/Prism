import React from 'react';
import { X, Edit2 } from 'lucide-react';
import VendorAuditChecklist from './checklists/VendorAuditChecklist';
import { UserRole } from '../roleMapping';

interface VendorAuditEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  userRole: UserRole;
}

const VendorAuditEditModal: React.FC<VendorAuditEditModalProps> = ({ isOpen, onClose, submission, userRole }) => {
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
                Edit Vendor Audit
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {submission.vendorName} • {submission.submissionTime}
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
          <VendorAuditChecklist
            userRole={userRole}
            onStatsUpdate={() => {}}
            editMode={true}
            existingSubmission={{
              ...submission,
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
              responses: extractVendorAuditResponses(submission),
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Extract question responses from a vendor audit submission row.
 * Handles camelCase `responses` object (already parsed by dataService),
 * as well as flat VA_QUESTION_ID columns from raw sheet data.
 */
function extractVendorAuditResponses(submission: any): Record<string, string> {
  // If the submission already has a parsed responses object, use it directly
  if (submission.responses && typeof submission.responses === 'object' &&
      Object.keys(submission.responses).length > 0) {
    return submission.responses;
  }

  const responses: Record<string, string> = {};

  // Extract flat VA question columns (e.g. VZT_1, VDF_3, VCO_12 …)
  const VA_PREFIXES = ['VZT_', 'VDF_', 'VCO_', 'VCS_', 'VPC_', 'VPH_', 'VM_', 'VD_', 'VGS_'];
  Object.keys(submission).forEach(key => {
    const stripped = key.split(':')[0].trim(); // strip "VZT_1: Description" style headers
    if (VA_PREFIXES.some(p => stripped.startsWith(p))) {
      const val = String(submission[key] || '').trim();
      if (val) responses[stripped] = val;
    }
  });

  return responses;
}

export default VendorAuditEditModal;
