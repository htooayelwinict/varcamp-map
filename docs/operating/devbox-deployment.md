# Devbox demo deployment

The [devbox guest demo](https://varcamp.3-1-133-135.sslip.io/~/varcamp-demo/maps/overworld.wam) is the Compose project `varcamp` at `/srv/varcamp` on the project's arm64 AWS devbox. The devbox runs the WorkAdventure services (Traefik, play, back, map-storage, icons, redis, postgres, keycloak) that serve the venue; its `map-storage` service also hosts the published map files described in [publication](publication.md).

The demo is deliberately reachable from the public internet through Traefik with Let's Encrypt certificates. It is the only public service on that box. The map editor stays restricted to the `MAP_EDITOR_ALLOWED_USERS` list; anonymous visitors can walk the maps but cannot edit them.

## Public base and private override

`ops/compose.yml` is the public base, deployed as `/srv/varcamp/compose.yml`. The deployed file differs from the public base in exactly three places:

1. `play.environment.MAP_EDITOR_ALLOWED_USERS` reads `${MAP_EDITOR_ALLOWED_USERS:-${ORGANISER_EMAIL}}`, so operators can list extra editor emails without changing `ORGANISER_EMAIL`. The public base now carries the same expression; an empty or unset override falls back to the organiser.
2. `play.image` is a privately qualified mobile runtime candidate, loaded locally and referenced by digest. The public base pins the public `varcamp/workadventure-play` tag. The private reference lives in the qualification receipt, not in the repository: `ops/preflight_checks.py` and `ops/images.lock.json` enforce image identity with provenance receipts; private release bindings are deliberately absent from the checkout.
3. `play.volumes` adds a read-only bind mount of a private zodiac WOKA catalog over `/usr/src/play/src/pusher/data/woka.json`. The public base has no volumes on `play`.

`ops/compose.private.example.yml` is the override template for items 2 and 3, with placeholders only. Copy it to `/srv/varcamp/compose.private.yml`, fill in the two values from the private records, and apply with both files:

```sh
cd /srv/varcamp && docker compose --env-file private/environment -f compose.yml -f compose.private.yml up -d
```

Never commit the filled-in override, real digests, catalog hashes or operator emails.

The legacy NPC implementation and guide runners were removed from this repository on 2026-11-13. The previously installed `/srv/varcamp/npc` copy is separate: at the start of that removal task, `varcamp-npc-1` was still running. Repository removal does not stop that container or erase older uploaded bundles. Do not treat a source build as a deployment receipt.

## Checking drift

Render both files with the same project directory and environment file so relative bind mounts resolve identically, then diff the normalised output:

```sh
cd ~/varcamp-map
docker compose --env-file ops/.env.example --project-directory /srv/varcamp -f /srv/varcamp/compose.yml config --format json | python3 -m json.tool > /tmp/deployed.json
docker compose --env-file ops/.env.example --project-directory /srv/varcamp -f ops/compose.yml config --format json | python3 -m json.tool > /tmp/repo.json
diff /tmp/deployed.json /tmp/repo.json
```

Expected differences: the `play` image line and the `play` volumes block. Anything else is drift and needs either a repository change or a deployed-file correction. `ops/tests/config-isolation.test.ts` pins the `MAP_EDITOR_ALLOWED_USERS` default and override behaviour.

## Publishing maps

Map releases are uploaded from this box straight into the `map-storage` service's `varcamp-demo` directory, served at `https://maps.3-1-133-135.sslip.io/varcamp-demo/`, with the guarded `ops/release_upload.py` tool. The full six-step procedure, its artifacts, the quiet-editor rule and rollback are in [publication](publication.md). Credentials for the upload stay in `/srv/varcamp/private/environment`.
