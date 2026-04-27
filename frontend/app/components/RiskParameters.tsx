const riskScenarios = ["flooding", "ecological", "passability"];
const normalizationTypes = ["linear", "threshold", "sigmoid", "log"];

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
  return (
    <div className="sm:col-span-2">
      <div>
        <label className="mb-2 block text-xs font-medium text-white/70">Сценарий риска</label>
        <div className="relative">
          <select
            value={riskScenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/[0.07]"
          >
            <option value="flooding">Подтопление</option>
            <option value="ecological">Экологическая устойчивость</option>
            <option value="passability">Проходимость</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
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
        <label className="mb-2 block text-xs font-medium text-white/70">Нормализация</label>
        <div className="relative">
          <select
            value={normalizationType}
            onChange={(e) => onNormalizationChange(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/[0.07]"
          >
            <option value="linear">Линейная</option>
            <option value="threshold">По порогам</option>
            <option value="sigmoid">Сигмоидная</option>
            <option value="log">Логарифмическая</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {normalizationType === "threshold" && (
        <div className="sm:col-span-2 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-white/70">Безопасно до</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={safeThreshold}
              onChange={(e) => onSafeThresholdChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="text-center text-sm text-white/80 mt-1">
              {(safeThreshold * 100).toFixed(0)}%
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-white/70">Опасно от</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={dangerThreshold}
              onChange={(e) => onDangerThresholdChange(parseFloat(e.target.value))}
              className="w-full accent-red-600"
            />
            <div className="text-center text-sm text-white/80 mt-1">
              {(dangerThreshold * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
