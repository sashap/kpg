import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot,tablet,phone}){
 await click('begin');
 // Enter and leave fullscreen through actual input, keeping menus in the fullscreen root.
 await click('fullscreen');await frames();assert.equal(await evaluate('document.fullscreenElement===document.documentElement'),true);assert.equal(await evaluate("document.getElementById('fullscreen').getAttribute('aria-pressed')"),'true');
 await click('chart');assert.equal(await evaluate("document.fullscreenElement.contains(document.getElementById('modal'))"),true);await click('chart-close');await click('fullscreen');await frames();assert.equal(await evaluate('!!document.fullscreenElement'),false);
 await click('fullscreen');await evaluate('document.exitFullscreen()');await frames();assert.equal(await evaluate("document.getElementById('fullscreen').getAttribute('aria-pressed')"),'false');
 // A shallow boarding attempt reports why; the same action works once in deeper water.
 await evaluate(`(()=>{foilTest.start(0,{free:true,conditions:{wind:0,swell:0,gust:0}});const s=foilTest.session;s.dismount();let x=-190;for(;x<-150;x+=.2)if(FoilWorld.clearance({x,z:-80,heading:0,height:0,pitch:0,roll:0},0).hit)break;Object.assign(s,{mode:'swimming',x,z:-80,board:{x,z:-80,heading:0},towing:true});foilTest.inputStep(0);})()`);
 await click('stand');assert.match(await evaluate("document.getElementById('toast').textContent"),/Too shallow.*Tow your board farther out/);assert.equal(await evaluate('foilTest.session.mode'),'swimming');await screenshot('shallow-feedback');
 await evaluate("Object.assign(foilTest.session,{x:0,z:0,board:{x:0,z:0,heading:0}});foilTest.inputStep(0)");await click('stand');assert.equal(await evaluate('foilTest.session.mode'),'sailing');
 const protectedGame=await evaluate(`(()=>{const game=document.getElementById('joystick'),a=new Event('gesturestart',{bubbles:true,cancelable:true}),b=new Event('selectstart',{bubbles:true,cancelable:true});game.dispatchEvent(a);game.dispatchEvent(b);return {gesture:a.defaultPrevented,select:b.defaultPrevented,touch:getComputedStyle(game).touchAction,selection:getComputedStyle(game).userSelect};})()`);assert.deepEqual(protectedGame,{gesture:true,select:true,touch:'none',selection:'none'});
 // Header fits even when the new fullscreen button is present.
 for(const [width,height] of [[320,568],[375,667],[390,844],[844,390],[1180,820]]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:tablet||phone});await frames();
  const header=await evaluate("[...document.querySelectorAll('header button')].filter(b=>b.offsetWidth).map(b=>{const r=b.getBoundingClientRect();return {id:b.id,x:r.x,right:r.right}})");for(let i=0;i<header.length;i++){assert.ok(header[i].x>=0&&header[i].right<=width,JSON.stringify({width,header}));if(i)assert.ok(header[i].x>=header[i-1].right,JSON.stringify({width,header}));}
 }
 await cdp('Emulation.setDeviceMetricsOverride',{width:phone?390:tablet?1180:1440,height:phone?844:tablet?820:960,deviceScaleFactor:1,mobile:tablet||phone});
 for(const site of ['academy','coyote','third','shoreline','kahului','crissy']){
  if(site!=='academy'){await evaluate(`foilTest.travel('${site}',{screen:'intro'})`);for(let i=0;i<240;i++){await new Promise(r=>setTimeout(r,120));if(await evaluate(`!!window.foilTest&&FoilWorld.location.id==='${site}'&&!!document.getElementById('begin')`))break;}await click('begin');}
  await click('chart');await frames();
  const layout=await evaluate(`(()=>{const m=document.getElementById('bay-map'),r=m.getBoundingClientRect(),c=document.getElementById('modal-card');return {width:r.width,height:r.height,range:+m.dataset.range,scroll:c.scrollHeight,client:c.clientHeight};})()`);assert.ok(layout.width>250&&layout.height>200,JSON.stringify({site,layout}));assert.ok(layout.scroll<=layout.client+1,JSON.stringify({site,layout}));assert.ok(layout.range<=550);
  const menuGesture=await evaluate("(()=>{const e=new Event('gesturestart',{bubbles:true,cancelable:true});document.getElementById('modal-title').dispatchEvent(e);return e.defaultPrevented;})()");assert.equal(menuGesture,false);
  await click('map-in');assert.ok(await evaluate(`+document.getElementById('bay-map').dataset.range<${layout.range*.8}`));await click('map-all');assert.ok(await evaluate(`+document.getElementById('bay-map').dataset.range>${layout.range}`));await click('map-near');
  // Pick a reference without dismissing the chart; the map focuses both player and reference.
  await click('landmark-1');assert.equal(await evaluate("document.getElementById('modal').classList.contains('hidden')"),false);assert.equal(await evaluate("document.getElementById('landmark-1').getAttribute('aria-pressed')"),'true');await click('map-near');
  const p=await evaluate("(()=>{const r=document.getElementById('bay-map').getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*.5};})()"),before=await evaluate("document.getElementById('bay-map').dataset.center");
  if(tablet||phone){await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:44}]});await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+55,y:p.y+20,id:44}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x+55,y:p.y+20,button:'left',buttons:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x+55,y:p.y+20,button:'left',clickCount:1});}
  assert.notEqual(await evaluate("document.getElementById('bay-map').dataset.center"),before);
  if((tablet||phone)&&site==='coyote'){
   const range=await evaluate("+document.getElementById('bay-map').dataset.range"),scale=await evaluate('visualViewport.scale');
   await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x-25,y:p.y,id:51},{x:p.x+25,y:p.y,id:52}]});await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x-55,y:p.y,id:51},{x:p.x+55,y:p.y,id:52}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await evaluate(`+document.getElementById('bay-map').dataset.range<${range*.7}`));assert.equal(await evaluate('visualViewport.scale'),scale);
  }
  await click('map-near');await screenshot('navigation-'+site);await click('chart-close');
 }
 // Navigation remains usable in compact portrait and landscape, with scroll limited to the list.
 for(const [width,height] of [[320,480],[844,390],[667,375]]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await click('chart');await frames();const layout=await evaluate("(()=>{const m=document.getElementById('modal-card'),b=document.getElementById('bay-map').getBoundingClientRect();return {scroll:m.scrollHeight,client:m.clientHeight,width:b.width,height:b.height,bottom:b.bottom}})()");assert.ok(layout.scroll<=layout.client+1&&layout.width>200&&layout.height>=100&&layout.bottom<height,JSON.stringify({width,height,layout}));await screenshot('navigation-'+width+'-'+height);await click('chart-close');
 }
 console.log('Fullscreen enter/exit, shallow feedback, protected game gestures, header fit and interactive navigation at all six locations passed.');
}
