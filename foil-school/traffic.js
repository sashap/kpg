/* Practice riders: seeded water-only courses, shared physics and instanced rigs. */
(function(root){'use strict';
const TAU=Math.PI*2;
function routes(world,windFrom,seed=12389){const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},out=[],lake=world.location.id==='shoreline',axis=windFrom+Math.PI/2;
 for(let attempt=0;attempt<1800&&out.length<25;attempt++){
  const r=45+random()*(lake?155:360),a=random()*TAU,cx=Math.sin(a)*r,cz=Math.cos(a)*r,long=lake?30+random()*35:55+random()*65,short=12+random()*15,points=[];
  for(let i=0;i<96;i++){const p=i/96*TAU,u=Math.cos(p)*long,v=Math.sin(p)*short,x=cx+u*Math.sin(axis)+v*Math.cos(axis),z=cz+u*Math.cos(axis)-v*Math.sin(axis);const ex=cx+Math.cos(p)*(long+12)*Math.sin(axis)+Math.sin(p)*(short+(lake?12:25))*Math.cos(axis),ez=cz+Math.cos(p)*(long+12)*Math.cos(axis)-Math.sin(p)*(short+(lake?12:25))*Math.sin(axis);if([[x,z],[x-2,z],[x+2,z],[x,z-2],[x,z+2],[ex,ez]].some(([px,pz])=>world.bedHeight(px,pz)>-1.8))break;points.push({x,z});}
  if(points.length===96&&[-.6,0,.6].every(u=>[-.6,0,.6].every(v=>world.bedHeight(cx+u*long*Math.sin(axis)+v*short*Math.cos(axis),cz+u*long*Math.cos(axis)-v*short*Math.sin(axis))< -1.8)))out.push({cx,cz,long,short,axis,phase:random()*TAU,speed:3.5+random()*1.6});
 }
 return out;
}
function position(route,time,wind=8){const phase=route.phase+time*route.speed/route.long*Math.min(1.2,Math.max(0,(wind-2)/5)),u=Math.cos(phase)*route.long,v=Math.sin(phase)*route.short,dx=-Math.sin(phase)*route.long*Math.sin(route.axis)+Math.cos(phase)*route.short*Math.cos(route.axis),dz=-Math.sin(phase)*route.long*Math.cos(route.axis)-Math.cos(phase)*route.short*Math.sin(route.axis);return {x:route.cx+u*Math.sin(route.axis)+v*Math.cos(route.axis),z:route.cz+u*Math.cos(route.axis)-v*Math.sin(route.axis),heading:Math.atan2(dx,dz),phase};}
function create({THREE,scene,world,sea}){
 const group=new THREE.Group();scene.add(group);const visitSeed=globalThis.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967295);const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),parts={},object=new THREE.Object3D(),base=new THREE.Object3D(),human=new THREE.Object3D(),wing=new THREE.Object3D(),matrix=new THREE.Matrix4(),Y=V(0,1,0),palette=[0xe5b764,0xc56f61,0x7baca4,0xa7bb72,0x6196bc],white=new THREE.Color(0xffffff);
 function part(name,geo,color,capacity=25){const material=new THREE.MeshStandardMaterial({color,roughness:.75,side:name==='canopy'?THREE.DoubleSide:THREE.FrontSide}),mesh=new THREE.InstancedMesh(geo,material,capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;group.add(mesh);parts[name]={mesh,index:0};}
 const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,10,7),cylinder=new THREE.CylinderGeometry(1,1,1,8);
 part('board',sphere,0xe1e8e2);part('deck',cube,0x727f7f);part('foil',sphere,0x30454b,50);part('mast',cube,0x35464c);part('body',new THREE.CylinderGeometry(.19,.14,.48,10),0x273d45);part('hips',sphere,0x283c45);part('head',sphere,0xc59b80);part('helmet',sphere,0xe1b866);part('legs',cylinder,0x243a42,100);part('arms',cylinder,0xc1987a,100);part('feet',cube,0x2d4146,50);part('wake',new THREE.ConeGeometry(.12,4,8),0xb1d4cb,50);
 // Same pressurized, swept planform as the player's Mantis-inspired wing.
 const point=(x,t)=>{const w=Math.abs(x)/2.125,front=.80-.21*x*x,chord=.22+1.58*Math.pow(1-w,.65);return V(x,.12+w*.12+Math.sin(Math.PI*Math.pow(t,.75))*.30*(1-w*.65),front-chord*t);};
 const positions=[],indices=[],colors=[],curve=[],trail=[];for(let i=0;i<=32;i++){const x=(i/32-.5)*4.25;curve.push(point(x,0));trail.push(point(x,1));for(let j=0;j<=12;j++){positions.push(...point(x,j/12).toArray());const panel=j===12||Math.abs(x)<.12||Math.abs(x)>.95&&Math.abs(x)<1.35?new THREE.Color(0x35464b):new THREE.Color(0xffffff);colors.push(panel.r,panel.g,panel.b);if(i<32&&j<12){const a=i*13+j;indices.push(a,a+13,a+1,a+1,a+13,a+14);}}}
 const canopy=new THREE.BufferGeometry();canopy.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));canopy.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));canopy.setIndex(indices);canopy.computeVertexNormals();part('canopy',canopy,0xffffff);parts.canopy.mesh.material.vertexColors=true;
 const leadingCurve=new THREE.CatmullRomCurve3(curve),leadingGeo=new THREE.TubeGeometry(leadingCurve,48,.105,8,false),lp=leadingGeo.attributes.position;
 for(let ring=0;ring<=48;ring++){const c=leadingCurve.getPointAt(ring/48),scale=.65+.35*(1-Math.abs(c.x)/2.125);for(let j=0;j<=8;j++){const k=ring*9+j,p=V().fromBufferAttribute(lp,k).sub(c).multiplyScalar(scale).add(c);lp.setXYZ(k,p.x,p.y,p.z);}}leadingGeo.computeVertexNormals();part('tube',leadingGeo,0x29383d);
 part('trailing',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trail),40,.016,5,false),0x34464a);
 const strutPoints=Array.from({length:17},(_,j)=>point(0,j/16).add(V(0,-.08,0)));part('strut',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strutPoints),20,.075,7,false),0x29383d);part('tips',sphere,0x29383d,100);

 function put(name,parent,x,y,z,sx=1,sy=sx,sz=sx,rotation=null,color=null){const p=parts[name];object.position.set(x,y,z);object.scale.set(sx,sy,sz);object.quaternion.identity();if(rotation)object.quaternion.copy(rotation);object.updateMatrix();matrix.multiplyMatrices(parent.matrixWorld,object.matrix);p.mesh.setMatrixAt(p.index,matrix);if(color)p.mesh.setColorAt(p.index,new THREE.Color(color));p.index++;}
 function limb(name,a,b,r){const from=V(...a),to=V(...b),d=to.clone().sub(from),q=new THREE.Quaternion().setFromUnitVectors(Y,d.clone().normalize()),m=from.add(to).multiplyScalar(.5);put(name,human,m.x,m.y,m.z,r,d.length(),r,q);}
 let routeList=[],pilots=[],lastWind=null,count=5,expertRatio=.6,state=[],lastTime=null;
 function setCount(n){count=Math.max(0,Math.min(25,Math.round(Number(n)||0)));group.visible=count>0;}
 function setExpertRatio(n){expertRatio=Math.max(0,Math.min(1,Number(n)||0));}
 function update(s,dt=0){if(!count){state=[];lastTime=s.time;return;}if(lastWind===null||Math.abs(Math.atan2(Math.sin(lastWind-s.config.windFrom),Math.cos(lastWind-s.config.windFrom)))>.12){routeList=routes(world,s.config.windFrom,visitSeed);lastWind=s.config.windFrom;pilots=routeList.map((r,i)=>FoilTrafficPilot.create(world,r,i,visitSeed+i*781));lastTime=s.time;}
  const elapsed=lastTime===null?0:Math.max(0,Math.min(.1,s.time-lastTime));lastTime=s.time;
  for(const p of Object.values(parts))p.index=0;state=[];
  for(let i=0;i<Math.min(count,pilots.length);i++){const pilot=pilots[i],expert=i<Math.round(count*expertRatio);for(let t=0;t<elapsed;t+=1/60)pilot.update(Math.min(1/60,elapsed-t),s,expert);const r=pilot.s,p={x:r.x,z:r.z,heading:r.heading,phase:pilot.phase+s.time*.3},distance=Math.hypot(p.x-s.x,p.z-s.z),off=r.mode!=='sailing';
   state.push({...p,depth:-world.bedHeight(p.x,p.z),expert,mode:r.mode,speed:r.speed,height:r.height,foiling:r.foiling,pumps:r.stats.pumps,falls:r.stats.crashes,wingSide:r.wingSide,wingAngle:r.wingAngle,windFrom:r.windFrom,trim:r.trim});
   const flight=off?0:r.height,bx=off?r.board?.x??p.x:p.x,bz=off?r.board?.z??p.z:p.z,bh=off?r.board?.heading??p.heading:p.heading,motion=off?r.board?.motion:null,y=motion?motion.y:sea(bx,bz,s.time,s.config.swell,s.config)+flight,fade=1;base.position.set(bx,y,bz);base.rotation.set(off?-(motion?.pitch||0):-r.pitch,bh,off?motion?.roll||0:r.roll,'YXZ');base.scale.setScalar(fade);base.updateMatrixWorld();
   human.position.copy(base.position);human.quaternion.copy(base.quaternion);human.scale.copy(base.scale);
   if(off){human.position.set(r.x,r.mode==='falling'?r.walkY-.9:sea(r.x,r.z,s.time,s.config.swell,s.config)-.03,r.z);human.rotation.set(r.mode==='falling'?r.fallMotion?.pitch||0:Math.PI/2,r.heading,r.mode==='falling'?r.fallMotion?.roll||0:0,'YXZ');}human.updateMatrixWorld();
   put('board',base,0,.08,0,.34,.11,.91);put('deck',base,0,.178,-.15,.47,.025,1.1);put('mast',base,0,-.37,-.05,.055,.80,.12);put('foil',base,0,-.77,.12,.65,.035,.18);put('foil',base,0,-.73,-.52,.25,.025,.11);
   const crouch=-r.pumpCharge*.13+Math.sin(p.phase)*.015,hip=.94+crouch;put('hips',human,0,hip,0,.16,.15,.12);put('body',human,0,hip+.26,0);put('head',human,0,hip+.66,.015,.105,.14,.10);put('helmet',human,0,hip+.74,.0,.112,.08,.11,null,palette[i%5]);
   for(const side of [-1,1]){const foot=[side*.08,.22,side*.31],knee=[side*.11,.57+crouch,.12+side*.22];put('feet',human,...foot,.10,.07,.24);limb('legs',[side*.105,hip,0],knee,.072);limb('legs',knee,foot,.048);}
   pilot.renderAngle+=(r.wingAngle-pilot.renderAngle)*(1-Math.exp(-Math.max(dt,elapsed)*5));const wingAngle=pilot.renderAngle;
   wing.position.set(-wingAngle*.40,off?.22:1.95+crouch,.25);wing.rotation.set(off?.04:.05+r.trim*.30,-wingAngle*.15,off?.03:wingAngle*(.82+r.trim*.10));wing.scale.set(1,1,1);wing.updateMatrix();wing.matrixWorld.multiplyMatrices(base.matrixWorld,wing.matrix);if(off&&r.fallMotion){const at=FoilWipeouts.wingLanding(r);wing.position.set(at.x,sea(at.x,at.z,s.time,s.config.swell,s.config)+(r.fallMotion.wingInverted?.52:.18),at.z);wing.rotation.set(.035,r.fallMotion.heading,r.fallMotion.wingInverted?Math.PI:.03,'YXZ');wing.updateMatrix();wing.matrixWorld.copy(wing.matrix);}
   put('canopy',wing,0,0,0,1,1,1,null,palette[i%5]);put('tube',wing,0,0,0);put('trailing',wing,0,0,0);put('strut',wing,0,0,0);for(const x of [-2.125,2.125])for(const t of [0,1])put('tips',wing,...point(x,t).toArray(),t?.045:.069);
   for(const a of [-1,1]){const hand=off?V(a*.28,1.25,.28+Math.sin(s.time*3+a)*.12):V(0,-.11,a*.27).applyMatrix4(wing.matrix),elbow=[a*.27-wingAngle*.12,off?1.0:1.48+crouch,.14+a*.12];limb('arms',[a*.19,hip+.43,0],elbow,.048);limb('arms',elbow,hand.toArray(),.035);}
   if(!off&&r.speed>1.5)for(const side of [-1,1]){const q=new THREE.Quaternion().setFromUnitVectors(Y,V(side*.10,0,-1).normalize());put('wake',base,side*.22,-flight+.025,-2,.28,.85,.12,q);}
  }
  for(const p of Object.values(parts)){p.mesh.count=p.index;p.mesh.instanceMatrix.needsUpdate=true;if(p.mesh.instanceColor)p.mesh.instanceColor.needsUpdate=true;}
 }
 function contacts(){return pilots.slice(0,count).map((p,i)=>{const r=p.s,b=r.mode==='sailing'?r:r.board||r;return {id:'foiler-'+i,kind:'foiler',x:b.x,z:b.z,heading:b.heading,w:1.0,d:2.0,low:-.9,high:2.4+(r.height||0),vx:Math.sin(r.heading)*r.speed,vz:Math.cos(r.heading)*r.speed,time:lastTime,onHit:()=>{if(r.mode==='sailing')r.crash('Collision with another foiler.',null,{kind:'strike'});}};});}
 return {contacts,setCount,setExpertRatio,update,diagnostics:()=>({count,expertRatio,visitSeed,active:state.length,rendered:count?parts.board.mesh.count:0,riders:state})};
}
const api={routes,position,create};root.FoilTraffic=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
