export function money(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) return "n/a";
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  return `$${value.toFixed(0)}M`;
}

export function multiple(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) return "n/a";
  return `${value.toFixed(1)}x`;
}

export function pct(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return `${(value * 100).toFixed(0)}%`;
}

export function shortDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(
    new Date(year, month - 1, day)
  );
}
