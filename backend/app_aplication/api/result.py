from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any, Dict, Optional, List

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/data/results", tags=["results"])

BASE_DIR = Path(__file__).resolve().parents[1]  # app_aplication/
STORE_DIR = BASE_DIR / "data" / "results"
STORE_DIR.mkdir(parents=True, exist_ok=True)

def _result_dir(result_id: str) -> Path:
    return STORE_DIR / result_id

def _meta_path(result_id: str) -> Path:
    return _result_dir(result_id) / "meta.json"

def _tiff_path(result_id: str) -> Path:
    return _result_dir(result_id) / "result.tif"

def _png_path(result_id: str) -> Path:
    return _result_dir(result_id) / "preview.png"


@router.get("")
def list_results(limit: int = 20) -> List[Dict[str, Any]]:
    # сортируем по времени создания (по meta.json mtime)
    items: List[Dict[str, Any]] = []
    dirs = [p for p in STORE_DIR.iterdir() if p.is_dir()]

    dirs.sort(key=lambda p: (_meta_path(p.name).stat().st_mtime if _meta_path(p.name).exists() else 0), reverse=True)

    for d in dirs[: max(1, min(limit, 200))]:
        mp = _meta_path(d.name)
        if not mp.exists():
            continue
        try:
            items.append(json.loads(mp.read_text(encoding="utf-8")))
        except Exception:
            continue

    return items


@router.get("/{result_id}")
def get_result(result_id: str) -> Dict[str, Any]:
    mp = _meta_path(result_id)
    if not mp.exists():
        raise HTTPException(status_code=404, detail="Result not found")
    return json.loads(mp.read_text(encoding="utf-8"))


@router.get("/{result_id}/file")
def download_tiff(result_id: str):
    fp = _tiff_path(result_id)
    if not fp.exists():
        raise HTTPException(status_code=404, detail="TIFF not found")
    return FileResponse(
        path=str(fp),
        media_type="image/tiff",
        filename=f"{result_id}.tif",
    )


@router.get("/{result_id}/preview.png")
def preview_png(result_id: str):
    fp = _png_path(result_id)
    if not fp.exists():
        raise HTTPException(status_code=404, detail="Preview not found")
    return FileResponse(path=str(fp), media_type="image/png")
