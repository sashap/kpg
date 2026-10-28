const test=require('node:test'),assert=require('node:assert/strict');
const {Session}=require('./core.js');
const dt=1/60;
function flight(conditions){
 const s=new Session(1,{free:true,conditions:{gust:0,...conditions}});
 Object.assign(s,{standing:true,standAmount:1,height:.4-s.lastSea,speed:7,foiling:true,pitch:(90*9.81/(.5*1025*.18*49)-.20)/4.8,trim:.68});
 s.controls.trim=.68;return s;
}
test('short chop changes foil immersion without adding heave to the board',()=>{
 const calm=flight({swell:0}),chop=flight({swell:.12,chop:.8,waveLength:6,waveDirection:Math.PI});
 let minClearance=1,maxClearance=0;
 for(let i=0;i<480;i++){
  const before=chop.lastSea+chop.height;calm.step(dt);chop.step(dt);
  assert.equal(chop.mode,'sailing');assert.ok(chop.foiling);
  assert.ok(Math.abs(chop.lastSea+chop.height-before-chop.vertical*dt)<1e-12,'Only vertical velocity changes absolute altitude');
  assert.ok(Math.abs(chop.lastSea+chop.height-calm.height)<1e-9,'Same flight path through calm water and short chop');
  minClearance=Math.min(minClearance,chop.height);maxClearance=Math.max(maxClearance,chop.height);
 }
 assert.ok(maxClearance-minClearance>.1,'Waves still pass up and down around the mast');
});
test('long waves retain real touchdowns and breaches when the rider makes no height corrections',()=>{
 const s=flight({swell:.6,chop:0,waveLength:80});let touched=false,maxHeight=0;
 for(let i=0;i<600&&s.mode==='sailing';i++){s.step(dt);if(s.height===0)touched=true;maxHeight=Math.max(maxHeight,s.height);}
 assert.ok(touched,'A long crest can reach the board');assert.ok(maxHeight>.89,'A trough can uncover the foil');
 assert.equal(s.mode,'falling');assert.match(s.fallReason,/breached/);
});
