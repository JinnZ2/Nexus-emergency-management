import json
import sys
import unittest
from pathlib import Path

TOOLKIT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLKIT_DIR))

from floodplain_honesty_engine import (  # noqa: E402
    ConfidenceLevel,
    SourceType,
    assess_floodplain,
    cumulative_probability_percent,
    generate_json_report,
    generate_text_report,
    load_input,
)


def complete_input(**overrides):
    data = {
        "region_name": "Example County",
        "source_type": "FEMA_EFFECTIVE",
        "source_name": "Effective NFHL",
        "source_url": "https://hazards.fema.gov/example-source",
        "source_identifier": "TEST-NFHL-001",
        "source_authority_verified_by": "Test GIS reviewer",
        "coverage_evidence": "Test NFHL Availability record",
        "source_effective_date": "2025-01-01",
        "source_retrieved_date": "2026-09-06",
        "assessment_date": "2026-09-06",
        "has_0_2_percent_boundary": True,
        "has_1_percent_boundary": True,
        "covers_entire_aoi": True,
        "metadata_complete": True,
        "horizontal_crs_known": True,
        "vertical_datum_known": True,
        "calibration_documented": True,
        "independent_review_documented": True,
        "uncertainty_documented": True,
        "changed_conditions_reviewed": True,
        "changed_conditions_review_date": "2026-09-06",
        "changed_conditions_summary": "Reviewed for test purposes.",
        "hazard_scope": {
            "riverine": "included",
            "coastal": "not_applicable",
            "pluvial": "excluded",
            "levee": "unknown",
            "dam_failure": "excluded",
        },
    }
    data.update(overrides)
    return data


class FloodplainHonestyEngineTests(unittest.TestCase):
    def test_annual_probability_is_not_recurrence_schedule(self):
        probability = cumulative_probability_percent(0.002, 30)
        self.assertAlmostEqual(probability, 5.83, places=2)

    def test_effective_complete_source_opens_screening_gate(self):
        assessment = assess_floodplain(load_input(complete_input()))
        self.assertEqual(assessment.source_type, SourceType.FEMA_EFFECTIVE)
        self.assertEqual(
            assessment.confidence_level,
            ConfidenceLevel.EFFECTIVE_FEMA_SCREENING,
        )
        self.assertTrue(assessment.can_publish_screening_map)
        self.assertFalse(assessment.regulatory_use_allowed)
        self.assertIn("OPERATOR-VERIFIED", assessment.required_map_label)
        self.assertEqual(
            assessment.source_metadata["authority_verification"],
            "OPERATOR_DOCUMENTED_NOT_INDEPENDENTLY_AUTHENTICATED",
        )

    def test_no_intersection_in_verified_fema_coverage_is_not_no_risk(self):
        assessment = assess_floodplain(
            load_input(complete_input(has_0_2_percent_boundary=False))
        )
        self.assertEqual(
            assessment.confidence_level,
            ConfidenceLevel.NO_INTERSECTION_IN_VERIFIED_COVERAGE,
        )
        self.assertFalse(assessment.can_publish_screening_map)
        self.assertIn("NOT A NO-RISK", assessment.required_map_label)

    def test_unreviewed_screening_model_fails_closed(self):
        assessment = assess_floodplain(
            load_input(
                complete_input(
                    source_type="SCREENING_MODEL",
                    source_name="Internal terrain model",
                )
            )
        )
        self.assertEqual(
            assessment.confidence_level,
            ConfidenceLevel.UNVALIDATED_MODEL,
        )
        self.assertFalse(assessment.can_publish_screening_map)

    def test_preliminary_fema_source_is_labeled_nonregulatory(self):
        assessment = assess_floodplain(
            load_input(complete_input(source_type="FEMA_PRELIMINARY"))
        )
        self.assertEqual(
            assessment.confidence_level,
            ConfidenceLevel.PRELIMINARY_NONREGULATORY,
        )
        self.assertTrue(assessment.can_publish_screening_map)
        self.assertIn("PRELIMINARY", assessment.required_map_label)
        self.assertFalse(assessment.regulatory_use_allowed)

    def test_reviewed_local_study_is_documented_but_nonregulatory(self):
        assessment = assess_floodplain(
            load_input(
                complete_input(
                    source_type="LOCAL_STUDY",
                    source_url="https://example.gov/local-study",
                )
            )
        )
        self.assertEqual(
            assessment.confidence_level,
            ConfidenceLevel.DOCUMENTED_NONREGULATORY,
        )
        self.assertTrue(assessment.can_publish_screening_map)
        self.assertFalse(assessment.regulatory_use_allowed)

    def test_partial_coverage_requires_no_data_mask_and_closes_gate(self):
        assessment = assess_floodplain(
            load_input(complete_input(covers_entire_aoi=False))
        )
        self.assertEqual(
            assessment.confidence_level,
            ConfidenceLevel.EFFECTIVE_FEMA_PARTIAL,
        )
        self.assertTrue(assessment.requires_data_gap_mask)
        self.assertFalse(assessment.can_publish_screening_map)
        self.assertTrue(any("NO DATA" in item for item in assessment.warnings))

    def test_incomplete_metadata_closes_effective_source_gate(self):
        assessment = assess_floodplain(
            load_input(complete_input(metadata_complete=False))
        )
        self.assertEqual(
            assessment.confidence_level,
            ConfidenceLevel.EFFECTIVE_FEMA_SCREENING,
        )
        self.assertFalse(assessment.can_publish_screening_map)
        self.assertIn("METADATA INCOMPLETE", assessment.required_map_label)

    def test_changed_conditions_review_is_required_to_publish(self):
        assessment = assess_floodplain(
            load_input(
                complete_input(
                    changed_conditions_reviewed=False,
                    changed_conditions_review_date=None,
                    changed_conditions_summary="",
                )
            )
        )
        self.assertFalse(assessment.can_publish_screening_map)
        self.assertIn(
            "CHANGED CONDITIONS NOT REVIEWED",
            assessment.required_map_label,
        )

    def test_changed_conditions_review_requires_evidence(self):
        with self.assertRaisesRegex(ValueError, "changed_conditions_reviewed"):
            load_input(complete_input(changed_conditions_review_date=None))

    def test_json_report_serializes_enums_probability_and_provenance(self):
        assessment = assess_floodplain(load_input(complete_input()))
        report = json.loads(generate_json_report(assessment))
        self.assertEqual(report["source_type"], "FEMA_EFFECTIVE")
        self.assertEqual(
            report["confidence_level"],
            "EFFECTIVE_FEMA_SCREENING",
        )
        self.assertAlmostEqual(
            report["thirty_year_probability_percent"],
            5.83,
            places=2,
        )
        self.assertEqual(report["source_metadata"]["identifier"], "TEST-NFHL-001")

    def test_every_text_report_warns_that_future_conditions_may_differ(self):
        assessment = assess_floodplain(load_input(complete_input()))
        report = generate_text_report(assessment)
        self.assertIn("Future conditions may differ", report)
        self.assertIn("Source Identifier: TEST-NFHL-001", report)
        self.assertIn("Changed-Conditions Summary: Reviewed for test purposes.", report)

    def test_missing_source_name_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "source_name"):
            load_input(complete_input(source_name=""))

    def test_invalid_hazard_scope_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "hazard_scope.riverine"):
            load_input(complete_input(hazard_scope={"riverine": "sometimes"}))

    def test_complete_metadata_claim_requires_provenance(self):
        with self.assertRaisesRegex(ValueError, "metadata_complete"):
            load_input(complete_input(source_identifier=""))

    def test_fema_source_type_requires_fema_domain(self):
        with self.assertRaisesRegex(ValueError, "FEMA source types"):
            load_input(complete_input(source_url="https://example.gov/source"))

    def test_boolean_strings_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "covers_entire_aoi"):
            load_input(complete_input(covers_entire_aoi="false"))

    def test_non_iso_dates_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "source_effective_date"):
            load_input(complete_input(source_effective_date="January 1, 2025"))

    def test_non_object_top_level_input_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "JSON object"):
            load_input([])


if __name__ == "__main__":
    unittest.main()
