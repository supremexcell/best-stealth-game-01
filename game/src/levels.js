// The three galleries Wulan must cross. Each level is plain data: the
// walls, display cases and crates that block sight and movement, the dark
// floor patches that slow detection, the relic and exit spots, the player
// start, and each guard's patrol loop. Nothing here moves — guards.js and
// game.js do that. Patrol segments are drawn to never cross a blocker, so a
// guard walking a straight line between waypoints never clips a wall.
import { FIELD_H, FIELD_W } from './config.js';

const BORDER = 24;

function borderWalls() {
  return [
    { x: 0, y: 0, w: FIELD_W, h: BORDER },
    { x: 0, y: FIELD_H - BORDER, w: FIELD_W, h: BORDER },
    { x: 0, y: 0, w: BORDER, h: FIELD_H },
    { x: FIELD_W - BORDER, y: 0, w: BORDER, h: FIELD_H },
  ];
}

function guard(waypoints, sweeper = false) {
  return { waypoints, sweeper };
}

export const LEVELS = [
  {
    name: 'Galeri Senja',
    subtitle: 'Malam pertama — dua penjaga, rute yang mudah dibaca',
    parTime: 150,
    start: { x: 80, y: 640 },
    exit: { x: 1208, y: 648 },
    relics: [
      { x: 640, y: 100 },
      { x: 1160, y: 140 },
      { x: 1180, y: 600 },
    ],
    walls: [
      ...borderWalls(),
      { x: 420, y: 24, w: 28, h: 200 },
      { x: 700, y: 420, w: 300, h: 28 },
      { x: 980, y: 448, w: 28, h: 248 },
    ],
    cases: [
      { x: 180, y: 300, w: 76, h: 48 },
      { x: 700, y: 110, w: 76, h: 48 },
      { x: 760, y: 240, w: 76, h: 48 },
      { x: 1120, y: 300, w: 76, h: 48 },
    ],
    crates: [
      { x: 520, y: 560, w: 56, h: 56 },
      { x: 1080, y: 540, w: 56, h: 56 },
    ],
    shadows: [
      { x: 120, y: 440, w: 190, h: 130 },
      { x: 660, y: 520, w: 210, h: 110 },
      { x: 1060, y: 60, w: 140, h: 110 },
    ],
    guards: [
      guard([
        { x: 280, y: 120 },
        { x: 280, y: 500 },
        { x: 620, y: 500 },
        { x: 620, y: 120 },
      ]),
      guard([
        { x: 900, y: 120 },
        { x: 1100, y: 120 },
        { x: 1100, y: 400 },
        { x: 900, y: 400 },
      ]),
    ],
  },
  {
    name: 'Aula Pusaka',
    subtitle: 'Tiga penjaga — lebih banyak etalase, patroli lebih panjang',
    parTime: 180,
    start: { x: 80, y: 640 },
    exit: { x: 80, y: 80 },
    relics: [
      { x: 700, y: 80 },
      { x: 1180, y: 110 },
      { x: 1180, y: 620 },
    ],
    walls: [
      ...borderWalls(),
      { x: 360, y: 24, w: 28, h: 240 },
      { x: 480, y: 360, w: 340, h: 28 },
      { x: 900, y: 360, w: 28, h: 336 },
      { x: 900, y: 180, w: 280, h: 28 },
    ],
    cases: [
      { x: 100, y: 140, w: 76, h: 48 },
      { x: 560, y: 60, w: 76, h: 48 },
      { x: 700, y: 500, w: 76, h: 48 },
      { x: 1080, y: 420, w: 76, h: 48 },
      { x: 240, y: 520, w: 76, h: 48 },
    ],
    crates: [
      { x: 480, y: 560, w: 56, h: 56 },
      { x: 1020, y: 80, w: 56, h: 56 },
      { x: 640, y: 240, w: 56, h: 56 },
    ],
    shadows: [
      { x: 100, y: 380, w: 200, h: 120 },
      { x: 500, y: 440, w: 180, h: 110 },
      { x: 980, y: 240, w: 170, h: 110 },
      { x: 1120, y: 560, w: 120, h: 110 },
    ],
    guards: [
      guard([
        { x: 200, y: 140 },
        { x: 200, y: 500 },
        { x: 420, y: 500 },
        { x: 420, y: 140 },
      ]),
      guard([
        { x: 600, y: 140 },
        { x: 600, y: 320 },
        { x: 840, y: 320 },
        { x: 840, y: 140 },
      ]),
      guard([
        { x: 1000, y: 260 },
        { x: 1000, y: 620 },
        { x: 1180, y: 620 },
        { x: 1180, y: 260 },
      ]),
    ],
  },
  {
    name: 'Taman Atap',
    subtitle: 'Empat penjaga — termasuk penyapu cepat dengan kerucut lebar',
    parTime: 210,
    start: { x: 80, y: 640 },
    exit: { x: 80, y: 80 },
    relics: [
      { x: 640, y: 80 },
      { x: 1180, y: 120 },
      { x: 1180, y: 620 },
    ],
    walls: [
      ...borderWalls(),
      { x: 300, y: 24, w: 28, h: 220 },
      { x: 420, y: 300, w: 380, h: 28 },
      { x: 860, y: 420, w: 28, h: 276 },
      { x: 560, y: 560, w: 220, h: 28 },
      { x: 1040, y: 160, w: 28, h: 120 },
    ],
    cases: [
      { x: 80, y: 120, w: 76, h: 48 },
      { x: 560, y: 140, w: 76, h: 48 },
      { x: 980, y: 300, w: 76, h: 48 },
      { x: 1160, y: 420, w: 76, h: 48 },
      { x: 180, y: 560, w: 76, h: 48 },
      { x: 900, y: 600, w: 76, h: 48 },
    ],
    crates: [
      { x: 400, y: 420, w: 56, h: 56 },
      { x: 1080, y: 560, w: 56, h: 56 },
    ],
    shadows: [
      { x: 100, y: 300, w: 180, h: 120 },
      { x: 420, y: 560, w: 190, h: 110 },
      { x: 900, y: 80, w: 170, h: 110 },
      { x: 1120, y: 440, w: 120, h: 110 },
    ],
    guards: [
      guard([
        { x: 180, y: 120 },
        { x: 180, y: 480 },
        { x: 360, y: 480 },
        { x: 360, y: 120 },
      ]),
      guard([
        { x: 520, y: 120 },
        { x: 520, y: 260 },
        { x: 780, y: 260 },
        { x: 780, y: 120 },
      ]),
      guard([
        { x: 940, y: 120 },
        { x: 940, y: 380 },
        { x: 1180, y: 380 },
        { x: 1180, y: 120 },
      ]),
      guard(
        [
          { x: 480, y: 640 },
          { x: 820, y: 640 },
          { x: 820, y: 480 },
          { x: 480, y: 480 },
        ],
        true,
      ),
    ],
  },
];

// Everything that blocks sight and movement in a level.
export function levelBlockers(level) {
  return [...level.walls, ...level.cases, ...level.crates];
}
