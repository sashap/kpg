/* Geographic sites in metres: +X west, +Z north. Land elevations use USGS 3DEP; water depths remain modeled. */
(function(root){
'use strict';
const data=typeof module!=='undefined'&&module.exports?require('./location-data.js'):root.FoilLocationData;
const elevations=typeof module!=='undefined'&&module.exports?require('./elevations.js'):root.FoilElevations;
const promenadeModel=typeof module!=='undefined'&&module.exports?require('./promenade.js'):root.FoilPromenade;
const waterfront=typeof module!=='undefined'&&module.exports?require('./waterfront-model.js'):root.FoilWaterfront;
const harborModel=typeof module!=='undefined'&&module.exports?require('./harbor-model.js'):root.FoilHarbor;
const kahuluiData=typeof module!=='undefined'&&module.exports?require('./kahului-data.js'):root.FoilKahuluiData;
const playgroundModel=typeof module!=='undefined'&&module.exports?require('./playground.js'):root.FoilPlayground;
const landmarkData=typeof module!=='undefined'&&module.exports?require('./landmark-data.js'):root.FoilLandmarkData;
const sites=[
 {id:'academy',name:'Academy Bay',subtitle:'A sheltered island coast',description:'Castle ruins, a lighthouse, and quiet coves. The original practice bay.',limit:480,chartRange:620},
 {id:'shoreline',name:'Shoreline Park Lake',subtitle:'Mountain View, California',description:'A compact lake with its boathouse, floating docks, colorful boats, and bird island.',origin:[37.43312,-122.09025],limit:650,chartRange:650,windFrom:Math.PI/8,launch:[37.43296,-122.0882]},
 {id:'third',name:'3rd Avenue · Lower Launch',subtitle:'Foster City, California',description:'Rock-lined launch coves, the levee and Bay Trail, golf greens, and the San Mateo Bridge.',origin:[37.57318,-122.2778],start:[37.5739,-122.2782],limit:2200,chartRange:2400,windFrom:Math.PI*3/8,launch:[37.57347,-122.27946]},
 {id:'coyote',name:'Coyote Point Beach',subtitle:'San Mateo, California',description:'A wooded headland, beach promenade, marina, and SFO across the water with arriving aircraft.',origin:[37.5921,-122.3294],limit:4500,chartRange:5600,windFrom:Math.PI*3/8,launch:[37.58902,-122.32815]},
 {id:'kahului',name:'Kahului Harbor',subtitle:'Ho‘aloha Park · Maui, Hawai‘i',description:'A sandy canoe-club launch, palms, lava-rock breakwaters, working cargo piers and the West Maui mountains.',origin:[20.89415,-156.47015],launch:[20.89252,-156.46889],limit:2350,chartRange:2700,windFrom:-Math.PI/4},
 {id:'crissy',name:'Crissy Field South Beach',subtitle:'East Beach launch · San Francisco',description:'The Presidio waterfront, Golden Gate Bridge, Fort Point, Alcatraz, and the Marin Headlands.',origin:[37.8081,-122.4534],limit:3600,chartRange:4800,windFrom:Math.PI/2,launch:[37.8064,-122.4505]}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function inside(x,z,p){let odd=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])odd=!odd;}return odd;}
function distance(x,z,p){let d=Infinity;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);d=Math.min(d,(x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2);}return Math.sqrt(d);}
function create(id){
 const site=sites.find(s=>s.id===id)||sites[0];if(site.id==='academy')return null;
 const baseRaw=site.id==='kahului'?harborModel.prepare(kahuluiData):data[site.id],extra=landmarkData[site.id],raw=extra?{...baseRaw,buildings:[...(baseRaw.buildings||[]),...extra.buildings],piers:[...(baseRaw.piers||[]),...extra.piers]}:baseRaw,project=([lat,lon])=>[-(lon-site.origin[1])*111320*Math.cos(site.origin[0]*Math.PI/180),(lat-site.origin[0])*111320],line=p=>p.map(project),coast=raw.coast?line(raw.coast):null,water=raw.water?line(raw.water):null,polygons=(raw.islands||[]).map(line);
 if(coast){const xs=coast.map(p=>p[0]),zs=coast.map(p=>p[1]);polygons.unshift([...coast,[Math.max(...xs)+8000,Math.min(...zs)-10000],[Math.min(...xs)-5000,Math.min(...zs)-10000],coast[0]]);}
 if(raw.marin){const p=line(raw.marin),maxZ=Math.max(...p.map(p=>p[1]));polygons.push([...p,[p.at(-1)[0],maxZ+8000],[p[0][0],maxZ+8000],p[0]]);}
 if(raw.eastCoast){const p=line(raw.eastCoast),minX=Math.min(...p.map(p=>p[0]));polygons.push([...p,[minX-10000,p.at(-1)[1]],[minX-10000,p[0][1]],p[0]]);}
 const ponds=(raw.ponds||[]).map(line);
 const harbor=site.id==='kahului'?harborModel.create(raw,project,inside,distance):null;
 const edges=[...(water?[water]:[]),...polygons,...ponds];
 function signedShore(x,z){let land=water?!inside(x,z,water):false;for(const p of polygons)if(inside(x,z,p)){land=true;break;}for(const p of ponds)if(inside(x,z,p))land=false;let d=Infinity;for(const p of edges)d=Math.min(d,distance(x,z,p));return (land?1:-1)*d;}
 const ramps=[];
 const promenade=site.id==='coyote'?promenadeModel.create(raw,project,signedShore):null;
 const trail=site.id==='third'?waterfront.trail(raw,project):null;
 const golfBank=site.id==='third'?waterfront.golfBank(project):null;
 const openGolfBank=(x,z)=>golfBank&&inside(x,z,golfBank);
 const waterDatum=elevations.waterDatum(site.id);
 const elevationAt=(x,z)=>elevations.height(site.id,site.origin[0]+z/111320,site.origin[1]-x/(111320*Math.cos(site.origin[0]*Math.PI/180)));
 const shoreAccess=waterfront.access(site.id,project,elevationAt,waterDatum);
 const beaches=(raw.ground||[]).filter(p=>p.kind==='beach').map(p=>line(p.points));
 // The narrow rebuilt levee cannot be resolved by the bare-earth DEM. Its
 // rock face rises about three metres in six metres horizontally. Keep the
 // mapped beaches open and retain the DEM away from the engineered bank.
 function bankHeight(x,z,d){if(site.id!=='third'||d<0||d>24||Math.hypot(x,z)>1500||beaches.some(p=>inside(x,z,p)||distance(x,z,p)<2))return null;return 3.05*clamp(d/5.6,0,1);}
 const detailBounds=site.id==='third'?{x0:88,x1:216,z0:-216,z1:112}:null;
 function inDetail(x,z){return detailBounds&&x>detailBounds.x0&&x<detailBounds.x1&&z>detailBounds.z0&&z<detailBounds.z1;}
 function rawHeight(x,z){const d=signedShore(x,z),measured=elevationAt(x,z),height=(measured??waterDatum)-waterDatum;
  // Distant terrain follows the DEM, including headlands beyond the mapped
  // local coastline. Bare-earth water pixels are not underwater bathymetry.
  if(Math.hypot(x,z)>2800)return height>.05?height:-10;
  if(d<=0){const bottom=-Math.min(site.id==='shoreline'?4:site.id==='kahului'?10.6:10,Math.max(.04,-d*(site.id==='third'?.024:.045)));const entry=shoreAccess?.at(x,z,1.4);return entry?Math.min(bottom,entry.height-.15):bottom;}
  let y=Math.max(.04,height);
  const engineered=harbor?.height(x,z,d,y);if(engineered!==null&&engineered!==undefined)return engineered;
  // Blend the survey grid to the mapped waterline over one shoreline cell.
  y*=clamp(d/5,0,1);
  const bank=bankHeight(x,z,d);if(bank!==null){const blend=clamp((24-d)/10,0,1);y=y*(1-blend)+bank*blend;}
  for(const r of ramps)if(Math.hypot(x-r[0],z-r[1])<7)y=Math.min(y,.08+d*.20);
  // Cut a smooth corridor below the engineered deck so neither terrain nor
  // its grass overlays can poke through the paving between DEM vertices.
  const path=promenade?.nearest(x,z);if(path&&path.distance<23){const cut=clamp((23-path.distance)/11,0,1);y-=Math.max(0,y-(promenade.height-.18))*cut;if(path.across<0){const blend=clamp((23-path.distance)/12,0,1);y=y*(1-blend)+(promenade.height-.10)*blend;}}
  const paved=trail?.nearest(x,z);if(paved&&paved.distance<20){const blend=clamp((20-paved.distance)/16,0,1);y=y*(1-blend)+(trail.height-.16)*blend;}
  const ramp=promenade?.rampAt(x,z,8);if(ramp)y=Math.min(y,ramp.height-.18);
  const entry=shoreAccess?.at(x,z,1.4);if(entry)y=Math.min(y,entry.height-.12);
  return y;
 }
 function grid(half,step,hole=0){const n=Math.round(half*2/step),points=[],indices=[],h=new Float32Array((n+1)**2);for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=-half+i*step,z=-half+j*step,y=Math.fround(rawHeight(x,z));h[j*(n+1)+i]=y;points.push([x,y,z,clamp(.5+Math.sin(x*.018)*.15+Math.cos(z*.011)*.12,0,1)]);if(i<n&&j<n&&!(Math.abs(x+step/2)<hole&&Math.abs(z+step/2)<hole)&&!(half===960&&inDetail(x+step/2,z+step/2))){const a=j*(n+1)+i;indices.push(a,a+n+1,a+1,a+1,a+n+1,a+n+2);}}
  return {points,indices,n,step,half,h};}
 const near=grid(site.id==='shoreline'?720:960,site.id==='shoreline'?6:8),middle=grid(3840,site.id==='shoreline'?24:32,site.id==='shoreline'?720:960),far=grid(site.id==='kahului'?25600:12000,160,3840);
 function sample(g,x,z){const u=clamp((x+g.half)/g.step,0,g.n-.000001),v=clamp((z+g.half)/g.step,0,g.n-.000001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*(g.n+1)+i,h=g.h;if(a+b<=1)return h[k]+a*(h[k+1]-h[k])+b*(h[k+g.n+1]-h[k]);return h[k+g.n+2]+(1-a)*(h[k+g.n+1]-h[k+g.n+2])+(1-b)*(h[k+1]-h[k+g.n+2]);}
 // One-metre cells at the lower launch preserve the steep bank and clear
 // ramp. The outer ring meets the eight-metre mesh exactly, without seams.
 let launchSurface=null;
 if(detailBounds){const {x0,x1,z0,z1}=detailBounds,n=x1-x0,m=z1-z0,h=new Float32Array((n+1)*(m+1)),points=[],indices=[];for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){const x=x0+i,z=z0+j,edge=Math.min(i,j,n-i,m-j),blend=clamp(edge/8,0,1),y=Math.fround(sample(near,x,z)*(1-blend)+rawHeight(x,z)*blend),k=j*(n+1)+i;h[k]=y;points.push([x,y,z,.6]);if(i<n&&j<m)indices.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}launchSurface={x0,z0,n,m,h,points,indices};}
 function terrainHeight(x,z){if(inDetail(x,z)&&launchSurface){const s=launchSurface,u=x-s.x0,v=z-s.z0,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*(s.n+1)+i,h=s.h;if(a+b<=1)return h[k]+a*(h[k+1]-h[k])+b*(h[k+s.n+1]-h[k]);return h[k+s.n+2]+(1-a)*(h[k+s.n+1]-h[k+s.n+2])+(1-b)*(h[k+1]-h[k+s.n+2]);}return Math.abs(x)<=near.half&&Math.abs(z)<=near.half?sample(near,x,z):Math.abs(x)<=middle.half&&Math.abs(z)<=middle.half?sample(middle,x,z):sample(far,x,z);}
 const playground=site.id==='shoreline'?playgroundModel.create(project,terrainHeight):site.id==='coyote'?playgroundModel.createCoyote(project,terrainHeight):null;
 const shoreRocks=[],rockBins=new Map();let rockSeed=2891;const rand=()=>{rockSeed=(1664525*rockSeed+1013904223)>>>0;return rockSeed/4294967296;};
 const edge=coast||water;for(let i=1;i<edge.length;i++){const a=edge[i-1],b=edge[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<.1)continue;let nx=-dz/length,nz=dx/length;const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;if(signedShore(mx+nx*3,mz+nz*3)<0){nx=-nx;nz=-nz;}
  for(let t=.5;t<length;t+=site.id==='shoreline'?2.4:site.id==='coyote'||site.id==='third'?1.18:2.0){const x=a[0]+dx*t/length,z=a[1]+dz*t/length;if(Math.hypot(x,z)>1700)continue;const lat=site.origin[0]+z/111320,lon=site.origin[1]-x/(111320*Math.cos(site.origin[0]*Math.PI/180));
   if(site.id==='kahului'&&(lat<20.8936||lon> -156.470&&lat<20.899))continue;
   if(site.id==='crissy'&&lon> -122.470)continue;if(site.id==='coyote'&&(lon< -122.340||lon> -122.319||lon> -122.3276&&lon< -122.3246))continue;
   if(site.id==='shoreline'&&lat<37.4326&&lon> -122.089)continue;if(ramps.some(r=>Math.hypot(x-r[0],z-r[1])<7)||promenade?.rampAt(x,z))continue;
   const small=site.id==='shoreline',rows=small?1:site.id==='coyote'?4:5;
   for(let k=0;k<rows;k++){const off=small?.4:k*(site.id==='coyote'||site.id==='third'?1.1:1.55)-.35,px=x+nx*off+(rand()-.5)*.7,pz=z+nz*off+(rand()-.5)*.7,rx=small?.3+rand()*.23:(site.id==='coyote'||site.id==='third'?.82:.58)+rand()*.48,ry=rx*(.55+rand()*.25),rz=rx*(.75+rand()*.4),rock={x:px,z:pz,y:Math.max(-.12,terrainHeight(px,pz))+ry*.25,rx,ry,rz,angle:rand()*Math.PI,index:shoreRocks.length};if(shoreAccess?.at(px,pz,1.5)||beaches.some(p=>inside(px,pz,p)||distance(px,pz,p)<Math.max(rx,rz)+1))continue;const road=trail?.nearest(px,pz);if(road&&road.distance<trail.width/2+Math.max(rx,rz)+.25)continue;const pavement=promenade?.nearest(px,pz);if(pavement&&pavement.distance<4.4||promenade?.rampAt(px,pz,Math.max(rx,rz)+.25))continue;shoreRocks.push(rock);const key=Math.floor(px/8)+','+Math.floor(pz/8);if(!rockBins.has(key))rockBins.set(key,[]);rockBins.get(key).push(rock);}
  }
 }
 // Armor the shoulders of the central Coyote ramp all the way to the wall.
 // The previous shore-following rows stopped low on the slope. These share
 // the concrete grade, with their full rock volume outside the clear ramp.
 if(promenade){const r=promenade.rigging.ramp;for(const side of [-1,1])for(let d=4.25;d<=r.length+.5;d+=.96)for(let row=0;row<4;row++){
  const rx=d<4.5?.74:.76+rand()*.15,ry=.48+rand()*.13,rz=d<4.5?.74:.75+rand()*.15,along=d+(rand()-.5)*.14,cross=side*(r.width/2+1.15+row*1.02+(rand()-.5)*.12),x=r.x+r.nx*along-r.nz*cross,z=r.z+r.nz*along+r.nx*cross;
  if(promenade.rampAt(x,z,Math.max(rx,rz)+.25)||promenade.nearest(x,z)?.distance<3.8)continue;
  const top=promenade.rampHeight(r,along)+.55+(rand()-.5)*.14,rock={x,z,y:top-ry,rx,ry,rz,angle:rand()*Math.PI,index:shoreRocks.length,rampArmor:true};shoreRocks.push(rock);const key=Math.floor(x/8)+','+Math.floor(z/8);if(!rockBins.has(key))rockBins.set(key,[]);rockBins.get(key).push(rock);
 }}
 if(harbor){
  const addRock=r=>{r.index=shoreRocks.length;shoreRocks.push(r);const key=Math.floor(r.x/8)+','+Math.floor(r.z/8);if(!rockBins.has(key))rockBins.set(key,[]);rockBins.get(key).push(r);};
  // A dense armor mantle covers the breakwaters, including their shoulders.
  // Avoid a smooth earthen-looking crest surrounded by two sparse rock rows.
  for(const b of harbor.breaks){const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);
   for(let x=Math.min(...xs)-2;x<Math.max(...xs)+2;x+=3.4)for(let z=Math.min(...zs)-2;z<Math.max(...zs)+2;z+=3.4){if(!inside(x,z,b.points)&&distance(x,z,b.points)>2)continue;const px=x+(rand()-.5)*.7,pz=z+(rand()-.5)*.7,rx=2.15+rand()*.55,ry=.8+rand()*.55;addRock({x:px,z:pz,y:Math.max(-.2,terrainHeight(px,pz))+ry*.12,rx,ry,rz:rx*(.85+rand()*.2),angle:rand()*Math.PI});}
  }
  // Low overlapping basalt lets a walker scramble across the beach groins.
  // The launch between them remains sandy and open for swimming ashore.
  for(const b of harbor.groins)for(let i=1;i<b.points.length;i++){
   const a=b.points[i-1],c=b.points[i],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
   for(let t=0;t<=len;t+=1.15)for(let side=-b.width/2;side<=b.width/2;side+=1.05){const x=a[0]+dx*t/len+nx*side,z=a[1]+dz*t/len+nz*side,edge=Math.abs(side)/(b.width/2),ry=.39+rand()*.13,top=b.low?.24+rand()*.2:.68+(1-edge)*.35,base=Math.max(top,terrainHeight(x,z)+.13);addRock({x,z,y:base-ry,rx:.93+rand()*.20,ry,rz:.94+rand()*.20,angle:rand()*Math.PI});}
  }
 }
 function rockTop(x,z,r=0){let h=-Infinity;const ix=Math.floor(x/8),iz=Math.floor(z/8);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const p of rockBins.get((ix+a)+','+(iz+b))||[]){const dx=x-p.x,dz=z-p.z,co=Math.cos(p.angle),si=Math.sin(p.angle),u=(dx*co-dz*si)/(p.rx+r),v=(dx*si+dz*co)/(p.rz+r),d=u*u+v*v;if(d<1)h=Math.max(h,p.y+p.ry*Math.sqrt(1-d));}return h;}
 const features={};for(const kind of ['buildings','piers','paths','runways','ground','parking','parkingAisles','roads'])features[kind]=(raw[kind]||[]).map(f=>({...f,points:line(f.points)}));
 // Buildings use their actual footprints for both walls and collision. Nearby
 // unlabeled boathouse buildings are retained too. Paths and beaches stay open.
 const solids=features.buildings.filter(b=>b.style!=='canoe-hale'&&b.style!=='shelter-solar'&&Math.hypot(...b.points[0])<site.limit+120).map(b=>{const c=b.points.reduce((a,p)=>[a[0]+p[0]/b.points.length,a[1]+p[1]/b.points.length],[0,0]);return {...b,height:b.height||(/tower/i.test(b.name)?24:5),y:Math.max(.2,terrainHeight(...c))};});
 if(playground)solids.push(...playground.solids);
 if(harbor)solids.push(...harbor.ships,...harbor.fences);
 const tanks=(raw.tanks||[]).map(t=>{const [x,z]=project(t.point);return {...t,x,z,y:Math.max(.2,terrainHeight(x,z))};});
 for(const t of tanks){const points=Array.from({length:49},(_,i)=>[t.x+Math.cos(i*Math.PI/24)*t.radius,t.z+Math.sin(i*Math.PI/24)*t.radius]);solids.push({...t,points});}
 const levee=site.id==='third'?waterfront.levee(features,signedShore,terrainHeight,shoreAccess,beaches,inside,distance):[];
 solids.push(...levee);
 const lessonRV=site.id==='third'?{point:project([37.57295,-122.27960]),width:2.5,length:7.6,height:3.05}:null;
 if(lessonRV){const [x,z]=lessonRV.point;solids.push({y:terrainHeight(x,z),height:lessonRV.height,points:[[x-1.25,z-3.8],[x+1.25,z-3.8],[x+1.25,z+3.8],[x-1.25,z+3.8],[x-1.25,z-3.8]]});}
 const parkingLayout=waterfront.parking(site.id,features,inside,distance);let parked=0;
 for(let i=0;i<parkingLayout.stalls.length;i++){
  const s=parkingLayout.stalls[i];
  // Stable, well-distributed occupancy shared by the car models and collision.
  s.parked=((Math.sin(i*78.233+19.1)*43758.5453)%1+1)%1<.39&&parked<65&&!(lessonRV&&Math.hypot(s.x-lessonRV.point[0],s.z-lessonRV.point[1])<6);
  if(!s.parked)continue;parked++;const points=[[-.88,-2.06],[.88,-2.06],[.88,2.06],[-.88,2.06],[-.88,-2.06]].map(([u,v])=>[s.x+s.tx*u+s.nx*v,s.z+s.tz*u+s.nz*v]);solids.push({kind:'car',car:s,y:terrainHeight(s.x,s.z),height:1.5,points});
 }
 for(const [a,b] of shoreAccess?.fences||[]){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length*.07,nz=dx/length*.07;solids.push({kind:'fence',y:Math.min(terrainHeight(...a),terrainHeight(...b)),height:1.3,points:[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz],[a[0]+nx,a[1]+nz]]});}
 const solidBins=new Map();function indexSolid(b){const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);for(let i=Math.floor(Math.min(...xs)/64);i<=Math.floor(Math.max(...xs)/64);i++)for(let j=Math.floor(Math.min(...zs)/64);j<=Math.floor(Math.max(...zs)/64);j++){const key=i+','+j;if(!solidBins.has(key))solidBins.set(key,[]);solidBins.get(key).push(b);}}
 function addSolid(b){solids.push(b);indexSolid(b);}for(const b of solids)indexSolid(b);
 const dockLines=features.piers.filter(p=>p.kind==='pier'&&p.points.length<50);
 const onDock=(p,x,z,r)=>distance(x,z,p.points)<r||(p.points.length>3&&p.points[0][0]===p.points.at(-1)[0]&&p.points[0][1]===p.points.at(-1)[1]&&inside(x,z,p.points));
 const floating=site.id==='shoreline'?[{point:project([37.43356,-122.0910]),radius:2.6,top:.45}]:[];
 function floatTop(x,z){for(const o of floating)if(Math.hypot(x-o.point[0],z-o.point[1])<o.radius)return o.top;return -Infinity;}
 // A small footprint bridges the cracks between riprap. Use the same support
 // height for feet and collision, so a neighboring rock cannot trap the rider.
 function walkHeight(x,z){let y=Math.max(terrainHeight(x,z),playground?.surface(x,z)??-Infinity,harbor?.surface(x,z)??-Infinity,rockTop(x,z,.28),floatTop(x,z),shoreAccess?.at(x,z)?.height??-Infinity,shoreAccess?.dockAt(x,z)??-Infinity,promenade?.surface(x,z)??-Infinity,promenade?.approachHeight(x,z,terrainHeight)??-Infinity,trail?.surface(x,z)??-Infinity);for(const p of dockLines)if(onDock(p,x,z,1.2))y=Math.max(y,.65);return y;}
 function bedHeight(x,z){let y=Math.max(terrainHeight(x,z),playground?.surface(x,z)??-Infinity,harbor?.surface(x,z)??-Infinity,rockTop(x,z),floatTop(x,z),shoreAccess?.at(x,z)?.height??-Infinity,shoreAccess?.dockAt(x,z)??-Infinity,promenade?.surface(x,z)??-Infinity,promenade?.approachHeight(x,z,terrainHeight)??-Infinity,trail?.surface(x,z)??-Infinity);for(const p of dockLines)if(onDock(p,x,z,1.15))y=Math.max(y,.65);return y;}
 function blocked(x,z,r=.3,feet=walkHeight(x,z)){for(let i=Math.floor((x-r)/64);i<=Math.floor((x+r)/64);i++)for(let j=Math.floor((z-r)/64);j<=Math.floor((z+r)/64);j++)for(const b of solidBins.get(i+','+j)||[])if(feet<b.y+b.height&&feet+1.7>b.y&&(inside(x,z,b.points)||distance(x,z,b.points)<r))return true;return false;}
 // Horse landing support matches the rendered car roof and lower hood/deck.
 function carTop(b,x,z){const c=b.car,dx=x-c.x,dz=z-c.z,u=dx*c.tx+dz*c.tz,v=dx*c.nx+dz*c.nz;return b.y+(Math.abs(u)<.775&&v>=-1.225&&v<=1.025?1.45:1.03);}
 function horseSurface(x,z){let y=walkHeight(x,z);for(const b of solidBins.get(Math.floor(x/64)+','+Math.floor(z/64))||[])if(b.kind==='car'&&inside(x,z,b.points))y=Math.max(y,carTop(b,x,z));return y;}
 function horseBlocked(x,z,r,feet){for(let i=Math.floor((x-r)/64);i<=Math.floor((x+r)/64);i++)for(let j=Math.floor((z-r)/64);j<=Math.floor((z+r)/64);j++)for(const b of solidBins.get(i+','+j)||[]){const top=b.kind==='car'?carTop(b,x,z):b.y+b.height;if(feet<top-.015&&feet+2.8>b.y&&(inside(x,z,b.points)||distance(x,z,b.points)<r))return true;}return false;}
 function rockStep(x,z){return Number.isFinite(rockTop(x,z,.5));}
 const launch=project(site.launch),castle={x:launch[0],z:launch[1],floor:0,dock:{x:launch[0],z:launch[1]},path:[],walls:[],towers:[],solids:[],platforms:[],arches:[],sites:[]};
 return {site,harbor,playground,golfBank,openGolfBank,limit:site.limit,project,coast,water,polygons,ponds,shoreRocks,ramps,promenade,trail,shoreAccess,bankHeight,floating,features,solids,addSolid,tanks,levee,lessonRV,parkingLayout,raw,surfaces:[near,middle,far,...(launchSurface?[launchSurface]:[])],near,elevationAt,waterDatum,signedShore,terrainHeight,bedHeight,walkHeight,blocked,horseSurface,horseBlocked,rockStep,cameraBlocked:(x,y,z,r=.18)=>walkHeight(x,z)>y-r||blocked(x,z,r,y),castle};
}
const api={sites,create,inside,distance};root.FoilLocations=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
