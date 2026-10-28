/* Display interpolation only. Simulation, collision and rewards stay at 60 Hz. */
(function(root){
'use strict';
const fields=['x','z','time','heading','height','pitch','roll','standAmount','trim','wingAngle','pumpPulse','balance','steer','speed','lateralSpeed','vertical','wind'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function create(){
 let previous=null,owner=null,view=null;
 function capture(s){if(owner!==s){owner=s;view=Object.create(s);Object.defineProperty(view,'simulation',{value:s});}previous??={};previous.mode=s.mode;previous.air=!!s.air;for(const key of fields)previous[key]=s[key];previous.boardY=s.lastSea+s.height;previous.fold=s.wingDive?.fold||0;previous.shake=s.wingDive?.shake||0;}
 function sample(s,alpha){
  // Falls, jumps, remounts and location changes start from their actual pose.
  if(owner!==s||!previous||s.mode!=='sailing'||previous.mode!=='sailing'||s.air||previous.air||Math.hypot(s.x-previous.x,s.z-previous.z)>10)return s;
  const t=clamp(alpha,0,1);for(const key of fields){const a=previous[key],b=s[key];view[key]=key==='heading'?a+wrap(b-a)*t:a+(b-a)*t;}
  // Interpolate the actual board/foil altitude. Interpolating clearance and
  // adding a freshly sampled wave would reintroduce chop between physics ticks.
  view.boardY=previous.boardY+(s.lastSea+s.height-previous.boardY)*t;
  view.wingDive={...s.wingDive,fold:previous.fold+((s.wingDive?.fold||0)-previous.fold)*t,shake:previous.shake+((s.wingDive?.shake||0)-previous.shake)*t};
  return view;
 }
 return {capture,sample};
}
const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FoilViewMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
