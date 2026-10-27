import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot}){
 await evaluate('window.travelSentinel={value:42};window.oldRenderers=[]');await cdp('Network.enable');await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 try{for(const id of ['shoreline','third','coyote','crissy','academy','third']){
  const before=await evaluate('performance.timeOrigin');await evaluate(`window.oldRenderers.push(foilTest.renderer);foilTest.travel('${id}',{screen:'intro'})`);
  for(let i=0;i<240;i++){await new Promise(r=>setTimeout(r,120));if(await evaluate(`!!window.foilTest&&FoilWorld.location.id==='${id}'&&document.getElementById('intro-location')?.value==='${id}'`))break;}
  assert.equal(await evaluate('FoilWorld.location.id'),id);assert.equal(await evaluate('performance.timeOrigin'),before);assert.equal(await evaluate('window.travelSentinel.value'),42);assert.equal(await evaluate('document.querySelectorAll("#ocean canvas").length'),1);assert.ok(await evaluate('window.oldRenderers.every(r=>r.getContext().isContextLost())'));await frames();assert.equal(await evaluate('document.activeElement.id'),'begin');await click('begin');assert.equal(await evaluate('foilTest.session.lesson'),0);assert.equal(await evaluate('foilTest.session.horses.length'),1);
  const h=await evaluate('foilTest.session.horses[0]');assert.ok(Number.isFinite(h.y));if(['shoreline','third','coyote'].includes(id)){
   const view=await evaluate(`(()=>{const h=foilTest.session.horses[0],g=FoilWorld.geography;for(let d=40;d<=140;d+=20)for(let i=0;i<48;i++){const a=i*Math.PI/24,x=h.x+Math.sin(a)*d,z=h.z+Math.cos(a)*d;if(g.signedShore(x,z)>-6||FoilWorld.bedHeight(x,z)>-.4)continue;let clear=true;for(let k=2;k<48;k++){const t=k/48,y=2+(h.y+1.65-2)*t;if(FoilWorld.cameraBlocked(x+(h.x-x)*t,y,z+(h.z-z)*t,.05)){clear=false;break;}}if(clear)return {from:[x,2,z],to:[h.x,h.y+1.2,h.z],distance:d};}return null;})()`);assert.ok(view,id+' horse must be visible from open water');await evaluate(`foilTest.inspectScenery(${JSON.stringify(view.from)},${JSON.stringify(view.to)})`);await frames();await screenshot(id+'-horse-from-water');console.log(id,'horse visible from water',view.distance,h.x,h.z);
   const labels=await evaluate("[...document.querySelectorAll('.landmark-label:not([hidden])')].map(n=>({bottom:n.getBoundingClientRect().bottom,anchor:Number(n.dataset.anchorY)}))");for(const l of labels)assert.ok(l.bottom<l.anchor-8,'Labels sit above their world anchor');
  }
  await evaluate('foilTest.resume()');await click('home');await click('chart-back');await click('home');await click('chart-back');
 }
 // After six scene lifecycles, a held key must run exactly one input handler.
 await evaluate('foilTest.start(0,{free:true});foilTest.session.setConditions({wind:0,swell:0});foilTest.session.stand();foilTest.session.controls.trim=0');await cdp('Input.dispatchKeyEvent',{type:'keyDown',code:'ArrowDown',key:'ArrowDown',windowsVirtualKeyCode:40});await evaluate('foilTest.inputStep(.5)');await cdp('Input.dispatchKeyEvent',{type:'keyUp',code:'ArrowDown',key:'ArrowDown',windowsVirtualKeyCode:40});const power=await evaluate('foilTest.control.trim');assert.ok(power>.18&&power<.24,String(power));
 console.log('All locations switched within one document while offline; old WebGL contexts released, input intact.');
 }finally{await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
}
