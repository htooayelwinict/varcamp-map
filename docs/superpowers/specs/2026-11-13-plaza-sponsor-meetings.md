# Plaza sponsor meetings and chat

Lewis asked to fix meeting and message behavior in his manually drawn sponsor zones while keeping the area boundaries. Scope is the three current sponsor areas in hosted `varcamp-2026/maps/overworld.wam`: DigiSec Lab, Newness and Lokal Zaytann.

Baseline: two anonymous attendees established DTLS connections in each existing meeting, but neither had an editable message input. All three native meetings set `disableChat: true` and bind separate Matrix areas. The Matrix bindings have inconsistent automatic-open settings. The native meeting path already works in the repaired speaker rooms; this is a map configuration issue, not evidence of an infrastructure outage.

Use one distinct native meeting and its native chat per existing sponsor area. Preserve area IDs, names, visibility, pixel geometry, meeting IDs/names, microphone/video/raise-hand choices, descriptions and unrelated editor data exactly. Set only the three owned meeting `disableChat` values to false and detach the three exact reviewed Matrix area properties. Do not call Matrix APIs or delete server rooms/history. The full live baseline is retained for recovery. Keep the unrelated unnamed silent area and directory untouched.

Approaches: retaining separate Matrix chat would retain a second guest-chat dependency; changing to Jitsi would replace already working meetings. Reuse the existing native chat repair pattern to meet the delegated behavior requirement with the smallest change.

Acceptance: all geometry and unrelated fields compare equal; distinct room names remain distinct; two ordinary guests can meet in every booth from more than 300 pixels apart, see a message input, exchange approved QA text in both directions, and disconnect on exit. Guests in different sponsor zones must not join the same meeting. Message delivery verification requires explicit permission for the exact QA messages. Use failing-first migration tests and independent review before commit, then guarded production upload with complete readbacks. Record the prior programme-board rendering issue and historical baseline test failures separately; do not expand this scope.
