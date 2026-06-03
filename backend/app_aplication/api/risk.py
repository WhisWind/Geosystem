from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import rasterio
from rasterio.io import MemoryFile
import numpy as np
from io import BytesIO
from PIL import Image
from scipy.ndimage import zoom
from pathlib import Path
import uuid
import json
import time

router = APIRouter(prefix="/risk", tags=["risk"])

# Путь к папке результатов
BASE_DIR = Path(__file__).resolve().parent.parent
RESULTS_DIR = BASE_DIR / "data" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Сценарии риска
RISK_SCENARIOS = {
    "flooding": {"NDVI": -0.2, "NDWI": 0.6, "BSI": 0.4},
    "ecological": {"NDVI": 0.5, "NDWI": 0.3, "BSI": 0.2},
    "passability": {"NDVI": -0.4, "NDWI": 0.5, "BSI": 0.1},
}

# Функции расчёта индексов
def compute_ndwi(GREEN, NIR):
    return (GREEN - NIR) / (GREEN + NIR + 1e-10)

def compute_ndvi(RED, NIR):
    return (NIR - RED) / (NIR + RED + 1e-10)

def compute_bsi(SWIR1, RED, NIR, BLUE):
    return ((SWIR1 + RED) - (NIR + BLUE)) / ((SWIR1 + RED) + (NIR + BLUE) + 1e-10)

INDEX_FUNCTIONS = {
    "NDWI": compute_ndwi,
    "NDVI": compute_ndvi,
    "BSI": compute_bsi,
}

# Каналы Sentinel-2 — верхний регистр
SATELLITE_BANDS = {
    "Sentinel-2": {
        "BLUE": 2,
        "GREEN": 3,
        "RED": 4,
        "NIR": 8,
        "SWIR1": 11,
    },
}

@router.post("/assess")
async def assess_risk(
    file: UploadFile = File(...),
    scenario: str = Form("flooding"),
    normalization_type: str = Form("linear"),
    safe_threshold: float = Form(0.2),
    danger_threshold: float = Form(0.4),
    downsample: int = Form(512),
):
    if not file.filename.lower().endswith((".tif", ".tiff")):
        raise HTTPException(400, detail="Только TIFF")

    try:
        start_time = time.time()
        contents = await file.read()

        with MemoryFile(contents) as memfile:
            with memfile.open() as src:
                profile = src.profile.copy()
                bands = src.read().astype(np.float32)
                h, w = src.height, src.width

        # Доступные каналы
        available_bands = {}
        band_map = SATELLITE_BANDS.get("Sentinel-2", {})
        for name, idx in band_map.items():
            if idx <= bands.shape[0]:
                available_bands[name] = bands[idx - 1]

        print("Доступные каналы:", list(available_bands.keys()))

        # Расчёт индексов
        indices = {}
        for name, func in INDEX_FUNCTIONS.items():
            required = func.__code__.co_varnames[:func.__code__.co_argcount]
            if all(r in available_bands for r in required):
                try:
                    args = [available_bands[r] for r in required]
                    indices[name] = func(*args)
                    print(f"Успешно рассчитан {name}")
                except Exception as e:
                    print(f"Ошибка {name}: {e}")
            else:
                print(f"Пропущен {name} — нет каналов: {required}")

        if scenario not in RISK_SCENARIOS:
            raise HTTPException(400, detail=f"Сценарий '{scenario}' не поддерживается")

        weights = RISK_SCENARIOS[scenario]

        # Интегральный риск (сырой)
        risk_layers = []
        for name, weight in weights.items():
            if name in indices:
                data = indices[name]
                data = np.nan_to_num(data, nan=0.0)
                risk_layers.append(data * weight)

        if risk_layers:
            risk_raw = np.sum(risk_layers, axis=0) / len(risk_layers)
        else:
            risk_raw = np.zeros((h, w), dtype=np.float32)
            print("Внимание: ни один индекс не посчитан — карта нулевая")

        # Нормализация
        if normalization_type == "linear":
            risk_map = (risk_raw - risk_raw.min()) / (risk_raw.max() - risk_raw.min() + 1e-10) * 100
        elif normalization_type == "threshold":
            risk_map = np.zeros_like(risk_raw)
            risk_map[risk_raw <= safe_threshold] = 0
            risk_map[(risk_raw > safe_threshold) & (risk_raw < danger_threshold)] = 50
            risk_map[risk_raw >= danger_threshold] = 100
        elif normalization_type == "sigmoid":
            risk_map = 100 / (1 + np.exp(2 * (risk_raw - 0.5)))
        elif normalization_type == "log":
            risk_raw = np.clip(risk_raw, 0, 1)
            risk_map = 100 * np.log1p(risk_raw) / np.log1p(1)
        else:
            raise HTTPException(400, detail=f"Тип нормализации '{normalization_type}' не поддерживается")

        # Статистика — с пользовательскими порогами
        safe_percent = np.mean(risk_map <= safe_threshold * 100) * 100
        danger_percent = np.mean(risk_map >= danger_threshold * 100) * 100
        medium_percent = 100 - safe_percent - danger_percent

        # Даунсемплинг для превью
        if max(h, w) > downsample:
            scale = downsample / max(h, w)
            risk_small = zoom(risk_map, (scale, scale), order=1)
        else:
            risk_small = risk_map

        # Цветное PNG превью
        risk_img = Image.new("RGB", (risk_small.shape[1], risk_small.shape[0]))
        pixels = risk_img.load()

        for y in range(risk_small.shape[0]):
            for x in range(risk_small.shape[1]):
                val = risk_small[y, x]
                norm = val / 100.0
                if norm <= safe_threshold:
                    r = 0
                    g = int(255 * (norm / 0.3))
                    b = 0
                elif norm <= danger_threshold:
                    r = int(255 * ((norm - 0.3) / 0.4))
                    g = 160
                    b = 0
                else:
                    r = 255
                    g = int(255 * (1 - (norm - 0.7) / 0.3))
                    b = 0
                pixels[x, y] = (r, g, b)

        buf_png = BytesIO()
        risk_img.save(buf_png, format="PNG")

        # GeoTIFF риска
        profile.update(dtype=rasterio.float32, count=1, compress="lzw", nodata=None)
        buf_tif = BytesIO()
        with rasterio.open(buf_tif, "w", **profile) as dst:
            dst.write(risk_map.astype(np.float32), 1)
        tif_bytes = buf_tif.getvalue()

        # === СОХРАНЕНИЕ ===
        result_id = str(uuid.uuid4())
        out_dir = RESULTS_DIR / result_id
        out_dir.mkdir(exist_ok=True)

        # Сохраняем исходный файл для повторного использования
        (out_dir / "source.tif").write_bytes(contents)

        (out_dir / "result.tif").write_bytes(tif_bytes)
        (out_dir / "preview.png").write_bytes(buf_png.getvalue())

        # Отдельные индексы
        indices_dir = out_dir / "indices"
        indices_dir.mkdir(exist_ok=True)

        for name, arr in indices.items():
            profile_index = profile.copy()
            profile_index.update(dtype=rasterio.float32, count=1, compress="lzw", nodata=None)
            buf_index_tif = BytesIO()
            with rasterio.open(buf_index_tif, "w", **profile_index) as dst:
                dst.write(arr.astype(np.float32), 1)
            (indices_dir / f"{name}.tif").write_bytes(buf_index_tif.getvalue())

            norm = ((arr + 1) / 2 * 255).clip(0, 255).astype(np.uint8)
            pil = Image.fromarray(norm, mode="L")
            buf_png_index = BytesIO()
            pil.save(buf_png_index, format="PNG")
            (indices_dir / f"{name}.png").write_bytes(buf_png_index.getvalue())

        processing_time = time.time() - start_time

        # meta.json
        meta = {
            "id": result_id,
            "filename": file.filename,
            "scenario": scenario,
            "normalization_type": normalization_type,
            "safe_threshold": safe_threshold,
            "danger_threshold": danger_threshold,
            "calculated_indices": list(indices.keys()),
            "processing_time_seconds": round(processing_time, 3),
            "stats": {
                "safe_percent": safe_percent,
                "medium_percent": medium_percent,
                "danger_percent": danger_percent,
            },
            "message": f"Карта риска рассчитана за {processing_time:.2f} сек",
        }
        (out_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))

        return {
            "id": result_id,
            "safe_percent": safe_percent,
            "medium_percent": medium_percent,
            "danger_percent": danger_percent,
            "calculated_indices": list(indices.keys()),
            "processing_time_seconds": round(processing_time, 3),
            "message": meta["message"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Ошибка обработки файла: {str(e)}")