# DealLenseAI

**M&A intelligence for valuation trends, buyer behavior, and sector momentum.**

DealLenseAI is a production-style M&A Deal Intelligence Platform built as a serious finance analytics portfolio project. It combines a Next.js dashboard, a FastAPI analytics backend, public-source transaction records, synthetic demo data, proprietary-style scoring models, an OpenAI-compatible insight layer, and one-page PDF sector reports.

The product is designed to feel closer to PitchBook, CapIQ, or a modern internal investment banking analytics tool than a simple AI chat interface.

## In plain terms

DealLenseAI is an M&A deal-intelligence dashboard. It answers the questions deal professionals actually ask: **which sectors are heating up, who's paying premium prices, and which buyers are being most aggressive?** It pulls in deal records, scores them, charts the trends, and uses AI to explain in plain English what the numbers mean — a lightweight take on tools like PitchBook or CapIQ. There's a [live demo](https://minnehanjames-hub.github.io/DealLenseAI/) you can click through.

## Live Demo

- **GitHub Pages demo:** https://minnehanjames-hub.github.io/DealLenseAI/
- **Source code:** https://github.com/minnehanjames-hub/DealLenseAI

The public GitHub Pages version is a static demo that embeds both public-source deal records and synthetic demo records. It uses deterministic mock AI commentary. The full local app runs the FastAPI backend, SQLite database, OpenAI-compatible insight endpoint, and ReportLab PDF generation.

## Why I Built It

Investment banking analysts, private equity associates, and corporate development teams often need to understand where deal activity is accelerating, which sectors are attracting premium valuations, and which buyers are behaving aggressively. DealLenseAI demonstrates how structured M&A analytics and AI commentary can work together: the AI explains outputs from the analytics engine rather than replacing the analytical workflow.

## Features

- Polished landing page with product positioning and dashboard preview
- Dark-mode M&A intelligence dashboard
- KPI cards for deal count, disclosed value, valuation medians, active sector, and buyer split
- Recharts visualizations for volume trends, valuation by sector, buyer mix, deal value distribution, top acquirers, and sector momentum
- Filterable deal database with public/synthetic data mode, sector, geography, buyer type, date, deal size, and multiple availability filters
- Individual deal detail pages with peer comparison, attractiveness score, similar transactions, rationale, red flags, deal commentary, and source trail
- Sector intelligence page with momentum scoring and valuation benchmarks
- AI Market Commentary panel using OpenAI-compatible APIs with deterministic mock fallback
- One-page PDF sector snapshot report generation
- Public-source seed dataset with source URLs, verification status, extracted date, source quality, and confidence scoring
- Synthetic seed dataset with 180 fictional M&A transactions
- No-key GDELT ingestion utility for public acquisition candidate collection
- SQLite local database with auto-seeding from CSV
- Optional Docker Compose setup

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Recharts, lucide-react
- **Backend:** Python, FastAPI, pandas, Pydantic
- **Database:** SQLite local MVP
- **Reports:** ReportLab PDF generation
- **AI:** OpenAI-compatible chat completions API with mock fallback
- **Deployment options:** GitHub Pages static demo, Docker Compose local full stack

## Architecture

```text
DealLenseAI
├── frontend (Next.js + TypeScript + Tailwind)
│   ├── Landing page
│   ├── Dashboard
│   ├── Deal database and deal detail pages
│   ├── Sector analytics
│   └── PDF report builder
│
├── backend (FastAPI)
│   ├── /deals and /deals/{id}
│   ├── /analytics/overview
│   ├── /analytics/sectors
│   ├── /analytics/acquirers
│   ├── /insights/commentary
│   └── /reports/sector
│
├── analytics engine (pandas)
│   ├── Multiples by sector
│   ├── Deal counts by month and quarter
│   ├── Buyer type distribution
│   ├── Outlier detection
│   └── Hot sector and acquirer rankings
│
└── seed data
    ├── backend/data/real_public_deals.csv
    ├── backend/data/gdelt_public_deals.csv (generated when ingestion is run)
    └── backend/data/seed_deals.csv
```

## Run Locally

From the repo root:

```bash
cp .env.example .env
```

Start the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Useful API examples:

```bash
curl "http://localhost:8000/deals?data_source=public&limit=50"
curl "http://localhost:8000/analytics/overview?data_source=public"
curl "http://localhost:8000/deals?data_source=synthetic&sector=Software"
```

## GitHub Pages Deployment

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`. On pushes to `main`, it:

- exports a static demo dataset to `frontend/public/demo-data.json`
- builds the Next.js frontend with `NEXT_PUBLIC_STATIC_DEMO=1`
- deploys `frontend/out` to GitHub Pages at `/DealLenseAI/`

GitHub Pages is static hosting, so it does not run the FastAPI server. The hosted demo embeds public and synthetic records; the local setup is the complete full-stack version.

## Docker Option

```bash
docker compose up --build
```

## Public Data Mode

`backend/data/real_public_deals.csv` contains source-backed public transaction records from company announcements, investor relations pages, and SEC material. Public records include:

- `data_source=public`
- `source_name`
- `source_url`
- `source_type`
- `source_date`
- `verification_status`
- `extracted_at`
- `source_notes`

Public records do **not** invent revenue, EBITDA, EV/Revenue, or EV/EBITDA when those values are not disclosed. Missing valuation fields are intentionally shown as `n/a`.

To collect no-key public acquisition candidates from GDELT:

```bash
cd backend
source .venv/bin/activate
cd ..
PYTHONPATH="$PWD" python backend/data/ingest_public_deals.py --output backend/data/gdelt_public_deals.csv --max-records 75
PYTHONPATH="$PWD" python backend/data/export_static_demo.py
```

GDELT rate-limits aggressively, so run this slowly and treat generated rows as `Needs review` candidates until a human verifies each source.

## Synthetic Data Notice

Transaction records in `backend/data/seed_deals.csv` are fictional and generated for demo purposes. The dataset is intentionally realistic enough to demonstrate M&A analytics workflows, but it should not be used for investment decisions, market claims, valuation work, or diligence.

The seed file includes 180 synthetic deals across:

- Software
- Healthcare Services
- Consumer
- Industrials
- Financial Services
- Business Services
- Energy Transition
- Media & Entertainment
- Education
- Beauty & Wellness

## How the scores work

All three are transparent, deterministic 0–100 scores computed in `backend/app/scoring.py` — no black box.

### Sector Momentum (which industries are heating up)

Compares the **last 6 months** to the **prior 6 months** and blends: deal-count growth, **multiple expansion** (the biggest driver), sponsor share, data confidence, and total deal-value growth. Starts neutral at 45 — a sector scoring 80+ is accelerating, one in the 30s is cooling.

### Deal Attractiveness (is this individual deal a good one)

A weighted blend (0–100): sector quality (24%), valuation reasonableness vs. the sector's typical multiple (18%), EBITDA margin (18%), a price-to-revenue growth proxy (14%), buyer quality — Sponsor › Strategic › Corporate › Family Office › Other (14%), and data confidence (12%).

### Acquirer Aggressiveness (which buyers are pushing hardest)

Ranks the top 20 buyers by: number of acquisitions (36%), average deal size (22%), **multiple premium** — how much over the sector median they habitually pay (22%), and recent activity in the last 9 months (20%).

These scores are proprietary-style demo models — transparent and deterministic by design, built for portfolio storytelling rather than investment use.

## AI Insight Layer

If `OPENAI_API_KEY` is set, the backend calls an OpenAI-compatible chat completions endpoint. If no key is present, DealLenseAI uses a deterministic mock insight generator that converts structured analytics into professional market commentary and watchpoints.

The AI receives analytics output, not raw user prompts alone.

## Screenshot Placeholders

Add screenshots here after running the app:

- Landing page
- Dashboard overview
- Deal detail page
- Sector report PDF

## Limitations

- The hosted GitHub Pages demo is a **fixed snapshot** with deterministic *mock* AI commentary — it doesn't update live or run the backend.
- The synthetic dataset is **fictional** and must not be used for real investment, valuation, or diligence decisions.
- The scores are **illustrative "proprietary-style" demo models** — transparent and deterministic, but built for portfolio storytelling, not investment-grade use.
- AI commentary *explains* the analytics; without an `OPENAI_API_KEY` it falls back to deterministic text.
- **Not investment advice.**

## Future Improvements

- PostgreSQL production profile and migrations
- Authentication and saved workspaces
- Additional real source ingestion connectors, including SEC filing extraction and licensed deal-data providers
- Paid/private data integrations for PitchBook, CapIQ, FactSet, Crunchbase, or Refinitiv if credentials are available
- Comparable company and public market benchmarking
- More advanced NLP extraction from deal announcements
- Scenario analysis for sector valuation sensitivity
- Role-based exports for bankers, PE investors, and corp dev teams
