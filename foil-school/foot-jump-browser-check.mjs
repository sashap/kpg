import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot,tablet,phone}){
 await click('begin');
 await evaluate("(()=>{const s=foilTest.session,c=FoilWorld.castle;s.dismount();Object.assign(s,{mode:'walking',x:c.x+4,z:c.z-4,walkY:c.floor,heading:0,jumpTime:0,walkVelocity:3.2});foilTest.inputStep(0);})()");await frames();
 const start=await evaluate('({x:foilTest.session.x,z:foilTest.session.z,y:foilTest.session.walkY})');
 const key=async(code,down)=>cdp('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',code,key:code==='Space'?' ':code,windowsVirtualKeyCode:code==='Space'?32:38});
 if(tablet||phone){const points=await evaluate("['walk-stick','pump'].map((id,i)=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*(i?.5:.15),id:80+i}})");await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});await evaluate('foilTest.inputStep(.1)');await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});}
 else{await key('ArrowUp',true);await evaluate('foilTest.inputStep(.1)');await key('Space',true);}
 assert.ok(await evaluate('!!foilTest.session.walkJump'));await evaluate('foilTest.inputStep(.3)');assert.ok(await evaluate(`foilTest.session.walkY>${start.y}+.6`));await frames();await screenshot('walking-jump');
 await evaluate('foilTest.inputStep(.8)');assert.equal(await evaluate('foilTest.session.walkJump'),null);assert.ok(await evaluate(`Math.hypot(foilTest.session.x-(${start.x}),foilTest.session.z-(${start.z}))>1.8`));assert.equal(await evaluate('foilTest.session.mode'),'walking');
 if(tablet||phone)await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else{await key('Space',false);await key('ArrowUp',false);}
 await evaluate('foilTest.inputStep(.5)');await click('pump');assert.ok(await evaluate('!!foilTest.session.walkJump'),'Jump button also works from standing');
 assert.equal(await evaluate('visualViewport.scale'),1);assert.equal(await evaluate('getSelection().toString()'),'');
 console.log('Walking/running momentum with Space or simultaneous movement-and-Jump touches, safe landing, and a standing button jump passed.');
}
