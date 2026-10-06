# Fight Random

Fast 1v1 browser arena: both players pick a permanent power after every round until the build becomes absurd.

## Play

Open the GitHub Pages site, click **Crear partida**, and send the room link to another player. No account or install is required.

## Controls

- `WASD` — move
- Mouse — aim
- Left click — shoot
- `Space` — dash

## Tech

- Vanilla HTML/CSS/Canvas
- PeerJS/WebRTC for direct browser-to-browser multiplayer
- Host-authoritative simulation
- Static hosting; no app server or database required

## MVP rules

- First to 5 round wins takes the match.
- Each player gets 3 random power choices after every round.
- Powers stack: multishot, fire rate, speed, max HP, heavy bullets, bounce, dash, shields, homing, boosted impacts and glass-cannon builds.
- From round 5, deliberately illegal upgrades can appear.
