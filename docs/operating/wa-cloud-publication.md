# Sponsored WA event publication

The event target is `https://world-43813.map-storage.workadventu.re`, directory **`varcamp-2026`**, in the sponsored `varcamp/world` world. This is the event production directory. The existing `small-forest-office.wam` room must remain unchanged.

The entry URL after a verified upload is:

`https://play.workadventu.re/@/varcamp/world/varcamp-2026/maps/overworld#welcome`

The private upload environment is `ops/private/wa-cloud.env` (mode 0600, ignored by Git). It contains `MAP_STORAGE_URL`, `MAP_STORAGE_API_KEY`, and `UPLOAD_DIRECTORY=varcamp-2026`. Do not place its values in logs, command arguments or release artifacts.

## First publication only

Run inside tmux, using the pinned Node version and a 6 GB memory limit. Build the full catalog release and retain a fresh public download of every existing devbox WAM as `<saved-wams>/<map-id>.wam`. These files carry the organizer's saved areas, meetings, objects and metadata.

```sh
systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0 npm run buildmap
node publication/verify-source.mjs .
python3 ops/wa_cloud_release.py prepare --saved-wams <saved-wams> --plan <new-plan-directory>
python3 ops/wa_cloud_release.py apply --plan <new-plan-directory>
```

Review the prepared package and retained inputs before `apply`. The publisher accepts only the approved host and production directory. It refuses an occupied event directory, never uploads at the root, checks the whole cloud world twice before writing, uploads once, and compares two whole-world readbacks. A mismatch or ambiguous upload is a stop condition: inspect the retained evidence and live state; do not retry blindly.

Migration changes only each saved WAM's TMJ version pin and the two standard editor collection URLs. It retains every other field, including meeting properties, entities, area IDs, names, metadata and command history. The cloud release compiles native TMJ door destinations to relative, extensionless room IDs and pins the transformed TMJ bytes. The stored WAM filenames keep `.wam`; authored maps and the generic devbox build remain unchanged. Scripted travel uses the same canonical hosted room IDs. The journal loads the official WA iframe API.

The plan retains `baseline.zip`, `release.zip`, `saved-wams.zip`, `package.zip`, `plan.json`, both `readback-*.zip` files and a `receipt.json` after success. These are local operational evidence, not public assets.

## After publication

Verify the actual hosted entry room, sponsor court, registration controls, a speaker room, the two ceremony halls and exploration navigation. Confirm the journal opens and returns to the plaza, and no guide UI or old devbox requests appear. Inspect WA's `/map` response bodies for the expected `wamUrl`: an HTTP 200 response can contain `ROOM_NOT_FOUND`. Test native doors as well as scripted travel. A successful ZIP upload alone is not browser acceptance.

Subsequent edits must start from fresh **cloud** WAMs. Apply `cloud_room_routes()` to the built release before token migration, then pass those same transformed bytes into the reviewed replacement package. Retain both original and transformed artifacts. Existing WAMs must use the byte-preserving version-token migrator; do not use first-publication JSON rewriting over later cloud editor work. This first-publication tool intentionally refuses to overwrite an existing event directory.

The map-storage token does not change the world's admin landing room or event capacity. Set the event's default entry in WA admin if it still points to Small Forest Office. Rehearse two-way audio and screen sharing with real attendees on their actual networks before the event; one browser and API readbacks cannot prove media connectivity or 3000-user performance.
