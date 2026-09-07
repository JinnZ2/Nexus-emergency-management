# QGIS PROJECT TEMPLATE: HISTORICAL IMAGERY BEFORE/AFTER COMPARISON
## For Landslide Inventory Building from Old Maps & Aerial Photos

---

## WHAT THIS TEMPLATE DOES

Sets up a QGIS project with:
- Side-by-side map canvases for before/after image comparison
- Swipe tool configuration
- Landslide point layer with pre-built attribute table
- Symbology optimized for detecting landslide scars
- Print layout template for documenting findings

---

## STEP 1: CREATE THE PROJECT

1. Open QGIS
2. **Project > New**
3. **Project > Properties > CRS**
   - For US: Use UTM zone for your area (e.g., "WGS 84 / UTM zone 16N" for Wisconsin)
   - For Nepal: Use "WGS 84 / UTM zone 45N"
4. Save as: `landslide_inventory_[your_area].qgz`

---

## STEP 2: CREATE LAYER GROUPS

Right-click in Layers panel > **Add Group**

Create these groups (bottom to top):

```
📁 BASE DATA
   ├── DEM (raster)
   ├── Hillshade (raster)
   └── Slope (raster)

📁 HISTORICAL IMAGERY
   ├── Aerial Photo [Oldest Date] (raster)
   ├── Aerial Photo [Middle Date] (raster)
   └── Aerial Photo [Newest Date] (raster)

📁 REFERENCE DATA
   ├── Roads (vector line)
   ├── Rivers (vector line)
   └── Buildings (vector polygon)

📁 LANDSLIDE INVENTORY
   ├── Suspected Landslides (point)
   ├── Confirmed Landslides (point)
   └── Landslide Polygons (polygon)
```

---

## STEP 3: CONFIGURE THE LANDSLIDE POINT LAYER

### Create the Layer
1. **Layer > Create Layer > New GeoPackage Layer**
2. File name: `landslide_inventory.gpkg`
3. Table name: `confirmed_landslides`
4. Geometry type: **Point**
5. CRS: Same as project

### Add Fields (Columns)
| Field Name | Type | Purpose |
|-----------|------|---------|
| `id` | Integer | Unique ID (auto-increment) |
| `date_mapped` | Date | When you found it |
| `date_event` | Date | When the slide happened (if known) |
| `confidence` | String(20) | High / Medium / Low |
| `type` | String(30) | Debris flow / Rockfall / Slump / Slide / Unknown |
| `trigger` | String(30) | Rain / Earthquake / Construction / Unknown |
| `size_class` | String(20) | Small (<100m²) / Medium / Large (>1000m²) |
| `photo_oldest` | String(100) | Filename of oldest photo showing it |
| `photo_newest` | String(100) | Filename of newest photo showing it |
| `notes` | String(255) | Your observations |
| `source` | String(50) | Aerial photo / LIDAR / Field / Newspaper |
| `lat` | Decimal(10,6) | Latitude (auto-filled) |
| `lon` | Decimal(10,6) | Longitude (auto-filled) |

### Configure Symbology
1. Right-click layer > **Symbology**
2. Type: **Categorized**
3. Value: `confidence`
4. Click **Classify**
5. Set colors:
   - High confidence: **Red** (#e74c3c)
   - Medium confidence: **Orange** (#e67e22)
   - Low confidence: **Yellow** (#f1c40f)
6. Symbol size: 4mm
7. Click OK

---

## STEP 4: SET UP BEFORE/AFTER COMPARISON

### Method A: Side-by-Side Map Canvases (Best for Detailed Work)

1. **View > New Map View** (or press Ctrl+Shift+M)
2. You now have TWO map canvases
3. In the main canvas: Load your OLDEST aerial photo
4. In the new map view: Load your NEWEST aerial photo
5. **View > Synchronize Views** > Check both canvases
6. Now when you pan/zoom one, the other follows
7. Place windows side-by-side on your monitor

### Method B: Swipe Tool (Best for Quick Comparison)

1. Install **MapSwipeTool3** plugin:
   - **Plugins > Manage and Install Plugins**
   - Search "MapSwipeTool3"
   - Install and restart QGIS
2. Load OLDEST photo as bottom layer
3. Load NEWEST photo as top layer
4. Click the **Swipe Tool** button (looks like a curtain)
5. Drag across the map to reveal the bottom layer
6. Move slowly across landslide-prone areas

### Method C: Temporal Controller (Best for Time Series)

1. **View > Temporal Controller**
2. Set up your aerial photos with temporal settings:
   - Right-click each photo layer > **Properties > Temporal**
   - Check "Dynamic Temporal Control"
   - Set the photo's date
3. Use the temporal slider to animate through time
4. Watch for sudden changes (bare patches appearing)

---

## STEP 5: LOAD HISTORICAL IMAGERY

### From USGS Earth Explorer
1. Download GeoTIFFs from [earthexplorer.usgs.gov](https://earthexplorer.usgs.gov)
2. Drag into QGIS
3. Right-click > **Properties > Symbology**
4. Render type: **Singleband gray** or **Multiband color**
5. Contrast enhancement: **Stretch to MinMax**
6. For black-and-white photos: Use **Singleband pseudocolor** with grayscale ramp

### From Google Earth Pro (Exported Images)
1. In Google Earth Pro: **File > Save > Save Image**
2. Save as JPG or PNG
3. In QGIS: **Layer > Add Layer > Add Raster Layer**
4. Select your saved image
5. **CRITICAL:** The image needs georeferencing if not already aligned
   - **Raster > Georeferencer**
   - Click 3+ points with known coordinates (road intersections, building corners)
   - Set transformation type: **Polynomial 1**
   - Click **Start Georeferencing**

### From USGS 3DEP LIDAR (Hillshade)
1. Download bare-earth DEM
2. **Raster > Analysis > Hillshade**
3. Input: DEM
4. Output: `hillshade.tif`
5. In Symbology: Set contrast to **Stretch to MinMax**
6. Look for subtle scarps and hummocky terrain

---

## STEP 6: DETECTION WORKFLOW

### What to Look For (Checklist)

**On Aerial Photos:**
- [ ] Bare soil patches on forested slopes
- [ ] Vegetation color differences (young trees = lighter green)
- [ ] Arcuate scarps at ridge tops
- [ ] Stream channels suddenly widened or filled with debris
- [ ] Roads that shifted or were rebuilt on new alignments
- [ ] Buildings that disappeared between photo dates
- [ ] Fence lines that are no longer straight

**On LIDAR Hillshade:**
- [ ] Steep, curved scarps (head scarps)
- [ ] Bumpy, irregular terrain on lower slopes (hummocky deposits)
- [ ] Ridges or pressure ridges on slide flanks
- [ ] Bulging toes at slope base
- [ ] Closed depressions (sag ponds) on slide body
- [ ] Stream channels making unnatural bends

**On Topographic Maps:**
- [ ] Contour lines forming arcuate patterns
- [ ] Contour divergence (spreading apart)
- [ ] Contour convergence (squeezing together)
- [ ] Disrupted drainage patterns
- [ ] Steep slopes adjacent to gentle slopes (scarp + deposit)

---

## STEP 7: DIGITIZING LANDSLIDE POINTS

1. Make the `confirmed_landslides` layer active (click it)
2. Click the **Toggle Editing** button (pencil icon)
3. Click **Add Point Feature** button
4. Click on the landslide scarp (top of the slide)
5. The attribute form opens automatically
6. Fill in all fields:
   - `confidence`: How sure are you?
   - `type`: What kind of slide does it look like?
   - `trigger`: What probably caused it?
   - `photo_oldest`: Which photo first shows it?
   - `photo_newest`: Which photo shows it now?
   - `notes`: Describe what you see
7. Click OK
8. Repeat for every suspected slide
9. **Save edits regularly** (Ctrl+S)

### Tips for Accurate Placement
- Place the point at the **top of the main scarp** (crown)
- If the scarp is unclear, place it at the **center of the disturbed area**
- Use the **Identify Features** tool to check coordinates
- Zoom to 1:1000 scale for precise placement

---

## STEP 8: QUALITY CONTROL

### Review Each Point
1. Turn on editing for the layer
2. Double-click each point to open attribute form
3. Ask yourself:
   - Could this be a quarry instead of a landslide?
   - Could this be a farm field instead of a slide scar?
   - Could this be a road cut instead of a natural slide?
   - Is there a clear scarp AND deposit?
4. If unsure: Change `confidence` to "Low" or delete the point

### Cross-Validation
1. Load the DEM hillshade
2. Turn OFF aerial photos
3. Do the LIDAR hillshade points match your aerial photo points?
4. If a point shows on photos but NOT on LIDAR: Re-check — might be a false positive
5. If a point shows on LIDAR but NOT on photos: Might be an old, revegetated slide — good find!

---

## STEP 9: EXPORT FOR HONESTY ENGINE

When you have 20+ points:

1. Right-click `confirmed_landslides` layer
2. **Export > Save Features As**
3. Format: **CSV**
4. File: `landslide_points.csv`
5. Check **GEOMETRY > AS_XY**
6. This creates `lon` and `lat` columns automatically
7. Click OK

Now you can:
- Load into the Honesty Engine (if integrated)
- Or just count the points and note your coverage area
- Re-run the Honesty Engine assessment — your score should improve

---

## STEP 10: PRINT LAYOUT FOR DOCUMENTATION

1. **Project > New Print Layout**
2. Name: `Landslide_Inventory_[Date]`
3. Add two map frames side by side:
   - Left: Oldest aerial photo with landslide points
   - Right: Newest aerial photo with same points
4. Add a **locator map** showing the study area
5. Add **scale bar** and **north arrow**
6. Add **table** showing point count by confidence level
7. Export as PDF for reports

---

## KEYBOARD SHORTCUTS FOR SPEED

| Shortcut | Action |
|----------|--------|
| `Ctrl + T` | Toggle editing |
| `Ctrl + Shift + M` | New map view |
| `Space` | Pan while digitizing |
| `Ctrl + Z` | Undo last point |
| `Ctrl + S` | Save project |
| `Ctrl + Shift + S` | Save edits |
| `V` | Vertex tool (adjust point position) |
| `N` | Toggle node snapping |

---

## TROUBLESHOOTING

**Problem: Historical photos don't line up with modern data**
→ The photos need georeferencing. Use the Georeferencer tool with 4+ ground control points.

**Problem: Can't see landslide scars on old black-and-white photos**
→ Adjust contrast: **Right-click layer > Symbology > Contrast enhancement > Stretch to MinMax**
→ Try **Invert colors** if scars are dark instead of light

**Problem: Too many false positives (quarries, fields, road cuts)**
→ Add a `type` field and mark suspicious ones as "Possible — needs field check"
→ Cross-check with LIDAR hillshade
→ Check against OpenStreetMap for quarries

**Problem: QGIS crashes with large raster files**
→ Build pyramids: **Right-click layer > Properties > Pyramids > Build pyramids**
→ Use lower resolution overview levels

---

*Template Version 1.0 | 2026-09-07*
