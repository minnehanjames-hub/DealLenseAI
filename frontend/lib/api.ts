import type { AnalyticsOverview, DashboardFilters, Deal, DealDetail, MarketCommentary, Metadata } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));
  const query = params.toString();
  return `${API_BASE}${path}${query ? `?${query}` : ""}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getMetadata(): Promise<Metadata> {
  return request<Metadata>(`${API_BASE}/metadata`);
}

export function getDeals(filters?: DashboardFilters): Promise<Deal[]> {
  return request<Deal[]>(withQuery("/deals", filters));
}

export function getDeal(id: string | number): Promise<DealDetail> {
  return request<DealDetail>(`${API_BASE}/deals/${id}`);
}

export function getAnalyticsOverview(filters?: DashboardFilters): Promise<AnalyticsOverview> {
  return request<AnalyticsOverview>(withQuery("/analytics/overview", filters));
}

export function getSectorAnalytics(filters?: DashboardFilters): Promise<{
  sector_momentum: AnalyticsOverview["scores"]["sector_momentum"];
  median_multiples_by_sector: AnalyticsOverview["tables"]["median_multiples_by_sector"];
  hot_sector_ranking: AnalyticsOverview["tables"]["hot_sector_ranking"];
}> {
  return request(withQuery("/analytics/sectors", filters));
}

export function getMarketCommentary(analytics: AnalyticsOverview): Promise<MarketCommentary> {
  return request<MarketCommentary>(`${API_BASE}/insights/commentary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analytics })
  });
}

export async function generateSectorReport(sector: string, filters?: DashboardFilters): Promise<Blob> {
  const response = await fetch(`${API_BASE}/reports/sector`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sector, filters })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.blob();
}

