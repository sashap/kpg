/* A procedural human rig with anatomical profiles, fixed-length IK, and attached gear. */
(function(root){
'use strict';
function create({THREE,scene,boardRig,riderRoot,wing}){
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const suit=new THREE.MeshStandardMaterial({color:0x253e47,roughness:.83}),panels=new THREE.MeshStandardMaterial({color:0x3b5358,roughness:.9}),skin=new THREE.MeshStandardMaterial({color:0xbb8868,roughness:.65}),vestMat=new THREE.MeshStandardMaterial({color:0xb6683c,roughness:.82}),trimMat=new THREE.MeshStandardMaterial({color:0x152c32,roughness:.62}),helmetMat=new THREE.MeshStandardMaterial({color:0xe0dfd0,roughness:.52});
 // Fine neoprene grain catches grazing light without painted-on plastic highlights.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#888';ctx.fillRect(0,0,128,128);let seed=62;for(let i=0;i<6000;i++){seed=(seed*1664525+1013904223)>>>0;const v=90+(seed%70);ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect((seed>>>8)%128,(seed>>>17)%128,1,1);}const grain=new THREE.CanvasTexture(canvas);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(5,5);for(const m of [suit,panels,vestMat]){m.bumpMap=grain;m.bumpScale=.0018;}
 const sphere=new THREE.SphereGeometry(1,20,14),cube=new THREE.BoxGeometry(1,1,1),Y=V(0,1,0);
 function mesh(parent,g,m,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 const ell=(p,m,x,y,z,sx,sy,sz)=>mesh(p,sphere,m,x,y,z,sx,sy,sz);
 function line(p,points,r,m){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>V(...a))),Math.max(12,points.length*6),r,6,false),m);}
 // Smooth elliptical cross-sections produce a chest, waist, pelvis and tapered muscles.
 function profile(rows,segments=24){const pos=[],uv=[],indices=[];rows.forEach(([y,w,d,cz=0],j)=>{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;pos.push(Math.cos(a)*w,y,Math.sin(a)*d+cz);uv.push(i/segments,j/(rows.length-1));if(j<rows.length-1&&i<segments){const n=j*(segments+1)+i;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
 const person=new THREE.Group();boardRig.add(person);const hips=new THREE.Group(),upper=new THREE.Group();person.add(hips,upper);
 mesh(hips,profile([[-.13,.075,.095],[-.10,.155,.12],[0,.178,.135],[.09,.165,.125],[.13,.15,.115]]),suit);
 mesh(upper,profile([[-.02,.15,.11],[.08,.158,.115],[.18,.167,.123],[.30,.198,.135],[.40,.225,.127],[.455,.22,.115],[.49,.17,.10],[.52,.085,.073]]),suit);
 mesh(upper,profile([[.10,.168,.126],[.16,.179,.14],[.29,.211,.15],[.40,.233,.144],[.445,.218,.12]]),vestMat);
 // Sewn panels, webbing, front zipper and a small rear reflective patch.
 for(const side of [-1,1]){line(upper,[[side*.159,.10,.04],[side*.194,.25,.07],[side*.215,.40,.05]],.004,trimMat);line(upper,[[side*.14,.16,-.10],[side*.16,.34,-.12],[side*.13,.44,-.09]],.005,panels);mesh(upper,cube,trimMat,side*.21,.23,.01,.018,.075,.085);}
 line(upper,[[0,.11,.13],[0,.28,.153],[0,.435,.12]],.006,trimMat);mesh(upper,cube,helmetMat,0,.33,-.153,.082,.022,.008);mesh(upper,cube,trimMat,0,.11,.14,.047,.032,.012);
 // Neck, jaw, facial planes and ears share a single articulated head transform.
 const neck=mesh(upper,profile([[.46,.07,.065],[.53,.068,.064],[.58,.064,.065]]),skin),head=new THREE.Group();head.position.set(0,.52,0);upper.add(head);
 mesh(head,profile([[.015,.039,.048,.006],[.04,.066,.072,.009],[.09,.090,.089],[.16,.102,.096,-.002],[.23,.097,.092,-.006],[.285,.069,.070,-.009],[.31,.005,.005,-.01]],28),skin);
 for(const side of [-1,1]){ell(head,skin,side*.102,.15,-.008,.017,.035,.018);ell(head,new THREE.MeshStandardMaterial({color:0x6d4f40,roughness:1}),side*.106,.15,.003,.006,.016,.005);ell(head,trimMat,side*.043,.188,.087,.019,.008,.006);line(head,[[side*.025,.209,.089],[side*.048,.215,.084],[side*.065,.207,.075]],.004,trimMat);}
 const eyeWhite=new THREE.MeshStandardMaterial({color:0xc9c7b7,roughness:.6}),iris=new THREE.MeshStandardMaterial({color:0x3d4a40,roughness:.45}),lip=new THREE.MeshStandardMaterial({color:0x946654,roughness:.85});
 for(const side of [-1,1]){ell(head,eyeWhite,side*.043,.188,.091,.013,.0055,.004);ell(head,iris,side*.043,.188,.094,.0045,.0048,.002);ell(head,trimMat,side*.043,.188,.096,.0022,.003,.001);line(head,[[side*.029,.193,.092],[side*.043,.195,.094],[side*.057,.192,.088]],.0018,skin);ell(head,skin,side*.057,.135,.064,.025,.023,.009);ell(head,skin,side*.018,.142,.107,.010,.009,.008);ell(head,lip,side*.012,.136,.113,.004,.0025,.003);}
 ell(head,skin,0,.169,.095,.012,.031,.016);ell(head,skin,0,.146,.113,.015,.012,.014);ell(head,lip,0,.094,.086,.022,.003,.005);
line(head,[[-.026,.091,.081],[0,.088,.09],[.026,.091,.081]],.0028,new THREE.MeshStandardMaterial({color:0x785547,roughness:.9}));
 const helmet=mesh(head,new THREE.SphereGeometry(1,28,18,0,Math.PI*2,0,Math.PI*.55),helmetMat,0,.215,-.012,.116,.118,.112);line(head,[[-.106,.204,.045],[-.084,.064,.013],[0,.04,.056],[.084,.064,.013],[.106,.204,.045]],.006,trimMat);
 for(const x of [-.052,0,.052])for(const z of [-.052,.018])ell(head,trimMat,x,.312-Math.abs(x)*.17,z-.012,.012,.003,.023);
 // Small fittings remain part of the existing proportions and batch with clothing.
 line(head,[[-.109,.218,.018],[-.087,.218,.075],[0,.218,.102],[.087,.218,.075],[.109,.218,.018]],.003,panels);
 mesh(head,cube,panels,.071,.071,.030,.018,.020,.009);
 for(const side of [-1,1]){line(upper,[[side*.065,.17,.144],[side*.145,.17,.127],[side*.158,.25,.13],[side*.069,.25,.15]],.0025,panels);line(upper,[[side*.142,.43,.105],[side*.158,.48,.071],[side*.146,.47,-.082]],.010,trimMat);mesh(upper,cube,helmetMat,side*.14,.37,.127,.025,.014,.004);}
 for(let i=0;i<12;i++)mesh(upper,cube,panels,0,.15+i*.020,.147-Math.abs(.28-(.15+i*.020))*.17,.009,.004,.003);
 mesh(upper,cube,trimMat,.009,.35,.15,.014,.024,.006);
 function segment(length,radii,material){const rows=radii.map(([t,w,d])=>[t*length,w,d||w]);return mesh(person,profile(rows,18),material);}
 const hipJoints=[-1,1].map(()=>ell(person,suit,0,0,0,.088,.105,.103));
 const footGeometry=profile([[-.185,.025,.015,-.014],[-.155,.055,.019,-.012],[-.095,.065,.026,-.005],[-.025,.060,.045,.014],[.035,.058,.070,.035],[.085,.052,.050,.015],[.105,.008,.024,.005]],20);footGeometry.rotateX(-Math.PI/2);
 const soleGeometry=profile([[-.187,.025,.009,-.040],[-.155,.057,.010,-.040],[-.095,.067,.010,-.040],[-.025,.061,.010,-.040],[.035,.056,.010,-.040],[.085,.053,.010,-.040],[.107,.008,.009,-.040]],20);soleGeometry.rotateX(-Math.PI/2);
 const limbs=[];for(let i=0;i<2;i++)limbs.push({thigh:segment(.43,[[0,.076],[.18,.097,.082],[.50,.083],[.87,.061],[1,.056]],suit),calf:segment(.43,[[0,.056],[.23,.069,.058],[.49,.062],[.78,.042],[1,.034]],suit),knee:ell(person,panels,0,0,0,.061,.058,.059),upper:segment(.31,[[0,.073],[.24,.066],[.62,.052],[1,.04]],suit),fore:segment(.29,[[0,.041],[.18,.047],[.48,.039],[.8,.029],[1,.025]],skin),elbow:ell(person,skin,0,0,0,.041,.042,.041),shoulder:ell(person,suit,0,0,0,.077,.081,.074)});
 const feet=[],hands=[],gripHands=[],openHands=[];for(let i=0;i<2;i++){const foot=new THREE.Group();person.add(foot);mesh(foot,soleGeometry,trimMat);mesh(foot,footGeometry,suit);line(foot,[[-.051,.023,.09],[0,.027,.13],[.051,.023,.09]],.0025,panels);mesh(foot,profile([[.025,.034,.031,-.035],[.090,.034,.031,-.035],[.11,.032,.029,-.035]],18),suit);for(const side of [-1,1])line(foot,[[side*.046,.025,-.07],[side*.057,.031,.015],[side*.042,.038,.12]],.0017,panels);mesh(foot,cube,panels,0,.075,-.064,.025,.028,.006);feet.push(foot);
  const hand=new THREE.Group();person.add(hand);ell(hand,skin,0,0,0,.036,.018,.047);const grip=new THREE.Group(),open=new THREE.Group();hand.add(grip,open);open.visible=false;gripHands.push(grip);openHands.push(open);for(let f=0;f<4;f++){const x=(f-1.5)*.018;line(grip,[[x,0,.025],[x,.018,.051],[x,.040,.044],[x,.040,.020]],.008,skin);}line(grip,[[.035,0,-.02],[.054,.008,.014],[.041,.028,.027]],.010,skin);for(let f=0;f<4;f++){const x=(f-1.5)*.016,spread=(f-1.5)*.004,length=[.093,.112,.105,.083][f];line(open,[[x,0,.023],[x+spread,-.003,.065],[x+spread,-.009,length]],.0068,skin);}line(open,[[.030,0,-.016],[.054,-.003,.006],[.063,-.006,.032]],.009,skin);for(let f=0;f<4;f++){const x=(f-1.5)*.018;ell(grip,skin,x,.037,.046,.0085,.007,.009);const length=[.093,.112,.105,.083][f];ell(open,skin,x+(f-1.5)*.004,-.006,length-.008,.005,.002,.006);}const cuff=mesh(hand,new THREE.CylinderGeometry(.031,.032,.034,16),trimMat,0,0,-.054);cuff.rotation.x=Math.PI/2;hands.push(hand);}
 const ankleCuff=mesh(feet[1],new THREE.CylinderGeometry(.043,.044,.048,16),trimMat,0,.055,-.035),tailPlug=mesh(boardRig,new THREE.TorusGeometry(.018,.005,6,12),trimMat,0,.195,-.90);tailPlug.rotation.x=Math.PI/2;
 const wingPlug=mesh(wing,new THREE.TorusGeometry(.017,.004,6,12),trimMat,0,.12,.75);wingPlug.rotation.x=Math.PI/2;
 // Buffers are reused: cords bend and coil between actual attachment transforms.
 function cord(radius,coilRadius,turns){const segments=96,sides=6,pos=new Float32Array((segments+1)*(sides+1)*3),norm=new Float32Array(pos.length),indices=[];for(let j=0;j<segments;j++)for(let k=0;k<sides;k++){const a=j*(sides+1)+k;indices.push(a,a+sides+1,a+1,a+1,a+sides+1,a+sides+2);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('normal',new THREE.BufferAttribute(norm,3).setUsage(THREE.DynamicDrawUsage));geo.setIndex(indices);const object=mesh(riderRoot,geo,trimMat);object.frustumCulled=false;object.castShadow=false;const centers=Array.from({length:segments+1},()=>V()),tangent=V(),u=V(),v=V(),n=V(),point=V();
  return {object,start:V(),end:V(),update(start,end,time,droop){this.start.copy(start);this.end.copy(end);const along=end.clone().sub(start).normalize(),side=V().crossVectors(along,Y);if(side.lengthSq()<.01)side.set(1,0,0);side.normalize();const across=V().crossVectors(along,side).normalize();for(let j=0;j<=segments;j++){const t=j/segments,envelope=Math.sin(t*Math.PI);centers[j].copy(start).lerp(end,t);centers[j].y-=droop*envelope;centers[j].addScaledVector(side,coilRadius*Math.sin(t*turns*Math.PI*2)*envelope);centers[j].addScaledVector(across,coilRadius*Math.cos(t*turns*Math.PI*2)*envelope);centers[j].x+=Math.sin(time*1.5+t*4)*.006*envelope;}
   for(let j=0;j<=segments;j++){tangent.copy(centers[Math.min(j+1,segments)]).sub(centers[Math.max(j-1,0)]).normalize();u.crossVectors(tangent,Y);if(u.lengthSq()<.01)u.set(1,0,0);u.normalize();v.crossVectors(tangent,u).normalize();for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2,index=(j*(sides+1)+k)*3;n.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a));point.copy(centers[j]).addScaledVector(n,radius);point.toArray(pos,index);n.toArray(norm,index);}}geo.attributes.position.needsUpdate=true;geo.attributes.normal.needsUpdate=true;}};
 }
 const boardLeash=cord(.005,.024,12),wingLeash=cord(.004,0,0),pose={arms:[],legs:[],gripError:0};
 function placeSegment(o,start,end){o.position.copy(start);o.quaternion.setFromUnitVectors(Y,end.clone().sub(start).normalize());}
 function joint(start,end,l1,l2,pole,stable=null){const delta=end.clone().sub(start),distance=clamp(delta.length(),Math.abs(l1-l2)+.001,l1+l2-.002),axis=delta.normalize(),along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along)),bend=pole.clone().addScaledVector(axis,-pole.dot(axis));if(stable&&stable.lengthSq()>.1){const previous=stable.clone().addScaledVector(axis,-stable.dot(axis)).normalize();if(bend.lengthSq()<.025)bend.copy(previous);else{bend.normalize();if(bend.dot(previous)<0)bend.negate();bend.copy(previous.lerp(bend,.15).normalize());}}else bend.normalize();if(stable)stable.copy(bend);return start.clone().addScaledVector(axis,along).addScaledVector(bend,height);}
 const gripLocal=[V(0,-.04,.12),V(0,-.04,-.48)];let activeGrips=gripLocal,flagPose=false;
 const onFootRoot=new THREE.Group();scene.add(onFootRoot);onFootRoot.visible=false;
 function update(s,dt){if(person.parent!==boardRig)boardRig.add(person);onFootRoot.visible=false;swimBlend=0;gripHands.forEach(g=>g.visible=true);openHands.forEach(g=>g.visible=false);boardLeash.object.visible=wingLeash.object.visible=true;const stand=s.standAmount,compress=s.popHeld?Math.min(s.popCharge,.6)*.25:s.air?.age<.7?.08:s.pumpHeld?Math.min(s.pumpCharge,.6)*.18:0,hipY=mix(.62,.98,stand)-compress,shift=-s.balance*.17,lean=s.wingSide*.08-s.steer*.12;
  person.position.set(0,s.fallTime>0?-.32:0,0);person.rotation.set(0,0,s.fallTime>0?1.02:0);hips.position.set(lean,hipY,shift-.05);hips.rotation.y=-(s.stance||1)*.35;upper.position.set(lean,hipY+.015,shift-.05);upper.rotation.set(-s.balance*.10,-s.wingSide*.9,-s.wingSide*.10+s.steer*.06);head.rotation.y=s.wingSide*.34;head.rotation.x=s.balance*.08;
  const footPoints=[V(-.14,.257,(s.stance||1)===1?.35:-.46),V(.14,.257,(s.stance||1)===1?-.46:.35)];
  if(s.footSwitch){const f=s.footSwitch,t=clamp(f.age/.8,0,1),smooth=t=>t*t*(3-2*t);for(let i=0;i<2;i++){const front=(f.from===1)===(i===0);let u,z;if(front){if(t<.4){u=clamp(t/.4,0,1);z=mix(.35,0,smooth(u));}else{u=clamp((t-.6)/.4,0,1);z=mix(0,-.46,smooth(u));}}else{u=clamp((t-.25)/.5,0,1);z=mix(-.46,.35,smooth(u));}footPoints[i].z=z;footPoints[i].y+=Math.sin(u*Math.PI)*.08;footPoints[i].x+=(i===0?-1:1)*Math.sin(u*Math.PI)*.035;}}
  feet.forEach((f,i)=>{f.position.copy(footPoints[i]);f.rotation.set(0,-s.wingSide*(footPoints[i].z>0?1.0:.72),0);});pose.feet=footPoints.map(p=>p.toArray());person.updateMatrixWorld(true);
  pose.legs=[];for(let i=0;i<2;i++){const hip=person.worldToLocal(hips.localToWorld(V((i===0?-.105:.105),-.07,0))),ankle=footPoints[i].clone().add(V(0,.045,-.035)),knee=joint(hip,ankle,.43,.43,V(-s.wingSide*.55,.1,.8));hipJoints[i].position.copy(hip);placeSegment(limbs[i].thigh,hip,knee);placeSegment(limbs[i].calf,knee,ankle);limbs[i].knee.position.copy(knee);pose.legs.push([hip.distanceTo(knee),knee.distanceTo(ankle)]);}
  // Keep both grips in arm reach. Wing movement follows the hands, never stretches arms.
  flagPose=!!s.flagged;activeGrips=flagPose?[V(0,.12,.75),gripLocal[1]]:gripLocal;
  const wingPose=s.wingAngle??s.wingSide*.72;wing.rotation.set(.05+s.trim*.30,-wingPose*.24,wingPose*(.46+s.standAmount*.38+s.trim*.16*s.standAmount));wing.scale.setScalar(1);if(flagPose)wing.rotation.set(.06,-s.wingSide*.7,s.wingSide*.14);
  const shoulders=[0,1].map(i=>riderRoot.worldToLocal(upper.localToWorld(V((i===0?1:-1)*s.wingSide*.218,.425,0))));
  const target=V(-wingPose*.37+lean,hipY+(flagPose?.9:s.air?1.24:1.15)+(1-s.trim)*.07+s.pumpPulse*.06,shift-.04);
  wing.position.lerp(target,dt>0?1-Math.exp(-dt*9):1);const offsets=activeGrips.map(p=>p.clone().applyEuler(wing.rotation));for(let iteration=0;iteration<8;iteration++)for(let i=0;i<(flagPose?1:2);i++){const reach=wing.position.clone().add(offsets[i]).sub(shoulders[i]),distance=reach.length();if(distance>.575)wing.position.addScaledVector(reach,-(distance-.575)/distance);}
  riderRoot.updateMatrixWorld(true);pose.arms=[];pose.gripError=0;for(let i=0;i<2;i++){const shoulder=person.worldToLocal(riderRoot.localToWorld(shoulders[i].clone())),grip=flagPose&&i===1?shoulder.clone().add(V(s.wingSide*.08,-.5,.12)):person.worldToLocal(wing.localToWorld(activeGrips[i].clone())),wrist=grip.clone().add(V(0,-.01,.03)),elbow=joint(shoulder,wrist,.31,.29,V(-s.wingSide*.25,-1,.25));placeSegment(limbs[i].upper,shoulder,elbow);placeSegment(limbs[i].fore,elbow,wrist);limbs[i].shoulder.position.copy(shoulder);limbs[i].elbow.position.copy(elbow);hands[i].position.copy(grip);const wq=wing.getWorldQuaternion(new THREE.Quaternion()),pq=person.getWorldQuaternion(new THREE.Quaternion()).invert();hands[i].quaternion.copy(pq.multiply(wq));hands[i].rotateX(-Math.PI/2);if(flagPose&&i===1){openHands[i].visible=true;gripHands[i].visible=false;orientPalm(hands[i],elbow,false);}pose.arms.push([shoulder.distanceTo(elbow),elbow.distanceTo(wrist)]);}
  riderRoot.updateMatrixWorld(true);const attach=(o,point=V())=>riderRoot.worldToLocal(o.localToWorld(point));boardLeash.update(attach(ankleCuff,V(.035,0,0)),attach(tailPlug),s.time,.035);wingLeash.update(attach(hands[0],V(.025,0,-.05)),attach(wingPlug),s.time,.16);
 }
 let swimBlend=0;
 // Timed freestyle poses: entry, reach, catch, pull, push, exit, recovery.
 // +Y is toward the head; +Z is through the chest (downward when prone).
 // The elbow guide keeps the elbow above the wrist during both the catch
 // and recovery, instead of choosing an IK bend from the previous frame.
 const strokeKeys=[
  [0,   [.03,.51,.02],     [.09,.27,-.055]],
  [.12, [.03,.565,.025],   [.06,.28,0]],
  [.24, [.055,.40,.25],    [.15,.24,.025]],
  [.38, [.07,.05,.43],     [.20,.02,.12]],
  [.53, [.045,-.35,.26],   [.12,-.22,.015]],
  [.62, [.08,-.48,.03],    [.13,-.25,-.05]],
  [.74, [.20,-.25,-.10],   [.18,-.09,-.26]],
  [.86, [.20,.12,-.10],    [.16,.17,-.24]],
  [.95, [.065,.41,-.055],  [.09,.28,-.16]]
 ];
 function strokePoint(t,channel,side){
  const n=strokeKeys.length;let i=n-1;for(let j=0;j<n-1;j++)if(t<strokeKeys[j+1][0]){i=j;break;}
  const key=k=>{const p=strokeKeys[(k+n)%n];return {t:p[0]+Math.floor(k/n),p:V(...p[channel])};},a=key(i-1),b=key(i),c=key(i+1),d=key(i+2),span=c.t-b.t,u=(t-b.t)/span,u2=u*u,u3=u2*u;
  const m0=c.p.clone().sub(a.p).multiplyScalar(span/(c.t-a.t)),m1=d.p.clone().sub(b.p).multiplyScalar(span/(d.t-b.t));
  const point=b.p.multiplyScalar(2*u3-3*u2+1).addScaledVector(m0,u3-2*u2+u).addScaledVector(c.p,-2*u3+3*u2).addScaledVector(m1,u3-u2);point.x*=side;return point;
 }
 const contacts={hands:[V(),V()],feet:[V(),V()],active:false,phase:0},palmBasis=new THREE.Matrix4();
 function orientPalm(hand,elbow,pulling=false,dt=0,twist=0){
  const z=hand.position.clone().sub(elbow).normalize();
  // A stable transverse axis avoids the singular 'look at palm normal' frame
  // that flipped 180 degrees whenever the forearm crossed the chosen normal.
  const x=V(1,0,0).addScaledVector(z,-z.x).normalize(),y=V().crossVectors(z,x).normalize();
  palmBasis.makeBasis(x,y,z);const target=new THREE.Quaternion().setFromRotationMatrix(palmBasis);
  target.multiply(new THREE.Quaternion().setFromAxisAngle(V(0,0,1),twist));
  if(dt>0)hand.quaternion.rotateTowards(target,dt*7);else hand.quaternion.copy(target);
 }
 function updateOnFoot(s,dt=1/60){
  if(person.parent!==onFootRoot){onFootRoot.add(person);swimBlend=0;}onFootRoot.visible=true;boardLeash.object.visible=wingLeash.object.visible=false;
  const swimming=s.mode==='swimming',phase=swimming?s.swimPhase:s.walkCycle,effort=swimming?clamp(s.swimEffort,0,1):Math.min(1,s.speed/1.8),forward=swimming&&s.swimVelocity>=-.03,hop=s.jumpTime>0?Math.sin((1-s.jumpTime/.85)*Math.PI)*.65:0;
  const run=swimming?0:clamp((s.speed-2.2)/3.2,0,1);
  swimBlend=mix(swimBlend,forward?Math.min(1,effort*1.3):0,dt>0?1-Math.exp(-dt*6):1);
  const pitch=swimBlend*(Math.PI/2-.055),roll=swimming?Math.sin(phase-.8)*.34*swimBlend:0;
  // Keep the chest at the waterline while rotating about the long body axis.
  // This prevents the old upright-to-prone transition from lifting the whole torso.
  onFootRoot.position.set(s.x,s.walkY+(swimming?.012-Math.cos(pitch)*1.44+Math.sin(phase*2)*.009*swimBlend:-.203)+hop,s.z);onFootRoot.rotation.set(0,s.heading,0);person.position.set(0,0,0);person.rotation.set(pitch,roll,0);if(swimming&&s.entryTime>0&&s.fallMotion){const t=s.entryTime/.45;onFootRoot.position.y+=t*.42;person.rotation.x+=s.fallMotion.pitch*t;person.rotation.z=s.fallMotion.roll*t;}
  const hipY=swimming?1.12:1.13-run*.10+Math.abs(Math.sin(phase))*(.025+run*.045)*effort;hips.position.set(0,hipY,0);hips.rotation.set(0,swimming?-roll*.18:Math.sin(phase)*.05*effort,0);upper.position.set(0,hipY+.015,0);upper.rotation.set(swimming?0:(.04+run*.10)*effort,swimming?roll*.08:-Math.sin(phase)*.06*effort,0);
  const cycle=((phase/(Math.PI*2))%1+1)%1,breath=swimming&&Math.floor(phase/(Math.PI*2))%2===0?Math.sin(clamp((cycle-.56)/.36,0,1)*Math.PI)*swimBlend:0;
  head.rotation.set(swimming?-.08-.10*swimBlend+(s.lookPitch||0)*.40:-.03+(s.lookPitch||0)*.55,swimming?-roll*.45-breath*.85+(s.lookYaw||0)*.55:(s.lookYaw||0)*.70,0);onFootRoot.updateMatrixWorld(true);pose.legs=[];pose.arms=[];
  for(let i=0;i<2;i++){
   const side=i===0?-1:1,p=phase+i*Math.PI,swing=Math.sin(p)*effort,hip=person.worldToLocal(hips.localToWorld(V(side*.105,-.07,0)));let ankle,knee;
   if(swimming){
    // A small hip-led flutter, three alternating kicks per complete arm cycle.
    // Treading uses a slower bent-leg action rather than freezing the limbs.
    const kick=phase*3+i*Math.PI,thighAngle=mix(.26+Math.sin(s.time*2.5+i*Math.PI)*.18,Math.sin(kick)*.13,swimBlend),kneeFlex=mix(.60+.12*Math.cos(s.time*2.5+i*Math.PI),.07+.16*Math.max(0,Math.sin(kick-.7)),swimBlend);
    knee=hip.clone().add(V(0,-Math.cos(thighAngle)*.43,Math.sin(thighAngle)*.43));ankle=knee.clone().add(V(0,-Math.cos(thighAngle+kneeFlex)*.43,Math.sin(thighAngle+kneeFlex)*.43));feet[i].rotation.set(mix(.35,1.32,swimBlend)+Math.sin(kick-.3)*.07*swimBlend,side*.05,0);feet[i].position.copy(ankle).sub(V(0,.045,-.035).applyEuler(feet[i].rotation));
   }else{const foot=V(side*.13,.257+Math.max(0,Math.cos(p))*(.11+run*.18)*effort,swing*(.26+run*.14));feet[i].position.copy(foot);feet[i].rotation.set(0,side*.10,0);ankle=foot.clone().add(V(0,.045,-.035));knee=joint(hip,ankle,.43,.43,V(0,.1,1));}
   hipJoints[i].position.copy(hip);placeSegment(limbs[i].thigh,hip,knee);placeSegment(limbs[i].calf,knee,ankle);limbs[i].knee.position.copy(knee);pose.legs.push([hip.distanceTo(knee),knee.distanceTo(ankle)]);
   const shoulder=person.worldToLocal(upper.localToWorld(V(side*.218,.425,0)));let hand,elbowPole,elbow,pulling=false,strokePhase=0;
   if(swimming){const t=(cycle+i*.5)%1;strokePhase=t;const crawl=strokePoint(t,1,side),scull=V(side*(.23+.09*Math.sin(s.time*3+i*Math.PI)),-.28,.21+.05*Math.cos(s.time*3+i*Math.PI)),offset=scull.lerp(crawl,swimBlend);if(offset.length()>.575)offset.setLength(.575);hand=shoulder.clone().add(offset);pulling=t<.62;elbowPole=V(side*.3,-.12,-.12).lerp(strokePoint(t,2,side),swimBlend);}
   else{
    // Shoulder-driven counter-swing with a forward-bending elbow. Keeping the
    // hinge explicit avoids the IK solver picking a backward forearm pose.
    const angle=-swing*(.32+run*.32)-run*.10,flex=.22+run*1.28;
    elbow=shoulder.clone().add(V(side*.09,-Math.cos(angle),Math.sin(angle)).normalize().multiplyScalar(.31).applyQuaternion(upper.quaternion));
    hand=elbow.clone().add(V(side*.02,-Math.cos(angle+flex),Math.sin(angle+flex)).normalize().multiplyScalar(.29).applyQuaternion(upper.quaternion));
   }
   if(swimming)elbow=joint(shoulder,hand,.31,.29,elbowPole);placeSegment(limbs[i].upper,shoulder,elbow);placeSegment(limbs[i].fore,elbow,hand);limbs[i].shoulder.position.copy(shoulder);limbs[i].elbow.position.copy(elbow);hands[i].position.copy(hand);
   if(swimming)orientPalm(hands[i],elbow,pulling,dt,side*.08*Math.sin(strokePhase*Math.PI*2));else orientPalm(hands[i],elbow,false,0,side*Math.PI/2);gripHands[i].visible=!swimming;openHands[i].visible=swimming;pose.arms.push([shoulder.distanceTo(elbow),elbow.distanceTo(hand)]);
  }
  onFootRoot.updateMatrixWorld(true);hands.forEach((h,i)=>h.getWorldPosition(contacts.hands[i]));feet.forEach((f,i)=>f.getWorldPosition(contacts.feet[i]));contacts.active=swimming&&swimBlend>.65;contacts.phase=phase;
  pose.land={shoulders:limbs.map(l=>l.shoulder.position.toArray()),elbows:limbs.map(l=>l.elbow.position.toArray()),wrists:hands.map(h=>h.position.toArray())};
  pose.swim={blend:swimBlend,phase,roll,breath,headHeight:head.getWorldPosition(V()).y-s.walkY,handQuaternions:hands.map(h=>h.quaternion.toArray()),shoulders:limbs.map(l=>l.shoulder.position.toArray()),elbows:limbs.map(l=>l.elbow.position.toArray()),wrists:hands.map(h=>h.position.toArray()),elbowHeights:limbs.map(l=>l.elbow.getWorldPosition(V()).y-s.walkY),handHeights:contacts.hands.map(p=>p.y-s.walkY),footHeights:contacts.feet.map(p=>p.y-s.walkY)};
 }
 function updateOnHorse(s,seat,dt){
  if(!seat)return;if(person.parent!==onFootRoot)onFootRoot.add(person);onFootRoot.visible=true;boardLeash.object.visible=wingLeash.object.visible=false;contacts.active=false;swimBlend=0;
  const h=s.horse,speed=Math.abs(h.speed),jumping=!!h.jump,mount=Math.max(0,h.mountTime/.7),rise=jumping?.035:speed>2.3&&speed<4.7?Math.max(0,Math.sin(h.phase*2))*.035:0;
  seat.updateWorldMatrix(true,false);seat.getWorldPosition(onFootRoot.position);seat.getWorldQuaternion(onFootRoot.quaternion);onFootRoot.position.add(V(-.9*mount,-1.0*mount,0).applyQuaternion(onFootRoot.quaternion));person.position.set(0,0,0);person.rotation.set(0,0,0);
  hips.position.set(0,.155+rise,jumping?.055:0);hips.rotation.set(0,0,0);upper.position.set(0,.17+rise,jumping?.055:0);upper.rotation.set(.045+Math.min(.14,speed*.015)+(jumping?.32:0),0,0);head.rotation.set(-.05,0,0);onFootRoot.updateMatrixWorld(true);pose.legs=[];pose.arms=[];
  for(let i=0;i<2;i++){const side=i===0?-1:1,hip=person.worldToLocal(hips.localToWorld(V(side*.105,-.07,0))),foot=V(side*.435,-.67,.20),ankle=foot.clone().add(V(0,.045,-.035)),knee=joint(hip,ankle,.43,.43,V(side*1.35,.3,.75));feet[i].position.copy(foot);feet[i].rotation.set(-.12,side*.10,0);hipJoints[i].position.copy(hip);placeSegment(limbs[i].thigh,hip,knee);placeSegment(limbs[i].calf,knee,ankle);limbs[i].knee.position.copy(knee);pose.legs.push([hip.distanceTo(knee),knee.distanceTo(ankle)]);
   const shoulder=person.worldToLocal(upper.localToWorld(V(side*.218,.425,0))),hand=V(side*.15,.29+rise,.34+(jumping?.12:0)),elbow=joint(shoulder,hand,.31,.29,V(side*.12,-1,-.45));placeSegment(limbs[i].upper,shoulder,elbow);placeSegment(limbs[i].fore,elbow,hand);limbs[i].shoulder.position.copy(shoulder);limbs[i].elbow.position.copy(elbow);hands[i].position.copy(hand);hands[i].rotation.set(-.25,0,side*.08);gripHands[i].visible=true;openHands[i].visible=false;pose.arms.push([shoulder.distanceTo(elbow),elbow.distanceTo(hand)]);
  }
  onFootRoot.updateMatrixWorld(true);pose.riding={thighs:limbs.map(l=>[l.thigh.getWorldPosition(V()).toArray(),l.knee.getWorldPosition(V()).toArray()]),hip:hips.getWorldPosition(V()).toArray(),seat:seat.getWorldPosition(V()).toArray(),hands:hands.map(h=>h.getWorldPosition(V()).toArray()),elbows:limbs.map(l=>l.elbow.position.toArray()),shoulders:limbs.map(l=>l.shoulder.position.toArray()),wrists:hands.map(h=>h.position.toArray()),feet:feet.map(f=>f.getWorldPosition(V()).toArray())};
 }
 function updateFall(s,dt){
  // Keep the same articulated limbs, but rotate around the hips while the core
  // follows a ballistic centre-of-mass trajectory. Hands release the wing.
  updateOnFoot({...s,mode:'walking',walkY:0,speed:0,jumpTime:0,entryTime:0},dt);
  const f=s.fallMotion;onFootRoot.position.set(s.x,s.walkY,s.z);onFootRoot.rotation.set(0,s.heading,0);person.rotation.set(f.pitch,0,f.roll);person.position.copy(V(0,-1.18,0).applyEuler(person.rotation));upper.rotation.set(.08,0,0);head.rotation.set(-.08,0,0);person.updateMatrixWorld(true);pose.arms=[];pose.legs=[];
  for(let i=0;i<2;i++){
   const side=i===0?-1:1,shoulder=person.worldToLocal(upper.localToWorld(V(side*.218,.425,0))),hand=shoulder.clone().add(V(side*(.36+.05*Math.sin(f.age*9+i)),.05+.12*Math.sin(f.age*7+i),.18)),elbow=joint(shoulder,hand,.31,.29,V(side,-.3,.4));
   placeSegment(limbs[i].upper,shoulder,elbow);placeSegment(limbs[i].fore,elbow,hand);limbs[i].shoulder.position.copy(shoulder);limbs[i].elbow.position.copy(elbow);hands[i].position.copy(hand);orientPalm(hands[i],elbow,false);gripHands[i].visible=false;openHands[i].visible=true;pose.arms.push([shoulder.distanceTo(elbow),elbow.distanceTo(hand)]);
   const hip=person.worldToLocal(hips.localToWorld(V(side*.105,-.07,0))),ankle=hip.clone().add(V(side*.10,-.68,.16+Math.sin(f.age*8+i*Math.PI)*.13)),knee=joint(hip,ankle,.43,.43,V(side*.1,0,1));
   hipJoints[i].position.copy(hip);placeSegment(limbs[i].thigh,hip,knee);placeSegment(limbs[i].calf,knee,ankle);limbs[i].knee.position.copy(knee);feet[i].position.copy(ankle).sub(V(0,.045,-.035));feet[i].rotation.set(.2,side*.12,0);pose.legs.push([hip.distanceTo(knee),knee.distanceTo(ankle)]);
  }
  contacts.active=false;onFootRoot.updateMatrixWorld(true);
 }
 function batchStatic(group){const batches=new Map();for(const child of [...group.children])if(child.isMesh){if(!batches.has(child.material))batches.set(child.material,[]);batches.get(child.material).push(child);}for(const [material,objects] of batches){if(objects.length<2)continue;const positions=[],normals=[],uv=[];for(const object of objects){object.updateMatrix();const geo=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geo.applyMatrix4(object.matrix);positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);if(geo.attributes.uv)uv.push(...geo.attributes.uv.array);else uv.push(...new Float32Array(geo.attributes.position.count*2));geo.dispose();object.visible=false;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));mesh(group,geo,material);}}
 [upper,head,...feet,...hands,...gripHands,...openHands].forEach(batchStatic);
 return {person,update,updateOnFoot,updateOnHorse,updateFall,swimContacts:()=>contacts,diagnostics(){riderRoot.updateMatrixWorld(true);const actual=(o,p=V())=>riderRoot.worldToLocal(o.localToWorld(p));return {worldWingCenter:wing.getWorldPosition(V()).toArray(),wingRotation:wing.rotation.toArray().slice(0,3),worldHips:hips.getWorldPosition(V()).toArray(),arms:pose.arms,legs:pose.legs,hipSeals:hipJoints.map((h,i)=>h.position.distanceTo(limbs[i].thigh.position)),feet:pose.feet,flagged:flagPose,bodyRotation:person.rotation.toArray().slice(0,3),hipOffset:hips.position.z,lateralLean:actual(hips).x-(actual(feet[0]).x+actual(feet[1]).x)/2,swim:pose.swim,land:pose.land,riding:pose.riding,boardAttachmentError:Math.max(boardLeash.start.distanceTo(actual(ankleCuff,V(.035,0,0))),boardLeash.end.distanceTo(actual(tailPlug))),wingAttachmentError:Math.max(wingLeash.start.distanceTo(actual(hands[0],V(.025,0,-.05))),wingLeash.end.distanceTo(actual(wingPlug))),grips:hands.map((h,i)=>flagPose&&i===1?0:h.getWorldPosition(V()).distanceTo(wing.localToWorld(activeGrips[i].clone()))),cordVertices:boardLeash.object.geometry.attributes.position.count+wingLeash.object.geometry.attributes.position.count};}};
}
root.FoilRider={create};
})(globalThis);
