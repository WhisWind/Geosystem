"use client";
import { useState } from "react";
import { calculateIndex } from "../../lib/api";
import { BandStackingModal } from "../../components/BandStackingModal";

interface AddSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesId: string;
  satellite: string;
  indexType: string;
  onAdded: () => void;
}

export function AddSnapshotModal({ isOpen, onClose, seriesId, satellite, indexType, onAdded }: AddSnapshotModalProps) {
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"single" | "multi">("single");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBandStacking, setShowBandStacking] = useState(false);

  const handleStackedFile = (stackedFile: File) => {
    setFile(stackedFile);
    setShowBandStacking(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.tif') || droppedFile.name.endsWith('.tiff'))) {
      setFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!date || !file) {
      alert("Заполните все поля");
      return;
    }

    setLoading(true);

    try {
      // Используем API функцию для расчёта индекса
      const result = await calculateIndex(file, satellite, indexType);

      // Создать снимок
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
      const snapshot = {
        id: Date.now().toString(),
        date,
        previewUrl: `${apiBase}${result.meta.preview_url || result.preview_url}`,
        mean: result.meta.stats.mean,
        min: result.meta.stats.min,
        max: result.meta.stats.max,
      };

      // Добавить в временной ряд
      const data = localStorage.getItem("timeSeries");
      if (data) {
        const allSeries = JSON.parse(data);
        const seriesIndex = allSeries.findIndex((s: any) => s.id === seriesId);
        if (seriesIndex !== -1) {
          if (!allSeries[seriesIndex].snapshots) {
            allSeries[seriesIndex].snapshots = [];
          }
          allSeries[seriesIndex].snapshots.push(snapshot);
          // Сортировать по дате
          allSeries[seriesIndex].snapshots.sort((a: any, b: any) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          localStorage.setItem("timeSeries", JSON.stringify(allSeries));
        }
      }

      setDate("");
      setFile(null);
      onAdded();
      onClose();
    } catch (error) {
      alert("Ошибка: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-3xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Добавить снимок</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-white/80 mb-2">Дата снимка</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">Тип загрузки</label>
            <div className="flex gap-3">
              <button
                onClick={() => setUploadType("single")}
                className={`flex-1 p-3 rounded-xl transition ${
                  uploadType === "single"
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                Готовый файл
              </button>
              <button
                onClick={() => setUploadType("multi")}
                className={`flex-1 p-3 rounded-xl transition ${
                  uploadType === "multi"
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                Отдельные каналы
              </button>
            </div>
          </div>

          {uploadType === "single" ? (
            <div>
              <label className="block text-sm text-white/80 mb-2">Файл снимка</label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition ${
                  isDragging 
                    ? 'border-white/40 bg-white/10' 
                    : 'border-white/20 bg-white/5'
                }`}
              >
                <input
                  type="file"
                  accept=".tif,.tiff"
                  onChange={handleFileInput}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                
                <div className="pointer-events-none">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                    <svg className="h-8 w-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  {file ? (
                    <>
                      <div className="text-lg font-medium text-white/80 mb-2">
                        {file.name}
                      </div>
                      <div className="text-sm text-white/60">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-medium text-white/80 mb-2">
                        Перетащите файл сюда
                      </div>
                      <div className="text-sm text-white/60">
                        или нажмите для выбора
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-white/80 mb-2">Объединение каналов</label>
              <button
                onClick={() => setShowBandStacking(true)}
                className="w-full p-8 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                    <svg className="h-8 w-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  {file ? (
                    <>
                      <div className="text-lg font-medium text-white/80">
                        {file.name}
                      </div>
                      <div className="text-sm text-white/60">
                        Нажмите для изменения
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-medium text-white/80">
                        Объединить отдельные каналы
                      </div>
                      <div className="text-sm text-white/60">
                        Загрузите спектральные каналы по отдельности
                      </div>
                    </>
                  )}
                </div>
              </button>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-200 text-sm">
              ⓘ Все снимки должны быть одной территории. Индекс {indexType} будет рассчитан автоматически.
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !date || !file}
            className="flex-1 p-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition disabled:opacity-50"
          >
            {loading ? "Обработка..." : "Добавить"}
          </button>
        </div>
      </div>

      <BandStackingModal
        isOpen={showBandStacking}
        onClose={() => setShowBandStacking(false)}
        onComplete={handleStackedFile}
      />
    </div>
  );
}
