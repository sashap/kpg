const test=require('node:test'),assert=require('node:assert/strict'),geometry=require('./scenery-geometry.js'),world=require('./world.js'),{Session}=require('./core.js');
test('paving and turf follow every terrain facet without buried holes',()=>{
 const s={n:2,half:1,step:1,points:[[-1,0,-1],[0,2,-1],[1,0,-1],[-1,1,0],[0,-1,0],[1,1,0],[-1,0,1],[0,2,1],[1,0,1]],indices:[0,3,1,1,3,4,1,4,2,2,4,5,3,6,4,4,6,7,4,7,5,5,7,8]};
 const p=geometry.drape([[[-.8,-.7],[.9,-.7],[.9,.8]],[[-.8,-.7],[.9,.8],[-.8,.8]]],[s],.05);let area=0;
 for(let i=0;i<p.length;i+=9){const a=p.slice(i,i+3),b=p.slice(i+3,i+6),c=p.slice(i+6,i+9);area+=Math.abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))/2;for(const v of [a,b,c]){const x=v[0]+1,z=v[2]+1,k=Math.floor(z)*3+Math.floor(x),u=x%1,w=z%1,h=s.points.map(p=>p[1]),expected=u+w<=1?h[k]+u*(h[k+1]-h[k])+w*(h[k+3]-h[k]):h[k+4]+(1-u)*(h[k+3]-h[k+4])+(1-w)*(h[k+1]-h[k+4]);assert.ok(Math.abs(v[1]-expected-.05)<1e-7);}}
 assert.ok(Math.abs(area-1.7*1.5)<1e-7,'Clipping covers the complete overlay exactly once');
});
test('San Mateo deck connects both mapped approaches without height gaps',()=>{
 world.activate('third');const g=world.geography,b=geometry.bridge(g.raw,g.project,g.terrainHeight),m=geometry.ribbon(b.points,30,(_,__,i)=>b.ys[i]);
 assert.deepEqual(g.raw.bridgeApproaches[0].at(-1),g.raw.bridge[0]);assert.deepEqual(g.raw.bridgeApproaches[1][0],g.raw.bridge.at(-1));assert.ok(b.mainLength>10000&&b.westLength>500&&b.eastLength>500);assert.ok(Math.max(...b.ys)>48);
 assert.equal(m.indices.length,(b.points.length-1)*6);for(let i=1;i<b.points.length;i++){const d=Math.hypot(...b.points[i].map((n,k)=>n-b.points[i-1][k]));assert.ok(d<=40.001);assert.ok(Math.abs(b.ys[i]-b.ys[i-1])/d<.085);const k=i*2;assert.deepEqual(m.indices.slice((i-1)*6,i*6),[k-2,k,k-1,k-1,k,k+1]);}world.activate('academy');
});
test('curving sloped promenade uses shared edges instead of disconnected tiles',()=>{
 const p=geometry.sample([[0,0],[15,0],[25,9],[30,18]],2),m=geometry.ribbon(p,4,(x,z)=>.08*x+.12*z);
 assert.equal(m.positions.length,p.length*6);for(let i=0;i<m.positions.length;i+=3)assert.ok(Math.abs(m.positions[i+1]-(m.positions[i]*.08+m.positions[i+2]*.12))<1e-9);
 const edges=new Map();for(let i=0;i<m.indices.length;i+=3)for(let j=0;j<3;j++){const pair=[m.indices[i+j],m.indices[i+(j+1)%3]].sort((a,b)=>a-b).join(',');edges.set(pair,(edges.get(pair)||0)+1);}for(let i=1;i<p.length-1;i++)assert.equal(edges.get([i*2,i*2+1].join(',')),2);
});
test('Coyote boulders can be crossed and descended; concrete ramp gaps stay clear',()=>{
 world.activate('coyote');const g=world.geography;let crossed=0;
 for(const r of g.shoreRocks.filter((_,i)=>i%51===0)){const a={x:r.x-2,z:r.z},b={x:r.x+2,z:r.z};if(g.blocked(a.x,a.z)||g.blocked(b.x,b.z))continue;const s=new Session(0,{free:true});Object.assign(s,{mode:'walking',x:a.x,z:a.z,walkY:g.walkHeight(a.x,a.z),heading:Math.PI/2});s.controls.balance=-1;for(let i=0;i<150;i++)s.step(1/60);assert.ok(s.x>r.x+1.8,JSON.stringify({r,end:s.x,mode:s.mode}));crossed++;}
 assert.ok(crossed>12);for(const r of g.ramps)assert.ok(!g.shoreRocks.some(b=>Math.hypot(b.x-r[0],b.z-r[1])<5));world.activate('academy');
});
test('Meta-to-beach promenade stays flat, above terrain, and continuously walkable',()=>{
 world.activate('coyote');const g=world.geography,p=g.promenade;assert.ok(p.points.length>500);
 for(let i=1;i<p.points.length-1;i++){const [x,z]=p.points[i],n=p.segments[i];for(const offset of [-1.7,0,1.7]){const a=x+n.nx*offset,b=z+n.nz*offset;assert.equal(g.walkHeight(a,b),p.height,JSON.stringify({i,offset,actual:g.walkHeight(a,b)}));assert.ok(g.terrainHeight(a,b)<p.height-.07,JSON.stringify({i,terrain:g.terrainHeight(a,b)}));assert.ok(!g.blocked(a,b));}}
 const s=new Session(0,{free:true});Object.assign(s,{mode:'walking',x:p.points[2][0],z:p.points[2][1],walkY:p.height});s.controls.balance=-1;
 for(let i=3;i<p.points.length-1;i++){const [x,z]=p.points[i];let k=0;while(Math.hypot(x-s.x,z-s.z)>.08&&k++<160){s.heading=Math.atan2(x-s.x,z-s.z);s.step(1/60);}assert.ok(k<160,JSON.stringify({i,x:s.x,z:s.z}));assert.equal(s.mode,'walking');assert.ok(Math.abs(s.walkY-p.height)<.001);}
 for(const r of p.ramps){Object.assign(s,{x:r.x,z:r.z,mode:'walking',walkY:p.height,heading:Math.atan2(r.nx,r.nz)});for(let i=0;i<Math.ceil(r.length/2.4*60)+40;i++)s.step(1/60);assert.ok(Math.hypot(s.x-r.x,s.z-r.z)>r.length-1,'Ramp should reach the water');}
 world.activate('academy');
});
