from fastapi import FastAPI
from app_aplication.api import router as api_router
from app_aplication.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

import uvicorn

app = FastAPI()

STORE_DIR = Path(__file__).resolve().parent / "data" / "results"

app.mount("/data/results", StaticFiles(directory=str(STORE_DIR)), name="results_static")

app.include_router(
    api_router,
    prefix=settings.api.prefix
)

origins = [
    "http://localhost:3000",
    "http://26.163.194.7:3000",
    "http://201.51.6.93:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



if __name__ == "__main__":
    uvicorn.run(
        "app_aplication.main:app",
        reload=True,
        host="0.0.0.0",
        port=8000
    )