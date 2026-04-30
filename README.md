# DealLenseAI

**M&A intelligence for valuation trends, buyer behavior, and sector momentum.**

DealLenseAI is a production-style M&A Deal Intelligence Platform built as a serious finance analytics portfolio project. It combines a Next.js dashboard, a FastAPI analytics backend, synthetic transaction data, proprietary-style scoring models, an OpenAI-compatible insight layer, and one-page PDF sector reports.

The product is designed to feel closer to PitchBook, CapIQ, or a modern internal investment banking analytics tool than a simple AI chat interface.

## Why I Built It

Investment banking analysts, private equity associates, and corporate development teams often need to understand where deal activity is accelerating, which sectors are attracting premium valuations, and which buyers are behaving aggressively. DealLenseAI demonstrates how structured M&A analytics and AI commentary can work together: the AI explains outputs from the analytics engine rather than replacing the analytical workflow.

## Features

- Polished landing page with product positioning and dashboard preview
- Dark-mode M&A intelligence dashboard
- KPI cards for deal count, disclosed value, valuation medians, active sector, and buyer split
- Recharts visualizations for volume trends, valuation by sector, buyer mix, deal value distribution, top acquirers, and sector momentum
- Filterable deal database with sector, geography, buyer type, date, deal size, and multiple availability filters
- Individual deal detail pages with peer comparison, attractiveness score, similar transactions, rationale, red flags, and deal commentary
- Sector intelligence page with momentum scoring and valuation benchmarks
- AI Market Commentary panel using OpenAI-compatible APIs with deterministic mock fallback
- One-page PDF sector snapshot report generation
- Synthetic seed dataset with 180 fictional M&A transactions
- SQLite local database with auto-seeding from CSV
- Optional Docker Compose setup

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Recharts, lucide-react
- **Backend:** Python, FastAPI, pandas, Pydantic
- **Database:** SQLite local MVP
- **Reports:** ReportLab PDF generation
- **AI:** OpenAI-compatible chat completions API with mock fallback
- **Deployment option:** Docker Compose

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

## Docker Option

```bash
docker compose up --build
```

## Synthetic Data Notice

All transaction records in `backend/data/seed_deals.csv` are fictional and generated for demo purposes. The dataset is intentionally realistic enough to demonstrate M&A analytics workflows, but it should not be used for investment decisions, market claims, valuation work, or diligence.

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

## Scoring Models

**Sector Momentum Score** blends recent deal count growth, median multiple expansion, sponsor share, average confidence score, and disclosed deal value growth.

**Deal Attractiveness Score** evaluates sector attractiveness, EBITDA margin, a growth proxy, buyer quality, valuation reasonableness versus sector median, and confidence score.

**Acquirer Aggressiveness Score** ranks buyers based on acquisition count, average deal value, multiple premium versus sector median, and recent activity.

These scores are proprietary-style demo models. They are transparent, deterministic, and designed for portfolio storytelling rather than investment use.

## AI Insight Layer

If `OPENAI_API_KEY` is set, the backend calls an OpenAI-compatible chat completions endpoint. If no key is present, DealLenseAI uses a deterministic mock insight generator that converts structured analytics into professional market commentary and watchpoints.

The AI receives analytics output, not raw user prompts alone.

## Screenshot Placeholders

Add screenshots here after running the app:

- Landing page
- Dashboard overview
- Deal detail page
- Sector report PDF

## Future Improvements

- PostgreSQL production profile and migrations
- Authentication and saved workspaces
- Real source ingestion pipeline with provenance tracking
- Comparable company and public market benchmarking
- More advanced NLP extraction from deal announcements
- Scenario analysis for sector valuation sensitivity
- Role-based exports for bankers, PE investors, and corp dev teams
