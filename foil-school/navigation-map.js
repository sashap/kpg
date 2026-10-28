/* A north-up chart with CSS-pixel labels, local framing, and touch pan/zoom. */
const FoilNavigationMap=(()=>{
 function create({canvas,world,site,session,landmarks,selected,onSelect}){
  const ctx=canvas.getContext('2d'),events=new AbortController(),pointers=new Map();
  let width=1,height=1,cx=session.x,cz=session.z,range=350,markers=[],gesture=null,moved=false;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),scale=()=>Math.min(width,height)/(range*2);
  const point=(x,z)=>[width/2-(x-cx)*scale(),height/2-(z-cz)*scale()];
  const position=(x,y)=>[cx+(width/2-x)/scale(),cz+(height/2-y)/scale()];
  const listen=(node,name,fn,options={})=>node.addEventListener(name,fn,{...options,signal:events.signal});
  function path(points,fill,stroke,lineWidth=1,closed=true){if(!points?.length)return;ctx.beginPath();points.forEach(([x,z],i)=>{const p=point(x,z);i?ctx.lineTo(...p):ctx.moveTo(...p);});if(closed)ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}}
  function label(text,x,y,color='#214b55'){ctx.font='600 12px sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#f7faf2';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
  function draw(){
   const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;width=rect.width;height=rect.height;
   const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
   ctx.fillStyle='#cce3e5';ctx.fillRect(0,0,width,height);
   const g=world.geography;
   if(g){if(g.water){ctx.fillStyle='#9eB68c';ctx.fillRect(0,0,width,height);path(g.water,'#cce3e5','#e5d6b3',3);}g.polygons.forEach(p=>path(p,'#9eb68c','#e5d6b3',3));
    for(const f of g.features.parking||[])path(f.points,'#b9c2b8','#95a59a');
    for(const f of [...(g.features.roads||[]),...(g.features.paths||[])])path(f.points,null,'#edf0dc',2,false);
    for(const f of g.features.buildings||[])path(f.points,'#b8ada0','#8d968b');
    for(const f of g.features.piers||[])path(f.points,'#ddd2b6','#9b9f8e');
   }else{
    const shore=[];for(let i=0;i<=120;i++){const a=-1.85+i/120*4.8,r=555+Math.sin(a*3.1)*28+Math.sin(a*9)*14;shore.push([Math.cos(a)*r,Math.sin(a)*r]);}for(let i=120;i>=0;i--){const a=-1.85+i/120*4.8;shore.push([Math.cos(a)*1000,Math.sin(a)*1000]);}path(shore,'#9eb68c','#e5d6b3',4);
    for(const [x,z,r] of world.ISLANDS){const p=point(x,z);ctx.beginPath();ctx.ellipse(...p,r*scale(),r*scale()*.95,0,0,Math.PI*2);ctx.fillStyle='#9eb68c';ctx.fill();ctx.strokeStyle='#e5d6b3';ctx.lineWidth=4;ctx.stroke();}
   }
   const rider=point(session.x,session.z),target=point(landmarks[selected].x,landmarks[selected].z);
   ctx.setLineDash([5,5]);ctx.strokeStyle='#476e79';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(...rider);ctx.lineTo(...target);ctx.stroke();ctx.setLineDash([]);
   markers=[];const occupied=[{x:rider[0]-25,y:rider[1]-22,w:55,h:48}];ctx.textAlign='center';ctx.textBaseline='middle';
   // Selected references get first choice of label space; numbered dots remain tappable.
   const order=landmarks.map((l,i)=>i).sort((a,b)=>Number(b===selected)-Number(a===selected));
   for(const i of order){const l=landmarks[i],p=point(l.x,l.z),x=p[0],y=p[1];if(x<12||x>width-12||y<12||y>height-12)continue;
    markers.push({x,y,index:i});ctx.beginPath();ctx.arc(x,y,i===selected?12:10,0,Math.PI*2);ctx.fillStyle=i===selected?'#164e5d':l.color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.font='bold 11px sans-serif';ctx.fillStyle='#fff';ctx.fillText(i+1,x,y+.5);
    const text=l.name.replace(' · horse',''),w=ctx.measureText(text).width+12;
    for(const dy of [-26,26,-43,43]){const box={x:clamp(x-w/2,8,width-w-8),y:y+dy-8,w,h:17};if(box.y<10||box.y+box.h>height-32||occupied.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))continue;label(text,box.x+w/2,box.y+8);occupied.push(box);break;}
   }
   const gate=point(session.gate.x,session.gate.z);ctx.fillStyle='#dba657';ctx.fillRect(gate[0]-5,gate[1]-5,10,10);
   ctx.save();ctx.translate(...rider);ctx.rotate(-session.heading);ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(10,11);ctx.lineTo(0,6);ctx.lineTo(-10,11);ctx.closePath();ctx.fillStyle='#167fa1';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.restore();label('YOU',rider[0],rider[1]+25,'#155569');
   ctx.fillStyle='#f8faf0e8';ctx.fillRect(width-42,7,35,52);ctx.fillStyle='#295a62';ctx.beginPath();ctx.moveTo(width-25,14);ctx.lineTo(width-31,29);ctx.lineTo(width-19,29);ctx.fill();ctx.font='bold 12px sans-serif';ctx.fillText('N',width-25,44);
   const ideal=80/scale(),pow=10**Math.floor(Math.log10(ideal)),meters=[1,2,5,10].map(n=>n*pow).find(n=>n>=ideal),length=meters*scale();ctx.fillStyle='#f8faf0e8';ctx.fillRect(8,height-36,length+18,28);ctx.strokeStyle='#315761';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(17,height-20);ctx.lineTo(17,height-13);ctx.lineTo(17+length,height-13);ctx.lineTo(17+length,height-20);ctx.stroke();ctx.font='11px sans-serif';ctx.fillStyle='#315761';ctx.fillText(meters>=1000?meters/1000+' km':meters+' m',17+length/2,height-26);
   canvas.dataset.range=range.toFixed(1);canvas.dataset.center=[cx,cz].join(',');
  }
  function near(){const launch=landmarks.find(l=>l.kind==='launch')||session,dx=launch.x-session.x,dz=launch.z-session.z,nearby=Math.hypot(dx,dz)<900;cx=session.x+(nearby?dx*.4:0);cz=session.z+(nearby?dz*.4:0);range=clamp(Math.hypot(dx,dz)*.65+150,240,550);draw();}
  function overview(){cx=0;cz=0;range=site.chartRange*1.08;draw();}
  function focus(index){selected=index;const l=landmarks[index];cx=(session.x+l.x)/2;cz=(session.z+l.z)/2;range=Math.max(160,Math.abs(session.x-l.x)*Math.min(width,height)/width*.68+75,Math.abs(session.z-l.z)*Math.min(width,height)/height*.68+75);draw();}
  function zoom(factor,x=width/2,y=height/2){const before=position(x,y);range=clamp(range*factor,55,site.chartRange*2);const after=position(x,y);cx+=before[0]-after[0];cz+=before[1]-after[1];draw();}
  function snapshot(){const a=[...pointers.values()];if(!a.length){gesture=null;return;}const p=a.length===1?a[0]:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};gesture={...p,cx,cz,range,d:a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0};}
  const eventPoint=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  listen(canvas,'pointerdown',e=>{e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);if(!pointers.size)moved=false;pointers.set(e.pointerId,eventPoint(e));if(pointers.size>1)moved=true;snapshot();});
  listen(canvas,'pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,eventPoint(e));const a=[...pointers.values()],p=a.length===1?a[0]:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};if(Math.hypot(p.x-gesture.x,p.y-gesture.y)>4)moved=true;
   if(a.length>1&&gesture.d){range=clamp(gesture.range*gesture.d/Math.max(8,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)),55,site.chartRange*2);moved=true;}
   const oldScale=Math.min(width,height)/(gesture.range*2);cx=gesture.cx+(width/2-gesture.x)/oldScale-(width/2-p.x)/scale();cz=gesture.cz+(height/2-gesture.y)/oldScale-(height/2-p.y)/scale();draw();});
  const release=e=>{if(!pointers.has(e.pointerId))return;const p=eventPoint(e);if(e.type==='pointerup'&&!moved&&pointers.size===1){const hit=markers.filter(m=>Math.hypot(m.x-p.x,m.y-p.y)<23).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(hit){selected=hit.index;onSelect(hit.index);draw();}}pointers.delete(e.pointerId);snapshot();};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,name,release);
  listen(canvas,'wheel',e=>{e.preventDefault();const p=eventPoint(e);zoom(Math.exp(clamp(e.deltaY,-150,150)*.003),p.x,p.y);},{passive:false});
  listen(canvas,'keydown',e=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')near();else if(['+','=','-'].includes(e.key))zoom(e.key==='-'?1.4:1/1.4);else{cx+=e.key==='ArrowLeft'?range*.2:e.key==='ArrowRight'?-range*.2:0;cz+=e.key==='ArrowUp'?range*.2:e.key==='ArrowDown'?-range*.2:0;draw();}}});
  // Safari's gesture events must stay within this map, while the rest of the menu scrolls normally.
  for(const name of ['gesturestart','gesturechange','gestureend'])listen(canvas,name,e=>e.preventDefault(),{passive:false});
  const observer=new ResizeObserver(draw);observer.observe(canvas);near();
  return {near,overview,focus,zoom,dispose(){observer.disconnect();events.abort();pointers.clear();}};
 }
 return {create};
})();
