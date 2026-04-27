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

const satellites = ["Sentinel-2", "Landsat-8", "Канопус-В", "Метеор-М", "Ресурс-П"];
const indexes = ["NDVI", "NDWI", "EVI", "NBR", "GNDVI", "GEMI"];
const waterModels = ["awei", "ndwi", "mndwi"];

export default function Home() {
  const router = useRouter();

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

  useEffect(() => {
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
      return "Модель определяет способ выделения воды. Порог влияет на чувствительность.";
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
      <div className="min-h-screen w-full bg-neutral-950 text-white">
        <BackgroundEffects />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
          <div className="grid w-full gap-8 lg:grid-cols-2">
          <HeroSection hasHistory={hasHistory} onViewHistory={() => router.push("/result")} />

          <div className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-sm font-medium">Новый расчёт</div>
                <div className="mt-1 text-xs text-white/60">Выберите файл и параметры</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                {loading ? "Обработка..." : "Готово к запуску"}
              </div>
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

            <div className="mt-6 text-xs text-white/60">{getHintText()}</div>

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
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Satellite Indices • Next.js + Tailwind
        </div>
      </div>
    </>
  );
}
