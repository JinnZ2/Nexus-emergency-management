# LANDSLIDE SUSCEPTIBILITY MAPPING — QGIS WORKFLOW GUIDE
## Open-Source Emergency Management Tool
### Version 1.0 | Community Emergency Mapping Initiative

---

## ⚠️ CRITICAL PRINCIPLE: HONESTY FIRST

**Before you make ANY map, you must run the Data Availability Report.**

A susceptibility map with no local inventory to validate against is **UNVALIDATED**.
It will look authoritative regardless. **This build states its own confidence per region.**

If the report says UNVALIDATED, the map output will be clearly marked:
- **Red border** around the map frame
- **"UNVALIDATED — NOT FOR SITING"** in the legend
- **Warning text** in the layout

**Failure honesty matters most. Someone builds where it says "low" and dies.**

---

## TABLE OF CONTENTS

1. [What You Need Before Starting](#what-you-need)
2. [Step 1: Install QGIS & Required Plugins](#step-1-install)
3. [Step 2: Run the Honesty Engine (Data Check)](#step-2-honesty)
4. [Step 3: Download Open-Source Data](#step-3-data)
5. [Step 4: Build the QGIS Project](#step-4-project)
6. [Step 5: Derive Terrain Parameters](#step-5-terrain)
7. [Step 6: Run Susceptibility Model](#step-6-model)
8. [Step 7: Validate & Classify Output](#step-7-validate)
9. [Step 8: Apply "Unvalidated" Labels](#step-8-label)
10. [Step 9: Create Print Layout](#step-9-layout)
11. [Step 10: Share with Community](#step-10-share)
12. [Global Path (Outside US)](#global-path)
13. [For Dyslexic Users](#dyslexic-users)
14. [Troubleshooting](#troubleshooting)

---

## WHAT YOU NEED BEFORE STARTING {#what-you-need}

### Hardware
- Computer: Any Windows/Mac/Linux that can run QGIS
- RAM: 8GB minimum, 16GB recommended for large areas
- Storage: 5GB free space for data downloads
- Internet: Required for data download step

### Software (All Free, Open Source)
| Software | Purpose | Download |
|----------|---------|----------|
| **QGIS 3.28+** | Main GIS platform | [qgis.org](https://qgis.org) |
| **Python 3.9+** | Scripting engine | Comes with QGIS |
| **SZ Plugin** | Statistical susceptibility models | QGIS Plugin Manager |
| **QuickOSM** | Download OpenStreetMap roads/rivers | QGIS Plugin Manager |
| **Semi-Automatic Classification Plugin** | Satellite imagery | QGIS Plugin Manager |

### Skills You Need
- Basic computer operation (mouse, files, folders)
- Ability to follow step-by-step instructions
- **No coding required** for basic workflow
- **No geology degree required** — the tool explains what each layer means

---

## STEP 1: INSTALL QGIS & REQUIRED PLUGINS {#step-1-install}

### 1.1 Install QGIS
1. Go to [qgis.org](https://qgis.org)
2. Click "Download Now"
3. Choose your operating system (Windows/Mac/Linux)
4. Run the installer with default settings
5. Launch QGIS Desktop

### 1.2 Install Plugins
1. In QGIS, go to **Plugins > Manage and Install Plugins**
2. Search for and install:
   - **SZ** (Susceptibility Zoning by CNR-IRPI)
   - **QuickOSM**
   - **Processing Saga NextGen Provider** (for advanced terrain tools)
3. Click "Install" for each
4. Restart QGIS when prompted

### 1.3 Install the Honesty Engine Script
1. Download `landslide_honesty_engine.py` from this package
2. Place it in your QGIS Python scripts folder:
   - **Windows**: `C:\Users\[YOURNAME]\AppData\Roaming\QGIS\QGIS3\profiles\default\python\scripts`
   - **Mac**: `~/Library/Application Support/QGIS/QGIS3/profiles/default/python/scripts`
   - **Linux**: `~/.local/share/QGIS/QGIS3/profiles/default/python/scripts`
3. In QGIS, go to **Processing > Scripts > Create New Script**
4. Paste the contents of `qgis_landslide_algorithm.py`
5. Save as `Landslide Susceptibility (Honest)`

---

## STEP 2: RUN THE HONESTY ENGINE (DATA CHECK) {#step-2-honesty}

**THIS IS THE MOST IMPORTANT STEP. DO NOT SKIP.**

### 2.1 Open the Script
1. In QGIS, go to **Processing > Toolbox** (or press Ctrl+Alt+T)
2. Expand **Scripts > Emergency Hazard Mapping**
3. Double-click **Landslide Susceptibility (Honest)**

### 2.2 Fill in Your Region
| Field | What to Enter | Example |
|-------|--------------|---------|
| **Region Name** | Your county/area name | "Buncombe County" |
| **State Code** | Two-letter state code | "NC" |
| **Area of Interest** | Click the map icon, draw a box | Draw around your county |
| **Model Type** | Choose your method | "Slope-Relief Threshold" for first run |
| **Force Unvalidated** | Check this ONLY if you want awareness map | Usually checked |

### 2.3 Run the Check
1. Click **Run**
2. The tool checks data availability for your state
3. A report opens in your web browser

### 2.4 Read the Report Carefully
The report shows:
- **Overall Score** (0-100): How ready your region is
- **Confidence Level**: VALIDATED, MODERATE, or UNVALIDATED
- **Data Layers**: What data exists vs. what is missing
- **Warnings**: Red flags you must understand
- **Recommendations**: What to do next
- **Local Contacts**: Who to call for better data

### 2.5 Decision Gate

**If score is 70+ (VALIDATED):**
→ Proceed to full susceptibility mapping. You have inventory data to validate against.

**If score is 40-69 (MODERATE):**
→ You can make a map, but it needs field verification. Use for planning, not siting.

**If score is 15-39 (UNVALIDATED):**
→ You can make an AWARENESS map only. It will be clearly marked UNVALIDATED.
→ **DO NOT use for construction siting.**
→ Follow recommendations to get better data.

**If score is below 15 (NONE):**
→ **STOP. Do not make a map.**
→ The tool will refuse to produce one unless you force it.
→ Start with the Community Toolkit to gather local data.

---

## STEP 3: DOWNLOAD OPEN-SOURCE DATA {#step-3-data}

Based on your Honesty Engine report, download the data layers you need.

### 3.1 Digital Elevation Model (DEM) — ALWAYS NEEDED

**USGS 3DEP (Best, US only):**
1. Go to [apps.nationalmap.gov/downloader](https://apps.nationalmap.gov/downloader)
2. Click "Elevation Products (3DEP)"
3. Select "1/3 Arc-Second" (about 10m resolution) or "1 Arc-Second" (about 30m)
4. Draw your area of interest on the map
5. Click "Search Products"
6. Download the GeoTIFF files
7. Drag them into QGIS

**SRTM (Global, 30m):**
1. In QGIS, go to **Layer > Add Layer > Add WMS/WMTS Layer**
2. Use the NASA SRTM service (URL available in documentation)
3. Or download from [earthexplorer.usgs.gov](https://earthexplorer.usgs.gov)

**Copernicus DEM (Global, 30m, best outside US):**
1. Go to [dataspace.copernicus.eu](https://dataspace.copernicus.eu)
2. Register (free)
3. Search for "Copernicus DEM 30m"
4. Download for your area

### 3.2 Soils Data — ALWAYS NEEDED

**USDA SSURGO (US, county-level, best):**
1. Go to [websoilsurvey.nrcs.usda.gov](https://websoilsurvey.nrcs.usda.gov)
2. Click "Start WSS"
3. Navigate to your area on the map
4. Click the AOI (Area of Interest) tab
5. Draw your area
6. Click "Soil Map" tab
7. Click "Download Soils Data"
8. Choose "Shapefile" format
9. Download and unzip
10. Drag the .shp file into QGIS

**STATSGO (US, state-level, lower resolution):**
- Use if SSURGO is not available for your county
- Same website, select STATSGO2 instead

### 3.3 Geology Data — ALWAYS NEEDED

**USGS National Geologic Map:**
1. Go to [ngmdb.usgs.gov](https://ngmdb.usgs.gov)
2. Search for your state/county
3. Download the GeoPDF or shapefile
4. Convert to shapefile if needed (QGIS can read GeoPDF)

**State Geological Survey:**
- Check your state geological survey website
- Many have GIS data portals
- Example: North Carolina = [ncgeology.com](https://ncgeology.com)

### 3.4 Land Cover Data — ALWAYS NEEDED

**USGS NLCD (US, 30m):**
1. Go to [www.mrlc.gov/data](https://www.mrlc.gov/data)
2. Download NLCD 2019 (or latest year)
3. Select your state or download national file and clip

**ESA WorldCover (Global, 10m):**
1. Go to [worldcover.esa.int](https://worldcover.esa.int)
2. Download for your area

### 3.5 Landslide Inventory — VALIDATION DATA

**USGS National Inventory:**
1. Go to [usgs.gov/maps/national-landslides-map-and-data](https://usgs.gov/maps/national-landslides-map-and-data)
2. Click "Download the GIS databases"
3. This goes to ScienceBase repository
4. Download the shapefile/GeoPackage

**State/Local Inventory:**
- Check your state geological survey
- Check county GIS portals
- Contact local emergency management

**If NO inventory exists:**
- Your map will be UNVALIDATED
- See Community Toolkit for starting a local reporting program

### 3.6 Precipitation Data — FOR TRIGGER ANALYSIS

**PRISM Climate Data (US):**
1. Go to [prism.oregonstate.edu](https://prism.oregonstate.edu)
2. Download precipitation normals
3. Use 30-year average or recent data

**CHIRPS (Global):**
1. Go to [chg.geog.ucsb.edu/data/chirps](https://chg.geog.ucsb.edu/data/chirps)
2. Download monthly or daily rainfall data

### 3.7 Roads & Rivers — FOR DISTANCE ANALYSIS

**OpenStreetMap (via QuickOSM in QGIS):**
1. In QGIS, go to **Plugins > QuickOSM > QuickOSM**
2. Select "Key" = `highway`, "Value" = `*` (all roads)
3. Select your area of interest
4. Click "Run Query"
5. Repeat for rivers: Key = `waterway`, Value = `river` or `stream`

---

## STEP 4: BUILD THE QGIS PROJECT {#step-4-project}

### 4.1 Set Up Your Project
1. Open QGIS
2. **Project > New**
3. **Project > Properties > CRS**
4. Choose a projection appropriate for your area:
   - **US**: Use UTM zone for your area (e.g., "WGS 84 / UTM zone 17N" for Western NC)
   - **Global**: Use local UTM zone or appropriate national grid
5. Click OK

### 4.2 Load Your Data Layers
Load them in this order (bottom to top in Layers panel):

| Order | Layer | Purpose |
|-------|-------|---------|
| 1 | DEM (raster) | Base elevation |
| 2 | Geology (polygon) | Rock types |
| 3 | Soils (polygon) | Soil types |
| 4 | Land Cover (raster) | Vegetation/development |
| 5 | Roads (line) | Infrastructure |
| 6 | Rivers (line) | Waterways |
| 7 | Landslide Inventory (point/polygon) | Known slides |
| 8 | Slope (raster) | Derived terrain |
| 9 | Susceptibility (raster) | Final output |

### 4.3 Organize with Layer Groups
1. Right-click in Layers panel > **Add Group**
2. Create groups:
   - "Base Data" (DEM, geology, soils)
   - "Infrastructure" (roads, rivers)
   - "Inventory" (landslide points)
   - "Derived" (slope, aspect, curvature)
   - "Output" (susceptibility map)

---

## STEP 5: DERIVE TERRAIN PARAMETERS {#step-5-terrain}

These are calculated FROM your DEM.

### 5.1 Slope
1. **Raster > Analysis > Slope**
2. Input: Your DEM layer
3. Output: `slope_degrees.tif`
4. Z factor: 1.0
5. Click Run

### 5.2 Aspect
1. **Raster > Analysis > Aspect**
2. Input: Your DEM layer
3. Output: `aspect.tif`
4. Click Run

### 5.3 Curvature (Profile & Plan)
1. **Processing > Toolbox**
2. Search for **"Curvature"**
3. Use GDAL or SAGA curvature tool
4. Input: DEM
5. Output: `curvature.tif`

### 5.4 Relief (Local Elevation Range)
1. **Processing > Toolbox**
2. Search for **"Focal Statistics"** or **"Neighborhood Statistics"**
3. Use GRASS `r.neighbors` or SAGA
4. Function: Range (max - min)
5. Neighborhood: Circle, radius 500m
6. Output: `relief_500m.tif`

### 5.5 Flow Accumulation (for water routing)
1. **Processing > Toolbox**
2. Search for **"Flow Accumulation"**
3. Use TauDEM or SAGA
4. Input: DEM
5. Output: `flow_accumulation.tif`

---

## STEP 6: RUN SUSCEPTIBILITY MODEL {#step-6-model}

Choose your model based on data availability and your skills.

### OPTION A: Slope-Relief Threshold (Simplest, No Training Data)
**Use this if:** Your area is UNVALIDATED or you have no inventory data.

1. **Processing > Toolbox > Raster Analysis > Raster Calculator**
2. Enter formula (example):
   ```
   ("slope@1" > 15) * 1 + ("slope@1" > 30) * 1 + ("slope@1" > 45) * 1 + ("relief@1" > 50) * 1
   ```
3. This gives classes:
   - 0 = Negligible (flat, low relief)
   - 1 = Low (moderate slope OR moderate relief)
   - 2 = Moderate (steeper slope OR higher relief)
   - 3 = High (very steep OR very high relief)
   - 4 = Very High (extremely steep AND high relief)
4. Output: `susceptibility_srt.tif`

**Why this works:** The USGS national map (Mirus et al. 2024) uses this method. It is physically based — steep slopes with high relief are more likely to fail. It requires NO training data.

### OPTION B: Frequency Ratio (Bivariate Statistical)
**Use this if:** You have some landslide inventory points.

1. Install and use the **SZ Plugin**
2. **Processing > Toolbox > SZ > Data Preparation**
3. Follow plugin instructions to:
   - Classify each factor (slope classes, geology types, etc.)
   - Calculate frequency ratios
   - Combine into susceptibility index
4. The plugin automatically produces ROC curves

### OPTION C: Logistic Regression (Multivariate Statistical)
**Use this if:** You have good inventory coverage and want the best statistical model.

1. Use the **SZ Plugin**
2. Select "Logistic Regression"
3. The plugin handles the math
4. Requires understanding of training/test splits
5. Produces AUC (Area Under Curve) score — higher is better (aim for >0.75)

### OPTION D: Random Forest (Machine Learning)
**Use this if:** You have extensive inventory and want maximum accuracy.

1. Use the **SZ Plugin**
2. Select "Random Forest"
3. Best accuracy but hardest to interpret
4. Good for validated areas with lots of data

---

## STEP 7: VALIDATE & CLASSIFY OUTPUT {#step-7-validate}

### 7.1 If You Have Inventory Data (VALIDATED areas)

**Cross-Validation:**
1. Split your landslide points: 70% for training, 30% for testing
2. Build model on 70%
3. Test on 30% — did it predict the test landslides?
4. Use the SZ Plugin's built-in k-fold cross-validation

**ROC Curve & AUC:**
1. The SZ Plugin produces this automatically
2. **AUC > 0.8** = Excellent model
3. **AUC 0.7-0.8** = Good model
4. **AUC 0.6-0.7** = Fair model — use with caution
5. **AUC < 0.6** = Poor model — do not use

**Confusion Matrix:**
- True Positives: Model said high, landslide occurred ✓
- False Positives: Model said high, no landslide (over-prediction)
- True Negatives: Model said low, no landslide ✓
- False Negatives: Model said low, landslide occurred ✗ (DANGEROUS)

### 7.2 If You Have NO Inventory Data (UNVALIDATED areas)

**You CANNOT validate statistically.**

**What you CAN do:**
1. Compare with known events (news reports, local knowledge)
2. Field check a few areas marked "high" — do they look unstable?
3. Check with local emergency management — does it match their experience?
4. **Document everything** in your report

**What you MUST do:**
1. Mark the map UNVALIDATED
2. State clearly: "This map is based on terrain characteristics only"
3. Add disclaimer: "Not based on local landslide history"
4. Recommend: "Site-specific geotechnical assessment required"

---

## STEP 8: APPLY "UNVALIDATED" LABELS {#step-8-label}

### 8.1 For UNVALIDATED Maps

**In QGIS Print Layout:**
1. **Project > New Print Layout**
2. Add your susceptibility raster
3. Add a **Large Red Banner** at the top:
   ```
   ⚠️ UNVALIDATED SUSCEPTIBILITY MAP
   NOT FOR CONSTRUCTION SITING
   Based on terrain only — no local landslide inventory
   ```
4. Add a **Yellow Warning Box** in the corner:
   ```
   WARNING:
   This map shows where landslides MIGHT occur
   based on slope, geology, and soil type.
   It does NOT mean landslides have happened here.
   It does NOT mean they haven't.

   Before building:
   → Hire a geotechnical engineer
   → Check local building codes
   → Contact your state geological survey
   ```

### 8.2 For VALIDATED Maps

1. Add a **Green Banner**:
   ```
   ✓ VALIDATED SUSCEPTIBILITY MAP
   Validated against [X] landslide records
   AUC Score: [X.XX]
   Confidence: [High/Moderate]
   ```
2. Still add a disclaimer:
   ```
   This map shows relative susceptibility, not absolute risk.
   Site-specific assessment still recommended for construction.
   ```

---

## STEP 9: CREATE PRINT LAYOUT {#step-9-layout}

### 9.1 Set Up Layout
1. **Project > New Print Layout**
2. Name it "Landslide_Susceptibility_[YourArea]"
3. Set page size: Letter (8.5x11) or Tabloid (11x17) for detail

### 9.2 Add Map Canvas
1. Click **Add Map** button
2. Draw a rectangle covering most of the page
3. In Item Properties, set Scale appropriately
4. Check "Lock Layers" and "Lock Layer Styles"

### 9.3 Add Legend
1. Click **Add Legend**
2. Place in corner
3. Edit legend to show:
   - Susceptibility classes (Very High → Negligible)
   - Color scheme
   - What each color means

### 9.4 Add Scale Bar
1. Click **Add Scale Bar**
2. Place below map
3. Set units to feet or miles (whatever your community uses)

### 9.5 Add North Arrow
1. Click **Add North Arrow**
2. Place in corner

### 9.6 Add Title & Metadata
1. Click **Add Label**
2. Title: "Landslide Susceptibility Map — [Your County/Region]"
3. Add subtitle with date and data sources
4. Add the confidence banner (see Step 8)

### 9.7 Export
1. **Layout > Export as PDF** (for sharing/printing)
2. **Layout > Export as Image** (PNG, for web)
3. Save the QGIS project file (.qgz) so others can open it

---

## STEP 10: SHARE WITH COMMUNITY {#step-10-share}

### 10.1 What to Share
- PDF map (with confidence banner)
- Data Availability Report (HTML)
- QGIS project file (.qgz)
- List of data sources used
- Honesty Engine JSON output

### 10.2 Where to Share
- Local emergency management office
- County planning department
- Neighborhood associations
- Local library (print copies)
- Community message board (see Community Toolkit)

### 10.3 How to Explain It
**For VALIDATED maps:**
> "This map shows where landslides are more likely based on where they've happened before and the terrain. The green banner means we had enough data to check it. Still, get a geotechnical engineer before building."

**For UNVALIDATED maps:**
> "This map is a STARTING POINT. It shows where the terrain looks risky, but we don't have records of past landslides here to check it. The red banner means USE WITH CAUTION. Do not build based on this alone. Hire an engineer."

---

## GLOBAL PATH (OUTSIDE US) {#global-path}

The same workflow works globally with different data sources.

### DEM (Global)
| Source | Resolution | URL |
|--------|-----------|-----|
| Copernicus DEM | 30m | dataspace.copernicus.eu |
| SRTM | 30m | earthexplorer.usgs.gov |
| ALOS World 3D | 30m | www.eorc.jaxa.jp |
| FABDEM | 30m (buildings removed) | data.bris.ac.uk |

### Soils (Global)
| Source | Resolution | URL |
|--------|-----------|-----|
| HWSD (Harmonized World Soil) | 1km | fao.org/soils-portal |
| SoilGrids | 250m | soilgrids.org |
| ISRIC World Soil Info | Variable | isric.org |

### Geology (Global)
| Source | Scale | URL |
|--------|-------|-----|
| OneGeology | Variable | onegeology.org |
| USGS Global Geology | 1:50M | ngmdb.usgs.gov |
| Macrostrat | Regional | macrostrat.org |

### Land Cover (Global)
| Source | Resolution | URL |
|--------|-----------|-----|
| ESA WorldCover | 10m | worldcover.esa.int |
| Copernicus LC | 100m | land.copernicus.eu |
| MODIS LC | 500m | lpdaac.usgs.gov |

### Landslide Inventory (Global)
| Source | Coverage | URL |
|--------|----------|-----|
| UGLC (Unified Global Landslide Catalog) | Global | zenodo.org (search UGLC) |
| NASA COOLR | Global | gpm.nasa.gov/landslides |
| GLC (Global Landslide Catalog) | Global | data.nasa.gov |
| USGS National | US-focused | usgs.gov/landslides |

### Precipitation (Global)
| Source | Resolution | URL |
|--------|-----------|-----|
| CHIRPS | 5km | chg.geog.ucsb.edu/data/chirps |
| WorldClim | 1km | worldclim.org |
| IMERG (NASA) | 0.1° | gpm.nasa.gov |

### The Honesty Engine works the same:
- Check if local inventory exists
- If not, mark UNVALIDATED
- Use Slope-Relief Threshold for awareness maps
- Build community reporting where data is missing

---

## FOR DYSLEXIC USERS {#dyslexic-users}

This tool is designed to be accessible.

### Visual Design
- **Large fonts** (18px minimum in reports)
- **High contrast** (dark text on light background)
- **Sans-serif fonts** (Arial, Helvetica, OpenDyslexic)
- **Wide line spacing** (1.6x)
- **Left-aligned text** (no justified text)
- **Short paragraphs** (3-4 lines max)
- **Color coding** (green = good, yellow = caution, red = danger)

### In QGIS
1. **Settings > Options > General**
2. Change font size to 12pt or larger
3. Use a dyslexia-friendly font if available
4. Increase icon size: **Settings > Options > General > Icon size**

### Audio Support
- Use your device's text-to-speech to read the report aloud
- Windows: Narrator (Win+Ctrl+Enter)
- Mac: VoiceOver (Cmd+F5)
- Linux: Orca (Alt+Super+S)

### Step-by-Step Format
This guide uses:
- Numbered steps (not paragraphs)
- Bullet points (not dense text)
- Tables for quick reference
- Bold keywords for scanning
- Pictures/diagrams where possible

### Video Alternative
If reading is difficult, ask a friend or community member to:
1. Read this guide aloud while doing the steps
2. Record a video of the QGIS workflow
3. Share the video with your local emergency group

---

## TROUBLESHOOTING {#troubleshooting}

### Problem: "No raster layer found" when running the algorithm
**Solution:** Load your DEM into QGIS first. The algorithm needs a DEM to work with.

### Problem: DEM download is too large
**Solution:**
1. Use a smaller area of interest
2. Download 1/3 arc-second (10m) instead of 1/9 arc-second (3m)
3. For large counties, process by township or watershed

### Problem: SZ Plugin won't install
**Solution:**
1. Update QGIS to version 3.28 or newer
2. Check that you have Python scipy and scikit-learn installed:
   - Open OSGeo4W Shell (comes with QGIS)
   - Type: `pip install scipy scikit-learn pandas matplotlib`
3. Restart QGIS

### Problem: Output map is all one color
**Solution:**
1. Check your DEM — is it flat? (Some areas really are flat)
2. Check the symbology: **Right-click layer > Symbology > Render type: Singleband pseudocolor**
3. Click "Classify" to see the value range
4. If values are all 0, your slope threshold may be too high

### Problem: "My state has no inventory data"
**Solution:**
1. This is expected for many states
2. Use the Slope-Relief Threshold method (needs no inventory)
3. Mark map as UNVALIDATED
4. Start community reporting (see Community Toolkit)
5. Contact your state geological survey to request inventory development

### Problem: QGIS crashes with large datasets
**Solution:**
1. Process smaller areas (county instead of state)
2. Use lower resolution DEM (30m instead of 10m)
3. Close other programs to free RAM
4. Save project frequently

### Problem: I don't understand the statistics (AUC, ROC, etc.)
**Solution:**
1. For basic use, you don't need to understand them deeply
2. Remember: **AUC above 0.7 = good enough for planning**
3. **AUC below 0.6 = don't use this model**
4. The SZ Plugin shows a graph — higher curve = better model
5. Ask a local college/university for help interpreting

---

## LICENSE & ATTRIBUTION

This workflow and the Honesty Engine are released under the **MIT License**.

You may:
- Use for any purpose (personal, commercial, government)
- Modify and share
- Use in emergency management

You must:
- Include the honesty warnings (don't remove the UNVALIDATED labels)
- Credit: "Produced using the Landslide Honesty Engine v1.0"
- Share improvements back with the community

### Data Attribution
When publishing maps, include:
- DEM: "USGS 3DEP" or "SRTM NASA/NGA"
- Soils: "USDA NRCS SSURGO"
- Geology: "[State] Geological Survey" or "USGS"
- Land Cover: "USGS NLCD" or "ESA WorldCover"
- Inventory: "USGS Landslide Inventory" or "[State] inventory"

---

## CONTACT & COMMUNITY

- **Report issues:** [GitHub repository link]
- **Share maps:** [Community board link]
- **Ask questions:** [Forum link]
- **Contribute data:** gs-haz_landslides_inventory@usgs.gov

**Remember: This tool is only as good as the honesty of the person using it.**
**Mark unvalidated areas. Save lives.**

---
*Document Version 1.0 | 2026-09-07*
*Community Emergency Mapping Initiative*
