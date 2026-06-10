from __future__ import annotations

import json
import os
from typing import Any

import httpx


def _top(items: list[dict[str, Any]], key: str = "score") -> dict[str, Any]:
    return items[0] if items else {}


def mock_market_commentary(analytics: dict[str, Any]) -> dict[str, Any]:
    kpis = analytics.get("kpis", {})
    charts = analytics.get("charts", {})
    scores = analytics.get("scores", {})
    sector_scores = scores.get("sector_momentum", [])
    buyer_distribution = charts.get("buyer_type_distribution", [])
    top_sector = _top(sector_scores)
    top_acquirer = _top(analytics.get("tables", {}).get("acquirer_aggressiveness", []))
    buyer_leader = buyer_distribution[0] if buyer_distribution else {}

    market_multiple = kpis.get("median_ev_ebitda", 0)
    hot_sector = top_sector.get("sector", kpis.get("most_active_sector", "the active sector set"))
    buyer_type = buyer_leader.get("buyer_type", "Strategic")
    acquirer = top_acquirer.get("acquirer", "repeat acquirers")

    multiple_comment = (
        f"Median EV/EBITDA across the filtered universe is {market_multiple}x, which gives analysts "
        "a useful benchmark for spotting premium-paid and discount transactions."
        if market_multiple
        else (
            "EV/EBITDA is not broadly disclosed across the filtered public-source universe, so valuation commentary "
            "should focus on announced consideration, buyer intent, and source quality."
        )
    )

    commentary = [
        (
            f"{hot_sector} is showing the strongest sector momentum, with a score of "
            f"{top_sector.get('score', 'n/a')} and recent deal flow supporting a hot-sector ranking."
        ),
        multiple_comment,
        (
            f"{buyer_type} buyers represent the largest share of current activity, suggesting buyer behavior "
            "is being driven by platform expansion, adjacency moves, or consolidation themes."
        ),
        (
            f"{acquirer} screens as one of the more aggressive acquirers based on repeat deal activity, "
            "average deal size, and willingness to pay relative to sector medians."
        ),
    ]

    return {
        "mode": "mock",
        "summary": "Structured analytics were converted into deterministic finance commentary.",
        "commentary": commentary,
        "watchpoints": [
            "Validate disclosed multiples against source documents before using outputs for investment decisions.",
            "Monitor whether recent multiple expansion is supported by revenue quality or simply scarcity value.",
            "Separate sponsor platform acquisitions from add-on transactions when assessing buyer intent.",
        ],
    }


async def generate_market_commentary(analytics: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return mock_market_commentary(analytics)

    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an M&A market intelligence analyst. Write concise professional commentary "
                    "using only the supplied structured analytics. Do not invent deal facts."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Summarize the following DealLenseAI dashboard analytics in 4 concise bullets, "
                    "then provide 3 watchpoints. Return JSON with keys commentary and watchpoints.\n\n"
                    + json.dumps(analytics, default=str)[:14000]
                ),
            },
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return {
            "mode": "llm",
            "summary": "OpenAI-compatible model generated commentary from structured analytics.",
            "commentary": parsed.get("commentary", []),
            "watchpoints": parsed.get("watchpoints", []),
        }
    except Exception as exc:
        fallback = mock_market_commentary(analytics)
        fallback["summary"] = f"LLM request failed; using deterministic fallback. Reason: {exc}"
        return fallback
