import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot,tablet,phone}){
 await evaluate("foilTest.travel('coyote',{screen:'intro'})");await click('begin');
 await evaluate(`(()=>{const s=foilTest.session,h=s.horses[0];s.dismount();Object.assign(s,{mode:'walking',x:h.x+1.2,z:h.z,walkY:h.y,jumpTime:0});foilTest.inputStep(0);})()`);await click('horse-action');await evaluate('foilTest.inputStep(.8)');
 // Reproduce a stopped horse facing a real parked car; no run-up or injected speed.
 const setup=await evaluate(`(()=>{const h=foilTest.session.horse;for(const b of FoilWorld.geography.solids.filter(b=>b.kind==='car')){const heading=b.car.angle,x=b.car.x-Math.sin(heading)*4,z=b.car.z-Math.cos(heading)*4,p=FoilHorses.support(FoilWorld,x,z,heading);if(p)return {x,z,y:p.y,heading,car:{x:b.car.x,z:b.car.z,y:b.y}};}return null;})()`);assert.ok(setup);
 const key=async(code,down)=>cdp('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',code,key:code==='Space'?' ':code,windowsVirtualKeyCode:{Space:32,ArrowUp:38,ArrowDown:40}[code]});
 const place=async pose=>evaluate(`(()=>{const s=foilTest.session,h=s.horse;Object.assign(h,${JSON.stringify(pose)},{speed:0,jump:null,jumpCooldown:0,mountTime:0});Object.assign(s,{x:h.x,z:h.z,walkY:h.y,heading:h.heading,speed:0});foilTest.resume();foilTest.inputStep(0);})()`);
 async function leap(direction){
  if(tablet||phone){const points=await evaluate(`['walk-stick','pump'].map((id,i)=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2+(i?0:${direction}*Math.min(r.width,r.height)*.33),id:70+i}})`);await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});}
  else{await key(direction<0?'ArrowUp':'ArrowDown',true);await key('Space',true);}
  assert.ok(await evaluate('!!foilTest.session.horse.jump'));
  // Stop at the first landing so grounded acceleration cannot mask a short jump.
  const result=await evaluate(`(()=>{let peak=0;for(let i=0;i<180;i++){foilTest.inputStep(1/60);const h=foilTest.session.horse;peak=Math.max(peak,h.y);if(!h.jump)break;}const h=foilTest.session.horse;return {x:h.x,z:h.z,y:h.y,peak,air:!!h.jump};})()`);
  if(tablet||phone)await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else{await key('Space',false);await key(direction<0?'ArrowUp':'ArrowDown',false);}
  assert.equal(result.air,false);return result;
 }
 await place(setup);
 const approach=await leap(-1);assert.ok(Math.hypot(approach.x-setup.x,approach.z-setup.z)>1.4,JSON.stringify(approach));assert.ok(approach.y>setup.car.y+.9,'Standing jump reaches the hood or roof');
 // Starting with forelegs above the hood must still permit both directions.
 const hood={x:setup.car.x-Math.sin(setup.heading)*1.8,z:setup.car.z-Math.cos(setup.heading)*1.8,y:setup.car.y+1.03,heading:setup.heading},distances=[];
 for(const direction of [-1,1]){await place(hood);const result=await leap(direction),forward=(result.x-hood.x)*Math.sin(hood.heading)+(result.z-hood.z)*Math.cos(hood.heading);assert.ok(forward*(-direction)>1.35,JSON.stringify(result));distances.push(forward);}
 await evaluate(`(()=>{const h=foilTest.session.horse;document.getElementById('toast').classList.add('hidden');foilTest.inspectScenery([h.x+4,h.y+1.9,h.z+.7],[h.x,h.y+1.3,h.z]);})()`);await frames();await screenshot('horse-jump-recovery');
 console.log('Actual arrow/Space or two-touch input: standing jump onto car, forward/backward recovery from hood passed',{approach,distances});
}
