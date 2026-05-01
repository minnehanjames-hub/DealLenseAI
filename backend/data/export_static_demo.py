from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.app.ai_insights import mock_market_commentary
from backend.app.analytics import enrich_deal_detail, overview
from backend.app.database import get_distinct, init_db, list_all_deals


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = ROOT / "frontend" / "public" / "demo-data.json"


def build_demo_payload() -> dict[str, Any]:
    init_db()
    deals = list_all_deals()
    analytics = overview(deals)
    return {
        "metadata": {
            "sectors": get_distinct("sector"),
            "geographies": get_distinct("geography"),
            "buyer_types": get_distinct("buyer_type"),
        },
        "deals": deals,
        "analyticsOverview": analytics,
        "sectorAnalytics": {
            "sector_momentum": analytics["scores"]["sector_momentum"],
            "median_multiples_by_sector": analytics["tables"]["median_multiples_by_sector"],
            "hot_sector_ranking": analytics["tables"]["hot_sector_ranking"],
        },
        "marketCommentary": mock_market_commentary(analytics),
        "dealDetails": {str(deal["id"]): enrich_deal_detail(deal, deals) for deal in deals},
    }


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(build_demo_payload(), indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
