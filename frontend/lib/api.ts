import type { AnalyticsOverview, DashboardFilters, Deal, DealDetail, MarketCommentary, Metadata } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const defaultDataSource = process.env.NEXT_PUBLIC_DEFAULT_DATA_SOURCE || "public";

export const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

type SectorAnalyticsResponse = {
  sector_momentum: AnalyticsOverview["scores"]["sector_momentum"];
  median_multiples_by_sector: AnalyticsOverview["tables"]["median_multiples_by_sector"];
  hot_sector_ranking: AnalyticsOverview["tables"]["hot_sector_ranking"];
};

type DemoData = {
  metadata: Metadata;
  deals: Deal[];
  analyticsOverview: AnalyticsOverview;
  sectorAnalytics: SectorAnalyticsResponse;
  marketCommentary: MarketCommentary;
  dealDetails: Record<string, DealDetail>;
};

let demoDataPromise: Promise<DemoData> | null = null;

function withQuery(path: string, filters?: DashboardFilters): string {
  const params = new URLSearchParams();
  filters?.sectors?.forEach((value) => params.append("sector", value));
  filters?.geographies?.forEach((value) => params.append("geography", value));
  filters?.buyer_types?.forEach((value) => params.append("buyer_type", value));
  if (filters?.min_deal_value !== undefined) params.set("min_deal_value", String(filters.min_deal_value));
  if (filters?.max_deal_value !== undefined) params.set("max_deal_value", String(filters.max_deal_value));
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);
  if (filters?.multiple_availability) params.set("multiple_availability", filters.multiple_availability);
  if (filters?.data_source) params.set("data_source", filters.data_source);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));
  const query = params.toString();
  return `${API_BASE}${path}${query ? `?${query}` : ""}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function getDemoData(): Promise<DemoData> {
  if (!demoDataPromise) {
    demoDataPromise = request<DemoData>(`${BASE_PATH}/demo-data.json`, { cache: "force-cache" });
  }
  return demoDataPromise;
}

function numberValue(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function median(values: Array<number | null | undefined>): number {
  const cleaned = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (cleaned.length === 0) return 0;
  const middle = Math.floor(cleaned.length / 2);
  return cleaned.length % 2 ? cleaned[middle] : (cleaned[middle - 1] + cleaned[middle]) / 2;
}

function mean(values: Array<number | null | undefined>): number {
  const cleaned = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return cleaned.length ? cleaned.reduce((sum, value) => sum + value, 0) / cleaned.length : 0;
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function quarter(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return `${parsed.getUTCFullYear()}Q${Math.floor(parsed.getUTCMonth() / 3) + 1}`;
}

function applyFilters(deals: Deal[], filters?: DashboardFilters, includePagination = true): Deal[] {
  let filtered = deals.filter((deal) => {
    if (filters?.sectors?.length && !filters.sectors.includes(deal.sector)) return false;
    if (filters?.geographies?.length && !filters.geographies.includes(deal.geography)) return false;
    if (filters?.buyer_types?.length && !filters.buyer_types.includes(deal.buyer_type)) return false;
    if (filters?.min_deal_value !== undefined && numberValue(deal.deal_value_musd) < filters.min_deal_value) return false;
    if (filters?.max_deal_value !== undefined && numberValue(deal.deal_value_musd) > filters.max_deal_value) return false;
    if (filters?.date_from && deal.announcement_date < filters.date_from) return false;
    if (filters?.date_to && deal.announcement_date > filters.date_to) return false;
    if (filters?.data_source && filters.data_source !== "all" && deal.data_source !== filters.data_source) return false;
    if (filters?.multiple_availability === "revenue" && deal.ev_revenue_multiple === null) return false;
    if (filters?.multiple_availability === "ebitda" && deal.ev_ebitda_multiple === null) return false;
    if (filters?.multiple_availability === "both" && (deal.ev_revenue_multiple === null || deal.ev_ebitda_multiple === null)) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => b.announcement_date.localeCompare(a.announcement_date) || b.id - a.id);
  if (!includePagination) return filtered;

  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? 500;
  return filtered.slice(offset, offset + limit);
}

function groupCount<T extends string>(items: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  items.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return counts;
}

function periodSeries(deals: Deal[], period: "month" | "quarter"): AnalyticsOverview["charts"]["deal_volume_over_time"] {
  const grouped = new Map<string, { deals: number; total_value_musd: number }>();
  deals.forEach((deal) => {
    const key = period === "month" ? deal.announcement_date.slice(0, 7) : quarter(deal.announcement_date);
    const current = grouped.get(key) ?? { deals: 0, total_value_musd: 0 };
    current.deals += 1;
    current.total_value_musd += numberValue(deal.deal_value_musd);
    grouped.set(key, current);
  });
  return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([periodName, value]) => ({
    period: periodName,
    deals: value.deals,
    total_value_musd: round(value.total_value_musd, 1)
  }));
}

function buildStaticOverview(deals: Deal[], demo: DemoData): AnalyticsOverview {
  if (deals.length === 0) {
    return {
      ...demo.analyticsOverview,
      kpis: {
        total_deals: 0,
        total_disclosed_value_musd: 0,
        median_ev_revenue: 0,
        median_ev_ebitda: 0,
        most_active_sector: "N/A",
        strategic_vs_sponsor_split: { strategic_or_corporate: 0, sponsor: 0, other: 0 }
      },
      charts: {
        ...demo.analyticsOverview.charts,
        deal_volume_over_time: [],
        deal_count_by_quarter: [],
        average_ev_ebitda_by_sector: [],
        buyer_type_distribution: [],
        deal_value_distribution: [],
        top_acquirers: [],
        valuation_premium_by_buyer_type: []
      },
      tables: {
        ...demo.analyticsOverview.tables,
        median_multiples_by_sector: []
      },
      outliers: [],
      deal_scores: {}
    };
  }

  const sectorCounts = groupCount(deals.map((deal) => deal.sector));
  const buyerCounts = groupCount(deals.map((deal) => deal.buyer_type));
  const mostActiveSector = Array.from(sectorCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
  const totalValue = deals.reduce((sum, deal) => sum + numberValue(deal.deal_value_musd), 0);
  const marketMedianEbitda = median(deals.map((deal) => deal.ev_ebitda_multiple));
  const sectors = Array.from(sectorCounts.keys());

  const medianBySector = sectors.map((sector) => {
    const sectorDeals = deals.filter((deal) => deal.sector === sector);
    return {
      sector,
      deal_count: sectorDeals.length,
      median_ev_revenue: round(median(sectorDeals.map((deal) => deal.ev_revenue_multiple))),
      median_ev_ebitda: round(median(sectorDeals.map((deal) => deal.ev_ebitda_multiple))),
      total_value_musd: round(sectorDeals.reduce((sum, deal) => sum + numberValue(deal.deal_value_musd), 0), 1)
    };
  }).sort((a, b) => b.deal_count - a.deal_count);

  const meanBySector = sectors.map((sector) => {
    const sectorDeals = deals.filter((deal) => deal.sector === sector);
    return {
      sector,
      mean_ev_revenue: round(mean(sectorDeals.map((deal) => deal.ev_revenue_multiple))),
      mean_ev_ebitda: round(mean(sectorDeals.map((deal) => deal.ev_ebitda_multiple))),
      average_deal_value_musd: round(mean(sectorDeals.map((deal) => deal.deal_value_musd)), 1)
    };
  }).sort((a, b) => b.mean_ev_ebitda - a.mean_ev_ebitda);

  const buyerDistribution = Array.from(buyerCounts.entries()).sort((a, b) => b[1] - a[1]).map(([buyer_type, count]) => {
    const buyerDeals = deals.filter((deal) => deal.buyer_type === buyer_type);
    return {
      buyer_type,
      deals: count,
      share: round(count / deals.length, 3),
      median_ev_ebitda: round(median(buyerDeals.map((deal) => deal.ev_ebitda_multiple))),
      total_value_musd: round(buyerDeals.reduce((sum, deal) => sum + numberValue(deal.deal_value_musd), 0), 1)
    };
  });

  const acquirerCounts = groupCount(deals.map((deal) => deal.acquirer));
  const topAcquirers = Array.from(acquirerCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([acquirer, count]) => {
    const acquirerDeals = deals.filter((deal) => deal.acquirer === acquirer);
    return {
      acquirer,
      deals: count,
      total_value_musd: round(acquirerDeals.reduce((sum, deal) => sum + numberValue(deal.deal_value_musd), 0), 1),
      median_ev_ebitda: round(median(acquirerDeals.map((deal) => deal.ev_ebitda_multiple))),
      buyer_type: acquirerDeals[0]?.buyer_type ?? "Other"
    };
  });

  const buckets = [
    { bucket: "<$50M", min: 0, max: 50 },
    { bucket: "$50-100M", min: 50, max: 100 },
    { bucket: "$100-250M", min: 100, max: 250 },
    { bucket: "$250-500M", min: 250, max: 500 },
    { bucket: "$500M-1B", min: 500, max: 1000 },
    { bucket: "$1-2.5B", min: 1000, max: 2500 },
    { bucket: ">$2.5B", min: 2500, max: Infinity }
  ].map((bucket) => ({
    bucket: bucket.bucket,
    deals: deals.filter((deal) => numberValue(deal.deal_value_musd) >= bucket.min && numberValue(deal.deal_value_musd) < bucket.max).length
  }));

  const selectedSectorSet = new Set(sectors);
  const sectorMomentum = demo.analyticsOverview.scores.sector_momentum.filter((item) => selectedSectorSet.has(item.sector));
  const acquirerSet = new Set(topAcquirers.map((item) => item.acquirer));
  const acquirerAggressiveness = demo.analyticsOverview.scores.acquirer_aggressiveness.filter((item) => acquirerSet.has(item.acquirer));
  const dealScores = Object.fromEntries(
    deals.map((deal) => [String(deal.id), demo.analyticsOverview.deal_scores[String(deal.id)] ?? 0])
  );

  return {
    kpis: {
      total_deals: deals.length,
      total_disclosed_value_musd: round(totalValue, 1),
      median_ev_revenue: round(median(deals.map((deal) => deal.ev_revenue_multiple))),
      median_ev_ebitda: round(marketMedianEbitda),
      most_active_sector: mostActiveSector,
      strategic_vs_sponsor_split: {
        strategic_or_corporate: deals.filter((deal) => deal.buyer_type === "Strategic" || deal.buyer_type === "Corporate").length,
        sponsor: buyerCounts.get("Sponsor") ?? 0,
        other: deals.filter((deal) => !["Strategic", "Corporate", "Sponsor"].includes(deal.buyer_type)).length
      }
    },
    charts: {
      deal_volume_over_time: periodSeries(deals, "month"),
      deal_count_by_quarter: periodSeries(deals, "quarter"),
      average_ev_ebitda_by_sector: meanBySector,
      buyer_type_distribution: buyerDistribution,
      deal_value_distribution: buckets,
      top_acquirers: topAcquirers,
      sector_momentum: sectorMomentum,
      valuation_premium_by_buyer_type: buyerDistribution.map((buyer) => ({
        buyer_type: buyer.buyer_type,
        median_ev_ebitda: buyer.median_ev_ebitda,
        premium_to_market: marketMedianEbitda ? round(buyer.median_ev_ebitda / marketMedianEbitda - 1, 3) : 0
      }))
    },
    tables: {
      ...demo.analyticsOverview.tables,
      median_multiples_by_sector: medianBySector,
      hot_sector_ranking: sectorMomentum,
      acquirer_aggressiveness: acquirerAggressiveness
    },
    scores: {
      sector_momentum: sectorMomentum,
      acquirer_aggressiveness: acquirerAggressiveness
    },
    outliers: demo.analyticsOverview.outliers.filter((item) => deals.some((deal) => deal.id === item.id)),
    deal_scores: dealScores
  };
}

function pdfSafe(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "-").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildStaticSectorPdf(sector: string, deals: Deal[], commentary: MarketCommentary): Blob {
  const sectorDeals = deals.filter((deal) => deal.sector === sector);
  const topBuyers = Array.from(groupCount(sectorDeals.map((deal) => deal.acquirer)).entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([buyer, count]) => `${buyer} (${count})`)
    .join(", ");
  const buyerSplit = Array.from(groupCount(sectorDeals.map((deal) => deal.buyer_type)).entries())
    .sort((a, b) => b[1] - a[1])
    .map(([buyer, count]) => `${buyer}: ${count}`)
    .join(" | ");
  const notableDeals = sectorDeals
    .slice()
    .sort((a, b) => numberValue(b.deal_value_musd) - numberValue(a.deal_value_musd))
    .slice(0, 4)
    .map((deal) => `${deal.target_company} / ${deal.acquirer} / $${numberValue(deal.deal_value_musd).toFixed(0)}M`);

  const reportLines = [
    "DealLenseAI Sector Snapshot",
    `Sector: ${sector}`,
    `Deal count: ${sectorDeals.length}`,
    `Median EV/Revenue: ${round(median(sectorDeals.map((deal) => deal.ev_revenue_multiple))).toFixed(1)}x`,
    `Median EV/EBITDA: ${round(median(sectorDeals.map((deal) => deal.ev_ebitda_multiple))).toFixed(1)}x`,
    `Most active buyers: ${topBuyers || "N/A"}`,
    `Strategic vs sponsor split: ${buyerSplit || "N/A"}`,
    "Recent notable deals:",
    ...notableDeals,
    "AI market commentary:",
    ...(commentary.commentary.slice(0, 3)),
    "Key risks / watchpoints:",
    ...commentary.watchpoints.slice(0, 3),
    "Why PE may care: fragmented targets, repeat acquirer patterns, and visible valuation benchmarks can support platform or add-on theses.",
    "Note: GitHub Pages demo uses embedded public-source and synthetic datasets with deterministic mock insight generation."
  ];

  const textCommands = reportLines.slice(0, 34).flatMap((line, index) => {
    const fontSize = index === 0 ? 16 : 10;
    const leading = index === 0 ? -30 : -15;
    const clipped = line.length > 94 ? `${line.slice(0, 91)}...` : line;
    return [`/F1 ${fontSize} Tf`, `(${pdfSafe(clipped)}) Tj`, `0 ${leading} Td`];
  });
  const stream = ["BT", "72 750 Td", ...textCommands, "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export async function getMetadata(): Promise<Metadata> {
  if (isStaticDemo) {
    return (await getDemoData()).metadata;
  }
  return request<Metadata>(`${API_BASE}/metadata`);
}

export async function getDeals(filters?: DashboardFilters): Promise<Deal[]> {
  if (isStaticDemo) {
    return applyFilters((await getDemoData()).deals, filters);
  }
  return request<Deal[]>(withQuery("/deals", filters));
}

export async function getDeal(id: string | number): Promise<DealDetail> {
  if (isStaticDemo) {
    const detail = (await getDemoData()).dealDetails[String(id)];
    if (!detail) throw new Error("Deal not found in static demo data");
    return detail;
  }
  return request<DealDetail>(`${API_BASE}/deals/${id}`);
}

export async function getAnalyticsOverview(filters?: DashboardFilters): Promise<AnalyticsOverview> {
  if (isStaticDemo) {
    const demo = await getDemoData();
    return buildStaticOverview(applyFilters(demo.deals, filters, false), demo);
  }
  return request<AnalyticsOverview>(withQuery("/analytics/overview", filters));
}

export async function getSectorAnalytics(filters?: DashboardFilters): Promise<SectorAnalyticsResponse> {
  if (isStaticDemo) {
    if (!filters) return (await getDemoData()).sectorAnalytics;
    const analytics = await getAnalyticsOverview(filters);
    return {
      sector_momentum: analytics.scores.sector_momentum,
      median_multiples_by_sector: analytics.tables.median_multiples_by_sector,
      hot_sector_ranking: analytics.tables.hot_sector_ranking
    };
  }
  return request(withQuery("/analytics/sectors", filters));
}

export async function getMarketCommentary(analytics: AnalyticsOverview): Promise<MarketCommentary> {
  if (isStaticDemo) {
    const hotSector = analytics.scores.sector_momentum[0]?.sector ?? analytics.kpis.most_active_sector;
    const buyerLeader = analytics.charts.buyer_type_distribution[0]?.buyer_type ?? "Strategic";
    const topAcquirer = analytics.scores.acquirer_aggressiveness[0]?.acquirer ?? "repeat acquirers";
    const multipleComment =
      analytics.kpis.median_ev_ebitda > 0
        ? `Median EV/EBITDA across the selected market is ${analytics.kpis.median_ev_ebitda.toFixed(1)}x, giving analysts a benchmark for premium-paid and discount transactions.`
        : "EV/EBITDA is not broadly disclosed across the selected public-source records, so valuation commentary should focus on announced consideration and source quality.";
    return {
      mode: "mock",
      summary: "Static GitHub Pages demo using deterministic commentary from structured analytics.",
      commentary: [
        `${hotSector} screens as the highest-momentum sector in the selected universe, supported by filtered transaction count and valuation benchmarks.`,
        `${buyerLeader} buyers represent the largest share of activity, which points to consolidation, platform expansion, or adjacency-driven acquisition behavior.`,
        multipleComment,
        `${topAcquirer} remains one of the more aggressive acquirer profiles based on deal frequency, deal value, and activity captured in the demo dataset.`
      ],
      watchpoints: [
        "The public demo includes source-backed public records and synthetic demo records. Treat outputs as product examples rather than investment advice.",
        "Validate disclosed multiples and buyer categorization before using any similar workflow in a real diligence process.",
        "Separate sponsor platforms from add-on acquisitions when interpreting buyer intent."
      ]
    };
  }
  return request<MarketCommentary>(`${API_BASE}/insights/commentary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analytics })
  });
}

export async function generateSectorReport(sector: string, filters?: DashboardFilters): Promise<Blob> {
  if (isStaticDemo) {
    const demo = await getDemoData();
    const selectedDeals = applyFilters(demo.deals, { ...filters, sectors: [sector] }, false);
    return buildStaticSectorPdf(sector, selectedDeals, await getMarketCommentary(buildStaticOverview(selectedDeals, demo)));
  }

  const response = await fetch(`${API_BASE}/reports/sector`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sector, filters })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.blob();
}
