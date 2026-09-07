#!/usr/bin/env python3
"""
Base layer constraint test. Python 3 stdlib only.

Checks that offline/index.html keeps the properties the base layer must have:

  - single self-contained file: no external scripts, stylesheets, fonts, fetches
  - no npm / module imports at runtime
  - runbook data embedded as JSON and parseable
  - offline/RUNBOOK.md mirrors every procedure, step, rollback, and impact
  - the connected-mode app reads the base layer, never the reverse

Run:  python3 test_base_layer.py
"""
import json
import re
import sys
import unittest
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent
HTML = ROOT / "offline" / "index.html"
MD = ROOT / "offline" / "RUNBOOK.md"


def embedded_runbook(html: str) -> dict:
    m = re.search(r'<script type="application/json" id="nexus-runbook">\s*(.*?)\s*</script>', html, re.S)
    if not m:
        raise AssertionError("no embedded runbook JSON block in offline/index.html")
    return json.loads(m.group(1))


class BaseLayer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = HTML.read_text(encoding="utf-8")
        cls.md = MD.read_text(encoding="utf-8")
        cls.data = embedded_runbook(cls.html)

    def test_no_external_resources(self):
        bad = re.findall(r'(?:src|href)\s*=\s*["\'](?:https?:)?//[^"\']*', self.html)
        self.assertEqual(bad, [], f"external resource references: {bad}")
        self.assertIsNone(re.search(r"<link[^>]+rel=[\"']stylesheet", self.html), "external stylesheet link present")
        self.assertIsNone(re.search(r"@import\s", self.html), "CSS @import present")

    def test_no_network_calls(self):
        for token in ("fetch(", "XMLHttpRequest", "WebSocket(", "navigator.sendBeacon", "EventSource("):
            self.assertNotIn(token, self.html, f"base layer must not call the network: {token}")

    def test_no_module_or_npm_imports(self):
        self.assertIsNone(re.search(r"<script[^>]+type=[\"']module", self.html), "module script present")
        self.assertIsNone(re.search(r"\bimport\s+[\w{*]", self.html), "ES import present")
        self.assertNotIn("require(", self.html)
        self.assertNotIn("node_modules", self.html)

    def test_no_service_worker_or_pwa(self):
        self.assertNotIn("serviceWorker", self.html)
        self.assertNotIn("manifest.json", self.html)

    def test_runbook_shape(self):
        d = self.data
        self.assertIn("revision", d)
        self.assertEqual(len(d["entries"]), 5, "five runbook procedures expected")
        for e in d["entries"]:
            for key in ("id", "title", "severity", "trigger", "steps", "rollback", "estimatedImpact"):
                self.assertIn(key, e, f"{e.get('id')} missing {key}")
            self.assertIn(e["severity"], ("critical", "high", "medium"))
            self.assertTrue(e["steps"] and e["rollback"])
            self.assertIn(e["id"], d["keywords"], f"no keywords for {e['id']}")

    def test_markdown_mirror_is_complete(self):
        for e in self.data["entries"]:
            self.assertIn(e["title"], self.md, f"{e['id']} title missing from RUNBOOK.md")
            self.assertIn(e["trigger"], self.md, f"{e['id']} trigger missing from RUNBOOK.md")
            for s in e["steps"]:
                self.assertIn(s, self.md, f"{e['id']} step missing from RUNBOOK.md: {s}")
            for r in e["rollback"]:
                self.assertIn(r, self.md, f"{e['id']} rollback missing from RUNBOOK.md: {r}")
            self.assertIn(e["estimatedImpact"], self.md, f"{e['id']} impact missing from RUNBOOK.md")
        self.assertIn(f"revision: {self.data['revision']}", self.md, "RUNBOOK.md revision does not match embedded data")

    def test_direction_of_dependency(self):
        # The app reads the base layer. The base layer never references the app.
        runbook_ts = (ROOT / "src" / "lib" / "runbook.ts").read_text(encoding="utf-8")
        self.assertIn("offline/index.html", runbook_ts, "src/lib/runbook.ts must read the base layer")
        # Runbook CONTENT may name connected-mode parts (rb-004 does). The page's own
        # markup and script must not.
        code_only = re.sub(r'<script type="application/json" id="nexus-runbook">.*?</script>', "", self.html, flags=re.S)
        for token in ("src/lib", "server/api.ts", "/api/v1", "localhost:3", "@/"):
            self.assertNotIn(token, code_only, f"base layer references the connected app: {token}")

    def test_enhancement_only_marked_at_point_of_use(self):
        # Every connected-mode function the README claims must be marked in the UI, not just in docs.
        self.assertGreaterEqual(self.html.count("enhancement only"), 2)
        for label in ("Global Kill Switch", "Enable Safe Mode", "Flush Global Cache", "Reroute Traffic (BGP)"):
            self.assertIn(label, self.html, f"intervention trigger not represented: {label}")
        for claim in ("TRDAP", "Orbital", "ICS", "Agent protocol", "AI analysis"):
            self.assertIn(claim, self.html, f"connected-mode claim not marked in base layer: {claim}")


if __name__ == "__main__":
    sys.exit(0 if unittest.main(argv=[sys.argv[0]], verbosity=1, exit=False).result.wasSuccessful() else 1)
