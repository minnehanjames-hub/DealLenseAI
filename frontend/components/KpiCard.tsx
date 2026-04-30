import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  subtext,
  icon: Icon
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="glass rounded-md p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-cyan/10 text-cyan">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {subtext ? <p className="mt-3 text-xs text-slate-400">{subtext}</p> : null}
    </div>
  );
}

