"use client";

import { useMemo, useState, ChangeEvent, useEffect } from "react";
import { calculateIndex, segmentWater, assessRisk } from "./lib/api";
import { useRouter } from "next/navigation";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FileUpload } from "./components/FileUpload";
import { ModeSelector } from "./components/ModeSelector";
import { IndexParameters } from "./components/IndexParameters";
import { WaterParameters } from "./components/WaterParameters";
import { RiskParameters } from "./components/RiskParameters";
import { HistoryFileSelector } from "./components/HistoryFileSelector";

const satellites = ["Sentinel-2", "Landsat-8", "Канопус-В", "Метеор-М", "Ресурс-П"];
const indexes = ["NDVI", "NDWI", "EVI", "NBR", "GNDVI", "GEMI"];
const waterModels = ["ndwi", "mndwi"];

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Дефолтные значения
  const [mode, setMode] = useState<"index" | "water" | "risk">("index");
  const [file, setFile] = useState<File | null>(null);
  const [satellite, setSatellite] = useState(satellites[0]);
  const [indexName, setIndexName] = useState(indexes[0]);
  const [waterModel, setWaterModel] = useState(waterModels[0]);
  const [threshold, setThreshold] = useState(0.5);
  const [riskScenario, setRiskScenario] = useState("flooding");
  const [normalizationType, setNormalizationType] = useState("linear");
  const [safeThreshold, setSafeThreshold] = useState(0.3);
  const [dangerThreshold, setDangerThreshold] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [showHistorySelector, setShowHistorySelector] = useState(false);

  // Загружаем параметры из hash после монтирования
  useEffect(() => {
    setMounted(true);
    
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const params = new URLSearchParams(hash);
        if (params.get('mode')) setMode(params.get('mode') as "index" | "water" | "risk");
        if (params.get('satellite')) setSatellite(params.get('satellite')!);
        if (params.get('index')) setIndexName(params.get('index')!);
        if (params.get('model')) setWaterModel(params.get('model')!);
        if (params.get('threshold')) setThreshold(parseFloat(params.get('threshold')!));
        if (params.get('scenario')) setRiskScenario(params.get('scenario')!);
        if (params.get('norm')) setNormalizationType(params.get('norm')!);
        if (params.get('safe')) setSafeThreshold(parseFloat(params.get('safe')!));
        if (params.get('danger')) setDangerThreshold(parseFloat(params.get('danger')!));
      } catch {}
    }

    const historyStr = localStorage.getItem("calculationHistory");
    if (historyStr) {
      try {
        const history = JSON.parse(historyStr);
        if (Array.isArray(history) && history.length > 0) {
          setHasHistory(true);
        }
      } catch {}
    }
  }, []);

  // Обновляем hash при изменении параметров (только после монтирования)
  useEffect(() => {
    if (!mounted) return;
    
    const params = new URLSearchParams();
    params.set('mode', mode);
    
    // Сохраняем только параметры для текущего режима
    if (mode === 'index') {
      params.set('satellite', satellite);
      params.set('index', indexName);
    } else if (mode === 'water') {
      params.set('model', waterModel);
      params.set('threshold', threshold.toString());
    } else if (mode === 'risk') {
      params.set('scenario', riskScenario);
      params.set('norm', normalizationType);
      params.set('safe', safeThreshold.toString());
      params.set('danger', dangerThreshold.toString());
    }
    
    window.history.replaceState(null, '', `#${params.toString()}`);
  }, [mounted, mode, satellite, indexName, waterModel, threshold, riskScenario, normalizationType, safeThreshold, dangerThreshold]);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    const sizeMb = file.size / 1024 / 1024;
    return {
      name: file.name,
      size: `${sizeMb.toFixed(2)} MB`,
      ext: (file.name.split(".").pop() || "").toUpperCase(),
    };
  }, [file]);

  const validateAndSetFile = (selected: File) => {
    if (!selected.name.match(/\.(tif|tiff)$/i)) {
      setError("Поддерживаются только файлы .tif и .tiff");
      setFile(null);
      return;
    }
    setFile(selected);
    setError(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    validateAndSetFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (!selected) return;
    validateAndSetFile(selected);
  };

  const handleSelectFromHistory = async (resultId: string, filename: string) => {
    try {
      // Загружаем исходный TIFF файл (source.tif) из результатов
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
      const response = await fetch(`${apiBase}/data/results/${resultId}/source.tif`);
      
      if (!response.ok) {
        throw new Error("Не удалось загрузить файл из истории");
      }
      
      const blob = await response.blob();
      const file = new File([blob], filename, { type: "image/tiff" });
      
      setFile(file);
      setError(null);
    } catch (err) {
      setError("Ошибка загрузки файла из истории: " + (err as Error).message);
    }
  };

  const handleSubmit = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    let response;
    try {
      if (mode === "index") {
        response = await calculateIndex(file, satellite, indexName);
      } else if (mode === "water") {
        response = await segmentWater(file, waterModel, threshold);
      } else {
        response = await assessRisk(file, riskScenario, normalizationType);
      }

      if (!response?.id) {
        throw new Error("Сервер не вернул ID результата");
      }

      const entry = {
        id: response.id,
        filename: file.name,
        type: mode,
        ...(mode === "index"
          ? { satellite, index: indexName }
          : mode === "water"
            ? { model: waterModel, threshold }
            : { scenario: riskScenario, normalizationType }),
        message: response?.message || "Расчёт завершён",
        timestamp: Date.now(),
      };

      const historyStr = localStorage.getItem("calculationHistory");
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.push(entry);
      localStorage.setItem("calculationHistory", JSON.stringify(history));

      router.push("/result");
    } catch (err: any) {
      setError(err?.message || "Произошла ошибка при обработке");
    } finally {
      setLoading(false);
    }
  };

  const getHintText = () => {
    if (mode === "index") {
      return "Некоторые индексы требуют определённых каналов — сервер вернёт ошибку, если их нет.";
    } else if (mode === "water") {
      return "⚠️ Модель требует ровно 12 каналов Sentinel-2. Используйте объединение каналов для создания 12-канального файла.";
    } else {
      return "Сценарий определяет веса индексов для интегрального риска.";
    }
  };

  const getButtonText = () => {
    if (loading) return "Выполняется...";
    if (mode === "index") return "Рассчитать индекс";
    if (mode === "water") return "Сегментировать воду";
    return "Рассчитать карту риска";
  };

  return (
    <>
      <Header />
      <div className="min-h-screen w-full bg-gray-50 text-gray-900">
        <BackgroundEffects />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
          {!mounted ? (
            // Показываем загрузку до монтирования, чтобы избежать hydration error
            <div className="w-full flex items-center justify-center">
              <div className="animate-pulse text-gray-600">Загрузка...</div>
            </div>
          ) : (
          <div className="grid w-full gap-8 lg:grid-cols-2">
          <HeroSection hasHistory={hasHistory} onViewHistory={() => router.push("/result")} />

          <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-sm font-medium">Новый расчёт</div>
                <div className="mt-1 text-xs text-gray-600">Выберите файл и параметры</div>
              </div>
              <button
                onClick={() => setShowHistorySelector(true)}
                disabled={loading}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {loading ? "Обработка..." : "Из истории"}
              </button>
            </div>

            <ModeSelector mode={mode} onChange={setMode} />

            <FileUpload
              file={file}
              fileMeta={fileMeta}
              dragOver={dragOver}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              {mode === "index" && (
                <IndexParameters
                  satellite={satellite}
                  indexName={indexName}
                  onSatelliteChange={setSatellite}
                  onIndexChange={setIndexName}
                />
              )}

              {mode === "water" && (
                <WaterParameters
                  waterModel={waterModel}
                  threshold={threshold}
                  onModelChange={setWaterModel}
                  onThresholdChange={setThreshold}
                />
              )}

              {mode === "risk" && (
                <RiskParameters
                  riskScenario={riskScenario}
                  normalizationType={normalizationType}
                  safeThreshold={safeThreshold}
                  dangerThreshold={dangerThreshold}
                  onScenarioChange={setRiskScenario}
                  onNormalizationChange={setNormalizationType}
                  onSafeThresholdChange={setSafeThreshold}
                  onDangerThresholdChange={setDangerThreshold}
                />
              )}
            </div>

            {mode === "water" && (
              <div className="mt-6 rounded-2xl border border-orange-600 bg-orange-900/80 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white mb-1">
                      Требования к файлу
                    </div>
                    <div className="text-xs text-gray-100 leading-relaxed">
                      Нейронная сеть требует <strong className="text-orange-300">ровно 12 каналов Sentinel-2</strong>. Используйте кнопку "Объединить отдельные каналы" для создания 12-канального файла из отдельных спектральных каналов B01-B12.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-xs text-gray-600">{getHintText()}</div>

            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className={`
                mt-6 w-full rounded-2xl px-6 py-4 text-sm font-semibold transition-all shadow-lg
                ${!file || loading
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Выполняется...
                </span>
              ) : (
                getButtonText()
              )}
            </button>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
          </div>
          )}
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Satellite Indices • Next.js + Tailwind
        </div>
      </div>

      <HistoryFileSelector
        isOpen={showHistorySelector}
        onClose={() => setShowHistorySelector(false)}
        onSelect={handleSelectFromHistory}
      />
    </>
  );
}
