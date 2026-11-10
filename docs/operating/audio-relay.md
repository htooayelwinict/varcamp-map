# External audio relay

The demo's Play service generates the ICE configuration sent to attendee browsers. `ops/compose.yml` passes the deployed WorkAdventure runtime's existing STUN/TURN settings to Play. Empty defaults preserve the current disabled state; this wiring alone does not create or activate a relay.

Use an external, authorized TURN provider. Do not open devbox ports or configure a tunnel. The provider must offer authenticated relay allocation and enough quota for the intended usage; a small trial is suitable only for bounded testing. Prefer an endpoint list with UDP and TCP/TLS fallback, including TLS on TCP 443 for restrictive networks.

## Private configuration

Keep real values in `/srv/varcamp/private/environment` using the established private-file workflow. Never commit them, print a rendered deployment configuration, or paste them into chat. The following values are placeholders, not usable credentials:

```dotenv
STUN_SERVER=stun:relay.example.invalid:3478
TURN_SERVER=turn:relay.example.invalid:3478?transport=udp,turns:relay.example.invalid:443?transport=tcp
TURN_USER=provider-issued-turn-username
TURN_PASSWORD=provider-issued-turn-credential
TURN_STATIC_AUTH_SECRET=
```

Use the provider's actual URLs, username and credential. A provider dashboard/API master key is **not** a browser TURN password. The native runtime sends `TURN_USER` and `TURN_PASSWORD` to attendees for relay authentication. Use credentials dedicated to this event, with provider-enforced quota and a lifetime exceeding the intended session. Rotate or revoke them after use.

Alternatively, an operator-controlled Coturn server can use `TURN_STATIC_AUTH_SECRET` instead of static username/password. Leave `TURN_USER` and `TURN_PASSWORD` empty in that mode. The deployed runtime generates per-user HMAC credentials valid for 24 hours. Never enable both authentication modes: the shared secret takes precedence and would replace the provider's static credential.

Cloudflare TURN API tokens also require credential generation and expiry handling; do not put a Cloudflare API token into any of these browser credential fields. This change does not add that API integration.

## Activation and rollback

1. Confirm the provider account, usage limit, endpoint list and authentication mode. Prove authenticated allocation and forced-relay bidirectional traffic before activation; a successful STUN response is insufficient.
2. Save a private recovery copy of the deployed Compose and environment. Preserve the privately qualified Play image, WOKA catalog mount, allowed editors and all unrelated settings described in [devbox deployment](devbox-deployment.md).
3. Add only the five relay interpolation entries from `ops/compose.yml` to the deployed Play environment. Do not replace `/srv/varcamp/compose.yml` wholesale with the public base.
4. Render/inspect privately and ensure the change is limited to Play's relay environment. Recreate only Play, keeping the deployment's current Compose file set, with `up -d --no-deps play`. Do not restart the entire stack.
5. In a fresh attendee session, verify the server-supplied ICE list contains the intended relay URLs and authenticate to them. Confirm a selected relay candidate and audio packets in both directions, then exercise mute/unmute, room re-entry and reconnect.
6. Verify a call between the actual participants on separate networks, including Lewis's VPN, before declaring the reported one-way audio resolved. Same-host browser success alone is not that acceptance.

If the provider/configuration fails, restore the saved Play environment and recreate only Play with the same deployment files. This restores the previous configuration; it does not repair its missing relay fallback. Existing attendees may need to reconnect after either change.

Configuration coverage: `ops/tests/turn-config.test.ts` renders real Compose with synthetic values to verify propagation, optional shared-secret mode, disabled defaults, and isolation of other services and networking. `ops/tests/config-isolation.test.ts` covers the existing deployment boundaries. Run each file separately under the repository's memory cap.
