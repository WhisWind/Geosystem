"use client";
import { useState, useRef, useEffect } from "react";

const waterModels = ["ndwi", "mndwi"];

interface WaterParametersProps {
  waterModel: string;
  threshold: number;
  onModelChange: (value: string) => void;
  onThresholdChange: (value: number) => void;
}

export function WaterParameters({
  waterModel,
  threshold,
  onModelChange,
  onThresholdChange,
}: WaterParametersProps) {
  const [showModels, setShowModels] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setShowModels(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div ref={modelRef} className="relative">
        <label className="mb-2 block text-xs font-medium text-gray-700">Модель</label>
        <button
          type="button"
          onClick={() => setShowModels(!showModels)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition hover:bg-gray-50 text-left flex items-center justify-between"
        >
          <span>{waterModel.toUpperCase()}</span>
          <svg
            className={`h-4 w-4 text-gray-600 transition-transform ${showModels ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showModels && (
          <div className="absolute z-10 mt-2 w-full rounded-2xl border border-gray-300 bg-white shadow-xl overflow-hidden">
            {waterModels.map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => {
                  onModelChange(model);
                  setShowModels(false);
                }}
                className={`w-full px-4 py-3 text-sm text-left transition ${
                  waterModel === model
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {model.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-gray-700">Порог (0–1)</label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={threshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value) || 0.5)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-300 focus:bg-emerald-50 transition"
        />
      </div>
    </>
  );
}
