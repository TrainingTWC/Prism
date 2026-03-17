# Prism Dashboard — UI Structure & Layout Guide

> **Last updated:** March 14, 2026  
> **Tech Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts · Lucide Icons  
> **Theming:** Light / Dark mode via `ThemeContext` + pearl morph toggle animation

---

## Table of Contents

1. [App Shell & Provider Hierarchy](#1-app-shell--provider-hierarchy)
2. [Authentication Flow (What the User Sees First)](#2-authentication-flow)
3. [Main Layout (Authenticated)](#3-main-layout-authenticated)
4. [Tab 1: Dashboard](#4-tab-1-dashboard)
5. [Tab 2: Checklists & Surveys](#5-tab-2-checklists--surveys)
6. [Tab 3: Admin (Editor Only)](#6-tab-3-admin-editor-only)
7. [Component Map](#7-component-map)
8. [File → Screen Reference](#8-file--screen-reference)

---

## 1. App Shell & Provider Hierarchy

```
App.tsx
├── <AuthProvider>          ← Authentication state, login/logout, EMPID validation
│   ├── <ConfigProvider>    ← Runtime config (admin-editable via Supabase/JSON)
│   │   └── <ThemeProvider> ← Light/dark mode state
│   │       └── <AppContent /> ← All routing & view logic
```

**Context providers wrap the entire app.** Every child component can access:
- `useAuth()` — role, permissions, employee data, login/logout
- `useConfig()` — dynamic questions, store lists, feature flags
- Theme state (`dark:` Tailwind classes respond automatically)

---

## 2. Authentication Flow

The app has **three gate screens** shown before the main UI, in this order:

### 2.1 Loading Screen
| What | Details |
|---|---|
| **When** | While `AuthContext` checks localStorage session + URL params |
| **UI** | Full-screen centered spinner with "Checking authentication..." text |
| **File** | Inline in `App.tsx` |

### 2.2 Access Denied Screen
| What | Details |
|---|---|
| **When** | No `?EMPID=` parameter found in the URL |
| **UI** | Full-screen dramatic red/black gradient with animated warning icon, "ACCESS DENIED" heading, humorous message: *"The firewall just whispered your name to the admin. Good luck..."*, animated pulse border |
| **File** | `components/AccessDenied.tsx` |

### 2.3 Login / Password Screen
| What | Details |
|---|---|
| **When** | Valid `?EMPID=` found but user not yet authenticated |
| **UI** | Centered card with Prism logo (96×96 SVG), gradient "PRISM" title, "Powered by Third Wave Coffee" subtitle, employee welcome banner (green, if EMPID validated), password input with eye toggle, sign-in button with loading spinner, error alert (red), info box about 24-hour session |
| **File** | `components/Login.tsx` |

**Flow diagram:**
```
URL visit
  │
  ├── No ?EMPID= → ACCESS DENIED (red full-screen)
  │
  └── Has ?EMPID=
       ├── Employee validated → Show green welcome banner
       └── Enter password
            ├── Wrong → Red error alert, retry
            └── Correct → Success toast (2s) → Main App
```

---

## 3. Main Layout (Authenticated)

Once authenticated, the user sees this persistent shell:

```
┌─────────────────────────────────────────────────────┐
│  HEADER                                              │
│  [Prism Logo + "PRISM"] [Role Badge]  [Sign Out] [🌙]│
├─────────────────────────────────────────────────────┤
│  TAB BAR                                             │
│  [📊 Dashboard]  [☑️ Checklists & Surveys]  [⚙ Admin]│
├─────────────────────────────────────────────────────┤
│                                                      │
│                  MAIN CONTENT                        │
│          (changes based on active tab)               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 3.1 Header (`components/Header.tsx`)
| Element | Position | Details |
|---|---|---|
| **Prism Logo** | Left | SVG logo (`prism-logo-kittl.svg`) with inline SVG fallback, 32×32 |
| **"PRISM" Title** | Left, next to logo | Gradient text (purple → blue → cyan), uppercase, bold |
| **Role Badge** | Left, after title | Hidden on mobile. Pill with shield icon + role name (e.g., "Operations", "Administrator"). Color-coded per role |
| **Sign Out Button** | Right | `LogOut` icon, label hidden on mobile. Confirmation dialog on click |
| **Theme Toggle** | Right, far end | Pearl morph animated light/dark toggle (`ThemeToggle.tsx`) |

### 3.2 Tab Navigation Bar (inline in `App.tsx`)
| Tab | Icon | Visible To |
|---|---|---|
| **Dashboard** | `BarChart3` | Roles with `dashboard` permission |
| **Checklists & Surveys** | `CheckSquare` | All authenticated users |
| **Admin** | `HelpCircle` | `editor` and `admin` roles only |

- Horizontal scrollable on mobile
- Active tab has sky-blue bottom border + sky-blue text
- Inactive tabs have subtle hover effects
- Mobile shows first word of label only (e.g., "Checklists" instead of "Checklists & Surveys")

---

## 4. Tab 1: Dashboard

**File:** `components/Dashboard.tsx` (7,300+ lines)

The Dashboard is a **single mega-component** that renders different analytics views based on a **dashboard type selector**. It does NOT use a router — it's all conditional rendering.

### 4.1 Dashboard Type Selector

At the top, a grid of colored buttons lets the user switch between dashboard views. **Which buttons appear depends on the user's role:**

| Dashboard Type | Button Color | Label | Access |
|---|---|---|---|
| `hr` | Blue | HR Employee Surveys | HR, Admin, Editor |
| `operations` | Orange | Operations Checklists | Operations, Admin, Editor |
| `training` | Purple | Training Audits | Training, Admin, Editor |
| `qa` | Red | QA Assessments | QA, Admin, Editor |
| `finance` | Green | Finance Reports | Finance, Admin, Editor |
| `shlp` | Emerald | SHLP Certification | Admin, Editor |
| `campus-hiring` | Indigo | Campus Hiring | HR, Admin, Editor |
| `trainer-calendar` | Purple | Trainer Calendar | Training, Admin, Editor |
| `bench-planning` | Orange | Bench Planning (Barista→SM) | HR, Training, Admin, Editor |
| `bench-planning-sm-asm` | Amber | Bench Planning (SM→ASM) | HR, Training, Admin, Editor |
| `consolidated` | Slate | Consolidated View | **Editor only** |

### 4.2 Common Dashboard Elements

Below the type selector, most dashboards share these elements:

```
┌─────────────────────────────────────────────┐
│  Dashboard Type Selector (colored buttons)   │
├─────────────────────────────────────────────┤
│  DashboardFilters                           │
│  [Region ▼] [Store ▼] [AM ▼] [Date Range]  │
│  [Download PDF] [Download Excel] [Reset]    │
├─────────────────────────────────────────────┤
│  Stat Cards Row                             │
│  [Total Audits] [Unique Stores] [Employees] │
│  [Average Score]                            │
├─────────────────────────────────────────────┤
│  Dashboard-specific content (see below)      │
│  Charts, infographics, tables, modals...    │
└─────────────────────────────────────────────┘
```

**`DashboardFilters.tsx`** — Shared filter bar with:
- Region dropdown
- Store dropdown  
- Area Manager dropdown
- HR Personnel dropdown (HR dashboard)
- Trainer dropdown (Training dashboard)
- Employee filter (SHLP dashboard)
- Date range picker
- PDF download button
- Excel download button
- Reset filters button

**`StatCard.tsx`** — KPI cards showing:
- Total audits/submissions count
- Unique stores audited
- Unique employees/trainers involved
- Average score (with trend indicator)

### 4.3 HR Dashboard (`dashboardType === 'hr'`)
```
┌ Stat Cards ────────────────────────────┐
│ Total Audits | Stores | Employees | Avg│
├────────────────────────────────────────┤
│ ScoreDistributionChart                 │
│ (histogram of score ranges)            │
├────────────────────────────────────────┤
│ AverageScoreByManagerChart             │
│ (bar chart, scores per AM)             │
├────────────────────────────────────────┤
│ RegionPerformanceInfographic           │
│ (cards per region with scores)         │
├────────────────────────────────────────┤
│ AMPerformanceInfographic               │
│ (cards per Area Manager)               │
├────────────────────────────────────────┤
│ HRPerformanceInfographic               │
│ (cards per HR personnel)               │
├────────────────────────────────────────┤
│ QuestionScoresInfographic              │
│ (per-question score breakdown)         │
├────────────────────────────────────────┤
│ AMRadarChart                           │
│ (multi-axis radar per AM)              │
├────────────────────────────────────────┤
│ AMScorecardSection                     │
│ (detailed AM scorecard table)          │
├────────────────────────────────────────┤
│ RCACapaAnalysis                        │
│ (Root Cause + CAPA analysis)           │
└────────────────────────────────────────┘

Modals (overlay):
  • HRDetailModal — clicked HR person details
  • HRBPCalendarModal — HRBP schedule calendar
  • AuditScoreDetailsModal — audit deep-dive
```

### 4.4 Operations Dashboard (`dashboardType === 'operations'`)
```
┌ Stat Cards ────────────────────────────┐
├────────────────────────────────────────┤
│ OperationsRegionPerformanceInfographic │
├────────────────────────────────────────┤
│ OperationsAMPerformanceInfographic     │
├────────────────────────────────────────┤
│ OperationsMetricsInfographic           │
├────────────────────────────────────────┤
│ OperationsHRPerformanceInfographic     │
├────────────────────────────────────────┤
│ OperationsScoreDistributionChart       │
├────────────────────────────────────────┤
│ OperationsAverageScoreChart            │
├────────────────────────────────────────┤
│ OperationsSectionScoresInfographic     │
├────────────────────────────────────────┤
│ OperationsRadarChart                   │
└────────────────────────────────────────┘

Modal: AMOpsAIAnalysisModal
```

### 4.5 Training Dashboard (`dashboardType === 'training'`)
```
┌ Stat Cards ────────────────────────────┐
├────────────────────────────────────────┤
│ Multi-Month Trends Section (if data):  │
│  ├ HeaderSummary                       │
│  ├ UniqueStoresPills                   │
│  ├ StoreTrends                         │
│  └ HistoricTrendsSection               │
├────────────────────────────────────────┤
│ TrainingStorePerformanceChart          │
├────────────────────────────────────────┤
│ TrainingRegionPerformanceInfographic   │
├────────────────────────────────────────┤
│ TrainingScoreDistributionChart         │
├────────────────────────────────────────┤
│ TrainingAMPerformanceInfographic       │
├────────────────────────────────────────┤
│ TrainingHRPerformanceInfographic       │
├────────────────────────────────────────┤
│ TrainingAverageScoreChart              │
├────────────────────────────────────────┤
│ TrainingRadarChart                     │
├────────────────────────────────────────┤
│ TrainingHealthPieChart                 │
└────────────────────────────────────────┘

Modals:
  • TrainingDetailModal — store/region breakdown
  • TrainingHealthBreakdownModal — health category detail
```

### 4.6 QA Dashboard (`dashboardType === 'qa'`)
```
┌ Stat Cards (3 columns) ───────────────┐
├────────────────────────────────────────┤
│ QARegionPerformanceInfographic         │
├────────────────────────────────────────┤
│ QAAuditorPerformanceInfographic        │
├────────────────────────────────────────┤
│ QAScoreDistributionChart               │
├────────────────────────────────────────┤
│ QASectionScoresInfographic             │
├────────────────────────────────────────┤
│ QAAMPerformanceInfographic             │
├────────────────────────────────────────┤
│ QAAverageScoreChart                    │
└────────────────────────────────────────┘

Modal: QAEditModal (inline editing of QA submissions)
```

### 4.7 Finance Dashboard (`dashboardType === 'finance'`)
```
┌ Stat Cards ────────────────────────────┐
├────────────────────────────────────────┤
│ Finance Audit Table                    │
│ (expandable rows with images/remarks)  │
├────────────────────────────────────────┤
│ Finance Historic Data Section          │
│ (trends from Google Sheets sync)       │
├────────────────────────────────────────┤
│ Signatures display                     │
└────────────────────────────────────────┘
```

### 4.8 SHLP Dashboard (`dashboardType === 'shlp'`)
```
┌ Stat Cards ────────────────────────────┐
├────────────────────────────────────────┤
│ SHLP Assessment Data Table             │
│ (36-question checklist results)        │
│ Score tracking per employee            │
└────────────────────────────────────────┘
```

### 4.9 Campus Hiring Dashboard (`dashboardType === 'campus-hiring'`)
```
(No DashboardFilters shown)

┌────────────────────────────────────────┐
│ CampusHiringStats                      │
│ (psychometric assessment results,      │
│  category breakdown, stats cards)      │
└────────────────────────────────────────┘
```

### 4.10 Trainer Calendar Dashboard (`dashboardType === 'trainer-calendar'`)
```
(No DashboardFilters shown)

┌────────────────────────────────────────┐
│ TrainerCalendarDashboard               │
│ (monthly calendar, trainer scheduling, │
│  NowBarMobile for mobile devices)      │
└────────────────────────────────────────┘
```

### 4.11 Bench Planning Dashboards
```
dashboardType === 'bench-planning':
┌────────────────────────────────────────┐
│ BenchPlanningDashboard                 │
│ (Barista→SM promotion tracking)        │
└────────────────────────────────────────┘

dashboardType === 'bench-planning-sm-asm':
┌────────────────────────────────────────┐
│ BenchPlanningSMASMDashboard            │
│ (SM→ASM promotion tracking)           │
└────────────────────────────────────────┘
```

### 4.12 Consolidated Dashboard (`dashboardType === 'consolidated'`)
```
(Editor-only)

┌────────────────────────────────────────┐
│ ConsolidatedDashboard                  │
│ (cross-department aggregated view)     │
├────────────────────────────────────────┤
│ Consolidated4PDashboard                │
│ (People/Process/Product/Performance    │
│  4P framework analysis)                │
├────────────────────────────────────────┤
│ CampusHiringStats (if data exists)     │
└────────────────────────────────────────┘
```

---

## 5. Tab 2: Checklists & Surveys

**File:** `components/ChecklistsAndSurveys.tsx` (555 lines)

### 5.1 Overview Screen (no checklist selected)

```
┌─────────────────────────────────────────────┐
│  "Checklists & Surveys"                     │
│  "Complete departmental checklists..."       │
├─────────────────────────────────────────────┤
│  Checklist Grid (responsive columns)        │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 🔵 HR     │ │ 🟢 Ops    │ │ 🟣 Train  │    │
│  │ 0/0      │ │ 0/0      │ │ 0/0      │    │
│  │ ━━━━━    │ │ ━━━━━    │ │ ━━━━━    │    │
│  │ Open →   │ │ Open →   │ │ Open →   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 🟠 QA     │ │ 🔴 Finance│ │ 🟢 SHLP   │    │
│  │ Open →   │ │ Open →   │ │ Open →   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 🟣 Campus │ │ 🟢 Forms  │ │ 🟣 Calendar│    │
│  │ Open →   │ │ Open →   │ │ Open →   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  ┌──────────┐ ┌──────────┐                  │
│  │ 🔵 Bench  │ │ 🟡 Brew   │                  │
│  │ Open →   │ │ League → │                  │
│  └──────────┘ └──────────┘                  │
└─────────────────────────────────────────────┘
```

Each card shows:
- Colored icon (14×14 with rounded container)
- Checklist name
- Progress bar (completed/total)
- Score percentage
- "Open Checklist →" link

**Grid adapts:** 1 col mobile → 2 col tablet → 3 col desktop → up to 5 col widescreen

**Visibility:** Cards are filtered by role permissions. Admin/Editor see all 11 checklists.

### 5.2 Active Checklist View (fullscreen overlay)

When a user taps a checklist card, a **fullscreen overlay** takes over the entire screen:

```
┌─────────────────────────────────────────────┐
│  [← Back] Checklists / HR        0/46  [🌙] [↗]│
├─────────────────────────────────────────────┤
│                                              │
│         CHECKLIST FORM CONTENT               │
│  (scrollable, each checklist is different)   │
│                                              │
│                                              │
└─────────────────────────────────────────────┘
```

**Header Bar:**
- Back button (← arrow)
- Breadcrumb: `Checklists / [Name]` (or `Checklists / Bench Planning / Shift Manager`)
- Completion counter (e.g., "12/46 completed")
- Theme toggle
- Sign out button

### 5.3 Individual Checklists

| Checklist | File | Description |
|---|---|---|
| **HR** | `checklists/HRChecklist.tsx` | HR audit questions with scoring, store selection, remarks |
| **Operations** | `checklists/OperationsChecklist.tsx` | Operations audit with store data, section-based scoring |
| **Training** | `checklists/TrainingChecklist.tsx` | Training audit assessment with health metrics |
| **QA** | `checklists/QAChecklist.tsx` | Quality assurance checks with **image editing** (`ImageEditor.tsx`) |
| **Finance** | `checklists/FinanceChecklist.tsx` | Finance audit with image upload & remarks |
| **SHLP** | `checklists/SHLPChecklist.tsx` | Store Health & Learning Program (36 questions) |
| **Campus Hiring** | `checklists/CampusHiringChecklist.tsx` | Candidate evaluation with psychometric scoring |
| **Forms & Surveys** | `checklists/FormsChecklist.tsx` | Generic form/survey response collection |
| **Trainer Calendar** | `checklists/TrainerCalendarChecklist.tsx` | Trainer scheduling form (also see `TrainingCalendar.tsx`) |

All checklists extend or follow patterns from `checklists/BaseChecklist.tsx`.

### 5.4 Bench Planning Sub-Navigation

When "Bench Planning" is selected, a **3-card sub-menu** appears:

```
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  🟢 Barista    │  │  🔵 Barista    │  │  🟣 Shift Mgr  │
│  to Buddy     │  │  to Shift     │  │  to ASM       │
│  Trainer      │  │  Manager      │  │               │
│  (3 steps)    │  │               │  │               │
│  Open →       │  │  Open →       │  │  Open →       │
└───────────────┘  └───────────────┘  └───────────────┘
```

| Sub-option | File | Details |
|---|---|---|
| Barista → Buddy Trainer | `checklists/BenchPlanningBTChecklist.tsx` | 3-step process: Readiness → BT Session → Skill Check |
| Barista → Shift Manager | `checklists/BenchPlanningChecklist.tsx` | Single assessment form |
| SM → ASM | `checklists/BenchPlanningSMASMChecklist.tsx` | Single assessment form |

**Panelist Views** (separate dashboard components):
- `checklists/BenchPlanningPanelistDashboard.tsx`
- `checklists/BenchPlanningSMASMPanelistDashboard.tsx`

### 5.5 Brew League Sub-Navigation

When "Brew League" is selected, a **2-card + dashboard button** layout appears:

```
┌───────────────┐  ┌───────────────┐
│  🟡 AM Round   │  │  🟡 Region    │
│  Area Manager  │  │  Round        │
│  scoresheet   │  │  scoresheet   │
│  Open →       │  │  Open →       │
└───────────────┘  └───────────────┘

┌─ View Dashboard ──────────────────────────┐
│  📊 Performance analytics and leaderboards │
│                                     →      │
└────────────────────────────────────────────┘
```

| Sub-option | File |
|---|---|
| AM Round | `checklists/BrewLeagueAMRound.tsx` |
| Region Round | `checklists/BrewLeagueRegionRound.tsx` |
| Dashboard | `checklists/BrewLeagueDashboard.tsx` |

---

## 6. Tab 3: Admin (Editor Only)

**File:** `components/AdminConfig.tsx` (2,054 lines)

Only visible to users with `editor` role. Has its own internal tab system:

```
┌─────────────────────────────────────────────┐
│  Admin Configuration                        │
├─────────────────────────────────────────────┤
│  [Roles] [Checklists] [Raw JSON]            │
│  [Audit Details] [Store Health]             │
├─────────────────────────────────────────────┤
│  (content changes per sub-tab)              │
└─────────────────────────────────────────────┘
```

| Admin Sub-Tab | ID | Icon | Description |
|---|---|---|---|
| **Roles** | `roles` | `Users` | View/edit user role mappings and permissions |
| **Checklists** | `checklists` | `ClipboardList` | Edit checklist questions, add/remove items |
| **Raw JSON** | `raw` | `FileJson` | Direct JSON config editor with save/export |
| **Audit Details** | `audit-details` | — | Per-checklist audit detail configuration |
| **Store Health** | `store-health` | — | Store health card export configuration |

Features:
- Inline editing of checklist questions
- Add/delete question items
- JSON config export as `.json` file
- Save to backend with confirmation
- Employee directory integration for AM name mapping

---

## 7. Component Map

### Shared / Layout Components
| Component | File | Used In |
|---|---|---|
| `Header` | `components/Header.tsx` | Main layout — always visible |
| `ThemeToggle` | `components/ThemeToggle.tsx` | Header + checklist overlay header |
| `Loader` | `components/Loader.tsx` | Full-page spinner during data loads |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | Content placeholder during lazy load |
| `LoadingOverlay` | `components/LoadingOverlay.tsx` | Semi-transparent loading overlay |
| `NotificationOverlay` | `components/NotificationOverlay.tsx` | Toast-style success/error messages |
| `StatCard` | `components/StatCard.tsx` | KPI metric cards on all dashboards |
| `InfographicCard` | `components/InfographicCard.tsx` | Visual data cards |
| `ChartContainer` | `components/ChartContainer.tsx` | Reusable chart wrapper with title |
| `DashboardFilters` | `components/DashboardFilters.tsx` | Filter bar on all dashboards except Campus Hiring & Trainer Calendar |
| `ImageEditor` | `components/ImageEditor.tsx` | In-app image annotation (QA & Finance) |
| `NowBarMobile` | `components/NowBarMobile.tsx` | Mobile "current time" indicator for calendar views |
| `StoreHealthExport` | `components/StoreHealthExport.tsx` | Store health XLSX generation UI |

### AI Insights Components (`components/ai/`)
| Component | File | Purpose |
|---|---|---|
| `AIOverviewHero` | `ai/AIOverviewHero.tsx` | Top-level AI summary hero block |
| `CategoryAnalysis` | `ai/CategoryAnalysis.tsx` | AI-driven category breakdown cards |
| `InsightsCarousel` | `ai/InsightsCarousel.tsx` | Rotating carousel of insight cards |
| `KeyInsightsBlock` | `ai/KeyInsightsBlock.tsx` | Top positive/negative findings |
| `PriorityHeatmap` | `ai/PriorityHeatmap.tsx` | AI-generated priority visualization |
| `ProblemBreakdown` | `ai/ProblemBreakdown.tsx` | Root cause breakdown from AI |
| `QuickActions` | `ai/QuickActions.tsx` | AI-suggested action items |
| `RecommendationsPanel` | `ai/RecommendationsPanel.tsx` | Department-specific AI recommendations |
| `TrendAnalysis` | `ai/TrendAnalysis.tsx` | AI-powered trend detection charts |

### Multi-Month Trends Components (`src/components/dashboard/`)
| Component | File | Purpose |
|---|---|---|
| `HeaderSummary` | `dashboard/HeaderSummary.tsx` | Trends section header with summary stats |
| `StoreTrends` | `dashboard/StoreTrends.tsx` | Store-level trend charts |
| `UniqueStoresPills` | `dashboard/UniqueStoresPills.tsx` | Pill badges showing unique store count |
| `HistoricTrendsSection` | `dashboard/HistoricTrendsSection.tsx` | Full historic trends visualization |

### Modals (Overlay Components)
| Modal | File | Triggered From |
|---|---|---|
| `HRDetailModal` | `components/HRDetailModal.tsx` | HR dashboard — click on HR person |
| `HRBPCalendarModal` | `components/HRBPCalendarModal.tsx` | HR dashboard — calendar icon |
| `TrainingDetailModal` | `components/TrainingDetailModal.tsx` | Training dashboard — click on item |
| `TrainingHealthBreakdownModal` | `components/TrainingHealthBreakdownModal.tsx` | Training dashboard — health pie click |
| `AuditScoreDetailsModal` | `components/AuditScoreDetailsModal.tsx` | Multiple dashboards — score click |
| `QAEditModal` | `components/QAEditModal.tsx` | QA dashboard — edit button |
| `AMOpsAIAnalysisModal` | `components/AMOpsAIAnalysisModal.tsx` | Operations dashboard — AI analysis |

---

## 8. File → Screen Reference

| Screen / View | Primary File(s) |
|---|---|
| **App Shell** | `App.tsx` |
| **Access Denied** | `components/AccessDenied.tsx` |
| **Login** | `components/Login.tsx` |
| **Header** | `components/Header.tsx` |
| **All Dashboards** | `components/Dashboard.tsx` |
| **Dashboard Filters** | `components/DashboardFilters.tsx` |
| **HR Analytics** | `components/Dashboard.tsx` + `ScoreDistributionChart`, `AverageScoreByManagerChart`, `RegionPerformanceInfographic`, `AMPerformanceInfographic`, `HRPerformanceInfographic`, `QuestionScoresInfographic`, `AMRadarChart`, `AMScorecardSection`, `RCACapaAnalysis` |
| **Ops Analytics** | `components/Dashboard.tsx` + `Operations*.tsx` components |
| **Training Analytics** | `components/Dashboard.tsx` + `Training*.tsx` components |
| **QA Analytics** | `components/Dashboard.tsx` + `QA*.tsx` components |
| **Finance Analytics** | `components/Dashboard.tsx` (inline tables + expandable rows) |
| **SHLP Analytics** | `components/Dashboard.tsx` (inline tables) |
| **Campus Hiring Stats** | `components/CampusHiringStats.tsx` |
| **Trainer Calendar** | `components/TrainerCalendarDashboard.tsx` |
| **Bench Planning (SM)** | `components/BenchPlanningDashboard.tsx` |
| **Bench Planning (ASM)** | `components/BenchPlanningSMASMDashboard.tsx` |
| **Consolidated View** | `components/ConsolidatedDashboard.tsx` + `Consolidated4PDashboard.tsx` |
| **Checklists Overview** | `components/ChecklistsAndSurveys.tsx` |
| **HR Checklist** | `components/checklists/HRChecklist.tsx` |
| **Operations Checklist** | `components/checklists/OperationsChecklist.tsx` |
| **Training Checklist** | `components/checklists/TrainingChecklist.tsx` |
| **QA Checklist** | `components/checklists/QAChecklist.tsx` |
| **Finance Checklist** | `components/checklists/FinanceChecklist.tsx` |
| **SHLP Checklist** | `components/checklists/SHLPChecklist.tsx` |
| **Campus Hiring Form** | `components/checklists/CampusHiringChecklist.tsx` |
| **Forms & Surveys** | `components/checklists/FormsChecklist.tsx` |
| **Trainer Calendar Form** | `components/checklists/TrainerCalendarChecklist.tsx` |
| **Bench Planning BT** | `components/checklists/BenchPlanningBTChecklist.tsx` |
| **Bench Planning SM** | `components/checklists/BenchPlanningChecklist.tsx` |
| **Bench Planning ASM** | `components/checklists/BenchPlanningSMASMChecklist.tsx` |
| **Brew League AM** | `components/checklists/BrewLeagueAMRound.tsx` |
| **Brew League Region** | `components/checklists/BrewLeagueRegionRound.tsx` |
| **Brew League Dashboard** | `components/checklists/BrewLeagueDashboard.tsx` |
| **Admin Config** | `components/AdminConfig.tsx` |
| **AI Insights Panel** | `components/AIInsights.tsx` + `components/ai/*` |
| **Image Editor** | `components/ImageEditor.tsx` |

---

## 9. Responsive Behavior Summary

| Breakpoint | Behavior |
|---|---|
| **Mobile (<640px)** | Single column layouts, tab labels truncated to first word, role badge hidden, "Sign Out" label hidden (icon only), checklist grid 1 column |
| **Tablet (640-1024px)** | 2-column grids, filter bar wraps, some labels visible |
| **Desktop (1024px+)** | Full multi-column grids (3-5 cols), all labels visible, side-by-side charts |
| **Wide (1280px+)** | Up to 5-column checklist grid, full dashboard type selector in one row |

---

## 10. Theme System

| Mode | Background | Text | Cards |
|---|---|---|---|
| **Light** | `bg-gray-50` | `text-gray-900` | `bg-white` with `shadow-lg` |
| **Dark** | `bg-slate-900` | `text-slate-100` | `bg-slate-800` with `border-slate-700` |

Toggle: Pearl morph animated button in header (`ThemeToggle.tsx`). State persisted in `ThemeContext` (localStorage).

---

## 11. Navigation Summary (Visual Sitemap)

```
PRISM APP
│
├── [No EMPID] → Access Denied Screen
│
├── [Has EMPID, No Password] → Login Screen
│
└── [Authenticated] → Main Shell
    │
    ├── Header (always visible)
    │   ├── Logo + Title
    │   ├── Role Badge
    │   ├── Sign Out
    │   └── Theme Toggle
    │
    ├── Tab: Dashboard
    │   ├── Dashboard Type Selector
    │   ├── Filters Bar
    │   └── Content:
    │       ├── HR Dashboard (charts, infographics, modals)
    │       ├── Operations Dashboard
    │       ├── Training Dashboard (+ multi-month trends)
    │       ├── QA Dashboard (+ edit modal)
    │       ├── Finance Dashboard (+ expandable rows)
    │       ├── SHLP Dashboard
    │       ├── Campus Hiring Stats
    │       ├── Trainer Calendar
    │       ├── Bench Planning (Barista→SM)
    │       ├── Bench Planning (SM→ASM)
    │       └── Consolidated View (Editor only)
    │
    ├── Tab: Checklists & Surveys
    │   ├── Overview Grid (11 checklist cards)
    │   └── Fullscreen Checklist Views:
    │       ├── HR Checklist
    │       ├── Operations Checklist
    │       ├── Training Checklist
    │       ├── QA Checklist (with image editor)
    │       ├── Finance Checklist (with image upload)
    │       ├── SHLP Checklist
    │       ├── Campus Hiring Checklist
    │       ├── Forms & Surveys
    │       ├── Trainer Calendar Form
    │       ├── Bench Planning → (sub-menu)
    │       │   ├── Barista → Buddy Trainer (3 steps)
    │       │   ├── Barista → Shift Manager
    │       │   └── SM → ASM
    │       └── Brew League → (sub-menu)
    │           ├── AM Round
    │           ├── Region Round
    │           └── Dashboard
    │
    └── Tab: Admin (Editor only)
        ├── Roles management
        ├── Checklists editor
        ├── Raw JSON config
        ├── Audit Details config
        └── Store Health export config
```

---

*This document maps every screen and component visible to users in the Prism Dashboard application.*
