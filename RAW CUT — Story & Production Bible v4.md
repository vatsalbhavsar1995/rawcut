# RAW CUT — Story & Production Bible v4

*Pure-combat spy action. No slow-mo, no time-freeze. Five days, one bomb, one man who is not supposed to exist.*

**Tagline:** "Twelve years undercover. Five days to stop it."

---

## 1. The Story (read this first)

For twelve years Kaif Alvi has lived as another man. Officially he does not exist. RAW placed him inside the syndicate of the port city of Bandar-e-Surkh to find out where 400 grams of weapons-grade material went after it vanished from an Indian research facility in 2019. He has been the syndicate's trusted fixer for so long that his cover has become a second life: friends, funerals, a dead brother's nickname he now answers to.

The story opens with a hood being pulled off his head. An interrogation room. A lieutenant, Tariq, asks why a man who gave twelve years to the family would betray it now. Kaif survives with a detail only the real Alvi would know. Tariq's phone buzzes: the courier they were hunting has been found. "You're free to go. Prove your loyalty tonight." Black. Title.

Across **Days 1 to 3** Kaif works the city as a fixer, and every job the syndicate gives him is a piece of something he cannot see. A container with a cargo code that matches no manifest. A ledger with payments to a shell company called *Surkh Data*. A colleague he believed dead, Rehman, alive and working maintenance inside the city's server center, who whispers that something there is *counting down*. A young ledger-decoder, Zoya Rahimi, whose father is being set up as a fall guy. The player, like Kaif, does not know what D-day is.

At the end of **Day 3**, in a quiet room, the pieces finally snap together. It is a bomb, a radiological device already shipped out of the port, headed for a tier-1 Indian city, and it will be triggered from the Server Center. And one more thing Kaif suspects but cannot prove: the voice in his earpiece, his handler, is feeding him only what the enemy wants him to have.

**Day 4 is a single long night.** Kaif goes in alone, with Rehman on the inside. Rain, floodlights, dead zones. He learns the trigger needs a physical key held by the syndicate boss, Hakim Sarraf, who will be inside the Server Center at the end. He also learns the traitor is his own handler, Deputy Director Mehra, because Mehra's voice names a position Kaif never reported.

**Day 5** is the assault. Kaif drops in from the roof of the Server Center and fights down floor by floor, with the handler's voice gone from his ear, to the server core. Saarang, an off-book RAW operative trained exactly like him, stands in his way. Then the boss, at the master console, with a real countdown running. Kaif kills Sarraf, takes the key, and stops it with seconds left.

He walks to the pier at dawn, removes the Alvi watch, and drops it into the sea. A burner phone rings. Zoya: *"So what do we call you now?"*

**The operative wins.** Cleanly. No tragic ending.

---

## 2. What Changed in v4

| Removed | Replaced with |
| --- | --- |
| Slow-mo / time-freeze mechanic | Normal-speed tactical combat: cover, aim, reload, flanking, gadgets |
| "Frozen-time indicator" UI | Plain gunfight audio and camera: tension from sound and framing |
| Mirror-duel boss (both frozen) | Saarang as a real combat boss with Kaif's own toolkit |
| "The bomb doesn't care" tagline | "Twelve years undercover. Five days to stop it." |
| Constant ticking pressure | Hours spent between chapters; real-time clock only on Day 5 |

**Kept:** the Cover Meter watch, diegetic UI, case-file chapter cards, Bandar-e-Surkh's four environments, the five-day structure.

**Core rule:** the player decides whether to go stealthy or loud. Stillness is always free. The Cover Meter rises only from noise, found bodies and being seen.

---

## 3. The Cast

- **Kaif Alvi** (the player). RAW deep-cover operative, 12 years under the name Alvi. Calm, observant, dry. Wears the Alvi watch, which is his Cover Meter.
- **Mehra** ("Lighthouse"). Deputy Director, Kaif's handler, a single ear of voice. Secretly the traitor. Goes silent on Day 5.
- **Rehman.** Kaif's old colleague who "died" so the operation could stay deniable. Works maintenance inside the Server Center.
- **Zoya Rahimi.** Ledger decoder and the ally who stays in the open. Her father, **Dr. Idris Rahimi**, is the engineer framed as the bomber.
- **Tariq.** Syndicate lieutenant. Suspicious, loyal to the boss.
- **Hakim Sarraf.** The Boss. Port magnate, calm, never raises his voice. Holds the physical trigger key.
- **Saarang.** Off-book RAW operative, the mole's inside man. Same training as Kaif.

---

## 4. The City: Bandar-e-Surkh

| Environment | Palette | Used in |
| --- | --- | --- |
| The Port | Teal water, rust cranes, sodium lamps | 1.1, 1.3, 3.2, 5.3 pier |
| The Bazaar | Lantern orange, spice dust, alley neon | 1.2, 2.1, 2.2, 3.1 |
| The Warehouse District | Green-grey containers, floodlight fog | 3.2 (day), 4.1 (night) |
| The Server Center (4 floors, F4 to F1) | Blue-black, red alarm strobes, glass and cable | 4.3, 5.1, 5.2, 5.3 |

Maps are reused with new time-of-day, weather and lighting so each return feels like a new level.

---

## 5. How a Day Plays

Every day has the same rhythm:

1. **Title card.** "DAY 2 — 96 HOURS REMAINING" in stamped case-file type.
2. **Chapters (2 to 3).** Combat and stealth, each ending with one clue.
3. **The Quiet Hour.** A short rest beat at the safehouse (2 to 3 minutes, no HUD).
4. **Next-day card.**

### The Quiet Hour (connect-the-dots)

This is the signature beat between days. It replaces the slow-mo as the game's identity.

- Kaif sits. The watch ticks softly. Rain or traffic outside. Ambient only.
- The day's clue cards appear on the wall as case-file overlays (a ledger page, a photo, a phone screen).
- The player links two or three cards. The right pair draws a red string with a soft stamp; a wrong pair jitters and slides apart.
- Kaif thinks out loud in short lines. The strings pull tight into one shape.
- One last line is stamped across the board. That line is tomorrow's mission.
- **Loadout choice:** pick one tool or weapon change for tomorrow (silenced pistol, smoke, lockpick, extra armor).

Build note: this is a 2D screen. Animate with CSS or Canvas strings. It costs nothing on a weak PC.

---

## 6. Day by Day

### DAY 1 — "THE WRONG MAN" *(120 hours remaining, evening to night)*

**Goal:** prove loyalty to the syndicate and learn what they are moving.

- **1.1 Prove It** (Port). Retrieve a sealed manifest from a rival smuggler's warehouse. Tutorial combat: stealth or loud, enemy awareness, cover. **Clue:** a container code that matches no manifest.
- **1.2 The Handshake** (Bazaar). Meet the syndicate's money man in the lantern alleys; a tail turns into a chase on foot. **Clue:** a ledger fragment with payments to *Surkh Data*.
- **1.3 Blood on the Pier** (Port). An ambush by unknown men. Kaif is wounded and escapes to the safehouse. **Clue:** Rehman is alive and says something inside the Server Center is counting down.

**Quiet Hour dots:** container code + Surkh Data + countdown = *something big ships out of this port and is controlled from the data company.* **Stamp:** "FIND WHAT SHIPS."

### DAY 2 — "THE LEDGER" *(96 hours remaining, dusk)*

**Goal:** reach the person who can read the ledger.

- **2.1 Neon Alley** (Bazaar). Kaif finds Zoya before the syndicate does; a rooftop-and-alley fight to get her out.
- **2.2 The Turmeric Warehouse** (Bazaar interior). A smoke-and-spice reduced-visibility shootout to retrieve the full ledger (no freeze; visibility is the mechanic). **Clue:** the full ledger names an account paid from inside RAW, and Zoya's father as the signature.

**Quiet Hour dots:** RAW money + Rahimi's signature + Zoya's fear = *her father is being built as the bomber, and someone in RAW is paying for it.* **Stamp:** "WHO PAYS?"

### DAY 3 — "THE SHAPE OF IT" *(72 hours remaining, day)*

**Goal:** find the device and learn the plan.

- **3.1 The Engineer** (Bazaar interior). Meet Dr. Rahimi in hiding. He admits he built a remote trigger without knowing its purpose. Tension scene plus a short fight when the syndicate arrives.
- **3.2 The Empty Container** (Warehouse District, daylight). A raid on the yard where the container was. The shielded container is empty; the device left two days ago by freight. **Clue:** a shipping slip to a tier-1 city.

**Quiet Hour dots (the big one, the centerpiece):** every card from Days 1 to 3 links. Container code, Surkh Data, the countdown, the RAW payments, the trigger, the shipping slip. The strings snap into one picture: **a radiological bomb, already in transit to a tier-1 city (Mumbai), triggered from the Server Center, at D-day.** Kaif also notices something that does not fit: only his handler knew he was at the Warehouse District that morning, and the syndicate was waiting. **Stamp:** "THE TARGET IS KNOWN." End of Day 3.

### DAY 4 — "THE LONGEST NIGHT" *(48 hours remaining, 8 pm to dawn)*

**Goal:** infiltrate the Server Center perimeter, find how the trigger works, and learn who the traitor is. **This entire day is played at night.**

- **4.1 Rain on Containers** (Warehouse District, night). Floodlight grid, rain masks footsteps, patrols carry torches. Cutting a breaker darkens a zone; enemies investigate sound. Stealth-forward, but every area has a loud option. **Clue:** a driver's log pointing to the Server Center's lower dock.
- **4.2 Shift Change** (rooftop). The one breather. No combat. Kaif and Rehman wait for the guards to rotate. Dialogue, a choice (share the watch or take it alone), and a short character moment. Optional pickup: a family photo Kaif has kept for twelve years.
- **4.3 Black Glass** (Server Center, F1 to F2, night). The first real server floors: blue-black glass, cables, red strobes if the alarm trips. Kaif reaches a monitoring room and learns the trigger needs a **physical key**, held by Sarraf. In his ear, Mehra says where Kaif is standing, a place Kaif never reported. Kaif muffles the earpiece.

**Quiet Hour (dawn, on a rooftop, not the safehouse):** Rehman wounded but alive. The strings: Mehra's wrong position + RAW payments + the key = *the traitor is the handler, the boss holds the key, the boss will be in the Server Center.* **Stamp:** "ONE KEY. ONE MAN." End of Day 4.

### DAY 5 — "D-DAY" *(24 hours remaining, dawn into evening)*

**Goal:** stop it and kill the boss.

- **5.1 Top Down** (Server Center, F4 to F3). Kaif drops in from the roof. A floor-by-floor fight with armored troopers, vents, gantries and balustrades. Mehra's voice is gone from the earpiece: absence as design.
- **5.2 Saarang** (Server Center, F2 atrium). A real combat boss. Phase 1: flanking gunfight across the atrium. Phase 2: close-quarters when he closes in. He fights as Kaif would, so the player faces their own toolkit.
- **5.3 The Key** (Server Center, F1 core). Sarraf at the master console, with a **real-time countdown** on screen (the only real-time clock in the game). Kill him, take the key, abort the trigger. Final gunfight with his last guards.
- **Epilogue: The Pier** (Port, dawn). Kaif drops the Alvi watch into the sea. The burner rings. Zoya: *"So what do we call you now?"*

---

## 7. Combat Rules (for the build)

- Everything runs at normal speed. No time scaling.
- Cover, aim, reload timing, enemy awareness (? then !).
- Enemies have vision cones, hearing and radio; a downed enemy found raises the Cover Meter.
- Stealth is rewarded but never forced; every room has a loud option.
- Day 4 night rules: light and dark zones, rain masks sound, breakers cut lights, torches reveal the player.
- Keep the existing visual overhaul (armor, tracers, haze, glitch badges) and Low/High scaling.

---

## 8. Build Order

1. Day 1 only: chapters 1.1 to 1.3 plus the first Quiet Hour. This proves the loop.
2. Day 4 night chapters next, because they test the hardest feel (lighting, stealth).
3. Day 5 server floors (F4 to F1) reuse the existing prototype.
4. Days 2 and 3 fill in after the loop works.

Next step: break each chapter into its own one-page script (beats, enemy placement, objectives and dialogue lines).
