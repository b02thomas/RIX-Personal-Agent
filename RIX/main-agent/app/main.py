"""
RIX Main Agent - FastAPI Application
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.endpoints import auth, chat, n8n, health, intelligence, tasks, calendar, routines, knowledge, goals, analytics
from app.api.webhooks import n8n_webhooks
from app.middleware.auth import JWTAuthMiddleware
from app.services.websocket_manager import WebSocketManager
from app.core.database import database
from app.services.mcp_router import mcp_router

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
    await mcp_router.close()


# Create FastAPI application
app = FastAPI(
    title="RIX Main Agent",
    description="Intelligent middleware layer for RIX Personal Agent with complete database integration",
    version="2.0.0",
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
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(n8n.router, prefix="/api/n8n", tags=["n8n"])
app.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
app.include_router(n8n_webhooks.router, prefix="/webhooks", tags=["webhooks"])

# Include new core API routers
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(routines.router, prefix="/api/routines", tags=["routines"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])


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
        "status": "healthy",
        "features": {
            "database_integration": True,
            "intelligence_services": True,
            "mcp_router": True,
            "sub_agents_ready": False,
            "supported_workflows": [
                "Task Intelligence Hub",
                "Calendar Intelligence Hub", 
                "Routine Intelligence Hub",
                "Knowledge Intelligence Hub",
                "Goal Intelligence Hub",
                "Behavioral Analytics Engine",
                "Daily Intelligence Hub"
            ]
        }
    }


@app.get("/mcp/health")
async def mcp_health():
    """MCP router health endpoint"""
    return await mcp_router.health_check()