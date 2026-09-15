"""Corrupt registry files must warn instead of failing silently.

ORN-17 residual (audit gap A2, docs/audits/general-socialpip.md):
`load_hashes` / `load_registry` in scan_registry.py swallowed corrupt files
with bare `pass`. They must log a WARNING (path + error) while keeping the
empty-default fallback.
"""

from __future__ import annotations

import importlib.util
import logging
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCAN_SCRIPT = (
    REPO_ROOT / "skills" / "50-AI" / "agent-orchestrator" / "scripts" / "scan_registry.py"
)


def _load_module():
    spec = importlib.util.spec_from_file_location("scan_registry", SCAN_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_load_hashes_warns_on_corrupt_file(tmp_path, caplog):
    mod = _load_module()
    bad = tmp_path / "registry_hashes.json"
    bad.write_text("{not valid json", encoding="utf-8")
    mod.HASHES_PATH = bad
    with caplog.at_level(logging.WARNING):
        assert mod.load_hashes() == {}
    assert any(
        r.levelno >= logging.WARNING and "registry_hashes" in r.getMessage()
        for r in caplog.records
    ), "corrupt hashes file must emit a WARNING naming the path"


def test_load_registry_warns_on_corrupt_file(tmp_path, caplog):
    mod = _load_module()
    bad = tmp_path / "registry.json"
    bad.write_text("[broken", encoding="utf-8")
    mod.REGISTRY_PATH = bad
    with caplog.at_level(logging.WARNING):
        result = mod.load_registry()
    assert result["skills"] == []
    assert any(
        r.levelno >= logging.WARNING and "registry.json" in r.getMessage()
        for r in caplog.records
    ), "corrupt registry file must emit a WARNING naming the path"


def test_missing_files_stay_silent(tmp_path, caplog):
    mod = _load_module()
    mod.HASHES_PATH = tmp_path / "no-hashes.json"
    mod.REGISTRY_PATH = tmp_path / "no-registry.json"
    with caplog.at_level(logging.WARNING):
        assert mod.load_hashes() == {}
        assert mod.load_registry()["skills"] == []
    assert [r for r in caplog.records if r.levelno >= logging.WARNING] == []
