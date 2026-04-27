interface ModeSelectorProps {
  mode: "index" | "water" | "risk";
  onChange: (mode: "index" | "water" | "risk") => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="mb-6">
      <label className="mb-2 block text-xs font-medium text-white/70">
        Режим обработки
      </label>
      <div className="relative">
        <select
          value={mode}
          onChange={(e) => onChange(e.target.value as "index" | "water" | "risk")}
          className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/[0.07]"
        >
          <option value="index">Расчёт индекса</option>
          <option value="water">Выделение водных ресурсов</option>
          <option value="risk">Карта риска</option>
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
  );
}
