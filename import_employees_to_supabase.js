/**
 * Import Employee Data from JSON to Supabase
 * 
 * This script reads employee_data.json and bulk-inserts all employees
 * into your Supabase employee_master table.
 * 
 * Prerequisites:
 * 1. Run supabase_employee_setup.sql first to create the table
 * 2. Get your service_role key from Supabase Dashboard → Settings → API
 * 3. Never commit the service_role key to git!
 * 
 * Usage:
 *   npm install @supabase/supabase-js
 *   node import_employees_to_supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ⚠️ Configuration - Get service_role key from Supabase Dashboard → Settings → API
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://avyhikexewvhsrtnddbl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set!');
  console.error('\n📋 To fix this:');
  console.error('1. Go to: https://avyh1kexewvhsrtnddb1.supabase.co/project/_/settings/api');
  console.error('2. Copy the "service_role" key (NOT the anon key)');
  console.error('3. Run: $env:SUPABASE_SERVICE_ROLE_KEY="your-key-here"; node import_employees_to_supabase.js');
  console.error('\n⚠️  Never commit the service_role key to git!\n');
  process.exit(1);
}

// Create Supabase client with service_role key (bypasses RLS for admin operations)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function importEmployees() {
  try {
    console.log('📖 Reading employee_data.json...');
    
    // Read the existing JSON file
    const jsonPath = join(__dirname, 'public', 'employee_data.json');
    const jsonData = readFileSync(jsonPath, 'utf8');
    const employees = JSON.parse(jsonData);
    
    console.log(`✅ Found ${employees.length} employees in JSON file`);
    
    // Transform JSON format to match Supabase table structure
    const employeeRecords = employees.map((emp) => ({
      employee_code: emp.code,
      empname: emp.name,
      employee_status: 'Existing', // Default status
      // Add other fields if they exist in your JSON:
      // region: emp.region || null,
      // location: emp.location || null,
      // store_code: emp.store_code || null,
      // designation: emp.designation || null,
      // tenure: emp.tenure || null,
      // official_email: emp.email || null
    }));
    
    console.log('📤 Uploading to Supabase...');
    console.log('Sample record:', employeeRecords[0]);
    
    // Batch insert all employees (Supabase handles up to 1000 rows per request)
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < employeeRecords.length; i += batchSize) {
      const batch = employeeRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('employee_master')
        .insert(batch);
      
      if (error) {
        console.error('❌ Error inserting batch:', error);
        throw error;
      }
      
      inserted += batch.length;
      console.log(`✅ Inserted ${inserted}/${employeeRecords.length} employees`);
    }
    
    console.log('✅ Import complete!');
    console.log(`✅ Total imported: ${inserted} employees`);
    
    // Verify the import
    const { data: verifyData, error: verifyError } = await supabase
      .from('employee_master')
      .select('employee_code, empname', { count: 'exact' });
    
    if (verifyError) {
      console.error('❌ Error verifying import:', verifyError);
    } else {
      console.log(`\n🔍 Verification: ${verifyData.length} employees in database`);
      console.log('Sample employees from database:', verifyData.slice(0, 3));
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
console.log('🚀 Starting employee import to Supabase...\n');
importEmployees();
