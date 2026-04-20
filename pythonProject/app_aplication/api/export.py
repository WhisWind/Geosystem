import base64
import numpy as np
import rasterio
from rasterio.io import MemoryFile
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Literal

router = APIRouter(prefix="/export", tags=["export"])

class RangeItem(BaseModel):
    name: str
    color: str  # "#RRGGBB" (для UI, серверу не важно)
    from_value: float
    to_value: float

class ExportRequest(BaseModel):
    width: int
    height: int
    values_base64: str          # float32 buffer
    crs: Optional[str] = None
    transform: Optional[List[float]] = None  # list(src.transform)
    nodata: Optional[float] = None
    ranges: List[RangeItem]
    mode: Literal["mask", "classes"] = "classes"
    mask_range_index: Optional[int] = None   # если mode="mask": какой диапазон считать водой

@router.post("/geotiff")
def export_geotiff(req: ExportRequest):
    try:
        raw = base64.b64decode(req.values_base64)
        arr = np.frombuffer(raw, dtype=np.float32).reshape((req.height, req.width))
    except Exception as e:
        raise HTTPException(400, detail=f"Bad raster payload: {e}")

    if not req.ranges:
        raise HTTPException(400, detail="ranges is empty")

    if req.mode == "mask":
        if req.mask_range_index is None or not (0 <= req.mask_range_index < len(req.ranges)):
            raise HTTPException(400, detail="mask_range_index is required for mode=mask")

        r = req.ranges[req.mask_range_index]
        mask = ((arr >= r.from_value) & (arr < r.to_value)).astype(np.uint8) * 255
        out = mask
        dtype = rasterio.uint8
        count = 1
    else:
        # classes: 0..N-1
        classes = np.zeros_like(arr, dtype=np.uint8)
        for i, r in enumerate(req.ranges):
            classes[(arr >= r.from_value) & (arr < r.to_value)] = i
        out = classes
        dtype = rasterio.uint8
        count = 1

    meta = {
        "driver": "GTiff",
        "width": req.width,
        "height": req.height,
        "count": count,
        "dtype": dtype,
        "compress": "lzw",
    }

    if req.crs:
        meta["crs"] = req.crs
    if req.transform and len(req.transform) in (6, 9):
        # rasterio Affine хранится как 6 (a,b,c,d,e,f) при list(Affine)
        from rasterio.transform import Affine
        if len(req.transform) == 6:
            meta["transform"] = Affine(*req.transform)
        else:
            # 9 — тоже можно
            meta["transform"] = Affine(*req.transform[:6])

    with MemoryFile() as mem:
        with mem.open(**meta) as dst:
            dst.write(out, 1)
        b = mem.read()

    return {
        "filename": "export.tif",
        "geotiff_base64": base64.b64encode(b).decode("utf-8"),
    }
