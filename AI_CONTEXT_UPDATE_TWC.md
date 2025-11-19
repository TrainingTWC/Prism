# AI Context Update - Third Wave Coffee

**Date**: November 19, 2025  
**File Updated**: `services/aiInsightsService.ts`  
**Status**: ✅ Complete & Built Successfully

## What Was Updated

The AI insights service has been fully updated with comprehensive **Third Wave Coffee (TWC)** context to replace the previous incorrect restaurant context. The AI will now generate insights specifically relevant to specialty coffee shop operations.

---

## Key Changes

### 1. **Company Context Correction**
- ❌ **Old**: The Waffle Company (restaurant chain)
- ✅ **New**: Third Wave Coffee (specialty coffee chain in India)
- Store format: S### (e.g., S056 Mall of India, S016 Jayanagar, S153 Lajpat Nagar)

### 2. **Staff Roles & Hierarchy**
Updated with coffee shop specific roles:
- **Barista** (café staff, partner) - Front-line coffee preparation
- **Buddy Trainer** - Peer mentor for new hire training
- **Shift Manager** (shift lead, floor lead) - Daily café operations
- **Area Manager (AM)** - Multi-store oversight
- **Regional Manager (RM)** - Regional leadership
- **HRBP** (HR Partner) - Employee relations & engagement
- **Trainer/L&D** - Learning & Development

### 3. **TWC Programs & Systems**
- **RESPECT Values**: Digital badge framework (Responsibility, Empathy, Service Excellence, Performance with Purpose, Ethics, Collaboration, Trust)
- **ZingLearn LMS**: Digital learning management and communication platform
- **Orientation Online**: Digital onboarding for new hires
- **Bench Planning**: Talent pipeline & succession planning
- **HR Connect**: 15-minute employee check-in conversations

### 4. **Coffee Operations Context**
- **Peak Hours**: Morning coffee rush (7-11 AM), evening rush (4-7 PM)
- **Core Activities**: Espresso preparation, milk steaming, latte art, coffee quality control, equipment maintenance
- **Critical Equipment**: Espresso machines, coffee grinders, brewing equipment, milk steamers
- **Coffee Standards**: Bean quality, grind consistency, extraction time, milk temperature, drink presentation

### 5. **Common TWC Issues Identified**
The AI now recognizes coffee shop specific issues:

**Operational:**
- Staffing shortages during morning/evening coffee rush
- Espresso machine or grinder breakdowns
- ZingLearn app/system issues
- Coffee inventory delays (beans, milk, supplies)
- Training gaps (espresso extraction, milk steaming, latte art)
- Work schedule conflicts or insufficient weekly offs

**Management:**
- Area Manager visit frequency and support quality
- Feedback regularity from AM to staff
- RESPECT badge recognition and appreciation
- Fairness in treatment, promotions, opportunities
- Communication clarity on policies and changes

**HR & Workplace:**
- Leave approval delays (EL - Earned Leave, FL - Flexi Leave)
- Overtime payment issues (OT after +30 min)
- Work-life balance (9-hour shifts, 1-hour break, 4 weekly offs/month)
- HRBP responsiveness
- Meal policy (2 beverages + 1 food per working day)

**Team & Culture:**
- Team collaboration and peer support
- Store environment and safety
- Career growth (Barista → Buddy → Shift Manager)
- Empowerment in customer service decisions

### 6. **Survey Question Context Updated**
Each question now has coffee shop specific interpretation:

- **Q1**: Work pressure & staffing - Relates to barista staffing during coffee rush hours
- **Q2**: Empowerment - Can baristas make customer service decisions without constant approval
- **Q3**: AM feedback - How often Area Manager provides guidance
- **Q4**: Fair treatment - Equal opportunities and respect
- **Q5**: Training quality - Wings/ZingLearn effectiveness for barista skills
- **Q6**: Apps/systems - ZingLearn app, POS systems, leave portal issues
- **Q7**: Policy awareness - Understanding TWC policies (leave, OT, meals, RESPECT)
- **Q8**: Schedule satisfaction - Shift timings, weekly offs, work-life balance
- **Q9**: Team collaboration - How well baristas and shift managers work together
- **Q10**: Helpful colleague - Peer recognition
- **Q11**: Suggestions - Staff ideas for café improvements
- **Q12**: Overall experience - General TWC café satisfaction

### 7. **AI Analysis Approach**
The AI now:
- Uses **coffee shop terminology** (barista, espresso, grinder, steamer, rush hour, café)
- References **TWC-specific systems** (ZingLearn, RESPECT badges, HR Connect, Bench Planning)
- Identifies root causes related to **café operations**, not general restaurant issues
- Considers **coffee industry specifics** (quality standards, equipment uptime, barista skills)
- Avoids generic restaurant terms (kitchen, food prep, waitstaff)

### 8. **Monthly Analysis Context**
Added seasonal and operational factors specific to coffee shops:
- Festival seasons and weather affecting coffee consumption
- Holiday staffing challenges
- Equipment failures (espresso machines, grinders)
- ZingLearn system updates
- Coffee quality initiatives
- Barista training program rollouts

---

## TWC Policies Integrated

The AI context now includes key TWC policies from the comprehensive data provided:

| Policy | Details |
|--------|---------|
| **Working Hours** | 9 hours/day with 1-hour break, 4 weekly offs/month (POL-WH-003) |
| **Overtime** | Applies after +30 min beyond scheduled shift |
| **Leave** | EL: 24 days (carry forward 7), FL: 12-14 days (mix of SL/CL/Wellness/Celebratory/Bereavement) |
| **Meals** | 2 beverages + 1 food per working day for store staff (POL-MEAL-012) |
| **POSH** | Sexual harassment reporting via IC/ICC (POL-POSH-005) |
| **Relocation** | Benefits for joining, versatility, self-request, deputation (POL-RELO-013) |
| **Travel** | Local ≤80km, Domestic >80km; personal vehicle reimbursement (POL-TRV-009) |

---

## Example AI Output Changes

### Before (Generic Restaurant):
❌ "Not enough staff during breakfast rush"
❌ "Kitchen equipment maintenance delays"
❌ "Wings training program has gaps"

### After (Coffee Shop Specific):
✅ "Not enough baristas during morning coffee rush (7-11 AM)"
✅ "Espresso machine keeps breaking affecting service quality"
✅ "Need more ZingLearn training on latte art and milk steaming"
✅ "RESPECT badge recognition not happening regularly"
✅ "Weekly offs (4/month) not being scheduled fairly"

---

## Technical Implementation

### Files Modified
- ✅ `services/aiInsightsService.ts` - Updated all AI system prompts with TWC context

### AI Models
- **GitHub Models API**: `gpt-4.1-mini`
- **Endpoint**: `https://models.github.ai/inference/chat/completions`
- **Token Required**: `GITHUB_TOKEN` environment variable

### Caching
- AI insights cached for **30 minutes** to reduce API calls
- Cache key: `{amId}_{submissionCount}`

### Build Status
```
✓ 3202 modules transformed
✓ built in 33.60s
✅ No TypeScript errors
```

---

## Next Steps

### For Better AI Insights:
1. **Set GitHub Token**: Ensure `GITHUB_TOKEN` environment variable is set for AI analysis
2. **Test with Real Data**: Run the app and verify AI generates coffee shop specific insights
3. **Monitor AI Output**: Check that insights reference TWC programs, coffee terminology, and café operations
4. **Adjust Temperature**: Currently set to 0.3 for consistency; can be adjusted if needed

### Future Enhancements:
- Add store-specific context (location, region, typical challenges)
- Incorporate historical trends (month-over-month comparisons)
- Include HRBP-specific insights (regional patterns)
- Add role-specific analysis (Barista vs Shift Manager feedback)

---

## Data Source

This update is based on the comprehensive TWC context data (version 1.5.0) including:
- 8 role definitions with aliases and theme references
- 5 key programs (RESPECT, Orientation, ZingLearn, Bench Planning, HR Connect)
- 10 policy documents with detailed sections and Q&A
- Store hierarchy and naming conventions
- People directory with role/region mapping
- Decision trees for leave requests, POSH reporting, travel booking
- Domain lock and agent guardrails for TWC-specific scope

---

## Summary

The AI insights service is now **fully aligned with Third Wave Coffee operations** and will generate contextually relevant insights for:
- ☕ Specialty coffee shop operations
- 👥 Barista and café staff experiences
- 📊 TWC-specific programs and systems
- 📋 Coffee industry standards and challenges
- 🎯 Actionable recommendations for café management

All insights will use simple, clear language that TWC café staff can easily understand and relate to their daily work experiences.
