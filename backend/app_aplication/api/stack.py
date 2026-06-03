"""
API для объединения спектральных каналов в многоканальный TIFF
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
import rasterio
import numpy as np
import uuid
import os
from pathlib import Path
import tempfile
import re

router = APIRouter(prefix="/stack", tags=["stack"])

# Директория для сохранения результатов
BASE_DIR = Path(__file__).resolve().parent.parent  # app_aplication/
RESULTS_DIR = BASE_DIR / "data" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def get_channel_sort_key(filename: str, satellite: str) -> tuple:
    """
    Определяет порядок сортировки каналов по названию файла
    """
    upper = filename.upper()
    
    if satellite == "Sentinel-2":
        # Ищем B01-B12 или B8A
        match = re.search(r"B(\d{2}|8A)", upper)
        if match:
            ch = match.group(1)
            if ch == "8A":
                return (8, 5)  # B8A идёт после B08
            else:
                return (int(ch), 0)
        return (999, 0)
    
    elif satellite == "Landsat-8":
        # Ищем B1-B7
        match = re.search(r"_B(\d)[\._]", upper)
        if match:
            return (int(match.group(1)), 0)
        return (999, 0)
    
    return (999, 0)


@router.post("/bands")
async def stack_bands(
    files: List[UploadFile] = File(...),
    band_names: List[str] = Form(...),
    satellite: str = Form(...)
):
    """
    Объединяет несколько одноканальных TIFF файлов в один многоканальный TIFF
    
    Args:
        files: Список загруженных TIFF файлов
        band_names: Список названий каналов (B01, B02, и т.д.)
        satellite: Название спутника (Sentinel-2, Landsat-8)
    
    Returns:
        JSON с информацией о созданном файле
    """
    
    # Валидация
    if len(files) != len(band_names):
        raise HTTPException(400, "Количество файлов и названий каналов не совпадает")
    
    if len(files) < 3:
        raise HTTPException(400, "Минимум 3 канала требуется")
    
    if len(files) > 12:
        raise HTTPException(400, "Максимум 12 каналов")
    
    # Создаём уникальный ID для результата
    result_id = str(uuid.uuid4())
    result_dir = RESULTS_DIR / result_id
    result_dir.mkdir(parents=True, exist_ok=True)
    
    temp_files = []
    
    try:
        # Сохраняем загруженные файлы временно
        file_data = []
        for file, band_name in zip(files, band_names):
            if not (file.filename.endswith('.tif') or file.filename.endswith('.tiff')):
                raise HTTPException(400, f"Неподдерживаемый формат: {file.filename}")
            
            # Сохраняем во временный файл
            temp_path = result_dir / f"temp_{band_name}.tif"
            content = await file.read()
            with open(temp_path, 'wb') as f:
                f.write(content)
            
            temp_files.append(temp_path)
            file_data.append({
                'path': temp_path,
                'band_name': band_name,
                'filename': file.filename
            })
        
        # Сортируем файлы по band_name (в правильном порядке для Sentinel-2 или Landsat-8)
        def get_band_order(band_name: str, satellite: str) -> int:
            """Возвращает порядковый номер канала для сортировки"""
            if satellite == "Sentinel-2":
                order = {
                    "B01": 1, "B02": 2, "B03": 3, "B04": 4,
                    "B05": 5, "B06": 6, "B07": 7, "B08": 8,
                    "B8A": 9, "B09": 10, "B11": 11, "B12": 12
                }
                return order.get(band_name, 999)
            elif satellite == "Landsat-8":
                order = {
                    "B1": 1, "B2": 2, "B3": 3, "B4": 4,
                    "B5": 5, "B6": 6, "B7": 7
                }
                return order.get(band_name, 999)
            return 999
        
        file_data_sorted = sorted(
            file_data,
            key=lambda x: get_band_order(x['band_name'], satellite)
        )
        
        # Открываем первый файл для получения метаданных
        with rasterio.open(file_data_sorted[0]['path']) as src0:
            meta = src0.meta.copy()
            height, width = src0.shape
            dtype = src0.dtypes[0]
        
        # Загружаем все каналы в массив
        images = []
        for file_info in file_data_sorted:
            with rasterio.open(file_info['path']) as src:
                band_data = src.read(1)
                images.append(band_data)
        
        # Объединяем в один массив
        stacked = np.stack(images, axis=0)
        
        # Обновляем метаданные
        meta.update({
            "driver": "GTiff",
            "count": len(images),
            "dtype": dtype,
            "nodata": 0,
            "compress": "lzw",
            "tiled": True,
            "blockxsize": 256,
            "blockysize": 256
        })
        
        # Сохраняем результат
        output_path = result_dir / "stacked.tif"
        with rasterio.open(output_path, 'w', **meta) as dst:
            dst.write(stacked)
        
        # Проверяем, что файл корректно записан
        try:
            with rasterio.open(output_path, 'r') as check:
                if check.count != len(images):
                    raise ValueError(f"Ошибка записи: ожидалось {len(images)} каналов, найдено {check.count}")
        except Exception as e:
            raise HTTPException(500, f"Ошибка проверки записанного файла: {str(e)}")
        
        # Создаём превью (RGB из первых трёх каналов)
        preview_path = result_dir / "preview.png"
        try:
            from PIL import Image
            
            # Берём первые 3 канала для RGB
            rgb_data = stacked[:3] if len(images) >= 3 else stacked
            
            # Нормализуем для отображения
            rgb_normalized = []
            for band in rgb_data:
                band_min = np.percentile(band, 2)
                band_max = np.percentile(band, 98)
                normalized = ((band - band_min) / (band_max - band_min) * 255).astype(np.uint8)
                rgb_normalized.append(normalized)
            
            # Создаём RGB изображение
            rgb_array = np.stack(rgb_normalized, axis=2)
            img = Image.fromarray(rgb_array, 'RGB')
            img.save(preview_path)
        except Exception as e:
            print(f"Ошибка при создании превью: {e}")
        
        # Удаляем временные файлы
        for temp_file in temp_files:
            try:
                temp_file.unlink()
            except:
                pass
        
        return {
            "id": result_id,
            "message": "Каналы успешно объединены",
            "bands": [f['band_name'] for f in file_data_sorted],
            "band_count": len(images),
            "shape": {
                "height": height,
                "width": width,
                "channels": len(images)
            },
            "file_path": f"/data/results/{result_id}/stacked.tif",
            "preview_url": f"/data/results/{result_id}/preview.png"
        }
    
    except Exception as e:
        # Очищаем директорию при ошибке
        try:
            import shutil
            shutil.rmtree(result_dir)
        except:
            pass
        
        raise HTTPException(500, f"Ошибка при объединении каналов: {str(e)}")


@router.get("/bands/{result_id}")
async def get_stacked_file(result_id: str):
    """
    Получает информацию о объединённом файле
    """
    result_dir = RESULTS_DIR / result_id
    stacked_path = result_dir / "stacked.tif"
    
    if not stacked_path.exists():
        raise HTTPException(404, "Файл не найден")
    
    try:
        with rasterio.open(stacked_path) as src:
            return {
                "id": result_id,
                "shape": {
                    "height": src.height,
                    "width": src.width,
                    "channels": src.count
                },
                "dtype": src.dtypes[0],
                "crs": str(src.crs) if src.crs else None,
                "bounds": src.bounds._asdict() if src.bounds else None,
                "file_path": f"/data/results/{result_id}/stacked.tif",
                "preview_url": f"/data/results/{result_id}/preview.png"
            }
    except Exception as e:
        raise HTTPException(500, f"Ошибка при чтении файла: {str(e)}")
