"""Docs hygiene gates for SOCIAL-PIP (ORN-89 / plan-accion-2026-09-12 Fase 2).

Gate 1: top-level docs/ navigation must reference canonical docs/ paths
(no bare root-level QUICKSTART.md / CONTRIBUTING.md / CHANGELOG.md refs —
those files were moved to docs/ in commit f63da06).

Gate 2: docs must be free of OCR/encoding artifacts (CJK mojibake).
"""
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "docs"

# Navigation docs: top-level docs/*.md, excluding CHANGELOG.md (historical
# entries legitimately quote bare filenames describing what was added).
NAV_EXCLUDE = {"CHANGELOG.md"}

# Root-level docs moved to docs/ (commit f63da06): refs to them from
# navigation docs must use the docs/-prefixed path.
MOVED_DOCS = ("QUICKSTART", "CONTRIBUTING", "CHANGELOG")
UNPREFIXED_REF = re.compile(
    r"(?<!docs/)\b(" + "|".join(MOVED_DOCS) + r")\.md\b"
)

# CJK mojibake from OCR/encoding errors (e.g. 参考 instead of "referencia")
CJK_CHARS = re.compile(r"[\u4e00-\u9fff]")


def _nav_docs():
    return sorted(
        p for p in DOCS_DIR.glob("*.md") if p.name not in NAV_EXCLUDE
    )


def test_no_unprefixed_moved_doc_refs():
    """Navigation docs must reference moved root docs via docs/-prefixed paths."""
    offenders = []
    for path in _nav_docs():
        for idx, line in enumerate(
            path.read_text(encoding="utf-8").splitlines(), 1
        ):
            for match in UNPREFIXED_REF.finditer(line):
                offenders.append(
                    f"{path.relative_to(ROOT)}:{idx}: {match.group(0)}"
                )
    assert not offenders, (
        "Unprefixed refs to moved root docs (use docs/ prefix):\n"
        + "\n".join(offenders)
    )


@pytest.mark.parametrize("path", _nav_docs())
def test_no_cjk_mojibake(path):
    """Docs must be free of CJK mojibake (OCR/encoding artifacts)."""
    text = path.read_text(encoding="utf-8")
    matches = CJK_CHARS.findall(text)
    assert not matches, (
        f"{path.relative_to(ROOT)}: CJK mojibake chars found: {matches[:10]}"
    )
