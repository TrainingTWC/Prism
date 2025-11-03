# Verify region mapping consistency between complete-region-mapping.js and comprehensive_store_mapping.json

Write-Host "=== Region Mapping Verification ===" -ForegroundColor Cyan
Write-Host ""

# Load comprehensive store mapping
$json = Get-Content "public\comprehensive_store_mapping.json" | ConvertFrom-Json

# Sample stores to verify (from complete-region-mapping.js)
$testStores = @(
    @{Id="S053"; ExpectedRegion="South"},
    @{Id="S076"; ExpectedRegion="West"},
    @{Id="S153"; ExpectedRegion="North"},
    @{Id="S001"; ExpectedRegion="South"},
    @{Id="S105"; ExpectedRegion="West"},
    @{Id="S192"; ExpectedRegion="North"},
    @{Id="S091"; ExpectedRegion="South"},
    @{Id="S027"; ExpectedRegion="North"},
    @{Id="S088"; ExpectedRegion="West"}
)

$allMatch = $true
foreach ($test in $testStores) {
    $store = $json | Where-Object { $_.'Store ID' -eq $test.Id } | Select-Object -First 1
    if ($store) {
        $actualRegion = $store.Region
        $match = $actualRegion -eq $test.ExpectedRegion
        $status = if ($match) { "✅" } else { "❌" }
        Write-Host "$status Store $($test.Id) ($($store.'Store Name')): Expected=$($test.ExpectedRegion), Actual=$actualRegion"
        if (-not $match) { $allMatch = $false }
    } else {
        Write-Host "❌ Store $($test.Id): NOT FOUND in JSON" -ForegroundColor Red
        $allMatch = $false
    }
}

Write-Host ""
Write-Host "=== Region Distribution in comprehensive_store_mapping.json ===" -ForegroundColor Cyan
$regions = $json | Group-Object -Property Region | Sort-Object Name
foreach ($region in $regions) {
    Write-Host "$($region.Name): $($region.Count) stores"
}

Write-Host ""
Write-Host "=== Total Stores ===" -ForegroundColor Cyan
Write-Host "Total: $($json.Count) stores"

Write-Host ""
if ($allMatch) {
    Write-Host "✅ All sampled region mappings are CONSISTENT!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some mappings need attention" -ForegroundColor Yellow
}
