import rasterio
import numpy as np
import base64
import logging
import json
import uuid

from pathlib import Path
from PIL import Image
from rasterio.io import MemoryFile
from app_aplication.index_calculator import IndexCalculator
from fastapi import File, UploadFile, HTTPException, Form, APIRouter

BASE_DIR = Path(__file__).resolve().parents[1]  # app_aplication/
RESULTS_DIR = BASE_DIR / "data" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(
    prefix="/index",
    tags=["water"]
)


# Словарь с возможными спутниками и их каналами
satellite_bands = {
    "Sentinel-2": [
        "Blue",            # Blue (B2)
        "Green",           # Green (B3)
        "Red",             # Red (B4)
        "Red-Edge",        # Red-Edge (B5)
        "NIR",             # NIR (B8)
        "Narrow NIR",     # Narrow NIR (B8A)
        "SWIR",          # SWIR (B11)
        "SWIR2",          # SWIR2 (B12)
        "Water Vapour",    # Water Vapour (B9)
        "Cirrus",         # Cirrus (B10)
        "SWIR3"            # SWIR3 (B6)
    ],
    "Landsat-8": [
        "Blue",            # Blue (B2)
        "Green",           # Green (B3)
        "Red",             # Red (B4)
        "NIR",             # NIR (B5)
        "SWIR1",           # SWIR1 (B6)
        "SWIR2",           # SWIR2 (B7)
        "Panchromatic",    # Panchromatic (B8)
        "Cirrus",          # Cirrus (B9)
        "Thermal",        # Thermal (B10)
        "SWIR3"           # SWIR3 (B11)
    ],
    "Канопус-В": [
        "Red",            # Red (Red)
        "Green",        # Green (Green)
        "Blue",          # Blue (Blue)
        "NIR"             # NIR (NIR)
    ],
    "Метеор-М": [
        "Red",            # Red (Red)
        "Green",        # Green (Green)
        "Blue",          # Blue (Blue)
        "NIR"             # NIR (NIR)
    ],
    "Ресурс-П": [
        "Red",            # Red (Red)
        "Green",        # Green (Green)
        "Blue",          # Blue (Blue)
        "NIR",            # NIR (NIR)
        "Red-Edge",  # Red-Edge (Red-Edge)
        "SWIR"           # SWIR (SWIR)
    ]
}

# Словарь, который хранит необходимые каналы для расчёта каждого индекса
index_channels = {
    "NDVI": ["Red", "NIR"],      # Для NDVI нужны каналы Red и NIR
    "NDWI": ["Green", "NIR"],    # Для NDWI нужны каналы Green и NIR
    "EVI": ["Blue", "Red", "NIR"],  # Для EVI нужны Blue, Red и NIR
    "NBR": ["Red", "NIR", "SWIR"],  # Для NBR нужны Red, NIR и SWIR
    "GNDVI": ["Green", "NIR"],   # Для GNDVI нужны Green и NIR
    "GEMI": ["Red", "NIR"],      # Для GEMI нужны Red и NIR
}

def downsample_array(arr: np.ndarray, max_side: int = 1024) -> np.ndarray:
    h, w = arr.shape
    scale = max(h, w) / max_side
    if scale <= 1:
        return arr.astype(np.float32)

    new_h = int(h / scale)
    new_w = int(w / scale)

    # ресемпл как изображение: через rasterio.warp.reproject проще, но можно так:
    # используем rasterio.read с out_shape? тут arr уже в памяти.
    # сделаем простую билинейную через cv2 нельзя (нет), значит через torch? нет.
    # самый простой и приемлемый для MVP: stride sampling
    ys = np.linspace(0, h - 1, new_h).astype(np.int32)
    xs = np.linspace(0, w - 1, new_w).astype(np.int32)
    return arr[np.ix_(ys, xs)].astype(np.float32)

@router.post("/calculate")
async def segment(
        file: UploadFile = File(...),
        type_satellite: str = Form("Sentinel-2"),
        index: str = Form("NBR")
):
    if not file.filename.lower().endswith(('.tif', '.tiff')):
        raise HTTPException(status_code=400, detail="Поддерживаются только TIFF файлы")

    # Проверка спутника и индекса (как у тебя уже есть)
    if type_satellite not in satellite_bands:
        raise HTTPException(status_code=400, detail=f"Спутник {type_satellite} не поддерживается")
    if index not in index_channels:
        raise HTTPException(status_code=400, detail=f"Индекс {index} не поддерживается")

    required_bands = index_channels[index]
    available_bands = satellite_bands[type_satellite]
    missing_bands = [b for b in required_bands if b not in available_bands]
    if missing_bands:
        raise HTTPException(status_code=400, detail=f"Отсутствуют каналы: {missing_bands}")

    try:
        contents = await file.read()

        with MemoryFile(contents) as memfile:
            with memfile.open() as src:
                meta = src.meta.copy()
                num_bands = src.count  # реальное количество каналов

                print(f"Файл имеет {num_bands} каналов")

                # Читаем ВСЕ каналы сразу — это самый надёжный способ
                all_bands = src.read()  # shape: (C, H, W), C = num_bands

                selected_bands = {}
                for band_name in required_bands:
                    if band_name not in available_bands:
                        raise HTTPException(400, detail=f"Канал {band_name} отсутствует для {type_satellite}")

                    band_idx = available_bands.index(band_name)  # индекс с 0!
                    if band_idx >= num_bands:
                        raise HTTPException(400,
                                            detail=f"Канал {band_name} (индекс {band_idx + 1}) отсутствует — всего каналов {num_bands}")

                    band_data = all_bands[band_idx].astype(np.float32)
                    if src.nodata is not None:
                        band_data[band_data == src.nodata] = np.nan
                    selected_bands[band_name] = band_data

                # Расчёт индекса — без изменений
                match index:
                    case "NDVI":
                        result = IndexCalculator.compute_ndvi(selected_bands["Red"], selected_bands["NIR"])
                    case "NDWI":
                        result = IndexCalculator.compute_ndwi(selected_bands["Green"], selected_bands["NIR"])
                    case "EVI":
                        result = IndexCalculator.compute_evi(selected_bands["Blue"], selected_bands["Red"],
                                                             selected_bands["NIR"])
                    case "NBR":
                        swir = selected_bands.get("SWIR")
                        if swir is None:
                            raise HTTPException(400, detail="Для NBR нужен канал SWIR/SWIR1/SWIR2")
                        result = IndexCalculator.compute_nbr(selected_bands["Red"], selected_bands["NIR"], swir)
                    case "GNDVI":
                        result = IndexCalculator.compute_gndvi(selected_bands["Green"], selected_bands["NIR"])
                    case "GEMI":
                        result = IndexCalculator.compute_gemi(selected_bands["Red"], selected_bands["NIR"])
                    case _:
                        raise HTTPException(400, detail="Неизвестный индекс")

                # Нормализация в 0–255 для grayscale TIFF
                result_clean = np.nan_to_num(result, nan=0.0, posinf=1.0, neginf=-1.0)
                result_normalized = ((result_clean + 1) / 2 * 255).clip(0, 255).astype(np.uint8)

                # Статистика по реальным значениям
                stats = {
                    "min": float(np.nanmin(result)),
                    "max": float(np.nanmax(result)),
                    "mean": float(np.nanmean(result))
                }

                # Запись в MemoryFile
                meta.update({
                    "driver": "GTiff",
                    "count": 1,
                    "dtype": rasterio.uint8
                })

                with MemoryFile() as out_memfile:
                    with out_memfile.open(**meta) as dst:
                        dst.write(result_normalized, 1)
                    tiff_bytes = out_memfile.read()

                result_float = result.astype(np.float32)
                result_float = np.nan_to_num(result_float, nan=np.float32(0.0), posinf=np.float32(1.0),
                                             neginf=np.float32(-1.0))

                ui_arr = downsample_array(result_float, max_side=1024)
                h_ui, w_ui = ui_arr.shape

                values_b64 = base64.b64encode(ui_arr.tobytes()).decode("utf-8")

                result_id = str(uuid.uuid4())
                out_dir = RESULTS_DIR / result_id
                out_dir.mkdir(parents=True, exist_ok=True)

                # 1) сохранить tiff результата
                (out_dir / "result.tif").write_bytes(tiff_bytes)
                Image.fromarray(result_normalized).save(out_dir / "preview.png", format="PNG", optimize=True)

                # 2) сохранить метаданные (без base64!)
                meta = {
                    "id": result_id,
                    "kind": "index",
                    "filename": file.filename,
                    "satellite": type_satellite,
                    "index": index,
                    "stats": stats,
                    "message": f"Индекс {index} успешно рассчитан",
                }
                (out_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")

                return {
                    "id": result_id,
                    "meta": meta,
                    "raster": {
                        "width": w_ui,
                        "height": h_ui,
                        "dtype": "float32",
                        "values_base64": values_b64,
                        "min": float(np.nanmin(ui_arr)),
                        "max": float(np.nanmax(ui_arr)),
                        "mean": float(np.nanmean(ui_arr)),
                        "nodata": src.nodata,
                        "crs": str(src.crs) if src.crs else None,
                        "transform": list(src.transform),
                    },
                    "message": meta["message"]
                }

    except Exception as e:
        logging.error(f"Ошибка обработки: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка обработки: {str(e)}")