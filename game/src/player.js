// The player: Wulan, the museum intern. WASD/arrows to walk, Shift to
// sneak (slower and quieter, detection fills half as fast), E to pick up a
// relic, click or Q to toss a coin that clinks and lures a guard. Movement
// collides with walls, cases and crates as a circle.
import {
  COINS_PER_LEVEL,
  COIN_THROW_RANGE,
  COIN_TRAVEL_TIME,
  PICKUP_RANGE,
  PLAYER_RADIUS,
  PLAYER_SNEAK_SPEED,
  PLAYER_WALK_SPEED,
} from './config.js';

export function createPlayer(x, y) {
  return {
    x,
    y,
    radius: PLAYER_RADIUS,
    angle: -Math.PI / 2,
    sneaking: false,
    moving: false,
    coins: COINS_PER_LEVEL,
    stepPhase: 0,
    // A thrown coin in flight: null, or {fromX, fromY, x, y, t}.
    coin: null,
  };
}

function circleHitsRect(x, y, radius, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < radius * radius;
}

function blockedAt(x, y, radius, blockers) {
  for (const rect of blockers) {
    if (circleHitsRect(x, y, radius, rect)) return true;
  }
  return false;
}

// Move one fixed step. Axis-separated so the player slides along walls.
export function stepPlayer(player, moveX, moveY, sneaking, blockers, dt) {
  player.sneaking = sneaking;
  const len = Math.hypot(moveX, moveY);
  player.moving = len > 0.01;
  if (!player.moving) return;
  const speed = sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  const nx = (moveX / len) * speed * dt;
  const ny = (moveY / len) * speed * dt;
  player.angle = Math.atan2(moveY, moveX);
  if (!blockedAt(player.x + nx, player.y, player.radius, blockers)) player.x += nx;
  if (!blockedAt(player.x, player.y + ny, player.radius, blockers)) player.y += ny;
  player.stepPhase += dt * (sneaking ? 5 : 9);
}

// Start a coin toss toward (tx, ty), clamped to throwing range.
export function throwCoin(player, tx, ty) {
  if (player.coins <= 0 || player.coin) return false;
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  const reach = Math.min(dist, COIN_THROW_RANGE);
  const ux = dist > 0 ? dx / dist : 1;
  const uy = dist > 0 ? dy / dist : 0;
  player.coins -= 1;
  player.coin = {
    fromX: player.x,
    fromY: player.y,
    x: player.x + ux * reach,
    y: player.y + uy * reach,
    t: 0,
    duration: COIN_TRAVEL_TIME,
  };
  return true;
}

// Advance a thrown coin; returns 'landed' on the step it touches down.
export function stepCoin(player, dt) {
  if (!player.coin) return null;
  player.coin.t += dt;
  if (player.coin.t >= player.coin.duration) {
    const landed = { x: player.coin.x, y: player.coin.y };
    player.coin = null;
    return landed;
  }
  return null;
}

export function coinDrawPosition(player) {
  if (!player.coin) return null;
  const k = Math.min(1, player.coin.t / player.coin.duration);
  // Arc: rises then falls, so the toss reads as a throw, not a slide.
  const hop = Math.sin(k * Math.PI) * 26;
  return {
    x: player.coin.fromX + (player.coin.x - player.coin.fromX) * k,
    y: player.coin.fromY + (player.coin.y - player.coin.fromY) * k - hop,
  };
}

// The nearest uncollected relic within pickup range, or null.
export function nearRelic(player, relics) {
  for (let i = 0; i < relics.length; i++) {
    if (relics[i].taken) continue;
    if (Math.hypot(relics[i].x - player.x, relics[i].y - player.y) <= PICKUP_RANGE) return i;
  }
  return null;
}
