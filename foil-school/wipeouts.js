/* Cause-dependent separation and a buoyant, independently tumbling board.
   A forgiving teaching approximation, not a full rigid-body/fluid solver. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function launch(s,cause,air,water){
 const pace=s.speed,side=cause?.side||Math.sign(s.roll)||Math.sign(s.steer)||1;
 let kind=cause?.kind||'fall';
 if(kind==='breach')kind=pace<6.2&&s.balance>.18?'tail-breach':'forward-breach';
 if(air&&kind==='fall')kind='air-landing';
 const seed=Math.sin(s.time*12.9898+s.x*.73+s.z*1.37+s.stats.crashes*78.233)*43758.5453,variation=seed-Math.floor(seed);
 let along=pace*.45-s.balance*1.5,lateral=s.steer*1.8,up=air?air.vy:1+Math.max(0,s.vertical)*.7;
 let pitchRate=clamp(.8-s.balance*3,-2.2,2.6),rollRate=s.steer*2.3;
 let boardAlong=pace*.38,boardSide=-lateral*.35,boardUp=Math.max(0,s.vertical)*.4+.25;
 let boardPitch=air?-air.pitch:s.pitch,boardRoll=s.roll,boardPitchRate=.45,boardRollRate=-rollRate*.55;
 if(kind==='tail-breach'){
  along=pace*.25-1.7;lateral=s.lateralSpeed*.25;up=1.15;
  pitchRate=-2.05;rollRate=s.roll*.5;
  boardAlong=pace*.75+2.0;boardSide=-lateral*.4;boardUp=2.6+Math.max(0,s.vertical)*.6;
  boardPitchRate=3.4;boardRollRate=(variation-.5)*.65;
 }else if(kind==='tip-breach'){
  // Local +X is left. A positive roll exposes that tip. Board goes left,
  // rider continues forward and right; mirror all lateral values on the other tack.
  along=Math.max(2,pace*.82);lateral=side*(1.6+Math.min(1.0,pace*.08));up=1.0;
  pitchRate=1.1;rollRate=side*1.8;
  boardAlong=pace*.44;boardSide=-side*(2.2+Math.min(1.2,pace*.1));boardUp=.8;
  boardPitchRate=.25;boardRollRate=-side*3.0;
 }else if(['nose-dive','forward-breach','strike','beach-strike','air-landing'].includes(kind)){
  along=Math.max(pace*.78,pace>1?1:0);lateral=pace>1?(Math.sign(s.steer)||s.wingSide)*.75:0;up=air?air.vy:.8;
  pitchRate=air?clamp(air.pitchRate,-3.2,3.2):2.0;rollRate=s.steer*1.2;
  boardAlong=pace*(kind==='strike'?.06:.22);boardUp=.25;
  boardPitchRate=kind==='air-landing'?clamp(-air.pitchRate,-3.2,3.2):-1.5;
  boardRollRate=-lateral*(.8+variation);
  if(kind==='beach-strike'){along=pace*.98;lateral=s.steer*.3;up=2.2+pace*.1;boardAlong=pace*.06;boardPitchRate=-3.0;boardUp=1.5;pitchRate=1.7;}
 }else if(kind==='wing-trip'){
  along=clamp(Math.max(pace,cause.speed*.65),1.6,8);lateral=s.lateralSpeed*.25+side*.12;up=1.8+clamp(pace*.10,0,.6);
  pitchRate=2.5;rollRate=side*.28;boardAlong=pace*.08;boardUp=0;boardPitchRate=-.6;boardRollRate=0;
 }
 const forward={x:Math.sin(s.heading),z:Math.cos(s.heading)},right={x:-Math.cos(s.heading),z:Math.sin(s.heading)};
 const velocity=(a,b)=>({vx:forward.x*a+right.x*b,vz:forward.z*a+right.z*b});
 const inverted=kind!=='wing-trip'&&variation>(['tail-breach','tip-breach','air-landing'].includes(kind)?.38:.78);
 return {
  body:{...velocity(along,lateral),vy:up,pitch:air?wrap(air.pitch):-s.pitch,roll:s.roll,pitchRate,rollRate,kind,breachSide:kind==='tip-breach'?side:0,variation,wingInverted:inverted,wingOffset:-s.wingSide*(.9+Math.abs(s.wingAngle)*1.6),wingFore:['forward-breach','nose-dive','wing-trip'].includes(kind)?1.25:-.9,damageBoardUntil:['strike','beach-strike'].includes(kind)&&Math.max(pace,cause?.impactSpeed||0)>6.2?5:0,damageWingUntil:0},
  board:{age:0,phase:'air',settleAge:0,y:air?air.y:water+Math.max(0,s.height),...velocity(boardAlong,boardSide),vy:boardUp,pitch:wrap(boardPitch),roll:wrap(boardRoll),pitchRate:boardPitchRate,rollRate:boardRollRate,yawRate:kind==='tip-breach'?side*.65:(variation-.5)*.5,impact:false}
 };
}
function wingLanding(s){const f=s.fallMotion,b=s.board,yaw=f.heading,t=clamp((f.wingAge-(f.wingMoveAt??-10))/.7,0,1),blend=t*t*(3-2*t),side=f.wingFrom?f.wingFrom.side+(f.wingOffset-f.wingFrom.side)*blend:f.wingOffset,fore=f.wingFrom?f.wingFrom.fore+(f.wingFore-f.wingFrom.fore)*blend:f.wingFore;return {x:b.x+Math.cos(yaw)*side+Math.sin(yaw)*fore,z:b.z-Math.sin(yaw)*side+Math.cos(yaw)*fore};}
function wingContact(s){const f=s.fallMotion,p=wingLanding(s),dx=s.x-p.x,dz=s.z-p.z,c=Math.cos(f.heading+.22),a=Math.sin(f.heading+.22);return ((dx*c-dz*a)/2.2)**2+((dx*a+dz*c)/1.15)**2<1;}
function clearEquipment(x,z,s,world,sea,options={}){
 const p={x,z,heading:options.heading??s.board?.heading??s.heading,height:0,pitch:0,roll:0,speed:0};
 // Recovery must remain boardable at the lowest wave, not just at this crest.
 const surface=options.safe?-Math.max(0,s.config.swell):sea(x,z,s.time,s.config.swell,s.config),c=world.clearance(p,surface);
 return Math.hypot(x,z)<world.limit-3&&!c.hit&&(!options.safe||c.foilClearance>.35)&&!world.waterContacts?.sweep(p,p,s.time,0,()=>surface);
}
function wingClear(x,z,heading,side,fore,s,world,sea){
 const c=Math.cos(heading),sn=Math.sin(heading),cx=x+c*side+sn*fore,cz=z-sn*side+c*fore,ca=Math.cos(heading+.22),sa=Math.sin(heading+.22),surface=-Math.max(0,s.config.swell);
 for(const u of [-2.2,-1.1,0,1.1,2.2])for(const v of [-1,0,1]){
  const px=cx+ca*u+sa*v,pz=cz-sa*u+ca*v,p={x:px,z:pz,height:.1,heading,speed:0,radius:.35,length:.35,below:.2,above:.7};
  if(world.bedHeight(px,pz)>surface-.10||world.waterContacts?.sweep(p,p,s.time,0,()=>surface))return false;
 }
 return true;
}
function wingPlacement(x,z,heading,s,world,sea){
 const f=s.fallMotion;if(wingClear(x,z,heading,f.wingOffset,f.wingFore,s,world,sea))return {side:f.wingOffset,fore:f.wingFore};
 for(const radius of [2.8,4,5.5])for(let i=0;i<12;i++){const a=i*Math.PI/6,side=Math.cos(a)*radius,fore=Math.sin(a)*radius;if(wingClear(x,z,heading,side,fore,s,world,sea))return {side,fore};}
 return null;
}
function recoveryTarget(s,world,sea){
 const b=s.board,origin=s.fallMotion.resetOrigin||b;
 // Search outward from the accident, rather than sending gear back to launch
 // or toward a rider who may already have run well inland. Fine local rings
 // find the nearest usable water; wider rings handle broad shallow beaches.
 for(const [start,end,step] of [[0,24,.5],[26,120,2],[128,400,8],[425,world.limit*2,25]])for(let radius=start;radius<=end;radius+=step){
  const count=radius===0?1:48;for(let i=0;i<count;i++){
   const a=b.heading+Math.PI+i*Math.PI*2/count,x=origin.x+Math.sin(a)*radius,z=origin.z+Math.cos(a)*radius,heading=wrap(radius?a:b.heading);
   if(!clearEquipment(x,z,s,world,sea,{safe:true,heading}))continue;
   const wing=wingPlacement(x,z,heading,s,world,sea);if(wing)return {x,z,heading,wing};
  }
 }
 return null;
}
function disconnect(s){s.towing=false;if(s.fallMotion)s.fallMotion.leashesDetached=true;}
function requestRecovery(s){if(!s.board||!s.fallMotion)return;disconnect(s);const f=s.fallMotion;f.needsSafeReset=true;f.gearRecovered=false;f.gearCheckAt=0;f.resetOrigin={x:s.board.x,z:s.board.z};}
function recoverEquipment(s,dt,world,sea){
 const b=s.board,f=s.fallMotion;if(!b||!f)return;
 if(s.mode==='walking'||s.mode==='riding'||Math.hypot(s.x-b.x,s.z-b.z)>7)disconnect(s);
 if(f.wingAge<Math.max(5,f.damageWingUntil||0,f.damageBoardUntil||0)||f.wingAge<(f.gearCheckAt||0))return;
 f.gearCheckAt=f.wingAge+.5;
 const boardClear=clearEquipment(b.x,b.z,s,world,sea,{safe:true}),wing=boardClear?wingPlacement(b.x,b.z,f.heading,s,world,sea):null;
 if(!f.needsSafeReset&&boardClear&&wing){
  if(wing.side!==f.wingOffset||wing.fore!==f.wingFore){f.wingFrom={side:f.wingOffset,fore:f.wingFore};f.wingOffset=wing.side;f.wingFore=wing.fore;f.wingMoveAt=f.wingAge;}
  f.gearRecovered=f.wingCleared=true;return;
 }
 // A finished repair resets stranded equipment as a pair. Do not drag it
 // through rocks, keep a grounded motion pose, or pull it back with a leash.
 const target=recoveryTarget(s,world,sea);if(!target){disconnect(s);f.gearCheckAt=f.wingAge+2;return;}
 disconnect(s);Object.assign(b,{x:target.x,z:target.z,heading:target.heading,motion:null,recovery:null});
 Object.assign(f,{heading:target.heading,wingOffset:target.wing.side,wingFore:target.wing.fore,wingFrom:null,wingMoveAt:-10,wingInverted:false,needsSafeReset:false,resetOrigin:null,gearRecovered:true,wingCleared:true});
 s.emit('gear-reset',{x:b.x,z:b.z});
}
function stepBoard(s,dt,world,sea){
 const b=s.board,m=b?.motion;if(!m)return;
 m.age+=dt;
 // The leash limits separation with tension, rather than teleporting the board.
 const dx=s.x-b.x,dz=s.z-b.z,d=Math.hypot(dx,dz);
 if(s.towing&&!s.fallMotion?.leashesDetached&&d>3.0){const pull=Math.min(30,(d-3.0)*15);m.vx+=dx/d*pull*dt;m.vz+=dz/d*pull*dt;}
 const x=b.x+m.vx*dt,z=b.z+m.vz*dt,water=sea(x,z,s.time,s.config.swell,s.config);
 // Keep detached gear in navigable water, including its footprint at shore.
 const clear=Math.hypot(x,z)<world.limit-2&&[[0,0],[.75,0],[-.75,0],[0,1.05],[0,-1.05]].every(([a,c])=>world.bedHeight(x+a,z+c)<water-.35);
 if(clear){b.x=x;b.z=z;}else{m.vx*= -.22;m.vz*= -.22;}
 const surface=sea(b.x,b.z,s.time,s.config.swell,s.config);
 b.heading=wrap(b.heading+m.yawRate*dt);m.pitch=wrap(m.pitch+m.pitchRate*dt);m.roll=wrap(m.roll+m.rollRate*dt);
 if(m.phase==='air'){
  m.vy-=9.81*dt;m.y+=m.vy*dt;m.vx*=Math.exp(-dt*.28);m.vz*=Math.exp(-dt*.28);
  const pose={...b,height:m.y-surface,pitch:m.pitch,roll:m.roll};
  let lowest=Infinity;for(const a of [-.38,.38])for(const c of [-.9,1])lowest=Math.min(lowest,world.equipmentPoint([a,0,c],pose,surface).y);
  if(lowest<=surface+.025&&m.vy<0){
   m.phase='settling';m.impact=true;m.impactPitch=m.pitch;m.impactRoll=m.roll;
   s.emit('board-slap',{x:b.x,z:b.z,speed:Math.hypot(m.vx,m.vz,m.vy),vx:m.vx,vz:m.vz,kind:s.fallMotion?.kind});
   m.vy=Math.min(.85,-m.vy*.12);m.pitchRate*=.45;m.rollRate*=.45;
  }
 }else{
  m.settleAge+=dt;
  const righting=m.settleAge<.55?1.3:8;
  m.pitchRate+=(-wrap(m.pitch)*righting-m.pitchRate*4.8)*dt;
  m.rollRate+=(-wrap(m.roll)*righting-m.rollRate*4.8)*dt;
  // Buoyancy supports an edge or inverted deck while the submerged mast rights it.
  const draft=.02+Math.abs(Math.sin(m.pitch))*.65+Math.abs(Math.sin(m.roll))*.21+(Math.cos(m.pitch)*Math.cos(m.roll)<0?.12:0);
  m.vy+=((surface+draft-m.y)*32-m.vy*8)*dt;m.y+=m.vy*dt;
  const drag=Math.exp(-dt*2.5);m.vx*=drag;m.vz*=drag;m.yawRate*=drag;
  if(m.settleAge>4&&Math.abs(m.pitch)+Math.abs(m.roll)<.025)b.motion=null;
 }
}
function tipExposure(s,world,sea){
 const water=sea(s.x,s.z,s.time,s.config.swell,s.config);let exposure=-Infinity,side=0;
 for(const sign of [-1,1]){const p=world.equipmentPoint([sign*.74,-.882,.17],s,water),above=p.y-sea(p.x,p.z,s.time,s.config.swell,s.config);if(above>exposure){exposure=above;side=sign;}}
 return {exposure,side};
}
const api={launch,stepBoard,tipExposure,wingLanding,wingContact,clearEquipment,wingClear,recoveryTarget,recoverEquipment,disconnect,requestRecovery};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FoilWipeouts=api;
})(typeof globalThis!=='undefined'?globalThis:this);
