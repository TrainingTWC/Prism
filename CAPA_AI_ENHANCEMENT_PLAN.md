# QA CAPA AI Enhancement Plan

## Overview

Enhance the CAPA (Corrective & Preventive Action) checklist with AI-generated suggestions, image proof uploads, stakeholder assignment, and full question text display.

---

## Current State (What's Broken / Missing)

| Issue | Detail |
|-------|--------|
| **No AI suggestions** | SM manually types Root Cause, Corrective Action, Preventive Action from scratch |
| **Single corrective/preventive field** | Only 1 corrective action and 1 preventive action per finding |
| **No image proof** | No way to attach photo evidence for closure |
| **Store Manager not picked** | GAS `autoCreateFollowUps()` fails to resolve SM from Employee Directory — `assignedToNames` comes back empty |
| **Question IDs shown instead of text** | Finding header shows `ZeroTolerance_ZT_2` instead of the actual question |
| **No stakeholder field** | No way to assign/track a stakeholder for accountability |

---

## Proposed Changes

### 1. AI-Generated CAPA Suggestions (Gemini API)

For each non-compliant/partially-compliant finding, a **"Generate AI CAPA"** button calls Gemini to produce:
- **Root Cause** (1 suggested reason)
- **3 Corrective Actions** (immediate fixes)
- **3 Preventive Actions** (long-term fixes)

The SM reviews the suggestions, selects/edits them, then submits.

**AI Prompt Context** sent to Gemini:
```
Question: "{full question text}"
Section: "{section name}"
Compliance: "{not-compliant / partially-compliant}"
QA Remark: "{auditor remark}"
Store: "{store name}"

Generate a root cause analysis, 3 corrective actions (immediate fixes),
and 3 preventive actions (long-term systemic fixes) for this food safety
non-compliance finding in a café/restaurant context.
```

**Flow:**
```
SM opens CAPA → Clicks "✨ Generate AI CAPA" per finding
    → Loading spinner on button
    → AI response populates fields
    → SM reviews / edits → Submits
```

---

### 2. Updated Finding Data Model

```
QAFinding (updated)
├── questionId          (existing)  "ZeroTolerance_ZT_2"
├── section             (existing)  "Zero Tolerance"
├── question            (NEW)       Full question text from qaQuestions.ts
├── response            (existing)  "not-compliant" | "partially-compliant"
├── weight              (existing)  4
├── remark              (existing)  QA auditor remark
├── rootCause           (existing)  Single text field
├── correctiveActions   (NEW)       Array of 3 strings (replaces correctiveAction)
├── preventiveActions   (NEW)       Array of 3 strings (replaces preventiveAction)
├── imageProofs         (NEW)       Array of base64/URL strings (photo evidence)
├── stakeholder         (NEW)       { name, id } — assigned person for this finding
├── targetDate          (existing)
├── closedDate          (existing)
├── closedBy            (existing)
└── aiGenerated         (NEW)       boolean — whether AI was used
```

---

### 3. UI Layout — Finding Card (Redesigned)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ❌ Non-Compliance                                    Zero Tolerance │
│                                                                     │
│ "The product shall comply with the secondary shelf life for         │
│  critical products like chicken, paneer, sauces, chilled,           │
│  frozen, and composite products."                                   │
│                                                                     │
│  QA Remark: "Paneer found past secondary shelf life"                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 📋 CAPA Details                        [✨ Generate AI CAPA] │    │
│  │                                                             │    │
│  │ Stakeholder *                                               │    │
│  │ ┌───────────────────────────────────────────────────────┐   │    │
│  │ │ 👤 Select Stakeholder              ▼                  │   │    │
│  │ │  (dropdown: SM / Shift Mgr / ASM from store)          │   │    │
│  │ └───────────────────────────────────────────────────────┘   │    │
│  │                                                             │    │
│  │ Root Cause *                                                │    │
│  │ ┌───────────────────────────────────────────────────────┐   │    │
│  │ │ AI: "Lack of secondary shelf life tracking system..." │   │    │
│  │ └───────────────────────────────────────────────────────┘   │    │
│  │                                                             │    │
│  │ Corrective Actions (Immediate Fix) *                        │    │
│  │ ┌───────────────────────────────────────────────────────┐   │    │
│  │ │ 1. ☑ "Remove expired paneer immediately from..."      │   │    │
│  │ │ 2. ☑ "Conduct spot check on all chilled products..." │   │    │
│  │ │ 3. ☐ "Re-train staff on FIFO procedures..."          │   │    │
│  │ └───────────────────────────────────────────────────────┘   │    │
│  │  Each has: [checkbox to select] [editable text field]       │    │
│  │                                                             │    │
│  │ Preventive Actions (Long-term Fix) *                        │    │
│  │ ┌───────────────────────────────────────────────────────┐   │    │
│  │ │ 1. ☑ "Implement digital shelf-life tracker with..."   │   │    │
│  │ │ 2. ☑ "Weekly audit of secondary shelf life tags..."   │   │    │
│  │ │ 3. ☐ "Add shelf-life alerts to POS system..."         │   │    │
│  │ └───────────────────────────────────────────────────────┘   │    │
│  │                                                             │    │
│  │ Target Closure Date *                                       │    │
│  │ ┌──────────────────┐                                        │    │
│  │ │ 📅 04/15/2026    │                                        │    │
│  │ └──────────────────┘                                        │    │
│  │                                                             │    │
│  │ Image Proof *                                               │    │
│  │ ┌───────────────────────────────────────────────────────┐   │    │
│  │ │ 📷 [Upload Photo]  [📸 Take Photo]                    │   │    │
│  │ │                                                       │   │    │
│  │ │  ┌──────┐  ┌──────┐  ┌──────┐                        │   │    │
│  │ │  │ img1 │  │ img2 │  │  +   │  ← thumbnail previews  │   │    │
│  │ │  │  ✕   │  │  ✕   │  │      │                        │   │    │
│  │ │  └──────┘  └──────┘  └──────┘                        │   │    │
│  │ └───────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4. Full Question Text Display

**Before:**
```
┌──────────────────────┐
│ ZeroTolerance_ZT_2  Zero Tolerance  ⚠ Partial Compliance  Wt: 4
└──────────────────────┘
```

**After:**
```
┌──────────────────────────────────────────────────────────────────┐
│ ⚠ Partial Compliance              Zero Tolerance  •  Weight: 4  │
│                                                                  │
│ "The product shall comply with the secondary shelf life for      │
│  critical products like chicken, paneer, sauces, chilled,        │
│  frozen, and composite products."                                │
│                                                                  │
│  QA Remark: "Paneer found past secondary shelf life"             │
└──────────────────────────────────────────────────────────────────┘
```

**How:** The unified GAS `autoCreateFollowUps()` will look up the full question text from `qaQuestions` config (hardcoded in GAS or passed from frontend) and store it in the `question` field of each finding in the Findings JSON.

---

### 5. Store Manager / Stakeholder Fix

**Current Bug:** GAS `autoCreateFollowUps()` tries to find SM/Shift Mgr/ASM from the Employee Directory sheet but the column name lookup fails silently → `assignedToNames` is empty.

**Fix:**
1. Debug the column header matching in GAS (`store_code`, `designation`, `empname`, `employee_code`)
2. Confirm the actual header names in the Employee Directory sheet
3. Pre-populate the **Stakeholder** dropdown on the frontend from the employee directory (filtered to the store's SM/Shift/ASM)
4. If GAS resolved assignees, use them as defaults; otherwise let SM pick manually

**Stakeholder Dropdown Flow:**
```
CAPA loads → Frontend calls Employee Directory API
  → Filters employees by storeId + designation (SM, Shift Manager, ASM)
  → Populates stakeholder dropdown per finding
  → SM selects who is responsible for each point
```

---

### 6. Image Proof Upload

- Each finding gets an **image upload area**
- Supports: camera capture (mobile) + file upload (desktop)
- Images converted to **base64** and stored in the finding's `imageProofs` array
- Stored in Findings JSON column in the Google Sheet
- Thumbnails with remove (✕) button shown after upload
- **Limit: 3 images per finding** (to keep Findings JSON manageable)

---

## File Changes Summary

| File | Change |
|------|--------|
| `services/qaCapaService.ts` | Update `QAFinding` interface — add `correctiveActions[]`, `preventiveActions[]`, `imageProofs[]`, `stakeholder`, `aiGenerated`; add `generateAICAPA()` function |
| `components/checklists/QACAPAChecklist.tsx` | Redesign finding cards — full question heading, AI button, stakeholder dropdown, multi corrective/preventive with checkboxes, image upload area |
| `qa-unified-google-apps-script.js` | Fix SM resolution in `autoCreateFollowUps()`; store full question text in findings; handle new fields in `updateCAPA()` |
| `config/qaQuestions.ts` | Export a `QUESTION_MAP` lookup for questionId → full text (already has the data, just need a helper) |
| `.env` | Add `VITE_GEMINI_API_KEY` for AI generation |

---

## Data Flow

```
                    ┌─────────────────┐
                    │   QA Submits     │
                    │   Audit Form     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Unified GAS:    │
                    │  autoCreate      │
                    │  FollowUps()     │
                    │                  │
                    │ • Extract non-   │
                    │   compliant Qs   │
                    │ • Lookup full Q  │◄─── qaQuestions 
                    │   text           │     config
                    │ • Resolve SM/    │◄─── Employee
                    │   Shift/ASM      │     Directory
                    │ • Create CAPA    │
                    │   row in sheet   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  SM Opens CAPA   │
                    │  Dashboard       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
    │ See findings   │ │ Click    │ │ Select       │
    │ with FULL      │ │ "AI CAPA"│ │ Stakeholder  │
    │ question text  │ │ button   │ │ per finding  │
    └────────────────┘ └────┬─────┘ └──────────────┘
                            │
                   ┌────────▼────────┐
                   │  Gemini API      │
                   │  generates:      │
                   │  • Root Cause    │
                   │  • 3 Corrective  │
                   │  • 3 Preventive  │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │  SM Reviews AI   │
                   │  suggestions:    │
                   │  • Edit text     │
                   │  • Select/desel  │
                   │  • Upload photos │
                   │  • Set target    │
                   │    date          │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │  Submit CAPA     │
                   │  → updateCAPA()  │
                   │  → Google Sheet  │
                   └──────────────────┘
```

---

## Implementation Order

| Step | Task | Depends On |
|------|------|------------|
| **1** | Create `QUESTION_MAP` in `qaQuestions.ts` for questionId → full text lookup | — |
| **2** | Update GAS `autoCreateFollowUps()` to include full question text in findings JSON + fix SM resolution | Step 1 |
| **3** | Update `QAFinding` interface with new fields (`correctiveActions[]`, `preventiveActions[]`, `imageProofs[]`, `stakeholder`, `aiGenerated`) | — |
| **4** | Add `generateAICAPA()` function in `qaCapaService.ts` using Gemini API | Step 3 |
| **5** | Redesign `QACAPAChecklist.tsx` finding cards — full question heading, AI button, multi-action fields with checkboxes, stakeholder dropdown, image upload | Steps 1-4 |
| **6** | Update GAS `updateCAPA()` to handle new finding fields | Step 3 |
| **7** | Test end-to-end: submit QA audit → CAPA created with full text → SM opens → generates AI → uploads proof → submits | All |

---

## Gemini API Integration

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

**Request:**
```json
{
  "contents": [{
    "parts": [{
      "text": "You are a food safety compliance expert for a café chain. Given this QA audit finding, generate a structured CAPA response.\n\nQuestion: \"<full question text>\"\nSection: \"<section>\"\nCompliance Status: \"<not-compliant/partially-compliant>\"\nAuditor Remark: \"<remark>\"\nStore: \"<store name>\"\n\nRespond in this exact JSON format:\n{\n  \"rootCause\": \"<single root cause>\",\n  \"correctiveActions\": [\"<action1>\", \"<action2>\", \"<action3>\"],\n  \"preventiveActions\": [\"<action1>\", \"<action2>\", \"<action3>\"]\n}"
    }]
  }],
  "generationConfig": {
    "responseMimeType": "application/json"
  }
}
```

**Called from:** Frontend (browser) via `fetch()` with API key from `VITE_GEMINI_API_KEY`

---

## Backward Compatibility

| Concern | Solution |
|---------|----------|
| Old findings with `correctiveAction` (string) | Service layer checks both `correctiveAction` (legacy) and `correctiveActions` (new array) |
| Old findings without `question` text | Frontend falls back to `questionId` if `question` is empty |
| Old findings without `imageProofs` | Render empty image section, no errors |
| Sheet column changes | No new columns — all new data stored inside existing `Findings JSON` column |
