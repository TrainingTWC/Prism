-- ============================================================
-- Supabase Employee Master Table Setup
-- ============================================================
-- This SQL creates the employee_master table for storing all employee
-- data including ID, name, store, designation, tenure, and metadata.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Create the employee_master table
CREATE TABLE IF NOT EXISTS employee_master (
  id BIGSERIAL PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  empname TEXT NOT NULL,
  employee_status TEXT DEFAULT 'Existing',
  
  -- Location/Store Information
  region TEXT,
  location TEXT,
  city TEXT,
  state TEXT,
  store_code TEXT,
  
  -- Employee Details
  designation TEXT,
  tenure TEXT,
  official_email TEXT,
  join_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_employee_code ON employee_master(employee_code);
CREATE INDEX IF NOT EXISTS idx_employee_status ON employee_master(employee_status);
CREATE INDEX IF NOT EXISTS idx_store_code ON employee_master(store_code);
CREATE INDEX IF NOT EXISTS idx_region ON employee_master(region);

-- Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp on row update
CREATE TRIGGER update_employee_master_updated_at 
  BEFORE UPDATE ON employee_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================
-- Enable RLS on the table
ALTER TABLE employee_master ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous read access for "Existing" employees
-- This allows the browser to fetch employee data using the anon key
CREATE POLICY "Allow anonymous read access to existing employees"
  ON employee_master
  FOR SELECT
  USING (employee_status = 'Existing');

-- Policy 2 (Optional): Allow authenticated users to read all employees
-- Uncomment if you want authenticated users to see inactive employees too
-- CREATE POLICY "Allow authenticated users full read access"
--   ON employee_master
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- Policy 3 (Optional): Admin write access (for service_role key only)
-- This is automatically handled by service_role bypassing RLS
-- No policy needed for admin operations using service_role key

-- ============================================================
-- Sample Data Insert (Optional - for testing)
-- ============================================================
-- Uncomment to insert sample employees for testing:

-- INSERT INTO employee_master (
--   employee_code, empname, employee_status, region, location, city, 
--   state, store_code, designation, tenure, official_email, join_date
-- ) VALUES
--   ('h012', 'Debabrata Das', 'Existing', 'East', 'Kolkata Store', 'Kolkata', 'West Bengal', 'KOL001', 'Store Manager', '3 years', 'debabrata@example.com', '2021-01-15'),
--   ('h081', 'Santhosh B', 'Existing', 'South', 'Bangalore Store', 'Bangalore', 'Karnataka', 'BLR001', 'Barista', '2 years', 'santhosh@example.com', '2022-03-20'),
--   ('h097', 'Roopa M K', 'Existing', 'South', 'Chennai Store', 'Chennai', 'Tamil Nadu', 'CHE001', 'Shift Manager', '4 years', 'roopa@example.com', '2020-06-10');

-- ============================================================
-- Bulk Import from existing employee_data.json
-- ============================================================
-- If you have the existing employee_data.json file, you can import it:
--
-- METHOD 1: Using Supabase Dashboard
-- 1. Go to: Table Editor → employee_master → Insert → CSV Import
-- 2. Convert your JSON to CSV first using a tool or script
--
-- METHOD 2: Using JavaScript/TypeScript Script
-- See the companion file: import_employees_to_supabase.ts
--
-- METHOD 3: Direct SQL INSERT (if you have < 100 employees)
-- Generate INSERT statements from your JSON and paste here

-- ============================================================
-- Verification Queries
-- ============================================================
-- After setup, run these to verify everything works:

-- Check table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'employee_master';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'employee_master';

-- Count total employees
-- SELECT COUNT(*) as total_employees FROM employee_master;

-- Count by status
-- SELECT employee_status, COUNT(*) 
-- FROM employee_master 
-- GROUP BY employee_status;

-- Sample query (what the app will run)
-- SELECT employee_code, empname, employee_status, region, location, 
--        city, state, official_email, store_code, designation, tenure, join_date
-- FROM employee_master
-- WHERE employee_status = 'Existing';

-- ============================================================
-- Notes
-- ============================================================
-- 1. The app expects these exact column names (snake_case)
-- 2. employee_code must be unique and will be used as lookup key
-- 3. employee_status = 'Existing' filters out inactive employees
-- 4. RLS policy allows anonymous reads for security
-- 5. Use service_role key for admin operations (inserts/updates)
-- 6. The app will auto-uppercase employee codes for matching
