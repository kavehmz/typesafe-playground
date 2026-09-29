// Render-only light, atmospheric sky and final camera treatment. No simulation inputs are changed.
import * as THREE from '/vendor/three.module.js';

export const LIGHTING = {
  afternoon: { name: 'Late afternoon', zenith: 0x4d87ba, horizon: 0xbcd2db, haze: 0xd1d4c5, ground: 0x485c35, sun: 0xffe0b0, sunPower: 3.2, hemi: 1.12, exposure: 1.04, sunPosition: [-0.65, 0.55, 0.38], warmth: 0.025 },
  morning: { name: 'Clear morning', zenith: 0x3f83c0, horizon: 0xb2cfdf, haze: 0xc6d8dd, ground: 0x485b3e, sun: 0xfff2db, sunPower: 3.15, hemi: 1.35, exposure: 1.0, sunPosition: [0.5, 0.82, -0.3], warmth: 0.0 },
  golden: { name: 'Golden hour', zenith: 0x759cbd, horizon: 0xe6ccac, haze: 0xd8c5a2, ground: 0x565437, sun: 0xffc27c, sunPower: 3.3, hemi: 0.9, exposure: 1.12, sunPosition: [-0.36, 0.23, -0.91], warmth: 0.055 }
};

export class Atmosphere {
  constructor(renderer, scene) {
    this.renderer = renderer; this.scene = scene;
    this.sun = new THREE.DirectionalLight(); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    Object.assign(this.sun.shadow.camera, { left: -68, right: 68, top: 68, bottom: -68, near: 1, far: 320 });
    this.sun.shadow.bias = -0.00014; this.sun.shadow.normalBias = 0.018; this.sun.shadow.radius = 2;
    scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(); scene.add(this.hemi);
    scene.fog = new THREE.Fog(0xd1d4c5, 200, 1000);
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { zenith: {value:new THREE.Color()}, horizon: {value:new THREE.Color()}, ground: {value:new THREE.Color()}, sunColor:{value:new THREE.Color()}, sunDirection:{value:new THREE.Vector3()}, time:{value:0} },
      vertexShader: `varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}`,
      fragmentShader: `
        varying vec3 vDirection;
        uniform vec3 zenith,horizon,ground,sunColor,sunDirection;uniform float time;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        float fbm(vec2 p){float v=0.0,a=.55;mat2 m=mat2(.8,-.6,.6,.8);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p*2.04+2.7;a*=.5;}return v;}
        void main(){
          vec3 d=normalize(vDirection);float elevation=max(d.y,0.0);
          vec3 color=mix(horizon,zenith,pow(elevation,.48));
          float sunDot=max(dot(d,sunDirection),0.0);
          color+=sunColor*(pow(sunDot,18.0)*.16+pow(sunDot,260.0)*.26+pow(sunDot,12000.0)*18.0);
          if(d.y>0.005){
            vec2 p=d.xz/(d.y+.16)*1.8+vec2(time*.002,0.0);
            vec2 warp=vec2(fbm(p*.43+5.0),fbm(p*.43+17.0))*.65;
            float n=fbm(p+warp);float detail=fbm(p*3.1+19.0);
            float clouds=smoothstep(.52,.74,n*.84+detail*.16)*smoothstep(.0,.13,d.y);
            // Offset density provides a sun-facing rim and a shaded cloud body.
            float litDensity=fbm(p+warp+sunDirection.xz*.24);
            float rim=clamp((n-litDensity)*4.6+.48,.12,1.0);
            vec3 cloudColor=mix(horizon*.74,vec3(1.7,1.67,1.59),rim);
            cloudColor=mix(cloudColor,sunColor*1.58,pow(sunDot,5.0)*.5);
            color=mix(color,cloudColor,clouds*.94);
            float cirrus=smoothstep(.73,.9,fbm(p*vec2(.55,6.0)+vec2(11.,time*.001)))*.15;
            color=mix(color,vec3(1.2),cirrus*elevation);
          }
          color=mix(ground*.8,color,smoothstep(-.15,.025,d.y));
          gl_FragColor=vec4(color,1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1800,32,16),this.skyMaterial);this.sky.frustumCulled=false;this.sky.renderOrder=-100;scene.add(this.sky);
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.mode = null; this.setMode('afternoon');
  }
  setMode(mode) {
    if(!LIGHTING[mode]||this.mode===mode)return;
    this.mode=mode;const p=LIGHTING[mode];this.parameters=p;
    this.direction=new THREE.Vector3(...p.sunPosition).normalize();
    const u=this.skyMaterial.uniforms;
    u.zenith.value.setHex(p.zenith);u.horizon.value.setHex(p.horizon);u.ground.value.setHex(p.ground);u.sunColor.value.setHex(p.sun);u.sunDirection.value.copy(this.direction);
    this.sun.color.setHex(p.sun);this.sun.intensity=p.sunPower;
    this.hemi.color.setHex(p.horizon);this.hemi.groundColor.setHex(p.ground);this.hemi.intensity=p.hemi;
    this.scene.fog.color.setHex(p.haze);this.renderer.toneMappingExposure=p.exposure;
    // The same sky lights the bodywork and glass. Generate only when the light changes.
    const environmentScene=new THREE.Scene();
    const sphere=new THREE.Mesh(new THREE.SphereGeometry(10,32,16),this.skyMaterial);environmentScene.add(sphere);
    this.environment?.dispose();this.environment=this.pmrem.fromScene(environmentScene,.035,.1,30);
    this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.72;
    sphere.geometry.dispose();this.sun.shadow.needsUpdate=true;
  }
  update(ego,time) {
    this.sky.position.set(ego.x,0,-ego.z);
    this.skyMaterial.uniforms.time.value=time;
    this.sun.target.position.set(ego.x,0,-ego.z-24);
    this.sun.position.copy(this.sun.target.position).addScaledVector(this.direction,135);
    this.sun.target.updateMatrixWorld();
  }
}

export class CameraFinish {
  constructor(renderer) {
    this.renderer=renderer;
    this.target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4,depthBuffer:true});
    this.target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
    this.target.texture.generateMipmaps=false;
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:true,uniforms:{
      colorMap:{value:this.target.texture},depthMap:{value:this.target.depthTexture},resolution:{value:new THREE.Vector2(1,1)},inverseProjection:{value:new THREE.Matrix4()},projectionScale:{value:1},warmth:{value:.025}
    },vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
    fragmentShader:`
      varying vec2 vUv;uniform sampler2D colorMap,depthMap;uniform vec2 resolution;uniform mat4 inverseProjection;uniform float projectionScale,warmth;
      vec3 viewPosition(vec2 uv,float depth){vec4 p=inverseProjection*vec4(uv*2.0-1.0,depth*2.0-1.0,1.0);return p.xyz/p.w;}
      vec3 positionAt(vec2 uv){vec2 pixel=(floor(uv*resolution)+.5)/resolution;return viewPosition(pixel,texture2D(depthMap,pixel).r);}
      void main(){
        vec3 color=texture2D(colorMap,vUv).rgb;float depth=texture2D(depthMap,vUv).r;
        if(depth<.99997){
          // Use source-depth texels, not screen derivatives: the finish pass
          // may run at a higher pixel density than the scene render target.
          vec2 texel=1.0/resolution;
          vec3 p=positionAt(vUv),left=p-positionAt(vUv-vec2(texel.x,0.0)),right=positionAt(vUv+vec2(texel.x,0.0))-p;
          vec3 down=p-positionAt(vUv-vec2(0.0,texel.y)),up=positionAt(vUv+vec2(0.0,texel.y))-p;
          vec3 dx=abs(left.z)<abs(right.z)?left:right,dy=abs(down.z)<abs(up.z)?down:up;
          vec3 normal=normalize(cross(dx,dy));if(dot(normal,-p)<0.0)normal=-normal;
          float radius=.7;float pixelRadius=clamp(radius*projectionScale/max(-p.z,.1),2.0,38.0);
          float occlusion=0.;
          for(int i=0;i<10;i++){
            float fi=float(i)+.5;float angle=fi*2.399963;float ring=sqrt(fi/10.0);
            vec2 uv=clamp(vUv+vec2(cos(angle),sin(angle))*pixelRadius*ring/resolution,vec2(.001),vec2(.999));
            float d=texture2D(depthMap,uv).r;vec3 q=positionAt(uv);vec3 delta=q-p;float dist=length(delta);
            occlusion+=max(dot(normal,delta/max(dist,.001))-.13,0.0)*(1.0-smoothstep(.03,radius*1.6,dist))*step(d,.99997);
          }
          color*=1.0-clamp(occlusion*.22,0.0,.32);
        }
        vec2 vignette=vUv*(1.0-vUv);float edge=pow(clamp(vignette.x*vignette.y*16.0,0.0,1.0),.16);
        color*=mix(.88,1.0,edge);
        color*=vec3(1.0+warmth,.999,1.0-warmth*.8);
        // Only exceptional highlights bloom; road detail and foliage stay crisp.
        vec3 glow=vec3(0.0);
        for(int i=0;i<4;i++){
          float a=float(i)*1.570796+.785398;vec2 offset=vec2(cos(a),sin(a))*3.0/resolution;
          vec3 sampleColor=texture2D(colorMap,vUv+offset).rgb;
          float luma=dot(sampleColor,vec3(.2126,.7152,.0722));
          glow+=sampleColor*max(luma-1.8,0.0)/max(luma,.01);
        }
        color+=glow*.025;
        gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material));
  }
  setSize(width,height) {
    // Native-density at laptop scale; cap supersampling to preserve real decision cadence.
    const dpr=Math.min(this.renderer.getPixelRatio(),1.6);
    const w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));
    if(this.target.width!==w||this.target.height!==h){this.target.setSize(w,h);this.material.uniforms.resolution.value.set(w,h);}
  }
  render(scene,camera,rect,mode) {
    const r=this.renderer;this.setSize(rect.width,rect.height);
    this.material.uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
    this.material.uniforms.projectionScale.value=this.target.height*camera.projectionMatrix.elements[5]*.5;
    this.material.uniforms.warmth.value=LIGHTING[mode]?.warmth||0;
    // Binding the target installs its physical-pixel viewport. setViewport()
    // would multiply those dimensions by the renderer pixel ratio a second time.
    r.setScissorTest(false);r.setRenderTarget(this.target);r.clear();r.render(scene,camera);
    r.setRenderTarget(null);r.setScissorTest(true);
    const W=window.innerWidth,H=window.innerHeight;
    r.setViewport(rect.left,H-rect.bottom,rect.width,rect.height);
    const left=Math.max(0,rect.left),right=Math.min(W,rect.right),top=Math.max(0,rect.top),bottom=Math.min(H,rect.bottom);
    r.setScissor(left,H-bottom,Math.max(0,right-left),Math.max(0,bottom-top));
    r.render(this.scene,this.camera);
  }
}
