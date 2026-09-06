# Community field guide for flood observations

## Role of community observations

Community observations can document actual flooding, identify changed conditions, and help qualified officials prioritize surveys and model review. They do not independently establish a 0.2% annual-chance flood boundary. A single event also cannot be assigned a recurrence interval from appearance alone.

Submit observations to the local emergency manager, public works department, floodplain administrator, or the agency coordinating the event survey. Follow local instructions and preserve original files.

> **Life safety comes first.** Do not enter floodwater, damaged structures, eroded banks, active roadways, restricted areas, or areas near downed utilities. Do not place a mark if doing so requires unsafe access.

## Minimum observation record

| Field | Record |
| --- | --- |
| Observation identifier | A unique local identifier that is never reused. |
| Date and time | Local time with time zone; state whether exact or estimated. |
| Observer | Name or organization, plus a safe contact method if consent is given. |
| Location | Latitude and longitude, map pin, address, or feature description. Record the coordinate reference system for surveyed coordinates. |
| Observation type | High-water mark, water extent, road overtopping, bridge or culvert restriction, erosion, debris, structure impact, or other. |
| Evidence | Original photograph or video filename, direction viewed, and a description of visible evidence. |
| Elevation | Record only when surveyed or tied to a documented datum and benchmark. Never infer elevation from a phone altitude display. |
| Confidence | Confirmed, probable, possible, or unknown, with a short explanation. |
| Source | Direct observation, owner report, responder report, sensor, or secondary media. |
| Alteration history | Cropping, annotation, compression, conversion, or other changes to a copy. Preserve the original. |
| Restrictions | Privacy, sensitive infrastructure, or access limitations. |

## Photographs

Photograph the mark or extent, the surrounding context, and a stable reference feature. Include a scale only when it can be placed safely. Record whether the camera clock and location services were correct. Do not overwrite the original file with annotations. Create an annotated copy and retain the original checksum when possible.

Avoid publishing home addresses, faces, license plates, access-control details, or critical-infrastructure vulnerabilities. Share precise records through the responsible agency rather than a public social-media post.

## High-water marks

High-water marks are perishable evidence. Qualified survey teams should evaluate mark quality, identify the physical indicator, survey elevation to an appropriate datum, and document uncertainty. FEMA’s hydraulic-model guidance repeatedly identifies observed stages, flows, gage records, and high-water marks as evidence for calibration or verification.[1]

A community observer may flag a potential mark with photographs and a location. The observer should not label it a surveyed elevation or use it to draw a flood-frequency boundary.

## Changed-condition log

Maintain a dated log of conditions that could change flood behavior after a map or study was produced. Relevant examples include new roads, bridges, culverts, buildings, grading, drainage works, channel changes, wildfire, erosion, sediment or debris, levee work, dam operations, and shoreline change. FEMA notes that flood risk changes and that heavy rain, poor drainage, and nearby construction can affect flooding.[2]

The log should state what changed, when it changed, who reported it, the evidence available, and whether an engineer or floodplain administrator reviewed it. The Honesty Engine field `changed_conditions_reviewed` should be true only after this review is documented.

## Data handoff

Provide the responsible agency with a read-only copy of the original evidence, an inventory table, a coordinate and datum statement, known uncertainties, and contact information. Keep a transfer record showing who received the package and when.

Do not merge community observations into the effective FEMA flood layer. Store them as a separate evidence layer with distinct symbology and status. Any map revision or official determination must follow the applicable FEMA and local process.[3]

## References

[1]: https://www.fema.gov/flood-maps/products-tools/numerical-models/hydraulic "FEMA Hydraulic Numerical Models Meeting the Minimum Requirement of National Flood Insurance Program"
[2]: https://www.fema.gov/flood-maps "FEMA Flood Maps"
[3]: https://www.fema.gov/flood-maps/national-flood-hazard-layer "FEMA Flood Data Viewers and Geospatial Data"
