const test=require('node:test'),assert=require('node:assert/strict');
const {Session,wrap,clamp}=require('./core.js');
const {balance}=require('./test-pilot.cjs');
const knots=1.94384,dt=1/60;
function flight({wind=16,trim=.85,angle=-1,heading=Math.PI,assist=true,speed=6}={}){
 const s=new Session(1,{free:true,traffic:true,assist,conditions:{wind:wind/knots,windFrom:0,gust:0,swell:0}});
 Object.assign(s,{heading,speed,height:.4,vertical:0,standing:true,standAmount:1,foiling:true,trim,wingAngle:angle,wingTarget:angle,wingSide:Math.sign(angle)||-1,pitch:(90*9.81/(.5*1025*.18*speed**2)-.20)/4.8});
 s.controls.trim=trim;return s;
}
function tank(s,seconds,control=()=>{}){
 // An open-water force test: recenter between steps to exclude coastline,
 // course gates and travel distance from the measured steady-state speed.
 const samples=[];
 for(let i=0;i<seconds*60;i++){control(s);s.step(dt);samples.push({speed:s.speed,height:s.height,foil:s.foiling,mode:s.mode});s.x=s.z=0;}
 return samples;
}
test('sheeted direct-downwind runs sustain foil flight at a plausible fraction of wind speed',()=>{
 for(const wind of [16,20,24])for(const trim of [.68,.85,1])for(const angle of [-1,0,1]){
  const s=flight({wind,trim,angle}),samples=tank(s,35);
  assert.ok(samples.every(p=>p.foil&&p.mode==='sailing'&&p.height>.25),JSON.stringify({wind,trim,angle,speed:s.speed,height:s.height}));
  // A gameplay calibration range, not a universal real-world speed ratio.
  assert.ok(s.speed*knots>wind*.55&&s.speed*knots<wind*.70);
  assert.ok(Math.abs(s.speed-samples.at(-61).speed)<.01,'The measured run has settled');
 }
});
test('actual turns from either reach into downwind preserve momentum and height with centered body input',()=>{
 for(const side of [-1,1]){
  const s=flight({heading:side*Math.PI/2,angle:-side});
  const samples=tank(s,35,q=>q.controls.steer=clamp(-wrap(Math.PI-q.heading)*3,-.55,.55));
  assert.ok(Math.abs(wrap(s.heading-Math.PI))<.001);
  assert.ok(samples.every(p=>p.foil&&p.mode==='sailing'&&p.height>.25));
  assert.ok(samples.slice(1).every((p,i)=>(p.speed-samples[i].speed)/dt> -1.2),'No sudden braking at the wind axis');
  assert.ok(s.speed*knots>9.8&&s.speed*knots<10.1);
 }
});
test('a broad reach is faster than dead downwind and wind-powered running cannot outrun the wind',()=>{
 const run=flight(),reach=flight({heading:2*Math.PI/3});tank(run,35);tank(reach,35);
 assert.ok(reach.speed>run.speed*1.2&&reach.foiling);
 const fast=flight({speed:10});const samples=tank(fast,3);
 assert.ok(samples.every(p=>p.speed<10));assert.ok(samples.slice(1).every((p,i)=>p.speed<samples[i].speed));
 fast.speed=fast.wind;fast.lateralSpeed=0;assert.ok(Math.abs(fast.wingForces().forward)<1e-9);
 fast.speed=fast.wind+1;assert.ok(fast.wingForces().forward<0);
});
test('gliding is efficient but still consumes momentum and light air can require a broad reach',()=>{
 const glide=flight();glide.flagged=true;const samples=tank(glide,4);
 assert.ok(samples.every(p=>p.foil));assert.ok(glide.speed>4&&glide.speed<5.2);
 assert.ok(samples.slice(1).every((p,i)=>p.speed<samples[i].speed));
 tank(glide,26);assert.equal(glide.foiling,false);
 const light=flight({wind:12});tank(light,35);assert.equal(light.foiling,false);
});
test('direct mode still needs body trim; coached trim does not override deliberate nose-down input',()=>{
 const direct=flight({assist:false});tank(direct,30,q=>q.controls.balance=balance(q));assert.ok(direct.foiling&&direct.speed*knots>9.8);
 const centered=flight({assist:false});tank(centered,15);assert.equal(centered.foiling,false);
 const lower=flight();tank(lower,1.5,q=>q.controls.balance=-.5);assert.ok(lower.height<.2&&lower.vertical<-.1,'Forward pressure still lowers the foil');
});
test('downwind coaching reports apparent wind and does not call astern pressure choked',()=>{
 const s=flight({trim:1});s.sampleWind();assert.equal(s.powerInfo().code,'downwind');assert.match(s.powerInfo().detail,/Wind at the wing: .* kn/);
 s.heading=Math.PI/2;s.sampleWind();assert.equal(s.powerInfo().code,'oversheeted','The 90% reaching threshold remains');
});
