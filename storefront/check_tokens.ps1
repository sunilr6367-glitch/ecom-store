$tokens = Get-Content src/styles/tokens.css | Select-String -Pattern "^\s*--ds-[\w-]+" | ForEach-Object { ($_ -split ":")[0].Trim() }
$mapped = Get-Content src/app/globals.css | Select-String -Pattern "var\(--ds-[\w-]+\)" | ForEach-Object { ($_ -match "var\((--ds-[\w-]+)\)") | Out-Null; $matches[1] }
$unmapped = $tokens | Where-Object { $_ -notin $mapped }
foreach ($t in $unmapped) {
  $used = Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern [regex]::Escape($t)
  if ($used) { Write-Output "USED BUT UNMAPPED: $t — found in $($used.Count) places" }
}
