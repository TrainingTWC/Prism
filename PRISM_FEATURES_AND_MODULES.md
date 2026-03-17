# Prism Dashboard — Features & Modules

> **Last updated:** March 9, 2026  
> **Tech Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts · Google Apps Script · Supabase · Google Gemini AI

---

## 1. Authentication & Access Control

| Feature | Details |
|---|---|
| **Role-Based Password Login** | Separate passwords per department (HR, Operations, QA, Training, Finance, Store, Campus Hiring, Admin, Editor) |
| **EMPID URL Authentication** | Auto-login via `?EMPID=` query parameter |
| **Employee Validation** | Validates employee codes against the employee directory |
| **Session Management** | 24-hour session persistence via localStorage |
| **Admin / Editor Roles** | Full-access roles with config panel access |
| **Permission System** | Granular `hasPermission()` and `hasDashboardAccess()` checks per role |

### Roles Defined
`operations` · `hr` · `qa` · `training` · `finance` · `store` · `campus-hiring` · `forms` · `bench-planning` · `admin` · `editor`

**Key Files:** `config/auth.ts` · `contexts/AuthContext.tsx` · `roleMapping.ts` · `components/Login.tsx` · `components/AccessDenied.tsx`

---

## 2. Dashboards (Analytics & Reporting)

### 2.1 HR Dashboard
- Score distribution charts
- Average score by manager
- Region performance infographic
- AM (Area Manager) performance infographic
- HR performance infographic
- Question-level score breakdown
- AM radar chart
- AM scorecard section
- HRBP calendar modal
- HR detail modal
- RCA / CAPA analysis

### 2.2 Operations Dashboard
- Region performance infographic
- AM performance infographic
- Operations metrics infographic
- HR performance (operations view)
- Score distribution chart
- Average score chart
- Section scores infographic
- Radar chart

### 2.3 Training Dashboard
- Store performance chart
- Region performance infographic
- Score distribution chart
- AM performance infographic
- HR performance infographic
- Average score chart
- Radar chart
- Training health pie chart
- Training detail modal
- Training health breakdown modal

### 2.4 QA (Quality Assurance) Dashboard
- Region performance infographic
- Auditor performance infographic
- Score distribution chart
- Section scores infographic
- AM performance infographic
- Average score chart
- QA edit modal (inline editing)

### 2.5 Finance Dashboard
- Finance audit data visualization
- Historic data trends
- Signatures support
- Image & remarks support

### 2.6 SHLP Dashboard
- SHLP assessment data (36-question checklist)
- Score tracking per employee

### 2.7 Campus Hiring Dashboard
- Campus hiring statistics
- Category breakdown
- Excel export
- PDF reports
- Passwordless authentication for candidates
- URL auto-fill

### 2.8 Trainer Calendar Dashboard
- Monthly calendar view
- Trainer scheduling
- HRBP calendar modal
- NowBar for mobile

### 2.9 Bench Planning Dashboard
- Barista / SM bench planning
- SM-ASM bench planning
- Panelist dashboard & UI
- Mobile-optimized views

### 2.10 Consolidated / 4P Dashboard
- Consolidated cross-department view
- 4P framework mapping (People, Process, Product, Performance)

### 2.11 Multi-Month Trends (Historic)
- Header summary
- Store trends
- Unique stores pills
- Historic trends section
- Data loaded from Google Sheets monthly sync

**Key Files:** `components/Dashboard.tsx` (7,300+ lines) · `components/ConsolidatedDashboard.tsx` · `components/Consolidated4PDashboard.tsx` · `src/components/dashboard/` · `src/audit-dashboard/`

---

## 3. Checklists & Surveys

| Checklist | Description |
|---|---|
| **HR Checklist** | HR audit questions with scoring |
| **Operations Checklist** | Operational audit with store data |
| **Training Checklist** | Training audit assessment |
| **QA Checklist** | Quality assurance checks with image editing |
| **Finance Checklist** | Finance audit with image & remarks |
| **SHLP Checklist** | Store Health & Learning Program assessment |
| **Campus Hiring Checklist** | Campus recruitment evaluation |
| **Forms & Surveys** | Generic forms logger |
| **Trainer Calendar Checklist** | Trainer scheduling form |
| **Bench Planning Checklist** | Barista/SM bench planning form |
| **Bench Planning SM-ASM** | SM/ASM bench planning form |
| **Bench Planning BT** | Buddy-Trainer bench planning (Readiness → BT Session → Skill Check) |
| **Brew League Region Round** | Brew League competition — region round |
| **Brew League AM Round** | Brew League competition — AM round |
| **Brew League Dashboard** | Brew League results & standings |

**Key Files:** `components/checklists/` · `components/ChecklistsAndSurveys.tsx`

---

## 4. AI & Insights

| Feature | Details |
|---|---|
| **AI Insights Panel** | Google Gemini-powered analysis of survey remarks |
| **AI Overview Hero** | High-level summary block |
| **Category Analysis** | AI-driven category breakdown |
| **Insights Carousel** | Rotating insight cards |
| **Key Insights Block** | Top positive/negative findings |
| **Priority Heatmap** | AI-generated priority visualization |
| **Problem Breakdown** | Root cause analysis from AI |
| **Quick Actions** | AI-suggested action items |
| **Recommendations Panel** | AI recommendations per department |
| **Trend Analysis** | AI-powered trend detection |
| **Comment Analysis Service** | NLP analysis of free-text responses |
| **4P Analysis Service** | AI-driven People/Process/Product/Performance analysis |
| **Question Analysis Service** | Per-question AI scoring insights |

**Key Files:** `components/ai/` · `components/AIInsights.tsx` · `services/aiInsightsService.ts` · `services/commentAnalysisService.ts` · `services/fourPAnalysisService.ts` · `services/questionAnalysisService.ts`

---

## 5. Data Services & Integrations

| Service | Endpoint / Purpose |
|---|---|
| **HR Survey Data** | Google Apps Script → Google Sheets |
| **AM Operations Data** | Google Apps Script → Google Sheets |
| **Training Audit Data** | Google Apps Script → Google Sheets |
| **QA Assessment Data** | Google Apps Script → Google Sheets |
| **Finance Audit Data** | Google Apps Script → Google Sheets |
| **Finance Historic Data** | Google Apps Script → Google Sheets |
| **Campus Hiring Data** | Google Apps Script → Google Sheets |
| **SHLP Data** | Google Apps Script → Google Sheets |
| **Employee Directory** | Google Apps Script → Google Sheets (replaces Supabase) |
| **Store Mapping** | JSON files — comprehensive, TWC, HR mapping |
| **Supabase Client** | Supabase integration for employee setup |
| **Preload Service** | Background data preloading on app mount |
| **Request Queue** | Rate-limited AI request queue |

**Key Files:** `services/dataService.ts` · `services/shlpDataService.ts` · `services/employeeDirectoryService.ts` · `services/supabaseClient.ts` · `services/preloadService.ts` · `services/requestQueue.ts`

---

## 6. Google Apps Script Modules

| Script | Purpose |
|---|---|
| `google-apps-script.js` | Core HR survey data endpoint |
| `AM_Operations_google-apps-script.js` | AM Operations audit endpoint |
| `training-audit-google-apps-script.js` | Training audit endpoint |
| `qa-checklist-google-apps-script.js` | QA checklist endpoint |
| `finance-audit-google-apps-script.js` | Finance audit endpoint |
| `finance-historic-google-apps-script.js` | Finance historic data endpoint |
| `campus-hiring-google-apps-script.js` | Campus hiring endpoint |
| `shlp-google-apps-script.js` | SHLP assessment endpoint |
| `employee-directory-google-apps-script.js` | Employee directory endpoint |
| `store-mapping-google-apps-script.js` | Store mapping endpoint |
| `bench-planning-google-apps-script.js` | Bench planning endpoint |
| `buddy-trainer-bench-planning-google-apps-script.js` | Buddy-Trainer bench planning |
| `sm-asm-bench-planning-google-apps-script.js` | SM-ASM bench planning |
| `brew-league-complete-google-apps-script.js` | Brew League complete endpoint |
| `brew-league-am-round-google-apps-script.js` | Brew League AM round |
| `brew-league-region-google-apps-script.js` | Brew League region round |
| `brew-league-fetch-google-apps-script.js` | Brew League data fetch |
| `qa-drafts-google-apps-script.js` | QA drafts auto-save |
| `google-apps-script-trainer-calendar.js` | Trainer calendar endpoint |
| `google-apps-script-training-audit-api.js` | Training audit API |
| `google-apps-script/forms_logger.gs` | Forms & survey response logger |
| `google-apps-script/mt_feedback_logger.js` | Monthly trends feedback |

---

## 7. PDF & Excel Report Generation

| Feature | Details |
|---|---|
| **HR PDF Report** | `src/utils/hrReport.ts` |
| **Operations PDF Report** | `src/utils/operationsReport.ts` |
| **Training PDF Report** | `src/utils/trainingReport.ts` |
| **QA PDF Report** | `src/utils/qaReport.ts` |
| **SHLP PDF Report** | `src/utils/shlpReport.ts` |
| **Finance PDF Report** | `src/utils/financeReport.ts` |
| **Excel Export (XLSX)** | Via `xlsx` library for campus hiring & store health |
| **Store Health Export** | `components/StoreHealthExport.tsx` · `scripts/generate_store_health_xlsx.js` |
| **Image Integration** | QA & Finance PDF reports with image embedding |

---

## 8. UI / UX Components

| Component | Purpose |
|---|---|
| `Header.tsx` | App header with branding |
| `ThemeToggle.tsx` | Light/dark mode toggle (pearl morph animation) |
| `Loader.tsx` | Full-page spinner |
| `SkeletonLoader.tsx` | Content placeholder skeleton |
| `LoadingOverlay.tsx` | Semi-transparent loading overlay |
| `NotificationOverlay.tsx` | Toast-style notifications |
| `StatCard.tsx` | KPI stat card |
| `InfographicCard.tsx` | Visual infographic card |
| `ChartContainer.tsx` | Reusable chart wrapper |
| `DashboardFilters.tsx` | Date, region, manager filter bar |
| `ImageEditor.tsx` | In-app image annotation/editing |
| `NowBarMobile.tsx` | Mobile "now" indicator bar |

---

## 9. Contexts (Global State)

| Context | Purpose |
|---|---|
| `AuthContext` | Authentication state, role, permissions |
| `ThemeContext` | Light/dark theme state |
| `ConfigContext` | Runtime configuration (admin-editable) |
| `auditNavigationStore` | Zustand store for audit navigation state |

**Key Files:** `contexts/AuthContext.tsx` · `contexts/ThemeContext.tsx` · `contexts/ConfigContext.tsx` · `contexts/auditNavigationStore.ts`

---

## 10. Utilities

| Utility | Purpose |
|---|---|
| `mappingUtils.ts` | Load/resolve comprehensive store mapping |
| `amNameMapping.ts` | AM ID → Name resolution |
| `dateParser.ts` | Date format parsing (DD/MM/YYYY ↔ ISO) |
| `haptics.ts` | Mobile haptic feedback |
| `inputValidation.ts` | Form input sanitization |
| `secureStorage.ts` | Encrypted local storage wrapper |
| `securityLogger.ts` | Security event logging |
| `trainerMapping.ts` | Trainer ID → Name mapping |
| `trainingTestData.ts` | Static test data generation |

---

## 11. Hooks

| Hook | Purpose |
|---|---|
| `useComprehensiveMapping` | Fetches & caches comprehensive store-region-AM mapping |
| `useEmployeeDirectory` | Fetches & caches employee directory |
| `useTrendsData` | Fetches multi-month historic trend data |

---

## 12. AM CAPA Planner (Sub-App)

A standalone sub-application for Area Manager Corrective & Preventive Action (CAPA) planning.

| Feature | Details |
|---|---|
| Separate React + Vite app | Located in `am-capa-planner/` |
| RCA (Root Cause Analysis) module | `am-capa-planner/rca.js` |
| Checklist module | `am-capa-planner/checklist.js` |
| Integrations | `am-capa-planner/integrations.js` |
| Proxy server | `am-capa-planner/proxy/` |
| Training audit HTML view | `am-capa-planner/Trainingaudit.html` |

---

## 13. Server / API Layer

| Component | Purpose |
|---|---|
| `server/index.js` | Express API server |
| `server/proxy.js` | CORS proxy for Google Apps Script |
| `server/schema/` | JSON schemas for import metrics & response interpretation |
| `api/analyze.js` | AI analysis API endpoint |

---

## 14. Deployment & DevOps

| Item | Details |
|---|---|
| `deploy.ps1` / `deploy.sh` | Deployment scripts (Windows & Unix) |
| `.github/` | GitHub Actions CI/CD workflows |
| `.vercel/` | Vercel deployment configuration |
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.js` | Tailwind CSS theme customization |

---

## 15. Configuration & Mapping Files

| File | Purpose |
|---|---|
| `constants.ts` | Questions, stores, area managers, HR personnel, regions |
| `mappedStores.ts` | Store ID → region/AM/HR mapping |
| `roleMapping.ts` | User ID → role/permissions mapping |
| `hr_mapping.json` | HR organizational hierarchy |
| `store-mapping.json` | Store → region → AM mapping |
| `trainerMapping.json` | Trainer assignments |
| `twc_store_region_map.json` | Store-region geographic map |
| `src/comprehensive_store_mapping.json` | Full store mapping (primary) |
| `src/consolidated_4p_mapping.json` | 4P framework mapping data |
| `config/qaQuestions.ts` | QA assessment question bank |

---

## 16. Module Summary

| # | Module | Components |
|---|---|---|
| 1 | **Authentication** | Login, EMPID auth, role passwords, session mgmt |
| 2 | **HR Analytics** | Survey dashboard, score charts, PDF reports |
| 3 | **Operations Analytics** | AM ops dashboard, region/section analysis |
| 4 | **Training Analytics** | Training audit dashboard, health charts |
| 5 | **QA Analytics** | QA dashboard, auditor insights, inline editing |
| 6 | **Finance Analytics** | Finance audit dashboard, historic trends |
| 7 | **SHLP** | Store Health & Learning Program assessment |
| 8 | **Campus Hiring** | Recruitment tracking, candidate assessment |
| 9 | **Bench Planning** | Barista/SM/ASM bench planning & panelist UI |
| 10 | **Brew League** | Competition management (Store/AM/Region rounds) |
| 11 | **Trainer Calendar** | Trainer scheduling & calendar management |
| 12 | **AI Insights** | Gemini-powered analysis, recommendations |
| 13 | **Forms & Surveys** | Generic form/survey response collection |
| 14 | **Consolidated View** | Cross-department 4P dashboard |
| 15 | **Employee Directory** | Google Sheets-based employee lookup |
| 16 | **Report Generation** | PDF & Excel exports per department |
| 17 | **AM CAPA Planner** | Standalone corrective action planning app |
| 18 | **Server/API** | Express proxy, AI analysis, JSON schemas |

---

*Total: **18 modules**, **70+ components**, **10+ Google Apps Script integrations**, **6 PDF report generators**, **11 user roles***
