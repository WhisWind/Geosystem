"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { BackgroundEffects } from "../../components/BackgroundEffects";
import { Header } from "../../components/Header";
import { AddSnapshotModal } from "../../time-series/components/AddSnapshotModal";

interface Snapshot {
  id: string;
  date: string;
  previewUrl: string;
  mean: number;
  min: number;
  max: number;
}

interface TimeSeries {
  id: string;
  name: string;
  description: string;
  satellite: string;
  index_type: string;
  snapshots: Snapshot[];
}

export default function TimeSeriesViewerPage() {
  const params = useParams();
  const id = params?.id as string;
  const [series, setSeries] = useState<TimeSeries | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSeries();
  }, [id]);

  const loadSeries = () => {
    const data = localStorage.getItem("timeSeries");
    if (data) {
      const allSeries = JSON.parse(data);
      const found = allSeries.find((s: TimeSeries) => s.id === id);
      if (found) {
        setSeries(found);
      }
    }
  };

  // Автопроигрывание
  useEffect(() => {
    if (isPlaying && series?.snapshots && series.snapshots.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= series.snapshots.length - 1) {
            return 0; // Loop
          }
          return prev + 1;
        });
      }, 1000 / playSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playSpeed, series]);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!series?.snapshots) return;
      
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(series.snapshots.length - 1, prev + 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.key === 'Home') {
        setCurrentIndex(0);
      } else if (e.key === 'End') {
        setCurrentIndex(series.snapshots.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isPlaying, series]);

  if (!series) {
    return (
      <>
        <BackgroundEffects />
        <div className="relative min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div>Загрузка...</div>
        </div>
      </>
    );
  }

  const hasSnapshots = series.snapshots && series.snapshots.length > 0;
  const currentSnapshot = hasSnapshots ? series.snapshots[currentIndex] : null;
  const previousSnapshot = hasSnapshots && currentIndex > 0 ? series.snapshots[currentIndex - 1] : null;
  const change = previousSnapshot && currentSnapshot ? currentSnapshot.mean - previousSnapshot.mean : 0;
  const changePercent = previousSnapshot && currentSnapshot ? (change / previousSnapshot.mean) * 100 : 0;

  return (
    <>
      <Header />
      <BackgroundEffects />
      <div className="relative min-h-screen bg-neutral-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{series.name}</h1>
            <p className="text-white/60">
              {series.satellite} • {series.index_type} • {series.snapshots.length} снимков
            </p>
          </div>

          {!hasSnapshots ? (
            <div className="bg-white/5 rounded-3xl p-16 text-center border border-white/10">
              <div className="text-6xl mb-4">📅</div>
              <h2 className="text-xl font-bold mb-2">Добавьте снимки для анализа</h2>
              <p className="text-white/60 mb-6">
                Загрузите снимки одной территории за разные даты
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                + Добавить снимок
              </button>
            </div>
          ) : (
            <>
              {/* Область изображения */}
              <div className="bg-white/5 rounded-3xl p-6 mb-6 border border-white/10">
                <div className="relative aspect-video bg-black/50 rounded-2xl overflow-hidden">
                  {currentSnapshot && (
                    <img
                      src={currentSnapshot.previewUrl}
                      alt={`Снимок ${currentSnapshot.date}`}
                      className="w-full h-full object-contain transition-opacity duration-300"
                    />
                  )}
                  
                  {/* Легенда */}
                  <div className="absolute bottom-4 right-4 bg-black/70 rounded-xl p-3 text-xs">
                    <div className="font-semibold mb-2">{series.index_type}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-3 bg-green-600"></div>
                        <span>0.8-1.0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-3 bg-lime-500"></div>
                        <span>0.6-0.8</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-3 bg-yellow-500"></div>
                        <span>0.4-0.6</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-3 bg-orange-500"></div>
                        <span>0.2-0.4</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-3 bg-red-600"></div>
                        <span>0.0-0.2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Информационная панель */}
              {currentSnapshot && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-sm text-white/60">Дата</div>
                    <div className="text-xl font-bold">
                      {new Date(currentSnapshot.date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-sm text-white/60">Среднее</div>
                    <div className="text-xl font-bold">{currentSnapshot.mean.toFixed(3)}</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-sm text-white/60">Изменение</div>
                    <div className={`text-xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(3)} ({changePercent.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="text-sm text-white/60">Диапазон</div>
                    <div className="text-xl font-bold">
                      {currentSnapshot.min.toFixed(2)} - {currentSnapshot.max.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Временной ползунок */}
              <div className="bg-white/5 rounded-3xl p-6 mb-6 border border-white/10">
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={series.snapshots.length - 1}
                    value={currentIndex}
                    onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgba(75, 192, 192, 0.5) 0%, rgba(75, 192, 192, 0.5) ${(currentIndex / (series.snapshots.length - 1)) * 100}%, rgba(255, 255, 255, 0.2) ${(currentIndex / (series.snapshots.length - 1)) * 100}%, rgba(255, 255, 255, 0.2) 100%)`
                    }}
                  />
                </div>

                {/* Отметки дат */}
                <div className="flex justify-between text-xs text-white/60 mb-4 overflow-x-auto scrollbar-hide">
                  {series.snapshots.map((snapshot, index) => (
                    <button
                      key={snapshot.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`transition whitespace-nowrap px-2 ${
                        index === currentIndex ? 'text-white font-bold' : 'hover:text-white'
                      }`}
                    >
                      {new Date(snapshot.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                    </button>
                  ))}
                </div>

                {/* Элементы управления */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => setCurrentIndex(0)}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
                    title="К первому"
                  >
                    ⏮
                  </button>
                  <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                    title="Предыдущий"
                  >
                    ◄
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 px-6 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
                  >
                    {isPlaying ? '⏸ Пауза' : '▶ Воспроизвести'}
                  </button>
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(series.snapshots.length - 1, prev + 1))}
                    disabled={currentIndex === series.snapshots.length - 1}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                    title="Следующий"
                  >
                    ►
                  </button>
                  <button
                    onClick={() => setCurrentIndex(series.snapshots.length - 1)}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
                    title="К последнему"
                  >
                    ⏭
                  </button>

                  <select
                    value={playSpeed}
                    onChange={(e) => setPlaySpeed(parseFloat(e.target.value))}
                    className="p-3 rounded-xl bg-white/10 text-white border-none"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                    <option value="4">4x</option>
                  </select>
                </div>

                <div className="mt-4 text-xs text-white/40 text-center">
                  Используйте ← → для навигации, Пробел для воспроизведения/паузы
                </div>
              </div>

              {/* Кнопка добавления снимка */}
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition"
              >
                + Добавить снимок
              </button>
            </>
          )}

          <AddSnapshotModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            seriesId={id}
            satellite={series.satellite}
            indexType={series.index_type}
            onAdded={loadSeries}
          />
        </div>
      </div>
    </>
  );
}
