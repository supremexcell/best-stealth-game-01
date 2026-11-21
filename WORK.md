# WORK.md — Galeri Senja

Stealth-game entry for `best-stealth-game-20261121-1759`
($50, 10 places, deadline Sun 22 Nov 2026 12:59 WIB). Built in this
session, in the builder's own words, from the kit's starter layout only
(the starter is a Block Dodger; no game code was copied from it).

## The game

Wulan, a museum intern locked in after closing, must collect 3
Starlight Relics in each of three galleries and reach the exit, unseen
by the night guards. Top-down 2D canvas, 1280×720, fixed 1/60 s steps,
seeded RNG (`?seed=N`). All art is drawn procedurally in canvas 2D,
all sounds are synthesised in code (WebAudio); no network, no external
assets, no copied names/art/music.

- **Levels:** 1) Galeri Senja (2 guards, gentle), 2) Aula Pusaka
  (3 guards, more cover, longer patrols), 3) Taman Atap (4 guards,
  incl. a faster "sweeper" with a wider cone).
- **Guards:** waypoint patrols with a pause-and-look at each corner;
  vision cones (~70°, ~220 px) drawn on the floor and clipped by
  walls/cases/crates via ray-marched line of sight. States: patrol →
  suspicious (`?`, a glimpse or a coin clink — walks to investigate) →
  alerted (`!`, detection meter full — chases the last known spot ~5 s)
  → search → return to patrol.
- **Detection:** a per-guard 0–100 meter that fills in the cone
  (faster up close), drains when hidden; sneaking halves the fill rate
  and standing in a dark shadow patch multiplies it by 0.45. A full
  meter costs the level's ghost bonus.
- **Player:** WASD/arrows, Shift to sneak, click (or Q) to throw a coin
  (3 per level — the clink lures the nearest guard to the landing
  spot), E to pick up a relic, P/Esc pause, M mute, R restart level.
  Caught = lose 1 of 3 nerve and respawn at the level start; 3 catches
  = "Malam berakhir" game over.
- **Scoring:** +100 per relic, time bonus vs par, +500 ghost bonus for
  never being fully detected in a level. Best score in localStorage.
- **Screens:** title (how-to), play, paused, level complete (score
  breakdown), caught, game over, win ("Fajar menyingsing" + final
  score). Footstep ticks (louder when running), coin clink, pickup
  chime, alert sting, quiet ambient pad; M mutes.

## Files (one clear job each)

- `main.ts` — hand-in program: copies game/ + screenshots/ to
  MAKEFUN_OUTPUT_DIR (or /output), writes dossier.json via buildDossier.
- `serve.ts` — local static server for game/ (dev convenience).
- `game/index.html` — canvas shell, loads `src/main.js` as a module.
- `game/src/config.js` — tuning numbers + dusk palette.
- `game/src/random.js` — seeded RNG (mulberry32).
- `game/src/levels.js` — the 3 level layouts (walls, cases, crates,
  shadow patches, patrol loops, relic + exit positions).
- `game/src/vision.js` — line-of-sight + cone geometry (ray-marched
  cone outline clipped by blockers).
- `game/src/guards.js` — guard state machine + per-guard detection.
- `game/src/player.js` — movement, sneak, coin throws, pickup.
- `game/src/audio.js` — synthesised WebAudio effects + ambient pad.
- `game/src/render.js` — all canvas drawing (floor, cones, entities,
  HUD, screens).
- `game/src/game.js` — state machine, scoring, timer, nerve, level flow.
- `game/src/input.js` — keyboard + mouse → logical 1280×720 input.
- `game/src/shots.js` — deterministic `?shot=` staging from real game
  state (cover / alert / level3 / win).
- `game/src/main.js` — boot + fixed-step loop + `window.__game` test
  handle (state, teleport, loadLevel).
- `vendor/makefun-game.ts`, `LICENSE` — kit copies, unchanged.
- `shots.mjs` (entry root, not in the repo) — headless-Chrome CDP
  driver: playtest + screenshots + network check. Uses the Playwright
  headless shell (`~/.cache/ms-playwright/chromium_headless_shell-1243/.../chrome-headless-shell`);
  the Muse Browser binary at /opt/meta-chromium/chrome refuses headless
  startup (requires a Hatch WebGL domain policy), and the
  chromium-1255 path from the earlier entry no longer exists.

## Screenshots — how they were staged

Taken with headless Chrome over CDP (`../shots.mjs shots`), driving the
real game served locally and its `?shot=` staging (which builds each
scene through the game's own code, then renders it) — no compositing,
no editing. Captured as JPEG quality 85 straight from CDP (the PNG
captures were 340–357 KiB, over the 256 KiB cap).

- `screenshots/1-cover.jpg` (1280×720, 61 KiB) — level 1 mid-play:
  Wulan sneaking behind a display case, 1 relic collected, a guard's
  cone sweeping past with `?`, exit visible bottom-right.
- `screenshots/2-alert.jpg` (1280×720, 60 KiB) — the alarm moment:
  guard `!` chasing with a red cone, detection meter full/red
  ("TERLIHAT!"), Wulan slipping into a shadow patch.
- `screenshots/3-level3.jpg` (1280×720, 68 KiB) — level 3 vista: four
  guards, several cones at once, relics + exit readable.
- `screenshots/4-win.jpg` (1280×720, 69 KiB) — win screen ("Fajar
  menyingsing"), final score 2140, 3/3 relics, exit open.

All four were viewed in this session and read at a glance: cones,
guards, relics, exit and HUD are all legible.

## Verification (this session, 22 Nov 2026 ~01:15 WIB)

- Play-test via CDP (`node shots.mjs playtest`), **13/13 checks pass**:
  title → start level 1 → WASD moves the player → E picks up a relic
  (score 100) → detection rises inside a cone (0 → 42) → coin throw
  spends a coin and lures a guard to suspicious → all 3 relics, exit
  opens → reaching the exit completes the level → level 2 starts →
  caught costs 1 nerve + caught screen → respawn returns to play →
  P pauses / P resumes. Zero console errors/exceptions.
- Runtime network check (CDP Network domain): 13 requests, all local
  (index + 12 modules); **ZERO external requests**. `grep` over game/:
  no `http(s)://`, no fetch/XHR/Worker/dynamic import.
- `main.ts` run twice to two different dirs: **byte-identical**
  (`diff -r` clean); dossier.json 414,094 bytes (cap 1.5 MiB).
- Sizes: game/ 65,562 bytes, 13 files; game/index.html 845 bytes
  (cap 1 MiB); screenshots 60–69 KiB each (cap 256 KiB).
- `makefun check --worktree`: 4 passed (competition_open, snapshot,
  license_osi, entrypoint); 1 failed — `transcripts_present`, EXPECTED
  (no bundle yet; bundling happens at submit prep, after approval).
  The 5 "at submission" rows (repo public/owner/created-after-open/
  commit/duplicate) are untestable until the GitHub repo exists.

## Not done — needs Vicko's approval first

- **NOT submitted. No GitHub repo created, nothing pushed.** The entry
  is local-only in `repo/` for Vicko to approve.
- Submit prep (after approval): create the GitHub repo (after the
  00:59 WIB opening — this repo dir predates it only as a local folder;
  the GitHub repo must be created fresh), push, bundle transcripts,
  `makefun check --transcripts`, submit before 12:59 WIB.
