# Publishing VarCamp maps to the live demo

Releases are built on the project's arm64 AWS devbox and uploaded directly to the live WorkAdventure demo with the repository's guarded upload tool. Git is version control only: commits are made locally on the devbox, and the public source repository [htooayelwinict/varcamp-map](https://github.com/htooayelwinict/varcamp-map) is a source mirror, read-only from the devbox. No pull request, hosted CI run or static-site deployment is part of the release path.

The repository contains the native TMJ/WAM map pairs listed in [current facts](../current-release-facts.md), their editable layouts, original artwork sources, licensed tilesets, scripts, tests and credits. Asset licenses remain separate from the starter code's MIT license; this is a WorkAdventure map project, rather than a standalone asset pack. Private configuration, credentials, local tool installations and operational archives are excluded from the repository.

## What is published where

The [devbox guest demo](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam) is served by the WorkAdventure services described in [devbox deployment](devbox-deployment.md). Its map storage is the target directory `varcamp-demo` under `https://maps.3-1-133-135.sslip.io/varcamp-demo/`, which serves:

- `maps/*.tmj` and `maps/*.wam`: the native map pairs listed in [current facts](../current-release-facts.md). The WAMs carry live organiser metadata and are never overwritten blindly.
- `assets/`: byte-identical source atlases and sponsor artwork.
- `src/journal`, `src/adventure` and `src/check-in`: the Quest Journal, expedition and registration interfaces.
- `credits/`: the generated credits pages and license records.

The WorkAdventure **custom map URL** is `https://maps.3-1-133-135.sslip.io/varcamp-demo/maps/overworld.tmj`. It is a map asset opened by a WorkAdventure client; the same devbox runs the multiplayer service.

Credentials for the map-storage upload API stay in `/srv/varcamp/private/environment` (`UPLOAD_USER`, `UPLOAD_PASSWORD`, `MAPS_HOST`). They are read into process memory by the upload tool. Never copy them into the repository, command arguments, logs, screenshots or plan artifacts.

## Procedure

Run every step from the repository root on the devbox, inside `tmux`, with the `.nvmrc` Node (`fnm use`). `npm run deploy:demo` (`ops/deploy-demo.sh`) chains the same steps; the manual form below is the reference. Replace `YYYYMMDD` with today's date.

1. Validate the authored maps and build a fresh `dist/`:

   ```sh
   npm run maps:validate
   npm run buildmap
   ```

2. Check the source-integrity receipts locally. This replaces the former hosted Linux job and must pass before anything is uploaded:

   ```sh
   node publication/verify-source.mjs .
   ```

3. Migrate the live WAM version tokens. Every rebuild changes the Vite bundle name embedded in each TMJ, so every TMJ SHA-256 changes and every WAM `mapUrl` `?v=` pin moves together. The helper downloads every live WAM and rewrites only the `?v=` token to the SHA-256 of the freshly built TMJ; every other byte is preserved, and the upload guard verifies that:

   ```sh
   python3 ops/migrate_wam_tokens.py --target varcamp-demo --environment /srv/varcamp/private/environment --out .qa/reviewed-wams-YYYYMMDD.zip
   ```

4. Prepare the guarded plan, then inspect `plan.json`, `baseline.zip`, `release.zip` and `package.zip` before continuing:

   ```sh
   python3 ops/release_upload.py prepare --target varcamp-demo --plan .qa/release-YYYYMMDD --environment /srv/varcamp/private/environment --reviewed-wams .qa/reviewed-wams-YYYYMMDD.zip
   ```

5. Apply during a quiet editor window:

   ```sh
   python3 ops/release_upload.py apply --plan .qa/release-YYYYMMDD --environment /srv/varcamp/private/environment --quiet-editor-window
   ```

   The command compares the whole live inventory twice, 16 seconds apart, aborts on any change, uploads once, and verifies two full delayed readbacks of the target.

6. Verify the live result: run the smoke test against the live demo and check the world visually in a browser, including a fresh room load and an ordinary reload:

   ```sh
   npm run acceptance:smoke
   ```

A successful build or a passing plan is not publication. Only the completed `apply`, its two readbacks and the live checks establish that the demo serves the new release.

## Artifacts

- `.qa/reviewed-wams-YYYYMMDD.zip`: the reviewed WAM migration from step 3. It contains only the exact release WAM paths, derived from the fresh live bytes, with the `?v=` token as the sole change. The planner rejects any other difference.
- `plan.json`: the plan manifest (`planVersion` 2) with the baseline, package and expected inventories, the reviewed-WAM identities, the WAM dependency records and the list of preserved WAMs. `apply` refuses a plan whose artifacts no longer match it.
- `baseline.zip`: the retained pre-upload tree, every file downloaded from the live target at `prepare` time. This is the recovery evidence.
- `release.zip`: exactly the clean catalog release from `dist/` (the TMJ/WAM pairs listed in [current facts](../current-release-facts.md), runtime, module, atlases and credits).
- `package.zip`: what is actually uploaded. The map-storage ZIP POST replaces the entire target directory, so the package holds the full retained live tree with the release overlaid, the reviewed WAM replacements, and deliberately omits every exact paired live WAM so map storage preserves it. See [existing live worlds](map-editing.md#existing-live-worlds) for why selected file reads cannot establish the resulting inventory.

Keep the plan directory after a successful release; it is the only record of what the live tree looked like before the upload.

## Speaker presentation successors

The original one-room owner preview uses `aries-presentation-v1` for
`maps/speaker-aries.wam`. The upload guard compares the existing meeting area
against the frozen fourteen-room contract, replaces only its owned stage fields,
and appends the named listener area from `world/aries-presentation.json`.
Independent settings, entities, areas, vendor fields and unknown stage fields
must remain type-for-type identical. Customized owned controls, colliding area
IDs or names, missing revision files and changes to any other WAM fail closed.
The dependency receipt names this migration. Ordinary WAM updates retain the
byte-preserving token-only rule. A reviewed candidate must be derived from the
same fresh live inventory as the prepared plan; quiet-window and complete
readback checks still apply.

The approved eleven-room rollout uses `speaker-presentation-v1` for the exact
remaining zodiac speaker WAM paths, with room-specific areas in
`world/speaker-presentation.json`. It reuses the same guarded merge and verifies
global area IDs/names, property IDs and meeting/broadcast owners are unique in
the effective candidate. Aries retains its original successor. No other WAM
path can use these exceptions. All artwork bytes remain unchanged.

## Quiet editor window

Coordinate the window at the concrete prepared-plan checkpoint. Stop changes in the target map editor, allow autosave to settle beyond the 15-second save interval, and confirm the planned baseline still matches before `apply`. The tool compares the live inventory twice, 16 seconds apart, and aborts on any change; it never silently restores stale WAMs. A changed baseline means an organiser saved something: reconcile with the organiser and prepare a new plan. There is no upload/editor lock, revision check or atomic rollback.

## Rolling back

`baseline.zip` in the plan directory is the retained pre-upload tree. To roll back, re-upload it as a package through the same guarded tool, not with an ad-hoc POST: the ZIP replaces the whole target directory, so the upload must be the complete tree, and the planner must be re-run first so that a fresh baseline of the current live state is captured and the quiet-editor checks apply to the rollback as they do to a release. Failure part-way through `apply` may leave a partial tree: preserve current evidence and compare recovery with the current editor state before an explicitly reviewed recovery upload.

## Local verification

Before any publication, run the local suite with the pinned toolchain:

```sh
npm run maps:validate
npm run art:check
npm run maps:build
npm run buildmap
npm test -- --maxWorkers=1 --testTimeout=30000
```

Pins: Node **26.11.1** from `.nvmrc`; official **Tiled 1.12.2** as invoked by [the renderMap API](../../tools/maps/render.ts) at `.tools/tiled-1.12.2/Tiled.app/Contents/MacOS/tmxrasterizer`; Apple Python **3.9.6** for the legacy operational fixtures; the locked root dependencies.

The full suite runs on **macOS ARM64**, which is the authoring environment that produced the committed PNG files. The complete suite most recently passed **754 tests plus seven Python checks** there. Two test families cannot pass on the Linux devbox and are known failures when the suite is run partially there:

- The native Tiled rasterizer tests, which need the macOS Tiled bundle. Install it from [the official release archive](https://github.com/mapeditor/tiled/releases/download/v1.12.2/Tiled-1.12.2_macOS-13%2B.zip) and verify SHA-256 `75712ec3a892701a9b2b7a12e44d636a1dbbe4caa6bb8bba729e697bd8a80433` before extracting; the local binary is ignored by Git. Linux artwork regeneration also changes decoded flight-atlas pixels and is unsupported; never reauthor artwork on the devbox.
- The legacy Python fixtures, which expect Apple `/usr/bin/python3` **3.9.6**. Python 3.14 and later instantiate an HTTPS handler's verified default context immediately, whereas those fixtures expect its private `_context` field to be `None`, and they report an invalid-escape syntax warning when importing the recovery guard, conflicting with its inert-import stderr assertion. Actual redirect rejection and verified TLS behaviour remain intact; the fixtures are a version check, not a transport failure.

The configuration tests additionally require the **Docker 29.8.0 CLI** and **Compose 5.5.1 plugin**. They run `docker compose config` to inspect configuration and do not need a Docker engine, Docker Desktop or running containers. On macOS, install [the official ARM64 Docker CLI archive](https://download.docker.com/mac/static/stable/aarch64/docker-29.8.0.tgz) (SHA-256 `3f37afe51f8f53f224192099a76a454a62eb6100d426738da17fdf8472cf4b5f`; only its `docker/docker` binary is needed) and [the official ARM64 Compose binary](https://github.com/docker/compose/releases/download/v5.5.1/docker-compose-darwin-aarch64) (SHA-256 `998735c9b6fe68a4f05895e6ea73d71ad06f9fc7046383ad89e47346781b6af5`) under `$HOME/.docker/cli-plugins/docker-compose`.

Editing notes: open `maps/<map-id>.tmj` in Tiled to edit a native map; `npm run maps:build` preserves those files and only validates them and refreshes previews. `npm run maps:author` compiles the editable JSON layouts and guards against overwriting native Tiled edits through its intentionally local `.qa/authored-map-hashes.json` manifest; `npm run maps:author -- --initialize` rewrites native map pairs and is only for a deliberate, backed-up redraw, never a routine build step. Follow [map editing and safe publication](map-editing.md) when preserving live organiser changes.

## Source-integrity receipts

[publication/source-manifest.json](../../publication/source-manifest.json) freezes the original **303** source receipts in `sourceInventory` (`sourceFilesByteExact: 303`); keep them unchanged. Every reviewed change to an original source file is recorded as a revision file under `publication/revisions/` with `path`, `fromSha256`, `toSha256` and `reason`, and every added or changed non-original file (tooling, tests, documents, operational files and tests, the release build configuration) is pinned by exact SHA-256 in `extensionInventory`. Within `app`, `art`, `assets`, `maps`, `src`, `tools`, `tests` and `world`, the actual files must equal the union of the two inventories, excluding explicitly retired originals; the inventories cannot overlap; missing, unlisted or changed files fail verification. The checker does not discover arbitrary new files outside those eight folders, so review must account for every new operational file explicitly. Do not insert placeholders for future files.

The rule for every release: update `publication/revisions` and the extension digests with every reviewed change, then run `node publication/verify-source.mjs .` and require it to pass before `apply`. Verification does not regenerate artwork. The reviewed extension count is generated in [current facts](../current-release-facts.md); run `node ops/current-release-facts.mjs --check` after touching the manifest.


## Explicit source retirements

`publication/retired-source.json` is pinned in the extension inventory. Each retirement names one original path, its final reviewed SHA-256 and the reason for removal. The original 303 receipts and revision chain remain immutable. Verification rejects undeclared deletions, incorrect prior hashes and reappearing retired files. Historical fixtures and reserved tileset slots do not activate any guide system.
