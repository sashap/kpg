/* Foil Academy: deterministic, deliberately forgiving teaching model. SI units. */
(function(root){
'use strict';
const PI=Math.PI,TAU=PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),mix=(a,b,t)=>a+(b-a)*t;
const world=typeof module!=='undefined'&&module.exports?require('./world.js'):root.FoilWorld;const {ISLANDS}=world;
const horses=typeof module!=='undefined'&&module.exports?require('./horses.js'):root.FoilHorses;
const {LESSONS}=typeof module!=='undefined'&&module.exports?require('./lessons.js'):root.FoilLessons;
// The renderer generates its wave shader from these same components. The
// final two crossing trains add short, irregular chop without raising the cap.
const WAVE_DIRECTION=Math.atan2(.115,.08);
const WAVES=[[.115,.08,1.35,.60,0,0],[-.17,.14,1.87,.26,0,0],[.31,.21,2.2,.14,0,0],[.53,.11,2.30,.42,1,.8],[-.29,.47,2.33,.28,1,2.1],[.09,-.62,2.48,.18,1,1.3],[-.43,-.37,2.36,.12,1,3.4]];
function sea(x,z,t,amp=.1,shape={}){
 if(amp===0)return 0;
 const scale=45/(shape.waveLength??45),angle=(shape.waveDirection??WAVE_DIRECTION)-WAVE_DIRECTION,c=Math.cos(angle),s=Math.sin(angle),px=(x*c-z*s)*scale,pz=(x*s+z*c)*scale,time=t*Math.sqrt(scale),chop=shape.chop??0;
 let height=0;for(const [kx,kz,omega,weight,short,phase] of WAVES)height+=Math.sin(px*kx+pz*kz-time*omega+phase)*weight*(short?chop*.5:1-chop*.5);
 return amp*height;
}
function normalizeConditions(values={},base={}){
 const result={wind:8.2,swell:.14,gust:.12,windFrom:0,cloud:.28,sun:1,waveLength:45,chop:0,waveDirection:WAVE_DIRECTION,...base};
 for(const [key,min,max] of [['wind',0,14.5],['swell',0,.6],['gust',0,.35],['cloud',0,1],['sun',0,1],['waveLength',4,80],['chop',0,1]])if(Number.isFinite(values[key]))result[key]=clamp(values[key],min,max);
 for(const key of ['windFrom','waveDirection'])if(Number.isFinite(values[key]))result[key]=wrap(values[key]);
 result.swell=Math.min(result.swell,result.waveLength*.07);return result;
}
function freshStats(){return {taxi:0,touchGoes:0,footSwitches:0,sTurns:0,carves:0,waveTime:0,bestGlide:0,pops:0,frontsideAirs:0,backsideAirs:0,airTacks:0,spins:0,backflips:0,frontflips:0,airTime:0,powered:0,flightTime:0,bestFlight:0,stable:0,landings:0,upwind:0,pumps:0,jibes:0,tacks:0,links:0,gates:0,crashes:0,maxSpeed:0};}
class Session{
 constructor(lesson=0,options={}){this.lesson=clamp(Math.floor(lesson),0,LESSONS.length-1);this.free=!!options.free;this.assist=options.assist!==false;this.config=normalizeConditions(options.conditions,{...LESSONS[this.lesson],windFrom:world.location?.windFrom??0});this.time=0;this.score=0;this.stats=freshStats();this.complete=false;this.events=[];this.discoveries=new Set();this.controls={steer:0,balance:0,trim:0};this.gateIndex=0;this.horses=horses.spawn(world);this.horse=null;this.resetRider();if(!Number.isFinite(options.conditions?.waveDirection)){if(this.config.id==='wave-riding')this.config.waveDirection=this.heading;if(this.config.id==='downwind-gliding')this.config.waveDirection=wrap(this.config.windFrom+PI);this.lastSea=sea(this.x,this.z,this.time,this.config.swell,this.config);this.updateSafety();}this.makeGate();}
 resetRider(){if(this.horse){this.horse.speed=0;this.horse=null;}this.resetSkills();this.mode='sailing';this.fallMotion=null;this.entryTime=0;this.board=null;this.towing=false;this.jumpTime=0;this.walkCycle=0;this.swimPhase=0;this.swimVelocity=0;this.swimEffort=0;this.walkY=0;this.x=0;this.z=0;this.heading=wrap(this.config.windFrom+PI/2);this.speed=0;this.height=0;this.vertical=0;this.pitch=0;this.roll=0;this.standing=false;this.standAmount=0;this.wingSide=-1;if(world.geography){let best=-Infinity;for(const side of [-1,1])for(const offset of [0,-.2,.2,-.4,.4]){const h=this.config.windFrom+side*(PI/2+offset);let reach=0;for(let r=10;r<440;r+=10){if(world.bedHeight(Math.sin(h)*r,Math.cos(h)*r)>-1.2)break;reach=r;}const score=reach-Math.abs(offset)*24;if(score>best){best=score;this.wingSide=-side;this.heading=wrap(h);}}}this.swapTime=0;this.flight=0;this.foiling=false;this.landingPending=false;this.breachTime=0;this.fallTime=0;this.pumpHeld=false;this.pumpCharge=0;this.pumpCooldown=0;this.pumpPulse=0;this.stamina=1;this.turn=null;this.trim=0;this.balance=0;this.steer=0;this.wind=this.config.wind;this.windFrom=this.config.windFrom;this.apparent=this.wind;this.angle=Math.abs(wrap(this.heading-this.windFrom));this.lift=0;this.drive=0;this.status='Kneeling';this.fallReason='';this.recoveryPoint=null;this.lastCollision=null;this.lastSafe={x:0,z:0};this.safety=world.clearance(this,sea(0,0,this.time,this.config.swell,this.config));this.shoreAhead=false;this.windTrend=0;this.lastSea=sea(this.x,this.z,this.time,this.config.swell,this.config);this.controls={steer:0,balance:0,trim:0};}
 resetSkills(){
  this.wingTarget=0;this.wingAngle=0;this.wingBlocked=false;this.lateralSpeed=0;this.wingForce=null;this.stance=1;this.footSwitch=null;this.flagged=false;this.popHeld=false;this.popCharge=0;this.popCooldown=0;this.air=null;this.landingCheck=null;this.touchGo=null;this.sTurn=null;this.carve=null;this.glide=0;this.waveDrive=0;this.lastTrick='';
 }
 goals(){return this.config.goals.map(g=>({...g,value:Math.min(g.goal,this.stats[g.metric]||0),done:(this.stats[g.metric]||0)>=g.goal}));}
 checkComplete(){if(!this.complete&&!this.free&&this.goals().every(g=>g.done)){this.complete=true;this.emit('complete');}}
 award(metric,label,points=100){this.stats[metric]++;this.score+=points;this.lastTrick=label;this.emit('skill',{metric,label,points});}
 switchFeet(){
  if(this.mode!=='sailing'||this.air||!this.standing||this.footSwitch||this.popHeld)return false;
  if(Math.abs(this.balance)>.32||Math.abs(this.steer)>.32){this.emit('hint',{text:'Center body pressure and steering before switching feet.'});return false;}
  this.footSwitch={from:this.stance,to:-this.stance,age:0,valid:this.foiling&&this.height>.18&&this.height<.68,settled:0};this.emit('footstep');return true;
 }
 toggleFlag(){if(this.mode!=='sailing'||!this.standing||this.air||this.popHeld)return false;this.flagged=!this.flagged;this.emit('flag',{flagged:this.flagged});return true;}
 popReady(){return this.mode==='sailing'&&!this.air&&this.standing&&this.foiling&&this.speed>=5&&this.height>.18&&this.height<.72&&this.stamina>=.28&&this.popCooldown===0&&!this.footSwitch&&!this.flagged&&this.trim>.38&&this.wingForces().backwind<.2&&this.safety.foilClearance>1.5&&!this.shoreAhead;}
 popDown(){if(this.popHeld)return false;if(!this.popReady()){this.emit('hint',{text:'For a pop: fly level above 10 knots, power the wing, and leave deep water beneath the foil.'});return false;}this.popHeld=true;this.popCharge=0;return true;}
 popUp(){
  if(!this.popHeld)return false;this.popHeld=false;const charge=this.popCharge;this.popCharge=0;
  if(!this.popReady()||charge<.15||charge>1.2){this.emit('hint',{text:'Hold Pop for 0.4–0.7 seconds, then release while flying level.'});return false;}
  const quality=clamp(1-Math.abs(charge-.56)/.7,.15,1),water=sea(this.x,this.z,this.time,this.config.swell,this.config);
  this.air={age:0,y:water+this.height,vy:5.1+quality*2.7,vx:Math.sin(this.heading)*this.speed,vz:Math.cos(this.heading)*this.speed,startHeading:this.heading,startStance:this.stance,startWing:this.wingSide,yaw:0,pitch:0,yawRate:0,pitchRate:0,peak:0,cleared:false,crossedUpwind:false,swapped:false};
  this.stamina-=.25;this.popCooldown=2;this.foiling=false;this.flight=0;this.turn=null;this.touchGo=null;this.sTurn=this.carve=null;this.landingPending=false;this.landingCheck=null;this.pumpHeld=false;this.pumpCharge=0;this.emit('pop',{quality});return true;
 }
 waveEnergy(){
  if(!this.foiling||this.config.swell<.035)return 0;
  const f={x:Math.sin(this.heading),z:Math.cos(this.heading)},eps=.3,h1=sea(this.x+f.x*eps,this.z+f.z*eps,this.time,this.config.swell,this.config),h0=sea(this.x-f.x*eps,this.z-f.z*eps,this.time,this.config.swell,this.config),downhill=Math.max(0,(h0-h1)/(2*eps));
  const alignment=clamp(Math.cos(this.heading-this.config.waveDirection),0,1),phaseSpeed=9.64*Math.sqrt(this.config.waveLength/45),capture=clamp(1-Math.abs(this.speed-phaseSpeed)/(phaseSpeed*.85),.15,1);
  // A teaching approximation of energy taken from a moving wave face. It
  // depends on the same local slopes and propagation used by the water mesh.
  return Math.min(2.2,downhill*22)*alignment*capture;
 }
 trackSkills(dt,wasFoiling,previousFlight,oldHeading){
  if(this.standing&&!this.foiling&&this.height<.10&&this.speed>2&&this.trim>.25)this.stats.taxi+=dt;
  if(wasFoiling&&!this.foiling&&previousFlight>=2&&this.mode==='sailing')this.touchGo={stage:'descending',time:this.time};
  if(this.touchGo){const t=this.touchGo;if(this.time-t.time>15||this.mode!=='sailing')this.touchGo=null;else if(t.stage==='descending'&&this.height<=.04&&this.vertical>-.85)t.stage='wet';else if(t.stage==='wet'&&this.foiling&&this.flight>=1){this.award('touchGoes','Touch-and-go',100);this.touchGo=null;}}
  if(this.footSwitch){const f=this.footSwitch;f.age+=dt;f.valid=f.valid&&this.foiling&&this.height>.13&&this.height<.78;if(f.age>=.8){this.stance=f.to;if(this.foiling&&Math.abs(this.steer)<.35&&Math.abs(this.balance)<.4)f.settled+=dt;else f.valid=false;if(f.settled>=1||!f.valid){if(f.valid)this.award('footSwitches','Foot switch · settled',100);this.footSwitch=null;}}}
  if(this.foiling){
   const direction=Math.abs(this.steer)>.25?Math.sign(this.steer):0,delta=wrap(this.heading-oldHeading);
   if(direction){if(!this.sTurn)this.sTurn={direction,angle:0,first:0,credited:false};const t=this.sTurn;if(direction!==t.direction){t.direction=direction;t.angle=0;t.credited=false;}t.angle+=Math.abs(delta);if(t.angle>.46&&!t.credited){t.credited=true;if(t.first===-direction){this.award('sTurns','Linked S-turn',140);t.first=0;}else t.first=direction;}
    if(!this.carve||this.carve.direction!==direction)this.carve={direction,angle:0,time:0};this.carve.angle+=Math.abs(delta);this.carve.time+=dt;
   }else if(this.carve){if(this.carve.angle>.87&&this.carve.time>1.1&&this.carve.time<8&&this.height>.16&&this.height<.75)this.award('carves','Carve · clean exit',120);this.carve=null;}
   if(this.flagged&&this.waveDrive>.10&&Math.cos(this.heading-this.config.waveDirection)>.55)this.stats.waveTime+=dt;
   if(this.flagged&&this.angle>2.45){this.glide+=dt;this.stats.bestGlide=Math.max(this.stats.bestGlide,this.glide);}else this.glide=0;
  }else{this.sTurn=this.carve=null;this.glide=0;}
  if(this.landingCheck){const l=this.landingCheck;if(!this.foiling||this.height>.8||Math.abs(this.roll)>.35){this.landingCheck=null;}else if((l.time+=dt)>=1){for(const [metric,label,points] of l.awards)this.award(metric,label,points);this.landingCheck=null;}}
 }
 stepAir(dt){
  const a=this.air,previous={x:this.x,z:this.z,heading:this.heading,height:this.height,pitch:0,roll:0,air:{...a}};
  a.age+=dt;this.trim=mix(this.trim,clamp(this.controls.trim,0,1),1-Math.exp(-dt*5));
  a.yawRate=mix(a.yawRate,-clamp(this.controls.steer,-1,1)*5.2,1-Math.exp(-dt*12));a.pitchRate=mix(a.pitchRate,-clamp(this.controls.balance,-1,1)*5.5,1-Math.exp(-dt*12));
  a.yaw+=a.yawRate*dt;a.pitch+=a.pitchRate*dt;
  // Coached mode brakes and gently levels only within 20 degrees of a valid
  // landing orientation. There is no automatic completion of a trick.
  if(this.assist&&Math.abs(this.controls.balance)<.08&&Math.abs(wrap(a.pitch))<.35)a.pitch=mix(a.pitch,Math.round(a.pitch/TAU)*TAU,1-Math.exp(-dt*8));
  if(this.assist&&Math.abs(this.controls.steer)<.08&&Math.abs(a.yaw-Math.round(a.yaw/PI)*PI)<.28)a.yaw=mix(a.yaw,Math.round(a.yaw/PI)*PI,1-Math.exp(-dt*7));
  const oldRelative=wrap(this.heading-this.windFrom);this.heading=wrap(a.startHeading+a.yaw);const relative=wrap(this.heading-this.windFrom);if(Math.sign(Math.sin(oldRelative))!==Math.sign(Math.sin(relative))&&Math.cos(relative)>0)a.crossedUpwind=true;
  a.vy-=dt*(9.81-2.1*this.trim);a.y+=a.vy*dt;a.vx*=Math.exp(-dt*.07);a.vz*=Math.exp(-dt*.07);this.x+=a.vx*dt;this.z+=a.vz*dt;
  const surface=sea(this.x,this.z,this.time,this.config.swell,this.config);this.height=a.y-surface;this.vertical=a.vy;this.pitch=0;this.roll=0;this.angle=Math.abs(relative);a.peak=Math.max(a.peak,this.height);a.cleared=a.cleared||this.height>1.08;this.stats.airTime+=dt;
  const collision=world.sweep(previous,this,(x,z)=>sea(x,z,this.time,this.config.swell,this.config));if(collision||Math.hypot(this.x,this.z)>world.limit){this.crash('The landing area is not clear. Pop farther from shore and obstacles.',this.lastSafe);return;}
  this.updateSafety();this.status='Airborne';
  if(a.age>.15&&a.vy<0&&this.height<=.76){
   const pitchError=Math.abs(wrap(a.pitch)),yawError=Math.abs(a.yaw-Math.round(a.yaw/PI)*PI),side=-Math.sign(Math.sin(relative))||this.wingSide,rotating=Math.abs(a.pitchRate)>1.7||Math.abs(a.yawRate)>1.7;
   if(pitchError>.42||yawError>.45||rotating||side!==this.wingSide){this.crash(side!==this.wingSide?'Land with the wing on the new side. Ease and transfer during the turn.':'Unfinished rotation. Center the air controls before the foil re-enters the water.');return;}
   const awards=[];
   if(a.cleared){
    if(Math.abs(a.pitch)>TAU-.42)awards.push(a.pitch<0?['backflips','Backflip · landed',700]:['frontflips','Frontflip · landed',750]);
    else if(Math.abs(a.yaw)>TAU-.45)awards.push(['spins','360° · landed',600]);
    else if(Math.abs(a.yaw)>PI-.45){const front=Math.sign(a.yaw)*a.startStance<0;awards.push(front?['frontsideAirs','Frontside air · landed',350]:['backsideAirs','Backside air · landed',400]);if(a.crossedUpwind&&a.swapped&&this.wingSide!==a.startWing)awards.push(['airTacks','Air tack · landed',450]);}
    else if(Math.abs(a.yaw)<.45&&Math.abs(a.pitch)<.42)awards.push(['pops','Straight pop · landed',180]);
   }
   this.air=null;this.height=.62;this.vertical=-.25;this.pitch=.024;this.roll=0;this.speed*=.84;this.foiling=this.speed>3.25;this.flight=0;this.breachTime=0;this.lastSea=surface;this.controls.steer=0;this.controls.balance=0;this.steer=this.balance=0;this.landingCheck={time:0,awards};this.emit('airlanding',{height:a.peak});
  }
 }
 setConditions(values){
  const before=sea(this.x,this.z,this.time,this.config.swell,this.config),oldDirection=this.config.windFrom;
  this.config=normalizeConditions(values,this.config);
  // Rebase the surface history so changing wave height cannot inject a false
  // one-frame heave impulse. Preserve ride height, velocity and session progress.
  this.lastSea=sea(this.x,this.z,this.time,this.config.swell,this.config);
  if(this.mode==='falling')this.walkY+=this.lastSea-before;
  if(this.config.windFrom!==oldDirection)this.turn=null;
  this.sTurn=this.carve=this.touchGo=this.landingCheck=null;
  this.sampleWind();this.windTrend=0;this.updateSafety();
 }
 sampleWind(){
  this.windFrom=wrap(this.config.windFrom+.06*this.config.gust*Math.sin(this.time*.031));
  this.wind=this.config.wind*(1+this.config.gust*(.65*Math.sin(this.time*.32+this.x*.013)+.35*Math.sin(this.time*.71-this.z*.009)));
  this.angle=Math.abs(wrap(this.heading-this.windFrom));
  this.apparent=this.wingForces().apparent;
 }
 emit(type,data={}){this.events.push({type,...data});}
 drain(){return this.events.splice(0);}
 stand(){if(this.mode!=='sailing')return this.boardAgain();if(this.fallTime>0)return false;this.standing=true;this.emit('stand');return true;}
 recover(){this.resetRider();this.makeGate();this.emit('recover');}
 wingForces(){
  // Board-relative apparent air velocity includes BOTH forward motion and
  // sideslip. Right is (-cos heading, sin heading) in our west/north world.
  const relative=wrap(this.heading-this.windFrom),forward=this.air?this.air.vx*Math.sin(this.heading)+this.air.vz*Math.cos(this.heading):this.speed;
  const lateral=this.air?-this.air.vx*Math.cos(this.heading)+this.air.vz*Math.sin(this.heading):(this.lateralSpeed||0);
  const across=this.wind*Math.sin(relative)+lateral,ahead=this.wind*Math.cos(relative)+forward,apparent=Math.hypot(across,ahead);
  const incidence=Math.atan2(Math.abs(across),ahead),exposure=clamp((incidence-.20)/.70,0,1),sheet=this.flagged?0:clamp(this.trim,0,1);
  const outboard=Math.sin(Math.abs(this.wingAngle)*PI/2),heightDrive=.84+.16*outboard;
  // Smooth through overhead and through the wind axis, rather than flipping a
  // binary tack multiplier. Positive pad angle puts the wing to the rider's
  // right (local -X). Power therefore belongs to the DOWNWIND side.
  const backwind=clamp(this.wingAngle*across/Math.max(.5,apparent*.32),0,1);
  const oversheet=1-clamp((sheet-.76)/.24,0,1)*.62,polar=clamp((Math.abs(relative)-.55)/.6,0,1)*(.3+.7*Math.sin(Math.abs(relative)*.92));
  const q=.037*apparent*apparent,flowAcross=Math.abs(across)/Math.max(.01,apparent),flowAhead=ahead/Math.max(.01,apparent),handover=this.swapTime>0?.25:1;
  // A wing also catches wind arriving from astern. Lift-only propulsion
  // vanished at exactly 180 degrees, even at rest. This pressure term uses
  // apparent flow, so the push fades at wind speed and becomes drag beyond it.
  const running=Math.max(0,-Math.cos(relative))**4;
  const pressure=-flowAhead*running*(flowAhead<0?1.05:.40)*heightDrive;
  const drive=q*sheet*handover*((1-backwind)*oversheet*polar*flowAcross*heightDrive-backwind*exposure*.48*(.24+.76*Math.max(0,flowAhead))+pressure*(1-.65*backwind));
  const side=-q*sheet*exposure*(across/Math.max(.01,apparent))*(.055*(1-backwind)*outboard+.52*backwind);
  const lift=q*sheet*exposure*(1-outboard)*.075*(1-backwind);
  const newtons=.5*1.225*5*apparent*apparent*(.025+.90*sheet*sheet*exposure);
  return {forward:drive,lateral:side,upward:lift,backwind,apparent,incidence,newtons,heightDrive};
 }
 wingLoadInfo(){const f=this.wingForces(),limit=90;return {newtons:f.newtons,limit,ratio:clamp(f.newtons/limit,0,2),light:f.newtons<=limit};}
 setWingPosition(value){if(this.mode!=='sailing'||!Number.isFinite(value))return;this.wingTarget=clamp(value,-1,1);}
 updateWingPosition(dt){
  if(this.mode!=='sailing')return;let target=this.wingTarget;const changing=Math.abs(target)>.10&&Math.sign(target)!==this.wingSide;
  this.wingBlocked=changing&&!this.wingLoadInfo().light;
  if(changing){if(this.wingBlocked||!this.standing||this.swapTime>0)target=this.wingSide*.04;else if(Math.abs(this.wingAngle)<.16){const requested=this.wingTarget;this.swapWing();this.wingTarget=requested;}else target=0;}
  this.wingAngle=mix(this.wingAngle,target,1-Math.exp(-dt*9));
 }
 swapWing(){if(this.mode!=='sailing'||!this.standing||this.fallTime>0||this.swapTime>0)return false;if(!this.wingLoadInfo().light){this.emit('hint',{text:'The wing is still loaded. Move up to the green arc or turn into the wind before crossing to the other side.'});return false;}this.wingSide*=-1;this.wingTarget=this.wingSide*.72;this.swapTime=this.air?.30:.65;if(this.air)this.air.swapped=true;this.emit('swap');return true;}

 pumpDown(){if(this.mode!=='sailing')return this.toggleTow();if(!this.standing||this.fallTime>0||this.pumpHeld||this.air||this.popHeld)return false;this.pumpHeld=true;this.pumpCharge=0;return true;}
 pumpUp(){if(!this.pumpHeld)return 0;this.pumpHeld=false;const duration=this.pumpCharge;const quality=clamp(1-Math.abs(duration-.48)/.42,0,1)*clamp(1-this.pumpCooldown/.55,0,1);this.pumpCharge=0;this.pumpCooldown=.55;if(this.fallTime>0||this.stamina<.18)return 0;this.stamina=Math.max(0,this.stamina-.16);const efficiency=quality*(this.flagged?.65:this.trim>.2?1:.5)*(this.angle>.7?1:.15);this.speed+=efficiency*.85;this.vertical+=efficiency*.10;this.pumpPulse=quality;this.emit('pump',{quality});if(quality>.65&&(this.trim>.2||this.flagged)&&this.angle>.7){this.stats.pumps++;this.score+=25;}return quality;}
 crash(reason,escape=null){
  if(this.mode!=='sailing'||this.fallTime>0)return;
  const airborne=this.air;this.air=null;this.popHeld=false;this.popCharge=0;this.footSwitch=null;this.flagged=false;this.landingCheck=this.touchGo=this.sTurn=this.carve=null;this.stats.crashes++;this.fallReason=reason;this.fallTime=2.4;
  const forward={x:Math.sin(this.heading),z:Math.cos(this.heading)},right={x:-Math.cos(this.heading),z:Math.sin(this.heading)},pace=this.speed;
  let water=sea(this.x,this.z,this.time,this.config.swell,this.config);
  // A swept strike normally happens offshore. Repair only an already-invalid
  // position (e.g. loading inside land), never carry a normal fall back to launch.
  if(world.bedHeight(this.x,this.z)>water+.1){this.x=this.lastSafe.x;this.z=this.lastSafe.z;water=sea(this.x,this.z,this.time,this.config.swell,this.config);}
  if(Math.hypot(this.x,this.z)>world.limit-2){const k=(world.limit-4)/Math.hypot(this.x,this.z);this.x*=k;this.z*=k;escape={x:0,z:0};}
  const along=pace*.45-this.balance*1.5,side=this.steer*1.8;
  let vx=forward.x*along+right.x*side,vz=forward.z*along+right.z*side;
  if(escape){const dx=escape.x-this.x,dz=escape.z-this.z,d=Math.hypot(dx,dz);if(d>.1){vx=dx/d*2.8;vz=dz/d*2.8;}}
  this.board={x:this.x,z:this.z,heading:this.heading};this.mode='falling';this.towing=true;
  this.walkY=(airborne?airborne.y:water+Math.max(0,this.height))+.98;
  this.fallMotion={age:0,vx,vz,vy:airborne?airborne.vy:1.0+Math.max(0,this.vertical)*.7,pitch:airborne?wrap(airborne.pitch):-this.pitch,roll:this.roll,pitchRate:clamp(.8-this.balance*3,-2.2,2.6),rollRate:this.steer*2.3};
  this.standing=false;this.landingPending=false;this.pumpHeld=false;this.pumpCharge=0;this.controls={steer:0,balance:0,trim:0};this.wingTarget=this.wingAngle=0;this.wingBlocked=false;this.trim=0;this.speed=0;this.lateralSpeed=0;this.height=0;this.vertical=0;this.flight=0;this.foiling=false;this.turn=null;this.status='Falling';this.emit('fall',{reason});
 }
 advanceFall(dt){
  const f=this.fallMotion;f.age+=dt;this.fallTime=Math.max(0,this.fallTime-dt);
  const x=this.x+f.vx*dt,z=this.z+f.vz*dt,water=sea(x,z,this.time,this.config.swell,this.config);
  if(world.bedHeight(x,z)<water-.25&&Math.hypot(x,z)<world.limit-2){this.x=x;this.z=z;}else{f.vx*= -.2;f.vz*= -.2;}
  f.vy-=9.81*dt;this.walkY+=f.vy*dt;f.vx*=Math.exp(-dt*.25);f.vz*=Math.exp(-dt*.25);f.pitch+=f.pitchRate*dt;f.roll+=f.rollRate*dt;
  const surface=sea(this.x,this.z,this.time,this.config.swell,this.config);
  if((f.vy<0&&this.walkY<=surface+.16)||this.fallTime===0){this.mode='swimming';this.fallTime=0;this.walkY=surface;this.entryTime=.45;this.jumpTime=0;this.swimVelocity=this.swimEffort=0;this.balance=this.steer=0;this.swimPhase=0;this.status='Swimming';this.emit('splashdown',{speed:Math.abs(f.vy),x:this.x,z:this.z});}
 }
 makeGate(){const a=this.heading+(this.gateIndex%2?.23:-.23);this.gate={x:this.x+Math.sin(a)*65,z:this.z+Math.cos(a)*65,heading:a};if(Math.hypot(this.gate.x,this.gate.z)>world.limit*.70833){const h=Math.atan2(-this.x,-this.z);this.gate={x:this.x+Math.sin(h)*70,z:this.z+Math.cos(h)*70,heading:h};}for(let i=0;i<12&&(world.bedHeight(this.gate.x,this.gate.z)>-2||Math.hypot(this.gate.x,this.gate.z)>world.limit*.89583);i++){const h=a+(i+1)*PI/6;this.gate={x:this.x+Math.sin(h)*55,z:this.z+Math.cos(h)*55,heading:h};}if(world.bedHeight(this.gate.x,this.gate.z)>-2)this.gate={x:0,z:0,heading:Math.atan2(-this.x,-this.z)};}
 horseAction(){return this.mode==='riding'?horses.dismount(this,world):horses.mount(this);}
 nearbyHorse(){return horses.nearby(this);}
 dismount(){
  if(this.mode==='riding')return horses.dismount(this,world);
  if(this.air){this.crash('Released the board in the air. Swim back and climb aboard.');return true;}
  if(this.mode!=='sailing'||this.fallTime>0)return false;
  this.resetSkills();this.board={x:this.x,z:this.z,heading:this.heading};this.mode='swimming';this.towing=true;this.jumpTime=.85;this.walkCycle=0;this.swimPhase=0;this.swimVelocity=0;this.swimEffort=0;this.foiling=false;this.flight=0;this.turn=null;this.landingPending=false;this.standing=false;this.speed=0;this.height=0;this.trim=0;this.pumpHeld=false;this.controls={steer:0,balance:0,trim:0};
  const side=this.heading+PI/2;this.x+=Math.sin(side)*1.6;this.z+=Math.cos(side)*1.6;this.walkY=sea(this.x,this.z,this.time,this.config.swell,this.config);this.emit('dismount');return true;
 }
 toggleTow(){if(this.mode!=='swimming'||!this.board)return false;if(this.towing){this.towing=false;this.emit('hint',{text:'Board left here. Swim back within 4 m to tow it or climb aboard.'});return true;}if(Math.hypot(this.x-this.board.x,this.z-this.board.z)>4){this.emit('hint',{text:'Swim back to your board to pick up its leash.'});return false;}this.towing=true;this.emit('hint',{text:'Towing the board. It stays afloat when you walk ashore.'});return true;}
 boardAgain(){if((this.mode!=='swimming'&&this.mode!=='walking')||!this.board||Math.hypot(this.x-this.board.x,this.z-this.board.z)>3.2)return false;const b=this.board;if(world.clearance({...b,height:0,pitch:0,roll:0},sea(b.x,b.z,this.time,this.config.swell,this.config)).hit){this.emit('hint',{text:'Tow the board into deeper water before climbing on.'});return false;}this.mode='sailing';this.lateralSpeed=0;this.fallMotion=null;this.entryTime=0;this.fallReason='';this.swimVelocity=this.swimEffort=0;this.x=b.x;this.z=b.z;this.heading=b.heading;this.wingSide=-Math.sign(Math.sin(this.heading-this.windFrom))||-1;this.board=null;this.towing=false;this.height=this.pitch=this.roll=this.speed=this.vertical=0;this.standing=false;this.standAmount=0;this.controls={steer:0,balance:0,trim:0};this.trim=0;this.lastSea=sea(this.x,this.z,this.time,this.config.swell,this.config);this.updateSafety();this.emit('board');return true;}
 moveOnFoot(dt){
  this.entryTime=Math.max(0,this.entryTime-dt);this.jumpTime=Math.max(0,this.jumpTime-dt);this.heading=wrap(this.heading-clamp(this.controls.steer,-1,1)*1.8*dt);
  const swimming=this.mode==='swimming',forward=-clamp(this.controls.balance,-1,1),pace=swimming?(this.towing?1.4:2.2):2.4;
  // Swimming accelerates smoothly, with an independent stroke clock so increasing
  // travel speed never turns the arms into fast-spinning wheels. Backing up uses sculling.
  if(swimming)this.swimVelocity=mix(this.swimVelocity,forward*pace*(forward<0?.55:1),1-Math.exp(-dt*(forward?8:12)));
  else this.swimVelocity=0;
  const travel=(swimming?this.swimVelocity:forward*pace)*dt,dx=Math.sin(this.heading)*travel,dz=Math.cos(this.heading)*travel;let moved=0;
  const move=(x,z)=>{const ground=world.walkHeight(x,z),current=world.walkHeight(this.x,this.z),scramble=world.geography&&(world.geography.rockStep(x,z)||world.geography.rockStep(this.x,this.z)),step=scramble?1.35:.46,drop=scramble?1.6:.75;if(Math.hypot(x,z)>world.limit-2||world.blocked(x,z))return false;if(this.mode==='walking'&&(ground-current>step||(current-ground>drop&&!(ground<-.72&&current<1.5))))return false;if(this.mode==='swimming'&&ground>(scramble?1.35:1.1))return false;this.x=x;this.z=z;return true;};
  const ox=this.x,oz=this.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.10));for(let i=0;i<steps;i++){if(!move(this.x+dx/steps,this.z+dz/steps)){if(!move(this.x+dx/steps,this.z))move(this.x,this.z+dz/steps);}}moved=Math.hypot(this.x-ox,this.z-oz);this.speed=moved/dt;this.walkCycle+=moved*5;this.swimEffort=swimming?clamp(this.speed/pace,0,1):0;if(swimming)this.swimPhase+=dt*TAU*(.38+.46*this.swimEffort);
  const ground=world.walkHeight(this.x,this.z),water=sea(this.x,this.z,this.time,this.config.swell,this.config);
  if(this.mode==='swimming'&&ground>-.5&&ground<=(world.geography?.rockStep(this.x,this.z)?1.35:1.1)){this.mode='walking';this.swimVelocity=this.swimEffort=0;this.towing=false;this.emit('ashore');}
  else if(this.mode==='walking'&&ground<-.72){this.mode='swimming';this.swimVelocity=this.swimEffort=0;this.jumpTime=.65;this.emit('swim');}
  this.walkY=this.mode==='walking'?ground:water;this.status=this.mode==='walking'?'Exploring':'Swimming';
  if(this.towing&&this.board){const x=this.x-Math.sin(this.heading)*2.2,z=this.z-Math.cos(this.heading)*2.2,t=1-Math.exp(-dt*2.5),bx=mix(this.board.x,x,t),bz=mix(this.board.z,z,t);const candidate={x:bx,z:bz,heading:this.heading,height:0,pitch:0,roll:0};if(!world.clearance(candidate,sea(bx,bz,this.time,this.config.swell,this.config)).hit){this.board.x=bx;this.board.z=bz;this.board.heading=this.heading;}else if(Math.hypot(this.x-this.board.x,this.z-this.board.z)>4)this.towing=false;}
  if(this.mode==='walking')for(const site of world.castle.sites)if(!this.discoveries.has(site.id)&&Math.hypot(this.x-site.x,this.z-site.z)<2.5&&(world.geography||Math.abs(this.walkY-world.castle.floor)<1)){this.discoveries.add(site.id);this.score+=75;this.emit('discovery',{name:site.name,text:site.text});}
 }
 progress(){const goals=this.goals(),g=goals[0];return {value:g.value,goal:g.goal,unit:g.unit,ratio:Math.min(...goals.map(g=>g.value/g.goal)),goals};}
 step(dt){if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);this.time+=dt;
  const previousWind=this.wind;this.sampleWind();
  this.windTrend=mix(this.windTrend,(this.wind-previousWind)/dt,1-Math.exp(-dt*2));this.angle=Math.abs(wrap(this.heading-this.windFrom));this.stamina=clamp(this.stamina+dt*.10,0,1);this.pumpCooldown=Math.max(0,this.pumpCooldown-dt);this.pumpPulse=Math.max(0,this.pumpPulse-dt*1.8);this.swapTime=Math.max(0,this.swapTime-dt);
  this.updateWingPosition(dt);this.popCooldown=Math.max(0,this.popCooldown-dt);if(this.air){this.stepAir(dt);return;}
  if(this.mode==='falling'){this.advanceFall(dt);return;}
  if(this.mode==='riding'){horses.step(this,world,dt);return;}
  if(this.mode!=='sailing'){this.moveOnFoot(dt);return;}
  const smoothing=1-Math.exp(-dt*(this.assist?4.5:7));this.trim=mix(this.trim,clamp(this.controls.trim,0,1),smoothing);this.balance=mix(this.balance,clamp(this.controls.balance,-1,1),smoothing);this.steer=mix(this.steer,clamp(this.controls.steer,-1,1),smoothing);this.standAmount=mix(this.standAmount,this.standing?1:0,1-Math.exp(-dt*3));
  if(this.pumpHeld)this.pumpCharge+=dt;if(this.popHeld)this.popCharge+=dt;
  const previousFlight=this.flight,oldHeading=this.heading,oldRelative=wrap(this.heading-this.windFrom),oldX=this.x,oldZ=this.z,previousPose={x:this.x,z:this.z,height:this.height,pitch:this.pitch,pumpPulse:this.pumpPulse,roll:this.roll,heading:this.heading};
  // With local +Z forward, local +X is the rider's left. Positive input turns
  // right (decreasing scene yaw) and banks the body toward local -X.
  const turnRate=this.standing?(this.foiling?.80:.48)*clamp(this.speed/3,.12,1):.18;this.heading=wrap(this.heading-this.steer*turnRate*dt);this.angle=Math.abs(wrap(this.heading-this.windFrom));
  const wantedSide=-Math.sign(Math.sin(this.heading-this.windFrom))||this.wingSide;
  const force=this.wingForces();this.wingForce=force;this.apparent=force.apparent;this.drive=force.forward;
  const drag=this.foiling?.20+.020*this.speed*this.speed:.32+.046*this.speed*this.speed,carveDrag=Math.abs(this.steer)*Math.abs(this.speed)*.047;
  this.waveDrive=this.waveEnergy();const resistance=Math.sign(this.speed)*Math.min(Math.abs(this.speed)/dt,drag+carveDrag);
  this.speed=clamp(this.speed+(this.drive+this.waveDrive-resistance)*dt,-1.5,12.8);
  // The immersed foil resists leeway, but a backwinded wing can still shove
  // the rider sideways. Forces are softened for learning, never erased.
  this.lateralSpeed=(this.lateralSpeed+force.lateral*dt)*Math.exp(-dt*(this.foiling?2.6:1.45));
  // Coached mode trims the neutral pitch for speed once airborne. It does not
  // launch, choose a height, steer, or recover a held back-foot input for the player.
  const neutralCl=this.assist&&this.height>.10?Math.min(.3152,90*9.81/(.5*1025*.18*Math.max(1,this.speed)**2*Math.cos(this.steer*.32))):.3152;
  // Positive balance shifts weight aft; positive physical pitch raises the nose
  // and foil angle of attack. Forward pressure lowers both pitch and lift.
  this.pitch=mix(this.pitch,(neutralCl-.20)/4.8+this.balance*.12,1-Math.exp(-dt*(this.assist?3.5:5)));
  const cl=clamp(.20+4.8*this.pitch,.015,.95),ventilation=this.height>.86?clamp(1-(this.height-.86)*7,0,1):1;
  this.lift=.5*1025*.18*Math.max(0,this.speed)**2*cl*Math.cos(this.steer*.32)*ventilation;
  if(this.standing&&this.standAmount>.85){const acceleration=(this.lift/90-9.81+force.upward)*.15-this.vertical*(this.assist?5.2:2.8);this.vertical=clamp(this.vertical+acceleration*dt,-1.8,1.5);}else this.vertical=-.2;
  this.x+=(Math.sin(this.heading)*this.speed-Math.cos(this.heading)*this.lateralSpeed)*dt;this.z+=(Math.cos(this.heading)*this.speed+Math.sin(this.heading)*this.lateralSpeed)*dt;
  const surface=sea(this.x,this.z,this.time,this.config.swell,this.config);this.height+=this.vertical*dt-(surface-this.lastSea)*.72;this.lastSea=surface;
  this.roll=mix(this.roll,this.steer*.40+clamp(force.lateral*.035,-.10,.10),1-Math.exp(-dt*4));
  const collision=world.sweep(previousPose,this,(x,z)=>sea(x,z,this.time,this.config.swell,this.config));
  if(collision){this.lastCollision=collision;this.x=collision.x;this.z=collision.z;this.crash(collision.kind==='shore'?'You reached shore or a rock. Turn toward deep water before the beach.':'The hydrofoil touched the bottom. Leave more room around the shallows.',this.lastSafe);this.updateSafety();return;}
  if(Math.hypot(this.x,this.z)>world.limit){this.crash('You reached the edge of the practice bay.',{x:0,z:0});return;}
  this.updateSafety();
  const wasFoiling=this.foiling;this.foiling=this.standing&&this.height>.13&&this.speed>3.25;
  if(this.height<0){const impact=this.vertical;this.height=0;this.vertical=Math.max(0,this.vertical);if(impact<-1.15)this.crash('Hard touchdown. Ease forward gently; avoid sudden pressure changes.');}
  if(this.height>.89)this.breachTime+=dt;else this.breachTime=Math.max(0,this.breachTime-dt*2);
  if(this.breachTime>(this.assist?.7:.38))this.crash('Foil breached the surface. Shift forward as speed or height increases.');
  if(this.fallTime>0)return;
  if(this.foiling){this.flight+=dt;this.stats.flightTime+=dt;this.stats.bestFlight=Math.max(this.stats.bestFlight,this.flight);this.score+=dt*10*(1+Math.min(this.flight/25,1.5));if(this.height>.22&&this.height<.63&&Math.abs(this.vertical)<.25)this.stats.stable+=dt;if(!wasFoiling)this.emit('takeoff');}
  else {if(wasFoiling){if(this.flight>3&&this.trim<.22&&this.vertical>-.8)this.landingPending=true;else this.emit('touchdown');}this.flight=0;}
  if(this.landingPending){if(this.foiling||this.trim>.3||this.fallTime>0)this.landingPending=false;else if(this.height<=.03){this.landingPending=false;this.stats.landings++;this.emit('landing');}}
  if(this.standing&&this.speed>2&&this.trim>.25&&this.trim<.8&&this.angle>.9&&this.angle<2.3)this.stats.powered+=dt;
  if(this.foiling)this.stats.upwind=Math.max(0,this.stats.upwind+(this.z-oldZ)*Math.cos(this.windFrom)+(this.x-oldX)*Math.sin(this.windFrom));
  this.stats.maxSpeed=Math.max(this.stats.maxSpeed,this.speed);
  // A maneuver must cross an actual wind axis, stay flying, transfer the wing,
  // and exit on the other reach. Simply pressing Transfer cannot earn a turn.
  if(this.foiling&&Math.abs(this.steer)>.20&&!this.turn)this.turn={heading:this.heading,side:-Math.sign(Math.sin(oldRelative)),start:this.time,crossed:false,kind:null};
  if(this.turn){const tr=this.turn,newRelative=wrap(this.heading-this.windFrom);if(!this.foiling||this.time-tr.start>13)this.turn=null;else {if(Math.sign(Math.sin(oldRelative))!==Math.sign(Math.sin(newRelative))&&!tr.crossed){tr.crossed=true;tr.kind=Math.cos(newRelative)>0?'tacks':'jibes';}
   if(tr.crossed&&wantedSide!==tr.side&&wantedSide===this.wingSide&&this.angle>.93&&this.angle<2.20&&this.swapTime===0&&Math.abs(wrap(this.heading-tr.heading))>1.15){this.stats[tr.kind]++;this.score+=tr.kind==='tacks'?350:250;this.emit('maneuver',{kind:tr.kind});this.turn=null;}}
  }
  if(this.foiling&&Math.hypot(this.x-this.gate.x,this.z-this.gate.z)<7){this.score+=150;this.stats.gates++;this.gateIndex++;this.emit('gate');this.makeGate();}
  this.trackSkills(dt,wasFoiling,previousFlight,oldHeading);
  this.status=!this.standing?'Kneeling':this.angle<.65?'In irons':force.backwind>.2?'Backwinded':this.trim>.88?'Oversheeted':this.flagged?'Wing flagged':this.footSwitch?'Switching feet':this.popHeld?'Loading pop':this.height>.72?'Too high':this.foiling?'On foil':this.speed<3?'Building speed':'Ready to lift';
  this.checkComplete();
 }
 updateSafety(){
  const water=sea(this.x,this.z,this.time,this.config.swell,this.config);this.safety=world.clearance(this,water);
  if(!this.fallTime&&this.safety.depth>3&&this.safety.foilClearance>1.2&&Math.hypot(this.x,this.z)<420)this.lastSafe={x:this.x,z:this.z};
  this.shoreAhead=false;const distance=Math.min(35,Math.max(4,this.speed*4));
  for(let d=1;d<=distance;d+=1){const x=this.x+Math.sin(this.heading)*d,z=this.z+Math.cos(this.heading)*d;const bottom=world.bedHeight(x,z),projected=water+this.height-.865-Math.abs(Math.sin(this.roll))*.74;
   if(projected-bottom<.5||bottom>=0){this.shoreAhead=true;break;}}
 }
 powerInfo(){
  const side=-Math.sign(Math.sin(this.heading-this.windFrom))||this.wingSide;
  let code='powered',label='Powered',detail='Good reach. Keep wing trim around 65–70%.';
  if(this.flagged){code='flagged';label='Wing flagged';detail='Wing drive is off. Follow the wave, pump the foil, or press G / Power wing to catch the wind again.';}
  else if(this.wind<2){code='calm';label='Light air';detail='Very little wind for takeoff. Try a stronger breeze in Conditions, or enjoy a swim.';}
  else if(this.fallTime>0||this.controls.trim<.05){code='sheeted-out';label='Sheet out';detail='Wing power is zero. Stand up, then set it to about 65%.';}
  else if(this.angle<.65){code='into-wind';label='Into wind';detail='You are in the red no-go zone. Turn until the wind is across the board.';}
  else if(this.wingForces().backwind>.2){code='wrong-side';label='Backwinded';detail='Wind is pressing the back of the wing: braking and pushing you sideways. Ease up to the green arc, move to the other side, then sheet in.';}
  else if(this.swapTime>0){code='transfer';label='Changing hands';detail='Finish the hand change, then sheet in on the new side.';}
  else if(this.trim>.85){code='oversheeted';label='Oversheeted';detail='Too much trim is choking the wing. Ease back to 65–70%.';}
  else if(this.trim<.38){code='eased';label='Wing eased';detail='Sheet in toward 65% to rebuild drive.';}
  else if(this.angle>2.65){code='downwind';label='Deep downwind';detail=this.apparent<3?'You are catching up with the wind. Angle onto a broad reach for more wing drive, or link waves with foil pumps.':'Wind from behind pushes you forward. An angled broad reach builds more speed than running straight downwind.';}
  else if(this.wind<this.config.wind*.90){code='lull';label='Wind lull';detail='The wind has eased. Keep a reach, use a timed pump, and avoid oversheeting.';}
  else if(this.angle<1.05){code='close-hauled';label='High upwind';detail='Bear away toward 90° if you need more takeoff speed.';}
  else if(Math.abs(this.wingAngle)<.25){code='overhead';label='Overhead · less drive';detail='The high wing lifts more and drives less. Move out along the green arc on the powered side, then pull down for more forward drive.';}
  return {code,label,detail,drive:clamp(Math.abs(this.drive)/Math.max(.01,.033*this.config.wind*this.config.wind*.68),0,1),trend:this.wind<this.config.wind*.90?'Wind lull':this.windTrend<-.12?'Wind easing':this.windTrend>.12?'Wind building':'Wind steady'};
 }
 coach(){
  if(this.mode==='falling')return 'Falling into the water. Let go of the wing; climb back aboard when you are ready.';
  if(this.mode==='riding')return this.horse.blocked?'Your horse is waiting for clear footing. Turn away from the water, rocks or wall.':this.horse.mountTime>0?'Settling into the saddle…':'Push the right pad gently to walk, farther to trot and canter, fully forward to gallop. Release to stop; H or Dismount gets down.';
  if(this.mode==='walking'&&this.nearbyHorse())return this.nearbyHorse().name+' is nearby. Press H or Mount horse to explore the shore together.';
  if(this.mode==='walking')return 'Arrow keys / WASD or the right pad walk and turn. The left pad looks around; Center view resets it. Explore the open doorways.';
  if(this.mode==='swimming'&&this.fallReason)return 'Swim to your board and press Enter / Climb aboard. Then stand up and sheet in to keep sailing.';
  if(this.mode==='swimming')return this.towing?'Swimming with the board. Head toward a low beach or the castle landing; the board stays afloat when you walk ashore.':'Free swimming. Use forward/back and turn controls. Return to your board to tow it or climb aboard.';
  if(this.fallTime>0)return this.fallReason+' Wing power is reset; stand and sheet in again when ready.';
  if(this.shoreAhead||this.safety.foilClearance<.65)return 'Shallows ahead! Turn toward open water. The foil needs clearance below the board.';
  if(this.wind<2)return this.powerInfo().detail;
  if(this.air)return 'AIR: left/right spins; front/back flips. Center near 180° or 360°, transfer the wing for a half turn, then land level.';
  if(this.footSwitch)return 'Keep body pressure centered while your feet step; hold the new stance level for a second.';
  if(this.popHeld)return 'Compress, then release Pop in the green band. Keep steering centered until airborne.';
  if(this.landingCheck)return 'Landing made. Ride away level for one second to finish the move.';
  if(!this.standing)return 'Tap STAND UP. Then set wing power to about 65% to catch the breeze.';
  if(Math.hypot(this.x,this.z)>world.limit*.85417&&this.x*Math.sin(this.heading)+this.z*Math.cos(this.heading)>0)return 'Open-water boundary ahead. Turn toward the middle of the bay.';
  if(this.height>.72)return 'High foil! Gently move your weight FORWARD to lower the nose.';
  const power=this.powerInfo();if(['calm','sheeted-out','into-wind','wrong-side','oversheeted','transfer'].includes(power.code))return power.detail;
  if(this.turn?.crossed)return 'Finish the turn, level the foil, transfer hands and gently power up.';
  if(this.pumpHeld)return this.pumpCharge>.3&&this.pumpCharge<.7?'Release now — a smooth, strong pump.':'Compress, then release PUMP in the green band.';
  if(this.trim<.2)return this.foiling?'Gliding. Sheet in again before the foil loses speed.':'Raise wing power to around 65% to build board speed.';
  if(!this.foiling&&this.speed>4.3)return this.assist?'Ready for lift. Briefly press BACK, then center the pad as the board rises.':'Ready for lift. A little BACK-foot pressure, then ease forward as you rise.';
  if(['lull','downwind','close-hauled','eased'].includes(power.code))return power.detail;
  if(this.foiling&&this.height<.23)return 'Flying low. A tiny bit of back-foot pressure will add clearance.';
  if(this.flagged)return this.waveDrive>.1?'On the wave face. Keep the wing flagged and follow its travel direction.':this.powerInfo().detail;
  if(this.foiling&&this.config.id==='wave-riding')return 'Follow the wave arrow, then press G / Flag wing to ride the face without wing power.';
  if(this.foiling&&this.config.id==='downwind-gliding')return 'Build speed, turn toward downwind, then flag the wing. Pump to link the slower sections.';
  if(this.foiling&&this.lesson>=12)return this.config.tip;
  if(this.foiling&&['foot-switching','s-turns','carving','touch-and-go'].includes(this.config.id))return this.config.tip;
  if(this.foiling)return this.assist?'On foil. Center the pad to settle; use small corrections for waves and height.':'Nice flight. Use small body movements and watch the next gust.';
  return 'Build speed across the wind, around 90°. Use 65–70% wing trim and centered body pressure.';
 }
}
const api={Session,LESSONS,ISLANDS,sea,clamp,wrap,WAVES,WAVE_DIRECTION};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FoilCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
