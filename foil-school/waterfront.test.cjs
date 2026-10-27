const test=require('node:test'),assert=require('node:assert/strict');
const L=require('./locations.js'),P=require('./waterfront-model.js'),world=require('./world.js'),{Session}=require('./core.js');
test('mapped parking stalls stay inside lots and leave drive aisles open',()=>{
 for(const id of ['shoreline','third','coyote']){const g=L.create(id),p=P.parking(id,g.features,L.inside,L.distance);assert.ok(p.lots.length>0&&p.stalls.length>25,id);for(const s of p.stalls){const lot=p.lots.find(l=>l.id===s.lot);assert.ok(s.corners.every(c=>L.inside(...c,lot.points)));assert.ok(p.aisles.every(a=>s.corners.every(c=>L.distance(...c,a.points)>=2.7)));assert.ok(Number.isFinite(s.angle));}}
});
test('Coyote rock armor leaves both mapped beaches and promenade ramps open',()=>{
 const g=L.create('coyote'),beaches=g.features.ground.filter(p=>p.kind==='beach');assert.ok(beaches.some(p=>p.id==='1092264607'),'Aardvark Beach toward Meta');assert.ok(beaches.some(p=>p.id==='1023523442'),'Coyote Point Beach');
 for(const rock of g.shoreRocks){for(const beach of beaches){assert.ok(!L.inside(rock.x,rock.z,beach.points));assert.ok(L.distance(rock.x,rock.z,beach.points)>Math.max(rock.rx,rock.rz));}assert.ok(!g.promenade.rampAt(rock.x,rock.z));}
 assert.ok(g.shoreRocks.length>1500);assert.ok(g.features.buildings.some(b=>b.style==='pump'&&b.id==='1267736760'));
});
test('Third Avenue lower concrete ramp has a clear, continuous walkable slope into water',()=>{
 world.activate('third');try{const g=world.geography,a=g.shoreAccess,r=a.ramp;assert.match(g.site.name,/Lower Launch/);assert.ok(Math.hypot(...g.project(g.site.launch))<180);assert.ok(world.clearance(new Session(),0).foilClearance>1.5);
  for(let t=.02;t<.99;t+=.02)for(const cross of [-1.7,0,1.7]){const x=r.a[0]+(r.b[0]-r.a[0])*t+r.nx*cross,z=r.a[1]+(r.b[1]-r.a[1])*t+r.nz*cross,h=a.at(x,z).height;assert.ok(g.terrainHeight(x,z)<h+.025,JSON.stringify({t,cross,h,terrain:g.terrainHeight(x,z)}));assert.ok(Math.abs(g.walkHeight(x,z)-h)<.025);assert.ok(!g.blocked(x,z));}
  const s=new Session();s.dismount();Object.assign(s,{mode:'walking',x:r.a[0],z:r.a[1],walkY:r.top,heading:Math.atan2(r.b[0]-r.a[0],r.b[1]-r.a[1]),speed:0});s.controls.balance=-1;for(let i=0;i<25*60;i++)s.step(1/60);assert.ok(Math.hypot(s.x-r.a[0],s.z-r.a[1])>r.length*.8,'Player can walk down the ramp into the bay');assert.ok(g.walkHeight(...a.dock)>.4);assert.ok(g.features.paths.some(p=>p.id==='44422697'&&p.surface==='asphalt'));
 }finally{world.activate('academy');}
});
