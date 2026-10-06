# Fight Random

Browser arena for 2–4 players with incremental builds, character abilities and fast P2P multiplayer.

## Play loop

- Pick a character: **MIX**, **TRUCKS** or **LIZZY**
- Play 1v1, 1v1v1, 2v2 or the special **CORE** mode
- Win rounds and choose upgrades
- Common / rare / epic upgrades shape the general build
- Legendary / illegal upgrades modify character abilities
- Comeback rarity weighting helps a player on a losing streak without guaranteeing high rarity
- Storm pressure closes rounds that stall

## Persistent game layer

Fight Random now has a lightweight Supabase backend while keeping combat P2P:

- persistent guest profile and nickname
- public / private rooms
- quick play
- room heartbeat / stale-room cleanup
- rating leaderboard
- recent match history
- aggregate wins, kills, deaths and damage
- idempotent server-side match recording

If the backend is unavailable, direct room links and active P2P matches continue to work.

## Gameplay systems

- multiple arena sizes and mode-aware map pools
- explosive barrels and chain reactions
- explicit healing / speed / shield pickups
- fire, frost, shock, homing and explosive upgrades
- build synergies
- killfeed, damage feedback and procedural combat audio
- fullscreen desktop arena

## Controls

- `WASD` — move
- Mouse — aim
- Left click — primary fire
- `Space` — basic ability
- `E` — special ability

## Backend

See `backend/README.md`, `backend/schema.sql` and `backend/fight-random-api/`.

The browser never receives a Supabase service-role/secret key.
