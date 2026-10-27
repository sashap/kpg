const test=require('node:test'),assert=require('node:assert/strict'),H=require('./horses.js'),W=require('./world.js'),{Session}=require('./core.js');
const flat={limit:500,walkHeight:()=>1,blocked:()=>false};
function rider(world=flat){const h={id:'test',x:0,z:0,y:1,heading:0,speed:0,phase:0,pitch:0,roll:0,distance:0,mountTime:0},s={horse:h,horses:[h],mode:'riding',controls:{balance:0,steer:0},emit(){}};return s;}
const step=(s,world,seconds)=>{for(let t=0;t<seconds;t+=1/60)H.step(s,world,1/60);};
test('horse stick pressure covers walk, trot, canter and gallop; release brakes and backing stays slow',()=>{
 for(const [input,gait] of [[.25,'Walk'],[.56,'Trot'],[.79,'Canter'],[1,'Gallop']]){const s=rider();s.controls.balance=-input;step(s,flat,5);assert.equal(s.horse.gait,gait);assert.ok(Math.abs(s.horse.speed-H.targetSpeed(input))<.04);s.controls.balance=0;step(s,flat,2);assert.equal(s.horse.speed,0);const z=s.z;step(s,flat,1);assert.equal(s.z,z);s.controls.balance=1;step(s,flat,2);assert.ok(s.horse.speed<0&&s.horse.speed>=-1.05);}
});
test('swept full-length horse collision stops before fences, water and large steps at gallop',()=>{
 for(const world of [{...flat,blocked:(x,z)=>z>9.9&&z<10.1},{...flat,walkHeight:(x,z)=>z>10?-1:1},{...flat,walkHeight:(x,z)=>z>10?2:1}]){const s=rider();s.horse.speed=9;s.controls.balance=-1;step(s,world,3);assert.ok(s.z<9&&s.z>7,JSON.stringify(s.horse));assert.ok(s.horse.blocked);assert.ok(H.support(world,s.x,s.z,s.heading));}
});
test('horse follows a moderate slope and turns left for left input',()=>{const s=rider(),w={...flat,walkHeight:(x,z)=>1+z*.12};s.controls.balance=-.4;step(s,w,4);assert.ok(s.z>5);assert.ok(Math.abs(s.walkY-w.walkHeight(s.x,s.z))<1e-6);const a=s.heading;s.controls.steer=-1;step(s,w,.4);assert.ok(s.heading>a);});
test('mount and dismount require proximity, stable speed and clear dry footing',()=>{const s=rider();s.mode='swimming';s.horse=null;s.x=0;s.z=0;s.walkY=1;assert.equal(H.mount(s),false);s.mode='walking';s.x=10;assert.equal(H.mount(s),false);s.x=1;assert.equal(H.mount(s),true);s.horse.speed=4;assert.equal(H.dismount(s,flat),false);step(s,flat,2);assert.equal(s.horse.speed,0);assert.equal(H.dismount(s,{...flat,blocked:()=>true}),false);assert.equal(H.dismount(s,flat),true);assert.equal(s.mode,'walking');assert.equal(s.horse,null);assert.ok(Math.hypot(s.x,s.z)>=1.2);});
test('diagonal trot, four-beat walk and gallop suspension use distinct hoof timings',()=>{
 let suspension=0;const walkContacts=new Set();for(let i=0;i<200;i++){const phase=i*Math.PI*2/200,trot=[0,1,2,3].map(k=>H.foot(phase,k,3));assert.equal(trot[0].stance,trot[3].stance);assert.equal(trot[1].stance,trot[2].stance);const walk=[0,1,2,3].map(k=>H.foot(phase,k,1));walkContacts.add(walk.map(f=>+f.stance).join(''));if([0,1,2,3].every(k=>!H.foot(phase,k,8).stance))suspension++;for(const v of [1,3,5,8])for(let k=0;k<4;k++){const f=H.foot(phase,k,v);assert.ok(f.lift>=0&&f.lift<=.32);if(f.stance)assert.equal(f.lift,0);}}
 assert.ok(walkContacts.size>=4);assert.ok(suspension>0);
});
for(const id of ['academy','shoreline','third','coyote','crissy','kahului'])test(id+': find, mount, ride open ground and safely dismount without changing flight progress',()=>{
 W.activate(id);try{const s=new Session(),h=s.horses[0];assert.equal(s.horses.length,1);assert.ok(H.support(W,h.x,h.z,h.heading));s.dismount();const board={...s.board},stats={...s.stats};Object.assign(s,{mode:'walking',x:h.x+1.2,z:h.z,walkY:h.y});assert.equal(s.horseAction(),true);let best=0,heading=0;for(let i=0;i<32;i++){const a=i*Math.PI/16;let d=0;for(;d<35;d+=.3)if(!H.support(W,h.x+Math.sin(a)*d,h.z+Math.cos(a)*d,a))break;if(d>best){best=d;heading=a;}}assert.ok(best>8,id+' needs a usable route');h.heading=heading;s.controls.balance=-.3;for(let i=0;i<5*60;i++)s.step(1/60);assert.ok(h.distance>4);s.controls.balance=0;for(let i=0;i<60;i++)s.step(1/60);assert.equal(s.horseAction(),true);assert.equal(s.mode,'walking');assert.deepEqual(s.board,board);assert.deepEqual(s.stats,stats);assert.ok(!W.blocked(s.x,s.z,.32,s.walkY));}finally{W.activate('academy');}
});
test('Third staging path has no wall; parking fence gaps and car collision match shared layout',()=>{W.activate('third');try{const g=W.geography;assert.equal(g.levee.length,0);for(const s of g.levee)assert.ok(!g.shoreAccess.inStaging((s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2));assert.equal(g.solids.filter(s=>s.kind==='fence').length,g.shoreAccess.fences.length);for(const car of g.parkingLayout.stalls.filter(s=>s.parked))assert.ok(W.blocked(car.x,car.z,.3));}finally{W.activate('academy');}});
test('Academy horse waits near the water and climbs the castle stairs in both directions',()=>{
 W.activate('academy');const h=H.spawn(W)[0],s={horse:h,horses:[h],controls:{balance:0,steer:0}};assert.ok(Math.hypot(h.x-W.castle.dock.x,h.z-W.castle.dock.z)<28);let start=0,best=Infinity;W.castle.path.forEach((p,i)=>{const d=Math.hypot(p.x-h.x,p.z-h.z);if(d<best){start=i;best=d;}});const path=W.castle.path.filter((p,i)=>i>=start&&i%12===0),route=[...path,...path.slice(0,-1).reverse()];
 for(const p of route){let reached=false;for(let i=0;i<1500;i++){const d=Math.hypot(p.x-h.x,p.z-h.z);if(d<1.0){reached=true;break;}const a=Math.atan2(Math.sin(Math.atan2(p.x-h.x,p.z-h.z)-h.heading),Math.cos(Math.atan2(p.x-h.x,p.z-h.z)-h.heading));s.controls.steer=-Math.max(-1,Math.min(1,a*3));s.controls.balance=Math.abs(a)<.4?-.35:0;H.step(s,W,1/60);}assert.ok(reached,JSON.stringify({target:p,horse:h}));}assert.ok(h.distance>180);assert.ok(h.y<6);
});

test('walkers cannot pass through any side of a horse, but can approach, mount and escape overlap',()=>{
 W.activate('academy');const c=W.castle;
 for(const angle of [0,.7,Math.PI/2,Math.PI])for(const bearing of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const s=new Session(),h=s.horses[0];Object.assign(h,{x:c.x+4,z:c.z-3,y:c.floor,heading:angle});const a=angle+bearing;
  Object.assign(s,{mode:'walking',x:h.x+Math.sin(a)*3,z:h.z+Math.cos(a)*3,walkY:h.y,heading:a+Math.PI,speed:0,walkVelocity:0});s.controls={steer:0,balance:-1,trim:0};
  for(let i=0;i<150;i++){s.step(1/60);assert.ok(H.walkerClearance(h,s.x,s.z,s.walkY)>-1e-7,JSON.stringify({angle,bearing,x:s.x,z:s.z}));}
  assert.ok(Math.hypot(s.x-h.x,s.z-h.z)<2,'Can get close to mount');assert.ok(s.horseAction());assert.ok(s.horseAction());assert.ok(H.walkerClearance(h,s.x,s.z,s.walkY)>0,'Dismount lands clear of the horse');
 }
 const s=new Session(),h=s.horses[0];Object.assign(s,{mode:'walking',x:h.x,z:h.z,walkY:h.y});assert.equal(H.blocksWalker(s,h.x+.05,h.z,h.y),false,'Already overlapping can step outward');assert.equal(H.blocksWalker(s,h.x,h.z,h.y+3),false,'An overhead walkway is clear');
});
test('horse body collision follows its heading and new position after riding',()=>{
 const h=rider().horse,s={horses:[h],x:4,z:0,walkY:1};assert.ok(H.blocksWalker(s,.6,0,1));h.x=12;h.z=8;h.heading=Math.PI/2;assert.equal(H.blocksWalker(s,.6,0,1),false);assert.ok(H.blocksWalker(s,13.4,8,1));assert.equal(H.blocksWalker(s,12,9.1,1),false);
});
test('horse jump rises and lands once, cannot repeat in air, and blocks an airborne dismount',()=>{
 const s=rider();s.emit=()=>{};assert.ok(H.jump(s));assert.equal(H.jump(s),false);assert.equal(H.dismount(s,flat),false);let peak=0;for(let i=0;i<120;i++){H.step(s,flat,1/60);peak=Math.max(peak,s.horse.y);}assert.ok(peak>2.8&&peak<3.1);assert.equal(s.horse.jump,null);assert.equal(s.horse.y,1);assert.ok(H.jump(s));
});
test('a standing jump responds to forward or reverse even when pressed just after Space',()=>{
 const distances=[];
 for(const input of [-1,1,0]){const s=rider();H.jump(s);step(s,flat,.04);s.controls.balance=input;while(s.horse.jump)H.step(s,flat,1/60);distances.push(s.z);assert.equal(s.horse.y,1);}
 assert.ok(distances[0]>2.5&&distances[0]<3.5,JSON.stringify(distances));assert.ok(distances[1]<-1.7&&distances[1]>-2.5,JSON.stringify(distances));assert.equal(distances[2],0);
 const s=rider();s.horse.speed=8;s.controls.balance=-1;H.jump(s);while(s.horse.jump)H.step(s,flat,1/60);assert.ok(s.z>distances[0]*2,'A galloping jump travels farther than a standing hop');
});
test('jump travel resumes after rising clear of an obstacle, including from a partially mounted hood',()=>{
 const w={...flat,horseSurface:(x,z)=>z>=1&&z<=5?2.03:1,blocked:(x,z,r,y)=>z+r>=1&&z-r<=5&&y<2.03};
 for(const [z,y,input,passes] of [[0,1,-1,z=>z>1.4],[1.15,2.03,-1,z=>z>3.5],[1.15,2.03,1,z=>z<-.6]]){const s=rider(w);Object.assign(s.horse,{z,y});s.controls.balance=input;H.jump(s);while(s.horse.jump)H.step(s,w,1/60);assert.ok(passes(s.z),JSON.stringify(s.horse));assert.ok(Math.abs(s.horse.y-w.horseSurface(s.x,s.z))<1e-6);}
});
test('jump clears a low fence, while a tall wall and water still stop the horse',()=>{
 for(const [height,passes] of [[.7,true],[4,false]]){const w={...flat,blocked:(x,z,r,y)=>Math.abs(z-3)<.16+r&&y<1+height},s=rider(w);s.horse.speed=4;s.controls.balance=-.55;H.jump(s);step(s,w,1.8);assert.equal(s.z>3.5,passes,JSON.stringify(s.horse));}
 const w={...flat,walkHeight:(x,z)=>z>3?-2:1},s=rider(w);s.horse.speed=5;s.controls.balance=-.7;H.jump(s);step(s,w,2);assert.ok(s.z<=3&&s.horse.y===1);
});
test('Coyote horse waits by the central gravel triangle; new ramp armor reaches the wall without closing the ramp',()=>{
 W.activate('coyote');try{const g=W.geography,p=g.promenade,r=p.rigging.ramp,h=H.spawn(W)[0];assert.ok(Math.hypot(h.x-p.rigging.horse.x,h.z-p.rigging.horse.z)<3);assert.ok(Math.hypot(h.x-r.x,h.z-r.z)<22);assert.ok(p.nearest(p.rigging.bench.x,p.rigging.bench.z).distance<4);const rocks=g.shoreRocks.filter(r=>r.rampArmor);assert.ok(rocks.length>32);for(const rock of rocks){const d=(rock.x-r.x)*r.nx+(rock.z-r.z)*r.nz;assert.ok(Math.abs(rock.y+rock.ry-p.rampHeight(r,d)-.55)<.08);assert.equal(p.rampAt(rock.x,rock.z,Math.max(rock.rx,rock.rz)+.2),null);}assert.ok(rocks.some(b=>b.y+b.ry>2.8));}finally{W.activate('academy');}
});
test('horse can land on a real Coyote car roof, stand there and jump back to ground',()=>{
 W.activate('coyote');try{const g=W.geography,s=new Session(),h=s.horses[0];s.mode='riding';s.horse=h;let landed=null;
  search:for(const b of g.solids.filter(b=>b.kind==='car'))for(const reverse of [0,Math.PI]){const heading=b.car.angle+reverse,x=b.car.x-Math.sin(heading)*4.4,z=b.car.z-Math.cos(heading)*4.4,p=H.support(W,x,z,heading);if(!p)continue;Object.assign(h,{x,z,y:p.y,heading,speed:4.5,phase:0,mountTime:0,jump:null,jumpCooldown:0});s.controls={steer:0,balance:-.68,trim:0};H.jump(s);for(let i=0;i<100;i++){const air=!!h.jump;H.step(s,W,1/60);if(air&&!h.jump)break;}if(Math.abs(h.y-b.y-1.45)<1e-6&&Math.hypot(h.x-b.car.x,h.z-b.car.z)<1){landed=b;break search;}}
  assert.ok(landed,'A clear approach reaches a car roof');h.speed=0;s.controls.balance=0;step(s,W,.4);assert.ok(Math.abs(h.y-landed.y-1.45)<1e-6);assert.ok(H.jump(s));s.controls.balance=-.68;h.speed=4.5;step(s,W,2);assert.equal(h.jump,null);assert.ok(h.y<landed.y+.5,'Jumping down returns to the parking surface');
 }finally{W.activate('academy');}
});
