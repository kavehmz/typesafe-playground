// Presentation only: meshes and poses read the pedestrian state. This module
// never changes an actor's position, crossing schedule, sensing or collision body.
import * as THREE from '/vendor/three.module.js';

const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = t => t * t * (3 - 2 * t);

function wovenTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4;
    const thread = ((x + (y % 4 < 2 ? 0 : 2)) % 4 < 2 ? 8 : -8);
    const grain = Math.sin(x * 127.1 + y * 311.7) * 3;
    const v = 242 + thread + grain;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v; pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7); texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hairTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#a7a7a7'; ctx.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 170; k++) {
    const x = k / 170 * 256; ctx.strokeStyle = `rgba(${k % 3 ? '62,62,62' : '229,229,229'},.22)`; ctx.lineWidth = .7;
    ctx.beginPath(); ctx.moveTo(x, 0); for (let y = 0; y <= 256; y += 8) ctx.lineTo(x + Math.sin(y * .018 + k * .09) * 2.2, y); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 4; return texture;
}

function palette() {
  const cloth = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .94, map: wovenTexture() });
  const skin = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .76 });
  const hair = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .88, bumpMap: hairTexture(), bumpScale: .00055 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .79 });
  const detail = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .62 });
  return { cloth, skin, hair, shoe, detail };
}

// All static pieces of each articulated body part share one draw call per
// surface family. Vertex colours retain fine garment and face colour changes.
function batch(parent) {
  const sets = new Map();
  return {
    add(geometry, material, color, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
      const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
      const g = geometry.index ? geometry.toNonIndexed() : geometry.clone(); g.applyMatrix4(matrix);
      if (!g.attributes.normal) g.computeVertexNormals();
      const tint = new THREE.Color(color), count = g.attributes.position.count, colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { colors[i * 3] = tint.r; colors[i * 3 + 1] = tint.g; colors[i * 3 + 2] = tint.b; }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      if (!sets.has(material)) sets.set(material, []); sets.get(material).push(g); geometry.dispose();
    },
    finish() {
      for (const [material, pieces] of sets) {
        const count = pieces.reduce((n, g) => n + g.attributes.position.count, 0), result = new THREE.BufferGeometry();
        for (const [name, size] of [['position', 3], ['normal', 3], ['color', 3], ['uv', 2]]) {
          const out = new Float32Array(count * size); let start = 0;
          for (const g of pieces) { if (g.attributes[name]) out.set(g.attributes[name].array, start * size); start += g.attributes.position.count; }
          result.setAttribute(name, new THREE.BufferAttribute(out, size));
        }
        result.computeBoundingSphere(); const mesh = new THREE.Mesh(result, material);
        mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); pieces.forEach(g => g.dispose());
      }
      sets.clear();
    }
  };
}

function ellipsoid(radius = 1, width = 16, height = 10) { return new THREE.SphereGeometry(radius, width, height); }
function tube(points, radius = .003, segments = 10, sides = 5) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, sides, false);
}
function darken(color, amount = .75) { return new THREE.Color(color).multiplyScalar(amount); }
function lighten(color, amount = .12) { return new THREE.Color(color).lerp(new THREE.Color(0xeee5d1), amount); }

function loft(rings, radial = 20, folds = 0, seed = 0) {
  // Smooth the profile between authored anatomical landmarks without increasing
  // radial tessellation. Hermite tangents flatten where a profile changes slope.
  const source = rings;
  const sample = (j, column, t) => {
    const a = source[j][column] || 0, b = source[j + 1][column] || 0, h = source[j + 1][0] - source[j][0];
    const slope = k => ((source[k + 1][column] || 0) - (source[k][column] || 0)) / (source[k + 1][0] - source[k][0]);
    const mid = slope(j), before = j ? slope(j - 1) : mid, after = j + 2 < source.length ? slope(j + 1) : mid;
    const tangent = (x, y) => x * y <= 0 ? 0 : 2 * x * y / (x + y);
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * h * tangent(before, mid) + (-2 * t3 + 3 * t2) * b + (t3 - t2) * h * tangent(mid, after);
  };
  rings = [];
  for (let j = 0; j < source.length - 1; j++) for (let k = 0; k < 3; k++) {
    const t = k / 3; rings.push([lerp(source[j][0], source[j + 1][0], t), sample(j, 1, t), sample(j, 2, t), sample(j, 3, t)]);
  }
  rings.push(source.at(-1));
  const positions = [], uvs = [], indices = [];
  for (let j = 0; j < rings.length; j++) {
    const [y, width, depth, z = 0] = rings[j];
    for (let i = 0; i <= radial; i++) {
      const angle = i / radial * TAU;
      const wrinkle = folds * Math.sin(angle * 5 + j / (rings.length - 1) * 7 + seed) * Math.sin(j / (rings.length - 1) * Math.PI);
      positions.push(Math.sin(angle) * (width + wrinkle), y, z + Math.cos(angle) * (depth + wrinkle * .6));
      uvs.push(i / radial, j / (rings.length - 1));
    }
  }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < radial; i++) {
    const a = j * (radial + 1) + i, b = a + 1, c = a + radial + 1, d = c + 1;
    // Rings run bottom-to-top; this winding leaves the outward normal visible.
    indices.push(a, b, c, b, d, c);
  }
  const bottom = positions.length / 3, top = bottom + 1;
  positions.push(0, rings[0][0], rings[0][3] || 0, 0, rings.at(-1)[0], rings.at(-1)[3] || 0); uvs.push(.5, 0, .5, 1);
  for (let i = 0; i < radial; i++) { indices.push(bottom, i + 1, i); const a = (rings.length - 1) * (radial + 1) + i; indices.push(top, a, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals();
  // Average the duplicated UV seam so direct sunlight never reveals a cut.
  const normals = g.attributes.normal;
  for (let j = 0; j < rings.length; j++) {
    const a = j * (radial + 1), b = a + radial;
    const n = new THREE.Vector3().fromBufferAttribute(normals, a).add(new THREE.Vector3().fromBufferAttribute(normals, b)).normalize();
    normals.setXYZ(a, n.x, n.y, n.z); normals.setXYZ(b, n.x, n.y, n.z);
  }
  return g;
}

function patch(points) {
  const g = new THREE.BufferGeometry(), positions = points.flat(), indices = [];
  for (let i = 1; i < points.length - 1; i++) indices.push(0, i + 1, i);
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(points.flatMap((_, i) => [i % 2, Math.floor(i / 2)]), 2));
  g.setIndex(indices); g.computeVertexNormals(); return g;
}

function frontPanel(rings, xOffset = 0) {
  const positions = [], indices = [], uvs = [];
  for (let j = 0; j < rings.length; j++) {
    const [y, w, z] = rings[j];
    for (let i = 0; i < 5; i++) { const u = i / 4; positions.push(xOffset + (u * 2 - 1) * w, y, z + Math.abs(u * 2 - 1) ** 2 * .004); uvs.push(u, j / (rings.length - 1)); }
  }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < 4; i++) { const a = j * 5 + i, b = a + 1, c = a + 5, d = c + 1; indices.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

function faceGeometry() {
  const g = loft([
    [-.119, .003, .006, -.015], [-.107, .031, .030, -.017], [-.092, .051, .049, -.005],
    [-.071, .065, .061, .001], [-.040, .075, .070, .006], [-.007, .078, .073, .007],
    [.031, .078, .078, .009], [.063, .079, .078, .010], [.096, .071, .071, .009],
    [.121, .050, .054, .008], [.140, .024, .027, .007], [.146, .001, .001, .007]
  ], 40);
  // Nose, bridge and brow are part of the same surface as the cheeks. Continuous
  // normals avoid the detached button-nose appearance of layered primitives.
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (z < 0) {
      const width = .012 + .009 * Math.exp(-1 * ((y + .015) / .019) ** 2);
      const bridge = .019 * Math.exp(-1 * ((y + .009) / .024) ** 2) + .010 * Math.exp(-1 * ((y - .023) / .037) ** 2);
      const nose = bridge * Math.exp(-1 * (x / width) ** 2);
      const brow = .0025 * Math.exp(-1 * ((y - .051) / .014) ** 2) * Math.exp(-1 * ((Math.abs(x) - .032) / .021) ** 2);
      p.setZ(i, z - nose - brow);
    }
  }
  g.computeVertexNormals(); return g;
}

function hairGeometry(style) {
  const radial = 30, rows = 13, positions = [], uvs = [], indices = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= radial; i++) {
    const a = i / radial * TAU, front = Math.max(0, -Math.cos(a));
    const lower = style === 2 ? lerp(2.40, 1.08, front ** .65) : style === 4 ? lerp(2.0, 1.12, front ** 1.2) : style === 5 ? lerp(1.85, .79, front ** 1.05) : style === 3 ? lerp(1.62, 1.11, front ** 1.2) : lerp(1.94, 1.08, front ** 1.5);
    const theta = j / rows * lower;
    let volume = style === 1 ? .0045 * (Math.sin(a * 11 + theta * 13) + .4 * Math.sin(a * 23 - theta * 21)) : .002 * Math.sin(a * 9 + theta * 12);
    const wave = style === 0 ? .010 * Math.max(0, Math.sin(a)) * Math.sin(theta) : 0;
    const radiusX = style === 2 ? .104 : .094, radiusZ = style === 2 ? .101 : .099;
    positions.push(Math.sin(a) * (radiusX + volume) * Math.sin(theta), .018 + (style === 2 ? .136 : .134) * Math.cos(theta) + wave, .012 + Math.cos(a) * (radiusZ + volume) * Math.sin(theta));
    uvs.push(i / radial, j / rows);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < radial; i++) {
    const a = j * (radial + 1) + i, b = a + 1, c = a + radial + 1, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

function makeHead(mats, look) {
  const head = new THREE.Group(), b = batch(head), { skin, hair, detail } = mats;
  b.add(faceGeometry(), skin, look.skin);
  for (const s of [-1, 1]) {
    b.add(ellipsoid(1, 8, 6), skin, darken(look.skin, .32), [s * .008, -.022, -.079], [0, 0, 0], [.0030, .0016, .002]);
    b.add(ellipsoid(1, 12, 9), skin, look.skin, [s * .079, -.005, .010], [0, 0, s * .08], [.014, .028, .017]);
    b.add(ellipsoid(1, 10, 7), skin, darken(look.skin, .77), [s * .087, -.004, .006], [0, s * .4, 0], [.006, .016, .009]);
    // Recessed eyes with lids: restrained sclera and natural small irises.
    const x = s * .033;
    b.add(ellipsoid(1, 12, 8), detail, 0xb6b2a5, [x, .030, -.064], [0, s * .19, 0], [.0115, .0042, .0034]);
    b.add(ellipsoid(1, 10, 7), detail, look.iris, [x, .030, -.068], [0, s * .19, 0], [.0042, .0037, .0013]);
    b.add(ellipsoid(1, 8, 6), detail, 0x262522, [x, .030, -.069], [0, s * .19, 0], [.0016, .0021, .0008]);
    b.add(tube([[x - .012, .030, -.066], [x, .0353, -.067], [x + .012, .030, -.063]], .0009, 8), skin, darken(look.skin, .93));
    b.add(tube([[x - .012, .029, -.064], [x, .025, -.065], [x + .012, .030, -.063]], .0007, 8), skin, look.skin);
    b.add(tube([[s * .019, .052, -.069], [s * .033, .055, -.065], [s * .047, .050, -.057]], .0011, 7, 5), hair, darken(look.hair, .8));
  }
  const lipColor = new THREE.Color(look.skin).lerp(new THREE.Color(0x8b5149), .25);
  b.add(tube([[-.020, -.048, -.061], [-.008, -.047, -.065], [0, -.050, -.066], [.008, -.047, -.065], [.020, -.048, -.061]], .0012, 12, 5), skin, lipColor);
  b.add(tube([[-.018, -.051, -.061], [0, -.055, -.066], [.018, -.051, -.061]], .0014, 9, 5), skin, lipColor);
  b.add(hairGeometry(look.style), hair, look.hair);
  if (look.style === 4) {
    b.add(ellipsoid(1, 14, 10), hair, look.hair, [0, .028, .111], [.22, 0, 0], [.035, .047, .045]);
    b.add(tube([[0, .016, .128], [.004, -.044, .142], [.011, -.110, .129], [.020, -.151, .109]], .021, 12, 7), hair, look.hair);
    b.add(ellipsoid(1, 10, 7), detail, 0x574339, [0, .005, .124], [0, 0, 0], [.028, .006, .025]);
  }
  if (look.style === 5) {
    // Wire-rim glasses remain thin and sit just in front of the brow surface.
    for (const s of [-1, 1]) {
      const x = s * .034;
      b.add(tube([[x - .021, .031, -.072], [x - .016, .044, -.074], [x + .014, .044, -.070], [x + .022, .030, -.064], [x + .015, .016, -.069], [x - .015, .016, -.074], [x - .021, .031, -.072]], .0016, 18, 4), detail, 0x494745);
      b.add(tube([[s * .056, .036, -.062], [s * .080, .025, -.014], [s * .082, .016, .025]], .0015, 7, 4), detail, 0x494745);
    }
    b.add(tube([[-.012, .033, -.073], [0, .037, -.079], [.012, .033, -.073]], .0015, 7, 4), detail, 0x494745);
  }
  b.finish(); return head;
}

function makeArm(parent, side, mats, look) {
  const upper = new THREE.Group(); parent.add(upper); upper.position.set(side * look.shoulder, 1.329, .006);
  const a = batch(upper);
  a.add(loft([[-.318, .039, .040], [-.275, .045, .044], [-.204, .047, .049], [-.112, .052, .053], [-.030, .059, .058], [.018, .048, .047], [.043, .015, .020], [.047, .002, .004]], 16, .0025, side), mats.cloth, look.coat);
  a.finish();
  const lower = new THREE.Group(); lower.position.y = -.307; upper.add(lower); const b = batch(lower);
  if (look.variant !== 1) {
    b.add(loft([[-.258, .033, .033], [-.225, .037, .036], [-.152, .045, .043], [-.075, .046, .045], [-.016, .044, .045], [.013, .037, .039]], 16, .0021, side + 1), mats.cloth, look.coat);
    b.add(loft([[-.264, .035, .035], [-.249, .036, .036], [-.239, .035, .035]], 16), mats.cloth, darken(look.coat, .75));
    b.add(ellipsoid(1, 12, 8), mats.skin, look.skin, [0, -.272, 0], [0, 0, 0], [.028, .040, .026]);
  } else {
    b.add(loft([[-.240, .027, .026], [-.190, .032, .030], [-.100, .039, .033], [-.020, .040, .036], [.011, .035, .035]], 16), mats.skin, look.skin);
    b.add(loft([[-.090, .043, .039], [-.072, .047, .043], [-.032, .049, .046], [.012, .043, .043]], 16), mats.cloth, lighten(look.coat, .18));
  }
  // Relaxed palm, thumb and four softly curled fingers have recognisable anatomy.
  b.add(ellipsoid(1, 12, 9), mats.skin, look.skin, [0, -.303, -.002], [-.09, 0, side * .05], [.029, .044, .017]);
  for (let k = 0; k < 4; k++) {
    const x = (k - 1.5) * .012, length = [ .026, .035, .037, .028 ][k];
    b.add(tube([[x, -.326, -.003], [x, -.326 - length * .62, -.007], [x, -.326 - length, -.015]], .0063, 5, 5), mats.skin, look.skin);
  }
  b.add(tube([[-side * .023, -.290, -.004], [-side * .034, -.313, -.010], [-side * .030, -.334, -.020]], .0085, 5, 6), mats.skin, look.skin);
  b.add(ellipsoid(1, 14, 10), mats.cloth, look.coat, [0, 0, 0], [0, 0, 0], [.044, .043, .044]);
  b.add(ellipsoid(1, 12, 8), mats.skin, look.skin, [0, -.261, 0], [0, 0, 0], [.027, .032, .025]);
  b.finish(); upper.userData.lower = lower; return upper;
}

function shoeGeometry() {
  // Heel-to-toe silhouette has a rounded toe box, instep, heel counter and sole.
  const rings = [
    [-.045, .042, .107, -.046], [-.025, .044, .109, -.046], [.001, .042, .106, -.043],
    [.032, .041, .088, -.030], [.057, .036, .056, -.001], [.071, .031, .038, .012]
  ];
  return loft(rings, 20);
}

function makeLeg(parent, side, mats, look) {
  const upper = new THREE.Group(); parent.add(upper); upper.position.set(side * .091, 0, 0);
  const lower = new THREE.Group(); lower.position.y = -.450; upper.add(lower);
  const foot = new THREE.Group(); foot.position.y = -.425; lower.add(foot); const f = batch(foot);
  f.add(shoeGeometry(), mats.shoe, look.shoes);
  f.add(loft([[-.068, .040, .106, -.047], [-.057, .046, .111, -.047], [-.038, .046, .110, -.047]], 20), mats.shoe, look.soles);
  f.add(ellipsoid(1, 12, 8), mats.shoe, darken(look.shoes, .76), [0, .030, -.032], [0, 0, 0], [.027, .011, .050]);
  for (let k = 0; k < 3; k++) f.add(tube([[-.023, .038 - k * .010, -.018 - k * .022], [0, .043 - k * .010, -.020 - k * .022], [.023, .038 - k * .010, -.018 - k * .022]], .0023, 4, 4), mats.shoe, look.laces);
  f.finish(); upper.userData.lower = lower; upper.userData.foot = foot; return upper;
}

function makeTrousers(parent, mats, look) {
  const root = new THREE.Bone(), bones = [root], sides = [];
  for (const side of [-1, 1]) {
    const thigh = new THREE.Bone(), shin = new THREE.Bone(); thigh.position.x = side * .091; shin.position.y = -.450;
    root.add(thigh); thigh.add(shin); bones.push(thigh, shin); sides.push({ thigh, shin });
  }
  const positions = [], colors = [], uvs = [], indices = [], skinIndices = [], weights = [], radial = 28;
  // The two upper rings form matching halves of one waist; below the crotch,
  // each smoothly becomes a separate trouser leg. Skinning keeps the fabric
  // continuous at hips and knees instead of exposing spherical joint pieces.
  const rings = [
    [.094, .089, .108, 1], [.054, .090, .111, 1], [.010, .091, .110, 1],
    [-.025, .091, .107, .92], [-.062, .088, .101, .72], [-.093, .087, .094, .43],
    [-.128, .085, .089, .17], [-.166, .079, .080, 0], [-.213, .075, .074, 0],
    [-.263, .071, .068, 0], [-.311, .065, .060, 0], [-.354, .060, .056, 0],
    [-.391, .055, .052, 0], [-.421, .052, .050, 0], [-.450, .051, .049, 0],
    [-.481, .050, .049, 0], [-.515, .049, .051, 0], [-.560, .048, .053, 0],
    [-.613, .046, .052, 0], [-.670, .043, .048, 0], [-.723, .039, .043, 0],
    [-.772, .036, .039, 0], [-.812, .037, .039, 0], [-.848, .039, .041, 0]
  ];
  for (let leg = 0; leg < 2; leg++) {
    const side = leg ? 1 : -1, base = positions.length / 3;
    for (let j = 0; j < rings.length; j++) {
      const [y, width, depth, join] = rings[j];
      const rootWeight = 1 - smooth(clamp((-y - .035) / .17, 0, 1));
      const shinWeight = smooth(clamp((-y - .382) / .140, 0, 1));
      for (let i = 0; i <= radial; i++) {
        const a = i / radial * TAU, sin = Math.sin(a), cos = Math.cos(a);
        const circle = side * .091 + sin * width, waist = side * Math.max(0, side * sin) * look.hip;
        const crease = .0012 * Math.sin(a * 5 + y * 38) * (1 - join);
        positions.push(lerp(circle, waist, join) + sin * crease, y, cos * (depth + crease));
        const tint = new THREE.Color(look.pants).multiplyScalar(1 + .035 * Math.sin(a * 2 + y * 5));
        colors.push(tint.r, tint.g, tint.b); uvs.push(i / radial, (y + .85) * 1.15);
        skinIndices.push(0, leg * 2 + 1, leg * 2 + 2, 0);
        weights.push(rootWeight, (1 - rootWeight) * (1 - shinWeight), (1 - rootWeight) * shinWeight, 0);
      }
    }
    for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < radial; i++) {
      const a = base + j * (radial + 1) + i, b = a + 1, c = a + radial + 1, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4)); geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.SkinnedMesh(geometry, mats.cloth); mesh.add(root); parent.add(mesh);
  mesh.bind(new THREE.Skeleton(bones)); mesh.castShadow = mesh.receiveShadow = true;
  // Characters are culled by their owning world group; a fixed local sphere
  // covers every animated limb pose without recomputing it in each camera.
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -.38, 0), .75);
  return { mesh, sides };
}

function makeTorso(parent, mats, look) {
  const torso = new THREE.Group(); parent.add(torso); torso.position.y = -.906;
  const b = batch(torso), narrow = look.variant === 2 || look.variant === 4, long = look.variant === 3 || look.variant === 5;
  const shoulder = look.shoulder, chest = look.chest, waist = look.waist, belly = look.variant === 5 ? .121 : look.variant === 1 ? .115 : .108;
  const hemWidth = long ? waist + .025 : Math.max(waist + .012, look.hip + .013), hipWidth = Math.max(waist + .009, look.hip + .011), hipDepth = Math.max(belly + .008, .124);
  b.add(loft([
    [long ? .806 : .915, hemWidth, long ? .143 : .132, .010], [.972, hipWidth, hipDepth, .003],
    [1.056, waist, belly, .001], [1.135, waist + .002, belly + .005, -.003], [1.228, chest, .114, -.002],
    [1.296, shoulder - .003, .108, .003], [1.339, shoulder - .003, .097, .005], [1.372, shoulder - .014, .082, .008],
    [1.408, .108, .065, .008], [1.438, .060, .048, .004], [1.441, .049, .044, .003]
  ], 24, .0028, look.variant), mats.cloth, look.coat);
  b.add(loft([[1.412, .065, .050, .012], [1.438, .051, .045, .008], [1.462, .041, .041, .009], [1.490, .037, .038, .010]], 18), mats.skin, look.skin);
  // A shirt inset and collar give the neckline depth and a clear shoulder line.
  if (look.variant !== 2 && look.variant !== 4) b.add(frontPanel([[1.430, .050, -.062], [1.403, .038, -.088], [1.365, .020, -.113], [1.340, .001, -.121]]), mats.cloth, look.shirt);
  if (look.variant !== 2 && look.variant !== 4) {
    b.add(patch([[-.057, 1.439, -.049], [-.090, 1.424, -.063], [-.119, 1.378, -.096], [-.056, 1.363, -.109], [-.030, 1.394, -.090]]), mats.cloth, lighten(look.coat, .065));
    b.add(patch([[.057, 1.439, -.049], [.030, 1.394, -.090], [.056, 1.363, -.109], [.119, 1.378, -.096], [.090, 1.424, -.063]]), mats.cloth, lighten(look.coat, .065));
    b.add(tube([[0, 1.335, -.110], [0, 1.228, -.122], [0, 1.135, -(belly + .015)], [0, 1.056, -(belly + .007)], [0, .978, -(hipDepth + .003)], [0, long ? .832 : .935, long ? -.138 : -.127]], .0026, 20, 4), mats.cloth, darken(look.coat, .67));
    for (const side of [-1, 1]) {
      const y = look.variant === 1 ? 1.241 : 1.087;
      b.add(tube([[side * .068, y + .02, -.111], [side * .126, y + .004, -.090]], .0036, 6, 4), mats.cloth, darken(look.coat, .63));
      if (look.variant === 1) b.add(patch([[side * .069, y + .018, -.113], [side * .068, y - .059, -.108], [side * .115, y - .074, -.096], [side * .131, y + .004, -.088]]), mats.cloth, darken(look.coat, .89));
    }
  } else {
    b.add(loft([[1.399, .074, .061], [1.419, .070, .058], [1.436, .053, .048]], 18), mats.cloth, darken(look.coat, .82));
    b.add(loft([[.911, hemWidth + .001, .132], [.927, hemWidth + .003, .134], [.945, hemWidth + .002, .134]], 24), mats.cloth, darken(look.coat, .80));
  }
  // Only short, low-contrast creases; strong bands would look like armour.
  for (const s of [-1, 1]) {
    b.add(tube([[s * .086, 1.017, -.091], [s * .118, 1.030, -.079], [s * .143, 1.048, -.053]], .0020, 6, 4), mats.cloth, darken(look.coat, .86));
    b.add(tube([[s * .094, 1.133, -.093], [s * .123, 1.112, -.080], [s * .148, 1.108, -.049]], .0018, 6, 4), mats.cloth, darken(look.coat, .88));
  }
  if (look.variant === 3) {
    // The daypack is a silhouette variation with a real volume and sewn straps.
    b.add(ellipsoid(1, 18, 12), mats.cloth, 0x4e655a, [0, 1.185, .140], [.055, 0, 0], [.129, .188, .073]);
    b.add(ellipsoid(1, 14, 10), mats.cloth, 0x415b50, [0, 1.112, .195], [.055, 0, 0], [.105, .078, .032]);
    for (const s of [-1, 1]) b.add(tube([[s * .091, 1.289, .184], [s * .123, 1.397, .052], [s * .127, 1.342, -.084], [s * .132, 1.153, -.086], [s * .131, 1.068, .057]], .012, 18, 6), mats.cloth, 0x344c42);
    b.add(tube([[-.041, 1.351, .149], [0, 1.375, .143], [.041, 1.351, .149]], .006, 9, 5), mats.cloth, 0x344c42);
  }
  if (look.variant === 5) {
    // A soft scarf and tote distinguish the older civilian without changing width.
    b.add(loft([[1.379, .071, .060], [1.414, .078, .061], [1.449, .062, .053]], 18, .001), mats.cloth, 0x9b8c76);
    b.add(frontPanel([[1.426, .027, -.065], [1.393, .029, -.104], [1.330, .027, -.126], [1.227, .028, -.133]], -.015), mats.cloth, 0xb2a38e);
  }
  b.finish();
  const head = makeHead(mats, look); head.position.set(0, 1.583, .001); head.scale.set(narrow ? .97 : 1, .88, 1); torso.add(head);
  const arms = [-1, 1].map(s => makeArm(torso, s, mats, look));
  return { torso, head, arms };
}

export function makePerson(color, variant = 0) {
  variant = Math.abs(Math.floor(Number(variant) || 0)); const v = variant % 6;
  const looks = [
    { skin: 0xc38b67, hair: 0x45372e, iris: 0x574a39, pants: 0x343b3c, shoes: 0x594a3b, soles: 0x373834, laces: 0x726454, shirt: 0xc9c5ad, shoulder: .184, chest: .177, waist: .168, hip: .167, height: 1.78 },
    { skin: 0x885b41, hair: 0x292725, iris: 0x3c3229, pants: 0xada18b, shoes: 0xd1cec2, soles: 0xb5b5a9, laces: 0xe4dfce, shirt: 0xdad8c8, shoulder: .197, chest: .188, waist: .179, hip: .177, height: 1.83 },
    { skin: 0xe1b08d, hair: 0x574032, iris: 0x716653, pants: 0x4b4d49, shoes: 0x52443b, soles: 0x393a35, laces: 0x6a5a4b, shirt: 0xe0d1b7, shoulder: .171, chest: .162, waist: .160, hip: .171, height: 1.68 },
    { skin: 0x72503e, hair: 0x35312b, iris: 0x342b22, pants: 0x414b45, shoes: 0x534d40, soles: 0x343b36, laces: 0x9b9583, shirt: 0xcbc9b7, shoulder: .184, chest: .176, waist: .173, hip: .170, height: 1.77 },
    { skin: 0xd2a17c, hair: 0x392b26, iris: 0x655743, pants: 0x343e48, shoes: 0xc4c0b1, soles: 0xddd7c8, laces: 0xe5dfcf, shirt: 0xd7cec2, shoulder: .165, chest: .158, waist: .149, hip: .166, height: 1.71 },
    { skin: 0xc49c82, hair: 0x8b8980, iris: 0x70776a, pants: 0x5b5b53, shoes: 0x363a37, soles: 0x292d2a, laces: 0x4a4b42, shirt: 0xbbbaa9, shoulder: .179, chest: .174, waist: .181, hip: .176, height: 1.75 }
  ];
  const look = { ...looks[v], coat: color, variant: v, style: v }, mats = palette();
  const person = new THREE.Group(), pelvis = new THREE.Group(); pelvis.position.y = .906; person.add(pelvis);
  const { torso, head, arms } = makeTorso(pelvis, mats, look);
  const legs = [-1, 1].map(s => makeLeg(pelvis, s, mats, look));
  const trousers = makeTrousers(pelvis, mats, look);
  person.scale.setScalar(look.height / 1.750);
  person.userData = { variant, displayName: ['Pedestrian · field jacket', 'Pedestrian · denim jacket', 'Pedestrian · olive knit', 'Pedestrian · ochre parka', 'Pedestrian · mauve knit', 'Pedestrian · navy coat'][v], look, pelvis, torso, head, arms, legs, trousers, phase: 0, distance: 0, lastX: null, lastTime: null, lastState: null, crossingStarted: null, strideLength: 1.10 * person.scale.y };
  updatePersonVisual(person, { state: 'waiting', kerbSide: 1, x: 0, walkSpeed: 1.3 }, 0);
  return person;
}

function solveLeg(leg, y, z, roll = 0) {
  const upperLength = .450, lowerLength = .425;
  const distance = clamp(Math.hypot(y, z), .25, upperLength + lowerLength - .0001);
  const reach = Math.acos(clamp((upperLength ** 2 + distance ** 2 - lowerLength ** 2) / (2 * upperLength * distance), -1, 1));
  const bend = Math.acos(clamp((distance ** 2 - upperLength ** 2 - lowerLength ** 2) / (2 * upperLength * lowerLength), -1, 1));
  const hip = Math.atan2(-z, -y) + reach;
  leg.rotation.x = hip; leg.userData.lower.rotation.x = -bend;
  leg.userData.foot.rotation.x = -hip + bend + roll;
}

export function updatePersonVisual(mesh, person, time = 0) {
  const d = mesh.userData, crossing = person.state === 'crossing';
  const dt = d.lastTime === null ? 0 : clamp(time - d.lastTime, 0, .10), reset = d.lastTime !== null && time < d.lastTime;
  if (reset) { d.distance = 0; d.lastX = person.x; d.crossingStarted = null; }
  if (crossing && d.lastState !== 'crossing') { d.distance = 0; d.crossingStarted = time; d.lastX = person.x; }
  if (crossing && d.lastX !== null && Number.isFinite(person.x)) d.distance += Math.min(Math.abs(person.x - d.lastX), Math.max(.25, (person.walkSpeed || 1.3) * dt * 2));
  const cycle = d.distance / d.strideLength, phase = cycle * TAU;
  const walkBlend = crossing ? smooth(clamp((time - (d.crossingStarted ?? time)) / .18, 0, 1)) : 0;
  const breath = Math.sin(time * 1.58 + d.variant * .74), sway = Math.sin(phase);
  // Solve both ankles first; pelvis height respects the supporting leg's reach.
  const targets = [];
  let hipHeight = crossing ? .909 + (1 - Math.cos(phase * 2)) * .013 : .935 + breath * .0008;
  d.torso.position.y = -.906 + (crossing ? 0 : breath * .0015);
  d.torso.rotation.y = crossing ? sway * -.035 : Math.sin(time * .37 + d.variant) * .012;
  d.torso.rotation.z = crossing ? Math.cos(phase) * .015 : Math.sin(time * .29 + d.variant) * .006;
  d.torso.rotation.x = crossing ? -.018 : -.005;
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1, p = ((cycle + i * .5) % 1 + 1) % 1;
    let z = side * .014, lift = 0, roll = 0;
    if (crossing) {
      // During the 60% stance the ankle travels backwards at the exact physical
      // walking speed. The other foot clears the ground during its swing.
      if (p < .60) {
        z = -.33 + .66 * (p / .60);
        const heel = 1 - smooth(clamp(p / .09, 0, 1));
        const toe = smooth(clamp((p - .46) / .14, 0, 1));
        roll = heel * .12 - toe * .27;
      } else {
        const s = (p - .60) / .40;
        z = lerp(.33, -.33, smooth(s)); lift = Math.sin(Math.PI * s) ** 1.15 * .095;
        roll = Math.sin(Math.PI * s) * -.12;
      }
      z = lerp(side * .014, z, walkBlend); lift *= walkBlend; roll *= walkBlend;
    }
    // Each foot follows the rendered pavement independently while the actor's
    // original x/z and crossing schedule remain untouched.
    const heading=(person.kerbSide||1)*Math.PI/2,scale=mesh.scale.y;
    const footX=person.x+scale*(side*.091*Math.cos(heading)+z*Math.sin(heading));
    const footZ=(person.z||0)+scale*(side*.091*Math.sin(heading)-z*Math.cos(heading));
    const ground=d.groundHeight?(d.groundHeight(footX,footZ)-mesh.position.y)/scale:0;
    const ankleY = ground + .068 * Math.cos(roll) + (roll >= 0 ? .064 : .150) * Math.abs(Math.sin(roll)) + lift + .002;
    targets.push({ z, ankleY, roll });
    hipHeight = Math.min(hipHeight, ankleY + Math.sqrt(Math.max(.1, .872 ** 2 - z ** 2)));
    d.legs[i].rotation.z = side * -.007;
    d.legs[i].userData.foot.rotation.y = side * -.050;
    const arm = d.arms[i];
    arm.rotation.z = side * (crossing ? .075 : .057);
    arm.rotation.x = crossing ? z / .33 * .235 * walkBlend - .025 : -.025 + Math.sin(time * 1.58 + d.variant) * .004;
    arm.userData.lower.rotation.x = .11 + (crossing ? Math.max(0, arm.rotation.x) * .42 : .015);
  }
  d.pelvis.position.y = hipHeight;
  for (let i = 0; i < 2; i++) {
    solveLeg(d.legs[i], targets[i].ankleY - hipHeight, targets[i].z, targets[i].roll);
    d.trousers.sides[i].thigh.quaternion.copy(d.legs[i].quaternion);
    d.trousers.sides[i].shin.quaternion.copy(d.legs[i].userData.lower.quaternion);
  }
  // Looking is visual posture only; it neither starts nor delays a crossing.
  const glance = Math.sin(time * .46 + d.variant * 1.73);
  d.head.rotation.y = crossing ? Math.sin(time * .60 + d.variant) * .055 : glance * .20;
  d.head.rotation.x = crossing ? -.018 + Math.sin(phase * 2) * .008 : .018 + Math.sin(time * .73 + d.variant) * .012;
  d.head.rotation.z = crossing ? -sway * .007 : Math.sin(time * .37 + d.variant) * .012;
  mesh.rotation.y = (person.kerbSide || 1) * Math.PI / 2;
  d.phase = phase; d.lastX = person.x; d.lastTime = time; d.lastState = person.state;
}
