#!/usr/bin/env python3
"""Rebuild mapped features from saved OSM API map XML extracts (see README)."""
import xml.etree.ElementTree as E,json,math,sys

from pathlib import Path
DATA_DIR=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp')
sources={};tree_nodes={}
for site in ['shoreline','third','coyote','crissy','sfo','golden-gate','alcatraz','sanmateo','burlingame','gilead','hayward']:
 r=E.parse(DATA_DIR/('foil-'+site+'-map.osm')).getroot();n={e.attrib['id']:[float(e.attrib['lat']),float(e.attrib['lon'])] for e in r.findall('node')}
 tree_nodes[site]=[n[e.attrib['id']] for e in r.findall('node') if any(t.attrib.get('k')=='natural' and t.attrib.get('v')=='tree' for t in e.findall('tag'))]
 sources[site]={e.attrib['id']:{'tags':{x.attrib['k']:x.attrib['v'] for x in e.findall('tag')},'points':[n[x.attrib['ref']] for x in e.findall('nd') if x.attrib['ref'] in n]} for e in r.findall('way')}
def way(site,id):return sources[site][str(id)]['points']
def chain(site,ids):
 out=[]
 for id in ids:
  p=way(site,id)
  if out and p[-1]==out[-1]:p=p[::-1]
  if out and out[-1]!=p[0]:print('gap',id,out[-1],p[0])
  out+=p[1:] if out else p
 return out
def objects(site,filter):
 out=[]
 for id,w in sources[site].items():
  t=w['tags']
  if filter(t):out.append({'id':id,'name':t.get('name',''),'kind':t.get('golf',t.get('natural',t.get('landuse',t.get('man_made',t.get('aeroway',t.get('building','path')))))),'levels':t.get('building:levels',''),'roof':t.get('roof:shape',''),'roofColor':t.get('roof:colour',''),'address':t.get('addr:housenumber',''),'height':float(t.get('height','0').split(' ')[0]) if t.get('height','0').split(' ')[0].replace('.','').isdigit() else 0,'surface':t.get('surface',''),'service':t.get('service',''),'highway':t.get('highway',''),'points':w['points']})
 return out
coyote=chain('coyote',[157482119,157482121]);sfo=chain('sfo',[4897486,157482120,4896831]);assert coyote[-1]==sfo[0]
crissy=chain('crissy',[82246921,153269401,592952246,592952251,592952249,1566841330,592952250,1566841329]);ggcoast=way('golden-gate',592935016);assert crissy[-1]==ggcoast[0]
data={
 'shoreline':{'water':way('shoreline',50372802),'islands':[way('shoreline',50372805)],'buildings':objects('shoreline',lambda t:t.get('building') and t.get('name') or t.get('building')=='commercial'),'piers':objects('shoreline',lambda t:t.get('man_made')=='pier')},
 'third':{'coast':chain('third',[157483647]),'islands':[way('third',48174315)],'paths':objects('third',lambda t:t.get('name')=='Bay Trail')},
 'coyote':{'coast':coyote+sfo[1:],'buildings':objects('coyote',lambda t:t.get('building') and t.get('name'))+objects('sfo',lambda t:t.get('man_made')=='tower' or t.get('aeroway')=='terminal'),'piers':objects('coyote',lambda t:t.get('man_made') in ['pier','breakwater']),'runways':objects('sfo',lambda t:t.get('aeroway')=='runway')},
 'crissy':{'coast':crissy+ggcoast[1:],'islands':[way('alcatraz',295140461)],'buildings':objects('crissy',lambda t:t.get('building') and t.get('name'))+objects('alcatraz',lambda t:t.get('building') and t.get('name')),'piers':objects('crissy',lambda t:t.get('man_made')=='pier'),'bridge':way('golden-gate',595194543),'marin':chain('golden-gate',[836580772,770706078,836580771,836580767,770706076,836580764,770555069,770239885,720421680,836580778,770555067,836580759,770239881,972981492,770239882,836580757,836580752,770239878,770239879,157393800])}
}
data['third']['bridge']=way('sanmateo',42248740)
data['third']['bridgeApproaches']=[chain('gilead',[23747039,1485868796]),way('hayward',156047222)]
# Deduplicate overlapping extracts, retain actual footprint/floor/ground tags.
def unique(items): return list({v['id']:v for v in items}.values())
def area(p): return abs(sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(p,p[1:])))*111320*88200/2
for site,extras in [('shoreline',[]),('third',['gilead']),('coyote',['burlingame']),('crissy',[])]:
 parts=[site]+extras
 buildings=unique([b for part in parts for b in objects(part,lambda t:bool(t.get('building')))])
 buildings=[b for b in buildings if b['name'] or area(b['points'])>130]
 for b in buildings:
  if b['levels'].replace('.','').isdigit() and not b['height']: b['height']=float(b['levels'])*3.8
 data[site]['buildings']=unique(data[site].get('buildings',[])+buildings)
 data[site]['ground']=unique([b for part in parts for b in objects(part,lambda t:t.get('natural') in ['beach','sand','wood','scrub','wetland','grassland'] or t.get('landuse') in ['grass','forest','meadow','recreation_ground'] or t.get('golf') in ['fairway','green','bunker','tee','driving_range']) if len(b['points'])>3 and b['points'][0]==b['points'][-1]])
 data[site]['paths']=unique([b for part in parts for b in objects(part,lambda t:t.get('highway') in ['footway','cycleway','path']) if len(b['points'])>1])
 data[site]['parking']=unique([b for part in parts for b in objects(part,lambda t:t.get('amenity')=='parking') if len(b['points'])>3 and b['points'][0]==b['points'][-1]])
 data[site]['parkingAisles']=unique([b for part in parts for b in objects(part,lambda t:t.get('service')=='parking_aisle') if len(b['points'])>1])
 data[site]['roads']=unique([b for part in parts for b in objects(part,lambda t:t.get('name') in ['North Shoreline Boulevard','Coyote Point Park Road','Airport Boulevard','Bay Trail Lane','Lakeside Drive','East 3rd Avenue','East Third Avenue','J. Hart Clinton Drive','Mariners Island Boulevard','Bayside Way','Velocity Way']) if len(b['points'])>1])
 data[site]['ponds']=[b['points'] for part in parts for b in objects(part,lambda t:t.get('natural')=='water') if b['id']!='50372802' and b['points'][0]==b['points'][-1] and area(b['points'])>500]
 data[site]['trees']=[p for part in parts for p in tree_nodes[part]]
data['third']['eastCoast']=chain('hayward',[157480228,157480226])
# The lower-launch access road is unnamed in OSM; retaining only named roads
# left the parking lot disconnected from the street through Mariners Point.
for id in ['35394568','566723289','690060064']:
 data['third']['roads'].append({'id':id,'name':'Baywinds Park access','highway':'service','surface':'asphalt','points':way('third',id)})
# Focus on scenery seen from the water, excluding dense residential interiors.
origins={'shoreline':(37.43312,-122.09025),'third':(37.5764,-122.2818),'coyote':(37.5921,-122.3294),'crissy':(37.8081,-122.4534)}
for site,d in data.items():
 lat,lon=origins[site]
 def near(points,r):return any(math.hypot((p[0]-lat)*111320,(p[1]-lon)*88200)<r for p in points)
 d['buildings']=[b for b in d['buildings'] if (near(b['points'],1900 if site!='coyote' else 2600) and (area(b['points'])>220 or b['name'])) or b['kind']=='terminal' or 'Prison' in b['name'] or 'Control Tower' in b['name']]
 d['parking']=[b for b in d['parking'] if near(b['points'],1400)]
 d['parkingAisles']=[b for b in d['parkingAisles'] if near(b['points'],1400)]
 d['roads']=[b for b in d['roads'] if near(b['points'],1400)]
 d['paths']=[b for b in d['paths'] if near(b['points'],1300 if site!='crissy' else 2400)]
 d['ground']=[b for b in d['ground'] if near(b['points'],1600 if site!='crissy' else 2600)]
 for b in d['buildings']:
  p=b['points'];y=sum(q[0] for q in p)/len(p);x=sum(q[1] for q in p)/len(p)
  if site=='third' and 37.565<y<37.571 and -122.2845<x<-122.278:
   b['name']='Gilead '+(b['address'] or 'campus');b['style']='gilead'
   # Building-specific massing: the two older Lakeside offices are low,
   # 303 and 309 are ten-storey towers, and PG-309 is an open garage.
   heights={'30932833':8.4,'30932837':8.4,'35395755':23,'35395756':40,'692890316':39,'692890314':17,'1047217647':20,'391761379':5.2,'100106244':8.4}
   b['height']=b['height'] or heights.get(b['id'],23 if area(p)>2500 else 8.4)
   if b['id'] in ['30932833','30932837']:b['style']='gilead-low'
   if b['id']=='692890314':b['style']='gilead-garage';b['name']='Gilead parking garage 309'
   if b['id']=='692890316':b['style']='gilead-tower';b['name']='Gilead 309'
  if site=='coyote' and b['name'].startswith('Meta'):b['style']='meta'
  if site=='crissy' and 37.803<y<37.8055 and -122.468<x<-122.461 and area(p)>600:b['style']='hangar';b['height']=b['height'] or 10
  if site=='crissy' and not b['height']:b['height']=7

# Verified waterfront buildings only at Coyote. Inland industrial footprints
# were visually reading as a false wall of warehouses behind Magic Mountain.
keep={'29407407','29407454','235537507','676180941','1041191890','1043264220','1043264222','1267736760'}
data['coyote']['buildings']=[b for b in data['coyote']['buildings'] if b['id'] in keep or b.get('style')=='meta' or b['kind']=='terminal' or 'Boarding' in b['name'] or 'Control Tower' in b['name']]
# Small but verified waterfront services: 2023 pump station and Baywinds toilets.
pump=objects('coyote',lambda t:t.get('building')=='service')
for b in pump:
 if b['id']=='1267736760':
  b.update(name='Coyote Point Pump Station',height=3.8,style='pump');data['coyote']['buildings']=unique(data['coyote']['buildings']+[b])
for b in objects('third',lambda t:t.get('amenity')=='toilets' and bool(t.get('building'))):
 if b['id']=='1482401136':
  b.update(name='Baywinds Park restrooms',height=3.1,style='restroom');data['third']['buildings']=unique(data['third']['buildings']+[b])
# Split 309's mapped outline into the tall northern slab and low meeting
# center. Extruding the complete ground footprint produced a false bulky tower.
b=next(b for b in data['third']['buildings'] if b['id']=='692890316')
p=b['points'];tower=[p[10],p[11],p[12],p[13],p[14],p[10]]
annex={**b,'id':'692890316-annex','name':'Gilead meeting center 309','height':7.8,'style':'gilead','points':p[:11]+[p[0]]}
b['points']=tower;data['third']['buildings'].append(annex)
# Four white circular tanks are visible east of the campus in Esri World
# Imagery (export extent saved in the reference notes). Radii are measured
# from that image; heights are a visual approximation, not a site survey.
data['third']['tanks']=[]
for i,(px,py,r) in enumerate([(1265,377,32.0),(1374,387,23.8),(1440,373,23.8),(1507,355,23.8)]):
 lat=37.57266666666667-py/1000*(37.57266666666667-37.564333333333337);lon=-122.285+px/1800*.015
 data['third']['tanks'].append({'id':'third-water-tank-'+str(i),'point':[lat,lon],'radius':r,'height':7.2 if i else 6.8})
# Keep significant source coordinates; distance-based simplification removes tiny segments.
def simplify(p,tolerance=1.2):
 if len(p)<3:return p
 def distance(q,a,b):
  sx=88200;sy=111320;x=(q[1]-a[1])*sx;y=(q[0]-a[0])*sy;dx=(b[1]-a[1])*sx;dy=(b[0]-a[0])*sy;t=max(0,min(1,(x*dx+y*dy)/(dx*dx+dy*dy or 1)));return math.hypot(x-t*dx,y-t*dy)
 ds=[distance(q,p[0],p[-1]) for q in p[1:-1]];d=max(ds)
 if d<tolerance:return [p[0],p[-1]]
 k=ds.index(d)+1;return simplify(p[:k+1],tolerance)[:-1]+simplify(p[k:],tolerance)
def clean(v):
 if isinstance(v,dict):return {k:clean(x) for k,x in v.items()}
 if isinstance(v,list):
  if len(v)>0 and isinstance(v[0],list) and len(v[0])==2 and isinstance(v[0][0],float):return simplify(v)
  return [clean(x) for x in v]
 return v
out=Path(__file__).resolve().parent/'location-data.js';out.write_text('/* Shoreline geometry © OpenStreetMap contributors, ODbL 1.0. Extracted 2026-10-26.\n   https://www.openstreetmap.org/copyright — see README for source extents. */\n(function(root){const data='+json.dumps(clean(data),separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=data;root.FoilLocationData=data;})(globalThis);\n');print(out,len(out.read_bytes()))
