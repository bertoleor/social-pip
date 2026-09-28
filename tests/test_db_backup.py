"""Tests for scripts/db_backup.py — SQLite backup for ORN-119.

Ticket ORN-119 (social-pip): the local SQLite DB must be initialized AND
backed up. scripts/db_backup.py creates a consistent snapshot of
data/social-pip.db using VACUUM INTO, with a dated filename, keeping a
bounded number of backups (oldest pruned). Pure auxiliary Python — the
shipping stack (TS/Rust) is untouched.
"""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKUP_SCRIPT = REPO_ROOT / "scripts" / "db_backup.py"
sys.path.insert(0, str(REPO_ROOT / "scripts"))  # sys.path bootstrap must precede import
import db_backup  # noqa: E402

DDL = """
CREATE TABLE IF NOT EXISTS ai_evals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    sector TEXT NOT NULL,
    plataforma TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    output TEXT NOT NULL,
    brand_check INTEGER NOT NULL CHECK (brand_check IN (0, 1)),
    like_humano INTEGER CHECK (like_humano IN (0, 1))
);
"""

ROW = ("2026-09-28", "gastronomia", "instagram", "v1", "copy text", 1, 1)


def _db_with_rows(path: Path, n_rows: int) -> Path:
    con = sqlite3.connect(path)
    con.executescript(DDL)
    for i in range(n_rows):
        con.execute(
            "INSERT INTO ai_evals (fecha, sector, plataforma, prompt_id,"
            " output, brand_check, like_humano) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("2026-09-28", "gastronomia", "instagram", f"v{i}", "copy", 1, 1),
        )
    con.commit()
    con.close()
    return path


class TestBackupScript:
    def test_script_exists(self):
        assert BACKUP_SCRIPT.is_file(), "scripts/db_backup.py missing"

    def test_backup_creates_dated_file(self, tmp_path):
        db = _db_with_rows(tmp_path / "src.db", 3)
        out_dir = tmp_path / "backups"
        dest = db_backup.create_backup(db, out_dir=out_dir)
        assert dest.is_file(), "backup file not created"
        assert dest.parent == out_dir
        # filename pattern social-pip-YYYY-MM-DD.db (UTC)
        assert dest.name.startswith("social-pip-")
        assert dest.name.endswith(".db")
        # backup is a valid SQLite file with the same rows
        con = sqlite3.connect(dest)
        count = con.execute("SELECT COUNT(*) FROM ai_evals").fetchone()[0]
        con.close()
        assert count == 3

    def test_backup_is_valid_sqlite_with_integrity_check(self, tmp_path):
        db = _db_with_rows(tmp_path / "src.db", 5)
        dest = db_backup.create_backup(db, out_dir=tmp_path / "backups")
        con = sqlite3.connect(dest)
        result = con.execute("PRAGMA integrity_check").fetchone()[0]
        con.close()
        assert result == "ok"

    def test_missing_db_raises(self, tmp_path):
        missing = tmp_path / "nope.db"
        try:
            db_backup.create_backup(missing, out_dir=tmp_path / "backups")
        except FileNotFoundError:
            pass
        else:
            raise AssertionError("missing DB must raise FileNotFoundError")

    def test_retention_prunes_oldest(self, tmp_path):
        import datetime as dt

        db = _db_with_rows(tmp_path / "src.db", 1)
        out_dir = tmp_path / "backups"
        # 5 backups on 5 distinct days with keep=3 -> 3 newest survive
        days = [dt.date(2026, 9, 24) + dt.timedelta(days=i) for i in range(5)]
        paths = [db_backup.create_backup(db, out_dir=out_dir, keep=3, today=d) for d in days]
        remaining = sorted(p.name for p in out_dir.glob("*.db"))
        assert len(remaining) == 3, f"expected 3 backups, found {remaining}"
        # the 3 newest of the 5 created must survive
        expected = sorted(p.name for p in paths[-3:])
        assert remaining == expected

    def test_same_day_backup_is_idempotent(self, tmp_path):
        import datetime as dt

        db = _db_with_rows(tmp_path / "src.db", 1)
        out_dir = tmp_path / "backups"
        day = dt.date(2026, 9, 28)
        first = db_backup.create_backup(db, out_dir=out_dir, today=day)
        second = db_backup.create_backup(db, out_dir=out_dir, today=day)
        assert first == second, "same-day re-run must overwrite, not duplicate"
        assert len(list(out_dir.glob("*.db"))) == 1

    def test_backups_are_independent_of_source(self, tmp_path):
        db = _db_with_rows(tmp_path / "src.db", 2)
        dest = db_backup.create_backup(db, out_dir=tmp_path / "backups")
        # mutate source after backup
        con = sqlite3.connect(db)
        con.execute("DELETE FROM ai_evals")
        con.commit()
        con.close()
        con = sqlite3.connect(dest)
        count = con.execute("SELECT COUNT(*) FROM ai_evals").fetchone()[0]
        con.close()
        assert count == 2, "backup must be an independent snapshot"
