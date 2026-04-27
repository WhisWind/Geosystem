interface MetaData {
  stats: {
    safe_percent?: number;
    medium_percent?: number;
    danger_percent?: number;
  };
}

interface HistoryEntry {
  filename: string;
  type: "index" | "water" | "risk";
}

interface SummaryCardProps {
  entry: HistoryEntry;
  meta: MetaData | null;
  loadingMeta: boolean;
  tiffUrl: string | null;
  previewUrl: string | null;
  onDownload: (url: string | null, filename: string) => void;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

export function SummaryCard({ entry, meta, loadingMeta, tiffUrl, previewUrl, onDownload }: SummaryCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Сводка</div>
          <div className="mt-1 text-xs text-white/60">Файл и параметры расчёта</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          TIFF
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Файл</div>
          <div className="mt-1 truncate text-sm font-medium">{entry.filename}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Тип</div>
          <div className="mt-1 text-sm font-medium">
            {entry.type === "index" ? "Индекс" : 
             entry.type === "water" ? "Выделение воды" : 
             "Карта риска"}
          </div>
        </div>
      </div>

      {entry.type === "risk" && (
        <div className="mt-6">
          <div className="text-sm font-medium">Статистика</div>
          {loadingMeta ? (
            <div className="mt-3 text-center text-white/50">Загрузка статистики...</div>
          ) : meta ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <StatTile label="Безопасно" value={`${meta.stats?.safe_percent?.toFixed(1) ?? "—"}%`} />
              <StatTile label="Средний риск" value={`${meta.stats?.medium_percent?.toFixed(1) ?? "—"}%`} />
              <StatTile label="Опасно" value={`${meta.stats?.danger_percent?.toFixed(1) ?? "—"}%`} />
            </div>
          ) : (
            <div className="mt-3 text-center text-white/50">Статистика недоступна</div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onDownload(tiffUrl, `result_${entry.filename}.tif`)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 active:scale-[0.99] sm:w-auto"
        >
          Скачать TIFF
        </button>

        {previewUrl && (
          <button
            onClick={() => onDownload(previewUrl, `preview_${entry.filename}.png`)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-4 text-sm font-semibold transition hover:bg-emerald-700 active:scale-[0.99] sm:w-auto"
          >
            Скачать PNG
          </button>
        )}
      </div>
    </div>
  );
}
