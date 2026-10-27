const test=require('node:test'),assert=require('node:assert/strict');
const {Session,LESSONS,sea,normalizeConditions}=require('./core.js');const {tick,balance,fly,maneuver,air}=require('./test-pilot.cjs');const {readProgress}=require('./lessons.js');
const dt=1/60;
function runCourse(index){const s=new Session(index),id=s.config.id;let detail='';
 if(id==='taxiing'){s.stand();s.controls.trim=.63;tick(s,15);}else if(id==='first-flights'||id==='sustained-flight')fly(s,id==='first-flights'?16:36);
 else if(id==='touch-and-go'){for(let j=0;j<2;j++){fly(s,10);s.controls.trim=.38;s.controls.balance=-.24;for(let i=0;i<360&&s.height>.025;i++)s.step(dt);fly(s,8);}}
 else if(id==='pumping'){s.stand();s.controls.trim=.68;tick(s,30,s=>{s.controls.balance=balance(s);if(!s.pumpHeld&&s.pumpCooldown===0&&s.stamina>.3)s.pumpDown();if(s.pumpCharge>.48)s.pumpUp();});}
 else if(id==='jibe'||id==='tack'){fly(s,16);maneuver(s,id==='jibe'?-s.wingSide:s.wingSide);}
 else if(id==='s-turns'){fly(s,12);for(const d of [-1,1,-1,1]){s.controls.steer=d*.6;tick(s,1.6,s=>s.controls.balance=balance(s));}s.controls.steer=0;fly(s,1);}
 else if(id==='carving'){fly(s,12);for(const d of [-1,1]){s.controls.steer=d*.7;tick(s,1.8,s=>s.controls.balance=balance(s));s.controls.steer=0;fly(s,.5);}}
 else if(id==='foot-switching'){fly(s,12);for(let j=0;j<2;j++){s.controls.balance=0;tick(s,.4);assert.ok(s.switchFeet());tick(s,2.5);}}
 else if(id==='wave-riding'||id==='downwind-gliding'){fly(s,14);if(id==='downwind-gliding'){s.controls.steer=-Math.sign(Math.sin(s.heading-s.windFrom))*.6;for(let i=0;i<300&&s.angle<2.65;i++){s.controls.balance=balance(s);s.step(dt);}s.controls.steer=0;}s.toggleFlag();tick(s,id==='wave-riding'?34:18,s=>{if(id==='wave-riding'){if(s.flagged&&s.speed<4.6)s.toggleFlag();else if(!s.flagged&&s.foiling&&s.speed>6.5)s.toggleFlag();}s.controls.balance=balance(s);if(!s.pumpHeld&&s.pumpCooldown===0&&s.stamina>.3)s.pumpDown();if(s.pumpCharge>.48)s.pumpUp();});}
 else{fly(s,14);detail=air(s,id);if(id==='popping'){fly(s,3);detail=air(s,id);}}
 assert.ok(s.complete,JSON.stringify({id,goals:s.goals(),detail,reason:s.fallReason}));assert.equal(s.stats.crashes,0);assert.ok(s.time<65);return s;
}
for(let index=0;index<LESSONS.length;index++)test('Course '+(index+1)+' · '+LESSONS[index].name+' is achievable from launch',()=>runCourse(index));
test('Every course works with each real location’s wind, launch tack and teaching waves',()=>{const world=require('./world.js');const issues=[];try{for(const site of ['shoreline','third','coyote','crissy','kahului']){world.activate(site);for(let i=0;i<LESSONS.length;i++){try{runCourse(i);}catch(e){issues.push(site+' · '+LESSONS[i].id+' · '+e.message);}}}assert.deepEqual(issues,[]);}finally{world.activate('academy');}});
test('touches, stance changes, S-turns and airs require the actual move and a clean exit',()=>{
 const s=new Session(2);fly(s,12);assert.equal(s.stats.touchGoes,0);s.controls.balance=-.24;s.controls.trim=.38;tick(s,3);assert.equal(s.stats.touchGoes,0,'Landing alone is not a touch-and-go');
 const feet=new Session(8);feet.stand();feet.switchFeet();tick(feet,3);assert.equal(feet.stance,-1);assert.equal(feet.stats.footSwitches,0,'Switching on the surface is practice only');
 const turns=new Session(5);turns.stand();turns.controls.trim=.6;for(const d of [-1,1,-1,1]){turns.controls.steer=d;tick(turns,1.6);}assert.equal(turns.stats.sTurns,0,'Taxi turns are not foiling S-turns');
 const pop=new Session(12);assert.equal(pop.popDown(),false);fly(pop,14);assert.ok(pop.popDown());tick(pop,.05);assert.equal(pop.popUp(),false);assert.equal(pop.air,null);assert.equal(pop.stats.pops,0);
 assert.ok(pop.popDown());tick(pop,.56,q=>q.controls.balance=balance(q));assert.ok(pop.popUp());pop.controls.balance=1;tick(pop,2);assert.ok(['falling','swimming'].includes(pop.mode));assert.equal(pop.stats.crashes,1);assert.equal(pop.stats.backflips,0,'An unfinished flip earns nothing');assert.equal(pop.stats.pops,0);
 tick(pop,4);assert.equal(pop.mode,'swimming');const entry=pop.drain().find(e=>e.type==='splashdown');assert.ok(entry&&Number.isFinite(entry.speed)&&Number.isFinite(entry.x)&&Number.isFinite(entry.z));
});
test('flagged wing stops wind drive; wave riding and gliding need the right heading and actual foil time',()=>{
 const s=new Session(10);fly(s,14);const powered=s.drive;assert.ok(s.toggleFlag());tick(s,.3,q=>q.controls.balance=balance(q));assert.equal(s.drive,0);assert.ok(powered>1);assert.equal(s.powerInfo().code,'flagged');
 s.setConditions({swell:0});const before=s.stats.waveTime;tick(s,1,q=>q.controls.balance=balance(q));assert.equal(s.stats.waveTime,before);assert.equal(s.stats.bestGlide,0,'Across-wind riding is not downwind gliding');
});
test('short bay chop remains bounded and safe for finite physics at every supported wavelength',()=>{
 for(const waveLength of [4,6,10,18,45,80]){const s=new Session(1,{free:true,conditions:{waveLength,chop:1,swell:.12}});fly(s,20);assert.equal(s.stats.crashes,0,JSON.stringify({waveLength,reason:s.fallReason}));assert.ok(s.stats.bestFlight>9);for(let t=0;t<30;t+=.1)assert.ok(Math.abs(sea(2,9,t,s.config.swell,s.config))<=s.config.swell);}
 const s=new Session(1,{conditions:{waveLength:4,swell:.6}});assert.equal(s.config.swell,.28,'Prevent an impossible height/spacing combination');
});
test('course records survive reordering; old course stars are archived without relabeling',()=>{
 const legacy=readProgress({version:1,lessons:{0:{stars:3,score:100},8:{stars:2}},bestFlight:18,bestScore:300,sound:false});assert.deepEqual(legacy.lessons,{});assert.equal(legacy.legacyLessons[0].stars,3);assert.equal(legacy.bestFlight,18);assert.equal(legacy.sound,false);
 const modern=readProgress({version:2,...legacy,lessons:{tack:{stars:3,score:500},'first-flights':{stars:2,score:80},fake:{stars:3},'frontflips':{stars:NaN}}});assert.deepEqual(Object.keys(modern.lessons),['tack','first-flights']);assert.equal(modern.legacyLessons[8].stars,2);assert.equal(new Set(LESSONS.map(l=>l.id)).size,19);
});
