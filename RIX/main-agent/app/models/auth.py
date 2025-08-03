"""
Authentication models for RIX Main Agent
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class JWTPayload(BaseModel):
    """JWT token payload structure - compatible with RIX frontend"""
    userId: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    iat: int = Field(..., description="Issued at timestamp")
    exp: int = Field(..., description="Expiration timestamp")


class TokenVerificationRequest(BaseModel):
    """Request model for token verification"""
    token: str = Field(..., description="JWT token to verify")


class TokenVerificationResponse(BaseModel):
    """Response model for token verification"""
    valid: bool = Field(..., description="Whether token is valid")
    payload: Optional[JWTPayload] = Field(None, description="Token payload if valid")
    error: Optional[str] = Field(None, description="Error message if invalid")


class AuthenticatedUser(BaseModel):
    """Authenticated user information"""
    user_id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    authenticated_at: datetime = Field(default_factory=datetime.utcnow, description="Authentication timestamp")