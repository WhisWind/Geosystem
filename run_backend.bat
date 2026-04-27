@echo off
echo Starting backend with auto-reload...
cd backend
call .venv\Scripts\activate
python -m uvicorn app_aplication.main:app --reload --host 127.0.0.1 --port 8000
pause
