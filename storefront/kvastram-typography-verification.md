# Odhvica Typography System — Verification Prompt
## Claude Code ke liye — paste karo aur run karwao

---

You are a code auditor. Your job is to verify that the Odhvica Typography System v2 has been correctly implemented across the codebase. Do NOT fix anything yet — only audit and report.

Go through each check below one by one. For every check, search the actual codebase files and report:
- ✅ PASS — if correctly implemented
- ❌ FAIL — with the exact file path, line number, and what is wrong
- ⚠️ PARTIAL — if partially implemented, with details

---

## BLOCK 1 — Font Import

Check `app/layout.tsx` or `app/layout.js`:

1. Is `Cormorant_Garamond` imported from `next/font/google`?
2. Is `DM_Sans` imported from `next/font/google`?
3. Does `Cormorant_Garamond` include weights: `['300', '400', '500', '600', '700']`?
4. Does `Cormorant_Garamond` include styles: `['normal', 'italic']`?
5. Does `Cormorant_Garamond` have `variable: '--font-display'`?
6. Does `DM_Sans` have `variable: '--font-body'`?
7. Are both variables applied to the `<html>` tag via `className`?

---

## BLOCK 2 — CSS Variables

Check `app/globals.css` or `styles/globals.css`:

**Fonts**
8. Is `--font-display` defined as `'Cormorant Garamond', Georgia, serif`?
9. Is `--font-body` defined as `'DM Sans', system-ui, sans-serif`?

**Type Scale — clamp() values**
10. Is `--text-display-xl` defined using `clamp()`? (NOT a fixed px value)
11. Is `--text-display-lg` defined using `clamp()`?
12. Is `--text-display-md` defined using `clamp()`?
13. Is `--text-display-sm` defined using `clamp()`?
14. Is `--text-body-xl` defined using `clamp()`?
15. Is `--text-body-lg` defined using `clamp()`?
16. Is `--text-body-md` defined using `clamp()`?
17. Is `--text-body-sm` defined using `clamp()`?
18. Is `--text-body-xs` defined using `clamp()`?

**Color Variables — all 11 must exist**
19. `--color-text-primary` exists?
20. `--color-text-secondary` exists?
21. `--color-text-muted` exists?
22. `--color-text-disabled` exists?
23. `--color-text-inverse` exists?
24. `--color-text-accent` exists?
25. `--color-text-error` exists?
26. `--color-text-success` exists?
27. `--color-text-price` exists?
28. `--color-text-price-old` exists?
29. `--color-text-sale` exists?

**Max-width Container Variables**
30. `--prose-width: 65ch` exists?
31. `--heading-width: 20ch` exists?
32. `--caption-width: 45ch` exists?
33. `--content-width: 1280px` exists?
34. `--narrow-width: 860px` exists?

**Spacing — clamp() values**
35. `--space-lg` uses `clamp()`?
36. `--space-xl` uses `clamp()`?
37. `--space-2xl` uses `clamp()`?

**Scan for @media breakpoints for font sizes only:**
38. Are there any `@media` rules that change `font-size` for display or body text? If yes, list them — these should not exist since clamp() handles scaling.

---

## BLOCK 3 — Hardcoded Value Scan

Search ALL component files (`.tsx`, `.jsx`, `.css`, `.module.css`) for these patterns. Report every file and line where found:

39. Any `font-size:` with a raw `px` value (e.g. `font-size: 14px`) — should not exist outside globals.css
40. Any `font-size:` with a raw `rem` value that is NOT inside a CSS variable definition (e.g. `font-size: 0.875rem` in a component) — should not exist
41. Any `color:` with a raw hex value on text elements (e.g. `color: #333`, `color: #888`) — should not exist
42. Any `font-family:` with a hardcoded font name (e.g. `font-family: 'Inter'`, `font-family: Georgia`) — should not exist in components
43. Any Tailwind class `text-sm`, `text-lg`, `text-xl`, `text-base`, `text-xs` — these are default Tailwind scale, NOT our custom tokens. Should be replaced with `text-body-sm`, `text-display-md`, etc.
44. Any Tailwind color class like `text-gray-500`, `text-black`, `text-white` on text elements — should be replaced with `text-text-primary`, `text-text-muted`, etc.

---

## BLOCK 4 — Component Checks

For each component, find the file and verify the rules:

**Announcement Bar component:**
45. font-family = `var(--font-body)` or `font-body`?
46. font-size = `var(--text-body-xs)` or `text-body-xs`?
47. color = `var(--color-text-inverse)` or `text-text-inverse`?
48. letter-spacing = `var(--tracking-wide)` or `tracking-wide`?

**Navigation (Navbar/Header component):**
49. Logo: font-family = `var(--font-display)` or `font-display`?
50. Logo: font-size is fixed `1.5rem` (24px) — NOT a variable? (Logo must not scale)
51. Nav links: font-family = `var(--font-body)` or `font-body`?
52. Nav links: font-size = `var(--text-body-lg)` or `text-body-lg`?
53. Nav links: color = `var(--color-text-primary)` or `text-text-primary`?

**Breadcrumb component:**
54. font-family = `var(--font-body)` or `font-body`?
55. font-size = `var(--text-body-xs)` or `text-body-xs`?
56. color = `var(--color-text-muted)` or `text-text-muted`?
57. text-transform = uppercase?
58. letter-spacing = `var(--tracking-wide)` or `tracking-wide`?
59. Separator "/" has color = `var(--color-text-disabled)` or `text-text-disabled`?

**Product Card component:**
60. Product name: font-family = `var(--font-body)` or `font-body`?
61. Product name: font-size = `var(--text-body-md)` or `text-body-md`?
62. Product name: has `-webkit-line-clamp: 2` (2-line clamp)?
63. Product name: has `max-width: var(--caption-width)` or `max-w-caption`?
64. Price: font-size = `var(--text-body-sm)` or `text-body-sm`?
65. Price: color = `var(--color-text-price)` or `text-text-price`?
66. Original price: color = `var(--color-text-price-old)` or `text-text-price-old`?
67. Original price: has `text-decoration: line-through`?
68. Badge: text-transform = uppercase?
69. Badge: letter-spacing = `var(--tracking-wide)` or `tracking-wide`?
70. Brand label ("ODHVICA"): color = `var(--color-text-muted)` or `text-text-muted`?

**Product Detail Page (PDP):**
71. Product title: font-family = `var(--font-display)` or `font-display`?
72. Product title: font-size = `var(--text-display-sm)` or `text-display-sm`?
73. Current price: font-size is fixed `1.5rem` (24px) — NOT a clamp variable?
74. Description: font-family = `var(--font-body)` or `font-body`?
75. Description: has `max-width: var(--prose-width)` or `max-w-prose`?
76. Description: line-height = `var(--leading-relaxed)` or `leading-relaxed` (1.7)?
77. "Out of stock" / stock status: color = `var(--color-text-error)` or `text-text-error`?
78. Trust badge sublabel: color = `var(--color-text-muted)` or `text-text-muted`?

**Section Headings (Homepage sections):**
79. h2 section headings: font-family = `var(--font-display)` or `font-display`?
80. h2 section headings: font-size = `var(--text-display-md)` or `text-display-md`?
81. h2 section headings: have `max-width: var(--heading-width)` or `max-w-heading`?
82. Eyebrow labels: font-family = `var(--font-body)` or `font-body`?
83. Eyebrow labels: text-transform = uppercase?
84. Eyebrow labels: letter-spacing = `var(--tracking-wider)` or `tracking-wider`?
85. Eyebrow labels: color = `var(--color-text-muted)` or `text-text-muted`?

**Collections Page:**
86. Hero heading: font-family = `var(--font-display)` or `font-display`?
87. Hero heading: font-size = `var(--text-display-lg)` or `text-display-lg`?
88. Hero subtext: has `max-width: var(--prose-width)` or `max-w-prose`?

**Shop / Filter Page:**
89. Filter group headings ("CATEGORIES", "COLLECTIONS"): text-transform = uppercase?
90. Filter group headings: letter-spacing = `var(--tracking-wider)` or `tracking-wider`?
91. Filter group headings: color = `var(--color-text-muted)` or `text-text-muted`?
92. Active filter option: color = `var(--color-text-primary)` or `text-text-primary`?

**Forms & Inputs:**
93. Input field: font-size is exactly `1rem` or `16px` (fixed — NOT clamp)?
94. Input placeholder: color = `var(--color-text-disabled)` or `text-text-disabled`?
95. Error message: color = `var(--color-text-error)` or `text-text-error`?
96. Helper text: color = `var(--color-text-muted)` or `text-text-muted`?

**Footer:**
97. Watermark text: font-family = `var(--font-display)` or `font-display`?
98. Watermark text: has opacity `0.06` or very low opacity?
99. Watermark text: has `pointer-events: none` and `user-select: none`?
100. Column headings: text-transform = uppercase?
101. Column headings: letter-spacing = `var(--tracking-wider)` or `tracking-wider`?
102. Footer links: color = `var(--color-text-inverse)` or `text-text-inverse`?

---

## BLOCK 5 — Critical Rule Violations

103. **iOS Zoom Check:** Search all input/textarea elements. Does any have font-size below 1rem (16px)? If yes — CRITICAL FAIL. iOS Safari will auto-zoom on focus.

104. **Uppercase without tracking:** Search for `text-transform: uppercase` or `uppercase` class. For every instance found, check if it also has `letter-spacing` or `tracking-*` applied. Report any uppercase without tracking.

105. **Cormorant on UI elements:** Search for `font-display` or `var(--font-display)` usage. Is it applied to any of these? (any = FAIL):
    - price elements
    - badge elements  
    - nav links
    - buttons
    - filter labels
    - input fields
    - breadcrumb

106. **DM Sans on headings only:** Search for `font-body` or `var(--font-body)` on `h1`, `h2`, `h3` tags. If found — FAIL (headings must use Cormorant).

107. **Body text without max-width:** Find any paragraph, description, or multi-line text block that does NOT have a max-width set. List them.

---

## OUTPUT FORMAT

After running all checks, output a report in this exact format:

```
ODHVICA TYPOGRAPHY VERIFICATION REPORT
========================================

BLOCK 1 — Font Import          [X/7 passed]
BLOCK 2 — CSS Variables        [X/31 passed]
BLOCK 3 — Hardcoded Values     [X violations found]
BLOCK 4 — Component Checks     [X/58 passed]
BLOCK 5 — Critical Rules       [X/5 passed]

TOTAL: X/102 checks passed

---

❌ FAILURES (fix these first):
[List each failure with: Check #, File path, Line number, What is wrong, What it should be]

⚠️ PARTIALS (review needed):
[List each partial]

✅ All passing checks — omit from report to keep it short
```

Do not fix anything. Only report. Start the audit now.
