# Fight Random

Browser arena for 2–4 players. No account, no install: create a room, share the link and play.

## Modes

- **1v1** — 2 players, first to 5 rounds.
- **1v1v1** — 3-player free-for-all, first to 4 rounds.
- **2v2** — 4 players, first team to 5 rounds.

The host is authoritative: clients send inputs and choices, while the host simulates damage, projectiles, barrels, pickups and round results.

## Turret / character direction

The current fighter is a neutral **Prototype turret**. Character definitions are intentionally not invented yet.

- Common, rare and epic upgrades are general build upgrades.
- Legendary and illegal slots are reserved for character ability upgrades.
- The character registry and ability-upgrade hooks already exist, ready for the user-defined roster.

## Comeback rarity system

Upgrade rarity is weighted by consecutive round losses. The base table strongly favors common/rare upgrades; a losing streak gradually shifts weight upward. Legendary and illegal rarity only participates when the selected character actually has upgrades defined for those tiers.

The system is capped at 3 consecutive losses so comeback luck helps without turning a losing player into an automatic high-roll machine.

## Gameplay

- 3 rotating maps with different obstacle geometry.
- Explosive barrels at authored map positions; explosions damage anyone and can chain-react.
- Healing, shield and temporary speed pickups.
- Fire, frost, shock, homing and explosive epic upgrades.
- Visible health bars above every turret plus desktop HUD cards.
- Multishot is represented by multiple physical barrels on the turret.
- Fullscreen arena option.
- Ready-up before the match and unanimous rematch ready-up.
- End-of-match damage, accuracy, eliminations and pickup stats.

## Current general upgrade pool

**Common:** multishot, fire rate, movement speed, max HP, base caliber.

**Rare:** heavy rounds, ricochet, dash improvement, round-start shield, lifesteal.

**Epic:** fire, frost, shock, homing, explosive projectiles.

## Balance baseline

- Duel: 150 base HP.
- 3/4 player modes: 165 base HP to reduce focus-fire burst.
- 10.5 base projectile damage and 0.50 s base fire delay.
- Multishot uses diminishing per-projectile damage.
- Fire-rate, mobility and damage upgrades are capped.
- Strong effects are kept in epic rarity rather than stacking raw damage in low tiers.

## Controls

- `WASD` — move
- Mouse — aim
- Left click — shoot
- `Space` — dash
