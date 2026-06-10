from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.app.ai_insights import mock_market_commentary
from backend.app.analytics import enrich_deal_detail, overview
from backend.app.database import get_distinct, init_db, list_all_deals
from backend.app.models import DealFilters


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = ROOT / "frontend" / "public" / "demo-data.json"


def build_demo_payload() -> dict[str, Any]:
    init_db()
    all_filters = DealFilters(data_source="all", limit=1000)
    public_filters = DealFilters(data_source="public", limit=1000)
    deals = list_all_deals(all_filters)
    public_deals = list_all_deals(public_filters)
    analytics_universe = public_deals if public_deals else deals
    analytics = overview(analytics_universe)
    detail_map: dict[str, Any] = {}
    for deal in deals:
        peer_set = [item for item in deals if item.get("data_source") == deal.get("data_source")]
        detail_map[str(deal["id"])] = enrich_deal_detail(deal, peer_set or deals)
    return {
        "metadata": {
            "sectors": get_distinct("sector"),
            "geographies": get_distinct("geography"),
            "buyer_types": get_distinct("buyer_type"),
            "data_sources": get_distinct("data_source"),
        },
        "deals": deals,
        "analyticsOverview": analytics,
        "sectorAnalytics": {
            "sector_momentum": analytics["scores"]["sector_momentum"],
            "median_multiples_by_sector": analytics["tables"]["median_multiples_by_sector"],
            "hot_sector_ranking": analytics["tables"]["hot_sector_ranking"],
        },
        "marketCommentary": mock_market_commentary(analytics),
        "dealDetails": detail_map,
    }


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(build_demo_payload(), indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
