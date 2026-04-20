"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface HistoryEntry {
  id: string;
  filename: string;
  type: "index" | "water" | "risk";
  satellite?: string;
  index?: string;
  model?: string;
  threshold?: number;
  scenario?: string;
  timestamp: number;
}

interface MetaData {
  id: string;
  filename: string;
  scenario?: string;
  normalization_type?: string;
  calculated_indices?: string[];
  stats: {
    safe_percent?: number;
    medium_percent?: number;
    danger_percent?: number;
  };
  message: string;
}

function StatTile(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{props.label}</div>
      <div className="mt-1 text-sm font-medium">{props.value}</div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("calculationHistory");
    if (!data) {
      router.push("/");
      return;
    }
    try {
      const parsed: HistoryEntry[] = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        router.push("/");
        return;
      }
      const sorted = [...parsed].sort((a, b) => b.timestamp - a.timestamp);
      setHistory(sorted);
      setSelectedId(sorted[0].id);
    } catch {
      router.push("/");
    }
  }, [router]);

  // Загрузка meta.json для статистики
  useEffect(() => {
    if (!selectedId) {
      setMeta(null);
      return;
    }

    setLoadingMeta(true);
    fetch(`/data/results/${selectedId}/meta.json`)
      .then(res => {
        if (!res.ok) throw new Error("Meta not found");
        return res.json();
      })
      .then(setMeta)
      .catch(() => setMeta(null))
      .finally(() => setLoadingMeta(false));
  }, [selectedId]);

  const entry = history.find(h => h.id === selectedId);

  const previewUrl = selectedId ? `/data/results/${selectedId}/preview.png` : null;
  const tiffUrl = selectedId ? `/data/results/${selectedId}/result.tif` : null;

  const indexUrls = entry?.type === "risk" ? {
    NDWI: selectedId ? `/data/results/${selectedId}/indices/NDWI.png` : null,
    NDVI: selectedId ? `/data/results/${selectedId}/indices/NDVI.png` : null,
    BSI: selectedId ? `/data/results/${selectedId}/indices/BSI.png` : null,
  } : {};

  const indexTiffUrls = entry?.type === "risk" ? {
    NDWI: selectedId ? `/data/results/${selectedId}/indices/NDWI.tif` : null,
    NDVI: selectedId ? `/data/results/${selectedId}/indices/NDVI.tif` : null,
    BSI: selectedId ? `/data/results/${selectedId}/indices/BSI.tif` : null,
  } : {};

  const handleDownload = (url: string | null, filename: string) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleNewCalculation = () => {
    localStorage.removeItem("calculationHistory");
    router.push("/");
  };

  const handleBack = () => router.push("/");

  if (!entry) return null;

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 flex gap-6 flex-col md:flex-row">
        {/* Sidebar */}
        <div className={`flex-shrink-0 w-full md:w-64 lg:w-80 bg-white/[0.03] rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">История расчётов</div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden rounded-full bg-white/10 p-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSelectedId(item.id); setIsSidebarOpen(false); }}
                className={[
                  "w-full rounded-2xl border border-white/10 p-4 text-left transition",
                  selectedId === item.id ? "bg-white/10" : "bg-white/5 hover:bg-white/[0.08]",
                ].join(" ")}
              >
                <div className="text-sm font-medium">
                  {item.type === "index" ? item.index : 
                   item.type === "water" ? item.model?.toUpperCase() : 
                   "Карта риска"} • {item.type === "index" ? item.satellite : 
                   item.type === "water" ? "Water" : item.scenario}
                </div>
                <div className="mt-1 text-xs text-white/60 truncate">{item.filename}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile toggle */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed bottom-4 left-4 z-10 md:hidden rounded-full bg-white/10 p-3 shadow-lg ${isSidebarOpen ? 'hidden' : 'block'}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Основной контент */}
        <div className="flex-1">
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
                onClick={handleBack}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
              >
                Назад
              </button>
              <button
                onClick={handleNewCalculation}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.14]"
              >
                Новый расчёт
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Сводка и статистика */}
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

              {/* Статистика — показывается ТОЛЬКО для "risk" */}
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
                  onClick={() => handleDownload(tiffUrl, `result_${entry.filename}.tif`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 active:scale-[0.99] sm:w-auto"
                >
                  Скачать TIFF
                </button>

                {previewUrl && (
                  <button
                    onClick={() => handleDownload(previewUrl, `preview_${entry.filename}.png`)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-4 text-sm font-semibold transition hover:bg-emerald-700 active:scale-[0.99] sm:w-auto"
                  >
                    Скачать PNG
                  </button>
                )}
              </div>
            </div>

            {/* Превью и индексы */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Превью</div>
                  <div className="mt-1 text-xs text-white/60">
                    {entry.type === "index" ? "Индекс" : 
                     entry.type === "water" ? "Маска воды" : 
                     "Карта риска"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                  Preview
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-auto max-h-[500px] object-contain"
                    onError={() => console.error("Preview load failed")}
                  />
                ) : (
                  <div className="text-center py-20 text-white/50">
                    Выберите расчёт из истории
                  </div>
                )}
              </div>

              {/* Если risk — показываем отдельные индексы */}
              {entry.type === "risk" && (
                <div className="mt-8">
                  <div className="text-sm font-medium mb-4">Индексы, участвовавшие в расчёте</div>
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
                            onClick={() => handleDownload(`/data/results/${selectedId}/indices/${name}.tif`, `${name}.tif`)}
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
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
            <div>© {new Date().getFullYear()} Satellite Indices</div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Next.js + Tailwind
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Results on server
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}