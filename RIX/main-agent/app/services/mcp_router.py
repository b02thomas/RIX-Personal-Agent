# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/mcp_router.py
# Future MCP router for connecting to n8n Sub-Agent workflows
# Currently stub implementation - will route to direct APIs until Sub-Agents are ready
# RELEVANT FILES: core/config.py, services/core_apis.py, api/endpoints/*

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import httpx
from app.core.config import settings
from app.core.database import log_mcp_interaction

logger = logging.getLogger(__name__)


class MCPRouter:
    """
    MCP (Model Context Protocol) router for future Sub-Agent integration

    This service will route requests between the Main Agent and n8n Sub-Agent workflows.
    Currently provides stub implementation that falls back to direct APIs.
    When Sub-Agent workflows are ready, this will handle:
    - Request routing to appropriate Sub-Agent endpoints
    - Response format normalization
    - Error handling and fallback logic
    - Logging and monitoring of MCP interactions
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.client = httpx.AsyncClient(timeout=30.0)

        # MCP endpoint configuration (from settings)
        self.mcp_endpoints = {
            # Core Sub-Agent workflows
            "task": settings.MCP_TASK_ENDPOINT,
            "calendar": settings.MCP_CALENDAR_ENDPOINT,
            "chat": settings.MCP_CHAT_ENDPOINT,
            "briefing": settings.MCP_BRIEFING_ENDPOINT,
            "news": settings.MCP_NEWS_ENDPOINT,
            "voice": settings.MCP_VOICE_ENDPOINT,
            "analytics": settings.MCP_ANALYTICS_ENDPOINT,
            "notifications": settings.MCP_NOTIFICATIONS_ENDPOINT,
            "project": settings.MCP_PROJECT_ENDPOINT,
            # Intelligence Sub-Agent workflows (7 future workflows)
            "routine_coaching": settings.MCP_ROUTINE_COACHING_ENDPOINT,
            "project_intelligence": settings.MCP_PROJECT_INTELLIGENCE_ENDPOINT,
            "calendar_optimization": settings.MCP_CALENDAR_OPTIMIZATION_ENDPOINT,
            "behavioral_analytics": settings.MCP_BEHAVIORAL_ANALYTICS_ENDPOINT,
            "knowledge_intelligence": settings.MCP_KNOWLEDGE_INTELLIGENCE_ENDPOINT,
            "goal_intelligence": settings.MCP_GOAL_INTELLIGENCE_ENDPOINT,
            "daily_intelligence": settings.MCP_DAILY_INTELLIGENCE_ENDPOINT,
        }

        # Mode: 'direct' uses core APIs, 'mcp' routes to Sub-Agents
        self.mode = getattr(settings, "INTELLIGENCE_MODE", "direct")

    async def route_request(
        self, user_id: str, sub_agent_type: str, action: str, payload: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Route request to appropriate Sub-Agent or direct API

        Args:
            user_id: User identifier
            sub_agent_type: Type of Sub-Agent (task, calendar, routine, etc.)
            action: Action to perform
            payload: Request payload
            context: Additional context metadata

        Returns:
            Normalized response from Sub-Agent or direct API
        """
        start_time = datetime.now()

        try:
            if self.mode == "mcp" and sub_agent_type in self.mcp_endpoints:
                # Route to MCP Sub-Agent (future implementation)
                response = await self._route_to_mcp_subagent(user_id, sub_agent_type, action, payload, context)
            else:
                # Fallback to direct API (current implementation)
                response = await self._route_to_direct_api(user_id, sub_agent_type, action, payload, context)

            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

            # Log interaction
            await log_mcp_interaction(
                user_id=user_id,
                sub_agent_type=sub_agent_type,
                endpoint=f"/{sub_agent_type}/{action}",
                request_payload=payload,
                response_payload=response,
                processing_time_ms=processing_time,
                context_metadata=context or {},
            )

            return response

        except Exception as e:
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

            # Log error
            await log_mcp_interaction(
                user_id=user_id,
                sub_agent_type=sub_agent_type,
                endpoint=f"/{sub_agent_type}/{action}",
                request_payload=payload,
                response_payload=None,
                processing_time_ms=processing_time,
                status_code=500,
                error_message=str(e),
                context_metadata=context or {},
            )

            self.logger.error(f"MCP routing error: {e}")
            raise

    async def _route_to_mcp_subagent(
        self, user_id: str, sub_agent_type: str, action: str, payload: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Route request to n8n MCP Sub-Agent (future implementation)

        This method will be implemented when Sub-Agent workflows are ready.
        It will handle:
        - HTTP requests to n8n webhook endpoints
        - Authentication and authorization
        - Request/response format normalization
        - Error handling and retries
        """
        endpoint_path = self.mcp_endpoints.get(sub_agent_type)
        if not endpoint_path:
            raise ValueError(f"Unknown Sub-Agent type: {sub_agent_type}")

        # Build full URL
        full_url = f"{settings.N8N_BASE_URL}{endpoint_path}"

        # Prepare request
        request_data = {
            "user_id": user_id,
            "action": action,
            "payload": payload,
            "context": context or {},
            "timestamp": datetime.now().isoformat(),
            "request_id": str(uuid.uuid4()),
        }

        # Add authentication headers
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "RIX-Main-Agent/1.0",
        }

        if settings.N8N_API_KEY:
            headers["X-API-Key"] = settings.N8N_API_KEY

        if settings.N8N_JWT_TOKEN:
            headers["Authorization"] = f"Bearer {settings.N8N_JWT_TOKEN}"

        try:
            # Make request to Sub-Agent
            response = await self.client.post(full_url, json=request_data, headers=headers)

            response.raise_for_status()
            response_data = response.json()

            # Normalize response format
            return self._normalize_mcp_response(response_data, sub_agent_type, action)

        except httpx.RequestError as e:
            self.logger.error(f"MCP request error: {e}")
            # Fallback to direct API
            return await self._route_to_direct_api(user_id, sub_agent_type, action, payload, context)

        except httpx.HTTPStatusError as e:
            self.logger.error(f"MCP HTTP error: {e.response.status_code}")
            # Fallback to direct API
            return await self._route_to_direct_api(user_id, sub_agent_type, action, payload, context)

    async def _route_to_direct_api(
        self, user_id: str, sub_agent_type: str, action: str, payload: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Route to direct API implementation (current fallback)

        This method routes requests to the direct API services until
        Sub-Agent workflows are implemented.
        """
        from app.services.core_apis import core_api_service
        from app.services.intelligence.behavioral_analytics import behavioral_analytics_service
        from app.services.intelligence.calendar_optimizer import calendar_optimizer_service
        from app.services.intelligence.project_health import project_health_service
        from app.services.intelligence.routine_coach import routine_coaching_service

        try:
            if sub_agent_type == "task":
                return await self._handle_task_actions(user_id, action, payload)
            elif sub_agent_type == "calendar":
                return await self._handle_calendar_actions(user_id, action, payload)
            elif sub_agent_type == "routine":
                return await self._handle_routine_actions(user_id, action, payload)
            elif sub_agent_type == "knowledge":
                return await self._handle_knowledge_actions(user_id, action, payload)
            elif sub_agent_type == "goal":
                return await self._handle_goal_actions(user_id, action, payload)
            elif sub_agent_type == "routine_coaching":
                return await self._handle_routine_coaching(user_id, action, payload)
            elif sub_agent_type == "project_intelligence":
                return await self._handle_project_intelligence(user_id, action, payload)
            elif sub_agent_type == "calendar_optimization":
                return await self._handle_calendar_optimization(user_id, action, payload)
            elif sub_agent_type == "behavioral_analytics":
                return await self._handle_behavioral_analytics(user_id, action, payload)
            else:
                return {"success": False, "error": f"Unknown Sub-Agent type: {sub_agent_type}", "fallback": "direct_api"}
        except Exception as e:
            self.logger.error(f"Direct API routing error: {e}")
            return {"success": False, "error": str(e), "fallback": "direct_api"}

    async def _handle_task_actions(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle task-related actions via direct API"""
        # This is a simplified router - in production, this would be more comprehensive
        return {
            "success": True,
            "data": {"message": f"Task {action} handled via direct API"},
            "sub_agent_type": "task",
            "mode": "direct_api",
        }

    async def _handle_calendar_actions(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle calendar-related actions via direct API"""
        return {
            "success": True,
            "data": {"message": f"Calendar {action} handled via direct API"},
            "sub_agent_type": "calendar",
            "mode": "direct_api",
        }

    async def _handle_routine_actions(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle routine-related actions via direct API"""
        return {
            "success": True,
            "data": {"message": f"Routine {action} handled via direct API"},
            "sub_agent_type": "routine",
            "mode": "direct_api",
        }

    async def _handle_knowledge_actions(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle knowledge-related actions via direct API"""
        return {
            "success": True,
            "data": {"message": f"Knowledge {action} handled via direct API"},
            "sub_agent_type": "knowledge",
            "mode": "direct_api",
        }

    async def _handle_goal_actions(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle goal-related actions via direct API"""
        return {
            "success": True,
            "data": {"message": f"Goal {action} handled via direct API"},
            "sub_agent_type": "goal",
            "mode": "direct_api",
        }

    async def _handle_routine_coaching(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle routine coaching via intelligence service"""
        from app.services.intelligence.routine_coach import routine_coaching_service

        if action == "get_insights":
            routine_id = payload.get("routine_id")
            if not routine_id:
                return {"success": False, "error": "routine_id required"}

            insights = await routine_coaching_service.get_coaching_insights(
                user_id=user_id, routine_id=routine_id, recent_completion=payload.get("recent_completion")
            )
            return {"success": True, "data": insights.dict(), "sub_agent_type": "routine_coaching", "mode": "direct_api"}

        return {"success": False, "error": f"Unknown routine coaching action: {action}"}

    async def _handle_project_intelligence(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle project intelligence via intelligence service"""
        from app.services.intelligence.project_health import project_health_service

        if action == "assess_health":
            project_id = payload.get("project_id")
            if not project_id:
                return {"success": False, "error": "project_id required"}

            assessment = await project_health_service.assess_project_health(user_id=user_id, project_id=project_id)
            return {"success": True, "data": assessment.dict(), "sub_agent_type": "project_intelligence", "mode": "direct_api"}

        return {"success": False, "error": f"Unknown project intelligence action: {action}"}

    async def _handle_calendar_optimization(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle calendar optimization via intelligence service"""
        from app.services.intelligence.calendar_optimizer import calendar_optimizer_service

        if action == "optimize_schedule":
            target_date = payload.get("target_date")
            if not target_date:
                return {"success": False, "error": "target_date required"}

            # Convert string date to date object if needed
            if isinstance(target_date, str):
                from datetime import datetime

                target_date = datetime.fromisoformat(target_date).date()

            optimization = await calendar_optimizer_service.optimize_schedule(
                user_id=user_id, target_date=target_date, preferences=payload.get("preferences", {})
            )
            return {
                "success": True,
                "data": optimization.dict(),
                "sub_agent_type": "calendar_optimization",
                "mode": "direct_api",
            }

        return {"success": False, "error": f"Unknown calendar optimization action: {action}"}

    async def _handle_behavioral_analytics(self, user_id: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle behavioral analytics via intelligence service"""
        from app.services.intelligence.behavioral_analytics import behavioral_analytics_service

        if action == "generate_analysis":
            analysis_period = payload.get("analysis_period", "monthly")

            analysis = await behavioral_analytics_service.generate_comprehensive_analysis(
                user_id=user_id, analysis_period=analysis_period
            )
            return {"success": True, "data": analysis, "sub_agent_type": "behavioral_analytics", "mode": "direct_api"}
        elif action == "analyze_correlations":
            days = payload.get("days", 30)

            correlations = await behavioral_analytics_service.analyze_productivity_correlations(user_id=user_id, days=days)
            return {"success": True, "data": correlations, "sub_agent_type": "behavioral_analytics", "mode": "direct_api"}

        return {"success": False, "error": f"Unknown behavioral analytics action: {action}"}

    def _normalize_mcp_response(self, response_data: Dict[str, Any], sub_agent_type: str, action: str) -> Dict[str, Any]:
        """
        Normalize MCP Sub-Agent response to standard format

        This ensures consistent response format regardless of which Sub-Agent
        processes the request.
        """
        # Standard response format for all Sub-Agents
        normalized = {
            "success": response_data.get("success", True),
            "data": response_data.get("data", {}),
            "sub_agent_type": sub_agent_type,
            "action": action,
            "mode": "mcp",
            "timestamp": datetime.now().isoformat(),
        }

        # Add optional fields if present
        if "insights" in response_data:
            normalized["insights"] = response_data["insights"]

        if "recommendations" in response_data:
            normalized["recommendations"] = response_data["recommendations"]

        if "confidence_score" in response_data:
            normalized["confidence_score"] = response_data["confidence_score"]

        if "processing_time_ms" in response_data:
            normalized["processing_time_ms"] = response_data["processing_time_ms"]

        if "error" in response_data:
            normalized["error"] = response_data["error"]

        return normalized

    async def health_check(self) -> Dict[str, Any]:
        """Check health of MCP routing system"""
        health_info = {
            "status": "healthy",
            "mode": self.mode,
            "configured_endpoints": len(self.mcp_endpoints),
            "available_sub_agents": list(self.mcp_endpoints.keys()),
            "timestamp": datetime.now().isoformat(),
        }

        if self.mode == "mcp":
            # Test connectivity to n8n base URL
            try:
                response = await self.client.get(f"{settings.N8N_BASE_URL}/health", timeout=5.0)
                health_info["n8n_connectivity"] = "connected" if response.status_code == 200 else "degraded"
            except Exception as e:
                health_info["n8n_connectivity"] = "disconnected"
                health_info["n8n_error"] = str(e)
        else:
            health_info["n8n_connectivity"] = "not_applicable"

        return health_info

    async def switch_mode(self, new_mode: str) -> bool:
        """
        Switch between direct API and MCP modes

        Args:
            new_mode: 'direct' or 'mcp'

        Returns:
            True if switch successful
        """
        if new_mode not in ["direct", "mcp"]:
            raise ValueError("Mode must be 'direct' or 'mcp'")

        old_mode = self.mode
        self.mode = new_mode

        self.logger.info(f"MCP Router mode switched from {old_mode} to {new_mode}")
        return True

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global router instance
mcp_router = MCPRouter()
