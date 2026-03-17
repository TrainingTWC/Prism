# Prism — Role & Access Structure

## Overview

Prism uses a **two-layer authentication** system:

1. **Password-based login** — grants a department role with module permissions and dashboard access
2. **Employee ID validation** — further scopes data visibility based on the user's position in the org hierarchy

Session duration: **24 hours** (stored in `localStorage`).

---

## Layer 1: Department Roles (Password Login)

Each role unlocks specific **modules** (checklists/surveys) and **dashboards**.

### Role Summary

| Role | Modules | Dashboards |
|------|---------|------------|
| **HR** | HR, Campus Hiring, Bench Planning, Dashboard | HR, Campus Hiring, Bench Planning, Bench Planning SM/ASM |
| **Training** | Training, SHLP, Bench Planning, Brew League, Dashboard | Training, SHLP, Bench Planning, Bench Planning SM/ASM, Trainer Calendar |
| **QA** | QA, Dashboard | QA |
| **Finance** | Finance, Dashboard | Finance |
| **Operations** | Operations, SHLP, Bench Planning, Brew League, Dashboard | Operations, SHLP, Bench Planning, Bench Planning SM/ASM |
| **Store** | SHLP, Brew League, Bench Planning | *(none)* |
| **Campus Hiring** | Campus Hiring | *(none)* |
| **Admin** | All modules | All dashboards |
| **Editor** | All modules | All dashboards |

### Role Details

#### HR
- **Modules:** HR checklists, Campus Hiring forms, Bench Planning, Dashboard view
- **Dashboards:** HR Dashboard, Campus Hiring Dashboard, Bench Planning Dashboard, Bench Planning SM/ASM Dashboard

#### Training
- **Modules:** Training checklists, SHLP (Store Hygiene & LP), Bench Planning, Brew League competition, Dashboard view
- **Dashboards:** Training Dashboard, SHLP Dashboard, Bench Planning Dashboard, Bench Planning SM/ASM Dashboard, Trainer Calendar Dashboard

#### QA
- **Modules:** QA checklists, Dashboard view
- **Dashboards:** QA Dashboard

#### Finance
- **Modules:** Finance checklists, Dashboard view
- **Dashboards:** Finance Dashboard

#### Operations
- **Modules:** Operations checklists, SHLP, Bench Planning, Brew League, Dashboard view
- **Dashboards:** Operations Dashboard, SHLP Dashboard, Bench Planning Dashboard, Bench Planning SM/ASM Dashboard

#### Store
- **Modules:** SHLP checklists, Brew League forms, Bench Planning
- **Dashboards:** None — form submission only, no analytics access

#### Campus Hiring
- **Modules:** Campus Hiring assessment forms only
- **Dashboards:** None — assessment submission only

#### Admin
- **Modules:** Full access to all modules
- **Dashboards:** Full access to all dashboards (including Campus Hiring, Trainer Calendar, Bench Planning)

#### Editor
- **Modules:** Full access to all modules (same as Admin)
- **Dashboards:** Full access to all dashboards (same as Admin)

---

## Layer 2: Employee ID Roles (Org Hierarchy)

After password login, users can optionally validate via **Employee ID** (`?EMPID=HXXXX` URL param or manual entry). This scopes dashboard data to their org hierarchy position using the store mapping data.

### Hierarchy Roles

| Role | Data Scope | Sees Stores | Sees AMs | Sees HR |
|------|-----------|-------------|----------|---------|
| **System Admin** | Everything | All | All | All |
| **HR Head** | Everything | All | All | All |
| **LMS Head** | Everything | All | All | All |
| **Regional HR** | Own region | Region stores | Region AMs | Self + region HRBPs |
| **HRBP** | Assigned clusters | Cluster stores | Assigned AMs | Self only |
| **Area Manager** | Own stores | Own stores only | Self only | — |
| **Trainer** | Based on assignment | Assigned stores | — | — |
| **Store** | Own store only | Own store | — | — |

### How Data Scoping Works

- **Area Manager (AM):** Sees only stores directly under their management. Dashboard filters to their AM ID.
- **HRBP:** Sees all stores and AMs within their assigned cluster(s). Can view data across multiple AMs they oversee.
- **Regional HR / Regional Training Manager:** Sees all stores, AMs, and HRBPs within their entire region.
- **HR Head / LMS Head / Admin:** No restrictions — full visibility across all stores, AMs, and HR personnel.

### Mapping Source

Employee-to-store-to-region mappings are loaded from `comprehensive_store_mapping.json` with fallbacks to `twc_store_mapping.json` and `hr_mapping.json`. These JSON files contain:
- Store ID → AM mapping
- Store ID → HRBP mapping
- Store ID → Regional Training Manager mapping
- Store ID → HR Head mapping
- Store ID → Region mapping

---

## Auth Flow

```
User opens Prism
    │
    ├── URL has ?EMPID=HXXXX ?
    │       │
    │       ├── YES → Validate against Employee Directory
    │       │           → Set employee data (code, name)
    │       │           → Continue to password prompt
    │       │
    │       └── NO → Show password prompt directly
    │
    ├── Enter department password
    │       │
    │       ├── Match found → Set role + permissions + dashboard access
    │       │                  → Store in localStorage (24hr session)
    │       │                  → Show permitted modules
    │       │
    │       └── No match → "Incorrect password" error
    │
    └── Access dashboard
            │
            ├── Password role determines WHICH dashboards are visible
            │
            └── Employee ID role determines WHAT DATA is shown
                (filters stores/AMs/HR to user's org scope)
```

---

## Module Map

| Module | Description | Available To |
|--------|-------------|-------------|
| HR Checklists | HR audit checklists | HR, Admin, Editor |
| Operations Checklists | Operations audit checklists | Operations, Admin, Editor |
| Training Checklists | Training audit checklists | Training, Admin, Editor |
| QA Checklists | Quality assurance checklists | QA, Admin, Editor |
| Finance Checklists | Finance audit checklists | Finance, Admin, Editor |
| SHLP | Store Hygiene & Loss Prevention | Training, Operations, Store, Admin, Editor |
| Campus Hiring | Campus recruitment assessments | HR, Campus Hiring, Admin, Editor |
| Bench Planning | Panelist bench planning forms | HR, Training, Operations, Store, Admin, Editor |
| Brew League | Barista competition scoring (AM Round, Region Round, Dashboard) | Training, Operations, Store, Admin, Editor |
| Trainer Calendar | Trainer schedule management | Training (dashboard only), Admin, Editor |

---

## Dashboard Map

| Dashboard | Shows | Available To |
|-----------|-------|-------------|
| HR Dashboard | HR checklist analytics, HR performance | HR, Admin, Editor |
| Operations Dashboard | Ops checklist analytics, AM scores, RCA/CAPA AI analysis | Operations, Admin, Editor |
| Training Dashboard | Training checklist analytics | Training, Admin, Editor |
| QA Dashboard | QA checklist analytics | QA, Admin, Editor |
| Finance Dashboard | Finance checklist analytics | Finance, Admin, Editor |
| SHLP Dashboard | SHLP analytics | Training, Operations, Admin, Editor |
| Campus Hiring Dashboard | Campus hiring analytics | HR, Admin, Editor |
| Bench Planning Dashboard | Bench planning analytics | HR, Training, Operations, Admin, Editor |
| Bench Planning SM/ASM Dashboard | SM/ASM bench planning view | HR, Training, Operations, Admin, Editor |
| Trainer Calendar Dashboard | Trainer calendar analytics | Training, Admin, Editor |
| Brew League Dashboard | Competition leaderboard + analytics | Training, Operations, Admin, Editor |

---

## Storage Keys

| Key | Purpose |
|-----|---------|
| `prism_dashboard_auth` | Auth status (`"true"` / absent) |
| `prism_dashboard_auth_timestamp` | Session start time (epoch ms) |
| `prism_dashboard_user_role` | Current department role string |
| `auth_employee` | Employee data JSON `{code, name}` |
| `employee_validated` | Employee ID validation flag |

---

## Notes

- Admin and Editor roles are functionally identical in access — both have full permissions
- Store and Campus Hiring roles are **form-only** — they cannot access any dashboards
- Password-based roles bypass org-hierarchy data scoping (see all data)
- Employee ID scoping only applies when the user has dashboard access AND a valid employee mapping
- Sessions auto-expire after 24 hours; user must re-authenticate
