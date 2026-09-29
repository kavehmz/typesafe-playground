// Presentation only. World positions, sensing, physics and model decisions remain in sim/.
// Simulation forward +z maps to Three.js -z; the car's nose points toward local -z.
import * as THREE from '/vendor/three.module.js';
import { CAMERAS, BLIND_ZONE } from '/sim/sensors.mjs';
import { evalPath } from '/sim/dynamics.mjs';
import { makeCar, makePerson, updateCarVisual, updatePersonVisual } from '/public/vehicles.mjs';
import { buildLandscape } from '/public/landscape.mjs';
import { buildRoadside } from '/public/roadside.mjs';
import { Atmosphere, CameraFinish, LIGHTING } from '/public/atmosphere.mjs';

const CAR_COLORS = [0x456979,0x8d3328,0xe3e0d9,0x293137,0x48594e,0x7a7e88];
const PEOPLE_COLORS = [0xb4543c,0x52718c,0x67724c,0xbe954a,0x8c7384,0x343d47];
const EGO_COLOR=0xc55429, PAGE_COLOR=0xf4f3ed;
const SENSOR_COLORS={front:0x6bbea3,left:0x84c3d3,right:0x84c3d3,rear:0xb3a1cf,radar:0xb3a1cf,blind:0xefa94e};
const toThree=(x,z,y=0)=>new THREE.Vector3(x,y,-z);
function disposeTree(group){
  const geometries=new Set(),materials=new Set(),textures=new Set(),instances=[];
  group.traverse(o=>{if(o.isInstancedMesh)instances.push(o);if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  for(const o of instances)o.dispose();for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();group.clear();
}
function finishMarker(length){
  const group=new THREE.Group(),canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
  const ctx=canvas.getContext('2d');
  for(let x=0;x<16;x++)for(let y=0;y<4;y++){ctx.fillStyle=(x+y)%2?'#303735':'#e5e3d9';ctx.fillRect(x*16,y*16,16,16);}
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const paint=new THREE.MeshStandardMaterial({map,roughness:.88});
  const line=new THREE.Mesh(new THREE.PlaneGeometry(7.8,1.6),paint);line.rotation.x=-Math.PI/2;line.position.set(0,.024,-length);line.receiveShadow=true;group.add(line);
  const metal=new THREE.MeshStandardMaterial({color:0x4a5352,metalness:.6,roughness:.45});
  for(const x of [-4.9,4.9]){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.55,10),metal);pole.position.set(x,.775,-length);pole.castShadow=true;group.add(pole);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(.64,.3),new THREE.MeshStandardMaterial({map,roughness:.9,side:THREE.DoubleSide}));flag.position.set(x+.30,1.36,-length);group.add(flag);
  }
  return group;
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
  constructor(canvas){
    this.canvas=canvas;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.8));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.autoClear=false;this.renderer.info.autoReset=false;
    this.scene=new THREE.Scene();
    this.atmosphere=new Atmosphere(this.renderer,this.scene);
    this.cameraFinish=new CameraFinish(this.renderer);
    this.camera=new THREE.PerspectiveCamera(48,1,.15,1800);
    this.camTarget=new THREE.Vector3();this.camPos=new THREE.Vector3();
    this.worldGroup=new THREE.Group();this.scene.add(this.worldGroup);
    this.ego=makeCar(EGO_COLOR,true);this.scene.add(this.ego);
    this.overlayGroup=new THREE.Group();this.ego.add(this.overlayGroup);
    this.feedCams={};
    for(const [name,cam]of Object.entries(CAMERAS)){
      const c=new THREE.PerspectiveCamera(60,16/9,.3,1600);
      c.position.set(cam.dx,name==='front'?1.15:1.0,-cam.dz);c.rotation.y=-cam.yaw;c.userData.hfov=Math.min(cam.fov,120);
      this.ego.add(c);this.feedCams[name]=c;
      const wedge=fovWedge(cam,SENSOR_COLORS[name]);wedge.children[0].material.opacity=.055;this.overlayGroup.add(wedge);
    }
    this.blindZones={};
    for(const side of ['left','right']){
      const len=BLIND_ZONE.behind+BLIND_ZONE.ahead;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(3.3,len),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.05,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
      m.rotation.x=-Math.PI/2;m.position.set(side==='left'?-3.5:3.5,.04,-(BLIND_ZONE.ahead-len/2));
      this.overlayGroup.add(m);this.blindZones[side]=m;
    }
    this.pathLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xf0bb6e,transparent:true,opacity:.9}));this.scene.add(this.pathLine);
    this.stopMarker=new THREE.Mesh(new THREE.BoxGeometry(3.6,.035,.25),new THREE.MeshBasicMaterial({color:0xd2674a,transparent:true,opacity:.8}));this.stopMarker.visible=false;this.scene.add(this.stopMarker);
    this.outlinePool=[];this.carMeshes=new Map();this.personMeshes=new Map();
    this.reflectionTarget=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType});
    this.reflectionCamera=new THREE.CubeCamera(.4,800,this.reflectionTarget);
    this.lastReflection=-Infinity;this.reflectionPending=true;
    this.view='chase';this.overlays=true;this.lighting='afternoon';this.resize();
  }
  setLighting(mode){
    if(!LIGHTING[mode])return;
    this.lighting=mode;this.atmosphere.setMode(mode);this.reflectionPending=true;
  }
  resize(){
    const w=window.innerWidth,h=window.innerHeight;this.renderer.setSize(w,h,false);
    const rect=document.getElementById('worldView')?.getBoundingClientRect();this.camera.aspect=rect?.width&&rect.height?rect.width/rect.height:w/h;this.camera.updateProjectionMatrix();
  }
  buildWorld(world){
    disposeTree(this.worldGroup);this.carMeshes.clear();this.personMeshes.clear();
    const anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
    this.landscape=buildLandscape(world,{anisotropy});this.roadside=buildRoadside(world,{anisotropy});this.worldGroup.add(this.landscape,this.roadside,finishMarker(world.length));
    for(const car of world.cars){const m=makeCar(CAR_COLORS[car.color%CAR_COLORS.length],false,car.color%3);this.worldGroup.add(m);this.carMeshes.set(car.id,m);}
    for(const p of world.pedestrians){const m=makePerson(PEOPLE_COLORS[p.color%PEOPLE_COLORS.length],p.color);this.worldGroup.add(m);this.personMeshes.set(p.id,m);}
    this.first=true;this.reflectionPending=true;this.lastReflection=-Infinity;
  }
  outline(index,w,l,x,z,color){
    let o=this.outlinePool[index];if(!o){o=edgesBox(1,1,1,0xffffff);this.scene.add(o);this.outlinePool[index]=o;}
    o.scale.set(w+.15,1.62,l+.15);o.position.set(x,.81,-z);o.material.color.setHex(color);o.material.opacity=.7;o.visible=true;
  }
  update(sim,dt){
    const e=sim.ego,w=sim.world;this.simTime=sim.time;this.egoState=e;
    this.ego.position.set(e.x,0,-e.z);this.ego.rotation.y=-e.heading;updateCarVisual(this.ego,e,dt,sim.time);
    for(const car of w.cars){const m=this.carMeshes.get(car.id);if(!m)continue;m.position.set(car.x,0,-car.z);m.rotation.y=-car.heading;m.visible=Math.abs(car.z-e.z)<700;updateCarVisual(m,car,dt,sim.time);}
    for(const p of w.pedestrians){const m=this.personMeshes.get(p.id);if(!m)continue;m.position.set(p.x,0,-p.z);m.rotation.y=p.kerbSide===1?Math.PI/2:-Math.PI/2;m.visible=Math.abs(p.z-e.z)<450;updatePersonVisual(m,p,sim.time);}
    this.landscape?.userData.update?.(e.z,sim.time);this.roadside?.userData.update?.(e.z,sim.time);
    this.atmosphere.update(e,sim.time);
    const s=Math.sin(e.heading),c=Math.cos(e.heading);let want,look;
    if(this.view==='aerial'){want=toThree(e.x+18,e.z-26,38);look=toThree(e.x,e.z+20,0);}
    else if(this.view==='driver'){want=toThree(e.x-.36*c-.2*s,e.z+.15,1.22);look=toThree(e.x+s*45,e.z+c*45,1.17);}
    else{want=toThree(e.x-s*10.5+c*2.9,e.z-c*10.5-s*2.9,3.7);look=toThree(e.x+s*7,e.z+c*7,1.0);}
    const fov=this.view==='driver'?66:this.view==='aerial'?51:48;
    if(this.camera.fov!==fov){this.camera.fov=fov;this.camera.updateProjectionMatrix();}
    const k=this.first||this.view==='driver'?1:1-Math.exp(-dt*3.3);this.first=false;this.camPos.lerp(want,k);this.camTarget.lerp(look,k);this.camera.position.copy(this.camPos);this.camera.lookAt(this.camTarget);
    this.overlayGroup.visible=this.overlays;
    const sensed=sim.refreshPerception();for(const o of this.outlinePool)o.visible=false;
    if(this.overlays){
      let i=0;const seen=new Map();for(const[name,cam]of Object.entries(sensed.cameras))for(const d of cam.detections)if(!seen.has(d.id))seen.set(d.id,SENSOR_COLORS[name]);
      for(const lane of ['left','right'])for(const r of [sensed.radar.front[lane],sensed.radar.rear[lane]])if(r&&!seen.has(r.id))seen.set(r.id,SENSOR_COLORS.radar);
      for(const[id,color]of seen){const b=sensed.bodies.find(b=>b.id===id);if(b)this.outline(i++,b.width,b.length,b.x,b.z,color);}
      for(const side of ['left','right']){const z=sensed.blind_spots[side];this.blindZones[side].material.color.setHex(z.occupied?SENSOR_COLORS.blind:0xffffff);this.blindZones[side].material.opacity=z.occupied?.36:(z.covers_lane==='off road'?.01:.035);}
    }
    if(e.path){const pts=[];for(let s=Math.max(0,e.z-e.path.startZ);s<=e.path.L;s+=e.path.L/36){const p=evalPath(e.path,s);pts.push(toThree(p.x,e.path.startZ+s,.055));}pts.push(toThree(e.path.targetX,e.path.startZ+e.path.L+6,.055));this.pathLine.geometry.setFromPoints(pts);this.pathLine.visible=this.overlays;}else this.pathLine.visible=false;
    const ctx=sim.controllerContext();if(e.maneuver==='stop'&&ctx.stopLineDistance!==null){this.stopMarker.visible=true;this.stopMarker.position.set(1.75,.04,-(e.z+e.length/2+ctx.stopLineDistance));}else this.stopMarker.visible=false;
  }
  captureReflections(){
    if(!this.egoState||(!this.reflectionPending&&this.simTime-this.lastReflection<8))return;
    const r=this.renderer;
    const temporary=[this.ego,this.pathLine,this.stopMarker,...this.outlinePool];const visibility=temporary.map(x=>x.visible);temporary.forEach(x=>x.visible=false);
    this.reflectionCamera.position.set(this.egoState.x,1.8,-this.egoState.z);
    const before=r.getRenderTarget(),autoClear=r.autoClear;r.setScissorTest(false);r.shadowMap.needsUpdate=false;
    try{
      // CubeCamera renders six faces; each needs fresh colour AND depth.
      r.autoClear=true;this.reflectionCamera.update(r,this.scene);r.autoClear=autoClear;
      const env=this.atmosphere.pmrem.fromCubemap(this.reflectionTarget.texture);
      this.scene.environment=env.texture;this.reflectionEnvironment?.dispose();this.reflectionEnvironment=env;
    }finally{
      temporary.forEach((x,i)=>x.visible=visibility[i]);r.setRenderTarget(before);r.autoClear=autoClear;
    }
    this.lastReflection=this.simTime;this.reflectionPending=false;
  }
  render(feedRects){
    const r=this.renderer,W=window.innerWidth,H=window.innerHeight;r.info.reset();
    this.captureReflections();
    r.setRenderTarget(null);r.setScissorTest(false);r.setViewport(0,0,W,H);r.setClearColor(PAGE_COLOR,1);r.clear();
    const rect=document.getElementById('worldView')?.getBoundingClientRect()||{left:0,top:0,right:W,bottom:H,width:W,height:H};
    const viewport=rect=>{const left=Math.max(0,rect.left),right=Math.min(W,rect.right),top=Math.max(0,rect.top),bottom=Math.min(H,rect.bottom);if(right<=left||bottom<=top||rect.width<2||rect.height<2)return false;r.setViewport(rect.left,H-rect.bottom,rect.width,rect.height);r.setScissor(left,H-bottom,right-left,bottom-top);return true;};
    this.ego.userData.bodyGroup.visible=this.view!=='driver';r.shadowMap.needsUpdate=true;
    if(rect.width>2&&rect.height>2&&rect.bottom>0&&rect.top<H){const a=rect.width/rect.height;if(this.camera.aspect!==a){this.camera.aspect=a;this.camera.updateProjectionMatrix();}this.cameraFinish.render(this.scene,this.camera,rect,this.lighting);}
    r.setScissorTest(true);const overlaysWere=this.overlayGroup.visible;this.overlayGroup.visible=false;this.ego.userData.bodyGroup.visible=false;
    for(const[name,rect]of Object.entries(feedRects)){const cam=this.feedCams[name];if(!cam||rect.width<10||!viewport(rect))continue;cam.aspect=rect.width/rect.height;cam.fov=2*Math.atan(Math.tan(cam.userData.hfov*Math.PI/360)/cam.aspect)*180/Math.PI;cam.updateProjectionMatrix();r.clear();r.render(this.scene,cam);}
    this.overlayGroup.visible=overlaysWere;this.ego.userData.bodyGroup.visible=true;r.setScissorTest(false);
    // Lightweight presentation diagnostics used in visual QA; no driving state exposed.
    if(!this.statsAt||performance.now()-this.statsAt>1000){this.canvas.dataset.drawCalls=r.info.render.calls;this.canvas.dataset.triangles=r.info.render.triangles;this.canvas.dataset.geometries=r.info.memory.geometries;this.canvas.dataset.textures=r.info.memory.textures;this.statsAt=performance.now();}
  }
}
