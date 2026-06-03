import rasterio
import numpy as np
import base64
import logging
import json
import uuid
import time

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


# Словарь с возможными спутниками и их каналами (номера каналов начинаются с 1)
satellite_bands = {
    "Sentinel-2": {
        "Blue": 2,           # B2 - Blue (490 nm)
        "Green": 3,          # B3 - Green (560 nm)
        "Red": 4,            # B4 - Red (665 nm)
        "Red-Edge": 5,       # B5 - Red-Edge (705 nm)
        "NIR": 8,            # B8 - NIR (842 nm)
        "Narrow NIR": 9,     # B8A - Narrow NIR (865 nm)
        "SWIR": 11,          # B11 - SWIR (1610 nm)
        "SWIR2": 12,         # B12 - SWIR2 (2190 nm)
        "Water Vapour": 9,   # B9 - Water Vapour (945 nm)
        "Cirrus": 10,        # B10 - Cirrus (1375 nm)
        "SWIR3": 6,          # B6 - SWIR3 (740 nm)
    },
    "Landsat-8": {
        "Blue": 2,           # B2 - Blue (482 nm)
        "Green": 3,          # B3 - Green (562 nm)
        "Red": 4,            # B4 - Red (655 nm)
        "NIR": 5,            # B5 - NIR (865 nm)
        "SWIR1": 6,          # B6 - SWIR1 (1610 nm)
        "SWIR2": 7,          # B7 - SWIR2 (2200 nm)
        "Panchromatic": 8,   # B8 - Panchromatic (590 nm)
        "Cirrus": 9,         # B9 - Cirrus (1375 nm)
        "Thermal": 10,       # B10 - Thermal (1090 nm)
        "SWIR3": 11,         # B11 - SWIR3 (1200 nm)
    },
    "Канопус-В": {
        "Red": 1,            # Red
        "Green": 2,          # Green
        "Blue": 3,           # Blue
        "NIR": 4,            # NIR
    },
    "Метеор-М": {
        "Red": 1,            # Red
        "Green": 2,          # Green
        "Blue": 3,           # Blue
        "NIR": 4,            # NIR
    },
    "Ресурс-П": {
        "Red": 1,            # Red
        "Green": 2,          # Green
        "Blue": 3,           # Blue
        "NIR": 4,            # NIR
        "Red-Edge": 5,       # Red-Edge
        "SWIR": 6,           # SWIR
    }
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
    band_mapping = satellite_bands[type_satellite]
    available_band_names = list(band_mapping.keys())
    
    missing_bands = [b for b in required_bands if b not in band_mapping]
    if missing_bands:
        raise HTTPException(status_code=400, detail=f"Отсутствуют каналы: {missing_bands}")

    try:
        start_time = time.time()
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
                    if band_name not in band_mapping:
                        raise HTTPException(400, detail=f"Канал {band_name} отсутствует для {type_satellite}")

                    # Получаем номер канала спутника (начинается с 1)
                    band_number = band_mapping[band_name]
                    # Преобразуем в индекс массива (начинается с 0)
                    band_idx = band_number - 1
                    
                    if band_idx >= num_bands:
                        raise HTTPException(400,
                                            detail=f"Канал {band_name} (B{band_number}) отсутствует — всего каналов {num_bands}")

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

                processing_time = time.time() - start_time

                # Нормализация в 0–255 для grayscale TIFF
                result_clean = np.nan_to_num(result, nan=0.0, posinf=1.0, neginf=-1.0)
                result_normalized = ((result_clean + 1) / 2 * 255).clip(0, 255).astype(np.uint8)

                # Статистика по реальным значениям
                stats = {
                    "min": float(np.nanmin(result)),
                    "max": float(np.nanmax(result)),
                    "mean": float(np.nanmean(result))
                }
                
                # Время расчёта (будет вычислено выше)
                processing_time = getattr(src, '_processing_time', 0.0)

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

                # Сохраняем исходный файл для повторного использования
                (out_dir / "source.tif").write_bytes(contents)

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
                    "processing_time_seconds": round(processing_time, 3),
                    "message": f"Индекс {index} успешно рассчитан за {processing_time:.2f} сек",
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



@router.post("/calculate-from-stacked")
async def calculate_from_stacked(
        stacked_file_id: str = Form(...),
        type_satellite: str = Form("Sentinel-2"),
        index: str = Form("NDVI")
):
    """
    Расчёт индекса из уже объединённого многоканального файла
    
    Args:
        stacked_file_id: ID объединённого файла (из /api/stack/bands)
        type_satellite: Название спутника
        index: Название индекса
    """
    
    # Проверка параметров
    if type_satellite not in satellite_bands:
        raise HTTPException(status_code=400, detail=f"Спутник {type_satellite} не поддерживается")
    if index not in index_channels:
        raise HTTPException(status_code=400, detail=f"Индекс {index} не поддерживается")
    
    required_bands = index_channels[index]
    band_mapping = satellite_bands[type_satellite]
    
    missing_bands = [b for b in required_bands if b not in band_mapping]
    if missing_bands:
        raise HTTPException(status_code=400, detail=f"Отсутствуют каналы: {missing_bands}")
    
    try:
        start_time = time.time()
        
        # Открываем объединённый файл
        stacked_path = RESULTS_DIR / stacked_file_id / "stacked.tif"
        if not stacked_path.exists():
            raise HTTPException(404, detail="Объединённый файл не найден")
        
        with rasterio.open(stacked_path) as src:
            meta = src.meta.copy()
            num_bands = src.count
            
            # Читаем все каналы
            all_bands = src.read()  # shape: (C, H, W)
            
            selected_bands = {}
            for band_name in required_bands:
                # Получаем номер канала спутника (начинается с 1)
                band_number = band_mapping[band_name]
                # Преобразуем в индекс массива (начинается с 0)
                band_idx = band_number - 1
                
                if band_idx >= num_bands:
                    raise HTTPException(400, 
                        detail=f"Канал {band_name} (B{band_number}) отсутствует — всего каналов {num_bands}")
                
                band_data = all_bands[band_idx].astype(np.float32)
                if src.nodata is not None:
                    band_data[band_data == src.nodata] = np.nan
                selected_bands[band_name] = band_data
            
            # Расчёт индекса
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
                        raise HTTPException(400, detail="Для NBR нужен канал SWIR")
                    result = IndexCalculator.compute_nbr(selected_bands["Red"], selected_bands["NIR"], swir)
                case "GNDVI":
                    result = IndexCalculator.compute_gndvi(selected_bands["Green"], selected_bands["NIR"])
                case "GEMI":
                    result = IndexCalculator.compute_gemi(selected_bands["Red"], selected_bands["NIR"])
                case _:
                    raise HTTPException(400, detail="Неизвестный индекс")
            
            processing_time = time.time() - start_time
            
            # Расчёт индекса
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
                        raise HTTPException(400, detail="Для NBR нужен канал SWIR")
                    result = IndexCalculator.compute_nbr(selected_bands["Red"], selected_bands["NIR"], swir)
                case "GNDVI":
                    result = IndexCalculator.compute_gndvi(selected_bands["Green"], selected_bands["NIR"])
                case "GEMI":
                    result = IndexCalculator.compute_gemi(selected_bands["Red"], selected_bands["NIR"])
                case _:
                    raise HTTPException(400, detail="Неизвестный индекс")
            
            # Нормализация
            result_clean = np.nan_to_num(result, nan=0.0, posinf=1.0, neginf=-1.0)
            result_normalized = ((result_clean + 1) / 2 * 255).clip(0, 255).astype(np.uint8)
            
            # Статистика
            stats = {
                "min": float(np.nanmin(result)),
                "max": float(np.nanmax(result)),
                "mean": float(np.nanmean(result))
            }
            
            # Сохранение результата
            result_id = str(uuid.uuid4())
            out_dir = RESULTS_DIR / result_id
            out_dir.mkdir(parents=True, exist_ok=True)
            
            # Копируем исходный stacked файл для повторного использования
            import shutil
            shutil.copy(stacked_path, out_dir / "source.tif")
            
            # Сохраняем TIFF
            meta.update({
                "driver": "GTiff",
                "count": 1,
                "dtype": rasterio.uint8
            })
            
            with rasterio.open(out_dir / "result.tif", 'w', **meta) as dst:
                dst.write(result_normalized, 1)
            
            # Сохраняем превью
            Image.fromarray(result_normalized).save(out_dir / "preview.png", format="PNG", optimize=True)
            
            # Сохраняем метаданные
            meta_data = {
                "id": result_id,
                "kind": "index",
                "satellite": type_satellite,
                "index": index,
                "stats": stats,
                "processing_time_seconds": round(processing_time, 3),
                "message": f"Индекс {index} успешно рассчитан за {processing_time:.2f} сек",
            }
            (out_dir / "meta.json").write_text(json.dumps(meta_data, ensure_ascii=False), encoding="utf-8")
            
            return {
                "id": result_id,
                "meta": meta_data,
                "statistics": stats,
                "preview_url": f"/data/results/{result_id}/preview.png",
                "tiff_url": f"/data/results/{result_id}/result.tif",
                "message": meta_data["message"]
            }
    
    except Exception as e:
        logging.error(f"Ошибка расчёта индекса: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка расчёта: {str(e)}")
