# Update logo script - converts logo image to base64 for PDF embedding

# The TWC logo will be Base64 encoded
# You need to save the image from the chat as 'assets/twc-logo.png' first

$logoPath = Join-Path $PSScriptRoot '..' 'assets' 'twc-logo.png'
$outputPath = Join-Path $PSScriptRoot '..' 'src' 'assets' 'embeddedLogo.ts'

if (Test-Path $logoPath) {
    Write-Host "Converting $logoPath to base64..." -ForegroundColor Green
    
    $bytes = [System.IO.File]::ReadAllBytes($logoPath)
    $base64 = [System.Convert]::ToBase64String($bytes)
    
    $content = "export const EMBEDDED_LOGO = 'data:image/png;base64,$base64';`n"
    
    # Ensure directory exists
    $outputDir = Split-Path $outputPath -Parent
    if (!(Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    [System.IO.File]::WriteAllText($outputPath, $content)
    Write-Host "Successfully wrote $outputPath" -ForegroundColor Green
    Write-Host "Logo updated! The new TWC logo will now appear in all PDF reports." -ForegroundColor Cyan
} else {
    Write-Host "Error: Logo file not found at $logoPath" -ForegroundColor Red
    Write-Host "Please save the Third Wave Coffee logo image as 'assets/twc-logo.png'" -ForegroundColor Yellow
    exit 1
}
