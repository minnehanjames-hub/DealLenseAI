from __future__ import annotations

import math
from typing import Any

import pandas as pd


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or pd.isna(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_series(series: pd.Series, neutral: float = 50.0) -> pd.Series:
    if series.empty:
        return series
    min_value = float(series.min())
    max_value = float(series.max())
    if math.isclose(min_value, max_value):
        return pd.Series([neutral] * len(series), index=series.index)
    return (series - min_value) / (max_value - min_value) * 100


def safe_median(series: pd.Series, default: float = 0.0) -> float:
    clean = series.dropna()
    if clean.empty:
        return default
    return safe_float(clean.median(), default)


def median_by_group(df: pd.DataFrame, group_column: str, value_column: str) -> dict[Any, float]:
    medians: dict[Any, float] = {}
    for key, group in df.groupby(group_column):
        medians[key] = safe_median(group[value_column], 0)
    return medians


def sector_momentum_scores(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []

    working = df.copy()
    working["announcement_date"] = pd.to_datetime(working["announcement_date"], errors="coerce")
    max_date = working["announcement_date"].max()
    recent_start = max_date - pd.DateOffset(months=6)
    prior_start = max_date - pd.DateOffset(months=12)

    rows: list[dict[str, Any]] = []
    for sector, sector_df in working.groupby("sector"):
        recent = sector_df[sector_df["announcement_date"] > recent_start]
        prior = sector_df[
            (sector_df["announcement_date"] <= recent_start)
            & (sector_df["announcement_date"] > prior_start)
        ]
        recent_count = len(recent)
        prior_count = len(prior)
        count_growth = (recent_count - prior_count) / max(prior_count, 1)

        recent_multiple = safe_median(recent["ev_ebitda_multiple"], 0)
        prior_multiple = safe_median(prior["ev_ebitda_multiple"], 0)
        multiple_expansion = (recent_multiple - prior_multiple) / prior_multiple if prior_multiple else 0

        sponsor_share = float((sector_df["buyer_type"] == "Sponsor").mean()) if len(sector_df) else 0
        confidence = safe_float(sector_df["confidence_score"].mean(), 0.75)
        recent_value = safe_float(recent["deal_value_musd"].sum(), 0)
        prior_value = safe_float(prior["deal_value_musd"].sum(), 0)
        value_growth = (recent_value - prior_value) / max(prior_value, 1)

        raw_score = (
            45
            + count_growth * 16
            + multiple_expansion * 18
            + sponsor_share * 14
            + (confidence - 0.7) * 55
            + value_growth * 7
        )
        rows.append(
            {
                "sector": sector,
                "score": round(clamp(raw_score), 1),
                "recent_deal_count": int(recent_count),
                "deal_count_growth": round(count_growth, 3),
                "median_multiple_expansion": round(multiple_expansion, 3),
                "sponsor_share": round(sponsor_share, 3),
                "confidence_score": round(confidence, 3),
                "deal_value_growth": round(value_growth, 3),
            }
        )

    return sorted(rows, key=lambda item: item["score"], reverse=True)


def deal_attractiveness_scores(
    df: pd.DataFrame,
    sector_scores: list[dict[str, Any]] | None = None,
) -> dict[int, float]:
    if df.empty:
        return {}

    sector_score_map = {item["sector"]: item["score"] for item in sector_scores or []}
    sector_median_multiple = median_by_group(df, "sector", "ev_ebitda_multiple")
    value_to_revenue = df["deal_value_musd"] / df["revenue_musd"].replace(0, pd.NA)
    growth_proxy = normalize_series(value_to_revenue.fillna(safe_median(value_to_revenue, 0)), neutral=55)

    scores: dict[int, float] = {}
    for idx, row in df.iterrows():
        sector_score = sector_score_map.get(row["sector"], 50)
        ebitda = safe_float(row["ebitda_musd"], 0)
        revenue = safe_float(row["revenue_musd"], 1)
        margin = clamp((ebitda / max(revenue, 1)) * 260, 0, 100)
        buyer_quality = {
            "Sponsor": 82,
            "Strategic": 78,
            "Corporate": 72,
            "Family Office": 66,
            "Other": 58,
        }.get(row["buyer_type"], 60)

        sector_median = safe_float(sector_median_multiple.get(row["sector"]), 10)
        deal_multiple = safe_float(row["ev_ebitda_multiple"], sector_median)
        valuation_reasonableness = clamp(100 - abs(deal_multiple - sector_median) / max(sector_median, 1) * 80)
        confidence = safe_float(row["confidence_score"], 0.75) * 100

        score = (
            sector_score * 0.24
            + margin * 0.18
            + safe_float(growth_proxy.loc[idx], 55) * 0.14
            + buyer_quality * 0.14
            + valuation_reasonableness * 0.18
            + confidence * 0.12
        )
        scores[int(row["id"])] = round(clamp(score), 1)
    return scores


def acquirer_aggressiveness_scores(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []

    working = df.copy()
    working["announcement_date"] = pd.to_datetime(working["announcement_date"], errors="coerce")
    sector_median = median_by_group(working, "sector", "ev_ebitda_multiple")
    working["sector_median_ev_ebitda"] = working["sector"].map(sector_median)
    working["multiple_premium"] = (
        working["ev_ebitda_multiple"] / working["sector_median_ev_ebitda"].replace(0, pd.NA) - 1
    )

    max_date = working["announcement_date"].max()
    recent_start = max_date - pd.DateOffset(months=9)

    grouped = working.groupby("acquirer").agg(
        acquisitions=("id", "count"),
        average_deal_value_musd=("deal_value_musd", "mean"),
        recent_activity=("announcement_date", lambda dates: int((dates > recent_start).sum())),
        primary_buyer_type=("buyer_type", lambda values: values.mode().iloc[0] if not values.mode().empty else "Other"),
    )
    premium_by_acquirer = median_by_group(working, "acquirer", "multiple_premium")
    grouped["median_multiple_premium"] = grouped.index.map(lambda acquirer: premium_by_acquirer.get(acquirer, 0))

    grouped["score"] = (
        normalize_series(grouped["acquisitions"], neutral=55) * 0.36
        + normalize_series(grouped["average_deal_value_musd"].fillna(0), neutral=50) * 0.22
        + normalize_series(grouped["median_multiple_premium"].fillna(0).infer_objects(copy=False), neutral=50) * 0.22
        + normalize_series(grouped["recent_activity"], neutral=50) * 0.20
    )

    records = grouped.reset_index().sort_values("score", ascending=False).head(20).to_dict("records")
    return [
        {
            "acquirer": item["acquirer"],
            "score": round(clamp(safe_float(item["score"], 0)), 1),
            "acquisitions": int(item["acquisitions"]),
            "average_deal_value_musd": round(safe_float(item["average_deal_value_musd"], 0), 1),
            "median_multiple_premium": round(safe_float(item["median_multiple_premium"], 0), 3),
            "recent_activity": int(item["recent_activity"]),
            "primary_buyer_type": item["primary_buyer_type"],
        }
        for item in records
    ]
