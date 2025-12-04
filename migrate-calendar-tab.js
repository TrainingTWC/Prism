import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'components', 'checklists', 'TrainingChecklist.tsx');

console.log('Reading TrainingChecklist.tsx...');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Update imports
console.log('Step 1: Adding imports...');
const oldImport = `import { GraduationCap } from 'lucide-react';`;
const newImport = `import { GraduationCap, Calendar as CalendarIcon, ClipboardList } from 'lucide-react';`;

if (content.includes(oldImport)) {
    content = content.replace(oldImport, newImport);
    console.log('✓ Updated lucide-react imports');
} else {
    console.log('⚠ Lucide import already updated or not found');
}

// Step 2: Add TrainingCalendar import after ConfigContext import
const configImport = `import { useConfig } from '../../contexts/ConfigContext';`;
const calendarImport = `import { useConfig } from '../../contexts/ConfigContext';
import TrainingCalendar from './TrainingCalendar';`;

if (content.includes(configImport) && !content.includes('TrainingCalendar')) {
    content = content.replace(configImport, calendarImport);
    console.log('✓ Added TrainingCalendar import');
} else {
    console.log('⚠ TrainingCalendar import already exists or ConfigContext import not found');
}

// Step 3: Add activeTab state after useConfig hook
const useConfigLine = `  const { config, loading: configLoading } = useConfig();`;
const withActiveTab = `  const { config, loading: configLoading } = useConfig();
  const [activeTab, setActiveTab] = useState<'checklist' | 'calendar'>('checklist');`;

if (content.includes(useConfigLine) && !content.includes('activeTab')) {
    content = content.replace(useConfigLine, withActiveTab);
    console.log('✓ Added activeTab state');
} else {
    console.log('⚠ activeTab state already exists or useConfig line not found');
}

// Step 4: Add tab navigation UI before the "Training Assessment" heading
// Find the line with "Training sections - Full Width" and insert tabs before it
const trainingAssessmentPattern = /(\s+{\/\* Training sections - Full Width \*\/}\r?\n\s+<div className="w-full space-y-6 sm:space-y-8 px-3 sm:px-6">\r?\n\s+<h2)/;

const tabsUI = `
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('checklist')}
            className={\`flex items-center gap-2 px-4 py-2 font-medium transition-colors \${
              activeTab === 'checklist'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }\`}
          >
            <ClipboardList className="w-5 h-5" />
            Checklist
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={\`flex items-center gap-2 px-4 py-2 font-medium transition-colors \${
              activeTab === 'calendar'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }\`}
          >
            <CalendarIcon className="w-5 h-5" />
            Calendar
          </button>
        </div>

        {/* Checklist View */}
        {activeTab === 'checklist' && (
        <>
        $1`;

if (content.match(trainingAssessmentPattern) && !content.includes('Tab Navigation')) {
    content = content.replace(trainingAssessmentPattern, tabsUI);
    console.log('✓ Added tab navigation UI');
} else {
    console.log('⚠ Tab navigation already exists or pattern not found');
}

// Step 5: Add closing tags for checklist view and calendar view before the final closing div
// Find the submit buttons section and add closing tags
const submitButtonsEndPattern = /([\s\S]*Submit Training Audit'}\r?\n\s+<\/button>\r?\n\s+<\/div>\r?\n\s+<\/div>\r?\n\s+<\/div>\r?\n\s+)\}\r?\n\s+<\/>\r?\n\s+\)\;\r?\n\}\;/;

const closingWithCalendar = `$1        </>
        )}

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <TrainingCalendar 
            trainerId={meta.trainerId} 
            trainerName={meta.trainerName}
          />
        )}
      </>
    )
  };`;

if (content.match(submitButtonsEndPattern) && !content.includes('Calendar View')) {
    content = content.replace(submitButtonsEndPattern, closingWithCalendar);
    console.log('✓ Added calendar view conditional rendering');
} else {
    console.log('⚠ Calendar view already exists or pattern not found');
}

// Write the modified content back
console.log('\nWriting changes to file...');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Migration completed successfully!');
console.log('\nPlease verify the changes and test the application.');
