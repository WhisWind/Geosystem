"use client";
import { useState, useRef, useEffect } from "react";

const modes = [
  { value: "index", label: "Расчёт индекса" },
  { value: "water", label: "Выделение водных ресурсов" },
  { value: "risk", label: "Карта риска" }
];

interface ModeSelectorProps {
  mode: "index" | "water" | "risk";
  onChange: (mode: "index" | "water" | "risk") => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  const [showModes, setShowModes] = useState(false);
  const modeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modeRef.current && !modeRef.current.contains(event.target as Node)) {
        setShowModes(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentMode = modes.find(m => m.value === mode);

  return (
    <div className="mb-6">
      <label className="mb-2 block text-xs font-medium text-gray-700">
        Режим обработки
      </label>
      <div ref={modeRef} className="relative">
        <button
          type="button"
          onClick={() => setShowModes(!showModes)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition hover:bg-gray-50 text-left flex items-center justify-between"
        >
          <span>{currentMode?.label}</span>
          <svg
            className={`h-4 w-4 text-gray-600 transition-transform ${showModes ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showModes && (
          <div className="absolute z-10 mt-2 w-full rounded-2xl border border-gray-300 bg-white shadow-xl overflow-hidden">
            {modes.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  onChange(m.value as "index" | "water" | "risk");
                  setShowModes(false);
                }}
                className={`w-full px-4 py-3 text-sm text-left transition ${
                  mode === m.value
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
