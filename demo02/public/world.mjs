import * as THREE from '/vendor/three.module.js';
import { LANES, seededRandom } from './simulation.mjs';
import { CAMERA_CONFIG } from './perception.mjs';
import { STOP_LINE_SETBACK_M } from './motion.mjs';

const sensorColors = { front: '#51cfb0', left: '#70a6ee', right: '#edb45d', rear: '#cd8db9' };

const mat = (color, roughness = .75) => new THREE.MeshStandardMaterial({ color, roughness });
const asphalt = mat('#343e42'), line = mat('#e3e6db'), shoulder = mat('#c4b293'), metal = mat('#8b9c93');
const carColors = ['#df7751', '#ede5cd', '#759080', '#a3bad0', '#d0b45c'];
function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function makeCar(color, ego = false) {
  const group = new THREE.Group(), paint = mat(color, .35), glass = mat('#243e44', .18), tire = mat('#22292b');
  group.add(box(1.82, .58, 4.3, paint, 0, .69));
  group.add(box(1.68, .2, 3.85, paint, 0, .99));
  const cabin = box(1.5, .62, 2.15, glass, 0, 1.28, .22); group.add(cabin);
  group.add(box(1.5, .07, 1.55, paint, 0, 1.61, .25));
  group.add(box(.07, .62, 2.1, paint, -.75, 1.28, .22));
  group.add(box(.07, .62, 2.1, paint, .75, 1.28, .22));
  const wheels = [];
  for (const x of [-.93, .93]) for (const z of [-1.35, 1.35]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.39, .39, .25, 12), tire);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .42, z); wheel.castShadow = true; group.add(wheel); wheels.push(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .26, 8), metal);
    hub.rotation.z = Math.PI / 2; hub.position.copy(wheel.position); group.add(hub);
  }
  const headlight = new THREE.MeshStandardMaterial({ color: '#ffffe6', emissive: '#fff2ab', emissiveIntensity: .4 });
  const brake = new THREE.MeshStandardMaterial({ color: '#fb6159', emissive: '#d92c1f', emissiveIntensity: .25 });
  for (const x of [-.6, .6]) { group.add(box(.42, .16, .07, headlight, x, .77, -2.17)); group.add(box(.48, .16, .07, brake, x, .78, 2.17)); }
  if (ego) {
    group.add(box(.055, .02, 4.1, mat('#e0fff5'), -.35, 1.1));
    group.add(box(.055, .02, 4.1, mat('#e0fff5'), .35, 1.1));
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.7, 2.76, 48), new THREE.MeshBasicMaterial({ color: '#55eec7', transparent: true, opacity: .55, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .045; group.add(ring);
  }
  group.userData.brake = brake; return group;
}
function makePedestrian(color) {
  const g = new THREE.Group(), clothes = mat(color), skin = mat('#c99972'), trousers = mat('#3b4a4e');
  const head = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), skin); head.position.y = 1.53; head.castShadow = true; g.add(head);
  g.add(box(.4, .58, .25, clothes, 0, 1.12));
  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * .12, .84, 0); leg.add(box(.14, .7, .16, trousers, 0, -.35)); g.add(leg); legs.push(leg);
    const arm = new THREE.Group(); arm.position.set(side * .27, 1.37, 0); arm.add(box(.1, .49, .12, clothes, 0, -.23)); g.add(arm); arms.push(arm);
  }
  g.userData.legs = legs; g.userData.arms = arms; return g;
}
function makeSign(sign) {
  const group = new THREE.Group(); group.position.set(sign.x, 0, -sign.z);
  group.add(box(.1, 2.65, .1, metal, 0, 1.32));
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fcfcf4'; ctx.beginPath(); ctx.arc(128, 128, 121, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d95848'; ctx.lineWidth = 24; ctx.beginPath(); ctx.arc(128, 128, 108, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#263634'; ctx.font = 'bold 112px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(sign.limit), 128, 136);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: .8 })); face.position.set(0, 2.64, .075); group.add(face);
  const back = new THREE.Mesh(new THREE.CircleGeometry(.65, 32), metal); back.rotation.y = Math.PI; back.position.set(0, 2.64, -.03); group.add(back);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.74, .8, 32), new THREE.MeshBasicMaterial({ color: '#46c4a3', side: THREE.DoubleSide, transparent: true, opacity: .8 })); halo.position.set(0, 2.64, .08); halo.visible = false; group.add(halo); group.userData.halo = halo;
  return group;
}
function tree(rng) {
  const g = new THREE.Group(); g.add(box(.25, 1.6, .25, mat('#746f52'), 0, .8));
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.6, 7), mat(rng() > .5 ? '#688571' : '#849879'));
  canopy.position.y = 3.4; canopy.castShadow = true; g.add(canopy); return g;
}
export class World {
  constructor(container) {
    this.container = container; this.mode = 'follow'; this.showSensors = true;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.25;
    this.renderer.domElement.setAttribute('aria-label', '3D road with front, left, right and rear camera views and visible sensor detections');
    container.prepend(this.renderer.domElement);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#cbd8ce'); this.scene.fog = new THREE.Fog('#cbd8ce', 80, 250);
    this.camera = new THREE.PerspectiveCamera(47, 1, .1, 500);
    this.feedCameras = Object.fromEntries(Object.keys(CAMERA_CONFIG).map(name => [name, new THREE.PerspectiveCamera(65, 1.8, .08, CAMERA_CONFIG[name].range_m)]));
    this.scene.add(new THREE.HemisphereLight('#e8eee6', '#9b947d', 2.3));
    this.sun = new THREE.DirectionalLight('#fff1d0', 3.5); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.camera.left = -45; this.sun.shadow.camera.right = 45; this.sun.shadow.camera.top = 65; this.sun.shadow.camera.bottom = -65;
    this.sun.shadow.camera.near = 1; this.sun.shadow.camera.far = 200; this.sun.shadow.normalBias = .04;
    this.scene.add(this.sun, this.sun.target);
    this.ground = box(900, .3, 2600, mat('#b9b99c'), 0, -.3, -900); this.scene.add(this.ground);
    this.static = new THREE.Group(); this.moving = new THREE.Group(); this.scene.add(this.static, this.moving);
    this.ego = makeCar('#37c6ab', true); this.scene.add(this.ego);
    const sensorGeometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = -3; i <= 3; i++) positions.push(0, .08, 0, i * 1.5, .08, -65);
    sensorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.rays = new THREE.LineSegments(sensorGeometry, new THREE.LineBasicMaterial({ color: '#70ffe0', transparent: true, opacity: .21 })); this.scene.add(this.rays);
    this.rays.geometry.dispose();
    const surroundRays = [];
    for (const config of Object.values(CAMERA_CONFIG)) {
      for (let i = -2; i <= 2; i++) {
        const angle = config.yaw_rad + i / 2 * config.horizontal_fov_deg * Math.PI / 360;
        surroundRays.push(config.mount_x_m, .08, -config.mount_z_m, config.mount_x_m + Math.sin(angle) * config.range_m, .08, -config.mount_z_m - Math.cos(angle) * config.range_m);
      }
    }
    this.rays.geometry = new THREE.BufferGeometry(); this.rays.geometry.setAttribute('position', new THREE.Float32BufferAttribute(surroundRays, 3));
    this.zones = Object.fromEntries(['left', 'right'].map(lane => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.45, 14), new THREE.MeshBasicMaterial({ color: '#51cfb0', transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide }));
      plane.rotation.x = -Math.PI / 2; this.scene.add(plane); return [lane, plane];
    }));
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container); this.resize();
  }
  clear(group) {
    const materials = new Set();
    group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) materials.add(o.material); });
    for (const m of materials) if (![asphalt, line, shoulder, metal].includes(m)) { m.map?.dispose(); m.dispose(); }
    group.clear();
  }
  build(sim) {
    this.clear(this.static); this.clear(this.moving); this.meshes = new Map(); this.outlines = new Map(); this.signMeshes = new Map();
    const length = sim.length + 260, center = -sim.length / 2 + 20, rng = seededRandom(sim.seed);
    this.static.add(box(10.4, .12, length, shoulder, 0, -.03, center));
    this.static.add(box(8.05, .1, length, asphalt, 0, .01, center));
    for (const x of [-3.72, 3.72]) this.static.add(box(.1, .011, length, line, x, .068, center));
    for (let z = -100; z < sim.length + 160; z += 8) this.static.add(box(.12, .012, 3.2, line, 0, .069, -z));
    for (const x of [-5.7, 5.7]) this.static.add(box(2.4, .09, length, mat('#c8c4ad'), x, -.005, center));
    for (let z = -80; z < sim.length + 160; z += 12) {
      for (const side of [-1, 1]) {
        if (!sim.crossings.some(c => c.z > z - 4 && c.z < z + 16)) {
          this.static.add(box(.1, .9, .13, metal, side * 5.1, .45, -z));
          this.static.add(box(.1, .12, 11.7, metal, side * 5.1, .8, -z - 6));
        }
        if (rng() < .7) { const t = tree(rng); t.position.set(side * (9 + rng() * 18), 0, -z); t.scale.setScalar(.6 + rng()); this.static.add(t); }
      }
    }
    for (let z = -60; z < sim.length + 220; z += 48) {
      for (const side of [-1, 1]) {
        const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(rng() < .5 ? '#98a18c' : '#aab099'));
        hill.position.set(side * (45 + rng() * 35), 1, -z);
        hill.scale.set(20 + rng() * 25, 10 + rng() * 14, 30 + rng() * 30); hill.receiveShadow = true; this.static.add(hill);
      }
    }
    for (const crossing of sim.crossings) {
      for (let stripe = -2.4; stripe <= 2.4; stripe += .8) this.static.add(box(7.4, .014, .45, line, 0, .077, -crossing.z + stripe));
      this.static.add(box(7.4, .014, .22, line, 0, .077, -crossing.z + STOP_LINE_SETBACK_M));
      for (const side of [-1, 1]) {
        this.static.add(box(.12, 2.8, .12, metal, side * 4.7, 1.4, -crossing.z));
        const globe = new THREE.Mesh(new THREE.SphereGeometry(.23, 10, 8), mat('#f5bd59')); globe.position.set(side * 4.7, 2.9, -crossing.z); this.static.add(globe);
      }
    }
    for (const sign of sim.signs) { const mesh = makeSign(sign); this.static.add(mesh); this.signMeshes.set(sign.id, mesh); }
    for (let x = -4; x < 4; x += .5) for (let z = 0; z < 2; z += .5) this.static.add(box(.5, .015, .5, mat((Math.round(x * 2) + Math.round(z * 2)) % 2 === 0 ? '#eff0de' : '#303b3c'), x + .25, .08, -sim.length - z));
    const finish = mat('#ebad63');
    this.static.add(box(.3, 6.7, .3, finish, -4.65, 3.35, -sim.length));
    this.static.add(box(.3, 6.7, .3, finish, 4.65, 3.35, -sim.length));
    this.static.add(box(9.6, .85, .35, finish, 0, 6.5, -sim.length));
    for (const obj of sim.objects) {
      const mesh = obj.kind === 'car' ? makeCar(carColors[obj.color]) : makePedestrian(carColors[obj.color]);
      const bounds = new THREE.BoxGeometry(obj.width + .2, obj.kind === 'car' ? 1.85 : 1.8, obj.length + .2);
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(bounds), new THREE.LineBasicMaterial({ color: '#51cfb0', transparent: true, opacity: .9 })); bounds.dispose();
      outline.position.y = obj.kind === 'car' ? .93 : .9; outline.visible = false; mesh.add(outline); this.outlines.set(`${obj.kind}-${obj.id}`, outline);
      this.moving.add(mesh); this.meshes.set(obj.id, mesh);
    }
    this.camera.position.set(14, 14, 25); this.lookAt = new THREE.Vector3(0, 0, -24);
  }
  resize() {
    this.width = this.container.clientWidth; this.height = this.container.clientHeight;
    this.renderer.setSize(this.width, this.height); this.camera.aspect = this.width / this.height; this.camera.updateProjectionMatrix();
    this.feedRects = Object.fromEntries(Object.keys(CAMERA_CONFIG).map(name => {
      const tile = this.container.querySelector(`[data-camera="${name}"]`);
      const root = this.container.getBoundingClientRect(), rect = tile.getBoundingClientRect();
      return [name, { x: rect.left - root.left + 1, y: this.height - (rect.bottom - root.top) + 1, width: rect.width - 2, height: rect.height - 2 }];
    }));
  }
  updateSensors(sensors) {
    this.observations = sensors;
    const detected = new Map();
    for (const [name, feed] of Object.entries(sensors.cameras)) for (const object of feed.detections) if (!detected.has(object.id)) detected.set(object.id, sensorColors[name]);
    for (const [id, outline] of this.outlines || []) { outline.visible = this.showSensors && detected.has(id); if (detected.has(id)) outline.material.color.set(detected.get(id)); }
    const observedSigns = new Set(sensors.road_rules.sign_history.map(sign => sign.id));
    for (const [id, mesh] of this.signMeshes || []) { mesh.userData.halo.visible = this.showSensors && observedSigns.has(id); mesh.userData.halo.material.color.set(id === sensors.road_rules.active_sign_id ? '#46c4a3' : '#edb45d'); }
    for (const lane of ['left', 'right']) this.zones[lane].material.color.set(sensors.blind_spots[lane] ? '#ef925e' : '#51cfb0');
  }
  render(sim, dt = .016) {
    const e = sim.ego, z = -e.z;
    this.ego.position.set(e.x, 0, z);
    this.ego.rotation.y = THREE.MathUtils.lerp(this.ego.rotation.y, Math.abs(LANES[e.target] - e.x) > .1 ? -(LANES[e.target] - e.x) * .08 : 0, .1);
    this.ego.userData.brake.emissiveIntensity = ['slow', 'brake', 'emergency'].includes(e.control) ? 3 : .25;
    for (const o of sim.objects) {
      const mesh = this.meshes.get(o.id); mesh.position.set(o.x, 0, -o.z); mesh.visible = Math.abs(o.z - e.z) < 270;
      if (o.kind === 'pedestrian') {
        mesh.rotation.y = -o.direction * Math.PI / 2;
        const swing = o.motion === 'crossing' ? Math.sin(sim.time * 8 + o.id) * .55 : 0;
        mesh.userData.legs.forEach((leg, i) => { leg.rotation.x = i ? -swing : swing; });
        mesh.userData.arms.forEach((arm, i) => { arm.rotation.x = i ? swing : -swing; });
      }
    }
    this.rays.position.set(e.x, 0, z); this.rays.visible = this.showSensors;
    for (const [lane, zone] of Object.entries(this.zones)) { zone.position.set(LANES[lane], .083, z); zone.visible = this.showSensors; }
    this.sun.position.set(-45, 70, z - 15); this.sun.target.position.set(0, 0, z - 30);
    let target, look;
    if (this.mode === 'overhead') { target = new THREE.Vector3(0, 65, z + 8); look = new THREE.Vector3(0, 0, z - 20); }
    else if (this.mode === 'driver') { target = new THREE.Vector3(e.x, 1.65, z - .7); look = new THREE.Vector3(e.x, 1.5, z - 60); }
    else { target = new THREE.Vector3(e.x + 13, 14, z + 23); look = new THREE.Vector3(0, 0, z - 16); }
    const k = Math.min(1, dt * 7); this.camera.position.lerp(target, k); this.lookAt.lerp(look, k); this.camera.lookAt(this.lookAt);
    this.renderer.setScissorTest(false); this.renderer.setViewport(0, 0, this.width, this.height); this.renderer.render(this.scene, this.camera);
    this.rays.visible = false; for (const zone of Object.values(this.zones)) zone.visible = false;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.setScissorTest(true);
    for (const [name, config] of Object.entries(CAMERA_CONFIG)) {
      const camera = this.feedCameras[name], rect = this.feedRects[name];
      camera.aspect = rect.width / rect.height;
      camera.fov = 2 * Math.atan(Math.tan(config.horizontal_fov_deg * Math.PI / 360) / camera.aspect) * 180 / Math.PI; camera.updateProjectionMatrix();
      camera.position.set(e.x + config.mount_x_m, 1.05, z - config.mount_z_m);
      camera.lookAt(camera.position.x + Math.sin(config.yaw_rad) * 40, 1.05, camera.position.z - Math.cos(config.yaw_rad) * 40);
      this.renderer.setScissor(rect.x, rect.y, rect.width, rect.height); this.renderer.setViewport(rect.x, rect.y, rect.width, rect.height); this.renderer.render(this.scene, camera);
    }
    this.renderer.setScissorTest(false); this.renderer.shadowMap.autoUpdate = true;
  }
}
