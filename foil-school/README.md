# Foil Academy

A separate, offline 3D browser game about wingfoiling. The game is listed in the root README and game hub; the other games remain separate.

## Play

Open `../foil-academy.html` in a current browser with WebGL. Everything is embedded: Three.js, procedural artwork, shaders, sound, controls, and simulation. No install, CDN, account, or network request is needed to play after the HTML loads. The build produces only `foil-academy.html`; the old duplicate `foil-school.html` has been removed. The existing save-data key is retained.

For an iPad, serve the file as a webpage rather than using the Files app's HTML preview:

1. Connect the laptop and iPad to the same Wi-Fi.
2. In the repository folder, run `python3 -m http.server 8000 --bind 0.0.0.0`.
3. In iPad Safari, open `http://YOUR-LAPTOP-IP:8000/foil-academy.html`.

You can also put the single HTML file on a static website. Saved lesson stars and personal records belong to the browser and site address. Sound begins after the first interaction and can be muted. Landscape gives the widest view, with responsive portrait controls available too.

## Controls

| Action | Laptop | Touch |
| --- | --- | --- |
| Stand on the board | Enter | Stand up |
| Steer / bank | A / D | Drag body pad left / right |
| Front-foot pressure, lower nose | W | Drag body pad upward |
| Back-foot pressure, raise nose | S | Drag body pad downward |
| Sheet wing in / out | Down increases power; Up eases | Pull the wing pad down / move it up |
| Pump | Hold Space briefly, then release | Hold Pump, then release in green |
| Position / transfer wing | Left / Right arrows, when the wing is light | Slide around the upper semicircle |
| Switch feet | F | Switch feet |
| Flag wing for gliding | G | Flag wing |
| Pop / jump | Hold J, then release | Hold Pop, then release |
| Air rotation | A/D spin; W/S flip; center to brake | Body pad |
| Pause | Escape | Pause button |
| Change wind, waves and weather | Conditions button | Conditions button |
| Jump off anywhere | E | Jump off |
| Swim forward / back and turn | Arrow keys or WASD | Body pad |
| Walk forward / back and turn | Arrow keys or WASD | Right joystick |
| Mount / dismount a nearby horse | H (E also dismounts) | Ride / Dismount |
| Ride / choose gait | Arrow keys or WASD; hold forward to accelerate | Right joystick: push farther for walk, trot, canter, gallop |
| Look around on land | Drag the left pad with the mouse | Left joystick |
| Reset the land view | Center view button | Center view button |
| Tow or leave the board while swimming | Space | Tow board / Leave board |
| Climb aboard nearby | Enter | Climb aboard |
| Return to launch, keep points | R | Pause → Return to launch |

The body pad and wing pad support independent simultaneous pointers. Releasing the pad centers body input; wing position and trim remain where you leave them. Pointer cancellation, interrupted touches, focus loss, and hidden tabs release transient input. Hidden tabs pause the session.

## Learn and explore

The nineteen courses are Taxiing, First flights, Touch-and-go, Sustained flight, Pumping, S-turns, Carving, Jibe, Foot switching, Tack, Wave riding, Downwind gliding, Popping, Frontside airs, Backside airs, Air tacks, Aerial 360s, Backflips, and Frontflips. Turns and carving precede full transitions; straight jumps precede aerial rotations. Each course has a distinct measured objective, including settled exits and controlled landings. All courses are available immediately. Completing a course earns one star; at most two falls earns two; no falls earns three. Stable course IDs preserve stars if the order changes.

The opening screen offers an academy location selector, defaulting to **Academy Bay**. Keyboard focus starts on the main start button. The chosen site carries through courses and **Free Foiling**, the last option in the course list.

Flight earns points continuously, with a multiplier that grows from 1× to 2.5× over a long uninterrupted run. Foiling jibes, tacks, and buoy gates add bonuses. A touchdown ends the current flight streak but keeps earned points. The Conditions menu is available from the top bar and pause screen during lessons, free foiling and exploration. It controls wind strength (0–28 knots), wind direction, gusts, wave height (0–1.2 m crest to trough), spacing (4–80 m), choppiness, wave travel direction, cloud cover and sunlight. Apply keeps the current position, flight log and lesson progress; Cancel or Escape discards edits. Each new lesson starts with its teaching conditions.

Free Foiling starts with **Lively ripples**: approximately 16 cm high, short, quick waves with crossing wavelets. Other presets offer an easy breeze, long rolling swell, overcast chop, short crossed bay chop, and glassy calm. Shorter spacing also shortens the period using deep-water wave scaling. Choppiness mixes extra crossing wave trains within the chosen height bound. Physics, visible displacement, wake and foil clearance use the same component table and parameters. Height is an approximate upper crest-to-trough envelope, not a calibrated significant wave height. Wind comes *from* its bearing; waves travel *toward* theirs. Free Foiling also offers coached or direct controls.

The bay now includes a larger surrounding coastline, layered rock and vegetation, a lighthouse, harbor buildings, watchtower, ruined castle headland, and chalk cliffs. Open the ⌖ bay chart to choose a landmark: its true bearing and distance appear beneath the wind compass. Shore labels identify visible references, and the chart shows north, the rider, the launch buoy, and the next flight gate.

The rider uses shaped anatomical meshes with bent joints, textured neoprene, an impact vest, helmet, modeled hands, and boots. Arm and leg lengths remain fixed as the hands track the wing handles. Walking uses a relaxed upright gait. Swimming has separate reach, catch, pull, and recovery phases, open palms, shoulder-led body roll, side breathing, and a small six-beat flutter kick. A separate stroke clock keeps the cadence natural at higher travel speeds, and the torso stays at the waterline when blending into treading or backward sculling. A coiled board leash connects the ankle cuff to the tail plug, and the wing leash connects the wrist cuff to the wing attachment. Both cords update their geometry between those attachment points.

The water uses nearby and distant meshes, multi-scale surface normals, Fresnel reflection, a planar reflection pass, depth-dependent color, shoreline foam, and a wake that follows the actual path through turns. Reflection resolution is reduced on touch devices, scenery is instanced, and static rider details are batched. This is procedural real-time art; it does not use photographic human scans or a full fluid simulation.

Left input banks and leans left, and turns left in the chase view. On land, looking is independent of movement: the left joystick changes camera yaw and pitch, while arrows / WASD or the right touch pad move and turn. Both touch pads work simultaneously. The camera stops before masonry and boulders.

The live coach explains power loss, oversheeting, excessive foil height, hand transfers, and pumping. The compass shows heading relative to true wind, the upwind no-go sector, apparent wind direction, and the next gate. The height meter highlights the target riding band. A field guide explains the controls and learning concepts in the game.

## Swim and explore Castle Head

Jump off at any point while sailing with **E** or **Jump off**. The board and wing remain afloat. You initially tow them; **Space** or **Leave board** lets you swim freely. Swim within 4 m to take the leash again, or within 3.2 m and choose **Climb aboard** to return to sailing. Stand and sheet in again after boarding. Points and lesson progress are retained. Free-swim speed is 2.2 m/s and towing speed is 1.4 m/s, with brief acceleration and deceleration instead of instant sliding. Hand entries produce small splashes and a narrow wake. These speeds are gameplay tuning, not a prediction of real swimming performance.

Low beaches and the landing below **Castle Head** automatically switch from swimming to walking. The board stays in the water when you go ashore. Choose Castle Head on the **⌖** chart, approach the sheltered landing, and follow the stone steps. The courtyard, sea gate, mosaic hall, and signal tower contain four discoveries worth 75 points each. Masonry walls and the well block walking; steps and floors have matching collision surfaces. Walk back down to the landing and into the water to retrieve the board. W/S or the pad moves forward/back; A/D or the pad turns in both modes.

## Bonus horse rides

Clover or Willow waits near the shore access at each location, beside the parking / launch area. In Academy Bay, Willow is just inland of the water landing, about 24 m from the dock. Horses also appear on the navigation chart. Walk close and use **H / Ride**. The board stays in the water. The right joystick steers and controls pace; small forward input walks, then progressively stronger input trots, canters and gallops. Arrow keys or WASD work too. Release to brake, pull back to reverse slowly, and stop before **H / Dismount** or **E**. The left pad independently looks around.

The horse has a continuous shaped body and neck, a longer muzzle, eyes, nostrils, mane, tail, saddle, stirrups, bridle and reins. The rider sits over the saddle with bent knees, heels down and relaxed elbows. Hooves follow the ground with fixed-length leg joints. Walk, trot, canter and gallop have distinct footfall timing, body motion and hoof sounds. Stairs automatically slow the horse to a walk. Collision samples the whole animal and sweeps its movement to prevent passing through walls, fences, parked cars, tree trunks, cliffs or water. Small stair risers are traversable; the horse waits where you dismount. Horse exploration does not earn foil-flight credit.

These are procedural animated models and simplified riding controls, not scanned horses or an equestrian simulator. Footfall references: [Penn State / Extension gait chart](https://horses.extension.org/wp-content/uploads/2022/01/gaits-of-the-ho_53762938.pdf), [University of Minnesota conformation guide](https://extension.umn.edu/agriculture/animals-and-livestock/horse/conformation-of-the-horse), and [New Vocations horse profile photographs](https://www.newvocations.org/horses).

## Read the wind and avoid the shallows

The compass number is **true wind**, while the wing panel reports usable drive and its limiting cause. Green compass arcs mark takeoff reaches near 90°. Begin around 65–70% trim; oversheeting, the upwind no-go zone, a hand transfer, deep downwind sailing, and actual lulls have separate feedback. Wing transfers use a simplified aerodynamic load estimate based on apparent wind (true wind plus board motion), wing exposure and actual trim. They do not use a fixed power cutoff. A slow, head-to-wind rider can switch with a high power setting when the wing feathers; a strongly loaded or backwinded wing still needs unloading. The wing pad reports **Wing light** or **Wing loaded**. An overhead wing produces slightly less forward drive than a lowered wing at equal trim. A sheeted-in wing catches pressure from astern even directly downwind; drive diminishes as the board approaches the wind speed, and becomes braking if it outruns the wind. Apparent wind includes sideways drift. A sheeted-in wing on the wrong side produces braking and downwind sideslip; fully easing removes those forces. Wind socks and flags stream downwind using the same world wind direction as the force model. A fall resets wing power to zero. Wipeouts carry the rider through the air using forward momentum and the direction of lost balance, then end in the water. The rider remains swimming until you press Enter / Climb aboard near the board; stand up and sheet in again to sail. Earned points are preserved. Body keys keep working after using the wing pad.

**UNDER FOIL** shows clearance below the lowest part of the submerged equipment. Collision tests sweep the board and foil, including banked wingtips, across the same terrain triangles used for the visible islands and coastline. Underwater slopes, shoreline rocks, and the landing pier are included. A warning anticipates shallow water ahead; a strike causes a fall into the water; tow the equipment clear of the shallows before climbing aboard. This check uses ride height, pitch, roll, and the moving water surface rather than a circular shoreline approximation.

Every pump press starts charging, including during recovery from the previous stroke. Release near the green band, then press again immediately for the next stroke. Recovery and stamina still affect the strength of a stroke; rapid taps do not create useful pumping.

## Physics and learning scope

The fixed-step simulation includes wind-relative heading, changing wind speed, apparent wind, a simplified wing power curve with oversheeting, hull versus foil drag, speed-squared foil lift, fore-and-aft pitch control, heave damping, surface ventilation, touchdown, and wave-induced clearance changes. Pumping requires a timed compression/release with a recovery interval and energy budget. Jibes and tacks count only when the rider crosses the correct wind axis, stays on foil, transfers the wing, and exits on the opposite reach.

Back-foot pressure (**S** or pad down) shifts the rider aft, raises the nose, and increases foil lift at speed. Front-foot pressure (**W** or pad up) lowers the nose and reduces lift, allowing the foil to descend. Pitch alone cannot lift a stationary board. Positive simulation pitch means nose up; the shared equipment transform converts it to negative Three.js X rotation because the board's nose points along local +Z. Rendering and seabed collision checks use this same transform, including the pump kick.

This is a forgiving educational model, not a calibrated equipment or CFD simulator. The coefficients favor readable, recoverable gameplay. Coached mode adds damping and adjusts the neutral foil pitch for speed after takeoff, so centering the pad helps settle the board. The player still supplies takeoff pressure, steering, wing trim, and wave/height corrections. Direct mode retains unassisted pitch control. Wing transfers and foot switches are separate controls; the game does not model every real hand or foot technique. Real-world instruction remains valuable for safe launching, equipment handling, and movement technique.

The learning progression was informed by the [RYA wing courses](https://www.rya.org.uk/training/wing-courses/) and [wing scheme syllabus](https://www.rya.org.uk/media/ur5nmnk2/9ba_rya_wing_scheme_syllabus_pdf.pdf). Wing handling references include [Ozone's learning series](https://ozonekites.com/learn-to-wingfoil-video-series/) and [wing manual](https://ozonekites.com/wing-manual/). The procedural crawl animation also references [Swim England’s front-crawl technique guide](https://www.swimming.org/masters/improving-front-crawl-technique/). These organizations have not reviewed or endorsed the game.

The castle's staggered masonry, door jambs, tower openings and larger fallen stones share their geometry with collision checks. Boulders use their rendered rotation. The player can walk through the sea gate, hall arch and all three tower doorways, with solid walls around those openings. Beveled, textured stone, arrow slits, courtyard paving and broken masonry add detail without external assets.

The board is a procedural interpretation of the [Naish Hover Wing Foil Carbon Ultra](https://www.naish.com/products/s26-hover-wing-foil-carbon-ultra), using its curved outline, tapered tail, rocker, a clean, very light grey textured deck. Decorative curved stripes have been removed. The wing uses [Cabrinha Mantis product photos](https://www.mackiteboarding.com/2025-cabrinha-mantis-wing/) as its visual reference: a tapered dark leading edge, low dihedral, teal panels, visibility windows and a curved central strut. The canopy billows outward away from the rider. It has closed leading-edge ends, reinforced corners, a finite chord at each tip and continuous seam geometry. Portrait camera framing includes the complete wing.


## Real locations and other riders

The four additional sites are Shoreline Park Lake, 3rd Avenue (starting beside Lower Launch), Coyote Point Beach, and Crissy Field South Beach. Shorelines, major building footprints, paths, parking areas and planting zones come from OpenStreetMap. USGS 3DEP bare-earth elevations shape the land and distant hills without vertical exaggeration. Local elevation samples are 8–12 m apart; regional samples are about 110 m apart. Bay water uses an approximate 0.97 m NAVD88 reference, and the lake uses the sampled 2.98 m level. Tides and underwater bathymetry are modeled rather than surveyed.

Site defaults use wind **from WNW (292.5°)** at Coyote and Third Avenue, **W (270°)** at Crissy, and **NNW (337.5°)** at Shoreline. Shoreline uses nearby Moffett observations as a regional proxy, not a surveyed wind climatology for the lake. Conditions can override every default. Switching locations for Free Foiling updates the wind and wave direction; initial lesson headings choose a clear practice reach. Wave-riding courses align their waves with the practice reach, and downwind gliding uses downwind travel.

Parking spaces follow mapped lot outlines and drive aisles instead of an arbitrary rectangle. Shoreline includes curved parking rows, planted islands and trees screening the lot. Coyote includes its waterfront lots, roads, North Shoreview pump station, and densely packed riprap; both mapped beaches remain clear of rocks. Third includes the lower concrete launch ramp, separate rescue jet-ski dock, turf pads, water-facing benches, low chain-link parking enclosure with access gaps, and a representative lesson RV. The turf-side path is open without a guardrail or levee wall. The Cabrinha flag is yellow with a worn fly edge, following the user's local observation; the older indexed photo shows a white version. A one-metre terrain patch resolves the steep bank beside the lower ramp. Gilead buildings have varied masses, a lower meeting annex, parking garage and four white water tanks located from aerial imagery. Unverified architectural details and tank heights remain approximate.

Photo-guided details include the Shoreline boathouse, docks, boats, screened parking and SolarBee water circulator; Coyote's wooded knoll, continuous promenade, concrete access ramps, rock armor, Boardsports building, Meta campus and SFO; 3rd Avenue's golf course, Gilead campus, Bay Trail and continuous San Mateo Bridge with both mapped approaches; and Crissy's dunes, cypress groves, Presidio hangars, Warming Hut and distant landmarks. Full tree canopies replace sparse leaf scatter. Open beaches, the café lawn and fairways remain clear. Shoreline boulders support walking over them, while buildings still block the player. Coyote’s Meta-to-beach promenade has its own continuous, horizontally flat grade, with asphalt paving, a pale concrete apron, low trapezoidal seat-wall, lights and concrete water-access ramps. The terrain is cut beneath that engineered surface so coarse elevation samples cannot poke through it; walking and foil collision use the same paving and ramp heights. Small grass and tree positions, architectural details and the SolarBee mooring are approximations informed by photos, not surveyed replicas. The boathouse reflects its familiar photographed form rather than a live construction update.

Conditions includes **Other foilers** (0–25) and **Foiler experience** (beginner/expert ratio). Both preferences persist. Each visit gets a new random seed. The riders use the player's wind, foil lift, pumping, fall and recovery model, with different control skill. They unload and smoothly transfer their wings through turns; beginners taxi, try flight and fall, while experts pump and sustain flight. Nearby riders steer away instead of disappearing. Their wings use the same swept, inflated planform as the player's wing, with shared instanced geometry to keep rendering affordable. There is no separate rigid-body collision simulation between riders.

Sparse windsocks provide shore references at every site; the Shoreline boathouse has an animated US flag. All indicate where the air is blowing toward, whereas the compass wind bearing indicates where it comes from.

## Scenery sources and regeneration

Photos are references for procedural models; photographs are not embedded in the game.

- Shoreline: [lake operator](https://shorelinelake.com/contact.html), [waterfront aerial photographs](https://www.naturetastic.com/All-Photos/Aerial-Photography/2016-Aerial-Photos/Shoreline-Park-Mountain-View-C), [boathouse photographs](https://www.sfgate.com/food/article/bay-area-landfill-oasis-lakefront-restaurant-21022330.php), and [SolarBee manufacturer](https://www.ixomwatercare.com/equipment/sb-series-solar-powered-mixers). The lake's SolarBee is documented in the city's environmental material and [operator interview](https://inmenlo.com/2013/11/08/christina-ferrari-operates-shoreline-lake-and-cafe-as-escape-for-busy-silicon-valley-people/).
- Coyote Point: [county promenade construction photos](https://www.smcgov.org/publicworks/coyote-point-eastern-promenade-rejuvenation-project-0), [Boardsports](https://boardsportscalifornia.com/weather1/coyote-point/), and [Gensler's Burlingame Point project](https://www.gensler.com/projects/burlingame-point).
- 3rd Avenue: [daytime lower-launch photographs](https://arbor-studios.com/ThirdAveKiteboarding/), [site improvement history](https://arbor-studios.com/ThirdAveKiteboarding/siteinfo.html), [completed levee project and February 2024 photos](https://fostercitylevee.org/about/), [Gilead campus map](https://www.gilead.com/-/media/files/pdfs/directions/directions-to-gilead---b309.pdf), [local launch aerial guides](https://www.3rdavekite.com/), [Gilead campus architect](https://des-ae.com/projects/gilead-nb309), and [San Mateo Bridge waterfront photograph](https://commons.wikimedia.org/wiki/File:San_Mateo_Hayward_bridge_from_Foster_City.jpg).
- Crissy Field: [Parks Conservancy photo gallery](https://www.parksconservancy.org/gallery/crissy-field-gallery), [Presidio East Beach](https://presidio.gov/explore/attractions/crissy-field-east-beach), [NPS native plants](https://www.nps.gov/articles/000/crissy-native-plants.htm), and [historic hangars](https://www.nps.gov/prsf/learn/historyculture/crissy-field-historic-airplane-hangars.htm).
- Parking / tanks: [Esri World Imagery](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer), used to check lot layout and tank placement; [San Mateo North Shoreview flood improvements](https://www.cityofsanmateo.org/1796/North-Shoreview-Flood-Improvement-Projec).
- Winds: [Coyote operator letter describing WNW conditions](https://scc.ca.gov/webmaster/ftp/pdf/sccbb/2016/1612/exhibits/20161201Board08_Coyote_Point_Eastern_Promenade_Ex3.pdf), [Moffett wind observations](https://www.windfinder.com/windstatistics/mountain_view_moffett_field), and [Crissy wind-resource study](https://www.hnei.hawaii.edu/wp-content/uploads/CFC-WPS-Recommendations-Wind-Turbine-DAQ-Systems.pdf).
- Terrain: [USGS 3DEP elevation service](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer), [USGS datum explanation](https://www.usgs.gov/faqs/what-projection-horizontal-datum-vertical-datum-and-resolution-a-usgs-digital-elevation-model), and [NOAA San Francisco datums](https://tidesandcurrents.noaa.gov/datums.html?datum=NAVD88&epoch=0&id=9414290&name=San+Francisco&state=CA&units=0).
- Geometry data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Attribution is embedded in `location-data.js` and in the game's location selector. Three.js is MIT licensed; the complete license is embedded in the standalone HTML build.

`extract-locations.py DATA_DIR` regenerates `location-data.js` from saved `foil-{site}-map.osm` API extracts. The script identifies the required eleven extracts and way IDs; it filters distant buildings and retains the verified waterfront set. `extract-elevations.py DATA_DIR` packs saved USGS Float32 TIFF exports plus their JSON export extents into `elevation-data.js` (signed decimeters, with nodata preserved). Neither data extractor is needed to build or play: all processed data is checked in. The OSM API bounding boxes (west,south,east,north) are:

| Extract | Bounds |
| --- | --- |
| shoreline | -122.095,37.429,-122.081,37.440 |
| third | -122.291,37.566,-122.275,37.581 |
| coyote | -122.335,37.578,-122.308,37.596 |
| crissy | -122.477,37.800,-122.444,37.812 |
| sfo | -122.399,37.599,-122.353,37.632 |
| golden-gate | -122.485,37.811,-122.472,37.834 |
| alcatraz | -122.426,37.823,-122.419,37.830 |
| sanmateo | -122.260,37.580,-122.245,37.591 |
| burlingame | -122.354,37.587,-122.329,37.604 |
| gilead | -122.278,37.564,-122.263,37.579 |
| hayward | -122.169,37.610,-122.145,37.628 |

USGS `exportImage` uses bboxSR/imageSR 4326, `format=tiff`, `pixelType=F32`, `interpolation=RSP_BilinearInterpolation`, `renderingRule={"rasterFunction":"None"}`, `adjustAspectRatio=false`, and `f=json`. Save the response and download its `href`. Use these center latitude/longitude, half-width in meters and pixel sizes:

| Export | Center | Half-width | Output pixels |
| --- | --- | --- | --- |
| shoreline | 37.43312,-122.09025 | 1400 | 351×351 |
| third | 37.5764,-122.2818 | 1500 | 301×301 |
| coyote | 37.5921,-122.3294 | 1800 | 361×361 |
| crissy | 37.8081,-122.4534 | 2600 | 434×434 |
| region | 37.58,-122.32 | 35000 | 637×637 |

Convert half-width to latitude degrees with `/111320` and longitude degrees with `/(111320*cos(latitude))`. The returned JSON extent, rather than a guessed pixel center, controls decoding.

The wing force convention is also informed by [MACkite's wing handling guide](https://www.mackiteboarding.com/news/wing-surfing-basics-learning-your-wing-/): hold the wing downwind; placing it upwind can backwind it. Numerical force coefficients remain game tuning.

The course progression was reviewed against the [RYA wing syllabus](https://www.rya.org.uk/media/ur5nmnk2/9ba_rya_wing_scheme_syllabus_pdf.pdf), [Ozone learning series](https://ozonekites.com/learn-to-wingfoil-video-series/), and Duotone Academy's [wave](https://www.duotonesports.com/en/ch/wing-foiling/stories/new-wave-category-wing-academy-app) and [freestyle](https://www.duotonesports.com/en/ch/wing-foiling/stories/academy-app-freestyle-update) categories. S-turns and carving prepare for transitions; popping and controlled landings precede aerial rotations. Aerial 360s is explicitly an aerial drill, separate from a surface 360. Advanced freestyle remains a simplified game challenge. Downwind wing drive follows the pressure / relative-airflow relationship described in [NASA's drag equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/); its numerical coefficients are game tuning.

## Source and verification

- `core.js`: independent simulation, lessons, rewards, maneuver detection, swimming and walking.
- `locations.js` / `location-data.js`: mapped geometry and site collision.
- `horses.js` / `horse-view.js`: horse movement, safe mounting, terrain support, gaits and articulated models.
- `waterfront-model.js`: mapped parking layout, lower-launch ramp and shore barrier placement shared by visuals and collision.
- `promenade.js`: connected waterfront route, flat paving grade, seat-wall support and concrete ramps.
- `elevations.js` / `elevation-data.js`: offline USGS terrain samples.
- `site-details.js` / `location-scenery.js` / `scenery-geometry.js`: procedural landmarks, vegetation and connected paths/decks.
- `traffic-pilot.js` / `traffic.js`: other riders and instanced equipment.
- `wind-markers.js`: animated flags and windsocks.
- `lessons.js`: course definitions and save migration.
- `world.js`: shared terrain triangles, seabed and equipment clearance, castle collision geometry, and footpaths.
- `ruins.js`: textured masonry, broken towers, arches, courtyard, mosaic, and landing steps.
- `app.js`: board/wing, sound, input, saves, instruments, navigation chart, and interface.
- `rider.js`: anatomical rider meshes, fixed-length arm/leg IK, grip positioning, and animated board/wing leashes.
- `environment.js`: coastal terrain, landmarks, sky, reflected water, foam, and persistent wakes.
- `style.css` / `template.html`: responsive layout and touch controls.
- `vendor/`: bundled Three.js r160.1 and MIT license.
- `build.py`: produces the standalone root HTML with no packages required.
- `horses.test.cjs`: five-site access, gait input, collision, safe dismounting and the complete Academy stair round trip.
- `curriculum.test.cjs`: input-driven completion of every course at all five sites, including wind-relative maneuver timing.
- `waterfront.test.cjs` / `scenery-geometry.test.cjs`: clear ramps and beaches, parking layout, and terrain-draped paving without gaps.
- `core.test.cjs`: deterministic checks of wind drive, foil control, failure/recovery, pumping, turns, rewards, and all nineteen courses.
- `shore.test.cjs`: terrain contact, foil depth, forgiving takeoff, repeated pumps, swimming, and a complete castle round trip with player controls.
- `browser-test.mjs`: Chrome rendering, UI, input, and device-emulation checks. It uses an isolated browser profile and clears only this game's progress in that test profile.

```sh
python3 foil-school/build.py
node --test foil-school/*.test.cjs
```

Browser checks require Node 22+ and a dedicated Chrome profile with remote debugging on port 9223. Run `node foil-school/browser-test.mjs desktop academy`, substituting `tablet` or `phone` for touch emulation. Screenshots go to the system temporary directory. Use `horses` for keyboard / simultaneous touch riding, gait geometry, elbow orientation and dismounting; `scenery` for parking, lower-launch and waterfront views; `catalog` to capture the on-foil game-hub thumbnail; or the `locations` mode for all four mapped sites, terrain/render parity and screenshots; `polish` for the opening selector, traffic preferences and wind markers; `waterfront` for bridge approaches, the promenade and close-up traffic; `academy` for the nineteen courses and current keyboard/touch controls; or `conditions` for actual mouse/touch sliders, presets, wave and lighting uniforms, apply/cancel, calm wind and small-screen menu checks; `wipeout` for logo alignment, the airborne trajectory, articulated fall poses, swimming and explicit remount; `pitch` for actual keyboard/touch pressure, visible nose direction, climb/descent and equipment collision alignment in both control modes; `visual` for pose, leash-attachment, limb-length, reflection, and navigation inspections; `swim` for actual swimming input, a full stroke cycle, waterline and reboarding checks; `explore` for swim, land, castle and render/collision parity checks; or `smoke` for a quick shader/render check. `?test` enables test hooks and is unnecessary for normal play.

The automated pilot completes all lessons by supplying the same control values available to players; it is used only in tests. It does not alter the physics or grant progress. Tests demonstrate feasibility, not that a first-time human will immediately complete every maneuver. Device emulation does not replace testing on a physical iPad; Safari performance and touch feel should also be checked there.
