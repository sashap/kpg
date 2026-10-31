import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot}){
 const choose=async id=>{await evaluate(`document.getElementById('place-choice')?.removeAttribute('id');document.querySelector('[data-location="${id}"]').id='place-choice'`);await click('place-choice');await frames();};
 await click('begin');await click('pause');await click('pause-location');
 assert.equal(await evaluate("document.getElementById('modal-title').textContent"),'Places to Fly');
 await evaluate('window.placeSnapshot={session:foilTest.session,renderer:foilTest.renderer,geography:FoilWorld.geography,contacts:FoilWorld.waterContacts,time:foilTest.session.time,progress:JSON.stringify(foilTest.progress)}');
 await cdp('Network.enable');await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 try{
  for(const id of ['shoreline','third','coyote','kahului','lemorne','crissy','academy']){
   await choose(id);
   const state=await evaluate(`(()=>{const c=document.getElementById('places-map'),p=placeSnapshot,ctx=c.getContext('2d'),data=ctx.getImageData(0,0,c.width,c.height).data;let different=0;for(let i=0;i<data.length;i+=400)if(data[i]!==data[0]||data[i+1]!==data[1])different++;return {id:c.dataset.site,preview:c.dataset.preview,range:+c.dataset.range,active:document.querySelector('[data-location][aria-pressed=true]').dataset.location,unchanged:foilTest.session===p.session&&foilTest.renderer===p.renderer&&FoilWorld.geography===p.geography&&FoilWorld.waterContacts===p.contacts&&foilTest.session.time===p.time&&JSON.stringify(foilTest.progress)===p.progress,different};})()`);
   assert.equal(state.id,id);assert.equal(state.active,id);assert.equal(state.preview,'true');assert.ok(state.range<=550&&state.unchanged&&state.different>50,JSON.stringify(state));
   if(['shoreline','third','coyote'].includes(id))await screenshot('places-'+id);
  }
  await choose('coyote');const range=await evaluate("+document.getElementById('places-map').dataset.range");await click('places-in');assert.ok(await evaluate(`+document.getElementById('places-map').dataset.range<${range}`));await click('places-all');assert.ok(await evaluate(`+document.getElementById('places-map').dataset.range>${range}`));await click('places-near');
  const pos=await evaluate("(()=>{const r=document.getElementById('places-map').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()"),before=await evaluate("document.getElementById('places-map').dataset.center");
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...pos,id:71}]});await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pos.x+60,y:pos.y+20,id:71}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.notEqual(await evaluate("document.getElementById('places-map').dataset.center"),before);
  const oldRange=await evaluate("+document.getElementById('places-map').dataset.range"),viewport=await evaluate('visualViewport.scale');
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pos.x-30,y:pos.y,id:72},{x:pos.x+30,y:pos.y,id:73}]});await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pos.x-60,y:pos.y,id:72},{x:pos.x+60,y:pos.y,id:73}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await evaluate(`+document.getElementById('places-map').dataset.range<${oldRange*.7}`));assert.equal(await evaluate('visualViewport.scale'),viewport);
  // Back is cancel: browsing other places must leave the paused rider exactly where they were.
  await click('locations-back');assert.equal(await evaluate('FoilWorld.location.id'),'academy');assert.equal(await evaluate('foilTest.session===placeSnapshot.session'),true);assert.equal(await evaluate('foilTest.paused'),false);
  await click('pause');await click('pause-location');await choose('coyote');
  for(const [width,height] of [[1180,820],[820,1180],[390,844],[320,480],[844,390],[667,375]]){
   await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await frames();
   const layout=await evaluate(`(()=>{const m=document.getElementById('modal-card'),b=document.getElementById('places-map').getBoundingClientRect(),l=document.querySelector('.places-list').getBoundingClientRect(),go=document.getElementById('locations-go').getBoundingClientRect(),buttons=[...document.querySelectorAll('[data-location]')].map(n=>n.getBoundingClientRect());return {scroll:m.scrollHeight,client:m.clientHeight,overflow:m.scrollWidth>m.clientWidth+1,w:b.width,h:b.height,bottom:b.bottom,listRight:l.right,mapLeft:b.left,go:{x:go.x,y:go.y,right:go.right,bottom:go.bottom},vertical:buttons.every((r,i)=>!i||r.top>=buttons[i-1].bottom-1),sameColumn:buttons.every(r=>Math.abs(r.x-buttons[0].x)<1)};})()`);
   assert.ok(layout.scroll<=layout.client+1&&!layout.overflow&&layout.w>210&&layout.h>=105&&layout.bottom<height,JSON.stringify({width,height,layout}));assert.ok(layout.vertical&&layout.sameColumn);assert.ok(layout.go.x>=0&&layout.go.right<=width&&layout.go.y>=0&&layout.go.bottom<=height,JSON.stringify({width,height,layout}));if(width>600)assert.ok(layout.listRight<layout.mapLeft);
   await screenshot('places-layout-'+width+'-'+height);
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:1180,height:820,deviceScaleFactor:1,mobile:true});await frames();
  const origin=await evaluate('performance.timeOrigin');await click('locations-go');for(let i=0;i<240;i++){await new Promise(r=>setTimeout(r,100));if(await evaluate("!!window.foilTest&&FoilWorld.location.id==='coyote'&&foilTest.view==='play'"))break;}
  assert.equal(await evaluate('FoilWorld.location.id'),'coyote');assert.equal(await evaluate('foilTest.view'),'play');assert.equal(await evaluate('performance.timeOrigin'),origin);assert.equal(await evaluate('foilTest.session.lesson'),0);assert.equal(await evaluate("!!document.getElementById('places-map')"),false);
  // The existing bearings chart still has its player marker and reference selection.
  await click('chart');assert.equal(await evaluate("document.getElementById('bay-map').dataset.preview"),'false');await click('landmark-1');assert.equal(await evaluate("document.getElementById('landmark-1').getAttribute('aria-pressed')"),'true');await click('chart-close');
  // Course selection keeps its destination screen after Go.
  await click('home');await click('course-location');await choose('shoreline');await click('locations-go');for(let i=0;i<240;i++){await new Promise(r=>setTimeout(r,100));if(await evaluate("!!window.foilTest&&FoilWorld.location.id==='shoreline'&&foilTest.view==='chart'"))break;}
  assert.equal(await evaluate('FoilWorld.location.id'),'shoreline');assert.equal(await evaluate('foilTest.view'),'chart');assert.ok(await evaluate("document.getElementById('course-location').textContent.includes('Shoreline')"));
  console.log('Seven offline map previews preserve the live session; touch pan/pinch, six responsive layouts, cancel, Go and course/bearings flows passed');
 }finally{await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
}
