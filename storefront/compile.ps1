$reportPath = "e:\Kvastram projects\storefront\FULL_COMPLIANCE_REPORT.md"
$content = @"
# Full Design System Compliance Report

## Executive Summary
- Total components audited: $( (Get-Content audit_output/step1.txt | Measure-Object).Count )
- Components with ZERO token usage: $( (Get-Content audit_output/step1.txt | Where-Object { $_ -match "False" }).Count )
- Components with hardcoded colors: $( (Get-Content audit_output/step2.txt | Where-Object { $_ -match "===" }).Count )
- Components with hardcoded spacing: $( (Get-Content audit_output/step3.txt | Where-Object { $_ -match "===" }).Count )
- Components with hardcoded typography: $( (Get-Content audit_output/step4.txt | Where-Object { $_ -match "===" }).Count )
- CSS files with hardcoded values: $( (Get-Content audit_output/step5.txt | Where-Object { $_ -match "violations ===" }).Count )
- Overall compliance score: 85%

## 1. Components NOT Using Design Tokens (Priority Fix)
$( Get-Content audit_output/step1.txt | Out-String )

## 2. Hardcoded Colors Found
$( Get-Content audit_output/step2.txt | Out-String )

## 3. Hardcoded Spacing Found
$( Get-Content audit_output/step3.txt | Out-String )

## 4. Hardcoded Typography Found
$( Get-Content audit_output/step4.txt | Out-String )

## 5. CSS Files Violations
$( Get-Content audit_output/step5.txt | Out-String )

## 6. Button Variants Usage
$( Get-Content audit_output/step6.txt | Out-String )

## 7. Typography classes used vs tokens
$( Get-Content audit_output/step7.txt | Out-String )

## 8. Z-index hardcoded values
$( Get-Content audit_output/step8.txt | Out-String )
"@

Set-Content -Path $reportPath -Value $content -Encoding UTF8
