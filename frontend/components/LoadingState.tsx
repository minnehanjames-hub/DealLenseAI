export function LoadingState({ label = "Loading market intelligence" }: { label?: string }) {
  return (
    <div className="panel grid min-h-[260px] place-items-center rounded-md p-8">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-mint/20 border-t-mint" />
        <p className="mt-4 text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

