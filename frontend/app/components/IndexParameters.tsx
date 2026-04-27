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
  return (
    <>
      <div>
        <label className="mb-2 block text-xs font-medium text-white/70">Спутник</label>
        <div className="relative">
          <select
            value={satellite}
            onChange={(e) => onSatelliteChange(e.target.value)}
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
            onChange={(e) => onIndexChange(e.target.value)}
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
  );
}
