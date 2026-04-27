# План интеграции новых функций в существующий проект

## Текущая структура проекта

### Frontend
```
frontend/
├── app/
│   ├── page.tsx                    # Главная страница (расчёт индексов)
│   ├── result/page.tsx             # Страница результатов
│   ├── components/
│   │   ├── BackgroundEffects.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FileUpload.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── IndexParameters.tsx
│   │   ├── WaterParameters.tsx
│   │   └── RiskParameters.tsx
│   ├── result/components/
│   │   ├── HistorySidebar.tsx
│   │   ├── ResultHeader.tsx
│   │   ├── SummaryCard.tsx
│   │   └── PreviewCard.tsx
│   └── lib/
│       └── api.ts                  # API клиент
```

### Backend
```
backend/app_aplication/
├── main.py                         # FastAPI app
├── api/
│   ├── __init__.py
│   ├── index.py                    # Расчёт индексов
│   ├── water.py                    # Выделение воды
│   ├── risk.py                     # Карты риска
│   └── export.py
├── core/
│   └── config.py
└── data/
    └── results/                    # Хранилище результатов
```

### Текущий функционал
- ✅ Расчёт индексов (NDVI, NDWI, EVI, NBR, GNDVI, GEMI)
- ✅ Выделение воды (U-Net модели)
- ✅ Карты риска
- ✅ История расчётов (localStorage)
- ✅ Просмотр результатов
- ✅ Скачивание TIFF и PNG

---

## Новые функции для добавления

### 1. Объединение каналов (Band Stacking)
### 2. Временные ряды (Time Series)

---

## 1. Объединение каналов - Интеграция

### Изменения в FileUpload.tsx

Добавить кнопку "Объединить каналы" под существующей drag-and-drop зоной:

```typescript
// frontend/app/components/FileUpload.tsx

import { BandStackingModal } from "./BandStackingModal";

export function FileUpload({ file, onFileChange, ... }) {
  const [showBandStacking, setShowBandStacking] = useState(false);

  const handleStackedFile = (stackedFile: File) => {
    onFileChange({ target: { files: [stackedFile] } } as any);
    setShowBandStacking(false);
  };

  return (
    <>
      {/* Существующий drag-and-drop */}
      <div className="rounded-2xl border-2 border-dashed ...">
        {/* ... существующий код ... */}
      </div>

      {/* Разделитель */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/40">или</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Кнопка объединения */}
      <button
        onClick={() => setShowBandStacking(true)}
        className="mt-6 w-full rounded-2xl border border-white/20 bg-white/5 p-4 text-sm font-medium text-white/80 transition hover:bg-white/10"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Объединить отдельные каналы</span>
        </div>
        <div className="mt-1 text-xs text-white/50">
          Загрузите спектральные каналы по отдельности
        </div>
      </button>

      {/* Модальное окно */}
      <BandStackingModal
        isOpen={showBandStacking}
        onClose={() => setShowBandStacking(false)}
        onComplete={handleStackedFile}
      />
    </>
  );
}
```

### Новый компонент BandStackingModal.tsx

```typescript
// frontend/app/components/BandStackingModal.tsx
// Код из BAND_STACKING_SPEC.md с двухшаговым процессом
```

### Backend API для объединения

```python
# backend/app_aplication/api/stack.py

from fastapi import APIRouter, UploadFile, File, Form
from typing import List
import rasterio
import numpy as np
import uuid
from pathlib import Path

router = APIRouter(prefix="/stack", tags=["stack"])

@router.post("/bands")
async def stack_bands(
    files: List[UploadFile] = File(...),
    band_names: List[str] = Form(...),
    satellite: str = Form(...)
):
    # Валидация
    if len(files) != len(band_names):
        raise HTTPException(400, "Количество файлов и названий не совпадает")
    
    if len(files) < 3:
        raise HTTPException(400, "Минимум 3 канала")
    
    # Сохранить временные файлы
    temp_paths = []
    for file in files:
        temp_path = f"temp/{file.filename}"
        Path(temp_path).parent.mkdir(exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        temp_paths.append(temp_path)
    
    # Прочитать метаданные первого файла
    with rasterio.open(temp_paths[0]) as src:
        meta = src.meta.copy()
        height, width = src.shape
    
    # Обновить для многоканального
    meta.update(count=len(files))
    
    # Создать выходной файл
    result_id = str(uuid.uuid4())
    output_path = f"data/results/{result_id}/stacked.tif"
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Записать все каналы
    with rasterio.open(output_path, 'w', **meta) as dst:
        for i, temp_path in enumerate(temp_paths, start=1):
            with rasterio.open(temp_path) as src:
                band_data = src.read(1)
                dst.write(band_data, i)
    
    # Создать RGB превью
    create_rgb_preview(output_path, result_id, band_names, satellite)
    
    # Удалить временные файлы
    for temp_path in temp_paths:
        Path(temp_path).unlink()
    
    return {
        "id": result_id,
        "message": "Каналы успешно объединены",
        "bands": band_names,
        "band_count": len(files)
    }
```

### Регистрация роутера

```python
# backend/app_aplication/main.py

from api.stack import router as stack_router

app.include_router(stack_router, prefix="/api")
```


---

## 2. Временные ряды - Интеграция

### Добавление навигации

Обновить HeroSection.tsx для добавления ссылки на временные ряды:

```typescript
// frontend/app/components/HeroSection.tsx

export function HeroSection({ hasHistory, onViewHistory }) {
  return (
    <div className="flex flex-col justify-center">
      {/* ... существующий код ... */}
      
      <div className="mt-8 flex gap-3">
        {hasHistory && (
          <button
            onClick={onViewHistory}
            className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            📊 История расчётов
          </button>
        )}
        
        {/* НОВОЕ */}
        <a
          href="/time-series"
          className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          📈 Временные ряды
        </a>
      </div>
    </div>
  );
}
```

### Новая страница временных рядов

```
frontend/app/time-series/
├── page.tsx                    # Список временных рядов
├── [id]/
│   └── page.tsx               # Просмотр конкретного ряда
└── components/
    ├── TimeSeriesList.tsx
    ├── CreateSeriesModal.tsx
    ├── AddSnapshotModal.tsx
    └── TimeSeriesViewer.tsx
```

### Список временных рядов

```typescript
// frontend/app/time-series/page.tsx

"use client";
import { useState, useEffect } from "react";
import { CreateSeriesModal } from "./components/CreateSeriesModal";

export default function TimeSeriesListPage() {
  const [series, setSeries] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    // Пока используем localStorage, потом заменим на API
    const data = localStorage.getItem("timeSeries");
    if (data) {
      setSeries(JSON.parse(data));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Временные ряды</h1>
            <p className="text-white/60 mt-2">
              Отслеживайте изменения индексов во времени
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200"
          >
            + Создать
          </button>
        </div>

        {series.length === 0 ? (
          <div className="bg-white/5 rounded-3xl p-16 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-xl font-bold mb-2">У вас пока нет временных рядов</h2>
            <p className="text-white/60 mb-6">
              Временной ряд позволяет отслеживать изменения индекса<br/>
              на одной территории в течение времени
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-200"
            >
              Создать временной ряд
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map(s => (
              <a
                key={s.id}
                href={`/time-series/${s.id}`}
                className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition"
              >
                <h3 className="text-xl font-bold mb-2">{s.name}</h3>
                <p className="text-sm text-white/60 mb-4">{s.description}</p>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span>{s.satellite}</span>
                  <span>•</span>
                  <span>{s.index_type}</span>
                  <span>•</span>
                  <span>{s.snapshots?.length || 0} снимков</span>
                </div>
              </a>
            ))}
          </div>
        )}

        <CreateSeriesModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={loadSeries}
        />
      </div>
    </div>
  );
}
```


### Просмотр временного ряда с ползунком

```typescript
// frontend/app/time-series/[id]/page.tsx

"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Line } from "react-chartjs-2";

export default function TimeSeriesViewerPage() {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadSeries();
  }, [id]);

  const loadSeries = () => {
    // Загрузка из localStorage (временно)
    const data = localStorage.getItem("timeSeries");
    if (data) {
      const allSeries = JSON.parse(data);
      const found = allSeries.find(s => s.id === id);
      if (found) {
        setSeries(found);
      }
    }
  };

  // Автопроигрывание
  useEffect(() => {
    if (isPlaying && series?.snapshots) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= series.snapshots.length - 1) {
            return 0; // Loop
          }
          return prev + 1;
        });
      }, 1000 / playSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playSpeed, series]);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(series.snapshots.length - 1, prev + 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isPlaying, series]);

  if (!series) return <div>Loading...</div>;

  const currentSnapshot = series.snapshots[currentIndex];
  const previousSnapshot = currentIndex > 0 ? series.snapshots[currentIndex - 1] : null;
  const change = previousSnapshot ? currentSnapshot.mean - previousSnapshot.mean : 0;
  const changePercent = previousSnapshot ? (change / previousSnapshot.mean) * 100 : 0;

  // График с выделением текущей точки
  const chartData = {
    labels: series.snapshots.map(s => new Date(s.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: series.index_type,
      data: series.snapshots.map(s => s.mean),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.3,
      fill: true,
      pointRadius: series.snapshots.map((_, i) => i === currentIndex ? 8 : 4),
      pointBackgroundColor: series.snapshots.map((_, i) => 
        i === currentIndex ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'
      ),
    }]
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <a href="/time-series" className="text-white/60 hover:text-white mb-6 inline-block">
          ← Назад к списку
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{series.name}</h1>
          <p className="text-white/60">
            {series.satellite} • {series.index_type} • {series.snapshots.length} снимков
          </p>
        </div>

        {/* Область изображения */}
        <div className="bg-white/5 rounded-3xl p-6 mb-6">
          <div className="relative aspect-video bg-black/50 rounded-2xl overflow-hidden">
            <img
              src={currentSnapshot.previewUrl}
              alt={`Снимок ${currentSnapshot.date}`}
              className="w-full h-full object-contain transition-opacity duration-300"
            />
            
            {/* Легенда */}
            <div className="absolute bottom-4 right-4 bg-black/70 rounded-xl p-3 text-xs">
              <div className="font-semibold mb-2">{series.index_type}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-green-600"></div>
                  <span>0.8-1.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-lime-500"></div>
                  <span>0.6-0.8</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-yellow-500"></div>
                  <span>0.4-0.6</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-orange-500"></div>
                  <span>0.2-0.4</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-red-600"></div>
                  <span>0.0-0.2</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Информационная панель */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-white/60">Дата</div>
            <div className="text-xl font-bold">
              {new Date(currentSnapshot.date).toLocaleDateString('ru-RU')}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-white/60">Среднее</div>
            <div className="text-xl font-bold">{currentSnapshot.mean.toFixed(3)}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-white/60">Изменение</div>
            <div className={`text-xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(3)} ({changePercent.toFixed(1)}%)
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-white/60">Диапазон</div>
            <div className="text-xl font-bold">
              {currentSnapshot.min.toFixed(2)} - {currentSnapshot.max.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Временной ползунок */}
        <div className="bg-white/5 rounded-3xl p-6 mb-6">
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={series.snapshots.length - 1}
              value={currentIndex}
              onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(75, 192, 192, 0.5) 0%, rgba(75, 192, 192, 0.5) ${(currentIndex / (series.snapshots.length - 1)) * 100}%, rgba(255, 255, 255, 0.2) ${(currentIndex / (series.snapshots.length - 1)) * 100}%, rgba(255, 255, 255, 0.2) 100%)`
              }}
            />
          </div>

          {/* Отметки дат */}
          <div className="flex justify-between text-xs text-white/60 mb-4">
            {series.snapshots.map((snapshot, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition ${
                  index === currentIndex ? 'text-white font-bold' : 'hover:text-white'
                }`}
              >
                {new Date(snapshot.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>

          {/* Элементы управления */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentIndex(0)}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
            >
              ⏮
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
            >
              ◄
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 px-6 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
            >
              {isPlaying ? '⏸ Пауза' : '▶ Воспроизвести'}
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(series.snapshots.length - 1, prev + 1))}
              disabled={currentIndex === series.snapshots.length - 1}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
            >
              ►
            </button>
            <button
              onClick={() => setCurrentIndex(series.snapshots.length - 1)}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
            >
              ⏭
            </button>

            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(parseFloat(e.target.value))}
              className="p-3 rounded-xl bg-white/10 text-white border-none"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </div>
        </div>

        {/* График */}
        <div className="bg-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">График изменений</h2>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>
      </div>
    </div>
  );
}
```

---

## Порядок реализации

### Этап 1: Объединение каналов (1-2 дня)
1. Создать `BandStackingModal.tsx`
2. Обновить `FileUpload.tsx`
3. Создать backend API `/api/stack/bands`
4. Протестировать с реальными файлами

### Этап 2: Временные ряды - Базовая структура (1 день)
1. Создать страницу `/time-series`
2. Создать `CreateSeriesModal.tsx`
3. Реализовать хранение в localStorage

### Этап 3: Временные ряды - Просмотр (1-2 дня)
1. Создать страницу `/time-series/[id]`
2. Реализовать ползунок и автопроигрывание
3. Добавить график с Chart.js
4. Реализовать горячие клавиши

### Этап 4: Добавление снимков (1 день)
1. Создать `AddSnapshotModal.tsx`
2. Интеграция с существующим API расчёта индексов
3. Сохранение результатов в временной ряд

---

## Преимущества такого подхода

✅ **Минимальные изменения** в существующем коде
✅ **Переиспользование** компонентов (FileUpload, BackgroundEffects)
✅ **Совместимость** с текущей структурой API
✅ **Постепенное внедрение** - можно добавлять по частям
✅ **Сохранение стиля** - используем те же Tailwind классы

Этот план позволяет добавить новые функции без переписывания существующего кода!
