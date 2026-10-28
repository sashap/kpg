const test=require('node:test'),assert=require('node:assert/strict');
const W=require('./world.js'),{Session,sea}=require('./core.js'),gear=require('./wipeouts.js'),{tick,balance}=require('./test-pilot.cjs');
function crashAt(x,z,kind='strike',swell=0){const s=new Session(1,{free:true,conditions:{swell,gust:0}});Object.assign(s,{x,z,speed:8,height:.4,standing:true,standAmount:1});s.crash('Grounded',null,{kind});return s;}
function assertReady(s){
 assert.equal(!!s.fallMotion.needsSafeReset,false);assert.ok(s.fallMotion.gearRecovered&&s.fallMotion.wingCleared);assert.equal(s.board.motion,null);assert.equal(s.towing,false);assert.equal(s.fallMotion.leashesDetached,true);
 assert.ok(gear.clearEquipment(s.board.x,s.board.z,s,W,sea,{safe:true}));
 const f=s.fallMotion;assert.ok(gear.wingClear(s.board.x,s.board.z,f.heading,f.wingOffset,f.wingFore,s,W,sea));
}
test('a real beach crash releases both leashes, parks usable gear nearby and allows return without towing',()=>{
 const s=new Session(1,{free:true,conditions:{wind:10,windFrom:Math.PI/2,swell:0,gust:0}});Object.assign(s,{x:-207,z:20,heading:Math.PI,speed:10,height:.4,standing:true,standAmount:1,foiling:true,pitch:-.03,trim:.68});s.lastSafe={x:s.x,z:s.z};s.controls.trim=.68;
 for(let i=0;i<1000&&s.mode==='sailing';i++){s.controls.balance=balance(s);s.step(1/60);}
 assert.equal(s.fallMotion.kind,'beach-strike');assert.equal(s.towing,false);assert.ok(s.fallMotion.leashesDetached);const origin={...s.fallMotion.resetOrigin};
 tick(s,7);assert.equal(s.mode,'walking');assertReady(s);assert.ok(Math.hypot(s.board.x-origin.x,s.board.z-origin.z)<12,'Gear remains near the crash, not back at launch');
 const parked={x:s.board.x,z:s.board.z};s.controls.balance=-1;tick(s,4);assert.deepEqual({x:s.board.x,z:s.board.z},parked,'Walking cannot drag gear onto land');
 // Return with player movement controls, without towing the recovered board.
 for(let i=0;i<2400&&Math.hypot(s.x-parked.x,s.z-parked.z)>2;i++){const angle=Math.atan2(parked.x-s.x,parked.z-s.z),delta=Math.atan2(Math.sin(angle-s.heading),Math.cos(angle-s.heading));s.controls.steer=-Math.max(-1,Math.min(1,delta*4));s.controls.balance=Math.abs(delta)<.5?-1:0;s.step(1/60);}
 assert.ok(Math.hypot(s.x-parked.x,s.z-parked.z)<3.2);assert.ok(s.boardAgain());assert.equal(s.mode,'sailing');assert.equal(s.stats.crashes,1);
});
test('leave-board disconnects all gear and picking it up requires proximity',()=>{
 const s=crashAt(0,0,'fall');tick(s,7);s.x=s.board.x+1;s.z=s.board.z;if(!s.towing)s.toggleTow();assert.ok(s.towing);
 assert.ok(s.toggleTow());assert.equal(s.towing,false);assert.ok(s.fallMotion.leashesDetached);const board={x:s.board.x,z:s.board.z};s.x+=25;tick(s,2);assert.deepEqual({x:s.board.x,z:s.board.z},board);assert.equal(s.toggleTow(),false);assert.ok(s.fallMotion.leashesDetached);
 s.x=s.board.x+1;s.z=s.board.z;assert.ok(s.toggleTow());assert.equal(s.fallMotion.leashesDetached,false);assert.ok(s.towing);assert.ok(s.boardAgain());assert.equal(s.fallMotion,null);
});
test('a wide shallow beach searches beyond 20 metres and checks the complete wing as well as foil depth',()=>{
 const s=crashAt(0,0);s.board.motion=null;s.board.x=0;s.board.z=0;s.fallMotion.resetOrigin={x:0,z:0};s.config.swell=.3;s.lastSafe={x:200,z:0};
 const bed=(x,z)=>x<0?.5:x<28?-.7:-3,world={limit:500,bedHeight:bed,clearance(p,water){const low=Math.min(...[-1.2,0,1.2].map(d=>water-bed(p.x+d,p.z)))-.9;return {hit:low<=.12,foilClearance:low};}};
 const target=gear.recoveryTarget(s,world,sea);assert.ok(target);assert.ok(target.x>29&&Math.hypot(target.x,target.z)<32,'Nearest deep water, not the distant last-safe point');
 assert.ok(gear.wingClear(target.x,target.z,target.heading,target.wing.side,target.wing.fore,s,world,sea));
});
test('recovery rechecks equipment after an earlier successful placement',()=>{
 const s=crashAt(0,0,'fall');tick(s,7);assert.ok(s.fallMotion.gearRecovered);
 Object.assign(s.board,{x:-219,z:-20,motion:null});const bad={x:s.board.x,z:s.board.z};assert.equal(gear.clearEquipment(bad.x,bad.z,s,W,sea),false);
 tick(s,1);assertReady(s);assert.ok(Math.hypot(s.board.x-bad.x,s.board.z-bad.z)<20);
});
test('grounded gear at every location resets above the bottom with wave-trough clearance and can be boarded',()=>{
 try{for(const id of ['academy','shoreline','third','coyote','crissy','kahului']){
  W.activate(id);const base=W.geography?W.geography.project(W.location.launch):[-207,-8];let spot=null;
  for(let r=0;r<=35&&!spot;r+=1)for(let i=0;i<32;i++){const a=i*Math.PI/16,x=base[0]+Math.sin(a)*r,z=base[1]+Math.cos(a)*r,bed=W.bedHeight(x,z);if(bed<-.15&&bed>-.85){spot={x,z};break;}}
  assert.ok(spot,id+' has a shoreline test point');const s=crashAt(spot.x,spot.z,'beach-strike',.18);s.board.motion=null;s.mode='swimming';s.fallTime=0;s.fallMotion.wingAge=5.8;
  // The swimmer may already be inland. Placement stays anchored to impact.
  s.x=spot.x+35;s.z=spot.z+35;tick(s,.3);assertReady(s);assert.ok(Math.hypot(s.board.x-spot.x,s.board.z-spot.z)<80,id);
  const board={x:s.board.x,z:s.board.z};tick(s,10);assert.deepEqual({x:s.board.x,z:s.board.z},board,id+' does not repeatedly relocate as waves pass');
  s.mode='swimming';s.landRecovery=null;s.x=s.board.x;s.z=s.board.z;assert.ok(s.boardAgain(),id+' permits boarding without towing');assert.equal(s.stats.crashes,1);
 }}finally{W.activate('academy');}
});
