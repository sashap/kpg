/* A progression of skills, with stable IDs so changing lesson order cannot move saved stars. */
(function(root){
'use strict';
const goal=(metric,target,label,unit='')=>({metric,goal:target,label,unit});
const definitions=[
 ['taxiing','Taxiing','FOUNDATIONS',7.8,.025,.015,[goal('taxi',8,'Taxi with the board on the water','s')],
  'Stand and sail across the wind for eight seconds with the board on the water. Learn to build speed before lifting.',
  'Stand up, set 60–65% wing power and keep body pressure centered. Small sideways inputs steer.',
  'Taxiing develops wing control and steering while the board still supports your weight.'],
 ['first-flights','First flights','FOUNDATIONS',8.2,.035,.025,[goal('bestFlight',5,'One continuous flight','s')],
  'Build speed, lift onto the foil and hold one five-second flight.',
  'Build 9–11 knots across the wind. Briefly press BACK to raise the nose, then center the pad.',
  'Back-foot pressure raises the nose and foil angle. Ease forward as speed builds to avoid breaching.'],
 ['touch-and-go','Touch-and-go','FOUNDATIONS',8.4,.035,.025,[goal('touchGoes',2,'Touch down gently, then fly again')],
  'Complete two cycles: fly for two seconds, touch the board gently onto the water, then relaunch and fly for one second within fifteen seconds.',
  'Ease power to 35–45% and press forward gently. Once the board touches, restore 68% power and lift again.',
  'A controlled touchdown preserves momentum. Reapply power before the board slows too far.'],
 ['sustained-flight','Sustained flight','FOUNDATIONS',8.2,.06,.04,[goal('bestFlight',25,'One continuous flight','s')],
  'Keep one flight going for twenty-five seconds. Stay away from the shore and settle in the green height band.',
  'Aim for 25–60 cm. Center the pad after takeoff and make small corrections as the water changes.',
  'Foil lift grows with speed. Quiet body movements and a steady reach make long flights possible.'],
 ['pumping','Pumping','CONTROL',6.9,.05,.03,[goal('pumps',5,'Well-timed pumps'),goal('flightTime',8,'Total time on foil','s')],
  'Make five well-timed pumps and collect eight seconds on foil in lighter wind.',
  'Hold SPACE / Pump for about half a second, release in green, and allow your legs to recover.',
  'A coordinated compression and release adds energy. Repeated quick taps use energy without useful lift.'],
 ['s-turns','S-turns','CONTROL',8.6,.045,.025,[goal('sTurns',2,'Linked left–right S-turns')],
  'Link two pairs of gentle opposite turns while staying on foil. Each half needs at least 25° of heading change.',
  'Fly level, steer left about 25–35°, then right by the same amount. Repeat; keep the wing on the same side.',
  'An S-turn links opposite banks without crossing the wind. Smooth transitions preserve height and speed.'],
 ['carving','Carving','CONTROL',8.7,.06,.04,[goal('carves',2,'Controlled 50° carving arcs')],
  'Make two continuous carving arcs of at least 50°, then center the steering while still on foil.',
  'Start across the wind. Bank into a broad arc, keep your height steady, then center the pad to finish the carve.',
  'A carve is a sustained bank and heading change. The exit matters: level the board before adding another turn.'],
 ['jibe','Jibe','TRANSITIONS',8.7,.06,.04,[goal('jibes',1,'Foiling jibe through downwind')],
  'Turn through downwind, change wing hands and exit on the opposite reach without touching down.',
  'Turn away from the wind toward 180°. Ease the wing near 180°, slide across the upper wing arc when light, and sheet in on the new reach.',
  'A jibe turns through downwind. You can keep your feet in place and exit toeside before learning a foot switch.'],
 ['foot-switching','Foot switching','TRANSITIONS',8.6,.035,.025,[goal('footSwitches',2,'Foot changes with a settled foiling exit')],
  'Switch the front foot twice while on foil. Hold each new stance level for one second after the step.',
  'Fly at 20–65 cm with the pad centered. Press F / Switch feet, then keep the board steady through the step.',
  'The feet change separately from the wing hands. Unweight briefly, step near the centerline, then settle your new stance.'],
 ['tack','Tack','TRANSITIONS',9,.06,.04,[goal('tacks',1,'Foiling tack through upwind')],
  'Carry speed through head-to-wind, transfer the wing and exit on the opposite reach while still foiling.',
  'Ease the wing before the red cone. Turn through 0°, transfer while it is light, and keep turning before powering up.',
  'Entry speed carries the foil through the no-go zone. Holding power on makes the wing shake, dive and trip you; easing lets it float through.'],
 ['wave-riding','Wave riding','READ THE WATER',8.8,.24,.08,[goal('waveTime',6,'Ride wave faces with the wing flagged','s')],
  'Catch a wave moving with you, flag the wing and accumulate six seconds riding its face without wing drive.',
  'Build speed on the starting reach; these waves travel with you. Press G / Flag wing and follow the wave arrow. Re-power between rides.',
  'Flagging removes wing drive. A moving wave face supplies energy; steer along it and keep enough foil clearance.'],
 ['downwind-gliding','Downwind gliding','READ THE WATER',9,.25,.08,[goal('bestGlide',5,'Continuous flagged downwind glide','s')],
  'Turn downwind and glide on foil for five uninterrupted seconds with the wing flagged. Foil pumps can help link waves.',
  'Build speed, turn toward 150–180° on the wind compass, then press G / Flag wing. Pump through slower sections.',
  'Downwind gliding links momentum, wave energy and foil pumping. Flagging is different from simply lowering the wing pad.'],
 ['popping','Popping','FIRST AIRS',9.8,.055,.04,[goal('pops',2,'Straight pops with controlled landings')],
  'Land two straight pops. The foil must clear the water, land upright and ride away for a second.',
  'Fly above 10 knots in deep water. Hold J / Pop for 0.4–0.7 s, release, keep the pad centered, and retain wing power.',
  'A pop loads and releases the foil. Keep the wing supported overhead and land with the board level.'],
 ['frontside-airs','Frontside airs','FIRST AIRS',10.3,.06,.04,[goal('frontsideAirs',1,'Frontside 180° air and ride-away')],
  'Pop and rotate 180° toward your chest, transfer the wing, land upright and ride away.',
  'With left foot forward, steer RIGHT in the air; with right foot forward, LEFT. Ease and transfer near the wind axis. Center at 180°.',
  'Frontside describes the direction relative to your stance. The game combines hand and body positioning into a steer-and-transfer drill.'],
 ['backside-airs','Backside airs','FIRST AIRS',10.3,.06,.04,[goal('backsideAirs',1,'Backside 180° air and ride-away')],
  'Pop and rotate 180° away from your chest. Change wing hands and ride away from an upright landing.',
  'With left foot forward, steer LEFT in the air; with right foot forward, RIGHT. Ease and transfer through the turn. Center at 180°.',
  'Backside turns away from your chest. Keep track of the landing heading and release rotation before touchdown.'],
 ['air-tacks','Air tacks','AIR CONTROL',10.5,.05,.03,[goal('airTacks',1,'Airborne upwind tack with a wing transfer')],
  'Pop, turn 180° through upwind in the air, transfer the wing while unloaded and land on the other reach.',
  'Start across the wind. Pop, steer toward 0°, ease and transfer at head-to-wind, then center steering near 180° of rotation.',
  'An air tack must cross upwind while the foil is clear and include a wing hand change. A surface tack does not count.'],
 ['360s','Aerial 360s','AIR CONTROL',10.5,.055,.035,[goal('spins',1,'Full airborne 360° and ride-away')],
  'Make one full horizontal revolution in the air, land upright on your starting heading and ride away.',
  'Charge a strong pop. Hold LEFT or RIGHT in the air; watch the spin angle. Center just before 360° and keep the wing supported.',
  'This course teaches an aerial 360. A gliding 360 stays on the water and is a different maneuver.'],
 ['backflips','Backflips','FREESTYLE',10.8,.05,.035,[goal('backflips',1,'Backward full flip and ride-away')],
  'Complete one backward airborne flip, land upright and ride away. This is a simplified freestyle game drill.',
  'Charge a strong pop. Hold BACK / S in the air, then center near 360° of flip. Keep heading steady and wing power around 65%.',
  'The game measures a complete backward rotation and a controlled landing. Centering brakes rotation; it never completes a half-finished flip for you.'],
 ['frontflips','Frontflips','FREESTYLE',10.8,.05,.035,[goal('frontflips',1,'Forward full flip and ride-away')],
  'Complete one forward airborne flip, land upright and ride away to finish the progression.',
  'Charge a strong pop. Hold FRONT / W in the air, then center near 360° of flip. Keep heading steady and spot the water.',
  'A forward flip needs enough height, a full rotation and a level exit. Freestyle controls simplify real equipment handling.']
];
const LESSONS=definitions.map(([id,name,stage,wind,swell,gust,goals,brief,tip,learn],i)=>({id,name,stage,tag:String(i+1).padStart(2,'0')+' · '+stage,wind,swell,gust,goals,...goals[0],brief,tip,learn,...(id==='wave-riding'?{waveDirection:Math.PI/2,waveLength:24,chop:.3}:id==='downwind-gliding'?{waveDirection:Math.PI,waveLength:26,chop:.35}:{})}));
// Keep personal records and archive old course stars. The new goals are not
// equivalent to the old index-based course, so none are silently relabelled.
function readProgress(raw){
 const out={lessons:{},legacyLessons:{},bestFlight:0,bestScore:0,sound:true,assist:true,otherFoilers:5,expertRatio:.6};
 if(!raw||![1,2].includes(raw.version))return out;
 for(const key of ['bestFlight','bestScore'])if(Number.isFinite(raw[key]))out[key]=Math.max(0,raw[key]);if(Number.isFinite(raw.otherFoilers))out.otherFoilers=Math.max(0,Math.min(25,Math.round(raw.otherFoilers)));if(Number.isFinite(raw.expertRatio))out.expertRatio=Math.max(0,Math.min(1,raw.expertRatio));out.sound=raw.sound!==false;out.assist=raw.assist!==false;
 function clean(items,allowed){const result={};if(items&&typeof items==='object')for(const [id,item] of Object.entries(items))if(allowed(id)&&Number.isFinite(item?.stars))result[id]={stars:Math.max(1,Math.min(3,Math.floor(item.stars))),score:Number.isFinite(item.score)?Math.max(0,item.score):0};return result;}
 out.lessons=raw.version===2?clean(raw.lessons,id=>LESSONS.some(l=>l.id===id)):{};
 out.legacyLessons=clean(raw.version===1?raw.lessons:raw.legacyLessons,id=>/^([0-9]|1[01])$/.test(id));return out;
}
const api={LESSONS,readProgress};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FoilLessons=api;
})(globalThis);
