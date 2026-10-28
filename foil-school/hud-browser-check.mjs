import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot}){
 await click('begin');
 for(const [width,height] of [[1440,960],[1180,820],[390,844],[320,568],[844,390],[900,600]]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<761||height<500});await frames();
  for(const mode of ['sailing','swimming','walking','riding']){
   await evaluate(`(()=>{foilTest.start(0,{free:true});const s=foilTest.session;if('${mode}'!=='sailing'){s.dismount();if('${mode}'==='walking'){const c=FoilWorld.castle;Object.assign(s,{mode:'walking',x:c.x+4,z:c.z-3,walkY:c.floor,jumpTime:0});}}if('${mode}'==='riding'){const h=s.horses[0];Object.assign(s,{mode:'walking',x:h.x+1.2,z:h.z,walkY:h.y,jumpTime:0});s.horseAction();}foilTest.inputStep(0);document.getElementById('toast').classList.add('hidden');})()`);await frames();
   const boxes=await evaluate(`(()=>{const rect=n=>{const r=document.querySelector(n).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};return {activity:rect('.activity-rail'),wind:rect('.wind-panel'),speed:rect('.speed-stat'),compass:rect('#compass'),stats:rect('.instruments'),coach:rect(document.getElementById('toast').offsetWidth?'#toast':'#coach'),controls:rect('.controls'),joystick:rect('#joystick'),strip:rect('.message-strip')};})()`);
   for(const name of ['activity','wind','speed','compass','stats','coach','controls','joystick']){const b=boxes[name];assert.ok(b.x>=0&&b.right<=width+.5&&b.y>=0&&b.bottom<=height+.5,JSON.stringify({width,height,mode,name,b}));}
   assert.ok(boxes.activity.right<width*.49&&boxes.wind.x>width*.55,'The center stays free of instrument cards');
   if(mode==='sailing'){const h=await evaluate("(()=>{const r=document.getElementById('height-value').getBoundingClientRect();return {x:r.x,right:r.right,bottom:r.bottom}})()");assert.ok(h.x>=boxes.wind.x&&h.right<=boxes.wind.right&&h.bottom<=boxes.wind.bottom,'Ride height remains inside the visible wind panel');}
   if(mode==='riding'){const h=await evaluate("['center-view','pump','walk-stick'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}})");assert.ok(h[1].y>=h[0].bottom&&h[1].right<=width/2&&h[1].right<h[2].x,'Jump sits below Center View on the left');}
   assert.ok(boxes.speed.bottom<=boxes.compass.y+1,'Speed sits above the wind direction');
   assert.ok(boxes.stats.right<=boxes.activity.right+1&&boxes.stats.x>=boxes.activity.x,'Points and discoveries stay with the activity card');
   if(!(boxes.coach.height<=42.5&&boxes.coach.y>=height-47))await screenshot('hud-failure');assert.ok(boxes.coach.height<=42.5&&boxes.coach.y>=height-47,JSON.stringify({width,height,mode,boxes}));
   assert.ok(boxes.controls.bottom<=boxes.strip.y-3,'Messages do not cover the controls');
   assert.ok(boxes.activity.bottom<=boxes.controls.y-8&&boxes.wind.bottom<=boxes.controls.y-8,'Side panels remain clear of the thumb controls');
   if(width===390||width===844||width===1440&&mode==='swimming')await screenshot('hud-'+width+'-'+height+'-'+mode);
  }
 }
 console.log('Clear center view, compact bottom messages, side stats, speed above compass and unobstructed controls passed at six viewport sizes in sailing/swimming/walking');
}
