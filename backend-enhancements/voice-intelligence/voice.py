# /Users/benediktthomas/RIX Personal Agent/backend-enhancements/voice-intelligence/voice.py
# Enhanced Voice Processing API endpoint for RIX Main Agent
# Integrates with Enhanced Voice Processor and provides German intelligence voice processing
# RELEVANT FILES: enhanced_voice_processor.py, voice_session_manager.py, main-agent/app/api/endpoints/chat.py

import asyncio
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

# Import from main agent (these would be adjusted for actual integration)
try:
    from app.core.config import settings
    from app.middleware.auth import get_current_user
    from app.models.auth import AuthenticatedUser
    from app.models.chat import MessageType, WorkflowType
    from app.services.database import database
    from app.services.mcp_router import mcp_router

    MAIN_AGENT_AVAILABLE = True
except ImportError:
    # Fallback for standalone testing
    MAIN_AGENT_AVAILABLE = False

from .audio_utils import AudioUtils
from .enhanced_voice_processor import EnhancedVoiceProcessor
from .voice_session_manager import VoiceSessionManager

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize enhanced voice processor (would be configured from settings in production)
voice_processor = None
session_manager = VoiceSessionManager()
audio_utils = AudioUtils()


# Pydantic models for API
class VoiceProcessingRequest(BaseModel):
    """Request model for voice processing"""

    session_id: Optional[str] = Field(None, description="Optional session ID for chunk processing")
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID for context")
    language: Optional[str] = Field("de", description="Target language for processing")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional processing metadata")


class VoiceProcessingResponse(BaseModel):
    """Response model for voice processing"""

    success: bool = Field(..., description="Processing success status")
    processing_id: str = Field(..., description="Unique processing identifier")
    session_id: Optional[str] = Field(None, description="Session identifier")
    transcription: Optional[str] = Field(None, description="Transcribed text")
    language: Optional[str] = Field(None, description="Detected/processed language")
    confidence: float = Field(0.0, description="Transcription confidence score")
    processing_time: float = Field(0.0, description="Processing time in seconds")
    german_optimized: bool = Field(False, description="German optimization applied")
    error: Optional[str] = Field(None, description="Error message if processing failed")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional response metadata")


class VoiceSessionResponse(BaseModel):
    """Response model for voice session operations"""

    success: bool = Field(..., description="Operation success status")
    session_id: str = Field(..., description="Session identifier")
    session_type: str = Field(..., description="Session type")
    created_at: datetime = Field(..., description="Session creation timestamp")
    stats: Dict[str, Any] = Field(..., description="Session statistics")


class VoiceChunkRequest(BaseModel):
    """Request model for adding audio chunks to session"""

    session_id: str = Field(..., description="Session identifier")
    chunk_metadata: Optional[Dict[str, Any]] = Field(None, description="Chunk metadata")


class HealthCheckResponse(BaseModel):
    """Response model for health check"""

    status: str = Field(..., description="Overall health status")
    components: Dict[str, Any] = Field(..., description="Component health status")
    performance_target_met: bool = Field(..., description="Performance target met status")
    timestamp: datetime = Field(..., description="Health check timestamp")


async def get_voice_processor() -> EnhancedVoiceProcessor:
    """
    Get or initialize voice processor instance

    Returns:
        Enhanced voice processor instance
    """
    global voice_processor

    if voice_processor is None:
        # In production, get API key from settings
        api_key = getattr(settings, "OPENAI_API_KEY", "test-key")
        target_language = getattr(settings, "VOICE_TARGET_LANGUAGE", "de")

        voice_processor = EnhancedVoiceProcessor(openai_api_key=api_key, target_language=target_language)

    return voice_processor


def get_current_user_fallback():
    """Fallback for current user when main agent not available"""
    if MAIN_AGENT_AVAILABLE:
        return get_current_user()
    else:
        # Mock user for testing
        from dataclasses import dataclass

        @dataclass
        class MockUser:
            user_id: str = "test-user"

        return MockUser()


@router.post("/process", response_model=VoiceProcessingResponse)
async def process_voice_input(
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    request_data: str = Form(default="{}"),
    current_user=Depends(get_current_user_fallback),
):
    """
    Process voice input with German intelligence enhancement

    Args:
        audio_file: Audio file upload
        request_data: JSON string with processing parameters
        current_user: Authenticated user

    Returns:
        Voice processing results
    """
    processing_start = time.time()

    logger.info(
        f"Voice processing request from user {current_user.user_id}",
        extra={
            "user_id": current_user.user_id,
            "filename": audio_file.filename,
            "content_type": audio_file.content_type,
        },
    )

    try:
        # Parse request data
        import json

        try:
            request_params = json.loads(request_data) if request_data != "{}" else {}
        except json.JSONDecodeError:
            request_params = {}

        # Validate audio file
        if not audio_file.filename:
            raise HTTPException(status_code=400, detail="No audio file provided")

        # Read audio data
        audio_data = await audio_file.read()
        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")

        # Get voice processor
        processor = await get_voice_processor()

        # Process voice input
        result = await processor.process_voice_input(
            user_id=current_user.user_id,
            audio_data=audio_data,
            session_id=request_params.get("session_id"),
            metadata={
                "filename": audio_file.filename,
                "content_type": audio_file.content_type,
                "conversation_id": request_params.get("conversation_id"),
                "language": request_params.get("language", "de"),
                **request_params.get("metadata", {}),
            },
        )

        # Create response
        response = VoiceProcessingResponse(
            success=result["success"],
            processing_id=result["processing_id"],
            session_id=result.get("session_id"),
            transcription=result.get("transcription"),
            language=result.get("language"),
            confidence=result.get("confidence", 0.0),
            processing_time=result.get("processing_time", 0.0),
            german_optimized=result.get("german_optimized", False),
            error=result.get("error"),
            metadata=result.get("metadata", {}),
        )

        # If processing successful and MCP integration available, route to conversation
        if result["success"] and result.get("transcription") and MAIN_AGENT_AVAILABLE:
            background_tasks.add_task(
                _route_transcription_to_mcp,
                current_user.user_id,
                result["transcription"],
                request_params.get("conversation_id"),
                result,
            )

        logger.info(
            f"Voice processing completed",
            extra={
                "user_id": current_user.user_id,
                "processing_id": result["processing_id"],
                "success": result["success"],
                "processing_time": result.get("processing_time", 0.0),
            },
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - processing_start

        logger.error(
            f"Voice processing failed",
            extra={"user_id": current_user.user_id, "error": str(e), "processing_time": processing_time},
        )

        return VoiceProcessingResponse(
            success=False,
            processing_id="error",
            error=str(e),
            processing_time=processing_time,
            confidence=0.0,
            german_optimized=False,
        )


@router.post("/session/create", response_model=VoiceSessionResponse)
async def create_voice_session(
    session_type: str = "single", metadata: Optional[Dict[str, Any]] = None, current_user=Depends(get_current_user_fallback)
):
    """
    Create a new voice processing session

    Args:
        session_type: Type of session (single, multi-chunk, continuous)
        metadata: Optional session metadata
        current_user: Authenticated user

    Returns:
        Session creation results
    """
    try:
        session_id = await session_manager.create_session(
            user_id=current_user.user_id, session_type=session_type, metadata=metadata
        )

        session = await session_manager.get_session(session_id)

        logger.info(
            f"Voice session created",
            extra={"user_id": current_user.user_id, "session_id": session_id, "session_type": session_type},
        )

        return VoiceSessionResponse(
            success=True,
            session_id=session_id,
            session_type=session_type,
            created_at=session["created_at"],
            stats=session["stats"],
        )

    except Exception as e:
        logger.error(f"Session creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")


@router.post("/session/{session_id}/add-chunk")
async def add_audio_chunk(
    session_id: str,
    audio_file: UploadFile = File(...),
    chunk_metadata: str = Form(default="{}"),
    current_user=Depends(get_current_user_fallback),
):
    """
    Add audio chunk to existing session

    Args:
        session_id: Session identifier
        audio_file: Audio chunk file
        chunk_metadata: JSON string with chunk metadata
        current_user: Authenticated user

    Returns:
        Chunk addition results
    """
    try:
        # Validate session exists and belongs to user
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["user_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Read audio data
        audio_data = await audio_file.read()

        # Parse metadata
        import json

        try:
            metadata = json.loads(chunk_metadata) if chunk_metadata != "{}" else {}
        except json.JSONDecodeError:
            metadata = {}

        # Add chunk to session
        success = await session_manager.add_audio_chunk(
            session_id=session_id,
            chunk_data=audio_data,
            chunk_metadata={"filename": audio_file.filename, "content_type": audio_file.content_type, **metadata},
        )

        if not success:
            raise HTTPException(status_code=400, detail="Failed to add chunk to session")

        logger.info(
            f"Audio chunk added to session",
            extra={"user_id": current_user.user_id, "session_id": session_id, "chunk_size": len(audio_data)},
        )

        return {"success": True, "message": "Chunk added successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add chunk failed: {e}")
        raise HTTPException(status_code=500, detail=f"Add chunk failed: {str(e)}")


@router.post("/session/{session_id}/process")
async def process_session_chunks(
    session_id: str, background_tasks: BackgroundTasks, current_user=Depends(get_current_user_fallback)
):
    """
    Process all audio chunks in a session

    Args:
        session_id: Session identifier
        current_user: Authenticated user

    Returns:
        Session processing results
    """
    try:
        # Validate session
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["user_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get audio chunks
        chunks = await session_manager.get_audio_chunks(session_id)
        if not chunks:
            raise HTTPException(status_code=400, detail="No audio chunks in session")

        # Get voice processor and process chunks
        processor = await get_voice_processor()
        result = await processor.process_audio_chunks(user_id=current_user.user_id, audio_chunks=chunks, session_id=session_id)

        # Clear processed chunks
        await session_manager.clear_audio_chunks(session_id)

        logger.info(
            f"Session chunks processed",
            extra={"user_id": current_user.user_id, "session_id": session_id, "chunks_processed": len(chunks)},
        )

        return VoiceProcessingResponse(
            success=result["success"],
            processing_id=result["processing_id"],
            session_id=session_id,
            transcription=result.get("transcription"),
            language=result.get("language"),
            confidence=result.get("confidence", 0.0),
            processing_time=result.get("processing_time", 0.0),
            german_optimized=result.get("german_optimized", False),
            error=result.get("error"),
            metadata=result.get("metadata", {}),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Session processing failed: {str(e)}")


@router.get("/session/{session_id}")
async def get_session_info(session_id: str, current_user=Depends(get_current_user_fallback)):
    """
    Get session information and statistics

    Args:
        session_id: Session identifier
        current_user: Authenticated user

    Returns:
        Session information
    """
    try:
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["user_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        return {
            "session_id": session_id,
            "user_id": session["user_id"],
            "session_type": session["session_type"],
            "status": session["status"],
            "created_at": session["created_at"],
            "last_activity": session["last_activity"],
            "stats": session["stats"],
            "chunk_count": len(session["audio_chunks"]),
            "metadata": session["metadata"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get session info failed: {e}")
        raise HTTPException(status_code=500, detail=f"Get session info failed: {str(e)}")


@router.delete("/session/{session_id}")
async def close_session(session_id: str, current_user=Depends(get_current_user_fallback)):
    """
    Close and clean up a session

    Args:
        session_id: Session identifier
        current_user: Authenticated user

    Returns:
        Session closure results
    """
    try:
        # Validate session ownership
        session = await session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session["user_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Close session
        success = await session_manager.close_session(session_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to close session")

        logger.info(f"Voice session closed", extra={"user_id": current_user.user_id, "session_id": session_id})

        return {"success": True, "message": "Session closed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Close session failed: {e}")
        raise HTTPException(status_code=500, detail=f"Close session failed: {str(e)}")


@router.get("/sessions")
async def get_user_sessions(current_user=Depends(get_current_user_fallback)):
    """
    Get all active sessions for current user

    Args:
        current_user: Authenticated user

    Returns:
        List of user sessions
    """
    try:
        sessions = await session_manager.get_user_sessions(current_user.user_id)

        return {"user_id": current_user.user_id, "sessions": sessions, "session_count": len(sessions)}

    except Exception as e:
        logger.error(f"Get user sessions failed: {e}")
        raise HTTPException(status_code=500, detail=f"Get user sessions failed: {str(e)}")


@router.get("/stats")
async def get_processing_stats(current_user=Depends(get_current_user_fallback)):
    """
    Get voice processing and session statistics

    Args:
        current_user: Authenticated user

    Returns:
        Processing statistics
    """
    try:
        # Get processor stats
        processor = await get_voice_processor()
        processor_stats = await processor.get_processing_stats()

        # Get session stats
        session_stats = await session_manager.get_session_stats()

        # Get audio utils stats
        audio_stats = await audio_utils.get_processing_stats()

        return {
            "voice_processor": processor_stats,
            "session_manager": session_stats,
            "audio_utils": audio_stats,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Get stats failed: {e}")
        raise HTTPException(status_code=500, detail=f"Get stats failed: {str(e)}")


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Perform comprehensive health check of voice processing system

    Returns:
        Health check results
    """
    try:
        # Check all components
        processor = await get_voice_processor()
        processor_health = await processor.health_check()

        session_health = await session_manager.health_check()
        audio_health = await audio_utils.health_check()

        # Determine overall status
        all_healthy = all([processor_health["status"] == "healthy", session_health["healthy"], audio_health["healthy"]])

        overall_status = "healthy" if all_healthy else "degraded"

        return HealthCheckResponse(
            status=overall_status,
            components={
                "voice_processor": processor_health,
                "session_manager": session_health,
                "audio_utils": audio_health,
            },
            performance_target_met=processor_health.get("processing_stats", {}).get("performance_target_met", False),
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="unhealthy", components={"error": str(e)}, performance_target_met=False, timestamp=datetime.utcnow()
        )


async def _route_transcription_to_mcp(
    user_id: str, transcription: str, conversation_id: Optional[str], voice_result: Dict[str, Any]
):
    """
    Route successful transcription to MCP for further processing

    Args:
        user_id: User identifier
        transcription: Transcribed text
        conversation_id: Optional conversation ID
        voice_result: Voice processing result
    """
    try:
        if not MAIN_AGENT_AVAILABLE:
            return

        # Route to MCP voice processing endpoint
        mcp_result = await mcp_router.route_request(
            user_id=user_id,
            sub_agent_type="voice",
            action="process_transcription",
            payload={
                "transcription": transcription,
                "conversation_id": conversation_id,
                "voice_metadata": voice_result.get("metadata", {}),
                "language": voice_result.get("language"),
                "confidence": voice_result.get("confidence", 0.0),
            },
            context={
                "processing_id": voice_result["processing_id"],
                "session_id": voice_result.get("session_id"),
                "german_optimized": voice_result.get("german_optimized", False),
            },
        )

        logger.info(
            f"Transcription routed to MCP",
            extra={
                "user_id": user_id,
                "processing_id": voice_result["processing_id"],
                "mcp_success": mcp_result.get("success", False),
            },
        )

    except Exception as e:
        logger.error(f"MCP routing failed: {e}")


# Startup and shutdown events
@router.on_event("startup")
async def startup_voice_intelligence():
    """Initialize voice intelligence components"""
    try:
        logger.info("Starting Voice Intelligence Phase 1")

        # Initialize components
        processor = await get_voice_processor()
        health = await processor.health_check()

        logger.info(f"Voice Intelligence Phase 1 started successfully", extra={"health_status": health["status"]})

    except Exception as e:
        logger.error(f"Voice Intelligence startup failed: {e}")


@router.on_event("shutdown")
async def shutdown_voice_intelligence():
    """Cleanup voice intelligence components"""
    try:
        logger.info("Shutting down Voice Intelligence Phase 1")

        # Cleanup components
        if voice_processor:
            await voice_processor.cleanup()

        await session_manager.cleanup()
        await audio_utils.cleanup()

        logger.info("Voice Intelligence Phase 1 shutdown completed")

    except Exception as e:
        logger.error(f"Voice Intelligence shutdown failed: {e}")
