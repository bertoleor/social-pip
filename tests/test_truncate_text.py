"""RED-first tests for truncate_text (change: truncate-text-util)."""

import sys
from pathlib import Path

import pytest

_SCRIPTS = (
    Path(__file__).resolve().parent.parent / "skills" / "50-AI" / "agent-orchestrator" / "scripts"
)
sys.path.insert(0, str(_SCRIPTS))

from text_utils import truncate_text  # noqa: E402 -- sys.path bootstrap must precede import


def test_long_text_gets_default_suffix_within_max_len():
    result = truncate_text("agent-orchestrator-registry", 20)
    assert len(result) == 20
    assert result.endswith("…")


def test_custom_suffix():
    assert truncate_text("abcdef", 5, suffix="...") == "ab..."


def test_short_text_passthrough():
    assert truncate_text("scan", 20) == "scan"


def test_exact_length_passthrough():
    assert truncate_text("abcde", 5) == "abcde"


def test_zero_max_len_rejected():
    with pytest.raises(ValueError):
        truncate_text("abc", 0)


def test_oversized_suffix_rejected():
    with pytest.raises(ValueError):
        truncate_text("abcdef", 2, suffix="...")


def test_non_string_rejected():
    with pytest.raises(TypeError):
        truncate_text(123, 5)
