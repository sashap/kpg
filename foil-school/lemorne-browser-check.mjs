import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot}){
 await click('begin');await click('pause');await click('pause-location');
 await evaluate(`document.querySelector('[data-location="lemorne"]').id='morne-choice'`);await click('morne-choice');
 assert.equal(await evaluate(`document.getElementById('places-map').dataset.site`),'lemorne');
 await click('places-all');await screenshot('lemorne-map');
 await cdp('Network.enable');await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 try{
  const origin=await evaluate('performance.timeOrigin');await click('locations-go');
  for(let i=0;i<240;i++){await new Promise(r=>setTimeout(r,100));if(await evaluate(`!!window.foilTest&&FoilWorld.location.id==='lemorne'&&foilTest.view==='play'`))break;}
  assert.equal(await evaluate('FoilWorld.location.id'),'lemorne');assert.equal(await evaluate('performance.timeOrigin'),origin);
  await evaluate('foilTest.previewPose({})');await frames();
  const result=await evaluate(`({site:FoilWorld.location.id,depth:-FoilWorld.bedHeight(foilTest.session.x,foilTest.session.z),wind:foilTest.session.windFrom,horse:foilTest.session.horses,scene:foilTest.polish.environment,render:foilTest.renderStats})`);
  console.log('Le Morne',JSON.stringify(result));assert.ok(result.depth>2);assert.ok(result.horse.length===1);assert.ok(result.scene.leMorne.casuarinas>100);assert.ok(result.scene.leMorne.palms>35);assert.ok(result.render.programs.every(p=>p.runnable));
  if(process.argv[4]==='start'){
   await evaluate('foilTest.start(0,{free:true});foilTest.previewPose({})');await frames();
   assert.ok(await evaluate('Math.cos(foilTest.session.heading)>.6&&Math.sin(foilTest.session.heading)<-.6'),'Clear initial reach faces northeast toward the mountain side of the lagoon');
   await screenshot('lemorne-arrival');console.log('Mountain-facing arrival and shader check passed');return;
  }
  const view=async(name,from,to)=>{await evaluate(`foilTest.inspectScenery(${JSON.stringify(from)},${JSON.stringify(to)})`);await frames();await screenshot('lemorne-'+name);};
  await view('mountain',[120,3,-50],[-350,190,1550]);
  await view('lagoon',[1500,650,-1600],[-180,200,1150]);
  await view('beach',[100,3,210],[170,6,310]);
  await view('west-cliffs',[2100,12,350],[-350,250,1600]);
  await view('resorts',[900,6,-400],[600,10,100]);
  await view('reef',[1150,100,-850],[1600,0,-300]);
  const horseAccess=await evaluate(`(()=>{const s=foilTest.session,h=s.horses[0];s.dismount();Object.assign(s,{mode:'walking',x:h.x+1.2,z:h.z,walkY:h.y});if(!s.horseAction())return {mounted:false};let best=0,heading=0;for(let j=0;j<32;j++){const a=j*Math.PI/16;let d=0;for(;d<22;d+=.4)if(!FoilHorses.support(FoilWorld,h.x+Math.sin(a)*d,h.z+Math.cos(a)*d,a))break;if(d>best){best=d;heading=a;}}h.heading=heading;s.controls.balance=-.35;for(let i=0;i<300;i++)s.step(1/60);s.controls.balance=0;for(let i=0;i<60;i++)s.step(1/60);const distance=h.distance,dismounted=s.horseAction();return {mounted:true,best,distance,dismounted,mode:s.mode,blocked:FoilWorld.blocked(s.x,s.z,.28,s.walkY)};})()`);
  assert.ok(horseAccess.mounted&&horseAccess.best>8&&horseAccess.distance>4&&horseAccess.dismounted&&!horseAccess.blocked,JSON.stringify(horseAccess));
  const gallop=await evaluate(`(()=>{const s=foilTest.session;if(!s.horseAction())return null;const h=s.horse;h.mountTime=0;const rows=[];for(let i=0;i<40;i++)rows.push(foilTest.horseFrame(i*Math.PI/20,16));return rows;})()`);
  assert.ok(gallop);let stretch=0;
  for(const p of gallop){const h=p.horses[0];assert.ok([...h.skin.min,...h.skin.max].every(Number.isFinite));for(const f of h.feet){for(let j=0;j<f.expected.length;j++)stretch=Math.max(stretch,Math.abs(f.lengths[j]-f.expected[j]));if(f.stance)assert.ok(Math.abs(f.local[1]-.07-f.ground)<.01);}assert.ok(Math.hypot(...p.rider.riding.hip.map((v,i)=>v-p.rider.riding.seat[i]))<.2);}
  assert.ok(stretch<.015,'Full-gallop legs keep their anatomical lengths');
  for(let i=0;i<4;i++){await evaluate(`(()=>{const h=foilTest.session.horse;foilTest.horseFrame(${i*Math.PI/2},16);foilTest.inspectScenery([h.x+5.4,h.y+1.9,h.z+1.2],[h.x,h.y+1.5,h.z+.15]);})()`);await frames();await screenshot('horse-fast-gallop-'+i);}
  console.log('Full gallop: 40 rendered poses; maximum bone-length error',stretch);
  // The same new location is available to the academy and ordinary touch controls.
  await evaluate('foilTest.inspectRider(false)');await click('home');assert.ok(await evaluate(`document.getElementById('course-location').textContent.includes('Le Morne')`));
  await click('chart-free');assert.equal(await evaluate(`document.getElementById('free-location').value`),'lemorne');await click('conditions-apply');
  await evaluate('foilTest.previewPose({})');await frames();await screenshot('lemorne-play');
  assert.equal(await evaluate('foilTest.session.free'),true);assert.ok(await evaluate('foilTest.layout().filter(b=>b.id===\'joystick\'||b.id===\'wing-pad\').every(b=>b.w>80&&b.h>80)'));
  // Full multi-touch still works in the larger new scene, without page zoom.
  await evaluate('foilTest.resume()');
  const pads=await evaluate(`(()=>{const a=document.getElementById('joystick').getBoundingClientRect(),b=document.getElementById('wing-pad').getBoundingClientRect(),p=FoilWingControl.point(.7,.65);return [{x:a.x+a.width*.42,y:a.y+a.height*.60,id:81},{x:b.x+p.x/FoilWingControl.width*b.width,y:b.y+p.y/FoilWingControl.height*b.height,id:82}];})()`);
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pads});await frames();const controls=await evaluate('foilTest.control');assert.ok(controls.trim>.6&&controls.joystick.balance>.05,JSON.stringify(controls));await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await evaluate('visualViewport.scale'),1);
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await frames();assert.ok(await evaluate(`foilTest.layout().filter(b=>b.id==='joystick'||b.id==='wing-pad').every(b=>b.x>=0&&b.right<=innerWidth&&b.bottom<=innerHeight)`));await screenshot('lemorne-phone');
  console.log('Le Morne offline travel, map, live scene, mountain/coast views, horse, course selection, Free Foiling and touch layout passed');
 }finally{await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
}
