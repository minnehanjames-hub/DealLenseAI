export function ScoreBadge({ score, label }: { score?: number | null; label?: string }) {
  const value = score ?? 0;
  const tone =
    value >= 75
      ? "border-mint/30 bg-mint/10 text-mint"
      : value >= 55
        ? "border-gold/30 bg-gold/10 text-gold"
        : "border-rose-300/30 bg-rose-400/10 text-rose-200";

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${tone}`}>
      {label ? `${label}: ` : null}
      {value.toFixed(1)}
    </span>
  );
}
