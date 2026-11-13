# Live acceptance smoke (opt-in)

Playwright walk-through of the deployed demo (`https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam`): login name entry, WOKA Continue, camera/mic Save, in-world action bar ("Explore the room"), Space opens and closes the Quest Journal iframe, avatar menu -> All settings shows navigation and the journal without the retired guide menu, and a second map (`speaker-aries.wam`) loading. One screenshot per step lands in `ops/acceptance/output/` (gitignored) and a JSON summary is printed; exit code 0 only when every step passes.

Install once (separate from the root install): `cd ops/acceptance && npm ci && npx playwright install chromium` (native arm64 headless Chromium, no `channel:` pin).

Run from the repo root: `npm run acceptance:smoke` or `node ops/acceptance/smoke.mjs [--url <wam url>] [--name <visitor, max 10 chars>] [--out <dir>]`.

This hits the LIVE demo over the network and is not part of `npm test` (vitest does not glob `ops/acceptance/`). Benign console noise (missing optional entity catalog 404, "Cannot load previous WOKA textures") is listed under `console.ignored`; other console errors are reported but do not fail the run.
