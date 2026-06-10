"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { defaultDataSource, generateSectorReport, getMetadata } from "@/lib/api";
import type { DataSourceFilter, Metadata } from "@/types";

export default function ReportsPage() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [sector, setSector] = useState("Software");
  const [dataSource, setDataSource] = useState<DataSourceFilter>(defaultDataSource as DataSourceFilter);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetadata()
      .then((result) => {
        setMetadata(result);
        setSector(result.sectors[0] ?? "Software");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const blob = await generateSectorReport(sector, { sectors: [sector], data_source: dataSource, limit: 1000 });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `DealLenseAI_${sector.replaceAll(" ", "_")}_Snapshot.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Sector Snapshot Report</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Generate One-Page PDF Briefs</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Export a sector overview with KPIs, top buyers, recent notable deals, AI commentary, source-aware
          watchpoints, and PE interest rationale.
        </p>
      </div>

      {loading ? <LoadingState label="Loading report metadata" /> : null}
      {error ? <div className="mb-4 rounded-md border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div> : null}

      {!loading && metadata ? (
        <div className="grid gap-5 xl:grid-cols-[460px_1fr]">
          <section className="panel rounded-md p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <FileText className="h-4 w-4 text-mint" />
              Report Builder
            </div>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-medium text-slate-500">Data Source</span>
              <select
                value={dataSource}
                onChange={(event) => setDataSource(event.target.value as DataSourceFilter)}
                className="w-full rounded-md border border-line bg-ink px-3 py-3 text-sm text-slate-200"
              >
                <option value="public">Public</option>
                <option value="synthetic">Synthetic</option>
                <option value="all">All</option>
              </select>
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-medium text-slate-500">Sector</span>
              <select
                value={sector}
                onChange={(event) => setSector(event.target.value)}
                className="w-full rounded-md border border-line bg-ink px-3 py-3 text-sm text-slate-200"
              >
                {metadata.sectors.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-mint px-4 py-3 text-sm font-semibold text-ink hover:bg-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {generating ? "Generating PDF" : "Generate PDF"}
            </button>
          </section>

          <section className="panel rounded-md p-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Preview Contents</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{sector} Snapshot</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Sector overview",
                  "Deal count and disclosed value",
                  "Median EV/Revenue and EV/EBITDA",
                  "Most active buyers",
                  "Strategic vs sponsor split",
                  "Recent source-backed deals",
                  "AI commentary",
                  "Risks and PE interest rationale"
                ].map((item) => (
                  <div key={item} className="rounded-md border border-line bg-ink/50 p-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {!loading && !metadata && !error ? (
        <EmptyState title="No report metadata" message="Start the backend API and refresh the page." />
      ) : null}
    </AppShell>
  );
}
