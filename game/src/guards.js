// The guard state machine: patrol -> suspicious -> alerted -> search ->
// return to patrol. A guard walks its waypoint loop, pauses at each corner
// to look around, and reacts to what it sees or hears. Detection is a
// per-guard meter: it fills while the player is visible in the cone, drains
// while hidden, and a full meter flips the guard to alerted (chase).
import {
  ALERT_CHASE_TIME,
  CONE_HALF_ANGLE,
  CONE_RANGE,
  DETECT_CLOSE_RATE,
  DETECT_DRAIN_RATE,
  DETECT_FAR_RATE,
  GUARD_CHASE_SPEED,
  GUARD_PATROL_SPEED,
  GUARD_RADIUS,
  GUARD_SWEEPER_SPEED,
  SEARCH_TIME,
  SHADOW_DETECT_FACTOR,
  SNEAK_DETECT_FACTOR,
  SWEEPER_CONE_HALF_ANGLE,
  SWEEPER_CONE_RANGE,
  WAYPOINT_PAUSE,
} from './config.js';
import { hasLineOfSight, insideCone } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_ALERTED = 'alerted';
export const GUARD_SEARCH = 'search';
export const GUARD_RETURN = 'return';

export function createGuard(def, index) {
  const first = def.waypoints[0];
  return {
    index,
    x: first.x,
    y: first.y,
    angle: 0,
    state: GUARD_PATROL,
    waypointIndex: 1,
    pauseTimer: 0,
    detection: 0,
    chaseTimer: 0,
    searchTimer: 0,
    investigateX: 0,
    investigateY: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    sweeper: def.sweeper,
    patrolSpeed: def.sweeper ? GUARD_SWEEPER_SPEED : GUARD_PATROL_SPEED,
    range: def.sweeper ? SWEEPER_CONE_RANGE : CONE_RANGE,
    halfAngle: def.sweeper ? SWEEPER_CONE_HALF_ANGLE : CONE_HALF_ANGLE,
    stepPhase: index * 1.7,
  };
}

function turnToward(guard, targetAngle, dt, rate = 6) {
  let diff = targetAngle - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxTurn = rate * dt;
  guard.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

// A coin clink (or any loud noise) pulls the nearest guard to look.
export function guardHearNoise(guard, x, y) {
  if (guard.state === GUARD_ALERTED) return;
  guard.state = GUARD_SUSPICIOUS;
  guard.investigateX = x;
  guard.investigateY = y;
}

// One fixed step of one guard. `senses` carries what the guard can know:
// whether the player is visible to it right now, how far away, whether the
// player is sneaking, and whether the player stands in a shadow patch.
// Returns 'caught' when the guard touches the player, else null.
export function stepGuard(guard, waypoints, senses, dt) {
  const { playerVisible, playerDist, playerSneaking, playerInShadow } = senses;

  // --- detection meter: fills in the cone, drains out of it ---
  if (playerVisible) {
    const closeness = 1 - Math.min(1, playerDist / guard.range);
    let rate = DETECT_FAR_RATE + (DETECT_CLOSE_RATE - DETECT_FAR_RATE) * closeness;
    if (playerSneaking) rate *= SNEAK_DETECT_FACTOR;
    if (playerInShadow) rate *= SHADOW_DETECT_FACTOR;
    guard.detection = Math.min(100, guard.detection + rate * dt);
    guard.lastSeenX = senses.playerX;
    guard.lastSeenY = senses.playerY;
  } else {
    guard.detection = Math.max(0, guard.detection - DETECT_DRAIN_RATE * dt);
  }

  // A glimpse (half meter) already makes a guard curious.
  if (guard.detection >= 50 && guard.state === GUARD_PATROL) {
    guard.state = GUARD_SUSPICIOUS;
    guard.investigateX = senses.playerX;
    guard.investigateY = senses.playerY;
  }
  // A full meter is an alarm: chase the last seen spot.
  if (guard.detection >= 100 && guard.state !== GUARD_ALERTED) {
    guard.state = GUARD_ALERTED;
    guard.chaseTimer = ALERT_CHASE_TIME;
  }

  switch (guard.state) {
    case GUARD_PATROL: {
      if (guard.pauseTimer > 0) {
        guard.pauseTimer -= dt;
        // Look around while waiting at the corner.
        guard.angle += dt * 1.4;
        break;
      }
      const target = waypoints[guard.waypointIndex];
      if (moveToward(guard, target.x, target.y, guard.patrolSpeed, dt)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % waypoints.length;
        guard.pauseTimer = WAYPOINT_PAUSE;
      }
      break;
    }
    case GUARD_SUSPICIOUS: {
      if (moveToward(guard, guard.investigateX, guard.investigateY, guard.patrolSpeed * 1.25, dt)) {
        guard.searchTimer = SEARCH_TIME;
        guard.state = GUARD_SEARCH;
      }
      break;
    }
    case GUARD_ALERTED: {
      guard.chaseTimer -= dt;
      // Chase where the player was last seen; if the player is visible
      // right now, chase the live position instead.
      const tx = playerVisible ? senses.playerX : guard.lastSeenX;
      const ty = playerVisible ? senses.playerY : guard.lastSeenY;
      moveToward(guard, tx, ty, GUARD_CHASE_SPEED, dt);
      if (guard.chaseTimer <= 0) {
        guard.state = GUARD_SEARCH;
        guard.searchTimer = SEARCH_TIME;
      }
      break;
    }
    case GUARD_SEARCH: {
      guard.searchTimer -= dt;
      guard.angle += dt * 2.2; // scan the area
      if (guard.searchTimer <= 0) {
        guard.state = GUARD_RETURN;
      }
      break;
    }
    case GUARD_RETURN: {
      // Walk back to the nearest waypoint, then resume the patrol.
      let nearest = 0;
      let nearestDist = Infinity;
      waypoints.forEach((wp, i) => {
        const d = Math.hypot(wp.x - guard.x, wp.y - guard.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }
      });
      const target = waypoints[nearest];
      if (moveToward(guard, target.x, target.y, guard.patrolSpeed, dt)) {
        guard.waypointIndex = (nearest + 1) % waypoints.length;
        guard.state = GUARD_PATROL;
        guard.detection = 0;
      }
      break;
    }
    default:
      break;
  }

  guard.stepPhase += dt * (guard.state === GUARD_ALERTED ? 9 : 5);
  const caught = Math.hypot(senses.playerX - guard.x, senses.playerY - guard.y) < GUARD_RADIUS + 13;
  return caught ? 'caught' : null;
}

// What this guard can sense about the player right now.
export function guardSenses(guard, player, blockers) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const visible = insideCone(player.x, player.y, guard.x, guard.y, guard.angle, guard.range, guard.halfAngle, blockers);
  return {
    playerVisible: visible,
    playerDist: dist,
    playerSneaking: player.sneaking,
    playerInShadow: player.inShadow,
    playerX: player.x,
    playerY: player.y,
  };
}

export function guardCanSee(guard, x, y, blockers) {
  return insideCone(x, y, guard.x, guard.y, guard.angle, guard.range, guard.halfAngle, blockers);
}

export function guardHasLineOfSight(guard, x, y, blockers) {
  return hasLineOfSight(guard.x, guard.y, x, y, blockers);
}
