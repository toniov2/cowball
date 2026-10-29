/* Cowball v47 AI helpers: lightweight route scoring for open-space dribbling. */
(function (global) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function chooseDribbleHeading(input) {
    if (!input || !Array.isArray(input.opponents)) return null;
    const { x, y, goalX, goalY, left, right, top, bottom } = input;
    const opponents = input.opponents;
    const step = 76;
    const base = Math.atan2(goalY - y, goalX - x);
    const offsets = [0, -0.2, 0.2, -0.42, 0.42, -0.68, 0.68, -0.94, 0.94, -1.2, 1.2];
    let best = null, bestScore = -Infinity;

    for (const off of offsets) {
      const angle = base + off, dx = Math.cos(angle), dy = Math.sin(angle);
      const px = x + dx * step, py = y + dy * step;
      const beforeGoal = Math.hypot(goalX - x, goalY - y);
      const afterGoal = Math.hypot(goalX - px, goalY - py);
      const progress = (beforeGoal - afterGoal) / step;
      let nearest = 999, blocked = false, pressureAhead = 0;
      const stepLength = step;
      for (const o of opponents) {
        if (!o || !Number.isFinite(o.x) || !Number.isFinite(o.y)) continue;
        const distEnd = Math.hypot(o.x - px, o.y - py);
        if (distEnd < nearest) nearest = distEnd;
        const t = clamp(((o.x - x) * dx + (o.y - y) * dy) / stepLength, 0, 1);
        const nearLane = Math.hypot(x + dx * step * t - o.x, y + dy * step * t - o.y);
        if (t > 0.08 && t < 0.98 && nearLane < (o.role === 'gk' ? 20 : 31)) blocked = true;
        if (t > 0.15 && t < 0.8 && nearLane < 55) pressureAhead += (55 - nearLane) / 55;
      }
      let edgePenalty = 0;
      const edge = 34;
      if (py < top + edge) edgePenalty += (top + edge - py) / edge * 0.75;
      if (py > bottom - edge) edgePenalty += (py - (bottom - edge)) / edge * 0.75;
      if (px < left + 25 || px > right - 25) edgePenalty += 0.28;
      const openness = clamp(nearest / 120, 0, 1);
      const score = progress * 1.1 + openness * 0.62 - (blocked ? 1.25 : 0) - Math.min(0.8, pressureAhead * 0.32) - edgePenalty - Math.abs(off) * 0.11;
      if (score > bestScore) { bestScore = score; best = { x: dx, y: dy }; }
    }
    return best;
  }
  global.CowballAIV47 = Object.freeze({ chooseDribbleHeading });
})(window);
