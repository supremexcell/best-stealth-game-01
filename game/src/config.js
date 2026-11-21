// Tuning numbers and the dusk palette for Galeri Senja.
// Every magic number the game balances on lives here, so a tweak never
// means hunting through the movement or guard code.
export const FIELD_W = 1280;
export const FIELD_H = 720;
export const STEP = 1 / 60;

export const PLAYER_RADIUS = 14;
export const PLAYER_WALK_SPEED = 150;
export const PLAYER_SNEAK_SPEED = 82;
export const GUARD_RADIUS = 15;
export const GUARD_PATROL_SPEED = 58;
export const GUARD_CHASE_SPEED = 112;
export const GUARD_SWEEPER_SPEED = 78;

export const CONE_RANGE = 220;
export const CONE_HALF_ANGLE = (35 * Math.PI) / 180;
export const SWEEPER_CONE_RANGE = 265;
export const SWEEPER_CONE_HALF_ANGLE = (40 * Math.PI) / 180;

export const DETECT_CLOSE_RATE = 58; // per second, player ~50px away
export const DETECT_FAR_RATE = 13; // per second, at the cone's edge
export const DETECT_DRAIN_RATE = 32; // per second while unseen
export const SNEAK_DETECT_FACTOR = 0.5;
export const SHADOW_DETECT_FACTOR = 0.45;
export const ALERT_CHASE_TIME = 5; // seconds a guard chases before searching
export const SEARCH_TIME = 3;
export const WAYPOINT_PAUSE = 1.1;

export const COINS_PER_LEVEL = 3;
export const COIN_THROW_RANGE = 280;
export const COIN_LURE_RADIUS = 380;
export const COIN_TRAVEL_TIME = 0.45;
export const PICKUP_RANGE = 34;
export const EXIT_RANGE = 40;
export const CATCH_RANGE = 27;
export const NERVE_START = 3;

export const SCORE_RELIC = 100;
export const SCORE_GHOST = 500;
export const SCORE_TIME_PER_SECOND = 5;

export const BEST_KEY = 'galeri-senja-best';

// Dusk palette: warm gallery floor, deep blue-violet night, gold relics.
export const PALETTE = {
  floorA: '#8a6a4b',
  floorB: '#7d5f42',
  floorLine: '#6b5138',
  wall: '#3a2f4a',
  wallTop: '#4c3e61',
  caseGlass: '#9fb7c9',
  caseGold: '#d9a441',
  shadow: 'rgba(18, 16, 38, 0.55)',
  exit: '#3fae6a',
  exitGlow: '#7be2a0',
  relic: '#ffd75e',
  relicGlow: 'rgba(255, 215, 94, 0.35)',
  player: '#f2e6c9',
  playerCoat: '#2e6f8e',
  guard: '#c94f4f',
  guardDark: '#8e2f2f',
  cone: 'rgba(255, 214, 110, 0.20)',
  coneEdge: 'rgba(255, 214, 110, 0.45)',
  coneAlert: 'rgba(255, 84, 84, 0.28)',
  hudBg: 'rgba(20, 16, 34, 0.78)',
  hudText: '#f5ead2',
  hudGold: '#ffd75e',
  danger: '#ff5a5a',
  ink: '#efe3c8',
};
