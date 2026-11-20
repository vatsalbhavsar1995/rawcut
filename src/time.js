export function createTimeState() {
  return {
    ts: 0.03,
    lookV: 0,
    lookAcc: 0,
    fireBoost: 0,
    killT: 0,
    tsec: 0,
  };
}

export function resetTime(t) {
  t.ts = 0.03;
  t.lookV = 0;
  t.lookAcc = 0;
  t.fireBoost = 0;
  t.killT = 0;
  t.tsec = 0;
}

export function addLookDelta(t, amount) {
  t.lookAcc += amount;
}

export function triggerFireBoost(t) {
  t.fireBoost = 0.12;
}

export function triggerKillSlowmo(t) {
  t.killT = 0.75;
}

export function stepTime(t, dt, speedNorm) {
  t.lookV += (t.lookAcc / Math.max(dt, 0.001) - t.lookV) * Math.min(1, dt * 8);
  t.lookAcc = 0;
  t.ts += (0.03 + 0.97 * Math.max(speedNorm, Math.min(0.6, t.lookV / 4)) - t.ts) * Math.min(1, dt * 10);
  if (t.fireBoost > 0) {
    t.ts = Math.max(t.ts, 0.4);
    t.fireBoost -= dt;
  }
  if (t.killT > 0) {
    t.ts = Math.min(t.ts, 0.1);
    t.killT -= dt;
  }
  t.tsec += dt;
  return dt * t.ts;
}
