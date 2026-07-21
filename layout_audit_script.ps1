$ErrorActionPreference = "Continue"

Write-Output "## STEP 1 — Homepage components layout audit"
Get-Content storefront/src/components/home/HeroSection.tsx | Out-String
Get-Content storefront/src/components/home/BestSellers.tsx | Out-String
Get-Content storefront/src/components/home/CollectionsSection.tsx | Out-String
Get-Content storefront/src/components/home/BrandStory.tsx | Out-String
Get-Content storefront/src/components/home/InstagramSection.tsx | Out-String
Get-Content storefront/src/components/home/NewsletterSection.tsx | Out-String
Get-Content storefront/src/components/home/CircularCategories.tsx | Out-String

Write-Output "## STEP 2 — PDP layout audit"
Get-Content storefront/src/components/products/ProductView.tsx | Out-String
Get-Content storefront/src/styles/components/pdp.css | Out-String

Write-Output "## STEP 3 — Typography scale check"
Get-Content storefront/src/styles/tokens.css |
  Select-String -Pattern "ds-text-|ds-font-|ds-leading-|ds-type-" |
  Select-Object Line | Out-String

Get-Content storefront/src/styles/typography.css | Out-String

Write-Output "## STEP 4 — Spacing usage check"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src/components/home" |
  ForEach-Object {
    $hits = Get-Content $_.FullName |
      Select-String -Pattern "py-|px-|gap-|space-|p-\[|m-\[" |
      Where-Object { $_ -notmatch "var\(--ds-" }
    if ($hits) {
      Write-Output "=== $($_.Name) ==="
      $hits | Select-Object LineNumber, Line | Out-String
    }
  }

Write-Output "## STEP 5 — Color usage check"
Get-ChildItem -Recurse -Filter "*.tsx" -Path "storefront/src/components/home" |
  ForEach-Object {
    $hits = Get-Content $_.FullName |
      Select-String -Pattern "bg-\[|text-\[|border-\[" |
      Where-Object { $_ -notmatch "var\(--ds-" }
    if ($hits) {
      Write-Output "=== $($_.Name) ==="
      $hits | Select-Object LineNumber, Line | Out-String
    }
  }

Write-Output "## STEP 6 — Product card component"
Get-Content storefront/src/components/products/ProductCard.tsx | Out-String
Get-Content storefront/src/styles/components/product-card.css | Out-String

Write-Output "## STEP 7 — Nav height and header"
Get-Content storefront/src/components/layout/HeaderMain.tsx | Out-String
Get-ChildItem -Recurse -Filter "*.css" -Path "storefront/src/styles" |
  Select-String -Pattern "header|nav-height|h-\[" -Context 0,3 |
  Select-Object Filename, Line | Out-String
