from __future__ import annotations

import csv
import os
import sqlite3
from pathlib import Path
from typing import Any

from .models import DealFilters

APP_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = APP_ROOT / "data"
CSV_PATH = DATA_DIR / "seed_deals.csv"
DEFAULT_DB_PATH = APP_ROOT / "deallense.db"


DEAL_COLUMNS = [
    "id",
    "target_company",
    "acquirer",
    "sector",
    "subsector",
    "geography",
    "announcement_date",
    "deal_value_musd",
    "revenue_musd",
    "ebitda_musd",
    "ev_revenue_multiple",
    "ev_ebitda_multiple",
    "buyer_type",
    "deal_type",
    "target_description",
    "rationale",
    "source_quality_score",
    "confidence_score",
]


def database_path() -> Path:
    configured = os.getenv("DATABASE_PATH")
    if not configured:
        return DEFAULT_DB_PATH
    path = Path(configured).expanduser()
    if path.is_absolute():
        return path
    return Path(__file__).resolve().parents[2] / path


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(database_path())
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS deals (
                id INTEGER PRIMARY KEY,
                target_company TEXT NOT NULL,
                acquirer TEXT NOT NULL,
                sector TEXT NOT NULL,
                subsector TEXT NOT NULL,
                geography TEXT NOT NULL,
                announcement_date TEXT NOT NULL,
                deal_value_musd REAL,
                revenue_musd REAL,
                ebitda_musd REAL,
                ev_revenue_multiple REAL,
                ev_ebitda_multiple REAL,
                buyer_type TEXT NOT NULL,
                deal_type TEXT NOT NULL,
                target_description TEXT NOT NULL,
                rationale TEXT NOT NULL,
                source_quality_score REAL NOT NULL,
                confidence_score REAL NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_deals_sector ON deals(sector)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_deals_date ON deals(announcement_date)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_deals_buyer_type ON deals(buyer_type)")

        existing_count = conn.execute("SELECT COUNT(*) FROM deals").fetchone()[0]
        csv_count = count_seed_rows()
        if csv_count and existing_count != csv_count:
            conn.execute("DELETE FROM deals")
            seed_from_csv(conn)
        conn.commit()


def count_seed_rows() -> int:
    if not CSV_PATH.exists():
        return 0
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        return max(sum(1 for _ in handle) - 1, 0)


def seed_from_csv(conn: sqlite3.Connection) -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing seed data at {CSV_PATH}")

    placeholders = ",".join("?" for _ in DEAL_COLUMNS)
    insert_sql = f"INSERT INTO deals ({','.join(DEAL_COLUMNS)}) VALUES ({placeholders})"
    rows: list[list[Any]] = []
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append([coerce_value(row.get(column, "")) for column in DEAL_COLUMNS])

    conn.executemany(insert_sql, rows)


def coerce_value(value: str | None) -> Any:
    if value is None or value == "":
        return None
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value


def build_where(filters: DealFilters | None) -> tuple[str, list[Any]]:
    if filters is None:
        return "", []

    clauses: list[str] = []
    params: list[Any] = []

    if filters.sectors:
        placeholders = ",".join("?" for _ in filters.sectors)
        clauses.append(f"sector IN ({placeholders})")
        params.extend(filters.sectors)

    if filters.geographies:
        placeholders = ",".join("?" for _ in filters.geographies)
        clauses.append(f"geography IN ({placeholders})")
        params.extend(filters.geographies)

    if filters.buyer_types:
        placeholders = ",".join("?" for _ in filters.buyer_types)
        clauses.append(f"buyer_type IN ({placeholders})")
        params.extend(filters.buyer_types)

    if filters.min_deal_value is not None:
        clauses.append("deal_value_musd >= ?")
        params.append(filters.min_deal_value)

    if filters.max_deal_value is not None:
        clauses.append("deal_value_musd <= ?")
        params.append(filters.max_deal_value)

    if filters.date_from:
        clauses.append("announcement_date >= ?")
        params.append(filters.date_from)

    if filters.date_to:
        clauses.append("announcement_date <= ?")
        params.append(filters.date_to)

    if filters.multiple_availability == "revenue":
        clauses.append("ev_revenue_multiple IS NOT NULL")
    elif filters.multiple_availability == "ebitda":
        clauses.append("ev_ebitda_multiple IS NOT NULL")
    elif filters.multiple_availability == "both":
        clauses.append("ev_revenue_multiple IS NOT NULL")
        clauses.append("ev_ebitda_multiple IS NOT NULL")

    if not clauses:
        return "", params

    return "WHERE " + " AND ".join(clauses), params


def list_deals(filters: DealFilters | None = None) -> list[dict[str, Any]]:
    where_sql, params = build_where(filters)
    limit = filters.limit if filters else 500
    offset = filters.offset if filters else 0
    sql = f"""
        SELECT {",".join(DEAL_COLUMNS)}
        FROM deals
        {where_sql}
        ORDER BY announcement_date DESC, id DESC
        LIMIT ? OFFSET ?
    """
    with get_connection() as conn:
        rows = conn.execute(sql, [*params, limit, offset]).fetchall()
    return [dict(row) for row in rows]


def list_all_deals(filters: DealFilters | None = None) -> list[dict[str, Any]]:
    if filters:
        filters = filters.model_copy(update={"limit": 1000, "offset": 0})
    where_sql, params = build_where(filters)
    sql = f"""
        SELECT {",".join(DEAL_COLUMNS)}
        FROM deals
        {where_sql}
        ORDER BY announcement_date DESC, id DESC
    """
    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(row) for row in rows]


def get_deal(deal_id: int) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            f"SELECT {','.join(DEAL_COLUMNS)} FROM deals WHERE id = ?",
            (deal_id,),
        ).fetchone()
    return dict(row) if row else None


def get_distinct(field: str) -> list[str]:
    if field not in {"sector", "geography", "buyer_type", "subsector", "acquirer"}:
        raise ValueError(f"Unsupported distinct field: {field}")
    with get_connection() as conn:
        rows = conn.execute(f"SELECT DISTINCT {field} FROM deals ORDER BY {field}").fetchall()
    return [row[0] for row in rows]


def deal_count() -> int:
    with get_connection() as conn:
        return int(conn.execute("SELECT COUNT(*) FROM deals").fetchone()[0])
