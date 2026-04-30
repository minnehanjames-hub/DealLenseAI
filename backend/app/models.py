from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


BuyerType = Literal["Strategic", "Sponsor", "Corporate", "Family Office", "Other"]


class Deal(BaseModel):
    id: int
    target_company: str
    acquirer: str
    sector: str
    subsector: str
    geography: str
    announcement_date: str
    deal_value_musd: float | None = None
    revenue_musd: float | None = None
    ebitda_musd: float | None = None
    ev_revenue_multiple: float | None = None
    ev_ebitda_multiple: float | None = None
    buyer_type: BuyerType
    deal_type: str
    target_description: str
    rationale: str
    source_quality_score: float = Field(ge=0, le=1)
    confidence_score: float = Field(ge=0, le=1)


class DealFilters(BaseModel):
    sectors: list[str] | None = None
    geographies: list[str] | None = None
    buyer_types: list[BuyerType] | None = None
    min_deal_value: float | None = None
    max_deal_value: float | None = None
    date_from: str | None = None
    date_to: str | None = None
    multiple_availability: Literal["all", "revenue", "ebitda", "both"] = "all"
    limit: int = Field(default=500, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class CommentaryRequest(BaseModel):
    filters: DealFilters | None = None
    analytics: dict[str, Any] | None = None


class SectorReportRequest(BaseModel):
    sector: str
    filters: DealFilters | None = None


class HealthResponse(BaseModel):
    status: str
    database: str
    deals_loaded: int

