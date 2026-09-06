#!/usr/bin/env python3
"""QGIS Processing algorithm for honesty-first 0.2% AEP flood screening.

Install this script and ``floodplain_honesty_engine.py`` in the same QGIS
Processing scripts directory. The algorithm extracts only features whose
subtype explicitly identifies a 0.2% annual-chance flood hazard. It writes an
assessment report before opening or closing the publication gate.
"""

from __future__ import annotations

import json
import os
import sys

import processing
from qgis.core import (
    QgsProcessing,
    QgsProcessingAlgorithm,
    QgsProcessingException,
    QgsProcessingParameterBoolean,
    QgsProcessingParameterEnum,
    QgsProcessingParameterFeatureSink,
    QgsProcessingParameterFeatureSource,
    QgsProcessingParameterFileDestination,
    QgsProcessingParameterString,
    QgsProcessingUtils,
)
from qgis.PyQt.QtCore import QCoreApplication

SCRIPT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIRECTORY not in sys.path:
    sys.path.insert(0, SCRIPT_DIRECTORY)

from floodplain_honesty_engine import (  # noqa: E402
    SourceType,
    assess_floodplain,
    assessment_to_dict,
    load_input,
)


def write_invalid_report(report_path, error, qgis_details):
    report = {
        "confidence_level": "INVALID_INPUT",
        "can_publish_screening_map": False,
        "regulatory_use_allowed": False,
        "required_map_label": "INVALID INPUT — PUBLICATION GATE CLOSED",
        "error": str(error),
        "qgis": qgis_details,
    }
    with open(report_path, "w", encoding="utf-8") as report_file:
        json.dump(report, report_file, indent=2, sort_keys=True)
        report_file.write("\n")


class FloodplainHonestyExtractor(QgsProcessingAlgorithm):
    FLOOD_HAZARD_ZONES = "FLOOD_HAZARD_ZONES"
    AREA_OF_INTEREST = "AREA_OF_INTEREST"
    REGION_NAME = "REGION_NAME"
    ZONE_SUBTYPE_FIELD = "ZONE_SUBTYPE_FIELD"
    SFHA_FIELD = "SFHA_FIELD"
    SOURCE_TYPE = "SOURCE_TYPE"
    SOURCE_NAME = "SOURCE_NAME"
    SOURCE_URL = "SOURCE_URL"
    SOURCE_IDENTIFIER = "SOURCE_IDENTIFIER"
    SOURCE_AUTHORITY_VERIFIED_BY = "SOURCE_AUTHORITY_VERIFIED_BY"
    COVERAGE_EVIDENCE = "COVERAGE_EVIDENCE"
    SOURCE_EFFECTIVE_DATE = "SOURCE_EFFECTIVE_DATE"
    SOURCE_RETRIEVED_DATE = "SOURCE_RETRIEVED_DATE"
    ASSESSMENT_DATE = "ASSESSMENT_DATE"
    COVERAGE_CONFIRMED = "COVERAGE_CONFIRMED"
    VERTICAL_DATUM_KNOWN = "VERTICAL_DATUM_KNOWN"
    CALIBRATION_DOCUMENTED = "CALIBRATION_DOCUMENTED"
    INDEPENDENT_REVIEW_DOCUMENTED = "INDEPENDENT_REVIEW_DOCUMENTED"
    UNCERTAINTY_DOCUMENTED = "UNCERTAINTY_DOCUMENTED"
    CHANGED_CONDITIONS_REVIEWED = "CHANGED_CONDITIONS_REVIEWED"
    CHANGED_CONDITIONS_REVIEW_DATE = "CHANGED_CONDITIONS_REVIEW_DATE"
    CHANGED_CONDITIONS_SUMMARY = "CHANGED_CONDITIONS_SUMMARY"
    OUTPUT_REPORT = "OUTPUT_REPORT"
    OUTPUT_FLOODPLAIN = "OUTPUT_FLOODPLAIN"

    SOURCE_OPTIONS = (
        SourceType.FEMA_EFFECTIVE,
        SourceType.FEMA_PRELIMINARY,
        SourceType.LOCAL_ADOPTED,
        SourceType.LOCAL_STUDY,
        SourceType.SCREENING_MODEL,
    )

    def tr(self, text):
        return QCoreApplication.translate("FloodplainHonestyExtractor", text)

    def createInstance(self):
        return FloodplainHonestyExtractor()

    def name(self):
        return "extract_0_2_percent_floodplain_honestly"

    def displayName(self):
        return self.tr("Extract 0.2% Annual-Chance Flood Area (Honesty First)")

    def group(self):
        return self.tr("Emergency Hazard Mapping")

    def groupId(self):
        return "emergency_hazard_mapping"

    def shortHelpString(self):
        return self.tr(
            """
            <h2>0.2% annual-chance flood screening</h2>
            <p>This algorithm extracts polygons whose zone subtype explicitly
            contains <b>0.2 PCT ANNUAL CHANCE FLOOD HAZARD</b>. It does not
            treat every Zone X polygon as the 0.2% boundary.</p>
            <p>The input should be FEMA's Flood Hazard Zones layer or a local
            schema-compatible copy. For FEMA's public NFHL service, this is
            layer 28. Confirm area coverage separately with FEMA's NFHL
            Availability layer or downloaded dataset metadata.</p>
            <p>The algorithm fails closed when the source, metadata, coordinate
            reference system, coverage, or review status does not support a
            screening map. The report is still written so the data gap can be
            corrected.</p>
            <p><b>Not for insurance, permitting, code compliance, elevation
            certification, or parcel-level determinations.</b></p>
            """
        )

    def initAlgorithm(self, config=None):
        self.addParameter(
            QgsProcessingParameterFeatureSource(
                self.FLOOD_HAZARD_ZONES,
                self.tr("Flood Hazard Zones polygon layer"),
                [QgsProcessing.TypeVectorPolygon],
            )
        )
        self.addParameter(
            QgsProcessingParameterFeatureSource(
                self.AREA_OF_INTEREST,
                self.tr("Area of interest polygon"),
                [QgsProcessing.TypeVectorPolygon],
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.REGION_NAME,
                self.tr("Region or operational area name"),
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.ZONE_SUBTYPE_FIELD,
                self.tr("Zone subtype field"),
                defaultValue="ZONE_SUBTY",
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.SFHA_FIELD,
                self.tr("Special Flood Hazard Area flag field (optional)"),
                defaultValue="SFHA_TF",
                optional=True,
            )
        )
        self.addParameter(
            QgsProcessingParameterEnum(
                self.SOURCE_TYPE,
                self.tr("Source authority"),
                [item.value for item in self.SOURCE_OPTIONS],
                defaultValue=0,
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.SOURCE_NAME,
                self.tr("Source name and product identifier"),
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.SOURCE_URL,
                self.tr("Source URL"),
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.SOURCE_IDENTIFIER,
                self.tr("Source product, FIRM database, study, or record identifier"),
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.SOURCE_AUTHORITY_VERIFIED_BY,
                self.tr("Person or office that verified the source authority"),
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.COVERAGE_EVIDENCE,
                self.tr("Coverage evidence identifier or archived record"),
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.SOURCE_EFFECTIVE_DATE,
                self.tr("Source effective or study date (YYYY-MM-DD)"),
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.SOURCE_RETRIEVED_DATE,
                self.tr("Source retrieval date (YYYY-MM-DD)"),
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.ASSESSMENT_DATE,
                self.tr("Assessment date (YYYY-MM-DD)"),
            )
        )
        self.addParameter(
            QgsProcessingParameterBoolean(
                self.COVERAGE_CONFIRMED,
                self.tr("Entire area is covered, verified with NFHL Availability or metadata"),
                defaultValue=False,
            )
        )
        self.addParameter(
            QgsProcessingParameterBoolean(
                self.VERTICAL_DATUM_KNOWN,
                self.tr("Vertical datum is documented where elevations are used"),
                defaultValue=False,
            )
        )
        self.addParameter(
            QgsProcessingParameterBoolean(
                self.CALIBRATION_DOCUMENTED,
                self.tr("Model calibration is documented (local studies)"),
                defaultValue=False,
            )
        )
        self.addParameter(
            QgsProcessingParameterBoolean(
                self.INDEPENDENT_REVIEW_DOCUMENTED,
                self.tr("Independent technical review is documented (local studies)"),
                defaultValue=False,
            )
        )
        self.addParameter(
            QgsProcessingParameterBoolean(
                self.UNCERTAINTY_DOCUMENTED,
                self.tr("Uncertainty is documented (local studies)"),
                defaultValue=False,
            )
        )
        self.addParameter(
            QgsProcessingParameterBoolean(
                self.CHANGED_CONDITIONS_REVIEWED,
                self.tr("Changed conditions and newer data have been reviewed"),
                defaultValue=False,
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.CHANGED_CONDITIONS_REVIEW_DATE,
                self.tr("Changed-conditions review date (YYYY-MM-DD)"),
                optional=True,
            )
        )
        self.addParameter(
            QgsProcessingParameterString(
                self.CHANGED_CONDITIONS_SUMMARY,
                self.tr("Changed-conditions review summary"),
                optional=True,
            )
        )
        self.addParameter(
            QgsProcessingParameterFileDestination(
                self.OUTPUT_REPORT,
                self.tr("Honesty assessment report"),
                fileFilter="JSON (*.json)",
            )
        )
        self.addParameter(
            QgsProcessingParameterFeatureSink(
                self.OUTPUT_FLOODPLAIN,
                self.tr("Screening floodplain output"),
                QgsProcessing.TypeVectorPolygon,
            )
        )

    def processAlgorithm(self, parameters, context, feedback):
        report_path = self.parameterAsFileOutput(parameters, self.OUTPUT_REPORT, context)
        flood_source = self.parameterAsSource(parameters, self.FLOOD_HAZARD_ZONES, context)
        aoi_source = self.parameterAsSource(parameters, self.AREA_OF_INTEREST, context)
        qgis_details = {
            "input_layer": (
                flood_source.sourceName() if flood_source is not None else None
            ),
            "input_crs": (
                flood_source.sourceCrs().authid() if flood_source is not None else None
            ),
            "area_of_interest_layer": (
                aoi_source.sourceName() if aoi_source is not None else None
            ),
            "area_of_interest_crs": (
                aoi_source.sourceCrs().authid() if aoi_source is not None else None
            ),
        }
        if flood_source is None or aoi_source is None:
            error = self.tr("Both polygon inputs are required.")
            write_invalid_report(report_path, error, qgis_details)
            raise QgsProcessingException(
                self.tr(f"{error} A closed-gate report was written to {report_path}.")
            )

        if not flood_source.sourceCrs().isValid() or not aoi_source.sourceCrs().isValid():
            error = self.tr("Both input coordinate reference systems must be valid.")
            write_invalid_report(report_path, error, qgis_details)
            raise QgsProcessingException(
                self.tr(f"{error} A closed-gate report was written to {report_path}.")
            )

        if aoi_source.featureCount() == 0:
            error = self.tr("The area-of-interest layer contains no features.")
            write_invalid_report(report_path, error, qgis_details)
            raise QgsProcessingException(
                self.tr(f"{error} A closed-gate report was written to {report_path}.")
            )

        subtype_field = self.parameterAsString(parameters, self.ZONE_SUBTYPE_FIELD, context).strip()
        sfha_field = self.parameterAsString(parameters, self.SFHA_FIELD, context).strip()
        field_names = flood_source.fields().names()
        if subtype_field not in field_names:
            error = self.tr(f"Required subtype field '{subtype_field}' is not present.")
            qgis_details["zone_subtype_field"] = subtype_field
            write_invalid_report(report_path, error, qgis_details)
            raise QgsProcessingException(
                self.tr(f"{error} A closed-gate report was written to {report_path}.")
            )

        expression = (
            f'upper("{subtype_field}") LIKE '
            "'%0.2 PCT ANNUAL CHANCE FLOOD HAZARD%'"
        )
        aoi_subset = processing.run(
            "native:extractbylocation",
            {
                "INPUT": flood_source,
                "PREDICATE": [0],
                "INTERSECT": aoi_source,
                "OUTPUT": QgsProcessing.TEMPORARY_OUTPUT,
            },
            context=context,
            feedback=feedback,
        )["OUTPUT"]
        extracted = processing.run(
            "native:extractbyexpression",
            {
                "INPUT": aoi_subset,
                "EXPRESSION": expression,
                "OUTPUT": QgsProcessing.TEMPORARY_OUTPUT,
            },
            context=context,
            feedback=feedback,
        )["OUTPUT"]
        clipped = processing.run(
            "native:clip",
            {
                "INPUT": extracted,
                "OVERLAY": aoi_source,
                "OUTPUT": QgsProcessing.TEMPORARY_OUTPUT,
            },
            context=context,
            feedback=feedback,
        )["OUTPUT"]
        clipped_layer = QgsProcessingUtils.mapLayerFromString(clipped, context)
        if clipped_layer is None:
            raise QgsProcessingException(
                self.tr("Could not inspect the temporary 0.2% annual-chance output.")
            )
        explicit_boundary_count = clipped_layer.featureCount()
        feedback.pushInfo(f"Explicit 0.2% annual-chance polygons found: {explicit_boundary_count}")

        has_sfha = False
        if sfha_field and sfha_field in field_names:
            sfha_expression = f'upper("{sfha_field}") = \'T\''
            sfha_output = processing.run(
                "native:extractbyexpression",
                {
                    "INPUT": aoi_subset,
                    "EXPRESSION": sfha_expression,
                    "OUTPUT": QgsProcessing.TEMPORARY_OUTPUT,
                },
                context=context,
                feedback=feedback,
            )["OUTPUT"]
            sfha_layer = QgsProcessingUtils.mapLayerFromString(sfha_output, context)
            has_sfha = sfha_layer is not None and sfha_layer.featureCount() > 0

        source_type = self.SOURCE_OPTIONS[
            self.parameterAsEnum(parameters, self.SOURCE_TYPE, context)
        ]
        source_name = self.parameterAsString(parameters, self.SOURCE_NAME, context).strip()
        source_url = self.parameterAsString(parameters, self.SOURCE_URL, context).strip()
        source_identifier = self.parameterAsString(
            parameters, self.SOURCE_IDENTIFIER, context
        ).strip()
        source_authority_verified_by = self.parameterAsString(
            parameters, self.SOURCE_AUTHORITY_VERIFIED_BY, context
        ).strip()
        coverage_evidence = self.parameterAsString(
            parameters, self.COVERAGE_EVIDENCE, context
        ).strip()
        source_effective_date = self.parameterAsString(
            parameters, self.SOURCE_EFFECTIVE_DATE, context
        ).strip()
        source_retrieved_date = self.parameterAsString(
            parameters, self.SOURCE_RETRIEVED_DATE, context
        ).strip()
        assessment_date = self.parameterAsString(
            parameters, self.ASSESSMENT_DATE, context
        ).strip()
        changed_conditions_review_date = self.parameterAsString(
            parameters, self.CHANGED_CONDITIONS_REVIEW_DATE, context
        ).strip()
        changed_conditions_summary = self.parameterAsString(
            parameters, self.CHANGED_CONDITIONS_SUMMARY, context
        ).strip()
        metadata_complete = all(
            [
                source_name,
                source_url,
                source_identifier,
                source_authority_verified_by,
                coverage_evidence,
                source_effective_date,
                source_retrieved_date,
                assessment_date,
            ]
        )

        input_data = {
            "region_name": self.parameterAsString(
                parameters, self.REGION_NAME, context
            ).strip(),
            "source_type": source_type.value,
            "source_name": source_name,
            "source_url": source_url,
            "source_identifier": source_identifier,
            "source_authority_verified_by": source_authority_verified_by,
            "coverage_evidence": coverage_evidence,
            "source_effective_date": source_effective_date,
            "source_retrieved_date": source_retrieved_date,
            "assessment_date": assessment_date,
            "has_0_2_percent_boundary": explicit_boundary_count > 0,
            "has_1_percent_boundary": has_sfha,
            "covers_entire_aoi": self.parameterAsBoolean(
                parameters, self.COVERAGE_CONFIRMED, context
            ),
            "metadata_complete": metadata_complete,
            "horizontal_crs_known": flood_source.sourceCrs().isValid(),
            "vertical_datum_known": self.parameterAsBoolean(
                parameters, self.VERTICAL_DATUM_KNOWN, context
            ),
            "calibration_documented": self.parameterAsBoolean(
                parameters, self.CALIBRATION_DOCUMENTED, context
            ),
            "independent_review_documented": self.parameterAsBoolean(
                parameters, self.INDEPENDENT_REVIEW_DOCUMENTED, context
            ),
            "uncertainty_documented": self.parameterAsBoolean(
                parameters, self.UNCERTAINTY_DOCUMENTED, context
            ),
            "changed_conditions_reviewed": self.parameterAsBoolean(
                parameters, self.CHANGED_CONDITIONS_REVIEWED, context
            ),
            "changed_conditions_review_date": changed_conditions_review_date,
            "changed_conditions_summary": changed_conditions_summary,
            "hazard_scope": {
                "riverine": "unknown",
                "coastal": "unknown",
                "pluvial": "excluded",
                "levee": "unknown",
                "dam_failure": "excluded",
            },
            "notes": [
                f"QGIS filter expression: {expression}",
                f"Matching source polygon count: {explicit_boundary_count}",
                "Pluvial and dam-failure flooding are excluded unless separately assessed.",
            ],
        }
        try:
            assessment = assess_floodplain(load_input(input_data))
        except ValueError as exc:
            qgis_details.update(
                {
                    "zone_subtype_field": subtype_field,
                    "filter_expression": expression,
                    "matching_feature_count": explicit_boundary_count,
                }
            )
            write_invalid_report(report_path, exc, qgis_details)
            raise QgsProcessingException(
                self.tr(
                    "Invalid assessment input. A closed-gate report was written "
                    f"to {report_path}: {exc}"
                )
            ) from exc

        report = assessment_to_dict(assessment)
        qgis_details.update(
            {
                "zone_subtype_field": subtype_field,
                "filter_expression": expression,
                "matching_feature_count": explicit_boundary_count,
            }
        )
        report["qgis"] = qgis_details
        with open(report_path, "w", encoding="utf-8") as report_file:
            json.dump(report, report_file, indent=2, sort_keys=True)
            report_file.write("\n")

        feedback.pushInfo(f"Confidence: {assessment.confidence_level.value}")
        feedback.pushInfo(f"Required map label: {assessment.required_map_label}")
        feedback.pushInfo(f"Report written: {report_path}")

        if not assessment.can_publish_screening_map:
            raise QgsProcessingException(
                self.tr(
                    "Publication gate closed. Correct the data or metadata gaps listed "
                    f"in {report_path}; no floodplain output was produced."
                )
            )

        output_destination = self.parameterAsOutputLayer(
            parameters, self.OUTPUT_FLOODPLAIN, context
        )
        provenance_fields = (
            ("MAP_LABEL", assessment.required_map_label),
            ("SRC_TYPE", source_type.value),
            ("SRC_NAME", source_name),
            ("SRC_ID", source_identifier),
            ("SRC_VRF_BY", source_authority_verified_by),
            ("COV_EVID", coverage_evidence),
            ("SRC_DATE", source_effective_date),
            ("RETR_DATE", source_retrieved_date),
            ("CONF_LVL", assessment.confidence_level.value),
            ("REG_USE", "NO"),
        )
        current_output = clipped
        for index, (field_name, field_value) in enumerate(provenance_fields):
            is_final_field = index == len(provenance_fields) - 1
            field_destination = (
                output_destination if is_final_field else QgsProcessing.TEMPORARY_OUTPUT
            )
            escaped_value = field_value.replace("'", "''")
            current_output = processing.run(
                "native:fieldcalculator",
                {
                    "INPUT": current_output,
                    "FIELD_NAME": field_name,
                    "FIELD_TYPE": 2,
                    "FIELD_LENGTH": 254,
                    "FIELD_PRECISION": 0,
                    "FORMULA": f"'{escaped_value}'",
                    "OUTPUT": field_destination,
                },
                context=context,
                feedback=feedback,
            )["OUTPUT"]

        return {
            self.OUTPUT_REPORT: report_path,
            self.OUTPUT_FLOODPLAIN: current_output,
        }
