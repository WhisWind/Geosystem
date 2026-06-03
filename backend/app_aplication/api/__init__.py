from fastapi import APIRouter
from .index import router as index_router
from .water import router as water_router
from .export import router as export_router
from .risk import router as assess_risk
from .stack import router as stack_router

router = APIRouter()
router.include_router(index_router)
router.include_router(water_router)
#router.include_router(export_router)
router.include_router(assess_risk)
router.include_router(stack_router)