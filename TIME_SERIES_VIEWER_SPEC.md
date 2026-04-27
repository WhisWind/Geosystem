# Спецификация: Просмотр временных рядов с интерактивным ползунком

## Концепция

Пользователь видит изображение индекса и может перемещать ползунок по временной шкале, чтобы видеть как изменяется территория во времени. Дополнительно показывается график значений индекса.

---

## Визуализация

### Основной интерфейс

```
┌──────────────────────────────────────────────────────────────┐
│  ← Назад к списку                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Мониторинг озера Байкал                                     │
│  Sentinel-2 • NDVI • 5 снимков                               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │                                                         │  │
│  │                                                         │  │
│  │              [Изображение индекса]                     │  │
│  │                                                         │  │
│  │                                                         │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  2024-01-15                                            │  │
│  │  NDVI: 0.45 (среднее)                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ●────────●────────●────────●────────●                 │  │
│  │  Jan     Feb     Mar     Apr     May                   │  │
│  │  ◄────────────────────────────────────────────────►    │  │
│  │                                                         │  │
│  │  [◄◄]  [◄]  [▶]  [▶▶]  [⏸]  [🔄 Автопроигрывание]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  График изменений                                      │  │
│  │                                                         │  │
│  │  0.8 ┤                    ●                            │  │
│  │      │                  ╱   ╲                          │  │
│  │  0.6 ┤              ●─╱       ╲                        │  │
│  │      │            ╱               ●                    │  │
│  │  0.4 ┤        ●─╱                   ╲                  │  │
│  │      │      ╱                           ●              │  │
│  │  0.2 ┤  ●─╱                                            │  │
│  │      │  ▲                                              │  │
│  │  0.0 ┼──┼──────────────────────────────────────────   │  │
│  │      Jan Feb  Mar  Apr  May  Jun  Jul  Aug  Sep      │  │
│  │         ▲ Текущая позиция                             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  [+ Добавить снимок]  [Экспорт видео]  [Сравнить даты]      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Компоненты интерфейса

### 1. Область изображения

**Функции:**
- Отображает текущее изображение индекса
- Плавная анимация при переключении между снимками
- Zoom и pan для детального просмотра
- Легенда цветовой шкалы индекса

**Пример:**
```
┌────────────────────────────────────┐
│  [Изображение NDVI]                │
│                                    │
│  Легенда:                          │
│  ████ 0.8-1.0  Высокая растит.     │
│  ████ 0.6-0.8  Средняя растит.     │
│  ████ 0.4-0.6  Низкая растит.      │
│  ████ 0.2-0.4  Очень низкая        │
│  ████ 0.0-0.2  Нет растительности  │
└────────────────────────────────────┘
```

### 2. Информационная панель

**Отображает:**
- Текущая дата снимка
- Среднее значение индекса
- Min/Max значения
- Изменение относительно предыдущего снимка

**Пример:**
```
┌────────────────────────────────────┐
│  📅 2024-03-15                     │
│  📊 NDVI: 0.52 (среднее)           │
│  📈 Изменение: +0.07 (+15%)        │
│  📉 Диапазон: 0.18 - 0.81          │
└────────────────────────────────────┘
```


### 3. Временной ползунок (Timeline Slider)

**Основные элементы:**
- Горизонтальная шкала с отметками дат
- Перемещаемый ползунок
- Точки на шкале для каждого снимка
- Текущая позиция выделена

**Интерактивность:**
- Клик на точку - переход к снимку
- Перетаскивание ползунка - плавное переключение
- Клавиши ← → для навигации
- Колесо мыши для прокрутки

**Визуализация:**
```
●────────●────────●────────●────────●
│        │        │        │        │
Jan     Feb     Mar     Apr     May
        ▲
    Текущая позиция
```

### 4. Элементы управления

**Кнопки:**
- `◄◄` - К первому снимку
- `◄` - Предыдущий снимок
- `▶` - Следующий снимок
- `▶▶` - К последнему снимку
- `⏸/▶` - Пауза/Воспроизведение
- `🔄` - Автопроигрывание (loop)

**Настройки автопроигрывания:**
- Скорость: 0.5x, 1x, 2x, 4x
- Направление: вперёд/назад/туда-обратно
- Задержка между кадрами

### 5. График с индикатором

**Особенности:**
- Вертикальная линия показывает текущую позицию
- Клик на график - переход к этой дате
- Hover на точке - показывает значение
- Выделение текущей точки

**Синхронизация:**
- Перемещение ползунка → обновление графика
- Клик на график → обновление ползунка и изображения

---

## Workflow пользователя

### Базовый просмотр

1. Пользователь открывает временной ряд
2. Видит первый снимок в ряду
3. Перемещает ползунок вправо
4. Изображение плавно меняется на следующий снимок
5. Информационная панель обновляется
6. График показывает текущую позицию

### Автопроигрывание

1. Нажимает кнопку "▶ Автопроигрывание"
2. Снимки автоматически сменяются с заданной скоростью
3. Ползунок плавно движется по шкале
4. Можно поставить на паузу в любой момент
5. После последнего снимка возвращается к первому (loop)

### Сравнение дат

1. Нажимает "Сравнить даты"
2. Открывается режим split-screen
3. Выбирает две даты для сравнения
4. Видит изображения рядом
5. Может синхронизировать zoom и pan

---

## Frontend компонент

### TimeSeriesViewer.tsx

```typescript
"use client";
import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";

export default function TimeSeriesViewer({ seriesId }) {
  const [series, setSeries] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadSeries();
  }, [seriesId]);

  const loadSeries = async () => {
    const res = await fetch(`/api/time-series/${seriesId}`);
    const data = await res.json();
    setSeries(data);
  };

  // Автопроигрывание
  useEffect(() => {
    if (isPlaying && series) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= series.points.length - 1) {
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

  // Навигация клавишами
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isPlaying]);

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(series.points.length - 1, prev + 1));
  };

  const handleFirst = () => {
    setCurrentIndex(0);
  };

  const handleLast = () => {
    setCurrentIndex(series.points.length - 1);
  };

  const handleSliderChange = (e) => {
    setCurrentIndex(parseInt(e.target.value));
  };

  if (!series) return <div>Loading...</div>;

  const currentPoint = series.points[currentIndex];
  const previousPoint = currentIndex > 0 ? series.points[currentIndex - 1] : null;
  const change = previousPoint ? currentPoint.mean - previousPoint.mean : 0;
  const changePercent = previousPoint ? (change / previousPoint.mean) * 100 : 0;

  // Данные для графика с индикатором
  const chartData = {
    labels: series.points.map(p => new Date(p.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: series.index_type,
        data: series.points.map(p => p.mean),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: series.points.map((_, i) => 
          i === currentIndex ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'
        ),
        pointBorderColor: series.points.map((_, i) => 
          i === currentIndex ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'
        ),
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        setCurrentIndex(elements[0].index);
      }
    },
    plugins: {
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            xMin: currentIndex,
            xMax: currentIndex,
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderDash: [5, 5],
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${series.index_type}: ${context.parsed.y.toFixed(3)}`;
          }
        }
      }
    }
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
            {series.satellite} • {series.index_type} • {series.points.length} снимков
          </p>
        </div>

        {/* Область изображения */}
        <div className="bg-white/5 rounded-3xl p-6 mb-6">
          <div className="relative aspect-video bg-black/50 rounded-2xl overflow-hidden">
            <img
              src={`/data/time_series/${seriesId}/${currentPoint.id}/preview.png`}
              alt={`Снимок ${currentPoint.date}`}
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
              {new Date(currentPoint.date).toLocaleDateString('ru-RU')}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-white/60">Среднее</div>
            <div className="text-xl font-bold">{currentPoint.mean.toFixed(3)}</div>
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
              {currentPoint.min.toFixed(2)} - {currentPoint.max.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Временной ползунок */}
        <div className="bg-white/5 rounded-3xl p-6 mb-6">
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={series.points.length - 1}
              value={currentIndex}
              onChange={handleSliderChange}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Отметки дат */}
          <div className="flex justify-between text-xs text-white/60 mb-4">
            {series.points.map((point, index) => (
              <button
                key={point.id}
                onClick={() => setCurrentIndex(index)}
                className={`transition ${
                  index === currentIndex ? 'text-white font-bold' : 'hover:text-white'
                }`}
              >
                {new Date(point.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>

          {/* Элементы управления */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleFirst}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
              title="К первому"
            >
              ⏮
            </button>
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
              title="Предыдущий"
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
              onClick={handleNext}
              disabled={currentIndex === series.points.length - 1}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
              title="Следующий"
            >
              ►
            </button>
            <button
              onClick={handleLast}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
              title="К последнему"
            >
              ⏭
            </button>

            {/* Скорость */}
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
        <div className="bg-white/5 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">График изменений</h2>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Дополнительные действия */}
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20">
            + Добавить снимок
          </button>
          <button className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20">
            📹 Экспорт видео
          </button>
          <button className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20">
            🔀 Сравнить даты
          </button>
        </div>
      </div>
    </div>
  );
}
```


---

## Дополнительные функции

### 1. Режим сравнения дат

**UI:**
```
┌──────────────────────────────────────────────────────────────┐
│  Сравнение дат                                          [×]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │  2024-01-15          │  │  2024-05-20          │         │
│  │  NDVI: 0.45          │  │  NDVI: 0.58          │         │
│  │                      │  │                      │         │
│  │  [Изображение 1]     │  │  [Изображение 2]     │         │
│  │                      │  │                      │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                               │
│  Изменение: +0.13 (+28.9%)                                   │
│                                                               │
│  [Синхронизировать zoom]  [Экспорт сравнения]               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Функции:**
- Выбор двух дат для сравнения
- Split-screen отображение
- Синхронизация zoom и pan
- Расчёт изменений
- Экспорт сравнения

### 2. Экспорт видео

**Процесс:**
1. Пользователь нажимает "Экспорт видео"
2. Выбирает параметры:
   - FPS (кадров в секунду): 1, 2, 5, 10
   - Разрешение: 720p, 1080p, 4K
   - Формат: MP4, GIF
   - Добавить информационную панель: да/нет
3. Backend генерирует видео из снимков
4. Пользователь скачивает готовое видео

**Backend:**
```python
@router.post("/api/time-series/{series_id}/export-video")
async def export_video(
    series_id: int,
    fps: int = 2,
    resolution: str = "1080p",
    format: str = "mp4",
    db: Session = Depends(get_db)
):
    series = db.query(TimeSeries).filter(TimeSeries.id == series_id).first()
    points = db.query(TimeSeriesPoint)\
        .filter(TimeSeriesPoint.series_id == series_id)\
        .order_by(TimeSeriesPoint.date)\
        .all()
    
    # Создать видео с помощью ffmpeg или moviepy
    import moviepy.editor as mpy
    
    clips = []
    for point in points:
        img_path = f"data/time_series/{series_id}/{point.id}/preview.png"
        clip = mpy.ImageClip(img_path, duration=1/fps)
        clips.append(clip)
    
    video = mpy.concatenate_videoclips(clips, method="compose")
    output_path = f"data/exports/{series_id}_timelapse.{format}"
    video.write_videofile(output_path, fps=fps)
    
    return {"video_url": output_path}
```

### 3. Анимация переходов

**Плавная смена изображений:**
```typescript
const [fadeIn, setFadeIn] = useState(true);

useEffect(() => {
  setFadeIn(false);
  setTimeout(() => setFadeIn(true), 100);
}, [currentIndex]);

<img
  src={imageUrl}
  className={`transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
/>
```

**Альтернатива - Crossfade:**
```typescript
<div className="relative">
  <img
    src={previousImageUrl}
    className="absolute inset-0 transition-opacity duration-500 opacity-0"
  />
  <img
    src={currentImageUrl}
    className="transition-opacity duration-500 opacity-100"
  />
</div>
```


---

## CSS для кастомного ползунка

```css
/* Стилизация ползунка */
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: linear-gradient(
    to right,
    rgba(75, 192, 192, 0.5) 0%,
    rgba(75, 192, 192, 0.5) var(--slider-progress),
    rgba(255, 255, 255, 0.2) var(--slider-progress),
    rgba(255, 255, 255, 0.2) 100%
  );
  outline: none;
  transition: background 0.3s;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgb(75, 192, 192);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(75, 192, 192, 0.5);
  transition: all 0.3s;
}

.slider::-webkit-slider-thumb:hover {
  width: 24px;
  height: 24px;
  box-shadow: 0 0 15px rgba(75, 192, 192, 0.8);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgb(75, 192, 192);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(75, 192, 192, 0.5);
  transition: all 0.3s;
}

.slider::-moz-range-thumb:hover {
  width: 24px;
  height: 24px;
  box-shadow: 0 0 15px rgba(75, 192, 192, 0.8);
}

/* Обновление прогресса */
.slider {
  --slider-progress: 0%;
}
```

**JavaScript для обновления прогресса:**
```typescript
const updateSliderProgress = (value: number, max: number) => {
  const progress = (value / max) * 100;
  const slider = document.querySelector('.slider') as HTMLElement;
  if (slider) {
    slider.style.setProperty('--slider-progress', `${progress}%`);
  }
};

useEffect(() => {
  updateSliderProgress(currentIndex, series.points.length - 1);
}, [currentIndex]);
```

---

## Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `←` | Предыдущий снимок |
| `→` | Следующий снимок |
| `Space` | Воспроизвести/Пауза |
| `Home` | К первому снимку |
| `End` | К последнему снимку |
| `+` | Увеличить скорость |
| `-` | Уменьшить скорость |
| `F` | Полноэкранный режим |
| `C` | Режим сравнения |

**Реализация:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch(e.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case ' ':
        e.preventDefault();
        setIsPlaying(!isPlaying);
        break;
      case 'Home':
        handleFirst();
        break;
      case 'End':
        handleLast();
        break;
      case '+':
        setPlaySpeed(prev => Math.min(4, prev * 2));
        break;
      case '-':
        setPlaySpeed(prev => Math.max(0.5, prev / 2));
        break;
      case 'f':
      case 'F':
        document.documentElement.requestFullscreen();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentIndex, isPlaying]);
```

---

## Оптимизация производительности

### Предзагрузка изображений

```typescript
useEffect(() => {
  // Предзагрузить соседние изображения
  const preloadImages = () => {
    const imagesToPreload = [
      currentIndex - 1,
      currentIndex + 1,
      currentIndex + 2
    ].filter(i => i >= 0 && i < series.points.length);

    imagesToPreload.forEach(index => {
      const img = new Image();
      img.src = `/data/time_series/${seriesId}/${series.points[index].id}/preview.png`;
    });
  };

  preloadImages();
}, [currentIndex]);
```

### Ленивая загрузка

```typescript
<img
  src={imageUrl}
  loading="lazy"
  className="w-full h-full object-contain"
/>
```

### Кеширование

```typescript
const imageCache = new Map<string, string>();

const getImageUrl = (pointId: string) => {
  const cacheKey = `${seriesId}_${pointId}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }
  
  const url = `/data/time_series/${seriesId}/${pointId}/preview.png`;
  imageCache.set(cacheKey, url);
  return url;
};
```

---

## Мобильная версия

### Адаптивный layout

```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Изображение */}
  <div className="order-1">
    <img src={imageUrl} />
  </div>
  
  {/* График */}
  <div className="order-2 lg:order-2">
    <Line data={chartData} />
  </div>
</div>
```

### Touch-friendly элементы управления

```typescript
// Свайп для навигации
const [touchStart, setTouchStart] = useState(0);
const [touchEnd, setTouchEnd] = useState(0);

const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart(e.targetTouches[0].clientX);
};

const handleTouchMove = (e: React.TouchEvent) => {
  setTouchEnd(e.targetTouches[0].clientX);
};

const handleTouchEnd = () => {
  if (touchStart - touchEnd > 50) {
    // Свайп влево - следующий
    handleNext();
  }
  if (touchStart - touchEnd < -50) {
    // Свайп вправо - предыдущий
    handlePrevious();
  }
};

<div
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  <img src={imageUrl} />
</div>
```

---

## Преимущества подхода

✅ **Интуитивность**: Ползунок понятен любому пользователю
✅ **Интерактивность**: Плавное переключение между снимками
✅ **Визуализация**: Наглядное отображение изменений
✅ **Автоматизация**: Автопроигрывание для быстрого просмотра
✅ **Анализ**: График синхронизирован с изображениями
✅ **Сравнение**: Возможность сравнить две даты
✅ **Экспорт**: Создание видео из временного ряда
✅ **Производительность**: Предзагрузка и кеширование
✅ **Доступность**: Горячие клавиши и touch-жесты

Этот подход превращает временной ряд в интерактивный инструмент для анализа динамики изменений!
