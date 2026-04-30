import { SearchX } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="panel grid min-h-[220px] place-items-center rounded-md p-8 text-center">
      <div>
        <SearchX className="mx-auto h-8 w-8 text-slate-500" />
        <h3 className="mt-3 text-base font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}

