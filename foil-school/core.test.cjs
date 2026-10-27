const test=require('node:test');const assert=require('node:assert/strict');const {Session,LESSONS,ISLANDS,sea,clamp,wrap}=require('./core.js');
const dt=1/60;
function tick(s,seconds,control){for(let i=0;i<Math.round(seconds/dt);i++){control?.(s,i);s.step(dt);}}
function balance(s){return clamp((.40-s.height)*2-s.vertical*1.7+(s.assist&&s.height>.10?0:(90*9.81/(.5*1025*.18*Math.max(3,s.speed)**2)-.3152)/.576),-.8,.8);}
function fly(s,seconds){s.stand();s.controls.trim=.68;tick(s,seconds,s=>s.controls.balance=balance(s));}
function maneuver(s,direction){const start=s.heading;let swapped=false;for(let i=0;i<600;i++){const delta=Math.abs(wrap(s.heading-start));s.controls.balance=balance(s);s.controls.steer=-direction;if(delta>1.05&&!swapped)s.controls.trim=.12;if(delta>1.55&&!swapped&&s.trim<.4){s.swapWing();swapped=true;}if(delta>1.9)s.controls.trim=.7;if(delta>2.65){s.controls.steer=0;break;}s.step(dt);}s.controls.steer=0;return swapped;}
test('no input cannot generate flight or score; standing alone cannot launch',()=>{const s=new Session(1);tick(s,20);assert.equal(s.stats.flightTime,0);assert.equal(s.score,0);s.stand();tick(s,20);assert.equal(s.stats.flightTime,0);assert.equal(s.speed,0);});
test('moderate sheeting creates more drive than oversheeting; upwind is a no-go zone',()=>{const moderate=new Session(0),over=new Session(0),up=new Session(0);for(const s of [moderate,over,up])s.stand();moderate.controls.trim=.68;over.controls.trim=1;up.controls.trim=.68;up.heading=0;tick(moderate,8);tick(over,8);tick(up,8);assert.ok(moderate.speed>over.speed*1.25);assert.ok(up.speed<.1);assert.equal(up.status,'In irons');});
test('launch requires speed and body pressure; long, level flight earns an increasing multiplier',()=>{const s=new Session(1);fly(s,26);assert.ok(s.stats.bestFlight>18);assert.equal(s.stats.crashes,0);assert.ok(s.height>.22&&s.height<.63);assert.ok(s.score>s.stats.flightTime*12);assert.ok(s.complete);});
test('sustained back-foot pressure breaches; easing and forward pressure allow a soft landing',()=>{const bad=new Session(1);bad.stand();bad.controls.trim=.68;bad.controls.balance=.65;tick(bad,20);assert.ok(bad.stats.crashes>0);const s=new Session(3);fly(s,18);s.controls.trim=0;s.controls.balance=-.35;tick(s,8);assert.equal(s.stats.landings,1);assert.equal(s.stats.crashes,0);assert.ok(s.height<.1);});
test('back pressure pitches up and climbs; forward pressure pitches down and descends in both control modes',()=>{
 for(const assist of [true,false]){
  const [front,neutral,back]=[-.35,0,.35].map(balance=>{
   const s=new Session(1,{free:true,assist,conditions:{wind:8.2,swell:0,gust:0}});
   Object.assign(s,{standing:true,standAmount:1,height:.4,speed:5.5,foiling:true,pitch:.024,trim:.68});
   s.controls={trim:.68,steer:0,balance};tick(s,.8);assert.equal(s.stats.crashes,0);return s;
  });
  assert.ok(back.pitch>neutral.pitch&&neutral.pitch>front.pitch);
  assert.ok(back.lift>neutral.lift&&neutral.lift>front.lift);
  assert.ok(back.pitch>0&&back.vertical>0&&back.height>.4);
  assert.ok(front.pitch<0&&front.vertical<0&&front.height<.4);
  const stopped=new Session(1,{free:true,assist,conditions:{wind:0,swell:0,gust:0}});
  stopped.stand();stopped.controls.balance=1;tick(stopped,3);
  assert.ok(stopped.pitch>0);assert.equal(stopped.lift,0);assert.equal(stopped.height,0);
 }
});
test('timed pumping beats button spam and consumes/replenishes energy',()=>{const s=new Session(6);s.stand();s.controls.trim=.65;tick(s,2);const before=s.speed;assert.ok(s.pumpDown());tick(s,.48);assert.ok(s.pumpUp()>.9);assert.ok(s.speed>before);assert.equal(s.stats.pumps,1);assert.ok(s.stamina<1);assert.equal(s.pumpDown(),true);assert.equal(s.pumpUp(),0);tick(s,.6);assert.ok(s.pumpDown());s.pumpUp();assert.equal(s.stats.pumps,1);tick(s,5);assert.ok(s.stamina>.95);});
test('hand transfer requires easing, and transfer alone earns no maneuver',()=>{const s=new Session(7);fly(s,15);assert.equal(s.swapWing(),false);assert.equal(s.wingSide,-1);s.controls.trim=.1;tick(s,1);assert.ok(s.swapWing());assert.equal(s.wingSide,1);tick(s,1);assert.equal(s.stats.jibes+s.stats.tacks,0);assert.equal(s.status,'Backwinded');});
test('wing transfer depends on apparent load, including feathering, gusts, oversheeting and backwinding',()=>{
 const cases=[
  {wind:8.2,speed:.7,heading:0,trim:.95,allowed:true},
  {wind:3,speed:0,heading:Math.PI/2,trim:1,allowed:true},
  {wind:0,speed:0,heading:0,trim:1,allowed:true},
  {wind:8.2,speed:6,heading:Math.PI/2,trim:.68,allowed:false},
  {wind:15,speed:3,heading:Math.PI/2,trim:.35,allowed:false},
  {wind:8.2,speed:6,heading:Math.PI/2,trim:1,allowed:false},
  {wind:8.2,speed:6,heading:Math.PI/2,trim:.9,wingSide:-1,allowed:false}
 ];
 for(const example of cases){const s=new Session(7,{free:true});s.stand();Object.assign(s,example);assert.equal(s.wingLoadInfo().light,example.allowed,JSON.stringify(example));assert.equal(s.swapWing(),example.allowed,JSON.stringify(example));if(example.allowed)assert.equal(s.swapWing(),false,'A second transfer must wait for the hand change');assert.equal(s.stats.jibes+s.stats.tacks,0);}
 const s=new Session(7,{free:true});s.stand();Object.assign(s,{wind:8.2,heading:Math.PI/2,trim:.68,speed:0});const slow=s.wingLoadInfo().newtons;s.speed=8;assert.ok(s.wingLoadInfo().newtons>slow,'Board speed contributes to apparent wind load');
});
test('left and right inputs turn and bank toward the same side of the rider',()=>{
 for(const direction of [-1,1]){const s=new Session(1,{free:true,conditions:{swell:0,gust:0}});Object.assign(s,{standing:true,standAmount:1,speed:5.5,height:.4,foiling:true});const heading=s.heading;s.controls={steer:direction,balance:0,trim:.68};tick(s,.5);assert.ok(wrap(s.heading-heading)*direction<0);assert.ok(s.roll*direction>0);}
});
test('jibe crosses downwind and tack crosses upwind, both require continuous foiling',()=>{for(const [index,direction,kind] of [[7,1,'jibes'],[9,-1,'tacks']]){const s=new Session(index);fly(s,18);assert.ok(maneuver(s,direction));assert.equal(s.stats[kind],1);assert.equal(s.stats.crashes,0);assert.ok(s.complete);const failed=new Session(index);failed.stand();failed.controls.steer=direction;tick(failed,10);assert.equal(failed.stats[kind],0);}});
test('waves and gusts are deterministic, varied, and controllable',()=>{const a=new Session(9),b=new Session(9);fly(a,35);fly(b,35);assert.equal(a.score,b.score);assert.deepEqual(a.stats,b.stats);assert.equal(a.height,b.height);assert.ok(a.stats.flightTime>25);assert.equal(a.stats.crashes,0);assert.notEqual(sea(0,0,0,.3),sea(0,0,2,.3));assert.notEqual(a.wind,a.config.wind);});
test('gates award once per crossing while on foil, never while stationary',()=>{const s=new Session(1);s.gate={x:0,z:0,heading:0};tick(s,1);assert.equal(s.stats.gates,0);fly(s,12);s.gate={x:s.x,z:s.z,heading:s.heading};const score=s.score;s.step(dt);assert.equal(s.stats.gates,1);assert.ok(s.score>=score+150);tick(s,.1);assert.equal(s.stats.gates,1);});
test('recover clears transient controls and movement, preserves earned session rewards',()=>{const s=new Session(1);fly(s,12);const points=s.score;s.controls.steer=1;s.pumpDown();s.recover();assert.equal(s.score,points);assert.equal(s.standing,false);assert.equal(s.pumpHeld,false);assert.equal(s.speed,0);assert.equal(s.flight,0);assert.deepEqual(s.controls,{steer:0,balance:0,trim:0});});
test('shore and outer boundary recover safely without infinite falling',()=>{const s=new Session(1);s.x=ISLANDS[0][0];s.z=ISLANDS[0][1];s.step(dt);assert.equal(s.stats.crashes,1);tick(s,3);assert.equal(s.x,0);assert.equal(s.fallTime,0);assert.equal(s.mode,'swimming');assert.ok(s.boardAgain());s.x=490;s.step(dt);assert.equal(s.stats.crashes,2);});
test('Free Foiling does not force a lesson completion; bad time steps do not corrupt the model',()=>{const s=new Session(1,{free:true});fly(s,20);assert.ok(s.progress().value>=s.config.goal);assert.equal(s.complete,false);const time=s.time;s.step(NaN);s.step(-1);assert.equal(s.time,time);});

test('wipeouts follow momentum and lost balance, splash down, and require an explicit remount',()=>{
 for(const [balance,steer] of [[-1,0],[1,0],[0,-1],[0,1]]){
  const s=new Session(1,{free:true,conditions:{swell:0,gust:0}});Object.assign(s,{standing:true,standAmount:1,height:.4,speed:4,heading:0,balance,steer,roll:steer*.3,score:250});s.stats.flightTime=12;
  s.crash('Lost balance');assert.equal(s.mode,'falling');assert.equal(s.boardAgain(),false);assert.equal(s.score,250);const y=s.walkY;tick(s,.15);assert.equal(s.mode,'falling');assert.ok(s.walkY>y-.1);if(steer)assert.ok(s.x*steer<0);assert.ok(s.z>0,'Forward momentum carries through the fall');if(balance)assert.ok(s.fallMotion.pitchRate*balance<0);
  tick(s,3);assert.equal(s.mode,'swimming');assert.equal(s.fallTime,0);assert.equal(s.stats.crashes,1);assert.equal(s.stats.flightTime,12);assert.equal(s.score,250);assert.ok(s.drain().some(e=>e.type==='splashdown'));tick(s,5);assert.equal(s.mode,'swimming');assert.ok(s.stand(),'Enter/Stand explicitly climbs aboard');assert.equal(s.mode,'sailing');assert.equal(s.standing,false);assert.equal(s.controls.trim,0);assert.equal(s.score,250);
 }
});

test('conditions change real wind direction and load without resetting the session',()=>{
 const s=new Session(1,{free:true,conditions:{gust:0,swell:0}});s.stand();s.controls.trim=.68;tick(s,5);
 const before={x:s.x,z:s.z,heading:s.heading,score:s.score,time:s.time,stats:{...s.stats},gate:{...s.gate}};
 s.setConditions({windFrom:s.heading,wind:8.2,gust:0});assert.ok(s.angle<1e-12);assert.ok(s.wingLoadInfo().light);assert.equal(s.powerInfo().code,'into-wind');
 for(const k of ['x','z','heading','score','time'])assert.equal(s[k],before[k]);assert.deepEqual(s.stats,before.stats);assert.deepEqual(s.gate,before.gate);
 tick(s,.2);assert.ok(s.drive<.001);
 s.setConditions({windFrom:s.heading-Math.PI/2});tick(s,.2);assert.ok(s.drive>1);
 const rotated=new Session(0,{conditions:{windFrom:-Math.PI/2,gust:0}});assert.ok(Math.abs(wrap(rotated.heading-rotated.windFrom)-Math.PI/2)<1e-12);
});
test('calm wind is finite and playable, and condition inputs are bounded',()=>{
 const s=new Session(1,{free:true,conditions:{wind:0,swell:0,gust:0}});s.stand();s.controls.trim=.68;tick(s,10);
 assert.equal(s.speed,0);assert.equal(s.height,0);assert.equal(s.powerInfo().drive,0);assert.equal(s.powerInfo().code,'calm');assert.match(s.coach(),/Conditions/);
 s.setConditions({wind:Infinity,swell:-5,cloud:8,sun:-2,waveLength:0,chop:4,windFrom:NaN});assert.equal(s.config.wind,0);assert.equal(s.config.swell,0);assert.equal(s.config.cloud,1);assert.equal(s.config.sun,0);assert.equal(s.config.waveLength,4);assert.equal(s.config.chop,1);
 s.setConditions({wind:8.2,swell:.08,waveLength:18,chop:.85});fly(s,25);assert.ok(s.stats.flightTime>15);assert.equal(s.stats.crashes,0);
});
test('small lively waves are quicker, bounded, directional and varied',()=>{
 const small={waveLength:18,chop:.85,waveDirection:Math.PI},long={waveLength:65,chop:.12,waveDirection:Math.PI};
 function sample(amp,shape){let max=0,energy=0,change=0,prev=sea(13,29,0,amp,shape);for(let i=1;i<=3600;i++){const h=sea(13,29,i/60,amp,shape);max=Math.max(max,Math.abs(h));energy+=h*h;change+=Math.abs(h-prev);prev=h;}return {max,frequency:change/Math.sqrt(energy/3600)};}
 const a=sample(.08,small),b=sample(.3,long);assert.ok(a.max<=.08&&b.max<=.3);assert.ok(a.max<b.max*.4);assert.ok(a.frequency>b.frequency*1.7,JSON.stringify({a,b}));
 for(const t of [0,3,11,25]){assert.equal(sea(4,8,t,0,small),0);assert.ok(Math.abs(sea(4,8,t,.1,{...small,waveDirection:small.waveDirection+Math.PI/2})-sea(-8,4,t,.1,small))<1e-12);}
 const noChop={...small,chop:0};assert.notEqual(sea(3,5,7,.08,small),sea(3,5,7,.08,noChop));
});
test('applying wave parameters rebases heave and preserves flight and exploration state',()=>{
 const s=new Session(1,{free:true,conditions:{swell:.02,gust:0}});Object.assign(s,{time:3,height:.4,speed:5.5,standing:true,standAmount:1,foiling:true,vertical:0,trim:.68,flight:9,score:150});s.controls.trim=.68;s.discoveries.add('courtyard');
 s.setConditions({swell:.6,waveLength:18,chop:.9,waveDirection:-Math.PI/2});assert.equal(s.height,.4);assert.equal(s.flight,9);assert.equal(s.score,150);assert.equal(s.lastSea,sea(s.x,s.z,s.time,s.config.swell,s.config));assert.ok(s.discoveries.has('courtyard'));
 s.step(dt);assert.ok(Math.abs(s.height-.4)<.04);assert.equal(s.stats.crashes,0);
 s.crash('Test fall');const above=s.walkY-sea(s.x,s.z,s.time,s.config.swell,s.config),motion={...s.fallMotion};s.setConditions({swell:0,waveLength:65});assert.ok(Math.abs(s.walkY-above)<1e-12);assert.deepEqual(s.fallMotion,motion);assert.equal(s.mode,'falling');
});
