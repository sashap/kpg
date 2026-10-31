/* Optional shore exploration. Distances and speeds are metres and m/s.
   Shared movement/hoof timing keeps the rider, animation and collision aligned. */
(function(root){'use strict';
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function ground(world,x,z){return world.horseSurface?.(x,z)??world.geography?.horseSurface(x,z)??world.walkHeight(x,z);}
function blocked(world,x,z,r,y){return world.geography?.horseBlocked(x,z,r,y)??world.blocked(x,z,r,y);}
const DRAFT=1.18;
// Dry support remains available for spawning and finding land routes. Riding
// uses the same footprint with buoyancy replacing the bottom in deep water.
function support(world,x,z,heading,waterAt=null){const c=Math.cos(heading),s=Math.sin(heading),samples=[],stairs=!!world.stepsAt?.(x,z),back=stairs?-.95:-1.65,front=stairs?1.2:1.55,water=waterAt?(waterAt(x,z)*2+waterAt(x+s,z+c)+waterAt(x-s,z-c))/4:0,bed=ground(world,x,z),depth=water-bed,floor=(a,b)=>waterAt?Math.max(ground(world,a,b),water-DRAFT):ground(world,a,b),center=floor(x,z);
 // Include the longest walking/galloping stride, not just the torso. A hoof
 // must not reach through a hood before the body collision notices the car.
 for(const fore of [back,0,front])for(const side of [-.43,.43]){const px=x+side*c+fore*s,pz=z-side*s+fore*c,y=floor(px,pz);if(!waterAt&&y<.05||Math.hypot(px,pz)>world.limit-3||blocked(world,px,pz,.25,y+.025)||!stairs&&blocked(world,px,pz,.25,center+.45))return null;samples.push(y);}
 const lo=Math.min(...samples),hi=Math.max(...samples);if(hi-lo>(world.stepsAt?.(x,z)?2.8:1.65))return null;
 // Sample the whole length densely: a staircase has small risers,
 // whereas a wall / cliff has an abrupt jump even if both ends are dry.
 let previous=null;for(let f=back;f<=front+.01;f+=stairs?.18:.16){const height=floor(x+f*s,z+f*c);if(previous!==null&&Math.abs(height-previous)>.44&&!(waterAt&&Math.max(height,previous)<water+.45))return null;previous=height;}
 return {y:center,pitch:Math.atan2((samples[4]+samples[5]-samples[0]-samples[1])/2,front-back),roll:Math.atan2((samples[1]+samples[3]+samples[5]-samples[0]-samples[2]-samples[4])/3,.86),depth,water,swim:waterAt?clamp((depth-.78)/.40,0,1):0};
}
function waterFor(session,sea){return (x,z)=>sea?sea(x,z,session.time||0,session.config?.swell??0,session.config||{}):0;}
function waterClear(session,world,from,to,waterAt){
 if(!world.waterContacts||Math.min(ground(world,to.x,to.z),ground(world,from.x,from.z))>waterAt(to.x,to.z)+.1)return true;
 // Three overlapping circles rotate with the barrel and neck. Check a swept
 // path, including when turning at rest, so boats and docks remain solid.
 for(const fore of [-.85,0,1.10]){const pose=p=>{const x=p.x+Math.sin(p.heading)*fore,z=p.z+Math.cos(p.heading)*fore;return {x,z,heading:p.heading,speed:session.horse?.speed||0,height:p.y+1.18-waterAt(x,z),radius:.38,length:.38,below:1.0,above:1.3};},a=pose(from),b=pose(to),hit=world.waterContacts.sweep(a,b,session.time||0,0,waterAt,session.waterTraffic||[]);if(!hit)continue;
  const old=world.waterContacts.sweep(a,a,session.time||0,0,waterAt,session.waterTraffic||[]);
  if(!old||old.id!==hit.id||Math.hypot(b.x-hit.objectX,b.z-hit.objectZ)<=Math.hypot(a.x-old.objectX,a.z-old.objectZ)+1e-7)return false;
 }return true;
}
function immerse(session,h,p,dt){const was=!!h.swimming;h.depth=Math.max(0,p.depth);h.water=p.water;h.swim=p.swim;h.swimming=was?p.depth>1.04:p.depth>=1.18;
 if(h.swimming!==was&&session.horse===h)session.emit?.(h.swimming?'horse-swim':'horse-wade',{x:h.x,z:h.z,speed:Math.abs(h.speed)});
 h.y=p.swim>.01?Math.max(p.y,h.y+(p.y-h.y)*(1-Math.exp(-dt*7))):p.y;
 h.pitch+=(clamp(p.pitch,-.45,.45)*(1-p.swim)-h.pitch)*(1-Math.exp(-dt*7));h.roll+=(clamp(p.roll,-.4,.4)*(1-p.swim)-h.roll)*(1-Math.exp(-dt*7));
}
function swimFoot(phase,index,speed){const t=((phase/TAU+[0,.5,.22,.72][index])%1+1)%1,pull=t<.55,u=pull?t/.55:(t-.55)/.45;return {z:(pull?.40-.8*u:-.40*Math.cos(Math.PI*u))*(speed<0?-1:1),lift:pull?.10:.10+Math.sin(Math.PI*u)*.39,stance:false,phase:t};}
function spawn(world){const site=world.location.id,positions={lemorne:[-20.46475,57.31760],kahului:[20.89226,-156.46898],shoreline:[37.43237,-122.08845],third:[37.57357,-122.27958],coyote:[37.58891,-122.32817],crissy:[37.80595,-122.45042]},origin=site==='coyote'?Object.values(world.geography.promenade.rigging.horse):world.geography?world.geography.project(positions[site]):[-199,-76];
 for(let r=0;r<=32;r+=2)for(let j=0;j<(r?24:1);j++){const angle=j*TAU/24,x=origin[0]+Math.cos(angle)*r,z=origin[1]+Math.sin(angle)*r,p=support(world,x,z,0);if(!p)continue;if(world.geography?.features.paths.some(q=>root.FoilLocations.distance(x,z,q.points)<3))continue;if(!world.geography&&world.castle?.path.some(q=>Math.hypot(q.x-x,q.z-z)<2.3))continue;
  return [{id:site+'-horse',name:site==='shoreline'||site==='crissy'?'Clover':'Willow',coat:site==='third'||site==='crissy'?'buckskin':'bay',x,z,y:p.y,heading:0,speed:0,phase:0,pitch:p.pitch,roll:p.roll,gait:'Resting',distance:0,blocked:false,mountTime:0}];
 }return [];
}
// Rounded, oriented body and head footprints follow the animal when it moves.
// If a saved pose starts inside one, allow outward steps so it cannot trap the player.
function walkerClearance(h,x,z,y,radius=.28){
 if(y>=h.y+2.2||y+1.7<h.y+.25)return Infinity;
 const dx=x-h.x,dz=z-h.z,c=Math.cos(h.heading),s=Math.sin(h.heading),side=dx*c-dz*s,fore=dx*s+dz*c;
 const barrel=Math.hypot(side,fore-clamp(fore,-.65,.65))-.43-radius;
 const head=Math.hypot(side,fore-1.45)-.26-radius;
 return Math.min(barrel,head);
}
function blocksWalker(session,x,z,y){return session.horses.some(h=>{
 const next=walkerClearance(h,x,z,y);if(next>=0)return false;
 const previous=walkerClearance(h,session.x,session.z,session.walkY);
 return previous>=0||next<previous+1e-7;
});}
function nearby(session,range=3.4){if(!['walking','swimming'].includes(session.mode))return null;return session.horses.find(h=>Math.hypot(h.x-session.x,h.z-session.z)<range&&(session.mode==='swimming'?h.depth>.5&&Math.abs((h.water||0)-session.walkY)<.8:Math.abs(h.y-session.walkY)<.8))||null;}
function mount(session){const h=nearby(session);if(!h)return false;session.horse=h;h.mountTime=.7;h.speed=0;session.mode='riding';session.x=h.x;session.z=h.z;session.walkY=h.y;session.heading=h.heading;session.speed=0;session.towing=false;session.jumpTime=0;session.fallReason='';session.swimVelocity=session.swimEffort=0;session.controls={steer:0,balance:0,trim:0};session.emit('horse-mount',{name:h.name});return true;}
function dismount(session,world,sea){const h=session.horse;if(!h)return false;if(h.jump){session.emit('hint',{text:'Land the jump before dismounting.'});return false;}if(Math.abs(h.speed)>.8){session.controls.balance=0;h.stopping=true;session.emit('hint',{text:'Let your horse come to a stop, then dismount.'});return false;}
 for(const side of [-1,1])for(const fore of [0,-.7,.7]){const x=h.x+Math.cos(h.heading)*side*1.2+Math.sin(h.heading)*fore,z=h.z-Math.sin(h.heading)*side*1.2+Math.cos(h.heading)*fore,y=ground(world,x,z),water=waterFor(session,sea)(x,z),swimming=y<water-.72;if(Math.hypot(x,z)>world.limit-2||(!swimming&&(y<water-.5||Math.abs(y-h.y)>.75))||world.blocked(x,z,.32,swimming?water-.5:y)||!waterClear(session,world,{x,z,y:swimming?water-DRAFT:y,heading:h.heading},{x,z,y:swimming?water-DRAFT:y,heading:h.heading},waterFor(session,sea)))continue;session.x=x;session.z=z;session.walkY=swimming?water:y;session.heading=h.heading;session.speed=0;session.mode=swimming?'swimming':'walking';session.swimVelocity=session.swimEffort=session.walkVelocity=session.jumpTime=0;session.horse=null;session.controls={steer:0,balance:0,trim:0};h.speed=0;h.stopping=false;session.emit('horse-dismount',{name:h.name,swimming});return true;}
 session.emit('hint',{text:'There is no clear footing beside your horse. Move to a wider spot.'});return false;
}
const GALLOP_SPEED=16;
function targetSpeed(forward){forward=clamp(forward,-1,1);if(forward<0)return forward*1.05;if(forward<.4)return forward*5;if(forward<.68)return 2+(forward-.4)*9;if(forward<.86)return 4.52+(forward-.68)*12;return 6.68+(forward-.86)/.14*(GALLOP_SPEED-6.68);}
function gait(speed){const v=Math.abs(speed);return v<.08?'Resting':speed<0?'Backing':v<2.3?'Walk':v<4.7?'Trot':v<6.8?'Canter':'Gallop';}
function stride(speed){const v=Math.abs(speed),g=gait(speed),fast=clamp((v-8)/8,0,1);return {amplitude:Math.min(.66,.18+v*.15)+fast*.22,duty:g==='Walk'||g==='Backing'?.68:g==='Trot'?.48:g==='Canter'?.43:.37-fast*.10};}
// LF, RF, LH, RH: four-beat walk, diagonal trot, right-lead canter,
// then a four-beat gallop with a suspension phase (Penn State Extension).
function foot(phase,index,speed){const v=Math.abs(speed),g=gait(speed),offsets=g==='Trot'||g==='Backing'?[0,.5,.5,0]:g==='Canter'?[.31,.57,0,.31]:g==='Gallop'?[.39,.53,0,.14]:[.25,.75,0,.5],{duty,amplitude}=stride(speed),t=((phase/TAU+offsets[index])%1+1)%1,lift=g==='Walk'?.14:g==='Trot'?.23:.31;
 if(v<.08)return {z:0,lift:0,stance:true,phase:t};if(t<duty)return {z:amplitude*(1-2*t/duty)*Math.sign(speed),lift:0,stance:true,phase:t};const swing=(t-duty)/(1-duty);return {z:-amplitude*Math.cos(swing*Math.PI)*Math.sign(speed),lift:Math.sin(swing*Math.PI)*lift,stance:false,phase:t};
}
function jump(session){const h=session.horse;if(session.mode!=='riding'||!h||h.swim>.1||h.depth>.75||h.jump||h.mountTime>0||(h.jumpCooldown||0)>0)return false;h.jump={vy:6.5,age:0,startY:h.y,travelSpeed:h.speed,takeoffSpeed:h.speed};h.stopping=false;h.blocked=false;session.emit('horse-jump');return true;}
function airClear(world,x,z,heading,y){if(Math.hypot(x,z)>world.limit-3)return false;const c=Math.cos(heading),s=Math.sin(heading);for(const f of [-.85,0,1.1])for(const side of [-.30,.30]){const px=x+side*c+f*s,pz=z-side*s+f*c;if(world.walkHeight(px,pz)>y+.12||blocked(world,px,pz,.20,y+.04))return false;}return true;}
function stepAir(session,world,dt,waterAt){const h=session.horse,j=h.jump,previous=h.y;
 const remember=()=>{const p=support(world,h.x,h.z,h.heading,waterAt);if(p&&p.y<=h.y+.08&&waterClear(session,world,{...h,y:p.y},{...h,y:p.y},waterAt))j.landing={x:h.x,z:h.z,heading:h.heading,...p};};remember();
 j.age+=dt;j.vy-=10.5*dt;h.y+=j.vy*dt;h.heading=wrap(h.heading-clamp(session.controls.steer,-1,1)*dt*.45);
 // Give standing jumps a short, controllable hop in either direction. Keep
 // run-up momentum, but do not accelerate a standing jump into a gallop.
 // An obstacle may stop translation until the hooves clear it; retain the
 // requested air movement so holding Up/Down resumes travel once clear.
 const forward=-clamp(session.controls.balance,-1,1),wanted=forward>0?Math.max(4.2*forward,j.takeoffSpeed):forward<0?-Math.max(-2.8*forward,-j.takeoffSpeed):0;
 if(forward&&!j.directed&&j.age<.15){j.travelSpeed=wanted;j.directed=true;}
 j.travelSpeed+=clamp(wanted-j.travelSpeed,-(forward?14:2)*dt,(forward?14:2)*dt);h.speed=j.travelSpeed;h.blocked=false;const distance=h.speed*dt,n=Math.max(1,Math.ceil(Math.abs(distance)/.08));let moved=0;
 for(let i=0;i<n;i++){const dx=Math.sin(h.heading)*distance/n,dz=Math.cos(h.heading)*distance/n;if(!airClear(world,h.x+dx,h.z+dz,h.heading,Math.max(previous,h.y))||!waterClear(session,world,{...h,y:Math.max(previous,h.y)},{x:h.x+dx,z:h.z+dz,heading:h.heading,y:Math.max(previous,h.y)},waterAt)){h.speed=0;h.blocked=true;break;}h.x+=dx;h.z+=dz;moved+=Math.hypot(dx,dz);}
 remember();const floor=Math.max(ground(world,h.x,h.z),waterAt(h.x,h.z)-DRAFT);
 if(j.vy<=0&&(h.y<=floor||!airClear(world,h.x,h.z,h.heading,h.y+.55))){
  let p=support(world,h.x,h.z,h.heading,waterAt);
  if(p&&!waterClear(session,world,{...h,y:p.y},{...h,y:p.y},waterAt))p=null;
  if(!p){
   // A landing across a sharp car edge cannot support the whole animal.
   // Settle on the last clear footing instead of embedding the legs in it.
   let safe=j.landing;
   if(!safe)search:for(let d=.15;d<=4;d+=.15)for(const side of [-1,1]){const x=h.x+Math.sin(h.heading)*d*side,z=h.z+Math.cos(h.heading)*d*side,q=support(world,x,z,h.heading,waterAt);if(q&&q.y<=previous+.1){safe={x,z,heading:h.heading,...q};break search;}}
   if(safe){h.x=safe.x;h.z=safe.z;h.heading=safe.heading;p=safe;}h.speed=0;h.blocked=true;
  }
  h.y=p?.y??floor;h.jump=null;h.jumpCooldown=.22;h.pitch=p?.pitch||0;h.roll=p?.roll||0;if(p)immerse(session,h,p,dt);session.emit('horse-land',{water:(p?.depth||0)>.1,x:h.x,z:h.z,speed:Math.abs(j.vy)});
 }
 h.distance+=moved;h.gait=h.jump?'Jump':gait(h.speed);session.x=h.x;session.z=h.z;session.walkY=h.y;session.heading=h.heading;session.speed=Math.abs(h.speed);session.status=h.jump?'Jumping':h.gait;session.height=0;
}
function idle(session,world,dt,sea){const waterAt=waterFor(session,sea);for(const h of session.horses){if(h===session.horse||!(h.depth>.1))continue;const p=support(world,h.x,h.z,h.heading,waterAt);if(p)immerse(session,h,p,dt);h.speed=0;h.gait=h.swimming?'Swimming':h.depth>.12?'Wading':'Resting';if(h.swim>.01)h.phase+=TAU*.55*dt;}}
function step(session,world,dt,sea){const h=session.horse;if(!h)return;const waterAt=waterFor(session,sea);h.jumpCooldown=Math.max(0,(h.jumpCooldown||0)-dt);if(h.jump){stepAir(session,world,dt,waterAt);return;}h.mountTime=Math.max(0,h.mountTime-dt);
 const forward=-clamp(session.controls.balance,-1,1),rough=support(world,h.x,h.z,h.heading,waterAt);if(rough)immerse(session,h,rough,dt);
 const wet=clamp(((h.depth||0)-.12)/.9,0,1),onSteps=Math.abs(rough?.pitch||0)>.20,landSpeed=targetSpeed(forward),swimSpeed=forward*(forward<0?.75:2.25),target=h.stopping||h.mountTime>0?0:Math.min(onSteps?1.7:GALLOP_SPEED,landSpeed+(swimSpeed-landSpeed)*wet),delta=target-h.speed,acceleration=(2.1+1.9*clamp((landSpeed-6.68)/(GALLOP_SPEED-6.68),0,1))*(1-wet)+1.3*wet;h.speed+=clamp(delta,-(9-3.5*wet)*dt,acceleration*dt);if(Math.abs(h.speed)<.025&&target===0){h.speed=0;h.stopping=false;}
 const steer=clamp(session.controls.steer,-1,1),turnRate=1.55/(1+Math.abs(h.speed)*.20),angle=wrap(h.heading-steer*turnRate*dt),p=support(world,h.x,h.z,angle,waterAt);if(p&&waterClear(session,world,h,{...h,heading:angle},waterAt))h.heading=angle;
 const distance=h.speed*dt,n=Math.max(1,Math.ceil(Math.abs(distance)/.10)),dx=Math.sin(h.heading)*distance/n,dz=Math.cos(h.heading)*distance/n;let moved=0;h.blocked=false;
 for(let i=0;i<n;i++){const x=h.x+dx,z=h.z+dz,next=support(world,x,z,h.heading,waterAt);if(!next||(Math.abs(next.y-h.y)>.42&&!(next.depth>.1&&next.y<h.y))||!waterClear(session,world,h,{x,z,y:next.y,heading:h.heading},waterAt)){h.blocked=true;h.speed=0;break;}h.x=x;h.z=z;immerse(session,h,next,dt/n);moved+=Math.hypot(dx,dz);}
 h.distance+=moved;h.gait=h.swimming?'Swimming':h.depth>.12?'Wading':gait(h.speed);const {duty,amplitude}=stride(h.speed),frequency=Math.abs(h.speed)*duty/(2*amplitude),swim=h.swim||0;if(moved>.0001||swim>.01)h.phase+=TAU*(frequency*(1-swim)+(.55+Math.abs(h.speed)*.20)*swim)*dt;
 session.x=h.x;session.z=h.z;session.walkY=h.y;session.heading=h.heading;session.speed=Math.abs(h.speed);session.status=h.blocked?'Easy — steer or back toward open water or ground':h.gait;session.height=0;
}
const api={spawn,support,ground,waterClear,swimFoot,idle,jump,walkerClearance,blocksWalker,nearby,mount,dismount,targetSpeed,gait,foot,step};root.FoilHorses=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
