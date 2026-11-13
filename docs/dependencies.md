# VarCamp world dependencies

The foundation and audit sections below preserve the observations from Task 1. They are historical checkpoints, not a new audit or assertions about the completed release. See [current tools and release](#current-tools-and-release) for the later dependency changes and supported commands.

## Foundation record (historical)

Foundation imported from the official [WorkAdventure map starter kit](https://github.com/workadventure/map-starter-kit/tree/1143646a9c02c3928eac4acbb123642c62a48a85), commit `1143646a9c02c3928eac4acbb123642c62a48a85`, package version **3.3.18**. Its sample maps, tilesets and Git history are excluded. The original lockfile is retained at `docs/dependencies/starter-package-lock.json` before project dependency additions; the then-current root lockfile locked the foundation dependency graph. At that checkpoint, no existing starter package version changed. Starter code licence is retained in `docs/dependencies/LICENSE.starter`.

Node **v26.8.2** was used on macOS arm64. It satisfies Vite's `^20.19.0 || >=22.12.0` requirement. Key locked starter versions: Vite **7.3.1**, TypeScript **5.9.3**, `wa-map-optimizer-vite` **1.3.1**, `@workadventure/map-starter-kit-core` **1.1.5**, `@workadventure/iframe-api-typings` **1.32.10**, `@workadventure/scripting-api-extra` **1.9.12**, and `@workadventure/upload-maps` **1.8.1**.

Project additions are exact pins: `vitest` **4.1.11** (test runner), `tsx` **4.23.15** (TypeScript command runner), and `zod` **3.25.76** (TMJ schema validation). Vitest 3.2.4 was used for initial RED evidence and replaced before delivery because audit identified newly introduced vulnerable test dependencies. At that foundation audit checkpoint, these additions had no affected audit nodes. tsx 4.20.6 was initially used and replaced after a Node 26 trace identified its deprecated `module.register()` call; 4.23.15 uses `registerHooks()` and runs without that warning.

Official [Tiled 1.12.2](https://github.com/mapeditor/tiled/releases/tag/v1.12.2) was downloaded from the release's `Tiled-1.12.2_macOS-13+.zip` asset and extracted locally to `.tools/tiled-1.12.2/Tiled.app`. No other installation was replaced. Run `.tools/tiled-1.12.2/Tiled.app/Contents/MacOS/Tiled --version`; observed output: `Tiled 1.12.2`. `.tools` is ignored and stays outside map discovery. A fresh checkout must download this platform's official bundle again.

Download SHA-256 values:

- Starter archive: `89352a682b0bf0c28770bf9c61a78a0cb3805da0b94d77e010de4ae825618c58`.
- Official macOS Tiled ZIP: `75712ec3a892701a9b2b7a12e44d636a1dbbe4caa6bb8bba729e697bd8a80433`.
- Unmodified starter lockfile: `b38daba4744b967a10d0b045ab6f3fc2970cca9760550d42e4dd92214247f2ee`.

These are observed download hashes, not signatures or independently published upstream checksums.

## Formats and contracts (foundation record; historical)

TMJ types and structural checks follow [Tiled's JSON map format](https://doc.mapeditor.org/en/stable/reference/json-map-format/). WorkAdventure requirements follow [map rules](https://docs.workadventu.re/map-building/tiled-editor/wa-maps/) and [named entries/exits](https://docs.workadventu.re/map-building/tiled-editor/entry-exit/). The optimizer also uses its locked upstream `@workadventure/tiled-map-type-guard`; our schema is intentionally restricted to this world's finite, array-encoded JSON TMJ subset. Embedded tilesets, finite orthogonal 32px maps, integer tile dimensions, boolean `collides`, start layers and arrival safety are validated. World maps must have a string map property `worldMapId` with their catalog ID.

WAM interfaces follow the inspected WorkAdventure source snapshot `96d43a84`, `libs/map-editor/src/types.ts` (`WAMFileFormat`, `WAMEntityData`, `AreaData`, `WAMSettings`) under the task's read-only source reference. [Upstream schema source](https://github.com/workadventure/workadventure/blob/96d43a84/libs/map-editor/src/types.ts). WAM top-level fields include `version`, `mapUrl`, `entities`, `areas`, `entityCollections`, optional settings/metadata/vendor. Entity records use `prefabRef: {collectionName,id}`. Property variant validation and whole-package checks belong to world construction; these foundation types preserve extensible upstream property data without claiming complete WAM validation.

`MapLayout` uses tile coordinates; TMJ object and WAM area coordinates use pixels. Layout producers must emit integer `TileRect` values. At the foundation checkpoint, the catalog fixed nine approved dimensions and named arrivals. Current catalog facts are generated in the current-release record. `roomDestination` accepts HTTP(S) `/~/` WAM room URLs; `previewDestination` accepts HTTP(S) TMJ asset URLs. Both validate entries and preserve the current sibling directory, host and world context. Production does not hardcode the public testing host.

## Foundation build, validation and preview (historical)

Run `npm ci`, `npm test`, and `npm run buildmap`. The starter optimizer and `base: "./"` are retained. Discovery is scoped to `maps/`, so ignored download/reference files cannot enter a build. With no maps, the build bundles the real exported catalog/navigation foundation; once maps exist it uses the starter's script discovery and optimizer. A controlled temporary TMJ fixture successfully optimized one map and one 32px tile; Tiled also round-tripped the optimized fixture. Temporary fixture source/assets do not ship with the project.

`npm run maps:validate` validates catalog/current TMJ files. An empty maps directory explicitly reports foundation-only status. It does not assert that all nine maps, WAM files, art, quest landmarks, native areas or connectivity exist. `maps:build`, `art:check` and `qa:render` dispatch their future tool files and fail clearly with exit 1 until implemented; these are not successful placeholder checks.

Run `npm run dev` for the starter UI (default Vite port 5173), or `npm run dev -- --port 5177` for the verified local shell. The starter's `/maps/list` supplies map cards. Its **Test Map** link opens `https://play.workadventu.re/_/<random-instance>/<asset-host>:<port>/maps/<id>.tmj`; at default port, an example is `https://play.workadventu.re/_/preview/localhost:5173/maps/overworld.tmj`. This URL needs a constructed map. The actual card generates a random instance name, and each map card can therefore select a different preview instance. Cross-map preview routing should use a consistent instance for a walkthrough.

The starter supplies map assets and a publishing UI, not a local WorkAdventure game backend. WorkAdventure movement/media walks depend on the public `play.workadventu.re` frontend/backend being available and permitting the local asset URL, or a separately running self-hosted frontend/backend. Public preview can require its map host to be reachable from that service and the attendee browser. Local browser policy, HTTPS/mixed-content restrictions and private-network access may prevent the HTTP loopback asset URL; that case needs an HTTPS development asset endpoint reachable by the preview service, not a changed TMJ. Shared or remote rehearsal requires reachable HTTPS map/script/image hosting with suitable CORS; localhost only addresses the visiting machine.

`npm run preview` serves built assets; it does not start a WorkAdventure backend. Final world persistence must be verified on the deployed `/~/` WAM world. Public `/_/` preview cannot establish world-scoped cross-map persistence. No WorkAdventure room load or attendee result is claimed for this foundation-only delivery.

## Foundation dependency audit (historical)

The retained foundation final `npm audit --json` reported **87 affected packages**: 4 critical, 57 high, 24 moderate and 2 low. Every affected node exists in the starter lockfile; no pre-existing version changed and no newly added dependency has an affected node. Exact affected versions, node paths and advisory details are retained in ignored `.tools/evidence/npm-audit-final.json` and summarized in tracked `docs/dependencies/audit-details.md`.

This is a static map package. Node dependencies run during build, local preview or upload and are not a deployed application server. The foundation browser bundle only contains project catalog/navigation code. A package marked production in npm's graph is not necessarily attendee browser code: the starter declares the optimizer and preview core as production dependencies. Future map scripts may bundle the starter scripting library; review that actual bundle and the separate WorkAdventure service audit before deployment. This task does not establish production exploitability or remediate the inherited graph. Do not publish the Vite/Express preview server as the attendee service.

Installation emitted notices for scripts not yet covered by the user's npm `allowScripts` policy: esbuild 0.27.2/0.28.2, fsevents 2.3.3, pngquant-bin 6.0.1 and sharp 0.30.7. The actual Vite build and one-map optimizer smoke test succeeded despite those notices. Optional PNG compression and all future image workflows were not exercised by that smoke test.

Separate retained finding from Task 1 review round 1: the starter compression overrides use `parseInt`, so `parseInt("0.91")` and `parseInt("0.98")` produce `0` and `0`. The shared optimizer-options extraction deliberately preserves that existing behavior; correcting decimal-quality parsing is outside this review fix. This is recorded dependency/configuration debt. PNG compression remains untested and unclaimed.

## Current tools and release

The [generated current release facts](current-release-facts.md) own the pinned Node/Tiled versions, locked root tool versions, native map-pair count, reviewed extension count and WorkAdventure source pin. The checker rejects disagreement between catalog/native maps/publication counts, toolchain pins and hosting provenance. Run `node ops/current-release-facts.mjs --check`; the normal test suite also checks it. Foundation tool versions and audit counts above remain dated history, not fresh vulnerability or deployed-version evidence.

[Current package commands](../package.json) implement `npm run maps:build`, `npm run maps:validate` and `npm run art:check`. The art checker uses sharp for source-sheet metadata, native SVG/PNG parity and transparency; the committed [renderMap API](../tools/maps/render.ts) invokes the pinned native Tiled rasterizer. There is no supported `qa:render` CLI. Use the [single-map Tiled rendering procedure](operating/map-editing.md#tiled-rendering).

Run `npm test` and `npx tsc --noEmit` for tests/types. `npm run buildmap` now uses the [worldRelease plugin](../tools/release.ts) via [release Vite configuration](../buildmap.vite.config.ts): the catalog map pairs listed in the [generated facts](current-release-facts.md), byte-identical separate source atlases, runtime/journal and public credits. The release does not run the preview optimizer or recompress/repack atlases. The optional starter optimizer remains available in the development path. `npm run dev` serves the local authoring shell; it is not an attendee backend.

After building and validating, `python3 ops/release_upload.py prepare --target varcamp-demo --plan .qa/release-YYYYMMDD --environment /srv/varcamp/private/environment` prepares a full live-preserving plan. The [editing/preservation handover](operating/map-editing.md) defines the reviewed plan, quiet-editor-window apply command and complete readbacks, and [publication](operating/publication.md) gives the complete devbox release procedure; preparation is distinct from publication. The [venue guide](operating/venue-guide.md) records navigation and operating guidance. A missing inspection report is not evidence that these gates passed. These later records supersede the foundation-only build/placeholder descriptions without rewriting the original audit or claiming event readiness.
