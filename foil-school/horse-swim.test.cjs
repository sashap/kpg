const test=require('node:test'),assert=require('node:assert/strict'),H=require('./horses.js'),W=require('./world.js'),{Session,sea}=require('./core.js'),Contacts=require('./water-contacts.js');
const beach={limit:500,walkHeight:(x,z)=>Math.max(-5,Math.min(1,1-z*.20)),blocked:()=>false};
function rider(world=beach,x=0,z=0,heading=0){const h={id:'test',x,z,y:Math.max(world.walkHeight(x,z),-1.18),heading,speed:0,phase:0,pitch:0,roll:0,distance:0,mountTime:0},events=[],s={horse:h,horses:[h],mode:'riding',time:0,config:{swell:0},controls:{balance:0,steer:0},emit(type,event){events.push({type,...event});},events};return s;}
function step(s,w,seconds,wave){for(let t=0;t<seconds;t+=1/60){s.time+=1/60;H.step(s,w,1/60,wave);}}
test('horse walks into shallows, swims with rider, turns and returns to dry land',()=>{
 const s=rider(),h=s.horse;s.controls.balance=-1;step(s,beach,12);assert.ok(s.z>20);assert.equal(h.gait,'Swimming');assert.ok(h.swimming&&h.swim===1);assert.ok(Math.abs(h.y+1.18)<.02);assert.ok(h.speed<=2.25+.001);assert.equal(s.mode,'riding');assert.equal(s.walkY,h.y);assert.equal(H.jump(s),false);
 s.controls.balance=0;step(s,beach,1);const z=s.z,phase=h.phase;step(s,beach,1);assert.equal(s.z,z);assert.ok(h.phase>phase,'Stationary horse keeps paddling');
 s.controls.steer=-1;step(s,beach,Math.PI/1.55);s.controls.steer=0;s.controls.balance=-1;step(s,beach,20);assert.ok(s.z<2);assert.equal(h.swimming,false);assert.ok(h.y>0);assert.ok(H.jump(s));assert.equal(s.events.filter(e=>e.type==='horse-swim').length,1);
});
test('horse trapped on the wet side of a rock can back into the water and turn away',()=>{
 const w={...beach,walkHeight:(x,z)=>Math.max(-5,-.2-z*.2),blocked:(x,z,r)=>z< -1.7&&Math.abs(x)<3+r},s=rider(w,0,1,Math.PI);s.controls.balance=-1;step(s,w,3);assert.ok(s.horse.blocked);s.controls.balance=1;step(s,w,8);assert.ok(s.z>4&&!s.horse.blocked);s.controls.balance=0;s.controls.steer=-1;const a=s.heading;step(s,w,1);assert.ok(Math.abs(s.heading-a)>.5);
});
test('deep-water dismount, stationary buoyancy and remount do not lose the horse',()=>{
 const w={...beach,walkHeight:()=>-6},s=rider(w);step(s,w,1);assert.ok(H.dismount(s,w));assert.equal(s.mode,'swimming');const h=s.horses[0],x=h.x,z=h.z,p=h.phase;for(let i=0;i<180;i++){s.time+=1/60;H.idle(s,w,1/60,(x,z,t)=>Math.sin(t)*.2);}assert.equal(h.x,x);assert.equal(h.z,z);assert.ok(h.phase>p);assert.ok(Math.abs(h.y+1.18-Math.sin(s.time)*.2)<.05);assert.ok(H.nearby(s));assert.ok(H.mount(s));assert.equal(s.mode,'riding');assert.equal(s.horse,h);
});
test('horse jumps off a bank into water, lands afloat, and cannot jump in deep water',()=>{
 const w={...beach,walkHeight:(x,z)=>z>3?-6:1},s=rider(w);s.horse.speed=5;s.controls.balance=-.7;assert.ok(H.jump(s));step(s,w,3);assert.ok(s.z>5);assert.equal(s.horse.jump,null);assert.ok(s.horse.swimming);assert.ok(Math.abs(s.horse.y+1.18)<.03);assert.ok(s.events.some(e=>e.type==='horse-land'&&e.water));assert.equal(H.jump(s),false);
});
test('swimming collision blocks boats, lets the horse back away, and lets it escape initial overlap',()=>{
 const waterContacts=Contacts.create(),w={...beach,walkHeight:()=>-6,waterContacts};waterContacts.add({id:'boat',x:0,z:6,w:4,d:2,low:-1,high:2});const s=rider(w);s.controls.balance=-1;step(s,w,5);assert.ok(s.z<3.6&&s.horse.blocked);s.controls.balance=1;step(s,w,3);assert.ok(s.z<2&&!s.horse.blocked);Object.assign(s.horse,{x:0,z:4,y:-1.18,speed:0});step(s,w,3);assert.ok(s.z<3,'An overlapping hull cannot trap the horse');
});
test('swimming respects the world boundary and waves without sinking toward the seabed',()=>{
 const w={...beach,limit:30,walkHeight:()=>-200},s=rider(w);s.controls.balance=-1;const wave=(x,z,t)=>.25*Math.sin(t*1.5);for(let i=0;i<900;i++){step(s,w,1/60,wave);assert.ok(Math.abs(s.horse.y-(wave(s.x,s.z,s.time)-1.18))<.12);}assert.ok(s.z<27&&s.horse.blocked);s.controls.balance=1;step(s,w,2,wave);assert.ok(!s.horse.blocked);
});
for(const id of ['academy','shoreline','third','coyote','crissy','kahului'])test(id+': mounted swimming and water remount preserve the board and lesson score',()=>{
 W.activate(id);try{const s=new Session(),h=s.horses[0];s.dismount();const board={...s.board},stats={...s.stats};Object.assign(h,{x:s.x,z:s.z,y:-1.18,heading:s.heading,mountTime:0});Object.assign(s,{mode:'riding',horse:h,walkY:h.y});s.config.swell=.12;s.controls={balance:-1,steer:0,trim:0};for(let i=0;i<180;i++)s.step(1/60);assert.ok(h.swimming&&!h.blocked);assert.ok(h.distance>2);s.controls.balance=0;for(let i=0;i<90;i++)s.step(1/60);assert.ok(s.horseAction());assert.equal(s.mode,'swimming');assert.ok(s.horseAction());assert.equal(s.mode,'riding');assert.deepEqual(s.board,board);assert.deepEqual(s.stats,stats);}finally{W.activate('academy');}
});
for(const id of ['third','coyote'])test(id+': ride the actual launch ramp into water and back up onto land',()=>{
 W.activate(id);try{const s=new Session(),h=s.horses[0],r=id==='third'?W.geography.shoreAccess.ramp:W.geography.promenade.rigging.ramp,a=id==='third'?r.a:[r.x-r.nx*4,r.z-r.nz*4],heading=id==='third'?Math.atan2(r.b[0]-r.a[0],r.b[1]-r.a[1]):Math.atan2(r.nx,r.nz);Object.assign(h,{x:a[0],z:a[1],heading,y:H.ground(W,...a),mountTime:0});Object.assign(s,{mode:'riding',horse:h});s.config.swell=0;s.controls.balance=-1;let waded=false;for(let i=0;i<3600;i++){s.step(1/60);waded ||=h.gait==='Wading';assert.equal(h.blocked,false);if(h.depth>1.6)break;}assert.ok(waded&&h.swimming);s.controls.balance=1;for(let i=0;i<18000;i++){s.step(1/60);assert.equal(h.blocked,false,'The ramp must also be clear on the way out');if(h.depth===0&&h.y>.5)break;}assert.ok(h.y>.5&&!h.swimming);assert.equal(s.mode,'riding');}finally{W.activate('academy');}
});
