/* Anatomical shore horse: shaped barrel/neck/head, articulated legs, tack and
   terrain-aware hooves. One reusable rig per horse, no downloaded assets. */
(function(root){'use strict';
function create({THREE,scene,world}){
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),Y=V(0,1,0),models=new Map(),sphere=new THREE.SphereGeometry(1,22,14),cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,12);
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.82}),dark=material(0x292620),leather=material(0x533d2e),seam=material(0x8f7051),metal=material(0x9da7a3),eye=material(0x161b19),white=material(0xe0d9bd),blanket=material(0x456d71);
 const add=(p,g,m,x=0,y=0,z=0,sx=1,sy=sx,sz=sx)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;p.add(o);return o;},ell=(p,m,x,y,z,a,b,c)=>add(p,sphere,m,x,y,z,a,b,c);
 function bone(p,a,b,ra,rb,m){const d=b.clone().sub(a),o=add(p,new THREE.CylinderGeometry(rb,ra,1,12),m,...a.clone().add(b).multiplyScalar(.5).toArray(),1,d.length(),1);o.quaternion.setFromUnitVectors(Y,d.normalize());return o;}
 function tube(p,points,r,m){return add(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(18,points.length*6),r,7,false),m);}
 function loft(p,rows,m){
  // Subdivide longitudinal sections as well as the circumference. Smooth
  // shoulders, belly and poll must not read as stacked cylinders.
  const control=rows;rows=[];for(let j=0;j<control.length-1;j++)for(let k=0;k<5;k++){const t=k/5,t2=t*t,t3=t2*t,p0=control[Math.max(0,j-1)],p1=control[j],p2=control[j+1],p3=control[Math.min(control.length-1,j+2)];rows.push(p1.map((v,d)=>{const value=.5*((2*v)+(-p0[d]+p2[d])*t+(2*p0[d]-5*v+4*p2[d]-p3[d])*t2+(-p0[d]+3*v-3*p2[d]+p3[d])*t3);return d>=2?Math.max(.004,value):value;}));}rows.push(control.at(-1));
  const pos=[],ids=[],uv=[],rings=24;for(let j=0;j<rows.length;j++){const [y,z,w,d]=rows[j];for(let i=0;i<=rings;i++){const a=i/rings*Math.PI*2;pos.push(Math.cos(a)*w,y+Math.sin(a)*d,z);uv.push(i/rings,j/(rows.length-1));if(j<rows.length-1&&i<rings){const k=j*(rings+1)+i;ids.push(k,k+1,k+rings+1,k+1,k+rings+2,k+rings+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ids);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return add(p,g,m);}
 // Smooth union of anatomical volumes, sampled once when the animal is
 // created. Shared vertex normals keep shoulder / croup transitions seamless.
 function anatomy(parent,forms,mat,bounds,step=.055){
  const [lo,hi]=bounds,n=hi.map((v,i)=>Math.ceil((v-lo[i])/step)),stride=n[0]+1,layer=stride*(n[1]+1),values=new Float32Array(layer*(n[2]+1)),pts=[];
  function field(x,y,z){let d=10;for(const [cx,cy,cz,rx,ry,rz,angle=0] of forms){const a=x-cx,b=(y-cy)*Math.cos(angle)+(z-cz)*Math.sin(angle),c=-(y-cy)*Math.sin(angle)+(z-cz)*Math.cos(angle),k0=Math.hypot(a/rx,b/ry,c/rz),k1=Math.hypot(a/(rx*rx),b/(ry*ry),c/(rz*rz)),q=k0*(k0-1)/Math.max(.001,k1),blend=Math.max(0,.10-Math.abs(d-q))/.10;d=Math.min(d,q)-blend*blend*.025;}return d;}
  for(let z=0;z<=n[2];z++)for(let y=0;y<=n[1];y++)for(let x=0;x<=n[0];x++){const p=V(lo[0]+x*step,lo[1]+y*step,lo[2]+z*step);pts.push(p);values[z*layer+y*stride+x]=field(p.x,p.y,p.z);}
  const pos=[],norm=[],uv=[],eps=.004,normal=p=>V(field(p.x+eps,p.y,p.z)-field(p.x-eps,p.y,p.z),field(p.x,p.y+eps,p.z)-field(p.x,p.y-eps,p.z),field(p.x,p.y,p.z+eps)-field(p.x,p.y,p.z-eps)).normalize();
  const edge=(a,b)=>pts[a].clone().lerp(pts[b],values[a]/(values[a]-values[b]));
  function triangle(a,b,c){const na=normal(a),nb=normal(b),nc=normal(c);if(b.clone().sub(a).cross(c.clone().sub(a)).dot(na)<0){[b,c]=[c,b];[nb.x,nc.x]=[nc.x,nb.x];[nb.y,nc.y]=[nc.y,nb.y];[nb.z,nc.z]=[nc.z,nb.z];}for(const [p,q] of [[a,na],[b,nb],[c,nc]]){pos.push(...p.toArray());norm.push(...q.toArray());uv.push(p.z,p.y);}}
  for(let z=0;z<n[2];z++)for(let y=0;y<n[1];y++)for(let x=0;x<n[0];x++){const k=z*layer+y*stride+x,c=[k,k+1,k+1+stride,k+stride,k+layer,k+layer+1,k+layer+1+stride,k+layer+stride];for(const ids of [[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]]){const ins=ids.map(i=>c[i]).filter(i=>values[i]<0),out=ids.map(i=>c[i]).filter(i=>values[i]>=0);if(ins.length===1)triangle(...out.map(i=>edge(ins[0],i)));else if(ins.length===3)triangle(...ins.map(i=>edge(out[0],i)));else if(ins.length===2){const a=edge(ins[0],out[0]),b=edge(ins[0],out[1]),c1=edge(ins[1],out[1]),d=edge(ins[1],out[0]);triangle(a,b,c1);triangle(a,c1,d);}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return {mesh:add(parent,g,mat),field};
 }
 const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
 function restLeg(i){const front=i<2,side=i%2?-1:1,a=V(side*(front?.19:.20),front?1.32:1.40,front?.66:-.64),theta=front?-.45:.65,l=front?[.31,.46,.41]:[.42,.53,.47],b=a.clone().add(V(0,-Math.cos(theta)*l[0],Math.sin(theta)*l[0])),foot=V(side*.26,.07,front?.68:-.79),ankle=foot.clone().add(V(0,.13,-.035)),c=joint(b,ankle,l[1],l[2],V(0,0,front?1:-1));return [a,b,c,ankle];}
 function makeSkin(parent,coat){
  const rest=Array.from({length:4},(_,i)=>restLeg(i)),forms=[
   [0,1.26,-.08,.335,.345,.77], // rib cage, with a gently tucked flank
   [0,1.39,-.61,.315,.275,.345], // sloping croup, not a separate round rump
   [0,1.35,.46,.27,.34,.32],[0,1.15,.61,.21,.25,.25],
   [0,1.54,.33,.15,.17,.31], // withers balance the height of the croup
   [0,1.53,.70,.19,.39,.235,.48],[0,1.86,1.02,.14,.34,.195,.55],
   [0,2.09,1.20,.10,.16,.12,.30]
  ];
  const along=(a,b,t,rx,ry,rz)=>{const p=a.clone().lerp(b,t),d=b.clone().sub(a);forms.push([p.x,p.y,p.z,rx,ry,rz,Math.atan2(d.z,d.y)]);};
  for(let i=0;i<4;i++){const front=i<2,side=i%2?-1:1,[a,b,c]=rest[i];
   if(front)forms.push([side*.17,1.31,.43,.17,.29,.25,-.5]);
   else forms.push([side*.18,1.25,-.66,.16,.20,.22,.50]); // hamstring blends into the thigh
   // Broad upper muscles reach below the barrel, then taper through the
   // forearm/gaskin. Their overlap is a smooth union, not stacked ellipsoids.
   along(a,b,.25,front?.145:.19,front?.24:.29,front?.205:.255);
   along(a,b,.82,front?.125:.155,.16,front?.145:.195);
   along(b,c,.22,front?.113:.14,front?.215:.25,front?.13:.175);
   along(b,c,.64,front?.077:.088,.16,front?.085:.108);
   along(b,c,.95,.058,.092,.066);
  }
  const sampled=anatomy(parent,forms,coat,[[-.46,.39,-1.12],[.46,2.31,1.43]],.04),temporary=sampled.mesh,geometry=temporary.geometry;parent.remove(temporary);
  const bones=[new THREE.Bone()],skinIndex=[],skinWeight=[],color=[],p=V();parent.add(bones[0]);
  for(const chain of rest)for(let j=0;j<3;j++){const bone=new THREE.Bone();bone.position.copy(chain[j]);bone.quaternion.setFromUnitVectors(Y,chain[j+1].clone().sub(chain[j]).normalize());parent.add(bone);bones.push(bone);}
  const pos=geometry.attributes.position;
  for(let n=0;n<pos.count;n++){
   p.fromBufferAttribute(pos,n);const i=(p.z>0?0:2)+(p.x<0?1:0),[a,b,c]=rest[i],axis=c.clone().sub(b),t=p.clone().sub(b).dot(axis)/axis.lengthSq(),nearest=b.clone().addScaledVector(axis,Math.max(0,Math.min(1,t))),upper=b.clone().sub(a),u=Math.max(0,Math.min(1,p.clone().sub(a).dot(upper)/upper.lengthSq())),distance=Math.min(p.distanceTo(nearest),p.distanceTo(a.clone().addScaledVector(upper,u)));
   // A point behind the stifle can project far along the angled gaskin while
   // still belonging to the thigh. Keep that high muscle on the femur so it
   // does not fold into a notch when the hock comes up during recovery.
   const limb=smooth(a.y-.03,b.y-.08,p.y)*smooth(i<2?.45:.57,i<2?.21:.27,distance),bend=smooth(-.25,.35,t)*smooth(b.y+.12,b.y-.18,p.y),end=smooth(.79,1.12,t),base=1+i*3;
   skinIndex.push(0,base,base+1,base+2);skinWeight.push(1-limb,limb*(1-bend),limb*bend*(1-end),limb*bend*end);
   const shade=1-.60*smooth(.72,.44,p.y);color.push(shade,shade,shade);
  }
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndex,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeight,4));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
  const mat=coat.clone();mat.vertexColors=true;const mesh=new THREE.SkinnedMesh(geometry,mat);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;parent.add(mesh);parent.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));
  return {mesh,bones,rest,field:sampled.field};
 }
 function make(h){const root=new THREE.Group(),body=new THREE.Group();root.add(body);scene.add(root);const coat=material(h.coat==='buckskin'?0xa89060:0x80513b),shade=material(h.coat==='buckskin'?0x8d764c:0x5c3d2f),muzzle=material(0x6a6254);
  const grain=document.createElement('canvas');grain.width=grain.height=128;const paint=grain.getContext('2d');paint.fillStyle='#888';paint.fillRect(0,0,128,128);let seed=31;for(let i=0;i<7000;i++){seed=(1664525*seed+1013904223)>>>0;const v=100+seed%70;paint.fillStyle='rgb('+v+','+v+','+v+')';paint.fillRect((seed>>>8)%128,(seed>>>17)%128,1,2);}const fur=new THREE.CanvasTexture(grain);fur.wrapS=fur.wrapT=THREE.RepeatWrapping;fur.repeat.set(5,5);coat.bumpMap=fur;coat.bumpScale=.002;coat.roughness=.72;
  // One continuous skin covers the torso, shoulders, thighs, forearms and
  // gaskins. The old rigid croup hid the thighs as they swung and left narrow
  // cylinders hanging below it. Here muscle follows the articulated skeleton.
  const skin=makeSkin(root,coat),barrel=skin.mesh;
  const neck=new THREE.Group();body.add(neck);
  const head=new THREE.Group();head.position.set(0,2.10,1.20);neck.add(head);head.rotation.x=.28;
  loft(head,[[.04,-.14,.012,.02],[.03,-.08,.105,.13],[-.02,.02,.13,.18],[-.10,.14,.11,.17],[-.19,.28,.088,.13],[-.29,.40,.092,.095],[-.36,.52,.107,.075],[-.36,.58,.07,.055],[-.36,.61,.004,.01]],coat);
  ell(head,muzzle,0,-.355,.51,.109,.083,.109);
  for(const side of [-1,1]){ell(head,shade,side*.105,-.01,.10,.046,.045,.053);ell(head,eye,side*.132,.015,.11,.019,.027,.030);ell(head,white,side*.147,.026,.121,.004,.006,.006);const nostril=ell(head,dark,side*.097,-.337,.55,.018,.032,.027);nostril.rotation.z=side*.3;tube(head,[V(side*.095,-.404,.46),V(side*.08,-.42,.54),V(side*.025,-.418,.60)],.004,dark);}
  // Tapered upright ears. Keep the face clean: the old raised blaze mesh
  // protruded from the sloping bridge of the nose like a small white horn.
  const ears=[];for(const side of [-1,1]){const ear=new THREE.Group();ear.position.set(side*.085,.11,-.04);ear.rotation.z=-side*.15;head.add(ear);const o=ell(ear,coat,0,.085,0,.039,.112,.034);o.rotation.x=-.10;ell(ear,shade,0,.08,.026,.023,.077,.009);ears.push(ear);}
  // Root the mane in the actual neck surface, with a continuous strip over
  // the crest. It shares the skin's body transform, so nodding cannot detach it.
  const coatTop=(x,z)=>{let y=2.6;while(y>.8&&skin.field(x,y,z)>0)y-=.015;let lo=y,hi=y+.015;for(let k=0;k<12;k++){const m=(lo+hi)/2;if(skin.field(x,m,z)>0)hi=m;else lo=m;}return (lo+hi)/2;};
  const maneRoots=[],manePos=[],maneIds=[];for(let i=0;i<=44;i++){const z=.34+i/44*.84,top=coatTop(0,z),width=.105-.027*smooth(.85,1.18,z);maneRoots.push(V(0,top-.009,z));for(let j=0;j<=8;j++){const t=j/8,x=-.018+(width+.018)*t,y=coatTop(x,z)+.009+Math.sin(t*Math.PI)*.016; manePos.push(x,y,z);if(i<44&&j<8){const a=i*9+j;maneIds.push(a,a+9,a+1,a+1,a+9,a+10);}}}
  const maneGeo=new THREE.BufferGeometry();maneGeo.setAttribute('position',new THREE.Float32BufferAttribute(manePos,3));maneGeo.setIndex(maneIds);maneGeo.computeVertexNormals();const maneMat=dark.clone();maneMat.side=THREE.DoubleSide;add(body,maneGeo,maneMat);
  for(let i=0;i<maneRoots.length;i++){const p=maneRoots[i],x=.105-.027*smooth(.85,1.18,p.z);tube(body,[p,V(.025,coatTop(.025,p.z)+.016,p.z),V(x,coatTop(x,p.z)+.008,p.z-.008)],.010,dark);}
  tube(head,[V(0,.14,-.10),V(.025,.15,-.025),V(.04,.02,.04)],.029,dark);
  const tail=new THREE.Group();tail.position.set(0,1.49,-.90);body.add(tail);tube(tail,[V(),V(0,-.22,-.19),V(0,-.57,-.24),V(0,-.89,-.28)],.055,dark);for(let i=0;i<13;i++){const a=i*Math.PI*2/13;tube(tail,[V(Math.cos(a)*.035,0,0),V(Math.cos(a)*.07,-.22,-.20),V(Math.cos(a)*.10,-.55,-.24),V(Math.cos(a)*.085,-.91,-.29)],.022,dark);}
  // Pad and leather follow the sampled rib cage. The narrow twist drops
  // away beneath the thighs; neither is a flat disc intersecting the rider.
  const coatAround=(theta,z)=>{const c=V(0,1.25,z),d=V(Math.sin(theta),Math.cos(theta),0);let lo=0,hi=.8;for(let k=0;k<20;k++){const r=(lo+hi)/2,p=c.clone().addScaledVector(d,r);if(skin.field(p.x,p.y,p.z)>0)hi=r;else lo=r;}return c.addScaledVector(d,(lo+hi)/2);};
  function fittedSheet(mat,z0,z1,extent,lift){const pos=[],ids=[],samples=[];for(let j=0;j<=24;j++)for(let i=0;i<=32;i++){const u=i/32*2-1,v=j/24,z=z0+(z1-z0)*v+u*u*(.07*(1-v)-.035*v),theta=u*extent*(.82+.18*Math.sin(v*Math.PI)),base=coatAround(theta,z),p=base.clone().addScaledVector(V(Math.sin(theta),Math.cos(theta),0),.018+lift);if(lift){const edge=Math.pow(Math.abs((z+.06)/.33),6)*.055,target=1.730-.27*Math.pow(Math.abs(p.x)/.255,2)+edge;p.y=Math.max(p.y,target);}pos.push(...p.toArray());if(j===12)samples.push(p.toArray());if(j<24&&i<32){const a=j*33+i;ids.push(a,a+33,a+1,a+1,a+33,a+34);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(ids);geo.computeVertexNormals();const m=mat.clone();m.side=THREE.DoubleSide;const o=add(body,geo,m);return {mesh:o,samples};}
  const pad=fittedSheet(blanket,-.45,.30,1.49,0),saddle=fittedSheet(leather,-.36,.245,1.38,.025);
  for(const [z,rise] of [[-.32,.045],[.21,.025]]){const pts=[];for(let i=0;i<=12;i++){const x=(i/12*2-1)*.205;pts.push(V(x,Math.max(coatTop(x,z)+.05,1.715-.22*(x/.255)**2)+rise,z));}tube(body,pts,.022,leather);}
  for(const side of [-1,1]){tube(body,[V(side*.23,1.58,.09),V(side*.38,1.27,.09),V(side*.435,1.05,.24)],.013,leather);const stirrup=add(body,new THREE.TorusGeometry(.075,.010,7,16),metal,side*.435,1.05,.24,1,.70,1);stirrup.rotation.y=Math.PI/2;}
  tube(body,[V(-.34,1.50,.28),V(-.36,1.08,.28),V(0,.91,.28),V(.36,1.08,.28),V(.34,1.50,.28)],.024,leather);
  for(const side of [-1,1]){tube(head,[V(side*.115,.11,-.07),V(side*.145,-.06,.18),V(side*.11,-.35,.46)],.012,leather);const ring=add(head,new THREE.TorusGeometry(.035,.006,6,12),metal,side*.12,-.36,.45);ring.rotation.y=Math.PI/2;}
  // Follow the muzzle surface instead of arching a floating strap above it.
  tube(head,[V(-.108,-.335,.525),V(-.078,-.292,.525),V(0,-.268,.525),V(.078,-.292,.525),V(.108,-.335,.525)],.008,leather);
  const legs=[];for(let i=0;i<4;i++){const group=new THREE.Group();root.add(group);const lower=add(group,cylinder,dark),pastern=add(group,cylinder,dark),knee=ell(group,coat,0,0,0,.063,.078,.068),fetlock=ell(group,dark,0,0,0,.055,.063,.06),hoof=add(group,new THREE.CylinderGeometry(.067,.083,.14,16),dark);legs.push({group,lower,pastern,knee,fetlock,hoof,points:[],expected:i<2?[.31,.46,.41]:[.42,.53,.47]});}
  const seat=new THREE.Object3D();seat.position.set(0,1.715,-.06);body.add(seat);
  const reins=[];for(let i=0;i<2;i++){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(15*3),3));const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x3a3027}));line.frustumCulled=false;root.add(line);reins.push(line);}
  return {root,body,barrel,skin,head,neck,tail,ears,legs,seat,reins,maneRoots,pad,saddle,hoofDown:[true,true,true,true],h};
 }
 function joint(a,b,l1,l2,pole){const axis=b.clone().sub(a),distance=Math.min(axis.length(),l1+l2-.001);axis.normalize();const mid=(distance*distance+l1*l1-l2*l2)/(2*Math.max(.01,distance)),height=Math.sqrt(Math.max(0,l1*l1-mid*mid)),bend=pole.clone().addScaledVector(axis,-pole.dot(axis)).normalize();return a.clone().addScaledVector(axis,mid).addScaledVector(bend,height);}
 function segment(m,a,b,r1,r2){const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(Y,d.clone().normalize());m.scale.set(r1,d.length(),r2);}
 let beats=0;
 function update(session,dt){for(const h of session.horses){if(!models.has(h.id))models.set(h.id,make(h));const m=models.get(h.id);m.h=h;const speed=Math.abs(h.speed),moving=speed>.08,gallop=speed>4.7,phase=h.phase,jumping=!!h.jump,tuck=jumping?smooth(0,.22,h.jump.age)*(1-smooth(0,.40,.40-(h.y-FoilHorses.ground(world,h.x,h.z)))):0,bob=moving?(gallop?Math.sin(phase)*.075:Math.cos(phase*(speed>2.3?2:1))*.025):Math.sin(session.time*1.5)*.003;
   m.root.position.set(h.x,h.y,h.z);m.root.rotation.y=h.heading;m.body.position.y=bob-(h.jumpCooldown||0)*.23;m.body.rotation.set(-h.pitch+(jumping?-Math.max(-1,Math.min(1,h.jump.vy/6.5))*.14:0)+(gallop?Math.sin(phase+.6)*.035:0),0,-h.roll*.45);m.neck.rotation.x=(moving?Math.sin(phase)*.025:Math.sin(session.time*.55)*.012);m.head.rotation.x=.28+(moving?Math.sin(phase+.4)*.025:Math.sin(session.time*.65)*.03);m.tail.rotation.set(Math.sin(phase)*.06,Math.sin(session.time*1.1)*.18+Math.sin(phase)*speed*.008,Math.sin(session.time*.8)*.05);m.ears.forEach((e,i)=>e.rotation.y=Math.sin(session.time*.7+i*2)*.12);
   m.root.updateMatrixWorld(true);
   const prepare=i=>{const side=i%2?-1:1,front=i<2,leg=m.legs[i],f=jumping?{z:(front?-.08:.08)*tuck,lift:(front?.28:.22)*tuck,stance:false,phase:.5}:FoilHorses.foot(phase,i,h.speed),hip=m.root.worldToLocal(m.body.localToWorld(m.skin.rest[i][0].clone())),theta=(front?-.45:.65)+f.z*(front?1.4:1.0)+f.lift*(front?.9:.6),proximal=hip.clone().add(V(0,-Math.cos(theta)*leg.expected[0],Math.sin(theta)*leg.expected[0]).applyQuaternion(m.body.quaternion)),hoof=V(side*.26,0,(front?.68:-.79)+f.z),at=m.root.localToWorld(hoof.clone()),floor=jumping?Math.max(0,FoilHorses.ground(world,at.x,at.z)-h.y):FoilHorses.ground(world,at.x,at.z)-h.y;hoof.y=floor+.07+f.lift;return {side,front,leg,f,hip,proximal,hoof,floor};};
   // Shoulder and hip suspension settle against the terrain before each chain
   // is solved. Stance hooves stay planted; the bones keep their lengths.
   let settle=0;for(let i=0;i<4;i++){const p=prepare(i);const reach=p.leg.expected[1]+p.leg.expected[2]-.015,horizontal=Math.hypot(p.hoof.x-p.proximal.x,p.hoof.z-.035-p.proximal.z),vertical=Math.sqrt(Math.max(.25,reach*reach-horizontal*horizontal));settle=Math.min(settle,p.hoof.y+.13+vertical-p.proximal.y);}m.body.position.y+=settle;m.root.updateMatrixWorld(true);
   for(let i=0;i<4;i++){const {front,leg,f,hip,proximal,hoof,floor}=prepare(i),[,l1,l2]=leg.expected,dy=proximal.y-hoof.y-.13,maxStride=Math.sqrt(Math.max(.0001,(l1+l2-.001)**2-dy*dy-(proximal.x-hoof.x)**2));hoof.z=Math.max(proximal.z-maxStride+.035,Math.min(proximal.z+maxStride+.035,hoof.z));
    const ankle=hoof.clone().add(V(0,.13,-.035)),knee=joint(proximal,ankle,l1,l2,V(0,0,front?1:-1));
    segment(leg.lower,knee,ankle,.038,.043);segment(leg.pastern,ankle,hoof,.042,.044);leg.knee.position.copy(knee);leg.fetlock.position.copy(ankle);leg.hoof.position.copy(hoof);leg.hoof.rotation.x=f.stance?-.05:-.30*Math.sin(f.phase*Math.PI*2);leg.hoof.scale.set(1,1,1.25);leg.points=[hip,proximal,knee,ankle,hoof];leg.contact=f.stance;leg.floor=floor;
    for(let j=0;j<3;j++){const bone=m.skin.bones[1+i*3+j];bone.position.copy(leg.points[j]);bone.quaternion.setFromUnitVectors(Y,leg.points[j+1].clone().sub(leg.points[j]).normalize());}
    if(moving&&f.stance&&!m.hoofDown[i]&&session.horse===h)beats++;m.hoofDown[i]=f.stance;
   }m.skin.bones[0].position.copy(m.body.position);m.skin.bones[0].quaternion.copy(m.body.quaternion);
  }
 }
 function reins(session,hands=[]){for(const m of models.values()){const mounted=session.horse===m.h;for(let i=0;i<2;i++){const side=i?-1:1,start=m.root.worldToLocal(m.head.localToWorld(V(side*.12,-.36,.45))),end=mounted&&hands[i]?m.root.worldToLocal(V(...hands[i])):V(side*.16,1.65,.16),p=m.reins[i].geometry.attributes.position;for(let j=0;j<15;j++){const t=j/14,v=start.clone().lerp(end,t);v.y-=Math.sin(t*Math.PI)*(mounted?.13:.27);p.setXYZ(j,v.x,v.y,v.z);}p.needsUpdate=true;}}}
 function skinBounds(m){m.root.updateMatrixWorld(true);m.skin.mesh.skeleton.update();const box=new THREE.Box3(),p=V(),n=m.barrel.geometry.attributes.position.count;for(let i=0;i<n;i+=Math.max(1,Math.floor(n/350)))box.expandByPoint(m.skin.mesh.getVertexPosition(i,p));return {min:box.min.toArray(),max:box.max.toArray()};}
 function fit(h,riding){const m=models.get(h.id);m.root.updateMatrixWorld(true);const triangle=new THREE.Triangle(),point=V(),nearest=V();let clearance=Infinity,worst=null;
  for(const chain of riding.thighs)for(const [t,radius] of [[.12,.094],[.35,.091],[.6,.077],[.9,.059]]){point.fromArray(chain[0]).lerp(V(...chain[1]),t);m.body.worldToLocal(point);for(const o of [m.pad.mesh,m.saddle.mesh]){const p=o.geometry.attributes.position,ix=o.geometry.index;for(let i=0;i<ix.count;i+=3){triangle.a.fromBufferAttribute(p,ix.getX(i));triangle.b.fromBufferAttribute(p,ix.getX(i+1));triangle.c.fromBufferAttribute(p,ix.getX(i+2));triangle.closestPointToPoint(point,nearest);const gap=point.distanceTo(nearest)-radius;if(gap<clearance){clearance=gap;worst={t,point:point.toArray(),nearest:nearest.toArray(),radius};}}}}
  return {thighClearance:clearance,worst,maneAttachmentError:Math.max(...m.maneRoots.map(p=>m.body.localToWorld(p.clone()).distanceTo(m.skin.bones[0].localToWorld(p.clone())))),maneRootField:Math.max(...m.maneRoots.map(p=>m.skin.field(p.x,p.y,p.z)))};
 }
 return {update,reins,fit,seat:h=>models.get(h.id)?.seat,beats(){const n=beats;beats=0;return n;},diagnostics(){return [...models.values()].map(m=>({id:m.h.id,gait:m.h.gait,seat:m.seat.getWorldPosition(V()).toArray(),skin:skinBounds(m),feet:m.legs.map(l=>({local:l.hoof.position.toArray(),ground:l.floor,stance:l.contact,lengths:l.expected.map((_,i)=>l.points[i].distanceTo(l.points[i+1])),expected:l.expected,joints:l.points.map(p=>p.toArray())}))}));}};
}
root.FoilHorseView={create};
})(globalThis);
