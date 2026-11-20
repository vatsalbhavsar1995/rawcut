import * as THREE from 'three';

function parseColor(c) {
  return typeof c === 'string' ? parseInt(c, 16) : c;
}

function addPolySegments(target, pts, closed, opts) {
  const n = pts.length;
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 1e-4) continue;
    target.push({
      ax: a[0],
      az: a[1],
      bx: b[0],
      bz: b[1],
      len,
      height: opts.height ?? 5.6,
      thickness: opts.thickness ?? 0.5,
      color: parseColor(opts.color ?? 0x2b3540),
      blocksMove: opts.blocksMove !== false,
      blocksVision: opts.blocksVision !== false,
      blocksBullets: opts.blocksBullets !== false,
      isCover: !!opts.isCover,
    });
  }
}

function makeMat(color, emissive = 0) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true, emissive });
}

function buildSlabMesh(outline, holes, elevation, color) {
  const to2D = (poly) => poly.map(([x, z]) => new THREE.Vector2(x, -z));
  let outerPts = to2D(outline);
  if (THREE.ShapeUtils.isClockWise(outerPts)) outerPts = outerPts.slice().reverse();
  const shape = new THREE.Shape(outerPts);
  for (const h of holes || []) {
    let hPts = to2D(h);
    if (!THREE.ShapeUtils.isClockWise(hPts)) hPts = hPts.slice().reverse();
    shape.holes.push(new THREE.Path(hPts));
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, makeMat(parseColor(color)));
  mesh.position.y = elevation - 0.4;
  mesh.receiveShadow = true;
  return mesh;
}

function buildSegmentMesh(seg, elevation) {
  const geo = new THREE.BoxGeometry(seg.len + seg.thickness * 0.5, seg.height, seg.thickness);
  const mesh = new THREE.Mesh(geo, makeMat(seg.color));
  mesh.position.set(
    (seg.ax + seg.bx) * 0.5,
    elevation + seg.height * 0.5,
    (seg.az + seg.bz) * 0.5
  );
  mesh.rotation.y = Math.atan2(-(seg.bz - seg.az), seg.bx - seg.ax);
  mesh.castShadow = seg.height > 1.5;
  mesh.receiveShadow = true;
  return mesh;
}

function buildLinkMesh(link, fromElev, toElev) {
  const dx = link.b[0] - link.a[0];
  const dz = link.b[1] - link.a[1];
  const hLen = Math.hypot(dx, dz);
  const dY = toElev - fromElev;
  const rLen = Math.hypot(hLen, dY);
  const geo = new THREE.BoxGeometry(link.width, 0.32, rLen);
  const mesh = new THREE.Mesh(geo, makeMat(parseColor(link.color ?? 0x4a525a)));
  mesh.rotation.order = 'YXZ';
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.rotation.x = -Math.atan2(dY, hLen);
  mesh.position.set(
    (link.a[0] + link.b[0]) * 0.5,
    (fromElev + toElev) * 0.5 - 0.16,
    (link.a[1] + link.b[1]) * 0.5
  );
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

function buildPropMesh(prop, elevation) {
  const color = parseColor(prop.color ?? 0x6a5230);
  const emissive = parseColor(prop.emissive ?? 0);
  let mesh;
  if (prop.type === 'pillar') {
    const r = prop.radius ?? 0.6;
    const h = prop.height ?? 6;
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), makeMat(color, emissive));
    mesh.position.set(prop.x, elevation + h * 0.5, prop.z);
  } else {
    const [w, h, d] = prop.size ?? [2, 2, 2];
    mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeMat(color, emissive));
    const y = prop.y !== undefined ? elevation + prop.y : elevation + h * 0.5;
    mesh.position.set(prop.x, y, prop.z);
  }
  if (prop.rot) mesh.rotation.y = prop.rot;
  mesh.castShadow = prop.type !== 'sign';
  mesh.receiveShadow = true;
  return mesh;
}

export function buildLevel(data, scene) {
  const floors = [];
  const floorById = new Map();
  const solids = [];
  const extraLights = [];
  const propsById = new Map();
  const pickups = [];

  for (const fd of data.floors) {
    const segs = [];
    for (const w of fd.walls || []) {
      const pts = w.points || [w.a, w.b];
      addPolySegments(segs, pts, !!w.closed, w);
    }
    for (const c of fd.cover || []) {
      const pts = c.points || [c.a, c.b];
      addPolySegments(segs, pts, !!c.closed, { ...c, isCover: true });
    }
    for (const p of fd.props || []) {
      if (p.type === 'pillar') {
        const r = p.radius ?? 0.6;
        const n = 8;
        const pts = [];
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2;
          pts.push([p.x + Math.cos(ang) * r, p.z + Math.sin(ang) * r]);
        }
        addPolySegments(segs, pts, true, {
          height: p.height ?? fd.height,
          thickness: 0.12,
          color: p.color,
          isCover: true,
        });
      } else if (p.solid) {
        const [w, h, d] = p.size ?? [2, 1.2, 2];
        const hw = w * 0.5, hd = d * 0.5;
        const pts = [
          [p.x - hw, p.z - hd],
          [p.x + hw, p.z - hd],
          [p.x + hw, p.z + hd],
          [p.x - hw, p.z + hd],
        ];
        addPolySegments(segs, pts, true, {
          height: h,
          thickness: 0.12,
          color: p.color,
          isCover: true,
        });
      }
    }

    const slab = buildSlabMesh(fd.outline, fd.holes, fd.elevation, fd.slabColor);
    scene.add(slab);
    solids.push(slab);

    for (const seg of segs) {
      if (seg.thickness <= 0.15 && seg.isCover) continue;
      const mesh = buildSegmentMesh(seg, fd.elevation);
      scene.add(mesh);
      solids.push(mesh);
    }

    for (const p of fd.props || []) {
      const mesh = buildPropMesh(p, fd.elevation);
      scene.add(mesh);
      if (p.id) propsById.set(p.id, mesh);
      if (p.solid || p.type === 'pillar') solids.push(mesh);
    }

    for (const l of fd.lights || []) {
      const col = parseColor(l.color ?? 0xffc87a);
      const pl = new THREE.PointLight(col, l.intensity ?? 0.85, l.distance ?? 32);
      pl.position.set(l.x, fd.elevation + l.y, l.z);
      scene.add(pl);
      extraLights.push(pl);
      const fix = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.2, 1.4),
        makeMat(col, col)
      );
      fix.position.set(l.x, fd.elevation + l.y + 0.75, l.z);
      scene.add(fix);
    }

    for (const pk of fd.pickups || []) {
      const col = pk.type === 'health' ? 0x3eb478 : 0xc9a24a;
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45, 0),
        makeMat(col, col)
      );
      mesh.position.set(pk.x, fd.elevation + 0.9, pk.z);
      scene.add(mesh);
      pickups.push({ ...pk, floor: fd.id, taken: false, mesh });
    }

    const nodeMap = new Map();
    const adj = new Map();
    for (const n of fd.waypoints?.nodes || []) {
      nodeMap.set(n.id, n);
      adj.set(n.id, []);
    }
    for (const [u, v] of fd.waypoints?.edges || []) {
      if (adj.has(u) && adj.has(v)) {
        adj.get(u).push(v);
        adj.get(v).push(u);
      }
    }

    const floorObj = {
      id: fd.id,
      name: fd.name,
      elevation: fd.elevation,
      height: fd.height,
      outline: fd.outline,
      holes: fd.holes || [],
      segments: segs,
      nodes: fd.waypoints?.nodes || [],
      nodeMap,
      adj,
      enemies: fd.enemies || [],
    };
    floors.push(floorObj);
    floorById.set(fd.id, floorObj);
  }

  const links = [];
  for (const ld of data.links || []) {
    const fFrom = floorById.get(ld.fromFloor);
    const fTo = floorById.get(ld.toFloor);
    if (!fFrom || !fTo) continue;
    const dx = ld.b[0] - ld.a[0];
    const dz = ld.b[1] - ld.a[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    const mesh = buildLinkMesh(ld, fFrom.elevation, fTo.elevation);
    scene.add(mesh);
    solids.push(mesh);
    links.push({
      ...ld,
      len,
      ux,
      uz,
      vx: -uz,
      vz: ux,
      halfW: ld.width * 0.5,
      fromElev: fFrom.elevation,
      toElev: fTo.elevation,
    });
  }

  const b = data.bounds;
  const cx = (b.minX + b.maxX) * 0.5;
  const cz = (b.minZ + b.maxZ) * 0.5;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), makeMat(0x1c2b20));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, -0.35, cz);
  ground.receiveShadow = true;
  scene.add(ground);
  solids.push(ground);

  {
    let sd = 5;
    const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      const x = b.minX - 60 + rn() * (b.maxX - b.minX + 120);
      const z = b.minZ - 50 + rn() * (b.maxZ - b.minZ + 100);
      if (x > b.minX - 6 && x < b.maxX + 6 && z > b.minZ - 6 && z < b.maxZ + 6) continue;
      const t = new THREE.Group();
      const h = 0.8 + rn() * 1.1;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 5), makeMat(0x5a3d26));
      trunk.position.y = 0.8;
      t.add(trunk);
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.6, 6), makeMat(0x1f5a35));
      c1.position.y = 3;
      t.add(c1);
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 6), makeMat(0x276b3f));
      c2.position.y = 4.8;
      t.add(c2);
      t.scale.setScalar(h);
      t.position.set(x, -0.35, z);
      scene.add(t);
    }
  }

  function resolveMove(floorId, x, z, dx, dz, radius) {
    const fl = floorById.get(floorId);
    let nx = x + dx;
    let nz = z + dz;
    if (!fl) return { x: nx, z: nz, hit: false };
    let collided = false;
    for (let iter = 0; iter < 3; iter++) {
      for (const seg of fl.segments) {
        if (!seg.blocksMove) continue;
        const sx = seg.bx - seg.ax;
        const sz = seg.bz - seg.az;
        const l2 = sx * sx + sz * sz;
        let t = ((nx - seg.ax) * sx + (nz - seg.az) * sz) / l2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const px = seg.ax + sx * t;
        const pz = seg.az + sz * t;
        const ox = nx - px;
        const oz = nz - pz;
        const dist = Math.hypot(ox, oz);
        const minD = radius + seg.thickness * 0.5;
        if (dist < minD) {
          collided = true;
          if (dist > 1e-5) {
            const push = (minD - dist) / dist;
            nx += ox * push;
            nz += oz * push;
          } else {
            const len = Math.sqrt(l2) || 1;
            nx += (-sz / len) * minD;
            nz += (sx / len) * minD;
          }
        }
      }
    }
    return { x: nx, z: nz, hit: collided };
  }

  function raycast2D(floorId, ax, az, bx, bz, filter = 'blocksVision') {
    const fl = floorById.get(floorId);
    if (!fl) return 1;
    const rx = bx - ax;
    const rz = bz - az;
    let best = 1;
    for (const seg of fl.segments) {
      if (!seg[filter]) continue;
      const sx = seg.bx - seg.ax;
      const sz = seg.bz - seg.az;
      const denom = rx * sz - rz * sx;
      if (Math.abs(denom) < 1e-8) continue;
      const qx = seg.ax - ax;
      const qz = seg.az - az;
      const t = (qx * sz - qz * sx) / denom;
      if (t <= 1e-4 || t >= best) continue;
      const u = (qx * rz - qz * rx) / denom;
      if (u >= -1e-4 && u <= 1 + 1e-4) best = t;
    }
    return best;
  }

  function hasLOS(floorId, ax, az, bx, bz) {
    return raycast2D(floorId, ax, az, bx, bz, 'blocksVision') >= 1 - 1e-4;
  }

  function sampleFloorAndY(curFloor, x, z) {
    for (const lk of links) {
      if (lk.fromFloor !== curFloor && lk.toFloor !== curFloor) continue;
      const rx = x - lk.a[0];
      const rz = z - lk.a[1];
      const u = rx * lk.ux + rz * lk.uz;
      const v = rx * lk.vx + rz * lk.vz;
      if (u >= 0 && u <= lk.len && Math.abs(v) <= lk.halfW) {
        const frac = u / lk.len;
        const y = lk.fromElev + (lk.toElev - lk.fromElev) * frac;
        const fl = frac >= 0.5 ? lk.toFloor : lk.fromFloor;
        return { fl, y, onLink: lk };
      }
    }
    const fl = floorById.get(curFloor);
    return { fl: curFloor, y: fl ? fl.elevation : 0, onLink: null };
  }

  function findNearestNode(floorId, x, z) {
    const fl = floorById.get(floorId);
    if (!fl || !fl.nodes.length) return null;
    let best = fl.nodes[0];
    let bestD = Infinity;
    for (const n of fl.nodes) {
      const d = (n.x - x) ** 2 + (n.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function findPath(floorId, startId, goalId) {
    const fl = floorById.get(floorId);
    if (!fl || !fl.nodeMap.has(startId) || !fl.nodeMap.has(goalId)) return [];
    if (startId === goalId) return [fl.nodeMap.get(goalId)];
    const open = [startId];
    const came = new Map();
    const gScore = new Map([[startId, 0]]);
    const goal = fl.nodeMap.get(goalId);
    const fScore = new Map([[startId, Math.hypot(goal.x - fl.nodeMap.get(startId).x, goal.z - fl.nodeMap.get(startId).z)]]);
    while (open.length) {
      let bestI = 0;
      let bestF = fScore.get(open[0]) ?? Infinity;
      for (let i = 1; i < open.length; i++) {
        const f = fScore.get(open[i]) ?? Infinity;
        if (f < bestF) {
          bestF = f;
          bestI = i;
        }
      }
      const cur = open.splice(bestI, 1)[0];
      if (cur === goalId) {
        const path = [];
        let k = cur;
        while (k) {
          path.push(fl.nodeMap.get(k));
          k = came.get(k);
        }
        return path.reverse();
      }
      const curN = fl.nodeMap.get(cur);
      const curG = gScore.get(cur) ?? Infinity;
      for (const nb of fl.adj.get(cur) || []) {
        const nbN = fl.nodeMap.get(nb);
        const tg = curG + Math.hypot(nbN.x - curN.x, nbN.z - curN.z);
        if (tg < (gScore.get(nb) ?? Infinity)) {
          came.set(nb, cur);
          gScore.set(nb, tg);
          fScore.set(nb, tg + Math.hypot(goal.x - nbN.x, goal.z - nbN.z));
          if (!open.includes(nb)) open.push(nb);
        }
      }
    }
    return [];
  }

  function resetPickupsAndProps() {
    const crate = propsById.get('crate');
    if (crate) crate.visible = true;
    for (const pk of pickups) {
      pk.taken = false;
      pk.mesh.visible = true;
    }
  }

  return {
    data,
    floors,
    floorById,
    links,
    solids,
    extraLights,
    propsById,
    pickups,
    resolveMove,
    raycast2D,
    hasLOS,
    sampleFloorAndY,
    findNearestNode,
    findPath,
    resetPickupsAndProps,
  };
}
