"""
JWT Authentication middleware for RIX Main Agent
Compatible with RIX frontend authentication system
"""

import time
from typing import Optional, Set

from app.core.config import settings
from app.core.logging import get_logger
from app.models.auth import AuthenticatedUser, JWTPayload
from fastapi import HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = get_logger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

# Paths that don't require authentication
EXCLUDED_PATHS: Set[str] = {
    "/",
    "/health",
    "/health/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/webhooks/n8n/",  # N8N webhooks use different authentication
}


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """JWT Authentication middleware"""

    async def dispatch(self, request: Request, call_next):
        """Process request with JWT authentication"""

        # Skip authentication for excluded paths
        if self._is_excluded_path(request.url.path):
            return await call_next(request)

        # Skip authentication for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        try:
            # Extract token from request
            token = await self._extract_token(request)

            if not token:
                return JSONResponse(status_code=401, content={"error": "Missing authentication token"})

            # Verify token and get user info
            user = await self._verify_token(token)

            if not user:
                return JSONResponse(status_code=401, content={"error": "Invalid authentication token"})

            # Add user to request state
            request.state.user = user

            # Log successful authentication
            logger.info("User authenticated", user_id=user.user_id, email=user.email, path=request.url.path)

        except HTTPException as e:
            return JSONResponse(status_code=e.status_code, content={"error": e.detail})
        except Exception as e:
            logger.error("Authentication middleware error", error=str(e), path=request.url.path)
            return JSONResponse(status_code=500, content={"error": "Internal authentication error"})

        return await call_next(request)

    def _is_excluded_path(self, path: str) -> bool:
        """Check if path is excluded from authentication"""
        # Exact match
        if path in EXCLUDED_PATHS:
            return True

        # Webhook paths (dynamic)
        if path.startswith("/webhooks/n8n/"):
            return True

        return False

    async def _extract_token(self, request: Request) -> Optional[str]:
        """Extract JWT token from request"""

        # Try Authorization header first
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            return authorization.split(" ")[1]

        # Try cookie (compatible with RIX frontend)
        access_token = request.cookies.get("accessToken")
        if access_token:
            return access_token

        # Try X-Access-Token header
        x_token = request.headers.get("X-Access-Token")
        if x_token:
            return x_token

        return None

    async def _verify_token(self, token: str) -> Optional[AuthenticatedUser]:
        """Verify JWT token and return user info"""
        try:
            # Decode JWT token using same secret as RIX frontend
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

            # Extract user information (compatible with RIX frontend structure)
            user_id = payload.get("sub") or payload.get("userId")
            email = payload.get("email")
            exp = payload.get("exp")

            if not user_id or not email:
                logger.warning("Invalid token payload", payload=payload)
                return None

            # Check expiration
            if exp and exp < time.time():
                logger.warning("Token expired", user_id=user_id)
                return None

            return AuthenticatedUser(user_id=user_id, email=email)

        except JWTError as e:
            logger.warning("JWT verification failed", error=str(e))
            return None
        except Exception as e:
            logger.error("Token verification error", error=str(e))
            return None


async def get_current_user(request: Request) -> AuthenticatedUser:
    """Get current authenticated user from request"""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def verify_token_endpoint(token: str) -> JWTPayload:
    """Verify token for explicit verification endpoint"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

        return JWTPayload(
            userId=payload.get("sub") or payload.get("userId"),
            email=payload.get("email"),
            iat=payload.get("iat"),
            exp=payload.get("exp"),
        )
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
