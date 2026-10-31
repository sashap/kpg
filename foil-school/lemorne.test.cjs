const test=require('node:test'),assert=require('node:assert/strict');
const L=require('./locations.js'),W=require('./world.js'),E=require('./elevations.js'),H=require('./horses.js'),{Session}=require('./core.js'),pilot=require('./traffic.js');

test('Le Morne uses an eastward land closure, real mountain relief and separate lagoon islands',()=>{
 const g=L.create('lemorne');assert.equal(g.site.windFrom,-Math.PI*3/4);assert.equal(E.waterDatum('lemorne'),0);
 const h=(lat,lon)=>g.terrainHeight(...g.project([lat,lon]));
 assert.ok(h(-20.4528,57.3232)>510&&h(-20.4528,57.3232)<560,'Full-scale GLO-30 mountain, not a generic cone');
 assert.ok(h(-20.47116,57.33714)>2,'Ilôt Fourneau stays above the lagoon');
 assert.ok(h(-20.4674,57.3192)<-3,'Clear water at the lesson start');
 assert.ok(h(-20.46,57.295)<-6,'Indian Ocean west of the peninsula is water');
 assert.ok(h(-20.446,57.36)>100,'Mainland hills to the east remain land');
 assert.equal(g.shoreRocks.length,0,'Sandy launch must not acquire generic riprap');
 const chart=L.create('lemorne',{mapOnly:true});assert.deepEqual(chart.polygons,g.polygons);assert.deepEqual(chart.features.reefs,g.features.reefs);assert.equal(chart.surfaces,undefined);
 assert.ok(g.features.buildings.length>150&&g.features.parking.length>=2&&g.features.paths.length>30);
 assert.ok(g.features.buildings.every(b=>b.kind!=='hotel-site'),'Hotel grounds are not building footprints');
});

test('Mapped reef shallows affect the foil, while the sandy launch has a continuous accessible grade',()=>{
 W.activate('lemorne');try{const g=W.geography;let shallow=0;
  for(const r of g.leMorne.reefs){const p=r.points.reduce((a,b)=>[a[0]+b[0]/r.points.length,a[1]+b[1]/r.points.length],[0,0]);if(g.signedShore(...p)>0||!L.inside(...p,r.points))continue;if(g.terrainHeight(...p)>-1.4)shallow++;}assert.ok(shallow>=4);
  const start=g.project([-20.46535,57.31830]),end=g.project([-20.46475,57.31770]);let prev=g.walkHeight(...start);
  for(let i=1;i<=120;i++){const t=i/120,x=start[0]+(end[0]-start[0])*t,z=start[1]+(end[1]-start[1])*t,y=g.walkHeight(x,z);assert.ok(Math.abs(y-prev)<.18,'No cliff or invisible step at the beach');assert.ok(!g.blocked(x,z,.3,y));prev=y;}
  assert.ok(prev>.5&&prev<4);const horses=H.spawn(W);assert.equal(horses.length,1);assert.ok(Math.hypot(horses[0].x-end[0],horses[0].z-end[1])<45);assert.ok(H.support(W,horses[0].x,horses[0].z,0));
  const s=new Session(0,{free:true});assert.ok(s.safety.foilClearance>2);
 }finally{W.activate('academy');}
});

test('Le Morne traffic finds clear reaches at southeast trades and alternate winds',()=>{
 W.activate('lemorne');try{for(const wind of [-Math.PI*3/4,0,Math.PI/2]){const routes=pilot.routes(W,wind);assert.equal(routes.length,25);for(const r of routes)for(let t=0;t<100;t+=4){const p=pilot.position(r,t,9);assert.ok(W.bedHeight(p.x,p.z)<-1.6,JSON.stringify({wind,p}));}}}finally{W.activate('academy');}
});
