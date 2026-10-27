const test=require('node:test'),assert=require('node:assert/strict');
const locations=require('./locations.js'),harbor=require('./harbor-model.js'),elevation=require('./elevations.js');

test('Third Avenue keeps an open grass bank rising inland from the smooth golf trail',()=>{
 const g=locations.create('third'),edge=g.project([37.5745,-122.2835]),inland=g.project([37.5741,-122.2835]);
 assert.ok(g.openGolfBank(...edge));assert.ok(g.openGolfBank(...g.project([37.5737,-122.2803])));
 const low=g.terrainHeight(...edge),high=g.terrainHeight(...inland);
 assert.ok(low>2.7&&low<3.4);assert.ok(high>low+1&&high<7,'Retain the low measured hills, without vertical exaggeration');
 assert.equal(g.levee.length,0);for(const p of g.trail.points)assert.ok(Math.abs(g.walkHeight(...p)-3.15)<.001);
});

test('Kahului has northeast trades, a clear deep-water start and low beach access',()=>{
 const g=locations.create('kahului');assert.equal(locations.sites.length,6);assert.ok(Math.abs(-g.site.windFrom*180/Math.PI-45)<.001);
 assert.ok(g.bedHeight(0,0)<-3);assert.ok(g.harbor.breaks.length>=2);
 const a=g.project([20.89275,-156.4691]),b=g.project([20.89228,-156.46894]);let previous=g.terrainHeight(...a);assert.ok(previous<-1);
 for(let i=1;i<=80;i++){const t=i/80,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,y=g.terrainHeight(x,z);assert.ok(Math.abs(y-previous)<.35,'No vertical beach step');assert.ok(!g.blocked(x,z,.3,y),'Public launch stays clear');previous=y;}
 assert.ok(previous>.25&&previous<3.5);assert.ok(g.tanks.length>20);
});

test('Maui elevation data retains Haleakala and the West Maui mountains',()=>{
 assert.ok(elevation.height('kahului',20.71,-156.25)>2900,'Do not discard elevations above 3000 m during packing');
 assert.ok(elevation.height('kahului',20.88,-156.58)>600);assert.equal(elevation.waterDatum('kahului'),0);
});

test('Moored ships remain in water and have closed outward-facing hulls and solid collision',()=>{
 const g=locations.create('kahului');for(const s of g.harbor.ships){
  for(const p of s.points)assert.ok(g.signedShore(...p)<-3,'Hull does not overlap a quay');
  assert.equal(g.bedHeight(s.x,s.z),s.deck);assert.ok(g.blocked(s.x,s.z,.3,s.deck));
  const {positions:p,indices:idx}=harbor.hullGeometry(s),edges=new Map();let volume=0;
  for(let i=0;i<idx.length;i+=3){const ids=idx.slice(i,i+3),[a,b,c]=ids.map(k=>p.slice(k*3,k*3+3));volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
   for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(',');const e=edges.get(key)||{n:0,orientation:0};e.n++;e.orientation+=a<b?1:-1;edges.set(key,e);}}
  assert.ok(volume>10000,'Normals point outward');for(const e of edges.values()){assert.equal(e.n,2,'No open hull edges');assert.equal(e.orientation,0);}
 }
});

test('The commercial-port fence blocks passage; parking stays within mapped lots',()=>{
 const g=locations.create('kahului');for(const f of g.harbor.fences){const x=(f.a[0]+f.b[0])/2,z=(f.a[1]+f.b[1])/2;assert.ok(g.blocked(x,z,.32,g.walkHeight(x,z)));}
 assert.ok(g.parkingLayout.stalls.length>=50);assert.ok(g.parkingLayout.stalls.filter(s=>s.lot==='289835437').length>=24);
 for(const s of g.parkingLayout.stalls){const lot=g.parkingLayout.lots.find(l=>l.id===s.lot);for(const p of s.corners)assert.ok(locations.inside(...p,lot.points));}
});

test('Shoreline play scow has a continuous boarding ramp, clear entry and solid rails',()=>{
 const g=locations.create('shoreline'),m=g.playground;let previous=g.walkHeight(...m.point(10,0));
 for(let u=9.9;u>=0;u-=.1){const p=m.point(u,0),y=g.walkHeight(...p);assert.ok(Math.abs(y-previous)<.08);assert.ok(!g.blocked(...p,.28,y),'Board through the side opening');previous=y;}
 assert.equal(previous,m.deck);for(const [u,v] of [[-2.64,0],[2.64,4],[0,6.48]])assert.ok(g.blocked(...m.point(u,v),.28,m.deck));
});

test('Background landmarks retain mapped coordinates and distinct real-world scale',()=>{
 const g=locations.create('shoreline');const hangar=g.features.buildings.find(b=>b.style==='airship-hangar');assert.equal(hangar.name,'Hangar One');assert.equal(hangar.height,60);
 assert.ok(g.features.buildings.filter(b=>b.style==='bayview-canopy').length===2);
 const c=locations.create('coyote'),hotels=c.features.buildings.filter(b=>b.style==='waterfront-hotel');assert.equal(hotels.length,2);assert.ok(hotels.find(b=>/Hilton/.test(b.name)).height>hotels.find(b=>/Courtyard/.test(b.name)).height*2);
 const sf=locations.create('crissy');assert.ok(sf.features.piers.filter(p=>p.id.startsWith('landmark-')).length===3);assert.equal(sf.features.buildings.find(b=>b.style==='salesforce').height,326);
});

test('Kahului beach groins are visible above water and can be crossed without a blocking wall',()=>{
 const g=locations.create('kahului');assert.equal(g.harbor.groins.filter(b=>!b.low).length,3);
 for(const b of g.harbor.groins.filter(b=>!b.low)){const a=b.points[0],c=b.points[1],len=Math.hypot(c[0]-a[0],c[1]-a[1]),nx=-(c[1]-a[1])/len,nz=(c[0]-a[0])/len;assert.ok(g.terrainHeight(...a)>.2,'Groin connects to the dry beach');assert.ok(g.bedHeight((a[0]+c[0])/2,(a[1]+c[1])/2)>.5,'Rocks break the water surface');let previous=null;for(let d=-8;d<=8;d+=.1){const x=a[0]+nx*d,z=a[1]+nz*d,y=g.walkHeight(x,z);assert.ok(!g.blocked(x,z,.28,y));if(previous!==null)assert.ok(Math.abs(y-previous)<1.35,'Within the rock-scramble step height');previous=y;}}
});
test('Golden Gate includes continuous approach decks, both side spans and connected suspension cables',()=>{
 const g=locations.create('crissy'),b=require('./scenery-geometry.js').goldenGate(g.project,g.terrainHeight);assert.ok(Math.abs((b.end-b.start)*b.length-2737)<.01);assert.ok(Math.abs(b.side*b.length-343)<.01);
 for(const t of [-b.side,0,1,1+b.side]){assert.ok(b.samples.some(v=>Math.abs(v-t)<1e-8),'Shared deck vertices at every structural junction');assert.ok(Number.isFinite(b.cableY(t)));}
 assert.equal(b.cableY(0),227);assert.equal(b.cableY(1),227);assert.ok(b.start< -b.side&&b.end>1+b.side);
 for(let i=1;i<b.samples.length;i++){const a=b.point(b.samples[i-1]),c=b.point(b.samples[i]);assert.ok(Math.hypot(...c.map((v,j)=>v-a[j]))<16);}
});

test('six-seat canoe loop stays in sheltered public water with room for its hull and outrigger',()=>{
 const g=locations.create('kahului');for(let i=0;i<=180;i++){const p=harbor.canoeFrame(i*Math.PI*2/(180*.038),g.project);for(const side of [-2.5,.5])for(const fore of [-6.3,0,6.3]){const x=p.x+side*Math.cos(p.heading)+fore*Math.sin(p.heading),z=p.z-side*Math.sin(p.heading)+fore*Math.cos(p.heading);assert.ok(g.bedHeight(x,z)<-2,'Canoe clears sand, groins and quays');assert.ok(!g.blocked(x,z,.3,0));}}
 const a=harbor.canoeFrame(0,g.project),b=harbor.canoeFrame(Math.PI*2/.038,g.project);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-8,'Continuous loop without a teleport');
});

test('Coyote parking edge meets the promenade and the playground approach is walkable',()=>{
 const W=require('./world.js'),{Session,wrap,clamp}=require('./core.js');W.activate('coyote');try{const g=W.geography,p=g.promenade,r=p.ramps[1];
 assert.ok(Math.hypot(...g.project([37.58828,-122.33049]).map((v,i)=>v-[r.x,r.z][i]))<5,'Water access aligns with the west corner of the lot');
 let previous=g.walkHeight(r.x-r.nx*14,r.z-r.nz*14);for(let d=-13.9;d<=0;d+=.1){const x=r.x+r.nx*d,z=r.z+r.nz*d,y=g.walkHeight(x,z);assert.ok(Math.abs(y-previous)<.30,'No inland retaining step');previous=y;}
 const s=new Session(0,{free:true}),route=g.playground.approach;Object.assign(s,{mode:'walking',x:route[0][0],z:route[0][1],walkY:g.walkHeight(...route[0]),heading:0});
 for(const [x,z] of route.slice(1)){let reached=false;for(let i=0;i<7000;i++){const d=Math.hypot(x-s.x,z-s.z);if(d<.6){reached=true;break;}const error=wrap(Math.atan2(x-s.x,z-s.z)-s.heading);s.controls.steer=-clamp(error*4,-1,1);s.controls.balance=Math.abs(error)<.5?-Math.min(.5,d):0;s.step(1/60);}assert.ok(reached,JSON.stringify({target:[x,z],at:[s.x,s.z],mode:s.mode}));}
 const m=g.playground;for(let u=11;u>=0;u-=.1){const at=m.point(u,0);assert.ok(!g.blocked(...at,.25,g.walkHeight(...at)),'Open castle access ramp');}
 assert.ok(g.features.buildings.some(b=>b.style==='animal-shelter'));assert.equal(g.features.buildings.filter(b=>b.style==='shelter-solar').length,2);
 }finally{W.activate('academy');}
});
test('Third start is closer to the lower ramp, clear of the foil, with an open sailing reach',()=>{
 const W=require('./world.js'),{Session}=require('./core.js');W.activate('third');try{const s=new Session(0,{free:true}),g=W.geography,r=g.shoreAccess.ramp,d=Math.hypot(s.x-r.a[0],s.z-r.a[1]);assert.ok(d>100&&d<130);assert.ok(s.safety.foilClearance>1.5);for(let t=0;t<220;t+=5)assert.ok(g.bedHeight(s.x+Math.sin(s.heading)*t,s.z+Math.cos(s.heading)*t)<-1.2);s.x+=100;s.recover();assert.deepEqual([s.x,s.z],g.project(g.site.start));}finally{W.activate('academy');}
});

test('Coyote central gravel rigging triangle connects to its own clear concrete ramp',()=>{
 const W=require('./world.js'),{Session}=require('./core.js');W.activate('coyote');try{
  const g=W.geography,p=g.promenade,rig=p.rigging,r=rig.ramp,mapped=g.project([37.58849,-122.329827]);
  assert.ok(Math.hypot(r.x-mapped[0],r.z-mapped[1])<10);assert.equal(r.width,6);
  assert.ok(rig.contains(...g.project([37.58836,-122.32985])));assert.ok(rig.contains(rig.bench.x,rig.bench.z));
  assert.ok(Math.sin(rig.bench.angle)*r.nx+Math.cos(rig.bench.angle)*r.nz>.99,'Bench faces the water');
  assert.ok((rig.bench.x-r.x)*-r.nz+(rig.bench.z-r.z)*r.nx>5,'Bench is right of the ramp when facing the water');
  for(let d=3.2;d<=r.length;d+=.4)for(const across of [-2.5,0,2.5]){const x=r.x+r.nx*d-r.nz*across,z=r.z+r.nz*d+r.nx*across,y=g.walkHeight(x,z);assert.ok(!g.blocked(x,z,.28,y),'No wall across the ramp');assert.ok(Math.abs(y-p.rampAt(x,z).height)<.12,'Rocks cannot protrude onto the ramp');}
  const s=new Session(0,{free:true});s.dismount();Object.assign(s,{mode:'walking',x:r.x-r.nx*9,z:r.z-r.nz*9,walkY:g.walkHeight(r.x-r.nx*9,r.z-r.nz*9),heading:Math.atan2(r.nx,r.nz),jumpTime:0});s.controls.balance=-.55;
  for(let i=0;i<600;i++)s.step(1/60);assert.ok((s.x-r.x)*r.nx+(s.z-r.z)*r.nz>8,'Walk from the staging patch across the trail and down to water');
 }finally{W.activate('academy');}
});
