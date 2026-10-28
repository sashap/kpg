import assert from 'node:assert/strict';
export async function checkLeashes({evaluate,cdp,click,screenshot}){
 const key=async(code,key,value)=>{await evaluate('foilTest.resume()');await cdp('Input.dispatchKeyEvent',{type:'keyDown',code,key,windowsVirtualKeyCode:value});await cdp('Input.dispatchKeyEvent',{type:'keyUp',code,key,windowsVirtualKeyCode:value});await evaluate('foilTest.inputStep(0);foilTest.previewPose({})');};
 const leashes=()=>evaluate('foilTest.polish.rider.leashes');
 await evaluate(`(()=>{foilTest.start(1,{free:true,conditions:{swell:0,gust:0}});const s=foilTest.session;Object.assign(s,{speed:2,height:.3,standing:true,standAmount:1});foilTest.previewPose({});s.crash('Leash check',null,{kind:'fall'});foilTest.resume();foilTest.step(7);s.x=s.board.x+1;s.z=s.board.z;if(!s.towing)s.toggleTow();foilTest.inputStep(0);foilTest.previewPose({});})()`);
 assert.deepEqual(await leashes(),{board:true,wing:true});
 await key('Space',' ',32);assert.deepEqual(await leashes(),{board:false,wing:false});
 const away=await evaluate(`(()=>{const s=foilTest.session,p={x:s.board.x,z:s.board.z};s.heading=Math.PI/2;s.controls.balance=-1;foilTest.resume();foilTest.step(5);s.controls.balance=0;foilTest.inputStep(0);foilTest.previewPose({});return {distance:Math.hypot(s.x-s.board.x,s.z-s.board.z),movement:Math.hypot(s.board.x-p.x,s.board.z-p.z),towing:s.towing};})()`);
 assert.ok(away.distance>12&&away.movement<.001&&!away.towing);assert.deepEqual(await leashes(),{board:false,wing:false});await screenshot('both-leashes-released');
 await key('Space',' ',32);assert.deepEqual(await leashes(),{board:false,wing:false},'Cannot reconnect from far away');
 await evaluate('(()=>{const s=foilTest.session;s.x=s.board.x+1;s.z=s.board.z;foilTest.inputStep(0);foilTest.resume();})()');await click('pump');await evaluate('foilTest.inputStep(0);foilTest.previewPose({})');assert.deepEqual(await leashes(),{board:true,wing:true},'Touch Tow board reconnects nearby');
 await evaluate('foilTest.resume()');await click('pump');await evaluate('foilTest.inputStep(0);foilTest.previewPose({})');assert.deepEqual(await leashes(),{board:false,wing:false},'Touch Leave board releases both');
 await key('Enter','Enter',13);assert.equal(await evaluate('foilTest.session.mode'),'sailing');assert.deepEqual(await leashes(),{board:true,wing:true});
 console.log('Actual Space, distant swimming, nearby touch pickup/release and Enter boarding control both visible leashes correctly.');
}
export async function checkShore({evaluate,screenshot},id){
 const result=await evaluate(`(()=>{
  foilTest.start(1,{free:true,conditions:{swell:.18,gust:0}});const s=foilTest.session,base=FoilWorld.geography?FoilWorld.geography.project(FoilWorld.location.launch):[-207,-8];let spot;
  for(let r=0;r<=35&&!spot;r++)for(let i=0;i<32;i++){const a=i*Math.PI/16,x=base[0]+Math.sin(a)*r,z=base[1]+Math.cos(a)*r,bed=FoilWorld.bedHeight(x,z);if(bed<-.15&&bed>-.85){spot={x,z};break;}}
  if(!spot)throw Error('Missing shore fixture');Object.assign(s,{...spot,speed:8,height:.4,standing:true,standAmount:1});foilTest.previewPose({});s.crash('Shore recovery check',null,{kind:'beach-strike'});s.board.motion=null;s.mode='swimming';s.fallTime=0;s.fallMotion.wingAge=5.8;s.x=spot.x+35;s.z=spot.z+35;
  foilTest.resume();foilTest.step(.3);const b=s.board,f=s.fallMotion,parked={x:b.x,z:b.z};foilTest.step(8);foilTest.inputStep(0);foilTest.previewPose({});
  foilTest.inspectScenery([b.x+8,4,b.z+7],[b.x,.2,b.z]);
  return {clear:FoilWipeouts.clearEquipment(b.x,b.z,s,FoilWorld,FoilCore.sea,{safe:true}),wing:FoilWipeouts.wingClear(b.x,b.z,f.heading,f.wingOffset,f.wingFore,s,FoilWorld,FoilCore.sea),reset:f.gearRecovered&&!f.needsSafeReset,leashes:foilTest.polish.rider.leashes,distance:Math.hypot(b.x-spot.x,b.z-spot.z),movement:Math.hypot(b.x-parked.x,b.z-parked.z),motion:b.motion,damage:foilTest.polish.damage,shaders:foilTest.renderStats.programs.every(p=>p.runnable)};
 })()`);
 assert.ok(result.clear&&result.wing&&result.reset&&result.shaders,JSON.stringify({id,result}));assert.ok(result.distance<85&&result.movement<.001,JSON.stringify({id,result}));assert.equal(result.motion,null);assert.equal(result.damage.boardSplit,false);assert.deepEqual(result.leashes,{board:false,wing:false});await screenshot('safe-shore-gear-'+id);
 assert.ok(await evaluate(`(()=>{const s=foilTest.session;s.mode='swimming';s.landRecovery=null;s.x=s.board.x;s.z=s.board.z;const aboard=s.boardAgain();foilTest.inputStep(0);foilTest.previewPose({});return aboard&&foilTest.polish.rider.leashes.board&&foilTest.polish.rider.leashes.wing;})()`),id+' can reboard immediately, with no towing');
 console.log(id,'safe nearby gear, no long leashes, no drift back onto shore, boarding without towing:',result.distance.toFixed(1)+' m from impact');
}
