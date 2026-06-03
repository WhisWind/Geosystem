"use client";
import { useState, useRef, useEffect } from "react";

interface CreateSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SATELLITES = [
  { value: "Sentinel-2", label: "Sentinel-2" },
  { value: "Landsat-8", label: "Landsat-8/9" },
];

const INDICES = [
  { value: "NDVI", label: "NDVI (Vegetation Index)" },
  { value: "NDWI", label: "NDWI (Water Index)" },
  { value: "EVI", label: "EVI (Enhanced Vegetation Index)" },
  { value: "NBR", label: "NBR (Burn Ratio)" },
  { value: "GNDVI", label: "GNDVI (Green NDVI)" },
  { value: "GEMI", label: "GEMI (Global Environment Monitoring)" },
];

export function CreateSeriesModal({ isOpen, onClose, onCreated }: CreateSeriesModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [satellite, setSatellite] = useState("Sentinel-2");
  const [indexType, setIndexType] = useState("NDVI");
  const [showSatellites, setShowSatellites] = useState(false);
  const [showIndices, setShowIndices] = useState(false);
  const satelliteRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (satelliteRef.current && !satelliteRef.current.contains(event.target as Node)) {
        setShowSatellites(false);
      }
      if (indexRef.current && !indexRef.current.contains(event.target as Node)) {
        setShowIndices(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Введите название");
      return;
    }

    const newSeries = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      satellite,
      index_type: indexType,
      snapshots: [],
      created_at: new Date().toISOString(),
    };

    const existing = localStorage.getItem("timeSeries");
    const allSeries = existing ? JSON.parse(existing) : [];
    allSeries.push(newSeries);
    localStorage.setItem("timeSeries", JSON.stringify(allSeries));

    setName("");
    setDescription("");
    setSatellite("Sentinel-2");
    setIndexType("NDVI");
    onCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Новый временной ряд</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl">×</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мониторинг озера Байкал"
              className="w-full p-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Описание (опционально)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Отслеживание уровня воды за 2023-2024 год"
              rows={3}
              className="w-full p-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Спутник</label>
            <div ref={satelliteRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSatellites(!showSatellites)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition hover:bg-gray-50 text-left flex items-center justify-between"
              >
                <span>{SATELLITES.find(s => s.value === satellite)?.label}</span>
                <svg
                  className={`h-4 w-4 text-gray-600 transition-transform ${showSatellites ? 'rotate-180' : ''}`}
                  style={{ marginLeft: '6px' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSatellites && (
                <div className="absolute z-10 mt-2 w-full rounded-2xl border border-gray-300 bg-white shadow-xl overflow-hidden">
                  {SATELLITES.map((sat) => (
                    <button
                      key={sat.value}
                      type="button"
                      onClick={() => {
                        setSatellite(sat.value);
                        setShowSatellites(false);
                      }}
                      className={`w-full px-4 py-3 text-sm text-left transition ${
                        satellite === sat.value
                          ? "bg-emerald-50 text-emerald-900"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {sat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Индекс для анализа</label>
            <div ref={indexRef} className="relative">
              <button
                type="button"
                onClick={() => setShowIndices(!showIndices)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition hover:bg-gray-50 text-left flex items-center justify-between"
              >
                <span>{INDICES.find(i => i.value === indexType)?.label}</span>
                <svg
                  className={`h-4 w-4 text-gray-600 transition-transform ${showIndices ? 'rotate-180' : ''}`}
                  style={{ marginLeft: '6px' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showIndices && (
                <div className="absolute z-10 mt-2 w-full rounded-2xl border border-gray-300 bg-white shadow-xl overflow-hidden">
                  {INDICES.map((idx) => (
                    <button
                      key={idx.value}
                      type="button"
                      onClick={() => {
                        setIndexType(idx.value);
                        setShowIndices(false);
                      }}
                      className={`w-full px-4 py-3 text-sm text-left transition ${
                        indexType === idx.value
                          ? "bg-emerald-50 text-emerald-900"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {idx.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 p-3 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 p-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
