/* Photo-guided site architecture, mapped planting and shore furniture.
   Reference photos inform procedural geometry; no remote photographs are bundled. */
(function(root){
'use strict';
function build(c){
 const {THREE,scene,scenery,mesh,box,ell,rod,g,group,polygon,path,marker,actors}=c,{site,features,project}=g,V=(x,y,z)=>new THREE.Vector3(x,y,z),inside=FoilLocations.inside;
 let seed=78641;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},center=pts=>pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length],[0,0]);
 function texture(draw){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;draw(canvas.getContext('2d'));const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
 const roofMat=new THREE.MeshStandardMaterial({color:0xb3a391,roughness:.98,map:texture(x=>{x.fillStyle='#736959';x.fillRect(0,0,256,256);for(let y=0;y<256;y+=8)for(let a=0;a<256;a+=24){x.fillStyle=['#6e6253','#807565','#8a7e6a','#776959'][Math.floor(rnd()*4)];x.fillRect(a+(y%16?12:0),y,23,7);}})});
 const glass=new THREE.MeshStandardMaterial({color:0x526b70,metalness:0,roughness:1});
 const foliage=new THREE.BufferGeometry(),fp=[],fn=[];
 for(let i=0;i<100;i++){const a=rnd()*Math.PI*2,u=rnd()*2-1,r=Math.cbrt(rnd()),s=Math.sqrt(1-u*u),p=V(Math.cos(a)*s*r,u*r,Math.sin(a)*s*r),n=V(rnd()-.5,.35+rnd(),rnd()-.5).normalize(),t=V().crossVectors(n,V(0,0,1)).normalize().multiplyScalar(.09+rnd()*.08),b=V().crossVectors(n,t).normalize().multiplyScalar(.10+rnd()*.1);for(const [x,y] of [[-1,0],[0,1],[1,0],[-1,0],[1,0],[0,-1]]){fp.push(...p.clone().addScaledVector(t,x).addScaledVector(b,y).toArray());fn.push(...n.toArray());}}
 foliage.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));foliage.setAttribute('normal',new THREE.Float32BufferAttribute(fn,3));
 const crownCore=new THREE.IcosahedronGeometry(1,1);const cp=crownCore.attributes.position;for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),k=.95+.065*Math.sin(x*11+y*7+z*13);cp.setXYZ(i,x*k,y*k,z*k);}crownCore.computeVertexNormals();
 const leafMats=[0x4c6245,0x667654,0x354d3d].map(color=>new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:1}));
 const trunkGeo=new THREE.CylinderGeometry(.52,1,1,9),branchGeo=new THREE.CylinderGeometry(.35,1,1,8);
 function branch(a,b,r,color,geo=branchGeo){const d=b.clone().sub(a),m=mesh(scenery,geo,color,...a.clone().add(b).multiplyScalar(.5).toArray(),r,d.length(),r);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());}
 function plant(x,z,h=9,type='pine',island=false){
  if(g.promenade?.nearest(x,z)?.distance<4.8||g.promenade?.rampAt(x,z))return;
  const y=g.terrainHeight(x,z);if(y<.15||g.blocked(x,z,1)||g.ramps.some(p=>Math.hypot(x-p[0],z-p[1])<9)||!island&&features.parking.some(p=>inside(x,z,p.points))||features.paths.some(p=>FoilLocations.distance(x,z,p.points)<2.6))return;
  const poplar=type==='poplar',eucalyptus=type==='eucalyptus',bark=eucalyptus?0xa4a08a:0x77705b,lean=(rnd()-.5)*h*.11;
  const fork=V(x+lean,y+h*(eucalyptus?.53:.36),z+h*.025);
  branch(V(x,y,z),fork,h*(poplar?.020:.027),bark,trunkGeo);
  const radius=h*(poplar?.020:.027);g.addSolid({kind:'tree',y,height:h*.55,points:Array.from({length:13},(_,i)=>[x+Math.cos(i*Math.PI/6)*radius,z+Math.sin(i*Math.PI/6)*radius])});
  // Interlocking solid crowns give the silhouette its mass. Fine leaf cards
  // only soften eucalyptus edges; they never substitute for a full canopy.
  const count=poplar?5:7;
  for(let i=0;i<count;i++){
   const a=i*2.399+seed*.001,spread=poplar?h*.025:i===6?0:h*(.13+.07*rnd()),bx=x+lean+Math.cos(a)*spread,bz=z+Math.sin(a)*spread,by=y+h*(poplar?.38+i*.115:i===6?.87:.57+(i%3)*.105);
   branch(fork,V(bx,by,bz),h*(poplar?.009:.012),bark);
   const sx=h*(poplar?.12:.22+rnd()*.075),sy=h*(poplar?.25:.21+rnd()*.06),sz=sx*(.85+rnd()*.22);
   // Reuse a small material palette so trees remain batchable on touch devices.
   const mat=leafMats[eucalyptus?1:type==='cypress'?2:0];
   const crown=mesh(scenery,crownCore,mat,bx,by,bz,sx,sy,sz);crown.rotation.y=a;
   if(eucalyptus){const fringe=mesh(scenery,foliage,leafMats[1],bx,by,bz,sx*1.13,sy*1.13,sz*1.13);fringe.rotation.y=a;}
  }
 }
 function clearLawn(x,z){if(site.id!=='shoreline')return false;const [cx,cz]=project([37.43220,-122.08815]);return Math.abs(x-cx)<56&&Math.abs(z-cz)<65;}
 function shrub(x,z,h=.8){if(clearLawn(x,z)||g.promenade?.nearest(x,z)?.distance<4.8||g.promenade?.rampAt(x,z))return;const y=g.terrainHeight(x,z);if(y<.05||g.blocked(x,z,h*.5))return;mesh(scenery,crownCore,leafMats[0],x,y+h*.45,z,h*.7,h*.45,h*.7);mesh(scenery,foliage,leafMats[1],x,y+h*.6,z,h,h*.75,h);}
 const grassGeo=new THREE.BufferGeometry(),gp=[];for(let i=0;i<12;i++){const a=rnd()*6.28,x=Math.cos(a)*rnd()*.3,z=Math.sin(a)*rnd()*.3,h=.25+rnd()*.5;gp.push(x-.025,0,z,x+.025,0,z,x+Math.cos(a)*.18,h,z+Math.sin(a)*.18);}grassGeo.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));grassGeo.computeVertexNormals();const grassMat=new THREE.MeshStandardMaterial({color:0x9e9d6b,side:THREE.DoubleSide,roughness:1});
 function grass(x,z,s=1){if(clearLawn(x,z)||g.promenade?.nearest(x,z)?.distance<4.8||g.promenade?.rampAt(x,z))return;const y=g.terrainHeight(x,z);if(y>.02)mesh(scenery,grassGeo,grassMat,x,y,z,s,s,s).rotation.y=rnd()*6.28;}
 const lawnTexture=texture(c=>{c.fillStyle='#a4b598';c.fillRect(0,0,256,256);for(let i=0;i<9000;i++){const v=125+Math.floor(rnd()*85);c.fillStyle='rgb('+v+','+(v+12)+','+(v-8)+')';c.fillRect(rnd()*256,rnd()*256,.5+rnd(),2+rnd()*3);}});
 let groundLayer=0;
 function groundPatch(p,color,lawn=false){const layer=groundLayer++,pts=p.map(([x,z])=>new THREE.Vector2(x,z)),tris=THREE.ShapeUtils.triangulateShape(pts,[]),positions=FoilSceneryGeometry.drape(tris.map(t=>t.map(i=>p[i])),g.surfaces,.045+layer*.00005),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();if(lawn){const uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i]/7,positions[i+2]/7);geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}const material=new THREE.MeshStandardMaterial({color,map:lawn?lawnTexture:null,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:0,polygonOffsetUnits:-1-layer*.01});return mesh(scenery,geo,material);}
 const groundColors={grass:0x7c905e,recreation_ground:0x819363,green:0x61904e,fairway:0x79965d,tee:0x628b4e,driving_range:0x719053,bunker:0xd5c5a1,beach:site.id==='shoreline'?0xbbb49a:0xd2c4a6,sand:0xd2c4a6,wood:0x777e59,forest:0x777e59,scrub:0x999774,wetland:0x8e956c,grassland:0xaaa57c,meadow:0xa4a079};
 const ground=features.ground.filter(f=>Math.hypot(...center(f.points))<(site.id==='crissy'?2600:1450));
 for(const f of ground.sort((a,b)=>Number(['green','bunker','beach','tee'].includes(a.kind))-Number(['green','bunker','beach','tee'].includes(b.kind)))){if(f.points.length<4)continue;groundPatch(f.points,groundColors[f.kind]||0x919b75,['grass','recreation_ground','green','fairway','tee','driving_range'].includes(f.kind));if(f.kind==='green'){const [x,z]=center(f.points),y=g.terrainHeight(x,z);rod(scenery,0xd7d3be,[x,y,z],[x,y+2.1,z],.035);box(scenery,0xe9dfc6,x+.25,y+1.9,z,.5,.32,.025);}}
 for(const p of features.paths){if(g.promenade?.ids.has(p.id))continue;const cc=center(p.points);if(Math.hypot(...cc)>(site.id==='crissy'?2500:1300))continue;path(p.points,/Bay Trail|Promenade|Foster City Levee/.test(p.name)?3.8:2.1,p.surface==='asphalt'||/Bay Trail|Foster City Levee/.test(p.name)?0x555e61:p.surface==='concrete'?0xbfc0b6:0xb7ad93);}
 // Angular shoreline armor shares its positions and radii with collision.
 const stoneGeos=[0,1,2].map(k=>{const a=new THREE.IcosahedronGeometry(1,1),v=a.attributes.position;for(let j=0;j<v.count;j++){const f=.88+.10*Math.sin(v.getX(j)*13+v.getZ(j)*17+k*3);v.setXYZ(j,v.getX(j)*f,v.getY(j)*f,v.getZ(j)*f);}a.computeVertexNormals();return a;});
 for(const r of g.shoreRocks){const m=mesh(scenery,stoneGeos[r.index%3],[0x858a80,0x949b90,0x777f79,0xa3a595][r.index%4],r.x,r.y,r.z,r.rx,r.ry,r.rz);m.rotation.y=r.angle;}
 // Re-paved waterfront: flat asphalt, a pale concrete apron and continuous
 // low trapezoidal seat-wall. The deck and ramps share their walkable grade.
 if(g.promenade){
  const p=g.promenade,sections=p.points.map((point,i)=>{const a=p.segments[Math.max(0,i-1)],b=p.segments[Math.min(i,p.segments.length-1)],n=V(a.nx+b.nx,0,a.nz+b.nz).normalize(),miter=1/Math.max(.6,n.x*b.nx+n.z*b.nz);return {x:point[0],z:point[1],nx:n.x*miter,nz:n.z*miter};});
  function band(profile,color,openings=false){const positions=[],indices=[],n=profile.length;
   for(const q of sections)for(const [offset,dy] of profile){const x=q.x+q.nx*offset,z=q.z+q.nz*offset;positions.push(x,dy===null?Math.min(p.height-.15,g.terrainHeight(x,z)-.04):p.height+dy,z);}
   for(let i=1;i<sections.length;i++){const a=sections[i-1],b=sections[i];if(openings&&p.inOpening((a.x+b.x)/2,(a.z+b.z)/2))continue;for(let j=0;j<n;j++){const k=(j+1)%n,aa=(i-1)*n+j,ab=(i-1)*n+k,ba=i*n+j,bb=i*n+k;indices.push(aa,ba,ab,ab,ba,bb);}}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return mesh(scenery,geo,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide,flatShading:true}));
  }
  band([[-2.1,-.015],[3.75,-.015],[3.75,null],[-2.1,null]],0xc7c6b6);
  band([[-2,0],[2,0],[2,-.02],[-2,-.02]],0x60676a);
  band([[2,.005],[3.75,.005],[3.75,-.015],[2,-.015]],0xd6d5c5);
  band([[3.05,.015],[3.75,.015],[3.62,.43],[3.18,.43]],0xd9d8cc,true);
  // Concrete ramps descend through the existing breaks in the revetment.
  for(const r of p.ramps){const points=FoilSceneryGeometry.sample([[r.x+r.nx*2,r.z+r.nz*2],[r.x+r.nx*r.length,r.z+r.nz*r.length]],1),data=FoilSceneryGeometry.ribbon(points,r.width,(x,z)=>p.height-(p.height+.35)*Math.max(0,Math.min(1,((x-r.x)*r.nx+(z-r.z)*r.nz-3)/(r.length-3)))),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geo.setIndex(data.indices);geo.computeVertexNormals();mesh(scenery,geo,new THREE.MeshStandardMaterial({color:0xbfc1b9,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}));}
  for(let i=18;i<sections.length;i+=16){const q=sections[i],x=q.x-q.nx*2.65,z=q.z-q.nz*2.65;if(p.inOpening(x,z))continue;rod(scenery,0x4e5550,[x,p.height-.1,z],[x,p.height+4.6,z],.055);rod(scenery,0x4e5550,[x,p.height+4.6,z],[x+q.nx*.65,p.height+4.6,z+q.nz*.65],.065);}
 }
 // Parking follows the real mapped drive aisles, including curved perimeter
 // lanes, rather than imposing a rectangular grid at the boathouse angle.
 const parking=g.parkingLayout;
 for(const road of features.roads){const cc=center(road.points);if(Math.hypot(...cc)>1400)continue;path(road.points,/Airport/.test(road.name)?10:7,0x606668);}
 for(const lot of parking.lots)groundPatch(lot.points,0x737a78);
 for(const a of parking.aisles)path(a.points,5.8,0x707774);
 for(let i=0;i<parking.stalls.length;i++){
  const s=parking.stalls[i],{x:wx,z:wz,angle}=s,y=g.terrainHeight(wx,wz);
  for(const side of [-1,1]){const x=wx+s.tx*side*1.3,z=wz+s.tz*side*1.3;path([[x-s.nx*2.45,z-s.nz*2.45],[x+s.nx*2.45,z+s.nz*2.45]],.085,0xe0ded0);}
  if(!s.parked)continue;
  const car=new THREE.Group();car.position.set(wx,y+.15,wz);car.rotation.y=angle;scenery.add(car);const color=[0xe2e3dc,0x6c7f86,0x4f5b60,0xbac4c3,0x9c6255][i%5];
  box(car,color,0,.58,0,1.75,.60,4.1);box(car,color,0,1.04,-.1,1.55,.52,2.25);box(car,glass,0,1.08,1.05,1.40,.39,.06);box(car,glass,0,1.08,-1.25,1.40,.37,.06);
  for(const sx of [-.79,.79]){box(car,glass,sx,1.08,-.1,.035,.35,2.08);for(const zz of [-1.25,1.25]){const tire=mesh(car,new THREE.CylinderGeometry(.32,.32,.20,10),0x303c3c,sx,.33,zz);tire.rotation.z=Math.PI/2;}}
  for(const xx of [-.6,.6])box(car,0xd8dbca,xx,.64,2.06,.35,.16,.03);
 }
 if(site.id==='shoreline'){let islands=0;for(const lot of parking.lots){const xs=lot.points.map(p=>p[0]),zs=lot.points.map(p=>p[1]);for(let x=Math.min(...xs)+3;x<Math.max(...xs)&&islands<14;x+=9)for(let z=Math.min(...zs)+3;z<Math.max(...zs)&&islands<14;z+=9){if(!inside(x,z,lot.points)||FoilLocations.distance(x,z,lot.points)<3||parking.aisles.some(a=>FoilLocations.distance(x,z,a.points)<5.8)||parking.stalls.some(s=>Math.hypot(x-s.x,z-s.z)<5))continue;const bed=Array.from({length:12},(_,i)=>[x+Math.cos(i*Math.PI/6)*2,z+Math.sin(i*Math.PI/6)*2.6]);groundPatch(bed,0x788667);path([...bed,bed[0]],.18,0xb9bcb0);plant(x,z,7+rnd()*3,'pine',true);islands++;}}}
 // Mapped individual trees plus woodland interiors; leave the lake's bird
 // island, golf fairways, beach and Crissy's open airfield free of tree scatter.
 let mappedTrees=0;for(const p of g.raw.trees||[]){const [x,z]=project(p);if(Math.hypot(x,z)>1400||mappedTrees++>240)continue;plant(x,z,site.id==='coyote'?13+rnd()*8:7+rnd()*6,site.id==='coyote'?'eucalyptus':'pine');}
 let trees=0;for(const f of ground){if(!['wood','forest','scrub','wetland','grassland','meadow'].includes(f.kind))continue;const xs=f.points.map(p=>p[0]),zs=f.points.map(p=>p[1]),x0=Math.min(...xs),z0=Math.min(...zs),w=Math.max(...xs)-x0,d=Math.max(...zs)-z0,n=Math.min(200,Math.ceil(w*d/125));for(let i=0;i<n;i++){const x=x0+rnd()*w,z=z0+rnd()*d;if(!inside(x,z,f.points)||g.signedShore(x,z)<2||Math.hypot(x,z)>(site.id==='crissy'?2600:1600))continue;if(['wood','forest'].includes(f.kind)&&trees<320){plant(x,z,(site.id==='coyote'?14:8)+rnd()*8,site.id==='coyote'?'eucalyptus':site.id==='crissy'?'cypress':'pine');trees++;}else{if(i%3===0)shrub(x,z,.5+rnd());else grass(x,z,1+rnd());}}}
 // View-specific groves and low coastal planting; photos keep open lawns open.
 if(site.id==='coyote')for(const [lat,lon,r,n] of [[37.5896,-122.3223,155,58],[37.5884,-122.3277,85,27],[37.5875,-122.3293,95,32],[37.5874,-122.3270,100,28]]){const [cx,cz]=project([lat,lon]);for(let i=0;i<n;i++){const a=rnd()*6.28,d=Math.sqrt(rnd())*r;plant(cx+Math.cos(a)*d,cz+Math.sin(a)*d,14+rnd()*12,i%3?'eucalyptus':'cypress');}}
 if(site.id==='shoreline')for(let i=0;i<g.water.length;i+=5){const [x,z]=g.water[i];if(x< -100&&z<50)continue;const len=Math.hypot(x,z),px=x+x/len*(20+rnd()*15),pz=z+z/len*(20+rnd()*15);if(g.signedShore(px,pz)>8)plant(px,pz,7+rnd()*7,i%4?'pine':'cypress');}
 if(site.id==='crissy')for(const [lat,lon] of [[37.8059,-122.4500],[37.80525,-122.4527],[37.8051,-122.4554],[37.8053,-122.4632],[37.8030,-122.4606],[37.8026,-122.4656],[37.8031,-122.4705]]){const [cx,cz]=project([lat,lon]);for(let i=0;i<20;i++)plant(cx+(rnd()-.5)*65,cz+(rnd()-.5)*35,9+rnd()*8,'cypress');}
 // Golf-course perimeter and the landscaped edge of the Gilead campus;
 // satellite launch photos show open fairways and a mostly bare rock levee.
 if(site.id==='third')for(const [lat,lon,r,n] of [[37.5733,-122.2856,23,9],[37.5719,-122.2854,25,10],[37.5722,-122.2894,34,13],[37.5703,-122.2822,30,14],[37.5690,-122.2792,28,11]]){const [cx,cz]=project([lat,lon]);for(let i=0;i<n;i++){const a=rnd()*6.28,d=Math.sqrt(rnd())*r,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(ground.some(f=>['green','fairway','bunker','tee','driving_range'].includes(f.kind)&&inside(x,z,f.points)))continue;plant(x,z,7+rnd()*6,i%3?'pine':'cypress');}}
 // Shoreline's leafy east and north lake margins screen the parking lot;
 // the south-facing beach, café lawn and low bird island stay open.
 if(site.id==='shoreline')for(const [lat,lon,r,n] of [[37.43430,-122.08825,35,18],[37.43475,-122.0893,45,20],[37.43338,-122.08785,30,17],[37.4329,-122.0874,22,12],[37.4315,-122.0904,28,10]]){const [cx,cz]=project([lat,lon]);for(let i=0;i<n;i++){const a=rnd()*6.28,d=Math.sqrt(rnd())*r,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(g.signedShore(x,z)>9&&!clearLawn(x,z))plant(x,z,7+rnd()*7,i%5?'pine':'poplar');}}
 for(const f of ground.filter(f=>['scrub','wetland','grassland'].includes(f.kind))){const [cx,cz]=center(f.points);if(Math.hypot(cx,cz)>1050)continue;for(let i=0;i<36;i++){const a=rnd()*6.28,r=rnd()*35,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(!inside(x,z,f.points))continue;shrub(x,z,f.kind==='wetland'?.25+rnd()*.3:.6+rnd()*.7);grass(x+1,z,.7+rnd());}}
 function hipRoof(p,x,z,w,d,y,rise=2,material=roofMat){const v=[[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2]],alongZ=d>=w;v.push(alongZ?[0,rise,-Math.max(0,d-w)/2]:[-Math.max(0,w-d)/2,rise,0],alongZ?[0,rise,Math.max(0,d-w)/2]:[Math.max(0,w-d)/2,rise,0]);const faces=alongZ?[0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0]:[0,4,5,0,5,1,1,5,2,2,5,4,2,4,3,3,4,0],pos=[],uv=[];for(const i of faces){pos.push(...v[i]);uv.push((v[i][0]+w/2)/8,(v[i][2]+d/2)/8);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const m=mesh(p,geo,material,x,y,z);m.material.side=THREE.DoubleSide;box(p,0xd1d1bd,x,y-.12,z,w,.22,d);return m;}
 function gable(p,w,d,y,rise,color=0xa76d53){for(const side of [-1,1]){const m=box(p,color,side*w/4,y+rise/2,0,Math.hypot(w/2,rise)+.25,.16,d+.6);m.rotation.z=-side*Math.atan2(rise,w/2);}for(const z of [-d/2,d/2]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,y,z,w/2,y,z,0,y+rise,z],3));geo.computeVertexNormals();const m=mesh(p,geo,0xd5d2bb);m.material.side=THREE.DoubleSide;}}
 function window(p,x,y,z,w,h,yaw=0){const f=new THREE.Group();p.add(f);f.position.set(x,y,z);f.rotation.y=yaw;box(f,0xd5d8cc,0,0,0,w+.15,h+.15,.13);box(f,glass,0,0,.075,w,h,.04);}
 function sign(p,text,x,y,z,w,h,rotation=0){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#e4dfc7';ctx.fillRect(0,0,512,128);ctx.fillStyle='#274e58';ctx.font='bold 42px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64,480);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const m=mesh(p,new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.9}),x,y,z);m.rotation.y=rotation;}
 function frame(b){let len=0,angle=0;for(let i=1;i<b.points.length;i++){const a=b.points[i-1],c=b.points[i],d=Math.hypot(c[0]-a[0],c[1]-a[1]);if(d>len){len=d;angle=Math.atan2(c[0]-a[0],c[1]-a[1]);}}const [x,z]=center(b.points),co=Math.cos(angle),si=Math.sin(angle),p=b.points.map(q=>[(q[0]-x)*co-(q[1]-z)*si,(q[0]-x)*si+(q[1]-z)*co]),xs=p.map(q=>q[0]),zs=p.map(q=>q[1]),g1=new THREE.Group();g1.position.set(x,Math.max(.2,g.terrainHeight(x,z)),z);g1.rotation.y=angle;scenery.add(g1);return {p:g1,w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs)};}
 function facade(b){const [x,z]=center(b.points),y=Math.max(.2,g.terrainHeight(x,z)),h=b.height||5,office=b.style==='meta'||b.style?.startsWith('gilead'),garage=b.style==='gilead-garage',low=b.style==='gilead-low',near=Math.hypot(x,z)<1800;
  polygon(b.points,h,garage?0x4f5b59:office?glass:site.id==='crissy'?0xd9d5c2:0xc7c5b6,y);polygon(b.points,0,0x8a8a7e,y+h+.03);
  if(!near)return;
  for(let i=1;i<b.points.length;i++){const a=b.points[i-1],c=b.points[i],len=Math.hypot(c[0]-a[0],c[1]-a[1]),yaw=Math.atan2(-(c[1]-a[1]),c[0]-a[0]),n=Math.min(40,Math.floor(len/(office?b.style==='meta'?2.8:4.3:6)));
   if(len<1)continue;
   if(office){for(let f=1;f<=Math.ceil(h/(garage?3.3:4));f++){const yy=y+Math.min(h-.12,f*(garage?3.3:4)),m=box(scenery,low?0xd5d0bd:0xcbd0c9,(a[0]+c[0])/2,yy,(a[1]+c[1])/2,len,garage?.6:low?1.5:b.style?.startsWith('gilead')?.55:.15,.28);m.rotation.y=yaw;}for(let k=0;k<=n;k++){const t=k/Math.max(1,n),m=box(scenery,0xdce0d5,a[0]+(c[0]-a[0])*t,y+h/2,a[1]+(c[1]-a[1])*t,garage?.48:b.style==='meta'?.16:.10,h,.40);m.rotation.y=yaw;}}
   else for(let k=0;k<n;k++){const t=(k+.5)/n,m=box(scenery,glass,a[0]+(c[0]-a[0])*t,y+Math.min(h*.5,3),a[1]+(c[1]-a[1])*t,1.5,Math.min(h*.5,2),.16);m.rotation.y=yaw;}
  }
  if(office){const f=frame(b);
   if(garage){polygon(b.points,0,0x293e48,y+h+.09);for(let z=-f.d*.42;z<f.d*.43;z+=4.5)box(f.p,0x697f88,0,h+.11,z,f.w*.85,.08,.12);return;}
   box(f.p,0xa1aaa5,0,h+.7,0,f.w*.48,1.4,f.d*.55);
   if(b.style==='gilead-tower'){// The 309 roof projects as an open perimeter frame.
    for(const x of [-f.w/2-1.5,f.w/2+1.5])box(f.p,0xd5d9d2,x,h+1.1,0,.5,.35,f.d+4);
    for(const z of [-f.d/2-2,f.d/2+2])box(f.p,0xd5d9d2,0,h+1.1,z,f.w+3,.35,.5);
    for(let z=-f.d/2;z<f.d/2;z+=5)for(const x of [-f.w/2-.65,f.w/2+.65])box(f.p,0xd5d9d2,x,h+1.1,z,2,.24,.22);
   }
   return;
  }
  if(site.id==='crissy'&&!/Sports Basement|Center|Centre|Prison|Industries|Palace|Fort Point/i.test(b.name)){const f=frame(b);gable(f.p,f.w,f.d,h,Math.min(4,f.w*.22),b.style==='hangar'?0x96958a:0xa66f56);}
 }
 const skip=new Set(site.id==='shoreline'?['456121246']:site.id==='coyote'?['1041191890','1267736760']:['32777524','1482401136']);
 for(const b of features.buildings){if(skip.has(b.id)||b.name==='Palace of Fine Arts'||/Control Tower/.test(b.name))continue;facade(b);}
 function bench(p,x,z,angle=0){const q=new THREE.Group();q.position.set(x,0,z);q.rotation.y=angle;p.add(q);box(q,0x8c7858,0,.48,0,1.7,.10,.45);box(q,0x8c7858,0,.85,-.20,1.7,.43,.07);for(const x of [-.65,.65]){box(q,0x5c6b64,x,.25,0,.08,.5,.36);}}
 function picnic(p,x,z){const q=new THREE.Group();q.position.set(x,0,z);p.add(q);box(q,0x9e8e70,0,.76,0,1.6,.10,.9);for(const x of [-.9,.9]){box(q,0x9e8e70,x,.45,0,.3,.10,1.5);rod(q,0x6d766c,[x,0,-.5],[x*.5,.7,-.5],.045);rod(q,0x6d766c,[x,0,.5],[x*.5,.7,.5],.045);}rod(q,0xcac8ad,[0,.8,0],[0,2.5,0],.03);mesh(q,new THREE.ConeGeometry(1.45,.45,8),0xe7e0c5,0,2.35,0);}
 function boardRack(p,x,y,z){for(const sx of [-2,2])rod(p,0x687978,[x+sx,y,z],[x+sx,y+2,z],.055);for(let k=0;k<6;k++){const col=[0xddbe4d,0xe17b4f,0x67a4b7,0xe5e6d8,0x5b91aa,0xb4bd86][k];const q=new THREE.Group();q.position.set(x-1.7+k*.68,y+1.05,z);q.rotation.x=.15;p.add(q);ell(q,col,0,0,0,.26,1.1,.085);box(q,0x6c7d78,0,.05,.09,.30,.72,.018);}}
 function dinghy(p,x,z,angle=0,pedal=false,index=0){const q=new THREE.Group();q.position.set(x,0,z);q.rotation.y=angle;p.add(q);const hullColor=pedal?[0xd36a48,0xd4b64b,0x6c9cad,0xa58d9e][index%4]:0xe5e5d8;ell(q,hullColor,0,.24,0,pedal?.82:.70,.25,pedal?1.45:1.95);ell(q,0x6e8988,0,.40,-.10,.48,.07,.9);if(pedal){box(q,hullColor,0,.58,-.5,1.5,.35,.35);box(q,hullColor,0,.58,.4,1.5,.35,.35);for(const x of [-.4,.4])box(q,0xe4dbb7,x,.47,0,.4,.10,.5);}else{rod(q,0xc5ceca,[0,.40,.5],[0,5.9,.5],.025);rod(q,0xb6c4bf,[0,1.4,.5],[0,1.4,-1.3],.035);rod(q,0xe6e5d7,[0,1.5,.5],[0,5.75,.5],.065);rod(q,0x7c9395,[0,.4,-1.8],[0,5.8,.5],.009);box(q,0x4c7f9b,0,.08,-1.9,.06,.42,.4);}return q;}
 const windMarkers=FoilWindMarkers.create({THREE,scene});actors.push(s=>windMarkers.update(s));
 function windsock(lat,lon){const [x,z]=project([lat,lon]);windMarkers.sock(x,g.terrainHeight(x,z),z);}
 if(site.id==='shoreline'){
  const p=group(37.43270,-122.08810);p.rotation.y=-.406;const siding=0x8f9b99;
  const wings=[[3.9,12.65,23.2,9.5,3.6],[-1.6,-6.5,17.3,21.4,3.4],[2.8,-19.6,8.8,5,3.4],[10.8,12.65,9.5,9.5,7.0]];
  for(const [x,z,w,d,h] of wings){box(p,siding,x,h/2,z,w,h,d);for(let yy=.25;yy<h;yy+=.25){box(p,0x7d8c8b,x,yy,z+d/2+.02,w,.025,.035);box(p,0x7d8c8b,x+w/2+.02,yy,z,.035,.025,d);}hipRoof(p,x,z,w+.8,d+.8,h,Math.min(2,w*.18));}
  box(p,0xa6b3a9,10.8,9.5,12.65,2.2,1.7,2.2);for(let j=0;j<7;j++){box(p,0x647b72,11.92,8.87+j*.20,12.65,.04,.10,1.8);box(p,0x647b72,10.8,8.87+j*.20,13.77,1.8,.10,.04);}hipRoof(p,10.8,12.65,3.1,3.1,10.4,.65,0x658d82);
  for(const z of [9.6,12.65,15.7]){window(p,15.58,5.25,z,1.7,2.0,Math.PI/2);window(p,15.58,1.75,z,1.7,2.4,Math.PI/2);}for(let z=-17;z<4;z+=3)window(p,7.12,1.8,z,1.65,2.2,Math.PI/2);
  for(let x=-6;x<7;x+=3)window(p,x,1.8,17.45,1.6,2.2);
  sign(p,'SHORELINE LAKE',15.72,3.35,12.65,7,.65,Math.PI/2);boardRack(p,6,.05,20);
  // Lakefront patio and small beach immediately south of the café.
  for(let i=0;i<6;i++)picnic(p,11+(i%2)*3,-3-Math.floor(i/2)*5);
  for(let i=0;i<8;i++){const q=new THREE.Group();q.position.set(8+i*.78,.35,-27-(i%2)*2);q.rotation.x=.08;q.rotation.y=1.2;p.add(q);ell(q,0xe4e5da,0,0,0,.58,.24,1.75);box(q,0x497e9c,0,.2,-1.4,.06,.45,.42);}
  for(let i=0;i<5;i++)dinghy(p,13.5+i*3.4,24.5,-Math.PI/2,true,i).position.y=-p.position.y;
  for(let i=0;i<9;i++)dinghy(p,37+i*1.9,39+i*3.15,.51,false,i).position.y=-p.position.y;
  const world=(x,z)=>{const v=p.localToWorld(V(x,0,z));return [v.x,v.z];};p.updateMatrixWorld(true);
  for(const [x,z] of [[-18,25],[-21,11],[-20,-2],[-18,-16],[-10,-28]])plant(...world(x,z),13+rnd()*3,'poplar');
  for(const [x,z] of [[-26,22],[-29,5],[-31,-13],[-25,-29],[-11,-36],[-37,33]])plant(...world(x,z),8+rnd()*3,'pine');
  const flagSite=p.localToWorld(V(10.8,11.1,12.65));windMarkers.flag(flagSite.x,flagSite.y,flagSite.z,3.3);
  windsock(37.43240,-122.08850);windsock(37.4345,-122.0892);
  // Shoreline's documented SolarBee circulator. Mooring position is approximate.
  const [sx,sz]=project([37.43356,-122.0910]),solar=new THREE.Group();solar.position.set(sx,0,sz);scene.add(solar);
  mesh(solar,new THREE.CylinderGeometry(.8,.72,.30,24),0xb4b9af,0,.02,0);rod(solar,0x989f9b,[0,-2,0],[0,1.35,0],.11);box(solar,0xbac1b8,0,.95,0,.45,.55,.4);
  for(let j=0;j<3;j++){const a=j*Math.PI*2/3,x=Math.cos(a)*2,z=Math.sin(a)*2;const outline=new THREE.Shape();outline.moveTo(-.55,-.50);outline.lineTo(.55,-.50);outline.lineTo(0,.65);outline.closePath();const float=mesh(solar,new THREE.ExtrudeGeometry(outline,{depth:.28,bevelEnabled:true,bevelSize:.06,bevelThickness:.04,bevelSegments:1}),0x424d4c,x,.22,z);float.rotation.set(Math.PI/2,0,a);rod(solar,0xbcc4bf,[x,.35,z],[Math.cos(a+Math.PI*2/3)*2,.35,Math.sin(a+Math.PI*2/3)*2],.025);rod(solar,0xbcc4bf,[0,.25,0],[x,.25,z],.065);rod(solar,0xbcc4bf,[x,.25,z],[x*.5,1.65,z*.5],.04);const panel=new THREE.Group();panel.position.set(x*.46,1.60,z*.46);panel.rotation.set(.38,a,0);solar.add(panel);box(panel,0xb9c6c4,0,0,0,1.08,.065,1.42);box(panel,0x24485c,0,.04,0,1.01,.018,1.35);for(let k=1;k<6;k++)box(panel,0x829baf,-.50+k*.168,.053,0,.009,.004,1.35);for(let k=1;k<9;k++)box(panel,0x829baf,0,.053,-.675+k*.15,1.01,.004,.008);}
  rod(solar,0xbec7c3,[.3,1.2,0],[.3,2.20,0],.022);box(solar,0xd5d9ca,.3,1.85,0,.16,.24,.12);actors.push(s=>{solar.position.y=FoilCore.sea(sx,sz,s.time,s.config.swell,s.config)*.55;solar.rotation.x=Math.sin(s.time*.8)*.012;solar.rotation.z=Math.cos(s.time*.65)*.014;});marker('SolarBee water circulator','SOLAR CIRCULATOR',37.43356,-122.0910,3);

  for(const dock of features.piers){if(Math.hypot(...center(dock.points))>350)continue;for(let i=1;i<dock.points.length;i++){const a=dock.points[i-1],b=dock.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let k=0;k<len;k+=4){const t=k/len,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;ell(scenery,0x3f5258,x,.42,z,.11,.26,.11);box(scenery,0xbec9c4,x,.82,z,.23,.05,.07);}}}

 }
 if(site.id==='coyote'){
  const b=features.buildings.find(b=>b.id==='1041191890');if(b){const f=frame(b),p=f.p;box(p,0xc3b395,0,1.55,0,f.w,3.1,f.d);hipRoof(p,0,0,f.w+.5,f.d+.5,3.15,.8,0x9b9079);box(p,0xaf9c7d,-f.w*.34,4.6,0,3.2,3,f.d*.9);const cap=box(p,0x999380,-f.w*.34,6.3,0,3.9,.18,f.d+1);cap.rotation.z=.12;window(p,-f.w*.34,4.8,f.d*.46,2.4,1.35);sign(p,'BOARDSPORTS CALIFORNIA',1,2.4,f.d/2+.06,Math.min(f.w-1,8),.85);boardRack(p,1,0,f.d/2+.7);for(let i=0;i<3;i++)dinghy(p,-2+i*1.5,f.d/2+4,.6,true,i);}
  const station=features.buildings.find(b=>b.id==='1267736760');if(station){const f=frame(station),p=f.p;polygon(station.points,3.8,0xb7bdb4,p.position.y);polygon(station.points,0,0x9da8a3,p.position.y+3.84);for(const z of [-f.d*.25,f.d*.22]){box(p,0x5d6a65,f.w/2+.05,1.75,z,.09,1.7,1.5);for(let y=1.05;y<2.55;y+=.15)box(p,0x84918a,f.w/2+.11,y,z,.1,.045,1.45);}box(p,0xbfc6bc,-f.w*.25,4.15,0,2,.65,1.8);sign(p,'COYOTE POINT PUMP STATION',0,2.85,f.d/2+.06,Math.min(f.w,9),.45);
   const apron=[[37.58776,-122.33252],[37.58778,-122.33225],[37.58755,-122.33220],[37.58740,-122.33235],[37.58755,-122.33267]].map(project);groundPatch(apron,0x7f8985);
   const a=project([37.58768,-122.33242]),b=project([37.58783,-122.33246]);path([a,b],3.3,0xbfc4bb);for(const offset of [-1.15,1.15]){const y=g.terrainHeight(...b);rod(scenery,0x8a9995,[b[0]+offset,y,b[1]],[b[0]+offset,y+1.1,b[1]],.045);}marker('Coyote Point Pump Station','PUMP STATION',37.58764,-122.33243,6);
  }
  marker('Burlingame Point · Meta campus','META CAMPUS',37.59045,-122.33582,28);
  // Waterfront planted promenade, benches and riprap at the campus frontage.
  const trail=[[37.59003,-122.3339],[37.59105,-122.3356],[37.59105,-122.3380]].map(project);path(trail,5,0xb5b8aa);for(let i=0;i<22;i++){const t=i/21,a=trail[0],b=trail[1],x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;shrub(x+4,z-5,.8);if(i%3===0)plant(x+11,z-10,6,'pine');}
  windsock(37.58910,-122.32812);windsock(37.5881,-122.3315);
 }
 if(site.id==='third'){
  // 2024 completed-project photos: pale concrete capping above a darker
  // sheet-pile base. Keep water access gaps separate from the paved trail.
  for(const r of g.levee){const positions=[],indices=[];for(const [p,y] of [[r.a,r.ya],[r.b,r.yb]])for(const [offset,h] of [[-.28,-.2],[.28,-.2],[.28,.78],[-.28,.78]])positions.push(p[0]+r.nx*offset,y+h,p[1]+r.nz*offset);for(let j=0;j<4;j++){const k=(j+1)%4;indices.push(j,j+4,k,k,j+4,k+4);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(scenery,geo,0xd3d3c6);const x=(r.a[0]+r.b[0])/2,z=(r.a[1]+r.b[1])/2,y=(r.ya+r.yb)/2;rod(scenery,0x827365,[x,y-.4,z],[x,y+.23,z],.12);}
  windsock(37.57457,-122.28404);windsock(37.57315,-122.27935);
  // Mariners Point uses tall ball-stop netting, with fine square mesh and
  // tension cables, plus a low chain-link fence at the parking boundary.
  function netFence(points,height,spacing=15,low=false){
   const tex=texture(c=>{c.clearRect(0,0,256,256);c.strokeStyle=low?'#59615a':'#5c685b';c.lineWidth=low?3:1.7;c.beginPath();if(low){c.moveTo(0,128);c.lineTo(128,0);c.lineTo(256,128);c.lineTo(128,256);c.closePath();}else{c.moveTo(0,0);c.lineTo(256,0);c.moveTo(0,0);c.lineTo(0,256);}c.stroke();});
   const material=new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide,roughness:1});
   for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.5)continue;const count=Math.ceil(length/spacing);
    for(let j=0;j<count;j++){const t=j/count,u=(j+1)/count,ax=a[0]+(b[0]-a[0])*t,az=a[1]+(b[1]-a[1])*t,bx=a[0]+(b[0]-a[0])*u,bz=a[1]+(b[1]-a[1])*u,ay=g.terrainHeight(ax,az),by=g.terrainHeight(bx,bz),w=length/count;
     rod(scenery,0x565d58,[ax,ay,az],[ax,ay+height,az],low?.045:.14);if(j===count-1)rod(scenery,0x565d58,[bx,by,bz],[bx,by+height,bz],low?.045:.14);
     for(const h of low?[height]:[.4,height*.5,height])rod(scenery,0x616c61,[ax,ay+h,az],[bx,by+h,bz],low?.025:.02);
     const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([ax,ay,az,bx,by,bz,ax,ay+height,az,bx,by+height,bz],3));const size=low?.16:.65;geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,w/size,0,0,height/size,w/size,height/size],2));geo.setIndex([0,2,1,1,2,3]);geo.computeVertexNormals();mesh(scenery,geo,material);
    }
   }
  }
  const range=ground.find(f=>f.kind==='driving_range');if(range){for(let i=1;i<range.points.length;i++){const a=range.points[i-1],b=range.points[i];if(Math.hypot(b[0]-a[0],b[1]-a[1])>45)netFence([a,b],20,16);}}
  for(const fence of g.shoreAccess.fences)netFence(fence,1.15,3,true);
  // The golf greens and bordering groves are mapped. Keep trees off putting
  // surfaces while filling the curving banks and the greener parking edge.
  for(const [lat,lon,n] of [[37.57360,-122.27994,18],[37.57380,-122.28063,16],[37.57412,-122.28138,17],[37.57442,-122.28232,18],[37.57410,-122.2835,16],[37.57328,-122.28322,14]]){const [x,z]=project([lat,lon]);for(let i=0;i<n;i++){const px=x+(rnd()-.5)*45,pz=z+(rnd()-.5)*30;if(ground.some(f=>['green','bunker','tee','driving_range'].includes(f.kind)&&inside(px,pz,f.points)))continue;plant(px,pz,6+rnd()*6,i%4?'pine':'cypress');}}
  for(let i=0;i<35;i++){const [x,z]=project([37.57215+i*.000025,-122.27973]);shrub(x,z,1.0+rnd()*.5);}
  // Two photo-traced turf rigging areas: the north pad and the crescent
  // behind Lower Beach. The asphalt Bay Trail remains clear beside them.
  for(const outline of [ [[37.57303,-122.27956],[37.57330,-122.27957],[37.57336,-122.27943],[37.57303,-122.27941]],[[37.57198,-122.27941],[37.57198,-122.27930],[37.57154,-122.27923],[37.57131,-122.27903],[37.57121,-122.27839],[37.57117,-122.27840],[37.57125,-122.27910],[37.57149,-122.27935]] ]){const p=outline.map(project);groundPatch(p,0x42744d,true);path([...p,p[0]],.30,0xc8c9b9);}
  // The teaching camper occupies a few bays at the north end of the lot.
  // Its placement is representative: lesson vehicles move from day to day.
  {const [x,z]=g.lessonRV.point,p=new THREE.Group();p.position.set(x,g.terrainHeight(x,z),z);scenery.add(p);box(p,0xe2dfd0,0,1.78,-.6,2.5,2.35,6.2);box(p,0xc7c9c0,0,.75,0,2.45,.40,7.6);box(p,0xdddcd1,0,1.12,3.05,2.30,.85,1.35);box(p,0xe8e5d9,0,2.4,2.7,2.50,.75,1.9);box(p,glass,0,1.7,3.70,2.13,.68,.04);for(const xx of [-1.27,1.27]){for(const zz of [-2.5,.1])box(p,glass,xx,2.12,zz,.035,.72,1.25);for(const zz of [-2.4,2.35]){const tire=mesh(p,new THREE.CylinderGeometry(.43,.43,.26,12),0x33423f,xx,.47,zz);tire.rotation.z=Math.PI/2;}box(p,0x66858b,xx,1.05,-.4,.04,.14,6.1);}box(p,0xb8c0b9,0,3.05,-.8,1.15,.30,1.2);box(p,0xbdc6bd,1.27,1.65,1.35,.035,1.8,.72);sign(p,'KITE LESSONS',1.30,2.67,-.8,3.2,.32,Math.PI/2);}
  // Rounded black benches, a notice board and low chain link frame the two
  // turf setup areas. Keep the centre clear for laying out equipment.
  for(const [lat,lon] of [[37.57304,-122.27955],[37.57323,-122.27955],[37.57152,-122.27928]]){const p=group(lat,lon);bench(p,0,0,-Math.PI/2);}
  {const p=group(37.573015,-122.27942);for(const x of [-.75,.75])rod(p,0x426153,[x,0,0],[x,2.15,0],.045);box(p,0x476457,0,1.48,0,1.62,1.30,.09);sign(p,'LOWER LAUNCH',0,1.75,.06,1.45,.25);}
  const access=g.shoreAccess;
  if(access){const r=access.ramp; // The visible ramp and the walkable slope share one grade.
   const points=FoilSceneryGeometry.sample([r.a,r.b],1),data=FoilSceneryGeometry.ribbon(points,r.width,(x,z)=>access.at(x,z,1)?.height??r.top),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geo.setIndex(data.indices);geo.computeVertexNormals();mesh(scenery,geo,new THREE.MeshStandardMaterial({color:0xc3c4bb,side:THREE.DoubleSide,roughness:1}));
   for(let t=2;t<r.length;t+=3){const x=r.a[0]+(r.b[0]-r.a[0])*t/r.length,z=r.a[1]+(r.b[1]-r.a[1])*t/r.length,y=access.at(x,z).height+.012;rod(scenery,0xa9afa5,[x-r.nx*r.width/2,y,z-r.nz*r.width/2],[x+r.nx*r.width/2,y,z+r.nz*r.width/2],.012);}
   const [x,z]=access.dock,dock=new THREE.Group();scenery.add(dock);dock.position.set(x,.0,z);box(dock,0x7d8985,0,.18,0,5.2,.35,3.8);box(dock,0xc3c7bd,0,.45,0,5.2,.16,3.8);for(let a=-2.5;a<2.6;a+=.43)box(dock,0x9ba69d,a,.54,0,.025,.018,3.8);
   for(const zz of [-1.7,1.7]){box(dock,0x495956,0,.22,zz,4.8,.4,.22);rod(dock,0xb2b9af,[-2.25,-1,zz],[-2.25,1.2,zz],.07);}
   const gang=FoilSceneryGeometry.ribbon(FoilSceneryGeometry.sample([access.gangway,access.dock],1),1.3,(xx,zz)=>.48+1.62*Math.max(0,Math.min(1,(xx-access.dock[0])/(access.gangway[0]-access.dock[0]))));const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gang.positions,3));gg.setIndex(gang.indices);gg.computeVertexNormals();mesh(scenery,gg,0xb4b9b0);
   // Small rescue jet ski on the floating platform: pointed hull, saddle,
   // handlebars and bow bumper, rather than a miniature sailboat.
   const ski=new THREE.Group();dock.add(ski);ski.rotation.y=-.45;ell(ski,0xd9dfd7,0,.78,0,.54,.29,1.55);ell(ski,0x405154,0,1.0,-.12,.36,.24,1.05);ell(ski,0x273c3f,0,1.19,-.15,.24,.15,.68);rod(ski,0x3c4b4d,[0,1.15,.65],[0,1.5,.72],.05);rod(ski,0x33484c,[-.38,1.5,.72],[.38,1.5,.72],.045);
  }
  const [fx,fz]=g.shoreAccess.flag;windMarkers.flag(fx,g.terrainHeight(fx,fz),fz,5.2,'cabrinha');
  const restroom=features.buildings.find(b=>b.id==='1482401136');if(restroom){const f=frame(restroom);box(f.p,0xc7c2ae,0,1.5,0,f.w,3,f.d);box(f.p,0x657267,0,3.05,0,f.w+.4,.2,f.d+.4);for(const z of [-f.d*.24,f.d*.24]){box(f.p,0x58635b,f.w/2+.03,1.13,z,.08,2.25,.9);}sign(f.p,'BAYWINDS PARK',0,2.6,f.d/2+.05,Math.max(2,f.w),.35);}
  marker('Lower launch · concrete ramp','LOWER RAMP',37.57347,-122.27946,4);marker('Lower Beach','LOWER BEACH',37.571612,-122.278867,3);marker('Floating rescue dock','JET SKI DOCK',37.57316,-122.27917,3);
  for(const t of g.tanks){const p=new THREE.Group();p.position.set(t.x,t.y,t.z);scenery.add(p);mesh(p,new THREE.CylinderGeometry(t.radius,t.radius,t.height,64),0xe3e5dc,0,t.height/2,0);mesh(p,new THREE.ConeGeometry(t.radius+.12,.65,64),0xf0efe5,0,t.height+.325,0);for(const y of [.18,t.height-.18]){const ring=mesh(p,new THREE.TorusGeometry(t.radius+.04,.10,5,64),0xbfc6bf,0,y,0);ring.rotation.x=Math.PI/2;}for(const y of [1.4,3.7,6.0]){const ring=mesh(p,new THREE.TorusGeometry(t.radius+.015,.025,4,64),0xd1d5cc,0,y,0);ring.rotation.x=Math.PI/2;}box(p,0xb4beb9,0,t.height+.85,0,1.1,.8,1.1);for(const x of [-.24,.24])rod(p,0x8a9995,[x,.3,t.radius+.14],[x,t.height+.9,t.radius+.14],.035);for(let y=.5;y<t.height+.6;y+=.35)rod(p,0x8a9995,[-.24,y,t.radius+.15],[.24,y,t.radius+.15],.025);}
  marker('White water-storage tanks','WATER TANKS',37.56945,-122.27355,10);
  marker('Gilead Sciences campus','GILEAD',37.5683,-122.2808,40);
 }
 if(site.id==='crissy'){
  const b=features.buildings.find(b=>b.id==='32777524');if(b){const {p,w,d}=frame(b);box(p,0xe0ddc6,0,3,0,w,6,d);gable(p,w,d,6,3,0xa1755e);for(let y=.3;y<6;y+=.27){box(p,0xc8c9b5,0,y,d/2+.025,w,.025,.04);box(p,0xc8c9b5,w/2+.025,y,0,.04,.025,d);}for(const x of [-w*.32,w*.32])window(p,x,2.3,d/2+.08,1.0,1.8);box(p,0x4d605b,0,1.4,d/2+.08,1.5,2.8,.08);window(p,0,6.65,d/2+.06,.8,1.5);sign(p,'WARMING HUT',0,3.15,d/2+.16,3.3,.4);}
  // Dune grass, low rope fence and wind-shaped cypress along the promenade.
  for(let i=0;i<140;i++){const lat=37.8057+rnd()*.0013,lon=-122.463+rnd()*.011,[x,z]=project([lat,lon]);if(g.signedShore(x,z)>3&&g.signedShore(x,z)<65)grass(x,z,1+rnd()*.6);}
  for(const latlon of [[37.8059,-122.4500],[37.8052,-122.4531],[37.8052,-122.4582],[37.8062,-122.4679],[37.8081,-122.4706]]){const [x,z]=project(latlon);plant(x,z,11,'pine');}
  windsock(37.8063,-122.4504);windsock(37.8078,-122.4706);marker('Crissy Marsh','TIDAL MARSH',37.80465,-122.4539,3);marker('Historic airfield hangars','HANGARS',37.8038,-122.4651,14);
 }
 // A few benches at mapped viewpoints, kept out of the launch path.
 for(const [lat,lon] of site.id==='shoreline'?[[37.43435,-122.0885]]:site.id==='coyote'?[[37.5895,-122.3268],[37.5903,-122.325]]:site.id==='crissy'?[[37.8057,-122.456],[37.8078,-122.4701]]:[[37.5744,-122.2843]]){const p=group(lat,lon);bench(p,0,0);}
 return {trees,parkingLots:parking.lots.length,parkingStalls:parking.stalls.length,groundPatches:ground.length,windMarkers:windMarkers.diagnostics};
}
root.FoilSiteDetails={build};
})(globalThis);
