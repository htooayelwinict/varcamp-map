# Guide system removal

Scope: remove the retired static Q&A hosts and the walking Lyra/Nova/Orion guides from the repository and release package. This includes their UI, menu registration, controller bundle, runners, service templates and feature-only tests. Navigation, registration, quests, the Lantern Trail, map art, collisions, WAM metadata and all 34 map pairs remain in scope for preservation.

The baseline at `c2d36a0` passed source-integrity verification. The actual plaza entry registered “Talk to Nearby Guides”, and a production build emitted `bots/lyra.js`, its source map, and the two guide/NPC HTML gateways. The new removal tests failed on those outputs before implementation. The source-retirement tests failed before the verifier supported exact, pinned deletions.

The release plugin now emits only the venue assets and remaining interfaces. Static legacy-host cleanup is a test-only adapter for frozen historical layouts. Old walkable-cell assertions use a geometry fixture; they do not retain controllers or a bot runtime. Historical receipts, fixtures and unused atlas reservations remain so this removal cannot shift unrelated GIDs or erase source provenance.

Acceptance checks:

- The real plaza entry registers only the four existing navigation/journal commands, retains the welcome-directory quest subscription and opens registration when the desk prompt is activated.
- The actual release produces all 34 native map pairs and the journal, expedition and check-in interfaces, with no executable guide artifacts.
- The removed implementation and service source directories are absent.
- Exact source retirements preserve the original 303 receipts; undeclared deletions, reappearing files and wrong prior hashes fail verification.
- Native TMJ/WAM and layout source bytes remain unchanged from the baseline.

All Vitest files are run individually under `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0`; no uncapped full suite is used. Task logs are retained locally in `.orca/guide-removal-20261113/`.

Deployment boundary: this change removes repository code and local build outputs. It does not upload to either map-storage host, restart WorkAdventure, or remove the separate previously installed `/srv/varcamp/npc` service. At baseline, `varcamp-npc-1` was still running from that installed copy; private walking-guide services and old uploaded artifacts require separate deployment handling. No cloud migration is claimed complete by this change.

Verification results: the removal contract (3 tests), retirement integrity (9), general runtime (17), release caching (8), publication integrity (12), historical revision chain (97), current documentation (7), and check-in counter (8) pass. TypeScript and the production map build pass. The build contains 34 maps and no `bots/`, `src/guides/` or `src/npc/` outputs.

Unrelated finding: `tests/npc-maps.test.ts` passes 10 of 11 checks but its last test still expects `standing-caption-boarding-label` in the current beach. That historical caption is absent, causing a `TypeError` when reading `caption.properties`. Running the original `HEAD` test with the exact original cleanup function against the unchanged maps produces the same failure. This removal leaves that stale beach assertion and all beach source bytes unchanged; it does not claim a fully green repository suite.

The 11 direct-release roster cases also pass with `--testTimeout=60000`, still under the 6 GiB scope. Their default 5-second timeout was too short for native validation on this box. The remaining furnishing-rejection test expects an older error message: it receives `Office wings: unreviewed room speaker-aries`. Replaying that case with the original release plugin and original test (omitting only the unused guide fixture copy) reproduces the same assertion failure before any controller build. It remains an unrelated stale assertion, not a relaxation of the furnishing guard. `npm run maps:validate` reports 68 TMJ/WAM files and zero issues.

Independent bug and compliance passes reviewed the staged deletion. Preflight found a Burmese README handoff anchor accidentally removed with the guide section; the anchor was restored, and the local link checker then returned no issues for that README. No production service or cloud storage changes were made.
