#!/usr/bin/env python3
"""Pack Kahului OSM extracts; photo-guided details are in harbor-model.js.
Reads foil-kahului-{west,east,south}-map.osm from the supplied directory.
Only the waterfront and recognizable larger background buildings are retained.
"""
from pathlib import Path
import json, math, sys, xml.etree.ElementTree as E

folder=Path(sys.argv[1]); nodes={}; ways={}
for part in ['west','east','south']:
    root=E.parse(folder/f'foil-kahului-{part}-map.osm').getroot()
    nodes.update({e.attrib['id']:[float(e.attrib['lat']),float(e.attrib['lon'])] for e in root.findall('node')})
    ways.update({e.attrib['id']:e for e in root.findall('way')})
def tags(e): return {t.attrib['k']:t.attrib['v'] for t in e.findall('tag')}
def points(e): return [nodes[n.attrib['ref']] for n in e.findall('nd')]
def center(p): return [sum(v[i] for v in p)/len(p) for i in range(2)]
def area(p):
    lat,lon=p[0]; q=[((a-lat)*111320,(b-lon)*104000) for a,b in p]
    return abs(sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(q,q[1:]))/2)
def number(s,default=0):
    try:return float(s.split(' ')[0])
    except:return default
def feature(id,e,kind=None):
    t=tags(e)
    return {'id':id,'name':t.get('name',''),'kind':kind or t.get('natural',t.get('landuse',t.get('building','path'))),'height':number(t.get('height',''),number(t.get('building:levels',''))*3.3),'surface':t.get('surface',''),'highway':t.get('highway',''),'points':points(e)}
coast=points(ways['10415832'])
# Retain a continuous coast well beyond the playable harbor. OSM's complete
# way continues to Hana; that extra coastline is unnecessary for this scene.
coast=[p for p in coast if -156.515<p[1]<-156.440 and p[0]<20.928]
data={'coast':coast,'islands':[],'breakwaters':[],'buildings':[],'ground':[],'parking':[],'parkingAisles':[],'roads':[],'paths':[],'piers':[],'tanks':[],'trees':[]}
for id,e in ways.items():
    t=tags(e);p=points(e)
    if len(p)<2:continue
    lat,lon=center(p);closed=len(p)>3 and p[0]==p[-1]
    near=20.887<lat<20.903 and -156.485<lon<-156.459
    if t.get('man_made')=='breakwater' and closed:
        data['islands'].append(p);data['breakwaters'].append(feature(id,e,'breakwater'))
    if t.get('man_made')=='pier':data['piers'].append(feature(id,e,'pier'))
    if t.get('man_made')=='storage_tank' and 20.892<lat<20.898 and -156.465<lon<-156.459:
        data['tanks'].append({'id':id,'point':[lat,lon],'radius':math.sqrt(area(p)/math.pi),'height':number(t.get('height',''),9)})
    elif t.get('building') and closed and near and (area(p)>220 or t.get('name')):
        f=feature(id,e);f['height']=f['height'] or (12 if t['building']=='apartments' else 7 if lon> -156.467 else 5)
        if id in ['192472415','289835426']:f.update(style='canoe-hale',height=4)
        if t['building']=='hotel':f.update(style='maui-hotel',height=7.2)
        if 20.895<lat and lon> -156.469:f.update(style='port-warehouse',height=8)
        data['buildings'].append(f)
    if closed and near and (t.get('natural') in ['beach','sand','wood','scrub'] or t.get('landuse') in ['grass','forest','recreation_ground'] or t.get('leisure') in ['park','pitch']):
        f=feature(id,e);f['kind']=t.get('natural',t.get('landuse','grass'));data['ground'].append(f)
    if closed and near and t.get('amenity')=='parking':data['parking'].append(feature(id,e,'parking'))
    if near and t.get('service')=='parking_aisle':data['parkingAisles'].append(feature(id,e))
    if near and t.get('highway') in ['footway','path','cycleway']:data['paths'].append(feature(id,e))
    if near and t.get('highway') in ['primary','secondary','tertiary','residential','service'] and t.get('service')!='parking_aisle':data['roads'].append(feature(id,e))
# The quay, park and adjacent hotel frontages dominate the view from water.
# Keep inland residential blocks out of the model instead of inventing a wall
# of flat-roofed warehouses behind the park.
data['buildings']=[b for b in data['buildings'] if (center(b['points'])[0]>20.8909 and center(b['points'])[1]>-156.477 and area(b['points'])>300) or b['kind']=='apartments' or b.get('style')=='canoe-hale']
lot_ids=['289835437','452966553','289836357','289836359']
data['parking']=[p for p in data['parking'] if p['id'] in lot_ids]
def close_to_lots(p):
    a,b=center(p)
    return any(math.hypot((a-center(q['points'])[0])*111320,(b-center(q['points'])[1])*104000)<180 for q in data['parking'])
data['parkingAisles']=[p for p in data['parkingAisles'] if close_to_lots(p['points'])]
data['roads']=[p for p in data['roads'] if p['name'] in ['Kaahumanu Avenue','West Kaahumanu Avenue','East Kaahumanu Avenue','Kahului Beach Road','Puunene Avenue','North Puunene Avenue','Heterodox View Avenue','Kahului Breakwater Road','Hobron Avenue'] or close_to_lots(p['points'])]
data['paths']=[p for p in data['paths'] if close_to_lots(p['points'])]
out=Path(__file__).parent/'kahului-data.js'
out.write_text('/* Kahului geometry © OpenStreetMap contributors, ODbL 1.0; retrieved 2026-10-27. */\n(function(root){const data='+json.dumps(data,separators=(',',':'))+';root.FoilKahuluiData=data;if(typeof module!=="undefined"&&module.exports)module.exports=data;})(globalThis);\n')
print(out,len(out.read_bytes()),{k:len(v) for k,v in data.items()})
