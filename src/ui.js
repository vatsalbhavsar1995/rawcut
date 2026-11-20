export function createUI({
  hc,
  ov,
  pb,
  level,
  settings,
  onSaveSettings,
  onApplyGraphics,
  onStart,
  onResume,
  onPause,
  onMenu,
  getState,
  getStats,
}) {
  const g = hc.getContext('2d');
  let toast = '';
  let toastT = 0;

  function say(text) {
    toast = text;
    toastT = 4.5;
  }

  function clearToast() {
    toast = '';
    toastT = 0;
  }

  function stepToast(dt) {
    toastT -= dt;
  }

  function showEndScreen(k) {
    const stats = getStats();
    if (k === 'dead') {
      ov.innerHTML =
        '<p class="stamp">Shot down</p><p class="dim">Bullets crawl when you stand still and fly when you run. Aim in the freeze, then break line of sight behind cover.</p><p>Tap to retry</p>';
    } else if (k === 'win') {
      ov.innerHTML =
        '<p class="q">Manifest, line 14:<br>“SRV-C. Maintenance contract, downtown.”</p><p class="stamp">Impound — closed</p><p class="dim">Hostiles down: ' +
        stats.kills +
        ' of ' +
        stats.total +
        '. Hits taken: ' +
        stats.hits +
        '. Time: ' +
        Math.round(stats.tsec) +
        ' s.</p><p>Tap to replay</p>';
    }
    ov.className = '';
    try {
      document.exitPointerLock();
    } catch (_) {}
  }

  function show(k) {
    const bt = (a, t) => '<button class="bt" data-a="' + a + '">' + t + '</button>';
    const sm = 'style="display:inline-block;min-width:54px"';
    const total = getStats().total;
    if (k === 'title') {
      ov.innerHTML =
        '<p class="stamp">Day 1 — 120 hours remaining</p><h1 class="big">' +
        level.data.name +
        '</h1><p class="dim">Four floors, ' +
        total +
        ' hostiles. Plant the dossier on F4, fight down to the vault on F1, and leave through the loading bay.</p><p class="dim">Time moves only when you move or look. Stand still to aim, move to dodge.</p>' +
        bt('play', 'PLAY') +
        bt('set', 'SETTINGS') +
        '<p class="dim">WASD move · drag the mouse to look (or click to capture it) · click fires · right-click aims · R reload · Esc or P pause<br>Touch: left thumb moves, right thumb aims, FIRE shoots.</p>';
    } else if (k === 'pause') {
      ov.innerHTML =
        '<h1 class="big">PAUSED</h1>' +
        bt('resume', 'RESUME') +
        bt('restart', 'RESTART') +
        bt('set', 'SETTINGS') +
        bt('menu', 'MAIN MENU');
    } else if (k === 'set') {
      ov.innerHTML =
        '<h1 class="big">SETTINGS</h1>' +
        bt(
          'cm',
          'LOOK: ' +
            {
              auto: 'AUTO (capture, else drag)',
              drag: 'DRAG TO LOOK',
              steer: 'CURSOR STEER',
            }[settings.cm]
        ) +
        '<p>SENSITIVITY <button class="bt" ' +
        sm +
        ' data-a="sm">−</button> ' +
        settings.sens.toFixed(2) +
        ' <button class="bt" ' +
        sm +
        ' data-a="sp">+</button></p>' +
        bt('iy', 'INVERT Y: ' + (settings.invY ? 'ON' : 'OFF')) +
        bt('q', 'GRAPHICS: ' + (settings.lowq ? 'LOW (faster)' : 'HIGH')) +
        bt('back', 'BACK');
    } else {
      showEndScreen(k);
      ov.innerHTML += bt('menu', 'MAIN MENU');
      return;
    }
    ov.className = '';
    try {
      document.exitPointerLock();
    } catch (_) {}
  }

  function hideOverlay() {
    ov.className = 'h';
  }

  function act(a) {
    if (a === 'play' || a === 'restart') onStart();
    else if (a === 'resume') onResume();
    else if (a === 'menu') {
      onMenu();
      show('title');
    } else if (a === 'set') show('set');
    else if (a === 'back') show(getState() === 'pause' ? 'pause' : 'title');
    else {
      if (a === 'cm') settings.cm = settings.cm === 'auto' ? 'drag' : settings.cm === 'drag' ? 'steer' : 'auto';
      if (a === 'sm') settings.sens = Math.max(0.5, settings.sens - 0.25);
      if (a === 'sp') settings.sens = Math.min(2.5, settings.sens + 0.25);
      if (a === 'iy') settings.invY = !settings.invY;
      if (a === 'q') {
        settings.lowq = !settings.lowq;
        onApplyGraphics();
      }
      onSaveSettings();
      show('set');
    }
  }

  pb.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    onPause();
  });
  ov.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const a = e.target.dataset && e.target.dataset.a;
    if (a) {
      act(a);
      return;
    }
    const st = getState();
    if (st === 'dead' || st === 'win') onStart();
  });

  function drawHud(now, { W, H, dpr, st, player, enemies, time, objIdx }) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (st === 'title') return;

    const flObj = level.floorById.get(player.fl);
    const objs = level.data.objectives;
    const curObj = objs[Math.min(objIdx, objs.length - 1)];

    g.font = '12px "Courier New",monospace';
    g.textBaseline = 'top';
    let y = 12;
    g.fillStyle = 'rgba(216,210,192,.9)';
    g.fillText(flObj ? flObj.name : 'FLOOR ' + (player.fl + 1), 14, y);
    y += 20;

    objs.forEach((o, i) => {
      if (i > objIdx) return;
      const dn = i < objIdx;
      const t = (dn ? '☑ ' : '☐ ') + o.label;
      g.fillStyle = dn ? 'rgba(216,210,192,.4)' : '#d8d2c0';
      g.fillText(t, 14, y);
      if (dn) g.fillRect(14, y + 6, g.measureText(t).width, 1);
      y += 17;
    });

    if (curObj) {
      const dist = Math.round(Math.hypot(player.x - curObj.x, player.z - curObj.z));
      const dirTxt =
        curObj.floor !== player.fl ? (curObj.floor > player.fl ? '  — go UP' : '  — go DOWN') : '';
      g.fillStyle = '#c9a24a';
      g.fillText('▸ ' + dist + ' m' + dirTxt, 14, y + 2);
    }

    // Vignettes
    if (player.alarm) {
      g.fillStyle = 'rgba(184,54,47,' + (0.06 + 0.04 * Math.sin(now / 200)) + ')';
      g.fillRect(0, 0, W, H);
    }
    if (player.hitF > 0) {
      g.fillStyle = 'rgba(200,30,30,' + player.hitF * 0.35 + ')';
      g.fillRect(0, 0, W, H);
    }
    if (time.killT > 0) {
      g.fillStyle = 'rgba(255,255,255,' + Math.min(1, time.killT / 0.75) * 0.1 + ')';
      g.fillRect(0, 0, W, H);
    }

    // Crosshair
    g.strokeStyle = player.alarm ? '#ff5a4a' : 'rgba(216,210,192,.9)';
    g.lineWidth = 1.5;
    {
      const cx = W / 2;
      const cy = H / 2;
      g.beginPath();
      g.moveTo(cx - 11, cy);
      g.lineTo(cx - 4, cy);
      g.moveTo(cx + 4, cy);
      g.lineTo(cx + 11, cy);
      g.moveTo(cx, cy - 11);
      g.lineTo(cx, cy - 4);
      g.moveTo(cx, cy + 4);
      g.lineTo(cx, cy + 11);
      g.stroke();
    }

    // HP + ammo + hostiles
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i < player.hp ? '#b8362f' : '#2a2f35';
      g.beginPath();
      g.arc(20 + i * 20, H - 96, 7, 0, 6.2832);
      g.fill();
    }
    g.fillStyle = '#d8d2c0';
    g.fillText(player.reload > 0 ? 'RELOADING…' : 'ROUNDS ' + player.mag + '/8', 14, H - 80);
    g.fillText('HOSTILES ' + enemies.filter((q) => !q.dead).length, 14, H - 64);

    if (toastT > 0) {
      g.textAlign = 'center';
      g.globalAlpha = Math.min(1, toastT);
      toast.split('\n').forEach((l, i) => {
        g.fillStyle = '#c9a24a';
        g.fillText(l, W / 2, H * 0.2 + i * 17);
      });
      g.globalAlpha = 1;
      g.textAlign = 'left';
    }

    // Data-driven polygon/segment minimap (current floor)
    const b = level.data.bounds;
    const spanX = b.maxX - b.minX;
    const spanZ = b.maxZ - b.minZ;
    const ms = 2.4;
    const mw = spanX * ms;
    const mh = spanZ * ms;
    const mx0 = W - mw - 12;
    const my0 = H - mh - 12;
    const px = (x) => mx0 + (x - b.minX) * ms;
    const pz = (z) => my0 + (z - b.minZ) * ms;

    g.fillStyle = 'rgba(8,12,16,.8)';
    g.fillRect(mx0 - 4, my0 - 4, mw + 8, mh + 8);
    g.strokeStyle = '#3a4148';
    g.lineWidth = 1;
    g.strokeRect(mx0 - 4, my0 - 4, mw + 8, mh + 8);

    if (flObj) {
      // Floor footprint fill
      if (flObj.outline?.length) {
        g.fillStyle = 'rgba(42,50,58,.45)';
        g.beginPath();
        flObj.outline.forEach(([x, z], i) => (i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))));
        g.closePath();
        g.fill();
      }
      // Holes (atrium & stair voids)
      for (const hole of flObj.holes) {
        g.fillStyle = 'rgba(6,9,13,.9)';
        g.beginPath();
        hole.forEach(([x, z], i) => (i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))));
        g.closePath();
        g.fill();
      }
      // Stair links connected to this floor
      for (const lk of level.links) {
        if (lk.fromFloor !== player.fl && lk.toFloor !== player.fl) continue;
        g.strokeStyle = lk.toFloor === player.fl ? 'rgba(201,162,74,.55)' : 'rgba(110,165,195,.55)';
        g.lineWidth = Math.max(2, lk.width * ms * 0.55);
        g.beginPath();
        g.moveTo(px(lk.a[0]), pz(lk.a[1]));
        g.lineTo(px(lk.b[0]), pz(lk.b[1]));
        g.stroke();
      }
      // Wall & cover segments
      for (const seg of flObj.segments) {
        g.strokeStyle = seg.blocksVision ? '#556473' : 'rgba(120,140,160,.6)';
        g.lineWidth = Math.max(1.2, seg.thickness * ms);
        g.beginPath();
        g.moveTo(px(seg.ax), pz(seg.az));
        g.lineTo(px(seg.bx), pz(seg.bz));
        g.stroke();
      }
    }

    // Enemies on current floor
    g.fillStyle = '#b8362f';
    for (const q of enemies) {
      if (!q.dead && q.fl === player.fl) {
        g.beginPath();
        g.arc(px(q.x), pz(q.z), 2.5, 0, 6.2832);
        g.fill();
      }
    }

    // Current objective ring
    if (curObj && curObj.floor === player.fl) {
      g.strokeStyle = `rgba(201,162,74,${0.5 + 0.4 * Math.sin(now / 300)})`;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(px(curObj.x), pz(curObj.z), 6, 0, 6.2832);
      g.stroke();
    }

    // Player dot & look arrow
    g.fillStyle = '#d8d2c0';
    g.beginPath();
    g.arc(px(player.x), pz(player.z), 3, 0, 6.2832);
    g.fill();
    g.strokeStyle = '#d8d2c0';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(px(player.x), pz(player.z));
    g.lineTo(px(player.x) - Math.sin(player.yaw) * 9, pz(player.z) - Math.cos(player.yaw) * 9);
    g.stroke();

    // Cover watch
    const r = 30;
    const wx = 52;
    const wy = H - 34 - r - 110;
    g.save();
    g.translate(wx, wy);
    g.fillStyle = '#0c0f12';
    g.beginPath();
    g.arc(0, 0, r + 4, 0, 6.2832);
    g.fill();
    g.strokeStyle = '#3a4148';
    g.lineWidth = 2;
    g.stroke();
    g.strokeStyle = '#1d2328';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(0, 0, r - 6, 0, 6.2832);
    g.stroke();
    g.strokeStyle = `hsl(${45 - 45 * player.s},70%,52%)`;
    g.beginPath();
    g.arc(0, 0, r - 6, -1.5708, -1.5708 + player.s * 6.2832);
    g.stroke();
    const ha = -1.5708 + player.s * 6.2832;
    g.strokeStyle = '#d8d2c0';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(ha) * (r - 10), Math.sin(ha) * (r - 10));
    g.stroke();
    if (player.s > 0.75) {
      g.strokeStyle = 'rgba(255,255,255,.8)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-8, -r);
      g.lineTo(-2, -8);
      g.lineTo(-12, 4);
      g.lineTo(-6, r);
      g.moveTo(-2, -8);
      g.lineTo(12, -14);
      g.stroke();
    }
    g.restore();
  }

  return {
    say,
    clearToast,
    stepToast,
    show,
    hideOverlay,
    drawHud,
  };
}
