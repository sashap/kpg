const test=require('node:test'),assert=require('node:assert/strict');const world=require('./world.js'),{Session}=require('./core.js'),{fly}=require('./test-pilot.cjs');
for(const id of ['shoreline','third','coyote','crissy'])test(id+' has mapped land, deep-water launch, matching terrain and playable courses',()=>{
 world.activate(id);try{const g=world.geography;assert.ok(world.bedHeight(0,0)<-2);assert.ok(g.surfaces[0].points.length>10000);assert.ok(g.water||g.coast.length>30);const s=new Session(1);assert.ok(s.safety.foilClearance>1);fly(s,18);assert.ok(s.complete,JSON.stringify({id,reason:s.fallReason,x:s.x,z:s.z}));assert.equal(s.stats.crashes,0);assert.ok(world.bedHeight(s.gate.x,s.gate.z)<-1.9);
 for(const surf of g.surfaces)for(let k=0;k<surf.indices.length;k+=Math.max(3,Math.floor(surf.indices.length/60/3)*3)){const a=surf.points[surf.indices[k]],b=surf.points[surf.indices[k+1]],c=surf.points[surf.indices[k+2]],x=.2*a[0]+.3*b[0]+.5*c[0],z=.2*a[2]+.3*b[2]+.5*c[2],y=.2*a[1]+.3*b[1]+.5*c[1];assert.ok(Math.abs(world.terrainHeight(x,z)-y)<1e-5,JSON.stringify({id,x,z,y,h:world.terrainHeight(x,z)}));}
 let land=0,water=0;for(const p of g.surfaces[0].points){if(p[1]>.5)land++;if(p[1]<-1.5)water++;}assert.ok(land>500&&water>500);
 for(const b of g.solids.slice(0,10)){const [a,c]=b.points;const x=(a[0]+c[0])/2,z=(a[1]+c[1])/2;assert.ok(g.blocked(x,z,.3,b.y),'Building boundary must be solid');}
 }finally{world.activate('academy');}
});
test('familiar landmarks have correct relative bearings and scale',()=>{
 world.activate('coyote');let p=world.geography.project([37.61586,-122.38378]);assert.ok(p[0]>4000&&p[1]>2000,'SFO lies northwest, several kilometres away');
 world.activate('crissy');p=world.geography.project([37.8198,-122.4785]);assert.ok(p[0]>2000&&p[1]>1000,'Golden Gate lies northwest');p=world.geography.project([37.8267,-122.423]);assert.ok(p[0]<-2500&&p[1]>2000,'Alcatraz lies northeast');
 world.activate('shoreline');p=world.geography.project([37.43270,-122.08810]);assert.ok(p[0]<0&&p[1]<0,'Boathouse lies southeast of the practice buoy');const area=Math.abs(world.geography.water.reduce((a,p,i,list)=>{const q=list[(i+1)%list.length];return a+p[0]*q[1]-p[1]*q[0];},0))/2;assert.ok(area>180000&&area<220000,'Lake outline retains its actual scale');world.activate('academy');
});
