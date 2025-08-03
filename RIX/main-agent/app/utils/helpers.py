"""
Utility functions for RIX Main Agent
"""

import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any


def generate_uuid() -> str:
    """Generate a new UUID"""
    return str(uuid.uuid4())


def generate_hash(text: str) -> str:
    """Generate SHA-256 hash of text"""
    return hashlib.sha256(text.encode()).hexdigest()


def utc_now() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)


def format_timestamp(dt: datetime) -> str:
    """Format datetime as ISO string"""
    return dt.isoformat()


def safe_get(data: Dict[str, Any], key: str, default: Any = None) -> Any:
    """Safely get value from dictionary"""
    return data.get(key, default)


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to maximum length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def validate_conversation_id(conversation_id: str) -> bool:
    """Validate conversation ID format"""
    try:
        # Check if it's a valid UUID or has expected format
        if len(conversation_id) < 5 or len(conversation_id) > 100:
            return False
        # Add more validation as needed
        return True
    except:
        return False


def sanitize_message_content(content: str) -> str:
    """Sanitize message content"""
    # Remove potentially harmful characters
    sanitized = content.strip()
    # Add more sanitization as needed
    return sanitized


def extract_metadata_safely(data: Dict[str, Any], allowed_keys: Optional[list] = None) -> Dict[str, Any]:
    """Safely extract metadata from dictionary"""
    if not allowed_keys:
        allowed_keys = ["timestamp", "source", "type", "priority", "category"]
    
    metadata = {}
    for key in allowed_keys:
        if key in data:
            metadata[key] = data[key]
    
    return metadata