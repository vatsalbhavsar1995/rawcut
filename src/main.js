import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import levelData from './levels/impound.json';
import { buildLevel } from './level.js';
import { createTimeState, resetTime, stepTime, triggerKillSlowmo } from './time.js';
import { createPlayerSystem, PSPD, rayCap, CAP_R, CAP_Y0, CAP_Y1 } from './player.js';
import { createEnemySystem } from './enemies.js';
import { createUI } from './ui.js';

const wrap = document.getElementById('w');
const cv = document.getElementById('c');
const hc = document.getElementById('h');
const ov = document.getElementById('ov');
const fb = document.getElementById('fb');
const pb = document.getElementById('pb');

/* ---------- settings ---------- */
const settings = { cm: 'auto', sens: 1, invY: false, lowq: false };
try {
  const j = JSON.parse(localStorage.getItem('rc') || '{}');
  if (j.cm) settings.cm = j.cm;
  if (j.sens) settings.sens = j.sens;
  settings.invY = !!j.invY;
  settings.lowq = !!j.lowq;
} catch (_) {}
function saveSettings() {
  try {
    localStorage.setItem('rc', JSON.stringify(settings));
  } catch (_) {}
}

/* ---------- scene & renderer ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b12);
scene.fog = new THREE.Fog(0x070b12, 42, 160);

const cam = new THREE.PerspectiveCamera(62, 1, 0.1, 320);
cam.rotation.order = 'YXZ';

const hemi = new THREE.HemisphereLight(0x8aa0c0, 0x1a1612, 0.75);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xaec4e8, 0.85);
moon.position.set(-24, 72, 16);
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.near = 10;
moon.shadow.camera.far = 180;
moon.shadow.camera.left = -55;
moon.shadow.camera.right = 55;
moon.shadow.camera.top = 55;
moon.shadow.camera.bottom = -55;
moon.shadow.bias = -0.0008;
scene.add(moon);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.3, 0.82);
composer.addPass(bloomPass);

/* ---------- level & beacon ---------- */
const level = buildLevel(levelData, scene);

const beacon = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 12, 8, 1, true),
  new THREE.MeshBasicMaterial({
    color: 0xd8d2c0,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
);
scene.add(beacon);

const BG = new THREE.BoxGeometry(0.14, 0.14, 1.4);
const BM1 = new THREE.MeshBasicMaterial({ color: 0xffd27a });
const BM2 = new THREE.MeshBasicMaterial({ color: 0xff4a3a });
const ray = new THREE.Raycaster();
const vA = new THREE.Vector3();
const vB = new THREE.Vector3();

/* ---------- game state ---------- */
const time = createTimeState();
let W = 1;
let H = 1;
let dpr = 1;
let st = 'title';
let objIdx = 0;
let bullets = [];
let last = 0;
let dtR = 0.016;

function shoot(x, z, a, y, fl, pf, dir) {
  const m = new THREE.Mesh(BG, pf ? BM1 : BM2);
  const sp = pf ? 60 : 20;
  let bx, by, bz, vx, vy, vz;
  if (dir) {
    bx = x;
    by = y;
    bz = z;
    vx = dir.x * sp;
    vy = dir.y * sp;
    vz = dir.z * sp;
  } else {
    bx = x + Math.cos(a) * 0.9;
    by = y;
    bz = z + Math.sin(a) * 0.9;
    vx = Math.cos(a) * sp;
    vy = 0;
    vz = Math.sin(a) * sp;
  }
  m.position.set(bx, by, bz);
  m.lookAt(bx + vx, by + vy, bz + vz);
  scene.add(m);
  bullets.push({ x: bx, y: by, z: bz, fl, vx, vy, vz, t: 0, pl: pf, m });
}

const enemies = createEnemySystem({
  scene,
  level,
  onShoot: shoot,
  onKill: () => {
    triggerKillSlowmo(time);
    player.state.shake = 0.7;
  },
});

let ui;
const player = createPlayerSystem({
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
  getState: () => st,
  getViewportW: () => W,
  getEnemies: () => enemies.getList(),
  onShoot: shoot,
  onSay: (t) => ui.say(t),
  onDead: () => {
    st = 'dead';
    ui.show('dead');
  },
  onPause: pause,
  onResume: resume,
  onStart: start,
});

ui = createUI({
  hc,
  ov,
  pb,
  level,
  settings,
  onSaveSettings: saveSettings,
  onApplyGraphics: applyGraphics,
  onStart: start,
  onResume: resume,
  onPause: pause,
  onMenu: () => {
    st = 'title';
  },
  getState: () => st,
  getStats: () => ({
    kills: enemies.getKills(),
    total: enemies.getTotal(),
    hits: player.state.hits,
    tsec: time.tsec,
  }),
});

function initGame() {
  resetTime(time);
  player.reset();
  objIdx = 0;
  for (const b of bullets) scene.remove(b.m);
  bullets = [];
  level.resetPickupsAndProps();
  enemies.spawnAll();
  ui.clearToast();
}

function start() {
  initGame();
  st = 'play';
  ui.hideOverlay();
  player.snapCamera();
}

function pause() {
  if (st !== 'play') return;
  st = 'pause';
  player.clearInput();
  ui.show('pause');
}

function resume() {
  if (st !== 'pause') return;
  st = 'play';
  ui.hideOverlay();
}

function resize() {
  dpr = settings.lowq ? 1 : Math.min(devicePixelRatio || 1, 2);
  W = wrap.clientWidth || 1;
  H = wrap.clientHeight || 1;
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  composer.setPixelRatio(dpr);
  composer.setSize(W, H);
  bloomPass.setSize(W, H);
  hc.width = W * dpr;
  hc.height = H * dpr;
  cam.aspect = W / H;
  cam.updateProjectionMatrix();
}

function applyGraphics() {
  const high = !settings.lowq;
  renderer.shadowMap.enabled = high;
  moon.castShadow = high;
  bloomPass.enabled = high;
  for (const l of level.extraLights) l.visible = high;
  hemi.intensity = high ? 0.75 : 1.15;
  resize();
}

function step(dt) {
  player.stepInputAndLook(dt);
  const sp = Math.hypot(player.state.vel.x, player.state.vel.z) / PSPD;
  const gd = stepTime(time, dt, sp);
  ui.stepToast(dt);
  player.stepMove(dt, gd);

  const seen = enemies.step(gd, player.state);
  player.state.s += (seen ? 0.55 : -0.1) * gd;
  player.state.s = Math.max(0, Math.min(1, player.state.s));
  if (player.state.s >= 1 && !player.state.alarm) {
    player.state.alarm = true;
    ui.say('ALARM — they know you’re here!\nBullets move when you move.');
  }
  if (player.state.alarm) player.state.s = 1;

  // Bullets
  const enemyList = enemies.getList();
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const ox = b.x;
    const oy = b.y;
    const oz = b.z;
    b.x += b.vx * gd;
    b.y += b.vy * gd;
    b.z += b.vz * gd;
    b.t += gd;
    let rm = b.t > 6;

    if (!rm && b.pl) {
      const sdx = b.x - ox;
      const sdy = b.y - oy;
      const sdz = b.z - oz;
      const sl = Math.hypot(sdx, sdy, sdz);
      if (sl > 1e-5) {
        const id = 1 / sl;
        vA.set(ox, oy, oz);
        vB.set(sdx * id, sdy * id, sdz * id);
        ray.set(vA, vB);
        ray.near = 0;
        ray.far = sl;
        const wh = ray.intersectObjects(level.solids, false);
        const wt = wh.length ? wh[0].distance : Infinity;
        let hq = null;
        let et = wt;
        for (const q of enemyList) {
          if (q.dead) continue;
          const t = rayCap(
            ox, oy, oz,
            vB.x, vB.y, vB.z,
            q.x, q.z,
            q.y + CAP_Y0, q.y + CAP_Y1, CAP_R,
            0, Math.min(sl, et)
          );
          if (t < et) {
            et = t;
            hq = q;
          }
        }
        if (hq) {
          enemies.kill(hq);
          rm = true;
        } else if (wt <= sl) {
          rm = true;
        }
      }
    } else if (!rm) {
      const hitT = level.raycast2D(b.fl, ox, oz, b.x, b.z, 'blocksBullets');
      if (hitT < 1) {
        rm = true;
      } else if (
        player.state.fl === b.fl &&
        Math.hypot(player.state.x - b.x, player.state.z - b.z) < 0.7 &&
        player.state.inv <= 0
      ) {
        player.hurt();
        rm = true;
      }
    }

    if (rm) {
      scene.remove(b.m);
      bullets.splice(i, 1);
    } else {
      b.m.position.set(b.x, b.y, b.z);
    }
  }

  if (st !== 'play') return;

  // Pickups
  for (const pk of level.pickups) {
    if (pk.taken || pk.floor !== player.state.fl) continue;
    if (Math.hypot(player.state.x - pk.x, player.state.z - pk.z) < 1.6) {
      if (pk.type === 'health' && player.state.hp < 3) {
        player.state.hp = Math.min(3, player.state.hp + (pk.amount || 1));
        pk.taken = true;
        pk.mesh.visible = false;
        ui.say('First aid applied.');
      }
    }
  }

  // Objectives (data-driven)
  const curObj = level.data.objectives[objIdx];
  if (
    curObj &&
    player.state.fl === curObj.floor &&
    Math.hypot(player.state.x - curObj.x, player.state.z - curObj.z) < (curObj.radius || 2.5)
  ) {
    if (curObj.propId) {
      const prop = level.propsById.get(curObj.propId);
      if (prop) prop.visible = false;
    }
    if (curObj.win) {
      st = 'win';
      ui.show('win');
    } else {
      objIdx++;
      if (curObj.toast) ui.say(curObj.toast);
    }
  }
}

function render(now) {
  if (st === 'title') {
    const tc = level.data.titleCamera;
    cam.position.set(tc.pos[0], tc.pos[1], tc.pos[2]);
    cam.lookAt(tc.look[0], tc.look[1], tc.look[2]);
  } else {
    player.updateVisualsAndCamera(now, dtR);
    enemies.render(now, time.ts, player.state.fl);
    const curObj = level.data.objectives[Math.min(objIdx, level.data.objectives.length - 1)];
    if (curObj) {
      const flObj = level.floorById.get(curObj.floor);
      beacon.position.set(curObj.x, (flObj ? flObj.elevation : 0) + 6, curObj.z);
      beacon.material.opacity = 0.15 + 0.12 * Math.sin(now / 300);
    }
  }

  const crate = level.propsById.get('crate');
  if (crate) crate.rotation.y = now / 900;
  for (const pk of level.pickups) {
    if (!pk.taken) pk.mesh.rotation.y = now / 600;
  }

  if (settings.lowq) {
    renderer.render(scene, cam);
  } else {
    composer.render();
  }

  const f = `saturate(${(0.25 + 0.75 * time.ts).toFixed(2)}) contrast(${(
    1.12 -
    0.12 * time.ts +
    (time.killT > 0 ? 0.12 : 0)
  ).toFixed(2)})`;
  if (cv.style.filter !== f) cv.style.filter = f;

  ui.drawHud(now, {
    W,
    H,
    dpr,
    st,
    player: player.state,
    enemies: enemies.getList(),
    time,
    objIdx,
  });
}

addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('resize', resize);

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  dtR = dt;
  if (st === 'play') step(dt);
  render(now);
  requestAnimationFrame(frame);
}

applyGraphics();
initGame();
ui.show('title');
requestAnimationFrame(frame);
