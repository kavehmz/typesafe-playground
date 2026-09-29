// Presentation only. Dimensions, wheel motion and lights read the simulation state;
// these models never select a manoeuvre or change a physical state.
import * as THREE from '/vendor/three.module.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = THREE.MathUtils.lerp;

// Static details of the same material become one mesh. Keeping wheels and limbs
// separate makes their articulation inexpensive even in the four sensor views.
function batchBuilder(parent) {
  const batches = new Map();
  return {
    add(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale));
      const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
      g.applyMatrix4(m);
      if (!batches.has(material)) batches.set(material, []);
      batches.get(material).push(g);
      geometry.dispose();
    },
    finish() {
      const meshes = [];
      for (const [material, pieces] of batches) {
        let length = 0;
        for (const g of pieces) length += g.attributes.position.count;
        const positions = new Float32Array(length * 3), normals = new Float32Array(length * 3), uvs = new Float32Array(length * 2);
        let offset = 0;
        for (const g of pieces) {
          if (!g.attributes.normal) g.computeVertexNormals();
          positions.set(g.attributes.position.array, offset * 3);
          normals.set(g.attributes.normal.array, offset * 3);
          if (g.attributes.uv) uvs.set(g.attributes.uv.array, offset * 2);
          offset += g.attributes.position.count;
          g.dispose();
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.computeBoundingSphere();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true; mesh.receiveShadow = true;
        parent.add(mesh); meshes.push(mesh);
      }
      batches.clear();
      return meshes;
    }
  };
}

function surface(fn, nu = 20, nv = 12) {
  const positions = [], uvs = [], indices = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu, v = j / nv, p = fn(u, v);
    positions.push(p[0], p[1], p[2]); uvs.push(u, v);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

function roundedBox(w, h, d, r = 0.025) {
  r = Math.min(r, w / 3, h / 3, d / 3);
  const shape = new THREE.Shape();
  const x = w / 2 - r, y = h / 2 - r;
  shape.moveTo(-x, -y); shape.lineTo(x, -y); shape.lineTo(x, y); shape.lineTo(-x, y); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * r, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: r, bevelThickness: r, curveSegments: 1 });
  g.translate(0, 0, -d / 2 + r);
  return g;
}
function tube(points, radius = 0.006, segments = 24, radialSegments = 5) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, radialSegments, false);
}
function material(color, roughness = 0.5, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function atProfile(profile, z, column) {
  for (let i = 0; i < profile.length - 1; i++) {
    if (z <= profile[i + 1][0]) {
      const h = profile[i + 1][0] - profile[i][0], t = clamp((z - profile[i][0]) / h, 0, 1);
      const slope = j => (profile[j + 1][column] - profile[j][column]) / (profile[j + 1][0] - profile[j][0]);
      const d = slope(i), before = i > 0 ? slope(i - 1) : d, after = i + 2 < profile.length ? slope(i + 1) : d;
      const tangent = (a, b) => a * b <= 0 ? 0 : 2 * a * b / (a + b);
      const t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * profile[i][column] + (t3 - 2 * t2 + t) * h * tangent(before, d)
        + (-2 * t3 + 3 * t2) * profile[i + 1][column] + (t3 - t2) * h * tangent(d, after);
    }
  }
  return profile.at(-1)[column];
}

function plateTexture(ego, variant) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e6e7df'; ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#2b4564'; ctx.fillRect(0, 0, 22, 64);
  ctx.fillStyle = '#eeeada'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('D', 6, 51);
  ctx.fillStyle = '#192329'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '600 42px monospace'; ctx.fillText(ego ? 'JEV 01' : ['B 427', 'AB 912', 'K 308', 'M 561'][variant % 4], 143, 34);
  ctx.fillStyle = '#909795'; ctx.beginPath(); ctx.arc(32, 31, 3, 0, TAU); ctx.arc(244, 31, 3, 0, TAU); ctx.fill();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function buildWheel(side, trim, alloy, brake, red) {
  // Steering happens around local Y; rolling around local X happens in a child.
  const mount = new THREE.Group(), roll = new THREE.Group(); mount.add(roll);
  const b = batchBuilder(roll);
  const rubber = material(0x141719, 0.93);
  const profile = [[0.240, -0.075], [0.285, -0.075], [0.318, -0.058], [0.333, -0.036], [0.334, 0.036], [0.318, 0.058], [0.285, 0.075], [0.240, 0.075]];
  const tyre = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 40); tyre.rotateZ(Math.PI / 2);
  b.add(tyre, rubber);
  // Small sipes break the shoulder highlights without using flat grey cylinders.
  for (let k = 0; k < 48; k++) {
    const a = k * TAU / 48;
    b.add(new THREE.BoxGeometry(0.116, 0.004, 0.011), trim, [0, Math.cos(a) * 0.332, Math.sin(a) * 0.332], [a, 0, 0]);
  }
  const barrel = new THREE.CylinderGeometry(0.245, 0.245, 0.141, 32, 1, true); barrel.rotateZ(Math.PI / 2); b.add(barrel, alloy);
  const rim = new THREE.TorusGeometry(0.239, 0.010, 5, 32); rim.rotateY(Math.PI / 2); b.add(rim, alloy, [side * 0.071, 0, 0]);
  const disc = new THREE.CylinderGeometry(0.202, 0.202, 0.010, 32); disc.rotateZ(Math.PI / 2); b.add(disc, brake, [side * 0.042, 0, 0]);
  // Split five-spoke forged alloy wheels, with a visibly recessed brake disc.
  for (let k = 0; k < 5; k++) for (const split of [-1, 1]) {
    const a = k * TAU / 5 + split * 0.095;
    b.add(roundedBox(0.026, 0.158, 0.023, 0.005), alloy, [side * 0.073, Math.cos(a) * 0.143, Math.sin(a) * 0.143], [a + split * 0.12, 0, 0]);
  }
  const hub = new THREE.CylinderGeometry(0.058, 0.058, 0.031, 18); hub.rotateZ(Math.PI / 2); b.add(hub, alloy, [side * 0.067, 0, 0]);
  const cap = new THREE.CylinderGeometry(0.025, 0.025, 0.033, 14); cap.rotateZ(Math.PI / 2); b.add(cap, trim, [side * 0.068, 0, 0]);
  for (let k = 0; k < 5; k++) {
    const a = k * TAU / 5;
    const bolt = new THREE.CylinderGeometry(0.007, 0.007, 0.003, 5); bolt.rotateZ(Math.PI / 2);
    b.add(bolt, brake, [side * 0.084, Math.cos(a) * 0.040, Math.sin(a) * 0.040]);
  }
  const wheelMeshes = b.finish();
  for (const mesh of wheelMeshes) {
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setX(i, clamp(p.getX(i), -0.075, 0.075));
    p.needsUpdate = true; mesh.geometry.computeBoundingSphere();
  }
  // Caliper stays upright when the disc and wheel rotate.
  const caliper = new THREE.Mesh(roundedBox(0.038, 0.125, 0.066, 0.012), red);
  caliper.position.set(side * 0.053, 0.018, 0.174); mount.add(caliper);
  mount.userData.roll = roll;
  return mount;
}

export function makeCar(color, ego = false, variant = 0) {
  variant = Math.abs(Math.floor(Number(variant) || 0));
  const car = new THREE.Group(), body = new THREE.Group(), chassis = new THREE.Group();
  car.add(body); body.add(chassis); car.userData.bodyGroup = body; car.userData.chassis = chassis;
  const b = batchBuilder(chassis);
  const paint = new THREE.MeshPhysicalMaterial({ color, metalness: 0.68, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.16, envMapIntensity: 1.0 });
  const darkPaint = paint.clone(); darkPaint.color.multiplyScalar(0.73); darkPaint.roughness = 0.29;
  const trim = material(0x171d20, 0.49, 0.18), grille = material(0x101518, 0.68, 0.15);
  trim.side = grille.side = THREE.DoubleSide;
  const alloy = material(0xb1babd, 0.26, 0.94), chrome = material(0x869296, 0.25, 0.85), brakes = material(0x535b5e, 0.48, 0.80);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x182a33, roughness: 0.105, metalness: 0.32, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.4 });
  const seam = material(0x243035, 0.7);
  const head = new THREE.MeshStandardMaterial({ color: 0xe8f5fa, emissive: 0xccedff, emissiveIntensity: 1.8, roughness: 0.21 });
  const tail = new THREE.MeshPhysicalMaterial({ color: 0x661018, emissive: 0xfe1830, emissiveIntensity: 0.5, roughness: 0.36, specularIntensity: 0.15, envMapIntensity: 0.2, clearcoat: 0.25 });
  const indicatorMats = [-1, 1].map(() => new THREE.MeshStandardMaterial({ color: 0x755a32, emissive: 0xffa01c, emissiveIntensity: 0.0, roughness: 0.2 }));
  const reflector = material(0x801922, 0.3);
  const caliper = material(ego ? 0xa94930 : 0x454b4d, 0.53, 0.3);

  // The closed upper body has sculpted shoulders and an actual cutout over each
  // tyre. Its maximum paint width is 1.85 m and bumper-to-bumper length is 4.50 m.
  const profile = [
    [-2.25, 0.68, 0.72], [-2.15, 0.84, 0.84], [-1.86, 0.915, 0.92], [-1.42, 0.925, 0.966],
    [-1.06, 0.912, 0.984], [-0.55, 0.906, 0.984], [0.2, 0.91, 1.00], [0.95, 0.925, 1.004],
    [1.42, 0.925, 0.99], [1.88, 0.902, 0.922], [2.16, 0.805, 0.848], [2.25, 0.68, 0.756]
  ];
  const width = z => atProfile(profile, z, 1), top = z => atProfile(profile, z, 2);
  const shoulderDrop = t => {
    const a = Math.abs(t), corner = clamp((a - 0.65) / 0.35, 0, 1);
    return 0.03 * a * a + 0.075 * (1 - Math.sqrt(Math.max(0, 1 - corner * corner)));
  };
  const archY = z => {
    const d = Math.min(Math.abs(z + 1.4), Math.abs(z - 1.4));
    return d < 0.406 ? 0.334 + Math.sqrt(0.406 ** 2 - d ** 2) : 0.30;
  };
  const topSurface = surface((u, v) => {
    const z = lerp(-2.25, 2.25, v), t = u * 2 - 1;
    return [t * width(z), top(z) - shoulderDrop(t), z];
  }, 28, 100);
  b.add(topSurface, paint);
  for (const side of [-1, 1]) {
    b.add(surface((u, v) => {
      const z = lerp(-2.25, 2.25, v), bottom = archY(z), roof = top(z) - 0.105;
      const flare = Math.sin(u * Math.PI) * 0.013;
      const endTaper = clamp((Math.abs(z) - 1.98) / 0.27, 0, 1);
      const inset = (z < 0 ? 0.12 : 0.10) * Math.pow(1 - u, 1.4) * endTaper;
      return [side * (width(z) - 0.045 * (1 - u) + flare), lerp(bottom, roof, u), z - Math.sign(z) * inset];
    }, 6, 160), paint);
    // Black wheel-well inner faces and a narrow painted lip give the opening depth.
    for (const z0 of [-1.4, 1.4]) {
      b.add(surface((u, v) => {
        const a = v * Math.PI, radius = lerp(0.401, 0.414, u), z = z0 + Math.cos(a) * radius;
        return [side * (width(z) + 0.003), 0.334 + Math.sin(a) * radius, z];
      }, 2, 40), darkPaint);
      b.add(surface((u, v) => {
        const a = v * Math.PI, z = z0 + Math.cos(a) * 0.401;
        return [side * lerp(0.716, width(z) - 0.001, u), 0.334 + Math.sin(a) * 0.401, z];
      }, 3, 36), grille);
    }
    b.add(roundedBox(0.055, 0.074, 1.68), trim, [side * 0.884, 0.295, 0]);
    b.add(tube([[side * 0.90, 0.393, -0.87], [side * 0.902, 0.39, -0.2], [side * 0.908, 0.401, 0.8]], 0.007), darkPaint);
  }
  for (const z of [-2.25, 2.25]) {
    b.add(surface((u, v) => {
      const x = (u * 2 - 1) * lerp(width(z) - 0.045, width(z), v);
      const y = lerp(0.3, top(z) - shoulderDrop(u * 2 - 1), v);
      const inset = (z < 0 ? 0.12 : 0.10) * Math.pow(1 - v, 1.4);
      const plateRecess = z > 0 ? 0.025 * Math.exp(-((x / 0.27) ** 6) - (((y - 0.588) / 0.078) ** 4)) : 0;
      return [x, y, z - Math.sign(z) * (inset + plateRecess)];
    }, 20, 6), paint);
  }
  b.add(roundedBox(1.47, 0.055, 3.8), grille, [0, 0.259, 0]);

  // A continuous double-curved greenhouse, with painted roof and slender pillars.
  const wagon = variant % 3 !== 2;
  const rearRoof = wagon ? 0.93 : 0.63;
  const cabin = [[-1.10, 0.793, 1.003], [-0.83, 0.750, 1.23], [-0.47, 0.675, 1.462], [-0.10, 0.661, 1.487], [rearRoof, 0.685, wagon ? 1.455 : 1.47], [1.18, 0.732, 1.285], [1.56, 0.800, 1.007]];
  const cabinW = z => atProfile(cabin, z, 1), cabinH = z => atProfile(cabin, z, 2);
  const greenhousePoint = (u, z) => {
    const t = u * 2 - 1, a = Math.abs(t);
    // Almost flat roof, generous shoulder radius, and inward leaning glass sides.
    const roof = cabinH(z), base = 1.005, edge = Math.max(base, roof - 0.085);
    return [t * cabinW(z), roof - (roof - edge) * Math.pow(a, 2.5), z];
  };
  const sideWindowPoint = (side, z, t) => [side * lerp(0.795 - 0.008 * Math.cos(z), cabinW(z), t), lerp(1.005, Math.max(1.005, cabinH(z) - 0.085), t), z];
  b.add(surface((u, v) => greenhousePoint(u, lerp(-1.10, 1.56, v)), 20, 48), glass);
  for (const side of [-1, 1]) {
    b.add(surface((u, v) => {
      const z = lerp(-1.10, 1.56, v), roof = Math.max(1.005, cabinH(z) - 0.085);
      return [side * lerp(0.795 - 0.008 * Math.cos(z), cabinW(z), u), lerp(1.005, roof, u), z];
    }, 6, 52), glass);
    // Lower window surround and exterior belt line.
    b.add(tube([[side * 0.79, 1.006, -1.05], [side * 0.796, 1.009, -0.2], [side * 0.794, 1.009, 0.9], [side * 0.80, 1.006, 1.5]], 0.012), trim);
    b.add(tube([[side * 0.802, 1.00, -1.06], [side * 0.805, 1.004, 0.10], [side * 0.806, 1.001, 1.47]], 0.004), chrome);
    // Flush sheet-metal pillars follow the actual glass surface. Using ribbons
    // here avoids the external roll-cage appearance of cylindrical bars.
    for (const [from, to, pillarWidth] of [[-1.09, -0.455, 0.053], [rearRoof, 1.553, 0.090]]) {
      b.add(surface((u, v) => {
        const z = lerp(from, to, v), h = Math.max(0.001, cabinH(z) - 0.085 - 1.005);
        const p = sideWindowPoint(side, z, clamp(1 - u * pillarWidth / h, 0, 1));
        p[0] += side * 0.005; return p;
      }, 3, 24), paint);
    }
    for (const [z0, thickness, slope] of [[0.22, 0.055, -0.045], [1.02, 0.027, -0.10]]) {
      b.add(surface((u, v) => {
        const z = z0 + (u - 0.5) * thickness + v * slope, p = sideWindowPoint(side, z, v);
        p[0] += side * 0.004; return p;
      }, 2, 12), trim);
    }
    // Flush handles, subtle door shut-lines, and a rising lower shoulder crease.
    for (const [za, zb] of [[-0.90, 0.30], [0.33, 1.18]]) {
      const end = zb > 1 ? [side * 0.924, 0.729, zb] : [side * 0.895, 0.35, zb];
      b.add(tube([[side * 0.909, 0.895, za], [side * 0.918, 0.81, za + 0.015], [side * 0.883, za < 0 ? 0.36 : 0.39, za + 0.04], end, [side * 0.920, 0.899, zb]], 0.0028, 30, 4), seam);
    }
    for (const z of [0.08, 0.91]) {
      b.add(roundedBox(0.012, 0.039, 0.206, 0.004), seam, [side * 0.925, 0.863, z]);
      b.add(roundedBox(0.016, 0.026, 0.180, 0.004), chrome, [side * 0.925, 0.866, z]);
    }
    // Body-coloured mirrors stay inside the model's 1.85 m physical footprint.
    b.add(roundedBox(0.087, 0.025, 0.094, 0.010), trim, [side * 0.824, 1.081, -0.822], [0, side * 0.18, 0]);
    b.add(roundedBox(0.126, 0.074, 0.175, 0.022), paint, [side * 0.855, 1.098, -0.814]);
    b.add(roundedBox(0.117, 0.033, 0.166, 0.010), trim, [side * 0.855, 1.067, -0.814]);
    b.add(roundedBox(0.097, 0.046, 0.006, 0.002), chrome, [side * 0.858, 1.10, -0.724]);
  }
  b.add(surface((u, v) => {
    const z = lerp(-0.465, rearRoof + 0.018, v), p = greenhousePoint(lerp(0.015, 0.985, u), z);
    p[1] += 0.009; return p;
  }, 20, 32), paint);
  // Panoramic roof is an inset glass panel; a visible painted perimeter remains.
  b.add(surface((u, v) => {
    const z = lerp(-0.23, rearRoof - 0.12, v), p = greenhousePoint(lerp(0.15, 0.85, u), z);
    p[1] += 0.012; return p;
  }, 14, 18), glass);
  if (wagon) for (const side of [-1, 1]) {
    const rail = [[0.58, -0.27], [0.59, 0.16], [0.60, 0.77]].map(([x, z]) => {
      const p = greenhousePoint((1 + side * x / cabinW(z)) / 2, z); p[1] += 0.023; return p;
    });
    b.add(tube(rail, 0.010, 22, 5), trim);
  }
  // Hood cutline, two pressed hood creases, windscreen wipers, and rear hatch seam.
  for (const side of [-1, 1]) {
    b.add(tube([[side * 0.67, 0.832, -2.09], [side * 0.71, 0.926, -1.75], [side * 0.74, 0.950, -1.13]], 0.003, 22, 4), seam);
    b.add(tube([[side * 0.38, 0.879, -1.99], [side * 0.44, 0.949, -1.67], [side * 0.50, 0.974, -1.14]], 0.004, 20, 4), darkPaint);
    b.add(tube([[side * 0.65, 0.951, 1.61], [side * 0.70, 0.887, 1.95], [side * 0.64, 0.816, 2.20]], 0.003, 18, 4), seam);
    b.add(tube([[side * 0.04, 1.038, -1.064], [side * 0.31, 1.075, -1.034], [side * 0.62, 1.053, -1.032]], 0.008, 10, 4), trim);
  }
  b.add(tube([[-0.67, 0.971, -1.12], [0, 0.986, -1.12], [0.67, 0.971, -1.12]], 0.003, 18, 4), seam);
  const spoilerZ = rearRoof + 0.13, spoilerY = cabinH(rearRoof + 0.025) + 0.004;
  b.add(surface((u, v) => {
    const x = (u * 2 - 1) * 0.638, z0 = rearRoof + 0.025;
    const p = greenhousePoint((1 + x / cabinW(z0)) / 2, z0);
    return [x, p[1] + 0.018 - v * 0.014, z0 + v * 0.105];
  }, 24, 3), darkPaint);
  b.add(tube(Array.from({length:13}, (_, i) => {
    const x = (i / 12 * 2 - 1) * 0.638, z0 = rearRoof + 0.025;
    return [x, greenhousePoint((1 + x / cabinW(z0)) / 2, z0)[1] + 0.004, spoilerZ];
  }), 0.006, 24, 4), darkPaint);
  b.add(roundedBox(0.082, 0.047, 0.144, 0.018), paint, [0, 1.51, 0.66]);

  // Layered front fascia: body-coloured bumper, dark air intake, fine horizontal
  // grille blades and a swept LED signature at the outer corners.
  b.add(roundedBox(1.38, 0.175, 0.037, 0.012), grille, [0, 0.449, -2.215]);
  b.add(roundedBox(1.47, 0.047, 0.077, 0.015), trim, [0, 0.299, -2.206]);
  for (let row = 0; row < 4; row++) b.add(roundedBox(1.24, 0.008, 0.007, 0.002), chrome, [0, 0.397 + row * 0.029, -2.236]);
  for (const side of [-1, 1]) {
    b.add(roundedBox(0.32, 0.116, 0.043, 0.017), trim, [side * 0.602, 0.739, -2.179], [0, -side * 0.20, 0]);
    b.add(tube([[side * 0.40, 0.78, -2.193], [side * 0.56, 0.786, -2.196], [side * 0.731, 0.788, -2.150], [side * 0.778, 0.748, -2.106]], 0.015, 18, 6), head);
    for (const x of [0.53, 0.65]) b.add(roundedBox(0.067, 0.026, 0.024, 0.006), head, [side * x, 0.738, -2.212]);
    b.add(roundedBox(0.099, 0.092, 0.033, 0.009), grille, [side * 0.76, 0.491, -2.133], [0, -side * 0.22, 0]);
    b.add(tube([[side * 0.43, 0.759, 2.223], [side * 0.61, 0.766, 2.192], [side * 0.766, 0.800, 2.099], [side * 0.831, 0.807, 1.994]], 0.022, 20, 6), tail);
    b.add(tube([[side * 0.44, 0.721, 2.223], [side * 0.61, 0.727, 2.192], [side * 0.766, 0.757, 2.098]], 0.009, 18, 5), tail);
    b.add(roundedBox(0.188, 0.026, 0.023, 0.007), reflector, [side * 0.633, 0.457, 2.200]);
    b.add(roundedBox(0.210, 0.067, 0.037, 0.009), chrome, [side * 0.609, 0.341, 2.180]);
    b.add(roundedBox(0.167, 0.044, 0.039, 0.006), grille, [side * 0.609, 0.346, 2.196]);
    const signal = indicatorMats[side === -1 ? 0 : 1];
    b.add(roundedBox(0.17, 0.023, 0.016, 0.005), signal, [side * 0.60, 0.703, -2.205]);
    b.add(roundedBox(0.17, 0.023, 0.014, 0.005), signal, [side * 0.61, 0.688, 2.203]);
    b.add(roundedBox(0.047, 0.014, 0.032, 0.005), signal, [side * 0.918, 1.09, -0.849]);
  }
  // The diffuser follows the bumper surface rather than being hidden behind a
  // flat orange end-cap. Its corners wrap forward around the rear haunches.
  b.add(surface((u, v) => {
    const t = u * 2 - 1;
    return [t * 0.76, lerp(0.297, 0.501 - 0.018 * t * t, v), 2.230 - 0.075 * (1 - v) ** 2 - 0.12 * t ** 4];
  }, 28, 8), trim);
  b.add(tube([[-0.69, 0.479, 2.153], [-0.48, 0.497, 2.211], [0, 0.503, 2.233], [0.48, 0.497, 2.211], [0.69, 0.479, 2.153]], 0.005, 28, 5), chrome);
  for (const x of [-0.44, -0.22, 0, 0.22, 0.44]) b.add(roundedBox(0.015, 0.055, 0.095, 0.005), grille, [x, 0.316, 2.147]);
  b.add(tube([[-0.43, 0.766, 2.228], [0, 0.770, 2.249], [0.43, 0.766, 2.228]], 0.009, 24, 5), tail);
  b.add(roundedBox(0.30, 0.014, 0.013, 0.004), tail, [0, spoilerY - 0.003, spoilerZ + 0.004]);
  // Discreet emblem, with no invented make or logo.
  const badge = new THREE.CircleGeometry(0.025, 20); b.add(badge, chrome, [0, 0.788, -2.195], [0, Math.PI, 0]);
  const rearBadge = new THREE.CircleGeometry(0.024, 20); b.add(rearBadge, chrome, [0, 0.839, 2.176]);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: plateTexture(ego, variant), roughness: 0.52 });
  b.add(roundedBox(0.54, 0.148, 0.022, 0.009), darkPaint, [0, 0.588, 2.219]);
  for (const [z, y, rot] of [[-2.245, 0.578, Math.PI], [2.239, 0.584, 0]]) {
    b.add(roundedBox(0.429, 0.111, 0.021, 0.008), trim, [0, y, z > 0 ? z - 0.013 : z + 0.013]);
    b.add(new THREE.PlaneGeometry(0.404, 0.094), plateMat, [0, y, z], [0, rot, 0]);
  }
  const bodyMeshes = b.finish();
  // Minute projecting trim is kept inside the same nominal footprint as the
  // simulation. Steering can naturally move a front tyre beyond that outline.
  for (const mesh of bodyMeshes) {
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      p.setX(i, clamp(p.getX(i), -0.925, 0.925));
      p.setZ(i, clamp(p.getZ(i), -2.25, 2.25));
    }
    p.needsUpdate = true; mesh.geometry.computeBoundingSphere();
  }
  // Thin double-sided body surfaces remain visible in both main and close views.
  for (const m of [paint, darkPaint, glass]) m.side = THREE.DoubleSide;
  const wheels = [];
  for (const z of [-1.4, 1.4]) for (const side of [-1, 1]) {
    const wheel = buildWheel(side, trim, alloy, brakes, caliper);
    wheel.position.set(side * 0.85, 0.334, z); body.add(wheel);
    wheel.userData.front = z < 0; wheels.push(wheel);
  }
  car.userData.wheels = wheels;
  car.userData.tail = bodyMeshes.filter(m => m.material === tail);
  car.userData.tailMaterial = tail;
  car.userData.indicatorMaterials = indicatorMats;
  car.userData.lastSpeed = null;
  car.userData.lastTime = null;
  car.userData.rollDistance = 0;
  return car;
}

export function updateCarVisual(car, state, dt = 0, time = 0) {
  const d = car.userData, speed = Number.isFinite(state.speed) ? Math.max(0, state.speed) : 0;
  // Use simulation time so a paused run freezes wheel rotation as well as pose.
  const step = d.lastTime === null ? 0 : clamp(time - d.lastTime, 0, 0.1);
  if (d.lastTime !== null && time < d.lastTime) d.rollDistance = 0;
  const accel = Number.isFinite(state.accel) ? state.accel : step > 0 && d.lastSpeed !== null ? clamp((speed - d.lastSpeed) / step, -8.5, 3) : 0;
  d.rollDistance = (d.rollDistance + speed * step) % (TAU * 0.334);
  for (const wheel of d.wheels) {
    wheel.userData.roll.rotation.x = -d.rollDistance / 0.334;
    wheel.rotation.y = wheel.userData.front ? -clamp(state.steer || 0, -0.6, 0.6) : 0;
  }
  d.tailMaterial.emissiveIntensity = accel < -0.5 || (state.yielding && speed < 0.2) ? 2.7 : 0.5;
  const signalling = !!state.path;
  const flashing = Math.floor(time * 1.55) % 2 === 0;
  d.indicatorMaterials[0].emissiveIntensity = signalling && state.laneTarget === 'left' && flashing ? 3.2 : 0;
  d.indicatorMaterials[1].emissiveIntensity = signalling && state.laneTarget === 'right' && flashing ? 3.2 : 0;
  // A little load transfer reflects actual acceleration without shifting the wheels.
  const blend = 1 - Math.exp(-step * 8);
  d.chassis.rotation.x = lerp(d.chassis.rotation.x, clamp(accel * 0.0028, -0.018, 0.009), blend);
  d.chassis.rotation.z = lerp(d.chassis.rotation.z, clamp((state.curvature || 0) * speed * speed * 0.0035, -0.023, 0.023), blend);
  d.lastSpeed = speed; d.lastTime = time;
}

function torsoGeometry() {
  const profile = [[0.96, 0.147, 0.10], [1.04, 0.155, 0.104], [1.23, 0.188, 0.122], [1.35, 0.205, 0.112], [1.405, 0.156, 0.087], [1.425, 0.089, 0.068]];
  return surface((u, v) => {
    const y = lerp(0.96, 1.425, v), a = u * TAU;
    return [Math.sin(a) * atProfile(profile, y, 1), y, Math.cos(a) * atProfile(profile, y, 2)];
  }, 18, 18);
}
function limb(parent, upperLength, lowerLength, upperMat, lowerMat, handMat, isArm = false) {
  const joint = new THREE.Group(); parent.add(joint);
  const a = batchBuilder(joint), r = isArm ? 0.064 : 0.080;
  a.add(new THREE.CylinderGeometry(r, r * 0.81, upperLength, 10), upperMat, [0, -upperLength / 2, 0]);
  a.add(new THREE.SphereGeometry(r, 10, 7), upperMat, [0, 0, 0], [0, 0, 0], [1, 0.72, 1]);
  a.finish();
  const lower = new THREE.Group(); lower.position.y = -upperLength; joint.add(lower);
  const b = batchBuilder(lower);
  b.add(new THREE.SphereGeometry(r * 0.80, 10, 7), lowerMat, [0, -0.014, 0]);
  b.add(new THREE.CylinderGeometry(r * 0.79, r * 0.49, lowerLength, 10), lowerMat, [0, -lowerLength / 2, 0]);
  if (isArm) b.add(new THREE.SphereGeometry(0.041, 10, 8), handMat, [0, -lowerLength - 0.017, -0.002], [0, 0, 0], [0.85, 1.35, 0.7]);
  else {
    b.add(roundedBox(0.109, 0.079, 0.214, 0.025), handMat, [0, -lowerLength - 0.025, -0.044]);
    b.add(roundedBox(0.114, 0.021, 0.225, 0.006), material(0xb6b8ae, 0.9), [0, -lowerLength - 0.063, -0.046]);
  }
  b.finish(); joint.userData.lower = lower; return joint;
}

export function makePerson(color, variant = 0) {
  variant = Math.abs(Math.floor(Number(variant) || 0));
  const person = new THREE.Group(), torso = new THREE.Group(); person.add(torso);
  const skins = [0xc99371, 0x986f55, 0xe0b391, 0x76513e, 0xcf9b7b];
  const skin = material(skins[variant % skins.length], 0.77);
  const coat = material(color, 0.89), trouser = material([0x253239, 0x444846, 0x233748][variant % 3], 0.97);
  const shoe = material(0x252b2c, 0.8), hair = material([0x49392c, 0x292727, 0x8c7b67, 0x474643][variant % 4], 0.96);
  const detail = material(0x3c3b36, 0.83), light = material(0xc4c4b6, 0.88);
  const b = batchBuilder(torso);
  const clothing = torsoGeometry(); coat.side = THREE.DoubleSide; b.add(clothing, coat);
  b.add(new THREE.SphereGeometry(0.161, 14, 10), trouser, [0, 0.94, 0], [0, 0, 0], [1, 0.64, 0.65]);
  b.add(new THREE.CylinderGeometry(0.044, 0.052, 0.10, 10), skin, [0, 1.455, 0]);
  // Collar, jacket zip and pockets make a clothed person rather than a pawn.
  b.add(tube([[-0.078, 1.415, -0.052], [0, 1.392, -0.084], [0.078, 1.415, -0.052]], 0.009, 12, 4), detail);
  b.add(tube([[0, 1.385, -0.090], [0, 1.20, -0.125], [0, 1.016, -0.111]], 0.0035, 15, 4), light);
  for (const side of [-1, 1]) b.add(tube([[side * 0.087, 1.105, -0.1], [side * 0.137, 1.062, -0.081]], 0.003, 4, 4), detail);
  b.finish();
  const head = new THREE.Group(); head.position.y = 1.585; torso.add(head);
  const h = batchBuilder(head);
  h.add(new THREE.SphereGeometry(0.118, 16, 12), skin, [0, 0, 0], [0, 0, 0], [0.85, 1.19, 0.91]);
  h.add(new THREE.SphereGeometry(0.122, 16, 10, 0, TAU, 0, Math.PI * 0.51), hair, [0, 0.015, 0.011], [0, 0, 0], [0.87, 1.13, 0.96]);
  h.add(new THREE.SphereGeometry(0.023, 10, 8), skin, [0, 0.016, -0.104], [0, 0, 0], [0.67, 1.08, 1.0]);
  for (const side of [-1, 1]) {
    h.add(new THREE.SphereGeometry(0.023, 8, 6), skin, [side * 0.098, 0.005, 0], [0, 0, 0], [0.43, 1, 0.69]);
    h.add(new THREE.SphereGeometry(0.006, 7, 5), detail, [side * 0.037, 0.032, -0.099], [0, 0, 0], [1, 0.67, 0.6]);
  }
  h.add(tube([[-0.024, -0.038, -0.101], [0, -0.041, -0.105], [0.024, -0.038, -0.101]], 0.0025, 6, 4), detail);
  h.finish();
  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const leg = limb(person, 0.405, 0.384, trouser, trouser, shoe); leg.position.set(side * 0.09, 0.873, 0); legs.push(leg);
    const arm = limb(torso, 0.265, 0.258, coat, skin, skin, true); arm.position.set(side * 0.211, 1.347, 0);
    arm.rotation.z = side * 0.095; arms.push(arm);
  }
  person.userData.legs = legs; person.userData.arms = arms; person.userData.torso = torso; person.userData.head = head;
  person.userData.variant = variant;
  return person;
}

export function updatePersonVisual(mesh, person, time = 0) {
  const d = mesh.userData, walking = person.state === 'crossing';
  const phase = time * Math.max(0.1, person.walkSpeed || 1.2) * 5.1 + d.variant * 0.7;
  const stride = walking ? Math.sin(phase) : 0;
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? 1 : -1, leg = d.legs[i], arm = d.arms[i];
    leg.rotation.x = stride * s * 0.47;
    leg.userData.lower.rotation.x = walking ? -Math.max(0, -Math.sin(phase + s * 0.4) * s) * 0.59 : 0;
    arm.rotation.x = -stride * s * 0.38;
    arm.userData.lower.rotation.x = -0.12 - (walking ? Math.max(0, stride * s) * 0.12 : 0);
  }
  d.torso.position.y = walking ? Math.abs(Math.sin(phase)) * 0.015 : 0;
  d.torso.rotation.y = walking ? stride * 0.025 : 0;
  // The only walking animation is driven by the real crossing state.
  mesh.rotation.y = (person.kerbSide || 1) * Math.PI / 2;
}
