"""Repo hygiene gate: package.json scripts must be pnpm-only (DP-01).

The repo declares pnpm as its only package manager
(``packageManager: pnpm@9.15.0``, pnpm-workspace.yaml, CI uses
``pnpm install --frozen-lockfile``). Scripts that shell out to ``npm run``
silently reintroduce a second engine: anyone running them locally creates
``package-lock.json`` again (the stale one caused 4 false trivy HIGHs), and
npm resolves dependencies differently than pnpm — drift between local runs
and CI.

This gate complements ``test_repo_hygiene.py`` (which already forbids npm/yarn
lockfiles): that one catches the *symptom* (a lockfile appears), this one
removes the *cause* (scripts that invoke npm).
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]

# Vendored reference material is excluded from repo-wide gates (same policy
# as test_repo_hygiene.py: skills/ and pre-commit bandit exclusions).
EXCLUDED_PREFIXES = ("skills",)

# A pnpm filter targets the package by workspace name; a plain `cd X && npm run`
# bypasses the workspace engine. Both spellings must disappear.
_NPM_RUN_RE = re.compile(r"\bnpm\s+(?:run|exec|install|ci)\b")


def _tracked_files() -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files"],
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )
    if result.returncode != 0:
        pytest.skip(f"git ls-files failed: {result.stderr.strip()}")
    return [l for l in result.stdout.splitlines() if l]


def _package_json_scripts() -> dict[str, dict[str, str]]:
    """Return {path: {script_name: script_body}} for every tracked package.json."""
    scripts: dict[str, dict[str, str]] = {}
    for rel in _tracked_files():
        if not rel.replace("\\", "/").endswith("package.json"):
            continue
        if any(rel.replace("\\", "/").startswith(p) for p in EXCLUDED_PREFIXES):
            continue
        path = ROOT / rel
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        body = data.get("scripts") or {}
        if isinstance(body, dict):
            scripts[rel] = {k: v for k, v in body.items() if isinstance(v, str)}
    return scripts


def test_scripts_are_pnpm_only():
    """No tracked package.json outside skills/ may shell out to npm."""
    offenders: list[str] = []
    for rel, body in _package_json_scripts().items():
        for name, script in body.items():
            if _NPM_RUN_RE.search(script):
                offenders.append(f"{rel} :: {name} :: {script}")
    assert not offenders, (
        "npm invocations found in package.json scripts (repo is pnpm-only; "
        "use `pnpm --filter <pkg> <script>` or plain pnpm commands):\n"
        + "\n".join(sorted(offenders))
    )


def test_gitignore_blocks_npm_lockfiles():
    """package-lock.json must be gitignored so it can never be re-tracked."""
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    assert "package-lock.json" in gitignore, (
        ".gitignore must list package-lock.json (DP-01): a stray `npm install` "
        "at repo root recreates the dead lockfile that produced 4 false "
        "trivy HIGHs (see test_repo_hygiene.py rationale)."
    )


def test_ci_lockfile_gate_exists():
    """pr-checks.yml must assert package-lock.json stays untracked in CI."""
    ci = (
        ROOT / ".github" / "workflows" / "pr-checks.yml"
    ).read_text(encoding="utf-8")
    # The gate must name the lockfile explicitly and fail when it is tracked.
    assert "package-lock.json" in ci, (
        "pr-checks.yml must check that package-lock.json is never tracked "
        "(DP-01): the hygiene pytest gate runs locally; CI needs its own "
        "guard so the repo can never drift back to a dual-lockfile state."
    )
