"""Tests for the ai_evals SQLite table + weekly report script.

Ticker t_4f143f7b — Propuesta 3 of docs/audits/ia-propuesta-2026-09-14.md:
(1) ai_evals table in local SQLite, (2) weekly job reporting brand-validator
pass rate + human like-rate by sector. Auxiliary Python only — the shipping
stack (TS/Rust) is untouched.
"""

from __future__ import annotations

import sqlite3
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_SCRIPT = REPO_ROOT / "scripts" / "ai_evals_schema.sql"
REPORT_SCRIPT = REPO_ROOT / "scripts" / "ai_evals_report.py"

DDL = """
CREATE TABLE IF NOT EXISTS ai_evals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,              -- ISO date YYYY-MM-DD
    sector TEXT NOT NULL,             -- inmobiliario, gastronomia, ...
    plataforma TEXT NOT NULL,         -- instagram, tiktok, ...
    prompt_id TEXT NOT NULL,          -- 'prompt-canonico' version
    output TEXT NOT NULL,             -- generated caption/copy
    brand_check INTEGER NOT NULL CHECK (brand_check IN (0, 1)),
    like_humano INTEGER CHECK (like_humano IN (0, 1))  -- NULL until reviewed
);
CREATE INDEX IF NOT EXISTS idx_ai_evals_sector_fecha ON ai_evals (sector, fecha);
"""


def _db(tmp_path: Path) -> Path:
    path = tmp_path / "test.db"
    con = sqlite3.connect(path)
    con.executescript(DDL)
    con.close()
    return path


def _insert(db: Path, sector: str, brand: int, like: int | None, fecha: str = "2026-09-08") -> None:
    con = sqlite3.connect(db)
    con.execute(
        "INSERT INTO ai_evals (fecha, sector, plataforma, prompt_id, output,"
        " brand_check, like_humano) VALUES (?, ?, 'instagram', 'v1', 'copy', ?, ?)",
        (fecha, sector, brand, like),
    )
    con.commit()
    con.close()


class TestSchema:
    def test_schema_file_is_idempotent(self, tmp_path):
        assert SCHEMA_SCRIPT.is_file(), "scripts/ai_evals_schema.sql missing"
        db = tmp_path / "s.db"
        for _ in range(2):
            con = sqlite3.connect(db)
            con.executescript(SCHEMA_SCRIPT.read_text(encoding="utf-8"))
            con.close()
        con = sqlite3.connect(db)
        cols = {r[1] for r in con.execute("PRAGMA table_info(ai_evals)")}
        con.close()
        expected = {
            "id",
            "fecha",
            "sector",
            "plataforma",
            "prompt_id",
            "output",
            "brand_check",
            "like_humano",
        }
        assert expected <= cols


class TestWeeklyReport:
    def _run(self, db: Path, week: str = "2026-W37") -> subprocess.CompletedProcess:
        return subprocess.run(
            [sys.executable, str(REPORT_SCRIPT), "--db", str(db), "--week", week],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=REPO_ROOT,
            check=False,
        )

    def test_empty_db_reports_zero_without_error(self, tmp_path):
        db = _db(tmp_path)
        res = self._run(db)
        assert res.returncode == 0, res.stderr
        assert "sin datos" in (res.stdout + res.stderr).lower() or "0" in res.stdout

    def test_pass_and_like_rates_by_sector(self, tmp_path):
        db = _db(tmp_path)
        # week 37 of 2026 = Sep 07..13
        _insert(db, "inmobiliario", 1, 1, fecha="2026-09-08")
        _insert(db, "inmobiliario", 1, 0, fecha="2026-09-09")
        _insert(db, "inmobiliario", 0, 1, fecha="2026-09-10")
        _insert(db, "gastronomia", 1, 1, fecha="2026-09-08")
        _insert(db, "gastronomia", 1, None, fecha="2026-09-09")  # pending: like excluded
        _insert(db, "inmobiliario", 1, 1, fecha="2026-08-30")  # previous week: excluded

        res = self._run(db)
        assert res.returncode == 0, res.stderr
        out = res.stdout
        assert "inmobiliario" in out and "gastronomia" in out
        # brand pass rate: inmo 2/3 = 66.7%, gastro 2/2 = 100
        assert "66.7" in out
        assert "100.0" in out
        # human like rate: inmo 2/3 = 66.7, gastro 1/1 (pending excluded) = 100.0
        # other week row must not leak: inmo total brand would be 3/4=75 if leaked
        assert "75.0" not in out

    def test_week_filter_boundary_iso_week(self, tmp_path):
        db = _db(tmp_path)
        _insert(db, "inmobiliario", 1, 1, fecha="2026-09-07")  # Monday W37
        _insert(db, "inmobiliario", 0, 0, fecha="2026-09-13")  # Sunday W37
        res = self._run(db)
        assert res.returncode == 0, res.stderr
        assert "50.0" in res.stdout  # 1/2 passing inside the week
