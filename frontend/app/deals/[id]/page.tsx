import { DealDetailClient } from "./DealDetailClient";

export function generateStaticParams() {
  return Array.from({ length: 180 }, (_, index) => ({ id: String(index + 1) }));
}

export default function DealDetailPage({ params }: { params: { id: string } }) {
  return <DealDetailClient id={params.id} />;
}
