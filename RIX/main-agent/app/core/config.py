"""
Configuration settings for RIX Main Agent
"""

import os
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "RIX Main Agent"
    VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    # Default to localhost for security, but allow override for production deployments
    # In production with proper firewall rules, "0.0.0.0" is acceptable
    HOST: str = Field(default="127.0.0.1", env="HOST")
    PORT: int = Field(default=8001, env="PORT")

    # Security
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")

    # CORS and Security
    ALLOWED_ORIGINS: List[str] = Field(default=["http://localhost:3000", "https://localhost:3000"], env="ALLOWED_ORIGINS")
    ALLOWED_HOSTS: List[str] = Field(default=["localhost", "127.0.0.1"], env="ALLOWED_HOSTS")

    # Database
    DB_USER: str = Field(..., env="DB_USER")
    DB_PASSWORD: str = Field(..., env="DB_PASSWORD")
    DB_HOST: str = Field(default="localhost", env="DB_HOST")
    DB_PORT: int = Field(default=5432, env="DB_PORT")
    DB_NAME: str = Field(..., env="DB_NAME")

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def async_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # N8N Integration
    N8N_BASE_URL: str = Field(..., env="N8N_BASE_URL")
    N8N_API_KEY: Optional[str] = Field(default=None, env="N8N_API_KEY")
    N8N_WEBHOOK_SECRET: Optional[str] = Field(default=None, env="N8N_WEBHOOK_SECRET")
    N8N_JWT_TOKEN: Optional[str] = Field(default=None, env="N8N_JWT_TOKEN")

    # MCP Integration (Model Context Protocol endpoints)
    MCP_TASK_ENDPOINT: str = Field(default="/mcp/task-management", env="MCP_TASK_ENDPOINT")
    MCP_CALENDAR_ENDPOINT: str = Field(default="/mcp/calendar-intelligence", env="MCP_CALENDAR_ENDPOINT")
    MCP_BRIEFING_ENDPOINT: str = Field(default="/mcp/briefing-generator", env="MCP_BRIEFING_ENDPOINT")
    MCP_CHAT_ENDPOINT: str = Field(default="/mcp/general-conversation", env="MCP_CHAT_ENDPOINT")
    MCP_NEWS_ENDPOINT: str = Field(default="/mcp/news-intelligence", env="MCP_NEWS_ENDPOINT")
    MCP_VOICE_ENDPOINT: str = Field(default="/mcp/voice-processing", env="MCP_VOICE_ENDPOINT")
    MCP_ANALYTICS_ENDPOINT: str = Field(default="/mcp/analytics-learning", env="MCP_ANALYTICS_ENDPOINT")
    MCP_NOTIFICATIONS_ENDPOINT: str = Field(default="/mcp/notification-management", env="MCP_NOTIFICATIONS_ENDPOINT")
    MCP_PROJECT_ENDPOINT: str = Field(default="/mcp/project-chatbot", env="MCP_PROJECT_ENDPOINT")
    # Intelligence Features (7 future Sub-Agent workflows)
    MCP_ROUTINE_COACHING_ENDPOINT: str = Field(default="/mcp/routine-coaching", env="MCP_ROUTINE_COACHING_ENDPOINT")
    MCP_PROJECT_INTELLIGENCE_ENDPOINT: str = Field(
        default="/mcp/project-intelligence", env="MCP_PROJECT_INTELLIGENCE_ENDPOINT"
    )
    MCP_CALENDAR_OPTIMIZATION_ENDPOINT: str = Field(
        default="/mcp/calendar-optimization", env="MCP_CALENDAR_OPTIMIZATION_ENDPOINT"
    )
    MCP_BEHAVIORAL_ANALYTICS_ENDPOINT: str = Field(
        default="/mcp/behavioral-analytics", env="MCP_BEHAVIORAL_ANALYTICS_ENDPOINT"
    )
    MCP_KNOWLEDGE_INTELLIGENCE_ENDPOINT: str = Field(
        default="/mcp/knowledge-intelligence", env="MCP_KNOWLEDGE_INTELLIGENCE_ENDPOINT"
    )
    MCP_GOAL_INTELLIGENCE_ENDPOINT: str = Field(default="/mcp/goal-intelligence", env="MCP_GOAL_INTELLIGENCE_ENDPOINT")
    MCP_DAILY_INTELLIGENCE_ENDPOINT: str = Field(default="/mcp/daily-intelligence", env="MCP_DAILY_INTELLIGENCE_ENDPOINT")

    # Database Configuration
    DB_POOL_MIN_SIZE: int = Field(default=5, env="DB_POOL_MIN_SIZE")
    DB_POOL_MAX_SIZE: int = Field(default=20, env="DB_POOL_MAX_SIZE")
    DB_QUERY_TIMEOUT: int = Field(default=30, env="DB_QUERY_TIMEOUT")

    # Intelligence Configuration
    INTELLIGENCE_MODE: str = Field(default="direct", env="INTELLIGENCE_MODE")  # direct or mcp
    VECTOR_SIMILARITY_THRESHOLD: float = Field(default=0.7, env="VECTOR_SIMILARITY_THRESHOLD")
    DEFAULT_PAGE_SIZE: int = Field(default=20, env="DEFAULT_PAGE_SIZE")
    MAX_PAGE_SIZE: int = Field(default=100, env="MAX_PAGE_SIZE")

    # Development Configuration
    DEV_MODE: bool = Field(default=False, env="DEV_MODE")
    MOCK_N8N_RESPONSES: bool = Field(default=False, env="MOCK_N8N_RESPONSES")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds

    # WebSocket
    WEBSOCKET_HEARTBEAT_INTERVAL: int = Field(default=30, env="WEBSOCKET_HEARTBEAT_INTERVAL")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields for development


# Global settings instance
settings = Settings()
