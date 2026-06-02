# Prism QA Module - User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Creating a New QA Audit](#creating-a-new-qa-audit)
4. [Understanding the Scoring System](#understanding-the-scoring-system)
5. [Navigating QA Sections](#navigating-qa-sections)
6. [Answering Questions](#answering-questions)
7. [Adding Evidence (Images & Remarks)](#adding-evidence-images--remarks)
8. [Working with Drafts](#working-with-drafts)
9. [Submitting Your Audit](#submitting-your-audit)
10. [Viewing the QA Dashboard](#viewing-the-qa-dashboard)
11. [Generating PDF Reports](#generating-pdf-reports)
12. [Editing Previous Audits](#editing-previous-audits)
13. [Tips & Best Practices](#tips--best-practices)
14. [Troubleshooting](#troubleshooting)

---

## Overview

Prism is a comprehensive audit management system designed for QA teams to conduct, track, and report on quality audits. The QA module specifically handles store quality assessments with detailed scoring, image evidence capture, and comprehensive reporting.

### Key Features:
- **Guided Audit Forms**: Step-by-step checklist with visual indicators
- **Draft Auto-Save**: Never lose your work with automatic draft saving
- **Image & Evidence Capture**: Attach photos with captions for documentation
- **Real-Time Scoring**: See your score update as you answer questions
- **PDF Reports**: Generate professional reports for stakeholders
- **Dashboard Analytics**: View performance trends across stores and regions
- **Edit Capability**: Update submissions after submission if needed

---

## Getting Started

### Accessing Prism
1. Open your browser and navigate to the Prism dashboard URL provided by your manager
2. Sign in with your credentials
3. Select **QA** from the main menu

### Navigating to QA Audits
- From the main dashboard, click the **QA** tab at the top
- You'll see two sub-sections:
  - **Store QA**: Standard quality assessments
  - **Pre-Launch**: Pre-opening audit for new stores

---

## Creating a New QA Audit

### Step 1: Start a New Audit
1. Click the **"+ New QA Audit"** button (or similar action button)
2. You'll be taken to the QA audit form

### Step 2: Fill in Audit Metadata
The form will ask for the following information:

| Field | Description | Example |
|-------|-------------|---------|
| **QA Name** | Your full name | John Doe |
| **QA ID** | Your unique employee ID | EMP12345 |
| **Store Name** | Name of the store being audited | Downtown Store |
| **Store ID** | Store identifier | ST001 |
| **AM Name** | Area Manager overseeing this store | Jane Smith |
| **AM ID** | Area Manager's ID | EMP67890 |
| **City** | City where the store is located | New York |
| **Region** | Region code | North-East |

3. These fields are **required** — ensure accuracy as they appear on final reports

---

## Understanding the Scoring System

### Scoring Breakdown

The QA audit is organized into sections with different scoring rules:

#### 1. **Zero Tolerance Section** (24 points)
- These are critical compliance items
- **Scoring Options**: Compliant (Pass) / Non-Compliant (Fail)
- **Critical Rule**: If ANY item is marked "Non-Compliant," the **entire audit score becomes 0%**
- These items cover food safety, pest control, and temperature critical controls

**Zero Tolerance Items:**
- Food expiration and date marking
- Secondary shelf life compliance
- Storage temperature maintenance
- Water quality (TDS/RO)
- Temperature-sensitive product transfer
- Pest activity

#### 2. **Store Section** (188 points)
- General store cleanliness, equipment, and operations
- **Scoring Options**: 
  - **Compliant** = 2 points
  - **Partially Compliant** = 1 point
  - **Not Compliant** = 0 points
  - **N/A** = Excluded from scoring

#### 3. **Maintenance Section** (22 points)
- Equipment maintenance and repair status
- Same scoring as Store section

#### 4. **A/QA Section** (6 points)
- Auditing and QA-specific procedures
- Same scoring as Store section

#### 5. **HR Section** (4 points)
- Human resources and staff-related items
- Same scoring as Store section

### Final Score Calculation
```
Final Score % = (Points Earned / Total Possible Points) × 100

Example:
- Earned: 210 points
- Possible: 240 points
- Final Score: (210 / 240) × 100 = 87.5%
```

### Score Interpretation
- **90-100%**: Excellent
- **80-89%**: Good
- **70-79%**: Acceptable
- **Below 70%**: Needs Improvement
- **0%**: Zero Tolerance violation found

---

## Navigating QA Sections

### Section Navigation

The audit is organized into collapsible sections to keep the form manageable:

1. **Section Tabs**: Click on any section title to expand/collapse it
2. **Progress Indicator**: Shows how many questions you've answered in each section
3. **Scroll**: Long sections have scrollable content within them
4. **Section Highlighting**: Answered sections show a checkmark or progress bar

### Section Organization

```
[Section Title] [Progress: X/Y completed]
├── Question 1
├── Question 2
├── Question 3
└── ...
```

### Tips for Navigation
- **Start with Zero Tolerance**: Get the critical items done first
- **Work section by section**: Don't jump around randomly
- **Use scroll-to-top**: After completing a section, use browser scroll to see overall progress
- **Mark as complete**: Once a section is done, move to the next one

---

## Answering Questions

### Response Options

Each question shows the available response options based on its section:

#### Zero Tolerance Section
- ✅ **Compliant**: Yes, this item meets requirements
- ❌ **Non-Compliant**: No, this item does NOT meet requirements

#### Other Sections
- ✅ **Compliant**: Fully meets requirements (2 points)
- ⚠️ **Partially Compliant**: Meets some but not all requirements (1 point)
- ❌ **Not Compliant**: Does not meet requirements (0 points)
- 🔲 **N/A**: Not applicable to this store (excluded from scoring)

### Selecting an Answer

1. **Click the radio button** next to your response
2. **Score updates immediately** in the top-right corner
3. **Visual feedback**: The question highlights to show it's been answered

### Best Practices for Answering

- **Be objective**: Base answers on observable evidence, not assumptions
- **Look for specifics**: Check the exact details mentioned in the question
- **Document reasons**: Add remarks or images if your answer might be questioned
- **Don't rush**: Take time to properly assess each item
- **Note uncertainties**: Use remarks section to explain partial compliance

---

## Adding Evidence (Images & Remarks)

### Why Evidence Matters
- Provides proof of your audit findings
- Helps store managers understand issues
- Creates accountability and audit trail
- Supports appeals or questions about scoring

### Adding Photos/Images

1. **Find the question** you want to add evidence to
2. **Click "📷 Add Photo" button** below the question (or click camera icon)
3. **Choose your upload method**:
   - **📷 Take Photo**: Use your device camera for instant capture
   - **🖼️ Upload File**: Choose from your device storage
4. **Capture or select your image**
5. **Image appears below the question** in a thumbnail format

#### Image Tips
- **Lighting**: Use good lighting to show details clearly
- **Focus**: Make sure the subject is in focus (not blurry)
- **Multiple angles**: Take photos from different angles if needed
- **Close-ups**: Show specific issues or evidence clearly
- **Date/time**: System automatically records when photo was taken

### Viewing/Managing Images
- **Thumbnails** show below each question
- **Click to expand**: View full-size images
- **Image count**: Shows how many images attached to each question
- **Remove image**: Click the X on thumbnail to delete
- **Edit image**: Click the pencil icon to annotate (draw, add text)

### Image Editing
The built-in image editor allows you to:
- **Draw/mark**: Use the pen tool to highlight issues
- **Add circles/arrows**: Point out specific areas
- **Add text**: Annotate what you're showing
- **Undo/Redo**: Fix mistakes in editing

**To edit an image:**
1. Click the pencil icon on the image thumbnail
2. Use the toolbar tools (pen, circle, arrow, text)
3. Change colors if needed
4. Click **Save Changes**

### Adding Remarks/Comments

1. **Find the remarks field** below each question (grey text box)
2. **Type your comment**: Explain your answer, provide context, or note concerns
3. **Examples of good remarks**:
   - "Freezer temperature at 2°C, within range"
   - "Missing date labels on 3 containers in back"
   - "Staff wearing hairnets and gloves - compliant"
   - "Partially compliant - some equipment old but functional"

### Remarks Best Practices
- **Be specific**: Mention quantities, locations, names if relevant
- **Be factual**: Stick to what you observed
- **Be constructive**: If non-compliant, suggest what needs fixing
- **Keep it brief**: One or two sentences usually sufficient
- **Reference evidence**: Note if you've included photos

---

## Working with Drafts

### What are Drafts?
Drafts are **automatically saved** versions of your audit that let you:
- Pause work and resume later
- Never lose progress if the app closes
- Work across multiple sessions
- Manage multiple audits simultaneously

### How Auto-Save Works
- Your responses are saved **automatically every 30 seconds**
- Changes to images, remarks, and scores are saved continuously
- **No manual save button needed** — it's automatic
- Drafts stored securely on your device and in the cloud

### Accessing Your Drafts

1. **On the QA audit list screen**, look for **"📋 Drafts"** section
2. **Each draft shows**:
   - Store name
   - Completion percentage (e.g., "65% complete")
   - Last modified date/time
   - Status indicator (In Progress)

3. **To resume a draft**:
   - Click the draft in the list
   - The form reopens with all your previous answers
   - Continue answering from where you left off

### Managing Drafts

| Action | How to Do It |
|--------|-------------|
| **Resume** | Click the draft in the list |
| **Delete** | Click the trash icon next to draft |
| **View progress** | Check the completion % shown |
| **See details** | Hover over draft for more info |

### Important Notes About Drafts
- ✅ Drafts are **private** to you until submitted
- ✅ You can have **multiple drafts** simultaneously
- ⚠️ Drafts are **NOT synced across devices** — work on same device/browser
- ⚠️ **Clearing browser data deletes local drafts** — submit before clearing cache
- ⚠️ Drafts are **temporary** — convert to submission when ready

---

## Submitting Your Audit

### Before You Submit

**Checklist:**
- ☐ All questions in each section answered (N/A is acceptable)
- ☐ Zero Tolerance section FULLY completed (no N/A allowed)
- ☐ Added relevant photos as evidence
- ☐ Added remarks where needed
- ☐ Final score is acceptable (or you're ready to submit as-is)
- ☐ Signatures added (if required)

### Step 1: Add Signatures

If your audit requires signatures:

1. **Scroll to bottom** of the form to find signature section
2. **Your signature (QA)**: 
   - Click on signature canvas
   - Sign with your mouse/touchpad/stylus
   - Clear and restart if needed (Clear button)
3. **Store Manager signature**: (if required)
   - Have the store manager sign in their designated area
   - Or you can sign on their behalf if authorized
4. **Save signatures**: System auto-saves when you move away

### Step 2: Review Your Responses

1. **Check each section** by clicking section titles
2. **Verify any concerning items** (low scores, multiple partial compliances)
3. **Make sure images are attached** to important findings
4. **Read remarks** to ensure they're clear

### Step 3: Submit

1. **Click "📤 Submit QA Audit"** button at bottom of form
2. **Confirmation dialog** appears showing:
   - Store name and auditor
   - Final score
   - Submission timestamp
3. **Click "Confirm Submit"** to finalize
4. **Success message** appears: "✅ QA Audit submitted successfully"

### What Happens After Submission
- ✅ Audit is locked and cannot be edited (until edit mode is used)
- ✅ Data transmitted to backend database
- ✅ Submission time recorded
- ✅ Information available on dashboard
- ✅ Area managers receive notification

### If Submission Fails
- **Check internet connection** — ensure you have stable connectivity
- **Try again** — click Submit button again (may be temporary network issue)
- **Save as draft** — wait a few minutes and try again
- **Contact support** — if error persists, reach out to your manager

---

## Viewing the QA Dashboard

### Accessing the Dashboard

1. **From the audit form**: Click "📊 Dashboard" at top
2. **From main menu**: Select **QA** then click **Dashboard** tab

### Dashboard Sections

#### 1. **Summary Cards** (Top of page)
Shows high-level metrics:
- **Total Audits**: Number of QA audits submitted
- **Average Score**: Mean score across all audits
- **Stores Audited**: Count of unique stores
- **Recent Submission**: Date of last audit

#### 2. **Performance Charts**

**Score Distribution Chart**
- Shows how many audits fall into each score range
- Visual: Bar chart with ranges (90-100%, 80-89%, etc.)
- Use to identify patterns in store compliance

**Regional Performance**
- Breaks down scores by geographic region
- Shows which regions are performing best/worst
- Helps identify regional training needs

**Auditor Performance**
- Compares scores from different QA auditors
- Useful for identifying consistency or gaps in auditing
- May indicate which auditors need additional training

#### 3. **Detailed Submissions Table**

Shows all QA audit records with columns:

| Column | Info |
|--------|------|
| **Date** | When audit was submitted |
| **Store** | Store name and ID |
| **Auditor** | Your name |
| **Score** | Final percentage score |
| **Status** | Submitted / In Draft |
| **Actions** | View details, Edit, Download PDF |

**Interacting with the table:**
- **Sort**: Click column headers to sort
- **Filter**: Use filter controls to narrow results
- **Search**: Search for specific stores or dates
- **View**: Click row to see full audit details
- **Export**: Download as PDF or Excel

#### 4. **Performance Insights** (Analytics Section)

**Zero Tolerance Violations**
- Lists any audits with zero tolerance failures
- Shows which item(s) failed
- Helps identify critical areas needing immediate attention

**Common Non-Compliances**
- Ranks most frequently failed items
- Shows % of stores failing each item
- Identifies training focus areas

**Section Performance**
- Shows average score for each major section
- Helps identify which areas need most attention
- Compare section performance across regions

#### 5. **Filters & Date Range**

At the top of dashboard:
- **Date range picker**: Select specific date range to analyze
- **Region filter**: Focus on specific geographic area
- **Store filter**: Analyze specific store(s)
- **Auditor filter**: View specific auditor's submissions

---

## Generating PDF Reports

### Creating a PDF Report

#### Method 1: From Dashboard
1. **On QA Dashboard**, find the submissions table
2. **Locate the audit** you want to report on
3. **Click "📄 Download PDF"** in the Actions column
4. **Report generates** and downloads automatically

#### Method 2: From Audit Details
1. **Open an audit** from the dashboard
2. **Click "📥 Generate Report"** button
3. **PDF downloads** to your device

#### Method 3: Bulk Reports
1. **Select multiple audits** using checkboxes in table
2. **Click "📋 Generate Batch Report"**
3. **Single PDF** with all selected audits generated

### PDF Report Contents

**Header Section:**
- Store name and location
- Audit date and auditor name
- Final score and grade (A/B/C/D/F)

**Scores Section:**
- Overall score
- Score by section (Zero Tolerance, Store, Maintenance, etc.)
- Visual: Bar graph showing score breakdown

**Question Details:**
- All questions with responses
- Points earned for each question
- Images attached to questions
- Remarks for each question

**Non-Compliance Summary:**
- List of all non-compliant or partially compliant items
- Recommended corrective actions

**Signatures:**
- QA auditor signature
- Store manager signature (if present)

**Footer:**
- Report generation date
- Page numbers
- Report ID (for tracking)

### Using the PDF

**For Store Manager:**
- Share to help them understand deficiencies
- Use for improvement planning
- Reference for corrective action implementation

**For Area Manager:**
- Monitor store performance
- Track improvement over time
- Identify underperforming stores

**For Corporate:**
- Compliance documentation
- Trend analysis
- Audit trail for regulatory purposes

---

## Editing Previous Audits

### When to Edit

You can edit a submitted audit if:
- You made data entry errors
- Additional information becomes available
- Store conditions have changed since submission
- You want to add more evidence

### How to Edit

#### Step 1: Find the Audit
1. **Go to QA Dashboard**
2. **In Submissions table**, find the audit
3. **Click "✏️ Edit"** in the Actions column

#### Step 2: Edit Mode
- Form reopens with all previous responses
- **Read-only fields** (QA ID, dates) are locked
- **Editable fields** (responses, images, remarks) can be modified

#### Step 3: Make Changes
1. **Update any responses** you want to change
2. **Add/remove images** as needed
3. **Modify remarks** or add new ones
4. **Changes reflected immediately** in score

#### Step 4: Save Changes
1. **Click "🔄 Update Audit"** button at bottom
2. **Confirmation dialog** appears
3. **Click "Confirm"** to save
4. **Success message** shows update time

### What's Preserved When Editing
- ✅ Original submission date
- ✅ Auditor name
- ✅ Store information
- ✅ Submission history

### What Gets Updated
- ✅ Responses to questions
- ✅ Score (recalculated)
- ✅ Images
- ✅ Remarks
- ✅ Last modified date/time

### Important Notes
- You can **only edit your own audits** (unless you're a manager)
- Edits are **tracked** with timestamps
- Previous version is **retained** for audit trail
- Store managers are **notified** of edits

---

## Tips & Best Practices

### Before the Audit
1. **Review the store profile**: Familiarize yourself with the store layout and size
2. **Check previous audits**: Look for recurring issues
3. **Plan your route**: Know where to look for each item
4. **Arrive during operating hours**: See real conditions, not just closed-down
5. **Inform store manager**: Let them know you're coming
6. **Charge your device**: Ensure full battery for photos/backup

### During the Audit
1. **Follow the sections in order**: Easier to navigate systematically
2. **Take photos as you go**: Don't try to remember everything
3. **Be thorough but efficient**: Spend time on items that matter most
4. **Ask store staff questions**: They can explain processes
5. **Look in hidden areas**: Behind equipment, under shelves
6. **Check all the details**: Dates, temperatures, conditions
7. **Note the time**: Audits at different times may show different conditions

### Photo Tips
1. **Take multiple angles** of problem areas
2. **Include context shots** showing overall area
3. **Close-ups** for specific violations
4. **Before/After** if store promised immediate fixes
5. **Date stamps**: Ensure visible on timestamp
6. **Avoid personal info**: Don't photograph employee badges or sensitive info

### Scoring Tips
1. **Zero Tolerance first**: If any fail, audit is 0 - get these right
2. **Be consistent**: Apply standards equally across all stores
3. **Document everything**: Don't rely on memory for edge cases
4. **When in doubt, "Partially Compliant"**: If not fully meeting requirements
5. **Use N/A sparingly**: Only when item truly doesn't apply

### Communication Tips
1. **Be respectful**: Treat store staff with professionalism
2. **Explain findings**: Help them understand why something isn't compliant
3. **Offer suggestions**: "Consider doing X instead" is more helpful than just "This is wrong"
4. **Praise good practices**: Point out what they're doing well
5. **Be fair**: Don't penalize for missing equipment if they're aware and ordering it

---

## Troubleshooting

### Common Issues & Solutions

#### ❌ "Audit Not Submitting"
**Problem**: Submit button doesn't work or shows error
- **Solution 1**: Check internet connection (Wifi, data)
- **Solution 2**: Ensure all required fields are filled (especially Zero Tolerance)
- **Solution 3**: Try refreshing the page and resubmitting
- **Solution 4**: Close browser and reopen Prism
- **Solution 5**: Contact IT support if error persists

#### ❌ "Images Not Uploading"
**Problem**: Camera/photo upload not working
- **Solution 1**: Check camera permissions in browser/device settings
- **Solution 2**: Ensure good internet connection (large file uploads)
- **Solution 3**: Reduce image size if very large (1-2 MB is typical)
- **Solution 4**: Try different image file (different camera app)
- **Solution 5**: Use "Upload File" instead of "Take Photo"

#### ❌ "Draft Lost/Not Saving"
**Problem**: Audit draft disappeared or didn't save
- **Solution 1**: Check if you cleared browser cache/data
- **Solution 2**: Refresh page - draft usually returns
- **Solution 3**: Reopen the app - drafts sync after reopening
- **Solution 4**: Check "Drafts" section - may have moved
- **Solution 5**: If lost, try working on the device you started on

#### ❌ "Can't Edit Submitted Audit"
**Problem**: Edit button not showing or greyed out
- **Solution 1**: Only your own audits are editable (not others')
- **Solution 2**: Check permissions with your manager
- **Solution 3**: Wait 5-10 minutes after submission before editing
- **Solution 4**: Refresh page to reload current state

#### ❌ "Score Seems Wrong"
**Problem**: Final score doesn't match expected calculation
- **Solution 1**: Check if any Zero Tolerance items failed (=0% entire audit)
- **Solution 2**: Count N/A responses - these don't count toward total
- **Solution 3**: Verify correct points for each response (2, 1, 0 for store sections)
- **Solution 4**: Review the score breakdown shown on form
- **Solution 5**: Contact manager to verify scoring rules

#### ❌ "PDF Won't Download"
**Problem**: PDF generation fails or doesn't download
- **Solution 1**: Check browser popup/download settings (may be blocked)
- **Solution 2**: Clear browser cache and try again
- **Solution 3**: Wait 30 seconds for PDF to generate
- **Solution 4**: Try different browser
- **Solution 5**: Contact support for manual PDF generation

#### ❌ "Login Issues"
**Problem**: Can't login or session expires
- **Solution 1**: Clear browser cache and cookies
- **Solution 2**: Try incognito/private browsing mode
- **Solution 3**: Ensure correct credentials (case-sensitive passwords)
- **Solution 4**: Reset password if forgotten
- **Solution 5**: Contact IT support

### Performance Issues

#### ❌ App Running Slow
- Close other browser tabs
- Clear browser cache
- Ensure good internet connection
- Refresh page
- Restart browser

#### ❌ Photos Loading Slowly
- Check image file sizes (reduce if > 5 MB)
- Ensure strong internet signal
- Close other apps using internet
- Try uploading one at a time instead of bulk

### Getting Help

**For Technical Issues:**
- Contact: IT Support / Technical Team
- Include: Error message, device type, browser type

**For Process Questions:**
- Contact: Your QA Manager
- Ask about: Scoring interpretation, when to use N/A, etc.

**For Account Issues:**
- Contact: HR / System Administrator
- Needed: Your employee ID, issue description

---

## Quick Reference

### Keyboard Shortcuts
- **Tab**: Move to next question
- **Shift+Tab**: Move to previous question
- **Ctrl+S** (Windows) / **⌘+S** (Mac): Manual save (if available)
- **Esc**: Close modals/dialogs

### Important Numbers
- **Total Questions**: ~100+
- **Total Possible Points**: 240
- **Submission Deadline**: As specified by your manager
- **Draft Retention**: Until manually deleted

### Score Thresholds
- **100%**: Perfect
- **90%+**: Excellent
- **80-89%**: Good
- **70-79%**: Acceptable
- **Below 70%**: Poor / Needs Improvement
- **0%**: Zero Tolerance violation

---

## Appendix: FAQ

### Q: Can I work on an audit from multiple devices?
**A**: Drafts are device-specific for security. Work on the same device/browser where you started.

### Q: What if the store doesn't have something asked about?
**A**: Select "N/A" (Not Applicable) - this question won't count toward their score.

### Q: Can I see what other auditors scored for the same store?
**A**: Yes - check the Dashboard to see historical audits for a store.

### Q: How long do drafts stay saved?
**A**: Indefinitely, until you manually delete them or clear browser cache.

### Q: Can a store manager see the score before I submit?
**A**: No - scores are only visible after final submission.

### Q: What if I find something new after submission?
**A**: Use the Edit function to update the audit with the new finding.

### Q: Do I need photos for every question?
**A**: No - add photos mainly for non-compliances or important evidence.

### Q: What's the difference between "Partially Compliant" and "Partially Not Compliant"?
**A**: Use "Partially Compliant" when items partially meet requirements. Not Compliant is when they fail the requirement.

---

## Document Information

- **Last Updated**: May 2026
- **Version**: 1.0
- **For**: QA Team
- **Contact**: QA Management / Support Team
