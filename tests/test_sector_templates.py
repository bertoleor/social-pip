"""Tests for per-sector template JSONs under docs/sectors/.

Gate (plan-accion-2026-09-12, Fase 2): "6/6 sectores con JSON".
Each file <sector>/templates.json must validate against the shared shape.
"""
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SECTORS_DIR = ROOT / "docs" / "sectors"

EXPECTED_SECTORS = [
    "inmobiliario",
    "esoterismo",
    "digital",
    "gastronomia",
    "estetica",
    "productos",
]

REQUIRED_TEMPLATE_KEYS = {"sector", "templates"}
REQUIRED_BLOCK_KEYS = {"type", "description", "example", "rules"}


def _templates_path(sector: str) -> Path:
    return SECTORS_DIR / sector / "templates.json"


@pytest.mark.parametrize("sector", EXPECTED_SECTORS)
def test_sector_templates_file_exists(sector):
    path = _templates_path(sector)
    assert path.exists(), f"Missing {path}"
    assert path.stat().st_size > 0, f"{path} is empty"


@pytest.mark.parametrize("sector", EXPECTED_SECTORS)
def test_sector_templates_valid_json_shape(sector):
    path = _templates_path(sector)
    if not path.exists():
        pytest.skip(f"{path} missing (covered by exists test)")
    data = json.loads(path.read_text(encoding="utf-8"))
    assert REQUIRED_TEMPLATE_KEYS <= set(data.keys()), (
        f"{path} must have keys {REQUIRED_TEMPLATE_KEYS}, got {sorted(data.keys())}"
    )
    assert data["sector"] == sector, (
        f"{path}: sector field '{data['sector']}' != dir '{sector}'"
    )
    templates = data["templates"]
    assert isinstance(templates, list) and len(templates) >= 1, (
        f"{path}: 'templates' must be a non-empty list"
    )
    for idx, tpl in enumerate(templates):
        assert "name" in tpl, f"{path} templates[{idx}] missing 'name'"
        structure = tpl.get("structure")
        assert isinstance(structure, list) and structure, (
            f"{path} templates[{idx}] 'structure' must be a non-empty list"
        )
        for block in structure:
            missing = REQUIRED_BLOCK_KEYS - set(block.keys())
            assert not missing, (
                f"{path} templates[{idx}].structure block {block.get('type')!r} "
                f"missing keys {missing}"
            )


@pytest.mark.parametrize("sector", EXPECTED_SECTORS)
def test_sector_has_cta_and_hashtags(sector):
    """Every template must end with a CTA + hashtags block (style-guide rule)."""
    path = _templates_path(sector)
    if not path.exists():
        pytest.skip(f"{path} missing")
    data = json.loads(path.read_text(encoding="utf-8"))
    for tpl in data["templates"]:
        types = [b["type"] for b in tpl["structure"]]
        assert "cta" in types, f"{data['sector']}/{tpl['name']}: no CTA block"
        assert "hashtags" in types, (
            f"{data['sector']}/{tpl['name']}: no hashtags block"
        )
