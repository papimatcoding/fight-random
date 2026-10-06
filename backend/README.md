# Fight Random backend

The browser game remains P2P for combat. Supabase only handles persistent product state:

- guest profile + nickname
- public/private room discovery
- room/member heartbeat
- rating and leaderboard
- match history and aggregate stats

## Security model

The browser never receives a service-role/secret key. All fr_* tables have RLS enabled and direct anon/authenticated access revoked.

The public Edge Function `fight-random-api` runs with `verify_jwt=false` because it implements its own guest authentication: each browser owns a cryptographically random 256-bit `x-fr-token`, while Postgres stores only SHA-256(token).

If the backend is unavailable, direct room links and P2P matches continue to work; persistence/lobby features degrade to local mode.

## API actions

`session`, `set_profile`, `lobby`, `create_room`, `join_room`, `heartbeat`, `leave_room`, `record_match`.

Match reporting is host-only and idempotent through a client-generated UUID.
