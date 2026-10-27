const test=require('node:test'),assert=require('node:assert/strict');const {point,read}=require('./wing-control.js');const {Session}=require('./core.js');const {tick,fly}=require('./test-pilot.cjs');
test('arc spans 180 degrees; sheet-in cone is continuous and its values are latched',()=>{
 for(const a of [-1,-.8,-.3,0,.3,.8,1]){const p=point(a,0),v=read(p.x,p.y,0);assert.ok(Math.abs(v.angle-a)<1e-10);assert.equal(v.power,0);for(const power of [.15,.4,.68,.9,1]){const p=point(a,power),v=read(p.x,p.y,a);assert.equal(v.angle,a);assert.ok(Math.abs(v.power-power)<1e-10,JSON.stringify({a,power,v}));}}
 assert.equal(point(0,0).y,28);assert.deepEqual(point(.7,1),point(-.7,1));assert.equal(read(110,200,.2).power,1);
});
test('wing moves continuously and transfers at the overhead crossing when unloaded',()=>{
 const s=new Session(7,{free:true,conditions:{wind:0,swell:0,gust:0}});s.stand();s.setWingPosition(.9);tick(s,.5);assert.ok(s.wingAngle>.85);s.setWingPosition(-.9);const angle=s.wingAngle;tick(s,.05);assert.ok(s.wingAngle<angle&&s.wingAngle>0);tick(s,1);assert.equal(s.wingSide,-1);assert.ok(s.wingAngle<-.8);assert.equal(s.wingTarget,-.9);tick(s,.4);assert.equal(s.wingTarget,-.9);assert.equal(s.drain().filter(e=>e.type==='swap').length,2);
});
test('a loaded side change waits for easing, then completes without another tap',()=>{
 const s=new Session(7,{free:true,conditions:{gust:0,swell:0}});fly(s,14);s.setWingPosition(-.85);tick(s,.4);s.setWingPosition(.85);tick(s,.4);assert.equal(s.wingSide,-1);assert.equal(s.wingBlocked,true);assert.ok(s.wingAngle<=0);s.controls.trim=0;tick(s,1.3);assert.equal(s.wingSide,1);assert.ok(s.wingAngle>.7);assert.equal(s.wingTarget,.85);
 s.controls.trim=.6;const target=s.wingTarget;tick(s,.2);assert.equal(s.controls.trim,.6);assert.equal(s.wingTarget,target);s.crash('Test');assert.equal(s.controls.trim,0);assert.equal(s.wingTarget,0);assert.equal(s.wingAngle,0);
});
