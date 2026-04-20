from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import numpy as np
import torch

from PIL import Image
import rasterio
from rasterio.io import MemoryFile
from app_aplication.api.unet import UNet
from pathlib import Path
import uuid
import json

router = APIRouter(prefix="/water", tags=["water"])

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

BASE_DIR = Path(__file__).resolve().parent.parent  # app_aplication/
RESULTS_DIR = BASE_DIR / "data" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATHS = {
    "awei": str(BASE_DIR / "data" / "models" / "awei.pth"),
    "ndwi": str(BASE_DIR / "data" / "models" / "ndwi.pth"),
    "mndwi": str(BASE_DIR / "data" / "models" / "mndwi.pth"),
}

_loaded: dict[str, UNet] = {}

def get_model(model_key: str) -> UNet:
    if model_key not in MODEL_PATHS:
        raise HTTPException(400, detail=f"Неизвестная модель: {model_key}")

    if model_key in _loaded:
        return _loaded[model_key]

    model = UNet(n_classes=1, n_channels=12).to(DEVICE)
    state = torch.load(MODEL_PATHS[model_key], map_location=DEVICE)
    model.load_state_dict(state)
    model.eval()

    _loaded[model_key] = model
    return model

@router.post("/calculate")
async def segment_water(
    file: UploadFile = File(...),
    model_key: str = Form("awei"),
    threshold: float = Form(0.5),
):
    if not file.filename.lower().endswith((".tif", ".tiff")):
        raise HTTPException(400, detail="Поддерживаются только TIFF/GeoTIFF")

    try:
        contents = await file.read()

        # Читаем из памяти
        with MemoryFile(contents) as memfile:
            with memfile.open() as src:
                img = src.read().astype(np.float32)  # (C,H,W)
                profile = src.profile.copy()

        if img.shape[0] != 12:
            raise HTTPException(400, detail=f"Ожидается 12 каналов, получено: {img.shape[0]}. Модель требует Sentinel-2 с 12 каналами.")

        model = get_model(model_key)

        # (1,C,H,W)
        x = torch.tensor(img[np.newaxis, :, :, :], dtype=torch.float32, device=DEVICE)

        with torch.no_grad():
            logits = model(x)
            prob = torch.sigmoid(logits).squeeze(0).squeeze(0)  # (H,W)
            mask = (prob > threshold).to(torch.uint8) * 255

        mask_np = mask.cpu().numpy()

        # Статистика
        water_pixels = int((mask_np > 0).sum())
        total_pixels = int(mask_np.size)
        water_ratio = float(water_pixels / max(1, total_pixels))

        # === СОХРАНЕНИЕ НА ДИСК ===
        result_id = str(uuid.uuid4())
        out_dir = RESULTS_DIR / result_id
        out_dir.mkdir(parents=True, exist_ok=True)

        # Сохраняем маску как GeoTIFF (с геопривязкой)
        profile.update(dtype=rasterio.uint8, count=1, compress="lzw")
        with rasterio.open(out_dir / "result.tif", "w", **profile) as dst:
            dst.write(mask_np, 1)

        # Сохраняем PNG-превью
        pil = Image.fromarray(mask_np, mode="L")
        pil.save(out_dir / "preview.png")

        # meta.json
        meta = {
            "id": result_id,
            "filename": file.filename,
            "model": model_key,
            "threshold": threshold,
            "stats": {
                "water_pixels": water_pixels,
                "water_ratio": water_ratio,
            },
            "message": "Сегментация воды выполнена и сохранена",
        }
        (out_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))

        # Возвращаем только ID и лёгкую мета
        return {
            "id": result_id,
            "filename": file.filename,
            "model": model_key,
            "threshold": threshold,
            "stats": meta["stats"],
            "message": meta["message"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Ошибка обработки файла: {str(e)}")