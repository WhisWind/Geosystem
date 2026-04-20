"use client";

import { useMemo, useRef, useState, ChangeEvent, useEffect } from "react";
import { calculateIndex, segmentWater, assessRisk } from "./lib/api"; // добавь assessRisk в api.ts
import { useRouter } from "next/navigation";

const satellites = ["Sentinel-2", "Landsat-8", "Канопус-В", "Метеор-М", "Ресурс-П"];
const indexes = ["NDVI", "NDWI", "EVI", "NBR", "GNDVI", "GEMI"];
const waterModels = ["awei", "ndwi", "mndwi"];
const riskScenarios = ["flooding", "ecological", "passability"];
const normalizationTypes = ["linear", "threshold", "sigmoid", "log"];

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<"index" | "water" | "risk">("index");
  const [file, setFile] = useState<File | null>(null);
  const [satellite, setSatellite] = useState(satellites[0]);
  const [indexName, setIndexName] = useState(indexes[0]);
  const [waterModel, setWaterModel] = useState(waterModels[0]);
  const [threshold, setThreshold] = useState(0.5);
  const [riskScenario, setRiskScenario] = useState(riskScenarios[0]);
  const [normalizationType, setNormalizationType] = useState(normalizationTypes[0]);
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

    // Проверяем, что сервер вернул ID
    if (!response?.id) {
      throw new Error("Сервер не вернул ID результата");
    }

    // Создаём запись в историю
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

    // Сохраняем в историю
    const historyStr = localStorage.getItem("calculationHistory");
    const history = historyStr ? JSON.parse(historyStr) : [];
    history.push(entry);
    localStorage.setItem("calculationHistory", JSON.stringify(history));

    // Переходим на результат только при успехе
    router.push("/result");
  } catch (err: any) {
    // Показываем ошибку на текущей странице, НЕ переходим на /result
    setError(err?.message || "Произошла ошибка при обработке");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Анализ спутниковых индексов
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Рассчитай индекс по GeoTIFF за пару кликов
            </h1>

            <p className="max-w-xl text-sm leading-6 text-white/70">
              Загрузите .tif/.tiff, выберите спутник и индекс. Результат будет сохранён в сессии браузера
              и открыт на следующей странице.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Формат</div>
                <div className="mt-1 text-sm font-medium">TIFF / GeoTIFF</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Расчёт</div>
                <div className="mt-1 text-sm font-medium">На сервере</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Сохранение</div>
                <div className="mt-1 text-sm font-medium">LocalStorage</div>
              </div>
            </div>

            {hasHistory && (
              <button
                onClick={() => router.push("/result")}
                className="w-full sm:w-auto rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold transition hover:bg-white/[0.14] border border-white/10"
              >
                Просмотреть предыдущие расчёты
              </button>
            )}
          </div>

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

            {/* Режим обработки */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-medium text-white/70">
                Режим обработки
              </label>
              <div className="relative">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "index" | "water" | "risk")}
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/[0.07]"
                >
                  <option value="index">Расчёт индекса</option>
                  <option value="water">Выделение водных ресурсов</option>
                  <option value="risk">Карта риска</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Зона загрузки файла */}
            <div className="mb-6">
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`group relative cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition ${
                  dragOver
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".tif,.tiff"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-white/10 p-4">
                    <svg className="h-8 w-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  {fileMeta ? (
                    <div className="text-center">
                      <p className="font-medium">{fileMeta.name}</p>
                      <p className="text-xs text-white/60 mt-1">
                        {fileMeta.size} • {fileMeta.ext}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Перетащите файл сюда</p>
                      <p className="text-xs text-white/60 mt-1">или кликните для выбора .tif/.tiff</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Параметры в зависимости от режима */}
            <div className="grid gap-6 sm:grid-cols-2">
              {mode === "index" ? (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">Спутник</label>
                    <div className="relative">
                      <select
                        value={satellite}
                        onChange={(e) => setSatellite(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/[0.07] transition"
                      >
                        {satellites.map((sat) => (
                          <option key={sat} value={sat}>
                            {sat}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">Индекс</label>
                    <div className="relative">
                      <select
                        value={indexName}
                        onChange={(e) => setIndexName(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/[0.07] transition"
                      >
                        {indexes.map((idx) => (
                          <option key={idx} value={idx}>
                            {idx}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : mode === "water" ? (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">Модель</label>
                    <div className="relative">
                      <select
                        value={waterModel}
                        onChange={(e) => setWaterModel(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/[0.07] transition"
                      >
                        {waterModels.map((model) => (
                          <option key={model} value={model}>
                            {model.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">Порог (0–1)</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={threshold}
                      onChange={(e) => setThreshold(parseFloat(e.target.value) || 0.5)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/[0.07] transition"
                    />
                  </div>
                </>
              ) : (
                // Режим "risk"
                <div className="sm:col-span-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">Сценарий риска</label>
                    <div className="relative">
                      <select
                        value={riskScenario}
                        onChange={(e) => setRiskScenario(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/[0.07]"
                      >
                        <option value="flooding">Подтопление</option>
                        <option value="ecological">Экологическая устойчивость</option>
                        <option value="passability">Проходимость</option>
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Нормализация */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">Нормализация</label>
                    <div className="relative">
                      <select
                        value={normalizationType}
                        onChange={(e) => setNormalizationType(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/[0.07]"
                      >
                        <option value="linear">Линейная</option>
                        <option value="threshold">По порогам</option>
                        <option value="sigmoid">Сигмоидная</option>
                        <option value="log">Логарифмическая</option>
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Пороги — появляются ТОЛЬКО при "threshold" */}
                  {normalizationType === "threshold" && (
                    <div className="sm:col-span-2 grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-white/70">Безопасно до</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={safeThreshold}
                          onChange={(e) => setSafeThreshold(parseFloat(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                        <div className="text-center text-sm text-white/80 mt-1">
                          {(safeThreshold * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-white/70">Опасно от</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={dangerThreshold}
                          onChange={(e) => setDangerThreshold(parseFloat(e.target.value))}
                          className="w-full accent-red-600"
                        />
                        <div className="text-center text-sm text-white/80 mt-1">
                          {(dangerThreshold * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>)}
                </div>
              )}
            </div>

            <div className="mt-6 text-xs text-white/60">
              {mode === "index"
                ? "Некоторые индексы требуют определённых каналов — сервер вернёт ошибку, если их нет."
                : mode === "water"
                  ? "Модель определяет способ выделения воды. Порог влияет на чувствительность."
                  : "Сценарий определяет веса индексов для интегрального риска."}
            </div>

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
              ) : mode === "index" ? "Рассчитать индекс" : mode === "water" ? "Сегментировать воду" : "Рассчитать карту риска"}
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
  );
} 