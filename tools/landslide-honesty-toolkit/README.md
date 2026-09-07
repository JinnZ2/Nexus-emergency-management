# LANDSLIDE SUSCEPTIBILITY MAPPING SYSTEM
## Open-Source Emergency Management Toolkit
### Honesty-First Design | US Focus with Global Path

---

## 🚨 WHAT THIS IS

A complete open-source system for landslide susceptibility mapping that **enforces honesty about data quality**.

**The problem:** Most landslide susceptibility maps look authoritative even when they have no local data to validate against. People build where the map says "low risk" and die when the slope fails.

**The solution:** This system **requires** a data availability check before producing any map. If local inventory data is missing, the map is explicitly marked **UNVALIDATED** with red warning banners.

**Built for:**
- Emergency managers
- Community leaders
- Builders and developers
- Anyone who needs to know landslide risk in their area

**Built by:** The open-source community, for the open-source community.

---

## 📦 WHAT'S IN THIS PACKAGE

| File | Purpose | Who Needs It |
|------|---------|-------------|
| `landslide_honesty_engine.py` | Core assessment script | Everyone |
| `qgis_landslide_algorithm.py` | QGIS processing algorithm | QGIS users |
| `QGIS_WORKFLOW_GUIDE.md` | Complete step-by-step guide | QGIS users |
| `COMMUNITY_TOOLKIT.md` | Local reporting & neighbor networks | Community leaders |
| `QUICK_START_GUIDE.md` | Dyslexic-friendly quick reference | Everyone |
| `TRAINING_MODULE.md` | Self-service training: coverage report first, five-state graded finding, open data only (CC0) | Everyone, no GIS background |
| `architecture_diagram.png` | Visual system overview | Everyone |
| `us_state_coverage_map.png` | State inventory coverage map | Everyone |

---

## 🎯 CORE PRINCIPLE: THE HONESTY ENGINE

**No map is produced without first answering:**
1. Do we have local landslide inventory data?
2. How complete is it?
3. What is our confidence level?
4. Can we ethically produce a susceptibility map?

**The Engine scores your region 0-100:**
- **70-100 (VALIDATED):** Local inventory exists. Statistical models can be validated.
- **40-69 (MODERATE):** Some inventory exists. Maps need field verification.
- **15-39 (UNVALIDATED):** Minimal inventory. Maps are terrain-only guesses.
- **0-14 (NONE):** No inventory. System refuses to produce a map.

**The weighting:**
- Landslide inventory = 40% (most important)
- Terrain/DEM = 20%
- Soils = 15%
- Geology = 15%
- Trigger data = 10%

**Why inventory is 40%:**
A map without landslide history to check against is just a terrain model. It looks scientific but it's unvalidated. The slope might be steep and the soil might be weak, but if no slides have ever happened there, we don't know if our model is right.

---

## 🗺️ US STATE COVERAGE REALITY

**Only ~10% of US states have extensive landslide inventory data:**
- California, Oregon, Washington, North Carolina, Puerto Rico

**~14% have moderate coverage:**
- Arizona, Colorado, Wyoming, Kentucky, West Virginia, Vermont, Hawaii

**~16% have limited coverage:**
- Tennessee, Virginia, Pennsylvania, New York, Utah, Idaho, Montana, Alaska

**~60% have minimal or no coverage:**
- Texas, Florida, Kansas, Nebraska, the Dakotas, most of the Midwest and Southeast

**This means:** For most of the US, any susceptibility map produced without the Honesty Engine check is **unvalidated and potentially dangerous**.

---

## 🚀 QUICK START

### For Emergency Managers ("I need a map now")
1. Read `QUICK_START_GUIDE.md` (15 minutes)
2. Install QGIS (30 minutes)
3. Run the Honesty Engine on your county (10 minutes)
4. Follow the report's recommendations

### For GIS Users ("I want the full workflow")
1. Read `QGIS_WORKFLOW_GUIDE.md` (1 hour)
2. Install QGIS + SZ Plugin + required Python packages (1 hour)
3. Install the Honesty Engine script (15 minutes)
4. Download data for your area (2-4 hours)
5. Run the full workflow (2-3 hours)
6. Produce and share your map

### For Community Leaders ("I want to build local capacity")
1. Read `COMMUNITY_TOOLKIT.md` (1 hour)
2. Set up a neighborhood communication network
3. Start a landslide reporting program
4. Build your local inventory
5. Re-run the Honesty Engine as data improves

---

## 🔧 TECHNICAL DETAILS

### Requirements
- **QGIS 3.28+** (free, open source)
- **Python 3.9+** (comes with QGIS)
- **SZ Plugin** (from QGIS Plugin Manager)
- **8GB RAM** minimum, 16GB recommended
- **5GB disk space** for data

### Data Sources (All Open Source)
| Layer | US Source | Global Source |
|-------|-----------|---------------|
| DEM | USGS 3DEP (10m) | Copernicus DEM (30m) |
| Soils | USDA SSURGO | SoilGrids (250m) |
| Geology | USGS / State surveys | OneGeology |
| Land Cover | USGS NLCD | ESA WorldCover (10m) |
| Rainfall | PRISM | CHIRPS |
| Inventory | USGS ScienceBase | NASA COOLR / UGLC |

### Models Available
1. **Slope-Relief Threshold** — No training data needed. Best for unvalidated areas.
2. **Weight of Evidence** — Bivariate statistical. Needs some inventory.
3. **Frequency Ratio** — Bivariate statistical. Needs some inventory.
4. **Logistic Regression** — Multivariate statistical. Needs good inventory.
5. **Random Forest** — Machine learning. Needs extensive inventory.

---

## 🌍 GLOBAL PATH

The same workflow works outside the US with different data sources.

**Key differences:**
- DEM: Use Copernicus DEM or SRTM instead of 3DEP
- Soils: Use SoilGrids or HWSD instead of SSURGO
- Geology: Use OneGeology instead of USGS state maps
- Inventory: Use UGLC (Zenodo) or NASA COOLR
- The Honesty Engine works the same way

**Documented global data sources** are listed in the QGIS Workflow Guide, Section "Global Path."

---

## ♿ ACCESSIBILITY

This toolkit is designed for accessibility:

**For dyslexic users:**
- Large fonts (18px+) in all reports
- High contrast colors
- Sans-serif fonts
- Short paragraphs
- Tables instead of dense text
- Color coding (green/yellow/red)
- Audio support via system text-to-speech

**For low-vision users:**
- High contrast mode compatible
- Scalable vector graphics
- Clear visual hierarchy

**For non-technical users:**
- Step-by-step instructions
- No coding required for basic use
- Video-friendly workflow (can be recorded)
- Community support network

---

## 🤝 COMMUNITY COMPONENTS

### Local Resource Board
A physical or digital board showing:
- Current hazard status
- Map availability
- Data gaps
- Local experts
- Emergency contacts
- Evacuation info

### Neighbor Communication Network
- Text message groups
- Phone trees
- Ham radio networks
- Mesh networks (Meshtastic)
- Physical message boards

### Offline Sharing ("Sneakernet")
When internet fails:
- USB drives with maps and data
- Physical delivery between communities
- Mesh network file sharing

### Community Reporting Program
- Paper forms for landslide observations
- Photo documentation guidelines
- Aerial photo analysis training
- Field verification protocols

**See `COMMUNITY_TOOLKIT.md` for full details.**

---

## ⚖️ LICENSE

This project is released under the **MIT License**.

You may:
- Use for any purpose (personal, commercial, government, educational)
- Modify and redistribute
- Use in emergency management
- Integrate into other tools

You must:
- **Keep the honesty warnings** (do not remove UNVALIDATED labels)
- Credit: "Produced using the Landslide Honesty Engine"
- Share improvements with the community

**The data sources have their own licenses** (mostly public domain or CC-BY). Check each source before redistributing raw data.

---

## 📞 CONTACT & CONTRIBUTION

**Report issues:** [GitHub issue tracker]

**Share your maps:** [Community repository]

**Ask questions:** [Forum / Discord / Signal]

**Contribute data to USGS:** gs-haz_landslides_inventory@usgs.gov

**Contribute code:** Pull requests welcome

**Translate:** This toolkit needs translations into Spanish, French, and local languages

---

## 🙏 ACKNOWLEDGMENTS

This toolkit builds on the work of:
- **USGS Landslide Hazards Program** — National inventory and susceptibility map
- **CNR-IRPI Padova** — SZ Plugin for QGIS
- **NASA** — COOLR and Global Landslide Catalog
- **State Geological Surveys** — Local inventory data
- **OpenStreetMap contributors** — Road and river data
- **The QGIS community** — Open-source GIS platform

---

## ⚠️ DISCLAIMER

This toolkit produces **susceptibility maps**, not **hazard maps**.

- **Susceptibility** = Where landslides might occur based on terrain
- **Hazard** = Where landslides will occur AND how often AND how big

**A susceptibility map is a screening tool, not a design tool.**

**Always consult a licensed geotechnical engineer before:**
- Building on or below slopes
- Modifying drainage
- Cutting into hillsides
- Any construction in steep terrain

**The Honesty Engine helps you know what you don't know.**
**It does not replace professional judgment.**

---

## 📚 FURTHER READING

**USGS Publications:**
- Mirus et al. (2024) — National susceptibility map methodology
- Mirus et al. (2020) — National landslide inventory compilation
- Belair et al. (2024, 2025) — GIS databases on ScienceBase

**Academic Sources:**
- Titti et al. (2022) — SZ Plugin for QGIS
- Reichenbach et al. (2018) — Landslide susceptibility review
- Corominas et al. (2014) — Landslide hazard assessment standards

**All cited in the QGIS Workflow Guide.**

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-09-07 | Initial release. Honesty Engine, QGIS workflow, Community Toolkit. |

---

**Remember: This tool is only as good as the honesty of the person using it.**

**Mark unvalidated areas. Build community inventory. Save lives.**

---
*Landslide Susceptibility Mapping System v1.0*
*Community Emergency Mapping Initiative*
*2026-09-07*
