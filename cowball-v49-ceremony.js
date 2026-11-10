/* Cowball v49 — opening & closing ceremonies with real-time 3D trophies.
   Runs on its own canvas/WebGL renderer, so the match engine and its render loop are untouched.
   Entry points (called from cowball-core.js through window.CowballV49Host):
     CowballCeremony.opening(host, comp)   — brand-new competition
     CowballCeremony.closing(host, comp)   — final result is known
   Any error inside a ceremony closes it and returns to the game. */
(function () {
  'use strict';

  // ------------------------------------------------------------------ text
  const TXT = {
    ru: { openTitle: 'ОТКРЫТИЕ ЧЕМПИОНАТА', closeTitle: 'ЗАКРЫТИЕ ЧЕМПИОНАТА', champion: 'ЧЕМПИОН', youChamp: 'ТЫ ЧЕМПИОН!', skip: 'Пропустить ▶', teams: 'команд', silver: 'Серебро', bronze: 'Бронза', kickoff: 'ДА НАЧНЁТСЯ ИГРА!', added: 'Кубок добавлен в Зал трофеев', winnerOf: 'Победитель турнира', second: 'Финалист', third: 'Полуфиналист', season: 'Сезон' },
    en: { openTitle: 'CHAMPIONSHIP OPENING', closeTitle: 'CHAMPIONSHIP CLOSING', champion: 'CHAMPION', youChamp: 'YOU ARE THE CHAMPION!', skip: 'Skip ▶', teams: 'teams', silver: 'Silver', bronze: 'Bronze', kickoff: 'LET THE GAMES BEGIN!', added: 'Trophy added to the Trophy Room', winnerOf: 'Tournament winner', second: 'Runner-up', third: 'Semi-finalist', season: 'Season' },
    fr: { openTitle: 'OUVERTURE DU CHAMPIONNAT', closeTitle: 'CLÔTURE DU CHAMPIONNAT', champion: 'CHAMPION', youChamp: 'TU ES CHAMPION !', skip: 'Passer ▶', teams: 'équipes', silver: 'Argent', bronze: 'Bronze', kickoff: 'QUE LE JEU COMMENCE !', added: 'Trophée ajouté à la salle des trophées', winnerOf: 'Vainqueur du tournoi', second: 'Finaliste', third: 'Demi-finaliste', season: 'Saison' },
    es: { openTitle: 'INAUGURACIÓN DEL CAMPEONATO', closeTitle: 'CLAUSURA DEL CAMPEONATO', champion: 'CAMPEÓN', youChamp: '¡ERES EL CAMPEÓN!', skip: 'Saltar ▶', teams: 'equipos', silver: 'Plata', bronze: 'Bronce', kickoff: '¡QUE EMPIECE EL JUEGO!', added: 'Trofeo añadido a la Sala de trofeos', winnerOf: 'Ganador del torneo', second: 'Subcampeón', third: 'Semifinalista', season: 'Temporada' },
    tr: { openTitle: 'ŞAMPİYONA AÇILIŞI', closeTitle: 'ŞAMPİYONA KAPANIŞI', champion: 'ŞAMPİYON', youChamp: 'ŞAMPİYON SENSİN!', skip: 'Geç ▶', teams: 'takım', silver: 'Gümüş', bronze: 'Bronz', kickoff: 'OYUN BAŞLASIN!', added: 'Kupa Odası’na eklendi', winnerOf: 'Turnuva galibi', second: 'Finalist', third: 'Yarı finalist', season: 'Sezon' },
    az: { openTitle: 'ÇEMPİONATIN AÇILIŞI', closeTitle: 'ÇEMPİONATIN BAĞLANIŞI', champion: 'ÇEMPİON', youChamp: 'ÇEMPİON SƏNSƏN!', skip: 'Keç ▶', teams: 'komanda', silver: 'Gümüş', bronze: 'Bürünc', kickoff: 'OYUN BAŞLASIN!', added: 'Kubok zalına əlavə edildi', winnerOf: 'Turnirin qalibi', second: 'Finalçı', third: 'Yarımfinalçı', season: 'Mövsüm' }
  };
  const tx = (host, k) => { const d = TXT[(host.settings && host.settings.lang) || 'ru'] || TXT.ru; return d[k] || TXT.ru[k] || k; };

  // --------------------------------------------------------------- helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const rand = (a, b) => a + Math.random() * (b - a);
  const css = n => '#' + ((n >>> 0) & 0xffffff).toString(16).padStart(6, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function canvasTex(T, w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function glowTexture(T, stops) {
    return canvasTex(T, 64, 64, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      (stops || [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]).forEach(s => r.addColorStop(s[0], s[1]));
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
  }

  // High-dynamic-range studio environment so gold actually reflects something.
  function makeEnvironment(T, renderer) {
    const sc = new T.Scene(); sc.background = new T.Color(0x05070d);
    const panel = (w, h, x, y, z, col, k) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m);
    };
    panel(12, 4, 0, 9, 6, 0xffffff, 7); panel(6, 7, -10, 3, 2, 0xffd7a0, 4.5); panel(6, 7, 10, 3, -2, 0xa8d0ff, 3.5);
    panel(16, 3, 0, 2, -11, 0xffffff, 2.8); panel(4, 12, 7, 5, 9, 0xffffff, 3.2); panel(9, 9, 0, -7, 0, 0x3a2a14, 0.7);
    const pm = new T.PMREMGenerator(renderer);
    const rt = pm.fromScene(sc, 0.03); pm.dispose();
    return rt.texture;
  }

  // ----------------------------------------------------------- trophy kit
  function metals(T, kind) {
    const c = { gold: [0xffc94a, 0xa8741a], silver: [0xe2e7ee, 0x8a93a0], bronze: [0xd48c4c, 0x7a4a24] }[kind] || [0xffc94a, 0xa8741a];
    return {
      main: new T.MeshStandardMaterial({ color: c[0], metalness: 1, roughness: 0.15, envMapIntensity: 1.55, side: T.DoubleSide }),
      dark: new T.MeshStandardMaterial({ color: c[1], metalness: 1, roughness: 0.34, envMapIntensity: 1.2, side: T.DoubleSide }),
      base: new T.MeshStandardMaterial({ color: 0x0b0c10, metalness: 0.45, roughness: 0.2, envMapIntensity: 1.0 }),
      green: new T.MeshStandardMaterial({ color: 0x0b7a4f, metalness: 0.35, roughness: 0.28, envMapIntensity: 1.0 })
    };
  }
  const lathe = (T, pts, seg) => new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg || 64);
  function tube(T, pts, radius, mat, seg) {
    const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2] || 0)));
    return { mesh: new T.Mesh(new T.TubeGeometry(curve, seg || 48, radius, 12, false), mat), curve };
  }
  function pedestal(T, g, m, r) {
    const a = new T.Mesh(new T.CylinderGeometry(r, r * 1.14, 0.14, 56), m.base); a.position.y = 0.07; g.add(a);
    const b = new T.Mesh(new T.CylinderGeometry(r * 0.82, r * 0.94, 0.16, 56), m.main); b.position.y = 0.22; g.add(b);
  }
  function plaque(T, g, lines, y, z) {
    const tex = canvasTex(T, 512, 160, (c, w, h) => {
      c.fillStyle = '#16120a'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#d6a537'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
      c.fillStyle = '#f5d479'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '700 44px Inter, Arial, sans-serif'; c.fillText(String(lines[0] || ''), w / 2, h * 0.36, w - 40);
      c.font = '600 34px Inter, Arial, sans-serif'; c.fillText(String(lines[1] || ''), w / 2, h * 0.7, w - 40);
    });
    const p = new T.Mesh(new T.PlaneGeometry(0.62, 0.19), new T.MeshStandardMaterial({ map: tex, metalness: 0.5, roughness: 0.35 }));
    p.position.set(0, y, z); g.add(p);
  }

  // Classic two-handled cup (league)
  function cupClassic(T, m, o) {
    o = o || {};
    const g = new T.Group(); pedestal(T, g, m, 0.62);
    const wide = o.wide || 1;
    const pts = [[0.001, 0.3], [0.3, 0.3], [0.3, 0.36], [0.16, 0.42], [0.1, 0.55], [0.09, 0.7], [0.16, 0.76], [0.19, 0.82], [0.14, 0.9], [0.09, 0.96], [0.09, 1.08],
      [0.2 * wide, 1.14], [0.42 * wide, 1.3], [0.56 * wide, 1.58], [0.6 * wide, 1.9], [0.58 * wide, 2.04], [0.55 * wide, 2.06], [0.53 * wide, 2.02],
      [0.52 * wide, 1.9], [0.49 * wide, 1.62], [0.38 * wide, 1.4], [0.001, 1.32]];
    g.add(new T.Mesh(lathe(T, pts), m.main));
    const band = new T.Mesh(new T.TorusGeometry(0.565 * wide, 0.028, 12, 72), m.dark); band.rotation.x = Math.PI / 2; band.position.y = 1.55; g.add(band);
    const knot = new T.Mesh(new T.TorusGeometry(0.16, 0.035, 12, 40), m.dark); knot.rotation.x = Math.PI / 2; knot.position.y = 0.82; g.add(knot);
    const hp = o.handle || [[0.57, 1.72], [0.9, 1.88], [1.08, 1.52], [0.88, 1.12], [0.42, 1.3]];
    const h1 = tube(T, hp.map(p => [p[0] * wide, p[1]]), o.handleR || 0.06, m.main).mesh; g.add(h1);
    const h2 = h1.clone(); h2.scale.x = -1; g.add(h2);
    plaque(T, g, o.plaque || ['COWBALL', ''], 0.22, 0.585);
    return g;
  }

  // Horned cup (Horn Cup): handles are real cow horns with tips
  function cupHorn(T, m, o) {
    const g = cupClassic(T, m, { wide: 0.96, handle: [[0.55, 1.45], [0.98, 1.5], [1.22, 1.86], [1.12, 2.34]], handleR: 0.07, plaque: o && o.plaque });
    // replace default handles with horns + tips
    g.children.slice(-3, -1).forEach(h => g.remove(h));
    const pts = [[0.55, 1.45], [0.98, 1.5], [1.22, 1.86], [1.12, 2.34]];
    [1, -1].forEach(side => {
      const t = tube(T, pts.map(p => [p[0] * side, p[1]]), 0.07, m.main);
      g.add(t.mesh);
      const tip = new T.Mesh(new T.ConeGeometry(0.07, 0.3, 16), m.main);
      const end = t.curve.getPoint(1), tan = t.curve.getTangent(1);
      tip.position.copy(end).addScaledVector(tan, 0.12);
      tip.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tan); g.add(tip);
    });
    return g;
  }

  // Wide-bowl cup with big "ear" handles and a ring of stars (Champions-style league cup)
  function cupStars(T, m, o) {
    const g = cupClassic(T, m, { wide: 1.16, handle: [[0.66, 1.9], [1.22, 2.1], [1.42, 1.58], [1.02, 1.14], [0.5, 1.3]], handleR: 0.085, plaque: o && o.plaque });
    const shape = new T.Shape(); const R = 0.11, r = 0.046;
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R; const x = Math.cos(a) * rad, y = Math.sin(a) * rad; i ? shape.lineTo(x, y) : shape.moveTo(x, y); }
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, star = new T.Mesh(geo, m.dark);
      star.position.set(Math.sin(a) * 0.7, 1.7, Math.cos(a) * 0.7); star.rotation.y = a; g.add(star);
    }
    return g;
  }

  // Globe on spiral bodies (World Cup)
  function cupGlobe(T, m, o) {
    const g = new T.Group();
    const bandA = new T.Mesh(new T.CylinderGeometry(0.46, 0.5, 0.16, 56), m.base); bandA.position.y = 0.08; g.add(bandA);
    const bandB = new T.Mesh(new T.CylinderGeometry(0.4, 0.46, 0.14, 56), m.green); bandB.position.y = 0.23; g.add(bandB);
    const bandC = new T.Mesh(new T.CylinderGeometry(0.34, 0.4, 0.1, 56), m.main); bandC.position.y = 0.35; g.add(bandC);
    const bandD = new T.Mesh(new T.CylinderGeometry(0.3, 0.34, 0.12, 56), m.green); bandD.position.y = 0.46; g.add(bandD);
    [0, Math.PI].forEach(a0 => {
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 28, a = a0 + t * Math.PI * 1.05, rad = 0.2 + 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.05)) + 0.05 * t;
        pts.push([Math.cos(a) * rad, 0.5 + t * 1.15, Math.sin(a) * rad]);
      }
      const body = tube(T, pts, 0.1, m.main, 72).mesh; g.add(body);
    });
    const globe = new T.Mesh(new T.SphereGeometry(0.46, 48, 32), m.main); globe.position.y = 1.98; g.add(globe);
    const eq = new T.Mesh(new T.TorusGeometry(0.465, 0.014, 10, 80), m.dark); eq.position.y = 1.98; eq.rotation.x = Math.PI / 2 + 0.4; g.add(eq);
    const mer = new T.Mesh(new T.TorusGeometry(0.465, 0.014, 10, 80), m.dark); mer.position.y = 1.98; mer.rotation.y = 0.5; g.add(mer);
    plaque(T, g, (o && o.plaque) || ['COWBALL', ''], 0.23, 0.405);
    return g;
  }

  // Tall lidded goblet with crown finial and coloured ribbons (domestic leagues)
  function cupCrown(T, m, o) {
    const g = new T.Group(); pedestal(T, g, m, 0.58);
    const pts = [[0.001, 0.3], [0.28, 0.3], [0.28, 0.38], [0.12, 0.46], [0.09, 0.7], [0.14, 0.8], [0.1, 0.9], [0.09, 1.05], [0.26, 1.15], [0.38, 1.5], [0.4, 1.85], [0.36, 1.93],
      [0.3, 1.96], [0.28, 2.05], [0.2, 2.2], [0.1, 2.3], [0.001, 2.34]];
    g.add(new T.Mesh(lathe(T, pts), m.main));
    const rim = new T.Mesh(new T.TorusGeometry(0.36, 0.03, 12, 64), m.dark); rim.rotation.x = Math.PI / 2; rim.position.y = 1.94; g.add(rim);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, spike = new T.Mesh(new T.ConeGeometry(0.035, 0.2, 10), m.main);
      spike.position.set(Math.cos(a) * 0.12, 2.3, Math.sin(a) * 0.12); spike.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(spike);
    }
    const ball = new T.Mesh(new T.SphereGeometry(0.075, 20, 16), m.main); ball.position.y = 2.46; g.add(ball);
    const hp = [[0.37, 1.78], [0.78, 1.92], [0.8, 1.44], [0.4, 1.3]];
    const h1 = tube(T, hp, 0.05, m.main).mesh; g.add(h1); const h2 = h1.clone(); h2.scale.x = -1; g.add(h2);
    const rc = (o && o.accent) || 0x2b8cff, rib = new T.MeshStandardMaterial({ color: rc, roughness: 0.5, metalness: 0.1, side: T.DoubleSide });
    [-1, 1].forEach(s => { const r = new T.Mesh(new T.PlaneGeometry(0.16, 0.85), rib); r.position.set(s * 0.8, 1.05, 0.02); r.rotation.z = s * 0.06; g.add(r); });
    plaque(T, g, (o && o.plaque) || ['COWBALL', ''], 0.22, 0.575);
    return g;
  }

  const BUILDERS = { league: cupClassic, cup: cupHorn, ucl: cupStars, world: cupGlobe };
  const LEAGUE_ACCENT = { premier: 0x50a8ff, laliga: 0xff8759, bundesliga: 0xf04455, seriea: 0x68a8ff, ligue1: 0xad8aff };
  function buildTrophy(T, type, kind, plaqueLines) {
    const m = metals(T, kind || 'gold');
    let g;
    if (type && type.indexOf('league_') === 0) g = cupCrown(T, m, { accent: LEAGUE_ACCENT[type.slice(7)] || 0x2b8cff, plaque: plaqueLines });
    else g = (BUILDERS[type] || cupClassic)(T, m, { plaque: plaqueLines });
    g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    return g;
  }

  // ----------------------------------------------------- cow (captain)
  function makeCow(T, kit, trim) {
    const g = new T.Group();
    const white = new T.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.8 }), black = new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const pink = new T.MeshStandardMaterial({ color: 0xf0a8a8, roughness: 0.7 }), horn = new T.MeshStandardMaterial({ color: 0xeadfc2, roughness: 0.5 });
    const shirt = new T.MeshStandardMaterial({ color: kit, roughness: 0.6 }), tr = new T.MeshStandardMaterial({ color: trim, roughness: 0.6 });
    const body = new T.Mesh(new T.BoxGeometry(0.9, 0.85, 0.7), white); body.position.y = 1.0; g.add(body);
    const jersey = new T.Mesh(new T.BoxGeometry(0.94, 0.62, 0.74), shirt); jersey.position.y = 1.02; g.add(jersey);
    const stripe = new T.Mesh(new T.BoxGeometry(0.96, 0.12, 0.76), tr); stripe.position.y = 1.0; g.add(stripe);
    const head = new T.Mesh(new T.BoxGeometry(0.6, 0.55, 0.55), white); head.position.set(0, 1.78, 0.1); g.add(head);
    const snout = new T.Mesh(new T.BoxGeometry(0.4, 0.24, 0.2), pink); snout.position.set(0, 1.66, 0.43); g.add(snout);
    [-0.09, 0.09].forEach(x => { const n = new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.03), black); n.position.set(x, 1.66, 0.54); g.add(n); });
    [-0.16, 0.16].forEach(x => { const e = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), black); e.position.set(x, 1.86, 0.38); g.add(e); });
    [-1, 1].forEach(s => {
      const h = new T.Mesh(new T.ConeGeometry(0.06, 0.28, 10), horn); h.position.set(s * 0.26, 2.1, 0.1); h.rotation.z = -s * 0.5; g.add(h);
      const ear = new T.Mesh(new T.BoxGeometry(0.2, 0.1, 0.1), black); ear.position.set(s * 0.4, 1.92, 0.1); g.add(ear);
    });
    const spot = new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.02), black); spot.position.set(0.18, 1.1, 0.376); g.add(spot);
    const legs = [];
    [[-0.28, 0.2], [0.28, 0.2], [-0.28, -0.2], [0.28, -0.2]].forEach((p, i) => {
      const l = new T.Mesh(new T.BoxGeometry(0.2, 0.62, 0.2), i < 2 ? white : white); l.position.set(p[0], 0.31, p[1]); g.add(l); legs.push(l);
    });
    g.userData.legs = legs; g.userData.head = head;
    return g;
  }


  // ------------------------------------------------------ particle systems
  function Fireworks(T, scene, glow, max) {
    const geo = new T.BufferGeometry(), pos = new Float32Array(max * 3), col = new Float32Array(max * 3);
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const mat = new T.PointsMaterial({ size: 0.42, map: glow, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    const vel = new Float32Array(max * 3), life = new Float32Array(max), base = new Float32Array(max * 3);
    for (let i = 0; i < max; i++) pos[i * 3 + 1] = -500;
    let head = 0; const rockets = [];
    const rgb = c => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
    function spawn(x, y, z, vx, vy, vz, color, l) {
      const i = head++ % max;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
      life[i] = l; const c = rgb(color); base[i * 3] = c[0]; base[i * 3 + 1] = c[1]; base[i * 3 + 2] = c[2];
    }
    function burst(x, y, z, color, n, speed) {
      n = n || 170; speed = speed || 6.5; const col2 = (color + 0x303030) & 0xffffff;
      for (let i = 0; i < n; i++) {
        const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = speed * (0.45 + Math.random() * 0.55);
        spawn(x, y, z, Math.cos(a) * r * sp, u * sp, Math.sin(a) * r * sp, i % 5 === 0 ? 0xffffff : (i % 2 ? color : col2), 1.4 + Math.random() * 1.0);
      }
    }
    function rocket(x, z, topY, color, delay, onBurst) { rockets.push({ x, z, y: 0.4, topY, color, t: -delay, dur: 1.05, onBurst }); }
    function update(dt) {
      for (let k = rockets.length - 1; k >= 0; k--) {
        const r = rockets[k]; r.t += dt; if (r.t < 0) continue;
        const p = clamp(r.t / r.dur, 0, 1); r.y = 0.4 + (r.topY - 0.4) * (1 - Math.pow(1 - p, 2));
        spawn(r.x + rand(-0.04, 0.04), r.y, r.z, rand(-0.3, 0.3), rand(-1.2, -0.4), rand(-0.3, 0.3), 0xffd79a, 0.45);
        if (p >= 1) { burst(r.x, r.y, r.z, r.color); if (r.onBurst) r.onBurst(); rockets.splice(k, 1); }
      }
      for (let i = 0; i < max; i++) {
        if (life[i] > 0) {
          life[i] -= dt; vel[i * 3 + 1] -= 4.2 * dt; const d = Math.pow(0.18, dt);
          vel[i * 3] *= d; vel[i * 3 + 2] *= d; vel[i * 3 + 1] *= Math.pow(0.5, dt);
          pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
          const f = clamp(life[i] / 0.9, 0, 1);
          col[i * 3] = base[i * 3] * f; col[i * 3 + 1] = base[i * 3 + 1] * f; col[i * 3 + 2] = base[i * 3 + 2] * f;
        } else { col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0; }
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    }
    return { burst, rocket, update };
  }

  function Confetti(T, scene, max) {
    const mesh = new T.InstancedMesh(new T.PlaneGeometry(0.16, 0.09), new T.MeshBasicMaterial({ side: T.DoubleSide, toneMapped: false }), max);
    mesh.frustumCulled = false; scene.add(mesh);
    const p = new Float32Array(max * 3), v = new Float32Array(max * 3), r = new Float32Array(max * 3), sp = new Float32Array(max * 3), life = new Float32Array(max);
    const dummy = new T.Object3D(), color = new T.Color(); let head = 0;
    for (let i = 0; i < max; i++) { dummy.position.set(0, -500, 0); dummy.scale.set(0, 0, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, color.setHex(0xffffff)); }
    function burst(x, y, z, n, palette, dirX) {
      for (let k = 0; k < n; k++) {
        const i = head++ % max;
        p[i * 3] = x + rand(-0.3, 0.3); p[i * 3 + 1] = y; p[i * 3 + 2] = z + rand(-0.3, 0.3);
        v[i * 3] = (dirX || 0) * rand(2, 6) + rand(-2.5, 2.5); v[i * 3 + 1] = rand(6, 13); v[i * 3 + 2] = rand(-3.5, 3.5);
        r[i * 3] = rand(0, 6); r[i * 3 + 1] = rand(0, 6); r[i * 3 + 2] = rand(0, 6);
        sp[i * 3] = rand(-9, 9); sp[i * 3 + 1] = rand(-9, 9); sp[i * 3 + 2] = rand(-9, 9);
        life[i] = rand(3.2, 5.5); mesh.setColorAt(i, color.setHex(palette[(Math.random() * palette.length) | 0]));
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    function update(dt, t) {
      for (let i = 0; i < max; i++) {
        if (life[i] <= 0) { if (life[i] > -1) { dummy.scale.set(0, 0, 0); dummy.position.set(0, -500, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); life[i] = -2; } continue; }
        life[i] -= dt; v[i * 3 + 1] -= 9 * dt; const drag = Math.pow(0.35, dt); v[i * 3] *= drag; v[i * 3 + 2] *= drag; if (v[i * 3 + 1] < -2.2) v[i * 3 + 1] = -2.2;
        p[i * 3] += v[i * 3] * dt + Math.sin(t * 3 + i) * 0.4 * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
        r[i * 3] += sp[i * 3] * dt; r[i * 3 + 1] += sp[i * 3 + 1] * dt; r[i * 3 + 2] += sp[i * 3 + 2] * dt;
        dummy.position.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]); dummy.rotation.set(r[i * 3], r[i * 3 + 1], r[i * 3 + 2]);
        const s = p[i * 3 + 1] < 0.05 ? 0 : 1; dummy.scale.set(s, s, s); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    return { burst, update };
  }

  function Flames(T, scene) {
    const tex = glowTexture(T, [[0, 'rgba(255,245,200,1)'], [0.3, 'rgba(255,160,50,.85)'], [0.7, 'rgba(255,70,10,.35)'], [1, 'rgba(255,40,0,0)']]);
    const pool = []; let head = 0;
    for (let i = 0; i < 70; i++) {
      const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
      s.visible = false; scene.add(s); pool.push({ s, life: 0, max: 1, x: 0, z: 0, y: 0 });
    }
    let columns = [];
    function fire(x, z, seconds) { columns.push({ x, z, left: seconds }); }
    function update(dt) {
      columns.forEach(c => {
        c.left -= dt; if (c.left <= 0) return;
        for (let k = 0; k < 2; k++) { const f = pool[head++ % pool.length]; f.life = f.max = rand(0.7, 1.2); f.x = c.x + rand(-0.12, 0.12); f.z = c.z + rand(-0.12, 0.12); f.y = 0.2; }
      });
      columns = columns.filter(c => c.left > 0);
      pool.forEach(f => {
        if (f.life <= 0) { f.s.visible = false; return; }
        f.life -= dt; const p = 1 - f.life / f.max; f.y += dt * (3.2 + p * 1.5);
        f.s.visible = true; f.s.position.set(f.x + Math.sin(p * 9 + f.x) * 0.08, f.y, f.z);
        const sc = 0.55 + p * 1.25; f.s.scale.set(sc, sc * 1.5, 1); f.s.material.opacity = (1 - p) * 0.95;
      });
    }
    return { fire, update };
  }

  function Crowd(T, scene, glow, accent) {
    const N = 2100, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), base = new Float32Array(N * 3), flash = new Float32Array(N);
    const palette = [0xffe6b0, 0xfff4d6, 0xbcd8ff, 0xffffff, accent, 0xff9d5c];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, rr = 15 + Math.random() * 18, y = (rr - 14) * 0.8 + 0.4;
      pos[i * 3] = Math.cos(a) * (rr - 0.25); pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * (rr - 0.25);
      const c = new T.Color(palette[(Math.random() * palette.length) | 0]);
      base[i * 3] = c.r; base[i * 3 + 1] = c.g; base[i * 3 + 2] = c.b;
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ size: 0.3, map: glow, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    pts.frustumCulled = false; scene.add(pts);
    let energy = 0.25;
    function update(dt) {
      for (let k = 0; k < 40 + energy * 120; k++) flash[(Math.random() * N) | 0] = 1;
      for (let i = 0; i < N; i++) {
        flash[i] = Math.max(0, flash[i] - dt * 2.6); const f = 0.12 + 0.2 * energy + flash[i] * (0.5 + energy * 0.9);
        col[i * 3] = base[i * 3] * f; col[i * 3 + 1] = base[i * 3 + 1] * f; col[i * 3 + 2] = base[i * 3 + 2] * f;
      }
      geo.attributes.color.needsUpdate = true;
    }
    return { update, setEnergy: e => { energy = e; } };
  }

  function Beams(T, scene, colors) {
    const list = [];
    colors.forEach((c, i) => {
      const geo = new T.ConeGeometry(2.1, 34, 28, 1, true); geo.translate(0, -17, 0);
      const mesh = new T.Mesh(geo, new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.085, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
      mesh.rotation.x = -Math.PI / 2;
      const pivot = new T.Group(), a = i / colors.length * Math.PI * 2, R = 27;
      pivot.position.set(Math.cos(a) * R, 15, Math.sin(a) * R); pivot.add(mesh); scene.add(pivot);
      const lamp = new T.Mesh(new T.BoxGeometry(2.4, 1.2, 0.5), new T.MeshBasicMaterial({ color: 0xfff3d0, toneMapped: false }));
      lamp.position.copy(pivot.position); lamp.lookAt(0, 0, 0); scene.add(lamp);
      const pole = new T.Mesh(new T.CylinderGeometry(0.28, 0.4, 15, 10), new T.MeshStandardMaterial({ color: 0x141a26, roughness: 0.8 }));
      pole.position.set(pivot.position.x, 7.5, pivot.position.z); scene.add(pole);
      list.push({ pivot, a, mesh });
    });
    const target = new T.Vector3();
    function update(t, intensity) {
      list.forEach((b, i) => {
        target.set(Math.sin(t * 0.55 + i * 1.7) * 7, 0, Math.cos(t * 0.43 + i * 2.3) * 7); b.pivot.lookAt(target);
        b.mesh.material.opacity = 0.05 + 0.08 * intensity;
      });
    }
    return { update };
  }

  function bannerTexture(T, team) {
    return canvasTex(T, 256, 384, (c, w, h) => {
      const c1 = css(team.c1 == null ? 0x3366cc : team.c1), c2 = css(team.c2 == null ? 0xffffff : team.c2);
      const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, '#0a0f1a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = c2; c.globalAlpha = 0.9; c.fillRect(0, h * 0.62, w, 14); c.fillRect(0, h * 0.62 + 24, w, 6); c.globalAlpha = 1;
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '110px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.fillText(team.nation ? (team.flag || '🏳️') : '🐄', w / 2, h * 0.27);
      c.font = '800 62px Unbounded, Inter, Arial, sans-serif'; c.shadowColor = '#000'; c.shadowBlur = 10; c.fillText(String(team.code || (team.name || '').slice(0, 3)).toUpperCase(), w / 2, h * 0.5);
      c.shadowBlur = 0; c.font = '700 26px Inter, Arial, sans-serif'; c.fillText(String(team.name || ''), w / 2, h * 0.78, w - 24);
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 6; c.strokeRect(5, 5, w - 10, h - 10);
    });
  }
  function Banner(T, scene, team, x, z, faceAng, height) {
    const g = new T.Group(); g.position.set(x, 0, z);
    const pole = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, 4.2, 10), new T.MeshStandardMaterial({ color: 0xcaa14a, metalness: 1, roughness: 0.25 })); pole.position.y = 2.1; g.add(pole);
    const knob = new T.Mesh(new T.SphereGeometry(0.09, 14, 10), new T.MeshStandardMaterial({ color: 0xffd36a, metalness: 1, roughness: 0.2 })); knob.position.y = 4.28; g.add(knob);
    const geo = new T.PlaneGeometry(1.15, 1.7, 8, 12), orig = geo.attributes.position.array.slice();
    const cloth = new T.Mesh(geo, new T.MeshBasicMaterial({ map: bannerTexture(T, team), side: T.DoubleSide, toneMapped: false }));
    cloth.position.set(0.62, height || 3.2, 0); g.add(cloth); g.rotation.y = faceAng; g.scale.set(0.001, 0.001, 0.001); scene.add(g);
    const phase = Math.random() * 6;
    return {
      group: g, appear: 0,
      update(dt, t) {
        this.appear = Math.min(1, this.appear + dt * 0.0); const s = Math.max(0.001, this.k || 0); g.scale.set(s, s, s);
        const p = geo.attributes.position.array;
        for (let i = 0; i < p.length; i += 3) { const y = orig[i + 1], dep = (0.85 - y) / 1.7; p[i + 2] = Math.sin(y * 3.2 + t * 3.2 + phase + orig[i] * 2) * 0.09 * dep; }
        geo.attributes.position.needsUpdate = true;
      }
    };
  }

  function accentFor(type) {
    if (type && type.indexOf('league_') === 0) return LEAGUE_ACCENT[type.slice(7)] || 0x2b8cff;
    return { league: 0x7fd7ff, cup: 0xffb347, ucl: 0x4a7dff, world: 0x2ecc71 }[type] || 0xffd24a;
  }

  // ------------------------------------------------------------- the show
  let active = null;

  function run(host, comp, mode) {
    if (active) return false;
    const T = window.THREE;
    if (!T || !comp || !host) return false;
    try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (_) { window.__cbLog && window.__cbLog(_); }
    if (host.settings && host.settings.uiAnim === 'off') return false;

    const C = host.COMPS[comp.type] || { name: 'Cowball', icon: '🏆' };
    const myTeam = host.teamById(comp.my), isOpening = mode === 'open';
    const CUE = isOpening ? { reveal: 4.8, beat: 2.4, end: 26.8 } : { reveal: 10.9, peak: 21.8, beat: 2.727, end: 31.5 };

    // ---- DOM
    const root = document.createElement('div'); root.id = 'cbCeremony'; root.className = 'cbc ' + (isOpening ? 'cbcOpen' : 'cbcClose');
    root.innerHTML = '<canvas class="cbcCanvas"></canvas><div class="cbcVig"></div><div class="cbcFlash"></div><div class="cbcBar cbcBarT"></div><div class="cbcBar cbcBarB"></div>' +
      '<div class="cbcTitle"><div class="cbcKick"></div><h1 class="cbcHead"></h1><p class="cbcSub"></p></div>' +
      '<div class="cbcCards"></div><div class="cbcChamp"></div><button class="cbcSkip" type="button"></button>';
    document.body.appendChild(root);
    const $ = s => root.querySelector(s);
    const els = { canvas: $('.cbcCanvas'), flash: $('.cbcFlash'), kick: $('.cbcKick'), head: $('.cbcHead'), sub: $('.cbcSub'), cards: $('.cbcCards'), champ: $('.cbcChamp'), skip: $('.cbcSkip') };
    els.skip.textContent = tx(host, 'skip');
    const show = (el, on) => el.classList.toggle('on', !!on);
    const flash = (k) => { els.flash.style.transition = 'none'; els.flash.style.opacity = String(k || 0.85); void els.flash.offsetWidth; els.flash.style.transition = 'opacity 1.1s ease-out'; els.flash.style.opacity = '0'; };

    // ---- renderer
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: els.canvas, antialias: true, powerPreference: 'high-performance' });
      if (!renderer.getContext()) throw new Error('no webgl');
    } catch (e) { root.remove(); return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, (host.settings && host.settings.powerSave) ? 1 : 1.75));
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    const scene = new T.Scene(); scene.background = new T.Color(0x03050a); scene.fog = new T.FogExp2(0x03050a, 0.011);
    const camera = new T.PerspectiveCamera(42, 1, 0.1, 160);

    let finished = false, raf = 0, t = 0, last = 0, endT = CUE.end;
    const audio = host.audio, S = host.settings || {};
    const musicOn = S.musicEnabled !== false && Number(S.vMusic) !== 0;
    audio.busy(true);

    function fail(e) { try { console.warn('Cowball ceremony stopped:', e); } catch (_) { window.__cbLog && window.__cbLog(_); } finish(true); }

    // ---- stage
    const accentBase = isOpening ? accentFor(comp.type) : ((host.teamById(comp.champion) || {}).c1 || accentFor(comp.type));
    const env = makeEnvironment(T, renderer); scene.environment = env;
    scene.add(new T.AmbientLight(0x31405c, 0.6));
    const key = new T.SpotLight(0xfff2d0, 3.4, 44, 0.46, 0.7, 1.1); key.position.set(0, 15, 6); key.target.position.set(0, 1.6, 0); scene.add(key); scene.add(key.target);
    const rimL = new T.PointLight(0x6aa8ff, 1.7, 26); rimL.position.set(-6, 4, -6); scene.add(rimL);
    const rimR = new T.PointLight(accentBase, 2.0, 24); rimR.position.set(6, 3.5, 5); scene.add(rimR);

    const platTop = new T.Mesh(new T.CylinderGeometry(7.6, 7.9, 0.35, 72), new T.MeshStandardMaterial({ color: 0x10151f, metalness: 0.7, roughness: 0.32 })); platTop.position.y = -0.175; scene.add(platTop);
    const ringMat = new T.MeshBasicMaterial({ color: accentBase, toneMapped: false });
    const ring = new T.Mesh(new T.RingGeometry(6.55, 6.95, 96), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; scene.add(ring);
    const ring2 = new T.Mesh(new T.RingGeometry(3.6, 3.68, 96), new T.MeshBasicMaterial({ color: 0xffd36a, toneMapped: false, transparent: true, opacity: 0.7 })); ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.014; scene.add(ring2);
    const bowl = new T.Mesh(new T.CylinderGeometry(34, 14, 16, 72, 1, true), new T.MeshStandardMaterial({ color: 0x0a0e18, roughness: 1, metalness: 0, side: T.BackSide })); bowl.position.y = 8; scene.add(bowl);
    const ground = new T.Mesh(new T.CircleGeometry(40, 48), new T.MeshStandardMaterial({ color: 0x070a11, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.4; scene.add(ground);

    const glow = glowTexture(T);
    const crowd = Crowd(T, scene, glow, accentBase);
    const beams = Beams(T, scene, [0xbfe0ff, accentBase, 0xffe2a0, 0xbfe0ff, accentBase, 0xffe2a0, 0xffffff, accentBase]);
    const fw = Fireworks(T, scene, glow, 3600), conf = Confetti(T, scene, 520), flames = Flames(T, scene);
    const glowSprite = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xffd36a, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
    glowSprite.scale.set(7, 7, 1); scene.add(glowSprite);

    const events = []; const at = (time, fn) => events.push({ t: time, fn, done: false });
    const teamFirework = (n, palette, delay0) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, rr = rand(4, 11), c = palette[(Math.random() * palette.length) | 0];
        fw.rocket(Math.cos(a) * rr, Math.sin(a) * rr - 2, rand(8, 15), c, (delay0 || 0) + i * rand(0.12, 0.3), i === 0 ? () => audio.play('fireworks-burst', 0.7) : null);
      }
    };
    const confettiBlast = (palette, n) => { [-1, 1].forEach(s => conf.burst(s * 5.2, 0.4, 2.2, n || 130, palette, -s)); conf.burst(0, 6, 0, 80, palette, 0); audio.play('confetti-cannon', 0.8); };
    const pyro = (secs) => { [-1, 1].forEach(s => { flames.fire(s * 5.0, 1.4, secs); flames.fire(s * 5.8, -0.6, secs); }); audio.play('pyro-flame', 0.7); };

    const palette = [(myTeam && myTeam.c1) || 0xffd24a, (myTeam && myTeam.c2) || 0xffffff, 0xffd24a, 0xffffff, accentBase];
    let trophy = null, trophyRise = null, camMode = 0, update2 = null;

    if (isOpening) setupOpening(); else setupClosing();

    // ================= OPENING =================
    function setupOpening() {
      const ids = (comp.ids || []).slice(0, 8), teams = ids.map(id => host.teamById(id)).filter(Boolean);
      const rise = new T.Group(); rise.position.y = -4; scene.add(rise); trophyRise = rise;
      trophy = buildTrophy(T, comp.type, 'gold', [String(C.name || 'Cowball').slice(0, 22), 'COWBALL · 27']); trophy.scale.setScalar(1.55); rise.add(trophy);
      const banners = teams.map((tm, i) => {
        const a = i / Math.max(1, teams.length) * Math.PI * 2 + Math.PI / teams.length, R = 5.6;
        const b = Banner(T, scene, tm, Math.cos(a) * R, Math.sin(a) * R, Math.atan2(-Math.cos(a), -Math.sin(a)), 3.0); b.k = 0; return b;
      });
      const kickText = (C.icon || '🏆') + ' ' + (C.name || '');
      at(0.2, () => { audio.play('crowd-cheer', 0.5); if (musicOn) audio.track('ceremonyOpen'); });
      at(0.9, () => { els.kick.textContent = kickText; show(els.kick, true); audio.play('pa-chime', 0.55); });
      at(1.5, () => { els.head.textContent = tx(host, 'openTitle'); show(els.head, true); });
      at(2.7, () => { els.sub.textContent = teams.length + ' ' + tx(host, 'teams') + (host.settings && host.settings.career && comp.type === 'league' ? ' · ' + tx(host, 'season') + ' ' + (host.settings.career.season || 1) : ''); show(els.sub, true); });
      at(2.4, () => audio.play('trophy-reveal', 0.9));
      at(3.5, () => { fw.rocket(-3, -4, 11, palette[0], 0); fw.rocket(3, -4, 12, palette[1], 0.35); audio.play('fireworks-launch', 0.6); });
      at(CUE.reveal, () => {
        flash(0.95); crowd.setEnergy(0.9); pyro(2.4); confettiBlast(palette, 160); audio.play('crowd-roar-big', 0.9);
        teamFirework(6, palette, 0); audio.play('fireworks-launch', 0.5);
      });
      at(5.7, () => audio.play('trophy-lift', 0.8));
      for (let k = 1; k <= 8; k++) at(CUE.reveal + k * CUE.beat - 0.95, () => { teamFirework(3 + (k % 3), palette, 0); audio.play('fireworks-launch', 0.45); });
      teams.forEach((tm, i) => at(6.2 + i * 0.5, () => { banners[i].grow = 1; }));
      at(11.5, () => { els.head.classList.add('small'); });
      at(12.0, () => audio.play('crowd-chant', 0.5));
      at(21.5, () => { els.sub.textContent = tx(host, 'kickoff'); els.sub.classList.add('go'); els.head.classList.remove('on'); });
      at(24.0, () => { flash(0.8); confettiBlast(palette, 200); teamFirework(8, palette, 0); audio.play('crowd-applause', 0.7); pyro(1.6); });
      at(CUE.end - 0.6, () => { root.classList.add('out'); });

      update2 = (dt) => {
        banners.forEach(b => { if (b.grow) b.k = Math.min(1, (b.k || 0) + dt * 1.6); b.update(dt, t); });
        if (trophyRise) {
          const p = easeOut((t - CUE.reveal) / 2.4); trophyRise.position.y = -4 + 4 * p;
          trophy.rotation.y = t * (0.35 + 0.25 * p);
          glowSprite.position.set(0, 1.9 + (trophyRise.position.y + 4) * 0.0, 0); glowSprite.material.opacity = 0.55 * p * (0.8 + 0.2 * Math.sin(t * 3));
        }
        const pulse = t >= CUE.reveal ? Math.max(0, 1 - ((t - CUE.reveal) % CUE.beat) / 0.45) : 0.25;
        ringMat.color.setHex(accentBase).multiplyScalar(0.5 + 0.9 * pulse); beams.update(t, t >= CUE.reveal ? 1 : 0.35);
        // camera
        if (t < CUE.reveal) {
          const p = t / CUE.reveal; camera.position.set(Math.sin(p * 0.9) * 2.2, 0.9 + p * 1.4, 13 - p * 3); camera.lookAt(0, 6 + p * 0.5 - p * 4, 0);
        } else {
          const q = t - CUE.reveal, ang = 0.4 + q * 0.2, rad = 9.8 - Math.min(3.4, q * 0.3); camera.position.set(Math.sin(ang) * rad, 2.2 + Math.sin(q * 0.45) * 0.7 + 0.5, Math.cos(ang) * rad); camera.lookAt(0, 1.7, 0);
        }
      };
    }

    // ================= CLOSING =================
    function setupClosing() {
      const champId = comp.champion, ko = (comp.rounds || []).filter(r => r.ko), stageOf = r => r.stage || ({ 'Финал': 'final', '1/2 финала': 'sf' })[r.name], fin = ko.find(r => stageOf(r) === 'final');
      let secondId = null, thirdId = null;
      if (fin && fin.matches[0]) {
        const m = fin.matches[0]; secondId = m.a === champId ? m.b : m.a;
        const sf = ko.find(r => stageOf(r) === 'sf');
        if (sf) { const losers = sf.matches.map(x => (x.a === host.matchWinner(x) ? x.b : x.a)); thirdId = losers[0] || null; }
      } else {
        const st = host.compStandings(comp, 'L') || [], rest = st.map(x => x.id).filter(id => id !== champId); secondId = rest[0] || null; thirdId = rest[1] || null;
      }
      const champ = host.teamById(champId) || myTeam, second = secondId && host.teamById(secondId), third = thirdId && host.teamById(thirdId);
      const human = champId === comp.my;
      const steps = [
        { team: champ, x: 0, h: 1.7, n: '1', kind: 'gold', delay: 2.0 },
        { team: second, x: -2.7, h: 1.2, n: '2', kind: 'silver', delay: 1.5 },
        { team: third, x: 2.7, h: 0.85, n: '3', kind: 'bronze', delay: 1.0 }
      ].filter(s => s.team);
      const stepObjs = steps.map(s => {
        const g = new T.Group(); g.position.set(s.x, 0, 0);
        const box = new T.Mesh(new T.BoxGeometry(2.4, s.h, 2.0), new T.MeshStandardMaterial({ color: 0x151b28, metalness: 0.55, roughness: 0.3 })); box.position.y = s.h / 2; g.add(box);
        const topC = (s.team.c1 == null ? 0x3366cc : s.team.c1), top = new T.Mesh(new T.BoxGeometry(2.44, 0.08, 2.04), new T.MeshStandardMaterial({ color: topC, metalness: 0.4, roughness: 0.3, emissive: topC, emissiveIntensity: 0.25 })); top.position.y = s.h; g.add(top);
        const numTex = canvasTex(T, 128, 128, (c, w, h) => { c.fillStyle = '#d9a93a'; c.font = '800 96px Unbounded, Inter, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.n, w / 2, h / 2 + 4); });
        const plate = new T.Mesh(new T.PlaneGeometry(0.9, 0.9), new T.MeshBasicMaterial({ map: numTex, transparent: true, toneMapped: false })); plate.position.set(0, s.h / 2, 1.02); g.add(plate);
        g.scale.y = 0.001; scene.add(g);
        const cup = buildTrophy(T, comp.type, s.kind, [String(C.name || 'Cowball').slice(0, 22), s.kind === 'gold' ? 'COWBALL · 27' : (s.kind === 'silver' ? tx(host, 'silver') : tx(host, 'bronze'))]);
        const sc = s.kind === 'gold' ? 1.2 : (s.kind === 'silver' ? 0.66 : 0.58); cup.scale.setScalar(sc); cup.position.set(s.x, 0, 0.1); cup.visible = false; scene.add(cup);
        const cow = makeCow(T, topC, s.team.c2 == null ? 0xffffff : s.team.c2); cow.scale.setScalar(s.kind === 'gold' ? 1 : 0.8); cow.position.set(s.x, s.h, -0.75); cow.rotation.y = 0; cow.visible = false; scene.add(cow);
        const bn = Banner(T, scene, s.team, s.x, -1.6, 0, 3.2 + (s.kind === 'gold' ? 0.6 : 0)); bn.k = 0;
        return { s, g, cup, cow, bn, shown: false, lift: 0 };
      });
      trophy = (stepObjs[0] || {}).cup;
      const gold = stepObjs[0];

      at(0.2, () => { if (musicOn) audio.track('ceremonyClose'); });
      at(0.8, () => { els.kick.textContent = (C.icon || '🏆') + ' ' + (C.name || ''); show(els.kick, true); });
      at(1.4, () => { els.head.textContent = tx(host, 'closeTitle'); show(els.head, true); });
      stepObjs.forEach(o => at(o.s.delay, () => { o.shown = true; }));
      const card = (o, labelKey, medal) => '<div class="cbcCard" style="--c:' + css(o.team.c1 == null ? 0x3366cc : o.team.c1) + '"><i>' + medal + '</i><div><b>' + esc(o.team.name) + '</b><small>' + esc(tx(host, labelKey)) + '</small></div></div>';
      at(3.2, () => audio.play('crowd-applause', 0.45));
      const second_ = stepObjs.find(o => o.s.n === '2'), third_ = stepObjs.find(o => o.s.n === '3');
      if (third_) at(4.4, () => { third_.cup.visible = true; third_.cow.visible = true; third_.bn.grow = 1; els.cards.insertAdjacentHTML('beforeend', card({ team: third_.s.team }, 'third', '🥉')); audio.play('trophy-lift', 0.5); });
      if (second_) at(6.0, () => { second_.cup.visible = true; second_.cow.visible = true; second_.bn.grow = 1; els.cards.insertAdjacentHTML('afterbegin', card({ team: second_.s.team }, 'second', '🥈')); audio.play('trophy-lift', 0.55); });
      at(8.4, () => { audio.play('trophy-reveal', 0.9); els.sub.textContent = ''; });
      at(8.5, () => { els.head.classList.remove('on'); els.kick.classList.remove('on'); });
      at(CUE.reveal - 0.2, () => { if (gold) { gold.cup.visible = true; gold.cow.visible = true; gold.bn.grow = 1; } });
      at(CUE.reveal, () => {
        flash(0.95); crowd.setEnergy(0.95); pyro(3.0); confettiBlast(palette.length ? [champ.c1 == null ? 0xffd24a : champ.c1, champ.c2 == null ? 0xffffff : champ.c2, 0xffd24a, 0xffffff] : palette, 190); audio.play('crowd-roar-big', 0.95);
        teamFirework(8, [champ.c1 == null ? 0xffd24a : champ.c1, champ.c2 == null ? 0xffffff : champ.c2, 0xffd24a], 0); audio.play('fireworks-launch', 0.5);
        els.champ.innerHTML = '<small>' + esc(tx(host, human ? 'youChamp' : 'champion')) + '</small><b style="--c:' + css(champ.c1 == null ? 0xffd24a : champ.c1) + '">' + esc((champ.nation ? (champ.flag || '') + ' ' : '🐄 ') + champ.name) + '</b><em>' + esc(tx(host, 'winnerOf')) + ' · ' + esc(C.name || '') + '</em>';
        show(els.champ, true); if (gold) gold.lifting = true;
      });
      at(12.2, () => audio.play('trophy-lift', 0.9));
      at(14.5, () => { if (human) { els.sub.textContent = '✔ ' + tx(host, 'added'); show(els.sub, true); } });
      for (let k = 1; k <= 7; k++) at(CUE.reveal + k * CUE.beat - 0.95, () => { teamFirework(3 + (k % 4), [champ.c1 == null ? 0xffd24a : champ.c1, champ.c2 == null ? 0xffffff : champ.c2, 0xffd24a], 0); audio.play('fireworks-launch', 0.45); });
      at(CUE.peak, () => { flash(0.8); confettiBlast(palette, 220); teamFirework(10, palette, 0); pyro(2.0); audio.play('crowd-roar-big', 0.8); });
      at(25.0, () => audio.play('crowd-applause', 0.7));
      at(CUE.end - 0.7, () => { root.classList.add('out'); });

      update2 = (dt) => {
        stepObjs.forEach(o => {
          const p = o.shown ? easeOut((t - o.s.delay) / 1.2) : 0; o.g.scale.y = Math.max(0.001, p); o.g.position.y = 0;
          o.cup.position.y = o.s.h * p + (o.lifting ? 0 : 0); o.cow.position.y = o.s.h * p;
          if (o.bn.grow) o.bn.k = Math.min(1, (o.bn.k || 0) + dt * 1.6); o.bn.update(dt, t);
          if (o.lifting) {
            o.lift = Math.min(1, o.lift + dt / 1.6); const e = easeOut(o.lift); o.cup.position.y = o.s.h + 0.35 + 0.85 * e + Math.sin(t * 2.2) * 0.05; o.cup.position.z = 0.1 + 0.4 * e;
            o.cup.rotation.y = t * 0.9; o.cow.position.y = o.s.h + Math.abs(Math.sin(t * 5.5)) * 0.32 * e; o.cow.userData.legs.slice(0, 2).forEach(l => { l.rotation.x = -1.3 * e; l.position.z = 0.2 + 0.2 * e; l.position.y = 0.45 + 0.1 * e; });
          } else { o.cup.rotation.y = Math.sin(t * 0.6 + o.s.x) * 0.5; }
        });
        if (gold && gold.lifting) { glowSprite.position.set(0, gold.s.h + 1.9, 0.5); glowSprite.material.opacity = 0.6 * easeOut(gold.lift) * (0.8 + 0.2 * Math.sin(t * 3)); }
        const pulse = t >= CUE.reveal ? Math.max(0, 1 - ((t - CUE.reveal) % CUE.beat) / 0.45) : 0.2;
        ringMat.color.setHex(accentBase).multiplyScalar(0.45 + 0.9 * pulse); beams.update(t, t >= CUE.reveal ? 1 : 0.35);
        key.target.position.set(0, 2, 0); key.intensity = 3.0 + (t >= CUE.reveal ? 1.6 * pulse : 0);
        if (t < CUE.reveal) {
          const p = t / CUE.reveal; camera.position.set(Math.sin(t * 0.25) * 1.2, 3.4 - p * 0.9, 15 - p * 4.6); camera.lookAt(0, 1.4, 0);
        } else {
          const q = t - CUE.reveal, fast = t >= CUE.peak ? 1.8 : 1, ang = Math.sin(q * 0.28 * fast) * 1.0, rad = (t >= CUE.peak ? 7.4 : 9.4) - Math.min(1.6, q * 0.12);
          camera.position.set(Math.sin(ang) * rad, 2.5 + Math.sin(q * 0.5) * 0.6, Math.cos(ang) * rad); camera.lookAt(0, 2.1, 0);
        }
      };
    }

    // ---- loop
    function resize() {
      const w = Math.max(2, root.clientWidth || window.innerWidth), h = Math.max(2, root.clientHeight || window.innerHeight);
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < 1 ? 62 : 42; camera.updateProjectionMatrix();
    }
    const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(false); } };
    window.addEventListener('resize', resize); document.addEventListener('keydown', onKey, true);
    els.skip.addEventListener('click', e => { e.stopPropagation(); finish(false); });
    resize();

    function frame(now) {
      if (finished) return;
      raf = requestAnimationFrame(frame);
      try {
        const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
        if (document.hidden) return;
        t += dt;
        events.forEach(ev => { if (!ev.done && t >= ev.t) { ev.done = true; try { ev.fn(); } catch (e) { console.warn('ceremony event', e); } } });
        if (update2) update2(dt);
        crowd.update(dt); fw.update(dt); conf.update(dt, t); flames.update(dt);
        rimL.intensity = 1.4 + Math.sin(t * 1.3) * 0.4; rimR.position.x = Math.sin(t * 0.5) * 7; rimR.position.z = Math.cos(t * 0.5) * 6;
        renderer.render(scene, camera);
        if (t >= endT) finish(false);
      } catch (e) { fail(e); }
    }

    function finish(error) {
      if (finished) return; finished = true; active = null;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey, true);
      try { ['crowd-roar-big', 'crowd-applause', 'crowd-chant', 'trophy-reveal', 'trophy-lift', 'fireworks-burst', 'fireworks-launch', 'pyro-flame', 'confetti-cannon', 'pa-chime', 'crowd-cheer'].forEach(n => audio.stop(n)); } catch (_) { window.__cbLog && window.__cbLog(_); }
      try { audio.stopTrack(error ? 0 : 900); } catch (_) { window.__cbLog && window.__cbLog(_); }
      setTimeout(() => { if (active) return; try { audio.busy(false); host.resumeMusic(); } catch (_) { window.__cbLog && window.__cbLog(_); } }, error ? 60 : 950);   // never unlock the menu soundtrack if another ceremony has started meanwhile
      root.classList.add('out');
      setTimeout(() => {
        try {
          scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); });
          if (env && env.dispose) env.dispose(); renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss();
        } catch (_) { window.__cbLog && window.__cbLog(_); }
        root.remove(); active = null;
      }, 520);
    }

    active = { finish };
    raf = requestAnimationFrame(frame);
    return true;
  }

  window.CowballCeremony = {
    opening(host, comp) { return run(host, comp, 'open'); },
    closing(host, comp) { return run(host, comp, 'close'); },
    skip() { if (active) active.finish(false); },
    isActive() { return !!active; },
    buildTrophy   // exposed so the Trophy Room (or tests) can reuse the 3D cups
  };
})();
