"""
RIX Main Agent - FastAPI Application
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.endpoints import auth, chat, n8n, health, intelligence
from app.api.webhooks import n8n_webhooks
from app.middleware.auth import JWTAuthMiddleware
from app.services.websocket_manager import WebSocketManager
from app.services.database import database

# Initialize logging
setup_logging()

# Initialize WebSocket manager
websocket_manager = WebSocketManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await database.connect()
    yield
    # Shutdown
    await database.disconnect()


# Create FastAPI application
app = FastAPI(
    title="RIX Main Agent",
    description="Intelligent middleware layer for RIX Personal Agent",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# Add custom JWT middleware
app.add_middleware(JWTAuthMiddleware)

# Include API routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(n8n.router, prefix="/n8n", tags=["n8n"])
app.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
app.include_router(n8n_webhooks.router, prefix="/webhooks", tags=["webhooks"])


@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat communication"""
    await websocket_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and handle ping/pong
            data = await websocket.receive_text()
            # Echo back for now - in production, this would handle real-time events
            await websocket_manager.send_personal_message(f"Echo: {data}", user_id)
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "RIX Main Agent is running",
        "version": "1.0.0",
        "status": "healthy"
    }