const test=require('node:test'),assert=require('node:assert/strict'),world=require('./world.js'),elevation=require('./elevations.js'),traffic=require('./traffic.js'),{readProgress}=require('./lessons.js');
test('measured terrain preserves low airfield, Coyote knoll and lake datum',()=>{
 for(const [id,lat,lon,lo,hi] of [['coyote',37.5899,-122.3227,17,23],['crissy',37.8048,-122.460,2,5],['shoreline',37.4327,-122.0881,3,6],['third',37.5745,-122.284,.5,4]]){const h=elevation.height(id,lat,lon);assert.ok(h>=lo&&h<=hi,JSON.stringify({id,h}));}
 assert.equal(elevation.waterDatum('shoreline'),2.98);assert.equal(elevation.waterDatum('crissy'),.97);
 for(const id of ['shoreline','third','coyote','crissy']){world.activate(id);const g=world.geography;for(const surface of g.surfaces)for(const [x,y,z] of surface.points){assert.ok(Number.isFinite(y)&&y>=-10.01&&y<1200);if(g.signedShore(x,z)>15&&Math.hypot(x,z)<800&&!(g.promenade?.nearest(x,z)?.distance<23)&&!g.shoreAccess?.at(x,z,8)&&g.bankHeight(x,z,g.signedShore(x,z))===null&&!(surface.x0!==undefined&&Math.min(x-surface.x0,z-surface.z0,surface.x0+surface.n-x,surface.z0+surface.m-z)<8))assert.ok(Math.abs(y-Math.max(.04,g.elevationAt(x,z)-g.waterDatum))<.01);}}
 world.activate('academy');
});
test('mapped parking, open Coyote frontage and shared shoreline armor',()=>{
 world.activate('shoreline');assert.ok(world.geography.features.parking.some(p=>p.id==='32405130'));const o=world.geography.floating[0];assert.ok(world.bedHeight(...o.point)>0);
 world.activate('coyote');const g=world.geography;assert.ok(g.features.buildings.some(b=>b.id==='1041191890'));assert.ok(g.features.buildings.filter(b=>b.style==='meta').length>=4);assert.ok(!g.features.buildings.some(b=>/warehouse|industrial/.test(b.kind)));assert.ok(g.shoreRocks.length>300);for(const r of g.shoreRocks.filter((_,i)=>i%99===0))assert.ok(g.bedHeight(r.x,r.z)>=r.y+r.ry-.001);world.activate('academy');
});
test('25 distant riders fit safe continuous routes at every site and wind direction',()=>{
 for(const id of ['academy','shoreline','third','coyote','crissy']){world.activate(id);for(const wind of [0,Math.PI/2,Math.PI,3*Math.PI/2]){const routes=traffic.routes(world,wind);assert.equal(routes.length,25,id);for(const r of routes)for(let t=0;t<120;t+=1.5){const p=traffic.position(r,t,9);assert.ok(world.bedHeight(p.x,p.z)<-1.6,JSON.stringify({id,p}));assert.ok(Number.isFinite(p.heading));}const a=traffic.position(routes[0],0,0),b=traffic.position(routes[0],20,0);assert.deepEqual(a,b,'Calm air stops the distant riders');}}world.activate('academy');
});
test('traffic preference persists and clamps legacy or invalid values',()=>{assert.equal(readProgress(null).otherFoilers,5);assert.equal(readProgress({version:2,otherFoilers:25}).otherFoilers,25);assert.equal(readProgress({version:2,otherFoilers:0}).otherFoilers,0);assert.equal(readProgress({version:2,otherFoilers:99}).otherFoilers,25);assert.equal(readProgress({version:2,otherFoilers:-3}).otherFoilers,0);});
