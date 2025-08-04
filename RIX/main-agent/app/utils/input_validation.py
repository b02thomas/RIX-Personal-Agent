# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/utils/input_validation.py
# Comprehensive input validation and sanitization utilities
# This module provides secure validation and sanitization for user inputs
# RELEVANT FILES: app/api/endpoints/*.py, app/middleware/auth.py, app/models/schemas.py

import html
import re
import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse

import bleach


class ValidationError(Exception):
    """Custom exception for validation errors"""

    pass


class InputValidator:
    """
    Comprehensive input validation and sanitization utilities

    This class provides methods to validate and sanitize various types of input
    to prevent injection attacks, XSS, and other security vulnerabilities.
    """

    # Regular expressions for common validation patterns
    UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.IGNORECASE)
    EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")
    SAFE_STRING_PATTERN = re.compile(r"^[a-zA-Z0-9\s\-_.,!?()]+$")

    # Allowed HTML tags for content sanitization
    ALLOWED_HTML_TAGS = [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "code",
        "pre",
        "a",
        "img",
    ]

    ALLOWED_HTML_ATTRIBUTES = {"a": ["href", "title"], "img": ["src", "alt", "title", "width", "height"], "*": ["class"]}

    @classmethod
    def validate_uuid(cls, value: Any, field_name: str = "UUID") -> str:
        """
        Validate and return a UUID string

        Args:
            value: The value to validate
            field_name: Name of the field for error messages

        Returns:
            Valid UUID string

        Raises:
            ValidationError: If the UUID is invalid
        """
        if not value:
            raise ValidationError(f"{field_name} is required")

        value_str = str(value).strip()

        if not cls.UUID_PATTERN.match(value_str):
            raise ValidationError(f"{field_name} must be a valid UUID")

        try:
            # Validate that it can be parsed as a UUID
            uuid.UUID(value_str)
            return value_str
        except ValueError:
            raise ValidationError(f"{field_name} must be a valid UUID")

    @classmethod
    def validate_email(cls, value: Any, field_name: str = "Email") -> str:
        """
        Validate and return an email address

        Args:
            value: The value to validate
            field_name: Name of the field for error messages

        Returns:
            Valid email string

        Raises:
            ValidationError: If the email is invalid
        """
        if not value:
            raise ValidationError(f"{field_name} is required")

        value_str = str(value).strip().lower()

        if len(value_str) > 254:  # RFC 5321 limit
            raise ValidationError(f"{field_name} must be 254 characters or less")

        if not cls.EMAIL_PATTERN.match(value_str):
            raise ValidationError(f"{field_name} must be a valid email address")

        return value_str

    @classmethod
    def validate_string(
        cls,
        value: Any,
        field_name: str = "String",
        min_length: int = 0,
        max_length: int = 1000,
        allow_empty: bool = False,
        pattern: Optional[re.Pattern] = None,
    ) -> str:
        """
        Validate and sanitize a string input

        Args:
            value: The value to validate
            field_name: Name of the field for error messages
            min_length: Minimum allowed length
            max_length: Maximum allowed length
            allow_empty: Whether to allow empty strings
            pattern: Optional regex pattern to match

        Returns:
            Valid sanitized string

        Raises:
            ValidationError: If the string is invalid
        """
        if value is None:
            if allow_empty:
                return ""
            raise ValidationError(f"{field_name} is required")

        value_str = str(value).strip()

        if not allow_empty and not value_str:
            raise ValidationError(f"{field_name} cannot be empty")

        if len(value_str) < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters")

        if len(value_str) > max_length:
            raise ValidationError(f"{field_name} must be {max_length} characters or less")

        if pattern and not pattern.match(value_str):
            raise ValidationError(f"{field_name} contains invalid characters")

        # Basic XSS prevention - escape HTML entities
        return html.escape(value_str)

    @classmethod
    def validate_slug(cls, value: Any, field_name: str = "Slug") -> str:
        """
        Validate a URL-safe slug string

        Args:
            value: The value to validate
            field_name: Name of the field for error messages

        Returns:
            Valid slug string

        Raises:
            ValidationError: If the slug is invalid
        """
        return cls.validate_string(value, field_name=field_name, min_length=1, max_length=100, pattern=cls.SLUG_PATTERN)

    @classmethod
    def validate_integer(
        cls, value: Any, field_name: str = "Integer", min_value: Optional[int] = None, max_value: Optional[int] = None
    ) -> int:
        """
        Validate an integer input

        Args:
            value: The value to validate
            field_name: Name of the field for error messages
            min_value: Minimum allowed value
            max_value: Maximum allowed value

        Returns:
            Valid integer

        Raises:
            ValidationError: If the integer is invalid
        """
        if value is None:
            raise ValidationError(f"{field_name} is required")

        try:
            int_value = int(value)
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} must be a valid integer")

        if min_value is not None and int_value < min_value:
            raise ValidationError(f"{field_name} must be at least {min_value}")

        if max_value is not None and int_value > max_value:
            raise ValidationError(f"{field_name} must be at most {max_value}")

        return int_value

    @classmethod
    def validate_url(cls, value: Any, field_name: str = "URL") -> str:
        """
        Validate a URL

        Args:
            value: The value to validate
            field_name: Name of the field for error messages

        Returns:
            Valid URL string

        Raises:
            ValidationError: If the URL is invalid
        """
        if not value:
            raise ValidationError(f"{field_name} is required")

        value_str = str(value).strip()

        try:
            parsed = urlparse(value_str)
            if not parsed.scheme or not parsed.netloc:
                raise ValidationError(f"{field_name} must be a valid URL")

            # Only allow http and https schemes for security
            if parsed.scheme not in ("http", "https"):
                raise ValidationError(f"{field_name} must use http or https protocol")

            return value_str
        except Exception:
            raise ValidationError(f"{field_name} must be a valid URL")

    @classmethod
    def validate_datetime(cls, value: Any, field_name: str = "DateTime") -> datetime:
        """
        Validate a datetime input

        Args:
            value: The value to validate
            field_name: Name of the field for error messages

        Returns:
            Valid datetime object

        Raises:
            ValidationError: If the datetime is invalid
        """
        if not value:
            raise ValidationError(f"{field_name} is required")

        if isinstance(value, datetime):
            return value

        if isinstance(value, str):
            try:
                # Try to parse ISO format
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                raise ValidationError(f"{field_name} must be a valid datetime in ISO format")

        raise ValidationError(f"{field_name} must be a valid datetime")

    @classmethod
    def sanitize_html_content(cls, value: Any, field_name: str = "Content") -> str:
        """
        Sanitize HTML content to prevent XSS attacks

        Args:
            value: The HTML content to sanitize
            field_name: Name of the field for error messages

        Returns:
            Sanitized HTML content

        Raises:
            ValidationError: If the content is invalid
        """
        if not value:
            return ""

        value_str = str(value).strip()

        try:
            # Use bleach to sanitize HTML content
            sanitized = bleach.clean(value_str, tags=cls.ALLOWED_HTML_TAGS, attributes=cls.ALLOWED_HTML_ATTRIBUTES, strip=True)
            return sanitized
        except Exception as e:
            raise ValidationError(f"Failed to sanitize {field_name}: {str(e)}")

    @classmethod
    def validate_json_object(cls, value: Any, field_name: str = "JSON") -> Dict[str, Any]:
        """
        Validate a JSON object

        Args:
            value: The value to validate
            field_name: Name of the field for error messages

        Returns:
            Valid dictionary object

        Raises:
            ValidationError: If the JSON is invalid
        """
        if value is None:
            return {}

        if isinstance(value, dict):
            return value

        if isinstance(value, str):
            try:
                import json

                parsed = json.loads(value)
                if not isinstance(parsed, dict):
                    raise ValidationError(f"{field_name} must be a JSON object")
                return parsed
            except json.JSONDecodeError:
                raise ValidationError(f"{field_name} must be valid JSON")

        raise ValidationError(f"{field_name} must be a JSON object")

    @classmethod
    def validate_list(
        cls,
        value: Any,
        field_name: str = "List",
        item_validator: Optional[callable] = None,
        min_items: int = 0,
        max_items: int = 100,
    ) -> List[Any]:
        """
        Validate a list input

        Args:
            value: The value to validate
            field_name: Name of the field for error messages
            item_validator: Optional function to validate each item
            min_items: Minimum number of items
            max_items: Maximum number of items

        Returns:
            Valid list

        Raises:
            ValidationError: If the list is invalid
        """
        if value is None:
            value = []

        if not isinstance(value, list):
            raise ValidationError(f"{field_name} must be a list")

        if len(value) < min_items:
            raise ValidationError(f"{field_name} must have at least {min_items} items")

        if len(value) > max_items:
            raise ValidationError(f"{field_name} must have at most {max_items} items")

        if item_validator:
            validated_items = []
            for i, item in enumerate(value):
                try:
                    validated_item = item_validator(item)
                    validated_items.append(validated_item)
                except ValidationError as e:
                    raise ValidationError(f"{field_name}[{i}]: {str(e)}")
            return validated_items

        return value

    @classmethod
    def validate_pagination_params(cls, page: Any = 1, page_size: Any = 20, max_page_size: int = 100) -> Dict[str, int]:
        """
        Validate pagination parameters

        Args:
            page: Page number
            page_size: Items per page
            max_page_size: Maximum allowed page size

        Returns:
            Dictionary with validated pagination parameters

        Raises:
            ValidationError: If pagination parameters are invalid
        """
        validated_page = cls.validate_integer(page, "page", min_value=1, max_value=10000)
        validated_page_size = cls.validate_integer(page_size, "page_size", min_value=1, max_value=max_page_size)

        return {"page": validated_page, "page_size": validated_page_size}


class SecurityValidator:
    """
    Additional security-focused validation utilities
    """

    @staticmethod
    def validate_no_sql_injection(value: str, field_name: str = "Input") -> str:
        """
        Check for potential SQL injection patterns

        Args:
            value: The string to check
            field_name: Name of the field for error messages

        Returns:
            The input string if safe

        Raises:
            ValidationError: If potential SQL injection is detected
        """
        if not isinstance(value, str):
            return str(value)

        # Common SQL injection patterns
        dangerous_patterns = [
            r"('|(\\x27)|(\\x2D)|(\\x2D)|(\\x2D))",  # SQL quote variations
            r";",  # SQL statement separator
            r"--",  # SQL comment
            r"/\\*.*\\*/",  # SQL comment block
            r"(union|select|insert|update|delete|drop|create|alter|exec|execute)",  # SQL keywords
            r"(script|javascript|vbscript|onload|onerror|onclick)",  # Script injection
        ]

        value_lower = value.lower()
        for pattern in dangerous_patterns:
            if re.search(pattern, value_lower, re.IGNORECASE):
                raise ValidationError(f"{field_name} contains potentially dangerous content")

        return value

    @staticmethod
    def validate_file_upload_safety(
        filename: str, content_type: str, max_size: int = 10 * 1024 * 1024  # 10MB default
    ) -> bool:
        """
        Validate file upload safety

        Args:
            filename: Name of the uploaded file
            content_type: MIME type of the file
            max_size: Maximum allowed file size in bytes

        Returns:
            True if file is safe to upload

        Raises:
            ValidationError: If file is unsafe
        """
        # Validate filename
        if not filename:
            raise ValidationError("Filename is required")

        # Check for path traversal attempts
        if ".." in filename or "/" in filename or "\\" in filename:
            raise ValidationError("Filename contains invalid path characters")

        # Validate file extension
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".txt", ".csv", ".json"}
        file_ext = filename.lower().split(".")[-1] if "." in filename else ""

        if f".{file_ext}" not in allowed_extensions:
            raise ValidationError(f"File type .{file_ext} is not allowed")

        # Validate content type
        allowed_content_types = {
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/pdf",
            "text/plain",
            "text/csv",
            "application/json",
        }

        if content_type not in allowed_content_types:
            raise ValidationError(f"Content type {content_type} is not allowed")

        return True
