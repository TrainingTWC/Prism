import React from 'react';
import { X, Edit2 } from 'lucide-react';
import QAChecklist from './checklists/QAChecklist';
import { UserRole } from '../roleMapping';

interface QAEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  userRole: UserRole;
}

const QAEditModal: React.FC<QAEditModalProps> = ({ isOpen, onClose, submission, userRole }) => {
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
                Edit QA Assessment
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
          <QAChecklist
            userRole={userRole}
            onStatsUpdate={() => {}}
            editMode={true}
            existingSubmission={{
              ...submission,
              responses: extractResponses(submission)
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Extract responses from submission data
 * Converts Google Sheets format back to checklist format
 */
function extractResponses(submission: any): Record<string, string> {
  const responses: Record<string, string> = {};
  
  // Extract all question responses from the submission
  Object.keys(submission).forEach(key => {
    // Map field names that start with section prefixes
    if (key.startsWith('ZT_') || 
        key.startsWith('S_') || 
        key.startsWith('A_') || 
        key.startsWith('M_') || 
        key.startsWith('HR_') ||
        key.includes('_remarks')) {
      
      // Handle both formats:
      // 1. Direct field names like "ZT_1: Description" (from Google Sheets with colon)
      // 2. Already formatted like "ZeroTolerance_ZT_1"
      
      const fieldName = key.split(':')[0].trim(); // Remove description after colon if present
      
      // Map to correct format for checklist
      if (fieldName.startsWith('ZT_')) {
        responses[`ZeroTolerance_${fieldName}`] = submission[key];
      } else if (fieldName.startsWith('S_')) {
        responses[`Store_${fieldName}`] = submission[key];
      } else if (fieldName.startsWith('A_')) {
        responses[`A_${fieldName}`] = submission[key];
      } else if (fieldName.startsWith('M_')) {
        responses[`Maintenance_${fieldName}`] = submission[key];
      } else if (fieldName.startsWith('HR_')) {
        responses[`HR_${fieldName}`] = submission[key];
      } else if (key.includes('_remarks')) {
        // Extract section name from remarks key
        const sectionMatch = key.match(/^(\w+)_remarks/);
        if (sectionMatch) {
          const section = sectionMatch[1];
          // Map section abbreviations to full names
          const sectionMap: Record<string, string> = {
            'ZT': 'ZeroTolerance',
            'Store': 'Store',
            'S': 'Store',
            'A': 'A',
            'M': 'Maintenance',
            'Maintenance': 'Maintenance',
            'HR': 'HR'
          };
          const fullSection = sectionMap[section] || section;
          responses[`${fullSection}_remarks`] = submission[key];
        }
      }
    }
  });
  
  return responses;
}

export default QAEditModal;
