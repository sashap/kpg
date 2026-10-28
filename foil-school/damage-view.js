/* Temporary split equipment and a small, reusable pool of foam fragments. */
(function(root){'use strict';
function create({THREE,scene,boardRig,wing,boardParts,wingParts,sea}){
 const V=(...a)=>new THREE.Vector3(...a),debris=[],chipMat=new THREE.MeshStandardMaterial({color:0xe4ece8,roughness:.9,transparent:true});
 function split(parent,originals,axis,cut){
  const halves=[new THREE.Group(),new THREE.Group()];halves.forEach(h=>{h.visible=false;parent.add(h);});
  for(const o of originals){if(!o.isMesh)continue;o.updateMatrix();const base=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();base.applyMatrix4(o.matrix);
   for(let side=0;side<2;side++){
    const arrays={};for(const [key,a] of Object.entries(base.attributes))arrays[key]=[];
    const position=base.attributes.position;
    for(let i=0;i<position.count;i+=3){let center=0,z=0;for(let k=0;k<3;k++){center+=position.getComponent(i+k,axis)/3;z+=position.getZ(i+k)/3;}const edge=cut+(axis===0?Math.sin(z*24)*.035:0);if((center>edge?1:0)!==side)continue;
     for(const [key,a] of Object.entries(base.attributes))for(let k=0;k<3;k++)for(let n=0;n<a.itemSize;n++)arrays[key].push(a.getComponent(i+k,n));
    }
    if(!arrays.position.length)continue;const geo=new THREE.BufferGeometry();for(const [key,data] of Object.entries(arrays))geo.setAttribute(key,new THREE.Float32BufferAttribute(data,base.attributes[key].itemSize));geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,o.material);mesh.castShadow=o.castShadow;halves[side].add(mesh);
   }base.dispose();
  }
  return halves;
 }
 const sail=split(wing,wingParts,0,0),deck=split(boardRig,boardParts,2,.08);
 for(let i=0;i<12;i++){const o=new THREE.Mesh(new THREE.TetrahedronGeometry(.045+(i%3)*.018),chipMat);o.visible=false;scene.add(o);debris.push(o);}
 function update(s){
  const f=s.fallMotion,age=f?.wingAge||0,torn=!!f&&age<f.damageWingUntil,broken=!!f&&age<f.damageBoardUntil;
  for(const o of wingParts)o.visible=!torn;for(const o of boardParts)o.visible=!broken;
  for(let i=0;i<2;i++){const sign=i?1:-1;sail[i].visible=torn;sail[i].position.set(sign*.30,.07*Math.sin(age*4+i),sign*.06);sail[i].rotation.set(.09*Math.sin(age*3+i),sign*.13,sign*.18);deck[i].visible=broken;deck[i].position.set(sign*.025,i?.10:0,sign*.14);deck[i].rotation.x=i?-.17:.04;}
  for(let i=0;i<debris.length;i++){const o=debris[i];o.visible=broken;if(!broken)continue;const a=i*2.399+f.variation*6.28,t=Math.min(age,1.2),r=.3+t*(.5+i%4*.2),x=s.board.x+Math.cos(a)*r,z=s.board.z+Math.sin(a)*r;const water=sea(x,z,s.time,s.config.swell,s.config);o.position.set(x,water+.06+Math.max(0,age*1.2-age*age*1.4),z);o.rotation.set(age+i,age*.7+i,age*1.5);}
  chipMat.opacity=broken?Math.min(1,(f.damageBoardUntil-age)*1.5):0;
 }
 return {update,diagnostics:()=>({wingSplit:sail[0].visible,boardSplit:deck[0].visible,debris:debris.filter(o=>o.visible).length})};
}
root.FoilDamageView={create};
})(globalThis);
