"""Docs gates for ORN-188 (base code vs vision repo split).

Gate: docs/vision/base-vs-vision.md must declare auto-poster-stealth as the
code base and social-pip as the vision/docs repo, per Linear ORN-188
(Urgent) and its kanban mirror t_bfbaa6b8.

Checks:
1. docs/vision/ exists and holds a base-vs-vision declaration doc.
2. The declaration names both repos and their roles unambiguously.
3. The base repo path it declares actually exists on disk.
4. docs/STATUS.md (project state doc) references the declaration so the
   split is discoverable from the canonical entry points.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VISION_DIR = ROOT / "docs" / "vision"
DECL = VISION_DIR / "base-vs-vision.md"

BASE_NAME = "auto-poster-stealth"
VISION_NAME = "social-pip"


def test_vision_dir_and_decl_exists():
    """docs/vision/base-vs-vision.md must exist (ORN-188 deliverable)."""
    assert DECL.is_file(), f"missing {DECL.relative_to(ROOT)}"


def test_decl_names_base_and_vision_roles():
    """The declaration must name both repos with their roles."""
    assert DECL.is_file(), f"missing {DECL.relative_to(ROOT)}"
    text = DECL.read_text(encoding="utf-8")
    assert BASE_NAME in text, "base repo not named"
    assert VISION_NAME in text, "vision repo not named"
    roles = re.findall(r"(?im)^#+\s.*(base|visi[oó]n|c[oó]digo).*", text)
    assert len(roles) >= 2, "no section headers naming base/vision roles"


def test_decl_base_path_exists_on_disk():
    """The declared base path must exist on this machine."""
    assert DECL.is_file(), f"missing {DECL.relative_to(ROOT)}"
    text = DECL.read_text(encoding="utf-8")
    m = re.search(
        r"`(E:[^`]*auto-poster-stealth[^`]*)`", text, re.IGNORECASE
    )
    assert m, "no absolute base path declared in backticks"
    base = Path(m.group(1))
    assert base.is_dir(), f"declared base path does not exist: {base}"


def test_status_references_decl():
    """docs/STATUS.md must link the declaration (discoverability)."""
    status = ROOT / "docs" / "STATUS.md"
    assert status.is_file()
    text = status.read_text(encoding="utf-8")
    assert "vision/base-vs-vision" in text, (
        "docs/STATUS.md does not reference the base-vs-vision declaration"
    )
