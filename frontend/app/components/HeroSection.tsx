interface HeroSectionProps {
  hasHistory: boolean;
  onViewHistory: () => void;
}

export function HeroSection({ hasHistory, onViewHistory }: HeroSectionProps) {
  return (
    <div className="flex flex-col justify-center space-y-6">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Анализ спутниковых индексов
      </div>

      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Рассчитай индекс по GeoTIFF за пару кликов
      </h1>

      <p className="max-w-xl text-sm leading-6 text-white/70">
        Загрузите .tif/.tiff, выберите спутник и индекс. Результат будет сохранён в сессии браузера
        и открыт на следующей странице.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Формат</div>
          <div className="mt-1 text-sm font-medium">TIFF / GeoTIFF</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Расчёт</div>
          <div className="mt-1 text-sm font-medium">На сервере</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Сохранение</div>
          <div className="mt-1 text-sm font-medium">LocalStorage</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {hasHistory && (
          <button
            onClick={onViewHistory}
            className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold transition hover:bg-white/[0.14] border border-white/10"
          >
            📊 Просмотреть предыдущие расчёты
          </button>
        )}
        <a
          href="/time-series"
          className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold transition hover:bg-white/[0.14] border border-white/10 text-center"
        >
          📈 Временные ряды
        </a>
      </div>
    </div>
  );
}
