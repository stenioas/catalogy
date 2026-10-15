# T9 — DesktopProductMedia review

## Browser evidence

- Route: temporary local preview at `http://localhost:5173/t9-desktop-product-media.html`, using twelve existing Curren 8455 image files; no product JSON or fixture data was changed.
- Browser: Chrome via CUA; viewport 2560 × 1236; existing light theme. The only captured visual is shown inline in the conversation; no local PNG was saved.
- Measured DOM geometry: the media row is 658 px wide; vertical thumbnails are 56 × 56 px with 4 px between them; horizontal gap is 12 px; the main image stage is 588 × 588 px with `object-contain`; `document.documentElement.scrollWidth === clientWidth === 2560`.
- At initial selection photo 9 (index 8), seven thumbnails and an active `+5` represented the remaining five images. The main photo was contained in the square stage; no arrows, dots, or counter appeared.
- Keyboard: Enter on Foto 3 selected index 2, updated the main action name, retained focus on the thumbnail, and exposed `:focus-visible`. Space on the main action requested the currently selected index 2 and retained visible focus. Enter on `+5` changed the controlled selection and gallery request to index 7, leaving `+5` active.
- Pointer: a 100 px drag across the main photo kept the selected index and gallery request unchanged and stayed on the preview URL; no navigation occurred.
- Color note: the baseline preview is light-only; this review did not change theme configuration.

## Harness correction

The already-running Vite/Tailwind process did not detect utilities from the newly-created preview TSX automatically. The temporary preview stylesheet imports the product's actual `index.css` and declares explicit Tailwind `@source` paths for the component, preview, shared Button, and HoverZoom files. This made the preview reflect the real tokens/utilities without editing product CSS or Vite/Tailwind configuration. The temporary HTML, TSX, and CSS preview files were removed before the commit.

## Automated adequacy

`desktop-product-media.test.tsx` adds 16 scenarios over the five required image counts and controlled states. It checks resulting selected/gallery state and active indicators, not only callback invocation counts. See the T9 Check A and Check C tables in `tasks.md` for assertion-to-requirement traceability. Full `pnpm test` passed: 64 shared + 1 prebuild + 320 client = 385 passed, 0 failed, 0 skipped.

## Scope boundary

`DesktopProductMedia` stays controlled and delegates gallery ownership through callbacks. Closing/reopening the actual gallery and restoring its final selected photo remain with T11; product-page integration remains with T13; final feature review remains with T16.
