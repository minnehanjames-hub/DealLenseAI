export type BuyerType = "Strategic" | "Sponsor" | "Corporate" | "Family Office" | "Other";

export interface Deal {
  id: number;
  target_company: string;
  acquirer: string;
  sector: string;
  subsector: string;
  geography: string;
  announcement_date: string;
  deal_value_musd: number | null;
  revenue_musd: number | null;
  ebitda_musd: number | null;
  ev_revenue_multiple: number | null;
  ev_ebitda_multiple: number | null;
  buyer_type: BuyerType;
  deal_type: string;
  target_description: string;
  rationale: string;
  source_quality_score: number;
  confidence_score: number;
}

export interface DealDetail extends Deal {
  attractiveness_score: number;
  peer_comparison: {
    sector: string;
    sector_deal_count: number;
    sector_median_ev_revenue: number | null;
    sector_median_ev_ebitda: number | null;
    premium_to_sector_median: number | null;
  };
  ai_deal_commentary: string;
  red_flags: string[];
  similar_transactions: Array<{
    id: number;
    target_company: string;
    acquirer: string;
    announcement_date: string;
    deal_value_musd: number | null;
    ev_ebitda_multiple: number | null;
    buyer_type: BuyerType;
  }>;
}

export interface DashboardFilters {
  sectors?: string[];
  geographies?: string[];
  buyer_types?: BuyerType[];
  min_deal_value?: number;
  max_deal_value?: number;
  date_from?: string;
  date_to?: string;
  multiple_availability?: "all" | "revenue" | "ebitda" | "both";
  limit?: number;
  offset?: number;
}

export interface Metadata {
  sectors: string[];
  geographies: string[];
  buyer_types: BuyerType[];
}

export interface AnalyticsOverview {
  kpis: {
    total_deals: number;
    total_disclosed_value_musd: number;
    median_ev_revenue: number;
    median_ev_ebitda: number;
    most_active_sector: string;
    strategic_vs_sponsor_split: {
      strategic_or_corporate: number;
      sponsor: number;
      other: number;
    };
  };
  charts: {
    deal_volume_over_time: Array<{ period: string; deals: number; total_value_musd: number }>;
    deal_count_by_quarter: Array<{ period: string; deals: number; total_value_musd: number }>;
    average_ev_ebitda_by_sector: Array<{
      sector: string;
      mean_ev_revenue: number;
      mean_ev_ebitda: number;
      average_deal_value_musd: number;
    }>;
    buyer_type_distribution: Array<{
      buyer_type: BuyerType;
      deals: number;
      share: number;
      median_ev_ebitda: number;
      total_value_musd: number;
    }>;
    deal_value_distribution: Array<{ bucket: string; deals: number }>;
    top_acquirers: Array<{
      acquirer: string;
      deals: number;
      total_value_musd: number;
      median_ev_ebitda: number;
      buyer_type: BuyerType;
    }>;
    sector_momentum: SectorMomentum[];
    valuation_premium_by_buyer_type: Array<{
      buyer_type: BuyerType;
      median_ev_ebitda: number;
      premium_to_market: number;
    }>;
  };
  tables: {
    median_multiples_by_sector: Array<{
      sector: string;
      deal_count: number;
      median_ev_revenue: number;
      median_ev_ebitda: number;
      total_value_musd: number;
    }>;
    hot_sector_ranking: SectorMomentum[];
    acquirer_aggressiveness: AcquirerAggressiveness[];
  };
  scores: {
    sector_momentum: SectorMomentum[];
    acquirer_aggressiveness: AcquirerAggressiveness[];
  };
  outliers: Array<{
    id: number;
    target_company: string;
    sector: string;
    ev_ebitda_multiple: number;
    direction: "High" | "Low";
  }>;
  deal_scores: Record<string, number>;
}

export interface SectorMomentum {
  sector: string;
  score: number;
  recent_deal_count: number;
  deal_count_growth: number;
  median_multiple_expansion: number;
  sponsor_share: number;
  confidence_score: number;
  deal_value_growth: number;
}

export interface AcquirerAggressiveness {
  acquirer: string;
  score: number;
  acquisitions: number;
  average_deal_value_musd: number;
  median_multiple_premium: number;
  recent_activity: number;
  primary_buyer_type: BuyerType;
}

export interface MarketCommentary {
  mode: "mock" | "llm";
  summary: string;
  commentary: string[];
  watchpoints: string[];
}

