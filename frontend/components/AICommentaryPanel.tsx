import { BrainCircuit, Sparkles } from "lucide-react";
import type { MarketCommentary } from "@/types";

export function AICommentaryPanel({ commentary }: { commentary: MarketCommentary | null }) {
  return (
    <section className="panel rounded-md p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <BrainCircuit className="h-4 w-4 text-mint" />
            AI Market Commentary
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Generated from the structured analytics output, not from free-form dashboard prompts.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md border border-mint/20 bg-mint/10 px-2 py-1 text-xs text-mint">
          <Sparkles className="h-3 w-3" />
          {commentary?.mode ?? "mock"}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {(commentary?.commentary ?? []).map((item) => (
          <p key={item} className="rounded-md border border-line bg-ink/50 p-3 text-sm leading-6 text-slate-300">
            {item}
          </p>
        ))}
        {!commentary ? <p className="text-sm text-slate-500">Commentary will load after analytics refresh.</p> : null}
      </div>
      {commentary?.watchpoints?.length ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Watchpoints</p>
          <ul className="mt-2 space-y-2">
            {commentary.watchpoints.map((point) => (
              <li key={point} className="text-sm leading-6 text-slate-400">
                {point}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

