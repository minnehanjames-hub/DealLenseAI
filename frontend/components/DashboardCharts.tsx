"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AnalyticsOverview } from "@/types";

const palette = ["#6ee7b7", "#7dd3fc", "#f8d477", "#c4b5fd", "#fb7185", "#93c5fd", "#fca5a5"];

export function DashboardCharts({ analytics }: { analytics: AnalyticsOverview }) {
  const charts = analytics.charts;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartPanel title="Deal Volume Over Time" subtitle="Monthly announced transactions">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={charts.deal_volume_over_time}>
            <CartesianGrid stroke="#223442" strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #223442", borderRadius: 6 }} />
            <Line type="monotone" dataKey="deals" stroke="#6ee7b7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Average EV/EBITDA By Sector" subtitle="Mean multiple across filtered transactions">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={charts.average_ev_ebitda_by_sector}>
            <CartesianGrid stroke="#223442" strokeDasharray="3 3" />
            <XAxis dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={80} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #223442", borderRadius: 6 }} />
            <Bar dataKey="mean_ev_ebitda" radius={[4, 4, 0, 0]}>
              {charts.average_ev_ebitda_by_sector.map((entry, index) => (
                <Cell key={entry.sector} fill={palette[index % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Strategic Vs Sponsor Buyer Mix" subtitle="Buyer composition and median paid multiples">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={charts.buyer_type_distribution}
              dataKey="deals"
              nameKey="buyer_type"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={2}
            >
              {charts.buyer_type_distribution.map((entry, index) => (
                <Cell key={entry.buyer_type} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #223442", borderRadius: 6 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-5">
          {charts.buyer_type_distribution.map((item, index) => (
            <div key={item.buyer_type} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: palette[index % palette.length] }} />
              {item.buyer_type}
            </div>
          ))}
        </div>
      </ChartPanel>

      <ChartPanel title="Deal Value Distribution" subtitle="Disclosed transaction value buckets">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={charts.deal_value_distribution}>
            <CartesianGrid stroke="#223442" strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #223442", borderRadius: 6 }} />
            <Bar dataKey="deals" fill="#7dd3fc" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Top Acquirers" subtitle="Most active buyers by transaction count">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={charts.top_acquirers} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid stroke="#223442" strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis dataKey="acquirer" type="category" width={145} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #223442", borderRadius: 6 }} />
            <Bar dataKey="deals" fill="#f8d477" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Sector Momentum" subtitle="Proprietary-style score from growth, multiples, sponsor share, and confidence">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={charts.sector_momentum}>
            <CartesianGrid stroke="#223442" strokeDasharray="3 3" />
            <XAxis dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={80} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #223442", borderRadius: 6 }} />
            <Bar dataKey="score" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="panel rounded-md p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

