// Escena 3D del Arca: mar animado, barco low-poly, animales como sprites e islas que pasan.
import * as THREE from './lib/three.module.min.js';

const S = { crew: {}, t: 0, amp: 0.35, phase: -1, islands: [] };

function emojiTex(emoji, name, dead) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 300;
  const g = c.getContext('2d');
  g.font = '170px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 6;
  g.fillText(emoji, 128, 120);
  g.shadowColor = 'transparent';
  g.font = 'bold 40px Nunito, system-ui, sans-serif';
  const w = Math.min(240, g.measureText(name).width + 28);
  g.fillStyle = dead ? 'rgba(20,40,90,.75)' : 'rgba(0,0,0,.55)';
  g.beginPath(); g.roundRect(128 - w / 2, 236, w, 54, 18); g.fill();
  g.fillStyle = '#fff'; g.fillText(name, 128, 264, 220);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function buildBoat() {
  const boat = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5228, roughness: .8, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x5b3419, roughness: .9, flatShading: true });
  const light = new THREE.MeshStandardMaterial({ color: 0xc89060, roughness: .8, flatShading: true });
  const shape = new THREE.Shape();
  shape.moveTo(-6.2, 1.1); shape.lineTo(7.4, 1.3); shape.quadraticCurveTo(6.6, -0.4, 5.2, -1.1); shape.lineTo(-4.8, -1.1); shape.quadraticCurveTo(-6, -0.2, -6.2, 1.1);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 4.2, bevelEnabled: true, bevelSize: .25, bevelThickness: .4, bevelSegments: 2 }), wood);
  hull.position.z = -2.1; boat.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(12.6, .22, 5.1), dark); stripe.position.set(0.6, .55, 0); boat.add(stripe);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(12.4, .2, 4.4), light); deck.position.set(0.5, 1.15, 0); boat.add(deck);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(12.6, .5, .18), dark); rail.position.set(.5, 1.5, 2.2); boat.add(rail);
  const rail2 = rail.clone(); rail2.position.z = -2.2; boat.add(rail2);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 2.6), wood); cabin.position.set(-4.6, 2, 0); boat.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, .25, 3), dark); roof.position.set(-4.6, 2.9, 0); boat.add(roof);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.14, .18, 8.5, 8), dark); mast.position.set(1, 5.3, -.6); boat.add(mast);
  const sailGeo = new THREE.PlaneGeometry(4.6, 5.2, 10, 10);
  const sp = sailGeo.attributes.position; for (let i = 0; i < sp.count; i++) { const x = sp.getX(i); sp.setZ(i, Math.cos(x / 2.3 * Math.PI / 2) * .7); }
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xfff6e0, side: THREE.DoubleSide, flatShading: true }));
  sail.position.set(3.3, 5.6, -.6); boat.add(sail); S.sail = sail;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .7, 6, 2), new THREE.MeshStandardMaterial({ color: 0xff5d8f, side: THREE.DoubleSide }));
  flag.position.set(1.65, 9.2, -.6); boat.add(flag); S.flag = flag;
  const portM = new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0x553300, emissiveIntensity: .4 });
  for (const x of [-2.5, 0, 2.5, 5]) { const p = new THREE.Mesh(new THREE.CircleGeometry(.28, 16), portM); p.position.set(x, .05, 2.36); boat.add(p); }
  return boat;
}

function buildIsland(kind) {
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 1.4, 9), new THREE.MeshStandardMaterial({ color: 0xf2d39a, flatShading: true })); g.add(sand);
  const colors = [0x4caf50, 0x3f9d4a, 0x2e7d32, 0x6d6d6d, 0x8bc34a, 0x43a047, 0x558b2f, 0x5d4037, 0x9e9e9e, 0x66bb6a];
  const hill = new THREE.Mesh(new THREE.ConeGeometry(4.5, 5 + (kind % 3) * 2, 7), new THREE.MeshStandardMaterial({ color: colors[kind % 10], flatShading: true }));
  hill.position.y = 3; g.add(hill);
  if (kind === 7) { const lava = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 7), new THREE.MeshStandardMaterial({ color: 0xff5722, emissive: 0xff3d00, emissiveIntensity: .8 })); lava.position.y = 6.5 + 2; g.add(lava); }
  if (kind === 8) { const tower = new THREE.Mesh(new THREE.CylinderGeometry(.6, 1, 7, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })); tower.position.set(3, 4, 2); g.add(tower); const lamp = new THREE.PointLight(0xfff3a0, 30, 40); lamp.position.set(3, 8, 2); g.add(lamp); }
  for (let i = 0; i < 3; i++) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.15, .22, 3, 5), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
    const a = i * 2.1 + kind; trunk.position.set(Math.cos(a) * 5, 1.8, Math.sin(a) * 5); trunk.rotation.z = .2; g.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.3, .8, 6), new THREE.MeshStandardMaterial({ color: 0x2e7d32, flatShading: true }));
    leaves.position.set(trunk.position.x + .3, 3.4, trunk.position.z); g.add(leaves);
  }
  return g;
}

function waveH(x, z, t) { return S.amp * (Math.sin(x * .18 + t * 1.2) + Math.sin(z * .23 + t * .9) * .7 + Math.sin((x + z) * .35 + t * 1.7) * .35); }

function deckSlot(i, n) {
  const perRow = Math.max(6, Math.ceil(n / 3)); const row = Math.floor(i / perRow), col = i % perRow;
  const cnt = Math.min(perRow, n - row * perRow);
  return new THREE.Vector3(-3 + (col - (cnt - 1) / 2) * Math.min(1.25, 9.5 / perRow) + 3.4, 1.25, 1.3 - row * 1.15);
}

function init(container) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(2, devicePixelRatio)); r.setSize(innerWidth, innerHeight);
  r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  container.appendChild(r.domElement);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xbfe6ff, 60, 170);
  const cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 500);
  S.r = r; S.scene = scene; S.cam = cam;
  S.hemi = new THREE.HemisphereLight(0xffffff, 0x335577, 1.1); scene.add(S.hemi);
  S.sun = new THREE.DirectionalLight(0xffffff, 1.6); S.sun.position.set(20, 30, 15); scene.add(S.sun);
  const wg = new THREE.PlaneGeometry(260, 200, 90, 70); wg.rotateX(-Math.PI / 2);
  S.water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: 0x1f63b0, roughness: .35, metalness: .1, flatShading: true, transparent: true, opacity: .96 }));
  S.water.position.z = -40; scene.add(S.water); S.wbase = Float32Array.from(wg.attributes.position.array);
  S.boat = buildBoat(); scene.add(S.boat);
  S.crewG = new THREE.Group(); S.boat.add(S.crewG);
  S.floatG = new THREE.Group(); scene.add(S.floatG);
  S.splash = [];
  addEventListener('resize', () => { r.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
  let last = performance.now();
  r.setAnimationLoop(now => { const dt = Math.min(.05, (now - last) / 1000); last = now; frame(dt); });
}

function frame(dt) {
  const t = (S.t += dt);
  const pos = S.water.geometry.attributes.position, b = S.wbase;
  for (let i = 0; i < pos.count; i++) pos.array[i * 3 + 1] = waveH(b[i * 3], b[i * 3 + 2] - 40, t);
  pos.needsUpdate = true; S.water.geometry.computeVertexNormals();
  const h = waveH(0, 0, t), hf = waveH(5, 0, t), hb = waveH(-5, 0, t), hs = waveH(0, 2, t);
  S.boat.position.y = h * .9 - .3; S.boat.rotation.z = (hf - hb) * .08; S.boat.rotation.x = (hs - h) * .15;
  S.flag.rotation.y = Math.sin(t * 4) * .3; S.sail.scale.z = 1 + Math.sin(t * 1.3) * .08;
  // cámara
  S.cam.position.set(Math.sin(t * .08) * 4, 8.5, 25 + Math.sin(t * .05) * 1.5); S.cam.lookAt(0, 6.2, 0);
  // tripulación
  for (const id in S.crew) {
    const c = S.crew[id], sp = c.sprite;
    if (c.anim) {
      c.anim.k = Math.min(1, c.anim.k + dt / c.anim.dur); const k = c.anim.k;
      const from = c.anim.from, to = c.anim.to.clone(); if (!c.alive) to.y = waveH(to.x, to.z, t) + .6;
      sp.position.lerpVectors(from, to, k); sp.position.y += Math.sin(k * Math.PI) * 5; sp.material.rotation = c.alive ? 0 : k * Math.PI * 4;
      if (k >= 1) { if (!c.alive) splashAt(sp.position); else S.crewG.attach(sp); c.anim = null; sp.material.rotation = 0; }
    } else if (c.alive) {
      c.hop = Math.max(0, c.hop - dt * 2.5);
      sp.position.copy(c.slot); sp.position.y += .2 + Math.abs(Math.sin((t + c.ph) * 3)) * .08 + Math.sin(c.hop * Math.PI) * 1.2;
    } else {
      sp.position.set(c.water.x, waveH(c.water.x, c.water.z, t) + .6, c.water.z);
      sp.material.rotation = Math.sin(t * 1.5 + c.ph) * .25;
      c.ring.position.set(sp.position.x, sp.position.y - .75, sp.position.z);
    }
    if (c.ring) c.ring.visible = !c.alive && !c.anim;
  }
  for (let i = S.splash.length - 1; i >= 0; i--) { const p = S.splash[i]; p.v.y -= 15 * dt; p.m.position.addScaledVector(p.v, dt); p.life -= dt; p.m.material.opacity = Math.max(0, p.life); if (p.life <= 0) { S.scene.remove(p.m); S.splash.splice(i, 1); } }
  for (const isl of S.islands) { isl.g.position.x += (isl.tx - isl.g.position.x) * dt * .25; isl.g.position.y = waveH(isl.g.position.x, isl.g.position.z, t) * .2 - .3; }
  S.islands = S.islands.filter(isl => { if (isl.dead && isl.g.position.x < -150) { S.scene.remove(isl.g); return false; } return true; });
  S.r.render(S.scene, S.cam);
}

function splashAt(p) {
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(.15, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
    m.position.copy(p); S.scene.add(m);
    S.splash.push({ m, v: new THREE.Vector3((Math.random() - .5) * 6, 4 + Math.random() * 5, (Math.random() - .5) * 6), life: 1 });
  }
}

function setCrew(list) {
  const seen = new Set(), onBoard = list.filter(c => c.alive);
  for (const c of list) {
    seen.add(c.id); let s = S.crew[c.id];
    const key = c.ani + c.name + (c.alive ? 1 : 0);
    if (!s) {
      const mat = new THREE.SpriteMaterial({ map: emojiTex(c.ani, c.name, !c.alive), transparent: true });
      const sprite = new THREE.Sprite(mat); sprite.scale.set(1.9, 2.2, 1);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.75, .25, 8, 16), new THREE.MeshStandardMaterial({ color: 0xff7043, flatShading: true }));
      ring.rotation.x = Math.PI / 2; S.floatG.add(ring);
      s = S.crew[c.id] = { sprite, ring, alive: c.alive, key, hop: 0, ph: Math.random() * 6, water: new THREE.Vector3((Math.random() < .5 ? -1 : 1) * (8 + Math.random() * 7), 0, -1 + Math.random() * 5) };
      if (c.alive) S.crewG.add(sprite); else S.scene.add(sprite);
    } else if (s.key !== key) { s.sprite.material.map.dispose(); s.sprite.material.map = emojiTex(c.ani, c.name, !c.alive); s.key = key; }
    s.sprite.material.opacity = c.on ? 1 : .5;
    if (c.ans && !s.ans) s.hop = 1; s.ans = c.ans;
    if (s.alive !== c.alive) {
      const world = new THREE.Vector3(); s.sprite.getWorldPosition(world);
      s.alive = c.alive; S.scene.attach(s.sprite);
      if (!c.alive) { s.water.set((Math.random() < .5 ? -1 : 1) * (8 + Math.random() * 7), 0, -1 + Math.random() * 5); s.anim = { from: world.clone(), to: s.water.clone(), k: 0, dur: 1 }; }
      else s.anim = { from: world.clone(), to: null, k: 0, dur: 1, rise: true };
    }
  }
  for (const id in S.crew) if (!seen.has(id)) { const s = S.crew[id]; s.sprite.removeFromParent(); s.ring.removeFromParent(); delete S.crew[id]; }
  onBoard.forEach((c, i) => { const s = S.crew[c.id]; s.slot = deckSlot(i, onBoard.length); });
  // los que suben: destino = su lugar en cubierta (en coordenadas del mundo)
  for (const c of onBoard) { const s = S.crew[c.id]; if (s.anim && s.anim.rise) { s.anim.to = s.boatTo = S.boat.localToWorld(s.slot.clone()); s.anim.onDone = true; } }
}


function setPhase(i, cfg) {
  S.amp = cfg.storm ? .75 : .35;
  S.hemi.color.set(cfg.light || 0xffffff); S.hemi.intensity = cfg.storm ? .7 : (cfg.night ? .55 : 1.1);
  S.sun.intensity = cfg.storm ? .6 : (cfg.night ? .4 : 1.6); S.sun.color.set(cfg.sunColor || 0xffffff);
  S.scene.fog.color.set(cfg.fog || 0xbfe6ff);
  S.water.material.color.set(cfg.water || 0x1f63b0);
  if (i !== S.phase && i >= 0) {
    for (const isl of S.islands) { isl.tx = -170; isl.dead = true; }
    const g = buildIsland(i); g.position.set(130, -.3, -38); S.scene.add(g);
    S.islands.push({ g, tx: 32 - (i % 2) * 64, dead: false });
  }
  S.phase = i;
}
function hop(id) { const s = S.crew[id]; if (s) s.hop = 1; }

window.Scene3D = { init, setCrew, setPhase, hop };
window.dispatchEvent(new Event('scene3d-ready'));
