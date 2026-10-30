# VarCamp Myanmar 2026

**English** · **[မြန်မာဘာသာဖြင့် ဖတ်ရန်](README.my.md)**

A zodiac-themed virtual conference campus built for **WorkAdventure**. Meet at the welcome plaza, visit community booths, attend sessions in twelve zodiac speaker rooms and two main halls, then explore gardens, cafés, mazes and a tropical coast.

The world contains **34 connected maps**, authored on a **32 × 32 pixel tile grid**, with editable Tiled maps, source artwork, TypeScript interactions, optional exploration quests and a guarded publication workflow. This repository also serves as a handoff for future VarCamp organizers and contributors.

**[Enter the live demo](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam)** · [Visitor guide](#visitor-guide) · [Developer quick start](#developer-quick-start) · [Contributing and next-year handoff](#contributing-and-next-year-handoff) · [Latest map audit](docs/qa/map-stability-2026-10-29/README.md)

![FA SHIP, an explorable coastal destination in the VarCamp world](publication/fa-ship.jpg)

## Contents

- [What is in the world](#what-is-in-the-world)
- [Visitor guide](#visitor-guide)
- [World directory](#world-directory)
- [Current verification and limitations](#current-verification-and-limitations)
- [Developer quick start](#developer-quick-start)
- [Repository guide](#repository-guide)
- [Editing maps and artwork](#editing-maps-and-artwork)
- [Validation and testing](#validation-and-testing)
- [Publishing the demo](#publishing-the-demo)
- [Optional guides and NPC services](#optional-guides-and-npc-services)
- [Contributing and next-year handoff](#contributing-and-next-year-handoff)
- [Troubleshooting](#troubleshooting)
- [Further documentation](#further-documentation)
- [Credits and licenses](#credits-and-licenses)

## What is in the world

| Area | Experience |
| --- | --- |
| Arrival and expo | VarCamp Myanmar 2026 floor branding, partner artwork, an animated fountain and twelve booths with a shared central aisle. |
| Zodiac campus | Twelve distinct building exteriors arranged around the circular campus, with floor labels, gardens, flowers and an outer road. |
| Speaker rooms | Individually themed interiors with stages, seating, presenter/listener areas, VarCamp branding and partner panels. |
| Solar and Lunar halls | Two larger venues with separate sun and moon architecture and presentation spaces. |
| Festival and games | A festival park, social arcade and playground, plus Orbit Maze and the checkpoint-based Comet Maze. |
| Coast and ship | A tropical cove, Constellation Shore, the FA SHIP upper deck and its furnished interior. |
| Exploration | Four elemental districts, Star Garden, Moon Café, Moon Grotto, Stargazer Terrace and a hidden observatory. |
| Ambient motion | Fountain water, aerial patrol drones, a hovering Roadster and environmental animations. Vehicles are scenery; attendees cannot drive or ride them. |

The plaza's north row contains **Demo Orbit, Demo Nova, Demo Atlas, Demo Vector, Demo Lumen and the Info Desk**. Its south row contains **AWS UG Myanmar, BSides Myanmar, OpenInfra MM, Code Circle, Design Guild and Vibe Code Tours**. Booth spacing provides room for visitors; the booths do not use separate meeting zones to isolate conversations.

Demo company marks and some community-hub names are placeholders. Organizer-provided community and partner logos have separate source records in [the branding registry](art/sponsors.json).

## Visitor guide

### Join and move around

1. Open the [live demo](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam).
2. Enter a display name of **10 characters or fewer**, choose your WOKA avatar and continue through the device screen. You can explore with your camera and microphone off.
3. You arrive at the central welcome point. Move with the arrow keys or WASD, then walk through signed doors and gates to change maps.
4. Use the welcome directory or the **Quest Journal** menu for destinations and exploration progress. When standing near an interactive object, follow its displayed activation prompt.
5. For a session, enter the named zodiac room or Solar/Lunar hall and use the audience area. Follow the organizer's programme for timings and the host's instructions for media and presenting.

Physical doors and exits remain available if the optional quest interface fails to initialize. Arcade cabinets and playground props are social scenery; this repository does not provide an external arcade game service.

### Find the main destinations

From the overworld, the zodiac buildings and both halls have their own entrances. The outer gates lead **north to Orbit Maze**, **west to the festival park**, **east to the coast**, and **south to Campus Exploration**. Signs and the directory help you return to the plaza.

The festival park connects to the arcade and playground. The beach connects to Constellation Shore and FA SHIP; ship stairs lead below deck. Campus Exploration connects to the elemental districts and quieter retreats. Stargazer Terrace holds the route to the hidden observatory.

### Optional quests

Exploration is optional: quests do not gate access to conference sessions.

| Badge | How to earn it |
| --- | --- |
| Zodiac Explorer | Discover all twelve zodiac signs. |
| Maze Navigator | Complete Orbit Maze. |
| Stargazer | Collect the four elemental sigils, then discover the hidden observatory. |
| Comet Trailblazer | Save all three Comet Maze checkpoint stamps and complete the maze. |

The journal distinguishes confirmed, pending and undiscovered progress. Use its retry action if a save remains pending. Progress uses WorkAdventure player variables and a browser-storage fallback; guest progress should not be assumed to follow you to another browser or device. Keep one active quest tab while playing.

## World directory

Every map below has a native `.tmj` file and a matching `.wam` file under [`maps/`](maps/). Links open map source files on GitHub; use the demo link to play.

### Zodiac speaker rooms

| Number | Room | Native map |
| --- | --- | --- |
| 01 | Aries | [speaker-aries.tmj](maps/speaker-aries.tmj) |
| 02 | Taurus | [speaker-taurus.tmj](maps/speaker-taurus.tmj) |
| 03 | Gemini | [speaker-gemini.tmj](maps/speaker-gemini.tmj) |
| 04 | Cancer | [speaker-cancer.tmj](maps/speaker-cancer.tmj) |
| 05 | Leo | [speaker-leo.tmj](maps/speaker-leo.tmj) |
| 06 | Virgo | [speaker-virgo.tmj](maps/speaker-virgo.tmj) |
| 07 | Libra | [speaker-libra.tmj](maps/speaker-libra.tmj) |
| 08 | Scorpio | [speaker-scorpio.tmj](maps/speaker-scorpio.tmj) |
| 09 | Sagittarius | [speaker-sagittarius.tmj](maps/speaker-sagittarius.tmj) |
| 10 | Capricorn | [speaker-capricorn.tmj](maps/speaker-capricorn.tmj) |
| 11 | Aquarius | [speaker-aquarius.tmj](maps/speaker-aquarius.tmj) |
| 12 | Pisces | [speaker-pisces.tmj](maps/speaker-pisces.tmj) |

### Hubs, activities and retreats

| Region | Maps | Purpose |
| --- | --- | --- |
| Arrival | [Overworld](maps/overworld.tmj) | A 128 × 128 tile campus containing the expo, gardens and entrances to the surrounding venues. |
| Main halls | [Solar Hall](maps/solar-hall.tmj), [Lunar Hall](maps/lunar-hall.tmj) | Two 64 × 56 tile presentation venues. |
| Mazes | [Orbit Maze](maps/orbit-maze.tmj), [Comet Maze](maps/comet-maze.tmj) | Orbit's planted garden labyrinth and Comet's constellation gallery, with illuminated paths, landmark courts and rest areas. Comet has three collectible checkpoints. [Interior authoring guide](docs/operating/maze-interiors.md). |
| Festival | [Zodiac Festival Park](maps/zodiac-festival-park.tmj), [Nebula Arcade](maps/nebula-arcade.tmj), [Orbit Playground](maps/orbit-playground.tmj) | Informal gathering and social play spaces. |
| Coast | [Shipyard Beach](maps/shipyard-beach.tmj), [Constellation Shore](maps/constellation-shore.tmj), [FA SHIP](maps/fa-ship.tmj), [Ship Interior](maps/fa-ship-interior.tmj) | Tropical cove, waterfront walks and a two-level ship destination. |
| Exploration hub | [Campus Exploration](maps/campus-exploration.tmj) | Routes to the elemental districts and retreats. |
| Elements | [Fire](maps/fire-district.tmj), [Earth](maps/earth-district.tmj), [Air](maps/air-district.tmj), [Water](maps/water-district.tmj) | Four themed districts with elemental sigils. |
| Retreats | [Star Garden](maps/star-garden.tmj), [Moon Café](maps/moon-cafe.tmj), [Moon Grotto](maps/moon-grotto.tmj) | Places to explore and take a break between sessions. |
| Stargazing | [Stargazer Terrace](maps/stargazer-terrace.tmj), [Hidden Observatory](maps/hidden-observatory.tmj) | Telescope interactions and the four-sigil discovery route. |

The authoritative map IDs, dimensions and named entries are in [`src/world/catalog.ts`](src/world/catalog.ts).

## Current verification and limitations

The latest recorded map audit is **29 October 2026**. Its runtime fix was deployed from commit [`e095eef`](https://github.com/htooayelwinict/varcamp-map/commit/e095eef16f3e3967c7cc2d98e82ef5e3f163fec0). Documentation commits can be newer than the deployed map build.

| Check | Recorded result |
| --- | --- |
| Source and geometry | All 34 maps, 23,046 placements, 371 native objects and 166,340 painted tile instances inspected. Twelve booth-chair collision footprints were corrected. |
| Navigation | 81 spawn layers, 80 exits and 91 WAM areas checked. All 80 exits were traversed in the browser during the audit. |
| After deployment | All 34 maps loaded with zero page errors or missing assets. The plaza passed all 18 outgoing exits and 29 collision probes again. |
| Publication | Two complete readbacks verified all 745 expected live files; the standard acceptance smoke passed. |
| Automated suite | Latest complete-file results: **2,376 passed, 175 pre-existing failures and 89 skipped**. The separate Node operations suite passed **17/18**. The repository suite is not fully green. |
| Guide services | **Orion, Nova and Lyra remain stopped** pending re-qualification of their private release pins. |
| Dependencies | GitHub reported **153 alerts, including 7 critical**, during the audit's push. These were not triaged by the map-physics audit; their runtime impact remains unassessed. |

Read the [full audit and reproducible evidence](docs/qa/map-stability-2026-10-29/README.md), [individual test results](docs/qa/map-stability-2026-10-29/test-results-final.json) and [repository dependency alerts](https://github.com/htooayelwinict/varcamp-map/security/dependabot) for details. The figures above are dated evidence, not a continuously updated health dashboard.

This verifies map integrity and bounded live behavior. **It does not certify 1,000 concurrent attendees.** Core hosting capacity, media, screen sharing, staff permissions and cross-device persistence need their own event rehearsal. WorkAdventure-sponsored event hosting is separate from the devbox demo linked here.

## Developer quick start

### Requirements

- Git and **Node.js 26.11.1**, pinned in [`.nvmrc`](.nvmrc), with npm.
- **Tiled 1.12.2** when editing native maps or using the canonical renderer.
- Python 3 for the publication tools and independent geometry audit.
- A WorkAdventure client/server to play the maps. Vite serves map assets and development tooling; it does not provide the multiplayer core.

Use the checked-in npm lockfile. The [generated release facts](docs/current-release-facts.md) list the exact tool and WorkAdventure source pins. Building the committed maps does not require upload credentials or an OpenRouter key.

```sh
git clone https://github.com/htooayelwinict/varcamp-map.git
cd varcamp-map

# If you use fnm, select the repository's Node version.
fnm install 26.11.1
fnm use 26.11.1

npm ci
npm run maps:validate
npm run art:check
npm run maps:build
npm run buildmap
```

The output is `dist/`: the 34 TMJ/WAM pairs, runtime and journal assets, the guide module, referenced artwork and public credits. Private configuration and development previews are excluded.

### Local development and preview

```sh
# Development server; use the URL printed by Vite.
npm run dev

# Alternatively, serve a completed dist/ build locally.
npm run preview -- --host 127.0.0.1
```

On the shared devbox, keep development servers on loopback and reach them through SSH port forwarding or Orca's Ports panel. Run long jobs in `tmux`. Use native ARM64 tools and bundled Playwright Chromium on that machine.

For a WorkAdventure custom-map setup, the published entry asset is:

```text
https://maps.3-1-133-135.sslip.io/varcamp-demo/maps/overworld.tmj
```

That address returns map JSON. The [live demo URL](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam) opens the playable world. A self-hosted asset server must preserve the built relative paths and be reachable by the chosen WorkAdventure deployment with compatible HTTPS/CORS settings.

## Repository guide

| Path | Responsibility |
| --- | --- |
| [`maps/`](maps/) | Authored native Tiled `.tmj` maps and paired WorkAdventure `.wam` files. |
| [`maps/preview/`](maps/preview/) | Generated authoring previews; excluded from the clean release. |
| [`world/`](world/) | Semantic layouts and feature definitions for buildings, booths, zones and geometry. |
| [`src/world/catalog.ts`](src/world/catalog.ts) | Map identities, dimensions and entry contracts. |
| [`src/`](src/) | WorkAdventure runtime, navigation, quest state and interface code. |
| [`art/`](art/) | Sprite catalog, source artwork, branding records and attribution. |
| [`assets/`](assets/) | Tilesets, image atlases and other runtime art dependencies. |
| [`tools/`](tools/) | Map authoring, validation, art processing and rendering tools. |
| [`tests/`](tests/) | Runtime, map, art, preservation and publication regression tests. |
| [`ops/`](ops/) | Guarded publisher, demo deployment, live smoke tests and optional services. |
| [`publication/`](publication/) | Frozen source inventory, reviewed changes and SHA-256 verification. |
| [`docs/operating/`](docs/operating/) | Detailed editing, hosting, branding and guide-service procedures. |
| [`docs/qa/`](docs/qa/) | Dated inspections, screenshots and verification evidence. |

`dist/` is generated by `buildmap`; `.qa/` holds local working evidence and release plans. The root `varcamp.tmj`, `tileset.png` and `build_map.py` are retained historical draft files. **The current world starts at `maps/overworld.tmj`.**

## Editing maps and artwork

### Choose the right editing path

Open `maps/<map-id>.tmj` in Tiled for native edits. The semantic layout sources live in `world/layouts/`; keep those sources and the native map's applicable contracts consistent when making a lasting change.

| Command | Effect |
| --- | --- |
| `npm run maps:validate` | Checks the authored native maps. |
| `npm run maps:build` | Validates the current world and refreshes `maps/preview/`; preserves native TMJ/WAM files. |
| `npm run maps:author` | Recompiles layouts into native maps, subject to the whole-batch native-edit guard. |
| `npm run buildmap` | Type-checks and packages the committed world into `dist/`. |

On a fresh clone, `.qa/authored-map-hashes.json` is absent. `maps:author` therefore refuses to overwrite existing native maps. Use `npm run maps:author -- --initialize` only for an **intentional, backed-up reauthoring** after reconciling any direct Tiled edits. It is not a setup or preview step.

### Preserve geometry and player movement

- Keep the orthogonal 32 px grid, embedded tilesets, GIDs and boolean collision properties consistent.
- Match each collision footprint to the visible object, including flipped sprites and transparent edge cells. A decorative upper tile must not accidentally block the road below it.
- Preserve layer ordering, `floorLayer`, default/named entries and exit destinations. Keep doorway approaches and return spawns walkable.
- Preserve WAM area IDs, organizer properties and live editor metadata. Move zones deliberately when moving their room or furniture.
- Check the changed area in a real WorkAdventure client: approach from every relevant side, test the door in both directions and inspect avatar occlusion.

See [the map-editing guide](docs/operating/map-editing.md) for native rendering and live-WAM preservation, and [the latest geometry audit](docs/qa/map-stability-2026-10-29/README.md) for collision checks that can be rerun locally.

### Branding and art changes

Use [`art/sponsors.json`](art/sponsors.json), [`art/sources.json`](art/sources.json) and [`art/tile-catalog.json`](art/tile-catalog.json) to track source files, permission/attribution, dimensions and sprite footprints. Replace logos through the existing native tile-layer representation and keep their size aligned with the booth or wall panel. The pinned WorkAdventure engine does not support substituting these with Tiled image layers.

Keep editable masters and license notices with the project. Follow [sponsor replacement](docs/operating/sponsors.md) and the relevant art generator for exports. Flight-atlas regeneration is known to differ between Linux and the canonical macOS renderer; preserve committed pixels for unrelated edits and qualify any regenerated atlas before publishing.

### Record and review a change

Run the relevant validators and tests, inspect the visual result, and update the appropriate publication receipts. The original 303 source-inventory entries are immutable; reviewed replacements use the revision chain, while additional protected files use `extensionInventory`. Documentation files such as this README are also pinned there. Run the source verifier after updating the reviewed hashes.

This project uses owner-reviewed local commits and a fast-forward push to `main`. The maintained workflow has **no required PR or hosted CI step**. A GitHub push publishes source history; deploying map assets is a separate action.

## Validation and testing

Use these checks according to the change:

| Check | Command |
| --- | --- |
| Native maps | `npm run maps:validate` |
| Art catalog and assets | `npm run art:check` |
| Preview/source consistency | `npm run maps:build` |
| TypeScript and release package | `npm run buildmap` |
| Source hashes and publication receipts | `node publication/verify-source.mjs .` |
| Current facts and documentation links | `node ops/current-release-facts.mjs --check` |
| Vitest suite | `npm test -- --maxWorkers=1 --testTimeout=30000` |
| Node operations suite | `npm run test:node` |

Build `dist/` before running package-dependent tests. The [latest audit](docs/qa/map-stability-2026-10-29/README.md) documents the existing failures; do not describe a partial pass as a green full suite. Historical fixtures include a macOS Tiled executable path, Apple Python 3.9.6 behavior and Docker CLI/Compose expectations. Those fixture prerequisites are separate from building the committed world on Linux.

The independent geometry and sprite-footprint checks can also be reproduced:

```sh
python3 docs/qa/map-stability-2026-10-29/audit.py
node docs/qa/map-stability-2026-10-29/alpha-audit.mjs
```

They write local reports under `.qa/map-stability-audit/`.

### Live browser smoke

Install the separate acceptance dependencies once:

```sh
cd ops/acceptance
npm ci
npx playwright install chromium
cd ../..

npm run acceptance:smoke
```

This connects to the **live demo**. It checks name/avatar entry, camera and microphone settings, the journal, the guide-panel interface and a second map load. It produces screenshots and a JSON summary. Review the reported console errors as well as the pass/fail result; opening the guide panel does not prove that stopped guide bots can respond. See [acceptance options](ops/acceptance/README.md) for a different URL, visitor name or output directory.

## Publishing the demo

The maintained demo is built and uploaded from the devbox. GitHub stores the source; the demo's WorkAdventure map storage serves the release. Upload credentials stay in `/srv/varcamp/private/environment` and must never enter Git, client scripts, screenshots or logs.

**Existing WAMs contain live organizer state.** The storage upload replaces a complete target directory, so use the guarded planner to retain the live files and migrate only reviewed WAM values. A raw ZIP upload or copying `dist/` over the target can discard that state.

### Prepare and inspect

After the relevant local checks, run the wrapper with a new, unused plan directory:

```sh
npm run deploy:demo -- --plan .qa/release-YYYYMMDD-HHMM
```

Without `--apply`, this builds and verifies the source, reads the live target, prepares WAM `?v=` token migrations and creates a release plan. **It does not upload.** Inspect the artifacts:

| Artifact | What to review |
| --- | --- |
| `plan.json` | Target, baseline, retained files, reviewed WAM changes and expected final inventory. |
| `baseline.zip` | Downloaded live state retained for comparison and recovery planning. |
| `release.zip` | Clean built release. |
| `package.zip` | Actual upload package, including retained live assets. |
| `reviewed-wams.zip` | WAM replacements derived from the live baseline with reviewed token changes. |

### Apply and verify

Coordinate a quiet editor window, let autosave settle and apply the exact reviewed plan:

```sh
python3 ops/release_upload.py apply \
  --plan .qa/release-YYYYMMDD-HHMM \
  --environment /srv/varcamp/private/environment \
  --quiet-editor-window

npm run acceptance:smoke
```

For an already authorized release with the same quiet-editor requirement, the combined command is:

```sh
npm run deploy:demo -- --apply
```

The publisher compares the live inventory twice, 16 seconds apart, before uploading, then performs two complete delayed readbacks. A changed baseline requires a new plan. Retain the plan, smoke output and visual evidence with the release. The wrapper can report a smoke failure after an upload has succeeded, so inspect its final smoke result before announcing the release.

There is no atomic editor lock or automatic rollback. If an upload or verification fails, preserve the evidence and compare the current live state with the saved baseline before planning recovery. Adding `--with-tests` runs both automated suites first and aborts on failure; the current known failures are documented above.

Publication does not restart WorkAdventure core or the guide services. See [the detailed publication procedure](docs/operating/publication.md) and [devbox deployment notes](docs/operating/devbox-deployment.md) for the underlying tools and service configuration. Older dated receipts retain their historical counts and deployment assumptions; use the current commands and status in this README as the entry point.

## Optional guides and NPC services

**Orion, Nova and Lyra are currently stopped.** Their authored guide behavior and service sources remain available, but they must pass private release-pin qualification before being enabled again.

Scripted guides use deterministic authored replies and need no AI-provider key. The release includes `bots/lyra.js`. Activation requires matching the published module bytes and map/collision receipts to the reviewed package, then checking actual shared behavior with two independent visitors.

When guides are active, open the avatar menu → **All settings** → **Talk to Nearby Guides**, select a nearby guide and use a zodiac name or a panel command. The guide panel is the supported interaction path. Publishing new maps or modules does not, by itself, re-qualify the guide service.

The [legacy NPC chat server](ops/npc/README.md) is a separate optional integration with server-side OpenRouter configuration. Any provider key belongs only in private server configuration. See [Scripted Lyra](docs/operating/scripted-lyra.md), [guide operations](ops/bots/README.md) and [persistent guide services](ops/bots/persistent-service/README.md) for their separate contracts.

## Contributing and next-year handoff

VarCamp should be maintainable by the next organizing team. You can help with Burmese and English documentation, attendee directions, map design, artwork, accessibility, testing or runtime code. Start with one small change that the current maintainer can review.

### Your first contribution

1. Explore the demo and read the latest dated audit to understand what exists and what is still unresolved.
2. Clone the repository, select the pinned Node version and complete the local validation/build steps.
3. Agree on a small task with the current organizing team. Record the affected maps or files and the intended result before editing.
4. Keep the editable source, exported asset, collision footprint and attribution together where applicable. Update **both language guides** when behavior or setup changes.
5. Run the checks relevant to the change. For map edits, include a screenshot and a short movement/doorway check; for code changes, include the relevant test results.
6. Give the maintainer the change, evidence and remaining limitations. Under the current workflow, the maintainer reviews it locally, commits it and pushes to `main`; deployment is handled separately.

### Prepare another event year

| Step | What the next team should do |
| --- | --- |
| Preserve the previous edition | Record its Git commit, live URL, map-storage target, release plan and dated QA report before beginning the next edition. Retain recovery archives privately. |
| Update event identity | Review the year, name, floor logo, wall panels, welcome text and published links. Trace branding through `art/sponsors.json`, source masters and their generators; do not globally replace every `2026` string. |
| Reconfirm partner rights | Recheck logo permissions for the new edition. Organizer-provided 2026 marks do not automatically grant permission for future reuse. Replace expired or withdrawn branding and retain attribution. |
| Plan the programme | Assign talks to the zodiac rooms and halls, confirm presenter/listener areas and publish the new schedule through the organizer's chosen channel. |
| Decide quest continuity | Progress keys currently use `varcamp2026.*`. Decide whether a new edition keeps or resets progress, then implement and test the migration deliberately. Changing visible year text does not reset saved progress. |
| Set up a rehearsal destination | Coordinate a separate target with the hosting owner. Confirm its ownership, map URLs and credentials before publishing; do not overwrite the previous event as a setup shortcut. |
| Rehearse the event | Recheck maps, doors, collisions, assets, branding, browser behavior and accessibility. Coordinate capacity, media and staff-role checks with the WorkAdventure hosting team. Qualify guide bots separately if they will be used. |
| Leave a fresh handoff | Update this README and `README.my.md`, publish a dated QA record, list unresolved issues and identify who owns the next release and hosting account. |

### What to pass to the next maintainers

Leave a dated handoff document containing:

- The event year, responsible organizing team, current source commit and **separate deployed commit**.
- Demo/rehearsal/event URLs, the map-storage target, tool versions and the exact build/release procedure.
- The latest map and browser checks, known failing tests, dependency-alert triage and any remaining event-readiness work.
- The guide-service state and pin qualification status, plus the location of private recovery archives.
- Editable artwork, asset sources, partner permissions and license/attribution records.
- Repository and hosting access owners, with access transferred through the team's private process. Public handoffs should identify owners and locations without including passwords, API keys or private visitor data.

Future teams can revise the collaboration workflow together. Record that decision in both language guides so newcomers do not have to infer it from old chat history.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| The map URL displays JSON | Use the playable demo URL, or load the `.tmj` asset through a WorkAdventure client. |
| “Name is too long” remains after editing | Use at most 10 characters and reload the page if validation does not clear. |
| `maps:author` refuses to run on a clone | Its native-edit guard is absent. Use validation/build commands for normal setup; initialize authoring only after backing up and reconciling native edits. |
| A player walks through furniture or hits empty floor | Compare the visible sprite with its collision cells, including flips and transparent tiles; rebuild and verify movement in the live client. |
| A deployed map still looks old | Check the WAM's TMJ hash token, fetched asset bytes and a fresh room load. Use the reviewed token-migration workflow for releases. |
| A guide panel opens but nobody responds | Check whether the guide services are running and their release pins are qualified. The current recorded state is stopped. |
| Tests fail on Linux | Compare against the dated baseline and inspect fixture/tool requirements; do not assume every failure is a platform issue. |
| Source verification fails after an edit | Review the exact changed files and update the applicable receipts. Keep the original snapshot inventory intact. |
| The upload plan is stale | Preserve it, reconcile organizer edits and prepare a fresh plan from the current live target. |

For an issue report, include the map name, approximate tile or landmark, expected and observed behavior, a screenshot where useful, and the source commit or deployed asset version. Keep credentials and private visitor data out of reports.

## Further documentation

- [Current release facts](docs/current-release-facts.md) — generated source counts and pinned tool versions.
- [Map editing](docs/operating/map-editing.md) — native authoring, rendering, collision and WAM preservation.
- [Venue guide](docs/operating/venue-guide.md) — detailed navigation and interaction design; consult this README for current booth and service status.
- [Sponsor replacement](docs/operating/sponsors.md) — branding assets and source records.
- [Publication](docs/operating/publication.md) — planner artifacts, readbacks and recovery considerations.
- [Map stability audit](docs/qa/map-stability-2026-10-29/README.md) — source, browser, collision and release evidence.
- [Dependencies](docs/dependencies.md) — toolchain and asset provenance, including historical fixture requirements.
- [Custom WOKA tooling](tools/wokas/README.md) — avatar asset workflow.
- [Roadster animation](docs/operating/roadster.md) — native animation and crop receipts.

## Credits and licenses

Starter-derived code retains its [MIT license](LICENSE). Artwork, fonts, logos and compatibility fixtures have their own terms; the code license does not grant blanket rights to every image in the world.

Consult [the art source registry](art/sources.json), [branding records](art/sponsors.json), each asset folder's LICENSE/ATTRIBUTION/CREDITS files and the [published credits](https://maps.3-1-133-135.sslip.io/varcamp-demo/credits/index.html). The ship, dock, water and container assets retain their LPC author credits. Paid tileset preview images are not redistributed as production artwork. Preserve attribution and permission records when adapting or replacing assets.
