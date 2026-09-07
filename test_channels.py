#!/usr/bin/env python3
"""
Channel redundancy test. Python 3 stdlib only.

Mirrors the table in channels.md. For every failure mode, computes which
channels survive and asserts that at least one does. Prints the surviving
set per mode so the result is visible, not just a pass/fail bit.

If a mode has an empty surviving set, that is the finding. Do not silence it.

Run:  python3 test_channels.py
"""
import sys
import unittest
from typing import Optional

CHANNELS = ["gemini_api", "claude_api", "openai_api", "offline_base"]
API_PROVIDERS = ["gemini_api", "claude_api", "openai_api"]

MODES = ["no_power", "no_local_net", "no_backhaul", "provider_down", "account_key", "rate_limit"]

# Shared-cause modes: every API provider fails from the same cause at the same instant.
SHARED_CAUSE_MODES = {"no_power", "no_local_net", "no_backhaul"}

# Per-vendor modes: exactly one named provider is the one hit. The table is
# evaluated once per possible victim and the worst case is reported.
PER_VENDOR_MODES = {"provider_down", "account_key", "rate_limit"}


def survives(channel: str, mode: str, victim: Optional[str] = None) -> bool:
    """Return True if `channel` keeps working under `mode`.

    `victim` names the provider hit by a per-vendor mode; ignored otherwise.
    """
    if channel == "offline_base":
        # A file on local storage. Needs the operator's device and nothing else.
        return True
    if mode in SHARED_CAUSE_MODES:
        # All API channels sit behind one connectivity path: device -> local net
        # -> server host (site power) -> backhaul -> vendor.
        return False
    if mode in PER_VENDOR_MODES:
        return channel != victim
    raise ValueError(f"unknown mode {mode}")


def surviving_set(mode: str, channels: list[str], victim: Optional[str] = None) -> set[str]:
    return {c for c in channels if survives(c, mode, victim)}


def worst_case_surviving(mode: str, channels: list[str]) -> set[str]:
    """Smallest surviving set over all possible victims for the mode."""
    if mode in PER_VENDOR_MODES:
        sets = [surviving_set(mode, channels, v) for v in API_PROVIDERS]
        return min(sets, key=len)
    return surviving_set(mode, channels)


def redundant(a: str, b: str, mode: str) -> bool:
    """Two channels are redundant for a mode only if they do not both fail under it."""
    if mode in PER_VENDOR_MODES:
        return all(survives(a, mode, v) or survives(b, mode, v) for v in API_PROVIDERS)
    return survives(a, mode) or survives(b, mode)


def report() -> None:
    print("surviving set per failure mode")
    print(f"{'mode':<16}{'all channels':<44}{'API providers only'}")
    for mode in MODES:
        all_s = sorted(worst_case_surviving(mode, CHANNELS))
        api_s = sorted(worst_case_surviving(mode, API_PROVIDERS))
        print(f"{mode:<16}{str(all_s):<44}{api_s if api_s else '{}  <- EMPTY'}")
    print()
    print("pairwise redundancy among API providers, per mode")
    pairs = [("gemini_api", "claude_api"), ("gemini_api", "openai_api"), ("claude_api", "openai_api")]
    for mode in MODES:
        flags = ["yes" if redundant(a, b, mode) else "NO" for a, b in pairs]
        print(f"{mode:<16}{'  '.join(f'{a[:6]}/{b[:6]}={f}' for (a, b), f in zip(pairs, flags))}")
    empty = [m for m in MODES if not worst_case_surviving(m, API_PROVIDERS)]
    print()
    if empty:
        print("FINDING: against " + ", ".join(empty) + " the three API providers are ONE channel.")
    print()


class ChannelRedundancy(unittest.TestCase):
    def test_every_mode_has_a_survivor(self):
        for mode in MODES:
            with self.subTest(mode=mode):
                s = worst_case_surviving(mode, CHANNELS)
                self.assertTrue(s, f"no channel survives {mode}: surviving set is empty")

    def test_api_providers_collapse_under_shared_cause(self):
        # This is the documented finding, asserted so it cannot drift silently.
        for mode in SHARED_CAUSE_MODES:
            with self.subTest(mode=mode):
                self.assertEqual(worst_case_surviving(mode, API_PROVIDERS), set())

    def test_api_providers_redundant_per_vendor(self):
        for mode in PER_VENDOR_MODES:
            with self.subTest(mode=mode):
                self.assertEqual(len(worst_case_surviving(mode, API_PROVIDERS)), 2)

    def test_table_matches_channels_md(self):
        # channels.md must carry the finding verbatim.
        with open("channels.md", encoding="utf-8") as f:
            text = f.read()
        self.assertIn("Against connectivity loss, the three API providers are ONE channel.", text)


if __name__ == "__main__":
    report()
    sys.exit(0 if unittest.main(argv=[sys.argv[0]], verbosity=1, exit=False).result.wasSuccessful() else 1)
