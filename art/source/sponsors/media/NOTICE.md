# Media partner originals and sponsor caption

The organizers supplied the Duwun and Open Taxi originals through their Sponsor Assets Drive folder on 2026-11-12. Their logos and brand rights remain with their owners; permission is for the VarCamp 2026 map. These assets are not CC0 or collectively MIT.

- Duwun Tech Primary: https://drive.google.com/file/d/1-tfmObQ_FN44-CRB5soJI3gP9ejeQtkJ/view
- OpenTaxi transparent lockup, without tagline: https://drive.google.com/file/d/1rHxoqaiydCLycd9t3aQ2lSImDuEET2j1/view
- Noto Sans Myanmar Regular: https://github.com/notofonts/noto-fonts/blob/main/hinted/ttf/NotoSansMyanmar/NotoSansMyanmar-Regular.ttf

`exports.json` pins the exact source bytes. `node tools/art/media-partner-export.mjs` trims transparent margins and fits each complete original proportionately inside a transparent 192x64 native panel. No logo is recolored, redrawn or generated. The screenshot supplied earlier is not used.

The Lokal Zaytann caption renders the organizer's exact wording `ဒေသစျေးတန်း` with the bundled, unmodified Noto Sans Myanmar font. Its SIL Open Font License 1.1 is retained in `OFL.txt`. Rendering the caption before release avoids a dependency on each visitor's installed Myanmar fonts.
