import assert from 'node:assert/strict';
export async function check({evaluate,frames,click,screenshot}){
 await click('begin');
 for(const [wind,side] of [[16,1],[20,-1]]){
  const result=await evaluate(`(()=>{
   foilTest.start(1,{free:true,conditions:{wind:${wind}/1.94384,windFrom:0,swell:0,gust:0}});foilTest.previewPose({});
   const s=foilTest.session;Object.assign(s,{heading:${side}*Math.PI/2,speed:6,height:.4,vertical:0,standing:true,standAmount:1,foiling:true,trim:.85,wingAngle:${-side},wingTarget:${-side},wingSide:${-side},pitch:(90*9.81/(.5*1025*.18*36)-.20)/4.8});s.controls.trim=.85;
   let minHeight=1,allFlying=true;
   for(let i=0;i<35*60;i++){s.controls.steer=FoilCore.clamp(-FoilCore.wrap(Math.PI-s.heading)*3,-.55,.55);s.step(1/60);minHeight=Math.min(minHeight,s.height);allFlying=allFlying&&s.foiling;}
   foilTest.inputStep(0);foilTest.previewPose({});return {speed:s.speed*1.94384,mode:s.mode,crashes:s.stats.crashes,minHeight,allFlying,heading:s.heading,coach:s.powerInfo(),position:[s.x,s.z],rig:foilTest.polish.rider};
  })()`);
  console.log('Downwind turn and 35-second run:',JSON.stringify({wind,side,...result}));
  assert.equal(result.mode,'sailing');assert.equal(result.crashes,0);assert.ok(result.allFlying&&result.minHeight>.25);
  assert.ok(result.speed>wind*.60&&result.speed<wind*.68);assert.equal(result.coach.code,'downwind');assert.match(result.coach.detail,/Wind at the wing:/);
  for(const [upper,lower] of result.rig.arms){assert.ok(Math.abs(upper-.31)<.001&&Math.abs(lower-.29)<.001,'Hands and arms remain connected');}
  await frames();await screenshot('downwind-'+wind+'kn');
 }
 console.log('Sheeted downwind turns on both tacks retain foil flight, show apparent wind and render connected rider arms.');
}
