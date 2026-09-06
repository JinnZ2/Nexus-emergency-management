# QUICK START GUIDE
## Landslide Susceptibility Mapping
### For Emergency Managers & Community Leaders

---

## BEFORE YOU START

**You need 3 things:**
1. A computer with QGIS (free)
2. This folder of tools
3. About 2 hours for your first map

**You do NOT need:**
- Money (all tools are free)
- A geology degree
- Programming skills (for basic use)

---

## THE 6 STEPS (IN ORDER)

### STEP 1: RUN THE HONESTY CHECK
**What it does:** Checks if your area has enough data to make a good map.

**How to do it:**
1. Open QGIS
2. Go to Processing > Toolbox
3. Find "Landslide Susceptibility (Honest)"
4. Type your county name and state
5. Draw a box around your area
6. Click RUN

**What you get:** A report with a score.

**Read the score:**
- **GREEN (70+ points)** = Good data. You can make a validated map.
- **YELLOW (40-69 points)** = Some data. Map needs checking.
- **RED (under 40 points)** = Not enough data. Map will say UNVALIDATED.

**IMPORTANT:** If the score is RED, the map will have a big red warning.
**DO NOT remove the warning. It keeps people safe.**

---

### STEP 2: GET YOUR DATA
**What you need:**
- Elevation map (DEM)
- Soil map
- Geology map
- Land cover map
- Rainfall data
- Landslide history (if you have it)

**Where to get it (all free):**
| Data | Where to Get It | How Hard |
|------|----------------|----------|
| Elevation | apps.nationalmap.gov | Easy |
| Soils | websoilsurvey.nrcs.usda.gov | Easy |
| Geology | ngmdb.usgs.gov | Medium |
| Land Cover | www.mrlc.gov | Easy |
| Rainfall | prism.oregonstate.edu | Easy |
| Landslides | usgs.gov/landslides | Hard (many areas have none) |

**Download each file for your county.**
**Put them in a folder on your computer.**

---

### STEP 3: LOAD INTO QGIS
**How to do it:**
1. Open QGIS
2. Drag each file into the map
3. They will stack on top of each other

**What you should see:**
- Your county outline
- Colors showing elevation, soil type, etc.

---

### STEP 4: MAKE THE MAP
**Choose your method based on your score:**

**If GREEN score:**
- Use the SZ Plugin
- Pick "Logistic Regression" or "Random Forest"
- The plugin does the math
- Check the AUC score (higher is better)

**If YELLOW score:**
- Use the SZ Plugin
- Pick "Weight of Evidence"
- Check your map against known slides
- Fix areas that look wrong

**If RED score:**
- Use "Slope-Relief Threshold"
- This needs NO landslide history
- It uses slope and terrain only
- The map WILL be marked UNVALIDATED

---

### STEP 5: ADD THE WARNING LABEL
**This is the MOST important step.**

**If your map is VALIDATED (GREEN):**
- Add a green banner: "VALIDATED — Based on local landslide history"
- Still add: "Site-specific check recommended"

**If your map is UNVALIDATED (RED):**
- Add a RED banner: "UNVALIDATED — NOT FOR SITING"
- Add yellow box with:
  - "This map shows where slides MIGHT happen"
  - "It is NOT based on local slide history"
  - "Hire a geotechnical engineer before building"
  - "Check local building codes"

**NEVER remove these warnings.**
**NEVER give an unvalidated map to someone without explaining it.**

---

### STEP 6: SHARE WITH YOUR COMMUNITY
**Who to give it to:**
- County emergency manager
- County planning office
- Local fire department
- Neighborhood groups
- Local library (print a copy)

**What to include:**
- The map (PDF)
- The honesty report (HTML)
- A note about what the colors mean
- Contact info for questions

**What to say:**
- If GREEN: "This map shows risk based on history. Still get a site check."
- If RED: "This is a STARTING POINT. It is NOT checked against local slides. Do not build based on this alone."

---

## COLOR CODE QUICK REFERENCE

| Color | Meaning | What It Tells You |
|-------|---------|-------------------|
| 🟢 GREEN | VALIDATED | Good data. Map checked against local slides. |
| 🟡 YELLOW | MODERATE | Some data. Map needs field checking. |
| 🔴 RED | UNVALIDATED | Not enough data. Map is a guess. |
| ⚫ GRAY | DATA GAP | We don't know. No data at all. |

---

## IF YOU GET STUCK

**Problem: QGIS won't start**
→ Restart your computer. Try again.

**Problem: Can't find my county data**
→ Try the state-level data instead.
→ Contact your state geological survey.

**Problem: Map is all one color**
→ Check your DEM. Is your county flat?
→ If not, check the "symbology" settings.

**Problem: My state has no landslide data**
→ This is normal for 30+ states.
→ Use the Slope-Relief method.
→ Start a community reporting program.
→ See the Community Toolkit.

**Problem: I don't understand the numbers**
→ You don't need to understand all of them.
→ Remember: AUC above 0.7 = good enough.
→ AUC below 0.6 = don't use it.

---

## FOR DYSLEXIC USERS

**This guide uses:**
- Big letters (size 18+)
- Lots of space between lines
- Short sentences
- Color coding
- Tables instead of long paragraphs

**In QGIS, make text bigger:**
1. Settings > Options > General
2. Change font size to 12 or bigger
3. Change icon size to large

**Use text-to-speech:**
- Windows: Press Win + Ctrl + Enter
- Mac: Press Command + F5
- Let the computer read this guide to you

**Work with a partner:**
- One person reads
- One person clicks
- Switch jobs when tired

---

## IMPORTANT REMINDERS

✓ **Always run the Honesty Engine first**

✓ **Never remove the UNVALIDATED warning**

✓ **Always tell people what the map CAN and CANNOT do**

✓ **When in doubt, hire a geotechnical engineer**

✓ **Build community inventory where data is missing**

✓ **Share your maps openly**

✓ **Update maps when new data comes in**

---

## CONTACTS

**USGS Landslide Team:**
- Email: gs-haz_landslides_inventory@usgs.gov
- Website: usgs.gov/landslides

**Find Your State Geological Survey:**
- Search: "[Your State] geological survey"
- Most have a website with contact info

**Community Help:**
- [Forum link]
- [Discord/Signal group]

---

*This guide is designed to be printed on letter-size paper.*
*Keep a copy with your emergency supplies.*
*Version 1.0 | 2026-09-07*
