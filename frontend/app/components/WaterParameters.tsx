const waterModels = ["awei", "ndwi", "mndwi"];

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
  return (
    <>
      <div>
        <label className="mb-2 block text-xs font-medium text-white/70">Модель</label>
        <div className="relative">
          <select
            value={waterModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/[0.07] transition"
          >
            {waterModels.map((model) => (
              <option key={model} value={model}>
                {model.toUpperCase()}
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
        <label className="mb-2 block text-xs font-medium text-white/70">Порог (0–1)</label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={threshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value) || 0.5)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:bg-white/[0.07] transition"
        />
      </div>
    </>
  );
}
