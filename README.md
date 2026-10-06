# Fight Random

Fast 1v1 browser arena: both players pick a permanent power after every round until the build becomes absurd.

## Current gameplay foundation

- Online 1v1 with room links and no account/install.
- Both players must press **Ready** before the match starts.
- Rematches only start after both players accept.
- First to 5 round wins takes the match.
- 3 rotating arena layouts with different obstacle geometry.
- Map pickups: healing, shield and temporary speed boost.
- Elemental powers: fire, frost and shock.
- Match stats: damage, accuracy and pickups.
- Multishot is represented visually by multiple barrels.
- Host-authoritative simulation over PeerJS/WebRTC.

## Balance direction

The original prototype ended too quickly, so the baseline now targets a longer time-to-kill:

- Base HP increased to 140.
- Base projectile damage reduced to 11 and base fire delay increased to 0.48 s.
- Multishot uses diminishing per-projectile damage instead of scaling linearly.
- Fire-rate upgrades are milder and capped.
- Stronger rarities unlock later in the match.
- Legendary/illegal upgrades have meaningful downsides.
- Healing and defensive pickups create comeback windows without resetting builds.

## Controls

- `WASD` — move
- Mouse — aim
- Left click — shoot
- `Space` — dash

## Next candidates

Gameplay first: more arenas, additional elemental interactions, alternative modes and deeper balance passes. Cosmetics/shop can come later once the combat loop is solid.
