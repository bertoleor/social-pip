"""Tests for scripts/baseline_update.py — docs/baseline.md generator (F2 gap).

Ticket t_ac0b975e: docs/baseline.md is a required F2 exit per
ORDEN-DE-TRABAJO-FASES-CONTRATOS.md §8. The script must measure and write
the §8 table (build/typecheck/tests, coverage, CVEs, accepted debt,
date+commit). Pure auxiliary Python — the shipping stack is untouched.
"""

from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BASELINE_SCRIPT = REPO_ROOT / "scripts" / "baseline_update.py"
sys.path.insert(0, str(REPO_ROOT / "scripts"))  # sys.path bootstrap must precede import
import baseline_update  # noqa: E402


class TestBaselineScript:
    def test_script_exists(self):
        assert BASELINE_SCRIPT.is_file(), "scripts/baseline_update.py missing"

    def test_collect_results_structure(self, tmp_path):
        # collect() must return the §8 metrics as a dict with stable keys
        results = baseline_update.collect(repo_root=tmp_path, now=dt.date(2026, 9, 29))
        for key in ("date", "commit", "pytest", "typecheck", "audit"):
            assert key in results, f"collect() missing key: {key}"

    def test_render_contains_section8_table(self, tmp_path):
        results = baseline_update.collect(repo_root=tmp_path, now=dt.date(2026, 9, 29))
        text = baseline_update.render(results)
        tokens = (
            "Build / typecheck / tests",
            "Cobertura",
            "CVEs",
            "Deuda aceptada",
            "Fecha y commit",
        )
        for token in tokens:
            assert token in text, f"render() missing §8 row: {token}"

    def test_write_baseline_file(self, tmp_path):
        results = baseline_update.collect(repo_root=tmp_path, now=dt.date(2026, 9, 29))
        out = tmp_path / "docs" / "baseline.md"
        baseline_update.write_baseline(results, out)
        assert out.is_file(), "docs/baseline.md not written"
        content = out.read_text(encoding="utf-8")
        assert "Build / typecheck / tests" in content

    def test_pytest_result_reflects_real_run(self, tmp_path):
        # a fake repo_root with no tests dir -> pytest step reports 0 passed, not a crash
        results = baseline_update.collect(repo_root=tmp_path, now=dt.date(2026, 9, 29))
        assert (
            results["pytest"] in ("0 passed", "errored", "errored (collection/usage)")
        ), results["pytest"]

    def test_missing_db_reports_cleanly(self, tmp_path):
        # no data/social-pip.db -> no crash, sqlite section reports missing
        results = baseline_update.collect(repo_root=tmp_path, now=dt.date(2026, 9, 29))
        assert "sqlite" in results

    def test_idempotent_rerun_overwrites(self, tmp_path):
        out = tmp_path / "docs" / "baseline.md"
        r1 = baseline_update.collect(repo_root=tmp_path, now=dt.date(2026, 9, 29))
        baseline_update.write_baseline(r1, out)
        r2 = baseline_update.collect(repo_root=tmp_path, now=dt.date(2026, 9, 29))
        baseline_update.write_baseline(r2, out)
        assert out.read_text(encoding="utf-8") == baseline_update.render(r2)
