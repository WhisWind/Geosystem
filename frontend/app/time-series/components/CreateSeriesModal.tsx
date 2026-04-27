"use client";
import { useState } from "react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-3xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Новый временной ряд</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-white/80 mb-2">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мониторинг озера Байкал"
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">Описание (опционально)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Отслеживание уровня воды за 2023-2024 год"
              rows={3}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">Спутник</label>
            <select
              value={satellite}
              onChange={(e) => setSatellite(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
            >
              {SATELLITES.map(sat => (
                <option key={sat.value} value={sat.value}>{sat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">Индекс для анализа</label>
            <select
              value={indexType}
              onChange={(e) => setIndexType(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
            >
              {INDICES.map(idx => (
                <option key={idx.value} value={idx.value}>{idx.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 p-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
