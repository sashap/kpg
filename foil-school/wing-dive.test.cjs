const test=require('node:test'),assert=require('node:assert/strict');
const {Session,wrap}=require('./core.js'),{tick,maneuver,fly}=require('./test-pilot.cjs');
function upwind(speed=0,angle=0,trim=.7,wind=8.5){const s=new Session(1,{free:true,conditions:{wind,swell:0,gust:0}});s.stand();Object.assign(s,{heading:s.windFrom+angle,angle:Math.abs(angle),standAmount:1,speed,trim,wingAngle:0,wingTarget:0,height:speed>4?.35:0});s.controls.trim=trim;return s;}
test('stationary loaded upwind wing shakes, bows toward the feet and backs up without a wipeout',()=>{
 const s=upwind();tick(s,.4);assert.ok(s.wingDive.shake>.3);assert.equal(s.wingDive.fold,0);tick(s,3);assert.ok(s.wingDive.fold>.7);assert.equal(s.mode,'sailing');assert.equal(s.stats.crashes,0);assert.ok(s.speed<-.1&&s.speed>=-1.5);assert.equal(s.powerInfo().code,'wing-dive');
 s.controls.trim=0;s.setWingPosition(-1);tick(s,1.2);assert.ok(s.wingDive.fold<.01);assert.equal(s.wingDive.warned,false);assert.equal(s.stats.crashes,0);assert.ok(s.wingAngle<-.8);
});
test('powered entry above a few knots warns, then trips forward over the wing exactly once',()=>{
 for(const speed of [2,4,7])for(const angle of [-.55,0,.55]){const s=upwind(speed,angle);tick(s,.45);assert.equal(s.mode,'sailing');assert.ok(s.wingDive.shake>0);tick(s,1.4);assert.ok(['falling','swimming'].includes(s.mode),JSON.stringify({speed,angle,mode:s.mode,dive:s.wingDive}));assert.equal(s.fallMotion.kind,'wing-trip');const f=s.fallMotion;assert.ok(f.vx*Math.sin(s.heading)+f.vz*Math.cos(s.heading)>1);assert.ok(f.pitchRate>2);tick(s,3);assert.equal(s.mode,'swimming');assert.equal(s.stats.crashes,1);assert.equal(s.controls.trim,0);const events=s.drain();assert.equal(events.filter(e=>e.type==='wing-slap').length,1);assert.equal(events.filter(e=>e.type==='splashdown').length,1);}
});
test('sheeting out during the warning, leaving the cone, or flagging recovers before the trip',()=>{
 for(const action of ['ease','bear-away','flag']){const s=upwind(6);tick(s,.4);if(action==='ease')s.controls.trim=0;else if(action==='flag')s.flagged=true;else s.heading=s.windFrom+1.1;tick(s,1);assert.equal(s.stats.crashes,0,action);assert.equal(s.mode,'sailing');assert.ok(s.wingDive.fold<.01);assert.equal(s.wingDive.warned,false);}
});
test('eased, flagged, light-wind, and outside-cone sailing do not trip at speed',()=>{
 for(const kind of ['eased','flagged','calm','close-hauled']){const s=upwind(5,kind==='close-hauled'?.70:0,kind==='eased'?.15:.7,kind==='calm'?1:8.5);if(kind==='flagged')s.flagged=true;tick(s,2);assert.equal(s.stats.crashes,0,kind);assert.equal(s.wingDive.time,0);assert.equal(s.wingDive.fold,0);}
});
test('the red cone follows wind direction and the normal eased tack still works',()=>{
 for(const windFrom of [-2,-.7,.8,2.6]){const s=upwind(4);s.windFrom=s.config.windFrom=windFrom;s.heading=wrap(windFrom+.3);tick(s,1.8);assert.equal(s.fallMotion?.kind,'wing-trip');}
 const s=new Session(9,{free:true,conditions:{swell:0,gust:0}});fly(s,15);maneuver(s,s.wingSide);assert.equal(s.stats.crashes,0);assert.equal(s.stats.tacks,1);
});
test('a previous backwind cannot carry into a recovered launch or a remount',()=>{
 const s=upwind(5);tick(s,2.5);s.recover();assert.equal(s.wingDive.fold,0);assert.equal(s.wingDive.time,0);assert.equal(s.fallMotion,null);assert.equal(s.mode,'sailing');
});
test('gradual keyboard-rate easing arrests the dive without requiring an instant power jump',()=>{
 const s=upwind(6);tick(s,.3);tick(s,1.6,s=>s.controls.trim=Math.max(0,s.controls.trim-.42/60));assert.equal(s.mode,'sailing');assert.equal(s.stats.crashes,0);assert.ok(s.wingDive.fold<.01);assert.equal(s.wingDive.warned,false);
});
test('steering across the red-cone boundary triggers the catch while a brief eased crossing stays safe',()=>{
 const s=upwind(6,.9);s.controls.steer=1;tick(s,.3);assert.equal(s.wingDive.time,0);tick(s,1.8);assert.equal(s.fallMotion?.kind,'wing-trip');
 const clean=upwind(6,.9,.15);clean.controls.steer=1;tick(clean,2);assert.equal(clean.mode,'sailing');assert.equal(clean.stats.crashes,0);
});
