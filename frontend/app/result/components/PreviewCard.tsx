interface HistoryEntry {
  type: "index" | "water" | "risk";
}

interface PreviewCardProps {
  entry: HistoryEntry;
  previewUrl: string | null;
  selectedId: string | null;
  onDownload: (url: string, filename: string) => void;
}

export function PreviewCard({ entry, previewUrl, selectedId, onDownload }: PreviewCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">Превью</div>
          <div className="mt-1 text-xs text-gray-600">
            {entry.type === "index" ? "Индекс" : 
             entry.type === "water" ? "Маска воды" : 
             "Карта риска"}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-700">
          Preview
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-gray-50">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-auto max-h-[500px] object-contain"
            onError={() => console.error("Preview load failed")}
          />
        ) : (
          <div className="text-center py-20 text-gray-500">
            Выберите расчёт из истории
          </div>
        )}
      </div>

      {entry.type === "risk" && selectedId && (
        <div className="mt-8">
          <div className="text-sm font-medium text-gray-900 mb-4">Индексы, участвовавшие в расчёте</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {["NDWI", "NDVI", "BSI"].map(name => (
              <div key={name} className="relative group">
                <img
                  src={`/data/results/${selectedId}/indices/${name}.png`}
                  alt={name}
                  className="w-full rounded-xl shadow-lg"
                  onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <button
                    onClick={() => onDownload(`/data/results/${selectedId}/indices/${name}.tif`, `${name}.tif`)}
                    className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200"
                  >
                    Скачать {name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
