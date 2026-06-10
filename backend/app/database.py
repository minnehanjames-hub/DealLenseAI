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
REAL_PUBLIC_CSV_PATH = DATA_DIR / "real_public_deals.csv"
GDELT_PUBLIC_CSV_PATH = DATA_DIR / "gdelt_public_deals.csv"
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
    "data_source",
    "source_name",
    "source_url",
    "source_type",
    "source_date",
    "verification_status",
    "extracted_at",
    "filing_accession",
    "source_notes",
]

COLUMN_DEFINITIONS = {
    "id": "INTEGER PRIMARY KEY",
    "target_company": "TEXT NOT NULL",
    "acquirer": "TEXT NOT NULL",
    "sector": "TEXT NOT NULL",
    "subsector": "TEXT NOT NULL",
    "geography": "TEXT NOT NULL",
    "announcement_date": "TEXT NOT NULL",
    "deal_value_musd": "REAL",
    "revenue_musd": "REAL",
    "ebitda_musd": "REAL",
    "ev_revenue_multiple": "REAL",
    "ev_ebitda_multiple": "REAL",
    "buyer_type": "TEXT NOT NULL",
    "deal_type": "TEXT NOT NULL",
    "target_description": "TEXT NOT NULL",
    "rationale": "TEXT NOT NULL",
    "source_quality_score": "REAL NOT NULL",
    "confidence_score": "REAL NOT NULL",
    "data_source": "TEXT NOT NULL DEFAULT 'synthetic'",
    "source_name": "TEXT",
    "source_url": "TEXT",
    "source_type": "TEXT",
    "source_date": "TEXT",
    "verification_status": "TEXT",
    "extracted_at": "TEXT",
    "filing_accession": "TEXT",
    "source_notes": "TEXT",
}


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
            f"""
            CREATE TABLE IF NOT EXISTS deals (
                {",".join(f"{column} {definition}" for column, definition in COLUMN_DEFINITIONS.items())}
            )
            """
        )
        ensure_columns(conn)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_deals_sector ON deals(sector)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_deals_date ON deals(announcement_date)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_deals_buyer_type ON deals(buyer_type)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_deals_data_source ON deals(data_source)")

        csv_count = expected_seed_count()
        if csv_count and not seed_state_is_current(conn, csv_count):
            conn.execute("DELETE FROM deals")
            seed_all_sources(conn)
        conn.commit()


def ensure_columns(conn: sqlite3.Connection) -> None:
    existing = {row["name"] for row in conn.execute("PRAGMA table_info(deals)").fetchall()}
    for column, definition in COLUMN_DEFINITIONS.items():
        if column not in existing:
            conn.execute(f"ALTER TABLE deals ADD COLUMN {column} {definition}")


def count_seed_rows() -> int:
    if not CSV_PATH.exists():
        return 0
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        return max(sum(1 for _ in handle) - 1, 0)


def count_rows(path: Path) -> int:
    if not path.exists():
        return 0
    with path.open("r", encoding="utf-8", newline="") as handle:
        return max(sum(1 for _ in handle) - 1, 0)


def expected_seed_count() -> int:
    return sum(count_rows(path) for path in public_seed_paths()) + count_rows(CSV_PATH)


def seed_state_is_current(conn: sqlite3.Connection, expected_total: int) -> bool:
    existing_count = conn.execute("SELECT COUNT(*) FROM deals").fetchone()[0]
    public_count = conn.execute("SELECT COUNT(*) FROM deals WHERE data_source = 'public'").fetchone()[0]
    synthetic_count = conn.execute("SELECT COUNT(*) FROM deals WHERE data_source = 'synthetic'").fetchone()[0]
    return (
        existing_count == expected_total
        and synthetic_count == count_rows(CSV_PATH)
        and public_count == sum(count_rows(path) for path in public_seed_paths())
    )


def public_seed_paths() -> list[Path]:
    return [path for path in [REAL_PUBLIC_CSV_PATH, GDELT_PUBLIC_CSV_PATH] if path.exists()]


def seed_all_sources(conn: sqlite3.Connection) -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing seed data at {CSV_PATH}")
    seed_from_csv(conn, CSV_PATH, fallback_source="synthetic")
    for path in public_seed_paths():
        seed_from_csv(conn, path, fallback_source="public")


def seed_from_csv(conn: sqlite3.Connection, path: Path, fallback_source: str) -> None:
    placeholders = ",".join("?" for _ in DEAL_COLUMNS)
    insert_sql = f"INSERT INTO deals ({','.join(DEAL_COLUMNS)}) VALUES ({placeholders})"
    rows: list[list[Any]] = []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            normalized = with_source_defaults(row, fallback_source)
            rows.append([coerce_value(normalized.get(column, "")) for column in DEAL_COLUMNS])

    conn.executemany(insert_sql, rows)


def with_source_defaults(row: dict[str, str], fallback_source: str) -> dict[str, str]:
    normalized = dict(row)
    data_source = normalized.get("data_source") or fallback_source
    normalized.setdefault("data_source", data_source)
    normalized.setdefault("source_name", "Synthetic demo dataset" if data_source == "synthetic" else "")
    normalized.setdefault("source_url", "")
    normalized.setdefault("source_type", "Synthetic seed" if data_source == "synthetic" else "Public announcement")
    normalized.setdefault("source_date", normalized.get("announcement_date", ""))
    normalized.setdefault("verification_status", "Synthetic demo" if data_source == "synthetic" else "Source-backed")
    normalized.setdefault("extracted_at", "")
    normalized.setdefault("filing_accession", "")
    normalized.setdefault(
        "source_notes",
        "Fictional record generated for product demo."
        if data_source == "synthetic"
        else "Public-source transaction record. Metrics only included when disclosed by the source.",
    )
    return normalized


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

    if filters.data_source != "all":
        clauses.append("data_source = ?")
        params.append(filters.data_source)

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
    if field not in {"sector", "geography", "buyer_type", "subsector", "acquirer", "data_source", "source_type"}:
        raise ValueError(f"Unsupported distinct field: {field}")
    with get_connection() as conn:
        rows = conn.execute(f"SELECT DISTINCT {field} FROM deals ORDER BY {field}").fetchall()
    return [row[0] for row in rows]


def deal_count(data_source: str | None = None) -> int:
    where = ""
    params: list[Any] = []
    if data_source:
        where = "WHERE data_source = ?"
        params.append(data_source)
    with get_connection() as conn:
        return int(conn.execute(f"SELECT COUNT(*) FROM deals {where}", params).fetchone()[0])
