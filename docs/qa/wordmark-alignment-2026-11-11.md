# Wordmark alignment verification — 11 November 2026

The live six hashed PNGs matched commit `598c3b5d0b91729a01bae9e1c9af9c81f3e985c2`. Native Chromium reproduced the composition at the entrance, info desk and Solar hall, initially and after reload. No page errors. The cause is the exporter's inherited coordinates, not cache, font loading or infrastructure.

At arrival scale, VARCAMP and MYANMAR 2026 centers differed by 37 pixels; the lines had a 24-pixel gap. New failing-first tests rejected that offset and the booth's uneven margins. The corrected renderer balances the text block against the flame, reduces the main text width about 6%, and centers the subtitle with a 10-pixel line gap. It preserves original subtitle glyphs, original masters, bundled font/license, native footprints and 141 protected source/map/control files.

The predecessor fixture is tied to the above commit: `tests/fixtures/wordmark-alignment/before.json.gz`, SHA-256 `7f04d4898e9fb153eb991791e575c55f7bf8ca69ad54be96ff73a2c7109df652`. The finite transition receipt records only the reviewed artwork/provenance successors; earlier receipts remain unchanged.

Seventeen applicable focused tests passed (alignment 3, typography/provenance 5, event identity 3, original plaza assets 3, arrival identity/export 2, patrol subtitle 1), one file at a time under MemoryMax=6G and MemorySwapMax=0 inside tmux. The historical hall-map pin in the event-identity placement test predates this task and remains separately excluded; no full-suite success is claimed.

Release and browser evidence is retained in `.orca/wordmark-alignment-20261111` and `.qa/release-20261111-wordmark-alignment`. Review, candidate acceptance and guarded live deployment are separate gates; the local final `verification.json` records actual deployment status and readbacks. Original source maps and live saved editor controls must remain unchanged except generated asset/script URL version tokens.

Independent review found two older tests still asserting the former flame boundary and subtitle coordinates. Both failures were reproduced individually under the required cap. The arrival test now checks actual flame-to-lettering separation; the patrol test verifies every opaque and transparent glyph pixel at the aligned position. Both now pass. The renderer and prepared release bytes did not change during this review correction.
