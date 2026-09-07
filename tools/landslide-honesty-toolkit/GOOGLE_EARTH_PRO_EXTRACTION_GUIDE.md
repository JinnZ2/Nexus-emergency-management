# EXTRACTING LANDSLIDE POINTS FROM GOOGLE EARTH PRO HISTORICAL IMAGERY
## Step-by-Step Guide for Non-Technical Users

---

## WHAT YOU NEED

- **Google Earth Pro** (free desktop app — [google.com/earth/versions](https://www.google.com/earth/versions/))
- **QGIS** (free — [qgis.org](https://qgis.org))
- A computer with a mouse (not a trackpad — precision matters)
- Patience

---

## OVERVIEW: THE PROCESS

1. Find your area in Google Earth Pro
2. Turn on Historical Imagery
3. Slide back in time to find the oldest clear photo
4. Look for landslide scars
5. Mark each scar with a placemark
6. Save the placemarks as a KML file
7. Import the KML into QGIS
8. Convert to a proper GIS layer
9. Add attributes (date, confidence, notes)
10. Export as CSV for the Honesty Engine

---

## STEP 1: INSTALL GOOGLE EARTH PRO

1. Go to [google.com/earth/versions](https://www.google.com/earth/versions/)
2. Download "Google Earth Pro on desktop"
3. Install with default settings
4. Launch Google Earth Pro

---

## STEP 2: NAVIGATE TO YOUR AREA

1. In the Search box (top left), type your area:
   - Example: "Vernon County, Wisconsin"
   - Example: "Sindhupalchok District, Nepal"
2. Press Enter
3. Google Earth will fly to your area
4. Use the mouse to pan and zoom:
   - **Left-click + drag** = pan
   - **Scroll wheel** = zoom in/out
   - **Right-click + drag** = rotate view

**Tip:** For landslide detection, you want a **top-down view** (looking straight down), not tilted.

---

## STEP 3: TURN ON HISTORICAL IMAGERY

1. Look for the **clock icon** in the toolbar (or go to **View > Historical Imagery**)
2. A timeline slider appears at the top of the screen
3. The slider shows all available photo dates for your view

**What the timeline colors mean:**
- **Blue lines** = photos available
- **Longer blue lines** = more photos around that date
- **Gaps** = no photos (usually due to clouds)

---

## STEP 4: CONFIGURE THE VIEW FOR LANDSLIDE DETECTION

### Turn Off Distracting Layers
1. In the left panel (Layers), **UNCHECK** these:
   - [ ] Borders and Labels
   - [ ] Roads
   - [ ] 3D Buildings
   - [ ] Terrain (sometimes helps to turn OFF terrain exaggeration)
2. Keep checked:
   - [x] Imagery (the aerial photo itself)

### Adjust the View
1. **View > Reset > Tilt** (makes it top-down)
2. **View > Reset > Compass** (north at top)
3. Zoom so your entire study area is visible
4. Then zoom in to about 1:5000 scale for detailed inspection

### Turn ON Terrain Exaggeration (for Nepal/Himalaya)
1. **Tools > Options > 3D View**
2. Set Elevation Exaggeration to **3.0**
3. This makes subtle scarps more visible
4. For flat areas like Wisconsin, keep it at **1.0**

---

## STEP 5: FIND THE OLDEST CLEAR PHOTO

1. Drag the timeline slider all the way to the **LEFT** (oldest date)
2. Look at the image quality:
   - Is it blurry? → Move forward to next date
   - Is it cloudy? → Move forward to next date
   - Is it dark/winter? → Move forward to next date
   - Is it clear and sharp? → **This is your "before" photo**
3. Write down the date: ___________

**For most US areas:** Oldest usable photos are from the **1990s**
**For Nepal:** Oldest usable photos are from the **2000s**

---

## STEP 6: WHAT TO LOOK FOR (VISUAL GUIDE)

### Landslide Scars on Aerial Photos

**FRESH SCAR (recent slide):**
- Bare brown/tan soil on a green forested slope
- Sharp, curved edge at the top (main scarp)
- Irregular, bumpy ground below (deposit)
- May have a stream filled with debris at the bottom

**REVEGETATING SCAR (5–20 years old):**
- Lighter green than surrounding forest
- Younger trees/shrubs
- Still visible scarp but softer edges
- May have a different texture than surroundings

**OLD SCAR (20+ years):**
- Hard to see on photos
- May show as a subtle change in forest pattern
- Often easier to see on LIDAR hillshade

### Common False Positives (DON'T Mark These)

| Feature | Why It's NOT a Landslide |
|---------|------------------------|
| **Quarry** | Straight edges, access road, piles of material |
| **Farm field** | Rectangular shape, plowed rows, near buildings |
| **Road cut** | Follows road alignment, straight edges |
| **Logging clearcut** | Rectangular or angular edges, regular pattern |
| **Burn scar** | Large area, no scarp, no deposit |
| **River sandbar** | In river channel, not on slope |

### The "Scarp + Deposit" Rule
A real landslide has BOTH:
- **A scarp** (steep, curved area at top where material pulled away)
- **A deposit** (bumpy, irregular area at bottom where material landed)

If you only see one, be cautious. Mark it as "Low confidence."

---

## STEP 7: MARK EACH LANDSLIDE WITH A PLACEMARK

1. Click the **Add Placemark** button (yellow pushpin icon)
2. A dialog box opens
3. Move the pushpin to the **top of the landslide scarp** (crown)
4. Fill in the Name field:
   ```
   LS_001_Suspected
   LS_002_Confirmed
   LS_003_FieldCheckNeeded
   ```
5. In the Description field, write:
   ```
   Date first seen: [oldest photo date]
   Date last seen: [newest photo date]
   Type: Debris flow / Rockfall / Slump
   Confidence: High / Medium / Low
   Notes: Bare scar visible on 1995 photo, revegetated by 2015
   ```
6. Click OK
7. The placemark is saved

**Tips for accurate placement:**
- Zoom to 1:2000 scale for precise placement
- Place the pin at the **highest point of the scarp**
- If the scarp is wide, place it at the **center**
- Don't worry about perfect placement — you can adjust in QGIS later

---

## STEP 8: CHECK MULTIPLE TIME PERIODS

For each suspected landslide:

1. **Keep the placemark visible**
2. Drag the timeline slider forward 5–10 years
3. Does the scar still look the same? → It might be a quarry or natural feature
4. Does the scar show revegetation? → Good! It's probably a real landslide
5. Does the scar disappear completely? → It was probably a temporary feature (fire, logging)
6. Write your observations in the placemark Description

**The best evidence:** A bare scar on an old photo that slowly revegetates over decades.

---

## STEP 9: SAVE YOUR PLACEMARKS

1. In the left panel (Places), find your placemarks
2. They are usually under "Temporary Places"
3. Right-click on the folder containing your placemarks
4. Select **Save Place As**
5. File name: `landslide_placemarks_[your_area].kml`
6. File type: **Kml** (not KMZ)
7. Click Save

**IMPORTANT:** KML is a text format. You can open it in Notepad and read the coordinates. This is your raw data.

---

## STEP 10: IMPORT INTO QGIS

1. Open QGIS
2. **Layer > Add Layer > Add Vector Layer**
3. Source type: **File**
4. Browse to your `.kml` file
5. Click **Add**
6. The placemarks appear as points on your map

---

## STEP 11: CONVERT TO A PROPER GIS LAYER

The KML layer is read-only. You need to convert it:

1. Right-click the KML layer
2. **Export > Save Features As**
3. Format: **GeoPackage**
4. File name: `landslide_inventory.gpkg`
5. Layer name: `confirmed_landslides`
6. CRS: Choose your project's CRS
7. Click OK

Now you have an editable layer with all your Google Earth Pro points.

---

## STEP 12: ADD ATTRIBUTES (THE IMPORTANT PART)

1. Right-click the new layer > **Toggle Editing**
2. Click **Open Attribute Table** button
3. Click **New Field** (abacus icon)
4. Add these fields:

| Field Name | Type | Example Values |
|-----------|------|---------------|
| `confidence` | Text | High, Medium, Low |
| `type` | Text | Debris flow, Rockfall, Slump, Slide |
| `trigger` | Text | Rain, Earthquake, Construction, Unknown |
| `date_first` | Date | 1995-06-15 |
| `date_last` | Date | 2020-09-01 |
| `photo_count` | Integer | 3 |
| `notes` | Text | "Bare scar on 1995 photo, revegetated by 2015" |
| `source` | Text | Google Earth Pro |

5. For each point, fill in the fields
6. **Save edits** (Ctrl+Shift+S)

---

## STEP 13: EXPORT FOR THE HONESTY ENGINE

1. Right-click layer > **Export > Save Features As**
2. Format: **CSV**
3. File: `landslide_points.csv`
4. Check **GEOMETRY > AS_XY**
5. Click OK

Your CSV will have columns:
- `id`, `name`, `description`, `lon`, `lat`, `confidence`, `type`, `trigger`, ...

**Count your points.**
- 0–19 points: Still UNVALIDATED, but you have local context
- 20–49 points: Getting better — note the coverage gaps
- 50+ points: You can start thinking about MODERATE confidence
- 100+ points with good spatial coverage: Potential for HIGH confidence

---

## STEP 14: UPDATE THE HONESTY ENGINE

1. Re-run the Honesty Engine assessment for your area
2. Report your inventory count:
   ```
   Region: Vernon County, WI
   Inventory points added: 34
   Source: Google Earth Pro historical imagery (1995–2020)
   Coverage: Partial — focused on Kickapoo River valley
   ```
3. Your inventory score should increase
4. The confidence level may shift from UNVALIDATED_NONE to UNVALIDATED_LOW
5. Document the improvement in your report

---

## ADVANCED TECHNIQUES

### Measuring Landslide Size in Google Earth Pro
1. Click the **Ruler** tool
2. Draw a line across the scarp (width)
3. Draw a line from scarp top to deposit toe (length)
4. Record in your placemark description

### 3D View for Scarp Verification
1. Tilt the view (middle mouse button or tilt slider)
2. Look at the slope in 3D
3. A real scarp shows as a sharp break in slope
4. False positives (quarries, fields) look flat or regularly shaped

### Saving Multiple Time Periods
1. Create a folder for each time period:
   ```
   Landslides_1995
   Landslides_2005
   Landslides_2015
   Landslides_2020
   ```
2. This lets you track which slides are new vs. old
3. In QGIS, load them as separate layers
4. Use different colors for each time period

---

## TROUBLESHOOTING

**Problem: Historical imagery button is grayed out**
→ Your view is too zoomed out. Zoom in closer to your area.

**Problem: No historical imagery available**
→ Some remote areas have limited coverage. Try:
- USGS Earth Explorer for satellite imagery
- State aerial photo archives
- LIDAR hillshade instead

**Problem: Photos are all cloudy**
→ Common in monsoon regions (Nepal). Try:
- Pre-monsoon dates (January–May)
- Post-monsoon dates (October–November)
- Different years — some years have better coverage

**Problem: Can't tell if it's a landslide or a quarry**
→ Check OpenStreetMap for quarry locations
→ Look for access roads (quarries have them, landslides don't)
→ Check multiple time periods — quarries expand over time, landslides revegetate

**Problem: Placemarks are in the wrong place**
→ Don't worry — you can move them in QGIS later
→ In QGIS: Toggle editing > Vertex tool > Drag point to correct location

---

## EXAMPLE: VERNON COUNTY WORKFLOW

**Step 1:** Search "Kickapoo River, Vernon County, WI"
**Step 2:** Zoom to 1:5000, follow the river
**Step 3:** Turn on Historical Imagery, slide to 1995
**Step 4:** Look for bare patches on bluffs above the river
**Step 5:** Mark each one with a placemark
**Step 6:** Slide to 2005 — did it revegetate?
**Step 7:** Slide to 2015 — is it now forested?
**Step 8:** Save placemarks as KML
**Step 9:** Import to QGIS, add attributes
**Step 10:** Export CSV, count points, update Honesty Engine

**Expected findings in Vernon County:**
- Spring 1993 floods likely triggered slides (check photos from 1993–1995)
- 2007–2008 flooding may have triggered more
- Road cuts on County HH, County O, County D may show slope failures
- Bluffs along the Kickapoo between Ontario and La Farge are prime candidates

---

## EXAMPLE: NEPAL WORKFLOW

**Step 1:** Search "Sindhupalchok District, Nepal"
**Step 2:** Zoom to 1:5000, look at steep valleys
**Step 3:** Turn on Historical Imagery, slide to 2005
**Step 4:** Look for bare scars on slopes
**Step 5:** Slide to 2015 (post-earthquake) — MANY new scars will appear
**Step 6:** Slide to 2020 — some revegetated, some still bare
**Step 7:** Mark pre-2015 scars separately from post-2015 scars
**Step 8:** Save as KML
**Step 9:** Import to QGIS
**Step 10:** Note trigger type: "Rain" for pre-2015, "Earthquake" for 2015

**Expected findings in Sindhupalchok:**
- 2015 earthquake triggered thousands of co-seismic slides
- Many reactivated during 2015 and 2016 monsoons
- Road corridors (Araniko Highway) show heavy slide activity
- Pre-2015 inventory will be sparse — focus on post-earthquake documentation

---

## KEY PRINCIPLE

**Every point you add is one more piece of ground truth.**

You don't need to be a geologist. You need to be:
- Patient
- Systematic
- Honest about your confidence level

A "Low confidence" point is still valuable. It says "I saw something here that might be a landslide. Someone should check it in the field."

That is exactly how community inventory-building works.

---

*Guide Version 1.0 | 2026-09-07*
