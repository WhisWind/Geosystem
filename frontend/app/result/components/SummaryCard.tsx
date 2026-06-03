interface MetaData {
  processing_time_seconds?: number;
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

function formatProcessingTime(seconds: number): string {
  if (seconds < 0.001) {
    // Меньше 1 мс - показываем в микросекундах
    const us = seconds * 1000000;
    if (us < 10) {
      return `${us.toFixed(1)} мкс`;
    }
    return `${us.toFixed(0)} мкс`;
  } else if (seconds < 1) {
    // От 1 мс до 1 сек - показываем в миллисекундах
    const ms = seconds * 1000;
    if (ms < 10) {
      return `${ms.toFixed(1)} мс`;
    }
    return `${ms.toFixed(0)} мс`;
  } else if (seconds < 60) {
    // От 1 до 60 сек - показываем в секундах с 2 знаками
    return `${seconds.toFixed(2)} сек`;
  } else {
    // Больше минуты - показываем минуты и секунды
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} мин ${secs.toFixed(0)} сек`;
  }
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

export function SummaryCard({ entry, meta, loadingMeta, tiffUrl, previewUrl, onDownload }: SummaryCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">Сводка</div>
          <div className="mt-1 text-xs text-gray-600">Файл и параметры расчёта</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-700">
          TIFF
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs text-gray-600">Файл</div>
          <div className="mt-1 truncate text-sm font-medium text-gray-900">{entry.filename}</div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs text-gray-600">Тип</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {entry.type === "index" ? "Индекс" : 
             entry.type === "water" ? "Выделение воды" : 
             "Карта риска"}
          </div>
        </div>
      </div>

      {meta?.processing_time_seconds !== undefined && (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-emerald-800">
              Время обработки: <strong>{formatProcessingTime(meta.processing_time_seconds)}</strong>
            </div>
          </div>
        </div>
      )}

      {entry.type === "risk" && (
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-900">Статистика</div>
          {loadingMeta ? (
            <div className="mt-3 text-center text-gray-500">Загрузка статистики...</div>
          ) : meta ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <StatTile label="Безопасно" value={`${meta.stats?.safe_percent?.toFixed(1) ?? "—"}%`} />
              <StatTile label="Средний риск" value={`${meta.stats?.medium_percent?.toFixed(1) ?? "—"}%`} />
              <StatTile label="Опасно" value={`${meta.stats?.danger_percent?.toFixed(1) ?? "—"}%`} />
            </div>
          ) : (
            <div className="mt-3 text-center text-gray-500">Статистика недоступна</div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onDownload(tiffUrl, `result_${entry.filename}.tif`)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99] sm:w-auto"
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
