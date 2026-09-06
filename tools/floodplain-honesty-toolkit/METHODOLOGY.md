# Methodology and safety gates

## Purpose

The Floodplain Honesty Engine evaluates whether an existing 0.2% annual-chance flood boundary is sufficiently identified and documented for a **screening product**. It does not calculate flood frequency, water-surface elevation, depth, velocity, arrival time, or damage. It does not convert the readiness score into a regulatory determination.

A 0.2% annual exceedance probability means that the specified flood magnitude has a 0.002 probability of being equaled or exceeded in a given year. It is often called the 500-year flood, but annual exceedances are not scheduled at 500-year intervals. The illustrative cumulative probability is calculated as:

```text
P(at least one exceedance in n years) = 1 - (1 - 0.002)^n
```

For 30 years, the result is approximately 5.83% under constant-probability and independent-year assumptions. These assumptions are explanatory, not a forecast.

## Readiness score

The 100-point readiness score organizes evidence and omissions. It does not override the categorical publication gates.

| Category | Maximum points | Evidence evaluated |
| --- | ---: | --- |
| Source authority | 25 | Effective FEMA, preliminary FEMA, adopted local, local study, screening model, or no source. |
| Explicit 0.2% boundary | 20 | A traceable boundary explicitly identified as 0.2% annual chance. |
| Area-of-interest coverage | 15 | Verified coverage of the complete area; uncovered areas require a no-data mask. |
| Spatial and source metadata | 15 | Complete metadata, known horizontal coordinate reference system, and known vertical datum where elevations are used. |
| Calibration, review, and uncertainty | 15 | Documented calibration, independent review, and uncertainty. |
| Changed-conditions review | 10 | Review of newer terrain, development, drainage, wildfire, erosion, flood-control structures, and other material changes. |

An effective FEMA source receives the highest source-authority score, but that score does not certify coverage or freshness. FEMA states that NFHL digital data covers more than 90% of the U.S. population, not every location, and that its content is updated continuously.[1]

## Confidence classes

| Confidence class | Meaning | Screening output |
| --- | --- | --- |
| `EFFECTIVE_FEMA_SCREENING` | The operator documents an effective FEMA source with an explicit 0.2% boundary for the complete stated area. The toolkit does not independently authenticate the record. | Allowed only when provenance, metadata, CRS, and changed-condition checks also pass. |
| `EFFECTIVE_FEMA_PARTIAL` | Operator-documented effective FEMA data contain an explicit boundary but coverage is incomplete. | The included publication gate remains closed. A future extended workflow would require a complete, independently reviewed no-data mask. |
| `NO_INTERSECTION_IN_VERIFIED_COVERAGE` | Operator-documented effective FEMA coverage is complete, but no explicit 0.2% polygon intersects the area of interest. | Report only. This result is not a no-risk determination. |
| `PRELIMINARY_NONREGULATORY` | Preliminary FEMA data contain an explicit boundary. | May support planning, but must be labeled preliminary and non-effective. FEMA states that preliminary data are subject to change and cannot be used for insurance rating or mandatory purchase enforcement.[1] [2] |
| `DOCUMENTED_NONREGULATORY` | A local study contains an explicit boundary with calibration, uncertainty, and independent review documented. | Screening only; adoption and regulatory status must be verified separately. |
| `UNVALIDATED_MODEL` | A local or screening model lacks required review evidence. | Publication gate closed. |
| `DATA_GAP` | No explicit and traceable 0.2% boundary is available. | Report only; no floodplain polygon. |

## Fail-closed conditions

The engine closes the publication gate when any of the following conditions applies:

1. No source or no explicit 0.2% annual-chance boundary is present.
2. The source is a screening model.
3. A local study lacks documented calibration, uncertainty, or independent technical review.
4. Source identity, authority-verifier, coverage evidence, dates, URL, or other required metadata are incomplete.
5. The horizontal coordinate reference system is unverified.
6. Changed conditions have not been reviewed with a date and written summary.

Incomplete geographic coverage does not become low risk. The QGIS operator must verify coverage using FEMA’s NFHL Availability layer or downloaded-product metadata. FEMA identifies Flood Hazard Zones as NFHL layer 28 and NFHL Availability as layer 0 in its public service documentation.[2]

## Source hierarchy

| Source | Treatment |
| --- | --- |
| Operator-documented current effective FEMA NFHL or effective FIRM database | Highest source category for this toolkit. FEMA states that effective data must establish minimum NFIP requirements where it exists, but the toolkit does not authenticate the operator's product identifier or coverage evidence.[1] |
| Preliminary or pending FEMA data | Useful for awareness of prospective changes, but not effective regulatory data.[1] [2] |
| Adopted local study | Potentially valuable, but adoption, supersession, and legal relationship to FEMA products require local verification. |
| Reviewed local engineering study | Nonregulatory screening source unless separately adopted or approved. |
| Screening model | Internal scoping only. The toolkit will not publish it as a 0.2% floodplain. |

## Why the QGIS filter is narrow

FEMA defines Zone B and shaded Zone X as moderate-hazard areas usually located between the 1% and 0.2% annual-chance flood limits. FEMA also uses these zones for some shallow flooding, drainage areas smaller than one square mile, and areas protected by levees from the 1% flood.[3] The QGIS script therefore does not select every polygon with `FLD_ZONE = 'X'`. It selects records whose `ZONE_SUBTY` explicitly contains `0.2 PCT ANNUAL CHANCE FLOOD HAZARD` and preserves the source attributes for review.

A qualified analyst may determine that additional moderate-hazard categories are relevant to a specific product, but that interpretation must be documented outside the default extraction.

## Requirements for a newly modeled boundary

A new boundary is beyond this toolkit’s computational scope. USGS Bulletin 17C provides federal flood-frequency guidelines and addresses annual peak-flow data, historical and censored information, regional skew, and confidence intervals.[4] Converting a 0.2% discharge estimate into a flood extent also requires an appropriate hydraulic model, terrain, channel and floodplain geometry, structures, roughness, and boundary conditions.

FEMA’s hydraulic model guidance states for multiple accepted models that calibration or verification against gage data, observed stages and flows, or high-water marks should be performed where possible or is required for specified uses.[5] A defensible local study should therefore include the model versions and files, terrain provenance, flow derivation, datum, structures, calibration evidence, sensitivity or uncertainty analysis, independent review, and documented limitations.

## Mandatory interpretation limits

Every map and report must state that the output:

- is a screening product rather than a parcel determination;
- is not an insurance, lending, permitting, or code-compliance decision;
- does not imply no risk outside the boundary;
- excludes any hazard type not listed as included;
- may not reflect changed conditions or future conditions;
- must be checked against the current effective FEMA products and local floodplain administrator guidance.

FEMA emphasizes that no zone is a no-risk zone and that flooding can result from heavy rainfall, poor drainage, or nearby construction even away from a river or coast.[6]

A completed changed-conditions review is a dated operational check, not a guarantee about future conditions. The report always preserves that limitation and records the reviewer-supplied date and summary separately.

## References

[1]: https://www.fema.gov/flood-maps/national-flood-hazard-layer "FEMA Flood Data Viewers and Geospatial Data"
[2]: https://hazards.fema.gov/femaportal/wps/portal/NFHLWMS "GIS Web Services for the FEMA National Flood Hazard Layer"
[3]: https://www.fema.gov/about/glossary/zone-b-and-x-shaded "FEMA Zone B and X (Shaded)"
[4]: https://pubs.usgs.gov/publication/tm4B5 "USGS Guidelines for Determining Flood Flow Frequency—Bulletin 17C"
[5]: https://www.fema.gov/flood-maps/products-tools/numerical-models/hydraulic "FEMA Hydraulic Numerical Models Meeting the Minimum Requirement of National Flood Insurance Program"
[6]: https://www.fema.gov/flood-maps "FEMA Flood Maps"
