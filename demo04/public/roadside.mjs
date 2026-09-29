// Presentation only. Road, sign and crossing positions come from the original world.
// Metres in world space; simulation +z maps to Three.js -z.
import * as THREE from '/vendor/three.module.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function random(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let v = Math.imul(n ^ n >>> 15, n | 1); v ^= v + Math.imul(v ^ v >>> 7, v | 61); return ((v ^ v >>> 14) >>> 0) / 4294967296; };
}
function canvasTexture(size, paint, anisotropy, color = true) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  paint(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function noiseSurface(size, rgb, grain, seed, anisotropy, extra) {
  return canvasTexture(size, (ctx, n) => {
    const rng = random(seed), pixels = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const index = (y * n + x) * 4;
      const grit = (rng() - 0.5) * grain;
      const mottling = Math.sin(x / 31) * Math.cos(y / 43) * grain * 0.12 + Math.cos((x + y) / 71) * grain * 0.08;
      for (let c = 0; c < 3; c++) pixels.data[index + c] = clamp(rgb[c] + grit + mottling, 0, 255);
      pixels.data[index + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0); extra?.(ctx, n, rng);
  }, anisotropy);
}
function signTexture(limit, anisotropy) {
  return canvasTexture(256, ctx => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#ebe9df'; ctx.beginPath(); ctx.arc(128, 128, 125, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#be2822'; ctx.lineWidth = 24; ctx.beginPath(); ctx.arc(128, 128, 109, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#182125'; ctx.font = '700 121px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(limit), 128, 135);
  }, anisotropy);
}
function makeTileTexture(anisotropy) {
  return canvasTexture(512, (ctx, n) => {
    const rng = random(411);
    ctx.fillStyle = '#553d2f'; ctx.fillRect(0, 0, n, n);
    const tw = 64, th = 85.34;
    for (let row = -1; row < 7; row++) for (let col = -1; col < 9; col++) {
      const x = col * tw, y = row * th;
      const v = 0.82 + rng() * 0.33;
      const grad = ctx.createLinearGradient(x, 0, x + tw, 0);
      grad.addColorStop(0, `rgb(${111*v},${66*v},${45*v})`);
      grad.addColorStop(0.4, `rgb(${165*v},${103*v},${68*v})`);
      grad.addColorStop(0.7, `rgb(${158*v},${91*v},${59*v})`);
      grad.addColorStop(1, `rgb(${93*v},${59*v},${44*v})`);
      ctx.fillStyle = grad; ctx.fillRect(x + 1, y + 2, tw - 2, th - 3);
      ctx.fillStyle = 'rgba(47,35,26,.34)'; ctx.fillRect(x, y + th - 3, tw, 3);
      ctx.fillStyle = 'rgba(248,209,150,.12)'; ctx.fillRect(x + 2, y + 3, tw - 5, 2);
      for (let k = 0; k < 90; k++) { ctx.fillStyle = rng() < 0.5 ? 'rgba(242,215,153,.07)' : 'rgba(37,42,27,.11)'; ctx.fillRect(x + rng() * tw, y + rng() * th, 1 + rng() * 2, 1 + rng() * 3); }
    }
  }, anisotropy);
}
function makeBrickTexture(anisotropy) {
  return canvasTexture(512, (ctx, n) => {
    const rng = random(97); ctx.fillStyle = '#a39887'; ctx.fillRect(0, 0, n, n);
    for (let row = 0; row < 16; row++) for (let col = -1; col < 9; col++) {
      const x = col * 64 + row % 2 * 32, y = row * 32;
      const shade = 0.83 + rng() * 0.3;
      ctx.fillStyle = `rgb(${151 * shade},${92 * shade},${68 * shade})`; ctx.fillRect(x + 2, y + 2, 60, 28);
      for (let j = 0; j < 60; j++) { ctx.fillStyle = rng() < 0.5 ? 'rgba(55,39,29,.11)' : 'rgba(226,183,144,.13)'; ctx.fillRect(x + rng() * 60, y + rng() * 28, 1 + rng() * 4, 1 + rng() * 2); }
      ctx.fillStyle = 'rgba(51,42,32,.16)'; ctx.fillRect(x + 2, y + 27, 60, 3);
    }
  }, anisotropy);
}
function makeWindowTexture(anisotropy) {
  return canvasTexture(256, (ctx, n) => {
    const sky = ctx.createLinearGradient(0, 0, 0, n); sky.addColorStop(0, '#9cabaa'); sky.addColorStop(0.44, '#657f85'); sky.addColorStop(0.5, '#3f5c62'); sky.addColorStop(1, '#24383c'); ctx.fillStyle = sky; ctx.fillRect(0, 0, n, n);
    ctx.fillStyle = 'rgba(29,53,38,.36)';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(i * 40 - 35, 240); ctx.lineTo(i * 40, 100 - i % 3 * 20); ctx.lineTo(i * 40 + 35, 240); ctx.fill(); }
    ctx.fillStyle = 'rgba(240,237,219,.42)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(42, 0); ctx.quadraticCurveTo(28, 140, 62, 256); ctx.lineTo(0, 256); ctx.fill();
    ctx.beginPath(); ctx.moveTo(256, 0); ctx.lineTo(225, 0); ctx.quadraticCurveTo(210, 150, 192, 256); ctx.lineTo(256, 256); ctx.fill();
    ctx.fillStyle = 'rgba(229,246,246,.09)'; ctx.beginPath(); ctx.moveTo(50, 0); ctx.lineTo(130, 0); ctx.lineTo(240, 256); ctx.lineTo(160, 256); ctx.fill();
  }, anisotropy);
}

// Each spatial chunk merges all repeated boxes and poles into material batches.
// This keeps rich facades cheap in the main view and all four sensor cameras.
class Batch {
  constructor(group) { this.group = group; this.entries = new Map(); this.dummy = new THREE.Object3D(); }
  add(geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0, shadow = true) {
    const key = `${geometry.uuid}/${material.uuid}/${shadow}`;
    let entry = this.entries.get(key);
    if (!entry) { entry = { geometry, material, matrices: [], shadow }; this.entries.set(key, entry); }
    const d = this.dummy; d.position.set(x, y, z); d.scale.set(sx, sy, sz); d.rotation.set(rx, ry, rz); d.updateMatrix(); entry.matrices.push(this.transform ? d.matrix.clone().premultiply(this.transform) : d.matrix.clone());
  }
  finish() {
    for (const { geometry, material, matrices, shadow } of this.entries.values()) {
      const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
      matrices.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.computeBoundingSphere(); this.group.add(mesh);
    }
    this.entries.clear();
  }
}
function roofGeometry(hipped = false) {
  // Shallow real corrugation catches the sun; the repeating texture provides courses.
  const p = [], uv = [], idx = [], width = 3.45, rise = 2.05, length = 8.0;
  const nx = 14, nz = 112;
  for (const side of [-1, 1]) {
    const start = p.length / 3;
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
      const t = i / nx, z = (j / nz - 0.5) * length;
      const ridge = Math.sin((j % 4) / 4 * Math.PI) * 0.026;
      const overlap = i < nx ? 0.012 : 0;
      const roofHeight = Math.min(rise * (1 - t), hipped ? (length / 2 - Math.abs(z)) / 1.75 * rise : rise);
      p.push(side * width * t, 3.52 + roofHeight + ridge + overlap, z);
      uv.push(j / nz * 3.5, t * 2.35);
    }
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const a = start + i * (nz + 1) + j, b = a + nz + 1;
      if (side === 1) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function wallGeometry() {
  const shape = new THREE.Shape();
  const halfWidth = 2.98, halfHeight = 1.57;
  shape.moveTo(-halfWidth, -halfHeight); shape.lineTo(halfWidth, -halfHeight); shape.lineTo(halfWidth, halfHeight); shape.lineTo(-halfWidth, halfHeight); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 7.06, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 1, steps: 1 });
  geo.translate(0, 0, -3.53); return geo;
}
function gableGeometry() {
  const shape = new THREE.Shape(); shape.moveTo(-3.0, 0); shape.lineTo(3, 0); shape.lineTo(0, 1.79); shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false });
}

export function buildRoadside(world, { anisotropy = 8 } = {}) {
  const root = new THREE.Group(); root.name = 'Road architecture';
  const L = world.length, unit = new THREE.BoxGeometry(1, 1, 1), plane = new THREE.PlaneGeometry(1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 10), round = new THREE.CylinderGeometry(1, 1, 1, 20);
  const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.87, ...options });
  const asphaltMap = noiseSurface(512, [83, 85, 83], 31, 709, anisotropy, (ctx, n, rng) => {
    for (let i = 0; i < 13500; i++) { const v = rng(); ctx.fillStyle = v < .35 ? 'rgba(18,23,23,.20)' : 'rgba(197,184,166,.17)'; const r = .3 + rng() * 1.3; ctx.beginPath(); ctx.ellipse(rng() * n, rng() * n, r, r * .7, rng() * TAU, 0, TAU); ctx.fill(); }
  });
  asphaltMap.repeat.set(7.8 / 2.2, (L + 260) / 2.2);
  const asphalt = mat(0xc2c5c0, { map: asphaltMap, bumpMap: asphaltMap, bumpScale: .019, roughness: .96 });
  const gravelMap = noiseSurface(512, [153, 145, 126], 52, 301, anisotropy, (ctx, n, rng) => {
    for (let i = 0; i < 11000; i++) { const r = 1 + rng() * 2.3, c = Math.floor(113 + rng() * 65); ctx.fillStyle = `rgb(${c},${c*.96},${c*.86})`; ctx.beginPath(); ctx.ellipse(rng() * n, rng() * n, r, r * .72, rng() * TAU, 0, TAU); ctx.fill(); }
  });
  gravelMap.repeat.set(.7, (L + 260) / 2.5);
  const gravel = mat(0xb5ae95, { map: gravelMap, bumpMap: gravelMap, bumpScale: .035 });
  const paintMap = noiseSurface(256, [227, 224, 206], 36, 93, anisotropy, (ctx, n, rng) => {
    for (let i = 0; i < 1600; i++) { ctx.fillStyle = 'rgba(78,82,76,.28)'; ctx.fillRect(rng() * n, rng() * n, 1 + rng() * 2, rng() * 7); }
  });
  const white = mat(0xf1eddc, { map: paintMap, roughness: .94 });
  const amber = mat(0xdfc893, { map: paintMap, roughness: .93 });
  const concreteMap = noiseSurface(256, [191, 184, 166], 34, 78, anisotropy);
  const concrete = mat(0xc7c6b4, { map: concreteMap, bumpMap: concreteMap, bumpScale: .015 });
  const galvanized = mat(0x8e9996, { metalness: .78, roughness: .35 });
  const metalDark = mat(0x303d3b, { metalness: .52, roughness: .48 });
  const black = mat(0x202928, { roughness: .88 });
  const reflector = mat(0xf4e4b8, { emissive: 0xd9be86, emissiveIntensity: .1, roughness: .3 });
  const markerWhite = mat(0xeeeadd, { roughness: .71 });
  const terracottaMap = makeTileTexture(anisotropy);
  const roofMats = [mat(0xd6b1a0, { map: terracottaMap, bumpMap: terracottaMap, bumpScale: .052, side: THREE.DoubleSide }), mat(0xc4c4bd, { map: terracottaMap, bumpMap: terracottaMap, bumpScale: .048, side: THREE.DoubleSide }), mat(0x9da49c, { map: terracottaMap, bumpMap: terracottaMap, bumpScale: .045, side: THREE.DoubleSide })];
  const stucco = noiseSurface(256, [207, 200, 180], 24, 88, anisotropy);
  const walls = [0xe6dac1, 0xdccbb1, 0xd5d8cb, 0xeee5d0].map(c => mat(c, { map: stucco, bumpMap: stucco, bumpScale: .014 }));
  const brickMap = makeBrickTexture(anisotropy); brickMap.repeat.set(.4, .9);
  const brick = mat(0xd1b3a2, { map: brickMap, bumpMap: brickMap, bumpScale: .035 });
  const frame = mat(0xd7d7c9, { roughness: .65 });
  const recess = mat(0x383e37);
  const window = mat(0xbfd2d5, { map: makeWindowTexture(anisotropy), metalness: .22, roughness: .2 });
  const shutters = [0x596756, 0x727d78, 0x606c79, 0x8e6652].map(c => mat(c));
  const timber = mat(0x756955);
  const fenceMat = mat(0x9e967d);
  const hedgeTexture = noiseSurface(256, [158, 168, 141], 57, 44, anisotropy, (ctx, n, rng) => {
    for (let i = 0; i < 8000; i++) { ctx.fillStyle = rng() < .35 ? 'rgba(18,37,14,.24)' : 'rgba(212,216,176,.12)'; ctx.beginPath(); ctx.ellipse(rng() * n, rng() * n, 1 + rng() * 2.7, 1 + rng() * 1.5, rng() * TAU, 0, TAU); ctx.fill(); }
  });
  const hedgeMats = [0x6d8158, 0x77875b, 0x839668].map(c => mat(c, { map: hedgeTexture, bumpMap: hedgeTexture, bumpScale: .032 }));
  const flowers = [0xb15f55, 0xdebd85, 0xac9cbd].map(c => mat(c));
  const drain = mat(0x454d46, { metalness: .42, roughness: .85 });
  const tileRidge = mat(0x95664c);
  const gable = gableGeometry(), roof = roofGeometry(), hipRoof = roofGeometry(true), houseWall = wallGeometry();
  const hedgeGeo = new THREE.IcosahedronGeometry(1, 1);
  const clippedHedge = new THREE.SphereGeometry(1, 10, 8);
  const hedgePosition = clippedHedge.attributes.position;
  for (let i = 0; i < hedgePosition.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(hedgePosition, i);
    const shape = n => Math.sign(n) * Math.pow(Math.abs(n), .46);
    hedgePosition.setXYZ(i, shape(v.x), shape(v.y), shape(v.z));
  }
  clippedHedge.computeVertexNormals();
  const allChunks = new Map();
  const chunkAt = z => {
    const index = Math.floor(z / 120);
    if (!allChunks.has(index)) { const group = new THREE.Group(); group.name = `Roadside ${index}`; root.add(group); allChunks.set(index, { group, batch: new Batch(group), z: index * 120 + 60 }); }
    return allChunks.get(index).batch;
  };
  const base = new Batch(root);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7.8, L + 260), asphalt); road.rotation.x = -Math.PI / 2; road.position.set(0, .001, -L / 2 - 30); road.receiveShadow = true; root.add(road);
  // Tapered gravel shoulders replace the original uninterrupted raised kerbs.
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(1.35, L + 260), gravel); shoulder.rotation.x = -Math.PI / 2; shoulder.position.set(side * 4.565, -.005, -L / 2 - 30); shoulder.receiveShadow = true; root.add(shoulder);
    base.add(plane, white, side * 3.45, .014, -L / 2 - 30, .12, L + 260, 1, -Math.PI / 2, 0, 0, false);
  }
  // Very faint longitudinal wear is translucent; it does not add road markings.
  const wearMap = canvasTexture(256, (ctx, n) => {
    ctx.clearRect(0, 0, n, n); const gradient = ctx.createLinearGradient(0, 0, n, 0);
    gradient.addColorStop(0, 'rgba(32,37,35,0)'); gradient.addColorStop(.3, 'rgba(32,37,35,.12)'); gradient.addColorStop(.5, 'rgba(32,37,35,.22)'); gradient.addColorStop(.7, 'rgba(32,37,35,.12)'); gradient.addColorStop(1, 'rgba(32,37,35,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, n, n);
  }, anisotropy);
  const wear = mat(0xffffff, { map: wearMap, transparent: true, depthWrite: false, roughness: .82 });
  for (const x of [-2.55, -.95, .95, 2.55]) base.add(plane, wear, x, .005, -L / 2 - 30, .49, L + 260, 1, -Math.PI / 2, 0, 0, false);
  const repairsTexture = canvasTexture(512, (ctx, n) => {
    const rng = random(922); ctx.clearRect(0, 0, n, n);
    ctx.strokeStyle = 'rgba(38,43,40,.31)'; ctx.lineWidth = 2.3; ctx.lineCap = 'round';
    ctx.beginPath(); let x = n * .48; ctx.moveTo(x, -4);
    for (let y = 0; y < n + 20; y += 24) { x += (rng() - .5) * 31; ctx.lineTo(x, y); }
    ctx.stroke();
    for (let branch = 0; branch < 4; branch++) { const y = 70 + branch * 117; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 35, y + 28); ctx.lineTo(x + 68, y + 40); ctx.stroke(); }
  }, anisotropy);
  const repairs = mat(0xffffff, { map: repairsTexture, transparent: true, depthWrite: false, roughness: .98 });
  for (let z = 56; z < L + 70; z += 93) {
    const side = Math.floor(z) % 2 ? 1 : -1;
    chunkAt(z).add(plane, repairs, side * 2.9, .009, -z, .8, 5.3, 1, -Math.PI / 2, 0, 0, false);
  }
  for (let z = -60; z < L + 120; z += 9) if (!world.noPassing.some(n => z + 3 > n.from && z < n.to)) chunkAt(z).add(plane, amber, 0, .015, -z - 1.5, .14, 3, 1, -Math.PI / 2, 0, 0, false);
  for (const n of world.noPassing) {
    // Split only for render culling; endpoints are kept identical to the simulation.
    for (let from = n.from; from < n.to; from += 90) { const to = Math.min(from + 90, n.to); chunkAt(from).add(plane, amber, 0, .016, -(from + to) / 2, .16, to - from, 1, -Math.PI / 2, 0, 0, false); }
  }
  for (const c of world.crossings) {
    const b = chunkAt(c.z);
    for (let i = 0; i < 7; i++) b.add(plane, white, -3 + i, .018, -c.z, .55, 3.2, 1, -Math.PI / 2, 0, 0, false);
    b.add(plane, white, 1.75, .018, -c.stopLineZ, 3.4, .4, 1, -Math.PI / 2, 0, 0, false);
    for (const side of [-1, 1]) {
      b.add(unit, concrete, side * 5.4, .06, -c.z, 2.2, .12, 4, 0, 0, 0, false);
      // Approach slabs, tactile paving and a narrow drainage grate at each landing.
      for (let p = -2; p <= 2; p++) { b.add(unit, concrete, side * 4.26, .035, -c.z + p * .76, .3, .07, .72, 0, 0, 0, false); }
      b.add(unit, concrete, side * 4.78, .135, -c.z, .5, .035, 2.9, 0, 0, 0, false);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 18; col++) b.add(round, markerWhite, side * (4.6 + row * .095), .164, -c.z - 1.3 + col * .15, .015, .014, .015, 0, 0, 0, false);
      for (const offset of [-2.6, 2.6]) { b.add(unit, drain, side * 3.73, .011, -c.z + offset, .25, .025, .8, 0, 0, 0, false); for (let k = 0; k < 7; k++) b.add(unit, galvanized, side * 3.73, .028, -c.z + offset - .33 + k * .11, .22, .011, .035, 0, 0, 0, false); }
    }
  }
  const signMats = new Map();
  for (const s of world.signs) {
    const b = chunkAt(s.z); const z = -s.z;
    b.add(round, concrete, 5.4, .06, z, .17, .12, .17, 0, 0, 0, false);
    b.add(cylinder, galvanized, 5.4, 1.38, z, .045, 2.76, .045);
    b.add(round, galvanized, 5.4, 2.55, z, .505, .045, .505, Math.PI / 2);
    for (const y of [2.28, 2.8]) b.add(unit, galvanized, 5.4, y, z - .055, .44, .05, .075);
    if (!signMats.has(s.limit)) signMats.set(s.limit, mat(0xffffff, { map: signTexture(s.limit, anisotropy), roughness: .68 }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.492, 48), signMats.get(s.limit)); disc.position.set(5.4, 2.55, z + .027); b.group.add(disc);
  }
  // Rural delineators: black panel and reflectors are on the face seen by traffic.
  for (let z = -20; z < L + 100; z += 32) for (const side of [-1, 1]) {
    if (world.crossings.some(c => Math.abs(c.z - z) < 5) || world.signs.some(s => side > 0 && Math.abs(s.z - z) < 3)) continue;
    const b = chunkAt(z), x = side * 4.86;
    b.add(unit, markerWhite, x, .48, -z, .115, .96, .14, 0, 0, side * -.035);
    b.add(unit, black, x, .77, -z + .076, .12, .26, .017, 0, 0, side * -.035);
    b.add(unit, reflector, x, .77, -z + .088, side > 0 ? .064 : .055, side > 0 ? .115 : .045, .012, 0, 0, 0, false);
    if (side < 0) b.add(unit, reflector, x, .86, -z + .088, .055, .045, .012, 0, 0, 0, false);
  }

  const lampCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 4.35, 0), new THREE.Vector3(.13, 4.85, 0), new THREE.Vector3(.55, 5.08, 0), new THREE.Vector3(1.2, 5.08, 0)]);
  const lampTube = new THREE.TubeGeometry(lampCurve, 20, .047, 8, false);
  const lampLens = mat(0xe3e3cc, { emissive: 0xffdda4, emissiveIntensity: .22, roughness: .35 });
  for (const o of world.scenery) if (o.kind === 'lamp') {
    const b = chunkAt(o.z);
    b.add(round, concrete, o.x, .06, -o.z, .2, .12, .2);
    b.add(cylinder, galvanized, o.x, .32, -o.z, .095, .64, .095);
    b.add(lampTube, galvanized, o.x, 0, -o.z);
    b.add(unit, metalDark, o.x + 1.15, 5.035, -o.z, .74, .13, .29);
    b.add(unit, lampLens, o.x + 1.19, 4.96, -o.z, .59, .028, .21, 0, 0, 0, false);
    b.add(unit, metalDark, o.x, 1.22, -o.z + .052, .075, .24, .027, 0, 0, 0, false);
  }

  for (const o of world.scenery) if (o.kind === 'house') {
    const b = chunkAt(o.z), s = o.scale, side = o.x < 0 ? 1 : -1, variant = o.color % 4, rng = random(Math.floor(o.z * 79 + Math.abs(o.x) * 991));
    const houseYaw = (rng() - .5) * .11;
    b.transform = new THREE.Matrix4().makeTranslation(o.x, 0, -o.z).multiply(new THREE.Matrix4().makeRotationY(houseYaw)).multiply(new THREE.Matrix4().makeTranslation(-o.x, 0, o.z));
    const X = x => o.x + x * s, Y = y => y * s, Z = z => -o.z + z * s;
    const box = (material, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0, shadow = true) => b.add(unit, material, X(x), Y(y), Z(z), w * s, h * s, d * s, rx, ry, rz, shadow);
    const pole = (material, x, y, z, radius, length, rx = 0, ry = 0, rz = 0) => b.add(cylinder, material, X(x), Y(y), Z(z), radius * s, length * s, radius * s, rx, ry, rz);
    const wall = walls[variant], shutter = shutters[variant], roofMat = roofMats[variant === 2 ? 2 : variant === 1 ? 1 : 0], hipped = variant === 1;
    box(concrete, 0, .17, 0, 6.13, .34, 7.25);
    b.add(houseWall, wall, X(0), Y(1.93), Z(0), s, s, s);
    // The dark stone plinth and corner quoins reveal the thickness of the walls.
    box(concrete, 0, .43, 0, 6.08, .22, 7.17);
    for (const x of [-2.94, 2.94]) for (const z of [-3.5, 3.5]) for (let y = .76; y < 3.3; y += .42) box(frame, x, y, z, .19, .37, .2, 0, 0, 0, false);
    if (!hipped) {
      b.add(gable, wall, X(0), Y(3.51), Z(3.42), s, s, s);
      b.add(gable, wall, X(0), Y(3.51), Z(-3.58), s, s, s);
    }
    b.add(hipped ? hipRoof : roof, roofMat, X(0), 0, Z(0), s, s, s);
    // Bargeboards outline the pitched roof; the underside stays visibly recessed.
    const angle = Math.atan2(2.05, 3.45), slope = Math.hypot(3.45, 2.05);
    for (const z of [-4.01, 4.01]) {
      if (hipped) { box(timber, 0, 3.48, z, 6.95, .17, .13); pole(galvanized, 0, 3.44, z, .065, 6.96, 0, 0, Math.PI / 2); }
      else for (const sign of [-1, 1]) box(timber, sign * 1.725, 4.54, z, slope, .12, .115, 0, 0, -sign * angle);
    }
    if (hipped) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const direction = new THREE.Vector3(sx * 3.45, -2.05, sz * 1.75), length = direction.length();
      const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
      for (let t = 0; t < 1; t += .08) pole(tileRidge, sx * 3.45 * t, 5.59 - 2.05 * t, sz * (2.25 + 1.75 * t), .09, length * .085, rotation.x, rotation.y, rotation.z);
    }
    if (variant === 0 || variant === 2) {
      // A rooflight, set into the street-facing pitch with a restrained metal surround.
      const y = 3.52 + 2.05 * (1 - 1.7 / 3.45);
      box(metalDark, side * 1.7, y + .045, .88, 1.18, .065, .97, 0, 0, -side * angle);
      box(window, side * 1.7, y + .087, .88, 1.05, .029, .84, 0, 0, -side * angle, false);
      box(frame, side * 1.7, y + .11, .88, .04, .025, .83, 0, 0, -side * angle, false);
    }
    for (const x of [-3.42, 3.42]) {
      box(timber, x, 3.48, 0, .13, .17, 8.0);
      pole(galvanized, x, 3.44, 0, .065, 8.05, Math.PI / 2);
      for (const z of [-3.43, 3.43]) {
        pole(galvanized, x > 0 ? 3.11 : -3.11, 1.8, z, .045, 3.37);
        box(galvanized, x > 0 ? 3.26 : -3.26, 3.39, z, .34, .07, .07);
        for (const y of [.61, 2.68]) box(metalDark, x > 0 ? 3.11 : -3.11, y, z, .11, .038, .12, 0, 0, 0, false);
      }
    }
    for (let z = hipped ? -2.14 : -3.85; z < (hipped ? 2.26 : 4); z += .32) pole(tileRidge, 0, 5.595, z, .105, .34, Math.PI / 2);
    box(brick, 1.55, 4.99, -1.87, .64, 1.53, .69);
    box(concrete, 1.55, 5.78, -1.87, .82, .14, .87);
    for (const z of [-2.04, -1.71]) { pole(tileRidge, 1.55, 5.96, z, .115, .25); pole(black, 1.55, 6.09, z, .088, .012); }
    // Windows are complete shallow assemblies, including reveals, seals and sills.
    function windowAt(x, y, z, w, h, orientation = 0, openShutters = true) {
      const transform = (u, v, n) => orientation ? [x + n * orientation, y + v, z + u] : [x + u, y + v, z + n * (z < 0 ? -1 : 1)];
      function bit(material, u, v, n, width, height, depth, shadow = false) {
        const p = transform(u, v, n); box(material, ...p, orientation ? depth : width, height, orientation ? width : depth, 0, 0, 0, shadow);
      }
      bit(recess, 0, 0, .012, w + .2, h + .2, .07);
      bit(window, 0, 0, .058, w, h, .04);
      for (const u of [-w / 2 - .035, w / 2 + .035]) bit(frame, u, 0, .088, .07, h + .14, .095);
      for (const v of [-h / 2 - .035, h / 2 + .035]) bit(frame, 0, v, .088, w + .14, .07, .095);
      bit(frame, 0, 0, .096, .046, h, .047);
      bit(frame, 0, .03, .098, w, .038, .048);
      bit(concrete, 0, -h / 2 - .12, .095, w + .32, .12, .32, true);
      bit(concrete, 0, h / 2 + .14, .032, w + .32, .16, .17);
      if (openShutters) for (const sign of [-1, 1]) {
        bit(shutter, sign * (w * .74 + .11), 0, .047, w * .4, h + .16, .08, true);
        for (let slat = -h / 2 + .07; slat < h / 2; slat += .13) bit(timber, sign * (w * .74 + .11), slat, .094, w * .35, .02, .018);
        bit(metalDark, sign * (w * .74 + .11), -.31, .106, w * .36, .025, .018);
      }
    }
    for (const z of [-1.95, 1.95]) windowAt(side * 3.02, 2.0, z, 1.12, 1.35, side);
    for (const x of [-1.76, 1.76]) {
      windowAt(x, 2.0, 3.565, 1.07, 1.28);
      windowAt(x, 2.0, -3.565, 1.07, 1.28, 0, false);
    }
    if (!hipped) windowAt(0, 4.38, 3.59, .62, .72, 0, false);
    // Entry faces the road, with a small timber canopy and two stone steps.
    box(recess, side * 3.041, 1.44, 0, .06, 2.25, 1.04);
    box(shutter, side * 3.09, 1.43, 0, .07, 2.1, .87);
    for (const z of [-.47, .47]) box(frame, side * 3.13, 1.45, z, .13, 2.23, .08);
    box(frame, side * 3.13, 2.56, 0, .13, .11, 1.05);
    box(window, side * 3.132, 2.1, 0, .027, .54, .57, 0, 0, 0, false);
    box(timber, side * 3.134, 1.18, 0, .025, .91, .58, 0, 0, 0, false);
    box(galvanized, side * 3.19, 1.37, -.3, .045, .035, .15, 0, 0, 0, false);
    box(concrete, side * 3.56, .26, 0, 1.03, .22, 1.53);
    box(concrete, side * 4.02, .12, 0, .58, .15, 1.78);
    box(timber, side * 3.65, 2.77, 0, 1.3, .12, 1.76, 0, 0, side * .14);
    box(roofMat, side * 3.65, 2.85, 0, 1.36, .08, 1.82, 0, 0, side * .14);
    for (const z of [-.73, .73]) box(timber, side * 4.09, 1.56, z, .075, 2.42, .075);
    // Small mail slot, a porch lantern and rain barrel add domestic scale.
    box(metalDark, side * 3.17, 1.55, .83, .13, .29, .22);
    box(reflector, side * 3.24, 2.08, .81, .08, .17, .12, 0, 0, 0, false);
    if (variant % 2) { pole(shutter, -side * 3.58, .47, 2.72, .36, .86); pole(metalDark, -side * 3.58, .92, 2.72, .375, .035); }
    // A path stays on the garden side of the road; no unmodelled driveway crosses lanes.
    const roadwardEdge = X(side * 4.25), outer = side === -1 ? 6.2 : -6.2;
    const pathLength = Math.max(0, Math.abs(roadwardEdge - outer));
    if (pathLength > 0) {
      b.add(unit, concrete, (roadwardEdge + outer) / 2, .005, -o.z, pathLength, .04, 1.32 * s, 0, 0, 0, false);
      for (let p = 1; p < pathLength / .8; p++) b.add(unit, gravel, roadwardEdge + side * p * .8, .028, -o.z, .016, .009, 1.3 * s, 0, 0, 0, false);
    }
    const fx = side * 5.6;
    for (const direction of [-1, 1]) {
      for (let z = 1.16; z < 5.31; z += .45) {
        box(fenceMat, fx, .53, direction * z, .064, 1.0, .075);
      }
      box(fenceMat, fx, .37, direction * 3.05, .09, .075, 4.5);
      box(fenceMat, fx, .77, direction * 3.05, .09, .075, 4.5);
      for (let x = -2.7; x < 4.9; x += .72) {
        const hx = x * side;
        b.add(clippedHedge, hedgeMats[variant % 3], X(hx), Y(.49 + rng() * .025), Z(direction * 5.07), .52 * s, .49 * s, .5 * s, 0, (rng() - .5) * .08, 0);
      }
    }
    // Low planted flower boxes sit beneath the front windows.
    for (const z of [-1.95, 1.95]) {
      box(timber, side * 3.2, 1.14, z, .37, .19, 1.08);
      for (let k = 0; k < 6; k++) {
        b.add(hedgeGeo, hedgeMats[k % 3], X(side * 3.26), Y(1.29), Z(z - .43 + k * .17), .14 * s, .13 * s, .14 * s, 0, 0, 0, false);
        b.add(hedgeGeo, flowers[variant % 3], X(side * 3.3), Y(1.4 + rng() * .04), Z(z - .4 + k * .17), .065 * s, .055 * s, .07 * s, 0, 0, 0, false);
      }
    }
    b.transform = null;
  }
  base.finish();
  for (const c of allChunks.values()) c.batch.finish();
  root.userData.update = egoZ => {
    for (const c of allChunks.values()) c.group.visible = Math.abs(c.z - egoZ) < 590;
  };
  root.userData.update(0);
  return root;
}
