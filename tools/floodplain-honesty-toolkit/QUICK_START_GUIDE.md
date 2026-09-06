# Quick start: 0.2% annual-chance floodplain screening

## Before beginning

Use this toolkit to prepare a traceable emergency-planning layer from an existing authoritative source. Do not use it to invent a “500-year” boundary from topography alone. FEMA defines the 0.2% annual-chance flood as an event with a 0.2% chance of being equaled or exceeded in any year, not an event scheduled once every 500 years.[1]

> **Do not use the output for parcel determinations, insurance requirements, lending decisions, permits, building codes, or elevation certification.** Start official inquiries at FEMA’s Map Service Center and contact the local floodplain administrator.[2]

## Six-step workflow

| Step | Action | Stop condition |
| ---: | --- | --- |
| 1 | Define the area of interest and intended emergency-management use. | Stop if the request is an official parcel or regulatory determination. |
| 2 | Obtain current effective FEMA NFHL data from the Map Service Center, or connect to FEMA’s public service for reconnaissance. Record the product identifier, source URL, effective date, retrieval date, and the person or office that verified the source category.[2] [3] | Stop if the source identity and verifier cannot be documented. |
| 3 | Verify NFHL coverage for the entire area using the NFHL Availability layer or product metadata, and retain an evidence identifier or archived record.[3] | The included gate remains closed for incomplete or undocumented coverage. Never call a data gap low risk. |
| 4 | In QGIS, load the Flood Hazard Zones polygon layer and an area-of-interest polygon. Run **Extract 0.2% Annual-Chance Flood Area (Honesty First)**. | If the report closes the publication gate, correct the listed gap rather than overriding it. |
| 5 | Review hazard scope and changed conditions. State whether riverine, coastal, pluvial, levee-related, and dam-failure flooding are included, excluded, or unknown. Record the changed-condition review date and summary. | Do not publish a map with an unstated scope or unreviewed changed conditions. |
| 6 | Export the layer with its honesty report, source metadata, required map label, 1% annual-chance context layer, no-data mask, legend, scale, north arrow, CRS, and retrieval date. | Do not remove or weaken warnings. |

## Required map content

The map must use **0.2% annual-chance flood area** as the primary term. “500-year floodplain” may appear parenthetically. The effective 1% annual-chance Special Flood Hazard Area must use a distinct style because it has a different NFIP role.[1]

| Map element | Required wording or treatment |
| --- | --- |
| Title | `0.2% Annual-Chance Flood Area — Emergency-Management Screening` |
| Main label | Use the exact `required_map_label` from the honesty report. |
| Probability note | `0.2% chance of exceedance in each year; not a once-per-500-years schedule.` |
| Regulatory note | `Not a parcel, insurance, lending, permitting, or code determination.` |
| Outside-area note | `Outside the mapped area does not mean no flood risk.` |
| Data gap | Gray crosshatch labeled `NO DATA — COVERAGE NOT CONFIRMED`. |
| Source | Product name, agency, effective or study date, retrieval date, and URL. |
| Scope | Included, excluded, and unknown flood mechanisms. |

## Expected engine result

An `OPEN` screening gate does not make the product regulatory. The engine always sets `regulatory_use_allowed` to `false`. Operator-documented effective FEMA data with complete provenance, coverage, metadata, a valid coordinate reference system, and a dated changed-condition review can open the screening gate. The toolkit records but does not independently authenticate the operator-entered evidence. Preliminary data require a preliminary, non-effective label. Unreviewed models remain closed. Verified coverage with no intersecting 0.2% polygon produces a report that says **not a no-risk determination**, rather than an empty map presented as safety.

## If no mapped 0.2% boundary exists

Produce the honesty report and a data-gap map. Do not buffer streams, interpolate contours, or apply a water depth to a digital elevation model and call the result a 0.2% floodplain. New modeling requires qualified hydrologic and hydraulic work, flood-frequency analysis, calibration or verification, uncertainty analysis, and independent review. USGS Bulletin 17C is the federal flood-frequency guideline.[4]

## References

[1]: https://www.fema.gov/about/glossary/flood-zones "FEMA Flood Zones"
[2]: https://www.fema.gov/flood-maps "FEMA Flood Maps"
[3]: https://www.fema.gov/flood-maps/national-flood-hazard-layer "FEMA Flood Data Viewers and Geospatial Data"
[4]: https://pubs.usgs.gov/publication/tm4B5 "USGS Guidelines for Determining Flood Flow Frequency—Bulletin 17C"
