import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'components', 'checklists', 'TrainingChecklist.tsx');

console.log('📝 Reading TrainingChecklist.tsx...');
let content = fs.readFileSync(filePath, 'utf8');

// Check if tab navigation already exists
if (content.includes('Tab Navigation')) {
    console.log('⚠️  Tab navigation already exists. Skipping...');
    process.exit(0);
}

console.log('✨ Adding tab navigation and calendar view...\n');

// Step 1: Find the main return statement and add tabs before the first major section
// Look for the component's main return block - specifically after the header/title area
const returnPattern = /(return \(\s*<>\s*(?:[\s\S]*?)<div className="w-full[\s\S]*?">)/;

const match = content.match(returnPattern);
if (!match) {
    console.log('❌ Could not find return statement pattern');
    console.log('Trying alternative pattern...');

    // Alternative: Look for the GraduationCap icon section which marks the header
    const altPattern = /([\s\S]*?<GraduationCap className[\s\S]*?<\/div>\s*<\/div>\s*\n)/;
    const altMatch = content.match(altPattern);

    if (altMatch) {
        console.log('✓ Found alternative insertion point');

        const tabsUI = `${altMatch[1]}
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 px-4 sm:px-6 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('checklist')}
            className={\`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 \${
              activeTab === 'checklist'
                ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
            }\`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="hidden sm:inline">Checklist</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={\`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 \${
              activeTab === 'calendar'
                ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                : 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-slate-200'
            }\`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>

        {/* Checklist View */}
        {activeTab === 'checklist' && (
        <>
`;

        content = content.replace(altPattern, tabsUI);
        console.log('✓ Added tab navigation UI (alternative method)');
    } else {
        console.log('❌ Could not find suitable insertion point for tabs');
        console.log('Manual intervention required.');
        process.exit(1);
    }
}

// Step 2: Add closing for checklist view and calendar view before final closing
// Find the very end of the component - look for the export statement
const endPattern = /([\s\S]*)(export default TrainingChecklist;)/;
const endMatch = content.match(endPattern);

if (endMatch) {
    // Now find where to close the checklist view (before the export)
    // Look for the last closing pattern before export
    const beforeExport = endMatch[1];

    // Find the last substantial closing div pattern (the main component closing)
    const lastClosingPattern = /([\s\S]*\s+<\/div>\s*<\/div>\s*\n\s*)\}\s*<\/>\s*\)\;\s*\}\;\s*\n/;
    const closingMatch = beforeExport.match(lastClosingPattern);

    if (closingMatch) {
        const withCalendar = `${closingMatch[1]}        </>
        )}

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <TrainingCalendar 
            trainerId={meta.trainerId} 
            trainerName={meta.trainerName}
          />
        )}
      </>
    );
  };

`;

        const newContent = content.replace(lastClosingPattern, withCalendar);
        content = newContent + endMatch[2];
        console.log('✓ Added calendar view conditional rendering');
    } else {
        console.log('⚠️  Could not find exact closing pattern, trying simpler approach...');

        // Simpler approach: just add before the export
        const simplePattern = /([\s\S]*?)(\nexport default TrainingChecklist;)/;
        const simpleMatch = content.match(simplePattern);

        if (simpleMatch) {
            // Find the last }; before export and add our calendar view there
            const beforeExportContent = simpleMatch[1];
            const lastComponentClose = beforeExportContent.lastIndexOf('};');

            if (lastComponentClose > 0) {
                const calendarView = `
        </>
        )}

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <TrainingCalendar 
            trainerId={meta.trainerId} 
            trainerName={meta.trainerName}
          />
        )}
      </>
    );
`;

                const part1 = beforeExportContent.substring(0, lastComponentClose);
                const part2 = beforeExportContent.substring(lastComponentClose);
                content = part1 + calendarView + part2 + simpleMatch[2];
                console.log('✓ Added calendar view (simple method)');
            }
        }
    }
}

// Write the modified content back
console.log('\n💾 Writing changes to file...');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Migration completed successfully!');
console.log('\n🎉 Calendar tab integration is now complete!');
console.log('📋 Next: Check the browser to see the Checklist and Calendar tabs');
