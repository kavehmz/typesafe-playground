// Three.js presentation of the simulated world, the ego car, the sensors and Jev's decision.
// Coordinates: sim x -> three x, sim z (forward) -> three -z. Heading theta -> rotation.y = -theta.
import * as THREE from '/vendor/three.module.js';
import { CAMERAS, BLIND_ZONE } from '/sim/sensors.mjs';
import { evalPath } from '/sim/dynamics.mjs';

const CAR_COLORS = [0x2f6fd6, 0xd94f3d, 0xe9e5dc, 0x2b2f36, 0x4f9a5e, 0x8e5bd0];
const PEOPLE_COLORS = [0xd9534f, 0x3d7dd9, 0x3fb27f, 0xf0a030, 0x8f5fd1, 0x2b2f36];
const EGO_COLOR = 0xffb020;
const SENSOR_COLORS = { front: 0x2ad1c9, left: 0x7fd8ff, right: 0x7fd8ff, rear: 0xb59cff, radar: 0xc49bff, blind: 0xffb020 };
const toThree = (x, z, y = 0) => new THREE.Vector3(x, y, -z);

function signTexture(limit) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.lineWidth = 26; g.strokeStyle = '#d0342c'; g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#111'; g.font = 'bold 118px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(limit), 128, 136);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeCar(color, ego = false) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.45 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.62, 4.5), paint); body.position.y = 0.56; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.3), new THREE.MeshStandardMaterial({ color: ego ? 0x2a2a2a : 0x1f2a36, metalness: 0.6, roughness: 0.2 })); cabin.position.set(0, 1.12, 0.15); cabin.castShadow = true; g.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 18); wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
  g.userData.wheels = [];
  for (const [x, z] of [[-0.85, -1.4], [0.85, -1.4], [-0.85, 1.4], [0.85, 1.4]]) { const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x, 0.33, z); g.add(w); g.userData.wheels.push(w); }
  const lampGeo = new THREE.BoxGeometry(0.34, 0.14, 0.08);
  const head = new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff2c0, emissiveIntensity: 1.4 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 1.2 });
  for (const x of [-0.62, 0.62]) { const h = new THREE.Mesh(lampGeo, head); h.position.set(x, 0.62, -2.26); g.add(h); const t = new THREE.Mesh(lampGeo, tail); t.position.set(x, 0.62, 2.26); g.add(t); g.userData.tail = g.userData.tail || []; g.userData.tail.push(t); }
  if (ego) { const badge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), new THREE.MeshStandardMaterial({ color: 0x2ad1c9, emissive: 0x2ad1c9, emissiveIntensity: 0.8 })); badge.position.set(0, 1.46, 0.1); g.add(badge); }
  return g;
}
function makePerson(color) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe0b89a, roughness: 0.8 });
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.8, 10), new THREE.MeshStandardMaterial({ color: 0x2c3e50 })); legs.position.y = 0.4; g.add(legs);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.45, 4, 10), new THREE.MeshStandardMaterial({ color })); torso.position.y = 1.08; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), skin); head.position.y = 1.62; g.add(head);
  return g;
}
function edgesBox(w, h, l, color) {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, l));
  const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
  m.position.y = h / 2; return m;
}
function fovWedge(cam, color) {
  const shape = new THREE.Shape(); const half = cam.fov * Math.PI / 360, r = Math.min(cam.range, 60);
  shape.moveTo(0, 0);
  for (let i = -12; i <= 12; i++) { const a = half * i / 12; shape.lineTo(Math.sin(a) * r, Math.cos(a) * r); }
  shape.lineTo(0, 0);
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  mesh.rotation.x = -Math.PI / 2; // lies on the ground; local +y (shape) becomes -z (forward)
  const holder = new THREE.Group(); holder.add(mesh);
  holder.position.set(cam.dx, 0.03, -cam.dz); holder.rotation.y = -cam.yaw;
  return holder;
}

export class Scene {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.autoClear = false;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd7e3ee);
    this.scene.fog = new THREE.Fog(0xd7e3ee, 140, 520);
    this.scene.add(new THREE.HemisphereLight(0xdbe8ff, 0x6b5a45, 0.85));
    this.sun = new THREE.DirectionalLight(0xfff1dc, 2.1); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.camera.near = 10; this.sun.shadow.camera.far = 220;
    Object.assign(this.sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70 }); this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun); this.scene.add(this.sun.target);
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.5, 900);
    this.camTarget = new THREE.Vector3(); this.camPos = new THREE.Vector3(0, 6, 14);
    this.worldGroup = new THREE.Group(); this.scene.add(this.worldGroup);
    this.ego = makeCar(EGO_COLOR, true); this.scene.add(this.ego);
    this.overlayGroup = new THREE.Group(); this.ego.add(this.overlayGroup);
    this.feedCams = {};
    for (const [name, cam] of Object.entries(CAMERAS)) {
      const c = new THREE.PerspectiveCamera(60, 16 / 9, 0.3, 500);
      c.position.set(cam.dx, name === 'front' ? 1.15 : 1.0, -cam.dz); c.rotation.y = -cam.yaw; c.userData.hfov = Math.min(cam.fov, 120);
      this.ego.add(c); this.feedCams[name] = c;
      this.overlayGroup.add(fovWedge(cam, SENSOR_COLORS[name]));
    }
    this.blindZones = {};
    for (const side of ['left', 'right']) {
      const len = BLIND_ZONE.behind + BLIND_ZONE.ahead;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.3, len), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      m.rotation.x = -Math.PI / 2; m.position.set(side === 'left' ? -3.5 : 3.5, 0.04, -(BLIND_ZONE.ahead - len / 2));
      this.overlayGroup.add(m); this.blindZones[side] = m;
    }
    this.pathLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: EGO_COLOR, transparent: true, opacity: 0.9 }));
    this.scene.add(this.pathLine);
    this.stopMarker = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 0.5), new THREE.MeshBasicMaterial({ color: 0xff4d3d, transparent: true, opacity: 0.85 }));
    this.stopMarker.visible = false; this.scene.add(this.stopMarker);
    this.outlinePool = []; this.radarLines = [];
    this.carMeshes = new Map(); this.personMeshes = new Map();
    this.view = 'chase'; this.overlays = true;
    this.resize();
  }
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  buildWorld(world) {
    this.worldGroup.clear(); this.carMeshes.clear(); this.personMeshes.clear();
    const g = this.worldGroup, L = world.length;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, L + 700), new THREE.MeshStandardMaterial({ color: 0x7ea466, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -(L / 2)); ground.receiveShadow = true; g.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(7.8, L + 260), new THREE.MeshStandardMaterial({ color: 0x3c4149, roughness: 0.95 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -(L / 2) - 30); road.receiveShadow = true; g.add(road);
    const kerbMat = new THREE.MeshStandardMaterial({ color: 0xa9adb3, roughness: 0.9 });
    for (const x of [-4.1, 4.1]) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, L + 260), kerbMat); k.position.set(x, 0.06, -(L / 2) - 30); k.receiveShadow = true; g.add(k); }
    const white = new THREE.MeshBasicMaterial({ color: 0xf2f2ee }), amber = new THREE.MeshBasicMaterial({ color: 0xf1d67a });
    for (const x of [-3.45, 3.45]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.12, L + 260), white); e.rotation.x = -Math.PI / 2; e.position.set(x, 0.012, -(L / 2) - 30); g.add(e); }
    // Centre line: dashes where passing is allowed, continuous where it is not.
    const dashes = [];
    for (let z = -60; z < L + 120; z += 9) if (!world.noPassing.some(n => z + 3 > n.from && z < n.to)) dashes.push(z);
    const dashGeo = new THREE.PlaneGeometry(0.14, 3); dashGeo.rotateX(-Math.PI / 2);
    const dashMesh = new THREE.InstancedMesh(dashGeo, amber, dashes.length);
    const m4 = new THREE.Matrix4();
    dashes.forEach((z, i) => { m4.makeTranslation(0, 0.012, -(z + 1.5)); dashMesh.setMatrixAt(i, m4); });
    g.add(dashMesh);
    for (const n of world.noPassing) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.16, n.to - n.from), amber); s.rotation.x = -Math.PI / 2; s.position.set(0, 0.013, -((n.from + n.to) / 2)); g.add(s); }
    // Zebra crossings with a stop line for our lane.
    for (const c of world.crossings) {
      for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 3.2), white); s.rotation.x = -Math.PI / 2; s.position.set(-3 + i * 1.0, 0.014, -c.z); g.add(s); }
      const stop = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.4), white); stop.rotation.x = -Math.PI / 2; stop.position.set(1.75, 0.014, -c.stopLineZ); g.add(stop);
      for (const side of [-1, 1]) { const pad = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 4), kerbMat); pad.position.set(side * 5.4, 0.06, -c.z); g.add(pad); }
    }
    for (const s of world.signs) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8), new THREE.MeshStandardMaterial({ color: 0x777c84 })); pole.position.set(5.4, 1.15, -s.z); g.add(pole);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ map: signTexture(s.limit) })); disc.position.set(5.4, 2.55, -s.z + 0.03); g.add(disc);
      const back = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshStandardMaterial({ color: 0x8a8f96 })); back.rotation.y = Math.PI; back.position.set(5.4, 2.55, -s.z - 0.01); g.add(back);
    }
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4b2a }), leafMats = [0x3f7d3a, 0x4f8f3d, 0x6c9a3c].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
    const houseMats = [0xe8d9c3, 0xd9c2b0, 0xc9d6df, 0xefe3d0].map(c => new THREE.MeshStandardMaterial({ color: c })), roofMat = new THREE.MeshStandardMaterial({ color: 0x8a3b2c });
    world.scenery.forEach((o, i) => {
      if (o.kind === 'tree') {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.6 * o.scale, 7), trunkMat); t.position.set(o.x, 0.8 * o.scale, -o.z); g.add(t);
        const f = new THREE.Mesh(new THREE.ConeGeometry(1.4 * o.scale, 3.2 * o.scale, 8), leafMats[i % 3]); f.position.set(o.x, 2.9 * o.scale, -o.z); f.castShadow = true; g.add(f);
      } else if (o.kind === 'house') {
        const h = new THREE.Mesh(new THREE.BoxGeometry(6 * o.scale, 3.2 * o.scale, 7 * o.scale), houseMats[o.color]); h.position.set(o.x, 1.6 * o.scale, -o.z); h.castShadow = true; g.add(h);
        const r = new THREE.Mesh(new THREE.ConeGeometry(4.9 * o.scale, 2.2 * o.scale, 4), roofMat); r.rotation.y = Math.PI / 4; r.position.set(o.x, 4.3 * o.scale, -o.z); g.add(r);
      } else if (o.kind === 'lamp') {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5, 8), kerbMat); p.position.set(o.x, 2.5, -o.z); g.add(p);
      }
    });
    const finish = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 1.6), new THREE.MeshBasicMaterial({ map: this.checker() })); finish.rotation.x = -Math.PI / 2; finish.position.set(0, 0.015, -L); g.add(finish);
    for (const car of world.cars) { const m = makeCar(CAR_COLORS[car.color % CAR_COLORS.length]); g.add(m); this.carMeshes.set(car.id, m); }
    for (const p of world.pedestrians) { const m = makePerson(PEOPLE_COLORS[p.color % PEOPLE_COLORS.length]); g.add(m); this.personMeshes.set(p.id, m); }
    this.camPos.set(1.75, 6, 14); this.first = true;
  }
  checker() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d');
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; g.fillRect(i * 16, j * 16, 16, 16); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  outline(index, w, l, x, z, color) {
    let o = this.outlinePool[index];
    if (!o) { o = edgesBox(1, 1, 1, 0xffffff); this.scene.add(o); this.outlinePool[index] = o; }
    o.scale.set(w + 0.25, 1.7, l + 0.25); o.position.set(x, 0.85, -z); o.material.color.setHex(color); o.visible = true;
  }
  update(sim, dt) {
    const e = sim.ego, w = sim.world;
    this.ego.position.set(e.x, 0, -e.z); this.ego.rotation.y = -e.heading;
    const spin = e.speed * dt / 0.33;
    for (const wheel of this.ego.userData.wheels) wheel.rotation.x -= spin;
    this.ego.userData.wheels[0].rotation.y = this.ego.userData.wheels[1].rotation.y = -e.steer;
    for (const t of this.ego.userData.tail) t.material.emissiveIntensity = e.accel < -0.8 ? 3.2 : 1.0;
    for (const car of w.cars) { const m = this.carMeshes.get(car.id); if (!m) continue; m.position.set(car.x, 0, -car.z); m.rotation.y = -car.heading; for (const wheel of m.userData.wheels) wheel.rotation.x -= car.speed * dt / 0.33; for (const t of m.userData.tail) t.material = t.material; }
    for (const p of w.pedestrians) { const m = this.personMeshes.get(p.id); if (!m) continue; m.position.set(p.x, p.state === 'crossing' ? Math.abs(Math.sin(sim.time * 7 + p.z)) * 0.05 : 0, -p.z); m.rotation.y = p.state === 'crossing' ? (p.kerbSide === 1 ? -Math.PI / 2 : Math.PI / 2) : (p.kerbSide === 1 ? -Math.PI / 2 : Math.PI / 2); }
    // Sun follows the car so shadows stay crisp.
    this.sun.position.set(e.x + 40, 70, -e.z + 30); this.sun.target.position.set(e.x, 0, -e.z - 20); this.sun.target.updateMatrixWorld();
    // Main camera.
    const ahead = { x: e.x + Math.sin(e.heading) * 8, z: e.z + Math.cos(e.heading) * 8 };
    let want, look;
    if (this.view === 'aerial') { want = toThree(e.x, e.z - 26, 42); look = toThree(e.x, e.z + 18, 0); }
    else if (this.view === 'driver') { want = toThree(e.x - 0.4 * Math.cos(e.heading) - 0.4 * Math.sin(e.heading), e.z - 0.3, 1.25); look = toThree(ahead.x, ahead.z + 30, 1.0); }
    else { want = toThree(e.x - Math.sin(e.heading) * 12, e.z - Math.cos(e.heading) * 12, 5.2); look = toThree(ahead.x, ahead.z, 0.8); }
    const k = this.first ? 1 : (this.view === 'driver' ? 1 : 1 - Math.exp(-dt * 4)); this.first = false;
    this.camPos.lerp(want, k); this.camTarget.lerp(look, k);
    this.camera.position.copy(this.camPos); this.camera.lookAt(this.camTarget);
    // Overlays.
    this.overlayGroup.visible = this.overlays;
    const sensed = sim.refreshPerception();
    for (const o of this.outlinePool) o.visible = false;
    if (this.overlays) {
      let i = 0;
      const seen = new Map();
      for (const [name, cam] of Object.entries(sensed.cameras)) for (const d of cam.detections) { if (!seen.has(d.id)) seen.set(d.id, SENSOR_COLORS[name]); }
      for (const lane of ['left', 'right']) for (const r of [sensed.radar.front[lane], sensed.radar.rear[lane]]) if (r && !seen.has(r.id)) seen.set(r.id, SENSOR_COLORS.radar);
      for (const [id, color] of seen) {
        const b = sensed.bodies.find(b => b.id === id); if (!b) continue;
        this.outline(i++, b.width, b.length, b.x, b.z, color);
      }
      for (const side of ['left', 'right']) { const z = sensed.blind_spots[side]; this.blindZones[side].material.color.setHex(z.occupied ? SENSOR_COLORS.blind : 0xffffff); this.blindZones[side].material.opacity = z.occupied ? 0.45 : (z.covers_lane === 'off road' ? 0.03 : 0.1); }
    }
    if (e.path) {
      const pts = []; for (let s = Math.max(0, e.z - e.path.startZ); s <= e.path.L; s += e.path.L / 24) { const p = evalPath(e.path, s); pts.push(toThree(p.x, e.path.startZ + s, 0.08)); }
      pts.push(toThree(e.path.targetX, e.path.startZ + e.path.L + 6, 0.08));
      this.pathLine.geometry.setFromPoints(pts); this.pathLine.visible = this.overlays;
    } else this.pathLine.visible = false;
    const ctx = sim.controllerContext();
    if (e.maneuver === 'stop' && ctx.stopLineDistance !== null) { this.stopMarker.visible = true; this.stopMarker.position.set(1.75, 0.05, -(e.z + e.length / 2 + ctx.stopLineDistance)); }
    else this.stopMarker.visible = false;
  }
  render(feedRects) {
    const r = this.renderer, W = window.innerWidth, H = window.innerHeight;
    r.setScissorTest(false); r.setViewport(0, 0, W, H); r.clear();
    r.render(this.scene, this.camera);
    r.setScissorTest(true);
    const overlaysWere = this.overlayGroup.visible;
    this.overlayGroup.visible = false;
    for (const [name, rect] of Object.entries(feedRects)) {
      const cam = this.feedCams[name]; if (!cam || rect.width < 10) continue;
      const x = rect.left, y = H - rect.bottom;
      r.setViewport(x, y, rect.width, rect.height); r.setScissor(x, y, rect.width, rect.height);
      cam.aspect = rect.width / rect.height;
      cam.fov = 2 * Math.atan(Math.tan(cam.userData.hfov * Math.PI / 360) / cam.aspect) * 180 / Math.PI; cam.updateProjectionMatrix();
      r.clear(); r.render(this.scene, cam);
    }
    this.overlayGroup.visible = overlaysWere;
    r.setScissorTest(false);
  }
}
