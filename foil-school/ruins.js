/* Weathered masonry, open arches, a courtyard and a climbable coastal footpath. */
(function(root){
'use strict';
function build({THREE,scenery}){
 const c=FoilWorld.castle,group=new THREE.Group();scenery.add(group);let seed=7261;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#999889';ctx.fillRect(0,0,512,512);
 for(let i=0;i<19000;i++){const v=105+Math.floor(random()*80);ctx.fillStyle=`rgba(${v},${v},${v-12},.3)`;ctx.fillRect(random()*512,random()*512,1+random()*3,1+random()*2);}for(let i=0;i<35;i++){ctx.strokeStyle='#55594d30';ctx.lineWidth=.6;ctx.beginPath();let x=random()*512,y=random()*512;ctx.moveTo(x,y);for(let j=0;j<6;j++){x+=random()*15-4;y+=random()*8;ctx.lineTo(x,y);}ctx.stroke();}
 // Fine mineral grain, pale lichen, and rain-darkened seams on rough limestone.
 for(let i=0;i<180;i++){ctx.fillStyle=i%3?'#d3ceaa30':'#53644425';ctx.beginPath();ctx.ellipse(random()*512,random()*512,2+random()*13,1+random()*9,random()*6,0,Math.PI*2);ctx.fill();}
 for(let i=0;i<25;i++){const x=random()*512;const stain=ctx.createLinearGradient(x,0,x,512);stain.addColorStop(0,'#33433722');stain.addColorStop(1,'#33433700');ctx.fillStyle=stain;ctx.fillRect(x,0,2+random()*5,512);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;
 const stone=[0xb4b09e,0xa4a48e,0xc1b9a4,0x929782,0xada996].map(color=>new THREE.MeshStandardMaterial({color,map:texture,bumpMap:texture,bumpScale:.055,roughnessMap:texture,roughness:1}));
 const dark=new THREE.MeshStandardMaterial({color:0x535e55,roughness:1}),wood=new THREE.MeshStandardMaterial({color:0x797262,roughness:.96,map:texture}),moss=new THREE.MeshStandardMaterial({color:0x5b6c42,roughness:1}),cube=new THREE.BoxGeometry(1,1,1);
 const bevelShape=new THREE.Shape();bevelShape.moveTo(-.475,-.475);bevelShape.lineTo(.475,-.475);bevelShape.lineTo(.475,.475);bevelShape.lineTo(-.475,.475);bevelShape.closePath();
 const cutStone=new THREE.ExtrudeGeometry(bevelShape,{depth:.95,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,curveSegments:1});cutStone.translate(0,0,-.475);
 function box(x,y,z,w,h,d,material=stone[Math.floor(random()*stone.length)],angle=0){const m=new THREE.Mesh(stone.includes(material)?cutStone:cube,material);m.position.set(x,y+h/2,z);m.scale.set(w,h,d);m.rotation.y=angle;m.castShadow=m.receiveShadow=true;group.add(m);return m;}
 // The shared stone schedule includes walls, door jambs, tower shells and rubble.
 const floor=c.floor;
 for(const b of c.solids)box(b.x,b.y,b.z,b.w,b.h,b.d,stone[b.material],b.angle);
 for(let x=-10.8;x<11;x+=1.2)for(let z=-13.8;z<14;z+=1.4)box(c.x+x,floor-.015,c.z+z,1.14,.025,1.34,stone[(Math.round((x+11)*2+(z+14)*3)+100)%stone.length]);
 for(const t of c.towers){const paving=new THREE.Mesh(new THREE.CylinderGeometry(t.r+.4,t.r+.4,.22,32),stone[1]);paving.position.set(t.x,floor-.11,t.z);paving.receiveShadow=true;group.add(paving);}
 // Individually cut arch stones, with an open space below the curved lintel.
 function arch(x,z,baseY,radius,angle=0){const archGroup=new THREE.Group();archGroup.position.set(x,baseY,z);archGroup.rotation.y=angle;group.add(archGroup);
  for(let i=0;i<13;i++){const a=i/13*Math.PI,b=(i+1)/13*Math.PI,inner=radius,outer=radius+.55,positions=[],indices=[];for(const depth of [-.65,.65])for(const [r,t] of [[inner,a],[outer,a],[outer,b],[inner,b]])positions.push(depth,3.1+Math.sin(t)*r,Math.cos(t)*r);for(const face of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]])indices.push(face[0],face[1],face[2],face[0],face[2],face[3]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.Mesh(g,stone[i%5]);m.castShadow=m.receiveShadow=true;archGroup.add(m);}
 }
 for(const a of c.arches)arch(a.x,a.z,a.y,a.r);
 // Broken hall doorway and a surviving floor mosaic.

 const tileMats=[0x697f7d,0xc8bd9b,0x6f8073].map(color=>new THREE.MeshStandardMaterial({color,roughness:.9}));for(let x=-7;x<-1;x+=.35)for(let z=-10;z<-4;z+=.35)if(random()>.16)box(c.x+x,floor+.018,c.z+z,.32,.025,.32,tileMats[Math.floor(Math.abs(Math.sin(x+z*.65))*2.99)]);
 // An open well, weathered coping, and a dark cistern rather than a solid cylinder.
 const wellGeo=new THREE.CylinderGeometry(1.02,1.04,1.05,24,1,true),well=new THREE.Mesh(wellGeo,stone[2]);well.position.set(c.x,floor+.525,c.z);well.material=well.material.clone();well.material.side=THREE.DoubleSide;group.add(well);const darkWater=new THREE.Mesh(new THREE.CircleGeometry(.95,24),dark);darkWater.rotation.x=-Math.PI/2;darkWater.position.set(c.x,floor+.08,c.z);group.add(darkWater);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;box(c.x+Math.sin(a),floor+1.05,c.z+Math.cos(a),.44,.18,.3,stone[2],a);}
 // Stone steps are the same treads used by the walking collision model.
 for(const p of c.path){const ground=FoilWorld.terrainHeight(p.x,p.z),pier=ground<0,baseY=pier?p.y-.16:Math.min(ground-.12,p.y-.25);box(p.x,baseY,p.z,p.width,p.y-baseY,p.length,pier?wood:stone[1],p.angle);}
 for(let x=82;x<=94;x+=3.5)for(const side of [-1,1]){const y=FoilWorld.terrainHeight(c.x+x,c.z+side*1.2);box(c.x+x,y,c.z+side*1.2,.22,1.5-y,.22,wood);}
 // Low moss patches and rubble gather along the masonry, leaving the main route open.
 const rubbleGeo=new THREE.IcosahedronGeometry(1,1);for(let i=0;i<95;i++){const side=i%2?1:-1,x=c.x+side*(8.8+random()*2),z=c.z-12+random()*24;const m=new THREE.Mesh(rubbleGeo,stone[i%5]);m.position.set(x,floor+.10,z);m.scale.set(.15+random()*.25,.04+random()*.05,.18+random()*.25);m.rotation.y=random()*6;group.add(m);if(i%3===0)box(x,floor+.01,z,.45,.03,.6,moss);}
 // Readable markers invite exploration without floating game objects in the ruins.
 for(const site of c.sites){box(site.x+.8,floor,site.z,.12,.85,.12,wood);const sign=box(site.x+.8,floor+.76,site.z,.54,.30,.05,dark);sign.rotation.x=-.2;}
 return group;
}
root.FoilRuins={build};
})(globalThis);
