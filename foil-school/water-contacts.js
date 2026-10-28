/* Swept contacts for solid scenery and moving water users. */
(function(root){'use strict';
function create(){
 const objects=[],bins=new Map(),dynamic=[];
 function add(o){o={id:'water-'+objects.length,kind:'obstacle',heading:0,low:-1,high:2,...o};objects.push(o);if(o.sample){dynamic.push(o);return o;}
  const r=Math.hypot(o.w,o.d)/2+2;for(let x=Math.floor((o.x-r)/24);x<=Math.floor((o.x+r)/24);x++)for(let z=Math.floor((o.z-r)/24);z<=Math.floor((o.z+r)/24);z++){const k=x+','+z;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(o);}return o;
 }
 function sweep(from,to,time,dt,waterAt,extra=[]){
  const nearby=new Set(dynamic);for(let x=Math.floor((Math.min(from.x,to.x)-2)/24);x<=Math.floor((Math.max(from.x,to.x)+2)/24);x++)for(let z=Math.floor((Math.min(from.z,to.z)-2)/24);z<=Math.floor((Math.max(from.z,to.z)+2)/24);z++)for(const o of bins.get(x+','+z)||[])nearby.add(o);
  for(const o of extra)nearby.add(o);let hit=null;
  for(const object of nearby){
   const at=t=>object.sample?{...object,...object.sample(time-dt+dt*t)}:{...object,x:object.x+(object.vx||0)*Math.max(0,Math.min(.15,time-dt+dt*t-(object.time??time))),z:object.z+(object.vz||0)*Math.max(0,Math.min(.15,time-dt+dt*t-(object.time??time)))};
   const start=at(0),end=at(1),relative=Math.hypot(to.x-from.x-(end.x-start.x),to.z-from.z-(end.z-start.z)),steps=Math.max(1,Math.ceil(relative/.18));
   for(let i=0;i<=steps;i++){const t=i/steps;if(hit&&t>=hit.t)break;const o=at(t),x=from.x+(to.x-from.x)*t,z=from.z+(to.z-from.z)*t,y=waterAt(x,z)+(from.height||0)+((to.height||0)-(from.height||0))*t,dx=x-o.x,dz=z-o.z,c=Math.cos(o.heading||0),s=Math.sin(o.heading||0);
    if(y+(to.above??1.7)<(o.low??-1)||y-(to.below??.9)>(o.high??2))continue;
    if(Math.abs(dx*c-dz*s)<o.w/2+(to.radius??.55)&&Math.abs(dx*s+dz*c)<o.d/2+(to.length??.85)){hit={...o,objectX:o.x,objectZ:o.z,t,x,z,kind:o.kind||'obstacle',impactSpeed:Math.hypot(Math.sin(to.heading)*to.speed-(o.vx||0),Math.cos(to.heading)*to.speed-(o.vz||0))};break;}
   }
  }
  return hit;
 }
 return {add,sweep,objects};
}
function collect({THREE,group,world,exclude=[]}){
 const skip=new Set(exclude),box=new THREE.Box3();group.updateMatrixWorld(true);
 group.traverse(o=>{if(!o.isMesh||skip.has(o)||o.material?.transparent||o.geometry?.type==='PlaneGeometry')return;
  o.geometry.computeBoundingBox();box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);const w=box.max.x-box.min.x,d=box.max.z-box.min.z,h=box.max.y-box.min.y,x=(box.min.x+box.max.x)/2,z=(box.min.z+box.max.z)/2;
  if(box.min.y>2||box.max.y<-.95||h<.09||w<.08||d<.08||w>65||d>65||w*d>800||world.terrainHeight(x,z)>-.12)return;
  let p=o,kind='structure';while(p){if(p.userData?.collisionKind){kind=p.userData.collisionKind;break;}p=p.parent;}
  world.waterContacts.add({x,z,w,d,low:box.min.y,high:box.max.y,kind});
 });
}
const api={create,collect};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FoilWaterContacts=api;
})(typeof globalThis!=='undefined'?globalThis:this);
