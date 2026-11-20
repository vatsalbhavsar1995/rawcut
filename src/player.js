import * as THREE from 'three';
import { addLookDelta, triggerFireBoost } from './time.js';

export const PSPD = 7.5;
export const P_MIN = (-15 * Math.PI) / 180;
export const P_MAX = (55 * Math.PI) / 180;
export const TURN_R = (600 * Math.PI) / 180;
export const CAP_R = 0.58;
export const CAP_Y0 = 0.45;
export const CAP_Y1 = 2.45;

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 6.2832;
  while (d < -Math.PI) d += 6.2832;
  return d;
}

export function createPersonMesh(coat, skin, hat, foe) {
  const g0 = new THREE.Group();
  const M = (c, e) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, emissive: e || 0 });
  const b = (w, h, d, x, y, z, c, p) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    (p || g0).add(m);
    return m;
  };
  const lL = new THREE.Group();
  const lR = new THREE.Group();
  const aL = new THREE.Group();
  const aR = new THREE.Group();
  lL.position.set(-0.3, 0.95, 0);
  lR.position.set(0.3, 0.95, 0);
  aL.position.set(-0.75, 1.9, 0);
  aR.position.set(0.75, 1.9, 0);
  b(0.42, 0.95, 0.45, 0, -0.47, 0, 0x20252b, lL);
  b(0.42, 0.95, 0.45, 0, -0.47, 0, 0x20252b, lR);
  b(0.32, 0.9, 0.36, 0, -0.45, 0, coat, aL);
  b(0.32, 0.9, 0.36, 0, -0.45, 0, coat, aR);
  g0.add(lL, lR, aL, aR);
  b(1.15, 1, 0.7, 0, 1.45, 0, coat);
  b(1.2, 0.2, 0.75, 0, 0.98, 0, 0x14181c);
  b(0.7, 0.7, 0.7, 0, 2.35, 0, skin);
  b(0.78, 0.3, 0.78, 0, 2.65, 0, hat);
  b(0.1, 0.1, 0.1, -0.18, 2.4, 0.36, 0x111111);
  b(0.1, 0.1, 0.1, 0.18, 2.4, 0.36, 0x111111);
  let wt = null;
  if (foe) {
    b(1.25, 0.8, 0.85, 0, 1.55, 0, 0x1a2026);
    b(0.5, 0.3, 0.1, 0, 1.5, 0.43, 0x2a323a);
    b(0.95, 0.4, 0.95, 0, 2.68, 0, 0x2a3038);
    b(0.74, 0.28, 0.1, 0, 2.2, 0.37, 0x15181c);
    b(0.36, 0.2, 0.4, -0.75, 1.75, 0, 0xb8362f);
    b(0.28, 0.5, 0.1, 0.3, 2.0, 0.4, 0xb8362f);
  } else {
    b(1, 0.28, 0.9, 0, 1.98, 0, 0x2f7d5b);
    b(0.28, 1, 0.12, 0.35, 1.5, -0.45, 0x2f7d5b);
    wt = b(0.4, 0.14, 0.4, 0, -0.85, 0, 0xc9a24a, aL);
  }
  b(0.16, 0.7, 0.22, 0, -1.1, 0, 0x222222, aR);
  b(0.1, 0.4, 0.1, 0, -1.5, 0, 0x111111, aR);
  return { g: g0, lL, lR, aL, aR, wt };
}

export function rayCap(ox, oy, oz, dx, dy, dz, cx, cz, y0, y1, r, minT, maxT) {
  let best = Infinity;
  const rx = ox - cx;
  const rz = oz - cz;
  const a = dx * dx + dz * dz;
  if (a > 1e-8) {
    const b = rx * dx + rz * dz;
    const c = rx * rx + rz * rz - r * r;
    const dc = b * b - a * c;
    if (dc >= 0) {
      const sq = Math.sqrt(dc);
      const t0 = (-b - sq) / a;
      const t1 = (-b + sq) / a;
      if (t1 >= minT) {
        const t = t0 >= minT ? t0 : minT;
        if (t <= maxT) {
          const hy = oy + dy * t;
          if (hy >= y0 && hy <= y1) best = t;
        }
      }
    }
  }
  for (let k = 0; k < 2; k++) {
    const sy = k ? y1 : y0;
    const ry = oy - sy;
    const b = rx * dx + ry * dy + rz * dz;
    const c = rx * rx + ry * ry + rz * rz - r * r;
    const dc = b * b - c;
    if (dc >= 0) {
      const sq = Math.sqrt(dc);
      const t0 = -b - sq;
      const t1 = -b + sq;
      if (t1 >= minT) {
        const t = t0 >= minT ? t0 : minT;
        if (t <= maxT && t < best) best = t;
      }
    }
  }
  return best;
}

export function createPlayerSystem({
  scene,
  cam,
  level,
  cv,
  wrap,
  fb,
  pb,
  ov,
  time,
  settings,
  getState,
  getViewportW,
  getEnemies,
  onShoot,
  onSay,
  onDead,
  onPause,
  onResume,
  onStart,
}) {
  const pp = createPersonMesh(0x3a4a58, 0xe5c9a8, 0x1a1a1f, false);
  const pl = pp.g;
  scene.add(pl);

  const ray = new THREE.Raycaster();
  const ctr = new THREE.Vector2(0, 0);
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const vD = new THREE.Vector3();
  const vE = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const camPiv = new THREE.Vector3();

  const state = {
    x: 0,
    z: 0,
    y: 0,
    fl: 0,
    vel: { x: 0, z: 0 },
    yaw: -Math.PI / 2,
    pit: 0.2,
    bodyY: Math.PI / 2,
    fov: 62,
    armD: 4.5,
    armTgt: 4.5,
    armR: 1,
    mag: 8,
    reload: 0,
    fireCd: 0,
    aimT: 0,
    hp: 3,
    inv: 0,
    hits: 0,
    hitF: 0,
    shake: 0,
    s: 0,
    alarm: false,
    rmb: false,
    lockOK: false,
  };

  let keys = {};
  let joy = null;
  let jo = null;
  let lk = null;
  let md = null;
  let mx = 0;
  let mseen = false;

  function clearInput() {
    keys = {};
    joy = null;
    jo = null;
    lk = null;
    md = null;
    state.rmb = false;
  }

  function reset() {
    const sp = level.data.playerSpawn;
    const flObj = level.floorById.get(sp.floor);
    state.fl = sp.floor;
    state.x = sp.x;
    state.z = sp.z;
    state.y = flObj ? flObj.elevation : 0;
    state.vel.x = 0;
    state.vel.z = 0;
    state.yaw = sp.yaw ?? -Math.PI / 2;
    state.pit = 0.2;
    state.bodyY = state.yaw + Math.PI;
    state.fov = 62;
    state.armD = 4.5;
    state.armTgt = 4.5;
    state.armR = 1;
    state.mag = 8;
    state.reload = 0;
    state.fireCd = 0;
    state.aimT = 0;
    state.hp = 3;
    state.inv = 0;
    state.hits = 0;
    state.hitF = 0;
    state.shake = 0;
    state.s = 0;
    state.alarm = false;
    camPiv.set(state.x, state.y + 2.15, state.z);
    pl.position.set(state.x, state.y, state.z);
    pl.rotation.y = state.bodyY;
    clearInput();
  }

  function snapCamera() {
    cam.position.set(
      state.x + Math.sin(state.yaw) * Math.cos(state.pit) * state.armD + Math.cos(state.yaw) * state.armR,
      state.y + 2.15 + Math.sin(state.pit) * state.armD,
      state.z + Math.cos(state.yaw) * Math.cos(state.pit) * state.armD - Math.sin(state.yaw) * state.armR
    );
    cam.rotation.set(-state.pit, state.yaw, 0, 'YXZ');
  }

  function applyLook(dx, dy, scale) {
    const cy = Math.max(-80, Math.min(80, dx)) * scale * settings.sens;
    const cp = Math.max(-80, Math.min(80, dy)) * scale * settings.sens * (settings.invY ? -1 : 1);
    const ny = state.yaw - cy;
    const np = Math.max(P_MIN, Math.min(P_MAX, state.pit + cp));
    addLookDelta(time, Math.abs(ny - state.yaw) + Math.abs(np - state.pit));
    state.yaw = ny;
    state.pit = np;
  }

  function aimPoint(out) {
    cam.updateMatrixWorld();
    ray.setFromCamera(ctr, cam);
    const ro = ray.ray.origin;
    const rd = ray.ray.direction;
    const minT = Math.max(
      0.5,
      (state.x - ro.x) * rd.x + (state.y + 2.15 - ro.y) * rd.y + (state.z - ro.z) * rd.z + 0.25
    );
    ray.near = minT;
    ray.far = 120;
    const hs = ray.intersectObjects(level.solids, false);
    let best = hs.length ? hs[0].distance : 120;
    for (const q of getEnemies()) {
      if (q.dead) continue;
      const t = rayCap(
        ro.x, ro.y, ro.z,
        rd.x, rd.y, rd.z,
        q.x, q.z,
        q.y + CAP_Y0, q.y + CAP_Y1, CAP_R,
        minT, best
      );
      if (t < best) best = t;
    }
    return out.copy(ro).addScaledVector(rd, best);
  }

  function fire() {
    if (getState() !== 'play' || state.fireCd > 0 || state.reload > 0) return;
    if (state.mag <= 0) {
      state.reload = 1.4;
      onSay('Reloading — keep moving.');
      return;
    }
    state.mag--;
    state.fireCd = 0.2;
    triggerFireBoost(time);
    state.aimT = 1.5;
    state.s = Math.min(1, state.s + 0.08);
    state.shake = Math.max(state.shake, 0.25);

    state.bodyY = state.yaw + Math.PI;
    pl.position.set(state.x, state.y, state.z);
    pl.rotation.y = state.bodyY;
    pp.aL.rotation.x = -1.2;
    pp.aR.rotation.x = -1.57 + state.pit;
    pl.updateMatrixWorld(true);

    const tgt = aimPoint(vA);
    const muz = pp.aR.localToWorld(vB.set(0, -1.5, 0));
    vC.set(state.x, state.y + 1.65, state.z);
    vD.copy(muz).sub(vC);
    const md0 = vD.length();
    if (md0 > 0.01) {
      vD.divideScalar(md0);
      ray.set(vC, vD);
      ray.near = 0;
      ray.far = md0;
      const mh = ray.intersectObjects(level.solids, false);
      if (mh.length) muz.copy(vC).addScaledVector(vD, Math.max(0, mh[0].distance - 0.15));
    }
    vE.copy(tgt).sub(muz);
    if (vE.lengthSq() < 0.25) {
      muz.copy(vC);
      vE.copy(tgt).sub(muz);
    }
    vE.normalize();
    onShoot(muz.x, muz.z, 0, muz.y, state.fl, true, vE);

    for (const q of getEnemies()) {
      if (!q.dead && q.fl === state.fl && Math.hypot(q.x - state.x, q.z - state.z) < 32) {
        q.al = true;
      }
    }
    if (state.mag <= 0) state.reload = 1.4;
  }

  function hurt() {
    state.hp--;
    state.inv = 0.9;
    state.hits++;
    state.hitF = 1;
    state.shake = 1;
    if (state.hp <= 0) onDead();
  }

  function stepInputAndLook(dt) {
    if (keys.arrowleft || keys.q) {
      const d = dt * 2.2;
      state.yaw += d;
      addLookDelta(time, d);
    }
    if (keys.arrowright || keys.e) {
      const d = dt * 2.2;
      state.yaw -= d;
      addLookDelta(time, d);
    }
    if (settings.cm === 'steer' && mseen && !state.lockOK) {
      const W = getViewportW();
      const r = (mx / W - 0.5) * 2;
      const a = Math.abs(r);
      if (a > 0.15) {
        const d = (Math.sign(r) * (a - 0.15)) / 0.85 * 2.3 * dt;
        state.yaw -= d;
        addLookDelta(time, Math.abs(d));
      }
    }
  }

  function stepMove(dt, gd) {
    let ix = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    let iz = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    if (joy) {
      ix = joy.x;
      iz = joy.y;
    }
    let m = Math.hypot(ix, iz);
    if (m > 1) {
      ix /= m;
      iz /= m;
      m = 1;
    }

    state.aimT = Math.max(0, state.aimT - dt);
    state.fireCd -= dt;
    state.inv -= dt;
    state.shake *= Math.max(0, 1 - dt * 5);
    state.hitF = Math.max(0, state.hitF - dt * 2);
    if (state.reload > 0) {
      state.reload -= gd;
      if (state.reload <= 0) state.mag = 8;
    }

    const fx = -Math.sin(state.yaw);
    const fz = -Math.cos(state.yaw);
    const rx = Math.cos(state.yaw);
    const rz = -Math.sin(state.yaw);
    const vx = fx * -iz + rx * ix;
    const vz = fz * -iz + rz * ix;
    const k = 1 - Math.exp(-dt * (m > 0.05 ? 10 : 14));
    state.vel.x += (vx * PSPD - state.vel.x) * k;
    state.vel.z += (vz * PSPD - state.vel.z) * k;

    const prevX = state.x;
    const prevZ = state.z;
    const res = level.resolveMove(state.fl, state.x, state.z, state.vel.x * dt, state.vel.z * dt, 0.5);
    state.x = res.x;
    state.z = res.z;
    if (dt > 1e-4 && res.hit) {
      state.vel.x = (state.x - prevX) / dt;
      state.vel.z = (state.z - prevZ) / dt;
    }

    const samp = level.sampleFloorAndY(state.fl, state.x, state.z);
    state.fl = samp.fl;
    state.y = samp.y;
  }

  function updateVisualsAndCamera(now, dtR) {
    const sp = Math.hypot(state.vel.x, state.vel.z) / PSPD;
    const aiming = state.rmb || state.aimT > 0;

    pl.position.set(state.x, state.y, state.z);
    if (aiming) {
      state.bodyY = state.yaw + Math.PI;
    } else if (Math.hypot(state.vel.x, state.vel.z) > 0.35) {
      const t0 = Math.atan2(state.vel.x, state.vel.z);
      const d = angleDiff(t0, state.bodyY);
      const mxT = TURN_R * dtR;
      state.bodyY += Math.max(-mxT, Math.min(mxT, d));
    }
    pl.rotation.y = state.bodyY;

    const sw = Math.sin(now / 110) * 0.9 * time.ts * Math.min(1, sp * 1.5);
    pp.lL.rotation.x = sw;
    pp.lR.rotation.x = -sw;
    pp.aL.rotation.x = aiming ? -1.2 : -0.2;
    pp.aR.rotation.x = aiming ? -1.57 + state.pit : -0.3;
    pp.wt.material.color.setHSL((45 - 45 * state.s) / 360, 0.75, 0.5);
    pp.wt.material.emissive.setHSL((45 - 45 * state.s) / 360, 0.75, 0.35);
    pl.visible = state.inv <= 0 || Math.floor(now / 80) % 2 === 0;

    const sy = Math.sin(state.yaw);
    const cy0 = Math.cos(state.yaw);
    const cp = Math.cos(state.pit);
    const sp0 = Math.sin(state.pit);
    const rx = cy0;
    const rz = -sy;
    const kp = 1 - Math.exp(-16 * dtR);
    const ka = 1 - Math.exp(-12 * dtR);

    vA.set(state.x, state.y + 2.15, state.z);
    camPiv.lerp(vA, kp);
    state.armTgt += ((aiming ? 2.4 : 4.5) - state.armTgt) * ka;
    state.armR += ((aiming ? 0.85 : 1) - state.armR) * ka;

    vB.set(rx, 0, rz);
    vC.copy(camPiv).addScaledVector(vB, state.armR);
    tmp.copy(vC).sub(vA);
    const shL = tmp.length();
    if (shL > 0.01) {
      tmp.divideScalar(shL);
      ray.set(vA, tmp);
      ray.near = 0;
      ray.far = shL + 0.35;
      const shH = ray.intersectObjects(level.solids, false);
      if (shH.length) vC.copy(vA).addScaledVector(tmp, Math.max(0, shH[0].distance - 0.35));
    }

    vD.set(sy * cp, sp0, cy0 * cp);
    vE.set(-sy * sp0, cp, -cy0 * sp0);
    let clearD = state.armTgt;
    const casts = [
      [0, 0],
      [0.24, 0],
      [-0.24, 0],
      [0, 0.18],
      [0, -0.18],
    ];
    for (let ci = 0; ci < casts.length; ci++) {
      tmp
        .copy(vD)
        .multiplyScalar(state.armTgt)
        .addScaledVector(vB, casts[ci][0])
        .addScaledVector(vE, casts[ci][1]);
      const cl = tmp.length();
      tmp.divideScalar(cl);
      ray.set(vC, tmp);
      ray.near = 0;
      ray.far = cl + 0.35;
      const ch = ray.intersectObjects(level.solids, false);
      if (ch.length) {
        clearD = Math.min(clearD, Math.max(0.4, Math.max(0, ch[0].distance - 0.32) * (state.armTgt / cl)));
      }
    }
    if (clearD < state.armD) state.armD = clearD;
    else state.armD += (clearD - state.armD) * (1 - Math.exp(-8 * dtR));

    const sk = state.shake * 0.35;
    cam.position.copy(vC).addScaledVector(vD, state.armD);
    if (sk > 0.001) {
      cam.position
        .addScaledVector(vB, (Math.random() - 0.5) * sk)
        .addScaledVector(vE, (Math.random() - 0.5) * sk);
    }
    cam.rotation.set(-state.pit, state.yaw, 0, 'YXZ');

    const kz = time.killT > 0 ? Math.min(1, time.killT / 0.75) : 0;
    const tf = (aiming ? 48 : 62) + (aiming ? 2 : 6) * sp - 12 * kz;
    state.fov += (tf - state.fov) * (1 - Math.exp(-10 * dtR));
    if (Math.abs(cam.fov - state.fov) > 0.05) {
      cam.fov = state.fov;
      cam.updateProjectionMatrix();
    }
  }

  // Input listeners
  fb.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    fire();
  });
  document.addEventListener('pointerlockchange', () => {
    const was = state.lockOK;
    state.lockOK = document.pointerLockElement === cv;
    if (state.lockOK) md = null;
    if (was && !state.lockOK && getState() === 'play') onPause();
  });
  document.addEventListener('pointerlockerror', () => {
    state.lockOK = false;
  });
  cv.addEventListener('mousedown', (e) => {
    if (getState() !== 'play') return;
    mseen = true;
    mx = e.clientX;
    if (e.button === 2) {
      state.rmb = true;
      return;
    }
    if (e.button !== 0) return;
    if (state.lockOK) {
      fire();
      return;
    }
    if (settings.cm === 'steer') {
      fire();
      return;
    }
    md = { x: e.clientX, y: e.clientY, moved: false };
    if (settings.cm === 'auto' && cv.requestPointerLock) {
      try {
        const p = cv.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      } catch (_) {}
    }
  });
  addEventListener('mousemove', (e) => {
    mseen = true;
    mx = e.clientX;
    if (getState() !== 'play') return;
    if (state.lockOK) {
      applyLook(e.movementX || 0, e.movementY || 0, 0.0022);
      return;
    }
    if (md) {
      const dx = e.clientX - md.x;
      const dy = e.clientY - md.y;
      if (md.moved || Math.hypot(dx, dy) > 5) {
        md.moved = true;
        applyLook(dx, dy, 0.004);
        md.x = e.clientX;
        md.y = e.clientY;
      }
    }
  });
  addEventListener('mouseup', (e) => {
    if (e.button === 2) state.rmb = false;
    if (e.button === 0 && md) {
      if (!md.moved && !state.lockOK && getState() === 'play') fire();
      md = null;
    }
  });
  addEventListener('blur', clearInput);
  wrap.addEventListener('pointerdown', (e) => {
    if (getState() !== 'play' || e.pointerType !== 'touch' || e.target === ov || e.target === fb || e.target === pb) {
      return;
    }
    if (e.clientX < getViewportW() / 2) {
      if (!jo) {
        jo = { x: e.clientX, y: e.clientY, id: e.pointerId };
        joy = { x: 0, y: 0 };
      }
    } else if (!lk) {
      lk = { x: e.clientX, y: e.clientY, id: e.pointerId };
    }
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch') return;
    if (jo && e.pointerId === jo.id) {
      const dx = (e.clientX - jo.x) / 40;
      const dy = (e.clientY - jo.y) / 40;
      const m = Math.hypot(dx, dy);
      joy = m > 1 ? { x: dx / m, y: dy / m } : { x: dx, y: dy };
    } else if (lk && e.pointerId === lk.id) {
      applyLook(e.clientX - lk.x, e.clientY - lk.y, 0.0045);
      lk.x = e.clientX;
      lk.y = e.clientY;
    }
  });
  const tup = (e) => {
    if (e.pointerType !== 'touch') return;
    if (jo && e.pointerId === jo.id) {
      jo = null;
      joy = null;
    }
    if (lk && e.pointerId === lk.id) lk = null;
  };
  addEventListener('pointerup', tup);
  addEventListener('pointercancel', tup);
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    const st = getState();
    if (e.key === 'Escape' || k === 'p') {
      if (st === 'play') onPause();
      else if (st === 'pause') onResume();
      return;
    }
    if ((st === 'title' || st === 'dead' || st === 'win') && (e.key === 'Enter' || e.key === ' ')) {
      onStart();
      return;
    }
    if (k === ' ' || k === 'f') {
      fire();
      e.preventDefault();
    }
    if (k === 'r' && state.mag < 8 && state.reload <= 0) state.reload = 1.4;
  });
  addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  return {
    state,
    mesh: pl,
    reset,
    clearInput,
    snapCamera,
    fire,
    hurt,
    stepInputAndLook,
    stepMove,
    updateVisualsAndCamera,
  };
}
