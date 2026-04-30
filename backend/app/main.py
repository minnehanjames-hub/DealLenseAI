from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .ai_insights import generate_market_commentary
from .analytics import enrich_deal_detail, overview, sector_snapshot, to_frame
from .database import deal_count, get_deal, get_distinct, init_db, list_all_deals, list_deals
from .models import CommentaryRequest, DealFilters, HealthResponse, SectorReportRequest
from .reports import build_sector_report_pdf

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(
    title="DealLenseAI API",
    description="M&A intelligence API for valuation trends, buyer behavior, sector momentum, AI commentary, and PDF reports.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def parse_filters(
    sector: Annotated[list[str] | None, Query(description="Filter by one or more sectors")] = None,
    geography: Annotated[list[str] | None, Query(description="Filter by one or more geographies")] = None,
    buyer_type: Annotated[list[str] | None, Query(description="Filter by buyer type")] = None,
    min_deal_value: Annotated[float | None, Query(ge=0)] = None,
    max_deal_value: Annotated[float | None, Query(ge=0)] = None,
    date_from: Annotated[str | None, Query(description="Inclusive YYYY-MM-DD start date")] = None,
    date_to: Annotated[str | None, Query(description="Inclusive YYYY-MM-DD end date")] = None,
    multiple_availability: Annotated[str, Query(pattern="^(all|revenue|ebitda|both)$")] = "all",
    limit: Annotated[int, Query(ge=1, le=1000)] = 500,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> DealFilters:
    return DealFilters(
        sectors=sector,
        geographies=geography,
        buyer_types=buyer_type,  # type: ignore[arg-type]
        min_deal_value=min_deal_value,
        max_deal_value=max_deal_value,
        date_from=date_from,
        date_to=date_to,
        multiple_availability=multiple_availability,  # type: ignore[arg-type]
        limit=limit,
        offset=offset,
    )


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    """Return API and database health information."""
    return HealthResponse(status="ok", database="sqlite", deals_loaded=deal_count())


@app.get("/metadata", tags=["deals"])
def metadata() -> dict[str, list[str]]:
    """Return distinct filter values for the frontend."""
    return {
        "sectors": get_distinct("sector"),
        "geographies": get_distinct("geography"),
        "buyer_types": get_distinct("buyer_type"),
    }


@app.get("/deals", tags=["deals"])
def deals(filters: Annotated[DealFilters, Depends(parse_filters)]) -> list[dict]:
    """List M&A transactions with optional dashboard filters."""
    parsed = filters if filters is not None else DealFilters()
    return list_deals(parsed)


@app.get("/deals/{deal_id}", tags=["deals"])
def deal_detail(deal_id: int) -> dict:
    """Return a single deal enriched with peer comparison, scores, red flags, and AI-style commentary."""
    deal = get_deal(deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return enrich_deal_detail(deal, list_all_deals())


@app.get("/analytics/overview", tags=["analytics"])
def analytics_overview(filters: Annotated[DealFilters, Depends(parse_filters)]) -> dict:
    """Return KPI, chart, scoring, ranking, and outlier analytics for filtered deals."""
    parsed = filters.model_copy(update={"limit": 1000, "offset": 0})
    return overview(list_all_deals(parsed))


@app.get("/analytics/sectors", tags=["analytics"])
def sector_analytics(filters: Annotated[DealFilters, Depends(parse_filters)]) -> dict:
    """Return sector-level rankings, valuation medians, and snapshots."""
    parsed = filters.model_copy(update={"limit": 1000, "offset": 0})
    analytics = overview(list_all_deals(parsed))
    return {
        "sector_momentum": analytics["scores"]["sector_momentum"],
        "median_multiples_by_sector": analytics["tables"]["median_multiples_by_sector"],
        "hot_sector_ranking": analytics["tables"]["hot_sector_ranking"],
    }


@app.get("/analytics/acquirers", tags=["analytics"])
def acquirer_analytics(filters: Annotated[DealFilters, Depends(parse_filters)]) -> dict:
    """Return top acquirers and proprietary-style aggressiveness scores."""
    parsed = filters.model_copy(update={"limit": 1000, "offset": 0})
    analytics = overview(list_all_deals(parsed))
    return {
        "top_acquirers": analytics["charts"]["top_acquirers"],
        "acquirer_aggressiveness": analytics["scores"]["acquirer_aggressiveness"],
    }


@app.post("/insights/commentary", tags=["insights"])
async def commentary(request: CommentaryRequest) -> dict:
    """Generate AI market commentary from structured analytics, with deterministic fallback."""
    analytics = request.analytics
    if analytics is None:
        filters = request.filters or DealFilters(limit=1000)
        filters = filters.model_copy(update={"limit": 1000, "offset": 0})
        analytics = overview(list_all_deals(filters))
    return await generate_market_commentary(analytics)


@app.post("/reports/sector", tags=["reports"])
async def sector_report(request: SectorReportRequest) -> StreamingResponse:
    """Generate a one-page sector snapshot PDF report."""
    filters = request.filters or DealFilters(limit=1000)
    filters = filters.model_copy(update={"limit": 1000, "offset": 0})
    if filters.sectors is None:
        filters.sectors = [request.sector]
    deals = list_all_deals(filters)
    df = to_frame(deals)
    snapshot = sector_snapshot(df, request.sector)
    analytics = overview(deals)
    commentary = await generate_market_commentary(analytics)
    pdf = build_sector_report_pdf(request.sector, snapshot, commentary)
    filename = f"DealLenseAI_{request.sector.replace(' ', '_')}_Snapshot.pdf"
    return StreamingResponse(
        BytesIO(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
