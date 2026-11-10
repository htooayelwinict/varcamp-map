# External audio relay implementation plan

> **For agentic workers:** Implement inline with `superpowers:executing-plans`, failing-first tests, and independent review before committing.

**Goal:** Connect this demo to an external TURN service without exposing new devbox ports.

**Architecture:** Use the deployed WorkAdventure `IceServersService` and `WebRTCCredentialsService` unchanged. Pass optional STUN/TURN variables into the Play service through Compose. Provider credentials stay in the private deployment environment.

**Tech stack:** Existing Docker Compose, native arm64 WorkAdventure, Vitest configuration tests.

**Authority and scope:** The user requested adding the relay now, independently of WA sponsorship, and deferred further participant debugging. This fixes missing relay configuration, not a proven cause of every one-way-audio incident. No map, VPN, firewall, AWS, LiveKit, or engine changes belong to this task.

## Validation and constraints

- Current deployed Play and Back, and the private environment, have no STUN/TURN values. The repository Compose does not pass them through.
- Deployed Play accepts comma-separated STUN/TURN URLs plus either username/password or a Coturn shared secret. A shared secret takes precedence over static credentials.
- An external relay is required by the standing no-new-public-ports rule. No authenticated relay account or credential is currently available. A Metered sign-in request is pending; its trial allowance is for bounded tests, not event-capacity acceptance.
- Run each test file alone inside tmux with `systemd-run --user --scope -p MemoryMax=6G -p MemorySwapMax=0`.
- Do not deploy dummy credentials or activate STUN alone and call the relay complete.

## Task 1: Pass relay configuration to the existing runtime

- [ ] Add `ops/tests/turn-config.test.ts`, exercising real Compose rendering with synthetic provider values. It must fail before the Compose change because the values are absent.
- [ ] Verify configured URL lists and static credentials reach only Play; the Coturn secret alternative reaches Play; unrelated service/network/port/image configuration is unchanged; unset values leave relay disabled.
- [ ] Add optional interpolation for `STUN_SERVER`, `TURN_SERVER`, `TURN_USER`, `TURN_PASSWORD`, `TURN_STATIC_AUTH_SECRET` to `ops/compose.yml` only.
- [ ] Run the new file and the existing configuration-isolation file separately under the memory cap.
- [ ] Document credential handling, exact service scope, rollback, and acceptance. Do not commit a populated environment file.
- [ ] Request independent `$review-agent` review and a separate `$code-review` pass before any commit; resolve findings.

## Task 2: Activation and end-to-end acceptance (requires provider access)

- [ ] Obtain an authorized provider account and valid relay credentials with adequate quota and lifetime. Keep all real values private. Check TCP/TLS fallback is offered.
- [ ] Validate an authenticated relay allocation and forced-relay bidirectional traffic before changing the deployment. A returned STUN address is insufficient.
- [ ] Snapshot the live Play configuration privately, preserve its image and mounts, apply only the approved relay environment, and recreate only Play if required.
- [ ] Confirm healthy service and actual server-supplied ICE configuration in a fresh attendee session; prove relay-selected audio both ways and mute/unmute, room re-entry, and reconnect.
- [ ] Re-test Lewis and Voz on their separate networks/VPN when available. Do not report their incident resolved without that result.

## Review focus

Mixed authentication modes, credentials expiring during a meeting, quota exhaustion, provider master keys exposed as browser credentials, and deployment drift that replaces the private Play image or mounts must be checked before activation. Configuration tests do not establish relay connectivity or real-user audio acceptance.
