"""Repo hygiene gates for SOCIAL-PIP (ORN-89 follow-up / plan-accion Fase 2).

Gate: the repo is pnpm-only (engines: pnpm>=9 in package.json, pnpm-workspace.yaml,
.npmrc). npm/yarn lockfiles must not exist outside skills/ (vendored reference
material is excluded like every other repo-wide gate does).

Rationale: a stale root package-lock.json (lockfileVersion 3, April 2026) made
trivy report 4 HIGH react-router advisories that were already fixed in
pnpm-lock.yaml — dead lockfiles are a standing source of false security signal.
"""

import os
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]

# Vendored reference material — excluded from repo-wide gates everywhere
# (pre-commit bandit excludes it, gitleaks has its own allowlist, etc.)
EXCLUDED_PREFIXES = ("skills",)

# Workspaces where a lockfile could legitimately be created by a tool run.
# Walked shallowly (no node_modules descent) to keep the gate fast.
LOCKFILE_TOP_DIRS = ("apps", "packages", "core", "ui", "data")

LOCKFILE_NAMES = ("package-lock.json", "npm-shrinkwrap.json", "yarn.lock")


def _is_excluded(rel_path: str) -> bool:
    rel_posix = rel_path.replace(os.sep, "/")
    return any(rel_posix.startswith(p) for p in EXCLUDED_PREFIXES)


def _git_tracked_lockfiles() -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "--"] + list(LOCKFILE_NAMES),
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )
    if result.returncode != 0:
        pytest.skip(f"git ls-files failed: {result.stderr.strip()}")
    return [l for l in result.stdout.splitlines() if l and not _is_excluded(l)]


def _worktree_lockfiles() -> list[str]:
    """Shallow scan: root + first two levels of workspace dirs only."""
    offenders: list[str] = []
    candidates: list[Path] = [ROOT]
    for top in LOCKFILE_TOP_DIRS:
        topdir = ROOT / top
        if topdir.is_dir():
            candidates.append(topdir)
            for child in topdir.iterdir():
                if child.is_dir() and child.name != "node_modules":
                    candidates.append(child)
    for d in candidates:
        for name in LOCKFILE_NAMES:
            if (d / name).exists():
                rel = os.path.relpath(d / name, ROOT)
                if not _is_excluded(rel):
                    offenders.append(str(rel))
    return offenders


def test_no_npm_yarn_lockfiles_outside_skills():
    """pnpm-only repo: npm/yarn lockfiles generate false vuln signal."""
    offenders = _git_tracked_lockfiles() + _worktree_lockfiles()
    assert not offenders, (
        "npm/yarn lockfiles found outside skills/ (repo is pnpm-only; "
        "stale lockfiles create false trivy/audit findings):\\n"
        + "\\n".join(sorted(set(offenders)))
    )
