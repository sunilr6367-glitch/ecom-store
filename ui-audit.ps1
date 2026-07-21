Write-Output "--- STEP 1 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src/components/home" | ForEach-Object {
  $file = $_.Name
  $hits = Get-Content $_.FullName | Select-String -Pattern "<Button|<ButtonLink|<ButtonAnchor|<Link|<a " | Where-Object { $_ -notmatch "\/\/" }
  if ($hits) { Write-Output "=== $file ==="; $hits | Select-Object LineNumber, Line }
}

Write-Output "--- STEP 2 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src" | Select-String -Pattern 'variant="[^"]*"' | Select-Object Filename, LineNumber, Line | Sort-Object { $_.Line }

Write-Output "--- STEP 3 ---"
Get-Content storefront/src/components/home/BestSellers.tsx | Select-String -Pattern "View All|ButtonLink|Button|href" | Select-Object LineNumber, Line

Write-Output "--- STEP 4 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src/components/home" | Select-String -Pattern "<Link.*className|<a.*className" | Select-Object Filename, LineNumber, Line

Write-Output "--- STEP 5 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src/components/home" | ForEach-Object {
  $file = $_.Name
  $content = Get-Content $_.FullName -Raw
  $hasViewAll = $content -match "View All|See All|Shop All|Shop Now"
  if ($hasViewAll) {
    Write-Output "=== $file ==="
    Get-Content $_.FullName | Select-String -Pattern "View All|See All|Shop All|Shop Now|href=" | Select-Object LineNumber, Line
  }
}

Write-Output "--- STEP 6 ---"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src" | Select-String -Pattern "View All|See All|Shop All" | Select-Object Filename, LineNumber, Line
