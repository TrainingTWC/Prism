# Import Employees to Supabase - PowerShell Helper Script
# This script helps you import employee data to Supabase

Write-Host "`n🔐 Supabase Employee Import Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if service_role key is set
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY not found!`n" -ForegroundColor Red
    
    Write-Host "📋 Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://avyhikexewvhsrtnddbl.supabase.co/project/_/settings/api" -ForegroundColor White
    Write-Host "2. Copy the 'service_role' key (NOT the anon key)" -ForegroundColor White
    Write-Host "3. Run this command with your key:`n" -ForegroundColor White
    
    Write-Host '   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"; node import_employees_to_supabase.js' -ForegroundColor Green
    
    Write-Host "`n⚠️  WARNING: Never commit the service_role key to git!`n" -ForegroundColor Yellow
    
    # Prompt user to enter key
    Write-Host "Or enter your service_role key now (it won't be saved):" -ForegroundColor Cyan
    $key = Read-Host "Service Role Key"
    
    if ($key) {
        $env:SUPABASE_SERVICE_ROLE_KEY = $key
        Write-Host "`n✅ Key set! Running import...`n" -ForegroundColor Green
        node import_employees_to_supabase.js
    } else {
        Write-Host "`n❌ No key provided. Exiting.`n" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Service role key found! Running import...`n" -ForegroundColor Green
    node import_employees_to_supabase.js
}
