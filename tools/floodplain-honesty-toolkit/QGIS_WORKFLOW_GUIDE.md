# QGIS workflow guide

## Objective

This workflow extracts an explicit 0.2% annual-chance flood-hazard category from a FEMA National Flood Hazard Layer (NFHL) Flood Hazard Zones dataset, clips it to an area of interest, and blocks distribution when source traceability or safety checks fail. FEMA states that the NFHL contains current effective flood-hazard data assembled from effective maps and Letters of Map Change, while also noting that digital coverage is not universal.[1]

The workflow requires **QGIS 3**, `floodplain_honesty_engine.py`, and `qgis_floodplain_algorithm.py`. The two Python files must remain in the same QGIS Processing scripts directory.

## Data acquisition

### Reproducible downloaded-data method

Use FEMA’s Map Service Center to search all products for the county or state and download NFHL GIS data. Archive the original download, retrieval date, product metadata, and any accompanying documentation. FEMA recommends county or state downloads when a larger amount of data is needed.[1] [2]

This method is preferred for an incident package because the exact input can be retained and hashed. It does not update automatically, so check the Map Service Center and Letters of Map Change before reuse.

### Live-service method

FEMA documents the following effective NFHL services:[2]

```text
ArcGIS REST
https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer

OGC WMS
https://hazards.fema.gov/arcgis/rest/services/public/NFHLWMS/MapServer/WMSServer

OGC WFS
https://hazards.fema.gov/arcgis/services/public/NFHL/MapServer/WFSServer
```

FEMA lists `NFHL Availability` as layer 0 and `Flood Hazard Zones` as layer 28. The WFS is limited to 1,000 features per request, so use a small bounding box or download county or state data for larger areas.[2]

In QGIS, use **Layer > Add Layer > Add ArcGIS REST Server Layer** for the REST service or **Add WFS Layer** for feature access. Confirm that the layer exposes polygons and includes `ZONE_SUBTY`. Do not rely on WMS imagery for extraction because WMS primarily returns rendered map images rather than editable source features.

## Prepare the area of interest

Create or load one polygon layer representing the exact operational area. Dissolve overlapping polygons if necessary. Verify the area-of-interest coordinate reference system and geometry. Name the layer with a stable jurisdiction, watershed, or incident identifier.

Coverage must be assessed independently of whether flood polygons happen to appear. A location with no flood-hazard polygon may be outside a mapped hazard, outside digital NFHL coverage, or affected by an unrepresented flood mechanism. Use the NFHL Availability layer or downloaded-product metadata to confirm coverage.[1] [2]

## Install the Processing algorithm

Open **Processing > Toolbox > Scripts > Add Script to Toolbox** and select `qgis_floodplain_algorithm.py`. Keep `floodplain_honesty_engine.py` beside it. If QGIS cannot import the engine, the script should not be copied into another folder by itself.

The tool appears under **Emergency Hazard Mapping** as **Extract 0.2% Annual-Chance Flood Area (Honesty First)**.

## Required inputs

| Parameter | Required practice |
| --- | --- |
| Flood Hazard Zones | Use FEMA layer 28 or a local schema-compatible copy. Preserve original attributes. |
| Area of interest | Use a valid polygon with an identified operational scope. |
| Region name | Enter the jurisdiction, watershed, or incident area exactly as it should appear in the report. |
| Zone subtype field | Default `ZONE_SUBTY`; confirm against the source schema. |
| SFHA field | Default `SFHA_TF`; optional, but useful for detecting 1% annual-chance context. |
| Source authority | Select effective FEMA, preliminary FEMA, adopted local, local study, or screening model accurately. FEMA categories require an HTTPS URL on a `fema.gov` domain. |
| Source name | Record the product or study name, jurisdiction, and version where available. |
| Source identifier | Record the FIRM database, NFHL download, study, or archived-record identifier. |
| Source authority verifier | Name the person or office that checked the selected source category. The toolkit records but does not authenticate this claim. |
| Coverage evidence | Record the NFHL Availability review, downloaded-product metadata, or archived coverage record. |
| Source URL | Use a stable product, service, or agency page. |
| Dates | Record source effective or study date, retrieval date, and assessment date. |
| Coverage confirmed | Leave false until the entire area is verified against availability information. |
| Vertical datum | Mark known only when elevations are used and the datum is documented. |
| Calibration, review, uncertainty | Mark true only when documentation is available. These fields are required to open the gate for local studies. |
| Changed conditions | Mark true only after checking material newer changes, and provide the review date and written summary. Future conditions may still differ. |

The default extraction expression is:

```qgis
upper("ZONE_SUBTY") LIKE '%0.2 PCT ANNUAL CHANCE FLOOD HAZARD%'
```

This narrow expression is deliberate. FEMA explains that shaded Zone X or Zone B usually represents the area between the 1% and 0.2% annual-chance limits, but the same moderate-hazard categories may also represent shallow flooding, small drainage areas, or levee-related conditions.[3] Selecting every Zone X polygon would therefore overstate what was explicitly identified as the 0.2% boundary.

## Publication gate behavior

The algorithm writes a JSON honesty report before evaluating the output gate. Missing layers, an empty area of interest, invalid input coordinate reference systems, a missing subtype field, or malformed assessment metadata produce an `INVALID_INPUT` closed-gate report before QGIS raises an error. If a valid assessment closes the gate, QGIS also raises an error and produces no distributable polygon layer. Correct the report’s deficiencies instead of manually removing the stop condition.

When the gate opens, the algorithm extracts matching polygons, clips them to the area of interest, and embeds `MAP_LABEL`, `SRC_TYPE`, `SRC_NAME`, `SRC_ID`, `SRC_VRF_BY`, `COV_EVID`, `SRC_DATE`, `RETR_DATE`, `CONF_LVL`, and `REG_USE` in every feature. The output remains a screening layer because the core engine always sets regulatory use to `NO`.

If verified effective FEMA coverage contains no explicit matching polygon in the area of interest, the algorithm writes a `NO_INTERSECTION_IN_VERIFIED_COVERAGE` report and no polygon output. That result is explicitly **not** a no-risk determination.

## Styling and layout

Style the 0.2% annual-chance area with an orange outline and light transparent fill. Style the 1% annual-chance Special Flood Hazard Area separately in blue. Use a gray crosshatch for every data-gap area. Keep all source boundaries visible at a scale appropriate to the source data; FEMA documents detailed NFHL display at 1:50,000 and larger scales and notes that the database is stored in NAD83.[2]

Every exported layout must include the source metadata, retrieval date, coordinate reference system, hazard scope, no-data legend, required map label, probability explanation, and nonregulatory disclaimer. A basemap used for an official interpretation must meet FEMA accuracy standards; this toolkit does not verify basemap accuracy.[1] [2]

## Quality-control review

Before distribution, a second analyst should verify the expression, feature count, area-of-interest boundary, coverage evidence, source authority, dates, coordinate reference system, and disclaimer. Compare the result visually with FEMA’s NFHL Viewer or an official FIRMette. Investigate every discrepancy rather than treating the local extraction as authoritative.

Review whether the source represents riverine, coastal, shallow, levee-related, and other conditions. Pluvial or urban-drainage flooding and dam-failure inundation remain excluded unless separately modeled and documented. FEMA notes that heavy rainfall, poor drainage, and nearby construction can produce flood damage away from rivers and coasts.[4]

## Troubleshooting

| Problem | Correct response |
| --- | --- |
| No matching features | Confirm layer, field, geographic extent, and digital coverage. Accept a `DATA_GAP` result if no explicit 0.2% category exists. |
| More than 1,000 WFS features needed | Narrow the bounding box or use a county or state download.[2] |
| Preliminary and effective data disagree | Show them separately and label the preliminary layer non-effective. Do not replace the effective layer silently.[1] [2] |
| Layer CRS is invalid | Define the CRS from authoritative metadata; do not guess. The gate must remain closed. |
| Coverage cannot be confirmed | Add a no-data mask and keep the gate closed until the full operational area is accounted for. |
| A local model lacks review documents | Use it only for internal scoping. Do not publish it as a 0.2% annual-chance floodplain. |

## References

[1]: https://www.fema.gov/flood-maps/national-flood-hazard-layer "FEMA Flood Data Viewers and Geospatial Data"
[2]: https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS "GIS Web Services for the FEMA National Flood Hazard Layer"
[3]: https://www.fema.gov/about/glossary/zone-b-and-x-shaded "FEMA Zone B and X (Shaded)"
[4]: https://www.fema.gov/flood-maps "FEMA Flood Maps"
