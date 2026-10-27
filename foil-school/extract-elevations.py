#!/usr/bin/env python3
"""Pack public USGS 3DEP uncompressed F32 GeoTIFF exports for offline use.
Input: foil-dem-{shoreline,third,coyote,crissy,region}.{json,tif} in argv[1].
The JSON is the exportImage response (including the actual pixel-edge extent).
Values are decimetres (California NAVD88, Hawaii local mean sea level),
packed little-endian signed 16-bit; -32768 is nodata.
No optional Python packages are required. See README for acquisition parameters.
"""
from pathlib import Path
import base64,json,math,struct,sys

def read_tiff(path):
    buf=path.read_bytes();e='<' if buf[:2]==b'II' else '>'
    if struct.unpack_from(e+'H',buf,2)[0]!=42:raise ValueError('Expected classic TIFF')
    off=struct.unpack_from(e+'I',buf,4)[0];tags={}
    for i in range(struct.unpack_from(e+'H',buf,off)[0]):
        at=off+2+i*12;tag,typ,n,value=struct.unpack_from(e+'HHII',buf,at)
        if typ not in (3,4):continue
        size,fmt=(2,'H') if typ==3 else (4,'I');pos=at+8 if n*size<=4 else value
        tags[tag]=struct.unpack_from(e+str(n)+fmt,buf,pos)
    w,h=tags[256][0],tags[257][0]
    assert tags[259][0]==1 and tags[258][0]==32 and tags[339][0]==3,'Need uncompressed float32 TIFF'
    tw,th=tags[322][0],tags[323][0];cols=math.ceil(w/tw);out=[None]*(w*h)
    for tile,start in enumerate(tags[324]):
        vals=struct.unpack_from(e+str(tw*th)+'f',buf,start) if start else [0.]*(tw*th);x0=(tile%cols)*tw;y0=(tile//cols)*th
        for y in range(min(th,h-y0)):
            for x in range(min(tw,w-x0)):out[(y0+y)*w+x0+x]=vals[y*tw+x]
    return w,h,out

if __name__=='__main__':
    source=Path(sys.argv[1]);data={'source':'USGS 3DEP Bare Earth DEM Dynamic service','url':'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer','retrieved':'2026-10-27','datum':'Per grid: California NAVD88; Hawaii local mean sea level','units':'metres','scale':.1,'grids':{}}
    for name in ['shoreline','third','coyote','crissy','region','kahului','maui']:
        info=json.loads((source/f'foil-dem-{name}.json').read_text());w,h,vals=read_tiff(source/f'foil-dem-{name}.tif');extent=info['extent'];packed=[round(v*10) if math.isfinite(v) and -3276<v<3276 else -32768 for v in vals]
        data['grids'][name]={'width':w,'height':h,'bounds':[extent[k] for k in ['xmin','ymin','xmax','ymax']],'datum':'local mean sea level' if name in ['kahului','maui'] else 'NAVD88','samples':base64.b64encode(struct.pack('<'+str(len(packed))+'h',*packed)).decode()}
        good=[v for v in vals if -3276<v<3276];print(name,w,h,'range',round(min(good),2),round(max(good),2),'nodata',packed.count(-32768))
    text='/* Public-domain USGS 3DEP elevation samples; see extract-elevations.py. */\n(function(root){const data='+json.dumps(data,separators=(',',':'))+';root.FoilElevationData=data;if(typeof module!=="undefined"&&module.exports)module.exports=data;})(globalThis);\n'
    (Path(__file__).parent/'elevation-data.js').write_text(text)
