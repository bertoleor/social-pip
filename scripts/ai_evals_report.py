#!/usr/bin/env python3
"""Weekly ai_evals report: brand-validator pass rate + human like-rate by sector.

Usage:
    python scripts/ai_evals_report.py --db data/social-pip.db --week 2026-W37
    python scripts/ai_evals_report.py --db data/social-pip.db          # last complete ISO week

Reads the ai_evals table (scripts/ai_evals_schema.sql). Pure read — never writes.
Ticket t_4f143f7b (Propuesta 3, docs/audits/ia-propuesta-2026-09-14.md).
"""

from __future__ import annotations

import argparse
import datetime as dt
import sqlite3
import sys


def week_bounds(iso_week: str) -> tuple[str, str]:
    """'2026-W37' -> (monday, sunday) ISO dates, inclusive."""
    try:
        year_s, week_s = iso_week.split("-W")
        monday = dt.date.fromisocalendar(int(year_s), int(week_s), 1)
    except (ValueError, AttributeError):
        msg = f"invalid --week {iso_week!r}; expected format YYYY-Www (e.g. 2026-W37)"
        raise SystemExit(msg) from None
    return monday.isoformat(), (monday + dt.timedelta(days=6)).isoformat()


def last_completed_week(today: dt.date | None = None) -> str:
    today = today or dt.datetime.now().astimezone().date()
    last_monday = today - dt.timedelta(days=today.weekday() + 7)
    iso = last_monday.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


SectorStats = tuple[str, int, float, float | None]


def sector_stats(conn: sqlite3.Connection, start: str, end: str) -> list[SectorStats]:
    """Per sector: (n, brand_pass_rate, human_like_rate). like_rate ignores NULL."""
    rows = conn.execute(
        """
        SELECT sector,
               COUNT(*) AS n,
               SUM(brand_check) AS brand_ok,
               COUNT(like_humano) AS like_n,
               SUM(COALESCE(like_humano, 0)) AS like_ok
        FROM ai_evals
        WHERE fecha BETWEEN ? AND ?
        GROUP BY sector
        ORDER BY sector
        """,
        (start, end),
    ).fetchall()
    out = []
    for sector, n, brand_ok, like_n, like_ok in rows:
        brand_rate = 100.0 * brand_ok / n if n else 0.0
        like_rate = 100.0 * like_ok / like_n if like_n else None
        out.append((sector, n, brand_rate, like_rate))
    return out


def render(week: str, stats: list[SectorStats]) -> str:
    lines = [
        f"AI evals — reporte semanal {week}",
        "=" * 52,
        f"{'sector':<16}{'n':>4}{'brand_pass%':>13}{'like_humano%':>14}",
        "-" * 52,
    ]
    for sector, n, brand_rate, like_rate in stats:
        like_txt = f"{like_rate:.1f}" if like_rate is not None else "pending"
        lines.append(f"{sector:<16}{n:>4}{brand_rate:>12.1f}{like_txt:>14}")
    total = sum(n for _, n, _, _ in stats)
    lines.append("-" * 52)
    lines.append(f"total evals: {total}")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--db", required=True, help="path al SQLite con tabla ai_evals")
    parser.add_argument("--week", help="semana ISO YYYY-Www (default: última semana completa)")
    args = parser.parse_args(argv)

    week = args.week or last_completed_week()
    start, end = week_bounds(week)

    conn = sqlite3.connect(args.db)
    try:
        has_table = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='ai_evals'"
        ).fetchone()
        if not has_table:
            print(
                "ERROR: tabla ai_evals no existe. Aplicar scripts/ai_evals_schema.sql primero.",
                file=sys.stderr,
            )
            return 2
        stats = sector_stats(conn, start, end)
    finally:
        conn.close()

    if not stats:
        print(f"{week}: sin datos de ai_evals para la semana ({start}..{end})")
        return 0
    print(render(week, stats))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
