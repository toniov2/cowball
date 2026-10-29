/* Cowball v47 physics helpers: small, deterministic, dependency-free primitives. */
(function (global) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

  function moveVelocity(vx, vy, targetX, targetY, dt) {
    dt = clamp(Number(dt) || 1, 0.1, 3);
    const speed = Math.hypot(vx, vy);
    const targetSpeed = Math.hypot(targetX, targetY);
    if (targetSpeed < 0.015) {
      const nextSpeed = Math.max(0, speed - 0.24 * dt);
      if (speed < 0.001 || nextSpeed === 0) return { vx: 0, vy: 0 };
      return { vx: vx * nextSpeed / speed, vy: vy * nextSpeed / speed };
    }

    const targetAngle = Math.atan2(targetY, targetX);
    const currentAngle = speed > 0.06 ? Math.atan2(vy, vx) : targetAngle;
    const delta = wrapAngle(targetAngle - currentAngle);
    const normalizedSpeed = clamp(speed / 2.15, 0, 1);
    const turnRate = 0.15 + (1 - normalizedSpeed) * 0.12;
    const nextAngle = speed > 0.06
      ? currentAngle + clamp(delta, -turnRate * dt, turnRate * dt)
      : targetAngle;

    // A sharp change of direction naturally costs speed, like planting a foot before turning.
    const turnFactor = Math.abs(delta) > 1.75 ? 0.48 : Math.abs(delta) > 1.05 ? 0.72 : 1;
    const desiredSpeed = targetSpeed * turnFactor;
    const rate = desiredSpeed >= speed ? 0.22 : 0.26;
    const nextSpeed = speed + clamp(desiredSpeed - speed, -rate * dt, rate * dt);
    return { vx: Math.cos(nextAngle) * nextSpeed, vy: Math.sin(nextAngle) * nextSpeed };
  }

  function shotLift(charge) {
    const c = clamp(Number(charge) || 0, 0, 1);
    // Tap shots stay low; a charged strike can reach a realistic arc and approach the crossbar.
    return clamp(0.03 + c * 0.175, 0.03, 0.205);
  }

  function isGoalHeightClear(ballHeight, ballRadius, visualScale) {
    const r = Math.max(0, Number(ballRadius) || 0.3);
    const scale = Number.isFinite(visualScale) ? visualScale : 0.92;
    const ballCenterBase = r * scale;
    const barBottom = 2.4 - 0.09;
    return (Number(ballHeight) || 0) + ballCenterBase + r < barBottom;
  }

  function touchesCrossbar(ballHeight, ballRadius, visualScale) {
    const r = Math.max(0, Number(ballRadius) || 0.3);
    const scale = Number.isFinite(visualScale) ? visualScale : 0.92;
    const center = (Number(ballHeight) || 0) + r * scale;
    return Math.abs(center - 2.4) <= r + 0.09;
  }

  global.CowballPhysicsV47 = Object.freeze({ moveVelocity, shotLift, isGoalHeightClear, touchesCrossbar });
})(window);
