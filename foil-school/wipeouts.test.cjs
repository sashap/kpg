const test=require('node:test'),assert=require('node:assert/strict');
const W=require('./world.js'),{Session,sea}=require('./core.js'),motion=require('./wipeouts.js'),contacts=require('./water-contacts.js'),{tick,balance}=require('./test-pilot.cjs');
function setup(speed=8){const s=new Session(1,{free:true,conditions:{swell:0,gust:0,windFrom:-Math.PI/2}});Object.assign(s,{heading:0,standing:true,standAmount:1,speed,height:.7,pitch:.08,wingAngle:0,trim:.68});return s;}
test('slow aft-pressure breach throws rider back and board forward, with foil rotating toward the nose',()=>{
 const s=setup(4);s.balance=.7;s.height=.95;s.crash('Breach',null,{kind:'breach'});assert.equal(s.fallMotion.kind,'tail-breach');assert.ok(s.fallMotion.vz<0&&s.board.motion.vz>3);assert.ok(s.fallMotion.pitchRate<0&&s.board.motion.pitchRate>0);
 tick(s,.35);assert.ok(s.z<0&&s.board.z>1);assert.ok(s.board.motion.pitch>1);tick(s,7);assert.equal(s.mode,'swimming');assert.equal(s.board.motion,null);assert.equal(s.stats.crashes,1);
});
test('turning tip breaches mirror the skid, roll and rider separation on both sides',()=>{
 for(const side of [-1,1]){const s=setup();s.roll=side*.35;s.crash('Tip',null,{kind:'tip-breach',side});tick(s,.3);assert.ok(s.board.x*side>0&&s.x*side<0);assert.ok(s.z>s.board.z+.5);assert.ok(s.board.motion.roll*side<0);assert.ok(s.fallMotion.rollRate*side>0);}
});
test('an actual sustained high bank exposes a tip, but a normal-height carve remains recoverable',()=>{
 for(const side of [-1,1]){const s=setup();s.height=.80;s.foiling=true;s.roll=side*.36;s.steer=side;s.controls={steer:side,balance:0,trim:.68};tick(s,.4);assert.equal(s.fallMotion?.kind,'tip-breach');}
 const s=setup();s.height=.4;s.foiling=true;s.pitch=-.02;s.controls={steer:.65,balance:0,trim:.68};tick(s,1);assert.equal(s.stats.crashes,0);
});
test('nose dives can land on the wing, keeping damage and inversion until timed recovery / remount',()=>{
 const s=setup();s.crash('Nose caught',null,{kind:'nose-dive'});tick(s,1);assert.ok(s.fallMotion.damageWingUntil>5);assert.ok(s.fallMotion.wingInverted);assert.equal(s.boardAgain(),false);tick(s,6);assert.equal(s.fallMotion.wingInverted,true);s.x=s.board.x;s.z=s.board.z;assert.ok(s.boardAgain());assert.equal(s.fallMotion,null);
});
test('hard impacts crack equipment for five seconds, while slow bumps do not',()=>{
 for(const speed of [2,9]){const s=setup(speed);s.crash('Hit',null,{kind:'strike'});assert.equal(s.fallMotion.damageBoardUntil,speed===9?5:0);tick(s,6);assert.equal(s.mode,'swimming');s.x=s.board.x;s.z=s.board.z;assert.ok(s.boardAgain());}
});
test('fast real beach approach digs the foil, launches onto land and requires a short recovery',()=>{
 const s=setup(10);Object.assign(s,{x:-207,z:20,heading:Math.PI,height:.4,pitch:-.03,foiling:true});s.setConditions({wind:10,windFrom:Math.PI/2});s.controls.trim=.68;s.lastSafe={x:s.x,z:s.z};
 for(let i=0;i<1000&&s.mode==='sailing';i++){s.controls.balance=balance(s);s.step(1/60);}assert.equal(s.fallMotion.kind,'beach-strike');const impactZ=s.z;
 for(let i=0;i<180&&s.mode==='falling';i++)s.step(1/60);assert.equal(s.mode,'walking');assert.ok(s.z<impactZ-3);assert.ok(s.landRecovery);const point=[s.x,s.z];s.controls.balance=-1;tick(s,2);assert.deepEqual([s.x,s.z],point);assert.equal(s.jumpOnFoot(),false);tick(s,3);assert.equal(s.landRecovery,null);
});
test('solar-circulator overlap releases into deep clear water after recovery and remains towable',()=>{
 W.activate('shoreline');try{const [x,z]=W.geography.project([37.43356,-122.0910]),s=setup(3);Object.assign(s,{x:x+2.8,z,heading:Math.PI/2});s.lastSafe={x:x+7,z};s.crash('Circulator',null,{kind:'strike'});s.board.x=x+2.8;s.board.z=z;s.board.motion=null;s.x=x+5;s.z=z;
  tick(s,7);assert.equal(s.mode,'swimming');assert.ok(motion.clearEquipment(s.board.x,s.board.z,s,W,sea));assert.ok(s.fallMotion.gearRecovered);assert.equal(s.towing,false);s.x=s.board.x+1;s.z=s.board.z;assert.ok(s.toggleTow());s.heading=Math.PI/2;s.controls.balance=-1;const old=s.board.x;tick(s,2);assert.ok(s.board.x>old+.4);assert.ok(motion.clearEquipment(s.board.x,s.board.z,s,W,sea));
 }finally{W.activate('academy');}
});
test('swept water contacts cover fast crossings, moving foilers and vertical / lateral near misses',()=>{
 const c=contacts.create();c.add({kind:'buoy',x:0,z:0,w:1,d:1});const from={x:0,z:-5,height:.4,heading:0,speed:20},to={...from,z:5};assert.equal(c.sweep(from,to,1,.05,()=>0).kind,'buoy');assert.equal(c.sweep({...from,x:3},{...to,x:3},1,.05,()=>0),null);assert.equal(c.sweep({...from,height:5},{...to,height:5},1,.05,()=>0),null);
 const moving=contacts.create(),foiler={kind:'foiler',x:-4,z:0,w:1,d:2,sample:t=>({x:(t-.5)*8,z:0})};assert.equal(moving.sweep({x:0,z:0,height:.4,heading:0,speed:0},{x:0,z:0,height:.4,heading:0,speed:0},1,1,()=>0,[foiler]).kind,'foiler');
});
test('a moving foiler collision reaches both riders once and preserves crash recovery',()=>{
 W.waterContacts=contacts.create();try{let hits=0;const s=setup();s.x=0;s.z=-1.6;s.waterTraffic=[{id:'other',kind:'foiler',x:0,z:0,w:1,d:2,low:-1,high:2,onHit:()=>hits++}];s.step(1/60);assert.equal(s.mode,'falling');assert.equal(s.lastCollision.kind,'foiler');assert.equal(hits,1);tick(s,6);assert.equal(hits,1);assert.equal(s.stats.crashes,1);}finally{W.waterContacts=null;}
});
test('swimmers stop at a hull but can move outward if an object initially overlaps them',()=>{
 W.waterContacts=contacts.create();W.waterContacts.add({kind:'boat',x:0,z:0,w:2,d:4,low:-.3,high:1.2});
 try{const s=setup();s.dismount();Object.assign(s,{x:3,z:0,heading:-Math.PI/2,towing:false,jumpTime:0});s.controls.balance=-1;tick(s,3);assert.ok(s.x>1.25,'Cannot swim through the hull');s.x=.5;s.heading=Math.PI/2;s.controls.balance=-1;tick(s,3);assert.ok(s.x>4,'An existing overlap does not trap the swimmer');}finally{W.waterContacts=null;}
});
