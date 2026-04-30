"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DealTable } from "@/components/DealTable";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { LoadingState } from "@/components/LoadingState";
import { getAnalyticsOverview, getDeals, getMetadata } from "@/lib/api";
import type { AnalyticsOverview, DashboardFilters, Deal, Metadata } from "@/types";

const defaultFilters: DashboardFilters = { limit: 180, multiple_availability: "all" };

export default function DealsPage() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetadata().then(setMetadata).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getDeals(filters), getAnalyticsOverview(filters)])
      .then(([dealResult, analyticsResult]) => {
        setDeals(dealResult);
        setAnalytics(analyticsResult);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const filteredDeals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return deals;
    return deals.filter((deal) =>
      [deal.target_company, deal.acquirer, deal.sector, deal.subsector, deal.rationale]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [deals, query]);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Deal Database</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Synthetic M&A Transaction Tape</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Review 180 fictional M&A transactions with disclosed value, revenue, EBITDA, valuation multiples, buyer type,
          rationale, confidence, and deal attractiveness scores.
        </p>
      </div>

      <div className="space-y-4">
        <FilterBar metadata={metadata} filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters)} />
        <div className="panel flex items-center gap-3 rounded-md px-4 py-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search targets, acquirers, sectors, rationale"
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      {error ? <div className="mt-4 rounded-md border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div> : null}
      {loading ? <div className="mt-5"><LoadingState label="Loading deals" /></div> : null}
      {!loading && filteredDeals.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="No deals found" message="Adjust the filters or search terms to find more transactions." />
        </div>
      ) : null}
      {!loading && filteredDeals.length > 0 ? (
        <div className="mt-5">
          <DealTable deals={filteredDeals} scores={analytics?.deal_scores} />
        </div>
      ) : null}
    </AppShell>
  );
}

