from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path


random.seed(42)

OUTPUT_PATH = Path(__file__).with_name("seed_deals.csv")

SECTORS = {
    "Software": {
        "subsectors": ["Vertical SaaS", "Cybersecurity", "Data Infrastructure", "FinTech Software", "DevOps"],
        "ev_revenue": (4.2, 12.5),
        "ev_ebitda": (13.0, 26.5),
        "margin": (0.18, 0.38),
    },
    "Healthcare Services": {
        "subsectors": ["Specialty Physician", "Behavioral Health", "Home Health", "Revenue Cycle", "Dental Services"],
        "ev_revenue": (1.2, 4.6),
        "ev_ebitda": (8.0, 16.5),
        "margin": (0.12, 0.28),
    },
    "Consumer": {
        "subsectors": ["Food & Beverage", "Pet Products", "Outdoor Goods", "Specialty Retail", "Household Products"],
        "ev_revenue": (1.0, 4.2),
        "ev_ebitda": (7.0, 15.0),
        "margin": (0.10, 0.24),
    },
    "Industrials": {
        "subsectors": ["Automation", "Engineered Components", "Packaging", "Testing & Inspection", "Specialty Manufacturing"],
        "ev_revenue": (0.9, 3.6),
        "ev_ebitda": (7.5, 14.5),
        "margin": (0.11, 0.25),
    },
    "Financial Services": {
        "subsectors": ["Insurance Brokerage", "Wealth Management", "Payments", "Specialty Lending", "Compliance Tech"],
        "ev_revenue": (1.8, 6.5),
        "ev_ebitda": (9.0, 18.0),
        "margin": (0.16, 0.34),
    },
    "Business Services": {
        "subsectors": ["Facility Services", "IT Services", "Consulting", "Human Capital", "BPO"],
        "ev_revenue": (1.1, 4.0),
        "ev_ebitda": (8.0, 15.5),
        "margin": (0.12, 0.26),
    },
    "Energy Transition": {
        "subsectors": ["Solar Services", "EV Infrastructure", "Grid Software", "Battery Services", "Efficiency Services"],
        "ev_revenue": (1.6, 7.2),
        "ev_ebitda": (9.5, 20.0),
        "margin": (0.10, 0.27),
    },
    "Media & Entertainment": {
        "subsectors": ["Digital Media", "Sports Media", "Creator Tools", "Live Events", "Gaming Services"],
        "ev_revenue": (1.4, 5.5),
        "ev_ebitda": (8.0, 17.5),
        "margin": (0.09, 0.25),
    },
    "Education": {
        "subsectors": ["Workforce Training", "EdTech", "K-12 Services", "Test Prep", "Professional Learning"],
        "ev_revenue": (1.5, 5.8),
        "ev_ebitda": (8.5, 17.0),
        "margin": (0.11, 0.27),
    },
    "Beauty & Wellness": {
        "subsectors": ["Medical Spa", "Skincare", "Fitness", "Wellness Services", "Personal Care Brands"],
        "ev_revenue": (1.2, 5.0),
        "ev_ebitda": (8.5, 16.0),
        "margin": (0.12, 0.30),
    },
}

BUYER_TYPES = ["Strategic", "Sponsor", "Corporate", "Family Office", "Other"]
GEOGRAPHIES = ["North America", "Western Europe", "United Kingdom", "Nordics", "APAC", "Latin America"]
DEAL_TYPES = ["Platform", "Add-on", "Carve-out", "Growth recapitalization", "Take-private", "Merger"]

ACQUIRERS = {
    "Strategic": [
        "Apex Systems Holdings",
        "Northstar Health Group",
        "HarborPoint Brands",
        "BlueRiver Industrials",
        "Meridian Financial Group",
        "Crescent Business Solutions",
        "VoltEdge Energy",
        "Summit Media Network",
        "BrightPath Learning",
        "EverBloom Consumer Health",
    ],
    "Sponsor": [
        "Arbor Ridge Capital",
        "Cobalt Peak Partners",
        "Stonebridge Equity",
        "Hudson Vale Capital",
        "Mariner Growth Partners",
        "Ironcrest Partners",
        "Redwood Harbor Capital",
        "Westlake Sponsor Group",
    ],
    "Corporate": [
        "Atlas Enterprise Group",
        "Pacific Consolidated",
        "Keystone Operating Company",
        "UnionBridge Holdings",
        "Lattice Global",
    ],
    "Family Office": [
        "Briar Hall Holdings",
        "Juniper Family Capital",
        "Longview Legacy Partners",
        "Sage Rock Holdings",
    ],
    "Other": ["Management Investor Group", "Founder Consortium", "Search Fund Partners", "Evergreen Holding Co."],
}

PREFIXES = [
    "Aster",
    "Beacon",
    "Cedar",
    "Drift",
    "Elm",
    "Forge",
    "Granite",
    "Helio",
    "Ivy",
    "Juniper",
    "Kite",
    "Lumen",
    "Mosaic",
    "Noble",
    "Orion",
    "Prairie",
    "Quartz",
    "Ridge",
    "Signal",
    "Terra",
    "Umbra",
    "Vector",
    "Willow",
    "Yardley",
]

SUFFIXES = {
    "Software": ["Cloud", "Logic", "Stack", "Labs", "Systems", "Analytics"],
    "Healthcare Services": ["Care", "Health", "Clinics", "Partners", "Medical"],
    "Consumer": ["Brands", "Goods", "Market", "Foods", "Products"],
    "Industrials": ["Works", "Components", "Automation", "Manufacturing", "Controls"],
    "Financial Services": ["Advisors", "Financial", "Payments", "Risk", "Capital Services"],
    "Business Services": ["Solutions", "Services", "Group", "Partners", "Operations"],
    "Energy Transition": ["Energy", "Grid", "Solar", "Mobility", "Renewables"],
    "Media & Entertainment": ["Studios", "Media", "Network", "Interactive", "Events"],
    "Education": ["Learning", "Academy", "Skills", "Education", "Training"],
    "Beauty & Wellness": ["Wellness", "Aesthetics", "Beauty", "Life", "Spa Group"],
}

RATIONALES = [
    "Adds recurring revenue and expands cross-sell opportunities across an installed customer base.",
    "Creates a regional consolidation platform in a fragmented market with clear add-on potential.",
    "Broadens product capabilities and strengthens the acquirer's vertical specialization.",
    "Accelerates entry into a higher-growth subsector with attractive margin expansion potential.",
    "Combines complementary customer relationships and increases density in priority geographies.",
    "Supports a buy-and-build strategy with operational synergies and procurement leverage.",
    "Adds proprietary data, workflow depth, or specialized talent that improves competitive positioning.",
    "Provides scale benefits and creates a stronger platform for strategic or sponsor exit optionality.",
]


def random_date(index: int) -> date:
    start = date(2021, 1, 5)
    base = start + timedelta(days=index * 11)
    jitter = timedelta(days=random.randint(0, 25))
    return min(base + jitter, date(2026, 3, 28))


def company_name(sector: str, index: int) -> str:
    prefix = PREFIXES[(index + random.randint(0, len(PREFIXES) - 1)) % len(PREFIXES)]
    suffix = random.choice(SUFFIXES[sector])
    return f"{prefix} {suffix}"


def rounded(value: float, digits: int = 1) -> float:
    return round(value, digits)


def build_row(index: int) -> dict[str, object]:
    sector = list(SECTORS)[index % len(SECTORS)]
    config = SECTORS[sector]
    subsector = random.choice(config["subsectors"])
    buyer_type = random.choices(BUYER_TYPES, weights=[34, 31, 18, 10, 7], k=1)[0]
    acquirer_pool = ACQUIRERS[buyer_type]
    acquirer = random.choice(acquirer_pool)
    date_value = random_date(index)

    sector_heat = 1 + (list(SECTORS).index(sector) % 4) * 0.04
    recency_boost = 1 + max((date_value.year - 2021), 0) * 0.025
    sponsor_boost = 1.08 if buyer_type == "Sponsor" else 1.0

    revenue = random.uniform(28, 850)
    margin = random.uniform(*config["margin"])
    ebitda = revenue * margin

    ev_rev = random.uniform(*config["ev_revenue"]) * sector_heat * recency_boost
    ev_ebitda = random.uniform(*config["ev_ebitda"]) * sponsor_boost * sector_heat

    value_from_revenue = revenue * ev_rev
    value_from_ebitda = ebitda * ev_ebitda
    deal_value = (value_from_revenue * 0.45 + value_from_ebitda * 0.55) * random.uniform(0.88, 1.12)

    # Preserve some sparse disclosure patterns seen in real transaction datasets.
    revenue_disclosed = random.random() > 0.08
    ebitda_disclosed = random.random() > 0.13
    value_disclosed = random.random() > 0.04

    target = company_name(sector, index)
    return {
        "id": index,
        "target_company": target,
        "acquirer": acquirer,
        "sector": sector,
        "subsector": subsector,
        "geography": random.choices(GEOGRAPHIES, weights=[45, 18, 11, 8, 13, 5], k=1)[0],
        "announcement_date": date_value.isoformat(),
        "deal_value_musd": rounded(deal_value) if value_disclosed else "",
        "revenue_musd": rounded(revenue) if revenue_disclosed else "",
        "ebitda_musd": rounded(ebitda) if ebitda_disclosed else "",
        "ev_revenue_multiple": rounded(ev_rev, 2) if revenue_disclosed and value_disclosed else "",
        "ev_ebitda_multiple": rounded(ev_ebitda, 2) if ebitda_disclosed and value_disclosed else "",
        "buyer_type": buyer_type,
        "deal_type": random.choices(DEAL_TYPES, weights=[22, 34, 10, 14, 8, 12], k=1)[0],
        "target_description": f"{target} is a fictional {subsector.lower()} company serving middle-market customers.",
        "rationale": random.choice(RATIONALES),
        "source_quality_score": round(random.uniform(0.62, 0.98), 2),
        "confidence_score": round(random.uniform(0.64, 0.97), 2),
    }


def main() -> None:
    rows = [build_row(index) for index in range(1, 181)]
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} synthetic deals to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

