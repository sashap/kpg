/* Kahului: mapped shore + photo-guided Hoaloha/port details. +X west, +Z north.
   Heights on the quays, dunes and breakwaters are game approximations; the
   surrounding terrain comes from USGS. See README for county photo survey. */
(function(root){'use strict';
// Rounded shoulders and a fine bow; collision uses this same waterline.
const outline=[[-.38,-.5],[.38,-.5],[.46,-.48],[.49,-.43],[.5,-.30],[.5,.15],[.47,.30],[.40,.39],[.30,.455],[.18,.50],[0,.53],[-.18,.50],[-.30,.455],[-.40,.39],[-.47,.30],[-.5,.15],[-.5,-.30],[-.49,-.43],[-.46,-.48]];
function hullGeometry(s){const positions=[],indices=[];
 const n=outline.length;
 for(const [y,scale] of [[-5,.62],[-1,.88],[.8,.96],[s.deck,1]])for(const [x,z] of outline)positions.push(x*s.width*scale,y,z*s.length);
 for(let layer=0;layer<3;layer++)for(let i=0;i<n;i++){const a=layer*n+i,b=layer*n+(i+1)%n;indices.push(a,a+n,b,b,a+n,b+n);}
 positions.push(0,s.deck,0,0,-5,0);for(let i=0;i<n;i++){indices.push(n*4,n*3+(i+1)%n,n*3+i,n*4+1,i,(i+1)%n);}
 return {positions,indices};
}
const beach=[[20.89119,-156.47316],[20.89138,-156.4716],[20.89172,-156.4702],[20.89210,-156.46958],[20.89270,-156.46882],[20.89325,-156.46823],[20.89348,-156.46804],[20.89336,-156.46789],[20.89257,-156.46857],[20.89191,-156.46929],[20.89156,-156.47003],[20.89122,-156.47147],[20.89103,-156.47313],[20.89119,-156.47316]];
const fence=[[20.89135,-156.46689],[20.89230,-156.46735],[20.89328,-156.46782],[20.89349,-156.46803]];
// Traced from Esri's aerial and checked against the county's Hoaloha survey.
// These small beach groins are absent from the OSM breakwater polygons.
const groinSpecs=[
 {id:'west-beach-groin',points:[[20.89102,-156.47338],[20.89154,-156.47325]],width:4.8},
 {id:'hotel-beach-groin',points:[[20.89128,-156.47169],[20.89196,-156.47172]],width:5.6},
 {id:'hoaloha-beach-groin',points:[[20.89171,-156.46992],[20.89245,-156.47047]],width:5.0},
 {id:'hotel-rock-shelf',points:[[20.89143,-156.47280],[20.89149,-156.47248],[20.89153,-156.47202],[20.89153,-156.47173]],width:8,low:true}
];
const port=[[[20.89893,-156.46966],[20.89934,-156.46934],[20.89810,-156.46594],[20.89803,-156.46410],[20.89615,-156.46482],[20.89616,-156.46507],[20.89893,-156.46966]],[[20.89416,-156.46615],[20.895475,-156.468352],[20.89505,-156.469082],[20.89418,-156.46758],[20.89346,-156.46805],[20.89235,-156.46676],[20.89333,-156.46578],[20.89416,-156.46615]]];
const shipSpecs=[
 {id:'cargo',point:[20.89720,-156.46735],heading:1.00,length:162,width:25,deck:8,kind:'cargo'},
 {id:'cruise',point:[20.89497,-156.46708],heading:1.01,length:218,width:32,deck:7,kind:'cruise'}
];
function prepare(raw){const d={...raw};for(const k of ['ground','parking','parkingAisles','paths','roads'])d[k]=[...(raw[k]||[])];
 // One beach skin along the inner harbor; don't stack the OSM sand over it.
 d.ground=d.ground.filter(f=>!(f.kind==='beach'&&f.points.every(p=>p[0]<20.8936&&p[1]<-156.4678)));
 d.ground.push({id:'hoaloha-sand',kind:'beach',points:beach});
 // Puunene's north end and its curbside parking, next to the port fence.
 d.parking.push({id:'puunene-harbor-parking',kind:'parking',points:[[20.89217,-156.46747],[20.89320,-156.46796],[20.89328,-156.46780],[20.89225,-156.46731],[20.89217,-156.46747]]});
 d.parkingAisles.push({id:'puunene-parking-aisle',points:[[20.89225,-156.46745],[20.89318,-156.46788]]});
 // The paved park lot wraps around the inland side of the two canoe hales.
 // OSM includes its footprint but not the circulation aisles; these follow
 // the county's 2024 aerial, keeping the central overflow field unstriped.
 d.parkingAisles.push({id:'hoaloha-long-aisle',points:[[20.891682,-156.468937],[20.891862,-156.468397]]},{id:'hoaloha-return-aisle',points:[[20.891862,-156.468397],[20.892089,-156.468489]]});
 d.parkingAisles.push({id:'boat-trailer-aisle',points:[[20.896626,-156.477711],[20.896874,-156.477621]]});
 d.roads.push({id:'puunene-harbor-end',name:'North Puunene Avenue',points:[[20.89138,-156.46704],[20.89323,-156.46790]]});
 // Public overflow lawn behind the canoe hales, distinct from the paved lot.
 d.ground.push({id:'hoaloha-overflow-lawn',kind:'grass',points:[[20.89116,-156.46893],[20.89159,-156.46913],[20.89172,-156.46883],[20.89143,-156.46836],[20.89116,-156.46893]]});
 return d;
}
function create(raw,project,inside,distance){
 const breaks=raw.breakwaters.map(b=>({...b,points:b.points.map(project)})),groins=groinSpecs.map(b=>({...b,points:b.points.map(project)})),quays=port.map(p=>p.map(project)),beachPoints=beach.map(project),fencePoints=fence.map(project);
 const ships=shipSpecs.map(s=>{const [x,z]=project(s.point),co=Math.cos(s.heading),si=Math.sin(s.heading);const points=[...outline,outline[0]].map(([a,b])=>[x+a*s.width*co+b*s.length*si,z-a*s.width*si+b*s.length*co]);return {...s,x,z,points,y:-7,height:44};});
 function height(x,z,d,y){
  for(const b of breaks)if(inside(x,z,b.points))return Math.max(y,Math.min(4.2,.35+distance(x,z,b.points)*.52));
  for(const p of quays)if(inside(x,z,p))return 2.35;
  // Preserve an easy beach entry. DEM cells can blur the low sand dune into
  // a vertical step; this 12 m transition follows the photographed access.
  if(inside(x,z,beachPoints)&&d>0)return Math.min(y,Math.max(.03,d*.16));
  return null;
 }
 const surface=(x,z)=>{for(const s of ships)if(inside(x,z,s.points))return s.deck;for(const p of quays)if(inside(x,z,p))return 2.35;return -Infinity;};
 const fences=[];for(let i=1;i<fencePoints.length;i++){const a=fencePoints[i-1],b=fencePoints[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*.07,nz=dx/len*.07;fences.push({kind:'port-fence',y:.4,height:3.5,a,b,points:[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz],[a[0]+nx,a[1]+nz]]});}
 return {breaks,groins,quays,ships,fences,beach:beachPoints,height,surface};
}
// Sheltered public-water loop, close enough to watch from Hoaloha's launch.
function canoeFrame(time,project){const o=project([20.89350,-156.46980]),a=time*.038;return {x:o[0]+Math.cos(a)*55,z:o[1]+Math.sin(a)*32,heading:Math.atan2(-55*Math.sin(a),32*Math.cos(a))};}
const api={canoeFrame,prepare,create,shipSpecs,hullGeometry,groinSpecs};root.FoilHarbor=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
