# LANDSLIDE SUSCEPTIBILITY — SELF-SERVICE TRAINING MODULE
Open data only. No license, no budget, no subscription.
CC0. No rights reserved. Verified 2026-09-06.

For: emergency managers, planners, county staff, volunteer fire and SAR,
landowners, anyone deciding where to build. Assumes no GIS background.

Scope: United States first, with a global path in MODULE 7.

---

# MODULE 0 — WHAT THIS PRODUCES, AND WHAT IT DOES NOT

You are going to produce a **graded finding**, not a map that says safe.

Every output is graded in five states. Two states is not enough and the
reason is in MODULE 1.

```
GRADE            MEANING
susceptible      terrain and record both indicate landslide potential
not-susceptible  terrain and record both indicate low potential
partial          indicated for one failure type, not assessed for others
unknown          no data at usable resolution for this location
undifferentiated data exist but cannot separate "stable" from "unmapped"
```

`undifferentiated` is the grade most locations in the US actually
receive, and it is the grade almost every existing tool reports as
"low susceptibility." That single substitution is the whole reason
this module exists.

**What this does not replace.** A site-specific geotechnical
investigation by a licensed engineer before construction. This tells you
whether that investigation is warranted and what it should look for.

---

# MODULE 1 — THE FAILURE MODE, FIRST

Read this before touching data.

A landslide susceptibility map is built from two things: terrain, and a
record of past landslides. Terrain is available everywhere at decent
resolution. The record is not.

The record is built by state geological surveys, and those programs are
funded, defunded, and scoped politically.

Worked case — North Carolina:

Mapping is complete for four counties: Macon, Watauga, Buncombe, and Henderson. Funding for the program was pulled by state budget writers in 2011 after concerns raised by western North Carolina developers, with $3.6 million in non-recurring funds appropriated in 2017. Helene then triggered more landslides than state officials had recorded in the prior two decades combined.

The slopes did not change in 2011. The record did.

**The consequence you must carry through every step:**

```
Few mapped landslides in a county can mean either:
  (a) few landslides occur there
  (b) nobody was funded to look

The map cannot tell these apart.
It renders both as light-colored.
Light-colored reads as safe.
```

This is the same error as a passing test that never ran the detector.
The signal on the surface is green. The check never executed.

So: **MODULE 2 is a coverage report, and you run it before you make any
map at all.** If you skip it, you will produce a confident picture of
your own data gap.

---

# MODULE 2 — COVERAGE REPORT (RUN FIRST)

## 2.1 Get the county coverage table

```
SOURCE  USGS Slope-Relief Threshold Landslide Susceptibility Models
        for the United States and Puerto Rico
DOI     10.5066/P13KAGU3
FILE    county_analysis.csv
```

This file gives, per U.S. county, the proportion of susceptible terrain and the density of documented landslides within susceptible terrain.

Those two numbers together are your coverage instrument. Open the CSV in
any spreadsheet — no GIS needed for this step.

## 2.2 Read your county

```
susceptible terrain proportion | landslide density in that terrain | GRADE
-------------------------------|-----------------------------------|---------------
low                            | low                               | not-susceptible
high                           | high                              | susceptible
high                           | low                               | UNDIFFERENTIATED
low                            | high                              | check the data
```

Row 3 is the row that matters. High susceptible terrain with a low
density of documented slides means the terrain says yes and the record
says nothing. That is an inventory gap, not a safety finding.

Row 4 usually means a single well-mapped event cluster in an otherwise
unmapped county — treat the county as `partial`.

## 2.3 Write it down before continuing

```
county:
state:
susceptible terrain proportion:
documented density:
coverage grade:
date checked:
```

Carry this grade forward. It caps the confidence of everything below it.
A `susceptible` finding in an `undifferentiated` county is still worth
acting on. A `not-susceptible` finding in an `undifferentiated` county
is worth nothing.

---

# MODULE 3 — THE NATIONAL LAYERS

The USGS national susceptibility model was built from an inventory of nearly one million previous landslides plus high-resolution national elevation data from the 3D Elevation Program, covering the contiguous U.S., Alaska, Hawaii, and Puerto Rico.

## 3.1 Look first, download second

```
TOOL   U.S. Landslide Inventory and Susceptibility Map (interactive)
URL    https://www.usgs.gov/tools/us-landslide-inventory-and-susceptibility-map
```

The interactive map combines the national inventory compilation with the national susceptibility map, links out to the original inventory files, and carries a per-landslide confidence attribute for location and extent, displayed in grayscale.

Use that confidence attribute. A point is not a fact; it is a report with
a stated reliability.

This step needs only a browser. For many users it is the whole job.

## 3.2 The two rasters

```
LAYER  n10   neighborhood count index, range 0-81
             static terrain predisposition
LAYER  lw    warning level derived from precipitation thresholds
             dynamic triggering potential
```

n10 represents the number of geomorphic and geologic susceptibility factors within a 10-cell neighborhood; lw is derived from precipitation thresholds; the two capture static terrain predisposition and dynamic triggering potential respectively.

Do not average them into one number without saying so. They answer
different questions. n10 asks whether the ground can fail. lw asks
whether something will make it.

Downloads: `n10_susc.zip` and `lw_susc.zip` from DOI 10.5066/P13KAGU3.

## 3.3 The inventory

```
SOURCE  Landslide Inventories across the United States, version 3.0
DATE    February 2025
```

Version 3 supplies point and polygon files in GeoPackage, shapefile, and CSV form, an ancillary database preserving original fields, a spreadsheet documenting the confidence rules, a change log against version 2, and a references file for the constituent inventories.

Version 2 of this data release is marked CC0 1.0 Universal.

Take the CSV if you have no GIS. Take the GeoPackage if you do.

**Read `us_ls_v3_analyses.csv`.** It documents the confidence rules and
their justification. It is the file that tells you what the confidence
attribute means, and almost nobody opens it.

---

# MODULE 4 — TERRAIN

You need elevation to see the specific slope above a specific structure.

```
DATASET              RESOLUTION   USE
3DEP 1/3 arc-second  ~10 m        regional screening, US
3DEP lidar DEM       0.5-2 m      individual slope, where flown
Copernicus GLO-30    30 m         global fallback, MODULE 7
```

30 m does not resolve a single hillside above a house. It will average a
steep bank into the flat ground beside it and return a gentle slope. If
your question is about one parcel and you only have 30 m, the honest
grade is `unknown`, not a number.

Check whether lidar exists for your area before anything else. North Carolina's completed county hazard maps were built on a 6 m lidar DEM. Where lidar was flown, you can see individual scarps and old slide scars in a hillshade. Where it was not, you cannot.

## Derived layers, in order of usefulness

```
1  hillshade        old slide scars, scarps, hummocky ground — visible by eye
2  slope (degrees)  most debris flow initiation clusters on steep slopes
3  curvature        concave hollows collect water and material
4  flow accumulation where water concentrates; debris flow paths
```

Start with hillshade. A person who has walked ground can often read a
lidar hillshade faster than a model can score it. Old scars mean it has
happened, which is the strongest single evidence there is.

---

# MODULE 5 — THE LOCAL LAYER

National products are a floor, not a ceiling. Check for better.

```
CHECK IN THIS ORDER
1  your state geological survey — landslide or geologic hazards page
2  county GIS / planning department parcel viewer
3  state lidar portal
4  NRCS Web Soil Survey — soil series descriptions name slide-prone units
5  state DOT geotechnical / slope failure records along highways
6  local historical society, newspaper archive, long-resident memory
```

Item 6 is not a joke and it is not soft data. Where the funded record
stops, the unfunded record continues in people who watched a hillside
move in 1977. Write it down with a date and a name, mark it
`report, unverified`, and it becomes a real entry. Most inventories
started this way.

Two states with unusually complete public inventories, useful as
comparison for what good coverage looks like: Oregon (SLIDO, DOGAMI) and
Washington.

---

# MODULE 6 — THE FINDING

One page. This is the deliverable.

```
LOCATION
  description:
  lat/lon:
  county, state:

COVERAGE (from MODULE 2)
  county coverage grade:
  lidar available:            yes / no / partial
  local inventory available:  yes / no

TERRAIN
  slope at site (deg):
  slope above site (deg):
  concave hollow above site:  yes / no
  old scars visible in hillshade: yes / no / no lidar

RECORD
  documented slides within 1 km:
  nearest documented slide (km, date, confidence):
  unverified local reports:

NATIONAL LAYERS
  n10 value:
  lw value:

TRIGGERS PRESENT
  steep slope             y/n
  concentrated drainage   y/n
  undercut toe (road, excavation, stream) y/n
  fill placed on slope    y/n
  recent burn upslope     y/n
  known slide-prone soil unit y/n

GRADE                       susceptible / not-susceptible / partial /
                            unknown / undifferentiated
CONFIDENCE CAPPED BY        (the weakest input above)
WHAT WOULD CHANGE THIS      (name the specific missing data)
DATE / ASSESSOR
```

**The last two lines are mandatory.** A finding that does not name its
own weakest input and what would change it is an opinion wearing a
table.

## The rule that prevents the main failure

```
IF county coverage grade = undifferentiated
AND terrain indicators = negative
THEN finding = undifferentiated
NOT not-susceptible
```

Absence of a record is not evidence of stability. Never let the pipeline
convert one into the other.

---

# MODULE 7 — OUTSIDE THE US

Coverage drops sharply. Grade accordingly.

```
INVENTORY   NASA COOLR (Cooperative Open Online Landslide Repository)
            includes the Global Landslide Catalog plus citizen-science
            and contributed research inventories
ACCESS      landslides.nasa.gov — Landslide Viewer, or the API
LAYERS      coolr_reports / coolr_events, each as point and polygon
```

COOLR contains citizen science data from the Landslide Reporter Catalog, NASA's Global Landslide Catalog, NASA digitized landslides, and inventories contributed by the research community, queryable by date, trigger, and digitization method, with a citation field per event.

The Global Landslide Catalog has been compiled since 2007 and covers rainfall-triggered mass movements reported in media, disaster databases, and scientific reports.

Note the bias directly: media-reported means population-weighted. An
uninhabited valley that slides every decade produces no record. Treat
sparse COOLR coverage as `unknown`, never as low hazard.

```
NOWCAST     LHASA — near-real-time global landslide hazard
            combines GPM IMERG satellite rainfall with static
            susceptibility (slope, land cover, soil)
USE         situational awareness during a storm
NOT FOR     siting decisions
TERRAIN     Copernicus GLO-30 / SRTM via OpenTopography
```

Global default grade for a single parcel: `unknown`. Say so.

---

# MODULE 8 — TOOLS

```
BASE (no install beyond one program, no cost)
  QGIS              open source desktop GIS, all platforms
  a spreadsheet     for MODULE 2, which needs nothing else

ENHANCEMENT (optional)
  GDAL / gdaldem    slope, hillshade, curvature from a DEM
  Python + rasterio scripted extraction for many sites
```

MODULE 2 and MODULE 3.1 require only a browser and a spreadsheet. If that
is all you have, you can still produce a graded finding. Do that first
and add layers later.

## Minimal QGIS sequence

```
1  new project, set CRS to your state plane or UTM zone
2  add DEM
3  Raster > Analysis > Hillshade      -> look for scars
4  Raster > Analysis > Slope          -> classify
5  add inventory points (CSV: Layer > Add Delimited Text)
6  add n10 raster, sample at your point
7  Identify tool at the site, fill in MODULE 6
```

---

# MODULE 9 — CONTRIBUTING BACK

The gap in MODULE 1 closes only if unfunded observation enters a record.

```
COOLR / Landslide Reporter   citizen reports, global
USGS inventory               gs-haz_landslides_inventory@usgs.gov
                             accepts contributed inventories
state geological survey      most accept reports
```

The USGS invites contributions to the national inventory through that address.

A dated photograph with a location, a description, and a name is a valid
inventory entry. Emergency responders and utility crews see more slope
failures than any mapping program does, and almost none of it is
recorded.

---

# MODULE 10 — REFUTATION

Conditions under which this module is wrong, stated so it can be
checked rather than trusted.

```
R1  If county-level documented-slide density does NOT track program
    funding history, MODULE 1's premise fails. Test: compare density
    against state survey budget history across state lines within one
    physiographic province.

R2  If n10 predicts observed slides equally well in well-mapped and
    poorly-mapped counties, the coverage caveat is over-stated.
    Test: hold out Helene-era WNC slides, score against n10 by county
    coverage class.

R3  If the five-state grade produces the same decision as a three-state
    grade in every real case, the extra states cost effort and buy
    nothing. Test: run both on 20 parcels, compare decisions.

R4  If lidar-derived slope at 1 m and 3DEP slope at 10 m agree within
    tolerance at parcel scale, MODULE 4's resolution warning is too
    strong. Test: paired sample on flown terrain.
```

If you run any of these, the result is worth more than this document.

---

# SOURCES

```
USGS U.S. Landslide Inventory and Susceptibility Map (interactive)
  https://www.usgs.gov/tools/us-landslide-inventory-and-susceptibility-map

Landslide Inventories across the United States, v3.0, Feb 2025
  Belair, Jones, Slaughter, Mirus
  https://www.usgs.gov/data/landslide-inventories-across-united-states-ver-30-february-2025

Slope-Relief Threshold Landslide Susceptibility Models for the
United States and Puerto Rico  (n10, lw, county_analysis.csv)
  Belair, Jones, Martinez, Mirus, Wood, 2024
  doi 10.5066/P13KAGU3

Mirus, Belair, Wood, Jones, Martinez, 2024
  Parsimonious high-resolution landslide susceptibility modeling
  at continental scales.  AGU Advances 5(5)
  doi 10.1029/2024AV001214

USGS 3D Elevation Program (3DEP)
  https://www.usgs.gov/3d-elevation-program

NASA COOLR / Landslide Viewer / LHASA
  https://landslides.nasa.gov

NC Geological Survey — Geologic Hazards and Landslides
  https://www.deq.nc.gov/about/divisions/energy-mineral-and-land-resources/nc-geological-survey/geologic-hazards-and-landslides

Oregon SLIDO (DOGAMI)
  https://www.oregon.gov/dogami/slido/Pages/data.aspx

QGIS
  https://qgis.org
```

Verified 2026-09-06. Government data URLs move. If a link is dead,
search the dataset title plus "ScienceBase" — the DOIs above are stable.

---

Relation to the engine in this folder: `landslide_honesty_engine.py`
reports `UNVALIDATED_LOW` or `UNVALIDATED_NONE` when local inventory is
insufficient. Both of those are the module's `undifferentiated` grade.
The engine does not emit `partial` or `unknown`; those distinctions are
made by the person filling in MODULE 6.
