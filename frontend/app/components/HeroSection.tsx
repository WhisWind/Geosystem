interface HeroSectionProps {
  hasHistory: boolean;
  onViewHistory: () => void;
}

export function HeroSection({ hasHistory, onViewHistory }: HeroSectionProps) {
  return (
    <div className="flex flex-col justify-center space-y-6">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Анализ спутниковых индексов
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
        Рассчитай индекс по GeoTIFF за пару кликов
      </h1>

      <p className="max-w-xl text-sm leading-6 text-gray-600">
        Загрузите .tif/.tiff, выберите спутник и индекс. Результат будет сохранён в сессии браузера
        и открыт на следующей странице.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs text-gray-600">Формат</div>
          <div className="mt-1 text-sm font-medium text-gray-900">TIFF / GeoTIFF</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs text-gray-600">Расчёт</div>
          <div className="mt-1 text-sm font-medium text-gray-900">На сервере</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs text-gray-600">Сохранение</div>
          <div className="mt-1 text-sm font-medium text-gray-900">LocalStorage</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {hasHistory && (
          <button
            onClick={onViewHistory}
            className="rounded-2xl bg-emerald-100 px-6 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200 border border-emerald-200"
          >
            📊 Просмотреть предыдущие расчёты
          </button>
        )}
      </div>
    </div>
  );
}
