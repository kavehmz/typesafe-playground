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

// A level village corridor opens onto cultivated slopes and a wooded valley.
// These heights are presentation only; road, people and house anchors stay exact.
function hillHeight(x, z, phase) {
  const a = Math.abs(x), slope = smooth(25, 145, a), hills = smooth(90, 600, a);
  const rolling = 5 + 4.1 * Math.sin(x * .016 + z * .005 + phase) + 2.6 * Math.sin(z * .013 - x * .018);
  const ridge = 29 + 17 * Math.sin(z * .0029 + x * .005 + phase) + 13 * Math.sin(z * .0052 - x * .008);
  return -.035 + slope * rolling + hills * ridge;
}
function pondFor(z, phase) {
  const index = Math.round((z - 86) / 1040), side = index % 2 ? 1 : -1;
  const x = side * (62 + Math.sin(index * 1.9 + phase) * 3), centreZ = 86 + index * 1040;
  return { x, z: centreZ, rx: 18, rz: 26, y: hillHeight(x, centreZ, phase) - .16, phase: phase + index };
}
function pondRadius(x, z, pond) {
  const dx = (x - pond.x) / pond.rx, dz = (z - pond.z) / pond.rz;
  const angle = Math.atan2(dz, dx), wobble = 1 + .055 * Math.sin(angle * 3 + pond.phase) + .035 * Math.cos(angle * 7);
  return Math.hypot(dx, dz) / wobble;
}
function terrainHeight(x, z, phase) {
  const original = hillHeight(x, z, phase);
  if (Math.abs(x) < 34) return original;
  const pond = pondFor(z, phase), r = pondRadius(x, z, pond);
  if (r > 1.45) return original;
  const bed = pond.y - .16 - .8 * Math.max(0, 1 - r * r);
  return mix(bed, original, smooth(.91, 1.45, r));
}
function buildTerrain(from, length, material, phase) {
  const xs = [-720];
  for (let x = -700; x < -100; x += 20) xs.push(x);
  for (let x = -100; x <= -28; x += 3) xs.push(x);
  xs.push(-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25);
  for (let x = 28; x <= 100; x += 3) xs.push(x);
  for (let x = 120; x <= 720; x += 20) xs.push(x);
  const vertices = [], uvs = [], colors = [], indices = [], rows = 32;
  for (let row = 0; row <= rows; row++) for (const x of xs) {
    const z = from + row / rows * length;
    vertices.push(x, terrainHeight(x, z, phase), -z); uvs.push(x / 14, z / 14);
    const patch = Math.sin(x * .048 + Math.sin(z * .014) * 3) * Math.sin(z * .037 - x * .006);
    const field = .99 + patch * .09 + Math.sin(z * .009 + x * .025) * .055;
    // Irregular dry and freshly green meadow patches break the uniform lawn effect.
    const far = smooth(28, 90, Math.abs(x));
    const dry = smooth(-.08, .75, Math.sin(z * .019 + x * .038 + phase) * Math.cos(x * .017 - z * .006)) * far;
    const rich = smooth(.2, .9, Math.cos(z * .043 + x * .018)) * (1 - dry);
    colors.push(field * (1 + dry * .23 - rich * .09), field * (1 - dry * .04), field * (.88 + dry * .13 - rich * .08));
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < xs.length - 1; col++) {
    const a = row * xs.length + col, b = a + xs.length;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices);
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true; return mesh;
}

function cultivatedMeadow(map, phase) {
  const material = new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: .045, roughness: 1, vertexColors: true });
  material.onBeforeCompile = shader => {
    shader.uniforms.uLandPhase = { value: phase };
    shader.vertexShader = `varying vec3 vLandPosition;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLandPosition = position;');
    shader.fragmentShader = `varying vec3 vLandPosition; uniform float uLandPhase;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float landX = abs(vLandPosition.x), landZ = -vLandPosition.z;
      vec2 fieldUV = vec2((landX - 42.0 + sin(landZ * .014 + uLandPhase) * 9.0) / 96.0,
                         (landZ + sin(landX * .009 + uLandPhase) * 23.0) / 182.0);
      vec2 parcel = floor(fieldUV);
      float crop = fract(sin(dot(parcel + vec2(sign(vLandPosition.x) * 3.7, uLandPhase), vec2(127.1,311.7))) * 43758.5453);
      vec3 fieldTone = crop < .23 ? vec3(1.79,1.28,.96) : crop < .38 ? vec3(1.09,.79,.87) : crop < .72 ? vec3(.87,.99,.86) : vec3(1.20,1.13,.88);
      vec2 edge = min(fract(fieldUV), 1.0 - fract(fieldUV));
      float margin = smoothstep(.007,.035,min(edge.x,edge.y));
      float arable = smoothstep(32.0,45.0,landX) * (1.0-smoothstep(245.0,420.0,landX));
      // Fine planted rows disappear correctly in the distance instead of aliasing.
      float rowCoord = landX * (crop < .38 ? .68 : 1.12) + sin(landZ * .012) * 1.7;
      float rowAA = 1.0 - smoothstep(.25,.8,fwidth(rowCoord));
      float rows = 1.0 - .075 * rowAA * (.5 + .5 * cos(rowCoord * 6.283185));
      fieldTone *= mix(1.0,rows,crop < .72 ? 1.0 : .4);
      diffuseColor.rgb *= mix(vec3(1.0),mix(vec3(.77,.9,.83),fieldTone,margin),arable);
      float pondIndex = floor((landZ - 86.0) / 1040.0 + .5);
      float pondSide = cos(pondIndex * 3.14159265) > 0.0 ? -1.0 : 1.0;
      vec2 pondXY = vec2((vLandPosition.x - pondSide * (62.0 + sin(pondIndex * 1.9 + uLandPhase) * 3.0)) / 18.0,
                         (landZ - 86.0 - pondIndex * 1040.0) / 26.0);
      float bankAngle = atan(pondXY.y,pondXY.x);
      float bankRadius = length(pondXY) / (1.0 + .055 * sin(bankAngle * 3.0 + uLandPhase + pondIndex) + .035 * cos(bankAngle * 7.0));
      float bank = (1.0-smoothstep(1.08,1.23,bankRadius)) * smoothstep(.92,.99,bankRadius);
      diffuseColor.rgb = mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.30,.88,.95),bank*.8);
    `);
  };
  material.customProgramCacheKey = () => 'cultivated-meadow-v3';
  return material;
}

// A textured, irregular volume gives the horizon actual depth under moving light.
// Five differently scaled lobes form each crown; leaf sprays soften the closer trees.
function canopyGeometry(detail = 1) {
  const geometry = new THREE.IcosahedronGeometry(1, detail), p = geometry.attributes.position;
  const normals=[];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = 1 + .095 * Math.sin(x * 14 + y * 9) * Math.sin(z * 11 - y * 7) + .055 * Math.cos(x * 23 + z * 17);
    p.setXYZ(i,x*r,y*r,z*r);
    const length=Math.hypot(x,y,z);normals.push(x/length,y/length,z/length);
  }
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return geometry;
}
function canopyMaterial() {
  const material = new THREE.MeshStandardMaterial({ color: 0x6b7c46, roughness: .96, emissive: 0x23371c, emissiveIntensity: .07 });
  material.onBeforeCompile = shader => {
    shader.vertexShader = `varying vec3 vCrownPosition;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrownPosition = position;');
    shader.fragmentShader = `varying vec3 vCrownPosition;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float leafLight = sin(vCrownPosition.x * 33.0 + sin(vCrownPosition.y * 23.0)) * sin(vCrownPosition.z * 38.0 - vCrownPosition.y * 17.0);
      diffuseColor.rgb *= .91 + leafLight * .12 + vCrownPosition.y * .13;
    `);
  };
  material.customProgramCacheKey = () => 'volumetric-woodland-v3'; return material;
}

function waterMaterial(clock, anisotropy) {
  const [c,ctx] = canvas(256), pixels = ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
    const i=(y*256+x)*4, a=Math.sin(x/256*TAU*7+y/256*TAU*3), b=Math.cos(y/256*TAU*9-x/256*TAU*2);
    pixels.data[i]=128+a*23; pixels.data[i+1]=128+b*17; pixels.data[i+2]=251; pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);const normal=texture(c,anisotropy,true);normal.colorSpace=THREE.NoColorSpace;normal.repeat.set(6,8);
  const material=new THREE.MeshPhysicalMaterial({color:0x506d65,metalness:.32,roughness:.19,normalMap:normal,normalScale:new THREE.Vector2(.34,.34),clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.1});
  material.onBeforeCompile=shader=>{
    shader.uniforms.uWaterTime=clock;
    shader.fragmentShader=`uniform float uWaterTime;\n${shader.fragmentShader}`;
    shader.fragmentShader=shader.fragmentShader.replace('texture2D( normalMap, vNormalMapUv )','texture2D( normalMap, vNormalMapUv + vec2(uWaterTime * .006, uWaterTime * .002))');
  };
  material.customProgramCacheKey=()=> 'quiet-pond-v3';return material;
}
function pondSurface(pond, material) {
  const vertices=[pond.x,pond.y,-pond.z],uv=[.5,.5],indices=[],n=96;
  for(let i=0;i<=n;i++){
    const a=i/n*TAU, r=1+.055*Math.sin(a*3+pond.phase)+.035*Math.cos(a*7);
    vertices.push(pond.x+Math.cos(a)*pond.rx*r,pond.y,-pond.z-Math.sin(a)*pond.rz*r);
    uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);
    if(i<n)indices.push(0,i+1,i+2);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;return mesh;
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
  const meadow = cultivatedMeadow(groundMap, phase);
  const bark = [
    new THREE.MeshStandardMaterial({ map: barkTexture(anisotropy), color: 0xa99b82, roughness: 1 }),
    new THREE.MeshStandardMaterial({ map: barkTexture(anisotropy, true), roughness: .96 }),
    null
  ];
  bark[2] = bark[0];
  const leaves = [foliageTexture(anisotropy, 0), foliageTexture(anisotropy, 1), pineTexture(anisotropy)].map(map => windMaterial(map, clock, .055, { emissive: 0x283b12, emissiveIntensity: .11 }));
  const grassMaterial = windMaterial(grassTexture(anisotropy), clock, .09, { alphaTest: .4 });
  const crownMaterial = canopyMaterial(), crownGeometry = canopyGeometry(), roughCrownGeometry = canopyGeometry(0);
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x8d8c79, roughness: .98, vertexColors: true });
  const rockGeometry = new THREE.IcosahedronGeometry(1, 1), stoneColors = [], rockPositions = rockGeometry.attributes.position;
  for(let i=0;i<rockPositions.count;i++){
    const x=rockPositions.getX(i),y=rockPositions.getY(i),z=rockPositions.getZ(i);
    const noise=Math.sin(x*19.7+z*14.2+y*8.1),moss=smooth(.1,.85,y)*.24;
    rockPositions.setXYZ(i,x*(1+noise*.1),y*(1+Math.sin(z*11)*.12),z*(1+noise*.1));
    stoneColors.push(.91+noise*.055-moss*.5,.92+noise*.05-moss*.14,.9+noise*.05-moss*.7);
  }
  rockGeometry.setAttribute('color',new THREE.Float32BufferAttribute(stoneColors,3));rockGeometry.computeVertexNormals();
  const pondMaterial=waterMaterial(clock,anisotropy);
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
    const garden = Math.abs(h.x - x) < 6.3 * h.scale + 1 && Math.abs(h.z - z) < 6.3 * h.scale + 1;
    const path = Math.sign(x) === Math.sign(h.x) && Math.abs(x) < Math.abs(h.x) && Math.abs(h.z - z) < 1.35 * h.scale + .7;
    return garden || path;
  });
  const first = -2, last = Math.ceil((world.length + 240) / CHUNK_LENGTH);
  for (let ci = first; ci < last; ci++) {
    const from = ci * CHUNK_LENGTH, centre = from + CHUNK_LENGTH / 2;
    const chunk = new THREE.Group(); chunk.name = `Countryside ${ci}`; group.add(chunk);
    const terrain = buildTerrain(from, CHUNK_LENGTH, meadow, phase); chunk.add(terrain);
    const trunkGroup = new THREE.Group(), near = new THREE.Group(), far = new THREE.Group(), grasses = new THREE.Group(), woods = new THREE.Group(), woodlandNear = new THREE.Group(), woodlandFar = new THREE.Group(), fieldDetail = new THREE.Group();
    woods.add(woodlandNear,woodlandFar); chunk.add(trunkGroup, near, far, grasses, woods, fieldDetail);
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
    const rng = random(seedOf(`${worldSeed}:meadow:${ci}`)), grass = [], undergrowth = [], forestCrowns = [], forestTrunks = [], forestSprays = [[],[]], hedgeSprays = [], stones = [];
    for (let i = 0; i < 1980; i++) {
      const side = i % 2 ? -1 : 1, z = from + rng() * CHUNK_LENGTH;
      const nearRoad = i < 1660;
      let x = side * (nearRoad ? 6.65 + Math.pow(rng(), 2.15) * 8.4 : 27 + rng() * 25);
      if (obstructed(x, z) || crossings.some(c => Math.abs(c.z - z) < 4.5 && Math.abs(x) < 9)) continue;
      if (pondRadius(x,z,pondFor(z,phase)) < 1.08) continue;
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
    // Field-edge hawthorn hedges meander with the cultivated parcel boundary.
    // Their gaps are deliberate farm accesses, with no decoration in the road corridor.
    for(const side of [-1,1])for(let z=from;z<from+CHUNK_LENGTH;z+=1.75){
      if(Math.sin(z*.022+side+phase)>.63||Math.abs((z+45)%182)<8)continue;
      const x=side*(42-Math.sin(z*.014+phase)*9);
      if(pondRadius(x,z,pondFor(z,phase))<1.48)continue;
      const base=terrainHeight(x,z,phase), height=.92+rng()*.52, tint=new THREE.Color().setHSL(.21+rng()*.025,.17,.62+rng()*.18);
      for(let j=0;j<24;j++)hedgeSprays.push({x:x+(rng()-.5)*1.35,y:base+.28+rng()*height*.5,z:-z+(rng()-.5)*1.75,sx:1.4,sy:1.35,rx:(rng()-.5)*2.2,ry:rng()*TAU,tint:0xd5d9bc});
    }
    // Occasional cross-field boundaries make the landscape feel worked over time.
    const boundaryIndex=Math.ceil(from/182);
    if(boundaryIndex*182<from+CHUNK_LENGTH&&boundaryIndex%3!==0)for(const side of [-1,1]){
      for(let ax=43;ax<174;ax+=2.4){
        const z=boundaryIndex*182-Math.sin(ax*.009+phase)*23;
        if(z<from-25||z>from+CHUNK_LENGTH+25||Math.abs(ax-87)<5)continue;
        const x=side*ax;if(pondRadius(x,z,pondFor(z,phase))<1.5)continue;
        const h=.85+rng()*.45;
        const y=terrainHeight(x,z,phase);
        for(let j=0;j<20;j++)hedgeSprays.push({x:x+(rng()-.5)*2.0,y:y+.3+rng()*h*.5,z:-z+(rng()-.5)*1.2,sx:1.5,sy:1.35,rx:(rng()-.5)*2.1,ry:rng()*TAU,tint:0xc5cbb0});
      }
    }
    instanceBatch(fieldDetail,cardGeometry,leaves[0],hedgeSprays,{shadows:true});

    // Orchards sit in sheltered meadow pockets; crooked trunks and uneven crowns
    // keep the rows recognisably planted without looking like repeated symbols.
    if((ci+2)%4===0){
      const side=ci%8===0?-1:1, orchardTrunks=[],orchardLeaves=[];
      for(let row=0;row<3;row++)for(let col=0;col<4;col++){
        const x=side*(48+row*7.7+(rng()-.5)),z=from+30+col*14+(rng()-.5)*1.4;
        if(pondRadius(x,z,pondFor(z,phase))<1.48)continue;
        const base=terrainHeight(x,z,phase),h=3.1+rng()*.8;
        orchardTrunks.push(cylinderSegment(new THREE.Vector3(x,base,-z),new THREE.Vector3(x+.19,base+h*.76,-z+.13),.16));
        for(let limb=0;limb<4;limb++){
          const a=limb/4*TAU+.3;orchardTrunks.push(cylinderSegment(new THREE.Vector3(x,base+h*.42,-z),new THREE.Vector3(x+Math.cos(a)*1.3,base+h*.83,-z+Math.sin(a)*1.3),.074));
        }
        for(let j=0;j<140;j++){
          const a=rng()*TAU,r=Math.sqrt(rng())*1.7,y=.9+rng()*1.65;
          orchardLeaves.push({x:x+Math.cos(a)*r,y:base+h*.45+y,z:-z+Math.sin(a)*r,sx:1.18,sy:1.06,rx:(rng()-.5)*2.8,ry:rng()*TAU,rz:(rng()-.5)*1.6,tint:new THREE.Color().setHSL(.2,.09,.83+rng()*.12)});
        }
      }
      instanceBatch(fieldDetail,branchGeometry,bark[0],orchardTrunks,{shadows:true});instanceBatch(fieldDetail,cardGeometry,leaves[0],orchardLeaves,{shadows:true});
    }

    // Groves now have lit, three-dimensional crowns rather than crossed silhouette cards.
    for (let i = 0; i < 196; i++) {
      const cluster=Math.floor(i/7),groveRng=random(seedOf(`${worldSeed}:grove:${ci}:${cluster}`));
      const side = cluster % 2 ? -1 : 1;
      const centreZ=from+groveRng()*CHUNK_LENGTH,centreX=side*(112+Math.pow(groveRng(),.8)*500);
      const x=centreX+(rng()-.5)*32,z=centreZ+(rng()-.5)*31;
      const grove = Math.sin(z * .013 + x * .009 + phase) + Math.cos(z * .026 - x * .011);
      if (grove < -.12 || (Math.abs(x) < 180 && grove < .8)) continue;
      const evergreen=rng()<.22,h=7.5+rng()*7.5,w=h*(evergreen?.22:.32),base=terrainHeight(x,z,phase);
      const shade=new THREE.Color().setHSL(evergreen?.28:.22+rng()*.025,.13+rng()*.07,.68+rng()*.24);
      forestTrunks.push(cylinderSegment(new THREE.Vector3(x,base,-z),new THREE.Vector3(x,base+h*.82,-z),.22+rng()*.15));
      for(let lobe=0;lobe<6;lobe++){
        const a=lobe*2.39996,f=lobe/5,spread=evergreen?(1-f)*w*.45:w*.49;
        const rx=evergreen?w*(1-f*.77):w*(.53+rng()*.25),ry=evergreen?h*.16:h*(.18+rng()*.06);
        const cx=x+Math.cos(a)*spread,cz=-z+Math.sin(a)*spread,cy=base+h*(evergreen?.35+f*.57:.63)+Math.sin(a*1.7)*h*.13;
        if(!evergreen)forestCrowns.push({x:cx,y:cy,z:cz,sx:rx*.5,sy:ry*.5,sz:rx*(.86+rng()*.23)*.5,ry:a,tint:shade});
        for(let spray=0;spray<22;spray++){
          const sa=rng()*TAU,sr=.56+rng()*.42;
          forestSprays[evergreen?1:0].push({x:cx+Math.cos(sa)*rx*sr,y:cy+(rng()-.4)*ry*1.7,z:cz+Math.sin(sa)*rx*sr,sx:rx*1.24,sy:ry*1.44,rx:rng()*TAU,ry:rng()*TAU,tint:0xc9d1b9});
        }
      }
    }
    instanceBatch(woodlandNear,crownGeometry,crownMaterial,forestCrowns,{shadows:false});
    instanceBatch(woodlandFar,roughCrownGeometry,crownMaterial,forestCrowns.map(c=>({...c,sx:c.sx*1.1,sy:c.sy*1.1,sz:c.sz*1.1})),{shadows:false,receiveShadow:false});
    instanceBatch(woods,branchGeometry,bark[0],forestTrunks,{shadows:false});
    instanceBatch(woodlandNear,cardGeometry,leaves[0],forestSprays[0],{shadows:false});
    instanceBatch(woodlandNear,cardGeometry,leaves[2],forestSprays[1],{shadows:false});
    for(let s=0;s<2;s++)instanceBatch(woodlandFar,cardGeometry,leaves[s?2:0],forestSprays[s].filter((_,i)=>i%4===0).map(p=>({...p,sx:p.sx*1.3,sy:p.sy*1.3})),{shadows:false,receiveShadow:false});

    for(let i=0;i<12;i++){
      const side=i%2?-1:1,x=side*(34+rng()*78),z=from+rng()*CHUNK_LENGTH;
      if(Math.sin(z*.017+x*.023)<.2||pondRadius(x,z,pondFor(z,phase))<1.2)continue;
      const size=.16+Math.pow(rng(),2)*.7;
      stones.push({x,y:terrainHeight(x,z,phase)+size*.18,z:-z,sx:size*1.4,sy:size*.62,sz:size,ry:rng()*TAU,rx:(rng()-.5)*.4,tint:0xffffff});
    }
    const pond=pondFor(centre,phase);
    if(pond.z>=from&&pond.z<from+CHUNK_LENGTH){
      fieldDetail.add(pondSurface(pond,pondMaterial));
      const reeds=[];
      for(let i=0;i<340;i++){
        const a=rng()*TAU;if(Math.cos(a)>.7&&rng()>.23)continue;
        const r=1+.055*Math.sin(a*3+pond.phase)+.035*Math.cos(a*7),rim=.96+rng()*.16;
        const x=pond.x+Math.cos(a)*pond.rx*r*rim,z=pond.z+Math.sin(a)*pond.rz*r*rim,h=.65+rng()*.68;
        reeds.push({x,y:terrainHeight(x,z,phase)+h*.45,z:-z,sx:h*.7,sy:h,ry:rng()*TAU,tint:0xb8bb8e});
        if(i%4===0)stones.push({x:x+(rng()-.5)*2,y:terrainHeight(x,z,phase)+.02,z:-z,sx:.3+rng()*.65,sy:.15+rng()*.25,sz:.3+rng()*.6,ry:rng()*TAU,tint:0xbec0aa});
      }
      instanceBatch(fieldDetail,grassGeometry,grassMaterial,reeds,{shadows:true});
    }
    instanceBatch(fieldDetail,rockGeometry,rockMaterial,stones,{shadows:true});
    chunks.push({ centre, chunk, terrain, trunkGroup, near, far, grasses, woods, woodlandNear, woodlandFar, fieldDetail });
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
      item.woodlandNear.visible = distance < 380;
      item.woodlandFar.visible = distance >= 380;
      item.fieldDetail.visible = distance < 480;
    }
  };
  group.userData.update(0, 0);
  return group;
}
