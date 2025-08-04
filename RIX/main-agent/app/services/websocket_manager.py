"""
WebSocket manager for real-time communication in RIX Main Agent
"""

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger
from app.models.chat import TypingIndicator, WebSocketMessage
from fastapi import WebSocket, WebSocketDisconnect

logger = get_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections"""

    def __init__(self):
        # Active connections: user_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Connection metadata: user_id -> connection info
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept new WebSocket connection"""
        await websocket.accept()

        # Close existing connection if any
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].close()
            except Exception as e:
                # Log the error but continue - the connection might already be closed
                logger.warning(f"Error closing existing WebSocket connection for user {user_id}: {e}")

        self.active_connections[user_id] = websocket
        self.connection_metadata[user_id] = {"connected_at": datetime.utcnow(), "last_activity": datetime.utcnow()}

        logger.info("WebSocket connection established", user_id=user_id)

        # Send welcome message
        await self.send_personal_message(
            json.dumps(
                {
                    "type": "connection_established",
                    "data": {"message": "Connected to RIX Main Agent", "timestamp": datetime.utcnow().isoformat()},
                }
            ),
            user_id,
        )

    def disconnect(self, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]

        if user_id in self.connection_metadata:
            del self.connection_metadata[user_id]

        logger.info("WebSocket connection closed", user_id=user_id)

    async def send_personal_message(self, message: str, user_id: str):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                await websocket.send_text(message)

                # Update last activity
                if user_id in self.connection_metadata:
                    self.connection_metadata[user_id]["last_activity"] = datetime.utcnow()

            except Exception as e:
                logger.error("Failed to send WebSocket message", user_id=user_id, error=str(e))
                # Clean up broken connection
                self.disconnect(user_id)

    async def send_json_message(self, data: Dict[str, Any], user_id: str):
        """Send JSON message to specific user"""
        try:
            message = json.dumps(data, default=str)
            await self.send_personal_message(message, user_id)
        except Exception as e:
            logger.error("Failed to serialize WebSocket message", user_id=user_id, error=str(e))

    async def broadcast_message(self, message: str):
        """Broadcast message to all connected users"""
        disconnected_users = []

        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error("Failed to broadcast to user", user_id=user_id, error=str(e))
                disconnected_users.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)

    def get_active_users(self) -> List[str]:
        """Get list of active user IDs"""
        return list(self.active_connections.keys())

    def is_user_connected(self, user_id: str) -> bool:
        """Check if user is connected"""
        return user_id in self.active_connections

    def get_connection_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get connection metadata for user"""
        return self.connection_metadata.get(user_id)


class WebSocketManager:
    """High-level WebSocket management with message handling"""

    def __init__(self):
        self.connection_manager = ConnectionManager()

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect user WebSocket"""
        await self.connection_manager.connect(websocket, user_id)

    def disconnect(self, user_id: str):
        """Disconnect user WebSocket"""
        self.connection_manager.disconnect(user_id)

    async def send_message_update(self, conversation_id: str, message_data: Dict[str, Any], user_id: str):
        """Send new message update to user"""
        ws_message = WebSocketMessage(
            type="message_update", data={"conversation_id": conversation_id, "message": message_data}
        )

        await self.connection_manager.send_json_message(ws_message.dict(), user_id)
        logger.info("Sent message update", user_id=user_id, conversation_id=conversation_id)

    async def send_ai_response(self, conversation_id: str, response_data: Dict[str, Any], user_id: str):
        """Send AI response to user"""
        ws_message = WebSocketMessage(type="ai_response", data={"conversation_id": conversation_id, "response": response_data})

        await self.connection_manager.send_json_message(ws_message.dict(), user_id)
        logger.info("Sent AI response", user_id=user_id, conversation_id=conversation_id)

    async def send_typing_indicator(self, typing_data: TypingIndicator):
        """Send typing indicator to user"""
        ws_message = WebSocketMessage(type="typing_indicator", data=typing_data.dict())

        await self.connection_manager.send_json_message(ws_message.dict(), typing_data.user_id)

    async def send_processing_status(
        self, user_id: str, conversation_id: str, status: str, metadata: Optional[Dict[str, Any]] = None
    ):
        """Send AI processing status update"""
        ws_message = WebSocketMessage(
            type="processing_status", data={"conversation_id": conversation_id, "status": status, "metadata": metadata or {}}
        )

        await self.connection_manager.send_json_message(ws_message.dict(), user_id)
        logger.info("Sent processing status", user_id=user_id, status=status)

    async def send_error_message(self, user_id: str, error_message: str, conversation_id: Optional[str] = None):
        """Send error message to user"""
        ws_message = WebSocketMessage(type="error", data={"message": error_message, "conversation_id": conversation_id})

        await self.connection_manager.send_json_message(ws_message.dict(), user_id)
        logger.info("Sent error message", user_id=user_id)

    async def send_system_notification(self, user_id: str, notification: Dict[str, Any]):
        """Send system notification to user"""
        ws_message = WebSocketMessage(type="system_notification", data=notification)

        await self.connection_manager.send_json_message(ws_message.dict(), user_id)
        logger.info("Sent system notification", user_id=user_id)

    async def broadcast_system_message(self, message: str):
        """Broadcast system message to all users"""
        ws_message = WebSocketMessage(type="system_broadcast", data={"message": message})

        await self.connection_manager.broadcast_message(json.dumps(ws_message.dict(), default=str))
        logger.info("Broadcast system message")

    # Connection management
    def get_active_users(self) -> List[str]:
        """Get list of active user IDs"""
        return self.connection_manager.get_active_users()

    def is_user_connected(self, user_id: str) -> bool:
        """Check if user is connected"""
        return self.connection_manager.is_user_connected(user_id)

    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        active_users = self.get_active_users()
        connection_info = {}

        for user_id in active_users:
            info = self.connection_manager.get_connection_info(user_id)
            if info:
                connection_info[user_id] = info

        return {"total_connections": len(active_users), "active_users": active_users, "connections": connection_info}


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
