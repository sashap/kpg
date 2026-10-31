#!/usr/bin/env python3
"""Reproduce Le Morne's offline OSM geometry and Copernicus GLO-30 terrain.

Usage: python3 foil-school/extract-lemorne.py /path/to/downloads
Inputs: map.osm (OSM API bbox 57.28,-20.51,57.40,-20.39), dem.tif
(Copernicus_DSM_COG_10_S21_00_E057_00_DEM). Requires system libtiff,
not Python packages. See README for acquisition URLs and attribution.
The raster is a surface model (EGM2008), not surveyed bathymetry.
"""
from pathlib import Path
import array, base64, ctypes, ctypes.util, json, math, struct, sys
import xml.etree.ElementTree as ET

folder=Path(sys.argv[1]); out=Path(__file__).resolve().parent
root=ET.parse(folder/'map.osm').getroot()
nodes={e.get('id'):[float(e.get('lat')),float(e.get('lon'))] for e in root.findall('node')}
ways={e.get('id'):e for e in root.findall('way')}
def tags(e): return {t.get('k'):t.get('v') for t in e.findall('tag')}
def points(e): return [nodes[n.get('ref')] for n in e.findall('nd')]
def center(p): return [sum(v[i] for v in p)/len(p) for i in range(2)]
def area(p):
    a,b=p[0];q=[((x-a)*111320,(y-b)*104300) for x,y in p]
    return abs(sum(x[0]*y[1]-x[1]*y[0] for x,y in zip(q,q[1:]))/2)
def simplify(p,tolerance=1.5):
    if len(p)<3:return p
    a,b=p[0],p[-1];dx=(b[0]-a[0])*111320;dy=(b[1]-a[1])*104300
    length=dx*dx+dy*dy;best=0;idx=0
    for i,v in enumerate(p[1:-1],1):
        x=(v[0]-a[0])*111320;y=(v[1]-a[1])*104300;t=max(0,min(1,(x*dx+y*dy)/(length or 1)))
        d=(x-t*dx)**2+(y-t*dy)**2
        if d>best:best=d;idx=i
    return simplify(p[:idx+1],tolerance)[:-1]+simplify(p[idx:],tolerance) if best>tolerance*tolerance else [a,b]
def number(s,default=0):
    try:return float(s.split(' ')[0])
    except (ValueError,AttributeError):return default
def feature(id,e,kind):
    t=tags(e)
    return dict(id=id,name=t.get('name',''),kind=kind,surface=t.get('surface',''),highway=t.get('highway',''),points=simplify(points(e),.7))
coast=[]
for id in ['611244272','1133512995','1133270214','116709097','617130638','1133524735','1133524736','617455417','1135472235']:
    p=points(ways[id]);assert not coast or coast[-1]==p[0],id
    coast+=p if not coast else p[1:]
coast=simplify(coast,2)
# Mauritius is EAST of this coast. Explicit land polygons avoid the California
# coastline's southward closing convention turning the Indian Ocean into land.
land=coast+[[coast[-1][0],57.58],[-20.25,57.58],[-20.25,coast[0][1]],coast[0]]
data=dict(coast=coast,land=[land],islands=[],reefs=[],buildings=[],ground=[],parking=[],parkingAisles=[],roads=[],paths=[],piers=[],trees=[],pools=[])
for id,e in ways.items():
    t=tags(e);p=points(e);lat,lon=center(p);closed=len(p)>3 and p[0]==p[-1]
    near=-20.487<lat<-20.425 and 57.295<lon<57.345
    if t.get('natural')=='coastline' and closed:data['islands'].append(simplify(p,1.8))
    if t.get('natural')=='reef' and closed:data['reefs'].append(feature(id,e,'reef'))
    if not near:continue
    if t.get('building') and closed and area(p)>35:
        f=feature(id,e,t['building']);f['height']=number(t.get('height'),number(t.get('building:levels'),2)*3.2)
        f['style']='morne-resort';f['modern']=lat<-20.4656 and 57.3096<lon<57.318
        if f['modern']:f['height']=max(9.3 if area(p)>500 else 3.3,f['height'])
        data['buildings'].append(f)
    kind=t.get('natural',t.get('golf',t.get('landuse','')))
    if closed and kind in ['beach','sand','wood','scrub','forest','grass','green','fairway','tee','bunker']:
        data['ground'].append(feature(id,e,kind))
    if closed and t.get('leisure')=='swimming_pool':data['pools'].append(feature(id,e,'pool'))
    if closed and t.get('amenity')=='parking':data['parking'].append(feature(id,e,'parking'))
    if t.get('service')=='parking_aisle':data['parkingAisles'].append(feature(id,e,'aisle'))
    elif t.get('highway') in ['footway','path','pedestrian','track']:data['paths'].append(feature(id,e,'path'))
    elif t.get('highway') in ['secondary','tertiary','residential','service','unclassified']:data['roads'].append(feature(id,e,'road'))
    if t.get('man_made')=='pier':data['piers'].append(feature(id,e,'pier'))
data['cliffRim']=points(ways['409559878'])
if data['cliffRim'][-1]!=data['cliffRim'][0]:data['cliffRim'].append(data['cliffRim'][0])
data['references']=[
 dict(name='Le Morne Brabant',short='LE MORNE BRABANT',point=[-20.4528,57.3232],height=28),
 dict(name='La Pointe · outer lagoon',short='LA POINTE',point=[-20.46608,57.30933],height=7),
 dict(name='Ilôt Fourneau',short='ILÔT FOURNEAU',point=[-20.47116,57.33714],height=12),
 dict(name='Le Morne public beach',short='PUBLIC BEACH',point=[-20.45234,57.31265],height=5),
 dict(name='Mountain trail entrance',short='MOUNTAIN TRAIL',point=[-20.46018,57.32716],height=5),
 dict(name='RIU Turquoise',short='RIU TURQUOISE',point=[-20.46702,57.31410],height=18),
 dict(name='One Eye · outer reef',short='ONE EYE REEF',point=[-20.4639,57.3018],height=4),
]
data['source']={'url':'https://www.openstreetmap.org/copyright','retrieved':'2026-10-31','license':'ODbL 1.0','notes':'OSM geometry; labels and shore details cross-checked with ION Club 2025 spot map, Esri aerial imagery and RIU 2024 photographs. Reef depths are gameplay approximations.'}
def write(name,global_name,value,comment):
    (out/name).write_text('/* '+comment+' */\n(function(root){const data='+json.dumps(value,separators=(',',':'),ensure_ascii=False)+';root.'+global_name+'=data;if(typeof module!=="undefined"&&module.exports)module.exports=data;})(globalThis);\n')
write('lemorne-data.js','FoilLeMorneData',data,'Le Morne geometry © OpenStreetMap contributors, ODbL 1.0. See extract-lemorne.py and README.')

# libtiff handles Deflate + floating-point predictor in the published COG.
lib=ctypes.CDLL(ctypes.util.find_library('tiff') or '/opt/homebrew/lib/libtiff.dylib')
lib.TIFFOpen.argtypes=[ctypes.c_char_p,ctypes.c_char_p];lib.TIFFOpen.restype=ctypes.c_void_p
lib.TIFFReadTile.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_uint32,ctypes.c_uint32,ctypes.c_uint32,ctypes.c_uint16];lib.TIFFReadTile.restype=ctypes.c_ssize_t
lib.TIFFClose.argtypes=[ctypes.c_void_p]
b=(folder/'dem.tif').read_bytes();offset=struct.unpack_from('<I',b,4)[0];metadata={}
for i in range(struct.unpack_from('<H',b,offset)[0]):
    a=offset+2+i*12;tag,typ,n,val=struct.unpack_from('<HHII',b,a)
    if typ not in [3,4,12]:continue
    size,fmt={3:(2,'H'),4:(4,'I'),12:(8,'d')}[typ];pos=a+8 if n*size<=4 else val
    metadata[tag]=struct.unpack_from('<'+str(n)+fmt,b,pos)
width,height=metadata[256][0],metadata[257][0];tw,th=metadata[322][0],metadata[323][0]
step=metadata[33550][0];west,north=metadata[33922][3:5]
assert metadata[258][0]==32 and metadata[339][0]==3
assert metadata[34735][11]==2,'Expected pixel-is-point GLO-30 grid'
tif=lib.TIFFOpen(str(folder/'dem.tif').encode(),b'r');assert tif
tiles={}
def value(x,y):
    tx,ty=x//tw,y//th;key=(tx,ty)
    if key not in tiles:
        buf=ctypes.create_string_buffer(tw*th*4);read=lib.TIFFReadTile(tif,buf,tx*tw,ty*th,0,0);assert read==len(buf)
        a=array.array('f');a.frombytes(buf.raw);tiles[key]=a
    return tiles[key][(y%th)*tw+x%tw]
grids={}
for name,bounds,stride in [('lemorne',[57.285,-20.505,57.402,-20.392],1),('mauritius',[57.245,-20.57,57.58,-20.29],4)]:
    x0=math.floor((bounds[0]-west)/step);x1=math.ceil((bounds[2]-west)/step);y0=math.floor((north-bounds[3])/step);y1=math.ceil((north-bounds[1])/step)
    xs=list(range(x0,x1+1,stride));ys=list(range(y0,y1+1,stride));v=[value(x,y) for y in ys for x in xs]
    packed=struct.pack('<'+str(len(v))+'h',*[round(h*10) if math.isfinite(h) and -3276<h<3276 else -32768 for h in v])
    grids[name]=dict(width=len(xs),height=len(ys),bounds=[west+(xs[0]-stride/2)*step,north-(ys[-1]+stride/2)*step,west+(xs[-1]+stride/2)*step,north-(ys[0]-stride/2)*step],datum='EGM2008',samples=base64.b64encode(packed).decode())
    print(name,len(xs),len(ys),'height range',round(min(v),2),round(max(v),2))
lib.TIFFClose(tif)
write('lemorne-elevation-data.js','FoilLeMorneElevationData',dict(source='Copernicus DEM GLO-30',url='https://registry.opendata.aws/copernicus-dem/',retrieved='2026-10-31',datum='EGM2008 orthometric heights',scale=.1,grids=grids),'Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30. See README for license and DSM limitations.')
print('Geometry:',{k:len(v) for k,v in data.items() if isinstance(v,list)})
