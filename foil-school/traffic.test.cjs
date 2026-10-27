const test=require('node:test'),assert=require('node:assert/strict'),world=require('./world.js'),{Session}=require('./core.js'),traffic=require('./traffic.js'),pilot=require('./traffic-pilot.js');
test('traffic uses real takeoff, wind, falls and recovery with distinct skill levels',()=>{
 for(const id of ['shoreline','third','coyote','crissy','kahului','academy']){world.activate(id);const player=new Session(0,{free:true});player.x=500;player.z=500;const route=traffic.routes(world,player.config.windFrom,123)[0],results=[];
  for(const expert of [true,false]){const p=pilot.create(world,route,0,1357);let flight=0,taxi=0,recoveries=0,last='sailing';for(let i=0;i<10800;i++){player.time=i/60;const before={x:p.s.x,z:p.s.z};p.update(1/60,player,expert);assert.ok(Math.hypot(p.s.x-before.x,p.s.z-before.z)<.5,'No teleporting');assert.ok(!(p.s.trim>.2&&Math.sin(p.s.heading-p.s.windFrom)*p.s.wingSide>.2),'Unload a backwinded wing');flight+=p.s.foiling/60;taxi+=(p.s.mode==='sailing'&&!p.s.foiling)/60;if(last!=='sailing'&&p.s.mode==='sailing')recoveries++;last=p.s.mode;}results.push({flight,taxi,recoveries,falls:p.s.stats.crashes,pumps:p.s.stats.pumps});}
  assert.ok(results[0].flight>130,JSON.stringify({id,results}));assert.ok(results[0].pumps>0);assert.ok(results[1].flight>20&&results[1].taxi>25&&results[1].falls>=2&&results[1].recoveries>=2,JSON.stringify({id,results}));
 }world.activate('academy');
});
test('visit seeds vary starting positions and close passes trigger visible steering',()=>{
 world.activate('shoreline');const player=new Session(0,{free:true}),route=traffic.routes(world,player.config.windFrom,67)[0],a=pilot.create(world,route,0,123),b=pilot.create(world,route,0,9132);assert.notEqual(a.s.x,b.s.x);assert.notEqual(a.phase,b.phase);
 const control=pilot.create(world,route,0,123);player.x=a.s.x+Math.sin(a.s.heading)*16+Math.cos(a.s.heading)*2;player.z=a.s.z+Math.cos(a.s.heading)*16-Math.sin(a.s.heading)*2;a.update(1/60,player,true);control.update(1/60,{...player,x:1000,z:1000},true);assert.ok(a.s.controls.steer>control.s.controls.steer+.1);assert.ok(Math.hypot(a.s.x-control.s.x,a.s.z-control.s.z)<.01);world.activate('academy');
});
