# Convert PRISM logo to base64 for PDF embedding
# This script converts the PRISM logo to base64 format

Write-Host "Converting PRISM logo to base64..." -ForegroundColor Cyan

# PRISM logo base64 (from the uploaded image)
# This is a placeholder - you'll need to save the actual PRISM logo as PNG first
$logoPath = Join-Path $PSScriptRoot '..' 'assets' 'prism-logo-pdf.png'
$outputPath = Join-Path $PSScriptRoot '..' 'src' 'assets' 'embeddedLogo.ts'

if (Test-Path $logoPath) {
    Write-Host "Found logo at: $logoPath" -ForegroundColor Green
    
    # Read file and convert to base64
    $bytes = [System.IO.File]::ReadAllBytes($logoPath)
    $base64 = [System.Convert]::ToBase64String($bytes)
    
    # Create TypeScript export
    $content = "export const EMBEDDED_LOGO = 'data:image/png;base64,$base64';`n"
    
    # Ensure output directory exists
    $outputDir = Split-Path $outputPath -Parent
    if (!(Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # Write to file
    [System.IO.File]::WriteAllText($outputPath, $content)
    
    Write-Host "✓ Successfully updated embedded logo!" -ForegroundColor Green
    Write-Host "  Output: $outputPath" -ForegroundColor Gray
    Write-Host "`nThe PRISM logo will now appear in all PDF reports:" -ForegroundColor Cyan
    Write-Host "  • AM Scorecards" -ForegroundColor White
    Write-Host "  • Training Audits" -ForegroundColor White
    Write-Host "  • HR Connect Reports" -ForegroundColor White
    Write-Host "  • QA Checklists" -ForegroundColor White
    Write-Host "  • Operations Dashboards" -ForegroundColor White
    Write-Host "  • Campus Hiring Reports" -ForegroundColor White
    Write-Host "  • Finance Audits" -ForegroundColor White
} else {
    Write-Host "Error: Logo file not found!" -ForegroundColor Red
    Write-Host "Please save the PRISM logo as: $logoPath" -ForegroundColor Yellow
    Write-Host "`nYou can download it from your chat attachment and save it as PNG." -ForegroundColor Gray
    exit 1
}
