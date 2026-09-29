// Presentation cameras only. They read the world and never change a simulation object.
import * as THREE from '/vendor/three.module.js';
const clamp=THREE.MathUtils.clamp;
const point=(x,z,y)=>new THREE.Vector3(x,y,-z);
export class CameraDirector {
  constructor(element,camera,entities){
    this.element=element;this.camera=camera;this.entities=entities;
    this.mode='chase';this.orbit={yaw:.48,pitch:.24,radius:7.5};this.focus=null;this.selectionVersion=0;
    this.pointers=new Map();this.raycaster=new THREE.Raycaster();this.ndc=new THREE.Vector2();
    this.shot='drive';this.shotAt=-Infinity;
    element.addEventListener('pointerdown',e=>{
      if(this.mode!=='explore'||e.target.closest('button,select,input,label')||(e.pointerType==='mouse'&&e.button!==0))return;
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      this.dragOrigin={x:e.clientX,y:e.clientY};this.dragDistance=0;
      if(this.pointers.size===2){const [a,b]=[...this.pointers.values()];this.pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),radius:this.orbit.radius};}
      element.setPointerCapture(e.pointerId);element.classList.add('dragging');
    });
    element.addEventListener('pointermove',e=>{
      const last=this.pointers.get(e.pointerId);if(!last)return;
      const dx=e.clientX-last.x,dy=e.clientY-last.y;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      this.dragDistance+=Math.hypot(dx,dy);
      if(this.pointers.size===2&&this.pinch){const[a,b]=[...this.pointers.values()];this.orbit.radius=clamp(this.pinch.radius*this.pinch.distance/Math.max(5,Math.hypot(a.x-b.x,a.y-b.y)),2.7,30);}
      else{this.orbit.yaw-=dx*.008;this.orbit.pitch=clamp(this.orbit.pitch+dy*.006,.035,1.24);}
    });
    const end=e=>{
      if(!this.pointers.has(e.pointerId))return;
      if(e.type==='pointerup'&&this.dragDistance<5&&this.pointers.size===1&&!this.pinch)this.pick(e.clientX,e.clientY);
      this.pointers.delete(e.pointerId);if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);
      if(!this.pointers.size){this.pinch=null;element.classList.remove('dragging');}
    };
    element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);
    element.addEventListener('wheel',e=>{if(this.mode!=='explore'||e.target.closest('button,select,input,label'))return;e.preventDefault();this.orbit.radius=clamp(this.orbit.radius*Math.exp(e.deltaY*.001),2.7,30);},{passive:false});
    document.getElementById('followEgoBtn')?.addEventListener('click',()=>this.resetFocus());
    document.getElementById('subjectSel')?.addEventListener('change',event=>{
      const item=this.entities().find(x=>x.userData.entityId===event.target.value);
      if(!item||item.userData.entityId==='ego')this.resetFocus();else this.select(item);
    });
  }
  resetFocus(){this.selectionVersion++;this.focus=null;this.orbit={yaw:.48,pitch:.24,radius:7.5};const select=document.getElementById('subjectSel');if(select)select.value='ego';}
  reset(){
    this.resetFocus();this.shot='drive';this.shotAt=-Infinity;
    const select=document.getElementById('subjectSel');if(select){
      select.replaceChildren();
      for(const item of this.entities()){
        const option=document.createElement('option');option.value=item.userData.entityId;
        option.textContent=item.userData.entityId==='ego'?'Jev':item.userData.entityKind==='person'?item.userData.displayName:`${item.userData.entityId.replace('car-','Car ')} · ${item.userData.displayName}`;
        select.append(option);
      }
    }
  }
  select(target){
    this.selectionVersion++;this.focus=target;const human=target.userData.entityKind==='person';
    this.orbit={yaw:human?target.rotation.y+Math.PI:target.rotation.y+.45,pitch:human?.13:.22,radius:human?3.2:6.8};
    const select=document.getElementById('subjectSel');if(select)select.value=target.userData.entityId;
  }
  pick(x,y){
    const rect=this.element.getBoundingClientRect();this.ndc.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);this.raycaster.setFromCamera(this.ndc,this.camera);
    const roots=this.entities().filter(x=>x.visible);
    for(const hit of this.raycaster.intersectObjects(roots,true)){
      if(hit.object.material?.transparent)continue;
      let target=hit.object;while(target&&!roots.includes(target))target=target.parent;
      if(!target)continue;
      this.select(target);break;
    }
  }
  update(mode,sim,egoMesh){
    this.mode=mode;this.element.classList.toggle('explore',mode==='explore');
    const subjects=document.getElementById('subjectControl');if(subjects)subjects.hidden=mode!=='explore';
    const hint=document.getElementById('cameraHint'),follow=document.getElementById('followEgoBtn');
    if(hint){hint.hidden=mode!=='explore';hint.textContent=this.focus?`${this.focus.userData.displayName||'Selected subject'} · drag to orbit · scroll to zoom`:'Drag to orbit · scroll to zoom · select a car or person';}
    if(follow)follow.hidden=mode!=='explore'||!this.focus||this.focus===egoMesh;
    const e=sim.ego,s=Math.sin(e.heading),c=Math.cos(e.heading);
    let want,look,fov=48,shadowAnchor=e;
    if(mode==='explore'){
      const target=this.focus||egoMesh,human=target.userData.entityKind==='person';
      const centre=target.position.clone();centre.y+=human?1.02:.86;
      const {yaw,pitch,radius}=this.orbit;
      want=centre.clone().add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*radius,Math.sin(pitch)*radius,Math.cos(yaw)*Math.cos(pitch)*radius));look=centre;fov=43;
      shadowAnchor={x:centre.x,z:-centre.z};
    }else if(mode==='cinematic'){
      const crossing=sim.world.crossings.find(x=>x.z>e.z-7&&x.z-e.z<65);
      const candidate=crossing&&['stop','creep'].includes(e.maneuver)?'crossing':['overtake','return_right','abort_overtake'].includes(e.maneuver)?'pass':'drive';
      if(sim.time<this.shotAt||candidate!==this.shot&&(sim.time-this.shotAt>2.5||candidate==='crossing')){this.shot=candidate;this.shotAt=sim.time;}
      if(this.shot==='crossing'&&crossing){
        const people=sim.world.pedestrians.filter(p=>p.crossingId===crossing.id&&p.state!=='done');
        const cx=people.length?clamp(people.reduce((a,p)=>a+p.x,0)/people.length,-2,2):0;
        const side=crossing.kerbSide||1;
        want=point(-side*8.5,crossing.z-8,2.35);look=point(cx,crossing.z-.5,1.04);fov=47;
        shadowAnchor={x:e.x,z:Math.min(crossing.z,e.z+30)};
      }else if(this.shot==='pass'){
        want=point(e.x-s*7.2+c*4.0,e.z-c*7.2-s*4.0,2.65);look=point(e.x+s*3,e.z+c*3,1.05);fov=50;
      }else{
        want=point(e.x-s*9.2+c*2.6,e.z-c*9.2-s*2.6,2.9);look=point(e.x+s*8,e.z+c*8,1.04);fov=50;
      }
    }else if(mode==='aerial'){want=point(e.x+18,e.z-26,38);look=point(e.x,e.z+20,0);fov=51;}
    else if(mode==='driver'){want=point(e.x-.36*c-.2*s,e.z+.15,1.22);look=point(e.x+s*45,e.z+c*45,1.17);fov=66;}
    else{want=point(e.x-s*10.5+c*2.9,e.z-c*10.5-s*2.9,3.7);look=point(e.x+s*7,e.z+c*7,1.0);}
    return {want,look,fov,shadowAnchor};
  }
}
