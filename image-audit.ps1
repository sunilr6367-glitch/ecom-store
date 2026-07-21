Write-Output "--- STEP 1 ---"
Get-Content storefront/.env.local 2>$null | Select-String -Pattern "CLOUDINARY|cloudinary|CLOUD|IMAGE" | Select-Object Line
Get-Content storefront/.env.production 2>$null | Select-String -Pattern "CLOUDINARY|cloudinary|CLOUD|IMAGE" | Select-Object Line

Write-Output "--- STEP 2 ---"
$nextJsPath = if (Test-Path storefront/next.config.ts) { "storefront/next.config.ts" } elseif (Test-Path storefront/next.config.js) { "storefront/next.config.js" } else { $null }
if ($nextJsPath) { Get-Content $nextJsPath | Select-String -Pattern "image|domain|cloudinary|hostname" -Context 0,3 | Select-Object Line }

Write-Output "--- STEP 3 ---"
Get-ChildItem -Recurse -Filter "OptimizedImage*" -Path "storefront/src" | ForEach-Object { Write-Output "=== $($_.FullName) ==="; Get-Content $_.FullName }

Write-Output "--- STEP 4 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src/components/home" | Select-String -Pattern "image_url|imageUrl|src.*http|cloudinary" | Select-Object Filename, LineNumber, Line | Select-Object -First 10

Write-Output "--- STEP 5 ---"
Get-Content storefront/.env.production 2>$null
