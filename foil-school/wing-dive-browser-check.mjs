import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot,tablet,phone}){
 await click('begin');
 const setup=async speed=>evaluate(`(()=>{foilTest.start(1,{free:true,conditions:{wind:8.5,windFrom:0,swell:0,gust:0}});const s=foilTest.session;s.stand();Object.assign(s,{heading:0,angle:0,speed:${speed},height:${speed>4?.35:0},standing:true,standAmount:1,trim:.7,wingAngle:0,wingTarget:0,pitch:.024});s.controls.trim=.7;foilTest.inputStep(0);foilTest.previewPose({});})()`);
 const advance=async seconds=>evaluate(`(()=>{for(let t=0;t<${seconds};t+=1/60){foilTest.resume();foilTest.step(1/60);foilTest.inputStep(0);}foilTest.previewPose({});return {mode:foilTest.session.mode,dive:foilTest.session.wingDive,fall:foilTest.session.fallMotion,rig:foilTest.polish.rider};})()`);
 await setup(0);let r=await advance(.4);assert.ok(r.dive.shake>.3&&r.dive.fold<.01);await screenshot('upwind-warning');
 r=await advance(2.5);assert.equal(r.mode,'sailing');assert.ok(r.dive.fold>.7);assert.ok(r.rig.worldWingLeading[1]<.5,JSON.stringify(r.rig.worldWingLeading));assert.ok(r.rig.worldWingTrailing[1]>r.rig.worldWingLeading[1]+1.4,'The leading edge, not the trailing edge, dives');
 for(const [a,b] of r.rig.arms){assert.ok(Math.abs(a-.31)<.001&&Math.abs(b-.29)<.001,'Arms stay connected while resisting the downturned wing');}await screenshot('upwind-stopped-dive');
 // Actual keyboard easing must work slowly enough to operate with arrow keys.
 await setup(5);await advance(.3);await evaluate('foilTest.resume()');
 if(tablet||phone){const p=await evaluate("(()=>{const svg=document.querySelector('#wing-pad svg'),p=new DOMPoint(110,28).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y,id:31}})()");await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else await cdp('Input.dispatchKeyEvent',{type:'keyDown',code:'ArrowUp',key:'ArrowUp',windowsVirtualKeyCode:38});
 await evaluate('foilTest.inputStep(1.6)');if(!tablet&&!phone)await cdp('Input.dispatchKeyEvent',{type:'keyUp',code:'ArrowUp',key:'ArrowUp',windowsVirtualKeyCode:38});assert.equal(await evaluate('foilTest.session.stats.crashes'),0);assert.equal(await evaluate('foilTest.session.mode'),'sailing');
 await setup(6);r=await advance(.55);assert.equal(r.mode,'sailing');await screenshot('upwind-fast-warning');
 // Render every simulation step through the catch, including its actual initial wing transform.
 await evaluate(`(()=>{for(let i=0;i<120&&foilTest.session.mode==='sailing';i++){foilTest.resume();foilTest.step(1/60);foilTest.inputStep(0);}foilTest.previewPose({});const b=foilTest.session.board;foilTest.inspectScenery([b.x+7,2.5,b.z-1.5],[b.x,.8,b.z+1.4]);})()`);
 assert.equal(await evaluate('foilTest.session.fallMotion.kind'),'wing-trip');await frames();await screenshot('upwind-trip-release');
 r=await advance(.23);assert.equal(r.mode,'falling');assert.ok(r.rig.worldWingLeading[1]<-.45,'Leading edge goes beneath the board into the water');assert.ok(r.fall.wingImpact);assert.ok(r.fall.pitch>.3);await frames();await screenshot('upwind-trip-wing-impact');
 r=await advance(.22);assert.equal(r.mode,'falling');const separation=await evaluate('(()=>{const s=foilTest.session,b=s.board;return (s.x-b.x)*Math.sin(b.heading)+(s.z-b.z)*Math.cos(b.heading)})()');assert.ok(separation>1.3,'The rider flies forward over the caught wing');for(const [a,b] of r.rig.arms)assert.ok(Math.abs(a-.31)<.001&&Math.abs(b-.29)<.001);await frames();await screenshot('upwind-trip-over-wing');
 await advance(.7);assert.equal(await evaluate('foilTest.session.mode'),'swimming');await frames();await screenshot('upwind-trip-swimming');
 r=await advance(2);assert.ok(r.rig.worldWingCenter[1]>.1,'The wing resurfaces instead of remaining stuck underwater');assert.equal(await evaluate('foilTest.session.stats.crashes'),1);assert.equal(await evaluate('foilTest.session.controls.trim'),0);assert.equal(await evaluate('foilTest.session.mode'),'swimming','Recovery requires an explicit boarding action');await evaluate('foilTest.inspectRider(false);foilTest.resume()');
 // Landing on the caught wing may now tear it. Respect the visible repair
 // countdown before testing the same explicit touch/keyboard remount.
 const repair=await evaluate('(()=>{const f=foilTest.session.fallMotion;return Math.max(0,f.damageWingUntil-f.wingAge,f.damageBoardUntil-f.wingAge)})()');
 if(repair>0){assert.ok(await evaluate("document.getElementById('stand').disabled"));await advance(repair+.2);assert.equal(await evaluate('foilTest.polish.damage.wingSplit'),false);}
 await evaluate('(()=>{const s=foilTest.session;s.x=s.board.x;s.z=s.board.z;foilTest.inputStep(0);foilTest.resume();})()');await click('stand');assert.equal(await evaluate('foilTest.session.mode'),'sailing');assert.equal(await evaluate('foilTest.session.wingDive.fold'),0);
 console.log('Leading-edge warning/dive, connected arms, keyboard/touch easing, forward trip, underwater wing catch, resurfacing and explicit remount passed.');
}
