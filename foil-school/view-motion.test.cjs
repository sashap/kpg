const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('./view-motion.js'),{Session,sea}=require('./core.js');
function state(){const s=new Session(1,{free:true,conditions:{swell:0,gust:0}});s.stand();s.standAmount=1;s.foiling=true;s.height=.4;s.speed=8;return s;}
test('fixed-step flight draws at continuous speed on 30/60/120 Hz and uneven frames',()=>{
 for(const timings of [[1/30],[1/60],[1/120],[.009,.021,.012,.027,.008,.018]]){
  const m=create(),s=state(),step=1/60;let clock=0,accumulator=0,maxError=0;
  for(let i=0;i<600;i++){const dt=timings[i%timings.length];clock+=dt;accumulator+=dt;while(accumulator>=step){m.capture(s);s.x+=8*step;s.time+=step;accumulator-=step;}const rendered=m.sample(s,accumulator/step);maxError=Math.max(maxError,Math.abs(rendered.x-Math.max(0,clock-step)*8));assert.ok(rendered.x<=s.x+1e-8);}
  assert.ok(maxError<1e-8,JSON.stringify({timings,maxError}));
 }
});
test('render interpolation never writes back into the physics and turns across the angle wrap smoothly',()=>{
 const s=state(),m=create();s.heading=3.12;m.capture(s);s.x=1;s.heading=-3.12;s.wingDive.fold=.6;const r=m.sample(s,.5);assert.equal(s.x,1);assert.equal(s.heading,-3.12);assert.equal(s.wingDive.fold,.6);assert.equal(r.x,.5);assert.ok(Math.abs(r.heading-Math.PI)<1e-9);assert.equal(r.wingDive.fold,.3);
});
test('falls, aerial tricks, teleports and new sessions retain their exact poses',()=>{
 const s=state(),m=create();m.capture(s);s.mode='falling';s.x=1;assert.equal(m.sample(s,.1),s);s.mode='sailing';s.air={age:0};assert.equal(m.sample(s,.1),s);s.air=null;s.x=100;assert.equal(m.sample(s,.1),s);assert.equal(m.sample(state(),.1).x,0);
});
test('rendered foil altitude stays level between ticks even when short waves curve underneath it',()=>{
 const s=state(),m=create();s.setConditions({swell:.2,chop:1,waveLength:4});
 for(let i=0;i<120;i++){
  s.lastSea=sea(s.x,s.z,s.time,s.config.swell,s.config);s.height=.4-s.lastSea;m.capture(s);
  s.time+=1/60;s.x+=8/60;s.lastSea=sea(s.x,s.z,s.time,s.config.swell,s.config);s.height=.4-s.lastSea;
  for(const alpha of [0,.25,.5,.75,1])assert.ok(Math.abs(m.sample(s,alpha).boardY-.4)<1e-12);
 }
 // A real climb must move the render plane, rather than locking it to sea level.
 m.capture(s);s.height+=.12;assert.ok(Math.abs(m.sample(s,.5).boardY-.46)<1e-12);
});
