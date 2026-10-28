/* Other riders use the player's wind, foil, pump and fall simulation. */
(function(root){'use strict';
const core=typeof module!=='undefined'&&module.exports?require('./core.js'):root.FoilCore,{Session,clamp,wrap,sea}=core;
function create(world,course,index,seed=1){
 let state=seed>>>0;const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
 const s=new Session(1,{free:true,assist:true,traffic:true}),dir=random()<.5?1:-1,along=(random()-.5)*course.long*1.3,offset=(random()-.5)*course.short*.5;
 Object.assign(s,{x:course.cx+along*Math.sin(course.axis)+offset*Math.cos(course.axis),z:course.cz+along*Math.cos(course.axis)-offset*Math.sin(course.axis),heading:wrap(course.axis+(dir<0?Math.PI:0)),wingSide:-dir,wingAngle:-dir*.75,wingTarget:-dir*.75,standing:true,standAmount:1});s.lastSafe={x:s.x,z:s.z};s.lastSea=sea(s.x,s.z,0,s.config.swell,s.config);s.updateSafety();
 const rider={s,course,dir,turn:null,age:random()*15,attemptAt:8+random()*13,fallAt:25+random()*25,fallAge:0,pumpAt:random()*4,expert:false,skill:.45+random()*.4,renderAngle:s.wingAngle,seed,phase:random()*6.28};
 function balance(target=.4){return clamp((target-s.height)*2-s.vertical*1.7+(s.assist&&s.height>.10?0:(90*9.81/(.5*1025*.18*Math.max(3,s.speed)**2)-.3152)/.576),-.8,.8);}
 function beginTurn(){const relative=wrap(s.heading-s.windFrom),side=Math.sign(Math.sin(relative))||rider.dir,dx=s.x-rider.course.cx,dz=s.z-rider.course.cz,down=dx*-Math.sin(s.windFrom)+dz*-Math.cos(s.windFrom),tack=rider.expert&&down>rider.course.short*.25&&s.speed>4.3;rider.turn={start:s.heading,sign:side*(tack?-1:1),side,age:0,tack};rider.dir=-rider.dir;}
 function update(dt,player,expert){rider.expert=expert;rider.age+=dt;s.time=player.time;Object.assign(s.config,player.config);s.sampleWind();
  if(s.mode!=='sailing'){
   rider.fallAge+=dt;s.controls={steer:0,balance:0,trim:0};
   if((s.mode==='swimming'||s.mode==='walking')&&rider.fallAge>3.2&&s.board){
    const distance=Math.hypot(s.board.x-s.x,s.board.z-s.z),boardDeep=world.bedHeight(s.board.x,s.board.z)<-1.3;
    if(distance<.42&&boardDeep&&s.boardAgain()){s.stand();rider.age=0;rider.attemptAt=7+random()*10;rider.fallAt=26+random()*24;rider.turn=null;}
    else{const target=boardDeep||distance>3.1?{x:s.board.x,z:s.board.z}:{x:rider.course.cx,z:rider.course.cz};s.heading=Math.atan2(target.x-s.x,target.z-s.z);s.controls.balance=-.9;s.towing=!boardDeep&&distance<3.8;}
   }
   s.step(dt);s.drain();return;
  }
  rider.fallAge=0;if(!s.standing)s.stand();
  const c=rider.course,along=(s.x-c.cx)*Math.sin(c.axis)+(s.z-c.cz)*Math.cos(c.axis),dx=s.x-player.x,dz=s.z-player.z,playerNear=Math.hypot(dx,dz)<28;
  const ahead=world.bedHeight(s.x+Math.sin(s.heading)*Math.max(18,s.speed*4),s.z+Math.cos(s.heading)*Math.max(18,s.speed*4))>-1.7;
  if(!rider.turn&&(rider.dir*along>c.long*.77||ahead))beginTurn();
  let targetTrim=rider.expert?.68:.58+Math.sin(rider.age*.35+rider.phase)*.055;
  if(rider.turn){const t=rider.turn;t.age+=dt;const delta=Math.abs(wrap(s.heading-t.start));s.controls.steer=-t.sign*.9;
   if(delta>.8&&delta<2.1){targetTrim=.04;s.setWingPosition(delta>1.4?t.side*.76:0);}else if(delta>=2.1){s.setWingPosition(t.side*.76);if(s.wingSide!==t.side||s.wingBlocked)targetTrim=.04;}
   if(delta>2.8||t.age>15){rider.turn=null;s.controls.steer=0;}
  }else{
   const tx=c.cx+rider.dir*c.long*Math.sin(c.axis),tz=c.cz+rider.dir*c.long*Math.cos(c.axis),desired=Math.atan2(tx-s.x,tz-s.z),relative=wrap(desired-s.windFrom),side=Math.sign(Math.sin(relative))||rider.dir,heading=s.windFrom+side*clamp(Math.abs(relative),.98,2.15);
   s.controls.steer=clamp(-wrap(heading-s.heading)*2.8,-.72,.72);s.setWingPosition(-side*.76);if(s.wingSide!==-side||s.wingBlocked)targetTrim=.03;
  }
  // Predict a close pass, then bend the reach around the player. No hiding,
  // shrinking or route resets when a rider comes close to the camera.
  const forward=-(dx*Math.sin(s.heading)+dz*Math.cos(s.heading)),right=-(dx*Math.cos(s.heading)-dz*Math.sin(s.heading)),avoidRange=22+s.speed*3;
  if(forward>0&&forward<avoidRange&&Math.abs(right)<15&&!ahead){const away=right>=0?1:-1,amount=(1-forward/avoidRange)*(1-Math.abs(right)/15);s.controls.steer=clamp(s.controls.steer+away*amount*1.5,-.9,.9);if(forward<10&&Math.abs(right)<5)targetTrim=Math.min(targetTrim,.16);}
  if(Math.sin(s.heading-s.windFrom)*s.wingSide>.12)targetTrim=.03;
  s.controls.trim=targetTrim;
  const attempt=rider.expert||rider.age>rider.attemptAt;
  s.controls.balance=attempt?balance(rider.expert?.4:.26)+(!rider.expert?Math.sin(rider.age*2.1+rider.phase)*(.14+(1-rider.skill)*.13):0):-.38;
  // Learners sometimes over-correct. They fall through the same physics and
  // recover at their board, rather than disappearing and resetting a route.
  if(!rider.expert&&rider.age>rider.fallAt&&s.foiling)s.controls.balance=.96;
  if(attempt&&s.speed>1.2&&s.speed<4.5&&!rider.turn&&s.stamina>.3){rider.pumpAt-=dt;if(!s.pumpHeld&&rider.pumpAt<=0)s.pumpDown();if(s.pumpHeld&&s.pumpCharge>(rider.expert?.48:.26+random()*.25)){s.pumpUp();rider.pumpAt=rider.expert?.65:1.1+random()*.6;}}
  else if(s.pumpHeld)s.pumpUp();
  if(ahead&&s.speed<.8)s.controls.trim=0;
  s.step(dt);s.drain();
 }
 return Object.assign(rider,{update});
}
root.FoilTrafficPilot={create};if(typeof module!=='undefined'&&module.exports)module.exports=root.FoilTrafficPilot;
})(globalThis);
