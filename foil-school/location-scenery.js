/* Site-specific architecture and landscape, laid out on the mapped shoreline. */
(function(root){
'use strict';
function build({THREE,scene,scenery,mesh,box,ell,rod,tree,landGeometry,terrainMat}){
 const g=FoilWorld.geography,{site,project,features}=g,landmarks=[],terrainMeshes=[];
 const V=(x,y,z)=>new THREE.Vector3(x,y,z),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));let seed=9182;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(const s of g.surfaces){const m=mesh(scenery,landGeometry(s.points,s.indices),terrainMat);m.updateMatrixWorld(true);terrainMeshes.push(m);}
 function group(lat,lon){const [x,z]=project([lat,lon]),p=new THREE.Group();p.position.set(x,Math.max(0,g.terrainHeight(x,z)),z);scenery.add(p);return p;}
 function marker(name,short,lat,lon,y,kind='landmark'){const [x,z]=project([lat,lon]);landmarks.push({name,short,x,z,y:Math.max(0,g.terrainHeight(x,z))+y,kind,color:'#9dbbae'});}
 function polygon(points,height,color,y=0){const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const geo=height?new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1}):new THREE.ShapeGeometry(shape);const m=mesh(scenery,geo,color,0,y,0);m.rotation.x=-Math.PI/2;return m;}
 const stripMaterials=new Map();
 function strip(points,width,color,height){const data=FoilSceneryGeometry.ribbon(points,width,height),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geo.setIndex(data.indices);geo.computeVertexNormals();if(!stripMaterials.has(color))stripMaterials.set(color,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}));return mesh(scenery,geo,stripMaterials.get(color));}
 function path(points,width,color,elevation=null,layer=2){if(points.length<2)return;if(elevation!==null)return strip(FoilSceneryGeometry.sample(points,2),width,color,()=>elevation);const data=FoilSceneryGeometry.ribbon(FoilSceneryGeometry.sample(points,4),width,()=>0),triangles=[];for(let i=0;i<data.indices.length;i+=3)triangles.push(data.indices.slice(i,i+3).map(k=>[data.positions[k*3],data.positions[k*3+2]]));const positions=FoilSceneryGeometry.drape(triangles,g.surfaces,.13+layer*.02),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const key=color+':'+layer;if(!stripMaterials.has(key))stripMaterials.set(key,new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1-layer,polygonOffsetUnits:-2-layer*2}));return mesh(scenery,geo,stripMaterials.get(key));}
 function roof(p,x,z,w,d,y,color=0x916c53){for(const side of [-1,1]){const r=box(p,color,x+side*w/4,y+w*.10,z,w*.54,.20,d+.4);r.rotation.z=-side*.38;}}
 function boat(x,z,angle=0,small=false,color=0xefe9d5){const p=new THREE.Group();p.position.set(x,.10,z);p.rotation.y=angle;scenery.add(p);if(small){ell(p,color,0,.08,0,.35,.22,1.6);ell(p,0x303f43,0,.24,0,.22,.07,.65);rod(p,0x4f6264,[-.8,.30,0],[.8,.30,0],.025);return;}
  ell(p,color,0,.30,0,.9,.5,2.9);box(p,0x526c6e,0,.72,-.25,1,.5,1.25);rod(p,0xbec5be,[0,.5,0],[0,9.5,0],.045);for(const z of [-2.5,2.5])rod(p,0x9aabaf,[0,.6,z],[0,9.5,0],.012);const sail=new THREE.BufferGeometry();sail.setAttribute('position',new THREE.Float32BufferAttribute([0,1,0,0,9.2,0,2.8,1,0],3));sail.computeVertexNormals();mesh(p,sail,new THREE.MeshStandardMaterial({color:0xf0eee4,side:THREE.DoubleSide,roughness:.9}));}
 for(const p of features.piers){if(p.points.length>45)continue;if(p.points[0][0]===p.points.at(-1)[0]&&p.points[0][1]===p.points.at(-1)[1])polygon(p.points,.25,0xb6b0a0,.50);else path(p.points,p.kind==='breakwater'?5:2.4,p.kind==='breakwater'?0x858878:0xb6b0a0,.62);
  for(let i=0;i<p.points.length;i+=2){const [x,z]=p.points[i];rod(scenery,0x6e766d,[x,-1,z],[x,1.3,z],.12);}}
 const actors=[];const detail=FoilSiteDetails.build({THREE,scene,scenery,mesh,box,ell,rod,g,group,polygon,path,marker,actors});
 if(site.id==='shoreline'){
  for(const [lat,lon,a] of [[37.43365,-122.0919,.2],[37.4322,-122.0918,1.5],[37.4337,-122.0899,2.7]]){const [x,z]=project([lat,lon]);boat(x,z,a);}
  marker('Shoreline Boathouse','BOATHOUSE',37.43270,-122.08810,12);marker('Floating docks','DOCKS',37.43311,-122.08823,3);marker('Bird island','ISLAND',37.4327,-122.0933,9);marker('Rengstorff House','HISTORIC HOUSE',37.43148,-122.08711,8);
 }
 if(site.id==='third'){
  // Riprap on the two launch coves, Bay Trail, and the golf course inland.

  const bridge=FoilSceneryGeometry.bridge(g.raw,project,g.terrainHeight),{points,ys}=bridge;
  strip(points,30,0x7d8581,(_,__,i)=>ys[i]);
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=dz/length,nz=-dx/length;
   // Longitudinal girders and parapets share the deck's exact endpoint heights.
   for(const side of [-14.8,14.8]){const aa=[a[0]+nx*side,ys[i-1]-.7,a[1]+nz*side],bb=[b[0]+nx*side,ys[i]-.7,b[1]+nz*side],d=V(...bb).sub(V(...aa)),mid=V(...aa).add(V(...bb)).multiplyScalar(.5),m=box(scenery,0x92998f,...mid.toArray(),.65,2.8,d.length()+.06);m.quaternion.setFromUnitVectors(V(0,0,1),d.normalize());}
   if(i%2===0&&i>=bridge.westCount&&i<=bridge.eastStart){for(const side of [-10,10])rod(scenery,0x929a90,[a[0]+nx*side,-2,a[1]+nz*side],[a[0]+nx*side,ys[i-1]-1,a[1]+nz*side],1.05);const cap=box(scenery,0x929a90,a[0],ys[i-1]-1.8,a[1],27,1.6,3);cap.rotation.y=Math.atan2(dx,dz);}
  }
  // Narrow engineered causeways can disappear in the 110 m distant DEM.
  // Model the mapped approach embankments explicitly beneath the roadway.
  for(const approach of [points.slice(0,bridge.westCount),points.slice(bridge.eastStart)])strip(approach,46,0x96957c,(x,z)=>Math.max(1.1,g.terrainHeight(x,z)));
  marker('San Mateo–Hayward Bridge','SAN MATEO BRIDGE',37.589,-122.2455,55);
  marker('Upper Launch','UPPER LAUNCH',37.574606,-122.284049,4);marker('Mariners Point','GOLF COURSE',37.5735,-122.288,7);marker('Bay Trail levee','BAY TRAIL',37.5727,-122.2856,4);
 }
 if(site.id==='coyote'){

  for(let i=0;i<18;i++){const [x,z]=project([37.58855+(i%6)*.00017,-122.31665+Math.floor(i/6)*.00015]);boat(x,z,.7,false);}
  for(const r of features.runways){path(r.points,54,0x686e70,.12);for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],n=Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/70);for(let j=0;j<n;j++){const t=(j+.5)/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,o=box(scenery,0xdddcca,x,.23,z,1.4,.08,24);o.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);}}}
  const tower=group(37.61586,-122.38378);mesh(tower,new THREE.CylinderGeometry(5,8,57,12),0xd4d1c5,0,28.5,0);mesh(tower,new THREE.CylinderGeometry(10,7,8,8),0x637a80,0,61,0);mesh(tower,new THREE.CylinderGeometry(11,11,1.5,8),0xe1dbca,0,66,0);rod(tower,0x9ca9a7,[0,67,0],[0,74,0],.2);
  const runway=project([37.61209,-122.35926]),dir=project([37.62628,-122.39309]),length=Math.hypot(dir[0]-runway[0],dir[1]-runway[1]),dx=(dir[0]-runway[0])/length,dz=(dir[1]-runway[1])/length;
  for(let k=0;k<2;k++){const plane=new THREE.Group();scene.add(plane);ell(plane,0xe1e4de,0,0,0,1.6,1.7,18);ell(plane,0x536f82,0,.25,14,1.3,1.2,3);const wing=box(plane,0xd1d8d3,0,-.6,-1,32,.25,6);wing.rotation.y=.10;box(plane,0xcbd4d2,0,.8,-13,12,.25,3);box(plane,0x557f9c,0,3,-14,.3,6,4);for(const x of [-6,6])ell(plane,0x8a9a9f,x,-2,1,1.1,1.1,2.8);plane.rotation.y=Math.atan2(dx,dz);actors.push(s=>{const travel=(s.time*65+k*3300)%9000-6000;plane.position.set(runway[0]+dx*travel,Math.max(5,-travel*.052)+10,runway[1]+dz*travel);plane.visible=travel<2200;});}
  marker('Coyote Point headland','COYOTE POINT',37.5899,-122.3227,14);marker('Coyote Point Marina','MARINA',37.5892,-122.31672,5);marker('SFO airport','SFO',37.61586,-122.38378,78);marker('Beach & Boardsports','BEACH',37.58891,-122.32772,8);
 }
 if(site.id==='crissy'){
  const hangers=[];
  const B=FoilSceneryGeometry.goldenGate(project,g.terrainHeight),{point,deckY,cableY,samples,side}=B,bridgeColor=0xb74e37;
  function beam(a,b,w,h,color=bridgeColor){const d=V(...b).sub(V(...a)),m=box(scenery,color,...V(...a).add(V(...b)).multiplyScalar(.5).toArray(),w,h,d.length()+.06);m.quaternion.setFromUnitVectors(V(0,0,1),d.normalize());return m;}
  // Art-Deco towers: rectangular tapered columns and horizontal portals.
  for(const t of [0,1]){const foot=point(t,0,2);const p=new THREE.Group();p.position.set(...foot);p.rotation.y=Math.atan2(point(1)[0]-point(0)[0],point(1)[2]-point(0)[2]);scenery.add(p);
   box(p,0xb4ada0,0,3,0,42,8,26);
   for(const x of [-13,13]){for(const [y,h,w,d] of [[40,74,10,16],[111,68,8.8,13],[174,58,7.7,10.5],[215,24,6.8,8.5]]){box(p,bridgeColor,x,y,0,w,h,d);for(const xx of [-w*.29,w*.29])box(p,0xc05a40,x+xx,y,d/2+.12,.55,h,.35);}box(p,0xb64e37,x,227,0,7.3,1.5,9);}
   for(const y of [77,120,159,196,222])box(p,bridgeColor,0,y,0,29,5.5,7);for(const y of [92,135,174]){rod(p,bridgeColor,[-9,y-9,0],[9,y+9,0],.9);rod(p,bridgeColor,[9,y-9,0],[-9,y+9,0],.9);}
  }
  for(let i=1;i<samples.length;i++){const t=samples[i-1],u=samples[i];beam(point(t),point(u),27,1.25,0x707773);
   for(const offset of [-14,14]){beam(point(t,offset,deckY(t)-1),point(u,offset,deckY(u)-1),.55,.65);beam(point(t,offset,deckY(t)-7),point(u,offset,deckY(u)-7),.6,.65);rod(scenery,bridgeColor,point(t,offset,deckY(t)-1),point(u,offset,deckY(u)-7),.28);rod(scenery,bridgeColor,point(t,offset,deckY(t)-7),point(t,offset,deckY(t)-1),.28);beam(point(t,offset,deckY(t)+1.1),point(u,offset,deckY(u)+1.1),.15,.15);
    if(t>=-side-1e-6&&u<=1+side+1e-6){rod(scenery,bridgeColor,point(t,offset,cableY(t)),point(u,offset,cableY(u)),.48);hangers.push(...point(t,offset,deckY(t)),...point(t,offset,cableY(t)));}
   }
  }
  // One-pixel line segments keep the slender hangers continuous in distant
  // water views instead of flickering into dashed, disconnected fragments.
  const hangerGeo=new THREE.BufferGeometry();hangerGeo.setAttribute('position',new THREE.Float32BufferAttribute(hangers,3));scenery.add(new THREE.LineSegments(hangerGeo,new THREE.LineBasicMaterial({color:0xa95b47})));
  for(const [t,direction] of [[B.start,-1],[B.end,1]]){const road=[];for(let d=0;d<=100;d+=5){const q=point(t+direction*d/B.length);road.push([q[0],q[2]]);}path(road,22,0x737a74);}
  // The concrete anchorages connect the suspended bridge to both approaches.
  for(const t of [-.354,-side,1+side]){const q=point(t),base=g.terrainHeight(q[0],q[2]),p=new THREE.Group();p.position.set(q[0],base,q[2]);p.rotation.y=Math.atan2(point(1)[0]-point(0)[0],point(1)[2]-point(0)[2]);scenery.add(p);for(const x of [-16,16]){box(p,0xbcb4a1,x,(80-base)/2,0,9,80-base,22);box(p,0xc5bda8,x,81-base,0,10,3,24);}}
  // Open steel approach bents, all the way to land at both ends.
  for(const [lo,hi] of [[B.start,-.354],[1+side,B.end]])for(let t=lo;t<=hi;t+=.042){const q=point(t),y=g.terrainHeight(q[0],q[2]);for(const offset of [-10,10]){rod(scenery,bridgeColor,point(t,offset,y),point(t,offset,deckY(t)-7),.95);}for(let h=y+4;h<deckY(t)-10;h+=12){rod(scenery,bridgeColor,point(t,-10,h),point(t,10,Math.min(h+12,deckY(t)-7)),.38);rod(scenery,bridgeColor,point(t,10,h),point(t,-10,Math.min(h+12,deckY(t)-7)),.38);}}
  // The 98 m steel arch preserves the open space above Fort Point.
  for(const offset of [-10,10])for(let i=0;i<24;i++){const t=-.354+i/24*(.354-side),u=-.354+(i+1)/24*(.354-side),arch=v=>26+24*Math.sin(Math.PI*(v+.354)/(.354-side));rod(scenery,bridgeColor,point(t,offset,arch(t)),point(u,offset,arch(u)),.8);rod(scenery,bridgeColor,point(t,offset,arch(t)+4),point(u,offset,arch(u)+4),.55);rod(scenery,bridgeColor,point(t,offset,arch(t)),point(u,offset,arch(u)+4),.3);if(i%2===0)rod(scenery,bridgeColor,point(t,offset,arch(t)+4),point(t,offset,deckY(t)-7),.45);}
  const fort=group(37.8106,-122.4770),brick=0xa27d64;
  for(const x of [-31,31])box(fort,brick,x,10,0,9,20,85);for(const z of [-38,38])box(fort,brick,0,10,z,62,20,9);
  for(const x of [-35.6,35.6])for(let z=-36;z<=36;z+=5.4)for(const y of [4.4,10.3,16]){box(fort,0x4a4b43,x,y,z,.10,1.6,1.10);ell(fort,0x4a4b43,x,y+.8,z,.055,.55,.55);}
  for(const z of [-42.6,42.6])for(let x=-26;x<=26;x+=5.2)for(const y of [4.4,10.3,16]){box(fort,0x4a4b43,x,y,z,1.10,1.6,.10);ell(fort,0x4a4b43,x,y+.8,z,.55,.55,.055);}
  for(const y of [.7,7.0,13.0,19.5]){for(const x of [-35.55,35.55])box(fort,0xb09379,x,y,0,.16,.24,85);for(const z of [-42.55,42.55])box(fort,0xb09379,0,y,z,71,.24,.16);}
  const lighthouse=group(37.81055,-122.47698);mesh(lighthouse,new THREE.CylinderGeometry(1.4,1.8,5,8),0xc9c5ad,0,22.5,0);mesh(lighthouse,new THREE.CylinderGeometry(1.5,1.5,1.7,8),0x4a5c59,0,25.7,0);mesh(lighthouse,new THREE.ConeGeometry(1.9,1,8),0x4f6057,0,27.05,0);
  const palace=group(37.80292,-122.4484);for(let i=0;i<8;i++){const t=i*Math.PI/4;rod(palace,0xc4a581,[Math.cos(t)*12,0,Math.sin(t)*12],[Math.cos(t)*12,24,Math.sin(t)*12],1.1);}mesh(palace,new THREE.CylinderGeometry(14,14,3,32),0xc4a581,0,25,0);const dome=mesh(palace,new THREE.SphereGeometry(14,24,12,0,Math.PI*2,0,Math.PI/2),0x9f8269,0,27,0,1,.7,1);
  // The promenade is rendered once, from its mapped path in site-details.
  marker('Golden Gate Bridge','GOLDEN GATE',37.8198,-122.4785,230);marker('Fort Point','FORT POINT',37.8106,-122.4770,23);marker('Alcatraz Island','ALCATRAZ',37.8267,-122.4230,28);marker('Palace of Fine Arts','PALACE',37.80292,-122.4484,42);marker('Warming Hut','WARMING HUT',37.80832,-122.47073,8);
 }
 marker(site.id==='kahului'?'Ho‘aloha beach launch':site.id==='shoreline'?'Boathouse launch':site.id==='third'?'Lower launch · concrete ramp':'Beach launch','LAUNCH',...site.launch,4,'launch');
 const buoy=new THREE.Group();buoy.position.set(-5,0,-4);scenery.add(buoy);mesh(buoy,new THREE.CylinderGeometry(.5,.65,.9,12),0xf1d7a8,0,.3,0);rod(buoy,0x59787c,[0,.7,0],[0,2.5,0],.04);box(buoy,0x4e8390,.45,2.2,0,.9,.45,.03);
 // Shore discoveries remain optional, and use the same on-foot collision path.
 g.castle.sites=landmarks.filter(l=>l.kind!=='launch'&&Math.hypot(l.x,l.z)<1800).slice(0,4).map((l,i)=>({id:site.id+'-'+i,name:l.name,x:l.x+12,z:l.z,text:l.name+' · '+site.subtitle+'. Head back to the water whenever you are ready.'}));
 return {landmarks,terrainMeshes,detail,update:s=>actors.forEach(f=>f(s)),actors:actors.length};
}
root.FoilLocationScenery={build};
})(globalThis);
