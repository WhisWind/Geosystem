# Спецификация: Объединение каналов космоснимков

## Концепция

Пользователь загружает отдельные спектральные каналы (bands) и система объединяет их в один многоканальный TIFF файл для дальнейшей обработки.

---

## UI/UX Flow

### 1. Главная страница - Модификация существующей загрузки

Текущая кнопка загрузки уже принимает многоканальные TIFF. Добавляем возможность загрузить отдельные каналы:

```
┌─────────────────────────────────────────────────────────┐
│  📁 Перетащите файл или нажмите для выбора              │
│                                                         │
│  Поддерживаемые форматы:                                │
│  • Многоканальный TIFF (готовый снимок)                 │
│  • Одноканальные TIFF (отдельные спектры)               │
│                                                         │
│  [Загрузить готовый файл]  [Объединить каналы]          │
└─────────────────────────────────────────────────────────┘
```

При клике на "Объединить каналы" открывается модальное окно.

### 2. Модальное окно "Объединение каналов"

#### Шаг 1: Загрузка файлов

```
┌──────────────────────────────────────────────────────────┐
│  Объединение спектральных каналов              [×]       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Спутник: [Sentinel-2 ▼]                                 │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │         📁 Перетащите файлы сюда                   │  │
│  │                                                     │  │
│  │         или нажмите для выбора                     │  │
│  │                                                     │  │
│  │         Можно выбрать несколько файлов сразу       │  │
│  │                                                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ⓘ Загрузите все спектральные каналы одновременно        │
│                                                           │
│                            [Отмена]  [Далее →]           │
└──────────────────────────────────────────────────────────┘
```

#### Шаг 2: Назначение каналов

```
┌──────────────────────────────────────────────────────────┐
│  Объединение спектральных каналов              [×]       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Спутник: Sentinel-2                          [← Назад]  │
│                                                           │
│  Загружено файлов: 5                                     │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  B02.tif                                           │  │
│  │  Канал: [Blue (B02) ▼]  ✓ Автоопределение         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  B03.tif                                           │  │
│  │  Канал: [Green (B03) ▼]  ✓ Автоопределение        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  B04.tif                                           │  │
│  │  Канал: [Red (B04) ▼]  ✓ Автоопределение          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  B08.tif                                           │  │
│  │  Канал: [NIR (B08) ▼]  ✓ Автоопределение          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  unknown_band.tif                                  │  │
│  │  Канал: [Выберите канал ▼]  ⚠ Требуется выбор     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ✓ Все каналы назначены (5/5)                            │
│                                                           │
│              [Отмена]  [Объединить каналы]               │
└──────────────────────────────────────────────────────────┘
```



---

## Автоопределение каналов

### Правила определения по имени файла

Система анализирует имя файла и пытается определить канал:

#### Sentinel-2
```
B01.tif → Coastal Aerosol (B01)
B02.tif → Blue (B02)
B03.tif → Green (B03)
B04.tif → Red (B04)
B05.tif → Red Edge 1 (B05)
B06.tif → Red Edge 2 (B06)
B07.tif → Red Edge 3 (B07)
B08.tif → NIR (B08)
B8A.tif → NIR Narrow (B8A)
B09.tif → Water Vapour (B09)
B11.tif → SWIR 1 (B11)
B12.tif → SWIR 2 (B12)
```

#### Landsat 8/9
```
B1.tif → Coastal Aerosol (B1)
B2.tif → Blue (B2)
B3.tif → Green (B3)
B4.tif → Red (B4)
B5.tif → NIR (B5)
B6.tif → SWIR 1 (B6)
B7.tif → SWIR 2 (B7)
```

### Алгоритм автоопределения

```python
def detect_band_from_filename(filename: str, satellite: str) -> str:
    """
    Определяет канал по имени файла
    """
    filename_upper = filename.upper()
    
    if satellite == "Sentinel-2":
        patterns = {
            "B01": "Coastal Aerosol (B01)",
            "B02": "Blue (B02)",
            "B03": "Green (B03)",
            "B04": "Red (B04)",
            "B05": "Red Edge 1 (B05)",
            "B06": "Red Edge 2 (B06)",
            "B07": "Red Edge 3 (B07)",
            "B08": "NIR (B08)",
            "B8A": "NIR Narrow (B8A)",
            "B09": "Water Vapour (B09)",
            "B11": "SWIR 1 (B11)",
            "B12": "SWIR 2 (B12)",
        }
        
        for pattern, band_name in patterns.items():
            if pattern in filename_upper:
                return band_name
    
    elif satellite == "Landsat-8":
        patterns = {
            "B1": "Coastal Aerosol (B1)",
            "B2": "Blue (B2)",
            "B3": "Green (B3)",
            "B4": "Red (B4)",
            "B5": "NIR (B5)",
            "B6": "SWIR 1 (B6)",
            "B7": "SWIR 2 (B7)",
        }
        
        for pattern, band_name in patterns.items():
            if f"_{pattern}." in filename_upper or f"_{pattern}_" in filename_upper:
                return band_name
    
    return "Unknown"  # Пользователь выберет вручную
```

---

## Список доступных каналов

### Sentinel-2 (полный список)
```typescript
const SENTINEL2_BANDS = [
  { value: "B01", label: "Coastal Aerosol (B01) - 443nm" },
  { value: "B02", label: "Blue (B02) - 490nm" },
  { value: "B03", label: "Green (B03) - 560nm" },
  { value: "B04", label: "Red (B04) - 665nm" },
  { value: "B05", label: "Red Edge 1 (B05) - 705nm" },
  { value: "B06", label: "Red Edge 2 (B06) - 740nm" },
  { value: "B07", label: "Red Edge 3 (B07) - 783nm" },
  { value: "B08", label: "NIR (B08) - 842nm" },
  { value: "B8A", label: "NIR Narrow (B8A) - 865nm" },
  { value: "B09", label: "Water Vapour (B09) - 945nm" },
  { value: "B11", label: "SWIR 1 (B11) - 1610nm" },
  { value: "B12", label: "SWIR 2 (B12) - 2190nm" },
];
```

### Landsat 8/9
```typescript
const LANDSAT8_BANDS = [
  { value: "B1", label: "Coastal Aerosol (B1) - 443nm" },
  { value: "B2", label: "Blue (B2) - 482nm" },
  { value: "B3", label: "Green (B3) - 562nm" },
  { value: "B4", label: "Red (B4) - 655nm" },
  { value: "B5", label: "NIR (B5) - 865nm" },
  { value: "B6", label: "SWIR 1 (B6) - 1609nm" },
  { value: "B7", label: "SWIR 2 (B7) - 2201nm" },
];
```

---

## Backend API

### Endpoint: POST /api/stack/bands

```python
from fastapi import APIRouter, UploadFile, File, Form
from typing import List
import rasterio
import numpy as np

router = APIRouter()

@router.post("/bands")
async def stack_bands(
    files: List[UploadFile] = File(...),
    band_names: List[str] = Form(...),  # ["B02", "B03", "B04", ...]
    satellite: str = Form(...)
):
    """
    Объединяет несколько одноканальных TIFF в один многоканальный
    """
    
    # Валидация
    if len(files) != len(band_names):
        raise HTTPException(400, "Количество файлов и названий каналов не совпадает")
    
    if len(files) < 3:
        raise HTTPException(400, "Минимум 3 канала для объединения")
    
    # Сохранить временные файлы
    temp_paths = []
    for file in files:
        temp_path = f"temp/{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        temp_paths.append(temp_path)
    
    # Прочитать первый файл для получения метаданных
    with rasterio.open(temp_paths[0]) as src:
        meta = src.meta.copy()
        height, width = src.shape
    
    # Обновить метаданные для многоканального файла
    meta.update(count=len(files))
    
    # Создать выходной файл
    result_id = str(uuid.uuid4())
    output_path = f"data/results/{result_id}/stacked.tif"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Записать все каналы
    with rasterio.open(output_path, 'w', **meta) as dst:
        for i, temp_path in enumerate(temp_paths, start=1):
            with rasterio.open(temp_path) as src:
                band_data = src.read(1)
                dst.write(band_data, i)
    
    # Создать превью (RGB композит)
    create_rgb_preview(output_path, result_id, band_names, satellite)
    
    # Удалить временные файлы
    for temp_path in temp_paths:
        os.remove(temp_path)
    
    return {
        "id": result_id,
        "message": "Каналы успешно объединены",
        "bands": band_names,
        "band_count": len(files)
    }
```

### Создание RGB превью

```python
def create_rgb_preview(stacked_path: str, result_id: str, band_names: List[str], satellite: str):
    """
    Создаёт RGB превью из объединённого файла
    """
    
    # Определить индексы RGB каналов
    if satellite == "Sentinel-2":
        rgb_mapping = {"B04": "R", "B03": "G", "B02": "B"}
    elif satellite == "Landsat-8":
        rgb_mapping = {"B4": "R", "B3": "G", "B2": "B"}
    
    # Найти индексы RGB каналов
    rgb_indices = {}
    for i, band_name in enumerate(band_names, start=1):
        if band_name in rgb_mapping:
            rgb_indices[rgb_mapping[band_name]] = i
    
    # Если нет всех RGB каналов, использовать первые 3
    if len(rgb_indices) < 3:
        rgb_indices = {"R": 1, "G": 2, "B": 3}
    
    # Прочитать RGB каналы
    with rasterio.open(stacked_path) as src:
        r = src.read(rgb_indices["R"])
        g = src.read(rgb_indices["G"])
        b = src.read(rgb_indices["B"])
    
    # Нормализация
    def normalize(band):
        p2, p98 = np.percentile(band, (2, 98))
        return np.clip((band - p2) / (p98 - p2) * 255, 0, 255).astype(np.uint8)
    
    r_norm = normalize(r)
    g_norm = normalize(g)
    b_norm = normalize(b)
    
    # Создать RGB изображение
    rgb = np.dstack([r_norm, g_norm, b_norm])
    
    # Сохранить превью
    preview_path = f"data/results/{result_id}/preview.png"
    Image.fromarray(rgb).save(preview_path)
```

---

## Frontend компонент

### BandStackingModal.tsx (обновлённая версия)

```typescript
"use client";
import { useState } from "react";

interface BandFile {
  file: File;
  bandName: string;
  autoDetected: boolean;
}

interface BandStackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (file: File) => void;
}

export function BandStackingModal({ isOpen, onClose, onComplete }: BandStackingModalProps) {
  const [step, setStep] = useState<"upload" | "assign">("upload");
  const [satellite, setSatellite] = useState("Sentinel-2");
  const [bands, setBands] = useState<BandFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const BAND_OPTIONS = satellite === "Sentinel-2" ? SENTINEL2_BANDS : LANDSAT8_BANDS;

  const detectBand = (filename: string): string => {
    const upper = filename.toUpperCase();
    
    if (satellite === "Sentinel-2") {
      if (upper.includes("B01")) return "B01";
      if (upper.includes("B02")) return "B02";
      if (upper.includes("B03")) return "B03";
      if (upper.includes("B04")) return "B04";
      if (upper.includes("B05")) return "B05";
      if (upper.includes("B06")) return "B06";
      if (upper.includes("B07")) return "B07";
      if (upper.includes("B08")) return "B08";
      if (upper.includes("B8A")) return "B8A";
      if (upper.includes("B09")) return "B09";
      if (upper.includes("B11")) return "B11";
      if (upper.includes("B12")) return "B12";
    } else if (satellite === "Landsat-8") {
      if (upper.includes("_B1.") || upper.includes("_B1_")) return "B1";
      if (upper.includes("_B2.") || upper.includes("_B2_")) return "B2";
      if (upper.includes("_B3.") || upper.includes("_B3_")) return "B3";
      if (upper.includes("_B4.") || upper.includes("_B4_")) return "B4";
      if (upper.includes("_B5.") || upper.includes("_B5_")) return "B5";
      if (upper.includes("_B6.") || upper.includes("_B6_")) return "B6";
      if (upper.includes("_B7.") || upper.includes("_B7_")) return "B7";
    }
    
    return "";
  };

  const handleFilesSelected = (files: FileList) => {
    const newBands: BandFile[] = Array.from(files).map(file => {
      const detected = detectBand(file.name);
      return {
        file,
        bandName: detected,
        autoDetected: !!detected
      };
    });
    
    setBands(newBands);
    setStep("assign");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(e.target.files);
    }
  };

  const updateBandName = (index: number, bandName: string) => {
    setBands(bands.map((b, i) => 
      i === index ? { ...b, bandName, autoDetected: false } : b
    ));
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    
    bands.forEach(band => {
      formData.append("files", band.file);
      formData.append("band_names", band.bandName);
    });
    
    formData.append("satellite", satellite);

    const res = await fetch("http://localhost:8000/api/stack/bands", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    
    // Скачать объединённый файл
    const fileRes = await fetch(`http://localhost:8000/data/results/${data.id}/stacked.tif`);
    const blob = await fileRes.blob();
    const file = new File([blob], "stacked.tif", { type: "image/tiff" });
    
    onComplete(file);
  };

  const allBandsAssigned = bands.every(b => b.bandName);
  const hasEnoughBands = bands.length >= 3;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Шаг 1: Загрузка файлов */}
        {step === "upload" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Объединение каналов</h2>
              <button onClick={onClose} className="text-white/60 hover:text-white text-2xl">×</button>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-white/80 mb-2">Спутник</label>
              <select
                value={satellite}
                onChange={(e) => setSatellite(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
              >
                <option value="Sentinel-2">Sentinel-2</option>
                <option value="Landsat-8">Landsat-8/9</option>
              </select>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`relative rounded-2xl border-2 border-dashed p-16 text-center transition ${
                isDragging 
                  ? 'border-white/40 bg-white/10' 
                  : 'border-white/20 bg-white/5'
              }`}
            >
              <input
                type="file"
                accept=".tif,.tiff"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              
              <div className="pointer-events-none">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
                  <svg className="h-10 w-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <div className="text-lg font-medium text-white/80 mb-2">
                  Перетащите файлы сюда
                </div>
                
                <div className="text-sm text-white/60 mb-1">
                  или нажмите для выбора
                </div>
                
                <div className="text-xs text-white/40">
                  Можно выбрать несколько файлов сразу
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-200 text-sm">
                ⓘ Загрузите все спектральные каналы одновременно
              </p>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10"
              >
                Отмена
              </button>
            </div>
          </>
        )}

        {/* Шаг 2: Назначение каналов */}
        {step === "assign" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Назначение каналов</h2>
              <button onClick={onClose} className="text-white/60 hover:text-white text-2xl">×</button>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-sm text-white/60">Спутник: {satellite}</div>
                <div className="text-sm text-white/60">Загружено файлов: {bands.length}</div>
              </div>
              <button
                onClick={() => setStep("upload")}
                className="text-sm text-white/60 hover:text-white flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
              {bands.map((band, index) => (
                <div key={index} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white mb-1 truncate">
                        {band.file.name}
                      </div>
                      <div className="text-xs text-white/40 mb-3">
                        {(band.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      
                      <select
                        value={band.bandName}
                        onChange={(e) => updateBandName(index, e.target.value)}
                        className="w-full p-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm"
                      >
                        <option value="">Выберите канал</option>
                        {BAND_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      
                      {band.autoDetected && band.bandName && (
                        <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Автоопределение
                        </div>
                      )}
                      
                      {!band.bandName && (
                        <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Требуется выбор
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {allBandsAssigned && hasEnoughBands && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-green-200 text-sm flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Все каналы назначены ({bands.length}/{bands.length})
                </p>
              </div>
            )}

            {!hasEnoughBands && (
              <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-200 text-sm">
                  ⚠ Для расчёта индексов нужно минимум 3 канала (загружено: {bands.length})
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 p-3 rounded-xl bg-white/5 text-white hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={!allBandsAssigned || !hasEnoughBands}
                className="flex-1 p-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Объединить каналы
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const SENTINEL2_BANDS = [
  { value: "B01", label: "Coastal Aerosol (B01)" },
  { value: "B02", label: "Blue (B02)" },
  { value: "B03", label: "Green (B03)" },
  { value: "B04", label: "Red (B04)" },
  { value: "B05", label: "Red Edge 1 (B05)" },
  { value: "B06", label: "Red Edge 2 (B06)" },
  { value: "B07", label: "Red Edge 3 (B07)" },
  { value: "B08", label: "NIR (B08)" },
  { value: "B8A", label: "NIR Narrow (B8A)" },
  { value: "B09", label: "Water Vapour (B09)" },
  { value: "B11", label: "SWIR 1 (B11)" },
  { value: "B12", label: "SWIR 2 (B12)" },
];

const LANDSAT8_BANDS = [
  { value: "B1", label: "Coastal Aerosol (B1)" },
  { value: "B2", label: "Blue (B2)" },
  { value: "B3", label: "Green (B3)" },
  { value: "B4", label: "Red (B4)" },
  { value: "B5", label: "NIR (B5)" },
  { value: "B6", label: "SWIR 1 (B6)" },
  { value: "B7", label: "SWIR 2 (B7)" },
];
```

---

## Интеграция в главную страницу

### Модификация FileUpload компонента

```typescript
// frontend/app/components/FileUpload.tsx
"use client";
import { useState } from "react";
import { BandStackingModal } from "./BandStackingModal";

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function FileUpload({ file, onFileChange }: FileUploadProps) {
  const [showBandStacking, setShowBandStacking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.tif')) {
      onFileChange(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  const handleStackedFile = (stackedFile: File) => {
    onFileChange(stackedFile);
    setShowBandStacking(false);
  };

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Загрузка данных</div>
            <div className="mt-1 text-xs text-white/60">
              TIFF файл со спутниковыми данными
            </div>
          </div>
        </div>

        {/* Drag & Drop зона */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition ${
            isDragging 
              ? 'border-white/40 bg-white/10' 
              : 'border-white/20 bg-white/5'
          }`}
        >
          <input
            type="file"
            accept=".tif,.tiff"
            onChange={handleFileInput}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          
          <div className="pointer-events-none">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <svg className="h-8 w-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div className="text-sm font-medium text-white/80">
              Перетащите файл или нажмите для выбора
            </div>
            
            <div className="mt-2 text-xs text-white/50">
              Поддерживается: многоканальный TIFF
            </div>
          </div>
        </div>

        {/* Показать выбранный файл */}
        {file && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-white/60">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                onClick={() => onFileChange(null)}
                className="text-white/60 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Кнопка объединения каналов */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">или</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

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
      </div>

      {/* Модальное окно объединения */}
      <BandStackingModal
        isOpen={showBandStacking}
        onClose={() => setShowBandStacking(false)}
        onComplete={handleStackedFile}
      />
    </>
  );
}
```

### Обновление BandStackingModal

Добавить callback для возврата объединённого файла:

```typescript
interface BandStackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (file: File) => void;  // Новый prop
}

export function BandStackingModal({ isOpen, onClose, onComplete }: BandStackingModalProps) {
  // ... существующий код ...

  const handleSubmit = async () => {
    const formData = new FormData();
    
    bands.forEach(band => {
      if (band.file) {
        formData.append("files", band.file);
        formData.append("band_names", band.bandName);
      }
    });
    
    formData.append("satellite", satellite);

    const res = await fetch("http://localhost:8000/api/stack/bands", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    
    // Скачать объединённый файл
    const fileRes = await fetch(`http://localhost:8000/data/results/${data.id}/stacked.tif`);
    const blob = await fileRes.blob();
    const file = new File([blob], "stacked.tif", { type: "image/tiff" });
    
    // Передать файл родителю
    onComplete(file);
  };

  // ... остальной код ...
}
```

---

## Валидация и проверки

### Backend валидация

```python
def validate_bands(files: List[UploadFile], band_names: List[str]):
    """
    Проверяет корректность загруженных каналов
    """
    
    # Проверка количества
    if len(files) < 3:
        raise HTTPException(400, "Минимум 3 канала")
    
    if len(files) != len(band_names):
        raise HTTPException(400, "Количество файлов и названий не совпадает")
    
    # Проверка уникальности каналов
    if len(set(band_names)) != len(band_names):
        raise HTTPException(400, "Каналы должны быть уникальными")
    
    # Проверка размеров
    shapes = []
    for file in files:
        with rasterio.open(file.file) as src:
            shapes.append(src.shape)
    
    if len(set(shapes)) > 1:
        raise HTTPException(400, "Все каналы должны иметь одинаковый размер")
    
    return True
```

---

## Результат

После объединения пользователь получает:
- Многоканальный TIFF файл
- RGB превью
- Возможность использовать для расчёта индексов

Файл сохраняется и доступен для дальнейшей работы как обычный загруженный снимок.

---

## Преимущества подхода

✅ Гибкость - пользователь контролирует каждый канал
✅ Автоматизация - система пытается определить каналы
✅ Простота - интуитивный интерфейс
✅ Валидация - проверка корректности данных
✅ Универсальность - поддержка разных спутников


---

## Визуальный пример интеграции

### До (текущее состояние)
```
┌────────────────────────────────────────┐
│  📁 Перетащите файл                    │
│                                        │
│  [Выбрать файл]                        │
└────────────────────────────────────────┘
```

### После (с возможностью объединения)
```
┌────────────────────────────────────────┐
│  📁 Перетащите файл                    │
│                                        │
│  [Выбрать файл]                        │
│                                        │
│  ─────────── или ───────────           │
│                                        │
│  [📦 Объединить отдельные каналы]      │
│  Загрузите спектральные каналы         │
│  по отдельности                        │
└────────────────────────────────────────┘
```

---

## Workflow пользователя

### Вариант 1: Готовый многоканальный файл (как сейчас)
1. Пользователь перетаскивает готовый TIFF
2. Выбирает спутник и индекс
3. Нажимает "Рассчитать"

### Вариант 2: Отдельные каналы (новое)

#### Шаг 1: Открытие модального окна
1. Пользователь нажимает "Объединить отдельные каналы"
2. Открывается модальное окно на шаге "Загрузка"

#### Шаг 2: Выбор спутника и загрузка файлов
1. Выбирает спутник (Sentinel-2 или Landsat-8)
2. Перетаскивает все файлы каналов сразу (или выбирает через диалог)
   - Можно выбрать 3-12 файлов одновременно
   - Поддерживается drag-and-drop
   - Поддерживается множественный выбор через Ctrl/Cmd

#### Шаг 3: Автоматическое назначение
1. Система автоматически переходит на шаг "Назначение каналов"
2. Для каждого файла система пытается определить канал по имени
3. Успешно определённые каналы помечаются зелёной галочкой
4. Неопределённые каналы помечаются жёлтым предупреждением

#### Шаг 4: Ручная корректировка
1. Пользователь просматривает список файлов
2. Для файлов с автоопределением может изменить канал при необходимости
3. Для неопределённых файлов выбирает канал вручную из выпадающего списка
4. Видит статус: "Все каналы назначены (5/5)" или предупреждение

#### Шаг 5: Объединение
1. Когда все каналы назначены и их минимум 3, кнопка "Объединить каналы" активна
2. Нажимает "Объединить каналы"
3. Система отправляет запрос на backend
4. Backend создаёт многоканальный TIFF
5. Файл автоматически загружается и подставляется в форму
6. Модальное окно закрывается
7. Пользователь видит загруженный файл и может продолжить работу

---

## Примеры использования

### Пример 1: Sentinel-2 с автоопределением

Пользователь загружает файлы:
```
T36UXV_20240315T083601_B02_10m.tif
T36UXV_20240315T083601_B03_10m.tif
T36UXV_20240315T083601_B04_10m.tif
T36UXV_20240315T083601_B08_10m.tif
```

Система автоматически определяет:
- `B02` → Blue (B02)
- `B03` → Green (B03)
- `B04` → Red (B04)
- `B08` → NIR (B08)

Пользователь просто нажимает "Объединить каналы".

### Пример 2: Landsat с частичным автоопределением

Пользователь загружает файлы:
```
LC08_L1TP_B2.TIF
LC08_L1TP_B3.TIF
LC08_L1TP_B4.TIF
custom_band.tif
```

Система определяет:
- `B2` → Blue (B2) ✓
- `B3` → Green (B3) ✓
- `B4` → Red (B4) ✓
- `custom_band.tif` → ⚠ Требуется выбор

Пользователь вручную выбирает для `custom_band.tif` → NIR (B5), затем нажимает "Объединить каналы".

### Пример 3: Нестандартные имена файлов

Пользователь загружает файлы:
```
blue_channel.tif
green_channel.tif
red_channel.tif
nir_channel.tif
```

Система не может определить каналы автоматически.

Пользователь вручную назначает:
- `blue_channel.tif` → Blue (B02)
- `green_channel.tif` → Green (B03)
- `red_channel.tif` → Red (B04)
- `nir_channel.tif` → NIR (B08)

Затем нажимает "Объединить каналы".

---

## Дополнительные возможности

### Возможность вернуться назад

На шаге "Назначение каналов" есть кнопка "← Назад":
- Возвращает на шаг "Загрузка"
- Сбрасывает выбранные файлы
- Позволяет выбрать другие файлы или изменить спутник

### Валидация дубликатов

Если пользователь назначает один и тот же канал двум файлам:
```
file1.tif → Blue (B02)
file2.tif → Blue (B02)  ← Ошибка!
```

Система показывает предупреждение:
```
⚠ Канал Blue (B02) уже назначен файлу file1.tif
```

И не позволяет продолжить до исправления.

### Сортировка файлов

Файлы в списке автоматически сортируются:
1. Сначала файлы с автоопределением
2. Затем файлы без автоопределения
3. Внутри каждой группы - по имени канала

Это помогает пользователю быстро найти файлы, требующие ручного назначения.

### Индикация прогресса

При объединении каналов показывается индикатор:
```
┌────────────────────────────────────┐
│  Объединение каналов...            │
│  ████████████░░░░░░░░░░  60%       │
│  Обработка канала 3 из 5           │
└────────────────────────────────────┘
```

---

## Обработка ошибок

### Ошибка: Разные размеры каналов

Если файлы имеют разные размеры:
```
B02.tif: 10980 × 10980
B03.tif: 10980 × 10980
B04.tif: 5490 × 5490  ← Другой размер!
```

Backend возвращает ошибку:
```json
{
  "error": "Все каналы должны иметь одинаковый размер",
  "details": {
    "B02": [10980, 10980],
    "B03": [10980, 10980],
    "B04": [5490, 5490]
  }
}
```

Frontend показывает:
```
❌ Ошибка объединения
Все каналы должны иметь одинаковый размер.
Канал B04 имеет размер 5490×5490, а остальные 10980×10980.
```

### Ошибка: Недостаточно каналов

Если пользователь загрузил только 2 файла:
```
⚠ Для расчёта индексов нужно минимум 3 канала (загружено: 2)
```

Кнопка "Объединить каналы" неактивна.

### Ошибка: Не все каналы назначены

Если есть файлы без назначенного канала:
```
⚠ Не все каналы назначены (3/5)
Назначьте каналы для всех файлов перед объединением.
```

Кнопка "Объединить каналы" неактивна.

---

## Оптимизация UX

### Быстрые действия

Добавить кнопки быстрого действия:

```typescript
// Кнопка "Автоназначить всё"
<button onClick={autoAssignAll}>
  🤖 Автоназначить всё
</button>

// Кнопка "Сбросить назначения"
<button onClick={resetAssignments}>
  🔄 Сбросить
</button>
```

### Предпросмотр RGB

После назначения каналов показать мини-превью RGB композита:

```
┌────────────────────────────────────┐
│  Предпросмотр RGB                  │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │     [RGB preview image]      │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│  R: B04 (Red)                      │
│  G: B03 (Green)                    │
│  B: B02 (Blue)                     │
└────────────────────────────────────┘
```

### Сохранение конфигурации

Сохранять последнюю конфигурацию в localStorage:

```typescript
localStorage.setItem('lastSatellite', satellite);
localStorage.setItem('lastBandMapping', JSON.stringify(bandMapping));
```

При следующем открытии предлагать использовать сохранённую конфигурацию.

---

## Мобильная версия

На мобильных устройствах:
- Модальное окно занимает весь экран
- Файлы загружаются через стандартный диалог (drag-and-drop недоступен)
- Список файлов прокручивается вертикально
- Кнопки увеличены для удобства нажатия

```
┌─────────────────────────────┐
│ ← Объединение каналов       │
├─────────────────────────────┤
│                             │
│ Спутник: Sentinel-2         │
│                             │
│ [Выбрать файлы]             │
│                             │
│ Загружено: 0 файлов         │
│                             │
│                             │
│                             │
│                             │
│ [Отмена]  [Далее →]         │
└─────────────────────────────┘
```

---

## Тестовые сценарии

### Сценарий 1: Успешное объединение
1. Открыть модальное окно
2. Выбрать Sentinel-2
3. Загрузить 4 файла с правильными именами
4. Проверить автоопределение
5. Нажать "Объединить каналы"
6. Проверить, что файл появился в форме

### Сценарий 2: Ручное назначение
1. Открыть модальное окно
2. Выбрать Landsat-8
3. Загрузить 3 файла с нестандартными именами
4. Вручную назначить каналы
5. Нажать "Объединить каналы"
6. Проверить результат

### Сценарий 3: Возврат назад
1. Открыть модальное окно
2. Загрузить файлы
3. Перейти на шаг назначения
4. Нажать "← Назад"
5. Проверить, что вернулись на шаг загрузки
6. Загрузить другие файлы

### Сценарий 4: Обработка ошибок
1. Загрузить файлы разных размеров
2. Попытаться объединить
3. Проверить, что показывается понятная ошибка
4. Исправить и повторить

---

## Итоговые преимущества подхода

✅ **Удобство**: Загрузка всех файлов сразу
✅ **Автоматизация**: Система сама определяет каналы
✅ **Контроль**: Пользователь может изменить любое назначение
✅ **Наглядность**: Видно все файлы и их статус
✅ **Валидация**: Проверка на ошибки до отправки
✅ **Гибкость**: Работает с любыми именами файлов
✅ **Интуитивность**: Двухшаговый процесс понятен
✅ **Обратная связь**: Индикаторы прогресса и статуса

Этот подход значительно удобнее, чем загрузка файлов по одному!


---

## Преимущества такого подхода

✅ Не ломает существующий функционал
✅ Добавляет новую возможность без усложнения UI
✅ Интуитивно понятно - два способа загрузки
✅ Гибкость для пользователя
✅ Автоматизация там, где возможно
✅ Контроль там, где нужно

---

## Альтернативный вариант (более простой)

Если нужно ещё проще, можно сделать переключатель:

```typescript
export function FileUpload({ file, onFileChange }: FileUploadProps) {
  const [uploadMode, setUploadMode] = useState<"single" | "multi">("single");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      {/* Переключатель режима */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setUploadMode("single")}
          className={`flex-1 rounded-xl p-3 text-sm font-medium transition ${
            uploadMode === "single"
              ? "bg-white text-black"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          Готовый файл
        </button>
        <button
          onClick={() => setUploadMode("multi")}
          className={`flex-1 rounded-xl p-3 text-sm font-medium transition ${
            uploadMode === "multi"
              ? "bg-white text-black"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          Отдельные каналы
        </button>
      </div>

      {/* Показать соответствующий интерфейс */}
      {uploadMode === "single" ? (
        <SingleFileUpload file={file} onFileChange={onFileChange} />
      ) : (
        <MultiBandUpload onComplete={onFileChange} />
      )}
    </div>
  );
}
```

Этот вариант ещё проще - пользователь сразу видит два режима и выбирает нужный.
