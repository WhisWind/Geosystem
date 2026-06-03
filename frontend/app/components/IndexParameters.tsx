"use client";
import { useState, useRef, useEffect } from "react";

const satellites = ["Sentinel-2", "Landsat-8", "Канопус-В", "Метеор-М", "Ресурс-П"];
const indexes = ["NDVI", "NDWI", "EVI", "NBR", "GNDVI", "GEMI"];

interface IndexParametersProps {
  satellite: string;
  indexName: string;
  onSatelliteChange: (value: string) => void;
  onIndexChange: (value: string) => void;
}

export function IndexParameters({
  satellite,
  indexName,
  onSatelliteChange,
  onIndexChange,
}: IndexParametersProps) {
  const [showSatellites, setShowSatellites] = useState(false);
  const [showIndexes, setShowIndexes] = useState(false);
  const satelliteRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (satelliteRef.current && !satelliteRef.current.contains(event.target as Node)) {
        setShowSatellites(false);
      }
      if (indexRef.current && !indexRef.current.contains(event.target as Node)) {
        setShowIndexes(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div ref={satelliteRef} className="relative">
        <label className="mb-2 block text-xs font-medium text-gray-700">Спутник</label>
        <button
          type="button"
          onClick={() => setShowSatellites(!showSatellites)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition hover:bg-gray-50 text-left flex items-center justify-between"
        >
          <span>{satellite}</span>
          <svg
            className={`h-4 w-4 text-gray-600 transition-transform ${showSatellites ? 'rotate-180' : ''}`}
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
            {satellites.map((sat) => (
              <button
                key={sat}
                type="button"
                onClick={() => {
                  onSatelliteChange(sat);
                  setShowSatellites(false);
                }}
                className={`w-full px-4 py-3 text-sm text-left transition ${
                  satellite === sat
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {sat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={indexRef} className="relative">
        <label className="mb-2 block text-xs font-medium text-gray-700">Индекс</label>
        <button
          type="button"
          onClick={() => setShowIndexes(!showIndexes)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition hover:bg-gray-50 text-left flex items-center justify-between"
        >
          <span>{indexName}</span>
          <svg
            className={`h-4 w-4 text-gray-600 transition-transform ${showIndexes ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showIndexes && (
          <div className="absolute z-10 mt-2 w-full rounded-2xl border border-gray-300 bg-white shadow-xl overflow-hidden">
            {indexes.map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onIndexChange(idx);
                  setShowIndexes(false);
                }}
                className={`w-full px-4 py-3 text-sm text-left transition ${
                  indexName === idx
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {idx}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
