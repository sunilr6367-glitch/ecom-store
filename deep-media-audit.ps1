Write-Output "--- STEP 1 ---"
Get-ChildItem -Recurse -Path "storefront/src/lib/media" 2>$null | ForEach-Object { Write-Output "=== $($_.FullName) ==="; Get-Content $_.FullName }
Get-ChildItem -Recurse -Filter "*media*" -Path "storefront/src/lib" 2>$null | ForEach-Object { Write-Output "=== $($_.FullName) ==="; Get-Content $_.FullName }

Write-Output "--- STEP 2 ---"
Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "storefront/src/lib" | Select-String -Pattern "CLOUDINARY|cloudinary|cloud_name|CLOUD_NAME" | Select-Object Filename, LineNumber, Line

Write-Output "--- STEP 3 ---"
if (Test-Path deploy/hostinger/.env) { Get-Content deploy/hostinger/.env } else { Write-Output "File not found locally" }

Write-Output "--- STEP 4 ---"
Get-Content .github/workflows/deploy-hostinger.yml | Select-String -Pattern "CLOUDINARY" | Select-Object Line
