/* One terrain surface for drawing, seabed depth, and swept equipment collisions. */
(function(root){
'use strict';
let geography=null;
const PI=Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ISLANDS=[[-200,180,50,24],[220,210,62,38],[80,-260,75,35],[-270,-80,80,50],[430,-170,55,26]];
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);return (hash(ix,iz)*(1-u)+hash(ix+1,iz)*u)*(1-v)+(hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u)*v;}
const fbm=(x,z)=>noise(x,z)*.57+noise(x*2.13+7,z*2.13-4)*.28+noise(x*4.53,z*4.53)*.15;
function islandHeight(x,z,r,height,index){const a=Math.atan2(z,x),rr=Math.hypot(x,z)/r;return Math.pow(Math.max(0,1-rr),1.22)*height*(.78+.30*fbm(x*.055+index,z*.055))+.10*height*Math.sin(a*3+index)*Math.sin(Math.min(1,rr)*PI);}
const coastRadius=a=>555+Math.sin(a*3.1)*28+Math.sin(a*9)*14;
const surfaces=[],cells=new Map(),rockCells=new Map(),pathCells=new Map(),solidCells=new Map(),CELL=16,MIN_DEPTH=-7;
const key=(x,z)=>Math.floor(x/CELL)+','+Math.floor(z/CELL);
function indexBounds(map,item,x0,z0,x1,z1){for(let x=Math.floor(x0/CELL);x<=Math.floor(x1/CELL);x++)for(let z=Math.floor(z0/CELL);z<=Math.floor(z1/CELL);z++){const k=x+','+z;if(!map.has(k))map.set(k,[]);map.get(k).push(item);}}
function surface(points,indices){
 // Float32 coordinates are exactly the coordinates submitted to WebGL.
 points=points.map(p=>p.map(Math.fround));const result={points,indices};surfaces.push(result);
 for(let i=0;i<indices.length;i+=3){const a=points[indices[i]],b=points[indices[i+1]],c=points[indices[i+2]],den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-8)continue;
  indexBounds(cells,{a,b,c,inv:1/den},Math.min(a[0],b[0],c[0]),Math.min(a[2],b[2],c[2]),Math.max(a[0],b[0],c[0]),Math.max(a[2],b[2],c[2]));
 }return result;
}
function connect(indices,j,i,segments){const n=j*(segments+1)+i;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}
ISLANDS.forEach(([x,z,r,h],index)=>{const points=[],indices=[],rings=28,segments=90;for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){const a=i/segments*PI*2,rad=j<=25?j/25*r:r+[6,18,45][j-26],px=Math.cos(a)*rad,pz=Math.sin(a)*rad,y=j<25?islandHeight(px,pz,r,h,index):[-1.6,-2.4,-4,MIN_DEPTH][j-25],veg=clamp((y-2)/5,0,1)*clamp(.45+fbm(px*.07,pz*.07)*.6,0,1);points.push([x+px,y,z+pz,veg]);if(j<rings&&i<segments)connect(indices,j,i,segments);}surface(points,indices);});
{const points=[],indices=[],segments=220,rings=20;for(let row=0;row<=rings;row++)for(let i=0;i<=segments;i++){const j=row-2,a=-1.85+i/segments*4.8,t=Math.max(0,j)/18,inner=coastRadius(a),rad=j<0?inner+(j===-2?-40:-12):inner+t*420,x=Math.cos(a)*rad,z=Math.sin(a)*rad,edge=Math.min(1,i/12,(segments-i)/12),ridge=(25+95*fbm(x*.008,z*.008))*Math.pow(Math.sin(t*PI*.76),.65),y=j<0?(j===-2?MIN_DEPTH:-3):j===0?-1.5:(ridge+Math.sin(a*8+t*4)*12*Math.sin(t*PI))*edge;points.push([x,y,z,clamp(.7+noise(x*.018,z*.018)*.4-t*.4,0,1)]);if(row<rings&&i<segments)connect(indices,row,i,segments);}surface(points,indices);}
function terrainHeight(x,z){if(geography)return geography.terrainHeight(x,z);let height=MIN_DEPTH;for(const {a,b,c,inv} of cells.get(key(x,z))||[]){const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))*inv,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))*inv;if(u>=-1e-6&&v>=-1e-6&&u+v<=1.000001)height=Math.max(height,u*a[1]+v*b[1]+(1-u-v)*c[1]);}return height;}
let seed=7854;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const rocks=[];ISLANDS.forEach(([x,z,r])=>{for(let i=0;i<34;i++){const a=i*2.399,rad=r*(.83+random()*.13),px=x+Math.cos(a)*rad,pz=z+Math.sin(a)*rad,rock={x:px,z:pz,y:Math.max(-.3,terrainHeight(px,pz)),sx:1+random()*3,sy:.5+random()*2.5,sz:1+random()*2,angle:random()*PI*2,color:[0x888c7d,0xa5a18c,0x767f73][i%3]};rocks.push(rock);const radius=Math.max(rock.sx,rock.sz)+.5;indexBounds(rockCells,rock,px-radius,pz-radius,px+radius,pz+radius);}});
function bedHeight(x,z){if(geography)return geography.bedHeight(x,z);let height=terrainHeight(x,z);for(const r of rockCells.get(key(x,z))||[]){if(r.removed)continue;const dx=x-r.x,dz=z-r.z,c=Math.cos(r.angle),s=Math.sin(r.angle),q=((dx*c-dz*s)/r.sx)**2+((dx*s+dz*c)/r.sz)**2;if(q<1)height=Math.max(height,r.y+r.sy*Math.sqrt(1-q));}for(const p of pathCells.get(key(x,z))||[])if(p.pier&&onPath(p,x,z))height=Math.max(height,p.y);return height;}
// Dimensions match the board, mast and wings in app.js. Points span the equipment,
// including the low wingtip when banked; the board center alone is insufficient.
const foilPoints=[[-.74,-.882,.17],[-.37,-.882,.17],[0,-.882,.17],[.37,-.882,.17],[.74,-.882,.17],[0,-.885,-.15],[-.29,-.864,-.61],[0,-.864,-.61],[.29,-.864,-.61],[0,-.86,.35],[0,-.86,-.71]],boardPoints=[];
for(const x of [-.40,0,.40])for(const z of [-.98,-.45,.15,.65,1.07])boardPoints.push([x,-.055,z]);
// Physical pitch is positive nose-up. The board's nose points along local +Z,
// so Three.js needs a negative X rotation. Share this with the rendered rig,
// including the small pump kick, so submerged equipment follows the same pose.
function boardRotationX(s){return -((s.pitch||0)+(s.pumpPulse||0)*.025);}
function probe(p,s,water){if(s.air){const c=Math.cos(s.air.pitch),sn=Math.sin(s.air.pitch),ch=Math.cos(s.heading),sh=Math.sin(s.heading),y=(p[1]-.85)*c-p[2]*sn,z=(p[1]-.85)*sn+p[2]*c;return {x:s.x+p[0]*ch+z*sh,y:s.air.y+.87+y,z:s.z-p[0]*sh+z*ch};}const cr=Math.cos(s.roll||0),sr=Math.sin(s.roll||0),cp=Math.cos(boardRotationX(s)),sp=Math.sin(boardRotationX(s)),ch=Math.cos(s.heading),sh=Math.sin(s.heading),x=p[0]*cr-p[1]*sr,y=p[0]*sr+p[1]*cr,z=y*sp+p[2]*cp;return {x:s.x+x*ch+z*sh,y:water+s.height+.02+y*cp-p[2]*sp,z:s.z-x*sh+z*ch};}
function clearance(s,water=0){let foil=Infinity,board=Infinity,land=false;for(const p of foilPoints){const q=probe(p,s,water);foil=Math.min(foil,q.y-bedHeight(q.x,q.z));}for(const p of boardPoints){const q=probe(p,s,water),bed=bedHeight(q.x,q.z);board=Math.min(board,q.y-bed);if(bed>=Math.max(0,water-.1))land=true;}return {depth:Math.max(0,water-bedHeight(s.x,s.z)),foilClearance:foil,boardClearance:board,land,hit:land||foil<=.12||board<=.05,kind:land?'shore':'foil'};}
function sweep(from,to,waterAt){const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.3));for(let i=0;i<=steps;i++){const t=i/steps,s={...to,x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t,height:from.height+(to.height-from.height)*t,air:to.air&&from.air?{...to.air,y:from.air.y+(to.air.y-from.air.y)*t,pitch:from.air.pitch+(to.air.pitch-from.air.pitch)*t}:to.air,pitch:from.pitch+(to.pitch-from.pitch)*t,pumpPulse:(from.pumpPulse||0)+((to.pumpPulse||0)-(from.pumpPulse||0))*t,roll:from.roll+(to.roll-from.roll)*t,heading:from.heading+Math.atan2(Math.sin(to.heading-from.heading),Math.cos(to.heading-from.heading))*t},c=clearance(s,waterAt(s.x,s.z));if(c.hit)return {...c,x:s.x,z:s.z};}return null;}
// Castle courtyard, solid masonry, and a terraced footpath share their walk geometry.
const castle={x:-270,z:-80,floor:terrainHeight(-270,-80)+.25,dock:{x:-175,z:-80},walls:[],towers:[],path:[],sites:[],solids:[],platforms:[],arches:[]};
for(const [x,z,w,d,h] of [[-11,0,1.5,28,6.8],[11,-8,1.5,12,5.8],[11,8,1.5,12,5.1],[-7,-14,8,1.5,4.8],[7,-14,8,1.5,3.2],[0,14,22,1.5,5.6],[-5,4,10,1.0,3.6],[-9,-6,1,16,4.3]])castle.walls.push({x:castle.x+x,z:castle.z+z,w,d,h,y:castle.floor});
for(const [x,z,h] of [[-10,13,11],[-10,-13,7.5],[10,13,9]])castle.towers.push({x:castle.x+x,z:castle.z+z,r:2.8,h,y:castle.floor,doorAngle:Math.atan2(-x,-z)});
// Masonry is generated once: rendering and collision use these same cut stones.
// No broad tower exemption: only the actual door openings permit passage.
function stone(x,y,z,w,h,d,angle=0,kind='wall',material=0){const b={x,y,z,w,h,d,angle,kind,material};castle.solids.push(b);const r=Math.hypot(w,d)/2+.5;indexBounds(solidCells,b,x-r,z-r,x+r,z+r);return b;}
const foundationBase=Math.min(...[[-12,-15],[12,-15],[-12,15],[12,15]].map(([x,z])=>terrainHeight(castle.x+x,castle.z+z)))-.3;
for(let j=0;j<3;j++)castle.platforms.push(stone(castle.x,foundationBase+(castle.floor-foundationBase)*j/3,castle.z,27-j*1.7,(castle.floor-foundationBase)/3,33-j*1.7,0,'foundation',3));
castle.platforms.push(stone(castle.x,castle.floor-.23,castle.z,23.6,.23,29.6,0,'foundation',1));
for(const w of castle.walls){const long=w.w>w.d,length=long?w.w:w.d,thick=long?w.d:w.w,count=Math.ceil(length/1.15),width=length/count;
 for(let row=0;row*.48<w.h;row++)for(let i=-1;i<count;i++){
  const start=Math.max(-length/2,-length/2+(i+(row%2)*.5)*width),end=Math.min(length/2,-length/2+(i+1+(row%2)*.5)*width);if(end-start<.12)continue;
  const offset=(start+end)/2,x=w.x+(long?offset:0),z=w.z+(long?0:offset),y=row*.48;
  if(y>w.h-.45+Math.sin(i*2.7)*.45||castle.towers.some(t=>Math.hypot(x-t.x,z-t.z)<t.r+.55))continue;
  // A few narrow, recessed arrow slits catch light high above the walking route.
  if(y>2.4&&y<3.5&&i%7===3)continue;
  stone(x,w.y+y,z,long?end-start-.025:thick,.455,long?thick:end-start-.025,0,'wall',(i+row+12)%5);
 }
}
for(const t of castle.towers)for(let row=0;row*.46<t.h;row++)for(let i=0;i<26;i++){
 const a=(i+.5+(row%2)*.5)/26*PI*2,door=Math.atan2(Math.sin(a-t.doorAngle),Math.cos(a-t.doorAngle));
 if(Math.abs(door)<.43&&row<6||row*.46>t.h-.5+Math.sin(a*3+1)*1.15)continue;
 if(row>10&&row<14&&i%9===3)continue;
 stone(t.x+Math.sin(a)*t.r,t.y+row*.46,t.z+Math.cos(a)*t.r,.72,.44,.76,a,'tower',(i+row)%5);
}
for(const z of [-10.2,-3.8])for(let row=0;row<7;row++)stone(castle.x-4,castle.floor+row*.46,castle.z+z,1.0,.44,1.0,0,'jamb',row%5);
castle.arches=[{x:castle.x+11,z:castle.z,y:castle.floor,r:2.05},{x:castle.x-4,z:castle.z-7,y:castle.floor,r:2.75}];
// Fallen blocks and broken column drums remain solid, but keep the courtyard route open.
for(const [x,z,w,h,d,a] of [[-5.8,-11.7,1.3,.65,.85,.35],[-7.5,-1.7,.95,.48,1.5,-.5],[7.8,6.7,1.4,.7,.85,.4],[7.1,8.2,.8,.42,.9,-.3],[-7.7,6.8,1.5,.6,.8,.12],[-6.8,12,.85,.5,1.1,.6]])stone(castle.x+x,castle.floor,castle.z+z,w,h,d,a,'rubble',3);
const route=[[95,0,.65],[84,0,.65],[76,0,2],[58,18,7],[42,24,12],[25,22,21],[25,-18,castle.floor-15],[16,-18,castle.floor-10],[16,0,castle.floor],[10,0,castle.floor]];
for(const p of route)for(let i=0;i<16;i++)p[2]=Math.max(p[2],terrainHeight(castle.x+p[0]+Math.cos(i*Math.PI/8)*2,castle.z+p[1]+Math.sin(i*Math.PI/8)*2)+.12);
for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.max(Math.ceil(length/.24),Math.ceil(Math.abs(b[2]-a[2])/.15));for(let k=0;k<count;k++){const t=(k+.5)/count,x=castle.x+a[0]+(b[0]-a[0])*t,z=castle.z+a[1]+(b[1]-a[1])*t,y=Math.max(terrainHeight(x,z)+.08,a[2]+(b[2]-a[2])*clamp((t*length-1.7)/Math.max(.1,length-3.4),0,1));castle.path.push({x,z,pier:terrainHeight(x,z)<0,y:Math.ceil(y/.18)*.18,angle:Math.atan2(b[0]-a[0],b[1]-a[1]),width:2.8,length:length/count+.12});}}
for(const p of castle.path){const r=Math.hypot(p.width,p.length)/2+.15;indexBounds(pathCells,p,p.x-r,p.z-r,p.x+r,p.z+r);}
for(const rock of rocks)if(castle.path.some(p=>onPath(p,rock.x,rock.z,Math.max(rock.sx,rock.sz))))rock.removed=true;
castle.sites=[{id:'gate',name:'The sea gate',x:castle.x+8,z:castle.z,text:'Salt and storms have worn these stone arches. The sheltered landing once brought supplies to the castle.'},{id:'well',name:'The courtyard well',x:castle.x+2,z:castle.z+1,text:'A rainwater cistern helped the people here outlast a siege. Look for the channels cut into the courtyard.'},{id:'mosaic',name:'The lost mosaic',x:castle.x-4,z:castle.z-7,text:'Blue and cream tiles survive beneath the broken hall. Their wave pattern echoes the bay below.'},{id:'tower',name:'The signal tower',x:castle.x-5,z:castle.z+10,text:'Watchkeepers used this high tower to spot approaching sails and signal across the headlands.'}];
function onPath(p,x,z,padding=0){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle);return Math.abs(dx*c-dz*s)<=p.width/2+padding&&Math.abs(dx*s+dz*c)<=p.length/2+padding;}
function walkHeight(x,z){if(geography)return geography.walkHeight(x,z);let y=terrainHeight(x,z);for(const p of castle.platforms)if(Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2)y=Math.max(y,p.y+p.h);for(const t of castle.towers)if(Math.hypot(x-t.x,z-t.z)<=t.r+.4)y=Math.max(y,t.y);for(const p of pathCells.get(key(x,z))||[])if(onPath(p,x,z,.08))y=Math.max(y,p.y);return y;}
function overlapsBox(b,x,z,radius){const dx=x-b.x,dz=z-b.z,c=Math.cos(b.angle),s=Math.sin(b.angle),lx=dx*c-dz*s,lz=dx*s+dz*c;return Math.hypot(Math.max(0,Math.abs(lx)-b.w/2),Math.max(0,Math.abs(lz)-b.d/2))<radius;}
function solidAt(x,z,radius,bottom,top){
 for(const b of solidCells.get(key(x,z))||[])if(b.y<top&&b.y+b.h>bottom&&overlapsBox(b,x,z,radius))return true;
 // Use the boulder's rendered rotation; an axis-aligned ellipse misses its long corners.
 for(const r of rockCells.get(key(x,z))||[]){if(r.removed||r.y-r.sy>=top||r.y+r.sy<=bottom)continue;const dx=x-r.x,dz=z-r.z,c=Math.cos(r.angle),s=Math.sin(r.angle);if(Math.hypot((dx*c-dz*s)/(r.sx+radius),(dx*s+dz*c)/(r.sz+radius))<1)return true;}
 if(bottom<castle.floor+1.23&&top>castle.floor&&Math.hypot(x-castle.x,z-castle.z)<1.24+radius)return true;
 for(const a of castle.arches){const y=(bottom+top)/2-a.y-3.1,spread=(top-bottom)/2;if(y+spread<0||Math.abs(x-a.x)>.65+radius)continue;const d=Math.hypot(z-a.z,Math.max(0,y));if(d>a.r-spread-radius&&d<a.r+.55+spread+radius)return true;}
 return false;
}
function blocked(x,z,radius=.30,feet=walkHeight(x,z)){if(geography)return geography.blocked(x,z,radius,feet);return solidAt(x,z,radius,feet+.20,feet+1.75);}
// Only surfaces already below the feet can catch a landing; walls remain solid.
function walkSupport(x,z,ceiling){if(geography)return geography.walkSupport(x,z,ceiling);let y=walkHeight(x,z);for(const b of solidCells.get(key(x,z))||[])if(b.y+b.h<=ceiling+.025&&overlapsBox(b,x,z,.22))y=Math.max(y,b.y+b.h);return y;}
function stepsAt(x,z){return !geography&&(pathCells.get(key(x,z))||[]).some(p=>!p.pier&&onPath(p,x,z,.65));}
function cameraBlocked(x,y,z,radius=.18){if(geography)return geography.cameraBlocked(x,y,z,radius);return walkHeight(x,z)>y-radius||solidAt(x,z,radius,y-radius,y+radius);}
const api={ISLANDS,surfaces,rocks,islandHeight,coastRadius,terrainHeight,bedHeight,boardRotationX,equipmentPoint:probe,clearance,sweep,castle,walkHeight,walkSupport,blocked,stepsAt,cameraBlocked};const locations=typeof module!=='undefined'&&module.exports?require('./locations.js'):root.FoilLocations;
api.activate=id=>{geography=locations.create(id);api.geography=geography;api.location=geography?.site||locations.sites[0];api.limit=api.location.limit;api.ISLANDS=geography?[]:ISLANDS;api.surfaces=geography?geography.surfaces:surfaces;api.castle=geography?geography.castle:castle;api.rocks=geography?[]:rocks;return api;};
api.activate(typeof location!=='undefined'?new URLSearchParams(location.search).get('location'):'academy');
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FoilWorld=api;
})(typeof globalThis!=='undefined'?globalThis:this);
