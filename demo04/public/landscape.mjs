// Cosmetic countryside. This module never touches simulation state or its random stream.
// All plants and surface textures are generated locally; metres use x, y, -simulation z.
import * as THREE from '/vendor/three.module.js';

const TAU = Math.PI * 2;
const CHUNK_LENGTH = 128;
const UP = new THREE.Vector3(0, 1, 0);
const temp = new THREE.Object3D();
const direction = new THREE.Vector3();
const color = new THREE.Color();

function random(seed) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let v = Math.imul(n ^ n >>> 15, 1 | n);
    v ^= v + Math.imul(v ^ v >>> 7, 61 | v);
    return ((v ^ v >>> 14) >>> 0) / 4294967296;
  };
}
function seedOf(value) {
  let result = 2166136261;
  for (const c of String(value)) result = Math.imul(result ^ c.charCodeAt(0), 16777619);
  return result >>> 0;
}
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function canvas(size, height = size) {
  const c = document.createElement('canvas'); c.width = size; c.height = height;
  return [c, c.getContext('2d')];
}
function texture(c, anisotropy, repeat = false) {
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = anisotropy;
  if (repeat) map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return map;
}

function groundTexture(anisotropy) {
  const [c, ctx] = canvas(512), rng = random(541923);
  const pixels = ctx.createImageData(512, 512);
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const n = rng() * 17 - 8.5;
    const patch = Math.sin(x / 27 + Math.sin(y / 39)) * 3 + Math.sin(y / 18) * 2;
    const at = (y * 512 + x) * 4;
    pixels.data[at] = 95 + n + patch;
    pixels.data[at + 1] = 111 + n + patch;
    pixels.data[at + 2] = 63 + n * .65 + patch;
    pixels.data[at + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  // Broken strands and tiny bare-soil flecks provide scale at low camera heights.
  for (let i = 0; i < 18000; i++) {
    const x = rng() * 512, y = rng() * 512, h = 1 + rng() * 6;
    ctx.strokeStyle = rng() > .46 ? `rgba(175,184,103,${.08 + rng() * .2})` : `rgba(35,55,26,${.06 + rng() * .16})`;
    ctx.lineWidth = .45 + rng() * .65;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng() - .5) * 3, y - h); ctx.stroke();
  }
  return texture(c, anisotropy, true);
}
function barkTexture(anisotropy, birch = false) {
  const [c, ctx] = canvas(256, 512), rng = random(birch ? 665 : 774);
  ctx.fillStyle = birch ? '#c1beb0' : '#66594a'; ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 1600; i++) {
    const x = rng() * 256, y = rng() * 512;
    ctx.strokeStyle = birch ? `rgba(44,45,38,${.12 + rng() * .54})` : `rgba(29,25,22,${.12 + rng() * .44})`;
    ctx.lineWidth = birch ? .6 + rng() * 3 : .35 + rng() * 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + (birch ? rng() * 31 : (rng() - .5) * 9), y + (birch ? (rng() - .5) * 3 : rng() * 74)); ctx.stroke();
    if (!birch && i % 3 === 0) {
      ctx.strokeStyle = 'rgba(186,165,128,.22)'; ctx.lineWidth = .65;
      ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + 4, y + 35); ctx.stroke();
    }
  }
  return texture(c, anisotropy, true);
}

function drawLeaf(ctx, x, y, length, angle, tone, birch = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = tone;
  ctx.beginPath(); ctx.moveTo(0, 0);
  if (birch) {
    ctx.bezierCurveTo(length * .65, -length * .55, length * 1.15, -length * .22, length * 1.38, 0);
    ctx.bezierCurveTo(length * .72, length * .52, length * .3, length * .46, 0, 0);
  } else {
    ctx.bezierCurveTo(length * .26, -length * .43, length * .28, -length * .1, length * .42, -length * .31);
    ctx.bezierCurveTo(length * .68, -length * .55, length * .59, -length * .12, length * .84, -length * .22);
    ctx.quadraticCurveTo(length * 1.19, -length * .26, length * 1.22, 0);
    ctx.bezierCurveTo(length * .94, length * .43, length * .77, length * .12, length * .57, length * .31);
    ctx.bezierCurveTo(length * .3, length * .52, length * .34, length * .2, 0, 0);
  }
  ctx.fill(); ctx.strokeStyle = 'rgba(191,197,105,.33)'; ctx.lineWidth = .55;
  ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(length * .94, 0); ctx.stroke(); ctx.restore();
}
function foliageTexture(anisotropy, species) {
  const [c, ctx] = canvas(512), rng = random(19832 + species * 17);
  const tones = species === 1 ? ['#718c3a', '#627e34', '#819549', '#526d2e', '#899d51'] : ['#577534', '#6c873e', '#7f9347', '#4d6c30', '#70853a'];
  // A single card is a spray of individual leaves with open air between them.
  const branches = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + rng() * .2;
    const ex = 256 + Math.cos(a) * (120 + rng() * 88), ey = 264 + Math.sin(a) * (100 + rng() * 96);
    branches.push([ex, ey]); ctx.strokeStyle = '#6c6740'; ctx.lineWidth = 1.5 + rng();
    ctx.beginPath(); ctx.moveTo(252, 280); ctx.quadraticCurveTo(mix(252, ex, .55), mix(280, ey, .43), ex, ey); ctx.stroke();
  }
  for (const [ex, ey] of branches) for (let j = 0; j < 38; j++) {
    const t = .12 + rng() * .9, spread = 23 + t * 44;
    const x = mix(252, ex, t) + (rng() - .5) * spread;
    const y = mix(280, ey, t) + (rng() - .5) * spread;
    drawLeaf(ctx, x, y, 16 + rng() * 17, rng() * TAU, tones[Math.floor(rng() * tones.length)], species === 1);
  }
  return texture(c, anisotropy);
}
function pineTexture(anisotropy) {
  const [c, ctx] = canvas(512), rng = random(93645);
  for (let branch = 0; branch < 17; branch++) {
    const a = (rng() - .5) * 2.4 - Math.PI / 2;
    const bx = 255 + (rng() - .5) * 35, by = 450 - rng() * 170;
    const length = 145 + rng() * 180;
    const ex = bx + Math.cos(a) * length, ey = by + Math.sin(a) * length;
    ctx.strokeStyle = '#716345'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    for (let j = 0; j < 95; j++) {
      const t = rng(), x = mix(bx, ex, t), y = mix(by, ey, t);
      const angle = a + (j % 2 ? 1 : -1) * (.45 + rng() * .6), len = 15 + rng() * 29;
      ctx.strokeStyle = ['#547044', '#48673e', '#718557', '#355a38'][Math.floor(rng() * 4)];
      ctx.lineWidth = 1.1 + rng() * 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len); ctx.stroke();
    }
  }
  return texture(c, anisotropy);
}
function grassTexture(anisotropy) {
  const [c, ctx] = canvas(256), rng = random(947283);
  for (let i = 0; i < 56; i++) {
    const x = 36 + rng() * 184, endX = x + (rng() - .5) * 85, top = 18 + rng() * 189;
    ctx.fillStyle = ['#657744', '#889351', '#788747', '#4e6737', '#9a9d62'][Math.floor(rng() * 5)];
    ctx.beginPath(); ctx.moveTo(x - 1 - rng() * 2, 256);
    ctx.quadraticCurveTo(x, mix(256, top, .55), endX, top);
    ctx.quadraticCurveTo(x + 4, mix(256, top, .55), x + 3, 256); ctx.fill();
    if (i % 8 === 0) {
      ctx.strokeStyle = '#a8a174'; ctx.lineWidth = .85; ctx.beginPath(); ctx.moveTo(x, 256); ctx.lineTo(endX, top); ctx.stroke();
      for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.ellipse(endX + (j % 2 ? 2 : -2), top + j * 3.3, 1.4, 3.5, j % 2 ? -.5 : .5, 0, TAU); ctx.fillStyle = '#aaa477'; ctx.fill(); }
    }
  }
  for (let i = 0; i < 3; i++) {
    const x = 61 + rng() * 141, y = 64 + rng() * 82;
    ctx.strokeStyle = '#72824a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 5, 256); ctx.quadraticCurveTo(x + 7, 173, x, y); ctx.stroke();
    for (let petal = 0; petal < 7; petal++) {
      const a = petal / 7 * TAU;
      ctx.fillStyle = '#e0dfbd'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 2.9, y + Math.sin(a) * 2.9, 2.7, 1.2, a, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#c6a655'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
  }
  return texture(c, anisotropy);
}
function distantTreeTexture(anisotropy, pine = false) {
  const [c, ctx] = canvas(512, 768), rng = random(pine ? 82913 : 51794);
  ctx.fillStyle = '#5e5d47'; ctx.beginPath(); ctx.moveTo(244, 761); ctx.lineTo(251, 234); ctx.lineTo(260, 234); ctx.lineTo(269, 761); ctx.fill();
  if (pine) {
    for (let level = 0; level < 17; level++) {
      const y = 50 + level * 33, reach = 15 + level * 10.8;
      for (let side = -1; side <= 1; side += 2) {
        ctx.strokeStyle = '#575f40'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(255, y); ctx.lineTo(255 + reach * side, y + 24); ctx.stroke();
        for (let j = 0; j < 300; j++) {
          const t = rng(), x = 255 + side * t * reach, py = y + t * 27 + (rng() - .5) * (34 + t * 27);
          ctx.fillStyle = ['#4a6847', '#597747', '#68804c', '#42613e'][Math.floor(rng() * 4)];
          ctx.beginPath(); ctx.ellipse(x, py, 2 + rng() * 5, 1.4 + rng() * 3, rng() * TAU, 0, TAU); ctx.fill();
        }
      }
    }
  } else {
    for (let limb = 0; limb < 16; limb++) {
      const a = (limb / 16) * TAU, radius = 95 + rng() * 95;
      const bx = 256 + Math.cos(a) * radius, by = 310 + Math.sin(a) * radius * 1.25;
      ctx.strokeStyle = '#606044'; ctx.lineWidth = 3 + rng() * 4;
      ctx.beginPath(); ctx.moveTo(256, 540); ctx.quadraticCurveTo(256, 360, bx, by); ctx.stroke();
      for (let leaf = 0; leaf < 350; leaf++) {
        const angle = rng() * TAU, rad = Math.sqrt(rng());
        const x = bx + Math.cos(angle) * rad * (40 + rng() * 36), y = by + Math.sin(angle) * rad * (44 + rng() * 35);
        ctx.fillStyle = ['#456637', '#557641', '#657f43', '#788c4b', '#58723c'][Math.floor(rng() * 5)];
        ctx.beginPath(); ctx.ellipse(x, y, 2 + rng() * 4.5, 1.3 + rng() * 2.6, rng() * TAU, 0, TAU); ctx.fill();
      }
    }
  }
  return texture(c, anisotropy);
}

function windMaterial(map, clock, strength, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    map, roughness: .94, metalness: 0, alphaTest: .43, alphaToCoverage: true, side: THREE.DoubleSide,
    color: 0xffffff, ...options
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.uLandscapeTime = clock;
    shader.vertexShader = `uniform float uLandscapeTime;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      #ifdef USE_INSTANCING
      float plantPhase = instanceMatrix[3].x * .53 + instanceMatrix[3].z * .19;
      float breeze = sin(uLandscapeTime * 1.1 + plantPhase) + .35 * sin(uLandscapeTime * 2.0 + plantPhase * 1.7);
      transformed.x += breeze * ${strength.toFixed(4)} * pow(uv.y, 2.0);
      transformed.z += cos(uLandscapeTime * .8 + plantPhase) * ${(strength * .4).toFixed(4)} * uv.y;
      #endif
    `);
  };
  material.customProgramCacheKey = () => `landscape-wind-${strength}`;
  return material;
}
function instanceBatch(group, geometry, material, transforms, { shadows = false, receiveShadow = true } = {}) {
  if (!transforms.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  transforms.forEach((t, i) => {
    if (t.matrix) mesh.setMatrixAt(i, t.matrix);
    else {
      temp.position.set(t.x, t.y, t.z); temp.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
      temp.scale.set(t.sx, t.sy, t.sz ?? 1); temp.updateMatrix(); mesh.setMatrixAt(i, temp.matrix);
    }
    if (t.tint) mesh.setColorAt(i, color.set(t.tint));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = shadows; mesh.receiveShadow = receiveShadow;
  mesh.computeBoundingSphere(); group.add(mesh); return mesh;
}
function cylinderSegment(from, to, radius, shade = null) {
  temp.position.copy(from).add(to).multiplyScalar(.5);
  direction.copy(to).sub(from);
  temp.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
  temp.scale.set(radius, direction.length(), radius); temp.updateMatrix();
  return { matrix: temp.matrix.clone(), tint: shade };
}

// The first 25 m to either side are level, so scenery and crossing heights remain exact.
function terrainHeight(x, z, phase) {
  const a = Math.abs(x), slope = smooth(25, 140, a), hills = smooth(90, 570, a);
  const rolling = 6 + 5 * Math.sin(x * .018 + z * .007 + phase) + 3.5 * Math.sin(z * .017 - x * .022);
  const ridge = 25 + 18 * Math.sin(z * .0037 + x * .006 + phase) + 12 * Math.sin(z * .0071 - x * .005);
  return -.035 + slope * rolling + hills * ridge;
}
function buildTerrain(from, length, material, phase) {
  const geo = new THREE.PlaneGeometry(1440, length, 96, 16);
  geo.rotateX(-Math.PI / 2);
  const positions = geo.attributes.position, uv = geo.attributes.uv, colors = [];
  for (let i = 0; i < positions.count; i++) {
    let x = positions.getX(i);
    // Explicit vertices at the flat corridor edge prevent a large terrain triangle
    // from lifting the ground underneath a house or crossing approach.
    if (Math.abs(Math.abs(x) - 30) < .01) { x = Math.sign(x) * 25; positions.setX(i, x); }
    const z = from + length / 2 - positions.getZ(i);
    positions.setY(i, terrainHeight(x, z, phase));
    uv.setXY(i, x / 14, z / 14);
    const patch = Math.sin(x * .048 + Math.sin(z * .014) * 3) * Math.sin(z * .037 - x * .006);
    const field = .93 + patch * .17 + Math.sin(z * .009 + x * .025) * .09;
    // Irregular dry and freshly green meadow patches break the uniform lawn effect.
    const far = smooth(28, 90, Math.abs(x));
    const dry = smooth(-.08, .75, Math.sin(z * .019 + x * .038 + phase) * Math.cos(x * .017 - z * .006)) * far;
    const rich = smooth(.2, .9, Math.cos(z * .043 + x * .018)) * (1 - dry);
    colors.push(field * (1 + dry * .23 - rich * .09), field * (1 - dry * .04), field * (.88 + dry * .13 - rich * .08));
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material); mesh.position.z = -(from + length / 2);
  mesh.receiveShadow = true; return mesh;
}

function treeDetails(tree, rng) {
  const speciesRoll = rng();
  const species = speciesRoll < .19 ? 2 : speciesRoll < .43 ? 1 : 0;
  const scale = tree.scale || 1, h = (species === 2 ? 8.6 : species === 1 ? 7.7 : 6.8) * scale;
  const radius = (species === 2 ? 1.8 : species === 1 ? 2.1 : 2.85) * scale;
  const branches = [], leaves = [], farLeaves = [], tips = [];
  const leanX = (rng() - .5) * .65 * scale, leanZ = (rng() - .5) * .65 * scale;
  const point = (x, y, z) => new THREE.Vector3(Math.sign(tree.x) * Math.max(y < 3.8 ? 6.25 : 3.3, Math.abs(tree.x + x)), y, -tree.z + z);
  // Long tapers and a few asymmetric forks avoid the repeated "coat rack" outline.
  branches.push(cylinderSegment(point(0, 0, 0), point(leanX, h * .92, leanZ), scale * (species === 1 ? .145 : species === 2 ? .21 : .29)));
  if (species !== 1) for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + rng() * .4;
    branches.push(cylinderSegment(point(Math.cos(a) * .43 * scale, .025, Math.sin(a) * .43 * scale), point(0, .68 * scale, 0), .12 * scale));
  }
  const limbs = species === 2 ? 17 : 10;
  for (let i = 0; i < limbs; i++) {
    const f = i / limbs, a = i * 2.39996 + rng() * .7;
    const y = h * (species === 2 ? .25 + f * .66 : .43 + f * .35);
    const extent = radius * (species === 2 ? (1 - f) * 1.1 : (.63 + .34 * Math.sin(f * Math.PI)) * (.8 + rng() * .2));
    const dx = Math.cos(a) * extent, dz = Math.sin(a) * extent;
    const mid = point(dx * .57, y + h * (species === 2 ? .008 : .05), dz * .57);
    const end = point(dx, y + h * (species === 2 ? .025 : .13 + rng() * .045), dz);
    branches.push(cylinderSegment(point(leanX * y / h, y, leanZ * y / h), mid, scale * (species === 2 ? .053 : .092) * (1 - f * .5)));
    branches.push(cylinderSegment(mid, end, scale * (species === 2 ? .022 : .036) * (1 - f * .5)));
    tips.push(end);
    if (species !== 2 && i % 2 === 0) {
      const fork = point(dx * .77 + Math.cos(a + .7) * radius * .3, end.y + h * .035, dz * .77 + Math.sin(a + .7) * radius * .3);
      branches.push(cylinderSegment(mid, fork, scale * .027)); tips.push(fork);
    }
  }
  function addSpray(rawX, y, z, size) {
    const inward = Math.abs(rawX) < 6.4 + size * .72;
    const leafX = Math.sign(tree.x) * Math.max(3.2 + size * .65, Math.abs(rawX));
    // Roadside trees are naturally raised underneath: a full crown may shade
    // the road, while people and vehicles retain clear space below it.
    if (inward) y = Math.max(y, 3.85 + size * .8);
    const tint = new THREE.Color().setHSL(species === 1 ? .21 : .24, .04 + rng() * .07, .83 + rng() * .17);
    leaves.push({ x: leafX, y, z,
      rx: (rng() - .5) * 2.55, ry: rng() * TAU, rz: (rng() - .5) * 1.7,
      sx: size, sy: size * (species === 2 ? 1.3 : 1), tint });
  }
  const count = species === 2 ? 100 : species === 1 ? 122 : 154;
  const asymmetry = .12 + rng() * .13, asymmetryAngle = rng() * TAU;
  for (let i = 0; i < count; i++) {
    const a = rng() * TAU, f = rng();
    let y, spread;
    if (species === 2) { y = h * (.27 + f * .72); spread = radius * (1 - f) * (Math.sqrt(rng()) * .7 + .3); }
    else {
      y = h * (.44 + f * .54);
      spread = radius * Math.sqrt(Math.max(.05, 1 - Math.pow((f - .47) * 1.8, 2))) * Math.sqrt(rng());
      spread *= 1 + Math.sin(a + asymmetryAngle) * asymmetry;
    }
    const size = scale * (species === 2 ? 1.15 + rng() * .6 : species === 1 ? .95 + rng() * .5 : 1.25 + rng() * .65);
    addSpray(tree.x + Math.cos(a) * spread + leanX, y, -tree.z + Math.sin(a) * spread + leanZ, size);
  }
  // Terminal sprays are attached to real branch tips, so no thick bare sticks
  // project through an unrelated cloud of foliage.
  for (const tip of tips) for (let i = 0; i < (species === 2 ? 3 : 5); i++) {
    const size = scale * (species === 2 ? 1.22 : species === 1 ? 1.28 : 1.6) * (.8 + rng() * .3);
    addSpray(tip.x + (rng() - .5) * .8 * scale, tip.y + (rng() - .35) * .7 * scale, tip.z + (rng() - .5) * .8 * scale, size);
  }
  leaves.forEach((entry, i) => { if (i % 3 === 0) farLeaves.push({ ...entry, sx: entry.sx * 1.48, sy: entry.sy * 1.48 }); });
  return { species, branches, leaves, farLeaves };
}

/** Build presentation-only terrain, vegetation and distant woodland. */
export function buildLandscape(world, { anisotropy = 8 } = {}) {
  const group = new THREE.Group(); group.name = 'Procedural countryside';
  const clock = { value: 0 }, worldSeed = seedOf(world.seed ?? 1), phase = (worldSeed % 1013) / 1013 * TAU;
  const groundMap = groundTexture(anisotropy);
  const meadow = new THREE.MeshStandardMaterial({ map: groundMap, bumpMap: groundMap, bumpScale: .055, roughness: 1, vertexColors: true });
  const bark = [
    new THREE.MeshStandardMaterial({ map: barkTexture(anisotropy), color: 0xa99b82, roughness: 1 }),
    new THREE.MeshStandardMaterial({ map: barkTexture(anisotropy, true), roughness: .96 }),
    null
  ];
  bark[2] = bark[0];
  const leaves = [foliageTexture(anisotropy, 0), foliageTexture(anisotropy, 1), pineTexture(anisotropy)].map(map => windMaterial(map, clock, .055, { emissive: 0x283b12, emissiveIntensity: .11 }));
  const grassMaterial = windMaterial(grassTexture(anisotropy), clock, .09, { alphaTest: .4 });
  const distantMaterials = [distantTreeTexture(anisotropy), distantTreeTexture(anisotropy, true)].map(map => new THREE.MeshStandardMaterial({ map, roughness: 1, alphaTest: .4, side: THREE.DoubleSide, color: 0xaaba93 }));
  const branchGeometry = new THREE.CylinderGeometry(.25, 1, 1, 8, 1);
  const cardGeometry = new THREE.PlaneGeometry(1, 1);
  const grassGeometry = new THREE.PlaneGeometry(1, 1, 1, 2);
  const chunks = [], treesByChunk = new Map();
  for (const tree of world.scenery || []) if (tree.kind === 'tree') {
    const key = Math.floor(tree.z / CHUNK_LENGTH);
    if (!treesByChunk.has(key)) treesByChunk.set(key, []);
    treesByChunk.get(key).push(tree);
  }
  const houses = (world.scenery || []).filter(o => o.kind === 'house');
  const crossings = world.crossings || [];
  const obstructed = (x, z) => houses.some(h => {
    const garden = Math.abs(h.x - x) < 5 * h.scale + 1.7 && Math.abs(h.z - z) < 5 * h.scale + 1.7;
    const path = Math.sign(x) === Math.sign(h.x) && Math.abs(x) < Math.abs(h.x) && Math.abs(h.z - z) < 1.35 * h.scale + .7;
    return garden || path;
  });
  const first = -2, last = Math.ceil((world.length + 240) / CHUNK_LENGTH);
  for (let ci = first; ci < last; ci++) {
    const from = ci * CHUNK_LENGTH, centre = from + CHUNK_LENGTH / 2;
    const chunk = new THREE.Group(); chunk.name = `Countryside ${ci}`; group.add(chunk);
    const terrain = buildTerrain(from, CHUNK_LENGTH, meadow, phase); chunk.add(terrain);
    const trunkGroup = new THREE.Group(), near = new THREE.Group(), far = new THREE.Group(), grasses = new THREE.Group(), woods = new THREE.Group();
    chunk.add(trunkGroup, near, far, grasses, woods);
    const branchLists = [[], [], []], leafLists = [[], [], []], farLists = [[], [], []];
    for (const tree of treesByChunk.get(ci) || []) {
      const model = treeDetails(tree, random(seedOf(`${worldSeed}:tree:${tree.x.toFixed(3)}:${tree.z.toFixed(3)}`)));
      branchLists[model.species].push(...model.branches); leafLists[model.species].push(...model.leaves); farLists[model.species].push(...model.farLeaves);
    }
    for (let s = 0; s < 3; s++) {
      instanceBatch(trunkGroup, branchGeometry, bark[s], branchLists[s], { shadows: true });
      instanceBatch(near, cardGeometry, leaves[s], leafLists[s], { shadows: true });
      instanceBatch(far, cardGeometry, leaves[s], farLists[s]);
    }
    const rng = random(seedOf(`${worldSeed}:meadow:${ci}`)), grass = [], undergrowth = [], forest = [[], []];
    for (let i = 0; i < 1280; i++) {
      const side = i % 2 ? -1 : 1, z = from + rng() * CHUNK_LENGTH;
      const nearRoad = i < 1040;
      let x = side * (nearRoad ? 6.65 + Math.pow(rng(), 2.5) * 7 : 27 + rng() * 31);
      if (obstructed(x, z) || crossings.some(c => Math.abs(c.z - z) < 4.5 && Math.abs(x) < 9)) continue;
      const h = .18 + Math.pow(rng(), 2) * .35, rotation = rng() * TAU, width = h * (1.8 + rng());
      x = side * Math.max(6.15 + width * .55, Math.abs(x));
      const y = terrainHeight(x, z, phase) + h / 2;
      const shade = new THREE.Color().setHSL(.21 + rng() * .025, .08, .75 + rng() * .2);
      grass.push({ x, y, z: -z, sx: width, sy: h, ry: rotation, tint: shade });
      if (i % 2 === 0) grass.push({ x, y, z: -z, sx: width, sy: h, ry: rotation + Math.PI / 2, tint: shade });
    }
    instanceBatch(grasses, grassGeometry, grassMaterial, grass);
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? -1 : 1, z = from + rng() * CHUNK_LENGTH;
      const x = side * (8.7 + rng() * 22), h = .45 + rng() * .68, spread = .55 + rng() * .65;
      if (obstructed(x, z) || crossings.some(c => Math.abs(c.z - z) < 6)) continue;
      const baseY = terrainHeight(x, z, phase);
      for (let j = 0; j < 24; j++) {
        const a = rng() * TAU, rad = Math.sqrt(rng()), size = .65 + rng() * .45;
        undergrowth.push({ x: x + Math.cos(a) * spread * rad, y: baseY + .12 + h * rng() * .35, z: -z + Math.sin(a) * spread * rad,
          sx: size, sy: size * .95, rx: (rng() - .5) * 2, ry: rng() * TAU, rz: rng() * .5,
          tint: new THREE.Color().setHSL(.22, .11, .6 + rng() * .2) });
      }
    }
    instanceBatch(grasses, cardGeometry, leaves[0], undergrowth, { shadows: true });
    // Groves leave open meadow between them. Their trunks follow the actual hillside surface.
    for (let i = 0; i < 190; i++) {
      const side = i % 2 ? -1 : 1, z = from + rng() * CHUNK_LENGTH;
      const x = side * (52 + Math.pow(rng(), .78) * 410);
      const grove = Math.sin(z * .013 + x * .009 + phase) + Math.cos(z * .026 - x * .011);
      if (grove < -.35 || (Math.abs(x) < 95 && grove < .45)) continue;
      const species = rng() < .29 ? 1 : 0, h = (species ? 9 : 7) + rng() * 6, w = h * (species ? .48 : .7);
      const y = terrainHeight(x, z, phase) + h / 2;
      const shade = new THREE.Color().setHSL(.24, .05, .8 + rng() * .2), angle = rng() * Math.PI;
      forest[species].push({ x, y, z: -z, sx: w, sy: h, ry: angle, tint: shade });
      forest[species].push({ x, y, z: -z, sx: w, sy: h, ry: angle + Math.PI / 2, tint: shade });
    }
    for (let s = 0; s < 2; s++) instanceBatch(woods, cardGeometry, distantMaterials[s], forest[s], { receiveShadow: false });
    chunks.push({ centre, chunk, terrain, trunkGroup, near, far, grasses, woods });
  }
  group.userData.update = (egoZ, time = 0) => {
    clock.value = Number.isFinite(time) ? time : 0;
    for (const item of chunks) {
      const distance = Math.abs(egoZ - item.centre);
      item.chunk.visible = distance < 1120;
      if (!item.chunk.visible) continue;
      item.trunkGroup.visible = distance < 530;
      item.near.visible = distance < 185;
      item.far.visible = distance >= 185 && distance < 580;
      item.grasses.visible = distance < 120;
      item.woods.visible = distance < 920;
    }
  };
  group.userData.update(0, 0);
  return group;
}
