Write-Output "--- STEP 1 ---"
Get-Content storefront/.env.production 2>$null

Write-Output "--- STEP 2 ---"
$nextJsPath = if (Test-Path storefront/next.config.ts) { "storefront/next.config.ts" } elseif (Test-Path storefront/next.config.js) { "storefront/next.config.js" } else { $null }
if ($nextJsPath) { Get-Content $nextJsPath }

Write-Output "--- STEP 3 ---"
Get-ChildItem -Recurse -Filter "*cloudinary*" -Path "storefront/src" | ForEach-Object { Write-Output "=== $($_.FullName) ==="; Get-Content $_.FullName }

Write-Output "--- STEP 4 ---"
Get-ChildItem -Recurse -Filter "OptimizedImage*" -Path "storefront/src" | ForEach-Object { Write-Output "=== $($_.FullName) ==="; Get-Content $_.FullName }

Write-Output "--- STEP 5 ---"
if (Test-Path "storefront/src/app/api") {
  Get-ChildItem -Recurse -Filter "*.ts" -Path "storefront/src/app/api" | Select-String -Pattern "image|cloudinary|CLOUD" | Select-Object Filename, LineNumber, Line | Select-Object -First 20
}

Write-Output "--- STEP 6 ---"
Get-Content storefront/.env.production 2>$null | Select-String -Pattern "CLOUD|IMAGE|API_URL|PUBLIC" | Select-Object Line
