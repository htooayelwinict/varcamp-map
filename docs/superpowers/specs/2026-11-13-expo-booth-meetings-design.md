# Expo booth meetings and muted arrivals

## Intent and approved scope

Visitors should be able to meet and chat within each of the six existing community/media booths. The user accepted six separate native meetings, chat enabled, camera and microphone muted on entry, and an eight-person occupancy limit for these smaller booths. The three existing sponsor areas also start muted, with **no booth-specific participant cap**. The latest clarification explicitly preserves that distinction.

The six booths are AWS USER GROUP MYANMAR, BSides Myanmar, Vibes Code Tours, OSRFM, Duwun, and Open Taxi. Sponsor names/titles, artwork, layouts, furniture, navigation and all unrelated editor content remain unchanged. No infrastructure or persistent Matrix chat changes.

The user subsequently added a separate visual request: enlarge DigiSec Lab's mark in the entrance plaque across all twelve speaker rooms. Use the original official PNG and existing export script. Keep the 192 by 64 sign footprint, frame and every title pixel unchanged; increase the fitted full mark from 49 by 44 to 56 by 50 pixels, centered in the existing left section. This is the maximum comfortable fit without touching the border. The two tasks may run in parallel because they own different production files.

## Validation and approach

The fresh hosted WAM at 2026-11-13 19:32 UTC has three native meetings with chat enabled, audio/video start-muted false, and no occupancy properties. The six booth floors have no meeting areas. Two muted guests previously demonstrated connection inside one sponsor meeting, isolation across different sponsors, and disconnection after leaving; this does not establish event-scale capacity.

Use WA native area properties, matching the existing sponsor pattern. A custom script or six external video embeds would introduce unnecessary lifecycle and compatibility risks; separate maps would change the approved layout. Native meetings are the accepted approach. Distinct room names isolate conversations; all booths still share the plaza renderer.

The six floor rectangles are 192 by 128 pixels at y=2624, with x=1248,1504,1760,2208,2432,2656. They end at y=2752, where the shared south walkway starts. Existing sponsor geometries/IDs remain exact. Only their `startWithAudioMuted` and `startWithVideoMuted` fields change. New booths have `maxUsersInAreaPropertyData.maxUsers=8`, `disableChat=false`, and both start-muted fields true. A participant may deliberately unmute inside. WA may restore the pre-entry state when leaving unless changed inside; this is not a permanent media ban.

## Safety and acceptance

- A named, exact-output WAM migration accepts only this scope, is idempotent, and rejects identifier/room collisions, modified owned boundaries, and overlapping functional areas.
- Before/after tests exercise the real publisher, preservation of manual metadata/entities/areas, all nine muted arrivals, six caps, and zero sponsor caps. Malformed or ambiguous input must fail closed.
- Publish only `varcamp-2026/maps/overworld.wam` from a fresh live-world baseline after a quiet editor window. Retain every other world file byte-for-byte; check the complete world twice before and twice after upload.
- For the separately requested entrance logo, also add its new content-hashed PNG and change only the image reference in twelve hosted speaker TMJs, plus their paired WAM version tokens. Keep all existing asset bytes and all other TMJ/WAM bytes unchanged. Refuse unexpected artwork or changed sign dimensions. The combined release changes 25 existing files and adds one asset.
- On hosted WA, verify six separate meeting/chat interfaces, entry/exit lifecycle, cross-booth isolation, and camera/mic off on arrival. Test occupancy blocking and release with ordinary guest movement where feasible; distinguish configuration proof from a live capacity test.
- Shared chat messages require separate explicit permission. Close all owned QA browser contexts at the end. Do not certify peak event capacity from a small probe.

## Evidence and sources

Read-only evidence: `.qa/booth-load-20261113/assessment.md`, `baseline.json`, `booth-load-probe.json`.

- https://docs.workadventu.re/map-building/inline-editor/area-editor/meetingRoom/
- https://docs.workadventu.re/map-building/inline-editor/area-editor/max-users-area/
- https://github.com/workadventure/workadventure/blob/develop/libs/map-editor/src/types.ts

Historical full-suite failures remain recorded under the user's existing permission to continue scoped work. This change does not claim to repair them or the historical self-hosted VPN/audio issue.
