/* The Shoreline sailing scow, reconstructed from city plans and photos.
   The 2025 replacement specification retains its footprint and silhouette. */
(function(root){'use strict';
function create(project,height){const [x,z]=project([37.43410,-122.09009]),angle=-.55,co=Math.cos(angle),si=Math.sin(angle),base=height(x,z),deck=base+1.05;
 const local=(px,pz)=>[(px-x)*co-(pz-z)*si,(px-x)*si+(pz-z)*co];
 const point=(u,v)=>[x+u*co+v*si,z-u*si+v*co];
 const rampFoot=point(10,0),footHeight=height(...rampFoot)+.05;
 function surface(px,pz){const [u,v]=local(px,pz);if(Math.abs(u)<=2.65&&Math.abs(v)<=6.5)return deck;if(u>=2.5&&u<=10&&Math.abs(v)<.95)return deck+(footHeight-deck)*(u-2.5)/7.5;return -Infinity;}
 function solid(u,v,w,d,y,h){return {kind:'play-scow',y,height:h,points:[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2],[-w/2,-d/2]].map(([a,b])=>point(a+u,b+v))};}
 const solids=[solid(-2.64,0,.12,13,deck,.85),solid(2.64,-3.8,.12,5.4,deck,.85),solid(2.64,3.8,.12,5.4,deck,.85),solid(0,-6.48,5.4,.12,deck,.85),solid(0,6.48,5.4,.12,deck,.85),solid(0,-3.7,.28,.28,deck,8),solid(0,3.7,.28,.28,deck,8)];
 return {x,z,angle,base,deck,footHeight,point,local,surface,solids};
}
function build(c){const {THREE,scenery,mesh,box,rod,sign,groundPatch,g,marker}=c,p=new THREE.Group(),m=g.playground;p.position.set(m.x,m.base,m.z);p.rotation.y=m.angle;scenery.add(p);
 const sand=Array.from({length:33},(_,i)=>m.point(Math.cos(i*Math.PI/16)*11,Math.sin(i*Math.PI/16)*14));groundPatch(sand,0xc7bc9b);
 box(p,0x555d59,0,1.0,0,5.3,.10,13);for(const [x,z,d] of [[-2.67,0,13],[2.67,-3.8,5.4],[2.67,3.8,5.4]]){box(p,0xe0e1ce,x,1.0,z,.16,1.9,d);box(p,0x48746c,x+Math.sign(x)*.085,1.15,z,.02,.24,d-.1);for(let y=.25;y<1.8;y+=.24)box(p,0xbdc5b5,x+Math.sign(x)*.09,y,z,.012,.018,d-.1);}for(const z of [-6.5,6.5]){box(p,0xdce0cd,0,.95,z,5.3,1.9,.16);box(p,0x48746c,0,1.15,z+Math.sign(z)*.09,5.2,.24,.02);}
 for(const z of [-3.7,3.7]){rod(p,0x675440,[0,.1,z],[0,9,z],.15);rod(p,0x7b6b51,[-2.4,6.5,z],[2.4,6.5,z],.05);for(const x of [-2.5,2.5])for(const end of [-6,6])rod(p,0x596765,[0,8.7,z],[x,1.8,end],.012);}
 for(const x of [-2.1,2.1]){rod(p,0xc6c9b8,[x,1.05,-4.7],[x,2.5,-4.7],.05);for(const [a,b] of x<0?[[-4.7,4.7]]:[[-4.7,-1.2],[1.2,4.7]])rod(p,0xc6c9b8,[x,2.5,a],[x,2.5,b],.04);for(let z=-4.7;z<4.8;z+=.36){if(x>0&&Math.abs(z)<1.2)continue;rod(p,0xbac3b7,[x,1.05,z],[x,2.5,z],.025);}}
 // Boardwalk access is an actual sloped support surface shared with walking.
 const end=m.footHeight-m.base;for(let i=0;i<30;i++){const x=2.5+(i+.5)*7.5/30,y=1.05+(end-1.05)*(x-2.5)/7.5;box(p,0x99866a,x,y-.05,0,.24,.10,1.9);}for(let i=0;i<=5;i++){const x=2.5+i*1.5,y=1.05+(end-1.05)*i/5;for(const z of [-1.02,1.02]){rod(p,0x7b6850,[x,y-.3,z],[x,y+1,z],.07);if(i<5){const yy=1.05+(end-1.05)*(i+1)/5;rod(p,0xddd6bd,[x,y+.8,z],[x+1.5,yy+.8,z],.025);}}}
 const wheel=mesh(p,new THREE.TorusGeometry(.33,.035,6,20),0x66523d,0,2.0,-4.7);for(let i=0;i<6;i++){const a=i*Math.PI/3;rod(p,0x66523d,[0,2,-4.7],[Math.sin(a)*.4,2+Math.cos(a)*.4,-4.7],.025);}rod(p,0x8a7a58,[0,1.05,-4.75],[0,2.0,-4.75],.06);
 sign(p,'MOUNTAIN VIEW',0,1.65,6.6,4.5,.35);sign(p,'MOUNTAIN VIEW',-2.77,1.65,0,4.5,.35,-Math.PI/2);
 marker('Mountain View sailing-scow playground','PLAY SCOW',37.43410,-122.09009,10);
}
// The familiar pre-rebuild castle/dragon layout, guided by the maker's photos.
function createCoyote(project,height){
 const [x,z]=project([37.58735,-122.32872]),base=height(x,z),deck=base+1.5,point=(u,v)=>[x+u,z+v],local=(px,pz)=>[px-x,pz-z];
 const boundary=[[37.5876654,-122.3289292],[37.5876239,-122.3286556],[37.5874858,-122.3284397],[37.5872041,-122.3284048],[37.5869937,-122.3288272],[37.587016,-122.3289238],[37.5872254,-122.3289976],[37.5874114,-122.3290177],[37.5876654,-122.3289292]].map(project);
 const approach=[[37.58887,-122.32824],[37.5883642,-122.3280083],[37.5882339,-122.3283029],[37.5881914,-122.3283874],[37.5880777,-122.3288031],[37.5879969,-122.3290083],[37.5877581,-122.3290008],[37.58766,-122.3289],[37.58752,-122.32878]].map(project);
 const foot=point(11,0),footHeight=height(...foot)+.04;
 function surface(px,pz){const [u,v]=local(px,pz);if(Math.abs(u)<2.9&&Math.abs(v)<2.9)return deck;if(u>=2.8&&u<=11&&Math.abs(v)<1.25)return deck+(footHeight-deck)*(u-2.8)/8.2;return -Infinity;}
 const solids=[],solid=(u,v,w,d,y,h)=>{solids.push({kind:'magic-playground',y,height:h,points:[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2],[-w/2,-d/2]].map(([a,b])=>point(a+u,b+v))});};
 for(const u of [-2.8,2.8])for(const v of [-2.8,2.8])solid(u,v,.28,.28,base,11);
 solid(-2.88,0,.15,5.8,deck,1.1);for(const v of [-2.88,2.88])solid(0,v,5.8,.15,deck,1.1);for(const v of [-2.05,2.05])solid(2.88,v,.15,1.65,deck,1.1);
 const dragons=[[-12,15,.4],[12,-18,-1.8]];for(const [u,v] of dragons)solid(u,v,4.0,4.0,height(...point(u,v)),2.3);
 return {x,z,base,deck,footHeight,point,local,surface,solids,boundary,approach,dragons,clear:(px,pz)=>FoilLocations.inside(px,pz,boundary)||FoilLocations.distance(px,pz,approach)<2.4};
}
function buildCoyote(c){const {THREE,scenery,mesh,box,rod,g,path,groundPatch,marker,sign}=c,m=g.playground,V=(x,y,z)=>new THREE.Vector3(x,y,z),sphere=new THREE.SphereGeometry(1,22,14),silver=new THREE.MeshStandardMaterial({color:0x9caeb5,roughness:.48,metalness:.35}),blue=0x537b91,post=0x345561;
 const ell=(p,col,x,y,z,a,b,d)=>mesh(p,sphere,col,x,y,z,a,b,d);
 groundPatch(m.boundary,0xc1ad88);path(m.approach,2.8,0xa9a99b);
 for(const [u,v,r] of [[-10,15,8],[10,-16,10],[0,0,8]]){const ring=Array.from({length:33},(_,i)=>m.point(u+Math.cos(i*Math.PI/16)*r,v+Math.sin(i*Math.PI/16)*r));groundPatch(ring,0x6c93a1,false,2);}
 const p=new THREE.Group();p.position.set(m.x,m.base,m.z);scenery.add(p);
 box(p,0x8e8b77,0,1.40,0,5.8,.20,5.8);
 for(const x of [-2.8,2.8])for(const z of [-2.8,2.8])rod(p,post,[x,0,z],[x,11,z],.13);
 for(const y of [1.5,4.2,7.0,9.5]){if(y>1.5)box(p,0x9e9377,0,y,0,5.7,.15,5.7);for(const z of [-2.85,2.85]){box(p,blue,0,y+.55,z,5.6,1.05,.12);for(let x=-2.7;x<2.8;x+=.7)box(p,0x345463,x,y+.55,z+.065,.025,1.05,.01);for(const h of [.25,.6,.95])box(p,0x345463,0,y+h,z+.065,5.5,.018,.01);}for(const x of [-2.85,2.85]){if(y===1.5&&x>0){for(const z of [-2.05,2.05])box(p,blue,x,y+.55,z,.12,1.1,1.55);}else{box(p,blue,x,y+.4,0,.12,.8,5.6);for(let z=-2.6;z<2.7;z+=.27)rod(p,0xa9b5b6,[x,y+.8,z],[x,y+2.0,z],.018);rod(p,0xa9b5b6,[x,y+2.0,-2.8],[x,y+2.0,2.8],.045);}}}
 const roof=mesh(p,new THREE.ConeGeometry(4.5,3.2,4),0x627276,0,12.05,0);roof.rotation.y=Math.PI/4;rod(p,0x9ea7a0,[0,13.6,0],[0,15.2,0],.04);
 const flag=new THREE.BufferGeometry();flag.setAttribute('position',new THREE.Float32BufferAttribute([0,15.1,0,1.6,14.8,.1,0,14.4,0],3));flag.computeVertexNormals();mesh(p,flag,new THREE.MeshStandardMaterial({color:0x7298af,side:THREE.DoubleSide}));
 // A broad access ramp gives both walkers and the horse a clear route to the deck.
 for(let i=0;i<32;i++){const u=2.8+(i+.5)*8.2/32,y=1.5+(m.footHeight-m.deck)*(u-2.8)/8.2;box(p,0x9a9e94,u,y-.045,0,.26,.09,2.5);}
 for(const z of [-1.32,1.32]){rod(p,0xa9b5b6,[2.8,2.45,z],[11,m.footHeight-m.base+.95,z],.04);for(let x=3;x<=11;x+=1)rod(p,post,[x,1.5+(m.footHeight-m.deck)*(x-2.8)/8.2,z],[x,2.45+(m.footHeight-m.deck)*(x-2.8)/8.2,z],.035);}
 const curve=new THREE.CatmullRomCurve3([V(-2.8,7.6,0),V(-6,7.0,0),V(-10,4.4,-1),V(-15,1.5,-3),V(-19,.7,-3)]);mesh(p,new THREE.TubeGeometry(curve,40,.65,14,false),silver);
 for(let i=0;i<9;i++){const t=i/9,at=curve.getPoint(t),ring=mesh(p,new THREE.TorusGeometry(.68,.04,6,18),0x697b83,...at.toArray());ring.quaternion.setFromUnitVectors(V(0,0,1),curve.getTangent(t));}
 for(const z of [-1.8,1.8]){const chute=new THREE.CatmullRomCurve3([V(0,1.6,z),V(0,1.2,z+Math.sign(z)*2),V(0,.3,z+Math.sign(z)*6)]);mesh(p,new THREE.TubeGeometry(chute,20,.42,12,false),silver);}
 for(const [u,v,angle] of m.dragons){const q=new THREE.Group(),[x,z]=m.point(u,v);q.position.set(x,g.terrainHeight(x,z),z);q.rotation.y=angle;scenery.add(q);
  const purple=0x7e629c;ell(q,purple,0,.9,0,1.9,1.25,1.6);ell(q,0x4b384f,0,.55,1.25,1.25,.49,.85);ell(q,purple,0,.95,1.35,1.4,.47,1);ell(q,purple,0,.16,1.4,1.32,.18,.9);
  for(const side of [-1,1]){ell(q,0xb7b64f,side*.91,1.48,1.13,.28,.24,.12);ell(q,0x28383d,side*.91,1.49,1.245,.055,.19,.025);ell(q,purple,side*1.01,1.72,1.1,.46,.12,.2);ell(q,0x674d86,side*.83,1.02,1.96,.20,.10,.12);ell(q,0x477c5c,side*1.9,.17,.40,.55,.22,.65);for(let j=0;j<3;j++){const tooth=mesh(q,new THREE.ConeGeometry(.10,.26,8),0xe2d6b3,side*(.44+j*.24),.51,1.95);tooth.rotation.x=Math.PI;}}
  const body=new THREE.CatmullRomCurve3([V(0,.6,-.9),V(.5,.9,-3),V(-1,.4,-5),V(1,.8,-7),V(0,.12,-10)]);mesh(q,new THREE.TubeGeometry(body,32,.6,12,false),purple);for(let i=0;i<10;i++){const at=body.getPoint(i/11);mesh(q,new THREE.ConeGeometry(.29,.65,4),0x679266,at.x,at.y+.72,at.z);}
 }
 // Green swing frames, pale seats and a curved climbing ladder.
 for(const row of [-1,1]){const [x,z]=m.point(row*11,row>0?8:-29),y=g.terrainHeight(x,z),q=new THREE.Group();q.position.set(x,y,z);scenery.add(q);for(const end of [-3.5,3.5])for(const dz of [-1.35,1.35])rod(q,0x3b6e63,[end,0,dz],[end,3.2,0],.07);rod(q,0x3b6e63,[-3.5,3.2,0],[3.5,3.2,0],.08);for(const at of [-2,0,2]){box(q,0xc4c2a3,at,.55,0,.55,.06,.28);for(const side of [-.23,.23])rod(q,0x84928e,[at+side,.55,0],[at+side,3.2,0],.012);}}
 for(let i=0;i<17;i++){const a=i*Math.PI/16,x=-7+Math.cos(a)*3,y=Math.sin(a)*2.1,z=-11;rod(p,0xaeb8b0,[x,y,z-1],[x,y,z+1],.04);if(i)for(const side of [-1,1])rod(p,0x667d7d,[-7+Math.cos((i-1)*Math.PI/16)*3,Math.sin((i-1)*Math.PI/16)*2.1,z+side],[x,y,z+side],.045);}
 const entry=m.approach.at(-2),signRoot=new THREE.Group();signRoot.position.set(entry[0],g.terrainHeight(...entry),entry[1]);scenery.add(signRoot);rod(signRoot,0x6c7864,[0,0,0],[0,2,0],.055);sign(signRoot,'MAGIC MOUNTAIN',0,1.75,0,3.8,.5);marker('Magic Mountain · castle & dragons','MAGIC MOUNTAIN',37.58735,-122.32872,16);
}

const api={create,build,createCoyote,buildCoyote};root.FoilPlayground=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
