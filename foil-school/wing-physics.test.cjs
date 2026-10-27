const test=require('node:test'),assert=require('node:assert/strict');const {Session,wrap}=require('./core.js');const {tick,balance}=require('./test-pilot.cjs');
function session(angle=-.9,speed=4){const s=new Session(1,{free:true,conditions:{wind:8.5,gust:0,swell:0}});s.stand();Object.assign(s,{standAmount:1,trim:.68,speed,wingAngle:angle,wingTarget:angle,wingSide:Math.sign(angle)||1});s.controls.trim=.68;return s;}
test('overhead wing redirects some force upward and reduces drive at equal trim',()=>{const s=session(-1);const low=s.wingForces();s.wingAngle=0;const high=s.wingForces();assert.ok(high.forward>low.forward*.75&&high.forward<low.forward*.90);assert.ok(high.upward>low.upward);assert.ok(high.newtons>0);});
test('wrong-side loading brakes and shoves downwind, and full easing removes both effects',()=>{const s=session(1);const f=s.wingForces();assert.ok(f.backwind>.95&&f.forward<-.2&&f.lateral<-.5);const x=s.x,z=s.z;tick(s,2);assert.ok(s.speed<3);assert.ok(s.z<z-.4,'Noticeable downwind sideslip');assert.ok(s.x>x,'Momentum survives the initial backwind');for(const angle of [-1,-.5,0,.5,1]){s.wingAngle=angle;s.trim=0;const f=s.wingForces();assert.equal(Math.abs(f.forward),0);assert.equal(Math.abs(f.lateral),0);assert.ok(s.wingLoadInfo().light);}});
test('backwind can move a stationary board astern while fully eased positions cannot',()=>{const s=session(1,0);s.heading=Math.PI/3;tick(s,3);assert.ok(s.speed<-.1);assert.ok(s.lateralSpeed<-.3);const neutral=session(1,0);neutral.trim=neutral.controls.trim=0;tick(neutral,3);assert.equal(neutral.speed,0);assert.equal(neutral.lateralSpeed,0);});
test('force rotates with world wind/heading and mirrors correctly on the other tack',()=>{const s=session(-.8);const a=s.wingForces();s.heading+=1.1;s.windFrom+=1.1;const rotated=s.wingForces();assert.ok(Math.abs(a.forward-rotated.forward)<1e-10);s.heading=wrap(s.windFrom-Math.PI/2);s.wingAngle=.8;const b=s.wingForces();assert.ok(Math.abs(a.forward-b.forward)<1e-10);assert.ok(Math.abs(a.lateral+b.lateral)<1e-10);});
test('apparent wind includes sideslip, and downwind wind fades when matching its speed',()=>{const s=session(-.9);const base=s.wingForces();s.lateralSpeed=-2;assert.ok(s.wingForces().apparent<base.apparent);s.heading=s.windFrom+Math.PI;s.speed=s.wind;s.lateralSpeed=0;assert.ok(s.wingForces().apparent<1e-9);assert.ok(Math.abs(s.wingForces().forward)<1e-9);});
test('forces change continuously across overhead and wind axes while turning',()=>{const s=session(.5);for(const axis of [0,Math.PI]){let before;for(let i=-10;i<=10;i++){s.heading=axis+i*.001;const f=s.wingForces();if(before){assert.ok(Math.abs(f.forward-before.forward)<.03);assert.ok(Math.abs(f.lateral-before.lateral)<.03);}before=f;}}s.heading=Math.PI/2;let before;for(let i=-100;i<=100;i++){s.wingAngle=i/100;const f=s.wingForces();if(before)assert.ok(Math.abs(f.forward-before.forward)<.2);before=f;}});
test('a flagged wing stays light on either side even with a stored power setting',()=>{const s=session(-1);s.flagged=true;assert.equal(Math.abs(s.wingForces().forward),0);assert.ok(s.wingLoadInfo().light);s.setWingPosition(1);tick(s,1.6);assert.equal(s.wingSide,1);assert.ok(s.wingAngle>.9);});

test('wind from astern pushes a stopped board, fades at wind speed and cannot create free acceleration',()=>{
 const s=session(-.9,0);s.heading=s.windFrom+Math.PI;s.sampleWind();const initial=s.wingForces().forward;assert.ok(initial>1.5);tick(s,6);assert.ok(s.speed>2&&s.z< -7,JSON.stringify({speed:s.speed,z:s.z}));
 s.speed=s.wind;s.lateralSpeed=0;s.sampleWind();assert.ok(Math.abs(s.wingForces().forward)<1e-8);assert.ok(s.apparent<1e-8);s.speed=s.wind+2;s.sampleWind();assert.ok(s.wingForces().forward<0);
 s.speed=0;let force=0;for(const trim of [.1,.4,.7,1]){s.trim=trim;const f=s.wingForces().forward;assert.ok(f>force);force=f;}s.trim=0;assert.equal(Math.abs(s.wingForces().forward),0);
 for(const wind of [0,.7,Math.PI,-Math.PI/2]){s.windFrom=wind;s.heading=wind+Math.PI;s.trim=.68;s.speed=0;assert.ok(Math.abs(s.wingForces().forward-initial)<1e-8);}
});
test('pop is unavailable when the wing is backwinded even with a high power setting',()=>{const s=session(1,6);s.height=.4;s.foiling=true;assert.equal(s.popReady(),false);});

test('oversheet warning and lost drive begin at 90 percent, not 85 percent',()=>{
 const s=new Session(0,{free:true,conditions:{wind:8.2,swell:0,gust:0}});Object.assign(s,{heading:Math.PI/2,angle:Math.PI/2,standing:true,standAmount:1,wingSide:-1,wingAngle:-.8,wingTarget:-.8,speed:0});
 const forces=[];for(const trim of [.85,.89,.90,1]){s.trim=s.controls.trim=trim;forces.push(s.wingForces().forward);assert.equal(s.powerInfo().code==='oversheeted',trim>=.90);}
 assert.ok(forces[1]>forces[0]&&forces[2]>forces[1]);assert.ok(forces[3]<forces[2]*.65);
});

test('head-to-wind sheeting pushes astern gently; easing and flagging remove that force',()=>{
 for(const wind of [0,.7,-1.2,Math.PI])for(const angle of [-1,0,1]){const s=session(angle,0);s.windFrom=s.config.windFrom=wind;s.heading=wind;s.trim=s.controls.trim=.78;s.sampleWind();const head=s.wingForces().forward;assert.ok(head<-.4);tick(s,4);assert.ok(s.speed<-.1&&s.speed>=-1.5);assert.ok(!s.foiling,'Reverse motion cannot create foil lift');s.speed=0;s.lateralSpeed=0;s.heading=wind+Math.PI;assert.ok(s.wingForces().forward>Math.abs(head)*2.5,'Downwind push is much stronger than backing');s.trim=0;assert.equal(Math.abs(s.wingForces().forward),0);s.heading=wind;assert.equal(Math.abs(s.wingForces().forward),0);s.trim=.8;s.flagged=true;assert.equal(Math.abs(s.wingForces().forward),0);}
});
test('the correct outboard wing develops more close-hauled drive on either tack',()=>{
 for(const side of [-1,1]){const s=session(-side,4);s.heading=s.windFrom+side*Math.PI/3;const low=s.wingForces().forward;s.wingAngle=0;const high=s.wingForces().forward;assert.ok(low>high*1.35&&high>0);s.wingAngle=side;assert.ok(s.wingForces().forward<0,'Wrong side still backwinds, even close hauled');}
});
