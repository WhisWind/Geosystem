interface HistoryEntry {
  id: string;
  filename: string;
  type: "index" | "water" | "risk";
  satellite?: string;
  index?: string;
  model?: string;
  scenario?: string;
}

interface ResultHeaderProps {
  entry: HistoryEntry;
  onBack: () => void;
  onNewCalculation: () => void;
}

export function ResultHeader({ entry, onBack, onNewCalculation }: ResultHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Результат расчёта
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {entry.type === "index" ? `${entry.index} • ${entry.satellite}` : 
           entry.type === "water" ? `${entry.model?.toUpperCase()} • Water` : 
           `Карта риска • ${entry.scenario}`}
        </h1>
        <p className="mt-2 text-sm text-white/70">
          {entry.filename}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
        >
          Назад
        </button>
        <button
          onClick={onNewCalculation}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.14]"
        >
          Новый расчёт
        </button>
      </div>
    </div>
  );
}
