from __future__ import annotations

from typing import Any

import pandas as pd

from .scoring import (
    acquirer_aggressiveness_scores,
    deal_attractiveness_scores,
    sector_momentum_scores,
    safe_float,
)


def to_frame(deals: list[dict[str, Any]]) -> pd.DataFrame:
    df = pd.DataFrame(deals)
    if df.empty:
        return df
    numeric_columns = [
        "deal_value_musd",
        "revenue_musd",
        "ebitda_musd",
        "ev_revenue_multiple",
        "ev_ebitda_multiple",
        "source_quality_score",
        "confidence_score",
    ]
    for column in numeric_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df["announcement_date"] = pd.to_datetime(df["announcement_date"], errors="coerce")
    df["month"] = df["announcement_date"].dt.to_period("M").astype(str)
    df["quarter"] = df["announcement_date"].dt.to_period("Q").astype(str)
    return df


def median_multiples_by_sector(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []
    grouped = df.groupby("sector").agg(
        deal_count=("id", "count"),
        median_ev_revenue=("ev_revenue_multiple", "median"),
        median_ev_ebitda=("ev_ebitda_multiple", "median"),
        total_value_musd=("deal_value_musd", "sum"),
    )
    return [
        {
            "sector": sector,
            "deal_count": int(row["deal_count"]),
            "median_ev_revenue": round(safe_float(row["median_ev_revenue"]), 2),
            "median_ev_ebitda": round(safe_float(row["median_ev_ebitda"]), 2),
            "total_value_musd": round(safe_float(row["total_value_musd"]), 1),
        }
        for sector, row in grouped.sort_values("deal_count", ascending=False).iterrows()
    ]


def mean_multiples_by_sector(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []
    grouped = df.groupby("sector").agg(
        mean_ev_revenue=("ev_revenue_multiple", "mean"),
        mean_ev_ebitda=("ev_ebitda_multiple", "mean"),
        average_deal_value_musd=("deal_value_musd", "mean"),
    )
    return [
        {
            "sector": sector,
            "mean_ev_revenue": round(safe_float(row["mean_ev_revenue"]), 2),
            "mean_ev_ebitda": round(safe_float(row["mean_ev_ebitda"]), 2),
            "average_deal_value_musd": round(safe_float(row["average_deal_value_musd"]), 1),
        }
        for sector, row in grouped.sort_values("mean_ev_ebitda", ascending=False).iterrows()
    ]


def deal_count_by_period(df: pd.DataFrame, period: str = "month") -> list[dict[str, Any]]:
    if df.empty:
        return []
    grouped = df.groupby(period).agg(
        deals=("id", "count"),
        total_value_musd=("deal_value_musd", "sum"),
    )
    return [
        {
            "period": str(period_name),
            "deals": int(row["deals"]),
            "total_value_musd": round(safe_float(row["total_value_musd"]), 1),
        }
        for period_name, row in grouped.sort_index().iterrows()
    ]


def buyer_type_distribution(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []
    grouped = df.groupby("buyer_type").agg(
        deals=("id", "count"),
        median_ev_ebitda=("ev_ebitda_multiple", "median"),
        total_value_musd=("deal_value_musd", "sum"),
    )
    total = int(grouped["deals"].sum())
    return [
        {
            "buyer_type": buyer_type,
            "deals": int(row["deals"]),
            "share": round(int(row["deals"]) / max(total, 1), 3),
            "median_ev_ebitda": round(safe_float(row["median_ev_ebitda"]), 2),
            "total_value_musd": round(safe_float(row["total_value_musd"]), 1),
        }
        for buyer_type, row in grouped.sort_values("deals", ascending=False).iterrows()
    ]


def top_acquirers(df: pd.DataFrame, limit: int = 10) -> list[dict[str, Any]]:
    if df.empty:
        return []
    grouped = df.groupby("acquirer").agg(
        deals=("id", "count"),
        total_value_musd=("deal_value_musd", "sum"),
        median_ev_ebitda=("ev_ebitda_multiple", "median"),
        buyer_type=("buyer_type", lambda values: values.mode().iloc[0] if not values.mode().empty else "Other"),
    )
    return [
        {
            "acquirer": acquirer,
            "deals": int(row["deals"]),
            "total_value_musd": round(safe_float(row["total_value_musd"]), 1),
            "median_ev_ebitda": round(safe_float(row["median_ev_ebitda"]), 2),
            "buyer_type": row["buyer_type"],
        }
        for acquirer, row in grouped.sort_values("deals", ascending=False).head(limit).iterrows()
    ]


def valuation_premium_by_buyer_type(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []
    market_median = safe_float(df["ev_ebitda_multiple"].median(), 0)
    grouped = df.groupby("buyer_type")["ev_ebitda_multiple"].median().dropna()
    return [
        {
            "buyer_type": buyer_type,
            "median_ev_ebitda": round(safe_float(multiple), 2),
            "premium_to_market": round((safe_float(multiple) / market_median - 1), 3) if market_median else 0,
        }
        for buyer_type, multiple in grouped.sort_values(ascending=False).items()
    ]


def detect_outliers(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty or df["ev_ebitda_multiple"].dropna().empty:
        return []
    q1 = df["ev_ebitda_multiple"].quantile(0.25)
    q3 = df["ev_ebitda_multiple"].quantile(0.75)
    iqr = q3 - q1
    low = q1 - 1.5 * iqr
    high = q3 + 1.5 * iqr
    outlier_df = df[(df["ev_ebitda_multiple"] < low) | (df["ev_ebitda_multiple"] > high)].copy()
    outlier_df["outlier_direction"] = outlier_df["ev_ebitda_multiple"].apply(lambda value: "High" if value > high else "Low")
    return [
        {
            "id": int(row["id"]),
            "target_company": row["target_company"],
            "sector": row["sector"],
            "ev_ebitda_multiple": round(safe_float(row["ev_ebitda_multiple"]), 2),
            "direction": row["outlier_direction"],
        }
        for _, row in outlier_df.sort_values("ev_ebitda_multiple", ascending=False).head(12).iterrows()
    ]


def deal_value_distribution(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []
    bins = [0, 50, 100, 250, 500, 1000, 2500, 100000]
    labels = ["<$50M", "$50-100M", "$100-250M", "$250-500M", "$500M-1B", "$1-2.5B", ">$2.5B"]
    bucketed = pd.cut(df["deal_value_musd"], bins=bins, labels=labels, include_lowest=True)
    counts = bucketed.value_counts(sort=False)
    return [{"bucket": str(bucket), "deals": int(count)} for bucket, count in counts.items()]


def sector_snapshot(df: pd.DataFrame, sector: str) -> dict[str, Any]:
    sector_df = df[df["sector"] == sector] if not df.empty else df
    if sector_df.empty:
        return {
            "sector": sector,
            "deal_count": 0,
            "median_ev_revenue": None,
            "median_ev_ebitda": None,
            "top_acquirers": [],
            "buyer_distribution": [],
            "recent_deals": [],
        }
    return {
        "sector": sector,
        "deal_count": int(len(sector_df)),
        "median_ev_revenue": round(safe_float(sector_df["ev_revenue_multiple"].median()), 2),
        "median_ev_ebitda": round(safe_float(sector_df["ev_ebitda_multiple"].median()), 2),
        "total_value_musd": round(safe_float(sector_df["deal_value_musd"].sum()), 1),
        "top_acquirers": top_acquirers(sector_df, limit=5),
        "buyer_distribution": buyer_type_distribution(sector_df),
        "recent_deals": [
            {
                "id": int(row["id"]),
                "target_company": row["target_company"],
                "acquirer": row["acquirer"],
                "announcement_date": row["announcement_date"].strftime("%Y-%m-%d"),
                "deal_value_musd": round(safe_float(row["deal_value_musd"]), 1),
                "ev_ebitda_multiple": round(safe_float(row["ev_ebitda_multiple"]), 2),
            }
            for _, row in sector_df.sort_values("announcement_date", ascending=False).head(6).iterrows()
        ],
    }


def overview(deals: list[dict[str, Any]]) -> dict[str, Any]:
    df = to_frame(deals)
    if df.empty:
        return {
            "kpis": {},
            "charts": {},
            "tables": {},
            "scores": {},
            "outliers": [],
            "filters": {},
            "deal_scores": {},
        }

    sector_scores = sector_momentum_scores(df)
    acquirer_scores = acquirer_aggressiveness_scores(df)
    deal_scores = deal_attractiveness_scores(df, sector_scores)
    sector_counts = df["sector"].value_counts()
    buyer_distribution = buyer_type_distribution(df)
    strategic_count = int((df["buyer_type"] == "Strategic").sum() + (df["buyer_type"] == "Corporate").sum())
    sponsor_count = int((df["buyer_type"] == "Sponsor").sum())

    kpis = {
        "total_deals": int(len(df)),
        "total_disclosed_value_musd": round(safe_float(df["deal_value_musd"].sum()), 1),
        "median_ev_revenue": round(safe_float(df["ev_revenue_multiple"].median()), 2),
        "median_ev_ebitda": round(safe_float(df["ev_ebitda_multiple"].median()), 2),
        "most_active_sector": sector_counts.index[0] if not sector_counts.empty else "N/A",
        "strategic_vs_sponsor_split": {
            "strategic_or_corporate": strategic_count,
            "sponsor": sponsor_count,
            "other": int(len(df) - strategic_count - sponsor_count),
        },
    }

    charts = {
        "deal_volume_over_time": deal_count_by_period(df, "month"),
        "deal_count_by_quarter": deal_count_by_period(df, "quarter"),
        "average_ev_ebitda_by_sector": mean_multiples_by_sector(df),
        "buyer_type_distribution": buyer_distribution,
        "deal_value_distribution": deal_value_distribution(df),
        "top_acquirers": top_acquirers(df, limit=10),
        "sector_momentum": sector_scores,
        "valuation_premium_by_buyer_type": valuation_premium_by_buyer_type(df),
    }

    tables = {
        "median_multiples_by_sector": median_multiples_by_sector(df),
        "mean_multiples_by_sector": mean_multiples_by_sector(df),
        "hot_sector_ranking": sector_scores,
        "acquirer_aggressiveness": acquirer_scores,
    }

    filters = {
        "sectors": sorted(df["sector"].dropna().unique().tolist()),
        "geographies": sorted(df["geography"].dropna().unique().tolist()),
        "buyer_types": sorted(df["buyer_type"].dropna().unique().tolist()),
    }

    return {
        "kpis": kpis,
        "charts": charts,
        "tables": tables,
        "scores": {
            "sector_momentum": sector_scores,
            "acquirer_aggressiveness": acquirer_scores,
        },
        "outliers": detect_outliers(df),
        "filters": filters,
        "deal_scores": deal_scores,
    }


def enrich_deal_detail(deal: dict[str, Any], all_deals: list[dict[str, Any]]) -> dict[str, Any]:
    df = to_frame(all_deals)
    sector = deal["sector"]
    sector_df = df[df["sector"] == sector] if not df.empty else df
    sector_scores = sector_momentum_scores(df)
    deal_scores = deal_attractiveness_scores(df, sector_scores)
    sector_median = safe_float(sector_df["ev_ebitda_multiple"].median(), 0) if not sector_df.empty else 0
    selected_value = safe_float(deal.get("deal_value_musd"), 0)
    selected_multiple = safe_float(deal.get("ev_ebitda_multiple"), sector_median)

    similar = sector_df[sector_df["id"] != deal["id"]].copy()
    if not similar.empty:
        similar["distance"] = (similar["deal_value_musd"] - selected_value).abs()
        similar_records = similar.sort_values(["distance", "announcement_date"]).head(6)
    else:
        similar_records = similar

    red_flags: list[str] = []
    confidence = safe_float(deal.get("confidence_score"), 0)
    if confidence < 0.72:
        red_flags.append("Lower confidence score; diligence should confirm source quality and disclosed metrics.")
    if sector_median and selected_multiple > sector_median * 1.35:
        red_flags.append("Purchase multiple screens above the sector median, increasing integration and growth execution risk.")
    if safe_float(deal.get("ebitda_musd"), 0) / max(safe_float(deal.get("revenue_musd"), 1), 1) < 0.12:
        red_flags.append("EBITDA margin is below the peer set, suggesting possible operating leverage or quality-of-earnings work.")
    if not red_flags:
        red_flags.append("No major quantitative red flags identified in the synthetic dataset.")

    commentary = (
        f"{deal['target_company']} screens as a {deal['sector']} transaction with an estimated "
        f"{selected_multiple:.1f}x EV/EBITDA multiple versus a sector median of {sector_median:.1f}x. "
        f"The stated rationale emphasizes {deal['rationale'].lower()}"
    )

    enriched = dict(deal)
    enriched.update(
        {
            "attractiveness_score": deal_scores.get(int(deal["id"]), 0),
            "peer_comparison": {
                "sector": sector,
                "sector_deal_count": int(len(sector_df)),
                "sector_median_ev_revenue": round(safe_float(sector_df["ev_revenue_multiple"].median()), 2)
                if not sector_df.empty
                else None,
                "sector_median_ev_ebitda": round(sector_median, 2) if sector_median else None,
                "premium_to_sector_median": round(selected_multiple / sector_median - 1, 3)
                if sector_median
                else None,
            },
            "ai_deal_commentary": commentary,
            "red_flags": red_flags,
            "similar_transactions": [
                {
                    "id": int(row["id"]),
                    "target_company": row["target_company"],
                    "acquirer": row["acquirer"],
                    "announcement_date": row["announcement_date"].strftime("%Y-%m-%d"),
                    "deal_value_musd": round(safe_float(row["deal_value_musd"]), 1),
                    "ev_ebitda_multiple": round(safe_float(row["ev_ebitda_multiple"]), 2),
                    "buyer_type": row["buyer_type"],
                }
                for _, row in similar_records.iterrows()
            ],
        }
    )
    return enriched

