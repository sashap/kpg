/* Engineered Coyote waterfront grade, independent of coarse DEM bumps.
   Mapped Bay Trail -> Promenade Trail, Meta frontage through the public beach. */
(function(root){'use strict';
function create(raw,project,signedShore){
 const ids=['974840194','974840185','974840186','974834142','1042753580','1042753579','1182623057','29407865','35972360','1035915965','1095764662','1035915963'],line=[];
 for(const id of ids){let p=raw.paths.find(p=>p.id===id).points.slice();if(!line.length)p.reverse();else if(JSON.stringify(p.at(-1))===JSON.stringify(line.at(-1)))p.reverse();if(line.length&&JSON.stringify(p[0])!==JSON.stringify(line.at(-1)))throw new Error('Disconnected promenade '+id);line.push(...(line.length?p.slice(1):p));}
 const points=[],source=line.map(project);for(let i=1;i<source.length;i++){const a=source[i-1],b=source[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);for(let j=0;j<n;j++)points.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}points.push(source.at(-1));
 const height=2.8,width=4,bins=new Map(),key=(x,z)=>Math.floor(x/32)+','+Math.floor(z/32),segments=[];
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=dz/length,nz=-dx/length,mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],side=signedShore(mid[0]+nx*5,mid[1]+nz*5)<signedShore(mid[0]-nx*5,mid[1]-nz*5)?1:-1,s={a,b,dx,dz,length,nx:nx*side,nz:nz*side,index:i-1};segments.push(s);for(let x=Math.floor((Math.min(a[0],b[0])-24)/32);x<=Math.floor((Math.max(a[0],b[0])+24)/32);x++)for(let z=Math.floor((Math.min(a[1],b[1])-24)/32);z<=Math.floor((Math.max(a[1],b[1])+24)/32);z++){const k=x+','+z;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(s);}}
 function nearest(x,z){let best=null;for(const s of bins.get(key(x,z))||[]){const t=Math.max(0,Math.min(1,((x-s.a[0])*s.dx+(z-s.a[1])*s.dz)/(s.length*s.length))),px=s.a[0]+s.dx*t,pz=s.a[1]+s.dz*t,d=Math.hypot(x-px,z-pz);if(!best||d<best.distance)best={x:px,z:pz,distance:d,across:(x-px)*s.nx+(z-pz)*s.nz,nx:s.nx,nz:s.nz,index:s.index};}return best;}
 const rampCoords=[[37.58813,-122.33112],[37.58850,-122.32970],[37.58886,-122.32830]],ramps=rampCoords.map(p=>{const q=nearest(...project(p));let length=10;while(length<24&&signedShore(q.x+q.nx*length,q.z+q.nz*length)>-3)length+=1;return {x:q.x,z:q.z,nx:q.nx,nz:q.nz,length,width:4.8};});
 function rampAt(x,z,margin=0){for(const r of ramps){const dx=x-r.x,dz=z-r.z,t=dx*r.nx+dz*r.nz,cross=Math.abs(dx*r.nz-dz*r.nx);if(t>=-margin-.001&&t<=r.length+margin+.001&&cross<=r.width/2+margin+.001)return {height:height-(height+.35)*Math.max(0,Math.min(1,(t-3)/(r.length-3))),r,t};}return null;}
 function inOpening(x,z){return ramps.some(r=>Math.abs((x-r.x)*r.nz-(z-r.z)*r.nx)<r.width/2+.2&&Math.hypot(x-r.x,z-r.z)<r.length+2);}
 function surface(x,z){const q=nearest(x,z);let h=-Infinity;if(q&&q.across>=-2.05&&q.across<=3.65&&q.distance<3.66)h=height;if(q&&q.distance<3.71&&q.across>3.1&&q.across<3.7&&!inOpening(x,z))h=height+.43;const ramp=rampAt(x,z);return Math.max(h,ramp?.height??-Infinity);}
 return {ids:new Set(ids),points,segments,height,width,nearest,ramps,rampAt,inOpening,surface};
}
const api={create};root.FoilPromenade=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
