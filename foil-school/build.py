#!/usr/bin/env python3
"""Build a complete offline HTML; no packages or runtime asset requests."""
from pathlib import Path
import base64
import json
ROOT=Path(__file__).resolve().parent
html=(ROOT/'template.html').read_text()
for marker,name in [('CSS','style.css'),('THREE','vendor/three.min.js'),('LOCATION_DATA','location-data.js'),('KAHULUI_DATA','kahului-data.js'),('LEMORNE_DATA','lemorne-data.js'),('LEMORNE_ELEVATION_DATA','lemorne-elevation-data.js'),('LEMORNE_MODEL','lemorne-model.js'),('LEMORNE_SCENERY','lemorne-scenery.js'),('LANDMARK_DATA','landmark-data.js'),('HARBOR_MODEL','harbor-model.js'),('PLAYGROUND','playground.js'),('ELEVATION_DATA','elevation-data.js'),('ELEVATIONS','elevations.js'),('PROMENADE','promenade.js'),('WATERFRONT','waterfront-model.js'),('LOCATIONS','locations.js'),('WORLD','world.js'),('WIND_MARKERS','wind-markers.js'),('HARBOR_SCENERY','harbor-scenery.js'),('LANDMARK_SCENERY','landmark-scenery.js'),('LAKE_BOAT','lake-boat.js'),('SITE_DETAILS','site-details.js'),('SCENERY_GEOMETRY','scenery-geometry.js'),('LOCATION_SCENERY','location-scenery.js'),('EQUIPMENT','equipment.js'),('EQUIPMENT_UI','equipment-ui.js'),('LESSONS','lessons.js'),('HORSES','horses.js'),('WATER_CONTACTS','water-contacts.js'),('WIPEOUTS','wipeouts.js'),('CORE','core.js'),('RUINS','ruins.js'),('TRAFFIC_PILOT','traffic-pilot.js'),('TRAFFIC','traffic.js'),('ENVIRONMENT','environment.js'),('RIDER','rider.js'),('HORSE_VIEW','horse-view.js'),('WING_CONTROL','wing-control.js'),('NAVIGATION_MAP','navigation-map.js'),('DAMAGE_VIEW','damage-view.js'),('VIEW_MOTION','view-motion.js'),('APP','app.js')]:
    content=(ROOT/name).read_text()
    if marker!='CSS':content=content.replace('</script','<\\/script')
    html=html.replace('/* INLINE_'+marker+' */',content)
# Each model family is embedded once; size variants share the same photographs.
# Reject missing or mislabeled assets instead of shipping a broken offline shop.
media_root=ROOT/'assets/equipment'
media=json.loads((media_root/'catalog.json').read_text())
for family in media.values():
    for view in family['views']:
        path=media_root/view['file']
        data=path.read_bytes()
        mime={'png':'image/png','jpg':'image/jpeg','webp':'image/webp'}[path.suffix[1:]]
        valid=(mime=='image/png' and data.startswith(b'\x89PNG')) or (mime=='image/jpeg' and data.startswith(b'\xff\xd8')) or (mime=='image/webp' and data.startswith(b'RIFF') and data[8:12]==b'WEBP')
        if not valid:raise ValueError(f'Invalid equipment image: {path}')
        view['data']='data:'+mime+';base64,'+base64.b64encode(data).decode('ascii')
        del view['download']
    del family['retrieved']
images='globalThis.FoilEquipmentMedia='+json.dumps(media,ensure_ascii=False,separators=(',',':'))+';'
html=html.replace('/* INLINE_EQUIPMENT_IMAGES */',images.replace('</script','<\\/script'))
if '/* INLINE_' in html:raise ValueError('Unresolved inline asset marker')
license_text=(ROOT/'vendor/THREE-LICENSE.txt').read_text()
html=html.replace('<head>','<!-- Bundled Three.js r160.1, MIT license:\n'+license_text+'\n--><head>',1)
output=ROOT.parent/'foil-academy.html'
output.write_text(html)
print(f'Built {output.name}: {len(html.encode()):,} bytes')
