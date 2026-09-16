"""Regression tests for gaps A1/A2 from docs/audits/general-socialpip.md.

A1: blind `except Exception` was narrowed to (OSError, ValueError, TypeError)
    so a corrupt registry/hash file does not crash scan_registry, and
A2: silent `try-except-pass` became an explicit `logger.warning(...)`.

These tests assert the *behavior* that fix guarantees: on a corrupt JSON file
scan_registry.load_hashes()/load_registry() return their safe defaults AND emit
a warning instead of raising or failing silently. Red (no warning / raise)
before the fix, green after.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

import pytest

_SCRIPTS = (
    Path(__file__).resolve().parents[1]
    / "skills"
    / "50-AI"
    / "agent-orchestrator"
    / "scripts"
)
sys.path.insert(0, str(_SCRIPTS))

import scan_registry  # noqa: E402  (sys.path bootstrap above)


@pytest.fixture
def corrupt_file(tmp_path: Path) -> Path:
    """A JSON file with malformed content (the A1/A2 failure mode)."""
    f = tmp_path / "registry_bad.json"
    f.write_text("{ not valid json !!,,", encoding="utf-8")
    return f


def test_load_hashes_returns_default_not_crash(corrupt_file: Path, monkeypatch) -> None:
    monkeypatch.setattr(scan_registry, "HASHES_PATH", corrupt_file)
    assert scan_registry.load_hashes() == {}


def test_load_registry_returns_default_not_crash(corrupt_file: Path, monkeypatch) -> None:
    monkeypatch.setattr(scan_registry, "REGISTRY_PATH", corrupt_file)
    result = scan_registry.load_registry()
    assert isinstance(result, dict)
    assert result["skills"] == []


def test_load_hashes_logs_warning(corrupt_file: Path, monkeypatch, caplog) -> None:
    monkeypatch.setattr(scan_registry, "HASHES_PATH", corrupt_file)
    with caplog.at_level(logging.WARNING, logger="__main__"):
        scan_registry.load_hashes()
    # A2 guarantees the failure is surfaced via a warning, not swallowed.
    assert any("corrupt" in r.getMessage().lower() for r in caplog.records)


def test_load_registry_logs_warning(corrupt_file: Path, monkeypatch, caplog) -> None:
    monkeypatch.setattr(scan_registry, "REGISTRY_PATH", corrupt_file)
    with caplog.at_level(logging.WARNING, logger="__main__"):
        scan_registry.load_registry()
    assert any("corrupt" in r.getMessage().lower() for r in caplog.records)


def test_load_hashes_returns_content_for_valid_file(tmp_path: Path, monkeypatch) -> None:
    valid = tmp_path / "hashes_ok.json"
    valid.write_text('{"a.py": "abc123"}', encoding="utf-8")
    monkeypatch.setattr(scan_registry, "HASHES_PATH", valid)
    assert scan_registry.load_hashes() == {"a.py": "abc123"}
