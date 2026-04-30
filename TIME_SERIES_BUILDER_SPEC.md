# Спецификация: Построитель временных рядов

## Концепция

Пользователь загружает несколько снимков одной территории за разные даты, указывает дату для каждого снимка, выстраивает их в хронологическом порядке и получает визуализацию динамики изменений выбранного индекса.

---

## Доступ к функции

### Вариант 1: Отдельная страница
```
Навигация: Главная → Временные ряды
URL: /time-series
```

### Вариант 2: Режим на главной странице
```
Режим работы:
○ Расчёт индекса
○ Выделение воды
○ Карта риска
● Временной ряд  [НОВОЕ]
```

**Рекомендация**: Отдельная страница `/time-series` для более сложного интерфейса.

---

## UI/UX Flow

### Шаг 1: Создание временного ряда

```
┌──────────────────────────────────────────────────────────────┐
│  Временные ряды                                    [+ Создать]│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  У вас пока нет временных рядов                              │
│                                                               │
│  Временной ряд позволяет отслеживать изменения индекса       │
│  на одной территории в течение времени                       │
│                                                               │
│                    [Создать временной ряд]                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Шаг 2: Модальное окно создания

```
┌──────────────────────────────────────────────────────────────┐
│  Новый временной ряд                                    [×]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Название:                                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Мониторинг озера Байкал                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Описание (опционально):                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Отслеживание уровня воды за 2023-2024 год              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Спутник:                                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Sentinel-2                                          ▼   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Индекс для анализа:                                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ NDVI (Vegetation Index)                             ▼   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│                          [Отмена]  [Создать]                 │
└──────────────────────────────────────────────────────────────┘
```

### Шаг 3: Страница временного ряда (пустая)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Назад к списку                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Мониторинг озера Байкал                                     │
│  Sentinel-2 • NDVI                                           │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │         📅 Добавьте снимки для анализа                 │  │
│  │                                                         │  │
│  │         Загрузите снимки одной территории              │  │
│  │         за разные даты                                 │  │
│  │                                                         │  │
│  │              [+ Добавить снимок]                       │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```


### Шаг 4: Модальное окно добавления снимка

```
┌──────────────────────────────────────────────────────────────┐
│  Добавить снимок                                        [×]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Дата снимка:                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 2024-01-15                                          📅  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Тип загрузки:                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ ● Готовый файл      │  │ ○ Отдельные каналы │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │         📁 Перетащите TIFF файл                        │  │
│  │                                                         │  │
│  │         или нажмите для выбора                         │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ⓘ Все снимки должны быть одной территории                  │
│                                                               │
│                          [Отмена]  [Добавить]                │
└──────────────────────────────────────────────────────────────┘
```


### Шаг 5: Список снимков с возможностью перемещения

```
┌──────────────────────────────────────────────────────────────┐
│  ← Назад к списку                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Мониторинг озера Байкал                                     │
│  Sentinel-2 • NDVI                                           │
│                                                               │
│  Снимки (3)                                  [+ Добавить]    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ⋮⋮  2024-01-15                              [Удалить] │  │
│  │      lake_jan.tif                                      │  │
│  │      📊 Среднее: 0.45  Min: 0.12  Max: 0.78           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ⋮⋮  2024-03-20                              [Удалить] │  │
│  │      lake_mar.tif                                      │  │
│  │      📊 Среднее: 0.52  Min: 0.18  Max: 0.81           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ⋮⋮  2024-02-10                              [Удалить] │  │
│  │      lake_feb.tif                                      │  │
│  │      ⚠ Не в хронологическом порядке                   │  │
│  │      📊 Среднее: 0.48  Min: 0.15  Max: 0.79           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  [Автосортировка по дате]              [Построить график]   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Функции:**
- ⋮⋮ - иконка для drag-and-drop перемещения
- Автоматический расчёт статистики при загрузке
- Предупреждение если порядок не хронологический
- Кнопка автосортировки


### Шаг 6: Визуализация временного ряда

```
┌──────────────────────────────────────────────────────────────┐
│  ← Назад к списку                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Мониторинг озера Байкал                                     │
│  Sentinel-2 • NDVI • 5 снимков                               │
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
│  │      │                                                 │  │
│  │  0.0 ┼─────────────────────────────────────────────   │  │
│  │      Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep      │  │
│  │                                                         │  │
│  │  [Экспорт PNG]  [Экспорт CSV]  [Экспорт данных]       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Статистика                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ Среднее      │  │ Тренд        │  │ Изменение    │ │  │
│  │  │ 0.52         │  │ ↗ +15%       │  │ +0.08        │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Снимки в ряду                                         │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │  │
│  │  │ Jan  │  │ Feb  │  │ Mar  │  │ Apr  │  │ May  │    │  │
│  │  │ 0.45 │  │ 0.48 │  │ 0.52 │  │ 0.61 │  │ 0.58 │    │  │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘    │  │
│  │                                                         │  │
│  │  [+ Добавить снимок]                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```


---

## Детальный Workflow

### 1. Создание временного ряда

**Действия пользователя:**
1. Переходит на страницу "Временные ряды"
2. Нажимает "Создать временной ряд"
3. Заполняет форму:
   - Название (обязательно)
   - Описание (опционально)
   - Спутник (Sentinel-2, Landsat-8)
   - Индекс (NDVI, NDWI, BSI и т.д.)
4. Нажимает "Создать"

**Результат:**
- Создаётся запись в БД
- Открывается страница временного ряда (пустая)
- Показывается приглашение добавить снимки

### 2. Добавление снимков

**Вариант A: Готовый многоканальный файл**

1. Нажимает "+ Добавить снимок"
2. Выбирает дату снимка (date picker)
3. Выбирает "Готовый файл"
4. Загружает TIFF файл
5. Нажимает "Добавить"

**Система:**
- Сохраняет файл
- Рассчитывает выбранный индекс
- Извлекает статистику (mean, min, max, std)
- Добавляет точку во временной ряд
- Обновляет список снимков

**Вариант B: Отдельные каналы**

1. Нажимает "+ Добавить снимок"
2. Выбирает дату снимка
3. Выбирает "Отдельные каналы"
4. Открывается интерфейс объединения каналов (из BAND_STACKING_SPEC.md)
5. Загружает каналы, назначает их
6. Система объединяет каналы
7. Рассчитывает индекс
8. Добавляет точку во временной ряд


### 3. Перемещение снимков (Drag and Drop)

**Функциональность:**
- Каждый снимок имеет иконку ⋮⋮ слева
- Пользователь может захватить снимок и перетащить вверх/вниз
- При перемещении показывается индикатор позиции
- После отпускания порядок сохраняется

**Визуальная обратная связь:**
```
Захват:
┌────────────────────────────────────┐
│  ⋮⋮  2024-02-10  [перемещается]   │  ← Полупрозрачный
└────────────────────────────────────┘

Индикатор позиции:
┌────────────────────────────────────┐
│  ⋮⋮  2024-01-15                    │
├────────────────────────────────────┤  ← Синяя линия
│  ⋮⋮  2024-03-20                    │
└────────────────────────────────────┘
```

**Автосортировка:**
- Кнопка "Автосортировка по дате"
- Сортирует снимки от старых к новым
- Показывает уведомление: "Снимки отсортированы по дате"

### 4. Расчёт статистики

**При добавлении снимка система:**

1. Рассчитывает индекс для всего изображения
2. Извлекает статистику:
   ```python
   mean_value = np.mean(index_array)
   min_value = np.min(index_array)
   max_value = np.max(index_array)
   std_value = np.std(index_array)
   ```
3. Сохраняет в БД:
   ```sql
   INSERT INTO time_series_points (
       series_id, date, mean_value, min_value, max_value, std_value
   ) VALUES (?, ?, ?, ?, ?, ?)
   ```

**Отображение:**
- Среднее значение - основная метрика для графика
- Min/Max - показывают диапазон
- Std - показывает вариативность


### 5. Построение графика

**Библиотека:** Chart.js или Recharts

**Данные для графика:**
```typescript
const chartData = {
  labels: points.map(p => formatDate(p.date)), // ["Jan 15", "Feb 10", ...]
  datasets: [{
    label: 'NDVI',
    data: points.map(p => p.mean_value),
    borderColor: 'rgb(75, 192, 192)',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    tension: 0.3, // Плавная линия
    fill: true
  }]
};
```

**Интерактивность:**
- Hover на точке - показывает детали (дата, значение, min/max)
- Клик на точке - открывает детали снимка
- Zoom - приближение участка графика
- Pan - перемещение по графику

**Дополнительные линии:**
- Линия тренда (пунктирная)
- Средняя линия (горизонтальная)
- Диапазон min/max (заливка)


---

## Backend API

### 1. Создание временного ряда

```python
@router.post("/api/time-series/create")
async def create_time_series(
    name: str,
    description: str,
    satellite: str,
    index_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    series = TimeSeries(
        user_id=current_user.id,
        name=name,
        description=description,
        satellite=satellite,
        index_type=index_type
    )
    db.add(series)
    db.commit()
    db.refresh(series)
    
    return {
        "id": series.id,
        "name": series.name,
        "index_type": series.index_type
    }
```

### 2. Добавление снимка

```python
@router.post("/api/time-series/{series_id}/add-snapshot")
async def add_snapshot(
    series_id: int,
    date: str,
    file: UploadFile,
    db: Session = Depends(get_db)
):
    # Получить временной ряд
    series = db.query(TimeSeries).filter(TimeSeries.id == series_id).first()
    if not series:
        raise HTTPException(404, "Time series not found")
    
    # Сохранить файл
    snapshot_id = str(uuid.uuid4())
    file_path = f"data/time_series/{series_id}/{snapshot_id}.tif"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Рассчитать индекс
    index_array = calculate_index(file_path, series.satellite, series.index_type)
    
    # Извлечь статистику
    stats = {
        "mean": float(np.mean(index_array)),
        "min": float(np.min(index_array)),
        "max": float(np.max(index_array)),
        "std": float(np.std(index_array))
    }
    
    # Сохранить точку
    point = TimeSeriesPoint(
        series_id=series_id,
        date=date,
        file_path=file_path,
        mean_value=stats["mean"],
        min_value=stats["min"],
        max_value=stats["max"],
        std_value=stats["std"]
    )
    db.add(point)
    db.commit()
    
    return {
        "id": point.id,
        "date": date,
        "stats": stats
    }
```


### 3. Получение данных временного ряда

```python
@router.get("/api/time-series/{series_id}")
async def get_time_series(series_id: int, db: Session = Depends(get_db)):
    series = db.query(TimeSeries).filter(TimeSeries.id == series_id).first()
    if not series:
        raise HTTPException(404, "Not found")
    
    points = db.query(TimeSeriesPoint)\
        .filter(TimeSeriesPoint.series_id == series_id)\
        .order_by(TimeSeriesPoint.date)\
        .all()
    
    # Расчёт тренда
    if len(points) >= 2:
        dates_numeric = [(datetime.fromisoformat(p.date) - datetime(1970,1,1)).days for p in points]
        values = [p.mean_value for p in points]
        slope, intercept = np.polyfit(dates_numeric, values, 1)
        trend_direction = "increasing" if slope > 0 else "decreasing"
        trend_percent = (slope * len(points) / values[0]) * 100 if values[0] != 0 else 0
    else:
        trend_direction = "unknown"
        trend_percent = 0
    
    return {
        "id": series.id,
        "name": series.name,
        "description": series.description,
        "satellite": series.satellite,
        "index_type": series.index_type,
        "points": [
            {
                "id": p.id,
                "date": p.date,
                "mean": p.mean_value,
                "min": p.min_value,
                "max": p.max_value,
                "std": p.std_value
            }
            for p in points
        ],
        "statistics": {
            "count": len(points),
            "mean": np.mean([p.mean_value for p in points]) if points else 0,
            "trend_direction": trend_direction,
            "trend_percent": round(trend_percent, 2)
        }
    }
```

### 4. Изменение порядка снимков

```python
@router.post("/api/time-series/{series_id}/reorder")
async def reorder_snapshots(
    series_id: int,
    point_ids: List[int],
    db: Session = Depends(get_db)
):
    # Обновить порядок в БД
    for index, point_id in enumerate(point_ids):
        db.query(TimeSeriesPoint)\
            .filter(TimeSeriesPoint.id == point_id)\
            .update({"order_index": index})
    
    db.commit()
    return {"message": "Order updated"}
```

### 5. Удаление снимка

```python
@router.delete("/api/time-series/{series_id}/points/{point_id}")
async def delete_snapshot(
    series_id: int,
    point_id: int,
    db: Session = Depends(get_db)
):
    point = db.query(TimeSeriesPoint).filter(
        TimeSeriesPoint.id == point_id,
        TimeSeriesPoint.series_id == series_id
    ).first()
    
    if not point:
        raise HTTPException(404, "Point not found")
    
    # Удалить файл
    if os.path.exists(point.file_path):
        os.remove(point.file_path)
    
    # Удалить из БД
    db.delete(point)
    db.commit()
    
    return {"message": "Snapshot deleted"}
```


---

## Frontend компоненты

### TimeSeriesPage.tsx

```typescript
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Line } from "react-chartjs-2";

export default function TimeSeriesPage() {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSeries();
  }, [id]);

  const loadSeries = async () => {
    const res = await fetch(`/api/time-series/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setSeries(data);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = series.points.findIndex(p => p.id === active.id);
      const newIndex = series.points.findIndex(p => p.id === over.id);
      
      const newPoints = arrayMove(series.points, oldIndex, newIndex);
      setSeries({ ...series, points: newPoints });
      
      // Сохранить новый порядок
      await fetch(`/api/time-series/${id}/reorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ point_ids: newPoints.map(p => p.id) })
      });
    }
  };

  if (!series) return <div>Loading...</div>;

  const chartData = {
    labels: series.points.map(p => new Date(p.date).toLocaleDateString()),
    datasets: [{
      label: series.index_type,
      data: series.points.map(p => p.mean),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.3,
      fill: true
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
          <p className="text-white/60">{series.satellite} • {series.index_type} • {series.points.length} снимков</p>
        </div>

        {/* График */}
        <div className="bg-white/5 rounded-3xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">График изменений</h2>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20">
              Экспорт PNG
            </button>
            <button className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20">
              Экспорт CSV
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-white/60">Среднее</div>
            <div className="text-2xl font-bold">{series.statistics.mean.toFixed(3)}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-white/60">Тренд</div>
            <div className="text-2xl font-bold">
              {series.statistics.trend_direction === 'increasing' ? '↗' : '↘'} 
              {Math.abs(series.statistics.trend_percent).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-sm text-white/60">Снимков</div>
            <div className="text-2xl font-bold">{series.statistics.count}</div>
          </div>
        </div>

        {/* Список снимков */}
        <div className="bg-white/5 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Снимки в ряду</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-white text-black rounded-xl font-semibold hover:bg-gray-200"
            >
              + Добавить снимок
            </button>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={series.points.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {series.points.map(point => (
                  <SnapshotItem key={point.id} point={point} onDelete={() => handleDelete(point.id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {showAddModal && (
        <AddSnapshotModal
          seriesId={id}
          onClose={() => setShowAddModal(false)}
          onAdded={loadSeries}
        />
      )}
    </div>
  );
}
```


### SnapshotItem.tsx (Draggable компонент)

```typescript
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SnapshotItem({ point, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: point.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition"
    >
      <div className="flex items-center gap-4">
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <svg className="h-6 w-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Дата */}
        <div className="flex-1">
          <div className="text-sm font-medium">{new Date(point.date).toLocaleDateString()}</div>
          <div className="text-xs text-white/60 mt-1">
            📊 Среднее: {point.mean.toFixed(3)} • Min: {point.min.toFixed(3)} • Max: {point.max.toFixed(3)}
          </div>
        </div>

        {/* Кнопка удаления */}
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 px-3 py-1 rounded-lg hover:bg-red-500/10"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
```

### AddSnapshotModal.tsx

```typescript
"use client";
import { useState } from "react";

export function AddSnapshotModal({ seriesId, onClose, onAdded }) {
  const [date, setDate] = useState("");
  const [uploadType, setUploadType] = useState<"single" | "multi">("single");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !file) {
      alert("Заполните все поля");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("date", date);
    formData.append("file", file);

    try {
      const res = await fetch(`/api/time-series/${seriesId}/add-snapshot`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (res.ok) {
        onAdded();
        onClose();
      } else {
        alert("Ошибка добавления снимка");
      }
    } catch (error) {
      alert("Ошибка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-3xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Добавить снимок</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl">×</button>
        </div>

        {/* Дата */}
        <div className="mb-6">
          <label className="block text-sm text-white/80 mb-2">Дата снимка</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
          />
        </div>

        {/* Тип загрузки */}
        <div className="mb-6">
          <label className="block text-sm text-white/80 mb-2">Тип загрузки</label>
          <div className="flex gap-3">
            <button
              onClick={() => setUploadType("single")}
              className={`flex-1 p-3 rounded-xl transition ${
                uploadType === "single"
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Готовый файл
            </button>
            <button
              onClick={() => setUploadType("multi")}
              className={`flex-1 p-3 rounded-xl transition ${
                uploadType === "multi"
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Отдельные каналы
            </button>
          </div>
        </div>

        {/* Загрузка файла */}
        {uploadType === "single" && (
          <div className="mb-6">
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center">
              <input
                type="file"
                accept=".tif,.tiff"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-white/80 mb-2">📁 Перетащите TIFF файл</div>
                <div className="text-sm text-white/60">или нажмите для выбора</div>
              </label>
              {file && (
                <div className="mt-4 text-sm text-green-400">
                  ✓ {file.name}
                </div>
              )}
            </div>
          </div>
        )}

        {uploadType === "multi" && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-200 text-sm">
              ⓘ Откроется окно объединения каналов
            </p>
          </div>
        )}

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <p className="text-yellow-200 text-sm">
            ⓘ Все снимки должны быть одной территории
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 p-3 rounded-xl bg-white/5 text-white hover:bg-white/10"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!date || !file || loading}
            className="flex-1 p-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Добавление..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Экспорт данных

### Экспорт PNG (график)

```typescript
const exportPNG = () => {
  const canvas = document.querySelector('canvas');
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${series.name}_graph.png`;
  a.click();
};
```

### Экспорт CSV (данные)

```typescript
const exportCSV = () => {
  const csv = [
    ['Дата', 'Среднее', 'Минимум', 'Максимум', 'Стд. отклонение'],
    ...series.points.map(p => [
      p.date,
      p.mean.toFixed(6),
      p.min.toFixed(6),
      p.max.toFixed(6),
      p.std.toFixed(6)
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${series.name}_data.csv`;
  a.click();
};
```

---

## Преимущества подхода

✅ **Гибкость**: Загрузка готовых файлов или отдельных каналов
✅ **Визуализация**: Наглядный график изменений
✅ **Интерактивность**: Drag-and-drop для изменения порядка
✅ **Автоматизация**: Автоматический расчёт статистики
✅ **Экспорт**: Сохранение графиков и данных
✅ **Анализ**: Расчёт трендов и статистики
✅ **Удобство**: Интуитивный интерфейс

Этот подход позволяет легко создавать и анализировать временные ряды для мониторинга изменений!
