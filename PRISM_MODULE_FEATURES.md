# Prism — Comprehensive Module & Feature Reference

> **Generated:** March 17, 2026  
> **Modules covered:** 13 checklist/survey modules, 7 dashboard modules

---

## Table of Contents

- [Part 1: Consolidated Feature Matrix](#part-1-consolidated-feature-matrix)
- [Part 2: Module-by-Module Detail](#part-2-module-by-module-detail)
  - [1. Training Checklist](#1-training-checklist)
  - [2. QA Checklist](#2-qa-checklist)
  - [3. Finance Checklist](#3-finance-checklist)
  - [4. AM Operations Checklist](#4-am-operations-checklist)
  - [5. HR Employee Satisfaction Survey](#5-hr-employee-satisfaction-survey)
  - [6. SHLP Certification Tool](#6-shlp-certification-tool)
  - [7. Campus Hiring Assessment](#7-campus-hiring-assessment)
  - [8. Bench Planning — Barista to SM](#8-bench-planning--barista-to-sm)
  - [9. Bench Planning — SM to ASM](#9-bench-planning--sm-to-asm)
  - [10. Bench Planning — Buddy Trainer](#10-bench-planning--buddy-trainer)
  - [11. Brew League — AM Round](#11-brew-league--am-round)
  - [12. Brew League — Region Round](#12-brew-league--region-round)
  - [13. MT Feedback Form](#13-mt-feedback-form)
  - [14. Trainer Calendar](#14-trainer-calendar)
- [Part 3: Dashboards](#part-3-dashboards)
  - [Main Dashboard](#main-dashboard)
  - [Bench Planning Dashboards](#bench-planning-dashboards)
  - [Brew League Dashboard](#brew-league-dashboard)
  - [Trainer Calendar Dashboard](#trainer-calendar-dashboard)
  - [Consolidated / 4P Dashboards](#consolidated--4p-dashboards)

---

# Part 1: Consolidated Feature Matrix

## All Modules at a Glance

| # | Module | Questions | Sections | Scoring | Pass Threshold |
|---|--------|-----------|----------|---------|----------------|
| 1 | Training Checklist | 44 regular + 81 TSA = **125** | 7 regular + 3 TSA | Weighted (1-4 pts) + TSA 0/5/10 | None defined |
| 2 | QA Checklist | **116** | 5 (Zero Tolerance, Store, QA, Maintenance, HR) | Weighted (2-4 pts); ZT zero-out rule | None defined |
| 3 | Finance Checklist | **35** | 7 | Weighted (1-4 pts); max 70 | None defined |
| 4 | AM Operations Checklist | **63** | 6 | Flat: Yes=1, No=0 | None defined |
| 5 | HR Survey | **12** (10 scored + 2 text) | 1 flat list | Likert 1-5; max 50 | None defined |
| 6 | SHLP Certification | **35** | 8 | 0-2 scale + negative + positive; max ~76 | None defined |
| 7 | Campus Hiring | **30** MCQ | 6 categories | Weighted MCQ (1-3); normalized binary | None defined |
| 8 | Bench Planning (B→SM) | 11 readiness + 15 MCQ + 7 interview | 3 stages | 1-5 scale / MCQ / 1-5 | **80%** (readiness & assessment) |
| 9 | Bench Planning (SM→ASM) | 11 readiness + 20 MCQ + 7 interview | 3 stages | 1-5 scale / MCQ / 1-5 | **80%** (readiness & assessment) |
| 10 | Bench Planning (BT) | 23 readiness + 15 MCQ + 13 skill check | 3 steps | 0-2 / MCQ / Yes-No | 45/46 readiness; 80% assessment |
| 11 | Brew League AM Round | ~85 items | 14 sections | Weighted Yes/No/NA (0-5 pts) | None defined |
| 12 | Brew League Region Round | ~120 items | 17 sections | Weighted Yes/No/NA (0-5 pts) | None defined |
| 13 | MT Feedback Form | **16** (11 Likert + 5 text) | 6 | Weighted Likert; max 100% | None defined |
| 14 | Trainer Calendar | N/A (event planning) | N/A | N/A | N/A |

## Cross-Module Feature Comparison

| Feature | Training | QA | Finance | AM Ops | HR | SHLP | Campus | Bench (B→SM) | Bench (SM→ASM) | Bench (BT) | Brew AM | Brew Region | MT Form | Trainer Calendar |
|---------|:--------:|:--:|:-------:|:------:|:--:|:----:|:------:|:------------:|:--------------:|:----------:|:-------:|:-----------:|:-------:|:----------------:|
| **Auto-Save (localStorage)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Cloud Drafts** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Image Capture** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Image Editing** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Signature Pads** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **PDF Generation** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Geofencing** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Geotagging (GPS)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Proctoring** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Timer** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (30 min) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **One-Attempt Lock** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Time-Locked Access** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sequential Unlock** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Voice Commands** | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Employee Directory** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **URL Auto-fill** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Store Mapping** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Haptic Feedback** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Edit Mode** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Dark Mode** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Excel Export** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅† | ✅† | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Multi-Role Workflow** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> \* Voice commands are implemented but currently hidden in the UI  
> † Excel export is on the dashboard, not the checklist itself

---

# Part 2: Module-by-Module Detail

---

## 1. Training Checklist

**File:** `components/checklists/TrainingChecklist.tsx` (~3,442 lines)  
**Title:** "Training Management"  
**Subtitle:** "Comprehensive training assessment for trainers."  
**Theme:** Purple gradient

### Metadata Fields
| Field | Input Type | Auto-Fill |
|-------|-----------|-----------|
| Trainer Name / ID | Searchable dropdown | URL params, Store Mapping |
| Auditor Name / ID | Searchable dropdown | — |
| Store Location | Searchable dropdown | Cascading from Trainer |
| Area Manager | Read-only text | Auto from Store Mapping |
| MOD (Manager on Duty) | Dropdown | Filtered by store region |

### Sections

**Regular Sections (Yes / No / NA radio buttons):**

| # | Section | Items | Key Weights |
|---|---------|-------|-------------|
| 1 | Training Materials | 9 | w=1-2 each |
| 2 | LMS Usage | 3 | w=4, wneg=-4 (high-stakes) |
| 3 | Buddy Trainer Availability & Capability | 6 | w=1-2 each |
| 4 | New Joiner Training & Records | 7 | w=1-2 each |
| 5 | Partner Knowledge | 7 | w=1-3; PK_7 has wneg=-3 |
| 6 | Customer Experience | 9 | w=1-2 each |
| 7 | Action Plan & Continuous Improvement | 3 | w=1-2 each |

**TSA Sections (Collapsible Accordions, 0/5/10 scale):**

| # | Section | Items | Subsections |
|---|---------|-------|-------------|
| 8 | TSA — Food | 26 + 1 employee | Personal Hygiene, Station Readiness, Food Prep & Handling, Standards Ownership |
| 9 | TSA — Coffee | 26 + 1 employee | Personal Hygiene, Station Readiness, Coffee Prep & Handling |
| 10 | TSA — Customer Experience | 29 + 1 employee | Personal Hygiene, Station Readiness, Customer Handling, Handling Feedback & Complaints |

**TSA Scoring:** ≥85% → 10 pts, 75-84% → 5 pts, <75% → 0 pts (per TSA section)

### Special Features
- Section-level image upload (camera + gallery) with inline Image Editor
- Per-section remarks textarea
- Employee search dropdown for TSA sections (directory filtered by region)
- Voice commands (Push-to-Talk, Web Speech API) — currently hidden
- Local NLP parser for voice → checklist item mapping
- Configurable sections via remote config override
- Auto-save to localStorage on every change

### Layout
Single scrollable page. Regular sections: vertical cards with purple left border. TSA sections: collapsible accordions (orange/yellow/blue themes). Sticky submit footer with Reset + Submit.

### Submission
POST to Google Apps Script (URL-encoded). Payload includes: timestamp, all metadata, per-item responses, per-section remarks, section images (base64 JSON), TSA scores, total/max/percentage.

---

## 2. QA Checklist

**File:** `components/checklists/QAChecklist.tsx`  
**Title:** "Quality Assurance Assessment"  
**Subtitle:** "Comprehensive quality and safety assessment covering zero tolerance, maintenance, operations, and hygiene standards."  
**Theme:** Orange-to-red gradient

### Metadata Fields
| Field | Input Type | Auto-Fill |
|-------|-----------|-----------|
| QA Auditor Name / ID | Text input | Auth context (QA role), URL params |
| Area Manager | Searchable dropdown | Auto from Store Mapping |
| Store | Searchable dropdown | Store Mapping |
| City | Select dropdown (14 cities) | — |

### Sections

| # | Section | Items | Scoring | Special |
|---|---------|-------|---------|---------|
| 1 | Zero Tolerance | 6 | 4 pts each; Compliance / Non-Compliance only | **Any NC → entire audit score = 0** (in helper function) |
| 2 | Store | 94 | 2 pts each; Compliance / Partial / NC / NA | Partial = half weight |
| 3 | QA | 3 | 2 pts each | — |
| 4 | Maintenance | 11 | 2 pts each | — |
| 5 | HR | 2 | 2 pts each | — |

**Total: 116 questions, ~244 max points**

### Special Features
- **Per-question image upload** (camera + gallery) with inline Image Editor
- **Per-question remarks** textarea
- **Canvas signature pads** (2: Auditor + SM) — required for submission
- **Cloud-backed draft system** (save/load/delete via separate endpoint)
- **Edit mode** for updating previously submitted assessments
- **Test data autofill** button (for development/testing)
- **Retry with exponential backoff** (3 retries, 2s/4s/8s)
- Image compression to 800px, JPEG 0.6 quality

### Layout
Single scrollable page. Top: gradient banner + draft action buttons. Questions sequentially by section with orange left-border accent. Bottom: signature pads (2-col) + submit/reset buttons.

### Submission
POST to Google Apps Script (URL-encoded). Payload: all metadata, per-question responses, remarks, image counts, full images JSON, remarks JSON, signatures (base64), action (create/update), rowId.

---

## 3. Finance Checklist

**File:** `components/checklists/FinanceChecklist.tsx`  
**Title:** "Financial Controls Assessment"  
**Subtitle:** "Comprehensive financial audit covering cash management, revenue tracking, inventory controls, and compliance reporting."  
**Theme:** Emerald/teal gradient

### Metadata Fields
| Field | Input Type | Auto-Fill |
|-------|-----------|-----------|
| Finance Auditor Name / ID | Text input | Auth context (finance role), URL params |
| Area Manager | Searchable dropdown | Auto from Store Mapping |
| Store | Searchable dropdown | Store Mapping |

### Sections

| # | Section | Items | Weight Range |
|---|---------|-------|-------------|
| 1 | Cash Handling & Settlement | 6 | w=2-4 |
| 2 | Billing & Transactions | 6 | w=1-4 |
| 3 | Product & Inventory Compliance | 7 | w=1-4 |
| 4 | Documentation & Tracking | 4 | w=2 each |
| 5 | POS System & SOP | 4 | w=2 each |
| 6 | Licenses & Certificates | 5 | w=1 each |
| 7 | CCTV Monitoring | 3 | w=2-3 |

**Total: 35 questions, 70 max points. Only "Yes" earns points.**

### Special Features
- **Per-question image upload** (camera + gallery) — compressed to 800px
- **Per-question + per-section remarks** textareas
- **Canvas signature pads** (2: Auditor + SM) — required
- **PDF generation** via `jsPDF` + `jspdf-autotable` — auto-download on submit + post-submit download button
- **Region auto-detection** from Store Mapping

### Layout
Single scrollable page. Sections with emerald left-border accent. Numbered questions per section. Signature cards at bottom. Post-submission: green success card with "Download PDF" button.

### Submission
POST to Google Apps Script. Also generates and downloads PDF automatically.

---

## 4. AM Operations Checklist

**File:** `components/checklists/OperationsChecklist.tsx`  
**Title:** "AM Operations Checklist"  
**Subtitle:** "Flat scoring: Yes=1, No=0. N/A is excluded."  
**Theme:** Orange-to-red gradient

### Metadata Fields
| Field | Input Type | Auto-Fill |
|-------|-----------|-----------|
| HR Name | Searchable dropdown | URL EMPID → Store Mapping |
| Area Manager | Searchable dropdown | URL EMPID, auth context (operations role) |
| Trainer Name | Searchable dropdown | Auto from Store Mapping |
| Store | Searchable dropdown | Cascading filters |
| BSC Achievement % | Text input | — |
| No. of People on Shift | Number input | — |
| Manpower Fulfilment | Select (Low/Med/High) | — |
| Store Format | Disabled text | Auto from Store Mapping |
| Menu Type | Disabled text | Auto from Store Mapping |
| Price Group | Disabled text | Auto from Store Mapping |

### Sections

| # | Section | Items |
|---|---------|-------|
| 1 | Cheerful Greeting | 13 |
| 2 | Order Taking Assistance | 11 |
| 3 | Friendly & Accurate Service | 13 |
| 4 | Feedback with Solution | 13 |
| 5 | Enjoyable Experience | 7 |
| 6 | Enthusiastic Exit | 6 |

**Total: 63 questions. Flat binary: Yes=1, No=0, NA=excluded.**

### Special Features
- **Per-section image upload** (multi-image grid with hover-to-delete)
- **Per-section remarks** textarea
- **PDF generation** via `buildOperationsPDF()` — available post-submission
- **Sticky progress footer** with real-time score bar + percentage
- **URL EMPID polling** every 1 second for dynamic identity changes
- **Cascading dropdown filters** (AM → Stores → HR/Trainer)
- **Hardcoded trainer name overrides** (12 trainer IDs → names)

### Layout
Single scrollable page. Metadata card with multi-column grid. Section cards with orange accent + score badges. Sticky bottom bar with progress + submit.

### Submission
POST to Google Apps Script (URL-encoded, `mode: 'no-cors'`). Success screen with "Download PDF" button.

---

## 5. HR Employee Satisfaction Survey

**File:** `components/checklists/HRChecklist.tsx`  
**Title:** "HR Employee Satisfaction Survey"  
**Subtitle:** "Help us understand your experience and improve our workplace culture. All responses are confidential."  
**Theme:** Blue-to-indigo gradient

### Metadata Fields
| Field | Input Type | Auto-Fill |
|-------|-----------|-----------|
| HR Name | Select dropdown | Store Mapping HRBP columns, auth context |
| Area Manager | Read-only text | Auto from employee selection |
| Employee Name | Searchable typeahead | Employee directory (no region filter) |
| Employee ID | Read-only text | Auto from employee selection |
| Store Location | Read-only text | Auto from employee selection |

### Questions

| # | Question | Type | Scoring |
|---|----------|------|---------|
| 1 | Work pressure in the café? | Radio (5 options) | Reversed (Never=5) |
| 2 | Empowered to make decisions? | Radio (5 options) | Standard (Every time=5) |
| 3 | Regular performance reviews? | Radio (5 options) | Standard |
| 4 | Partiality or unfair treatment? | Radio (5 options) | Reversed (Never=5) |
| 5 | Getting training per Wings program? | Radio (5 options) | Standard |
| 6 | Issues with operational Apps/PF/ESI? | Radio (5 options) | Reversed (Never=5) |
| 7 | Gone through HR Handbook on Zing? | Radio (5 options) | Quality scale |
| 8 | Satisfied with work schedule? | Radio (5 options) | Standard |
| 9 | Team collaboration effectiveness? | Radio (5 options) | Quality scale |
| 10 | Name a helpful colleague | Text input | Not scored |
| 11 | Suggestions or support needed? | Textarea | Not scored |
| 12 | Rate your TWC experience (1-5) | Radio (5 options) | Quality scale |

**Total: 10 scored (max 50) + 2 text. Optional per-question remarks.**

### Special Features
- Reverse-scored negative questions (work pressure, partiality, app issues)
- Employee typeahead across entire directory (max 50 results)
- Reset preserves HR name/ID
- No images, no PDF, no geofencing

### Layout
Single scrollable page. Blue-themed cards. 3 sections: header banner, survey information, survey questions. Numbered questions with blue circle badges.

---

## 6. SHLP Certification Tool

**File:** `components/checklists/SHLPChecklist.tsx` (~1,100 lines)  
**Title:** "SHLP Certification Tool"  
**Subtitle:** "Comprehensive assessment tool for operational excellence certification using 0-2 scoring scale."  
**Theme:** Emerald-to-green gradient

### Metadata Fields
| Field | Input Type | Auto-Fill |
|-------|-----------|-----------|
| Auditor Name | Text input | — |
| Employee Name / ID | Searchable employee directory | Auto-fills store, AM, trainer |
| Store | GPS-filtered dropdown | Only stores within 100m |
| Area Manager | Read-only text | Auto from Store Mapping |
| Trainer | Read-only text | Auto from Store Mapping |

### Sections

| # | Section | Items | Special Items |
|---|---------|-------|---------------|
| 1 | Store Readiness | 4 | SHLP_1,2,3 → Negative scoring |
| 2 | Product Quality & Standards | 5 | SHLP_5 → Negative scoring |
| 3 | Cash & Administration | 5 | SHLP_11,13 → Negative scoring |
| 4 | Team Management | 8 | SHLP_15 → Negative; SHLP_20 → Positive |
| 5 | Operations & Availability | 7 | SHLP_23 → Negative; SHLP_28 → Positive |
| 6 | Safety & Compliance | 3 | Standard |
| 7 | Shift Closing | 1 | SHLP_33 → Has N/A option |
| 8 | Business Acumen | 2 | SHLP_34 → Positive scoring |

**Total: 35 questions. Three scoring types:**
- **Default**: 0 / 1 / 2 (max 2)
- **Negative**: Yes (+2) / No (−2) — 8 questions
- **Positive**: 0 / 1 / 2 / +2 Exceptional (max 4) — 3 questions

### Special Features
- **Geofencing (mandatory)**: Store dropdown only shows stores within 100m of GPS position. Submission blocked if outside geofence.
- **Geotagging**: GPS captured on mount (lat, lon, accuracy, timestamp). "View on Google Maps" link. "Refresh Location" button.
- **Employee directory search** with typeahead (name, ID, designation, store code)
- **Per-question optional remarks**
- **No auto-save** — data in React state only
- **No image capture**
- **Success modal** with auto-redirect after 3 seconds

### Layout
Single scrollable page. Sections as white cards with emerald progress bars. Location Verification card with geofence status (green/amber/red). Color-coded scoring badges per question.

---

## 7. Campus Hiring Assessment

**File:** `components/checklists/CampusHiringChecklist.tsx`  
**Title:** "Third Wave Coffee | Campus Drive — Psychometric Assessment"  
**Theme:** Cyan-to-blue gradient

### Metadata Fields
| Field | Input Type | Auto-Fill |
|-------|-----------|-----------|
| Candidate Name | Text input | URL EMPID → JSON lookup |
| Email Address | Email input | URL EMPID → JSON lookup |
| Campus Name | Searchable dropdown (47 campuses) | URL auto-fill |

### Question Categories

| # | Category | Questions | Options |
|---|----------|-----------|---------|
| 1 | Psychometric | Q1-Q5 | 3 options (A/B/C), graded 1-3 |
| 2 | English Proficiency | Q6-Q10 | 3 options |
| 3 | Numerical Aptitude | Q11-Q15 | 4 options |
| 4 | Logical Reasoning | Q16-Q20 | 4 options |
| 5 | Analytical Aptitude | Q21-Q25 | 4 options (Q24, Q25 have inline SVG diagrams) |
| 6 | Course Curriculum | Q26-Q30 | 4 options |

**Total: 30 MCQs. Psychometric kept as weighted (1-3); others normalized to binary (correct=1, incorrect=0).**

### Special Features (Comprehensive Proctoring)
- **Camera + Microphone** required before start
- **Face detection**: Pixel-based skin-tone analysis every 2 seconds; detects covered/turned camera
- **Noise detection**: Audio FFT analysis every 1 second; sustained noise flagging with 10s cooldown
- **Tab switch detection**: `visibilitychange` + `blur` events
- **Screenshot prevention**: Blocks PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5; CSS `user-select: none`; canvas overlay with `mix-blend-mode`; watermark overlay (candidate name + timestamp + "CONFIDENTIAL" at 5% opacity)
- **Right-click + copy/paste disabled**
- **Violation-based lockout**: 2 face violations → auto-submit + lock; 3 tab switches → auto-submit + lock
- **30-minute countdown timer** with color-coded urgency (cyan → orange → red pulse)
- **Auto-submit on timer expiry**
- **Auto-submit on page close** via `sendBeacon` API
- **Back button interception** with `popstate`
- **Auto-save**: answers + info to localStorage; draft restore if <1 hour old

### Layout
Two-phase: (1) Rules page with 8 rule cards + privacy notice + agreement prompt + Start button. (2) Assessment page with header timer, proctoring monitoring panel (face/tab/noise status + violations list), candidate info, progress bar, questions grouped by category, sticky submit bar.

### Submission
POST to Google Apps Script. Payload: candidate info, scores, per-question answers + weights + categories, per-category percentages, proctoring metadata (violations, counts, JSON detail log), IST timestamp. Also via `sendBeacon` on page close.

---

## 8. Bench Planning — Barista to SM

**File:** `components/checklists/BenchPlanningChecklist.tsx` (~1,448 lines)  
**Title:** "Bench Planning | Barista to SM"  
**Theme:** Blue (readiness), Green (assessment), Purple (interview) tabs

### Workflow Stages

**Stage 1 — Readiness Checklist (Manager fills)**

| # | Item | Scale |
|---|------|-------|
| 1 | Completed all LMS modules | 1-5 |
| 2 | Demonstrates understanding of SOPs | 1-5 |
| 3 | Shows understanding of food safety | 1-5 |
| 4 | Punctuality and attendance | 1-5 |
| 5 | Grooming and personal hygiene | 1-5 |
| 6 | Leads team huddles effectively | 1-5 |
| 7 | Takes initiative beyond assigned duties | 1-5 |
| 8 | Positive influence on team members | 1-5 |
| 9 | Coaches/mentors junior baristas | 1-5 |
| 10 | Manages shifts independently | 1-5 |
| 11 | Handles guest complaints effectively | 1-5 |

**Max: 55. Pass: 80% (≥44).**

**Stage 2 — Self Assessment (15 MCQs, candidate takes)**

Topics: café leadership, profit calculations, SOP adherence, queue management, break rotation, cash discrepancy, number series, resource deployment, wastage cost, customer handling, priority order, complaint resolution, staffing.

**Pass: 80% (≥12/15). One attempt only. Can be time-locked.**

**Stage 3 — Interview (7 competencies, panelist scores)**

| # | Competency | Scale |
|---|-----------|-------|
| 1 | Responsibility | 1-5 |
| 2 | Empathy | 1-5 |
| 3 | Service Excellence | 1-5 |
| 4 | Performance with Purpose | 1-5 |
| 5 | Ethics and Integrity | 1-5 |
| 6 | Collaboration | 1-5 |
| 7 | Trust | 1-5 |

**Max: 35. No explicit pass threshold. Plus overall comments textarea.**

### Roles
- **Manager**: Selects candidates, fills readiness checklist
- **Candidate**: Takes self-assessment (one shot), views own progress
- **Panelist**: Scores interview via Panelist Dashboard → "Take Interview"
- **Admin**: Full access, can load any candidate

### Layout
3-tab navigation (Readiness / Assessment / Interview) with lock/unlock icons and completion checkmarks.

---

## 9. Bench Planning — SM to ASM

**File:** `components/checklists/BenchPlanningSMASMChecklist.tsx` (~1,516 lines)  
**Title:** "Bench Planning | SM to ASM"  

### Differences from Barista-to-SM

| Aspect | Barista→SM | SM→ASM |
|--------|-----------|---------|
| Readiness items | 11 (barista-level skills) | 11 (SM-level: P&L, leadership, peak-hours, conflict resolution, cost control) |
| Assessment MCQs | 15 | **20** (harder: sales decline %, profit margins, adjusted costs with wastage+spoilage, multi-store leadership, vendor SLA) |
| Assessment pass | 80% (12/15) | 80% (**16/20**) |
| Interview sections | Same 7 competencies | Same 7 competencies |
| Manager tab visibility | All 3 tabs visible | Manager sees **only Readiness tab** |

### Readiness Items (SM→ASM Level)
1. Independent shift management
2. Leadership coaching
3. Peak-hour handling
4. Advanced training (P&L, inventory)
5. Problem-solving
6. Communication
7. Store performance metrics
8. Conflict resolution
9. Cost control / wastage / labour scheduling
10. Open-close protocols
11. TWC values demonstration

---

## 10. Bench Planning — Buddy Trainer

**File:** `components/checklists/BenchPlanningBTChecklist.tsx` (~1,615 lines)  
**Title:** "Bench Planning | Barista to Buddy Trainer"

### Step 1 — Readiness Checklist (23 items, 3 categories)

| Category | Items | Scale |
|----------|-------|-------|
| People Skills | 9 | 0/1/2 (Rarely=0, Sometimes=1, Usually=2) |
| Customer Service Skills | 8 | 0/1/2 |
| Work Ethic & Business Contribution | 6 | 0/1/2 |

**Max: 46. Pass: 45/46 (~98%).**

### Step 2 — BT Session

- **Attendance**: QR code scan + "Mark Attendance" button
- **Session Assessment**: 15 MCQs about buddy training principles
- **Pass: 80% (12/15)**

### Step 3 — Skill Check (13 items, 4 phases)

| Phase | Items | Input |
|-------|-------|-------|
| Prepare | 5 | Yes/No |
| Present | 3 | Yes/No |
| Practice | 3 | Yes/No |
| Follow-Up | 2 | Yes/No |

Plus remarks textarea. No explicit pass threshold.

### Roles
- **Manager / Area Manager**: Fill readiness (Step 1)
- **Candidate**: View status, mark session attendance
- **Trainer**: Mark attendance, complete session assessment + skill check (auto-routed to Step 2)

### Layout
3-step wizard (not tabs). Steps gated: Readiness → BT Session → Skill Check. Trainer blocked from Step 1.

---

## 11. Brew League — AM Round

**File:** `components/checklists/BrewLeagueAMRound.tsx` (~1,043 lines)  
**Title:** "Brew League - AM Round | Area Manager Level Competition Scoresheet"  
**Theme:** Amber-to-orange gradient

### Sections (Technical Mode — Manual Machine)

| # | Section | Items | Key Weights |
|---|---------|-------|-------------|
| 1 | Grooming & Hygiene | 8 | 1-2 pts each |
| 2 | Espresso (Dial-In) Start | 2 | Time capture |
| 3 | Espresso Shot 1 | 20 | Brew time/yield = 5 pts each |
| 4 | Espresso Shot 2 | 20 | Same as Shot 1 |
| 5 | Dial-In End Time | 1 | Time capture |
| 6 | Milk Based Beverages Start | 1 | Time capture |
| 7 | Cup-1 Beverage Select | 1 | Cappuccino/Latte/Flat white |
| 8 | Cup-1 Steaming | 10 | 1-3 pts |
| 9 | Cup-1 Pouring | 5 | Latte art pattern = 5 pts |
| 10 | Cup-2 Beverage Select | 1 | Cappuccino/Latte/Flat white |
| 11 | Cup-2 Steaming | 10 | Same as Cup-1 |
| 12 | Cup-2 Pouring | 5 | Same as Cup-1 |
| 13 | Milk End Time | 1 | Time capture |
| 14 | Sensory Score | 12 | 3-5 pts each |

### Modes
- **Technical + Manual**: All dial-in + milk sections
- **Technical + Automatic**: Dial-in sections hidden (no manual grinding)
- **Sensory**: Only Sensory Score section visible

### Special Features
- **Time capture buttons** with elapsed time calculation (Xm Ys)
- **Scoresheet Type toggle** (Technical/Sensory)
- **Machine Type toggle** (Manual/Automatic)
- **PDF generation** via jsPDF — auto-download on submit
- **Per-section image upload** (grooming photos, sensory cup photos)
- **Employee directory autofill** for participant details

### Submission
POST to Google Apps Script. Also generates PDF: `BrewLeague_AMRound_{name}_{timestamp}.pdf`. Post-submit reset prompt.

---

## 12. Brew League — Region Round

**File:** `components/checklists/BrewLeagueRegionRound.tsx` (~1,136 lines)  
**Title:** "Brew League - Region Round | Regional Competition Scoresheet"  
**Theme:** Amber gradient

### Differences from AM Round

| Aspect | AM Round | Region Round |
|--------|----------|-------------|
| Cups evaluated | **2** | **3** |
| Espresso in milk cups | No (dial-in only) | **Yes** (full extraction per cup) |
| Cup pouring items | 5 per cup | **6-7 per cup** (+ identical art, no spillage, milk wastage) |
| Cup-2 steaming extra | — | "Explain milk steaming process" |
| End section extras | — | Counter Clean (5 pts) + Coupons Redeemed |
| Area Manager field | Yes | No |
| Sensory sections | Inline | Separate array |
| Image localStorage | Not persisted | Persisted |
| Post-submit | Reset prompt | Success toast |

### Sections (17 total)
Same structure as AM Round but with 3 cups + larger evaluation scope. ~120 items total. Counter Clean is worth 5 points (highest-weighted EndTime item).

---

## 13. MT Feedback Form

**File:** `components/checklists/FormsChecklist.tsx`  
**Title:** "Management Trainee Feedback Form" (v1.0)  
**Subtitle:** "Formal MT feedback with weighted scoring across key learning and workplace dimensions."  
**Theme:** Cyan accent

### Metadata Fields
| Field | Input Type | Auto-Fill |
|-------|-----------|-----------|
| Name | Text input | URL `?nm=` param |
| Store | Searchable dropdown | Store Mapping |
| AM | Text input | Auto from Store Mapping |
| Trainer | Text input | Auto from Store Mapping |

### Sections (Weighted)

| # | Section | Weight | Questions |
|---|---------|--------|-----------|
| 1 | Overall Experience | 15% | Q1 (15%) |
| 2 | Training Effectiveness | 25% | Q2 (10%), Q3 (10%), Q4 (5%) |
| 3 | Trainer & On-Ground Support | 25% | Q5 (10%), Q6 (7%), Q7 (8%) |
| 4 | Workplace Culture & Environment | 15% | Q8 (7%), Q9 (8%) |
| 5 | Application & Readiness | 20% | Q10 (12%), Q11 (8%) |
| 6 | Open Feedback | 0% | Q12-Q16 (text only) |

### Input Types
- **Likert slider (1-5)**: Q1-Q11 — HTML range slider with numbered labels
- **Textarea**: Q12-Q16 — free-form text

### Scoring
Per-question: `(value / 5) × 100 × (weight%)`. All weights sum to 100%. Final score: 0-100.

### Layout
Single scrollable page. Cyan-themed cards with left border accent. Likert sliders with "Selected: N" readout. Post-submission: green success card.

---

## 14. Trainer Calendar

**Files:** `components/checklists/TrainerCalendarChecklist.tsx` (wrapper, 46 lines) + `components/checklists/TrainingCalendar.tsx` (core, 772 lines)  
**Title:** "Trainer Calendar"  
**Subtitle:** "Plan and manage monthly training schedules and activities."  
**Theme:** Purple gradient

### Event Types
| Type | Color | Icon |
|------|-------|------|
| Store | Blue | Store |
| Campus | Green | Calendar |
| Outdoor | Amber | MapPin |

### Task Types (13)
Store Visits, Classroom session, Induction, TTT-LTO & New Launches, Brew League, NSO, Weekly Off, IDP Reviews, Campus Interview, SM Meet, Admin Day, External Championship, BT Certification

### Campus List
32 pre-defined IHM / hotel management institutes across India

### Features
- **Monthly calendar grid** (Sun-Sat) with color-coded event pills
- **Two-panel layout**: Calendar (left, flexible) + Event Form (right, fixed 384px)
- **Inline edit & delete** (hover-revealed buttons on event pills)
- **localStorage persistence** per trainer
- **Trainer ID auto-mapping** (12 hardcoded trainer ID → name mappings)
- **Role detection**: Trainer, LMS Head, Area Manager, HRBP from `trainerMapping.json`
- **Comprehensive store search** + campus search with live filtering
- **Campus auto-selects** "Campus placement" task type

### Submission
Submit Calendar sends all events as JSON POST to Google Apps Script. Payload: `trainerId`, `trainerName`, `month`, `events[]` array.

---

# Part 3: Dashboards

---

## Main Dashboard

**File:** `components/Dashboard.tsx` (~7,352 lines)  
**Title:** Multi-tab analytics hub — the primary app dashboard

### Data Domains
- HR Submissions
- AM Operations
- Training Audits
- QA Audits
- Finance
- SHLP
- Campus Hiring

### Features
- `DashboardFilters` component for cross-domain filtering
- Role-based access (`canAccessStore`, `canAccessAM`, `canAccessHR`)
- Imports PDF builders for each domain
- Recharts for charts (radar, bar, line, etc.)
- Sub-dashboards: `ConsolidatedDashboard`, `TrainerCalendarDashboard`, `BenchPlanningDashboard`, `CampusHiringStats`
- Multi-month trend sections
- Region/AM/HR/question infographics
- Scorecards and modals

### Data Sources
Fetches from: `fetchSubmissions`, `fetchAMOperationsData`, `fetchTrainingData`, `fetchQAData`, `fetchFinanceData`, `fetchSHLPData`, `fetchCampusHiringData`, `fetchFinanceHistoricData` — all Google Sheets-backed.

---

## Bench Planning Dashboards

### Admin Dashboards (2)

| Dashboard | Pipeline | File |
|-----------|----------|------|
| Barista → SM | `BenchPlanningDashboard.tsx` (988 lines) | Barista to Shift Manager |
| SM → ASM | `BenchPlanningSMASMDashboard.tsx` (988 lines) | SM to Assistant Store Manager |

**Both share identical structure:**
- **Stats Cards (4)**: Total Candidates, Readiness Passed, Assessment Complete, Interview Complete (with progress bars)
- **Readiness Breakdown (3)**: Passed/Failed/Pending cards
- **View Tabs (4)**: Summary, Region-wise, Store-wise, AM-wise
- **Region Table**: Columns for each pipeline stage with pass/fail/pending badges
- **Store-wise View**: Expandable cards per store with inner candidate table
- **AM-wise View**: Grouped by Area Manager
- **Search**: Full-text across employee/manager/store
- **Filters**: Region dropdown, Readiness Status, filter badge count
- **Excel Export**: `.xlsx` download with pre-set column widths
- **Status Badges**: Passed (green ✓), Failed (red ✗), Pending (gray ⏳)

### Panelist Dashboards (2)

| Dashboard | Pipeline | File |
|-----------|----------|------|
| Barista → SM | `BenchPlanningPanelistDashboard.tsx` (447 lines) | For Barista-to-SM panelists |
| SM → ASM | `BenchPlanningSMASMPanelistDashboard.tsx` (445 lines) | For SM-to-ASM panelists |

**Both share identical structure:**
- Purple-to-indigo gradient header
- Candidate search bar
- Desktop table + mobile card responsive views
- 7 columns: Candidate, AM/Trainer, Store, Readiness, Assessment, Interview, Action
- Summary stats (4): Total Assigned, Readiness Passed, Ready for Interview, Interviews Done
- "Take Interview" / "Review" action buttons (gated by assessment pass)

---

## Brew League Dashboard

**File:** `components/checklists/BrewLeagueDashboard.tsx` (561 lines)  
**Title:** "Coffee Championship Performance Analytics"  
**Theme:** Amber gradient

### Features
- **Dual-endpoint fetch**: Region Round + AM Round data loaded in parallel
- **5 Filters**: Round, Employee, Region, Scoresheet Type, Machine Type
- **KPI Cards (4)**: Total Participants, Total Submissions, Average Score %, Top Score %
- **Top 10 Leaderboard**: Ranked by percentage (gold/silver/bronze medallions)
- **Recent Submissions (5)**: Shows round type, AM, region, machine, scoresheet, timestamp
- **Regional Breakdown**: Average score + submission count per region
- **Color-coded scores**: ≥90% green, ≥80% blue, ≥70% yellow, <70% gray

---

## Trainer Calendar Dashboard

**File:** `components/TrainerCalendarDashboard.tsx` (380 lines)  
**Title:** "Trainer Calendar Dashboard"

### Features
- **Month navigation** (prev/next)
- **Trainer name filter** dropdown
- **Toggle filter panel**
- **Calendar event grid** with color-coded entries

### Data Source
Google Apps Script: `VITE_TRAINER_CALENDAR_SCRIPT_URL?action=fetch`

---

## Consolidated / 4P Dashboards

### Consolidated Dashboard
**File:** `components/ConsolidatedDashboard.tsx` (1,032 lines)  
Cross-functional overview. Receives HR, AM Ops, Training, QA, Finance data as props. Runs **AI-powered 4P analysis** (`generate4PAnalysis()`).

### Consolidated 4P Dashboard
**File:** `components/Consolidated4PDashboard.tsx` (314 lines)  
AI-driven 4P framework view (People, Process, Product, Place). Date range + Region + Store + AM filters. Cached analysis results.

---

*End of document.*
