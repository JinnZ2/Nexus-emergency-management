#!/usr/bin/env python3
"""Honesty-first assessment for 0.2% annual-chance floodplain screening.

The colloquial "500-year flood" is a flood with a 0.2% chance of being equaled
or exceeded in any given year. This module evaluates whether a proposed map has
sufficient source authority, coverage, metadata, and review for publication as
a screening product. It never makes parcel-level, insurance, permitting, or
regulatory determinations.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass, field
from datetime import date
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse


class SourceType(str, Enum):
    FEMA_EFFECTIVE = "FEMA_EFFECTIVE"
    FEMA_PRELIMINARY = "FEMA_PRELIMINARY"
    LOCAL_ADOPTED = "LOCAL_ADOPTED"
    LOCAL_STUDY = "LOCAL_STUDY"
    SCREENING_MODEL = "SCREENING_MODEL"
    NONE = "NONE"


class ConfidenceLevel(str, Enum):
    EFFECTIVE_FEMA_SCREENING = "EFFECTIVE_FEMA_SCREENING"
    EFFECTIVE_FEMA_PARTIAL = "EFFECTIVE_FEMA_PARTIAL"
    NO_INTERSECTION_IN_VERIFIED_COVERAGE = "NO_INTERSECTION_IN_VERIFIED_COVERAGE"
    PRELIMINARY_NONREGULATORY = "PRELIMINARY_NONREGULATORY"
    DOCUMENTED_NONREGULATORY = "DOCUMENTED_NONREGULATORY"
    UNVALIDATED_MODEL = "UNVALIDATED_MODEL"
    DATA_GAP = "DATA_GAP"


HAZARD_SCOPE_KEYS = (
    "riverine",
    "coastal",
    "pluvial",
    "levee",
    "dam_failure",
)
HAZARD_SCOPE_VALUES = {"included", "excluded", "not_applicable", "unknown"}
SOURCE_AUTHORITY_POINTS = {
    SourceType.FEMA_EFFECTIVE: 25.0,
    SourceType.FEMA_PRELIMINARY: 22.0,
    SourceType.LOCAL_ADOPTED: 20.0,
    SourceType.LOCAL_STUDY: 15.0,
    SourceType.SCREENING_MODEL: 5.0,
    SourceType.NONE: 0.0,
}


@dataclass
class FloodplainInput:
    region_name: str
    source_type: SourceType
    source_name: str = ""
    source_url: str = ""
    source_identifier: str = ""
    source_authority_verified_by: str = ""
    coverage_evidence: str = ""
    source_effective_date: Optional[str] = None
    source_retrieved_date: Optional[str] = None
    assessment_date: Optional[str] = None
    has_0_2_percent_boundary: bool = False
    has_1_percent_boundary: bool = False
    covers_entire_aoi: bool = False
    metadata_complete: bool = False
    horizontal_crs_known: bool = False
    vertical_datum_known: bool = False
    calibration_documented: bool = False
    independent_review_documented: bool = False
    uncertainty_documented: bool = False
    changed_conditions_reviewed: bool = False
    changed_conditions_review_date: Optional[str] = None
    changed_conditions_summary: str = ""
    hazard_scope: Dict[str, str] = field(default_factory=dict)
    notes: List[str] = field(default_factory=list)


@dataclass
class FloodplainAssessment:
    region_name: str
    source_type: SourceType
    confidence_level: ConfidenceLevel
    readiness_score: float
    can_publish_screening_map: bool
    regulatory_use_allowed: bool
    requires_data_gap_mask: bool
    required_map_label: str
    interpretation: str
    annual_exceedance_probability_percent: float = 0.2
    thirty_year_probability_percent: float = 0.0
    score_breakdown: Dict[str, float] = field(default_factory=dict)
    hazard_scope: Dict[str, str] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    source_metadata: Dict[str, Any] = field(default_factory=dict)
    notes: List[str] = field(default_factory=list)


def cumulative_probability_percent(annual_probability: float, years: int) -> float:
    """Return the chance of one or more exceedances over ``years``.

    The calculation assumes a constant annual probability and independent years.
    Those assumptions are disclosed because real flood processes may be
    nonstationary or correlated.
    """
    if not 0.0 <= annual_probability <= 1.0:
        raise ValueError("annual_probability must be between 0 and 1")
    if years < 0:
        raise ValueError("years must be non-negative")
    return (1.0 - (1.0 - annual_probability) ** years) * 100.0


def _coerce_source_type(value: Any) -> SourceType:
    if isinstance(value, SourceType):
        return value
    try:
        return SourceType(str(value).strip().upper())
    except ValueError as exc:
        allowed = ", ".join(item.value for item in SourceType)
        raise ValueError(f"source_type must be one of: {allowed}") from exc


def _boolean_field(data: Dict[str, Any], name: str) -> bool:
    value = data.get(name, False)
    if not isinstance(value, bool):
        raise ValueError(f"{name} must be true or false")
    return value


def _date_field(data: Dict[str, Any], name: str) -> Optional[str]:
    value = data.get(name)
    if value in (None, ""):
        return None
    normalized = str(value).strip()
    try:
        date.fromisoformat(normalized)
    except ValueError as exc:
        raise ValueError(f"{name} must use YYYY-MM-DD format") from exc
    return normalized


def load_input(data: Dict[str, Any]) -> FloodplainInput:
    """Validate and normalize a JSON-compatible assessment input."""
    if not isinstance(data, dict):
        raise ValueError("input must be a JSON object")

    region_name = str(data.get("region_name", "")).strip()
    if not region_name:
        raise ValueError("region_name is required")

    source_type = _coerce_source_type(data.get("source_type", SourceType.NONE))
    source_name = str(data.get("source_name", "")).strip()
    if source_type is not SourceType.NONE and not source_name:
        raise ValueError("source_name is required when source_type is not NONE")

    source_url = str(data.get("source_url", "")).strip()
    if source_type in {SourceType.FEMA_EFFECTIVE, SourceType.FEMA_PRELIMINARY}:
        parsed_url = urlparse(source_url)
        hostname = (parsed_url.hostname or "").lower()
        if parsed_url.scheme != "https" or not (
            hostname == "fema.gov" or hostname.endswith(".fema.gov")
        ):
            raise ValueError(
                "FEMA source types require an https URL on fema.gov or a fema.gov subdomain"
            )

    metadata_complete = _boolean_field(data, "metadata_complete")
    if metadata_complete:
        metadata_fields = (
            "source_url",
            "source_identifier",
            "source_authority_verified_by",
            "coverage_evidence",
            "source_effective_date",
            "source_retrieved_date",
            "assessment_date",
        )
        missing_metadata = [name for name in metadata_fields if not data.get(name)]
        if missing_metadata:
            raise ValueError(
                "metadata_complete cannot be true while fields are missing: "
                + ", ".join(missing_metadata)
            )

    raw_scope = data.get("hazard_scope") or {}
    if not isinstance(raw_scope, dict):
        raise ValueError("hazard_scope must be an object")

    hazard_scope: Dict[str, str] = {}
    for key in HAZARD_SCOPE_KEYS:
        value = str(raw_scope.get(key, "unknown")).strip().lower()
        if value not in HAZARD_SCOPE_VALUES:
            allowed = ", ".join(sorted(HAZARD_SCOPE_VALUES))
            raise ValueError(f"hazard_scope.{key} must be one of: {allowed}")
        hazard_scope[key] = value

    raw_notes = data.get("notes") or []
    if not isinstance(raw_notes, list):
        raise ValueError("notes must be an array of strings")

    source_effective_date = _date_field(data, "source_effective_date")
    source_retrieved_date = _date_field(data, "source_retrieved_date")
    assessment_date = _date_field(data, "assessment_date")
    changed_conditions_review_date = _date_field(
        data, "changed_conditions_review_date"
    )
    changed_conditions_reviewed = _boolean_field(
        data, "changed_conditions_reviewed"
    )
    changed_conditions_summary = str(
        data.get("changed_conditions_summary", "")
    ).strip()
    if changed_conditions_reviewed and (
        not changed_conditions_review_date or not changed_conditions_summary
    ):
        raise ValueError(
            "changed_conditions_reviewed requires changed_conditions_review_date "
            "and changed_conditions_summary"
        )

    return FloodplainInput(
        region_name=region_name,
        source_type=source_type,
        source_name=source_name,
        source_url=source_url,
        source_identifier=str(data.get("source_identifier", "")).strip(),
        source_authority_verified_by=str(
            data.get("source_authority_verified_by", "")
        ).strip(),
        coverage_evidence=str(data.get("coverage_evidence", "")).strip(),
        source_effective_date=source_effective_date,
        source_retrieved_date=source_retrieved_date,
        assessment_date=assessment_date,
        has_0_2_percent_boundary=_boolean_field(data, "has_0_2_percent_boundary"),
        has_1_percent_boundary=_boolean_field(data, "has_1_percent_boundary"),
        covers_entire_aoi=_boolean_field(data, "covers_entire_aoi"),
        metadata_complete=metadata_complete,
        horizontal_crs_known=_boolean_field(data, "horizontal_crs_known"),
        vertical_datum_known=_boolean_field(data, "vertical_datum_known"),
        calibration_documented=_boolean_field(data, "calibration_documented"),
        independent_review_documented=_boolean_field(data, "independent_review_documented"),
        uncertainty_documented=_boolean_field(data, "uncertainty_documented"),
        changed_conditions_reviewed=changed_conditions_reviewed,
        changed_conditions_review_date=changed_conditions_review_date,
        changed_conditions_summary=changed_conditions_summary,
        hazard_scope=hazard_scope,
        notes=[str(note) for note in raw_notes],
    )


def _score(inputs: FloodplainInput) -> Dict[str, float]:
    metadata_points = (
        (5.0 if inputs.metadata_complete else 0.0)
        + (5.0 if inputs.horizontal_crs_known else 0.0)
        + (5.0 if inputs.vertical_datum_known else 0.0)
    )
    review_points = (
        (5.0 if inputs.calibration_documented else 0.0)
        + (5.0 if inputs.independent_review_documented else 0.0)
        + (5.0 if inputs.uncertainty_documented else 0.0)
    )
    return {
        "source_authority": SOURCE_AUTHORITY_POINTS[inputs.source_type],
        "explicit_0_2_percent_boundary": 20.0 if inputs.has_0_2_percent_boundary else 0.0,
        "area_of_interest_coverage": 15.0 if inputs.covers_entire_aoi else 0.0,
        "spatial_and_source_metadata": metadata_points,
        "calibration_review_and_uncertainty": review_points,
        "changed_conditions_review": 10.0 if inputs.changed_conditions_reviewed else 0.0,
    }


def assess_floodplain(inputs: FloodplainInput) -> FloodplainAssessment:
    """Assess whether a 0.2% annual-chance screening map can be published."""
    score_breakdown = _score(inputs)
    readiness_score = sum(score_breakdown.values())
    warnings: List[str] = [
        "The term '500-year flood' does not mean one flood every 500 years; it means a 0.2% chance of exceedance in each year.",
        "This toolkit cannot determine insurance requirements, permits, code compliance, or parcel-level flood status.",
        "Mapped boundaries do not guarantee safety outside the line and do not replace an elevation certificate or site-specific study.",
        "Source authority and coverage evidence are operator-documented inputs; this toolkit does not authenticate FEMA or local records.",
        "Future conditions may differ even after a changed-conditions review; repeat the review before reuse.",
    ]
    recommendations: List[str] = [
        "Confirm the effective Flood Insurance Rate Map and Flood Insurance Study with the local floodplain administrator.",
        "Preserve source dates, coordinate reference system, vertical datum, and official metadata with every exported map.",
    ]

    requires_gap_mask = not inputs.covers_entire_aoi
    if requires_gap_mask:
        warnings.append("Coverage is incomplete. Every uncovered area must be rendered as NO DATA, not low risk.")
        recommendations.append("Add a conspicuous data-gap mask and list every uncovered jurisdiction or watershed.")

    if not inputs.changed_conditions_reviewed:
        warnings.append("Changed conditions were not reviewed; development, drainage works, wildfire, erosion, levees, dams, and newer terrain may alter flooding.")

    for hazard_type, status in inputs.hazard_scope.items():
        if status == "excluded":
            warnings.append(f"{hazard_type.replace('_', ' ').title()} flooding is explicitly excluded from this assessment.")
        elif status == "unknown":
            warnings.append(f"Coverage of {hazard_type.replace('_', ' ')} flooding is unknown.")

    if inputs.source_type is SourceType.NONE:
        confidence = ConfidenceLevel.DATA_GAP
        can_publish = False
        label = "NO 0.2% AEP MAP — INSUFFICIENT OR UNVERIFIED DATA"
        interpretation = "No traceable source is available for a 0.2% annual-chance screening assessment."
        recommendations.append("Obtain effective FEMA data or commission a documented hydrologic and hydraulic study.")
    elif (
        not inputs.has_0_2_percent_boundary
        and inputs.source_type is SourceType.FEMA_EFFECTIVE
        and inputs.covers_entire_aoi
    ):
        confidence = ConfidenceLevel.NO_INTERSECTION_IN_VERIFIED_COVERAGE
        can_publish = False
        label = "NO EXPLICIT 0.2% AEP POLYGON INTERSECTS THE AOI — NOT A NO-RISK DETERMINATION"
        interpretation = (
            "Operator-documented effective FEMA coverage contains no explicit "
            "0.2% annual-chance polygon intersecting the area of interest."
        )
        recommendations.append(
            "Preserve this report as a no-intersection result and check other flood mechanisms and changed conditions."
        )
    elif not inputs.has_0_2_percent_boundary:
        confidence = ConfidenceLevel.DATA_GAP
        can_publish = False
        label = "NO 0.2% AEP MAP — INSUFFICIENT OR UNVERIFIED DATA"
        interpretation = "No explicit, traceable 0.2% annual-chance boundary is available for publication."
        recommendations.append("Obtain effective FEMA data or commission a documented hydrologic and hydraulic study.")
    elif inputs.source_type is SourceType.FEMA_EFFECTIVE:
        if inputs.covers_entire_aoi:
            confidence = ConfidenceLevel.EFFECTIVE_FEMA_SCREENING
            label = "OPERATOR-VERIFIED EFFECTIVE FEMA SOURCE — 0.2% AEP SCREENING ONLY"
            interpretation = "The operator documented an effective FEMA source with an explicit 0.2% annual-chance boundary."
        else:
            confidence = ConfidenceLevel.EFFECTIVE_FEMA_PARTIAL
            label = "PARTIAL FEMA 0.2% AEP COVERAGE — NO DATA IS NOT NO RISK"
            interpretation = "Effective FEMA mapping is present for only part of the area of interest."
        can_publish = True
    elif inputs.source_type is SourceType.FEMA_PRELIMINARY:
        confidence = ConfidenceLevel.PRELIMINARY_NONREGULATORY
        can_publish = True
        label = "PRELIMINARY FEMA 0.2% AEP DATA — NOT THE EFFECTIVE REGULATORY MAP"
        interpretation = "Preliminary FEMA data may support planning but must not be presented as the effective map."
        warnings.append("Preliminary FEMA data are non-effective and may change before adoption.")
    elif inputs.source_type in {SourceType.LOCAL_ADOPTED, SourceType.LOCAL_STUDY}:
        sufficient_review = (
            inputs.calibration_documented
            and inputs.independent_review_documented
            and inputs.uncertainty_documented
        )
        if sufficient_review:
            confidence = ConfidenceLevel.DOCUMENTED_NONREGULATORY
            can_publish = True
            label = "DOCUMENTED LOCAL 0.2% AEP STUDY — VERIFY ADOPTION AND REGULATORY STATUS"
            interpretation = "A documented local study supports screening, but this toolkit cannot determine its legal status."
        else:
            confidence = ConfidenceLevel.UNVALIDATED_MODEL
            can_publish = False
            label = "UNVALIDATED 0.2% AEP MODEL — AWARENESS ONLY; PUBLICATION GATE CLOSED"
            interpretation = "The local study lacks documented calibration, independent review, or uncertainty analysis."
            recommendations.append("Document calibration, independent technical review, and uncertainty before publishing a screening boundary.")
    else:
        confidence = ConfidenceLevel.UNVALIDATED_MODEL
        can_publish = False
        label = "UNVALIDATED 0.2% AEP MODEL — AWARENESS ONLY; PUBLICATION GATE CLOSED"
        interpretation = "A screening model is not an official floodplain and is blocked from publication by default."
        recommendations.append("Use the model only for internal scoping until qualified review and uncertainty documentation are complete.")

    if inputs.has_1_percent_boundary:
        recommendations.append("Show the 1% annual-chance Special Flood Hazard Area separately; do not confuse it with the 0.2% annual-chance extent.")

    if confidence is not ConfidenceLevel.EFFECTIVE_FEMA_SCREENING:
        warnings.append("The result is not a substitute for the current effective FEMA map.")

    if can_publish and requires_gap_mask:
        can_publish = False
        label += " — COVERAGE INCOMPLETE; PUBLICATION GATE CLOSED"
        warnings.append("The included workflow cannot prove or render a complete no-data mask, so partial coverage cannot be published.")
        recommendations.append("Limit the area of interest to verified coverage or implement and independently review a complete no-data mask workflow.")

    if can_publish and not inputs.metadata_complete:
        can_publish = False
        label += " — SOURCE METADATA INCOMPLETE; PUBLICATION GATE CLOSED"
        warnings.append("Source metadata is incomplete, so the screening-map publication gate is closed.")
        recommendations.append("Record the source URL, source effective date, retrieval date, and assessment date.")

    if can_publish and not inputs.horizontal_crs_known:
        can_publish = False
        label += " — CRS UNVERIFIED; PUBLICATION GATE CLOSED"
        warnings.append("The horizontal coordinate reference system is not verified, so the publication gate is closed.")
        recommendations.append("Verify the horizontal coordinate reference system before spatial overlay or export.")

    if can_publish and not inputs.changed_conditions_reviewed:
        can_publish = False
        label += " — CHANGED CONDITIONS NOT REVIEWED; PUBLICATION GATE CLOSED"
        warnings.append("Changed conditions were not reviewed, so the screening-map publication gate is closed.")
        recommendations.append("Complete and document a changed-conditions review before publication.")

    return FloodplainAssessment(
        region_name=inputs.region_name,
        source_type=inputs.source_type,
        confidence_level=confidence,
        readiness_score=readiness_score,
        can_publish_screening_map=can_publish,
        regulatory_use_allowed=False,
        requires_data_gap_mask=requires_gap_mask,
        required_map_label=label,
        interpretation=interpretation,
        thirty_year_probability_percent=cumulative_probability_percent(0.002, 30),
        score_breakdown=score_breakdown,
        hazard_scope=inputs.hazard_scope,
        warnings=warnings,
        recommendations=recommendations,
        source_metadata={
            "name": inputs.source_name,
            "url": inputs.source_url,
            "identifier": inputs.source_identifier,
            "authority_verified_by": inputs.source_authority_verified_by,
            "authority_verification": "OPERATOR_DOCUMENTED_NOT_INDEPENDENTLY_AUTHENTICATED",
            "coverage_evidence": inputs.coverage_evidence,
            "effective_date": inputs.source_effective_date,
            "retrieved_date": inputs.source_retrieved_date,
            "assessment_date": inputs.assessment_date,
            "metadata_complete": inputs.metadata_complete,
            "horizontal_crs_known": inputs.horizontal_crs_known,
            "vertical_datum_known": inputs.vertical_datum_known,
            "changed_conditions_reviewed": inputs.changed_conditions_reviewed,
            "changed_conditions_review_date": inputs.changed_conditions_review_date,
            "changed_conditions_summary": inputs.changed_conditions_summary,
        },
        notes=inputs.notes,
    )


def assessment_to_dict(assessment: FloodplainAssessment) -> Dict[str, Any]:
    data = asdict(assessment)
    data["source_type"] = assessment.source_type.value
    data["confidence_level"] = assessment.confidence_level.value
    return data


def generate_json_report(assessment: FloodplainAssessment) -> str:
    return json.dumps(assessment_to_dict(assessment), indent=2, sort_keys=True)


def generate_text_report(assessment: FloodplainAssessment) -> str:
    metadata = assessment.source_metadata
    lines = [
        "=" * 78,
        "0.2% ANNUAL-CHANCE ('500-YEAR') FLOODPLAIN HONESTY REPORT",
        "=" * 78,
        f"Region: {assessment.region_name}",
        f"Source Type: {assessment.source_type.value}",
        f"Confidence: {assessment.confidence_level.value}",
        f"Readiness Score: {assessment.readiness_score:.1f}/100",
        f"Screening Map Publication Gate: {'OPEN' if assessment.can_publish_screening_map else 'CLOSED'}",
        "Regulatory Use Allowed by This Toolkit: NO",
        "",
        f"REQUIRED MAP LABEL: {assessment.required_map_label}",
        "",
        assessment.interpretation,
        "",
        "OPERATOR-DOCUMENTED SOURCE AND REVIEW METADATA",
        "-" * 78,
        f"Source Name: {metadata.get('name') or 'NOT PROVIDED'}",
        f"Source Identifier: {metadata.get('identifier') or 'NOT PROVIDED'}",
        f"Source URL: {metadata.get('url') or 'NOT PROVIDED'}",
        f"Source Effective/Study Date: {metadata.get('effective_date') or 'NOT PROVIDED'}",
        f"Source Retrieved Date: {metadata.get('retrieved_date') or 'NOT PROVIDED'}",
        f"Assessment Date: {metadata.get('assessment_date') or 'NOT PROVIDED'}",
        f"Authority Verified By: {metadata.get('authority_verified_by') or 'NOT PROVIDED'}",
        f"Authority Verification Status: {metadata.get('authority_verification')}",
        f"Coverage Evidence: {metadata.get('coverage_evidence') or 'NOT PROVIDED'}",
        f"Horizontal CRS Known: {'YES' if metadata.get('horizontal_crs_known') else 'NO'}",
        f"Vertical Datum Known: {'YES' if metadata.get('vertical_datum_known') else 'NO'}",
        f"Changed Conditions Reviewed: {'YES' if metadata.get('changed_conditions_reviewed') else 'NO'}",
        f"Changed-Conditions Review Date: {metadata.get('changed_conditions_review_date') or 'NOT PROVIDED'}",
        f"Changed-Conditions Summary: {metadata.get('changed_conditions_summary') or 'NOT PROVIDED'}",
        "",
        "PROBABILITY CONTEXT",
        "-" * 78,
        "Annual exceedance probability: 0.2% in each year",
        f"Illustrative 30-year probability: {assessment.thirty_year_probability_percent:.2f}%",
        "Assumption: constant annual probability and independent years; actual conditions may change.",
        "",
        "SCORE BREAKDOWN",
        "-" * 78,
    ]
    for name, score in assessment.score_breakdown.items():
        lines.append(f"{name.replace('_', ' ').title():43s} {score:5.1f}")

    lines.extend(["", "HAZARD SCOPE", "-" * 78])
    for name, status in assessment.hazard_scope.items():
        lines.append(f"{name.replace('_', ' ').title():43s} {status.upper()}")

    lines.extend(["", "WARNINGS", "-" * 78])
    lines.extend(f"! {warning}" for warning in assessment.warnings)
    lines.extend(["", "RECOMMENDATIONS", "-" * 78])
    lines.extend(f"> {recommendation}" for recommendation in assessment.recommendations)

    if assessment.notes:
        lines.extend(["", "NOTES", "-" * 78])
        lines.extend(f"- {note}" for note in assessment.notes)

    lines.extend(["", "=" * 78, "END OF REPORT", "=" * 78])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Assess the publication readiness of a 0.2% annual-chance floodplain map."
    )
    parser.add_argument("--input", required=True, help="Path to an assessment input JSON file")
    parser.add_argument("--json-output", help="Optional JSON report output path")
    parser.add_argument("--text-output", help="Optional text report output path")
    args = parser.parse_args()

    input_path = Path(args.input)
    try:
        raw_data = json.loads(input_path.read_text(encoding="utf-8"))
        assessment = assess_floodplain(load_input(raw_data))
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        parser.error(str(exc))

    text_report = generate_text_report(assessment)
    print(text_report)

    if args.json_output:
        Path(args.json_output).write_text(generate_json_report(assessment) + "\n", encoding="utf-8")
    if args.text_output:
        Path(args.text_output).write_text(text_report + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
