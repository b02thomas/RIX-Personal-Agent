"""
Authentication endpoints for RIX Main Agent
"""

from app.core.logging import get_logger
from app.middleware.auth import get_current_user, verify_token_endpoint
from app.models.auth import AuthenticatedUser, TokenVerificationRequest, TokenVerificationResponse
from fastapi import APIRouter, Depends, HTTPException, Request

logger = get_logger(__name__)
router = APIRouter()


@router.post("/verify", response_model=TokenVerificationResponse)
async def verify_token(request: TokenVerificationRequest):
    """Verify JWT token endpoint"""
    logger.info("Token verification requested")

    try:
        payload = await verify_token_endpoint(request.token)

        return TokenVerificationResponse(valid=True, payload=payload)

    except HTTPException as e:
        logger.warning("Token verification failed", error=e.detail)
        return TokenVerificationResponse(valid=False, error=e.detail)
    except Exception as e:
        logger.error("Token verification error", error=str(e))
        return TokenVerificationResponse(valid=False, error="Token verification failed")


@router.get("/me", response_model=AuthenticatedUser)
async def get_current_user_info(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get current authenticated user information"""
    logger.info("User info requested", user_id=current_user.user_id)
    return current_user


@router.get("/status")
async def auth_status(request: Request):
    """Get authentication status for current request"""
    user = getattr(request.state, "user", None)

    if user:
        return {
            "authenticated": True,
            "user_id": user.user_id,
            "email": user.email,
            "authenticated_at": user.authenticated_at.isoformat(),
        }
    else:
        return {"authenticated": False}
