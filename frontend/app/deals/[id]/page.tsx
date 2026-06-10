import fs from "node:fs";
import path from "node:path";
import { DealDetailClient } from "./DealDetailClient";

export function generateStaticParams() {
  try {
    const demoPath = path.join(process.cwd(), "public", "demo-data.json");
    const payload = JSON.parse(fs.readFileSync(demoPath, "utf-8")) as { deals?: Array<{ id: number | string }> };
    return (payload.deals ?? []).map((deal) => ({ id: String(deal.id) }));
  } catch {
    return Array.from({ length: 180 }, (_, index) => ({ id: String(index + 1) }));
  }
}

export default function DealDetailPage({ params }: { params: { id: string } }) {
  return <DealDetailClient id={params.id} />;
}
