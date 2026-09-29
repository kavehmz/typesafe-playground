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

function makeSlateTexture(anisotropy) {
  return canvasTexture(512, (ctx, n) => {
    const rng = random(801); ctx.fillStyle = '#343a3d'; ctx.fillRect(0, 0, n, n);
    for (let row = -1; row < 12; row++) for (let col = -1; col < 10; col++) {
      const x = col * 64 + row % 2 * 32, y = row * 48, v = .8 + rng() * .42;
      ctx.fillStyle = `rgb(${91*v},${102*v},${105*v})`; ctx.fillRect(x + 1, y + 1, 62, 46);
      ctx.fillStyle = 'rgba(198,199,182,.14)'; ctx.fillRect(x + 2, y + 2, 59, 1.5);
      for (let k = 0; k < 45; k++) { ctx.fillStyle = rng() < .5 ? 'rgba(28,38,41,.13)' : 'rgba(178,182,162,.10)'; ctx.fillRect(x + rng() * 61, y + rng() * 44, 1 + rng() * 11, .6); }
    }
  }, anisotropy);
}
function makeStoneTexture(anisotropy) {
  return canvasTexture(512, (ctx, n) => {
    const rng = random(319); ctx.fillStyle = '#9a9686'; ctx.fillRect(0, 0, n, n);
    for (let row = 0; row < 9; row++) {
      let x = -70 + (row % 2) * 45;
      while (x < n) {
        const w = 48 + rng() * 65, y = row * 57, v = .85 + rng() * .27;
        ctx.fillStyle = `rgb(${177*v},${171*v},${147*v})`; ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + w - 4, y + 2); ctx.lineTo(x + w - 2, y + 51); ctx.lineTo(x + 5, y + 54); ctx.closePath(); ctx.fill();
        for (let k = 0; k < 110; k++) { ctx.fillStyle = rng() < .5 ? 'rgba(44,51,38,.07)' : 'rgba(255,250,229,.10)'; ctx.fillRect(x + 5 + rng() * (w - 9), y + 4 + rng() * 46, rng() * 4 + .5, rng() * 2 + .5); }
        ctx.strokeStyle = 'rgba(68,72,57,.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 4, y + 52); ctx.lineTo(x + w - 2, y + 51); ctx.stroke(); x += w;
      }
    }
  }, anisotropy);
}
function apertureWall(width, height, openings, gableRise = 0) {
  const shape = new THREE.Shape(); shape.moveTo(-width / 2, .32); shape.lineTo(width / 2, .32); shape.lineTo(width / 2, height);
  if (gableRise) shape.lineTo(0, height + gableRise);
  shape.lineTo(-width / 2, height); shape.closePath();
  for (const o of openings) {
    const hole = new THREE.Path(), left = o.u - o.w / 2, bottom = o.y - o.h / 2;
    // Openings genuinely penetrate the wall. Window glass and joinery sit inside.
    hole.moveTo(left, bottom); hole.lineTo(left, bottom + o.h); hole.lineTo(left + o.w, bottom + o.h); hole.lineTo(left + o.w, bottom); hole.closePath(); shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: .24, bevelEnabled: false }); g.translate(0, 0, -.24); return g;
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
function roofGeometry(hipped = false, config = {}) {
  // Shallow real corrugation catches the sun; the repeating texture provides courses.
  const p = [], uv = [], idx = [], width = config.width ?? 3.45, rise = config.rise ?? 2.05, length = config.length ?? 8.0, eave = config.eave ?? 3.52;
  const nx = 12, nz = config.slate ? 42 : 84;
  for (const side of [-1, 1]) {
    const start = p.length / 3;
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
      const t = i / nx, z = (j / nz - 0.5) * length;
      const ridge = config.slate ? 0 : Math.sin((j % 4) / 4 * Math.PI) * 0.026;
      const overlap = i < nx ? 0.012 : 0;
      const roofHeight = Math.min(rise * (1 - t), hipped ? (length / 2 - Math.abs(z)) / 1.75 * rise : rise);
      p.push(side * width * t, eave + roofHeight + ridge + overlap, z);
      uv.push(j / nz * length / 2.3, t * width / 1.47);
    }
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const a = start + i * (nz + 1) + j, b = a + nz + 1;
      if (side === 1) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function smallGable(halfWidth, bottom, top, depth) {
  const shape = new THREE.Shape(); shape.moveTo(-halfWidth, bottom); shape.lineTo(halfWidth, bottom); shape.lineTo(0, top); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g;
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
  const slateMap = makeSlateTexture(anisotropy);
  const roofMats = [mat(0xd6b1a0, { map: terracottaMap, bumpMap: terracottaMap, bumpScale: .052, side: THREE.DoubleSide }), mat(0xa6acae, { map: slateMap, bumpMap: slateMap, bumpScale: .035, side: THREE.DoubleSide }), mat(0xa4aaad, { map: terracottaMap, bumpMap: terracottaMap, bumpScale: .045, side: THREE.DoubleSide })];
  const stucco = noiseSurface(256, [207, 200, 180], 24, 88, anisotropy);
  const walls = [0xe6dac1, 0xdccbb1, 0xd5d8cb, 0xeee5d0].map(c => mat(c, { map: stucco, bumpMap: stucco, bumpScale: .014 }));
  const brickMap = makeBrickTexture(anisotropy); brickMap.repeat.set(.65, 1.3);
  const brick = mat(0xd1b3a2, { map: brickMap, bumpMap: brickMap, bumpScale: .035 });
  const stoneMap = makeStoneTexture(anisotropy); stoneMap.repeat.set(.62, .62);
  const stone = mat(0xd3cdb8, { map: stoneMap, bumpMap: stoneMap, bumpScale: .065 });
  const darkTimber = mat(0x544838), warmWood = mat(0x99856b);
  const soil = mat(0x625c42, { roughness: 1 });
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
  // The pavement boundary is exact; the aggregate outside it breaks into the verge.
  const edgeMap = canvasTexture(512, (ctx, n) => {
    const rng = random(983), pixels = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4, grit = (rng() - .5) * 55, alpha = clamp((.97 - x / n + .05 * Math.sin(y * .073)) / .28, 0, 1);
      pixels.data[i] = 144 + grit; pixels.data[i+1] = 139 + grit; pixels.data[i+2] = 114 + grit; pixels.data[i+3] = 255 * alpha * (x > n * .79 && rng() > .85 ? .25 : 1);
    }
    ctx.putImageData(pixels, 0, 0);
  }, anisotropy); edgeMap.repeat.set(1, (L + 260) / 3.6);
  const shoulderMat = mat(0xc7c2a7, { map: edgeMap, transparent: true, alphaTest: .13, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const p = [], uv = [], idx = [], steps = Math.ceil((L + 260) / 2);
    for (let i = 0; i <= steps; i++) {
      const z = -100 + (L + 260) * i / steps, edge = 5.12 + .10 * Math.sin(z * .17 + side) + .07 * Math.sin(z * .61);
      p.push(side * 3.89, .0005, -z, side * edge, .0005, -z); uv.push(0, i / steps, 1, i / steps);
      if (i < steps) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const shoulder = new THREE.Mesh(g, shoulderMat); shoulder.receiveShadow = true; root.add(shoulder);
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
  const crossingMap = canvasTexture(256, ctx => {
    ctx.fillStyle = '#2b6592'; ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#eeeae0'; ctx.beginPath(); ctx.moveTo(128, 23); ctx.lineTo(235, 220); ctx.lineTo(21, 220); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#243336';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(57 + i * 31, 195); ctx.lineTo(72 + i * 31, 195); ctx.lineTo(65 + i * 31, 204); ctx.lineTo(47 + i * 31, 204); ctx.fill(); }
    ctx.beginPath(); ctx.arc(133, 88, 11, 0, TAU); ctx.fill(); ctx.lineCap = 'round'; ctx.strokeStyle = '#243336'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(129, 109); ctx.lineTo(116, 142); ctx.lineTo(99, 184); ctx.moveTo(119, 139); ctx.lineTo(145, 159); ctx.lineTo(162, 185); ctx.moveTo(126, 114); ctx.lineTo(150, 131); ctx.lineTo(169, 134); ctx.moveTo(126, 114); ctx.lineTo(104, 124); ctx.lineTo(91, 145); ctx.stroke();
  }, anisotropy);
  const crossingSign = mat(0xffffff, { map: crossingMap, roughness: .65 });
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
      // Only real world crossings receive a sign; these are visual furniture,
      // outside the waiting and walking corridor used by the pedestrians.
      const signZ = -c.z + side * 2.85, signX = side * 5.72;
      b.add(cylinder, galvanized, signX, 1.36, signZ, .039, 2.72, .039);
      b.add(unit, galvanized, signX, 2.61, signZ, .77, .77, .055);
      b.add(plane, crossingSign, signX, 2.61, signZ + side * .03, .72, .72, 1, 0, side < 0 ? Math.PI : 0, 0, false);
      // A low bollard and slatted bench sit well behind the footway, not in it.
      const seatX = side * 7.2, seatZ = -c.z - side * 3.3;
      for (const dz of [-.61, .61]) b.add(unit, metalDark, seatX, .27, seatZ + dz, .48, .54, .07);
      for (let slat = 0; slat < 4; slat++) b.add(unit, warmWood, seatX - .18 + slat * .12, .54, seatZ, .10, .065, 1.6);
      for (const dz of [-.61, .61]) b.add(unit, metalDark, seatX + side * .21, .72, seatZ + dz, .047, .55, .047);
      for (const y of [.79, .98]) b.add(unit, warmWood, seatX + side * .21, y, seatZ, .065, .14, 1.62);
      b.add(cylinder, metalDark, side * 6.54, .44, -c.z + side * 3.36, .065, .88, .065);
      b.add(cylinder, reflector, side * 6.54, .79, -c.z + side * 3.36, .067, .045, .067, 0, 0, 0, false);
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

  // Four shared construction kits, not four recolours of the same house. Aperture
  // geometries and roof meshes are reused across every property on a long route.
  const houseTypes = [
    { a: 3.02, l: 3.65, eave: 3.45, rise: 2.12, wall: walls[0], roof: roofMats[0], dormer: true, shutter: shutters[0] },
    { a: 3.50, l: 3.80, eave: 3.12, rise: 2.12, wall: stone, roof: roofMats[1], slate: true, shutter: shutters[2] },
    { a: 2.92, l: 4.05, eave: 3.60, rise: 2.25, wall: brick, roof: roofMats[0], timbered: true, shutter: shutters[3] },
    { a: 3.15, l: 3.85, eave: 5.18, rise: 2.02, wall: walls[2], roof: roofMats[1], hip: true, slate: true, shutter: shutters[1] }
  ];
  for (const h of houseTypes) {
    const upper = h.eave > 4, y = upper ? 1.76 : 1.88;
    h.frontWindows = [-2.25, 2.25].map(u => ({ u, y, w: 1.10, h: 1.32 }));
    if (upper) for (const u of [-2.25, 0, 2.25]) h.frontWindows.push({ u, y: 4.02, w: 1.02, h: 1.23 });
    h.backWindows = [-2.1, .1, 2.1].map(u => ({ u, y, w: .96, h: 1.23 }));
    if (upper) for (const u of [-2.1, .1, 2.1]) h.backWindows.push({ u, y: 4.02, w: .96, h: 1.23 });
    h.endWindows = [-1.48, 1.48].map(u => ({ u, y, w: .99, h: 1.27 }));
    if (upper) for (const u of [-1.48, 1.48]) h.endWindows.push({ u, y: 4.02, w: .92, h: 1.19 });
    else h.endWindows.push({ u: 0, y: h.eave + .72, w: .70, h: .83 });
    h.door = { u: 0, y: 1.42, w: 1.0, h: 2.12 };
    h.frontGeo = apertureWall(h.l * 2, h.eave, [...h.frontWindows, h.door]);
    h.backGeo = apertureWall(h.l * 2, h.eave, h.backWindows);
    h.endGeo = apertureWall(h.a * 2, h.eave, h.endWindows, h.hip ? 0 : h.rise - .17);
    h.roofGeo = roofGeometry(h.hip, { width: h.a + .39, rise: h.rise, length: h.l * 2 + .84, eave: h.eave + .02, slate: h.slate });
  }
  const gardenRoof = roofGeometry(false, { width: 1.25, rise: .65, length: 2.65, eave: 1.70, slate: true });
  const dormerRoof = roofGeometry(false, { width: .83, rise: .56, length: 1.42, eave: .84, slate: true });
  const dormerGable = smallGable(.67, .91, 1.38, 1.32), shedGable = smallGable(1.12, 1.69, 2.32, 2.28);
  let houseIndex = 0;
  for (const o of world.scenery) if (o.kind === 'house') {
    const b = chunkAt(o.z), s = o.scale, side = o.x < 0 ? 1 : -1;
    const variant = (o.color + houseIndex++) % 4, h = houseTypes[variant], rng = random(Math.floor(o.z * 79 + Math.abs(o.x) * 991));
    const yaw = (rng() - .5) * .085;
    const houseTransform = new THREE.Matrix4().makeTranslation(o.x, 0, -o.z).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeScale(s, s, s));
    b.transform = houseTransform;
    const box = (material, x, y, z, w, height, d, rx = 0, ry = 0, rz = 0, shadow = true) => b.add(unit, material, x, y, z, w, height, d, rx, ry, rz, shadow);
    const pole = (material, x, y, z, r, length, rx = 0, ry = 0, rz = 0) => b.add(cylinder, material, x, y, z, r, length, r, rx, ry, rz);
    const ball = (material, x, y, z, sx, sy, sz, shadow = true) => b.add(hedgeGeo, material, x, y, z, sx, sy, sz, 0, rng() * TAU, 0, shadow);
    // Continuous foundation and shadowed interior, visible through actual wall reveals.
    box(concrete, 0, .17, 0, h.a * 2 + .13, .34, h.l * 2 + .13);
    box(recess, 0, h.eave / 2, 0, h.a * 2 - .75, h.eave - .50, h.l * 2 - .75, 0, 0, 0, false);
    box(concrete, 0, .39, 0, h.a * 2 + .035, .14, h.l * 2 + .035);
    // A facade's local horizontal vector is perpendicular to its outward normal.
    function facade(nx, nz, x, z, geometry, windows, front = false) {
      const angle = Math.atan2(nx, nz);
      b.add(geometry, h.wall, x, 0, z, 1, 1, 1, 0, angle);
      const bit = (material, u, v, n, w, height, d, shadow = false) => box(material, x + u * nz + n * nx, v, z - u * nx + n * nz, w, height, d, 0, angle, 0, shadow);
      for (const w of windows) {
        const upper = w.y > 3.2, shuttersOn = front && (!upper || variant === 3) && variant !== 1;
        bit(window, w.u, w.y, -.155, w.w - .025, w.h - .025, .024);
        for (const sign of [-1, 1]) {
          bit(frame, w.u + sign * (w.w / 2 - .034), w.y, -.077, .069, w.h, .12);
          bit(frame, w.u, w.y + sign * (w.h / 2 - .032), -.077, w.w, .065, .12);
        }
        bit(frame, w.u, w.y, -.065, .045, w.h, .047);
        bit(frame, w.u, w.y + .05, -.063, w.w, .034, .05);
        bit(concrete, w.u, w.y - w.h / 2 - .07, .01, w.w + .22, .12, .39, true);
        bit(variant === 2 ? stone : concrete, w.u, w.y + w.h / 2 + .082, -.005, w.w + .25, .15, .29);
        if (shuttersOn) for (const sign of [-1, 1]) {
          bit(h.shutter, w.u + sign * (w.w * .76 + .055), w.y, .056, w.w * .41, w.h + .11, .075, true);
          for (let y = -.54; y < .6; y += .125) bit(darkTimber, w.u + sign * (w.w * .76 + .055), w.y + y, .098, w.w * .35, .018, .014);
          for (const dy of [-.4, .4]) bit(metalDark, w.u + sign * (w.w * .76 + .055), w.y + dy, .104, w.w * .37, .023, .015);
        }
        // A restrained flower box on some, rather than every, downstairs window.
        if (front && !upper && (variant === 0 || variant === 2)) {
          bit(timber, w.u, w.y - w.h / 2 - .22, .15, w.w + .1, .20, .32, true);
          for (let k = 0; k < 7; k++) {
            const u = w.u - w.w * .43 + k * w.w / 7, v = w.y - w.h / 2 - .07;
            ball(hedgeMats[k % 3], x + u * nz + .19 * nx, v, z - u * nx + .19 * nz, .11, .13, .11, false);
            ball(flowers[variant % 3], x + u * nz + .23 * nx, v + .1, z - u * nx + .23 * nz, .043, .045, .044, false);
          }
        }
      }
      if (front) {
        bit(h.shutter, 0, h.door.y, -.12, .91, 2.05, .095, true);
        for (const u of [-.535, .535]) bit(frame, u, 1.43, -.008, .10, 2.28, .15, true);
        bit(frame, 0, 2.555, -.008, 1.16, .105, .15);
        bit(window, 0, 2.08, -.064, .57, .46, .022);
        for (const u of [-.21, .21]) for (const y of [.91, 1.41]) bit(darkTimber, u, y, -.064, .31, .37, .026);
        bit(galvanized, .33, 1.42, .004, .13, .03, .055);
        bit(metalDark, -.83, 1.66, .067, .24, .33, .18, true);
        bit(galvanized, -.83, 1.70, .165, .16, .027, .01);
        bit(metalDark, .82, 2.19, .16, .19, .31, .21, true);
        bit(reflector, .82, 2.20, .274, .12, .19, .012);
      }
    }
    facade(side, 0, side * h.a, 0, h.frontGeo, h.frontWindows, true);
    facade(-side, 0, -side * h.a, 0, h.backGeo, h.backWindows);
    facade(0, 1, 0, h.l, h.endGeo, h.endWindows);
    facade(0, -1, 0, -h.l, h.endGeo, h.endWindows);
    // Contrasting quoins, a slim string course, and selective half timbering.
    if (variant === 0 || variant === 3) {
      for (const x of [-h.a, h.a]) for (const z of [-h.l, h.l]) for (let y = .73; y < h.eave - .1; y += .43) box(concrete, x, y, z, .17, .37, .17, 0, 0, 0, false);
      if (variant === 3) box(concrete, 0, 2.86, 0, h.a * 2 + .08, .12, h.l * 2 + .08);
    }
    if (h.timbered) for (const sign of [-1, 1]) {
      const z = sign * (h.l + .032);
      box(darkTimber, 0, h.eave + .04, z, h.a * 2, .16, .1);
      box(darkTimber, 0, h.eave + 1.12, z, .13, 2.08, .10);
      for (const x of [-1.42, 1.42]) box(darkTimber, x, h.eave + .47, z, .11, .88, .09);
      for (const direction of [-1, 1]) box(darkTimber, direction * 1.45, h.eave + .48, z, 1.7, .11, .10, 0, 0, direction * -.53);
    }
    b.add(h.roofGeo, h.roof, 0, 0, 0);
    const a = h.a + .39, roofL = h.l + .42, roofAngle = Math.atan2(h.rise, a), slope = Math.hypot(a, h.rise);
    for (const x of [-a, a]) {
      box(darkTimber, x, h.eave - .04, 0, .13, .18, roofL * 2);
      pole(galvanized, x, h.eave - .10, 0, .052, roofL * 2 + .1, Math.PI / 2);
      for (const z of [-h.l + .22, h.l - .22]) {
        pole(galvanized, Math.sign(x) * (h.a + .08), (h.eave - .18) / 2, z, .037, h.eave - .38);
        box(galvanized, Math.sign(x) * (h.a + .22), h.eave - .15, z, .30, .06, .065);
        for (const y of [.7, h.eave - .7]) box(metalDark, Math.sign(x) * (h.a + .09), y, z, .1, .03, .11, 0, 0, 0, false);
      }
    }
    for (const z of [-roofL, roofL]) {
      if (!h.hip) for (const sign of [-1, 1]) box(darkTimber, sign * a / 2, h.eave + h.rise / 2, z, slope, .12, .13, 0, 0, -sign * roofAngle);
      else { box(darkTimber, 0, h.eave - .04, z, a * 2, .17, .12); pole(galvanized, 0, h.eave - .10, z, .052, a * 2, 0, 0, Math.PI / 2); }
    }
    const ridgeEnd = h.hip ? roofL - 1.75 : roofL;
    for (let z = -ridgeEnd; z < ridgeEnd; z += .36) pole(h.slate ? metalDark : tileRidge, 0, h.eave + h.rise + .065, z, h.slate ? .062 : .095, .38, Math.PI / 2);
    if (h.hip) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const dir = new THREE.Vector3(sx * a, -h.rise, sz * 1.75), len = dir.length(), rot = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
      pole(metalDark, sx * a / 2, h.eave + h.rise / 2 + .04, sz * (ridgeEnd + .875), .055, len, rot.x, rot.y, rot.z);
    }
    const chimneyX = -side * 1.17, chimneyZ = -h.l * .55, chimneyTop = h.eave + h.rise + .53;
    box(variant === 1 ? stone : brick, chimneyX, chimneyTop - .72, chimneyZ, .67, 1.44, .72);
    box(concrete, chimneyX, chimneyTop + .05, chimneyZ, .81, .13, .86);
    for (const dz of [-.17, .17]) { pole(tileRidge, chimneyX, chimneyTop + .27, chimneyZ + dz, .108, .30); pole(black, chimneyX, chimneyTop + .423, chimneyZ + dz, .079, .008); }
    // Flashing interrupts roof tiles at the chimney instead of a floating stack.
    box(metalDark, chimneyX, h.eave + h.rise * (1 - 1.17 / a) + .055, chimneyZ, .88, .025, .95, 0, 0, side * roofAngle, false);
    if (h.dormer) {
      const dx = side * 1.70, dy = h.eave + .68;
      box(walls[0], dx, dy + .46, -.32, 1.22, .92, 1.37);
      // Turn a small gable so its window faces the road.
      const m = new THREE.Matrix4().makeTranslation(dx, dy, -.32).multiply(new THREE.Matrix4().makeRotationY(side * Math.PI / 2));
      b.transform = houseTransform.clone().multiply(m);
      b.add(dormerRoof, h.roof, 0, 0, 0);
      b.add(dormerGable, walls[0], 0, 0, 0);
      box(recess, 0, .46, .692, .87, .69, .027, 0, 0, 0, false);
      box(window, 0, .46, .716, .74, .60, .02, 0, 0, 0, false);
      for (const u of [-.405, .405, 0]) box(frame, u, .46, .74, .045, .66, .045, 0, 0, 0, false);
      for (const v of [.135, .785]) box(frame, 0, v, .74, .86, .047, .045, 0, 0, 0, false);
      box(concrete, 0, .08, .735, .96, .075, .24);
      b.transform = houseTransform;
    }
    // Porches differ with the building: broad stone stoop, timber verandah or a
    // small metal-supported shelter. Doorways always face the original road.
    const porchDepth = variant === 1 ? 1.28 : .92;
    box(concrete, side * (h.a + porchDepth / 2), .25, 0, porchDepth + .08, .22, 1.55);
    box(stone, side * (h.a + porchDepth + .18), .11, 0, .46, .15, 1.83);
    if (variant !== 1) {
      const canopyWidth = variant === 2 ? 2.70 : 1.85;
      box(darkTimber, side * (h.a + .61), 2.81, 0, 1.36, .12, canopyWidth, 0, 0, side * .13);
      box(h.roof, side * (h.a + .61), 2.90, 0, 1.44, .06, canopyWidth + .09, 0, 0, side * .13);
      if (variant !== 3) for (const z of [-1, 1]) { box(darkTimber, side * (h.a + 1.15), 1.58, z * (canopyWidth / 2 - .14), .09, 2.46, .09); box(darkTimber, side * (h.a + .89), 2.52, z * (canopyWidth / 2 - .14), .075, .73, .075, 0, 0, -side * .65); }
    }
    // Subtle moss and flower pots anchor the foundation in the ground.
    for (const z of [-1.13, 1.18]) {
      pole(tileRidge, side * (h.a + .53), .24, z, .23, .37);
      pole(soil, side * (h.a + .53), .435, z, .21, .018);
      ball(hedgeMats[1], side * (h.a + .53), .56, z, .25, .23, .25);
      for (let k = 0; k < 4; k++) ball(flowers[variant % 3], side * (h.a + .53) + (rng() - .5) * .28, .7 + rng() * .07, z + (rng() - .5) * .28, .043, .041, .05, false);
    }
    if (variant !== 3) { pole(h.shutter, -side * (h.a + .48), .46, h.l - .70, .32, .85); pole(metalDark, -side * (h.a + .48), .91, h.l - .70, .34, .035); }
    // Front property edges have a gate-sized opening. Stone, timber and clipped
    // hedges alternate; the roofline no longer sits in a copy-pasted picket box.
    const fx = side * (h.a + 2.23), fz = h.l + 1.18;
    for (const direction of [-1, 1]) {
      const extent = fz - 1.05, centre = direction * (fz + 1.05) / 2;
      if (variant === 1) {
        box(stone, fx, .36, centre, .35, .72, extent);
        box(concrete, fx, .755, centre, .43, .09, extent + .03);
      } else if (variant === 3) {
        for (let z = 1.30; z < fz; z += .68) b.add(clippedHedge, hedgeMats[0], fx, .54, direction * z, .43, .54, .43, 0, (rng() - .5) * .09, 0);
      } else {
        for (let z = 1.2; z < fz; z += .37) box(warmWood, fx, .54, direction * z, .071, 1.00, .080);
        for (const y of [.32, .76]) box(timber, fx, y, centre, .09, .072, extent);
      }
      for (const z of [direction * 1.02, direction * fz]) { box(variant === 1 ? stone : darkTimber, fx, .56, z, variant === 1 ? .46 : .15, 1.10, variant === 1 ? .46 : .15); box(concrete, fx, 1.135, z, variant === 1 ? .53 : .19, .08, variant === 1 ? .53 : .19); }
      for (let x = -h.a + .45; x < h.a + 1.8; x += .76) b.add(clippedHedge, hedgeMats[variant % 3], side * x, .45 + rng() * .04, direction * fz, .50, .47, .47, 0, (rng() - .5) * .1, 0);
    }
    // Partly open gate, a letterbox and stepping-stone path into the property.
    const gatePivot = new THREE.Matrix4().makeTranslation(fx, 0, -1.01).multiply(new THREE.Matrix4().makeRotationY(side * -.37));
    b.transform = houseTransform.clone().multiply(gatePivot);
    for (let z = .10; z < 1.85; z += .27) box(variant === 3 ? metalDark : warmWood, 0, .48, z, .072, .91, .052);
    for (const y of [.26, .69]) box(variant === 3 ? metalDark : timber, 0, y, .94, .065, .06, 1.93);
    b.transform = houseTransform;
    box(h.shutter, fx + side * .13, 1.03, 1.05, .31, .34, .38);
    box(metalDark, fx + side * .297, 1.13, 1.05, .024, .022, .27, 0, 0, 0, false);
    box(metalDark, fx + side * .13, 1.23, 1.05, .35, .065, .42);
    // Garden soil and planted rows are close to the house, outside actor space.
    if (variant === 1 || variant === 2) {
      const gx = -side * (h.a + 1.42);
      for (const gz of [-1.46, 1.0]) {
        box(timber, gx, .11, gz, 1.66, .20, 1.95);
        box(soil, gx, .23, gz, 1.50, .045, 1.79, 0, 0, 0, false);
        for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) ball(hedgeMats[row % 3], gx - .47 + row * .47, .36, gz - .62 + col * .4, .17, .15 + rng() * .06, .16, false);
      }
    } else {
      // A compact garden table and slatted bench tell a domestic story at scale.
      const gx = -side * (h.a + 1.35);
      box(timber, gx, .72, .6, 1.02, .075, 1.27);
      for (const x of [-.38, .38]) for (const z of [.13, 1.07]) box(darkTimber, gx + x, .36, z, .058, .69, .058);
      for (const z of [-.34, 1.58]) {
        for (let k = -1; k <= 1; k++) box(warmWood, gx, .42, z + k * .10, 1.29, .055, .086);
        for (const x of [-.47, .47]) box(metalDark, gx + x, .22, z, .054, .42, .23);
      }
    }
    // A few properties have a small timber shed, with a pitched felt roof.
    if (variant === 2 && Math.abs(o.x) > 16) {
      const shedX = -side * (h.a + 2.0), shedZ = h.l + .24;
      box(timber, shedX, .84, shedZ, 2.24, 1.68, 2.28);
      for (let z = -1.02; z < 1.06; z += .22) box(darkTimber, shedX + side * 1.127, .85, shedZ + z, .017, 1.6, .018, 0, 0, 0, false);
      box(darkTimber, shedX + side * 1.15, .72, shedZ, .045, 1.39, .75);
      box(galvanized, shedX + side * 1.18, .78, shedZ + .25, .025, .027, .10);
      b.add(gardenRoof, roofMats[1], shedX, 0, shedZ);
      b.add(shedGable, timber, shedX, 0, shedZ);
    }
    b.transform = null;
    // World-space garden access ends outside the shoulder. Cosmetic paving never
    // crosses driving lanes and does not invent an extra junction for the model.
    const front = new THREE.Vector3(side * (h.a + 1.59), 0, 0).applyMatrix4(houseTransform), roadward = side === -1 ? 5.85 : -5.85;
    const pathLength = Math.abs(front.x - roadward);
    if (pathLength > 0) {
      b.add(unit, gravel, (front.x + roadward) / 2, .017, front.z, pathLength, .025, 1.35 * s, 0, 0, 0, false);
      const count = Math.max(1, Math.ceil(pathLength / .88));
      for (let i = 0; i < count; i++) b.add(unit, concrete, front.x + (roadward - front.x) * (i + .5) / count, .037, front.z, pathLength / count - .035, .028, 1.21 * s, 0, 0, 0, false);
    }
  }
  base.finish();
  for (const c of allChunks.values()) c.batch.finish();
  // Render-only support height for actors. The crossing is built from stepped
  // slabs above: 120 mm landing, 70 mm approaches and 152.5 mm tactile plate.
  // A sole-width margin outside each slab eases the body's step down while its
  // feet straddle an edge; inside the footprint the concrete's exact top is used.
  // Tiny tactile studs and painted stripes are surface detail, not body motion.
  root.userData.surfaceHeight = (x, simZ) => {
    const ax = Math.abs(x), soleMargin = .16;
    let height = ax <= 3.9 ? .001 : 0;
    const support = (cx, cz, halfWidth, halfLength, top) => {
      const outside = Math.hypot(Math.max(0, Math.abs(ax - cx) - halfWidth), Math.max(0, Math.abs(simZ - cz) - halfLength));
      const t = clamp(1 - outside / soleMargin, 0, 1);
      height = Math.max(height, top * t * t * (3 - 2 * t));
    };
    for (const c of world.crossings) {
      if (Math.abs(simZ - c.z) > 2 + soleMargin || ax < 4.11 - soleMargin || ax > 6.5 + soleMargin) continue;
      support(5.4, c.z, 1.1, 2, .12);
      for (let p = -2; p <= 2; p++) support(4.26, c.z + p * .76, .15, .36, .07);
      support(4.78, c.z, .25, 1.45, .1525);
    }
    return height;
  };
  root.userData.update = egoZ => {
    for (const c of allChunks.values()) c.group.visible = Math.abs(c.z - egoZ) < 590;
  };
  root.userData.update(0);
  return root;
}
