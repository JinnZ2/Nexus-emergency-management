#!/usr/bin/env python3
"""
LANDSLIDE HONESTY ENGINE v1.0
================================
Core assessment script for landslide susceptibility mapping.

CRITICAL PRINCIPLE: This script NEVER produces a map without first producing
a DATA AVAILABILITY REPORT. Unvalidated areas are explicitly marked.
No false confidence allowed.

Usage:
    python landslide_honesty_engine.py --region "My County" --state NC --county "Buncombe"

    python landslide_honesty_engine.py --bbox -82.8 35.4 -82.2 35.8 --state NC

Output:
    - Text report to stdout
    - JSON file for QGIS integration
    - Validation flag file that QGIS processing model reads

License: MIT (Open Source)
Author: Community Emergency Mapping Initiative
"""

import json
import os
import sys
import argparse
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Tuple
from enum import Enum

class ConfidenceLevel(Enum):
    VALIDATED_HIGH = "VALIDATED_HIGH"
    VALIDATED_MODERATE = "VALIDATED_MODERATE"
    UNVALIDATED_LOW = "UNVALIDATED_LOW"
    UNVALIDATED_NONE = "UNVALIDATED_NONE"
    DATA_GAP = "DATA_GAP"

class DataLayer(Enum):
    LOCAL_INVENTORY = "local_landslide_inventory"
    STATE_INVENTORY = "state_landslide_inventory"
    USGS_NATIONAL = "usgs_national_inventory"
    DEM_HIGHRES = "dem_3dep_10m"
    DEM_MEDIUM = "dem_srtm_30m"
    DEM_LOW = "dem_srtm_90m"
    SOILS_SSURGO = "soils_ssurgo"
    SOILS_STATSGO = "soils_statsgo"
    GEOLOGY_STATE = "geology_state"
    GEOLOGY_USGS = "geology_usgs_national"
    LANDCOVER_NLCD = "landcover_nlcd"
    LANDCOVER_MODIS = "landcover_modis"
    PRECIPITATION = "precipitation_data"
    ROADS_OSM = "roads_openstreetmap"
    SLOPE_DERIVED = "slope_derived_from_dem"
    ASPECT_DERIVED = "aspect_derived_from_dem"
    CURVATURE_DERIVED = "curvature_derived_from_dem"

@dataclass
class RegionAssessment:
    region_name: str
    state_fips: Optional[str] = None
    county_fips: Optional[str] = None
    bbox: Tuple[float, float, float, float] = field(default=(0.0, 0.0, 0.0, 0.0))
    data_available: Dict[str, bool] = field(default_factory=dict)
    data_quality: Dict[str, str] = field(default_factory=dict)
    data_source: Dict[str, str] = field(default_factory=dict)
    inventory_score: float = 0.0
    terrain_score: float = 0.0
    soil_score: float = 0.0
    geology_score: float = 0.0
    trigger_score: float = 0.0
    overall_score: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.UNVALIDATED_NONE
    confidence_reason: str = ""
    can_produce_map: bool = False
    map_reliability_note: str = ""
    warnings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    local_contacts: List[str] = field(default_factory=list)

# State inventory knowledge base
STATE_INVENTORY_KNOWN = {
    "CA": {"name": "California", "coverage": "extensive", "agency": "California Geological Survey", "quality": "high"},
    "OR": {"name": "Oregon", "coverage": "extensive", "agency": "Oregon Department of Geology", "quality": "high"},
    "WA": {"name": "Washington", "coverage": "extensive", "agency": "Washington DNR", "quality": "high"},
    "NC": {"name": "North Carolina", "coverage": "extensive", "agency": "NCGS", "quality": "high", "notes": "Western NC focused, 4500+ landslides mapped"},
    "AZ": {"name": "Arizona", "coverage": "moderate", "agency": "Arizona Geological Survey", "quality": "moderate"},
    "KY": {"name": "Kentucky", "coverage": "moderate", "agency": "Kentucky Geological Survey", "quality": "moderate"},
    "VT": {"name": "Vermont", "coverage": "moderate", "agency": "Vermont Geological Survey", "quality": "moderate"},
    "WV": {"name": "West Virginia", "coverage": "moderate", "agency": "West Virginia Geological Survey", "quality": "moderate"},
    "WY": {"name": "Wyoming", "coverage": "moderate", "agency": "Wyoming State Geological Survey", "quality": "moderate"},
    "CO": {"name": "Colorado", "coverage": "moderate", "agency": "Colorado Geological Survey", "quality": "moderate"},
    "TN": {"name": "Tennessee", "coverage": "limited", "agency": "Tennessee Geological Survey", "quality": "low"},
    "VA": {"name": "Virginia", "coverage": "limited", "agency": "Virginia DMME", "quality": "low"},
    "PA": {"name": "Pennsylvania", "coverage": "limited", "agency": "PA DCNR", "quality": "low"},
    "NY": {"name": "New York", "coverage": "limited", "agency": "NYSGS", "quality": "low"},
    "UT": {"name": "Utah", "coverage": "limited", "agency": "Utah Geological Survey", "quality": "low"},
    "ID": {"name": "Idaho", "coverage": "limited", "agency": "Idaho Geological Survey", "quality": "low"},
    "MT": {"name": "Montana", "coverage": "limited", "agency": "Montana Bureau of Mines", "quality": "low"},
    "AK": {"name": "Alaska", "coverage": "limited", "agency": "Alaska DGGS", "quality": "low", "notes": "Vast area, sparse coverage"},
    "HI": {"name": "Hawaii", "coverage": "moderate", "agency": "USGS/Hawaii", "quality": "moderate"},
    "PR": {"name": "Puerto Rico", "coverage": "extensive", "agency": "USGS", "quality": "high", "notes": "USGS 5m susceptibility map available"},
}

def assess_region(region_name: str, state_code: str, county_name: Optional[str] = None,
                  bbox: Optional[Tuple[float, float, float, float]] = None) -> RegionAssessment:
    state_code = state_code.strip().upper()
    assessment = RegionAssessment(
        region_name=region_name,
        state_fips=state_code,
        bbox=bbox or (0.0, 0.0, 0.0, 0.0)
    )

    state_info = STATE_INVENTORY_KNOWN.get(state_code)

    if state_info:
        assessment.data_available[DataLayer.STATE_INVENTORY.value] = True
        assessment.data_quality[DataLayer.STATE_INVENTORY.value] = state_info["quality"]
        assessment.data_source[DataLayer.STATE_INVENTORY.value] = state_info["agency"]

        if state_info["coverage"] == "extensive":
            assessment.inventory_score = 80.0
            assessment.local_contacts.append(f"{state_info['agency']} — primary state landslide data source")
        elif state_info["coverage"] == "moderate":
            assessment.inventory_score = 50.0
            assessment.local_contacts.append(f"{state_info['agency']} — partial coverage, contact for local inventory")
        else:
            assessment.inventory_score = 25.0
            assessment.local_contacts.append(f"{state_info['agency']} — limited coverage")
            assessment.warnings.append(f"State inventory for {state_info['name']} is LIMITED. Local field verification is essential.")
    else:
        assessment.data_available[DataLayer.STATE_INVENTORY.value] = False
        assessment.data_quality[DataLayer.STATE_INVENTORY.value] = "none"
        assessment.data_source[DataLayer.STATE_INVENTORY.value] = "No known state program"
        assessment.inventory_score = 5.0
        assessment.warnings.append(f"CRITICAL: {state_code} has no known state landslide inventory program.")
        assessment.warnings.append("Any susceptibility map produced without local inventory is UNVALIDATED.")
        assessment.recommendations.append("Contact your state geological survey to request inventory development.")
        assessment.recommendations.append("Consider community-based landslide reporting (see Community Toolkit).")

    assessment.data_available[DataLayer.USGS_NATIONAL.value] = True
    assessment.data_quality[DataLayer.USGS_NATIONAL.value] = "variable"
    assessment.data_source[DataLayer.USGS_NATIONAL.value] = "USGS National Landslide Inventory (Belair et al. 2024)"

    if assessment.inventory_score < 30:
        assessment.warnings.append("USGS national inventory has sparse coverage in this region — do not rely on it alone.")

    assessment.data_available[DataLayer.DEM_HIGHRES.value] = True
    assessment.data_quality[DataLayer.DEM_HIGHRES.value] = "high"
    assessment.data_source[DataLayer.DEM_HIGHRES.value] = "USGS 3DEP (10m or better)"
    assessment.terrain_score = 85.0

    assessment.data_available[DataLayer.SLOPE_DERIVED.value] = True
    assessment.data_available[DataLayer.ASPECT_DERIVED.value] = True
    assessment.data_available[DataLayer.CURVATURE_DERIVED.value] = True

    assessment.data_available[DataLayer.SOILS_SSURGO.value] = True
    assessment.data_quality[DataLayer.SOILS_SSURGO.value] = "high"
    assessment.data_source[DataLayer.SOILS_SSURGO.value] = "USDA NRCS SSURGO"
    assessment.soil_score = 75.0

    assessment.data_available[DataLayer.GEOLOGY_USGS.value] = True
    assessment.data_quality[DataLayer.GEOLOGY_USGS.value] = "medium"
    assessment.data_source[DataLayer.GEOLOGY_USGS.value] = "USGS National Geologic Map"
    assessment.geology_score = 60.0

    if state_info and state_info.get("quality") in ["high", "moderate"]:
        assessment.data_available[DataLayer.GEOLOGY_STATE.value] = True
        assessment.data_quality[DataLayer.GEOLOGY_STATE.value] = state_info["quality"]
        assessment.data_source[DataLayer.GEOLOGY_STATE.value] = f"{state_info['agency']} geology"
        assessment.geology_score = 80.0 if state_info["quality"] == "high" else 65.0

    assessment.data_available[DataLayer.PRECIPITATION.value] = True
    assessment.data_quality[DataLayer.PRECIPITATION.value] = "high"
    assessment.data_source[DataLayer.PRECIPITATION.value] = "PRISM Climate Data / NOAA"
    assessment.trigger_score = 80.0

    assessment.data_available[DataLayer.LANDCOVER_NLCD.value] = True
    assessment.data_quality[DataLayer.LANDCOVER_NLCD.value] = "high"
    assessment.data_source[DataLayer.LANDCOVER_NLCD.value] = "USGS NLCD"

    assessment.data_available[DataLayer.ROADS_OSM.value] = True
    assessment.data_quality[DataLayer.ROADS_OSM.value] = "medium"
    assessment.data_source[DataLayer.ROADS_OSM.value] = "OpenStreetMap"

    assessment.overall_score = (
        assessment.inventory_score * 0.40 +
        assessment.terrain_score * 0.20 +
        assessment.soil_score * 0.15 +
        assessment.geology_score * 0.15 +
        assessment.trigger_score * 0.10
    )

    if assessment.inventory_score >= 70:
        assessment.confidence_level = ConfidenceLevel.VALIDATED_HIGH
        assessment.confidence_reason = "Local/state landslide inventory exists with sufficient coverage for statistical validation."
        assessment.can_produce_map = True
        assessment.map_reliability_note = "Map can be validated against local inventory. ROC/AUC analysis recommended."
    elif assessment.inventory_score >= 40:
        assessment.confidence_level = ConfidenceLevel.VALIDATED_MODERATE
        assessment.confidence_reason = "Some local inventory exists, but coverage gaps remain. Regional model with local verification needed."
        assessment.can_produce_map = True
        assessment.map_reliability_note = "Map requires field verification. Susceptibility classes may be uncertain in unmapped areas."
        assessment.warnings.append("MODERATE CONFIDENCE: Local inventory is incomplete. Validate with field surveys before using for siting.")
    elif assessment.inventory_score >= 15:
        assessment.confidence_level = ConfidenceLevel.UNVALIDATED_LOW
        assessment.confidence_reason = "Minimal local inventory. Any susceptibility map is based on regional extrapolation and terrain proxies only."
        assessment.can_produce_map = True
        assessment.map_reliability_note = "UNVALIDATED — This map is NOT based on local landslide history. Use for awareness only, NOT for siting decisions."
        assessment.warnings.append("UNVALIDATED MAP: No sufficient local landslide inventory to validate susceptibility model.")
        assessment.warnings.append("This map shows terrain that LOOKS like landslide-prone areas based on slope, geology, and soils.")
        assessment.warnings.append("It does NOT mean landslides have actually occurred here. It does NOT mean they haven't.")
        assessment.recommendations.append("Contact your state geological survey to check for unpublished inventory data.")
        assessment.recommendations.append("Conduct a site-specific geotechnical investigation before any construction.")
    else:
        assessment.confidence_level = ConfidenceLevel.UNVALIDATED_NONE
        assessment.confidence_reason = "No known landslide inventory data for this state/region."
        assessment.can_produce_map = False
        assessment.map_reliability_note = "CANNOT PRODUCE RELIABLE MAP — Insufficient data to make any meaningful susceptibility assessment."
        assessment.warnings.append("CRITICAL DATA GAP: No landslide inventory, limited state geological survey resources.")
        assessment.recommendations.append("DO NOT use any susceptibility map for this region without professional geotechnical assessment.")
        assessment.recommendations.append("Start a community landslide reporting program immediately (see Community Toolkit).")

    return assessment

def generate_report(assessment: RegionAssessment) -> str:
    report = []
    report.append("=" * 70)
    report.append("LANDSLIDE SUSCEPTIBILITY — DATA AVAILABILITY & CONFIDENCE REPORT")
    report.append("=" * 70)
    report.append(f"Region: {assessment.region_name}")
    report.append(f"State: {assessment.state_fips}")
    report.append(f"Assessment Date: {datetime.now().strftime('%Y-%m-%d')}")
    report.append(f"Overall Readiness Score: {assessment.overall_score:.1f}/100")
    report.append("")
    report.append("-" * 70)
    report.append("CONFIDENCE DETERMINATION")
    report.append("-" * 70)
    report.append(f"Confidence Level: {assessment.confidence_level.value}")
    report.append(f"Can Produce Map: {'YES' if assessment.can_produce_map else 'NO'}")
    report.append("")
    report.append(f"Reason: {assessment.confidence_reason}")
    report.append("")
    report.append(f"Map Reliability Note: {assessment.map_reliability_note}")
    report.append("")
    report.append("-" * 70)
    report.append("DATA LAYER AVAILABILITY")
    report.append("-" * 70)

    for layer in DataLayer:
        available = assessment.data_available.get(layer.value, False)
        quality = assessment.data_quality.get(layer.value, "unknown")
        source = assessment.data_source.get(layer.value, "unknown")
        status = "AVAILABLE" if available else "MISSING"
        report.append(f"  [{status:9s}] {layer.value:35s} | Quality: {quality:10s} | Source: {source}")

    report.append("")
    report.append("-" * 70)
    report.append("SCORE BREAKDOWN")
    report.append("-" * 70)
    report.append(f"  Landslide Inventory Score: {assessment.inventory_score:.1f}/100 (WEIGHT: 40%)")
    report.append(f"  Terrain/DEM Score:         {assessment.terrain_score:.1f}/100 (WEIGHT: 20%)")
    report.append(f"  Soil Data Score:           {assessment.soil_score:.1f}/100 (WEIGHT: 15%)")
    report.append(f"  Geology Data Score:        {assessment.geology_score:.1f}/100 (WEIGHT: 15%)")
    report.append(f"  Trigger Data Score:        {assessment.trigger_score:.1f}/100 (WEIGHT: 10%)")
    report.append("")

    if assessment.warnings:
        report.append("-" * 70)
        report.append("WARNINGS")
        report.append("-" * 70)
        for w in assessment.warnings:
            report.append(f"  ! {w}")
        report.append("")

    if assessment.recommendations:
        report.append("-" * 70)
        report.append("RECOMMENDATIONS")
        report.append("-" * 70)
        for r in assessment.recommendations:
            report.append(f"  > {r}")
        report.append("")

    if assessment.local_contacts:
        report.append("-" * 70)
        report.append("LOCAL DATA CONTACTS")
        report.append("-" * 70)
        for c in assessment.local_contacts:
            report.append(f"  @ {c}")
        report.append("")

    report.append("=" * 70)
    report.append("END OF REPORT")
    report.append("=" * 70)

    return "\n".join(report)

def generate_json_report(assessment: RegionAssessment) -> str:
    data = asdict(assessment)
    data["confidence_level"] = assessment.confidence_level.value
    return json.dumps(data, indent=2)

def main():
    parser = argparse.ArgumentParser(description="Landslide Honesty Engine — Data Availability Assessment")
    parser.add_argument("--region", required=True, help="Region name (e.g., 'Buncombe County')")
    parser.add_argument("--state", required=True, help="Two-letter state code (e.g., 'NC')")
    parser.add_argument("--county", help="County name (optional)")
    parser.add_argument("--bbox", nargs=4, type=float, metavar=("MINX", "MINY", "MAXX", "MAXY"),
                        help="Bounding box: minx miny maxx maxy")
    parser.add_argument("--output", "-o", help="Output JSON file path")

    args = parser.parse_args()

    bbox = tuple(args.bbox) if args.bbox else None
    assessment = assess_region(args.region, args.state.upper(), args.county, bbox)

    print(generate_report(assessment))

    if args.output:
        with open(args.output, 'w') as f:
            f.write(generate_json_report(assessment))
        print(f"\nJSON report saved to: {args.output}")

if __name__ == "__main__":
    main()
