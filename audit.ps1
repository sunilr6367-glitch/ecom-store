Write-Output "--- STEP 1 ---"
Get-ChildItem -Recurse -Filter "Button*.tsx" -Path "storefront/src" | ForEach-Object { Write-Output "=== $($_.FullName) ==="; Get-Content $_.FullName }
Get-ChildItem -Recurse -Filter "ButtonLink*.tsx" -Path "storefront/src" | ForEach-Object { Write-Output "=== $($_.FullName) ==="; Get-Content $_.FullName }

Write-Output "--- STEP 2 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src" | Select-String -Pattern "variant=|<Button|<ButtonLink" | Group-Object { $_.Matches[0].Value } | Select-Object Name, Count | Sort-Object Count -Descending

Write-Output "--- STEP 3 ---"
Get-Content storefront/src/styles/tokens.css | Select-String -Pattern "ds-accent-primary|ds-btn|ds-text-inverse|ds-surface-page|ds-text-primary" | Select-Object Line
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src" | Select-String -Pattern "bg-black|text-black|bg-white|text-white" | Where-Object { $_ -notmatch "var\(--ds-" } | Select-Object Filename, LineNumber, Line

Write-Output "--- STEP 4 ---"
Get-Content storefront/src/components/home/BestSellers.tsx

Write-Output "--- STEP 5 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src/components/home" | Select-String -Pattern "<a |<Link|<ButtonLink|<Button" | Select-Object Filename, LineNumber, Line

Write-Output "--- STEP 6 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src" | Select-String -Pattern 'variant="[^"]*"' | ForEach-Object { $_.Matches[0].Value } | Sort-Object | Get-Unique

Write-Output "--- STEP 7 ---"
Get-ChildItem -Recurse -Filter "*.css" -Path "storefront/src/styles" | Select-String -Pattern "\.btn|button\b" -CaseSensitive:$false | Select-Object Filename, LineNumber, Line | Select-Object -First 30

Write-Output "--- STEP 8 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src/components/home" | ForEach-Object {
  $file = $_.Name
  $hits = Get-Content $_.FullName | Select-String -Pattern "bg-black|text-black|#[0-9a-fA-F]|style=\{\{" | Where-Object { $_ -notmatch "var\(--ds-" }
  if ($hits) { Write-Output "=== $file ==="; $hits | Select-Object LineNumber, Line }
}
