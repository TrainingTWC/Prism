# Complete Checklist & Assessment Reference — Prism

> **Last updated:** March 22, 2026
> **Total Checklists:** 11 types · **Total Questions:** 600+
> **Source:** Prism Training Management System (React + Google Apps Script)

---

## 📋 Table of Contents

1. [Feature Support Matrix](#-feature-support-matrix)
2. [HR Connect Assessment (12 questions)](#-hr-connect-assessment)
3. [AM Operations Assessment — COFFEE Framework (63 questions)](#-am-operations-assessment--coffee-framework)
4. [Training Audit Assessment (95+ questions)](#-training-audit-assessment)
5. [QA Checklist (116 questions)](#-qa-checklist)
6. [Finance Assessment (35 questions)](#-finance-assessment)
7. [SHLP Assessment (35 questions)](#-shlp-assessment)
8. [Campus Hiring Assessment (30 questions)](#-campus-hiring-assessment)
9. [Forms — MT Feedback (16 questions)](#-forms--mt-feedback)
10. [Bench Planning — Barista→SM (33 items)](#-bench-planning--baristasm)
11. [Bench Planning — BT Buddy Trainer (51 items)](#-bench-planning--bt-buddy-trainer)
12. [Brew League — AM/Region Round](#-brew-league--amregion-round)
13. [Audit Details Per Checklist](#-audit-details-per-checklist)
14. [Summary Table](#-summary-table)

---

## 🧩 Feature Support Matrix

| Feature | HR | Ops | Training | QA | Finance | SHLP | Campus | Forms | Bench | Brew League |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Images / Photos** | — | ✅ per section | ✅ per section | ✅ per question | ✅ per question | — | — | — | — | — |
| **Image Editor (annotate)** | — | — | ✅ | ✅ | — | — | — | — | — | — |
| **Remarks / Notes** | — | ✅ per section | — | ✅ per question | ✅ per question | ✅ per question | — | — | ✅ readiness | — |
| **Signatures** | — | — | — | ✅ auditor + SM | ✅ auditor + SM | — | — | — | — | — |
| **Cloud Draft Saving** | — | — | — | ✅ Google Sheets | — | — | — | — | — | — |
| **Edit Mode (re-submit)** | — | — | — | ✅ | — | — | — | — | — | — |
| **LocalStorage Auto-Save** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| **PDF Report Export** | — | ✅ | — | — | ✅ | — | — | — | — | ✅ (jsPDF) |
| **Geofencing (GPS)** | — | — | — | — | — | ✅ 100 m | — | — | — | — |
| **Zero Tolerance** | — | — | — | ✅ | — | — | — | — | — | — |
| **Negative Scoring** | — | — | ✅ | — | — | ✅ | — | — | — | — |
| **Timer / Lockout** | — | — | — | — | — | — | ✅ 30 min | — | — | — |
| **Proctoring (cam + mic)** | — | — | — | — | — | — | ✅ | — | — | — |
| **Auto-submit on Expiry** | — | — | — | — | — | — | ✅ | — | — | — |
| **Historic Data Fetch** | — | — | — | — | ✅ | — | — | — | — | ✅ |
| **Haptic Feedback** | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — |
| **Employee Directory Search** | — | — | ✅ TSA | — | — | ✅ | — | — | ✅ | ✅ |
| **Auto-fill from Store Map** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — |

---

## 🤝 HR Connect Assessment
**Total Questions: 12 (9 scored + 3 text inputs)**
**Scoring: 1-5 Likert scale (some reverse-scored)**
**Max Score: 45**
**Features:** LocalStorage auto-save · Haptic feedback · HRBP-based store filtering · Auto-fill from mapping

### Audit Details Collected
- HR Name / HR ID (dropdown from HR_PERSONNEL)
- AM Name / AM ID (auto-filled from store mapping)
- Employee Name / Employee ID (text)
- Store Name / Store ID (dropdown from STORES)

### Questions

1. **Q1:** Is there any work pressure in the café?
   - Every time (1) | Most of the time (2) | Sometime (3) | At Time (4) | Never (5) — *Reverse scored*

2. **Q2:** Are you empowered to make decisions on the spot to help customers and immediately solve their problems/complaints?
   - Every time (5) | Most of the time (4) | Sometime (3) | At Time (2) | Never (1)

3. **Q3:** Do you receive regular performance reviews and constructive feedback from your SM / AM?
   - Every time (5) | Most of the time (4) | Sometime (3) | At Time (2) | Never (1)

4. **Q4:** Do you think there is any partiality or unfair treatment within team?
   - Every time (1) | Most of the time (2) | Sometime (3) | At Time (4) | Never (5) — *Reverse scored*

5. **Q5:** Are you getting the training as per Wings program? What was the last training you got and when?
   - Every time (5) | Most of the time (4) | Sometime (3) | At Time (2) | Never (1)

6. **Q6:** Are you facing any issues with operational Apps (Zing, Meal benefit, Jify) or any issues with PF, ESI, Reimbursements, Insurance & Payslips?
   - Every time (1) | Most of the time (2) | Sometime (3) | At Time (4) | Never (5) — *Reverse scored*

7. **Q7:** Have you gone through the HR Handbook on Zing / Accepted all the policies?
   - Excellent (5) | Very Good (4) | Good (3) | Average (2) | Poor (1)

8. **Q8:** Are you satisfied with your current work schedule - Working Hours, Breaks, Timings, Weekly Offs & Comp Offs?
   - Every time (5) | Most of the time (4) | Sometime (3) | At Time (2) | Never (1)

9. **Q9:** How effectively does the team collaborate, and what factors contribute to that?
   - Excellent (5) | Very Good (4) | Good (3) | Average (2) | Poor (1)

10. **Q10:** Name one of your colleague who is very helpful on the floor
    - *Text input (not scored)*

11. **Q11:** Any suggestions or support required from the organization?
    - *Textarea input (not scored)*

12. **Q12:** On a scale of 1 to 5 how do you rate your experience with TWC & why?
    - Excellent (5) | Very Good (4) | Good (3) | Average (2) | Poor (1)

---

## 📊 AM Operations Assessment — COFFEE Framework
**Total Questions: 63 across 6 sections**
**Scoring: Binary — Yes (1) / No (0)**
**Max Score: 63 points**
**Features:** Section-level images · Section-level remarks · PDF report export · LocalStorage auto-save · Haptic feedback · Auto-fill from mapping

### Audit Details Collected
- HR Name / HR ID (dropdown from HR_PERSONNEL)
- AM Name / AM ID (dropdown from AREA_MANAGERS)
- Trainer Name / Trainer ID (dropdown from TRAINERS)
- Store Name / Store ID (dropdown from STORES)
- BSC Achievement % (number)
- No. of people on shift (number)
- Manpower fulfilment (High / Med / Low)
- Café Type (REGULAR / PREMIUM / PREMIUM+)
- Store Type (Mall / Highstreet / Hospital / Corporate / Airport / Highway)
- Concept (Experience / Premium / Kiosk)

### Section 1: Cheerful Greeting (13 questions)

1. **CG_1:** Is the store front area clean and maintained?
2. **CG_2:** Is the signage clean and are all lights functioning?
3. **CG_3:** Are the glass and doors smudge-free?
4. **CG_4:** Do promotional displays reflect current offers?
5. **CG_5:** Are POS tent cards as per the latest communication?
6. **CG_6:** Are menu boards/DMB as per the latest communication?
7. **CG_7:** Does the café have a welcoming environment (music, lighting, AC, aroma)?
8. **CG_8:** Are washrooms cleaned and the checklist updated?
9. **CG_9:** Is the FDU counter neat, fully stocked, and set as per the planogram?
10. **CG_10:** Does the merch rack follow VM guidelines and attract attention?
11. **CG_11:** Is staff grooming (uniform, jewellery, hair and makeup) as per standards?
12. **CG_12:** Are all seating, furniture, and stations tidy and organized?
13. **CG_13:** Is the engine area clean and ready for operations?

### Section 2: Order Taking Assistance (11 questions)

14. **OTA_1:** Is suggestive selling happening at the POS?
15. **OTA_2:** Is the POS partner updated on the latest promos and item availability?
16. **OTA_3:** Has order-taking time been recorded for 5 customers?
17. **OTA_4:** Is there sufficient cash and change at the POS?
18. **OTA_5:** Are valid licenses displayed and expiries checked (medical reports)?
19. **OTA_6:** Are cash audits completed and verified with the logbook?
20. **OTA_7:** Are daily banking reports tallied?
21. **OTA_8:** Has CPI been reviewed through the FAME pilot?
22. **OTA_9:** Are Swiggy/Zomato metrics (RDC, MFR, visibility) reviewed, and are Food Lock on LS and stock control on UrbanPiper managed per stock availability/opening inventory?
23. **OTA_10:** Are all food and drinks served as per SOP?
24. **OTA_11:** Are food orders placed based on the 4-week sales trend?

### Section 3: Friendly & Accurate Service (13 questions)

25. **FAS_1:** Is equipment cleaned and maintained?
26. **FAS_2:** Are temperature checks done with the Therma Pen and logs updated?
27. **FAS_3:** Is documentation (GRN, RSTN, STN & TO) completed?
28. **FAS_4:** Is fast-moving SKU availability checked and validated with LS?
29. **FAS_5:** Is the thawing chart validated against actual thawing?
30. **FAS_6:** Are deployment roles clear, with coaching and appreciation done by the MOD?
31. **FAS_7:** Are there no broken/unused tools stored in the store?
32. **FAS_8:** Is garbage segregated properly (wet/dry)?
33. **FAS_9:** Are LTO products served as per standards?
34. **FAS_10:** Is the coffee and food dial-in process followed?
35. **FAS_11:** Are R.O.A.S.T. and app orders executed accurately?
36. **FAS_12:** Have 5 order service times been validated?
37. **FAS_13:** Have open maintenance-related points been reviewed?

### Section 4: Feedback with Solution (13 questions)

38. **FWS_1:** Has COGS been reviewed, with actions in place per last month P&L feedback?
39. **FWS_2:** Have BSC targets vs achievements been reviewed?
40. **FWS_3:** Has people budget vs actuals (labour cost/bench planning) been reviewed?
41. **FWS_4:** Has variance in stock (physical vs system) been verified?
42. **FWS_5:** Have the top 10 wastage items been reviewed?
43. **FWS_6:** Have store utilities (units, chemical use) been reviewed?
44. **FWS_7:** Have shift targets, briefings, and goal tracking been conducted?
45. **FWS_8:** Have new staff training and bench plans been reviewed?
46. **FWS_9:** Have Training and QA audits been reviewed?
47. **FWS_10:** Has the duty roster (off/coff, ELCL, tenure) been checked and attendance ensured as per ZingHR?
48. **FWS_11:** Have temperature and thawing logs been validated?
49. **FWS_12:** Have audit and data findings been cross-checked with store observations?
50. **FWS_13:** Is the pest control layout updated?

### Section 5: Enjoyable Experience (7 questions)

51. **ENJ_1:** Have 2 new and 2 repeat customers been engaged, with feedback documented?
52. **ENJ_2:** Are seating and stations adjusted as per customer requirements?
53. **ENJ_3:** Is the team proactively assisting customers?
54. **ENJ_4:** Is CCTV checked to monitor customer service during peak hours?
55. **ENJ_5:** Is CCTV backup (minimum 60 days) in place and are black spots checked?
56. **ENJ_6:** Is opening/closing footage reviewed for correct practices?
57. **ENJ_7:** Are there no personal items/clutter in guest areas, with belongings kept in lockers/designated places?

### Section 6: Enthusiastic Exit (6 questions)

58. **EX_1:** Are there no unresolved issues at exits?
59. **EX_2:** Is the final interaction cheerful and courteous?
60. **EX_3:** Has a consolidated action plan been created with the Store Manager?
61. **EX_4:** Have top performers been recognized?
62. **EX_5:** Have wins been celebrated and improvement areas communicated?
63. **EX_6:** Has the team been motivated for ongoing improvement?

---

## 🎓 Training Audit Assessment
**Total Questions: 95+ (47 base questions + 3 TSA sub-checklists with ~93 items)**
**Scoring: Weighted (1-4 pts per question, some with negative scoring)**
**Base Max Score: 70 points (excluding TSA per-employee assessments)**
**Features:** Section-level images · Image Editor (annotate) · LocalStorage auto-save · Haptic feedback · Employee search for TSA · Auto-fill from mapping

### Audit Details Collected
- AM Name / AM ID (dropdown from AREA_MANAGERS)
- Trainer Name / Trainer ID (auditor, auto-filled from login + mapped from TRAINERS)
- Store Name / Store ID (dropdown from STORES)
- MOD (Manager on Duty) (text)

### Section 1: Training Materials (9 questions)

1. **TM_1:** FRM available at store? (1 point)
2. **TM_2:** BRM available at store? (1 point)
3. **TM_3:** One-pager – Hot/Cue Cards displayed? (1 point)
4. **TM_4:** One-pager – Cold/Cue Cards displayed? (1 point)
5. **TM_5:** Dial-in One-pager visible? (2 points)
6. **TM_6:** New-launch learning material available? (1 point)
7. **TM_7:** COFFEE & HD Playbook in store? (1 point)
8. **TM_8:** MSDS, chemical chart and Shelf life chart available? (1 point)
9. **TM_9:** Career Progression Chart & Reward Poster displayed? (1 point)

### Section 2: LMS Usage (3 questions)

10. **LMS_1:** Orientation & Induction completed within 3 days of joining? (4 points if Yes / -4 if No)
11. **LMS_2:** All assessments & knowledge checks completed on LMS? (4 points if Yes / -4 if No)
12. **LMS_3:** Team uses LMS for new info & comms? (2 points)

### Section 3: Buddy Trainer (6 questions)


13. **Buddy_1:** Does the café have at least 20% of the staff certified as Buddy Trainers? (2 points)
14. **Buddy_2:** Have Buddy Trainers completed their Skill Check? (2 points)
15. **Buddy_3:** Are trainees rostered with Buddy Trainers and working in the same shift? (1 point)
16. **Buddy_4:** Have Buddy Trainers attended the BT workshop? (2 points)
17. **Buddy_5:** Can Buddy Trainers explain the 4-step training process effectively? (2 points)
18. **Buddy_6:** Can Buddy Trainers navigate Zing LMS flawlessly? (1 point)

### Section 4: New Joiner Training (7 questions)

19. **NJ_1:** Is the OJT book available for all partners? (1 point)
20. **NJ_2:** Are trainees referring to the OJT book and completing their skill checks? (1 point)
21. **NJ_3:** Is training progression aligned with the Training Calendar/Plan? (1 point)
22. **NJ_4:** Are team members aware of post-barista training progressions? (1 point)
23. **NJ_5:** Have managers completed SHLP training as per the calendar? (2 points)
24. **NJ_6:** Are there at least 2 FOSTAC-certified managers in the store? (2 points)
25. **NJ_7:** Is ASM/SM training completed as per the Training Calendar? (2 points)

### Section 5: Partner Knowledge (7 questions)

26. **PK_1:** Are team members aware of current company communication? (2 points)
27. **PK_2:** Ask a team member to conduct a Coffee Tasting & a Sampling (2 points)
28. **PK_3:** Is Sampling being conducted as per the set guidelines? (2 points)
29. **PK_4:** Is Coffee Tasting engaging and effective? (2 points)
30. **PK_5:** Are team members aware of manual brewing methods and standards? (2 points)
31. **PK_6:** Are partners following grooming standards? (2 points)
32. **PK_7:** Ask questions about key topics: COFFEE, LEAST, ROAST, Dial-in, Milk Steaming, LTO, Values(RESPECT), MSDS, Chemical Dilution, Food Safety, and Security. (3 points if Yes / -3 if No)

### Section 6: TSA Food Score (1 item)

33. **TSA_Food_Score:** TSA Food Score (out of 10) - *Numeric input*

### Section 7: TSA Coffee Score (1 item)

34. **TSA_Coffee_Score:** TSA Coffee Score (out of 10) - *Numeric input*

### Section 8: TSA CX Score (1 item)

35. **TSA_CX_Score:** TSA CX Score (out of 10) - *Numeric input*

### Section 9: Customer Experience (9 questions)

36. **CX_1:** Is appropriate background music playing at the appropriate volume? (1 point)
37. **CX_2:** Is the store temperature comfortable? (1 point)
38. **CX_3:** Are the washrooms clean and well-maintained? (1 point)
39. **CX_4:** Is WiFi available and functioning properly? (1 point)
40. **CX_5:** Are marketing elements and displays (Merchandise rack and FDU) displayed appropriately as per VM guide? (2 points)
41. **CX_6:** Is the store furniture clean and well-kept? (1 point)
42. **CX_7:** Ask - What do you understand by MA, CPI, Google, HD, QA, and App Feedback Scores? (1 point)
43. **CX_8:** Ask - What was the latest Mystery Audit score for the store? (1 point)
44. **CX_9:** Ask - What were the top two opportunity areas in Customer Experience (last month)? (1 Mark - No partial marks) (1 point)

### Section 10: Action Plan (3 questions)

45. **AP_1:** SMART action plan - Is the action plan Specific, Measurable, Achievable, Relevant, and Time-bound? (1 point if Yes / -1 if No)
46. **AP_2:** Has the action plan been discussed with the trainee and agreed upon? (2 points)
47. **AP_3:** Are follow-up dates scheduled to review progress on the action plan? (2 points)

### TSA Sub-Checklists (Per-Employee Skill Assessments)

> Each TSA section is assessed **per employee** — the trainer selects an employee from the directory and evaluates them individually. All items scored 1 point each (Yes/No).

#### TSA Food — Food Training Skill Assessment (24 items)

**Personal Hygiene (3):**
| ID | Item |
|---|---|
| PH_1 | Well-groomed as per TWC standards (uniform, nails, hair) |
| PH_2 | Washed and sanitized hands every 30 mins |
| PH_3 | Wears gloves or avoids direct food contact |

**Station Readiness (8):**
| ID | Item |
|---|---|
| SR_1 | All ingredients available for the day |
| SR_2 | All smallware available & in correct use |
| SR_3 | Station cleaned and sanitized |
| SR_4 | Station and smallware organized and clean |
| SR_5 | Clean dusters available at the station |
| SR_6 | FDU AT LEAST 70% stocked, clean, follows planogram |
| SR_7 | MRD stickers used correctly (FDU + Make Line) |
| SR_8 | Products stored at correct temperature |

**Food Preparation & Handling (12):**
| ID | Item |
|---|---|
| FP_1 | Recipe followed per SOP (Food Item 1) |
| FP_2 | Build followed per SOP (Food Item 1) |
| FP_3 | Recipe followed per SOP (Food Item 2) |
| FP_4 | Build followed per SOP (Food Item 2) |
| FP_5 | Used correct tools for preparation |
| FP_6 | Used appropriate key to heat/warm food (Merry chef/Oven) |
| FP_7 | Gloves changed correctly (veg/non-veg switch or as per TWC guidelines) |
| FP_8 | Consistently follows Clean-As-You-Go |
| FP_9 | Correct duster used for station cleaning |
| FP_10 | Follows First-In-First-Out for food items |
| FP_11 | Products checked visually before serving |
| FP_12 | Chips, condiments, cutlery, etc., provided per SOP |

**Standards Ownership (1):**
| ID | Item |
|---|---|
| SO_1 | Serves only food that meets TWC standards (fresh, safe, proper temp); knows what to do if not |

#### TSA Coffee — Coffee Training Skill Assessment (39 items)

**Personal Hygiene (3):**
| ID | Item |
|---|---|
| PH_1 | Well-groomed as per TWC standards (uniform, nails, hair) |
| PH_2 | Washed and sanitized hands |
| PH_3 | Wears gloves at CBS |

**Station Readiness (13):**
| ID | Item |
|---|---|
| SR_1 | Station well stocked with Milk, Warm cups, coffee beans, steaming jars, filter papers, stirrers, spoons, blenders and blending jars and scissors |
| SR_2 | All types of milk available — Fresh, Skim milk, Oats milk and Almond milk |
| SR_3 | Leveller and temper is clean and set at the appropriate setting |
| SR_4 | All smallwares available — Stir spoon in clean water, Frothing pitchers, appropriate pumps in syrups |
| SR_5 | Espresso dial-in is done |
| SR_6 | Extracts the perfect espresso each time |
| SR_7 | Follows the Espresso extraction steps as defined |
| SR_8 | Whipped cream is prepared as per standards |
| SR_9 | Station and smallware organized and clean |
| SR_10 | Clean dusters available at the station |
| SR_11 | Station cleaned and sanitized |
| SR_12 | MRD stickers used correctly |
| SR_13 | Products stored at correct temperature |

**Coffee Preparation & Handling (26):**
| ID | Item |
|---|---|
| CP_1 | Recipe followed per SOP for Cappuccino |
| CP_2 | Build followed per SOP for Cappuccino |
| CP_3 | Recipe followed per SOP for Latte |
| CP_4 | Build followed per SOP for Latte |
| CP_5 | Recipe followed per SOP for bev 3 |
| CP_6 | Build followed per SOP for bev 3 |
| CP_7 | Recipe followed per SOP for bev 4 |
| CP_8 | Build followed per SOP for bev 4 |
| CP_9 | Cappuccino served with 70:30 milk foam ratio |
| CP_10 | Latte served with silky smooth foam (90:10 ratio) |
| CP_11 | Milk steaming standards followed — correct milk quantity, clean pitcher, fresh cold milk |
| CP_12 | Latte art is as per described standards |
| CP_13 | Used correct tools for preparation |
| CP_14 | Blenders, Shakers and frothing jugs washed and clean after every use |
| CP_15 | Appropriate button used to blend the beverages |
| CP_16 | Toppings and Garnishes used as per described standards |
| CP_17 | Special instructions read and followed while preparing the beverage |
| CP_18 | Cold brew available and brewed as per TWC standards |
| CP_19 | Trainee is aware about Cold brew |
| CP_20 | Trainee brews manual brews as per TWC standards |
| CP_21 | Gloves changed correctly (after garbage handling or per Glove usage policy) |
| CP_22 | Consistently follows Clean-As-You-Go |
| CP_23 | Correct duster used for station cleaning |
| CP_24 | Follows First-In-First-Out for food items |
| CP_25 | Products checked visually before serving |
| CP_26 | Condiments, cutlery, etc., provided per SOP |

#### TSA CX — Customer Experience Skill Assessment (29 items)

**Personal Hygiene (3):**
| ID | Item |
|---|---|
| CX_PH_1 | Grooming & Hygiene: Well-groomed as per TWC standards (uniform, nails, hair) |
| CX_PH_2 | Hand Hygiene: Washed and sanitized hands |
| CX_PH_3 | Food Handling: Wears gloves or avoids direct food contact |

**Station Readiness (8):**
| ID | Item |
|---|---|
| CX_SR_1 | Washrooms clean and stocked |
| CX_SR_2 | Service area clean (floor, chairs, tables) |
| CX_SR_3 | Smallwares clean (salvers, plates, cutlery) |
| CX_SR_4 | Furniture properly set |
| CX_SR_5 | POS, Bars, merchandise, menus, etc. properly stocked |
| CX_SR_6 | Float/change available for cash transactions |
| CX_SR_7 | Checks communication for product availability |
| CX_SR_8 | Verifies temperature, music, table cleanliness, service items, Wi-Fi, and delivery channels |

**Customer Handling (12):**
| ID | Item |
|---|---|
| CX_CH_1 | Cheerfully welcomes customers, follows 2-meter rule |
| CX_CH_2 | Builds rapport (eye contact, active listening, positive phrases) |
| CX_CH_3 | Assists customers to find seating or offers help when needed |
| CX_CH_4 | Upsells using customer interest and product knowledge |
| CX_CH_5 | Accurately enters and verifies orders in POS |
| CX_CH_6 | Applies applicable discounts correctly |
| CX_CH_7 | Processes payments accurately and handles change |
| CX_CH_8 | Closes transaction smoothly and provides table tag |
| CX_CH_9 | Thanks customer, explains order delivery, listens to feedback |
| CX_CH_10 | Serves with attention to detail (salver balance, order name, cutlery, etc.) |
| CX_CH_11 | Offers follow-up service and leaves customer satisfied |
| CX_CH_12 | Clears table with courtesy, thanks guests on exit |

**Handling Feedback & Complaints (6):**
| ID | Item |
|---|---|
| CX_FC_1 | What would you do if a customer leaves more than half of the product? |
| CX_FC_2 | How do you handle a customer asking for extra protein in a salad? |
| CX_FC_3 | What do you do if a customer is angry or irritated? |
| CX_FC_4 | What would you do if a customer complains about cold food/coffee? |
| CX_FC_5 | How do you manage service if the wrong item (veg/non-veg) is served? |
| CX_FC_6 | What do you do if a customer sits for a long time post meal? |

---

## ✅ QA Checklist
**Total Questions: 116 across 5 sections**
**Scoring: Weighted compliance-based (Compliant / Partially / Not Compliant / NA)**
**Max Score: 244 points**
**Features:** Per-question images · Image Editor · Per-question remarks · Dual signatures (auditor + SM) · Cloud draft saving · Edit mode · Zero Tolerance · LocalStorage auto-save · Haptic feedback · Auto-fill from mapping

### Audit Details Collected
- QA Auditor Name / QA ID (text, auto-filled from login)
- AM Name / AM ID (dropdown from AREA_MANAGERS)
- Store Name / Store ID (dropdown from STORES)
- City (auto-filled from store mapping)

### Zero Tolerance Rule
> ⚠️ If **ANY** Zero Tolerance question is marked "Non-Compliant", the **entire audit total score = 0**.

### Section 1: Zero Tolerance (6 questions) — Binary Pass/Fail
**Max Points: 24 (4 pts each)**

1. **ZT_1:** No expired food products in inventory or service areas (4 points)
2. **ZT_2:** Secondary shelf life compliance - all opened items properly labeled with dates (4 points)
3. **ZT_3:** Storage conditions - all temperature-sensitive items stored at correct temperatures (4 points)
4. **ZT_4:** Water TDS compliance - water quality within acceptable limits (4 points)
5. **ZT_5:** Temperature sensitive items properly handled during transfer and storage (4 points)
6. **ZT_6:** No pest activity or evidence of pest infestation (4 points)

### Section 2: Store Operations (94 questions)
**Max Points: 155 points**

#### Store Cleanliness & Maintenance (15 questions)

7. **S_1:** Café interior is clean and well-maintained (2 points)
8. **S_2:** No water leakage or moisture issues (2 points)
9. **S_3:** Walls and ceilings are clean and free from stains (2 points)
10. **S_4:** Ceiling tiles/panels intact with no damage (2 points)
11. **S_5:** Doors and windows are clean and functional (2 points)
12. **S_6:** Equipment surfaces are clean and sanitized (2 points)
13. **S_7:** Counters and work surfaces are clean and organized (2 points)
14. **S_8:** Sinks are clean with no clogs or drainage issues (2 points)
15. **S_9:** Waste bins are proper, covered, and regularly emptied (2 points)
16. **S_10:** Washroom is clean, stocked, and maintained (2 points)
17. **S_11:** Staff areas are clean and organized (1 point)
18. **S_12:** Outdoor seating area clean and maintained (if applicable) (1 point)
19. **S_13:** Tables and chairs are clean and in good condition (2 points)
20. **S_14:** Menu boards are clean, updated, and clearly visible (2 points)
21. **S_15:** Signage is clean, properly lit, and clearly visible (2 points)

#### Floors & Storage (5 questions)

22. **S_16:** Floor is clean, dry, and free from debris (2 points)
23. **S_17:** No items stored directly on the floor (2 points)
24. **S_18:** All items properly labeled with dates and contents (2 points)
25. **S_19:** FIFO (First In First Out) method followed for all inventory (2 points)
26. **S_20:** Temperature logs maintained and up to date (2 points)

#### Documentation & Compliance (10 questions)

27. **S_21:** Cleaning schedules displayed and being followed (2 points)
28. **S_22:** Hand washing signs properly displayed at wash stations (1 point)
29. **S_23:** Emergency exit routes clearly marked and accessible (2 points)
30. **S_24:** First aid kit available and fully stocked (1 point)
31. **S_25:** MSDS (Material Safety Data Sheets) available and accessible (2 points)
32. **S_26:** Pest control reports available and current (2 points)
33. **S_27:** Equipment maintenance logs up to date (2 points)
34. **S_28:** Supplier documentation properly maintained (2 points)
35. **S_29:** Training records maintained for all staff (2 points)
36. **S_30:** Action plans from previous audits reviewed and addressed (2 points)

#### Recipe & Portion Control (5 questions)

37. **S_31:** Product specifications available and current (1 point)
38. **S_32:** Recipe cards available for all menu items (2 points)
39. **S_33:** Portion control tools available and used (2 points)
40. **S_34:** Thermometers available and calibrated (2 points)
41. **S_35:** Weighing scales available and calibrated (2 points)

#### Equipment & Tools (15 questions)

42. **S_36:** Timer devices available and functional (1 point)
43. **S_37:** Probe thermometer available and calibrated (2 points)
44. **S_38:** pH meter available (if required) (1 point)
45. **S_39:** Refrigeration units clean and functioning properly (2 points)
46. **S_40:** Freezer units clean and maintaining correct temperature (2 points)
47. **S_41:** Hot holding equipment maintaining proper temperature (2 points)
48. **S_42:** Cold holding equipment maintaining proper temperature (2 points)
49. **S_43:** Cooking equipment clean and functioning properly (2 points)
50. **S_44:** Coffee machine clean and well-maintained (2 points)
51. **S_45:** Grinder clean and functioning properly (2 points)
52. **S_46:** Ice machine clean and producing clear ice (2 points)
53. **S_47:** Water dispenser clean and functional (1 point)
54. **S_48:** Dishwasher functioning and using correct detergent (2 points)
55. **S_49:** 3-compartment sink set up properly for manual washing (2 points)
56. **S_50:** Sanitizer solution at correct concentration (2 points)

#### Utensils & Storage (20 questions)

57. **S_51:** Test strips available for checking sanitizer concentration (1 point)
58. **S_52:** Dish racks clean and in good condition (1 point)
59. **S_53:** Utensils stored properly off the floor (2 points)
60. **S_54:** Cutting boards color-coded and in good condition (2 points)
61. **S_55:** Knives sharp, clean, and properly stored (2 points)
62. **S_56:** Small wares clean and in good condition (1 point)
63. **S_57:** Pots and pans clean and properly stored (2 points)
64. **S_58:** Serving utensils clean and properly stored (2 points)
65. **S_59:** Glassware clean, chip-free, and properly stored (2 points)
66. **S_60:** Plates and bowls clean and chip-free (2 points)
67. **S_61:** Cups stored inverted to prevent contamination (1 point)
68. **S_62:** Trays clean and in good condition (1 point)
69. **S_63:** Food containers clean with tight-fitting lids (2 points)
70. **S_64:** Ingredient bins clean and properly labeled (2 points)
71. **S_65:** Storage shelves clean and organized (2 points)
72. **S_66:** Dry storage area clean, organized, and pest-free (2 points)
73. **S_67:** Chemical storage separate from food items (2 points)
74. **S_68:** Packaging materials stored properly (1 point)
75. **S_69:** No damaged or torn packaging in use (1 point)
76. **S_70:** Raw and cooked foods properly separated (2 points)

#### Allergen & Display Management (9 questions)

77. **S_71:** Allergen information available and accurate (2 points)
78. **S_72:** Allergen cross-contamination prevention measures in place (2 points)
79. **S_73:** Dietary requirement labels clear and accurate (1 point)
80. **S_74:** Food samples handled hygienically (1 point)
81. **S_75:** Display cases clean and items protected (2 points)
82. **S_76:** Sneeze guards in place for self-service areas (2 points)
83. **S_77:** Self-service stations monitored and maintained (1 point)
84. **S_78:** Condiments properly stored and within expiry (1 point)
85. **S_79:** Ice bins clean and ice handled with scoops only (2 points)

#### Service Stations (15 questions)

86. **S_80:** Beverage station clean and organized (2 points)
87. **S_81:** Napkins, straws, and stirrers properly stocked (1 point)
88. **S_82:** Lids and cups properly stored and accessible (1 point)
89. **S_83:** Takeaway packaging clean and properly stored (1 point)
90. **S_84:** Delivery bags clean and maintained (if applicable) (1 point)
91. **S_85:** POS area clean and organized (2 points)
92. **S_86:** Cash handling procedures followed correctly (2 points)
93. **S_87:** Customer feedback system in place and monitored (1 point)
94. **S_88:** Complaint log maintained and reviewed (2 points)
95. **S_89:** Sales records properly maintained (2 points)
96. **S_90:** Inventory records accurate and up to date (2 points)
97. **S_91:** Waste log maintained and analyzed (2 points)
98. **S_92:** Energy consumption monitored (1 point)
99. **S_93:** Water usage monitored (1 point)
100. **S_94:** Sustainability initiatives implemented (1 point)

### Section 3: A Section (3 questions)
**Max Points: 6 points**

101. **A_1:** All audit requirements properly met (2 points)
102. **A_2:** Documentation complete and accurate (2 points)
103. **A_3:** Compliance with regulatory standards verified (2 points)

### Section 4: Maintenance (11 questions)
**Max Points: 17 points**

104. **M_1:** Window screens/mesh intact and in good condition (2 points)
105. **M_2:** No structural damage to building (walls, floors, ceiling) (2 points)
106. **M_3:** No exposed electrical wiring (2 points)
107. **M_4:** Lighting adequate throughout the facility (1 point)
108. **M_5:** Fire extinguishers properly placed and serviced (2 points)
109. **M_6:** No gaps/holes that could allow pest entry (2 points)
110. **M_7:** Pest control devices properly placed and maintained (2 points)
111. **M_8:** Equipment maintenance records available (1 point)
112. **M_9:** Plumbing fixtures functional with no leaks (2 points)
113. **M_10:** Freezers and chillers functioning at correct temperatures (2 points)
114. **M_11:** RO water system functional and serviced (1 point)

### Section 5: HR Compliance (2 questions)
**Max Points: 4 points**

115. **HR_1:** Medical fitness records available for all food handlers (2 points)
116. **HR_2:** Annual medical examination completed for all staff (2 points)

---

## 💰 Finance Assessment
**Total Questions: 35 across 7 sections**
**Scoring: Weighted — Yes (full weight) / No (0)**
**Max Score: 76 points**
**Features:** Per-question images · Per-question remarks · Dual signatures (auditor + SM) · PDF report export · Historic data fetch · LocalStorage auto-save · Haptic feedback · Auto-fill from mapping

### Audit Details Collected
- Finance Auditor Name / Finance Auditor ID (text)
- AM Name / AM ID (dropdown from AREA_MANAGERS)
- Store Name / Store ID (dropdown from STORES)

### Section 1: Cash Handling & Settlement (6 questions)

| # | ID | Question | Weight |
|---|---|---|---|
| 1 | Q1 | Were no discrepancies found during the cash drawer verification? | 4 |
| 2 | Q2 | Were no discrepancies found during the petty cash verification? | 3 |
| 3 | Q3 | Sale cash is not being used for petty cash or other purposes | 2 |
| 4 | Q4 | Has banking of cash been done accurately for the last 3 days? | 2 |
| 5 | Q5 | Was the previous day's batch correctly settled in the EDC machine? | 2 |
| 6 | Q6 | Has the petty cash claim process been properly followed with supporting documents? | 3 |

### Section 2: Billing & Transactions (6 questions)

| # | ID | Question | Weight |
|---|---|---|---|
| 7 | Q7 | Is billing completed for all products served to customers? | 4 |
| 8 | Q8 | Are there no open transactions pending in the POS system? | 2 |
| 9 | Q9 | Are discount codes and vouchers applied correctly and as per policy? | 2 |
| 10 | Q10 | Is the employee meal process followed as per policy? | 2 |
| 11 | Q11 | Is there no price discrepancy between Menu, POS, Home Delivery (HD), and Pickup? | 1 |
| 12 | Q12 | Is the customer refund process followed properly with approval and documentation? | 1 |

### Section 3: Product & Inventory Compliance (7 questions)

| # | ID | Question | Weight |
|---|---|---|---|
| 13 | Q13 | Were no expired items found during the audit? | 4 |
| 14 | Q14 | Is FIFO / FEFO strictly followed for all food and beverage items? | 3 |
| 15 | Q15 | Are all local purchase items correctly updated in the system? | 2 |
| 16 | Q16 | Is the inventory posted in the system with complete and accurate details? | 2 |
| 17 | Q17 | Is the MRD for all products properly updated? | 2 |
| 18 | Q18 | Are all products available and actively used as per the menu? | 2 |
| 19 | Q19 | Are products properly displayed or stored according to storage SOPs? | 1 |

### Section 4: Documentation & Tracking (4 questions)

| # | ID | Question | Weight |
|---|---|---|---|
| 20 | Q20 | Are all manual transactions properly approved and recorded? | 2 |
| 21 | Q21 | Is the cash log book updated daily and verified by the store manager? | 2 |
| 22 | Q22 | Are bank/cash deposit slips maintained and filed systematically? | 2 |
| 23 | Q23 | Are stock delivery challans filed and updated properly? | 2 |

### Section 5: POS System & SOP (4 questions)

| # | ID | Question | Weight |
|---|---|---|---|
| 24 | Q24 | Is wastage correctly recorded and disposed as per SOP? | 2 |
| 25 | Q25 | Are TI / TO / GRN entries done accurately and posted in the system? | 2 |
| 26 | Q26 | Is the POS and store system used only for designated operational tasks? | 2 |
| 27 | Q27 | Is the store team aware of SOPs and compliance requirements? | 2 |

### Section 6: Licenses & Certificates (5 questions)

| # | ID | Question | Weight |
|---|---|---|---|
| 28 | Q28 | Are trade licenses available and displayed with proper validity? | 1 |
| 29 | Q29 | Are Shop & Establishment licenses available and displayed with proper validity? | 1 |
| 30 | Q30 | Is the FSSAI license available and displayed with proper validity? | 1 |
| 31 | Q31 | Music licenses available and displayed with proper validity? | 1 |
| 32 | Q32 | Is the GST certificate available and displayed with proper validity? | 1 |

### Section 7: CCTV Monitoring (3 questions)

| # | ID | Question | Weight |
|---|---|---|---|
| 33 | Q33 | Is the CCTV system functioning properly? | 2 |
| 34 | Q34 | Is there a backup of 30 / 60 days of footage with proper coverage of critical areas? | 2 |
| 35 | Q35 | Are no SOP, compliance, or integrity violations observed in CCTV sample review? | 3 |

---

## 🏪 SHLP Assessment
**Total Questions: 35 across 8 sections**
**Scoring: Mixed (Negative / Positive / Default — see below)**
**Max Score: ~70 (varies by scoring type)**
**Features:** GPS geofencing (100 m radius) · Per-question remarks · Employee search/auto-fill · LocalStorage auto-save · Auto-fill from mapping

### Scoring Types
- **Negative scoring** (8 items): Yes = +2, No = **−2**
- **Positive/Exceptional scoring** (3 items): 0 / 1 / 2 / +2 (= 4 max)
- **Default scoring** (24 items): 0 / 1 / 2
- **N/A option:** SHLP_33 only

### Audit Details Collected
- Employee Name / Employee ID (search from employee directory)
- Store (dropdown, filtered by GPS within 100 m)
- Auditor Name (auto-filled from login)
- AM ID / AM Name (auto-filled from store mapping)
- Trainer ID / Trainer Name (auto-filled from store mapping)

### Section 1: Store Readiness (4 questions)

| # | ID | Question | Scoring |
|---|---|---|---|
| 1 | SHLP_1 | Complete Opening, Mid, and Closing checklists | **Negative** (Yes=+2, No=−2) |
| 2 | SHLP_2 | Ensure store readiness before opening | **Negative** (Yes=+2, No=−2) |
| 3 | SHLP_3 | Check VM of food case & merchandise wall (stocked and fixed) | **Negative** (Yes=+2, No=−2) |
| 4 | SHLP_4 | Ensure marketing & promotional collaterals are correctly displayed | Default (0/1/2) |

### Section 2: Product Quality & Standards (5 questions)

| # | ID | Question | Scoring |
|---|---|---|---|
| 5 | SHLP_5 | Conduct dial-in checks for coffee & food | **Negative** (Yes=+2, No=−2) |
| 6 | SHLP_6 | Do not allow sub-standard products to be served | Default (0/1/2) |
| 7 | SHLP_7 | Ensure recipes, SOPs, and standards are followed | Default (0/1/2) |
| 8 | SHLP_8 | Understand impact on COGS, wastage & variances | Default (0/1/2) |
| 9 | SHLP_9 | Ensure sampling activation & coffee tasting | Default (0/1/2) |

### Section 3: Cash & Administration (5 questions)

| # | ID | Question | Scoring |
|---|---|---|---|
| 10 | SHLP_10 | Check petty cash, float & safe amount | Default (0/1/2) |
| 11 | SHLP_11 | Fill cash log book for handover | **Negative** (Yes=+2, No=−2) |
| 12 | SHLP_12 | Arrange float/change for POS | Default (0/1/2) |
| 13 | SHLP_13 | Complete GRN & petty cash entries | **Negative** (Yes=+2, No=−2) |
| 14 | SHLP_14 | Follow ordering flow/schedule | Default (0/1/2) |

### Section 4: Team Management (8 questions)

| # | ID | Question | Scoring |
|---|---|---|---|
| 15 | SHLP_15 | Conduct team briefing (updates, promotions, grooming) | **Negative** (Yes=+2, No=−2) |
| 16 | SHLP_16 | Communicate shift goals & targets | Default (0/1/2) |
| 17 | SHLP_17 | Motivate team to follow TWC standards | Default (0/1/2) |
| 18 | SHLP_18 | Plan team breaks effectively | Default (0/1/2) |
| 19 | SHLP_19 | Identify bottlenecks & support team — C.O.F.F.E.E, LEAST, R.O.A.S.T and clearing station blockages or hurdles | Default (0/1/2) |
| 20 | SHLP_20 | Recognize top performers | **Positive** (0/1/2/+2, max 4) |
| 21 | SHLP_21 | Provide task-specific feedback to partners | Default (0/1/2) |
| 22 | SHLP_22 | Share performance inputs with Store Manager | Default (0/1/2) |

### Section 5: Operations & Availability (7 questions)

| # | ID | Question | Scoring |
|---|---|---|---|
| 23 | SHLP_23 | Monitor product availability & update team | **Negative** (Yes=+2, No=−2) |
| 24 | SHLP_24 | Utilize lean periods for training & coaching | Default (0/1/2) |
| 25 | SHLP_25 | Utilize peak periods for customer experience & business | Default (0/1/2) |
| 26 | SHLP_26 | Adjust deployment based on shift need | Default (0/1/2) |
| 27 | SHLP_27 | Adjust shift priorities as required | Default (0/1/2) |
| 28 | SHLP_28 | Follow receiving, storing & thawing guidelines | **Positive** (0/1/2/+2, max 4) |
| 29 | SHLP_29 | Remove thawing products as per schedule | Default (0/1/2) |

### Section 6: Safety & Compliance (3 questions)

| # | ID | Question | Scoring |
|---|---|---|---|
| 30 | SHLP_30 | Follow key handling process and proactively hand over in case of leave or weekly off | Default (0/1/2) |
| 31 | SHLP_31 | Follow Lost & Found SOP | Default (0/1/2) |
| 32 | SHLP_32 | Log maintenance issues | Default (0/1/2) |

### Section 7: Shift Closing (1 question)

| # | ID | Question | Scoring |
|---|---|---|---|
| 33 | SHLP_33 | Complete all closing tasks thoroughly | Default (0/1/2) + **N/A option** |

### Section 8: Business Acumen (2 questions)

| # | ID | Question | Scoring |
|---|---|---|---|
| 34 | SHLP_34 | Shift Performance analysis (PSA) — LTO, LA, IPS, ADS, AOV drivers, CPI, MA, QA & BSC understanding | **Positive** (0/1/2/+2, max 4) |
| 35 | SHLP_35 | Check and keep record of EB Units as per their shift | Default (0/1/2) |

---

## 🎓 Campus Hiring Assessment
**Total Questions: 30 across 6 categories (5 each)**
**Scoring: Weighted MCQ — best answer = 3 pts, middle = 2 pts, weakest = 1 pt**
**Max Score: 90 points**
**Features:** 30-minute countdown timer · Auto-submit on expiry · Proctoring (camera + microphone) · Tab-switch detection · Face detection · Noise monitoring · Rules page before start · Lockout on excessive violations · LocalStorage auto-save

### Audit Details Collected
- Candidate Name (text)
- Email (text)
- Campus Name (dropdown)

### Category 1: Psychometric (Q1–Q5)

**Q1:** Imagine you're explaining a new drink recipe to a teammate whose first language isn't English. You:
- A: Repeat exactly what was told to you *(1 pt)*
- B: Try to explain in simple words and gestures *(2 pts)*
- **C: Ask them what part they didn't understand and explain accordingly *(3 pts)***

**Q2:** A drink consistently tastes off. You:
- A: Remake it and hope it improves next time *(1 pt)*
- B: Try adjusting the grind or recipe slightly *(2 pts)*
- **C: Document the issue and escalate it to the trainer *(3 pts)***

**Q3:** Your team isn't following the cleaning checklist. You:
- A: Do it yourself without mentioning it *(1 pt)*
- B: Remind them casually *(2 pts)*
- **C: Call a short huddle and reinforce expectations *(3 pts)***

**Q4:** A customer says their drink tastes "strange." You:
- A: Say sorry and move on *(1 pt)*
- B: Offer to remake it once *(2 pts)*
- **C: Ask specifics and tailor a solution *(3 pts)***

**Q5:** You find a wallet on the café floor. You:
- A: Leave it at the counter *(1 pt)*
- B: Keep it safe and note the time *(2 pts)*
- **C: Record it and report to shift lead *(3 pts)***

### Category 2: English Proficiency (Q6–Q10)

**Q6:** Which sentence is grammatically correct?
- A: The team are working hard. *(1 pt)*
- **B: The team is working hard. *(3 pts)***
- C: The team were working hard. *(2 pts)*

**Q7:** Choose the correctly spelled word:
- A: Occured *(1 pt)*
- B: Ocurred *(1 pt)*
- **C: Occurred *(3 pts)***

**Q8:** Select the sentence with proper punctuation:
- **A: Let's eat, Grandma! *(3 pts)***
- B: Lets eat Grandma! *(1 pt)*
- C: Let's eat Grandma! *(1 pt)*

**Q9:** What is the meaning of "proactive"?
- A: Reacting after something happens *(1 pt)*
- **B: Taking action in advance *(3 pts)***
- C: Being professional *(1 pt)*

**Q10:** Complete: "Neither the manager ___ the team members were present."
- A: or *(1 pt)*
- **B: nor *(3 pts)***
- C: and *(1 pt)*

### Category 3: Numerical Aptitude (Q11–Q15)

**Q11:** Ratio of flour:sugar is (x+2):(x−1). Mixture = 21 kg, sugar = 6 kg. Find x.
- A: 1 *(1)* | B: 2 *(1)* | C: 3 *(1)* | **D: 4 *(3)***

**Q12:** ₹20,000 at 10% compound interest for 3 years. Amount?
- A: ₹24,200 *(1)* | **B: ₹26,620 *(3)*** | C: ₹26,000 *(1)* | D: ₹27,300 *(1)*

**Q13:** 40% of 300 guests ordered breakfast. How many?
- A: 100 *(1)* | **B: 120 *(3)*** | C: 140 *(1)* | D: 160 *(1)*

**Q14:** Dish costs ₹250, sold at 20% profit. Selling price?
- A: ₹270 *(1)* | B: ₹275 *(1)* | **C: ₹300 *(3)*** | D: ₹320 *(1)*

**Q15:** 2 waiters set 30 tables in 3 hrs. 1 waiter in 2 hrs?
- A: 5 *(1)* | **B: 10 *(3)*** | C: 15 *(1)* | D: 20 *(1)*

### Category 4: Logical Reasoning (Q16–Q20)

**Q16:** Circular seating: Six guests A-F around a table. B sits 2nd right of A, E not adjacent to B, C opposite A, F immediate left of C. Who sits immediate right of D?
- A: A *(1)* | B: B *(1)* | **C: E *(3)*** | D: F *(1)*

**Q17:** Room allocation puzzle: P, Q, R, S in rooms 101-104. Q not in 101/102. R in odd room. S next to Q. P not in 104. Where is R?
- A: 101 *(1)* | **B: 103 *(3)*** | C: 104 *(1)* | D: Cannot be determined *(1)*

**Q18:** Syllogism: All chefs are trained professionals. Some trained professionals are management graduates. No management graduate is untrained. Conclusions?
- A: Only I follows *(1)* | B: Only II follows *(1)* | **C: Both I and II follow *(3)*** | D: Neither *(1)*

**Q19:** Coding: SERVICE → TFWVJHK. How is QUALITY coded?
- **A: RVCPNKZ *(3)*** | B: RVDQMJZ *(1)* | C: RBENLJX *(1)* | D: RVCOLKZ *(1)*

**Q20:** Direction: Walk 6m north, 8m east, 6m south. Distance from start?
- A: 4 m *(3)* | B: 6 m *(1)* | C: 8 m *(1)* | D: 10 m *(1)*

### Category 5: Analytical Aptitude (Q21–Q25)

**Q21:** Walked 15m south → right 3m → right 15m. Facing?
- A: East *(1)* | B: West *(1)* | **C: North *(3)*** | D: South *(1)*

**Q22:** ₹30 in 50p, ₹1, ₹2 coins (ratio 4:2:1). Count of 50p coins?
- **A: 20 *(3)*** | B: 10 *(1)* | C: 5 *(1)* | D: 15 *(1)*

**Q23:** 7% loss. ₹800 more → 9% profit. Find CP.
- A: 500 *(1)* | B: 4000 *(1)* | C: 6000 *(1)* | **D: 5000 *(3)***

**Q24:** Number of triangles in given figure?
- A: 8 *(1)* | B: 10 *(1)* | C: 12 *(1)* | **D: 14 *(3)***

**Q25:** Triangles and squares in given figure?
- A: 36△, 7□ *(1)* | B: 38△, 9□ *(1)* | **C: 40△, 7□ *(3)*** | D: 42△, 9□ *(1)*

### Category 6: Course Curriculum (Q26–Q30)

**Q26:** What falls in the danger zone?
- A: 1-5°C *(1)* | **B: 22-58°C *(3)*** | C: 65-80°C *(1)* | D: 2-4°C *(1)*

**Q27:** The two parts of HACCP include:
- **A: Hazard analysis and critical control points *(3)*** | B: Health analysis and critical control points *(1)* | C: Hazard analysis and critical conformation production *(1)* | D: Health analysis and critical conformation production *(1)*

**Q28:** What is The Third Wave Movement of coffee about?
- **A: Bean to cup *(3)*** | B: Flavoured coffee *(1)* | C: Farm to cup *(1)* | D: Monetization of coffee *(1)*

**Q29:** Which ISO standard is applicable for the QSR industry?
- **A: ISO 9001 *(3)*** | B: ISO 22001 *(1)* | C: ISO 22000 *(1)* | D: ISO 27001 *(1)*

**Q30:** Which of these is not a type of contamination?
- A: Biological *(1)* | B: Chemical *(1)* | C: Physical *(1)* | **D: Mental contamination *(3)***

---

## 📝 Forms — MT Feedback
**Total Questions: 16 (11 Likert scored + 5 open text)**
**Scoring: Weighted Likert (1-5 × weight_percent, normalized to 0-100)**
**Features:** AM dropdown · LocalStorage auto-save · Haptic feedback

### Audit Details Collected
- AM (dropdown from AREA_MANAGERS)

### Overall Experience (1 question, weight 15%)

| # | ID | Question | Weight% |
|---|---|---|---|
| 1 | Q1 | Rate your overall learning experience during the Management Trainee (MT) journey. | 15% |

### Training Effectiveness (3 questions, weight 25%)

| # | ID | Question | Weight% |
|---|---|---|---|
| 2 | Q2 | The training content and delivery (classroom and on-ground) effectively built my understanding of café operations. | 10% |
| 3 | Q3 | The LMS modules were easy to access, engaging, and supported my overall learning. | 10% |
| 4 | Q4 | The training structure provided adequate practice time and opportunities to reflect on learning. | 5% |

### Trainer & On-Ground Support (3 questions, weight 25%)

| # | ID | Question | Weight% |
|---|---|---|---|
| 5 | Q5 | My trainer provided clear guidance, timely feedback, and consistent support throughout my training. | 10% |
| 6 | Q6 | My Store Manager ensured structured learning opportunities and clarity of expectations. | 7% |
| 7 | Q7 | My Area Manager was approachable and provided adequate guidance during my training journey. | 8% |

### Workplace Culture & Environment (2 questions, weight 15%)

| # | ID | Question | Weight% |
|---|---|---|---|
| 8 | Q8 | I felt respected, included, and supported in the workplace during my training. | 7% |
| 9 | Q9 | I understand Third Wave Coffee's culture, values, and vision, and I feel motivated to build a long-term career here. | 8% |

### Application & Readiness (2 questions, weight 20%)

| # | ID | Question | Weight% |
|---|---|---|---|
| 10 | Q10 | I feel confident applying what I learned during the Buddy Trainer course in my café. | 12% |
| 11 | Q11 | I have had sufficient opportunities to apply my learning in real café situations. | 8% |

### Open Feedback (5 questions, not scored)

| # | ID | Question |
|---|---|---|
| 12 | Q12 | What suggestions would you like to share to improve the Management Trainee training experience? |
| 13 | Q13 | How can your manager or team better support you in applying this training? |
| 14 | Q14 | Were there any topics you wish had been covered in greater depth? |
| 15 | Q15 | What aspects of the training could be improved? |
| 16 | Q16 | Did the training and experience meet your expectations throughout your journey as a Barista and Buddy Trainer? Please explain. |

---

## 📋 Bench Planning — Barista→SM
**Structure: 3 Tabs (Readiness → Assessment → Interview)**
**Features:** Panelist dashboard · Locked readiness gate · Per-candidate evaluation · Haptic feedback · Employee directory search

### Tab 1: Readiness Assessment (11 items, scored 0/1/2 each)

| # | Item |
|---|---|
| 1 | Has completed all product and process knowledge modules on LMS. |
| 2 | Demonstrates strong understanding of SOPs and stays updated with any changes in process or communication. |
| 3 | Has completed the Food Safety module in LMS and consistently applies standards, correcting others when needed. |
| 4 | Maintains punctuality and regular attendance. |
| 5 | Consistently maintains high personal grooming and hygiene standards, setting an example for others. |
| 6 | Proactively leads pre-shift huddles and supports in store training (e.g., during LTO rollouts, communication etc). |
| 7 | Takes initiative to support store operations beyond assigned tasks. |
| 8 | Shows positive influence and motivates team members during service. |
| 9 | Has experience in coaching or mentoring new team members. |
| 10 | Can independently manage short shifts with minimal supervision. |
| 11 | Handles guest concerns or complaints calmly and confidently. |

### Tab 2: Assessment MCQs (15 questions, Correct answer = 1 pt each)

| # | Question | Correct |
|---|---|---|
| 1 | Which statement reflects true leadership in a café? | A — "I support the team, step in, and debrief." |
| 2 | The café sold 200 cups @ ₹140, 25% margin. Profit? | B — ₹7,000 |
| 3 | Team member skipping an SOP step. How to address? | C — Give 1:1 feedback and demonstrate |
| 4 | Long pickup queue forming. Most effective move? | C — Add floater to pickup/expedite |
| 5 | X at POS 4 hrs without break, café busy. Action? | D — Arrange cover, give X break, rotate |
| 6 | Sales ₹9,200. Cash ₹9,000. Discrepancy? | D — ₹200 short; unbilled order or theft |
| 7 | Series: 7, 14, 28, 56, ___? | B — 112 |
| 8 | 7L milk/day, 12% increase, 7-day order? | D — 54.9L |
| 9 | 5 members, 3 peak hours, deployment? | D — 2-2-1 split |
| 10 | 3% wastage on ₹18,000 stock? | D — ₹540 |
| 11 | Customer waiting, order delayed. First response? | D — "I'm sorry… let me check." |
| 12 | Right priority order during operations? | C — Customer → Team → Cost |
| 13 | Guest says Americano too bitter. Action? | A — Apologize, remake, check dial-in |
| 14 | A(POS), B(Espresso), C(Cold bar). Rush in 15 min. Who breaks? | B — Espresso barista |
| 15 | Oat milk stock low, may not last. Action? | D — Inform manager, limit SKU, suggest alternatives |

### Tab 3: Interview — RESPECT Competencies (7 sections, scored 1-5 each)

| # | Competency |
|---|---|
| 1 | **R**esponsibility |
| 2 | **E**mpathy |
| 3 | **S**ervice Excellence |
| 4 | **P**erformance with Purpose |
| 5 | **E**thics and Integrity |
| 6 | **C**ollaboration |
| 7 | **T**rust |

> **Note:** Bench Planning SM→ASM follows the same 3-tab structure with elevated leadership criteria.

---

## 🎓 Bench Planning — BT (Buddy Trainer)
**Structure: 3 Steps (Readiness → BT Session → Skill Check)**
**Pass Threshold: Readiness = 45/46, BT Session = 12/15 (80%)**
**Features:** Per-candidate evaluation · Employee directory search · Haptic feedback · Locked progression

### Step 1: Readiness (23 items across 3 categories, scored 0/1/2, max 46)

**People Skills (9 items):**

| ID | Item |
|---|---|
| PS_1 | Recognized as a peer leader by colleagues |
| PS_2 | Respects and values all people equally |
| PS_3 | Demonstrates friendliness and professionalism |
| PS_4 | Communicates clearly and effectively |
| PS_5 | Recognizes and appreciates the work of others |
| PS_6 | Trains/Coaches fellow partners on correct procedures |
| PS_7 | Shares knowledge and experience with new Partners |
| PS_8 | Willing to answer queries without being asked |
| PS_9 | Learns from mistakes and applies feedback |

**Customer Service Skills (8 items):**

| ID | Item |
|---|---|
| CS_1 | Delivers 100% customer-centric service (C.O.F.F.E.E) with "Can-Do Attitude" |
| CS_2 | Maintains proper uniform and grooming standards |
| CS_3 | Handles customer concerns using L.E.A.S.T. |
| CS_4 | Confidently answers customer queries |
| CS_5 | Ensures consistent product quality (never serves poor-quality product) |
| CS_6 | Understands and follows Customer Service & TWC processes |
| CS_7 | Proactively resolves customer complaints |
| CS_8 | Goes the extra mile to satisfy customers |

**Work Ethic & Business Contribution (6 items):**

| ID | Item |
|---|---|
| WE_1 | Displays a positive attitude at work |
| WE_2 | Punctual and supports team when short-staffed |
| WE_3 | Suggests improvements for store operations |
| WE_4 | Shows interest in business results |
| WE_5 | Follows the "Clean as You Go" principle |
| WE_6 | Adheres to restaurant safety procedures |

### Step 2: BT Session MCQs (15 questions, passing 12/15 = 80%)

| # | Question | Correct |
|---|---|---|
| 1 | As a Buddy Trainer, your primary responsibility is to: | B — Act as an extension of Field Trainers and support learning |
| 2 | Most important outcome of good buddy training? | C — Consistent TWC experience for customers |
| 3 | Creating a good learning environment means: | C — Making trainee comfortable asking questions/making mistakes |
| 4 | Why assess prior knowledge before teaching? | C — To adapt training based on experience |
| 5 | If trainee has NO experience, Buddy Trainer should: | C — Explain definitions, concepts, demonstrate step by step |
| 6 | Which learning method helps remember most? | D — Seeing, hearing, and doing |
| 7 | Feedback should always intend to: | C — Help the trainee improve |
| 8 | Treating feedback as a "gift" means: | C — Help the trainee learn and grow from it |
| 9 | Reinforcing feedback is used when: | B — Trainee performs a task correctly |
| 10 | Redirecting feedback should focus on: | B — What went wrong, what should be done, why it matters |
| 11 | Approach for redirecting feedback? | B — What–Why–How |
| 12 | Trainees remember more if they: | B — Practice the task under supervision |
| 13 | Trainee struggles to steam milk. Action? | C — Demonstrate again, guide practice, offer feedback |
| 14 | TWC Buddy Training philosophy based on: | B — Practice, patience, and consistency |
| 15 | A Buddy Trainer should always: | B — Praise publicly, redirect privately |

### Step 3: Skill Check (13 criteria across 4 phases, scored Yes/No)

**Prepare (5):**
| ID | Step | Standard |
|---|---|---|
| PREP_1 | Trainer is knowledgeable | Has in-depth knowledge of the task and procedures |
| PREP_2 | Gathers required tools & info | Prepares necessary materials and references |
| PREP_3 | Informs trainee what they'll learn | Clearly explains the objective |
| PREP_4 | Puts learner at ease | Friendly tone, smiles, reassures mistakes are part of learning |
| PREP_5 | Breaks learning into smaller steps | Structured step-by-step instructions |

**Present (3):**
| ID | Step | Standard |
|---|---|---|
| PRES_1 | Shows training tools to trainee | Introduces learning materials for self-learning |
| PRES_2 | Shows & tells the skill | Demonstrates while explaining each step |
| PRES_3 | Explains importance of the skill | Provides reasons behind each step |

**Practice (3):**
| ID | Step | Standard |
|---|---|---|
| PRAC_1 | Asks trainee to demonstrate | Trainee performs under supervision |
| PRAC_2 | Encourages confident performance | Provides encouragement during practice |
| PRAC_3 | Corrects any mistakes | Identifies errors, provides constructive feedback |

**Follow-Up (2):**
| ID | Step | Standard |
|---|---|---|
| FU_1 | Asks questions for understanding | Uses open-ended questions to check comprehension |
| FU_2 | Repeats Present & Practice if needed | Re-demonstrates and allows additional practice |

---

## ☕ Brew League — AM/Region Round
**Scoring: Weighted per item (1-5 pts)**
**Types: Technical (Manual / Automatic) and Sensory scoresheets**
**Features:** Per-participant evaluation · PDF scoresheet export (jsPDF) · Employee directory lookup · Historic data fetch · Brew League dashboard

### Grooming & Hygiene (8 items)

| ID | Item | Weight |
|---|---|---|
| SanitizedHands | Has the barista sanitized their hands (using Soap) | 1 |
| ApronClean | Is the barista apron free from stains and damage | 1 |
| NameTag | Is the barista wearing a name tag | 1 |
| FormalPants | Is the barista wearing black formal pants | 1 |
| BlackShoes | Is the barista wearing black shoes | 1 |
| GroomingStandards | Barista following grooming standards (Beard/Hair/Make-up) | 2 |
| NailsTrimmed | Is the barista's nails trimmed | 1 |
| JewelryPermitted | Only permitted jewelry worn | 1 |

### Espresso Dial-In (20 items per shot × 2 shots = 40 items)

| ID | Item | Weight |
|---|---|---|
| GrindChange | Able to change grind size based on under/over extracted shot | 5 |
| ExplainDialIn | Able to explain the dial-in process | 3 |
| WasteDose | Wasted a dose after changing grind size every time | 3 |
| CheckWeight | Checked weight of ground coffee after changing grind | 2 |
| GrindingTime | Able to set grinding time for correct dose | 2 |
| GrinderCleaned | Area around grinder cleaned with brush | 2 |
| PortaFilterDry | Porta filter wiped with dry grey cloth | 2 |
| BasketFreeGrounds | Basket free from brewed coffee grounds | 2 |
| RightBasket | Right basket porta filter used for intended shot | 2 |
| RightGrammage | Right grammage of ground coffee taken | 2 |
| CoffeeLevelled | Grounds levelled using tap/chop method before tamping | 3 |
| TampingMachine | Tamping machine set as per standard | 2 |
| PortaFilterRim | Rim wiped to clear loose grounds before inserting | 2 |
| FlushGrouphead | Flushes the grouphead before insertion | 3 |
| DripTrayWiped | Drip tray wiped with the right green cloth | 2 |
| PortaFilterSmooth | Inserted into group head smoothly without knocking | 3 |
| ExtractionButton | Right button pressed within 3 seconds of inserting | 3 |
| FlowEvenly | Espresso flows evenly from both spouts | 3 |
| ShotBrewTime | Shot extracted within the brew time | 5 |
| ShotYield | Shot extracted within the yield (+/- 1 g) | 5 |

### Milk-Based Beverages — Steaming (10 items per cup × 2 cups)

| ID | Item | Weight |
|---|---|---|
| SteamingPurged | Steaming wand purged before use | 3 |
| CleanPitcher | Uses clean milk pitcher for every order | 2 |
| RightPitcher | Right pitcher for intended beverage size | 3 |
| ColdMilk | Using cold milk stored in chiller | 3 |
| MilkPouch | Milk pouch stored in the 900ml pitcher | 1 |
| RightMilkAmount | Right amount of milk for intended beverage size | 3 |
| FoamConsistency | Right consistency of foam for latte/cappuccino/flat white | 3 |
| SteamingWiped | Steaming wand wiped & purged after use | 3 |
| GreenClothSteam | Right green cloth used to wipe steam wand | 3 |
| GreenClothStored | Green cloth stored in GN pan after use | 2 |

### Milk-Based Beverages — Pouring (5 items per cup × 2 cups)

| ID | Item | Weight |
|---|---|---|
| EspressoPulled | Espresso shot pulled within 30 sec of steaming | 3 |
| MillPoured | Milk poured within 30 sec of pulling shot | 3 |
| PouringHeight | Milk poured from correct height | 2 |
| LatteArtPattern | Able to create a latte art pattern | 5 |
| CupWiped | Cup wiped before serving | 2 |

### Sensory Score (12 items — used in sensory scoresheet)

| ID | Item | Weight |
|---|---|---|
| CupImages | Cup 1 & 2 Images (Together) | 0 |
| LatteArtStandard | Latte art as per TWC std (Cappuccino=Heart, Latte=Tulip/Rosetta, Flat white=Single dot) | 5 |
| ShinyGlossy | Was it shiny and glossy? | 3 |
| NoBubbles | No visible bubbles on the surface | 3 |
| ArtInCenter | Latte art in the centre of the cup | 3 |
| VisibleContrast | Visible contrast between crema and latte art | 3 |
| ArtFacingCustomer | Latte art facing customer with handle on right side | 5 |
| ArtCoverage | Latte art covers 70% of cup surface | 3 |
| FrothLevel | Froth level as per TWC standard (3 Swipes=Cappuccino, 2=Latte, 1=Flat white) | 4 |
| FrothRatio | Froth ratio as per TWC standard (70/30 cappuccino, 90/10 latte, micro foam flat white) | 5 |
| BaristaSmile | Barista smiled and engaged with the judge | 3 |
| CleanCounter | Counter left clean after performance | 3 |

---

## 🔧 Audit Details Per Checklist

Summary of what information is collected at the top of each checklist before questions begin:

| Checklist | Fields Collected |
|---|---|
| **HR** | HR Name/ID, AM Name/ID, Employee Name/ID, Store |
| **Operations** | HR Name/ID, AM Name/ID, Trainer Name/ID, Store, BSC%, People on Shift, Manpower, Café Type, Store Type, Concept |
| **Training** | AM Name/ID, Trainer Name/ID, Store, MOD |
| **QA** | QA Name/ID, AM Name/ID, Store, City |
| **Finance** | Finance Auditor Name/ID, AM Name/ID, Store |
| **SHLP** | Employee Name/ID, Store (GPS filtered), Auditor, AM ID/Name, Trainer ID/Name |
| **Campus Hiring** | Candidate Name, Email, Campus Name |
| **Forms (MT)** | AM Name |
| **Bench Planning** | Candidate Name/ID, Store, Panelist |
| **Brew League** | Participant Name/ID, Store, Judge |

---

## 📊 Summary Table

| Checklist | Questions | Scored | Max Score | Scoring Type | Images | Remarks | Signatures | Drafts |
|---|:---:|:---:|:---:|---|:---:|:---:|:---:|:---:|
| **HR Connect** | 12 | 9 | 45 | 1-5 Likert | — | — | — | — |
| **AM Operations** | 63 | 63 | 63 | Binary Yes/No | ✅ sec | ✅ sec | — | — |
| **Training Audit** | 47 + 92 TSA | 44 base | 70 base | Weighted 1-4 pts | ✅ sec | — | — | — |
| **QA Checklist** | 116 | 116 | 244 | Compliance-weighted | ✅ Q | ✅ Q | ✅ | ✅ |
| **Finance** | 35 | 35 | 76 | Weighted Yes/No | ✅ Q | ✅ Q | ✅ | — |
| **SHLP** | 35 | 35 | ~70 | Mixed neg/pos/default | — | ✅ Q | — | — |
| **Campus Hiring** | 30 | 30 | 90 | MCQ weighted | — | — | — | — |
| **Forms (MT)** | 16 | 11 | 100% | Weighted Likert | — | — | — | — |
| **Bench — SM** | 33 | 33 | varies | 0-2 + MCQ + 1-5 | — | ✅ | — | — |
| **Bench — BT** | 51 | 51 | 46+15+13 | 0-2 + MCQ + Yes/No | — | — | — | — |
| **Brew League** | 100+ | 100+ | varies | Weighted 1-5 | — | — | — | — |

**Legend:** ✅ sec = per section · ✅ Q = per question

---

## 📝 Notes

### HR Connect
- Focus on employee satisfaction, work environment, and organizational support
- Includes both quantitative ratings and qualitative feedback
- Text responses for colleague recognition and suggestions
- HRBP-based store filtering limits visible stores per HR user

### AM Operations (COFFEE Framework)
- **C**heerful Greeting — Store presentation and first impressions
- **O**rder Taking Assistance — POS operations and order management
- **F**riendly & Accurate Service — Food preparation and service quality
- **F**eedback with Solution — Data review and continuous improvement
- **E**njoyable Experience — Customer engagement and CCTV monitoring
- **E**nthusiastic Exit — Recognition and motivation

### Training Audit
- Covers training materials, LMS usage, buddy trainers, and partner knowledge
- TSA sub-checklists (Food/Coffee/CX) are **per-employee** evaluations with ~92 items total
- Some questions have negative scoring for critical compliance items (LMS, PK_7, AP_1)
- Image Editor allows annotation of uploaded photos
- Focus on training infrastructure and partner competency

### QA Checklist
- Most comprehensive assessment with 116 questions
- **Zero Tolerance** section is pass/fail — any failure = entire audit score = 0
- Covers physical infrastructure, food safety, hygiene, and compliance
- Full cloud draft system — save partially completed audits, resume later
- Edit mode allows re-submitting previously completed audits
- Image Editor for annotating photos per question

### Finance Assessment
- 35 questions across 7 sections (updated from original 30/4-section structure)
- Per-question images and remarks for evidence documentation
- Dual signatures from auditor and store manager
- Historic data fetch for trend comparison
- PDF report export with embedded images

### SHLP Assessment
- GPS geofencing limits store selection to within 100m radius
- Designed for Store Health Leader Program shift assessments
- 8 negative-scoring items penalize critical failures with −2
- 3 positive/exceptional items reward outstanding performance up to 4 pts
- Per-question remarks for detailed observations

### Campus Hiring
- Full proctoring: camera, microphone, face detection, noise monitoring
- Tab-switch detection with violation tracking and lockout
- 30-minute countdown timer with auto-submit on expiry
- Rules/instructions page must be accepted before starting
- Lockout on excessive proctoring violations

### Forms (MT Feedback)
- Weighted percentage scoring — each question contributes proportionally
- Open feedback section captures 5 text responses (not scored)
- Designed for Management Trainee journey evaluation

### Bench Planning
- Three sub-types: Barista→SM, SM→ASM, Barista→BT
- Locked progression: must pass readiness before assessment
- RESPECT competency framework used in interview panel
- BT has strict passing thresholds (readiness 45/46, session 12/15)

### Brew League
- Competition-style coffee skills evaluation
- Two rounds: AM Round and Region Round (identical scoring structure)
- Technical and Sensory scoresheet modes
- PDF scoresheet export per participant
- Dashboard view for standings and results

---

**Document last updated:** March 22, 2026
**Source:** Prism Training Management System
