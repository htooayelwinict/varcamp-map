# Current expo roster — 2026-11-12

DigiSec Lab — **Digital Safety Partner**; Newness — **Spark Sponsor**; Lokal Zaytann (ဒေသစျေးတန်း) — **Mini Sponsor**. The larger DigiSec Lab pavilion remains visible from arrival.

At Newness's laptop, visitors can choose “Newness careers” to open [Careers at Newness](https://career.newness.com.mm/) in a new tab. The prompt appears only at the front of the desk; walking through the booth does not open the site automatically. The map does not collect applications.

The six booths below the sponsors open south onto the outside walkway. West: AWS USER GROUP MYANMAR, BSides Myanmar, Vibes Code Tours. East: Open Source Robotics Foundation For Myanmar (OSRFM), Duwun — Media Partner, Open Taxi — Media Partner. Each booth has the same usable floor space, a solid desk, laptop and flowers. The rows use one shared wall behind the booths. Ten Ten is retired from the visible map; its original source and unused atlas reservation remain solely for provenance and stable GIDs.

Media artwork uses the exact originals supplied in Drive. Run `node tools/art/media-partner-export.mjs` to reproduce their native panels and the font-pinned Myanmar caption. See `art/source/sponsors/media/NOTICE.md` for sources and terms. Existing community artwork is preserved; its visible captions follow the organizer's latest spelling.

The following sections record earlier revisions and are historical context.

# Sponsor artwork

## Current official tiers (2026-11-11)

The central Main pavilion displays DigiSec Lab, the Spark booth displays Newness, and the Mini booth displays Lokal Zaytann. Duwun is reserved as a media sponsor and is not added by this change. The five community logos and the Info Desk remain unchanged.

The official originals, permission notes, source links and deterministic export recipe are in `art/source/sponsors/tier-logos/`. See its `NOTICE.md` before replacing artwork. Run `node tools/art/sponsor-logo-export.mjs` to regenerate only these tier panels, or add `--out <directory>` to compare exports without overwriting assets. DigiSec uses two adjoining 192×64 panels, Newness one 192×64 panel and Lokal Zaytann one 128×64 panel. Colours, lettering and proportions are preserved; logos are walkable floor inlays. The one-tile shift of Spark's small table keeps its logo unobscured.

`world/sponsor-logos.json` records the exact source transition; `tools/maps/sponsor-logo-context.ts` appends its four atlas reservations after the previous roster. Existing controls, collision outside the table's two cells, booth entrances and shared walls are preserved. `tests/sponsor-logos.test.ts` covers the originals, export reproducibility, complete native rendering, restricted scope and rejected malformed variants. Run tests individually under the 6 GB memory/no-swap scope documented for this devbox.

## Historical first-arrival placeholders

The arrival uses three independent visible Tiled tile layers. Each complete PNG is a standalone embedded 6×2 tileset with 32px cells, separate from shared furniture atlases, painted below avatars as walkable floor inlays. This representation is rendered by the pinned WorkAdventure engine; its image layers are unsupported. DEMO ORBIT, DEMO NOVA and DEMO ATLAS are original fictional placeholders with no sponsor links or affiliation claims. Their original artwork is dedicated under CC0; provenance and replacement records are in `art/sponsors.json` and included in release credits.

| Slot | Stable PNG path | Editable original | Native footprint |
| --- | --- | --- | --- |
| DEMO ORBIT | `assets/sponsors/demo-01.png` | `art/source/sponsors/demo-01.svg` | 192×64 pixels / 6×2 tiles |
| DEMO NOVA | `assets/sponsors/demo-02.png` | `art/source/sponsors/demo-02.svg` | 192×64 pixels / 6×2 tiles |
| DEMO ATLAS | `assets/sponsors/demo-03.png` | `art/source/sponsors/demo-03.svg` | 192×64 pixels / 6×2 tiles |

1. Export the authorized replacement as a transparent RGBA PNG, exactly **192×64 pixels**, with the complete mark inside the canvas. Choose lettering that remains readable at native size on the dark paving. Preserve the same filename and path for the chosen slot.
2. Replace that PNG directly. Keep the walkable floor footprint clear; do not add mounting posts or frames. The SVG master is an optional editable original; map builds never regenerate the logo from it.
3. Update the corresponding record in `art/sponsors.json` with the replacement owner, permission and applicable license. CC0 covers the original fictional marks only; it does not grant rights to replacement branding.
4. Run `npm run maps:build` to validate maps and refresh previews, then `npm run buildmap` to create the release. Review the arrival preview at native scale and check the PNG in `dist/assets/sponsors/`. The release includes the bytes currently on disk, with no content hash freeze. Changing logos needs no code changes or atlas rebuild.

## Expo booths

All twelve zodiac speaker rooms use the owner-approved Aries treatment: the existing VarCamp Myanmar 2026 mark and three supplied community-partner marks on charcoal wallpaper and cream plates, using their original 6x2/4x2 native tiles. Each original stage border determines its orange trim and presenter zone; listener areas cover every seat and stop before the social foyer. Sagittarius retains its 40-tile width and Pisces its 38-tile height and extra seating row. Capricorn's partner plates are spaced around its original terrace palm. All original zodiac details, furnishings, animations, entries, returns and collision geometry are preserved. The existing art is recorded in `art/source/speaker-room-style.json`; named successors are `world/aries-presentation.json` and `world/speaker-presentation.json`.

The expo hall south of the welcome court keeps twelve stalls inside the original six-column envelopes, with the road at columns62-65, shared aisle at rows80-81 and south walkway at row89. The current presentation is the finite successor in `tools/maps/expo-booths.ts`: all36 round sticker decals and24 balloon bunches are removed, the side dividers stop two tiles earlier, and each stall has the existing `desk-curved` reception counter at its native4×3 tiles (128×96pixels), with a chair beside it. North counters occupy rows77-79 and south counters82-84. Every counter stays out of the aisle. The six north counters are mirrored vertically with native Tiled flags so their closed fronts face south toward the aisle; the south counters retain their north-facing closed fronts. Tile rows, individual tile pixels and collision cells use the same vertical transform.

Nameplates and back walls remain in place. Each logo moves exactly one tile toward its back wall (north rows75-76, south85-86), retaining its original image bytes and exact6×2 or4×2 native footprint. Logos remain unobscured and reachable. No asset is stretched, rescaled or rotated; no new atlas or GID reservation is introduced. The sticker sheet remains allocated but unpainted so its closed expo reservation cannot be reused. The original expo producer and historical epoch receipts remain intact; the approved forward chain applies the booth refinement after the Roadster revision.

North, left to right: DEMO ORBIT, DEMO NOVA, DEMO ATLAS, DEMO VECTOR, DEMO LUMEN, INFO DESK. South: AWS UG MYANMAR, BSIDES MYANMAR, OPENINFRA MM, CODE CIRCLE, DESIGN GUILD, YOUR LOGO HERE. The three partner marks and VarCamp lockup retain their organiser-provided permission records in `art/sponsors.json`. All792 guide cells, four startup cells, portals, event controls, other maps and the car animation are preserved. The collision mask is re-audited for the new counters and shorter dividers (6743 blocked cells). The private guide services stay stopped pending their separate private pin qualification.

### Expo epoch (reviewed atlas admission)

The overworld atlas roster is closed by `art/source/native-ownership-context.json` (65 registered atlases) plus four reviewed reservation families in `tools/maps/native-ownership-context.ts`: the plaza fleet (three drone atlases, mandatory), after it the **expo family**, and after that the **brand assets** (`BRAND_ATLASES`: the owner-provided 4×3 `plaza-fountain` sheet, 128×96, and the 1×3 `plaza-lamp` sheet, 32×96, placed by `tools/maps/brand-assets.ts` as the welcome-court fountain at columns 49-52 / rows 70-72 and six lamp posts on the road's edge columns 62 and 65 at bases 74, 79 and 84; registered under `varcamp-organiser` in `art/sources.json`, policy pinned by `tests/native-context-brand.test.ts`), and last the roadster-v2 epoch (`ROADSTER_V2_ATLAS`, which vacates the registered v1 `roadster` interval; see `docs/operating/roadster.md`), which admits exactly these new embedded tilesets when the current source carries them, each at most once, in source order from GID 11602, with the registered identity and geometry below. The registered DATA file is never rewritten; `tests/native-context-expo.test.ts` pins the policy.

| Member | Tileset / layer name | Image | Native footprint |
| --- | --- | --- | --- |
| Booth mark `demo-01` | `Expo / Demo Orbit` | `assets/sponsors/demo-01.png` | 192×64 / 6×2 |
| Booth mark `demo-03` | `Expo / Demo Atlas` | `assets/sponsors/demo-03.png` | 192×64 / 6×2 |
| Booth mark `demo-01-compact` | `Expo / Demo Orbit Compact` | `assets/sponsors/demo-01-compact.png` | 128×64 / 4×2 |
| Booth mark `demo-02-compact` | `Expo / Demo Nova Compact` | `assets/sponsors/demo-02-compact.png` | 128×64 / 4×2 |
| Booth mark `demo-03-compact` | `Expo / Demo Atlas Compact` | `assets/sponsors/demo-03-compact.png` | 128×64 / 4×2 |
| Booth mark `demo-04` | `Expo / Demo Vector` | `assets/sponsors/demo-04.png` | 128×64 / 4×2 |
| Booth mark `demo-05` | `Expo / Demo Lumen` | `assets/sponsors/demo-05.png` | 128×64 / 4×2 |
| Booth mark `hub-01` | `Expo / Code Circle` | `assets/sponsors/hub-01.png` | 128×64 / 4×2 |
| Booth mark `hub-02` | `Expo / Design Guild` | `assets/sponsors/hub-02.png` | 128×64 / 4×2 |
| Booth mark `hub-03` | `Expo / Data Club` | `assets/sponsors/hub-03.png` | 128×64 / 4×2 |
| Booth mark `hub-04` | `Expo / Game Jam` | `assets/sponsors/hub-04.png` | 128×64 / 4×2 |
| Booth mark `hub-05` | `Expo / Open Source` | `assets/sponsors/hub-05.png` | 128×64 / 4×2 |
| Booth mark `partner-aws-ug-mm` | `Expo / AWS User Group Myanmar` | `assets/sponsors/partner-aws-ug-mm.png` | 128×64 / 4×2 |
| Booth mark `partner-bsides-mm` | `Expo / BSides Myanmar` | `assets/sponsors/partner-bsides-mm.png` | 128×64 / 4×2 |
| Booth mark `partner-openinfra-mm` | `Expo / OpenInfra User Group Myanmar` | `assets/sponsors/partner-openinfra-mm.png` | 128×64 / 4×2 |
| Booth mark `varcamp-horizontal` | `Expo / VarCamp` | `assets/sponsors/varcamp-horizontal.png` | 128×64 / 4×2 |
| Sticker sheet | `booth-stickers` (ordinary art atlas) | `assets/tilesets/original/booth-stickers.png` | 192×32 / 6×1 |
| Booth captions | `standing-captions` (overworld role) | `assets/tilesets/original/expo-captions.png` | 512 wide, up to 6 rows |

`tools/maps/builder.ts` now accepts two native panel footprints, exactly per `images[]` entry: 6×2 tiles with a 192×64 PNG, or 4×2 tiles with a 128×64 PNG. A 4×2 entry over a 192×64 file, a 6×2 entry over a 128×64 file, and every other size are rejected at author, build and release time. `demo-01.png` on a booth is a reserved second copy of the arrival inlay's image under its expo name; the two tilesets share bytes, not GIDs.

Booth captions use the standing-caption machinery (`tools/art/standing-captions.ts`): the shared `standing-captions.png` is full at its approved six rows and registered in the two beach contexts, so the overworld renders its captions into its own family, `assets/tilesets/original/expo-captions.png` with `art/source/expo-captions.{json,svg}`, created by `npx tsx tools/art/standing-captions.ts` once a caption is linked (the beach bytes never move). A caption needs a face sprite: `expo-fascia` (the navy wall top, above avatars) with one blocking `expo-fascia-post` (the wall base) under each column, both in `art/tile-catalog.json`.

The historical booth producer composes entries through `tools/maps/expo-fixtures.ts`: `expoLogoImage(mark, x, y)` returns the `images[]` entry with the registered name and exact footprint; `expoSticker(id, sprite, x, y)` a 1×1 walkable decal from the six `sticker-*` sprites; `expoCaption(id, text, x, y, width, options?)` the fascia placement, its posts, the centred `signs[]` text (18px glyphs, padding 1; `DESIGN GUILD` needs 4 tiles, `GAME JAM` fits 3) and the `standingSigns` link, validated against the caption glyph set at construction; `withExpoCaption(layout, caption)` appends one assembly to a layout copy. When the first expo captions ship, register the three new `expo-captions` files in `art/sources.json` (`original`) and refresh the shared-roster test fixtures that list that registry. Nothing may be placed on a guide allowed cell (`src/bots/lyra-routes.json`), and `tests/helpers/physical-prop-contracts.ts` still pins the four arrival inlays as the complete `images[]` roster until the booth producer extends it.

Map authors use an optional `images` array in the layout, for example:

```json
{
  "name": "sponsor-demo-orbit",
  "image": "assets/sponsors/demo-01.png",
  "x": 20,
  "y": 32,
  "width": 6,
  "height": 2,
  "standing": false
}
```

Coordinates and dimensions are integer tiles. The exporter embeds a standalone tileset with `image: "../assets/sponsors/demo-01.png"`, 6 columns, 12 tiles and 32×32 cells. A visible normal tile layer places its twelve GIDs in row-major order at the specified `x,y` tile position. The complete PNG stays byte-identical and unscaled. Navigation-mask and sponsor GID ranges are disjoint. Keep the 6×2 footprint. Paths must refer directly to PNG files inside `assets/sponsors/`. Absolute paths, traversal, remote URLs, missing files, escaped symlinks, incorrect dimensions and incomplete/corrupt PNGs fail the author/release checks. Keep native logo files below 2 MiB; normal 192×64 PNGs are much smaller. Replacements are fully decoded for validation, including indexed-color PNGs; they are never rewritten. A native Tiled edit may place the tile layer inside groups. Keep the embedded sheet dimensions and its `sponsorPanel` property; normal builds validate the current PNG and rewrite the tileset path for previews. Image-only layers are rejected during build/release because the pinned engine loads tileset images and creates tile layers, without rendering Tiled image layers.

To deliberately re-export an edited SVG master, run this from the repository root, replacing the slot number as needed. This is an explicit art operation; neither map command runs it:

```sh
node --input-type=module -e 'import sharp from "sharp"; await sharp("art/source/sponsors/demo-01.svg", { density: 72 }).png().toFile("assets/sponsors/demo-01.png");'
```

The SVGs use authored paths for both lettering and marks, so native exports do not depend on installed fonts. The separate VarCamp Myanmar 2026 floor identity uses its organizer-approved generated PNG and retained source master, with the official VarCamp mark as its identity reference. It has its own provenance entry; the fictional sponsor CC0 dedication does not relicense the event brand. No purchased assets, web fonts or new dependencies are used.

### Vibe Code Tours — 2026-10-27

Lewis supplied `https://vibecode.tours/favicon.svg` for event placement. The exact downloaded vector is retained at `art/source/sponsors/vibecode-tours-original.svg`; `art/sponsors.json` records its source and the limited organizer request without asserting an open-content license. `tools/art/vibecode.ts` packages the unchanged 48px icon with pixel lettering into the native 128×64 panel `assets/sponsors/vibecode-tours.png`.

The formerly empty south-row booth 6 now carries the panel at `(84,85)` and reads **VIBE CODE TOURS** on its existing six-tile fascia at `(83,87)`. The new caption sheet retains all old glyph coordinates and changes only that label; the historical sheet remains intact. All 12 zodiac speaker rooms carry the panel at `(8,0)` (Sagittarius: `(10,0)`), and Solar/Lunar carry it at `(22,0)`. The north-wall placement clears the windows, VarCamp header and themed stage artwork.

`world/vibecode-branding.json` defines the exact 15-map addition. Furniture, terrain, collision masks, drone routes, doorway portals and saved WAM media areas remain unchanged. Asset checks, the native-map gates and `tests/vibecode-branding.test.ts` verify this scope.
