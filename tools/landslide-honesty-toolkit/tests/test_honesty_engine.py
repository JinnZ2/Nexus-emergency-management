import json
import sys
import unittest
from pathlib import Path

TOOLKIT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLKIT_DIR))

from landslide_honesty_engine import (  # noqa: E402
    ConfidenceLevel,
    assess_region,
    generate_json_report,
    generate_report,
)


class HonestyEngineTests(unittest.TestCase):
    def test_extensive_inventory_region_is_validated(self):
        assessment = assess_region("Buncombe County", " nc ")

        self.assertEqual(assessment.state_fips, "NC")
        self.assertEqual(assessment.confidence_level, ConfidenceLevel.VALIDATED_HIGH)
        self.assertTrue(assessment.can_produce_map)
        self.assertGreaterEqual(assessment.inventory_score, 70)

    def test_unknown_state_inventory_fails_closed(self):
        assessment = assess_region("Example County", "TX")

        self.assertEqual(assessment.confidence_level, ConfidenceLevel.UNVALIDATED_NONE)
        self.assertFalse(assessment.can_produce_map)
        self.assertTrue(any("UNVALIDATED" in warning for warning in assessment.warnings))

    def test_reports_preserve_confidence_and_bbox(self):
        bbox = (-82.8, 35.4, -82.2, 35.8)
        assessment = assess_region("Buncombe County", "NC", bbox=bbox)

        text_report = generate_report(assessment)
        json_report = json.loads(generate_json_report(assessment))

        self.assertIn("VALIDATED_HIGH", text_report)
        self.assertEqual(json_report["confidence_level"], "VALIDATED_HIGH")
        self.assertEqual(tuple(json_report["bbox"]), bbox)


if __name__ == "__main__":
    unittest.main()
