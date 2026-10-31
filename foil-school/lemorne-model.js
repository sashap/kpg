/* Le Morne's beach grades and playable lagoon. Reef outlines are mapped;
   depths are deliberately approximate, not a tidal or navigation survey. */
(function(root){'use strict';
function create(raw,project,inside,distance,elevation){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
 const reefs=raw.reefs.map(r=>({...r,points:r.points.map(project)}));
 for(const r of reefs){const xs=r.points.map(p=>p[0]),zs=r.points.map(p=>p[1]);r.bounds=[Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)];}
 const lagoon=[[-20.427,57.312],[-20.451,57.304],[-20.465,57.3005],[-20.474,57.303],[-20.478,57.310],[-20.484,57.325],[-20.49,57.35],[-20.51,57.39],[-20.42,57.40],[-20.427,57.312]].map(project);
 // Radar grids soften the near-vertical basalt rim into a rounded slope.
 // Use the mapped OSM cliff line to concentrate that same sampled relief
 // at the escarpment. Summit heights stay in the DEM's range. Both collision
 // and rendering use this terrain; there is no detached decorative mountain.
 const rim=raw.cliffRim.map(project),cliffs=[];
 for(let i=1;i<rim.length;i++){const a=rim[i-1],b=rim[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<2)continue;let nx=-dz/len,nz=dx/len;const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;if(!inside(x+nx*5,z+nz*5,rim)){nx=-nx;nz=-nz;}
  cliffs.push({a,b,dx,dz,len,nx,nz,top:[a,b].map(p=>Math.max(elevation(...p)||0,elevation(p[0]+nx*65,p[1]+nz*65)||0)),foot:[a,b].map(p=>elevation(p[0]-nx*100,p[1]-nz*100)||0)});
 }
 function cliffHeight(x,z,measured){
  if(measured<90||z<1300||z>2250||x< -700||x>250)return measured;
  let closest=null,best=130,t=0;
  for(const c of cliffs){const u=clamp(((x-c.a[0])*c.dx+(z-c.a[1])*c.dz)/(c.len*c.len),0,1),d=Math.hypot(x-c.a[0]-c.dx*u,z-c.a[1]-c.dz*u);if(d<best){best=d;closest=c;t=u;}}
  if(!closest)return measured;const c=closest,top=c.top[0]*(1-t)+c.top[1]*t,foot=c.foot[0]*(1-t)+c.foot[1]*t;
  if(top<foot+65)return measured;
  if(inside(x,z,rim)){const blend=smooth(best/95);return Math.max(measured,top*(1-blend)+measured*blend);}
  const wall=foot+(top-foot)*smooth((62-best)/62),blend=1-smooth((best-70)/60);
  return measured*(1-blend)+wall*blend;
 }
 function reefDepth(x,z){let depth=Infinity;for(const r of reefs){const [x0,z0,x1,z1]=r.bounds;if(x<x0-45||x>x1+45||z<z0-45||z>z1+45)continue;const d=distance(x,z,r.points),inner=inside(x,z,r.points);depth=Math.min(depth,inner?.65+.18*Math.sin(x*.015)*Math.cos(z*.017):.8+d*.075);}return depth;}
 function height(x,z,shore,measured){
  if(shore<=0){const sheltered=inside(x,z,lagoon),base=sheltered?3.65+Math.sin(x*.0016+z*.0007)*.40:Math.min(24,6+distance(x,z,lagoon)*.018);return -Math.min(base,Math.max(.04,-shore*.033),reefDepth(x,z));}
  // GLO-30 includes tree canopies and roofs. Suppress these on the low coastal
  // plain; retain the mountain's measured relief at its full vertical scale.
  if(Math.hypot(x,z)>4000&&measured<.35)return -8;
  const y=Math.max(0,cliffHeight(x,z,measured)),plain=1.25+y*.085,blend=smooth((y-18)/55);
  return Math.max(.025,(plain*(1-blend)+y*blend)*smooth(shore/17));
 }
 return {reefs,lagoon,height,reefDepth,cliffs};
}
const api={create};root.FoilLeMorne=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
