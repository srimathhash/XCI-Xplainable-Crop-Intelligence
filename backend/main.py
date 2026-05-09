from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database.connection import connect_db, close_db
from routes import auth, predict, weather, fertilizer, chatbot


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="AgriSen API",
    description="Explainable AI Framework for Intelligent Crop Recommendation",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(weather.router, prefix="/weather")
app.include_router(fertilizer.router, prefix="/api", tags=["Fertilizer"])
app.include_router(chatbot.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": "AgriSen",
        "version": "1.0.0",
        "description": "Explainable AI Crop Recommendation API",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
    
# Trigger reload
