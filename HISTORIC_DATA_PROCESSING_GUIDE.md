# Historic Data Processing Guide

## 📊 Your Data Structure

Your historic data has **individual audit submissions** with these columns:
```
Timestamp | Auditor Name | Auditor ID | Store Name | Store ID | Score | Total Score | Percentage | Health | AM Name | AM ID | Region
```

## 🎯 Target Format for Monthly Trends

We need to convert to **monthly aggregates** with:
```
store_id | store_name | metric_name | metric_value | observed_period | auditor_name | auditor_id | am_name | am_id | region
```

---

## 🔄 Data Transformation Steps

### Option A: Manual Processing in Excel/Sheets (Recommended)

#### Step 1: Open Your Data
1. Copy your historic data to a new sheet
2. Add a helper column for "Month" using formula:
   ```
   =IF(LEFT(A2,2)="07","2025-07",IF(LEFT(A2,2)="08","2025-08",IF(LEFT(A2,2)="09","2025-09","2025-10")))
   ```

#### Step 2: Create Pivot for Monthly Averages
1. Insert → Pivot Table
2. Rows: Store ID, Store Name, Month
3. Values: Average of Score, Average of Percentage
4. This gives you monthly averages per store

#### Step 3: Convert to Required Format
1. Create new sheet with headers:
   ```
   store_id,store_name,metric_name,metric_value,observed_period,am_name,am_id,region
   ```
2. For each store/month combination, create TWO rows:
   - One for "score" metric
   - One for "percentage" metric

#### Example Transformation:
```
Input (July, S001):
Timestamp: 07/15
Store: Koramangala (S001)
Score: 76
Percentage: 89
Region: South
AM: Suresh (H1355)

Output (2 rows):
S001,Koramangala,score,76,2025-07,Suresh,H1355,South
S001,Koramangala,percentage,89,2025-07,Suresh,H1355,South
```

---

### Option B: Using PowerShell Script

I'll create a script to automate this:

```powershell
# Save your historic data as historic_data.txt (tab-separated)
# Run this script to convert to monthly trends CSV

$input = Import-Csv "historic_data.txt" -Delimiter "`t"
$output = @()

# Group by Store ID + Month
$grouped = $input | Group-Object {
    $month = if ($_.Timestamp.StartsWith("07")) { "2025-07" }
    elseif ($_.Timestamp.StartsWith("08")) { "2025-08" }
    elseif ($_.Timestamp.StartsWith("09")) { "2025-09" }
    else { "2025-10" }
    
    "$($_.`"Store ID`")_$month"
}

foreach ($group in $grouped) {
    $first = $group.Group[0]
    $avgScore = ($group.Group | Measure-Object -Property Score -Average).Average
    $avgPercentage = ($group.Group | Measure-Object -Property Percentage -Average).Average
    
    $month = $group.Name.Split('_')[1]
    
    # Add score row
    $output += [PSCustomObject]@{
        store_id = $first."Store ID"
        store_name = $first."Store Name"
        metric_name = "score"
        metric_value = [Math]::Round($avgScore, 1)
        observed_period = $month
        am_name = $first."AM Name"
        am_id = $first."AM ID"
        region = $first.Region
    }
    
    # Add percentage row
    $output += [PSCustomObject]@{
        store_id = $first."Store ID"
        store_name = $first."Store Name"
        metric_name = "percentage"
        metric_value = [Math]::Round($avgPercentage, 1)
        observed_period = $month
        am_name = $first."AM Name"
        am_id = $first."AM ID"
        region = $first.Region
    }
}

$output | Export-Csv "monthly_trends_processed.csv" -NoTypeInformation
Write-Host "Done! Created monthly_trends_processed.csv with $($output.Count) rows"
```

---

## 📋 Quick Manual Method

### For Each Store:

1. **Count submissions per month**
2. **Calculate average score** for that month
3. **Calculate average percentage** for that month
4. **Create 2 rows** in Monthly_Trends sheet:

**Example for Store S001 (Koramangala):**

July submissions: 3 audits
- Scores: 76, 84, 71 → Average: 77
- Percentages: 89, 94, 74 → Average: 85.7

Add to sheet:
```
S001,Koramangala,score,77,2025-07,Suresh,H1355,South
S001,Koramangala,percentage,85.7,2025-07,Suresh,H1355,South
```

---

## 🎨 Simplified Approach (If You Have Many Stores)

### Use Google Sheets QUERY Function:

1. **Import your historic data** to a sheet called "Raw_Data"
2. **In Monthly_Trends sheet**, use this formula:

```
=QUERY(Raw_Data!A:L,
  "SELECT 
   E as store_id,
   D as store_name,
   'score' as metric_name,
   AVG(F) as metric_value,
   CONCAT('2025-',LEFT(A,2)) as observed_period,
   J as am_name,
   K as am_id,
   L as region
   WHERE E is not null
   GROUP BY E, D, LEFT(A,2), J, K, L
   ORDER BY E, LEFT(A,2)",
  1)
```

This automatically:
- Groups by store + month
- Calculates averages
- Creates the required format

---

## 📊 Expected Output

After processing, you should have:
- **~200-300 stores** × **3-4 months** × **2 metrics** = **~1200-2400 rows**

### Sample Output (First 10 rows):
```csv
store_id,store_name,metric_name,metric_value,observed_period,am_name,am_id,region
S001,Koramangala,score,77,2025-07,Suresh,H1355,South
S001,Koramangala,percentage,85.7,2025-07,Suresh,H1355,South
S001,Koramangala,score,84,2025-08,Suresh,H1355,South
S001,Koramangala,percentage,94,2025-08,Suresh,H1355,South
S001,Koramangala,score,71,2025-09,Suresh,H1355,South
S001,Koramangala,percentage,74,2025-09,Suresh,H1355,South
S002,Cmh,score,54,2025-07,Ajay H,H546,South
S002,Cmh,percentage,58,2025-07,Ajay H,H546,South
S002,Cmh,score,85,2025-08,Ajay H,H546,South
S002,Cmh,percentage,87,2025-08,Ajay H,H546,South
```

---

## ✅ Validation Checklist

Before uploading to Google Sheets:

- [ ] Each store has **2 rows per month** (score + percentage)
- [ ] `metric_name` is exactly "score" or "percentage"
- [ ] `metric_value` is a number between 0-100
- [ ] `observed_period` is in YYYY-MM format
- [ ] No duplicate rows (same store_id + metric_name + observed_period)
- [ ] All required columns are filled

---

## 🚀 Next Steps

1. **Process your data** using one of the methods above
2. **Validate** the output
3. **Copy to Google Sheets** → Monthly_Trends tab
4. **Set up Apps Script** (see GOOGLE_APPS_SCRIPT_SETUP_GUIDE.md)
5. **Test the endpoint**
6. **Update dashboard** to fetch from Google Sheets

---

## 💡 Need Help?

If you want me to process the data for you:
1. Save your historic data as a CSV or Excel file
2. Share it (or paste a sample of 20-30 rows)
3. I'll generate the complete processed CSV

Otherwise, follow the manual or script method above!
