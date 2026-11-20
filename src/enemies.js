import * as THREE from 'three';
import { angleDiff, createPersonMesh } from './player.js';

const GSPD = 3.1;
const NC = 16;

export function createEnemySystem({ scene, level, onShoot, onKill }) {
  let list = [];
  let kills = 0;

  function spawnAll() {
    for (const q of list) scene.remove(q.m, q.c);
    list = [];
    kills = 0;

    for (const fl of level.floors) {
      for (const ed of fl.enemies) {
        const pr = createPersonMesh(0x2e3640, 0xd9b99a, 0x2a3038, true);
        const m = pr.g;
        m.rotation.order = 'YXZ';
        m.position.set(ed.spawn[0], fl.elevation, ed.spawn[1]);
        scene.add(m);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((NC + 2) * 3), 3));
        const ix = [];
        for (let i = 0; i < NC; i++) ix.push(0, i + 1, i + 2);
        geo.setIndex(ix);
        const c = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({
            color: 0xb8362f,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        );
        c.frustumCulled = false;
        scene.add(c);

        const route = ed.route && ed.route.length ? ed.route : [];
        const startNode = level.findNearestNode(fl.id, ed.spawn[0], ed.spawn[1]);
        const nextIdx = route.length > 1 ? 1 : 0;
        const initPath =
          startNode && route.length
            ? level.findPath(fl.id, startNode.id, route[nextIdx])
            : [];

        list.push({
          fl: fl.id,
          y: fl.elevation,
          x: ed.spawn[0],
          z: ed.spawn[1],
          a: ed.facing ?? 0,
          w: 0,
          m,
          c,
          pr,
          dead: false,
          al: false,
          fc: 0.9,
          sd: Math.random() < 0.5 ? 1 : -1,
          t2: 1,
          mv: false,
          route,
          routeIdx: nextIdx,
          path: initPath,
          pathIdx: initPath.length > 1 ? 1 : 0,
          repathT: 0,
        });
      }
    }
  }

  function moveEnemy(q, vx, vz, len) {
    const res = level.resolveMove(q.fl, q.x, q.z, vx * len, vz * len, 0.5);
    q.x = res.x;
    q.z = res.z;
    q.mv = true;
  }

  function kill(q) {
    q.dead = true;
    kills++;
    for (const o of list) {
      if (!o.dead && o.fl === q.fl && Math.hypot(o.x - q.x, o.z - q.z) < 16) o.al = true;
    }
    onKill(q);
  }

  function step(gd, playerState) {
    let seen = false;
    for (const q of list) {
      if (q.dead) continue;
      const dx = playerState.x - q.x;
      const dz = playerState.z - q.z;
      const d = Math.hypot(dx, dz) || 1;
      const sf = q.fl === playerState.fl;
      const ta = Math.atan2(dz, dx);
      q.mv = false;

      const cs = sf && level.hasLOS(q.fl, q.x, q.z, playerState.x, playerState.z);
      if (!q.al && cs && d < 24 && Math.abs(angleDiff(ta, q.a)) < 0.62) seen = true;
      if (playerState.alarm) q.al = true;

      if (q.al) {
        if (cs) {
          q.a += angleDiff(ta, q.a) * Math.min(1, gd * 8);
          let ax = 0;
          let az = 0;
          if (d > 14) {
            ax = dx / d;
            az = dz / d;
          } else if (d < 7) {
            ax = -dx / d;
            az = -dz / d;
          } else {
            ax = (-dz / d) * q.sd;
            az = (dx / d) * q.sd;
          }
          q.t2 -= gd;
          if (q.t2 <= 0) {
            q.sd = -q.sd;
            q.t2 = 1.5 + Math.random() * 1.5;
          }
          moveEnemy(q, ax, az, 3.2 * gd);
          q.fc -= gd;
          if (q.fc <= 0) {
            q.fc = 1.2 + Math.random() * 0.9;
            onShoot(q.x, q.z, ta + (Math.random() - 0.5) * 0.1, q.y + 1.6, q.fl, false);
          }
        } else if (sf) {
          q.repathT -= gd;
          if (q.repathT <= 0 || q.pathIdx >= q.path.length) {
            q.repathT = 0.5;
            const nStart = level.findNearestNode(q.fl, q.x, q.z);
            const nGoal = level.findNearestNode(q.fl, playerState.x, playerState.z);
            if (nStart && nGoal) {
              q.path = level.findPath(q.fl, nStart.id, nGoal.id);
              q.pathIdx = q.path.length > 1 ? 1 : 0;
            }
          }
          const wp = q.path[q.pathIdx];
          if (wp) {
            const ex = wp.x - q.x;
            const ez = wp.z - q.z;
            const e = Math.hypot(ex, ez);
            if (e < 0.7) {
              q.pathIdx++;
            } else {
              const wa = Math.atan2(ez, ex);
              q.a += angleDiff(wa, q.a) * Math.min(1, gd * 8);
              moveEnemy(q, ex / e, ez / e, 3.2 * gd);
            }
          } else {
            q.a += angleDiff(ta, q.a) * Math.min(1, gd * 8);
            moveEnemy(q, dx / d, dz / d, 3.2 * gd);
          }
        }
      } else if (q.route.length) {
        if (q.w > 0) {
          q.w -= gd;
          const nextNode = q.path[q.pathIdx] || level.floorById.get(q.fl)?.nodeMap.get(q.route[q.routeIdx]);
          if (nextNode) {
            const wa = Math.atan2(nextNode.z - q.z, nextNode.x - q.x);
            q.a += angleDiff(wa, q.a) * Math.min(1, gd * 3);
          }
        } else {
          if (q.pathIdx >= q.path.length) {
            const fromN = level.findNearestNode(q.fl, q.x, q.z);
            const goalId = q.route[q.routeIdx];
            q.path = fromN ? level.findPath(q.fl, fromN.id, goalId) : [];
            q.pathIdx = q.path.length > 1 ? 1 : 0;
          }
          const tg = q.path[q.pathIdx];
          if (tg) {
            const ex = tg.x - q.x;
            const ez = tg.z - q.z;
            const e = Math.hypot(ex, ez);
            if (e < 0.55) {
              q.pathIdx++;
              if (q.pathIdx >= q.path.length) {
                q.routeIdx = (q.routeIdx + 1) % q.route.length;
                const curN = level.findNearestNode(q.fl, q.x, q.z);
                q.path = curN ? level.findPath(q.fl, curN.id, q.route[q.routeIdx]) : [];
                q.pathIdx = q.path.length > 1 ? 1 : 0;
                q.w = 1.2;
              }
            } else {
              const wa = Math.atan2(ez, ex);
              q.a += angleDiff(wa, q.a) * Math.min(1, gd * 6);
              moveEnemy(q, ex / e, ez / e, GSPD * gd);
            }
          }
        }
      }
    }
    return seen;
  }

  function updCone(q) {
    const pos = q.c.geometry.attributes.position;
    const y = q.y + 0.15;
    pos.setXYZ(0, q.x, y, q.z);
    for (let i = 0; i <= NC; i++) {
      const a = q.a - 0.62 + (i * 1.24) / NC;
      const tx = q.x + Math.cos(a) * 24;
      const tz = q.z + Math.sin(a) * 24;
      const t = level.raycast2D(q.fl, q.x, q.z, tx, tz, 'blocksVision');
      pos.setXYZ(i + 1, q.x + (tx - q.x) * t, y, q.z + (tz - q.z) * t);
    }
    pos.needsUpdate = true;
  }

  function render(now, ts, playerFloor) {
    for (const q of list) {
      q.m.position.set(q.x, q.y, q.z);
      q.m.rotation.y = Math.PI / 2 - q.a;
      if (q.dead) {
        q.c.visible = false;
        q.m.rotation.x += (-1.45 - q.m.rotation.x) * 0.12;
        q.m.position.y = q.y + 0.3;
        continue;
      }
      const w = q.mv ? Math.sin(now / 130 + q.x) * 0.8 * ts : 0;
      q.pr.lL.rotation.x = w;
      q.pr.lR.rotation.x = -w;
      q.pr.aL.rotation.x = q.al ? -1.2 : -w * 0.8;
      q.pr.aR.rotation.x = q.al ? -1.45 : w * 0.8;
      q.c.visible = q.fl === playerFloor;
      if (q.c.visible) {
        updCone(q);
        q.c.material.color.setHex(q.al ? 0xff7a2a : 0xb8362f);
      }
    }
  }

  return {
    spawnAll,
    step,
    render,
    kill,
    getList: () => list,
    getKills: () => kills,
    getTotal: () => list.length,
    getAliveCount: () => list.filter((q) => !q.dead).length,
  };
}
