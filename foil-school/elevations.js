/* USGS metres at original pixel centres: NAVD88 in California; local MSL in Hawaii. */
(function(root){'use strict';
const source=typeof module!=='undefined'&&module.exports?require('./elevation-data.js'):root.FoilElevationData,cache=new Map();
function grid(name){if(cache.has(name))return cache.get(name);const g=source.grids[name];if(!g)return null;const bytes=typeof Buffer!=='undefined'?Buffer.from(g.samples,'base64'):Uint8Array.from(atob(g.samples),c=>c.charCodeAt(0)),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),h=new Float32Array(g.width*g.height);for(let i=0;i<h.length;i++){const n=v.getInt16(i*2,true);h[i]=n===-32768?NaN:n*.1;}const result={...g,h};cache.set(name,result);return result;}
function sample(g,lat,lon){if(!g)return null;const [west,south,east,north]=g.bounds,u=(lon-west)/(east-west)*g.width-.5,v=(north-lat)/(north-south)*g.height-.5;if(u<0||v<0||u>=g.width-1||v>=g.height-1)return null;const x=Math.floor(u),y=Math.floor(v),a=u-x,b=v-y,k=y*g.width+x,h=g.h,z=(h[k]*(1-a)+h[k+1]*a)*(1-b)+(h[k+g.width]*(1-a)+h[k+g.width+1]*a)*b;return Number.isFinite(z)?z:null;}
function height(id,lat,lon){const local=sample(grid(id),lat,lon),regional=sample(grid(id==='kahului'?'maui':'region'),lat,lon);return local??regional;}
const api={height,source:source.url,datum:source.datum,waterDatum:id=>id==='shoreline'?2.98:id==='kahului'?0:.97};root.FoilElevations=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
