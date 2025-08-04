# /03-implementation/backend-improvements/error-handling.py
# Standardized error response system for RIX Main Agent
# Provides consistent HTTP status codes and error messages across all endpoints
# RELEVANT FILES: app/api/endpoints/*, app/core/logging.py, app/main.py

import traceback
import uuid
from typing import Dict, Any, Optional, List, Union
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError

from app.core.logging import get_logger

logger = get_logger(__name__)


class ErrorCode(str, Enum):
    """Standardized error codes"""
    # Authentication & Authorization
    AUTHENTICATION_FAILED = "AUTH_001"
    INVALID_TOKEN = "AUTH_002"
    TOKEN_EXPIRED = "AUTH_003"
    INSUFFICIENT_PERMISSIONS = "AUTH_004"
    
    # Validation Errors
    INVALID_REQUEST_DATA = "VAL_001"
    MISSING_REQUIRED_FIELD = "VAL_002"
    INVALID_FIELD_FORMAT = "VAL_003"
    FIELD_VALUE_OUT_OF_RANGE = "VAL_004"
    
    # Database Errors
    DATABASE_CONNECTION_ERROR = "DB_001"
    RECORD_NOT_FOUND = "DB_002"
    DUPLICATE_RECORD = "DB_003"
    DATABASE_TIMEOUT = "DB_004"
    CONSTRAINT_VIOLATION = "DB_005"
    
    # Business Logic Errors
    WORKFLOW_EXECUTION_FAILED = "WF_001"
    INVALID_WORKFLOW_TYPE = "WF_002"
    WORKFLOW_TIMEOUT = "WF_003"
    WORKFLOW_NOT_FOUND = "WF_004"
    
    # External Service Errors
    N8N_SERVICE_UNAVAILABLE = "EXT_001"
    N8N_EXECUTION_FAILED = "EXT_002"
    N8N_AUTHENTICATION_FAILED = "EXT_003"
    N8N_TIMEOUT = "EXT_004"
    
    # Resource Errors
    CONVERSATION_NOT_FOUND = "RES_001"
    MESSAGE_NOT_FOUND = "RES_002"
    USER_NOT_FOUND = "RES_003"
    PROJECT_NOT_FOUND = "RES_004"
    TASK_NOT_FOUND = "RES_005"
    
    # Rate Limiting
    RATE_LIMIT_EXCEEDED = "RATE_001"
    QUOTA_EXCEEDED = "RATE_002"
    
    # System Errors
    INTERNAL_SERVER_ERROR = "SYS_001"
    SERVICE_UNAVAILABLE = "SYS_002"
    CONFIGURATION_ERROR = "SYS_003"
    MEMORY_ERROR = "SYS_004"
    
    # Content Processing Errors
    CONTENT_TOO_LARGE = "CONTENT_001"
    UNSUPPORTED_CONTENT_TYPE = "CONTENT_002"
    CONTENT_PROCESSING_FAILED = "CONTENT_003"
    
    # AI/ML Errors
    AI_PROCESSING_FAILED = "AI_001"
    MODEL_UNAVAILABLE = "AI_002"
    INFERENCE_TIMEOUT = "AI_003"
    INVALID_AI_RESPONSE = "AI_004"


@dataclass
class ErrorDetail:
    """Detailed error information"""
    field: Optional[str] = None
    value: Optional[Any] = None
    message: Optional[str] = None
    location: Optional[str] = None


@dataclass
class ErrorResponse:
    """Standardized error response structure"""
    error_code: ErrorCode
    message: str
    details: Optional[List[ErrorDetail]] = None
    timestamp: datetime = None
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    endpoint: Optional[str] = None
    suggestions: Optional[List[str]] = None
    support_info: Optional[Dict[str, str]] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON response"""
        result = {
            "error_code": self.error_code.value,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
        }
        
        if self.details:
            result["details"] = [
                {
                    "field": detail.field,
                    "value": detail.value,
                    "message": detail.message,
                    "location": detail.location
                }
                for detail in self.details
            ]
        
        if self.request_id:
            result["request_id"] = self.request_id
        
        if self.user_id:
            result["user_id"] = self.user_id
        
        if self.endpoint:
            result["endpoint"] = self.endpoint
        
        if self.suggestions:
            result["suggestions"] = self.suggestions
        
        if self.support_info:
            result["support_info"] = self.support_info
        
        return result


class RIXException(Exception):
    """Base exception class for RIX-specific errors"""
    
    def __init__(
        self,
        error_code: ErrorCode,
        message: str,
        details: Optional[List[ErrorDetail]] = None,
        suggestions: Optional[List[str]] = None,
        status_code: int = 500
    ):
        self.error_code = error_code
        self.message = message
        self.details = details or []
        self.suggestions = suggestions or []
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(RIXException):
    """Authentication-related errors"""
    
    def __init__(
        self,
        error_code: ErrorCode = ErrorCode.AUTHENTICATION_FAILED,
        message: str = "Authentication failed",
        details: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(
            error_code=error_code,
            message=message,
            details=details,
            status_code=401,
            suggestions=[
                "Check your authentication credentials",
                "Ensure your token is valid and not expired",
                "Try refreshing your authentication token"
            ]
        )


class ValidationError(RIXException):
    """Validation-related errors"""
    
    def __init__(
        self,
        error_code: ErrorCode = ErrorCode.INVALID_REQUEST_DATA,
        message: str = "Request validation failed",
        details: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(
            error_code=error_code,
            message=message,
            details=details,
            status_code=400,
            suggestions=[
                "Check the request format and required fields",
                "Verify data types and value ranges",
                "Refer to API documentation for correct format"
            ]
        )


class DatabaseError(RIXException):
    """Database-related errors"""
    
    def __init__(
        self,
        error_code: ErrorCode = ErrorCode.DATABASE_CONNECTION_ERROR,
        message: str = "Database operation failed",
        details: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(
            error_code=error_code,
            message=message,
            details=details,
            status_code=503,
            suggestions=[
                "Please try again in a few moments",
                "If the problem persists, contact support"
            ]
        )


class WorkflowError(RIXException):
    """Workflow execution errors"""
    
    def __init__(
        self,
        error_code: ErrorCode = ErrorCode.WORKFLOW_EXECUTION_FAILED,
        message: str = "Workflow execution failed",
        details: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(
            error_code=error_code,
            message=message,
            details=details,
            status_code=502,
            suggestions=[
                "The AI service may be temporarily unavailable",
                "Try rephrasing your request",
                "Check if all required information is provided"
            ]
        )


class ResourceNotFoundError(RIXException):
    """Resource not found errors"""
    
    def __init__(
        self,
        error_code: ErrorCode = ErrorCode.RECORD_NOT_FOUND,
        message: str = "Resource not found",
        details: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(
            error_code=error_code,
            message=message,
            details=details,
            status_code=404,
            suggestions=[
                "Verify the resource ID is correct",
                "Check if the resource exists and you have access to it"
            ]
        )


class RateLimitError(RIXException):
    """Rate limiting errors"""
    
    def __init__(
        self,
        error_code: ErrorCode = ErrorCode.RATE_LIMIT_EXCEEDED,
        message: str = "Rate limit exceeded",
        details: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(
            error_code=error_code,
            message=message,
            details=details,
            status_code=429,
            suggestions=[
                "Please wait before making another request",
                "Consider reducing the frequency of requests",
                "Contact support if you need higher limits"
            ]
        )


class ErrorHandler:
    """Centralized error handling and response generation"""
    
    def __init__(self):
        self.error_mappings = self._initialize_error_mappings()
        self.status_code_mappings = self._initialize_status_code_mappings()
    
    def _initialize_error_mappings(self) -> Dict[str, ErrorCode]:
        """Map common exception types to error codes"""
        return {
            "ValidationError": ErrorCode.INVALID_REQUEST_DATA,
            "RequestValidationError": ErrorCode.INVALID_REQUEST_DATA,
            "ValueError": ErrorCode.INVALID_FIELD_FORMAT,
            "KeyError": ErrorCode.MISSING_REQUIRED_FIELD,
            "FileNotFoundError": ErrorCode.RECORD_NOT_FOUND,
            "PermissionError": ErrorCode.INSUFFICIENT_PERMISSIONS,
            "TimeoutError": ErrorCode.WORKFLOW_TIMEOUT,
            "ConnectionError": ErrorCode.N8N_SERVICE_UNAVAILABLE,
            "HTTPException": ErrorCode.INTERNAL_SERVER_ERROR
        }
    
    def _initialize_status_code_mappings(self) -> Dict[ErrorCode, int]:
        """Map error codes to HTTP status codes"""
        return {
            # Authentication & Authorization (4xx)
            ErrorCode.AUTHENTICATION_FAILED: 401,
            ErrorCode.INVALID_TOKEN: 401,
            ErrorCode.TOKEN_EXPIRED: 401,
            ErrorCode.INSUFFICIENT_PERMISSIONS: 403,
            
            # Validation Errors (4xx)
            ErrorCode.INVALID_REQUEST_DATA: 400,
            ErrorCode.MISSING_REQUIRED_FIELD: 400,
            ErrorCode.INVALID_FIELD_FORMAT: 400,
            ErrorCode.FIELD_VALUE_OUT_OF_RANGE: 400,
            
            # Resource Errors (4xx)
            ErrorCode.CONVERSATION_NOT_FOUND: 404,
            ErrorCode.MESSAGE_NOT_FOUND: 404,
            ErrorCode.USER_NOT_FOUND: 404,
            ErrorCode.PROJECT_NOT_FOUND: 404,
            ErrorCode.TASK_NOT_FOUND: 404,
            ErrorCode.RECORD_NOT_FOUND: 404,
            
            # Rate Limiting (4xx)
            ErrorCode.RATE_LIMIT_EXCEEDED: 429,
            ErrorCode.QUOTA_EXCEEDED: 429,
            
            # Content Errors (4xx)
            ErrorCode.CONTENT_TOO_LARGE: 413,
            ErrorCode.UNSUPPORTED_CONTENT_TYPE: 415,
            
            # Database Errors (5xx)
            ErrorCode.DATABASE_CONNECTION_ERROR: 503,
            ErrorCode.DATABASE_TIMEOUT: 504,
            ErrorCode.DUPLICATE_RECORD: 409,
            ErrorCode.CONSTRAINT_VIOLATION: 409,
            
            # Workflow Errors (5xx)
            ErrorCode.WORKFLOW_EXECUTION_FAILED: 502,
            ErrorCode.INVALID_WORKFLOW_TYPE: 500,
            ErrorCode.WORKFLOW_TIMEOUT: 504,
            ErrorCode.WORKFLOW_NOT_FOUND: 404,
            
            # External Service Errors (5xx)
            ErrorCode.N8N_SERVICE_UNAVAILABLE: 503,
            ErrorCode.N8N_EXECUTION_FAILED: 502,
            ErrorCode.N8N_AUTHENTICATION_FAILED: 502,
            ErrorCode.N8N_TIMEOUT: 504,
            
            # System Errors (5xx)
            ErrorCode.INTERNAL_SERVER_ERROR: 500,
            ErrorCode.SERVICE_UNAVAILABLE: 503,
            ErrorCode.CONFIGURATION_ERROR: 500,
            ErrorCode.MEMORY_ERROR: 500,
            
            # Content Processing Errors (5xx)
            ErrorCode.CONTENT_PROCESSING_FAILED: 500,
            
            # AI/ML Errors (5xx)
            ErrorCode.AI_PROCESSING_FAILED: 502,
            ErrorCode.MODEL_UNAVAILABLE: 503,
            ErrorCode.INFERENCE_TIMEOUT: 504,
            ErrorCode.INVALID_AI_RESPONSE: 502
        }
    
    def handle_exception(
        self,
        exception: Exception,
        request: Optional[Request] = None,
        user_id: Optional[str] = None
    ) -> ErrorResponse:
        """Handle any exception and convert to standardized error response"""
        
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        
        # Extract request information
        endpoint = None
        if request:
            endpoint = f"{request.method} {request.url.path}"
        
        # Handle RIX-specific exceptions
        if isinstance(exception, RIXException):
            return self._handle_rix_exception(exception, request_id, user_id, endpoint)
        
        # Handle FastAPI validation errors
        elif isinstance(exception, RequestValidationError):
            return self._handle_validation_error(exception, request_id, user_id, endpoint)
        
        # Handle FastAPI HTTP exceptions
        elif isinstance(exception, (HTTPException, StarletteHTTPException)):
            return self._handle_http_exception(exception, request_id, user_id, endpoint)
        
        # Handle generic exceptions
        else:
            return self._handle_generic_exception(exception, request_id, user_id, endpoint)
    
    def _handle_rix_exception(
        self,
        exception: RIXException,
        request_id: str,
        user_id: Optional[str],
        endpoint: Optional[str]
    ) -> ErrorResponse:
        """Handle RIX-specific exceptions"""
        
        logger.error(
            "RIX exception occurred",
            error_code=exception.error_code.value,
            message=exception.message,
            request_id=request_id,
            user_id=user_id,
            endpoint=endpoint,
            exc_info=True
        )
        
        return ErrorResponse(
            error_code=exception.error_code,
            message=exception.message,
            details=exception.details,
            request_id=request_id,
            user_id=user_id,
            endpoint=endpoint,
            suggestions=exception.suggestions,
            support_info={
                "request_id": request_id,
                "contact": "support@rix.com"
            }
        )
    
    def _handle_validation_error(
        self,
        exception: RequestValidationError,
        request_id: str,
        user_id: Optional[str],
        endpoint: Optional[str]
    ) -> ErrorResponse:
        """Handle FastAPI validation errors"""
        
        logger.warning(
            "Validation error",
            errors=exception.errors(),
            request_id=request_id,
            user_id=user_id,
            endpoint=endpoint
        )
        
        # Convert validation errors to error details
        details = []
        for error in exception.errors():
            detail = ErrorDetail(
                field=".".join(str(loc) for loc in error["loc"]),
                message=error["msg"],
                value=error.get("input"),
                location="body" if error["loc"][0] == "body" else "query"
            )
            details.append(detail)
        
        return ErrorResponse(
            error_code=ErrorCode.INVALID_REQUEST_DATA,
            message="Request validation failed",
            details=details,
            request_id=request_id,
            user_id=user_id,
            endpoint=endpoint,
            suggestions=[
                "Check the request format and required fields",
                "Verify data types match the expected format",
                "Ensure all required fields are provided"
            ],
            support_info={
                "request_id": request_id,
                "documentation": "https://docs.rix.com/api"
            }
        )
    
    def _handle_http_exception(
        self,
        exception: Union[HTTPException, StarletteHTTPException],
        request_id: str,
        user_id: Optional[str],
        endpoint: Optional[str]
    ) -> ErrorResponse:
        """Handle FastAPI HTTP exceptions"""
        
        logger.warning(
            "HTTP exception",
            status_code=exception.status_code,
            detail=exception.detail,
            request_id=request_id,
            user_id=user_id,
            endpoint=endpoint
        )
        
        # Map status code to error code
        error_code = self._map_status_code_to_error_code(exception.status_code)
        
        return ErrorResponse(
            error_code=error_code,
            message=str(exception.detail),
            request_id=request_id,
            user_id=user_id,
            endpoint=endpoint,
            suggestions=self._get_suggestions_for_status_code(exception.status_code),
            support_info={
                "request_id": request_id,
                "status_code": exception.status_code
            }
        )
    
    def _handle_generic_exception(
        self,
        exception: Exception,
        request_id: str,
        user_id: Optional[str],
        endpoint: Optional[str]
    ) -> ErrorResponse:
        """Handle generic Python exceptions"""
        
        # Log full exception details
        logger.error(
            "Unhandled exception",
            exception_type=type(exception).__name__,
            message=str(exception),
            request_id=request_id,
            user_id=user_id,
            endpoint=endpoint,
            traceback=traceback.format_exc()
        )
        
        # Map exception type to error code
        exception_type = type(exception).__name__
        error_code = self.error_mappings.get(exception_type, ErrorCode.INTERNAL_SERVER_ERROR)
        
        # Create user-friendly message
        message = self._create_user_friendly_message(exception, error_code)
        
        return ErrorResponse(
            error_code=error_code,
            message=message,
            request_id=request_id,
            user_id=user_id,
            endpoint=endpoint,
            suggestions=[
                "Please try again in a few moments",
                "If the problem persists, contact support with the request ID"
            ],
            support_info={
                "request_id": request_id,
                "contact": "support@rix.com",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def _map_status_code_to_error_code(self, status_code: int) -> ErrorCode:
        """Map HTTP status code to error code"""
        mapping = {
            400: ErrorCode.INVALID_REQUEST_DATA,
            401: ErrorCode.AUTHENTICATION_FAILED,
            403: ErrorCode.INSUFFICIENT_PERMISSIONS,
            404: ErrorCode.RECORD_NOT_FOUND,
            409: ErrorCode.DUPLICATE_RECORD,
            413: ErrorCode.CONTENT_TOO_LARGE,
            415: ErrorCode.UNSUPPORTED_CONTENT_TYPE,
            429: ErrorCode.RATE_LIMIT_EXCEEDED,
            500: ErrorCode.INTERNAL_SERVER_ERROR,
            502: ErrorCode.WORKFLOW_EXECUTION_FAILED,
            503: ErrorCode.SERVICE_UNAVAILABLE,
            504: ErrorCode.WORKFLOW_TIMEOUT
        }
        return mapping.get(status_code, ErrorCode.INTERNAL_SERVER_ERROR)
    
    def _get_suggestions_for_status_code(self, status_code: int) -> List[str]:
        """Get helpful suggestions based on status code"""
        suggestions = {
            400: [
                "Check the request format and parameters",
                "Ensure all required fields are provided",
                "Verify data types and value ranges"
            ],
            401: [
                "Check your authentication credentials",
                "Ensure your token is valid and not expired"
            ],
            403: [
                "Verify you have permission to access this resource",
                "Contact your administrator if needed"
            ],
            404: [
                "Check the resource ID or URL",
                "Verify the resource exists and is accessible"
            ],
            429: [
                "Please wait before making another request",
                "Consider reducing request frequency"
            ],
            500: [
                "Please try again in a few moments",
                "Contact support if the problem persists"
            ],
            503: [
                "The service is temporarily unavailable",
                "Please try again later"
            ]
        }
        return suggestions.get(status_code, ["Please try again or contact support"])
    
    def _create_user_friendly_message(self, exception: Exception, error_code: ErrorCode) -> str:
        """Create user-friendly error message"""
        exception_type = type(exception).__name__
        
        user_friendly_messages = {
            "ValidationError": "The provided data is not valid",
            "ValueError": "Invalid value provided",
            "KeyError": "Required information is missing",
            "FileNotFoundError": "The requested resource was not found",
            "PermissionError": "You don't have permission to perform this action",
            "TimeoutError": "The operation timed out",
            "ConnectionError": "Unable to connect to external service"
        }
        
        # Add mobile and voice specific messages
        mobile_voice_messages = {
            "SpeechRecognitionError": "Voice recognition is not available or failed",
            "AudioProcessingError": "Unable to process audio input",
            "TouchEventError": "Touch interaction failed",
            "GestureError": "Gesture not recognized",
            "HapticError": "Haptic feedback unavailable",
            "DeviceCompatibilityError": "Feature not supported on this device"
        }
        
        return (mobile_voice_messages.get(exception_type) or 
                user_friendly_messages.get(exception_type) or
                "An unexpected error occurred while processing your request")
    
    def create_error_response(
        self,
        error_response: ErrorResponse
    ) -> JSONResponse:
        """Create FastAPI JSON response from error response"""
        
        status_code = self.status_code_mappings.get(
            error_response.error_code,
            500
        )
        
        return JSONResponse(
            status_code=status_code,
            content=error_response.to_dict()
        )


# Global error handler instance
error_handler = ErrorHandler()


# Utility functions for common error scenarios
def create_validation_error(
    field: str,
    value: Any,
    message: str,
    location: str = "body"
) -> ValidationError:
    """Create a validation error for a specific field"""
    detail = ErrorDetail(
        field=field,
        value=value,
        message=message,
        location=location
    )
    
    return ValidationError(
        error_code=ErrorCode.INVALID_FIELD_FORMAT,
        message=f"Validation failed for field '{field}'",
        details=[detail]
    )


def create_not_found_error(resource_type: str, resource_id: str) -> ResourceNotFoundError:
    """Create a not found error for a specific resource"""
    error_codes = {
        "conversation": ErrorCode.CONVERSATION_NOT_FOUND,
        "message": ErrorCode.MESSAGE_NOT_FOUND,
        "user": ErrorCode.USER_NOT_FOUND,
        "project": ErrorCode.PROJECT_NOT_FOUND,
        "task": ErrorCode.TASK_NOT_FOUND
    }
    
    error_code = error_codes.get(resource_type, ErrorCode.RECORD_NOT_FOUND)
    
    return ResourceNotFoundError(
        error_code=error_code,
        message=f"{resource_type.title()} with ID '{resource_id}' was not found",
        details=[
            ErrorDetail(
                field="id",
                value=resource_id,
                message=f"No {resource_type} found with this ID"
            )
        ]
    )


def create_database_error(operation: str, table: Optional[str] = None) -> DatabaseError:
    """Create a database error for a specific operation"""
    message = f"Database {operation} failed"
    if table:
        message += f" for table '{table}'"
    
    return DatabaseError(
        error_code=ErrorCode.DATABASE_CONNECTION_ERROR,
        message=message
    )


def create_workflow_error(workflow_type: str, reason: str) -> WorkflowError:
    """Create a workflow execution error"""
    return WorkflowError(
        error_code=ErrorCode.WORKFLOW_EXECUTION_FAILED,
        message=f"Workflow '{workflow_type}' execution failed: {reason}",
        details=[
            ErrorDetail(
                field="workflow_type",
                value=workflow_type,
                message=reason
            )
        ]
    )


def create_voice_processing_error(reason: str, audio_format: Optional[str] = None) -> RixError:
    """Create a voice processing error"""
    details = [
        ErrorDetail(
            field="processing",
            value="voice_input",
            message=reason
        )
    ]
    
    if audio_format:
        details.append(
            ErrorDetail(
                field="audio_format",
                value=audio_format,
                message=f"Audio format '{audio_format}' may not be supported"
            )
        )
    
    return RixError(
        error_code=ErrorCode.VOICE_PROCESSING_FAILED,
        message=f"Voice processing failed: {reason}",
        details=details
    )


def create_mobile_optimization_error(device_info: Dict[str, Any], reason: str) -> RixError:
    """Create a mobile optimization error"""
    return RixError(
        error_code=ErrorCode.MOBILE_COMPATIBILITY_ERROR,
        message=f"Mobile optimization failed: {reason}",
        details=[
            ErrorDetail(
                field="device_type",
                value=device_info.get("type", "unknown"),
                message=f"Device compatibility issue: {reason}"
            ),
            ErrorDetail(
                field="user_agent",
                value=device_info.get("user_agent", "unknown"),
                message="Browser/device information for debugging"
            )
        ]
    )


def create_intelligence_error(intelligence_type: str, reason: str) -> RixError:
    """Create an AI intelligence processing error"""
    return RixError(
        error_code=ErrorCode.AI_PROCESSING_FAILED,
        message=f"AI {intelligence_type} processing failed: {reason}",
        details=[
            ErrorDetail(
                field="intelligence_type",
                value=intelligence_type,
                message=reason
            )
        ]
    )


class MobileErrorHandler:
    """Specialized error handler for mobile-specific issues"""
    
    @staticmethod
    def handle_touch_error(touch_event: Dict[str, Any], error: Exception) -> ErrorResponse:
        """Handle touch interaction errors"""
        return ErrorResponse(
            error_code=ErrorCode.MOBILE_COMPATIBILITY_ERROR,
            message="Touch interaction failed",
            user_message="There was an issue with the touch interaction. Please try again.",
            details=[
                ErrorDetail(
                    field="touch_type",
                    value=touch_event.get("type", "unknown"),
                    message=str(error)
                )
            ],
            suggestions=[
                "Try tapping more gently",
                "Check if the screen is clean",
                "Try using a different finger"
            ]
        )
    
    @staticmethod
    def handle_gesture_error(gesture_type: str, error: Exception) -> ErrorResponse:
        """Handle gesture recognition errors"""
        return ErrorResponse(
            error_code=ErrorCode.MOBILE_COMPATIBILITY_ERROR,
            message="Gesture recognition failed",
            user_message="The gesture wasn't recognized. Please try again.",
            details=[
                ErrorDetail(
                    field="gesture_type",
                    value=gesture_type,
                    message=str(error)
                )
            ],
            suggestions=[
                "Try making the gesture more slowly",
                "Ensure you're using supported gestures",
                "Check gesture settings in preferences"
            ]
        )
    
    @staticmethod
    def handle_haptic_error(haptic_pattern: str, error: Exception) -> ErrorResponse:
        """Handle haptic feedback errors"""
        return ErrorResponse(
            error_code=ErrorCode.MOBILE_COMPATIBILITY_ERROR,
            message="Haptic feedback unavailable",
            user_message="Haptic feedback is not available on this device.",
            details=[
                ErrorDetail(
                    field="haptic_pattern",
                    value=haptic_pattern,
                    message=str(error)
                )
            ],
            suggestions=[
                "Visual feedback will be used instead",
                "Check device haptic settings",
                "Update your browser for better support"
            ]
        )


class VoiceErrorHandler:
    """Specialized error handler for voice processing issues"""
    
    @staticmethod
    def handle_speech_recognition_error(error: Exception, audio_info: Dict[str, Any]) -> ErrorResponse:
        """Handle speech recognition errors"""
        error_message = str(error).lower()
        
        if "network" in error_message:
            user_message = "Speech recognition requires an internet connection."
            suggestions = [
                "Check your internet connection",
                "Try again when connection is stable",
                "Use text input as alternative"
            ]
        elif "microphone" in error_message or "permission" in error_message:
            user_message = "Microphone access is required for voice input."
            suggestions = [
                "Allow microphone access in browser settings",
                "Check browser permissions",
                "Try refreshing the page"
            ]
        elif "not-allowed" in error_message:
            user_message = "Microphone access was denied."
            suggestions = [
                "Click the microphone icon in address bar",
                "Enable microphone permissions",
                "Check browser privacy settings"
            ]
        else:
            user_message = "Voice recognition failed. Please try again."
            suggestions = [
                "Speak more clearly",
                "Reduce background noise",
                "Try speaking closer to microphone"
            ]
        
        return ErrorResponse(
            error_code=ErrorCode.VOICE_PROCESSING_FAILED,
            message="Speech recognition failed",
            user_message=user_message,
            details=[
                ErrorDetail(
                    field="audio_format",
                    value=audio_info.get("format", "unknown"),
                    message=str(error)
                ),
                ErrorDetail(
                    field="duration",
                    value=str(audio_info.get("duration", 0)),
                    message="Audio duration in seconds"
                )
            ],
            suggestions=suggestions
        )
    
    @staticmethod
    def handle_audio_processing_error(error: Exception, audio_data: Dict[str, Any]) -> ErrorResponse:
        """Handle audio processing errors"""
        return ErrorResponse(
            error_code=ErrorCode.VOICE_PROCESSING_FAILED,
            message="Audio processing failed",
            user_message="Unable to process the audio. Please try recording again.",
            details=[
                ErrorDetail(
                    field="error_type",
                    value=type(error).__name__,
                    message=str(error)
                ),
                ErrorDetail(
                    field="audio_size",
                    value=str(audio_data.get("size", 0)),
                    message="Audio file size in bytes"
                )
            ],
            suggestions=[
                "Try recording a shorter message",
                "Check microphone quality",
                "Ensure stable internet connection"
            ]
        )


class IntelligenceErrorHandler:
    """Specialized error handler for AI intelligence features"""
    
    @staticmethod
    def handle_routine_coaching_error(error: Exception, routine_data: Dict[str, Any]) -> ErrorResponse:
        """Handle routine coaching analysis errors"""
        return ErrorResponse(
            error_code=ErrorCode.AI_PROCESSING_FAILED,
            message="Routine analysis failed",
            user_message="Unable to analyze your routines right now. Please try again later.",
            details=[
                ErrorDetail(
                    field="routine_count",
                    value=str(routine_data.get("count", 0)),
                    message=str(error)
                )
            ],
            suggestions=[
                "Ensure you have routine data",
                "Try again in a few minutes",
                "Check your routine tracking history"
            ]
        )
    
    @staticmethod 
    def handle_project_intelligence_error(error: Exception, project_id: str) -> ErrorResponse:
        """Handle project intelligence analysis errors"""
        return ErrorResponse(
            error_code=ErrorCode.AI_PROCESSING_FAILED,
            message="Project analysis failed",
            user_message="Unable to analyze project health right now. Please try again later.",
            details=[
                ErrorDetail(
                    field="project_id",
                    value=project_id,
                    message=str(error)
                )
            ],
            suggestions=[
                "Ensure project has sufficient data",
                "Check project activity history",
                "Try analyzing a different project"
            ]
        )
    
    @staticmethod
    def handle_calendar_optimization_error(error: Exception, calendar_data: Dict[str, Any]) -> ErrorResponse:
        """Handle calendar optimization errors"""
        return ErrorResponse(
            error_code=ErrorCode.AI_PROCESSING_FAILED,
            message="Calendar optimization failed",
            user_message="Unable to optimize your calendar right now. Please try again later.",
            details=[
                ErrorDetail(
                    field="events_count",
                    value=str(calendar_data.get("events", 0)),
                    message=str(error)
                )
            ],
            suggestions=[
                "Ensure you have calendar events",
                "Check calendar connectivity",
                "Try optimizing a different time period"
            ]
        )


# Global error handler instances
mobile_error_handler = MobileErrorHandler()
voice_error_handler = VoiceErrorHandler()
intelligence_error_handler = IntelligenceErrorHandler()