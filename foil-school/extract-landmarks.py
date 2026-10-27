#!/usr/bin/env python3
"""Verified, individually selected skyline footprints. No generic city scatter."""
from pathlib import Path
import json,sys,xml.etree.ElementTree as E
folder=Path(sys.argv[1]);source={}
for name in ['moffett','bayview','burlingame','fort-mason','sf-skyline','shoreline']:
 r=E.parse(folder/f'foil-{name}-map.osm').getroot();n={e.attrib['id']:[float(e.attrib['lat']),float(e.attrib['lon'])] for e in r.findall('node')}
 source[name]={e.attrib['id']:({'name':next((t.attrib['v'] for t in e.findall('tag') if t.attrib['k']=='name'),''),'height':next((t.attrib['v'] for t in e.findall('tag') if t.attrib['k']=='height'),'0'),'points':[n[x.attrib['ref']] for x in e.findall('nd')]}) for e in r.findall('way')}
data={k:{'buildings':[],'piers':[]} for k in ['shoreline','third','coyote','crissy']}
def add(site,part,id,style,height=None,name=None):
 b={**source[part][id],'id':'landmark-'+id,'style':style,'kind':'building'};b['height']=height or float(b['height']);b['name']=name or b['name'];data[site]['buildings'].append(b)
add('shoreline','moffett','23630706','amphitheatre',18)
add('shoreline','bayview','4336012','airship-hangar',60,'Hangar One')
for id in ['821621411','821621412']:add('shoreline','bayview',id,'bayview-canopy',20,'Google Bay View')
# OSM height tags invert the observed scale: six-floor Courtyard versus
# fifteen-floor Hilton. Photo-guided estimates replace those inconsistent tags.
for id,h in [('23652629',22),('51190911',49)]:
 for site in ['coyote','third']:add(site,'burlingame',id,'waterfront-hotel',h)
for id,h in [('288387751',17),('288387752',16),('288387753',13),('288387755',10),('288387757',12),('398609305',10),('398613751',12),('398613752',10)]:add('crissy','fort-mason',id,'fort-mason',h)
for id in ['23605116','23605117','23605119']:
 d={**source['fort-mason'][id],'id':'landmark-'+id,'kind':'pier'};data['crissy']['piers'].append(d)
for id,style,height in [('431972186','salesforce',326),('24222973','pyramid',260),('32612608','skyline',173),('616812910','skyline',174),('588355355','skyline',212),('445566153','skyline',244.4),('1279505488','skyline',183)]:add('crissy','sf-skyline',id,style,height)
data['shoreline']['playgroundBoundary']=source['shoreline']['385187561']['points']
out=Path(__file__).parent/'landmark-data.js';out.write_text('/* Selected mapped landmarks © OpenStreetMap contributors, ODbL 1.0; 2026-10-27. */\n(function(root){const data='+json.dumps(data,separators=(',',':'))+';root.FoilLandmarkData=data;if(typeof module!=="undefined"&&module.exports)module.exports=data;})(globalThis);\n');print(out,len(out.read_bytes()))
