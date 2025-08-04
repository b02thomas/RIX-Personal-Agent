"""
Health check endpoints for RIX Main Agent
"""

import time
from fastapi import APIRouter, Depends
from datetime import datetime

from app.core.config import settings
from app.core.logging import get_logger
from app.models.health import HealthCheckResponse, ServiceStatus, ServiceCheck, SystemMetrics
from app.core.database import database
from app.services.n8n_client import n8n_client

logger = get_logger(__name__)
router = APIRouter()

# Track service start time
SERVICE_START_TIME = time.time()


@router.get("/", response_model=HealthCheckResponse)
async def health_check():
    """Main health check endpoint"""
    logger.info("Health check requested")
    
    start_time = time.time()
    uptime = time.time() - SERVICE_START_TIME
    
    # Initialize checks
    checks = {}
    overall_status = ServiceStatus.HEALTHY
    
    # Database health check
    try:
        db_health = await database.health_check()
        if db_health["status"] == "healthy":
            checks["database"] = ServiceCheck(
                status=ServiceStatus.HEALTHY,
                response_time=db_health["response_time"],
                message="Database connection is healthy",
                details=db_health.get("pool_stats", {})
            )
        else:
            checks["database"] = ServiceCheck(
                status=ServiceStatus.UNHEALTHY,
                message=f"Database error: {db_health.get('error', 'Unknown error')}"
            )
            overall_status = ServiceStatus.UNHEALTHY
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        checks["database"] = ServiceCheck(
            status=ServiceStatus.UNHEALTHY,
            message=f"Database check failed: {str(e)}"
        )
        overall_status = ServiceStatus.UNHEALTHY
    
    # N8N service health check
    try:
        n8n_status = await n8n_client.get_workflow_status()
        if n8n_status.available:
            checks["n8n"] = ServiceCheck(
                status=ServiceStatus.HEALTHY,
                response_time=n8n_status.response_time,
                message="N8N service is available",
                details={
                    "active_workflows": n8n_status.active_workflows,
                    "recent_executions": n8n_status.recent_executions
                }
            )
        else:
            checks["n8n"] = ServiceCheck(
                status=ServiceStatus.DEGRADED,
                message="N8N service is not available"
            )
            if overall_status == ServiceStatus.HEALTHY:
                overall_status = ServiceStatus.DEGRADED
    except Exception as e:
        logger.error("N8N health check failed", error=str(e))
        checks["n8n"] = ServiceCheck(
            status=ServiceStatus.UNHEALTHY,
            message=f"N8N check failed: {str(e)}"
        )
        if overall_status == ServiceStatus.HEALTHY:
            overall_status = ServiceStatus.DEGRADED
    
    # System metrics (basic)
    try:
        import psutil
        system_metrics = SystemMetrics(
            cpu_usage=psutil.cpu_percent(),
            memory_usage=psutil.virtual_memory().percent,
            disk_usage=psutil.disk_usage('/').percent
        )
        checks["system"] = ServiceCheck(
            status=ServiceStatus.HEALTHY,
            message="System metrics collected",
            details=system_metrics.dict()
        )
    except ImportError:
        # psutil not available, skip system metrics
        checks["system"] = ServiceCheck(
            status=ServiceStatus.UNKNOWN,
            message="System metrics not available (psutil not installed)"
        )
    except Exception as e:
        logger.error("System metrics check failed", error=str(e))
        checks["system"] = ServiceCheck(
            status=ServiceStatus.UNKNOWN,
            message=f"System metrics failed: {str(e)}"
        )
    
    # Configuration check
    config_issues = []
    if not settings.JWT_SECRET or settings.JWT_SECRET == "fallback-secret":
        config_issues.append("JWT_SECRET not properly configured")
    if not settings.N8N_BASE_URL:
        config_issues.append("N8N_BASE_URL not configured")
    
    if config_issues:
        checks["configuration"] = ServiceCheck(
            status=ServiceStatus.DEGRADED,
            message=f"Configuration issues: {', '.join(config_issues)}"
        )
        if overall_status == ServiceStatus.HEALTHY:
            overall_status = ServiceStatus.DEGRADED
    else:
        checks["configuration"] = ServiceCheck(
            status=ServiceStatus.HEALTHY,
            message="Configuration is valid"
        )
    
    response_time = time.time() - start_time
    
    return HealthCheckResponse(
        status=overall_status,
        version=settings.VERSION,
        uptime=uptime,
        checks=checks
    )


@router.get("/detailed", response_model=dict)
async def detailed_health_check():
    """Detailed health check with additional information"""
    logger.info("Detailed health check requested")
    
    # Get basic health check
    basic_health = await health_check()
    
    # Add detailed information
    detailed_info = {
        "basic_health": basic_health.dict(),
        "service_info": {
            "name": settings.APP_NAME,
            "version": settings.VERSION,
            "debug_mode": settings.DEBUG,
            "host": settings.HOST,
            "port": settings.PORT,
            "environment": "development" if settings.DEBUG else "production"
        },
        "configuration": {
            "jwt_configured": bool(settings.JWT_SECRET and settings.JWT_SECRET != "fallback-secret"),
            "n8n_configured": bool(settings.N8N_BASE_URL),
            "database_configured": bool(settings.DB_NAME and settings.DB_USER),
            "allowed_origins": settings.ALLOWED_ORIGINS,
            "allowed_hosts": settings.ALLOWED_HOSTS
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return detailed_info


@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe endpoint"""
    try:
        # Check critical dependencies
        db_health = await database.health_check()
        if db_health["status"] != "healthy":
            return {"status": "not ready", "reason": "database not healthy"}, 503
        
        return {"status": "ready"}
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        return {"status": "not ready", "reason": str(e)}, 503


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    # Simple check that the service is responding
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}