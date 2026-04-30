# Testing Guide - Band Stacking & Index Calculation

## Prerequisites

1. **Backend running**: `python app_aplication/main.py` (from backend directory)
2. **Frontend running**: `npm run dev` (from frontend directory)
3. **Test TIFF files**: You need single-channel TIFF files for testing

## Test Workflow 1: Band Stacking

### Steps
1. Open http://localhost:3000
2. Click "Объединить отдельные каналы" button
3. Select satellite type (Sentinel-2 or Landsat-8)
4. Upload 3+ single-channel TIFF files
5. System should auto-detect band names (B01, B02, etc.)
6. Reorder channels if needed (drag and drop)
7. Click "Объединить каналы"
8. Wait for processing
9. Stacked file should be downloaded and loaded

### Expected Result
- File is combined into multi-channel TIFF
- Preview image is generated
- File is ready for index calculation

## Test Workflow 2: Index Calculation from Stacked File

### Steps
1. Complete band stacking workflow above
2. Stacked file should be loaded in the main upload area
3. Select satellite type (should match stacking)
4. Select index type (NDVI, NDWI, etc.)
5. Click "Рассчитать индекс"
6. Wait for processing
7. Result should appear in history

### Expected Result
- Index is calculated from stacked file
- Result is saved with preview
- Statistics (min, max, mean) are displayed

## Test Workflow 3: Time Series with Band Stacking

### Steps
1. Go to "Временные ряды" section
2. Create new time series
3. Add snapshot
4. Choose "Отдельные каналы" option
5. Click "Объединить отдельные каналы"
6. Upload channels and stack them
7. Set date and add to series
8. View in time series viewer

### Expected Result
- Snapshot is added to time series
- Can view multiple snapshots with slider
- Statistics are displayed

## API Testing (curl/Postman)

### Test Stack API
```bash
curl -X POST http://localhost:8000/api/stack/bands \
  -F "files=@channel1.tif" \
  -F "files=@channel2.tif" \
  -F "files=@channel3.tif" \
  -F "band_names=B02" \
  -F "band_names=B03" \
  -F "band_names=B04" \
  -F "satellite=Sentinel-2"
```

### Test Index Calculation
```bash
curl -X POST http://localhost:8000/api/index/calculate \
  -F "file=@stacked.tif" \
  -F "type_satellite=Sentinel-2" \
  -F "index=NDVI"
```

### Test Index from Stacked
```bash
curl -X POST http://localhost:8000/api/index/calculate-from-stacked \
  -F "stacked_file_id=<result_id_from_stack>" \
  -F "type_satellite=Sentinel-2" \
  -F "index=NDVI"
```

## Troubleshooting

### 404 Error on Stack API
- Check backend is running on port 8000
- Verify `NEXT_PUBLIC_API_URL` environment variable (if set)
- Check browser console for actual URL being called

### Files Not Detected
- Ensure file names contain band identifiers (B01, B02, etc.)
- Check satellite type matches file naming convention
- Try manual band selection

### Index Calculation Fails
- Verify stacked file has required channels for index
- Check satellite type matches stacked file
- Review backend logs for detailed error

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Rebuild: `npm run build`

## Performance Notes

- Band stacking: ~1-5 seconds for 3-4 channels
- Index calculation: ~2-10 seconds depending on file size
- Large files (>500MB) may take longer
- Results are cached in `/data/results/` directory

## File Size Limits

- Single file: No hard limit (depends on server memory)
- Total upload: Limited by server configuration
- Recommended: Keep files under 100MB each

## Supported Formats

- Input: Single-channel TIFF (.tif, .tiff)
- Output: Multi-channel TIFF (.tif)
- Preview: PNG (.png)
- Metadata: JSON (.json)
