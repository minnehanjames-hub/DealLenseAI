"use client";

import { useEffect, useState } from "react";
import { Activity, Layers3, TrendingUp, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getSectorAnalytics } from "@/lib/api";
import { money, multiple, pct } from "@/lib/format";

type SectorAnalytics = Awaited<ReturnType<typeof getSectorAnalytics>>;

export default function SectorsPage() {
  const [analytics, setAnalytics] = useState<SectorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSectorAnalytics()
      .then(setAnalytics)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const medianBySector = new Map(
    analytics?.median_multiples_by_sector.map((item) => [item.sector, item]) ?? []
  );

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Sector Intelligence</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Momentum, Multiples, and PE Interest Signals</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Sector Momentum Score blends recent deal count growth, multiple expansion, sponsor activity, confidence, and
          disclosed value growth.
        </p>
      </div>

      {loading ? <LoadingState label="Loading sector rankings" /> : null}
      {error ? <EmptyState title="Unable to load sectors" message={error} /> : null}

      {analytics ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {analytics.sector_momentum.map((sector, index) => {
            const multiples = medianBySector.get(sector.sector);
            return (
              <article key={sector.sector} className="panel rounded-md p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Layers3 className="h-4 w-4 text-mint" />
                      Rank #{index + 1}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-white">{sector.sector}</h2>
                  </div>
                  <ScoreBadge score={sector.score} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <SectorMetric icon={Activity} label="Deal Count" value={String(multiples?.deal_count ?? 0)} />
                  <SectorMetric icon={TrendingUp} label="EV/Revenue" value={multiple(multiples?.median_ev_revenue)} />
                  <SectorMetric icon={TrendingUp} label="EV/EBITDA" value={multiple(multiples?.median_ev_ebitda)} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Small label="Sponsor Share" value={pct(sector.sponsor_share)} />
                  <Small label="Recent Deals" value={String(sector.recent_deal_count)} />
                  <Small label="Disclosed Value" value={money(multiples?.total_value_musd)} />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-mint" style={{ width: `${sector.score}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </AppShell>
  );
}

function SectorMetric({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-line bg-ink/50 p-3">
      <Icon className="h-4 w-4 text-cyan" />
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}
