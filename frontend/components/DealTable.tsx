"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Deal } from "@/types";
import { money, multiple, shortDate } from "@/lib/format";
import { ScoreBadge } from "@/components/ScoreBadge";

export function DealTable({
  deals,
  scores,
  compact = false
}: {
  deals: Deal[];
  scores?: Record<string, number>;
  compact?: boolean;
}) {
  return (
    <div className="panel overflow-hidden rounded-md">
      <div className="overflow-x-auto scrollbar">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-panelSoft/70 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Acquirer</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Geography</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">EV/Rev</th>
              <th className="px-4 py-3">EV/EBITDA</th>
              <th className="px-4 py-3">Buyer</th>
              {!compact ? <th className="px-4 py-3">Score</th> : null}
              <th className="px-4 py-3">Rationale</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-100">{deal.target_company}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">{deal.acquirer}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">{deal.sector}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-400">{deal.geography}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-400">{shortDate(deal.announcement_date)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">{money(deal.deal_value_musd)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">{multiple(deal.ev_revenue_multiple)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">{multiple(deal.ev_ebitda_multiple)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-md border border-line bg-ink px-2 py-1 text-xs text-slate-300">{deal.buyer_type}</span>
                </td>
                {!compact ? (
                  <td className="whitespace-nowrap px-4 py-3">
                    <ScoreBadge score={scores?.[String(deal.id)]} />
                  </td>
                ) : null}
                <td className="min-w-[320px] max-w-[460px] px-4 py-3 text-slate-400">{deal.rationale}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-slate-300 hover:bg-white/5 hover:text-mint"
                    title="Open deal detail"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

