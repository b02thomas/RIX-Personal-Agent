"""
Logging configuration for RIX Main Agent
"""

import logging
from typing import Any, Dict

import structlog
from app.core.config import settings


def setup_logging():
    """Configure structured logging"""

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer() if settings.LOG_FORMAT == "json" else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, settings.LOG_LEVEL.upper())),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=False,
    )

    # Configure standard logging
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format="%(message)s" if settings.LOG_FORMAT == "json" else "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def get_logger(name: str = __name__) -> structlog.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)
