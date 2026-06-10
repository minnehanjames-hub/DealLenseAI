import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, Building2, FileText, LineChart, ShieldCheck } from "lucide-react";

const features = [
  {
    title: "Valuation Trend Analytics",
    body: "Track EV/Revenue and EV/EBITDA medians by sector, period, buyer type, and disclosed deal value.",
    icon: LineChart
  },
  {
    title: "Buyer Behavior Intelligence",
    body: "Rank active acquirers, compare strategic and sponsor behavior, and identify premium-paid patterns.",
    icon: Building2
  },
  {
    title: "AI Commentary Layer",
    body: "Turn structured analytics into analyst-style market commentary with deterministic fallback insights.",
    icon: BrainCircuit
  },
  {
    title: "Sector Snapshot Reports",
    body: "Generate one-page sector briefs with source-backed deals, top buyers, watchpoints, and PE interest notes.",
    icon: FileText
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink text-slate-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-mint/10 text-mint">
            <BarChart3 className="h-5 w-5" />
          </span>
          <span className="font-semibold">DealLenseAI</span>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-mint px-4 py-2 text-sm font-semibold text-ink hover:bg-mint/90"
        >
          Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      <section className="relative min-h-[760px] overflow-hidden border-y border-line">
        <div className="absolute inset-0 opacity-75">
          <DashboardPreview />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#071016_0%,rgba(7,16,22,0.92)_34%,rgba(7,16,22,0.56)_72%,#071016_100%)]" />
        <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-center px-5 py-20">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-gold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Public-source deal intelligence
            </p>
            <h1 className="text-5xl font-semibold tracking-normal text-white sm:text-7xl">DealLenseAI</h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-300">
              M&A intelligence for valuation trends, buyer behavior, and sector momentum.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
              Analyze M&A markets like an analyst with KPI dashboards, acquirer rankings, sector scoring, individual
              deal pages, source transparency, AI-generated market commentary, and PDF snapshot reports.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-mint px-5 py-3 text-sm font-semibold text-ink hover:bg-mint/90"
              >
                Analyze Markets
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 rounded-md border border-line px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                Generate Report
                <FileText className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Product Positioning</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">A finance analytics product, not a chat wrapper.</h2>
          <p className="mt-4 text-slate-400">
            DealLenseAI treats AI as an insight layer on top of structured transaction analytics. Analysts can filter
            markets, review deal-level evidence, and export sector briefs without losing the quantitative trail.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="glass rounded-md p-5">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-cyan/10 text-cyan">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="absolute right-[-120px] top-12 hidden w-[980px] rotate-[-2deg] xl:block">
      <div className="rounded-md border border-line bg-[#0a141c] p-5 shadow-glow">
        <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
          <div>
            <div className="h-3 w-36 rounded-sm bg-slate-500/40" />
            <div className="mt-2 h-2 w-64 rounded-sm bg-slate-600/25" />
          </div>
          <div className="h-9 w-28 rounded-md bg-mint/20" />
        </div>
        <div className="grid grid-cols-6 gap-3">
          {["$82.4B", "13.8x", "Software", "64.2", "180", "38%"].map((item) => (
            <div key={item} className="rounded-md border border-line bg-panel p-3">
              <div className="h-2 w-16 rounded-sm bg-slate-600/40" />
              <div className="mt-4 text-xl font-semibold text-white">{item}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          <div className="col-span-3 rounded-md border border-line bg-panel p-4">
            <div className="flex h-64 items-end gap-2">
              {[34, 52, 41, 68, 63, 80, 74, 91, 86, 102, 94, 118].map((height, index) => (
                <div key={height + index} className="flex-1 rounded-t-sm bg-mint/70" style={{ height }} />
              ))}
            </div>
          </div>
          <div className="col-span-2 rounded-md border border-line bg-panel p-4">
            <div className="space-y-3">
              {["Arbor Ridge Capital", "BlueRiver Industrials", "VoltEdge Energy", "Stonebridge Equity"].map(
                (name, index) => (
                  <div key={name} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">{name}</span>
                    <span className="rounded-md bg-gold/10 px-2 py-1 text-xs text-gold">{88 - index * 6}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-line bg-panel p-4">
          <div className="grid grid-cols-5 gap-4 text-xs text-slate-500">
            <span>Target</span>
            <span>Acquirer</span>
            <span>Sector</span>
            <span>EV/EBITDA</span>
            <span>Buyer</span>
          </div>
          {["Helio Cloud", "Prairie Care", "Cedar Grid"].map((target) => (
            <div key={target} className="mt-3 grid grid-cols-5 gap-4 border-t border-line pt-3 text-sm text-slate-300">
              <span>{target}</span>
              <span>Strategic Buyer</span>
              <span>Software</span>
              <span>14.6x</span>
              <span>Sponsor</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
