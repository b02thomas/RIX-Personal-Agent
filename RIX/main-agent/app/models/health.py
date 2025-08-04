"""
Health check models for RIX Main Agent
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class ServiceStatus(str, Enum):
    """Service status enum"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class HealthCheckResponse(BaseModel):
    """Health check response model"""

    status: ServiceStatus = Field(..., description="Overall service status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")
    version: str = Field(..., description="Service version")
    uptime: float = Field(..., description="Service uptime in seconds")
    checks: Dict[str, Any] = Field(..., description="Individual health checks")


class ServiceCheck(BaseModel):
    """Individual service check"""

    status: ServiceStatus = Field(..., description="Service status")
    response_time: Optional[float] = Field(None, description="Response time in seconds")
    message: Optional[str] = Field(None, description="Status message")
    last_check: datetime = Field(default_factory=datetime.utcnow, description="Last check timestamp")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details")


class DatabaseHealthCheck(ServiceCheck):
    """Database health check"""

    connection_pool_size: Optional[int] = Field(None, description="Connection pool size")
    active_connections: Optional[int] = Field(None, description="Active connections")


class N8NHealthCheck(ServiceCheck):
    """N8N service health check"""

    api_accessible: bool = Field(..., description="Whether N8N API is accessible")
    webhook_reachable: bool = Field(..., description="Whether webhooks are reachable")
    active_workflows: Optional[int] = Field(None, description="Number of active workflows")


class SystemMetrics(BaseModel):
    """System metrics"""

    cpu_usage: Optional[float] = Field(None, ge=0.0, le=100.0, description="CPU usage percentage")
    memory_usage: Optional[float] = Field(None, ge=0.0, le=100.0, description="Memory usage percentage")
    disk_usage: Optional[float] = Field(None, ge=0.0, le=100.0, description="Disk usage percentage")
    open_connections: Optional[int] = Field(None, description="Number of open connections")
    requests_per_minute: Optional[float] = Field(None, description="Requests per minute")
