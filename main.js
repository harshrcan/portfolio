/* Harsh Rana portfolio: a small 3D version of Harsh that reacts to the scroll.
   Everything is built in code with three.js, so there are no model files to load. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const canvas = document.getElementById('stage');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- nav highlight ---------- */
const navLinks = [...document.querySelectorAll('.top nav a')];
const scenes = [...document.querySelectorAll('.scene')];
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }
}, { rootMargin: '-45% 0px -45% 0px' });
scenes.forEach((s) => io.observe(s));

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (err) {
  document.body.classList.add('no-gl');
  throw err;
}
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const FOV = 30, CAM = 13;
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
camera.position.set(0, 0, CAM);

/* ---------- light ---------- */
scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a2046, 1.15));
const key = new THREE.DirectionalLight(0xfff1dd, 2.1); key.position.set(3, 5, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0x6f9dff, 3.2); rim.position.set(-5, 3, -4); scene.add(rim);
const warm = new THREE.DirectionalLight(0xffb23e, 0.9); warm.position.set(5, -1, -3); scene.add(warm);

/* ---------- materials ---------- */
const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 4, 1);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra });

const M = {
  skin: toon(0xC99A82),
  skinDark: toon(0xA87862),
  hair: toon(0x2E2529),
  tee: toon(0x1D1F29),
  jeans: toon(0x34446E),
  shoe: toon(0xECEEF5),
  sole: toon(0xBFC4D6),
  strap: toon(0xB4B2C3),
  frame: toon(0x0D0D12),
  metal: toon(0xC9A45A),
  eye: toon(0x2A1A14),
  white: toon(0xFFFFFF),
  lip: toon(0x9C5F5F),
  device: toon(0x2B3355),
  screen: new THREE.MeshBasicMaterial({ color: 0x4C86FF }),
  ledG: new THREE.MeshBasicMaterial({ color: 0x6FE3A1 }),
  ledA: new THREE.MeshBasicMaterial({ color: 0xFFB23E }),
  lens: new THREE.MeshBasicMaterial({ color: 0x9FC2FF, transparent: true, opacity: 0.13, depthWrite: false }),
  stubble: toon(0xA97E6A),
};

const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };
const group = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
/* a capsule that hangs down from its origin, so it can swing like a limb */
const limb = (r, len, mat) => { const g = new THREE.CapsuleGeometry(r, len, 10, 24); g.translate(0, -len / 2, 0); return new THREE.Mesh(g, mat); };

let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

/* ================= the character ================= */
const root = group();          // moves around the screen
scene.add(root);
const body = group(0, 1.2, 0); // hips
root.add(body);

/* ----- legs ----- */
function makeLeg(x) {
  const hip = group(x, 0, 0);
  hip.add(limb(0.19, 0.42, M.jeans));
  const knee = group(0, -0.5, 0);
  knee.add(limb(0.165, 0.42, M.jeans));
  const shoe = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.26, 10, 24), M.shoe);
  upper.rotation.x = Math.PI / 2; upper.position.set(0, -0.56, 0.1);
  const sole = mesh(new THREE.BoxGeometry(0.33, 0.07, 0.58), M.sole, 0, -0.7, 0.1);
  shoe.add(upper, sole);
  knee.add(shoe);
  hip.add(knee);
  body.add(hip);
  return { hip, knee };
}
const legL = makeLeg(0.24), legR = makeLeg(-0.24);

/* ----- torso ----- */
const torso = group();
body.add(torso);
const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.4, 12, 32), M.tee);
chest.scale.set(1.12, 1, 0.82); chest.position.y = 0.56;
torso.add(chest);
const hem = mesh(new THREE.CylinderGeometry(0.555, 0.54, 0.42, 32), M.tee, 0, 0.1, 0); hem.scale.z = 0.82; torso.add(hem);
const neck = mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.24, 16), M.skinDark, 0, 1.17, 0); torso.add(neck);
const collar = mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 20), M.tee, 0, 1.08, 0); collar.rotation.x = Math.PI / 2; torso.add(collar);

/* backpack and straps */
const pack = mesh(new THREE.BoxGeometry(0.78, 0.9, 0.32), M.strap, 0, 0.52, -0.52);
pack.geometry = new THREE.CapsuleGeometry(0.3, 0.42, 6, 14); pack.scale.set(1.25, 1, 0.75);
torso.add(pack);
for (const sx of [0.3, -0.3]) {
  const strap = mesh(new THREE.TorusGeometry(0.46, 0.055, 8, 28, Math.PI * 1.15), M.strap, sx, 0.55, -0.02);
  strap.rotation.set(0, Math.PI / 2, -0.35); strap.scale.set(1, 1.15, 1.6);
  torso.add(strap);
}

/* ----- arms ----- */
function makeArm(x) {
  const shoulder = group(x, 0.9, 0);
  const sleeve = limb(0.175, 0.2, M.tee);
  const upper = limb(0.135, 0.4, M.skin);
  const elbow = group(0, -0.45, 0);
  elbow.add(limb(0.125, 0.36, M.skin));
  const hand = mesh(new THREE.SphereGeometry(0.16, 16, 12), M.skin, 0, -0.5, 0);
  elbow.add(hand);
  shoulder.add(upper, sleeve, elbow);
  torso.add(shoulder);
  return { shoulder, elbow };
}
const armL = makeArm(0.66), armR = makeArm(-0.66);   // L is on screen right

/* ----- head ----- */
const head = group(0, 1.78, 0.02);
torso.add(head);
const R = 0.64;
const skull = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 32), M.skin);
skull.scale.set(1.04, 1.02, 0.98);
head.add(skull);
/* fuller cheeks and jaw */
const jaw = mesh(new THREE.SphereGeometry(R * 0.86, 32, 24), M.stubble, 0, -0.14, 0.04); jaw.scale.set(1.1, 0.86, 0.95); head.add(jaw);
for (const sx of [1, -1]) {
  const ear = mesh(new THREE.SphereGeometry(0.115, 16, 12), M.skin, sx * 0.665, -0.02, 0); ear.scale.set(0.6, 1, 0.8); head.add(ear);
}
const bud = mesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 8), M.white, 0.71, -0.09, 0.05); head.add(bud);

/* eyes, brows, nose, mouth */
const eyes = [];
for (const sx of [1, -1]) {
  const eye = group(sx * 0.25, 0.04, 0.585);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), M.eye); ball.scale.set(1, 1.15, 0.5);
  const glint = mesh(new THREE.SphereGeometry(0.022, 8, 8), M.white, 0.025, 0.035, 0.035);
  eye.add(ball, glint); head.add(eye); eyes.push(eye);
  const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.2, 4, 8), M.hair);
  brow.position.set(sx * 0.26, 0.275, 0.575); brow.rotation.set(0, sx * 0.25, Math.PI / 2 + sx * 0.1);
  head.add(brow);
}
const nose = mesh(new THREE.SphereGeometry(0.085, 16, 12), M.skinDark, 0, -0.1, 0.66); nose.scale.set(1.05, 0.9, 0.9); head.add(nose);
const mouth = mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 20, Math.PI * 0.6), M.lip, 0, -0.2, 0.6);
mouth.rotation.set(0.2, 0, Math.PI + Math.PI * 0.2); head.add(mouth);

/* glasses: thick dark frames with a metal top bar */
const glasses = group(0, 0.04, 0.665);
function frameShape(w, h, r, t) {
  const rr = (s, w, h, r) => {
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  };
  const s = new THREE.Shape(); rr(s, w, h, r);
  const hole = new THREE.Path(); rr(hole, w - t * 2, h - t * 2, Math.max(0.01, r - t)); s.holes.push(hole);
  return s;
}
const fGeo = new THREE.ExtrudeGeometry(frameShape(0.42, 0.34, 0.1, 0.04), { depth: 0.04, bevelEnabled: false });
for (const sx of [1, -1]) {
  const f = mesh(fGeo, M.frame, sx * 0.255, 0, 0); f.rotation.y = sx * 0.16; glasses.add(f);
  const l = mesh(new THREE.PlaneGeometry(0.34, 0.26), M.lens, sx * 0.255, 0, 0.02); l.rotation.y = sx * 0.16; glasses.add(l);
  const temple = mesh(new THREE.BoxGeometry(0.03, 0.035, 0.62), M.frame, sx * 0.5, 0.06, -0.33); temple.rotation.y = sx * 0.2; glasses.add(temple);
}
glasses.add(mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), M.frame, 0, 0.02, 0.03));
const bar = mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.5, 8), M.metal, 0, 0.165, 0.03); bar.rotation.z = Math.PI / 2; glasses.add(bar);
head.add(glasses);

/* hair: short sides, big wavy volume swept up on top */
const hair = group();
head.add(hair);
const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), M.hair);
cap.scale.set(1.04, 1.02, 1.02); cap.rotation.x = -0.6; cap.position.y = 0.03; hair.add(cap);
const backHair = mesh(new THREE.SphereGeometry(R * 1.0, 24, 16), M.hair, 0, 0.0, -0.1); backHair.scale.set(1.03, 0.95, 0.95); hair.add(backHair);
const tufts = [];
const blob = new THREE.IcosahedronGeometry(1, 3);
for (let i = 0; i < 46; i++) {
  const a = rnd() * Math.PI * 2;                 // around the crown
  const rad = Math.sqrt(rnd()) * 0.43;
  const x = Math.cos(a) * rad * 1.08;
  const z = Math.sin(a) * rad * 0.95 + 0.02;
  const front = THREE.MathUtils.smoothstep(z, -0.3, 0.45);   // more height toward the forehead
  const y = 0.52 + front * 0.16 + (1 - rad / 0.43) * 0.1 + rnd() * 0.05;
  const s = 0.15 + rnd() * 0.07 + front * 0.03;
  const t = mesh(blob, M.hair, x + 0.05 * front, y, z);
  t.scale.set(s * 1.1, s * (0.95 + front * 0.25), s * 1.05);
  t.userData = { y, ph: rnd() * 6.28 };
  hair.add(t); tufts.push(t);
}
/* a few locks falling toward the forehead edge */
for (const [x, y, z, s] of [[-0.4, 0.5, 0.33, 0.14], [-0.18, 0.58, 0.4, 0.14], [0.06, 0.6, 0.42, 0.15], [0.3, 0.56, 0.36, 0.14], [0.48, 0.46, 0.22, 0.13], [-0.52, 0.42, 0.14, 0.13]]) {
  const lock = mesh(blob, M.hair, x, y, z); lock.scale.setScalar(s); hair.add(lock);
}

/* ----- props ----- */
/* network switch he carries in the Work section */
const sw = group(0, 0.42, 0.78);
sw.add(mesh(new THREE.BoxGeometry(1.15, 0.2, 0.5), M.device));
const leds = [];
for (let i = 0; i < 8; i++) {
  sw.add(mesh(new THREE.BoxGeometry(0.085, 0.07, 0.02), M.frame, -0.47 + i * 0.115, -0.02, 0.255));
  const led = mesh(new THREE.BoxGeometry(0.04, 0.025, 0.02), i % 3 === 2 ? M.ledA.clone() : M.ledG.clone(), -0.47 + i * 0.115, 0.055, 0.255);
  sw.add(led); leds.push(led);
}
torso.add(sw);

/* laptop for the Projects section */
const laptop = group(0, 0.2, 0.72);
laptop.add(mesh(new THREE.BoxGeometry(0.9, 0.04, 0.58), M.strap));
const lid = group(0, 0.02, -0.29);
lid.add(mesh(new THREE.BoxGeometry(0.9, 0.58, 0.035), M.strap, 0, 0.29, 0));
const glow = mesh(new THREE.PlaneGeometry(0.8, 0.48), M.screen, 0, 0.29, 0.02); lid.add(glow);
lid.rotation.x = -0.3; laptop.add(lid);
body.add(laptop);

/* a small server crate to sit on */
const crate = group(0, 0.42, -0.1);
crate.add(mesh(new THREE.BoxGeometry(1.3, 0.84, 0.9), M.device));
for (let i = 0; i < 3; i++) {
  crate.add(mesh(new THREE.BoxGeometry(1.1, 0.16, 0.02), M.frame, 0, 0.24 - i * 0.24, 0.455));
  crate.add(mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), i === 1 ? M.ledA : M.ledG, -0.45, 0.24 - i * 0.24, 0.47));
}
root.add(crate);

/* soft contact shadow */
const shTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(2,4,14,0.75)'); g.addColorStop(1, 'rgba(2,4,14,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
})();
const shadow = mesh(new THREE.PlaneGeometry(2.6, 1.1), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }), 0, 0.01, 0.1);
shadow.rotation.x = -Math.PI / 2; root.add(shadow);

/* ================= network backdrop ================= */
const net = new THREE.Group(); net.position.z = -7; scene.add(net);
const nodes = [];
{
  let guard = 0;
  while (nodes.length < 16 && guard++ < 5000) {
    const p = new THREE.Vector3((rnd() * 2 - 1) * 11, (rnd() * 2 - 1) * 5.2, (rnd() * 2 - 1) * 3);
    if (nodes.every((q) => q.distanceTo(p) > 3)) nodes.push(p);
  }
}
const edges = [];
nodes.forEach((p, i) => {
  const near = nodes.map((q, j) => [q.distanceTo(p), j]).filter((d) => d[1] !== i).sort((a, b) => a[0] - b[0]);
  for (let k = 0; k < 2; k++) {
    const j = near[k][1];
    if (!edges.some((e) => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i))) edges.push([i, j]);
  }
});
const lineGeo = new THREE.BufferGeometry().setFromPoints(edges.flatMap(([a, b]) => [nodes[a], nodes[b]]));
net.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x3559C9, transparent: true, opacity: 0.55 })));
const nodeMat = new THREE.MeshBasicMaterial({ color: 0xFFB23E });
nodes.forEach((p) => net.add(mesh(new THREE.SphereGeometry(0.11, 12, 10), nodeMat, p.x, p.y, p.z)));
const packets = edges.map((e, i) => {
  const m = mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xE9ECF5 }));
  m.userData = { e, off: (i * 0.37) % 1, sp: 0.12 + (i % 5) * 0.03 };
  net.add(m); return m;
});

/* ================= poses =================
   x, y: where he stands, as a fraction of half the viewport. s: size.
   Angles are in radians. sit/sw/lap fade the crate, switch and laptop in. */
const Z = { x: 0, y: -0.52, s: 1, yaw: 0, lean: 0, hy: 0, hp: 0,
  lsx: 0, lsz: 0.12, lex: 0, lez: 0, rsx: 0, rsz: -0.12, rex: 0, rez: 0,
  hip: 0, knee: 0, sit: 0, sw: 0, lap: 0, wave: 0, type: 0, dim: 1, net: 0.5 };
const POSES = {
  hero:     { ...Z, x: 0.52, s: 1.18, yaw: -0.32, hy: 0.1, lsz: 2.55, lez: 0.35, lsx: -0.1, wave: 1 },
  about:    { ...Z, x: -0.52, s: 1.1, yaw: 0.5, hy: 0.15, hp: 0.05, lsz: 0.62, lez: -1.5, rsz: -0.62, rez: 1.5, lsx: 0.15, rsx: 0.15 },
  work:     { ...Z, x: 0.5, s: 1.1, yaw: -0.5, hy: -0.1, hp: 0.12, lsx: -0.55, lex: -1.25, lsz: 0.1, rsx: -0.55, rex: -1.25, rsz: -0.1, sw: 1 },
  projects: { ...Z, x: 0.66, y: -0.6, s: 0.95, yaw: -0.62, hp: 0.3, hy: 0.05, lean: 0.12, lsx: -0.5, lex: -1.15, lsz: -0.12, rsx: -0.5, rex: -1.15, rsz: 0.12,
              hip: -1.5, knee: 1.5, sit: 1, lap: 1, type: 1, net: 1 },
  skills:   { ...Z, x: -0.5, s: 1.1, yaw: 0.3, hy: 0.45, lsz: 1.5, lsx: -0.35, lez: 0.1, rsz: -0.6, rez: 1.5, rsx: 0.15, net: 1 },
  contact:  { ...Z, x: 0.5, s: 1.2, yaw: -0.25, hy: 0.05, lsz: 2.6, lez: 0.3, rsz: -2.6, rez: -0.3, wave: 1 },
};
const NARROW = {
  hero:     { x: 0, y: -0.1, s: 0.72, yaw: 0, dim: 1 },
  about:    { x: 0, y: -0.5, s: 0.9, dim: 0.16 },
  work:     { x: 0, y: -0.5, s: 0.9, dim: 0.16 },
  projects: { x: 0, y: -0.55, s: 0.8, dim: 0.16 },
  skills:   { x: 0, y: -0.5, s: 0.9, dim: 0.16 },
  contact:  { x: 0, y: -0.86, s: 0.8, yaw: 0, dim: 1 },
};
const KEYS = Object.keys(Z);
const cur = { ...POSES.hero }, goal = { ...POSES.hero };
const poseEls = scenes.filter((s) => POSES[s.dataset.pose]);
const poseFor = (n) => (innerWidth < 820 ? { ...POSES[n], ...NARROW[n] } : POSES[n]);

function readScroll() {
  const mid = scrollY + innerHeight / 2;
  let a = poseEls[0], b = poseEls[0], t = 0;
  for (let i = 0; i < poseEls.length; i++) {
    const c = poseEls[i].offsetTop + poseEls[i].offsetHeight / 2;
    if (mid >= c) { a = poseEls[i]; b = poseEls[Math.min(i + 1, poseEls.length - 1)]; }
  }
  const ca = a.offsetTop + a.offsetHeight / 2, cb = b.offsetTop + b.offsetHeight / 2;
  if (cb > ca) t = Math.min(1, Math.max(0, (mid - ca) / (cb - ca)));
  t = Math.min(1, Math.max(0, (t - 0.2) / 0.6));
  t = t * t * (3 - 2 * t);
  const A = poseFor(a.dataset.pose), B = poseFor(b.dataset.pose);
  for (const k of KEYS) goal[k] = A[k] + (B[k] - A[k]) * t;
}

/* ---------- sizing ---------- */
let halfW = 1, halfH = 1;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM;
  halfW = halfH * camera.aspect;
}
addEventListener('resize', resize);
resize();

const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / innerWidth) * 2 - 1; mouse.ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

/* ---------- frame loop ---------- */
let last = performance.now(), time = 0, lastX = 0, walk = 0, stride = 0, blinkAt = 2, lastScroll = scrollY, scrollV = 0;
const v = new THREE.Vector3();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!reduce) time += dt;
  readScroll();
  const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
  for (const key of KEYS) cur[key] += (goal[key] - cur[key]) * k;
  mouse.x += (mouse.tx - mouse.x) * (reduce ? 0 : 0.07);
  mouse.y += (mouse.ty - mouse.y) * (reduce ? 0 : 0.07);

  /* walking: when he is crossing the screen his legs and arms swing */
  const px = cur.x * halfW;
  const vx = dt > 0 ? (px - lastX) / dt : 0; lastX = px;
  scrollV += ((scrollY - lastScroll) / Math.max(dt, 0.001) - scrollV) * 0.2; lastScroll = scrollY;
  const moving = reduce ? 0 : Math.min(1, Math.abs(vx) / 2.2) * (1 - cur.sit);
  walk += (moving - walk) * 0.15;
  stride += dt * (6 + Math.abs(vx) * 1.2);
  const sw1 = Math.sin(stride) * walk, sw2 = Math.sin(stride + Math.PI) * walk;

  /* root */
  const bob = reduce ? 0 : Math.sin(time * 1.7) * 0.02 + Math.abs(Math.sin(stride)) * 0.07 * walk;
  root.position.set(px, cur.y * halfH + bob * cur.s, 0);
  root.scale.setScalar(cur.s);
  const face = THREE.MathUtils.clamp(vx * 0.22, -1.1, 1.1) * walk;       // turn toward travel
  root.rotation.y = cur.yaw * (1 - walk) + face + mouse.x * 0.12;
  body.position.y = 1.2 - cur.sit * 0.36;
  body.position.z = cur.sit * 0.28;

  /* torso, breathing */
  const breath = reduce ? 0 : Math.sin(time * 1.7);
  torso.rotation.x = cur.lean + walk * 0.08;
  torso.rotation.z = sw1 * 0.04;
  chest.scale.set(1.12 + breath * 0.008, 1 + breath * 0.012, 0.82 + breath * 0.012);

  /* head follows the pointer a little */
  head.rotation.y = cur.hy + mouse.x * 0.35 * (1 - cur.type * 0.7) - face * 0.4;
  head.rotation.x = cur.hp + mouse.y * 0.2 * (1 - cur.type * 0.7) + (reduce ? 0 : Math.sin(time * 0.9) * 0.02);
  head.rotation.z = reduce ? 0 : Math.sin(time * 0.7) * 0.025 + cur.wave * Math.sin(time * 2.2) * 0.03;

  /* arms */
  const wv = reduce ? 0 : Math.sin(time * 7) * 0.42 * cur.wave;
  const ty = reduce ? 0 : cur.type;
  armL.shoulder.rotation.set(cur.lsx + sw2 * 0.7 + Math.sin(time * 19) * 0.03 * ty, 0, cur.lsz + wv * 0.15);
  armL.elbow.rotation.set(cur.lex - walk * 0.35 + Math.sin(time * 23) * 0.07 * ty, 0, cur.lez + wv);
  armR.shoulder.rotation.set(cur.rsx + sw1 * 0.7 + Math.sin(time * 17 + 1) * 0.03 * ty, 0, cur.rsz - (cur.rsz < -1.5 ? wv * 0.15 : 0));
  armR.elbow.rotation.set(cur.rex - walk * 0.35 + Math.sin(time * 21 + 2) * 0.07 * ty, 0, cur.rez - (cur.rsz < -1.5 ? wv : 0));

  /* legs */
  legL.hip.rotation.x = cur.hip + sw1 * 0.75;
  legR.hip.rotation.x = cur.hip + sw2 * 0.75;
  legL.knee.rotation.x = cur.knee + Math.max(0, -Math.cos(stride)) * 0.9 * walk;
  legR.knee.rotation.x = cur.knee + Math.max(0, Math.cos(stride)) * 0.9 * walk;
  legL.hip.rotation.z = cur.sit * 0.12; legR.hip.rotation.z = -cur.sit * 0.12;

  /* blink */
  blinkAt -= dt;
  const bl = blinkAt < 0.12 ? 0.1 : 1; if (blinkAt < 0) blinkAt = 2.2 + Math.random() * 3;
  eyes.forEach((e) => { e.scale.y = reduce ? 1 : bl; });

  /* hair moves a touch with the bob and walk */
  if (!reduce) tufts.forEach((t) => { t.position.y = t.userData.y + Math.sin(time * 2.1 + t.userData.ph) * 0.006 + Math.sin(stride * 2 + t.userData.ph) * 0.012 * walk; });

  /* props fade in by scaling */
  const pop = (o, a) => { const s = THREE.MathUtils.smoothstep(a, 0.25, 0.9); o.visible = s > 0.01; o.scale.setScalar(Math.max(0.001, s)); };
  pop(sw, cur.sw); pop(laptop, cur.lap); pop(crate, cur.sit);
  leds.forEach((l, i) => { l.material.opacity = 1; l.visible = Math.sin(time * (5 + i * 1.3) + i * 2) > -0.4; });
  glow.material.color.setHSL(0.61, 0.9, 0.6 + (reduce ? 0 : Math.sin(time * 9) * 0.04));
  shadow.scale.x = 1 + cur.sit * 0.2;

  /* backdrop */
  net.rotation.y = Math.sin(time * 0.08) * 0.25 + mouse.x * 0.05 + scrollY * 0.00012;
  net.rotation.x = mouse.y * 0.04;
  net.position.y = (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) - 0.5) * 3;
  net.children[0].material.opacity = 0.22 + cur.net * 0.4;
  nodeMat.opacity = 0.45 + cur.net * 0.55; nodeMat.transparent = true;
  packets.forEach((p) => {
    const { e, off, sp } = p.userData; const t = (time * sp + off) % 1;
    p.position.copy(v.copy(nodes[e[0]]).lerp(nodes[e[1]], t));
    p.material.opacity = cur.net; p.material.transparent = true; p.visible = cur.net > 0.05;
  });

  canvas.style.opacity = cur.dim.toFixed(3);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

readScroll();
Object.assign(cur, goal);
lastX = cur.x * halfW;
document.body.classList.add('gl-ready');
requestAnimationFrame(frame);
