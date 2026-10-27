/* Shared, photo-guided waterfront layout. Coordinates are metres after projection. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lotIds={shoreline:['32405130','199282342'],third:['138632877'],coyote:['30637118','1250229259','1095764670','370817280','1250229260','1041282472']};
function parking(site,features,inside,distance){
 const lots=features.parking.filter(p=>(lotIds[site]||[]).includes(p.id)),aisles=features.parkingAisles.filter(a=>lots.some(l=>a.points.some(p=>inside(...p,l.points)||distance(...p,l.points)<8))),stalls=[];
 for(const aisle of aisles){let remaining=1.5;
  for(let i=1;i<aisle.points.length;i++){const a=aisle.points[i-1],b=aisle.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.01)continue;const tx=(b[0]-a[0])/len,tz=(b[1]-a[1])/len;
   for(;remaining<len;remaining+=2.75)for(const side of [-1,1]){
    const x=a[0]+tx*remaining-tz*side*5.5,z=a[1]+tz*remaining+tx*side*5.5,nx=-tz*side,nz=tx*side;
    const corners=[[-1.3,-2.45],[1.3,-2.45],[1.3,2.45],[-1.3,2.45]].map(([u,v])=>[x+tx*u+nx*v,z+tz*u+nz*v]);
    const overlaps=q=>[ [tx,tz],[nx,nz],[q.tx,q.tz],[q.nx,q.nz] ].every(([ux,uz])=>Math.abs((x-q.x)*ux+(z-q.z)*uz)<1.3*(Math.abs(tx*ux+tz*uz)+Math.abs(q.tx*ux+q.tz*uz))+2.45*(Math.abs(nx*ux+nz*uz)+Math.abs(q.nx*ux+q.nz*uz))-.025);
    const lot=lots.find(l=>corners.every(p=>inside(...p,l.points)));if(!lot||aisles.some(q=>corners.some(p=>distance(...p,q.points)<2.7))||stalls.some(overlaps))continue;
    stalls.push({x,z,tx,tz,nx,nz,angle:Math.atan2(nx,nz),corners,lot:lot.id});
   }
   remaining-=len;
  }
 }
 return {lots,aisles,stalls};
}
function access(site,project,elevation,datum){
 if(site!=='third')return null;
 // Aerial + daytime launch photos: the concrete ramp is north of the lower
 // parking/turf area; the sandy kite beach is a separate access farther south.
 const a=project([37.57347,-122.27946]),b=project([37.57372,-122.27953]),dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),top=Math.max(2.9,elevation(...a)-datum),width=4.2;
 const ramp={a,b,length,width,top,nx:-dz/length,nz:dx/length};
 function at(x,z,buffer=0){const t=((x-a[0])*dx+(z-a[1])*dz)/(length*length),cross=((x-a[0])*dz-(z-a[1])*dx)/length;if(t<-.02-buffer/length||t>1.03+buffer/length||Math.abs(cross)>width/2+buffer)return null;return {height:top+(-.45-top)*clamp(t,0,1),t,cross};}
 const dock=project([37.57316,-122.27917]),gangway=project([37.57316,-122.27935]);
 function dockAt(x,z){if(Math.abs(x-dock[0])<2.6&&Math.abs(z-dock[1])<1.9)return .48;const t=clamp((x-gangway[0])/(dock[0]-gangway[0]),0,1);if(x<=gangway[0]&&x>=dock[0]&&Math.abs(z-dock[1])<.65)return 2.1*(1-t)+.48*t;return -Infinity;}
 const flag=project([37.573485,-122.27948]);
 // The lower turf / launch path is open to the shore, without the wall
 // present on other stretches of the rebuilt levee.
 const lower=project([37.57105,-122.2801]),upper=project([37.57379,-122.2783]);
 const inStaging=(x,z)=>x>=upper[0]&&x<=lower[0]&&z>=lower[1]&&z<=upper[1];
 const fences=[
  [[37.57206,-122.27966],[37.57301,-122.27965]],
  [[37.573025,-122.27965],[37.573025,-122.27955]],
  [[37.573025,-122.27950],[37.573025,-122.27940]],
  [[37.573025,-122.27940],[37.57266,-122.279405]],
  [[37.57261,-122.279405],[37.57199,-122.27942]],
  [[37.57198,-122.27942],[37.57198,-122.27962]]
 ].map(p=>p.map(project));
 return {ramp,at,dock,gangway,dockAt,flag,inStaging,fences};
}
function levee(features,shore,terrain,access,beaches,inside,distance){
 const trail=features.paths.find(p=>p.id==='44422697'),segments=[];if(!trail)return segments;
 for(let i=1;i<trail.points.length;i++){const a=trail.points[i-1],b=trail.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),n=Math.ceil(length/3);let nx=-dz/length,nz=dx/length;if(shore((a[0]+b[0])/2+nx*4,(a[1]+b[1])/2+nz*4)>shore((a[0]+b[0])/2-nx*4,(a[1]+b[1])/2-nz*4)){nx=-nx;nz=-nz;}
  for(let j=0;j<n;j++){const u=j/n,v=(j+1)/n,x=a[0]+dx*(u+v)/2,z=a[1]+dz*(u+v)/2,d=shore(x,z);if(access.inStaging(x,z)||d<3||d>32||Math.hypot(x,z)>1450||access.at(x,z,5)||Math.hypot(x-access.gangway[0],z-access.gangway[1])<5||beaches.some(p=>inside(x,z,p)||distance(x,z,p)<7))continue;
   const aa=[a[0]+dx*u+nx*2.8,a[1]+dz*u+nz*2.8],bb=[a[0]+dx*v+nx*2.8,a[1]+dz*v+nz*2.8],points=[[aa[0]-nx*.28,aa[1]-nz*.28],[bb[0]-nx*.28,bb[1]-nz*.28],[bb[0]+nx*.28,bb[1]+nz*.28],[aa[0]+nx*.28,aa[1]+nz*.28],[aa[0]-nx*.28,aa[1]-nz*.28]],ya=terrain(a[0]+dx*u,a[1]+dz*u)+.13,yb=terrain(a[0]+dx*v,a[1]+dz*v)+.13;
   segments.push({a:aa,b:bb,ya,yb,nx,nz,points,y:Math.min(ya,yb)-.2,height:.98});
  }
 }
 return segments;
}
const api={parking,access,levee,lotIds};root.FoilWaterfront=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
