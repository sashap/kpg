import assert from 'node:assert/strict';
import {checkLeashes,checkShore} from './gear-recovery-browser-check.mjs';
export async function check({evaluate,frames,click,screenshot,cdp}){
 await click('begin');
 await checkLeashes({evaluate,cdp,click,screenshot});
 for(const id of ['shoreline','coyote','third','kahului','crissy','academy']){
  await evaluate(`foilTest.travel('${id}',{screen:'intro'})`);
  for(let i=0;i<220;i++){await new Promise(r=>setTimeout(r,100));if(await evaluate(`!!window.foilTest&&FoilWorld.location.id==='${id}'&&document.getElementById('intro-location')?.value==='${id}'`))break;}
  assert.equal(await evaluate('FoilWorld.location.id'),id);await click('begin');await frames();
  const objects=await evaluate(`({count:FoilWorld.waterContacts.objects.length,dynamic:FoilWorld.waterContacts.objects.filter(o=>o.sample).map(o=>o.kind),clear:FoilWipeouts.clearEquipment(foilTest.session.x,foilTest.session.z,foilTest.session,FoilWorld,FoilCore.sea),shaders:foilTest.renderStats.programs.every(p=>p.runnable)})`);
  assert.ok(objects.count>3);assert.ok(objects.clear&&objects.shaders,JSON.stringify({id,objects}));console.log(id,'water contact hulls:',objects);
  if(id==='shoreline'){
   assert.ok(objects.dynamic.includes('pedalboat'));
   const pedal=await evaluate(`(()=>{foilTest.previewPose({time:0});const a=foilTest.polish.environment.pedalBoat;foilTest.previewPose({time:.01});const b=foilTest.polish.environment.pedalBoat;foilTest.previewPose({time:Math.PI*1.5/2.4-.005});const c=foilTest.polish.environment.pedalBoat;foilTest.previewPose({time:Math.PI*1.5/2.4+.005});const d=foilTest.polish.environment.pedalBoat;return {wheel:b.wheelAngle-a.wheelAngle,blade:b.paddleTip[2]-a.paddleTip[2],foot:d.feet[1][2]-c.feet[1][2],position:d.position};})()`);
   assert.ok(pedal.wheel>0&&pedal.blade<0&&pedal.foot<0,JSON.stringify(pedal));await evaluate(`foilTest.inspectScenery([${pedal.position[0]+4},2,${pedal.position[2]+3}],[${pedal.position[0]},.7,${pedal.position[2]}])`);await screenshot('pedalboat-forward');
   const recovery=await evaluate(`(()=>{foilTest.start(1,{free:true,conditions:{swell:0,gust:0}});const s=foilTest.session,[x,z]=FoilWorld.geography.project([37.43356,-122.0910]);Object.assign(s,{x:x+2.8,z,heading:Math.PI/2,speed:7,height:.4,standing:true,standAmount:1});s.lastSafe={x:x+7,z};foilTest.previewPose({});s.crash('Solar circulator collision',null,{kind:'strike'});s.board.x=x+2.8;s.board.z=z;s.board.motion=null;s.x=x+5;s.z=z;foilTest.resume();foilTest.step(7);foilTest.previewPose({});foilTest.inspectScenery([x+10,3,z+7],[x+2,.6,z]);return {mode:s.mode,clear:FoilWipeouts.clearEquipment(s.board.x,s.board.z,s,FoilWorld,FoilCore.sea),recovered:s.fallMotion.gearRecovered,wing:s.fallMotion.wingCleared,damage:foilTest.polish.damage};})()`);
   assert.equal(recovery.mode,'swimming');assert.ok(recovery.clear&&recovery.recovered&&recovery.wing,JSON.stringify(recovery));assert.equal(recovery.damage.boardSplit,false);await screenshot('solar-safe-recovery');
   assert.ok(await evaluate(`(()=>{const s=foilTest.session;s.x=s.board.x+1;s.z=s.board.z;s.toggleTow();s.heading=Math.PI/2;s.controls.balance=-1;const x=s.board.x;foilTest.resume();foilTest.step(2);const moved=s.board.x>x+.3;s.x=s.board.x;s.z=s.board.z;return moved&&s.boardAgain();})()`));
  }
  if(id==='kahului')assert.ok(objects.dynamic.includes('canoe'));
  await checkShore({evaluate,screenshot},id);
 }
 await evaluate(`(()=>{foilTest.previewPose({});const s=foilTest.session;s.waterTraffic=foilTest.trafficContacts;const o=s.waterTraffic[0];Object.assign(s,{x:o.x,z:o.z,heading:o.heading,speed:7,height:.4,standing:true,standAmount:1});foilTest.resume();foilTest.step(1/60);foilTest.previewPose({});})()`);
 assert.equal(await evaluate('foilTest.session.lastCollision.kind'),'foiler');assert.equal(await evaluate('foilTest.session.mode'),'falling');assert.ok(await evaluate("foilTest.polish.traffic.riders.some(r=>r.mode==='falling')"));
 console.log('All six sites load with obstacle hulls; solar escape, towing, remount, actual forward pedaling/paddle geometry and both-rider collisions passed.');
}
