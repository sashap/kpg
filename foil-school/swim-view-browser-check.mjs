import assert from 'node:assert/strict';
export async function check({evaluate,frames,screenshot}){
 await evaluate(`foilTest.start(0,{free:true});foilTest.session.setConditions({swell:0,chop:0,wind:0});foilTest.session.dismount();foilTest.previewPose({mode:'swimming',x:0,z:0,walkY:0,heading:0,speed:2.2,swimVelocity:2.2,swimEffort:1,swimPhase:0,entryTime:0,towing:false,jumpTime:0});foilTest.session.board={x:40,z:40,heading:0};document.getElementById('play-hud').style.visibility='hidden';document.getElementById('toast').classList.add('hidden');`);
 const stroke=await evaluate(`(()=>{
  const sample=t=>foilTest.poseFrame({swimPhase:t*Math.PI*2,swimEffort:1,swimVelocity:2.2},0),phases=[];let previous=null,maxElbowStep=0,maxPalmStep=0,maxLengthError=0,minWristSide=Infinity,minElbowSide=Infinity;
  for(let i=0;i<=360;i++){
   const rig=sample(i/180),p=rig.swim;
   for(let k=0;k<2;k++){
    maxLengthError=Math.max(maxLengthError,Math.abs(rig.arms[k][0]-.31),Math.abs(rig.arms[k][1]-.29));
    minWristSide=Math.min(minWristSide,p.wrists[k][0]*(k?1:-1));minElbowSide=Math.min(minElbowSide,p.elbows[k][0]*(k?1:-1));
    if(previous){maxElbowStep=Math.max(maxElbowStep,Math.hypot(...p.elbows[k].map((v,j)=>v-previous.elbows[k][j])));const dot=Math.min(1,Math.abs(p.handQuaternions[k].reduce((s,v,j)=>s+v*previous.handQuaternions[k][j],0)));maxPalmStep=Math.max(maxPalmStep,2*Math.acos(dot));}
   }previous=p;
  }
  for(const t of [.24,.38,.53,.70,.78,.86]){const p=sample(t).swim;phases.push({t,elbowAboveWrist:p.wrists[0][2]-p.elbows[0][2],elbowHeight:p.elbowHeights[0],wristHeight:p.handHeights[0]});}
  const a=sample(.78).swim;sample(.13);sample(.93);const b=sample(.78).swim;const repeatError=Math.max(...a.elbows.flat().map((v,i)=>Math.abs(v-b.elbows.flat()[i])));
  return {maxElbowStep,maxPalmStep,maxLengthError,minWristSide,minElbowSide,repeatError,phases};
 })()`);
 console.log('Stroke geometry',stroke);
 assert.ok(stroke.maxLengthError<1e-6,'The elbow must keep both arm bones connected at their correct length');
 assert.ok(stroke.maxElbowStep<.05&&stroke.maxPalmStep<.24,'No elbow or palm flips across the stroke or loop boundary');
 assert.ok(stroke.minWristSide>.17&&stroke.minElbowSide>.17,'Neither arm crosses the head or torso');
 assert.ok(stroke.repeatError<1e-8,'Elbow anatomy must not depend on the previously displayed phase');
 for(const p of stroke.phases){assert.ok(p.elbowAboveWrist>.035,'The elbow leads the hand at phase '+p.t);if(p.t<.6)assert.ok(p.wristHeight<-.08,'Pull beneath the surface');else assert.ok(p.elbowHeight>.10,'Recover the elbow above the surface');}
 for(let i=0;i<8;i++){
  await evaluate(`foilTest.poseFrame({swimPhase:${i*Math.PI/4},swimEffort:1,swimVelocity:2.2},0);foilTest.inspectScenery([3.0,.45,.85],[0,-.03,1.0]);`);await frames();await screenshot('swim-side-'+i);
 }
 const views={};for(const [name,from,to] of [['below',[1.8,-1.05,1.0],[0,.02,1.1]],['surface',[2.8,.6,1.6],[0,0,1.0]],['deep',[1.8,-2.4,1.0],[0,0,1.1]]]){
  await evaluate(`foilTest.poseFrame({swimPhase:1.8,swimEffort:1,swimVelocity:2.2},0);foilTest.inspectScenery(${JSON.stringify(from)},${JSON.stringify(to)});`);await frames();await screenshot('swim-view-'+name);views[name]=await evaluate('foilTest.polish.environment.underwater');
 }
 assert.equal(views.below.amount,1);assert.equal(views.deep.amount,1);assert.equal(views.surface.amount,0);
 assert.ok(views.below.filter[0]<views.below.filter[1]&&views.below.filter[1]<views.below.filter[2],'Water absorbs warm colors');
 assert.ok(views.deep.filter[0]<views.below.filter[0]&&views.deep.fogDensity>views.below.fogDensity,'Depth increases absorption and haze');
 assert.deepEqual(views.surface.filter,[1,1,1]);assert.equal(views.surface.filterVisible,false);assert.ok(views.surface.fogDensity<.002,'Normal above-water rendering is restored');
 const crossings=await evaluate(`(()=>{foilTest.session.setConditions({swell:.25,chop:.65,wind:9,waveLength:12});const samples=[];for(const time of [0,2.5,7,13]){foilTest.session.time=time;const s=foilTest.session,h=FoilCore.sea(1.8,1,time,s.config.swell,s.config);for(const offset of [.2,-.045,-.3]){foilTest.inspectScenery([1.8,h+offset,1],[0,0,1.1]);samples.push({offset,...foilTest.polish.environment.underwater});}}return samples;})()`);
 for(const p of crossings){assert.ok(Math.abs(p.depth+p.offset)<1e-6,'Underwater transition follows the actual wave height');assert.ok(p.offset>.1?p.amount===0:p.offset<-.1?p.amount===1:p.amount>.2&&p.amount<.8,'Waterline transition is gradual');}
 await evaluate('foilTest.inspectScenery([1.8,-1.05,1.0],[0,.02,1.1])');await frames();await screenshot('swim-view-waves');
 assert.ok(await evaluate('foilTest.renderStats.programs.every(p=>p.runnable)'));
 console.log('Side stroke, recovery, anatomical continuity, underwater color/depth, resurfacing and wave-height checks passed',views);
}
