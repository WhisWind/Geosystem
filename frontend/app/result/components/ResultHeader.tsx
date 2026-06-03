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
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Результат расчёта
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          {entry.type === "index" ? `${entry.index} • ${entry.satellite}` : 
           entry.type === "water" ? `${entry.model?.toUpperCase()} • Water` : 
           `Карта риска • ${entry.scenario}`}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {entry.filename}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Назад
        </button>
        <button
          onClick={onNewCalculation}
          className="rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200"
        >
          Новый расчёт
        </button>
      </div>
    </div>
  );
}
