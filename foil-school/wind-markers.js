/* Sparse shore wind references. Both stream downwind; they droop in calm air. */
(function(root){'use strict';
function create({THREE,scene}){
 const markers=[],V=(x,y,z)=>new THREE.Vector3(x,y,z),poleMat=new THREE.MeshStandardMaterial({color:0xbfc6be,roughness:.55});
 function pole(x,y,z,height){const p=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,height,10),poleMat);p.position.set(x,y+height/2,z);scene.add(p);const q=new THREE.Group();q.position.set(x,y+height,z);scene.add(q);return q;}
 function sock(x,y,z,height=6){const q=pole(x,y,z,height),geo=new THREE.BufferGeometry(),pos=[],col=[],index=[],rings=12,n=12;
  for(let j=0;j<=rings;j++)for(let i=0;i<=n;i++){pos.push(0,0,0);const c=new THREE.Color(Math.floor(j/2)%2?0xe7e5d7:0xe8753e);col.push(c.r,c.g,c.b);if(j<rings&&i<n){const k=j*(n+1)+i;index.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}}
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.setIndex(index);const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}));q.add(m);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.025,6,20),poleMat);q.add(ring);markers.push({kind:'sock',q,geo,rings,n,x,z});return q;
 }
 function flag(x,y,z,height=4,design='us'){const q=pole(x,y,z,height),canvas=document.createElement('canvas');canvas.width=380;canvas.height=200;const c=canvas.getContext('2d');for(let i=0;i<13;i++){c.fillStyle=i%2?'#f3f1e5':'#b84442';c.fillRect(0,i*200/13,380,200/13+.5);}c.fillStyle='#264568';c.fillRect(0,0,152,200*7/13);c.fillStyle='#f5f2e6';for(let row=0;row<9;row++)for(let i=0;i<(row%2?5:6);i++){const x=12.65+i*25.3+(row%2?12.65:0),y=6+(row*12);c.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,r=k%2?1.7:3.6;k?c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();}if(design==='cabrinha'){c.fillStyle='#efc52c';c.fillRect(0,0,380,200);c.strokeStyle='#253a40';c.lineWidth=13;c.beginPath();c.arc(190,80,47,.65,5.7);c.stroke();c.lineWidth=5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(106,48+i*23);c.bezierCurveTo(145,20+i*23,140,65+i*23,164,44+i*23);c.stroke();}c.fillStyle='#253a40';c.textAlign='center';c.font='italic bold 37px Arial';c.fillText('CABRINHA',190,166);}const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const geo=new THREE.PlaneGeometry(2.85,1.5,24,10),mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:1}));if(design==='cabrinha'){
   // Uneven worn fly edge: the trailing vertices remain part of the cloth,
   // so the frayed silhouette moves with the same wind as the canopy.
   const p=geo.attributes.position;
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),row=Math.round((.75-y)/.15),wear=[.06,.26,.10,.38,.18,.04,.31,.09,.43,.16,.06][row]||0;
    if(x>1.05)p.setX(i,x-wear*Math.pow((x-1.05)/.375,1.2));
   }
   geo.computeVertexNormals();
  }
  q.add(mesh);markers.push({kind:'flag',q,geo,base:geo.attributes.position.array.slice(),x,z});return q;
 }
 function update(s){const strength=Math.min(1,Math.max(0,s.wind/7));for(const m of markers){const p=m.geo.attributes.position;if(m.kind==='sock'){m.q.rotation.y=s.windFrom;for(let j=0;j<=m.rings;j++)for(let i=0;i<=m.n;i++){const t=j/m.rings,a=i/m.n*Math.PI*2,r=.36-.23*t,flap=Math.sin(s.time*(4+strength*3)-t*9)*.045*strength*t;p.setXYZ(j*(m.n+1)+i,Math.cos(a)*r+flap,Math.sin(a)*r-t*t*(1-strength)*1.65-t*.08,-t*(.3+1.9*strength));}}else{m.q.rotation.y=s.windFrom+Math.PI/2;for(let i=0;i<p.count;i++){const x=m.base[i*3]+1.425,t=x/2.85,y=m.base[i*3+1]-.75;p.setXYZ(i,x*(.15+.85*strength),y-t*t*(1-strength)*1.65,Math.sin(s.time*5-t*9+y)*.16*t*strength);}}p.needsUpdate=true;m.geo.computeVertexNormals();m.geo.computeBoundingSphere();}}
 return {sock,flag,update,diagnostics:()=>markers.map(m=>({kind:m.kind,x:m.x,z:m.z,angle:m.q.rotation.y}))};
}
root.FoilWindMarkers={create};
})(globalThis);
