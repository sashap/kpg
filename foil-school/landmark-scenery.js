/* Distinctive background silhouettes, at mapped coordinates and real scale. */
(function(root){'use strict';
function build(c){const {THREE,scenery,mesh,box,rod,g,frame,marker}=c;let count=0;
 const custom=new Set(['amphitheatre','airship-hangar','bayview-canopy','pyramid','salesforce','animal-shelter','shelter-solar']);
 for(const b of g.features.buildings){if(!custom.has(b.style))continue;const {p,w,d}=frame(b),h=b.height;count++;
  if(b.style==='animal-shelter'){
   c.polygon(b.points,h,0xc3bda9,p.position.y);c.polygon(b.points,0,0x818b86,p.position.y+h+.025);
   // Low, connected kennel wings retain the mapped irregular footprint.
   for(let i=1;i<b.points.length;i++){const a=b.points[i-1],d=b.points[i],dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz);for(let t=2;t<len-1;t+=4){const x=a[0]+dx*t/len,z=a[1]+dz*t/len,o=box(scenery,0x536a68,x,p.position.y+2.2,z,1.5,1.0,.10);o.rotation.y=Math.atan2(dx,dz)+Math.PI/2;}rod(scenery,0xe0dbca,[a[0],p.position.y+h-.12,a[1]],[d[0],p.position.y+h-.12,d[1]],.12);}
   for(let i=0;i<4;i++)box(p,0xb4bbb5,-w*.25+i*w*.15,h+.35,0,1.8,.65,2);
  }else if(b.style==='shelter-solar'){
   box(p,0x263e49,0,h,0,w,.16,d);for(let x=-w/2;x<=w/2;x+=1.5)box(p,0x667a81,x,h+.09,0,.025,.012,d);for(let z=-d/2;z<=d/2;z+=2.1)box(p,0x667a81,0,h+.09,z,w,.012,.025);for(const x of [-w*.4,w*.4])for(const z of [-d*.4,d*.4])rod(p,0x85918d,[x,0,z],[x,h,z],.11);
  }else if(b.style==='airship-hangar'){
   const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,11);for(let i=0;i<=40;i++){const a=Math.PI-i*Math.PI/40;shape.lineTo(Math.cos(a)*w/2,11+Math.sin(a)*(h-11));}shape.lineTo(w/2,0);shape.closePath();mesh(p,new THREE.ExtrudeGeometry(shape,{depth:d,steps:1,bevelEnabled:false}),0xa4aaa5,0,0,-d/2);
   for(let z=-d/2;z<=d/2;z+=12)for(let i=0;i<20;i++){const a=i*Math.PI/20,aa=(i+1)*Math.PI/20;rod(p,0x7e8985,[Math.cos(a)*w*.501,11+Math.sin(a)*(h-11)+.1,z],[Math.cos(aa)*w*.501,11+Math.sin(aa)*(h-11)+.1,z],.10);}for(const x of [-w/2,w/2])box(p,0x5f7376,x,8,0,.1,3.2,d*.98);
  }else if(b.style==='bayview-canopy'||b.style==='amphitheatre'){
   const tent=b.style==='amphitheatre',nx=tent?2:3,nz=tent?1:3,mat=new THREE.MeshStandardMaterial({color:tent?0xe5e4d5:0x6b7f86,side:THREE.DoubleSide,roughness:.85});
   if(!tent)box(p,0x6e8385,0,5,0,w*.98,10,d*.98);
   for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){const positions=[],indices=[],sx=w/nx,sz=d/nz;
    for(let j=0;j<=14;j++)for(let i=0;i<=14;i++){const u=i/14,v=j/14,x=-w/2+(ix+u)*sx,z=-d/2+(iz+v)*sz,r=Math.max(Math.abs(u-.5)*2,Math.abs(v-.5)*2),y=(tent?5:10)+(h-(tent?5:10))*Math.pow(1-r,1.7);positions.push(x,y,z);if(i<14&&j<14){const k=j*15+i;indices.push(k,k+15,k+1,k+1,k+15,k+16);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(p,geo,mat);if(tent){const x=-w/2+(ix+.5)*sx;rod(p,0x8e9a97,[x,0,0],[x,h+4,0],.3);}
   }
  }else if(b.style==='pyramid'){
   const shape=new THREE.CylinderGeometry(.12,Math.min(w,d)*.63,h,4,1);const tower=mesh(p,shape,0xb7beb6,0,h/2,0);tower.rotation.y=Math.PI/4;for(const x of [-w*.28,w*.28])box(p,0xb7beb6,x,82,0,8,164,12);
  }else if(b.style==='salesforce'){
   const points=[];for(let i=0;i<=32;i++){const t=i/32,r=(t<.88?1-.25*t:Math.sqrt(Math.max(0,1-((t-.88)/.12)**2))*.78)*Math.min(w,d)*.47;points.push(new THREE.Vector2(Math.max(.3,r),h*t));}mesh(p,new THREE.LatheGeometry(points,20),0x879da3);
   for(let i=1;i<54;i++){const y=i*h/58,r=Math.min(w,d)*.47*(1-.25*y/h);const ring=mesh(p,new THREE.TorusGeometry(r,.16,4,20),0xb4c1c1,0,y,0);ring.rotation.x=Math.PI/2;}
  }
 }
 if(g.site.id==='coyote')marker('Peninsula Humane Society · Coyote Point Shelter','ANIMAL SHELTER',37.58724,-122.33025,8);
 if(g.site.id==='shoreline'){marker('Shoreline Amphitheatre','AMPHITHEATRE',37.426789,-122.080758,20);marker('Restored Hangar One','HANGAR ONE',37.412977,-122.053995,64);}
 if(g.site.id==='crissy'){marker('Fort Mason piers','FORT MASON',37.8088,-122.432,19);marker('San Francisco skyline','CITY SKYLINE',37.7911,-122.4028,260);}
 return {customLandmarks:count};
}
root.FoilLandmarkScenery={build};
})(globalThis);
