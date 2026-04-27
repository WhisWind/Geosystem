"use client";
import { useState, useEffect } from "react";
import { CreateSeriesModal } from "./components/CreateSeriesModal";
import { BackgroundEffects } from "../components/BackgroundEffects";
import { Header } from "../components/Header";

interface TimeSeries {
  id: string;
  name: string;
  description: string;
  satellite: string;
  index_type: string;
  snapshots: any[];
  created_at: string;
}

export default function TimeSeriesListPage() {
  const [series, setSeries] = useState<TimeSeries[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = () => {
    const data = localStorage.getItem("timeSeries");
    if (data) {
      setSeries(JSON.parse(data));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить этот временной ряд?")) {
      const updated = series.filter(s => s.id !== id);
      setSeries(updated);
      localStorage.setItem("timeSeries", JSON.stringify(updated));
    }
  };

  return (
    <>
      <Header />
      <BackgroundEffects />
      <div className="relative min-h-screen bg-neutral-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Временные ряды</h1>
              <p className="text-white/60 mt-2">
                Отслеживайте изменения индексов во времени
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              + Создать
            </button>
          </div>

          {series.length === 0 ? (
            <div className="bg-white/5 rounded-3xl p-16 text-center border border-white/10">
              <div className="text-6xl mb-4">📈</div>
              <h2 className="text-xl font-bold mb-2">У вас пока нет временных рядов</h2>
              <p className="text-white/60 mb-6">
                Временной ряд позволяет отслеживать изменения индекса<br/>
                на одной территории в течение времени
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Создать временной ряд
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {series.map(s => (
                <div
                  key={s.id}
                  className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{s.name}</h3>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
                      title="Удалить"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-white/60 mb-4 line-clamp-2">{s.description}</p>
                  <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                    <span>{s.satellite}</span>
                    <span>•</span>
                    <span>{s.index_type}</span>
                    <span>•</span>
                    <span>{s.snapshots?.length || 0} снимков</span>
                  </div>
                  <a
                    href={`/time-series/${s.id}`}
                    className="block w-full text-center px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
                  >
                    Открыть
                  </a>
                </div>
              ))}
            </div>
          )}

          <CreateSeriesModal
            isOpen={showCreate}
            onClose={() => setShowCreate(false)}
            onCreated={loadSeries}
          />
        </div>
      </div>
    </>
  );
}
