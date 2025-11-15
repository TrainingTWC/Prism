# Campus Hiring Assessment - Category Breakdown

## Question Distribution by Category

This document shows how the 30 psychometric assessment questions are distributed across the 12 behavioral categories.

### Category Question Counts

| Category | Question Count | Max Score | Questions |
|----------|----------------|-----------|-----------|
| **Communication** | 3 | 9 | Q1, Q2, Q17 |
| **Problem Solving** | 5 | 15 | Q3, Q4, Q11, Q18, Q26 |
| **Leadership** | 3 | 9 | Q5, Q7, Q22 |
| **Attention to Detail** | 3 | 9 | Q6, Q8, Q19 |
| **Customer Service** | 3 | 9 | Q9, Q12, Q24 |
| **Integrity** | 3 | 9 | Q10, Q23, Q25 |
| **Teamwork** | 2 | 6 | Q13, Q29 |
| **Time Management** | 2 | 6 | Q14, Q27 |
| **Planning** | 1 | 3 | Q15 |
| **Adaptability** | 3 | 9 | Q16, Q21, Q30 |
| **Analysis** | 1 | 3 | Q20 |
| **Growth Mindset** | 1 | 3 | Q28 |

**Total:** 30 questions, 90 max points (30 × 3)

## Scoring System

Each question has 3 options (A, B, C) with weights:
- **Option A:** Weight 1 (Low proficiency)
- **Option B:** Weight 2 (Medium proficiency)
- **Option C:** Weight 3 (High proficiency)

### Category Percentage Calculation

For each category:
```
Category Percentage = (Category Score / Category Max Score) × 100
```

Example:
- If a candidate scores 7/9 in Communication (answered Q1=C, Q2=B, Q17=C)
- Calculation: (3 + 2 + 3) / 9 = 8/9 = 88.89%

### Overall Score Calculation

```
Overall Percentage = (Total Score / 90) × 100
```

Example:
- If a candidate scores 75/90
- Calculation: 75 / 90 = 83.33%

## Fixed Bug

**Previous Issue:** Category max scores were only counting answered questions, not all questions in the category. This caused incorrect percentage calculations.

**Example of Bug:**
- Communication has 3 questions (max 9 points)
- If only 2 questions were answered (e.g., 5 points)
- Old calculation: 5/6 = 83.33% ❌ (wrong, only counted 2 questions)
- Fixed calculation: 5/9 = 55.56% ✅ (correct, counts all 3 questions)

**Fix Applied:** The `calculateResults()` function now pre-initializes all category max scores based on total questions in each category, regardless of which questions are answered.

## Console Logging

When submitting an assessment, the following information is logged to the browser console:

```
=== Campus Hiring Assessment Submission ===
Candidate: John Doe
Total Score: 75 / 90 = 83.33%
Category Scores:
  Communication: 8/9 = 88.89%
  Problem Solving: 13/15 = 86.67%
  Leadership: 7/9 = 77.78%
  Attention to Detail: 9/9 = 100.00%
  Customer Service: 8/9 = 88.89%
  Integrity: 9/9 = 100.00%
  Teamwork: 5/6 = 83.33%
  Time Management: 6/6 = 100.00%
  Planning: 3/3 = 100.00%
  Adaptability: 8/9 = 88.89%
  Analysis: 3/3 = 100.00%
  Growth Mindset: 3/3 = 100.00%
```

This helps verify that percentage calculations are correct before submission.

## Google Apps Script Integration

The assessment data is sent to Google Apps Script with:
- Candidate information (name, phone, email, campus)
- All 30 question answers (A, B, or C)
- All 30 answer weights (1, 2, or 3)
- Overall score (total/max/percentage)
- 12 category percentages

Sheet columns: A-CC (103 columns total)
- A-F: Metadata (timestamp, candidate info)
- G-I: Overall scores
- J-BQ: 30 questions (answer + weight for each)
- BR-CC: 12 category percentages
