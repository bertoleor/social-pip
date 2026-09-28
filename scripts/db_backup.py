#!/usr/bin/env python3
"""SQLite backup for social-pip local DB (ticket ORN-119).

Creates a consistent, independent snapshot of the local SQLite DB using
VACUUM INTO (same engine, no cross-version file copy issues), named
social-pip-YYYY-MM-DD.db under data/backups/, pruning older backups to a
bounded retention. Idempotent per day: re-running on the same date
overwrites that day's backup.

Usage:
    python scripts/db_backup.py                     # data/social-pip.db, keep 14
    python scripts/db_backup.py --db other.db --keep 7 --out-dir my/backups

Exits 0 on success; non-zero (with message) if the DB is missing or the
backup cannot be produced. Pure auxiliary Python — the shipping stack
(TS/Rust) is untouched.
"""

from __future__ import annotations

import argparse
import datetime as dt
import sqlite3
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = REPO_ROOT / "data" / "social-pip.db"
DEFAULT_OUT_DIR = REPO_ROOT / "data" / "backups"
DEFAULT_KEEP = 14


def create_backup(
    db_path: Path | str,
    out_dir: Path | str = DEFAULT_OUT_DIR,
    keep: int = DEFAULT_KEEP,
    today: dt.date | None = None,
) -> Path:
    """Snapshot db_path into out_dir; return the backup file path.

    Raises FileNotFoundError if db_path does not exist.
    """
    db_path = Path(db_path)
    out_dir = Path(out_dir)
    if not db_path.is_file():
        raise FileNotFoundError(f"source DB not found: {db_path}")

    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = (today or dt.datetime.now(dt.timezone.utc).date()).isoformat()
    dest = out_dir / f"social-pip-{stamp}.db"

    # Remove a same-day backup so VACUUM INTO does not fail on an existing
    # file; makes the operation idempotent per date.
    if dest.exists():
        dest.unlink()

    con = sqlite3.connect(db_path)
    try:
        con.execute("VACUUM INTO ?", (str(dest),))
    finally:
        con.close()

    _prune_old_backups(out_dir, keep)
    return dest


def _prune_old_backups(out_dir: Path, keep: int) -> None:
    """Keep only the `keep` newest social-pip-*.db files in out_dir."""
    if keep <= 0:
        return
    backups = sorted(
        (p for p in out_dir.glob("social-pip-*.db") if p.is_file()),
        key=lambda p: p.name,  # ISO dates sort lexicographically
        reverse=True,
    )
    for old in backups[keep:]:
        old.unlink()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Backup the social-pip SQLite DB (VACUUM INTO snapshot).")
    parser.add_argument("--db", default=str(DEFAULT_DB), help=f"source DB path (default: {DEFAULT_DB})")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help=f"backup directory (default: {DEFAULT_OUT_DIR})")
    parser.add_argument("--keep", type=int, default=DEFAULT_KEEP, help=f"backups to retain (default: {DEFAULT_KEEP})")
    args = parser.parse_args(argv)

    try:
        dest = create_backup(args.db, out_dir=args.out_dir, keep=args.keep)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except sqlite3.Error as exc:
        print(f"ERROR: backup failed: {exc}", file=sys.stderr)
        return 3

    size_kb = dest.stat().st_size // 1024
    print(f"OK backup -> {dest} ({size_kb} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
