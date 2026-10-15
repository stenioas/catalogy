# Baseline — 2026-10-15

## Automated checks

| Command | Result |
| --- | --- |
| `pnpm test` | PASS: 55 shared tests, 1 client prebuild test, and 243 client tests; 299 passed, 0 failed, 0 skipped. |
| `pnpm build` | PASS: prebuild test 1/1 and Vite build completed after transforming 2,126 modules. |

## Desktop storefront

Route `/` on `http://localhost:5173/`, before product code changes:

| Viewport | Theme observed | Result |
| --- | --- | --- |
| 1440 × 1000 | Light | The existing storefront shows a three-column product grid, current cards, badges, prices, availability, and WhatsApp buttons. Screenshot was displayed in the conversation. |
| 1024 × 900 | Light | The existing storefront retains the three-column product grid and current card presentation. Screenshot was displayed in the conversation. |

The page reports `color-scheme: light` and body background `rgb(245, 245, 247)` while `prefers-color-scheme: dark` is true. The page has no visible theme control. The documented Playwright `evaluate` API is read-only, so a dark-theme DOM preview was unavailable. No screenshot files were saved locally, as authorized.
