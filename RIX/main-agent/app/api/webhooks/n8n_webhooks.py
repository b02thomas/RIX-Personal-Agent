"""
N8N webhook handlers for RIX Main Agent
Receives responses from N8N workflows
"""

import hashlib
import hmac
import json
from datetime import datetime
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.models.chat import MessageType, WorkflowType
from app.models.n8n import ExecutionStatus, N8NWebhookData
from app.services.database import database
from app.services.websocket_manager import websocket_manager
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

logger = get_logger(__name__)
router = APIRouter()


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify webhook signature"""
    if not secret:
        logger.warning("Webhook secret not configured, skipping signature verification")
        return True

    try:
        expected_signature = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()

        # Compare signatures safely
        return hmac.compare_digest(f"sha256={expected_signature}", signature)
    except Exception as e:
        logger.error("Signature verification failed", error=str(e))
        return False


@router.post("/n8n/{workflow_type}")
async def handle_n8n_webhook(workflow_type: str, request: Request, background_tasks: BackgroundTasks):
    """Handle incoming N8N webhook"""
    logger.info("N8N webhook received", workflow_type=workflow_type)

    try:
        # Get request payload
        payload = await request.body()

        # Verify signature if secret is configured
        signature = request.headers.get("X-N8N-Signature", "")
        if settings.N8N_WEBHOOK_SECRET:
            if not verify_webhook_signature(payload, signature, settings.N8N_WEBHOOK_SECRET):
                logger.warning("Invalid webhook signature", workflow_type=workflow_type)
                raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse payload
        try:
            data = json.loads(payload.decode("utf-8"))
        except json.JSONDecodeError as e:
            logger.error("Invalid JSON payload", error=str(e))
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        # Validate workflow type
        try:
            workflow_enum = WorkflowType(workflow_type.replace("_", "-"))
        except ValueError:
            logger.error("Invalid workflow type", workflow_type=workflow_type)
            raise HTTPException(status_code=400, detail=f"Invalid workflow type: {workflow_type}")

        # Extract required fields
        user_id = data.get("userId") or data.get("user_id")
        conversation_id = data.get("conversationId") or data.get("conversation_id")
        execution_id = data.get("executionId") or data.get("execution_id")

        if not user_id:
            logger.error("Missing user_id in webhook payload")
            raise HTTPException(status_code=400, detail="Missing user_id")

        # Create webhook data object
        webhook_data = N8NWebhookData(
            workflow_type=workflow_enum,
            execution_id=execution_id or f"webhook-{int(datetime.utcnow().timestamp())}",
            user_id=user_id,
            conversation_id=conversation_id,
            status=ExecutionStatus(data.get("status", "completed")),
            result=data.get("result") or data.get("data"),
            error=data.get("error"),
            processing_time=data.get("processingTime") or data.get("processing_time"),
            metadata=data.get("metadata", {}),
        )

        # Process webhook data in background
        background_tasks.add_task(process_webhook_data, webhook_data, data)

        logger.info(
            "Webhook processed successfully",
            workflow_type=workflow_type,
            user_id=user_id,
            execution_id=webhook_data.execution_id,
        )

        return {
            "status": "success",
            "message": "Webhook processed",
            "execution_id": webhook_data.execution_id,
            "workflow_type": workflow_type,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Webhook processing failed", workflow_type=workflow_type, error=str(e))
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")


async def process_webhook_data(webhook_data: N8NWebhookData, raw_data: dict):
    """Process webhook data in background"""
    try:
        logger.info(
            "Processing webhook data",
            workflow_type=webhook_data.workflow_type.value,
            user_id=webhook_data.user_id,
            status=webhook_data.status.value,
        )

        # Store execution info in database
        await database.store_n8n_execution(
            webhook_data.execution_id,
            webhook_data.user_id,
            webhook_data.workflow_type.value,
            webhook_data.conversation_id,
            webhook_data.status.value,
            raw_data.get("input_data"),
            webhook_data.result,
            webhook_data.error,
        )

        # Handle successful execution
        if webhook_data.status == ExecutionStatus.COMPLETED and webhook_data.result:
            await handle_successful_execution(webhook_data, raw_data)

        # Handle failed execution
        elif webhook_data.status == ExecutionStatus.FAILED:
            await handle_failed_execution(webhook_data)

        logger.info(
            "Webhook data processed successfully", execution_id=webhook_data.execution_id, status=webhook_data.status.value
        )

    except Exception as e:
        logger.error("Failed to process webhook data", execution_id=webhook_data.execution_id, error=str(e))


async def handle_successful_execution(webhook_data: N8NWebhookData, raw_data: dict):
    """Handle successful N8N execution"""
    try:
        # Extract response from result
        response_text = ""
        if isinstance(webhook_data.result, dict):
            response_text = (
                webhook_data.result.get("response")
                or webhook_data.result.get("message")
                or webhook_data.result.get("output")
                or str(webhook_data.result)
            )
        elif isinstance(webhook_data.result, str):
            response_text = webhook_data.result
        else:
            response_text = str(webhook_data.result)

        # Create AI message in database if conversation exists
        if webhook_data.conversation_id and response_text:
            try:
                ai_message = await database.create_message(
                    conversation_id=webhook_data.conversation_id,
                    user_id=webhook_data.user_id,
                    content=response_text,
                    message_type=MessageType.TEXT.value,
                    is_from_ai=True,
                    metadata={
                        "workflow_type": webhook_data.workflow_type.value,
                        "execution_id": webhook_data.execution_id,
                        "processing_time": webhook_data.processing_time,
                        "n8n_metadata": webhook_data.metadata,
                    },
                )

                # Send AI response via WebSocket
                if websocket_manager.is_user_connected(webhook_data.user_id):
                    await websocket_manager.send_ai_response(webhook_data.conversation_id, ai_message, webhook_data.user_id)

                logger.info(
                    "AI message created from webhook",
                    message_id=ai_message["id"],
                    conversation_id=webhook_data.conversation_id,
                )

            except Exception as e:
                logger.error("Failed to create AI message from webhook", execution_id=webhook_data.execution_id, error=str(e))

        # Send system notification for non-conversation workflows
        else:
            if websocket_manager.is_user_connected(webhook_data.user_id):
                await websocket_manager.send_system_notification(
                    webhook_data.user_id,
                    {
                        "type": "workflow_completed",
                        "workflow_type": webhook_data.workflow_type.value,
                        "execution_id": webhook_data.execution_id,
                        "result": response_text,
                        "processing_time": webhook_data.processing_time,
                    },
                )

    except Exception as e:
        logger.error("Failed to handle successful execution", execution_id=webhook_data.execution_id, error=str(e))


async def handle_failed_execution(webhook_data: N8NWebhookData):
    """Handle failed N8N execution"""
    try:
        error_message = webhook_data.error or "Workflow execution failed"

        # Send error notification via WebSocket
        if websocket_manager.is_user_connected(webhook_data.user_id):
            await websocket_manager.send_error_message(
                webhook_data.user_id,
                f"Workflow {webhook_data.workflow_type.value} failed: {error_message}",
                webhook_data.conversation_id,
            )

        logger.warning(
            "Workflow execution failed",
            workflow_type=webhook_data.workflow_type.value,
            execution_id=webhook_data.execution_id,
            error=error_message,
        )

    except Exception as e:
        logger.error("Failed to handle failed execution", execution_id=webhook_data.execution_id, error=str(e))


# Health check for webhooks
@router.get("/n8n/health")
async def webhook_health():
    """Webhook endpoint health check"""
    return {
        "status": "healthy",
        "message": "N8N webhook endpoints are operational",
        "timestamp": datetime.utcnow().isoformat(),
        "signature_verification": bool(settings.N8N_WEBHOOK_SECRET),
    }
