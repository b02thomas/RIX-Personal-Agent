"""
/Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/workflow_manager.py
Enhanced N8N workflow management service for Phase 6 integration
Manages workflow discovery, activation, and AI-triggered execution
RELEVANT FILES: n8n_client.py, database.py, ai_workflow_intelligence.py, n8n.py
"""

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from app.core.logging import get_logger
from app.models.chat import WorkflowType
from app.models.n8n import (
    N8NWorkflowInfo,
    WorkflowActivationResponse,
    WorkflowCategoryInfo,
    WorkflowPerformanceMetrics,
    WorkflowSyncResponse,
)
from app.services.ai_workflow_intelligence import ai_workflow_intelligence
from app.services.database import database
from app.services.n8n_client import n8n_client

logger = get_logger(__name__)


class WorkflowManager:
    """Enhanced N8N workflow management service"""

    def __init__(self):
        self.sync_in_progress = False
        self.last_sync_time: Optional[datetime] = None
        self.workflow_cache: Dict[str, N8NWorkflowInfo] = {}
        self.category_cache: Dict[str, List[N8NWorkflowInfo]] = {}

        # Workflow categorization rules
        self.categorization_rules = {
            "productivity": [
                "task",
                "calendar",
                "schedule",
                "project",
                "deadline",
                "todo",
                "planning",
                "organize",
                "management",
            ],
            "communication": ["chat", "message", "email", "notification", "alert", "conversation", "voice", "speech", "talk"],
            "intelligence": [
                "news",
                "brief",
                "analysis",
                "insight",
                "learn",
                "routine",
                "coaching",
                "optimization",
                "smart",
                "ai",
            ],
            "automation": ["automation", "trigger", "webhook", "integration", "sync", "connect", "api", "workflow"],
            "analytics": ["analytics", "metrics", "report", "dashboard", "data", "statistics", "performance", "tracking"],
        }

    async def discover_and_sync_workflows(self, force_refresh: bool = False) -> WorkflowSyncResponse:
        """Discover workflows from N8N and sync with database"""
        logger.info("Starting workflow discovery and sync", force_refresh=force_refresh)

        if self.sync_in_progress:
            logger.warning("Workflow sync already in progress")
            return WorkflowSyncResponse(
                synced_count=0, updated_count=0, new_count=0, categories=[], success=False, message="Sync already in progress"
            )

        self.sync_in_progress = True

        try:
            # Get existing workflows from database
            existing_workflows = await database.get_workflows_by_category(active_only=False)
            existing_ids = {w["id"] for w in existing_workflows}

            # Discover workflows from N8N
            discovered_workflows = await n8n_client.discover_workflows()

            synced_count = 0
            updated_count = 0
            new_count = 0
            categories = set()

            for workflow in discovered_workflows:
                try:
                    # Categorize workflow
                    category = self._categorize_workflow(workflow)
                    categories.add(category)

                    # Generate workflow description
                    description = self._generate_workflow_description(workflow, category)

                    # Store/update workflow metadata
                    stored_workflow = await database.store_workflow_metadata(
                        workflow_id=workflow.id,
                        name=workflow.name,
                        active=workflow.active,
                        description=description,
                        category=category,
                        workflow_type=self._normalize_workflow_type(workflow.name),
                        tags=workflow.tags + [category],
                        version=workflow.version,
                        metadata={
                            "n8n_created_at": workflow.created_at.isoformat(),
                            "n8n_updated_at": workflow.updated_at.isoformat(),
                            "discovery_timestamp": datetime.utcnow().isoformat(),
                            "auto_categorized": True,
                        },
                    )

                    # Update cache
                    self.workflow_cache[workflow.id] = workflow

                    if workflow.id in existing_ids:
                        updated_count += 1
                    else:
                        new_count += 1

                    synced_count += 1

                    logger.debug("Workflow synced", workflow_id=workflow.id, name=workflow.name, category=category)

                except Exception as e:
                    logger.error("Failed to sync individual workflow", workflow_id=workflow.id, error=str(e))

            # Update category cache
            await self._update_category_cache()

            self.last_sync_time = datetime.utcnow()

            logger.info(
                "Workflow sync completed",
                synced_count=synced_count,
                new_count=new_count,
                updated_count=updated_count,
                categories=len(categories),
            )

            return WorkflowSyncResponse(
                synced_count=synced_count,
                updated_count=updated_count,
                new_count=new_count,
                categories=list(categories),
                success=True,
                message=f"Successfully synced {synced_count} workflows ({new_count} new, {updated_count} updated)",
            )

        except Exception as e:
            logger.error("Workflow sync failed", error=str(e))
            return WorkflowSyncResponse(
                synced_count=0, updated_count=0, new_count=0, categories=[], success=False, message=f"Sync failed: {str(e)}"
            )
        finally:
            self.sync_in_progress = False

    def _categorize_workflow(self, workflow: N8NWorkflowInfo) -> str:
        """Categorize workflow based on name, tags, and content"""
        workflow_text = f"{workflow.name} {' '.join(workflow.tags)}".lower()

        # Score each category
        category_scores = {}
        for category, keywords in self.categorization_rules.items():
            score = sum(1 for keyword in keywords if keyword in workflow_text)
            if score > 0:
                category_scores[category] = score

        # Return category with highest score, default to "general"
        if category_scores:
            return max(category_scores, key=category_scores.get)

        return "general"

    def _generate_workflow_description(self, workflow: N8NWorkflowInfo, category: str) -> str:
        """Generate a descriptive text for the workflow"""
        base_description = f"N8N workflow: {workflow.name}"

        category_descriptions = {
            "productivity": "Enhances productivity and task management",
            "communication": "Handles communication and messaging",
            "intelligence": "Provides AI-powered insights and analysis",
            "automation": "Automates processes and integrations",
            "analytics": "Generates analytics and reporting",
            "general": "General purpose workflow",
        }

        category_desc = category_descriptions.get(category, "General workflow")

        tags_desc = ""
        if workflow.tags:
            tags_desc = f" Tags: {', '.join(workflow.tags[:3])}"

        return f"{base_description}. {category_desc}.{tags_desc}"

    def _normalize_workflow_type(self, workflow_name: str) -> str:
        """Normalize workflow name to a consistent type identifier"""
        return workflow_name.lower().replace(" ", "-").replace("_", "-")

    async def _update_category_cache(self):
        """Update the category cache with latest workflows"""
        try:
            self.category_cache.clear()

            # Get all workflows by category
            all_workflows = await database.get_workflows_by_category(active_only=False)

            for workflow in all_workflows:
                category = workflow.get("category", "general")
                if category not in self.category_cache:
                    self.category_cache[category] = []

                # Convert to N8NWorkflowInfo for consistency
                workflow_info = N8NWorkflowInfo(
                    id=workflow["id"],
                    name=workflow["name"],
                    active=workflow["active"],
                    tags=workflow.get("tags", []),
                    created_at=workflow["created_at"],
                    updated_at=workflow["updated_at"],
                    version=workflow.get("version", "1.0.0"),
                )

                self.category_cache[category].append(workflow_info)

        except Exception as e:
            logger.error("Failed to update category cache", error=str(e))

    async def get_workflows_by_category(self, category: str = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get workflows filtered by category"""
        logger.info("Getting workflows by category", category=category, active_only=active_only)

        try:
            workflows = await database.get_workflows_by_category(category, active_only)

            # Enrich with performance metrics
            enriched_workflows = []
            for workflow in workflows:
                enriched_workflow = dict(workflow)

                # Add performance metrics
                enriched_workflow["performance"] = {
                    "execution_count": workflow.get("execution_count", 0),
                    "ai_triggered_count": workflow.get("ai_triggered_count", 0),
                    "success_rate": workflow.get("success_rate", 0.0),
                    "average_execution_time": workflow.get("average_execution_time", 0.0),
                    "last_execution_at": workflow.get("last_execution_at"),
                }

                # Add AI trigger percentage
                total_executions = workflow.get("execution_count", 0)
                ai_executions = workflow.get("ai_triggered_count", 0)
                enriched_workflow["ai_trigger_percentage"] = (
                    (ai_executions / max(total_executions, 1)) * 100 if total_executions > 0 else 0
                )

                enriched_workflows.append(enriched_workflow)

            return enriched_workflows

        except Exception as e:
            logger.error("Failed to get workflows by category", category=category, error=str(e))
            return []

    async def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status"""
        return {
            "sync_in_progress": self.sync_in_progress,
            "last_sync_time": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "cached_workflows": len(self.workflow_cache),
            "cached_categories": len(self.category_cache),
        }


# Global workflow manager instance
workflow_manager = WorkflowManager()
