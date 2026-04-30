# API Integration Fixes - Summary

## Issues Fixed

### 1. **Stack API 404 Error**
**Problem**: Frontend was calling `/api/stack/bands` but getting 404 errors.

**Root Cause**: 
- Frontend was using hardcoded URLs (`http://localhost:8000/api/stack/bands`)
- No centralized API function for band stacking
- Import paths were incorrect

**Solution**:
- Created `stackBands()` function in `frontend/app/lib/api.ts`
- Updated `BandStackingModal.tsx` to use the API function instead of hardcoded fetch
- Fixed import paths from `@/app/lib/api` to relative paths (`../lib/api`)
- Added `API_URL_STACK` constant to centralize API URLs

### 2. **Index Calculation from Stacked Files**
**Problem**: No way to calculate indices from stacked files created by band stacking.

**Solution**:
- Created `/api/index/calculate-from-stacked` endpoint in `backend/app_aplication/api/index.py`
- Created `calculateFromStacked()` function in `frontend/app/lib/api.ts`
- Updated `AddSnapshotModal.tsx` to use centralized API functions

### 3. **Hardcoded API URLs**
**Problem**: Multiple components using hardcoded `http://localhost:8000` URLs.

**Solution**:
- Centralized all API calls in `frontend/app/lib/api.ts`
- Used `process.env.NEXT_PUBLIC_API_URL` for environment-based configuration
- Updated components to use API functions:
  - `BandStackingModal.tsx` - now uses `stackBands()`
  - `AddSnapshotModal.tsx` - now uses `calculateIndex()`

### 4. **TypeScript Type Errors**
**Problem**: Type casting error in `FileUpload.tsx` when creating synthetic event.

**Solution**:
- Changed type casting from `as ChangeEvent<HTMLInputElement>` to `as unknown as ChangeEvent<HTMLInputElement>`

## Files Modified

### Frontend
- `frontend/app/lib/api.ts` - Added `stackBands()` and `calculateFromStacked()` functions
- `frontend/app/components/BandStackingModal.tsx` - Updated to use API function
- `frontend/app/components/FileUpload.tsx` - Fixed TypeScript error
- `frontend/app/time-series/components/AddSnapshotModal.tsx` - Updated to use API functions

### Backend
- `backend/app_aplication/api/index.py` - Added `/calculate-from-stacked` endpoint
- `backend/app_aplication/api/__init__.py` - Stack router already registered (water router commented out due to torch dependency)

## API Endpoints Available

### Stack API
- `POST /api/stack/bands` - Combine multiple single-channel TIFF files into one multi-channel TIFF
  - Parameters: `files`, `band_names`, `satellite`
  - Returns: `{ id, file_path, preview_url, ... }`

- `GET /api/stack/bands/{result_id}` - Get info about stacked file

### Index API
- `POST /api/index/calculate` - Calculate index from single TIFF file
  - Parameters: `file`, `type_satellite`, `index`
  - Returns: `{ id, meta, raster, ... }`

- `POST /api/index/calculate-from-stacked` - Calculate index from stacked file
  - Parameters: `stacked_file_id`, `type_satellite`, `index`
  - Returns: `{ id, meta, statistics, ... }`

## Workflow

### Band Stacking Workflow
1. User uploads multiple single-channel TIFF files
2. Frontend calls `stackBands()` → `POST /api/stack/bands`
3. Backend combines channels and saves stacked file
4. Frontend downloads stacked file and passes to index calculation

### Index Calculation from Stacked File
1. User has stacked file from band stacking
2. Frontend calls `calculateFromStacked()` → `POST /api/index/calculate-from-stacked`
3. Backend reads stacked file, calculates index, saves result
4. Result is displayed in time series viewer

## Testing

Frontend build: ✅ Successful
Backend routes: ✅ All registered correctly
API functions: ✅ Exported and ready to use

## Notes

- Water segmentation endpoint is currently disabled (requires torch installation)
- All API URLs are configurable via `NEXT_PUBLIC_API_URL` environment variable
- Default API base: `http://127.0.0.1:8000`
