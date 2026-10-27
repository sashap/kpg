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
  const pos=[],ids=[],rings=24;for(let j=0;j<rows.length;j++){const [y,z,w,d]=rows[j];for(let i=0;i<=rings;i++){const a=i/rings*Math.PI*2;pos.push(Math.cos(a)*w,y+Math.sin(a)*d,z);if(j<rows.length-1&&i<rings){const k=j*(rings+1)+i;ids.push(k,k+1,k+rings+1,k+1,k+rings+2,k+rings+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ids);g.computeVertexNormals();return add(p,g,m);}
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
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return add(parent,g,mat);
 }
 function make(h){const root=new THREE.Group(),body=new THREE.Group();root.add(body);scene.add(root);const coat=material(h.coat==='buckskin'?0xb49a67:0x77503b),shade=material(h.coat==='buckskin'?0x8d764c:0x5c3d2f),muzzle=material(0x6a6254);
  const barrel=anatomy(body,[
   [0,1.26,-.10,.365,.37,.79],[0,1.37,-.64,.34,.32,.40],
   [0,1.34,.48,.28,.35,.36],[0,1.15,.61,.23,.28,.27],
   [0,1.53,.70,.20,.39,.24,.48],[0,1.86,1.02,.14,.34,.195,.55],
   [0,2.09,1.20,.10,.16,.12,.30]
  ],coat,[[-.49,.75,-1.10],[.49,2.30,1.40]]);
  const neck=new THREE.Group();body.add(neck);
  const head=new THREE.Group();head.position.set(0,2.10,1.20);neck.add(head);head.rotation.x=.28;
  loft(head,[[.04,-.14,.012,.02],[.03,-.08,.105,.13],[-.02,.02,.13,.18],[-.10,.14,.11,.17],[-.19,.28,.088,.13],[-.29,.40,.092,.095],[-.36,.52,.107,.075],[-.36,.58,.07,.055],[-.36,.61,.004,.01]],coat);
  ell(head,muzzle,0,-.355,.51,.109,.083,.109);
  for(const side of [-1,1]){ell(head,shade,side*.105,-.01,.10,.046,.045,.053);ell(head,eye,side*.132,.015,.11,.019,.027,.030);ell(head,white,side*.147,.026,.121,.004,.006,.006);const nostril=ell(head,dark,side*.097,-.337,.55,.018,.032,.027);nostril.rotation.z=side*.3;tube(head,[V(side*.095,-.404,.46),V(side*.08,-.42,.54),V(side*.025,-.418,.60)],.004,dark);}
  // Narrow blaze, tapered upright ears, dark mane lying along the crest.
  ell(head,white,0,-.075,.265,.024,.13,.012);const ears=[];for(const side of [-1,1]){const ear=new THREE.Group();ear.position.set(side*.085,.11,-.04);ear.rotation.z=-side*.15;head.add(ear);const o=ell(ear,coat,0,.085,0,.039,.112,.034);o.rotation.x=-.10;ell(ear,shade,0,.08,.026,.023,.077,.009);ears.push(ear);}
  const crest=new THREE.CatmullRomCurve3([V(0,1.68,.35),V(0,1.87,.61),V(0,2.10,.86),V(0,2.235,1.10),V(0,2.23,1.24)]);
  for(let i=0;i<34;i++){const p=crest.getPoint(i/33);tube(neck,[p,p.clone().add(V(.045,-.035,-.025)),p.clone().add(V(.11,-.16,-.035))],.017,dark);}
  const tail=new THREE.Group();tail.position.set(0,1.49,-.94);body.add(tail);tube(tail,[V(),V(0,-.22,-.19),V(0,-.57,-.24),V(0,-.89,-.28)],.055,dark);for(let i=0;i<13;i++){const a=i*Math.PI*2/13;tube(tail,[V(Math.cos(a)*.035,0,0),V(Math.cos(a)*.07,-.22,-.20),V(Math.cos(a)*.10,-.55,-.24),V(Math.cos(a)*.085,-.91,-.29)],.022,dark);}
  // Saddle rests over a fitted pad; girth and stirrups are visible from both sides.
  ell(body,blanket,0,1.57,-.04,.405,.075,.40);ell(body,leather,0,1.65,-.06,.28,.075,.31);ell(body,leather,0,1.70,-.31,.27,.045,.055);ell(body,leather,0,1.69,.22,.23,.035,.05);
  for(const side of [-1,1]){ell(body,leather,side*.33,1.43,-.03,.055,.24,.25);tube(body,[V(side*.30,1.64,.06),V(side*.39,1.23,.06),V(side*.42,.91,.10)],.016,leather);const stirrup=add(body,new THREE.TorusGeometry(.09,.012,7,14),metal,side*.43,.91,.10,1,.75,1);stirrup.rotation.y=Math.PI/2;}
  tube(body,[V(-.34,1.50,.28),V(-.36,1.08,.28),V(0,.91,.28),V(.36,1.08,.28),V(.34,1.50,.28)],.026,leather);
  for(const side of [-1,1]){tube(head,[V(side*.115,.11,-.07),V(side*.145,-.06,.18),V(side*.11,-.35,.46)],.012,leather);const ring=add(head,new THREE.TorusGeometry(.035,.006,6,12),metal,side*.12,-.36,.45);ring.rotation.y=Math.PI/2;}
  tube(head,[V(-.105,-.28,.50),V(0,-.23,.53),V(.105,-.28,.50)],.014,leather);
  const legs=[];for(let i=0;i<4;i++){const group=new THREE.Group();root.add(group);const upper=add(group,new THREE.LatheGeometry([new THREE.Vector2(.55,-.5),new THREE.Vector2(.62,-.37),new THREE.Vector2(.94,-.05),new THREE.Vector2(1.12,.26),new THREE.Vector2(.82,.5)],16),coat),lower=add(group,cylinder,shade),pastern=add(group,cylinder,dark),knee=ell(group,coat,0,0,0,.078,.085,.078),fetlock=ell(group,dark,0,0,0,.055,.063,.06),hoof=add(group,new THREE.CylinderGeometry(.067,.083,.14,14),dark);legs.push({group,upper,lower,pastern,knee,fetlock,hoof,points:[]});}
  const seat=new THREE.Object3D();seat.position.set(0,1.68,-.05);body.add(seat);
  const reins=[];for(let i=0;i<2;i++){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(15*3),3));const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x3a3027}));line.frustumCulled=false;root.add(line);reins.push(line);}
  return {root,body,barrel,head,neck,tail,ears,legs,seat,reins,hoofDown:[true,true,true,true],h};
 }
 function joint(a,b,l1,l2,pole){const axis=b.clone().sub(a),distance=Math.min(axis.length(),l1+l2-.001);axis.normalize();const mid=(distance*distance+l1*l1-l2*l2)/(2*Math.max(.01,distance)),height=Math.sqrt(Math.max(0,l1*l1-mid*mid)),bend=pole.clone().addScaledVector(axis,-pole.dot(axis)).normalize();return a.clone().addScaledVector(axis,mid).addScaledVector(bend,height);}
 function segment(m,a,b,r1,r2){const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(Y,d.clone().normalize());m.scale.set(r1,d.length(),r2);}
 let beats=0;
 function update(session,dt){for(const h of session.horses){if(!models.has(h.id))models.set(h.id,make(h));const m=models.get(h.id);m.h=h;const speed=Math.abs(h.speed),moving=speed>.08,gallop=speed>4.7,phase=h.phase,bob=moving?(gallop?Math.sin(phase)*.075:Math.cos(phase*(speed>2.3?2:1))*.025):Math.sin(session.time*1.5)*.003;
   m.root.position.set(h.x,h.y,h.z);m.root.rotation.y=h.heading;m.body.position.y=bob;m.body.rotation.set(-h.pitch+(gallop?Math.sin(phase+.6)*.035:0),0,-h.roll*.45);m.barrel.scale.x=1+Math.sin(session.time*1.4)*.005;m.neck.rotation.x=(moving?Math.sin(phase)*.025:Math.sin(session.time*.55)*.012);m.head.rotation.x=.28+(moving?Math.sin(phase+.4)*.025:Math.sin(session.time*.65)*.03);m.tail.rotation.set(Math.sin(phase)*.06,Math.sin(session.time*1.1)*.18+Math.sin(phase)*speed*.008,Math.sin(session.time*.8)*.05);m.ears.forEach((e,i)=>e.rotation.y=Math.sin(session.time*.7+i*2)*.12);
   m.root.updateMatrixWorld(true);let settle=0;
   for(let i=0;i<4;i++){const side=i%2?-1:1,front=i<2,f=FoilHorses.foot(phase,i,h.speed),hip=m.root.worldToLocal(m.body.localToWorld(V(side*(front?.24:.26),front?1.34:1.31,front?.61:-.69))),at=m.root.localToWorld(V(side*.26,0,(front?.65:-.75)+f.z)),floor=world.walkHeight(at.x,at.z)-h.y;settle=Math.min(settle,floor+.20+f.lift+1.13-hip.y);}
   m.body.position.y+=settle;m.root.updateMatrixWorld(true);for(let i=0;i<4;i++){const side=i%2?-1:1,front=i<2,leg=m.legs[i],f=FoilHorses.foot(phase,i,h.speed),hip=m.root.worldToLocal(m.body.localToWorld(V(side*(front?.24:.26),front?1.34:1.31,front?.61:-.69))),local=V(side*.26,0,(front?.65:-.75)+f.z),at=m.root.localToWorld(local.clone()),floor=world.walkHeight(at.x,at.z)-h.y,hoof=local.clone();hoof.y=floor+.07+f.lift;
    // Keep stance hooves on the ground while limiting stride to the
    // reach of the articulated limb; no rubbery lower-leg stretching.
    const dy=hip.y-hoof.y-.13,maxStride=Math.sqrt(Math.max(.002,1.159*1.159-dy*dy-(hip.x-hoof.x)**2));
    hoof.z=Math.max(hip.z-maxStride+.035,Math.min(hip.z+maxStride+.035,hoof.z));
    const ankle=hoof.clone().add(V(0,.13,-.035)),knee=joint(hip,ankle,.60,.56,V(0,0,front?1:-1));segment(leg.upper,hip,knee,front?.078:.12,front?.073:.095);segment(leg.lower,knee,ankle,.043,.046);segment(leg.pastern,ankle,hoof,.045,.046);leg.knee.position.copy(knee);leg.fetlock.position.copy(ankle);leg.hoof.position.copy(hoof);leg.hoof.rotation.x=f.stance?-.05:-.25*Math.sin(f.phase*Math.PI*2);leg.hoof.scale.set(1,1,1.25);leg.points=[hip,knee,ankle,hoof];leg.contact=f.stance;leg.floor=floor;
    if(moving&&f.stance&&!m.hoofDown[i]&&session.horse===h)beats++;m.hoofDown[i]=f.stance;
   }
  }
 }
 function reins(session,hands=[]){for(const m of models.values()){const mounted=session.horse===m.h;for(let i=0;i<2;i++){const side=i?-1:1,start=m.root.worldToLocal(m.head.localToWorld(V(side*.12,-.36,.45))),end=mounted&&hands[i]?m.root.worldToLocal(V(...hands[i])):V(side*.16,1.65,.16),p=m.reins[i].geometry.attributes.position;for(let j=0;j<15;j++){const t=j/14,v=start.clone().lerp(end,t);v.y-=Math.sin(t*Math.PI)*(mounted?.13:.27);p.setXYZ(j,v.x,v.y,v.z);}p.needsUpdate=true;}}}
 return {update,reins,seat:h=>models.get(h.id)?.seat,beats(){const n=beats;beats=0;return n;},diagnostics(){return [...models.values()].map(m=>({id:m.h.id,gait:m.h.gait,seat:m.seat.getWorldPosition(V()).toArray(),feet:m.legs.map(l=>({local:l.hoof.position.toArray(),ground:l.floor,stance:l.contact,lengths:[l.points[0].distanceTo(l.points[1]),l.points[1].distanceTo(l.points[2])]}))}));}};
}
root.FoilHorseView={create};
})(globalThis);
