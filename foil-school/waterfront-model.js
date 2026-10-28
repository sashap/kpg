/* Shared, photo-guided waterfront layout. Coordinates are metres after projection. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lotIds={kahului:['289835437','452966553','289836357','289836359','puunene-harbor-parking'],shoreline:['32405130','199282342'],third:['138632877'],coyote:['30637118','1250229259','1095764670','370817280','1250229260','1041282472']};
function prepare(site,raw){
 if(site!=='third')return raw;
 // The imported sand outline stops 6–10 m inland of the imported coastline.
 // Match its water-facing edge to that coastline, with a small submerged
 // apron. The Lower Beach photo and local feedback show open sand to water,
 // with rock armor continuing only beyond the two ends of this opening.
 return {...raw,ground:raw.ground.map(f=>f.id==='973557137'?{...f,points:[
  [37.5717507,-122.2792283],[37.5715851,-122.2786017],[37.5715596,-122.278031],
  ...f.points.slice(3,-1),[37.5717507,-122.2792283]
 ]}:f)};
}
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
 const a=project([37.57347,-122.27946]),b=project([37.57372,-122.27953]),dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),top=3.15,width=4.2;
 const ramp={a,b,length,width,top,nx:-dz/length,nz:dx/length};
 function at(x,z,buffer=0){const t=((x-a[0])*dx+(z-a[1])*dz)/(length*length),cross=((x-a[0])*dz-(z-a[1])*dx)/length;if(t<-.02-buffer/length||t>1.03+buffer/length||Math.abs(cross)>width/2+buffer)return null;return {height:top+.008+(-.45-top)*clamp((t*length-2)/(length-2),0,1),t,cross};}
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
// The golf-course waterfront trail has no storm-surge wall. Its newly paved
// surface follows one continuous engineered grade, not the coarse terrain grid.
function levee(){return [];}
function trail(raw,project){
 const source=raw.paths.find(p=>p.id==='44422697');if(!source)return null;
 const points=source.points.map(project),segments=[],bins=new Map(),height=3.15,width=3.8;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),s={a,b,dx,dz,length};segments.push(s);for(let x=Math.floor((Math.min(a[0],b[0])-22)/64);x<=Math.floor((Math.max(a[0],b[0])+22)/64);x++)for(let z=Math.floor((Math.min(a[1],b[1])-22)/64);z<=Math.floor((Math.max(a[1],b[1])+22)/64);z++){const k=x+','+z;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(s);}}
 function nearest(x,z){let best=null;for(const s of bins.get(Math.floor(x/64)+','+Math.floor(z/64))||[]){const t=clamp(((x-s.a[0])*s.dx+(z-s.a[1])*s.dz)/(s.length*s.length),0,1),px=s.a[0]+t*s.dx,pz=s.a[1]+t*s.dz,distance=Math.hypot(x-px,z-pz);if(!best||distance<best.distance)best={x:px,z:pz,distance};}return best;}
 const surface=(x,z)=>{const p=nearest(x,z);return p&&p.distance<=width/2+.04?height:-Infinity;};
 return {id:source.id,points,segments,height,width,nearest,surface};
}
// Arbor's daytime north/upper-launch views show an open grass bank here.
// Trees belong to inland fairway groups, not a row along the waterfront path.
const golfBankOutline=[[37.57334,-122.27990],[37.57406,-122.27998],[37.57462,-122.28165],[37.57485,-122.28415],[37.57469,-122.28545],[37.57420,-122.28530],[37.57410,-122.28295],[37.57331,-122.28090],[37.57334,-122.27990]];
function golfBank(project){return golfBankOutline.map(project);}
const api={prepare,parking,access,levee,trail,lotIds,golfBank};root.FoilWaterfront=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
