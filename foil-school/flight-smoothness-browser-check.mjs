import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot}){
 await click('begin');
 const result=await evaluate(`(()=>{
  const results=[];
  const cases=[30,60,120].flatMap(hz=>[0,.12].map(swell=>({hz,swell,heading:Math.PI/2}))).concat([-2.2,2.2].map(heading=>({hz:60,swell:.12,heading})));
  for(const {hz,swell,heading} of cases){
   foilTest.start(1,{free:true,conditions:{swell,chop:.8,waveLength:6,wind:8.5,gust:0}});const s=foilTest.session;s.stand();const samples=[];
   for(let i=0;i<hz*5;i++){
    const t=i/hz,sim=Math.floor((t+1e-8)*60)/60,x=Math.sin(heading)*sim*8,z=Math.cos(heading)*sim*8,water=FoilCore.sea(x,z,sim,swell,s.config);
    const p=foilTest.sampleFrame({time:sim,x,z,heading,speed:8,height:.4-water,pitch:0,roll:0,trim:.68,standing:true,standAmount:1,foiling:true},1/hz);
    if(i>hz)samples.push({t,pitch:Math.asin(p.direction[1]),yaw:Math.atan2(p.direction[0],p.direction[2]),...p});
   }
   const changes=samples.slice(1).map((p,i)=>({pitch:(p.pitch-samples[i].pitch)*180/Math.PI,yaw:(p.yaw-samples[i].yaw)*180/Math.PI,water:Math.hypot(p.waterOrigin[0]-samples[i].waterOrigin[0],p.waterOrigin[2]-samples[i].waterOrigin[2])}));
   results.push({hz,swell,heading,pitchRange:(Math.max(...samples.map(p=>p.pitch))-Math.min(...samples.map(p=>p.pitch)))*180/Math.PI,maxPitchStep:Math.max(...changes.map(p=>Math.abs(p.pitch))),maxYawStep:Math.max(...changes.map(p=>Math.abs(p.yaw))),cameraHeave:Math.max(...samples.map(p=>p.position[1]))-Math.min(...samples.map(p=>p.position[1])),riderHeave:Math.max(...samples.map(p=>p.rider[1]))-Math.min(...samples.map(p=>p.rider[1])),maxWaterShift:Math.max(...changes.map(p=>p.water))});
  }
  return results;
 })()`);
 console.log('Controlled straight flight, eight metres/second:',JSON.stringify(result));
 for(const r of result){assert.ok(r.pitchRange<1e-7&&r.maxYawStep<1e-7,JSON.stringify(r));assert.ok(r.cameraHeave<1e-9&&r.riderHeave<1e-9,'Chop must not move the flight plane or camera');assert.ok(r.maxWaterShift<=8/r.hz+8/60+1e-8,'Water meshes move continuously');}
 const climb=await evaluate(`(()=>{const s=foilTest.session,water=FoilCore.sea(s.x,s.z,s.time,s.config.swell,s.config);const before=foilTest.sampleFrame({height:.4-water},0);let after;for(let i=0;i<180;i++)after=foilTest.sampleFrame({height:.7-water},1/60);return {camera:after.position[1]-before.position[1],rider:after.rider[1]-before.rider[1]};})()`);
 assert.ok(climb.camera>.299&&climb.camera<.301);assert.ok(Math.abs(climb.rider-.3)<1e-9);console.log('Camera follows a real 30 cm foil climb:',climb);
 await evaluate('foilTest.start(1,{free:true,conditions:{swell:.08,chop:.6,waveLength:8,wind:8.5,gust:0}});foilTest.session.stand();Object.assign(foilTest.session,{speed:7,height:.4,standAmount:1,trim:.68,standing:true,foiling:true});foilTest.session.controls.trim=.68;foilTest.resume()');
 const live=await evaluate(`new Promise(resolve=>{const samples=[];let previous=performance.now(),count=0;function sample(now){const dt=now-previous;previous=now;if(count++>10)samples.push(dt);if(count<60)requestAnimationFrame(sample);else{samples.sort((a,b)=>a-b);resolve({median:samples[Math.floor(samples.length*.5)],p95:samples[Math.floor(samples.length*.95)],max:Math.max(...samples),mode:foilTest.session.mode,crashes:foilTest.session.stats.crashes});}}requestAnimationFrame(sample);})`);
 console.log('Live browser frame intervals (ms):',live);assert.equal(live.crashes,0);await frames();await screenshot('steady-flight');
}
