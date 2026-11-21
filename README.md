# Galeri Senja — a stealth game

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/supremexcell/best-stealth-game-01/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/supremexcell/best-stealth-game-01/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

![make.fun](https://img.shields.io/badge/make.fun-best--stealth--game-gold)
![offline](https://img.shields.io/badge/offline-static%20files-green)
![license](https://img.shields.io/badge/license-MIT-blue)

Built for the [make.fun "Make the best stealth game" bounty](https://make.fun/bounty/best-stealth-game-20261121-1759) — $50 in USDC. Play it with Vicko's referral code `bj2pae9c` at [make.fun](https://make.fun).

Wulan, a museum intern, is locked in after closing. In each of three
galleries she must collect **3 Starlight Relics** and reach the **exit** —
unseen by the night guards. A guard's vision cone is drawn on the floor;
step into it and the detection meter fills. Sneak, hide behind display
cases and crates, wait in the dark shadow patches, or toss a coin to lure
a guard away. Get caught three times and the night is over.

## How to play

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak — slower, quieter, detection fills half as fast |
| Click / Q | Throw a coin (3 per level) — the clink lures the nearest guard |
| E | Pick up a relic when close |
| P / Esc | Pause |
| R | Restart the level |
| M | Mute |

Guards patrol, pause at corners to look around, get suspicious (`?`) at
a glimpse or a coin clink, and chase (`!`) when the meter fills. A full
meter costs the **ghost bonus (+500)** for the level; finishing inside
the par time adds a time bonus. Best score is kept in localStorage.

## Levels

1. **Galeri Senja** — 2 guards, gentle patrols (par 2:30)
2. **Aula Pusaka** — 3 guards, more cover, longer patrols (par 3:00)
3. **Taman Atap** — 4 guards, including a faster "sweeper" with a wider cone (par 3:30)

## Run it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open the page in desktop Chrome. Everything is static files under
`game/` — all art is drawn procedurally in canvas 2D and all sounds are
synthesised in code (WebAudio). No network requests, no external assets.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.
