"""Docs gates for ORN-190 (one-pager) post-ORN-188 alignment.

Linear ORN-190 "Generar one-pager" (High, Todo) — deliverable committed in
e3d7a2f as docs/ONE-PAGER.md. ORN-188 (closed d270a59) later declared
auto-poster-stealth as the code base and social-pip as the vision/docs repo.

Gates:
1. The one-pager references the canonical base-vs-vision declaration so a
   reader learns where running code lives (not only the vision repo).
2. The one-pager's stack table matches reality post-upgrades: Prisma 6
   (package.json says ^6.x, not ^5), and no react-big-calendar row after
   the dependency was proven unused (audit DP-05).
3. The product one-pager also references the base-vs-vision declaration.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ONE_PAGER = ROOT / "docs" / "ONE-PAGER.md"
PRODUCT_PAGER = ROOT / "docs" / "product-one-pager.md"
DECL_REF = "vision/base-vs-vision"


def _read(path: Path) -> str:
    assert path.is_file(), f"missing {path.relative_to(ROOT)}"
    return path.read_text(encoding="utf-8")


def test_one_pager_references_base_vs_vision_decl():
    """One-pager must point readers at the base-vs-vision declaration."""
    text = _read(ONE_PAGER)
    assert DECL_REF in text, (
        "docs/ONE-PAGER.md does not reference docs/vision/base-vs-vision.md — "
        "readers cannot learn that the running code base is auto-poster-stealth"
    )


def test_one_pager_stack_matches_reality():
    """Stack table must match post-upgrade reality (Prisma 6, no rbc)."""
    text = _read(ONE_PAGER)
    # Prisma major must match packages/database/package.json (^6.x after DP-03).
    db_pkg = (ROOT / "packages" / "database" / "package.json").read_text(encoding="utf-8")
    m = re.search(r'"prisma":\s*"(\^?)(\d+)\.', db_pkg)
    assert m, "cannot read prisma major from packages/database/package.json"
    major = m.group(2)
    if major != "5":
        # One-pager must not claim a different Prisma line than the manifest.
        assert (
            f"Prisma {major}" in text
            or f"Prisma ^{major}" in text
            or re.search(rf"Prisma\s+\^?{major}", text)
        ), f"one-pager stack table does not reflect Prisma {major} (manifest major)"
    # react-big-calendar is dead weight (unused dep, audit DP-05): the
    # one-pager must not present it as part of the stack.
    assert "react-big-calendar" not in text, (
        "docs/ONE-PAGER.md still lists react-big-calendar in the stack; "
        "the dependency is unused (DP-05) and must not be advertised"
    )


def test_product_one_pager_references_base_vs_vision_decl():
    """Product one-pager must also name the base-vs-vision declaration."""
    text = _read(PRODUCT_PAGER)
    assert DECL_REF in text, (
        "docs/product-one-pager.md does not reference docs/vision/base-vs-vision.md"
    )
