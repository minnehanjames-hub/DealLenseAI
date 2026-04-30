"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { BuyerType, DashboardFilters, Metadata } from "@/types";

export function FilterBar({
  metadata,
  filters,
  onChange,
  onReset
}: {
  metadata: Metadata | null;
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  onReset: () => void;
}) {
  const update = (patch: Partial<DashboardFilters>) => onChange({ ...filters, ...patch, offset: 0 });
  const oneOrNone = (value: string) => (value ? [value] : undefined);

  return (
    <div className="panel rounded-md p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <SlidersHorizontal className="h-4 w-4 text-mint" />
          Market Filters
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        <Field label="Sector">
          <select
            value={filters.sectors?.[0] ?? ""}
            onChange={(event) => update({ sectors: oneOrNone(event.target.value) })}
            className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All sectors</option>
            {metadata?.sectors.map((sector) => <option key={sector}>{sector}</option>)}
          </select>
        </Field>
        <Field label="Geography">
          <select
            value={filters.geographies?.[0] ?? ""}
            onChange={(event) => update({ geographies: oneOrNone(event.target.value) })}
            className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All regions</option>
            {metadata?.geographies.map((geo) => <option key={geo}>{geo}</option>)}
          </select>
        </Field>
        <Field label="Buyer">
          <select
            value={filters.buyer_types?.[0] ?? ""}
            onChange={(event) => update({ buyer_types: oneOrNone(event.target.value) as BuyerType[] | undefined })}
            className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All buyers</option>
            {metadata?.buyer_types.map((buyer) => <option key={buyer}>{buyer}</option>)}
          </select>
        </Field>
        <Field label="Min value">
          <input
            type="number"
            min="0"
            placeholder="$M"
            value={filters.min_deal_value ?? ""}
            onChange={(event) => update({ min_deal_value: event.target.value ? Number(event.target.value) : undefined })}
            className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-200"
          />
        </Field>
        <Field label="Max value">
          <input
            type="number"
            min="0"
            placeholder="$M"
            value={filters.max_deal_value ?? ""}
            onChange={(event) => update({ max_deal_value: event.target.value ? Number(event.target.value) : undefined })}
            className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-200"
          />
        </Field>
        <Field label="From">
          <input
            type="date"
            value={filters.date_from ?? ""}
            onChange={(event) => update({ date_from: event.target.value || undefined })}
            className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-200"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={filters.date_to ?? ""}
            onChange={(event) => update({ date_to: event.target.value || undefined })}
            className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-200"
          />
        </Field>
        <Field label="Multiples">
          <select
            value={filters.multiple_availability ?? "all"}
            onChange={(event) =>
              update({ multiple_availability: event.target.value as DashboardFilters["multiple_availability"] })
            }
            className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All</option>
            <option value="revenue">EV/Revenue</option>
            <option value="ebitda">EV/EBITDA</option>
            <option value="both">Both</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
