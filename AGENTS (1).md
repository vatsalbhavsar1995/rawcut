# AGENTS.md — working rules for AI coding tools

Project: RAW CUT, browser prototype (see PROJECT.md for design and state).

## Core rule
Do exactly what the task says. Nothing extra.

## Rules
1. Make the smallest change that completes the task. No refactors, renames, reformatting, new features, new dependencies, or "improvements" I did not ask for.
2. Before editing, say in 2–3 lines which files and functions you will touch.
3. If a request is ambiguous, pick the most reasonable reading, say which one you picked, and continue. Ask a question only if you are truly blocked.
4. Never delete or rewrite working code that is unrelated to the task.
5. One task = one commit. The game must stay playable after every task.
6. After editing, list changed files and what changed in one short list. Do not re-explain the whole project.
7. If something I asked for is a bad idea, say so in one sentence, then do it anyway unless it breaks the game.
8. Do not add art, audio or assets unless asked. Low-poly boxes are fine.

## Tech constraints
- Three.js r128 from cdnjs, pinned. No build step, no bundler, no npm unless asked.
- Game rules and level layout live in data tables (walls, enemy spawns, objectives), not scattered through code.
- Must run on a weak laptop. Keep the low-graphics option working.

## Test checklist (run before saying "done")
- Page loads with no console errors.
- Menu, pause (Esc / P) and resume work.
- WASD moves, camera turns, click fires.
- Stairs work both ways. Objectives complete in order. Win and death screens show.
