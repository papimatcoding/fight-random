# Fight Random

A fast 1v1 browser arena where both players pick a permanent power after every round until the build becomes absurd.

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

- First to 5 round wins wins the match.
- Each player gets 3 random power choices after every round.
- Powers stack and include multishot, fire rate, bounce, explosive rounds, homing, lifesteal, shields, revive and deliberately broken late-game upgrades.
