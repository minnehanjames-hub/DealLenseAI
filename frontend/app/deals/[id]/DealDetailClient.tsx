"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, AlertTriangle, Building2, ExternalLink, Gauge, LineChart, ShieldCheck, Target, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getDeal } from "@/lib/api";
import { money, multiple, pct, shortDate } from "@/lib/format";
import type { DealDetail } from "@/types";

export function DealDetailClient({ id }: { id: string }) {
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDeal(id)
      .then(setDeal)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AppShell>
      <Link href="/deals" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-mint">
        <ArrowLeft className="h-4 w-4" />
        Deals
      </Link>

      {loading ? <LoadingState label="Loading deal detail" /> : null}
      {error ? <EmptyState title="Unable to load deal" message={error} /> : null}

      {deal ? (
        <div className="space-y-5">
          <div className="panel rounded-md p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">{deal.sector} · {deal.subsector}</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">{deal.target_company}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{deal.target_description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    deal.data_source === "public"
                      ? "border-mint/30 bg-mint/10 text-mint"
                      : "border-gold/30 bg-gold/10 text-gold"
                  }`}>
                    {deal.data_source === "public" ? "Public source" : "Synthetic demo"}
                  </span>
                  {deal.verification_status ? (
                    <span className="rounded-md border border-line bg-ink px-2.5 py-1 text-xs text-slate-300">
                      {deal.verification_status}
                    </span>
                  ) : null}
                </div>
              </div>
              <ScoreBadge score={deal.attractiveness_score} label="Attractiveness" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Building2} label="Acquirer" value={deal.acquirer} subtext={deal.buyer_type} />
            <Metric icon={Target} label="Deal Type" value={deal.deal_type} subtext={shortDate(deal.announcement_date)} />
            <Metric icon={LineChart} label="Deal Value" value={money(deal.deal_value_musd)} subtext="Disclosed enterprise value" />
            <Metric icon={Gauge} label="EV/EBITDA" value={multiple(deal.ev_ebitda_multiple)} subtext={`${multiple(deal.ev_revenue_multiple)} EV/Revenue`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <section className="panel rounded-md p-5">
              <h2 className="text-lg font-semibold text-white">Deal Commentary</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{deal.ai_deal_commentary}</p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-line bg-ink/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">Target Overview</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{deal.target_description}</p>
                </div>
                <div className="rounded-md border border-line bg-ink/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">Acquirer Overview</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {deal.acquirer} is categorized as a {deal.buyer_type.toLowerCase()} buyer in the {deal.data_source === "public" ? "public-source" : "synthetic"} dataset,
                    pursuing a {deal.deal_type.toLowerCase()} transaction in {deal.geography}.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Peer label="Sector Deals" value={String(deal.peer_comparison.sector_deal_count)} />
                <Peer label="Sector EV/Revenue" value={multiple(deal.peer_comparison.sector_median_ev_revenue)} />
                <Peer label="Sector EV/EBITDA" value={multiple(deal.peer_comparison.sector_median_ev_ebitda)} />
              </div>
              <div className="mt-5 rounded-md border border-line bg-ink/50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <ShieldCheck className="h-4 w-4 text-mint" />
                  Source Trail
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <SourceField label="Source" value={deal.source_name ?? "N/A"} />
                  <SourceField label="Source Type" value={deal.source_type ?? "N/A"} />
                  <SourceField label="Source Date" value={deal.source_date ? shortDate(deal.source_date) : "N/A"} />
                  <SourceField label="Verification" value={deal.verification_status ?? "N/A"} />
                </div>
                {deal.source_url ? (
                  <a
                    href={deal.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 hover:text-mint"
                  >
                    Open Source
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
                {deal.source_notes ? <p className="mt-3 text-xs leading-5 text-slate-500">{deal.source_notes}</p> : null}
              </div>
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-100">Transaction Rationale</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{deal.rationale}</p>
              </div>
            </section>

            <section className="panel rounded-md p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <AlertTriangle className="h-4 w-4 text-gold" />
                Red Flags
              </div>
              <div className="mt-4 space-y-3">
                {deal.red_flags.map((flag) => (
                  <p key={flag} className="rounded-md border border-line bg-ink/50 p-3 text-sm leading-6 text-slate-400">
                    {flag}
                  </p>
                ))}
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Confidence</p>
                <p className="mt-2 text-2xl font-semibold text-white">{pct(deal.confidence_score)}</p>
                <p className="mt-1 text-xs text-slate-500">Source quality: {pct(deal.source_quality_score)}</p>
              </div>
            </section>
          </div>

          <section className="panel rounded-md p-5">
            <h2 className="text-lg font-semibold text-white">Similar Transactions</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Target</th>
                    <th className="py-3 pr-4">Acquirer</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Value</th>
                    <th className="py-3 pr-4">EV/EBITDA</th>
                    <th className="py-3 pr-4">Buyer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {deal.similar_transactions.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 text-slate-100">
                        <Link href={`/deals/${item.id}`} className="hover:text-mint">{item.target_company}</Link>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{item.acquirer}</td>
                      <td className="py-3 pr-4 text-slate-400">{shortDate(item.announcement_date)}</td>
                      <td className="py-3 pr-4 text-slate-300">{money(item.deal_value_musd)}</td>
                      <td className="py-3 pr-4 text-slate-300">{multiple(item.ev_ebitda_multiple)}</td>
                      <td className="py-3 pr-4 text-slate-400">{item.buyer_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  subtext
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="glass rounded-md p-4">
      <Icon className="h-4 w-4 text-cyan" />
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtext}</p>
    </div>
  );
}

function Peer({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-ink/50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SourceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-slate-300">{value}</p>
    </div>
  );
}
