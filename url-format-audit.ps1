Write-Output "--- STEP 1 ---"
Get-Content storefront/src/lib/api-adapters.ts 2>$null

Write-Output "--- STEP 2 ---"
Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "storefront/src" 2>$null | Select-String -Pattern "thumbnail|image_url|images" | Where-Object { $_.Line -match "api\.|fetch|axios" } | Select-Object Filename, LineNumber, Line | Select-Object -First 20

Write-Output "--- STEP 3 ---"
Get-ChildItem -Recurse -Filter "*.ts" -Path "storefront/src/lib" 2>$null | Select-String -Pattern "thumbnail|image_url|\.images" | Select-Object Filename, LineNumber, Line

Write-Output "--- STEP 4 ---"
Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "storefront/src" 2>$null | Select-String -Pattern "kvastram|odhvica\.com/uploads" | Select-Object Filename, LineNumber, Line

Write-Output "--- STEP 5 ---"
try {
  Invoke-RestMethod -Uri "https://api.odhvica.com/products?limit=2" | ConvertTo-Json -Depth 3
} catch {
  Write-Output $_.Exception.Message
}
