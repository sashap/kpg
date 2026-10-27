/* Latched wing pad: semicircular overhead arc tapering to a sheet-in point. */
(function(root){
'use strict';const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),cx=110,cy=78,r=87,ry=50,tip=122,width=220,height=148;
function point(angle,power){const a=clamp(angle,-1,1)*Math.PI/2,p=clamp(power,0,1);return {x:cx+Math.sin(a)*r*(1-p),y:cy-Math.cos(a)*ry+(tip-cy+Math.cos(a)*ry)*p};}
function read(x,y,angle){
 // Find the ray's intersection with the upper arc. Along that ray, distance
 // toward the cone point is sheeting; movement along the rim is wing angle.
 const scale=r/ry;let dx=x-cx,dy=(y-tip)*scale;if(dy>=0)return {angle,power:1};
 const spread=Math.atan2(dx,-dy),limit=Math.atan2(r,(tip-cy)*scale),a=clamp(spread,-limit,limit),ux=Math.sin(a),uy=-Math.cos(a),h=(tip-cy)*scale;
 const reach=-h*uy+Math.sqrt(Math.max(0,r*r-h*h*ux*ux)),edgeX=ux*reach,edgeY=h+uy*reach,radial=Math.hypot(dx,dy),onRim=radial>=reach*.94;
 if(onRim)return {angle:clamp(Math.atan2(edgeX,-edgeY)/(Math.PI/2),-1,1),power:0};
 const edge=point(angle,0),vx=edge.x-cx,vy=(edge.y-tip)*scale,projection=(dx*vx+dy*vy)/(vx*vx+vy*vy);
 return {angle,power:clamp(1-projection,0,1)};
}
const api={point,read,cx,cy,r,ry,tip,width,height};root.FoilWingControl=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
