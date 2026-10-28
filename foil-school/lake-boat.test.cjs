const test=require('node:test'),assert=require('node:assert/strict'),B=require('./lake-boat.js'),W=require('./world.js'),{Session}=require('./core.js');
test('the small pedalboat follows a continuous loop safely inside Shoreline Lake',()=>{W.activate('shoreline');try{for(let i=0;i<=400;i++){const p=B.frame(i*Math.PI*2/.028/400,W.geography.project);assert.ok(W.geography.signedShore(p.x,p.z)<-15);assert.ok(W.bedHeight(p.x,p.z)<-1.2);assert.ok(Number.isFinite(p.heading));}}finally{W.activate('academy');}});
test('pedalboat collision catches fast crossing paths, permits near misses, and only exists at Shoreline',()=>{W.activate('shoreline');try{const b=B.frame(10,W.geography.project),from={x:b.x-12,z:b.z},to={x:b.x+12,z:b.z};assert.ok(B.collision(W,from,to,10,1/60));assert.equal(B.collision(W,{x:b.x-12,z:b.z+5},{x:b.x+12,z:b.z+5},10,1/60),null);}finally{W.activate('academy');}assert.equal(B.collision(W,{x:0,z:0},{x:1,z:1},0,.1),null);});
test('hitting the pedalboat causes a normal fall, followed by swimming and explicit reboarding',()=>{W.activate('shoreline');try{const s=new Session(0,{free:true}),b=B.frame(0,W.geography.project);Object.assign(s,{x:b.x,z:b.z,heading:Math.PI/2,speed:4.5,height:.4,standing:true,standAmount:1});s.lastSafe={x:b.x-5,z:b.z};s.step(1/60);assert.equal(s.mode,'falling');assert.equal(s.lastCollision.kind,'pedalboat');assert.match(s.fallReason,/pedal boat/);for(let i=0;i<240;i++)s.step(1/60);assert.equal(s.mode,'swimming');assert.ok(s.board);assert.equal(s.stats.crashes,1);}finally{W.activate('academy');}});

test('forward pedal stroke pushes the bottom of the cycle toward the stern',()=>{
 const {pedalFoot}=require('./lake-boat.js'),bottom=Math.PI*1.5,front=Math.PI;
 assert.ok(pedalFoot(bottom+.01).z<pedalFoot(bottom-.01).z);
 assert.ok(pedalFoot(front+.01).y<pedalFoot(front-.01).y);
});
