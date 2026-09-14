"""Smoke tests for Social-Pip auxiliary Python scripts.

Covers the scripts under skills/*/scripts/ — compile + CLI --help + a real run
for the two content-creator tools. These scripts are support tooling, not the
shipping product (which is TS/Rust); this suite is a safety net so refactors
don't silently break them (gap A4 from general-socialpip.md).

NOTE: `orchestrate.py` and `match_skills.py` exit with JSON/usage output rather
than argparse-based --help, so they get a "runs and returns" check instead.
"""

from __future__ import annotations

import py_compile
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SKILLS = REPO_ROOT / "skills"

SCRIPTS_TO_COMPILE = [
    SKILLS / "40-AUTOMATION" / "content-creator" / "scripts" / "seo_optimizer.py",
    SKILLS / "40-AUTOMATION" / "content-creator" / "scripts" / "brand_voice_analyzer.py",
    SKILLS / "50-AI" / "agent-orchestrator" / "scripts" / "scan_registry.py",
    SKILLS / "50-AI" / "agent-orchestrator" / "scripts" / "match_skills.py",
    SKILLS / "50-AI" / "agent-orchestrator" / "scripts" / "orchestrate.py",
    SKILLS / "50-AI" / "prompt-engineering-patterns" / "scripts" / "optimize-prompt.py",
]

HELP_SCRIPTS = [
    (
        SKILLS / "40-AUTOMATION" / "content-creator" / "scripts" / "seo_optimizer.py",
        ["--help"],
    ),
    (
        SKILLS / "40-AUTOMATION" / "content-creator" / "scripts" / "brand_voice_analyzer.py",
        ["--help"],
    ),
    (
        SKILLS / "50-AI" / "agent-orchestrator" / "scripts" / "scan_registry.py",
        ["--status"],
    ),
]


def _run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=60, check=False)


def test_scripts_compile() -> None:
    for script in SCRIPTS_TO_COMPILE:
        assert script.exists(), f"missing script: {script}"
        py_compile.compile(str(script), doraise=True)


def test_help_scripts_exit_0() -> None:
    for script, args in HELP_SCRIPTS:
        result = _run([sys.executable, str(script), *args])
        assert result.returncode == 0, (
            f"{script.name} --help failed:\n{result.stdout}{result.stderr}"
        )


def test_orchestrate_returns_json_error_without_skills() -> None:
    script = SKILLS / "50-AI" / "agent-orchestrator" / "scripts" / "orchestrate.py"
    result = _run([sys.executable, str(script)])
    # Without --skills it emits a controlled JSON error (exit 1), not a traceback.
    assert '"error"' in result.stdout
    assert "Traceback" not in result.stderr


def test_match_skills_returns_json() -> None:
    script = SKILLS / "50-AI" / "agent-orchestrator" / "scripts" / "match_skills.py"
    result = _run([sys.executable, str(script), "--help"])
    assert result.returncode == 0
    assert '"matched"' in result.stdout


def test_seo_optimizer_real_run(tmp_path: Path) -> None:
    script = SKILLS / "40-AUTOMATION" / "content-creator" / "scripts" / "seo_optimizer.py"
    fixture = tmp_path / "sample.txt"
    fixture.write_text(
        "Este es un articulo de prueba sobre automatizacion de redes sociales. "
        "Hablemos de publicacion multi-plataforma y de anti-ban para latinoamerica.",
        encoding="utf-8",
    )
    result = _run([sys.executable, str(script), str(fixture), "redes sociales", "anti-ban"])
    assert result.returncode == 0, result.stderr
    # seo_optimizer prints a score; real run must not traceback.
    out = result.stdout.lower()
    assert "score" in out or "optimization" in out


def test_brand_voice_analyzer_real_run(tmp_path: Path) -> None:
    script = (
        SKILLS / "40-AUTOMATION" / "content-creator" / "scripts" / "brand_voice_analyzer.py"
    )
    fixture = tmp_path / "sample.txt"
    fixture.write_text(
        "Hey, we are excited to share this awesome stuff with you. Let's explore "
        "together how our solution can optimize your workflow and improve engagement.",
        encoding="utf-8",
    )
    result = _run([sys.executable, str(script), str(fixture), "json"])
    assert result.returncode == 0, result.stderr
    # brand_voice_analyzer emits JSON with the analysis fields; no traceback.
    assert "word_count" in result.stdout
    assert "voice_profile" in result.stdout
    assert "Traceback" not in result.stderr
