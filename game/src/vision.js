// Line of sight and vision-cone geometry. Walls, crates and display cases
// are all axis-aligned rectangles; a sight line is blocked when it crosses
// any of them. Nothing here knows about guards or the player — it only
// answers "can this point see that point" and "is that point inside this cone".
export function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentHitsRect(ax, ay, bx, by, rect) {
  if (ax >= rect.x && ax <= rect.x + rect.w && ay >= rect.y && ay <= rect.y + rect.h) return true;
  if (bx >= rect.x && bx <= rect.x + rect.w && by >= rect.y && by <= rect.y + rect.h) return true;
  const x2 = rect.x + rect.w;
  const y2 = rect.y + rect.h;
  return (
    segmentsCross(ax, ay, bx, by, rect.x, rect.y, x2, rect.y) ||
    segmentsCross(ax, ay, bx, by, x2, rect.y, x2, y2) ||
    segmentsCross(ax, ay, bx, by, x2, y2, rect.x, y2) ||
    segmentsCross(ax, ay, bx, by, rect.x, y2, rect.x, rect.y)
  );
}

// True when nothing between (ax, ay) and (bx, by) blocks the view.
export function hasLineOfSight(ax, ay, bx, by, blockers) {
  for (const rect of blockers) {
    if (segmentHitsRect(ax, ay, bx, by, rect)) return false;
  }
  return true;
}

// True when (px, py) sits inside a cone of the given range and half-angle
// from (ox, oy) facing `angle`, and the sight line is clear.
export function insideCone(px, py, ox, oy, angle, range, halfAngle, blockers) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  const toTarget = Math.atan2(dy, dx);
  let diff = toTarget - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  return hasLineOfSight(ox, oy, px, py, blockers);
}

// Points of the cone's outline for drawing: arc samples, clipped at the
// first blocker by marching each ray and stopping at the wall it hits.
export function coneOutline(ox, oy, angle, range, halfAngle, blockers, samples = 26) {
  const points = [{ x: ox, y: oy }];
  for (let i = 0; i <= samples; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / samples;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let reach = range;
    // March out in small steps; the first blocker hit shortens the ray.
    for (let d = 8; d <= range; d += 8) {
      const x = ox + dx * d;
      const y = oy + dy * d;
      let blocked = false;
      for (const rect of blockers) {
        if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        reach = d;
        break;
      }
    }
    points.push({ x: ox + dx * reach, y: oy + dy * reach });
  }
  return points;
}
