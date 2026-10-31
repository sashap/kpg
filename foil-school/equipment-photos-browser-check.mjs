import assert from 'node:assert/strict';
export async function check({evaluate,cdp,frames,click,screenshot}){
 await cdp('Network.enable');await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 try{
  const photos=await evaluate(`(async()=>{const result=[];for(const [family,m] of Object.entries(FoilEquipmentMedia))for(const v of m.views){const i=new Image();i.src=v.data;await i.decode();result.push({family,w:i.naturalWidth,h:i.naturalHeight,local:i.src.startsWith('data:image/')});}return result;})()`);
  assert.equal(photos.length,33);assert.ok(photos.every(p=>p.w>=500&&p.h>=400&&p.local));
  await click('gear-intro');
  const select=async id=>{await evaluate(`document.querySelector('[data-gear-item="${id}"]').id='gear-photo-select'`);await click('gear-photo-select');};
  const brand=async value=>{await evaluate(`(()=>{const s=document.getElementById('gear-brand');s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change'));})()`);await frames();};
  for(const type of ['board','foil','wing']){
   await brand('all');await click('gear-tab-'+type);
   const ids=await evaluate(`FoilEquipment.catalog.filter(p=>p.type==='${type}').map(p=>p.id)`);
   for(const id of ids){await evaluate(`document.querySelector('[data-gear-item="${id}"]').click()`);const shown=await evaluate(`(async()=>{const i=document.querySelector('#gear-photo-open img');await i.decode();return {name:document.querySelector('.gear-detail h3').textContent,alt:i.alt,src:i.src.slice(0,11),width:i.naturalWidth};})()`);assert.ok(shown.alt.includes(shown.name)&&shown.width>=500&&shown.src==='data:image/');}
   for(const b of ['F-One','Duotone','Armstrong']){await brand(b);const shown=await evaluate(`Array.from(document.querySelectorAll('[data-gear-item]'),b=>FoilEquipment.byId[b.dataset.gearItem].brand)`);assert.ok(shown.length&&shown.every(x=>x===b));}
  }
  await brand('F-One');await select('fone-strike-5');const initial=await evaluate("document.querySelector('#gear-photo-open img').src");
  await evaluate("document.querySelector('[data-gear-photo=\"1\"]').click()");assert.notEqual(await evaluate("document.querySelector('#gear-photo-open img').src"),initial);
  await click('gear-photo-open');assert.equal(await evaluate("document.querySelector('.gear-photo-dialog').open"),true);await screenshot('shop-photo-enlarged');
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await frames();assert.equal(await evaluate("!!document.querySelector('.gear-photo-dialog')"),false);assert.equal(await evaluate('foilTest.view'),'gear');
  // Earn first-course rewards through the wallet API; purchase and equip all three new brand categories.
  await evaluate("for(const id of ['taxiing','first-flights','touch-and-go','sustained-flight','pumping'])FoilEquipment.lesson(foilTest.progress.equipment,id,3)");
  for(const [type,b,id] of [['wing','F-One','fone-origin-5'],['board','Duotone','duotone-free-120'],['foil','Armstrong','armstrong-s1-1550']]){
   await brand('all');await click('gear-tab-'+type);await brand(b);await select(id);await click('gear-buy');await click('gear-equip');assert.equal(await evaluate(`foilTest.progress.equipment.equipped.${type}`),id);
  }
  await brand('all');await click('gear-tab-wing');
  await select('mantis-apex-55');
  for(const [width,height] of [[1180,820],[390,844],[320,568],[844,390]]){
   await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await frames();
   const layout=await evaluate(`(()=>{const m=document.getElementById('modal-card'),i=document.getElementById('gear-photo-open').getBoundingClientRect();return {overflow:m.scrollWidth>m.clientWidth+1,page:document.body.scrollWidth>innerWidth,image:i.width,items:document.querySelectorAll('[data-gear-item]').length};})()`);assert.ok(!layout.overflow&&!layout.page&&layout.image>150,JSON.stringify({width,layout}));
   await evaluate("document.getElementById('gear-photo-open').scrollIntoView({block:'center'})");await frames();await screenshot('shop-photos-'+width);
   await click('gear-photo-open');const dialog=await evaluate(`(()=>{const d=document.querySelector('.gear-photo-dialog'),r=d.getBoundingClientRect();return {overflow:d.scrollWidth>d.clientWidth+1,left:r.left,right:r.right,top:r.top,bottom:r.bottom};})()`);assert.ok(!dialog.overflow&&dialog.left>=0&&dialog.right<=width&&dialog.top>=0&&dialog.bottom<=height,JSON.stringify({width,dialog}));await evaluate("document.querySelector('.gear-photo-dialog button').click()");
  }
  assert.equal(await evaluate("performance.getEntriesByType('resource').filter(r=>/^https?:/.test(r.name)).length"),0);
  console.log('33 embedded images decoded offline; all 30 product cards, brand filters, alternate views, enlarged photos, three-brand purchases and four touch layouts passed');
 }finally{await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
}
