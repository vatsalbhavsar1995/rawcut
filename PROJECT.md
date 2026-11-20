# PROJECT.md — RAW CUT: The Impound (browser prototype)

## Goal
Prove the idea in the browser first: a SUPERHOT-style spy action game. Later: heavy modeling in Godot or Unreal. No more chapters for now.

## Core idea
- Frozen-time rule: time moves only when the player moves or looks. Standing still ≈ freeze (3% speed).
- Spy fights down a 2-story building: top floor → stairs → ground floor → exit.
- Slow-mo kill moment: brief extra slowdown, zoom and flash on each kill.

## Current file
`raw-cut-impound-action.html` (single file, Three.js r128, 2D logic on an x/z plane, two floors, floor height 6).

## What exists
- Level: top floor ring walkway around an atrium, inspector's office with desk; stairs on the west side; ground floor lobby with cover, evidence vault, south loading-bay door. 11 enemies (4 top, 7 ground).
- Objectives: 1) plant dossier at desk (top) 2) take shipment crate (vault, ground) 3) exit door (ground).
- Player: 3 HP, 8-round mag, reload takes game time, light aim assist, Cover Meter watch (full = alarm).
- Enemies: patrol → alert (seen, shot heard, or alarm) → chase, strafe, fire slow bullets. They stay on their floor.
- Controls: WASD, mouse (capture if allowed, else drag-to-look, or cursor-steer), click/Space/F fire, R reload, Q/E turn, Esc/P pause. Touch: left thumb move, right thumb aim, FIRE button.
- Menu: title, pause, settings (look mode, sensitivity, invert Y, graphics low/high).
- Body facing: faces movement direction normally, faces camera while aiming (1.6 s after a shot).

## Known issues / unverified
- Mouse control inside the embedded page was reported as unusable. The new drag-to-look default is untested.
- Camera can still clip near thin walls and the stair sides.
- Enemies can get stuck on cover while chasing (greedy movement, no pathfinding).
- Aim is horizontal only (pitch does not change bullet height).
- Performance on weak machines is unmeasured.

## Next tasks (do one at a time, in this order)
1. Verify mouse look and camera feel in a normal browser tab (outside the embed). Fix only what is broken.
2. Split the single file into `index.html`, `levels.js` (data), `game.js`, `ui.js`. No behavior changes.
3. Add simple enemy pathing around cover.
4. Add a second weapon pickup (e.g. dropped rifle from a kill).
5. Add a sound pass (low drone that drops in freeze, shots, hits).

## Not now
Next chapters, multiplayer, Steam packaging, final art.
