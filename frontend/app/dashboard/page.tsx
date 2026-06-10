"use client";

import { useEffect, useState } from "react";
import { Activity, Building2, DollarSign, Gauge, LineChart, PieChart, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AICommentaryPanel } from "@/components/AICommentaryPanel";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DealTable } from "@/components/DealTable";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { KpiCard } from "@/components/KpiCard";
import { LoadingState } from "@/components/LoadingState";
import { money, multiple } from "@/lib/format";
import { defaultDataSource, getAnalyticsOverview, getDeals, getMarketCommentary, getMetadata } from "@/lib/api";
import type { AnalyticsOverview, DashboardFilters, Deal, MarketCommentary, Metadata } from "@/types";

const defaultFilters: DashboardFilters = {
  data_source: defaultDataSource as DashboardFilters["data_source"],
  limit: 40,
  multiple_availability: "all"
};

export default function DashboardPage() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [commentary, setCommentary] = useState<MarketCommentary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetadata().then(setMetadata).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCommentary(null);
    Promise.all([getAnalyticsOverview(filters), getDeals(filters)])
      .then(async ([analyticsResult, dealResult]) => {
        if (!active) return;
        setAnalytics(analyticsResult);
        setDeals(dealResult);
        setCommentary(await getMarketCommentary(analyticsResult));
      })
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filters]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Market Command Center</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">M&A Deal Intelligence Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Public-source and synthetic transaction data for valuation trends, active acquirers, buyer behavior, sector
            momentum, and AI-generated market commentary.
          </p>
        </div>
      </div>

      <FilterBar metadata={metadata} filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters)} />

      {error ? <div className="mt-4 rounded-md border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div> : null}
      {loading && !analytics ? <div className="mt-4"><LoadingState /></div> : null}
      {!loading && analytics && analytics.kpis.total_deals === 0 ? (
        <div className="mt-4">
          <EmptyState title="No matching deals" message="Adjust the filters to broaden the transaction universe." />
        </div>
      ) : null}

      {analytics ? (
        <div className="mt-5 space-y-5">
          <div className="grid metric-grid gap-4">
            <KpiCard label="Total Deals" value={String(analytics.kpis.total_deals)} subtext="Filtered announced transactions" icon={Activity} />
            <KpiCard label="Disclosed Value" value={money(analytics.kpis.total_disclosed_value_musd)} subtext="Aggregate disclosed enterprise value" icon={DollarSign} />
            <KpiCard label="Median EV/Revenue" value={multiple(analytics.kpis.median_ev_revenue)} subtext="Revenue multiple benchmark" icon={LineChart} />
            <KpiCard label="Median EV/EBITDA" value={multiple(analytics.kpis.median_ev_ebitda)} subtext="Profitability-adjusted benchmark" icon={Gauge} />
            <KpiCard label="Most Active Sector" value={analytics.kpis.most_active_sector} subtext="Highest transaction count" icon={TrendingUp} />
            <KpiCard
              label="Strategic vs Sponsor"
              value={`${analytics.kpis.strategic_vs_sponsor_split.strategic_or_corporate}/${analytics.kpis.strategic_vs_sponsor_split.sponsor}`}
              subtext="Strategic or corporate deals vs sponsor deals"
              icon={PieChart}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <DashboardCharts analytics={analytics} />
            <div className="space-y-5">
              <AICommentaryPanel commentary={commentary} />
              <section className="panel rounded-md p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Building2 className="h-4 w-4 text-gold" />
                  Acquirer Aggressiveness
                </div>
                <div className="mt-4 space-y-3">
                  {analytics.scores.acquirer_aggressiveness.slice(0, 7).map((item) => (
                    <div key={item.acquirer} className="flex items-center justify-between gap-3 border-b border-line/70 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{item.acquirer}</p>
                        <p className="text-xs text-slate-500">{item.acquisitions} deals · {item.primary_buyer_type}</p>
                      </div>
                      <span className="rounded-md bg-gold/10 px-2 py-1 text-sm font-semibold text-gold">{item.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Transaction Tape</h2>
                <p className="mt-1 text-sm text-slate-500">Recent filtered deals with valuation metrics and rationale.</p>
              </div>
            </div>
            <DealTable deals={deals} scores={analytics.deal_scores} />
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
