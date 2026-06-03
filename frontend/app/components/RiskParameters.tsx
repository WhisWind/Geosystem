"use client";
import { useState, useRef, useEffect } from "react";

const riskScenarios = [
  { value: "flooding", label: "Подтопление" },
  { value: "ecological", label: "Экологическая устойчивость" },
  { value: "passability", label: "Проходимость" }
];

const normalizationTypes = [
  { value: "linear", label: "Линейная" },
  { value: "threshold", label: "По порогам" },
  { value: "sigmoid", label: "Сигмоидная" },
  { value: "log", label: "Логарифмическая" }
];

interface RiskParametersProps {
  riskScenario: string;
  normalizationType: string;
  safeThreshold: number;
  dangerThreshold: number;
  onScenarioChange: (value: string) => void;
  onNormalizationChange: (value: string) => void;
  onSafeThresholdChange: (value: number) => void;
  onDangerThresholdChange: (value: number) => void;
}

export function RiskParameters({
  riskScenario,
  normalizationType,
  safeThreshold,
  dangerThreshold,
  onScenarioChange,
  onNormalizationChange,
  onSafeThresholdChange,
  onDangerThresholdChange,
}: RiskParametersProps) {
  const [showScenarios, setShowScenarios] = useState(false);
  const [showNormalization, setShowNormalization] = useState(false);
  const scenarioRef = useRef<HTMLDivElement>(null);
  const normalizationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scenarioRef.current && !scenarioRef.current.contains(event.target as Node)) {
        setShowScenarios(false);
      }
      if (normalizationRef.current && !normalizationRef.current.contains(event.target as Node)) {
        setShowNormalization(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentScenario = riskScenarios.find(s => s.value === riskScenario);
  const currentNormalization = normalizationTypes.find(n => n.value === normalizationType);

  return (
    <div className="sm:col-span-2 space-y-6">
      <div ref={scenarioRef} className="relative">
        <label className="mb-2 block text-xs font-medium text-gray-700">Сценарий риска</label>
        <button
          type="button"
          onClick={() => setShowScenarios(!showScenarios)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition hover:bg-gray-50 text-left flex items-center justify-between"
        >
          <span>{currentScenario?.label}</span>
          <svg
            className={`h-4 w-4 text-gray-600 transition-transform ${showScenarios ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showScenarios && (
          <div className="absolute z-10 mt-2 w-full rounded-2xl border border-gray-300 bg-white shadow-xl overflow-hidden">
            {riskScenarios.map((scenario) => (
              <button
                key={scenario.value}
                type="button"
                onClick={() => {
                  onScenarioChange(scenario.value);
                  setShowScenarios(false);
                }}
                className={`w-full px-4 py-3 text-sm text-left transition ${
                  riskScenario === scenario.value
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={normalizationRef} className="relative">
        <label className="mb-2 block text-xs font-medium text-gray-700">Нормализация</label>
        <button
          type="button"
          onClick={() => setShowNormalization(!showNormalization)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition hover:bg-gray-50 text-left flex items-center justify-between"
        >
          <span>{currentNormalization?.label}</span>
          <svg
            className={`h-4 w-4 text-gray-600 transition-transform ${showNormalization ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showNormalization && (
          <div className="absolute z-10 mt-2 w-full rounded-2xl border border-gray-300 bg-white shadow-xl overflow-hidden">
            {normalizationTypes.map((norm) => (
              <button
                key={norm.value}
                type="button"
                onClick={() => {
                  onNormalizationChange(norm.value);
                  setShowNormalization(false);
                }}
                className={`w-full px-4 py-3 text-sm text-left transition ${
                  normalizationType === norm.value
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {norm.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {normalizationType === "threshold" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Безопасно до</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={safeThreshold}
              onChange={(e) => onSafeThresholdChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="text-center text-sm text-gray-700 mt-1">
              {(safeThreshold * 100).toFixed(0)}%
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">Опасно от</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={dangerThreshold}
              onChange={(e) => onDangerThresholdChange(parseFloat(e.target.value))}
              className="w-full accent-red-600"
            />
            <div className="text-center text-sm text-gray-700 mt-1">
              {(dangerThreshold * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
