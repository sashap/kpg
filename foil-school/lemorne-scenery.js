/* Le Morne: mapped resort footprints, casuarina coast, coconut palms,
   reef lagoon and beach access. Small props are representative game scenery.
   Reference photographs and map provenance are recorded in README. */
(function(root){'use strict';
function build(c){
 const {THREE,scene,scenery,mesh,box,ell,rod,g,group,polygon,path,marker,actors,frame,hipRoof,sign,groundPatch,windsock}=c;
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),inside=FoilLocations.inside,dist=FoilLocations.distance;
 let seed=72491;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const center=p=>p.slice(0,-1).reduce((a,b)=>[a[0]+b[0]/(p.length-1),a[1]+b[1]/(p.length-1)],[0,0]);
 const stats={casuarinas:0,palms:0,forestTrees:0,buildings:0,pools:0,beachBoats:0,reefPolygons:g.leMorne.reefs.length};
 const coastClock={value:0};
 const foliageGeo=new THREE.IcosahedronGeometry(1,1),p=foliageGeo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),s=.90+.10*Math.sin(x*17+y*9+z*13);p.setXYZ(i,x*s,y*s,z*s);}foliageGeo.computeVertexNormals();
 const leaves=[0x3c5940,0x486746,0x5c734b,0x35513c].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
 const palms=[0x536e3d,0x617941,0x456036].map(color=>new THREE.MeshStandardMaterial({color,roughness:.93,side:THREE.DoubleSide}));
 // Tiny world-anchored crown movement, shared across all instanced foliage.
 for(const mat of [...leaves,...palms])mat.onBeforeCompile=shader=>{shader.uniforms.uCoastTime=coastClock;shader.vertexShader='uniform float uCoastTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
vec4 treeP=vec4(position,1.);
#ifdef USE_INSTANCING
treeP=instanceMatrix*treeP;
#endif
treeP=modelMatrix*treeP;
transformed.x+=sin(uCoastTime*.65+treeP.x*.09+treeP.z*.07)*.025*max(0.,position.y+.4);
`);};
 const distantCrown=new THREE.IcosahedronGeometry(1,0);
 const trunkGeo=new THREE.CylinderGeometry(.62,1,1,7);
 function branch(a,b,r,color=0x817961){const d=b.clone().sub(a),m=mesh(scenery,trunkGeo,color,...a.clone().add(b).multiplyScalar(.5).toArray(),r,d.length(),r);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());}
 const beach=g.features.ground.filter(f=>f.kind==='beach'),wood=g.features.ground.filter(f=>['wood','forest','scrub'].includes(f.kind));
 const beachAccess=[g.project([-20.46475,57.31760]),g.project([-20.46499,57.31803]),g.project([-20.46527,57.31827])];
 function clear(x,z,r=1){const y=g.terrainHeight(x,z);return y>.3&&dist(x,z,beachAccess)>6+r&&g.signedShore(x,z)>7&&!g.blocked(x,z,r,y)&&!beach.some(b=>inside(x,z,b.points))&&!g.features.paths.some(b=>dist(x,z,b.points)<3+r)&&!g.features.roads.some(b=>dist(x,z,b.points)<4+r)&&!g.features.parking.some(b=>inside(x,z,b.points));}
 function tree(x,z,h,type='coast'){
  if(!clear(x,z,type==='coast'?1:.4))return false;const y=g.terrainHeight(x,z),slope=Math.hypot(g.terrainHeight(x+3,z)-y,g.terrainHeight(x,z+3)-y)/3;if(slope>1.2)return false;
  const forest=type==='forest',close=Math.hypot(x,z)<700,lean=(rnd()-.5)*h*.13,top=V(x+lean,y+h*.78,z),base=V(x,y,z);
  branch(base,top,h*.019);const count=forest?5:8;
  for(let i=0;i<count;i++){const a=i*2.399+rnd()*.5,t=i/(count-1),spread=h*(forest?.13:.16)*(1-t*.45),bx=x+lean+Math.cos(a)*spread,bz=z+Math.sin(a)*spread,by=y+h*(.43+t*.50),w=h*(forest?.22:.23)*(1-t*.42);if(!forest&&close&&i<5)branch(V(x,y+h*.35,z),V(bx,by,bz),h*.009);const crown=mesh(scenery,close?foliageGeo:distantCrown,leaves[(i+Math.floor(x))&3],bx,by,bz,w,h*(forest?.23:.26),w*(.83+rnd()*.25));crown.rotation.y=a;}
  if(Math.hypot(x,z)<1050)g.addSolid({kind:'casuarina',y,height:h*.55,points:Array.from({length:9},(_,i)=>[x+Math.cos(i*Math.PI/4)*h*.023,z+Math.sin(i*Math.PI/4)*h*.023])});
  stats[forest?'forestTrees':'casuarinas']++;return true;
 }
 // Feather-shaped leaflets make the palms readable from both beach and water.
 const frond=new THREE.BufferGeometry(),fp=[];
 // A narrow connected blade under the leaflets prevents distant fronds from
 // breaking into isolated pixels and keeps the crown attached to its stem.
 for(let i=0;i<20;i++){const t=i/20,u=(i+1)/20,y=t=>Math.sin(t*Math.PI)*.70-t*t*1.20,w=t=>.035+Math.sin(t*Math.PI)*.17;fp.push(-w(t),y(t),t*5.1,w(t),y(t),t*5.1,-w(u),y(u),u*5.1,w(t),y(t),t*5.1,w(u),y(u),u*5.1,-w(u),y(u),u*5.1);}
 for(let i=1;i<=20;i++){const t=i/21,z=t*5.1,y=Math.sin(t*Math.PI)*.70-t*t*1.20,w=Math.sin(t*Math.PI)*.88;
  for(const side of [-1,1])fp.push(0,y,z-.10,side*w,y-.09,z+.28,0,y+.025,z+.10,0,y+.025,z+.10,side*w,y-.09,z+.28,side*w*.88,y-.12,z+.40);
 }
 frond.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));frond.computeVertexNormals();
 function palm(x,z,h=13){if(!clear(x,z,.6))return false;const y=g.terrainHeight(x,z),a=rnd()*6.28,lean=1+rnd()*1.6;
  for(let i=0;i<6;i++){const t=i/6,u=(i+1)/6;branch(V(x+Math.cos(a)*lean*t*t,y+h*t,z+Math.sin(a)*lean*t*t),V(x+Math.cos(a)*lean*u*u,y+h*u,z+Math.sin(a)*lean*u*u),.26-.08*t,i%2?0x8d8671:0x9c947d);}
  const q=new THREE.Group();q.position.set(x+Math.cos(a)*lean,y+h,z+Math.sin(a)*lean);scenery.add(q);
  for(let i=0;i<12;i++){const f=mesh(q,frond,palms[i%3],0,0,0,.78+rnd()*.25,.9,1);f.rotation.y=i*2.399;f.rotation.x=-.35+(i%4)*.20;}
  for(let i=0;i<4;i++)ell(q,0x8a8952,Math.sin(i*1.7)*.3,-.25,Math.cos(i*1.7)*.3,.15,.19,.16);
  g.addSolid({kind:'palm',y,height:h,points:Array.from({length:9},(_,i)=>[x+Math.cos(i*Math.PI/4)*.31,z+Math.sin(i*Math.PI/4)*.31])});stats.palms++;return true;
 }
 // White, low modern RIU wings follow their real (often L-shaped) footprints.
 // Older resort villas have hipped roofs; no hotel-site boundary is extruded.
 const glass=new THREE.MeshStandardMaterial({color:0x506b6e,roughness:.88}),roofMat=new THREE.MeshStandardMaterial({color:0x82765e,roughness:1,side:THREE.DoubleSide});
 for(const b of g.features.buildings){const [x,z]=center(b.points),y=Math.max(.2,g.terrainHeight(x,z)),h=b.height||6.4,modern=b.modern;
  polygon(b.points,h,modern?0xe0dfd1:0xd4cdb5,y);polygon(b.points,0,modern?0xd4d5cb:0x817763,y+h+.035);stats.buildings++;
  if(Math.hypot(x,z)>2900)continue;
  if(!modern&&b.points.length<=10){const f=frame(b);f.p.position.set(x,y,z);hipRoof(f.p,0,0,f.w+.9,f.d+.9,h,Math.min(3.8,f.w*.28),roofMat);}
  if(modern){const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);for(let sx=Math.min(...xs)+3;sx<Math.max(...xs)-3;sx+=5.2)for(let sz=Math.min(...zs)+3;sz<Math.max(...zs)-3;sz+=4.2){if(!inside(sx,sz,b.points)||dist(sx,sz,b.points)<2.7)continue;const panel=box(scenery,0x46626b,sx,y+h+.45,sz,3.7,.08,2.0);panel.rotation.x=-.20;}}
  for(let i=1;i<b.points.length;i++){const a=b.points[i-1],c=b.points[i],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz);if(len<4)continue;const angle=Math.atan2(-dz,dx),tx=dx/len,tz=dz/len;let nx=-tz,nz=tx;if(inside((a[0]+c[0])/2+nx,(a[1]+c[1])/2+nz,b.points)){nx=-nx;nz=-nz;}
   const floors=modern?Math.max(1,Math.round(h/3.2)):Math.min(2,Math.round(h/3.2)),n=Math.floor(len/(modern?4.5:6));
   for(let floor=0;floor<floors;floor++){const yy=y+floor*h/floors,slab=modern?box(scenery,0xede9da,(a[0]+c[0])/2+nx*.65,yy+.15,(a[1]+c[1])/2+nz*.65,len,.23,1.5):null;if(slab)slab.rotation.y=angle;
    for(let k=0;k<n;k++){const t=(k+.5)/n,wx=a[0]+dx*t,wz=a[1]+dz*t,m=box(scenery,glass,wx+nx*.08,yy+1.55,wz+nz*.08,modern?2.8:1.7,2.1,.16);m.rotation.y=angle;if(modern){const rail=box(scenery,0xb5c2bd,wx+nx*1.35,yy+.9,wz+nz*1.35,3.5,.7,.09);rail.rotation.y=angle;const divider=box(scenery,0xe6e2d3,wx-tx*1.85+nx*.65,yy+1.45,wz-tz*1.85+nz*.65,.14,2.6,1.55);divider.rotation.y=angle;}}
   }
  }
 }
 // Resort pools are opaque calm blue surfaces, slightly below their coping.
 for(const b of g.features.pools){const [x,z]=center(b.points);if(Math.hypot(x,z)>2200)continue;const y=g.terrainHeight(x,z);polygon(b.points,.08,0x499baf,y+.11);path(b.points,.5,0xd6d3bb,y+.22);stats.pools++;}
 // Plant from the mapped woodlands: dense tapered casuarinas near the coast,
 // lower evergreen crowns on the mountain, retaining the exposed steep cliffs.
 for(const f of wood){const xs=f.points.map(p=>p[0]),zs=f.points.map(p=>p[1]),x0=Math.min(...xs),z0=Math.min(...zs),w=Math.max(...xs)-x0,d=Math.max(...zs)-z0;
  const n=Math.min(1300,Math.ceil(w*d/850));for(let i=0;i<n;i++){const x=x0+rnd()*w,z=z0+rnd()*d;if(Math.hypot(x,z)>3350||!inside(x,z,f.points))continue;const y=g.terrainHeight(x,z);tree(x,z,y>70?4.5+rnd()*5.5:10+rnd()*9,y>70?'forest':'coast');}
 }
 // Denser coastal silhouettes behind the open sandy launch and resort strip.
 for(let i=1;i<g.coast.length;i++){const a=g.coast[i-1],b=g.coast[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<1)continue;
  for(let t=0;t<len;t+=17){let x=a[0]+dx*t/len,z=a[1]+dz*t/len;if(Math.hypot(x,z)>2300)continue;let nx=-dz/len,nz=dx/len;if(g.signedShore(x+nx*10,z+nz*10)<0){nx=-nx;nz=-nz;}const inland=22+rnd()*26;tree(x+nx*inland,z+nz*inland,11+rnd()*8);const lat=g.site.origin[0]+z/111320;if(lat< -20.4635&&rnd()<.72)palm(x+nx*(15+rnd()*12),z+nz*(15+rnd()*12),11+rnd()*7);}
 }
 // Landscaped palms within RIU's gardens, behind the high-water sand strip.
 for(let i=0;i<145;i++){const lat=-20.4676+rnd()*.0019,lon=57.3105+rnd()*.0065,[x,z]=g.project([lat,lon]);palm(x,z,11+rnd()*6);}
 // Sandy trail-head / public parking: mapped boundaries, no asphalt stripes
 // on unpaved lots. Small vehicles give the low shoreline a human scale.
 const vehicleColors=[0xe1ded2,0x71949c,0xa7a9a0,0x887c6c];
 function van(x,z,angle,color=0xdedccf){const y=g.terrainHeight(x,z),p=new THREE.Group();p.position.set(x,y,z);p.rotation.y=angle;scenery.add(p);box(p,color,0,.75,0,1.9,1.25,4.6);box(p,color,0,1.65,-.3,1.85,.65,3.4);box(p,glass,0,1.64,1.39,1.65,.5,.08);for(const side of [-1,1]){box(p,glass,side*.95,1.63,-.1,.06,.48,2.4);for(const zz of [-1.45,1.45]){const wheel=mesh(p,new THREE.CylinderGeometry(.34,.34,.18,12),0x303831,side*.94,.35,zz);wheel.rotation.z=Math.PI/2;}}g.addSolid({kind:'beach-van',y,height:2,points:[[-1,-2.4],[1,-2.4],[1,2.4],[-1,2.4],[-1,-2.4]].map(([u,v])=>[x+Math.cos(angle)*u+Math.sin(angle)*v,z-Math.sin(angle)*u+Math.cos(angle)*v])});}
 for(const lot of g.features.parking){groundPatch(lot.points,0xb5b09b);const [cx,cz]=center(lot.points);for(let i=0;i<10;i++){const x=cx+(rnd()-.5)*45,z=cz+(rnd()-.5)*30;if(inside(x,z,lot.points)&&dist(x,z,lot.points)>5&&!g.blocked(x,z,3))van(x,z,1.6,vehicleColors[i%4]);}}
 for(const [lat,lon] of [[-20.46446,57.31778],[-20.46456,57.31762]]){const [x,z]=g.project([lat,lon]);if(clear(x,z,2))van(x,z,-.6);}
 // A small representative beach shelter and gear racks leave the entry open.
 const school=group(-20.46474,57.31786);school.rotation.y=-.4;
 for(const x of [-3,3])for(const z of [-2,2]){rod(school,0x8a7858,[x,0,z],[x,2.8,z],.065);school.updateWorldMatrix(true,false);const p=school.localToWorld(V(x,0,z));g.addSolid({kind:'beach-shelter-post',y:p.y,height:2.8,points:Array.from({length:9},(_,i)=>[p.x+Math.cos(i*Math.PI/4)*.075,p.z+Math.sin(i*Math.PI/4)*.075])});}
 hipRoof(school,0,0,6.6,4.7,2.8,.75,roofMat);sign(school,'KITE LAGOON',0,2.25,2.06,3.9,.43);
 const boardGeo=new THREE.SphereGeometry(1,10,6);
 for(let i=0;i<5;i++){const b=mesh(school,boardGeo,[0xdab158,0xd9e2d6,0x47919d,0xc77056,0x6c8d9a][i],-2+i*.75,1.08,-1.5,.24,1.03,.06);b.rotation.z=.16;rod(school,0x4d6260,[-2+i*.75,.35,-1.45],[-2+i*.75,.35,-.62],.025);}
 path([g.project([-20.46445,57.31766]),g.project([-20.46476,57.31773]),g.project([-20.46496,57.31796])],2.8,0xc7bda2);
 windsock(-20.46469,57.31800);windsock(-20.46609,57.30945);
 // Local pirogue silhouette: pointed bow, high stern, open interior and a
 // low outboard. Moored craft remain clear of the main teaching reach.
 const hullGeo=new THREE.BufferGeometry(),hp=[],hi=[];
 for(let j=0;j<=20;j++){const t=j/20,z=(t-.5)*5.4,w=.66*Math.pow(Math.sin(t*Math.PI),.55)+.025,lift=Math.pow(Math.abs(t*2-1),3)*.28;for(const [side,up] of [[-1,1],[-.65,0],[.65,0],[1,1]])hp.push(w*side,.04+up*.5+lift,z);if(j<20)for(let k=0;k<3;k++){const a=j*4+k;hi.push(a,a+4,a+1,a+1,a+4,a+5);}}
 hullGeo.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));hullGeo.setIndex(hi);hullGeo.computeVertexNormals();const hullMat=new THREE.MeshStandardMaterial({color:0xdcd7bc,roughness:.8,side:THREE.DoubleSide});
 for(const [i,loc] of [[0,[-20.46386,57.32010]],[1,[-20.46435,57.31925]],[2,[-20.4659,57.3079]]]){const [x,z]=g.project(loc);if(g.terrainHeight(x,z)>-.7)continue;const boat=new THREE.Group();boat.position.set(x,.05,z);boat.rotation.y=-2.1+i*.32;scene.add(boat);mesh(boat,hullGeo,hullMat);for(const zz of [-1.4,0,1.4])box(boat,0x647f86,0,.44,zz,.95,.08,.26);box(boat,0x435957,0,.43,-2.35,.28,.62,.32);for(const side of [-1,1])rod(boat,0x5f8c9a,[side*.63,.55,-1.2],[side*.63,.55,1.2],.045);actors.push(s=>{boat.position.y=FoilCore.sea(x,z,s.time,s.config.swell,s.config)*.6+.06;boat.rotation.z=Math.sin(s.time*.8+i)*.018;boat.rotation.x=Math.cos(s.time*.7+i)*.012;});g.addSolid({kind:'moored-pirogue',y:-.4,height:1.1,points:[[-.8,-2.8],[.8,-2.8],[.8,2.8],[-.8,2.8],[-.8,-2.8]].map(([u,v])=>[x+Math.cos(boat.rotation.y)*u+Math.sin(boat.rotation.y)*v,z-Math.sin(boat.rotation.y)*u+Math.cos(boat.rotation.y)*v])});stats.beachBoats++;}
 // Reference buoys are illustrative training aids, not real channel marks.
 for(const [lat,lon] of [[-20.469,57.3214],[-20.4662,57.3215],[-20.4707,57.3169]]){const [x,z]=g.project([lat,lon]);const buoy=new THREE.Group();buoy.position.set(x,0,z);scenery.add(buoy);mesh(buoy,new THREE.CylinderGeometry(.11,.28,.6,10),0xe0b247,0,.18,0);rod(buoy,0x878d80,[0,.4,0],[0,1.45,0],.023);ell(buoy,0xdaaf45,0,1.42,0,.15,.15,.15);g.addSolid({kind:'lagoon-buoy',y:-.4,height:1.9,points:Array.from({length:13},(_,i)=>[x+Math.cos(i*Math.PI/6)*.3,z+Math.sin(i*Math.PI/6)*.3])});}
 for(const r of g.raw.references)marker(r.name,r.short,...r.point,r.height);
 actors.push(s=>{coastClock.value=s.time;});
 return stats;
}
root.FoilLeMorneScenery={build};
})(globalThis);
