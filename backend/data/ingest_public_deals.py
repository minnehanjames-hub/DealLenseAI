from __future__ import annotations

import argparse
import csv
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import httpx


OUTPUT_PATH = Path(__file__).with_name("gdelt_public_deals.csv")
GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

FIELDNAMES = [
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

ACQUISITION_PATTERNS = [
    re.compile(r"(?P<acquirer>.+?)\s+to acquire\s+(?P<target>.+)", re.IGNORECASE),
    re.compile(r"(?P<acquirer>.+?)\s+agrees to acquire\s+(?P<target>.+)", re.IGNORECASE),
    re.compile(r"(?P<acquirer>.+?)\s+acquires\s+(?P<target>.+)", re.IGNORECASE),
    re.compile(r"(?P<acquirer>.+?)\s+buys\s+(?P<target>.+)", re.IGNORECASE),
]

VALUE_PATTERN = re.compile(
    r"(?:\$|US\$)\s?(?P<amount>\d+(?:\.\d+)?)\s?(?P<unit>billion|bn|m|million)",
    re.IGNORECASE,
)


def clean_name(value: str) -> str:
    value = re.split(r"\s[-–—|:]\s", value.strip())[0]
    value = re.sub(r"\s+in\s+\$.*$", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+for\s+\$.*$", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+\(.+?\)$", "", value)
    return value.strip(" .\"'")


def parse_parties(title: str) -> tuple[str, str] | None:
    for pattern in ACQUISITION_PATTERNS:
        match = pattern.search(title)
        if match:
            acquirer = clean_name(match.group("acquirer"))
            target = clean_name(match.group("target"))
            if 2 <= len(acquirer) <= 80 and 2 <= len(target) <= 100:
                return acquirer, target
    return None


def parse_deal_value(text: str) -> float | None:
    match = VALUE_PATTERN.search(text)
    if not match:
        return None
    amount = float(match.group("amount"))
    unit = match.group("unit").lower()
    if unit in {"billion", "bn"}:
        return round(amount * 1000, 1)
    return round(amount, 1)


def classify_sector(text: str) -> tuple[str, str]:
    lowered = text.lower()
    rules = [
        ("Software", "Software & Data", ["software", "cloud", "ai", "cyber", "data", "saas", "platform"]),
        ("Healthcare Services", "Healthcare", ["health", "pharma", "medical", "biotech", "clinical"]),
        ("Financial Services", "Financial Services", ["bank", "asset manager", "payments", "insurance", "fintech"]),
        ("Energy Transition", "Energy", ["energy", "oil", "gas", "solar", "battery", "renewable"]),
        ("Consumer", "Consumer Products", ["food", "snack", "retail", "consumer", "brand"]),
        ("Media & Entertainment", "Media & Telecom", ["media", "streaming", "wireless", "telecom", "sports"]),
        ("Industrials", "Industrial Products", ["industrial", "manufacturing", "aerospace", "defense"]),
        ("Business Services", "Business Services", ["services", "consulting", "outsourcing"]),
        ("Education", "Education", ["education", "learning", "school"]),
    ]
    for sector, subsector, keywords in rules:
        if any(keyword in lowered for keyword in keywords):
            return sector, subsector
    return "Business Services", "Public-company acquisition"


def article_date(article: dict[str, Any]) -> str:
    seen_date = str(article.get("seendate", ""))
    if len(seen_date) >= 8:
        return f"{seen_date[:4]}-{seen_date[4:6]}-{seen_date[6:8]}"
    return datetime.now(timezone.utc).date().isoformat()


def source_quality(domain: str) -> float:
    if any(domain.endswith(suffix) for suffix in [".gov", ".edu"]):
        return 0.9
    if any(token in domain for token in ["investor", "newsroom", "sec.gov"]):
        return 0.88
    return 0.72


def build_row(article: dict[str, Any], index: int) -> dict[str, Any] | None:
    title = str(article.get("title") or "").strip()
    parties = parse_parties(title)
    if not parties:
        return None

    acquirer, target = parties
    url = str(article.get("url") or "")
    domain = str(article.get("domain") or "")
    sector, subsector = classify_sector(" ".join([title, domain]))
    value = parse_deal_value(title)
    quality = source_quality(domain)
    confidence = 0.72 + (0.08 if value else 0) + (0.06 if quality >= 0.85 else 0)

    return {
        "id": 200000 + index,
        "target_company": target,
        "acquirer": acquirer,
        "sector": sector,
        "subsector": subsector,
        "geography": "Public source",
        "announcement_date": article_date(article),
        "deal_value_musd": value or "",
        "revenue_musd": "",
        "ebitda_musd": "",
        "ev_revenue_multiple": "",
        "ev_ebitda_multiple": "",
        "buyer_type": "Strategic",
        "deal_type": "Public-source candidate",
        "target_description": f"{target} was identified from a public acquisition headline.",
        "rationale": "Public-source acquisition candidate captured from news flow. Analyst review should verify terms and transaction status.",
        "source_quality_score": round(min(quality, 0.95), 2),
        "confidence_score": round(min(confidence, 0.9), 2),
        "data_source": "public",
        "source_name": domain or "GDELT source",
        "source_url": url,
        "source_type": "GDELT news candidate",
        "source_date": article_date(article),
        "verification_status": "Needs review",
        "extracted_at": datetime.now(timezone.utc).date().isoformat(),
        "filing_accession": "",
        "source_notes": f"GDELT headline: {title}",
    }


def fetch_articles(query: str, max_records: int) -> list[dict[str, Any]]:
    params = {
        "query": query,
        "mode": "artlist",
        "format": "json",
        "maxrecords": max_records,
        "sort": "datedesc",
    }
    url = f"{GDELT_DOC_URL}?{urlencode(params)}"
    with httpx.Client(timeout=40) as client:
        response = client.get(url)
        response.raise_for_status()
    payload = response.json()
    return list(payload.get("articles", []))


def write_rows(rows: list[dict[str, Any]], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch public acquisition candidates from GDELT.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--max-records", type=int, default=75)
    parser.add_argument(
        "--query",
        default='"to acquire" OR "agrees to acquire" OR acquires',
        help="GDELT DOC query. Keep this narrow to avoid noisy candidates.",
    )
    args = parser.parse_args()

    articles = fetch_articles(args.query, args.max_records)
    rows: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for article in articles:
        row = build_row(article, len(rows) + 1)
        if not row or row["source_url"] in seen_urls:
            continue
        seen_urls.add(row["source_url"])
        rows.append(row)

    # GDELT asks users to keep request rates low.
    time.sleep(5)
    write_rows(rows, args.output)
    print(f"Wrote {len(rows)} public acquisition candidates to {args.output}")


if __name__ == "__main__":
    main()
