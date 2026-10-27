/* Shared vertices keep graded paths and long bridge decks continuous. */
(function(root){'use strict';
function sample(points,step=3){const out=[points[0].slice()];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step);for(let j=1;j<=n;j++)out.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}return out;}
function ribbon(points,width,height){const positions=[],indices=[];for(let i=0;i<points.length;i++){const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=(b[1]-a[1])/d,nz=-(b[0]-a[0])/d;for(const side of [-1,1]){const x=points[i][0]+nx*width*.5*side,z=points[i][1]+nz*width*.5*side;positions.push(x,height(x,z,i,side),z);}if(i){const k=i*2;indices.push(k-2,k,k-1,k-1,k,k+1);}}return {positions,indices};}
// Clip overlays to the actual terrain triangles. Sampling just the polygon
// corners can cut through the intervening ground and leave apparent holes.
function drape(triangles,surfaces,offset=.045){const positions=[];
 for(const s of surfaces){if(!s.overlayCells)s.overlayCells=new Set(Array.from({length:s.indices.length/6},(_,i)=>s.indices[i*6]));const step=s.step||1,n=s.n,m=s.m??n,x0=s.x0??-s.half,z0=s.z0??-s.half;
  for(const tri of triangles){const xs=tri.map(p=>p[0]),zs=tri.map(p=>p[1]),loX=Math.max(0,Math.floor((Math.min(...xs)-x0)/step)),hiX=Math.min(n-1,Math.floor((Math.max(...xs)-x0)/step)),loZ=Math.max(0,Math.floor((Math.min(...zs)-z0)/step)),hiZ=Math.min(m-1,Math.floor((Math.max(...zs)-z0)/step));
   for(let j=loZ;j<=hiZ;j++)for(let i=loX;i<=hiX;i++){const k=j*(n+1)+i;if(!s.overlayCells.has(k))continue;for(const ids of [[k,k+1,k+n+1],[k+1,k+n+2,k+n+1]]){const terrain=ids.map(a=>s.points[a]),edge=(p,a,b)=>(b[0]-a[0])*(p[1]-a[2])-(b[2]-a[2])*(p[0]-a[0]);let clipped=tri;
    for(let e=0;e<3&&clipped.length;e++){const a=terrain[e],b=terrain[(e+1)%3],next=[];for(let q=0;q<clipped.length;q++){const c=clipped[q],d=clipped[(q+1)%clipped.length],ec=edge(c,a,b),ed=edge(d,a,b);if(ec>=-1e-8)next.push(c);if((ec>0)!==(ed>0)){const t=ec/(ec-ed);next.push([c[0]+(d[0]-c[0])*t,c[1]+(d[1]-c[1])*t]);}}clipped=next;}
    if(clipped.length<3)continue;const [a,b,c]=terrain,det=(b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]);const vertex=p=>{const u=((p[0]-a[0])*(c[2]-a[2])-(p[1]-a[2])*(c[0]-a[0]))/det,v=((b[0]-a[0])*(p[1]-a[2])-(b[2]-a[2])*(p[0]-a[0]))/det;return [p[0],a[1]+u*(b[1]-a[1])+v*(c[1]-a[1])+offset,p[1]];};for(let q=1;q<clipped.length-1;q++)positions.push(...vertex(clipped[0]),...vertex(clipped[q+1]),...vertex(clipped[q]));
   }}
  }
 }
 return positions;
}
function bridge(raw,project,terrain){const west=sample(raw.bridgeApproaches[0].map(project),40),main=sample(raw.bridge.map(project),40),east=sample(raw.bridgeApproaches[1].map(project),40),length=p=>p.reduce((s,v,i)=>i?s+Math.hypot(v[0]-p[i-1][0],v[1]-p[i-1][1]):s,0),westLength=length(west),mainLength=length(main),eastLength=length(east),points=[...west.slice(0,-1),...main,...east.slice(1)],ys=[];let distance=0;
 const smooth=t=>t*t*(3-2*t),start=Math.max(2.3,terrain(...west[0])+.3),end=Math.max(2.3,terrain(...east.at(-1))+.3);
 for(let i=0;i<points.length;i++){if(i)distance+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);const s=distance-westLength;ys.push(s<0?start+(12-start)*smooth(distance/westLength):s>mainLength?12+(end-12)*smooth((s-mainLength)/eastLength):12+37*Math.exp(-(((s-1700)/1100)**4)));}
 return {points,ys,westLength,mainLength,eastLength,westCount:west.length,eastStart:west.length+main.length-2};}
const api={sample,ribbon,drape,bridge};root.FoilSceneryGeometry=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
