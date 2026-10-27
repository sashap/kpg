/* One small Shoreline pedalboat. Rendering and swept collision share its pose. */
(function(root){'use strict';
function frame(time,project){const [x,z]=project([37.4332,-122.08935]),a=time*.028;return {x:x+Math.cos(a)*28,z:z+Math.sin(a)*20,heading:Math.atan2(-28*Math.sin(a),20*Math.cos(a)),pedal:time*2.4};}
function collision(world,from,to,time,dt){if(world.location.id!=='shoreline')return null;const n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.20));for(let i=0;i<=n;i++){const t=i/n,b=frame(time-dt+dt*t,world.geography.project),x=from.x+(to.x-from.x)*t,z=from.z+(to.z-from.z)*t,dx=x-b.x,dz=z-b.z,c=Math.cos(b.heading),s=Math.sin(b.heading),side=dx*c-dz*s,fore=dx*s+dz*c;if((side/1.28)**2+(fore/1.95)**2<1)return {kind:'pedalboat',x,z};}return null;}
function build({THREE,scene,mesh,box,ell,rod,g,actors}){
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),boat=new THREE.Group(),riders=[];scene.add(boat);
 for(const x of [-.55,.55]){ell(boat,0xe6dfc7,x,.03,0,.29,.25,1.32);ell(boat,0xe7b847,x,.24,.10,.30,.13,1.18);}
 box(boat,0xe7b847,0,.17,0,1.40,.16,2.05);box(boat,0xd1c7ac,0,.25,.18,.92,.06,1.20);ell(boat,0xe7b847,0,.27,.91,.69,.17,.39);
 for(const x of [-.34,.34]){box(boat,0x376d80,x,.42,-.36,.54,.13,.60);const back=box(boat,0x376d80,x,.67,-.67,.54,.48,.10);back.rotation.x=-.12;}
 const wheel=new THREE.Group();wheel.position.set(0,.04,-.92);boat.add(wheel);for(let i=0;i<8;i++){const a=i*Math.PI/4,p=box(wheel,0x426e7a,0,Math.sin(a)*.22,Math.cos(a)*.22,.57,.06,.14);p.rotation.x=-a;}
 const limbGeo=new THREE.CylinderGeometry(1,1,1,10),skin=new THREE.MeshStandardMaterial({color:0xb68562,roughness:.85}),pants=new THREE.MeshStandardMaterial({color:0x3c5660,roughness:.9});
 const segment=(o,a,b,r)=>{o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(r,a.distanceTo(b),r);o.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());};
 for(let k=0;k<2;k++){const rider=new THREE.Group(),x=k?.34:-.34;rider.position.x=x;boat.add(rider);ell(rider,0x3c5660,0,.59,-.27,.15,.13,.16);ell(rider,k?0xe49b50:0xc56c3d,0,.87,-.35,.18,.27,.13);ell(rider,skin,0,1.23,-.34,.115,.145,.11);ell(rider,0x4b3c30,0,1.33,-.355,.12,.065,.105);ell(rider,skin,0,1.23,-.23,.026,.035,.035);
  for(const side of [-1,1]){rod(rider,skin,[side*.17,1.03,-.33],[side*.20,.83,-.10],.045);rod(rider,skin,[side*.20,.83,-.10],[side*.14,.81,.17],.034);ell(rider,skin,side*.14,.81,.18,.037,.025,.05);}
  rod(rider,0x4a5556,[-.15,.78,.19],[.15,.78,.19],.018);
  const legs=[];for(const side of [-1,1]){const thigh=mesh(rider,limbGeo,pants),calf=mesh(rider,limbGeo,skin),shoe=ell(rider,0x34434a,side*.10,.2,.4,.055,.04,.12);legs.push({side,thigh,calf,shoe});}riders.push({rider,legs});
 }
 const foam=new THREE.MeshBasicMaterial({color:0xd5e6dc,transparent:true,opacity:.25,depthWrite:false});for(const side of [-1,1]){const points=[V(side*.55,.01,-1.05),V(side*.70,.01,-1.8),V(side*.90,.01,-2.7)],geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.018,5,false);mesh(boat,geo,foam);}
 actors.push(s=>{const b=frame(s.time,g.project);boat.position.set(b.x,FoilCore.sea(b.x,b.z,s.time,s.config.swell,s.config)+.025,b.z);boat.rotation.set(Math.sin(s.time*.9)*.012,b.heading,Math.sin(s.time*1.2)*.012);wheel.rotation.x=-b.pedal;
  riders.forEach((r,k)=>r.legs.forEach(l=>{const a=b.pedal+(l.side<0?Math.PI:0)+k*.4,hip=V(l.side*.10,.59,-.23),foot=V(l.side*.10,.27+Math.sin(a)*.12,.25+Math.cos(a)*.12),axis=foot.clone().sub(hip),d=axis.length();axis.normalize();const along=(d*d+.37*.37-.36*.36)/(2*d),bend=V(0,1,0).addScaledVector(axis,-axis.y).normalize(),knee=hip.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,.37*.37-along*along)));segment(l.thigh,hip,knee,.058);segment(l.calf,knee,foot,.040);l.shoe.position.copy(foot);l.shoe.rotation.x=Math.sin(a)*.13;}));
 });return {riders:riders.length};
}
const api={frame,collision,build};root.FoilLakeBoat=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
