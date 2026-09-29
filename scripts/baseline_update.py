#!/usr/bin/env python3
"""Measure project health and write docs/baseline.md (fases contract §8).

Usage:
    python scripts/baseline_update.py --repo-root . --out docs/baseline.md

docs/baseline.md is a required F2 exit (ORDEN-DE-TRABAJO-FASES-CONTRATOS.md
§8): the measurable snapshot of "how the project is today" that F0.a deltas
and F4 audits against. Measures: build/typecheck/tests, coverage, CVEs
(pnpm audit), accepted debt, date + commit. Zero new dependencies.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path

PYTEST_TIMEOUT_S = 240
# pytest.ini has `addopts = -p no:cacheprovider -q`; the doubled -q suppresses
# the final "N passed" summary line, so we clear addopts for the measure run.
PYTEST_ARGS = ["-o", "addopts=", "--tb=no", "-q"]
PNPM_CJS_CANDIDATES = [
    # corepack-managed pnpm shims on Windows (global .tools dir)
    Path.home() / "AppData" / "Local" / "pnpm" / ".tools" / "pnpm" / "9.15.0"
    / "node_modules" / "pnpm" / "bin" / "pnpm.cjs",
]


def _resolve_pnpm() -> list[str] | None:
    """Return a command list for pnpm, or None if not resolvable."""
    pnpm_path = shutil.which("pnpm")
    if pnpm_path:
        try:
            proc = subprocess.run(
                [pnpm_path, "--version"],
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
            )
            if proc.returncode == 0:
                return [pnpm_path]
        except (OSError, subprocess.TimeoutExpired):
            pass
    for cand in PNPM_CJS_CANDIDATES:
        if cand.is_file():
            return ["node", str(cand)]
    return None


def _run(cmd: list[str], cwd: Path) -> tuple[int, str]:
    """Run a command, return (exit_code, trimmed stdout+stderr). Never raises."""
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=PYTEST_TIMEOUT_S,
            check=False,
        )
        return proc.returncode, (proc.stdout + proc.stderr).strip()
    except (OSError, subprocess.TimeoutExpired) as exc:
        return -1, f"unavailable: {exc}"


def _git_commit(repo_root: Path) -> str:
    code, out = _run(["git", "rev-parse", "--short", "HEAD"], cwd=repo_root)
    return out if code == 0 else "unknown"


def _pytest_summary(repo_root: Path) -> str:
    code, out = _run(
        [sys.executable, "-m", "pytest", "tests/", *PYTEST_ARGS],
        cwd=repo_root,
    )
    if code == -1:
        return "errored"
    last = [ln for ln in out.splitlines() if ln.strip()]
    for ln in reversed(last):
        if "passed" in ln or "failed" in ln or "error" in ln:
            return ln.strip()[:120]
    if code == 0:
        return "0 passed"
    if code == -1:
        return "errored"
    # pytest exit 4/5 = usage/collection error (e.g. no tests dir)
    if code in (4, 5):
        return "errored (collection/usage)"
    return f"exit {code}"


def _typecheck_summary(repo_root: Path) -> str:
    desktop = repo_root / "apps" / "desktop"
    if not (desktop / "tsconfig.json").is_file():
        return "n/a (no tsconfig)"
    # local tsc via node first (no shim/pnpm dependency), else pnpm exec
    tsc_js = desktop / "node_modules" / "typescript" / "bin" / "tsc"
    if tsc_js.is_file():
        code, out = _run(["node", str(tsc_js), "--noEmit", "-p", "tsconfig.json"], cwd=desktop)
        if code != -1:
            return "PASS" if code == 0 else f"FAIL ({len(out.splitlines())} lines)"
    pnpm = _resolve_pnpm()
    if pnpm is None:
        return "unavailable (pnpm not resolvable)"
    code, out = _run([*pnpm, "exec", "tsc", "--noEmit", "-p", "tsconfig.json"], cwd=desktop)
    if code == -1:
        return "unavailable"
    return "PASS" if code == 0 else f"FAIL ({len(out.splitlines())} lines)"


def _audit_summary(repo_root: Path) -> str:
    lockfile = repo_root / "pnpm-lock.yaml"
    if not lockfile.is_file():
        return "n/a (no pnpm-lock.yaml)"
    pnpm = _resolve_pnpm()
    if pnpm is None:
        return "unavailable (pnpm not resolvable)"
    code, out = _run([*pnpm, "audit", "--prod"], cwd=repo_root)
    if code == -1:
        return "unavailable"
    if "No known vulnerabilities" in out or code == 0:
        return "0 known vulnerabilities"
    # count severities
    counts = {}
    for line in out.splitlines():
        low = line.lower()
        for sev in ("critical", "high", "moderate", "low"):
            if f"{sev} sevs" in low or f"severity: {sev}" in low:
                counts[sev] = counts.get(sev, 0) + 1
    if counts:
        return ", ".join(f"{v} {k}" for k, v in sorted(counts.items()))
    return out.strip().splitlines()[-1][:120] if out.strip() else f"exit {code}"


def _sqlite_summary(repo_root: Path) -> str:
    db = repo_root / "data" / "social-pip.db"
    if not db.is_file():
        return "missing (no data/social-pip.db)"
    try:
        con = sqlite3.connect(db)
        try:
            tables = [
                r[0]
                for r in con.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ).fetchall()
            ]
            evals = 0
            if "ai_evals" in tables:
                evals = con.execute("SELECT COUNT(*) FROM ai_evals").fetchone()[0]
            return f"tables: {len(tables)} ({', '.join(sorted(tables))}); ai_evals rows: {evals}"
        finally:
            con.close()
    except sqlite3.Error as exc:
        return f"error: {exc}"


def collect(repo_root: Path, now: dt.date | None = None) -> dict[str, str]:
    """Measure every §8 metric. Returns dict with stable keys."""
    if now is None:
        now = dt.datetime.now().astimezone().date()
    repo_root = Path(repo_root)
    return {
        "date": now.isoformat(),
        "commit": _git_commit(repo_root),
        "pytest": _pytest_summary(repo_root),
        "typecheck": _typecheck_summary(repo_root),
        "audit": _audit_summary(repo_root),
        "sqlite": _sqlite_summary(repo_root),
    }


def render(results: dict[str, str]) -> str:
    """Render the §8 baseline table as markdown."""
    typecheck, pytest = results["typecheck"], results["pytest"]
    build_txt = f"typecheck {typecheck} · pytest {pytest}"
    audit = results["audit"]
    debt = "ver tickets P2/P3 abiertos con label (kanban + Linear SOCIAL-PIP)"
    commit = results["commit"]
    date = results["date"]
    header = (
        f"> Foto medible del proyecto (contrato de fases §8). "
        f"Generado por `scripts/baseline_update.py` el {date} · commit `{commit}`."
    )
    updated_note = (
        "> Actualizado al cierre de cada F2/F3 y slice (contrato §8). "
        "F0.a computa delta contra este archivo."
    )
    coverage_note = (
        "| Cobertura | no medida en este repo "
        "(coverage artifact desactualizado — ver F0 2026-09-27 §3) |"
    )
    lines = [
        "# Baseline — social-pip",
        "",
        header,
        updated_note,
        "",
        "| Métrica | Valor |",
        "|---|---|",
        f"| Build / typecheck / tests | {build_txt} |",
        coverage_note,
        f"| CVEs (pnpm audit --prod) | {audit} |",
        f"| SQLite | {results['sqlite']} |",
        f"| Deuda aceptada | {debt} |",
        f"| Fecha y commit | {date} · `{commit}` |",
        "",
        "## Cómo regenerar",
        "",
        "```bash",
        "python scripts/baseline_update.py --repo-root . --out docs/baseline.md",
        "```",
        "",
    ]
    return "\n".join(lines)


def write_baseline(results: dict[str, str], out: Path) -> Path:
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(results), encoding="utf-8")
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo-root", default=".", help="repo root (default: cwd)")
    parser.add_argument("--out", default="docs/baseline.md", help="output markdown path")
    args = parser.parse_args(argv)

    repo_root = Path(args.repo_root).resolve()
    results = collect(repo_root)
    out = write_baseline(results, Path(args.out))
    print(f"baseline written: {out}")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
