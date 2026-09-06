# LANDSLIDE COMMUNITY TOOLKIT
## Local Resource Building & Neighbor Communication
### For Emergency Managers, Builders, and Residents

---

## WHY THIS EXISTS

When the official data is missing, the community becomes the data source.

In many US states — especially in the Great Plains, Southeast, and Midwest — there is **no landslide inventory**. State geological surveys are underfunded. Federal maps cover the whole country but miss local details.

**This toolkit helps you:**
1. Start a local landslide reporting program
2. Build a neighborhood communication network
3. Share maps and data without relying on the internet
4. Connect with local experts and emergency managers
5. Document what your community knows

**You don't need to be a scientist. You need to be observant and organized.**

---

## SECTION 1: STARTING A LOCAL LANDSLIDE REPORTING PROGRAM

### 1.1 What is a Landslide Report?

A landslide report documents:
- **WHERE** it happened (GPS coordinates or address)
- **WHEN** it happened (date, time, season)
- **WHAT** happened (type: debris flow, rockfall, slumping, etc.)
- **HOW BIG** (length, width, depth if known)
- **WHAT TRIGGERED IT** (rain, earthquake, construction, unknown)
- **WHAT WAS DAMAGED** (road, house, utility, none)
- **PHOTOS** (from multiple angles, with scale reference)

### 1.2 Who Can Report?

Anyone who sees evidence of a landslide:
- Homeowners who see cracks in their foundation
- Road crews who clear debris from slides
- Hikers who see fresh scarps or deposits
- Farmers who see fence lines shifted
- Utility workers who see poles leaning
- Emergency responders after storms

### 1.3 How to Report (Simple Form)

**PAPER FORM** (for no-internet situations):

```
LANDSLIDE REPORT FORM
---------------------
Date of report: ___________
Reporter name: ___________  Phone: ___________
Location: ___________________________________
  (Address or GPS: Lat ______ Long ______)
Date of landslide: ___________ (or "unknown")
Type: [ ] Debris flow  [ ] Rockfall  [ ] Slump/Earthflow
      [ ] Topple  [ ] Slide  [ ] Other: _________
Trigger: [ ] Heavy rain  [ ] Earthquake  [ ] Construction
         [ ] Snowmelt  [ ] Unknown  [ ] Other: _______
Size: Length: ____ ft  Width: ____ ft  Depth: ____ ft
Damage: [ ] None  [ ] Road blocked  [ ] Building damaged
        [ ] Utility damaged  [ ] Other: ___________
Photos taken? [ ] Yes [ ] No  Number: ____
Description: ________________________________
____________________________________________
____________________________________________
```

**DIGITAL FORM** (for smartphone users):
- Use Google Forms (works offline if set up right)
- Use KoBoToolbox (designed for field data, works offline)
- Use the NASA Landslide Reporter app (if available in your area)

### 1.4 Where to Send Reports

**Immediate safety hazard:**
- Call 911 or local emergency management

**For the database:**
- Local emergency management office
- County GIS/planning department
- State geological survey
- USGS: gs-haz_landslides_inventory@usgs.gov
- NASA COOLR: [gpm.nasa.gov/landslides](https://gpm.nasa.gov/landslides)

### 1.5 Organizing a Reporting Network

**Step 1: Identify Key People**
- County emergency manager
- Road department supervisor
- Utility company contact
- Local geologist or engineer (if any)
- Active community members (hikers, hunters, farmers)

**Step 2: Create a Reporting Chain**
```
Observer sees slide
    ↓
Fills out paper form or takes photos
    ↓
Sends to local coordinator (weekly collection)
    ↓
Coordinator enters into spreadsheet/GIS
    ↓
Quarterly batch sent to state geological survey + USGS
```

**Step 3: Build the Database**
- Start with a simple spreadsheet (Excel, LibreOffice Calc, Google Sheets)
- Columns: ID, Date, Lat, Long, Type, Trigger, Size, Damage, Photos, Source
- After 20+ reports, export as CSV and load into QGIS
- Now you have a LOCAL INVENTORY

**Step 4: Validate with the Honesty Engine**
- Run the Landslide Honesty Engine on your county
- As your inventory grows, your score improves
- When you hit 40+ validated points, you can produce a MODERATE confidence map
- When you hit 100+ validated points with good coverage, you hit HIGH confidence

---

## SECTION 2: NEIGHBOR COMMUNICATION NETWORKS

### 2.1 Why Neighbor Networks Matter

When a landslide happens:
- 911 may be overwhelmed
- Roads may be blocked
- Cell towers may be down
- Internet may not work
- **Your neighbors are your first responders**

### 2.2 Building a Neighborhood Communication Plan

**STEP 1: Map Your Neighborhood**
1. Walk your neighborhood with a notebook
2. Draw a simple map showing:
   - Houses and who lives where
   - Driveways and access roads
   - Steep slopes and drainage paths
   - Utility poles and lines
   - Safe gathering spots (high ground, away from slopes)
3. Note who has:
   - Medical training
   - Heavy equipment (backhoe, tractor, chainsaw)
   - Ham radio
   - Generator
   - Four-wheel-drive vehicle

**STEP 2: Establish Communication Methods**

| Method | When to Use | How to Set Up |
|--------|-------------|---------------|
| **Text message group** | Day-to-day, non-emergency | Phone group chat |
| **Phone tree** | Emergency when cell works | Each person calls 2 others |
| **Ham radio** | Emergency when cell fails | Get licensed ( Technician class, $15 test) |
| **FRS/GMRS radios** | Short-range, no license needed | Buy at any store, set channel |
| **Messenger/runner** | All other methods fail | Pre-arranged meeting points |

**STEP 3: Set Up a Local Message Board**

**Physical board (no internet needed):**
- Location: Community center, fire hall, library, grocery store
- Content:
  - Current hazard status
  - Road closures
  - Who needs help
  - Who can help
  - Evacuation routes
- Update schedule: Daily during events, weekly normally

**Digital board (when internet works):**
- Free options:
  - **Discord server** (free, works on phone/computer)
  - **Signal group** (encrypted, works on low bandwidth)
  - **Facebook group** (if people use it)
  - **Nextdoor** (neighborhood focused)
  - **Mesh network** (see below)

### 2.3 Offline Sharing: The Sneakernet

When the internet is down, data moves on foot.

**What to share:**
- Updated susceptibility maps (PDF on USB drive)
- Inventory data (CSV files)
- Photos of new slides
- Contact lists
- Resource lists

**How to share:**
1. Save files to USB flash drive
2. Walk or drive to neighboring communities
3. Copy files to their computers
4. Bring back any files they have
5. Merge data when you get home

**This is called a "sneakernet" — it's slow but it works when nothing else does.**

### 2.4 Mesh Networks (Intermediate Tech)

A mesh network lets computers talk to each other WITHOUT the internet.

**Simplest version:**
- **Local WiFi hotspot** on a laptop
- Other laptops connect to it
- Share files via local network
- Range: ~100 feet indoors, ~300 feet outdoors

**Better version:**
- **Meshtastic** devices ($30 each)
  - Small radio units with GPS
  - Text messages over long-range radio
  - No cell tower needed
  - Range: miles (depends on terrain)
  - Works with phone app
  - [meshtastic.org](https://meshtastic.org)

**Advanced version:**
- **Ham radio digital modes** (Winlink, APRS)
  - Send email over radio
  - Send GPS positions
  - Requires Technician license
  - Works across counties

### 2.5 Community Meeting Template

**Monthly Landslide Preparedness Meeting (1 hour)**

1. **Check-in** (10 min)
   - Any new slides observed?
   - Any concerns about slopes?
   - Road/utility status?

2. **Data Update** (15 min)
   - New reports added to inventory?
   - Map updates shared?
   - Honesty Engine score changed?

3. **Education** (15 min)
   - One topic per meeting:
     - What to watch for before a slide
     - How to evacuate safely
     - How to report a slide
     - What the map colors mean
     - How to read the data availability report

4. **Planning** (15 min)
   - Communication test (radio check)
   - Supply check (flashlights, batteries, first aid)
   - Evacuation route review
   - Who needs help preparing?

5. **Action Items** (5 min)
   - Who does what before next meeting?

---

## SECTION 3: LOCAL RESOURCE BOARD

### 3.1 What Goes on the Resource Board

**Physical board at community center:**

```
╔══════════════════════════════════════════════════════════════╗
║  LANDSLIDE RESOURCES — [YOUR COUNTY/REGION]                  ║
║  Last Updated: [DATE]                                        ║
╠══════════════════════════════════════════════════════════════╣
║  EMERGENCY CONTACTS                                          ║
║  • 911 — Emergency                                           ║
║  • [County Emergency Mgmt]: [PHONE]                          ║
║  • [State Geological Survey]: [PHONE/EMAIL]                  ║
║  • [Local Geotechnical Engineer]: [CONTACT]                  ║
╠══════════════════════════════════════════════════════════════╣
║  CURRENT HAZARD STATUS                                       ║
║  • Overall Confidence: [VALIDATED / UNVALIDATED]             ║
║  • Data Score: [XX]/100                                      ║
║  • Known slide-prone areas: [LIST]                           ║
║  • Recent slides: [LIST WITH DATES]                          ║
╠══════════════════════════════════════════════════════════════╣
║  MAPS AVAILABLE                                              ║
║  • [Link to latest susceptibility map]                       ║
║  • [Link to data availability report]                        ║
║  • Paper copies at: [Library, Fire Hall, etc.]               ║
╠══════════════════════════════════════════════════════════════╣
║  DATA GAPS — WE NEED YOUR HELP!                              ║
║  • No inventory for: [AREAS]                                 ║
║  • If you see a slide, report to: [CONTACT]                  ║
║  • If you have old photos of slides, share them!             ║
╠══════════════════════════════════════════════════════════════╣
║  LOCAL EXPERTS                                               ║
║  • [Name] — Geologist/Engineer                               ║
║  • [Name] — Emergency Manager                                ║
║  • [Name] — GIS/Data person                                  ║
║  • [Name] — Community Coordinator                            ║
╠══════════════════════════════════════════════════════════════╣
║  SUPPLIES & EQUIPMENT                                        ║
║  • [Who has generator]                                       ║
║  • [Who has 4WD vehicle]                                     ║
║  • [Who has chainsaw/heavy equipment]                        ║
║  • [Who has medical training]                                ║
║  • [Who has ham radio]                                       ║
╠══════════════════════════════════════════════════════════════╣
║  EVACUATION INFO                                             ║
║  • Safe gathering point: [LOCATION]                          ║
║  • Alternate routes: [ROADS]                                 ║
║  • Shelter location: [ADDRESS]                               ║
╚══════════════════════════════════════════════════════════════╝
```

### 3.2 Digital Version

Create a simple webpage or shared document with the same info.

**Free options:**
- Google Sites (free, easy)
- WordPress.com (free tier)
- GitHub Pages (free, requires some tech skill)
- Just a shared Google Doc

**What to include:**
- All the info from the physical board
- Links to download maps (PDF)
- Links to download data (CSV, GeoPackage)
- Photos of local landslides
- Video explanations (short, 2-3 minutes)
- Contact form for reports

---

## SECTION 4: BUILDING A LOCAL INVENTORY FROM SCRATCH

### 4.1 Where to Look for Historical Landslides

**People to ask:**
- Elderly residents (they remember events from decades ago)
- Road department crews (they clear slides off roads)
- Utility workers (they repair lines damaged by slides)
- Forest service / park rangers
- Hunters and hikers (they see remote areas)
- Farmers (they see fence lines shift, fields crack)
- Real estate agents (they know problem properties)
- Insurance agents (they know claims history)

**Documents to check:**
- Local newspaper archives (search "slide", "slip", "collapse", "mud")
- County road maintenance records
- Utility company repair logs
- Court records (property damage lawsuits)
- Aerial photos (USGS Earth Explorer has historical imagery)
- State highway department records

**Physical evidence to look for:**
- Scarps (steep cut in hillside)
- Hummocky terrain (bumpy ground from old slides)
- Bent trees (trees tilted by ground movement)
- Leaning fences or poles
- Cracked foundations or walls
- Dammed or diverted streams
- Fresh boulders in unusual places

### 4.2 Aerial Photo Analysis

**Free sources:**
- **USGS Earth Explorer** (earthexplorer.usgs.gov)
  - Aerial photos back to 1930s
  - Compare old vs. new to see changes
- **Google Earth Pro** (free desktop app)
  - Historical satellite imagery slider
  - 3D view to see terrain
- **USDA NAIP** (National Agriculture Imagery Program)
  - High-res aerial photos every 2 years

**What to look for:**
- Bare soil patches on slopes (fresh scars)
- Changes in stream shape (diverted by debris)
- Different vegetation (young trees on old slide deposits)
- New roads or cuts on steep slopes

### 4.3 Field Verification

**Safety first:**
- Never approach an active slide
- Watch for secondary failures
- Go with a partner
- Tell someone where you're going
- Wear hard hat and boots

**What to document:**
- GPS coordinates (phone app)
- Photos: overview, close-up, scale reference
- Measurements: length, width, height
- Material: rock, soil, debris, mixed
- Water: seepage, springs, saturated ground
- Vegetation: type, age (young = recent)
- Damage: structures, roads, utilities

**Equipment:**
- Smartphone with GPS
- Camera
- Measuring tape
- Compass
- Notebook
- Hard hat
- Sturdy boots
- First aid kit

### 4.4 Entering Data

**Spreadsheet template:**

| ID | Date_Reported | Date_Event | Latitude | Longitude | Type | Trigger | Length_ft | Width_ft | Depth_ft | Damage | Photos | Source | Notes |
|----|--------------|------------|----------|-----------|------|---------|-----------|----------|----------|--------|--------|--------|-------|
| 001 | 2026-09-01 | 2026-08-15 | 35.6123 | -82.4512 | Debris flow | Rain | 150 | 40 | 8 | Road blocked | Yes | J.Smith | After Hurricane |

**After 20 entries:**
1. Save as CSV
2. Open QGIS
3. **Layer > Add Layer > Add Delimited Text Layer**
4. Select your CSV
5. X field = Longitude, Y field = Latitude
6. Click Add
7. You now have a point layer of landslides!

**After 50 entries:**
- You have enough to start statistical modeling
- Run the Honesty Engine again — your score should improve

---

## SECTION 5: SHARING DATA BETWEEN COMMUNITIES

### 5.1 The "Data Package" Format

When sharing with neighboring communities or uploading to a repository, use this standard format:

```
landslide_data_[county]_[date].zip
├── README.txt                    # What's in this package
├── DATA_AVAILABILITY_REPORT.html # Honesty Engine output
├── SUSCEPTIBILITY_MAP/
│   ├── susceptibility.tif        # GeoTIFF raster
│   ├── susceptibility.pdf        # Print map with confidence banner
│   └── qgis_project.qgz          # QGIS project file
├── INVENTORY/
│   ├── landslide_points.csv      # Spreadsheet format
│   ├── landslide_points.shp      # GIS format
│   └── photos/                   # Photo folder
├── DATA_LAYERS/
│   ├── dem.tif                   # Elevation
│   ├── slope.tif                 # Slope
│   ├── geology.shp               # Geology
│   └── soils.shp                 # Soils
├── DOCUMENTATION/
│   ├── methodology.txt           # How the map was made
│   ├── data_sources.txt          # Where data came from
│   └── limitations.txt           # Known problems/gaps
└── COMMUNITY/
    ├── contacts.txt              # Local experts
    ├── meeting_notes.txt         # Community meeting records
    └── action_items.txt          # What needs to be done
```

### 5.2 Where to Upload

**For official submission:**
- USGS ScienceBase (sciencebase.gov)
- State geological survey data portal
- County GIS portal

**For community sharing:**
- Zenodo (zenodo.org) — free, gets a DOI
- Figshare (figshare.com) — free
- GitHub (github.com) — for data + code
- OpenTopography (opentopography.org) — for DEM-related data

### 5.3 Metadata Requirements

Every file should include:
- **Who** created it
- **When** it was created
- **What** area it covers
- **How** it was made
- **What** the confidence level is
- **What** the limitations are
- **How** to cite it

Example metadata block:
```
Title: Landslide Susceptibility Map — [County], [State]
Creator: [Your Name / Community Group]
Date: 2026-09-07
Area: [Bounding box or county name]
Method: Slope-Relief Threshold (USGS national method)
Confidence: UNVALIDATED — No local landslide inventory
Data Sources: USGS 3DEP DEM, USDA SSURGO soils, USGS geology
Limitations: Not validated against local landslide history.
             Use for awareness only, not for siting.
Contact: [Email]
License: CC-BY 4.0 (free to use with attribution)
```

---

## SECTION 6: EMERGENCY RESPONSE PROTOCOL

### 6.1 Before the Storm / Rain Event

**48 hours before predicted heavy rain:**
- [ ] Check susceptibility map for your area
- [ ] Identify high/very high susceptibility zones
- [ ] Check evacuation routes (are they clear?)
- [ ] Test communication methods (radio check, phone tree)
- [ ] Move vehicles to high ground
- [ ] Secure loose items
- [ ] Charge all devices
- [ ] Fill water containers
- [ ] Check on vulnerable neighbors

**During heavy rain:**
- [ ] Monitor local radio / mesh network
- [ ] Watch for signs: cracking ground, tilting trees, muddy water
- [ ] Be ready to evacuate if advised
- [ ] Do NOT drive through flooded roads
- [ ] Do NOT approach steep slopes during intense rain

### 6.2 During a Landslide Event

**If you are IN a slide:**
1. Move sideways out of the path (not down)
2. If you can't escape, curl into a ball and protect your head
3. If buried, create breathing space, stay calm

**If you SEE a slide happening:**
1. Move to safe ground immediately
2. Call 911
3. Warn others (yell, radio, phone)
4. Do NOT go back to investigate
5. Mark the area (if safe) to warn others

**After the slide stops:**
1. Check for injured people
2. Do NOT enter the slide area (it may reactivate)
3. Check for damaged utilities (gas leaks, downed power lines)
4. Document from a safe distance (photos, GPS)
5. Report to emergency management
6. Fill out a Landslide Report Form

### 6.3 After the Event

**24-48 hours after:**
- [ ] Account for all community members
- [ ] Assess damage to roads, utilities, buildings
- [ ] Document new slides (photos, GPS, forms)
- [ ] Update the inventory spreadsheet
- [ ] Share information with neighboring communities
- [ ] Update the resource board

**1-2 weeks after:**
- [ ] Community meeting to discuss what happened
- [ ] Update susceptibility map with new data
- [ ] Re-run Honesty Engine (score may have improved)
- [ ] Plan mitigation (drainage, retaining walls, vegetation)
- [ ] Apply for assistance if needed

---

## SECTION 7: WORKING WITH OFFICIALS

### 7.1 How to Talk to Emergency Managers

**What they care about:**
- Where are people at risk?
- What roads might be blocked?
- What utilities might fail?
- How many people might need evacuation?
- What resources do we need?

**What to bring to the meeting:**
- Your susceptibility map (printed, large format)
- Your data availability report
- Your inventory spreadsheet
- List of vulnerable infrastructure
- List of at-risk residents (with their permission)
- Proposed evacuation routes

**What to ask for:**
- Funding for geotechnical assessment
- Support for community reporting program
- Inclusion of your data in official databases
- Training for community members
- Warning systems for high-risk areas

### 7.2 How to Talk to Planners & Building Officials

**What they care about:**
- Is this map validated?
- What is the confidence level?
- What data was used?
- What are the limitations?
- How does this affect building codes?

**Be honest:**
- If unvalidated, say so clearly
- Explain what data is missing
- Explain what the map CAN and CANNOT do
- Recommend site-specific studies
- Offer to collaborate on getting better data

### 7.3 How to Talk to Engineers

**What they care about:**
- Site-specific conditions
- Soil properties
- Groundwater conditions
- Slope geometry
- Loading conditions

**What you can provide:**
- Regional context (susceptibility map)
- Historical inventory (if any)
- Local knowledge (seeps, cracks, past events)
- DEM for site-specific analysis
- Your data availability report

**What they will tell you:**
- A regional map is NOT a substitute for site investigation
- Every building site needs its own assessment
- Your map is a screening tool, not a design tool

**They are right. That's why the honesty check exists.**

---

## SECTION 8: TEMPLATES & FORMS

### 8.1 Landslide Report Form (Printable)

[See Section 1.3 for the paper form]

### 8.2 Community Meeting Agenda

```
LANDSLIDE PREPAREDNESS MEETING
Date: ___________  Location: ___________

ATTENDANCE: ___________

1. NEW REPORTS (10 min)
   - Slides observed since last meeting: ___________
   - New hazard concerns: ___________

2. MAP UPDATE (10 min)
   - Current data score: ___________
   - Confidence level: ___________
   - Changes since last meeting: ___________

3. EDUCATION TOPIC (15 min)
   - Today's topic: ___________
   - Handouts distributed: ___________

4. COMMUNICATION TEST (10 min)
   - Phone tree tested: [ ] Yes [ ] No
   - Radio check: [ ] Yes [ ] No
   - Mesh network test: [ ] Yes [ ] No

5. ACTION ITEMS (10 min)
   - ___________ will ___________ by ___________
   - ___________ will ___________ by ___________
   - ___________ will ___________ by ___________

6. NEXT MEETING
   - Date: ___________  Location: ___________
```

### 8.3 Data Sharing Agreement

```
LANDSLIDE DATA SHARING AGREEMENT

I, ____________________, agree to share landslide data
with [Community Name / Organization].

Data shared: [ ] Photos  [ ] GPS coordinates  [ ] Descriptions
             [ ] Measurements  [ ] Other: ___________

I understand that:
- This data will be used for public safety
- This data may be shared with USGS, state surveys, and researchers
- My name may be credited as a data contributor
- I retain ownership of my original photos and notes

Date: ___________  Signature: ___________
```

---

## LICENSE

This toolkit is released under **CC-BY 4.0** (Creative Commons Attribution).

You may:
- Use, copy, modify, and distribute
- Use for commercial or non-commercial purposes
- Translate into other languages

You must:
- Credit: "Landslide Community Toolkit v1.0"
- Share modifications under the same license
- Not remove safety warnings or honesty requirements

---

## CONTACT

- **Toolkit updates:** [Community repository]
- **Share your story:** [Community forum]
- **Report problems:** [Issue tracker]
- **Get help:** [Email / Discord / Signal]

**Your community's safety starts with honest information.**
**Mark the gaps. Fill the gaps. Save lives.**

---
*Toolkit Version 1.0 | 2026-09-07*
*Community Emergency Mapping Initiative*
