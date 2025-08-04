"""
Chat endpoints for RIX Main Agent
"""

import asyncio
import time
from datetime import datetime
from typing import List, Optional

from app.core.logging import get_logger
from app.middleware.auth import get_current_user
from app.models.auth import AuthenticatedUser
from app.models.chat import (
    AIProcessingRequest,
    AIProcessingResponse,
    ConversationResponse,
    MessageRequest,
    MessageResponse,
    WorkflowType,
)
from app.models.n8n import N8NWorkflowRequest
from app.services.ai_workflow_intelligence import ai_workflow_intelligence
from app.services.database import database
from app.services.message_router import message_router
from app.services.n8n_client import n8n_client
from app.services.websocket_manager import websocket_manager
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

logger = get_logger(__name__)
router = APIRouter()


@router.post("/message", response_model=AIProcessingResponse)
async def process_message(
    request: MessageRequest, background_tasks: BackgroundTasks, current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Process chat message with AI routing"""
    logger.info(
        "Processing chat message",
        user_id=current_user.user_id,
        conversation_id=request.conversation_id,
        message_length=len(request.content),
    )

    start_time = time.time()

    try:
        # Store user message in database
        user_message = await database.create_message(
            conversation_id=request.conversation_id,
            user_id=current_user.user_id,
            content=request.content,
            message_type=request.message_type.value,
            is_from_ai=False,
            metadata=request.metadata,
        )

        # Send user message update via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_message_update, request.conversation_id, user_message, current_user.user_id
            )

        # Analyze message content to determine workflow
        content_analysis = await message_router.analyze_content(request.content, context=request.metadata)

        logger.info(
            "Content analysis completed",
            workflow=content_analysis.recommended_workflow.value,
            confidence=content_analysis.confidence,
            reasoning=content_analysis.reasoning,
        )

        # Send processing status via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_processing_status,
                current_user.user_id,
                request.conversation_id,
                "processing",
                {"workflow": content_analysis.recommended_workflow.value, "confidence": content_analysis.confidence},
            )

        # Prepare N8N workflow request
        n8n_request = N8NWorkflowRequest(
            workflow_type=content_analysis.recommended_workflow,
            user_id=current_user.user_id,
            conversation_id=request.conversation_id,
            input_data={
                "message": request.content,
                "messageType": request.message_type.value,
                "userMessage": user_message,
                "contentAnalysis": content_analysis.dict(),
                "context": request.metadata or {},
            },
            metadata={"analysis": content_analysis.dict(), "user_message_id": user_message["id"]},
        )

        # Execute N8N workflow
        n8n_response = await n8n_client.execute_workflow(n8n_request)

        # Store AI response in database
        ai_message = await database.create_message(
            conversation_id=request.conversation_id,
            user_id=current_user.user_id,
            content=n8n_response.response,
            message_type=n8n_response.message_type.value,
            is_from_ai=True,
            metadata=n8n_response.metadata,
        )

        # Send AI response via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_ai_response, request.conversation_id, ai_message, current_user.user_id
            )

        processing_time = time.time() - start_time

        # Store N8N execution info if available
        if n8n_response.execution_id:
            background_tasks.add_task(
                database.store_n8n_execution,
                n8n_response.execution_id,
                current_user.user_id,
                n8n_response.workflow_type.value,
                request.conversation_id,
                "completed",
                n8n_request.input_data,
                {"response": n8n_response.response, "metadata": n8n_response.metadata},
            )

        # Process message for AI workflow intelligence triggers
        background_tasks.add_task(
            _process_ai_intelligence_triggers, current_user.user_id, request.content, request.conversation_id
        )

        response = AIProcessingResponse(
            conversation_id=request.conversation_id,
            user_id=current_user.user_id,
            response=n8n_response.response,
            message_type=n8n_response.message_type,
            workflow_type=n8n_response.workflow_type,
            processing_time=processing_time,
            confidence=content_analysis.confidence,
            metadata={
                "content_analysis": content_analysis.dict(),
                "n8n_execution_id": n8n_response.execution_id,
                "n8n_metadata": n8n_response.metadata,
                "user_message_id": user_message["id"],
                "ai_message_id": ai_message["id"],
            },
        )

        logger.info(
            "Message processing completed",
            user_id=current_user.user_id,
            conversation_id=request.conversation_id,
            workflow=n8n_response.workflow_type.value,
            processing_time=processing_time,
        )

        return response

    except Exception as e:
        logger.error(
            "Message processing failed", user_id=current_user.user_id, conversation_id=request.conversation_id, error=str(e)
        )

        # Send error via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_error_message,
                current_user.user_id,
                f"Failed to process message: {str(e)}",
                request.conversation_id,
            )

        raise HTTPException(status_code=500, detail=f"Message processing failed: {str(e)}")


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str, limit: int = 50, current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get messages for a conversation"""
    logger.info("Getting conversation messages", user_id=current_user.user_id, conversation_id=conversation_id, limit=limit)

    try:
        # Verify conversation belongs to user
        conversation = await database.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if conversation["user_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get messages
        messages = await database.get_conversation_messages(conversation_id, limit)

        # Convert to response models
        message_responses = []
        for msg in messages:
            message_responses.append(
                MessageResponse(
                    id=msg["id"],
                    conversation_id=msg["conversation_id"],
                    user_id=msg["user_id"],
                    content=msg["content"],
                    message_type=msg["message_type"],
                    is_from_ai=msg["is_from_ai"],
                    created_at=msg["created_at"],
                    metadata={},  # Add metadata handling if needed
                )
            )

        return message_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get conversation messages", user_id=current_user.user_id, conversation_id=conversation_id, error=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get conversation with messages"""
    logger.info("Getting conversation", user_id=current_user.user_id, conversation_id=conversation_id)

    try:
        # Get conversation details
        conversation = await database.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if conversation["user_id"] != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get messages
        messages = await database.get_conversation_messages(conversation_id)

        # Convert messages to response models
        message_responses = []
        for msg in messages:
            message_responses.append(
                MessageResponse(
                    id=msg["id"],
                    conversation_id=msg["conversation_id"],
                    user_id=msg["user_id"],
                    content=msg["content"],
                    message_type=msg["message_type"],
                    is_from_ai=msg["is_from_ai"],
                    created_at=msg["created_at"],
                    metadata={},
                )
            )

        return ConversationResponse(
            id=conversation["id"],
            user_id=conversation["user_id"],
            title=conversation["title"],
            created_at=conversation["created_at"],
            updated_at=conversation["updated_at"],
            messages=message_responses,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get conversation", user_id=current_user.user_id, conversation_id=conversation_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get conversation: {str(e)}")


@router.post("/analyze", response_model=dict)
async def analyze_message_content(
    content: str, context: Optional[dict] = None, current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Analyze message content without processing"""
    logger.info("Analyzing message content", user_id=current_user.user_id, message_length=len(content))

    try:
        analysis = await message_router.analyze_content(content, context)

        return {
            "recommended_workflow": analysis.recommended_workflow.value,
            "confidence": analysis.confidence,
            "reasoning": analysis.reasoning,
            "keywords": analysis.keywords,
            "intent": analysis.intent,
            "entities": analysis.entities,
        }

    except Exception as e:
        logger.error("Content analysis failed", user_id=current_user.user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Content analysis failed: {str(e)}")


@router.post("/intelligence/analyze", response_model=dict)
async def analyze_user_intelligence(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Analyze user patterns for AI workflow intelligence"""
    logger.info("User intelligence analysis requested", user_id=current_user.user_id)

    try:
        # Get user insights
        insights = await ai_workflow_intelligence.analyze_user_patterns(current_user.user_id)

        return {
            "user_id": current_user.user_id,
            "insights_count": len(insights),
            "insights": [
                {
                    "type": insight.insight_type,
                    "confidence": insight.confidence,
                    "workflow": insight.trigger_workflow.value,
                    "priority": insight.priority,
                    "reasoning": insight.reasoning,
                    "context": insight.context,
                }
                for insight in insights
            ],
            "analysis_timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error("Intelligence analysis failed", user_id=current_user.user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Intelligence analysis failed: {str(e)}")


@router.post("/intelligence/schedule", response_model=dict)
async def schedule_intelligence_analysis(
    background_tasks: BackgroundTasks, current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Schedule periodic intelligence analysis for user"""
    logger.info("Scheduling intelligence analysis", user_id=current_user.user_id)

    try:
        # Schedule analysis in background
        background_tasks.add_task(ai_workflow_intelligence.schedule_intelligence_analysis, current_user.user_id)

        return {
            "status": "scheduled",
            "message": "Intelligence analysis scheduled",
            "user_id": current_user.user_id,
            "scheduled_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error("Failed to schedule intelligence analysis", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to schedule analysis: {str(e)}")


@router.get("/websocket/status")
async def websocket_status(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get WebSocket connection status"""
    is_connected = websocket_manager.is_user_connected(current_user.user_id)
    connection_stats = websocket_manager.get_connection_stats()

    return {
        "user_connected": is_connected,
        "user_id": current_user.user_id,
        "total_connections": connection_stats["total_connections"],
        "connection_info": connection_stats["connections"].get(current_user.user_id),
    }


async def _process_ai_intelligence_triggers(user_id: str, message: str, conversation_id: str):
    """Process message for AI workflow intelligence triggers"""
    try:
        logger.info("Processing AI intelligence triggers", user_id=user_id, conversation_id=conversation_id)

        # Analyze message for workflow triggers
        insights = await ai_workflow_intelligence.process_message_for_triggers(
            user_id=user_id, message=message, conversation_id=conversation_id
        )

        if insights:
            logger.info("AI intelligence insights generated", user_id=user_id, insights_count=len(insights))

            # Execute high-confidence insights automatically
            high_confidence_insights = [
                insight for insight in insights if insight.confidence >= 0.85  # High threshold for auto-execution
            ]

            if high_confidence_insights:
                execution_results = await ai_workflow_intelligence.execute_intelligence_insights(high_confidence_insights)

                logger.info(
                    "AI-triggered workflows executed",
                    user_id=user_id,
                    executed=execution_results["executed"],
                    failed=execution_results["failed"],
                )

    except Exception as e:
        logger.error("Failed to process AI intelligence triggers", user_id=user_id, error=str(e))
