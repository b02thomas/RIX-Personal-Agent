# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/utils/secure_error_handler.py
# Secure error handling utilities that prevent information leakage
# This module provides safe error handling that doesn't expose sensitive information
# RELEVANT FILES: app/api/endpoints/*.py, app/middleware/*.py, app/services/*.py

import logging
import traceback
import uuid
from datetime import datetime
from typing import Any, Dict, Optional, Union

from app.core.logging import get_logger
from fastapi import HTTPException, status

logger = get_logger(__name__)


class SecurityError(Exception):
    """Custom exception for security-related errors"""

    pass


class SecureErrorHandler:
    """
    Secure error handling utility that prevents sensitive information leakage

    This class provides methods to handle errors safely, ensuring that:
    1. Sensitive information is not exposed to clients
    2. Detailed error information is logged for debugging
    3. Consistent error responses are returned
    4. Error tracking and monitoring is maintained
    """

    # Generic error messages that don't leak information
    GENERIC_ERROR_MESSAGES = {
        "auth_failed": "Authentication failed",
        "access_denied": "Access denied",
        "invalid_input": "Invalid input provided",
        "resource_not_found": "Resource not found",
        "server_error": "An internal server error occurred",
        "validation_error": "Request validation failed",
        "rate_limited": "Too many requests",
        "service_unavailable": "Service temporarily unavailable",
    }

    @classmethod
    def handle_authentication_error(
        cls, error: Exception, user_id: Optional[str] = None, additional_context: Optional[Dict[str, Any]] = None
    ) -> HTTPException:
        """
        Handle authentication-related errors securely

        Args:
            error: The original error
            user_id: Optional user ID for logging
            additional_context: Additional context for logging

        Returns:
            HTTPException with safe error message
        """
        error_id = str(uuid.uuid4())

        # Log detailed error information for debugging
        logger.warning(
            "Authentication error",
            error_id=error_id,
            user_id=user_id,
            error_type=type(error).__name__,
            error_message=str(error),
            additional_context=additional_context or {},
        )

        # Return generic error message to client
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "authentication_failed",
                "message": cls.GENERIC_ERROR_MESSAGES["auth_failed"],
                "error_id": error_id,
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    @classmethod
    def handle_authorization_error(
        cls, error: Exception, user_id: Optional[str] = None, resource: Optional[str] = None, action: Optional[str] = None
    ) -> HTTPException:
        """
        Handle authorization-related errors securely

        Args:
            error: The original error
            user_id: Optional user ID for logging
            resource: Optional resource being accessed
            action: Optional action being performed

        Returns:
            HTTPException with safe error message
        """
        error_id = str(uuid.uuid4())

        # Log detailed error information for debugging
        logger.warning(
            "Authorization error",
            error_id=error_id,
            user_id=user_id,
            resource=resource,
            action=action,
            error_type=type(error).__name__,
            error_message=str(error),
        )

        # Return generic error message to client
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "access_denied", "message": cls.GENERIC_ERROR_MESSAGES["access_denied"], "error_id": error_id},
        )

    @classmethod
    def handle_validation_error(
        cls, error: Exception, field_name: Optional[str] = None, user_id: Optional[str] = None
    ) -> HTTPException:
        """
        Handle input validation errors securely

        Args:
            error: The original error
            field_name: Optional field name that failed validation
            user_id: Optional user ID for logging

        Returns:
            HTTPException with safe error message
        """
        error_id = str(uuid.uuid4())

        # Log detailed error information for debugging
        logger.info(
            "Validation error",
            error_id=error_id,
            user_id=user_id,
            field_name=field_name,
            error_type=type(error).__name__,
            error_message=str(error),
        )

        # For validation errors, we can be slightly more specific
        # but still avoid leaking sensitive information
        safe_message = cls.GENERIC_ERROR_MESSAGES["validation_error"]
        if field_name and isinstance(error, ValueError):
            safe_message = f"Invalid value for field: {field_name}"

        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "validation_error", "message": safe_message, "error_id": error_id},
        )

    @classmethod
    def handle_database_error(
        cls, error: Exception, operation: Optional[str] = None, user_id: Optional[str] = None, table: Optional[str] = None
    ) -> HTTPException:
        """
        Handle database-related errors securely

        Args:
            error: The original database error
            operation: Optional database operation (e.g., "SELECT", "INSERT")
            user_id: Optional user ID for logging
            table: Optional table name (will be sanitized in logs)

        Returns:
            HTTPException with safe error message
        """
        error_id = str(uuid.uuid4())

        # Log detailed error information for debugging
        logger.error(
            "Database error",
            error_id=error_id,
            user_id=user_id,
            operation=operation,
            table=table,
            error_type=type(error).__name__,
            error_message=str(error),
            stack_trace=traceback.format_exc(),
        )

        # Never expose database errors to clients
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": cls.GENERIC_ERROR_MESSAGES["server_error"], "error_id": error_id},
        )

    @classmethod
    def handle_external_service_error(
        cls, error: Exception, service_name: str, operation: Optional[str] = None, user_id: Optional[str] = None
    ) -> HTTPException:
        """
        Handle external service errors securely

        Args:
            error: The original service error
            service_name: Name of the external service
            operation: Optional operation being performed
            user_id: Optional user ID for logging

        Returns:
            HTTPException with safe error message
        """
        error_id = str(uuid.uuid4())

        # Log detailed error information for debugging
        logger.error(
            "External service error",
            error_id=error_id,
            service_name=service_name,
            operation=operation,
            user_id=user_id,
            error_type=type(error).__name__,
            error_message=str(error),
        )

        # Don't expose external service details
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "service_unavailable",
                "message": cls.GENERIC_ERROR_MESSAGES["service_unavailable"],
                "error_id": error_id,
            },
        )

    @classmethod
    def handle_generic_server_error(
        cls,
        error: Exception,
        context: Optional[str] = None,
        user_id: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> HTTPException:
        """
        Handle generic server errors securely

        Args:
            error: The original error
            context: Optional context description
            user_id: Optional user ID for logging
            additional_data: Additional data for logging

        Returns:
            HTTPException with safe error message
        """
        error_id = str(uuid.uuid4())

        # Log detailed error information for debugging
        logger.error(
            "Server error",
            error_id=error_id,
            context=context,
            user_id=user_id,
            error_type=type(error).__name__,
            error_message=str(error),
            additional_data=additional_data or {},
            stack_trace=traceback.format_exc(),
        )

        # Return generic error message
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": cls.GENERIC_ERROR_MESSAGES["server_error"], "error_id": error_id},
        )

    @classmethod
    def handle_security_violation(
        cls,
        error: Union[Exception, str],
        violation_type: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None,
    ) -> HTTPException:
        """
        Handle security violations securely

        Args:
            error: The security error or description
            violation_type: Type of security violation
            user_id: Optional user ID for logging
            ip_address: Optional client IP address
            user_agent: Optional client user agent
            additional_context: Additional context for logging

        Returns:
            HTTPException with safe error message
        """
        error_id = str(uuid.uuid4())
        error_message = str(error) if isinstance(error, Exception) else error

        # Log security violation with high priority
        logger.critical(
            "Security violation detected",
            error_id=error_id,
            violation_type=violation_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            error_message=error_message,
            additional_context=additional_context or {},
            timestamp=datetime.utcnow().isoformat(),
        )

        # Return generic access denied message
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "access_denied", "message": cls.GENERIC_ERROR_MESSAGES["access_denied"], "error_id": error_id},
        )

    @classmethod
    def sanitize_error_for_logging(cls, error: Exception, sensitive_fields: Optional[list] = None) -> Dict[str, Any]:
        """
        Sanitize error information for safe logging

        Args:
            error: The error to sanitize
            sensitive_fields: List of field names to redact

        Returns:
            Sanitized error information
        """
        sensitive_fields = sensitive_fields or [
            "password",
            "token",
            "secret",
            "key",
            "authorization",
            "cookie",
            "session",
            "credential",
            "private",
        ]

        error_info = {"type": type(error).__name__, "message": str(error), "timestamp": datetime.utcnow().isoformat()}

        # Sanitize error message
        error_message = str(error).lower()
        for field in sensitive_fields:
            if field in error_message:
                error_info["message"] = "[REDACTED - Contains sensitive information]"
                error_info["contains_sensitive_data"] = True
                break

        return error_info

    @classmethod
    def create_safe_error_response(
        cls,
        error_type: str,
        message: Optional[str] = None,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a safe error response that doesn't leak information

        Args:
            error_type: Type of error
            message: Optional custom message
            status_code: HTTP status code
            additional_data: Additional safe data to include

        Returns:
            Safe error response dictionary
        """
        error_id = str(uuid.uuid4())

        response = {
            "error": error_type,
            "message": message or cls.GENERIC_ERROR_MESSAGES.get(error_type, "An error occurred"),
            "error_id": error_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status_code": status_code,
        }

        if additional_data:
            # Only include additional data that is explicitly safe
            safe_additional_data = {}
            for key, value in additional_data.items():
                if not any(sensitive in key.lower() for sensitive in ["password", "token", "secret", "key", "credential"]):
                    safe_additional_data[key] = value

            if safe_additional_data:
                response["details"] = safe_additional_data

        return response
