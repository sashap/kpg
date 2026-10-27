/* Hoaloha Park and Kahului port, guided by the county's 2024 site photographs.
   Repeated foliage, containers, fence posts and fittings share geometry. */
(function(root){'use strict';
function build(c){
 const {THREE,scene,scenery,mesh,box,ell,rod,g,group,polygon,path,marker,actors,frame,hipRoof,sign,groundPatch,shrub,plant,windsock}=c;
 const V=(x,y,z)=>new THREE.Vector3(x,y,z),H=g.harbor;let seed=12891;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const glass=new THREE.MeshStandardMaterial({color:0x435e65,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-3}),wood=0x887050,leaf=0x487343;
 for(const b of H.breaks)groundPatch(b.points,0x626b65);
 function solid(p,w,d,h=.8){p.updateWorldMatrix(true,false);const pts=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2],[-w/2,-d/2]].map(([x,z])=>{const v=p.localToWorld(V(x,0,z));return [v.x,v.z];});g.addSolid({kind:'park-fixture',points:pts,y:p.getWorldPosition(V(0,0,0)).y,height:h});}
 // A curved, pointed open hull, shared by all outrigger canoes.
 const canoeGeo=new THREE.BufferGeometry(),cp=[],ci=[];for(let i=0;i<=24;i++){const t=i/24,z=(t-.5)*12.4,w=.47*Math.pow(Math.sin(Math.PI*t),.55)+.015,y=.12+Math.pow(Math.abs(2*t-1),4)*.32;for(const [side,up] of [[-1,1],[-.65,0],[.65,0],[1,1]])cp.push(side*w,y+up*.38,z);if(i<24)for(let j=0;j<3;j++){const a=i*4+j;ci.push(a,a+4,a+1,a+1,a+4,a+5);}}
 canoeGeo.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));canoeGeo.setIndex(ci);canoeGeo.computeVertexNormals();const canoeMats=[0xe1c15d,0xf0eee0,0x648eaf,0xbc6552].map(color=>new THREE.MeshStandardMaterial({color,roughness:.65,side:THREE.DoubleSide}));
 function canoe(parent,x,y,z,heading,index=0){const p=new THREE.Group();p.position.set(x,y,z);p.rotation.y=heading;parent.add(p);mesh(p,canoeGeo,canoeMats[index%4]);for(let k=-4;k<=4;k+=1.55)box(p,wood,0,.49,k,.8,.07,.22);for(const zz of [-2.1,2.1]){rod(p,wood,[-.4,.55,zz],[-2.0,.43,zz+.18],.055);rod(p,wood,[-2,.43,zz+.18],[-2.3,.25,zz+.18],.05);}ell(p,index%2?0xe5e2cf:0x9c7543,-2.3,.25,0,.13,.17,3.6);return p;}
 // Coconut palms with curved trunks and individual drooping, feathered fronds.
 const frond=new THREE.BufferGeometry(),fp=[],fi=[];for(let i=0;i<=12;i++){const t=i/12,z=t*5.2,y=Math.sin(t*Math.PI)*1.05-t*t*1.5,w=Math.sin(t*Math.PI)*.66;fp.push(-w,y,z,0,y+.12,z,w,y,z);if(i<12){const a=i*3;fi.push(a,a+3,a+1,a+1,a+3,a+4,a+1,a+4,a+2,a+2,a+4,a+5);}}
 frond.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));frond.setIndex(fi);frond.computeVertexNormals();const palmMat=new THREE.MeshStandardMaterial({color:leaf,side:THREE.DoubleSide,roughness:1});
 function palm(lat,lon,h=13,angle=0){const [x,z]=g.project([lat,lon]),y=g.terrainHeight(x,z);if(y<.2||g.blocked(x,z,.5,y))return;const lean=1.1+rnd()*1.6,a=angle||rnd()*6.28;for(let i=0;i<7;i++){const t=i/7,u=(i+1)/7;rod(scenery,i%2?0x9b927c:0x8c8672,[x+Math.cos(a)*lean*t*t,y+h*t,z+Math.sin(a)*lean*t*t],[x+Math.cos(a)*lean*u*u,y+h*u,z+Math.sin(a)*lean*u*u],.18+(1-t)*.13);}
  const crown=new THREE.Group();crown.position.set(x+Math.cos(a)*lean,y+h,z+Math.sin(a)*lean);scenery.add(crown);for(let i=0;i<11;i++){const m=mesh(crown,frond,palmMat,0,0,0,.75+rnd()*.35,.85,1);m.rotation.y=i*2.399;m.rotation.x=-.3+(i%3)*.19;}for(let i=0;i<5;i++)ell(crown,0x8e8750,Math.cos(i)*.25,-.25,Math.sin(i)*.25,.15,.20,.15);
  g.addSolid({kind:'palm',y,height:h,points:Array.from({length:13},(_,i)=>[x+Math.cos(i*Math.PI/6)*.3,z+Math.sin(i*Math.PI/6)*.3])});
 }
 // Photos show thin coconut trunks above the two hales and a continuous low
 // naupaka hedge, with open sandy gaps used to carry canoes to the water.
 for(const [lat,lon,n,h] of [[20.89218,-156.46891,24,14],[20.89172,-156.46932,16,13],[20.89122,-156.4702,14,12],[20.89312,-156.46813,9,12],[20.89667,-156.47836,9,11]])for(let i=0;i<n;i++)palm(lat+(rnd()-.5)*.00065,lon+(rnd()-.5)*.00054,h+rnd()*5);
 // The county survey also records kukui, milo and monkeypod. Broad crowns
 // sit behind the beach hedge and around the overflow lawn, not in sand.
 for(const [lat,lon] of [[20.89140,-156.46944],[20.89160,-156.46952],[20.89135,-156.46871],[20.89134,-156.46855],[20.89175,-156.46866],[20.89248,-156.46857],[20.89265,-156.46849]]){const [x,z]=g.project([lat,lon]);plant(x,z,7+rnd()*3,'broadleaf');}
 for(let i=0;i<48;i++){const t=i/47,lat=20.89204+t*.00069,lon=-156.46931+t*.00059;if(i>14&&i<20||i>34&&i<39)continue;const [x,z]=g.project([lat,lon]);shrub(x,z,1.0+rnd()*.55);}
 // Canoe hales: open racks below dark hipped roofs, raised central gables,
 // blue / purple posts, rather than solid generic office buildings.
 let hale=0;for(const b of g.features.buildings.filter(b=>b.style==='canoe-hale')){const f=frame(b),p=f.p,blue=hale?0x75637e:0x617e8a;hipRoof(p,0,0,f.w+1.7,f.d+1.7,3.55,2.1,0x5c6259);hipRoof(p,0,0,f.w*.48,f.d*.50,5.3,2.0,0x5c6259);box(p,0xc7c9b6,0,4.55,0,f.w*.48,1.5,f.d*.50);
  for(const x of [-f.w*.46,f.w*.46])for(let z=-f.d*.43;z<=f.d*.44;z+=f.d*.215){box(p,blue,x,1.8,z,.23,3.6,.23);const q=new THREE.Group();p.add(q);q.position.set(x,0,z);solid(q,.28,.28,3.7);}for(const x of [-f.w*.46,f.w*.46])box(p,blue,x,3.25,0,.24,.35,f.d);for(let k=0;k<3;k++){canoe(p,-f.w*.28,.1+k*.73,0,0,k+hale);canoe(p,f.w*.28,.1+k*.73,0,0,k+1);}sign(p,hale?'NA KAI EWALU':'HAWAIIAN CANOE CLUB',0,3.1,f.d/2+.1,Math.min(11,f.w),.55);hale++;
 }
 const traditional=group(20.89255,-156.46868);hipRoof(traditional,0,0,10,13,2.2,4.2,0x73614a);for(const x of [-4,4])for(const z of [-5,5])rod(traditional,wood,[x,0,z],[x,2.6,z],.17);
 for(let i=0;i<10;i++){const [x,z]=g.project([20.89215+i*.000045,-156.46916+i*.000035]);canoe(scenery,x,g.terrainHeight(x,z),z,1.0,i);}
 const parkSign=group(20.89157,-156.46905);for(const x of [-1.3,1.3])rod(parkSign,wood,[x,0,0],[x,2.2,0],.08);sign(parkSign,'HO‘ALOHA PARK',0,1.75,0,3.3,.72,Math.PI);
 // Walkways follow the photographed access between the hales and Café O'Lei.
 path([[20.89167,-156.46885],[20.89204,-156.46855],[20.89238,-156.46843]].map(g.project),1.7,0xb4b3a0);
 for(const p of H.quays)polygon(p,5.85,0x8c9391,-3.5);
 // A single chain-link plane per span, plus posts/rails. Alpha-tested diamond
 // wire stays stable instead of overlapping transparent layers that flicker.
 const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');ctx.strokeStyle='#99a49f';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,64);ctx.lineTo(64,0);ctx.lineTo(128,64);ctx.lineTo(64,128);ctx.closePath();ctx.stroke();const wire=new THREE.CanvasTexture(cv);wire.wrapS=wire.wrapT=THREE.RepeatWrapping;const wireMat=new THREE.MeshStandardMaterial({map:wire,transparent:false,alphaTest:.32,side:THREE.DoubleSide,roughness:1});
 for(const f of H.fences){const {a,b}=f,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/3.1);for(let i=0;i<=n;i++){const t=i/n,x=a[0]+dx*t,z=a[1]+dz*t,y=g.terrainHeight(x,z);rod(scenery,0x808c88,[x,y,z],[x,y+2.75,z],.045);}const sample=FoilSceneryGeometry.sample([a,b],3),positions=[],uv=[],idx=[];for(let i=0;i<sample.length;i++){const [x,z]=sample[i],y=g.terrainHeight(x,z);positions.push(x,y+.06,z,x,y+2.7,z);uv.push(i*6,0,i*6,5.4);if(i){const k=i*2;idx.push(k-2,k,k-1,k-1,k,k+1);rod(scenery,0x808c88,[sample[i-1][0],g.terrainHeight(...sample[i-1])+2.7,sample[i-1][1]],[x,y+2.7,z],.035);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(scenery,geo,wireMat);}
 // Standard containers and reefers in rows aligned with each real cargo quay.
 function container(p,x,y,z,color=0xc8c8b9){
  box(p,color,x,y+1.3,z,2.44,2.6,12.2);
  const rib=new THREE.Color(color).multiplyScalar(.83).getHex();
  for(let k=-5.8;k<6;k+=.85)for(const side of [-1,1])box(p,rib,x+side*1.24,y+1.3,z+k,.035,2.35,.07);
  for(const zz of [-6.13,6.13]){box(p,color,x,y+1.3,z+zz,2.32,2.4,.055);for(const xx of [-.55,.55])box(p,0x88958e,x+xx,y+1.3,z+zz*1.005,.045,2.24,.045);box(p,0x7d8781,x,y+1.3,z+zz*1.006,.025,2.4,.03);}
 }
 // Stacks face the harbor at the mapped cargo yards. Upper tiers expose their
 // side corrugations and doors above the quays rather than hiding behind them.
 for(const [lat,lon,angle,rows,cols] of [[20.89766,-156.46646,1.00,6,7],[20.89845,-156.46779,1.00,4,6],[20.89335,-156.46702,1.0,5,5]]){const p=group(lat,lon);p.position.y=2.35;p.rotation.y=angle;for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
  const tiers=1+((i*7+j*3)%3);for(let k=0;k<tiers;k++)container(p,(i-rows/2)*3.5,k*2.6,(j-cols/2)*14,[0xd4d4c8,0x889b9a,0xa35c43,0x486c80,0xdcdacc,0x6b7d5c][(i+j+k)%6]);
 }}
 // Fuel tanks are actual mapped circles beside the working port.
 const cylinder=new THREE.CylinderGeometry(1,1,1,24),cap=new THREE.ConeGeometry(1,.065,24);for(const t of g.tanks){mesh(scenery,cylinder,0xd9dcd3,t.x,t.y+t.height/2,t.z,t.radius,t.height,t.radius);mesh(scenery,cap,0xf0eee1,t.x,t.y+t.height+.25,t.z,t.radius,8,t.radius);}
 // Moored ships have pointed bow geometry and shared collision footprints.
 for(const s of H.ships){const p=new THREE.Group();p.position.set(s.x,0,s.z);p.rotation.y=s.heading;scenery.add(p);const {positions,indices}=FoilHarbor.hullGeometry(s);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(p,geo,s.kind==='cargo'?0x263e49:0xe5e4d9);box(p,0x8d8f85,0,s.deck+.03,-s.length*.07,s.width*.86,.10,s.length*.78);
  if(s.kind==='cargo'){for(let i=-3;i<=3;i++)for(let j=-2;j<=3;j++)for(let k=0;k<2;k++)container(p,i*2.5,s.deck+k*2.6,j*13,[0xa66046,0xb4bcae,0x5e8090,0xd7d2bf][(i+j+8)%4]);box(p,0xd9ded4,0,s.deck+8,-s.length*.35,s.width*.82,16,25);box(p,glass,0,s.deck+14,-s.length*.35+12.6,s.width*.9,2,.18);for(const z of [-20,35]){rod(p,0xb8b9a5,[0,s.deck,z],[0,s.deck+27,z],.65);rod(p,0xb8b9a5,[0,s.deck+26,z],[25,s.deck+21,z+14],.45);rod(p,0x53615e,[25,s.deck+21,z+14],[25,s.deck+4,z+14],.035);}}
  else{
   const ivory=0xe9e8df,navy=0x344d67,rail=0xd6d9d3;
   // Rounded deck plates share a vertical cabin wall for most of the ship;
   // only the aft terraces and sun deck step back, as on the reference ship.
   function deck(w,l,y,h,z,color,r=4){const shape=new THREE.Shape(),x=-w/2,b=-l/2;shape.moveTo(x+r,b);shape.lineTo(-x-r,b);shape.quadraticCurveTo(-x,b,-x,b+r);shape.lineTo(-x,-b-r);shape.quadraticCurveTo(-x,-b,-x-r,-b);shape.lineTo(x+r,-b);shape.quadraticCurveTo(x,-b,x,-b-r);shape.lineTo(x,b+r);shape.quadraticCurveTo(x,b,x+r,b);const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:6});const m=mesh(p,geo,color,0,y,z);m.rotation.x=-Math.PI/2;return m;}
   // A deep-blue boot stripe and regularly spaced portholes above the water.
   for(const side of [-1,1]){box(p,navy,side*s.width*.483,1.5,-s.length*.08,.09,.65,s.length*.65);for(let z=-s.length*.40;z<s.length*.28;z+=3.6){box(p,glass,side*s.width*.495,4.1,z,.12,.55,.65);}}
   deck(29,169,7,2.6,-10,ivory);deck(28,166,9.6,2.6,-10,ivory);
   // The promenade is recessed behind the lifeboats. Balconies have individual
   // dark doors, pale dividers, continuous deck edges and thin outer rails.
   deck(25.8,161,12.2,19.1,-10,ivory);
   for(let floor=0;floor<7;floor++){const y=12.3+floor*2.7;
    deck(29.0,164-floor*.45,y,.20,-10+floor*.20,ivory);
    for(const side of [-1,1]){for(let z=-84+floor*.45;z<63;z+=3.5){box(p,glass,side*13.02,y+1.28,z,.11,1.86,2.45);box(p,ivory,side*13.7,y+1.20,z-1.5,1.4,2.35,.07);box(p,0x6d8388,side*14.42,y+.65,z,.06,.82,3.15);}box(p,rail,side*14.47,y+1.13,-10,.08,.10,149);}
   }
   // Sloping forward face, wide navigation bridge and its wing platforms.
   for(let floor=0;floor<7;floor++){const y=12.3+floor*2.7,z=74-floor*.95;deck(27.8,16,y,2.7,z-8,ivory);for(let x=-10;x<=10;x+=4)box(p,glass,x,y+1.32,z+.03,2.6,1.3,.10);}
   deck(31.8,23,31.4,2.4,61,glass,5);deck(33,25,33.8,.5,60,ivory,5);for(let x=-14;x<=14;x+=3.2)box(p,ivory,x,32.55,72.4,.16,2.4,.3);
   deck(27,152,31.4,.28,-12,0xc1af8c);deck(25,36,31.7,3.2,28,ivory);deck(21,32,34.9,.25,28,ivory);
   // Pool well, aft open terrace, lounges and railings on the sun deck.
   box(p,ivory,0,31.95,-14,10,.55,23);box(p,0x539ca8,0,32.24,-14,8,.08,20);
   for(const side of [-1,1])for(let z=-35;z<0;z+=4.2){box(p,0xe1dfcb,side*9.5,32.2,z,1.1,.28,2.2);const back=box(p,0x6c969c,side*9.5,32.5,z-.75,1,.8,.12);back.rotation.x=.35;}
   for(const side of [-1,1]){box(p,rail,side*13.3,32.8,-14,.09,.09,142);for(let z=-82;z<=57;z+=4)box(p,rail,side*13.3,32.25,z,.06,1.1,.06);}
   // Covered orange lifeboats hang from white davits, with glazing and gunwales.
   for(const side of [-1,1])for(let j=0;j<8;j++){const z=-65+j*16,x=side*15.15;ell(p,0xd67b28,x,12.1,z,1.35,1.15,5.5);ell(p,0xefdeba,x,12.7,z,1.12,.65,4.9);box(p,glass,x+side*1.12,12.8,z,.08,.45,7.4);for(const zz of [z-3.9,z+3.9]){rod(p,rail,[side*13,14.2,zz],[side*16,14.2,zz],.11);rod(p,rail,[side*16,14.2,zz],[side*16,12.5,zz],.045);}}
   // Funnel, exhausts, radar domes and forward navigation mast.
   deck(10,14,32,8,-62,navy,2);for(const y of [35,36.3,37.6])box(p,ivory,0,y,-62,10.2,.6,14.1);for(const x of [-2.2,2.2])mesh(p,new THREE.CylinderGeometry(1.05,1.05,3,12),0x38464b,x,41,-62);
   for(const z of [-38,4]){rod(p,ivory,[0,32,z],[0,37.7,z],.5);ell(p,0xe4e6e0,0,38.4,z,2,2.3,2);}
   rod(p,ivory,[0,34,57],[0,45,54],.28);rod(p,ivory,[-5,42,55],[5,42,55],.13);box(p,navy,0,43.7,54.2,4.2,.25,.6);
   // Restrained hull livery follows the flat midbody; it does not float off the bow.
   for(const side of [-1,1])for(let i=0;i<20;i++){const z=-63+i*5,y=6.1+Math.sin(i*.25)*.65;box(p,i%13<8?0xa64c44:navy,side*15.98,y,z,.065,.70,5.04);}
  }

  for(const z of [-s.length*.42,s.length*.36])rod(p,0xd7d9cd,[0,s.deck,z],[0,s.deck+13,z],.15);
 }
 // Harbor navigation marks; red on the west/right side when entering.
 const buoys=[];for(const [lat,lon,color] of [[20.90068,-156.47450,0xb74e3b],[20.90080,-156.47200,0x39785e],[20.89850,-156.47380,0xb74e3b],[20.89730,-156.47035,0x39785e]]){const [x,z]=g.project([lat,lon]),p=new THREE.Group();p.position.set(x,0,z);scene.add(p);mesh(p,new THREE.CylinderGeometry(.65,.95,.75,12),color,0,.25,0);rod(p,color,[0,.5,0],[0,2.8,0],.07);mesh(p,new THREE.ConeGeometry(.5,.6,8),color,0,2.8,0);buoys.push(p);}actors.push(s=>{for(let i=0;i<buoys.length;i++){buoys[i].position.y=Math.sin(s.time*1.2+i)*.07;buoys[i].rotation.z=Math.sin(s.time*.8+i)*.035;}});
 // A crew follows a smooth sheltered oval, never teleporting between ends.
 const crew=canoe(scene,0,0,0,0,0),rowers=[],limbGeo=new THREE.CylinderGeometry(1,1,1,8),skinMat=[0xb77e58,0x855b42,0xc39470].map(color=>new THREE.MeshStandardMaterial({color,roughness:.85}));
 const Y=V(0,1,0),segment=(m,a,b,r)=>{m.position.copy(a).add(b).multiplyScalar(.5);const d=b.clone().sub(a);m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(Y,d.normalize());};
 function elbow(a,b,side){const d=b.clone().sub(a),len=Math.min(.575,d.length()),axis=d.normalize(),middle=len/2,bend=V(side,-.3,-.5).addScaledVector(axis,-V(side,-.3,-.5).dot(axis)).normalize();return a.clone().addScaledVector(axis,middle).addScaledVector(bend,Math.sqrt(Math.max(0,.29*.29-middle*middle)));}
 for(let j=0;j<6;j++){const z=-3.9+j*1.55,side=j%2?1:-1,skin=skinMat[j%3],body=new THREE.Group();body.position.set(0,.70,z);crew.add(body);
  ell(body,skin,0,.22,0,.19,.27,.13);ell(body,j%2?0xb76836:0x466b78,0,.20,0,.20,.22,.145);ell(body,skin,0,.57,.015,.105,.14,.103);ell(body,0x34312c,0,.67,-.012,.109,.056,.10);ell(crew,0x344a50,0,.62,z,.20,.11,.18);
  for(const leg of [-1,1]){rod(crew,0x344a50,[leg*.12,.65,z],[leg*.16,.47,z+.40],.08);rod(crew,skin,[leg*.16,.47,z+.40],[leg*.16,.25,z+.59],.044);ell(crew,0x333b3c,leg*.16,.24,z+.66,.06,.045,.12);}
  const paddle=new THREE.Group();crew.add(paddle);rod(paddle,wood,[0,0,0],[0,1.28,0],.018);ell(paddle,0xb18c52,0,-.12,0,.105,.23,.025);rod(paddle,wood,[-.06,1.28,0],[.06,1.28,0],.015);
  const arms=[-1,1].map(armSide=>({side:armSide,upper:mesh(crew,limbGeo,skin),fore:mesh(crew,limbGeo,skin),hand:ell(crew,skin,0,0,0,.027,.032,.029)}));rowers.push({z,side,body,paddle,arms});
 }
 actors.push(s=>{const at=FoilHarbor.canoeFrame(s.time,g.project);crew.position.set(at.x,.02+Math.sin(s.time*1.3)*.025,at.z);crew.rotation.y=at.heading;crew.rotation.z=Math.sin(s.time*2.8)*.006;
  rowers.forEach((r,i)=>{const phase=((s.time*.72-i*.009)%1+1)%1,drive=phase<.60,u=drive?phase/.60:(phase-.60)/.40,smooth=u*u*(3-2*u),reach=drive?.65-1.15*smooth:-.50+1.15*smooth,lift=drive?-.04-.08*Math.sin(u*Math.PI):-.04+.28*Math.sin(u*Math.PI);
   r.body.rotation.x=.07+reach*.19;r.body.updateMatrix();const bottom=V(r.side*.64,lift,r.z+reach),top=V(r.side*.15,lift+1.28,r.z+reach*.20+.18);r.paddle.position.copy(bottom);r.paddle.quaternion.setFromUnitVectors(Y,top.clone().sub(bottom).normalize());
   // Both hands remain on the shaft; the alternating-side stroke reaches,
   // catches below the surface, pulls aft, then lifts for recovery.
   const axis=top.clone().sub(bottom).normalize();top.copy(bottom).addScaledVector(axis,1.28);
   r.arms.forEach(a=>{const shoulder=V(a.side*.19,.36,0).applyMatrix4(r.body.matrix),hand=a.side===r.side?top.clone().lerp(bottom,.31):top.clone(),joint=elbow(shoulder,hand,a.side);segment(a.upper,shoulder,joint,.045);segment(a.fore,joint,hand,.035);a.hand.position.copy(hand);});
  });
 });
 windsock(20.89242,-156.46860);windsock(20.89668,-156.4783);
 marker('Ho‘aloha Park & canoe hales','HO‘ALOHA PARK',20.89226,-156.46891,12);
 marker('Puunene Avenue · beach access','PUʻUNĒNĒ ACCESS',20.89323,-156.46790,4);
 marker('Kahului commercial harbor','CARGO PORT',20.89765,-156.46646,15);
 marker('West breakwater','WEST BREAKWATER',20.9003,-156.4745,7);
 marker('Small-boat launch','BOAT RAMP',20.89627,-156.4785,5);
 return {paddlers:rowers.length,canoeHales:hale,mooredShips:H.ships.length,buoys:buoys.length,portFenceSegments:H.fences.length,beachGroins:H.groins.filter(b=>!b.low).length};
}
root.FoilHarborScenery={build};
})(globalThis);
